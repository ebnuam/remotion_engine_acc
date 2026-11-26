#!/usr/bin/env node
/**
 * Kok Iso Yo? Studio Control — Local Web Server & Render Orchestrator (Port 3010)
 * Zero external npm dependencies (pure Node.js built-ins + ffmpeg/ffprobe/tmux CLI).
 * Exposed safely via Cloudflare Quick Tunnel (`cloudflared tunnel --url http://127.0.0.1:3010`).
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC_HTML = path.join(ROOT, "dashboard", "public", "index.html");
const OUT_DIR = path.join(ROOT, "out");
const DOCS_DIR = path.join(ROOT, "docs", "episodes");
const PROJECTS_DIR = path.join(ROOT, "public", "projects");
const LOGS_DIR = path.join(ROOT, "logs");

const PORT = Number(process.env.STUDIO_PORT || 3010);
const HOST = process.env.STUDIO_HOST || "127.0.0.1";
const STUDIO_PIN = (process.env.STUDIO_PIN || "kokisoyo2026").trim();

fs.mkdirSync(PROJECTS_DIR, { recursive: true });
fs.mkdirSync(LOGS_DIR, { recursive: true });

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

  // Safety guard: never start concurrent heavy Chromium render while another render is running
  const psCheck = await runSafe("bash", [
    "-lc",
    "ps -ef | grep -E 'remotion render|bridge-stills' | grep -v grep || true",
  ]);
  if ((psCheck.stdout || "").trim().length > 0) {
    throw new Error("Render lain sedang berjalan di VPS. Tunggu selesai agar 4 vCPU tidak bentrok.");
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
  return { ok: true, sessionName, logFile: `logs/${sessionName}.log` };
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
