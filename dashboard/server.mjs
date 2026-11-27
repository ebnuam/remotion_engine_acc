#!/usr/bin/env node
/**
 * Kok Iso Yo? Studio Control — Local Web Server & Render Orchestrator (Port 3010)
 * Zero external npm dependencies (pure Node.js built-ins + ffmpeg/ffprobe/tmux CLI).
 * Exposed safely via Cloudflare Quick Tunnel (`cloudflared tunnel --url http://127.0.0.1:3010`).
 */

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { createAIGateway, createAIRouter, loadEnvFile } from "../services/ai-gateway/index.mjs";
import { createElevenLabsAdapter } from "../services/tts-gateway/providers/elevenLabsAdapter.mjs";
import { getPlatformReadiness } from "../services/pipeline/publishers/index.mjs";
import { computeNextPrimeTimeISO } from "../services/pipeline/publishers/youtube.mjs";
import {
  canPublishToday,
  enqueueTopic,
  loadQueueState,
  publishNextFromStock,
  resolveConfiguredPlatforms,
  saveQueueState,
  shouldProduceMore,
} from "../services/automation/stockQueue.mjs";
import { isRenderProcessActive, scoutTopics } from "../services/automation/productionWorker.mjs";

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC_HTML = path.join(ROOT, "dashboard", "public", "index.html");
const OUT_DIR = path.join(ROOT, "out");
const DOCS_DIR = path.join(ROOT, "docs", "episodes");
const PROJECTS_DIR = path.join(ROOT, "public", "projects");
const LOGS_DIR = path.join(ROOT, "logs");
const DATA_DIR = path.join(ROOT, "dashboard", "data");
const QUOTA_FILE = path.join(DATA_DIR, "ai_quota.json");
const AUTOMATION_STATE_FILE = path.join(OUT_DIR, "automation", "queue_state.json");
const AUTOMATION_ENV_FILE = path.join(os.homedir(), ".config", "kokisoyo", "agybridge_render.env");

const PORT = Number(process.env.STUDIO_PORT || 3010);
const HOST = process.env.STUDIO_HOST || "127.0.0.1";
const STUDIO_PIN = (process.env.STUDIO_PIN || "kokisoyo2026").trim();

fs.mkdirSync(PROJECTS_DIR, { recursive: true });
fs.mkdirSync(LOGS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const COMPOSITIONS = {
  Ep002BadakJawa: {
    entry: "src/episodes/episode002_badak_jawa/index.ts",
    outMp4: "out/episode002_badak_jawa/Episode002_Final.mp4",
    qaDir: "out/episode002_badak_jawa/qa_final",
    frames: 2840,
    label: "Episode 002 (Bagian 1/4 — Mengapa Badak Jawa Terancam Punah?)",
  },
  Ep003BadakJawa: {
    entry: "src/episodes/episode003_005_serial/index.ts",
    outMp4: "out/episode003_badak_jawa/Episode003_Final.mp4",
    qaDir: "out/episode003_badak_jawa/qa_final",
    frames: 2820,
    label: "Episode 003 (Bagian 2/4 — Habitat Kedua, Translokasi & Kasus Musofa)",
  },
  Ep004BadakJawa: {
    entry: "src/episodes/episode003_005_serial/index.ts",
    outMp4: "out/episode004_badak_jawa/Episode004_Final.mp4",
    qaDir: "out/episode004_badak_jawa/qa_final",
    frames: 2367,
    label: "Episode 004 (Bagian 3/4 — Krisis Genetik & Batas JRSCA)",
  },
  Ep005BadakJawa: {
    entry: "src/episodes/episode003_005_serial/index.ts",
    outMp4: "out/episode005_badak_jawa/Episode005_Final.mp4",
    qaDir: "out/episode005_badak_jawa/qa_final",
    frames: 2251,
    label: "Episode 005 (Bagian 4/4 — Penutup: Perlindungan Ujung Kulon)",
  },
  Ep002ProofOfLook: {
    entry: "src/episodes/episode002_badak_jawa/index.ts",
    outMp4: "out/episode002_badak_jawa/Ep002_POL.mp4",
    qaDir: "out/episode002_badak_jawa/qa_pol",
    frames: 150,
    label: "Episode 002 Proof-of-Look (5 Shot Sampel)",
  },
};

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-studio-pin, x-file-name, Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function safeResolve(baseDir, relPath) {
  if (!relPath || typeof relPath !== "string") return null;
  const clean = relPath.replace(/^\/+/, "");
  const abs = path.resolve(baseDir, clean);
  if (abs === baseDir || abs.startsWith(baseDir + path.sep)) {
    return abs;
  }
  return null;
}

function sanitizeSlug(raw) {
  const s = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return s || null;
}

function isAuthorized(req, urlObj) {
  if (!STUDIO_PIN) return true;
  const headerPin = req.headers["x-studio-pin"];
  const queryPin = urlObj.searchParams.get("pin");
  return headerPin === STUDIO_PIN || queryPin === STUDIO_PIN;
}

async function readBodyBuffer(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new Error(`Payload too large (max ${Math.round(maxBytes / 1048576)} MB)`);
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function runSafe(cmd, args, timeoutMs = 8000) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, { timeout: timeoutMs, cwd: ROOT });
    return { ok: true, stdout, stderr };
  } catch (err) {
    return { ok: false, stdout: err.stdout || "", stderr: err.stderr || err.message };
  }
}

async function probeMedia(filePath) {
  const res = await runSafe("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels",
    "-of",
    "json",
    filePath,
  ]);
  if (!res.ok) return null;
  try {
    return JSON.parse(res.stdout);
  } catch {
    return null;
  }
}

async function detectAudioSilences(filePath) {
  const res = await runSafe(
    "ffmpeg",
    ["-i", filePath, "-af", "silencedetect=noise=-38dB:d=0.35", "-f", "null", "-"],
    15000
  );
  const text = `${res.stdout}\n${res.stderr}`;
  const pauses = [];
  let start = null;
  for (const line of text.split("\n")) {
    const ms = line.match(/silence_start:\s*([0-9.]+)/);
    if (ms) start = Number(ms[1]);
    const me = line.match(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/);
    if (me) {
      pauses.push({
        start: start ?? Number(me[1]) - Number(me[2]),
        end: Number(me[1]),
        duration: Number(me[2]),
      });
      start = null;
    }
  }
  return pauses.slice(0, 40);
}

function streamFileWithRange(req, res, filePath, downloadName = null) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const headers = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-cache",
  };
  if (downloadName) {
    headers["Content-Disposition"] = `attachment; filename="${path.basename(downloadName)}"`;
  }
  const range = req.headers.range;

  if (req.method === "HEAD") {
    if (range) {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      if (m) {
        const start = m[1] ? Number(m[1]) : 0;
        const end = m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1;
        headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
        headers["Content-Length"] = String(Math.max(0, end - start + 1));
      }
    } else {
      headers["Content-Length"] = String(stat.size);
    }
    res.writeHead(range ? 206 : 200, headers);
    res.end();
    return;
  }

  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1;
      if (start >= stat.size || start > end) {
        res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
        res.end();
        return;
      }
      headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
      headers["Content-Length"] = String(end - start + 1);
      res.writeHead(206, headers);
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
  }

  headers["Content-Length"] = String(stat.size);
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

function walkFiles(dir, exts, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, exts, base));
    } else if (exts.some((e) => entry.name.toLowerCase().endsWith(e))) {
      out.push({
        rel: path.relative(base, full).replace(/\\/g, "/"),
        full,
        stat: fs.statSync(full),
      });
    }
  }
  return out;
}

async function handleStatus() {
  const tmuxRes = await runSafe("tmux", ["ls"]);
  const sessions = tmuxRes.ok
    ? tmuxRes.stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(":")[0])
    : [];

  const panes = {};
  for (const s of sessions) {
    if (s === "ep2") continue;
    const cap = await runSafe("tmux", ["capture-pane", "-t", s, "-p"]);
    if (cap.ok) {
      const lines = cap.stdout.trimEnd().split("\n");
      panes[s] = lines.slice(-22).join("\n");
    }
  }

  let prodLogTail = "";
  const prodLogPath = path.join(LOGS_DIR, "episode002_production.log");
  if (fs.existsSync(prodLogPath)) {
    const txt = fs.readFileSync(prodLogPath, "utf8");
    const lines = txt.split("\n");
    prodLogTail = lines.slice(-40).join("\n");
  }

  const memRes = await runSafe("free", ["-m"]);
  const uptimeRes = await runSafe("uptime", []);
  const psRes = await runSafe("bash", [
    "-lc",
    "ps -ef | grep -E 'remotion render|chrome-headless-shell|ffmpeg' | grep -v grep | wc -l",
  ]);

  let tunnelUrl = "";
  const tunLog = path.join(LOGS_DIR, "dashboard_tunnel.log");
  if (fs.existsSync(tunLog)) {
    const m = fs.readFileSync(tunLog, "utf8").match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
    if (m && m.length) tunnelUrl = m[m.length - 1];
  }

  return {
    now: new Date().toISOString(),
    tmuxSessions: sessions,
    panes,
    prodLogTail,
    activeRenderProcs: Number((psRes.stdout || "0").trim()) || 0,
    uptime: (uptimeRes.stdout || "").trim(),
    memoryMb: (memRes.stdout || "").trim(),
    tunnelUrl,
  };
}

async function handleEpisodes() {
  const mp4Files = walkFiles(OUT_DIR, [".mp4"])
    .filter((f) => !path.basename(f.rel).startsWith("test_"))
    .sort((a, b) => a.rel.localeCompare(b.rel));
  const episodes = [];
  for (const f of mp4Files) {
    const dir = path.dirname(f.full);
    const qaReportPath = path.join(dir, "qa_final", "report.md");
    let qaSummary = null;
    if (fs.existsSync(qaReportPath)) {
      qaSummary = fs.readFileSync(qaReportPath, "utf8").split("\n").slice(0, 9).join("\n");
    }
    const probe = await probeMedia(f.full);
    const vStream = probe?.streams?.find((s) => s.codec_type === "video");
    const aStream = probe?.streams?.find((s) => s.codec_type === "audio");
    episodes.push({
      id: path.basename(f.rel, ".mp4"),
      relPath: f.rel,
      sizeBytes: f.stat.size,
      mtime: f.stat.mtime.toISOString(),
      durationSec: probe?.format?.duration ? Number(probe.format.duration) : null,
      resolution: vStream ? `${vStream.width}x${vStream.height}` : null,
      fps: vStream?.r_frame_rate || null,
      frames: vStream?.nb_frames ? Number(vStream.nb_frames) : null,
      audio: aStream ? `${aStream.codec_name} ${aStream.sample_rate}Hz ${aStream.channels}ch` : "NONE",
      qaSummary,
    });
  }

  const sheets = walkFiles(DOCS_DIR, [".jpg", ".jpeg", ".png"]).map((img) => ({
    name: img.rel,
    sizeBytes: img.stat.size,
    mtime: img.stat.mtime.toISOString(),
  }));

  const docs = walkFiles(DOCS_DIR, [".md"]).map((doc) => ({
    name: doc.rel,
    sizeBytes: doc.stat.size,
  }));

  const sourceAudioPath = path.join(ROOT, "public", "episodes", "episode002_badak_jawa", "voiceover.mp3");
  const sourceAudio = fs.existsSync(sourceAudioPath)
    ? {
        relPath: "episode002_badak_jawa/voiceover.mp3",
        sizeBytes: fs.statSync(sourceAudioPath).size,
        probe: await probeMedia(sourceAudioPath),
      }
    : null;

  return { episodes, sheets, docs, sourceAudio, compositions: COMPOSITIONS };
}

async function handleListProjects() {
  const list = [];
  if (!fs.existsSync(PROJECTS_DIR)) return { projects: [] };
  for (const entry of fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pDir = path.join(PROJECTS_DIR, entry.name);
    const briefPath = path.join(pDir, "brief.json");
    let brief = { slug: entry.name, title: entry.name };
    if (fs.existsSync(briefPath)) {
      try {
        brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
      } catch {}
    }
    const files = fs.readdirSync(pDir).filter((n) => /\.(mp3|wav|m4a)$/i.test(n));
    let audioMeta = null;
    if (files.length > 0) {
      const aPath = path.join(pDir, files[0]);
      audioMeta = {
        file: `${entry.name}/${files[0]}`,
        sizeBytes: fs.statSync(aPath).size,
        probe: await probeMedia(aPath),
      };
    }
    list.push({ ...brief, slug: entry.name, audio: audioMeta });
  }
  return { projects: list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")) };
}

function getJakartaDateParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return { day: fmt, month: fmt.slice(0, 7) };
}

let cachedModels = { fetchedAt: 0, list: [] };

async function getAvailableAiModels(force = false) {
  const now = Date.now();
  if (!force && cachedModels.list.length > 0 && now - cachedModels.fetchedAt < 10 * 60 * 1000) {
    return cachedModels.list;
  }

  // Opt-in AGYBridge provider (preserves existing `agy models` default when AI_GATEWAY_PROVIDER !== "agybridge")
  if (String(process.env.AI_GATEWAY_PROVIDER || "").trim().toLowerCase() === "agybridge") {
    try {
      const gateway = createAIGateway();
      const { models } = await gateway.listModels({ forceRefresh: force });
      if (models.length > 0) {
        const mapped = models.map((m) => ({ id: m.id, label: m.id }));
        cachedModels = { fetchedAt: now, list: mapped };
        return mapped;
      }
    } catch (err) {
      console.warn(`[KokIsoYo Dashboard] AGYBridge /v1/models fallback to existing provider: ${err.message}`);
    }
  }

  const res = await runSafe("agy", ["models"], 8000);
  if (res.ok && res.stdout) {
    const parsed = res.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("Fetching "))
      .map((line) => {
        const [id, ...rest] = line.split(/\s+/);
        return { id, label: rest.join(" ") || id };
      })
      .filter((m) => m.id);
    if (parsed.length > 0) {
      cachedModels = { fetchedAt: now, list: parsed };
      return parsed;
    }
  }
  return cachedModels.list.length > 0
    ? cachedModels.list
    : [
        { id: "gemini-4-hydrogen-high", label: "Gemini 4 Hydrogen (High)" },
        { id: "gemini-3.8-flash-high", label: "Gemini 3.8 Flash (High)" },
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Thinking)" },
        { id: "claude-opus-4-6-thinking", label: "Claude Opus 4.6 (Thinking)" },
      ];
}

function defaultQuotaState() {
  const { day, month } = getJakartaDateParts();
  return {
    paused: false,
    defaultModel: "gemini-4-hydrogen-high",
    warningThresholdPct: 80,
    autoBlockRenderOnLimit: true,
    limits: {
      aiTasksPerDay: 25,
      aiTokensPerMonth: 2000000,
      ttsCharsPerMonth: 120000,
      renderJobsPerDay: 12,
      maxConcurrentRenders: 1,
      maxRamPct: 85,
      monthlyBudgetUsd: 25,
    },
    usage: {
      currentDay: day,
      currentMonth: month,
      aiTasksToday: 0,
      aiTokensMonth: 0,
      ttsCharsMonth: 0,
      renderJobsToday: 0,
      estimatedSpendUsdMonth: 0,
    },
    providers: [
      {
        id: "antigravity",
        name: "Antigravity CLI (Gemini / Claude)",
        plan: "Workspace / Pro",
        remainingPct: 100,
        resetInfo: "Rolling / 5 jam & mingguan",
        note: "Sinkronkan sisa kuota manual dari UI Antigravity jika perlu.",
      },
      {
        id: "tts",
        name: "Voice-Over / TTS Engine",
        plan: "Edge-TTS / ElevenLabs",
        remainingPct: 100,
        resetInfo: "Bulanan",
        note: "Terpantau otomatis saat upload / catat naskah audio.",
      },
      {
        id: "vps_render",
        name: "VPS Remotion Compute (4 vCPU)",
        plan: "24/7 Local Chrome + swangle",
        remainingPct: 100,
        resetInfo: "Reset harian 00:00 WIB",
        note: "Concurrency dijaga <= 1 agar tidak OOM / hang.",
      },
    ],
    history: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadQuotaState() {
  let state = defaultQuotaState();
  if (fs.existsSync(QUOTA_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(QUOTA_FILE, "utf8"));
      state = {
        ...state,
        ...saved,
        limits: { ...state.limits, ...(saved.limits || {}) },
        usage: { ...state.usage, ...(saved.usage || {}) },
        providers: Array.isArray(saved.providers) && saved.providers.length ? saved.providers : state.providers,
        history: Array.isArray(saved.history) ? saved.history : [],
      };
    } catch {}
  }
  const { day, month } = getJakartaDateParts();
  let changed = !fs.existsSync(QUOTA_FILE);
  if (state.usage.currentDay !== day) {
    state.usage.currentDay = day;
    state.usage.aiTasksToday = 0;
    state.usage.renderJobsToday = 0;
    changed = true;
  }
  if (state.usage.currentMonth !== month) {
    state.usage.currentMonth = month;
    state.usage.aiTokensMonth = 0;
    state.usage.ttsCharsMonth = 0;
    state.usage.estimatedSpendUsdMonth = 0;
    changed = true;
  }
  if (changed) saveQuotaState(state);
  return state;
}

function saveQuotaState(state) {
  state.updatedAt = new Date().toISOString();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(QUOTA_FILE, JSON.stringify(state, null, 2), "utf8");
  return state;
}

function appendQuotaHistory(state, entry) {
  state.history = [
    { at: new Date().toISOString(), ...entry },
    ...(state.history || []),
  ].slice(0, 40);
}

async function getLiveSystemStats() {
  const [memRes, diskRes, psRes] = await Promise.all([
    runSafe("free", ["-m"]),
    runSafe("df", ["-BG", ROOT]),
    runSafe("bash", [
      "-lc",
      "ps -ef | grep -E 'node .*\\.bin/remotion render|node .*bridge-stills\\.mjs' | grep -v grep | wc -l",
    ]),
  ]);

  let ramTotalMb = 0;
  let ramUsedMb = 0;
  let ramPct = 0;
  const memLine = (memRes.stdout || "").split("\n").find((l) => l.startsWith("Mem:"));
  if (memLine) {
    const parts = memLine.trim().split(/\s+/);
    ramTotalMb = Number(parts[1]) || 0;
    ramUsedMb = Number(parts[2]) || 0;
    ramPct = ramTotalMb > 0 ? Math.round((ramUsedMb / ramTotalMb) * 1000) / 10 : 0;
  }

  let diskSummary = "-";
  let diskPct = 0;
  const diskLines = (diskRes.stdout || "").trim().split("\n");
  if (diskLines.length >= 2) {
    const dp = diskLines[1].trim().split(/\s+/);
    diskSummary = `${dp[2] || "?"} / ${dp[1] || "?"} (${dp[4] || "?"})`;
    diskPct = Number(String(dp[4] || "0").replace("%", "")) || 0;
  }

  const activeRenders = Number((psRes.stdout || "0").trim()) || 0;
  return { ramTotalMb, ramUsedMb, ramPct, diskSummary, diskPct, activeRenders };
}

function evaluateQuotaStatus(quota, liveSystem) {
  const pct = (used, limit) => (limit > 0 ? Math.round((used / limit) * 1000) / 10 : 0);
  const meters = {
    aiTasks: {
      label: "Task AI Harian",
      used: quota.usage.aiTasksToday,
      limit: quota.limits.aiTasksPerDay,
      pct: pct(quota.usage.aiTasksToday, quota.limits.aiTasksPerDay),
      unit: "task",
    },
    aiTokens: {
      label: "Token AI Bulanan",
      used: quota.usage.aiTokensMonth,
      limit: quota.limits.aiTokensPerMonth,
      pct: pct(quota.usage.aiTokensMonth, quota.limits.aiTokensPerMonth),
      unit: "token",
    },
    ttsChars: {
      label: "Karakter TTS Bulanan",
      used: quota.usage.ttsCharsMonth,
      limit: quota.limits.ttsCharsPerMonth,
      pct: pct(quota.usage.ttsCharsMonth, quota.limits.ttsCharsPerMonth),
      unit: "karakter",
    },
    renderJobs: {
      label: "Render Job Harian",
      used: quota.usage.renderJobsToday,
      limit: quota.limits.renderJobsPerDay,
      pct: pct(quota.usage.renderJobsToday, quota.limits.renderJobsPerDay),
      unit: "job",
    },
    budgetUsd: {
      label: "Estimasi Budget Bulanan",
      used: Number(quota.usage.estimatedSpendUsdMonth.toFixed(2)),
      limit: quota.limits.monthlyBudgetUsd,
      pct: pct(quota.usage.estimatedSpendUsdMonth, quota.limits.monthlyBudgetUsd),
      unit: "USD",
    },
    ram: {
      label: "RAM VPS Terpakai",
      used: liveSystem.ramPct,
      limit: quota.limits.maxRamPct,
      pct: liveSystem.ramPct,
      unit: "%",
    },
  };

  const blockedReasons = [];
  const warnings = [];
  let renderBusy = false;

  if (quota.paused) {
    blockedReasons.push("Studio sedang dalam mode PAUSE darurat.");
  }
  if (liveSystem.activeRenders >= quota.limits.maxConcurrentRenders) {
    renderBusy = true;
    warnings.push(
      `Render job sedang aktif (${liveSystem.activeRenders}/${quota.limits.maxConcurrentRenders}). Job render baru antre hingga selesai.`
    );
  }
  if (liveSystem.ramPct >= quota.limits.maxRamPct) {
    blockedReasons.push(`RAM VPS tinggi (${liveSystem.ramPct}% >= batas ${quota.limits.maxRamPct}%).`);
  }

  for (const key of ["aiTasks", "aiTokens", "ttsChars", "renderJobs", "budgetUsd"]) {
    const m = meters[key];
    if (m.limit > 0 && m.used >= m.limit) {
      blockedReasons.push(`${m.label} mencapai batas (${m.used}/${m.limit} ${m.unit}).`);
    } else if (m.limit > 0 && m.pct >= quota.warningThresholdPct) {
      warnings.push(`${m.label} mendekati batas (${m.pct}%).`);
    }
  }

  let status = "AMAN";
  if (quota.paused) status = "DIPAUZE";
  else if (blockedReasons.length > 0) status = "LIMIT_TERCAPAI";
  else if (warnings.length > 0) status = "MENDEKATI_LIMIT";

  return { status, renderBusy, meters, warnings, blockedReasons };
}

async function handleGetQuota(forceModels = false) {
  const quota = loadQuotaState();
  const [liveSystem, models] = await Promise.all([
    getLiveSystemStats(),
    getAvailableAiModels(forceModels),
  ]);
  const evaluation = evaluateQuotaStatus(quota, liveSystem);
  return { quota, liveSystem, models, ...evaluation };
}

async function launchStudioJob(payload) {
  const { mode, compId, frames, notes, targetEpisode } = payload || {};
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

  if (mode === "revision_note") {
    const revPath = path.join(DOCS_DIR, "badak_jawa_series", "revision_requests.md");
    fs.mkdirSync(path.dirname(revPath), { recursive: true });
    const entry = `\n## [${new Date().toISOString()}] ${targetEpisode || compId || "General"}\n- Frames/Timestamp: ${frames || "-"}\n- Catatan Revisi: ${String(notes || "").trim()}\n`;
    fs.appendFileSync(revPath, entry, "utf8");
    return { ok: true, mode, savedTo: "docs/episodes/badak_jawa_series/revision_requests.md" };
  }

  const comp = COMPOSITIONS[compId];
  if (!comp) {
    throw new Error(`Unknown composition ID: ${compId}`);
  }

  // Safety guard: enforce AI & VPS quota/concurrency guardrails before launching heavy Chromium render
  const quotaCheck = await handleGetQuota(false);
  if (quotaCheck.quota.paused) {
    throw new Error("Eksekusi diblokir: Mode Pause Darurat AI & Render sedang aktif.");
  }
  if (quotaCheck.liveSystem.activeRenders >= quotaCheck.quota.limits.maxConcurrentRenders) {
    throw new Error(
      `Render lain sedang berjalan (${quotaCheck.liveSystem.activeRenders}/${quotaCheck.quota.limits.maxConcurrentRenders}). Tunggu selesai agar 4 vCPU tidak bentrok.`
    );
  }
  if (quotaCheck.liveSystem.ramPct >= quotaCheck.quota.limits.maxRamPct) {
    throw new Error(
      `RAM VPS (${quotaCheck.liveSystem.ramPct}%) melewati batas guardrail (${quotaCheck.quota.limits.maxRamPct}%).`
    );
  }
  if (
    quotaCheck.quota.autoBlockRenderOnLimit &&
    (quotaCheck.meters.renderJobs.used >= quotaCheck.meters.renderJobs.limit ||
      quotaCheck.meters.aiTasks.used >= quotaCheck.meters.aiTasks.limit ||
      quotaCheck.meters.aiTokens.used >= quotaCheck.meters.aiTokens.limit)
  ) {
    throw new Error(
      `Auto-block aktif karena kuota tercapai: ${quotaCheck.blockedReasons.join(" | ")}`
    );
  }

  const sessionName = `studio_job_${ts}`;
  const logFile = path.join(LOGS_DIR, `${sessionName}.log`);
  const scriptFile = path.join(LOGS_DIR, `${sessionName}.sh`);

  let cmdBlock = "";
  if (mode === "stills") {
    const safeFrames = String(frames || "30,120,300").replace(/[^0-9,]/g, "");
    if (!safeFrames) throw new Error("Daftar frame tidak valid (contoh: 30,120,300).");
    const outDir = path.join(OUT_DIR, "studio_stills", `${compId}_${ts}`);
    cmdBlock = `
mkdir -p "${outDir}"
node scripts/kokisoyo-qa/bridge-stills.mjs --entry "${comp.entry}" --comp "${compId}" --frames "${safeFrames}" --scale 0.5 --format jpeg --quality 88 --gl swangle --out-dir "${outDir}" --prefix still_
python3 scripts/kokisoyo-qa/sbs_sheet.py -o "docs/episodes/badak_jawa_series/studio_${compId}_${ts}_sheet.jpg" --ours "${outDir}" --h 540 --gap 10 --bg "#121915" --label
`;
  } else if (mode === "render" || mode === "patch") {
    const rangeArg =
      mode === "patch"
        ? (() => {
            const m = String(frames || "").match(/^(\d+)-(\d+)$/);
            if (!m) throw new Error("Format patch harus start-end (contoh: 176-593).");
            return `--frames=${m[1]}-${m[2]}`;
          })()
        : "";
    const outPath =
      mode === "patch"
        ? `out/studio_patches/${compId}_${String(frames).replace(/[^0-9-]/g, "")}_${ts}.mp4`
        : comp.outMp4;
    cmdBlock = `
mkdir -p "$(dirname "${outPath}")"
npx tsc --noEmit
npx remotion render "${comp.entry}" "${compId}" "${outPath}" ${rangeArg} --gl=swangle --concurrency=2 --timeout=180000 --codec=h264 --pixel-format=yuv420p --crf=18 --audio-codec=aac --audio-bitrate=192k --enforce-audio-track --overwrite
${mode === "render" ? `python3 scripts/kokisoyo-qa/short_qa.py "${outPath}" "${comp.qaDir}"` : ""}
ffprobe -v error -show_entries format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames -of json "${outPath}"
`;
  } else {
    throw new Error(`Unsupported job mode: ${mode}`);
  }

  const scriptBody = `#!/usr/bin/env bash
set -u
cd "${ROOT}"
{
  echo "[STUDIO JOB START] ${sessionName} (${mode} ${compId}) at $(date -Iseconds)"
  ${cmdBlock}
  echo "[STUDIO JOB DONE] ${sessionName} at $(date -Iseconds)"
} 2>&1 | tee "${logFile}"
exec bash
`;
  fs.writeFileSync(scriptFile, scriptBody, { mode: 0o755 });
  await execFileAsync("tmux", ["new-session", "-d", "-s", sessionName, `bash "${scriptFile}"`]);

  const qState = loadQuotaState();
  qState.usage.renderJobsToday += 1;
  appendQuotaHistory(qState, {
    type: `job:${mode}`,
    delta: "+1 render job",
    model: qState.defaultModel,
    note: `${compId}${frames ? ` (${frames})` : ""}`,
  });
  saveQuotaState(qState);

  return { ok: true, sessionName, logFile: `logs/${sessionName}.log` };
}

function getAutomationEnv() {
  return {
    ...loadEnvFile(AUTOMATION_ENV_FILE),
    ...process.env,
  };
}

function detectLocalAgyAuthInfo() {
  const logDir = path.join(os.homedir(), ".gemini", "antigravity-cli", "log");
  let latestEmail = "unknown";
  let latestTime = null;
  try {
    if (fs.existsSync(logDir)) {
      const files = fs
        .readdirSync(logDir)
        .filter((f) => f.startsWith("cli-") && f.endsWith(".log"))
        .sort()
        .slice(-5)
        .reverse();
      for (const f of files) {
        const content = fs.readFileSync(path.join(logDir, f), "utf8");
        const matches = [...content.matchAll(/authenticated successfully as ([^\s]+)/g)];
        if (matches.length > 0) {
          latestEmail = matches[matches.length - 1][1];
          latestTime = f;
          break;
        }
      }
    }
  } catch {
    // Ignore log read errors
  }
  return { email: latestEmail, logFile: latestTime };
}

async function listPm2Summary() {
  const res = await runSafe("pm2", ["jlist"], 5000);
  if (!res.ok || !res.stdout) return [];
  try {
    const arr = JSON.parse(res.stdout);
    return arr.map((p) => ({
      name: p.name,
      status: p.pm2_env?.status || "unknown",
      restarts: p.pm2_env?.restart_time ?? 0,
      cpu: p.monit?.cpu ?? 0,
      memoryMb: Math.round((p.monit?.memory ?? 0) / 1048576),
    }));
  } catch {
    return [];
  }
}

async function readPm2AutomationLogTail(lines = 30) {
  const p = path.join(os.homedir(), ".pm2", "logs", "kokisoyo-automation-out.log");
  if (!fs.existsSync(p)) return "(belum ada log kokisoyo-automation)";
  const content = fs.readFileSync(p, "utf8").split("\n");
  return content.slice(-lines).join("\n");
}

function discoverPublishedSnapshots() {
  const items = [];
  for (const dirName of ["ep003_jembatan_laut"]) {
    const p = path.join(OUT_DIR, dirName, "youtube_publish.json");
    if (fs.existsSync(p)) {
      try {
        const d = JSON.parse(fs.readFileSync(p, "utf8"));
        items.push({
          slug: dirName,
          title: d.uploadSlug || dirName,
          youtubeUrl: d.url || null,
          privacyStatus: d.privacyStatus || d.status || "published",
          publishAt: d.publishAt || d.publishedAt || null,
          platforms: ["youtube"],
        });
      } catch {
        // Ignore parse error
      }
    }
  }
  const pipePesawat = path.join(OUT_DIR, "pipeline", "ep_test_ban_pesawat_v4_laura", "youtube_publish.json");
  if (fs.existsSync(pipePesawat)) {
    try {
      const d = JSON.parse(fs.readFileSync(pipePesawat, "utf8"));
      items.push({
        slug: "ep_test_ban_pesawat_v4_laura",
        title: d.title || "Ban Pesawat",
        youtubeUrl: d.url || null,
        privacyStatus: d.privacyStatus || "public",
        publishAt: d.publishedAt || null,
        platforms: ["youtube"],
      });
    } catch {
      // Ignore
    }
  }
  return items;
}

async function handleAutomationStatus() {
  const env = getAutomationEnv();
  const state = loadQueueState(AUTOMATION_STATE_FILE);
  const elAdapter = createElevenLabsAdapter({ env, envFile: AUTOMATION_ENV_FILE });
  const [elevenLabs, renderActive, pm2List, agyProcsRes, automationLogTail] = await Promise.all([
    elAdapter.checkQuotas().catch(() => ({ keys: [], totalRemainingChars: 0 })),
    isRenderProcessActive(),
    listPm2Summary(),
    runSafe("bash", ["-c", "ps -eo pid,lstart,args | grep -E 'agy --continue|agy --dangerously' | grep -v grep | wc -l"]),
    readPm2AutomationLogTail(25),
  ]);

  const readiness = getPlatformReadiness(env);
  const activePlatforms = resolveConfiguredPlatforms(env);
  const produceCheck = shouldProduceMore(state);
  const publishCheck = canPublishToday(state, new Date());
  const nextPrimeTimeISO = computeNextPrimeTimeISO({
    utcOffsetHours: Number(state.config?.utcOffsetHours ?? 7),
    primeHourLocal: Number(state.config?.primeHourLocal ?? 19),
    primeMinuteLocal: Number(state.config?.primeMinuteLocal ?? 0),
    minLeadMinutes: Number(state.config?.minLeadMinutes ?? 45),
  });

  const combinedHistory = [
    ...(state.publishedHistory || []),
    ...discoverPublishedSnapshots().filter(
      (snap) => !(state.publishedHistory || []).some((h) => h.slug === snap.slug)
    ),
  ];

  const localAgy = detectLocalAgyAuthInfo();

  return {
    now: new Date().toISOString(),
    renderActive,
    pm2: pm2List,
    platforms: {
      readiness,
      activePlatforms,
      youtubeConfigured: readiness.youtube,
      facebookPageId: env.META_FB_PAGE_ID || null,
      instagramUserId: env.META_IG_USER_ID || null,
      instagramTunnelMode: env.IG_PUBLIC_VIDEO_BASE_URL ? "static_url" : "ephemeral_cloudflared",
    },
    accounts: {
      vpsLocalAgyEmail: localAgy.email,
      vpsLocalAgyLog: localAgy.logFile,
      vpsAgyProcessCount: Number((agyProcsRes.stdout || "0").trim()) || 0,
      agyBridgeUrl: env.AGYBRIDGE_RENDER_URL || null,
      standardModel: env.AI_STANDARD_MODEL || env.AGYBRIDGE_DEFAULT_MODEL || "gemini-2.5-flash",
      premiumModel: env.AI_PREMIUM_MODEL || state.config?.agyModel || "gemini-4-hydrogen-high",
    },
    elevenLabs,
    schedule: {
      dailyPublishLimit: state.config?.dailyPublishLimit ?? 1,
      publishWindowStartWib: `${String(state.config?.publishWindowStartHourLocal ?? 15).padStart(2, "0")}:00 WIB`,
      primeTimeWib: `${String(state.config?.primeHourLocal ?? 19).padStart(2, "0")}:${String(
        state.config?.primeMinuteLocal ?? 0
      ).padStart(2, "0")} WIB`,
      nextPrimeTimeISO,
      canPublishNow: publishCheck,
    },
    stockSummary: {
      ready: (state.stock || []).filter((s) => s.status === "ready").length,
      published: combinedHistory.length,
      failed: (state.stock || []).filter((s) => s.status === "failed").length,
      queuedTopics: (state.topics || []).filter((t) => t.status === "queued").length,
      producingTopics: (state.topics || []).filter((t) => t.status === "producing").length,
      maxStock: state.config?.maxStock ?? 10,
      resumeBelowStock: state.config?.resumeBelowStock ?? 5,
      produceCheck,
    },
    config: state.config,
    stock: state.stock || [],
    topics: state.topics || [],
    publishedHistory: combinedHistory,
    lastTickAt: state.lastTickAt,
    lastError: state.lastError,
    automationLogTail,
  };
}

async function handleAutomationAction(body) {
  const env = getAutomationEnv();
  const action = String(body?.action || "").trim();
  const state = loadQueueState(AUTOMATION_STATE_FILE);

  if (action === "add_topic") {
    const topic = String(body.topic || "").trim();
    if (!topic) throw new Error("Topik tidak boleh kosong.");
    const res = enqueueTopic(state, { slug: body.slug || "", topic, rootDir: ROOT });
    saveQueueState(AUTOMATION_STATE_FILE, state);
    return { ok: true, action, result: res };
  }

  if (action === "scout") {
    const count = Math.min(8, Math.max(1, Number(body.count || 3)));
    const added = await scoutTopics({
      rootDir: ROOT,
      state,
      env,
      envFile: AUTOMATION_ENV_FILE,
      count,
    });
    saveQueueState(AUTOMATION_STATE_FILE, state);
    return { ok: true, action, addedCount: added.length, added };
  }

  if (action === "toggle_produce") {
    state.config.autoProduceEnabled =
      typeof body.enabled === "boolean" ? body.enabled : !state.config.autoProduceEnabled;
    saveQueueState(AUTOMATION_STATE_FILE, state);
    return { ok: true, action, autoProduceEnabled: state.config.autoProduceEnabled };
  }

  if (action === "toggle_publish") {
    state.config.autoPublishEnabled =
      typeof body.enabled === "boolean" ? body.enabled : !state.config.autoPublishEnabled;
    saveQueueState(AUTOMATION_STATE_FILE, state);
    return { ok: true, action, autoPublishEnabled: state.config.autoPublishEnabled };
  }

  if (action === "update_schedule") {
    if (body.dailyPublishLimit !== undefined) {
      state.config.dailyPublishLimit = Math.min(5, Math.max(1, Number(body.dailyPublishLimit) || 1));
    }
    if (body.primeHourLocal !== undefined) {
      state.config.primeHourLocal = Math.min(23, Math.max(0, Number(body.primeHourLocal) || 19));
    }
    if (body.publishWindowStartHourLocal !== undefined) {
      state.config.publishWindowStartHourLocal = Math.min(
        23,
        Math.max(0, Number(body.publishWindowStartHourLocal) || 15)
      );
    }
    if (body.maxStock !== undefined) {
      state.config.maxStock = Math.min(30, Math.max(2, Number(body.maxStock) || 10));
    }
    saveQueueState(AUTOMATION_STATE_FILE, state);
    return { ok: true, action, config: state.config };
  }

  if (action === "publish_next") {
    const res = await publishNextFromStock({
      statePath: AUTOMATION_STATE_FILE,
      env,
      dryRun: body.dryRun !== false,
      force: Boolean(body.force),
    });
    return { ok: res.ok, action, result: res };
  }

  throw new Error(`Action automation tidak dikenal: ${action}`);
}

async function handleDashboardChat(body) {
  const message = String(body?.message || "").trim();
  if (!message) throw new Error("Pesan chat tidak boleh kosong.");
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];

  const env = getAutomationEnv();
  const snap = await handleAutomationStatus();
  const contextSummary = {
    waktuUtc: snap.now,
    renderSedangJalan: snap.renderActive,
    pm2: snap.pm2,
    kanalAktif: snap.platforms.activePlatforms,
    facebookPageId: snap.platforms.facebookPageId,
    instagramUserId: snap.platforms.instagramUserId,
    akunVpsCli: snap.accounts.vpsLocalAgyEmail,
    agyBridgeUrl: snap.accounts.agyBridgeUrl,
    elevenLabsSisaKarakter: snap.elevenLabs.totalRemainingChars,
    elevenLabsPerAkun: snap.elevenLabs.keys,
    stok: snap.stockSummary,
    daftarStokSiap: snap.stock.filter((s) => s.status === "ready").map((s) => ({ slug: s.slug, title: s.title })),
    riwayatTayang: snap.publishedHistory.slice(-6),
    antreanTopik: snap.topics.slice(0, 8).map((t) => ({ slug: t.slug, topic: t.topic, status: t.status })),
    jadwal: snap.schedule,
    autoProduce: snap.config?.autoProduceEnabled,
    autoPublish: snap.config?.autoPublishEnabled,
    lastTickAt: snap.lastTickAt,
    lastError: snap.lastError,
  };

  const systemPrompt = [
    'Kamu adalah asisten AI operasional untuk studio otomatis "Kok Iso Yo?" di VPS Ubuntu.',
    "Jawab dalam Bahasa Indonesia yang ringkas, jujur, dan berbasis DATA LIVE di bawah ini (jangan mengarang angka atau status).",
    "Jika user bertanya soal jumlah konten jadi, jadwal post, kanal aktif (YouTube/Facebook/Instagram), sisa kuota ElevenLabs, status render, atau error terbaru, gunakan langsung data snapshot berikut:",
    JSON.stringify(contextSummary, null, 2),
  ].join("\n\n");

  const aiRouter = createAIRouter({ env, envFile: AUTOMATION_ENV_FILE });
  const msgs = [
    ...history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) })),
    { role: "user", content: message.slice(0, 2000) },
  ];

  let res;
  try {
    res = await aiRouter.chatCompletion({
      task: "post_copy",
      model: env.AI_STANDARD_MODEL || env.AGYBRIDGE_DEFAULT_MODEL || "gemini-2.5-flash",
      systemPrompt,
      messages: msgs,
      temperature: 0.4,
    });
  } catch {
    res = await aiRouter.chatCompletion({
      task: "creative_director",
      model: env.AI_PREMIUM_MODEL || "gemini-4-hydrogen-high",
      systemPrompt,
      messages: msgs,
      temperature: 0.4,
    });
  }

  return {
    ok: true,
    reply: String(res?.content || "(tidak ada jawaban)").trim(),
    model: res?.model || "unknown",
    provider: res?.route?.provider || "unknown",
    usage: res?.usage || null,
  };
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  try {
    if (pathname === "/" || pathname === "/index.html") {
      const html = fs.readFileSync(PUBLIC_HTML, "utf8");
      res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-store" });
      res.end(html);
      return;
    }

    if (pathname === "/api/health") {
      sendJson(res, 200, { ok: true, port: PORT, pinRequired: Boolean(STUDIO_PIN) });
      return;
    }

    if (!isAuthorized(req, urlObj)) {
      sendJson(res, 401, { error: "PIN studio diperlukan atau salah." });
      return;
    }

    if (pathname === "/api/auth-check") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (pathname === "/api/status" && req.method === "GET") {
      sendJson(res, 200, await handleStatus());
      return;
    }

    if (pathname === "/api/automation/status" && req.method === "GET") {
      sendJson(res, 200, await handleAutomationStatus());
      return;
    }

    if (pathname === "/api/automation/action" && req.method === "POST") {
      const raw = await readBodyBuffer(req, 512 * 1024);
      const body = JSON.parse(raw.toString("utf8"));
      sendJson(res, 200, await handleAutomationAction(body));
      return;
    }

    if (pathname === "/api/chat" && req.method === "POST") {
      const raw = await readBodyBuffer(req, 512 * 1024);
      const body = JSON.parse(raw.toString("utf8"));
      sendJson(res, 200, await handleDashboardChat(body));
      return;
    }

    if (pathname === "/api/ai-quota" && req.method === "GET") {
      const refreshModels = urlObj.searchParams.get("refresh") === "1";
      sendJson(res, 200, await handleGetQuota(refreshModels));
      return;
    }

    if (pathname === "/api/ai-quota" && req.method === "POST") {
      const raw = await readBodyBuffer(req, 512 * 1024);
      const body = JSON.parse(raw.toString("utf8"));
      const state = loadQuotaState();
      if (typeof body.paused === "boolean") state.paused = body.paused;
      if (typeof body.autoBlockRenderOnLimit === "boolean") {
        state.autoBlockRenderOnLimit = body.autoBlockRenderOnLimit;
      }
      if (typeof body.defaultModel === "string" && body.defaultModel.trim()) {
        state.defaultModel = body.defaultModel.trim().slice(0, 80);
      }
      if (body.warningThresholdPct !== undefined) {
        const w = Number(body.warningThresholdPct);
        if (Number.isFinite(w) && w >= 10 && w <= 99) state.warningThresholdPct = Math.round(w);
      }
      if (body.limits && typeof body.limits === "object") {
        const numBounds = {
          aiTasksPerDay: [1, 10000],
          aiTokensPerMonth: [1000, 1000000000],
          ttsCharsPerMonth: [100, 100000000],
          renderJobsPerDay: [1, 1000],
          maxConcurrentRenders: [1, 4],
          maxRamPct: [30, 98],
          monthlyBudgetUsd: [0, 100000],
        };
        for (const [k, [minV, maxV]] of Object.entries(numBounds)) {
          if (body.limits[k] !== undefined) {
            const val = Number(body.limits[k]);
            if (Number.isFinite(val)) {
              state.limits[k] = Math.min(maxV, Math.max(minV, val));
            }
          }
        }
      }
      if (Array.isArray(body.providers)) {
        state.providers = body.providers.slice(0, 8).map((p, idx) => ({
          id: sanitizeSlug(p.id || `prov_${idx}`) || `prov_${idx}`,
          name: String(p.name || "Provider AI").slice(0, 64),
          plan: String(p.plan || "-").slice(0, 48),
          remainingPct: Math.min(100, Math.max(0, Number(p.remainingPct ?? 100) || 0)),
          resetInfo: String(p.resetInfo || "-").slice(0, 48),
          note: String(p.note || "").slice(0, 160),
        }));
      }
      appendQuotaHistory(state, {
        type: "config_update",
        delta: state.paused ? "PAUSED" : "UPDATED",
        model: state.defaultModel,
        note: `Limits / provider settings updated`,
      });
      saveQuotaState(state);
      sendJson(res, 200, await handleGetQuota(false));
      return;
    }

    if (pathname === "/api/ai-quota/record" && req.method === "POST") {
      const raw = await readBodyBuffer(req, 512 * 1024);
      const body = JSON.parse(raw.toString("utf8"));
      const state = loadQuotaState();
      const action = body.action || "record";

      if (action === "reset_daily") {
        state.usage.aiTasksToday = 0;
        state.usage.renderJobsToday = 0;
        appendQuotaHistory(state, { type: "reset_daily", delta: "0", model: state.defaultModel, note: "Reset counter harian" });
      } else if (action === "reset_monthly") {
        state.usage.aiTokensMonth = 0;
        state.usage.ttsCharsMonth = 0;
        state.usage.estimatedSpendUsdMonth = 0;
        appendQuotaHistory(state, { type: "reset_monthly", delta: "0", model: state.defaultModel, note: "Reset counter bulanan" });
      } else if (action === "set_usage") {
        if (body.aiTasksToday !== undefined) state.usage.aiTasksToday = Math.max(0, Number(body.aiTasksToday) || 0);
        if (body.aiTokensMonth !== undefined) state.usage.aiTokensMonth = Math.max(0, Number(body.aiTokensMonth) || 0);
        if (body.ttsCharsMonth !== undefined) state.usage.ttsCharsMonth = Math.max(0, Number(body.ttsCharsMonth) || 0);
        if (body.renderJobsToday !== undefined) state.usage.renderJobsToday = Math.max(0, Number(body.renderJobsToday) || 0);
        if (body.estimatedSpendUsdMonth !== undefined) {
          state.usage.estimatedSpendUsdMonth = Math.max(0, Number(body.estimatedSpendUsdMonth) || 0);
        }
        appendQuotaHistory(state, {
          type: "sync_usage",
          delta: "manual",
          model: state.defaultModel,
          note: String(body.note || "Sinkronisasi angka pemakaian manual").slice(0, 120),
        });
      } else {
        const dTasks = Math.max(0, Number(body.tasks || 0) || 0);
        const dTokens = Math.max(0, Number(body.tokens || 0) || 0);
        const dTts = Math.max(0, Number(body.ttsChars || 0) || 0);
        const dRenders = Math.max(0, Number(body.renders || 0) || 0);
        const dUsd = Math.max(0, Number(body.usd || 0) || 0);
        state.usage.aiTasksToday += dTasks;
        state.usage.aiTokensMonth += dTokens;
        state.usage.ttsCharsMonth += dTts;
        state.usage.renderJobsToday += dRenders;
        state.usage.estimatedSpendUsdMonth = Number((state.usage.estimatedSpendUsdMonth + dUsd).toFixed(4));
        const parts = [];
        if (dTasks) parts.push(`+${dTasks} task`);
        if (dTokens) parts.push(`+${dTokens} tok`);
        if (dTts) parts.push(`+${dTts} tts`);
        if (dRenders) parts.push(`+${dRenders} render`);
        if (dUsd) parts.push(`+$${dUsd}`);
        appendQuotaHistory(state, {
          type: "usage",
          delta: parts.join(", ") || "log",
          model: String(body.model || state.defaultModel),
          note: String(body.note || "Catat pemakaian AI manual").slice(0, 140),
        });
      }

      saveQuotaState(state);
      sendJson(res, 200, await handleGetQuota(action === "refresh_models"));
      return;
    }

    if (pathname === "/api/episodes" && req.method === "GET") {
      sendJson(res, 200, await handleEpisodes());
      return;
    }

    if (pathname === "/api/projects" && req.method === "GET") {
      sendJson(res, 200, await handleListProjects());
      return;
    }

    if (pathname === "/api/projects" && req.method === "POST") {
      const raw = await readBodyBuffer(req, 1024 * 1024);
      const body = JSON.parse(raw.toString("utf8"));
      const slug = sanitizeSlug(body.slug || body.title);
      if (!slug) {
        sendJson(res, 400, { error: "Slug atau judul project wajib diisi." });
        return;
      }
      const pDir = path.join(PROJECTS_DIR, slug);
      fs.mkdirSync(pDir, { recursive: true });
      const brief = {
        slug,
        title: String(body.title || slug),
        visualStyle: String(body.visualStyle || "Jalur 3C (StageDoc3D PBR + Editorial 2D)"),
        aspect: String(body.aspect || "9:16 (1080x1920 @ 30fps)"),
        prompt: String(body.prompt || ""),
        notes: String(body.notes || ""),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(pDir, "brief.json"), JSON.stringify(brief, null, 2), "utf8");
      const docDir = path.join(DOCS_DIR, slug);
      fs.mkdirSync(docDir, { recursive: true });
      fs.writeFileSync(
        path.join(docDir, "prompt.md"),
        `# ${brief.title}\n\n- **Slug:** \`${slug}\`\n- **Style:** ${brief.visualStyle}\n- **Format:** ${brief.aspect}\n- **Updated:** ${brief.updatedAt}\n\n## Prompt / Naskah\n\n${brief.prompt}\n\n## Catatan Produksi\n\n${brief.notes}\n`,
        "utf8"
      );
      const qState = loadQuotaState();
      const promptLen = (brief.prompt || "").length;
      const estTokens = Math.max(250, Math.round(promptLen * 1.4));
      qState.usage.aiTasksToday += 1;
      qState.usage.aiTokensMonth += estTokens;
      qState.usage.ttsCharsMonth += promptLen;
      appendQuotaHistory(qState, {
        type: "project_brief",
        delta: `+1 task, +${estTokens} est tok`,
        model: qState.defaultModel,
        note: `Simpan brief: ${slug}`,
      });
      saveQuotaState(qState);
      sendJson(res, 200, { ok: true, brief });
      return;
    }

    const audioUploadMatch = pathname.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)\/audio$/);
    if (audioUploadMatch && req.method === "POST") {
      const slug = sanitizeSlug(audioUploadMatch[1]);
      if (!slug || slug.startsWith("episode002")) {
        sendJson(res, 400, { error: "Slug project tidak valid atau dilindungi." });
        return;
      }
      const origName = String(req.headers["x-file-name"] || "voiceover.mp3");
      const extMatch = origName.toLowerCase().match(/\.(mp3|wav|m4a)$/);
      const ext = extMatch ? extMatch[1] : "mp3";
      const buf = await readBodyBuffer(req, 80 * 1024 * 1024); // 80 MB max
      const pDir = path.join(PROJECTS_DIR, slug);
      fs.mkdirSync(pDir, { recursive: true });
      const outPath = path.join(pDir, `voiceover.${ext}`);
      fs.writeFileSync(outPath, buf);
      const [probe, silences] = await Promise.all([probeMedia(outPath), detectAudioSilences(outPath)]);
      sendJson(res, 200, {
        ok: true,
        file: `${slug}/voiceover.${ext}`,
        sizeBytes: buf.length,
        probe,
        silences,
      });
      return;
    }

    if (pathname === "/api/jobs" && req.method === "POST") {
      const raw = await readBodyBuffer(req, 512 * 1024);
      const body = JSON.parse(raw.toString("utf8"));
      const result = await launchStudioJob(body);
      sendJson(res, 200, result);
      return;
    }

    const isRead = req.method === "GET" || req.method === "HEAD";
    if (pathname === "/api/media/video" && isRead) {
      const rel = urlObj.searchParams.get("path");
      const dl = urlObj.searchParams.get("download") === "1";
      const target = safeResolve(OUT_DIR, rel);
      if (!target || !target.endsWith(".mp4")) {
        sendJson(res, 400, { error: "Path video tidak valid." });
        return;
      }
      streamFileWithRange(req, res, target, dl ? target : null);
      return;
    }

    if (pathname === "/api/media/image" && isRead) {
      const rel = urlObj.searchParams.get("path");
      const target = safeResolve(DOCS_DIR, rel) || safeResolve(OUT_DIR, rel);
      if (!target || !/\.(jpg|jpeg|png)$/i.test(target)) {
        sendJson(res, 400, { error: "Path gambar tidak valid." });
        return;
      }
      streamFileWithRange(req, res, target);
      return;
    }

    if (pathname === "/api/media/audio" && isRead) {
      const rel = urlObj.searchParams.get("path");
      const target =
        safeResolve(PROJECTS_DIR, rel) || safeResolve(path.join(ROOT, "public", "episodes"), rel);
      if (!target || !/\.(mp3|wav|m4a)$/i.test(target)) {
        sendJson(res, 400, { error: "Path audio tidak valid." });
        return;
      }
      streamFileWithRange(req, res, target);
      return;
    }

    if (pathname === "/api/docs" && req.method === "GET") {
      const rel = urlObj.searchParams.get("path");
      const target = safeResolve(DOCS_DIR, rel);
      if (!target || !target.endsWith(".md") || !fs.existsSync(target)) {
        sendJson(res, 404, { error: "Dokumen tidak ditemukan." });
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[".md"], "Cache-Control": "no-store" });
      res.end(fs.readFileSync(target, "utf8"));
      return;
    }

    sendJson(res, 404, { error: "Endpoint tidak ditemukan." });
  } catch (err) {
    sendJson(res, 500, { error: err.message || String(err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[KokIsoYo Dashboard] Listening on http://${HOST}:${PORT}`);
  console.log(`[KokIsoYo Dashboard] Access PIN: ${STUDIO_PIN}`);
});
