// Timeline & Camera Choreography for Stage 6 PoC: "Rahasia Klorofil" (8.0s = 240f @ 30fps)

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
} from "../../shared/kokisoyo25d";
import type { LightMode, StageShotMeta } from "../../shared/kokisoyo25d";

export const FPS = 30;
export const TOTAL = 240;

export interface PocShot extends StageShotMeta {
  id: number;
  a: number;
  b: number;
  light: LightMode;
  label: string;
}

export const SHOTS: PocShot[] = [
  { id: 1, a: 0, b: 80, light: "day", label: "MISTERI DAUN HIJAU" },
  { id: 2, a: 80, b: 160, light: "day", label: "KLOROFIL & CAHAYA" },
  { id: 3, a: 160, b: TOTAL, light: "golden", label: "HIJAU DIPANTULKAN" },
];

export const XFADE: Record<number, number> = {
  3: 8,
};

export const FLASH_AT = 80;

export const KICKS: [number, number][] = [[80 / FPS, 0.75]];

const WIDE_BOTANY = frameObject9x16({
  target: [0.05, 1.25, -0.15],
  objectWidth: 3.1,
  objectHeight: 2.5,
  azimuthDeg: 14,
  elevationDeg: 10,
  fovDeg: 40,
  marginPercent: 0.16,
  shotType: "wide",
});

const HERO_FRAME = frameObject9x16({
  target: [0.1, 1.18, -0.1],
  objectWidth: 3.45,
  objectHeight: 2.45,
  azimuthDeg: -10,
  elevationDeg: 11,
  fovDeg: 39,
  marginPercent: 0.18,
  shotType: "medium",
});

const S1a = (f: number) =>
  dolly(WIDE_BOTANY.pos, WIDE_BOTANY.look, pushK(f, 0, 0.0024), { fov: WIDE_BOTANY.fov });

const S1b = (f: number) =>
  dolly([-0.6, 1.55, 4.1], [0.05, 1.2, -0.25], pushK(f, 40, 0.0028), { fov: 38, roll: -0.02 });

const S2a = (f: number) =>
  zoom([-0.55, 1.72, 2.32], [0.18, 1.24, -0.42], 38, pushK(f, 80, 0.0025));

const S3a = (f: number) =>
  dolly(HERO_FRAME.pos, HERO_FRAME.look, pushK(f, 160, 0.0022), { fov: HERO_FRAME.fov, roll: 0.015 });

const CAMS: Record<number, CamKey[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 40, dur: 26, s: S1b },
  ],
  2: [{ f: 80, s: S2a }],
  3: [{ f: 160, s: S3a }],
};

export function camAt(shotId: number, f: number): Cam {
  const keys = CAMS[shotId] ?? CAMS[1];
  const base = runCamKeys(keys, f);
  return applyKick(base, kickAt(f / FPS, KICKS, FPS));
}

export const DOF: DofEntry[] = [
  { f: 0, cInf: 0 },
  { f: 80, dur: 12, cInf: 7, focus: (): V3 => [0.1, 1.2, -0.35] },
  { f: 160, dur: 14, cInf: 10, focus: (): V3 => [0.0, 1.25, -0.15] },
];
