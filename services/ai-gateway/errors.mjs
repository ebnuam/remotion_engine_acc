/**
 * Typed error classes for Kok Iso Yo? AI Gateway.
 * Errors intentionally exclude raw API keys, tokens, or Authorization headers.
 */

export class AIGatewayError extends Error {
  constructor(message, { code = "AI_GATEWAY_ERROR", retryable = false, cause = undefined, meta = undefined } = {}) {
    super(message);
    this.name = "AIGatewayError";
    this.code = code;
    this.retryable = retryable;
    if (cause !== undefined) this.cause = cause;
    if (meta !== undefined) this.meta = meta;
  }
}

export class AIGatewayConfigError extends AIGatewayError {
  constructor(message, meta) {
    super(message, { code: "AI_GATEWAY_CONFIG_ERROR", retryable: false, meta });
    this.name = "AIGatewayConfigError";
  }
}

export class AIGatewayAuthError extends AIGatewayError {
  constructor(message, { status = 401, endpoint = "", requestId = "" } = {}) {
    super(message, {
      code: "AI_GATEWAY_AUTH_ERROR",
      retryable: false,
      meta: { status, endpoint, requestId },
    });
    this.name = "AIGatewayAuthError";
    this.status = status;
  }
}

export class AIGatewayTimeoutError extends AIGatewayError {
  constructor(message, { timeoutMs = 0, endpoint = "", attempt = 1, requestId = "" } = {}) {
    super(message, {
      code: "AI_GATEWAY_TIMEOUT",
      retryable: true,
      meta: { timeoutMs, endpoint, attempt, requestId },
    });
    this.name = "AIGatewayTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export class AIGatewayHttpError extends AIGatewayError {
  constructor(message, { status = 500, endpoint = "", retryable = false, requestId = "", bodyPreview = "" } = {}) {
    super(message, {
      code: "AI_GATEWAY_HTTP_ERROR",
      retryable,
      meta: { status, endpoint, requestId, bodyPreview },
    });
    this.name = "AIGatewayHttpError";
    this.status = status;
  }
}

export class AIGatewayInvalidResponseError extends AIGatewayError {
  constructor(message, { endpoint = "", requestId = "", detail = "" } = {}) {
    super(message, {
      code: "AI_GATEWAY_INVALID_RESPONSE",
      retryable: false,
      meta: { endpoint, requestId, detail },
    });
    this.name = "AIGatewayInvalidResponseError";
  }
}

export class AIGatewayModelUnavailableError extends AIGatewayError {
  constructor(model, availableCount = 0) {
    super(`Model "${model}" is not listed in AGYBridge /v1/models (${availableCount} models available).`, {
      code: "AI_GATEWAY_MODEL_UNAVAILABLE",
      retryable: false,
      meta: { model, availableCount },
    });
    this.name = "AIGatewayModelUnavailableError";
    this.model = model;
  }
}
