import React from "react";

export type SubtitleCue = {
  startFrame: number;
  endFrame: number;
  text: string;
};

/**
 * 37 Subtitle Cues mapped 100% to Whisper voiceover audio timestamps
 * Total duration: 2010 frames (67.0 seconds @ 30 FPS)
 * Sized 3-5 words per cue for instant reading and high viewer retention.
 */
export const SUBTITLES: SubtitleCue[] = [
  // ---- SHOT 1: KOIN TENGGELAM VS KAPAL UTUH (0s - 10.13s / f=0 - 304) ----
  // "Koin sekecil ini kalau dilempar ke laut langsung tenggelam. Tapi kapal baja raksasa seberat ratusan ribu ton, kok iso yo malah mengapung santai?"
  { startFrame: 0, endFrame: 34, text: "Koin sekecil ini," },
  { startFrame: 34, endFrame: 70, text: "kalau dilempar ke laut" },
  { startFrame: 70, endFrame: 110, text: "langsung tenggelam!" },
  { startFrame: 115, endFrame: 180, text: "Tapi kapal baja raksasa" },
  { startFrame: 180, endFrame: 225, text: "seberat ratusan ribu ton," },
  { startFrame: 228, endFrame: 260, text: "kok iso yo..." },
  { startFrame: 260, endFrame: 300, text: "malah mengapung santai?" },

  // ---- SHOT 2: MESIN MATI, TETAP MENGAPUNG (10.13s - 22.13s / f=304 - 664) ----
  // "Banyak yang mengira kapal bisa mengapung karena mesinnya kuat. Padahal mesin mati pun kapal nggak bakal tenggelam. Rahasianya bukan di beratnya, tapi di bentuknya."
  { startFrame: 310, endFrame: 348, text: "Banyak yang mengira," },
  { startFrame: 350, endFrame: 390, text: "kapal bisa mengapung" },
  { startFrame: 390, endFrame: 432, text: "karena mesinnya kuat." },
  { startFrame: 437, endFrame: 494, text: "Padahal mesin mati pun," },
  { startFrame: 495, endFrame: 542, text: "kapal nggak bakal tenggelam." },
  { startFrame: 548, endFrame: 610, text: "Rahasianya bukan di beratnya," },
  { startFrame: 614, endFrame: 660, text: "tapi di bentuknya!" },

  // ---- SHOT 3: BAJA PADAT VS RONGGA UDARA (22.13s - 38.53s / f=664 - 1156) ----
  // "Kalau baja kapal itu dipadatkan jadi satu balok utuh, dia pasti langsung nyungsep ke dasar laut. Tapi di dalam lambung kapal, sebagian besar isinya adalah rongga udara kosong. Ini bikin massa jenis rata-rata kapal jadi lebih ringan dari air laut."
  { startFrame: 670, endFrame: 730, text: "Kalau baja kapal dipadatkan" },
  { startFrame: 730, endFrame: 775, text: "jadi satu balok utuh," },
  { startFrame: 780, endFrame: 825, text: "dia pasti langsung nyungsep" },
  { startFrame: 825, endFrame: 855, text: "ke dasar laut!" },
  { startFrame: 860, endFrame: 918, text: "Tapi di dalam lambung kapal," },
  { startFrame: 920, endFrame: 965, text: "sebagian besar isinya" },
  { startFrame: 965, endFrame: 1018, text: "adalah rongga udara kosong." },
  { startFrame: 1023, endFrame: 1098, text: "Ini bikin massa jenis kapal" },
  { startFrame: 1098, endFrame: 1152, text: "lebih ringan dari air laut." },

  // ---- SHOT 4: GAYA APUNG VS BERAT KAPAL (38.53s - 56.0s / f=1156 - 1680) ----
  // "Begitu kapal menyentuh air, bentuknya yang lebar mendorong air dalam jumlah sangat besar. Nah, air yang terdesak itu membalas dengan dorongan ke atas, yang disebut gaya apung. Selama dorongan air ini seimbang dengan berat kapal, kapal bakal tetap aman di permukaan."
  { startFrame: 1163, endFrame: 1215, text: "Begitu menyentuh air," },
  { startFrame: 1218, endFrame: 1260, text: "bentuknya yang lebar" },
  { startFrame: 1260, endFrame: 1330, text: "mendorong air sangat banyak." },
  { startFrame: 1343, endFrame: 1410, text: "Air yang terdesak membalas" },
  { startFrame: 1410, endFrame: 1460, text: "dengan dorongan ke atas," },
  { startFrame: 1462, endFrame: 1515, text: "disebut Gaya Apung!" },
  { startFrame: 1522, endFrame: 1575, text: "Selama dorongan ini seimbang" },
  { startFrame: 1575, endFrame: 1610, text: "dengan berat kapal," },
  { startFrame: 1612, endFrame: 1675, text: "kapal tetap aman di permukaan." },

  // ---- SHOT 5: CLOSING & OUTRO (56.0s - 67.0s / f=1680 - 2010) ----
  // "Jadi kapal nggak melawan beratnya sendiri, dia cuma pintar memanfaatkan ruang kosong. Simpel kan? Follow biar makin sering bilang, kok iso yo!"
  { startFrame: 1675, endFrame: 1765, text: "Kapal nggak melawan beratnya," },
  { startFrame: 1770, endFrame: 1850, text: "dia cuma pintar manfaatkan ruang kosong." },
  { startFrame: 1858, endFrame: 1888, text: "Simpel kan?" },
  { startFrame: 1895, endFrame: 1952, text: "Follow biar makin sering bilang:" },
  { startFrame: 1958, endFrame: 2005, text: "KOK ISO YO?!" },
];

export const getActiveSubtitle = (frame: number): string | null => {
  const cue = SUBTITLES.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );
  return cue ? cue.text : null;
};

/**
 * Subtitle Overlay Component
 * Styled strictly to production standards:
 * - Positioned at 19% from bottom (safe zone for Reels / Shorts / TikTok)
 * - Transparent background (NO dark box blocking 3D force arrows / scenes)
 * - Ultra-crisp bold white typography with 2.5px pure black outline & drop shadow
 * - Compact fontSize (33px) with maxWidth 86% and center alignment
 */
export const SubtitleOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const text = getActiveSubtitle(frame);
  if (!text) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "19%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 50,
        padding: "0 24px",
      }}
    >
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 900,
          fontSize: "33px",
          lineHeight: 1.25,
          color: "#ffffff",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          maxWidth: "86%",
          WebkitTextStroke: "2.5px #000000",
          paintOrder: "stroke fill",
          textShadow:
            "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, -3px 0 0 #000, 3px 0 0 #000, 0 -3px 0 #000, 0 3px 0 #000, 0 4px 14px rgba(0, 0, 0, 0.95)",
        }}
      >
        {text}
      </div>
    </div>
  );
};
