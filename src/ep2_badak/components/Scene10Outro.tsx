import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { OrganicRhino, RhinoHeadCloseup } from "./OrganicRhino";
import { SoilCrossSection } from "./SoilCrossSection";

interface Scene10OutroProps {
  frame: number;
  progress: number;
  shotId: number;
}

/**
 * Scene 10: Dynamic Full-Stage Visual Comparison + Comment CTA [3372, 3625)
 * NO static 2-card grid changing border! Each beat takes over the visual stage:
 * - Shot 41 [3372, 3414): Question Fork Hook ("Menurutmu gimana?")
 * - Shot 42 [3414, 3498): Full-Stage Spotlight OPSI A: Animated Java Relocation Trajectory
 * - Shot 43 [3498, 3625): Full-Stage Morph OPSI B: Sunlit Ujung Kulon Family + Bouncy CTA!
 */
export const Scene10Outro: React.FC<Scene10OutroProps> = ({ frame, progress, shotId }) => {
  const dashFlow = -frame * 5.5;
  const ctaBounce = Math.sin(frame * 0.2) * 5;

  // Shot 41 [3372, 3414): Question Fork Hook
  if (shotId === 41) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Diverging Path Arrows above Rhino */}
          <path d="M 540 530 Q 430 430 280 410" stroke="#EA580C" strokeWidth="12" strokeLinecap="round" fill="none" />
          <polygon points="255,406 298,388 292,432" fill="#EA580C" />
          <path d="M 540 530 Q 650 430 800 410" stroke="#16A34A" strokeWidth="12" strokeLinecap="round" fill="none" />
          <polygon points="825,406 788,432 782,388" fill="#16A34A" />

          <g transform="translate(540, 365)">
            <rect x="-210" y="-34" width="420" height="68" rx="18" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="4.5" />
            <text x="0" y="10" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="30" fill={THEME.ink}>
              MENURUTMU GIMANA?
            </text>
          </g>
        </svg>
        <div style={{ position: "absolute", top: 530, left: 260, zIndex: 20 }}>
          <RhinoHeadCloseup frame={frame} scale={0.95} pose="curious" />
        </div>
        <SoilCrossSection frame={frame} />
      </div>
    );
  }

  // Shot 42 [3414, 3498): Full-Stage Spotlight OPSI A (Relokasi Pulau Jawa)
  if (shotId === 42) {
    const enter = interpolate(progress, [0, 0.35], [0.92, 1], { extrapolateRight: "clamp" });
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #CBEAFF 0%, #7DD3FC 100%)" }} />
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Header Pill */}
          <g transform="translate(540, 355)">
            <rect x="-335" y="-42" width="670" height="84" rx="22" fill="#FEF3C7" stroke="#EA580C" strokeWidth="5.5" />
            <text x="0" y="10" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="34" fill="#B45309">
              OPSI A: PINDAH DEMI CADANGAN
            </text>
          </g>

          {/* Full-Stage Accurate Java & Madura Map Relocation Visual */}
          <g transform={`translate(-140, 390) scale(${0.96 * enter})`}>
            <path
              d={`M 140 398 Q 116 408 118 390 Q 138 370 162 362 Q 186 332 195 296 Q 235 288 265 306 Q 302 326 344 306 Q 395 292 436 296 Q 472 328 538 338 Q 605 344 652 356 Q 686 312 728 286 Q 766 308 776 348 Q 842 352 908 358 Q 958 374 996 404 Q 1055 412 1125 398 Q 1192 406 1236 426 Q 1252 468 1242 496 Q 1210 504 1188 486 Q 1110 484 1035 478 Q 955 486 875 476 Q 795 484 720 468 Q 645 458 565 448 Q 495 446 435 426 Q 375 428 315 418 Q 258 438 205 418 Q 168 416 140 398 Z`}
              fill="#22C55E"
              stroke={THEME.ink}
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M 978 332 Q 1025 314 1098 320 Q 1152 326 1168 344 Q 1140 356 1075 352 Q 1005 354 978 332 Z"
              fill="#22C55E"
              stroke={THEME.ink}
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <path
              d="M 148 395 Q 430 225 715 260 Q 985 295 1218 470"
              stroke="#EA580C"
              strokeWidth="10"
              strokeDasharray="20 12"
              strokeDashoffset={dashFlow}
              fill="none"
            />
            <circle cx="148" cy="395" r="14" fill="#0284C7" stroke="#FFFFFF" strokeWidth="4" />
            <circle cx="1218" cy="470" r="14" fill="#DC2626" stroke="#FFFFFF" strokeWidth="4" />
          </g>

          {/* Compact Opsi B Teaser Pill on Bottom Right */}
          <g transform="translate(810, 1020)">
            <rect x="-210" y="-32" width="420" height="64" rx="16" fill="#DCFCE7" stroke="#16A34A" strokeWidth="4" />
            <text x="0" y="9" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="22" fill="#15803D">
              ATAU OPSI B: PERKUAT ASLI?
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // Shot 43 [3498, 3625): Full-Stage Morph OPSI B + Bouncy CTA "TULIS DI KOMENTAR!"
  const showCta = frame >= 3555;
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <SoilCrossSection frame={frame} />

      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920, zIndex: 15 }}>
        {/* Sunbeams over Restored Ujung Kulon */}
        <polygon points="410,160 670,160 940,980 140,980" fill="#FEF08A" opacity="0.48" />

        {/* Header Pill */}
        <g transform="translate(540, 355)">
          <rect x="-345" y="-42" width="690" height="84" rx="22" fill="#DCFCE7" stroke="#16A34A" strokeWidth="5.5" />
          <text x="0" y="10" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="34" fill="#14532D">
            OPSI B: PERKUAT UJUNG KULON
          </text>
        </g>

        {/* Thriving Jungle Trees */}
        {[95, 985].map((tx, i) => (
          <g key={i} transform={`translate(${tx}, 980)`}>
            <rect x="-12" y="-220" width="24" height="220" fill="#78350F" />
            <ellipse cx="0" cy="-245" rx="78" ry="86" fill="#22C55E" stroke={THEME.ink} strokeWidth="4" />
          </g>
        ))}

        {/* Prominent Bouncy CTA Banner cleanly ABOVE Subtitle Safe Zone (zIndex 30!) */}
        <g transform={`translate(540, ${1082 + (showCta ? ctaBounce : 0)})`}>
          <rect x="-270" y="-44" width="540" height="88" rx="24" fill="#FDE047" stroke={THEME.ink} strokeWidth="5.5" />
          <text x="0" y="13" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="40" fill={THEME.ink}>
            TULIS DI KOMENTAR!
          </text>
        </g>
      </svg>

      {/* Mother & Baby Rhino Walking Happily Across Meadow */}
      <div style={{ position: "absolute", bottom: 912, left: 110, zIndex: 20 }}>
        <OrganicRhino frame={frame} scale={0.76} walkSpeed={0.9} pose="walk" flipX />
      </div>
      <div style={{ position: "absolute", bottom: 912, left: 615, zIndex: 21 }}>
        <OrganicRhino frame={frame + 12} scale={0.46} walkSpeed={1.1} isBaby pose="walk" flipX />
      </div>
    </div>
  );
};
