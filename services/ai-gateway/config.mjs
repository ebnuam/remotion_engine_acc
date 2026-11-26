/**
 * Configuration loader for Kok Iso Yo? AI Gateway (AGYBridge Render).
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

export function resolveGatewayConfig({ env = process.env, envFile = undefined, overrides = {} } = {}) {
  const filePath = envFile ?? env.AGYBRIDGE_ENV_FILE ?? "";
  const fileVars = filePath ? loadEnvFile(filePath) : {};

  // Priority: overrides > process.env > envFile
  const get = (key, overrideKey = null) => {
    if (overrideKey && overrides[overrideKey] !== undefined && overrides[overrideKey] !== null) {
      return overrides[overrideKey];
    }
    if (env[key] !== undefined && env[key] !== "") return env[key];
    if (fileVars[key] !== undefined && fileVars[key] !== "") return fileVars[key];
    return "";
  };

  const provider = String(get("AI_GATEWAY_PROVIDER", "provider") || "antigravity_cli")
    .trim()
    .toLowerCase();

  const rawUrl = String(get("AGYBRIDGE_RENDER_URL", "baseUrl") || "").trim().replace(/\/+$/, "");
  const apiKey = String(get("AGYBRIDGE_RENDER_API_KEY", "apiKey") || "").trim();
  const defaultModel = String(get("AGYBRIDGE_DEFAULT_MODEL", "defaultModel") || "").trim();

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
  const logLevel = String(get("AGYBRIDGE_LOG_LEVEL", "logLevel") || "info")
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
