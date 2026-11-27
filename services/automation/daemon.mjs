/**
 * Kok Iso Yo? Automation Tick & Daemon Runner.
 *
 * Designed to run persistently via PM2 (`kokisoyo-automation`):
 * Every interval (default 15 minutes):
 * 1. Check daily publishing slot -> if in window & stock available, run 5-Step SOP publish
 * 2. Check stock watermark & VPS render status -> if below watermark & idle, produce 1 episode
 */

import path from "node:path";
import { loadEnvFile } from "../ai-gateway/index.mjs";
import { loadQueueState, publishNextFromStock, saveQueueState } from "./stockQueue.mjs";
import { produceNextEpisode } from "./productionWorker.mjs";

export async function runAutomationTick({
  rootDir,
  statePath = path.join(rootDir, "out", "automation", "queue_state.json"),
  env = process.env,
  envFile = undefined,
  dryRun = true,
  now = new Date(),
  fetchImpl = globalThis.fetch,
} = {}) {
  const mergedEnv = {
    ...(envFile ? loadEnvFile(envFile) : {}),
    ...env,
  };

  let publishRes = null;
  let produceRes = null;
  let publishErr = null;
  let produceErr = null;

  try {
    publishRes = await publishNextFromStock({
      statePath,
      env: mergedEnv,
      dryRun,
      now,
      fetchImpl,
    });
  } catch (err) {
    publishErr = err?.message || String(err);
  }

  try {
    produceRes = await produceNextEpisode({
      rootDir,
      statePath,
      env: mergedEnv,
      envFile,
      dryRun,
    });
  } catch (err) {
    produceErr = err?.message || String(err);
  }

  const state = loadQueueState(statePath);
  state.lastTickAt = now.toISOString();
  state.lastError = publishErr || produceErr || null;
  saveQueueState(statePath, state);

  return {
    ok: !publishErr && !produceErr,
    dryRun,
    tickAt: state.lastTickAt,
    publish: publishErr ? { ok: false, error: publishErr } : publishRes,
    produce: produceErr ? { ok: false, error: produceErr } : produceRes,
  };
}

export async function startAutomationDaemon({
  rootDir,
  statePath = path.join(rootDir, "out", "automation", "queue_state.json"),
  envFile = undefined,
  dryRun = false,
  intervalMs = 15 * 60 * 1000,
} = {}) {
  let stopping = false;
  let timer = null;
  let runningTick = false;

  const log = (msg, data = null) => {
    const ts = new Date().toISOString();
    console.log(data ? `[${ts}] ${msg} ${JSON.stringify(data)}` : `[${ts}] ${msg}`);
  };

  const executeTick = async () => {
    if (stopping || runningTick) return;
    runningTick = true;
    try {
      const res = await runAutomationTick({
        rootDir,
        statePath,
        envFile,
        dryRun,
      });
      log("Automation tick completed", res);
    } catch (err) {
      log("Automation tick error", { error: err?.message || String(err) });
    } finally {
      runningTick = false;
    }
  };

  const shutdown = (sig) => {
    stopping = true;
    if (timer) clearInterval(timer);
    log(`Received ${sig}, stopping automation daemon cleanly.`);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  log("Kok Iso Yo? Automation Daemon started", {
    rootDir,
    statePath,
    dryRun,
    intervalMinutes: Math.round(intervalMs / 60_000),
  });

  await executeTick();
  timer = setInterval(executeTick, intervalMs);
}
