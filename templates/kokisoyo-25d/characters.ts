// Canvas2D character & prop drawing library for Kok Iso Yo? 2.5D-in-3D episodes.
// Uses Pen from src/shared/kokisoyo25d/canvas2d.ts (600x1000 design canvas, soles at y = 975).

import {
  DEFAULT_INK,
  Pen,
  curvePts,
  ellPts,
  roundedRectPts,
  shadeColor,
  superellipsePts,
} from "../../src/shared/kokisoyo25d";

export interface CharacterStyle {
  coat: string;
  pants: string;
  skin: string;
  shoes: string;
  accent?: string;
}

export type Expr = "neutral" | "smile" | "curious" | "shock";

export interface DrawOpts {
  phase: number;
  expr: Expr;
  blink: number; // 0 = open, 1 = shut
  lightAngle: number; // canvas angle in radians
  lean?: number; // subtle forward/back tilt in radians
}

/**
 * Draw a friendly 2D cartoon narrator/scientist character on the 600x1000 design space.
 * Features superellipse head, bean torso, variable-width ink outline, and shaded form.
 */
export function drawCartoonCharacter(p: Pen, st: CharacterStyle, o: DrawOpts) {
  const bob = Math.abs(Math.sin(o.phase * Math.PI * 2)) * 14;
  const stride = Math.sin(o.phase * Math.PI * 2) * 52;
  const headR = 114;
  const headCx = 300;
  const headCy = 308 - bob;
  const torsoShadow = shadeColor(st.coat, 0.72);
  const skinShadow = shadeColor(st.skin, 0.88);

  // Legs (single thick stroke with ink-dot shoes)
  const soleY = 968;
  const hipY = 675 - bob;
  p.line([[270, hipY], [270 - stride * 0.6, 825], [270 - stride, soleY]], st.pants, 22, true);
  p.line([[330, hipY], [330 + stride * 0.6, 825], [330 + stride, soleY]], st.pants, 22, true);
  p.ell(276 - stride, soleY, 26, 13, st.shoes, 8);
  p.ell(336 + stride, soleY, 26, 13, st.shoes, 8);

  // Back arm
  const armSwing = Math.sin(o.phase * Math.PI * 2) * 32;
  p.line([[228, 468 - bob], [200 - armSwing * 0.4, 570 - bob], [194 - armSwing, 645 - bob]], st.coat, 20, true);
  p.dot(194 - armSwing, 648 - bob, 14, DEFAULT_INK);

  // Bean torso with directional gradient + variable-width ink ring
  const torsoPts = superellipsePts(300, 565 - bob, 88, 135, 2.0, 2.4, 48);
  p.gradFill(torsoPts, st.coat, torsoShadow, o.lightAngle);
  p.inkRing(torsoPts, 13, Math.PI * 0.65, 0.4);

  // Front arm
  p.line([[372, 468 - bob], [402 + armSwing * 0.4, 570 - bob], [408 + armSwing, 645 - bob]], st.coat, 20, true);
  p.dot(408 + armSwing, 648 - bob, 14, DEFAULT_INK);

  // Superellipse head with shaded crescent + variable-width ink ring
  const headPts = superellipsePts(headCx, headCy, headR, headR * 0.94, 1.75, 2.3, 56);
  p.shadedFill(headPts, st.skin, skinShadow, o.lightAngle, headR);
  p.inkRing(headPts, 14, Math.PI * 0.6, 0.45);

  // Hair / cap accent
  if (st.accent) {
    const capPts = roundedRectPts(headCx - 82, headCy - 120, headCx + 82, headCy - 66, 20);
    p.poly(capPts, st.accent, 10);
  }

  // Facial expression (deadpan / clear eyes, blink-aware)
  const eyeY = headCy - 10;
  if (o.blink > 0.6) {
    p.stroke([[headCx - 48, eyeY], [headCx - 22, eyeY]], 8);
    p.stroke([[headCx + 22, eyeY], [headCx + 48, eyeY]], 8);
  } else {
    const rEye = o.expr === "shock" ? 13 : 10;
    p.dot(headCx - 35, eyeY, rEye, DEFAULT_INK);
    p.dot(headCx + 35, eyeY, rEye, DEFAULT_INK);
  }

  // Mouth
  const mouthY = headCy + 44;
  if (o.expr === "smile") {
    p.stroke(curvePts([headCx - 28, mouthY], [headCx, mouthY + 18], [headCx + 28, mouthY]), 8);
  } else if (o.expr === "shock") {
    p.ell(headCx, mouthY + 6, 16, 20, "#5a1e28", 7);
  } else if (o.expr === "curious") {
    p.stroke(curvePts([headCx - 22, mouthY + 4], [headCx, mouthY - 4], [headCx + 22, mouthY + 4]), 8);
  } else {
    p.stroke([[headCx - 22, mouthY], [headCx + 22, mouthY]], 8);
  }
}

/** Simple 2D icon burst effect (NOINK card). */
export function drawSparkBurst(p: Pen, progress: number) {
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const r0 = 50 + progress * 40;
    const r1 = 110 + progress * 90;
    p.line(
      [
        [250 + Math.cos(a) * r0, 250 + Math.sin(a) * r0],
        [250 + Math.cos(a) * r1, 250 + Math.sin(a) * r1],
      ],
      "#fde047",
      16,
      true
    );
  }
}
