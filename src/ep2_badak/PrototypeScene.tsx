import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { JungleWorld } from "./environment/JungleWorld";
import { EducationalBadges } from "./badges";
import { SubtitleOverlay } from "./subtitles";

/**
 * Visual Prototype Scene: Badak Jawa in Sunny Rainforest
 * Proves:
 * - 2.5D/3D depth with foreground, midground, background
 * - Organic cartoon 3D Rhino with articulated walk cycle
 * - Body bobbing, ear twitches, breathing, head nod
 * - Dynamic tracking camera
 * - Moving clouds, swaying tropical trees & ferns
 * - Warm daylight lighting
 */

const PrototypeCanvasInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const world = useMemo(() => new JungleWorld({ hasBaby: true }), []);

  // Update animated world state per frame
  world.update(frame, true, 1.0);

  // Animate rhino walking from left to right
  const rhinoX = interpolate(frame, [0, 150], [-4, 3], { extrapolateRight: "clamp" });
  world.rhino.setPosition(rhinoX, 0.45, 0);

  // Baby rhino follows behind
  if (world.babyRhino) {
    world.babyRhino.setPosition(rhinoX - 2.6, 0.45, 0.5);
  }

  // Dynamic tracking camera (side tracking with slight low angle & smooth push-in)
  const camX = interpolate(frame, [0, 150], [-2, 3.5]);
  const camY = interpolate(frame, [0, 150], [2.2, 1.8]);
  const camZ = interpolate(frame, [0, 150], [7.5, 6.2]);

  camera.position.set(camX, camY, camZ);
  camera.lookAt(rhinoX + 0.5, 1.3, 0);

  return <primitive object={world.root} dispose={null} />;
};

export const PrototypeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#38BDF8", overflow: "hidden" }}>
      <ThreeCanvas
        width={width}
        height={height}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: 42,
          near: 0.2,
          far: 200,
          position: [0, 2, 7.5],
        }}
        shadows
      >
        <PrototypeCanvasInner />
      </ThreeCanvas>

      {/* Educational Badge & Subtitle Overlays */}
      <EducationalBadges frame={frame} />
      <SubtitleOverlay frame={frame} />
    </AbsoluteFill>
  );
};
