import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { OrganicRhino } from "./OrganicRhino";
import { CalloutLeader } from "./CalloutLeader";
import { SoilCrossSection } from "./SoilCrossSection";

interface Scene5MusofaProps {
  frame: number;
  localFrame: number;
  progress: number;
  shotId: number;
}

/**
 * Scene 5: Musofa Case Study [1608, 1842) — 3 Distinct Beats!
 * - Shot 21: Field Dossier & Ujung Kulon Stamp Reveal ("Buktinya nyata.")
 * - Shot 22: Sunlit Field Walk of Male Rhino Musofa inside Ujung Kulon
 * - Shot 23: Warm Memorial Vignette + ECG Trace Transitioning to Flatline
 */
export const Scene5Musofa: React.FC<Scene5MusofaProps> = ({
  frame,
  progress,
  shotId,
}) => {
  // Shot 21: Archival Field Dossier Reveal
  if (shotId === 21) {
    const scaleIn = interpolate(progress, [0, 0.6], [0.88, 1], { extrapolateRight: "clamp" });
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          <g transform={`translate(540, 670) scale(${scaleIn})`}>
            <rect x="-320" y="-210" width="640" height="420" rx="26" fill="#FEF3C7" stroke={THEME.ink} strokeWidth="6" />
            <rect x="-290" y="-180" width="580" height="360" rx="18" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="4" />
            <text x="0" y="-95" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="34" fill={THEME.accent.danger}>
              CATATAN LAPANGAN NYATA
            </text>
            <text x="0" y="-42" textAnchor="middle" fontFamily={THEME.font} fontWeight="800" fontSize="26" fill={THEME.inkSoft}>
              TN UJUNG KULON — BANTEN
            </text>
            <rect x="-150" y="10" width="300" height="105" rx="16" fill="#DCFCE7" stroke={THEME.ink} strokeWidth="3.5" />
            <text x="0" y="72" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="30" fill={THEME.ink}>
              KASUS MUSOFA
            </text>
          </g>
        </svg>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 22: Sunlit Field Walk of Musofa inside Local Enclosure
  if (shotId === 22) {
    const walkX = interpolate(progress, [0, 1], [-55, 35]);
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Sunlit Forest Background */}
          <path d="M 0 740 Q 340 620 680 710 T 1080 680 L 1080 980 L 0 980 Z" fill="#86EFAC" opacity="0.55" />
          {/* Wooden Enclosure Posts suggesting local translocation area */}
          {[140, 380, 680, 920].map((px, i) => (
            <g key={i}>
              <rect x={px - 10} y="820" width="20" height="160" fill="#78350F" stroke={THEME.ink} strokeWidth="3" />
            </g>
          ))}
          <line x1="120" y1="865" x2="940" y2="865" stroke="#92400E" strokeWidth="10" />
          <line x1="120" y1="920" x2="940" y2="920" stroke="#92400E" strokeWidth="10" />

          <CalloutLeader
            ax={540 + walkX}
            ay={735}
            bx={540}
            by={420}
            lx={540}
            ly={420}
            label="BADAK JANTAN MUSOFA"
            sublabel="DIPINDAHKAN DI TN UJUNG KULON"
            accent={THEME.ink}
            progress={progress}
            align="center"
            pillWidth={410}
          />
        </svg>

        <div style={{ position: "absolute", bottom: 912, left: "50%", transform: `translateX(${-265 + walkX}px)`, zIndex: 20 }}>
          <OrganicRhino frame={frame} scale={0.82} walkSpeed={0.65} pose="walk" />
        </div>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 23 [1745, 1842): Warm Memorial Vignette + ECG Transition to Flatline
  const flatProgress = interpolate(progress, [0, 0.7], [0.2, 1], { extrapolateRight: "clamp" });
  const ecgPoints: string[] = [];
  for (let x = 0; x <= 680; x += 6) {
    const ratio = x / 680;
    const damp = Math.max(0, 1 - Math.max(0, ratio - (1 - flatProgress)) * 3.5);
    const t = (x * 0.14 - frame * 0.25) % 14;
    const norm = ((t % 14) + 14) % 14;
    let y = 0;
    if (norm > 5.0 && norm < 6.2) y = 14 * damp;
    else if (norm >= 6.2 && norm < 7.2) y = -32 * damp;
    else if (norm >= 7.2 && norm < 8.2) y = 18 * damp;
    ecgPoints.push(`${x},${44 + y}`);
  }

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(254, 243, 199, 0.4) 0%, rgba(255, 253, 247, 0.15) 100%)",
          pointerEvents: "none",
        }}
      />
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
        <circle cx="540" cy="790" r="245" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="4.5" opacity="0.88" />
        <circle cx="540" cy="790" r="225" fill="#FEF3C7" opacity="0.45" />

        {[0, 1, 2, 3, 4, 5].map((i) => {
          const ly = ((frame * 1.4 + i * 95) % 450) + 460;
          const lx = 260 + i * 115 + Math.sin(frame * 0.05 + i) * 24;
          return (
            <ellipse
              key={i}
              cx={lx}
              cy={ly}
              rx="8"
              ry="4.5"
              transform={`rotate(${frame * 2 + i * 40}, ${lx}, ${ly})`}
              fill="#D97706"
              opacity="0.55"
            />
          );
        })}

        <g transform="translate(160, 345)">
          <rect x="0" y="0" width="760" height="125" rx="20" fill="#FFFDF7" stroke={THEME.accent.danger} strokeWidth="4.5" />
          <text x="26" y="34" fontFamily={THEME.font} fontWeight="900" fontSize="20" fill={THEME.ink}>
            MUSOFA — PASCA PEMINDAHAN
          </text>
          <text x="734" y="34" textAnchor="end" fontFamily={THEME.font} fontWeight="900" fontSize="20" fill={THEME.accent.danger}>
            MATI BEBERAPA HARI
          </text>
          <g transform="translate(40, 28)">
            <polyline points={ecgPoints.join(" ")} fill="none" stroke={THEME.accent.danger} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </svg>

      <div style={{ position: "absolute", bottom: 912, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
        <OrganicRhino frame={frame} scale={0.82} walkSpeed={0} pose="rest" isMemorial />
      </div>
      <SoilCrossSection frame={frame} />
    </div>
  );
};
