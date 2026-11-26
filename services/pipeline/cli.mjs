#!/usr/bin/env node
/**
 * Kok Iso Yo? Automation Pipeline CLI (`generate -> render -> post`)
 *
 * Examples:
 *   # Full dry-run preview (zero AI spend, zero render, zero live social upload)
 *   node services/pipeline/cli.mjs --slug ep006_petir --topic "Kenapa petir selalu zig-zag?" --dry-run
 *
 *   # Live 2-route AI generation (PREMIUM script + STANDARD social pack) + dry-run post on existing MP4
 *   node services/pipeline/cli.mjs \
 *     --env-file ~/.config/kokisoyo/agybridge_render.env \
 *     --slug ep002_badak \
 *     --topic "Mengapa Badak Jawa terancam punah?" \
 *     --existing-video out/episode002_badak_jawa/Episode002_Final.mp4 \
 *     --stages generate,render,post \
 *     --live-generate --dry-run-post
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
    premiumModel: undefined,
    standardModel: undefined,
    dryRun: true,
    dryRunGenerate: undefined,
    dryRunRender: undefined,
    dryRunPost: undefined,
    runShortQa: false,
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
    else if (a === "--premium-model" && argv[i + 1]) args.premiumModel = argv[++i];
    else if (a === "--standard-model" && argv[i + 1]) args.standardModel = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--live") args.dryRun = false;
    else if (a === "--live-generate") args.dryRunGenerate = false;
    else if (a === "--live-render") args.dryRunRender = false;
    else if (a === "--live-post") args.dryRunPost = false;
    else if (a === "--dry-run-post") args.dryRunPost = true;
    else if (a === "--short-qa") args.runShortQa = true;
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
