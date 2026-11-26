// StageWorldAdapter for Kok Iso Yo? Automated 2.5D-in-3D Engine (src/auto25d/).
// Orchestrates switchable 3D environments, animated 3D hero props, expressive 2.5D host,
// 2D comic FX billboards, dynamic 9:16 cameras, and day / golden / cobalt-night lighting.

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
  drawComicSparklesFx,
  drawCrossExplosionFx,
  drawKokoHost,
  drawPressureArrowsFx,
  drawQuestionMarkFx,
  drawShieldAuraFx,
  drawSmokePuffFx,
} from "./characters25d";
import { EnvRig, HeroPropRig, buildEnvironments, buildHeroPropRig } from "./prop3d";
import type { AutoCameraAngle, AutoCameraMotion, AutoComicFx, AutoSceneItem, AutoScenePlan } from "./types";

const BASE_CAMERAS: Record<AutoCameraAngle, { pos: V3; look: V3; fov: number; roll: number }> = {
  low_angle: { pos: [2.6, 1.2, 12.6], look: [0, 1.9, -0.4], fov: 42, roll: -0.02 },
  wide: { pos: [3.8, 3.2, 14.2], look: [0, 1.9, -0.6], fov: 43, roll: 0 },
  medium: { pos: [2.2, 2.2, 10.6], look: [0, 1.75, 0], fov: 41, roll: 0.01 },
  close_up: { pos: [1.45, 2.1, 7.6], look: [0, 1.85, 0], fov: 39, roll: -0.015 },
  extreme_close_up: { pos: [0.95, 2.0, 5.8], look: [0.15, 1.9, 0.1], fov: 37, roll: 0.015 },
  top_down: { pos: [0.25, 11.4, 4.2], look: [0, 1.2, 0], fov: 40, roll: 0 },
  high_angle: { pos: [-3.4, 6.2, 10.2], look: [0, 1.65, 0], fov: 41, roll: 0.015 },
  aerial: { pos: [-5.2, 7.6, 13.8], look: [0, 1.7, -0.6], fov: 43, roll: -0.01 },
};

function computeCameraForScene(
  scene: AutoSceneItem,
  frame: number,
  fps: number,
  kicks: [number, number][]
): Cam {
  const base = BASE_CAMERAS[scene.cameraAngle] ?? BASE_CAMERAS.medium;
  const dur = Math.max(1, scene.b - scene.a);
  const localF = Math.max(0, frame - scene.a);
  const u = Math.min(1, localF / dur);
  const motion: AutoCameraMotion = scene.cameraMotion ?? "push_in";

  let pos: V3 = [...base.pos] as V3;
  let look: V3 = [...base.look] as V3;
  let fov = base.fov;
  let roll = base.roll;

  if (motion === "push_in") {
    const d = dolly(base.pos, base.look, pushK(frame, scene.a, 0.0028), { fov, roll });
    pos = d.pos;
    look = d.look;
  } else if (motion === "pull_back") {
    const k = 0.88 + u * 0.2;
    const d = dolly(base.pos, base.look, k, { fov, roll });
    pos = d.pos;
    look = d.look;
  } else if (motion === "orbit") {
    const radius = Math.hypot(base.pos[0] - base.look[0], base.pos[2] - base.look[2]);
    const a0 = Math.atan2(base.pos[0] - base.look[0], base.pos[2] - base.look[2]);
    const a = a0 + (u - 0.5) * 0.52;
    pos = [base.look[0] + Math.sin(a) * radius, base.pos[1], base.look[2] + Math.cos(a) * radius];
  } else if (motion === "pan_right") {
    pos = [base.pos[0] - 1.1 + u * 2.2, base.pos[1], base.pos[2]];
    look = [base.look[0] - 0.4 + u * 0.8, base.look[1], base.look[2]];
  } else if (motion === "tilt_up") {
    pos = [base.pos[0], base.pos[1] - 0.35 + u * 0.7, base.pos[2] * (1 - u * 0.06)];
    look = [base.look[0], base.look[1] - 0.3 + u * 0.8, base.look[2]];
  } else if (motion === "crane_down") {
    pos = [base.pos[0], base.pos[1] + 0.9 - u * 1.1, base.pos[2] * (1 - u * 0.06)];
  }

  const cam: Cam = { pos, look, fov, roll };
  return applyKick(cam, kickAt(frame / fps, kicks, fps));
}

const quant = (v: number, n = 30) => Math.round(v * n) / n;

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
    this.sunRig = createSunRig(R, 512);
    this.clouds = createCloudRing(R, 6);
    this.envRig = buildEnvironments(R);
    this.propRig = buildHeroPropRig(R);

    this.kicks = plan.scenes
      .filter((s) => s.kickAtStart)
      .map((s) => [s.a / (plan.fps || 30), 0.75] as [number, number]);
  }

  private getActor(i: number) {
    while (this.actors.length <= i) this.actors.push(new ActorBillboard(this.root));
    return this.actors[i];
  }

  private getFx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new FxBillboard(this.root));
    return this.fxs[i];
  }

  private applyNightStudioLook(camPos: THREE.Vector3, scene: THREE.Scene) {
    // Deep cobalt blue studio palette (per VISUAL_STYLE_GUIDE.md §2.6: readable on dim mobile screens)
    const nightStops = ["#12264d", "#163263", "#1b3e78", "#132952", "#0b1733"];
    nightStops.forEach((h, i) => untone(h, this.sky.mat.uniforms["c" + i].value));
    const e = [0, 5, 12, 24, 48].map((deg) => THREE.MathUtils.degToRad(deg));
    this.sky.mat.uniforms.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.mesh.position.copy(camPos);

    untone("#13284f", this.fog.color);
    this.fog.near = 28;
    this.fog.far = 220;
    scene.fog = this.fog;

    this.sunRig.hemi.color.set("#7dd3fc");
    this.sunRig.hemi.groundColor.set("#1e3a8a");
    this.sunRig.hemi.intensity = 0.75;
    this.sunRig.sun.color.set("#fff7ed");
    this.sunRig.sun.intensity = 2.6;
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
    cam.layers.enable(3); // NOINK layer

    const baseLight: LightMode = item.lightMode === "golden" ? "golden" : "day";
    applyLightUniforms(baseLight);
    updateSkyAndFog(this.sky, this.fog, cam.position, scene, baseLight);
    const sunDir = updateCameraRelativeSun(this.sunRig, cam.position, focus, baseLight);

    if (item.lightMode === "night") {
      this.applyNightStudioLook(cam.position, scene);
      this.clouds.clouds.forEach((m) => {
        m.visible = false;
      });
    } else {
      this.clouds.clouds.forEach((m) => {
        m.visible = true;
      });
      this.clouds.update(cam.position, baseLight);
    }

    // Active 3D Environment + Hero Assembly
    this.envRig.setTheme(item.envTheme ?? this.plan.defaultEnvTheme);
    this.propRig.update(item.heroProp, tLocal, tSec);

    // 2.5D Host + Comic FX Billboards
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const l2d = lightAngle2D(sunDir, right, false);
    const blobTint = LIGHTS[baseLight].blob;

    let actorCount = 0;
    let fxCount = 0;

    if (item.host?.visible) {
      const a = this.getActor(actorCount++);
      const phase = quant((tSec * 0.75) % 1, 8);
      const talkPulse = Math.round(Math.abs(Math.sin(tSec * 10)) * 2) / 2;
      const blink = tSec % 2.4 < 0.12 ? 1 : 0;
      const k = 0.85;
      const acc = item.host.accessory ?? "none";

      a.r = this.pool.req(
        `koko|${item.host.expr}|${item.host.pose}|${acc}|${phase}|${talkPulse}|${blink}|${quant(l2d, 4)}`,
        Math.round(600 * k),
        Math.round(1000 * k),
        k,
        (p) =>
          drawKokoHost(p, {
            phase,
            talkPulse,
            expr: item.host.expr,
            pose: item.host.pose,
            accessory: acc,
            blink,
            lightAngle: l2d,
          })
      );
      a.mesh.visible = true;
      a.mesh.position.set(item.host.x, 0, item.host.z);
      a.mesh.rotation.set(
        0,
        Math.atan2(cam.position.x - item.host.x, cam.position.z - item.host.z),
        0
      );
      const sc = 0.88;
      a.mesh.scale.set(item.host.mirror ? -sc : sc, sc, sc);

      // Ground contact blob shadow under host
      const blob = this.getFx(fxCount++);
      blob.r = this.pool.req(`blob|${baseLight}`, 128, 128, 1, (p) => drawContactBlob(p, blobTint));
      blob.use("blob");
      blob.mesh.visible = true;
      blob.mesh.position.set(item.host.x, 0.03, item.host.z);
      blob.mesh.rotation.set(-Math.PI / 2, 0, 0);
      blob.mesh.scale.set(1.4, 1.4, 1);
    }

    // Comic 2D FX billboards positioned cleanly around hero subject (quantized for fast CanvasPool reuse)
    const fxList: AutoComicFx[] = item.comicFx ?? [];
    fxList.forEach((fxKind, idx) => {
      const fx = this.getFx(fxCount++);
      const qT = quant(tLocal, 8);
      const qS = quant(tSec % 2, 6);
      const offsetX = idx === 0 ? 1.55 : -1.55;
      const offsetY = idx === 0 ? 3.2 : 2.9;

      if (fxKind === "question_mark") {
        fx.r = this.pool.req(`qmark|${qT}`, 250, 250, 0.5, (p) => drawQuestionMarkFx(p, qT));
        fx.use("hard");
        fx.mesh.position.set(offsetX, offsetY, 0.5);
        fx.mesh.scale.set(1.5, 1.5, 1);
      } else if (fxKind === "cross_explosion") {
        fx.r = this.pool.req(`xexp|${qS}`, 250, 250, 0.5, (p) => drawCrossExplosionFx(p, qS));
        fx.use("hard");
        fx.mesh.position.set(1.35, 2.85, 0.6);
        fx.mesh.scale.set(1.65, 1.65, 1);
      } else if (fxKind === "pressure_arrows") {
        fx.r = this.pool.req(`parr|${qS}`, 250, 250, 0.5, (p) => drawPressureArrowsFx(p, qS));
        fx.use("hard");
        fx.mesh.position.set(0, 1.9, 1.55);
        fx.mesh.scale.set(2.9, 2.9, 1);
      } else if (fxKind === "shield_aura") {
        fx.r = this.pool.req(`shld|${qS}`, 250, 250, 0.5, (p) => drawShieldAuraFx(p, qS));
        fx.use("soft");
        fx.mesh.position.set(0, 1.85, 1.5);
        fx.mesh.scale.set(3.2, 3.2, 1);
      } else if (fxKind === "smoke_puffs") {
        fx.r = this.pool.req(`smk|${qS}`, 250, 250, 0.5, (p) => drawSmokePuffFx(p, qS));
        fx.use("soft");
        fx.mesh.position.set(-1.3, 0.95, 0.7);
        fx.mesh.scale.set(2.2, 1.6, 1);
      } else {
        fx.r = this.pool.req(`spk|${qS}`, 250, 250, 0.5, (p) => drawComicSparklesFx(p, qS));
        fx.use("hard");
        fx.mesh.position.set(offsetX, offsetY, 0.4);
        fx.mesh.scale.set(1.8, 1.8, 1);
      }

      fx.mesh.visible = true;
      fx.mesh.quaternion.copy(cam.quaternion);
    });

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
