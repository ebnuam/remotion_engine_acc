/**
 * 2-Route AI Router (STANDARD / PREMIUM) for Kok Iso Yo? Production Engine.
 *
 * Route Architecture:
 * - STANDARD -> AGYBridge Render (`agybridgeAdapter.mjs`, HTTPS OpenAI-compatible API)
 *               Best for: metadata, captions, hashtags, summaries, SEO, bulk copy, drafts
 * - PREMIUM  -> Antigravity CLI on VPS (`agyCliAdapter.mjs`, local `agy` CLI)
 *               Best for: master scripts, creative direction, 3D storyboards, scene codegen, editorial QA
 *
 * Features:
 * - Explicit tier selection (`tier: "standard" | "premium"`) or task-policy routing (`task: "script_master"`)
 * - Model per route easily swappable via env (`AI_STANDARD_MODEL`, `AI_PREMIUM_MODEL`) anytime
 * - Lazy adapter initialization (using PREMIUM never fails if STANDARD credentials are unset, and vice versa)
 * - Optional safe fallback on transient/timeout failures only (disabled by default via `AI_ROUTER_FALLBACK_ON_TRANSIENT=false`)
 * - Optional `onUsage` telemetry callback for quota/budget tracking
 */

import { createAGYBridgeAdapter } from "./agybridgeAdapter.mjs";
import { createAntigravityCliAdapter } from "./agyCliAdapter.mjs";
import { AI_TIERS, resolveRouterConfig } from "./config.mjs";
import { AIGatewayConfigError } from "./errors.mjs";
import { createSafeLogger } from "./logger.mjs";

function normalizeTier(tier) {
  if (tier === undefined || tier === null || tier === "") return null;
  const s = String(tier).trim().toLowerCase();
  if (s === AI_TIERS.STANDARD || s === "agybridge") return AI_TIERS.STANDARD;
  if (s === AI_TIERS.PREMIUM || s === "antigravity_cli" || s === "agy_cli") return AI_TIERS.PREMIUM;
  throw new AIGatewayConfigError(
    `Invalid AI route tier "${tier}". Expected "${AI_TIERS.STANDARD}" or "${AI_TIERS.PREMIUM}".`
  );
}

export function createAIRouter(options = {}) {
  const env = options.env ?? process.env;
  const envFile = options.envFile;
  const cfg = resolveRouterConfig({ env, envFile, overrides: options });

  const logger =
    options.logger ??
    createSafeLogger({
      level: cfg.logLevel,
      prefix: "[AI-Router]",
      sink: options.logSink ?? null,
    });

  const premiumTaskSet = new Set(cfg.premiumTasks);
  const standardTaskSet = new Set(cfg.standardTasks);

  let standardAdapter = options.standardAdapter ?? null;
  let premiumAdapter = options.premiumAdapter ?? null;

  function getAdapter(tier) {
    if (tier === AI_TIERS.STANDARD) {
      if (!standardAdapter) {
        standardAdapter = createAGYBridgeAdapter({
          env,
          envFile,
          defaultModel: cfg.standardModel || undefined,
          logLevel: cfg.logLevel,
          logSink: options.logSink ?? null,
          ...(options.standardOptions || {}),
        });
      }
      return standardAdapter;
    }

    if (tier === AI_TIERS.PREMIUM) {
      if (!premiumAdapter) {
        premiumAdapter = createAntigravityCliAdapter({
          env,
          envFile,
          defaultModel: cfg.premiumModel || undefined,
          logLevel: cfg.logLevel,
          logSink: options.logSink ?? null,
          ...(options.premiumOptions || {}),
        });
      }
      return premiumAdapter;
    }

    throw new AIGatewayConfigError(`Unsupported tier "${tier}".`);
  }

  function resolveRoute({ tier = undefined, task = undefined, model = undefined } = {}) {
    const explicitTier = normalizeTier(tier);
    const normalizedTask = task ? String(task).trim().toLowerCase() : null;

    let selectedTier = cfg.defaultTier;
    let reason = "default_tier";

    if (explicitTier) {
      selectedTier = explicitTier;
      reason = "explicit_tier";
    } else if (normalizedTask) {
      if (premiumTaskSet.has(normalizedTask)) {
        selectedTier = AI_TIERS.PREMIUM;
        reason = `task_policy:${normalizedTask}`;
      } else if (standardTaskSet.has(normalizedTask)) {
        selectedTier = AI_TIERS.STANDARD;
        reason = `task_policy:${normalizedTask}`;
      } else {
        selectedTier = cfg.defaultTier;
        reason = `task_default:${normalizedTask}`;
      }
    }

    const defaultForTier =
      selectedTier === AI_TIERS.STANDARD ? cfg.standardModel : cfg.premiumModel;
    const resolvedModel = String(model || defaultForTier || "").trim() || null;

    return {
      tier: selectedTier,
      provider: selectedTier === AI_TIERS.STANDARD ? "agybridge" : "antigravity_cli",
      model: resolvedModel,
      task: normalizedTask,
      reason,
    };
  }

  async function runSingleTier(tier, callOpts) {
    const adapter = getAdapter(tier);
    const defaultForTier = tier === AI_TIERS.STANDARD ? cfg.standardModel : cfg.premiumModel;
    const effectiveModel = callOpts.model || defaultForTier || adapter.defaultModel || undefined;
    return adapter.chatCompletion({
      ...callOpts,
      model: effectiveModel,
    });
  }

  function emitUsage(payload) {
    if (typeof options.onUsage !== "function") return;
    try {
      options.onUsage(payload);
    } catch (err) {
      logger.warn("onUsage telemetry callback failed", { error: err?.message || String(err) });
    }
  }

  async function chatCompletion({
    tier = undefined,
    task = undefined,
    model = undefined,
    fallbackModel = undefined,
    allowFallback = undefined,
    messages = [],
    ...rest
  } = {}) {
    const route = resolveRoute({ tier, task, model });
    const canFallback =
      typeof allowFallback === "boolean" ? allowFallback : cfg.fallbackOnTransient;

    logger.info("Routing AI chat completion", {
      tier: route.tier,
      provider: route.provider,
      task: route.task,
      reason: route.reason,
      model: route.model,
    });

    try {
      const response = await runSingleTier(route.tier, {
        ...rest,
        model: model || route.model || undefined,
        messages,
      });

      const routeMeta = {
        tier: route.tier,
        provider: route.provider,
        model: response.model,
        task: route.task,
        reason: route.reason,
        fallbackUsed: false,
      };

      emitUsage({
        ...routeMeta,
        usage: response.usage,
        latencyMs: response.latencyMs,
      });

      return {
        ...response,
        provider: route.provider,
        route: routeMeta,
      };
    } catch (primaryErr) {
      const isRetryable = Boolean(primaryErr?.retryable);
      if (!canFallback || !isRetryable) {
        throw primaryErr;
      }

      const fallbackTier =
        route.tier === AI_TIERS.STANDARD ? AI_TIERS.PREMIUM : AI_TIERS.STANDARD;
      const fallbackProvider =
        fallbackTier === AI_TIERS.STANDARD ? "agybridge" : "antigravity_cli";

      logger.warn("Primary AI route hit transient failure; attempting opt-in fallback", {
        primaryTier: route.tier,
        fallbackTier,
        primaryCode: primaryErr?.code || primaryErr?.name || "ERROR",
        task: route.task,
      });

      const response = await runSingleTier(fallbackTier, {
        ...rest,
        model: fallbackModel || undefined,
        messages,
      });

      const routeMeta = {
        tier: fallbackTier,
        provider: fallbackProvider,
        model: response.model,
        task: route.task,
        reason: `fallback_from:${route.tier}`,
        fallbackUsed: true,
        primaryTier: route.tier,
        primaryErrorCode: primaryErr?.code || primaryErr?.name || "ERROR",
      };

      emitUsage({
        ...routeMeta,
        usage: response.usage,
        latencyMs: response.latencyMs,
      });

      return {
        ...response,
        provider: fallbackProvider,
        route: routeMeta,
      };
    }
  }

  async function listModels({ tier = "all", forceRefresh = false } = {}) {
    if (String(tier).trim().toLowerCase() === "all") {
      const [stdRes, premRes] = await Promise.allSettled([
        getAdapter(AI_TIERS.STANDARD).listModels({ forceRefresh }),
        getAdapter(AI_TIERS.PREMIUM).listModels({ forceRefresh }),
      ]);
      return {
        standard:
          stdRes.status === "fulfilled"
            ? { ok: true, provider: "agybridge", ...stdRes.value }
            : { ok: false, provider: "agybridge", error: stdRes.reason?.message || String(stdRes.reason) },
        premium:
          premRes.status === "fulfilled"
            ? { ok: true, provider: "antigravity_cli", ...premRes.value }
            : { ok: false, provider: "antigravity_cli", error: premRes.reason?.message || String(premRes.reason) },
      };
    }

    const resolvedTier = normalizeTier(tier);
    return getAdapter(resolvedTier).listModels({ forceRefresh });
  }

  async function checkHealth({ tier = "all" } = {}) {
    if (String(tier).trim().toLowerCase() === "all") {
      const [stdRes, premRes] = await Promise.allSettled([
        getAdapter(AI_TIERS.STANDARD).checkHealth(),
        getAdapter(AI_TIERS.PREMIUM).checkHealth(),
      ]);
      const standard =
        stdRes.status === "fulfilled"
          ? { ...stdRes.value, provider: "agybridge" }
          : { ok: false, provider: "agybridge", error: stdRes.reason?.message || String(stdRes.reason) };
      const premium =
        premRes.status === "fulfilled"
          ? { ...premRes.value, provider: "antigravity_cli" }
          : { ok: false, provider: "antigravity_cli", error: premRes.reason?.message || String(premRes.reason) };

      return {
        ok: Boolean(standard.ok && premium.ok),
        standard,
        premium,
      };
    }

    const resolvedTier = normalizeTier(tier);
    return getAdapter(resolvedTier).checkHealth();
  }

  function getConfigSummary() {
    return {
      defaultTier: cfg.defaultTier,
      standardModel: cfg.standardModel || null,
      premiumModel: cfg.premiumModel || null,
      fallbackOnTransient: cfg.fallbackOnTransient,
      premiumTasks: [...premiumTaskSet],
      standardTasks: [...standardTaskSet],
    };
  }

  return {
    tiers: AI_TIERS,
    resolveRoute,
    chatCompletion,
    listModels,
    checkHealth,
    getAdapter,
    getConfigSummary,
  };
}
