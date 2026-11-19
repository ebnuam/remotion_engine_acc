// Timeline and choreography for "Kenapa Kapal Bisa Mengapung?" (12s / 360 frames @ 30 FPS)
export const FPS = 30;
export const TOTAL = 360; // 12 seconds @ 30 FPS
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const glide = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};

// ---------------- 3 Cinematic Shots ----------------
export type ShotDef = {
  id: number;
  a: number;
  b: number;
  name: string;
};

export const SHOTS: ShotDef[] = [
  // Shot 1: Low-angle bow push (0s - 4s / f=0 - 120)
  { id: 1, a: 0, b: 120, name: "Bow Push" },
  // Shot 2: Deck presenter & nail drop into water (4s - 8s / f=120 - 240)
  { id: 2, a: 120, b: 240, name: "Deck Nail Drop" },
  // Shot 3: Side orbit cutaway hull & Archimedes force arrows (8s - 12s / f=240 - 360)
  { id: 3, a: 240, b: 360, name: "Hull Cutaway & Forces" },
];

export const XFADE: Record<number, number> = { 2: 4, 3: 4 };

export const shotAt = (f: number) =>
  SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) },
      ];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- Camera Choreography ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };

const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});

export const camAt = (id: number, f: number): Cam => {
  if (id === 1) {
    // Shot 1: Low-angle dramatic dolly push over water towards the towering ship bow
    const u = clamp01(f / 120);
    const k = glide(u);
    // Pushes from z=-38 up to z=-24, rising slightly from water surface
    const pos: V3 = [
      0.6 * (1 - k),
      1.2 + 1.2 * k,
      -38 + 14 * k,
    ];
    // Looking up at the flared bow and container stacks
    const look: V3 = [
      0,
      6.5 + 2.0 * k,
      -10 + 6 * k,
    ];
    return { pos, look, fov: 44 - 4 * k, roll: 0.01 * (1 - 2 * k) };
  }

  if (id === 2) {
    // Shot 2: Medium shot on the pier/deck framing Captain and the drop spot
    const u = clamp01((f - 120) / 120);
    const k = glide(u);
    const pos: V3 = [
      6.2 + 0.6 * k,
      4.6 + 0.2 * k,
      -4.2 + 1.2 * k,
    ];
    const look: V3 = [
      9.6,
      3.8 - 0.4 * k,
      0.2 + 0.2 * k,
    ];
    return { pos, look, fov: 40 - 2 * k, roll: 0 };
  }

  // Shot 3: Side broadside view orbiting around the cutaway hull
  const u = clamp01((f - 240) / 120);
  const k = glide(u);
  // Camera swings from 3/4 front view around to clean side view
  const pos: V3 = [
    -26.0 + 3.0 * k,
    5.5 + 2.0 * k,
    -12.0 + 18.0 * k,
  ];
  const look: V3 = [
    0,
    3.8,
    4.0 + 2.0 * k,
  ];
  return { pos, look, fov: 42 - 3 * k, roll: 0 };
};

// ---------------- Depth of Field ----------------
export type Dof = { f: number; cInf: number; focus?: (f: number) => V3 };

export const DOF: Dof[] = [
  // Shot 1: Focus on bow waterline
  { f: 0, cInf: 14, focus: (f) => [0, 4.0, -18 + 5 * (f / 120)] },
  // Shot 2: Focus on Captain and nail drop area
  { f: 120, cInf: 18, focus: () => [9.5, 3.8, 0.2] },
  // Shot 3: Focus on cutaway hull interior and force arrows
  { f: 240, cInf: 12, focus: () => [0, 3.5, 5.0] },
];

export const dofAt = (f: number) => {
  let i = 0;
  while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i];
  return { cInf: d.cInf, focus: d.focus };
};

export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

// ---------------- Nail drop physics (Shot 2) ----------------
export const NAIL_DROP_F = 146; // frame when nail is released
export const NAIL_SPLASH_F = 168; // frame when nail hits water surface (y=0)

export const nailStateAt = (f: number) => {
  // Presenter hand position
  const hand: V3 = [9.1, 4.4, 0.3];
  if (f < NAIL_DROP_F) {
    return { pos: hand, visible: true, dropped: false, splashT: 0 };
  }
  const dt = (f - NAIL_DROP_F) / FPS;
  // Gravity acceleration g = 18 m/s^2 for punchy cartoon timing
  const y = hand[1] - 0.5 * 18 * (dt * dt);
  const pos: V3 = [hand[0] - 0.15 * dt, y, hand[2]];

  let splashT = 0;
  if (f >= NAIL_SPLASH_F) {
    splashT = Math.min(1, (f - NAIL_SPLASH_F) / 22);
  }

  // Once submerged deep below water (y < -3), hide the nail
  const visible = y > -3.5;
  return { pos, visible, dropped: true, splashT };
};

// ---------------- Hull cutaway & Force arrows (Shot 3) ----------------
export const cutawayStateAt = (f: number) => {
  if (f < 240) return { cutawayProgress: 0, gravityScale: 0, buoyancyScale: 0 };
  const u = clamp01((f - 240) / 120);

  // Cutaway panel reveals between frame 242 and 265
  const cutawayProgress = smooth(clamp01((f - 244) / 22));

  // Gravity arrow grows between frame 264 and 286
  const gravityScale = easeOut(clamp01((f - 264) / 20));

  // Buoyant force arrow surges up between frame 286 and 312
  const buoyancyScale = easeOut(clamp01((f - 286) / 22));

  return { cutawayProgress, gravityScale, buoyancyScale };
};
