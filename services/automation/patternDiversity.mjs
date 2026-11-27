/**
 * Anti-Repetition & Creative Pattern Diversity Engine for Kok Iso Yo?
 *
 * Prevents "repetitious / mass-produced AI content" signals by ensuring consecutive
 * episodes NEVER share the same storytelling archetype, opening hook style,
 * dominant lighting mood, music bed preset/seed, or title phrasing.
 */

export const STORY_ARCHETYPES = Object.freeze([
  {
    id: "direct_contradiction",
    label: "Kontradiksi Langsung",
    hookRule: "Mulai dengan 1 kalimat fakta kontradiktif yang menabrak intuisi umum (tanpa kata tanya 'Tahukah kamu').",
    pacingRule: "Pernyataan mengejutkan -> kenapa intuisi kita salah -> bukti mekanisme fisika/biologi -> payoff konkret.",
  },
  {
    id: "scale_comparison",
    label: "Perbandingan Skala Ekstrem",
    hookRule: "Mulai dengan perbandingan angka/ukuran ekstrem benda sehari-hari vs fenomena ekstrem.",
    pacingRule: "Skala visual raksasa/mikro -> zoom-in ke komponen kunci -> simulasi beban nyata -> kesimpulan tajam.",
  },
  {
    id: "what_if_failure",
    label: "Skenario Gagal & Solusi Rekayasa",
    hookRule: "Mulai dengan menunjukkan apa yang terjadi jika sistem pengamannya gagal/dihilangkan di detik 0-2.",
    pacingRule: "Konsekuensi kegagalan -> bedah fitur pengaman langkah demi langkah -> uji kondisi ekstrem -> hasil aman.",
  },
  {
    id: "layer_cutaway",
    label: "Bedah Lapisan (Cutaway Dokumenter)",
    hookRule: "Mulai dari tampilan luar yang terlihat biasa saja, lalu belah menembus lapisan dalamnya.",
    pacingRule: "Luar tampak sederhana -> kupas lapisan 1, 2, 3 -> interaksi antar komponen -> fungsi utuh.",
  },
  {
    id: "micro_pov",
    label: "Sudut Pandang Mikro / Kamera Menyelam",
    hookRule: "Bawa kamera masuk ke celah milimeter, bawah air, atau ruang sempit tempat reaksi terjadi.",
    pacingRule: "POV ruang sempit -> gaya fisik yang bekerja di titik kontak -> efek berantai ke skala besar -> payoff.",
  },
  {
    id: "engineering_puzzle",
    label: "Teka-Teki Desain & Solusi Cerdas",
    hookRule: "Mulai dari dilema teknis nyata yang tampak mustahil diselesaikan dengan cara biasa.",
    pacingRule: "Batas fisik masalah -> kenapa cara biasa gagal -> trik desain cerdas -> pembuktian di dunia nyata.",
  },
]);

export const MUSIC_PRESETS = Object.freeze(["curious_doc", "march_tension", "wonder_calm"]);
export const LIGHTING_MOODS = Object.freeze([
  "day_outdoor",
  "golden_hour",
  "night_industrial",
  "studio_macro",
  "underwater_deep",
]);
export const OPENING_CAMERAS = Object.freeze(["wide", "closeup", "medium"]);

function pickDifferent(pool, recentValues = [], fallbackIdx = 0) {
  const recentSet = new Set(recentValues.filter(Boolean));
  const fresh = pool.filter((item) => {
    const key = typeof item === "string" ? item : item.id;
    return !recentSet.has(key);
  });
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[fallbackIdx % candidates.length];
}

function inferAmbience(topic = "") {
  const t = String(topic || "").toLowerCase();
  if (/(laut|sungai|air|tsunami|kapal|ikan|ombak|hujan|jembatan)/.test(t)) return "river";
  if (/(hutan|pohon|daun|hewan|burung|serangga|kucing|alam)/.test(t)) return "forest";
  if (/(pesawat|angin|petir|langit|gunung|kereta|jembatan gantung|tinggi)/.test(t)) return "wind";
  return "none";
}

export function selectEpisodePattern(state, topic = "") {
  const recent = Array.isArray(state?.recentPatterns) ? state.recentPatterns.slice(-4) : [];
  const seedBase = (state?.publishedHistory?.length || 0) + (state?.stock?.length || 0) + (state?.topics?.length || 0) + 1;

  const archetype = pickDifferent(
    STORY_ARCHETYPES,
    recent.map((r) => r.archetypeId),
    seedBase
  );
  const musicPreset = pickDifferent(
    MUSIC_PRESETS,
    recent.map((r) => r.musicPreset),
    seedBase
  );
  const dominantMood = pickDifferent(
    LIGHTING_MOODS,
    recent.map((r) => r.dominantMood),
    seedBase + 1
  );
  const openingCamera = pickDifferent(
    OPENING_CAMERAS,
    recent.map((r) => r.openingCamera),
    seedBase + 2
  );

  const recentTitles = [
    ...(state?.publishedHistory || []).map((h) => h.title),
    ...(state?.stock || []).map((s) => s.title),
    ...(state?.topics || []).map((t) => t.topic),
  ]
    .filter(Boolean)
    .slice(-6);

  return {
    archetype,
    musicPreset,
    ambience: inferAmbience(topic),
    musicSeed: 1000 + ((Date.now() + seedBase * 97) % 89_000),
    dominantMood,
    openingCamera,
    recentTitles,
  };
}

export function recordEpisodePattern(state, { slug, pattern }) {
  if (!Array.isArray(state.recentPatterns)) state.recentPatterns = [];
  state.recentPatterns.push({
    slug,
    archetypeId: pattern.archetype.id,
    musicPreset: pattern.musicPreset,
    dominantMood: pattern.dominantMood,
    openingCamera: pattern.openingCamera,
    recordedAt: new Date().toISOString(),
  });
  if (state.recentPatterns.length > 12) {
    state.recentPatterns = state.recentPatterns.slice(-12);
  }
}

/**
 * Enforces STRICT <= maxShotFrames (default 120 frames = 4.0s @ 30fps) on every shot.
 * Any shot longer than maxShotFrames is automatically subdivided into dynamic camera sub-shots
 * (e.g. wide -> medium -> closeup) so frame pacing never violates the 4-second ceiling.
 */
export function allocateStrictShots(rawShots, totalFrames, fps = 30, maxShotSec = 4.0) {
  const maxFrames = Math.max(45, Math.round(maxShotSec * fps));
  const minFrames = Math.max(30, Math.round(2.0 * fps));

  // Pre-subdivide shot list if totalFrames / rawShots.length would exceed maxFrames
  const minRequiredShots = Math.max(rawShots.length, Math.ceil(totalFrames / maxFrames));
  const expanded = rawShots.map((s, idx) => ({
    ...s,
    _origIdx: idx,
    _weight: Math.max(2, Number(s.durationSec) || 3),
  }));

  const cameraCycle = ["wide", "medium", "closeup"];
  let subCounter = 1;
  while (expanded.length < minRequiredShots) {
    // Split the longest-weighted shot in half with a fresh camera angle
    let maxIdx = 0;
    for (let i = 1; i < expanded.length; i += 1) {
      if (expanded[i]._weight > expanded[maxIdx]._weight) maxIdx = i;
    }
    const target = expanded[maxIdx];
    const halfWeight = Math.max(1.5, target._weight / 2);
    const nextCam = cameraCycle[(cameraCycle.indexOf(target.cameraType || "wide") + 1) % cameraCycle.length];
    const partA = { ...target, _weight: halfWeight };
    const partB = {
      ...target,
      id: `${target.id || "S"}_b${subCounter++}`,
      name: `${target.name || "Detail"} (Angle ${nextCam})`,
      cameraType: nextCam,
      _weight: halfWeight,
    };
    expanded.splice(maxIdx, 1, partA, partB);
  }

  const totalWeight = expanded.reduce((acc, s) => acc + s._weight, 0);
  const frameLengths = expanded.map((s) =>
    Math.min(maxFrames, Math.max(minFrames, Math.round((s._weight / totalWeight) * totalFrames)))
  );

  // Rebalance diff so sum === totalFrames while keeping every shot within [minFrames, maxFrames]
  let currentSum = frameLengths.reduce((a, b) => a + b, 0);
  let diff = totalFrames - currentSum;
  let guard = 0;
  while (diff !== 0 && guard < 2000) {
    guard += 1;
    let changed = false;
    for (let i = expanded.length - 1; i >= 0 && diff !== 0; i -= 1) {
      if (diff > 0 && frameLengths[i] < maxFrames) {
        const add = Math.min(diff, maxFrames - frameLengths[i]);
        frameLengths[i] += add;
        diff -= add;
        changed = true;
      } else if (diff < 0 && frameLengths[i] > minFrames) {
        const sub = Math.min(-diff, frameLengths[i] - minFrames);
        frameLengths[i] -= sub;
        diff += sub;
        changed = true;
      }
    }
    if (!changed) break;
  }

  let cursor = 0;
  return expanded.map((s, idx) => {
    const start = cursor;
    const end = idx === expanded.length - 1 ? totalFrames : cursor + frameLengths[idx];
    cursor = end;
    return {
      id: s.id || `S${String(idx + 1).padStart(2, "0")}`,
      name: s.name || `Shot ${idx + 1}`,
      start,
      end,
      mood: s.mood || "day_outdoor",
      cameraType: s.cameraType || cameraCycle[idx % cameraCycle.length],
      visualBrief: s.visualBrief || "",
      onScreenLabel: s.onScreenLabel || null,
    };
  });
}
