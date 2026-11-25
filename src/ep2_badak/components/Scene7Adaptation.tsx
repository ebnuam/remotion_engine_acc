import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { OrganicRhino, RhinoHeadCloseup } from "./OrganicRhino";
import { CalloutLeader } from "./CalloutLeader";
import { SoilCrossSection } from "./SoilCrossSection";

interface Scene7AdaptationProps {
  frame: number;
  progress: number;
  shotId: number;
  parallaxX: number;
}

/**
 * Scene 7: Adaptation Failure [2076, 2520) — 5 Distinct Framings!
 * - Shot 27: Road Heat & Vibration Transition
 * - Shot 28: Qualitative Conservation Track Chart ("MAYORITAS GAGAL", ZERO fake %)
 * - Shot 29: Dry Unfamiliar Savanna Wide Cross-Section
 * - Shot 30: Macro Rhino Head Sniffing Unfamiliar Thorny Shrub
 * - Shot 31: Solitary Rhino & Fading Dotted Calf Silhouette ("GAGAL BERKEMBANG BIAK")
 */
export const Scene7Adaptation: React.FC<Scene7AdaptationProps> = ({
  frame,
  progress,
  shotId,
  parallaxX,
}) => {
  // Shot 27 [2076, 2142): Road Heat & Vibration Transition
  if (shotId === 27) {
    const scrollX = (frame * 12) % 1400;
    const bounce = Math.sin(frame * 0.5) * 6;
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Shimmering Golden Heat Waves */}
          {[450, 520, 590].map((hy, i) => (
            <path
              key={i}
              d={`M 160 ${hy} Q 340 ${hy - 22 + Math.sin(frame * 0.25 + i) * 14} 540 ${hy} T 920 ${hy}`}
              stroke="#EA580C"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.45"
            />
          ))}
          <rect x="0" y="905" width="1080" height="80" fill="#78350F" stroke={THEME.ink} strokeWidth="4" />
          {/* Moving Crate Truck */}
          <g transform={`translate(${180 + progress * 120}, ${670 + bounce})`}>
            <rect x="0" y="25" width="380" height="195" rx="16" fill="#FEF3C7" stroke={THEME.ink} strokeWidth="5" />
            <path d="M 385 68 L 515 68 Q 555 72 578 145 L 578 220 L 385 220 Z" fill="#0284C7" stroke={THEME.ink} strokeWidth="5" />
            <circle cx="110" cy="230" r="42" fill="#1E293B" stroke={THEME.ink} strokeWidth="4" />
            <circle cx="465" cy="230" r="42" fill="#1E293B" stroke={THEME.ink} strokeWidth="4" />
          </g>
          <CalloutLeader
            ax={420}
            ay={690}
            bx={540}
            by={390}
            lx={540}
            ly={390}
            label="RISIKO STRES PERJALANAN"
            sublabel="GETARAN & SUHU PANAS"
            accent={THEME.accent.warning}
            progress={progress}
            align="center"
            pillWidth={380}
          />
        </svg>
        <SoilCrossSection frame={frame} parallaxX={-scrollX} dryMix={1} />
      </div>
    );
  }

  // Shot 28 [2142, 2240): Qualitative 10-Track Wildlife Study Graphic ("MAYORITAS GAGAL", NO fake %)
  if (shotId === 28) {
    const trackGrow = interpolate(progress, [0, 0.4], [0.25, 1], { extrapolateRight: "clamp" });
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Clean Stage Infographic Header */}
          <g transform="translate(540, 385)">
            <rect x="-350" y="-42" width="700" height="84" rx="20" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="4.5" />
            <text x="0" y="-4" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="26" fill={THEME.ink}>
              STUDI PEMINDAHAN SATWA LIAR
            </text>
            <text x="0" y="28" textAnchor="middle" fontFamily={THEME.font} fontWeight="800" fontSize="20" fill={THEME.accent.danger}>
              MAYORITAS SERING GAGAL DI HABITAT ASING
            </text>
          </g>

          {/* Animated Track Comparison Bars (Visual proportion, NO invented percentages!) */}
          <g transform="translate(120, 520)">
            {/* Short Green Group: Sedikit Berhasil (label cleanly to the right of bar!) */}
            <rect x="0" y="0" width={200 * trackGrow} height="76" rx="16" fill="#22C55E" stroke={THEME.ink} strokeWidth="4" />
            <text x={200 * trackGrow + 22} y="47" fontFamily={THEME.font} fontWeight="900" fontSize="26" fill="#15803D">
              SEDIKIT BERHASIL
            </text>

            {/* Long Red Group: Mayoritas Sering Gagal */}
            <rect x="0" y="120" width={740 * trackGrow} height="96" rx="16" fill="#EF4444" stroke={THEME.ink} strokeWidth="4.5" />
            <text x="26" y="178" fontFamily={THEME.font} fontWeight="900" fontSize="29" fill="#FFFFFF">
              MAYORITAS SERING GAGAL ADAPTASI
            </text>
          </g>

          {/* Visual Rhino Silhouette Stepping into Foreign Barrier */}
          <path d="M 140 830 L 820 830" stroke={THEME.accent.danger} strokeWidth="8" strokeDasharray="14 10" />
          <g transform="translate(845, 830)">
            <circle cx="0" cy="0" r="44" fill="#FEE2E2" stroke={THEME.accent.danger} strokeWidth="5" />
            <line x1="-18" y1="-18" x2="18" y2="18" stroke={THEME.accent.danger} strokeWidth="10" strokeLinecap="round" />
            <line x1="18" y1="-18" x2="-18" y2="18" stroke={THEME.accent.danger} strokeWidth="10" strokeLinecap="round" />
          </g>
        </svg>
        <SoilCrossSection frame={frame} dryMix={1} />
      </div>
    );
  }

  // Shot 30 [2334, 2442): Macro Rhino Sniffing Unfamiliar Dry Thorny Shrub
  if (shotId === 30) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Dry Acacia Background */}
          <path d="M 0 740 Q 340 660 680 730 T 1080 700 L 1080 980 L 0 980 Z" fill="#FDE68A" opacity="0.55" />

          {/* Large Close-Up Thorny Unfamiliar Scrub */}
          <g transform="translate(260, 980)">
            <path d="M 0 0 Q -30 -140 -75 -220 M 0 0 Q 25 -150 65 -240 M 0 0 L 0 -190" stroke="#78350F" strokeWidth="12" strokeLinecap="round" fill="none" />
            {/* Sharp Spikes */}
            {[-120, -165, -205].map((sy, idx) => (
              <g key={idx}>
                <polygon points={`-10,${sy} -42,${sy - 22} -6,${sy - 14}`} fill="#B45309" stroke={THEME.ink} strokeWidth="2.5" />
                <polygon points={`10,${sy - 15} 45,${sy - 32} 14,${sy - 28}`} fill="#B45309" stroke={THEME.ink} strokeWidth="2.5" />
              </g>
            ))}
          </g>

          <CalloutLeader
            ax={320}
            ay={820}
            bx={270}
            by={420}
            lx={270}
            ly={420}
            label="POLA MAKAN TERGANGGU"
            sublabel="PAKAN HUTAN TIDAK TERSEDIA"
            accent={THEME.accent.danger}
            progress={progress}
            align="center"
            pillWidth={380}
          />
        </svg>

        <div style={{ position: "absolute", top: 530, left: 390, zIndex: 20 }}>
          <RhinoHeadCloseup frame={frame} scale={0.98} pose="sniff" />
        </div>
        <SoilCrossSection frame={frame} parallaxX={parallaxX} dryMix={1} />
      </div>
    );
  }

  // Shot 31 [2442, 2520): Solitary Rhino & Fading Calf Outline
  if (shotId === 31) {
    const fadeOut = interpolate(progress, [0, 1], [0.75, 0.22]);
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          <g opacity={fadeOut} stroke={THEME.accent.danger} strokeWidth="5" strokeDasharray="12 10" fill="none">
            <rect x="615" y="750" width="240" height="175" rx="35" />
            <line x1="650" y1="775" x2="820" y2="900" />
            <line x1="820" y1="775" x2="650" y2="900" />
          </g>
          <CalloutLeader
            ax={735}
            ay={740}
            bx={540}
            by={420}
            lx={540}
            ly={420}
            label="GAGAL BERKEMBANG BIAK"
            sublabel="POPULASI SULIT BERTAMBAH"
            accent={THEME.accent.danger}
            progress={progress}
            align="center"
            pillWidth={380}
          />
        </svg>
        <div style={{ position: "absolute", bottom: 912, left: 165, zIndex: 20 }}>
          <OrganicRhino frame={frame} scale={0.78} walkSpeed={0} pose="rest" flipX />
        </div>
        <SoilCrossSection frame={frame} dryMix={1} />
      </div>
    );
  }

  // Shot 29 [2240, 2334): Dry Unfamiliar Savanna Wide Cross-Section
  const splitX = Math.round(1080 * interpolate(progress, [0, 1], [0.45, 0.25]));
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <svg viewBox="0 0 1080 1000" style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1000 }}>
        <g transform={`translate(${parallaxX * 0.4}, 0)`}>
          {[95, 220].map((tx, i) => (
            <g key={i} transform={`translate(${tx}, 980)`}>
              <path d="M -10 0 L -8 -210 L 8 -210 L 12 0 Z" fill="#78350F" />
              <ellipse cx="0" cy="-240" rx="72" ry="78" fill="#16A34A" stroke={THEME.ink} strokeWidth="3.5" />
            </g>
          ))}
          {[730, 945].map((tx, i) => (
            <g key={i} transform={`translate(${tx}, 980)`}>
              <path d="M -8 0 Q 10 -80 -6 -160 L 8 -160 Q 22 -80 10 0 Z" fill="#78350F" />
              <ellipse cx="0" cy="-175" rx="86" ry="30" fill="#CA8A04" stroke={THEME.ink} strokeWidth="3.5" />
            </g>
          ))}
        </g>
        <CalloutLeader
          ax={540}
          ay={720}
          bx={540}
          by={415}
          lx={540}
          ly={415}
          label="SUSAH ADAPTASI DI HABITAT ASING"
          sublabel="IKLIM & VEGETASI BERBEDA"
          accent={THEME.accent.amber}
          progress={progress}
          align="center"
          pillWidth={520}
        />
      </svg>

      <SoilCrossSection frame={frame} parallaxX={parallaxX} dryMix={0} />
      <div style={{ position: "absolute", left: splitX, right: 0, bottom: 0, height: 940, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -splitX, bottom: 0, width: 1080, height: 940 }}>
          <SoilCrossSection frame={frame} parallaxX={parallaxX} dryMix={1} />
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 912, left: "50%", transform: "translateX(-270px)", zIndex: 20 }}>
        <OrganicRhino frame={frame} scale={0.82} walkSpeed={0.5} pose="walk" flipX />
      </div>
    </div>
  );
};
