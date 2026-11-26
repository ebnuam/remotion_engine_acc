/**
 * Isolated Antigravity CLI (`agy`) Adapter — Jalur PREMIUM (VPS Local).
 *
 * Features:
 * - Zero shell execution (uses `execFile` with explicit argv)
 * - Model discovery via `agy models` with ANSI/spinner stripping & TTL cache
 * - Non-interactive chat completions via `agy --output-format json --print=<prompt>`
 * - Model easily swappable via env (`AI_PREMIUM_MODEL` / `AGY_CLI_DEFAULT_MODEL`) or per-call override
 * - Normalized response schema matching `agybridgeAdapter.mjs`
 * - Bounded retries ONLY on transient failures (timeout, 429/rate-limit, 502/503/504, network hiccups)
 * - Structured safe logging with automatic secret redaction
 */

import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveAgyCliConfig, VALID_EFFORT_LEVELS } from "./config.mjs";
import {
  AIGatewayCliError,
  AIGatewayConfigError,
  AIGatewayInvalidResponseError,
  AIGatewayModelUnavailableError,
  AIGatewayTimeoutError,
} from "./errors.mjs";
import { createSafeLogger, redactText } from "./logger.mjs";

const execFileAsync = promisify(execFile);

const ANSI_PATTERN = /\x1B\[[0-?]*[ -/]*[@-~]/g;
const TRANSIENT_CLI_PATTERN =
  /(rate.?limit|429|502|503|504|temporar|overloaded|econnreset|etimedout|eai_again|timeout|timed out|unavailable|quota exceeded)/i;

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeRequestId() {
  return crypto.randomBytes(6).toString("hex");
}

function computeRetryDelayMs(attempt, baseMs) {
  const exp = baseMs * Math.pow(2, attempt - 1);
  return Math.min(exp, 15_000);
}

/**
 * Strips ANSI escape codes and terminal spinner carriage-return frames.
 */
export function stripTerminalNoise(raw) {
  const noAnsi = String(raw || "").replace(ANSI_PATTERN, "");
  return noAnsi
    .split("\n")
    .map((line) => {
      const parts = line.split("\r");
      return parts[parts.length - 1];
    })
    .join("\n");
}

/**
 * Parses `agy models` stdout into normalized model objects.
 */
export function parseAgyModelsOutput(stdout) {
  const cleaned = stripTerminalNoise(stdout);
  const models = [];
  const seen = new Set();

  for (const rawLine of cleaned.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/Fetching available models/i.test(line)) continue;
    if (/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/.test(line)) continue;

    const match = line.match(/^([a-zA-Z0-9._:/-]+)(?:\s+(.*))?$/);
    if (!match) continue;
    const id = match[1].trim();
    const label = (match[2] || "").trim() || id;
    if (!id || seen.has(id)) continue;
    seen.add(id);

    models.push({
      id,
      label,
      object: "model",
      ownedBy: "antigravity_cli",
    });
  }

  return models;
}

/**
 * Formats OpenAI-style `messages` array into a clean single prompt string for `agy --print`.
 */
export function formatMessagesForCli(messages, systemPrompt = "") {
  const sysParts = [];
  if (typeof systemPrompt === "string" && systemPrompt.trim()) {
    sysParts.push(systemPrompt.trim());
  }

  const turns = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const role = String(msg.role || "user").trim().toLowerCase();
    const content =
      typeof msg.content === "string"
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content
              .map((part) => (typeof part === "string" ? part : part?.text || ""))
              .filter(Boolean)
              .join("\n")
          : String(msg.content ?? "");

    if (!content.trim()) continue;
    if (role === "system" || role === "developer") {
      sysParts.push(content.trim());
    } else {
      turns.push({ role, content: content.trim() });
    }
  }

  if (turns.length === 0 && sysParts.length === 0) {
    throw new AIGatewayConfigError("chatCompletion requires at least one non-empty message.");
  }

  // Fast path: single user message and no system prompt
  if (sysParts.length === 0 && turns.length === 1 && turns[0].role === "user") {
    return turns[0].content;
  }

  const blocks = [];
  if (sysParts.length > 0) {
    blocks.push(`System Instructions:\n${sysParts.join("\n\n")}`);
  }
  if (turns.length === 1 && turns[0].role === "user") {
    blocks.push(`User Request:\n${turns[0].content}`);
  } else {
    const history = turns
      .map((t) => `${t.role === "assistant" ? "Assistant" : "User"}:\n${t.content}`)
      .join("\n\n");
    blocks.push(history);
  }
  return blocks.join("\n\n---\n\n");
}

/**
 * Extracts and validates the JSON payload printed by `agy --output-format json`.
 */
export function parseAgyJsonOutput(stdout, requestId = "") {
  const cleaned = stripTerminalNoise(stdout).trim();
  if (!cleaned) {
    throw new AIGatewayInvalidResponseError("Empty stdout returned by agy CLI.", {
      endpoint: "agy --print",
      requestId,
    });
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: locate the last JSON object line/block if CLI emitted preamble lines
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(candidate);
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AIGatewayInvalidResponseError("Invalid JSON response received from agy CLI.", {
      endpoint: "agy --print",
      requestId,
      detail: cleaned.slice(0, 180),
    });
  }

  return parsed;
}

export function createAntigravityCliAdapter(options = {}) {
  const cfg = resolveAgyCliConfig({
    env: options.env ?? process.env,
    envFile: options.envFile,
    overrides: options,
  });

  const execFileImpl = options.execFileImpl ?? execFileAsync;
  const sleepImpl = options.sleepImpl ?? defaultSleep;
  const secrets = Array.isArray(options.secrets) ? options.secrets : [];
  const logger =
    options.logger ??
    createSafeLogger({
      level: cfg.logLevel,
      secrets,
      prefix: "[AGY-CLI]",
      sink: options.logSink ?? null,
    });

  let modelsCache = {
    fetchedAt: 0,
    models: [],
  };

  async function checkHealth() {
    const startedAt = Date.now();
    try {
      const { stdout } = await execFileImpl(cfg.bin, ["--version"], {
        timeout: 10_000,
        cwd: cfg.cwd,
        maxBuffer: 1024 * 1024,
      });
      const version = stripTerminalNoise(stdout).trim().split("\n")[0] || null;
      const latencyMs = Date.now() - startedAt;
      logger.info("AGY CLI health check OK", { bin: cfg.bin, version, latencyMs });
      return {
        ok: Boolean(version),
        provider: "antigravity_cli",
        bin: cfg.bin,
        version,
        status: 200,
        latencyMs,
        attempts: 1,
      };
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      const msg = redactText(err?.stderr || err?.message || String(err), secrets);
      logger.error("AGY CLI health check failed", { bin: cfg.bin, latencyMs, error: msg.slice(0, 200) });
      throw new AIGatewayCliError(`AGY CLI health check failed: ${msg.slice(0, 200)}`, {
        exitCode: err?.code ?? null,
        retryable: false,
        stderrPreview: msg.slice(0, 200),
      });
    }
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

    const requestId = makeRequestId();
    const startedAt = Date.now();
    try {
      const { stdout } = await execFileImpl(cfg.bin, ["models"], {
        timeout: 20_000,
        cwd: cfg.cwd,
        maxBuffer: 2 * 1024 * 1024,
      });
      const latencyMs = Date.now() - startedAt;
      const models = parseAgyModelsOutput(stdout);

      modelsCache = {
        fetchedAt: Date.now(),
        models,
      };

      logger.info("Fetched AGY CLI models", {
        requestId,
        latencyMs,
        modelCount: models.length,
      });

      return {
        models,
        cached: false,
        status: 200,
        latencyMs,
        attempts: 1,
      };
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      const isTimeout = Boolean(err?.killed) || err?.signal === "SIGTERM" || /timed out/i.test(err?.message || "");
      const safeErr = redactText(err?.stderr || err?.message || String(err), secrets);

      logger.error("Failed to list AGY CLI models", {
        requestId,
        latencyMs,
        error: safeErr.slice(0, 200),
      });

      if (isTimeout) {
        throw new AIGatewayTimeoutError("AGY CLI `agy models` timed out.", {
          timeoutMs: 20_000,
          endpoint: "agy models",
          requestId,
        });
      }

      throw new AIGatewayCliError(`AGY CLI \`agy models\` failed: ${safeErr.slice(0, 200)}`, {
        exitCode: err?.code ?? null,
        retryable: TRANSIENT_CLI_PATTERN.test(safeErr),
        requestId,
        stderrPreview: safeErr.slice(0, 200),
      });
    }
  }

  async function assertModelAvailable(model, { forceRefresh = false } = {}) {
    const { models } = await listModels({ forceRefresh });
    const found = models.some((m) => m.id === model);
    if (!found) {
      throw new AIGatewayModelUnavailableError(model, models.length, "Antigravity CLI (agy models)");
    }
    return true;
  }

  async function chatCompletion({
    model = undefined,
    messages = [],
    systemPrompt = "",
    effort = undefined,
    jsonSchema = undefined,
    verifyModel = cfg.verifyModelAvailable,
    timeoutMs = cfg.timeoutMs,
    cwd = cfg.cwd,
    disableSlashCommands = cfg.disableSlashCommands,
  } = {}) {
    const resolvedModel = String(model || cfg.defaultModel || "").trim();
    if (!resolvedModel) {
      throw new AIGatewayConfigError(
        "Model must be specified via options.model or AI_PREMIUM_MODEL / AGY_CLI_DEFAULT_MODEL."
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new AIGatewayConfigError("chatCompletion requires a non-empty messages array.");
    }

    const resolvedEffort = String(effort || cfg.defaultEffort || "").trim().toLowerCase();
    if (resolvedEffort && !VALID_EFFORT_LEVELS.has(resolvedEffort)) {
      throw new AIGatewayConfigError(
        `Invalid effort "${resolvedEffort}". Expected one of: ${[...VALID_EFFORT_LEVELS].join(", ")}.`
      );
    }

    const promptText = formatMessagesForCli(messages, systemPrompt);

    if (verifyModel) {
      await assertModelAvailable(resolvedModel);
    }

    const timeoutSec = Math.max(1, Math.ceil(timeoutMs / 1000));
    const args = ["--output-format", "json"];
    if (disableSlashCommands) {
      args.push("--disable-slash-commands");
    }
    args.push("--model", resolvedModel);
    if (resolvedEffort) {
      args.push("--effort", resolvedEffort);
    }
    if (jsonSchema !== undefined && jsonSchema !== null) {
      args.push(
        "--json-schema",
        typeof jsonSchema === "string" ? jsonSchema : JSON.stringify(jsonSchema)
      );
    }
    args.push("--print-timeout", `${timeoutSec}s`);
    args.push(`--print=${promptText}`);

    const requestId = makeRequestId();
    const totalAttempts = cfg.maxRetries + 1;

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
      const startedAt = Date.now();
      try {
        const { stdout } = await execFileImpl(cfg.bin, args, {
          cwd,
          timeout: timeoutMs + 5_000,
          maxBuffer: 16 * 1024 * 1024,
        });
        const latencyMs = Date.now() - startedAt;
        const parsed = parseAgyJsonOutput(stdout, requestId);

        const statusStr = String(parsed.status || "").toUpperCase();
        if (statusStr !== "SUCCESS" || typeof parsed.response !== "string") {
          const detail = redactText(
            String(parsed.error || parsed.message || `status=${parsed.status || "unknown"}`),
            secrets
          );
          const retryable = TRANSIENT_CLI_PATTERN.test(detail);
          if (retryable && attempt < totalAttempts) {
            logger.warn("AGY CLI returned non-SUCCESS transient status, retrying", {
              requestId,
              model: resolvedModel,
              attempt,
              totalAttempts,
              status: statusStr,
            });
            await sleepImpl(computeRetryDelayMs(attempt, cfg.retryBaseMs));
            continue;
          }
          throw new AIGatewayInvalidResponseError(
            `AGY CLI returned non-SUCCESS response (${detail.slice(0, 160)}).`,
            { endpoint: "agy --print", requestId, detail: detail.slice(0, 160) }
          );
        }

        const rawUsage = parsed.usage && typeof parsed.usage === "object" ? parsed.usage : {};
        const usage = {
          promptTokens: Number(rawUsage.input_tokens || 0),
          completionTokens: Number(rawUsage.output_tokens || 0),
          thinkingTokens: Number(rawUsage.thinking_tokens || 0),
          cacheReadTokens: Number(rawUsage.cache_read_tokens || 0),
          totalTokens: Number(
            rawUsage.total_tokens ||
              Number(rawUsage.input_tokens || 0) + Number(rawUsage.output_tokens || 0)
          ),
        };

        logger.info("AGY CLI chat completion succeeded", {
          requestId,
          model: resolvedModel,
          effort: resolvedEffort || null,
          latencyMs,
          attempts: attempt,
          totalTokens: usage.totalTokens,
        });

        return {
          id: parsed.conversation_id || null,
          object: "chat.completion",
          provider: "antigravity_cli",
          model: resolvedModel,
          content: parsed.response.trimEnd(),
          finishReason: "stop",
          usage,
          status: 200,
          latencyMs,
          durationSeconds:
            typeof parsed.duration_seconds === "number" ? parsed.duration_seconds : null,
          attempts: attempt,
          requestId,
          raw: parsed,
        };
      } catch (err) {
        const latencyMs = Date.now() - startedAt;

        if (
          err instanceof AIGatewayConfigError ||
          err instanceof AIGatewayInvalidResponseError ||
          err instanceof AIGatewayModelUnavailableError
        ) {
          throw err;
        }

        const rawDetail = `${err?.stderr || ""}\n${err?.stdout || ""}\n${err?.message || ""}`;
        const safeDetail = redactText(rawDetail.trim(), secrets);
        const isTimeout =
          Boolean(err?.killed) ||
          err?.signal === "SIGTERM" ||
          /timed out|timeout|context deadline exceeded/i.test(safeDetail);
        const retryable = isTimeout || TRANSIENT_CLI_PATTERN.test(safeDetail);

        logger.warn(isTimeout ? "AGY CLI request timed out" : "AGY CLI execution error", {
          requestId,
          model: resolvedModel,
          attempt,
          totalAttempts,
          latencyMs,
          retryable,
          exitCode: err?.code ?? null,
        });

        if (retryable && attempt < totalAttempts) {
          await sleepImpl(computeRetryDelayMs(attempt, cfg.retryBaseMs));
          continue;
        }

        if (isTimeout) {
          throw new AIGatewayTimeoutError(
            `AGY CLI request timed out after ${timeoutMs}ms (model "${resolvedModel}").`,
            { timeoutMs, endpoint: "agy --print", attempt, requestId }
          );
        }

        throw new AIGatewayCliError(
          `AGY CLI chatCompletion failed for model "${resolvedModel}": ${safeDetail.slice(0, 220)}`,
          {
            exitCode: err?.code ?? null,
            retryable,
            requestId,
            stderrPreview: safeDetail.slice(0, 220),
          }
        );
      }
    }

    throw new AIGatewayCliError("AGY CLI chatCompletion exhausted retries.", {
      retryable: true,
      requestId,
    });
  }

  function clearModelsCache() {
    modelsCache = { fetchedAt: 0, models: [] };
  }

  return {
    provider: "antigravity_cli",
    bin: cfg.bin,
    defaultModel: cfg.defaultModel || null,
    defaultEffort: cfg.defaultEffort || null,
    checkHealth,
    listModels,
    assertModelAvailable,
    chatCompletion,
    clearModelsCache,
  };
}
