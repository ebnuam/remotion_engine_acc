// Full PBR 3D Ujung Kulon Tropical Rainforest World — Episode 002 (Jalur 3C)
// Strictly organic procedural PBR: sculpted fluted buttress-root trunks (no boxy blocks!),
// dense multi-tier alpha-cutout instanced canopy & midstory foliage, lush ferns (paku-pakuan),
// broadleaf browsing shrubs, muddy wallow, curved lianas, morning sunbeams, and humid mist.
// ZERO Kenney low-poly assets, ZERO spheres, ZERO cel-shading.

import * as THREE from "three";
import { DocWorldAdapter } from "../../../shared/doc3d/StageDoc3D";
import {
  createBarkTextures,
  createBroadleafTexture,
  createCanopyLeafTexture,
  createFernFrondTexture,
  createForestFloorTextures,
  createMistTexture,
} from "../textures/rainforestTextures";
import { JavanRhinoAsset, RhinoPoseMode } from "./JavanRhinoAsset";

export type PolShotId =
  | "pol1_forest"
  | "pol2_closeup"
  | "pol3_habitat"
  | "pol5_threat"
  | "s04_floor"
  | "s12_coastal";

export interface DocShotQuery {
  shotId: PolShotId;
  /** Normalized progress within shot [0..1] (defaults to cycling smoothly across 30f for POL stills). */
  progress?: number;
}

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

/** Deterministic organic Ujung Kulon forest floor height function. */
export function terrainHeight(x: number, z: number): number {
  // Shallow mud wallow depression centered near (-0.85, 2.05)
  const wx = x + 0.85;
  const wz = z - 2.05;
  const wDist = Math.hypot(wx * 0.82, wz * 1.12);
  const wallow = wDist < 2.2 ? -0.2 * Math.cos((wDist / 2.2) * (Math.PI / 2)) ** 2 : 0;

  // Gentle natural knolls beyond clearing
  const edgeRise = Math.max(0, Math.abs(x) - 3.0) * 0.13;
  const backRise = z < -5.5 ? (-5.5 - z) * 0.08 : 0;
  const micro = Math.sin(x * 0.55) * Math.cos(z * 0.45) * 0.065 + Math.sin(x * 1.3 + z * 0.9) * 0.025;
  const clearingFlat = THREE.MathUtils.smoothstep(Math.hypot(x, z), 1.45, 3.3);

  return wallow + (edgeRise + backRise + micro) * clearingFlat;
}

/**
 * Build a single unified organic tropical rainforest tree trunk with smooth fluted buttress roots
 * (replaces sharp polygonal blocks with genuine Dipterocarp/Ficus flared base geometry).
 */
function buildFlutedButtressTrunk(
  height: number,
  baseRadius: number,
  fluteCount: number,
  seed: number
): THREE.BufferGeometry {
  const radialSegs = 28;
  const heightSegs = 20;
  const geo = new THREE.CylinderGeometry(baseRadius * 0.48, baseRadius, height, radialSegs, heightSegs, false);
  geo.translate(0, height * 0.5, 0);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const u = THREE.MathUtils.clamp(y / height, 0, 1);
    const r = Math.hypot(x, z);
    if (r < 1e-4) continue;

    const theta = Math.atan2(z, x);
    // Smooth exponential buttress flare in lower 28% of trunk
    const rootMask = Math.pow(Math.max(0, 1 - u / 0.3), 2.35);
    const fluteWave = 0.5 + 0.5 * Math.cos(theta * fluteCount + seed * 1.7 + Math.sin(theta * 2) * 0.35);
    const fluteFlare = rootMask * (0.42 + 0.95 * Math.pow(fluteWave, 1.8));

    // Organic trunk gnarl + slight natural lean
    const barkWave = 0.045 * Math.sin(u * 14 + seed) * Math.cos(theta * 3 + seed);
    const leanX = Math.sin(u * Math.PI * 0.85) * Math.cos(seed) * 0.28;
    const leanZ = Math.sin(u * Math.PI * 0.75) * Math.sin(seed) * 0.24;

    const scaleR = 1 + fluteFlare + barkWave;
    pos.setXYZ(i, x * scaleR + leanX, y, z * scaleR + leanZ);
  }
  geo.computeVertexNormals();
  return geo;
}

export class RainforestWorld implements DocWorldAdapter {
  public root = new THREE.Group();
  private rhino = new JavanRhinoAsset();
  private sunLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private skyMat: THREE.ShaderMaterial;
  private skyMesh: THREE.Mesh;
  private mistPlanes: THREE.Mesh[] = [];
  private sunShafts: THREE.Mesh[] = [];
  private fgFoliageGroup = new THREE.Group();
  private coastalSea: THREE.Mesh | null = null;
  private getShot: (frame: number) => PolShotId | DocShotQuery;

  constructor(getShot: (frame: number) => PolShotId | DocShotQuery) {
    this.getShot = getShot;

    // 1. Atmospheric Tropical Sky Dome
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color("#527b99") },
        uMid: { value: new THREE.Color("#95b5c0") },
        uHor: { value: new THREE.Color("#dce2d5") },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop, uMid, uHor;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.26, h));
          col = mix(col, uTop, smoothstep(0.22, 0.8, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyMesh = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 16), this.skyMat);
    this.skyMesh.renderOrder = -10;
    this.root.add(this.skyMesh);

    // 2. Natural 3-Point Rainforest PBR Lighting
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

    // Soft cool-green rim light separating rhino hide & fern silhouettes from shaded forest
    this.rimLight = new THREE.DirectionalLight("#d6ece0", 1.15);
    this.rimLight.position.set(-10, 9, -10);
    this.root.add(this.rimLight);

    // Subtle rainforest floor bounce fill so eye, ear, single horn & hide folds stay legible
    const bounceFill = new THREE.DirectionalLight("#c9d4be", 0.78);
    bounceFill.position.set(6, 2.5, 9);
    this.root.add(bounceFill);

    // 3. Build Terrain, Wallow, Organic Buttress Trees, Multi-Tier Canopy, Ferns, Broadleaf & Mist
    this.buildTerrainAndWallow();
    this.buildTreesAndCanopy();
    this.buildUnderstoryAndRocks();
    this.buildAtmosphericMistAndShafts();
    this.buildForegroundFraming();

    // 4. Add Javan Rhino (Jalur 3C)
    this.root.add(this.rhino.root);
  }

  public async load(): Promise<void> {
    await this.rhino.load();
  }

  private buildTerrainAndWallow() {
    const floorTex = createForestFloorTextures();
    const groundGeo = new THREE.PlaneGeometry(66, 66, 56, 56);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, terrainHeight(x, z));
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: floorTex.map,
      bumpMap: floorTex.bumpMap,
      bumpScale: 0.09,
      roughness: 0.88,
      metalness: 0.02,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.root.add(ground);

    // Shallow reflective rainforest mud wallow (kubangan)
    const waterGeo = new THREE.CircleGeometry(2.05, 36);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: "#384439",
      roughness: 0.14,
      metalness: 0.22,
      transparent: true,
      opacity: 0.86,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(-0.85, -0.068, 2.05);
    water.receiveShadow = true;
    this.root.add(water);

    // Distant Sunda Strait coastal horizon sea (only visible in elevated S12 "Benteng Terakhir")
    const seaGeo = new THREE.PlaneGeometry(240, 140);
    seaGeo.rotateX(-Math.PI / 2);
    const seaMat = new THREE.MeshStandardMaterial({
      color: "#1b4552",
      roughness: 0.24,
      metalness: 0.14,
    });
    this.coastalSea = new THREE.Mesh(seaGeo, seaMat);
    this.coastalSea.position.set(0, -0.35, -92);
    this.coastalSea.visible = false;
    this.root.add(this.coastalSea);
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

    const canopyTex = createCanopyLeafTexture();
    const canopyMat = new THREE.MeshStandardMaterial({
      map: canopyTex,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.66,
      metalness: 0.02,
    });

    // Multi-depth tropical rainforest trees framing a sunlit corridor (never blocking camera sight-lines)
    const treeSpecs: [number, number, number, number][] = [
      // [x, z, height, trunkRadius]
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
      [-7.0, 6.0, 14.2, 0.46],
      [6.8, 6.2, 14.6, 0.48],
      [-3.4, -16.5, 18.8, 0.6],
      [4.6, -16.2, 18.0, 0.56],
      [-0.4, -18.5, 19.0, 0.62],
      // Fill distant right-horizon corridor for dense continuous Ujung Kulon canopy in POL-1
      [2.6, -15.4, 17.6, 0.52],
      [6.2, -14.2, 17.2, 0.54],
      [8.8, -15.5, 18.0, 0.56],
      [3.5, -19.2, 19.2, 0.6],
    ];

    const canopyMatrices: THREE.Matrix4[] = [];
    const canopyColors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    treeSpecs.forEach(([tx, tz, h, rBase], idx) => {
      const ty = terrainHeight(tx, tz) - 0.18;
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, ty, tz);

      // Smooth organically fluted buttress-root trunk
      const flutes = 4 + (idx % 3);
      const trunkGeo = buildFlutedButtressTrunk(h, rBase, flutes, idx * 2.17 + 0.6);
      const trunkMesh = new THREE.Mesh(trunkGeo, barkMat);
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      treeGroup.add(trunkMesh);

      // 4 Primary spreading canopy limbs
      for (let br = 0; br < 4; br++) {
        const ang = (br / 4) * Math.PI * 2 + rand() * 0.7;
        const brLen = 2.6 + rand() * 2.3;
        const brGeo = new THREE.CylinderGeometry(rBase * 0.1, rBase * 0.24, brLen, 8);
        const brMesh = new THREE.Mesh(brGeo, barkMat);
        const startY = h * (0.48 + rand() * 0.34);
        brMesh.position.set(
          Math.sin(ang) * brLen * 0.44,
          startY + brLen * 0.24,
          Math.cos(ang) * brLen * 0.44
        );
        brMesh.rotation.set(Math.cos(ang) * 0.92, 0, -Math.sin(ang) * 0.92);
        brMesh.castShadow = true;
        treeGroup.add(brMesh);

        // Top crown canopy cap covering trunk tips cleanly for elevated S12 aerial shot
        for (let tc = 0; tc < 3; tc++) {
          const tSc = 3.2 + rand() * 1.6;
          dummy.position.set(tx + (rand() - 0.5) * 1.6, ty + h * (0.94 + rand() * 0.14), tz + (rand() - 0.5) * 1.6);
          dummy.rotation.set((rand() - 0.5) * 0.5, rand() * Math.PI * 2, (rand() - 0.5) * 0.5);
          dummy.scale.set(tSc, tSc, tSc);
          dummy.updateMatrix();
          canopyMatrices.push(dummy.matrix.clone());
          const tShade = 0.8 + rand() * 0.34;
          canopyColors.push(new THREE.Color(tShade * 0.9, tShade * 1.06, tShade * 0.84));
        }

        // Rich alpha-cutout tropical foliage clusters around limb crowns
        for (let lf = 0; lf < 8; lf++) {
          const lx = tx + Math.sin(ang) * (brLen * 0.72) + (rand() - 0.5) * 3.0;
          const ly = ty + startY + brLen * 0.45 + (rand() - 0.45) * 2.4;
          const lz = tz + Math.cos(ang) * (brLen * 0.72) + (rand() - 0.5) * 3.0;
          const sc = 2.4 + rand() * 2.0;
          dummy.position.set(lx, ly, lz);
          dummy.rotation.set((rand() - 0.5) * 1.15, rand() * Math.PI * 2, (rand() - 0.5) * 1.1);
          dummy.scale.set(sc, sc, sc);
          dummy.updateMatrix();
          canopyMatrices.push(dummy.matrix.clone());
          const shade = 0.72 + rand() * 0.38;
          canopyColors.push(new THREE.Color(shade * 0.92, shade * 1.04, shade * 0.85));
        }
      }

      // Organic curved tropical liana vine (TubeGeometry curve, never a straight rod!)
      if (idx % 2 === 0) {
        const lAng = rand() * Math.PI * 2;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.sin(lAng) * (rBase + 0.15), h * 0.85, Math.cos(lAng) * (rBase + 0.15)),
          new THREE.Vector3(Math.sin(lAng + 0.4) * (rBase + 0.65), h * 0.58, Math.cos(lAng + 0.4) * (rBase + 0.65)),
          new THREE.Vector3(Math.sin(lAng + 0.15) * (rBase + 0.45), h * 0.32, Math.cos(lAng + 0.15) * (rBase + 0.45)),
          new THREE.Vector3(Math.sin(lAng + 0.5) * (rBase + 0.9), 0.1, Math.cos(lAng + 0.5) * (rBase + 0.9)),
        ]);
        const vineGeo = new THREE.TubeGeometry(curve, 14, 0.028, 6, false);
        const vineMesh = new THREE.Mesh(vineGeo, barkMat);
        vineMesh.castShadow = true;
        treeGroup.add(vineMesh);
      }

      this.root.add(treeGroup);
    });

    // Dense mid-story & distant jungle foliage backdrop wall (y = 0.8..9.5, z = -5..-18)
    // Eliminates bare empty sky gaps between tree trunks so background reads as deep tropical rainforest!
    for (let i = 0; i < 195; i++) {
      const isUpper = i < 75;
      const lx = (rand() - 0.5) * (isUpper ? 22 : 24);
      const ly = isUpper ? 5.8 + rand() * 5.8 : 0.9 + rand() * 5.2;
      const lz = isUpper ? -18 + rand() * 24 : -5.6 - rand() * 14.5;
      // Keep central viewing tunnel open near camera while filling mid/far jungle
      if (!isUpper && lz > -7.5 && Math.abs(lx) < 2.2 && ly < 3.6) continue;
      const sc = (isUpper ? 2.8 : 2.5) + rand() * 2.1;
      dummy.position.set(lx, ly, lz);
      dummy.rotation.set((rand() - 0.5) * 0.85, rand() * Math.PI * 2, (rand() - 0.5) * 0.85);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      canopyMatrices.push(dummy.matrix.clone());
      const shade = (isUpper ? 0.78 : 0.68) + rand() * 0.34;
      canopyColors.push(new THREE.Color(shade * 0.9, shade * 1.02, shade * 0.84));
    }

    // Curved leaf cluster geometry (zero NaN, gentle organic cup)
    const cardA = new THREE.PlaneGeometry(1, 1, 2, 2);
    const pA = cardA.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pA.count; i++) {
      const x = pA.getX(i);
      const y = pA.getY(i);
      pA.setZ(i, -(x * x + y * y) * 0.16);
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

  private buildUnderstoryAndRocks() {
    const rand = mulberry32(7823);
    const fernTex = createFernFrondTexture();
    const broadTex = createBroadleafTexture();

    const fernMat = new THREE.MeshStandardMaterial({
      map: fernTex,
      alphaTest: 0.36,
      side: THREE.DoubleSide,
      roughness: 0.62,
      metalness: 0.02,
    });

    const broadMat = new THREE.MeshStandardMaterial({
      map: broadTex,
      alphaTest: 0.38,
      side: THREE.DoubleSide,
      roughness: 0.58,
      metalness: 0.03,
    });

    // Arched tropical fern frond geometry (safe Math.max(0, u) prevents NaN bounding sphere!)
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

    // Broadleaf understory blade geometry (safe Math.max(0, u))
    const broadGeo = new THREE.PlaneGeometry(1.0, 1.22, 2, 3);
    broadGeo.translate(0, 0.61, 0);
    const bp = broadGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < bp.count; i++) {
      const y = Math.max(0, bp.getY(i));
      const u = THREE.MathUtils.clamp(y / 1.22, 0, 1);
      bp.setZ(i, Math.pow(u, 1.6) * 0.36);
    }
    broadGeo.computeVertexNormals();
    broadGeo.computeBoundingSphere();

    const fernMatrices: THREE.Matrix4[] = [];
    const fernColors: THREE.Color[] = [];
    const broadMatrices: THREE.Matrix4[] = [];
    const broadColors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    const isClearZone = (x: number, z: number) => {
      if (Math.hypot(x, z) < 2.05) return true; // hero rhino footprint
      if (Math.hypot(x - 0.45, z + 1.8) < 1.85) return true; // POL-5 rhino footprint
      if (x > -1.0 && x < 2.8 && z > 0.4 && z < 8.0) return true; // POL-2/POL-3/POL-5 camera corridor
      if (Math.abs(x + 0.85) < 1.55 && Math.abs(z - 2.05) < 1.45) return true; // wallow water surface
      return false;
    };

    // 72 multi-frond fern clumps (5 fronds each = ~300+ instanced fronds)
    for (let c = 0; c < 76; c++) {
      const cx = (rand() - 0.5) * 22;
      const cz = -15 + rand() * 23;
      if (isClearZone(cx, cz)) continue;
      const cy = terrainHeight(cx, cz) - 0.04;
      const clumpScale = 0.72 + rand() * 0.78;
      const fronds = 5;
      for (let f = 0; f < fronds; f++) {
        const ang = (f / fronds) * Math.PI * 2 + rand() * 0.55;
        dummy.position.set(cx, cy, cz);
        dummy.rotation.set(0.32 + rand() * 0.36, ang, (rand() - 0.5) * 0.16);
        dummy.scale.setScalar(clumpScale * (0.85 + rand() * 0.3));
        dummy.updateMatrix();
        fernMatrices.push(dummy.matrix.clone());
        const v = 0.8 + rand() * 0.34;
        fernColors.push(new THREE.Color(v * 0.94, v * 1.04, v * 0.86));
      }
    }

    // 48 broadleaf rainforest shrub clusters
    for (let c = 0; c < 52; c++) {
      const cx = (rand() - 0.5) * 20;
      const cz = -14 + rand() * 21;
      if (isClearZone(cx, cz)) continue;
      const cy = terrainHeight(cx, cz) - 0.03;
      const sc = 0.78 + rand() * 0.9;
      for (let l = 0; l < 4; l++) {
        const ang = (l / 4) * Math.PI * 2 + rand() * 0.7;
        dummy.position.set(cx + Math.sin(ang) * 0.15, cy, cz + Math.cos(ang) * 0.15);
        dummy.rotation.set(0.28 + rand() * 0.34, ang, (rand() - 0.5) * 0.2);
        dummy.scale.setScalar(sc * (0.8 + rand() * 0.35));
        dummy.updateMatrix();
        broadMatrices.push(dummy.matrix.clone());
        const v = 0.78 + rand() * 0.34;
        broadColors.push(new THREE.Color(v * 0.92, v * 1.02, v * 0.86));
      }
    }

    // Browsing shrub cluster positioned naturally beside Javan Rhino snout without blocking POL-5 sightline
    const browseSpots: [number, number][] = [
      [2.15, -0.55],
      [2.35, 0.35],
      [1.95, -1.15],
    ];
    for (const [bx, bz] of browseSpots) {
      const by = terrainHeight(bx, bz) - 0.02;
      for (let l = 0; l < 4; l++) {
        const ang = (l / 4) * Math.PI * 2 + rand() * 0.5;
        dummy.position.set(bx, by, bz);
        dummy.rotation.set(0.24 + rand() * 0.22, ang, 0);
        dummy.scale.setScalar(0.85 + rand() * 0.28);
        dummy.updateMatrix();
        broadMatrices.push(dummy.matrix.clone());
        broadColors.push(new THREE.Color(0.96, 1.05, 0.88));
      }
    }

    const instFerns = new THREE.InstancedMesh(fernGeo, fernMat, fernMatrices.length);
    instFerns.castShadow = true;
    instFerns.receiveShadow = true;
    fernMatrices.forEach((m, i) => {
      instFerns.setMatrixAt(i, m);
      instFerns.setColorAt(i, fernColors[i]);
    });
    instFerns.instanceMatrix.needsUpdate = true;
    if (instFerns.instanceColor) instFerns.instanceColor.needsUpdate = true;
    this.root.add(instFerns);

    const instBroad = new THREE.InstancedMesh(broadGeo, broadMat, broadMatrices.length);
    instBroad.castShadow = true;
    instBroad.receiveShadow = true;
    broadMatrices.forEach((m, i) => {
      instBroad.setMatrixAt(i, m);
      instBroad.setColorAt(i, broadColors[i]);
    });
    instBroad.instanceMatrix.needsUpdate = true;
    if (instBroad.instanceColor) instBroad.instanceColor.needsUpdate = true;
    this.root.add(instBroad);

    // Mossy fallen log & organic weathered forest rocks near wallow
    const barkTex = createBarkTextures();
    const logMat = new THREE.MeshStandardMaterial({
      map: barkTex.map,
      bumpMap: barkTex.bumpMap,
      bumpScale: 0.08,
      roughness: 0.94,
    });
    const logMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.28, 4.4, 12), logMat);
    logMesh.position.set(-2.7, terrainHeight(-2.7, 1.2) + 0.16, 1.2);
    logMesh.rotation.set(0.08, 0.42, Math.PI / 2 - 0.05);
    logMesh.castShadow = true;
    logMesh.receiveShadow = true;
    this.root.add(logMesh);

    const rockMat = new THREE.MeshStandardMaterial({
      color: "#4e5448",
      bumpMap: barkTex.bumpMap,
      bumpScale: 0.06,
      roughness: 0.88,
      metalness: 0.04,
    });
    const rockCoords: [number, number, number][] = [
      [-1.95, 2.75, 0.42],
      [1.35, 2.85, 0.34],
      [-2.35, -2.5, 0.55],
      [2.85, -3.1, 0.48],
    ];
    for (const [rx, rz, rs] of rockCoords) {
      // Smooth indexed sphere deformation (no flat-faceted non-indexed seams)
      const rg = new THREE.SphereGeometry(rs, 18, 14);
      const rp = rg.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < rp.count; i++) {
        const vx = rp.getX(i);
        const vy = rp.getY(i);
        const vz = rp.getZ(i);
        const dir = new THREE.Vector3(vx, vy, vz).normalize();
        const n = 0.86 + 0.16 * Math.sin(dir.x * 4.5 + rz) * Math.cos(dir.z * 4.2 + rx);
        rp.setXYZ(i, vx * n * 1.28, vy * n * 0.58, vz * n);
      }
      rg.computeVertexNormals();
      const rm = new THREE.Mesh(rg, rockMat);
      rm.position.set(rx, terrainHeight(rx, rz) + rs * 0.18, rz);
      rm.castShadow = true;
      rm.receiveShadow = true;
      this.root.add(rm);
    }
  }

  private buildAtmosphericMistAndShafts() {
    const mistTex = createMistTexture();

    const mistCoords: [number, number, number, number, number][] = [
      [0, 2.4, -7.2, 18, 6.0],
      [-3.5, 3.0, -11.5, 22, 7.5],
      [3.8, 2.8, -13.0, 22, 7.5],
      [0.4, 2.0, -4.4, 12, 4.2],
    ];
    for (const [x, y, z, w, h] of mistCoords) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          map: mistTex,
          color: "#dbe5de",
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        })
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
    const shaftSpecs: [number, number, number, number, number][] = [
      [-0.6, 5.2, -2.5, 3.6, 13.0],
      [2.0, 5.6, -5.2, 4.2, 14.5],
      [-2.4, 5.0, -7.8, 4.6, 15.0],
    ];
    for (const [x, y, z, w, h] of shaftSpecs) {
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), shaftMat);
      sm.position.set(x, y, z);
      sm.rotation.z = -0.34;
      sm.rotation.y = 0.22;
      this.sunShafts.push(sm);
      this.root.add(sm);
    }
  }

  /** Soft natural foreground fern fronds framing bottom corners without obstructing the subject. */
  private buildForegroundFraming() {
    const fernTex = createFernFrondTexture();
    const mat = new THREE.MeshStandardMaterial({
      map: fernTex,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.72,
      color: "#223b1e",
    });
    const geo = new THREE.PlaneGeometry(0.95, 1.35);
    const leftFrond = new THREE.Mesh(geo, mat);
    leftFrond.position.set(-0.62, -0.78, -1.55);
    leftFrond.rotation.set(0.18, 0.28, -0.48);
    const rightFrond = new THREE.Mesh(geo, mat);
    rightFrond.position.set(0.7, -0.82, -1.62);
    rightFrond.rotation.set(0.15, -0.24, 0.45);
    this.fgFoliageGroup.add(leftFrond, rightFrond);
    this.root.add(this.fgFoliageGroup);
  }

  public update(frame: number, fps: number, camera: THREE.PerspectiveCamera, scene: THREE.Scene): void {
    const tSec = frame / fps;
    const rawQuery = this.getShot(frame);
    const shot: PolShotId = typeof rawQuery === "string" ? rawQuery : rawQuery.shotId;
    const progress =
      typeof rawQuery === "string" ? (frame % 30) / 29 : THREE.MathUtils.clamp(rawQuery.progress ?? 0, 0, 1);

    // 1. Lighting & Atmosphere Mood
    const isThreat = shot === "pol5_threat";
    if (this.coastalSea) {
      this.coastalSea.visible = shot === "s12_coastal";
    }
    if (isThreat) {
      this.skyMat.uniforms.uTop.value.set("#4e636d");
      this.skyMat.uniforms.uMid.value.set("#7d9298");
      this.skyMat.uniforms.uHor.value.set("#b1c0be");
      this.sunLight.color.set("#dde8e6");
      this.sunLight.intensity = 2.2;
      this.hemiLight.color.set("#b6cad0");
      this.hemiLight.groundColor.set("#283424");
      this.hemiLight.intensity = 1.18;
      this.rimLight.color.set("#bdd6d4");
      this.rimLight.intensity = 0.9;
      scene.fog = new THREE.FogExp2("#a6b6b4", 0.032);
      this.sunShafts.forEach((s) => (s.visible = false));
      this.mistPlanes.forEach((m) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.42));
    } else {
      this.skyMat.uniforms.uTop.value.set("#4c799c");
      this.skyMat.uniforms.uMid.value.set("#94b6c4");
      this.skyMat.uniforms.uHor.value.set("#dce3d5");
      this.sunLight.color.set("#fff0d1");
      this.sunLight.intensity = shot === "s12_coastal" ? 3.55 : 3.4;
      this.hemiLight.color.set("#d0e4f0");
      this.hemiLight.groundColor.set("#324227");
      this.hemiLight.intensity = 1.25;
      this.rimLight.color.set("#def0e2");
      this.rimLight.intensity = 1.05;
      scene.fog = new THREE.FogExp2("#bccac2", shot === "s12_coastal" ? 0.014 : 0.023);
      this.sunShafts.forEach((s) => (s.visible = shot !== "s12_coastal"));
      this.mistPlanes.forEach((m) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.28));
    }

    // 2. Shot-Specific Rhino Placement, Pose & Cinematic Documentary Camera
    let pose: RhinoPoseMode = "alert";
    const push = 1 - progress * 0.055;

    if (shot === "pol1_forest") {
      // S01 / POL-1: Establishing shot of Ujung Kulon tropical rainforest (slow elevated dolly-in)
      this.rhino.root.visible = false;
      camera.fov = 41;
      camera.position.set(-0.55 + progress * 0.35, 2.38 - progress * 0.14, 8.7 - progress * 0.85);
      camera.lookAt(0.15, 1.95, -6.5);
      this.fgFoliageGroup.visible = true;
    } else if (shot === "s04_floor") {
      // S04: Low-angle humid rainforest floor dolly forward past wallow, fallen log & ferns
      this.rhino.root.visible = false;
      camera.fov = 38;
      camera.position.set(1.25 - progress * 0.55, 0.74 + progress * 0.18, 5.45 - progress * 2.15);
      camera.lookAt(-0.45, 0.88, -3.5);
      this.fgFoliageGroup.visible = true;
    } else if (shot === "pol2_closeup") {
      // S06 / POL-2: Telephoto 3/4 portrait close-up of Javan Rhino (slow creeping push-in)
      this.rhino.root.visible = this.rhino.isLoaded;
      this.rhino.root.position.set(0, terrainHeight(0, 0), 0);
      this.rhino.root.rotation.set(0, -0.32, 0);
      pose = "alert";
      camera.fov = 29;
      camera.position.set(2.42 + progress * 0.12, 1.15 + progress * 0.03, 4.35 * push);
      camera.lookAt(0.92, 0.78, 0.16);
      this.fgFoliageGroup.visible = false;
    } else if (shot === "pol3_habitat") {
      // S08 / POL-3: Javan Rhino browsing inside 3-layer rainforest depth (slow lateral arc)
      this.rhino.root.visible = this.rhino.isLoaded;
      this.rhino.root.position.set(0.05, terrainHeight(0.05, -0.1), -0.1);
      this.rhino.root.rotation.set(0, -0.62, 0);
      pose = "browsing";
      camera.fov = 35;
      camera.position.set(1.42 - progress * 0.45, 1.48, 8.15 * push);
      camera.lookAt(0.02, 1.24, -0.15);
      this.fgFoliageGroup.visible = true;
    } else if (shot === "s12_coastal") {
      // S12: Elevated wide crane-up high above emerald rainforest crown canopy overlooking Sunda Strait coastline
      this.rhino.root.visible = false;
      camera.fov = 44;
      camera.position.set(-1.2 + progress * 1.5, 22.8 + progress * 2.4, 15.2 + progress * 3.2);
      camera.lookAt(0.0, 9.2 - progress * 0.6, -28.0);
      this.fgFoliageGroup.visible = false;
    } else {
      // S15 / POL-5: Threat to single population (humid overcast forest, slow dolly-back revealing vulnerability)
      this.rhino.root.visible = this.rhino.isLoaded;
      this.rhino.root.position.set(0.25, terrainHeight(0.25, -1.8), -1.8);
      this.rhino.root.rotation.set(0, -0.45, 0);
      pose = "distant";
      camera.fov = 34;
      camera.position.set(-0.45, 1.56 + progress * 0.08, 6.55 + progress * 0.75);
      camera.lookAt(0.32, 0.72, -1.8);
      this.fgFoliageGroup.visible = false;
    }

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    this.skyMesh.position.copy(camera.position);
    this.fgFoliageGroup.position.copy(camera.position);
    this.fgFoliageGroup.quaternion.copy(camera.quaternion);

    this.rhino.update(tSec, pose);
  }
}
