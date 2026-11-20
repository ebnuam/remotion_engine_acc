import React from "react";

export type SubtitleCue = {
  startFrame: number;
  endFrame: number;
  text: string;
};

/**
 * 5 Segments of Subtitles mapped to exact VO speech rhythm:
 * Total: 2010 frames (67.0 seconds @ 30 FPS)
 * 3-5 words per cue for high readability and retention.
 */
export const SUBTITLES: SubtitleCue[] = [
  // ---- PARAGRAPH 1 (0s - 11s / f=0 - 330) ----
  // "Koin sekecil ini kalau dilempar ke laut langsung tenggelam. Tapi kapal baja raksasa seberat ratusan ribu ton, kok iso yo malah mengapung santai?"
  { startFrame: 5, endFrame: 45, text: "Koin sekecil ini," },
  { startFrame: 45, endFrame: 80, text: "kalau dilempar ke laut" },
  { startFrame: 80, endFrame: 110, text: "langsung tenggelam!" },
  { startFrame: 120, endFrame: 165, text: "Tapi kapal baja raksasa" },
  { startFrame: 165, endFrame: 220, text: "seberat ratusan ribu ton," },
  { startFrame: 230, endFrame: 265, text: "kok iso yo..." },
  { startFrame: 265, endFrame: 320, text: "malah mengapung santai?" },

  // ---- PARAGRAPH 2 (11s - 23s / f=330 - 690) ----
  // "Banyak yang mengira kapal bisa mengapung karena mesinnya kuat. Padahal, mesin mati pun kapal nggak bakal tenggelam. Rahasianya bukan di beratnya, tapi di bentuknya."
  { startFrame: 330, endFrame: 385, text: "Banyak yang mengira" },
  { startFrame: 385, endFrame: 435, text: "kapal bisa mengapung" },
  { startFrame: 435, endFrame: 480, text: "karena mesinnya kuat." },
  { startFrame: 485, endFrame: 535, text: "Padahal mesin mati pun," },
  { startFrame: 535, endFrame: 585, text: "kapal nggak bakal tenggelam." },
  { startFrame: 590, endFrame: 640, text: "Rahasianya bukan di beratnya," },
  { startFrame: 640, endFrame: 685, text: "tapi di bentuknya!" },

  // ---- PARAGRAPH 3 (23s - 38s / f=690 - 1140) ----
  // "Kalau baja kapal itu dipadatkan jadi satu balok utuh, dia pasti langsung nyungsep ke dasar laut. Tapi di dalam lambung kapal, sebagian besar isinya adalah rongga udara kosong. Ini bikin massa jenis rata-rata kapal jadi lebih ringan dari air laut."
  { startFrame: 695, endFrame: 755, text: "Kalau baja kapal dipadatkan" },
  { startFrame: 755, endFrame: 800, text: "jadi satu balok utuh," },
  { startFrame: 800, endFrame: 845, text: "dia pasti langsung nyungsep" },
  { startFrame: 845, endFrame: 885, text: "ke dasar laut!" },
  { startFrame: 890, endFrame: 940, text: "Tapi di lambung kapal," },
  { startFrame: 940, endFrame: 990, text: "sebagian besar isinya" },
  { startFrame: 990, endFrame: 1045, text: "adalah rongga udara kosong." },
  { startFrame: 1050, endFrame: 1100, text: "Massa jenis rata-rata kapal" },
  { startFrame: 1100, endFrame: 1140, text: "jadi lebih ringan dari air laut." },

  // ---- PARAGRAPH 4 (38s - 55s / f=1140 - 1650) ----
  // "Begitu kapal menyentuh air, bentuknya yang lebar mendorong air dalam jumlah sangat besar. Nah, air yang terdesak itu membalas dengan dorongan ke atas, yang disebut gaya apung. Selama dorongan air ini seimbang dengan berat kapal, kapal bakal tetap aman di permukaan."
  { startFrame: 1155, endFrame: 1205, text: "Begitu menyentuh air," },
  { startFrame: 1205, endFrame: 1260, text: "bentuknya yang lebar" },
  { startFrame: 1260, endFrame: 1325, text: "mendorong air sangat banyak." },
  { startFrame: 1335, endFrame: 1390, text: "Air yang terdesak membalas" },
  { startFrame: 1390, endFrame: 1445, text: "dengan dorongan ke atas:" },
  { startFrame: 1445, endFrame: 1510, text: "disebut Gaya Apung!" },
  { startFrame: 1520, endFrame: 1575, text: "Selama dorongan ini seimbang" },
  { startFrame: 1575, endFrame: 1615, text: "dengan berat kapal," },
  { startFrame: 1615, endFrame: 1650, text: "kapal tetap aman mengapung." },

  // ---- PARAGRAPH 5 (55s - 67s / f=1650 - 2010) ----
  // "Jadi kapal nggak melawan beratnya sendiri, dia cuma pintar memanfaatkan ruang kosong. Simpel kan? Follow biar makin sering bilang, kok iso yo!"
  { startFrame: 1665, endFrame: 1725, text: "Kapal nggak melawan beratnya," },
  { startFrame: 1725, endFrame: 1780, text: "dia cuma pintar" },
  { startFrame: 1780, endFrame: 1845, text: "memanfaatkan ruang kosong." },
  { startFrame: 1855, endFrame: 1890, text: "Simpel kan?" },
  { startFrame: 1895, endFrame: 1950, text: "Follow biar makin sering bilang:" },
  { startFrame: 1950, endFrame: 2005, text: "KOK ISO YO?!" },
];

export const getActiveSubtitle = (frame: number): string | null => {
  const cue = SUBTITLES.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );
  return cue ? cue.text : null;
};

/**
 * Subtitle Overlay Component
 * Styled for 9:16 safe zone:
 * - Positioned at 20% from bottom (safe zone for Shorts/Reels/TikTok)
 * - Transparent background (no dark box blocking 3D scene / force arrows)
 * - Crisp bold white text with thick black stroke & drop shadow
 * - Compact font size (reduced ~22%) with maxWidth 86% and center alignment
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
        bottom: "20%",
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
          fontSize: "35px",
          lineHeight: 1.3,
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
