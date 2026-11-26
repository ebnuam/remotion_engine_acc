/**
 * Isolated AGYBridge Render Adapter (OpenAI-compatible AI Gateway).
 *
 * Features:
 * - Reads base URL & API key from config/env (never hardcoded)
 * - Dynamic model discovery via GET /v1/models (with TTL cache)
 * - OpenAI-compatible chat completions via POST /v1/chat/completions
 * - Per-request AbortController timeout
 * - Limited retry with backoff ONLY on transient failures (429, 502, 503, 504, network/timeout)
 * - Strict response structure validation
 * - Automatic credential redaction in logs and errors
 */

import crypto from "node:crypto";
import { resolveGatewayConfig, validateAGYBridgeConfig } from "./config.mjs";
import {
  AIGatewayAuthError,
  AIGatewayConfigError,
  AIGatewayHttpError,
  AIGatewayInvalidResponseError,
  AIGatewayModelUnavailableError,
  AIGatewayTimeoutError,
} from "./errors.mjs";
import { createSafeLogger, redactText } from "./logger.mjs";

const TRANSIENT_HTTP_STATUSES = new Set([429, 502, 503, 504]);

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeRequestId() {
  return crypto.randomBytes(6).toString("hex");
}

function computeRetryDelayMs(attempt, baseMs, retryAfterHeader) {
  if (retryAfterHeader) {
    const secs = Number(retryAfterHeader);
    if (Number.isFinite(secs) && secs > 0) {
      return Math.min(secs * 1000, 15_000);
    }
  }
  const exp = baseMs * Math.pow(2, attempt - 1);
  return Math.min(exp, 15_000);
}

export function createAGYBridgeAdapter(options = {}) {
  const cfg = resolveGatewayConfig({
    env: options.env ?? process.env,
    envFile: options.envFile,
    overrides: options,
  });
  const parsedBaseUrl = validateAGYBridgeConfig(cfg);

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new AIGatewayConfigError("Global fetch API is unavailable; Node.js >= 18 is required.");
  }

  const sleepImpl = options.sleepImpl ?? defaultSleep;
  const secrets = [cfg.apiKey];
  const logger =
    options.logger ??
    createSafeLogger({
      level: cfg.logLevel,
      secrets,
      prefix: "[AGYBridge]",
      sink: options.logSink ?? null,
    });

  let modelsCache = {
    fetchedAt: 0,
    models: [],
  };

  async function requestJson(endpointPath, { method = "GET", auth = true, body = undefined, timeoutMs = cfg.timeoutMs } = {}) {
    const requestId = makeRequestId();
    const fullUrl = `${cfg.baseUrl}${endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`}`;
    const totalAttempts = cfg.maxRetries + 1;

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const startedAt = Date.now();

      try {
        const headers = {
          Accept: "application/json",
        };
        if (auth) {
          headers.Authorization = `Bearer ${cfg.apiKey}`;
        }
        if (body !== undefined) {
          headers["Content-Type"] = "application/json";
        }

        const resp = await fetchImpl(fullUrl, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const latencyMs = Date.now() - startedAt;
        const rawText = await resp.text();
        clearTimeout(timer);

        if (resp.status === 401 || resp.status === 403) {
          logger.error("Authentication failed", {
            requestId,
            endpoint: endpointPath,
            status: resp.status,
            attempt,
            latencyMs,
          });
          throw new AIGatewayAuthError(
            `AGYBridge authentication failed (HTTP ${resp.status}) on ${endpointPath}.`,
            { status: resp.status, endpoint: endpointPath, requestId }
          );
        }

        if (!resp.ok) {
          const retryable = TRANSIENT_HTTP_STATUSES.has(resp.status);
          const safePreview = redactText(rawText.slice(0, 240), secrets);

          logger.warn("AGYBridge HTTP error", {
            requestId,
            endpoint: endpointPath,
            status: resp.status,
            attempt,
            totalAttempts,
            latencyMs,
            retryable,
          });

          if (retryable && attempt < totalAttempts) {
            const waitMs = computeRetryDelayMs(attempt, cfg.retryBaseMs, resp.headers?.get?.("retry-after"));
            await sleepImpl(waitMs);
            continue;
          }

          throw new AIGatewayHttpError(
            `AGYBridge request failed (HTTP ${resp.status}) on ${endpointPath}.`,
            {
              status: resp.status,
              endpoint: endpointPath,
              retryable,
              requestId,
              bodyPreview: safePreview,
            }
          );
        }

        let data;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          logger.error("Invalid JSON response from AGYBridge", {
            requestId,
            endpoint: endpointPath,
            status: resp.status,
            latencyMs,
          });
          throw new AIGatewayInvalidResponseError(
            `Invalid JSON response received from ${endpointPath}.`,
            {
              endpoint: endpointPath,
              requestId,
              detail: redactText(rawText.slice(0, 160), secrets),
            }
          );
        }

        return {
          status: resp.status,
          latencyMs,
          attempts: attempt,
          requestId,
          data,
        };
      } catch (err) {
        clearTimeout(timer);
        const latencyMs = Date.now() - startedAt;

        if (
          err instanceof AIGatewayAuthError ||
          err instanceof AIGatewayHttpError ||
          err instanceof AIGatewayInvalidResponseError
        ) {
          throw err;
        }

        const isAbort = err?.name === "AbortError" || controller.signal.aborted;
        const safeErrMsg = redactText(err?.message || String(err), secrets);

        logger.warn(isAbort ? "AGYBridge request timed out" : "AGYBridge network error", {
          requestId,
          endpoint: endpointPath,
          attempt,
          totalAttempts,
          latencyMs,
          error: safeErrMsg,
        });

        if (attempt < totalAttempts) {
          const waitMs = computeRetryDelayMs(attempt, cfg.retryBaseMs, null);
          await sleepImpl(waitMs);
          continue;
        }

        if (isAbort) {
          throw new AIGatewayTimeoutError(
            `AGYBridge request timed out after ${timeoutMs}ms on ${endpointPath}.`,
            { timeoutMs, endpoint: endpointPath, attempt, requestId }
          );
        }

        throw new AIGatewayHttpError(
          `AGYBridge network failure on ${endpointPath}: ${safeErrMsg}`,
          { status: 0, endpoint: endpointPath, retryable: true, requestId }
        );
      }
    }

    throw new AIGatewayHttpError(`AGYBridge request exhausted retries on ${endpointPath}.`, {
      status: 0,
      endpoint: endpointPath,
      retryable: true,
    });
  }

  async function checkHealth() {
    const result = await requestJson("/version/info", { method: "GET", auth: false });
    logger.info("AGYBridge health check OK", {
      host: parsedBaseUrl.host,
      status: result.status,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
      version: result.data?.version || "unknown",
    });
    return {
      ok: Boolean(result.data && result.data.success !== false),
      status: result.status,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
      version: result.data?.version || null,
      host: parsedBaseUrl.host,
    };
  }

  async function listModels({ forceRefresh = false } = {}) {
    const now = Date.now();
    if (
      !forceRefresh &&
      cfg.modelsCacheTtlMs > 0 &&
      modelsCache.models.length > 0 &&
      now - modelsCache.fetchedAt < cfg.modelsCacheTtlMs
    ) {
      return {
        models: modelsCache.models,
        cached: true,
        status: 200,
        latencyMs: 0,
        attempts: 0,
      };
    }

    const result = await requestJson("/v1/models", { method: "GET", auth: true });
    if (!result.data || result.data.object !== "list" || !Array.isArray(result.data.data)) {
      throw new AIGatewayInvalidResponseError("Invalid /v1/models response schema (expected OpenAI list).", {
        endpoint: "/v1/models",
        requestId: result.requestId,
      });
    }

    const models = result.data.data
      .filter((m) => m && typeof m.id === "string" && m.id.trim().length > 0)
      .map((m) => ({
        id: m.id.trim(),
        object: m.object || "model",
        ownedBy: m.owned_by || "unknown",
        created: m.created ?? null,
      }));

    modelsCache = {
      fetchedAt: now,
      models,
    };

    logger.info("Fetched AGYBridge models", {
      requestId: result.requestId,
      status: result.status,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
      modelCount: models.length,
    });

    return {
      models,
      cached: false,
      status: result.status,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
    };
  }

  async function assertModelAvailable(model, { forceRefresh = false } = {}) {
    const { models } = await listModels({ forceRefresh });
    const found = models.some((m) => m.id === model);
    if (!found) {
      throw new AIGatewayModelUnavailableError(model, models.length);
    }
    return true;
  }

  async function chatCompletion({
    model = undefined,
    messages = [],
    temperature = undefined,
    maxTokens = undefined,
    topP = undefined,
    verifyModel = cfg.verifyModelAvailable,
    timeoutMs = cfg.timeoutMs,
    extra = {},
  } = {}) {
    const resolvedModel = String(model || cfg.defaultModel || "").trim();
    if (!resolvedModel) {
      throw new AIGatewayConfigError(
        "Model must be specified via options.model or AGYBRIDGE_DEFAULT_MODEL (hardcoding is disabled)."
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new AIGatewayConfigError("chatCompletion requires a non-empty messages array.");
    }

    if (verifyModel) {
      await assertModelAvailable(resolvedModel);
    }

    const payload = {
      ...extra,
      model: resolvedModel,
      messages,
      stream: false,
    };
    if (temperature !== undefined) payload.temperature = temperature;
    if (maxTokens !== undefined) payload.max_tokens = maxTokens;
    if (topP !== undefined) payload.top_p = topP;

    const result = await requestJson("/v1/chat/completions", {
      method: "POST",
      auth: true,
      body: payload,
      timeoutMs,
    });

    const data = result.data;
    if (
      !data ||
      typeof data !== "object" ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0 ||
      !data.choices[0]?.message ||
      typeof data.choices[0].message.content !== "string"
    ) {
      throw new AIGatewayInvalidResponseError(
        "Invalid /v1/chat/completions response schema (missing choices[0].message.content).",
        { endpoint: "/v1/chat/completions", requestId: result.requestId }
      );
    }

    const choice = data.choices[0];
    const usage = data.usage && typeof data.usage === "object"
      ? {
          promptTokens: Number(data.usage.prompt_tokens || 0),
          completionTokens: Number(data.usage.completion_tokens || 0),
          totalTokens: Number(data.usage.total_tokens || 0),
        }
      : { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    logger.info("AGYBridge chat completion succeeded", {
      requestId: result.requestId,
      status: result.status,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
      model: data.model || resolvedModel,
      finishReason: choice.finish_reason || null,
      totalTokens: usage.totalTokens,
    });

    return {
      id: data.id || null,
      object: data.object || "chat.completion",
      model: data.model || resolvedModel,
      content: choice.message.content,
      finishReason: choice.finish_reason || null,
      usage,
      status: result.status,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
      requestId: result.requestId,
      raw: data,
    };
  }

  function clearModelsCache() {
    modelsCache = { fetchedAt: 0, models: [] };
  }

  return {
    provider: "agybridge",
    host: parsedBaseUrl.host,
    defaultModel: cfg.defaultModel || null,
    checkHealth,
    listModels,
    assertModelAvailable,
    chatCompletion,
    clearModelsCache,
  };
}
