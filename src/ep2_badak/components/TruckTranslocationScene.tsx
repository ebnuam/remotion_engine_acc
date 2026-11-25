import React from "react";
import { THEME } from "../theme";
import { TechnicalCallout } from "./Callout";

interface TruckTranslocationSceneProps {
  frame: number;
  localFrame: number;
  progress: number;
  shotId: number;
  note?: string;
}

/**
 * Scene 4: Translocation Transport Truck & Stress EKG (1080x1920 native stage)
 * - Full side-view truck on asphalt road (rotating wheels, suspension bounce)
 * - Thick vibration arcs + clear callout
 * - Large top EKG monitor with qualitative readout ONLY (zero fake BPM numbers!)
 */
export const TruckTranslocationScene: React.FC<TruckTranslocationSceneProps> = ({
  frame,
  shotId,
}) => {
  const roadOffset = (frame * 22) % 140;
  const bounceY = Math.sin(frame * 0.9) * 5;
  const wheelAngle = (frame * 24) % 360;

  // Shot 16-17: GELISAH, Shot 18-20: STRES BERAT
  const isSevereStress = shotId >= 18;
  const ekgSpeed = isSevereStress ? 24 : 13;
  const ekgOffset = (frame * ekgSpeed) % 300;

  const vibPhase = (Math.sin(frame * 0.45) + 1) * 0.5;
  const vibOpacity = 0.95 - vibPhase * 0.45;

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      {/* ================= 1. LARGE EKG MONITOR CARD (TOP CENTER BELOW BADGE) ================= */}
      <div
        style={{
          position: "absolute",
          top: 325,
          left: 60,
          right: 60,
          backgroundColor: "#FFFDF7",
          border: "4.5px solid #0F172A",
          borderRadius: 22,
          boxShadow: "0 10px 0 rgba(15,23,42,0.22)",
          overflow: "hidden",
          zIndex: 30,
          fontFamily: THEME.font,
        }}
      >
        <div
          style={{
            backgroundColor: isSevereStress ? "#DC2626" : "#0F172A",
            padding: "12px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 900, fontSize: 24, color: "#FFFFFF", letterSpacing: 1 }}>
            MONITOR STRES SATWA
          </span>
          <span
            style={{
              fontWeight: 900,
              fontSize: 22,
              color: isSevereStress ? "#FEF08A" : "#FACC15",
            }}
          >
            {isSevereStress ? "STRES BERAT" : "DETAK MENINGKAT"}
          </span>
        </div>

        <div style={{ backgroundColor: "#0F172A", padding: "14px 20px" }}>
          <svg viewBox="0 0 900 120" style={{ width: "100%", height: 120, overflow: "hidden" }}>
            {/* Grid */}
            <g stroke="#1E293B" strokeWidth="2">
              <line x1="0" y1="30" x2="900" y2="30" />
              <line x1="0" y1="60" x2="900" y2="60" />
              <line x1="0" y1="90" x2="900" y2="90" />
              {[150, 300, 450, 600, 750].map((gx) => (
                <line key={gx} x1={gx} y1="0" x2={gx} y2="120" />
              ))}
            </g>

            {/* Thick clear EKG waveform */}
            <g
              stroke={isSevereStress ? "#EF4444" : "#FACC15"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              {isSevereStress ? (
                <path
                  d={`M 0 60
                     L ${120 - (ekgOffset % 140)} 60
                     L ${135 - (ekgOffset % 140)} 36
                     L ${148 - (ekgOffset % 140)} 96
                     L ${162 - (ekgOffset % 140)} 10
                     L ${176 - (ekgOffset % 140)} 108
                     L ${190 - (ekgOffset % 140)} 46
                     L ${204 - (ekgOffset % 140)} 60
                     L ${330 - (ekgOffset % 140)} 60
                     L ${345 - (ekgOffset % 140)} 30
                     L ${358 - (ekgOffset % 140)} 100
                     L ${372 - (ekgOffset % 140)} 8
                     L ${386 - (ekgOffset % 140)} 110
                     L ${400 - (ekgOffset % 140)} 48
                     L ${415 - (ekgOffset % 140)} 60
                     L ${550 - (ekgOffset % 140)} 60
                     L ${565 - (ekgOffset % 140)} 36
                     L ${578 - (ekgOffset % 140)} 96
                     L ${592 - (ekgOffset % 140)} 10
                     L ${606 - (ekgOffset % 140)} 108
                     L ${620 - (ekgOffset % 140)} 46
                     L ${635 - (ekgOffset % 140)} 60
                     L 900 60`}
                />
              ) : (
                <path
                  d={`M 0 60
                     L ${210 - (ekgOffset % 220)} 60
                     L ${228 - (ekgOffset % 220)} 42
                     L ${244 - (ekgOffset % 220)} 84
                     L ${260 - (ekgOffset % 220)} 22
                     L ${276 - (ekgOffset % 220)} 90
                     L ${292 - (ekgOffset % 220)} 60
                     L ${560 - (ekgOffset % 220)} 60
                     L ${578 - (ekgOffset % 220)} 42
                     L ${594 - (ekgOffset % 220)} 84
                     L ${610 - (ekgOffset % 220)} 22
                     L ${626 - (ekgOffset % 220)} 90
                     L ${642 - (ekgOffset % 220)} 60
                     L 900 60`}
                />
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* ================= 2. FULL SIDE-VIEW TRUCK & ROAD CROSS-SECTION ================= */}
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
      >
        {/* Asphalt Road & Subsurface Cross-Section (Y=1020..1920) */}
        <rect x="0" y="1200" width="1080" height="720" fill="#451A03" />
        <rect x="0" y="1115" width="1080" height="85" fill="#64748B" stroke="#0F172A" strokeWidth="3" />
        <rect x="0" y="1025" width="1080" height="90" fill="#334155" stroke="#0F172A" strokeWidth="4" />

        {/* Moving Dashed Road Center Lines */}
        {[-120, 20, 160, 300, 440, 580, 720, 860, 1000, 1140].map((dx, idx) => (
          <rect
            key={idx}
            x={dx - roadOffset}
            y="1064"
            width="84"
            height="12"
            rx="4"
            fill="#FBBF24"
          />
        ))}

        {/* Large Scaled Full Side-View Truck */}
        <g transform={`translate(115, ${715 + bounceY}) scale(1.52)`}>
          {/* Shadow */}
          <ellipse cx="290" cy="204" rx="285" ry="14" fill="rgba(15,23,42,0.28)" />

          {/* Thick Vibration Shockwaves around Crate */}
          <g stroke="#EA580C" strokeWidth="6" fill="none" opacity={vibOpacity} strokeLinecap="round">
            <path d="M 38 42 Q 12 90 38 138" />
            <path d="M 20 26 Q -12 90 20 154" />
            <path d="M 386 42 Q 412 90 386 138" />
          </g>

          {/* Chassis */}
          <rect x="52" y="155" width="470" height="18" rx="4" fill="#1E293B" stroke="#0F172A" strokeWidth="3.5" />

          {/* Steel Crate Container */}
          <rect
            x="60"
            y="24"
            width="318"
            height="132"
            rx="10"
            fill="#F8FAFC"
            stroke="#0F172A"
            strokeWidth="4.5"
          />
          <line x1="124" y1="24" x2="124" y2="156" stroke="#0F172A" strokeWidth="3" />
          <line x1="252" y1="24" x2="252" y2="156" stroke="#0F172A" strokeWidth="3" />
          <line x1="316" y1="24" x2="316" y2="156" stroke="#0F172A" strokeWidth="3" />

          {/* Hazard Stripe */}
          <g stroke="#0F172A" strokeWidth="2">
            <rect x="60" y="60" width="318" height="22" fill="#FBBF24" />
            {[75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((sx, idx) => (
              <line key={idx} x1={sx} y1="60" x2={sx + 14} y2="82" strokeWidth="5" />
            ))}
          </g>

          {/* Stencil */}
          <rect x="82" y="30" width="274" height="24" rx="5" fill="#FFFDF7" stroke="#0F172A" strokeWidth="2" />
          <text
            x="219"
            y="47"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="900"
            fontSize="13"
            fill="#DC2626"
          >
            TRANSLOKASI SATWA LIAR
          </text>

          {/* Ventilation Window with Rhino Form */}
          <rect x="136" y="92" width="166" height="50" rx="6" fill="#334155" stroke="#0F172A" strokeWidth="3" />
          <path
            d="M 185 132 Q 204 112 226 114 L 238 128 Q 254 132 266 124 L 272 108 L 280 124 Q 288 134 282 140 Z"
            fill="#94A3B8"
            stroke="#0F172A"
            strokeWidth="2"
          />
          <polygon points="272,108 280,124 266,122" fill="#FBBF24" />

          {/* Warning Light */}
          <circle cx="219" cy="14" r="9" fill="#EF4444" stroke="#0F172A" strokeWidth="3" />

          {/* Cab Front */}
          <g transform="translate(382, 50)">
            <path
              d="M 0 105 L 0 36 L 76 36 L 122 72 L 132 105 Z"
              fill="#F8FAFC"
              stroke="#0F172A"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <polygon points="34,44 72,44 108,74 34,74" fill="#BAE6FD" stroke="#0F172A" strokeWidth="3" />
            <rect x="110" y="94" width="26" height="16" rx="4" fill="#334155" stroke="#0F172A" strokeWidth="3" />
            <circle cx="128" cy="84" r="8" fill="#FEF08A" stroke="#0F172A" strokeWidth="2.5" />
          </g>

          {/* Wheels */}
          {[148, 218, 470].map((wx, idx) => (
            <g key={idx} transform={`translate(${wx}, 172)`}>
              <circle cx="0" cy="0" r="30" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
              <circle cx="0" cy="0" r="14" fill="#94A3B8" stroke="#0F172A" strokeWidth="3" />
              <g transform={`rotate(${wheelAngle})`}>
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#0F172A" strokeWidth="3.5" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#0F172A" strokeWidth="3.5" />
              </g>
            </g>
          ))}
        </g>

        {/* Clean Mobile-Readable Callouts with Safe Margins */}
        <TechnicalCallout
          x1={230}
          y1={790}
          x2={54}
          y2={635}
          label="GUNCANGAN JALAN"
          unit="MEMICU STRES"
          color="#EA580C"
          progress={1}
          attachSide="left"
          boxWidth={290}
          boxHeight={74}
          fontSize={24}
        />

        <TechnicalCallout
          x1={520}
          y1={890}
          x2={1032}
          y2={635}
          label="SATWA SUPER PEMALU"
          unit="TARUHAN NYAWA"
          color="#DC2626"
          progress={1}
          attachSide="right"
          boxWidth={350}
          boxHeight={74}
          fontSize={24}
        />
      </svg>
    </div>
  );
};
