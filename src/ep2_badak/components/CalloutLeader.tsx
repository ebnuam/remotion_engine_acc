import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";

interface CalloutLeaderProps {
  /** Anchor dot coordinates on the subject/feature */
  ax: number;
  ay: number;
  /** Elbow bend coordinates */
  bx: number;
  by: number;
  /** Label end coordinates */
  lx: number;
  ly: number;
  label: string;
  sublabel?: string;
  accent?: string;
  progress?: number;
  align?: "left" | "right" | "center";
  pillWidth?: number;
}

/**
 * Clean 2.5D Technical Leader-Line Callout (Anti-Boxy Style)
 * Animated dot -> elbow leader line -> lightweight high-contrast pill
 */
export const CalloutLeader: React.FC<CalloutLeaderProps> = ({
  ax,
  ay,
  bx,
  by,
  lx,
  ly,
  label,
  sublabel,
  accent = THEME.ink,
  progress = 1,
  align = "center",
  pillWidth = 280,
}) => {
  const lineProg = interpolate(progress, [0, 0.35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pillOpacity = interpolate(progress, [0.18, 0.45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const height = sublabel ? 68 : 48;
  let boxX = lx - pillWidth / 2;
  if (align === "left") boxX = lx;
  if (align === "right") boxX = lx - pillWidth;
  const boxY = ly - height / 2;

  return (
    <g>
      {/* Pulsing Target Anchor */}
      <circle cx={ax} cy={ay} r={10 * lineProg} fill={accent} opacity={0.25} />
      <circle
        cx={ax}
        cy={ay}
        r={5.5 * lineProg}
        fill={accent}
        stroke="#FFFFFF"
        strokeWidth="2.5"
      />

      {/* Crisp Technical Elbow Leader Line */}
      <path
        d={`M ${ax} ${ay} L ${bx} ${by} L ${lx} ${ly}`}
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - lineProg}
      />

      {/* Lightweight Pill Label */}
      <g opacity={pillOpacity}>
        <rect
          x={boxX}
          y={boxY}
          width={pillWidth}
          height={height}
          rx={14}
          fill="#FFFDF7"
          stroke={accent}
          strokeWidth="3.5"
          filter="drop-shadow(0 5px 0 rgba(15,23,42,0.18))"
        />
        <text
          x={boxX + pillWidth / 2}
          y={sublabel ? boxY + 28 : boxY + 32}
          textAnchor="middle"
          fontFamily={THEME.font}
          fontWeight="900"
          fontSize="23"
          fill={accent}
        >
          {label}
        </text>
        {sublabel && (
          <text
            x={boxX + pillWidth / 2}
            y={boxY + 52}
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="800"
            fontSize="17"
            fill={THEME.inkSoft}
          >
            {sublabel}
          </text>
        )}
      </g>
    </g>
  );
};
