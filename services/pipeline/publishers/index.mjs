/**
 * Unified Multi-Platform Social Publisher (YouTube Shorts, Facebook Reels, Instagram Reels).
 * Isolates each platform so a failure on one channel never aborts the others.
 */

import {
  computeNextPrimeTimeISO,
  publishToYouTube,
  isYouTubeConfigured,
  slugifyVideoFilename,
} from "./youtube.mjs";
import {
  publishToFacebookReels,
  publishToInstagramReels,
  isFacebookConfigured,
  isInstagramConfigured,
} from "./meta.mjs";

export const SUPPORTED_PLATFORMS = Object.freeze(["youtube", "facebook", "instagram"]);

export function getPlatformReadiness(env = process.env) {
  return {
    youtube: isYouTubeConfigured(env),
    facebook: isFacebookConfigured(env),
    instagram: isInstagramConfigured(env),
  };
}

export async function publishToPlatforms({
  platforms = SUPPORTED_PLATFORMS,
  videoPath,
  thumbnailPath = undefined,
  reelThumbnailPath = undefined,
  videoPublicUrl = undefined,
  coverPublicUrl = undefined,
  socialPack,
  env = process.env,
  dryRun = true,
  fetchImpl = globalThis.fetch,
  useYouTubeSop = false,
  unlistedFirst = undefined,
  waitForProcessing = undefined,
  publishAt = undefined,
  seoFilename = undefined,
  maxProcessingWaitMs = undefined,
  pollIntervalMs = undefined,
}) {
  const normalized = platforms
    .map((p) => String(p || "").trim().toLowerCase())
    .filter((p) => SUPPORTED_PLATFORMS.includes(p));

  const resolvedUnlistedFirst =
    typeof unlistedFirst === "boolean" ? unlistedFirst : Boolean(useYouTubeSop);
  const resolvedWaitForProcessing =
    typeof waitForProcessing === "boolean" ? waitForProcessing : Boolean(useYouTubeSop);
  const resolvedSeoFilename =
    seoFilename ||
    (useYouTubeSop && socialPack?.youtube?.title
      ? slugifyVideoFilename(socialPack.youtube.title)
      : undefined);
  const resolvedPublishAt =
    publishAt || (useYouTubeSop ? computeNextPrimeTimeISO() : undefined);

  const results = {};

  for (const platform of normalized) {
    try {
      if (platform === "youtube") {
        results.youtube = await publishToYouTube({
          videoPath,
          thumbnailPath,
          socialPack,
          env,
          dryRun,
          fetchImpl,
          unlistedFirst: resolvedUnlistedFirst,
          waitForProcessing: resolvedWaitForProcessing,
          publishAt: resolvedPublishAt,
          seoFilename: resolvedSeoFilename,
          ...(maxProcessingWaitMs !== undefined ? { maxProcessingWaitMs } : {}),
          ...(pollIntervalMs !== undefined ? { pollIntervalMs } : {}),
        });
      } else if (platform === "facebook") {
        results.facebook = await publishToFacebookReels({
          videoPath,
          thumbnailPath: reelThumbnailPath || thumbnailPath,
          socialPack,
          env,
          dryRun,
          fetchImpl,
        });
      } else if (platform === "instagram") {
        results.instagram = await publishToInstagramReels({
          videoPath,
          videoPublicUrl,
          coverUrl: coverPublicUrl,
          socialPack,
          env,
          dryRun,
          fetchImpl,
        });
      }
    } catch (err) {
      results[platform] = {
        platform,
        status: "failed",
        error: err?.message || String(err),
      };
    }
  }

  const failedCount = Object.values(results).filter((r) => r.status === "failed").length;
  return {
    ok: failedCount === 0,
    dryRun,
    platforms: normalized,
    results,
  };
}
