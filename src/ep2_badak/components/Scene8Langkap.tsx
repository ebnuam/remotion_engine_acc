import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { OrganicRhino } from "./OrganicRhino";
import { CalloutLeader } from "./CalloutLeader";
import { SoilCrossSection } from "./SoilCrossSection";

interface Scene8LangkapProps {
  frame: number;
  progress: number;
  shotId: number;
  parallaxX: number;
}

/**
 * Scene 8: Invasive Langkap & Buffer Zone [2520, 2928) — 4 Distinct Framings!
 * - Shot 32: Native Ujung Kulon Overview with Emerging Habitat Warning Pins
 * - Shot 33: Upward Time-Lapse Growth of Invasive Langkap Palms
 * - Shot 34: Canopy Sun-Blockage + Withering Food Plants + Root Competition Cross-Section
 * - Shot 35: Forest Edge / Buffer Zone Aerial-Angle Encroachment View
 */
export const Scene8Langkap: React.FC<Scene8LangkapProps> = ({
  frame,
  progress,
  shotId,
  parallaxX,
}) => {
  const frondSway = Math.sin(frame * 0.05) * 3;

  // Shot 32 [2520, 2605): Native Ujung Kulon Home Overview
  if (shotId === 32) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {[140, 380, 690, 930].map((tx, i) => (
            <g key={i} transform={`translate(${tx + parallaxX * 0.4}, 980)`}>
              <path d="M -12 0 L -8 -230 L 8 -230 L 14 0 Z" fill="#78350F" />
              <ellipse cx="0" cy="-265" rx="85" ry="90" fill="#16A34A" stroke={THEME.ink} strokeWidth="3.5" />
            </g>
          ))}
          <CalloutLeader
            ax={540}
            ay={730}
            bx={540}
            by={410}
            lx={540}
            ly={410}
            label="RUMAH ASLI MASIH PUNYA PR BESAR"
            sublabel="TANTANGAN DI TN UJUNG KULON"
            accent={THEME.accent.success}
            progress={progress}
            align="center"
            pillWidth={520}
          />
        </svg>
        <div style={{ position: "absolute", bottom: 912, left: "50%", transform: "translateX(-265px)", zIndex: 20 }}>
          <OrganicRhino frame={frame} scale={0.82} walkSpeed={0.65} pose="walk" />
        </div>
        <SoilCrossSection frame={frame} parallaxX={parallaxX} />
      </div>
    );
  }

  // Shot 33 [2605, 2694): Time-Lapse Upward Sprouting of Invasive Langkap Palms
  if (shotId === 33) {
    const growH = interpolate(progress, [0, 1], [160, 440]);
    const frondW = interpolate(progress, [0.2, 1], [55, 170], { extrapolateLeft: "clamp" });
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {[180, 420, 660, 900].map((lx, idx) => (
            <g key={idx} transform={`translate(${lx}, 980)`}>
              <path d={`M -14 0 L -10 ${-growH} L 10 ${-growH} L 16 0 Z`} fill="#4D7C0F" stroke={THEME.ink} strokeWidth="3.5" />
              <g transform={`translate(0, ${-growH}) rotate(${frondSway * (idx % 2 === 0 ? 1 : -1)})`}>
                <path d={`M 0 0 Q ${-frondW * 0.8} -65 ${-frondW} 28 Q ${-frondW * 0.45} 14 0 26 Z`} fill="#16A34A" stroke={THEME.ink} strokeWidth="4" />
                <path d={`M 0 0 Q ${frondW * 0.8} -65 ${frondW} 28 Q ${frondW * 0.45} 14 0 26 Z`} fill="#15803D" stroke={THEME.ink} strokeWidth="4" />
                <ellipse cx="0" cy="-20" rx={frondW * 0.72} ry="38" fill="#22C55E" stroke={THEME.ink} strokeWidth="4" />
              </g>
            </g>
          ))}
          <CalloutLeader
            ax={540}
            ay={980 - growH}
            bx={540}
            by={380}
            lx={540}
            ly={380}
            label="INVASI TANAMAN LANGKAP"
            sublabel="TUMBUH CEPAT MENUTUPI HUTAN"
            accent={THEME.accent.warning}
            progress={progress}
            align="center"
            pillWidth={410}
          />
        </svg>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 35 [2826, 2928): Forest Edge / Buffer Zone Encroachment
  if (shotId === 35) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Left: Protected Ujung Kulon Park */}
          {[140, 340].map((tx, i) => (
            <g key={i} transform={`translate(${tx}, 980)`}>
              <rect x="-12" y="-230" width="24" height="230" fill="#78350F" />
              <ellipse cx="0" cy="-260" rx="85" ry="90" fill="#16A34A" stroke={THEME.ink} strokeWidth="4" />
            </g>
          ))}
          {/* Right: Buffer Zone Boundary & Encroachment Pressure */}
          <rect x="640" y="540" width="440" height="440" fill="#FEF3C7" opacity="0.78" stroke={THEME.accent.danger} strokeWidth="6" strokeDasharray="16 10" />
          <line x1="640" y1="480" x2="640" y2="980" stroke={THEME.accent.danger} strokeWidth="8" />
          {[630, 740, 850].map((ay, idx) => (
            <g key={idx} transform={`translate(${990 - progress * 45}, ${ay})`}>
              <line x1="0" y1="0" x2="-185" y2="0" stroke={THEME.accent.danger} strokeWidth="16" strokeLinecap="round" />
              <polygon points="-215,0 -165,-26 -165,26" fill={THEME.accent.danger} />
            </g>
          ))}
          <CalloutLeader
            ax={640}
            ay={540}
            bx={540}
            by={385}
            lx={540}
            ly={385}
            label="ANCAMAN KAWASAN PENYANGGA"
            sublabel="KERUSAKAN DI PERBATASAN HUTAN"
            accent={THEME.accent.danger}
            progress={progress}
            align="center"
            pillWidth={440}
          />
        </svg>
        <div style={{ position: "absolute", bottom: 912, left: 165, zIndex: 20 }}>
          <OrganicRhino frame={frame} scale={0.76} walkSpeed={0.3} pose="alert" />
        </div>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 34 [2694, 2826): Canopy Sun-Blockage + Withering Food Plants + Root Competition
  const shrink = interpolate(progress, [0, 1], [0.92, 0.46]);
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <svg viewBox="0 0 1080 1050" style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1050, overflow: "visible" }}>
        {[175, 415, 655, 895].map((rx, idx) => (
          <g key={idx}>
            <line x1={rx} y1="300" x2={rx} y2="465" stroke="#FACC15" strokeWidth="16" strokeLinecap="round" strokeDasharray="22 12" />
            <line x1={rx - 36} y1="474" x2={rx + 36} y2="474" stroke={THEME.accent.danger} strokeWidth="9" strokeLinecap="round" />
          </g>
        ))}

        <rect x="0" y="520" width="1080" height="460" fill="#15803D" opacity="0.16" />

        {[120, 340, 560, 780, 960].map((lx, idx) => (
          <g key={idx} transform={`translate(${lx + parallaxX * 0.35}, 980)`}>
            <path d="M -14 0 Q -8 -220 -12 -440 L 12 -440 Q 8 -220 16 0 Z" fill="#4D7C0F" stroke={THEME.ink} strokeWidth="3.5" />
            <g transform={`translate(0, -445) rotate(${frondSway * (idx % 2 === 0 ? 1 : -1)})`}>
              <path d="M 0 0 Q -145 -75 -175 30 Q -80 15 0 28 Z" fill="#16A34A" stroke={THEME.ink} strokeWidth="4" />
              <path d="M 0 0 Q 145 -75 175 30 Q 80 15 0 28 Z" fill="#15803D" stroke={THEME.ink} strokeWidth="4" />
              <ellipse cx="0" cy="-22" rx="128" ry="44" fill="#22C55E" stroke={THEME.ink} strokeWidth="4" />
            </g>
          </g>
        ))}

        {[190, 660, 815].map((px, i) => (
          <g key={i} transform={`translate(${px}, 980) scale(${shrink})`}>
            <path d="M 0 0 Q -24 -48 -46 -68" stroke="#CA8A04" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 0 0 Q 24 -52 44 -72" stroke="#D97706" strokeWidth="7" strokeLinecap="round" fill="none" />
            <ellipse cx="-42" cy="-70" rx="18" ry="11" fill="#EAB308" stroke={THEME.ink} strokeWidth="2.5" />
            <ellipse cx="42" cy="-74" rx="18" ry="11" fill="#CA8A04" stroke={THEME.ink} strokeWidth="2.5" />
          </g>
        ))}

        <CalloutLeader
          ax={560}
          ay={475}
          bx={540}
          by={365}
          lx={540}
          ly={365}
          label="CAHAYA TERBLOKIR — PAKAN MATI"
          sublabel="TUMBUHAN BAWAH KEKURANGAN SINAR"
          accent={THEME.accent.danger}
          progress={progress}
          align="center"
          pillWidth={520}
        />
      </svg>

      <div style={{ position: "absolute", bottom: 912, left: 165, zIndex: 20 }}>
        <OrganicRhino frame={frame} scale={0.78} walkSpeed={0.35} pose="graze" />
      </div>
      <SoilCrossSection frame={frame} parallaxX={parallaxX} />
    </div>
  );
};
