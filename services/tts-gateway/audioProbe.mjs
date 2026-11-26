/**
 * Safe `ffprobe` audio inspector and 50-65s Shorts duration validator.
 *
 * Security & Reliability:
 * - Always invokes `ffprobe` via `execFile` (zero shell interpolation).
 * - Rejects symlinks and non-regular files via `lstatSync`.
 * - Enforces hard timeout with `AbortController` + `killSignal: "SIGKILL"`.
 * - Distinguishes local timeout (`TTSTimeoutError`) from external kills (`TTSAudioProbeError`).
 */

import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { TTSAudioProbeError, TTSTimeoutError } from "./errors.mjs";
import { redactTTSText } from "./redact.mjs";

const execFileAsync = promisify(execFile);

export const DEFAULT_DURATION_WINDOW = Object.freeze({
  minSec: 50,
  maxSec: 65,
});

/**
 * Evaluates whether an actual measured audio duration fits the Kok Iso Yo? 50-65s target window.
 */
export function validateAudioDuration(
  actualDurationSec,
  { minSec = DEFAULT_DURATION_WINDOW.minSec, maxSec = DEFAULT_DURATION_WINDOW.maxSec } = {}
) {
  const dur = Number(actualDurationSec);
  if (!Number.isFinite(dur) || dur <= 0) {
    return {
      valid: false,
      status: "invalid",
      actualDurationSec: 0,
      minSec,
      maxSec,
      deltaSec: 0,
    };
  }

  const rounded = Number(dur.toFixed(3));
  if (rounded < minSec) {
    return {
      valid: false,
      status: "too_short",
      actualDurationSec: rounded,
      minSec,
      maxSec,
      deltaSec: Number((rounded - minSec).toFixed(3)),
    };
  }
  if (rounded > maxSec) {
    return {
      valid: false,
      status: "too_long",
      actualDurationSec: rounded,
      minSec,
      maxSec,
      deltaSec: Number((rounded - maxSec).toFixed(3)),
    };
  }

  return {
    valid: true,
    status: "ok",
    actualDurationSec: rounded,
    minSec,
    maxSec,
    deltaSec: 0,
  };
}

/**
 * Probes an audio file using `ffprobe` via `execFile` (never a shell).
 */
export async function probeAudioFile(
  filePath,
  {
    ffprobeBin = "ffprobe",
    timeoutMs = 15_000,
    minSec = DEFAULT_DURATION_WINDOW.minSec,
    maxSec = DEFAULT_DURATION_WINDOW.maxSec,
    secrets = [],
    execFileImpl = execFileAsync,
    lstatSyncImpl = fs.lstatSync,
  } = {}
) {
  const resolvedPath = String(filePath || "").trim();
  if (!resolvedPath) {
    throw new TTSAudioProbeError('Audio file path is empty for ffprobe.', {
      reason: "FILE_NOT_FOUND",
      filePath: resolvedPath,
    });
  }

  let stat;
  try {
    stat = lstatSyncImpl(resolvedPath);
  } catch {
    throw new TTSAudioProbeError(`Audio file not found for ffprobe: "${resolvedPath}".`, {
      reason: "FILE_NOT_FOUND",
      filePath: resolvedPath,
    });
  }

  if (typeof stat.isSymbolicLink === "function" && stat.isSymbolicLink()) {
    throw new TTSAudioProbeError(`Refusing to probe symlinked audio file: "${resolvedPath}".`, {
      reason: "SYMLINK_REJECTED",
      filePath: resolvedPath,
    });
  }
  if (typeof stat.isFile === "function" && !stat.isFile()) {
    throw new TTSAudioProbeError(`Audio path is not a regular file: "${resolvedPath}".`, {
      reason: "NOT_A_REGULAR_FILE",
      filePath: resolvedPath,
    });
  }

  const fileSizeBytes = Number(stat.size || 0);
  if (fileSizeBytes <= 0) {
    throw new TTSAudioProbeError(`Audio file is empty (0 bytes): "${resolvedPath}".`, {
      reason: "EMPTY_FILE",
      filePath: resolvedPath,
    });
  }

  const args = [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size,bit_rate,format_name:stream=codec_type,codec_name,sample_rate,channels,duration",
    "-of",
    "json",
    resolvedPath,
  ];

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let stdout = "";
  try {
    const res = await execFileImpl(ffprobeBin, args, {
      timeout: timeoutMs,
      killSignal: "SIGKILL",
      signal: controller.signal,
      maxBuffer: 2 * 1024 * 1024,
    });
    clearTimeout(timer);
    stdout = String(res?.stdout || "");
  } catch (err) {
    clearTimeout(timer);
    const detail = redactTTSText(String(err?.stderr || err?.message || err), secrets).slice(0, 220);

    // Only classify as TTSTimeoutError if OUR timer aborted it OR explicit ETIMEDOUT/timed out
    const isLocalTimeout =
      timedOut ||
      err?.code === "ETIMEDOUT" ||
      /timed out|timeout|etimedout/i.test(detail);

    if (isLocalTimeout) {
      throw new TTSTimeoutError(`ffprobe timed out after ${timeoutMs}ms on "${resolvedPath}".`, {
        provider: "ffprobe",
        timeoutMs,
      });
    }

    // External signal (e.g. OOM killer / OS shutdown SIGTERM/SIGKILL) is NOT a retryable timeout
    if (err?.signal === "SIGTERM" || err?.signal === "SIGKILL" || Boolean(err?.killed)) {
      throw new TTSAudioProbeError(
        `ffprobe was terminated externally (${err?.signal || "killed"}) on "${resolvedPath}".`,
        {
          reason: "FFPROBE_KILLED_EXTERNALLY",
          filePath: resolvedPath,
          detail,
        }
      );
    }

    throw new TTSAudioProbeError(`ffprobe failed on "${resolvedPath}": ${detail}`, {
      reason: "FFPROBE_EXEC_FAILED",
      filePath: resolvedPath,
      detail,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new TTSAudioProbeError(`ffprobe returned invalid JSON for "${resolvedPath}".`, {
      reason: "INVALID_JSON",
      filePath: resolvedPath,
      detail: redactTTSText(stdout.slice(0, 160), secrets),
    });
  }

  const streams = Array.isArray(parsed?.streams) ? parsed.streams : [];
  const audioStream = streams.find((s) => s && s.codec_type === "audio");
  if (!audioStream) {
    throw new TTSAudioProbeError(`No audio stream found in "${resolvedPath}".`, {
      reason: "NO_AUDIO_STREAM",
      filePath: resolvedPath,
    });
  }

  const rawDur = Number(parsed?.format?.duration ?? audioStream.duration);
  if (!Number.isFinite(rawDur) || rawDur <= 0) {
    throw new TTSAudioProbeError(`Invalid or zero audio duration in "${resolvedPath}".`, {
      reason: "INVALID_DURATION",
      filePath: resolvedPath,
      detail: String(parsed?.format?.duration ?? audioStream.duration ?? ""),
    });
  }

  const actualDurationSec = Number(rawDur.toFixed(3));
  const durationValidation = validateAudioDuration(actualDurationSec, { minSec, maxSec });

  return {
    ok: true,
    filePath: resolvedPath,
    actualDurationSec,
    durationMs: Math.round(actualDurationSec * 1000),
    withinTargetWindow: durationValidation.valid,
    durationValidation,
    codec: audioStream.codec_name || null,
    formatName: parsed?.format?.format_name || null,
    sampleRate: audioStream.sample_rate ? Number(audioStream.sample_rate) : null,
    channels: audioStream.channels ? Number(audioStream.channels) : null,
    bitRate: parsed?.format?.bit_rate ? Number(parsed.format.bit_rate) : null,
    sizeBytes: Number(parsed?.format?.size || fileSizeBytes),
  };
}
