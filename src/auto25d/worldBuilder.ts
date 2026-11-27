// StageWorldAdapter for Kok Iso Yo? Living 2.5D-in-3D Airport & Hangar Engine (src/auto25d/)
// Matches reference engineering-explainer DNA:
// - 100% spatially coherent Z-axis runway & landing trajectory (jet always lands ALONG the runway!)
// - Moving airport service vehicles on flanking apron roads + city skyline
// - Active Lead Engineer (Pak Koko) + reacting Airport Ground Crew workers in colored hardhats
// - Open architectural hangar with yellow scaffolding, ladder, orange pump cart & evening/cobalt skylight

import * as THREE from "three";
import {
  ActorBillboard,
  Cam,
  CanvasPool,
  FxBillboard,
  LIGHTS,
  LightMode,
  StageWorldAdapter,
  V3,
  applyKick,
  applyLightUniforms,
  createCloudRing,
  createSkyDome,
  createSunRig,
  dolly,
  drawContactBlob,
  kickAt,
  lightAngle2D,
  pushK,
  untone,
  updateCameraRelativeSun,
  updateSkyAndFog,
} from "../shared/kokisoyo25d";
import {
  ExtendedHostPose,
  drawComicSparklesFx,
  drawCrewWorker,
  drawKokoHost,
  drawLightbulbFx,
  drawQuestionMarkFx,
} from "./characters25d";
import { EnvRig, HeroPropRig, buildEnvironments, buildHeroPropRig } from "./prop3d";
import type { AutoCameraAngle, AutoCameraMotion, AutoHeroProp, AutoSceneItem, AutoScenePlan } from "./types";

const BASE_CAMERAS: Record<AutoCameraAngle, { pos: V3; look: V3; fov: number; roll: number }> = {
  low_angle: { pos: [2.2, 1.45, 10.6], look: [0, 1.8, -0.5], fov: 42, roll: -0.015 },
  wide: { pos: [3.2, 3.0, 12.6], look: [0, 1.75, -0.8], fov: 43, roll: 0 },
  medium: { pos: [1.85, 2.15, 9.6], look: [0, 1.7, 0], fov: 41, roll: 0.008 },
  close_up: { pos: [1.35, 2.0, 7.4], look: [0, 1.8, 0], fov: 39, roll: -0.01 },
  extreme_close_up: { pos: [0.9, 1.85, 6.4], look: [0.05, 1.8, 0.1], fov: 38, roll: 0.01 },
  top_down: { pos: [0.3, 9.6, 5.2], look: [0, 1.45, 0], fov: 41, roll: 0 },
  high_angle: { pos: [-2.8, 5.1, 9.8], look: [0, 1.65, 0], fov: 41, roll: 0.012 },
  aerial: { pos: [-4.4, 6.2, 12.2], look: [0, 1.65, -0.8], fov: 43, roll: -0.008 },
};

/**
 * Prop-aware camera choreography so runway shots ALWAYS look logically along the Z-axis runway,
 * side-tracking shots run parallel to the runway shoulder, and hangar shots showcase scaffolding + crew!
 */
function resolvePropBaseCamera(scene: AutoSceneItem): { pos: V3; look: V3; fov: number; roll: number } {
  if (scene.heroProp === "jet_landing") {
    if (scene.cameraAngle === "wide") {
      return { pos: [9.8, 3.4, 10.2], look: [0.4, 1.85, -3.5], fov: 43, roll: 0 };
    }
    return { pos: [8.8, 2.1, 10.8], look: [0.6, 1.9, -2.5], fov: 43, roll: -0.015 };
  }
  if (scene.heroProp === "jet_taxi_golden") {
    if (scene.cameraAngle === "aerial") {
      return { pos: [11.5, 6.2, 11.5], look: [0, 1.7, -2.2], fov: 43, roll: -0.01 };
    }
    if (scene.cameraAngle === "wide") {
      return { pos: [9.4, 2.5, 10.4], look: [0.8, 1.8, -1.8], fov: 42, roll: 0 };
    }
    return { pos: [7.6, 2.0, 9.6], look: [1.2, 1.75, -0.8], fov: 41, roll: 0.008 };
  }
  if (scene.heroProp === "tire_touchdown_smoke") {
    if (scene.cameraAngle === "extreme_close_up") {
      return { pos: [5.4, 1.45, 1.2], look: [0, 1.4, -0.6], fov: 39, roll: -0.012 };
    }
    return { pos: [6.8, 1.75, 2.6], look: [0, 1.5, -0.6], fov: 41, roll: 0.01 };
  }
  if (scene.heroProp === "tire_spinup") {
    return { pos: [7.6, 1.85, 3.2], look: [0.2, 1.55, -0.4], fov: 41, roll: 0 };
  }
  if (scene.heroProp === "burst_test_4x") {
    return { pos: [-0.7, 3.5, 11.8], look: [-0.1, 1.65, 0], fov: 43, roll: 0.008 };
  }
  if (scene.heroProp === "tire_vs_six_cars") {
    return { pos: [2.2, 2.7, 11.8], look: [-0.15, 1.7, 0], fov: 43, roll: 0 };
  }
  return BASE_CAMERAS[scene.cameraAngle] ?? BASE_CAMERAS.medium;
}

function computeCameraForScene(
  scene: AutoSceneItem,
  frame: number,
  fps: number,
  kicks: [number, number][]
): Cam {
  const base = resolvePropBaseCamera(scene);
  const dur = Math.max(1, scene.b - scene.a);
  const localF = Math.max(0, frame - scene.a);
  const u = Math.min(1, localF / dur);
  const motion: AutoCameraMotion = scene.cameraMotion ?? "push_in";

  let pos: V3 = [...base.pos] as V3;
  let look: V3 = [...base.look] as V3;
  const fov = base.fov;
  const roll = base.roll;

  if (motion === "push_in") {
    const d = dolly(base.pos, base.look, pushK(frame, scene.a, 0.0024), { fov, roll });
    pos = d.pos;
    look = d.look;
  } else if (motion === "pull_back") {
    const k = 0.9 + u * 0.16;
    const d = dolly(base.pos, base.look, k, { fov, roll });
    pos = d.pos;
    look = d.look;
  } else if (motion === "orbit") {
    const radius = Math.hypot(base.pos[0] - base.look[0], base.pos[2] - base.look[2]);
    const a0 = Math.atan2(base.pos[0] - base.look[0], base.pos[2] - base.look[2]);
    const a = a0 + (u - 0.5) * 0.42;
    pos = [base.look[0] + Math.sin(a) * radius, base.pos[1], base.look[2] + Math.cos(a) * radius];
  } else if (motion === "pan_right") {
    if (scene.heroProp === "tire_touchdown_smoke" || scene.heroProp === "tire_spinup") {
      // Side-track forward along runway Z!
      pos = [base.pos[0], base.pos[1], base.pos[2] - 0.8 + u * 1.6];
      look = [base.look[0], base.look[1], base.look[2] - 0.4 + u * 0.8];
    } else {
      pos = [base.pos[0] - 0.9 + u * 1.8, base.pos[1], base.pos[2]];
      look = [base.look[0] - 0.35 + u * 0.7, base.look[1], base.look[2]];
    }
  } else if (motion === "tilt_up") {
    pos = [base.pos[0], base.pos[1] - 0.3 + u * 0.6, base.pos[2] * (1 - u * 0.05)];
    look = [base.look[0], base.look[1] - 0.25 + u * 0.7, base.look[2]];
  } else if (motion === "crane_down") {
    pos = [base.pos[0], base.pos[1] + 0.85 - u * 1.0, base.pos[2] * (1 - u * 0.05)];
  }

  const cam: Cam = { pos, look, fov, roll };
  return applyKick(cam, kickAt(frame / fps, kicks, fps));
}

const quant = (v: number, n = 36) => Math.round(v * n) / n;

// Macro-only shots where characters step out of frame so the camera dives inside the mechanism
const HIDE_CAST_MACRO_PROPS = new Set<AutoHeroProp>([
  "nitrogen_xray",
  "fusible_plug_zoom",
  "fusible_plug_melt",
]);

export class AutoWorld25D implements StageWorldAdapter {
  root = new THREE.Group();
  private plan: AutoScenePlan;
  private pool = new CanvasPool();
  private actors: ActorBillboard[] = [];
  private fxs: FxBillboard[] = [];
  private sky = createSkyDome();
  private fog = new THREE.Fog("#b8d0ec", 25, 280);
  private sunRig: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight };
  private clouds: ReturnType<typeof createCloudRing>;
  private envRig: EnvRig;
  private propRig: HeroPropRig;
  private kicks: [number, number][];

  constructor(plan: AutoScenePlan) {
    this.plan = plan;
    const R = this.root;
    R.add(this.sky.mesh);
    this.sunRig = createSunRig(R, 2048);
    this.clouds = createCloudRing(R, 7);
    this.envRig = buildEnvironments(R);
    this.propRig = buildHeroPropRig(R);

    this.kicks = plan.scenes
      .filter((s) => s.kickAtStart)
      .map((s) => [s.a / (plan.fps || 30), 0.7] as [number, number]);
  }

  private getActor(i: number) {
    while (this.actors.length <= i) this.actors.push(new ActorBillboard(this.root));
    return this.actors[i];
  }

  private getFx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new FxBillboard(this.root));
    return this.fxs[i];
  }

  private applyHangarEveningLook(camPos: THREE.Vector3, scene: THREE.Scene) {
    // Rich cobalt-blue evening sky outside the open hangar door (matching ref_009 / ref_015!)
    // while keeping bright crisp overhead bay lighting inside the workshop so every detail pops!
    const eveningStops = ["#3b5998", "#2d4a86", "#1e3a73", "#162c59", "#0f1e3d"];
    eveningStops.forEach((h, i) => untone(h, this.sky.mat.uniforms["c" + i].value));
    const e = [0, 6, 15, 28, 52].map((deg) => THREE.MathUtils.degToRad(deg));
    this.sky.mat.uniforms.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.mesh.position.copy(camPos);

    untone("#607ca8", this.fog.color);
    this.fog.near = 38;
    this.fog.far = 220;
    scene.fog = this.fog;

    this.sunRig.hemi.color.set("#f8fafc");
    this.sunRig.hemi.groundColor.set("#64748b");
    this.sunRig.hemi.intensity = 1.1;
    this.sunRig.sun.color.set("#fff7ed");
    this.sunRig.sun.intensity = 2.65;
  }

  private placeContactBlob(fxIdx: number, x: number, z: number, baseLight: LightMode, scale = 1.35) {
    const blob = this.getFx(fxIdx);
    const blobTint = LIGHTS[baseLight].blob;
    blob.r = this.pool.req(`blob|${baseLight}`, 128, 128, 1, (p) => drawContactBlob(p, blobTint));
    blob.use("blob");
    blob.mesh.visible = true;
    blob.mesh.position.set(x, 0.03, z);
    blob.mesh.rotation.set(-Math.PI / 2, 0, 0);
    blob.mesh.scale.set(scale, scale, 1);
  }

  update(
    shotId: number,
    frame: number,
    cam: THREE.PerspectiveCamera,
    scene: THREE.Scene
  ): THREE.Vector3 {
    const fps = this.plan.fps || 30;
    const item = this.plan.scenes.find((s) => s.id === shotId) ?? this.plan.scenes[0];
    const tSec = frame / fps;
    const dur = Math.max(1, item.b - item.a);
    const tLocal = Math.min(1, Math.max(0, (frame - item.a) / dur));

    const c = computeCameraForScene(item, frame, fps, this.kicks);
    cam.position.set(...c.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...c.look);
    cam.rotateZ(c.roll);
    cam.fov = c.fov;
    cam.near = 0.2;
    cam.far = 1500;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    const focus = new THREE.Vector3(...c.look);
    cam.layers.enable(3);

    const baseLight: LightMode = item.lightMode === "golden" ? "golden" : "day";
    applyLightUniforms(baseLight);
    updateSkyAndFog(this.sky, this.fog, cam.position, scene, baseLight);
    const sunDir = updateCameraRelativeSun(this.sunRig, cam.position, focus, baseLight);

    if (item.lightMode === "night") {
      this.applyHangarEveningLook(cam.position, scene);
      this.clouds.clouds.forEach((m) => {
        m.visible = false;
      });
    } else {
      if (baseLight === "golden") {
        // Keep golden sun high enough so airplane shadow sits crisply beneath the wheels
        this.sunRig.sun.position.y = Math.max(this.sunRig.sun.position.y, 16);
      }
      this.clouds.clouds.forEach((m) => {
        m.visible = true;
      });
      this.clouds.update(cam.position, baseLight);
    }

    const activeTheme = item.envTheme ?? this.plan.defaultEnvTheme;
    this.envRig.setTheme(activeTheme, tSec, item.heroProp);
    this.propRig.update(item.heroProp, tLocal, tSec);

    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const l2d = lightAngle2D(sunDir, right, false);

    let actorCount = 0;
    let fxCount = 0;

    const placeActor = (
      key: string,
      draw: (p: any) => void,
      x: number,
      y: number,
      z: number,
      sc: number,
      mirror = false,
      addBlob = true
    ) => {
      const a = this.getActor(actorCount++);
      a.r = this.pool.req(key, 600, 1000, 1, draw);
      a.mesh.visible = true;
      a.mesh.position.set(x, y, z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - x, cam.position.z - z), 0);
      a.mesh.scale.set(mirror ? -sc : sc, sc, sc);
      if (addBlob && y < 0.1) {
        this.placeContactBlob(fxCount++, x, z, baseLight, sc * 1.25);
      }
    };

    const phase = quant((tSec * 0.8) % 1, 36);
    const talkPulse = Math.round(Math.abs(Math.sin(tSec * 10)) * 4) / 4;
    const blink = tSec % 2.5 < 0.12 ? 1 : 0;

    // =========================================================================
    // LIVING CAST STAGING (Active Pak Koko + Reacting Airport Ground Crew!)
    // =========================================================================
    if (!HIDE_CAST_MACRO_PROPS.has(item.heroProp)) {
      if (item.heroProp === "jet_landing" || item.heroProp === "jet_taxi_golden") {
        // Runway apron shoulder: Pak Koko + 3 colorful ground crew on right grass verge!
        const isGolden = item.heroProp === "jet_taxi_golden";
        const kokoPose: ExtendedHostPose = isGolden
          ? item.id === 18
            ? "thumbs_up"
            : "wave"
          : item.id === 1
          ? "marshal"
          : "brace";
        const kokoExpr = isGolden ? "smile" : item.id === 1 ? "shock" : "curious";
        const kokoX = 5.4;
        const kokoZ = 4.6;
        placeActor(
          `koko|${kokoExpr}|${kokoPose}|earmuffs|${phase}|${talkPulse}|${blink}|${quant(l2d, 10)}`,
          (p) =>
            drawKokoHost(p, {
              phase,
              talkPulse,
              expr: kokoExpr,
              pose: kokoPose,
              accessory: "earmuffs",
              blink,
              lightAngle: l2d,
            }),
          kokoX,
          0,
          kokoZ,
          1.15,
          false
        );

        // Clean '?' badge above Koko in opening hook
        if (item.id === 1) {
          const fx = this.getFx(fxCount++);
          const qT = quant(tLocal, 24);
          fx.r = this.pool.req(`qmark|${qT}`, 250, 250, 0.5, (p) => drawQuestionMarkFx(p, qT));
          fx.use("hard");
          fx.mesh.visible = true;
          fx.mesh.position.set(kokoX + 0.25, 2.55, kokoZ);
          fx.mesh.scale.set(0.7, 0.7, 1);
          fx.mesh.quaternion.copy(cam.quaternion);
        }

        // 3 Supporting Airport Ground Crew standing visibly on the opposite green grass verge reacting!
        const crewSpecs: [number, number, string, string, "shock" | "smile" | "watch"][] = [
          [-8.6, 2.2, "#16a34a", "#facc15", isGolden ? "smile" : "shock"],
          [-9.4, 0.2, "#0284c7", "#f97316", isGolden ? "smile" : "shock"],
          [-8.8, -2.0, "#eab308", "#f8fafc", isGolden ? "smile" : "watch"],
        ];
        crewSpecs.forEach(([cx, cz, shirt, hat, cExpr], idx) => {
          const cPhase = quant((tSec * 0.75 + idx * 0.27) % 1, 24);
          placeActor(
            `crew|${idx}|${cExpr}|${shirt}|${hat}|${cPhase}|${blink}|${quant(l2d, 10)}`,
            (p) =>
              drawCrewWorker(p, {
                phase: cPhase,
                expr: cExpr,
                shirtColor: shirt,
                hatColor: hat,
                blink,
                lightAngle: l2d,
                armUp: isGolden || cExpr === "shock",
              }),
            cx,
            0,
            cz,
            1.1,
            false
          );
        });
      } else if (item.heroProp === "tire_spinup") {
        // Koko inspecting the spinning tire safely from the side shoulder
        placeActor(
          `koko|explain|inspect|earmuffs|${phase}|${talkPulse}|${blink}|${quant(l2d, 10)}`,
          (p) =>
            drawKokoHost(p, {
              phase,
              talkPulse,
              expr: "explain",
              pose: "inspect",
              accessory: "earmuffs",
              blink,
              lightAngle: l2d,
            }),
          2.2,
          0,
          2.6,
          1.05,
          true
        );
      } else if (activeTheme === "lab_blueprint") {
        // Maintenance Hangar Cast: Pak Koko actively working + 2 background mechanics on floor / scaffolding!
        if (item.heroProp === "burst_test_4x") {
          // Pak Koko actively pumping the orange hydraulic pump cart!
          placeActor(
            `koko|explain|pump|glasses|${phase}|${talkPulse}|${blink}|${quant(l2d, 10)}`,
            (p) =>
              drawKokoHost(p, {
                phase,
                talkPulse,
                expr: "explain",
                pose: "pump",
                accessory: "glasses",
                blink,
                lightAngle: l2d,
              }),
            -2.1,
            0,
            1.15,
            1.0,
            false
          );
        } else if (item.heroProp === "tire_cutaway_layers" || item.heroProp === "tire_pressure_200psi") {
          // Pak Koko having an "aha!" lightbulb moment or pointing beside the bay
          const pose: ExtendedHostPose = item.heroProp === "tire_cutaway_layers" ? "idea" : "point";
          const kx = item.heroProp === "tire_cutaway_layers" ? -2.25 : 2.35;
          placeActor(
            `koko|explain|${pose}|glasses|${phase}|${talkPulse}|${blink}|${quant(l2d, 10)}`,
            (p) =>
              drawKokoHost(p, {
                phase,
                talkPulse,
                expr: "explain",
                pose,
                accessory: "glasses",
                blink,
                lightAngle: l2d,
              }),
            kx,
            0,
            1.45,
            1.0,
            kx > 0
          );
          if (pose === "idea") {
            const fx = this.getFx(fxCount++);
            const qS = quant(tSec % 1, 20);
            fx.r = this.pool.req(`bulb|${qS}`, 250, 250, 0.5, (p) => drawLightbulbFx(p, qS));
            fx.use("hard");
            fx.mesh.visible = true;
            fx.mesh.position.set(kx + 0.15, 2.35, 1.45);
            fx.mesh.scale.set(0.75, 0.75, 1);
            fx.mesh.quaternion.copy(cam.quaternion);
          }
        }

        // Background Hangar Mechanics standing beside the yellow scaffolding on floor watching cleanly in-frame
        const hangarCrew: [number, number, number, string, string, "watch" | "shock" | "smile"][] = [
          [-3.1, 0, -2.8, "#16a34a", "#facc15", "watch"],
          [3.1, 0, -2.8, "#0284c7", "#ef4444", "shock"],
        ];
        hangarCrew.forEach(([cx, cy, cz, shirt, hat, cExpr], idx) => {
          const cPhase = quant((tSec * 0.7 + idx * 0.35) % 1, 20);
          placeActor(
            `hcrew|${idx}|${cExpr}|${shirt}|${hat}|${cPhase}|${blink}|${quant(l2d, 10)}`,
            (p) =>
              drawCrewWorker(p, {
                phase: cPhase,
                expr: cExpr,
                shirtColor: shirt,
                hatColor: hat,
                blink,
                lightAngle: l2d,
                armUp: cExpr === "shock",
              }),
            cx,
            cy,
            cz,
            1.05,
            cx > 0,
            false
          );
        });
      }
    }

    // Subtle Ep1/Ref-style spark bursts on key melting / breakthrough beats
    if (item.heroProp === "fusible_plug_melt" || item.heroProp === "burst_test_4x") {
      const fx = this.getFx(fxCount++);
      const qS = quant(tSec % 1, 24);
      fx.r = this.pool.req(`spk|${qS}`, 250, 250, 0.5, (p) => drawComicSparklesFx(p, qS));
      fx.use("hard");
      fx.mesh.visible = true;
      fx.mesh.position.set(item.heroProp === "fusible_plug_melt" ? 0.56 : 1.65, 2.15, 0.72);
      fx.mesh.scale.set(0.85, 0.85, 1);
      fx.mesh.quaternion.copy(cam.quaternion);
    }

    for (let i = actorCount; i < this.actors.length; i++) {
      this.actors[i].mesh.visible = false;
    }
    for (let i = fxCount; i < this.fxs.length; i++) {
      this.fxs[i].mesh.visible = false;
    }

    this.pool.flush();
    for (let i = 0; i < actorCount; i++) this.actors[i].bind();
    for (let i = 0; i < fxCount; i++) this.fxs[i].bind();

    return focus;
  }
}
