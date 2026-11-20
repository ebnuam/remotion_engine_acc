import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  AbsoluteFill,
  Audio,
  getInputProps,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import {
  BlendFunction,
  BloomEffect,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { ShipWorld } from "./world";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur, GrainEffect } from "../bridge/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../bridge/grade";
import { TOTAL, layersAt, dofAt } from "./story";
import { SubtitleOverlay } from "./subtitles";

export const SHIP_EP1_FRAMES = TOTAL; // 2010 frames = 67.0 seconds @ 30 FPS

type PostToggles = {
  ink: boolean;
  lens: boolean;
  pre: boolean;
  bloom: boolean;
  grade: boolean;
  grain: boolean;
};

const toggles = (): PostToggles => ({
  ink: true,
  lens: false, // Default off on VPS CPU to avoid postprocessing DepthTexture feedback loop bug
  pre: false,
  bloom: true,
  grade: true,
  grain: false,
  ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}),
});

/**
 * Bloom for emissive sources & sky/water highlights.
 * Mirrored from Bridge post pipeline.
 */
const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.5,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) =>
    setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3();
const fpt = new THREE.Vector3();

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new ShipWorld(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);

  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
      lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
      bloom: makeBloom(),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
      grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
      grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
    }),
    [camera, scene]
  );

  useEffect(() => {
    const ink = fx.ink;
    return () => {
      if (typeof ink?.dispose === "function") {
        ink.dispose();
      } else if (ink) {
        InkPass.prototype.dispose.call(ink);
      }
    };
  }, [fx]);

  // multisampling={0} is critical for CPU rendering on VPS
  const post = useMemo(
    () => (
      <EffectComposer multisampling={0}>
        {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
        {on.lens && on.pre ? (
          <primitive object={fx.lens.pre} dispose={null} />
        ) : null}
        {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
        {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
        <primitive object={fx.tone} dispose={null} />
        {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
        {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
      </EffectComposer>
    ),
    [fx, on]
  );

  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);

  // Thin-lens DOF focus distance calculation
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f));
  else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, "day");
  fx.grain.seed = f;

  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const dprOverride = () =>
  (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

const ShotView: React.FC<{ id: number; alpha: number }> = ({ id, alpha }) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <ThreeCanvas
        width={width}
        height={height}
        {...(dprOverride() ? { dpr: dprOverride() } : {})}
        shadows
        gl={{
          antialias: false,
          stencil: false,
          powerPreference: "high-performance",
          toneMappingExposure: 1.0,
        }}
        camera={{ fov: 42, near: 0.2, far: 1500 }}
      >
        <Inner id={id} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const ShipShort: React.FC = () => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#b8d0ec" }}>
      {/* 1. Voiceover Audio Track */}
      <Audio src={staticFile("vo_ship_ep1.mp3")} />

      {/* 2. 3D World Scene per Shot */}
      {layersAt(f).map((l) => (
        <ShotView key={l.id} id={l.id} alpha={l.alpha} />
      ))}

      {/* 3. Subtitle Overlay in 9:16 Safe Zone */}
      <SubtitleOverlay frame={f} />
    </AbsoluteFill>
  );
};
