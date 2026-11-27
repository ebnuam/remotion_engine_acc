// 26-Shot Engineering Storyboard & Camera Choreography for Ep003: Jembatan Laut (Cofferdam).
// Strictly synced to out/ep003_jembatan_laut/voiceover_liam_110.words.json (80.72s -> 81.0s = 2430 frames @ 30 FPS).
// Every single shot is strictly <= 3.70 seconds (average 3.11s), zero static holds, continuous pushK().

import {
  Cam,
  CamKey,
  DofEntry,
  V3,
  applyKick,
  dolly,
  kickAt,
  pushK,
  runCamKeys,
  zoom,
} from "../shared/kokisoyo25d";
import type { LightMode, StageShotMeta } from "../shared/kokisoyo25d";

export const FPS = 30;
export const TOTAL = 2430; // 81.00 seconds @ 30 FPS (> 1 minute!)

export type MoodMode = "day" | "underwater" | "night" | "golden";

export interface JembatanShot extends StageShotMeta {
  id: number;
  a: number;
  b: number;
  light: LightMode; // Grade mode for Stage25D
  mood: MoodMode; // Rich custom atmospheric lighting in EpisodeWorld
  title: string;
}

export const SHOTS: JembatanShot[] = [
  { id: 1,  a: 0,    b: 84,   light: "day",    mood: "day",        title: "Aerial Sea Bridge Hook" },           // 2.80s
  { id: 2,  a: 84,   b: 165,  light: "day",    mood: "day",        title: "Waterline Pier Scale Shock" },       // 2.70s
  { id: 3,  a: 165,  b: 270,  light: "day",    mood: "underwater", title: "Deep Ocean Seabed Cutaway" },        // 3.50s
  { id: 4,  a: 270,  b: 354,  light: "day",    mood: "day",        title: "Crane Dumps Wet Concrete" },         // 2.80s
  { id: 5,  a: 354,  b: 438,  light: "day",    mood: "underwater", title: "Concrete Washes Away Underwater" },  // 2.80s
  { id: 6,  a: 438,  b: 537,  light: "day",    mood: "day",        title: "Crew Worried On Barge Deck" },       // 3.30s
  { id: 7,  a: 537,  b: 615,  light: "day",    mood: "day",        title: "Chief Engineer Cofferdam Idea" },    // 2.60s
  { id: 8,  a: 615,  b: 711,  light: "day",    mood: "day",        title: "Offshore Crane Barge Wide" },        // 3.20s
  { id: 9,  a: 711,  b: 807,  light: "day",    mood: "day",        title: "Crane Drives Sheet Pile" },          // 3.20s
  { id: 10, a: 807,  b: 900,  light: "day",    mood: "day",        title: "Interlocking Steel Sheet Piles" },   // 3.10s
  { id: 11, a: 900,  b: 990,  light: "day",    mood: "underwater", title: "Sheet Piles Penetrate Seabed" },     // 3.00s
  { id: 12, a: 990,  b: 1080, light: "day",    mood: "day",        title: "High-Angle Cofferdam Ring" },        // 3.00s
  { id: 13, a: 1080, b: 1185, light: "day",    mood: "day",        title: "Internal Steel Cross-Bracing" },     // 3.50s
  { id: 14, a: 1185, b: 1281, light: "day",    mood: "day",        title: "Giant Dewatering Pump Station" },    // 3.20s
  { id: 15, a: 1281, b: 1389, light: "day",    mood: "day",        title: "Pumping Seawater Dry Cutaway" },     // 3.60s
  { id: 16, a: 1389, b: 1491, light: "day",    mood: "day",        title: "Vertical Ladder Descent" },          // 3.40s
  { id: 17, a: 1491, b: 1602, light: "day",    mood: "day",        title: "Standing Dry On Ocean Floor" },      // 3.70s
  { id: 18, a: 1602, b: 1713, light: "day",    mood: "day",        title: "Drilling Deep Piles Into Bedrock" }, // 3.70s
  { id: 19, a: 1713, b: 1815, light: "day",    mood: "day",        title: "Multi-Tier Steel Rebar Cage" },      // 3.40s
  { id: 20, a: 1815, b: 1920, light: "day",    mood: "night",      title: "Night Shift Cobalt Pouring" },       // 3.50s
  { id: 21, a: 1920, b: 2022, light: "day",    mood: "night",      title: "Night Floodlit Solid Pier" },        // 3.40s
  { id: 22, a: 2022, b: 2124, light: "golden", mood: "golden",     title: "Golden Hour Pulling Sheet Piles" },  // 3.40s
  { id: 23, a: 2124, b: 2211, light: "golden", mood: "golden",     title: "Solid Pier In Golden Waves" },       // 2.90s
  { id: 24, a: 2211, b: 2310, light: "golden", mood: "golden",     title: "Finished Multi-Span Sea Bridge" },   // 3.30s
  { id: 25, a: 2310, b: 2379, light: "golden", mood: "golden",     title: "Highway Deck Traffic Flow" },        // 2.30s
  { id: 26, a: 2379, b: 2430, light: "golden", mood: "golden",     title: "Finale Barge Crew Celebration" },    // 1.70s
];

export const XFADE: Record<number, number> = {
  3: 6,
  8: 6,
  20: 8,
  22: 8,
  24: 6,
};

export const FLASH_AT = 0;

// Impact camera kicks (in seconds) synced to hammer strikes, pump ignition, and pier reveal
export const KICKS: [number, number][] = [
  [2.82, 0.45],
  [25.2, 0.65],
  [27.4, 0.72],
  [28.5, 0.72],
  [29.6, 0.65],
  [42.85, 0.55],
  [60.55, 0.5],
];

// Camera definitions — every single shot moves continuously via pushK() or multi-key glide!
const CAMS: Record<number, CamKey[]> = {
  // Shot 1: Sweeping aerial wide of completed multi-span sea bridge stretching along Z
  1: [
    {
      f: 0,
      s: (f) => dolly([28, 21, 44], [0, 7.5, -18], pushK(f, 0, 0.0028), { fov: 42 }),
    },
  ],
  // Shot 2: Low waterline angle — floating barge + tiny engineers looking UP at colossal concrete pier & deck
  2: [
    {
      f: 84,
      s: (f) => dolly([-16.5, 5.2, 24.5], [-4.2, 6.4, 0.0], pushK(f, 84, 0.0024), { fov: 44, roll: -0.015 }),
    },
  ],
  // Shot 3: Underwater cutaway dropping below sea level revealing deep seabed at y=-10.5
  3: [
    {
      f: 165,
      s: (f) => dolly([15, -3.5, 24], [0, -6.8, 0], pushK(f, 165, 0.0022), { fov: 44 }),
    },
  ],
  // Shot 4: Barge crane + concrete bucket dumping wet concrete right into choppy open sea at center!
  4: [
    {
      f: 270,
      s: (f) => dolly([4.2, 6.4, 24.5], [-3.2, 3.2, 0.2], pushK(f, 270, 0.0022), { fov: 44 }),
    },
  ],
  // Shot 5: Underwater close-medium watching poured wet concrete plume wash away sideways
  5: [
    {
      f: 354,
      s: (f) => dolly([3.2, -3.6, 14.5], [1.2, -5.2, 0], pushK(f, 354, 0.0025), { fov: 42 }),
    },
  ],
  // Shot 6: Barge deck medium-close — all 5 slender engineers peering worriedly over railing (0 clipping!)
  6: [
    {
      f: 438,
      s: (f) => dolly([-7.2, 4.1, 12.8], [-11.4, 3.0, 1.8], pushK(f, 438, 0.0021), { fov: 40 }),
    },
  ],
  // Shot 7: Hero low push-in on Chief Engineer (white hardhat + orange vest) with clipboard having the idea
  7: [
    {
      f: 537,
      s: (f) => dolly([-9.4, 3.1, 7.6], [-11.4, 3.15, 2.2], pushK(f, 537, 0.0032), { fov: 36, roll: 0.02 }),
    },
  ],
  // Shot 8: Wide elevated 3/4 view of crane barge, tugboat & offshore cofferdam site
  8: [
    {
      f: 615,
      s: (f) => dolly([22, 16.5, 28], [-4.5, 2.0, 0], pushK(f, 615, 0.0024), { fov: 42 }),
    },
  ],
  // Shot 9: Dramatic low angle up at giant lattice crane boom driving tall corrugated sheet pile
  9: [
    {
      f: 711,
      s: (f) => dolly([8.5, 3.4, 18.0], [-4.0, 9.2, 0.2], pushK(f, 711, 0.0025), { fov: 44, roll: -0.02 }),
    },
  ],
  // Shot 10: Crisp mid-close on interlocking corrugated dark steel sheet piles slamming into waves
  10: [
    {
      f: 807,
      s: (f) => zoom([10.5, 4.2, 11.2], [2.4, 1.4, 3.6], 38, pushK(f, 807, 0.0024)),
    },
  ],
  // Shot 11: Underwater cutaway watching corrugated steel sheet-pile wall plunge deep into bedrock
  11: [
    {
      f: 900,
      s: (f) => dolly([12.5, -5.8, 19.5], [0, -7.8, 0], pushK(f, 900, 0.0024), { fov: 44 }),
    },
  ],
  // Shot 12: Dramatic steep high-angle aerial looking into the completed circular steel cofferdam fortress
  12: [
    {
      f: 990,
      s: (f) => dolly([11.5, 21.5, 16.5], [0, -1.0, 0], pushK(f, 990, 0.0026), { fov: 42 }),
    },
  ],
  // Shot 13: Mid-high shot showing massive internal H-beam steel walers & cross-struts bracing the ring
  13: [
    {
      f: 1080,
      s: (f) => dolly([8.2, 9.2, 11.5], [0, -1.5, 0], pushK(f, 1080, 0.0024), { fov: 42 }),
    },
  ],
  // Shot 14: Industrial orange diesel dewatering pumps & pressure gauges on steel deck with engineers
  14: [
    {
      f: 1185,
      s: (f) => dolly([-2.8, 5.2, 15.6], [-7.2, 3.0, 2.4], pushK(f, 1185, 0.0023), { fov: 40 }),
    },
  ],
  // Shot 15: Split-level cutaway! Wide enough to see orange pumps on left + water jets blasting right + dropping water inside!
  15: [
    {
      f: 1281,
      s: (f) => dolly([2.5, 2.6, 36.5], [1.2, -3.2, 0], pushK(f, 1281, 0.0022), { fov: 45 }),
    },
  ],
  // Shot 16: Tall vertical framing of steel scaffolding tower & ladder descending inside dry cofferdam
  16: [
    {
      f: 1389,
      s: (f) => dolly([2.5, -2.5, 21.5], [0.4, -5.2, -1.5], pushK(f, 1389, 0.0021), { fov: 46 }),
    },
  ],
  // Shot 17: Mind-blowing scale hero shot — 5 engineers standing DRY on ocean floor with walls & waves towering above!
  17: [
    {
      f: 1491,
      s: (f) => dolly([1.8, -5.6, 20.5], [0.0, -6.2, -1.5], pushK(f, 1491, 0.0022), { fov: 46 }),
    },
  ],
  // Shot 18: Seabed & bedrock cutaway — drill rig boring deep foundation piles into dark rock
  18: [
    {
      f: 1602,
      s: (f) => dolly([5.5, -7.8, 22.5], [0, -10.2, 0], pushK(f, 1602, 0.0022), { fov: 44 }),
    },
  ],
  // Shot 19: Upward dolly inside dry cofferdam — towering steel rebar cage + crew on scaffolding
  19: [
    {
      f: 1713,
      s: (f) => dolly([4.2, -2.2, 23.0], [0, -2.8, 0], pushK(f, 1713, 0.0025), { fov: 44 }),
    },
  ],
  // Shot 20: NIGHT SHIFT COBALT FLOODLIT POURING (ref_009 signature look!)
  20: [
    {
      f: 1815,
      s: (f) => dolly([-12.5, 10.6, 25.5], [-2.2, 4.2, 0.8], pushK(f, 1815, 0.0022), { fov: 43 }),
    },
  ],
  // Shot 21: Night floodlit wide-medium hero push on massive weathered concrete pier + entire crew on catwalk
  21: [
    {
      f: 1920,
      s: (f) => dolly([7.8, 6.4, 23.5], [0, 4.8, 0], pushK(f, 1920, 0.0026), { fov: 42 }),
    },
  ],
  // Shot 22: Golden sunrise/sunset — crane pulling steel sheet piles UP one by one out of ocean
  22: [
    {
      f: 2022,
      s: (f) => dolly([14.5, 8.8, 22.5], [-1.5, 4.2, 0], pushK(f, 2022, 0.0022), { fov: 42 }),
    },
  ],
  // Shot 23: Low waterline golden-hour hero shot — solid concrete pier standing proud in open sea waves
  23: [
    {
      f: 2124,
      s: (f) => dolly([11.2, 3.4, 17.8], [0, 6.2, 0], pushK(f, 2124, 0.0025), { fov: 42, roll: 0.015 }),
    },
  ],
  // Shot 24: Wide golden-hour sweep along finished multi-span sea bridge with cars & trucks
  24: [
    {
      f: 2211,
      s: (f) => dolly([26.0, 19.0, 38.0], [0, 9.0, -24.0], pushK(f, 2211, 0.0026), { fov: 42 }),
    },
  ],
  // Shot 25: Dynamic highway deck traffic tracking shot above golden ocean
  25: [
    {
      f: 2310,
      s: (f) => dolly([6.8, 18.6, 22.0], [0, 15.8, -28.0], pushK(f, 2310, 0.0032), { fov: 42 }),
    },
  ],
  // Shot 26: Finale barge celebration — Chief Engineer & 5 crew cheering unobstructed with giant sea bridge behind!
  26: [
    {
      f: 2379,
      s: (f) => dolly([-16.8, 4.6, 14.8], [-8.8, 4.6, 0.5], pushK(f, 2379, 0.0028), { fov: 44 }),
    },
  ],
};

export function camAt(shotId: number, f: number): Cam {
  const keys = CAMS[shotId] ?? CAMS[1];
  const base = runCamKeys(keys, f);
  return applyKick(base, kickAt(f / FPS, KICKS, FPS));
}

// Keep wide architectural establishing shots razor-sharp; selective soft bokeh only on close-ups
export const DOF: DofEntry[] = [
  { f: 0,    cInf: 0 },
  { f: 438,  dur: 12, cInf: 8,  focus: (): V3 => [-12.0, 2.9, 1.5] },
  { f: 537,  dur: 12, cInf: 10, focus: (): V3 => [-11.4, 3.1, 2.2] },
  { f: 615,  dur: 12, cInf: 0 },
  { f: 1185, dur: 12, cInf: 7,  focus: (): V3 => [-6.8, 3.1, 3.4] },
  { f: 1281, dur: 12, cInf: 0 },
  { f: 2379, dur: 10, cInf: 6,  focus: (): V3 => [-11.8, 3.1, 2.0] },
];
