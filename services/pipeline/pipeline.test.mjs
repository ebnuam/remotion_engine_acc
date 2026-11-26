/**
 * Offline unit tests for Kok Iso Yo? Automation Pipeline (`generate -> render -> post`)
 * and Editorial Validator (RULES.md + docs/VISUAL_STYLE_GUIDE.md).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runPipeline } from "./orchestrator.mjs";
import {
  DEFAULT_VISUAL_STYLE,
  estimateNarrationDurationSec,
  normalizeSocialPack,
  validateEditorialPackage,
  validateSocialPack,
} from "./generateStage.mjs";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kokisoyo-pipeline-test-"));
}

function makeValidEditorialScript() {
  const scenes = [
    {
      id: "scene_01",
      beat: "opening",
      durationSec: 2,
      narration: "Ban pesawat kok nggak meledak?",
      visualCue: "Low-angle landasan pacu 3D, roda pesawat raksasa turun menyentuh aspal dengan asap.",
      cameraAngle: "low_angle",
      cameraNote: "Dolly-in cepat",
      lightMode: "day",
      onScreenLabel: null,
    },
    {
      id: "scene_02",
      beat: "opening",
      durationSec: 3,
      narration: "Padahal bobotnya ratusan ton saat mendarat!",
      visualCue: "Wide pesawat besar di landasan, karakter Koko kaget sambil melongo.",
      cameraAngle: "wide",
      cameraNote: "Crane-up ringan",
      lightMode: "day",
      onScreenLabel: "250 KM/JAM",
    },
    ...Array.from({ length: 14 }, (_, idx) => {
      const n = idx + 3;
      const angles = ["medium", "close_up", "top_down", "high_angle", "extreme_close_up"];
      const lightMode = n <= 8 ? "day" : n <= 13 ? "golden" : "night";
      return {
        id: `scene_${String(n).padStart(2, "0")}`,
        beat: "development",
        durationSec: 3.5,
        narration: `Lapisan nilon tahan beban tahap ${n}.`,
        visualCue: `Cutaway ban 3D cel-shaded tahap ${n} dengan panah gaya dan kilau kuning.`,
        cameraAngle: angles[idx % angles.length],
        cameraNote: "Push-in 0.25%/f",
        lightMode,
        onScreenLabel: n === 6 ? "GAS NITROGEN" : n === 10 ? "6X TEKANAN BAN" : null,
      };
    }),
    {
      id: "scene_17",
      beat: "resolution",
      durationSec: 3.5,
      narration: "Jadi kombinasi nilon dan nitrogen menjaga pendaratan aman.",
      visualCue: "Pesawat meluncur mulus di landasan malam, karakter Koko mengangguk puas.",
      cameraAngle: "aerial",
      cameraNote: "Pull-back stabil",
      lightMode: "night",
      onScreenLabel: "AMAN & TAHAN PANAS",
    },
    {
      id: "scene_18",
      beat: "resolution",
      durationSec: 3,
      narration: "Sekarang kamu tahu rahasia roda pesawat!",
      visualCue: "Koko & Budi melambai di pinggir landasan dengan badge penutup Kok Iso Yo?.",
      cameraAngle: "medium",
      cameraNote: "Micro-drift halus",
      lightMode: "golden",
      onScreenLabel: "KOK ISO YO?",
    },
  ];

  return {
    title: "Kenapa Ban Pesawat Nggak Meledak Saat Mendarat?",
    hook: "Ban pesawat kok nggak meledak?",
    storyArc: {
      opening: "Kontradiksi bobot ratusan ton vs ban karet kecil saat mendarat cepat.",
      development: "Lapisan nilon khusus, alur lurus anti-slip, tekanan 6x ban mobil, dan isi gas nitrogen.",
      resolution: "Kesimpulan utuh kenapa kombinasi struktur + nitrogen membuat ban tahan benturan.",
    },
    narrationScript: scenes.map((s) => s.narration).join(" "),
    scenes,
    factCheckNotes: [
      "Ban pesawat komersial diisi gas nitrogen murni untuk mencegah oksidasi dan kebakaran.",
      "Tekanan ban pesawat sekitar 200 psi atau ~6x tekanan ban mobil biasa.",
      "Alur ban pesawat berbentuk garis lurus memanjang untuk membuang air dan menahan gesekan.",
    ],
  };
}

test("estimateNarrationDurationSec handles varied Indonesian texts: numbers, ranges, acronyms, units, foreign terms, and punctuation", () => {
  const simple = estimateNarrationDurationSec("Air laut itu asin sekali");
  const numbersUnits = estimateNarrationDurationSec(
    "Tekanannya ~200 psi, kecepatan 250-280 km/jam, suhu 177-200 °C, bisa 200+ kali mendarat!"
  );
  const acronymsForeign = estimateNarrationDurationSec(
    "Aturan FAA 14 CFR 25.733 wajibkan N2 murni, bukan O2. Ada oleo strut, fusible plug, dan retread."
  );
  const heavyPunct = estimateNarrationDurationSec(
    "Tunggu dulu! Benarkah? Ya—ternyata, bukan sulap; ini fisika... Keren, kan?"
  );

  // Ensure prefixes (~, +), ranges (177-200), °C, and units (psi, km/jam) are NOT dropped as 0 syllables
  assert.ok(numbersUnits.syllableCount >= 48, `Expected >=48 syllables for numbers/units, got ${numbersUnits.syllableCount}`);
  assert.ok(numbersUnits.estimatedSec >= 9.5, `Expected >=9.5s for numbers/units, got ${numbersUnits.estimatedSec}`);

  // Ensure acronyms (FAA, CFR, N2, O2) & decimal codes (25.733) are properly expanded without adding false sentence pauses for decimal dot
  assert.ok(acronymsForeign.syllableCount >= 44, `Expected >=44 syllables for acronyms/foreign, got ${acronymsForeign.syllableCount}`);
  assert.ok(acronymsForeign.pauseSec < 1.2, `Decimal dot in 25.733 must not count as a sentence pause (got ${acronymsForeign.pauseSec}s)`);

  // Ensure punctuation/ellipsis pauses significantly add duration
  assert.ok(heavyPunct.pauseSec >= 1.5, `Expected >=1.5s punctuation pauses, got ${heavyPunct.pauseSec}`);
  assert.ok(heavyPunct.estimatedSec > simple.estimatedSec * 3);
  assert.equal(simple.isHeuristic, true);
});

test("validateEditorialPackage strictly rejects hooks exceeding 2.0s (e.g. 2.29s) or Scene 1 > 2.0s", () => {
  const base = makeValidEditorialScript();

  // Case 1: Hook estimating > 2.0s ("Hantam aspal keras, kok nggak meledak?" -> ~2.29s) MUST FAIL
  const longHookScript = {
    ...base,
    hook: "Hantam aspal keras, kok nggak meledak?",
  };
  const longHookRes = validateEditorialPackage(longHookScript);
  assert.equal(longHookRes.passed, false);
  assert.ok(longHookRes.metrics.hookEstimate.estimatedSec > 2.0);
  assert.ok(
    longHookRes.errors.some((e) => /Hook terlalu panjang/i.test(e) && /2s/i.test(e)),
    `Expected strict 2.0s hook error, got: ${longHookRes.errors.join(" | ")}`
  );

  // Case 2: Scene 1 duration > 2.0s (e.g. 2.5s) MUST FAIL even if hook text is short
  const slowScene1Script = {
    ...base,
    scenes: base.scenes.map((s, idx) => (idx === 0 ? { ...s, durationSec: 2.5 } : s)),
  };
  const slowScene1Res = validateEditorialPackage(slowScene1Script);
  assert.equal(slowScene1Res.passed, false);
  assert.ok(
    slowScene1Res.errors.some((e) => /scene pembuka\/hook/i.test(e)),
    `Expected Scene 1 > 2s error, got: ${slowScene1Res.errors.join(" | ")}`
  );
});

test("validateEditorialPackage rejects narration overflowing total scene duration (e.g. 61s narration in 58s timeline)", () => {
  const base = makeValidEditorialScript();
  // Trim scene durations slightly so totalSceneDurationSec (~54s) is shorter than narrationEstimate
  const overflowScript = {
    ...base,
    scenes: base.scenes.map((s, idx) => (idx === 0 ? s : { ...s, durationSec: 3 })),
    narrationScript: `${base.narrationScript} Tambahan kalimat ekstra panjang tentang mekanisme suspensi hidrolik dan keamanan landasan pacu.`,
  };
  const res = validateEditorialPackage(overflowScript);
  assert.equal(res.passed, false);
  assert.ok(res.metrics.timelineMarginSec < 0, `Expected negative margin, got ${res.metrics.timelineMarginSec}`);
  assert.ok(
    res.errors.some((e) => /Overflow durasi/i.test(e)),
    `Expected duration overflow error, got: ${res.errors.join(" | ")}`
  );
});

test("validateEditorialPackage passes a compliant 50-65s 2.5D-in-3D Shorts script", () => {
  const script = makeValidEditorialScript();
  const res = validateEditorialPackage(script);
  assert.equal(res.passed, true, `Expected pass, got errors: ${res.errors.join(" | ")}`);
  assert.ok(res.metrics.totalSceneDurationSec >= 50 && res.metrics.totalSceneDurationSec <= 65);
  assert.deepEqual(res.metrics.beatsCovered.sort(), ["development", "opening", "resolution"]);
  assert.ok(res.metrics.cameraVariety.length >= 5);
});

test("validateEditorialPackage rejects academic titles, subtitle-like labels, missing arc/camera/light, and bad duration", () => {
  const bad = {
    title: "Analisis Mekanisme Fisika Terhadap Elastisitas Ban Pesawat Komersial Modern",
    hook: "Halo teman-teman selamat datang di video kali ini kita akan membahas secara mendalam tentang ban pesawat!",
    storyArc: { opening: "Ada ban", development: "", resolution: "" },
    narrationScript: "Cerita pendek banget dan bersambung ke bagian 2.",
    scenes: [
      {
        id: "scene_01",
        beat: "development",
        durationSec: 10,
        narration: "Ban pesawat diisi gas nitrogen supaya tidak mudah terbakar saat panas.",
        visualCue: "Ban pesawat",
        cameraAngle: "invalid_angle",
        lightMode: "neon_disco",
        onScreenLabel: "Ban pesawat diisi gas nitrogen supaya tidak mudah terbakar",
      },
    ],
    factCheckNotes: ["Cuma satu"],
  };

  const res = validateEditorialPackage(bad);
  assert.equal(res.passed, false);
  const joined = res.errors.join("\n");
  assert.match(joined, /akademis/i);
  assert.match(joined, /klise/i);
  assert.match(joined, /cliffhanger/i);
  assert.match(joined, /storyArc/i);
  assert.match(joined, /cameraAngle/i);
  assert.match(joined, /lightMode/i);
  assert.match(joined, /onScreenLabel/i);
  assert.match(joined, /Total durasi scene/i);
  assert.match(joined, /factCheckNotes/i);
});

test("pipeline routes script_master & qa_editorial to PREMIUM, post_copy to STANDARD, and persists validation", async () => {
  const tmpDir = makeTempDir();
  const fakeVideo = path.join(tmpDir, "sample.mp4");
  fs.writeFileSync(fakeVideo, Buffer.from("fake-mp4-bytes"));

  const validScript = makeValidEditorialScript();
  const routerCalls = [];

  const fakeRouter = {
    async chatCompletion({ task }) {
      routerCalls.push(task);
      if (task === "script_master") {
        // Deliberately return an academic title first to verify PREMIUM qa_editorial auto-polish
        return {
          model: "gemini-4-neon-high",
          content: JSON.stringify({
            ...validScript,
            title: "Analisis Ban Pesawat Komersial",
          }),
          route: { tier: "premium", provider: "antigravity_cli", model: "gemini-4-neon-high" },
          usage: { totalTokens: 450 },
        };
      }
      if (task === "qa_editorial") {
        return {
          model: "gemini-4-neon-high",
          content: JSON.stringify(validScript),
          route: { tier: "premium", provider: "antigravity_cli", model: "gemini-4-neon-high" },
          usage: { totalTokens: 200 },
        };
      }
      if (task === "post_copy") {
        // Include a trailing comma (real LLM quirk) to verify JSON repair + social pack validation
        return {
          model: "gemini-2.5-flash",
          content: `{
            "youtube": {
              "title": "Kenapa Ban Pesawat Nggak Meledak Saat Mendarat? #Shorts",
              "description": "Rahasia nitrogen & lapisan ban pesawat dalam 60 detik!",
              "tags": ["kokisoyo", "pesawat", "sains", "shorts"],
              "categoryId": "27",
              "privacyStatus": "private",
            },
            "facebook": {
              "title": "Kenapa Ban Pesawat Nggak Meledak?",
              "description": "Ternyata bukan karet biasa! #KokIsoYo #Sains",
            },
            "instagram": {
              "caption": "Pernah mikir kenapa ban pesawat tahan ratusan ton?\\n\\n#KokIsoYo #Sains #Reels",
              "firstComment": "Fakta pesawat apa lagi yang bikin penasaran?",
            }
          }`,
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
      slug: "ep006_ban_pesawat",
      topic: "Kenapa ban pesawat nggak meledak saat mendarat?",
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
    assert.equal(DEFAULT_VISUAL_STYLE, "2.5D-in-3D Cartoon Explainer (Stage25D)");
    assert.deepEqual(routerCalls, ["script_master", "qa_editorial", "post_copy"]);

    // Verify 2-route separation + validation pass in manifest
    assert.equal(res.manifest.stages.generate.status, "completed");
    assert.equal(res.manifest.stages.generate.editorialQaAttempts, 1);
    assert.equal(res.manifest.stages.generate.editorialValidation.passed, true);
    assert.equal(res.manifest.stages.generate.routes.script.tier, "premium");
    assert.equal(res.manifest.stages.generate.routes.editorialQa.tier, "premium");
    assert.equal(res.manifest.stages.generate.routes.social.tier, "standard");
    assert.equal(res.manifest.stages.generate.usage.totalTokens, 830);

    // Verify generated artifacts exist
    assert.ok(fs.existsSync(path.join(res.jobDir, "script_master.json")));
    assert.ok(fs.existsSync(path.join(res.jobDir, "script_master.md")));
    assert.ok(fs.existsSync(path.join(res.jobDir, "social_pack.json")));
    assert.ok(fs.existsSync(path.join(res.jobDir, "editorial_validation.json")));
    assert.ok(fs.existsSync(res.manifestPath));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("normalizeSocialPack hoists mis-nested instagram object out of facebook and passes validateSocialPack", () => {
  const misnested = {
    youtube: { title: "Judul #Shorts", description: "Deskripsi valid" },
    facebook: {
      title: "Judul FB",
      description: "Caption FB valid",
      instagram: { caption: "Caption IG valid", firstComment: "Komen?" },
    },
  };
  const fixed = normalizeSocialPack(misnested);
  assert.equal(fixed.facebook.instagram, undefined);
  assert.equal(fixed.instagram.caption, "Caption IG valid");
  assert.equal(validateSocialPack(fixed).passed, true);
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
      env: {},
    });

    assert.equal(res.ok, true);
    assert.equal(res.manifest.stages.post.results.youtube.status, "skipped_unconfigured");
    assert.equal(res.manifest.stages.post.results.facebook.status, "skipped_unconfigured");
    assert.equal(res.manifest.stages.post.results.instagram.status, "skipped_unconfigured");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
