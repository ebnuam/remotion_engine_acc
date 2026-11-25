import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { getActiveShot } from "./story";
import { THEME } from "./theme";

export const EducationalBadges: React.FC<{ frame: number }> = ({ frame }) => {
  const { width } = useVideoConfig();
  const isPreview = width <= 540;
  const shot = getActiveShot(frame);

  const shotLocalFrame = frame - shot.start;
  const shotDuration = shot.end - shot.start;

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
          boxShadow: isPreview ? "0 4px 0 #0F172A" : "0 8px 0 #0F172A",
          borderRadius: isPreview ? "22px" : "40px",
          padding: `${paddingV}px ${paddingH}px`,
        }}
      >
        <div
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: THEME.accent.success,
            border: `${isPreview ? 1.5 : 2.5}px solid #0F172A`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: THEME.font,
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
