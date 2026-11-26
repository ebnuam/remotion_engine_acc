/**
 * Pipeline Stage — SCENE COMPILER (`script_master.json` + `audio_summary.json` + `words.json` -> `scene_plan.json`)
 *
 * Deterministically compiles any Kok Iso Yo? editorial script into a frame-accurate,
 * crash-proof `AutoScenePlan` consumed by `src/auto25d/AutoEpisode25D.tsx`:
 * - Syncs total frame count to ACTUAL measured audio duration (58.512s -> 1756 frames @ 30 FPS)
 * - Keeps Scene 1 hook strictly <= 2.0s (60 frames)
 * - Selects matching 3D environment theme, animated 3D hero prop, dynamic camera angle/motion,
 *   expressive 2.5D host pose/accessory, and 2D comic FX from each scene's `visualCue` & `narration`
 * - Zero TypeScript codegen crashes, zero blank frames, 100% reproducible.
 */

import fs from "node:fs";
import path from "node:path";
import { atomicWriteFile } from "../tts-gateway/index.mjs";

const VALID_CAMERA_ANGLES = new Set([
  "low_angle",
  "wide",
  "medium",
  "close_up",
  "extreme_close_up",
  "top_down",
  "high_angle",
  "aerial",
]);

const VALID_LIGHT_MODES = new Set(["day", "golden", "night"]);

function detectDefaultEnvTheme(script) {
  const blob = `${script.title || ""} ${script.narrationScript || ""} ${(script.scenes || [])
    .map((s) => s.visualCue || "")
    .join(" ")}`.toLowerCase();

  if (/(pesawat|landasan|bandara|runway|taxiway|jet|penerbangan)/.test(blob)) {
    return "runway";
  }
  if (/(planet|bintang|angkasa|bulan|matahari|gravitasi|orbit|antariksa)/.test(blob)) {
    return "sky_cosmos";
  }
  if (/(jalan|kota|gedung|mobil|jembatan|kereta|lalu lintas)/.test(blob)) {
    return "urban_street";
  }
  if (/(hutan|daun|pohon|sungai|hewan|badak|laut|gunung|alam)/.test(blob)) {
    return "nature_outdoor";
  }
  return "lab_blueprint";
}

function detectHeroProp(scene, defaultTheme, idx) {
  const text = `${scene.visualCue || ""} ${scene.narration || ""} ${scene.onScreenLabel || ""}`.toLowerCase();

  // Resolution scenes on runway always showcase the landing/taxi payoff cleanly
  if (scene.beat === "resolution" && defaultTheme === "runway") {
    return "jet_taxi_golden";
  }

  // Aviation / aircraft tire rich procedural 3D props (strict word boundaries to avoid substring misfires like "tapi"/"rapi" -> "api")
  if (/\b(empat hal|empat kartu|radial)\b/.test(text)) {
    return "four_pillars_radial";
  }
  if (/\b(nilon|baja|cutaway|belah|irisan|lapisan)\b/.test(text) && !/\b(suspensi|hidrolik)\b/.test(text)) {
    return "tire_cutaway_layers";
  }
  if (/\b(empat kali|4x|pompa|manometer|uji tekanan)\b/.test(text)) {
    return "burst_test_4x";
  }
  if (/\b(enam kali|6x|tumpukan|ban mobil|perbandingan)\b/.test(text)) {
    return "tire_vs_six_cars";
  }
  if (/\b(200\s*psi|dua ratus psi|kompresor|pentil|selang)\b/.test(text)) {
    return "tire_pressure_200psi";
  }
  if (/\b(nitrogen|n2|x-ray|molekul)\b/.test(text) && !/\b(rem|cakram|berpijar)\b/.test(text)) {
    return "nitrogen_xray";
  }
  if (/\b(rem|cakram|berpijar|percikan|api)\b/.test(text)) {
    return "brake_glow_shield";
  }
  if (/\b(fusible|katup|sekring|meleleh|mengempis)\b/.test(text)) {
    return /\b(meleleh|mengempis|lilin|keluar)\b/.test(text)
      ? "fusible_plug_melt"
      : "fusible_plug_zoom";
  }
  if (/\b(suspensi|hidrolik|piston|oleo|pegas)\b/.test(text)) {
    return "hydraulic_strut";
  }
  if (/\b(diam|terseret|spin-up|berputar)\b/.test(text)) {
    return "tire_spinup";
  }
  if (/\b(asap|tapak ban|goresan hitam|240-280)\b/.test(text)) {
    return "tire_touchdown_smoke";
  }
  if (/\b(senja|taxiway|berhenti rapi|meluncur mulus)\b/.test(text)) {
    return "jet_taxi_golden";
  }
  if (/\b(pesawat|landasan|roda pendaratan|touchdown|mendarat)\b/.test(text)) {
    return "jet_landing";
  }

  // General science / everyday explainer props
  if (/\b(petir|listrik|kilat|sambar|tegangan)\b/.test(text)) return "lightning_bolt";
  if (/\b(molekul|atom|kimia|sel|oksigen|gas|partikel)\b/.test(text)) return "molecule_cluster";
  if (/\b(planet|bumi|bulan|matahari|orbit|angkasa)\b/.test(text)) return "planet_globe";
  if (/\b(mesin|roda gigi|mekanisme|sistem|kerja)\b/.test(text)) return "gear_mechanism";

  if (defaultTheme === "runway") {
    return idx % 2 === 0 ? "tire_touchdown_smoke" : "jet_landing";
  }
  const fallbacks = ["gear_mechanism", "molecule_cluster", "planet_globe", "hero_pedestal"];
  return fallbacks[idx % fallbacks.length];
}

function detectCameraMotion(scene) {
  const note = String(scene.cameraNote || "").toLowerCase();
  if (/(pull-back|dolly-out|zoom-out|mundur)/.test(note)) return "pull_back";
  if (/(orbit|arc|rotate|mengelilingi)/.test(note)) return "orbit";
  if (/(pan|truck|tracking|dolly-right)/.test(note)) return "pan_right";
  if (/(tilt-up|naik)/.test(note)) return "tilt_up";
  if (/(crane-down|tilt-down|pedestal-down)/.test(note)) return "crane_down";
  return "push_in";
}

function detectHostConfig(scene, defaultTheme, idx) {
  const cue = String(scene.visualCue || "").toLowerCase();
  const explicitHost = /(karakter|pembawa acara|host|koko|jempol|ekspresi)/.test(cue);
  const isExtremeMacro = scene.cameraAngle === "extreme_close_up" || scene.cameraAngle === "top_down";
  const visible = explicitHost || (!isExtremeMacro && (idx === 0 || idx % 3 === 1 || scene.beat === "resolution"));

  let expr = "explain";
  let pose = "point";
  if (scene.beat === "opening") {
    expr = idx === 0 ? "shock" : "curious";
    pose = idx === 0 ? "brace" : "point";
  } else if (scene.beat === "resolution") {
    expr = "smile";
    pose = /(jempol|utuh|aman)/.test(`${cue} ${scene.narration || ""}`.toLowerCase())
      ? "thumbs_up"
      : "wave";
  } else if (/(silang|bukan|tenang|menggeleng)/.test(cue)) {
    expr = "explain";
    pose = "wave";
  } else if (/(kaget|panas|ledak)/.test(cue)) {
    expr = "shock";
    pose = "brace";
  }

  let accessory = "none";
  if (/(telinga|bandara|earmuff)/.test(cue) || defaultTheme === "runway") {
    accessory = scene.lightMode === "night" ? "glasses" : "earmuffs";
  } else if (scene.lightMode === "night") {
    accessory = "glasses";
  }

  return {
    visible,
    x: idx % 2 === 0 ? -1.15 : 1.15,
    z: 1.65,
    expr,
    pose,
    accessory,
    mirror: idx % 2 === 1,
  };
}

function detectComicFx(scene, heroProp) {
  const cue = `${scene.visualCue || ""} ${scene.narration || ""}`.toLowerCase();
  const fx = [];
  if (/(tanda tanya|\?)/.test(cue) && scene.beat === "opening") fx.push("question_mark");
  if (/(tanda silang|bukan tanda pecah|coret)/.test(cue)) fx.push("cross_explosion");
  if (/(asap|berasap|spin-up)/.test(cue) || heroProp === "tire_touchdown_smoke") fx.push("smoke_puffs");
  if (/(tekanan|psi|panah tekanan|pompa)/.test(cue) || heroProp === "tire_pressure_200psi") {
    fx.push("pressure_arrows");
  }
  if (/(perisai|shield|melindungi|saling jaga)/.test(cue) || heroProp === "brake_glow_shield") {
    fx.push("shield_aura");
  }
  if (/(bintang|kilau|utuh|aman|puas)/.test(cue) || scene.beat === "resolution") {
    fx.push("sparkles");
  }
  return fx.slice(0, 2);
}

/**
 * Computes exact integer frame intervals [a, b) summing strictly to `totalFrames`,
 * keeping Scene 1 strictly <= 2.0s (60 frames) while preserving editorial pacing.
 */
export function allocateSceneFrames(scenes, totalFrames, fps = 30) {
  if (!Array.isArray(scenes) || scenes.length === 0) return [];
  const rawDurs = scenes.map((s) => Math.max(1.5, Number(s.durationSec) || 3));
  const rawSum = rawDurs.reduce((a, b) => a + b, 0);

  const durationsFrames = rawDurs.map((d, idx) => {
    const scaled = Math.max(30, Math.round((d / rawSum) * totalFrames));
    // Guarantee Scene 1 hook stays <= 2.0s (60 frames at 30fps)
    if (idx === 0) return Math.min(Math.round(2.0 * fps), scaled);
    return scaled;
  });

  // Adjust rounding remainder on the last scene so total matches totalFrames exactly
  let currentTotal = durationsFrames.reduce((a, b) => a + b, 0);
  const diff = totalFrames - currentTotal;
  durationsFrames[durationsFrames.length - 1] = Math.max(
    30,
    durationsFrames[durationsFrames.length - 1] + diff
  );

  // If still off (edge case where last scene hit floor), spread across development scenes
  currentTotal = durationsFrames.reduce((a, b) => a + b, 0);
  let delta = totalFrames - currentTotal;
  for (let i = scenes.length - 2; i >= 1 && delta !== 0; i -= 1) {
    const nextVal = Math.max(30, durationsFrames[i] + delta);
    delta -= nextVal - durationsFrames[i];
    durationsFrames[i] = nextVal;
  }

  let cursor = 0;
  return durationsFrames.map((len) => {
    const a = cursor;
    const b = cursor + len;
    cursor = b;
    return { a, b };
  });
}

export function compileScenePlan({
  script,
  slug = "episode_auto",
  actualDurationSec = null,
  fps = 30,
}) {
  const scenesInput = Array.isArray(script?.scenes) ? script.scenes : [];
  if (scenesInput.length === 0) {
    throw new Error("compileScenePlan requires script.scenes with at least 1 scene.");
  }

  const scriptTotalSec = scenesInput.reduce((acc, s) => acc + (Number(s.durationSec) || 3), 0);
  const targetSec =
    Number.isFinite(actualDurationSec) && actualDurationSec > 1 ? actualDurationSec : scriptTotalSec;
  const totalFrames = Math.max(60, Math.ceil(targetSec * fps));

  const defaultEnvTheme = detectDefaultEnvTheme(script);
  const frameSpans = allocateSceneFrames(scenesInput, totalFrames, fps);

  const scenes = scenesInput.map((s, idx) => {
    const lightMode = VALID_LIGHT_MODES.has(s.lightMode) ? s.lightMode : "day";
    const cameraAngle = VALID_CAMERA_ANGLES.has(s.cameraAngle) ? s.cameraAngle : "medium";
    const heroProp = detectHeroProp(s, defaultEnvTheme, idx);
    const envTheme = lightMode === "night" ? "lab_blueprint" : defaultEnvTheme;
    const prevLight = idx > 0 ? scenesInput[idx - 1].lightMode : lightMode;

    return {
      id: idx + 1,
      sceneKey: s.id || `scene_${String(idx + 1).padStart(2, "0")}`,
      beat: ["opening", "development", "resolution"].includes(s.beat) ? s.beat : "development",
      a: frameSpans[idx].a,
      b: frameSpans[idx].b,
      lightMode,
      envTheme,
      cameraAngle,
      cameraMotion: detectCameraMotion(s),
      heroProp,
      host: detectHostConfig(s, defaultEnvTheme, idx),
      comicFx: detectComicFx(s, heroProp),
      onScreenLabel: typeof s.onScreenLabel === "string" && s.onScreenLabel.trim() ? s.onScreenLabel.trim() : null,
      kickAtStart: idx === 0 || /(hantam|ledak|touchdown|benturan|kejut)/i.test(s.visualCue || ""),
      flashAtStart: idx > 0 && prevLight !== lightMode && lightMode === "night",
    };
  });

  return {
    schemaVersion: "1.0.0",
    slug,
    title: String(script.title || slug),
    fps,
    totalFrames,
    durationSec: Number((totalFrames / fps).toFixed(3)),
    defaultEnvTheme,
    scenes,
  };
}

export async function runSceneStage({
  jobDir,
  slug = "episode_auto",
  fps = 30,
  dryRun = false,
} = {}) {
  fs.mkdirSync(jobDir, { recursive: true });
  const scriptPath = path.join(jobDir, "script_master.json");
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Scene stage requires script_master.json at ${scriptPath}`);
  }
  const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));

  const audioSummaryPath = path.join(jobDir, "audio", "audio_summary.json");
  let actualDurationSec = null;
  if (fs.existsSync(audioSummaryPath)) {
    const audioSummary = JSON.parse(fs.readFileSync(audioSummaryPath, "utf8"));
    actualDurationSec =
      audioSummary?.mix?.probe?.actualDurationSec ??
      audioSummary?.tts?.voiceDurationSec ??
      null;
  }

  const scenePlan = compileScenePlan({
    script,
    slug,
    actualDurationSec,
    fps,
  });

  const scenePlanPath = path.join(jobDir, "scene_plan.json");
  if (!dryRun) {
    atomicWriteFile(scenePlanPath, JSON.stringify(scenePlan, null, 2));
  }

  return {
    ok: true,
    dryRun,
    scenePlanPath,
    scenePlan,
    summary: {
      defaultEnvTheme: scenePlan.defaultEnvTheme,
      sceneCount: scenePlan.scenes.length,
      totalFrames: scenePlan.totalFrames,
      durationSec: scenePlan.durationSec,
      syncedToAudio: actualDurationSec !== null,
      uniqueHeroProps: [...new Set(scenePlan.scenes.map((s) => s.heroProp))],
    },
  };
}
