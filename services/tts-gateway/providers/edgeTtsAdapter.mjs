/**
 * Edge TTS Adapter (`edge_tts`) for Kok Iso Yo? TTS Gateway — DRAFT MODE ONLY.
 *
 * - Invokes local `edge-tts` CLI via safe `execFile` (zero shell interpolation).
 * - Writes text via temp `--file` and passes `--rate=<val>` / `--pitch=<val>` safely.
 * - Produces MP3 audio + converts `--write-subtitles` (.srt/.vtt) to `words.json` (`[{ s, e, w }]`).
 * - Strictly declares `commercialEligible: false` (unofficial consumer endpoint; blocked in `final` mode).
 */

import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnvFile } from "../../ai-gateway/config.mjs";
import { TTS_PROVIDERS } from "../config.mjs";
import {
  TTSConfigError,
  TTSProviderUnavailableError,
  TTSTimeoutError,
} from "../errors.mjs";
import { redactTTSText } from "../redact.mjs";
import { parseVttOrSrtToWords } from "../timingConverter.mjs";

const DEFAULT_VOICE = "id-ID-ArdiNeural";
const DEFAULT_MODEL = "edge-neural-v1";
const PROVIDER_VERSION = "edge-tts-cli-1";
const SAFE_VOICE_RE = /^[a-zA-Z0-9_-]{3,80}$/;
const SAFE_RATE_RE = /^[+-]?\d{1,3}%$/;
const SAFE_PITCH_RE = /^[+-]?\d{1,3}Hz$/;

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

function resolveDefaultEdgeBin(configuredBin, env) {
  if (configuredBin) return configuredBin;
  const home = env.HOME || os.homedir();
  const localUserBin = path.join(home, ".local", "bin", "edge-tts");
  if (fs.existsSync(localUserBin)) {
    return localUserBin;
  }
  return "edge-tts";
}

function isBinaryAvailable(bin, env) {
  if (!bin) return false;
  if (bin.includes("/") || bin.includes("\\")) {
    try {
      fs.accessSync(bin, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  const pathEnv = env.PATH || process.env.PATH || "";
  for (const dir of pathEnv.split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(dir, bin);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch {
      // continue searching PATH
    }
  }
  return false;
}

function defaultExecFile(bin, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(
      bin,
      args,
      {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        killSignal: "SIGKILL",
        ...opts,
      },
      (err, stdout, stderr) => {
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          return reject(err);
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

export function createEdgeTtsAdapter(options = {}) {
  const env = options.env ?? process.env;
  const envFile = options.envFile ?? env.TTS_ENV_FILE ?? env.AI_GATEWAY_ENV_FILE ?? "";
  const fileVars = envFile ? loadEnvFile(envFile) : {};
  const execFileImpl = options.execFileImpl ?? defaultExecFile;
  const checkBinExists = options.checkBinExists ?? true;

  const configuredBin = readVar(env, fileVars, options, ["EDGE_TTS_BIN"], "bin");
  const bin = resolveDefaultEdgeBin(configuredBin, env);
  const defaultVoice =
    readVar(env, fileVars, options, ["EDGE_TTS_VOICE"], "defaultVoice") || DEFAULT_VOICE;
  const proxy = readVar(env, fileVars, options, ["EDGE_TTS_PROXY"], "proxy");
  const secrets = [];
  if (proxy) {
    secrets.push(proxy);
    try {
      const parsedProxy = new URL(proxy);
      if (parsedProxy.password) secrets.push(decodeURIComponent(parsedProxy.password));
    } catch {
      // keep raw proxy string in secrets list
    }
  }

  function getCapabilities() {
    return {
      provider: TTS_PROVIDERS.EDGE_TTS,
      commercialEligible: false,
      supportsWordTimestamps: true,
      supportedFormats: ["mp3"],
      defaultVoice,
      defaultModel: DEFAULT_MODEL,
      providerVersion: PROVIDER_VERSION,
      maxCharsPerRequest: 15_000,
    };
  }

  function validateConfig() {
    const errors = [];
    if (!bin) {
      errors.push("EDGE_TTS_BIN is empty.");
    } else if (checkBinExists && !options.execFileImpl && !isBinaryAvailable(bin, env)) {
      errors.push(
        `edge-tts binary "${bin}" not found or not executable. Install edge-tts or set EDGE_TTS_BIN.`
      );
    }
    if (!SAFE_VOICE_RE.test(defaultVoice)) {
      errors.push(`Invalid EDGE_TTS_VOICE "${defaultVoice}".`);
    }
    return { ok: errors.length === 0, errors };
  }

  function estimateCost(charCount = 0) {
    return {
      estimatedCostUsd: 0,
      basis: "edge_tts_unofficial_free_draft_only",
      chars: Math.max(0, Number(charCount) || 0),
    };
  }

  async function synthesize({
    text,
    voice = defaultVoice,
    model = DEFAULT_MODEL,
    rate = "+0%",
    pitch = "+0Hz",
    outputFormat = "mp3",
    timeoutMs = 45_000,
    signal = undefined,
    requestId = "",
  }) {
    const fmt = String(outputFormat || "mp3").trim().toLowerCase();
    if (fmt !== "mp3") {
      throw new TTSConfigError(
        `Edge TTS adapter only supports "mp3" outputFormat (received "${fmt}").`,
        { provider: TTS_PROVIDERS.EDGE_TTS }
      );
    }

    const resolvedVoice = String(voice || defaultVoice).trim();
    if (!SAFE_VOICE_RE.test(resolvedVoice)) {
      throw new TTSConfigError(`Invalid Edge TTS voice "${resolvedVoice}".`, {
        provider: TTS_PROVIDERS.EDGE_TTS,
      });
    }

    const resolvedRate = String(rate || "+0%").trim();
    const resolvedPitch = String(pitch || "+0Hz").trim();
    if (!SAFE_RATE_RE.test(resolvedRate)) {
      throw new TTSConfigError(`Invalid Edge TTS rate "${resolvedRate}" (expected e.g. +0% or -5%).`, {
        provider: TTS_PROVIDERS.EDGE_TTS,
      });
    }
    if (!SAFE_PITCH_RE.test(resolvedPitch)) {
      throw new TTSConfigError(
        `Invalid Edge TTS pitch "${resolvedPitch}" (expected e.g. +0Hz or -2Hz).`,
        { provider: TTS_PROVIDERS.EDGE_TTS }
      );
    }

    const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), "kokisoyo-edge-tts-"));
    const textPath = path.join(stageDir, "input.txt");
    const mediaPath = path.join(stageDir, "output.mp3");
    const subsPath = path.join(stageDir, "output.srt");

    try {
      fs.writeFileSync(textPath, String(text), "utf8");

      const args = [
        "--file",
        textPath,
        "--voice",
        resolvedVoice,
        `--rate=${resolvedRate}`,
        `--pitch=${resolvedPitch}`,
        "--write-media",
        mediaPath,
        "--write-subtitles",
        subsPath,
        "--no-progress",
      ];
      if (proxy) {
        args.push("--proxy", proxy);
      }

      const controller = new AbortController();
      let timedOut = false;
      const onExternalAbort = () => controller.abort();
      if (signal) {
        if (signal.aborted) controller.abort();
        else signal.addEventListener("abort", onExternalAbort, { once: true });
      }
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      try {
        await execFileImpl(bin, args, {
          signal: controller.signal,
          timeout: timeoutMs,
          env,
        });
      } catch (err) {
        if (timedOut || signal?.aborted || err?.name === "AbortError" || err?.code === "ABORT_ERR") {
          throw new TTSTimeoutError(`edge-tts timed out after ${timeoutMs}ms.`, {
            provider: TTS_PROVIDERS.EDGE_TTS,
            timeoutMs,
            requestId,
          });
        }
        const stderrPreview = redactTTSText(String(err?.stderr || err?.message || ""), secrets).slice(
          0,
          200
        );
        throw new TTSProviderUnavailableError(
          `edge-tts execution failed: ${stderrPreview || "unknown error"}`,
          {
            provider: TTS_PROVIDERS.EDGE_TTS,
            status: 503,
            retryable: true,
            requestId,
            bodyPreview: stderrPreview,
          }
        );
      } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onExternalAbort);
      }

      if (!fs.existsSync(mediaPath)) {
        throw new TTSProviderUnavailableError("edge-tts completed without producing media output.", {
          provider: TTS_PROVIDERS.EDGE_TTS,
          status: 503,
          retryable: true,
          requestId,
        });
      }

      const audioBuffer = fs.readFileSync(mediaPath);
      if (audioBuffer.length === 0) {
        throw new TTSProviderUnavailableError("edge-tts produced an empty audio file.", {
          provider: TTS_PROVIDERS.EDGE_TTS,
          status: 503,
          retryable: true,
          requestId,
        });
      }

      let words = null;
      if (fs.existsSync(subsPath)) {
        const rawSubs = fs.readFileSync(subsPath, "utf8");
        const parsed = parseVttOrSrtToWords(rawSubs);
        if (parsed.length > 0) {
          words = parsed;
        }
      }

      return {
        audioBuffer,
        words,
        voice: resolvedVoice,
        model: model || DEFAULT_MODEL,
        providerMeta: {
          cliBin: path.basename(bin),
          wordCount: words ? words.length : 0,
          timestampsSource: words ? "edge_tts_subtitles" : "none",
        },
      };
    } finally {
      try {
        fs.rmSync(stageDir, { recursive: true, force: true });
      } catch {
        // ignore temp cleanup errors
      }
    }
  }

  return {
    getCapabilities,
    validateConfig,
    estimateCost,
    synthesize,
  };
}
