import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { TechnicalCallout } from "./Callout";

interface KrakatauTsunamiSceneProps {
  frame: number;
  localFrame: number;
  progress: number;
  note?: string;
}

/**
 * Scene 3: Sunda Strait Cross-Section, Anak Krakatau Flank Collapse & Tsunami (1080x1920)
 * Bright daytime aesthetic with bold cause-effect arrows, clean mobile-readable labels,
 * and zero fabricated numeric stats.
 */
export const KrakatauTsunamiScene: React.FC<KrakatauTsunamiSceneProps> = ({
  frame,
  progress,
}) => {
  const slideProgress = interpolate(progress, [0.1, 0.8], [0, 32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const waveX = interpolate(progress, [0.05, 0.95], [490, 810], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
      >
        <defs>
          <linearGradient id="sundaSeaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>

        {/* ================= 1. SEABED / CRUST (Y=1080..1920) ================= */}
        {/* Subtitles sit cleanly over dark seafloor crust below Y=1210 */}
        <path
          d="M 0 1060 Q 220 1090 420 1120 L 560 1160 Q 740 1140 900 1040 L 1080 1040 L 1080 1920 L 0 1920 Z"
          fill="#334155"
          stroke="#0F172A"
          strokeWidth="5"
        />
        <path
          d="M 0 1210 Q 540 1245 1080 1200 L 1080 1920 L 0 1920 Z"
          fill="#1E293B"
        />

        {/* ================= 2. SEAWATER CROSS-SECTION (Y=880..1150) ================= */}
        <path
          d={`M 0 880
             Q 160 ${874 + Math.sin(frame * 0.12) * 5} 320 880
             L 910 880
             L 900 1040
             Q 740 1140 560 1160
             L 420 1120
             L 0 1060 Z`}
          fill="url(#sundaSeaGrad)"
        />
        <line
          x1="0"
          y1="880"
          x2="910"
          y2="880"
          stroke="#0284C7"
          strokeWidth="4"
          strokeDasharray="12 8"
        />
        <rect x="465" y="968" width="255" height="40" rx="10" fill="rgba(255,253,247,0.92)" stroke="#0284C7" strokeWidth="2.5" />
        <text
          x="592"
          y="996"
          textAnchor="middle"
          fontFamily={THEME.font}
          fontWeight="900"
          fontSize="21"
          fill="#0369A1"
        >
          PERMUKAAN LAUT
        </text>

        {/* ================= 3. RIGHT COASTLINE: TN UJUNG KULON ================= */}
        <path
          d="M 870 1060 Q 905 920 935 840 L 1080 840 L 1080 1920 L 870 1920 Z"
          fill="#16A34A"
          stroke="#0F172A"
          strokeWidth="5"
        />
        <path
          d="M 870 1060 Q 905 920 935 840 L 965 840 Q 925 935 895 1060 Z"
          fill="#FDE047"
        />
        {/* Jungle Canopy */}
        {[945, 990, 1040].map((tx, idx) => (
          <g key={idx} transform={`translate(${tx}, 840)`}>
            <rect x="-6" y="-10" width="12" height="45" fill="#15803D" />
            <ellipse cx="0" cy="-35" rx="34" ry="38" fill="#22C55E" stroke="#0F172A" strokeWidth="3.5" />
          </g>
        ))}

        {/* ================= 4. GUNUNG ANAK KRAKATAU ================= */}
        <g>
          {/* Main Cone */}
          <polygon
            points="70,1080 235,595 305,595 450,1095"
            fill="#475569"
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Magma Conduit */}
          <path d="M 258 595 L 254 1080 L 284 1080 L 280 595 Z" fill="#EF4444" />
          <ellipse cx="270" cy="595" rx="34" ry="12" fill="#EF4444" stroke="#0F172A" strokeWidth="4" />
          <ellipse cx="270" cy="595" rx="18" ry="6" fill="#FDE047" />

          {/* Steam / Ash Plume (Daylight White & Orange) */}
          <g transform={`translate(270, ${560 + Math.sin(frame * 0.14) * 7})`}>
            <circle cx="-28" cy="-32" r="36" fill="#F8FAFC" stroke="#0F172A" strokeWidth="4" />
            <circle cx="28" cy="-32" r="34" fill="#F1F5F9" stroke="#0F172A" strokeWidth="4" />
            <circle cx="0" cy="-68" r="42" fill="#E2E8F0" stroke="#0F172A" strokeWidth="4" />
            <circle cx="-12" cy="-42" r="9" fill="#F97316" />
            <circle cx="15" cy="-54" r="8" fill="#FBBF24" />
          </g>

          {/* ================= 5. FLANK COLLAPSE & THICK ARROWS ================= */}
          {/* Sliding Flank Block */}
          <g transform={`translate(${slideProgress * 0.8}, ${slideProgress * 1.1})`}>
            <polygon
              points="288,650 308,595 450,1095 385,1095"
              fill="#64748B"
              stroke="#EA580C"
              strokeWidth="5"
              strokeDasharray="10 6"
            />
          </g>
          {/* Fault Line */}
          <path
            d="M 288 650 Q 332 840 385 1095"
            stroke="#EF4444"
            strokeWidth="5"
            strokeDasharray="8 6"
            fill="none"
          />

          {/* Bold Cause-Effect Arrow 1: Flank Sliding Into Sea */}
          <path
            d="M 355 725 L 445 845"
            stroke="#EA580C"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <polygon points="462,868 416,844 452,814" fill="#EA580C" stroke="#0F172A" strokeWidth="2.5" />

          {/* Bold Cause-Effect Arrow 2: Seawater Displaced Up & Right */}
          <path
            d="M 455 925 Q 520 830 615 840"
            stroke="#F97316"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />
          <polygon points="642,844 600,864 606,818" fill="#F97316" stroke="#0F172A" strokeWidth="2.5" />
        </g>

        {/* ================= 6. TSUNAMI WAVE PROPAGATING TO UJUNG KULON ================= */}
        <g transform={`translate(${waveX}, 880)`}>
          <path
            d="M -110 0 Q -25 -165 50 -85 Q 80 -35 125 0 Z"
            fill="#38BDF8"
            stroke="#0F172A"
            strokeWidth="5.5"
          />
          <path
            d="M -30 -145 Q 25 -165 62 -92 Q 14 -102 -30 -145 Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3"
          />
          {/* Bold forward push arrow */}
          <line x1="-15" y1="-55" x2="75" y2="-55" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
          <polygon points="98,-55 64,-72 64,-38" fill="#FFFFFF" />
        </g>

        {/* ================= 7. LARGE MOBILE-READABLE CALLOUTS ================= */}
        <TechnicalCallout
          x1={270}
          y1={585}
          x2={42}
          y2={375}
          label="G. ANAK KRAKATAU"
          unit="SELAT SUNDA"
          progress={1}
          attachSide="left"
          boxWidth={300}
          boxHeight={74}
          fontSize={24}
        />

        <TechnicalCallout
          x1={395}
          y1={780}
          x2={370}
          y2={495}
          label="LONGSORAN LERENG"
          color="#EA580C"
          progress={1}
          attachSide="left"
          boxWidth={310}
          boxHeight={56}
          fontSize={24}
        />

        <TechnicalCallout
          x1={waveX + 10}
          y1={790}
          x2={560}
          y2={635}
          label="TSUNAMI BESAR"
          color="#DC2626"
          progress={1}
          attachSide="bottom"
          boxWidth={270}
          boxHeight={56}
          fontSize={24}
        />

        <TechnicalCallout
          x1={965}
          y1={830}
          x2={1035}
          y2={375}
          label="TN UJUNG KULON"
          unit="ARAH PANTAI"
          color="#15803D"
          progress={1}
          attachSide="right"
          boxWidth={280}
          boxHeight={74}
          fontSize={24}
        />
      </svg>
    </div>
  );
};
