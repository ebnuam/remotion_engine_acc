/**
 * YouTube Shorts Publisher Adapter (YouTube Data API v3 — pure Node fetch, zero external deps).
 *
 * Required env vars for live upload:
 * - YT_CLIENT_ID
 * - YT_CLIENT_SECRET
 * - YT_REFRESH_TOKEN
 * Optional:
 * - YT_DEFAULT_PRIVACY (default: "private" for safety; set "public" or "unlisted" when ready)
 */

import fs from "node:fs";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YT_UPLOAD_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

export function isYouTubeConfigured(env = process.env) {
  return Boolean(env.YT_CLIENT_ID && env.YT_CLIENT_SECRET && env.YT_REFRESH_TOKEN);
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

export async function publishToYouTube({
  videoPath,
  socialPack,
  env = process.env,
  dryRun = true,
  fetchImpl = globalThis.fetch,
}) {
  const yt = socialPack?.youtube || {};
  const privacyStatus = String(
    yt.privacyStatus || env.YT_DEFAULT_PRIVACY || "private"
  ).toLowerCase();

  const metadata = {
    snippet: {
      title: String(yt.title || "Kok Iso Yo? #Shorts").slice(0, 100),
      description: String(yt.description || ""),
      tags: Array.isArray(yt.tags) ? yt.tags.slice(0, 20) : ["kokisoyo", "shorts"],
      categoryId: String(yt.categoryId || "27"),
      defaultLanguage: "id",
    },
    status: {
      privacyStatus,
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

  // Step 1: Initiate resumable upload session
  const initResp = await fetchImpl(YT_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(videoBuf.length),
      "X-Upload-Content-Type": "video/mp4",
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

  return {
    platform: "youtube",
    status: "published",
    videoId: uploaded.id,
    url: `https://youtube.com/shorts/${uploaded.id}`,
    privacyStatus,
  };
}
