/**
 * Typed error classes & HTTP error classifier for Kok Iso Yo? TTS Gateway.
 * Errors intentionally exclude raw API keys, tokens, or Authorization headers.
 */

import { redactTTSText } from "./redact.mjs";

export class TTSError extends Error {
  constructor(
    message,
    {
      code = "TTS_ERROR",
      retryable = false,
      provider = null,
      status = null,
      cause = undefined,
      meta = undefined,
    } = {}
  ) {
    super(message);
    this.name = "TTSError";
    this.code = code;
    this.retryable = Boolean(retryable);
    this.provider = provider;
    this.status = status;
    if (cause !== undefined) this.cause = cause;
    if (meta !== undefined) this.meta = meta;
  }
}

export class TTSConfigError extends TTSError {
  constructor(message, { provider = null, meta = undefined } = {}) {
    super(message, { code: "TTS_CONFIG_ERROR", retryable: false, provider, meta });
    this.name = "TTSConfigError";
  }
}

export class TTSLicensePolicyError extends TTSError {
  constructor(message, { provider = null, meta = undefined } = {}) {
    super(message, { code: "TTS_LICENSE_POLICY_ERROR", retryable: false, provider, meta });
    this.name = "TTSLicensePolicyError";
  }
}

export class TTSAuthError extends TTSError {
  constructor(message, { provider = null, status = 401, requestId = "" } = {}) {
    super(message, {
      code: "TTS_AUTH_ERROR",
      retryable: false,
      provider,
      status,
      meta: { status, requestId },
    });
    this.name = "TTSAuthError";
  }
}

export class TTSQuotaExceededError extends TTSError {
  constructor(message, { provider = null, status = 402, requestId = "", detail = "" } = {}) {
    super(message, {
      code: "TTS_QUOTA_EXCEEDED",
      retryable: false,
      provider,
      status,
      meta: { status, requestId, detail },
    });
    this.name = "TTSQuotaExceededError";
  }
}

export class TTSRateLimitError extends TTSError {
  constructor(
    message,
    { provider = null, status = 429, retryAfterMs = null, requestId = "" } = {}
  ) {
    super(message, {
      code: "TTS_RATE_LIMIT",
      retryable: true,
      provider,
      status,
      meta: { status, retryAfterMs, requestId },
    });
    this.name = "TTSRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class TTSTimeoutError extends TTSError {
  constructor(message, { provider = null, timeoutMs = 0, attempt = 1, requestId = "" } = {}) {
    super(message, {
      code: "TTS_TIMEOUT",
      retryable: true,
      provider,
      meta: { timeoutMs, attempt, requestId },
    });
    this.name = "TTSTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export class TTSProviderUnavailableError extends TTSError {
  constructor(
    message,
    { provider = null, status = 503, retryable = true, requestId = "", bodyPreview = "" } = {}
  ) {
    super(message, {
      code: "TTS_PROVIDER_UNAVAILABLE",
      retryable,
      provider,
      status,
      meta: { status, requestId, bodyPreview },
    });
    this.name = "TTSProviderUnavailableError";
  }
}

export class TTSAudioProbeError extends TTSError {
  constructor(message, { reason = "PROBE_FAILED", filePath = "", detail = "" } = {}) {
    super(message, {
      code: "TTS_AUDIO_PROBE_ERROR",
      retryable: false,
      meta: { reason, filePath, detail },
    });
    this.name = "TTSAudioProbeError";
    this.reason = reason;
  }
}

export class TTSDurationOutOfRangeError extends TTSError {
  constructor(message, { actualDurationSec = 0, minSec = 50, maxSec = 65, provider = null } = {}) {
    super(message, {
      code: "TTS_DURATION_OUT_OF_RANGE",
      retryable: false,
      provider,
      meta: { actualDurationSec, minSec, maxSec },
    });
    this.name = "TTSDurationOutOfRangeError";
    this.actualDurationSec = actualDurationSec;
  }
}

function parseRetryAfterMs(retryAfterHeader) {
  if (retryAfterHeader === undefined || retryAfterHeader === null || retryAfterHeader === "") {
    return null;
  }
  const asNum = Number(retryAfterHeader);
  if (Number.isFinite(asNum) && asNum >= 0) {
    return Math.min(Math.trunc(asNum * 1000), 30_000);
  }
  const asDate = Date.parse(String(retryAfterHeader));
  if (Number.isFinite(asDate)) {
    const diff = asDate - Date.now();
    return diff > 0 ? Math.min(diff, 30_000) : 0;
  }
  return null;
}

const QUOTA_TEXT_PATTERN = /(quota|insufficient.?credits|character.?limit|credit.?limit|billing|payment.?required)/i;

/**
 * Classifies an HTTP status + sanitized body preview from any TTS provider into a typed TTSError.
 */
export function classifyHttpTtsError({
  status,
  provider = "unknown",
  bodyPreview = "",
  retryAfterHeader = null,
  requestId = "",
  secrets = [],
}) {
  const code = Number(status || 0);
  const safeBody = redactTTSText(String(bodyPreview || "").slice(0, 240), secrets).slice(0, 200);

  if (code === 401 || code === 403) {
    return new TTSAuthError(
      `TTS provider "${provider}" authentication failed (HTTP ${code}).`,
      { provider, status: code, requestId }
    );
  }

  if (code === 402 || (code === 429 && QUOTA_TEXT_PATTERN.test(safeBody)) || (code === 400 && QUOTA_TEXT_PATTERN.test(safeBody))) {
    return new TTSQuotaExceededError(
      `TTS provider "${provider}" quota or credit limit exhausted (HTTP ${code}).`,
      { provider, status: code, requestId, detail: safeBody }
    );
  }

  if (code === 429) {
    const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
    return new TTSRateLimitError(
      `TTS provider "${provider}" rate limited request (HTTP 429).`,
      { provider, status: 429, retryAfterMs, requestId }
    );
  }

  if (code === 500 || code === 502 || code === 503 || code === 504 || code === 0) {
    return new TTSProviderUnavailableError(
      `TTS provider "${provider}" temporarily unavailable (HTTP ${code || "NETWORK"}).`,
      { provider, status: code, retryable: true, requestId, bodyPreview: safeBody }
    );
  }

  return new TTSError(
    `TTS provider "${provider}" request failed (HTTP ${code}).`,
    {
      code: "TTS_HTTP_ERROR",
      retryable: false,
      provider,
      status: code,
      meta: { status: code, requestId, bodyPreview: safeBody },
    }
  );
}
