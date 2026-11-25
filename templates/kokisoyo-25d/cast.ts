// Stage cast placer for Kok Iso Yo? episode template.
// Maps frame time to 2D Canvas character drawings & ground contact blobs.

import * as THREE from "three";
import { LIGHTS, LightMode, Pen, drawContactBlob, lightAngle2D } from "../../src/shared/kokisoyo25d";
import { drawCartoonCharacter, drawSparkBurst, CharacterStyle, Expr } from "./characters";

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

const HOST_STYLE: CharacterStyle = {
  coat: "#2563eb",
  pants: "#1e293b",
  skin: "#f5c9a0",
  shoes: "#0f172a",
  accent: "#f59e0b",
};

const PEER_STYLE: CharacterStyle = {
  coat: "#16a34a",
  pants: "#334155",
  skin: "#ecd0b6",
  shoes: "#0f172a",
};

const quant = (v: number, n = 60) => Math.round(v * n) / n;

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

  const blink = (tSec % 2.1) < 0.12 ? 1 : 0;
  const expr: Expr = shotId === 1 ? "curious" : shotId === 2 ? "shock" : "smile";
  const phase = (tSec * 0.8) % 1;

  // Main host character
  const hostPos: [number, number, number] = [-0.65, 0, 0];
  const dHost = camPos.distanceTo(new THREE.Vector3(...hostPos));
  const k = dHost < 3.5 ? 2.0 : 1.0;

  out.actors.push({
    key: `host|${quant(phase, 30)}|${expr}|${blink}|${quant(l2d, 10)}`,
    draw: (p) => drawCartoonCharacter(p, HOST_STYLE, { phase, expr, blink, lightAngle: l2d }),
    x: hostPos[0],
    y: hostPos[1],
    z: hostPos[2],
    size: [Math.round(600 * k), Math.round(1000 * k), k],
  });

  out.fx.push({
    key: `blob|${light}`,
    cw: 128,
    ch: 128,
    draw: (p) => drawContactBlob(p, blobTint),
    x: hostPos[0],
    y: 0.015,
    z: hostPos[2],
    w: 1.2,
    h: 1.0,
    flat: true,
    kind: "blob",
  });

  // Companion character on right
  const peerPos: [number, number, number] = [0.75, 0, -0.35];
  out.actors.push({
    key: `peer|${quant((phase + 0.35) % 1, 30)}|${expr}|${blink}|${quant(l2d, 10)}`,
    draw: (p) =>
      drawCartoonCharacter(p, PEER_STYLE, {
        phase: (phase + 0.35) % 1,
        expr: shotId === 3 ? "smile" : "neutral",
        blink,
        lightAngle: l2d,
      }),
    x: peerPos[0],
    y: peerPos[1],
    z: peerPos[2],
    size: [Math.round(600 * k), Math.round(1000 * k), k],
  });

  out.fx.push({
    key: `blob|${light}`,
    cw: 128,
    ch: 128,
    draw: (p) => drawContactBlob(p, blobTint),
    x: peerPos[0],
    y: 0.015,
    z: peerPos[2],
    w: 1.2,
    h: 1.0,
    flat: true,
    kind: "blob",
  });

  // Beat burst on Shot 2 start
  if (shotId === 2 && tSec >= 3.0 && tSec < 3.45) {
    const u = (tSec - 3.0) / 0.45;
    out.fx.push({
      key: `burst|${quant(u, 30)}`,
      cw: 500,
      ch: 500,
      draw: (p) => drawSparkBurst(p, u),
      x: 0.05,
      y: 1.65,
      z: 0.1,
      w: 0.9,
      h: 0.9,
      kind: "hard",
    });
  }

  return out;
}
