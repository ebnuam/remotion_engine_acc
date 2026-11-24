import React from "react";
import { interpolate } from "remotion";
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
 * Scene 5: Case Study Archive Card — Badak Jantan Musofa & EKG Flatline
 * 2.5D Technical Cross-Section @ceritateknik style
 * Daytime bright aesthetic: clean documentary card, memorial rhino profile,
 * slowing heart rate transitioning to flatline (Shot 23).
 * Sized and positioned with strict safe-zone spacing to NEVER hit top badge or bottom subtitles.
 */
export const MusofaArchiveScene: React.FC<MusofaArchiveSceneProps> = ({
  frame,
  localFrame,
  progress,
  shotId,
  note,
}) => {
  // Shot 21: [1608, 1644), Shot 22: [1644, 1745), Shot 23: [1745, 1842)
  const isFlatline = shotId >= 23;

  // Pulse animation for EKG
  const pulseOffset = isFlatline ? 0 : (frame * 10) % 240;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Main Documentary Archive Dossier Card - Positioned strictly between top badge (13.5%) and subtitles (bottom 19%) */}
      <div
        style={{
          position: "absolute",
          top: "21.5%",
          width: 580,
          backgroundColor: "#FFFDF7",
          border: "4px solid #0F172A",
          borderRadius: 20,
          boxShadow: "0 8px 0 rgba(15,23,42,0.22)",
          overflow: "hidden",
          fontFamily: THEME.font,
          zIndex: 20,
        }}
      >
        {/* ================= Dossier Header Bar ================= */}
        <div
          style={{
            backgroundColor: "#0F172A",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: isFlatline ? "#EF4444" : "#FACC15",
              }}
            />
            <span
              style={{
                fontWeight: 900,
                fontSize: 12,
                color: "#FFFFFF",
                letterSpacing: 1.1,
                textTransform: "uppercase",
              }}
            >
              ARSIP STUDI KASUS KONSERVASI
            </span>
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 10,
              color: "#94A3B8",
              letterSpacing: 0.8,
            }}
          >
            DOKUMEN RESMI
          </span>
        </div>

        {/* ================= Card Body Content ================= */}
        <div style={{ padding: "14px 18px" }}>
          {/* Top Section: Photo/Illustration Frame + Metadata */}
          <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
            {/* Rhino Memorial Portrait Box */}
            <div
              style={{
                width: 180,
                height: 125,
                backgroundColor: "#F1F5F9",
                border: "2.5px solid #0F172A",
                borderRadius: 12,
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Memorial ribbon tag */}
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  padding: "1.5px 5px",
                  borderRadius: 4,
                  fontSize: 8,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  zIndex: 5,
                }}
              >
                MEMORIAL
              </div>

              {/* Rhino Vector Illustration in Memorial Slate - Centered cleanly */}
              <div style={{ transform: "scale(0.36) translate(20px, 10px)" }}>
                <RhinoIllustration frame={0} scale={1} isMemorial={true} walkSpeed={0} />
              </div>
            </div>

            {/* Case File Details */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                  IDENTITAS SATWA
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", letterSpacing: 0.4 }}>
                  BADAK MUSOFA
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569" }}>
                  Badak Jawa Jantan (Rhinoceros sondaicus)
                </div>
              </div>

              {/* Location & Translocation info */}
              <div style={{ backgroundColor: "#F8FAFC", padding: "5px 8px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: "#64748B" }}>RIWAYAT KEJADIAN:</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#0F172A" }}>
                  Pemindahan di Kawasan TN Ujung Kulon
                </div>
              </div>

              {/* Status Outcome */}
              <div
                style={{
                  backgroundColor: isFlatline ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: `1.5px solid ${isSevereStressOrFlatline(isFlatline)}`,
                }}
              >
                <div style={{ fontSize: 8, fontWeight: 800, color: isFlatline ? "#DC2626" : "#D97706" }}>
                  STATUS AKHIR:
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: isFlatline ? "#DC2626" : "#D97706" }}>
                  {isFlatline ? "MATI BEBERAPA HARI PASCA PINDAH" : "GEJALA STRES & PENURUNAN KONDISI"}
                </div>
              </div>
            </div>
          </div>

          {/* ================= EKG Monitor Strip ================= */}
          <div
            style={{
              backgroundColor: "#0F172A",
              borderRadius: 12,
              border: "2px solid #0F172A",
              padding: "8px 12px",
            }}
          >
            {/* EKG Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#38BDF8", letterSpacing: 0.5 }}>
                REKAM MEDIS KARDIOVASKULAR
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: isFlatline ? "#EF4444" : "#FBBF24",
                  letterSpacing: 0.4,
                }}
              >
                {isFlatline ? "0 BPM — FLATLINE" : "32 BPM — BRADIKARDIA"}
              </span>
            </div>

            {/* EKG Graph SVG */}
            <svg viewBox="0 0 520 45" style={{ width: "100%", height: 38, overflow: "hidden" }}>
              {/* Grid */}
              <g stroke="#1E293B" strokeWidth="1">
                <line x1="0" y1="11" x2="520" y2="11" />
                <line x1="0" y1="22" x2="520" y2="22" />
                <line x1="0" y1="33" x2="520" y2="33" />
                {[50, 100, 150, 200, 250, 300, 350, 400, 450, 500].map((gx) => (
                  <line key={gx} x1={gx} y1="0" x2={gx} y2="45" />
                ))}
              </g>

              {/* Waveform */}
              {isFlatline ? (
                // Solid red flatline
                <line
                  x1="10"
                  y1="22"
                  x2="510"
                  y2="22"
                  stroke="#EF4444"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ) : (
                // Weak, slowing pulse line
                <g stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path
                    d={`M 10 22 
                       L ${160 - pulseOffset} 22 
                       L ${175 - pulseOffset} 15 
                       L ${185 - pulseOffset} 30 
                       L ${195 - pulseOffset} 6 
                       L ${205 - pulseOffset} 34 
                       L ${215 - pulseOffset} 22 
                       L 510 22`}
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Warning summary footer */}
          <div
            style={{
              marginTop: 10,
              padding: "6px 10px",
              backgroundColor: isFlatline ? "#FEF2F2" : "#FFFBEB",
              border: `1.5px solid ${isFlatline ? "#FCA5A5" : "#FDE68A"}`,
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 900, color: isFlatline ? "#DC2626" : "#B45309" }}>
              {isFlatline ? "BUKTI LAPANGAN: RISIKO FATAL TERBUKTI NYATA" : "EVALUASI RISIKO TRANSLOKASI"}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#64748B",
              }}
            >
              DATA KONSERVASI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function isSevereStressOrFlatline(flatline: boolean): string {
  return flatline ? "#DC2626" : "#F59E0B";
}
