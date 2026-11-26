#!/usr/bin/env node
/**
 * Isolated live smoke-test for AGYBridge Render adapter.
 * Reads configuration from process.env or an env file (--env-file / AGYBRIDGE_ENV_FILE).
 * NEVER prints API keys or raw Authorization headers.
 */

import { createAGYBridgeAdapter } from "./agybridgeAdapter.mjs";

function parseArgs(argv) {
  const args = { envFile: undefined, model: undefined, prompt: undefined, skipChat: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--env-file" && argv[i + 1]) args.envFile = argv[++i];
    else if (a === "--model" && argv[i + 1]) args.model = argv[++i];
    else if (a === "--prompt" && argv[i + 1]) args.prompt = argv[++i];
    else if (a === "--skip-chat") args.skipChat = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const adapter = createAGYBridgeAdapter({
    envFile: args.envFile,
    maxRetries: 1,
    logLevel: "info",
  });

  const health = await adapter.checkHealth();
  console.log("HEALTH:", JSON.stringify(health));

  const modelRes = await adapter.listModels({ forceRefresh: true });
  console.log(
    "MODELS:",
    JSON.stringify({
      status: modelRes.status,
      latencyMs: modelRes.latencyMs,
      attempts: modelRes.attempts,
      count: modelRes.models.length,
      sample: modelRes.models.slice(0, 10).map((m) => m.id),
    })
  );

  if (args.skipChat) return;

  const chosenModel =
    args.model ||
    adapter.defaultModel ||
    modelRes.models.find((m) => m.id === "gemini-2.5-flash")?.id ||
    modelRes.models[0]?.id;

  const prompt =
    args.prompt ||
    "Jelaskan dalam dua kalimat singkat mengapa jembatan beton membutuhkan sambungan muai (expansion joint).";

  const chat = await adapter.chatCompletion({
    model: chosenModel,
    messages: [{ role: "user", content: prompt }],
    verifyModel: true,
  });

  console.log(
    "CHAT:",
    JSON.stringify({
      status: chat.status,
      latencyMs: chat.latencyMs,
      attempts: chat.attempts,
      model: chat.model,
      finishReason: chat.finishReason,
      usage: chat.usage,
      contentPreview: chat.content.slice(0, 300),
    })
  );
}

main().catch((err) => {
  console.error("SMOKE_TEST_FAILED:", err.name, err.code || "", err.message);
  process.exit(1);
});
