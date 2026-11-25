// Episode Timeline & Camera Choreography Template
// Follows cartoon-3d-short pacing: 2-3s micro-shots, continuous push-in on holds,
// 9:16 autoFraming integration, selective DOF, and 7-frame impact kicks.

import {
  Cam,
  CamKey,
  DofEntry,
  V3,
  applyKick,
  dolly,
  frameObject9x16,
  kickAt,
  pushK,
  runCamKeys,
  zoom,
} from "../../src/shared/kokisoyo25d";
import type { LightMode, StageShotMeta } from "../../src/shared/kokisoyo25d";

export const FPS = 30;
export const TOTAL = 270; // Example 9s (3 shots) starter — expand per approved storyboard

export interface EpisodeShot extends StageShotMeta {
  id: number;
  a: number;
  b: number;
  light: LightMode;
  label?: string;
}

export const SHOTS: EpisodeShot[] = [
  { id: 1, a: 0, b: 90, light: "day", label: "HOOK VISUAL" },
  { id: 2, a: 90, b: 180, light: "day", label: "MEKANISME" },
  { id: 3, a: 180, b: TOTAL, light: "golden", label: "KESIMPULAN" },
];

export const XFADE: Record<number, number> = {
  3: 8,
};

export const FLASH_AT = 90;

export const KICKS: [number, number][] = [
  [3.0, 0.8],
];

// Auto-framed wide anchor computed mathematically for 9:16 portrait (0 clipping)
const WIDE_FRAME = frameObject9x16({
  target: [0, 1.3, 0],
  objectWidth: 3.4,
  objectHeight: 2.6,
  azimuthDeg: 18,
  elevationDeg: 9,
  fovDeg: 40,
  marginPercent: 0.16,
  shotType: "wide",
});

const S1a = (f: number) =>
  dolly(WIDE_FRAME.pos, WIDE_FRAME.look, pushK(f, 0, 0.0022), { fov: WIDE_FRAME.fov });
const S1b = (f: number) =>
  dolly([1.1, 1.65, 3.8], [0, 1.35, 0], pushK(f, 45, 0.0028), { fov: 38, roll: -0.03 });
const S2a = (f: number) =>
  zoom([4.6, 2.2, 4.4], [0, 1.2, 0], 40, pushK(f, 90, 0.0024));
const S3a = (f: number) =>
  dolly([-2.2, 1.7, 5.2], [0, 1.3, 0], pushK(f, 180, 0.002), { fov: 40, roll: 0.02 });

const CAMS: Record<number, CamKey[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 45, dur: 24, s: S1b },
  ],
  2: [{ f: 90, s: S2a }],
  3: [{ f: 180, s: S3a }],
};

export function camAt(shotId: number, f: number): Cam {
  const keys = CAMS[shotId] ?? CAMS[1];
  const base = runCamKeys(keys, f);
  return applyKick(base, kickAt(f / FPS, KICKS, FPS));
}

export const DOF: DofEntry[] = [
  { f: 0, cInf: 0 }, // Wide establishing stays sharp
  { f: 45, dur: 20, cInf: 12, focus: (): V3 => [0, 1.4, 0] }, // Close-up gets soft background bokeh
  { f: 90, cInf: 0 },
  { f: 180, cInf: 10, focus: (): V3 => [0, 1.35, 0] },
];
