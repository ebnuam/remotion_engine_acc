import React from "react";
import { THEME } from "../theme";

interface SkyAndParallaxProps {
  frame: number;
  /** Shift multiplier for 2.5D parallax */
  parallaxX?: number;
  /** Slightly warmer tint for dry savanna scene */
  warmDry?: boolean;
}

/**
 * Shared Bright Daytime 2.5D Sky Backdrop
 * - Glowing morning sun with gentle rotating light beams
 * - Multi-layer drifting puffy clouds
 * - Soft distant curved tropical hills
 */
export const SkyAndParallax: React.FC<SkyAndParallaxProps> = ({
  frame,
  parallaxX = 0,
  warmDry = false,
}) => {
  const cloudDrift1 = ((frame * 0.9) % 1500) - 220;
  const cloudDrift2 = ((frame * 0.55 + 620) % 1500) - 240;
  const cloudDrift3 = ((frame * 0.35 + 1050) % 1500) - 200;
  const sunPulse = 1 + Math.sin(frame * 0.06) * 0.04;
  const rayTilt = Math.sin(frame * 0.03) * 2.5;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: warmDry
          ? "linear-gradient(180deg, #CBEAFF 0%, #FEF3C7 48%, #FDE68A 100%)"
          : THEME.sky.gradient,
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 1080 1200"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 1200,
          overflow: "visible",
        }}
      >
        <defs>
          <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#FDE047" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lightShaftGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Diagonal Sunbeams */}
        <g transform={`translate(${parallaxX * 0.12}, 0) rotate(${rayTilt}, 920, 130)`}>
          <polygon points="880,120 970,120 420,1080 180,1080" fill="url(#lightShaftGrad)" />
          <polygon points="900,120 960,120 790,1080 610,1080" fill="url(#lightShaftGrad)" />
        </g>

        {/* Radiant Morning Sun */}
        <g transform={`translate(${925 + parallaxX * 0.08}, 125) scale(${sunPulse})`}>
          <circle cx="0" cy="0" r="145" fill="url(#sunGlowGrad)" />
          <circle cx="0" cy="0" r="56" fill="#FDE047" stroke="#FACC15" strokeWidth="3" />
          <circle cx="-12" cy="-12" r="22" fill="#FEF9C3" opacity="0.65" />
        </g>

        {/* Soft Cloud Layer 1 (High / Slow) */}
        <g transform={`translate(${cloudDrift3 + parallaxX * 0.15}, 82)`} opacity="0.72">
          <path
            d="M 40 54 Q 65 20 110 26 Q 145 4 195 22 Q 240 20 258 54 Z"
            fill="#FFFFFF"
          />
        </g>

        {/* Soft Cloud Layer 2 (Mid) */}
        <g transform={`translate(${cloudDrift1 + parallaxX * 0.22}, 130)`} opacity="0.92">
          <ellipse cx="120" cy="48" rx="92" ry="26" fill="#FFFFFF" />
          <ellipse cx="88" cy="34" rx="48" ry="25" fill="#FFFFFF" />
          <ellipse cx="152" cy="36" rx="54" ry="22" fill="#FFFFFF" />
        </g>

        {/* Soft Cloud Layer 3 */}
        <g transform={`translate(${cloudDrift2 + parallaxX * 0.25}, 182)`} opacity="0.84">
          <ellipse cx="110" cy="44" rx="76" ry="22" fill="#FFFFFF" />
          <ellipse cx="90" cy="30" rx="44" ry="22" fill="#FFFFFF" />
          <ellipse cx="138" cy="32" rx="38" ry="18" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Foreground Swaying Fern/Leaf Framing Layer (moves faster than midground for 2.5D depth)
 */
export const ForegroundFoliage: React.FC<{
  frame: number;
  parallaxX?: number;
  side?: "both" | "left" | "right";
}> = ({ frame, parallaxX = 0, side = "both" }) => {
  const swayL = Math.sin(frame * 0.07) * 5;
  const swayR = Math.cos(frame * 0.065) * 5;

  return (
    <svg
      viewBox="0 0 1080 1920"
      style={{
        position: "absolute",
        inset: 0,
        width: 1080,
        height: 1920,
        pointerEvents: "none",
        zIndex: 35,
      }}
    >
      {(side === "both" || side === "left") && (
        <g transform={`translate(${parallaxX * 1.4}, 990) rotate(${swayL}, 0, 0)`}>
          <path
            d="M -20 35 Q 95 -90 195 -55 Q 110 -15 35 45 Z"
            fill="#15803D"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
          <path
            d="M -25 55 Q 65 -45 145 -8 Q 75 18 10 68 Z"
            fill="#22C55E"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
        </g>
      )}
      {(side === "both" || side === "right") && (
        <g transform={`translate(${1080 + parallaxX * 1.4}, 990) rotate(${swayR}, 0, 0)`}>
          <path
            d="M 20 35 Q -95 -95 -190 -52 Q -105 -12 -30 45 Z"
            fill="#15803D"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
          <path
            d="M 25 58 Q -60 -42 -140 -4 Q -70 20 -10 70 Z"
            fill="#22C55E"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
        </g>
      )}
    </svg>
  );
};
