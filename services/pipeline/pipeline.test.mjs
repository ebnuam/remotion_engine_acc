/**
 * Offline unit tests for Kok Iso Yo? Automation Pipeline (`generate -> render -> post`).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runPipeline } from "./orchestrator.mjs";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kokisoyo-pipeline-test-"));
}

test("pipeline routes script_master to PREMIUM and post_copy to STANDARD, probes video, and builds YT/FB/IG payloads", async () => {
  const tmpDir = makeTempDir();
  const fakeVideo = path.join(tmpDir, "sample.mp4");
  fs.writeFileSync(fakeVideo, Buffer.from("fake-mp4-bytes"));

  const routerCalls = [];
  const fakeRouter = {
    async chatCompletion({ task }) {
      routerCalls.push(task);
      if (task === "script_master") {
        return {
          model: "gemini-4-neon-xhigh",
          content: JSON.stringify({
            title: "Kenapa Petir Zig-Zag?",
            hook: "Kok iso yo petir nggak pernah lurus?",
            narrationScript: "Petir mencari jalur hambatan listrik paling rendah di udara.",
            scenes: [
              {
                id: "scene_01",
                durationSec: 4,
                narration: "Kok iso yo petir nggak pernah lurus?",
                visualCue: "Awan kumulonimbus 3D gelap + kilat bercabang",
                cameraNote: "Tilt up dramatic",
              },
            ],
            factCheckNotes: ["Stepped leader mencari kantong ionisasi udara."],
          }),
          route: { tier: "premium", provider: "antigravity_cli", model: "gemini-4-neon-xhigh" },
          usage: { totalTokens: 450 },
        };
      }
      if (task === "post_copy") {
        return {
          model: "gemini-2.5-flash",
          content: JSON.stringify({
            youtube: {
              title: "Kenapa Petir Zig-Zag? #Shorts",
              description: "Penjelasan fisika petir dalam 60 detik!",
              tags: ["kokisoyo", "petir", "sains", "shorts"],
              categoryId: "27",
              privacyStatus: "private",
            },
            facebook: {
              title: "Kenapa Petir Zig-Zag?",
              description: "Ternyata ini alasan petir selalu berbelok! #KokIsoYo #Sains",
            },
            instagram: {
              caption: "Pernah mikir kenapa petir nggak pernah lurus?\n\n#KokIsoYo #Sains #Reels",
              firstComment: "Topik sains apa lagi yang bikin penasaran?",
            },
          }),
          route: { tier: "standard", provider: "agybridge", model: "gemini-2.5-flash" },
          usage: { totalTokens: 180 },
        };
      }
      throw new Error(`Unexpected task: ${task}`);
    },
  };

  const fakeExecFile = async (cmd) => {
    assert.equal(cmd, "ffprobe");
    return {
      stdout: JSON.stringify({
        format: { duration: "58.4", size: "12345678", bit_rate: "1691188" },
        streams: [
          { codec_type: "video", codec_name: "h264", width: 1080, height: 1920 },
          { codec_type: "audio", codec_name: "aac", sample_rate: "48000", channels: 2 },
        ],
      }),
      stderr: "",
    };
  };

  try {
    const res = await runPipeline({
      rootDir: tmpDir,
      slug: "ep006_petir",
      topic: "Kenapa petir selalu zig-zag?",
      existingVideoPath: fakeVideo,
      stages: ["generate", "render", "post"],
      platforms: ["youtube", "facebook", "instagram"],
      dryRunGenerate: false,
      dryRunRender: false,
      dryRunPost: true,
      router: fakeRouter,
      execFileImpl: fakeExecFile,
      env: {},
    });

    assert.equal(res.ok, true);
    assert.deepEqual(routerCalls, ["script_master", "post_copy"]);

    // Verify 2-route separation in manifest
    assert.equal(res.manifest.stages.generate.routes.script.tier, "premium");
    assert.equal(res.manifest.stages.generate.routes.social.tier, "standard");
    assert.equal(res.manifest.stages.generate.usage.totalTokens, 630);

    // Verify generated artifacts exist
    assert.ok(fs.existsSync(path.join(res.jobDir, "script_master.json")));
    assert.ok(fs.existsSync(path.join(res.jobDir, "script_master.md")));
    assert.ok(fs.existsSync(path.join(res.jobDir, "social_pack.json")));
    assert.ok(fs.existsSync(res.manifestPath));

    // Verify video probe metadata
    assert.equal(res.manifest.stages.render.probe.width, 1080);
    assert.equal(res.manifest.stages.render.probe.height, 1920);
    assert.equal(res.manifest.stages.render.probe.isVertical916, true);
    assert.equal(res.manifest.stages.render.probe.hasAudio, true);

    // Verify YT, FB, IG dry-run payloads built cleanly
    const postResults = res.manifest.stages.post.results;
    assert.equal(postResults.youtube.status, "dry_run");
    assert.equal(postResults.youtube.payload.snippet.title, "Kenapa Petir Zig-Zag? #Shorts");
    assert.equal(postResults.facebook.status, "dry_run");
    assert.equal(postResults.instagram.status, "dry_run");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("live post skips unconfigured platforms safely without crashing", async () => {
  const tmpDir = makeTempDir();
  const fakeVideo = path.join(tmpDir, "clip.mp4");
  fs.writeFileSync(fakeVideo, Buffer.from("mp4"));

  try {
    const res = await runPipeline({
      rootDir: tmpDir,
      slug: "ep_skip_test",
      topic: "Tes skip unconfigured",
      existingVideoPath: fakeVideo,
      stages: ["generate", "post"],
      platforms: ["youtube", "facebook", "instagram"],
      dryRunGenerate: true,
      dryRunPost: false,
      env: {}, // No YT/FB/IG tokens set
    });

    assert.equal(res.ok, true);
    assert.equal(res.manifest.stages.post.results.youtube.status, "skipped_unconfigured");
    assert.equal(res.manifest.stages.post.results.facebook.status, "skipped_unconfigured");
    assert.equal(res.manifest.stages.post.results.instagram.status, "skipped_unconfigured");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
