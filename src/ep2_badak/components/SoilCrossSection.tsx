import React from "react";
import { THEME } from "../theme";
import { CalloutLeader } from "./CalloutLeader";

interface SoilCrossSectionProps {
  frame: number;
  parallaxX?: number;
  showDepthMarkers?: boolean;
  progress?: number;
  dryMix?: number; // 0 = lush green, 1 = dry yellow savanna
}

/**
 * Living 2.5D Ground & Soil Cross-Section (Y = 980..1920)
 * - Undulating grass surface with swaying blades
 * - Organic soil strata with pebbles & root tendrils
 * - Depth markers strictly outside subtitle zone (bottom 19% -> Y=1220..1555)
 */
export const SoilCrossSection: React.FC<SoilCrossSectionProps> = ({
  frame,
  parallaxX = 0,
  showDepthMarkers = false,
  progress = 1,
  dryMix = 0,
}) => {
  const grassColor = dryMix > 0.5 ? THEME.ground.dryGrass : THEME.ground.grass;
  const topSoilColor = dryMix > 0.5 ? THEME.ground.dryTopSoil : THEME.ground.topSoil;
  const deepSoilColor = dryMix > 0.5 ? THEME.ground.dryDeepSoil : THEME.ground.deepSoil;

  const bladeSway = Math.sin(frame * 0.08) * 5;

  return (
    <svg
      viewBox="0 0 1080 940"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: 1080,
        height: 940,
        overflow: "visible",
      }}
    >
      {/* Bedrock / Deep Soil */}
      <rect x="-40" y="210" width="1160" height="750" fill={deepSoilColor} />

      {/* Subsoil Undulating Layer */}
      <path
        d={`M -40 108 Q ${260 + parallaxX * 0.2} 96, 540 110 T 1120 104 L 1120 235 L -40 235 Z`}
        fill={THEME.ground.subSoil}
      />

      {/* Topsoil Layer */}
      <path
        d={`M -40 38 Q ${240 + parallaxX * 0.4} 30, 540 42 T 1120 36 L 1120 120 L -40 120 Z`}
        fill={topSoilColor}
      />

      {/* Grass Surface Strip */}
      <path
        d={`M -40 0 Q 270 -6, 540 4 T 1120 -4 L 1120 46 L -40 46 Z`}
        fill={grassColor}
        stroke={THEME.ink}
        strokeWidth="4.5"
      />

      {/* Swaying Grass Tufts along the path */}
      {[90, 210, 340, 480, 620, 770, 910, 1020].map((gx, i) => (
        <g
          key={i}
          transform={`translate(${gx + (parallaxX * 0.6) % 120}, 2) rotate(${bladeSway * (i % 2 === 0 ? 1 : -0.8)}, 0, 0)`}
        >
          <path d="M -8 0 Q -14 -18 -20 -26" stroke={grassColor} strokeWidth="5" strokeLinecap="round" />
          <path d="M 0 0 Q 2 -22 6 -30" stroke={THEME.ground.grassHighlight} strokeWidth="5" strokeLinecap="round" />
          <path d="M 8 0 Q 15 -16 20 -22" stroke={grassColor} strokeWidth="4.5" strokeLinecap="round" />
        </g>
      ))}

      {/* Pebbles & Organic Soil Texture */}
      {[
        [180, 150, 14, 8],
        [420, 175, 18, 10],
        [740, 145, 16, 9],
        [920, 185, 20, 11],
        [290, 710, 22, 12],
        [680, 740, 26, 13],
      ].map(([px, py, rx, ry], idx) => (
        <ellipse
          key={idx}
          cx={px}
          cy={py}
          rx={rx}
          ry={ry}
          fill="#0F172A"
          opacity="0.2"
        />
      ))}

      {/* Clean Technical Depth Scale (Y = 38..165 above subtitle, Y = 690 below subtitle) */}
      {showDepthMarkers && (
        <g>
          <line
            x1="104"
            y1="14"
            x2="104"
            y2="710"
            stroke="#FFFDF7"
            strokeWidth="3.5"
            strokeDasharray="10 8"
            opacity="0.65"
          />
          <CalloutLeader
            ax={104}
            ay={16}
            bx={140}
            by={36}
            lx={168}
            ly={36}
            label="PERMUKAAN (0 M)"
            accent={THEME.ink}
            progress={progress}
            align="left"
            pillWidth={255}
          />
          <CalloutLeader
            ax={104}
            ay={145}
            bx={140}
            by={160}
            lx={168}
            ly={160}
            label="LAPISAN TANAH (-5 M)"
            accent={THEME.ground.subSoil}
            progress={progress}
            align="left"
            pillWidth={295}
          />
          <CalloutLeader
            ax={104}
            ay={695}
            bx={140}
            by={695}
            lx={168}
            ly={695}
            label="BATUAN DASAR (-12 M)"
            accent={THEME.ink}
            progress={progress}
            align="left"
            pillWidth={295}
          />
        </g>
      )}
    </svg>
  );
};
