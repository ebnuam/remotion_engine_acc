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
 * Scene 3: Sunda Strait Cross-Section, Anak Krakatau Flank Collapse & Tsunami
 * 2.5D Technical Cross-Section @ceritateknik style
 * Daytime bright aesthetic: turquoise seawater cross-section, volcanic cone,
 * animated flank collapse with displacement arrows pushing tsunami waves toward Ujung Kulon.
 */
export const KrakatauTsunamiScene: React.FC<KrakatauTsunamiSceneProps> = ({
  frame,
  localFrame,
  progress,
  note,
}) => {
  // Wave animation
  const waveCycle = (frame * 5) % 360;
  // Flank slide animation
  const slideProgress = interpolate(progress, [0.15, 0.75], [0, 24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Tsunami wave progression from Krakatau (x~340) toward Ujung Kulon (x~880)
  const waveX = interpolate(progress, [0.1, 0.95], [380, 840], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Sky is inherited from daylight gradient */}

      {/* Main Cross-Section SVG */}
      <svg
        viewBox="0 0 1080 820"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          {/* Seawater gradient */}
          <linearGradient id="seaWaterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#0284C7" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0.95" />
          </linearGradient>

          {/* Magma glow */}
          <radialGradient id="magmaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="70%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ================= 1. SEABED / OCEAN FLOOR ================= */}
        {/* Deep tectonic trench */}
        <path
          d="M 0 540 
             Q 180 560 300 580 
             L 360 480 
             L 480 490 
             L 540 600 
             Q 720 590 880 540 
             L 980 430 
             L 1080 430 
             L 1080 820 
             L 0 820 Z"
          fill="#334155"
          stroke="#0F172A"
          strokeWidth="4"
        />
        {/* Bedrock strata line */}
        <path
          d="M 0 650 Q 540 680 1080 640 L 1080 820 L 0 820 Z"
          fill="#1E293B"
        />

        {/* ================= 2. SEAWATER CROSS-SECTION ================= */}
        <path
          d={`M 0 380 
             Q 180 ${376 + Math.sin(frame * 0.1) * 4} 340 380 
             L 340 480 
             L 480 490 
             L 540 600 
             Q 720 590 880 540 
             L 980 430 
             L 1080 430 
             L 1080 380 
             Q 1030 380 980 380 
             Z`}
          fill="url(#seaWaterGrad)"
          stroke="#0284C7"
          strokeWidth="2"
        />

        {/* ================= 3. RIGHT SIDE: UJUNG KULON COASTLINE ================= */}
        {/* Landmass */}
        <path
          d="M 940 430 Q 970 380 990 350 L 1080 350 L 1080 820 L 940 820 Z"
          fill="#16A34A"
          stroke="#0F172A"
          strokeWidth="4"
        />
        {/* Sandy beach */}
        <path
          d="M 940 430 Q 960 395 980 380 L 990 380 Q 965 410 940 430 Z"
          fill="#FDE047"
          stroke="#0F172A"
          strokeWidth="2"
        />
        {/* Jungle trees on Ujung Kulon coast */}
        {[980, 1010, 1040, 1070].map((tx, idx) => (
          <g key={idx} transform={`translate(${tx}, 350)`}>
            <rect x="-4" y="0" width="8" height="35" fill="#15803D" />
            <ellipse cx="0" cy="-15" rx="20" ry="24" fill="#22C55E" stroke="#0F172A" strokeWidth="2" />
          </g>
        ))}
        {/* Coastal label box */}
        <g transform="translate(980, 290)">
          <rect
            x="-85"
            y="-16"
            width="170"
            height="34"
            rx="9"
            fill="#FFFDF7"
            stroke="#16A34A"
            strokeWidth="3"
            filter="drop-shadow(0 3px 0 rgba(15,23,42,0.2))"
          />
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="900"
            fontSize="12"
            fill="#15803D"
          >
            TN UJUNG KULON
          </text>
        </g>

        {/* ================= 4. GUNUNG ANAK KRAKATAU ================= */}
        {/* Submarine & Subaerial Volcano Base */}
        <g>
          {/* Main Volcano Cone Body */}
          <polygon
            points="120,480 270,170 320,170 420,480"
            fill="#475569"
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Submarine lower slope */}
          <polygon
            points="70,550 120,480 420,480 480,560"
            fill="#334155"
            stroke="#0F172A"
            strokeWidth="4"
          />

          {/* Magma conduit / core */}
          <path
            d="M 285 170 L 290 520 L 305 520 L 305 170 Z"
            fill="#EF4444"
            stroke="#DC2626"
            strokeWidth="2"
          />

          {/* Glowing Crater Lava */}
          <ellipse cx="295" cy="170" rx="26" ry="10" fill="#EF4444" stroke="#0F172A" strokeWidth="3" />
          <ellipse cx="295" cy="170" rx="14" ry="5" fill="#FDE047" />

          {/* Steam / Ash Plume (Daylight white/grey, NOT dark night) */}
          <g transform={`translate(295, ${150 + Math.sin(frame * 0.12) * 6})`}>
            <circle cx="-18" cy="-25" r="28" fill="#F8FAFC" stroke="#0F172A" strokeWidth="3" />
            <circle cx="18" cy="-25" r="26" fill="#F1F5F9" stroke="#0F172A" strokeWidth="3" />
            <circle cx="0" cy="-52" r="32" fill="#E2E8F0" stroke="#0F172A" strokeWidth="3" />
            <circle cx="-10" cy="-35" r="6" fill="#F97316" />
            <circle cx="12" cy="-45" r="5" fill="#FBBF24" />
          </g>

          {/* ================= 5. FLANK COLLAPSE (LONGSORAN LERENG) ================= */}
          {/* Collapsing flank section sliding down */}
          <g transform={`translate(${slideProgress * 0.7}, ${slideProgress * 1.2})`}>
            {/* Detached section */}
            <polygon
              points="300,210 320,170 420,480 370,480"
              fill="#64748B"
              stroke="#EA580C"
              strokeWidth="4"
              strokeDasharray="8 4"
            />
          </g>

          {/* Detachment Fault Line (retakan longsoran) */}
          <path
            d="M 300 210 Q 330 330 370 480"
            stroke="#EF4444"
            strokeWidth="4"
            strokeDasharray="6 4"
            fill="none"
          />

          {/* Orange Displacement Arrows (pushing water) */}
          <g transform="translate(385, 340)">
            {/* Arrow 1: Downward flank slide */}
            <path
              d="M 0 0 L 35 45"
              stroke="#EA580C"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <polygon points="35,45 22,40 32,28" fill="#EA580C" />
            {/* Arrow 2: Water displacement outward */}
            <path
              d="M 35 45 Q 70 30 110 55"
              stroke="#F97316"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <polygon points="110,55 96,52 102,40" fill="#F97316" />
          </g>
        </g>

        {/* ================= 6. ADVANCING TSUNAMI WAVE ================= */}
        {/* Wave crest moving rightward */}
        <g transform={`translate(${waveX}, 380)`}>
          {/* Main wave curl */}
          <path
            d="M -70 0 Q -20 -95 30 -50 Q 50 -20 80 0 Z"
            fill="#38BDF8"
            stroke="#0F172A"
            strokeWidth="4.5"
          />
          {/* White foam crest */}
          <path
            d="M -22 -85 Q 10 -95 35 -55 Q 5 -60 -22 -85 Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="2.5"
          />
          {/* Forward propagation speed lines */}
          <line x1="45" y1="-30" x2="85" y2="-30" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <line x1="55" y1="-15" x2="95" y2="-15" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* ================= 7. TECHNICAL CALLOUTS ================= */}
        {/* Callout 1: Anak Krakatau - positioned inside left boundary */}
        <TechnicalCallout
          x1={280}
          y1={175}
          x2={40}
          y2={110}
          label="G. ANAK KRAKATAU"
          unit="SELAT SUNDA"
          progress={1}
          attachSide="left"
          boxWidth={200}
          boxHeight={48}
          fontSize={13}
        />

        {/* Callout 2: Longsoran Lereng */}
        <TechnicalCallout
          x1={395}
          y1={320}
          x2={490}
          y2={250}
          label="LONGSORAN LERENG"
          unit="FLANK COLLAPSE"
          color="#EA580C"
          progress={1}
          attachSide="left"
          boxWidth={190}
          boxHeight={48}
          fontSize={13}
        />

        {/* Callout 3: Tsunami wave heading to Ujung Kulon */}
        <TechnicalCallout
          x1={waveX + 20}
          y1={320}
          x2={Math.min(780, waveX + 30)}
          y2={210}
          label="GELOMBANG TSUNAMI"
          unit="ARAH PANTAI UJUNG KULON"
          color="#DC2626"
          progress={1}
          attachSide="bottom"
          boxWidth={215}
          boxHeight={48}
          fontSize={13}
        />

        {/* Sea Level indicator line */}
        <line
          x1="0"
          y1="380"
          x2="940"
          y2="380"
          stroke="#0284C7"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />
        <text
          x="40"
          y="370"
          fontFamily={THEME.font}
          fontWeight="800"
          fontSize="13"
          fill="#0284C7"
        >
          PERMUKAAN LAUT (0 M)
        </text>
      </svg>
    </div>
  );
};
