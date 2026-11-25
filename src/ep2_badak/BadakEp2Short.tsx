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
import { SubtitleOverlay } from "./subtitles";
import { THEME } from "./theme";
import { RhinoIllustration } from "./components/RhinoIllustration";
import { CalloutChip, TechnicalCallout } from "./components/Callout";
import { ScoreBoard } from "./components/ScoreBoard";
import { JavaIslandMap } from "./components/JavaIslandMap";
import { KrakatauTsunamiScene } from "./components/KrakatauTsunamiScene";
import { TruckTranslocationScene } from "./components/TruckTranslocationScene";
import { MusofaArchiveScene } from "./components/MusofaArchiveScene";
import { DistanceCompareScene } from "./components/DistanceCompareScene";
import { HabitatAdaptationScene } from "./components/HabitatAdaptationScene";
import { LangkapInvasionScene } from "./components/LangkapInvasionScene";
import { HabitatRecoveryScene } from "./components/HabitatRecoveryScene";
import { OutroSplitScene } from "./components/OutroSplitScene";

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
  { id: 1, start: 0, end: 78, badge: "POPULASI < 80 EKOR", mode: "forest_overview", zoomFrom: 1.0, zoomTo: 1.03, panXTo: -8, note: "TN UJUNG KULON" },
  { id: 2, start: 78, end: 156, badge: "POPULASI < 80 EKOR", mode: "rhino_callout", zoomFrom: 1.01, zoomTo: 1.04, panXFrom: 6, panXTo: -4, note: "TERSISA PULUHAN EKOR" },
  { id: 3, start: 156, end: 232, badge: "WACANA PINDAH", mode: "forest_overview", zoomFrom: 1.01, zoomTo: 1.04, panXFrom: -6, panXTo: 6, note: "USULAN LOKASI BARU" },
  { id: 4, start: 232, end: 306, badge: "WACANA PINDAH", mode: "rhino_callout", zoomFrom: 1.01, zoomTo: 1.04, panXFrom: -4, panXTo: 6, note: "HABITAT LAIN" },
  { id: 5, start: 306, end: 370, badge: "PENOLAKAN AHLI", mode: "scientist_reject", zoomFrom: 1.0, zoomTo: 1.03, note: "ILMUWAN & KONSERVASI" },
  { id: 6, start: 370, end: 432, badge: "DITOLAK KERAS", mode: "scientist_reject", zoomFrom: 1.01, zoomTo: 1.04, note: "KEBERATAN SAINS" },
  { id: 7, start: 432, end: 492, badge: "KOK ISO YO?", mode: "hook_title", zoomFrom: 1.0, zoomTo: 1.03, note: "KENAPA JANGAN DIPINDAH?" },

  // Scene 2: Relokasi [492, 942)
  { id: 8, start: 492, end: 600, badge: "TITIK AWAL: BANTEN", mode: "map_route", zoomFrom: 1.0, zoomTo: 1.02, note: "TN UJUNG KULON" },
  { id: 9, start: 600, end: 708, badge: "JALUR PULAU JAWA", mode: "map_route", zoomFrom: 1.01, zoomTo: 1.03, note: "MENUJU TIMUR JAWA" },
  { id: 10, start: 708, end: 828, badge: "ALAS PURWO, JATIM", mode: "map_route", zoomFrom: 1.01, zoomTo: 1.03, note: "~1.000 KM" },
  { id: 11, start: 828, end: 888, badge: "TUJUAN AWAL", mode: "map_route", zoomFrom: 1.0, zoomTo: 1.02, note: "NIAT PERLINDUNGAN" },
  { id: 12, start: 888, end: 942, badge: "HABITAT KEDUA", mode: "map_route", zoomFrom: 1.01, zoomTo: 1.03, note: "CADANGAN POPULASI" },

  // Scene 3: Anak Krakatau [942, 1200)
  { id: 13, start: 942, end: 1018, badge: "SELAT SUNDA", mode: "krakatau_tsunami", zoomFrom: 1.0, zoomTo: 1.02, note: "GUNUNG ANAK KRAKATAU" },
  { id: 14, start: 1018, end: 1092, badge: "LONGSORAN & TSUNAMI", mode: "krakatau_tsunami", zoomFrom: 1.01, zoomTo: 1.03, note: "DISPLASI AIR LAUT" },
  { id: 15, start: 1092, end: 1200, badge: "RISIKO BENCANA", mode: "krakatau_tsunami", zoomFrom: 1.01, zoomTo: 1.03, note: "ARAH PANTAI UJUNG KULON" },

  // Scene 4: Risiko Pemindahan [1200, 1608)
  { id: 16, start: 1200, end: 1295, badge: "BUKAN TERNAK", mode: "truck_stress", zoomFrom: 1.0, zoomTo: 1.02, note: "TRANSLOKASI SATWA LIAR" },
  { id: 17, start: 1295, end: 1386, badge: "PROSES ANGKUT", mode: "truck_stress", zoomFrom: 1.01, zoomTo: 1.03, note: "KONDISI JALAN & KARGO" },
  { id: 18, start: 1386, end: 1440, badge: "TARUHAN NYAWA", mode: "truck_stress", zoomFrom: 1.01, zoomTo: 1.03, note: "RISIKO FATAL" },
  { id: 19, start: 1440, end: 1520, badge: "SATWA PEMALU", mode: "truck_stress", zoomFrom: 1.0, zoomTo: 1.02, note: "SENSITIF GANGGUAN" },
  { id: 20, start: 1520, end: 1608, badge: "STRES BERAT", mode: "truck_stress", zoomFrom: 1.01, zoomTo: 1.03, note: "DETAK JANTUNG MENINGKAT" },

  // Scene 5: Kasus Musofa [1608, 1842)
  { id: 21, start: 1608, end: 1644, badge: "BUKTI LAPANGAN", mode: "musofa_flatline", zoomFrom: 1.0, zoomTo: 1.02, note: "CATATAN KASUS" },
  { id: 22, start: 1644, end: 1745, badge: "KASUS MUSOFA", mode: "musofa_flatline", zoomFrom: 1.0, zoomTo: 1.02, note: "BADAK JANTAN MUSOFA" },
  { id: 23, start: 1745, end: 1842, badge: "PASCA PINDAH", mode: "musofa_flatline", zoomFrom: 1.0, zoomTo: 1.02, note: "MATI BEBERAPA HARI" },

  // Scene 6: Perbandingan Jarak [1842, 2076)
  { id: 24, start: 1842, end: 1980, badge: "DALAM KAWASAN", mode: "distance_compare", zoomFrom: 1.0, zoomTo: 1.02, note: "< 15 KM (LOKAL)" },
  { id: 25, start: 1980, end: 2076, badge: "JARAK EKSTREM", mode: "distance_compare", zoomFrom: 1.0, zoomTo: 1.02, note: "~1.000 KM (JATIM)" },

  // Scene 7: Adaptasi Habitat [2076, 2520)
  { id: 26, start: 2076, end: 2142, badge: "PERUBAHAN LINGKUNGAN", mode: "savanna_risk", zoomFrom: 1.0, zoomTo: 1.02, note: "DARI HUTAN KE LOKASI BARU" },
  { id: 27, start: 2142, end: 2240, badge: "STUDI KONSERVASI", mode: "savanna_risk", zoomFrom: 1.0, zoomTo: 1.02, note: "TANTANGAN ADAPTASI" },
  { id: 28, start: 2240, end: 2334, badge: "HABITAT ASING", mode: "savanna_risk", zoomFrom: 1.01, zoomTo: 1.03, note: "IKLIM & KONDISI BEDA" },
  { id: 29, start: 2334, end: 2442, badge: "POLA PAKAN", mode: "savanna_risk", zoomFrom: 1.01, zoomTo: 1.03, note: "JENIS TUMBUHAN BERUBAH" },
  { id: 30, start: 2442, end: 2520, badge: "DAMPAK JANGKA PANJANG", mode: "savanna_risk", zoomFrom: 1.01, zoomTo: 1.03, note: "PENURUNAN REPRODUKSI" },

  // Scene 8: Invasi Langkap [2520, 2928)
  { id: 31, start: 2520, end: 2605, badge: "PR UJUNG KULON", mode: "langkap_canopy", zoomFrom: 1.0, zoomTo: 1.02, note: "RUMAH ASLI PERLU BENAHI" },
  { id: 32, start: 2605, end: 2694, badge: "INVASI LANGKAP", mode: "langkap_canopy", zoomFrom: 1.01, zoomTo: 1.03, note: "TUMBUH RAPAT DI HUTAN" },
  { id: 33, start: 2694, end: 2826, badge: "CAHAYA TERBLOKIR", mode: "langkap_canopy", zoomFrom: 1.01, zoomTo: 1.03, note: "PAKAN BAWAH MENYUSUT" },
  { id: 34, start: 2826, end: 2928, badge: "ZONA PENYANGGA", mode: "langkap_canopy", zoomFrom: 1.0, zoomTo: 1.02, note: "TEKANAN SEKITAR KAWASAN" },

  // Scene 9: Konservasi [2928, 3372)
  { id: 35, start: 2928, end: 3000, badge: "PANDANGAN AHLI", mode: "conservation_plan", zoomFrom: 1.0, zoomTo: 1.02, note: "EVALUASI RISIKO" },
  { id: 36, start: 3000, end: 3108, badge: "HINDARI RISIKO FATAL", mode: "conservation_plan", zoomFrom: 1.0, zoomTo: 1.03, note: "TIDAK MEMINDAHKAN JAUH" },
  { id: 37, start: 3108, end: 3210, badge: "FOKUS ANGGARAN & SDM", mode: "conservation_plan", zoomFrom: 1.01, zoomTo: 1.03, note: "ALOKASI LEBIH TEPAT" },
  { id: 38, start: 3210, end: 3372, badge: "PERKUAT HABITAT", mode: "conservation_plan", zoomFrom: 1.01, zoomTo: 1.03, note: "JAGA KETAT UJUNG KULON" },

  // Scene 10: Outro [3372, 3625)
  { id: 39, start: 3372, end: 3498, badge: "OPSI A VS OPSI B", mode: "outro_split", zoomFrom: 1.0, zoomTo: 1.02, note: "PINDAH VS PERKUAT" },
  { id: 40, start: 3498, end: 3625, badge: "TULIS DI KOMENTAR", mode: "outro_split", zoomFrom: 1.0, zoomTo: 1.02, note: "PENDAPAT KAMU?" },
];

const getShot = (frame: number): ShotSpec => {
  return (
    SHOTS.find((s) => frame >= s.start && frame < s.end) || SHOTS[SHOTS.length - 1]
  );
};

/**
 * Full-bleed cross-section earth component spanning Y=980..1920 on the 1080x1920 canvas.
 * Subtitles sit in Y=1220..1555, so depth markers at Y=1025 (0 M), Y=1145 (-5 M), and Y=1650 (-12 M)
 * have ZERO collision with subtitle lines.
 */
const Scene1GroundCrossSection: React.FC<{
  localFrame: number;
  progress: number;
}> = ({ localFrame, progress }) => {
  const wave = Math.sin(localFrame * 0.08) * 3;
  return (
    <svg
      viewBox="0 0 1080 940"
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 0, bottom: 0, width: 1080, height: 940, overflow: "visible" }}
    >
      {/* Deep Bedrock Layer (-5m to -12m) */}
      <rect x="0" y="230" width="1080" height="710" fill={THEME.ground.deepSoil} />

      {/* Sub-soil Layer (0 to -5m) */}
      <path
        d={`M0 110 Q270 ${104 + wave}, 540 112 T1080 108 L1080 250 L0 250 Z`}
        fill={THEME.ground.subSoil}
      />

      {/* Topsoil Layer */}
      <path
        d={`M0 40 Q270 ${36 - wave * 0.5}, 540 42 T1080 38 L1080 128 L0 128 Z`}
        fill={THEME.ground.topSoil}
      />

      {/* Grass Surface Strip */}
      <path
        d={`M0 0 Q270 ${-3 + wave * 0.4}, 540 2 T1080 -2 L1080 48 L0 48 Z`}
        fill={THEME.ground.grass}
      />
      <path
        d={`M0 0 Q270 ${-3 + wave * 0.4}, 540 2 T1080 -2`}
        stroke="#0F172A"
        strokeWidth="5"
        fill="none"
      />

      {/* Depth Axis Ruler */}
      <line x1="48" y1="20" x2="48" y2="740" stroke="#0F172A" strokeWidth="4" strokeDasharray="10 8" opacity="0.7" />

      {/* Depth Labels positioned cleanly ABOVE (Y=45, 165) and BELOW (Y=675) Subtitle Zone */}
      <TechnicalCallout
        x1={48}
        y1={24}
        x2={108}
        y2={42}
        label="PERMUKAAN (0 M)"
        progress={progress}
        attachSide="left"
        boxWidth={270}
        boxHeight={48}
        fontSize={21}
      />

      <TechnicalCallout
        x1={48}
        y1={165}
        x2={108}
        y2={175}
        label="LAPISAN BAWAH (-5 M)"
        progress={progress}
        attachSide="left"
        boxWidth={310}
        boxHeight={48}
        fontSize={21}
      />

      <TechnicalCallout
        x1={48}
        y1={680}
        x2={108}
        y2={680}
        label="BATUAN DASAR (-12 M)"
        color="#0F172A"
        progress={progress}
        attachSide="left"
        boxWidth={315}
        boxHeight={48}
        fontSize={21}
      />
    </svg>
  );
};

export const BadakEp2Short: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const shot = getShot(frame);
  const localFrame = frame - shot.start;
  const shotLen = Math.max(1, shot.end - shot.start);
  const p = Math.min(1, Math.max(0, localFrame / shotLen));

  const scale = interpolate(
    p,
    [0, 1],
    [shot.zoomFrom ?? 1.0, shot.zoomTo ?? 1.03]
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

  const cloudShift = (frame * 1.1) % 1500;
  const badgeSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 160 },
  });

  // Virtual 1080x1920 scale factor (0.5 in 540x960 preview, 1.0 in 1080x1920 final)
  const uiScale = width / 1080;

  return (
    <AbsoluteFill
      style={{
        background: THEME.sky.gradient,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("audio/pemindahan_badak_jawa.mp3")} />

      {/* Virtual 1080x1920 Stage Container — ensures 100% WYSIWYG parity between Preview & Final */}
      <div
        style={{
          width: 1080,
          height: 1920,
          position: "absolute",
          top: 0,
          left: 0,
          transform: `scale(${uiScale})`,
          transformOrigin: "top left",
          overflow: "hidden",
        }}
      >
        {/* Daylight Sun & Moving Clouds */}
        <svg
          viewBox="0 0 1080 420"
          style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 420, zIndex: 1, pointerEvents: "none" }}
        >
          <circle cx="930" cy="128" r="62" fill="#FDE047" opacity="0.95" />
          <circle cx="930" cy="128" r="88" fill="#FEF08A" opacity="0.38" />
          <g transform={`translate(${-cloudShift + 280}, 70)`}>
            <ellipse cx="140" cy="70" rx="88" ry="30" fill="#FFFFFF" opacity="0.92" />
            <ellipse cx="115" cy="54" rx="50" ry="26" fill="#FFFFFF" opacity="0.96" />
            <ellipse cx="168" cy="56" rx="44" ry="22" fill="#FFFFFF" opacity="0.96" />
          </g>
          <g transform={`translate(${-cloudShift + 920}, 115)`}>
            <ellipse cx="140" cy="70" rx="95" ry="32" fill="#FFFFFF" opacity="0.88" />
            <ellipse cx="120" cy="50" rx="54" ry="28" fill="#FFFFFF" opacity="0.92" />
          </g>
        </svg>

        {/* Main Animated 2.5D Stage */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: "50% 50%",
            overflow: "hidden",
            zIndex: 5,
          }}
        >
          {/* SCENE 1: Hook & Concept Introduction */}
          {(shot.mode === "forest_overview" ||
            shot.mode === "rhino_callout" ||
            shot.mode === "scientist_reject" ||
            shot.mode === "hook_title") && (
            <div style={{ position: "relative", width: 1080, height: 1920 }}>
              {/* Multi-layer Tropical Forest Rising from Grass Line (Y = 980) */}
              <svg
                viewBox="0 0 1080 700"
                preserveAspectRatio="none"
                style={{ position: "absolute", bottom: 935, left: 0, width: 1080, height: 680 }}
              >
                <path d="M0 440 Q180 290 380 360 Q580 430 780 330 Q950 250 1080 340 L1080 700 L0 700 Z" fill="#4ADE80" opacity="0.45" />
                <path d="M0 500 Q220 350 460 420 Q680 480 900 390 Q1000 350 1080 420 L1080 700 L0 700 Z" fill="#22C55E" opacity="0.65" />
                {[60, 180, 310, 450, 590, 720, 850, 980].map((x, i) => (
                  <g key={`tree-b-${i}`} transform={`translate(${x}, ${470 + (i % 3) * 18})`}>
                    <rect x="-8" y="0" width="16" height="160" fill="#15803D" />
                    <ellipse cx="0" cy="-15" rx={50 + (i % 2) * 14} ry="64" fill="#16A34A" stroke="#0F172A" strokeWidth="2.5" opacity="0.92" />
                    <ellipse cx="0" cy="-36" rx={34 + (i % 2) * 10} ry="46" fill="#22C55E" opacity="0.85" />
                  </g>
                ))}
                {[10, 140, 275, 415, 555, 690, 825, 960, 1070].map((x, i) => (
                  <g key={`tree-f-${i}`} transform={`translate(${x}, ${540 + (i % 2) * 12})`}>
                    <rect x="-10" y="0" width="20" height="160" fill="#166534" />
                    <ellipse cx="0" cy="-18" rx={60 + (i % 3) * 10} ry="74" fill="#15803D" stroke="#0F172A" strokeWidth="3" />
                    <ellipse cx="-14" cy="-38" rx="38" ry="48" fill="#16A34A" opacity="0.92" />
                    <ellipse cx="16" cy="-42" rx="34" ry="44" fill="#4ADE80" opacity="0.78" />
                  </g>
                ))}
              </svg>

              {/* Continuous Full-Bleed Cross-Section Soil */}
              <Scene1GroundCrossSection localFrame={localFrame} progress={p} />

              {/* Centered Organic Javan Rhino standing cleanly on grass line */}
              <div style={{ position: "absolute", bottom: 912, left: "50%", transform: "translateX(-50%)" }}>
                <RhinoIllustration
                  frame={frame}
                  scale={0.86}
                  walkSpeed={shot.mode === "forest_overview" ? 1 : 0.4}
                />
              </div>

              {/* ScoreBoard — visible starting Shot 3+, neatly placed in upper-right safe margin */}
              <ScoreBoard
                frame={localFrame}
                visible={shot.id >= 3}
                highlight={shot.mode === "scientist_reject" ? "perkuat" : "none"}
              />

              {/* Photo Inset (Shot 4 only) cleanly separated from CalloutChip & ScoreBoard */}
              {shot.mode === "rhino_callout" && shot.id === 4 && (
                <div
                  style={{
                    position: "absolute",
                    top: 325,
                    left: 40,
                    width: 205,
                    height: 205,
                    borderRadius: 20,
                    overflow: "hidden",
                    border: `4px solid ${THEME.ink}`,
                    boxShadow: "0 8px 0 rgba(15,23,42,0.24)",
                    zIndex: 25,
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
                  top={325}
                  left={shot.mode === "rhino_callout" && shot.id === 4 ? 268 : 40}
                  accent={shot.mode === "scientist_reject" ? THEME.accent.danger : THEME.accent.success}
                  progress={p}
                />
              )}
            </div>
          )}

          {/* SCENE 2: Java Relocation Map Route */}
          {shot.mode === "map_route" && (
            <JavaIslandMap frame={frame} progress={p} shotId={shot.id} />
          )}

          {/* SCENE 3: Anak Krakatau & Sunda Strait Tsunami */}
          {shot.mode === "krakatau_tsunami" && (
            <KrakatauTsunamiScene frame={frame} localFrame={localFrame} progress={p} note={shot.note} />
          )}

          {/* SCENE 4: Translocation Truck & Severe Stress EKG */}
          {shot.mode === "truck_stress" && (
            <TruckTranslocationScene frame={frame} localFrame={localFrame} progress={p} shotId={shot.id} note={shot.note} />
          )}

          {/* SCENE 5: Musofa Case Study Archive & EKG Flatline */}
          {shot.mode === "musofa_flatline" && (
            <MusofaArchiveScene frame={frame} localFrame={localFrame} progress={p} shotId={shot.id} note={shot.note} />
          )}

          {/* SCENE 6: Distance Comparison (< 15 KM vs ~1.000 KM) */}
          {shot.mode === "distance_compare" && (
            <DistanceCompareScene frame={frame} progress={p} shotId={shot.id} />
          )}

          {/* SCENE 7: Habitat Adaptation & Qualitative Chart */}
          {shot.mode === "savanna_risk" && (
            <HabitatAdaptationScene frame={frame} progress={p} shotId={shot.id} />
          )}

          {/* SCENE 8: Langkap Canopy Invasion & Buffer Zone */}
          {shot.mode === "langkap_canopy" && (
            <LangkapInvasionScene frame={frame} progress={p} shotId={shot.id} />
          )}

          {/* SCENE 9: Habitat Restoration & Mother-Calf Rhinos */}
          {shot.mode === "conservation_plan" && (
            <HabitatRecoveryScene frame={frame} progress={p} shotId={shot.id} />
          )}

          {/* SCENE 10: Outro Split-Screen & CTA */}
          {shot.mode === "outro_split" && (
            <OutroSplitScene frame={frame} shotId={shot.id} />
          )}
        </div>

        {/* Top Safe-Zone Badge (fixed at Y = 220px, cleanly separated from stage top = 325px) */}
        <div
          style={{
            position: "absolute",
            top: 220,
            left: "50%",
            transform: `translateX(-50%) scale(${0.92 + 0.08 * badgeSpring})`,
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "14px 40px",
            borderRadius: 999,
            fontFamily: THEME.font,
            fontWeight: 900,
            fontSize: 38,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            zIndex: 50,
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.25)",
          }}
        >
          {shot.badge}
        </div>
      </div>

      {/* Bottom Safe-Zone Subtitle (renders directly at root AbsoluteFill; natively handles 540p vs 1080p) */}
      <SubtitleOverlay frame={frame} />
    </AbsoluteFill>
  );
};
