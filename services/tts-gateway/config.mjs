/**
 * Configuration loader & commercial license policy resolver for Kok Iso Yo? TTS Gateway.
 *
 * Strictly separates:
 * 1. Provider-level commercial eligibility (`commercialEligible` from provider capabilities)
 * 2. Account-level commercial plan status (`accountPlanTier`)
 *
 * Fail-closed guarantee:
 * - `free`, `f0`, `unofficial`, and `unknown` account plans are ALWAYS rejected in `final` mode
 *   (cannot be bypassed by `TTS_FINAL_COMMERCIAL_CONFIRMED=true`; only explicit dev escape flags
 *   `allowUnofficialFinal` / `allowNonCommercialFinal` can relax this for local testing).
 * - Never logs or exposes API keys or secrets.
 */

import os from "node:os";
import path from "node:path";
import { loadEnvFile } from "../ai-gateway/config.mjs";
import { TTSConfigError } from "./errors.mjs";

export const TTS_MODES = Object.freeze({
  DRAFT: "draft",
  FINAL: "final",
});

export const TTS_PROVIDERS = Object.freeze({
  EDGE_TTS: "edge_tts",
  AZURE_SPEECH: "azure_speech",
  ELEVENLABS: "elevenlabs",
});

export const ACCOUNT_PLAN_TIERS = Object.freeze({
  UNOFFICIAL: "unofficial",
  FREE: "free",
  PAID_COMMERCIAL: "paid_commercial",
  ENTERPRISE: "enterprise",
  UNKNOWN: "unknown",
});

export const COMMERCIAL_ACCOUNT_TIERS = new Set([
  ACCOUNT_PLAN_TIERS.PAID_COMMERCIAL,
  ACCOUNT_PLAN_TIERS.ENTERPRISE,
]);

const VALID_MODES = new Set(Object.values(TTS_MODES));
const VALID_FORMATS = new Set(["mp3", "wav"]);

const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 1_500;
const DEFAULT_TARGET_MIN_SEC = 50;
const DEFAULT_TARGET_MAX_SEC = 65;

const SECRET_ENV_KEY_PATTERN =
  /^(?:TTS|AZURE|ELEVENLABS|GOOGLE_TTS|OPENAI_TTS).*_(?:API_KEYS?|KEYS?|TOKENS?|SECRETS?|PASSWORD)$/i;

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

function parseNumClamped(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function makeGetter({ env = process.env, envFile = undefined, overrides = {} } = {}) {
  const filePath = envFile ?? env.TTS_ENV_FILE ?? env.AI_GATEWAY_ENV_FILE ?? "";
  const fileVars = filePath ? loadEnvFile(filePath) : {};

  // Priority: overrides > env > envFile
  const get = (keys, overrideKey = null) => {
    if (overrideKey && overrides[overrideKey] !== undefined && overrides[overrideKey] !== null) {
      return overrides[overrideKey];
    }
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) {
      if (env[k] !== undefined && env[k] !== "") return env[k];
    }
    for (const k of list) {
      if (fileVars[k] !== undefined && fileVars[k] !== "") return fileVars[k];
    }
    return "";
  };

  return { get, fileVars };
}

/**
 * Provider-aware normalization of vendor plan strings into canonical ACCOUNT_PLAN_TIERS.
 * Fails closed (`UNKNOWN`) for ambiguous/generic labels like `"standard"` on non-Azure providers.
 */
export function normalizeAccountPlanTier(rawTier, provider = "") {
  const s = String(rawTier || "").trim().toLowerCase();
  const prov = String(provider || "").trim().toLowerCase();
  if (!s) return ACCOUNT_PLAN_TIERS.UNKNOWN;

  if (["unofficial", "edge_consumer", "consumer"].includes(s)) {
    return ACCOUNT_PLAN_TIERS.UNOFFICIAL;
  }
  if (["free", "f0", "trial", "non_commercial", "non-commercial"].includes(s)) {
    return ACCOUNT_PLAN_TIERS.FREE;
  }
  if (["paid_commercial", "commercial"].includes(s)) {
    return ACCOUNT_PLAN_TIERS.PAID_COMMERCIAL;
  }
  if (["enterprise", "business", "commitment"].includes(s)) {
    return ACCOUNT_PLAN_TIERS.ENTERPRISE;
  }

  // Provider-specific paid commercial tiers
  if (prov === TTS_PROVIDERS.AZURE_SPEECH && ["s0", "standard_s0", "payg_s0"].includes(s)) {
    return ACCOUNT_PLAN_TIERS.PAID_COMMERCIAL;
  }
  if (prov === TTS_PROVIDERS.ELEVENLABS && ["starter", "creator", "pro", "scale"].includes(s)) {
    return ACCOUNT_PLAN_TIERS.PAID_COMMERCIAL;
  }
  // When provider is unspecified, still recognize unambiguous vendor tier codes (s0, starter, creator, pro, scale)
  if (!prov && ["s0", "standard_s0", "starter", "creator", "pro", "scale"].includes(s)) {
    return ACCOUNT_PLAN_TIERS.PAID_COMMERCIAL;
  }

  // Ambiguous labels (e.g. bare "standard", "paid", unknown strings) fail closed to UNKNOWN
  return ACCOUNT_PLAN_TIERS.UNKNOWN;
}

export function resolveTTSConfig({ env = process.env, envFile = undefined, overrides = {} } = {}) {
  const { get, fileVars } = makeGetter({ env, envFile, overrides });

  const defaultMode = String(get("TTS_DEFAULT_MODE", "defaultMode") || TTS_MODES.DRAFT)
    .trim()
    .toLowerCase();
  if (!VALID_MODES.has(defaultMode)) {
    throw new TTSConfigError(
      `Invalid TTS_DEFAULT_MODE "${defaultMode}". Expected "draft" or "final".`
    );
  }

  const draftProvider = String(
    get(["TTS_DRAFT_PROVIDER", "TTS_PROVIDER"], "draftProvider") || TTS_PROVIDERS.EDGE_TTS
  )
    .trim()
    .toLowerCase();

  const finalProvider = String(
    get(["TTS_FINAL_PROVIDER", "TTS_PROVIDER"], "finalProvider") || ""
  )
    .trim()
    .toLowerCase();

  const defaultLanguage = String(get("TTS_DEFAULT_LANGUAGE", "defaultLanguage") || "id-ID").trim();
  const defaultFormat = String(get("TTS_DEFAULT_FORMAT", "defaultFormat") || "mp3")
    .trim()
    .toLowerCase();
  if (!VALID_FORMATS.has(defaultFormat)) {
    throw new TTSConfigError(
      `Invalid TTS_DEFAULT_FORMAT "${defaultFormat}". Expected "mp3" or "wav".`
    );
  }

  const timeoutMs = parseIntClamped(
    get("TTS_TIMEOUT_MS", "timeoutMs"),
    DEFAULT_TIMEOUT_MS,
    2_000,
    300_000
  );
  const maxRetries = parseIntClamped(
    get("TTS_MAX_RETRIES", "maxRetries"),
    DEFAULT_MAX_RETRIES,
    0,
    3
  );
  const retryBaseMs = parseIntClamped(
    get("TTS_RETRY_BASE_MS", "retryBaseMs"),
    DEFAULT_RETRY_BASE_MS,
    50,
    30_000
  );

  const targetMinSec = parseNumClamped(
    get("TTS_TARGET_MIN_SEC", "targetMinSec"),
    DEFAULT_TARGET_MIN_SEC,
    1,
    600
  );
  const targetMaxSec = parseNumClamped(
    get("TTS_TARGET_MAX_SEC", "targetMaxSec"),
    DEFAULT_TARGET_MAX_SEC,
    1,
    600
  );
  if (targetMinSec >= targetMaxSec) {
    throw new TTSConfigError(
      `Invalid TTS duration window: targetMinSec (${targetMinSec}) must be < targetMaxSec (${targetMaxSec}).`
    );
  }

  const enforceDurationWindow = parseBool(
    get("TTS_ENFORCE_DURATION_WINDOW", "enforceDurationWindow"),
    false
  );
  const cacheEnabled = parseBool(get("TTS_CACHE_ENABLED", "cacheEnabled"), true);
  const cacheDir = String(
    get("TTS_CACHE_DIR", "cacheDir") ||
      path.join(os.tmpdir(), `kokisoyo-tts-cache-${process.getuid?.() ?? "user"}`)
  ).trim();
  const ffprobeBin = String(get("FFPROBE_BIN", "ffprobeBin") || "ffprobe").trim();
  const ffprobeTimeoutMs = parseIntClamped(
    get("TTS_FFPROBE_TIMEOUT_MS", "ffprobeTimeoutMs"),
    15_000,
    1_000,
    60_000
  );

  // Explicit dev-only escape hatches (default false; fail closed)
  const allowUnofficialFinal = parseBool(
    get("TTS_ALLOW_UNOFFICIAL_FINAL", "allowUnofficialFinal"),
    false
  );
  const allowNonCommercialFinal = parseBool(
    get("TTS_ALLOW_NON_COMMERCIAL_FINAL", "allowNonCommercialFinal"),
    false
  );

  const rawProviderPlans = {
    [TTS_PROVIDERS.EDGE_TTS]: ACCOUNT_PLAN_TIERS.UNOFFICIAL,
    [TTS_PROVIDERS.AZURE_SPEECH]: get(["AZURE_SPEECH_PLAN_TIER", "AZURE_SPEECH_TIER"]),
    [TTS_PROVIDERS.ELEVENLABS]: get(["ELEVENLABS_PLAN_TIER", "ELEVENLABS_PLAN"]),
    ...(overrides.providerPlans || {}),
  };

  const providerPlans = {};
  for (const [provName, rawPlan] of Object.entries(rawProviderPlans)) {
    const key = String(provName).trim().toLowerCase();
    providerPlans[key] = normalizeAccountPlanTier(rawPlan, key);
  }

  // Optional per-provider or global confirmation flag (NOTE: can NEVER bypass free/f0/unofficial/unknown!)
  const providerCommercialConfirmed = {
    ...(overrides.providerCommercialConfirmed || {}),
  };
  const globalFinalCommercialConfirmed = parseBool(
    get("TTS_FINAL_COMMERCIAL_CONFIRMED", "finalCommercialConfirmed"),
    false
  );

  // Harvest all TTS/vendor secret env values for redaction (never logged or serialized)
  const secretSet = new Set();
  for (const source of [fileVars, env]) {
    if (!source || typeof source !== "object") continue;
    for (const [k, v] of Object.entries(source)) {
      if (SECRET_ENV_KEY_PATTERN.test(k) && typeof v === "string" && v.length >= 4) {
        secretSet.add(v);
        for (const part of v.split(/[\s,;]+/)) {
          const trimmed = part.trim();
          if (trimmed.length >= 4) secretSet.add(trimmed);
        }
      }
    }
  }
  if (Array.isArray(overrides.secrets)) {
    for (const s of overrides.secrets) {
      if (typeof s === "string" && s.length >= 4) secretSet.add(s);
    }
  }

  const logLevel = String(
    get(["TTS_LOG_LEVEL", "AI_ROUTER_LOG_LEVEL"], "logLevel") || "info"
  )
    .trim()
    .toLowerCase();

  return {
    defaultMode,
    draftProvider,
    finalProvider,
    defaultLanguage,
    defaultFormat,
    timeoutMs,
    maxRetries,
    retryBaseMs,
    targetMinSec,
    targetMaxSec,
    enforceDurationWindow,
    cacheEnabled,
    cacheDir,
    ffprobeBin,
    ffprobeTimeoutMs,
    allowUnofficialFinal,
    allowNonCommercialFinal,
    providerPlans,
    providerCommercialConfirmed,
    globalFinalCommercialConfirmed,
    secrets: [...secretSet],
    logLevel,
  };
}

/**
 * Evaluates whether a provider + account combination is permitted for `final` commercial mode.
 *
 * Strict fail-closed policy:
 * - Provider must declare `commercialEligible === true` (unless `allowUnofficialFinal`).
 * - Account plan MUST be an explicit commercial paid tier (`paid_commercial` or `enterprise`).
 * - `free`, `f0`, `unofficial`, and `unknown` are ALWAYS rejected even if `commercialConfirmed=true`.
 */
export function evaluateCommercialEligibility({
  provider,
  capabilities,
  accountPlanTier = ACCOUNT_PLAN_TIERS.UNKNOWN,
  commercialConfirmed = false,
  allowUnofficialFinal = false,
  allowNonCommercialFinal = false,
}) {
  const providerEligible = Boolean(capabilities?.commercialEligible);
  const normalizedPlan = normalizeAccountPlanTier(accountPlanTier, provider);
  const planIsCommercial = COMMERCIAL_ACCOUNT_TIERS.has(normalizedPlan);

  // Fail closed: `commercialConfirmed` NEVER upgrades free/unofficial/unknown into licensed!
  const accountLicensed = providerEligible && planIsCommercial;

  const reasons = [];
  if (!providerEligible && !allowUnofficialFinal) {
    reasons.push(
      `Provider "${provider}" is not commercially eligible for final production (commercialEligible=false).`
    );
  }
  if (providerEligible && !accountLicensed && !allowNonCommercialFinal) {
    reasons.push(
      `Account plan for provider "${provider}" is "${normalizedPlan}" (not a paid commercial tier). Configure a paid commercial plan tier before using mode="final".`
    );
  }

  return {
    allowed: reasons.length === 0,
    providerEligible,
    accountPlanTier: normalizedPlan,
    accountLicensed,
    commercialConfirmed: Boolean(commercialConfirmed),
    reasons,
  };
}
