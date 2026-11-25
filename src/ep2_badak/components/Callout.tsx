import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";

interface CalloutProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  unit?: string;
  color?: string;
  progress?: number;
  attachSide?: "left" | "right" | "top" | "bottom";
  boxWidth?: number;
  boxHeight?: number;
  fontSize?: number;
}

/**
 * Technical Callout Component — @ceritateknik style (1080x1920 mobile-readable scale)
 * Crisp 2.5px leader line + anchor dot + padded white label card.
 */
export const TechnicalCallout: React.FC<CalloutProps> = ({
  x1,
  y1,
  x2,
  y2,
  label,
  unit,
  color = THEME.callout.line,
  progress = 1,
  attachSide = "left",
  boxWidth = 280,
  boxHeight = unit ? 72 : 52,
  fontSize = 24,
}) => {
  const opacity = interpolate(progress, [0, 0.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineProgress = interpolate(progress, [0.05, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lx2 = x1 + (x2 - x1) * lineProgress;
  const ly2 = y1 + (y2 - y1) * lineProgress;

  let bx = x2;
  let by = y2 - boxHeight / 2;
  if (attachSide === "right") bx = x2 - boxWidth;
  if (attachSide === "top") {
    bx = x2 - boxWidth / 2;
    by = y2;
  }
  if (attachSide === "bottom") {
    bx = x2 - boxWidth / 2;
    by = y2 - boxHeight;
  }

  return (
    <g opacity={opacity}>
      <line
        x1={x1}
        y1={y1}
        x2={lx2}
        y2={ly2}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={x1} cy={y1} r={6} fill={color} />
      {progress > 0.08 && (
        <>
          <rect
            x={bx}
            y={by}
            width={boxWidth}
            height={boxHeight}
            rx={12}
            fill={THEME.callout.bg}
            stroke={color}
            strokeWidth={3}
            filter="drop-shadow(0 4px 0 rgba(15,23,42,0.22))"
          />
          <text
            x={bx + boxWidth / 2}
            y={by + (unit ? fontSize + 10 : boxHeight / 2 + fontSize * 0.36)}
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight={900}
            fontSize={fontSize}
            fill={color}
          >
            {label}
          </text>
          {unit && (
            <text
              x={bx + boxWidth / 2}
              y={by + fontSize * 1.95 + 10}
              textAnchor="middle"
              fontFamily={THEME.font}
              fontWeight={800}
              fontSize={Math.max(18, Math.round(fontSize * 0.8))}
              fill={THEME.inkLight}
            >
              {unit}
            </text>
          )}
        </>
      )}
    </g>
  );
};

interface DivCalloutProps {
  label: string;
  subLabel?: string;
  accent?: string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  progress?: number;
}

export const CalloutChip: React.FC<DivCalloutProps> = ({
  label,
  subLabel,
  accent = THEME.ink,
  top,
  left,
  right,
  bottom,
  progress = 1,
}) => {
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
        bottom,
        opacity: op,
        transform: `scale(${pop})`,
        transformOrigin: left !== undefined ? "left center" : "right center",
        backgroundColor: THEME.callout.bg,
        border: `4px solid ${accent}`,
        borderRadius: 18,
        padding: "12px 24px",
        boxShadow: "0 8px 0 rgba(15, 23, 42, 0.22)",
        zIndex: 25,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: THEME.font,
          fontWeight: 900,
          fontSize: 30,
          color: accent,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {subLabel && (
        <span
          style={{
            fontFamily: THEME.font,
            fontWeight: 800,
            fontSize: 22,
            color: THEME.inkLight,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            whiteSpace: "nowrap",
          }}
        >
          {subLabel}
        </span>
      )}
    </div>
  );
};
