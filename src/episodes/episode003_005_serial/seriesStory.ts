// Shared Timeline & Storyboard Shot Definitions for Episodes 003, 004, and 005
// Audio source (read-only): public/episodes/episode002_badak_jawa/voiceover.mp3 (328.07s total @ 30 FPS)
// Zero phoneme clipping: cuts strictly inside verified silence spans (92.15s, 182.15s, 257.05s).

export const SERIES_FPS = 30;
export const BRIDGE_OPEN_FRAMES = 60; // 2.00s visual bridge before VO starts
export const BRIDGE_CLOSE_FRAMES = 60; // 2.00s visual bridge after VO finishes

export type Series3DSceneMode =
  | "ep3_habitat_alert"
  | "ep3_mist_sensitive"
  | "ep3_individual_quiet"
  | "ep4_jrsca_managed"
  | "ep4_canopy_depth"
  | "ep5_afternoon_dilemma"
  | "ep5_langkap_shade"
  | "ep5_golden_closing";

export interface SeriesShot {
  id: string;
  num: number;
  start: number;
  end: number;
  kind: "3d" | "2d";
  sceneMode?: Series3DSceneMode;
  title: string;
  veilBg: string;
  fadeInFrames: number;
  fadeOutFrames: number;
}

export interface EpisodeAudioSlice {
  trimBefore: number;
  trimAfter: number;
  voFrames: number;
  totalFrames: number;
}

export const EP003_AUDIO: EpisodeAudioSlice = {
  trimBefore: 2765, // 92.15s
  trimAfter: 5465, // 182.15s
  voFrames: 2700, // 90.00s
  totalFrames: BRIDGE_OPEN_FRAMES + 2700 + BRIDGE_CLOSE_FRAMES, // 2820 frames (94.00s)
};

export const EP004_AUDIO: EpisodeAudioSlice = {
  trimBefore: 5465, // 182.15s
  trimAfter: 7712, // 257.05s
  voFrames: 2247, // 74.90s
  totalFrames: BRIDGE_OPEN_FRAMES + 2247 + BRIDGE_CLOSE_FRAMES, // 2367 frames (78.90s)
};

export const EP005_AUDIO: EpisodeAudioSlice = {
  trimBefore: 7712, // 257.05s
  trimAfter: 9843, // 328.07s
  voFrames: 2131, // 71.03s
  totalFrames: BRIDGE_OPEN_FRAMES + 2131 + BRIDGE_CLOSE_FRAMES, // 2251 frames (75.03s)
};

// Episode 003 — 15 Shots (0..2820 frames | VO starts at frame 60 = 92.15s)
export const EP003_SHOTS: SeriesShot[] = [
  { id: "E3_S01", num: 1, start: 0, end: 60, kind: "2d", title: "Opening Card Bagian 2/4", veilBg: "#101813", fadeInFrames: 8, fadeOutFrames: 4 },
  { id: "E3_S02", num: 2, start: 60, end: 260, kind: "2d", title: "Alasan Second Wild Population", veilBg: "#ECE8DF", fadeInFrames: 4, fadeOutFrames: 0 },
  { id: "E3_S03", num: 3, start: 260, end: 426, kind: "2d", title: "Kajian Alas Purwo (Belum Final)", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E3_S04", num: 4, start: 426, end: 580, kind: "2d", title: "Kemungkinan Baluran (Wacana)", veilBg: "#101813", fadeInFrames: 0, fadeOutFrames: 6 },
  { id: "E3_S05", num: 5, start: 580, end: 760, kind: "3d", sceneMode: "ep3_habitat_alert", title: "Sensitivitas Ekologis Badak Jawa", veilBg: "#101813", fadeInFrames: 6, fadeOutFrames: 5 },
  { id: "E3_S06", num: 6, start: 760, end: 1020, kind: "2d", title: "6 Syarat Habitat Spesifik", veilBg: "#ECE8DF", fadeInFrames: 5, fadeOutFrames: 0 },
  { id: "E3_S07", num: 7, start: 1020, end: 1260, kind: "2d", title: "Risiko Translokasi Bertahap", veilBg: "#101813", fadeInFrames: 0, fadeOutFrames: 6 },
  { id: "E3_S08", num: 8, start: 1260, end: 1460, kind: "3d", sceneMode: "ep3_mist_sensitive", title: "Peristiwa Sensitif Konservasi", veilBg: "#101813", fadeInFrames: 6, fadeOutFrames: 5 },
  { id: "E3_S09", num: 9, start: 1460, end: 1690, kind: "2d", title: "Kronologi Musofa (Internal TNUK-JRSCA)", veilBg: "#ECE8DF", fadeInFrames: 5, fadeOutFrames: 0 },
  { id: "E3_S10", num: 10, start: 1690, end: 1860, kind: "2d", title: "Kekhawatiran Awal vs Pembuktian Medis", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E3_S11", num: 11, start: 1860, end: 2175, kind: "2d", title: "Temuan Nekropsi SKHB IPB University", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E3_S12", num: 12, start: 2175, end: 2385, kind: "2d", title: "Korelasi Waktu vs Penyebab Kematian", veilBg: "#101813", fadeInFrames: 0, fadeOutFrames: 6 },
  { id: "E3_S13", num: 13, start: 2385, end: 2580, kind: "3d", sceneMode: "ep3_individual_quiet", title: "Kerumitan Penanganan Satwa Langka", veilBg: "#101813", fadeInFrames: 6, fadeOutFrames: 5 },
  { id: "E3_S14", num: 14, start: 2580, end: 2760, kind: "2d", title: "Nilai Kritis Setiap Individu (~91 Titik)", veilBg: "#ECE8DF", fadeInFrames: 5, fadeOutFrames: 0 },
  { id: "E3_S15", num: 15, start: 2760, end: 2820, kind: "2d", title: "Closing Bridge Bagian 3/4", veilBg: "#0F1713", fadeInFrames: 4, fadeOutFrames: 10 },
];

// Episode 004 — 12 Shots (0..2367 frames | VO starts at frame 60 = 182.15s)
export const EP004_SHOTS: SeriesShot[] = [
  { id: "E4_S01", num: 1, start: 0, end: 60, kind: "2d", title: "Opening Card Bagian 3/4", veilBg: "#101813", fadeInFrames: 8, fadeOutFrames: 4 },
  { id: "E4_S02", num: 2, start: 60, end: 325, kind: "2d", title: "Ancaman Genetik Populasi Tunggal", veilBg: "#ECE8DF", fadeInFrames: 4, fadeOutFrames: 0 },
  { id: "E4_S03", num: 3, start: 325, end: 550, kind: "2d", title: "Peluang Perkawinan Kekerabatan", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E4_S04", num: 4, start: 550, end: 765, kind: "2d", title: "Model Konseptual Penurunan Genetik", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E4_S05", num: 5, start: 765, end: 1015, kind: "2d", title: "Data Kemenhut ~55% Betina Tidak Produktif", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E4_S06", num: 6, start: 1015, end: 1240, kind: "2d", title: "Peta Lokal JRSCA Blok Gunung Honje", veilBg: "#101813", fadeInFrames: 0, fadeOutFrames: 6 },
  { id: "E4_S07", num: 7, start: 1240, end: 1535, kind: "3d", sceneMode: "ep4_jrsca_managed", title: "Pengelolaan Kesehatan & Genetik Internal", veilBg: "#101813", fadeInFrames: 6, fadeOutFrames: 5 },
  { id: "E4_S08", num: 8, start: 1535, end: 1735, kind: "2d", title: "Batasan Cakupan JRSCA vs Habitat Kedua", veilBg: "#101813", fadeInFrames: 5, fadeOutFrames: 6 },
  { id: "E4_S09", num: 9, start: 1735, end: 1935, kind: "3d", sceneMode: "ep4_canopy_depth", title: "Bukan Sekadar Hutan Terlihat Cocok", veilBg: "#101813", fadeInFrames: 6, fadeOutFrames: 5 },
  { id: "E4_S10", num: 10, start: 1935, end: 2140, kind: "2d", title: "Syarat Bukti Daya Topang Jangka Panjang", veilBg: "#ECE8DF", fadeInFrames: 5, fadeOutFrames: 0 },
  { id: "E4_S11", num: 11, start: 2140, end: 2307, kind: "2d", title: "Pertanyaan Akuntabilitas Jika Gagal", veilBg: "#101813", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E4_S12", num: 12, start: 2307, end: 2367, kind: "2d", title: "Closing Bridge Bagian 4/4", veilBg: "#0F1713", fadeInFrames: 4, fadeOutFrames: 10 },
];

// Episode 005 — 12 Shots (0..2251 frames | VO starts at frame 60 = 257.05s)
export const EP005_SHOTS: SeriesShot[] = [
  { id: "E5_S01", num: 1, start: 0, end: 60, kind: "2d", title: "Opening Card Bagian 4/4 Penutup", veilBg: "#101813", fadeInFrames: 8, fadeOutFrames: 4 },
  { id: "E5_S02", num: 2, start: 60, end: 240, kind: "3d", sceneMode: "ep5_afternoon_dilemma", title: "Risiko Bertahan di Ujung Kulon", veilBg: "#101813", fadeInFrames: 4, fadeOutFrames: 4 },
  { id: "E5_S03", num: 3, start: 240, end: 470, kind: "3d", sceneMode: "ep5_langkap_shade", title: "Tekanan Ekosistem & Invasi Langkap", veilBg: "#101813", fadeInFrames: 4, fadeOutFrames: 6 },
  { id: "E5_S04", num: 4, start: 470, end: 780, kind: "2d", title: "Sintesis Dilema Dua Sisi", veilBg: "#ECE8DF", fadeInFrames: 6, fadeOutFrames: 0 },
  { id: "E5_S05", num: 5, start: 780, end: 955, kind: "2d", title: "Kerangka Pertimbangan Keputusan Besar", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E5_S06", num: 6, start: 955, end: 1060, kind: "2d", title: "Pertanyaan 01: Kelayakan Lokasi Baru", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E5_S07", num: 7, start: 1060, end: 1160, kind: "2d", title: "Pertanyaan 02: Risiko Individu Badak", veilBg: "#ECE8DF", fadeInFrames: 0, fadeOutFrames: 0 },
  { id: "E5_S08", num: 8, start: 1160, end: 1325, kind: "2d", title: "Pertanyaan 03: Perlindungan Habitat Asli", veilBg: "#101813", fadeInFrames: 0, fadeOutFrames: 6 },
  { id: "E5_S09", num: 9, start: 1325, end: 1680, kind: "3d", sceneMode: "ep5_golden_closing", title: "Taruhan Masa Depan Spesies Tunggal", veilBg: "#101813", fadeInFrames: 6, fadeOutFrames: 6 },
  { id: "E5_S10", num: 10, start: 1680, end: 1885, kind: "2d", title: "Kepunahan Tidak Dapat Dibalik", veilBg: "#ECE8DF", fadeInFrames: 6, fadeOutFrames: 0 },
  { id: "E5_S11", num: 11, start: 1885, end: 2191, kind: "2d", title: "Diskusi Penonton Netral & Komentar", veilBg: "#101813", fadeInFrames: 0, fadeOutFrames: 4 },
  { id: "E5_S12", num: 12, start: 2191, end: 2251, kind: "2d", title: "Closing Credit & CC-BY-4.0 Attribution", veilBg: "#0F1713", fadeInFrames: 4, fadeOutFrames: 12 },
];

export function getSeriesShotAtFrame(shots: SeriesShot[], frame: number): SeriesShot {
  for (let i = 0; i < shots.length; i++) {
    if (frame < shots[i].end) return shots[i];
  }
  return shots[shots.length - 1];
}
