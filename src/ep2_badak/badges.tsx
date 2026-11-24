import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { SHOTS } from "./story";

/**
 * Educational UI Badges component strictly adhering to RULES.md:
 * - Positioned at safe zone top: 14%–19% (clearance > 120px from subtitle at bottom 19%)
 * - Clean UPPERCASE typography, concise 2–4 words (NEVER truncated with '...')
 * - Zero unicode emojis (prevents Ubuntu Linux tofu boxes)
 * - High-contrast bordered pill styling with vibrant accent color
 */
export const EducationalBadges: React.FC<{ frame: number }> = ({ frame }) => {
  const { width } = useVideoConfig();
  const isPreview = width <= 540;

  const shot = SHOTS.find((s) => frame >= s.startFrame && frame <= s.endFrame) || SHOTS[0];
  if (!shot || !shot.badge) return null;

  const shotLocalFrame = frame - shot.startFrame;
  const shotDuration = shot.endFrame - shot.startFrame;

  // Snappy enter and exit
  const enterProgress = Math.min(1, shotLocalFrame / 2);
  const exitProgress = Math.max(0, (shotDuration - shotLocalFrame) / 2);
  const opacity = Math.min(enterProgress, exitProgress);
  const translateY = interpolate(enterProgress, [0, 1], [-8, 0]);

  const fontSize = isPreview ? 17 : 34;
  const paddingV = isPreview ? 7 : 13;
  const paddingH = isPreview ? 18 : 36;
  const borderWidth = isPreview ? 2.5 : 4;
  const dotSize = isPreview ? 10 : 18;

  return (
    <div
      style={{
        position: "absolute",
        top: "13.5%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 55,
        opacity,
        transform: `translateY(${translateY}px)`,
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: isPreview ? "10px" : "18px",
          background: "#FFFFFF",
          border: `${borderWidth}px solid #0F172A`,
          boxShadow: isPreview
            ? "0 4px 0 #0F172A"
            : "0 8px 0 #0F172A",
          borderRadius: isPreview ? "22px" : "40px",
          padding: `${paddingV}px ${paddingH}px`,
        }}
      >
        {/* Pulsing Colored Accent Dot */}
        <div
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: shot.accentColor,
            border: `${isPreview ? 1.5 : 2.5}px solid #0F172A`,
            flexShrink: 0,
          }}
        />

        {/* Short, crisp UPPERCASE badge text */}
        <span
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 900,
            fontSize: `${fontSize}px`,
            color: "#0F172A",
            letterSpacing: isPreview ? "0.8px" : "1.6px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {shot.badge}
        </span>
      </div>
    </div>
  );
};
