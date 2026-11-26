// Bespoke 3D Rainforest & Conservation Habitat World Adapter for Episodes 003, 004, and 005
// Strictly isolated from Episode 002 & Episode 001 so Episode 002's active render is never disturbed.
// Adds contextual Arenga obtusifolia (langkap) palm shade clusters for Ep 005 and varied afternoon/dusk/mist moods.

import * as THREE from "three";
import { DocWorldAdapter } from "../../../shared/doc3d/StageDoc3D";
import { JavanRhinoAsset, RhinoPoseMode } from "../../episode002_badak_jawa/world/JavanRhinoAsset";
import {
  createBarkTextures,
  createBroadleafTexture,
  createCanopyLeafTexture,
  createFernFrondTexture,
  createForestFloorTextures,
  createMistTexture,
} from "../../episode002_badak_jawa/textures/rainforestTextures";
import { Series3DSceneMode } from "../seriesStory";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function terrainHeight(x: number, z: number): number {
  const wx = x + 0.85;
  const wz = z - 2.05;
  const wDist = Math.hypot(wx * 0.82, wz * 1.12);
  const wallow = wDist < 2.2 ? -0.2 * Math.cos((wDist / 2.2) * (Math.PI / 2)) ** 2 : 0;
  const edgeRise = Math.max(0, Math.abs(x) - 3.0) * 0.13;
  const backRise = z < -5.5 ? (-5.5 - z) * 0.08 : 0;
  const micro = Math.sin(x * 0.55) * Math.cos(z * 0.45) * 0.065 + Math.sin(x * 1.3 + z * 0.9) * 0.025;
  const clearingFlat = THREE.MathUtils.smoothstep(Math.hypot(x, z), 1.45, 3.3);
  return wallow + (edgeRise + backRise + micro) * clearingFlat;
}

function buildFlutedButtressTrunk(height: number, baseRadius: number, fluteCount: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(baseRadius * 0.48, baseRadius, height, 26, 18, false);
  geo.translate(0, height * 0.5, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const u = THREE.MathUtils.clamp(y / height, 0, 1);
    if (Math.hypot(x, z) < 1e-4) continue;
    const theta = Math.atan2(z, x);
    const rootMask = Math.pow(Math.max(0, 1 - u / 0.3), 2.35);
    const fluteWave = 0.5 + 0.5 * Math.cos(theta * fluteCount + seed * 1.7 + Math.sin(theta * 2) * 0.35);
    const fluteFlare = rootMask * (0.42 + 0.95 * Math.pow(fluteWave, 1.8));
    const barkWave = 0.045 * Math.sin(u * 14 + seed) * Math.cos(theta * 3 + seed);
    const scaleR = 1 + fluteFlare + barkWave;
    pos.setXYZ(
      i,
      x * scaleR + Math.sin(u * Math.PI * 0.85) * Math.cos(seed) * 0.26,
      y,
      z * scaleR + Math.sin(u * Math.PI * 0.75) * Math.sin(seed) * 0.22
    );
  }
  geo.computeVertexNormals();
  return geo;
}

export interface SeriesWorldQuery {
  mode: Series3DSceneMode;
  progress: number;
}

export class SeriesWorld implements DocWorldAdapter {
  public root = new THREE.Group();
  private rhino = new JavanRhinoAsset();
  private sunLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private bounceFill: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private skyMat: THREE.ShaderMaterial;
  private skyMesh: THREE.Mesh;
  private mistPlanes: THREE.Mesh[] = [];
  private sunShafts: THREE.Mesh[] = [];
  private fgFoliageGroup = new THREE.Group();
  private langkapGroup = new THREE.Group();
  private queryState: (frame: number) => SeriesWorldQuery;

  constructor(queryState: (frame: number) => SeriesWorldQuery) {
    this.queryState = queryState;

    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color("#527b99") },
        uMid: { value: new THREE.Color("#95b5c0") },
        uHor: { value: new THREE.Color("#dce2d5") },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 uTop,uMid,uHor; varying vec3 vDir; void main(){ float h=clamp(vDir.y,0.0,1.0); vec3 c=mix(uHor,uMid,smoothstep(0.0,0.26,h)); c=mix(c,uTop,smoothstep(0.22,0.8,h)); gl_FragColor=vec4(c,1.0); }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyMesh = new THREE.Mesh(new THREE.SphereGeometry(220, 28, 14), this.skyMat);
    this.skyMesh.renderOrder = -10;
    this.root.add(this.skyMesh);

    this.hemiLight = new THREE.HemisphereLight("#d1e4ef", "#344429", 1.25);
    this.root.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight("#fff1d6", 3.35);
    this.sunLight.position.set(11, 18, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 55;
    const sc = this.sunLight.shadow.camera;
    sc.left = -13;
    sc.right = 13;
    sc.top = 13;
    sc.bottom = -13;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.025;
    this.root.add(this.sunLight, this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight("#d6ece0", 1.15);
    this.rimLight.position.set(-10, 9, -10);
    this.root.add(this.rimLight);

    this.bounceFill = new THREE.DirectionalLight("#c9d4be", 0.78);
    this.bounceFill.position.set(6, 2.5, 9);
    this.root.add(this.bounceFill);

    this.buildTerrain();
    this.buildTreesAndCanopy();
    this.buildUnderstory();
    this.buildLangkapPalmOvergrowth();
    this.buildMistAndShafts();
    this.buildForegroundFraming();
    this.root.add(this.rhino.root);
  }

  public async load(): Promise<void> {
    await this.rhino.load();
  }

  private buildTerrain() {
    const floorTex = createForestFloorTextures();
    const groundGeo = new THREE.PlaneGeometry(66, 66, 56, 56);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    }
    groundGeo.computeVertexNormals();

    const ground = new THREE.Mesh(
      groundGeo,
      new THREE.MeshStandardMaterial({
        map: floorTex.map,
        bumpMap: floorTex.bumpMap,
        bumpScale: 0.09,
        roughness: 0.88,
        metalness: 0.02,
      })
    );
    ground.receiveShadow = true;
    this.root.add(ground);

    const waterGeo = new THREE.CircleGeometry(2.05, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(
      waterGeo,
      new THREE.MeshStandardMaterial({
        color: "#384439",
        roughness: 0.14,
        metalness: 0.22,
        transparent: true,
        opacity: 0.86,
      })
    );
    water.position.set(-0.85, -0.068, 2.05);
    water.receiveShadow = true;
    this.root.add(water);
  }

  private buildTreesAndCanopy() {
    const rand = mulberry32(4409);
    const barkTex = createBarkTextures();
    const barkMat = new THREE.MeshStandardMaterial({
      map: barkTex.map,
      bumpMap: barkTex.bumpMap,
      bumpScale: 0.08,
      roughness: 0.92,
      metalness: 0.02,
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      map: createCanopyLeafTexture(),
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.66,
      metalness: 0.02,
    });

    const treeSpecs: [number, number, number, number][] = [
      [-4.6, 3.0, 14.0, 0.42],
      [4.9, 2.6, 14.8, 0.46],
      [-5.2, -1.8, 15.6, 0.5],
      [4.7, -2.4, 14.5, 0.45],
      [-3.1, -5.6, 16.5, 0.54],
      [2.8, -6.2, 15.8, 0.5],
      [-6.8, -7.0, 17.0, 0.56],
      [6.4, -6.8, 16.2, 0.52],
      [-1.0, -9.8, 17.5, 0.54],
      [3.9, -10.8, 16.6, 0.5],
      [-4.6, -12.4, 18.0, 0.58],
      [1.1, -14.2, 18.5, 0.6],
      [7.6, -11.8, 17.0, 0.54],
      [-8.4, -3.6, 15.5, 0.5],
      [8.1, -1.9, 15.0, 0.48],
      [2.6, -15.4, 17.6, 0.52],
      [6.2, -14.2, 17.2, 0.54],
      [-3.4, -16.5, 18.8, 0.6],
      [-0.4, -18.5, 19.0, 0.62],
    ];

    const canopyMatrices: THREE.Matrix4[] = [];
    const canopyColors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    treeSpecs.forEach(([tx, tz, h, rBase], idx) => {
      const ty = terrainHeight(tx, tz) - 0.18;
      const g = new THREE.Group();
      g.position.set(tx, ty, tz);

      const trunkMesh = new THREE.Mesh(buildFlutedButtressTrunk(h, rBase, 4 + (idx % 3), idx * 2.17 + 0.6), barkMat);
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      g.add(trunkMesh);

      for (let br = 0; br < 4; br++) {
        const ang = (br / 4) * Math.PI * 2 + rand() * 0.7;
        const brLen = 2.6 + rand() * 2.3;
        const brMesh = new THREE.Mesh(new THREE.CylinderGeometry(rBase * 0.1, rBase * 0.24, brLen, 8), barkMat);
        const startY = h * (0.48 + rand() * 0.34);
        brMesh.position.set(Math.sin(ang) * brLen * 0.44, startY + brLen * 0.24, Math.cos(ang) * brLen * 0.44);
        brMesh.rotation.set(Math.cos(ang) * 0.92, 0, -Math.sin(ang) * 0.92);
        brMesh.castShadow = true;
        g.add(brMesh);

        for (let lf = 0; lf < 8; lf++) {
          dummy.position.set(
            tx + Math.sin(ang) * brLen * 0.72 + (rand() - 0.5) * 3.0,
            ty + startY + brLen * 0.45 + (rand() - 0.45) * 2.4,
            tz + Math.cos(ang) * brLen * 0.72 + (rand() - 0.5) * 3.0
          );
          dummy.rotation.set((rand() - 0.5) * 1.15, rand() * Math.PI * 2, (rand() - 0.5) * 1.1);
          dummy.scale.setScalar(2.4 + rand() * 2.0);
          dummy.updateMatrix();
          canopyMatrices.push(dummy.matrix.clone());
          const s = 0.72 + rand() * 0.38;
          canopyColors.push(new THREE.Color(s * 0.92, s * 1.04, s * 0.85));
        }
      }
      this.root.add(g);
    });

    for (let i = 0; i < 185; i++) {
      const isUpper = i < 75;
      const lx = (rand() - 0.5) * (isUpper ? 22 : 24);
      const ly = isUpper ? 5.8 + rand() * 5.8 : 0.9 + rand() * 5.2;
      const lz = isUpper ? -18 + rand() * 24 : -5.6 - rand() * 14.5;
      if (!isUpper && lz > -7.5 && Math.abs(lx) < 2.2 && ly < 3.6) continue;
      dummy.position.set(lx, ly, lz);
      dummy.rotation.set((rand() - 0.5) * 0.85, rand() * Math.PI * 2, (rand() - 0.5) * 0.85);
      dummy.scale.setScalar((isUpper ? 2.8 : 2.5) + rand() * 2.1);
      dummy.updateMatrix();
      canopyMatrices.push(dummy.matrix.clone());
      const s = (isUpper ? 0.78 : 0.68) + rand() * 0.34;
      canopyColors.push(new THREE.Color(s * 0.9, s * 1.02, s * 0.84));
    }

    const cardA = new THREE.PlaneGeometry(1, 1, 2, 2);
    const pA = cardA.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pA.count; i++) {
      pA.setZ(i, -(pA.getX(i) ** 2 + pA.getY(i) ** 2) * 0.16);
    }
    cardA.computeVertexNormals();

    const instCanopy = new THREE.InstancedMesh(cardA, canopyMat, canopyMatrices.length);
    instCanopy.castShadow = true;
    instCanopy.receiveShadow = false;
    canopyMatrices.forEach((m, idx) => {
      instCanopy.setMatrixAt(idx, m);
      instCanopy.setColorAt(idx, canopyColors[idx]);
    });
    instCanopy.instanceMatrix.needsUpdate = true;
    if (instCanopy.instanceColor) instCanopy.instanceColor.needsUpdate = true;
    this.root.add(instCanopy);
  }

  private buildUnderstory() {
    const rand = mulberry32(7823);
    const fernMat = new THREE.MeshStandardMaterial({
      map: createFernFrondTexture(),
      alphaTest: 0.36,
      side: THREE.DoubleSide,
      roughness: 0.62,
      metalness: 0.02,
    });
    const broadMat = new THREE.MeshStandardMaterial({
      map: createBroadleafTexture(),
      alphaTest: 0.38,
      side: THREE.DoubleSide,
      roughness: 0.58,
      metalness: 0.03,
    });

    const fernGeo = new THREE.PlaneGeometry(0.92, 1.45, 2, 5);
    fernGeo.translate(0, 0.725, 0);
    const fp = fernGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fp.count; i++) {
      const y = Math.max(0, fp.getY(i));
      const u = THREE.MathUtils.clamp(y / 1.45, 0, 1);
      fp.setZ(i, Math.pow(u, 1.8) * 0.55);
      fp.setY(i, y * (1 - u * 0.14));
    }
    fernGeo.computeVertexNormals();
    fernGeo.computeBoundingSphere();

    const broadGeo = new THREE.PlaneGeometry(1.0, 1.22, 2, 3);
    broadGeo.translate(0, 0.61, 0);
    const bp = broadGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < bp.count; i++) {
      const y = Math.max(0, bp.getY(i));
      bp.setZ(i, Math.pow(THREE.MathUtils.clamp(y / 1.22, 0, 1), 1.6) * 0.36);
    }
    broadGeo.computeVertexNormals();
    broadGeo.computeBoundingSphere();

    const fernM: THREE.Matrix4[] = [];
    const broadM: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();

    const isClear = (x: number, z: number) => {
      if (Math.hypot(x, z) < 2.05) return true;
      if (Math.hypot(x - 0.45, z + 1.8) < 1.85) return true;
      if (x > -1.0 && x < 2.8 && z > 0.4 && z < 8.0) return true;
      if (Math.abs(x + 0.85) < 1.55 && Math.abs(z - 2.05) < 1.45) return true;
      return false;
    };

    for (let c = 0; c < 70; c++) {
      const cx = (rand() - 0.5) * 22;
      const cz = -15 + rand() * 23;
      if (isClear(cx, cz)) continue;
      const cy = terrainHeight(cx, cz) - 0.04;
      const cs = 0.72 + rand() * 0.75;
      for (let f = 0; f < 5; f++) {
        dummy.position.set(cx, cy, cz);
        dummy.rotation.set(0.32 + rand() * 0.36, (f / 5) * Math.PI * 2 + rand() * 0.55, (rand() - 0.5) * 0.16);
        dummy.scale.setScalar(cs * (0.85 + rand() * 0.3));
        dummy.updateMatrix();
        fernM.push(dummy.matrix.clone());
      }
    }

    for (let c = 0; c < 46; c++) {
      const cx = (rand() - 0.5) * 20;
      const cz = -14 + rand() * 21;
      if (isClear(cx, cz)) continue;
      const cy = terrainHeight(cx, cz) - 0.03;
      const cs = 0.78 + rand() * 0.88;
      for (let l = 0; l < 4; l++) {
        const ang = (l / 4) * Math.PI * 2 + rand() * 0.7;
        dummy.position.set(cx + Math.sin(ang) * 0.15, cy, cz + Math.cos(ang) * 0.15);
        dummy.rotation.set(0.28 + rand() * 0.34, ang, (rand() - 0.5) * 0.2);
        dummy.scale.setScalar(cs * (0.8 + rand() * 0.35));
        dummy.updateMatrix();
        broadM.push(dummy.matrix.clone());
      }
    }

    const instFerns = new THREE.InstancedMesh(fernGeo, fernMat, fernM.length);
    instFerns.castShadow = true;
    instFerns.receiveShadow = true;
    fernM.forEach((m, i) => instFerns.setMatrixAt(i, m));
    instFerns.instanceMatrix.needsUpdate = true;
    this.root.add(instFerns);

    const instBroad = new THREE.InstancedMesh(broadGeo, broadMat, broadM.length);
    instBroad.castShadow = true;
    instBroad.receiveShadow = true;
    broadM.forEach((m, i) => instBroad.setMatrixAt(i, m));
    instBroad.instanceMatrix.needsUpdate = true;
    this.root.add(instBroad);
  }

  /** Tall overarching Arenga obtusifolia (langkap) palm-frond clusters shading understory in Ep 005. */
  private buildLangkapPalmOvergrowth() {
    const rand = mulberry32(9911);
    const frondMat = new THREE.MeshStandardMaterial({
      map: createFernFrondTexture(),
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.65,
      color: "#293d1d",
    });
    const trunkMat = new THREE.MeshStandardMaterial({
      map: createBarkTextures().map,
      roughness: 0.94,
      color: "#3b352a",
    });

    const frondGeo = new THREE.PlaneGeometry(1.5, 3.6, 2, 6);
    frondGeo.translate(0, 1.8, 0);
    const fp = frondGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fp.count; i++) {
      const y = Math.max(0, fp.getY(i));
      const u = THREE.MathUtils.clamp(y / 3.6, 0, 1);
      fp.setZ(i, Math.pow(u, 1.7) * 1.45);
      fp.setY(i, y * (1 - u * 0.22));
    }
    frondGeo.computeVertexNormals();
    frondGeo.computeBoundingSphere();

    const spots: [number, number][] = [
      [-2.8, -1.6],
      [2.6, -2.4],
      [-1.4, -4.6],
      [3.4, 0.8],
      [-3.8, 1.4],
      [0.6, -5.8],
    ];
    for (const [lx, lz] of spots) {
      const g = new THREE.Group();
      const ly = terrainHeight(lx, lz) - 0.1;
      g.position.set(lx, ly, lz);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 2.2, 8), trunkMat);
      stem.position.y = 1.1;
      stem.castShadow = true;
      g.add(stem);

      for (let f = 0; f < 9; f++) {
        const fm = new THREE.Mesh(frondGeo, frondMat);
        fm.position.y = 1.9 + rand() * 0.35;
        fm.rotation.set(0.38 + rand() * 0.35, (f / 9) * Math.PI * 2 + rand() * 0.4, (rand() - 0.5) * 0.12);
        fm.castShadow = true;
        g.add(fm);
      }
      this.langkapGroup.add(g);
    }
    this.langkapGroup.visible = false;
    this.root.add(this.langkapGroup);
  }

  private buildMistAndShafts() {
    const mistTex = createMistTexture();
    for (const [x, y, z, w, h] of [
      [0, 2.4, -7.2, 18, 6.0],
      [-3.5, 3.0, -11.5, 22, 7.5],
      [3.8, 2.8, -13.0, 22, 7.5],
      [0.4, 2.0, -4.4, 12, 4.2],
    ] as [number, number, number, number, number][]) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: mistTex, color: "#dbe5de", transparent: true, opacity: 0.3, depthWrite: false })
      );
      m.position.set(x, y, z);
      this.mistPlanes.push(m);
      this.root.add(m);
    }

    const shaftMat = new THREE.MeshBasicMaterial({
      map: mistTex,
      color: "#fff3d1",
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    for (const [x, y, z, w, h] of [
      [-0.6, 5.2, -2.5, 3.6, 13.0],
      [2.0, 5.6, -5.2, 4.2, 14.5],
    ] as [number, number, number, number, number][]) {
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), shaftMat);
      sm.position.set(x, y, z);
      sm.rotation.set(0, 0.22, -0.34);
      this.sunShafts.push(sm);
      this.root.add(sm);
    }
  }

  private buildForegroundFraming() {
    const mat = new THREE.MeshStandardMaterial({
      map: createFernFrondTexture(),
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.72,
      color: "#223b1e",
    });
    const geo = new THREE.PlaneGeometry(0.95, 1.35);
    const l = new THREE.Mesh(geo, mat);
    l.position.set(-0.62, -0.78, -1.55);
    l.rotation.set(0.18, 0.28, -0.48);
    const r = new THREE.Mesh(geo, mat);
    r.position.set(0.7, -0.82, -1.62);
    r.rotation.set(0.15, -0.24, 0.45);
    this.fgFoliageGroup.add(l, r);
    this.root.add(this.fgFoliageGroup);
  }

  public update(frame: number, fps: number, camera: THREE.PerspectiveCamera, scene: THREE.Scene): void {
    const tSec = frame / fps;
    const { mode, progress } = this.queryState(frame);
    const p = THREE.MathUtils.clamp(progress, 0, 1);

    this.langkapGroup.visible = mode === "ep5_langkap_shade";

    if (mode === "ep3_mist_sensitive" || mode === "ep5_langkap_shade") {
      // Shaded / humid overcast mood
      this.skyMat.uniforms.uTop.value.set("#4a5f68");
      this.skyMat.uniforms.uMid.value.set("#798e93");
      this.skyMat.uniforms.uHor.value.set("#adbcba");
      this.sunLight.color.set("#d8e3e0");
      this.sunLight.intensity = mode === "ep5_langkap_shade" ? 1.85 : 2.3;
      this.hemiLight.intensity = 1.15;
      scene.fog = new THREE.FogExp2("#a4b4b2", 0.032);
      this.sunShafts.forEach((s) => (s.visible = false));
      this.mistPlanes.forEach((m) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.42));
    } else if (mode === "ep5_golden_closing" || mode === "ep5_afternoon_dilemma") {
      // Late afternoon documentary golden light
      this.skyMat.uniforms.uTop.value.set("#496884");
      this.skyMat.uniforms.uMid.value.set("#99a7a8");
      this.skyMat.uniforms.uHor.value.set("#e2cfa9");
      this.sunLight.color.set("#ffd99e");
      this.sunLight.intensity = 3.2;
      this.hemiLight.intensity = 1.2;
      scene.fog = new THREE.FogExp2("#c7c1ae", 0.021);
      this.sunShafts.forEach((s) => (s.visible = true));
      this.mistPlanes.forEach((m) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.25));
    } else {
      // Balanced natural morning/daylight rainforest
      this.skyMat.uniforms.uTop.value.set("#4c799c");
      this.skyMat.uniforms.uMid.value.set("#94b6c4");
      this.skyMat.uniforms.uHor.value.set("#dce3d5");
      this.sunLight.color.set("#fff0d1");
      this.sunLight.intensity = 3.4;
      this.hemiLight.intensity = 1.25;
      scene.fog = new THREE.FogExp2("#bccac2", 0.023);
      this.sunShafts.forEach((s) => (s.visible = true));
      this.mistPlanes.forEach((m) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.28));
    }

    let pose: RhinoPoseMode = "alert";
    const push = 1 - p * 0.055;

    switch (mode) {
      case "ep3_habitat_alert":
        this.rhino.root.visible = this.rhino.isLoaded;
        this.rhino.root.position.set(0.05, terrainHeight(0.05, -0.1), -0.1);
        this.rhino.root.rotation.set(0, -0.58, 0);
        pose = "alert";
        camera.fov = 34;
        camera.position.set(1.48 - p * 0.42, 1.44, 7.9 * push);
        camera.lookAt(0.04, 1.15, -0.12);
        this.fgFoliageGroup.visible = true;
        break;
      case "ep3_mist_sensitive":
        this.rhino.root.visible = this.rhino.isLoaded;
        this.rhino.root.position.set(0.22, terrainHeight(0.22, -1.6), -1.6);
        this.rhino.root.rotation.set(0, -0.4, 0);
        pose = "distant";
        camera.fov = 33;
        camera.position.set(-0.4, 1.5, 6.25 + p * 0.65);
        camera.lookAt(0.28, 0.85, -1.6);
        this.fgFoliageGroup.visible = false;
        break;
      case "ep3_individual_quiet":
        this.rhino.root.visible = this.rhino.isLoaded;
        this.rhino.root.position.set(0, terrainHeight(0, 0), 0);
        this.rhino.root.rotation.set(0, -0.32, 0);
        pose = "alert";
        camera.fov = 29;
        camera.position.set(2.42 + p * 0.14, 1.16, 4.35 * push);
        camera.lookAt(0.9, 0.78, 0.16);
        this.fgFoliageGroup.visible = false;
        break;
      case "ep4_jrsca_managed":
        this.rhino.root.visible = this.rhino.isLoaded;
        this.rhino.root.position.set(0.05, terrainHeight(0.05, -0.1), -0.1);
        this.rhino.root.rotation.set(0, -0.62, 0);
        pose = "browsing";
        camera.fov = 35;
        camera.position.set(1.38 + p * 0.35, 1.48, 8.1 * push);
        camera.lookAt(0.02, 1.18, -0.14);
        this.fgFoliageGroup.visible = true;
        break;
      case "ep4_canopy_depth":
        this.rhino.root.visible = false;
        camera.fov = 40;
        camera.position.set(-0.45 + p * 0.4, 2.3 - p * 0.18, 8.6 - p * 1.2);
        camera.lookAt(0.15, 2.0, -6.5);
        this.fgFoliageGroup.visible = true;
        break;
      case "ep5_afternoon_dilemma":
        this.rhino.root.visible = this.rhino.isLoaded;
        this.rhino.root.position.set(0.15, terrainHeight(0.15, -1.2), -1.2);
        this.rhino.root.rotation.set(0, -0.48, 0);
        pose = "browsing";
        camera.fov = 34;
        camera.position.set(-0.35 + p * 0.3, 1.52, 6.7 * push);
        camera.lookAt(0.22, 0.92, -1.2);
        this.fgFoliageGroup.visible = true;
        break;
      case "ep5_langkap_shade":
        this.rhino.root.visible = false;
        camera.fov = 39;
        camera.position.set(0.95 - p * 0.65, 1.02 + p * 0.2, 5.25 - p * 1.4);
        camera.lookAt(-0.15, 1.35, -3.6);
        this.fgFoliageGroup.visible = true;
        break;
      case "ep5_golden_closing":
      default:
        this.rhino.root.visible = this.rhino.isLoaded;
        this.rhino.root.position.set(0, terrainHeight(0, 0), 0);
        this.rhino.root.rotation.set(0, -0.34, 0);
        pose = "alert";
        camera.fov = 31;
        camera.position.set(2.15 - p * 0.2, 1.24, 5.2 * (1 + p * 0.06));
        camera.lookAt(0.65, 0.88, 0.08);
        this.fgFoliageGroup.visible = false;
        break;
    }

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    this.skyMesh.position.copy(camera.position);
    this.fgFoliageGroup.position.copy(camera.position);
    this.fgFoliageGroup.quaternion.copy(camera.quaternion);
    this.rhino.update(tSec, pose);
  }
}
