/**
 * Offline unit tests for built-in TTS Provider Adapters:
 * - Edge TTS (`edge_tts`, draft-only CLI adapter)
 * - Azure AI Speech (`azure_speech`, commercial REST SSML adapter)
 * - ElevenLabs (`elevenlabs`, commercial REST `/with-timestamps` adapter)
 * - `createDefaultTTSRouter()` env-driven provider switching
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  TTSAuthError,
  TTSLicensePolicyError,
  TTSQuotaExceededError,
  TTSRateLimitError,
  buildAzureSsml,
  createAzureSpeechAdapter,
  createDefaultTTSRouter,
  createEdgeTtsAdapter,
  createElevenLabsAdapter,
  wrapPcm16MonoToWav,
} from "./index.mjs";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kokisoyo-tts-prov-test-"));
}

function makeFakeProbe(durationSec = 57.5) {
  return async (filePath) => ({
    filePath,
    actualDurationSec: durationSec,
    codec: "mp3",
    sampleRate: 48_000,
    channels: 1,
    bitRate: 192_000,
    sizeBytes: fs.statSync(filePath).size,
    withinTargetWindow: durationSec >= 50 && durationSec <= 65,
    durationValidation: { ok: true, status: "ok" },
  });
}

test("edgeTtsAdapter passes safe CLI args (--file, --rate=, --pitch=), converts SRT to words.json, and is blocked in final mode", async () => {
  const tmpDir = makeTempDir();
  const captured = [];

  const fakeExec = async (bin, args) => {
    captured.push({ bin, args });
    const mediaIdx = args.indexOf("--write-media");
    const subsIdx = args.indexOf("--write-subtitles");
    const fileIdx = args.indexOf("--file");
    assert.ok(fileIdx >= 0, "must pass --file");
    assert.ok(fs.readFileSync(args[fileIdx + 1], "utf8").includes("Ban pesawat"));

    fs.writeFileSync(args[mediaIdx + 1], Buffer.from("ID3-FAKE-EDGE-MP3"));
    fs.writeFileSync(
      args[subsIdx + 1],
      "1\n00:00:00,100 --> 00:00:00,550\nBan pesawat\n\n2\n00:00:00,600 --> 00:00:01,100\naman banget\n",
      "utf8"
    );
    return { stdout: "", stderr: "" };
  };

  try {
    const router = createDefaultTTSRouter({
      env: {
        TTS_DEFAULT_MODE: "draft",
        TTS_DRAFT_PROVIDER: "edge_tts",
        TTS_CACHE_DIR: path.join(tmpDir, "cache"),
      },
      edgeOptions: { bin: "/usr/bin/edge-tts", execFileImpl: fakeExec },
      probeImpl: makeFakeProbe(56.2),
      logSink: () => {},
    });

    const res = await router.synthesize({
      mode: "draft",
      text: "Ban pesawat aman banget!",
      rate: "-5%",
      pitch: "+2Hz",
      outputDir: path.join(tmpDir, "out"),
    });

    assert.equal(res.ok, true);
    assert.equal(res.provider, "edge_tts");
    assert.equal(res.usage.estimatedCostUsd, 0);
    assert.equal(res.commercialPolicy.providerEligible, false);
    assert.ok(res.wordsPath && fs.existsSync(res.wordsPath));
    const words = JSON.parse(fs.readFileSync(res.wordsPath, "utf8"));
    assert.equal(words.length, 2);
    assert.equal(words[0].w, "Ban pesawat");
    assert.ok(captured[0].args.includes("--rate=-5%"));
    assert.ok(captured[0].args.includes("--pitch=+2Hz"));

    // Fail-closed in final mode
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          provider: "edge_tts",
          text: "Tidak boleh dipakai untuk final.",
          outputDir: path.join(tmpDir, "out_blocked"),
        }),
      TTSLicensePolicyError
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("azureSpeechAdapter escapes SSML XML, sends correct headers, enforces S0 tier in final mode, and redacts secret on HTTP errors", async () => {
  const ssml = buildAzureSsml({
    text: `Suhu < 200°C & "aman" 'oke' > 0`,
    language: "id-ID",
    voice: "id-ID-ArdiNeural",
    rate: "+5%",
    pitch: "-2Hz",
  });
  assert.ok(ssml.includes("&lt; 200°C &amp; &quot;aman&quot; &apos;oke&apos; &gt; 0"));
  assert.ok(ssml.includes(`name="id-ID-ArdiNeural"`));

  const tmpDir = makeTempDir();
  const secretKey = "AZURE_SUPER_SECRET_KEY_999888";
  const requests = [];

  const fakeFetch = async (url, init) => {
    requests.push({ url, headers: init.headers, body: init.body });
    if (requests.length === 1) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "audio/mpeg",
          "x-requestid": "az-req-123",
        }),
        arrayBuffer: async () => Buffer.from("FAKE_AZURE_MP3_48K"),
      };
    }
    return {
      ok: false,
      status: 401,
      headers: new Headers({ "x-requestid": "az-err-401" }),
      text: async () => `Invalid subscription key ${secretKey}`,
    };
  };

  try {
    const router = createDefaultTTSRouter({
      env: {
        TTS_FINAL_PROVIDER: "azure_speech",
        AZURE_SPEECH_KEY: secretKey,
        AZURE_SPEECH_REGION: "southeastasia",
        AZURE_SPEECH_PLAN_TIER: "S0",
        TTS_CACHE_DIR: path.join(tmpDir, "cache"),
      },
      fetchImpl: fakeFetch,
      probeImpl: makeFakeProbe(58.0),
      logSink: () => {},
    });

    const res = await router.synthesize({
      mode: "final",
      text: "Tekanan ban sekitar 200 psi.",
      outputDir: path.join(tmpDir, "out_ok"),
    });

    assert.equal(res.ok, true);
    assert.equal(res.provider, "azure_speech");
    assert.equal(res.wordsPath, null);
    assert.equal(res.commercialPolicy.allowed, true);
    assert.equal(
      requests[0].url,
      "https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1"
    );
    assert.equal(requests[0].headers["Ocp-Apim-Subscription-Key"], secretKey);
    assert.equal(requests[0].headers["X-Microsoft-OutputFormat"], "audio-48khz-192kbitrate-mono-mp3");
    assert.ok(res.usage.estimatedCostUsd > 0);

    // Verify 401 auth error redacts secret completely
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          text: "Teks berbeda supaya tidak kena cache.",
          outputDir: path.join(tmpDir, "out_err"),
        }),
      (err) => {
        assert.ok(err instanceof TTSAuthError);
        assert.equal(JSON.stringify(err).includes(secretKey), false);
        assert.equal(err.message.includes(secretKey), false);
        return true;
      }
    );

    // Verify F0 free tier is strictly rejected in final mode
    const freeRouter = createDefaultTTSRouter({
      env: {
        TTS_FINAL_PROVIDER: "azure_speech",
        AZURE_SPEECH_KEY: secretKey,
        AZURE_SPEECH_REGION: "southeastasia",
        AZURE_SPEECH_PLAN_TIER: "F0",
      },
      fetchImpl: fakeFetch,
      probeImpl: makeFakeProbe(58.0),
      logSink: () => {},
    });
    await assert.rejects(
      () =>
        freeRouter.synthesize({
          mode: "final",
          text: "F0 dilarang final.",
          outputDir: path.join(tmpDir, "out_f0"),
        }),
      TTSLicensePolicyError
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("elevenLabsAdapter decodes base64 audio, wraps PCM to WAV, converts alignment to words.json, and classifies 402/429 cleanly", async () => {
  const wav = wrapPcm16MonoToWav(Buffer.alloc(16), 44_100);
  assert.equal(wav.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(wav.subarray(8, 12).toString("ascii"), "WAVE");
  assert.equal(wav.length, 60);

  const tmpDir = makeTempDir();
  const secretKey = "sk_elevenlabs_secret_token_987654321";
  let call = 0;

  const fakeFetch = async (url, init) => {
    call += 1;
    assert.equal(init.headers["xi-api-key"], secretKey);
    if (call === 1) {
      assert.match(url, /\/v1\/text-to-speech\/voice_koko_01\/with-timestamps\?output_format=mp3_44100_128/);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "request-id": "el-req-1" }),
        json: async () => ({
          audio_base64: Buffer.from("FAKE_ELEVENLABS_MP3").toString("base64"),
          alignment: {
            characters: ["H", "a", "l", "o", " ", "k", "a", "w", "a", "n"],
            character_start_times_seconds: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
            character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          },
        }),
      };
    }
    if (call === 2) {
      return {
        ok: false,
        status: 402,
        headers: new Headers({ "request-id": "el-req-402" }),
        text: async () => `Quota exceeded for key ${secretKey}`,
      };
    }
    return {
      ok: false,
      status: 429,
      headers: new Headers({ "retry-after": "1", "request-id": "el-req-429" }),
      text: async () => `Rate limit exceeded`,
    };
  };

  try {
    const router = createDefaultTTSRouter({
      env: {
        TTS_FINAL_PROVIDER: "elevenlabs",
        ELEVENLABS_API_KEY: secretKey,
        ELEVENLABS_VOICE_ID: "voice_koko_01",
        ELEVENLABS_PLAN_TIER: "creator",
        TTS_CACHE_DIR: path.join(tmpDir, "cache"),
        TTS_MAX_RETRIES: "0",
      },
      fetchImpl: fakeFetch,
      probeImpl: makeFakeProbe(55.0),
      logSink: () => {},
    });

    const res = await router.synthesize({
      mode: "final",
      text: "Halo kawan",
      outputDir: path.join(tmpDir, "out_el"),
    });
    assert.equal(res.ok, true);
    assert.equal(res.provider, "elevenlabs");
    assert.ok(res.wordsPath && fs.existsSync(res.wordsPath));
    const words = JSON.parse(fs.readFileSync(res.wordsPath, "utf8"));
    assert.deepEqual(words, [
      { s: 0, e: 0.4, w: "Halo" },
      { s: 0.5, e: 1, w: "kawan" },
    ]);

    // 402 Quota error (non-retryable, secret redacted)
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          text: "Teks quota",
          outputDir: path.join(tmpDir, "out_402"),
        }),
      (err) => {
        assert.ok(err instanceof TTSQuotaExceededError);
        assert.equal(JSON.stringify(err).includes(secretKey), false);
        return true;
      }
    );

    // 429 Rate limit error
    await assert.rejects(
      () =>
        router.synthesize({
          mode: "final",
          text: "Teks rate limit",
          outputDir: path.join(tmpDir, "out_429"),
        }),
      TTSRateLimitError
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("adapters validate missing config cleanly without throwing and redact proxy credentials on error", async () => {
  const az = createAzureSpeechAdapter({ env: {} });
  assert.equal(az.validateConfig().ok, false);
  const el = createElevenLabsAdapter({ env: {} });
  assert.equal(el.validateConfig().ok, false);
  const edge = createEdgeTtsAdapter({ env: { EDGE_TTS_BIN: "/nonexistent/edge-tts-bin" } });
  assert.equal(edge.validateConfig().ok, false);

  const proxySecret = "SuperSecretProxyPass999";
  const edgeWithProxy = createEdgeTtsAdapter({
    bin: "/usr/bin/edge-tts",
    proxy: `http://proxyuser:${proxySecret}@proxy.internal:8080`,
    execFileImpl: async () => {
      const err = new Error(`Proxy error on http://proxyuser:${proxySecret}@proxy.internal:8080`);
      err.stderr = `Connection refused: http://proxyuser:${proxySecret}@proxy.internal:8080`;
      throw err;
    },
  });
  await assert.rejects(
    () => edgeWithProxy.synthesize({ text: "tes proxy" }),
    (err) => {
      assert.equal(err.message.includes(proxySecret), false);
      assert.equal(JSON.stringify(err).includes(proxySecret), false);
      return true;
    }
  );
});

test("elevenLabsAdapter rotates across ELEVENLABS_API_KEYS on quota/auth failure and redacts all keys", async () => {
  const k1 = "sk_first_exhausted_key_1111";
  const k2 = "sk_second_healthy_key_2222";
  const usedKeys = [];

  const adapter = createElevenLabsAdapter({
    env: {
      ELEVENLABS_API_KEYS: `${k1},${k2}`,
      ELEVENLABS_VOICE_ID: "voice_koko_01",
    },
    fetchImpl: async (url, init) => {
      if (url.endsWith("/v1/user/subscription")) {
        const key = init.headers["xi-api-key"];
        if (key === k1) {
          return { ok: true, status: 200, json: async () => ({ tier: "free", character_count: 10000, character_limit: 10000 }) };
        }
        return { ok: true, status: 200, json: async () => ({ tier: "free", character_count: 100, character_limit: 10000 }) };
      }
      usedKeys.push(init.headers["xi-api-key"]);
      if (init.headers["xi-api-key"] === k1) {
        return {
          ok: false,
          status: 401,
          headers: new Headers({ "request-id": "el-q1" }),
          text: async () => `quota_exceeded for ${k1}`,
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "request-id": "el-q2" }),
        json: async () => ({
          audio_base64: Buffer.from("FAKE_OK").toString("base64"),
          alignment: {
            characters: ["O", "k"],
            character_start_times_seconds: [0, 0.1],
            character_end_times_seconds: [0.1, 0.2],
          },
        }),
      };
    },
  });

  const quota = await adapter.checkQuotas();
  assert.equal(quota.totalRemainingChars, 9900);
  const res = await adapter.synthesize({ text: "Ok" });
  assert.deepEqual(usedKeys, [k1, k2]);
  assert.equal(res.providerMeta.keySlotUsed, 2);
  assert.equal(res.providerMeta.configuredKeyCount, 2);
});
