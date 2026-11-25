// Procedural 3D World for Kok Iso Yo? Episode Template
// Uses twoTone materials, NEUTRAL sky dome, animated river, and procedural storybook trees/bushes/rocks.
// Zero dependency on empty external GLBs.

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
  createCloudRing,
  createMaterialCache,
  createSkyDome,
  createSunRig,
  createWaterPlane,
  grassHD,
  stoneHD,
  updateCameraRelativeSun,
  updateSkyAndFog,
} from "../../src/shared/kokisoyo25d";
import { FPS, SHOTS, camAt } from "./story";
import { buildCast } from "./cast";

export class EpisodeWorld implements StageWorldAdapter {
  root = new THREE.Group();
  private pool = new CanvasPool();
  private actors: ActorBillboard[] = [];
  private fxs: FxBillboard[] = [];
  private sky = createSkyDome();
  private fog = new THREE.Fog("#b8d0ec", 25, 300);
  private sunRig: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight };
  private clouds: ReturnType<typeof createCloudRing>;
  private water: ReturnType<typeof createWaterPlane>;

  constructor() {
    const R = this.root;
    R.add(this.sky.mesh);
    this.sunRig = createSunRig(R, 2048);
    this.clouds = createCloudRing(R, 9);

    const mats = createMaterialCache();
    const grassMat = mats.lam("grass", () => ({ map: grassHD() }));
    const barkMat = mats.lam("bark", () => ({ color: "#8a5a3c" }));
    const leafMatA = mats.lam("leafA", () => ({ color: "#62ae4c" }));
    const leafMatB = mats.lam("leafB", () => ({ color: "#56a447" }));
    const rockMat = mats.lam("rock", () => ({ map: stoneHD("rockHD") }));

    const batch = new StaticBatch();

    // Main sunlit terrain plane (y = 0)
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    groundGeo.rotateX(-Math.PI / 2);
    // Repeat grass UVs cleanly
    const uv = groundGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 40, uv.getY(i) * 40);
    batch.add(groundGeo, grassMat);

    // Background river behind z = -12
    this.water = createWaterPlane(400, 28, -0.08);
    this.water.mesh.position.z = -26;
    R.add(this.water.mesh);

    // Procedural storybook trees, bushes & rocks placed outside foreground sight-line corridor
    const trees: [number, number, number, number][] = [
      [-5.5, -5.5, 101, 5.8],
      [5.2, -6.2, 102, 6.2],
      [-9.5, -9.0, 103, 7.0],
      [9.0, -8.5, 104, 6.6],
      [-3.5, -10.5, 105, 5.4],
      [3.2, -10.2, 106, 5.9],
    ];
    trees.forEach(([x, z, seed, h], idx) =>
      addStorybookTree(batch, barkMat, idx % 2 === 0 ? leafMatA : leafMatB, [x, 0, z], seed, h)
    );

    const bushes: [number, number, number, number][] = [
      [-3.2, -2.8, 201, 1.1],
      [3.0, -2.5, 202, 1.0],
      [-6.8, -3.5, 203, 1.3],
      [6.4, -3.9, 204, 1.2],
    ];
    bushes.forEach(([x, z, seed, s], idx) =>
      addBushCluster(batch, idx % 2 === 0 ? leafMatA : leafMatB, [x, 0, z], seed, s)
    );

    addRockCluster(batch, rockMat, [-2.4, 0, -4.4], 301, 1.1);
    addRockCluster(batch, rockMat, [2.6, 0, -4.8], 302, 0.9);

    batch.build(R, true, true);
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
    cam.layers.enable(3); // NOINK layer visible to camera

    applyLightUniforms(light);
    updateSkyAndFog(this.sky, this.fog, cam.position, scene, light);
    const sunDir = updateCameraRelativeSun(this.sunRig, cam.position, focus, light);
    this.clouds.update(cam.position, light);
    this.water.update(tSec, light);

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
