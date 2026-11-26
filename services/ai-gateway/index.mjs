/**
 * Unified AI Gateway & 2-Route Router facade for Kok Iso Yo?.
 *
 * 2-Route Architecture (`createAIRouter`):
 * - STANDARD -> AGYBridge Render OpenAI-compatible HTTP API (`createAGYBridgeAdapter`)
 * - PREMIUM  -> Local `agy` CLI on VPS (`createAntigravityCliAdapter`)
 *
 * Legacy / single-provider facade (`createAIGateway`):
 * - Default provider remains `antigravity_cli` for full backward compatibility.
 * - Set `AI_GATEWAY_PROVIDER=agybridge` for single-provider AGYBridge mode.
 * - Set `AI_GATEWAY_PROVIDER=router` (or call `createAIRouter()` directly) for 2-route STANDARD/PREMIUM mode.
 */

import { createAGYBridgeAdapter } from "./agybridgeAdapter.mjs";
import { createAntigravityCliAdapter } from "./agyCliAdapter.mjs";
import { resolveGatewayConfig } from "./config.mjs";
import { AIGatewayConfigError } from "./errors.mjs";
import { createAIRouter } from "./router.mjs";

export * from "./errors.mjs";
export { createAGYBridgeAdapter } from "./agybridgeAdapter.mjs";
export {
  createAntigravityCliAdapter,
  formatMessagesForCli,
  parseAgyJsonOutput,
  parseAgyModelsOutput,
  stripTerminalNoise,
} from "./agyCliAdapter.mjs";
export { createAIRouter } from "./router.mjs";
export {
  AI_TIERS,
  DEFAULT_PREMIUM_TASKS,
  DEFAULT_STANDARD_TASKS,
  VALID_EFFORT_LEVELS,
  loadEnvFile,
  parseEnvContent,
  resolveAgyCliConfig,
  resolveGatewayConfig,
  resolveRouterConfig,
  validateAGYBridgeConfig,
} from "./config.mjs";
export { createSafeLogger, redactText } from "./logger.mjs";

export function createAIGateway(options = {}) {
  const cfg = resolveGatewayConfig({
    env: options.env ?? process.env,
    envFile: options.envFile,
    overrides: options,
  });

  if (cfg.provider === "agybridge") {
    return createAGYBridgeAdapter(options);
  }
  if (cfg.provider === "antigravity_cli") {
    return createAntigravityCliAdapter(options);
  }
  if (cfg.provider === "router") {
    return createAIRouter(options);
  }

  throw new AIGatewayConfigError(
    `Unsupported AI_GATEWAY_PROVIDER "${cfg.provider}". Expected "agybridge", "antigravity_cli", or "router".`
  );
}
