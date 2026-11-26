/**
 * Pipeline Stage 1 — GENERATE (2-Route AI Router + Editorial Validator)
 *
 * Pembagian Tugas AI:
 * - PREMIUM route (`agy` CLI on VPS, task="script_master" & "qa_editorial"):
 *     Penulisan master script, hook 0-2s, scene breakdown (2-4s/shot), fact-check, dan editorial QA.
 * - STANDARD route (AGYBridge Render, task="post_copy"):
 *     Caption, metadata, hashtag, dan social pack untuk YouTube Shorts, Facebook Reels, Instagram Reels.
 *
 * Mengacu pada:
 * - docs/VISUAL_STYLE_GUIDE.md
 * - docs/TTS_ARCHITECTURE.md
 * - RULES.md (Standar Editorial Utama Kok Iso Yo?)
 */

import fs from "node:fs";
import path from "node:path";
import { AI_TIERS } from "../ai-gateway/index.mjs";

export const DEFAULT_VISUAL_STYLE = "2.5D-in-3D Cartoon Explainer (Stage25D)";

export const EDITORIAL_RULES = Object.freeze({
  minDurationSec: 50,
  maxDurationSec: 65,
  targetDurationSec: 59,
  minNarrationEstimateSec: 47,
  maxNarrationEstimateSec: 64,
  maxDurationMismatchSec: 8,
  maxBreathingRoomSec: 8,
  minWords: 95,
  maxWords: 140,
  minShotSec: 2,
  maxShotSec: 4,
  minScenes: 13,
  maxScenes: 28,
  maxHookDurationSec: 2.0,
  maxHookSceneSec: 2.0,
  maxLabelWords: 5,
  maxLabelChars: 36,
  maxTitleChars: 75,
  minFactCheckNotes: 2,
  validCameraAngles: Object.freeze([
    "low_angle",
    "high_angle",
    "aerial",
    "top_down",
    "wide",
    "medium",
    "close_up",
    "extreme_close_up",
  ]),
  validLightModes: Object.freeze(["day", "golden", "night"]),
  validBeats: Object.freeze(["opening", "development", "resolution"]),
});

const ACADEMIC_TITLE_PATTERNS = [
  /^(analisis|kajian|studi|evaluasi|tinjauan|implementasi|pengaruh|hubungan|perbandingan|eksplorasi|fenomena ilmiah)\b/i,
  /\b(studi kasus|tinjauan pustaka|perspektif ilmiah|mekanisme biokimiawi|tinjauan teoritis)\b/i,
];

const BANNED_HOOK_OPENERS = [
  /^(halo|hai|assalamualaikum|selamat\s+(pagi|siang|sore|malam|datang))/i,
  /^(pada\s+(video|kesempatan)\s+kali\s+ini|di\s+video\s+kali\s+ini|dalam\s+video\s+ini)/i,
  /^(tahukah\s+(anda|kamu)\s+bahwa\s+secara\s+ilmiah)/i,
];

const CLIFFHANGER_PATTERNS = [
  /\b(bersambung|lanjut\s+ke\s+bagian|part\s*2|bagian\s*2|episode\s+berikutnya\s+akan\s+menjawab)\b/i,
];

// Matches common pictographs / emojis that render as tofu boxes on Linux VPS
const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function extractJsonBlock(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const tryParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      // Tolerate minor LLM trailing commas before } or ]
      const repaired = str.replace(/,\s*([}\]])/g, "$1");
      try {
        return JSON.parse(repaired);
      } catch {
        return null;
      }
    }
  };

  const direct = tryParse(candidate);
  if (direct) return direct;

  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return tryParse(candidate.slice(first, last + 1));
  }
  return null;
}

export function normalizeSocialPack(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  const out = { ...parsed };
  // Guard against minor LLM nesting mistake where `instagram` is placed inside `facebook` or `youtube`
  if (!out.instagram && out.facebook && typeof out.facebook === "object" && out.facebook.instagram) {
    out.instagram = out.facebook.instagram;
    const { instagram: _moved, ...fbRest } = out.facebook;
    out.facebook = fbRest;
  }
  if (!out.instagram && out.youtube && typeof out.youtube === "object" && out.youtube.instagram) {
    out.instagram = out.youtube.instagram;
    const { instagram: _moved, ...ytRest } = out.youtube;
    out.youtube = ytRest;
  }
  return out;
}

export function validateSocialPack(socialPack) {
  const errors = [];
  if (!socialPack || typeof socialPack !== "object") {
    return { passed: false, errors: ["Social pack kosong atau bukan object."] };
  }
  const yt = socialPack.youtube;
  const fb = socialPack.facebook;
  const ig = socialPack.instagram;

  if (!yt || typeof yt.title !== "string" || !yt.title.trim()) {
    errors.push("youtube.title wajib diisi.");
  }
  if (!yt || typeof yt.description !== "string" || !yt.description.trim() || yt.description.trim().startsWith("{")) {
    errors.push("youtube.description tidak valid atau masih berisi JSON mentah.");
  }
  if (!fb || typeof fb.description !== "string" || !fb.description.trim() || fb.description.trim().startsWith("{")) {
    errors.push("facebook.description tidak valid atau masih berisi JSON mentah.");
  }
  if (!ig || typeof ig.caption !== "string" || !ig.caption.trim() || ig.caption.trim().startsWith("{")) {
    errors.push("instagram.caption tidak valid atau masih berisi JSON mentah.");
  }
  return { passed: errors.length === 0, errors };
}

const SPELLED_UNIT_SYLLABLES = Object.freeze({
  psi: 3, // pe-es-i
  rpm: 3, // er-pe-em
  km: 4, // ki-lo-me-ter
  cm: 4, // sen-ti-me-ter
  mm: 4, // mi-li-me-ter
  kg: 3, // ki-lo-gram
  db: 3, // de-si-bel
  hz: 1.5, // hertz
  khz: 3.5, // ki-lo-hertz
  lufs: 4, // el-u-ef-es
  fps: 3, // ef-pe-es
  wib: 3, // we-i-be
  faa: 3, // ef-a-a
  cfr: 3, // ce-ef-er
  tts: 3, // te-te-es
  mp4: 4, // em-pe-em-pat
});

function estimateNumberSyllables(numToken) {
  const s = String(numToken || "").trim();
  if (!s) return 0;

  // Decimal / regulation number with digits after dot (e.g. "25.733", "13,8")
  if (/^\d+[.,]\d+$/.test(s)) {
    const [left, right] = s.split(/[.,]/);
    // Thousand separator pattern like 300.000 (right has exactly 3 digits and left <= 3 digits and right == "000")
    if (s.includes(".") && right === "000") {
      return estimateNumberSyllables(left) + 2; // "... ri-bu"
    }
    const leftSyl = estimateNumberSyllables(left);
    // Digit-by-digit reading for codes like 25.733 ("ti-tik tu-juh ti-ga ti-ga") or decimal "ko-ma ..."
    const rightSyl = right.length <= 2 ? estimateNumberSyllables(right) : right.length * 2;
    return leftSyl + 2 + rightSyl;
  }

  const digits = s.replace(/\D/g, "");
  if (!digits) return 0;
  if (digits.length === 1) return 2; // "sa-tu", "li-ma", "de-la-pan" (~2-3)
  if (digits.length === 2) return 3.5; // "du-a pu-luh", "e-nam pu-luh"
  if (digits.length === 3) {
    // Round hundreds like 200 ("du-a ra-tus"=4) vs 177 ("se-ra-tus tu-juh pu-luh tu-juh"=9)
    return digits.endsWith("00") ? 4 : 7;
  }
  if (digits.length <= 6) return 8;
  return 10;
}

/**
 * Estimates spoken syllable count for an Indonesian word/token, accounting for:
 * - Multi-syllable Indonesian vowel clusters (e.g., "mengapa"=3, "fotosintesis"=5)
 * - Spoken expansions for numbers, ranges ("177-200"), approximations ("~200", "200+"),
 *   percentages ("100%"), temperature ("°C"), chemical formulas ("CO2", "N2"),
 *   unit slashes ("km/jam"), and spelled-out acronyms ("FAA", "PSI", "CFR", "LUFS").
 *
 * Keterbatasan estimator (penting):
 * - Ini adalah heuristik pra-TTS, bukan pengganti pengukuran audio aktual (`ffprobe`).
 * - Kecepatan bicara riil bervariasi tergantung voice TTS/narator, gaya intonasi, dan emosi.
 * - Istilah asing/serapan tertentu bisa dibaca lebih cepat/lambat oleh tiap engine TTS.
 * - Akronim ambigu (bisa dieja per huruf atau dibaca sebagai kata) diestimasi konservatif.
 */
export function countIndonesianSyllables(token) {
  const raw = String(token || "").trim();
  if (!raw) return 0;

  // Strip surrounding quotation/brackets/trailing punctuation while keeping ~, +, °, %, /, -
  const clean = raw.replace(/^[\s"'([{]+|[\s"')\]}.,!?;:]+$/g, "");
  if (!clean) return 0;

  // Temperature symbols like "°C", "°F", "177°C"
  if (/°[CF]$/i.test(clean)) {
    const numPart = clean.replace(/°[CF]$/i, "");
    return (numPart ? countIndonesianSyllables(numPart) : 0) + 6; // "de-ra-jat cel-si-us"
  }

  // Approximation/modifier prefixes/suffixes (~200 -> "sekitar 200", 200+ -> "200 lebih")
  if (/^[~≈±]/.test(clean)) {
    return 3 + countIndonesianSyllables(clean.slice(1)); // "se-ki-tar ..."
  }
  if (/\+$/.test(clean) && /\d/.test(clean)) {
    return countIndonesianSyllables(clean.slice(0, -1)) + 2; // "... le-bih"
  }
  if (/%$/.test(clean) && /\d/.test(clean)) {
    return countIndonesianSyllables(clean.slice(0, -1)) + 2; // "... per-sen"
  }

  // Unit slashes like "km/jam", "kg/cm2"
  if (clean.includes("/")) {
    return clean
      .split("/")
      .reduce((acc, part) => acc + Math.max(2, countIndonesianSyllables(part)), 1); // +1 for "per"
  }

  // Numeric ranges like "177-200", "250–280"
  if (/^\d[\d.,]*[-–—]\d[\d.,]*$/.test(clean)) {
    const [a, b] = clean.split(/[-–—]/);
    return estimateNumberSyllables(a) + 2 + estimateNumberSyllables(b); // "... sam-pai ..."
  }

  // Hyphenated compound words (e.g., "rata-rata", "spin-up")
  if (clean.includes("-") && /[a-zA-Z]/.test(clean)) {
    return clean.split("-").reduce((acc, part) => acc + countIndonesianSyllables(part), 0);
  }

  // Chemical / scientific symbol tokens like CO2, O2, H2O, N2
  if (/^[A-Z]{1,3}\d(?:[A-Z]\d?)?$/.test(clean)) {
    const letters = (clean.match(/[A-Z]/g) || []).length;
    const nums = (clean.match(/\d/g) || []).length;
    return letters * 1.5 + nums * 2;
  }

  // Pure numeric / decimal token
  if (/^\d[\d.,]*$/.test(clean)) {
    return estimateNumberSyllables(clean);
  }

  const lower = clean.toLowerCase();
  if (SPELLED_UNIT_SYLLABLES[lower] !== undefined) {
    return SPELLED_UNIT_SYLLABLES[lower];
  }

  // Uppercase acronyms 2-5 letters (e.g. "FAA", "CFR", "TNUK", "MTOW")
  if (/^[A-Z]{2,5}$/.test(clean)) {
    const hasVowel = /[AEIOU]/.test(clean);
    // Consonant-only acronyms or short 2-3 letter acronyms are almost always spelled letter-by-letter
    if (!hasVowel || clean.length <= 3) {
      return clean.length * 1.1;
    }
    return Math.max(2.5, clean.length * 0.85);
  }

  const letters = lower.replace(/[^a-z]/g, "");
  if (!letters) return 0;

  // Count vowel groups (handling Indonesian diphthongs ai, au, oi as 1 beat)
  const normalized = letters.replace(/(ai|au|oi)/g, "a");
  const groups = normalized.match(/[aiueo]+/g);
  if (!groups) return Math.max(1, Math.ceil(letters.length / 2));

  // Foreign/loanword consonant clusters & long technical terms add slight articulation cost
  const hasForeignCluster = /(ch|sh|th|ph|ck|pl|str|tr|pr|fl|br|kr|gr)/.test(letters);
  const extraCluster = (letters.length >= 10 ? 0.5 : 0) + (hasForeignCluster ? 0.35 : 0);
  return Number((groups.length + extraCluster).toFixed(2));
}

/**
 * Multi-factor spoken duration estimator (pre-TTS heuristic guardrail) for Indonesian Shorts.
 *
 * Combines:
 * 1. Syllable articulation rate (calibrated around ~5.2 syllables/sec for natural Indonesian)
 * 2. Breath & dramatic punctuation pauses (. ? ! = 0.36s, , ; : — = 0.17s, ... = 0.45s, newline = 0.22s)
 * 3. Spoken expansion overhead for numbers, ranges, symbols, acronyms, and technical terms
 *
 * Keterbatasan yang didokumentasikan:
 * - Tidak menggantikan pengukuran durasi audio aktual (`ffprobe`) setelah sintesis TTS.
 * - Akurasi riil dapat bergeser ±10–15% tergantung rate suara TTS, penekanan emosional,
 *   jeda dramatis antar kalimat, atau pelafalan istilah asing.
 */
export function estimateNarrationDurationSec(text, { syllablesPerSec = 5.2 } = {}) {
  const raw = String(text || "").trim();
  if (!raw) {
    return {
      estimatedSec: 0,
      wordCount: 0,
      syllableCount: 0,
      charCount: 0,
      pauseSec: 0,
      wpm: 0,
      syllablesPerSec,
      isHeuristic: true,
    };
  }

  const tokens = raw.split(/\s+/).filter(Boolean);
  const wordCount = tokens.length;
  const charCount = raw.length;

  let syllableCount = 0;
  for (const tok of tokens) {
    syllableCount += countIndonesianSyllables(tok);
  }

  // Count ellipsis separately so "..." isn't counted as 1 sentence end without dramatic pause
  const ellipses = (raw.match(/\.{3}|…/g) || []).length;
  const withoutEllipsis = raw.replace(/\.{3}|…/g, " ");
  // Exclude decimal dots inside numbers (e.g. 25.733) from sentence-end pauses
  const withoutDecimals = withoutEllipsis.replace(/(\d)\.(\d)/g, "$1$2");
  const sentenceEnds = (withoutDecimals.match(/[.!?]+/g) || []).length;
  const clauseBreaks = (withoutDecimals.match(/[,;:—–]+/g) || []).length;
  const lineBreaks = (raw.match(/\n+/g) || []).length;

  // Exclude trailing pause after the very last sentence from adding dead tail
  const effectiveSentencePauses = Math.max(0, sentenceEnds - 1);
  const pauseSec = Number(
    (
      effectiveSentencePauses * 0.36 +
      clauseBreaks * 0.17 +
      ellipses * 0.42 +
      lineBreaks * 0.22
    ).toFixed(2)
  );

  const speechSec = syllableCount / syllablesPerSec;
  const estimatedSec = Number((speechSec + pauseSec).toFixed(2));
  const wpm = estimatedSec > 0 ? Math.round((wordCount / estimatedSec) * 60) : 0;

  return {
    estimatedSec,
    wordCount,
    syllableCount: Number(syllableCount.toFixed(1)),
    charCount,
    pauseSec,
    wpm,
    syllablesPerSec,
    isHeuristic: true,
  };
}

function normalizeTokenSet(str) {
  return new Set(
    String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2)
  );
}

/**
 * Validates a generated script package against Kok Iso Yo? Editorial Standards (RULES.md + VISUAL_STYLE_GUIDE.md).
 */
export function validateEditorialPackage(scriptData, options = {}) {
  const rules = { ...EDITORIAL_RULES, ...(options.rules || {}) };
  const errors = [];
  const warnings = [];

  if (!scriptData || typeof scriptData !== "object") {
    return {
      passed: false,
      errors: ["Script data kosong atau bukan JSON object valid."],
      warnings: [],
      metrics: null,
    };
  }

  // 1. Title check (non-academic, concise, no emoji)
  const title = String(scriptData.title || "").trim();
  if (!title) {
    errors.push("Judul (`title`) wajib diisi.");
  } else {
    if (title.length > rules.maxTitleChars) {
      errors.push(
        `Judul terlalu panjang (${title.length} karakter; maks ${rules.maxTitleChars} karakter).`
      );
    }
    if (ACADEMIC_TITLE_PATTERNS.some((re) => re.test(title))) {
      errors.push(`Judul terlalu akademis/seperti makalah: "${title}".`);
    }
    if (EMOJI_PATTERN.test(title)) {
      errors.push("Judul tidak boleh mengandung emoji Unicode.");
    }
  }

  // 2. Hook 0–2s check
  const hook = String(scriptData.hook || "").trim();
  const hookEstimate = estimateNarrationDurationSec(hook);
  if (!hook) {
    errors.push("Hook 0–2 detik (`hook`) wajib diisi.");
  } else {
    if (BANNED_HOOK_OPENERS.some((re) => re.test(hook))) {
      errors.push(`Hook dibuka dengan salam/pengantar klise: "${hook}".`);
    }
    if (hookEstimate.estimatedSec > rules.maxHookDurationSec) {
      errors.push(
        `Hook terlalu panjang (estimasi ${hookEstimate.estimatedSec}s; batas ketat 0–2s, maks ${rules.maxHookDurationSec}s).`
      );
    }
  }

  // 3. Narration check (natural Indonesian, multi-factor reading duration, no cliffhanger)
  const narrationScript = String(scriptData.narrationScript || "").trim();
  const narrationEstimate = estimateNarrationDurationSec(narrationScript);
  if (!narrationScript) {
    errors.push("Naskah narasi (`narrationScript`) wajib diisi.");
  } else {
    if (
      narrationEstimate.estimatedSec < rules.minNarrationEstimateSec ||
      narrationEstimate.estimatedSec > rules.maxNarrationEstimateSec
    ) {
      errors.push(
        `Estimasi durasi baca narasi ${narrationEstimate.estimatedSec}s di luar target (${rules.minNarrationEstimateSec}–${rules.maxNarrationEstimateSec}s untuk video 50–65s).`
      );
    }
    if (narrationEstimate.wordCount < rules.minWords || narrationEstimate.wordCount > rules.maxWords) {
      warnings.push(
        `Jumlah kata narasi ${narrationEstimate.wordCount} kata (rentang ideal ${rules.minWords}–${rules.maxWords} kata).`
      );
    }
    if (CLIFFHANGER_PATTERNS.some((re) => re.test(narrationScript))) {
      errors.push("Narasi mengandung pola seri menggantung/cliffhanger; satu video harus tuntas.");
    }
  }

  // 4. Story arc structure check (opening, development, resolution)
  const arc = scriptData.storyArc || {};
  const hasArcFields =
    typeof arc.opening === "string" &&
    arc.opening.trim().length > 0 &&
    typeof arc.development === "string" &&
    arc.development.trim().length > 0 &&
    typeof arc.resolution === "string" &&
    arc.resolution.trim().length > 0;
  if (!hasArcFields) {
    errors.push(
      "Struktur cerita (`storyArc`) wajib memiliki `opening`, `development`, dan `resolution` yang lengkap."
    );
  }

  // 5. Scenes validation (duration 50-65s, shot rhythm 2-4s, cameraAngle, lightMode, beats, onScreenLabel)
  const scenes = Array.isArray(scriptData.scenes) ? scriptData.scenes : [];
  if (scenes.length === 0) {
    errors.push("Daftar `scenes` wajib diisi.");
  }

  let totalSceneDurationSec = 0;
  const beatsSeen = [];
  const cameraSet = new Set();
  const lightSet = new Set();
  let consecutiveSameCamera = 1;
  let labeledScenesCount = 0;
  let combinedSceneNarration = [];

  for (let i = 0; i < scenes.length; i += 1) {
    const s = scenes[i] || {};
    const labelPrefix = `Scene #${i + 1} (${s.id || `scene_${String(i + 1).padStart(2, "0")}`})`;

    const dur = Number(s.durationSec);
    if (!Number.isFinite(dur) || dur <= 0) {
      errors.push(`${labelPrefix}: durationSec tidak valid.`);
    } else {
      totalSceneDurationSec += dur;
      if (dur < rules.minShotSec || dur > rules.maxShotSec) {
        errors.push(
          `${labelPrefix}: durasi ${dur}s di luar ritme visual ${rules.minShotSec}–${rules.maxShotSec} detik.`
        );
      }
      if (i === 0 && dur > rules.maxHookSceneSec) {
        errors.push(
          `${labelPrefix}: scene pembuka/hook ${dur}s terlalu lama (maks ${rules.maxHookSceneSec}s).`
        );
      }
    }

    const cam = String(s.cameraAngle || "").trim().toLowerCase();
    if (!rules.validCameraAngles.includes(cam)) {
      errors.push(
        `${labelPrefix}: cameraAngle "${s.cameraAngle || ""}" tidak valid (gunakan: ${rules.validCameraAngles.join(", ")}).`
      );
    } else {
      cameraSet.add(cam);
      if (i > 0 && cam === String(scenes[i - 1]?.cameraAngle || "").trim().toLowerCase()) {
        consecutiveSameCamera += 1;
        if (consecutiveSameCamera >= 3) {
          errors.push(`${labelPrefix}: cameraAngle "${cam}" berulang 3x berturut-turut.`);
        }
      } else {
        consecutiveSameCamera = 1;
      }
    }

    const light = String(s.lightMode || "").trim().toLowerCase();
    if (!rules.validLightModes.includes(light)) {
      errors.push(
        `${labelPrefix}: lightMode "${s.lightMode || ""}" tidak valid (gunakan: ${rules.validLightModes.join(", ")}).`
      );
    } else {
      lightSet.add(light);
    }

    const beat = String(s.beat || "").trim().toLowerCase();
    if (!rules.validBeats.includes(beat)) {
      errors.push(
        `${labelPrefix}: beat "${s.beat || ""}" tidak valid (gunakan: ${rules.validBeats.join(", ")}).`
      );
    } else {
      beatsSeen.push(beat);
    }

    const sceneNarr = String(s.narration || "").trim();
    if (!sceneNarr) {
      errors.push(`${labelPrefix}: narasi scene kosong.`);
    } else {
      combinedSceneNarration.push(sceneNarr);
    }

    if (!String(s.visualCue || "").trim()) {
      errors.push(`${labelPrefix}: visualCue kosong.`);
    }

    // Anti-subtitle check on `onScreenLabel`
    const onScreen = s.onScreenLabel === null || s.onScreenLabel === undefined ? "" : String(s.onScreenLabel).trim();
    if (onScreen) {
      labeledScenesCount += 1;
      const lblWords = onScreen.split(/\s+/).filter(Boolean);
      if (lblWords.length > rules.maxLabelWords || onScreen.length > rules.maxLabelChars) {
        errors.push(
          `${labelPrefix}: onScreenLabel "${onScreen}" terlalu panjang (maks ${rules.maxLabelWords} kata / ${rules.maxLabelChars} karakter; bukan subtitle).`
        );
      }
      if (EMOJI_PATTERN.test(onScreen)) {
        errors.push(`${labelPrefix}: onScreenLabel mengandung emoji Unicode.`);
      }
      // Check if onScreenLabel mirrors the scene narration (acting like a subtitle)
      const narrWords = sceneNarr.split(/\s+/).filter(Boolean);
      if (narrWords.length >= 4 && lblWords.length >= 3) {
        const lblSet = normalizeTokenSet(onScreen);
        const narrSet = normalizeTokenSet(sceneNarr);
        let overlap = 0;
        for (const w of lblSet) {
          if (narrSet.has(w)) overlap += 1;
        }
        const overlapRatio = lblSet.size > 0 ? overlap / lblSet.size : 0;
        if (overlapRatio >= 0.8 && onScreen.length >= sceneNarr.length * 0.55) {
          errors.push(
            `${labelPrefix}: onScreenLabel "${onScreen}" menyerupai subtitle narasi; gunakan hanya label/angka/informasi visual singkat.`
          );
        }
      }
    }
  }

  totalSceneDurationSec = Number(totalSceneDurationSec.toFixed(2));
  if (
    scenes.length > 0 &&
    (totalSceneDurationSec < rules.minDurationSec || totalSceneDurationSec > rules.maxDurationSec)
  ) {
    errors.push(
      `Total durasi scene ${totalSceneDurationSec}s di luar target ${rules.minDurationSec}–${rules.maxDurationSec} detik.`
    );
  }

  // Verify beats cover opening -> development -> resolution
  const uniqueBeats = new Set(beatsSeen);
  for (const requiredBeat of rules.validBeats) {
    if (!uniqueBeats.has(requiredBeat)) {
      errors.push(`Alur scene belum mencakup fase "${requiredBeat}".`);
    }
  }
  if (beatsSeen.length > 0) {
    if (beatsSeen[0] !== "opening") {
      errors.push(`Scene pertama harus ber-beat "opening" (ditemukan: "${beatsSeen[0]}").`);
    }
    if (beatsSeen[beatsSeen.length - 1] !== "resolution") {
      errors.push(
        `Scene terakhir harus ber-beat "resolution" agar cerita tuntas (ditemukan: "${beatsSeen[beatsSeen.length - 1]}").`
      );
    }
  }

  // Verify narration fits INSIDE the scene timeline (never overflows) with reasonable breathing room
  const timelineMarginSec =
    narrationEstimate.estimatedSec > 0 && totalSceneDurationSec > 0
      ? Number((totalSceneDurationSec - narrationEstimate.estimatedSec).toFixed(2))
      : null;

  if (timelineMarginSec !== null) {
    if (timelineMarginSec < 0) {
      errors.push(
        `Overflow durasi: estimasi baca narasi (${narrationEstimate.estimatedSec}s) melebihi total durasi scene (${totalSceneDurationSec}s) sebesar ${Math.abs(timelineMarginSec).toFixed(2)}s; ringkas narasi atau tambah durasi scene agar audio tidak terpotong.`
      );
    } else if (timelineMarginSec > rules.maxBreathingRoomSec) {
      errors.push(
        `Timeline terlalu longgar: total durasi scene (${totalSceneDurationSec}s) lebih panjang ${timelineMarginSec.toFixed(2)}s dari estimasi baca narasi (${narrationEstimate.estimatedSec}s; maks ruang napas ${rules.maxBreathingRoomSec}s).`
      );
    }
  }

  // Check if combined scene narration roughly aligns with narrationScript
  const sceneNarrEstimate = estimateNarrationDurationSec(combinedSceneNarration.join(" "));
  if (
    combinedSceneNarration.length > 0 &&
    narrationEstimate.wordCount > 0 &&
    Math.abs(sceneNarrEstimate.wordCount - narrationEstimate.wordCount) >
      Math.max(25, narrationEstimate.wordCount * 0.35)
  ) {
    warnings.push(
      `Jumlah kata gabungan narasi scene (${sceneNarrEstimate.wordCount}) berbeda cukup jauh dari narrationScript (${narrationEstimate.wordCount}).`
    );
  }

  // Shot & label balance checks
  if (scenes.length > 0 && cameraSet.size < 4) {
    warnings.push(
      `Variasi cameraAngle masih rendah (${cameraSet.size} variasi; disarankan minimal 4 jenis sudut kamera).`
    );
  }
  if (scenes.length > 0 && labeledScenesCount > Math.ceil(scenes.length * 0.55)) {
    warnings.push(
      `Terlalu banyak scene memiliki onScreenLabel (${labeledScenesCount}/${scenes.length}); jaga agar teks layar tetap hemat dan tidak menyerupai subtitle.`
    );
  }

  // 6. Fact-check notes
  const facts = Array.isArray(scriptData.factCheckNotes)
    ? scriptData.factCheckNotes.filter((f) => String(f || "").trim().length > 0)
    : [];
  if (facts.length < rules.minFactCheckNotes) {
    errors.push(
      `Catatan verifikasi fakta (\`factCheckNotes\`) minimal ${rules.minFactCheckNotes} poin.`
    );
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    metrics: {
      totalSceneDurationSec,
      timelineMarginSec,
      sceneCount: scenes.length,
      avgShotSec: scenes.length > 0 ? Number((totalSceneDurationSec / scenes.length).toFixed(2)) : 0,
      narrationEstimate,
      sceneNarrationEstimate: sceneNarrEstimate,
      hookEstimate,
      beatsCovered: [...uniqueBeats],
      cameraVariety: [...cameraSet],
      lightModesUsed: [...lightSet],
      labeledScenesCount,
      factCheckCount: facts.length,
    },
  };
}

export function buildScriptMasterPrompt({
  topic,
  slug,
  durationSec = EDITORIAL_RULES.targetDurationSec,
  style = DEFAULT_VISUAL_STYLE,
}) {
  return [
    {
      role: "system",
      content:
        "Kamu adalah Creative Director & Penulis Naskah kanal edukasi sains & fakta 'Kok Iso Yo?'. " +
        "Patuhi standar editorial dan visual 2.5D-in-3D Cartoon Explainer (Stage25D) secara ketat. " +
        "Balas HANYA dengan JSON valid tanpa markdown fence atau penjelasan tambahan di luar JSON.",
    },
    {
      role: "user",
      content: `Buat master script + storyboard video pendek vertikal 9:16 yang TUNTAS dalam satu cerita utuh.
Topik: ${topic}
Slug: ${slug}
Gaya Visual Baku: ${style}
Target Durasi Total: ${durationSec} detik (WAJIB total semua scene di rentang 50–65 detik).

ATURAN EDITORIAL WAJIB:
1. Judul menarik & memancing penasaran (maks 70 karakter), BUKAN judul makalah/akademis (dilarang "Analisis...", "Kajian...", "Studi..."), dan TANPA emoji.
2. Hook 0–2 detik pertama HARUS tajam dan selesai ketat <= 2.0 detik (3–5 kata, <= 10 suku kata, TANPA koma di tengah hook, durasi Scene 1 WAJIB tepat 2 detik), langsung memancing rasa penasaran/kontradiksi tanpa salam pembuka ("Halo teman-teman...", "Pada video kali ini...").
3. Satu video = satu fenomena yang dijelaskan tuntas dengan 3 fase lengkap: "opening" -> "development" -> "resolution" (payoff memuaskan, dilarang bersambung/cliffhanger).
4. Narasi Bahasa Indonesia natural untuk DIDENGAR (bukan gaya baca artikel). INGAT: kata Bahasa Indonesia bersuku kata panjang (~2.4 suku kata/kata). Agar estimasi baca narasi PAS di dalam timeline (selalu <= total durasi scene dengan ruang napas 1–5 detik, TIDAK BOLEH overflow!), target WAJIB adalah **100–118 kata total** (~235–275 suku kata, rata-rata 5–7 kata per scene) untuk total scene **58–62 detik**.
5. \`narrationScript\` HARUS merupakan gabungan persis dari \`narration\` seluruh scene.
6. Buat 17–20 scene; SETIAP scene WAJIB berdurasi 2–4 detik (scene pertama/hook WAJIB tepat 2 detik). Total \`durationSec\` semua scene HARUS berada di 56–63 detik dan HARUS >= estimasi durasi baca narasi (ruang napas 1–6 detik).
7. Variasikan \`cameraAngle\` antar scene dari: low_angle, high_angle, aerial, top_down, wide, medium, close_up, extreme_close_up (jangan 3x sama berturut-turut, minimal 5 variasi).
8. Gunakan \`lightMode\` sebagai penanda babak dari: day, golden, night (minimal 2 mood untuk membangun alur visual).
9. TANPA subtitle permanen! \`onScreenLabel\` bersifat OPSIONAL (isi null pada mayoritas scene; isi hanya pada 4–7 scene kunci berupa label/angka/rumus/rambu singkat MAKS 4 kata & MAKS 30 karakter, TANPA emoji, BUKAN salinan kalimat narasi). Hindari kata absolut yang tidak akurat secara regulasi (mis. gunakan "Gas Nitrogen" atau "Nitrogen Kering", bukan "Gas Nitrogen Murni").
10. AKURASI FAKTA KETAT: Sertakan minimal 3 poin \`factCheckNotes\` yang spesifik dan benar secara teknis/regulasi (sebutkan standar/tipe konteks bila mengutip angka). Hindari analogi menyesatkan, generalisasi berlebihan, atau angka siklus universal tanpa kualifikasi.

Format JSON wajib:
{
  "title": "Judul menarik non-akademis tanpa emoji",
  "hook": "Kalimat hook super tajam 3-5 kata <= 10 suku kata (ketat <= 2 detik)",
  "storyArc": {
    "opening": "Ringkasan pembukaan & pertanyaan inti",
    "development": "Ringkasan mekanisme / penjelasan utama",
    "resolution": "Ringkasan jawaban tuntas & payoff"
  },
  "narrationScript": "Naskah voice-over utuh 100-118 kata (gabungan narasi seluruh scene, pas <= total durasi scene dengan ruang napas 1-5 detik)",
  "scenes": [
    {
      "id": "scene_01",
      "beat": "opening",
      "durationSec": 2,
      "narration": "Kalimat narasi scene ini",
      "visualCue": "Arahan visual 2.5D-in-3D (dunia 3D cel-shaded ber-outline, aksi objek, ekspresi karakter, atau ikon komik 2D)",
      "cameraAngle": "low_angle",
      "cameraNote": "Gerakan kamera spesifik (mis. dolly-in cepat 0.3%/f)",
      "lightMode": "day",
      "onScreenLabel": null
    }
  ],
  "factCheckNotes": [
    "Fakta terverifikasi 1",
    "Fakta terverifikasi 2",
    "Fakta terverifikasi 3"
  ]
}`,
    },
  ];
}

export function buildEditorialQaPrompt({ topic, slug, scriptData, validation }) {
  return [
    {
      role: "system",
      content:
        "Kamu adalah Senior Editorial QA untuk kanal 'Kok Iso Yo?'. " +
        "Perbaiki draft JSON berikut agar lolos 100% aturan editorial tanpa mengurangi akurasi fakta. " +
        "Balas HANYA dengan JSON lengkap yang sudah diperbaiki tanpa teks lain.",
    },
    {
      role: "user",
      content: `Topik: ${topic} (slug: ${slug})

KESALAHAN VALIDATOR YANG WAJIB DIPERBAIKI:
${validation.errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}

PERINGATAN (sebaiknya diperbaiki juga):
${validation.warnings.length ? validation.warnings.map((w, i) => `${i + 1}. ${w}`).join("\n") : "- Tidak ada"}

METRIK SAAT INI:
${JSON.stringify(validation.metrics)}

DRAFT JSON SAAT INI:
${JSON.stringify(scriptData, null, 2)}

Kembalikan JSON lengkap yang sudah diperbaiki sesuai skema yang sama dan lolos seluruh aturan (total scene 56-63s, tiap scene 2-4s, hook ketat <= 2.0s / 3-5 kata <= 10 suku kata tanpa koma & Scene 1 = 2s, estimasi baca narasi WAJIB <= total durasi scene dengan ruang napas 1-6s / ~100-118 kata, variasi cameraAngle, lightMode valid, onScreenLabel singkat maks 4 kata/30 karakter hanya di 4-7 scene kunci tanpa emoji, fakta akurat tanpa kata "murni" yang tidak tepat atau analogi menyesatkan).`,
    },
  ];
}

export function buildSocialPackPrompt({ topic, title, hook, narrationScript }) {
  return [
    {
      role: "system",
      content:
        "Kamu adalah Social Media Strategist untuk kanal edukasi 'Kok Iso Yo?' (YouTube Shorts, Facebook Reels, Instagram Reels). " +
        "Gunakan Bahasa Indonesia kasual-cerdas, hindari judul akademis, dan balas HANYA dengan JSON valid ketat (tanpa markdown fence, tanpa trailing comma, dan tanpa teks di luar JSON).",
    },
    {
      role: "user",
      content: `Buat paket copywriting multi-platform dari naskah Shorts 50–65 detik berikut:
Topik: ${topic}
Judul: ${title}
Hook: ${hook}
Naskah: ${narrationScript}

Format JSON wajib:
{
  "youtube": {
    "title": "Judul YouTube Shorts menarik non-akademis maks 85 karakter + #Shorts",
    "description": "Deskripsi singkat 2-3 kalimat + pertanyaan diskusi + CTA subscribe",
    "tags": ["kokisoyo", "edukasi", "sains", "faktaunik", "shorts"],
    "categoryId": "27",
    "privacyStatus": "private"
  },
  "facebook": {
    "title": "Judul singkat Facebook Reels maks 80 karakter",
    "description": "Caption engaging untuk Facebook Reels + 3-5 hashtag relevan"
  },
  "instagram": {
    "caption": "Caption Instagram Reels menarik dengan line break rapi + 5-8 hashtag relevan",
    "firstComment": "Komentar pancingan diskusi untuk audience"
  }
}`,
    },
  ];
}

function renderScriptMarkdown(scriptData, meta) {
  const scenesMd = (scriptData.scenes || [])
    .map(
      (s, i) =>
        `### ${i + 1}. ${s.id || `scene_${String(i + 1).padStart(2, "0")}`} (${s.durationSec || 3}s · \`${s.beat || "-"}\` · \`${s.cameraAngle || "-"}\` · \`${s.lightMode || "-"}\`)\n` +
        `- **Narasi:** ${s.narration || ""}\n` +
        `- **Visual (2.5D-in-3D):** ${s.visualCue || ""}\n` +
        `- **Kamera:** ${s.cameraNote || ""}\n` +
        `- **On-Screen Label:** ${s.onScreenLabel ? `\`${s.onScreenLabel}\`` : "_(tidak ada — anti-subtitle)_"}\n`
    )
    .join("\n");

  const factsMd = (scriptData.factCheckNotes || []).map((f) => `- ${f}`).join("\n");
  const val = meta.validation;
  const valSummary = val
    ? `- **Editorial Validation:** \`${val.passed ? "PASSED" : "FAILED"}\` (Total Scene: \`${val.metrics?.totalSceneDurationSec}s\`, Estimasi Baca Narasi: \`${val.metrics?.narrationEstimate?.estimatedSec}s\`, Kata: \`${val.metrics?.narrationEstimate?.wordCount}\`, Suku Kata: \`${val.metrics?.narrationEstimate?.syllableCount}\`, Scene: \`${val.metrics?.sceneCount}\`)\n`
    : "";

  return `# ${scriptData.title || meta.topic}

- **Slug:** \`${meta.slug}\`
- **Gaya Visual:** ${meta.style || DEFAULT_VISUAL_STYLE}
- **Route Script (PREMIUM):** \`${meta.scriptRoute?.provider || "dry-run"}\` / \`${meta.scriptRoute?.model || "dry-run"}\`
- **Route Social Pack (STANDARD):** \`${meta.socialRoute?.provider || "dry-run"}\` / \`${meta.socialRoute?.model || "dry-run"}\`
${valSummary}- **Generated At:** ${meta.generatedAt}

## Hook (0–2s)
${scriptData.hook || ""}

## Struktur Cerita (Tuntas 1 Video)
- **Pembukaan:** ${scriptData.storyArc?.opening || "-"}
- **Pengembangan:** ${scriptData.storyArc?.development || "-"}
- **Penyelesaian:** ${scriptData.storyArc?.resolution || "-"}

## Master Voice-Over Script
${scriptData.narrationScript || ""}

## Scene Breakdown (Ritme 2–4 Detik)
${scenesMd}

## Fact-Check Notes
${factsMd}
`;
}

function buildDryRunScript(topic) {
  const scenes = [
    {
      id: "scene_01",
      beat: "opening",
      durationSec: 2,
      narration: "Kok iso yo ini bisa terjadi?",
      visualCue: "Wide 2.5D-in-3D cerah ber-outline, karakter utama menunjuk objek hero.",
      cameraAngle: "low_angle",
      cameraNote: "Dolly-in cepat",
      lightMode: "day",
      onScreenLabel: null,
    },
    ...Array.from({ length: 16 }, (_, idx) => {
      const n = idx + 2;
      const beat = n <= 3 ? "opening" : n <= 14 ? "development" : "resolution";
      const angles = ["wide", "medium", "close_up", "top_down", "high_angle", "extreme_close_up"];
      const lightMode = n <= 7 ? "day" : n <= 12 ? "golden" : "night";
      return {
        id: `scene_${String(n).padStart(2, "0")}`,
        beat,
        durationSec: 3.5,
        narration: `Simulasi narasi padat bagian ${n} menjelaskan proses ini.`,
        visualCue: `Adegan 2.5D-in-3D prosedural segmen ${n} dengan pergerakan mekanis deterministik.`,
        cameraAngle: angles[idx % angles.length],
        cameraNote: "Push-in halus 0.25%/f",
        lightMode,
        onScreenLabel: n === 5 ? "PROSES UTAMA" : n === 11 ? "100% EFEKTIF" : null,
      };
    }),
  ];

  return {
    title: `Kenapa ${topic.slice(0, 50)}?`,
    hook: "Kok iso yo ini bisa terjadi?",
    storyArc: {
      opening: `Memancing rasa penasaran tentang ${topic}.`,
      development: `Menjelaskan mekanisme inti di balik ${topic} secara visual.`,
      resolution: `Menjawab pertanyaan secara tuntas dengan kesimpulan singkat.`,
    },
    narrationScript: scenes.map((s) => s.narration).join(" "),
    scenes,
    factCheckNotes: [
      "Mode dry-run: validasi struktur editorial tanpa memanggil AI provider.",
      "Fakta riil wajib diisi saat generate mode live.",
    ],
  };
}

export async function runGenerateStage({
  router,
  jobDir,
  slug,
  topic,
  durationSec = EDITORIAL_RULES.targetDurationSec,
  style = DEFAULT_VISUAL_STYLE,
  dryRun = false,
  premiumModel = undefined,
  standardModel = undefined,
  maxEditorialRetries = 1,
}) {
  if (!topic || !String(topic).trim()) {
    throw new Error("Generate stage requires a non-empty `topic`.");
  }

  fs.mkdirSync(jobDir, { recursive: true });
  const generatedAt = new Date().toISOString();

  if (dryRun) {
    const scriptData = buildDryRunScript(topic);
    const validation = validateEditorialPackage(scriptData);
    const socialPack = {
      youtube: {
        title: `${scriptData.title.slice(0, 75)} #Shorts`,
        description: `Simulasi deskripsi YouTube Shorts untuk ${topic}.`,
        tags: ["kokisoyo", "edukasi", "sains", "shorts"],
        categoryId: "27",
        privacyStatus: "private",
      },
      facebook: {
        title: scriptData.title.slice(0, 80),
        description: `Simulasi caption Facebook Reels untuk ${topic}. #KokIsoYo #Edukasi`,
      },
      instagram: {
        caption: `Simulasi caption Instagram Reels untuk ${topic}.\n\n#KokIsoYo #FaktaSains #Reels`,
        firstComment: "Menurut kalian fakta mana yang paling bikin kaget?",
      },
    };

    const scriptJsonPath = path.join(jobDir, "script_master.json");
    const scriptMdPath = path.join(jobDir, "script_master.md");
    const socialJsonPath = path.join(jobDir, "social_pack.json");
    const validationJsonPath = path.join(jobDir, "editorial_validation.json");

    fs.writeFileSync(scriptJsonPath, JSON.stringify(scriptData, null, 2), "utf8");
    fs.writeFileSync(
      scriptMdPath,
      renderScriptMarkdown(scriptData, { slug, topic, style, generatedAt, validation }),
      "utf8"
    );
    fs.writeFileSync(socialJsonPath, JSON.stringify(socialPack, null, 2), "utf8");
    fs.writeFileSync(validationJsonPath, JSON.stringify(validation, null, 2), "utf8");

    return {
      ok: validation.passed,
      dryRun: true,
      scriptData,
      socialPack,
      editorialValidation: validation,
      editorialQaAttempts: 0,
      files: { scriptJsonPath, scriptMdPath, socialJsonPath, validationJsonPath },
      routes: {
        script: { tier: AI_TIERS.PREMIUM, provider: "dry-run", model: premiumModel || "dry-run" },
        social: { tier: AI_TIERS.STANDARD, provider: "dry-run", model: standardModel || "dry-run" },
      },
      usage: { totalTokens: 0 },
    };
  }

  // 1. PREMIUM route: Master Script, Hook, Storyboard & Fact-Check
  const scriptRes = await router.chatCompletion({
    task: "script_master",
    model: premiumModel,
    messages: buildScriptMasterPrompt({ topic, slug, durationSec, style }),
  });

  let parsedScript = extractJsonBlock(scriptRes.content) || {
    title: topic,
    hook: "",
    storyArc: { opening: "", development: "", resolution: "" },
    narrationScript: scriptRes.content,
    scenes: [],
    factCheckNotes: [],
  };

  let validation = validateEditorialPackage(parsedScript);
  let qaTokens = 0;
  let editorialQaAttempts = 0;
  let qaRoute = null;

  // 2. PREMIUM route (Editorial QA auto-polish) if initial draft violates editorial standards
  while (!validation.passed && editorialQaAttempts < maxEditorialRetries) {
    editorialQaAttempts += 1;
    const qaRes = await router.chatCompletion({
      task: "qa_editorial",
      model: premiumModel,
      messages: buildEditorialQaPrompt({
        topic,
        slug,
        scriptData: parsedScript,
        validation,
      }),
    });
    qaTokens += qaRes.usage?.totalTokens || 0;
    qaRoute = qaRes.route || null;

    const repaired = extractJsonBlock(qaRes.content);
    if (repaired && typeof repaired === "object") {
      parsedScript = repaired;
      validation = validateEditorialPackage(parsedScript);
    } else {
      break;
    }
  }

  // 3. STANDARD route: Multi-platform Social Pack (YT, FB, IG) with 1 auto-retry if malformed
  const fallbackSocial = (rawText) => ({
    youtube: {
      title: `${(parsedScript.title || topic).slice(0, 75)} #Shorts`,
      description: String(rawText || "").slice(0, 500),
      tags: ["kokisoyo", "edukasi", "shorts"],
      categoryId: "27",
      privacyStatus: "private",
    },
    facebook: {
      title: (parsedScript.title || topic).slice(0, 80),
      description: String(rawText || "").slice(0, 500),
    },
    instagram: {
      caption: String(rawText || "").slice(0, 1000),
      firstComment: "",
    },
  });

  let socialTokens = 0;
  let socialRes = await router.chatCompletion({
    task: "post_copy",
    model: standardModel,
    messages: buildSocialPackPrompt({
      topic,
      title: parsedScript.title || topic,
      hook: parsedScript.hook || "",
      narrationScript: parsedScript.narrationScript || scriptRes.content,
    }),
  });
  socialTokens += socialRes.usage?.totalTokens || 0;

  let parsedSocial =
    normalizeSocialPack(extractJsonBlock(socialRes.content)) || fallbackSocial(socialRes.content);
  let socialValidation = validateSocialPack(parsedSocial);

  if (!socialValidation.passed) {
    socialRes = await router.chatCompletion({
      task: "post_copy",
      model: standardModel,
      messages: [
        ...buildSocialPackPrompt({
          topic,
          title: parsedScript.title || topic,
          hook: parsedScript.hook || "",
          narrationScript: parsedScript.narrationScript || scriptRes.content,
        }),
        {
          role: "user",
          content: `Perbaiki output sebelumnya (${socialValidation.errors.join("; ")}). Pastikan kunci root JSON persis tiga objek sejajar: "youtube", "facebook", dan "instagram".`,
        },
      ],
    });
    socialTokens += socialRes.usage?.totalTokens || 0;
    parsedSocial =
      normalizeSocialPack(extractJsonBlock(socialRes.content)) || fallbackSocial(socialRes.content);
    socialValidation = validateSocialPack(parsedSocial);
  }

  const scriptJsonPath = path.join(jobDir, "script_master.json");
  const scriptMdPath = path.join(jobDir, "script_master.md");
  const socialJsonPath = path.join(jobDir, "social_pack.json");
  const validationJsonPath = path.join(jobDir, "editorial_validation.json");

  fs.writeFileSync(scriptJsonPath, JSON.stringify(parsedScript, null, 2), "utf8");
  fs.writeFileSync(
    scriptMdPath,
    renderScriptMarkdown(parsedScript, {
      slug,
      topic,
      style,
      generatedAt,
      scriptRoute: scriptRes.route,
      socialRoute: socialRes.route,
      validation,
    }),
    "utf8"
  );
  fs.writeFileSync(socialJsonPath, JSON.stringify(parsedSocial, null, 2), "utf8");
  fs.writeFileSync(
    validationJsonPath,
    JSON.stringify({ ...validation, socialPackValidation: socialValidation }, null, 2),
    "utf8"
  );

  return {
    ok: validation.passed && socialValidation.passed,
    dryRun: false,
    scriptData: parsedScript,
    socialPack: parsedSocial,
    editorialValidation: validation,
    socialPackValidation: socialValidation,
    editorialQaAttempts,
    files: { scriptJsonPath, scriptMdPath, socialJsonPath, validationJsonPath },
    routes: {
      script: scriptRes.route,
      ...(qaRoute ? { editorialQa: qaRoute } : {}),
      social: socialRes.route,
    },
    usage: {
      scriptTokens: scriptRes.usage?.totalTokens || 0,
      editorialQaTokens: qaTokens,
      socialTokens,
      totalTokens:
        (scriptRes.usage?.totalTokens || 0) +
        qaTokens +
        socialTokens,
    },
  };
}
