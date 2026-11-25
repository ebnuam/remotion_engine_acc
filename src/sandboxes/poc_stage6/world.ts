// Procedural 3D Botany Field Station + Animated Spectrum Photon Orbs for Stage 6 PoC

import * as THREE from "three";
import {
  ActorBillboard,
  CanvasPool,
  FxBillboard,
  StageWorldAdapter,
  StaticBatch,
  addBushCluster,
  addRockCluster,
  addStorybookTree,
  applyLightUniforms,
  beamHD,
  cobbleHD,
  createCloudRing,
  createMaterialCache,
  createSkyDome,
  createSunRig,
  createWaterPlane,
  grassHD,
  planksHD,
  stoneHD,
  updateCameraRelativeSun,
  updateSkyAndFog,
} from "../../shared/kokisoyo25d";
import { FPS, SHOTS, camAt } from "./story";
import { buildCast } from "./cast";

function placeBox(
  batch: StaticBatch,
  mat: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(1, 1, 1)
  );
  batch.add(geo, mat, m);
}

export class PocWorld implements StageWorldAdapter {
  root = new THREE.Group();
  private pool = new CanvasPool();
  private actors: ActorBillboard[] = [];
  private fxs: FxBillboard[] = [];
  private sky = createSkyDome();
  private fog = new THREE.Fog("#b8d0ec", 25, 300);
  private sunRig: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight };
  private clouds: ReturnType<typeof createCloudRing>;
  private water: ReturnType<typeof createWaterPlane>;

  private prismMesh: THREE.Mesh;
  private leafGroup: THREE.Group;
  private redOrbs: THREE.Mesh[] = [];
  private blueOrbs: THREE.Mesh[] = [];
  private greenOrbs: THREE.Mesh[] = [];

  constructor() {
    const R = this.root;
    R.add(this.sky.mesh);
    this.sunRig = createSunRig(R, 2048);
    this.clouds = createCloudRing(R, 9);

    const mats = createMaterialCache();
    const grassMat = mats.lam("grass", () => ({ map: grassHD() }));
    const pathMat = mats.lam("cobble", () => ({ map: cobbleHD() }));
    const plankMat = mats.lam("plank", () => ({ map: planksHD() }));
    const beamMat = mats.lam("beam", () => ({ map: beamHD() }));
    const barkMat = mats.lam("bark", () => ({ color: "#8a5a3c" }));
    const leafMatA = mats.lam("leafA", () => ({ color: "#58b947" }));
    const leafMatB = mats.lam("leafB", () => ({ color: "#4aa63d" }));
    const rockMat = mats.lam("rock", () => ({ map: stoneHD("pocRock") }));
    const heroLeafMat = mats.lam("heroLeaf", () => ({ color: "#22c55e" }), 1.15);
    const stemMat = mats.lam("stem", () => ({ color: "#15803d" }));
    const brassMat = mats.phong("brass", () => ({ color: "#f59e0b", shininess: 45 }));

    const batch = new StaticBatch();

    // Sunlit grassy foreground meadow (z in [-13, +200]) + far shore (z in [-220, -35]) leaving river channel open
    const nearGround = new THREE.PlaneGeometry(400, 213);
    nearGround.rotateX(-Math.PI / 2);
    nearGround.translate(0, 0, 93.5);
    const nuv = nearGround.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < nuv.count; i++) nuv.setXY(i, nuv.getX(i) * 44, nuv.getY(i) * 23);
    batch.add(nearGround, grassMat);

    const farGround = new THREE.PlaneGeometry(400, 200);
    farGround.rotateX(-Math.PI / 2);
    farGround.translate(0, 0, -135);
    const fuv = farGround.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * 44, fuv.getY(i) * 22);
    batch.add(farGround, grassMat);

    // Riverbank wooden rim along z = -13
    placeBox(batch, beamMat, 44, 0.22, 0.55, 0, 0.05, -13.1);

    // Cobble terrace pad beneath researchers & workbench
    const padGeo = new THREE.CylinderGeometry(3.4, 3.6, 0.06, 24);
    batch.add(padGeo, pathMat, new THREE.Matrix4().makeTranslation(0, 0.02, -0.1));

    // River visible between z = -13 and z = -35
    this.water = createWaterPlane(400, 26, -0.08);
    this.water.mesh.position.z = -24;
    R.add(this.water.mesh);

    // Wooden field workbench at (0.05, 0, -0.45)
    const bx = 0.05;
    const bz = -0.45;
    placeBox(batch, plankMat, 1.35, 0.1, 0.72, bx, 0.86, bz);
    for (const [lx, lz] of [
      [-0.56, -0.26],
      [0.56, -0.26],
      [-0.56, 0.26],
      [0.56, 0.26],
    ]) {
      placeBox(batch, beamMat, 0.09, 0.84, 0.09, bx + lx, 0.42, bz + lz);
    }
    placeBox(batch, beamMat, 1.12, 0.07, 0.07, bx, 0.28, bz);

    // Specimen pedestal + tripod base on right of workbench
    placeBox(batch, beamMat, 0.34, 0.14, 0.34, bx - 0.05, 0.98, bz);
    placeBox(batch, brassMat, 0.1, 0.34, 0.1, bx + 0.48, 1.07, bz);

    // Surrounding storybook trees, bushes & boulders (clear of camera corridor)
    const trees: [number, number, number, number][] = [
      [-5.2, -5.8, 41, 5.8],
      [5.4, -6.0, 42, 6.2],
      [-8.8, -8.8, 43, 6.8],
      [8.4, -8.5, 44, 6.5],
      [-3.4, -10.5, 45, 5.3],
      [3.5, -10.0, 46, 5.6],
    ];
    trees.forEach(([x, z, seed, h], i) =>
      addStorybookTree(batch, barkMat, i % 2 === 0 ? leafMatA : leafMatB, [x, 0, z], seed, h)
    );

    const bushes: [number, number, number, number][] = [
      [-3.1, -2.5, 61, 1.15],
      [3.2, -2.4, 62, 1.05],
      [-6.0, -3.5, 63, 1.3],
      [6.1, -3.7, 64, 1.2],
    ];
    bushes.forEach(([x, z, seed, s], i) =>
      addBushCluster(batch, i % 2 === 0 ? leafMatA : leafMatB, [x, 0, z], seed, s)
    );

    addRockCluster(batch, rockMat, [-2.5, 0, -4.4], 81, 1.05);
    addRockCluster(batch, rockMat, [2.7, 0, -4.7], 82, 0.95);

    batch.build(R, true, true);

    // Animated Crystal Prism on brass post
    const prismGeo = new THREE.OctahedronGeometry(0.18, 0);
    const prismMat = new THREE.MeshPhongMaterial({
      color: "#93c5fd",
      emissive: "#1d4ed8",
      emissiveIntensity: 0.35,
      shininess: 90,
      transparent: true,
      opacity: 0.9,
    });
    this.prismMesh = new THREE.Mesh(prismGeo, prismMat);
    this.prismMesh.position.set(bx + 0.48, 1.34, bz);
    this.prismMesh.castShadow = true;
    R.add(this.prismMesh);

    // Animated 3D Giant Botanical Leaf Specimen
    this.leafGroup = new THREE.Group();
    this.leafGroup.position.set(bx - 0.05, 1.28, bz);
    const bladeGeo = new THREE.SphereGeometry(0.32, 18, 14);
    bladeGeo.scale(0.85, 1.45, 0.14);
    const blade = new THREE.Mesh(bladeGeo, heroLeafMat);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.leafGroup.add(blade);

    const ribGeo = new THREE.CylinderGeometry(0.025, 0.032, 0.72, 8);
    const rib = new THREE.Mesh(ribGeo, stemMat);
    rib.position.y = -0.05;
    this.leafGroup.add(rib);
    R.add(this.leafGroup);

    // Animated spectrum photon orbs (red + blue absorbed; green reflected upward!)
    const orbGeo = new THREE.SphereGeometry(0.065, 12, 10);
    const redMat = new THREE.MeshBasicMaterial({ color: "#fb7185" });
    const blueMat = new THREE.MeshBasicMaterial({ color: "#38bdf8" });
    const greenMat = new THREE.MeshBasicMaterial({ color: "#4ade80" });
    for (let i = 0; i < 3; i++) {
      const rOrb = new THREE.Mesh(orbGeo, redMat);
      const bOrb = new THREE.Mesh(orbGeo, blueMat);
      const gOrb = new THREE.Mesh(orbGeo, greenMat);
      R.add(rOrb, bOrb, gOrb);
      this.redOrbs.push(rOrb);
      this.blueOrbs.push(bOrb);
      this.greenOrbs.push(gOrb);
    }
  }

  private getActor(i: number) {
    while (this.actors.length <= i) this.actors.push(new ActorBillboard(this.root));
    return this.actors[i];
  }

  private getFx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new FxBillboard(this.root));
    return this.fxs[i];
  }

  update(shotId: number, frame: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3 {
    const shot = SHOTS.find((s) => s.id === shotId) ?? SHOTS[0];
    const light = shot.light;
    const tSec = frame / FPS;

    const c = camAt(shotId, frame);
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

    applyLightUniforms(light);
    updateSkyAndFog(this.sky, this.fog, cam.position, scene, light);
    const sunDir = updateCameraRelativeSun(this.sunRig, cam.position, focus, light);
    this.clouds.update(cam.position, light);
    this.water.update(tSec, light);

    // Animate prism rotation & gentle leaf sway
    this.prismMesh.rotation.y = tSec * 1.4;
    this.prismMesh.rotation.z = Math.sin(tSec * 2.0) * 0.12;
    this.leafGroup.rotation.y = Math.sin(tSec * 1.1) * 0.14;
    this.leafGroup.rotation.z = Math.sin(tSec * 1.8) * 0.05;

    // Animate photon streams from prism (x=0.53, y=1.34) into leaf (x=0.0, y=1.28)
    const pSrc = new THREE.Vector3(0.53, 1.34, -0.45);
    const pLeaf = new THREE.Vector3(0.0, 1.28, -0.42);
    const pBounce = new THREE.Vector3(-0.32, 2.25, 0.25);

    for (let i = 0; i < 3; i++) {
      const u = (tSec * 0.9 + i / 3) % 1;
      // Red & blue travel from prism to leaf surface (absorbed)
      this.redOrbs[i].position.lerpVectors(pSrc, pLeaf, u);
      this.redOrbs[i].position.y += Math.sin(u * Math.PI) * 0.12;
      this.redOrbs[i].scale.setScalar(1.0 - u * 0.65);

      this.blueOrbs[i].position.lerpVectors(pSrc, pLeaf, (u + 0.18) % 1);
      this.blueOrbs[i].position.y -= Math.sin(((u + 0.18) % 1) * Math.PI) * 0.08;
      this.blueOrbs[i].scale.setScalar(1.0 - ((u + 0.18) % 1) * 0.65);

      // Green bounces away from leaf toward sky/camera!
      const gu = (tSec * 0.95 + i / 3) % 1;
      this.greenOrbs[i].position.lerpVectors(pLeaf, pBounce, gu);
      this.greenOrbs[i].scale.setScalar(0.85 + Math.sin(gu * Math.PI) * 0.45);
    }

    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const staged = buildCast(shotId, tSec, light, cam.position, right, sunDir);

    staged.actors.forEach((p, idx) => {
      const a = this.getActor(idx);
      a.r = this.pool.req(p.key, p.size[0], p.size[1], p.size[2], p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      const sc = p.scale ?? 1;
      a.mesh.scale.set(p.mirror ? -sc : sc, sc, sc);
    });
    for (let i = staged.actors.length; i < this.actors.length; i++) {
      this.actors[i].mesh.visible = false;
    }

    staged.fx.forEach((p, idx) => {
      const e = this.getFx(idx);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(p.kind);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, 0);
      else e.mesh.quaternion.copy(cam.quaternion);
      e.mesh.scale.set(p.w, p.h, 1);
    });
    for (let i = staged.fx.length; i < this.fxs.length; i++) {
      this.fxs[i].mesh.visible = false;
    }

    this.pool.flush();
    for (let i = 0; i < staged.actors.length; i++) this.actors[i].bind();
    for (let i = 0; i < staged.fx.length; i++) this.fxs[i].bind();

    return focus;
  }
}
