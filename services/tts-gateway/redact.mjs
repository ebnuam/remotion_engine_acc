/**
 * Hardened TTS Secret Redaction & Recursive Metadata Sanitizer.
 *
 * Extends `services/ai-gateway/logger.mjs` to cover TTS-specific headers, URL query params,
 * vendor key formats (e.g. ElevenLabs `sk_...`, Azure `Ocp-Apim-Subscription-Key`),
 * nested metadata objects, and Error instances (message, stack, meta, cause).
 */

import { createSafeLogger, redactText } from "../ai-gateway/logger.mjs";

const TTS_SENSITIVE_KEY_PATTERN =
  /(api[_-]?key|subscription[_-]?key|ocp[_-]?apim|xi[_-]?api[_-]?key|x[_-]?api[_-]?key|x[_-]?goog[_-]?api[_-]?key|token|password|secret|authorization|auth[_-]?header|cookie|credential|headers)/i;

const SAFE_TTS_METRIC_KEYS = new Set([
  "promptTokens",
  "completionTokens",
  "totalTokens",
  "maxTokens",
  "rawCharCount",
  "normalizedCharCount",
  "billedCharCount",
]);

/**
 * Redacts known secret strings AND TTS-specific header/query/key patterns from arbitrary text.
 */
export function redactTTSText(text, secrets = []) {
  if (typeof text !== "string" || !text) return "";
  let out = redactText(text, secrets);

  // Redact TTS-specific headers & key/value pairs (Azure, ElevenLabs, Google)
  out = out.replace(
    /((?:ocp-apim-subscription-key|subscription[_-]?key|xi-api-key|x-api-key|x-goog-api-key|auth[_-]?header)\s*[:=]\s*["']?)[^\s"',}&]+/gi,
    "$1[REDACTED]"
  );

  // Redact URL query parameters carrying keys/tokens
  out = out.replace(
    /([?&](?:key|api[_-]?key|subscription[_-]?key|token|access_token|secret)=)[^&\s"'#]+/gi,
    "$1[REDACTED]"
  );

  // Redact common vendor key prefixes (ElevenLabs sk_..., Google AIza...)
  out = out.replace(/\bsk_[A-Za-z0-9_-]{16,}\b/g, "[REDACTED]");
  out = out.replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, "[REDACTED]");

  return out;
}

/**
 * Recursively sanitizes any object/array for safe logging or JSON persistence.
 * Sensitive keys are stripped completely from persisted objects (never kept even as raw names if stripKeys=true)
 * or replaced with "[REDACTED]".
 */
export function sanitizeTTSObject(value, secrets = [], { depth = 0, stripSensitiveKeys = false } = {}) {
  if (depth > 6) return "[TRUNCATED]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactTTSText(value, secrets);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => sanitizeTTSObject(item, secrets, { depth: depth + 1, stripSensitiveKeys }));
  }
  if (typeof value === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (TTS_SENSITIVE_KEY_PATTERN.test(k) && !SAFE_TTS_METRIC_KEYS.has(k)) {
        if (!stripSensitiveKeys) {
          clean[k] = "[REDACTED]";
        }
      } else {
        clean[k] = sanitizeTTSObject(v, secrets, { depth: depth + 1, stripSensitiveKeys });
      }
    }
    return clean;
  }
  return redactTTSText(String(value), secrets);
}

/**
 * Sanitizes an Error object in-place (message, stack, meta, cause) before rethrowing to callers.
 */
export function sanitizeTTSError(err, secrets = []) {
  if (!err || typeof err !== "object") return err;

  if (typeof err.message === "string") {
    err.message = redactTTSText(err.message, secrets);
  }
  if (typeof err.stack === "string") {
    err.stack = redactTTSText(err.stack, secrets);
  }
  if (err.meta && typeof err.meta === "object") {
    err.meta = sanitizeTTSObject(err.meta, secrets, { stripSensitiveKeys: false });
  }
  if (err.cause !== undefined) {
    if (err.cause instanceof Error) {
      err.cause = new Error(redactTTSText(err.cause.message || String(err.cause), secrets));
    } else if (typeof err.cause === "string") {
      err.cause = redactTTSText(err.cause, secrets);
    } else {
      err.cause = sanitizeTTSObject(err.cause, secrets, { stripSensitiveKeys: true });
    }
  }
  return err;
}

/**
 * Creates a safe TTS logger applying enhanced TTS redaction to both message & nested metadata.
 */
export function createTTSSafeLogger({
  level = "info",
  secrets = [],
  prefix = "[TTS-Router]",
  sink = null,
} = {}) {
  const base = createSafeLogger({ level, secrets, prefix, sink });
  const wrap = (fn) => (msg, meta) =>
    fn(
      redactTTSText(String(msg || ""), secrets),
      meta !== undefined ? sanitizeTTSObject(meta, secrets, { stripSensitiveKeys: false }) : undefined
    );

  return {
    debug: wrap(base.debug),
    info: wrap(base.info),
    warn: wrap(base.warn),
    error: wrap(base.error),
  };
}
