import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { OrganicRhino, RhinoHeadCloseup } from "./OrganicRhino";
import { CalloutLeader } from "./CalloutLeader";
import { SoilCrossSection } from "./SoilCrossSection";

interface Scene4TruckProps {
  frame: number;
  localFrame: number;
  progress: number;
  shotId: number;
}

/**
 * Scene 4: Translocation Risks [1200, 1608) — 5 Distinct Framings!
 * - Shot 16: Split Contrast: Domestic Livestock vs Shy Wild Javan Rhino
 * - Shot 17: Wide Roadside Truck Tracking Shot
 * - Shot 18: Low-Angle Macro Wheel & Suspension Jolt
 * - Shot 19: Inside-Crate Cutaway Close-Up (nervous rhino inside rattling box)
 * - Shot 20: Heart Pulse & Spiking Red ECG Cross-Section (ZERO fake BPM numbers!)
 */
export const Scene4Truck: React.FC<Scene4TruckProps> = ({
  frame,
  progress,
  shotId,
}) => {
  const scrollX = (frame * 11) % 1400;
  const wheelAngle = -(frame * 22) % 360;
  const bumpCycle = Math.sin(frame * 0.42);
  const bumpHigh = Math.max(0, Math.sin(frame * 0.23)) * 12;
  const chassisBounceY = bumpCycle * 5 - bumpHigh;
  const chassisTilt = Math.cos(frame * 0.35) * 2.2;

  // =========================================================================
  // SHOT 16 [1200, 1295): SPLIT CONTRAST — DOMESTIC LIVESTOCK VS WILD RHINO
  // =========================================================================
  if (shotId === 16) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Left Side: Calm Livestock on Farm Ramp */}
          <rect x="35" y="340" width="490" height="630" rx="26" fill="#FEF3C7" stroke={THEME.ink} strokeWidth="5" />
          <text x="280" y="395" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="28" fill="#B45309">
            HEWAN TERNAK
          </text>
          {/* Wooden Ramp + Calm Cow Silhouette */}
          <polygon points="85,840 465,710 465,840" fill="#D97706" stroke={THEME.ink} strokeWidth="4" />
          <g transform={`translate(${245 + progress * 40}, 695) rotate(-18)`}>
            <rect x="-55" y="-42" width="110" height="62" rx="18" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="4" />
            <circle cx="60" cy="-34" r="22" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="4" />
            <line x1="-35" y1="20" x2="-35" y2="52" stroke={THEME.ink} strokeWidth="9" strokeLinecap="round" />
            <line x1="35" y1="20" x2="35" y2="52" stroke={THEME.ink} strokeWidth="9" strokeLinecap="round" />
          </g>
          <text x="280" y="925" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="24" fill="#15803D">
            JINAK & MUDAH DIANGKUT
          </text>

          {/* Right Side: Wild Javan Rhino in Dense Forest */}
          <rect x="555" y="340" width="490" height="630" rx="26" fill="#DCFCE7" stroke={THEME.accent.danger} strokeWidth="5" />
          <text x="800" y="395" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="28" fill={THEME.accent.danger}>
            BADAK JAWA LIAR
          </text>
          <text x="800" y="925" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="24" fill={THEME.accent.danger}>
            BUKAN SEPERTI TERNAK
          </text>

          {/* Center Slash Badge */}
          <circle cx="540" cy="645" r="46" fill={THEME.accent.danger} stroke="#FFFFFF" strokeWidth="5" />
          <line x1="522" y1="627" x2="558" y2="663" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
          <line x1="558" y1="627" x2="522" y2="663" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
        </svg>

        <div style={{ position: "absolute", top: 530, left: 560, zIndex: 20 }}>
          <OrganicRhino frame={frame} scale={0.68} walkSpeed={0} pose="alert" />
        </div>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // =========================================================================
  // SHOT 18 [1386, 1440): LOW-ANGLE MACRO WHEEL & SUSPENSION JOLT
  // =========================================================================
  if (shotId === 18) {
    const jolt = Math.abs(Math.sin(frame * 0.55)) * 16;
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Gravel Road & Rocky Rut */}
          <rect x="0" y="880" width="1080" height="110" fill="#475569" stroke={THEME.ink} strokeWidth="5" />
          <polygon points="360,880 420,835 500,880" fill="#78350F" stroke={THEME.ink} strokeWidth="4" />

          {/* Giant Macro Rear Truck Chassis + Coil Spring Jolt */}
          <g transform={`translate(0, ${-jolt})`}>
            <rect x="80" y="470" width="920" height="230" rx="20" fill="#FEF3C7" stroke={THEME.ink} strokeWidth="6" />
            <rect x="60" y="685" width="960" height="44" rx="10" fill="#1E293B" stroke={THEME.ink} strokeWidth="5" />
            {/* Shockwave Arcs upward */}
            <path d="M 380 445 Q 540 395 700 445" stroke={THEME.accent.danger} strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M 430 415 Q 540 375 650 415" stroke={THEME.accent.danger} strokeWidth="7" fill="none" strokeLinecap="round" />
          </g>

          {/* Giant Rotating Treaded Tire */}
          <g transform={`translate(540, ${790 - jolt * 0.4}) rotate(${wheelAngle})`}>
            <circle cx="0" cy="0" r="120" fill="#1E293B" stroke={THEME.ink} strokeWidth="6" />
            <circle cx="0" cy="0" r="64" fill="#94A3B8" stroke={THEME.ink} strokeWidth="5" />
            <line x1="-58" y1="0" x2="58" y2="0" stroke={THEME.ink} strokeWidth="8" />
            <line x1="0" y1="-58" x2="0" y2="58" stroke={THEME.ink} strokeWidth="8" />
          </g>

          <CalloutLeader
            ax={540}
            ay={430}
            bx={540}
            by={340}
            lx={540}
            ly={340}
            label="TARUHANNYA NYAWA"
            sublabel="GUNCANGAN KERAS MEMICU STRES FATAL"
            accent={THEME.accent.danger}
            progress={progress}
            align="center"
            pillWidth={520}
          />
        </svg>

        <SoilCrossSection frame={frame} parallaxX={-scrollX} />
      </div>
    );
  }

  // =========================================================================
  // SHOT 19 & 20 [1440, 1608): INSIDE CRATE CUTAWAY -> HEART & ECG WAVEFORM
  // =========================================================================
  if (shotId >= 19) {
    const rattleX = Math.sin(frame * 1.8) * 4;
    const rattleY = Math.cos(frame * 2.3) * 4;
    const highStress = shotId === 20;
    const heartPulse = 1 + Math.abs(Math.sin(frame * 0.45)) * 0.16;

    const ecgPoints: string[] = [];
    const beatFreq = highStress ? 0.56 : 0.36;
    const beatAmp = highStress ? 40 : 24;
    for (let x = 0; x <= 680; x += 6) {
      const t = (x * 0.14 - frame * beatFreq) % 14;
      const norm = ((t % 14) + 14) % 14;
      let y = 0;
      if (norm > 4.5 && norm < 5.5) y = -beatAmp * 0.25;
      else if (norm >= 5.5 && norm < 6.4) y = beatAmp * 0.45;
      else if (norm >= 6.4 && norm < 7.3) y = -beatAmp;
      else if (norm >= 7.3 && norm < 8.2) y = beatAmp * 0.55;
      ecgPoints.push(`${x},${52 + y}`);
    }

    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Crate Interior Frame Cutaway */}
          <g transform={`translate(${rattleX}, ${rattleY})`}>
            <rect x="85" y="485" width="910" height="510" rx="28" fill="#FEF3C7" stroke={THEME.ink} strokeWidth="7" />
            <rect x="130" y="530" width="820" height="420" rx="18" fill="#E2E8F0" stroke={THEME.ink} strokeWidth="5" />
          </g>

          {/* Live ECG Stress Monitor Floating at Top */}
          <g transform="translate(160, 325)">
            <rect x="0" y="0" width="760" height="154" rx="22" fill="#FFFDF7" stroke={THEME.accent.danger} strokeWidth="5" />
            <text x="380" y="38" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="22" fill={THEME.accent.danger}>
              {highStress ? "RENTAN STRES BERAT — DETAK JANTUNG MEMUNCAK" : "SATWA SUPER PEMALU & SENSITIF"}
            </text>
            <g transform="translate(40, 50)">
              <polyline points={ecgPoints.join(" ")} fill="none" stroke={THEME.accent.danger} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>

          {/* Pulsing Heart Symbol over Rhino Chest in Shot 20 */}
          {highStress && (
            <g transform={`translate(765, 765) scale(${heartPulse})`}>
              <circle cx="0" cy="0" r="68" fill="#FEE2E2" stroke={THEME.accent.danger} strokeWidth="5" opacity="0.92" />
              <path
                d="M 0 28 C -36 2 -36 -28 -16 -32 C -4 -34 0 -18 0 -18 C 0 -18 4 -34 16 -32 C 36 -28 36 2 0 28 Z"
                fill={THEME.accent.danger}
                stroke={THEME.ink}
                strokeWidth="3.5"
              />
            </g>
          )}
        </svg>

        {/* Tight Medium Close-Up of Nervous Rhino inside Crate */}
        <div style={{ position: "absolute", top: 530 + rattleY, left: 175 + rattleX, zIndex: 20 }}>
          <RhinoHeadCloseup frame={frame} scale={0.9} pose="alert" />
        </div>

        <SoilCrossSection frame={frame} parallaxX={-scrollX} />
      </div>
    );
  }

  // =========================================================================
  // SHOT 17 [1295, 1386): WIDE ROADSIDE TRUCK TRACKING SHOT
  // =========================================================================
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <svg viewBox="0 0 1080 1000" style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1000, overflow: "visible" }}>
        {[0, 280, 560, 840, 1120, 1400].map((tx, idx) => {
          const xPos = ((tx - scrollX + 1400) % 1400) - 140;
          return (
            <g key={idx} transform={`translate(${xPos}, 955)`}>
              <rect x="-10" y="-175" width="20" height="175" fill="#78350F" stroke={THEME.ink} strokeWidth="2.5" />
              <ellipse cx="0" cy="-215" rx="68" ry="74" fill="#16A34A" stroke={THEME.ink} strokeWidth="3.5" />
            </g>
          );
        })}

        <rect x="0" y="905" width="1080" height="80" fill="#475569" stroke={THEME.ink} strokeWidth="4" />
        {[0, 180, 360, 540, 720, 900, 1080, 1260].map((lx, i) => {
          const x = ((lx - scrollX + 1400) % 1400) - 120;
          return <rect key={i} x={x} y="942" width="84" height="10" rx="5" fill="#FACC15" />;
        })}

        <g transform={`translate(185, ${660 + chassisBounceY}) rotate(${chassisTilt}, 350, 220)`}>
          <rect x="20" y="25" width="430" height="215" rx="16" fill="#FEF3C7" stroke={THEME.ink} strokeWidth="5" />
          <rect x="55" y="52" width="360" height="145" rx="12" fill="#E2E8F0" stroke={THEME.ink} strokeWidth="4" />
          <path d="M 455 72 L 595 72 Q 642 74 662 128 L 685 162 L 685 240 L 455 240 Z" fill="#0284C7" stroke={THEME.ink} strokeWidth="5" strokeLinejoin="round" />
          <path d="M 520 92 L 592 92 Q 625 96 642 138 L 520 138 Z" fill="#BAE6FD" stroke={THEME.ink} strokeWidth="4" />
          <rect x="10" y="232" width="685" height="24" rx="8" fill="#1E293B" stroke={THEME.ink} strokeWidth="4" />
        </g>

        {[315, 495, 745].map((wx, idx) => (
          <g key={idx} transform={`translate(${wx}, 900) rotate(${wheelAngle})`}>
            <circle cx="0" cy="0" r="46" fill="#1E293B" stroke={THEME.ink} strokeWidth="4.5" />
            <circle cx="0" cy="0" r="24" fill="#94A3B8" stroke={THEME.ink} strokeWidth="3.5" />
            <line x1="-22" y1="0" x2="22" y2="0" stroke={THEME.ink} strokeWidth="4" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke={THEME.ink} strokeWidth="4" />
          </g>
        ))}

        <CalloutLeader
          ax={380}
          ay={680}
          bx={540}
          by={410}
          lx={540}
          ly={410}
          label="TRANSLOKASI JALAN TERJAL"
          sublabel="BERISIKO TINGGI BAGI BADAK"
          accent={THEME.accent.warning}
          progress={progress}
          align="center"
          pillWidth={380}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          top: 714 + chassisBounceY,
          left: 242,
          width: 356,
          height: 141,
          borderRadius: 10,
          overflow: "hidden",
          zIndex: 18,
          pointerEvents: "none",
          transform: `rotate(${chassisTilt}deg)`,
          transformOrigin: "293px 166px",
        }}
      >
        <div style={{ position: "absolute", top: -36, left: 22 }}>
          <OrganicRhino frame={frame} scale={0.52} walkSpeed={0} pose="alert" flipX />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-evenly", pointerEvents: "none" }}>
          <div style={{ width: 7, height: "100%", backgroundColor: "rgba(15, 23, 42, 0.38)" }} />
          <div style={{ width: 7, height: "100%", backgroundColor: "rgba(15, 23, 42, 0.38)" }} />
          <div style={{ width: 7, height: "100%", backgroundColor: "rgba(15, 23, 42, 0.38)" }} />
        </div>
      </div>

      <SoilCrossSection frame={frame} parallaxX={-scrollX} />
    </div>
  );
};
