/**
 * Pipeline Stage 2 — RENDER (Remotion + Three.js + FFmpeg Verification on VPS)
 *
 * Supports two modes:
 * 1. Fresh Remotion render (`entry` + `compositionId` -> `outMp4`) using swangle + H.264/AAC standards.
 * 2. Pre-rendered video validation (`existingVideoPath`) to skip rendering and directly probe/package for posting.
 */

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function probeVideoFile(videoPath, execFileImpl = execFileAsync) {
  const { stdout } = await execFileImpl(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels",
      "-of",
      "json",
      videoPath,
    ],
    { timeout: 15_000 }
  );

  const parsed = JSON.parse(stdout);
  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  const videoStream = streams.find((s) => s.codec_type === "video") || null;
  const audioStream = streams.find((s) => s.codec_type === "audio") || null;

  return {
    durationSec: Number(parsed.format?.duration || 0),
    sizeBytes: Number(parsed.format?.size || 0),
    bitRate: Number(parsed.format?.bit_rate || 0),
    width: videoStream?.width || null,
    height: videoStream?.height || null,
    videoCodec: videoStream?.codec_name || null,
    audioCodec: audioStream?.codec_name || null,
    hasAudio: Boolean(audioStream),
    isVertical916:
      Boolean(videoStream?.width && videoStream?.height) &&
      videoStream.height > videoStream.width,
  };
}

export async function runRenderStage({
  rootDir,
  jobDir,
  entry = undefined,
  compositionId = undefined,
  outMp4 = undefined,
  existingVideoPath = undefined,
  inputProps = undefined,
  gl = "swangle",
  concurrency = 3,
  crf = 18,
  audioBitrate = "192k",
  timeoutMs = 180_000,
  renderTimeoutMs = 2_400_000,
  frames = undefined,
  runShortQa = false,
  dryRun = false,
  execFileImpl = execFileAsync,
}) {
  fs.mkdirSync(jobDir, { recursive: true });

  // Mode A: Use an already rendered MP4
  if (existingVideoPath) {
    const absVideo = path.isAbsolute(existingVideoPath)
      ? existingVideoPath
      : path.resolve(rootDir, existingVideoPath);

    if (dryRun && !fs.existsSync(absVideo)) {
      return {
        ok: true,
        dryRun: true,
        mode: "existing_video",
        videoPath: absVideo,
        probe: null,
      };
    }

    if (!fs.existsSync(absVideo)) {
      throw new Error(`Existing video not found: ${absVideo}`);
    }

    const probe = await probeVideoFile(absVideo, execFileImpl);
    return {
      ok: true,
      dryRun,
      mode: "existing_video",
      videoPath: absVideo,
      probe,
    };
  }

  // Mode B: Fresh Remotion render on VPS
  if (!entry || !compositionId) {
    throw new Error(
      "Render stage requires either `existingVideoPath` or both `entry` and `compositionId`."
    );
  }

  const targetMp4 = outMp4
    ? path.isAbsolute(outMp4)
      ? outMp4
      : path.resolve(rootDir, outMp4)
    : path.join(jobDir, `${compositionId}.mp4`);

  let propsPath = null;
  if (inputProps && typeof inputProps === "object" && Object.keys(inputProps).length > 0) {
    propsPath = path.join(jobDir, "render_props.json");
    if (!dryRun) {
      fs.writeFileSync(propsPath, JSON.stringify(inputProps, null, 2), "utf8");
    }
  }

  const remotionArgs = [
    "remotion",
    "render",
    entry,
    compositionId,
    targetMp4,
    ...(propsPath ? [`--props=${propsPath}`] : []),
    ...(frames ? [`--frames=${frames}`] : []),
    `--gl=${gl}`,
    `--concurrency=${concurrency}`,
    `--timeout=${timeoutMs}`,
    "--codec=h264",
    "--pixel-format=yuv420p",
    `--crf=${crf}`,
    "--audio-codec=aac",
    `--audio-bitrate=${audioBitrate}`,
    "--enforce-audio-track",
    "--overwrite",
  ];

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      mode: "remotion_render",
      videoPath: targetMp4,
      propsPath,
      commandPreview: `npx ${remotionArgs.join(" ")}`,
      probe: null,
    };
  }

  fs.mkdirSync(path.dirname(targetMp4), { recursive: true });
  const startedAt = Date.now();

  await execFileImpl("npx", remotionArgs, {
    cwd: rootDir,
    timeout: Math.max(renderTimeoutMs, timeoutMs * 4),
    maxBuffer: 64 * 1024 * 1024,
  });

  const renderDurationMs = Date.now() - startedAt;
  const probe = await probeVideoFile(targetMp4, execFileImpl);

  let qaDir = null;
  if (runShortQa) {
    qaDir = path.join(jobDir, "qa_render");
    await execFileImpl("python3", ["scripts/kokisoyo-qa/short_qa.py", targetMp4, qaDir], {
      cwd: rootDir,
      timeout: 120_000,
    });
  }

  return {
    ok: true,
    dryRun: false,
    mode: "remotion_render",
    videoPath: targetMp4,
    renderDurationMs,
    probe,
    qaDir,
  };
}
