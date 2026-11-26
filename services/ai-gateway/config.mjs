/**
 * Configuration loader for Kok Iso Yo? AI Gateway & 2-Route Router.
 *
 * Routes:
 * - STANDARD: AGYBridge Render OpenAI-compatible HTTP gateway
 * - PREMIUM:  Local `agy` CLI on VPS (e.g. Gemini 4 Neon / Claude Opus / Pro Max models)
 *
 * Never logs or returns secrets inside error messages.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AIGatewayConfigError } from "./errors.mjs";

const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 1_500;
const DEFAULT_MODELS_CACHE_TTL_MS = 300_000;

const DEFAULT_CLI_TIMEOUT_MS = 180_000;
const DEFAULT_CLI_MAX_RETRIES = 1;
const DEFAULT_CLI_RETRY_BASE_MS = 2_000;

export const AI_TIERS = Object.freeze({
  STANDARD: "standard",
  PREMIUM: "premium",
});

export const VALID_EFFORT_LEVELS = new Set(["low", "medium", "high", "xhigh", "max"]);

export const DEFAULT_PREMIUM_TASKS = Object.freeze([
  "script_master",
  "creative_director",
  "storyboard_3d",
  "qa_editorial",
  "hook_rewrite",
  "scene_codegen",
]);

export const DEFAULT_STANDARD_TASKS = Object.freeze([
  "metadata",
  "captions",
  "hashtags",
  "translation",
  "summary",
  "post_copy",
  "draft_outline",
  "seo_pack",
]);

export function parseEnvContent(content) {
  const parsed = {};
  for (const rawLine of String(content || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      parsed[key] = val;
    }
  }
  return parsed;
}

/**
 * Safely reads a dotenv-style file and returns parsed variables without mutating process.env
 * unless `applyToProcessEnv: true` is passed (still never overwrites already-set env vars).
 */
export function loadEnvFile(filePath, { applyToProcessEnv = false } = {}) {
  if (!filePath) return {};
  const expanded = filePath.startsWith("~/")
    ? path.join(os.homedir(), filePath.slice(2))
    : filePath;
  if (!fs.existsSync(expanded)) return {};
  const content = fs.readFileSync(expanded, "utf8");
  const parsed = parseEnvContent(content);
  if (applyToProcessEnv) {
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined || process.env[k] === "") {
        process.env[k] = v;
      }
    }
  }
  return parsed;
}

function parseBool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const s = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return fallback;
}

function parseIntClamped(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function parseCsvList(value, fallback) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean);
  }
  if (value === undefined || value === null || String(value).trim() === "") {
    return [...fallback];
  }
  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function makeGetter({ env = process.env, envFile = undefined, overrides = {} } = {}) {
  const filePath = envFile ?? env.AI_GATEWAY_ENV_FILE ?? env.AGYBRIDGE_ENV_FILE ?? "";
  const fileVars = filePath ? loadEnvFile(filePath) : {};

  // Priority: overrides > process.env > envFile
  return (keys, overrideKey = null) => {
    if (overrideKey && overrides[overrideKey] !== undefined && overrides[overrideKey] !== null) {
      return overrides[overrideKey];
    }
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      if (env[key] !== undefined && env[key] !== "") return env[key];
    }
    for (const key of keyList) {
      if (fileVars[key] !== undefined && fileVars[key] !== "") return fileVars[key];
    }
    return "";
  };
}

export function resolveGatewayConfig({ env = process.env, envFile = undefined, overrides = {} } = {}) {
  const get = makeGetter({ env, envFile, overrides });

  const provider = String(get("AI_GATEWAY_PROVIDER", "provider") || "antigravity_cli")
    .trim()
    .toLowerCase();

  const rawUrl = String(get("AGYBRIDGE_RENDER_URL", "baseUrl") || "").trim().replace(/\/+$/, "");
  const apiKey = String(get("AGYBRIDGE_RENDER_API_KEY", "apiKey") || "").trim();
  const defaultModel = String(
    get(["AI_STANDARD_MODEL", "AGYBRIDGE_DEFAULT_MODEL"], "defaultModel") || ""
  ).trim();

  const allowHttp = parseBool(get("AGYBRIDGE_ALLOW_HTTP", "allowHttp"), false);
  const verifyModelAvailable = parseBool(
    get("AGYBRIDGE_VERIFY_MODEL_AVAILABLE", "verifyModelAvailable"),
    true
  );

  const timeoutMs = parseIntClamped(
    get("AGYBRIDGE_TIMEOUT_MS", "timeoutMs"),
    DEFAULT_TIMEOUT_MS,
    1_000,
    300_000
  );
  const maxRetries = parseIntClamped(
    get("AGYBRIDGE_MAX_RETRIES", "maxRetries"),
    DEFAULT_MAX_RETRIES,
    0,
    3
  );
  const retryBaseMs = parseIntClamped(
    get("AGYBRIDGE_RETRY_BASE_MS", "retryBaseMs"),
    DEFAULT_RETRY_BASE_MS,
    50,
    30_000
  );
  const modelsCacheTtlMs = parseIntClamped(
    get("AGYBRIDGE_MODELS_CACHE_TTL_MS", "modelsCacheTtlMs"),
    DEFAULT_MODELS_CACHE_TTL_MS,
    0,
    3_600_000
  );
  const logLevel = String(get(["AI_ROUTER_LOG_LEVEL", "AGYBRIDGE_LOG_LEVEL"], "logLevel") || "info")
    .trim()
    .toLowerCase();

  return {
    provider,
    baseUrl: rawUrl,
    apiKey,
    defaultModel,
    allowHttp,
    verifyModelAvailable,
    timeoutMs,
    maxRetries,
    retryBaseMs,
    modelsCacheTtlMs,
    logLevel,
  };
}

export function resolveAgyCliConfig({ env = process.env, envFile = undefined, overrides = {} } = {}) {
  const get = makeGetter({ env, envFile, overrides });

  const bin = String(get("AGY_CLI_BIN", "bin") || "agy").trim();
  const defaultModel = String(
    get(["AI_PREMIUM_MODEL", "AGY_CLI_DEFAULT_MODEL"], "defaultModel") || ""
  ).trim();
  const defaultEffort = String(
    get(["AI_PREMIUM_EFFORT", "AGY_CLI_EFFORT"], "defaultEffort") || ""
  )
    .trim()
    .toLowerCase();

  if (defaultEffort && !VALID_EFFORT_LEVELS.has(defaultEffort)) {
    throw new AIGatewayConfigError(
      `Invalid AI_PREMIUM_EFFORT "${defaultEffort}". Expected one of: ${[...VALID_EFFORT_LEVELS].join(", ")}.`
    );
  }

  const timeoutMs = parseIntClamped(
    get(["AI_PREMIUM_TIMEOUT_MS", "AGY_CLI_TIMEOUT_MS"], "timeoutMs"),
    DEFAULT_CLI_TIMEOUT_MS,
    5_000,
    600_000
  );
  const maxRetries = parseIntClamped(
    get(["AI_PREMIUM_MAX_RETRIES", "AGY_CLI_MAX_RETRIES"], "maxRetries"),
    DEFAULT_CLI_MAX_RETRIES,
    0,
    3
  );
  const retryBaseMs = parseIntClamped(
    get(["AI_PREMIUM_RETRY_BASE_MS", "AGY_CLI_RETRY_BASE_MS"], "retryBaseMs"),
    DEFAULT_CLI_RETRY_BASE_MS,
    50,
    30_000
  );
  const modelsCacheTtlMs = parseIntClamped(
    get("AGY_CLI_MODELS_CACHE_TTL_MS", "modelsCacheTtlMs"),
    DEFAULT_MODELS_CACHE_TTL_MS,
    0,
    3_600_000
  );
  const verifyModelAvailable = parseBool(
    get("AGY_CLI_VERIFY_MODEL_AVAILABLE", "verifyModelAvailable"),
    true
  );
  const disableSlashCommands = parseBool(
    get("AGY_CLI_DISABLE_SLASH_COMMANDS", "disableSlashCommands"),
    true
  );
  const cwd = String(get("AGY_CLI_CWD", "cwd") || os.tmpdir()).trim();
  const logLevel = String(get(["AI_ROUTER_LOG_LEVEL", "AGYBRIDGE_LOG_LEVEL"], "logLevel") || "info")
    .trim()
    .toLowerCase();

  return {
    bin,
    defaultModel,
    defaultEffort,
    timeoutMs,
    maxRetries,
    retryBaseMs,
    modelsCacheTtlMs,
    verifyModelAvailable,
    disableSlashCommands,
    cwd,
    logLevel,
  };
}

export function resolveRouterConfig({ env = process.env, envFile = undefined, overrides = {} } = {}) {
  const get = makeGetter({ env, envFile, overrides });

  const defaultTier = String(get("AI_ROUTE_DEFAULT", "defaultTier") || AI_TIERS.STANDARD)
    .trim()
    .toLowerCase();

  if (defaultTier !== AI_TIERS.STANDARD && defaultTier !== AI_TIERS.PREMIUM) {
    throw new AIGatewayConfigError(
      `Invalid AI_ROUTE_DEFAULT "${defaultTier}". Expected "${AI_TIERS.STANDARD}" or "${AI_TIERS.PREMIUM}".`
    );
  }

  const standardModel = String(
    get(["AI_STANDARD_MODEL", "AGYBRIDGE_DEFAULT_MODEL"], "standardModel") || ""
  ).trim();
  const premiumModel = String(
    get(["AI_PREMIUM_MODEL", "AGY_CLI_DEFAULT_MODEL"], "premiumModel") || ""
  ).trim();

  const fallbackOnTransient = parseBool(
    get("AI_ROUTER_FALLBACK_ON_TRANSIENT", "fallbackOnTransient"),
    false
  );

  const premiumTasks = parseCsvList(
    get("AI_ROUTE_PREMIUM_TASKS", "premiumTasks"),
    DEFAULT_PREMIUM_TASKS
  );
  const standardTasks = parseCsvList(
    get("AI_ROUTE_STANDARD_TASKS", "standardTasks"),
    DEFAULT_STANDARD_TASKS
  );

  const logLevel = String(get(["AI_ROUTER_LOG_LEVEL", "AGYBRIDGE_LOG_LEVEL"], "logLevel") || "info")
    .trim()
    .toLowerCase();

  return {
    defaultTier,
    standardModel,
    premiumModel,
    fallbackOnTransient,
    premiumTasks,
    standardTasks,
    logLevel,
  };
}

export function validateAGYBridgeConfig(cfg) {
  if (!cfg.baseUrl) {
    throw new AIGatewayConfigError("AGYBRIDGE_RENDER_URL is required but not set.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(cfg.baseUrl);
  } catch {
    throw new AIGatewayConfigError("AGYBRIDGE_RENDER_URL is not a valid URL.");
  }

  if (parsedUrl.protocol !== "https:" && !(cfg.allowHttp && parsedUrl.protocol === "http:")) {
    throw new AIGatewayConfigError(
      `AGYBRIDGE_RENDER_URL must use HTTPS (received protocol "${parsedUrl.protocol}").`
    );
  }

  if (!cfg.apiKey) {
    throw new AIGatewayConfigError("AGYBRIDGE_RENDER_API_KEY is required but not set.");
  }

  return parsedUrl;
}
