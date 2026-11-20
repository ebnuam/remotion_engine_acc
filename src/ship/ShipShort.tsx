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
 * Bloom for emissive highlights and sky/water cel glints.
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

/**
 * Educational UI Badges & Callout Overlays
 */
const EducationalBadges: React.FC<{ frame: number }> = ({ frame }) => {
  // Shot 2: Engine Off Badge (f=437..660)
  const showEngineOff = frame >= 437 && frame <= 660;

  // Shot 3A: Solid Steel Block Badge (f=670..844)
  const showSteelBlock = frame >= 670 && frame <= 844;

  // Shot 3B: Hollow Air Cavity Badge (f=870..1150)
  const showHollowCavity = frame >= 870 && frame <= 1150;

  // Shot 4: Force Arrows Labels (f=1180..1660)
  const showGravityLabel = frame >= 1180 && frame <= 1660;
  const showBuoyancyLabel = frame >= 1360 && frame <= 1660;
  const showBalanceBadge = frame >= 1520 && frame <= 1660;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 40,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* 1. Shot 2: MESIN MATI ❌ Badge */}
      {showEngineOff && (
        <div
          style={{
            position: "absolute",
            top: "14%",
            right: "8%",
            background: "rgba(220, 38, 38, 0.95)",
            border: "3px solid #ffffff",
            borderRadius: "14px",
            padding: "8px 16px",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: "24px",
            letterSpacing: "1px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "28px" }}>⚙️</span>
          <span>MESIN MATI ❌</span>
        </div>
      )}

      {/* 2. Shot 3A: BAJA PADAT Badge */}
      {showSteelBlock && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(30, 41, 59, 0.95)",
            border: "3px solid #cbd5e1",
            borderRadius: "14px",
            padding: "8px 22px",
            color: "#f8fafc",
            fontWeight: 900,
            fontSize: "26px",
            letterSpacing: "1.2px",
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.6)",
            textTransform: "uppercase",
          }}
        >
          ⚙️ BAJA PADAT (PEJAL)
        </div>
      )}

      {/* 3. Shot 3B: RONGGA UDARA KOSONG Banner */}
      {showHollowCavity && (
        <div
          style={{
            position: "absolute",
            top: "22%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(14, 165, 233, 0.95)",
            border: "3px solid #ffffff",
            borderRadius: "14px",
            padding: "10px 24px",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: "26px",
            letterSpacing: "1.2px",
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.5)",
            textTransform: "uppercase",
          }}
        >
          💨 RONGGA UDARA KOSONG
        </div>
      )}

      {/* 4. Shot 4: BERAT KAPAL ↓ Label */}
      {showGravityLabel && (
        <div
          style={{
            position: "absolute",
            top: "22%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(239, 68, 68, 0.95)",
            border: "3px solid #ffffff",
            borderRadius: "12px",
            padding: "6px 18px",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: "24px",
            letterSpacing: "1px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
            textTransform: "uppercase",
          }}
        >
          BERAT KAPAL ↓
        </div>
      )}

      {/* 5. Shot 4: GAYA APUNG ↑ Label */}
      {showBuoyancyLabel && (
        <div
          style={{
            position: "absolute",
            bottom: "28%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(16, 185, 129, 0.95)",
            border: "3px solid #ffffff",
            borderRadius: "12px",
            padding: "6px 18px",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: "24px",
            letterSpacing: "1px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
            textTransform: "uppercase",
          }}
        >
          GAYA APUNG ↑
        </div>
      )}

      {/* 6. Shot 4: SEIMBANG Badge */}
      {showBalanceBadge && (
        <div
          style={{
            position: "absolute",
            top: "48%",
            right: "8%",
            background: "rgba(15, 23, 42, 0.92)",
            border: "3px solid #fbbf24",
            borderRadius: "12px",
            padding: "6px 14px",
            color: "#fbbf24",
            fontWeight: 900,
            fontSize: "20px",
            letterSpacing: "0.8px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.6)",
          }}
        >
          ⚖️ SEIMBANG
        </div>
      )}
    </div>
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

      {/* 3. Educational Badges & UI Callouts */}
      <EducationalBadges frame={f} />

      {/* 4. Subtitle Overlay in 9:16 Safe Zone */}
      <SubtitleOverlay frame={f} />
    </AbsoluteFill>
  );
};
