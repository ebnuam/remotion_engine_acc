import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { RhinoIllustration } from "./RhinoIllustration";

interface HabitatRecoverySceneProps {
  frame: number;
  progress: number;
  shotId: number;
}

/**
 * Scene 9: Ujung Kulon Habitat Restoration & Conservation Focus (1080x1920)
 * - Cleared Langkap canopy -> golden sunbeams reach forest floor
 * - Lush food plants flourishing
 * - Allocation badges: ANGGARAN & TENAGA PATROLI flowing down with green arrows
 * - Mother + Calf Javan Rhinos walking intact & unclipped in center
 */
export const HabitatRecoveryScene: React.FC<HabitatRecoverySceneProps> = ({
  frame,
  progress,
  shotId,
}) => {
  const growthScale = interpolate(progress, [0, 1], [0.75, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const highlightKey = shotId >= 37;

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
      >
        {/* ================= 1. RADIANT SUNLIGHT STREAMING TO FLOOR ================= */}
        <g opacity="0.45">
          <polygon points="460,180 620,180 860,980 220,980" fill="#FEF08A" />
        </g>

        {/* ================= 2. THRIVING FOREST BACKGROUND & NEW SHOOTS ================= */}
        <path d="M 0 880 Q 280 730 540 830 T 1080 790 L 1080 980 L 0 980 Z" fill="#4ADE80" opacity="0.45" />
        {[80, 990].map((tx, idx) => (
          <g key={idx} transform={`translate(${tx}, 940)`}>
            <rect x="-12" y="-180" width="24" height="220" fill="#15803D" />
            <ellipse cx="0" cy="-215" rx="82" ry="90" fill="#22C55E" stroke="#0F172A" strokeWidth="4" />
          </g>
        ))}

        {/* Thriving Native Food Plants on Forest Floor */}
        {[160, 310, 770, 920].map((px, idx) => (
          <g key={idx} transform={`translate(${px}, 980) scale(${growthScale})`}>
            <path d="M 0 0 Q -25 -55 -48 -78" stroke="#15803D" strokeWidth="7" fill="none" />
            <path d="M 0 0 Q 25 -60 46 -84" stroke="#16A34A" strokeWidth="7" fill="none" />
            <ellipse cx="-44" cy="-82" rx="22" ry="13" fill="#4ADE80" stroke="#0F172A" strokeWidth="2.5" />
            <ellipse cx="44" cy="-88" rx="22" ry="13" fill="#22C55E" stroke="#0F172A" strokeWidth="2.5" />
          </g>
        ))}

        {/* ================= 3. FERTILE CROSS-SECTION SOIL ================= */}
        <rect x="0" y="1140" width="1080" height="780" fill="#365314" />
        <rect x="0" y="1020" width="1080" height="125" fill="#4D7C0F" />
        <rect x="0" y="980" width="1080" height="46" fill="#22C55E" stroke="#0F172A" strokeWidth="4" />

        {/* ================= 4. RESOURCE ALLOCATION CARDS & FLOW ARROWS ================= */}
        {/* Card 1: Anggaran */}
        <g transform="translate(270, 385)">
          <rect
            x="-210"
            y="-44"
            width="420"
            height="88"
            rx="18"
            fill="#FFFDF7"
            stroke="#16A34A"
            strokeWidth="4.5"
            filter="drop-shadow(0 6px 0 rgba(15,23,42,0.22))"
          />
          <text x="0" y="-6" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="24" fill="#15803D">
            FOKUS ANGGARAN
          </text>
          <text x="0" y="26" textAnchor="middle" fontFamily={THEME.font} fontWeight="800" fontSize="20" fill="#475569">
            PEMULIHAN HABITAT ASLI
          </text>
        </g>

        {/* Card 2: Tenaga / Patroli */}
        <g transform="translate(810, 385)">
          <rect
            x="-210"
            y="-44"
            width="420"
            height="88"
            rx="18"
            fill="#FFFDF7"
            stroke="#16A34A"
            strokeWidth="4.5"
            filter="drop-shadow(0 6px 0 rgba(15,23,42,0.22))"
          />
          <text x="0" y="-6" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="24" fill="#15803D">
            TENAGA & PATROLI
          </text>
          <text x="0" y="26" textAnchor="middle" fontFamily={THEME.font} fontWeight="800" fontSize="20" fill="#475569">
            JAGA KETAT UJUNG KULON
          </text>
        </g>

        {/* Downward Emerald Flow Arrows */}
        {[270, 810].map((ax, idx) => (
          <g key={idx}>
            <line x1={ax} y1="445" x2={ax} y2="555" stroke="#16A34A" strokeWidth="14" strokeLinecap="round" />
            <polygon points={`${ax},580 ${ax - 22},542 ${ax + 22},542`} fill="#16A34A" stroke="#0F172A" strokeWidth="2" />
          </g>
        ))}

        {/* Key Banner on Soil Below Grass (Above Subtitle Zone) */}
        <g transform="translate(540, 1098)">
          <rect
            x="-370"
            y="-34"
            width="740"
            height="68"
            rx="16"
            fill={highlightKey ? "#DCFCE7" : "#FFFDF7"}
            stroke="#16A34A"
            strokeWidth="4.5"
            filter="drop-shadow(0 5px 0 rgba(15,23,42,0.22))"
          />
          <text x="0" y="10" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="26" fill="#14532D">
            PERKUAT HABITAT: PAKAN & CAHAYA PULIH
          </text>
        </g>
      </svg>

      {/* ================= 5. MOTHER & CALF RHINOS INTACT IN CENTER ================= */}
      {/* Both positioned squarely inside X=85..970 on grass surface */}
      <div
        style={{
          position: "absolute",
          bottom: 912,
          left: 85,
          zIndex: 20,
        }}
      >
        <RhinoIllustration frame={frame} scale={0.76} walkSpeed={0.9} flipX={true} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 912,
          left: 615,
          zIndex: 21,
        }}
      >
        <RhinoIllustration frame={frame + 12} scale={0.48} walkSpeed={1.1} flipX={true} />
      </div>
    </div>
  );
};
