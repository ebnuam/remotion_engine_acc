/**
 * Unified Multi-Platform Social Publisher (YouTube Shorts, Facebook Reels, Instagram Reels).
 * Isolates each platform so a failure on one channel never aborts the others.
 */

import { publishToYouTube, isYouTubeConfigured } from "./youtube.mjs";
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
  videoPublicUrl = undefined,
  socialPack,
  env = process.env,
  dryRun = true,
  fetchImpl = globalThis.fetch,
}) {
  const normalized = platforms
    .map((p) => String(p || "").trim().toLowerCase())
    .filter((p) => SUPPORTED_PLATFORMS.includes(p));

  const results = {};

  for (const platform of normalized) {
    try {
      if (platform === "youtube") {
        results.youtube = await publishToYouTube({
          videoPath,
          socialPack,
          env,
          dryRun,
          fetchImpl,
        });
      } else if (platform === "facebook") {
        results.facebook = await publishToFacebookReels({
          videoPath,
          socialPack,
          env,
          dryRun,
          fetchImpl,
        });
      } else if (platform === "instagram") {
        results.instagram = await publishToInstagramReels({
          videoPath,
          videoPublicUrl,
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
