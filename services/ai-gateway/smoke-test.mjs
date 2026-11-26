#!/usr/bin/env node
/**
 * Isolated live smoke-test for Kok Iso Yo? AI Gateway & 2-Route Router.
 *
 * Examples:
 *   node services/ai-gateway/smoke-test.mjs --env-file ~/.config/kokisoyo/agybridge_render.env --tier standard
 *   node services/ai-gateway/smoke-test.mjs --tier premium --premium-model gemini-3.8-flash-low
 *   node services/ai-gateway/smoke-test.mjs --env-file ~/.config/kokisoyo/agybridge_render.env --tier both
 *
 * NEVER prints API keys or raw Authorization headers.
 */

import { AI_TIERS, createAIRouter } from "./index.mjs";

function parseArgs(argv) {
  const args = {
    envFile: undefined,
    tier: "standard",
    model: undefined,
    standardModel: undefined,
    premiumModel: undefined,
    prompt: undefined,
    skipChat: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--env-file" && argv[i + 1]) args.envFile = argv[++i];
    else if (a === "--tier" && argv[i + 1]) args.tier = argv[++i].toLowerCase();
    else if (a === "--model" && argv[i + 1]) args.model = argv[++i];
    else if (a === "--standard-model" && argv[i + 1]) args.standardModel = argv[++i];
    else if (a === "--premium-model" && argv[i + 1]) args.premiumModel = argv[++i];
    else if (a === "--prompt" && argv[i + 1]) args.prompt = argv[++i];
    else if (a === "--skip-chat") args.skipChat = true;
  }
  return args;
}

async function testTier(router, tier, { explicitModel, prompt, skipChat }) {
  console.log(`\n=== SMOKE TEST ROUTE: ${tier.toUpperCase()} ===`);

  const health = await router.checkHealth({ tier });
  console.log("HEALTH:", JSON.stringify(health));

  const modelRes = await router.listModels({ tier, forceRefresh: true });
  console.log(
    "MODELS:",
    JSON.stringify({
      tier,
      status: modelRes.status,
      latencyMs: modelRes.latencyMs,
      attempts: modelRes.attempts,
      count: modelRes.models.length,
      sample: modelRes.models.slice(0, 10).map((m) => m.id),
    })
  );

  if (skipChat) return;

  const summary = router.getConfigSummary();
  const configuredModel = tier === AI_TIERS.STANDARD ? summary.standardModel : summary.premiumModel;
  const fallbackPick =
    tier === AI_TIERS.STANDARD
      ? modelRes.models.find((m) => m.id === "gemini-2.5-flash")?.id || modelRes.models[0]?.id
      : modelRes.models.find((m) => m.id === "gemini-4-neon-high")?.id ||
        modelRes.models.find((m) => m.id === "gemini-3.8-flash-low")?.id ||
        modelRes.models[0]?.id;

  const chosenModel = explicitModel || configuredModel || fallbackPick;
  const testPrompt =
    prompt ||
    "Jelaskan dalam satu kalimat singkat mengapa daun berwarna hijau.";

  const chat = await router.chatCompletion({
    tier,
    model: chosenModel,
    messages: [{ role: "user", content: testPrompt }],
    verifyModel: true,
  });

  console.log(
    "CHAT:",
    JSON.stringify({
      route: chat.route,
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const router = createAIRouter({
    envFile: args.envFile,
    logLevel: "info",
    standardOptions: { maxRetries: 1 },
    premiumOptions: { maxRetries: 1 },
  });

  if (args.tier === "both" || args.tier === "all") {
    await testTier(router, AI_TIERS.STANDARD, {
      explicitModel: args.standardModel || args.model,
      prompt: args.prompt,
      skipChat: args.skipChat,
    });
    await testTier(router, AI_TIERS.PREMIUM, {
      explicitModel: args.premiumModel || args.model,
      prompt: args.prompt,
      skipChat: args.skipChat,
    });
    return;
  }

  if (args.tier === AI_TIERS.STANDARD || args.tier === AI_TIERS.PREMIUM) {
    await testTier(router, args.tier, {
      explicitModel:
        (args.tier === AI_TIERS.STANDARD ? args.standardModel : args.premiumModel) || args.model,
      prompt: args.prompt,
      skipChat: args.skipChat,
    });
    return;
  }

  throw new Error(`Invalid --tier "${args.tier}". Expected "standard", "premium", or "both".`);
}

main().catch((err) => {
  console.error("SMOKE_TEST_FAILED:", err.name, err.code || "", err.message);
  process.exit(1);
});
