/**
 * Kok Iso Yo? End-to-End Automation Pipeline Orchestrator:
 *   Stage 1: GENERATE  (2-Route AI Router -> PREMIUM master script + STANDARD YT/FB/IG social pack)
 *   Stage 2: RENDER    (Remotion + Three.js + FFmpeg probe/QA on VPS, or validate existing MP4)
 *   Stage 3: POST      (YouTube Shorts, Facebook Reels, Instagram Reels — dryRun safe by default)
 *
 * Persists a resumable `manifest.json` after each stage under `out/pipeline/<jobId>/`.
 */

import fs from "node:fs";
import path from "node:path";
import { createAIRouter, loadEnvFile } from "../ai-gateway/index.mjs";
import { runGenerateStage } from "./generateStage.mjs";
import { runRenderStage } from "./renderStage.mjs";
import {
  SUPPORTED_PLATFORMS,
  getPlatformReadiness,
  publishToPlatforms,
} from "./publishers/index.mjs";

export const ALL_STAGES = Object.freeze(["generate", "render", "post"]);

function sanitizeSlug(raw) {
  return (
    String(raw || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "episode_job"
  );
}

function makeJobId(slug) {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return `${sanitizeSlug(slug)}_${ts}`;
}

function saveManifest(manifestPath, manifest) {
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

export async function runPipeline({
  rootDir = process.cwd(),
  jobId = undefined,
  jobDir = undefined,
  slug = "episode_auto",
  topic = "",
  durationSec = 60,
  style = "Jalur 3C (StageDoc3D PBR + Editorial 2D)",
  stages = ALL_STAGES,
  entry = undefined,
  compositionId = undefined,
  outMp4 = undefined,
  existingVideoPath = undefined,
  videoPublicUrl = undefined,
  platforms = SUPPORTED_PLATFORMS,
  dryRun = true,
  dryRunGenerate = undefined,
  dryRunRender = undefined,
  dryRunPost = undefined,
  runShortQa = false,
  premiumModel = undefined,
  standardModel = undefined,
  env = process.env,
  envFile = undefined,
  router = undefined,
  execFileImpl = undefined,
  fetchImpl = globalThis.fetch,
} = {}) {
  const mergedEnv = {
    ...(envFile ? loadEnvFile(envFile) : {}),
    ...env,
  };

  const resolvedSlug = sanitizeSlug(slug || topic);
  const resolvedJobId = jobId || makeJobId(resolvedSlug);
  const resolvedJobDir = jobDir || path.join(rootDir, "out", "pipeline", resolvedJobId);
  fs.mkdirSync(resolvedJobDir, { recursive: true });

  const manifestPath = path.join(resolvedJobDir, "manifest.json");
  const existingManifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : null;

  const manifest = existingManifest || {
    jobId: resolvedJobId,
    slug: resolvedSlug,
    topic,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dryRun,
    platformReadiness: getPlatformReadiness(mergedEnv),
    stages: {},
  };

  const activeStages = stages
    .map((s) => String(s || "").trim().toLowerCase())
    .filter((s) => ALL_STAGES.includes(s));

  const aiRouter =
    router ||
    createAIRouter({
      env: mergedEnv,
      envFile,
    });

  saveManifest(manifestPath, manifest);

  // Stage 1: GENERATE
  if (activeStages.includes("generate")) {
    const stageDryRun = typeof dryRunGenerate === "boolean" ? dryRunGenerate : dryRun;
    const genResult = await runGenerateStage({
      router: aiRouter,
      jobDir: resolvedJobDir,
      slug: resolvedSlug,
      topic: topic || manifest.topic,
      durationSec,
      style,
      dryRun: stageDryRun,
      premiumModel,
      standardModel,
    });
    manifest.stages.generate = {
      status: "completed",
      dryRun: stageDryRun,
      completedAt: new Date().toISOString(),
      routes: genResult.routes,
      usage: genResult.usage,
      files: genResult.files,
    };
    saveManifest(manifestPath, manifest);
  }

  // Stage 2: RENDER
  if (activeStages.includes("render")) {
    const stageDryRun = typeof dryRunRender === "boolean" ? dryRunRender : dryRun;
    const renderResult = await runRenderStage({
      rootDir,
      jobDir: resolvedJobDir,
      entry,
      compositionId,
      outMp4,
      existingVideoPath,
      runShortQa,
      dryRun: stageDryRun,
      ...(execFileImpl ? { execFileImpl } : {}),
    });
    manifest.stages.render = {
      status: "completed",
      dryRun: stageDryRun,
      completedAt: new Date().toISOString(),
      mode: renderResult.mode,
      videoPath: renderResult.videoPath,
      renderDurationMs: renderResult.renderDurationMs ?? null,
      commandPreview: renderResult.commandPreview ?? null,
      probe: renderResult.probe,
      qaDir: renderResult.qaDir ?? null,
    };
    saveManifest(manifestPath, manifest);
  }

  // Stage 3: POST (YT, FB, IG)
  if (activeStages.includes("post")) {
    const stageDryRun = typeof dryRunPost === "boolean" ? dryRunPost : dryRun;
    const socialPath = path.join(resolvedJobDir, "social_pack.json");
    const socialPack = fs.existsSync(socialPath)
      ? JSON.parse(fs.readFileSync(socialPath, "utf8"))
      : {};

    const targetVideoPath =
      manifest.stages.render?.videoPath ||
      (existingVideoPath
        ? path.isAbsolute(existingVideoPath)
          ? existingVideoPath
          : path.resolve(rootDir, existingVideoPath)
        : null);

    const postResult = await publishToPlatforms({
      platforms,
      videoPath: targetVideoPath,
      videoPublicUrl,
      socialPack,
      env: mergedEnv,
      dryRun: stageDryRun,
      fetchImpl,
    });

    manifest.stages.post = {
      status: postResult.ok ? "completed" : "partial_failure",
      dryRun: stageDryRun,
      completedAt: new Date().toISOString(),
      platforms: postResult.platforms,
      results: postResult.results,
    };
    saveManifest(manifestPath, manifest);
  }

  return {
    ok: manifest.stages.post ? manifest.stages.post.status !== "partial_failure" : true,
    jobId: resolvedJobId,
    jobDir: resolvedJobDir,
    manifestPath,
    manifest,
  };
}
