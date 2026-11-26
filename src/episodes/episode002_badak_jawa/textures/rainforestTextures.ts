// Procedural high-resolution PBR Canvas textures for realistic Ujung Kulon tropical rainforest.
// Zero Kenney assets, zero flat cartoon colors. Deterministic seeded generation for Remotion.

import * as THREE from "three";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

function toTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1, srgb = true): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

let cachedFloor: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } | null = null;
let cachedBark: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } | null = null;
let cachedCanopy: THREE.CanvasTexture | null = null;
let cachedFern: THREE.CanvasTexture | null = null;
let cachedBroad: THREE.CanvasTexture | null = null;
let cachedMist: THREE.CanvasTexture | null = null;

/** Realistic wet tropical rainforest floor: dark humus soil, wet mud, leaf litter, moss patches. */
export function createForestFloorTextures() {
  if (cachedFloor) return cachedFloor;
  const W = 512;
  const [cAlb, gA] = makeCanvas(W, W);
  const [cBmp, gB] = makeCanvas(W, W);
  const rand = mulberry32(1042);

  gA.fillStyle = "#3a3126";
  gA.fillRect(0, 0, W, W);
  gB.fillStyle = "#666666";
  gB.fillRect(0, 0, W, W);

  // Organic damp soil & moss patches
  for (let i = 0; i < 420; i++) {
    const x = rand() * W;
    const y = rand() * W;
    const r = 10 + rand() * 38;
    const isMoss = rand() < 0.28;
    const gr = gA.createRadialGradient(x, y, 0, x, y, r);
    if (isMoss) {
      gr.addColorStop(0, `rgba(${42 + Math.floor(rand() * 18)}, ${62 + Math.floor(rand() * 22)}, ${30 + Math.floor(rand() * 12)}, 0.42)`);
    } else {
      const v = 36 + Math.floor(rand() * 30);
      gr.addColorStop(0, `rgba(${v + 14}, ${v + 6}, ${v - 2}, 0.45)`);
    }
    gr.addColorStop(1, "rgba(0,0,0,0)");
    gA.fillStyle = gr;
    gA.fillRect(x - r, y - r, r * 2, r * 2);

    const bv = 80 + Math.floor(rand() * 90);
    gB.fillStyle = `rgba(${bv},${bv},${bv},0.22)`;
    gB.beginPath();
    gB.arc(x, y, r * 0.7, 0, Math.PI * 2);
    gB.fill();
  }

  // Scattered fallen dried & damp tropical leaves + twigs
  for (let i = 0; i < 520; i++) {
    const x = rand() * W;
    const y = rand() * W;
    const ang = rand() * Math.PI * 2;
    const len = 6 + rand() * 13;
    const wid = 2.2 + rand() * 4.2;
    gA.save();
    gA.translate(x, y);
    gA.rotate(ang);
    const palette = ["#4d3a24", "#5c462b", "#3e3222", "#695031", "#384725", "#2d2419"];
    gA.fillStyle = palette[Math.floor(rand() * palette.length)];
    gA.beginPath();
    gA.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2);
    gA.fill();
    gA.restore();

    gB.save();
    gB.translate(x, y);
    gB.rotate(ang);
    gB.fillStyle = "rgba(215,215,215,0.45)";
    gB.beginPath();
    gB.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2);
    gB.fill();
    gB.restore();
  }

  // Fine soil grit
  for (let i = 0; i < 1800; i++) {
    const x = rand() * W;
    const y = rand() * W;
    const s = 1 + rand() * 2;
    gA.fillStyle = rand() > 0.5 ? "rgba(20,16,12,0.35)" : "rgba(110,92,70,0.25)";
    gA.fillRect(x, y, s, s);
    gB.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.28)" : "rgba(30,30,30,0.28)";
    gB.fillRect(x, y, s, s);
  }

  cachedFloor = {
    map: toTexture(cAlb, 14, 14, true),
    bumpMap: toTexture(cBmp, 14, 14, false),
  };
  return cachedFloor;
}

/** Realistic tropical rainforest hardwood bark with fissures, damp dark grooves, and moss streaks. */
export function createBarkTextures() {
  if (cachedBark) return cachedBark;
  const W = 512;
  const [cAlb, gA] = makeCanvas(W, W);
  const [cBmp, gB] = makeCanvas(W, W);
  const rand = mulberry32(2077);

  gA.fillStyle = "#3f362c";
  gA.fillRect(0, 0, W, W);
  gB.fillStyle = "#808080";
  gB.fillRect(0, 0, W, W);

  // Vertical bark ridges & deep fissures
  for (let i = 0; i < 320; i++) {
    const x = rand() * W;
    const y = rand() * W;
    const h = 40 + rand() * 140;
    const w = 2 + rand() * 8;
    const dark = rand() > 0.45;
    gA.fillStyle = dark
      ? `rgba(${34 + Math.floor(rand() * 16)}, ${28 + Math.floor(rand() * 14)}, ${22 + Math.floor(rand() * 12)}, 0.65)`
      : `rgba(${78 + Math.floor(rand() * 22)}, ${69 + Math.floor(rand() * 18)}, ${57 + Math.floor(rand() * 14)}, 0.45)`;
    gA.fillRect(x, y, w, h);

    gB.fillStyle = dark ? "rgba(25,25,25,0.65)" : "rgba(220,220,220,0.5)";
    gB.fillRect(x, y, w, h);
  }

  // Humid tropical green moss & lichen patches on bark
  for (let i = 0; i < 75; i++) {
    const x = rand() * W;
    const y = rand() * W;
    const rx = 8 + rand() * 24;
    const ry = 18 + rand() * 52;
    const gr = gA.createRadialGradient(x, y, 0, x, y, ry);
    gr.addColorStop(0, `rgba(${52 + Math.floor(rand() * 24)}, ${78 + Math.floor(rand() * 26)}, ${42 + Math.floor(rand() * 16)}, 0.52)`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    gA.fillStyle = gr;
    gA.save();
    gA.translate(x, y);
    gA.scale(rx / ry, 1);
    gA.beginPath();
    gA.arc(0, 0, ry, 0, Math.PI * 2);
    gA.fill();
    gA.restore();
  }

  cachedBark = {
    map: toTexture(cAlb, 2, 4, true),
    bumpMap: toTexture(cBmp, 2, 4, false),
  };
  return cachedBark;
}

/** Alpha-cutout tropical rainforest canopy foliage cluster (real compound leaves, never spheres). */
export function createCanopyLeafTexture() {
  if (cachedCanopy) return cachedCanopy;
  const W = 512;
  const [c, g] = makeCanvas(W, W);
  const rand = mulberry32(3091);
  g.clearRect(0, 0, W, W);

  // Subtle woody twigs
  g.strokeStyle = "#3a2f22";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(W * 0.5, W * 0.92);
  g.quadraticCurveTo(W * 0.48, W * 0.52, W * 0.52, W * 0.14);
  g.stroke();

  // Layered realistic pointed tropical leaves with midribs
  const leafColors = [
    "#1e3b1f",
    "#254824",
    "#2d5428",
    "#36602d",
    "#3f6b32",
    "#4b7637",
    "#284a26",
  ];

  for (let i = 0; i < 62; i++) {
    const t = rand();
    const cx = W * (0.2 + rand() * 0.6);
    const cy = W * (0.14 + t * 0.72);
    const angle = (cx < W * 0.5 ? -1 : 1) * (0.35 + rand() * 1.1) + (rand() - 0.5) * 0.8;
    const len = 42 + rand() * 44;
    const wid = 13 + rand() * 14;

    g.save();
    g.translate(cx, cy);
    g.rotate(angle);

    // Pointed elliptical tropical leaf
    const grad = g.createLinearGradient(0, -len * 0.5, 0, len * 0.5);
    const baseCol = leafColors[Math.floor(rand() * leafColors.length)];
    grad.addColorStop(0, baseCol);
    grad.addColorStop(1, "#1a3119");
    g.fillStyle = grad;

    g.beginPath();
    g.moveTo(0, -len * 0.55);
    g.bezierCurveTo(wid, -len * 0.2, wid * 0.85, len * 0.25, 0, len * 0.55);
    g.bezierCurveTo(-wid * 0.85, len * 0.25, -wid, -len * 0.2, 0, -len * 0.55);
    g.closePath();
    g.fill();

    // Central leaf vein
    g.strokeStyle = "rgba(118, 154, 78, 0.45)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(0, -len * 0.46);
    g.lineTo(0, len * 0.48);
    g.stroke();

    g.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cachedCanopy = tex;
  return tex;
}

/** Realistic pinnate tropical rainforest fern frond (paku-pakuan) with crisp alpha cutout. */
export function createFernFrondTexture() {
  if (cachedFern) return cachedFern;
  const W = 512;
  const H = 512;
  const [c, g] = makeCanvas(W, H);
  g.clearRect(0, 0, W, H);

  // Central rachis stem
  g.strokeStyle = "#3a5425";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(W * 0.5, H * 0.96);
  g.quadraticCurveTo(W * 0.51, H * 0.5, W * 0.5, H * 0.05);
  g.stroke();

  // 22 pairs of tapered fern pinnae (leaflets)
  const pairs = 22;
  for (let i = 0; i < pairs; i++) {
    const u = i / (pairs - 1); // 0 bottom -> 1 tip
    const y = H * (0.9 - u * 0.82);
    const envelope = Math.sin(Math.pow(u, 0.72) * Math.PI * 0.92 + 0.14);
    const pinnaLen = (155 * envelope + 14) * (1 - u * 0.28);
    const pinnaWid = 11 * envelope + 4;

    for (const dir of [-1, 1]) {
      g.save();
      g.translate(W * 0.5, y);
      g.rotate(dir * (1.28 - u * 0.45));
      const gr = g.createLinearGradient(0, 0, 0, -pinnaLen);
      gr.addColorStop(0, "#244320");
      gr.addColorStop(0.55, "#365f2a");
      gr.addColorStop(1, "#4c7834");
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(dir * pinnaWid, -pinnaLen * 0.35, 0, -pinnaLen);
      g.quadraticCurveTo(-dir * pinnaWid * 0.75, -pinnaLen * 0.35, 0, 0);
      g.closePath();
      g.fill();
      g.restore();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cachedFern = tex;
  return tex;
}

/** Realistic broad tropical understory leaf (Alocasia / Amomum rainforest browsing foliage). */
export function createBroadleafTexture() {
  if (cachedBroad) return cachedBroad;
  const W = 512;
  const [c, g] = makeCanvas(W, W);
  g.clearRect(0, 0, W, W);

  // Stem
  g.strokeStyle = "#2b421f";
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(W * 0.5, W * 0.96);
  g.lineTo(W * 0.5, W * 0.65);
  g.stroke();

  // Heart-pointed tropical leaf blade
  const grad = g.createLinearGradient(W * 0.5, W * 0.08, W * 0.5, W * 0.85);
  grad.addColorStop(0, "#3d662d");
  grad.addColorStop(0.5, "#2b5023");
  grad.addColorStop(1, "#1e3a1a");
  g.fillStyle = grad;

  g.beginPath();
  g.moveTo(W * 0.5, W * 0.06);
  g.bezierCurveTo(W * 0.78, W * 0.28, W * 0.86, W * 0.64, W * 0.66, W * 0.82);
  g.quadraticCurveTo(W * 0.55, W * 0.78, W * 0.5, W * 0.7);
  g.quadraticCurveTo(W * 0.45, W * 0.78, W * 0.34, W * 0.82);
  g.bezierCurveTo(W * 0.14, W * 0.64, W * 0.22, W * 0.28, W * 0.5, W * 0.06);
  g.closePath();
  g.fill();

  // Midrib & lateral veins
  g.strokeStyle = "rgba(130, 168, 92, 0.5)";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(W * 0.5, W * 0.74);
  g.lineTo(W * 0.5, W * 0.12);
  g.stroke();

  g.lineWidth = 2.2;
  for (let i = 0; i < 6; i++) {
    const y = W * (0.24 + i * 0.085);
    const span = W * (0.14 + Math.sin((i / 5) * Math.PI) * 0.18);
    for (const dir of [-1, 1]) {
      g.beginPath();
      g.moveTo(W * 0.5, y);
      g.quadraticCurveTo(W * 0.5 + dir * span * 0.6, y - 8, W * 0.5 + dir * span, y - 24);
      g.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cachedBroad = tex;
  return tex;
}

/** Soft atmospheric sun-shaft / humid forest mist sprite texture. */
export function createMistTexture() {
  if (cachedMist) return cachedMist;
  const W = 256;
  const [c, g] = makeCanvas(W, W);
  const gr = g.createRadialGradient(W / 2, W / 2, 10, W / 2, W / 2, W / 2);
  gr.addColorStop(0, "rgba(245, 240, 224, 0.42)");
  gr.addColorStop(0.45, "rgba(225, 232, 224, 0.16)");
  gr.addColorStop(1, "rgba(225, 232, 224, 0.0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, W);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedMist = tex;
  return tex;
}
