import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { OrganicRhino } from "./OrganicRhino";
import { CalloutLeader } from "./CalloutLeader";
import { SoilCrossSection } from "./SoilCrossSection";

interface Scene9ConservationProps {
  frame: number;
  progress: number;
  shotId: number;
  parallaxX: number;
}

/**
 * Scene 9: Expert Consensus & Restoring Ujung Kulon [2928, 3372) — 5 Distinct Framings!
 * - Shot 36: Scientist Consensus Pointing to Ujung Kulon Sanctuary
 * - Shot 37: Dynamic 2.5D Balance Scale ("HINDARI RISIKO FATAL")
 * - Shot 38: Resource Streams Clearing Invasive Langkap Canopy
 * - Shot 39: Blooming Food Plants & Ranger Watchtower ("PERBAIKI & JAGA KETAT")
 * - Shot 40: Mother & Baby Rhino Grazing Joyfully in Sunlit Meadow
 */
export const Scene9Conservation: React.FC<Scene9ConservationProps> = ({
  frame,
  progress,
  shotId,
  parallaxX,
}) => {
  // Shot 36 [2928, 3000): Scientist Consensus Pointing to Ujung Kulon
  if (shotId === 36) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Glowing Ujung Kulon Sanctuary Shield on Right */}
          <g transform="translate(755, 650)">
            <circle cx="0" cy="0" r="165" fill="#DCFCE7" stroke={THEME.accent.success} strokeWidth="7" />
            <path d="M -125 35 Q -30 -35 45 18 Q 100 -15 140 30 L 130 85 Q 0 145 -125 80 Z" fill="#22C55E" stroke={THEME.ink} strokeWidth="4" />
            <text x="0" y="-85" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="26" fill="#15803D">
              UJUNG KULON
            </text>
          </g>
          {/* Researcher Silhouettes Pointing Firmly to Sanctuary */}
          {[210, 360].map((sx, i) => (
            <g key={i} transform={`translate(${sx}, ${820 - i * 18})`}>
              <circle cx="0" cy="-115" r="34" fill="#0284C7" stroke={THEME.ink} strokeWidth="4" />
              <path d="M -45 -65 Q 0 -78 45 -65 L 54 165 L -54 165 Z" fill="#0369A1" stroke={THEME.ink} strokeWidth="4" />
            </g>
          ))}
          <path d="M 430 680 L 560 655" stroke={THEME.accent.success} strokeWidth="14" strokeLinecap="round" />
          <polygon points="585,650 545,632 550,676" fill={THEME.accent.success} />

          <CalloutLeader
            ax={755}
            ay={485}
            bx={540}
            by={380}
            lx={540}
            ly={380}
            label="KONSENSUS BANYAK AHLI"
            sublabel="FOKUS KE RUMAH ASLI"
            accent={THEME.accent.success}
            progress={progress}
            align="center"
            pillWidth={390}
          />
        </svg>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 37 [3000, 3108): Tilting 2.5D Balance Scale
  if (shotId === 37) {
    const scaleTilt = interpolate(progress, [0, 0.75], [0, 16], { extrapolateRight: "clamp" });
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          <g transform="translate(540, 690)">
            <path d="M -100 175 L 100 175 L 68 140 L -68 140 Z" fill="#334155" stroke={THEME.ink} strokeWidth="4" />
            <rect x="-12" y="-120" width="24" height="265" rx="8" fill="#475569" stroke={THEME.ink} strokeWidth="4" />
            <g transform={`translate(0, -110) rotate(${scaleTilt})`}>
              <rect x="-265" y="-10" width="530" height="20" rx="10" fill="#64748B" stroke={THEME.ink} strokeWidth="4" />
              <circle cx="0" cy="0" r="18" fill="#FDE047" stroke={THEME.ink} strokeWidth="4" />
              <g transform={`translate(-235, 0) rotate(${-scaleTilt})`}>
                <line x1="0" y1="0" x2="-45" y2="115" stroke={THEME.ink} strokeWidth="3.5" />
                <line x1="0" y1="0" x2="45" y2="115" stroke={THEME.ink} strokeWidth="3.5" />
                <path d="M -70 115 Q 0 148 70 115 Z" fill="#FEE2E2" stroke={THEME.accent.danger} strokeWidth="4" />
                <rect x="-42" y="68" width="84" height="46" rx="8" fill="#FEF3C7" stroke={THEME.accent.danger} strokeWidth="3.5" />
                <text x="0" y="98" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="18" fill={THEME.accent.danger}>
                  PINDAH
                </text>
              </g>
              <g transform={`translate(235, 0) rotate(${-scaleTilt})`}>
                <line x1="0" y1="0" x2="-45" y2="115" stroke={THEME.ink} strokeWidth="3.5" />
                <line x1="0" y1="0" x2="45" y2="115" stroke={THEME.ink} strokeWidth="3.5" />
                <path d="M -75 115 Q 0 152 75 115 Z" fill="#DCFCE7" stroke={THEME.accent.success} strokeWidth="4" />
                <circle cx="0" cy="84" r="32" fill="#22C55E" stroke={THEME.ink} strokeWidth="3.5" />
                <text x="0" y="90" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="16" fill="#FFFFFF">
                  JAGA
                </text>
              </g>
            </g>
            <g transform="translate(0, -255)">
              <rect x="-275" y="-30" width="550" height="60" rx="16" fill="#FFFDF7" stroke={THEME.accent.success} strokeWidth="4.5" />
              <text x="0" y="9" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="24" fill="#15803D">
                HINDARI RISIKO FATAL PINDAH JAUH
              </text>
            </g>
          </g>
        </svg>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 38 [3108, 3210): Resource Allocation Clearing Invasive Langkap
  if (shotId === 38) {
    const clearX = interpolate(progress, [0, 1], [0, 260]);
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Sunlight breaking through as Langkap retreats */}
          <polygon points="340,180 740,180 940,980 140,980" fill="#FEF08A" opacity="0.45" />
          {/* Invasive Langkap pushed aside */}
          <g transform={`translate(${760 + clearX}, 980)`} opacity={1 - progress * 0.65}>
            <rect x="-12" y="-360" width="24" height="360" fill="#4D7C0F" />
            <ellipse cx="0" cy="-380" rx="140" ry="42" fill="#16A34A" stroke={THEME.ink} strokeWidth="4" />
          </g>

          {/* Animated Emerald Budget & Patrol Streams */}
          <CalloutLeader
            ax={320}
            ay={650}
            bx={275}
            by={390}
            lx={275}
            ly={390}
            label="FOKUS ANGGARAN"
            sublabel="BERSIHKAN LANGKAP"
            accent={THEME.accent.success}
            progress={progress}
            align="center"
            pillWidth={340}
          />
          <CalloutLeader
            ax={700}
            ay={650}
            bx={805}
            by={390}
            lx={805}
            ly={390}
            label="TENAGA & PATROLI"
            sublabel="JAGA KETAT KAWASAN"
            accent={THEME.accent.success}
            progress={progress}
            align="center"
            pillWidth={340}
          />
        </svg>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 39 [3210, 3290): Blooming Native Food Shrubs + Ranger Watchtower
  if (shotId === 39) {
    const bloom = interpolate(progress, [0, 1], [0.6, 1.15]);
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Sunlit Ranger Watchtower on Right */}
          <g transform="translate(835, 980)">
            <line x1="-55" y1="0" x2="-35" y2="-280" stroke="#78350F" strokeWidth="14" />
            <line x1="55" y1="0" x2="35" y2="-280" stroke="#78350F" strokeWidth="14" />
            <rect x="-65" y="-365" width="130" height="88" rx="10" fill="#FEF3C7" stroke={THEME.ink} strokeWidth="4.5" />
            <polygon points="-85,-365 0,-420 85,-365" fill="#16A34A" stroke={THEME.ink} strokeWidth="4.5" />
          </g>

          {/* Rapidly Blooming Native Rhino Food Plants */}
          {[180, 360, 540, 690].map((px, i) => (
            <g key={i} transform={`translate(${px}, 980) scale(${bloom})`}>
              <path d="M 0 0 Q -26 -62 -52 -90" stroke="#15803D" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M 0 0 Q 26 -66 50 -94" stroke="#16A34A" strokeWidth="8" fill="none" strokeLinecap="round" />
              <ellipse cx="-48" cy="-94" rx="26" ry="15" fill="#4ADE80" stroke={THEME.ink} strokeWidth="3" />
              <ellipse cx="48" cy="-98" rx="26" ry="15" fill="#22C55E" stroke={THEME.ink} strokeWidth="3" />
            </g>
          ))}

          <CalloutLeader
            ax={540}
            ay={870}
            bx={360}
            by={395}
            lx={360}
            ly={395}
            label="PAKAN PULIH & TERJAGA"
            sublabel="MENARA PANTAU UJUNG KULON"
            accent={THEME.accent.success}
            progress={progress}
            align="center"
            pillWidth={400}
          />
        </svg>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 40 [3290, 3372): Mother & Baby Rhino Walking Peacefully in Sunlit Clearing
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <svg viewBox="0 0 1080 1050" style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1050, overflow: "visible" }}>
        <polygon points="410,160 670,160 940,980 140,980" fill="#FEF08A" opacity="0.48" />
        {[90, 990].map((tx, i) => (
          <g key={i} transform={`translate(${tx + parallaxX * 0.4}, 980)`}>
            <path d="M -10 0 L -8 -210 L 8 -210 L 12 0 Z" fill="#78350F" />
            <ellipse cx="0" cy="-240" rx="76" ry="84" fill="#22C55E" stroke={THEME.ink} strokeWidth="3.5" />
          </g>
        ))}
        <CalloutLeader
          ax={540}
          ay={680}
          bx={540}
          by={375}
          lx={540}
          ly={375}
          label="PERKUAT RUMAH ASLI UJUNG KULON"
          accent={THEME.accent.success}
          progress={progress}
          align="center"
          pillWidth={470}
        />
      </svg>

      <div style={{ position: "absolute", bottom: 912, left: 95, zIndex: 20 }}>
        <OrganicRhino frame={frame} scale={0.78} walkSpeed={0.9} pose="walk" flipX />
      </div>
      <div style={{ position: "absolute", bottom: 912, left: 615, zIndex: 21 }}>
        <OrganicRhino frame={frame + 12} scale={0.48} walkSpeed={1.1} isBaby pose="walk" flipX />
      </div>

      <SoilCrossSection frame={frame} parallaxX={parallaxX} />
    </div>
  );
};
