import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../theme";

interface ScoreBoardProps {
  frame: number;
  visible?: boolean;
  /** Which option is currently highlighted: "pindah" | "perkuat" | "none" */
  highlight?: "pindah" | "perkuat" | "none";
}

const INDICATORS = [
  { label: "JARAK", pindah: "~1.000 KM", perkuat: "< 15 KM" },
  { label: "RISIKO", pindah: "TINGGI", perkuat: "MINIMAL" },
  { label: "FOKUS", pindah: "PINDAH", perkuat: "PERKUAT" },
];

/**
 * Compact, mobile-readable ScoreBoard designed natively for 1080x1920 virtual canvas.
 * Placed cleanly in top-right safe area (top: 325px, right: 36px) well below the top badge.
 */
export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  frame,
  visible = true,
  highlight = "none",
}) => {
  const { fps } = useVideoConfig();

  if (!visible) return null;

  const entrySpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 180 },
    from: 0,
    to: 1,
  });

  const opacity = interpolate(entrySpring, [0, 1], [0, 1]);
  const translateX = interpolate(entrySpring, [0, 1], [80, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 325,
        right: 36,
        opacity,
        transform: `translateX(${translateX}px)`,
        width: 370,
        backgroundColor: THEME.scoreboard.bg,
        border: `4px solid ${THEME.scoreboard.border}`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 10px 0 rgba(15,23,42,0.22)",
        zIndex: 35,
        fontFamily: THEME.font,
        pointerEvents: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: THEME.scoreboard.headerBg,
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontWeight: 900,
            fontSize: 19,
            color: THEME.scoreboard.headerText,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          OPSI
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: 17,
              color: "#FCA5A5",
              background: "rgba(239,68,68,0.24)",
              padding: "3px 9px",
              borderRadius: 8,
              letterSpacing: 0.4,
            }}
          >
            PINDAH
          </span>
          <span
            style={{
              fontWeight: 900,
              fontSize: 17,
              color: "#86EFAC",
              background: "rgba(22,163,74,0.28)",
              padding: "3px 9px",
              borderRadius: 8,
              letterSpacing: 0.4,
            }}
          >
            PERKUAT
          </span>
        </div>
      </div>

      {/* Rows */}
      {INDICATORS.map((row, i) => {
        const rowBg = i % 2 === 1 ? THEME.scoreboard.rowAlt : THEME.scoreboard.bg;
        const isHighPindah = highlight === "pindah";
        const isHighPerkuat = highlight === "perkuat";

        return (
          <div
            key={row.label}
            style={{
              backgroundColor: rowBg,
              padding: "8px 14px",
              borderTop: "2px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: THEME.inkLight,
                textTransform: "uppercase",
                width: 82,
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: 19,
                fontWeight: 900,
                color: THEME.scoreboard.pindahAccent,
                background: isHighPindah ? "rgba(239,68,68,0.16)" : "transparent",
                padding: "3px 6px",
                borderRadius: 6,
                flex: 1,
                textAlign: "center",
              }}
            >
              {row.pindah}
            </span>
            <span
              style={{
                fontSize: 19,
                fontWeight: 900,
                color: THEME.scoreboard.perkuatAccent,
                background: isHighPerkuat ? "rgba(22,163,74,0.18)" : "transparent",
                padding: "3px 6px",
                borderRadius: 6,
                flex: 1,
                textAlign: "center",
              }}
            >
              {row.perkuat}
            </span>
          </div>
        );
      })}
    </div>
  );
};
