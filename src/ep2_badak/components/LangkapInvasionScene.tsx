import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { RhinoIllustration } from "./RhinoIllustration";

interface LangkapInvasionSceneProps {
  frame: number;
  progress: number;
  shotId: number;
}

/**
 * Scene 8: Bright Daytime Langkap Palm Invasion & Buffer Zone Pressure (1080x1920)
 * - Explicitly BRIGHT daytime sky & sunlit forest (NO dark screen/black silhouette)
 * - Tall Langkap palms crowding canopy -> blocking golden sunbeams at canopy top
 * - Understory food plants shrinking under light sage shade
 * - Shot 34: Buffer zone pressure indicators on the right boundary
 */
export const LangkapInvasionScene: React.FC<LangkapInvasionSceneProps> = ({
  frame,
  progress,
  shotId,
}) => {
  const shrinkScale = interpolate(progress, [0, 1], [0.95, 0.52], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const showBufferZone = shotId === 34;

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
      >
        {/* ================= 1. BRIGHT SUNLIGHT RAYS HIT LANGKAP CANOPY ================= */}
        {/* Placed below the callout banner (Y=405..475) so rays NEVER intersect text */}
        <g opacity="0.9">
          {[180, 410, 650, 890].map((rx, idx) => (
            <g key={idx}>
              <line
                x1={rx}
                y1="406"
                x2={rx}
                y2="465"
                stroke="#FACC15"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="20 12"
              />
              {/* Blocked / Deflected T-bar */}
              <line x1={rx - 38} y1="472" x2={rx + 38} y2="472" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
            </g>
          ))}
        </g>

        {/* Light daytime canopy shade (soft translucent green-slate, NEVER dark) */}
        <rect x="0" y="540" width="1080" height="440" fill="#15803D" opacity="0.14" />

        {/* ================= 2. INVASIVE PALEM LANGKAP TREES ================= */}
        {[120, 320, 520, 720, 920].map((lx, idx) => (
          <g key={idx}>
            {/* Palm Trunk */}
            <rect x={lx - 14} y="530" width="28" height="450" fill="#4D7C0F" stroke="#0F172A" strokeWidth="3.5" />
            {/* Overlapping Dense Fronds Blocking Light */}
            <path
              d={`M ${lx} 540 Q ${lx - 135} 450 ${lx - 165} 555 Q ${lx - 80} 545 ${lx} 565 Z`}
              fill="#16A34A"
              stroke="#0F172A"
              strokeWidth="4"
            />
            <path
              d={`M ${lx} 540 Q ${lx + 135} 450 ${lx + 165} 555 Q ${lx + 80} 545 ${lx} 565 Z`}
              fill="#15803D"
              stroke="#0F172A"
              strokeWidth="4"
            />
            <ellipse
              cx={lx}
              cy="515"
              rx="128"
              ry="48"
              fill="#22C55E"
              stroke="#0F172A"
              strokeWidth="4"
            />
          </g>
        ))}

        {/* ================= 3. SHRINKING UNDERSTORY RHINO FOOD PLANTS ================= */}
        {[180, 620, 790].map((px, idx) => (
          <g key={idx} transform={`translate(${px}, 980) scale(${shrinkScale})`}>
            <path d="M 0 0 Q -26 -50 -48 -68" stroke="#D97706" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 0 0 Q 26 -55 44 -72" stroke="#CA8A04" strokeWidth="7" strokeLinecap="round" fill="none" />
            <ellipse cx="-42" cy="-70" rx="18" ry="10" fill="#EAB308" stroke="#0F172A" strokeWidth="2.5" />
            <ellipse cx="40" cy="-74" rx="18" ry="10" fill="#CA8A04" stroke="#0F172A" strokeWidth="2.5" />
          </g>
        ))}

        {/* ================= 4. BUFFER ZONE PRESSURE (SHOT 34) ================= */}
        {showBufferZone && (
          <g>
            <rect
              x="760"
              y="620"
              width="320"
              height="360"
              fill="#FEF3C7"
              opacity="0.7"
              stroke="#DC2626"
              strokeWidth="5"
              strokeDasharray="14 8"
            />
            {/* Red inward pressure arrows */}
            {[720, 820].map((ay, idx) => (
              <g key={idx} transform={`translate(990, ${ay})`}>
                <line x1="0" y1="0" x2="-130" y2="0" stroke="#DC2626" strokeWidth="14" strokeLinecap="round" />
                <polygon points="-155,0 -115,-22 -115,22" fill="#DC2626" />
              </g>
            ))}
          </g>
        )}

        {/* ================= 5. CROSS-SECTION SOIL & COMPETING ROOTS ================= */}
        <rect x="0" y="1140" width="1080" height="780" fill="#451A03" />
        <rect x="0" y="1020" width="1080" height="125" fill="#854D0E" />
        <rect x="0" y="980" width="1080" height="46" fill="#65A30D" stroke="#0F172A" strokeWidth="4" />

        {/* Underground Langkap Roots */}
        {[120, 320, 520, 720, 920].map((rx, idx) => (
          <g key={idx} stroke="#365314" strokeWidth="6" fill="none" opacity="0.85">
            <path d={`M ${rx} 1015 Q ${rx - 45} 1090 ${rx - 80} 1135`} />
            <path d={`M ${rx} 1015 Q ${rx + 50} 1085 ${rx + 85} 1130`} />
          </g>
        ))}

        {/* ================= 6. CLEAN MOBILE-READABLE CALLOUTS ================= */}
        <g transform="translate(540, 355)">
          <rect x="-285" y="-34" width="570" height="68" rx="16" fill="#FFFDF7" stroke="#DC2626" strokeWidth="4" filter="drop-shadow(0 6px 0 rgba(15,23,42,0.22))" />
          <text x="0" y="10" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="27" fill="#DC2626">
            KANOPI LANGKAP BLOKIR CAHAYA
          </text>
        </g>

        <g transform="translate(320, 1105)">
          <rect x="-245" y="-28" width="490" height="56" rx="14" fill="#FFFDF7" stroke="#D97706" strokeWidth="3.5" />
          <text x="0" y="9" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="24" fill="#B45309">
            PAKAN BAWAH MENYUSUT
          </text>
        </g>

        {showBufferZone && (
          <g transform="translate(840, 1105)">
            <rect x="-185" y="-28" width="370" height="56" rx="14" fill="#FFFDF7" stroke="#DC2626" strokeWidth="3.5" />
            <text x="0" y="9" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="24" fill="#DC2626">
              TEKANAN PENYANGGA
            </text>
          </g>
        )}
      </svg>

      {/* Rhino clearly visible in center-left */}
      <div
        style={{
          position: "absolute",
          bottom: 912,
          left: 160,
          zIndex: 20,
        }}
      >
        <RhinoIllustration frame={frame} scale={0.78} walkSpeed={0.3} />
      </div>
    </div>
  );
};
