import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  canPublishToday,
  enqueueTopic,
  loadQueueState,
  publishNextFromStock,
  registerStockItem,
  resolveConfiguredPlatforms,
  saveQueueState,
  shouldProduceMore,
} from "./stockQueue.mjs";
import { startLocalMediaServer } from "./ephemeralMediaHost.mjs";
import { produceNextEpisode } from "./productionWorker.mjs";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kokisoyo-auto-test-"));
}

test("enqueueTopic deduplicates against topics, stock, history, and disk directories", () => {
  const tmpDir = makeTempDir();
  try {
    fs.mkdirSync(path.join(tmpDir, "out", "ep003_jembatan_laut"), { recursive: true });
    const state = loadQueueState(path.join(tmpDir, "queue_state.json"));

    const r1 = enqueueTopic(state, {
      slug: "ep004_kapal_selam",
      topic: "Kenapa kapal selam nggak penyok di dasar laut?",
      rootDir: tmpDir,
    });
    assert.equal(r1.added, true);

    const rDupTopic = enqueueTopic(state, {
      slug: "ep004_kapal_selam_2",
      topic: "Kenapa kapal selam nggak penyok di dasar laut?",
      rootDir: tmpDir,
    });
    assert.equal(rDupTopic.added, false);

    const rDupDisk = enqueueTopic(state, {
      slug: "ep003_jembatan_laut",
      topic: "Cara bangun jembatan laut",
      rootDir: tmpDir,
    });
    assert.equal(rDupDisk.added, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("shouldProduceMore enforces maxStock pause and resumeBelowStock hysteresis", () => {
  const state = loadQueueState("/tmp/nonexistent-kokisoyo-state.json");
  state.config.maxStock = 3;
  state.config.resumeBelowStock = 2;

  assert.equal(shouldProduceMore(state).produce, true);

  state.stock = [
    { slug: "a", status: "ready" },
    { slug: "b", status: "ready" },
    { slug: "c", status: "ready" },
  ];
  const full = shouldProduceMore(state);
  assert.equal(full.produce, false);
  assert.equal(state.productionPausedByStock, true);

  // Dropping from 3 -> 2 stays paused until < resumeBelowStock (2)
  state.stock[0].status = "published";
  const stillPaused = shouldProduceMore(state);
  assert.equal(stillPaused.produce, false);

  // Dropping to 1 resumes production
  state.stock[1].status = "published";
  const resumed = shouldProduceMore(state);
  assert.equal(resumed.produce, true);
  assert.equal(state.productionPausedByStock, false);
});

test("canPublishToday enforces WIB upload window and dailyPublishLimit", () => {
  const state = loadQueueState("/tmp/nonexistent-kokisoyo-state.json");
  state.stock = [{ slug: "ep1", status: "ready" }];

  // 10:00 WIB = 03:00 UTC (before 15:00 WIB window)
  const morning = canPublishToday(state, new Date("2026-11-27T03:00:00Z"));
  assert.equal(morning.publish, false);
  assert.match(morning.reason, /before_publish_window/);

  // 16:00 WIB = 09:00 UTC (inside window)
  const afternoon = canPublishToday(state, new Date("2026-11-27T09:00:00Z"));
  assert.equal(afternoon.publish, true);

  // After publishing 1 today, blocks second publish on same WIB day
  state.publishedHistory.push({ slug: "ep0", publishedAt: "2026-11-27T08:30:00Z" });
  const capped = canPublishToday(state, new Date("2026-11-27T09:00:00Z"));
  assert.equal(capped.publish, false);
  assert.match(capped.reason, /daily_limit_reached/);
});

test("publishNextFromStock executes 5-Step YouTube SOP and persists history", async () => {
  const tmpDir = makeTempDir();
  try {
    const jobDir = path.join(tmpDir, "out", "ep_test");
    const abDir = path.join(jobDir, "thumbnails_ab");
    fs.mkdirSync(abDir, { recursive: true });
    const mp4Path = path.join(jobDir, "RawVideo_1080p.mp4");
    fs.writeFileSync(mp4Path, Buffer.alloc(120_000, 1));
    fs.writeFileSync(path.join(abDir, "thumb_A_main.jpg"), Buffer.from("JPG_BYTES"));
    fs.writeFileSync(
      path.join(jobDir, "social_pack.json"),
      JSON.stringify({
        youtube: {
          title: "Rahasia Kapal Selam Anti Penyok! #Shorts",
          description: "Penjelasan singkat kenapa kapal selam kuat.",
          tags: ["kapal selam", "shorts"],
        },
      })
    );

    const statePath = path.join(tmpDir, "queue_state.json");
    const state = loadQueueState(statePath);
    const reg = registerStockItem(state, { slug: "ep_test", jobDir });
    assert.equal(reg.added, true);
    saveQueueState(statePath, state);

    const requests = [];
    const fakeFetch = async (url, init = {}) => {
      requests.push({ url, method: init.method || "GET", headers: init.headers || {}, body: init.body });
      if (url.includes("oauth2.googleapis.com/token")) {
        return { ok: true, status: 200, json: async () => ({ access_token: "ya29.fake" }) };
      }
      if (url.includes("/upload/youtube/v3/videos") && init.method === "POST") {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ location: "https://upload.example.com/session1" }),
        };
      }
      if (url === "https://upload.example.com/session1") {
        return { ok: true, status: 200, json: async () => ({ id: "ytVid123" }) };
      }
      if (url.includes("/thumbnails/set")) {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      if (url.includes("/youtube/v3/videos?part=processingDetails")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [{ processingDetails: { processingStatus: "succeeded" }, status: { uploadStatus: "processed" } }],
          }),
        };
      }
      if (url.includes("/youtube/v3/videos?part=status") && init.method === "PUT") {
        return { ok: true, status: 200, json: async () => ({ id: "ytVid123" }) };
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    const res = await publishNextFromStock({
      statePath,
      env: {
        YT_CLIENT_ID: "cid",
        YT_CLIENT_SECRET: "csec",
        YT_REFRESH_TOKEN: "cref",
      },
      dryRun: false,
      now: new Date("2026-11-27T09:00:00Z"), // 16:00 WIB -> schedules 19:00 WIB (12:00Z)
      fetchImpl: fakeFetch,
    });

    assert.equal(res.ok, true);
    assert.equal(res.skipped, false);
    assert.equal(res.seoFilename, "rahasia-kapal-selam-anti-penyok.mp4");
    assert.equal(res.publishAt, "2026-11-27T12:00:00.000Z");

    const initCall = requests.find((r) => r.url.includes("/upload/youtube/v3/videos"));
    assert.equal(initCall.headers.Slug, "rahasia-kapal-selam-anti-penyok.mp4");
    assert.equal(JSON.parse(initCall.body).status.privacyStatus, "unlisted");

    const schedCall = requests.find((r) => r.url.includes("part=status"));
    assert.equal(JSON.parse(schedCall.body).status.publishAt, "2026-11-27T12:00:00.000Z");

    const updated = loadQueueState(statePath);
    assert.equal(updated.stock[0].status, "published");
    assert.equal(updated.publishedHistory.length, 1);
    assert.ok(fs.existsSync(path.join(jobDir, "youtube_publish.json")));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("produceNextEpisode safely skips when another Remotion render process is active", async () => {
  const tmpDir = makeTempDir();
  try {
    const statePath = path.join(tmpDir, "queue_state.json");
    const res = await produceNextEpisode({
      rootDir: tmpDir,
      statePath,
      dryRun: false,
      execFileImpl: async () => ({
        stdout: "613077 node remotion render src/ep003_jembatan_laut/index.ts JembatanLautShort",
      }),
    });
    assert.equal(res.ok, true);
    assert.equal(res.skipped, true);
    assert.equal(res.reason, "active_render_in_progress");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("startLocalMediaServer serves exact token path with Range support and rejects unknown paths", async () => {
  const tmpDir = makeTempDir();
  const mp4 = path.join(tmpDir, "clip.mp4");
  fs.writeFileSync(mp4, Buffer.from("0123456789ABCDEF"));
  const srv = await startLocalMediaServer({ filePath: mp4, publicFilename: "seo-clip.mp4" });
  try {
    const okResp = await fetch(srv.localUrl);
    assert.equal(okResp.status, 200);
    assert.equal(await okResp.text(), "0123456789ABCDEF");

    const rangeResp = await fetch(srv.localUrl, { headers: { Range: "bytes=2-5" } });
    assert.equal(rangeResp.status, 206);
    assert.equal(await rangeResp.text(), "2345");

    const badResp = await fetch(`http://127.0.0.1:${srv.port}/wrong/path.mp4`);
    assert.equal(badResp.status, 404);

    const platforms = resolveConfiguredPlatforms({
      YT_CLIENT_ID: "a",
      YT_CLIENT_SECRET: "b",
      YT_REFRESH_TOKEN: "c",
      META_IG_USER_ID: "17841475872516514",
      META_IG_ACCESS_TOKEN: "tok",
    });
    assert.deepEqual(platforms, ["youtube", "instagram"]);
  } finally {
    await srv.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
