import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { CalloutLeader } from "./CalloutLeader";
import { OrganicRhino } from "./OrganicRhino";

interface Scene3KrakatauProps {
  frame: number;
  progress: number;
  shotId: number;
}

/**
 * Scene 3: Anak Krakatau Eruption, Flank Collapse & Tsunami [942, 1200)
 * 3 Distinct ViewBox Camera Shots:
 * - Shot 13: Close-up caldera eruption + glowing fault cracks on steep flank
 * - Shot 14: Surface & underwater flank landslide cutaway displacing sea water
 * - Shot 15: Wide coastal panorama as tsunami wave surges toward Ujung Kulon shoreline
 */
export const Scene3Krakatau: React.FC<Scene3KrakatauProps> = ({
  frame,
  progress,
  shotId,
}) => {
  const waveShift = (frame * 3.5) % 360;
  const smokeRise = (frame * 2.4) % 150;

  // Dynamic Camera ViewBox per Shot (breaks static wide board!)
  let vbX = 0;
  let vbY = 0;
  let vbW = 1080;
  if (shotId === 13) {
    // Tight dramatic view on Anak Krakatau volcano cone & ash eruption
    vbX = interpolate(progress, [0, 1], [-15, 10]);
    vbY = interpolate(progress, [0, 1], [210, 250]);
    vbW = interpolate(progress, [0, 1], [680, 720]);
  } else if (shotId === 14) {
    // Cutaway zoom onto flank collapse & water splash/displacement
    vbX = interpolate(progress, [0, 1], [110, 180]);
    vbY = interpolate(progress, [0, 1], [340, 360]);
    vbW = interpolate(progress, [0, 1], [700, 760]);
  } else {
    // Shot 15: Full wide Sunda Strait view to Ujung Kulon forest coast
    vbX = interpolate(progress, [0, 1], [80, 0]);
    vbY = interpolate(progress, [0, 1], [230, 160]);
    vbW = interpolate(progress, [0, 1], [960, 1080]);
  }
  const vbH = vbW * 0.92;

  const slideT =
    shotId === 13
      ? 0.04
      : shotId === 14
      ? interpolate(progress, [0, 1], [0.1, 1.0])
      : 1.0;

  const waveX =
    shotId === 13
      ? 350
      : shotId === 14
      ? interpolate(progress, [0.25, 1], [360, 560], { extrapolateLeft: "clamp" })
      : interpolate(progress, [0, 1], [540, 820]);

  const waveHeight =
    shotId === 13
      ? 24
      : shotId === 14
      ? interpolate(progress, [0.2, 1], [28, 128], { extrapolateLeft: "clamp" })
      : interpolate(progress, [0, 0.7, 1], [128, 170, 145]);

  const rumbleY = shotId <= 14 ? Math.sin(frame * 2.1) * 3 : 0;

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      {/* Main Ocean & Volcano Stage inside Safe Zone (Y = 260..1240) */}
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        style={{ position: "absolute", top: 240, left: 0, width: 1080, height: 990, overflow: "hidden" }}
      >
        <defs>
          <linearGradient id="krakBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="55%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="tsunamiBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>

        {/* Erupting Ash Smoke Plume */}
        <g transform={`translate(185, ${440 + rumbleY})`}>
          {[0, 1, 2, 3, 4].map((i) => {
            const off = (smokeRise + i * 30) % 150;
            return (
              <circle
                key={i}
                cx={Math.sin(frame * 0.08 + i) * 16 + off * 0.16}
                cy={-off * 1.3}
                r={32 + off * 0.45}
                fill={i % 2 === 0 ? "#64748B" : "#94A3B8"}
                opacity={interpolate(off, [0, 115, 150], [0.85, 0.65, 0.05])}
              />
            );
          })}
          <ellipse cx="0" cy="4" rx="28" ry="10" fill="#F97316" />
          <ellipse cx="0" cy="4" rx="14" ry="5" fill="#FDE047" />
        </g>

        {/* Seabed & Ocean Water Column */}
        <path
          d="M -60 990 Q 180 960 400 1010 Q 650 1040 880 980 L 1140 920 L 1140 1400 L -60 1400 Z"
          fill="#475569"
        />
        <path
          d={`M -60 820 Q ${120 + waveShift * 0.5} 808 280 822 T 600 818 T 940 816 L 940 1040 L -60 1040 Z`}
          fill="#0284C7"
          opacity="0.88"
        />
        <path
          d={`M -60 848 Q ${160 - waveShift * 0.4} 838 340 850 T 700 846 T 940 844 L 940 1040 L -60 1040 Z`}
          fill="#0369A1"
          opacity="0.72"
        />

        {/* Volcano Cone + Magma Conduit + Sliding Flank Mass */}
        <g transform={`translate(0, ${rumbleY})`}>
          <path d="M 10 1010 L 145 450 Q 185 436 225 450 L 365 1010 Z" fill="url(#krakBody)" stroke={THEME.ink} strokeWidth="5" strokeLinejoin="round" />
          <path d="M 172 1010 L 180 454 L 192 454 L 204 1010 Z" fill="#F97316" opacity="0.88" />
          {shotId === 13 && (
            <path d="M 212 520 L 235 590 L 222 650 L 255 720" stroke="#FDE047" strokeWidth="5" fill="none" strokeLinecap="round" />
          )}
          <g transform={`translate(${slideT * 95}, ${slideT * 215}) rotate(${slideT * 22}, 260, 680)`}>
            <path d="M 215 560 L 278 690 L 265 760 L 195 700 Z" fill="#475569" stroke="#EA580C" strokeWidth="4.5" strokeLinejoin="round" />
          </g>
        </g>

        {/* Landslide Arrows & Splash Plume */}
        {shotId >= 14 && (
          <g>
            <path d="M 250 615 Q 325 710 345 815" stroke="#F97316" strokeWidth="12" strokeLinecap="round" fill="none" />
            <polygon points="348,835 326,800 366,796" fill="#F97316" stroke={THEME.ink} strokeWidth="2.5" />
            <g transform={`translate(355, 815) scale(${0.6 + slideT * 0.55})`} opacity="0.92">
              <circle cx="-18" cy="-16" r="24" fill="#F0F9FF" />
              <circle cx="14" cy="-24" r="30" fill="#FFFFFF" />
              <circle cx="38" cy="-10" r="20" fill="#E0F2FE" />
            </g>
            <path d="M 380 860 Q 470 845 545 845" stroke="#FACC15" strokeWidth="10" strokeLinecap="round" fill="none" />
            <polygon points="565,845 532,828 532,862" fill="#FACC15" stroke={THEME.ink} strokeWidth="2.5" />
          </g>
        )}

        {/* Surging Tsunami Crest */}
        {shotId >= 14 && (
          <g transform={`translate(${waveX}, 824)`}>
            <path
              d={`M -110 20 Q -40 ${-waveHeight * 0.65} 18 ${-waveHeight} Q 75 ${-waveHeight * 1.1} 45 ${-waveHeight * 0.55} Q 25 ${-waveHeight * 0.28} 105 20 Z`}
              fill="url(#tsunamiBody)"
              stroke={THEME.ink}
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <path d={`M 16 ${-waveHeight} Q 68 ${-waveHeight * 1.12} 48 ${-waveHeight * 0.58} Q 34 ${-waveHeight * 0.72} 16 ${-waveHeight} Z`} fill="#FFFFFF" />
          </g>
        )}

        {/* Ujung Kulon Shoreline + Alerted Rhino on Cliff */}
        <g>
          <path d="M 860 980 Q 885 780 945 770 L 1140 770 L 1140 1100 L 840 1100 Z" fill="#16A34A" stroke={THEME.ink} strokeWidth="4.5" />
          <rect x="860" y="845" width="280" height="550" fill="#4A2206" />
          <rect x="860" y="770" width="280" height="80" fill="#854D0E" />
          <path d="M 860 770 Q 980 760 1140 770 L 1140 800 L 860 800 Z" fill="#22C55E" stroke={THEME.ink} strokeWidth="4" />
          {[945, 1035].map((tx, i) => (
            <g key={i} transform={`translate(${tx}, 772)`}>
              <rect x="-8" y="-95" width="16" height="100" fill="#78350F" />
              <ellipse cx="0" cy="-115" rx="48" ry="52" fill="#15803D" stroke={THEME.ink} strokeWidth="3" />
            </g>
          ))}
          {shotId === 15 && (
            <g transform="translate(865, 650)">
              <OrganicRhino frame={frame} scale={0.34} pose="alert" />
            </g>
          )}
        </g>

        {/* Shot-Specific Callouts */}
        {shotId === 13 && (
          <CalloutLeader
            ax={185}
            ay={445}
            bx={255}
            by={355}
            lx={285}
            ly={355}
            label="ERUPSI ANAK KRAKATAU"
            sublabel="RETAK DI LERENG GUNUNG"
            accent={THEME.accent.danger}
            progress={progress}
            align="left"
            pillWidth={320}
          />
        )}
        {shotId === 14 && (
          <CalloutLeader
            ax={315}
            ay={700}
            bx={470}
            by={490}
            lx={500}
            ly={490}
            label="LONGSORAN LERENG"
            sublabel="MENDISPLASI AIR LAUT"
            accent={THEME.accent.warning}
            progress={progress}
            align="left"
            pillWidth={320}
          />
        )}
        {shotId === 15 && (
          <CalloutLeader
            ax={waveX + 20}
            ay={824 - waveHeight * 0.8}
            bx={540}
            by={425}
            lx={540}
            ly={425}
            label="TSUNAMI KE UJUNG KULON"
            sublabel="ALASAN BIKIN HABITAT CADANGAN"
            accent={THEME.accent.info}
            progress={progress}
            align="center"
            pillWidth={410}
          />
        )}
      </svg>

      {/* Bottom Ground Fill below Map Viewport so zero blank gap */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 690,
          backgroundColor: "#334155",
          borderTop: "4px solid #0F172A",
          zIndex: -1,
        }}
      />
    </div>
  );
};
