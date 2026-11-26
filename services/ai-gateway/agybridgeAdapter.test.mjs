/**
 * Unit & mock HTTP integration tests for Kok Iso Yo? AGYBridge AI Gateway adapter.
 * Runs completely offline via Node built-in `node:test` + local mock `node:http` server.
 */

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  createAGYBridgeAdapter,
  createAIGateway,
  AIGatewayAuthError,
  AIGatewayConfigError,
  AIGatewayHttpError,
  AIGatewayInvalidResponseError,
  AIGatewayModelUnavailableError,
  AIGatewayTimeoutError,
} from "./index.mjs";

const FAKE_SECRET = "super-secret-render-api-key-987654";

async function withMockServer(handler, fn) {
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

test("config validation rejects missing URL, non-HTTPS URL by default, and missing API key", () => {
  assert.throws(
    () => createAGYBridgeAdapter({ env: {} }),
    (err) => err instanceof AIGatewayConfigError
  );

  assert.throws(
    () =>
      createAGYBridgeAdapter({
        env: {
          AGYBRIDGE_RENDER_URL: "http://example.com",
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
        },
      }),
    (err) => err instanceof AIGatewayConfigError && /HTTPS/i.test(err.message)
  );

  assert.throws(
    () =>
      createAGYBridgeAdapter({
        env: { AGYBRIDGE_RENDER_URL: "https://agybridge.onrender.com" },
      }),
    (err) => err instanceof AIGatewayConfigError && /API_KEY/i.test(err.message)
  );
});

test("happy path: health check, /v1/models discovery, model verification, and /v1/chat/completions", async () => {
  let modelsCalls = 0;
  let chatAuthHeader = "";
  let chatPayload = null;
  const logLines = [];

  await withMockServer(
    (req, res) => {
      if (req.url === "/version/info") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, version: "f94ec77" }));
        return;
      }
      if (req.url === "/v1/models") {
        modelsCalls += 1;
        assert.equal(req.headers.authorization, `Bearer ${FAKE_SECRET}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            object: "list",
            data: [
              { id: "gemini-2.5-flash", object: "model", owned_by: "google" },
              { id: "claude-sonnet-4-6", object: "model", owned_by: "google" },
            ],
          })
        );
        return;
      }
      if (req.url === "/v1/chat/completions" && req.method === "POST") {
        chatAuthHeader = req.headers.authorization || "";
        let raw = "";
        req.on("data", (c) => (raw += c));
        req.on("end", () => {
          chatPayload = JSON.parse(raw);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              id: "chatcmpl-test-1",
              object: "chat.completion",
              model: chatPayload.model,
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "Beton memuai saat suhu meningkat." },
                  finish_reason: "stop",
                },
              ],
              usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
            })
          );
        });
        return;
      }
      res.writeHead(404);
      res.end("not found");
    },
    async (baseUrl) => {
      const adapter = createAGYBridgeAdapter({
        env: {
          AGYBRIDGE_RENDER_URL: baseUrl,
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
          AGYBRIDGE_DEFAULT_MODEL: "gemini-2.5-flash",
          AGYBRIDGE_ALLOW_HTTP: "true",
        },
        logSink: (_lvl, line) => logLines.push(line),
      });

      const health = await adapter.checkHealth();
      assert.equal(health.ok, true);
      assert.equal(health.version, "f94ec77");

      const m1 = await adapter.listModels();
      assert.equal(m1.models.length, 2);
      assert.equal(m1.cached, false);

      const chat = await adapter.chatCompletion({
        messages: [{ role: "user", content: "Halo" }],
      });
      assert.equal(chatAuthHeader, `Bearer ${FAKE_SECRET}`);
      assert.equal(chatPayload.model, "gemini-2.5-flash");
      assert.equal(chat.content, "Beton memuai saat suhu meningkat.");
      assert.equal(chat.usage.totalTokens, 20);
      assert.equal(modelsCalls, 1, "model list should be served from cache during verifyModel");

      for (const line of logLines) {
        assert.equal(line.includes(FAKE_SECRET), false, "API key must never appear in logs");
      }
      assert.ok(
        logLines.some((line) => line.includes('"totalTokens":20')),
        "non-secret token count metric should remain readable in logs"
      );
    }
  );
});

test("rejects model not present in /v1/models without calling /v1/chat/completions", async () => {
  let chatCalled = false;

  await withMockServer(
    (req, res) => {
      if (req.url === "/v1/models") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ object: "list", data: [{ id: "gemini-2.5-flash", object: "model" }] }));
        return;
      }
      if (req.url === "/v1/chat/completions") {
        chatCalled = true;
      }
      res.writeHead(500);
      res.end();
    },
    async (baseUrl) => {
      const adapter = createAGYBridgeAdapter({
        env: {
          AGYBRIDGE_RENDER_URL: baseUrl,
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
          AGYBRIDGE_ALLOW_HTTP: "true",
        },
        logSink: () => {},
      });

      await assert.rejects(
        () =>
          adapter.chatCompletion({
            model: "nonexistent-model-xyz",
            messages: [{ role: "user", content: "Test" }],
          }),
        (err) => err instanceof AIGatewayModelUnavailableError
      );
      assert.equal(chatCalled, false);
    }
  );
});

test("401/403 authentication failure does NOT retry and never leaks API key", async () => {
  let calls = 0;
  const logLines = [];

  await withMockServer(
    (req, res) => {
      calls += 1;
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: `Rejected token ${FAKE_SECRET}` }));
    },
    async (baseUrl) => {
      const adapter = createAGYBridgeAdapter({
        env: {
          AGYBRIDGE_RENDER_URL: baseUrl,
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
          AGYBRIDGE_ALLOW_HTTP: "true",
          AGYBRIDGE_MAX_RETRIES: "2",
        },
        sleepImpl: async () => {},
        logSink: (_lvl, line) => logLines.push(line),
      });

      await assert.rejects(
        () => adapter.listModels(),
        (err) => {
          assert.ok(err instanceof AIGatewayAuthError);
          assert.equal(err.status, 403);
          assert.equal(err.message.includes(FAKE_SECRET), false);
          return true;
        }
      );

      assert.equal(calls, 1, "auth errors must not be retried");
      for (const line of logLines) {
        assert.equal(line.includes(FAKE_SECRET), false);
      }
    }
  );
});

test("transient 502/503 failure retries limited times and succeeds upon recovery", async () => {
  let attempts = 0;

  await withMockServer(
    (req, res) => {
      if (req.url === "/v1/models") {
        attempts += 1;
        if (attempts < 3) {
          res.writeHead(attempts === 1 ? 502 : 503, { "Content-Type": "text/plain" });
          res.end("Bad Gateway");
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ object: "list", data: [{ id: "gemini-2.5-flash", object: "model" }] }));
        return;
      }
      res.writeHead(404);
      res.end();
    },
    async (baseUrl) => {
      const adapter = createAGYBridgeAdapter({
        env: {
          AGYBRIDGE_RENDER_URL: baseUrl,
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
          AGYBRIDGE_ALLOW_HTTP: "true",
          AGYBRIDGE_MAX_RETRIES: "2",
          AGYBRIDGE_RETRY_BASE_MS: "50",
        },
        sleepImpl: async () => {},
        logSink: () => {},
      });

      const res = await adapter.listModels();
      assert.equal(attempts, 3);
      assert.equal(res.attempts, 3);
      assert.equal(res.models[0].id, "gemini-2.5-flash");
    }
  );
});

test("transient 504 exhaustion throws retryable AIGatewayHttpError after maxRetries + 1 attempts", async () => {
  let attempts = 0;

  await withMockServer(
    (req, res) => {
      attempts += 1;
      res.writeHead(504, { "Content-Type": "text/plain" });
      res.end(`Gateway timeout for Bearer ${FAKE_SECRET}`);
    },
    async (baseUrl) => {
      const adapter = createAGYBridgeAdapter({
        env: {
          AGYBRIDGE_RENDER_URL: baseUrl,
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
          AGYBRIDGE_ALLOW_HTTP: "true",
          AGYBRIDGE_MAX_RETRIES: "1",
          AGYBRIDGE_RETRY_BASE_MS: "50",
        },
        sleepImpl: async () => {},
        logSink: () => {},
      });

      await assert.rejects(
        () => adapter.listModels(),
        (err) => {
          assert.ok(err instanceof AIGatewayHttpError);
          assert.equal(err.status, 504);
          assert.equal(err.retryable, true);
          assert.equal(JSON.stringify(err.meta).includes(FAKE_SECRET), false);
          return true;
        }
      );
      assert.equal(attempts, 2);
    }
  );
});

test("request timeout aborts, retries up to maxRetries, and throws AIGatewayTimeoutError", async () => {
  let attempts = 0;

  await withMockServer(
    (req, res) => {
      attempts += 1;
      setTimeout(() => {
        if (!res.writableEnded) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ object: "list", data: [] }));
        }
      }, 2_000).unref();
    },
    async (baseUrl) => {
      const adapter = createAGYBridgeAdapter({
        env: {
          AGYBRIDGE_RENDER_URL: baseUrl,
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
          AGYBRIDGE_ALLOW_HTTP: "true",
          AGYBRIDGE_TIMEOUT_MS: "1000",
          AGYBRIDGE_MAX_RETRIES: "1",
          AGYBRIDGE_RETRY_BASE_MS: "50",
        },
        sleepImpl: async () => {},
        logSink: () => {},
      });

      await assert.rejects(
        () => adapter.listModels(),
        (err) => err instanceof AIGatewayTimeoutError && err.retryable === true
      );
      assert.equal(attempts, 2);
    }
  );
});

test("invalid JSON and invalid OpenAI response shapes throw AIGatewayInvalidResponseError without retry", async () => {
  let mode = "bad-json";
  let calls = 0;

  await withMockServer(
    (req, res) => {
      calls += 1;
      res.writeHead(200, { "Content-Type": "application/json" });
      if (mode === "bad-json") {
        res.end("<html>not json</html>");
      } else if (mode === "empty-choices") {
        res.end(JSON.stringify({ id: "x", object: "chat.completion", choices: [] }));
      } else {
        res.end(JSON.stringify({ object: "unexpected", items: [] }));
      }
    },
    async (baseUrl) => {
      const adapter = createAGYBridgeAdapter({
        env: {
          AGYBRIDGE_RENDER_URL: baseUrl,
          AGYBRIDGE_RENDER_API_KEY: FAKE_SECRET,
          AGYBRIDGE_ALLOW_HTTP: "true",
          AGYBRIDGE_MAX_RETRIES: "2",
          AGYBRIDGE_VERIFY_MODEL_AVAILABLE: "false",
        },
        sleepImpl: async () => {},
        logSink: () => {},
      });

      await assert.rejects(() => adapter.listModels(), AIGatewayInvalidResponseError);
      assert.equal(calls, 1);

      mode = "empty-choices";
      await assert.rejects(
        () =>
          adapter.chatCompletion({
            model: "gemini-2.5-flash",
            messages: [{ role: "user", content: "Hi" }],
          }),
        AIGatewayInvalidResponseError
      );
      assert.equal(calls, 2);

      mode = "bad-models-shape";
      await assert.rejects(() => adapter.listModels(), AIGatewayInvalidResponseError);
      assert.equal(calls, 3);
    }
  );
});

test("facade maintains backward compatibility with antigravity_cli default provider", () => {
  const defaultGw = createAIGateway({ env: {} });
  assert.equal(defaultGw.provider, "antigravity_cli");
});
