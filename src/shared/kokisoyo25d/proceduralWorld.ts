// Procedural 3D world & storybook prop builders for Kok Iso Yo? 2.5D-in-3D episodes.
// Eliminates dependency on empty/missing external kenney/*.glb placeholders by generating
// rich two-tone geometries (sky dome, sunlit terrain, animated water, trees, bushes, rocks, clouds).

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LIGHTS, LOOK, LightMode } from "./lights";
import { twoTone, untone, LFB } from "./shade";
import { NOINK } from "./postfx";
import { ctex, cloudHD, waterNear, waterFar, rng } from "./paint";

export type V3 = [number, number, number];
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Batch geometry builder merging static meshes by material for fast CPU Swangle rendering. */
export class StaticBatch {
  private buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();

  add(geo: THREE.BufferGeometry, mat: THREE.Material, matrix?: THREE.Matrix4) {
    let g = geo;
    if (matrix) {
      g = geo.clone();
      g.applyMatrix4(matrix);
    }
    const clean = g.index ? g.toNonIndexed() : g;
    if (!clean.getAttribute("uv")) {
      const cnt = clean.getAttribute("position").count;
      clean.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(cnt * 2), 2));
    }
    if (!clean.getAttribute("normal")) clean.computeVertexNormals();
    const list = this.buckets.get(mat);
    if (list) list.push(clean);
    else this.buckets.set(mat, [clean]);
  }

  build(parent: THREE.Object3D, castShadow = true, receiveShadow = true) {
    for (const [mat, geos] of this.buckets) {
      const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      parent.add(mesh);
    }
    this.buckets.clear();
  }
}

export function createMaterialCache() {
  const mats = new Map<string, THREE.Material>();
  return {
    lam(key: string, make: () => THREE.MeshLambertMaterialParameters, liftK = 1): THREE.MeshLambertMaterial {
      let m = mats.get(key) as THREE.MeshLambertMaterial | undefined;
      if (!m) {
        m = twoTone(new THREE.MeshLambertMaterial(make()), liftK);
        mats.set(key, m);
      }
      return m;
    },
    phong(key: string, make: () => THREE.MeshPhongMaterialParameters, liftK = 0.15): THREE.MeshPhongMaterial {
      let m = mats.get(key) as THREE.MeshPhongMaterial | undefined;
      if (!m) {
        m = twoTone(new THREE.MeshPhongMaterial(make()), liftK);
        mats.set(key, m);
      }
      return m;
    },
  };
}

/** 5-stop elevation sky dome inverted for ToneMappingMode.NEUTRAL. */
export function createSkyDome() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      c0: { value: new THREE.Color() },
      c1: { value: new THREE.Color() },
      c2: { value: new THREE.Color() },
      c3: { value: new THREE.Color() },
      c4: { value: new THREE.Color() },
      e: { value: new THREE.Vector4() },
    },
    vertexShader:
      "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
      void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
        vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
        c = mix(c, c2, smoothstep(e.x, e.y, el));
        c = mix(c, c3, smoothstep(e.y, e.z, el));
        c = mix(c, c4, smoothstep(e.z, e.w, el));
        gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), mat);
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;
  mesh.layers.set(NOINK);
  return { mesh, mat };
}

export function updateSkyAndFog(
  sky: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial },
  fog: THREE.Fog,
  camPos: THREE.Vector3,
  scene: THREE.Scene,
  mode: LightMode
) {
  const L = LIGHTS[mode];
  const K = LOOK[mode];
  K.sky.c.forEach((h, i) => untone(h, sky.mat.uniforms["c" + i].value));
  const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
  sky.mat.uniforms.e.value.set(e[1], e[2], e[3], e[4]);
  sky.mesh.position.copy(camPos);

  untone(L.fog, fog.color);
  fog.near = L.fogNear;
  fog.far = L.fogFar;
  scene.fog = fog;
  scene.background = null;
}

export function createSunRig(parent: THREE.Object3D, shadowRes = 2048) {
  const hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.55);
  const sun = new THREE.DirectionalLight("#fff3e0", 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowRes, shadowRes);
  parent.add(hemi, sun, sun.target);
  return { hemi, sun };
}

export function updateCameraRelativeSun(
  rig: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight },
  camPos: THREE.Vector3,
  focus: THREE.Vector3,
  mode: LightMode,
  azOverride?: number,
  elOverride?: number
): THREE.Vector3 {
  const L = LIGHTS[mode];
  rig.hemi.color.set(L.sky);
  rig.hemi.groundColor.set(L.ground);
  rig.hemi.intensity = L.hemiI;
  rig.sun.color.set(L.sunCol);
  rig.sun.intensity = L.sunI;

  const dx = focus.x - camPos.x;
  const dz = focus.z - camPos.z;
  const len = Math.hypot(dx, dz) || 1;
  const fx = dx / len;
  const fz = dz / len;

  const az = THREE.MathUtils.degToRad(azOverride ?? L.az);
  const el = THREE.MathUtils.degToRad(elOverride ?? L.el);
  const hx = fx * Math.cos(az) - fz * Math.sin(az);
  const hz = fz * Math.cos(az) + fx * Math.sin(az);
  const sunDir = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();

  const dist = camPos.distanceTo(focus);
  let rShadow = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
  if (mode === "golden") rShadow = Math.max(rShadow, 30);

  rig.sun.position.copy(focus).addScaledVector(sunDir, 220);
  rig.sun.target.position.copy(focus);
  const sc = rig.sun.shadow.camera;
  sc.left = -rShadow;
  sc.right = rShadow;
  sc.top = rShadow;
  sc.bottom = -rShadow;
  sc.near = 20;
  sc.far = 480;
  sc.updateProjectionMatrix();
  rig.sun.shadow.bias = L.bias;
  rig.sun.shadow.normalBias = L.normalBias * (rShadow / 12);

  return sunDir;
}

/** Create painted billboard cloud ring on NOINK layer. */
export function createCloudRing(parent: THREE.Object3D, count = 9) {
  const maps = {
    day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)),
    golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)),
  };
  const clouds: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + 0.3;
    const d = 620 + (i % 3) * 60;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: maps.day[i % 4],
        color: new THREE.Color(1.1, 1.1, 1.1),
        transparent: true,
        depthWrite: false,
        fog: false,
      })
    );
    const w = 130 + (i % 4) * 30;
    m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d);
    m.scale.set(w, w / 2, 1);
    m.layers.set(NOINK);
    clouds.push(m);
    parent.add(m);
  }
  return {
    clouds,
    update(camPos: THREE.Vector3, mode: LightMode) {
      for (let i = 0; i < clouds.length; i++) {
        const m = clouds[i];
        m.lookAt(camPos.x, m.position.y, camPos.z);
        (m.material as THREE.MeshBasicMaterial).map = maps[mode][i % 4];
      }
    },
  };
}

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;

const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

/** Animated water plane with crest/trough ripples and depression-angle gradient. */
export function createWaterPlane(width = 1800, depth = 60, y = 0) {
  const wNear = waterNear();
  const wFar = waterFar();
  for (const t of [wNear, wFar]) {
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 16;
    t.needsUpdate = true;
  }
  const uniforms = {
    wNearC: { value: new THREE.Color() },
    wMidC: { value: new THREE.Color() },
    wFarC: { value: new THREE.Color() },
    wCrest: { value: new THREE.Color() },
    wTrough: { value: new THREE.Color() },
    wGlint: { value: new THREE.Color() },
    wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) },
    wNearTex: { value: wNear },
    wFarTex: { value: wFar },
    wTime: { value: 0 },
  };
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", WATER_DECL)
      .replace("#include <map_fragment>", WATER_COL)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace(
        "#include <lights_fragment_end>",
        "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);"
      );
  };
  mat.customProgramCacheKey = () => "kokisoyo_water1";

  const geo = new THREE.PlaneGeometry(width, depth);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;

  return {
    mesh,
    update(tSec: number, mode: LightMode) {
      const wc = LOOK[mode].water;
      untone(wc.near, uniforms.wNearC.value);
      untone(wc.mid, uniforms.wMidC.value);
      untone(wc.far, uniforms.wFarC.value);
      untone(wc.crest, uniforms.wCrest.value);
      untone(wc.trough, uniforms.wTrough.value);
      untone(wc.glint, uniforms.wGlint.value);
      uniforms.wShade.value.set(...wc.shade);
      uniforms.wTime.value = tSec;
    },
  };
}

/**
 * Procedural storybook tree built from smooth overlapping canopy spheres + tapered trunk (twoTone).
 * Never uses coarse low-poly cones or external empty GLBs.
 */
export function addStorybookTree(
  batch: StaticBatch,
  barkMat: THREE.Material,
  leafMat: THREE.Material,
  pos: V3,
  seed: number,
  height = 5.5
) {
  const r = rng(seed);
  const trunkH = height * 0.48;
  const trunk = new THREE.CylinderGeometry(height * 0.036, height * 0.062, trunkH, 10);
  trunk.translate(pos[0], pos[1] + trunkH * 0.5, pos[2]);
  batch.add(trunk, barkMat);

  const canopyY = pos[1] + trunkH * 0.92;
  const mainR = height * 0.28;
  const lobes: [number, number, number, number][] = [
    [0, mainR * 0.65, 0, mainR],
    [-mainR * 0.62, mainR * 0.2, mainR * 0.25, mainR * 0.78],
    [mainR * 0.6, mainR * 0.25, -mainR * 0.22, mainR * 0.74],
    [0, mainR * 1.18, mainR * 0.1, mainR * 0.68],
    [(r() - 0.5) * mainR * 0.5, mainR * 0.45, (r() - 0.5) * mainR * 0.7, mainR * 0.64],
  ];
  for (const [ox, oy, oz, radL] of lobes) {
    const s = new THREE.SphereGeometry(radL, 14, 12);
    s.translate(pos[0] + ox, canopyY + oy, pos[2] + oz);
    batch.add(s, leafMat);
  }
}

export function addBushCluster(
  batch: StaticBatch,
  leafMat: THREE.Material,
  pos: V3,
  seed: number,
  scale = 1.0
) {
  const r = rng(seed);
  const blobs = 3 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i++) {
    const radB = (0.42 + r() * 0.28) * scale;
    const ox = (r() - 0.5) * 0.9 * scale;
    const oz = (r() - 0.5) * 0.8 * scale;
    const s = new THREE.SphereGeometry(radB, 12, 10);
    s.scale(1.15, 0.82, 1.1);
    s.translate(pos[0] + ox, pos[1] + radB * 0.55, pos[2] + oz);
    batch.add(s, leafMat);
  }
}

export function addRockCluster(
  batch: StaticBatch,
  rockMat: THREE.Material,
  pos: V3,
  seed: number,
  scale = 1.0
) {
  const r = rng(seed);
  for (let i = 0; i < 2; i++) {
    const radR = (0.45 + r() * 0.35) * scale;
    const rock = new THREE.DodecahedronGeometry(radR, 1);
    rock.scale(1.2, 0.72, 0.95);
    rock.rotateY(r() * Math.PI);
    rock.translate(pos[0] + (i - 0.5) * 0.6 * scale, pos[1] + radR * 0.4, pos[2] + (r() - 0.5) * 0.4 * scale);
    batch.add(rock, rockMat);
  }
}

/** Check if a bounding sphere at world `center` with `radius` blocks any camera sight-line ray. */
export type SightRay = { o: THREE.Vector3; d: THREE.Vector3; len: number };
export function blocksAnySightLine(rays: SightRay[], center: THREE.Vector3, radius: number): boolean {
  const toC = new THREE.Vector3();
  for (const ray of rays) {
    toC.copy(center).sub(ray.o);
    const proj = toC.dot(ray.d);
    if (proj < 0 || proj > ray.len) continue;
    const perpSq = toC.lengthSq() - proj * proj;
    if (perpSq < radius * radius) return true;
  }
  return false;
}

export const defaultCloudIcon = () => ctex("smoke_soft", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 12, 64, 64, 60);
  gr.addColorStop(0, "rgba(255,255,255,0.85)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
});
