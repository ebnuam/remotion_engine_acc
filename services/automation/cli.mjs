#!/usr/bin/env node
/**
 * Kok Iso Yo? Automation CLI (`status | add-topic | scout | enqueue-dir | publish-next | produce-next | tick | daemon`)
 */

import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "../ai-gateway/index.mjs";
import { createElevenLabsAdapter } from "../tts-gateway/providers/elevenLabsAdapter.mjs";
import {
  enqueueTopic,
  loadQueueState,
  publishNextFromStock,
  registerStockItem,
  resolveConfiguredPlatforms,
  saveQueueState,
  shouldProduceMore,
} from "./stockQueue.mjs";
import {
  isRenderProcessActive,
  produceNextEpisode,
  scoutTopics,
} from "./productionWorker.mjs";
import { runAutomationTick, startAutomationDaemon } from "./daemon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_FILE = path.join(os.homedir(), ".config", "kokisoyo", "agybridge_render.env");
const DEFAULT_STATE_PATH = path.join(ROOT, "out", "automation", "queue_state.json");

function parseArgs(argv) {
  const cmd = argv[0] || "status";
  const opts = {
    cmd,
    envFile: DEFAULT_ENV_FILE,
    statePath: DEFAULT_STATE_PATH,
    dryRun: true,
    force: false,
    topic: "",
    slug: "",
    dir: "",
    count: 5,
    intervalMinutes: 15,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--live") opts.dryRun = false;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--env-file" && argv[i + 1]) opts.envFile = argv[++i];
    else if (a === "--state-file" && argv[i + 1]) opts.statePath = argv[++i];
    else if (a === "--topic" && argv[i + 1]) opts.topic = argv[++i];
    else if (a === "--slug" && argv[i + 1]) opts.slug = argv[++i];
    else if (a === "--dir" && argv[i + 1]) opts.dir = argv[++i];
    else if (a === "--count" && argv[i + 1]) opts.count = Number(argv[++i]);
    else if (a === "--interval-min" && argv[i + 1]) opts.intervalMinutes = Number(argv[++i]);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const env = {
    ...loadEnvFile(opts.envFile),
    ...process.env,
  };

  if (opts.cmd === "status") {
    const state = loadQueueState(opts.statePath);
    const elAdapter = createElevenLabsAdapter({ env, envFile: opts.envFile });
    const quota = await elAdapter.checkQuotas();
    const renderActive = await isRenderProcessActive();
    const stockCheck = shouldProduceMore(state);
    console.log(
      JSON.stringify(
        {
          statePath: opts.statePath,
          renderActive,
          platformsReady: resolveConfiguredPlatforms(env),
          elevenLabs: quota,
          stockSummary: {
            ready: state.stock.filter((s) => s.status === "ready").length,
            published: state.publishedHistory.length,
            failed: state.stock.filter((s) => s.status === "failed").length,
            queuedTopics: state.topics.filter((t) => t.status === "queued").length,
            shouldProduceMore: stockCheck,
          },
          config: state.config,
          lastTickAt: state.lastTickAt,
          lastError: state.lastError,
        },
        null,
        2
      )
    );
    return;
  }

  if (opts.cmd === "add-topic") {
    const state = loadQueueState(opts.statePath);
    const res = enqueueTopic(state, { slug: opts.slug, topic: opts.topic, rootDir: ROOT });
    saveQueueState(opts.statePath, state);
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (opts.cmd === "scout") {
    const state = loadQueueState(opts.statePath);
    const added = await scoutTopics({
      rootDir: ROOT,
      state,
      env,
      envFile: opts.envFile,
      count: opts.count,
    });
    saveQueueState(opts.statePath, state);
    console.log(JSON.stringify({ addedCount: added.length, added }, null, 2));
    return;
  }

  if (opts.cmd === "enqueue-dir") {
    if (!opts.dir) throw new Error("--dir is required for enqueue-dir");
    const state = loadQueueState(opts.statePath);
    const res = registerStockItem(state, {
      slug: opts.slug || path.basename(opts.dir),
      topic: opts.topic,
      jobDir: path.resolve(ROOT, opts.dir),
    });
    saveQueueState(opts.statePath, state);
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (opts.cmd === "publish-next") {
    const res = await publishNextFromStock({
      statePath: opts.statePath,
      env,
      dryRun: opts.dryRun,
      force: opts.force,
    });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (opts.cmd === "produce-next") {
    const res = await produceNextEpisode({
      rootDir: ROOT,
      statePath: opts.statePath,
      env,
      envFile: opts.envFile,
      dryRun: opts.dryRun,
    });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (opts.cmd === "tick") {
    const res = await runAutomationTick({
      rootDir: ROOT,
      statePath: opts.statePath,
      env,
      envFile: opts.envFile,
      dryRun: opts.dryRun,
    });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (opts.cmd === "daemon") {
    await startAutomationDaemon({
      rootDir: ROOT,
      statePath: opts.statePath,
      envFile: opts.envFile,
      dryRun: opts.dryRun,
      intervalMs: Math.max(60_000, opts.intervalMinutes * 60_000),
    });
    return;
  }

  throw new Error(`Unknown command "${opts.cmd}".`);
}

main().catch((err) => {
  console.error("AUTOMATION_FAILED:", err?.message || String(err));
  process.exit(1);
});
