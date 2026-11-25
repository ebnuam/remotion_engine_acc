export const TOTAL_FRAMES = 3625;

export type SceneMode =
  | "scene1_hook"
  | "scene2_map"
  | "scene3_krakatau"
  | "scene4_truck"
  | "scene5_musofa"
  | "scene6_distance"
  | "scene7_adaptation"
  | "scene8_langkap"
  | "scene9_conservation"
  | "scene10_outro";

export interface ShotSpec {
  id: number;
  start: number;
  end: number;
  mode: SceneMode;
  badge: string;
  camZoom: [number, number];
  camX: [number, number];
  camY: [number, number];
}

/**
 * 43 Distinct Visual Shots (~1.8s–3.6s each) mapped strictly to the 33 Whisper cues in subtitles.tsx.
 * Every shot changes framing, viewpoint, close-up/wide scale, or mechanism—never sitting static!
 */
export const SHOTS: ShotSpec[] = [
  // ================= SCENE 1: HOOK [0, 492) =================
  { id: 1, start: 0, end: 78, mode: "scene1_hook", badge: "UJUNG KULON", camZoom: [1.08, 1.0], camX: [0, 0], camY: [-30, 0] },
  { id: 2, start: 78, end: 156, mode: "scene1_hook", badge: "TERSISA PULUHAN EKOR", camZoom: [1.0, 1.05], camX: [16, -12], camY: [0, 6] },
  { id: 3, start: 156, end: 234, mode: "scene1_hook", badge: "WACANA RELOKASI", camZoom: [1.0, 1.06], camX: [-12, 10], camY: [0, -8] },
  { id: 4, start: 234, end: 306, mode: "scene1_hook", badge: "TEMPAT BARU?", camZoom: [1.05, 1.0], camX: [14, -14], camY: [0, 0] },
  { id: 5, start: 306, end: 372, mode: "scene1_hook", badge: "PENOLAKAN AHLI", camZoom: [1.04, 1.0], camX: [0, 0], camY: [10, 0] },
  { id: 6, start: 372, end: 432, mode: "scene1_hook", badge: "DITOLAK KERAS", camZoom: [1.0, 1.07], camX: [0, -8], camY: [0, -6] },
  { id: 7, start: 432, end: 492, mode: "scene1_hook", badge: "KOK ISO YO?", camZoom: [1.0, 1.10], camX: [-10, 10], camY: [0, 8] },

  // ================= SCENE 2: RELOKASI PETA JAWA [492, 942) =================
  { id: 8, start: 492, end: 600, mode: "scene2_map", badge: "TITIK AWAL: BANTEN", camZoom: [1.02, 1.0], camX: [14, 0], camY: [0, 0] },
  { id: 9, start: 600, end: 708, mode: "scene2_map", badge: "LINTAS PULAU JAWA", camZoom: [1.0, 1.03], camX: [0, -10], camY: [0, 0] },
  { id: 10, start: 708, end: 828, mode: "scene2_map", badge: "ALAS PURWO, JATIM", camZoom: [1.0, 1.05], camX: [-8, 0], camY: [0, 6] },
  { id: 11, start: 828, end: 888, mode: "scene2_map", badge: "TUJUAN MULIA", camZoom: [1.04, 1.0], camX: [0, 0], camY: [6, 0] },
  { id: 12, start: 888, end: 942, mode: "scene2_map", badge: "HABITAT KEDUA", camZoom: [1.0, 1.04], camX: [0, 0], camY: [0, -6] },

  // ================= SCENE 3: ANAK KRAKATAU & TSUNAMI [942, 1200) =================
  { id: 13, start: 942, end: 1018, mode: "scene3_krakatau", badge: "ANAK KRAKATAU", camZoom: [1.0, 1.06], camX: [0, 0], camY: [14, -8] },
  { id: 14, start: 1018, end: 1092, mode: "scene3_krakatau", badge: "LONGSOR & DISPLASI", camZoom: [1.04, 1.0], camX: [-14, 12], camY: [0, 8] },
  { id: 15, start: 1092, end: 1200, mode: "scene3_krakatau", badge: "CEGAH KEPUNAHAN", camZoom: [1.05, 1.0], camX: [-16, 8], camY: [0, 0] },

  // ================= SCENE 4: RISIKO PEMINDAHAN [1200, 1608) =================
  { id: 16, start: 1200, end: 1295, mode: "scene4_truck", badge: "BUKAN TERNAK", camZoom: [1.03, 1.0], camX: [0, 0], camY: [0, 0] },
  { id: 17, start: 1295, end: 1386, mode: "scene4_truck", badge: "PROSES ANGKUT", camZoom: [1.0, 1.05], camX: [-16, 16], camY: [0, 0] },
  { id: 18, start: 1386, end: 1440, mode: "scene4_truck", badge: "TARUHAN NYAWA", camZoom: [1.06, 1.0], camX: [8, -8], camY: [10, 0] },
  { id: 19, start: 1440, end: 1520, mode: "scene4_truck", badge: "SATWA PEMALU", camZoom: [1.0, 1.06], camX: [0, 0], camY: [0, 8] },
  { id: 20, start: 1520, end: 1608, mode: "scene4_truck", badge: "RENTAN STRES BERAT", camZoom: [1.05, 1.0], camX: [0, 0], camY: [6, 0] },

  // ================= SCENE 5: KASUS MUSOFA [1608, 1842) =================
  { id: 21, start: 1608, end: 1644, mode: "scene5_musofa", badge: "BUKTI NYATA", camZoom: [1.05, 1.0], camX: [0, 0], camY: [-10, 0] },
  { id: 22, start: 1644, end: 1745, mode: "scene5_musofa", badge: "KASUS MUSOFA", camZoom: [1.0, 1.05], camX: [12, -12], camY: [0, 4] },
  { id: 23, start: 1745, end: 1842, mode: "scene5_musofa", badge: "MATI PASCA PINDAH", camZoom: [1.04, 1.0], camX: [-8, 0], camY: [0, 0] },

  // ================= SCENE 6: PERBANDINGAN JARAK [1842, 2076) =================
  { id: 24, start: 1842, end: 1930, mode: "scene6_distance", badge: "PINDAH LOKAL < 15 KM", camZoom: [1.0, 1.04], camX: [8, -6], camY: [0, 0] },
  { id: 25, start: 1930, end: 1995, mode: "scene6_distance", badge: "DALAM KAWASAN", camZoom: [1.03, 1.0], camX: [-6, 0], camY: [0, 0] },
  { id: 26, start: 1995, end: 2076, mode: "scene6_distance", badge: "JAUH ~1.000 KM", camZoom: [1.02, 1.0], camX: [0, 0], camY: [0, 0] },

  // ================= SCENE 7: ADAPTASI HABITAT [2076, 2520) =================
  { id: 27, start: 2076, end: 2142, mode: "scene7_adaptation", badge: "STRES PERJALANAN", camZoom: [1.0, 1.05], camX: [-12, 12], camY: [0, 0] },
  { id: 28, start: 2142, end: 2240, mode: "scene7_adaptation", badge: "MAYORITAS GAGAL", camZoom: [1.04, 1.0], camX: [0, 0], camY: [-8, 0] },
  { id: 29, start: 2240, end: 2334, mode: "scene7_adaptation", badge: "HABITAT ASING", camZoom: [1.0, 1.05], camX: [14, -14], camY: [0, 4] },
  { id: 30, start: 2334, end: 2442, mode: "scene7_adaptation", badge: "POLA MAKAN TERGANGGU", camZoom: [1.05, 1.0], camX: [-10, 10], camY: [6, 0] },
  { id: 31, start: 2442, end: 2520, mode: "scene7_adaptation", badge: "GAGAL BERKEMBANG BIAK", camZoom: [1.0, 1.05], camX: [0, 0], camY: [0, 6] },

  // ================= SCENE 8: INVASI LANGKAP [2520, 2928) =================
  { id: 32, start: 2520, end: 2605, mode: "scene8_langkap", badge: "PR UJUNG KULON", camZoom: [1.04, 1.0], camX: [14, -12], camY: [0, 0] },
  { id: 33, start: 2605, end: 2694, mode: "scene8_langkap", badge: "INVASI LANGKAP", camZoom: [1.0, 1.05], camX: [0, 0], camY: [18, -18] },
  { id: 34, start: 2694, end: 2826, mode: "scene8_langkap", badge: "CAHAYA TERBLOKIR", camZoom: [1.04, 1.0], camX: [-10, 10], camY: [-10, 8] },
  { id: 35, start: 2826, end: 2928, mode: "scene8_langkap", badge: "ZONA PENYANGGA", camZoom: [1.0, 1.05], camX: [12, -16], camY: [0, 0] },

  // ================= SCENE 9: KONSERVASI [2928, 3372) =================
  { id: 36, start: 2928, end: 3000, mode: "scene9_conservation", badge: "PANDANGAN AHLI", camZoom: [1.04, 1.0], camX: [0, 0], camY: [-8, 0] },
  { id: 37, start: 3000, end: 3108, mode: "scene9_conservation", badge: "HINDARI RISIKO FATAL", camZoom: [1.0, 1.05], camX: [-8, 8], camY: [0, 4] },
  { id: 38, start: 3108, end: 3210, mode: "scene9_conservation", badge: "FOKUS ANGGARAN & SDM", camZoom: [1.04, 1.0], camX: [12, -10], camY: [0, 0] },
  { id: 39, start: 3210, end: 3290, mode: "scene9_conservation", badge: "PERBAIKI & JAGA", camZoom: [1.0, 1.05], camX: [-12, 12], camY: [0, 0] },
  { id: 40, start: 3290, end: 3372, mode: "scene9_conservation", badge: "PERKUAT HABITAT", camZoom: [1.0, 1.06], camX: [-14, 14], camY: [0, 6] },

  // ================= SCENE 10: OUTRO [3372, 3625) =================
  { id: 41, start: 3372, end: 3414, mode: "scene10_outro", badge: "MENURUTMU GIMANA?", camZoom: [1.05, 1.0], camX: [0, 0], camY: [0, 0] },
  { id: 42, start: 3414, end: 3498, mode: "scene10_outro", badge: "OPSI A: PINDAH", camZoom: [1.0, 1.04], camX: [10, -8], camY: [0, 0] },
  { id: 43, start: 3498, end: 3625, mode: "scene10_outro", badge: "TULIS DI KOMENTAR", camZoom: [1.0, 1.04], camX: [-8, 0], camY: [0, -6] },
];

export const getActiveShot = (frame: number): ShotSpec => {
  return SHOTS.find((s) => frame >= s.start && frame < s.end) ?? SHOTS[SHOTS.length - 1];
};
