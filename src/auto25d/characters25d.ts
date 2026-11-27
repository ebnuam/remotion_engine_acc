// Expressive 2.5D Cartoon Cast (Lead Aviation Engineer Koko + Airport Ground Crew) & Clean Diegetic FX
// Styled after reference 2.5D-in-3D engineering explainers (clean bean heads, reflective safety vests,
// hardhats/earmuffs, active physical leaning/inspecting/pumping poses, crisp sweat/lightbulb/spark icons).

import {
  DEFAULT_INK,
  Pen,
  curvePts,
  ellPts,
  roundedRectPts,
  shadeColor,
  superellipsePts,
} from "../shared/kokisoyo25d";
import type { AutoHostAccessory, AutoHostExpr, AutoHostPose } from "./types";

export type ExtendedHostPose = AutoHostPose | "inspect" | "pump" | "idea" | "marshal";

export interface HostDrawOptions {
  phase: number;
  talkPulse: number; // 0..1 mouth energy
  expr: AutoHostExpr;
  pose: ExtendedHostPose;
  accessory: AutoHostAccessory;
  blink: number;
  lightAngle: number;
}

export interface CrewWorkerOptions {
  phase: number;
  expr: "watch" | "shock" | "smile" | "laugh";
  shirtColor: string;
  hatColor: string;
  skinColor?: string;
  blink: number;
  lightAngle: number;
  armUp?: boolean;
}

/**
 * Draws the Lead Aviation Engineer (Pak Koko) on a 600x1000 canvas (soles grounded at y = 966).
 * Features reflective orange airport safety vest over crisp shirt + red tie, hard-hat or earmuffs,
 * and expressive body tilt/leaning for active storytelling (inspecting, pumping, marshalling, idea).
 */
export function drawKokoHost(p: Pen, o: HostDrawOptions) {
  const vest = "#f97316";
  const shirt = "#e0f2fe";
  const pants = "#1e293b";
  const skin = "#f6d2b0";
  const shoes = "#451a03";
  const hair = "#1f2937";

  const isLeaning = o.pose === "inspect" || o.pose === "pump";
  const leanX = isLeaning ? 42 : 0;
  const leanY = isLeaning ? 38 : 0;

  const bob = Math.abs(Math.sin(o.phase * Math.PI * 2)) * (o.pose === "pump" ? 22 : 10);
  const sway = Math.sin(o.phase * Math.PI * 2) * 6;
  const headCx = 300 + sway * 0.35 + leanX;
  const headCy = 294 - bob + leanY;
  const headR = 110;

  const vestShadow = shadeColor(vest, 0.74);
  const skinShadow = shadeColor(skin, 0.87);

  // Legs + shoes grounded cleanly at y = 966
  const soleY = 966;
  const hipY = 674 - bob + leanY * 0.5;
  const stance = o.pose === "brace" || isLeaning ? 64 : 30;
  p.line(
    [
      [272 + leanX * 0.3, hipY],
      [258 - stance * 0.4, 822],
      [268 - stance, soleY],
    ],
    pants,
    22,
    true
  );
  p.line(
    [
      [328 + leanX * 0.3, hipY],
      [340 + stance * 0.4, 822],
      [332 + stance, soleY],
    ],
    pants,
    22,
    true
  );
  p.ell(274 - stance, soleY, 28, 13, shoes, 9);
  p.ell(338 + stance, soleY, 28, 13, shoes, 9);

  // Back arm
  const armWave = Math.sin(o.phase * Math.PI * 4) * 26;
  if (o.pose === "marshal" || o.pose === "brace") {
    const hx = 148 + leanX * 0.4;
    const hy = 326 - bob + armWave * 0.7;
    p.line(
      [
        [226 + leanX * 0.5, 474 - bob + leanY * 0.6],
        [174 + leanX * 0.4, 412 - bob],
        [hx, hy],
      ],
      shirt,
      20,
      true
    );
    p.dot(hx, hy, 15, DEFAULT_INK);
    if (o.pose === "marshal") {
      // Glowing orange airport marshalling wand
      p.line([[hx, hy], [hx - 24, hy - 95]], "#f97316", 20, true);
      p.line([[hx, hy], [hx - 24, hy - 95]], "#fde047", 8, false);
    }
  } else if (o.pose === "pump") {
    const py = 540 + Math.sin(o.phase * Math.PI * 4) * 48;
    p.line(
      [
        [238 + leanX * 0.6, 478 - bob + leanY * 0.7],
        [345 + leanX * 0.8, 515 + leanY * 0.5],
        [448 + leanX, py],
      ],
      shirt,
      20,
      true
    );
    p.dot(448 + leanX, py, 14, DEFAULT_INK);
  } else if (o.pose === "wave") {
    p.line(
      [
        [226, 474 - bob],
        [168, 420 - bob + armWave * 0.4],
        [140, 336 - bob + armWave],
      ],
      shirt,
      20,
      true
    );
    p.dot(140, 336 - bob + armWave, 15, DEFAULT_INK);
  } else {
    p.line(
      [
        [226 + leanX * 0.5, 474 - bob + leanY * 0.6],
        [192 + leanX * 0.3, 570 - bob + leanY * 0.5],
        [188 + leanX * 0.2, 650 - bob + leanY * 0.4],
      ],
      shirt,
      20,
      true
    );
    p.dot(188 + leanX * 0.2, 654 - bob + leanY * 0.4, 14, DEFAULT_INK);
  }

  // Torso (reflective orange high-vis safety vest over light-blue shirt + red tie!)
  const torsoCx = 300 + leanX * 0.65;
  const torsoCy = 558 - bob + leanY * 0.7;
  const torsoPts = superellipsePts(torsoCx, torsoCy, 86, 134, 2.0, 2.35, 48);
  p.gradFill(torsoPts, vest, vestShadow, o.lightAngle);
  // Crisp center shirt panel + red tie
  p.poly(
    [
      [torsoCx - 28, torsoCy - 122],
      [torsoCx + 28, torsoCy - 122],
      [torsoCx + 22, torsoCy + 115],
      [torsoCx - 22, torsoCy + 115],
    ],
    shirt,
    6
  );
  p.poly(
    [
      [torsoCx - 9, torsoCy - 108],
      [torsoCx + 9, torsoCy - 108],
      [torsoCx + 14, torsoCy + 18],
      [torsoCx, torsoCy + 42],
      [torsoCx - 14, torsoCy + 18],
    ],
    "#dc2626",
    5
  );
  // Horizontal white reflective safety stripes on vest
  for (const sy of [torsoCy + 24, torsoCy + 68]) {
    p.line([[torsoCx - 76, sy], [torsoCx - 25, sy]], "#f8fafc", 14, false);
    p.line([[torsoCx + 25, sy], [torsoCx + 76, sy]], "#f8fafc", 14, false);
  }
  p.inkRing(torsoPts, 14, Math.PI * 0.65, 0.42);

  // Front arm (pose-driven)
  const shoulderX = torsoCx + 70;
  const shoulderY = torsoCy - 86;
  if (o.pose === "inspect") {
    const gx = shoulderX + 128;
    const gy = shoulderY + 34 + Math.sin(o.phase * Math.PI * 2) * 14;
    p.line([[shoulderX, shoulderY], [shoulderX + 68, shoulderY + 56], [gx, gy]], shirt, 20, true);
    p.dot(gx, gy, 15, DEFAULT_INK);
    // Magnifier / inspection lens in hand
    p.ell(gx + 26, gy - 24, 32, 32, "#bae6fd", 9);
  } else if (o.pose === "pump") {
    const py = 540 + Math.sin(o.phase * Math.PI * 4) * 48;
    p.line([[shoulderX, shoulderY], [shoulderX + 74, shoulderY + 46], [468 + leanX, py]], shirt, 20, true);
    p.dot(468 + leanX, py, 15, DEFAULT_INK);
  } else if (o.pose === "idea") {
    const fx = shoulderX + 74;
    const fy = shoulderY - 128 + Math.sin(o.phase * Math.PI * 2) * 10;
    p.line([[shoulderX, shoulderY], [shoulderX + 54, shoulderY - 38], [fx, fy]], shirt, 20, true);
    p.dot(fx, fy, 16, DEFAULT_INK);
  } else if (o.pose === "marshal" || o.pose === "brace") {
    const hx = shoulderX + 86;
    const hy = shoulderY - 124 - armWave * 0.7;
    p.line([[shoulderX, shoulderY], [shoulderX + 58, shoulderY - 46], [hx, hy]], shirt, 20, true);
    p.dot(hx, hy, 15, DEFAULT_INK);
    if (o.pose === "marshal") {
      p.line([[hx, hy], [hx + 24, hy - 95]], "#f97316", 20, true);
      p.line([[hx, hy], [hx + 24, hy - 95]], "#fde047", 8, false);
    }
  } else if (o.pose === "point") {
    const px = shoulderX + 125;
    const py = shoulderY - 68 + Math.sin(o.phase * Math.PI * 2) * 10;
    p.line([[shoulderX, shoulderY], [shoulderX + 66, shoulderY - 26], [px, py]], shirt, 20, true);
    p.dot(px, py, 15, DEFAULT_INK);
  } else if (o.pose === "thumbs_up") {
    p.line([[shoulderX, shoulderY], [shoulderX + 68, shoulderY + 14], [shoulderX + 98, shoulderY - 56]], shirt, 20, true);
    p.ell(shoulderX + 100, shoulderY - 64, 20, 18, skin, 8);
    p.line([[shoulderX + 100, shoulderY - 78], [shoulderX + 100, shoulderY - 110]], skin, 14, true);
  } else {
    p.line([[shoulderX, shoulderY], [shoulderX + 38, shoulderY + 86], [shoulderX + 46, shoulderY + 150]], shirt, 20, true);
    p.dot(shoulderX + 46, shoulderY + 154, 14, DEFAULT_INK);
  }

  // Head
  const headPts = superellipsePts(headCx, headCy, headR, headR * 0.93, 1.75, 2.25, 56);
  p.shadedFill(headPts, skin, skinShadow, o.lightAngle, headR);
  p.inkRing(headPts, 14, Math.PI * 0.6, 0.44);

  // Accessories: White Engineer Hardhat (like reference!) or Airport Earmuffs + Glasses
  if (o.accessory === "earmuffs") {
    const hairPts = ellPts(headCx, headCy - 56, 106, 62, 190, 350, 0, 32);
    p.poly(hairPts, hair, 10);
    p.stroke(ellPts(headCx, headCy - 12, 120, 116, 195, 345, 0, 28), 14);
    p.ell(headCx - 114, headCy + 6, 25, 42, "#ef4444", 10);
    p.ell(headCx + 114, headCy + 6, 25, 42, "#ef4444", 10);
    p.ell(headCx - 114, headCy + 6, 11, 20, "#fde047", 6);
    p.ell(headCx + 114, headCy + 6, 11, 20, "#fde047", 6);
  } else {
    // Crisp White Safety Hardhat (iconic engineering look!)
    const helmPts = ellPts(headCx, headCy - 40, 122, 86, 182, 358, 0, 32);
    p.poly(helmPts, "#f8fafc", 11);
    p.poly(roundedRectPts(headCx - 130, headCy - 52, headCx + 130, headCy - 30, 10), "#e2e8f0", 10);
    p.line([[headCx - 24, headCy - 90], [headCx + 24, headCy - 90]], "#334155", 8, false);
  }

  // Always wear clean round engineer glasses on glasses/inspect/idea/pump
  const eyeY = headCy - 4;
  if (o.accessory === "glasses" || o.pose === "inspect" || o.pose === "idea" || o.pose === "pump") {
    p.ell(headCx - 35, eyeY, 27, 24, "rgba(255,255,255,0.3)", 8);
    p.ell(headCx + 35, eyeY, 27, 24, "rgba(255,255,255,0.3)", 8);
    p.stroke([[headCx - 8, eyeY], [headCx + 8, eyeY]], 8);
  }

  // Eyes + Eyebrows
  if (o.blink > 0.65) {
    p.stroke([[headCx - 48, eyeY], [headCx - 20, eyeY]], 8);
    p.stroke([[headCx + 20, eyeY], [headCx + 48, eyeY]], 8);
  } else if (o.pose === "inspect" || o.pose === "pump") {
    // Effort / squinting eyes like ref_001!
    p.stroke([[headCx - 46, eyeY - 10], [headCx - 22, eyeY], [headCx - 46, eyeY + 10]], 8);
    p.stroke([[headCx + 46, eyeY - 10], [headCx + 22, eyeY], [headCx + 46, eyeY + 10]], 8);
  } else {
    const rEye = o.expr === "shock" ? 13 : 10;
    p.dot(headCx - 34, eyeY, rEye, DEFAULT_INK);
    p.dot(headCx + 34, eyeY, rEye, DEFAULT_INK);
  }

  // Eyebrows
  if (o.expr === "shock") {
    p.stroke(curvePts([headCx - 54, eyeY - 32], [headCx - 34, eyeY - 44], [headCx - 16, eyeY - 30]), 8);
    p.stroke(curvePts([headCx + 16, eyeY - 30], [headCx + 34, eyeY - 44], [headCx + 54, eyeY - 32]), 8);
  } else if (o.expr === "curious" || o.expr === "think") {
    p.stroke([[headCx - 52, eyeY - 28], [headCx - 18, eyeY - 24]], 8);
    p.stroke(curvePts([headCx + 18, eyeY - 32], [headCx + 38, eyeY - 42], [headCx + 54, eyeY - 28]), 8);
  } else {
    p.stroke([[headCx - 48, eyeY - 28], [headCx - 18, eyeY - 30]], 7);
    p.stroke([[headCx + 18, eyeY - 30], [headCx + 48, eyeY - 28]], 7);
  }

  // Mouth
  const mouthY = headCy + 42;
  const openH = 6 + o.talkPulse * 12;
  if (o.expr === "shock") {
    p.ell(headCx, mouthY + 6, 16, 20, "#7f1d1d", 8);
  } else if (o.expr === "smile") {
    p.stroke(curvePts([headCx - 28, mouthY], [headCx, mouthY + 22], [headCx + 28, mouthY]), 9);
  } else if (o.expr === "explain") {
    p.ell(headCx, mouthY + 4, 19, openH, "#7f1d1d", 8);
  } else {
    p.stroke(curvePts([headCx - 22, mouthY + 4], [headCx, mouthY - 2], [headCx + 22, mouthY + 4]), 8);
  }

  // Sweat drops when leaning / straining (just like ref_001!)
  if (o.pose === "inspect" || o.pose === "pump") {
    const dropShift = (o.phase * 36) % 24;
    p.ell(headCx + 118, headCy - 86 + dropShift, 11, 18, "#bae6fd", 6);
    p.ell(headCx + 144, headCy - 52 + dropShift * 0.7, 9, 14, "#bae6fd", 5);
  }
}

/**
 * Draws a colorful supporting Airport Ground Crew Worker (matching ref_003 / ref_005 / ref_014!).
 * Keeps simple silhouette so background crew add lively storytelling & scale without stealing focus.
 */
export function drawCrewWorker(p: Pen, o: CrewWorkerOptions) {
  const skin = o.skinColor ?? "#f2c89f";
  const shirtShadow = shadeColor(o.shirtColor, 0.74);
  const skinShadow = shadeColor(skin, 0.87);

  const bob = Math.abs(Math.sin(o.phase * Math.PI * 2)) * (o.expr === "shock" || o.expr === "laugh" ? 16 : 6);
  const headCx = 300;
  const headCy = 308 - bob;
  const headR = 104;

  // Stick legs grounded cleanly at y = 966
  const soleY = 966;
  const hipY = 678 - bob;
  p.line([[270, hipY], [268, soleY]], "#1e293b", 20, true);
  p.line([[330, hipY], [332, soleY]], "#1e293b", 20, true);
  p.ell(268, soleY, 24, 12, "#451a03", 8);
  p.ell(332, soleY, 24, 12, "#451a03", 8);

  // Arms (shock = hands up / covering ears; smile = wave; watch = relaxed)
  const wave = Math.sin(o.phase * Math.PI * 4) * 22;
  if (o.expr === "shock" || o.armUp) {
    p.line([[226, 488 - bob], [164, 424 - bob], [164, 344 - bob + wave * 0.3]], o.shirtColor, 18, true);
    p.dot(164, 340 - bob + wave * 0.3, 13, DEFAULT_INK);
    p.line([[374, 488 - bob], [436, 424 - bob], [436, 344 - bob - wave * 0.3]], o.shirtColor, 18, true);
    p.dot(436, 340 - bob - wave * 0.3, 13, DEFAULT_INK);
  } else {
    p.line([[226, 488 - bob], [192, 578 - bob], [192, 650 - bob]], o.shirtColor, 18, true);
    p.dot(192, 654 - bob, 12, DEFAULT_INK);
    p.line([[374, 488 - bob], [408, 578 - bob], [408, 650 - bob]], o.shirtColor, 18, true);
    p.dot(408, 654 - bob, 12, DEFAULT_INK);
  }

  // Bean torso
  const torsoPts = superellipsePts(300, 566 - bob, 82, 126, 2.0, 2.35, 44);
  p.gradFill(torsoPts, o.shirtColor, shirtShadow, o.lightAngle);
  p.inkRing(torsoPts, 13, Math.PI * 0.65, 0.42);
  // Subtle shirt buttons
  for (const by of [512, 548, 584]) {
    p.dot(300, by - bob, 6, DEFAULT_INK);
  }

  // Head
  const headPts = superellipsePts(headCx, headCy, headR, headR * 0.92, 1.75, 2.25, 50);
  p.shadedFill(headPts, skin, skinShadow, o.lightAngle, headR);
  p.inkRing(headPts, 13, Math.PI * 0.6, 0.44);

  // Colored safety hardhat
  const helmPts = ellPts(headCx, headCy - 36, 114, 78, 182, 358, 0, 28);
  p.poly(helmPts, o.hatColor, 10);
  p.poly(roundedRectPts(headCx - 120, headCy - 46, headCx + 120, headCy - 26, 10), o.hatColor, 9);

  // Face expression
  const eyeY = headCy - 2;
  if (o.expr === "laugh") {
    p.stroke([[headCx - 48, eyeY - 12], [headCx - 22, eyeY], [headCx - 48, eyeY + 12]], 8);
    p.stroke([[headCx + 48, eyeY - 12], [headCx + 22, eyeY], [headCx + 48, eyeY + 12]], 8);
    p.ell(headCx, headCy + 38, 26, 16, "#7f1d1d", 7);
  } else if (o.blink > 0.7) {
    p.stroke([[headCx - 44, eyeY], [headCx - 20, eyeY]], 8);
    p.stroke([[headCx + 20, eyeY], [headCx + 44, eyeY]], 8);
    p.stroke(curvePts([headCx - 20, headCy + 36], [headCx, headCy + 44], [headCx + 20, headCy + 36]), 8);
  } else if (o.expr === "shock") {
    p.ell(headCx - 30, eyeY, 16, 18, "#ffffff", 7);
    p.ell(headCx + 30, eyeY, 16, 18, "#ffffff", 7);
    p.dot(headCx - 30, eyeY, 7, DEFAULT_INK);
    p.dot(headCx + 30, eyeY, 7, DEFAULT_INK);
    p.ell(headCx, headCy + 42, 16, 20, "#7f1d1d", 7);
  } else if (o.expr === "smile") {
    p.dot(headCx - 30, eyeY, 10, DEFAULT_INK);
    p.dot(headCx + 30, eyeY, 10, DEFAULT_INK);
    p.stroke(curvePts([headCx - 24, headCy + 32], [headCx, headCy + 52], [headCx + 24, headCy + 32]), 8);
  } else {
    p.dot(headCx - 30, eyeY, 9, DEFAULT_INK);
    p.dot(headCx + 30, eyeY, 9, DEFAULT_INK);
    p.stroke([[headCx - 18, headCy + 38], [headCx + 18, headCy + 38]], 8);
  }
}

/** Crisp Episode-001 style '?' curiosity badge drawn with Pen (500x500 canvas). */
export function drawQuestionMarkFx(p: Pen, pulse: number) {
  const s = 1.0 + Math.sin(pulse * Math.PI * 2) * 0.08;
  const cx = 250;
  const cy = 230;
  p.ell(cx, 250, 96 * s, 96 * s, "#fef08a", 14);
  const qCurve = curvePts([cx - 32, cy - 28], [cx, cy - 66], [cx + 34, cy - 28]);
  p.stroke(qCurve, 18);
  p.stroke(curvePts([cx + 34, cy - 28], [cx + 4, cy + 4], [cx, cy + 28]), 18);
  p.dot(cx, cy + 62, 12, DEFAULT_INK);
}

/** Crisp cartoon glowing lightbulb icon (matching ref_005!) drawn with Pen (500x500 canvas). */
export function drawLightbulbFx(p: Pen, pulse: number) {
  const cx = 250;
  const cy = 240;
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const a = -Math.PI * 0.95 + (i / (rays - 1)) * Math.PI * 1.1;
    const r0 = 112;
    const r1 = 158 + Math.sin(pulse * Math.PI * 2 + i) * 14;
    p.line(
      [
        [cx + Math.cos(a) * r0, cy + Math.sin(a) * r0],
        [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1],
      ],
      "#fde047",
      20,
      true
    );
  }
  p.ell(cx, cy, 86, 86, "#fef08a", 14);
  p.poly(roundedRectPts(cx - 40, cy + 72, cx + 40, cy + 124, 12), "#94a3b8", 12);
  p.line([[cx - 26, cy + 98], [cx + 26, cy + 98]], DEFAULT_INK, 8, false);
}

/** Clean subtle comic energy sparks for aha/action moments (matching ref_013 / Ep1). */
export function drawComicSparklesFx(p: Pen, t: number, color = "#fde047") {
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + t * 0.45;
    const r0 = 58 + (t % 1) * 38;
    const r1 = 108 + (t % 1) * 64;
    p.line(
      [
        [250 + Math.cos(a) * r0, 250 + Math.sin(a) * r0],
        [250 + Math.cos(a) * r1, 250 + Math.sin(a) * r1],
      ],
      i % 2 === 0 ? color : "#38bdf8",
      10,
      true
    );
  }
}

export function drawCrossExplosionFx(p: Pen, t: number) {
  drawComicSparklesFx(p, t, "#f97316");
}
export function drawShieldAuraFx(_p: Pen, _t: number) {}
export function drawSmokePuffFx(_p: Pen, _t: number) {}
export function drawPressureArrowsFx(_p: Pen, _t: number) {}
