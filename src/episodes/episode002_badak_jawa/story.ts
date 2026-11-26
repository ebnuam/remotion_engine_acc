// Timeline & 17-Shot Storyboard Definition for Episode 002 (Serial Badak Jawa — Bagian 1/4)
// Format: 1080x1920 @ 30 FPS, Total 2840 frames (94.67s)
// Voiceover source: public/episodes/episode002_badak_jawa/voiceover.mp3
// Audio slice: 00:00.00 – 01:32.15 (frame 0..2765, natural silence pause 91.86s–92.42s), plus 2.50s Closing Bridge.

export const EP002_FPS = 30;
export const EP002_VO_END_FRAME = 2765; // 92.15s * 30fps
export const EP002_TOTAL_FRAMES = 2840; // 94.67s * 30fps (S01..S17)

export type Ep002ShotId =
  | "S01"
  | "S02"
  | "S03"
  | "S04"
  | "S05"
  | "S06"
  | "S07"
  | "S08"
  | "S09"
  | "S10"
  | "S11"
  | "S12"
  | "S13"
  | "S14"
  | "S15"
  | "S16"
  | "S17";

export interface Ep002Shot {
  id: Ep002ShotId;
  num: number;
  start: number;
  end: number;
  kind: "3d" | "2d";
  polTag?: "POL-1" | "POL-2" | "POL-3" | "POL-4" | "POL-5";
  title: string;
  voCue: string;
  veilBg: string;
  fadeInFrames: number;
  fadeOutFrames: number;
}

export const EP002_SHOTS: Ep002Shot[] = [
  {
    id: "S01",
    num: 1,
    start: 0,
    end: 176,
    kind: "3d",
    polTag: "POL-1",
    title: "Establishing Hutan Ujung Kulon",
    voCue: "Badak Jawa, harus dipindahkan untuk diselamatkan, atau justru dipertaruhkan?",
    veilBg: "#101813",
    fadeInFrames: 8,
    fadeOutFrames: 6,
  },
  {
    id: "S02",
    num: 2,
    start: 176,
    end: 426,
    kind: "2d",
    title: "Peta Isolasi Nusantara -> Ujung Kulon",
    voCue: "Bayangkan, seluruh populasi Badak Jawa yang tersisa di dunia hanya hidup di satu kawasan hutan di Indonesia.",
    veilBg: "#ECE8DF",
    fadeInFrames: 6,
    fadeOutFrames: 0,
  },
  {
    id: "S03",
    num: 3,
    start: 426,
    end: 594,
    kind: "2d",
    title: "Konsentrasi Risiko 1 Simpul",
    voCue: "Artinya, satu wabah penyakit, satu bencana besar...",
    veilBg: "#101813",
    fadeInFrames: 0,
    fadeOutFrames: 6,
  },
  {
    id: "S04",
    num: 4,
    start: 594,
    end: 744,
    kind: "3d",
    title: "Lantai Hutan Tunggal Ujung Kulon",
    voCue: "...atau satu kesalahan dalam pengelolaan habitat berpotensi mengancam masa depan seluruh spesies ini.",
    veilBg: "#101813",
    fadeInFrames: 6,
    fadeOutFrames: 6,
  },
  {
    id: "S05",
    num: 5,
    start: 744,
    end: 998,
    kind: "2d",
    title: "Wacana Habitat Kedua (Garis Putus-Putus)",
    voCue: "Dan sekarang muncul sebuah gagasan, membangun habitat kedua bagi Badak Jawa di luar rumah aslinya di Ujung Kulon.",
    veilBg: "#101813",
    fadeInFrames: 6,
    fadeOutFrames: 6,
  },
  {
    id: "S06",
    num: 6,
    start: 998,
    end: 1155,
    kind: "3d",
    polTag: "POL-2",
    title: "Close-Up Badak Jawa (Cula Tunggal)",
    voCue: "Tapi kenapa gagasan yang tujuannya menyelamatkan spesies ini justru memicu perdebatan?",
    veilBg: "#101813",
    fadeInFrames: 6,
    fadeOutFrames: 4,
  },
  {
    id: "S07",
    num: 7,
    start: 1155,
    end: 1234,
    kind: "2d",
    title: "Title Beat Investigatif (Kok Iso Yo?)",
    voCue: "Kok iso yo?",
    veilBg: "#ECE8DF",
    fadeInFrames: 4,
    fadeOutFrames: 6,
  },
  {
    id: "S08",
    num: 8,
    start: 1234,
    end: 1429,
    kind: "3d",
    polTag: "POL-3",
    title: "Habitat 3-Layer Depth + Taksonomi IUCN",
    voCue: "Badak Jawa atau Rhinoceros sondaicus merupakan salah satu mamalia paling langka di planet ini.",
    veilBg: "#101813",
    fadeInFrames: 6,
    fadeOutFrames: 4,
  },
  {
    id: "S09",
    num: 9,
    start: 1429,
    end: 1691,
    kind: "2d",
    polTag: "POL-4",
    title: "Data Estimasi Kemenhut (87-100 Ekor)",
    voCue: "Menurut data pemantauan Kementerian Kehutanan, populasi yang tersisa diperkirakan berada di kisaran 87 hingga 100 ekor.",
    veilBg: "#ECE8DF",
    fadeInFrames: 4,
    fadeOutFrames: 0,
  },
  {
    id: "S10",
    num: 10,
    start: 1691,
    end: 1830,
    kind: "2d",
    title: "Fokus Geografis TN Ujung Kulon, Banten",
    voCue: "Semuanya hidup di kawasan Taman Nasional Ujung Kulon, Banten.",
    veilBg: "#ECE8DF",
    fadeInFrames: 0,
    fadeOutFrames: 0,
  },
  {
    id: "S11",
    num: 11,
    start: 1830,
    end: 2048,
    kind: "2d",
    title: "Survei Kamera Jebak 2026 (~91 Ekor)",
    voCue: "Survei kamera jebak tahun 2026 bahkan menghasilkan estimasi terbaik sekitar 91 ekor.",
    veilBg: "#101813",
    fadeInFrames: 0,
    fadeOutFrames: 6,
  },
  {
    id: "S12",
    num: 12,
    start: 2048,
    end: 2218,
    kind: "3d",
    title: "Benteng Terakhir Hutan Pesisir",
    voCue: "Selama ini, kawasan tersebut menjadi benteng terakhir bagi keberlangsungan spesies ini.",
    veilBg: "#101813",
    fadeInFrames: 6,
    fadeOutFrames: 6,
  },
  {
    id: "S13",
    num: 13,
    start: 2218,
    end: 2387,
    kind: "2d",
    title: "Peta Kedekatan Selat Sunda & Anak Krakatau",
    voCue: "Namun hidup dalam satu wilayah yang sama juga menyimpan risiko besar.",
    veilBg: "#101813",
    fadeInFrames: 6,
    fadeOutFrames: 0,
  },
  {
    id: "S14",
    num: 14,
    start: 2387,
    end: 2487,
    kind: "2d",
    title: "Ancaman Geologis Tsunami & Erupsi",
    voCue: "Bayangkan jika terjadi tsunami, letusan gunung berapi...",
    veilBg: "#101813",
    fadeInFrames: 0,
    fadeOutFrames: 5,
  },
  {
    id: "S15",
    num: 15,
    start: 2487,
    end: 2613,
    kind: "3d",
    polTag: "POL-5",
    title: "Kerentanan Populasi Tunggal (3 Vektor)",
    voCue: "...wabah penyakit, atau kerusakan ekosistem berskala luas.",
    veilBg: "#101813",
    fadeInFrames: 5,
    fadeOutFrames: 4,
  },
  {
    id: "S16",
    num: 16,
    start: 2613,
    end: 2765,
    kind: "2d",
    title: "Diagram 0% Populasi Cadangan",
    voCue: "Tidak ada populasi liar lain di tempat berbeda yang bisa menjadi cadangan.",
    veilBg: "#ECE8DF",
    fadeInFrames: 4,
    fadeOutFrames: 0,
  },
  {
    id: "S17",
    num: 17,
    start: 2765,
    end: 2840,
    kind: "2d",
    title: "Closing Bridge Bagian 2/4",
    voCue: "(Jeda hening alami — Lanjut ke Bagian 2/4)",
    veilBg: "#0F1713",
    fadeInFrames: 0,
    fadeOutFrames: 12,
  },
];

export function getShotAtFrame(frame: number): Ep002Shot {
  for (let i = 0; i < EP002_SHOTS.length; i++) {
    const s = EP002_SHOTS[i];
    if (frame < s.end) return s;
  }
  return EP002_SHOTS[EP002_SHOTS.length - 1];
}
