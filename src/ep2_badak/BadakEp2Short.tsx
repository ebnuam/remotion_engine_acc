import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SUBTITLES, SubtitleOverlay } from "./subtitles";
import { THEME } from "./theme";
import { RhinoIllustration } from "./components/RhinoIllustration";
import { CalloutChip, TechnicalCallout } from "./components/Callout";
import { ScoreBoard } from "./components/ScoreBoard";

export const BADAK_EP2_FRAMES = 3625;

interface ShotSpec {
  id: number;
  start: number;
  end: number;
  badge: string;
  mode:
    | "forest_overview"
    | "rhino_callout"
    | "scientist_reject"
    | "hook_title"
    | "map_route"
    | "krakatau_tsunami"
    | "truck_stress"
    | "musofa_flatline"
    | "distance_compare"
    | "savanna_risk"
    | "langkap_canopy"
    | "conservation_plan"
    | "outro_split";
  zoomFrom?: number;
  zoomTo?: number;
  panXFrom?: number;
  panXTo?: number;
  panYFrom?: number;
  panYTo?: number;
  note?: string;
}

const SHOTS: ShotSpec[] = [
  // Scene 1: Hook [0, 492)
  { id: 1, start: 0, end: 78, badge: "POPULASI < 80 EKOR", mode: "forest_overview", zoomFrom: 1.0, zoomTo: 1.08, panXTo: -16, note: "TN UJUNG KULON" },
  { id: 2, start: 78, end: 156, badge: "POPULASI < 80 EKOR", mode: "rhino_callout", zoomFrom: 1.02, zoomTo: 1.09, panXFrom: 12, panXTo: -8, note: "TERSISA PULUHAN EKOR" },
  { id: 3, start: 156, end: 232, badge: "WACANA PINDAH", mode: "forest_overview", zoomFrom: 1.04, zoomTo: 1.12, panXFrom: -10, panXTo: 14, note: "USULAN LOKASI BARU" },
  { id: 4, start: 232, end: 306, badge: "WACANA PINDAH", mode: "rhino_callout", zoomFrom: 1.05, zoomTo: 1.11, panXFrom: -6, panXTo: 10, note: "HABITAT LAIN" },
  { id: 5, start: 306, end: 370, badge: "PENOLAKAN AHLI", mode: "scientist_reject", zoomFrom: 1.0, zoomTo: 1.07, note: "ILMUWAN & KONSERVASI" },
  { id: 6, start: 370, end: 432, badge: "DITOLAK KERAS", mode: "scientist_reject", zoomFrom: 1.05, zoomTo: 1.12, note: "KEBERATAN SAINS" },
  { id: 7, start: 432, end: 492, badge: "KOK ISO YO?", mode: "hook_title", zoomFrom: 1.0, zoomTo: 1.1, note: "KENAPA JANGAN DIPINDAH?" },

  // Scene 2: Relokasi [492, 942)
  { id: 8, start: 492, end: 600, badge: "TITIK AWAL: BANTEN", mode: "map_route", zoomFrom: 1.0, zoomTo: 1.08, panXTo: -14, note: "TN UJUNG KULON" },
  { id: 9, start: 600, end: 708, badge: "JALUR PULAU JAWA", mode: "map_route", zoomFrom: 1.06, zoomTo: 1.14, panXFrom: -12, panXTo: 12, note: "MENUJU TIMUR JAWA" },
  { id: 10, start: 708, end: 828, badge: "ALAS PURWO, JATIM", mode: "map_route", zoomFrom: 1.08, zoomTo: 1.16, panXFrom: 8, panXTo: 18, note: "~1.000 KM" },
  { id: 11, start: 828, end: 888, badge: "TUJUAN AWAL", mode: "map_route", zoomFrom: 1.04, zoomTo: 1.09, note: "NIAT PERLINDUNGAN" },
  { id: 12, start: 888, end: 942, badge: "HABITAT KEDUA", mode: "map_route", zoomFrom: 1.05, zoomTo: 1.12, note: "CADANGAN POPULASI" },

  // Scene 3: Anak Krakatau [942, 1200)
  { id: 13, start: 942, end: 1018, badge: "SELAT SUNDA", mode: "krakatau_tsunami", zoomFrom: 1.0, zoomTo: 1.08, note: "GUNUNG ANAK KRAKATAU" },
  { id: 14, start: 1018, end: 1092, badge: "LONGSORAN & TSUNAMI", mode: "krakatau_tsunami", zoomFrom: 1.04, zoomTo: 1.12, note: "DISPLASI AIR LAUT" },
  { id: 15, start: 1092, end: 1200, badge: "RISIKO BENCANA", mode: "krakatau_tsunami", zoomFrom: 1.05, zoomTo: 1.11, note: "ARAH PANTAI UJUNG KULON" },

  // Scene 4: Risiko Pemindahan [1200, 1608)
  { id: 16, start: 1200, end: 1295, badge: "BUKAN TERNAK", mode: "truck_stress", zoomFrom: 1.0, zoomTo: 1.07, panXFrom: -14, panXTo: 14, note: "TRANSLOKASI SATWA LIAR" },
  { id: 17, start: 1295, end: 1386, badge: "PROSES ANGKUT", mode: "truck_stress", zoomFrom: 1.05, zoomTo: 1.12, note: "KONDISI JALAN & KARGO" },
  { id: 18, start: 1386, end: 1440, badge: "TARUHAN NYAWA", mode: "truck_stress", zoomFrom: 1.08, zoomTo: 1.15, note: "RISIKO FATAL" },
  { id: 19, start: 1440, end: 1520, badge: "SATWA PEMALU", mode: "truck_stress", zoomFrom: 1.02, zoomTo: 1.09, note: "SENSITIF GANGGUAN" },
  { id: 20, start: 1520, end: 1608, badge: "STRES BERAT", mode: "truck_stress", zoomFrom: 1.05, zoomTo: 1.12, note: "DETAK JANTUNG MENINGKAT" },

  // Scene 5: Kasus Musofa [1608, 1842)
  { id: 21, start: 1608, end: 1644, badge: "BUKTI LAPANGAN", mode: "musofa_flatline", zoomFrom: 1.0, zoomTo: 1.07, note: "CATATAN KASUS" },
  { id: 22, start: 1644, end: 1745, badge: "KASUS MUSOFA", mode: "musofa_flatline", zoomFrom: 1.02, zoomTo: 1.09, note: "BADAK JANTAN MUSOFA" },
  { id: 23, start: 1745, end: 1842, badge: "PASCA PINDAH", mode: "musofa_flatline", zoomFrom: 1.05, zoomTo: 1.11, note: "MATI BEBERAPA HARI" },

  // Scene 6: Perbandingan Jarak [1842, 2076)
  { id: 24, start: 1842, end: 1980, badge: "DALAM KAWASAN", mode: "distance_compare", zoomFrom: 1.02, zoomTo: 1.1, note: "< 15 KM (LOKAL)" },
  { id: 25, start: 1980, end: 2076, badge: "JARAK EKSTREM", mode: "distance_compare", zoomFrom: 1.05, zoomTo: 1.13, note: "~1.000 KM (JATIM)" },

  // Scene 7: Adaptasi Habitat [2076, 2520)
  { id: 26, start: 2076, end: 2142, badge: "PERUBAHAN LINGKUNGAN", mode: "savanna_risk", zoomFrom: 1.0, zoomTo: 1.07, note: "DARI HUTAN KE LOKASI BARU" },
  { id: 27, start: 2142, end: 2240, badge: "STUDI KONSERVASI", mode: "savanna_risk", zoomFrom: 1.02, zoomTo: 1.09, note: "TANTANGAN ADAPTASI" },
  { id: 28, start: 2240, end: 2334, badge: "HABITAT ASING", mode: "savanna_risk", zoomFrom: 1.04, zoomTo: 1.11, note: "IKLIM & KONDISI BEDA" },
  { id: 29, start: 2334, end: 2442, badge: "POLA PAKAN", mode: "savanna_risk", zoomFrom: 1.05, zoomTo: 1.12, note: "JENIS TUMBUHAN BERUBAH" },
  { id: 30, start: 2442, end: 2520, badge: "DAMPAK JANGKA PANJANG", mode: "savanna_risk", zoomFrom: 1.06, zoomTo: 1.12, note: "PENURUNAN REPRODUKSI" },

  // Scene 8: Invasi Langkap [2520, 2928)
  { id: 31, start: 2520, end: 2605, badge: "PR UJUNG KULON", mode: "langkap_canopy", zoomFrom: 1.0, zoomTo: 1.07, note: "RUMAH ASLI PERLU BENAHI" },
  { id: 32, start: 2605, end: 2694, badge: "INVASI LANGKAP", mode: "langkap_canopy", zoomFrom: 1.03, zoomTo: 1.11, note: "TUMBUH RAPAT DI HUTAN" },
  { id: 33, start: 2694, end: 2826, badge: "CAHAYA TERBLOKIR", mode: "langkap_canopy", zoomFrom: 1.05, zoomTo: 1.13, panYFrom: 12, panYTo: -14, note: "PAKAN BAWAH MENYUSUT" },
  { id: 34, start: 2826, end: 2928, badge: "ZONA PENYANGGA", mode: "langkap_canopy", zoomFrom: 1.04, zoomTo: 1.1, note: "TEKANAN SEKITAR KAWASAN" },

  // Scene 9: Konservasi [2928, 3372)
  { id: 35, start: 2928, end: 3000, badge: "PANDANGAN AHLI", mode: "conservation_plan", zoomFrom: 1.0, zoomTo: 1.07, note: "EVALUASI RISIKO" },
  { id: 36, start: 3000, end: 3108, badge: "HINDARI RISIKO FATAL", mode: "conservation_plan", zoomFrom: 1.03, zoomTo: 1.1, note: "TIDAK MEMINDAHKAN JAUH" },
  { id: 37, start: 3108, end: 3210, badge: "FOKUS ANGGARAN & SDM", mode: "conservation_plan", zoomFrom: 1.04, zoomTo: 1.11, note: "ALOKASI LEBIH TEPAT" },
  { id: 38, start: 3210, end: 3372, badge: "PERKUAT HABITAT", mode: "conservation_plan", zoomFrom: 1.05, zoomTo: 1.12, note: "JAGA KETAT UJUNG KULON" },

  // Scene 10: Outro [3372, 3625)
  { id: 39, start: 3372, end: 3498, badge: "OPSI A VS OPSI B", mode: "outro_split", zoomFrom: 1.0, zoomTo: 1.06, note: "PINDAH VS PERKUAT" },
  { id: 40, start: 3498, end: 3625, badge: "TULIS DI KOMENTAR", mode: "outro_split", zoomFrom: 1.03, zoomTo: 1.08, note: "PENDAPAT KAMU?" },
];

const getShot = (frame: number): ShotSpec => {
  return (
    SHOTS.find((s) => frame >= s.start && frame < s.end) || SHOTS[SHOTS.length - 1]
  );
};

const CrossSectionGround: React.FC<{
  topSoil: string;
  subSoil: string;
  deepSoil: string;
  grassColor: string;
  localFrame: number;
}> = ({ topSoil, subSoil, deepSoil, grassColor, localFrame }) => {
  const wave = Math.sin(localFrame * 0.08) * 6;
  return (
    <svg
      viewBox="0 0 1080 960"
      style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "50%" }}
    >
      {/* Deep layer */}
      <rect x="0" y="340" width="1080" height="620" fill={deepSoil} />
      {/* Sub-soil layer */}
      <path
        d={`M0 190 Q270 ${180 + wave}, 540 192 T1080 186 L1080 430 L0 430 Z`}
        fill={subSoil}
      />
      {/* Top soil layer */}
      <path
        d={`M0 95 Q270 ${88 - wave * 0.5}, 540 96 T1080 92 L1080 215 L0 215 Z`}
        fill={topSoil}
      />
      {/* Grass / surface strip */}
      <path
        d={`M0 78 Q270 ${72 + wave * 0.4}, 540 80 T1080 76 L1080 108 L0 108 Z`}
        fill={grassColor}
      />
      {/* Depth ruler ticks on left */}
      <line x1="64" y1="95" x2="64" y2="540" stroke="#1E293B" strokeWidth="3" strokeDasharray="8 6" />
      <text x="80" y="135" fill="#1E293B" fontSize="22" fontWeight="800">0 M</text>
      <text x="80" y="275" fill="#1E293B" fontSize="22" fontWeight="800">-5 M</text>
      <text x="80" y="420" fill="#E2E8F0" fontSize="22" fontWeight="800">-12 M</text>
    </svg>
  );
};

const RhinoSilhouetteBadge: React.FC<{
  scale?: number;
  tint?: string;
  stepPhase?: number;
}> = ({ scale = 1, tint = "#475569", stepPhase = 0 }) => {
  const bob = Math.sin(stepPhase) * 4;
  return (
    <svg
      viewBox="0 0 340 180"
      style={{
        width: 240 * scale,
        height: 128 * scale,
        transform: `translateY(${bob}px)`,
        overflow: "visible",
      }}
    >
      {/* Back legs */}
      <rect
        x="88"
        y="108"
        width="24"
        height="48"
        rx="10"
        fill={tint}
        stroke="#0F172A"
        strokeWidth="4"
        transform={`rotate(${Math.sin(stepPhase) * 10} 100 112)`}
      />
      <rect
        x="212"
        y="108"
        width="24"
        height="48"
        rx="10"
        fill={tint}
        stroke="#0F172A"
        strokeWidth="4"
        transform={`rotate(${-Math.sin(stepPhase) * 10} 224 112)`}
      />
      {/* Body */}
      <path
        d="M68 88 C68 52, 128 42, 198 48 C242 52, 265 68, 276 84 L305 92 L298 114 L256 116 L246 124 L82 122 Z"
        fill={tint}
        stroke="#0F172A"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Single horn */}
      <path d="M294 90 L316 58 L305 93 Z" fill="#EAB308" stroke="#0F172A" strokeWidth="3.5" />
      {/* Front legs */}
      <rect
        x="104"
        y="112"
        width="25"
        height="50"
        rx="10"
        fill={tint}
        stroke="#0F172A"
        strokeWidth="4"
        transform={`rotate(${-Math.sin(stepPhase) * 10} 116 116)`}
      />
      <rect
        x="228"
        y="112"
        width="25"
        height="50"
        rx="10"
        fill={tint}
        stroke="#0F172A"
        strokeWidth="4"
        transform={`rotate(${Math.sin(stepPhase) * 10} 240 116)`}
      />
      {/* Ear */}
      <polygon points="236,52 246,32 254,54" fill={tint} stroke="#0F172A" strokeWidth="3.5" />
    </svg>
  );
};

const CalloutPill: React.FC<{
  label: string;
  accent?: string;
  top: string;
  left?: string;
  right?: string;
  progress: number;
}> = ({ label, accent = "#0F172A", top, left, right, progress }) => {
  const pop = interpolate(progress, [0, 0.25], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = interpolate(progress, [0, 0.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        right,
        opacity: op,
        transform: `scale(${pop})`,
        backgroundColor: "#FFFDF7",
        border: `3.5px solid ${accent}`,
        borderRadius: 16,
        padding: "10px 22px",
        boxShadow: "0 8px 0 rgba(15, 23, 42, 0.22)",
        zIndex: 25,
      }}
    >
      <span
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          fontWeight: 900,
          fontSize: 30,
          color: "#0F172A",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const BadakEp2Short: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shot = getShot(frame);
  const localFrame = frame - shot.start;
  const shotLen = Math.max(1, shot.end - shot.start);
  const p = Math.min(1, Math.max(0, localFrame / shotLen));

  const scale = interpolate(
    p,
    [0, 1],
    [shot.zoomFrom ?? 1.0, shot.zoomTo ?? 1.08]
  );
  const panX = interpolate(
    p,
    [0, 1],
    [shot.panXFrom ?? 0, shot.panXTo ?? 0]
  );
  const panY = interpolate(
    p,
    [0, 1],
    [shot.panYFrom ?? 0, shot.panYTo ?? 0]
  );

  const cloudShift = (frame * 0.7) % 1400;
  const stepPhase = frame * 0.22;
  const badgeSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 160 },
  });

  return (
    <AbsoluteFill
      style={{
        background: THEME.sky.gradient,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("audio/pemindahan_badak_jawa.mp3")} />

      {/* Daylight Sun & Moving Clouds */}
      <svg
        viewBox="0 0 1080 650"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "35%" }}
      >
        <circle cx="910" cy="145" r="64" fill="#FDE047" opacity="0.92" />
        <circle cx="910" cy="145" r="88" fill="#FEF08A" opacity="0.35" />
        <g transform={`translate(${-cloudShift + 200}, 95)`}>
          <ellipse cx="140" cy="70" rx="85" ry="30" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="115" cy="54" rx="48" ry="26" fill="#FFFFFF" opacity="0.95" />
          <ellipse cx="168" cy="56" rx="42" ry="22" fill="#FFFFFF" opacity="0.95" />
        </g>
        <g transform={`translate(${-cloudShift + 860}, 150)`}>
          <ellipse cx="140" cy="70" rx="95" ry="32" fill="#FFFFFF" opacity="0.85" />
          <ellipse cx="120" cy="50" rx="52" ry="28" fill="#FFFFFF" opacity="0.9" />
        </g>
      </svg>

      {/* Main Animated 2.5D Stage (Safe middle zone) */}
      <div
        style={{
          position: "absolute",
          top: "19%",
          bottom: "28%",
          left: 0,
          right: 0,
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: "center center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {(shot.mode === "forest_overview" ||
          shot.mode === "rhino_callout" ||
          shot.mode === "scientist_reject" ||
          shot.mode === "hook_title") && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Multi-layer tropical forest background */}
            <svg
              viewBox="0 0 1080 700"
              style={{ position: "absolute", top: 60, left: 0, width: "100%" }}
            >
              {/* Far hills */}
              <path d="M0 400 Q180 260 380 330 Q580 400 780 300 Q950 220 1080 310 L1080 700 L0 700 Z" fill="#4ADE80" opacity="0.45" />
              {/* Mid hills */}
              <path d="M0 460 Q220 310 460 380 Q680 450 900 360 Q1000 310 1080 380 L1080 700 L0 700 Z" fill="#22C55E" opacity="0.65" />
              {/* Dense canopy trees (back row) */}
              {[60,160,280,420,560,680,800,940,1050].map((x, i) => (
                <g key={`tree-b-${i}`} transform={`translate(${x}, ${340 + (i % 3) * 15})`}>
                  <rect x="-7" y="0" width="14" height="80" fill="#15803D" />
                  <ellipse cx="0" cy="-10" rx={42 + (i % 2) * 12} ry="52" fill="#16A34A" stroke="#0F172A" strokeWidth="2" opacity="0.9" />
                  <ellipse cx="0" cy="-28" rx={28 + (i % 2) * 8} ry="38" fill="#22C55E" opacity="0.85" />
                </g>
              ))}
              {/* Front canopy trees */}
              {[0,120,250,390,530,660,790,920,1080].map((x, i) => (
                <g key={`tree-f-${i}`} transform={`translate(${x}, ${420 + (i % 2) * 10})`}>
                  <rect x="-9" y="0" width="18" height="90" fill="#166534" />
                  <ellipse cx="0" cy="-15" rx={52 + (i % 3) * 10} ry="65" fill="#15803D" stroke="#0F172A" strokeWidth="2.5" />
                  <ellipse cx="-12" cy="-35" rx="34" ry="42" fill="#16A34A" opacity="0.9" />
                  <ellipse cx="14" cy="-40" rx="30" ry="38" fill="#4ADE80" opacity="0.75" />
                </g>
              ))}
            </svg>

            {/* Cross-section ground with technical depth labels */}
            <CrossSectionGround
              topSoil={THEME.ground.topSoil}
              subSoil={THEME.ground.subSoil}
              deepSoil={THEME.ground.deepSoil}
              grassColor={THEME.ground.grass}
              localFrame={localFrame}
            />

            {/* Technical depth callout arrows (SVG overlay) */}
            <svg
              viewBox="0 0 1080 960"
              style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "50%", pointerEvents: "none" }}
            >
              {/* Surface label */}
              <TechnicalCallout
                x1={120} y1={80}
                x2={220} y2={60}
                label="PERMUKAAN" unit="0 M"
                progress={p}
                attachSide="left"
                boxWidth={160}
                boxHeight={48}
                fontSize={16}
              />
              {/* -5m label */}
              <TechnicalCallout
                x1={120} y1={270}
                x2={220} y2={250}
                label="LAPISAN BAWAH" unit="-5 M"
                progress={p}
                attachSide="left"
                boxWidth={188}
                boxHeight={48}
                fontSize={15}
              />
              {/* -12m label */}
              <TechnicalCallout
                x1={120} y1={420}
                x2={220} y2={400}
                label="LAPISAN DALAM" unit="-12 M"
                color="#E2E8F0"
                progress={p}
                attachSide="left"
                boxWidth={188}
                boxHeight={48}
                fontSize={15}
              />
            </svg>

            {/* Organic Rhino Illustration */}
            <div style={{ position: "absolute", bottom: "36%", left: "26%" }}>
              <RhinoIllustration
                frame={frame}
                scale={0.72}
                walkSpeed={shot.mode === "forest_overview" ? 1 : 0.4}
              />
            </div>

            {/* ScoreBoard — persistent top-right */}
            <ScoreBoard
              frame={localFrame}
              visible={true}
              highlight={shot.mode === "scientist_reject" ? "perkuat" : "none"}
            />

            {/* Optional photo inset for rhino_callout */}
            {shot.mode === "rhino_callout" && (
              <div
                style={{
                  position: "absolute",
                  top: "12%",
                  right: "31%",
                  width: 220,
                  height: 220,
                  borderRadius: 20,
                  overflow: "hidden",
                  border: `4px solid ${THEME.ink}`,
                  boxShadow: "0 10px 0 rgba(15,23,42,0.25)",
                }}
              >
                <Img
                  src={staticFile("ep2_badak/scene1.jpg")}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            {shot.note && (
              <CalloutChip
                label={shot.note}
                top="8%"
                left="6%"
                accent={shot.mode === "scientist_reject" ? THEME.accent.danger : THEME.accent.success}
                progress={p}
              />
            )}
          </div>
        )}

        {shot.mode === "map_route" && (
          <div style={{ position: "relative", width: "100%", height: "100%", padding: "30px 36px" }}>
            {/* Ocean background */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, #BAE6FD 0%, #7DD3FC 100%)",
              borderRadius: 0,
            }} />
            {/* Wave pattern */}
            <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.3 }}>
              {[200, 350, 500, 650, 800, 950, 1100].map((y, i) => (
                <path key={i}
                  d={`M0 ${y} Q180 ${y - 18} 360 ${y} Q540 ${y + 18} 720 ${y} Q900 ${y - 18} 1080 ${y}`}
                  stroke="#0284C7" strokeWidth="2.5" fill="none" opacity="0.5"
                />
              ))}
            </svg>

            {/* Java Island SVG — full detailed map */}
            <svg viewBox="0 0 980 580" style={{ width: "100%", height: "100%", position: "relative", zIndex: 2 }}>
              {/* Java landmass — detailed coastal path */}
              <path
                d={`M 80 230
                   Q 60 212 68 196
                   Q 86 188 108 202
                   Q 132 174 198 174
                   Q 265 182 348 172
                   Q 416 152 490 155
                   Q 532 178 578 174
                   Q 660 164 752 178
                   Q 820 192 836 220
                   Q 834 258 798 258
                   Q 745 265 648 252
                   Q 578 268 510 254
                   Q 448 268 372 258
                   Q 310 268 250 254
                   Q 198 272 148 258
                   Q 108 258 80 230 Z`}
                fill="#22C55E"
                stroke="#0F172A"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              {/* Island interior shading */}
              <path
                d={`M 108 258 Q 148 258 198 272 Q 250 254 310 268 Q 372 258 448 268 Q 510 254 578 268 Q 648 252 745 265 Q 798 258 834 258 Q 810 242 756 248 Q 648 236 568 248 Q 460 236 384 248 Q 280 238 200 248 Q 142 242 108 258 Z`}
                fill="#16A34A"
                opacity="0.7"
              />
              {/* Volcanic peaks */}
              <g fill="#15803D" stroke="#0F172A" strokeWidth="3">
                <polygon points="148,215 168,175 188,215" />
                <polygon points="208,215 228,186 248,215" />
                <polygon points="358,215 383,165 408,215" />
                <polygon points="428,220 453,174 478,220" />
                <polygon points="618,215 648,160 678,215" />
                <polygon points="708,220 733,174 758,220" />
              </g>

              {/* Ocean wave accents */}
              <g stroke="#38BDF8" strokeWidth="2.5" opacity="0.65" fill="none">
                <path d="M38 72 Q68 62 98 72 T158 72" />
                <path d="M718 70 Q748 60 778 70 T838 70" />
                <path d="M98 395 Q128 385 158 395 T218 395" />
                <path d="M678 395 Q708 385 738 395 T798 395" />
              </g>

              {/* Animated route glow */}
              <path
                d="M 90 212 Q 450 72 810 222"
                stroke="#FEF08A"
                strokeWidth="18"
                opacity="0.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Animated dashed route */}
              <path
                d="M 90 212 Q 450 72 810 222"
                stroke="#F97316"
                strokeWidth="7"
                strokeDasharray="16 10"
                strokeDashoffset={-frame * 3.5}
                fill="none"
                strokeLinecap="round"
              />
              {/* Solid progress overlay */}
              <path
                d="M 90 212 Q 450 72 810 222"
                stroke="#EA580C"
                strokeWidth="5"
                strokeDasharray="1050"
                strokeDashoffset={1050 * (1 - p)}
                fill="none"
                strokeLinecap="round"
              />

              {/* Distance badge at apex */}
              <g transform="translate(448, 108)">
                <rect x="-108" y="-24" width="216" height="48" rx="13"
                  fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5"
                  filter="drop-shadow(0 4px 0 #0F172A)"
                />
                <text x="0" y="-2" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="18" fill="#EA580C">
                  RUTE: ~1.000 KM
                </text>
                <text x="0" y="16" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="13" fill="#64748B">
                  UJUNG KULON - ALAS PURWO
                </text>
              </g>

              {/* PIN 1: TN UJUNG KULON (Banten, west) */}
              <g transform="translate(90, 212)">
                <circle cx="0" cy="0" r="16" fill="#0284C7" stroke="#0F172A" strokeWidth="4" />
                <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
                <path d="M 0 -8 L 0 -52" stroke="#0F172A" strokeWidth="4" />
                <circle cx="0" cy="-52" r="14" fill="#EF4444" stroke="#0F172A" strokeWidth="3.5" />
                <g transform="translate(-10, -82)">
                  <rect x="-88" y="-14" width="176" height="30" rx="9"
                    fill="#FFFFFF" stroke="#0F172A" strokeWidth="3"
                    filter="drop-shadow(0 3px 0 #0F172A)"
                  />
                  <text x="0" y="7" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="13" fill="#0284C7">
                    TN UJUNG KULON
                  </text>
                </g>
              </g>

              {/* PIN 2: TN ALAS PURWO (Banyuwangi, east) */}
              <g transform="translate(810, 222)">
                <circle cx="0" cy="0" r="16" fill="#F97316" stroke="#0F172A" strokeWidth="4" />
                <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
                <path d="M 0 -8 L 0 -52" stroke="#0F172A" strokeWidth="4" />
                <circle cx="0" cy="-52" r="14" fill="#22C55E" stroke="#0F172A" strokeWidth="3.5" />
                <g transform="translate(0, -82)">
                  <rect x="-82" y="-14" width="164" height="30" rx="9"
                    fill="#FFFFFF" stroke="#0F172A" strokeWidth="3"
                    filter="drop-shadow(0 3px 0 #0F172A)"
                  />
                  <text x="0" y="7" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="13" fill="#15803D">
                    TN ALAS PURWO
                  </text>
                </g>
              </g>

              {/* Compass rose */}
              <g transform="translate(900, 110)">
                <circle cx="0" cy="0" r="30" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" opacity="0.9" />
                <text x="0" y="-14" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#0F172A">U</text>
                <text x="0" y="22" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="12" fill="#64748B">S</text>
                <text x="18" y="5" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="12" fill="#64748B">T</text>
                <text x="-18" y="5" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="12" fill="#64748B">B</text>
                <line x1="0" y1="-22" x2="0" y2="22" stroke="#0F172A" strokeWidth="1.5" />
                <line x1="-22" y1="0" x2="22" y2="0" stroke="#0F172A" strokeWidth="1.5" />
              </g>
            </svg>

            {shot.note && (
              <CalloutChip label={shot.note} top="6%" left="6%" progress={p} accent={THEME.accent.warning} />
            )}
          </div>
        )}

        {shot.mode === "krakatau_tsunami" && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <svg viewBox="0 0 1080 760" style={{ width: "100%", height: "100%" }}>
              {/* Sunda Strait sea */}
              <rect x="0" y="360" width="1080" height="400" fill="#0284C7" />
              {/* Anak Krakatau cone */}
              <polygon points="340,370 500,150 660,370" fill="#57534E" stroke="#0F172A" strokeWidth="5" />
              {/* Plume */}
              <circle cx="500" cy="115" r={35 + p * 35} fill="#E2E8F0" opacity="0.85" />
              {/* Tsunami wave moving right */}
              <path
                d={`M${120 + p * 420} 470 Q${220 + p * 420} 320, ${340 + p * 420} 470 L${340 + p * 420} 560 L${120 + p * 420} 560 Z`}
                fill="#38BDF8"
                stroke="#0F172A"
                strokeWidth="4"
              />
            </svg>
            {shot.note && <CalloutPill label={shot.note} top="8%" left="6%" accent="#0284C7" progress={p} />}
          </div>
        )}

        {shot.mode === "truck_stress" && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <CrossSectionGround
              topSoil="#94A3B8"
              subSoil="#64748B"
              deepSoil="#334155"
              grassColor="#84CC16"
              localFrame={localFrame}
            />
            <div
              style={{
                position: "absolute",
                bottom: "42%",
                left: "20%",
                transform: `translateY(${Math.sin(frame * 0.9) * 5}px)`,
              }}
            >
              <svg viewBox="0 0 520 220" style={{ width: 560, height: 240 }}>
                <rect x="30" y="35" width="290" height="125" rx="14" fill="#F8FAFC" stroke="#0F172A" strokeWidth="5" />
                <rect x="320" y="65" width="130" height="95" rx="14" fill="#F59E0B" stroke="#0F172A" strokeWidth="5" />
                <circle cx="115" cy="172" r="32" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
                <circle cx="385" cy="172" r="32" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
              </svg>
            </div>
            {shot.note && <CalloutPill label={shot.note} top="8%" left="6%" accent="#DC2626" progress={p} />}
          </div>
        )}

        {shot.mode === "musofa_flatline" && (
          <div style={{ position: "relative", width: "100%", height: "100%", padding: "60px 64px" }}>
            <div
              style={{
                backgroundColor: "#FFFDF7",
                border: "4px solid #0F172A",
                borderRadius: 24,
                padding: 36,
                boxShadow: "0 12px 0 rgba(15,23,42,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <RhinoSilhouetteBadge scale={0.75} tint="#64748B" stepPhase={0} />
                <div style={{ fontSize: 36, fontWeight: 900, color: "#0F172A" }}>KASUS MUSOFA</div>
              </div>
              <svg viewBox="0 0 800 140" style={{ width: "100%", height: 150, marginTop: 20 }}>
                <line x1="20" y1="70" x2="780" y2="70" stroke="#DC2626" strokeWidth="6" />
              </svg>
            </div>
            {shot.note && <CalloutPill label={shot.note} top="4%" right="6%" accent="#DC2626" progress={p} />}
          </div>
        )}

        {shot.mode === "distance_compare" && (
          <div style={{ width: "86%", display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ backgroundColor: "#FFFDF7", border: "4px solid #0F172A", borderRadius: 20, padding: 28 }}>
              <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>LOKAL DALAM KAWASAN (&lt; 15 KM)</div>
              <div style={{ height: 28, width: `${Math.max(12, p * 22)}%`, backgroundColor: "#FACC15", border: "3px solid #0F172A", borderRadius: 10 }} />
            </div>
            <div style={{ backgroundColor: "#FFFDF7", border: "4px solid #0F172A", borderRadius: 20, padding: 28 }}>
              <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>KE JAWA TIMUR (~1.000 KM)</div>
              <div style={{ height: 28, width: `${Math.max(18, p * 95)}%`, backgroundColor: "#EF4444", border: "3px solid #0F172A", borderRadius: 10 }} />
            </div>
          </div>
        )}

        {shot.mode === "savanna_risk" && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <CrossSectionGround
              topSoil="#CA8A04"
              subSoil="#A16207"
              deepSoil="#713F12"
              grassColor="#EAB308"
              localFrame={localFrame}
            />
            <div style={{ position: "absolute", bottom: "38%", left: "25%" }}>
              <RhinoSilhouetteBadge scale={1.1} tint="#78716C" stepPhase={stepPhase * 0.6} />
            </div>
            {shot.note && <CalloutPill label={shot.note} top="8%" left="6%" accent="#D97706" progress={p} />}
          </div>
        )}

        {shot.mode === "langkap_canopy" && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <svg viewBox="0 0 1080 760" style={{ width: "100%", height: "100%" }}>
              {[140, 340, 540, 740, 920].map((x, idx) => (
                <g key={idx}>
                  <line x1={x} y1="760" x2={x} y2="140" stroke="#3F6212" strokeWidth="14" />
                  <ellipse cx={x} cy="130" rx={115} ry="42" fill="#15803D" stroke="#0F172A" strokeWidth="4" />
                </g>
              ))}
              {/* Sunlight blocked */}
              <line x1="540" y1="0" x2="540" y2="120" stroke="#FACC15" strokeWidth="14" strokeDasharray="16 12" />
            </svg>
            {shot.note && <CalloutPill label={shot.note} top="8%" left="6%" accent="#15803D" progress={p} />}
          </div>
        )}

        {shot.mode === "conservation_plan" && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <CrossSectionGround
              topSoil="#65A30D"
              subSoil="#4D7C0F"
              deepSoil="#365314"
              grassColor="#22C55E"
              localFrame={localFrame}
            />
            <div style={{ position: "absolute", bottom: "38%", left: "18%", display: "flex", alignItems: "flex-end", gap: 24 }}>
              <RhinoSilhouetteBadge scale={1.1} tint="#475569" stepPhase={stepPhase} />
              <RhinoSilhouetteBadge scale={0.68} tint="#64748B" stepPhase={stepPhase * 1.2} />
            </div>
            {shot.note && <CalloutPill label={shot.note} top="8%" left="6%" accent="#16A34A" progress={p} />}
          </div>
        )}

        {shot.mode === "outro_split" && (
          <div
            style={{
              width: "90%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            <div
              style={{
                backgroundColor: "#FEF3C7",
                border: "4px solid #0F172A",
                borderRadius: 24,
                padding: 28,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 900, color: "#0F172A" }}>OPSI A</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#334155", marginTop: 10 }}>
                PINDAH HABITAT
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#DCFCE7",
                border: "4px solid #0F172A",
                borderRadius: 24,
                padding: 28,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 900, color: "#0F172A" }}>OPSI B</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#14532D", marginTop: 10 }}>
                PERKUAT UJUNG KULON
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Safe-Zone Badge */}
      <div
        style={{
          position: "absolute",
          top: "13.5%",
          left: "50%",
          transform: `translateX(-50%) scale(${0.92 + 0.08 * badgeSpring})`,
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          padding: "10px 28px",
          borderRadius: 999,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          zIndex: 50,
        }}
      >
        {shot.badge}
      </div>

      {/* Bottom Safe-Zone Subtitle */}
      <SubtitleOverlay frame={frame} />
    </AbsoluteFill>
  );
};
