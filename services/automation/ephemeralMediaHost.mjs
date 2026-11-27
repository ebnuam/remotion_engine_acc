/**
 * Ephemeral Public HTTPS Media Host for Instagram Reels Graph API.
 *
 * Instagram Graph API requires a publicly reachable HTTPS `video_url` (and optional `cover_url`)
 * so Meta's servers can download the MP4 + thumbnail cover. When `IG_PUBLIC_VIDEO_BASE_URL`
 * is not configured, this helper spins up:
 * 1. An isolated local HTTP server on `127.0.0.1:0` serving ONLY the target MP4
 *    and optional cover JPEG under cryptographic random one-time paths.
 * 2. A short-lived `cloudflared tunnel --url http://127.0.0.1:<port>` process.
 * 3. Automatic teardown as soon as Instagram finishes fetching the container.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const TUNNEL_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

function parseRangeHeader(rangeHeader, fileSize) {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) return null;
  const [startStr, endStr] = rangeHeader.slice(6).split("-", 2);
  let start = startStr ? Number.parseInt(startStr, 10) : 0;
  let end = endStr ? Number.parseInt(endStr, 10) : fileSize - 1;
  if (!Number.isFinite(start) || start < 0) start = 0;
  if (!Number.isFinite(end) || end >= fileSize) end = fileSize - 1;
  if (start > end || start >= fileSize) return null;
  return { start, end };
}

function serveSingleFile(req, res, fileInfo) {
  const { absPath, fileSize, contentType } = fileInfo;
  const range = parseRangeHeader(req.headers.range, fileSize);
  if (range) {
    const chunkSize = range.end - range.start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${range.start}-${range.end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(chunkSize),
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(absPath, { start: range.start, end: range.end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Length": String(fileSize),
    "Accept-Ranges": "bytes",
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(absPath).pipe(res);
}

export async function startLocalMediaServer({
  filePath,
  publicFilename = null,
  coverPath = null,
  coverFilename = null,
}) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Ephemeral media file not found: ${absPath}`);
  }
  const token = crypto.randomBytes(24).toString("hex");
  const safeName = encodeURIComponent(publicFilename || path.basename(absPath));
  const expectedPath = `/${token}/${safeName}`;

  const routes = new Map();
  routes.set(expectedPath, {
    absPath,
    fileSize: fs.statSync(absPath).size,
    contentType: "video/mp4",
  });

  let coverExpectedPath = null;
  if (coverPath && fs.existsSync(coverPath)) {
    const absCover = path.resolve(coverPath);
    const safeCover = encodeURIComponent(coverFilename || path.basename(absCover));
    coverExpectedPath = `/${token}/${safeCover}`;
    const ext = path.extname(absCover).toLowerCase();
    routes.set(coverExpectedPath, {
      absPath: absCover,
      fileSize: fs.statSync(absCover).size,
      contentType: ext === ".png" ? "image/png" : "image/jpeg",
    });
  }

  const server = http.createServer((req, res) => {
    const reqPath = (req.url || "").split("?")[0];
    const fileInfo = routes.get(reqPath);
    if (!fileInfo || (req.method !== "GET" && req.method !== "HEAD")) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    serveSingleFile(req, res, fileInfo);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  return {
    port,
    expectedPath,
    coverExpectedPath,
    localUrl: `http://127.0.0.1:${port}${expectedPath}`,
    coverLocalUrl: coverExpectedPath ? `http://127.0.0.1:${port}${coverExpectedPath}` : null,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve());
      }),
  };
}

async function waitForPublicUrlReady(publicUrl, { fetchImpl = globalThis.fetch, timeoutMs = 20_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const resp = await fetchImpl(publicUrl, { method: "HEAD" });
      if (resp.ok) return true;
    } catch {
      // DNS / edge propagation still warming up
    }
    await new Promise((r) => setTimeout(r, 1_500));
  }
  return false;
}

export async function withEphemeralCloudflareMedia(
  {
    filePath,
    publicFilename = null,
    coverPath = null,
    coverFilename = null,
    cloudflaredBin = "cloudflared",
    startupTimeoutMs = 25_000,
    fetchImpl = globalThis.fetch,
  },
  fn
) {
  const localSrv = await startLocalMediaServer({
    filePath,
    publicFilename,
    coverPath,
    coverFilename,
  });
  let tunnelProc = null;

  try {
    const baseUrl = await new Promise((resolve, reject) => {
      let settled = false;
      let logs = "";
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error(`cloudflared quick tunnel timed out (${logs.slice(-200)})`));
        }
      }, startupTimeoutMs);

      tunnelProc = spawn(
        cloudflaredBin,
        ["tunnel", "--url", `http://127.0.0.1:${localSrv.port}`, "--no-autoupdate"],
        { stdio: ["ignore", "pipe", "pipe"] }
      );

      const onData = (chunk) => {
        logs += chunk.toString("utf8");
        const m = logs.match(TUNNEL_URL_RE);
        if (m && !settled) {
          settled = true;
          clearTimeout(timer);
          resolve(m[0]);
        }
      };

      tunnelProc.stdout.on("data", onData);
      tunnelProc.stderr.on("data", onData);
      tunnelProc.once("error", (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      });
      tunnelProc.once("exit", (code) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error(`cloudflared exited early (code=${code}): ${logs.slice(-200)}`));
        }
      });
    });

    const videoUrl = `${baseUrl}${localSrv.expectedPath}`;
    const coverUrl = localSrv.coverExpectedPath ? `${baseUrl}${localSrv.coverExpectedPath}` : null;
    await waitForPublicUrlReady(videoUrl, { fetchImpl });
    return await fn({ videoUrl, coverUrl });
  } finally {
    if (tunnelProc && !tunnelProc.killed) {
      try {
        tunnelProc.kill("SIGTERM");
      } catch {
        // Ignore cleanup failure
      }
    }
    await localSrv.close();
  }
}
