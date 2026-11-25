import React from "react";
import { THEME } from "../theme";
import { RhinoIllustration } from "./RhinoIllustration";

interface MusofaArchiveSceneProps {
  frame: number;
  localFrame: number;
  progress: number;
  shotId: number;
  note?: string;
}

/**
 * Scene 5: Bright Documentary Archive Card — Badak Jantan Musofa & EKG Flatline (1080x1920)
 * - Clean daylight card fitted strictly between top badge (310px) and subtitle zone (1210px)
 * - Full memorial rhino illustration centered neatly inside frame
 * - Zero fake BPM numbers — clear qualitative transition to bold red flatline
 */
export const MusofaArchiveScene: React.FC<MusofaArchiveSceneProps> = ({
  frame,
  shotId,
}) => {
  const isFlatline = shotId >= 23;
  const pulseOffset = isFlatline ? 0 : (frame * 12) % 280;

  return (
    <div
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        overflow: "hidden",
      }}
    >
      {/* Main Documentary Archive Dossier Card (Y = 330..1150) */}
      <div
        style={{
          position: "absolute",
          top: 330,
          left: 50,
          right: 50,
          backgroundColor: "#FFFDF7",
          border: "5px solid #0F172A",
          borderRadius: 28,
          boxShadow: "0 12px 0 rgba(15,23,42,0.22)",
          overflow: "hidden",
          fontFamily: THEME.font,
          zIndex: 20,
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            backgroundColor: "#0F172A",
            padding: "16px 26px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                backgroundColor: isFlatline ? "#EF4444" : "#FACC15",
              }}
            />
            <span
              style={{
                fontWeight: 900,
                fontSize: 26,
                color: "#FFFFFF",
                letterSpacing: 1,
              }}
            >
              ARSIP KASUS KONSERVASI
            </span>
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 20,
              color: "#CBD5E1",
            }}
          >
            BUKTI NYATA
          </span>
        </div>

        {/* Body Content */}
        <div style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 22 }}>
            {/* Memorial Rhino Portrait Box */}
            <div
              style={{
                width: 310,
                height: 250,
                backgroundColor: "#F1F5F9",
                border: "4px solid #0F172A",
                borderRadius: 18,
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  padding: "4px 12px",
                  borderRadius: 8,
                  fontSize: 17,
                  fontWeight: 900,
                  zIndex: 5,
                }}
              >
                MEMORIAL
              </div>

              {/* Full Rhino Centered inside Portrait Box */}
              <RhinoIllustration frame={0} scale={0.46} isMemorial={true} walkSpeed={0} />
            </div>

            {/* Large Readable Factsheet */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#64748B" }}>
                  BADAK JANTAN
                </div>
                <div style={{ fontSize: 40, fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>
                  MUSOFA
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "2px solid #CBD5E1",
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 800, color: "#64748B" }}>LOKASI PINDAH:</div>
                <div style={{ fontSize: 23, fontWeight: 900, color: "#0F172A" }}>
                  TN UJUNG KULON (LOKAL)
                </div>
              </div>

              <div
                style={{
                  backgroundColor: isFlatline ? "rgba(239,68,68,0.14)" : "rgba(245,158,11,0.14)",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: `3px solid ${isFlatline ? "#DC2626" : "#D97706"}`,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 900, color: isFlatline ? "#DC2626" : "#B45309" }}>
                  {isFlatline ? "MATI BEBERAPA HARI PASCA PINDAH" : "KONDISI MENURUN PASCA PINDAH"}
                </div>
              </div>
            </div>
          </div>

          {/* EKG Transition to Flatline (No fake BPM) */}
          <div
            style={{
              backgroundColor: "#0F172A",
              borderRadius: 18,
              border: "4px solid #0F172A",
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 21, fontWeight: 900, color: "#38BDF8" }}>
                GRAFIK DETAK JANTUNG
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: isFlatline ? "#EF4444" : "#FBBF24",
                }}
              >
                {isFlatline ? "GARIS DATAR (MATI)" : "DETAK MELEMAH"}
              </span>
            </div>

            <svg viewBox="0 0 860 96" style={{ width: "100%", height: 96, overflow: "hidden" }}>
              <g stroke="#1E293B" strokeWidth="2">
                <line x1="0" y1="24" x2="860" y2="24" />
                <line x1="0" y1="48" x2="860" y2="48" />
                <line x1="0" y1="72" x2="860" y2="72" />
                {[140, 280, 420, 560, 700].map((gx) => (
                  <line key={gx} x1={gx} y1="0" x2={gx} y2="96" />
                ))}
              </g>

              {isFlatline ? (
                <g>
                  {/* Dying pulse on far left transitioning into bold flatline */}
                  <path
                    d="M 10 48 L 80 48 L 95 36 L 110 62 L 125 28 L 140 60 L 155 48 L 845 48"
                    stroke="#EF4444"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="845" cy="48" r="9" fill="#EF4444" />
                </g>
              ) : (
                <path
                  d={`M 10 48
                     L ${300 - pulseOffset} 48
                     L ${322 - pulseOffset} 34
                     L ${338 - pulseOffset} 66
                     L ${354 - pulseOffset} 16
                     L ${370 - pulseOffset} 72
                     L ${386 - pulseOffset} 48
                     L 850 48`}
                  stroke="#FBBF24"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
            </svg>
          </div>

          {/* Clear Summary Footer */}
          <div
            style={{
              marginTop: 18,
              padding: "12px 18px",
              backgroundColor: isFlatline ? "#FEF2F2" : "#FFFBEB",
              border: `3px solid ${isFlatline ? "#DC2626" : "#D97706"}`,
              borderRadius: 14,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 900, color: isFlatline ? "#DC2626" : "#B45309" }}>
              {isFlatline ? "RISIKO FATAL TRANSLOKASI TERBUKTI" : "CATATAN KASUS TAHUN LALU"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
