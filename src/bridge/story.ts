// Timeline of the bridge short: Kok Iso Yo 60-Second Episode
// "Kenapa Tentara Dilarang Baris Serempak di Atas Jembatan? (Misteri Resonansi Mekanik)"
export const FPS = 30;
export const TOTAL = 1800; // 60.00 seconds @ 30 FPS
export const D0 = 6.0; // bank top + deck height (m)
export const HALF = 27; // towers at z = +-27, span 54 m
export const FILES = [-1.65, -0.55, 0.55, 1.65];
export const ROW_GAP = 1.3;
export const COUNT = 74;
export const PARK: V3 = [70, D0, -75];
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- story physics (tau = story time in seconds) ----------------
export const front = (tau: number) => 26 - 1.6 * (tau - 4.4); // z of front row
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1; // 1 Hz = 2 steps/s
export const SNAP = 999.0, DROP0 = 999.0, DROP1 = 999.0; // No collapse: jembatan bergoyang ekstrem lalu ditenangkan oleh break step!

export const amp = (tau: number) => {
  if (tau < 20) return 0.04; // Act 1 & 2: gentle subtle bounce
  if (tau < 28) return lin([[20, 0.04], [24, 0.16], [28, 0.38]], tau); // Act 3: building resonance
  if (tau < 46) return lin([[28, 0.38], [34, 0.58], [40, 0.76], [46, 0.76]], tau); // Act 4: peak extreme sway
  return 0.0; // Act 5 & 6: calm, level deck
};

export const stomp = (tau: number) => {
  if (tau < 20) return 1.0;
  if (tau < 35) return lin([[20, 1.0], [28, 1.3], [35, 1.6]], tau);
  return 1.6;
};

export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
export const dropW = (z: number) => smooth((20 - z) / 26);
export const dropU = (_tau: number) => 0;
export const DROP_H = 6.6;

export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0 + b.bounce * shapeZ(z);

// ---------------- shots: 6 Acts (1800 frames / 60s) ----------------
export type Light = "day" | "golden";
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };

export const SHOTS: ShotDef[] = [
  // ACT 1: THE HOOK (0s - 8s / f=0 - 240)
  { id: 1, a: 0, b: 240, light: "day", crowd: "march", tau: (t) => 8 + t * 0.7 },
  // ACT 2: SEJARAH TRAGEDI 1831 (8s - 20s / f=240 - 600)
  { id: 2, a: 240, b: 420, light: "day", crowd: "march", tau: (t) => 12 + (t - 8) * 0.8, towns: true },
  { id: 3, a: 420, b: 600, light: "day", crowd: "march", tau: (t) => 17 + (t - 14) * 0.8 },
  // ACT 3: MUNCULNYA EFEK RESONANSI (20s - 35s / f=600 - 1050)
  { id: 4, a: 600, b: 840, light: "day", crowd: "march", tau: (t) => 22 + (t - 20) * 0.8 },
  { id: 5, a: 840, b: 1050, light: "day", crowd: "march", tau: (t) => 28 + (t - 28) * 0.8 },
  // ACT 4: PUNCAK KEKECAUAN / KLIMAKS VISUAL (35s - 46s / f=1050 - 1380)
  { id: 6, a: 1050, b: 1380, light: "day", crowd: "march", tau: (t) => 34 + (t - 35) * 0.7 },
  // ACT 5: SOLUSI "BREAK STEP" (46s - 54s / f=1380 - 1620)
  { id: 7, a: 1380, b: 1620, light: "day", crowd: "march", tau: (t) => 22 + (t - 46) * 0.7 },
  // ACT 6: OUTRO & KESIMPULAN (54s - 60s / f=1620 - 1800)
  { id: 8, a: 1620, b: TOTAL, light: "day", crowd: "tourists", tau: (t) => 26 + (t - 54) * 0.7, towns: true },
];

export const XFADE: Record<number, number> = { 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 8 };
export const FLASH_AT = -1; // No flash

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

export const bridgeState = (id: number, t: number): BridgeState => {
  if (id === 7 || id === 8) {
    return { bounce: 0, drop: 0, snap: 0, collapsed: false };
  }
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  const a = amp(tau);
  const bounce = -a * Math.cos(4 * Math.PI * marchPhase(tau));
  return { bounce, drop: 0, snap: 0, collapsed: false };
};

// ---------------- camera choreography ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });

const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};

const T = (f: number) => f / FPS;
const Fz = (id: number, f: number) => front(SHOTS[id - 1].tau(T(f)));

const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};

const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });

export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (_snap: number): V3 => ANCHOR;

// ACT 1: THE HOOK (f=0 - 240) - Low-Angle Tracking Shot on deck
const S1 = (f: number) => {
  const F = Fz(1, f);
  return dolly([0, D0 + 0.45, F - 5.5], [0, D0 + 1.35, F + 2.0], pushK(f, 0, 0.0015), { fov: 38 });
};

// ACT 2a: SEJARAH (f=240 - 420) - Side-Profile Panning Shot
const S2 = (f: number) => {
  const F = Fz(2, f);
  return dolly([12.5, D0 + 2.4, F + 6], [0, D0 + 1.2, F + 6], pushK(f, 240, 0.0015), { fov: 42 });
};

// ACT 2b: SEJARAH (f=420 - 600) - High-Angle Crane Shot from tower
const S3 = (f: number) => zoom([5.0, D0 + 9.5, -26], [0, D0 + 0.8, -10], 44, pushK(f, 420, 0.0016));

// ACT 3a: RESONANSI (f=600 - 840) - Extreme Close-Up / Low Angle along planks and stick legs
const S4 = (f: number) => {
  const F = Fz(4, f);
  return dolly([0.4, D0 + 0.32, F - 3.2], [0, D0 + 0.28, F + 0.5], pushK(f, 600, 0.002), { fov: 35 });
};

// ACT 3b: RESONANSI (f=840 - 1050) - Tilts up to suspension chains
const S5a = (f: number) => {
  const F = Fz(5, f);
  return dolly([-2.8, D0 + 1.6, F - 5], [-2.7, D0 + 3.6, F + 4], pushK(f, 840, 0.002), { fov: 40, roll: 0.02 });
};
const S5b = (f: number) => {
  const F = Fz(5, f);
  return dolly([-4.2, D0 + 3.8, F - 3], [-2.7, D0 + 4.2, F + 2], pushK(f, 940, 0.0025), { fov: 38, roll: -0.02 });
};

// ACT 4: PUNCAK KEKECAUAN (f=1050 - 1380) - Dynamic Dutch Angle & push-in
const S6 = (f: number) => {
  const F = Fz(6, f);
  const r = 0.06 * Math.sin((f - 1050) * 0.15);
  return dolly([0.3, D0 + 1.7, F - 3.6], [0, D0 + 1.6, F + 0.8], pushK(f, 1050, 0.0022), { fov: 37, roll: r });
};

// ACT 5: SOLUSI "BREAK STEP" (f=1380 - 1620) - Steady Level Medium Tracking Shot
const S7 = (f: number) => {
  const F = Fz(7, f);
  return dolly([0.0, D0 + 1.6, F - 4.8], [0, D0 + 1.5, F + 1.2], pushK(f, 1380, 0.0018), { fov: 39 });
};

// ACT 6: OUTRO & KESIMPULAN (f=1620 - 1800) - Epic Wide Pull-Back Shot
const S8a = (f: number) => dolly([1.6, D0 + 1.8, -15.5], [0, D0 + 1.5, -9], pushK(f, 1620, 0.002), { fov: 40 });
const CRANE_OUT: V3[] = [[0, 16, -14], [22, 18, -48], [0, 8, 4]];
const S8b = (f: number): Shot => {
  const a = S8a(1680), s = glide((f - 1680) / 120), r = 1 - s, [C, B, L] = CRANE_OUT;
  return {
    pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * B[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3,
    fov: (a.fov ?? 40) + (46 - (a.fov ?? 40)) * s,
    roll: 0,
  };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }],
  2: [{ f: 240, s: S2 }],
  3: [{ f: 420, s: S3 }],
  4: [{ f: 600, s: S4 }],
  5: [{ f: 840, s: S5a }, { f: 940, dur: 24, s: S5b }],
  6: [{ f: 1050, s: S6 }],
  7: [{ f: 1380, s: S7 }],
  8: [{ f: 1620, s: S8a }, { f: 1680, cut: true, s: S8b }],
};

export const kickAt = (_t: number) => 0;

export const camAt = (id: number, f: number): Cam => {
  return run(CAMS[id], f);
};

export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- depth of field ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (id: number) => (f: number): V3 => [0, D0 + 1.6, Fz(id, f)];
const boots = (id: number) => (f: number): V3 => [0, D0 + 0.3, Fz(id, f)];

export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: eyes(1) }, // Act 1: Hook, sharp soldiers, soft background
  { f: 240, cInf: 0 }, // Act 2a: Side panning sharp
  { f: 420, cInf: 0 }, // Act 2b: High angle crane sharp
  { f: 600, cInf: 15, focus: boots(4) }, // Act 3a: Low angle feet sharp
  { f: 840, cInf: 12 }, // Act 3b: Suspension chains
  { f: 1050, cInf: 12, focus: eyes(6) }, // Act 4: Dutch angle faces
  { f: 1380, cInf: 10, focus: eyes(7) }, // Act 5: Break step
  { f: 1620, cInf: 0 }, // Act 6: Outro wide crane
];

export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
