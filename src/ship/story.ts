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

// ---------------- 5 Cinematic Shots (67 Seconds) ----------------
export type ShotDef = {
  id: number;
  a: number;
  b: number;
  name: string;
};

export const SHOTS: ShotDef[] = [
  // Shot 1: Wide Ship 3/4 + Sinking Coin (0s - 11s / f=0 - 330)
  { id: 1, a: 0, b: 330, name: "Wide Ship & Coin Drop" },
  // Shot 2: Deck Presenter: Shape Over Weight (11s - 23s / f=330 - 690)
  { id: 2, a: 330, b: 690, name: "Deck Presenter: Shape Over Weight" },
  // Shot 3: Solid Steel Block vs Hollow Hull Cavern (23s - 38s / f=690 - 1140)
  { id: 3, a: 690, b: 1140, name: "Solid Steel vs Hollow Cavern" },
  // Shot 4: Archimedes Buoyant Force Dynamics (38s - 55s / f=1140 - 1650)
  { id: 4, a: 1140, b: 1650, name: "Archimedes Buoyancy Force" },
  // Shot 5: Heroic Outro: Sailing Ship & Wave (55s - 67s / f=1650 - 2010)
  { id: 5, a: 1650, b: TOTAL, name: "Heroic Outro & Waving" },
];

export const XFADE: Record<number, number> = { 2: 6, 3: 6, 4: 6, 5: 8 };

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
    // Shot 1: Wide 3/4 camera view showing full ship bow, containers, and sea.
    // Pulled back sufficiently so camera is never blocked by hull walls.
    const u = clamp01(f / 330);
    const k = glide(u);
    const pos: V3 = [
      -26.0 + 8.0 * k,
      7.5 - 2.0 * k,
      -36.0 + 14.0 * k,
    ];
    const look: V3 = [
      0.0,
      5.2 + 0.8 * k,
      -8.0 + 2.0 * k,
    ];
    return { pos, look, fov: 42 - 2 * k, roll: 0.008 * (1 - 2 * k) };
  }

  if (id === 2) {
    // Shot 2: Deck Presenter (Captain)
    // Carefully tuned 9:16 safe framing:
    // Captain stands at (9.8, 3.5, 0.0), height ~1.3m, head at y=4.8.
    // Camera at y=5.2 looking at y=4.2 ensures generous headroom (top 20%) and clean center framing!
    const u = clamp01((f - 330) / 360);
    const k = glide(u);
    const pos: V3 = [
      5.6 + 0.4 * k,
      5.2 - 0.2 * k,
      -6.2 + 1.2 * k,
    ];
    const look: V3 = [
      9.8,
      4.2 - 0.1 * k,
      0.0,
    ];
    return { pos, look, fov: 38 - 1.5 * k, roll: 0 };
  }

  if (id === 3) {
    // Shot 3: Solid Steel Block vs Hollow Hull Cavern (23s - 38s)
    // Part A: Camera focuses on falling solid steel block plunging into water.
    // Part B: Camera smoothly pivots/glides to ship cutaway showing empty air hold.
    const u = clamp01((f - 690) / 450);
    if (f < 870) {
      // Part A: Steel block dropping into water
      const ua = clamp01((f - 690) / 180);
      const ka = glide(ua);
      const pos: V3 = [-16.0 - 2.0 * ka, 4.5, -8.0 + 2.0 * ka];
      const look: V3 = [-6.0, 1.0 - 3.0 * ka, 0.0];
      return { pos, look, fov: 42, roll: 0 };
    } else {
      // Part B: Dolly to cutaway revealing hollow air cavity
      const ub = clamp01((f - 870) / 270);
      const kb = glide(ub);
      const pos: V3 = [
        -20.0 - 6.0 * kb,
        4.8 + 1.0 * kb,
        -4.0 + 8.0 * kb,
      ];
      const look: V3 = [0.0, 3.5, 4.0 + 1.0 * kb];
      return { pos, look, fov: 40 - 2 * kb, roll: 0 };
    }
  }

  if (id === 4) {
    // Shot 4: Archimedes Buoyant Force Dynamics (38s - 55s)
    // Camera pulled back cleanly (-28m) so side frame posts DO NOT obstruct view!
    const u = clamp01((f - 1140) / 510);
    const k = glide(u);
    const pos: V3 = [
      -28.0 + 2.0 * k,
      5.8 + 0.6 * k,
      5.0 + 4.0 * k,
    ];
    const look: V3 = [
      0.0,
      3.6,
      5.0 + 1.0 * k,
    ];
    return { pos, look, fov: 40 - 2 * k, roll: 0 };
  }

  // Shot 5: Heroic Outro (55s - 67s)
  // Grand pull-back crane / dolly shot showing the ship sailing into the horizon
  const u = clamp01((f - 1650) / 360);
  const k = glide(u);
  const pos: V3 = [
    -25.0 - 18.0 * k,
    6.5 + 8.0 * k,
    -14.0 - 24.0 * k,
  ];
  const look: V3 = [
    0.0,
    6.0 + 1.5 * k,
    6.0 + 10.0 * k,
  ];
  return { pos, look, fov: 42 - 3 * k, roll: 0.005 * (1 - 2 * k) };
};

// ---------------- Depth of Field ----------------
export type Dof = { f: number; cInf: number; focus?: (f: number) => V3 };

export const DOF: Dof[] = [
  { f: 0, cInf: 0, focus: () => [0, 5, -8] },
  { f: 330, cInf: 0, focus: () => [9.8, 4.2, 0] },
  { f: 690, cInf: 0, focus: () => [0, 3.5, 5] },
  { f: 1140, cInf: 0, focus: () => [0, 3.5, 5] },
  { f: 1650, cInf: 0, focus: () => [0, 6, 8] },
];

export const dofAt = (f: number) => {
  let i = 0;
  while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i];
  return { cInf: d.cInf, focus: d.focus };
};

// ---------------- Object Physics Timing ----------------

// Shot 1: Small Coin Drop in foreground
export const COIN_DROP_F = 20;
export const COIN_SPLASH_F = 46;

export const coinStateAt = (f: number) => {
  if (f > 330) return { pos: [-6, -20, -12] as V3, visible: false, splashT: 0, rot: 0 };
  const origin: V3 = [-6.2, 3.8, -12.5];
  if (f < COIN_DROP_F) {
    return { pos: origin, visible: true, splashT: 0, rot: f * 0.05 };
  }
  const dt = (f - COIN_DROP_F) / FPS;
  const y = origin[1] - 0.5 * 14 * dt * dt;
  const pos: V3 = [origin[0], y, origin[2]];

  let splashT = 0;
  if (f >= COIN_SPLASH_F && f <= COIN_SPLASH_F + 25) {
    splashT = (f - COIN_SPLASH_F) / 25;
  }
  return { pos, visible: y > -8, splashT, rot: f * 0.2 };
};

// Shot 3: Solid Steel Block Plunge
export const STEEL_DROP_F = 710;
export const STEEL_SPLASH_F = 738;

export const steelBlockStateAt = (f: number) => {
  if (f < 690 || f > 1140) return { pos: [-6, -50, 0] as V3, visible: false, splashT: 0 };
  const origin: V3 = [-6.0, 6.5, 0.0];
  if (f < STEEL_DROP_F) {
    return { pos: origin, visible: true, splashT: 0 };
  }
  const dt = (f - STEEL_DROP_F) / FPS;
  // Plummets fast
  const y = origin[1] - 0.5 * 20 * dt * dt;
  const pos: V3 = [origin[0], y, origin[2]];

  let splashT = 0;
  if (f >= STEEL_SPLASH_F && f <= STEEL_SPLASH_F + 35) {
    splashT = (f - STEEL_SPLASH_F) / 35;
  }
  return { pos, visible: y > -20, splashT };
};

// Shot 3 & 4: Cutaway and Force Arrow Animation States
export const ep1AnimationStateAt = (f: number) => {
  // Cutaway panel opens during Shot 3 (f=870..930) and stays open through Shot 4
  let cutawayProgress = 0;
  if (f >= 870 && f <= 930) {
    cutawayProgress = smooth((f - 870) / 60);
  } else if (f > 930 && f < 1650) {
    cutawayProgress = 1;
  } else if (f >= 1650) {
    // Closes up for Shot 5 heroic sail
    cutawayProgress = 0;
  }

  // 3D Force Arrows (Shot 4: f=1140 - 1650)
  let gravityScale = 0;
  let buoyancyScale = 0;

  if (f >= 1180 && f < 1640) {
    // Gravity arrow animates in (1180 - 1240)
    gravityScale = easeOut(clamp01((f - 1180) / 45));
    // Buoyant force surges up powerfully (1240 - 1310)
    if (f >= 1240) {
      buoyancyScale = easeOut(clamp01((f - 1240) / 50));
    }
  }

  return { cutawayProgress, gravityScale, buoyancyScale };
};
