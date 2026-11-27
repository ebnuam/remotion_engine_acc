// Cast staging & diegetic 2D FX placement for Ep003: Jembatan Laut (Cofferdam).
// Places Chief Engineer (white hardhat + orange reflective vest) and 5-6 crew members
// naturally across the floating crane barge deck, cofferdam scaffolding, ladder, dry seabed,
// night shift concrete pour, and golden-hour finale celebration.

import * as THREE from "three";
import { LIGHTS, LightMode, Pen, drawContactBlob, lightAngle2D } from "../shared/kokisoyo25d";
import {
  CHIEF_ENGINEER,
  CREW_STYLES,
  EngineerExpr,
  EngineerPose,
  EngineerStyle,
  drawConcreteWashout,
  drawEngineer,
  drawFloodlightGlow,
  drawWaterSplash,
} from "./characters";
import { MoodMode } from "./story";

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

const quant = (v: number, n = 40) => Math.round(v * n) / n;

function addEngineer(
  out: CastOutput,
  id: string,
  style: EngineerStyle,
  pos: [number, number, number],
  opts: {
    pose: EngineerPose;
    expr: EngineerExpr;
    phase: number;
    blink: number;
    l2d: number;
    scale?: number;
    mirror?: boolean;
    clipboard?: boolean;
    blobTint?: [number, number, number];
    noBlob?: boolean;
  },
  camPos: THREE.Vector3
) {
  const sc = opts.scale ?? 1.05;
  const dist = camPos.distanceTo(new THREE.Vector3(...pos));
  const k = dist < 7 ? 1.6 : dist < 16 ? 1.15 : 0.85;
  out.actors.push({
    key: `${id}|${opts.pose}|${opts.expr}|${opts.clipboard ? 1 : 0}|${quant(opts.phase, 24)}|${opts.blink}|${quant(opts.l2d, 8)}`,
    draw: (p) =>
      drawEngineer(p, style, {
        phase: opts.phase,
        pose: opts.pose,
        expr: opts.expr,
        blink: opts.blink,
        lightAngle: opts.l2d,
        clipboard: opts.clipboard,
      }),
    x: pos[0],
    y: pos[1],
    z: pos[2],
    scale: sc,
    mirror: opts.mirror,
    size: [Math.round(600 * k), Math.round(1000 * k), k],
  });

  if (!opts.noBlob && opts.blobTint) {
    out.fx.push({
      key: `blob|${opts.blobTint.map((v) => Math.round(v * 20)).join("_")}`,
      cw: 128,
      ch: 128,
      draw: (p) => drawContactBlob(p, opts.blobTint!),
      x: pos[0],
      y: pos[1] + 0.03,
      z: pos[2],
      w: 0.95 * sc,
      h: 0.85 * sc,
      flat: true,
      kind: "blob",
    });
  }
}

export function buildCast(
  shotId: number,
  tSec: number,
  light: LightMode,
  mood: MoodMode,
  bargeY: number,
  camPos: THREE.Vector3,
  camRight: THREE.Vector3,
  sunDir: THREE.Vector3
): CastOutput {
  const out: CastOutput = { actors: [], fx: [] };
  const l2d = lightAngle2D(sunDir, camRight, false);
  const blobTint: [number, number, number] =
    mood === "night" ? [0.22, 0.34, 0.62] : mood === "underwater" ? [0.14, 0.32, 0.48] : LIGHTS[light].blob;

  const blinkA = (tSec % 2.9) < 0.11 ? 1 : 0;
  const blinkB = ((tSec + 1.3) % 3.4) < 0.11 ? 1 : 0;
  const p0 = (tSec * 0.7) % 1;

  // ---------------------------------------------------------------------------
  // SHOT 2: Waterline Scale Shock — tiny engineers on barge looking up at massive pier
  // ---------------------------------------------------------------------------
  if (shotId === 2) {
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-9.8, bargeY, 4.0],
      { pose: "lookUp", expr: "focused", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c0",
      CREW_STYLES[0],
      [-11.2, bargeY, 4.9],
      { pose: "lookUp", expr: "focused", phase: (p0 + 0.25) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c1",
      CREW_STYLES[1],
      [-9.2, bargeY, 2.2],
      { pose: "point", expr: "focused", phase: (p0 + 0.5) % 1, blink: blinkA, l2d, blobTint },
      camPos
    );
  }

  // ---------------------------------------------------------------------------
  // SHOT 4: Barge crane dumps wet concrete directly into open sea
  // ---------------------------------------------------------------------------
  if (shotId === 4) {
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-9.5, bargeY, 4.5],
      { pose: "point", expr: "skeptical", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c0",
      CREW_STYLES[0],
      [-11.1, bargeY, 5.4],
      { pose: "stand", expr: "skeptical", phase: (p0 + 0.3) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c2",
      CREW_STYLES[2],
      [-10.4, bargeY, 2.4],
      { pose: "operate", expr: "focused", phase: (p0 + 0.6) % 1, blink: blinkA, l2d, blobTint },
      camPos
    );
    // Water splash rings where concrete falls at (0, 0.08, 0)
    const sp = (tSec * 1.4) % 1;
    out.fx.push({
      key: `splash|${quant(sp, 20)}`,
      cw: 512,
      ch: 512,
      draw: (p) => drawWaterSplash(p, sp),
      x: 0,
      y: 0.1,
      z: 0,
      w: 5.5,
      h: 5.5,
      flat: true,
      kind: "soft",
    });
  }

  // ---------------------------------------------------------------------------
  // SHOT 5: Underwater concrete washout cloud drifting right in ocean current
  // ---------------------------------------------------------------------------
  if (shotId === 5) {
    const u = Math.min(1, Math.max(0, (tSec - 11.8) / 2.8));
    out.fx.push({
      key: `washout|${quant(u, 24)}`,
      cw: 512,
      ch: 512,
      draw: (p) => drawConcreteWashout(p, u),
      x: 0.6 + u * 2.2,
      y: -4.8,
      z: 0.5,
      w: 11.5,
      h: 8.5,
      kind: "soft",
    });
  }

  // ---------------------------------------------------------------------------
  // SHOT 6: 5 Crew members peering worriedly over the barge railing
  // ---------------------------------------------------------------------------
  if (shotId === 6) {
    const line: [number, number, EngineerStyle, EngineerPose, EngineerExpr][] = [
      [-10.4, 3.8, CHIEF_ENGINEER, "worry", "worried"],
      [-11.8, 2.7, CREW_STYLES[0], "worry", "worried"],
      [-10.9, 1.3, CREW_STYLES[1], "stand", "skeptical"],
      [-12.6, 0.4, CREW_STYLES[2], "worry", "worried"],
      [-11.5, -0.7, CREW_STYLES[3], "stand", "worried"],
    ];
    line.forEach(([x, z, st, pose, expr], idx) => {
      addEngineer(
        out,
        `s6_${idx}`,
        st,
        [x, bargeY, z],
        {
          pose,
          expr,
          phase: (p0 + idx * 0.19) % 1,
          blink: idx % 2 === 0 ? blinkA : blinkB,
          l2d,
          clipboard: idx === 0,
          blobTint,
        },
        camPos
      );
    });
  }

  // ---------------------------------------------------------------------------
  // SHOT 7: Chief Engineer gets the Cofferdam breakthrough idea!
  // ---------------------------------------------------------------------------
  if (shotId === 7) {
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-11.2, bargeY, 2.3],
      { pose: "idea", expr: "idea", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c0",
      CREW_STYLES[0],
      [-12.8, bargeY, 1.4],
      { pose: "lookUp", expr: "proud", phase: (p0 + 0.2) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c1",
      CREW_STYLES[1],
      [-12.1, bargeY, 0.1],
      { pose: "stand", expr: "focused", phase: (p0 + 0.45) % 1, blink: blinkA, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c4",
      CREW_STYLES[4],
      [-10.0, bargeY, 0.9],
      { pose: "stand", expr: "focused", phase: (p0 + 0.7) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
  }

  // ---------------------------------------------------------------------------
  // SHOTS 8, 9, 10, 12, 13: Active offshore piling & bracing crew on barge & catwalk
  // ---------------------------------------------------------------------------
  if (shotId === 8 || shotId === 9 || shotId === 10) {
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-9.5, bargeY, 4.4],
      { pose: "point", expr: "focused", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c0",
      CREW_STYLES[0],
      [-10.8, bargeY, 5.5],
      { pose: "lookUp", expr: "focused", phase: (p0 + 0.3) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c3",
      CREW_STYLES[3],
      [-9.2, bargeY, 2.2],
      { pose: "operate", expr: "focused", phase: (p0 + 0.6) % 1, blink: blinkA, l2d, blobTint },
      camPos
    );
    if (shotId === 10) {
      const sp = (tSec * 2.2) % 1;
      out.fx.push({
        key: `splash10|${quant(sp, 20)}`,
        cw: 512,
        ch: 512,
        draw: (p) => drawWaterSplash(p, sp),
        x: 2.5,
        y: 0.12,
        z: 5.6,
        w: 4.2,
        h: 4.2,
        flat: true,
        kind: "soft",
      });
    }
  }

  if (shotId === 13) {
    // Engineers inspecting heavy internal steel bracing from upper rim catwalk (y = 2.85)
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-4.2, 2.85, -3.5],
      { pose: "inspect", expr: "focused", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c2",
      CREW_STYLES[2],
      [3.8, 2.85, -4.1],
      { pose: "point", expr: "focused", phase: (p0 + 0.35) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
  }

  // ---------------------------------------------------------------------------
  // SHOT 14: Dewatering pump station operators on barge edge
  // ---------------------------------------------------------------------------
  if (shotId === 14) {
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-8.7, bargeY, 4.9],
      { pose: "point", expr: "proud", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c1",
      CREW_STYLES[1],
      [-9.3, bargeY, 2.1],
      { pose: "operate", expr: "focused", phase: (p0 + 0.25) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c4",
      CREW_STYLES[4],
      [-10.6, bargeY, 3.6],
      { pose: "inspect", expr: "focused", phase: (p0 + 0.55) % 1, blink: blinkA, l2d, blobTint },
      camPos
    );
  }

  // ---------------------------------------------------------------------------
  // SHOT 15: Dewatering cutaway — crew supervising from top rim + splash rings where jets hit sea
  // ---------------------------------------------------------------------------
  if (shotId === 15) {
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-9.0, bargeY, 3.2],
      { pose: "point", expr: "proud", phase: p0, blink: blinkA, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c0",
      CREW_STYLES[0],
      [-10.2, bargeY, 1.8],
      { pose: "operate", expr: "focused", phase: (p0 + 0.4) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    const sp = (tSec * 2.5) % 1;
    out.fx.push({
      key: `jetsp1|${quant(sp, 20)}`,
      cw: 512,
      ch: 512,
      draw: (p) => drawWaterSplash(p, sp),
      x: 9.8,
      y: 0.14,
      z: 1.4,
      w: 4.5,
      h: 4.5,
      flat: true,
      kind: "soft",
    });
    out.fx.push({
      key: `jetsp2|${quant((sp + 0.45) % 1, 20)}`,
      cw: 512,
      ch: 512,
      draw: (p) => drawWaterSplash(p, (sp + 0.45) % 1),
      x: 10.1,
      y: 0.14,
      z: -1.6,
      w: 4.2,
      h: 4.2,
      flat: true,
      kind: "soft",
    });
  }

  // ---------------------------------------------------------------------------
  // SHOT 16: Vertical Ladder Descent inside deep dry cofferdam!
  // ---------------------------------------------------------------------------
  if (shotId === 16) {
    const climbDrop = Math.min(1, Math.max(0, (tSec - 46.3) / 3.4));
    // Two engineers descending the tall vertical steel ladder at (x = 1.9, z = -2.7)
    addEngineer(
      out,
      "c0",
      CREW_STYLES[0],
      [1.9, -1.6 - climbDrop * 2.2, -2.55],
      { pose: "climb", expr: "focused", phase: (tSec * 1.1) % 1, blink: blinkA, l2d, noBlob: true },
      camPos
    );
    addEngineer(
      out,
      "c1",
      CREW_STYLES[1],
      [1.9, -5.2 - climbDrop * 1.8, -2.55],
      { pose: "climb", expr: "focused", phase: (tSec * 1.1 + 0.5) % 1, blink: blinkB, l2d, noBlob: true },
      camPos
    );
    // Chief Engineer already on dry ocean floor welcoming them down!
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-0.6, -10.5, -1.8],
      { pose: "lookUp", expr: "proud", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c2",
      CREW_STYLES[2],
      [-2.4, -10.5, -2.6],
      { pose: "lookUp", expr: "focused", phase: (p0 + 0.3) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
  }

  // ---------------------------------------------------------------------------
  // SHOT 17: Mind-blowing scale hero shot — 5 engineers standing DRY on ocean floor!
  // ---------------------------------------------------------------------------
  if (shotId === 17) {
    const floorCrew: [number, number, EngineerStyle, EngineerPose, EngineerExpr][] = [
      [0.0, -1.6, CHIEF_ENGINEER, "point", "proud"],
      [-1.7, -2.2, CREW_STYLES[0], "lookUp", "proud"],
      [1.7, -2.4, CREW_STYLES[1], "lookUp", "focused"],
      [-3.1, -1.1, CREW_STYLES[2], "stand", "focused"],
      [3.0, -1.2, CREW_STYLES[3], "lookUp", "proud"],
    ];
    floorCrew.forEach(([x, z, st, pose, expr], idx) => {
      addEngineer(
        out,
        `s17_${idx}`,
        st,
        [x, -10.5, z],
        {
          pose,
          expr,
          phase: (p0 + idx * 0.21) % 1,
          blink: idx % 2 === 0 ? blinkA : blinkB,
          l2d,
          clipboard: idx === 0,
          blobTint,
        },
        camPos
      );
    });
  }

  // ---------------------------------------------------------------------------
  // SHOT 18: Deep bedrock pile drilling crew on dry seabed
  // ---------------------------------------------------------------------------
  if (shotId === 18) {
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-3.4, -10.5, 0.2],
      { pose: "inspect", expr: "focused", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c3",
      CREW_STYLES[3],
      [3.1, -10.5, -0.8],
      { pose: "operate", expr: "focused", phase: (p0 + 0.35) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c5",
      CREW_STYLES[5],
      [-2.2, -10.5, -2.5],
      { pose: "stand", expr: "focused", phase: (p0 + 0.6) % 1, blink: blinkA, l2d, blobTint },
      camPos
    );
  }

  // ---------------------------------------------------------------------------
  // SHOT 19: Multi-tier steel rebar cage assembly on scaffolding decks (feet 100% flush on wood planks!)
  // ---------------------------------------------------------------------------
  if (shotId === 19) {
    // Right scaffolding planks are at y = -7.3, -4.1, -0.9; left scaffolding planks at y = -7.5, -3.1
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [3.1, -7.22, -1.5],
      { pose: "point", expr: "focused", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c0",
      CREW_STYLES[0],
      [3.1, -0.82, -1.8],
      { pose: "operate", expr: "focused", phase: (p0 + 0.25) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c1",
      CREW_STYLES[1],
      [-3.2, -7.42, -1.2],
      { pose: "inspect", expr: "focused", phase: (p0 + 0.5) % 1, blink: blinkA, l2d, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c4",
      CREW_STYLES[4],
      [-3.0, -3.02, -1.6],
      { pose: "operate", expr: "focused", phase: (p0 + 0.7) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
  }

  // ---------------------------------------------------------------------------
  // SHOTS 20 & 21: NIGHT SHIFT COBALT FLOODLIT POURING (ref_009 signature homage!)
  // ---------------------------------------------------------------------------
  if (shotId === 20 || shotId === 21) {
    // Group of 6 engineers visible right on the cofferdam catwalk & barge rim under bright floodlights!
    const nightCrew: [number, number, number, EngineerStyle, EngineerPose, EngineerExpr][] = [
      [-4.2, 2.84, 3.6, CHIEF_ENGINEER, "point", "focused"],
      [-5.3, 2.84, 2.2, CREW_STYLES[0], "operate", "focused"],
      [-3.2, 2.84, 4.7, CREW_STYLES[1], "inspect", "focused"],
      [4.2, 2.84, 3.2, CREW_STYLES[2], "inspect", "proud"],
      [5.0, 2.84, 1.4, CREW_STYLES[3], "operate", "focused"],
      [-8.8, bargeY, 4.6, CREW_STYLES[4], "stand", "focused"],
    ];
    nightCrew.forEach(([x, y, z, st, pose, expr], idx) => {
      addEngineer(
        out,
        `s20_${idx}`,
        st,
        [x, y, z],
        {
          pose,
          expr,
          phase: (p0 + idx * 0.17) % 1,
          blink: idx % 2 === 0 ? blinkA : blinkB,
          l2d,
          clipboard: idx === 0,
          blobTint,
        },
        camPos
      );
    });

    // Soft warm glowing floodlight halos on the 3 night lighting towers!
    const lampSpots: [number, number, number][] = [
      [-8.5, bargeY + 9.2, 6.2],
      [-8.5, bargeY + 9.2, -3.5],
      [6.4, 9.6, -2.5],
    ];
    lampSpots.forEach(([x, y, z], i) => {
      out.fx.push({
        key: `lamp_glow_${i}`,
        cw: 256,
        ch: 256,
        draw: (p) => drawFloodlightGlow(p),
        x,
        y,
        z,
        w: 4.8,
        h: 4.8,
        kind: "soft",
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SHOT 22: Golden Hour — pulling steel sheet piles back up
  // ---------------------------------------------------------------------------
  if (shotId === 22) {
    addEngineer(
      out,
      "chief",
      CHIEF_ENGINEER,
      [-9.2, bargeY, 4.6],
      { pose: "point", expr: "proud", phase: p0, blink: blinkA, l2d, clipboard: true, blobTint },
      camPos
    );
    addEngineer(
      out,
      "c0",
      CREW_STYLES[0],
      [-10.8, bargeY, 3.6],
      { pose: "lookUp", expr: "proud", phase: (p0 + 0.3) % 1, blink: blinkB, l2d, blobTint },
      camPos
    );
    const sp = (tSec * 1.8) % 1;
    out.fx.push({
      key: `pullsp|${quant(sp, 20)}`,
      cw: 512,
      ch: 512,
      draw: (p) => drawWaterSplash(p, sp),
      x: 5.5,
      y: 0.14,
      z: 2.8,
      w: 4.0,
      h: 4.0,
      flat: true,
      kind: "soft",
    });
  }

  // ---------------------------------------------------------------------------
  // SHOT 26: Finale Celebration — Chief Engineer + 5 crew cheering cleanly on forward barge bow!
  // ---------------------------------------------------------------------------
  if (shotId === 26) {
    const party: [number, number, EngineerStyle, EngineerPose][] = [
      [-9.8, 5.6, CHIEF_ENGINEER, "cheer"],
      [-11.8, 5.2, CREW_STYLES[0], "cheer"],
      [-10.9, 4.1, CREW_STYLES[1], "cheer"],
      [-12.9, 3.8, CREW_STYLES[2], "cheer"],
      [-8.7, 3.9, CREW_STYLES[3], "cheer"],
      [-7.9, 5.0, CREW_STYLES[5], "cheer"],
    ];
    party.forEach(([x, z, st, pose], idx) => {
      addEngineer(
        out,
        `fin_${idx}`,
        st,
        [x, bargeY, z],
        {
          pose,
          expr: "cheer",
          phase: (p0 + idx * 0.16) % 1,
          blink: idx % 2 === 0 ? blinkA : blinkB,
          l2d,
          blobTint,
        },
        camPos
      );
    });
  }

  return out;
}
