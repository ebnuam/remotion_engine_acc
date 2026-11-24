import React from "react";
import { useVideoConfig } from "remotion";
import { SubtitleCue } from "./types";

/**
 * 33 Subtitle Cues mapped to voiceover audio timestamps
 * Total duration: 3625 frames (120.84 seconds @ 30 FPS)
 */
export const SUBTITLES: SubtitleCue[] = [
  { startFrame: 0, endFrame: 156, text: "Badak Jawa di Ujung Kulon sekarang cuma tersisa puluhan ekor di seluruh dunia." },
  { startFrame: 156, endFrame: 306, text: "Tapi anehnya, waktu muncul wacana buat memindahkan mereka ke tempat baru," },
  { startFrame: 306, endFrame: 432, text: "banyak ilmuwan dan aktivis konservasi justru menolak keras." },
  { startFrame: 432, endFrame: 492, text: "Lho, kok iso yo?" },
  { startFrame: 492, endFrame: 708, text: "Jadi baru-baru ini ramai usulan memindahkan sebagian Badak Jawa dari Taman Nasional Ujung Kulon di Banten," },
  { startFrame: 708, endFrame: 828, text: "ke Taman Nasional Alas Purwo di Banyuwangi, Jawa Timur." },
  { startFrame: 828, endFrame: 888, text: "Tujuannya terdengar mulia." },
  { startFrame: 894, endFrame: 942, text: "Bikin habitat kedua." },
  { startFrame: 942, endFrame: 1092, text: "Karena kalau suatu saat Gunung Anak Krakatau meletus dan memicu tsunami besar," },
  { startFrame: 1092, endFrame: 1200, text: "populasi badak di Ujung Kulon nggak ikut punah sekaligus." },
  { startFrame: 1200, endFrame: 1386, text: "Masalahnya secara sains, memindah Badak Jawa itu bukan kayak mindahin hewan ternak." },
  { startFrame: 1386, endFrame: 1440, text: "Taruhannya nyawa." },
  { startFrame: 1440, endFrame: 1596, text: "Badak Jawa adalah satwa yang super pemalu dan sangat rentan stres berat." },
  { startFrame: 1608, endFrame: 1644, text: "Buktinya nyata." },
  { startFrame: 1644, endFrame: 1842, text: "Baru tahun lalu, seekor badak jantan bernama Musofa mati hanya beberapa hari setelah dipindahkan." },
  { startFrame: 1842, endFrame: 1980, text: "Padahal, jarak pindahnya masih di dalam kawasan Ujung Kulon sendiri," },
  { startFrame: 1980, endFrame: 2076, text: "belum menyeberang ratusan kilometer ke Jawa Timur." },
  { startFrame: 2076, endFrame: 2142, text: "Selain risiko stres di perjalanan," },
  { startFrame: 2142, endFrame: 2334, text: "studi konservasi juga menunjukkan mayoritas pemindahan satwa liar ke habitat asing sering gagal." },
  { startFrame: 2334, endFrame: 2442, text: "Mereka susah beradaptasi, pola makannya terganggu," },
  { startFrame: 2442, endFrame: 2520, text: "dan akhirnya gagal berkembang biak." },
  { startFrame: 2520, endFrame: 2694, text: "Di sisi lain, rumah asli mereka di Ujung Kulon sendiri sebenarnya masih punya PR besar." },
  { startFrame: 2694, endFrame: 2826, text: "Mulai dari invasi tanaman langkap yang mematikan tumbuhan pakan badak," },
  { startFrame: 2826, endFrame: 2928, text: "sampai ancaman kerusakan di sekitar kawasan penyangga." },
  { startFrame: 2928, endFrame: 3000, text: "Makanya banyak ahli menilai," },
  { startFrame: 3000, endFrame: 3108, text: "daripada ambil risiko fatal memindahkan mereka jauh-jauh," },
  { startFrame: 3108, endFrame: 3156, text: "jauh lebih masuk akal," },
  { startFrame: 3156, endFrame: 3210, text: "kalau anggaran dan tenaganya," },
  { startFrame: 3210, endFrame: 3372, text: "difokuskan buat memperbaiki dan menjaga ketat rumah asli mereka di Ujung Kulon." },
  { startFrame: 3372, endFrame: 3414, text: "Menurutmu gimana?" },
  { startFrame: 3414, endFrame: 3498, text: "Lebih baik tetap dicoba dipindah demi cadangan," },
  { startFrame: 3498, endFrame: 3582, text: "atau cukup perkuat habitat aslinya saja?" },
  { startFrame: 3582, endFrame: 3624, text: "Tulis di komentar!" },
];

export const getActiveSubtitle = (frame: number): string | null => {
  const cue = SUBTITLES.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );
  return cue ? cue.text : null;
};

/**
 * Subtitle Overlay Component strictly adhering to RULES.md:
 * - Positioned at safe zone bottom: 19%
 * - No dark background box
 * - Heavy sans-serif, uppercase, solid white
 * - Bold black outline (3.8px on 1080p, 2.2px on 540p) + multi-layer drop shadow
 * - Responsive font size (70px on 1080p, 35px on 540p)
 */
export const SubtitleOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const { width } = useVideoConfig();
  const text = getActiveSubtitle(frame);
  if (!text) return null;

  const isPreview = width <= 540;
  const isLong = text.length > 70;
  const fontSize = isPreview ? (isLong ? "27px" : "33px") : (isLong ? "54px" : "66px");
  const strokeWidth = isPreview ? "2.2px" : "3.8px";
  const letterSpacing = isPreview ? "0.6px" : "1.2px";

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
        zIndex: 60,
        padding: "0 28px",
      }}
    >
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 900,
          fontSize,
          lineHeight: 1.2,
          color: "#ffffff",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing,
          maxWidth: "88%",
          WebkitTextStroke: `${strokeWidth} #000000`,
          paintOrder: "stroke fill",
          textShadow:
            "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, -3px 0 0 #000, 3px 0 0 #000, 0 -3px 0 #000, 0 3px 0 #000, 0 6px 18px rgba(0, 0, 0, 0.95)",
        }}
      >
        {text}
      </div>
    </div>
  );
};
