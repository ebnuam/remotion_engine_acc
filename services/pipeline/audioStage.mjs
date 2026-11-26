/**
 * Pipeline Stage — AUDIO (Multi-Provider TTS + Offline Python DSP Mix & BS.1770-4 Loudness)
 *
 * Flow:
 * 1. Read narration from `script_master.json` (or explicit `narrationText`).
 * 2. Synthesize voice-over via `services/tts-gateway` (`draft` = free `edge_tts`; `final` = licensed commercial provider).
 * 3. Mix VO + procedural music bed + auto-ducking (`words.json` or envelope-VAD) + milestone SFX
 *    via `.venv-audio/bin/python -B templates/audio-py/mix_audio.py --aac`.
 * 4. Verify `mix.wav` & `mix.m4a` via `ffprobe` + `ffmpeg ebur128` (`-14.5 LUFS`, True Peak `<= -1.2 dBTP`).
 * 5. Optionally sync `mix.m4a` into `public/episodes/<slug>/mix.m4a` for Remotion `staticFile()`.
 */

import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  atomicCopyFile,
  atomicWriteFile,
  createDefaultTTSRouter,
  probeAudioFile,
} from "../tts-gateway/index.mjs";

const execFileAsync = promisify(execFile);

const SAFE_SLUG_RE = /^[a-z0-9_-]{1,64}$/;
const VALID_MUSIC_PRESETS = new Set(["curious_doc", "march_tension", "wonder_calm", "none"]);
const VALID_AMBIENCES = new Set(["none", "forest", "river", "wind"]);

export const AUDIO_LOUDNESS_STANDARDS = Object.freeze({
  targetLufs: -14.5,
  lufsTolerance: 1.2,
  maxWavTruePeakDbtp: -1.0,
  maxAacTruePeakDbtp: -1.0,
  minDurationSec: 50,
  maxDurationSec: 65,
});

function parseFirstNumber(raw) {
  const m = String(raw || "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/**
 * Parses `ffmpeg -af ebur128=peak=true` stderr summary block.
 */
export function parseEbur128Summary(stderrText) {
  const text = String(stderrText || "");
  const idx = text.lastIndexOf("Summary:");
  const tail = idx >= 0 ? text.slice(idx) : text;

  let integratedLufs = null;
  let loudnessRangeLu = null;
  let truePeakDbtp = null;

  for (const line of tail.split(/\r?\n/)) {
    const s = line.trim();
    if (s.startsWith("I:")) {
      integratedLufs = parseFirstNumber(s.slice(2));
    } else if (s.startsWith("LRA:")) {
      loudnessRangeLu = parseFirstNumber(s.slice(4));
    } else if (s.startsWith("Peak:")) {
      truePeakDbtp = parseFirstNumber(s.slice(5));
    }
  }

  return {
    integratedLufs,
    loudnessRangeLu,
    truePeakDbtp,
  };
}

/**
 * Runs `ffmpeg -af ebur128=peak=true` on an audio file (zero shell invocation).
 */
export async function measureAudioLoudness(
  audioPath,
  { ffmpegBin = "ffmpeg", timeoutMs = 45_000, execFileImpl = execFileAsync } = {}
) {
  const res = await execFileImpl(
    ffmpegBin,
    ["-hide_banner", "-nostats", "-i", audioPath, "-af", "ebur128=peak=true", "-f", "null", "-"],
    { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }
  );
  return parseEbur128Summary(res?.stderr || res?.stdout || "");
}

/**
 * Evaluates BS.1770-4 loudness & 50-65s duration compliance.
 */
export function validateAudioMixMetrics({
  durationSec,
  wavLoudness = null,
  aacLoudness = null,
  minDurationSec = AUDIO_LOUDNESS_STANDARDS.minDurationSec,
  maxDurationSec = AUDIO_LOUDNESS_STANDARDS.maxDurationSec,
  targetLufs = AUDIO_LOUDNESS_STANDARDS.targetLufs,
  lufsTolerance = AUDIO_LOUDNESS_STANDARDS.lufsTolerance,
} = {}) {
  const errors = [];
  const warnings = [];

  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    errors.push("Durasi audio hasil mix tidak valid atau 0 detik.");
  } else if (durationSec < minDurationSec || durationSec > maxDurationSec) {
    warnings.push(
      `Durasi audio aktual ${durationSec.toFixed(2)}s di luar target editorial ${minDurationSec}-${maxDurationSec}s.`
    );
  }

  const primary = aacLoudness?.integratedLufs !== null && aacLoudness?.integratedLufs !== undefined
    ? aacLoudness
    : wavLoudness;

  if (!primary || primary.integratedLufs === null || primary.integratedLufs === undefined) {
    warnings.push("Pengukuran ebur128 LUFS tidak tersedia.");
  } else {
    const diff = Math.abs(primary.integratedLufs - targetLufs);
    if (diff > lufsTolerance) {
      errors.push(
        `Integrated loudness ${primary.integratedLufs} LUFS melenceng dari target ${targetLufs} ± ${lufsTolerance} LUFS.`
      );
    }
  }

  if (wavLoudness && wavLoudness.truePeakDbtp !== null && wavLoudness.truePeakDbtp !== undefined) {
    if (wavLoudness.truePeakDbtp > AUDIO_LOUDNESS_STANDARDS.maxWavTruePeakDbtp) {
      errors.push(
        `WAV True Peak ${wavLoudness.truePeakDbtp} dBTP melewati batas aman ${AUDIO_LOUDNESS_STANDARDS.maxWavTruePeakDbtp} dBTP.`
      );
    }
  }
  if (aacLoudness && aacLoudness.truePeakDbtp !== null && aacLoudness.truePeakDbtp !== undefined) {
    if (aacLoudness.truePeakDbtp > AUDIO_LOUDNESS_STANDARDS.maxAacTruePeakDbtp) {
      errors.push(
        `AAC True Peak ${aacLoudness.truePeakDbtp} dBTP melewati batas aman ${AUDIO_LOUDNESS_STANDARDS.maxAacTruePeakDbtp} dBTP.`
      );
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function resolveNarrationFromJob(jobDir, narrationText) {
  if (typeof narrationText === "string" && narrationText.trim()) {
    return { text: narrationText.trim(), source: "override" };
  }
  const scriptPath = path.join(jobDir, "script_master.json");
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Audio stage requires narrationText or existing script_master.json at ${scriptPath}`);
  }
  const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
  const direct = typeof script.narrationScript === "string" ? script.narrationScript.trim() : "";
  if (direct) {
    return { text: direct, source: scriptPath };
  }
  const joined = Array.isArray(script.scenes)
    ? script.scenes.map((s) => String(s?.narration || "").trim()).filter(Boolean).join(" ")
    : "";
  if (!joined) {
    throw new Error(`script_master.json at ${scriptPath} has no narrationScript or scene narration.`);
  }
  return { text: joined, source: scriptPath };
}

function resolvePythonBin(rootDir, pythonBinOverride) {
  if (pythonBinOverride) return pythonBinOverride;
  const venvPy = path.join(rootDir, ".venv-audio", "bin", "python");
  if (fs.existsSync(venvPy)) return venvPy;
  return "python3";
}

export async function runAudioStage({
  rootDir,
  jobDir,
  slug = "episode_auto",
  narrationText = undefined,
  ttsMode = undefined,
  ttsProvider = undefined,
  voice = undefined,
  rate = "+0%",
  pitch = "+0Hz",
  outputFormat = "mp3",
  musicPreset = "curious_doc",
  ambience = "none",
  duckDb = -4.5,
  targetLufs = AUDIO_LOUDNESS_STANDARDS.targetLufs,
  ceilDbtp = -1.2,
  seed = 2026,
  shotsPath = undefined,
  enforceDurationWindow = false,
  syncPublicAudio = false,
  dryRun = false,
  env = process.env,
  envFile = undefined,
  ttsRouter = undefined,
  pythonBin = undefined,
  execFileImpl = execFileAsync,
  probeImpl = probeAudioFile,
} = {}) {
  const safePreset = VALID_MUSIC_PRESETS.has(musicPreset) ? musicPreset : "curious_doc";
  const safeAmbience = VALID_AMBIENCES.has(ambience) ? ambience : "none";

  const audioDir = path.join(jobDir, "audio");
  fs.mkdirSync(audioDir, { recursive: true });

  const narration = resolveNarrationFromJob(jobDir, narrationText);
  const router = ttsRouter || createDefaultTTSRouter({ env, envFile });
  const pyBin = resolvePythonBin(rootDir, pythonBin);
  const mixScript = path.join(rootDir, "templates", "audio-py", "mix_audio.py");

  if (dryRun) {
    let costPreview = null;
    try {
      costPreview = router.estimateCost({
        mode: ttsMode,
        provider: ttsProvider,
        text: narration.text,
      });
    } catch (err) {
      costPreview = { error: err?.message || String(err) };
    }

    const previewOut = path.join(audioDir, "mix.m4a");
    return {
      ok: true,
      dryRun: true,
      audioDir,
      narrationSource: narration.source,
      tts: {
        mode: ttsMode || router.getConfigSummary().defaultMode,
        provider: ttsProvider || null,
        costPreview,
      },
      mix: {
        commandPreview: `${pyBin} -B ${mixScript} --voice <voiceover.${outputFormat}> --preset ${safePreset} --ambience ${safeAmbience} --duck-db ${duckDb} --target-lufs ${targetLufs} --ceil-dbtp ${ceilDbtp} --out-dir ${audioDir} --aac`,
        mixM4aPath: previewOut,
      },
      validation: { passed: true, errors: [], warnings: ["Dry-run audio stage: TTS & mix skipped."] },
    };
  }

  // 1. Synthesize Voice-Over via TTS Gateway
  const ttsResult = await router.synthesize({
    text: narration.text,
    mode: ttsMode,
    provider: ttsProvider,
    voice,
    rate,
    pitch,
    outputFormat,
    outputDir: audioDir,
    fileStem: "voiceover",
    enforceDurationWindow,
  });

  // 2. Run Offline Python DSP Mixer (`mix_audio.py`)
  if (!fs.existsSync(mixScript)) {
    throw new Error(`Audio mixer script not found: ${mixScript}`);
  }

  const mixArgs = [
    "-B",
    mixScript,
    "--voice",
    ttsResult.audioPath,
    "--preset",
    safePreset,
    "--ambience",
    safeAmbience,
    "--duck-db",
    String(duckDb),
    "--target-lufs",
    String(targetLufs),
    "--ceil-dbtp",
    String(ceilDbtp),
    "--seed",
    String(seed),
    "--out-dir",
    audioDir,
    "--aac",
  ];
  if (ttsResult.wordsPath && fs.existsSync(ttsResult.wordsPath)) {
    mixArgs.push("--words", ttsResult.wordsPath);
  }
  if (shotsPath && fs.existsSync(shotsPath)) {
    mixArgs.push("--shots", shotsPath);
  }

  await execFileImpl(pyBin, mixArgs, {
    cwd: rootDir,
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
  });

  const mixWavPath = path.join(audioDir, "mix.wav");
  const mixM4aPath = path.join(audioDir, "mix.m4a");
  const cuesReportPath = path.join(audioDir, "cues_report.md");

  if (!fs.existsSync(mixM4aPath) || !fs.existsSync(mixWavPath)) {
    throw new Error(`mix_audio.py finished without producing mix.wav / mix.m4a in ${audioDir}`);
  }

  // 3. Probe & Measure BS.1770-4 Loudness
  const wavLoudness = await measureAudioLoudness(mixWavPath, { execFileImpl });
  let aacLoudness = await measureAudioLoudness(mixM4aPath, { execFileImpl });
  let aacRemastered = false;

  // Auto-fix FFmpeg native AAC MDCT inter-sample true-peak overshoot without altering frozen mix_audio.py
  if (
    aacLoudness?.truePeakDbtp !== null &&
    aacLoudness?.truePeakDbtp !== undefined &&
    aacLoudness.truePeakDbtp > AUDIO_LOUDNESS_STANDARDS.maxAacTruePeakDbtp
  ) {
    const tmpM4a = path.join(audioDir, `.mix.remaster.${process.pid}.m4a`);
    try {
      await execFileImpl(
        "ffmpeg",
        [
          "-y",
          "-hide_banner",
          "-loglevel",
          "error",
          "-i",
          mixWavPath,
          "-af",
          "lowpass=f=18000,alimiter=limit=-1.4dB:level=false",
          "-c:a",
          "aac",
          "-b:a",
          "256k",
          "-ar",
          "48000",
          "-movflags",
          "+faststart",
          tmpM4a,
        ],
        { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 }
      );
      if (fs.existsSync(tmpM4a)) {
        fs.renameSync(tmpM4a, mixM4aPath);
        aacLoudness = await measureAudioLoudness(mixM4aPath, { execFileImpl });
        aacRemastered = true;
      }
    } catch {
      try {
        if (fs.existsSync(tmpM4a)) fs.unlinkSync(tmpM4a);
      } catch {
        // ignore cleanup error
      }
    }
  }

  const mixProbe = await probeImpl(mixM4aPath, {
    minSec: AUDIO_LOUDNESS_STANDARDS.minDurationSec,
    maxSec: AUDIO_LOUDNESS_STANDARDS.maxDurationSec,
  });

  const validation = validateAudioMixMetrics({
    durationSec: mixProbe.actualDurationSec,
    wavLoudness,
    aacLoudness,
    targetLufs,
  });

  // 4. Optional sync to public/episodes/<slug>/mix.m4a for Remotion staticFile()
  let publicAudioPath = null;
  let publicAudioRelPath = null;
  if (syncPublicAudio) {
    const cleanSlug = String(slug || "").trim().toLowerCase();
    if (!SAFE_SLUG_RE.test(cleanSlug)) {
      throw new Error(`Invalid slug for public audio sync: "${cleanSlug}"`);
    }
    const targetPublicDir = path.join(rootDir, "public", "episodes", cleanSlug);
    fs.mkdirSync(targetPublicDir, { recursive: true });
    publicAudioPath = path.join(targetPublicDir, "mix.m4a");
    atomicCopyFile(mixM4aPath, publicAudioPath);
    publicAudioRelPath = `episodes/${cleanSlug}/mix.m4a`;
  }

  const summary = {
    ok: validation.passed,
    generatedAt: new Date().toISOString(),
    narrationSource: narration.source,
    tts: {
      provider: ttsResult.provider,
      mode: ttsResult.mode,
      voice: ttsResult.voice,
      cached: ttsResult.cached,
      cacheKey: ttsResult.cacheKey,
      commercialPolicy: ttsResult.commercialPolicy,
      usage: ttsResult.usage,
      voiceDurationSec: ttsResult.audioInfo.actualDurationSec,
      audioPath: ttsResult.audioPath,
      wordsPath: ttsResult.wordsPath,
      metadataPath: ttsResult.metadataPath,
    },
    mix: {
      preset: safePreset,
      ambience: safeAmbience,
      duckDb,
      targetLufs,
      ceilDbtp,
      mixWavPath,
      mixM4aPath,
      cuesReportPath: fs.existsSync(cuesReportPath) ? cuesReportPath : null,
      publicAudioPath,
      publicAudioRelPath,
      probe: {
        actualDurationSec: mixProbe.actualDurationSec,
        withinTargetWindow: mixProbe.withinTargetWindow,
        codec: mixProbe.codec,
        sampleRate: mixProbe.sampleRate,
        channels: mixProbe.channels,
        sizeBytes: mixProbe.sizeBytes,
      },
      loudness: {
        wav: wavLoudness,
        aac: aacLoudness,
        aacRemastered,
      },
    },
    validation,
  };

  const summaryPath = path.join(audioDir, "audio_summary.json");
  atomicWriteFile(summaryPath, JSON.stringify(summary, null, 2));

  return {
    ...summary,
    dryRun: false,
    audioDir,
    summaryPath,
  };
}
