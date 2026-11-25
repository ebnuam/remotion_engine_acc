import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { RhinoIllustration } from "./RhinoIllustration";

interface HabitatAdaptationSceneProps {
  frame: number;
  progress: number;
  shotId: number;
}

/**
 * Scene 7: Transition Cross-Section (Moist Forest -> Dry Unfamiliar Habitat)
 * + 3 Obstacle Callouts + Qualitative Bar Chart ("MAYORITAS GAGAL", NO fake percentages)
 * Native 1080x1920 bright daytime layout.
 */
export const HabitatAdaptationScene: React.FC<HabitatAdaptationSceneProps> = ({
  frame,
  progress,
  shotId,
}) => {
  // Transition progress across Shots 26-30
  const dryRatio =
    shotId === 26
      ? interpolate(progress, [0, 1], [0.35, 0.55])
      : shotId === 27
      ? 0.6
      : 0.68;

  const splitX = Math.round(1080 * (1 - dryRatio));

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      {/* ================= 1. TOP LEFT: 3 OBSTACLE CALLOUTS ================= */}
      <div
        style={{
          position: "absolute",
          top: 325,
          left: 42,
          width: 495,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          zIndex: 25,
          fontFamily: THEME.font,
        }}
      >
        {[
          { num: "1", text: "SUSAH ADAPTASI", activeFrom: 26 },
          { num: "2", text: "POLA MAKAN TERGANGGU", activeFrom: 28 },
          { num: "3", text: "GAGAL BERKEMBANG BIAK", activeFrom: 29 },
        ].map((item) => {
          const isHighlighted = shotId >= item.activeFrom;
          return (
            <div
              key={item.num}
              style={{
                backgroundColor: isHighlighted ? "#FFFDF7" : "rgba(255,253,247,0.85)",
                border: isHighlighted ? "4px solid #DC2626" : "3px solid #0F172A",
                borderRadius: 16,
                padding: "12px 18px",
                boxShadow: "0 6px 0 rgba(15,23,42,0.18)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: isHighlighted ? "#DC2626" : "#0F172A",
                  color: "#FFFFFF",
                  fontSize: 22,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.num}
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: isHighlighted ? "#DC2626" : "#0F172A",
                }}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* ================= 2. TOP RIGHT: QUALITATIVE BAR CHART ("MAYORITAS GAGAL") ================= */}
      <div
        style={{
          position: "absolute",
          top: 325,
          right: 42,
          width: 470,
          backgroundColor: "#FFFDF7",
          border: "4px solid #0F172A",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 0 rgba(15,23,42,0.22)",
          zIndex: 25,
          fontFamily: THEME.font,
        }}
      >
        <div
          style={{
            backgroundColor: "#0F172A",
            padding: "10px 18px",
            fontSize: 21,
            fontWeight: 900,
            color: "#FFFFFF",
            textAlign: "center",
            letterSpacing: 0.6,
          }}
        >
          STUDI KONSERVASI SATWA
        </div>

        <div style={{ padding: "18px 22px", display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 220 }}>
          {/* Berhasil Bar (Short) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#15803D" }}>SEDIKIT</span>
            <div
              style={{
                width: 96,
                height: 44,
                backgroundColor: "#22C55E",
                border: "3.5px solid #0F172A",
                borderRadius: "10px 10px 4px 4px",
              }}
            />
            <span style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>BERHASIL</span>
          </div>

          {/* Gagal Bar (Tall - Qualitative Mayoritas Gagal, NO fake percentage) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 21, fontWeight: 900, color: "#DC2626" }}>MAYORITAS</span>
            <div
              style={{
                width: 112,
                height: 132,
                background: "linear-gradient(180deg, #EF4444 0%, #DC2626 100%)",
                border: "3.5px solid #0F172A",
                borderRadius: "10px 10px 4px 4px",
              }}
            />
            <span style={{ fontSize: 22, fontWeight: 900, color: "#DC2626" }}>SERING GAGAL</span>
          </div>
        </div>
      </div>

      {/* ================= 3. CROSS-SECTION TRANSITION (MOIST FOREST -> DRY SAVANNA) ================= */}
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
      >
        {/* Background Left Foliage (Moist Green) */}
        <g>
          <rect x="0" y="640" width={splitX} height="340" fill="#DCFCE7" opacity="0.45" />
          {[85, 220].map((tx, i) => (
            <g key={i} transform={`translate(${tx}, 920)`}>
              <rect x="-10" y="-130" width="20" height="190" fill="#15803D" />
              <ellipse cx="0" cy="-165" rx="76" ry="82" fill="#16A34A" stroke="#0F172A" strokeWidth="3.5" />
            </g>
          ))}
        </g>

        {/* Background Right Foliage (Dry Unfamiliar Scrub - Bright Daytime) */}
        <g>
          <rect x={splitX} y="640" width={1080 - splitX} height="340" fill="#FEF3C7" opacity="0.55" />
          {[680, 920].map((tx, i) => (
            <g key={i} transform={`translate(${tx}, 920)`}>
              <rect x="-8" y="-95" width="16" height="155" fill="#78350F" />
              <ellipse cx="0" cy="-120" rx="68" ry="42" fill="#CA8A04" stroke="#0F172A" strokeWidth="3" />
            </g>
          ))}
        </g>

        {/* Left Moist Soil Cross-Section (0..splitX) */}
        <g>
          <rect x="0" y="980" width={splitX} height="940" fill="#451A03" />
          <rect x="0" y="980" width={splitX} height="170" fill="#854D0E" />
          <rect x="0" y="980" width={splitX} height="48" fill="#16A34A" stroke="#0F172A" strokeWidth="4" />
        </g>

        {/* Right Dry Habitat Cross-Section (splitX..1080) */}
        <g>
          <rect x={splitX} y="980" width={1080 - splitX} height="940" fill="#713F12" />
          <rect x={splitX} y="980" width={1080 - splitX} height="170" fill="#CA8A04" />
          <rect x={splitX} y="980" width={1080 - splitX} height="48" fill="#EAB308" stroke="#0F172A" strokeWidth="4" />
          {/* Soil cracks */}
          <path d={`M ${splitX + 120} 1028 L ${splitX + 145} 1085 L ${splitX + 130} 1130`} stroke="#78350F" strokeWidth="4" fill="none" />
          <path d={`M ${splitX + 360} 1028 L ${splitX + 340} 1095`} stroke="#78350F" strokeWidth="4" fill="none" />
        </g>

        {/* Transition Divider Line & Bold Label Pills Above Ground */}
        <line x1={splitX} y1="670" x2={splitX} y2="1170" stroke="#EA580C" strokeWidth="5" strokeDasharray="12 8" />

        <g transform="translate(175, 1088)">
          <rect x="-135" y="-26" width="270" height="52" rx="12" fill="#FFFDF7" stroke="#16A34A" strokeWidth="3.5" />
          <text x="0" y="9" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="23" fill="#15803D">
            HUTAN LEMBAP
          </text>
        </g>

        <g transform="translate(830, 1088)">
          <rect x="-155" y="-26" width="310" height="52" rx="12" fill="#FFFDF7" stroke="#D97706" strokeWidth="3.5" />
          <text x="0" y="9" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="23" fill="#B45309">
            HABITAT ASING KERING
          </text>
        </g>
      </svg>

      {/* ================= 4. RHINO STANDING ON CROSS-SECTION GRASS ================= */}
      <div
        style={{
          position: "absolute",
          bottom: 912,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
        }}
      >
        <RhinoIllustration frame={frame} scale={0.82} walkSpeed={0.35} flipX={true} />
      </div>
    </div>
  );
};
