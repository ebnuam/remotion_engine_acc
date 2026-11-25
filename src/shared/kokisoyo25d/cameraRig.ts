// Dynamic camera choreography helpers + 9:16 auto-framing bridge for Kok Iso Yo? 2.5D episodes.
// Preserves cartoon-3d-short smootherstep glides, push-in creeps, 7-frame impact kicks, and DOF tables.

import { calcCameraDistance, calcOrbitPosition, ShotType } from "../camera/autoFraming";
import { V3 } from "./proceduralWorld";

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type CamShot = Partial<Cam> & { pos: V3; look: V3 };
export type CamKey = { f: number; dur?: number; cut?: boolean; s: (f: number) => CamShot };

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const glide = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};

const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});

const fullCam = (c: CamShot): Cam => ({ fov: 40, roll: 0, ...c });

export function runCamKeys(keys: CamKey[], f: number): Cam {
  let cur = fullCam(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? fullCam(k.s(f)) : mixCam(cur, fullCam(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
}

export function pushK(f: number, f0: number, rate: number, punch = 0, n = 35): number {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) {
    for (let i = 0; i < Math.min(x, n); i++) {
      s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
    }
  }
  return Math.exp(-s);
}

export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): CamShot => ({
  pos: [
    look[0] + (pos[0] - look[0]) * k,
    look[1] + (pos[1] - look[1]) * k,
    look[2] + (pos[2] - look[2]) * k,
  ],
  look,
  ...rest,
});

export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): CamShot => ({
  pos,
  look,
  fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k),
  ...rest,
});

export const rolled = (s: (f: number) => CamShot, roll: number) => (f: number): CamShot => ({
  ...s(f),
  roll,
});

/** 7-frame alternating impact shake on dramatic beats. */
export function kickAt(t: number, kicks: [number, number][], fps = 30): number {
  let a = 0;
  for (const [t0, g] of kicks) {
    const n = Math.floor((t - t0) * fps + 1e-6);
    if (n >= 0 && n < 7) {
      a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
    }
  }
  return a;
}

export function applyKick(c: Cam, a: number): Cam {
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d);
  const h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return {
    ...c,
    look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m],
    roll: c.roll + a * 0.004,
  };
}

export type DofEntry = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };

export function evaluateDof(table: DofEntry[], f: number): { cInf: number; focus?: (f: number) => V3 } {
  if (table.length === 0) return { cInf: 0 };
  let i = 0;
  while (i + 1 < table.length && f >= table[i + 1].f) i++;
  const d = table[i];
  const p = table[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
}

/** Exact 9:16 portrait auto-framed camera placement using src/shared/camera/autoFraming.ts. */
export function frameObject9x16(opts: {
  target: V3;
  objectWidth: number;
  objectHeight: number;
  objectDepth?: number;
  azimuthDeg?: number;
  elevationDeg?: number;
  fovDeg?: number;
  marginPercent?: number;
  shotType?: ShotType;
}): { pos: V3; look: V3; fov: number } {
  const fovDeg = opts.fovDeg ?? 40;
  const framing = calcCameraDistance({
    objectWidth: opts.objectWidth,
    objectHeight: opts.objectHeight,
    objectDepth: opts.objectDepth ?? 0,
    fovDeg,
    aspect: 9 / 16,
    marginPercent: opts.marginPercent ?? 0.15,
    shotType: opts.shotType ?? "wide",
  });
  const pos = calcOrbitPosition(
    opts.target,
    framing.distance,
    opts.azimuthDeg ?? 18,
    opts.elevationDeg ?? 8
  );
  return { pos, look: opts.target, fov: fovDeg };
}

export type LayerSpec = { id: number; alpha: number };

export function computeCrossfadeLayers(
  shots: { id: number; a: number; b: number }[],
  xfade: Record<number, number>,
  f: number
): LayerSpec[] {
  for (const s of shots) {
    const x = xfade[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) },
      ];
    }
  }
  const active = shots.find((s) => f >= s.a && f < s.b) ?? shots[shots.length - 1];
  return [{ id: active.id, alpha: 1 }];
}
