/**
 * Comprehensive offline unit & regression tests for Kok Iso Yo? TTS Gateway Core (Phase 2A).
 * Covers all public contracts AND explicit regression tests for all 10 audit findings (A1-A4, B1-B2, C1, D1, E1-E3).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ACCOUNT_PLAN_TIERS,
  TEXT_NORMALIZER_VERSION,
  TTSAudioProbeError,
  TTSAuthError,
  TTSConfigError,
  TTSDurationOutOfRangeError,
  TTSLicensePolicyError,
  TTSProviderUnavailableError,
  TTSQuotaExceededError,
  TTSRateLimitError,
  TTSTimeoutError,
  assertValidCacheKey,
  classifyHttpTtsError,
  computeTTSCacheKey,
  convertCharAlignmentToWords,
  createTTSCache,
  createTTSRouter,
  normalizeAccountPlanTier,
  normalizeTextForTTS,
  parseVttOrSrtToWords,
  probeAudioFile,
  redactTTSText,
  validateAudioDuration,
} from "./index.mjs";

const FAKE_SECRET = "sk_live_tts_super_secret_key_987654321";
const FAKE_AZURE_KEY = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";

function makeTempDir(prefix = "kokisoyo-tts-test-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function makeProbeMock({ durationSec = 58.2, codec = "mp3", sampleRate = 48000, channels = 1 } = {}) {
  return async (filePath, opts = {}) =>
    probeAudioFile(filePath, {
      ...opts,
      execFileImpl: async () => ({
        stdout: JSON.stringify({
          format: {
            duration: String(durationSec),
            size: "1400000",
            bit_rate: "192000",
            format_name: codec,
          },
          streams: [
            {
              codec_type: "audio",
              codec_name: codec,
              sample_rate: String(sampleRate),
              channels,
              duration: String(durationSec),
            },
          ],
        }),
        stderr: "",
      }),
    });
}

function makeStubProvider({
  provider = "stub_commercial",
  commercialEligible = true,
  defaultVoice = "id-ID-ArdiNeural",
  defaultModel = "neural-v1",
  providerVersion = "2026.1",
  costPer1M = 15,
  handler = null,
} = {}) {
  const calls = [];
  return {
    provider,
    calls,
    getCapabilities() {
      return {
        provider,
        commercialEligible,
        supportsIndonesian: true,
        supportsSSML: true,
        supportsRateControl: true,
        supportsWordTimestamps: true,
        supportedFormats: ["mp3", "wav"],
        defaultVoice,
        defaultModel,
        providerVersion,
        maxCharsPerRequest: 5000,
      };
    },
    validateConfig() {
      return { ok: true, errors: [] };
    },
    estimateCost(charCount) {
      return {
        estimatedCostUsd: Number(((charCount / 1_000_000) * costPer1M).toFixed(6)),
        basis: `$${costPer1M}/1M chars`,
      };
    },
    async synthesize(req) {
      calls.push(req);
      if (handler) {
        return handler(req, calls.length);
      }
      return {
        audioBuffer: Buffer.from(`AUDIO:${provider}:${req.voice}:${req.rate}:${req.text}`),
        words: [
          { s: 0.1, e: 0.6, w: "Kok" },
          { s: 0.65, e: 1.2, w: "iso" },
        ],
        voice: req.voice,
        model: req.model,
        providerMeta: {
          region: "southeastasia",
          requestEngine: "neural-v1",
          apiKey: FAKE_SECRET,
          nested: {
            subscriptionKey: FAKE_AZURE_KEY,
            ocpApimSubscriptionKey: FAKE_AZURE_KEY,
            xiApiKey: FAKE_SECRET,
            authHeader: `Bearer ${FAKE_SECRET}`,
            safeTag: "id-ID",
          },
        },
      };
    },
  };
}

test("config validation rejects invalid modes, formats, duration windows, and unregistered providers", () => {
  assert.throws(() => createTTSRouter({ env: { TTS_DEFAULT_MODE: "turbo" } }), TTSConfigError);
  assert.throws(() => createTTSRouter({ env: { TTS_DEFAULT_FORMAT: "ogg" } }), TTSConfigError);
  assert.throws(
    () => createTTSRouter({ env: { TTS_TARGET_MIN_SEC: "70", TTS_TARGET_MAX_SEC: "60" } }),
    TTSConfigError
  );

  const router = createTTSRouter({
    env: { TTS_DRAFT_PROVIDER: "nonexistent_vendor" },
    logSink: () => {},
  });

  const check = router.validateConfig({ mode: "draft" });
  assert.equal(check.ok, false);
  assert.match(check.errors[0], /not registered/i);
});

test("[B1 & B2] fail-closed commercial eligibility: TTS_FINAL_COMMERCIAL_CONFIRMED=true NEVER bypasses free/f0/unofficial/unknown, generic 'standard' fails closed", async () => {
  // B2: ambiguous generic "standard" fails closed to UNKNOWN; explicit vendor plans work
  assert.equal(normalizeAccountPlanTier("standard", "custom_vendor"), ACCOUNT_PLAN_TIERS.UNKNOWN);
  assert.equal(normalizeAccountPlanTier("standard", "azure_speech"), ACCOUNT_PLAN_TIERS.UNKNOWN);
  assert.equal(normalizeAccountPlanTier("s0", "azure_speech"), ACCOUNT_PLAN_TIERS.PAID_COMMERCIAL);
  assert.equal(normalizeAccountPlanTier("creator", "elevenlabs"), ACCOUNT_PLAN_TIERS.PAID_COMMERCIAL);
  assert.equal(normalizeAccountPlanTier("f0", "azure_speech"), ACCOUNT_PLAN_TIERS.FREE);

  const tmpDir = makeTempDir();
  const cacheDir = path.join(tmpDir, "cache");
  const unofficialDraft = makeStubProvider({ provider: "edge_tts", commercialEligible: false, costPer1M: 0 });
  const azureStub = makeStubProvider({ provider: "azure_speech", commercialEligible: true, costPer1M: 15 });
  const elevenStub = makeStubProvider({ provider: "elevenlabs", commercialEligible: true, costPer1M: 80 });
  const customStub = makeStubProvider({ provider: "custom_tts", commercialEligible: true, costPer1M: 10 });

  try {
    // Even with TTS_FINAL_COMMERCIAL_CONFIRMED=true, f0 / free / unofficial / unknown MUST FAIL in final mode!
    const routerBypassAttempt = createTTSRouter({
      env: {
        TTS_DRAFT_PROVIDER: "edge_tts",
        TTS_FINAL_PROVIDER: "azure_speech",
        TTS_FINAL_COMMERCIAL_CONFIRMED: "true", // MUST NOT bypass non-commercial plans!
        AZURE_SPEECH_PLAN_TIER: "f0",
        ELEVENLABS_PLAN_TIER: "free",
        TTS_CACHE_DIR: cacheDir,
      },
      providers: {
        edge_tts: unofficialDraft,
        azure_speech: azureStub,
        elevenlabs: elevenStub,
        custom_tts: customStub,
      },
      probeImpl: makeProbeMock({ durationSec: 56.5 }),
      logSink: () => {},
    });

    // Draft still works cleanly
    const draftRes = await routerBypassAttempt.synthesize({
      mode: "draft",
      text: "Tes draft aman.",
      outputDir: path.join(tmpDir, "out_draft"),
    });
    assert.equal(draftRes.ok, true);

    // Final with f0 -> REJECTED despite TTS_FINAL_COMMERCIAL_CONFIRMED=true
    await assert.rejects(
      () =>
        routerBypassAttempt.synthesize({
          mode: "final",
          provider: "azure_speech",
          text: "Tidak boleh bypass F0.",
          outputDir: path.join(tmpDir, "out_f0"),
        }),
      TTSLicensePolicyError
    );

    // Final with free -> REJECTED despite TTS_FINAL_COMMERCIAL_CONFIRMED=true
    await assert.rejects(
      () =>
        routerBypassAttempt.synthesize({
          mode: "final",
          provider: "elevenlabs",
          text: "Tidak boleh bypass free.",
          outputDir: path.join(tmpDir, "out_free"),
        }),
      TTSLicensePolicyError
    );

    // Final with unofficial -> REJECTED
    await assert.rejects(
      () =>
        routerBypassAttempt.synthesize({
          mode: "final",
          provider: "edge_tts",
          text: "Tidak boleh bypass unofficial.",
          outputDir: path.join(tmpDir, "out_unofficial"),
        }),
      TTSLicensePolicyError
    );

    // Final with unknown custom provider plan -> REJECTED (fail closed)
    await assert.rejects(
      () =>
        routerBypassAttempt.synthesize({
          mode: "final",
          provider: "custom_tts",
          text: "Tidak boleh bypass unknown.",
          outputDir: path.join(tmpDir, "out_unknown"),
        }),
      TTSLicensePolicyError
    );

    // Paid commercial tier (S0) -> ALLOWED in final mode
    const routerPaid = createTTSRouter({
      env: {
        TTS_FINAL_PROVIDER: "azure_speech",
        AZURE_SPEECH_PLAN_TIER: "s0",
        TTS_CACHE_DIR: cacheDir,
      },
      providers: { azure_speech: azureStub },
      probeImpl: makeProbeMock({ durationSec: 57.0 }),
      logSink: () => {},
    });
    const finalRes = await routerPaid.synthesize({
      mode: "final",
      text: "Produksi final S0 sah.",
      outputDir: path.join(tmpDir, "out_s0"),
    });
    assert.equal(finalRes.ok, true);
    assert.equal(finalRes.commercialPolicy.accountLicensed, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("[C1 & E1] error classification, secret redaction in rethrown errors/URLs/bodyPreview, Retry-After: 0, and clean timeout AbortController", async () => {
  // C1: classifyHttpTtsError redacts secrets in bodyPreview
  const leakedErr = classifyHttpTtsError({
    status: 503,
    provider: "azure_speech",
    bodyPreview: `Failed for https://api.example.com?subscription-key=${FAKE_AZURE_KEY}&token=abc Ocp-Apim-Subscription-Key: ${FAKE_AZURE_KEY} ${FAKE_SECRET}`,
    secrets: [FAKE_AZURE_KEY, FAKE_SECRET],
  });
  assert.ok(leakedErr instanceof TTSProviderUnavailableError);
  assert.equal(JSON.stringify(leakedErr.meta).includes(FAKE_AZURE_KEY), false);
  assert.equal(JSON.stringify(leakedErr.meta).includes(FAKE_SECRET), false);

  // Direct redactTTSText checks for URL query, headers, and sk_ prefix even without explicit secrets array
  const autoRedacted = redactTTSText(
    `GET https://tts.example/v1?key=abc123456&subscription-key=xyz987654 xi-api-key: mysecretval ${FAKE_SECRET}`
  );
  assert.equal(autoRedacted.includes("abc123456"), false);
  assert.equal(autoRedacted.includes("xyz987654"), false);
  assert.equal(autoRedacted.includes("mysecretval"), false);
  assert.equal(autoRedacted.includes(FAKE_SECRET), false);

  const tmpDir = makeTempDir();
  const sleeps = [];
  let modeBehavior = "retry_after_zero";
  let abortFired = 0;

  const flakyProvider = makeStubProvider({
    provider: "azure_speech",
    handler: async (req, attemptNum) => {
      if (modeBehavior === "retry_after_zero") {
        if (attemptNum === 1) {
          throw classifyHttpTtsError({ status: 429, provider: "azure_speech", retryAfterHeader: "0" });
        }
        if (attemptNum === 2) {
          throw classifyHttpTtsError({ status: 503, provider: "azure_speech" });
        }
        return { audioBuffer: Buffer.from("RECOVERED_MP3_BYTES") };
      }
      if (modeBehavior === "secret_in_auth_error") {
        const e = new TTSAuthError(
          `Rejected Ocp-Apim-Subscription-Key: ${FAKE_AZURE_KEY} at https://region.tts.speech.microsoft.com?key=${FAKE_SECRET}`,
          { provider: "azure_speech", status: 401 }
        );
        e.cause = new Error(`Raw fetch header xi-api-key: ${FAKE_SECRET}`);
        throw e;
      }
      if (modeBehavior === "quota_fail") {
        throw classifyHttpTtsError({ status: 402, provider: "azure_speech" });
      }
      if (modeBehavior === "timeout_with_late_reject") {
        return new Promise((_resolve, reject) => {
          req.signal?.addEventListener("abort", () => {
            abortFired += 1;
            // Reject slightly after abort to prove Promise.race causes zero UnhandledPromiseRejection!
            setTimeout(() => reject(new Error("Late AbortError from fetch")), 5);
          });
        });
      }
      return { audioBuffer: Buffer.from("OK") };
    },
  });

  try {
    const router = createTTSRouter({
      env: {
        TTS_FINAL_PROVIDER: "azure_speech",
        AZURE_SPEECH_PLAN_TIER: "s0",
        AZURE_SPEECH_KEY: FAKE_AZURE_KEY,
        ELEVENLABS_API_KEY: FAKE_SECRET,
        TTS_MAX_RETRIES: "2",
        TTS_RETRY_BASE_MS: "50",
        TTS_CACHE_ENABLED: "false",
      },
      providers: { azure_speech: flakyProvider },
      probeImpl: makeProbeMock({ durationSec: 55.0 }),
      sleepImpl: async (ms) => {
        sleeps.push(ms);
      },
      logSink: () => {},
    });

    // E1: Retry-After: 0 sleeps 0ms (not baseMs=50)
    const okRes = await router.synthesize({
      mode: "final",
      text: "Tes retry-after 0",
      outputDir: path.join(tmpDir, "ok"),
    });
    assert.equal(okRes.attempts, 3);
    assert.equal(sleeps[0], 0, "Retry-After: 0 must be honored as 0ms");

    // C1: Rethrown auth error MUST NOT leak secret in message, stack, meta, or cause, and MUST NOT retry
    modeBehavior = "secret_in_auth_error";
    flakyProvider.calls.length = 0;
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          text: "Tes redaction error",
          outputDir: path.join(tmpDir, "auth"),
        }),
      (err) => {
        assert.ok(err instanceof TTSAuthError);
        assert.equal(err.message.includes(FAKE_AZURE_KEY), false);
        assert.equal(err.message.includes(FAKE_SECRET), false);
        assert.equal(String(err.stack || "").includes(FAKE_AZURE_KEY), false);
        assert.equal(String(err.cause?.message || "").includes(FAKE_SECRET), false);
        return true;
      }
    );
    assert.equal(flakyProvider.calls.length, 1);

    // 402 Quota error MUST NOT retry
    modeBehavior = "quota_fail";
    flakyProvider.calls.length = 0;
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          text: "Tes quota fail",
          outputDir: path.join(tmpDir, "quota"),
        }),
      TTSQuotaExceededError
    );
    assert.equal(flakyProvider.calls.length, 1);

    // E1: Timeout fires AbortController and swallows late AbortError cleanly without UnhandledPromiseRejection
    modeBehavior = "timeout_with_late_reject";
    flakyProvider.calls.length = 0;
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          text: "Tes timeout abort",
          outputDir: path.join(tmpDir, "timeout"),
          timeoutMs: 40,
          maxRetries: 1,
        }),
      TTSTimeoutError
    );
    assert.equal(flakyProvider.calls.length, 2);
    assert.equal(abortFired, 2);
    await new Promise((r) => setTimeout(r, 25)); // allow late rejection tick to confirm no unhandledRejection
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("[A2] pre-commit ffprobe prevents poisoned cache & output leftovers, and evicts corrupt cache on hit", async () => {
  const tmpDir = makeTempDir();
  const cacheDir = path.join(tmpDir, "cache");
  let corruptPayload = true;
  let probeFailOnce = false;

  const provider = makeStubProvider({
    provider: "azure_speech",
    handler: async () => ({
      audioBuffer: Buffer.from(corruptPayload ? "NOT_VALID_AUDIO" : "VALID_MP3_BYTES"),
      providerMeta: { region: "southeastasia", tag: "v1" },
    }),
  });

  const smartProbe = async (filePath, opts = {}) => {
    const raw = fs.readFileSync(filePath, "utf8");
    if (raw === "NOT_VALID_AUDIO" || probeFailOnce) {
      probeFailOnce = false;
      throw new TTSAudioProbeError("No audio stream in corrupt buffer", {
        reason: "NO_AUDIO_STREAM",
        filePath,
      });
    }
    return makeProbeMock({ durationSec: 58.0 })(filePath, opts);
  };

  try {
    const router = createTTSRouter({
      env: {
        TTS_FINAL_PROVIDER: "azure_speech",
        AZURE_SPEECH_PLAN_TIER: "s0",
        TTS_CACHE_DIR: cacheDir,
      },
      providers: { azure_speech: provider },
      probeImpl: smartProbe,
      logSink: () => {},
    });

    // 1. Corrupt audio from provider MUST FAIL before cache commit (cache stays clean!)
    const outCorrupt = path.join(tmpDir, "out_corrupt");
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          text: "Tes anti poisoned cache.",
          outputDir: outCorrupt,
        }),
      TTSAudioProbeError
    );
    assert.equal(fs.existsSync(path.join(outCorrupt, "voiceover.mp3")), false, "No corrupt file in outputDir");

    // 2. Once provider recovers, next call MUST NOT hit a poisoned cache; it succeeds cleanly!
    corruptPayload = false;
    const recovered = await router.synthesize({
      mode: "final",
      text: "Tes anti poisoned cache.",
      outputDir: path.join(tmpDir, "out_ok"),
    });
    assert.equal(recovered.ok, true);
    assert.equal(recovered.cached, false);
    assert.equal(provider.calls.length, 2);

    // 3. Also verify useCache: false leaves ZERO files in outputDir when strict duration check fails
    const outNoCacheFail = path.join(tmpDir, "out_nocache_fail");
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          text: "Tes no-cache out-of-range cleanup.",
          outputDir: outNoCacheFail,
          useCache: false,
          enforceDurationWindow: true,
          targetMinSec: 60,
          targetMaxSec: 65,
        }),
      TTSDurationOutOfRangeError
    );
    assert.equal(
      fs.existsSync(path.join(outNoCacheFail, "voiceover.mp3")),
      false,
      "Invalid out-of-range audio must not remain in outputDir"
    );

    // 4. Simulate on-disk cache corruption after valid write -> router evicts & regenerates!
    const cacheBucket = path.join(cacheDir, recovered.cacheKey.slice(0, 2));
    const cachedAudio = path.join(cacheBucket, `${recovered.cacheKey}.mp3`);
    fs.writeFileSync(cachedAudio, Buffer.from("NOT_VALID_AUDIO"));

    const selfHealed = await router.synthesize({
      mode: "final",
      text: "Tes anti poisoned cache.",
      outputDir: path.join(tmpDir, "out_healed"),
    });
    assert.equal(selfHealed.ok, true);
    assert.equal(selfHealed.cached, false, "Corrupt cache entry must be evicted and regenerated");
    assert.equal(fs.readFileSync(cachedAudio, "utf8"), "VALID_MP3_BYTES");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("[A1] active lock heartbeat prevents stealing, owner-verified unlock never deletes another owner's lock, and concurrent stale recovery is atomic", async () => {
  const tmpDir = makeTempDir();
  try {
    const key = computeTTSCacheKey({ provider: "stub", normalizedText: "lock heartbeat test" });

    // 1. Heartbeat keeps active lock alive past lockStaleMs (60ms) while holder runs for 140ms
    const cacheA = createTTSCache({
      cacheDir: tmpDir,
      lockStaleMs: 60,
      lockHeartbeatMs: 20,
      lockPollMs: 15,
      lockTimeoutMs: 2_000,
    });
    const cacheB = createTTSCache({
      cacheDir: tmpDir,
      lockStaleMs: 60,
      lockHeartbeatMs: 20,
      lockPollMs: 15,
      lockTimeoutMs: 2_000,
    });

    const lockPath = cacheA.entryPaths(key, "mp3").lockPath;
    const events = [];

    const releaseA = await cacheA.acquireFileLock(lockPath);
    events.push("A_acquired");

    const contenderB = (async () => {
      const releaseB = await cacheB.acquireFileLock(lockPath);
      events.push("B_acquired");
      releaseB();
    })();

    // Hold lock for 130ms (> 2x lockStaleMs=60ms); heartbeat MUST prevent B from stealing!
    await new Promise((r) => setTimeout(r, 130));
    assert.deepEqual(events, ["A_acquired"], "B must NOT steal active lock protected by heartbeat");
    events.push("A_releasing");
    releaseA();

    await contenderB;
    assert.deepEqual(events, ["A_acquired", "A_releasing", "B_acquired"]);

    // 2. Owner-verified unlock: calling a stale release() NEVER deletes a lock owned by a new holder
    const releaseFirst = await cacheA.acquireFileLock(lockPath);
    // Simulate lock replaced by a different owner
    fs.unlinkSync(lockPath);
    const releaseSecond = await cacheB.acquireFileLock(lockPath);
    releaseFirst(); // MUST NOT delete B's lock!
    assert.equal(fs.existsSync(lockPath), true, "Old owner release() must not delete new owner's lock");
    releaseSecond();
    assert.equal(fs.existsSync(lockPath), false);

    // 3. Concurrent stale lock recovery from dead PID: two contenders race -> strictly serialized!
    const deadKey = computeTTSCacheKey({ provider: "stub", normalizedText: "dead pid race" });
    const deadLockPath = cacheA.entryPaths(deadKey, "mp3").lockPath;
    fs.mkdirSync(path.dirname(deadLockPath), { recursive: true });
    fs.writeFileSync(
      deadLockPath,
      JSON.stringify({ ownerId: "999999:dead", pid: 999999, host: os.hostname(), createdAt: 0 })
    );
    const old = new Date(Date.now() - 60_000);
    fs.utimesSync(deadLockPath, old, old);

    const cacheRace1 = createTTSCache({
      cacheDir: tmpDir,
      lockStaleMs: 50,
      lockPollMs: 10,
      lockTimeoutMs: 2_000,
      isPidAliveImpl: (pid) => pid !== 999999,
    });
    const cacheRace2 = createTTSCache({
      cacheDir: tmpDir,
      lockStaleMs: 50,
      lockPollMs: 10,
      lockTimeoutMs: 2_000,
      isPidAliveImpl: (pid) => pid !== 999999,
    });

    let activeCount = 0;
    let maxConcurrent = 0;
    const worker = async (c) => {
      const rel = await c.acquireFileLock(deadLockPath);
      activeCount += 1;
      maxConcurrent = Math.max(maxConcurrent, activeCount);
      await new Promise((r) => setTimeout(r, 35));
      activeCount -= 1;
      rel();
    };
    await Promise.all([worker(cacheRace1), worker(cacheRace2)]);
    assert.equal(maxConcurrent, 1, "Atomic stale recovery must never allow 2 active lock holders simultaneously");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("[A3] blocks path traversal in cacheKey & fileStem and rejects symlinks in cache & ffprobe", async () => {
  const tmpDir = makeTempDir();
  const cacheDir = path.join(tmpDir, "cache");
  const outsideFile = path.join(tmpDir, "outside_secret.txt");
  fs.writeFileSync(outsideFile, "TOP_SECRET_OUTSIDE");

  try {
    // 1. Invalid / traversal cacheKey rejected
    assert.throws(() => assertValidCacheKey("../../etc/passwd"), TTSConfigError);
    const cache = createTTSCache({ cacheDir });
    assert.throws(() => cache.readHit("../escape", "mp3"), TTSConfigError);

    // 2. Symlink inside cache bucket rejected on readHit
    const validKey = computeTTSCacheKey({ provider: "stub", normalizedText: "symlink test" });
    const p = cache.entryPaths(validKey, "mp3");
    fs.mkdirSync(p.bucket, { recursive: true });
    fs.symlinkSync(outsideFile, p.audioPath);
    fs.writeFileSync(p.metaPath, JSON.stringify({ cacheKey: validKey }));
    assert.throws(() => cache.readHit(validKey, "mp3"), TTSConfigError);

    // 3. Symlink passed to probeAudioFile rejected
    await assert.rejects(
      () => probeAudioFile(p.audioPath),
      (err) => err instanceof TTSAudioProbeError && err.reason === "SYMLINK_REJECTED"
    );

    // 4. Path traversal in fileStem rejected by public router
    const stub = makeStubProvider({ provider: "edge_tts", commercialEligible: false });
    const router = createTTSRouter({
      env: { TTS_DRAFT_PROVIDER: "edge_tts", TTS_CACHE_DIR: cacheDir },
      providers: { edge_tts: stub },
      probeImpl: makeProbeMock({ durationSec: 55.0 }),
      logSink: () => {},
    });
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "draft",
          text: "Tes traversal fileStem",
          outputDir: path.join(tmpDir, "out"),
          fileStem: "../../pwned",
        }),
      TTSConfigError
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("[A4, C1 & E2] public router caching: atomic fsync writes, concurrent deduplication, recursive secret stripping, and providerMeta parity on cache hit", async () => {
  const tmpDir = makeTempDir();
  const cacheDir = path.join(tmpDir, "cache");
  const logLines = [];

  const slowProvider = makeStubProvider({
    provider: "azure_speech",
    handler: async (req) => {
      await new Promise((r) => setTimeout(r, 35));
      return {
        audioBuffer: Buffer.from(`MP3:${req.voice}:${req.rate}:${req.text}`),
        words: [{ s: 0.0, e: 1.2, w: "Halo" }],
        providerMeta: {
          region: "southeastasia",
          engineTag: "neural-s0",
          apiKey: FAKE_SECRET,
          nested: {
            subscriptionKey: FAKE_AZURE_KEY,
            ocpApimSubscriptionKey: FAKE_AZURE_KEY,
            xiApiKey: FAKE_SECRET,
            authHeader: `Bearer ${FAKE_SECRET}`,
            keepMe: "safe-value",
          },
        },
      };
    },
  });

  try {
    const router = createTTSRouter({
      env: {
        TTS_FINAL_PROVIDER: "azure_speech",
        AZURE_SPEECH_PLAN_TIER: "s0",
        AZURE_SPEECH_KEY: FAKE_AZURE_KEY,
        TTS_CACHE_DIR: cacheDir,
      },
      providers: { azure_speech: slowProvider },
      probeImpl: makeProbeMock({ durationSec: 58.0 }),
      logSink: (_lvl, line) => logLines.push(line),
    });

    // 5 concurrent identical calls -> provider invoked ONCE
    const parallel = await Promise.all(
      Array.from({ length: 5 }, (_, idx) =>
        router.synthesize({
          mode: "final",
          text: "Tekanan ~200 psi pada ban jet.",
          rate: "+4%",
          outputDir: path.join(tmpDir, `out_${idx}`),
        })
      )
    );
    assert.equal(slowProvider.calls.length, 1);

    const missEntry = parallel.find((r) => !r.cached);
    // Sequential cache hit
    const hitEntry = await router.synthesize({
      mode: "final",
      text: "Tekanan ~200 psi pada ban jet.",
      rate: "+4%",
      outputDir: path.join(tmpDir, "out_hit"),
    });
    assert.equal(hitEntry.cached, true);
    assert.equal(hitEntry.usage.billedCharCount, 0);

    // E2: providerMeta MUST match identically between cache miss and cache hit!
    assert.deepEqual(hitEntry.providerMeta, missEntry.providerMeta);
    assert.equal(hitEntry.providerMeta.region, "southeastasia");
    assert.equal(hitEntry.providerMeta.nested.keepMe, "safe-value");

    // C1: nested TTS secrets stripped from BOTH miss & hit metadata and logs
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        return e.isDirectory() ? walk(full) : [full];
      });
    const allCacheFiles = walk(cacheDir);
    assert.equal(
      allCacheFiles.some((f) => f.endsWith(".tmp") || f.endsWith(".lock")),
      false
    );

    const metaFiles = [...allCacheFiles, missEntry.metadataPath, hitEntry.metadataPath].filter((f) =>
      f.endsWith(".json")
    );
    for (const mf of metaFiles) {
      const txt = fs.readFileSync(mf, "utf8");
      assert.equal(txt.includes(FAKE_SECRET), false, `ElevenLabs-style secret leaked in ${mf}`);
      assert.equal(txt.includes(FAKE_AZURE_KEY), false, `Azure subscriptionKey leaked in ${mf}`);
      assert.equal(txt.includes("ocpApimSubscriptionKey"), false, `Sensitive nested key name kept in ${mf}`);
    }
    for (const line of logLines) {
      assert.equal(line.includes(FAKE_SECRET), false);
      assert.equal(line.includes(FAKE_AZURE_KEY), false);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("[D1] probeAudioFile enforces SIGKILL timeout vs external SIGTERM/SIGKILL classification", async () => {
  const tmpDir = makeTempDir();
  const validFile = path.join(tmpDir, "valid.mp3");
  const emptyFile = path.join(tmpDir, "empty.mp3");
  fs.writeFileSync(validFile, Buffer.from("FAKE_MP3_CONTENT"));
  fs.writeFileSync(emptyFile, Buffer.alloc(0));

  try {
    // 1. Verifies killSignal: "SIGKILL" and AbortSignal are passed to execFileImpl
    let seenOpts = null;
    const ok = await probeAudioFile(validFile, {
      execFileImpl: async (_bin, _args, opts) => {
        seenOpts = opts;
        return {
          stdout: JSON.stringify({
            format: { duration: "58.45", size: "1234567", bit_rate: "192000", format_name: "mp3" },
            streams: [{ codec_type: "audio", codec_name: "mp3", sample_rate: "48000", channels: 1 }],
          }),
          stderr: "",
        };
      },
    });
    assert.equal(ok.actualDurationSec, 58.45);
    assert.equal(seenOpts.killSignal, "SIGKILL");
    assert.ok(seenOpts.signal instanceof AbortSignal);

    // 2. Real local timeout -> TTSTimeoutError (retryable)
    await assert.rejects(
      () =>
        probeAudioFile(validFile, {
          timeoutMs: 30,
          execFileImpl: async (_bin, _args, opts) =>
            new Promise((_resolve, reject) => {
              opts.signal.addEventListener("abort", () => reject(new Error("aborted")));
            }),
        }),
      (err) => err instanceof TTSTimeoutError && err.retryable === true
    );

    // 3. External SIGTERM (e.g. OS/OOM kill without local timeout) -> non-retryable TTSAudioProbeError!
    await assert.rejects(
      () =>
        probeAudioFile(validFile, {
          timeoutMs: 5_000,
          execFileImpl: async () => {
            const e = new Error("Process terminated by OS");
            e.killed = true;
            e.signal = "SIGTERM";
            throw e;
          },
        }),
      (err) =>
        err instanceof TTSAudioProbeError &&
        err.reason === "FFPROBE_KILLED_EXTERNALLY" &&
        err.retryable === false
    );

    // 4. File missing, empty, invalid JSON, missing audio stream
    await assert.rejects(
      () => probeAudioFile(path.join(tmpDir, "missing.mp3")),
      (err) => err instanceof TTSAudioProbeError && err.reason === "FILE_NOT_FOUND"
    );
    await assert.rejects(
      () => probeAudioFile(emptyFile),
      (err) => err instanceof TTSAudioProbeError && err.reason === "EMPTY_FILE"
    );
    await assert.rejects(
      () =>
        probeAudioFile(validFile, {
          execFileImpl: async () => ({ stdout: "not-json", stderr: "" }),
        }),
      (err) => err instanceof TTSAudioProbeError && err.reason === "INVALID_JSON"
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("[E3] text normalizer expands 2-number ranges without corrupting multi-dash codes or dates", () => {
  const input =
    "Aturan AD 87-08-09 tanggal 2026-11-26: kecepatan 240-280 km/jam, suhu 180°C, N2 95%, ~200 psi, 200+ kali.";
  const n = normalizeTextForTTS(input);

  assert.equal(n.originalText, input);
  assert.equal(n.normalizerVersion, TEXT_NORMALIZER_VERSION);
  assert.match(n.normalizedText, /AD 87-08-09/, "Multi-dash regulation code must NOT be rewritten");
  assert.match(n.normalizedText, /2026-11-26/, "ISO date must NOT be rewritten");
  assert.match(n.normalizedText, /240 sampai 280 kilometer per jam/);
  assert.match(n.normalizedText, /180 derajat Celsius/);
  assert.match(n.normalizedText, /N 2 95 persen/);
  assert.match(n.normalizedText, /sekitar 200 psi/);
  assert.match(n.normalizedText, /200 lebih kali/);
});

test("SHA-256 cache key is deterministic and sensitive to EVERY audio-affecting parameter", () => {
  const base = {
    provider: "azure_speech",
    model: "neural-v1",
    providerVersion: "2026.1",
    voice: "id-ID-ArdiNeural",
    language: "id-ID",
    rate: "+0%",
    pitch: "+0Hz",
    outputFormat: "mp3",
    prosody: { contour: "flat", style: "narration" },
    normalizerVersion: TEXT_NORMALIZER_VERSION,
    normalizedText: "Kok ban pesawat nggak meledak?",
  };

  const kBase = computeTTSCacheKey(base);
  assert.equal(
    kBase,
    computeTTSCacheKey({ ...base, prosody: { style: "narration", contour: "flat" } })
  );

  for (const patch of [
    { provider: "elevenlabs" },
    { model: "neural-v2" },
    { providerVersion: "2026.2" },
    { voice: "id-ID-GadisNeural" },
    { language: "en-US" },
    { rate: "+5%" },
    { pitch: "+2Hz" },
    { outputFormat: "wav" },
    { prosody: { style: "excited", contour: "flat" } },
    { normalizerVersion: "2.0.0" },
    { normalizedText: "Kok daun warnanya hijau?" },
  ]) {
    assert.notEqual(computeTTSCacheKey({ ...base, ...patch }), kBase);
  }
});

test("50-65s duration validation works both as advisory status and strict enforcement in router", async () => {
  assert.equal(validateAudioDuration(45.2).status, "too_short");
  assert.equal(validateAudioDuration(58.0).valid, true);
  assert.equal(validateAudioDuration(67.8).status, "too_long");

  const tmpDir = makeTempDir();
  const stub = makeStubProvider({ provider: "edge_tts", commercialEligible: false });

  try {
    const router = createTTSRouter({
      env: { TTS_DRAFT_PROVIDER: "edge_tts", TTS_CACHE_ENABLED: "false" },
      providers: { edge_tts: stub },
      probeImpl: makeProbeMock({ durationSec: 71.4 }),
      logSink: () => {},
    });

    const advisory = await router.synthesize({
      mode: "draft",
      text: "Audio terlalu panjang untuk 65 detik.",
      outputDir: path.join(tmpDir, "adv"),
      enforceDurationWindow: false,
    });
    assert.equal(advisory.audioInfo.withinTargetWindow, false);
    assert.equal(advisory.audioInfo.durationValidation.status, "too_long");

    await assert.rejects(
      () =>
        router.synthesize({
          mode: "draft",
          text: "Audio terlalu panjang dalam mode ketat.",
          outputDir: path.join(tmpDir, "strict"),
          enforceDurationWindow: true,
        }),
      TTSDurationOutOfRangeError
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("timingConverter converts VTT/SRT and character-level alignments to mix_audio.py words.json format", () => {
  const vtt = `WEBVTT

00:00:00.120 --> 00:00:00.450
Kok

00:00:00.480 --> 00:00:01.050
ban pesawat
`;
  assert.deepEqual(parseVttOrSrtToWords(vtt), [
    { s: 0.12, e: 0.45, w: "Kok" },
    { s: 0.48, e: 1.05, w: "ban pesawat" },
  ]);

  assert.deepEqual(
    convertCharAlignmentToWords({
      characters: ["K", "o", "k", " ", "i", "s", "o"],
      character_start_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
      character_end_times_seconds: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85],
    }),
    [
      { s: 0.1, e: 0.4, w: "Kok" },
      { s: 0.5, e: 0.85, w: "iso" },
    ]
  );
});
