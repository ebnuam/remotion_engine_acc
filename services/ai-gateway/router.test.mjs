/**
 * Offline unit & integration tests for:
 * - Antigravity CLI adapter (`agyCliAdapter.mjs` — Jalur PREMIUM)
 * - 2-Route AI Router (`router.mjs` — STANDARD via AGYBridge Render / PREMIUM via `agy` CLI)
 */

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  AI_TIERS,
  AIGatewayAuthError,
  AIGatewayCliError,
  AIGatewayConfigError,
  AIGatewayInvalidResponseError,
  AIGatewayModelUnavailableError,
  AIGatewayTimeoutError,
  createAGYBridgeAdapter,
  createAIGateway,
  createAIRouter,
  createAntigravityCliAdapter,
  formatMessagesForCli,
  parseAgyJsonOutput,
  parseAgyModelsOutput,
} from "./index.mjs";

const FAKE_SECRET = "test-render-bearer-key-123456";

async function withMockBridgeServer(handler, fn) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function makeMockCliExec({ modelsOutput, chatHandler, version = "1.5.18" } = {}) {
  const calls = [];
  const defaultModelsOut =
    modelsOutput ??
    "\r⠋ Fetching available models...\r⠙ Fetching available models...\rgemini-4-neon-high             Gemini 4 Neon (High)\ngemini-4-neon-xhigh            Gemini 4 Neon (XHigh)\nclaude-opus-5-5-high           Claude Opus 5.5 (High)\n";

  const execFileImpl = async (bin, args, opts) => {
    calls.push({ bin, args, opts });
    if (args[0] === "--version") {
      return { stdout: `${version}\n`, stderr: "" };
    }
    if (args[0] === "models") {
      return { stdout: defaultModelsOut, stderr: "" };
    }
    if (args.some((a) => a.startsWith("--print="))) {
      if (chatHandler) {
        return chatHandler({ bin, args, opts, callCount: calls.length });
      }
      return {
        stdout: JSON.stringify({
          conversation_id: "conv-prem-001",
          status: "SUCCESS",
          response: "Respon premium dari agy CLI.\n",
          duration_seconds: 2.34,
          num_turns: 1,
          usage: {
            input_tokens: 120,
            output_tokens: 30,
            thinking_tokens: 10,
            cache_read_tokens: 0,
            total_tokens: 160,
          },
        }),
        stderr: "",
      };
    }
    throw new Error(`Unexpected agy CLI args: ${args.join(" ")}`);
  };

  return { execFileImpl, calls };
}

test("parseAgyModelsOutput strips ANSI/spinner frames and extracts models cleanly", () => {
  const raw =
    "\x1b[2K\r⠋ Fetching available models...\r⠙ Fetching available models...\rgemini-4-neon-xhigh            Gemini 4 Neon (XHigh)\nclaude-opus-5-5-high           Claude Opus 5.5 (High)\n\n";
  const models = parseAgyModelsOutput(raw);
  assert.equal(models.length, 2);
  assert.deepEqual(models[0], {
    id: "gemini-4-neon-xhigh",
    label: "Gemini 4 Neon (XHigh)",
    object: "model",
    ownedBy: "antigravity_cli",
  });
  assert.equal(models[1].id, "claude-opus-5-5-high");
});

test("formatMessagesForCli keeps single user prompt clean and formats multi-turn with system instructions", () => {
  const single = formatMessagesForCli([{ role: "user", content: "Halo dunia" }]);
  assert.equal(single, "Halo dunia");

  const multi = formatMessagesForCli(
    [
      { role: "system", content: "Jadilah sutradara dokumenter." },
      { role: "user", content: "Buat hook 3 detik." },
      { role: "assistant", content: "Tahukah kamu?" },
      { role: "user", content: "Perkuat hook-nya." },
    ],
    "Bahasa Indonesia santai."
  );
  assert.match(multi, /System Instructions:/);
  assert.match(multi, /Bahasa Indonesia santai\./);
  assert.match(multi, /Jadilah sutradara dokumenter\./);
  assert.match(multi, /Assistant:\nTahukah kamu\?/);
  assert.match(multi, /User:\nPerkuat hook-nya\./);
});

test("parseAgyJsonOutput handles clean JSON and preamble noise, rejects non-JSON", () => {
  const clean = parseAgyJsonOutput('{"status":"SUCCESS","response":"OK"}');
  assert.equal(clean.response, "OK");

  const noisy = parseAgyJsonOutput('warn: minor notice\n{"status":"SUCCESS","response":"YES"}\n');
  assert.equal(noisy.response, "YES");

  assert.throws(() => parseAgyJsonOutput("plain text error"), AIGatewayInvalidResponseError);
});

test("agyCliAdapter happy path: health, cached models, effort/jsonSchema args, normalized chat response", async () => {
  const { execFileImpl, calls } = makeMockCliExec();

  const cli = createAntigravityCliAdapter({
    env: {
      AI_PREMIUM_MODEL: "gemini-4-neon-xhigh",
      AI_PREMIUM_EFFORT: "high",
    },
    execFileImpl,
    logSink: () => {},
  });

  const health = await cli.checkHealth();
  assert.equal(health.ok, true);
  assert.equal(health.version, "1.5.18");

  const m1 = await cli.listModels();
  assert.equal(m1.models.length, 3);
  assert.equal(m1.cached, false);

  const res = await cli.chatCompletion({
    messages: [{ role: "user", content: "Tulis hook singkat." }],
    jsonSchema: { type: "object", properties: { hook: { type: "string" } } },
  });

  assert.equal(res.provider, "antigravity_cli");
  assert.equal(res.model, "gemini-4-neon-xhigh");
  assert.equal(res.content, "Respon premium dari agy CLI.");
  assert.equal(res.usage.promptTokens, 120);
  assert.equal(res.usage.completionTokens, 30);
  assert.equal(res.usage.thinkingTokens, 10);
  assert.equal(res.usage.totalTokens, 160);

  // `agy models` was called only once (cached during verifyModel)
  const modelCalls = calls.filter((c) => c.args[0] === "models");
  assert.equal(modelCalls.length, 1);

  const printCall = calls.find((c) => c.args.some((a) => a.startsWith("--print=")));
  assert.ok(printCall.args.includes("--output-format"));
  assert.ok(printCall.args.includes("json"));
  assert.ok(printCall.args.includes("--disable-slash-commands"));
  assert.ok(printCall.args.includes("--model"));
  assert.ok(printCall.args.includes("gemini-4-neon-xhigh"));
  assert.ok(printCall.args.includes("--effort"));
  assert.ok(printCall.args.includes("high"));
  assert.ok(printCall.args.includes("--json-schema"));
});

test("agyCliAdapter rejects unavailable model and retries transient CLI failures", async () => {
  let chatTries = 0;
  const { execFileImpl } = makeMockCliExec({
    chatHandler: () => {
      chatTries += 1;
      if (chatTries === 1) {
        const err = new Error("HTTP 503 Service Unavailable");
        err.stderr = "503 Service Unavailable";
        err.code = 1;
        throw err;
      }
      return {
        stdout: JSON.stringify({
          conversation_id: "conv-retry-ok",
          status: "SUCCESS",
          response: "Berhasil setelah retry.",
          usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        }),
        stderr: "",
      };
    },
  });

  const cli = createAntigravityCliAdapter({
    env: {
      AI_PREMIUM_MODEL: "gemini-4-neon-high",
      AI_PREMIUM_MAX_RETRIES: "2",
    },
    execFileImpl,
    sleepImpl: async () => {},
    logSink: () => {},
  });

  await assert.rejects(
    () =>
      cli.chatCompletion({
        model: "nonexistent-pro-model",
        messages: [{ role: "user", content: "Hi" }],
      }),
    AIGatewayModelUnavailableError
  );
  assert.equal(chatTries, 0);

  const recovered = await cli.chatCompletion({
    messages: [{ role: "user", content: "Test retry" }],
  });
  assert.equal(chatTries, 2);
  assert.equal(recovered.attempts, 2);
  assert.equal(recovered.content, "Berhasil setelah retry.");
});

test("agyCliAdapter converts killed/SIGTERM execution into retryable AIGatewayTimeoutError", async () => {
  let tries = 0;
  const { execFileImpl } = makeMockCliExec({
    chatHandler: () => {
      tries += 1;
      const err = new Error("Command timed out");
      err.killed = true;
      err.signal = "SIGTERM";
      throw err;
    },
  });

  const cli = createAntigravityCliAdapter({
    env: {
      AI_PREMIUM_MODEL: "gemini-4-neon-high",
      AI_PREMIUM_MAX_RETRIES: "1",
      AGY_CLI_VERIFY_MODEL_AVAILABLE: "false",
    },
    execFileImpl,
    sleepImpl: async () => {},
    logSink: () => {},
  });

  await assert.rejects(
    () => cli.chatCompletion({ messages: [{ role: "user", content: "Slow prompt" }] }),
    (err) => err instanceof AIGatewayTimeoutError && err.retryable === true
  );
  assert.equal(tries, 2);
});

test("2-route router routes STANDARD to AGYBridge Render and PREMIUM to agy CLI by tier & task policy", async () => {
  const bridgeHits = [];
  const { execFileImpl, calls: cliCalls } = makeMockCliExec();
  const usageEvents = [];

  await withMockBridgeServer(
    (req, res) => {
      if (req.url === "/version/info") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, version: "f94ec77" }));
        return;
      }
      if (req.url === "/v1/models") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            object: "list",
            data: [{ id: "gemini-2.5-flash", object: "model", owned_by: "google" }],
          })
        );
        return;
      }
      if (req.url === "/v1/chat/completions" && req.method === "POST") {
        let raw = "";
        req.on("data", (c) => (raw += c));
        req.on("end", () => {
          const payload = JSON.parse(raw);
          bridgeHits.push(payload);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              id: "chatcmpl-std-1",
              object: "chat.completion",
              model: payload.model,
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "Caption IG & YT siap." },
                  finish_reason: "stop",
                },
              ],
              usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
            })
          );
        });
        return;
      }
      res.writeHead(404);
      res.end();
    },
    async (baseUrl) => {
      const router = createAIRouter({
        env: {
          AI_ROUTE_DEFAULT: "standard",
          AI_STANDARD_MODEL: "gemini-2.5-flash",
          AI_PREMIUM_MODEL: "claude-opus-5-5-high",
          AGYBRIDGE_RENDER_URL: baseUrl,
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
          AGYBRIDGE_ALLOW_HTTP: "true",
        },
        premiumOptions: { execFileImpl },
        onUsage: (ev) => usageEvents.push(ev),
        logSink: () => {},
      });

      // 1. Task-based STANDARD route (`metadata`)
      const stdRes = await router.chatCompletion({
        task: "metadata",
        messages: [{ role: "user", content: "Buat caption shorts" }],
      });
      assert.equal(stdRes.route.tier, AI_TIERS.STANDARD);
      assert.equal(stdRes.route.provider, "agybridge");
      assert.equal(stdRes.model, "gemini-2.5-flash");
      assert.equal(stdRes.content, "Caption IG & YT siap.");
      assert.equal(bridgeHits.length, 1);

      // 2. Task-based PREMIUM route (`script_master`) -> uses env-configured model easily!
      const premRes = await router.chatCompletion({
        task: "script_master",
        messages: [{ role: "user", content: "Buat master script ep 006" }],
      });
      assert.equal(premRes.route.tier, AI_TIERS.PREMIUM);
      assert.equal(premRes.route.provider, "antigravity_cli");
      assert.equal(premRes.model, "claude-opus-5-5-high");
      assert.equal(premRes.content, "Respon premium dari agy CLI.");
      assert.ok(cliCalls.some((c) => c.args.includes("claude-opus-5-5-high")));

      // 3. Health & models check across both routes
      const healthAll = await router.checkHealth({ tier: "all" });
      assert.equal(healthAll.ok, true);
      assert.equal(healthAll.standard.ok, true);
      assert.equal(healthAll.premium.ok, true);

      const modelsAll = await router.listModels({ tier: "all" });
      assert.equal(modelsAll.standard.ok, true);
      assert.equal(modelsAll.premium.ok, true);
      assert.equal(modelsAll.standard.models[0].id, "gemini-2.5-flash");
      assert.equal(modelsAll.premium.models.length, 3);

      // 4. Telemetry recorded for both routes
      assert.equal(usageEvents.length, 2);
      assert.equal(usageEvents[0].tier, "standard");
      assert.equal(usageEvents[1].tier, "premium");
    }
  );
});

test("router initializes adapters lazily (PREMIUM works without AGYBridge credentials)", async () => {
  const { execFileImpl } = makeMockCliExec();

  const router = createAIRouter({
    env: {
      AI_PREMIUM_MODEL: "gemini-4-neon-xhigh",
      // Intentionally NO AGYBRIDGE_RENDER_URL / AGYBRIDGE_RENDER_API_KEY
    },
    premiumOptions: { execFileImpl },
    logSink: () => {},
  });

  const res = await router.chatCompletion({
    tier: "premium",
    messages: [{ role: "user", content: "Premium only call" }],
  });
  assert.equal(res.route.tier, "premium");
  assert.equal(res.model, "gemini-4-neon-xhigh");
});

test("router fallback: disabled by default, opt-in falls back ONLY on transient errors (never on 401/403)", async () => {
  const { execFileImpl } = makeMockCliExec();
  let bridgeStatus = 503;

  await withMockBridgeServer(
    (req, res) => {
      res.writeHead(bridgeStatus, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `HTTP ${bridgeStatus}` }));
    },
    async (baseUrl) => {
      const commonEnv = {
        AI_STANDARD_MODEL: "gemini-2.5-flash",
        AI_PREMIUM_MODEL: "gemini-4-neon-high",
        AGYBRIDGE_RENDER_URL: baseUrl,
        AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
        AGYBRIDGE_ALLOW_HTTP: "true",
        AGYBRIDGE_VERIFY_MODEL_AVAILABLE: "false",
        AGYBRIDGE_MAX_RETRIES: "0",
      };

      // Strict default: NO fallback on 503
      const strictRouter = createAIRouter({
        env: commonEnv,
        premiumOptions: { execFileImpl },
        logSink: () => {},
      });
      await assert.rejects(
        () =>
          strictRouter.chatCompletion({
            tier: "standard",
            messages: [{ role: "user", content: "Hi" }],
          }),
        (err) => err.status === 503
      );

      // Opt-in fallback: 503 on STANDARD falls back to PREMIUM
      const fallbackRouter = createAIRouter({
        env: { ...commonEnv, AI_ROUTER_FALLBACK_ON_TRANSIENT: "true" },
        premiumOptions: { execFileImpl },
        logSink: () => {},
      });
      const recovered = await fallbackRouter.chatCompletion({
        tier: "standard",
        messages: [{ role: "user", content: "Recover via fallback" }],
      });
      assert.equal(recovered.route.tier, "premium");
      assert.equal(recovered.route.fallbackUsed, true);
      assert.equal(recovered.route.primaryTier, "standard");

      // Auth error (403) MUST NOT fall back even when fallback is enabled
      bridgeStatus = 403;
      await assert.rejects(
        () =>
          fallbackRouter.chatCompletion({
            tier: "standard",
            messages: [{ role: "user", content: "Bad auth" }],
          }),
        AIGatewayAuthError
      );
    }
  );
});

test("createAIGateway supports router provider and rejects invalid tier/effort configs", () => {
  const gw = createAIGateway({ env: { AI_GATEWAY_PROVIDER: "router" } });
  assert.equal(typeof gw.resolveRoute, "function");
  assert.equal(typeof gw.chatCompletion, "function");

  assert.throws(
    () => createAIRouter({ env: { AI_ROUTE_DEFAULT: "ultra" } }),
    AIGatewayConfigError
  );

  assert.throws(
    () => createAntigravityCliAdapter({ env: { AI_PREMIUM_EFFORT: "extreme" } }),
    AIGatewayConfigError
  );
});
