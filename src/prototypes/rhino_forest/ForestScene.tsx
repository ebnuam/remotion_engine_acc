import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import { RhinoCharacter } from "./RhinoCharacter";
import { ForestEnvironment } from "./ForestEnvironment";

/**
 * ForestScene Component (Three.js scene graph inside ThreeCanvas)
 * Orchestrates 3D Character, 3D Nature Environment, and Cinematic Camera
 */
export const ForestScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();

  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading Rhino Forest 3D Assets"));

  const rhino = useMemo(() => new RhinoCharacter(), []);
  const env = useMemo(() => new ForestEnvironment(), []);

  // Asynchronously load real 3D assets on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      try {
        const rhinoUrl = staticFile("prototypes/rhino_forest/rhino_walk_pbr.glb");
        const envBasePath = staticFile("prototypes/rhino_forest/env");

        await Promise.all([
          rhino.load(rhinoUrl),
          env.loadNatureAssets(envBasePath),
        ]);

        if (isMounted) {
          setReady(true);
          continueRender(handle);
        }
      } catch (err) {
        console.error("Failed to load prototype 3D assets:", err);
        if (isMounted) {
          continueRender(handle);
        }
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, [rhino, env, handle]);

  // Update animated scene states per frame
  if (ready) {
    // 1. Update Rhino character walking cycle (30 fps)
    rhino.update(frame, 30, -5.5);

    // 2. Update environmental breeze & sunlight dust motes
    env.update(frame);

    // 3. Cinematic Camera Kinematics (12 seconds / 360 frames)
    const rhinoPos = rhino.getPosition();

    // 0–3s (f0–f90): Wide establishing shot with foreground depth
    // 3–6s (f90–f180): Gradual push-in, low angle revealing powerful body & gait
    // 6–9s (f180–f270): 3/4 side tracking shot keeping pace with the walking rhino
    // 9–12s (f270–f360): Heroic low angle tracking into sunlit clearing
    const camX = interpolate(
      frame,
      [0, 90, 180, 270, 360],
      [-6.5, -4.5, -0.5, 3.8, 6.2],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const camY = interpolate(
      frame,
      [0, 90, 180, 270, 360],
      [3.0, 2.3, 1.8, 1.6, 1.5],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const camZ = interpolate(
      frame,
      [0, 90, 180, 270, 360],
      [9.2, 7.5, 5.8, 5.4, 5.0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    camera.position.set(camX, camY, camZ);

    const lookTargetX = interpolate(
      frame,
      [0, 90, 180, 270, 360],
      [rhinoPos.x + 0.8, rhinoPos.x + 0.5, rhinoPos.x + 0.3, rhinoPos.x + 0.4, rhinoPos.x + 0.6]
    );

    camera.lookAt(lookTargetX, 1.25, 0);
  }

  return (
    <>
      <primitive object={env.root} dispose={null} />
      <primitive object={rhino.root} dispose={null} />
    </>
  );
};
