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
  { label: "JARAK TEMPUH", pindah: "~1.000 KM", perkuat: "< 15 KM" },
  { label: "RISIKO FATAL", pindah: "TINGGI", perkuat: "MINIMAL" },
  { label: "EFISIENSI", pindah: "RENDAH", perkuat: "OPTIMAL" },
];

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  frame,
  visible = true,
  highlight = "none",
}) => {
  const { fps } = useVideoConfig();

  const entrySpring = spring({
    frame: visible ? frame : 0,
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
        top: "15%",
        right: "4%",
        opacity,
        transform: `translateX(${translateX}px)`,
        width: 240,
        backgroundColor: THEME.scoreboard.bg,
        border: `3px solid ${THEME.scoreboard.border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 0 rgba(15,23,42,0.22)",
        zIndex: 30,
        fontFamily: THEME.font,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: THEME.scoreboard.headerBg,
          padding: "8px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontWeight: 900,
            fontSize: 13,
            color: THEME.scoreboard.headerText,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          OPSI
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: 11,
              color: THEME.scoreboard.pindahAccent,
              background: "rgba(239,68,68,0.15)",
              padding: "2px 7px",
              borderRadius: 6,
              letterSpacing: 0.5,
            }}
          >
            PINDAH
          </span>
          <span
            style={{
              fontWeight: 900,
              fontSize: 11,
              color: THEME.scoreboard.perkuatAccent,
              background: "rgba(22,163,74,0.15)",
              padding: "2px 7px",
              borderRadius: 6,
              letterSpacing: 0.5,
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
              padding: "7px 10px",
              borderTop: `1px solid #E2E8F0`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: THEME.inkMuted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 4,
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: THEME.scoreboard.pindahAccent,
                  background:
                    isHighPindah
                      ? "rgba(239,68,68,0.15)"
                      : "transparent",
                  padding: "2px 5px",
                  borderRadius: 5,
                  letterSpacing: 0.3,
                  flex: 1,
                  textAlign: "center",
                }}
              >
                {row.pindah}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: THEME.scoreboard.perkuatAccent,
                  background:
                    isHighPerkuat
                      ? "rgba(22,163,74,0.15)"
                      : "transparent",
                  padding: "2px 5px",
                  borderRadius: 5,
                  letterSpacing: 0.3,
                  flex: 1,
                  textAlign: "center",
                }}
              >
                {row.perkuat}
              </span>
            </div>
          </div>
        );
      })}

      {/* Footer CTA */}
      <div
        style={{
          backgroundColor: "#F1F5F9",
          padding: "6px 10px",
          borderTop: "1px solid #E2E8F0",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: THEME.inkMuted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          TULIS DI KOMENTAR
        </span>
      </div>
    </div>
  );
};
