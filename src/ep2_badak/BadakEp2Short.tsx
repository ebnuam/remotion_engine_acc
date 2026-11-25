import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TOTAL_FRAMES, getActiveShot } from "./story";
import { SubtitleOverlay } from "./subtitles";
import { THEME } from "./theme";
import { SkyAndParallax } from "./components/SkyAndParallax";
import { Scene1Hook } from "./components/Scene1Hook";
import { JavaMapLiving } from "./components/JavaMapLiving";
import { Scene3Krakatau } from "./components/Scene3Krakatau";
import { Scene4Truck } from "./components/Scene4Truck";
import { Scene5Musofa } from "./components/Scene5Musofa";
import { Scene7Adaptation } from "./components/Scene7Adaptation";
import { Scene8Langkap } from "./components/Scene8Langkap";
import { Scene9Conservation } from "./components/Scene9Conservation";
import { Scene10Outro } from "./components/Scene10Outro";

export const BADAK_EP2_FRAMES = TOTAL_FRAMES; // 3625 frames @ 30 FPS

/**
 * Master Composition: Episode 2 — Badak Jawa di Ujung Kulon
 * Rebuilt from zero in a fluid, living 2.5D Cross-Section & Living Map style.
 * - Zero static slideshow frames, zero stiff boxy form cards
 * - Continuous camera pan/zoom/parallax across 40 dynamic micro-shots
 * - Bright sunlit daytime atmosphere across all 10 scenes
 * - Preserves audio & exact 33 Whisper subtitle cues from ./subtitles
 */
export const BadakEp2Short: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const shot = getActiveShot(frame);
  const localFrame = frame - shot.start;
  const shotLen = Math.max(1, shot.end - shot.start);
  const progress = Math.min(1, Math.max(0, localFrame / shotLen));

  // Smooth eased camera progress
  const easedP = interpolate(progress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const camZoom = interpolate(easedP, [0, 1], shot.camZoom);
  const camX = interpolate(easedP, [0, 1], shot.camX);
  const camY = interpolate(easedP, [0, 1], shot.camY);

  // Subtle snappy transition fade-in on major scene switches
  const isSceneBoundary = localFrame < 6 && [1, 8, 13, 16, 21, 24, 27, 32, 36, 41].includes(shot.id);
  const sceneOpacity = isSceneBoundary
    ? interpolate(localFrame, [0, 5], [0.4, 1], { extrapolateRight: "clamp" })
    : 1;

  const badgeSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 170 },
  });

  const uiScale = width / 1080;

  return (
    <AbsoluteFill style={{ background: THEME.sky.gradient, overflow: "hidden" }}>
      {/* Voiceover Audio (Strictly Preserved) */}
      <Audio src={staticFile("audio/pemindahan_badak_jawa.mp3")} />

      {/* Virtual 1080x1920 Stage */}
      <div
        style={{
          width: 1080,
          height: 1920,
          position: "absolute",
          top: 0,
          left: 0,
          transform: `scale(${uiScale})`,
          transformOrigin: "top left",
          overflow: "hidden",
        }}
      >
        {/* Bright Daytime 2.5D Sky & Sun Backdrop */}
        <SkyAndParallax
          frame={frame}
          parallaxX={camX}
          warmDry={shot.mode === "scene7_adaptation"}
        />

        {/* Camera Stage Container */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${camX}px, ${camY}px) scale(${camZoom})`,
            transformOrigin: "50% 50%",
            opacity: sceneOpacity,
            zIndex: 5,
          }}
        >
          {shot.mode === "scene1_hook" && (
            <Scene1Hook
              frame={frame}
              localFrame={localFrame}
              progress={progress}
              shotId={shot.id}
              parallaxX={camX}
            />
          )}

          {shot.mode === "scene2_map" && (
            <JavaMapLiving
              frame={frame}
              progress={progress}
              shotId={shot.id}
              mode="relocation"
            />
          )}

          {shot.mode === "scene3_krakatau" && (
            <Scene3Krakatau
              frame={frame}
              progress={progress}
              shotId={shot.id}
            />
          )}

          {shot.mode === "scene4_truck" && (
            <Scene4Truck
              frame={frame}
              localFrame={localFrame}
              progress={progress}
              shotId={shot.id}
            />
          )}

          {shot.mode === "scene5_musofa" && (
            <Scene5Musofa
              frame={frame}
              localFrame={localFrame}
              progress={progress}
              shotId={shot.id}
            />
          )}

          {shot.mode === "scene6_distance" && (
            <JavaMapLiving
              frame={frame}
              progress={progress}
              shotId={shot.id}
              mode="distance_compare"
            />
          )}

          {shot.mode === "scene7_adaptation" && (
            <Scene7Adaptation
              frame={frame}
              progress={progress}
              shotId={shot.id}
              parallaxX={camX}
            />
          )}

          {shot.mode === "scene8_langkap" && (
            <Scene8Langkap
              frame={frame}
              progress={progress}
              shotId={shot.id}
              parallaxX={camX}
            />
          )}

          {shot.mode === "scene9_conservation" && (
            <Scene9Conservation
              frame={frame}
              progress={progress}
              shotId={shot.id}
              parallaxX={camX}
            />
          )}

          {shot.mode === "scene10_outro" && (
            <Scene10Outro
              frame={frame}
              progress={progress}
              shotId={shot.id}
            />
          )}
        </div>

        {/* Top Safe-Zone Badge (fixed at Y = 210px, strictly emoji-free) */}
        <div
          style={{
            position: "absolute",
            top: 210,
            left: "50%",
            transform: `translateX(-50%) scale(${0.92 + 0.08 * badgeSpring})`,
            backgroundColor: THEME.ink,
            color: "#FFFFFF",
            padding: "13px 38px",
            borderRadius: 999,
            fontFamily: THEME.font,
            fontWeight: 900,
            fontSize: 36,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            zIndex: 50,
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.24)",
          }}
        >
          {shot.badge}
        </div>
      </div>

      {/* Bottom Safe-Zone Subtitle Overlay (Preserved Strictly) */}
      <SubtitleOverlay frame={frame} />
    </AbsoluteFill>
  );
};
