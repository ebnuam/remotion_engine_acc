/**
 * Kok Iso Yo? Multi-Provider TTS Router (2-Mode: `draft` vs `final`).
 *
 * Core guarantees:
 * - Single uniform public interface across all TTS providers (`synthesize`, `getCapabilities`,
 *   `validateConfig`, `estimateCost`).
 * - Strict fail-closed separation between provider commercial eligibility and account commercial plan status.
 * - Deterministic text normalization + full-parameter SHA-256 atomic concurrent-safe cache.
 * - Pre-commit `ffprobe` validation (corrupt/invalid audio NEVER poisons cache or outputDir;
 *   corrupt cached entries on disk are automatically evicted and regenerated).
 * - Bounded retry ONLY on transient/retryable errors (429 honoring Retry-After incl. 0, 502/503/504, timeout).
 * - Zero secret leakage in logs, rethrown errors, or persisted metadata.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { probeAudioFile } from "./audioProbe.mjs";
import {
  assertPathContained,
  atomicCopyFile,
  atomicWriteFile,
  computeTTSCacheKey,
  createTTSCache,
  sanitizeCacheMetadata,
} from "./cache.mjs";
import {
  TTS_MODES,
  evaluateCommercialEligibility,
  resolveTTSConfig,
} from "./config.mjs";
import {
  TTSAudioProbeError,
  TTSConfigError,
  TTSDurationOutOfRangeError,
  TTSLicensePolicyError,
  TTSTimeoutError,
} from "./errors.mjs";
import { createTTSSafeLogger, redactTTSText, sanitizeTTSError } from "./redact.mjs";
import { normalizeTextForTTS } from "./textNormalizer.mjs";

const VALID_MODES = new Set(Object.values(TTS_MODES));
const VALID_FORMATS = new Set(["mp3", "wav"]);
const SAFE_FILE_STEM_RE = /^[a-zA-Z0-9._-]+$/;

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeRequestId() {
  return crypto.randomBytes(6).toString("hex");
}

function computeBackoffMs(attempt, baseMs, retryAfterMs = null) {
  if (retryAfterMs !== null && Number.isFinite(retryAfterMs) && retryAfterMs >= 0) {
    return Math.min(retryAfterMs, 30_000);
  }
  return Math.min(baseMs * Math.pow(2, attempt - 1), 15_000);
}

function sanitizeFileStem(fileStem) {
  const s = String(fileStem || "").trim();
  if (!s || s === "." || s === ".." || s.includes("..") || !SAFE_FILE_STEM_RE.test(s)) {
    throw new TTSConfigError(
      `Invalid fileStem "${s.slice(0, 40)}": only [a-zA-Z0-9._-] without path traversal is allowed.`
    );
  }
  return s;
}

function validateAdapterShape(name, adapter) {
  if (!adapter || typeof adapter !== "object") {
    throw new TTSConfigError(`Invalid TTS provider adapter "${name}": expected an object.`);
  }
  for (const fn of ["getCapabilities", "validateConfig", "synthesize"]) {
    if (typeof adapter[fn] !== "function") {
      throw new TTSConfigError(
        `Invalid TTS provider adapter "${name}": missing required method "${fn}()".`
      );
    }
  }
}

export function createTTSRouter(options = {}) {
  const env = options.env ?? process.env;
  const envFile = options.envFile;
  const cfg = resolveTTSConfig({ env, envFile, overrides: options });

  const sleepImpl = options.sleepImpl ?? defaultSleep;
  const probeImpl = options.probeImpl ?? probeAudioFile;

  const logger =
    options.logger ??
    createTTSSafeLogger({
      level: cfg.logLevel,
      secrets: cfg.secrets,
      prefix: "[TTS-Router]",
      sink: options.logSink ?? null,
    });

  const registry = new Map();
  if (options.providers && typeof options.providers === "object") {
    for (const [name, adapter] of Object.entries(options.providers)) {
      const normalized = String(name || "").trim().toLowerCase();
      validateAdapterShape(normalized, adapter);
      registry.set(normalized, adapter);
    }
  }

  const cache =
    options.cache ??
    createTTSCache({
      cacheDir: cfg.cacheDir,
      secrets: cfg.secrets,
      sleepImpl,
    });

  function registerProvider(name, adapter) {
    const normalized = String(name || "").trim().toLowerCase();
    if (!normalized) {
      throw new TTSConfigError("Provider name must be a non-empty string.");
    }
    validateAdapterShape(normalized, adapter);
    registry.set(normalized, adapter);
    return normalized;
  }

  function listProviders() {
    return [...registry.keys()];
  }

  function resolveProviderName({ mode = undefined, provider = undefined } = {}) {
    const resolvedMode = String(mode || cfg.defaultMode).trim().toLowerCase();
    if (!VALID_MODES.has(resolvedMode)) {
      throw new TTSConfigError(
        `Invalid TTS mode "${resolvedMode}". Expected "${TTS_MODES.DRAFT}" or "${TTS_MODES.FINAL}".`
      );
    }

    const chosen = String(
      provider ||
        (resolvedMode === TTS_MODES.DRAFT ? cfg.draftProvider : cfg.finalProvider) ||
        ""
    )
      .trim()
      .toLowerCase();

    if (!chosen) {
      throw new TTSConfigError(
        `No TTS provider configured for mode "${resolvedMode}". Set TTS_${resolvedMode.toUpperCase()}_PROVIDER.`
      );
    }

    return { mode: resolvedMode, providerName: chosen };
  }

  function getAdapterOrThrow(providerName) {
    const adapter = registry.get(providerName);
    if (!adapter) {
      const available = listProviders();
      throw new TTSConfigError(
        `TTS provider "${providerName}" is not registered or unavailable (registered: ${available.length ? available.join(", ") : "none"}).`,
        { provider: providerName }
      );
    }
    return adapter;
  }

  function checkCommercialPolicy(providerName, capabilities) {
    const accountPlanTier = cfg.providerPlans[providerName] || "unknown";
    const confirmed =
      cfg.providerCommercialConfirmed[providerName] !== undefined
        ? Boolean(cfg.providerCommercialConfirmed[providerName])
        : cfg.globalFinalCommercialConfirmed;

    return evaluateCommercialEligibility({
      provider: providerName,
      capabilities,
      accountPlanTier,
      commercialConfirmed: confirmed,
      allowUnofficialFinal: cfg.allowUnofficialFinal,
      allowNonCommercialFinal: cfg.allowNonCommercialFinal,
    });
  }

  function getCapabilities({ mode = undefined, provider = undefined } = {}) {
    const { mode: resolvedMode, providerName } = resolveProviderName({ mode, provider });
    const adapter = getAdapterOrThrow(providerName);
    const caps = adapter.getCapabilities();
    const license = checkCommercialPolicy(providerName, caps);
    return {
      ...caps,
      provider: providerName,
      mode: resolvedMode,
      commercialPolicy: license,
    };
  }

  function validateConfig({ mode = undefined, provider = undefined } = {}) {
    const errors = [];
    let resolved;
    try {
      resolved = resolveProviderName({ mode, provider });
    } catch (err) {
      return { ok: false, errors: [redactTTSText(err.message, cfg.secrets)] };
    }

    let adapter;
    try {
      adapter = getAdapterOrThrow(resolved.providerName);
    } catch (err) {
      return {
        ok: false,
        mode: resolved.mode,
        provider: resolved.providerName,
        errors: [redactTTSText(err.message, cfg.secrets)],
      };
    }

    const adapterCheck = adapter.validateConfig();
    if (!adapterCheck?.ok) {
      errors.push(
        ...(adapterCheck?.errors || [`Provider "${resolved.providerName}" config invalid.`]).map(
          (m) => redactTTSText(String(m), cfg.secrets)
        )
      );
    }

    const caps = adapter.getCapabilities();
    const policy = checkCommercialPolicy(resolved.providerName, caps);
    if (resolved.mode === TTS_MODES.FINAL && !policy.allowed) {
      errors.push(...policy.reasons);
    }

    return {
      ok: errors.length === 0,
      mode: resolved.mode,
      provider: resolved.providerName,
      capabilities: caps,
      commercialPolicy: policy,
      errors,
    };
  }

  function estimateCost({ mode = undefined, provider = undefined, text = "" } = {}) {
    const { mode: resolvedMode, providerName } = resolveProviderName({ mode, provider });
    const adapter = getAdapterOrThrow(providerName);
    const norm = normalizeTextForTTS(text);
    const est =
      typeof adapter.estimateCost === "function"
        ? adapter.estimateCost(norm.normalizedCharCount)
        : { estimatedCostUsd: null, basis: "unavailable" };

    return {
      provider: providerName,
      mode: resolvedMode,
      rawCharCount: norm.rawCharCount,
      normalizedCharCount: norm.normalizedCharCount,
      ...est,
    };
  }

  function getConfigSummary() {
    return {
      defaultMode: cfg.defaultMode,
      draftProvider: cfg.draftProvider || null,
      finalProvider: cfg.finalProvider || null,
      registeredProviders: listProviders(),
      defaultLanguage: cfg.defaultLanguage,
      defaultFormat: cfg.defaultFormat,
      timeoutMs: cfg.timeoutMs,
      maxRetries: cfg.maxRetries,
      targetWindowSec: [cfg.targetMinSec, cfg.targetMaxSec],
      enforceDurationWindow: cfg.enforceDurationWindow,
      cacheEnabled: cfg.cacheEnabled,
      cacheDir: cfg.cacheDir,
      providerPlans: { ...cfg.providerPlans },
    };
  }

  async function executeWithRetry(providerName, fn, { timeoutMs, maxRetries, requestId }) {
    const totalAttempts = maxRetries + 1;

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
      let timer = null;
      const controller = new AbortController();
      const attemptPromise = Promise.resolve().then(() =>
        fn({ attempt, requestId, timeoutMs, signal: controller.signal })
      );
      // Prevent UnhandledPromiseRejection if attemptPromise rejects after timeout wins Promise.race
      attemptPromise.catch(() => {});

      try {
        const result = await Promise.race([
          attemptPromise,
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(
                new TTSTimeoutError(
                  `TTS provider "${providerName}" timed out after ${timeoutMs}ms.`,
                  { provider: providerName, timeoutMs, attempt, requestId }
                )
              );
            }, timeoutMs);
          }),
        ]);
        if (timer) clearTimeout(timer);
        return { result, attempts: attempt };
      } catch (err) {
        if (timer) clearTimeout(timer);

        const safeErr = sanitizeTTSError(err, cfg.secrets);
        const retryable = Boolean(safeErr?.retryable);
        const safeMsg = redactTTSText(safeErr?.message || String(safeErr), cfg.secrets);

        logger.warn("TTS provider attempt failed", {
          requestId,
          provider: providerName,
          attempt,
          totalAttempts,
          code: safeErr?.code || safeErr?.name || "ERROR",
          retryable,
          error: safeMsg.slice(0, 180),
        });

        if (!retryable || attempt >= totalAttempts) {
          throw safeErr;
        }

        const waitMs = computeBackoffMs(attempt, cfg.retryBaseMs, safeErr?.retryAfterMs ?? null);
        await sleepImpl(waitMs);
      }
    }

    throw new TTSConfigError(`TTS provider "${providerName}" exhausted retry loop.`, {
      provider: providerName,
    });
  }

  function emitUsage(payload) {
    if (typeof options.onUsage !== "function") return;
    try {
      options.onUsage(payload);
    } catch (err) {
      logger.warn("onUsage telemetry callback failed", {
        error: redactTTSText(err?.message || String(err), cfg.secrets),
      });
    }
  }

  /**
   * Probes an in-memory audio buffer via a private temp file BEFORE committing to cache or outputDir.
   * Ensures corrupt/invalid/out-of-range audio NEVER poisons the cache or leaves files in outputDir.
   */
  async function probeBufferBeforeCommit(audioBuffer, fmt, { minSec, maxSec, enforceDurationWindow, providerName }) {
    const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), "kokisoyo-tts-probe-"));
    const tmpAudio = path.join(stageDir, `candidate.${fmt}`);
    try {
      atomicWriteFile(tmpAudio, audioBuffer);
      const audioInfo = await probeImpl(tmpAudio, {
        ffprobeBin: cfg.ffprobeBin,
        timeoutMs: cfg.ffprobeTimeoutMs,
        minSec,
        maxSec,
        secrets: cfg.secrets,
      });

      if (enforceDurationWindow && !audioInfo.withinTargetWindow) {
        throw new TTSDurationOutOfRangeError(
          `Measured TTS audio duration ${audioInfo.actualDurationSec}s is outside target window ${minSec}–${maxSec}s.`,
          {
            actualDurationSec: audioInfo.actualDurationSec,
            minSec,
            maxSec,
            provider: providerName,
          }
        );
      }
      return audioInfo;
    } finally {
      try {
        fs.rmSync(stageDir, { recursive: true, force: true });
      } catch {
        // ignore temp cleanup errors
      }
    }
  }

  async function synthesize({
    text,
    mode = undefined,
    provider = undefined,
    language = cfg.defaultLanguage,
    voice = undefined,
    model = undefined,
    rate = "+0%",
    pitch = "+0Hz",
    prosody = null,
    outputFormat = cfg.defaultFormat,
    outputDir,
    fileStem = "voiceover",
    normalizeText = true,
    useCache = cfg.cacheEnabled,
    timeoutMs = cfg.timeoutMs,
    maxRetries = cfg.maxRetries,
    enforceDurationWindow = cfg.enforceDurationWindow,
    targetMinSec = cfg.targetMinSec,
    targetMaxSec = cfg.targetMaxSec,
  } = {}) {
    if (typeof text !== "string" || !text.trim()) {
      throw new TTSConfigError("synthesize() requires a non-empty `text` string.");
    }
    if (!outputDir || typeof outputDir !== "string") {
      throw new TTSConfigError("synthesize() requires an `outputDir` path.");
    }

    const safeStem = sanitizeFileStem(fileStem);
    const fmt = String(outputFormat || cfg.defaultFormat).trim().toLowerCase();
    if (!VALID_FORMATS.has(fmt)) {
      throw new TTSConfigError(`Unsupported TTS outputFormat "${fmt}". Expected "mp3" or "wav".`);
    }

    const { mode: resolvedMode, providerName } = resolveProviderName({ mode, provider });
    const adapter = getAdapterOrThrow(providerName);

    const configCheck = adapter.validateConfig();
    if (!configCheck?.ok) {
      throw new TTSConfigError(
        `TTS provider "${providerName}" configuration invalid: ${redactTTSText(
          (configCheck?.errors || []).join("; "),
          cfg.secrets
        )}`,
        { provider: providerName }
      );
    }

    const caps = adapter.getCapabilities();
    if (Array.isArray(caps.supportedFormats) && !caps.supportedFormats.includes(fmt)) {
      throw new TTSConfigError(
        `TTS provider "${providerName}" does not support outputFormat "${fmt}" (supported: ${caps.supportedFormats.join(", ")}).`,
        { provider: providerName }
      );
    }

    // Strict fail-closed license gate for `final` mode
    const commercialPolicy = checkCommercialPolicy(providerName, caps);
    if (resolvedMode === TTS_MODES.FINAL && !commercialPolicy.allowed) {
      throw new TTSLicensePolicyError(commercialPolicy.reasons.join(" "), {
        provider: providerName,
        meta: commercialPolicy,
      });
    }

    const norm = normalizeTextForTTS(text, { enabled: normalizeText });
    if (caps.maxCharsPerRequest && norm.normalizedCharCount > caps.maxCharsPerRequest) {
      throw new TTSConfigError(
        `Normalized text length (${norm.normalizedCharCount}) exceeds provider "${providerName}" limit (${caps.maxCharsPerRequest}).`,
        { provider: providerName }
      );
    }

    const resolvedVoice = String(voice || caps.defaultVoice || "").trim();
    const resolvedModel = String(model || caps.defaultModel || "").trim();
    const providerVersion = String(caps.providerVersion || "1").trim();

    const cacheKey = computeTTSCacheKey({
      provider: providerName,
      model: resolvedModel,
      providerVersion,
      voice: resolvedVoice,
      language,
      rate,
      pitch,
      outputFormat: fmt,
      prosody,
      normalizerVersion: norm.normalizerVersion,
      normalizedText: norm.normalizedText,
    });

    const requestId = makeRequestId();
    const startedAt = Date.now();
    let attempts = 0;
    let cached = false;
    let sourceAudioPath = null;
    let sourceWordsPath = null;
    let providerExtraMeta = {};
    let audioInfo = null;

    const produceValidatedFresh = async () => {
      const { result, attempts: usedAttempts } = await executeWithRetry(
        providerName,
        ({ attempt, requestId: reqId, timeoutMs: reqTimeout, signal }) =>
          adapter.synthesize({
            text: norm.normalizedText,
            originalText: norm.originalText,
            language,
            voice: resolvedVoice,
            model: resolvedModel,
            rate,
            pitch,
            prosody,
            outputFormat: fmt,
            timeoutMs: reqTimeout,
            signal,
            attempt,
            requestId: reqId,
          }),
        { timeoutMs, maxRetries, requestId }
      );
      attempts = usedAttempts;

      let audioBuffer = null;
      if (Buffer.isBuffer(result?.audioBuffer)) {
        audioBuffer = result.audioBuffer;
      } else if (result?.audioPath && fs.existsSync(result.audioPath)) {
        audioBuffer = fs.readFileSync(result.audioPath);
      }
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new TTSConfigError(
          `TTS provider "${providerName}" returned empty audio payload.`,
          { provider: providerName }
        );
      }

      // CRITICAL: Probe & validate audio BEFORE writing to cache or outputDir!
      const validatedInfo = await probeBufferBeforeCommit(audioBuffer, fmt, {
        minSec: targetMinSec,
        maxSec: targetMaxSec,
        enforceDurationWindow,
        providerName,
      });

      return {
        audioBuffer,
        audioInfo: validatedInfo,
        words: Array.isArray(result.words) ? result.words : null,
        meta: {
          provider: providerName,
          model: result.model || resolvedModel || null,
          providerVersion,
          voice: result.voice || resolvedVoice || null,
          language,
          rate,
          pitch,
          prosody,
          outputFormat: fmt,
          normalizerVersion: norm.normalizerVersion,
          appliedNormalizationRules: norm.appliedRules,
          rawCharCount: norm.rawCharCount,
          normalizedCharCount: norm.normalizedCharCount,
        },
        producerMeta: sanitizeCacheMetadata(result.providerMeta || {}, cfg.secrets),
      };
    };

    if (useCache) {
      let cacheOutcome = await cache.getOrCreate({
        cacheKey,
        outputFormat: fmt,
        producer: produceValidatedFresh,
      });

      cached = cacheOutcome.hit;
      sourceAudioPath = cacheOutcome.entry.audioPath;
      sourceWordsPath = cacheOutcome.entry.wordsPath;
      providerExtraMeta = sanitizeCacheMetadata(
        cacheOutcome.producerMeta || cacheOutcome.entry.meta?.providerMeta || {},
        cfg.secrets
      );

      // Always verify cached audio on disk via ffprobe; evict & regenerate once if disk file corrupted
      try {
        audioInfo = await probeImpl(sourceAudioPath, {
          ffprobeBin: cfg.ffprobeBin,
          timeoutMs: cfg.ffprobeTimeoutMs,
          minSec: targetMinSec,
          maxSec: targetMaxSec,
          secrets: cfg.secrets,
        });
      } catch (probeErr) {
        if (cached && probeErr instanceof TTSAudioProbeError) {
          logger.warn("Cached TTS audio failed ffprobe; evicting corrupt entry and regenerating", {
            requestId,
            cacheKey,
            reason: probeErr.reason,
          });
          cache.invalidateEntry(cacheKey, fmt);
          cacheOutcome = await cache.getOrCreate({
            cacheKey,
            outputFormat: fmt,
            producer: produceValidatedFresh,
          });
          cached = cacheOutcome.hit;
          sourceAudioPath = cacheOutcome.entry.audioPath;
          sourceWordsPath = cacheOutcome.entry.wordsPath;
          providerExtraMeta = sanitizeCacheMetadata(
            cacheOutcome.producerMeta || cacheOutcome.entry.meta?.providerMeta || {},
            cfg.secrets
          );
          audioInfo =
            cacheOutcome.audioInfo ||
            (await probeImpl(sourceAudioPath, {
              ffprobeBin: cfg.ffprobeBin,
              timeoutMs: cfg.ffprobeTimeoutMs,
              minSec: targetMinSec,
              maxSec: targetMaxSec,
              secrets: cfg.secrets,
            }));
        } else {
          throw sanitizeTTSError(probeErr, cfg.secrets);
        }
      }

      if (enforceDurationWindow && !audioInfo.withinTargetWindow) {
        throw new TTSDurationOutOfRangeError(
          `Measured TTS audio duration ${audioInfo.actualDurationSec}s is outside target window ${targetMinSec}–${targetMaxSec}s.`,
          {
            actualDurationSec: audioInfo.actualDurationSec,
            minSec: targetMinSec,
            maxSec: targetMaxSec,
            provider: providerName,
          }
        );
      }
    } else {
      const fresh = await produceValidatedFresh();
      audioInfo = fresh.audioInfo;
      providerExtraMeta = fresh.producerMeta;

      const resolvedOutDir = path.resolve(outputDir);
      fs.mkdirSync(resolvedOutDir, { recursive: true });
      const directAudio = assertPathContained(
        resolvedOutDir,
        path.join(resolvedOutDir, `${safeStem}.${fmt}`),
        "output audio"
      );
      atomicWriteFile(directAudio, fresh.audioBuffer);
      sourceAudioPath = directAudio;

      if (fresh.words && fresh.words.length > 0) {
        const directWords = assertPathContained(
          resolvedOutDir,
          path.join(resolvedOutDir, `${safeStem}.words.json`),
          "output words"
        );
        atomicWriteFile(directWords, JSON.stringify(fresh.words, null, 2));
        sourceWordsPath = directWords;
      }
    }

    // Materialize validated artifacts atomically inside outputDir
    const resolvedOutDir = path.resolve(outputDir);
    fs.mkdirSync(resolvedOutDir, { recursive: true });
    const finalAudioPath = assertPathContained(
      resolvedOutDir,
      path.join(resolvedOutDir, `${safeStem}.${fmt}`),
      "output audio"
    );
    if (path.resolve(sourceAudioPath) !== path.resolve(finalAudioPath)) {
      atomicCopyFile(sourceAudioPath, finalAudioPath);
    }

    let finalWordsPath = null;
    if (sourceWordsPath && fs.existsSync(sourceWordsPath)) {
      finalWordsPath = assertPathContained(
        resolvedOutDir,
        path.join(resolvedOutDir, `${safeStem}.words.json`),
        "output words"
      );
      if (path.resolve(sourceWordsPath) !== path.resolve(finalWordsPath)) {
        atomicCopyFile(sourceWordsPath, finalWordsPath);
      }
    }

    const costEst =
      typeof adapter.estimateCost === "function"
        ? adapter.estimateCost(cached ? 0 : norm.normalizedCharCount)
        : { estimatedCostUsd: null, basis: "unavailable" };

    const latencyMs = Date.now() - startedAt;
    const metadataPath = assertPathContained(
      resolvedOutDir,
      path.join(resolvedOutDir, `${safeStem}.tts_meta.json`),
      "output metadata"
    );

    const safeMetadata = sanitizeCacheMetadata(
      {
        status: "completed",
        requestId,
        cached,
        cacheKey,
        provider: providerName,
        mode: resolvedMode,
        model: resolvedModel || null,
        providerVersion,
        voice: resolvedVoice || null,
        language,
        rate,
        pitch,
        prosody,
        outputFormat: fmt,
        normalizerVersion: norm.normalizerVersion,
        appliedNormalizationRules: norm.appliedRules,
        commercialPolicy,
        usage: {
          rawCharCount: norm.rawCharCount,
          normalizedCharCount: norm.normalizedCharCount,
          billedCharCount: cached ? 0 : norm.normalizedCharCount,
          estimatedCostUsd: costEst.estimatedCostUsd ?? null,
          costBasis: costEst.basis || null,
        },
        audioInfo: {
          actualDurationSec: audioInfo.actualDurationSec,
          withinTargetWindow: audioInfo.withinTargetWindow,
          durationValidation: audioInfo.durationValidation,
          codec: audioInfo.codec,
          sampleRate: audioInfo.sampleRate,
          channels: audioInfo.channels,
          sizeBytes: audioInfo.sizeBytes,
        },
        files: {
          audioPath: finalAudioPath,
          wordsPath: finalWordsPath,
        },
        providerMeta: providerExtraMeta,
        latencyMs,
        attempts,
        generatedAt: new Date().toISOString(),
      },
      cfg.secrets
    );

    atomicWriteFile(metadataPath, JSON.stringify(safeMetadata, null, 2));

    logger.info("TTS synthesis completed", {
      requestId,
      provider: providerName,
      mode: resolvedMode,
      voice: resolvedVoice || null,
      cached,
      normalizedCharCount: norm.normalizedCharCount,
      actualDurationSec: audioInfo.actualDurationSec,
      withinTargetWindow: audioInfo.withinTargetWindow,
      latencyMs,
      attempts,
    });

    emitUsage({
      provider: providerName,
      mode: resolvedMode,
      cached,
      chars: cached ? 0 : norm.normalizedCharCount,
      actualDurationSec: audioInfo.actualDurationSec,
      estimatedCostUsd: costEst.estimatedCostUsd ?? null,
      latencyMs,
    });

    return {
      ok: true,
      cached,
      cacheKey,
      provider: providerName,
      mode: resolvedMode,
      model: resolvedModel || null,
      voice: resolvedVoice || null,
      language,
      outputFormat: fmt,
      originalText: norm.originalText,
      normalizedText: norm.normalizedText,
      normalizerVersion: norm.normalizerVersion,
      appliedNormalizationRules: norm.appliedRules,
      audioPath: finalAudioPath,
      wordsPath: finalWordsPath,
      metadataPath,
      commercialPolicy,
      providerMeta: safeMetadata.providerMeta,
      usage: safeMetadata.usage,
      audioInfo: {
        ...audioInfo,
        filePath: finalAudioPath,
      },
      latencyMs,
      attempts,
      requestId,
    };
  }

  return {
    modes: TTS_MODES,
    registerProvider,
    listProviders,
    getCapabilities,
    validateConfig,
    estimateCost,
    getConfigSummary,
    synthesize,
  };
}
