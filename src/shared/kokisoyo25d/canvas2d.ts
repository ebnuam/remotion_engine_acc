// Reusable Canvas2D cartoon drawing API & 3D billboard pool for Kok Iso Yo? 2.5D-in-3D characters and props.
// Extracted & generalized from cartoon-3d-short templates/bridge/toon.ts & cast.ts.

import * as THREE from "three";
import { NOINK } from "./postfx";
import { cardShade, blobMaterial, CARD_K, CardShadeOptions } from "./cardshade";

export const DEFAULT_INK = "#241726";
export type P2 = [number, number];

export const rad = (d: number) => (d * Math.PI) / 180;
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export function mulColor(c: string, m: [number, number, number]): string {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) =>
    Math.min(255, Math.round(v * k))
      .toString(16)
      .padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
}

export const shadeColor = (c: string, k: number) => mulColor(c, [k, k, k]);

export function mixColor(a: string, b: string, t: number): string {
  const A = parseInt(a.slice(1), 16);
  const B = parseInt(b.slice(1), 16);
  const ch = (s: number) =>
    Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

export function ellPts(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0 = 0,
  a1 = 360,
  rot = 0,
  n = 48
): P2[] {
  const r = rad(rot);
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
}

export function roundedRectPts(x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] {
  const pts: P2[] = [];
  const cs: [number, number, number][] = [
    [x1 - r, y0 + r, -90],
    [x1 - r, y1 - r, 0],
    [x0 + r, y1 - r, 90],
    [x0 + r, y0 + r, 180],
  ];
  for (const [cx, cy, a0] of cs) {
    for (let i = 0; i <= n; i++) {
      const a = rad(a0 + (90 * i) / n);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return pts;
}

/** Organic superellipse contour (useful for stylized cartoon heads, bodies, and creatures). */
export function superellipsePts(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  expTop = 1.85,
  expBottom = 2.25,
  n = 56
): P2[] {
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const th = (2 * Math.PI * i) / n;
    const ct = Math.cos(th);
    const st = Math.sin(th);
    const e = st < 0 ? expTop : expBottom;
    const x = Math.sign(ct) * Math.abs(ct) ** (2 / e) * rx;
    const y = Math.sign(st) * Math.abs(st) ** (2 / e) * ry;
    pts.push([cx + x, cy + y]);
  }
  return pts;
}

/** Smooth quadratic curve polyline from a through k toward b. */
export function curvePts(a: P2, k: P2, b: P2, n = 10): P2[] {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2];
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = 1 - t;
    out.push([
      s * s * a[0] + 2 * s * t * c[0] + t * t * b[0],
      s * s * a[1] + 2 * s * t * c[1] + t * t * b[1],
    ]);
  }
  return out;
}

/**
 * Canvas2D cartoon Pen API with optional local rotation transform, shaded fills,
 * and variable-width ink outlines.
 */
export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  inkColor = DEFAULT_INK;
  rot: number[] | null = null;

  constructor(g: CanvasRenderingContext2D, inkColor = DEFAULT_INK) {
    this.g = g;
    this.inkColor = inkColor;
  }

  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot;
    const a = r[0];
    const cx = r[1];
    const cy = r[2];
    const dx = r.length > 3 ? r[3] : 0;
    const dy = r.length > 4 ? r[4] : 0;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }

  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = this.P(p[0], p[1]);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    if (close) g.closePath();
  }

  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g;
    const w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (w) {
      g.lineWidth = w;
      g.strokeStyle = this.inkColor;
      g.lineJoin = "round";
      g.stroke();
    }
  }

  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }

  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round";
    g.lineJoin = "round";
    if (ink) {
      this.path(pts, false);
      g.strokeStyle = this.inkColor;
      g.lineWidth = w + 2 * this.ol * 0.9;
      g.stroke();
    }
    this.path(pts, false);
    g.strokeStyle = fill;
    g.lineWidth = w;
    g.stroke();
  }

  stroke(pts: P2[], w: number, fill = this.inkColor) {
    const g = this.g;
    g.lineCap = "round";
    g.lineJoin = "round";
    this.path(pts, false);
    g.strokeStyle = fill;
    g.lineWidth = w;
    g.stroke();
  }

  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = this.inkColor) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = rad(a0 + ((a1 - a0) * i) / 24);
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    this.stroke(pts, w, fill);
  }

  dot(cx: number, cy: number, r: number, fill = this.inkColor) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath();
    this.g.arc(x, y, r, 0, Math.PI * 2);
    this.g.fillStyle = fill;
    this.g.fill();
  }

  clip(pts: P2[], fn: () => void) {
    const g = this.g;
    g.save();
    this.path(pts, true);
    g.clip();
    fn();
    g.restore();
  }

  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g;
    const n = pts.length;
    let cx = 0;
    let cy = 0;
    for (const [x, y] of pts) {
      cx += x / n;
      cy += y / n;
    }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base);
    gr.addColorStop(r0 / r1, base);
    gr.addColorStop(1, shadow);
    this.path(pts, true);
    g.fillStyle = gr;
    g.fill();
  }

  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g;
    const dx = Math.cos(light);
    const dy = Math.sin(light);
    const n = pts.length;
    let cx = 0;
    let cy = 0;
    let lo = Infinity;
    let hi = -Infinity;
    for (const [x, y] of pts) {
      cx += x / n;
      cy += y / n;
      const d = x * dx + y * dy;
      lo = Math.min(lo, d);
      hi = Math.max(hi, d);
    }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc));
    const [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base);
    gr.addColorStop(flat, base);
    gr.addColorStop(1, shadow);
    this.path(pts, true);
    g.fillStyle = gr;
    g.fill();
  }

  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = this.inkColor) {
    const n = pts.length;
    let cx = 0;
    let cy = 0;
    for (const [x, y] of pts) {
      cx += x / n;
      cy += y / n;
    }
    const out: P2[] = [];
    const inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n];
      const b = pts[(i + 1) % n];
      let nx = b[1] - a[1];
      let ny = a[0] - b[0];
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]);
      inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => {
      r.forEach(([x0, y0], i) => {
        const [x, y] = this.P(x0, y0);
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      });
      g.closePath();
    };
    g.beginPath();
    trace(out);
    trace(inn.reverse());
    g.fillStyle = col;
    g.fill("evenodd");
  }

  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g;
    g.lineCap = cap;
    g.lineJoin = "round";
    this.path(pts, false);
    g.strokeStyle = this.inkColor;
    g.lineWidth = w + 2 * rim;
    g.stroke();
    this.path(pts, false);
    g.strokeStyle = fill;
    g.lineWidth = w;
    g.stroke();
    g.lineCap = "round";
  }
}

// ---------------- Canvas Texture Pool & Billboards ----------------

type PoolEntry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type PoolReq = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };

const makeEntry = (w: number, h: number): PoolEntry => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { cv, tex, w, h };
};

/** Deterministic per-frame Canvas2D texture pool so identical poses share GPU textures. */
export class CanvasPool {
  private live = new Map<string, PoolEntry>();
  private free: PoolEntry[] = [];
  private reqs: PoolReq[] = [];

  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void): PoolReq {
    const r: PoolReq = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }

  flush() {
    const want = new Map<string, PoolReq[]>();
    for (const r of this.reqs) {
      const list = want.get(r.key);
      if (list) list.push(r);
      else want.set(r.key, [r]);
    }
    for (const [key, e] of this.live) {
      if (!want.has(key)) {
        this.live.delete(key);
        this.free.push(e);
      }
    }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0];
        const i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

export const SU = 0.00216; // 1000 design units = 2.16 m

const makeBlankTex = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  return new THREE.CanvasTexture(c);
};

export const billboardSizeForDistance = (d: number, designW = 600, designH = 1000): [number, number, number] => {
  const k = d < 3.2 ? 3.0 : d < 6.5 ? 1.8 : d < 16 ? 0.8 : 0.4;
  return [Math.round(designW * k), Math.round(designH * k), k];
};

export const lightAngle2D = (sunDir: THREE.Vector3, camRight: THREE.Vector3, mirror = false) => {
  const sx = sunDir.dot(camRight) * (mirror ? -1 : 1);
  const sy = -sunDir.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** Draw soft contact blob texture on a 128x128 canvas (white surround for multiply blend). */
export const drawContactBlob = (p: Pen, tint: [number, number, number] = [0.62, 0.58, 0.58]) => {
  const g = p.g;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 128, 128);
  const [r, grc, b] = tint.map((v) => Math.round(v * 255));
  const grad = g.createRadialGradient(64, 64, 14, 64, 64, 60);
  grad.addColorStop(0, `rgb(${r},${grc},${b})`);
  grad.addColorStop(1, "rgb(255,255,255)");
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(64, 64, 58, 42, 0, 0, Math.PI * 2);
  g.fill();
};

export function createCharacterCardGeometry(designW = 600, designH = 1000, soleY = 975): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(designW * SU, designH * SU);
  g.translate(0, (soleY - designH / 2) * SU, 0);
  return g;
}

const DEFAULT_BODY_GEO = createCharacterCardGeometry(600, 1000, 975);
const UNIT_QUAD = new THREE.PlaneGeometry(1, 1);

/** Lit 2.5D character/prop billboard on NOINK layer using cardShade(). */
export class ActorBillboard {
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  dmat: THREE.MeshDepthMaterial;
  r: PoolReq | null = null;

  constructor(
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry = DEFAULT_BODY_GEO,
    shadeOpts: CardShadeOptions = {}
  ) {
    const blank = makeBlankTex();
    this.mat = cardShade(
      new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }),
      shadeOpts
    );
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: blank,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (renderer) => {
      const rt = renderer.getRenderTarget();
      CARD_K.uPx.value = (rt ? rt.height : renderer.domElement.height) / 1920;
    };
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ";
    this.mesh.renderOrder = 1;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }

  bind() {
    const t = this.r?.tex;
    if (t) {
      this.mat.map = t;
      this.dmat.map = t;
    }
  }
}

/** Unlit 2D effect / contact blob card on NOINK layer. */
export class FxBillboard {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  soft: THREE.MeshBasicMaterial;
  blob: THREE.MeshBasicMaterial;
  r: PoolReq | null = null;

  constructor(parent: THREE.Object3D) {
    const blank = makeBlankTex();
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({
      map: blank,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(UNIT_QUAD, this.mat);
    this.mesh.visible = false;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }

  use(kind: "hard" | "soft" | "blob") {
    this.mesh.material = kind === "blob" ? this.blob : kind === "soft" ? this.soft : this.mat;
    this.mesh.renderOrder = kind === "blob" ? 0.5 : 0;
  }

  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.mesh.material === this.blob) {
      if (t.generateMipmaps) {
        t.generateMipmaps = false;
        t.minFilter = THREE.LinearFilter;
        t.needsUpdate = true;
      }
      this.blob.map = t;
    } else {
      this.mat.map = t;
      this.soft.map = t;
    }
  }
}
