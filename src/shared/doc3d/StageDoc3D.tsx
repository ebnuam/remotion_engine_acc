// Isolated PBR Documentary 3D Stage for Kok Iso Yo? (Episode 002+ — Jalur 3C)
// Strictly separated from src/shared/kokisoyo25d/Stage25D.tsx (Episode 001 remains untouched).
// - Zero InkPass, zero twoTone cel-shading, zero cartoon outlines
// - Physical ACES Filmic tone mapping + PCF soft shadows + natural atmospheric depth
// - Supports pure 2D editorial shots WITHOUT mounting WebGL ThreeCanvas (fast 4 vCPU renders)

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";

export interface DocWorldAdapter {
  root: THREE.Object3D;
  load?: () => Promise<void>;
  update(frame: number, fps: number, camera: THREE.PerspectiveCamera, scene: THREE.Scene): void;
  dispose?: () => void;
}

interface DocInnerProps {
  createWorld: () => DocWorldAdapter;
  backgroundHex: string;
}

const DocInner: React.FC<DocInnerProps> = ({ createWorld, backgroundHex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { camera, scene, gl, advance, invalidate } = useThree();

  const world = useMemo(() => createWorld(), [createWorld]);
  const [ready, setReady] = useState(!world.load);
  const [handle] = useState(() => (world.load ? delayRender("Loading StageDoc3D PBR assets") : null));

  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.12;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
  }, [gl]);

  // Load async 3D assets (GLB + PBR textures) first, then flip ready=true
  useEffect(() => {
    let mounted = true;
    if (world.load) {
      world
        .load()
        .then(() => {
          if (mounted) setReady(true);
        })
        .catch((err) => {
          console.error("StageDoc3D asset load error:", err);
          if (mounted) setReady(true);
        });
    }
    return () => {
      mounted = false;
      world.dispose?.();
    };
  }, [world]);

  // Synchronously update camera, lighting, rhino pose & visibility before paint
  const cam = camera as THREE.PerspectiveCamera;
  scene.background = new THREE.Color(backgroundHex);
  world.update(frame, fps, cam, scene);

  // Release delayRender ONLY AFTER React commits ready=true and ThreeCanvas renders via advance()
  useEffect(() => {
    if (!ready) return;
    world.update(frame, fps, cam, scene);
    advance(performance.now());
    invalidate();
    if (handle === null) return;
    let cancelled = false;
    const raf1 = requestAnimationFrame(() => {
      advance(performance.now());
      const raf2 = requestAnimationFrame(() => {
        if (!cancelled) continueRender(handle);
      });
      if (cancelled) cancelAnimationFrame(raf2);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
    };
  }, [ready, handle, world, frame, fps, cam, scene, advance, invalidate]);

  return <primitive object={world.root} dispose={null} />;
};

export interface StageDoc3DProps {
  /** When false, ThreeCanvas is NOT mounted at all so 2D editorial shots render at full CPU speed. */
  use3D: boolean;
  createWorld?: () => DocWorldAdapter;
  backgroundHex?: string;
  /** Subtle cinematic film grain opacity (0 = off, default 0.03). */
  grainOpacity?: number;
  /** Subtle photographic edge vignette (0 = off, default 0.18). */
  vignetteStrength?: number;
  /** Virtual 1080x1920 scaled editorial overlay or full 2D view. */
  renderOverlay?: (frame: number, fps: number) => React.ReactNode;
}

export const StageDoc3D: React.FC<StageDoc3DProps> = ({
  use3D,
  createWorld,
  backgroundHex = "#B4C7BF",
  grainOpacity = 0.028,
  vignetteStrength = 0.18,
  renderOverlay,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const uiScale = width / 1080;

  return (
    <AbsoluteFill style={{ background: backgroundHex, overflow: "hidden" }}>
      {use3D && createWorld ? (
        <AbsoluteFill>
          <ThreeCanvas
            width={width}
            height={height}
            shadows
            gl={{
              antialias: true,
              stencil: false,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.12,
            }}
            camera={{ fov: 36, near: 0.15, far: 450 }}
          >
            <DocInner createWorld={createWorld} backgroundHex={backgroundHex} />
          </ThreeCanvas>
        </AbsoluteFill>
      ) : null}

      {/* Natural soft optical vignette (only subtle cinematic framing on 3D shots) */}
      {use3D && vignetteStrength > 0 ? (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 56%, rgba(10,16,12,${vignetteStrength}) 100%)`,
            zIndex: 15,
          }}
        />
      ) : null}

      {/* Virtual 1080x1920 Editorial Layer (Maps, Data, Hairline Callouts, Safe-Zone Typography) */}
      {renderOverlay ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1920,
            transform: `scale(${uiScale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          {renderOverlay(frame, fps)}
        </div>
      ) : null}

      {/* Lightweight tiled documentary film grain (avoids full-screen per-frame feTurbulence CPU cost) */}
      {grainOpacity > 0 ? (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: grainOpacity,
            pointerEvents: "none",
            zIndex: 45,
            mixBlendMode: "overlay",
          }}
        >
          <defs>
            <filter id="docGrainTile">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.82"
                numOctaves="2"
                seed={17}
                stitchTiles="stitch"
              />
            </filter>
            <pattern id="docGrainPat" width="160" height="160" patternUnits="userSpaceOnUse">
              <rect width="160" height="160" filter="url(#docGrainTile)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#docGrainPat)" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
