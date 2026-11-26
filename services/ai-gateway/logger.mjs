/**
 * Safe structured logger for AI Gateway with automatic credential/token redaction.
 */

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

const SENSITIVE_KEY_PATTERN = /(api[_-]?key|token|password|secret|authorization|cookie|credential)/i;
const SAFE_METRIC_KEYS = new Set([
  "promptTokens",
  "completionTokens",
  "totalTokens",
  "cachedTokens",
  "maxTokens",
  "prompt_tokens",
  "completion_tokens",
  "total_tokens",
  "cached_tokens",
  "max_tokens",
]);

export function redactText(text, secrets = []) {
  if (typeof text !== "string" || !text) return "";
  let out = text;

  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length >= 4) {
      out = out.split(secret).join("[REDACTED]");
    }
  }

  // Redact common bearer/header token patterns even if not explicitly listed
  out = out.replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]");
  out = out.replace(/((?:api[_-]?key|password|token|secret)\s*[:=]\s*["']?)[^\s"',}]+/gi, "$1[REDACTED]");

  return out;
}

export function sanitizeMeta(value, secrets = [], depth = 0) {
  if (depth > 4) return "[TRUNCATED]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactText(value, secrets);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeMeta(item, secrets, depth + 1));
  }
  if (typeof value === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(k) && !SAFE_METRIC_KEYS.has(k)) {
        clean[k] = "[REDACTED]";
      } else {
        clean[k] = sanitizeMeta(v, secrets, depth + 1);
      }
    }
    return clean;
  }
  return redactText(String(value), secrets);
}

export function createSafeLogger({
  level = "info",
  secrets = [],
  prefix = "[AI-Gateway]",
  sink = null,
} = {}) {
  const threshold = LEVELS[String(level || "info").toLowerCase()] ?? LEVELS.info;
  const secretList = secrets.filter((s) => typeof s === "string" && s.length >= 4);

  function emit(lvl, message, meta = undefined) {
    const score = LEVELS[lvl] ?? LEVELS.info;
    if (score < threshold) return;

    const cleanMsg = redactText(String(message || ""), secretList);
    const cleanMeta = meta !== undefined ? sanitizeMeta(meta, secretList) : undefined;
    const line = cleanMeta
      ? `${prefix} [${lvl.toUpperCase()}] ${cleanMsg} ${JSON.stringify(cleanMeta)}`
      : `${prefix} [${lvl.toUpperCase()}] ${cleanMsg}`;

    if (typeof sink === "function") {
      sink(lvl, line, cleanMeta);
      return;
    }

    if (lvl === "error") console.error(line);
    else if (lvl === "warn") console.warn(line);
    else console.log(line);
  }

  return {
    debug: (msg, meta) => emit("debug", msg, meta),
    info: (msg, meta) => emit("info", msg, meta),
    warn: (msg, meta) => emit("warn", msg, meta),
    error: (msg, meta) => emit("error", msg, meta),
  };
}
