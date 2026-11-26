/**
 * ElevenLabs TTS Adapter (`elevenlabs`) for Kok Iso Yo? TTS Gateway.
 *
 * - Pure Node.js `fetch` REST client (`POST /v1/text-to-speech/:voice_id/with-timestamps`).
 * - Decodes base64 audio + converts native character-level alignment into `words.json` (`[{ s, e, w }]`).
 * - Supports `mp3` (native `mp3_44100_128`) and `wav` (`pcm_44100` wrapped into standard RIFF/WAV header).
 * - Zero npm dependencies; zero secret leakage.
 * - Commercial eligibility: `commercialEligible: true` (requires paid commercial tier in `final` mode).
 */

import { loadEnvFile } from "../../ai-gateway/config.mjs";
import { TTS_PROVIDERS } from "../config.mjs";
import {
  TTSConfigError,
  TTSProviderUnavailableError,
  TTSTimeoutError,
  classifyHttpTtsError,
} from "../errors.mjs";
import { redactTTSText } from "../redact.mjs";
import { convertCharAlignmentToWords } from "../timingConverter.mjs";

const DEFAULT_BASE_URL = "https://api.elevenlabs.io";
const DEFAULT_MODEL = "eleven_multilingual_v2";
const PROVIDER_VERSION = "elevenlabs-rest-v1";
const DEFAULT_USD_PER_1K_CHARS = 0.1818; // Creator plan ($22 / 121,000 credits) reference
const SAFE_VOICE_ID_RE = /^[a-zA-Z0-9_-]{4,64}$/;

/**
 * Wraps raw signed 16-bit little-endian mono PCM into a standard 44-byte RIFF/WAV buffer.
 */
export function wrapPcm16MonoToWav(pcmBuffer, sampleRate = 44_100) {
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * channels * 16/8)
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

function readVar(env, fileVars, overrides, keys, overrideKey) {
  if (overrideKey && overrides[overrideKey] !== undefined && overrides[overrideKey] !== null) {
    return String(overrides[overrideKey]).trim();
  }
  const list = Array.isArray(keys) ? keys : [keys];
  for (const k of list) {
    if (env[k] !== undefined && env[k] !== "") return String(env[k]).trim();
  }
  for (const k of list) {
    if (fileVars[k] !== undefined && fileVars[k] !== "") return String(fileVars[k]).trim();
  }
  return "";
}

function parseRateToSpeed(rate) {
  const m = String(rate || "").trim().match(/^([+-]?\d+(?:\.\d+)?)%$/);
  if (!m) return 1.0;
  const pct = Number(m[1]);
  if (!Number.isFinite(pct)) return 1.0;
  // ElevenLabs speed range: 0.7 - 1.2
  return Number(Math.min(1.2, Math.max(0.7, 1 + pct / 100)).toFixed(2));
}

export function createElevenLabsAdapter(options = {}) {
  const env = options.env ?? process.env;
  const envFile = options.envFile ?? env.TTS_ENV_FILE ?? env.AI_GATEWAY_ENV_FILE ?? "";
  const fileVars = envFile ? loadEnvFile(envFile) : {};
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  const apiKey = readVar(env, fileVars, options, ["ELEVENLABS_API_KEY"], "apiKey");
  const defaultVoice = readVar(
    env,
    fileVars,
    options,
    ["ELEVENLABS_VOICE_ID", "ELEVENLABS_VOICE"],
    "defaultVoice"
  );
  const defaultModel =
    readVar(env, fileVars, options, ["ELEVENLABS_MODEL_ID", "ELEVENLABS_MODEL"], "defaultModel") ||
    DEFAULT_MODEL;
  const baseUrl = (
    readVar(env, fileVars, options, ["ELEVENLABS_BASE_URL"], "baseUrl") || DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const mp3Format =
    readVar(env, fileVars, options, ["ELEVENLABS_OUTPUT_FORMAT_MP3"], "mp3Format") ||
    "mp3_44100_128";
  const wavFormat =
    readVar(env, fileVars, options, ["ELEVENLABS_OUTPUT_FORMAT_WAV"], "wavFormat") || "pcm_44100";

  const rawRateUsd = readVar(
    env,
    fileVars,
    options,
    ["ELEVENLABS_USD_PER_1K_CHARS"],
    "usdPer1kChars"
  );
  const usdPer1kChars =
    rawRateUsd && Number.isFinite(Number(rawRateUsd)) && Number(rawRateUsd) >= 0
      ? Number(rawRateUsd)
      : DEFAULT_USD_PER_1K_CHARS;

  const secrets = apiKey ? [apiKey] : [];

  function getCapabilities() {
    return {
      provider: TTS_PROVIDERS.ELEVENLABS,
      commercialEligible: true,
      supportsWordTimestamps: true,
      supportedFormats: ["mp3", "wav"],
      defaultVoice: defaultVoice || "",
      defaultModel,
      providerVersion: PROVIDER_VERSION,
      maxCharsPerRequest: 5_000,
    };
  }

  function validateConfig() {
    const errors = [];
    if (!apiKey) {
      errors.push("Missing ELEVENLABS_API_KEY.");
    }
    if (!defaultVoice) {
      errors.push("Missing ELEVENLABS_VOICE_ID.");
    } else if (!SAFE_VOICE_ID_RE.test(defaultVoice)) {
      errors.push("Invalid ELEVENLABS_VOICE_ID format.");
    }
    try {
      const parsed = new URL(baseUrl);
      if (parsed.protocol !== "https:") {
        errors.push("ELEVENLABS_BASE_URL must use https://.");
      }
    } catch {
      errors.push("ELEVENLABS_BASE_URL is not a valid URL.");
    }
    if (typeof fetchImpl !== "function") {
      errors.push("Global fetch implementation is unavailable.");
    }
    return { ok: errors.length === 0, errors };
  }

  function estimateCost(charCount = 0) {
    const chars = Math.max(0, Number(charCount) || 0);
    const usd = Number(((chars / 1_000) * usdPer1kChars).toFixed(6));
    return {
      estimatedCostUsd: usd,
      basis: `elevenlabs_${usdPer1kChars}_usd_per_1k_chars`,
      chars,
    };
  }

  async function synthesize({
    text,
    voice = defaultVoice,
    model = defaultModel,
    rate = "+0%",
    prosody = null,
    outputFormat = "mp3",
    timeoutMs = 45_000,
    signal = undefined,
    requestId = "",
  }) {
    const cfgCheck = validateConfig();
    if (!cfgCheck.ok) {
      throw new TTSConfigError(cfgCheck.errors.join("; "), {
        provider: TTS_PROVIDERS.ELEVENLABS,
      });
    }

    const resolvedVoice = String(voice || defaultVoice).trim();
    if (!SAFE_VOICE_ID_RE.test(resolvedVoice)) {
      throw new TTSConfigError("Invalid ElevenLabs voice ID.", {
        provider: TTS_PROVIDERS.ELEVENLABS,
      });
    }

    const resolvedModel = String(model || defaultModel).trim();
    const fmt = String(outputFormat || "mp3").trim().toLowerCase();
    const elFormat = fmt === "wav" ? wavFormat : mp3Format;
    const url = `${baseUrl}/v1/text-to-speech/${encodeURIComponent(
      resolvedVoice
    )}/with-timestamps?output_format=${encodeURIComponent(elFormat)}`;

    const voiceSettings = {
      stability: Number(prosody?.stability ?? 0.5),
      similarity_boost: Number(prosody?.similarityBoost ?? 0.75),
      style: Number(prosody?.style ?? 0.0),
      use_speaker_boost: prosody?.useSpeakerBoost !== undefined ? Boolean(prosody.useSpeakerBoost) : true,
      speed: Number(prosody?.speed ?? parseRateToSpeed(rate)),
    };

    const payload = {
      text,
      model_id: resolvedModel,
      voice_settings: voiceSettings,
    };

    let response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err) {
      if (signal?.aborted || err?.name === "AbortError") {
        throw new TTSTimeoutError(`ElevenLabs request aborted/timed out after ${timeoutMs}ms.`, {
          provider: TTS_PROVIDERS.ELEVENLABS,
          timeoutMs,
          requestId,
        });
      }
      throw new TTSProviderUnavailableError(
        `ElevenLabs network error: ${redactTTSText(err?.message || String(err), secrets)}`,
        {
          provider: TTS_PROVIDERS.ELEVENLABS,
          status: 0,
          retryable: true,
          requestId,
        }
      );
    }

    const respRequestId = response.headers?.get?.("request-id") || requestId;

    if (!response.ok) {
      let bodyText = "";
      try {
        bodyText = await response.text();
      } catch {
        bodyText = "";
      }
      throw classifyHttpTtsError({
        status: response.status,
        provider: TTS_PROVIDERS.ELEVENLABS,
        bodyPreview: bodyText,
        retryAfterHeader: response.headers?.get?.("retry-after") ?? null,
        requestId: respRequestId,
        secrets,
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new TTSProviderUnavailableError(
        `ElevenLabs returned invalid JSON: ${redactTTSText(err?.message || String(err), secrets)}`,
        {
          provider: TTS_PROVIDERS.ELEVENLABS,
          status: response.status,
          retryable: true,
          requestId: respRequestId,
        }
      );
    }

    if (!data || typeof data.audio_base64 !== "string" || !data.audio_base64.trim()) {
      throw new TTSProviderUnavailableError("ElevenLabs response missing audio_base64.", {
        provider: TTS_PROVIDERS.ELEVENLABS,
        status: response.status,
        retryable: true,
        requestId: respRequestId,
      });
    }

    const rawBytes = Buffer.from(data.audio_base64, "base64");
    const audioBuffer = fmt === "wav" ? wrapPcm16MonoToWav(rawBytes, 44_100) : rawBytes;
    const alignment = data.normalized_alignment || data.alignment || null;
    const words = alignment ? convertCharAlignmentToWords(alignment) : null;

    return {
      audioBuffer,
      words: words && words.length > 0 ? words : null,
      voice: resolvedVoice,
      model: resolvedModel,
      providerMeta: {
        outputFormat: elFormat,
        elevenLabsRequestId: respRequestId || null,
        wordCount: words ? words.length : 0,
        timestampsSource: words && words.length > 0 ? "elevenlabs_char_alignment" : "none",
      },
    };
  }

  return {
    getCapabilities,
    validateConfig,
    estimateCost,
    synthesize,
  };
}
