// Stage cast placer for Stage 6 PoC ("Rahasia Klorofil")

import * as THREE from "three";
import { LIGHTS, LightMode, Pen, drawContactBlob, lightAngle2D } from "../../shared/kokisoyo25d";
import { ResearcherStyle, Expr, drawChlorophyllSparks, drawResearcher } from "./characters";

export interface ActorPlacement {
  key: string;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  scale?: number;
  mirror?: boolean;
  size: [number, number, number];
}

export interface FxPlacement {
  key: string;
  cw: number;
  ch: number;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  flat?: boolean;
  kind: "hard" | "soft" | "blob";
}

export interface CastOutput {
  actors: ActorPlacement[];
  fx: FxPlacement[];
}

const KOKO_STYLE: ResearcherStyle = {
  coat: "#0d9488",
  pants: "#1e293b",
  skin: "#fdf4eb",
  shoes: "#0f172a",
  hatColor: "#f59e0b",
  glasses: true,
  magnifier: true,
};

const BUDI_STYLE: ResearcherStyle = {
  coat: "#ea580c",
  pants: "#334155",
  skin: "#faebd7",
  shoes: "#0f172a",
};

const quant = (v: number, n = 40) => Math.round(v * n) / n;

export function buildCast(
  shotId: number,
  tSec: number,
  light: LightMode,
  camPos: THREE.Vector3,
  camRight: THREE.Vector3,
  sunDir: THREE.Vector3
): CastOutput {
  const out: CastOutput = { actors: [], fx: [] };
  const l2d = lightAngle2D(sunDir, camRight, false);
  const blobTint = LIGHTS[light].blob;

  const blink = tSec % 2.3 < 0.12 ? 1 : 0;
  const phase = (tSec * 0.7) % 1;
  const kokoExpr: Expr = shotId === 1 ? "curious" : shotId === 2 ? "shock" : "smile";
  const budiExpr: Expr = shotId === 2 ? "shock" : shotId === 3 ? "smile" : "curious";

  // Prof. Koko left of workbench
  const kokoPos: [number, number, number] = [-0.95, 0, 0.15];
  const dKoko = camPos.distanceTo(new THREE.Vector3(...kokoPos));
  const kKoko = dKoko < 3.6 ? 2.0 : 1.0;

  out.actors.push({
    key: `koko|${quant(phase)}|${kokoExpr}|${blink}|${quant(l2d, 10)}`,
    draw: (p) =>
      drawResearcher(p, KOKO_STYLE, {
        phase,
        expr: kokoExpr,
        blink,
        lightAngle: l2d,
      }),
    x: kokoPos[0],
    y: kokoPos[1],
    z: kokoPos[2],
    size: [Math.round(600 * kKoko), Math.round(1000 * kKoko), kKoko],
  });

  out.fx.push({
    key: `blob|${light}`,
    cw: 128,
    ch: 128,
    draw: (p) => drawContactBlob(p, blobTint),
    x: kokoPos[0],
    y: 0.015,
    z: kokoPos[2],
    w: 1.18,
    h: 0.98,
    flat: true,
    kind: "blob",
  });

  // Budi right of workbench, pointing toward the leaf & prism without touching prism
  const budiPos: [number, number, number] = [1.18, 0, -0.02];
  const dBudi = camPos.distanceTo(new THREE.Vector3(...budiPos));
  const kBudi = dBudi < 3.6 ? 2.0 : 1.0;

  out.actors.push({
    key: `budi|${quant((phase + 0.35) % 1)}|${budiExpr}|${blink}|${quant(l2d, 10)}|${shotId}`,
    draw: (p) =>
      drawResearcher(p, BUDI_STYLE, {
        phase: (phase + 0.35) % 1,
        expr: budiExpr,
        blink,
        lightAngle: l2d,
        pointRight: shotId !== 3,
      }),
    x: budiPos[0],
    y: budiPos[1],
    z: budiPos[2],
    mirror: shotId !== 3,
    size: [Math.round(600 * kBudi), Math.round(1000 * kBudi), kBudi],
  });

  out.fx.push({
    key: `blob|${light}`,
    cw: 128,
    ch: 128,
    draw: (p) => drawContactBlob(p, blobTint),
    x: budiPos[0],
    y: 0.015,
    z: budiPos[2],
    w: 1.15,
    h: 0.95,
    flat: true,
    kind: "blob",
  });

  // Energy sparks above the leaf in Shot 2 & 3
  if (shotId >= 2) {
    const u = ((tSec - 2.66) * 0.9) % 1;
    if (u >= 0) {
      out.fx.push({
        key: `leafsparks|${quant(u, 24)}`,
        cw: 500,
        ch: 500,
        draw: (p) => drawChlorophyllSparks(p, u),
        x: 0.0,
        y: 1.76,
        z: -0.35,
        w: 0.62,
        h: 0.62,
        kind: "hard",
      });
    }
  }

  return out;
}
