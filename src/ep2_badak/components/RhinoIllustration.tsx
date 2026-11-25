import React from "react";
import { THEME } from "../theme";

interface RhinoIllustrationProps {
  frame: number;
  /** Scale factor (1 = default ~540px wide viewBox) */
  scale?: number;
  /** Walking speed multiplier */
  walkSpeed?: number;
  isBaby?: boolean;
  isMemorial?: boolean;
  /** Flip horizontally */
  flipX?: boolean;
}

/**
 * High-quality organic Javan Rhino (Badak Jawa Cula Satu) SVG Illustration
 * Features:
 * - Iconic armor plate segments (Javan rhino trademark)
 * - Walking leg animation with alternating front/back pairs
 * - Head nodding, ear wiggling, breathing chest rise
 * - Single nasal horn (cula satu)
 * - Toenails, dermal fold lines, eye highlight
 */
export const RhinoIllustration: React.FC<RhinoIllustrationProps> = ({
  frame,
  scale = 1,
  walkSpeed = 1,
  isBaby = false,
  isMemorial = false,
  flipX = false,
}) => {
  // Animation values
  const breath = Math.sin(frame * 0.08) * 3;
  const headNod = Math.sin(frame * 0.05) * 3;
  const earWiggle = Math.sin(frame * 0.12) * 5;
  const walkPhase = frame * 0.22 * walkSpeed;

  // Leg swing angles
  const frontLeftAngle = Math.sin(walkPhase) * 12;
  const frontRightAngle = Math.sin(walkPhase + Math.PI) * 12;
  const backLeftAngle = Math.sin(walkPhase + Math.PI * 0.5) * 10;
  const backRightAngle = Math.sin(walkPhase + Math.PI * 1.5) * 10;

  // Body bob (slight vertical oscillation while walking)
  const bodyBob = Math.abs(Math.sin(walkPhase)) * 2.5;

  const baseSkin = isMemorial ? "#94A3B8" : THEME.rhino.base;
  const shadeSkin = isMemorial ? "#64748B" : THEME.rhino.shade;
  const lightSkin = isMemorial ? "#CBD5E1" : THEME.rhino.light;
  const hornColor = isMemorial ? "#E2E8F0" : THEME.rhino.horn;

  const babyScale = isBaby ? 0.55 : 1;
  // Align baby hooves (368 * 0.55 = 202.4) to adult ground line (368): 368 - 202.4 = 165.6
  const babyTranslate = isBaby ? "translate(145, 165)" : "";

  const viewW = 640;
  const viewH = 400;

  return (
    <svg
      width={viewW * scale}
      height={viewH * scale}
      viewBox={`0 0 ${viewW} ${viewH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        overflow: "visible",
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    >
      <g
        transform={`${babyTranslate} scale(${babyScale}) translate(0, ${bodyBob})`}
      >
        {/* Ground Shadow */}
        <ellipse
          cx="320"
          cy="368"
          rx={240}
          ry={18}
          fill="rgba(15, 23, 42, 0.18)"
        />

        {/* ===== BACK LEGS (behind body, slightly darker) ===== */}
        {/* Back Right Leg */}
        <g
          transform={`rotate(${backRightAngle}, 415, 240)`}
          stroke="#0F172A"
          strokeWidth="4.5"
          strokeLinejoin="round"
          fill={shadeSkin}
        >
          <path d="M396 238 Q400 285 412 335 Q414 352 420 356 L446 356 Q450 350 446 334 Q444 285 434 238 Z" />
          <ellipse cx="422" cy="354" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <ellipse cx="432" cy="355" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <ellipse cx="442" cy="354" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
        </g>

        {/* Front Right Leg */}
        <g
          transform={`rotate(${frontRightAngle}, 195, 240)`}
          stroke="#0F172A"
          strokeWidth="4.5"
          strokeLinejoin="round"
          fill={shadeSkin}
        >
          <path d="M178 238 Q182 288 188 335 Q189 352 194 356 L220 356 Q224 350 220 334 Q218 285 212 238 Z" />
          <ellipse cx="196" cy="354" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <ellipse cx="206" cy="355" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <ellipse cx="216" cy="354" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
        </g>

        {/* ===== TAIL ===== */}
        <path
          d="M478 208 Q512 228 505 275 Q494 285 488 272"
          stroke="#0F172A"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="488" cy="273" r="5" fill={shadeSkin} stroke="#0F172A" strokeWidth="2" />

        {/* ===== BODY — 3 ARMOR PLATE SEGMENTS ===== */}
        <g transform={`translate(0, ${breath})`}>
          {/* Rump / Hindquarter Plate */}
          <path
            d="M338 165 Q465 162 485 215 Q492 268 455 282 L348 282 Z"
            fill={baseSkin}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Midsection Saddle Plate (lighter) */}
          <path
            d="M255 162 Q300 156 342 165 L348 282 Q298 289 248 282 Z"
            fill={lightSkin}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Shoulder Shield Plate */}
          <path
            d="M168 168 Q244 156 268 178 L258 282 Q186 284 158 240 Z"
            fill={baseSkin}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Dermal Fold / Armor Seam Lines */}
          <path
            d="M262 168 Q252 222 258 278"
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M348 168 Q338 222 345 278"
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Extra wrinkle folds on rump */}
          <path
            d="M390 185 Q412 220 408 268"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M435 195 Q448 230 442 268"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />

          {/* Belly underline */}
          <path
            d="M168 270 Q260 292 350 285 Q430 285 460 272"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* ===== FRONT LEGS (foreground, slightly brighter) ===== */}
        {/* Front Left Leg */}
        <g
          transform={`rotate(${frontLeftAngle}, 155, 240)`}
          stroke="#0F172A"
          strokeWidth="5"
          strokeLinejoin="round"
          fill={baseSkin}
        >
          <path d="M138 238 Q140 288 148 338 Q149 354 154 358 L182 358 Q186 352 182 336 Q180 288 174 238 Z" />
          <ellipse cx="157" cy="356" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <ellipse cx="167" cy="357" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <ellipse cx="177" cy="356" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
        </g>

        {/* Back Left Leg */}
        <g
          transform={`rotate(${backLeftAngle}, 375, 240)`}
          stroke="#0F172A"
          strokeWidth="5"
          strokeLinejoin="round"
          fill={baseSkin}
        >
          <path d="M358 238 Q360 288 368 338 Q369 354 374 358 L402 358 Q406 352 402 336 Q400 288 392 238 Z" />
          <ellipse cx="377" cy="356" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <ellipse cx="387" cy="357" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <ellipse cx="397" cy="356" rx="4" ry="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
        </g>

        {/* ===== HEAD with nodding animation ===== */}
        <g transform={`translate(0, ${headNod})`}>
          {/* Neck Base */}
          <path
            d="M188 148 Q128 148 108 200 Q136 272 190 252 Z"
            fill={baseSkin}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Head & Prehensile Upper Lip / Snout */}
          <path
            d="M140 138 L68 198 Q46 220 58 242 L100 252 Q142 258 162 232 L188 182 Z"
            fill={baseSkin}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Under-chin shade */}
          <path
            d="M58 242 L100 252 Q132 258 148 242 Q102 236 58 242 Z"
            fill={shadeSkin}
            stroke="#0F172A"
            strokeWidth="3"
          />

          {/* Head armor plate seam (from eye toward neck) */}
          <path
            d="M118 180 Q145 158 182 155"
            stroke="#0F172A"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />

          {/* ===== SINGLE NASAL HORN (Cula Satu) — most iconic feature ===== */}
          <path
            d="M66 198 Q54 128 72 98 Q86 142 90 185 Z"
            fill={hornColor}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Horn highlight */}
          <path
            d="M70 172 Q62 136 70 112"
            stroke={THEME.rhino.hornHighlight}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Eye */}
          <circle cx="116" cy="182" r="8" fill="#0F172A" />
          <circle cx="113" cy="179" r="3" fill="#FFFFFF" />
          <circle cx="115" cy="186" r="1.5" fill="#475569" />

          {/* Nostril */}
          <ellipse cx="66" cy="228" rx="4.5" ry="6" fill="#0F172A" />

          {/* Mouth crease */}
          <path
            d="M70 240 Q95 248 108 242"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Ear with wiggle animation */}
          <g transform={`rotate(${earWiggle}, 146, 134)`}>
            <path
              d="M136 138 Q128 90 148 86 Q158 108 146 138 Z"
              fill={baseSkin}
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Inner ear pink */}
            <path
              d="M140 128 Q136 102 146 96"
              stroke="#F43F5E"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>

        {/* ===== GRASS TUFTS beneath hooves ===== */}
        <g fill="#16A34A" stroke="#0F172A" strokeWidth="2">
          <path d="M118 365 L108 345 L122 350 L128 338 L133 365 Z" />
          <path d="M252 368 L242 348 L257 352 L262 340 L267 368 Z" />
          <path d="M455 366 L445 346 L460 350 L465 338 L470 366 Z" />
        </g>
      </g>
    </svg>
  );
};
