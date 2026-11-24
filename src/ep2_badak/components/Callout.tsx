import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";

/**
 * Technical Callout Component — @ceritateknik style
 * Renders an SVG line + anchor dot + label box pointing from an anchor to a label.
 *
 * Usage: Wrap inside an SVG with the same viewBox as the scene.
 */

interface CalloutProps {
  /** Anchor point (tip of the arrow / where the line starts) */
  x1: number;
  y1: number;
  /** Label box center position */
  x2: number;
  y2: number;
  label: string;
  unit?: string;
  color?: string;
  /** 0–1 progress for entry animation */
  progress?: number;
  /** Side of label box the line attaches to: "left" | "right" | "top" | "bottom" */
  attachSide?: "left" | "right" | "top" | "bottom";
  /** Box width in SVG units */
  boxWidth?: number;
  boxHeight?: number;
  fontSize?: number;
}

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
  boxWidth = 180,
  boxHeight = unit ? 52 : 36,
  fontSize = 18,
}) => {
  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineProgress = interpolate(progress, [0.1, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Interpolate line endpoint from anchor toward label
  const lx2 = x1 + (x2 - x1) * lineProgress;
  const ly2 = y1 + (y2 - y1) * lineProgress;

  // Label box origin (top-left)
  let bx = x2;
  let by = y2 - boxHeight / 2;
  if (attachSide === "right") bx = x2 - boxWidth;
  if (attachSide === "top") { bx = x2 - boxWidth / 2; by = y2; }
  if (attachSide === "bottom") { bx = x2 - boxWidth / 2; by = y2 - boxHeight; }

  return (
    <g opacity={opacity}>
      {/* Leader line */}
      <line
        x1={x1}
        y1={y1}
        x2={lx2}
        y2={ly2}
        stroke={color}
        strokeWidth={THEME.callout.lineWidth}
        strokeLinecap="round"
      />
      {/* Anchor dot */}
      <circle
        cx={x1}
        cy={y1}
        r={THEME.callout.dot / 2}
        fill={color}
      />
      {/* Label box */}
      {progress > 0.1 && (
        <>
          <rect
            x={bx}
            y={by}
            width={boxWidth}
            height={boxHeight}
            rx={8}
            fill={THEME.callout.bg}
            stroke={color}
            strokeWidth={1.5}
            filter="drop-shadow(0 2px 0 rgba(15,23,42,0.18))"
          />
          <text
            x={bx + boxWidth / 2}
            y={by + (unit ? fontSize + 4 : boxHeight / 2 + fontSize * 0.35)}
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight={800}
            fontSize={fontSize}
            fill={color}
          >
            {label}
          </text>
          {unit && (
            <text
              x={bx + boxWidth / 2}
              y={by + fontSize * 2 + 4}
              textAnchor="middle"
              fontFamily={THEME.font}
              fontWeight={600}
              fontSize={fontSize * 0.75}
              fill={THEME.inkMuted}
            >
              {unit}
            </text>
          )}
        </>
      )}
    </g>
  );
};

/**
 * Div-based callout pill (for use outside SVG context)
 * Arrow line rendered as a rotated div border
 */
interface DivCalloutProps {
  label: string;
  subLabel?: string;
  accent?: string;
  top: string;
  left?: string;
  right?: string;
  bottom?: string;
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
  const pop = interpolate(progress, [0, 0.25], [0.82, 1], {
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
        transformOrigin: left ? "left center" : "right center",
        backgroundColor: THEME.callout.bg,
        border: `3px solid ${accent}`,
        borderRadius: 14,
        padding: "10px 20px",
        boxShadow: `0 6px 0 rgba(15, 23, 42, 0.2)`,
        zIndex: 25,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        style={{
          fontFamily: THEME.font,
          fontWeight: 900,
          fontSize: 28,
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
            fontWeight: 700,
            fontSize: 18,
            color: THEME.inkLight,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {subLabel}
        </span>
      )}
    </div>
  );
};
