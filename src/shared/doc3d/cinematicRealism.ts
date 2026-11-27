/**
 * Shared Cinematic 3D PBR Realism & 9:16 Safe-Framing Toolkit for Kok Iso Yo?
 *
 * Designed for use with `StageDoc3D` (`./StageDoc3D.tsx`):
 * - Procedural high-detail PBR materials (albedo + bump + roughness maps) — zero flat cartoon look
 * - 3-point documentary lighting & atmospheric fog presets (`day_outdoor`, `golden_hour`, `night_industrial`, `studio_macro`, `underwater_deep`)
 * - Strict 9:16 anti-cropping framing helper (`frameHeroSafe9x16`) wrapping `calcCameraDistance`
 *   so hero objects never clip off portrait edges or get obscured by Shorts/Reels UI.
 */

import * as THREE from "three";
import { calcCameraDistance, ShotType } from "../camera/autoFraming";

export type PbrMaterialPreset =
  | "brushed_steel"
  | "cast_concrete"
  | "ocean_water"
  | "organic_tissue"
  | "carbon_fiber"
  | "asphalt"
  | "warm_wood"
  | "clear_glass"
  | "painted_metal";

export type LightingMood =
  | "day_outdoor"
  | "golden_hour"
  | "night_industrial"
  | "studio_macro"
  | "underwater_deep";

function createProceduralNoiseTexture(
  seed: number,
  baseRgb: [number, number, number],
  variation: number,
  streaks: "none" | "horizontal" | "vertical" | "grid" = "none",
  size = 256
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const img = ctx.createImageData(size, size);
  let s = (seed >>> 0) || 1337;
  const nextRand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };

  for (let y = 0; y < size; y += 1) {
    const rowJitter = streaks === "horizontal" ? (nextRand() - 0.5) * variation * 1.4 : 0;
    for (let x = 0; x < size; x += 1) {
      let delta = (nextRand() - 0.5) * variation + rowJitter;
      if (streaks === "vertical") {
        delta += Math.sin(x * 0.35 + seed) * variation * 0.35;
      } else if (streaks === "grid") {
        const line = x % 32 < 2 || y % 32 < 2 ? -variation * 0.7 : 0;
        delta += line;
      }
      const idx = (y * size + x) * 4;
      img.data[idx] = Math.max(0, Math.min(255, Math.round(baseRgb[0] + delta)));
      img.data[idx + 1] = Math.max(0, Math.min(255, Math.round(baseRgb[1] + delta)));
      img.data[idx + 2] = Math.max(0, Math.min(255, Math.round(baseRgb[2] + delta)));
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createPbrMaterial(
  preset: PbrMaterialPreset,
  overrides: {
    color?: string | number;
    roughness?: number;
    metalness?: number;
    repeat?: [number, number];
    bumpScale?: number;
  } = {}
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  const repeat = overrides.repeat ?? [2, 2];

  if (preset === "clear_glass") {
    return new THREE.MeshPhysicalMaterial({
      color: overrides.color ?? 0xdff2ff,
      roughness: overrides.roughness ?? 0.08,
      metalness: overrides.metalness ?? 0.05,
      transmission: 0.78,
      thickness: 0.6,
      ior: 1.48,
      transparent: true,
      opacity: 0.85,
    });
  }

  const presetSpec: Record<
    Exclude<PbrMaterialPreset, "clear_glass">,
    {
      rgb: [number, number, number];
      variation: number;
      streaks: "none" | "horizontal" | "vertical" | "grid";
      roughness: number;
      metalness: number;
      bumpScale: number;
      seed: number;
    }
  > = {
    brushed_steel: {
      rgb: [176, 184, 192],
      variation: 22,
      streaks: "horizontal",
      roughness: 0.34,
      metalness: 0.86,
      bumpScale: 0.025,
      seed: 101,
    },
    cast_concrete: {
      rgb: [158, 160, 154],
      variation: 34,
      streaks: "grid",
      roughness: 0.86,
      metalness: 0.05,
      bumpScale: 0.05,
      seed: 202,
    },
    ocean_water: {
      rgb: [22, 84, 118],
      variation: 26,
      streaks: "horizontal",
      roughness: 0.16,
      metalness: 0.22,
      bumpScale: 0.06,
      seed: 303,
    },
    organic_tissue: {
      rgb: [198, 134, 128],
      variation: 24,
      streaks: "none",
      roughness: 0.58,
      metalness: 0.02,
      bumpScale: 0.035,
      seed: 404,
    },
    carbon_fiber: {
      rgb: [42, 46, 52],
      variation: 18,
      streaks: "grid",
      roughness: 0.36,
      metalness: 0.55,
      bumpScale: 0.03,
      seed: 505,
    },
    asphalt: {
      rgb: [56, 58, 62],
      variation: 30,
      streaks: "none",
      roughness: 0.92,
      metalness: 0.02,
      bumpScale: 0.06,
      seed: 606,
    },
    warm_wood: {
      rgb: [148, 102, 66],
      variation: 28,
      streaks: "vertical",
      roughness: 0.72,
      metalness: 0.04,
      bumpScale: 0.04,
      seed: 707,
    },
    painted_metal: {
      rgb: [204, 152, 48],
      variation: 14,
      streaks: "none",
      roughness: 0.42,
      metalness: 0.38,
      bumpScale: 0.02,
      seed: 808,
    },
  };

  const spec = presetSpec[preset];
  const map = createProceduralNoiseTexture(spec.seed, spec.rgb, spec.variation, spec.streaks);
  const bumpMap = createProceduralNoiseTexture(spec.seed + 99, [128, 128, 128], spec.variation * 1.4, spec.streaks);
  if (map) map.repeat.set(repeat[0], repeat[1]);
  if (bumpMap) {
    bumpMap.colorSpace = THREE.NoColorSpace;
    bumpMap.repeat.set(repeat[0], repeat[1]);
  }

  return new THREE.MeshStandardMaterial({
    color: overrides.color ?? 0xffffff,
    map: map ?? undefined,
    bumpMap: bumpMap ?? undefined,
    bumpScale: overrides.bumpScale ?? spec.bumpScale,
    roughness: overrides.roughness ?? spec.roughness,
    metalness: overrides.metalness ?? spec.metalness,
  });
}

export interface CinematicRigHandles {
  group: THREE.Group;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  backgroundHex: string;
}

export function applyCinematicRig(scene: THREE.Scene, mood: LightingMood = "day_outdoor"): CinematicRigHandles {
  const presets: Record<
    LightingMood,
    {
      bg: string;
      fogHex: number;
      fogDensity: number;
      hemiSky: number;
      hemiGround: number;
      hemiInt: number;
      keyColor: number;
      keyInt: number;
      keyPos: [number, number, number];
      fillColor: number;
      fillInt: number;
      rimColor: number;
      rimInt: number;
    }
  > = {
    day_outdoor: {
      bg: "#8eb8d9",
      fogHex: 0x9ec2dc,
      fogDensity: 0.0085,
      hemiSky: 0xd9ecff,
      hemiGround: 0x5c685e,
      hemiInt: 0.85,
      keyColor: 0xfff4e0,
      keyInt: 2.3,
      keyPos: [14, 22, 16],
      fillColor: 0x9cc4e8,
      fillInt: 0.65,
      rimColor: 0xffe6ba,
      rimInt: 0.85,
    },
    golden_hour: {
      bg: "#d99262",
      fogHex: 0xd8966b,
      fogDensity: 0.011,
      hemiSky: 0xffd0a1,
      hemiGround: 0x45352c,
      hemiInt: 0.75,
      keyColor: 0xffa65c,
      keyInt: 2.55,
      keyPos: [-18, 9, 14],
      fillColor: 0x6f8fb8,
      fillInt: 0.55,
      rimColor: 0xffc77a,
      rimInt: 1.25,
    },
    night_industrial: {
      bg: "#0e1928",
      fogHex: 0x101c2c,
      fogDensity: 0.014,
      hemiSky: 0x3b587a,
      hemiGround: 0x11151c,
      hemiInt: 0.55,
      keyColor: 0xfff0cc,
      keyInt: 2.4,
      keyPos: [8, 16, 12],
      fillColor: 0x3d74b8,
      fillInt: 0.75,
      rimColor: 0xffaa44,
      rimInt: 1.3,
    },
    studio_macro: {
      bg: "#161d24",
      fogHex: 0x161d24,
      fogDensity: 0.006,
      hemiSky: 0xd8e4f2,
      hemiGround: 0x262b30,
      hemiInt: 0.7,
      keyColor: 0xffffff,
      keyInt: 2.2,
      keyPos: [10, 14, 12],
      fillColor: 0x8fb8e6,
      fillInt: 0.8,
      rimColor: 0xffd7a8,
      rimInt: 1.35,
    },
    underwater_deep: {
      bg: "#0a2c40",
      fogHex: 0x0b344c,
      fogDensity: 0.024,
      hemiSky: 0x45b4d6,
      hemiGround: 0x081a24,
      hemiInt: 0.9,
      keyColor: 0x8ef0ff,
      keyInt: 1.9,
      keyPos: [4, 24, 6],
      fillColor: 0x1c6a8c,
      fillInt: 0.7,
      rimColor: 0x7ae2ff,
      rimInt: 1.1,
    },
  };

  const p = presets[mood];
  const group = new THREE.Group();
  group.name = `cinematic_rig_${mood}`;

  const hemiLight = new THREE.HemisphereLight(p.hemiSky, p.hemiGround, p.hemiInt);
  const keyLight = new THREE.DirectionalLight(p.keyColor, p.keyInt);
  keyLight.position.set(p.keyPos[0], p.keyPos[1], p.keyPos[2]);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0005;

  const fillLight = new THREE.DirectionalLight(p.fillColor, p.fillInt);
  fillLight.position.set(-p.keyPos[0] * 0.8, p.keyPos[1] * 0.5, -p.keyPos[2] * 0.6);

  const rimLight = new THREE.DirectionalLight(p.rimColor, p.rimInt);
  rimLight.position.set(0, p.keyPos[1] * 0.6, -p.keyPos[2] * 1.1);

  group.add(hemiLight, keyLight, fillLight, rimLight);
  scene.add(group);
  scene.background = new THREE.Color(p.bg);
  scene.fog = new THREE.FogExp2(p.fogHex, p.fogDensity);

  return { group, keyLight, fillLight, rimLight, hemiLight, backgroundHex: p.bg };
}

/**
 * Places a PerspectiveCamera to frame a 3D hero bounding box safely inside 9:16 portrait bounds
 * (guaranteed >= 16% margin on all sides so nothing clips off edges or gets hidden behind Shorts UI).
 */
export function frameHeroSafe9x16(
  camera: THREE.PerspectiveCamera,
  target: [number, number, number],
  bounds: { width: number; height: number; depth?: number },
  opts: {
    shotType?: ShotType;
    azimuthDeg?: number;
    elevationDeg?: number;
    marginPercent?: number;
    fovDeg?: number;
    progress?: number; // 0..1 within shot for smooth cinematic creeping motion
    dollyFactor?: number; // e.g. -0.08 pushes in 8% over the shot
    orbitDeg?: number; // e.g. 6 rotates 6 deg smoothly over the shot
  } = {}
): { distance: number } {
  const fovDeg = Math.min(44, Math.max(32, opts.fovDeg ?? 38));
  const marginPercent = Math.max(0.16, Math.min(0.32, opts.marginPercent ?? 0.2));
  const framing = calcCameraDistance({
    objectWidth: Math.max(0.5, bounds.width),
    objectHeight: Math.max(0.5, bounds.height),
    objectDepth: Math.max(0, bounds.depth ?? bounds.width * 0.5),
    fovDeg,
    aspect: 9 / 16,
    marginPercent,
    shotType: opts.shotType ?? "wide",
  });

  const t = Math.max(0, Math.min(1, opts.progress ?? 0));
  const dist = framing.distance * (1 + (opts.dollyFactor ?? -0.06) * t);
  const azRad = (((opts.azimuthDeg ?? 24) + (opts.orbitDeg ?? 5) * t) * Math.PI) / 180;
  const elRad = ((opts.elevationDeg ?? 14) * Math.PI) / 180;

  const cx = target[0] + Math.sin(azRad) * Math.cos(elRad) * dist;
  const cy = target[1] + Math.sin(elRad) * dist;
  const cz = target[2] + Math.cos(azRad) * Math.cos(elRad) * dist;

  camera.fov = fovDeg;
  camera.aspect = 9 / 16;
  camera.position.set(cx, cy, cz);
  camera.lookAt(target[0], target[1], target[2]);
  camera.updateProjectionMatrix();

  return { distance: dist };
}

/**
 * Generates an organic multi-ridge 3D terrain / mountain range mesh using displaced vertices
 * (replaces artificial-looking ConeGeometry pyramids with natural documentary topography).
 */
export function createSculptedTerrain(opts: {
  width?: number;
  depth?: number;
  segments?: number;
  maxHeight?: number;
  seed?: number;
  color?: string | number;
  roughness?: number;
} = {}): THREE.Mesh {
  const width = opts.width ?? 140;
  const depth = opts.depth ?? 100;
  const segs = Math.min(96, Math.max(24, opts.segments ?? 48));
  const maxHeight = opts.maxHeight ?? 24;
  const seed = opts.seed ?? 17;

  const geo = new THREE.PlaneGeometry(width, depth, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const ridge1 = Math.sin(x * 0.065 + seed) * Math.cos(z * 0.07 - seed * 0.5);
    const ridge2 = Math.sin(x * 0.14 - z * 0.11 + seed * 1.7) * 0.45;
    const ridge3 = Math.cos(x * 0.27 + z * 0.23) * 0.18;
    const edgeFade = Math.max(0, 1 - Math.pow(Math.abs(x) / (width * 0.55), 2));
    const h = Math.max(0, (ridge1 * 0.5 + 0.5 + ridge2 + ridge3) * 0.55 * maxHeight * edgeFade);
    pos.setY(i, h);
  }
  geo.computeVertexNormals();

  const mat = createPbrMaterial("cast_concrete", {
    color: opts.color ?? 0x5f6b63,
    roughness: opts.roughness ?? 0.92,
    metalness: 0.02,
    repeat: [6, 6],
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
