/**
 * Persistent Stock Queue & Daily Prime-Time Publisher for Kok Iso Yo? Automation.
 *
 * Separates video production (stock buffer) from daily publishing:
 * - Production fills stock up to `maxStock` (default 10), then pauses until stock
 *   drops below `resumeBelowStock` (default 5) to conserve AI & ElevenLabs quota.
 * - Daily publisher picks 1 ready video/day during the upload window (>= 15:00 WIB)
 *   and executes the 5-Step YouTube Growth SOP via `publishToPlatforms`.
 */

import fs from "node:fs";
import path from "node:path";
import { atomicWriteFile } from "../tts-gateway/index.mjs";
import {
  getPlatformReadiness,
  publishToPlatforms,
} from "../pipeline/publishers/index.mjs";
import {
  computeNextPrimeTimeISO,
  slugifyVideoFilename,
} from "../pipeline/publishers/youtube.mjs";
import { withEphemeralCloudflareMedia } from "./ephemeralMediaHost.mjs";

export const DEFAULT_AUTOMATION_CONFIG = Object.freeze({
  autoProduceEnabled: true,
  autoPublishEnabled: true,
  produceMode: "agy_custom", // "agy_custom" | "pipeline"
  maxStock: 10,
  resumeBelowStock: 5,
  dailyPublishLimit: 1,
  utcOffsetHours: 7,
  publishWindowStartHourLocal: 15,
  primeHourLocal: 19,
  primeMinuteLocal: 0,
  enableHumanJitter: true,
  minLeadMinutes: 45,
  minElevenLabsChars: 1400,
  agyModel: "gemini-4-hydrogen-high",
  agyTimeoutMs: 18_000_000, // 5 hours max per episode (coding + 2-3h 1080p render)
});

export function defaultQueueState() {
  return {
    schemaVersion: "1.0.0",
    config: { ...DEFAULT_AUTOMATION_CONFIG },
    productionPausedByStock: false,
    topics: [],
    stock: [],
    publishedHistory: [],
    lastTickAt: null,
    lastError: null,
    updatedAt: new Date().toISOString(),
  };
}

export function loadQueueState(statePath) {
  if (!fs.existsSync(statePath)) {
    return defaultQueueState();
  }
  const raw = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const base = defaultQueueState();
  return {
    ...base,
    ...raw,
    config: { ...base.config, ...(raw.config || {}) },
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    stock: Array.isArray(raw.stock) ? raw.stock : [],
    publishedHistory: Array.isArray(raw.publishedHistory) ? raw.publishedHistory : [],
  };
}

export function saveQueueState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  state.updatedAt = new Date().toISOString();
  atomicWriteFile(statePath, JSON.stringify(state, null, 2));
}

export function sanitizeSlug(raw) {
  return (
    String(raw || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "episode_auto"
  );
}

export function getLocalDateParts(now = new Date(), utcOffsetHours = 7) {
  const local = new Date(now.getTime() + utcOffsetHours * 3600 * 1000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return {
    dateKey: `${year}-${month}-${day}`,
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
  };
}

export function isDuplicateTopicOrSlug(state, { slug, topic, rootDir = null }) {
  const normSlug = sanitizeSlug(slug);
  const normTopic = String(topic || "").trim().toLowerCase();

  const existing = [
    ...(state.topics || []),
    ...(state.stock || []),
    ...(state.publishedHistory || []),
  ];
  for (const item of existing) {
    if (normSlug && sanitizeSlug(item.slug) === normSlug) return true;
    if (normTopic && String(item.topic || "").trim().toLowerCase() === normTopic) return true;
  }

  if (rootDir) {
    for (const sub of ["src", "out"]) {
      const candidate = path.join(rootDir, sub, normSlug);
      if (fs.existsSync(candidate)) return true;
    }
  }
  return false;
}

export function enqueueTopic(state, { slug, topic, priority = 10, rootDir = null }) {
  const cleanTopic = String(topic || "").trim();
  if (!cleanTopic) {
    throw new Error("enqueueTopic requires non-empty topic.");
  }
  const cleanSlug = sanitizeSlug(slug || cleanTopic);
  if (isDuplicateTopicOrSlug(state, { slug: cleanSlug, topic: cleanTopic, rootDir })) {
    return { added: false, reason: "duplicate", slug: cleanSlug };
  }
  const entry = {
    id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    slug: cleanSlug,
    topic: cleanTopic,
    priority: Number(priority) || 10,
    status: "queued",
    createdAt: new Date().toISOString(),
    error: null,
  };
  state.topics.push(entry);
  return { added: true, item: entry };
}

export function pickNextQueuedTopic(state) {
  const queued = (state.topics || []).filter((t) => t.status === "queued");
  queued.sort((a, b) => (a.priority ?? 10) - (b.priority ?? 10));
  return queued[0] || null;
}

export function findPrimaryThumbnail(jobDir) {
  const abDir = path.join(jobDir, "thumbnails_ab");
  if (fs.existsSync(abDir)) {
    const abFiles = fs
      .readdirSync(abDir)
      .filter((f) => /\.(jpe?g|png)$/i.test(f))
      .sort();
    if (abFiles.length > 0) {
      return {
        primary: path.join(abDir, abFiles[0]),
        abThumbnails: abFiles.map((f) => path.join(abDir, f)),
      };
    }
  }
  for (const name of ["thumbnail_16x9.jpg", "thumbnail_9x16.jpg", "thumbnail.jpg"]) {
    const p = path.join(jobDir, name);
    if (fs.existsSync(p)) {
      return { primary: p, abThumbnails: [p] };
    }
  }
  return { primary: null, abThumbnails: [] };
}

export function findReadyVideoInDir(jobDir) {
  const files = fs
    .readdirSync(jobDir)
    .filter((f) => f.endsWith(".mp4") && !f.includes("Preview"))
    .map((f) => ({
      name: f,
      full: path.join(jobDir, f),
      size: fs.statSync(path.join(jobDir, f)).size,
    }))
    .filter((f) => f.size > 100_000)
    .sort((a, b) => b.size - a.size);
  return files[0]?.full || null;
}

export function registerStockItem(state, { slug, topic = "", jobDir, videoPath = null, socialPackPath = null, thumbnailPath = null }) {
  const absJobDir = path.resolve(jobDir);
  if (!fs.existsSync(absJobDir)) {
    throw new Error(`Job directory not found: ${absJobDir}`);
  }
  const resolvedVideo = videoPath ? path.resolve(videoPath) : findReadyVideoInDir(absJobDir);
  if (!resolvedVideo || !fs.existsSync(resolvedVideo)) {
    throw new Error(`Rendered MP4 not found in ${absJobDir}`);
  }
  const resolvedSocial = socialPackPath
    ? path.resolve(socialPackPath)
    : path.join(absJobDir, "social_pack.json");
  if (!fs.existsSync(resolvedSocial)) {
    throw new Error(`social_pack.json not found in ${absJobDir}`);
  }

  const socialPack = JSON.parse(fs.readFileSync(resolvedSocial, "utf8"));
  const title = String(socialPack?.youtube?.title || slug || "Kok Iso Yo? #Shorts");
  const thumbInfo = findPrimaryThumbnail(absJobDir);
  const resolvedThumb = thumbnailPath ? path.resolve(thumbnailPath) : thumbInfo.primary;

  const cleanSlug = sanitizeSlug(slug || path.basename(absJobDir));
  const already = (state.stock || []).find((s) => s.slug === cleanSlug || s.jobDir === absJobDir);
  if (already) {
    return { added: false, reason: "already_in_stock", item: already };
  }

  const item = {
    id: `stock_${cleanSlug}_${Date.now()}`,
    slug: cleanSlug,
    title,
    topic: topic || title,
    jobDir: absJobDir,
    videoPath: resolvedVideo,
    socialPackPath: resolvedSocial,
    thumbnailPath: resolvedThumb,
    abThumbnails: thumbInfo.abThumbnails,
    status: "ready",
    createdAt: new Date().toISOString(),
    publishedAt: null,
    publishResult: null,
    error: null,
  };
  state.stock.push(item);
  return { added: true, item };
}

export function shouldProduceMore(state) {
  const cfg = state.config || DEFAULT_AUTOMATION_CONFIG;
  if (!cfg.autoProduceEnabled) {
    return { produce: false, reason: "autoProduceEnabled=false" };
  }
  const readyCount = (state.stock || []).filter((s) => s.status === "ready").length;
  const maxStock = Number(cfg.maxStock ?? 10);
  const resumeBelow = Number(cfg.resumeBelowStock ?? 5);

  if (readyCount >= maxStock) {
    state.productionPausedByStock = true;
    return { produce: false, reason: `stock_full (${readyCount}/${maxStock})`, readyCount };
  }
  if (state.productionPausedByStock && readyCount >= resumeBelow) {
    return {
      produce: false,
      reason: `paused_until_below_${resumeBelow} (ready=${readyCount})`,
      readyCount,
    };
  }
  state.productionPausedByStock = false;
  return { produce: true, reason: `stock_needed (ready=${readyCount}/${maxStock})`, readyCount };
}

export function canPublishToday(state, now = new Date()) {
  const cfg = state.config || DEFAULT_AUTOMATION_CONFIG;
  if (!cfg.autoPublishEnabled) {
    return { publish: false, reason: "autoPublishEnabled=false" };
  }
  const readyItems = (state.stock || []).filter((s) => s.status === "ready");
  if (readyItems.length === 0) {
    return { publish: false, reason: "no_ready_stock" };
  }
  const local = getLocalDateParts(now, Number(cfg.utcOffsetHours ?? 7));
  if (local.hour < Number(cfg.publishWindowStartHourLocal ?? 15)) {
    return {
      publish: false,
      reason: `before_publish_window (localHour=${local.hour} < ${cfg.publishWindowStartHourLocal})`,
    };
  }

  const publishedToday = (state.publishedHistory || []).filter((h) => {
    if (!h.publishedAt) return false;
    const d = getLocalDateParts(new Date(h.publishedAt), Number(cfg.utcOffsetHours ?? 7));
    return d.dateKey === local.dateKey;
  }).length;

  const limit = Number(cfg.dailyPublishLimit ?? 1);
  if (publishedToday >= limit) {
    return {
      publish: false,
      reason: `daily_limit_reached (${publishedToday}/${limit} on ${local.dateKey})`,
    };
  }

  return { publish: true, nextItem: readyItems[0], dateKey: local.dateKey };
}

export function resolveConfiguredPlatforms(env = process.env) {
  const readiness = getPlatformReadiness(env);
  const platforms = [];
  if (readiness.youtube) platforms.push("youtube");
  if (readiness.facebook) platforms.push("facebook");
  if (readiness.instagram) platforms.push("instagram");
  return platforms.length > 0 ? platforms : ["youtube"];
}

export async function publishNextFromStock({
  statePath,
  env = process.env,
  dryRun = true,
  now = new Date(),
  fetchImpl = globalThis.fetch,
  force = false,
} = {}) {
  const state = loadQueueState(statePath);
  const cfg = state.config || DEFAULT_AUTOMATION_CONFIG;

  const check = force
    ? {
        publish: (state.stock || []).some((s) => s.status === "ready"),
        nextItem: (state.stock || []).find((s) => s.status === "ready") || null,
        reason: "forced",
      }
    : canPublishToday(state, now);

  if (!check.publish || !check.nextItem) {
    return { ok: true, skipped: true, reason: check.reason };
  }

  const item = check.nextItem;
  if (!fs.existsSync(item.videoPath)) {
    item.status = "failed";
    item.error = `Video file missing: ${item.videoPath}`;
    saveQueueState(statePath, state);
    return { ok: false, skipped: false, error: item.error, item };
  }

  const socialPack = fs.existsSync(item.socialPackPath)
    ? JSON.parse(fs.readFileSync(item.socialPackPath, "utf8"))
    : { youtube: { title: item.title, description: item.topic } };

  const title = socialPack?.youtube?.title || item.title;
  const seoFilename = slugifyVideoFilename(title);
  const seoVideoPath = path.join(item.jobDir, seoFilename);
  if (!dryRun && item.videoPath !== seoVideoPath) {
    fs.copyFileSync(item.videoPath, seoVideoPath);
  }

  const jitterMinutes =
    cfg.enableHumanJitter === false
      ? 0
      : Math.floor(((item.slug.length * 17 + now.getUTCDate() * 7) % 25) - 10); // -10..+14 min organic variance
  const rawMinute = Number(cfg.primeMinuteLocal ?? 0) + jitterMinutes;
  const adjHourOffset = Math.floor(rawMinute / 60);
  const finalMinute = ((rawMinute % 60) + 60) % 60;
  const finalHour = Math.min(23, Math.max(0, Number(cfg.primeHourLocal ?? 19) + adjHourOffset));

  const publishAt = computeNextPrimeTimeISO({
    now,
    utcOffsetHours: Number(cfg.utcOffsetHours ?? 7),
    primeHourLocal: finalHour,
    primeMinuteLocal: finalMinute,
    minLeadMinutes: Number(cfg.minLeadMinutes ?? 45),
  });

  const platforms = resolveConfiguredPlatforms(env);
  const needsInstagramHost =
    !dryRun && platforms.includes("instagram") && !env.IG_PUBLIC_VIDEO_BASE_URL;
  const staticVideoPublicUrl = env.IG_PUBLIC_VIDEO_BASE_URL
    ? `${env.IG_PUBLIC_VIDEO_BASE_URL.replace(/\/+$/, "")}/${encodeURIComponent(item.slug)}/${encodeURIComponent(seoFilename)}`
    : dryRun && platforms.includes("instagram")
      ? `https://ephemeral-cloudflared.trycloudflare.com/${encodeURIComponent(seoFilename)}`
      : undefined;

  if (!dryRun) {
    item.status = "publishing";
    saveQueueState(statePath, state);
  }

  try {
    const runPublish = async (resolvedPublicUrl) =>
      publishToPlatforms({
        platforms,
        videoPath: dryRun ? item.videoPath : seoVideoPath,
        thumbnailPath: item.thumbnailPath || undefined,
        videoPublicUrl: resolvedPublicUrl,
        socialPack,
        env,
        dryRun,
        fetchImpl,
        useYouTubeSop: true,
        unlistedFirst: true,
        waitForProcessing: true,
        publishAt,
        seoFilename,
      });

    const postResult = needsInstagramHost
      ? await withEphemeralCloudflareMedia(
          {
            filePath: seoVideoPath,
            publicFilename: seoFilename,
            cloudflaredBin: env.CLOUDFLARED_BIN || "cloudflared",
            fetchImpl,
          },
          (ephemeralUrl) => runPublish(ephemeralUrl)
        )
      : await runPublish(staticVideoPublicUrl);

    if (dryRun) {
      return {
        ok: postResult.ok,
        dryRun: true,
        skipped: false,
        slug: item.slug,
        seoFilename,
        publishAt,
        platforms,
        postResult,
      };
    }

    if (!postResult.ok) {
      item.status = "failed";
      item.error = JSON.stringify(postResult.results);
      saveQueueState(statePath, state);
      return { ok: false, dryRun: false, skipped: false, item, postResult };
    }

    const publishedAt = now.toISOString();
    item.status = "published";
    item.publishedAt = publishedAt;
    item.publishResult = postResult.results;
    item.error = null;

    state.publishedHistory.push({
      id: item.id,
      slug: item.slug,
      title,
      topic: item.topic,
      publishedAt,
      publishAt,
      youtubeUrl: postResult.results?.youtube?.url || null,
      platforms,
    });
    saveQueueState(statePath, state);

    const ytPublishFile = path.join(item.jobDir, "youtube_publish.json");
    atomicWriteFile(
      ytPublishFile,
      JSON.stringify(
        {
          ...(postResult.results?.youtube || {}),
          abThumbnails: item.abThumbnails || [],
        },
        null,
        2
      )
    );

    return {
      ok: true,
      dryRun: false,
      skipped: false,
      slug: item.slug,
      seoFilename,
      publishAt,
      postResult,
    };
  } catch (err) {
    if (!dryRun) {
      item.status = "failed";
      item.error = err?.message || String(err);
      saveQueueState(statePath, state);
    }
    throw err;
  }
}
