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

// ---------------- Camera Choreography (25 Micro-Shots for Retention Editing) ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };

export type MicroShot = {
  id: number;
  name: string;
  start: number;
  end: number;
  cam: (k: number, f: number) => Cam;
};

export const MICRO_SHOTS: MicroShot[] = [
  // ---- Chapter 1: Koin vs Kapal (f: 0 - 304 / 4 Micro-Shots) ----
  {
    id: 1,
    name: "Koin Melayang di Udara",
    start: 0,
    end: 70,
    cam: (k) => ({
      pos: [0.0, 1.8 - 0.4 * k, -5.2 - 0.4 * k],
      look: [0.0, 1.6 - 0.6 * k, 0.0],
      fov: 38,
      roll: 0,
    }),
  },
  {
    id: 2,
    name: "Koin Nyungsep Bawah Air",
    start: 70,
    end: 112,
    cam: (k) => ({
      pos: [0.0, -0.6 - 1.4 * k, -5.6 - 0.6 * k],
      look: [0.0, -0.5 - 3.4 * k, 0.0],
      fov: 42,
      roll: 0,
    }),
  },
  {
    id: 3,
    name: "Heroic Low-Angle Haluan Kapal Baja",
    start: 112,
    end: 205,
    cam: (k) => ({
      pos: [-18.0 + 4.0 * k, 1.8 + 0.8 * k, -28.0 + 3.0 * k],
      look: [0.0, 6.0 + 0.5 * k, -14.0],
      fov: 42,
      roll: -0.008 + 0.008 * k,
    }),
  },
  {
    id: 4,
    name: "Ultra-Wide Kapal Mengapung Santai",
    start: 205,
    end: 304,
    cam: (k) => ({
      pos: [-110.0 + 15.0 * k, 10.0 - 1.5 * k, -40.0 + 18.0 * k],
      look: [0.0, 4.0, 4.0 + 1.0 * k],
      fov: 40,
      roll: 0,
    }),
  },

  // ---- Chapter 2: Mesin Mati Tetap Mengapung (f: 304 - 664 / 5 Micro-Shots) ----
  {
    id: 5,
    name: "High Aerial Kapal Melaju",
    start: 304,
    end: 375,
    cam: (k) => ({
      pos: [-38.0 + 8.0 * k, 26.0 - 4.0 * k, -22.0 + 8.0 * k],
      look: [0.0, 5.0, 5.0],
      fov: 38,
      roll: 0,
    }),
  },
  {
    id: 6,
    name: "Low Rear Quarter Cerobong & Menara",
    start: 375,
    end: 437,
    cam: (k) => ({
      pos: [18.0 - 3.5 * k, 6.0 + 1.5 * k, 36.0 - 6.0 * k],
      look: [0.0, 11.0, 16.0],
      fov: 38,
      roll: 0.006 * (1 - 2 * k),
    }),
  },
  {
    id: 7,
    name: "Close-Up Buritan: Baling-Baling Diam (MESIN MATI)",
    start: 437,
    end: 520,
    cam: (k) => ({
      pos: [3.8 - 0.8 * k, -1.8 - 0.2 * k, 37.0 - 1.8 * k],
      look: [0.0, -2.4, 32.8],
      fov: 36,
      roll: 0,
    }),
  },
  {
    id: 8,
    name: "Waterline Wide Kapal Tenang Tanpa Mesin",
    start: 520,
    end: 595,
    cam: (k) => ({
      pos: [-78.0 + 10.0 * k, 4.5 - 0.5 * k, 8.0 - 2.0 * k],
      look: [0.0, 3.5, 5.0],
      fov: 40,
      roll: 0,
    }),
  },
  {
    id: 9,
    name: "Low-Angle Bow Rahasia Bentuk Lambung",
    start: 595,
    end: 664,
    cam: (k) => ({
      pos: [-24.0 - 4.0 * k, 3.0 + 1.2 * k, -26.0 + 4.0 * k],
      look: [0.0, 4.0, -5.0],
      fov: 42,
      roll: 0,
    }),
  },

  // ---- Chapter 3: Baja Padat vs Rongga Udara (f: 664 - 1156 / 6 Micro-Shots) ----
  {
    id: 10,
    name: "Medium Center Balok Baja Padat",
    start: 664,
    end: 750,
    cam: (k) => ({
      pos: [0.0, 3.8 - 0.6 * k, -16.0 + 1.5 * k],
      look: [0.0, 1.2, 0.0],
      fov: 42,
      roll: 0,
    }),
  },
  {
    id: 11,
    name: "Tracking Balok Baja Nyungsep ke Dasar",
    start: 750,
    end: 845,
    cam: (k) => ({
      pos: [0.0, -0.8 - 2.6 * k, -15.0 + 1.5 * k],
      look: [0.0, -1.0 - 6.0 * k, 0.0],
      fov: 44,
      roll: 0,
    }),
  },
  {
    id: 12,
    name: "Cutaway Profile Lambung Membuka",
    start: 845,
    end: 915,
    cam: (k) => ({
      pos: [-65.0 + 11.0 * k, 12.0 - 2.5 * k, -15.0 + 10.0 * k],
      look: [0.0, 3.8, 5.0],
      fov: 42,
      roll: 0,
    }),
  },
  {
    id: 13,
    name: "Dramatic Zoom-In Rongga Udara Kosong",
    start: 915,
    end: 985,
    cam: (k) => ({
      pos: [-36.0 + 8.0 * k, 5.5 - 1.2 * k, 4.0 + 1.0 * k],
      look: [0.0, 3.5, 5.0],
      fov: 40,
      roll: 0,
    }),
  },
  {
    id: 14,
    name: "Internal Low-Angle Kerangka Ribs & Garis Air",
    start: 985,
    end: 1065,
    cam: (k) => ({
      pos: [-24.0 - 3.0 * k, 3.0 + 0.8 * k, -2.0 + 4.0 * k],
      look: [0.0, 2.8, 5.0],
      fov: 44,
      roll: 0,
    }),
  },
  {
    id: 15,
    name: "Pull-Back Massa Jenis Ringan",
    start: 1065,
    end: 1156,
    cam: (k) => ({
      pos: [-45.0 - 18.0 * k, 7.5 + 2.5 * k, -20.0 - 6.0 * k],
      look: [0.0, 4.0, 4.0],
      fov: 42,
      roll: 0,
    }),
  },

  // ---- Chapter 4: Gaya Apung 50:50 Split (f: 1156 - 1680 / 6 Micro-Shots) ----
  {
    id: 16,
    name: "Waterline Profile Berat Kapal Menekan",
    start: 1156,
    end: 1230,
    cam: (k) => ({
      pos: [-95.0 + 8.0 * k, 2.5 - 0.5 * k, 3.0 + 2.0 * k],
      look: [0.0, 1.8, 5.0],
      fov: 42,
      roll: 0,
    }),
  },
  {
    id: 17,
    name: "Low Forward Quarter Bentuk Lebar Desak Air",
    start: 1230,
    end: 1315,
    cam: (k) => ({
      pos: [-60.0 + 8.0 * k, 1.0 + 0.5 * k, -18.0 + 6.0 * k],
      look: [0.0, 2.5, 0.0],
      fov: 44,
      roll: 0,
    }),
  },
  {
    id: 18,
    name: "Underwater Keel Panah Dorongan Air",
    start: 1315,
    end: 1390,
    cam: (k) => ({
      pos: [-75.0 - 8.0 * k, -1.8 + 0.6 * k, 6.0 - 1.0 * k],
      look: [0.0, -1.5, 5.0],
      fov: 42,
      roll: 0,
    }),
  },
  {
    id: 19,
    name: "Broadside 50:50 Gaya Apung vs Berat Kapal",
    start: 1390,
    end: 1480,
    cam: (k) => ({
      pos: [-138.0 + 4.0 * k, 0.2, 2.0 + 5.0 * k],
      look: [0.0, 0.2, 5.0],
      fov: 42,
      roll: 0,
    }),
  },
  {
    id: 20,
    name: "Dynamic Balance Kondisi Seimbang",
    start: 1480,
    end: 1560,
    cam: (k) => ({
      pos: [-110.0 + 8.0 * k, 8.0 - 1.5 * k, -12.0 + 4.0 * k],
      look: [0.0, 2.5, 4.0],
      fov: 40,
      roll: 0,
    }),
  },
  {
    id: 21,
    name: "Equilibrium Waterline Glide",
    start: 1560,
    end: 1680,
    cam: (k) => ({
      pos: [-128.0 + 10.0 * k, 1.0 + 0.8 * k, 4.0 + 2.0 * k],
      look: [0.0, 1.5, 5.0],
      fov: 41,
      roll: 0,
    }),
  },

  // ---- Chapter 5: Closing Outro Berlayar (f: 1680 - 2010 / 4 Micro-Shots) ----
  {
    id: 22,
    name: "Heroic Low-Angle Bow Slices Waves",
    start: 1680,
    end: 1760,
    cam: (k) => ({
      pos: [-22.0 + 6.0 * k, 2.5 + 0.7 * k, -30.0 + 6.0 * k],
      look: [0.0, 5.0, -12.0],
      fov: 42,
      roll: 0,
    }),
  },
  {
    id: 23,
    name: "High Aerial Ocean Cruise",
    start: 1760,
    end: 1845,
    cam: (k) => ({
      pos: [-48.0 + 6.0 * k, 28.0 - 4.0 * k, -15.0 + 10.0 * k],
      look: [0.0, 4.0, 6.0],
      fov: 38,
      roll: 0,
    }),
  },
  {
    id: 24,
    name: "Parallax Track Pelampung & Kapal",
    start: 1845,
    end: 1920,
    cam: (k) => ({
      pos: [-65.0 + 7.0 * k, 7.0 - 1.0 * k, -32.0 + 10.0 * k],
      look: [0.0, 4.0, 4.0],
      fov: 40,
      roll: 0,
    }),
  },
  {
    id: 25,
    name: "Cinematic Grand Outro Wide Pull-Out",
    start: 1920,
    end: 2010,
    cam: (k, f) => {
      const sailForward = -((f - 1680) / FPS) * 1.6;
      return {
        pos: [-85.0 - 45.0 * k, 14.0 + 10.0 * k, -45.0 - 45.0 * k],
        look: [0.0, 4.0, sailForward + 6.0],
        fov: 42,
        roll: 0.004 * (1 - 2 * k),
      };
    },
  },
];

export const microShotAt = (f: number): MicroShot =>
  MICRO_SHOTS.find((ms) => f >= ms.start && f < ms.end) ??
  MICRO_SHOTS[MICRO_SHOTS.length - 1];

export const camAt = (_id: number, f: number): Cam => {
  const ms = microShotAt(f);
  const u = clamp01((f - ms.start) / (ms.end - ms.start));
  const k = glide(u);
  return ms.cam(k, f);
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
