/**
 * Content-addressed SHA-256 TTS Cache with:
 * - Full-parameter deterministic cache key & strict hex key validation
 * - Path traversal & symlink rejection + private directory mode (0o700)
 * - Durable atomic writes (temp file + fsync + POSIX rename + orphan cleanup)
 * - In-process single-flight deduplication
 * - Cross-process lockfile with unique ownerId, active heartbeat, atomic stale recovery,
 *   and owner-verified unlock (zero TOCTOU / zero blind unlock)
 * - Recursive secret stripping on persisted metadata + `providerMeta` persistence
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { TTSConfigError } from "./errors.mjs";
import { sanitizeTTSObject } from "./redact.mjs";

export const CACHE_SCHEMA_VERSION = "1";

const SHA256_HEX_RE = /^[a-f0-9]{64}$/;

function canonicalize(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) {
        sorted[key] = canonicalize(value[key]);
      }
    }
    return sorted;
  }
  return value;
}

export function assertValidCacheKey(cacheKey) {
  if (typeof cacheKey !== "string" || !SHA256_HEX_RE.test(cacheKey)) {
    throw new TTSConfigError(
      `Invalid TTS cacheKey "${String(cacheKey || "").slice(0, 32)}": expected 64-char lowercase hex SHA-256.`
    );
  }
  return cacheKey;
}

export function assertPathContained(baseDir, targetPath, label = "path") {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  if (resolvedTarget !== resolvedBase && !resolvedTarget.startsWith(resolvedBase + path.sep)) {
    throw new TTSConfigError(`Path traversal detected for ${label}: escapes base directory.`);
  }
  return resolvedTarget;
}

export function assertNoSymlink(targetPath, label = "file") {
  try {
    const lst = fs.lstatSync(targetPath);
    if (lst.isSymbolicLink()) {
      throw new TTSConfigError(`Refusing to access symlinked ${label}: "${path.basename(targetPath)}".`);
    }
    return lst;
  } catch (err) {
    if (err instanceof TTSConfigError) throw err;
    if (err?.code === "ENOENT") return null;
    throw err;
  }
}

/**
 * Computes a deterministic SHA-256 cache key over EVERY parameter that can affect audio output.
 */
export function computeTTSCacheKey({
  provider = "",
  model = "",
  providerVersion = "",
  voice = "",
  language = "id-ID",
  rate = "",
  pitch = "",
  outputFormat = "mp3",
  prosody = null,
  normalizerVersion = "",
  normalizedText = "",
} = {}) {
  const payload = canonicalize({
    schemaVersion: CACHE_SCHEMA_VERSION,
    provider: String(provider || "").trim().toLowerCase(),
    model: String(model || "").trim(),
    providerVersion: String(providerVersion || "").trim(),
    voice: String(voice || "").trim(),
    language: String(language || "id-ID").trim(),
    rate: rate === undefined || rate === null ? "" : String(rate).trim(),
    pitch: pitch === undefined || pitch === null ? "" : String(pitch).trim(),
    outputFormat: String(outputFormat || "mp3").trim().toLowerCase(),
    prosody: prosody && typeof prosody === "object" ? canonicalize(prosody) : null,
    normalizerVersion: String(normalizerVersion || "").trim(),
    normalizedText: String(normalizedText || ""),
  });

  return crypto.createHash("sha256").update(JSON.stringify(payload), "utf8").digest("hex");
}

/**
 * Atomically and durably writes a Buffer or string to `targetPath` via temp file + fsync + rename.
 * Refuses to overwrite a symlink target.
 */
export function atomicWriteFile(targetPath, data, { mode = 0o600 } = {}) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  assertNoSymlink(dir, "directory");
  assertNoSymlink(targetPath, "target file");

  const tmpPath = path.join(
    dir,
    `.${path.basename(targetPath)}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`
  );
  let fd = null;
  try {
    fd = fs.openSync(tmpPath, "wx", mode);
    fs.writeFileSync(fd, data);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore close error
      }
    }
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup error
    }
    throw err;
  }
}

/**
 * Atomically copies `srcPath` to `dstPath` via temp file + fsync + rename.
 * Rejects symlinks on both source and destination.
 */
export function atomicCopyFile(srcPath, dstPath) {
  assertNoSymlink(srcPath, "source file");
  const buf = fs.readFileSync(srcPath);
  atomicWriteFile(dstPath, buf);
}

/**
 * Recursively strips any sensitive credential keys and redacts secret values at ALL depths.
 */
export function sanitizeCacheMetadata(meta, secrets = []) {
  return sanitizeTTSObject(meta, secrets, { stripSensitiveKeys: true });
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPidAlive(pid) {
  const n = Number(pid);
  if (!Number.isInteger(n) || n <= 0) return false;
  try {
    process.kill(n, 0);
    return true;
  } catch (err) {
    // EPERM means process exists but owned by another user; ESRCH means dead
    return err?.code === "EPERM";
  }
}

function readLockOwner(lockPath) {
  try {
    const raw = fs.readFileSync(lockPath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore malformed/vanished lock
  }
  return null;
}

export function createTTSCache({
  cacheDir,
  secrets = [],
  lockTimeoutMs = 30_000,
  lockStaleMs = 120_000,
  lockPollMs = 40,
  lockHeartbeatMs = undefined,
  sleepImpl = defaultSleep,
  isPidAliveImpl = isPidAlive,
} = {}) {
  const resolvedCacheDir = path.resolve(cacheDir);
  const inFlight = new Map();
  const heartbeatIntervalMs =
    lockHeartbeatMs !== undefined
      ? Math.max(10, Number(lockHeartbeatMs))
      : Math.max(25, Math.floor(lockStaleMs / 3));

  function ensureSafeCacheDir() {
    fs.mkdirSync(resolvedCacheDir, { recursive: true, mode: 0o700 });
    assertNoSymlink(resolvedCacheDir, "cacheDir");
  }

  function entryPaths(cacheKey, outputFormat = "mp3") {
    assertValidCacheKey(cacheKey);
    const ext = String(outputFormat || "mp3").replace(/[^a-z0-9]/gi, "").toLowerCase() || "mp3";
    const bucket = assertPathContained(
      resolvedCacheDir,
      path.join(resolvedCacheDir, cacheKey.slice(0, 2)),
      "cache bucket"
    );
    return {
      bucket,
      audioPath: assertPathContained(resolvedCacheDir, path.join(bucket, `${cacheKey}.${ext}`), "cache audio"),
      wordsPath: assertPathContained(resolvedCacheDir, path.join(bucket, `${cacheKey}.words.json`), "cache words"),
      metaPath: assertPathContained(resolvedCacheDir, path.join(bucket, `${cacheKey}.meta.json`), "cache meta"),
      lockPath: assertPathContained(resolvedCacheDir, path.join(bucket, `${cacheKey}.lock`), "cache lock"),
    };
  }

  function readHit(cacheKey, outputFormat = "mp3") {
    const p = entryPaths(cacheKey, outputFormat);
    const bucketStat = assertNoSymlink(p.bucket, "cache bucket");
    if (!bucketStat || !bucketStat.isDirectory()) return null;

    const audioStat = assertNoSymlink(p.audioPath, "cache audio");
    const metaStat = assertNoSymlink(p.metaPath, "cache meta");
    if (!audioStat || !metaStat || !audioStat.isFile() || !metaStat.isFile()) {
      return null;
    }
    if (audioStat.size <= 0) return null;

    const wordsStat = assertNoSymlink(p.wordsPath, "cache words");
    try {
      const meta = JSON.parse(fs.readFileSync(p.metaPath, "utf8"));
      return {
        cacheKey,
        audioPath: p.audioPath,
        wordsPath: wordsStat && wordsStat.isFile() ? p.wordsPath : null,
        metaPath: p.metaPath,
        meta,
      };
    } catch {
      return null;
    }
  }

  function invalidateEntry(cacheKey, outputFormat = "mp3") {
    const p = entryPaths(cacheKey, outputFormat);
    for (const filePath of [p.metaPath, p.audioPath, p.wordsPath]) {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        // ignore cleanup error
      }
    }
  }

  function writeEntry({
    cacheKey,
    outputFormat = "mp3",
    audioBuffer,
    words = null,
    meta = {},
    providerMeta = {},
  }) {
    ensureSafeCacheDir();
    const p = entryPaths(cacheKey, outputFormat);
    fs.mkdirSync(p.bucket, { recursive: true, mode: 0o700 });
    assertNoSymlink(p.bucket, "cache bucket");

    let wroteAudio = false;
    let wroteWords = false;
    let savedWordsPath = null;

    try {
      atomicWriteFile(p.audioPath, audioBuffer);
      wroteAudio = true;

      if (Array.isArray(words) && words.length > 0) {
        atomicWriteFile(p.wordsPath, JSON.stringify(words, null, 2));
        wroteWords = true;
        savedWordsPath = p.wordsPath;
      } else if (fs.existsSync(p.wordsPath)) {
        // Remove stale words file if entry is rewritten without words
        try {
          fs.unlinkSync(p.wordsPath);
        } catch {
          // ignore
        }
      }

      const safeMeta = sanitizeCacheMetadata(
        {
          ...meta,
          providerMeta: sanitizeCacheMetadata(providerMeta || {}, secrets),
          cacheKey,
          cacheSchemaVersion: CACHE_SCHEMA_VERSION,
          outputFormat,
          cachedAt: new Date().toISOString(),
        },
        secrets
      );
      atomicWriteFile(p.metaPath, JSON.stringify(safeMeta, null, 2));

      return {
        cacheKey,
        audioPath: p.audioPath,
        wordsPath: savedWordsPath,
        metaPath: p.metaPath,
        meta: safeMeta,
      };
    } catch (err) {
      // Clean up orphan files if meta commit failed mid-write
      if (wroteAudio) {
        try {
          if (fs.existsSync(p.audioPath)) fs.unlinkSync(p.audioPath);
        } catch {
          // ignore
        }
      }
      if (wroteWords) {
        try {
          if (fs.existsSync(p.wordsPath)) fs.unlinkSync(p.wordsPath);
        } catch {
          // ignore
        }
      }
      throw err;
    }
  }

  /**
   * Acquires an exclusive cross-process lockfile with:
   * - Unique `ownerId` written inside lockfile
   * - Active heartbeat interval refreshing `mtime` while held
   * - Atomic stale lock recovery (`renameSync` before `unlinkSync`) + same-host PID liveness check
   * - Owner-verified `release()` that NEVER deletes a lock owned by another process
   */
  async function acquireFileLock(lockPath) {
    ensureSafeCacheDir();
    const lockDir = path.dirname(lockPath);
    fs.mkdirSync(lockDir, { recursive: true, mode: 0o700 });
    assertNoSymlink(lockDir, "lock directory");

    const ownerId = `${process.pid}:${crypto.randomUUID()}`;
    const host = os.hostname();
    const deadline = Date.now() + lockTimeoutMs;

    while (Date.now() < deadline) {
      try {
        const fd = fs.openSync(lockPath, "wx", 0o600);
        const now = Date.now();
        fs.writeFileSync(
          fd,
          JSON.stringify({ ownerId, pid: process.pid, host, createdAt: now, updatedAt: now })
        );
        fs.fsyncSync(fd);
        fs.closeSync(fd);

        // Keep lock fresh while process is actively working
        const hb = setInterval(() => {
          try {
            const current = readLockOwner(lockPath);
            if (!current || current.ownerId !== ownerId) {
              clearInterval(hb);
              return;
            }
            const t = new Date();
            fs.utimesSync(lockPath, t, t);
          } catch {
            clearInterval(hb);
          }
        }, heartbeatIntervalMs);
        hb.unref?.();

        let released = false;
        return () => {
          if (released) return;
          released = true;
          clearInterval(hb);
          try {
            const current = readLockOwner(lockPath);
            if (current && current.ownerId === ownerId) {
              fs.unlinkSync(lockPath);
            }
          } catch {
            // ignore if already gone
          }
        };
      } catch (err) {
        if (err?.code !== "EEXIST") throw err;

        // Inspect existing lock for staleness
        let st = null;
        try {
          st = fs.lstatSync(lockPath);
        } catch {
          continue; // disappeared between open and lstat; retry immediately
        }

        if (st.isSymbolicLink()) {
          throw new TTSConfigError(`Refusing to use symlinked lockfile: "${path.basename(lockPath)}".`);
        }

        const ageMs = Date.now() - st.mtimeMs;
        const existing = readLockOwner(lockPath);
        const sameHostDead =
          existing &&
          existing.host === host &&
          existing.pid &&
          existing.pid !== process.pid &&
          !isPidAliveImpl(existing.pid);
        const isStale =
          ageMs > lockStaleMs &&
          (!existing ||
            existing.host !== host ||
            (existing.pid !== process.pid && !isPidAliveImpl(existing.pid)));

        if (sameHostDead || isStale) {
          // Atomic stale recovery: only ONE contender wins the renameSync!
          const reclaimPath = `${lockPath}.reclaim.${process.pid}.${crypto.randomBytes(4).toString("hex")}`;
          try {
            fs.renameSync(lockPath, reclaimPath);
            try {
              fs.unlinkSync(reclaimPath);
            } catch {
              // ignore cleanup
            }
            continue;
          } catch (reclaimErr) {
            // ENOENT means another contender already reclaimed it; retry loop cleanly
            if (reclaimErr?.code === "ENOENT") {
              continue;
            }
          }
        }

        await sleepImpl(lockPollMs);
      }
    }

    throw new Error(`Timed out waiting for TTS cache lock: ${path.basename(lockPath)}`);
  }

  /**
   * Concurrent-safe cache lookup/populate:
   * - Deduplicates concurrent in-process calls via single-flight map.
   * - Coordinates cross-process writers via exclusive owner-verified lockfile + double-check.
   */
  async function getOrCreate({ cacheKey, outputFormat = "mp3", producer }) {
    const fastHit = readHit(cacheKey, outputFormat);
    if (fastHit) {
      return { hit: true, entry: fastHit, producerMeta: fastHit.meta?.providerMeta || {} };
    }

    const flightKey = `${cacheKey}:${outputFormat}`;
    if (inFlight.has(flightKey)) {
      const entry = await inFlight.get(flightKey);
      return { hit: true, entry, producerMeta: entry.meta?.providerMeta || {} };
    }

    const taskPromise = (async () => {
      const p = entryPaths(cacheKey, outputFormat);
      const release = await acquireFileLock(p.lockPath);
      try {
        const afterLockHit = readHit(cacheKey, outputFormat);
        if (afterLockHit) {
          return {
            hit: true,
            entry: afterLockHit,
            producerMeta: afterLockHit.meta?.providerMeta || {},
          };
        }
        const produced = await producer();
        const entry = writeEntry({
          cacheKey,
          outputFormat,
          audioBuffer: produced.audioBuffer,
          words: produced.words || null,
          meta: produced.meta || {},
          providerMeta: produced.producerMeta || {},
        });
        return {
          hit: false,
          entry,
          producerMeta: entry.meta?.providerMeta || {},
          audioInfo: produced.audioInfo || null,
        };
      } finally {
        release();
      }
    })();

    const sharedEntryPromise = taskPromise.then((res) => res.entry);
    // Prevent unhandled rejection warning on secondary waiters if primary rejects
    sharedEntryPromise.catch(() => {});
    inFlight.set(flightKey, sharedEntryPromise);
    try {
      return await taskPromise;
    } finally {
      inFlight.delete(flightKey);
    }
  }

  return {
    cacheDir: resolvedCacheDir,
    entryPaths,
    readHit,
    writeEntry,
    invalidateEntry,
    acquireFileLock,
    getOrCreate,
  };
}
