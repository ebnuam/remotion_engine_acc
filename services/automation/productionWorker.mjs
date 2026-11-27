/**
 * Autonomous Production Worker (Token-Saving Split Architecture).
 *
 * How it saves ~60-75% PREMIUM AI tokens & eliminates render timeouts:
 * 1. Pre-Stage A (STANDARD route — AGYBridge `gemini-2.5-flash`):
 *    Generates `script.txt`, `shots.json` (20-24 shots, <= 4s/shot), and `social_pack.json`
 *    for YouTube 5-Step SOP + Facebook + Instagram (~1.5k-3k cheap tokens).
 * 2. Pre-Stage B (Local Node.js + ElevenLabs Multi-Key + `mix_audio.py` — 0 AI tokens):
 *    Synthesizes voiceover + word timestamps + mastered `audio_mix.m4a`, syncs exact
 *    `totalFrames` into `shots.json` BEFORE `agy` ever starts!
 * 3. Stage C (PREMIUM `agy` Headless — focused ONLY on realistic 3D PBR visuals):
 *    Builds realistic `StageDoc3D` + `cinematicRealism.ts` + `autoFraming.ts` scenes
 *    (zero stick-figures, zero cartoon boxes, anti-cropping 9:16 safe-zone), verifies
 *    `npx tsc --noEmit` + proof contact sheets + 3 A/B thumbnails, writes `render_meta.json`,
 *    then exits cleanly (~10-18 min, zero render wait inside `agy`).
 * 4. Stage D (Local Node.js Direct Render + `short_qa.py` — 0 AI tokens):
 *    Runs `npx remotion render ... --gl=swangle --concurrency=2` and fail-closed QA directly
 *    from Node.js, then registers the finished video in `stockQueue`.
 */

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createAIRouter, loadEnvFile } from "../ai-gateway/index.mjs";
import { createDefaultTTSRouter } from "../tts-gateway/index.mjs";
import { createElevenLabsAdapter } from "../tts-gateway/providers/elevenLabsAdapter.mjs";
import { runPipeline } from "../pipeline/orchestrator.mjs";
import {
  DEFAULT_AUTOMATION_CONFIG,
  enqueueTopic,
  findPrimaryThumbnail,
  findReadyVideoInDir,
  loadQueueState,
  pickNextQueuedTopic,
  registerStockItem,
  sanitizeSlug,
  saveQueueState,
  shouldProduceMore,
} from "./stockQueue.mjs";
import {
  allocateStrictShots,
  recordEpisodePattern,
  selectEpisodePattern,
} from "./patternDiversity.mjs";

const execFileAsync = promisify(execFile);

export async function isRenderProcessActive(execFileImpl = execFileAsync) {
  try {
    const { stdout } = await execFileImpl("ps", ["-eo", "pid,args"], { timeout: 5_000 });
    const lines = String(stdout || "").split("\n");
    return lines.some(
      (line) =>
        /remotion\s+render\b|chrome-headless-shell/i.test(line) &&
        !/grep/i.test(line)
    );
  } catch {
    return false;
  }
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function acquireWorkerLock(lockPath) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  if (fs.existsSync(lockPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(lockPath, "utf8"));
      if (isPidAlive(existing?.pid)) {
        return { acquired: false, holderPid: existing.pid };
      }
    } catch {
      // Stale corrupt lock file; replace below
    }
  }
  const payload = { pid: process.pid, startedAt: new Date().toISOString() };
  fs.writeFileSync(lockPath, JSON.stringify(payload), "utf8");
  return {
    acquired: true,
    release: () => {
      try {
        if (fs.existsSync(lockPath)) {
          const current = JSON.parse(fs.readFileSync(lockPath, "utf8"));
          if (current?.pid === process.pid) fs.unlinkSync(lockPath);
        }
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

function extractJsonObject(raw) {
  const txt = String(raw || "").trim();
  const fenced = txt.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : txt;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  const slice = candidate.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return JSON.parse(slice.replace(/,\s*([}\]])/g, "$1"));
  }
}

export async function scoutTopics({
  rootDir,
  state,
  env = process.env,
  envFile = undefined,
  count = 5,
  router = undefined,
} = {}) {
  const existingTitles = [
    ...(state.topics || []).map((t) => t.topic),
    ...(state.stock || []).map((s) => s.topic || s.title),
    ...(state.publishedHistory || []).map((h) => h.topic || h.title),
  ]
    .filter(Boolean)
    .slice(-40);

  const aiRouter =
    router ||
    createAIRouter({
      env,
      envFile,
    });

  const prompt = [
    `Buat ${count} ide topik YouTube Shorts edukasi sains/teknik/alam/fenomena sehari-hari untuk channel "Kok Iso Yo?".`,
    "Syarat wajib:",
    "- Bahasa Indonesia santai dan memancing rasa penasaran (bukan judul akademis).",
    "- Kuat divisualisasikan secara 3D PBR realistis (cutaway mesin, teknik sipil, alam, fisika, transportasi, biologi makro).",
    "- Durasi bahasan pas untuk 65-80 detik dengan cerita utuh 1 video.",
    existingTitles.length > 0
      ? `- JANGAN ulangi atau mirip dengan topik berikut: ${existingTitles.join(" | ")}`
      : "",
    'Kembalikan HANYA JSON valid berbentuk {"topics":[{"slug":"ep_...","topic":"..."}]}.',
  ]
    .filter(Boolean)
    .join("\n");

  let res;
  try {
    res = await aiRouter.chatCompletion({
      task: "post_copy",
      model: env.AI_STANDARD_MODEL || env.AGYBRIDGE_DEFAULT_MODEL || "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
  } catch {
    res = await aiRouter.chatCompletion({
      task: "creative_director",
      model: env.AI_PREMIUM_MODEL || "gemini-4-hydrogen-high",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
  }

  const parsed = extractJsonObject(res?.content);
  if (!parsed) {
    throw new Error("Topic scout returned non-JSON response.");
  }
  const added = [];
  for (const item of parsed.topics || []) {
    const r = enqueueTopic(state, {
      slug: sanitizeSlug(item.slug || item.topic),
      topic: item.topic,
      rootDir,
    });
    if (r.added) added.push(r.item);
  }
  return added;
}

/**
 * Pre-Stage A: Generate script, 20-24 shot plan, and YT/FB/IG social_pack via cheap STANDARD model.
 * Keeps PREMIUM `agy` token spend low by handling editorial/SEO text outside the coding agent!
 */
export async function generateEpisodeBlueprint({
  topic,
  slug,
  outDir,
  pattern = null,
  env = process.env,
  envFile = undefined,
  router = undefined,
}) {
  fs.mkdirSync(outDir, { recursive: true });
  const aiRouter = router || createAIRouter({ env, envFile });

  const patternRules = pattern
    ? [
        `- GAYA CERITA WAJIB (BEDA POLA): "${pattern.archetype.label}" — ${pattern.archetype.hookRule}`,
        `- ALUR NARASI: ${pattern.archetype.pacingRule}`,
        `- MOOD VISUAL DOMINAN: "${pattern.dominantMood}" & kamera pembuka "${pattern.openingCamera}".`,
        pattern.recentTitles?.length
          ? `- ANTI-REPETISI: JANGAN tiru struktur judul atau kalimat pembuka dari episode sebelumnya ini: ${pattern.recentTitles.join(" | ")}`
          : "",
      ].filter(Boolean)
    : [];

  const prompt = [
    `Buat paket pra-produksi lengkap untuk video edukasi 3D realistis channel "Kok Iso Yo?" dengan topik: "${topic}" (slug: "${slug}").`,
    "Aturan WAJIB (SANGAT KETAT):",
    "- Narasi Bahasa Indonesia natural, hidup, dan mengalir untuk durasi 65-82 detik: WAJIB 165-195 kata (1.020-1.350 karakter, TIDAK BOLEH di bawah 1.000 karakter agar durasi suara pasti DI ATAS 60 detik!). Tanpa salam pembuka klise, hook 0-2 detik langsung memancing penasaran, 1 cerita tuntas.",
    "- Bagi menjadi 20-24 shot berurutan (`durationSec` masing-masing 2.5 - 4.0 detik, TIDAK ADA shot > 4 detik, total 66-84 detik).",
    "- Setiap shot wajib punya `id`, `name`, `durationSec`, `visualBrief` (deskripsi objek 3D PBR realistis, cutaway/kamera, pencahayaan `day_outdoor|golden_hour|night_industrial|studio_macro|underwater_deep`, TANPA stick-figure, TANPA kartun anak-anak), `cameraType` (`wide|medium|closeup`), dan `onScreenLabel` opsional (maks 4 kata, nol emoji).",
    ...patternRules,
    "- Sertakan `socialPack` untuk YouTube Shorts (judul unik non-template maks 90 karakter + `#Shorts`, deskripsi 3 paragraf dengan 2 kalimat pertama kaya keyword SEO, 10-12 tags, categoryId '28'), Facebook Reels (`title`, `description`), dan Instagram Reels (`caption`, `firstComment`).",
    'Kembalikan HANYA JSON valid berbentuk:',
    '{"narration":"...","shots":[{"id":"S01","name":"...","durationSec":3,"mood":"day_outdoor","cameraType":"wide","visualBrief":"...","onScreenLabel":null}],"socialPack":{"youtube":{"title":"...","description":"...","tags":["..."],"categoryId":"28","privacyStatus":"public"},"facebook":{"title":"...","description":"..."},"instagram":{"caption":"...","firstComment":"..."}}}',
  ].join("\n");

  const callModel = async (task, model) => {
    const res = await aiRouter.chatCompletion({
      task,
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
    });
    return extractJsonObject(res?.content);
  };

  const isQualityBlueprint = (p) =>
    Boolean(
      p &&
        typeof p.narration === "string" &&
        p.narration.trim().length >= 980 &&
        Array.isArray(p.shots) &&
        p.shots.length >= 19
    );

  // Use PREMIUM model first for rich storytelling & strict >60s length
  let parsed = null;
  try {
    parsed = await callModel(
      "script_master",
      env.AI_PREMIUM_MODEL || "gemini-4-neon-high"
    );
  } catch {
    parsed = null;
  }

  if (!isQualityBlueprint(parsed)) {
    const stdParsed = await callModel(
      "post_copy",
      env.AI_STANDARD_MODEL || env.AGYBRIDGE_DEFAULT_MODEL || "gemini-2.5-flash"
    );
    if (isQualityBlueprint(stdParsed) || !parsed) {
      parsed = stdParsed;
    }
  }

  if (!parsed || !parsed.narration || !Array.isArray(parsed.shots) || parsed.shots.length < 15) {
    throw new Error(`Invalid blueprint JSON generated for ${slug}`);
  }

  const scriptPath = path.join(outDir, "script.txt");
  const socialPath = path.join(outDir, "social_pack.json");
  const blueprintPath = path.join(outDir, "blueprint.json");

  fs.writeFileSync(scriptPath, `${String(parsed.narration).trim()}\n`, "utf8");
  fs.writeFileSync(socialPath, JSON.stringify(parsed.socialPack || {}, null, 2), "utf8");
  fs.writeFileSync(blueprintPath, JSON.stringify(parsed, null, 2), "utf8");

  return { parsed, scriptPath, socialPath, blueprintPath };
}

/**
 * Pre-Stage B: Synthesize ElevenLabs voiceover (multi-key) + mix_audio.py in Node.js (0 AI tokens!).
 * Strictly enforces >60s total duration and <=4.0s per shot (`allocateStrictShots`).
 */
export async function generateEpisodeAudio({
  rootDir,
  slug,
  outDir,
  blueprint,
  pattern = null,
  env = process.env,
  envFile = undefined,
  execFileImpl = execFileAsync,
  ttsRouter = undefined,
}) {
  const ttsMetaPath = path.join(outDir, "voiceover.tts_meta.json");
  const existingShotsPath = path.join(outDir, "shots.json");
  const pubEpDir = path.join(rootDir, "public", "episodes", slug);
  const publicAudioAbs = path.join(pubEpDir, "audio_mix.m4a");

  // Reuse already-generated valid >60s audio (saves 100% ElevenLabs chars on retries/re-renders!)
  if (fs.existsSync(ttsMetaPath) && fs.existsSync(publicAudioAbs)) {
    try {
      const prevMeta = JSON.parse(fs.readFileSync(ttsMetaPath, "utf8"));
      const prevDur = Number(prevMeta?.audioInfo?.actualDurationSec || 0);
      if (prevDur >= 60.0) {
        const fps = 30;
        const totalFrames = Math.ceil(prevDur * fps) + 15;
        const syncedShots = allocateStrictShots(blueprint.shots, totalFrames, fps, 4.0);
        fs.writeFileSync(existingShotsPath, JSON.stringify(syncedShots, null, 2), "utf8");
        return {
          actualDurationSec: prevDur,
          totalFrames,
          fps,
          shotsPath: existingShotsPath,
          publicAudioRelPath: `episodes/${slug}/audio_mix.m4a`,
          ttsUsage: { reusedExisting: true, billedCharCount: 0 },
        };
      }
    } catch {
      // Fall through to fresh TTS synthesis
    }
  }

  const router = ttsRouter || createDefaultTTSRouter({ env, envFile });
  const text = String(blueprint.narration || "").trim();
  const ttsRes = await router.synthesize({
    mode: "draft",
    provider: "elevenlabs",
    text,
    outputDir: outDir,
    fileStem: "voiceover",
    outputFormat: "mp3",
  });

  const actualDurationSec = Number(ttsRes.audioInfo?.actualDurationSec || 0);
  if (actualDurationSec < 60.0) {
    throw new Error(
      `Narration too short for ${slug}: actualDurationSec=${actualDurationSec.toFixed(2)}s (< 60.0s required).`
    );
  }
  const fps = 30;
  const totalFrames = Math.ceil(actualDurationSec * fps) + 15; // 0.5s clean tail

  const syncedShots = allocateStrictShots(blueprint.shots, totalFrames, fps, 4.0);

  const shotsPath = path.join(outDir, "shots.json");
  fs.writeFileSync(shotsPath, JSON.stringify(syncedShots, null, 2), "utf8");

  const mixOutDir = path.join(outDir, "audio_mix");
  fs.mkdirSync(mixOutDir, { recursive: true });
  const pyBin = fs.existsSync(path.join(rootDir, ".venv-audio", "bin", "python"))
    ? path.join(rootDir, ".venv-audio", "bin", "python")
    : "python3";

  const musicPreset = pattern?.musicPreset || "curious_doc";
  const ambience = pattern?.ambience || "none";
  const musicSeed = String(pattern?.musicSeed || 42);

  await execFileImpl(
    pyBin,
    [
      "-B",
      path.join(rootDir, "templates", "audio-py", "mix_audio.py"),
      "--voice",
      ttsRes.audioPath,
      "--words",
      ttsRes.wordsPath,
      "--shots",
      shotsPath,
      "--preset",
      musicPreset,
      "--ambience",
      ambience,
      "--seed",
      musicSeed,
      "--duck-db",
      "-4.5",
      "--target-lufs",
      "-14.5",
      "--ceil-dbtp",
      "-1.2",
      "--out-dir",
      mixOutDir,
      "--aac",
    ],
    { cwd: rootDir, timeout: 120_000 }
  );

  fs.mkdirSync(pubEpDir, { recursive: true });
  const mixM4a = path.join(mixOutDir, "mix.m4a");
  fs.copyFileSync(mixM4a, publicAudioAbs);

  return {
    actualDurationSec,
    totalFrames,
    fps,
    shotsPath,
    publicAudioRelPath: `episodes/${slug}/audio_mix.m4a`,
    ttsUsage: ttsRes.usage,
  };
}

export function toPascalCompId(slug) {
  const core = sanitizeSlug(slug)
    .split("_")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
  return `${core || "Episode"}Short`;
}

export function buildHeadlessAgyPrompt({
  rootDir,
  slug,
  topic,
  totalFrames,
  publicAudioRelPath,
  compositionId,
}) {
  const outDir = path.join("out", slug);
  const srcDir = path.join("src", slug);
  return [
    `Kerjakan CEPAT, HEMAT TOKEN, dan KUALITAS 3D REALISTIS di ${rootDir} tanpa bertanya ke user:`,
    `Episode: "${slug}" | Topik: "${topic}" | Komposisi: "${compositionId}" | Total Frames: ${totalFrames} @ 30fps.`,
    "",
    "FILE YANG SUDAH SIAP (JANGAN buat ulang, langsung pakai!):",
    `- Naskah & shots: \`${outDir}/script.txt\`, \`${outDir}/shots.json\`, \`${outDir}/blueprint.json\``,
    `- Social SEO pack: \`${outDir}/social_pack.json\``,
    `- Audio final: \`public/${publicAudioRelPath}\` (props \`audioFile: "${publicAudioRelPath}"\`)`,
    "",
    "ATURAN KUALITAS 3D REALISTIS (WAJIB — BUKAN KARTUN ANAK-ANAK!):",
    "1. JANGAN sentuh `src/bridge/`, `public/bridge/`, `src/ship/`, `src/ep2_badak/`, `src/ep003_jembatan_laut/`, atau `out/ep003_jembatan_laut/`.",
    "2. WAJIB pakai **`StageDoc3D`** (`src/shared/doc3d/StageDoc3D.tsx`) + **`cinematicRealism.ts`** (`src/shared/doc3d/cinematicRealism.ts`: `createPbrMaterial`, `applyCinematicRig`, `frameHeroSafe9x16`, `createSculptedTerrain`) untuk shading PBR realistis (ACESFilmic, bayangan lembut, tekstur prosedural, rim light, fog atmosfer).",
    "3. DILARANG stick-figure 2D, DILARANG garis outline kartun tebal, DILARANG properti kotak polos seperti mainan, dan DILARANG gunung/bukit kerucut tajam (`ConeGeometry`) — gunakan `createSculptedTerrain()` dan geometri 3D detail (lathe/extrude/bevel/layered mechanical/organic assemblies) yang tampak seperti dokumenter teknik/sains modern.",
    "4. ANTI FRAME KEPOTONG: gunakan `frameHeroSafe9x16(camera, target, bounds, { marginPercent: 0.20, fovDeg: 38, ... })` pada setiap shot sehingga seluruh subjek utama berada di zona aman 9:16 dan tidak terpotong tepi layar maupun ketutup UI YouTube Shorts.",
    "5. ANTI SUBTITLE PERMANEN & NOL EMOJI. Label teks (`renderOverlay`) hanya opsional 2-4 kata informatif di area aman atas.",
    "",
    "LANGKAH HEMAT TOKEN (MAKSIMAL 12-18 TOOL CALLS):",
    `1. Baca HANYA \`${outDir}/shots.json\`, \`src/shared/doc3d/StageDoc3D.tsx\`, dan \`src/shared/doc3d/cinematicRealism.ts\`.`,
    `2. Tulis komposisi terisolasi yang bersih di \`${srcDir}/\` (\`index.ts\`, \`Root.tsx\`, \`${compositionId}.tsx\`, \`world.ts\`) dengan \`durationInFrames={${totalFrames}}\`, 1080x1920 @ 30fps, dan audio \`<Audio src={staticFile("${publicAudioRelPath}")} />\`.`,
    "3. Jalankan `npx tsc --noEmit` (wajib 0 error).",
    `4. Render 1 set proof stills (8-12 frame merata) ke \`${outDir}/proof_stills/\` pakai \`node scripts/kokisoyo-qa/bridge-stills.mjs --entry ${srcDir}/index.ts --comp ${compositionId} ... --gl swangle\` lalu gabung ke \`${outDir}/grid_check_1.jpg\`, baca gambar itu sekali untuk pastikan 0 objek kepotong/hitam/melayang (perbaiki segera jika ada defect).`,
    `5. Buat thumbnail tajam & kontras di \`${outDir}/thumbnail_16x9.jpg\` + 3 varian A/B di \`${outDir}/thumbnails_ab/\` (\`thumb_A_utama.jpg\`, \`thumb_B_kontras.jpg\`, \`thumb_C_detail.jpg\`).`,
    `6. Tulis \`${outDir}/render_meta.json\` berisi \`{"entry":"${srcDir}/index.ts","compositionId":"${compositionId}","totalFrames":${totalFrames},"audioFile":"${publicAudioRelPath}"}\`.`,
    "7. STOP DI SINI — JANGAN jalankan `npx remotion render` full 1080p dan JANGAN upload YouTube (Node.js worker akan merender 1080p & QA secara otomatis setelah kamu selesai agar hemat token!).",
  ].join("\n");
}

export async function renderAndQaEpisode({
  rootDir,
  slug,
  outDir,
  renderMeta,
  execFileImpl = execFileAsync,
}) {
  const outMp4 = path.join(outDir, `${slug}_1080p.mp4`);
  const qaDir = path.join(outDir, "qa");
  const shotsPath = path.join(outDir, "shots.json");
  const propsJson = JSON.stringify({
    audioFile: renderMeta.audioFile || `episodes/${slug}/audio_mix.m4a`,
  });

  await execFileImpl(
    "npx",
    [
      "remotion",
      "render",
      renderMeta.entry,
      renderMeta.compositionId,
      outMp4,
      "--gl=swangle",
      "--concurrency=2",
      "--timeout=180000",
      "--overwrite",
      `--props=${propsJson}`,
    ],
    {
      cwd: rootDir,
      timeout: 4.5 * 3600 * 1000, // up to 4.5 hours for 1080p CPU swangle render
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  // Run automated QA gate (fail-closed on black frames or frozen spans)
  const qaArgs = ["-B", path.join(rootDir, "scripts", "kokisoyo-qa", "short_qa.py"), outMp4, qaDir];
  if (fs.existsSync(shotsPath)) qaArgs.push(shotsPath);

  await execFileImpl("python3", qaArgs, {
    cwd: rootDir,
    timeout: 300_000,
    maxBuffer: 5 * 1024 * 1024,
  });

  const reportPath = path.join(qaDir, "report.md");
  if (fs.existsSync(reportPath)) {
    const report = fs.readFileSync(reportPath, "utf8");
    if (!report.includes("black(mean<0.04)=[];")) {
      throw new Error(`QA gate failed for ${slug}: black frames detected in ${reportPath}`);
    }
    if (!report.includes("frozen_spans(diff<0.02,>=12f)=[]")) {
      throw new Error(`QA gate failed for ${slug}: frozen spans detected in ${reportPath}`);
    }
  }

  return { outMp4, qaDir, reportPath };
}

export async function produceNextEpisode({
  rootDir,
  statePath,
  env = process.env,
  envFile = undefined,
  dryRun = true,
  execFileImpl = execFileAsync,
  router = undefined,
  ttsRouter = undefined,
} = {}) {
  const mergedEnv = {
    ...(envFile ? loadEnvFile(envFile) : {}),
    ...env,
  };

  const lockPath = path.join(path.dirname(statePath), "worker.lock");
  const lock = acquireWorkerLock(lockPath);
  if (!lock.acquired) {
    return { ok: true, skipped: true, reason: `worker_locked (pid=${lock.holderPid})` };
  }

  try {
    const state = loadQueueState(statePath);
    const cfg = state.config || DEFAULT_AUTOMATION_CONFIG;

    const stockDecision = shouldProduceMore(state);
    saveQueueState(statePath, state);
    if (!stockDecision.produce) {
      return { ok: true, skipped: true, reason: stockDecision.reason };
    }

    if (!dryRun && (await isRenderProcessActive(execFileImpl))) {
      return { ok: true, skipped: true, reason: "active_render_in_progress" };
    }

    if (!dryRun) {
      const elAdapter = createElevenLabsAdapter({ env: mergedEnv, envFile });
      const quota = await elAdapter.checkQuotas();
      const minChars = Number(cfg.minElevenLabsChars ?? 1400);
      if (quota.totalRemainingChars < minChars) {
        return {
          ok: false,
          skipped: true,
          reason: `elevenlabs_quota_low (${quota.totalRemainingChars} < ${minChars})`,
          quota,
        };
      }
    }

    let topicItem = pickNextQueuedTopic(state);
    if (!topicItem) {
      if (dryRun) {
        return {
          ok: true,
          dryRun: true,
          skipped: false,
          wouldScoutTopics: true,
          produceMode: cfg.produceMode,
        };
      }
      const scouted = await scoutTopics({
        rootDir,
        state,
        env: mergedEnv,
        envFile,
        count: 5,
        router,
      });
      saveQueueState(statePath, state);
      topicItem = pickNextQueuedTopic(state) || scouted[0] || null;
      if (!topicItem) {
        return { ok: false, skipped: true, reason: "no_topics_available_after_scout" };
      }
    }

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        skipped: false,
        nextTopic: topicItem,
        produceMode: cfg.produceMode,
      };
    }

    topicItem.status = "producing";
    saveQueueState(statePath, state);

    const outDir = path.join(rootDir, "out", topicItem.slug);
    fs.mkdirSync(outDir, { recursive: true });

    if (cfg.produceMode === "pipeline") {
      const pipeRes = await runPipeline({
        rootDir,
        slug: topicItem.slug,
        topic: topicItem.topic,
        stages: ["generate", "audio", "scene", "render", "qc"],
        dryRun: false,
        ttsProvider: "elevenlabs",
        ttsMode: "draft",
        syncPublicAudio: true,
        runShortQa: true,
        env: mergedEnv,
        envFile,
      });
      if (!pipeRes.ok) {
        throw new Error(`Pipeline production failed for ${topicItem.slug}`);
      }
      const reg = registerStockItem(state, {
        slug: topicItem.slug,
        topic: topicItem.topic,
        jobDir: pipeRes.jobDir,
      });
      topicItem.status = "done";
      saveQueueState(statePath, state);
      return { ok: true, skipped: false, topicItem, registered: reg };
    }

    // Token-saving Split Mode ("agy_custom") with Anti-Repetition Pattern Diversity:
    const pattern = selectEpisodePattern(state, topicItem.topic);

    // Pre-Stage A: rich >60s script + <=4s/shot plan + varied YT/FB/IG social_pack
    const blueprintRes = await generateEpisodeBlueprint({
      topic: topicItem.topic,
      slug: topicItem.slug,
      outDir,
      pattern,
      env: mergedEnv,
      envFile,
      router,
    });

    // Pre-Stage B (0 AI tokens): ElevenLabs multi-key TTS + >=60s & <=4s/shot check + varied music bed
    const audioRes = await generateEpisodeAudio({
      rootDir,
      slug: topicItem.slug,
      outDir,
      blueprint: blueprintRes.parsed,
      pattern,
      env: mergedEnv,
      envFile,
      execFileImpl,
      ttsRouter,
    });

    // Stage C (PREMIUM `agy` headless — ONLY realistic 3D scene build + stills QA + thumbnails)
    const compositionId = toPascalCompId(topicItem.slug);
    const agyBin = mergedEnv.AGY_CLI_BIN || "agy";
    const prompt = buildHeadlessAgyPrompt({
      rootDir,
      slug: topicItem.slug,
      topic: topicItem.topic,
      totalFrames: audioRes.totalFrames,
      publicAudioRelPath: audioRes.publicAudioRelPath,
      compositionId,
    });

    const agyArgs = [
      "--dangerously-skip-permissions",
      "--model",
      String(cfg.agyModel || "gemini-4-neon-high"),
      "--output-format",
      "json",
      "--print",
      prompt,
    ];

    await execFileImpl(agyBin, agyArgs, {
      cwd: rootDir,
      env: mergedEnv,
      timeout: Math.min(Number(cfg.agyTimeoutMs ?? 3_600_000), 3_600_000), // 60m cap for scene coding only
      maxBuffer: 10 * 1024 * 1024,
    });

    // Stage D (0 AI tokens): Direct Node.js 1080p render + automated QA gate
    const renderMetaPath = path.join(outDir, "render_meta.json");
    const renderMeta = fs.existsSync(renderMetaPath)
      ? JSON.parse(fs.readFileSync(renderMetaPath, "utf8"))
      : {
          entry: `src/${topicItem.slug}/index.ts`,
          compositionId,
          totalFrames: audioRes.totalFrames,
          audioFile: audioRes.publicAudioRelPath,
        };

    const existingVideo = findReadyVideoInDir(outDir);
    const finalVideoPath = existingVideo
      ? existingVideo
      : (
          await renderAndQaEpisode({
            rootDir,
            slug: topicItem.slug,
            outDir,
            renderMeta,
            execFileImpl,
          })
        ).outMp4;

    const thumb = findPrimaryThumbnail(outDir);
    const reg = registerStockItem(state, {
      slug: topicItem.slug,
      topic: topicItem.topic,
      jobDir: outDir,
      videoPath: finalVideoPath,
      thumbnailPath: thumb.primary,
    });

    recordEpisodePattern(state, { slug: topicItem.slug, pattern });
    topicItem.status = "done";
    topicItem.error = null;
    saveQueueState(statePath, state);

    return { ok: true, skipped: false, topicItem, registered: reg };
  } catch (err) {
    const state = loadQueueState(statePath);
    const producing = (state.topics || []).find((t) => t.status === "producing");
    if (producing) {
      producing.status = "failed";
      producing.error = err?.message || String(err);
      saveQueueState(statePath, state);
    }
    throw err;
  } finally {
    lock.release();
  }
}
