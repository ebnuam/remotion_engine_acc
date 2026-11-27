/**
 * Kok Iso Yo? End-to-End Automation Pipeline Orchestrator:
 *   Stage 1: GENERATE  (2-Route AI Router -> PREMIUM master script + STANDARD YT/FB/IG social pack)
 *   Stage 2: AUDIO     (Multi-Provider TTS Gateway + offline Python DSP mix_audio.py + BS.1770-4 QC)
 *   Stage 3: RENDER    (Remotion + Three.js + FFmpeg probe on VPS, or validate existing MP4)
 *   Stage 4: QC        (Unified editorial + social + audio loudness/license + video + short_qa gate)
 *   Stage 5: POST      (YouTube Shorts, Facebook Reels, Instagram Reels — dryRun safe by default;
 *                       live publish is automatically blocked if QC fails)
 *
 * Persists a resumable `manifest.json` after each stage under `out/pipeline/<jobId>/`.
 */

import fs from "node:fs";
import path from "node:path";
import { createAIRouter, loadEnvFile } from "../ai-gateway/index.mjs";
import { runAudioStage } from "./audioStage.mjs";
import { DEFAULT_VISUAL_STYLE, EDITORIAL_RULES, runGenerateStage } from "./generateStage.mjs";
import { runQcStage } from "./qcStage.mjs";
import { runRenderStage } from "./renderStage.mjs";
import { runSceneStage } from "./sceneStage.mjs";
import {
  SUPPORTED_PLATFORMS,
  getPlatformReadiness,
  publishToPlatforms,
} from "./publishers/index.mjs";

export const ALL_STAGES = Object.freeze(["generate", "audio", "scene", "render", "qc", "post"]);
export const AUTO25D_ENTRY = "src/auto25d/index.ts";
export const AUTO25D_COMPS = Object.freeze({
  final: "AutoEpisode25D",
  preview: "AutoEpisode25D-Preview",
});

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
  durationSec = EDITORIAL_RULES.targetDurationSec,
  style = DEFAULT_VISUAL_STYLE,
  stages = ALL_STAGES,
  entry = undefined,
  compositionId = undefined,
  outMp4 = undefined,
  existingVideoPath = undefined,
  renderProps = undefined,
  renderQuality = "final", // "final" (1080x1920) | "preview" (540x960)
  renderConcurrency = undefined,
  renderFrames = undefined,
  videoPublicUrl = undefined,
  thumbnailPath = undefined,
  useYouTubeSop = false,
  unlistedFirst = undefined,
  waitForProcessing = undefined,
  publishAt = undefined,
  seoFilename = undefined,
  platforms = SUPPORTED_PLATFORMS,
  // Audio stage options
  ttsMode = undefined,
  ttsProvider = undefined,
  voice = undefined,
  rate = "+0%",
  pitch = "+0Hz",
  musicPreset = "curious_doc",
  ambience = "none",
  syncPublicAudio = false,
  enforceAudioDuration = false,
  // Dry-run controls (fail-safe defaults)
  dryRun = true,
  dryRunGenerate = undefined,
  dryRunAudio = undefined,
  dryRunScene = undefined,
  dryRunRender = undefined,
  dryRunPost = undefined,
  // QC & safety gates
  runShortQa = false,
  allowDraftAudioForLivePost = false,
  // AI model overrides
  premiumModel = undefined,
  standardModel = undefined,
  env = process.env,
  envFile = undefined,
  router = undefined,
  ttsRouter = undefined,
  pythonBin = undefined,
  execFileImpl = undefined,
  probeImpl = undefined,
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
    (activeStages.includes("generate")
      ? createAIRouter({
          env: mergedEnv,
          envFile,
        })
      : null);

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
      status: genResult.ok ? "completed" : "validation_failed",
      dryRun: stageDryRun,
      completedAt: new Date().toISOString(),
      routes: genResult.routes,
      usage: genResult.usage,
      editorialQaAttempts: genResult.editorialQaAttempts ?? 0,
      editorialValidation: genResult.editorialValidation
        ? {
            passed: genResult.editorialValidation.passed,
            errors: genResult.editorialValidation.errors,
            warnings: genResult.editorialValidation.warnings,
            metrics: genResult.editorialValidation.metrics,
          }
        : null,
      files: genResult.files,
    };
    saveManifest(manifestPath, manifest);
  }

  // Stage 2: AUDIO (Multi-Provider TTS + Offline Python DSP Mix)
  if (activeStages.includes("audio")) {
    const stageDryRun = typeof dryRunAudio === "boolean" ? dryRunAudio : dryRun;
    const audioResult = await runAudioStage({
      rootDir,
      jobDir: resolvedJobDir,
      slug: resolvedSlug,
      ttsMode,
      ttsProvider,
      voice,
      rate,
      pitch,
      musicPreset,
      ambience,
      syncPublicAudio,
      enforceDurationWindow: enforceAudioDuration,
      dryRun: stageDryRun,
      env: mergedEnv,
      envFile,
      ...(ttsRouter ? { ttsRouter } : {}),
      ...(pythonBin ? { pythonBin } : {}),
      ...(execFileImpl ? { execFileImpl } : {}),
      ...(probeImpl ? { probeImpl } : {}),
    });
    manifest.stages.audio = {
      status: audioResult.ok ? "completed" : "validation_failed",
      dryRun: stageDryRun,
      completedAt: new Date().toISOString(),
      audioDir: audioResult.audioDir,
      summaryPath: audioResult.summaryPath ?? null,
      tts: audioResult.tts,
      mix: audioResult.mix,
      validation: audioResult.validation,
    };
    saveManifest(manifestPath, manifest);
  }

  // Stage 3: SCENE COMPILER (`script_master.json` + audio duration -> `scene_plan.json`)
  if (activeStages.includes("scene")) {
    const stageDryRun = typeof dryRunScene === "boolean" ? dryRunScene : dryRun;
    const sceneResult = await runSceneStage({
      jobDir: resolvedJobDir,
      slug: resolvedSlug,
      dryRun: stageDryRun,
    });
    manifest.stages.scene = {
      status: "completed",
      dryRun: stageDryRun,
      completedAt: new Date().toISOString(),
      scenePlanPath: sceneResult.scenePlanPath,
      summary: sceneResult.summary,
    };
    saveManifest(manifestPath, manifest);
  }

  // Stage 4: RENDER
  if (activeStages.includes("render")) {
    const stageDryRun = typeof dryRunRender === "boolean" ? dryRunRender : dryRun;
    const syncedAudioRel =
      manifest.stages.audio?.mix?.publicAudioRelPath ||
      (() => {
        const audioSumPath = path.join(resolvedJobDir, "audio", "audio_summary.json");
        if (!fs.existsSync(audioSumPath)) return null;
        try {
          return JSON.parse(fs.readFileSync(audioSumPath, "utf8"))?.mix?.publicAudioRelPath || null;
        } catch {
          return null;
        }
      })();

    const scenePlanPath = path.join(resolvedJobDir, "scene_plan.json");
    const autoScenePlan = fs.existsSync(scenePlanPath)
      ? JSON.parse(fs.readFileSync(scenePlanPath, "utf8"))
      : null;

    const useAuto25D = !existingVideoPath && !entry && !compositionId && Boolean(autoScenePlan);
    const resolvedEntry = useAuto25D ? AUTO25D_ENTRY : entry;
    const resolvedComp = useAuto25D
      ? renderQuality === "preview"
        ? AUTO25D_COMPS.preview
        : AUTO25D_COMPS.final
      : compositionId;

    const mergedRenderProps = {
      ...(useAuto25D ? { scenePlan: autoScenePlan, renderMode: renderQuality === "preview" ? "draft" : "look" } : {}),
      ...(syncedAudioRel ? { audioFile: syncedAudioRel } : {}),
      ...(renderProps && typeof renderProps === "object" ? renderProps : {}),
    };

    const renderResult = await runRenderStage({
      rootDir,
      jobDir: resolvedJobDir,
      entry: resolvedEntry,
      compositionId: resolvedComp,
      outMp4,
      existingVideoPath,
      inputProps: Object.keys(mergedRenderProps).length > 0 ? mergedRenderProps : undefined,
      ...(renderConcurrency ? { concurrency: renderConcurrency } : {}),
      ...(renderFrames ? { frames: renderFrames } : {}),
      runShortQa,
      dryRun: stageDryRun,
      ...(execFileImpl ? { execFileImpl } : {}),
    });
    manifest.stages.render = {
      status: "completed",
      dryRun: stageDryRun,
      completedAt: new Date().toISOString(),
      mode: renderResult.mode,
      entry: resolvedEntry ?? null,
      compositionId: resolvedComp ?? null,
      videoPath: renderResult.videoPath,
      propsPath: renderResult.propsPath ?? null,
      renderDurationMs: renderResult.renderDurationMs ?? null,
      commandPreview: renderResult.commandPreview ?? null,
      probe: renderResult.probe,
      qaDir: renderResult.qaDir ?? null,
    };
    saveManifest(manifestPath, manifest);
  }

  const resolvedVideoPath =
    manifest.stages.render?.videoPath ||
    (existingVideoPath
      ? path.isAbsolute(existingVideoPath)
        ? existingVideoPath
        : path.resolve(rootDir, existingVideoPath)
      : null);

  const postStageDryRun = typeof dryRunPost === "boolean" ? dryRunPost : dryRun;

  // Stage 4: QC (Unified Gate)
  if (activeStages.includes("qc")) {
    const qcResult = await runQcStage({
      rootDir,
      jobDir: resolvedJobDir,
      videoPath: resolvedVideoPath,
      requireCommercialAudio: !postStageDryRun && !allowDraftAudioForLivePost,
      strictAudioDuration: enforceAudioDuration,
      runShortQa,
      ...(execFileImpl ? { execFileImpl } : {}),
    });
    manifest.stages.qc = {
      status: qcResult.passed ? "passed" : "failed",
      passed: qcResult.passed,
      completedAt: new Date().toISOString(),
      reportPath: qcResult.reportPath,
      blockingErrors: qcResult.blockingErrors,
      warnings: qcResult.warnings,
      checks: qcResult.checks,
    };
    saveManifest(manifestPath, manifest);
  }

  // Stage 5: POST (YT, FB, IG)
  if (activeStages.includes("post")) {
    const stageDryRun = postStageDryRun;

    // Hard safety gate: NEVER allow live public upload if QC failed OR if draft/unlicensed/invalid audio exists
    // (cannot be bypassed by omitting "qc" from --stages or reusing a stale dry-run qc_report.json)
    const liveBlockReasons = [];
    if (!stageDryRun) {
      if (manifest.stages.qc && manifest.stages.qc.passed === false) {
        liveBlockReasons.push(...(manifest.stages.qc.blockingErrors || ["QC stage failed."]));
      }
      const audioSummaryPath = path.join(resolvedJobDir, "audio", "audio_summary.json");
      const audioMeta = fs.existsSync(audioSummaryPath)
        ? JSON.parse(fs.readFileSync(audioSummaryPath, "utf8"))
        : manifest.stages.audio || null;

      if (audioMeta && !audioMeta.dryRun) {
        if (audioMeta.validation && audioMeta.validation.passed === false) {
          liveBlockReasons.push(
            ...(audioMeta.validation.errors || ["[audio] Validasi audio gagal."])
          );
        }
        const ttsModeUsed = audioMeta.tts?.mode || "draft";
        const commercialAllowed = Boolean(audioMeta.tts?.commercialPolicy?.allowed);
        if (!allowDraftAudioForLivePost && (!commercialAllowed || ttsModeUsed !== "final")) {
          liveBlockReasons.push(
            `[audio] Live post diblokir: audio menggunakan TTS mode="${ttsModeUsed}" (${audioMeta.tts?.provider || "unknown"}) yang belum terverifikasi lisensi komersial final.`
          );
        }
      }
    }

    if (!stageDryRun && liveBlockReasons.length > 0) {
      manifest.stages.post = {
        status: "blocked_by_qc",
        dryRun: false,
        completedAt: new Date().toISOString(),
        platforms,
        blockingErrors: [...new Set(liveBlockReasons)],
        results: [],
      };
      saveManifest(manifestPath, manifest);
    } else {
      const socialPath = path.join(resolvedJobDir, "social_pack.json");
      const socialPack = fs.existsSync(socialPath)
        ? JSON.parse(fs.readFileSync(socialPath, "utf8"))
        : {};

      const resolvedThumb =
        thumbnailPath ||
        [
          path.join(resolvedJobDir, "thumbnails_ab", "thumb_A_malam_cofferdam.jpg"),
          path.join(resolvedJobDir, "thumbnails_ab", "thumb_A.jpg"),
          path.join(resolvedJobDir, "thumbnail_16x9.jpg"),
          path.join(resolvedJobDir, "thumbnail_9x16.jpg"),
        ].find((p) => fs.existsSync(p));

      const postResult = await publishToPlatforms({
        platforms,
        videoPath: resolvedVideoPath,
        thumbnailPath: resolvedThumb,
        videoPublicUrl,
        socialPack,
        env: mergedEnv,
        dryRun: stageDryRun,
        fetchImpl,
        useYouTubeSop,
        unlistedFirst,
        waitForProcessing,
        publishAt,
        seoFilename,
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
  }

  const audioOk = manifest.stages.audio ? manifest.stages.audio.status !== "validation_failed" : true;
  const qcOk = manifest.stages.qc ? manifest.stages.qc.passed !== false : true;
  const postOk = manifest.stages.post
    ? !["partial_failure", "blocked_by_qc"].includes(manifest.stages.post.status)
    : true;

  return {
    ok: audioOk && qcOk && postOk,
    jobId: resolvedJobId,
    jobDir: resolvedJobDir,
    manifestPath,
    manifest,
  };
}
