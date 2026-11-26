/**
 * Meta Graph API Publisher Adapters (Facebook Reels + Instagram Reels).
 * Pure Node fetch, zero external deps.
 *
 * Required env vars:
 * - Facebook Reels: META_FB_PAGE_ID + META_FB_PAGE_ACCESS_TOKEN
 * - Instagram Reels: META_IG_USER_ID + META_IG_ACCESS_TOKEN (or META_FB_PAGE_ACCESS_TOKEN)
 *   Note: Instagram Graph API requires a publicly reachable HTTPS `videoPublicUrl`
 *   (e.g. served via Cloudflare R2 / Cloudflare Tunnel / public CDN).
 * Optional:
 * - META_GRAPH_VERSION (default: "v21.0")
 */

import fs from "node:fs";

function getGraphBase(env) {
  const version = String(env.META_GRAPH_VERSION || "v21.0").trim();
  return `https://graph.facebook.com/${version}`;
}

export function isFacebookConfigured(env = process.env) {
  return Boolean(env.META_FB_PAGE_ID && env.META_FB_PAGE_ACCESS_TOKEN);
}

export function isInstagramConfigured(env = process.env) {
  return Boolean(
    env.META_IG_USER_ID && (env.META_IG_ACCESS_TOKEN || env.META_FB_PAGE_ACCESS_TOKEN)
  );
}

export async function publishToFacebookReels({
  videoPath,
  socialPack,
  env = process.env,
  dryRun = true,
  fetchImpl = globalThis.fetch,
}) {
  const fb = socialPack?.facebook || {};
  const payload = {
    title: String(fb.title || "Kok Iso Yo?").slice(0, 120),
    description: String(fb.description || ""),
    videoState: String(env.META_FB_VIDEO_STATE || "PUBLISHED"),
  };

  if (dryRun) {
    return {
      platform: "facebook",
      status: "dry_run",
      configured: isFacebookConfigured(env),
      payload,
      videoPath,
    };
  }

  if (!isFacebookConfigured(env)) {
    return {
      platform: "facebook",
      status: "skipped_unconfigured",
      configured: false,
      reason: "Missing META_FB_PAGE_ID or META_FB_PAGE_ACCESS_TOKEN.",
    };
  }

  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error(`Facebook Reels video not found: ${videoPath}`);
  }

  const graphBase = getGraphBase(env);
  const pageId = env.META_FB_PAGE_ID;
  const token = env.META_FB_PAGE_ACCESS_TOKEN;

  // Step 1: Start Reels upload session
  const startResp = await fetchImpl(`${graphBase}/${pageId}/video_reels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_phase: "start",
      access_token: token,
    }),
  });
  const startData = await startResp.json();
  if (!startResp.ok || !startData.video_id || !startData.upload_url) {
    throw new Error(`Facebook Reels start session failed (HTTP ${startResp.status}).`);
  }

  // Step 2: Binary upload to rupload.facebook.com
  const videoBuf = fs.readFileSync(videoPath);
  const uploadResp = await fetchImpl(startData.upload_url, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${token}`,
      offset: "0",
      file_size: String(videoBuf.length),
      "Content-Type": "application/octet-stream",
    },
    body: videoBuf,
  });
  const uploadData = await uploadResp.json();
  if (!uploadResp.ok || uploadData.success === false) {
    throw new Error(`Facebook Reels binary upload failed (HTTP ${uploadResp.status}).`);
  }

  // Step 3: Finish & publish Reel
  const finishParams = new URLSearchParams({
    access_token: token,
    video_id: startData.video_id,
    upload_phase: "finish",
    video_state: payload.videoState,
    title: payload.title,
    description: payload.description,
  });
  const finishResp = await fetchImpl(
    `${graphBase}/${pageId}/video_reels?${finishParams.toString()}`,
    { method: "POST" }
  );
  const finishData = await finishResp.json();
  if (!finishResp.ok || finishData.success === false) {
    throw new Error(`Facebook Reels finish publish failed (HTTP ${finishResp.status}).`);
  }

  return {
    platform: "facebook",
    status: "published",
    videoId: startData.video_id,
    videoState: payload.videoState,
  };
}

export async function publishToInstagramReels({
  videoPath,
  videoPublicUrl = undefined,
  socialPack,
  env = process.env,
  dryRun = true,
  fetchImpl = globalThis.fetch,
  sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
  const ig = socialPack?.instagram || {};
  const payload = {
    media_type: "REELS",
    caption: String(ig.caption || "").slice(0, 2200),
    video_url: videoPublicUrl || null,
    share_to_feed: true,
    firstComment: String(ig.firstComment || ""),
  };

  if (dryRun) {
    return {
      platform: "instagram",
      status: "dry_run",
      configured: isInstagramConfigured(env),
      requiresPublicVideoUrl: !videoPublicUrl,
      payload,
      videoPath,
    };
  }

  if (!isInstagramConfigured(env)) {
    return {
      platform: "instagram",
      status: "skipped_unconfigured",
      configured: false,
      reason: "Missing META_IG_USER_ID or META_IG_ACCESS_TOKEN.",
    };
  }

  if (!videoPublicUrl) {
    return {
      platform: "instagram",
      status: "skipped_missing_public_url",
      configured: true,
      reason:
        "Instagram Graph API requires a publicly reachable HTTPS `videoPublicUrl` (e.g. Cloudflare R2 / Tunnel URL).",
    };
  }

  const graphBase = getGraphBase(env);
  const igUserId = env.META_IG_USER_ID;
  const token = env.META_IG_ACCESS_TOKEN || env.META_FB_PAGE_ACCESS_TOKEN;

  // Step 1: Create Reels media container
  const createResp = await fetchImpl(`${graphBase}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoPublicUrl,
      caption: payload.caption,
      share_to_feed: true,
      access_token: token,
    }),
  });
  const createData = await createResp.json();
  if (!createResp.ok || !createData.id) {
    throw new Error(`Instagram Reels container creation failed (HTTP ${createResp.status}).`);
  }

  const containerId = createData.id;

  // Step 2: Poll container processing status (max 15 polls)
  let containerReady = false;
  for (let i = 0; i < 15; i += 1) {
    const statusResp = await fetchImpl(
      `${graphBase}/${containerId}?fields=status_code&access_token=${encodeURIComponent(token)}`
    );
    const statusData = await statusResp.json();
    const code = String(statusData.status_code || "").toUpperCase();
    if (code === "FINISHED") {
      containerReady = true;
      break;
    }
    if (code === "ERROR" || code === "EXPIRED") {
      throw new Error(`Instagram Reels processing failed with status "${code}".`);
    }
    await sleepImpl(4_000);
  }

  if (!containerReady) {
    throw new Error("Instagram Reels container timed out waiting for FINISHED status.");
  }

  // Step 3: Publish container
  const pubResp = await fetchImpl(`${graphBase}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: token,
    }),
  });
  const pubData = await pubResp.json();
  if (!pubResp.ok || !pubData.id) {
    throw new Error(`Instagram Reels publish failed (HTTP ${pubResp.status}).`);
  }

  return {
    platform: "instagram",
    status: "published",
    mediaId: pubData.id,
    containerId,
  };
}
