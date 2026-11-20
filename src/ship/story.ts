// Timeline and choreography for Episode 1: "Kenapa Kapal Bisa Mengapung?"
// Duration: 67.0 seconds = 2010 frames @ 30 FPS
export const FPS = 30;
export const TOTAL = 2010;
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

// ---------------- 5 Cinematic Shots (67.0 Seconds) ----------------
export type ShotDef = {
  id: number;
  a: number;
  b: number;
  name: string;
};

export const SHOTS: ShotDef[] = [
  // Shot 1: Koin Tenggelam vs Kapal Utuh (0s - 10.13s / f=0 - 304)
  { id: 1, a: 0, b: 304, name: "Koin Tenggelam vs Kapal Utuh" },
  // Shot 2: Mesin Mati, Tetap Mengapung (10.13s - 22.13s / f=304 - 664)
  { id: 2, a: 304, b: 664, name: "Mesin Mati Tetap Mengapung" },
  // Shot 3: Baja Padat vs Lambung Berongga (22.13s - 38.53s / f=664 - 1156)
  { id: 3, a: 664, b: 1156, name: "Baja Padat vs Lambung Berongga" },
  // Shot 4: Gaya Apung 50:50 Waterline Split (38.53s - 56.0s / f=1156 - 1680)
  { id: 4, a: 1156, b: 1680, name: "Gaya Apung 50:50 Split" },
  // Shot 5: Closing Outro Berlayar (56.0s - 67.0s / f=1680 - 2010)
  { id: 5, a: 1680, b: TOTAL, name: "Closing Outro Berlayar" },
];

export const XFADE: Record<number, number> = { 2: 4, 3: 4, 4: 4, 5: 6 };

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

export const camAt = (id: number, f: number): Cam => {
  if (id === 1) {
    if (f < 111) {
      // Shot 1A (f=0..110): Close/medium center view on the large gold coin.
      // Starts above water, tracks the coin as it plunges and sinks underwater.
      const u = clamp01(f / 110);
      const k = glide(u);
      const pos: V3 = [0.0, 1.6 - 1.4 * k, -5.6 - 0.6 * k];
      const look: V3 = [0.0, 1.2 - 3.8 * k, 0.0];
      return { pos, look, fov: 42, roll: 0 };
    } else {
      // Shot 1B (f=111..304): Expansive wide 3/4 cinematic shot of the ENTIRE CARGO SHIP.
      // Sized and distanced so the whole 54m vessel from bow to stern fits in 9:16 portrait.
      const u = clamp01((f - 111) / 193);
      const k = glide(u);
      const pos: V3 = [
        -42.0 + 4.0 * k,
        13.0 - 2.0 * k,
        -20.0 + 4.0 * k,
      ];
      const look: V3 = [0.0, 3.8, 6.0];
      return { pos, look, fov: 44 - 2 * k, roll: 0.006 * (1 - 2 * k) };
    }
  }

  if (id === 2) {
    // Shot 2: Deck Presenter (Captain)
    // 9:16 safe framing with generous headroom (top 20-25%)
    // Captain stands at (9.8, 3.5, 0.0), camera at y=5.2 looking at y=4.3
    const u = clamp01((f - 304) / 360);
    const k = glide(u);
    const pos: V3 = [
      5.6 + 0.3 * k,
      5.2 - 0.2 * k,
      -6.0 + 0.8 * k,
    ];
    const look: V3 = [
      9.8,
      4.3 - 0.1 * k,
      0.0,
    ];
    return { pos, look, fov: 38 - 1.5 * k, roll: 0 };
  }

  if (id === 3) {
    // Shot 3: Solid Steel Block vs Hollow Hull Cavern (f=664..1156)
    if (f < 845) {
      // Part A (f=664..844): Center view on solid steel block plunging into water
      const ua = clamp01((f - 664) / 180);
      const ka = glide(ua);
      const pos: V3 = [0.0, 3.5 - 1.8 * ka, -16.0 + 2.0 * ka];
      const look: V3 = [0.0, 1.0 - 4.0 * ka, 0.0];
      return { pos, look, fov: 42, roll: 0 };
    } else {
      // Part B (f=845..1156): Broadside view of cutaway hull revealing vast hollow air hold
      const ub = clamp01((f - 845) / 311);
      const kb = glide(ub);
      const pos: V3 = [
        -27.0 - 2.0 * kb,
        3.8 + 0.4 * kb,
        5.0 + 2.0 * kb,
      ];
      const look: V3 = [0.0, 3.2, 5.0 + 0.5 * kb];
      return { pos, look, fov: 40, roll: 0 };
    }
  }

  if (id === 4) {
    // Shot 4: Archimedes Buoyancy Force Dynamics (50:50 Waterline Split)
    // Camera is positioned at y = 0.2 looking horizontally across the waterline:
    // Top 50% = ship above water + red gravity arrow
    // Bottom 50% = submerged red hull + 3 green buoyancy arrows underwater
    const u = clamp01((f - 1156) / 524);
    const k = glide(u);
    const pos: V3 = [
      -29.0 + 1.0 * k,
      0.2,
      5.0 + 1.0 * k,
    ];
    const look: V3 = [
      0.0,
      0.2,
      5.0 + 0.5 * k,
    ];
    return { pos, look, fov: 40, roll: 0 };
  }

  // Shot 5: Heroic Outro (f=1680..2010)
  // Wide cinematic pull-back shot showing full ship sailing across the open ocean
  const u = clamp01((f - 1680) / 330);
  const k = glide(u);
  const pos: V3 = [
    -36.0 - 10.0 * k,
    11.0 + 5.0 * k,
    -24.0 - 18.0 * k,
  ];
  const look: V3 = [
    0.0,
    5.5 + 1.5 * k,
    6.0 + 8.0 * k,
  ];
  return { pos, look, fov: 42 - 3 * k, roll: 0.006 * (1 - 2 * k) };
};

// ---------------- Depth of Field ----------------
export type Dof = { f: number; cInf: number; focus?: (f: number) => V3 };

export const DOF: Dof[] = [
  { f: 0, cInf: 0, focus: () => [0, 0, 0] },
  { f: 111, cInf: 0, focus: () => [0, 4, 6] },
  { f: 304, cInf: 0, focus: () => [9.8, 4.3, 0] },
  { f: 664, cInf: 0, focus: () => [0, 0, 0] },
  { f: 845, cInf: 0, focus: () => [0, 3.2, 5] },
  { f: 1156, cInf: 0, focus: () => [0, 0.2, 5] },
  { f: 1680, cInf: 0, focus: () => [0, 6, 8] },
];

export const dofAt = (f: number) => {
  let i = 0;
  while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i];
  return { cInf: d.cInf, focus: d.focus };
};

// ---------------- Object Physics Timing ----------------

// Shot 1: Gold Coin Drop in Center Frame
export const COIN_DROP_F = 15;
export const COIN_SPLASH_F = 45;

export const coinStateAt = (f: number) => {
  if (f > 110) return { pos: [0, -30, 0] as V3, visible: false, splashT: 0, rot: 0 };
  const origin: V3 = [0.0, 2.2, 0.0];
  if (f < COIN_DROP_F) {
    return { pos: origin, visible: true, splashT: 0, rot: f * 0.08 };
  }
  const dt = (f - COIN_DROP_F) / FPS;

  let y: number;
  if (f <= COIN_SPLASH_F) {
    // Air freefall
    y = origin[1] - 0.5 * 11 * dt * dt;
  } else {
    // Sinking underwater with water drag
    const dtWater = (f - COIN_SPLASH_F) / FPS;
    y = 0.0 - 2.4 * dtWater;
  }
  const pos: V3 = [origin[0], y, origin[2]];

  let splashT = 0;
  if (f >= COIN_SPLASH_F && f <= COIN_SPLASH_F + 25) {
    splashT = (f - COIN_SPLASH_F) / 25;
  }
  return { pos, visible: y > -8, splashT, rot: f * 0.18 };
};

// Shot 3: Solid Steel Block Plunge
export const STEEL_DROP_F = 705;
export const STEEL_SPLASH_F = 730;

export const steelBlockStateAt = (f: number) => {
  if (f < 664 || f > 844) return { pos: [0, -50, 0] as V3, visible: false, splashT: 0 };
  const origin: V3 = [0.0, 5.5, 0.0];
  if (f < STEEL_DROP_F) {
    return { pos: origin, visible: true, splashT: 0 };
  }
  const dt = (f - STEEL_DROP_F) / FPS;
  let y: number;
  if (f <= STEEL_SPLASH_F) {
    // Air freefall
    y = origin[1] - 0.5 * 18 * dt * dt;
  } else {
    // Plunges fast into ocean depths
    const dtWater = (f - STEEL_SPLASH_F) / FPS;
    y = 0.0 - 4.5 * dtWater - 0.5 * 8 * dtWater * dtWater;
  }
  const pos: V3 = [origin[0], y, origin[2]];

  let splashT = 0;
  if (f >= STEEL_SPLASH_F && f <= STEEL_SPLASH_F + 35) {
    splashT = (f - STEEL_SPLASH_F) / 35;
  }
  return { pos, visible: y > -25, splashT };
};

// Shot 3 & 4: Cutaway and Force Arrow Animation States
export const ep1AnimationStateAt = (f: number) => {
  // Cutaway panel opens during Shot 3 (f=850..910) and stays open through Shot 4
  let cutawayProgress = 0;
  if (f >= 850 && f <= 910) {
    cutawayProgress = smooth((f - 850) / 60);
  } else if (f > 910 && f < 1680) {
    cutawayProgress = 1;
  } else if (f >= 1680) {
    cutawayProgress = 0; // Fully closed for Shot 5 sailing outro
  }

  // 3D Force Arrows (Shot 4: f=1156 - 1680)
  let gravityScale = 0;
  let buoyancyScale = 0;

  if (f >= 1180 && f < 1660) {
    // Gravity arrow animates down (1180 - 1230)
    gravityScale = easeOut(clamp01((f - 1180) / 50));
    // Buoyant force surges up powerfully (1360 - 1420)
    if (f >= 1360) {
      buoyancyScale = easeOut(clamp01((f - 1360) / 50));
    }
  }

  return { cutawayProgress, gravityScale, buoyancyScale };
};
