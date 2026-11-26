#!/usr/bin/env node
/**
 * Kok Iso Yo? End-to-End Automation Pipeline CLI (`generate -> audio -> render -> qc -> post`)
 *
 * Examples:
 *   # Full dry-run preview (zero AI spend, zero TTS, zero render, zero live social upload)
 *   node services/pipeline/cli.mjs --slug ep006_petir --topic "Kenapa petir selalu zig-zag?" --dry-run
 *
 *   # Live 2-route AI generation + FREE draft Edge-TTS & DSP mix + QC + dry-run post
 *   node services/pipeline/cli.mjs \
 *     --env-file ~/.config/kokisoyo/agybridge_render.env \
 *     --slug ep006_petir \
 *     --topic "Kenapa petir selalu zig-zag?" \
 *     --stages generate,audio,qc,post \
 *     --live-generate --live-audio --tts-mode draft --dry-run-post
 *
 *   # Audio + QC on an existing generated job directory
 *   node services/pipeline/cli.mjs \
 *     --job-id ep_test_ban_pesawat_v3_final \
 *     --stages audio,qc,post \
 *     --live-audio --tts-mode draft --dry-run-post
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_STAGES, runPipeline } from "./orchestrator.mjs";
import { SUPPORTED_PLATFORMS } from "./publishers/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const args = {
    slug: "episode_auto",
    topic: "",
    stages: [...ALL_STAGES],
    platforms: [...SUPPORTED_PLATFORMS],
    entry: undefined,
    compositionId: undefined,
    outMp4: undefined,
    existingVideoPath: undefined,
    videoPublicUrl: undefined,
    envFile: undefined,
    jobId: undefined,
    ttsMode: undefined,
    ttsProvider: undefined,
    voice: undefined,
    rate: "+0%",
    pitch: "+0Hz",
    musicPreset: "curious_doc",
    ambience: "none",
    syncPublicAudio: false,
    enforceAudioDuration: false,
    renderQuality: "final",
    renderConcurrency: undefined,
    renderFrames: undefined,
    premiumModel: undefined,
    standardModel: undefined,
    dryRun: true,
    dryRunGenerate: undefined,
    dryRunAudio: undefined,
    dryRunScene: undefined,
    dryRunRender: undefined,
    dryRunPost: undefined,
    runShortQa: false,
    allowDraftAudioForLivePost: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--slug" && argv[i + 1]) args.slug = argv[++i];
    else if (a === "--topic" && argv[i + 1]) args.topic = argv[++i];
    else if (a === "--stages" && argv[i + 1]) args.stages = argv[++i].split(",").filter(Boolean);
    else if (a === "--platforms" && argv[i + 1])
      args.platforms = argv[++i].split(",").filter(Boolean);
    else if (a === "--entry" && argv[i + 1]) args.entry = argv[++i];
    else if (a === "--comp" && argv[i + 1]) args.compositionId = argv[++i];
    else if (a === "--out" && argv[i + 1]) args.outMp4 = argv[++i];
    else if (a === "--existing-video" && argv[i + 1]) args.existingVideoPath = argv[++i];
    else if (a === "--video-public-url" && argv[i + 1]) args.videoPublicUrl = argv[++i];
    else if (a === "--env-file" && argv[i + 1]) args.envFile = argv[++i];
    else if (a === "--job-id" && argv[i + 1]) args.jobId = argv[++i];
    else if (a === "--tts-mode" && argv[i + 1]) args.ttsMode = argv[++i];
    else if (a === "--tts-provider" && argv[i + 1]) args.ttsProvider = argv[++i];
    else if (a === "--voice" && argv[i + 1]) args.voice = argv[++i];
    else if (a === "--rate" && argv[i + 1]) args.rate = argv[++i];
    else if (a === "--pitch" && argv[i + 1]) args.pitch = argv[++i];
    else if (a === "--music-preset" && argv[i + 1]) args.musicPreset = argv[++i];
    else if (a === "--ambience" && argv[i + 1]) args.ambience = argv[++i];
    else if (a === "--sync-public-audio") args.syncPublicAudio = true;
    else if (a === "--enforce-audio-duration") args.enforceAudioDuration = true;
    else if (a === "--render-quality" && argv[i + 1]) args.renderQuality = argv[++i];
    else if (a === "--preview") args.renderQuality = "preview";
    else if (a === "--concurrency" && argv[i + 1]) args.renderConcurrency = Number(argv[++i]);
    else if (a === "--frames" && argv[i + 1]) args.renderFrames = argv[++i];
    else if (a === "--premium-model" && argv[i + 1]) args.premiumModel = argv[++i];
    else if (a === "--standard-model" && argv[i + 1]) args.standardModel = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--live") args.dryRun = false;
    else if (a === "--live-generate") args.dryRunGenerate = false;
    else if (a === "--live-audio") args.dryRunAudio = false;
    else if (a === "--live-scene") args.dryRunScene = false;
    else if (a === "--live-render") args.dryRunRender = false;
    else if (a === "--live-post") args.dryRunPost = false;
    else if (a === "--dry-run-post") args.dryRunPost = true;
    else if (a === "--short-qa") args.runShortQa = true;
    else if (a === "--allow-draft-audio-live") args.allowDraftAudioForLivePost = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await runPipeline({
    rootDir: ROOT,
    ...args,
  });

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        jobId: result.jobId,
        manifestPath: result.manifestPath,
        platformReadiness: result.manifest.platformReadiness,
        stages: result.manifest.stages,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("PIPELINE_FAILED:", err?.message || String(err));
  process.exit(1);
});
