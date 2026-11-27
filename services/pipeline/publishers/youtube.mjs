/**
 * YouTube Shorts Publisher Adapter (YouTube Data API v3 — pure Node fetch, zero external deps).
 *
 * Supports the 5-Step YouTube Growth SOP:
 * 1. Keyword-driven video filename (`Slug` header + SEO filename)
 * 2. Upload as `"unlisted"` first (never direct public before HD processing & metadata indexing)
 * 3. Full keyword-driven title, 2-3 sentence SEO description, tags, and category
 * 4. Custom thumbnail upload (Version A via API; Versions B & C generated for Studio Test & Compare)
 * 5. Poll HD processing (`processingStatus === "succeeded"`) -> schedule at target Prime Time (`publishAt`)
 *
 * Required env vars for live upload:
 * - YT_CLIENT_ID
 * - YT_CLIENT_SECRET
 * - YT_REFRESH_TOKEN
 * Optional:
 * - YT_DEFAULT_PRIVACY (default: "private" for safety; set "public" or "unlisted" when ready)
 */

import fs from "node:fs";
import path from "node:path";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YT_UPLOAD_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const YT_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";
const YT_THUMB_URL =
  "https://www.googleapis.com/upload/youtube/v3/thumbnails/set?uploadType=media&videoId=";

export function isYouTubeConfigured(env = process.env) {
  return Boolean(env.YT_CLIENT_ID && env.YT_CLIENT_SECRET && env.YT_REFRESH_TOKEN);
}

/** Convert a YouTube title into a clean SEO keyword-driven .mp4 filename slug. */
export function slugifyVideoFilename(title, fallback = "video-edukasi-shorts") {
  const clean = String(title || "")
    .replace(/#\w+/g, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${clean || fallback}.mp4`;
}

/**
 * Compute next target Prime Time ISO-8601 timestamp (default: 19:00 WIB = UTC+7, Indonesia prime time).
 * Guarantees at least `minLeadMinutes` buffer after upload for HD processing & optional Studio A/B setup.
 */
export function computeNextPrimeTimeISO({
  now = new Date(),
  utcOffsetHours = 7,
  primeHourLocal = 19,
  primeMinuteLocal = 0,
  minLeadMinutes = 45,
} = {}) {
  const offsetMs = utcOffsetHours * 3600 * 1000;
  const localNow = new Date(now.getTime() + offsetMs);
  const candidate = new Date(
    Date.UTC(
      localNow.getUTCFullYear(),
      localNow.getUTCMonth(),
      localNow.getUTCDate(),
      primeHourLocal,
      primeMinuteLocal,
      0,
      0
    ) - offsetMs
  );

  const minAllowedMs = now.getTime() + minLeadMinutes * 60 * 1000;
  if (candidate.getTime() < minAllowedMs) {
    candidate.setTime(candidate.getTime() + 24 * 3600 * 1000);
  }
  return candidate.toISOString();
}

async function exchangeRefreshToken({ clientId, clientSecret, refreshToken, fetchImpl }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const resp = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await resp.json();
  if (!resp.ok || !data.access_token) {
    throw new Error(`YouTube OAuth token refresh failed (HTTP ${resp.status}).`);
  }
  return data.access_token;
}

async function waitForYouTubeProcessing({
  videoId,
  accessToken,
  fetchImpl,
  maxWaitMs = 300000,
  pollIntervalMs = 15000,
}) {
  const deadline = Date.now() + maxWaitMs;
  let lastStatus = "unknown";
  while (Date.now() < deadline) {
    const resp = await fetchImpl(
      `${YT_VIDEOS_URL}?part=processingDetails,status&id=${encodeURIComponent(videoId)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (resp.ok) {
      const data = await resp.json();
      const item = data?.items?.[0];
      lastStatus = item?.processingDetails?.processingStatus || item?.status?.uploadStatus || "unknown";
      if (lastStatus === "succeeded" || lastStatus === "failed" || lastStatus === "terminated") {
        return { processingStatus: lastStatus, uploadStatus: item?.status?.uploadStatus || null };
      }
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  return { processingStatus: lastStatus, timedOut: true };
}

export async function publishToYouTube({
  videoPath,
  thumbnailPath = undefined,
  socialPack,
  env = process.env,
  dryRun = true,
  fetchImpl = globalThis.fetch,
  unlistedFirst = false,
  waitForProcessing = false,
  publishAt = undefined,
  seoFilename = undefined,
  maxProcessingWaitMs = 300000,
  pollIntervalMs = 15000,
}) {
  const yt = socialPack?.youtube || {};
  const finalPrivacy = String(
    yt.privacyStatus || env.YT_DEFAULT_PRIVACY || "private"
  ).toLowerCase();
  const scheduledAt = publishAt || yt.publishAt || undefined;

  // Step 2 SOP: when unlistedFirst or scheduling is active, upload as "unlisted" first
  const initialPrivacy = unlistedFirst || scheduledAt ? "unlisted" : finalPrivacy;
  const uploadSlug = seoFilename || yt.seoFilename || path.basename(videoPath || "video.mp4");

  const metadata = {
    snippet: {
      title: String(yt.title || "Kok Iso Yo? #Shorts").slice(0, 100),
      description: String(yt.description || ""),
      tags: Array.isArray(yt.tags) ? yt.tags.slice(0, 20) : ["kokisoyo", "shorts"],
      categoryId: String(yt.categoryId || "27"),
      defaultLanguage: "id",
    },
    status: {
      privacyStatus: initialPrivacy,
      selfDeclaredMadeForKids: false,
    },
  };

  if (dryRun) {
    return {
      platform: "youtube",
      status: "dry_run",
      configured: isYouTubeConfigured(env),
      payload: metadata,
      videoPath,
      uploadSlug,
      ...(scheduledAt ? { plannedPublishAt: scheduledAt } : {}),
    };
  }

  if (!isYouTubeConfigured(env)) {
    return {
      platform: "youtube",
      status: "skipped_unconfigured",
      configured: false,
      reason: "Missing YT_CLIENT_ID, YT_CLIENT_SECRET, or YT_REFRESH_TOKEN.",
    };
  }

  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error(`YouTube upload video not found: ${videoPath}`);
  }

  const accessToken = await exchangeRefreshToken({
    clientId: env.YT_CLIENT_ID,
    clientSecret: env.YT_CLIENT_SECRET,
    refreshToken: env.YT_REFRESH_TOKEN,
    fetchImpl,
  });

  const videoBuf = fs.readFileSync(videoPath);

  // Step 1: Initiate resumable upload session (with SEO Slug filename header)
  const initResp = await fetchImpl(YT_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(videoBuf.length),
      "X-Upload-Content-Type": "video/mp4",
      Slug: uploadSlug,
    },
    body: JSON.stringify(metadata),
  });

  const uploadUrl = initResp.headers?.get?.("location");
  if (!initResp.ok || !uploadUrl) {
    throw new Error(`YouTube resumable upload init failed (HTTP ${initResp.status}).`);
  }

  // Step 2: Upload MP4 bytes
  const uploadResp = await fetchImpl(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(videoBuf.length),
      "Content-Type": "video/mp4",
    },
    body: videoBuf,
  });

  const uploaded = await uploadResp.json();
  if (!uploadResp.ok || !uploaded.id) {
    throw new Error(`YouTube video upload failed (HTTP ${uploadResp.status}).`);
  }

  // Step 3 (Optional): Upload custom thumbnail (Version A) while still Unlisted
  let thumbnailStatus = "not_provided";
  let thumbnailWarning = null;
  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    const thumbBuf = fs.readFileSync(thumbnailPath);
    const mime = thumbnailPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    try {
      const thumbResp = await fetchImpl(`${YT_THUMB_URL}${encodeURIComponent(uploaded.id)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": mime,
          "Content-Length": String(thumbBuf.length),
        },
        body: thumbBuf,
      });
      if (thumbResp.ok) {
        thumbnailStatus = "uploaded";
      } else {
        thumbnailStatus = "skipped_api_error";
        thumbnailWarning = `Thumbnail upload returned HTTP ${thumbResp.status} (pastikan channel sudah verifikasi custom thumbnail).`;
      }
    } catch (err) {
      thumbnailStatus = "skipped_network_error";
      thumbnailWarning = err?.message || String(err);
    }
  }

  // Step 4 (Optional): Wait for HD processing to succeed before transitioning privacy/schedule
  let processingResult = null;
  if (waitForProcessing || scheduledAt) {
    processingResult = await waitForYouTubeProcessing({
      videoId: uploaded.id,
      accessToken,
      fetchImpl,
      maxWaitMs: maxProcessingWaitMs,
      pollIntervalMs,
    });
  }

  // Step 5 (Optional): Schedule at Prime Time (`private` + `publishAt`) or transition to finalPrivacy
  let resultingPrivacy = initialPrivacy;
  let scheduleStatus = "not_requested";
  let appliedPublishAt = null;
  if (scheduledAt) {
    const schedResp = await fetchImpl(`${YT_VIDEOS_URL}?part=status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        id: uploaded.id,
        status: {
          privacyStatus: "private",
          publishAt: scheduledAt,
          selfDeclaredMadeForKids: false,
        },
      }),
    });
    if (schedResp.ok) {
      resultingPrivacy = "scheduled";
      scheduleStatus = "scheduled";
      appliedPublishAt = scheduledAt;
    } else {
      scheduleStatus = `schedule_failed_http_${schedResp.status}`;
    }
  } else if (unlistedFirst && finalPrivacy !== initialPrivacy) {
    const pubResp = await fetchImpl(`${YT_VIDEOS_URL}?part=status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        id: uploaded.id,
        status: {
          privacyStatus: finalPrivacy,
          selfDeclaredMadeForKids: false,
        },
      }),
    });
    if (pubResp.ok) {
      resultingPrivacy = finalPrivacy;
    }
  }

  return {
    platform: "youtube",
    status: "published",
    videoId: uploaded.id,
    url: `https://youtube.com/shorts/${uploaded.id}`,
    studioUrl: `https://studio.youtube.com/video/${uploaded.id}/edit`,
    uploadSlug,
    initialPrivacy,
    privacyStatus: resultingPrivacy,
    ...(appliedPublishAt ? { publishAt: appliedPublishAt } : {}),
    ...(scheduleStatus !== "not_requested" ? { scheduleStatus } : {}),
    ...(processingResult ? { processing: processingResult } : {}),
    thumbnailStatus,
    ...(thumbnailWarning ? { thumbnailWarning } : {}),
  };
}
