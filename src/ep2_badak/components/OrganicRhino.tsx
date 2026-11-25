import React from "react";
import { THEME } from "../theme";

export type RhinoPose = "walk" | "graze" | "alert" | "rest";

interface OrganicRhinoProps {
  frame: number;
  scale?: number;
  walkSpeed?: number;
  pose?: RhinoPose;
  isBaby?: boolean;
  isMemorial?: boolean;
  flipX?: boolean;
}

/**
 * Fluid, Organic Javan Rhino (Badak Jawa Cula Satu)
 * - Smooth unified curved silhouette with multi-stop volume gradients (NO boxy tin-can cuts)
 * - 2-segment articulated legs (thigh/shoulder + knee/shin flexion) in 4-beat quadruped walk
 * - Natural breathing, blinking, ear flicks, tail swing, and head tilt per pose
 */
export const OrganicRhino: React.FC<OrganicRhinoProps> = ({
  frame,
  scale = 1,
  walkSpeed = 1,
  pose = "walk",
  isBaby = false,
  isMemorial = false,
  flipX = false,
}) => {
  const isWalking = pose === "walk" && walkSpeed > 0.05;
  const phase = frame * 0.24 * (isWalking ? walkSpeed : 0);

  const fl = isWalking ? Math.sin(phase) : 0;
  const fr = isWalking ? Math.sin(phase + Math.PI) : 0;
  const bl = isWalking ? Math.sin(phase + Math.PI * 1.5) : 0;
  const br = isWalking ? Math.sin(phase + Math.PI * 0.5) : 0;

  const legTransforms = (swing: number, isFront: boolean) => {
    const upper = swing * (isFront ? 14 : 12);
    const knee = Math.max(0, isFront ? -swing : swing) * 20;
    return { upper, knee };
  };

  const legFL = legTransforms(fl, true);
  const legFR = legTransforms(fr, true);
  const legBL = legTransforms(bl, false);
  const legBR = legTransforms(br, false);

  const bodyBob = isWalking ? Math.abs(Math.sin(phase)) * 4.5 : 0;
  const bodyPitch = isWalking ? Math.sin(phase) * 1.2 : 0;
  const breathScaleY = 1 + Math.sin(frame * 0.08) * 0.016;

  let headRotate = Math.sin(frame * 0.06) * 2.5;
  let headY = Math.sin(phase + 0.5) * (isWalking ? 3 : 1.5);
  if (pose === "graze") {
    headRotate = -20 + Math.sin(frame * 0.16) * 3.5;
    headY = 28;
  } else if (pose === "alert") {
    headRotate = 10 + Math.sin(frame * 0.2) * 3;
    headY = -8;
  } else if (pose === "rest") {
    headRotate = -6 + Math.sin(frame * 0.05) * 1.5;
    headY = 10;
  }

  const earFlick = Math.sin(frame * 0.16) * 6 + Math.sin(frame * 0.41) * 2.5;
  const tailSwing = Math.sin(frame * 0.11) * 9;
  const isBlinking = frame % 115 >= 110;

  const skinHi = isMemorial ? "#CBD5E1" : THEME.rhino.highlight;
  const skinMid = isMemorial ? "#94A3B8" : THEME.rhino.base;
  const skinDark = isMemorial ? "#64748B" : THEME.rhino.midShadow;
  const skinDeep = isMemorial ? "#475569" : THEME.rhino.deepShadow;

  const babyScale = isBaby ? 0.56 : 1;
  const babyOffset = isBaby ? "translate(140, 162)" : "";
  const restOffset = pose === "rest" ? "translate(0, 18)" : "";
  const gradId = `${isMemorial ? "mem" : isBaby ? "baby" : "adult"}_${scale.toFixed(2).replace(".", "_")}`;

  return (
    <svg
      width={640 * scale}
      height={400 * scale}
      viewBox="0 0 640 400"
      fill="none"
      style={{
        overflow: "visible",
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    >
      <defs>
        <linearGradient id={`bodyGrad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skinHi} />
          <stop offset="45%" stopColor={skinMid} />
          <stop offset="100%" stopColor={skinDark} />
        </linearGradient>
        <linearGradient id={`hornGrad-${gradId}`} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0%" stopColor={isMemorial ? "#CBD5E1" : THEME.rhino.hornBase} />
          <stop offset="100%" stopColor={isMemorial ? "#F8FAFC" : THEME.rhino.hornTip} />
        </linearGradient>
      </defs>

      <g transform={`${babyOffset} scale(${babyScale})`}>
        <ellipse cx="322" cy="368" rx={225 - bodyBob * 1.4} ry={16} fill="rgba(15, 23, 42, 0.2)" />

        <g transform={`${restOffset} translate(0, ${-bodyBob}) rotate(${bodyPitch}, 320, 230)`}>
          {/* Far Back Leg */}
          <g transform={`rotate(${legBR.upper}, 422, 238)`}>
            <path d="M 402 228 Q 396 266 408 296 L 444 294 Q 448 260 438 228 Z" fill={skinDark} stroke={THEME.ink} strokeWidth="4" strokeLinejoin="round" />
            <g transform={`rotate(${legBR.knee}, 424, 294)`}>
              <path d="M 408 288 Q 412 325 416 352 Q 418 358 424 358 L 446 358 Q 450 352 448 338 Q 446 315 442 288 Z" fill={skinDark} stroke={THEME.ink} strokeWidth="4" strokeLinejoin="round" />
              <ellipse cx="426" cy="356" rx="4.5" ry="3" fill="#E2E8F0" stroke={THEME.ink} strokeWidth="1.6" />
              <ellipse cx="437" cy="356" rx="4.5" ry="3" fill="#E2E8F0" stroke={THEME.ink} strokeWidth="1.6" />
            </g>
          </g>

          {/* Far Front Leg */}
          <g transform={`rotate(${legFR.upper}, 205, 240)`}>
            <path d="M 186 228 Q 182 266 190 296 L 224 296 Q 228 262 218 228 Z" fill={skinDark} stroke={THEME.ink} strokeWidth="4" strokeLinejoin="round" />
            <g transform={`rotate(${legFR.knee}, 207, 294)`}>
              <path d="M 190 288 Q 192 325 194 352 Q 196 358 202 358 L 222 358 Q 226 352 224 338 Q 224 315 222 288 Z" fill={skinDark} stroke={THEME.ink} strokeWidth="4" strokeLinejoin="round" />
              <ellipse cx="203" cy="356" rx="4.5" ry="3" fill="#E2E8F0" stroke={THEME.ink} strokeWidth="1.6" />
              <ellipse cx="214" cy="356" rx="4.5" ry="3" fill="#E2E8F0" stroke={THEME.ink} strokeWidth="1.6" />
            </g>
          </g>

          {/* Tail */}
          <g transform={`rotate(${tailSwing}, 484, 204)`}>
            <path d="M 484 204 Q 514 226 508 266" stroke={THEME.ink} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 505 262 Q 515 276 504 282 Q 496 274 505 262 Z" fill={skinDeep} stroke={THEME.ink} strokeWidth="2.5" />
          </g>

          {/* Unified Organic Torso */}
          <g transform={`translate(320, 222) scale(1, ${breathScaleY}) translate(-320, -222)`}>
            <path
              d="M 155 215 Q 160 158 218 152 Q 265 148 310 156 Q 365 148 430 158 Q 488 168 494 218 Q 496 266 458 282 Q 412 292 340 288 Q 270 294 202 282 Q 152 268 155 215 Z"
              fill={`url(#bodyGrad-${gradId})`}
              stroke={THEME.ink}
              strokeWidth="4.8"
              strokeLinejoin="round"
            />
            <path d="M 192 268 Q 315 288 455 268 Q 418 288 320 288 Q 230 288 192 268 Z" fill={skinDeep} opacity="0.32" />
            <path d="M 198 164 Q 305 152 435 166 Q 360 172 280 172 Q 225 170 198 164 Z" fill="#FFFFFF" opacity="0.22" />
            <path d="M 248 164 Q 262 212 246 266" stroke={skinDeep} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M 382 164 Q 368 214 382 268" stroke={skinDeep} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
          </g>

          {/* Near Back Leg */}
          <g transform={`rotate(${legBL.upper}, 402, 238)`}>
            <path d="M 378 222 Q 372 264 384 298 L 424 296 Q 430 258 418 220 Z" fill={`url(#bodyGrad-${gradId})`} stroke={THEME.ink} strokeWidth="4.6" strokeLinejoin="round" />
            <g transform={`rotate(${legBL.knee}, 404, 296)`}>
              <path d="M 384 290 Q 388 326 390 356 Q 392 362 398 362 L 424 362 Q 428 354 426 340 Q 424 316 420 290 Z" fill={`url(#bodyGrad-${gradId})`} stroke={THEME.ink} strokeWidth="4.6" strokeLinejoin="round" />
              <ellipse cx="399" cy="360" rx="5" ry="3.2" fill="#F8FAFC" stroke={THEME.ink} strokeWidth="2" />
              <ellipse cx="410" cy="361" rx="5" ry="3.2" fill="#F8FAFC" stroke={THEME.ink} strokeWidth="2" />
              <ellipse cx="420" cy="360" rx="5" ry="3.2" fill="#F8FAFC" stroke={THEME.ink} strokeWidth="2" />
            </g>
          </g>

          {/* Near Front Leg */}
          <g transform={`rotate(${legFL.upper}, 182, 240)`}>
            <path d="M 162 224 Q 158 265 166 298 L 204 298 Q 208 260 198 222 Z" fill={`url(#bodyGrad-${gradId})`} stroke={THEME.ink} strokeWidth="4.6" strokeLinejoin="round" />
            <g transform={`rotate(${legFL.knee}, 185, 296)`}>
              <path d="M 166 290 Q 168 326 170 356 Q 172 362 178 362 L 202 362 Q 206 354 204 340 Q 204 316 202 290 Z" fill={`url(#bodyGrad-${gradId})`} stroke={THEME.ink} strokeWidth="4.6" strokeLinejoin="round" />
              <ellipse cx="179" cy="360" rx="5" ry="3.2" fill="#F8FAFC" stroke={THEME.ink} strokeWidth="2" />
              <ellipse cx="190" cy="361" rx="5" ry="3.2" fill="#F8FAFC" stroke={THEME.ink} strokeWidth="2" />
              <ellipse cx="200" cy="360" rx="5" ry="3.2" fill="#F8FAFC" stroke={THEME.ink} strokeWidth="2" />
            </g>
          </g>

          {/* Neck, Head, Horn, Ears, Eye */}
          <g transform={`translate(0, ${headY}) rotate(${headRotate}, 185, 195)`}>
            <path d="M 192 162 Q 145 152 122 188 Q 134 248 184 252 Z" fill={`url(#bodyGrad-${gradId})`} stroke={THEME.ink} strokeWidth="4.5" strokeLinejoin="round" />
            <g transform={`rotate(${-earFlick * 0.5}, 136, 152)`}>
              <ellipse cx="136" cy="134" rx="11" ry="22" fill={skinDark} stroke={THEME.ink} strokeWidth="4" />
            </g>
            <path
              d="M 150 144 Q 118 142 96 168 Q 74 188 54 198 Q 40 206 46 226 Q 52 240 66 236 Q 80 248 118 246 Q 152 244 166 218 Q 176 184 150 144 Z"
              fill={`url(#bodyGrad-${gradId})`}
              stroke={THEME.ink}
              strokeWidth="4.8"
              strokeLinejoin="round"
            />
            <path d="M 66 234 Q 108 246 150 232 Q 124 222 72 224 Z" fill={skinDeep} opacity="0.35" />
            {!isBaby ? (
              <g>
                <path d="M 64 194 Q 50 142 68 110 Q 78 140 84 188 Q 74 196 64 194 Z" fill={`url(#hornGrad-${gradId})`} stroke={THEME.ink} strokeWidth="4.4" strokeLinejoin="round" />
                <path d="M 68 178 Q 62 146 70 124" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
              </g>
            ) : (
              <path d="M 64 194 Q 60 174 70 164 Q 76 176 78 192 Z" fill={`url(#hornGrad-${gradId})`} stroke={THEME.ink} strokeWidth="4" strokeLinejoin="round" />
            )}
            <g transform={`rotate(${earFlick}, 146, 152)`}>
              <path d="M 138 152 Q 134 114 154 112 Q 166 130 154 156 Z" fill={skinMid} stroke={THEME.ink} strokeWidth="4" strokeLinejoin="round" />
              <path d="M 145 146 Q 144 126 152 124" stroke={skinDeep} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            </g>
            <g transform="translate(114, 184)">
              {isBlinking ? (
                <path d="M -8 0 Q 0 5 8 0" stroke={THEME.ink} strokeWidth="3.8" strokeLinecap="round" />
              ) : (
                <>
                  <circle cx="0" cy="0" r="8.5" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="2.8" />
                  <circle cx="-1" cy="0" r="4.5" fill={THEME.ink} />
                  <circle cx="-2.5" cy="-2" r="1.8" fill="#FFFFFF" />
                </>
              )}
            </g>
            <ellipse cx="62" cy="212" rx="4.5" ry="2.8" transform="rotate(-18, 62, 212)" fill={THEME.ink} />
          </g>
        </g>
      </g>
    </svg>
  );
};

/**
 * Expressive Macro Close-Up of Javan Rhino Head & Shoulders
 * Used in close-up documentary shots (e.g., Shot 3, Shot 6, Shot 7, Shot 30) so shots NEVER repeat full-body wide views!
 */
export const RhinoHeadCloseup: React.FC<{
  frame: number;
  scale?: number;
  pose?: "curious" | "alert" | "sniff";
  flipX?: boolean;
}> = ({ frame, scale = 1, pose = "curious", flipX = false }) => {
  const nod =
    pose === "curious"
      ? Math.sin(frame * 0.14) * 5
      : pose === "sniff"
      ? Math.sin(frame * 0.22) * 4 - 12
      : Math.sin(frame * 0.2) * 3 + 6;
  const earFlick = Math.sin(frame * 0.18) * 7;
  const isBlinking = frame % 100 >= 95;
  const lipTwitch = Math.sin(frame * 0.2) * 3;

  return (
    <svg
      width={560 * scale}
      height={460 * scale}
      viewBox="0 0 560 460"
      fill="none"
      style={{
        overflow: "visible",
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    >
      <defs>
        <linearGradient id="headCloseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={THEME.rhino.highlight} />
          <stop offset="50%" stopColor={THEME.rhino.base} />
          <stop offset="100%" stopColor={THEME.rhino.midShadow} />
        </linearGradient>
        <linearGradient id="hornCloseGrad" x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0%" stopColor={THEME.rhino.hornBase} />
          <stop offset="100%" stopColor={THEME.rhino.hornTip} />
        </linearGradient>
      </defs>

      {/* Massive Shoulder Base entering from right/bottom */}
      <path
        d="M 270 460 Q 250 280 315 190 Q 405 145 560 175 L 560 460 Z"
        fill="url(#headCloseGrad)"
        stroke={THEME.ink}
        strokeWidth="6"
      />
      <path d="M 335 215 Q 375 315 350 450" stroke={THEME.rhino.deepShadow} strokeWidth="6" strokeLinecap="round" opacity="0.45" />

      {/* Articulated Neck & Detailed Head */}
      <g transform={`rotate(${nod}, 355, 290)`}>
        {/* Back Ear */}
        <g transform={`rotate(${-earFlick * 0.5}, 255, 130)`}>
          <ellipse cx="255" cy="105" rx="22" ry="44" fill={THEME.rhino.midShadow} stroke={THEME.ink} strokeWidth="5.5" />
        </g>

        {/* Skull & Prehensile Lip */}
        <path
          d="M 340 165 Q 275 118 215 135 Q 158 158 122 208 Q 84 242 54 256 Q 32 270 44 304 Q 58 326 88 318 Q 112 346 185 344 Q 268 342 328 292 Q 372 240 340 165 Z"
          fill="url(#headCloseGrad)"
          stroke={THEME.ink}
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Lip wiggle */}
        <path
          d={`M 48 286 Q 74 ${304 + lipTwitch} 110 296`}
          stroke={THEME.ink}
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Detailed Single Nasal Horn (Cula Satu) */}
        <path
          d="M 76 248 Q 50 156 84 96 Q 104 152 118 238 Q 98 252 76 248 Z"
          fill="url(#hornCloseGrad)"
          stroke={THEME.ink}
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        <path d="M 84 218 Q 74 160 88 122" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.65" />

        {/* Front Ear */}
        <g transform={`rotate(${earFlick}, 276, 148)`}>
          <path d="M 262 152 Q 254 84 294 80 Q 316 112 292 160 Z" fill={THEME.rhino.base} stroke={THEME.ink} strokeWidth="5.5" strokeLinejoin="round" />
          <path d="M 276 142 Q 274 108 290 102" stroke={THEME.rhino.deepShadow} strokeWidth="4.5" strokeLinecap="round" opacity="0.55" />
        </g>

        {/* Expressive Eye */}
        <g transform="translate(212, 212)">
          {isBlinking ? (
            <path d="M -16 0 Q 0 10 16 0" stroke={THEME.ink} strokeWidth="5" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="0" cy="0" r="16" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="4" />
              <circle cx="-2" cy="0" r="8.5" fill={THEME.ink} />
              <circle cx="-5" cy="-4" r="3.2" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* Nostril */}
        <ellipse cx="76" cy="278" rx="9" ry="5.5" transform="rotate(-18, 76, 278)" fill={THEME.ink} />
      </g>
    </svg>
  );
};
