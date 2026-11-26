/**
 * Azure AI Speech TTS Adapter (`azure_speech`) for Kok Iso Yo? TTS Gateway.
 *
 * - Pure Node.js `fetch` REST client (`POST https://<region>.tts.speech.microsoft.com/cognitiveservices/v1`).
 * - Zero npm dependencies; zero secret leakage.
 * - Commercial eligibility: `commercialEligible: true` (requires paid `S0` / commercial account tier in `final` mode).
 * - Word timestamps: REST API does not emit WordBoundary events (`supportsWordTimestamps: false`);
 *   `templates/audio-py/mix_audio.py` automatically falls back to envelope-VAD ducking.
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

const REGION_RE = /^[a-z0-9-]+$/i;
const DEFAULT_VOICE = "id-ID-ArdiNeural";
const DEFAULT_MODEL = "azure-neural-v1";
const PROVIDER_VERSION = "azure-rest-v1";
const AZURE_NEURAL_USD_PER_1M_CHARS = 15.0;

const OUTPUT_FORMAT_HEADERS = Object.freeze({
  mp3: "audio-48khz-192kbitrate-mono-mp3",
  wav: "riff-48khz-16bit-mono-pcm",
});

export function escapeXml(raw) {
  return String(raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeXmlAttr(raw, fallback = "") {
  const s = String(raw ?? "").trim();
  if (!s) return fallback;
  return escapeXml(s.replace(/[\r\n\t]+/g, " "));
}

/**
 * Builds valid, injection-safe SSML for Azure AI Speech REST synthesis.
 */
export function buildAzureSsml({
  text,
  language = "id-ID",
  voice = DEFAULT_VOICE,
  rate = "+0%",
  pitch = "+0Hz",
  prosody = null,
}) {
  const safeLang = sanitizeXmlAttr(language, "id-ID");
  const safeVoice = sanitizeXmlAttr(voice, DEFAULT_VOICE);
  const safeRate = sanitizeXmlAttr(prosody?.rate ?? rate, "+0%");
  const safePitch = sanitizeXmlAttr(prosody?.pitch ?? pitch, "+0Hz");
  const escapedBody = escapeXml(text);

  const prosodyBlock = `<prosody rate="${safeRate}" pitch="${safePitch}">${escapedBody}</prosody>`;

  const style = prosody?.style ? sanitizeXmlAttr(prosody.style, "") : "";
  const styleDegree =
    prosody?.styleDegree !== undefined && Number.isFinite(Number(prosody.styleDegree))
      ? ` styledegree="${Number(prosody.styleDegree).toFixed(2)}"`
      : "";

  if (style) {
    return (
      `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
      `xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${safeLang}">` +
      `<voice name="${safeVoice}">` +
      `<mstts:express-as style="${style}"${styleDegree}>${prosodyBlock}</mstts:express-as>` +
      `</voice></speak>`
    );
  }

  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${safeLang}">` +
    `<voice name="${safeVoice}">${prosodyBlock}</voice></speak>`
  );
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

export function createAzureSpeechAdapter(options = {}) {
  const env = options.env ?? process.env;
  const envFile = options.envFile ?? env.TTS_ENV_FILE ?? env.AI_GATEWAY_ENV_FILE ?? "";
  const fileVars = envFile ? loadEnvFile(envFile) : {};
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  const apiKey = readVar(env, fileVars, options, ["AZURE_SPEECH_KEY", "AZURE_TTS_KEY"], "apiKey");
  const region = readVar(
    env,
    fileVars,
    options,
    ["AZURE_SPEECH_REGION", "AZURE_TTS_REGION"],
    "region"
  );
  const endpointOverride = readVar(
    env,
    fileVars,
    options,
    ["AZURE_SPEECH_ENDPOINT"],
    "endpoint"
  );
  const defaultVoice =
    readVar(env, fileVars, options, ["AZURE_SPEECH_VOICE", "AZURE_TTS_VOICE"], "defaultVoice") ||
    DEFAULT_VOICE;
  const mp3FormatHeader =
    readVar(env, fileVars, options, ["AZURE_SPEECH_OUTPUT_FORMAT_MP3"], "mp3FormatHeader") ||
    OUTPUT_FORMAT_HEADERS.mp3;
  const wavFormatHeader =
    readVar(env, fileVars, options, ["AZURE_SPEECH_OUTPUT_FORMAT_WAV"], "wavFormatHeader") ||
    OUTPUT_FORMAT_HEADERS.wav;
  const userAgent =
    readVar(env, fileVars, options, ["AZURE_SPEECH_USER_AGENT"], "userAgent") ||
    "KokIsoYoTTSGateway/1.0";

  const secrets = apiKey ? [apiKey] : [];

  function resolveEndpointUrl() {
    if (endpointOverride) {
      let parsed;
      try {
        parsed = new URL(endpointOverride);
      } catch {
        throw new TTSConfigError("Invalid AZURE_SPEECH_ENDPOINT URL.", {
          provider: TTS_PROVIDERS.AZURE_SPEECH,
        });
      }
      if (parsed.protocol !== "https:") {
        throw new TTSConfigError("AZURE_SPEECH_ENDPOINT must use HTTPS.", {
          provider: TTS_PROVIDERS.AZURE_SPEECH,
        });
      }
      return parsed.toString();
    }
    if (!region || !REGION_RE.test(region)) {
      throw new TTSConfigError(
        "AZURE_SPEECH_REGION is missing or invalid (expected e.g. southeastasia).",
        { provider: TTS_PROVIDERS.AZURE_SPEECH }
      );
    }
    return `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  }

  function getCapabilities() {
    return {
      provider: TTS_PROVIDERS.AZURE_SPEECH,
      commercialEligible: true,
      supportsWordTimestamps: false,
      supportedFormats: ["mp3", "wav"],
      defaultVoice,
      defaultModel: DEFAULT_MODEL,
      providerVersion: PROVIDER_VERSION,
      maxCharsPerRequest: 10_000,
    };
  }

  function validateConfig() {
    const errors = [];
    if (!apiKey) {
      errors.push("Missing AZURE_SPEECH_KEY.");
    }
    if (!endpointOverride && (!region || !REGION_RE.test(region))) {
      errors.push("Missing or invalid AZURE_SPEECH_REGION (or AZURE_SPEECH_ENDPOINT).");
    }
    if (endpointOverride) {
      try {
        const u = new URL(endpointOverride);
        if (u.protocol !== "https:") {
          errors.push("AZURE_SPEECH_ENDPOINT must use https://.");
        }
      } catch {
        errors.push("AZURE_SPEECH_ENDPOINT is not a valid URL.");
      }
    }
    if (typeof fetchImpl !== "function") {
      errors.push("Global fetch implementation is unavailable.");
    }
    return { ok: errors.length === 0, errors };
  }

  function estimateCost(charCount = 0) {
    const chars = Math.max(0, Number(charCount) || 0);
    const usd = Number(((chars / 1_000_000) * AZURE_NEURAL_USD_PER_1M_CHARS).toFixed(6));
    return {
      estimatedCostUsd: usd,
      basis: "azure_standard_neural_s0_15_usd_per_1m_chars",
      chars,
    };
  }

  async function synthesize({
    text,
    language = "id-ID",
    voice = defaultVoice,
    model = DEFAULT_MODEL,
    rate = "+0%",
    pitch = "+0Hz",
    prosody = null,
    outputFormat = "mp3",
    timeoutMs = 45_000,
    signal = undefined,
    requestId = "",
  }) {
    const cfgCheck = validateConfig();
    if (!cfgCheck.ok) {
      throw new TTSConfigError(cfgCheck.errors.join("; "), {
        provider: TTS_PROVIDERS.AZURE_SPEECH,
      });
    }

    const fmt = String(outputFormat || "mp3").trim().toLowerCase();
    const outputFormatHeader = fmt === "wav" ? wavFormatHeader : mp3FormatHeader;
    const url = resolveEndpointUrl();
    const resolvedVoice = String(voice || defaultVoice).trim();
    const ssml = buildAzureSsml({
      text,
      language,
      voice: resolvedVoice,
      rate,
      pitch,
      prosody,
    });

    let response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/ssml+xml; charset=utf-8",
          "X-Microsoft-OutputFormat": outputFormatHeader,
          "User-Agent": userAgent,
        },
        body: ssml,
        signal,
      });
    } catch (err) {
      if (signal?.aborted || err?.name === "AbortError") {
        throw new TTSTimeoutError(`Azure Speech request aborted/timed out after ${timeoutMs}ms.`, {
          provider: TTS_PROVIDERS.AZURE_SPEECH,
          timeoutMs,
          requestId,
        });
      }
      throw new TTSProviderUnavailableError(
        `Azure Speech network error: ${redactTTSText(err?.message || String(err), secrets)}`,
        {
          provider: TTS_PROVIDERS.AZURE_SPEECH,
          status: 0,
          retryable: true,
          requestId,
        }
      );
    }

    const respRequestId =
      response.headers?.get?.("x-requestid") ||
      response.headers?.get?.("apim-request-id") ||
      requestId;

    if (!response.ok) {
      let bodyText = "";
      try {
        bodyText = await response.text();
      } catch {
        bodyText = "";
      }
      throw classifyHttpTtsError({
        status: response.status,
        provider: TTS_PROVIDERS.AZURE_SPEECH,
        bodyPreview: bodyText,
        retryAfterHeader: response.headers?.get?.("retry-after") ?? null,
        requestId: respRequestId,
        secrets,
      });
    }

    const arrayBuf = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuf);
    if (audioBuffer.length === 0) {
      throw new TTSProviderUnavailableError("Azure Speech returned empty audio response.", {
        provider: TTS_PROVIDERS.AZURE_SPEECH,
        status: response.status,
        retryable: true,
        requestId: respRequestId,
      });
    }

    return {
      audioBuffer,
      words: null,
      voice: resolvedVoice,
      model: model || DEFAULT_MODEL,
      providerMeta: {
        region: region || "custom",
        outputFormatHeader,
        contentType: response.headers?.get?.("content-type") || null,
        azureRequestId: respRequestId || null,
        timestampsSource: "none_use_envelope_vad",
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
