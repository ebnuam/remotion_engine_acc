/**
 * Unified AI Gateway facade for Kok Iso Yo?.
 *
 * - Default provider remains `antigravity_cli` for full backward compatibility.
 * - Set `AI_GATEWAY_PROVIDER=agybridge` (plus `AGYBRIDGE_RENDER_URL` and `AGYBRIDGE_RENDER_API_KEY`)
 *   to route model listing and chat completions through AGYBridge Render.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createAGYBridgeAdapter } from "./agybridgeAdapter.mjs";
import { loadEnvFile, resolveGatewayConfig } from "./config.mjs";
import { AIGatewayConfigError } from "./errors.mjs";

const execFileAsync = promisify(execFile);

export * from "./errors.mjs";
export { createAGYBridgeAdapter } from "./agybridgeAdapter.mjs";
export { loadEnvFile, resolveGatewayConfig, validateAGYBridgeConfig } from "./config.mjs";
export { createSafeLogger, redactText } from "./logger.mjs";

function createAntigravityCliAdapter() {
  return {
    provider: "antigravity_cli",
    async listModels() {
      const { stdout } = await execFileAsync("agy", ["models"], { timeout: 8_000 });
      const models = String(stdout || "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("Fetching "))
        .map((line) => {
          const [id, ...rest] = line.split(/\s+/);
          return { id, label: rest.join(" ") || id, ownedBy: "antigravity_cli" };
        })
        .filter((m) => m.id);
      return { models, cached: false, status: 200, latencyMs: 0, attempts: 1 };
    },
    async chatCompletion() {
      throw new AIGatewayConfigError(
        'Direct HTTP chatCompletion is only supported when AI_GATEWAY_PROVIDER="agybridge".'
      );
    },
  };
}

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
    return createAntigravityCliAdapter();
  }

  throw new AIGatewayConfigError(
    `Unsupported AI_GATEWAY_PROVIDER "${cfg.provider}". Expected "agybridge" or "antigravity_cli".`
  );
}
