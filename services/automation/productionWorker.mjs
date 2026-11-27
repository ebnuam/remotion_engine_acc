/**
 * Autonomous Production Worker (Topic Scout + Headless Episode Builder).
 *
 * Safety guarantees:
 * - Single-worker PID lock (`out/automation/worker.lock`)
 * - Checks host processes (`isRenderProcessActive`) so it NEVER runs concurrent Remotion renders
 * - Checks ElevenLabs remaining characters before starting an episode build
 * - Enforces stock high/low watermarks (`shouldProduceMore`)
 */

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createAIRouter, loadEnvFile } from "../ai-gateway/index.mjs";
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
    "- Kuat divisualisasikan secara 3D cel-shaded (mekanisme benda, teknik sipil, alam, fisika, transportasi, hewan).",
    "- Durasi bahasan pas untuk 65-85 detik dengan cerita utuh 1 video.",
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
  } catch (stdErr) {
    res = await aiRouter.chatCompletion({
      task: "creative_director",
      model: env.AI_PREMIUM_MODEL || "gemini-4-hydrogen-high",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
  }

  const raw = String(res?.content || "");
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first < 0 || last <= first) {
    throw new Error("Topic scout returned non-JSON response.");
  }
  const parsed = JSON.parse(raw.slice(first, last + 1));
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

export function buildHeadlessAgyPrompt({ rootDir, slug, topic }) {
  const outDir = path.join("out", slug);
  const srcDir = path.join("src", slug);
  return [
    `Kerjakan secara otomatis sampai tuntas di repository ${rootDir} tanpa bertanya ke user:`,
    `Buat 1 episode baru Kok Iso Yo? dengan slug "${slug}" dan topik: "${topic}".`,
    "",
    "Standar WAJIB:",
    "1. JANGAN sentuh `src/bridge/`, `public/bridge/`, `src/ship/`, `src/ep2_badak/`, `src/ep003_jembatan_laut/`, maupun `out/ep003_jembatan_laut/`.",
    `2. Gunakan kualitas visual 3D cel-shaded & storytelling teknis setara \`src/ep003_jembatan_laut/\` (bukan kotak/kartun anak-anak), durasi target 65-85 detik (20-26 shot, maksimal 4 detik per shot, anti-subtitle permanen).`,
    `3. Buat script + \`${outDir}/social_pack.json\` (format YouTube 5-Step SOP: judul keyword-driven, 2-3 kalimat pertama deskripsi SEO, tags, plus copy Facebook & Instagram).`,
    `4. Generate voiceover ElevenLabs via \`services/tts-gateway\` (gunakan env \`~/.config/kokisoyo/agybridge_render.env\` yang sudah mendukung multi-key rotation) dan mix audio dengan \`.venv-audio/bin/python -B templates/audio-py/mix_audio.py\`.`,
    `5. Implementasikan komposisi terisolasi di \`${srcDir}/\`, jalankan \`npx tsc --noEmit\`, render grid contact sheet preview dan inspeksi visual dulu sebelum render full.`,
    `6. Buat 3 variasi thumbnail A/B di \`${outDir}/thumbnails_ab/\` (dengan \`thumb_A_*.jpg\` sebagai utama) + \`${outDir}/thumbnail_16x9.jpg\`.`,
    `7. Render video final 1080x1920 ke \`${outDir}/${slug}_1080p.mp4\` dengan \`--gl=swangle --concurrency=2 --timeout=180000\`, lalu jalankan \`python3 -B scripts/kokisoyo-qa/short_qa.py\` dan pastikan 0 black frame & 0 frozen spans.`,
    `8. JANGAN langsung upload ke YouTube di tahap ini — cukup siapkan seluruh file di \`${outDir}/\` agar scheduler stok yang mengupload sesuai jadwal.`,
  ].join("\n");
}

export async function produceNextEpisode({
  rootDir,
  statePath,
  env = process.env,
  envFile = undefined,
  dryRun = true,
  execFileImpl = execFileAsync,
  router = undefined,
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

    // Verify ElevenLabs quota before spending AI tokens on full episode creation
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

    // Default: "agy_custom" — invoke headless Antigravity CLI to build & render Jembatan-grade episode
    const agyBin = mergedEnv.AGY_CLI_BIN || "agy";
    const prompt = buildHeadlessAgyPrompt({
      rootDir,
      slug: topicItem.slug,
      topic: topicItem.topic,
    });
    const agyArgs = [
      "--dangerously-skip-permissions",
      "--mode",
      "auto",
      "--model",
      String(cfg.agyModel || "gemini-4-hydrogen-high"),
      "--output-format",
      "json",
      "--print",
      prompt,
    ];

    await execFileImpl(agyBin, agyArgs, {
      cwd: rootDir,
      env: mergedEnv,
      timeout: Number(cfg.agyTimeoutMs ?? 2_700_000),
      maxBuffer: 10 * 1024 * 1024,
    });

    const videoPath = findReadyVideoInDir(outDir);
    const thumb = findPrimaryThumbnail(outDir);
    const reg = registerStockItem(state, {
      slug: topicItem.slug,
      topic: topicItem.topic,
      jobDir: outDir,
      videoPath,
      thumbnailPath: thumb.primary,
    });

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
