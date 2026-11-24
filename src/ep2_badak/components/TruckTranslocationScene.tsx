import React from "react";
import { interpolate } from "remotion";
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
 * Scene 4: Translocation Transport Truck & Accelerated EKG (STRES BERAT)
 * 2.5D Technical Cross-Section @ceritateknik style
 * Features:
 * - Full side view of heavy translocation transport truck
 * - Rotating wheels + suspension vibration/bouncing
 * - Cargo crate with ventilation slits revealing rhino form
 * - Vibration shockwaves radiating from crate
 * - Top EKG monitor panel showing accelerating heart rate (115 BPM -> 185+ BPM)
 * - Asphalt road with moving lane markings
 */
export const TruckTranslocationScene: React.FC<TruckTranslocationSceneProps> = ({
  frame,
  localFrame,
  progress,
  shotId,
  note,
}) => {
  // Road motion (moving lane dashes)
  const roadOffset = (frame * 18) % 120;
  // Suspension bounce
  const bounceY = Math.sin(frame * 0.9) * 3.5;
  // Wheel rotation angle in degrees
  const wheelAngle = (frame * 24) % 360;

  // EKG state: Shot 16-17 (GELISAH, 115 BPM), Shot 18-20 (STRES BERAT, 185+ BPM)
  const isSevereStress = shotId >= 18;
  const ekgSpeed = isSevereStress ? 22 : 12;
  const ekgOffset = (frame * ekgSpeed) % 400;

  // Vibration wave rings
  const vibScale = 1 + (Math.sin(frame * 0.4) * 0.5 + 0.5) * 0.4;
  const vibOpacity = 0.9 - (Math.sin(frame * 0.4) * 0.5 + 0.5) * 0.6;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* ================= 1. EKG MONITOR CARD (TOP RIGHT - BELOW TOP BADGE) ================= */}
      <div
        style={{
          position: "absolute",
          top: "21.5%",
          right: "4%",
          width: 330,
          backgroundColor: "#FFFDF7",
          border: "3px solid #0F172A",
          borderRadius: 16,
          boxShadow: "0 6px 0 rgba(15,23,42,0.22)",
          overflow: "hidden",
          zIndex: 30,
          fontFamily: THEME.font,
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: isSevereStress ? "#DC2626" : "#0F172A",
            padding: "6px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontWeight: 900,
              fontSize: 11,
              color: "#FFFFFF",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            MONITOR FISIOLOGIS
          </span>
          <span
            style={{
              fontWeight: 900,
              fontSize: 10,
              color: "#FFFFFF",
              backgroundColor: "rgba(0,0,0,0.25)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            EKG REAL-TIME
          </span>
        </div>

        {/* EKG Screen */}
        <div style={{ backgroundColor: "#0F172A", padding: "8px 10px", position: "relative" }}>
          {/* Heart Rate Readout */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8" }}>DETAK JANTUNG:</span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 900,
                color: isSevereStress ? "#EF4444" : "#FACC15",
                letterSpacing: 0.5,
              }}
            >
              {isSevereStress ? "185+ BPM (STRES BERAT)" : "115 BPM (GELISAH)"}
            </span>
          </div>

          {/* EKG Waveform SVG */}
          <svg viewBox="0 0 300 60" style={{ width: "100%", height: 50, overflow: "hidden" }}>
            {/* Grid */}
            <g stroke="#1E293B" strokeWidth="1">
              <line x1="0" y1="15" x2="300" y2="15" />
              <line x1="0" y1="30" x2="300" y2="30" />
              <line x1="0" y1="45" x2="300" y2="45" />
              <line x1="60" y1="0" x2="60" y2="60" />
              <line x1="120" y1="0" x2="120" y2="60" />
              <line x1="180" y1="0" x2="180" y2="60" />
              <line x1="240" y1="0" x2="240" y2="60" />
            </g>

            {/* Pulsing EKG trace */}
            <g
              stroke={isSevereStress ? "#EF4444" : "#FACC15"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              {isSevereStress ? (
                // Rapid jagged spikes (severe stress tachycardia)
                <path
                  d={`M 0 30 
                     L ${40 - (ekgOffset % 60)} 30 
                     L ${45 - (ekgOffset % 60)} 20 
                     L ${50 - (ekgOffset % 60)} 45 
                     L ${55 - (ekgOffset % 60)} 5 
                     L ${60 - (ekgOffset % 60)} 50 
                     L ${65 - (ekgOffset % 60)} 25 
                     L ${70 - (ekgOffset % 60)} 30 
                     L ${100 - (ekgOffset % 60)} 30 
                     L ${105 - (ekgOffset % 60)} 15 
                     L ${110 - (ekgOffset % 60)} 52 
                     L ${115 - (ekgOffset % 60)} 4 
                     L ${120 - (ekgOffset % 60)} 54 
                     L ${125 - (ekgOffset % 60)} 22 
                     L ${130 - (ekgOffset % 60)} 30 
                     L 300 30`}
                />
              ) : (
                // Moderate stress pulse
                <path
                  d={`M 0 30 
                     L ${60 - (ekgOffset % 100)} 30 
                     L ${70 - (ekgOffset % 100)} 22 
                     L ${75 - (ekgOffset % 100)} 42 
                     L ${80 - (ekgOffset % 100)} 10 
                     L ${85 - (ekgOffset % 100)} 45 
                     L ${90 - (ekgOffset % 100)} 30 
                     L 300 30`}
                />
              )}
            </g>
          </svg>
        </div>

        {/* Status footer banner */}
        <div
          style={{
            backgroundColor: "#F1F5F9",
            padding: "4px 10px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, color: "#64748B" }}>STATUS SATWA:</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: isSevereStress ? "#DC2626" : "#D97706",
              textTransform: "uppercase",
            }}
          >
            {isSevereStress ? "RISIKO FATAL TINGGI" : "RESPON GUNCANGAN"}
          </span>
        </div>
      </div>

      {/* ================= 2. MAIN VEHICLE & ROAD SVG STAGE ================= */}
      <svg
        viewBox="0 0 1080 820"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        {/* ================= Road Cross-Section ================= */}
        {/* Deep Soil under road */}
        <rect x="0" y="580" width="1080" height="240" fill="#451A03" />
        {/* Subbase Gravel */}
        <rect x="0" y="510" width="1080" height="70" fill="#64748B" stroke="#0F172A" strokeWidth="2" />
        {/* Asphalt Road Surface */}
        <rect x="0" y="450" width="1080" height="60" fill="#334155" stroke="#0F172A" strokeWidth="3" />
        {/* Moving Yellow-White Road Center Dashes */}
        {[-100, 20, 140, 260, 380, 500, 620, 740, 860, 980, 1100].map((dx, idx) => (
          <rect
            key={idx}
            x={dx - roadOffset}
            y="476"
            width="70"
            height="8"
            rx="3"
            fill="#FBBF24"
          />
        ))}

        {/* Road Depth Label */}
        <g transform="translate(60, 530)">
          <text fontFamily={THEME.font} fontWeight="800" fontSize="13" fill="#E2E8F0">
            JALUR DARAT / KONDISI BERGELOMBANG
          </text>
        </g>

        {/* ================= 3. TRANSLOCATION TRANSPORT TRUCK ================= */}
        <g transform={`translate(240, ${270 + bounceY})`}>
          {/* Ground Contact Shadow */}
          <ellipse cx="270" cy="185" rx="310" ry="16" fill="rgba(15,23,42,0.25)" />

          {/* Vibration Arcs radiating from crate */}
          <g stroke="#F97316" strokeWidth="3.5" fill="none" opacity={vibOpacity}>
            <path d={`M 140 40 Q 110 90 140 140`} transform={`scale(${vibScale}) translate(-10, -5)`} />
            <path d={`M 120 20 Q 80 90 120 160`} transform={`scale(${vibScale}) translate(-15, -10)`} />
            <path d={`M 400 40 Q 430 90 400 140`} transform={`scale(${vibScale}) translate(10, -5)`} />
          </g>

          {/* Truck Heavy Chassis / Frame */}
          <rect x="50" y="145" width="480" height="18" rx="4" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />

          {/* ================= Crate (Container) on Flatbed ================= */}
          {/* Main Steel Crate Body */}
          <rect
            x="60"
            y="20"
            width="320"
            height="125"
            rx="8"
            fill="#F8FAFC"
            stroke="#0F172A"
            strokeWidth="5"
          />

          {/* Vertical Reinforced Steel Ribs */}
          <line x1="120" y1="20" x2="120" y2="145" stroke="#0F172A" strokeWidth="3.5" />
          <line x1="180" y1="20" x2="180" y2="145" stroke="#0F172A" strokeWidth="3.5" />
          <line x1="240" y1="20" x2="240" y2="145" stroke="#0F172A" strokeWidth="3.5" />
          <line x1="300" y1="20" x2="300" y2="145" stroke="#0F172A" strokeWidth="3.5" />

          {/* Yellow-Black Hazard Safety Stripe */}
          <g stroke="#0F172A" strokeWidth="2.5">
            <rect x="60" y="55" width="320" height="24" fill="#FBBF24" />
            {[80, 110, 140, 170, 200, 230, 260, 290, 320, 350].map((sx, idx) => (
              <line key={idx} x1={sx} y1="55" x2={sx + 15} y2="79" strokeWidth="6" />
            ))}
          </g>

          {/* Rhino Form inside Ventilation Window */}
          <g transform="translate(140, 85)">
            <rect x="0" y="0" width="160" height="48" rx="6" fill="#334155" stroke="#0F172A" strokeWidth="3" />
            {/* Ventilation Slits */}
            <line x1="40" y1="5" x2="40" y2="43" stroke="#0F172A" strokeWidth="3" />
            <line x1="80" y1="5" x2="80" y2="43" stroke="#0F172A" strokeWidth="3" />
            <line x1="120" y1="5" x2="120" y2="43" stroke="#0F172A" strokeWidth="3" />
            {/* Rhino Silhouette Head & Horn inside */}
            <path
              d="M 50 38 Q 65 20 85 22 L 95 35 Q 110 38 120 32 L 125 18 L 132 30 Q 140 38 135 44 Z"
              fill="#64748B"
              stroke="#0F172A"
              strokeWidth="2"
            />
            <polygon points="125,18 132,30 120,28" fill="#FBBF24" />
          </g>

          {/* Crate Stencil Badge */}
          <rect x="80" y="26" width="280" height="22" rx="5" fill="#FFFDF7" stroke="#0F172A" strokeWidth="2" />
          <text
            x="220"
            y="41"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="900"
            fontSize="10"
            fill="#DC2626"
            letterSpacing="0.8"
          >
            KANDANG TRANSLOKASI SATWA LIAR
          </text>

          {/* Red Warning Beacon Light on Crate */}
          <circle cx="220" cy="12" r="8" fill="#EF4444" stroke="#0F172A" strokeWidth="3" />
          <circle cx="218" cy="10" r="3" fill="#FFFFFF" />

          {/* ================= Driver Cabin (Cab Front) ================= */}
          <g transform="translate(380, 45)">
            {/* Cabin Body */}
            <path
              d="M 0 100 L 0 35 L 75 35 L 120 70 L 130 100 Z"
              fill="#F8FAFC"
              stroke="#0F172A"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Windshield Glass */}
            <polygon points="35,42 70,42 108,72 35,72" fill="#BAE6FD" stroke="#0F172A" strokeWidth="3" />
            {/* Door Handle */}
            <rect x="15" y="80" width="14" height="4" rx="2" fill="#0F172A" />
            {/* Heavy Front Bumper */}
            <rect x="110" y="90" width="28" height="18" rx="4" fill="#334155" stroke="#0F172A" strokeWidth="3" />
            {/* Headlight */}
            <circle cx="128" cy="80" r="8" fill="#FEF08A" stroke="#0F172A" strokeWidth="3" />
          </g>

          {/* ================= Wheels & Suspension ================= */}
          {/* Wheel 1: Front Axle (Cab) */}
          <g transform={`translate(470, 160)`}>
            <circle cx="0" cy="0" r="28" fill="#1E293B" stroke="#0F172A" strokeWidth="4.5" />
            <circle cx="0" cy="0" r="14" fill="#94A3B8" stroke="#0F172A" strokeWidth="3" />
            <g transform={`rotate(${wheelAngle})`}>
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#0F172A" strokeWidth="3" />
              <line x1="0" y1="-12" x2="0" y2="12" stroke="#0F172A" strokeWidth="3" />
            </g>
          </g>

          {/* Wheel 2: Rear Axle 1 (Flatbed) */}
          <g transform={`translate(150, 160)`}>
            <circle cx="0" cy="0" r="28" fill="#1E293B" stroke="#0F172A" strokeWidth="4.5" />
            <circle cx="0" cy="0" r="14" fill="#94A3B8" stroke="#0F172A" strokeWidth="3" />
            <g transform={`rotate(${wheelAngle})`}>
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#0F172A" strokeWidth="3" />
              <line x1="0" y1="-12" x2="0" y2="12" stroke="#0F172A" strokeWidth="3" />
            </g>
          </g>

          {/* Wheel 3: Rear Axle 2 (Flatbed dual) */}
          <g transform={`translate(215, 160)`}>
            <circle cx="0" cy="0" r="28" fill="#1E293B" stroke="#0F172A" strokeWidth="4.5" />
            <circle cx="0" cy="0" r="14" fill="#94A3B8" stroke="#0F172A" strokeWidth="3" />
            <g transform={`rotate(${wheelAngle})`}>
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#0F172A" strokeWidth="3" />
              <line x1="0" y1="-12" x2="0" y2="12" stroke="#0F172A" strokeWidth="3" />
            </g>
          </g>
        </g>

        {/* ================= 4. TECHNICAL CALLOUTS ================= */}
        {/* Callout: Guncangan & Getaran */}
        <TechnicalCallout
          x1={360}
          y1={320}
          x2={210}
          y2={230}
          label="GUNCANGAN LOGISTIK"
          unit="GETARAN KENDARAAN"
          color="#EA580C"
          progress={1}
          attachSide="right"
          boxWidth={195}
          boxHeight={48}
          fontSize={13}
        />

        {/* Callout: Satwa Sensitif Stres */}
        <TechnicalCallout
          x1={450}
          y1={370}
          x2={570}
          y2={440}
          label="SATWA SUPER PEMALU"
          unit="RENTAN STRES FATAL"
          color="#DC2626"
          progress={1}
          attachSide="left"
          boxWidth={200}
          boxHeight={48}
          fontSize={13}
        />
      </svg>
    </div>
  );
};
