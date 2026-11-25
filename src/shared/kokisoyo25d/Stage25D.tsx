// Reusable Remotion 2.5D-in-3D Stage for Kok Iso Yo? episodes.
// Enforces ToneMappingMode.NEUTRAL, safe CPU VPS render modes (draft / look / final),
// crossfade layers, white hook flash, and an optional virtual 1080x1920 SVG info slot (no auto-subtitles).

import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, getInputProps, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect } from "postprocessing";
import {
  InkPass,
  LensBlur,
  GrainEffect,
  GradeEffect,
  GRADES,
  GRADE_STRENGTH,
  createNeutralToneMappingEffect,
  gradeFor,
  noInkFallback,
} from "./postfx";
import { LightMode } from "./lights";
import { computeCrossfadeLayers, DofEntry, evaluateDof } from "./cameraRig";
import { V3 } from "./proceduralWorld";

export type RenderQualityMode = "draft" | "look" | "final";

export interface StageWorldAdapter {
  root: THREE.Object3D;
  update(shotId: number, frame: number, camera: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3;
}

export interface StageShotMeta {
  id: number;
  a: number;
  b: number;
  light: LightMode;
}

export interface PostConfig {
  mode?: RenderQualityMode;
  ink?: boolean;
  lens?: boolean;
  pre?: boolean;
  bloom?: boolean;
  grade?: boolean;
  grain?: boolean;
  dpr?: number;
}

function resolvePostConfig(defaultMode: RenderQualityMode): Required<Omit<PostConfig, "dpr">> & { dpr?: number } {
  const input = (getInputProps() as { post?: PostConfig }).post ?? {};
  const mode = input.mode ?? defaultMode;
  const isDraft = mode === "draft";
  return {
    mode,
    ink: input.ink ?? !isDraft,
    lens: input.lens ?? !isDraft,
    pre: input.pre ?? !isDraft,
    bloom: input.bloom ?? true,
    grade: input.grade ?? true,
    grain: input.grain ?? false,
    dpr: input.dpr,
  };
}

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
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3();
const fpt = new THREE.Vector3();

interface InnerProps {
  shotId: number;
  shots: StageShotMeta[];
  dofTable: DofEntry[];
  createWorld: () => StageWorldAdapter;
  defaultMode: RenderQualityMode;
}

const StageInner: React.FC<InnerProps> = ({ shotId, shots, dofTable, createWorld, defaultMode }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => createWorld(), [createWorld]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const cfg = useMemo(() => resolvePostConfig(defaultMode), [defaultMode]);

  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
      lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
      bloom: makeBloom(),
      tone: createNeutralToneMappingEffect(),
      grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
      grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
    }),
    [camera, scene]
  );

  useEffect(() => {
    const ink = fx.ink;
    return () => {
      if (typeof ink?.dispose === "function") ink.dispose();
      else if (ink) InkPass.prototype.dispose.call(ink);
    };
  }, [fx]);

  // Draft uses msaa=0 without depth passes; look/final use msaa=4 so InkPass & LensBlur depth buffers avoid feedback loops.
  const msaa = cfg.mode === "draft" && !cfg.ink && !cfg.lens ? 0 : 4;

  const post = useMemo(
    () => (
      <EffectComposer multisampling={msaa}>
        {cfg.ink ? <primitive object={fx.ink} dispose={null} /> : null}
        {cfg.lens && cfg.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
        {cfg.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
        {cfg.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
        <primitive object={fx.tone} dispose={null} />
        {cfg.grade ? <primitive object={fx.grade} dispose={null} /> : null}
        {cfg.grain ? <primitive object={fx.grain} dispose={null} /> : null}
      </EffectComposer>
    ),
    [fx, cfg, msaa]
  );

  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(shotId, f, cam, scene));
  noInkFallback(world.root);

  const d = evaluateDof(dofTable, f);
  cam.getWorldDirection(fwd);
  if (d.focus) {
    const fp: V3 = d.focus(f);
    fpt.set(fp[0], fp[1], fp[2]);
  } else {
    fpt.copy(target);
  }
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = cfg.lens ? d.cInf : 0;

  const shotMeta = shots.find((s) => s.id === shotId) ?? shots[0];
  gradeFor(fx.grade, shotMeta.light);
  fx.grain.seed = f;

  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

export interface Stage25DProps {
  shots: StageShotMeta[];
  xfade?: Record<number, number>;
  flashAt?: number;
  dofTable?: DofEntry[];
  createWorld: () => StageWorldAdapter;
  audioSrc?: string;
  renderMode?: RenderQualityMode;
  /** Optional 1080x1920 virtual-scaled SVG/React informational layer (minimal diegetic labels/diagrams; NO auto-subtitles). */
  renderInfoOverlay?: (frame: number, shotId: number) => React.ReactNode;
}

export const Stage25D: React.FC<Stage25DProps> = ({
  shots,
  xfade = {},
  flashAt = -1,
  dofTable = [],
  createWorld,
  audioSrc,
  renderMode = "look",
  renderInfoOverlay,
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cfg = useMemo(() => resolvePostConfig(renderMode), [renderMode]);
  const layers = computeCrossfadeLayers(shots, xfade, f);
  const flash = flashAt >= 0 && f >= flashAt && f < flashAt + 4 ? [1, 0.75, 0.45, 0.2][f - flashAt] : 0;
  const activeShot = layers[layers.length - 1]?.id ?? shots[0].id;
  const uiScale = width / 1080;

  return (
    <AbsoluteFill style={{ background: "#cfe3f2", overflow: "hidden" }}>
      {audioSrc ? <Audio src={audioSrc} /> : null}
      {layers.map((l, i) => (
        <AbsoluteFill key={i ? "over" : "base"} style={{ opacity: l.alpha }}>
          <ThreeCanvas
            width={width}
            height={height}
            {...(cfg.dpr ? { dpr: cfg.dpr } : {})}
            shadows
            gl={{
              antialias: false,
              stencil: false,
              powerPreference: "high-performance",
              toneMappingExposure: 1.0,
            }}
            camera={{ fov: 40, near: 0.2, far: 1500 }}
          >
            <StageInner
              shotId={l.id}
              shots={shots}
              dofTable={dofTable}
              createWorld={createWorld}
              defaultMode={renderMode}
            />
          </ThreeCanvas>
        </AbsoluteFill>
      ))}
      {flash > 0 ? <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} /> : null}
      {renderInfoOverlay ? (
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
            zIndex: 40,
          }}
        >
          {renderInfoOverlay(f, activeShot)}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
