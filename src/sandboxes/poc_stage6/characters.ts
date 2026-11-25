// 2D Canvas character & VFX drawing for Stage 6 PoC ("Rahasia Klorofil")

import {
  DEFAULT_INK,
  Pen,
  curvePts,
  ellPts,
  roundedRectPts,
  shadeColor,
  superellipsePts,
} from "../../shared/kokisoyo25d";

export interface ResearcherStyle {
  coat: string;
  pants: string;
  skin: string;
  shoes: string;
  hatColor?: string;
  glasses?: boolean;
  magnifier?: boolean;
}

export type Expr = "curious" | "shock" | "smile";

export interface ResearcherOpts {
  phase: number;
  expr: Expr;
  blink: number;
  lightAngle: number;
  pointRight?: boolean;
}

/**
 * Draw expressive 2D cartoon explorer/student with bright readable face shading
 * and bold variable-width ink outline tuned to match cartoon-3d-short reference sheets.
 */
export function drawResearcher(p: Pen, st: ResearcherStyle, o: ResearcherOpts) {
  const bob = Math.abs(Math.sin(o.phase * Math.PI * 2)) * 12;
  const step = Math.sin(o.phase * Math.PI * 2) * 32;
  const headR = 112;
  const headCx = 300;
  const headCy = 305 - bob;

  const coatShadow = shadeColor(st.coat, 0.7);
  const skinShadow = shadeColor(st.skin, 0.87);

  // Legs + shoes grounded near y=968
  const soleY = 968;
  const hipY = 676 - bob;
  p.line([[272, hipY], [272 - step * 0.5, 825], [272 - step, soleY]], st.pants, 22, true);
  p.line([[328, hipY], [328 + step * 0.5, 825], [328 + step, soleY]], st.pants, 22, true);
  p.ell(278 - step, soleY, 27, 13, st.shoes, 8);
  p.ell(334 + step, soleY, 27, 13, st.shoes, 8);

  // Back arm
  const armWave = Math.sin(o.phase * Math.PI * 2) * 20;
  p.line([[228, 470 - bob], [192, 565 - bob - armWave * 0.4], [182, 640 - bob]], st.coat, 20, true);
  p.dot(182, 644 - bob, 14, DEFAULT_INK);

  // Torso bean with directional gradient & thick ink ring
  const torsoPts = superellipsePts(300, 565 - bob, 88, 134, 2.0, 2.4, 48);
  p.gradFill(torsoPts, st.coat, coatShadow, o.lightAngle);
  p.inkRing(torsoPts, 14, Math.PI * 0.65, 0.42);

  // Subtle neck + collar anchored cleanly inside upper chest
  p.line([[300, headCy + headR * 0.82], [300, 444 - bob]], st.skin, 20, true);
  p.line([[264, 456 - bob], [300, 492 - bob], [336, 456 - bob]], "#fef3c7", 11, true);

  // Front arm (either holding magnifier or pointing toward floating photons)
  if (st.magnifier) {
    const gx = 442;
    const gy = 485 - bob - armWave * 0.5;
    p.line([[370, 476 - bob], [412, 540 - bob], [gx - 18, gy + 36]], st.coat, 20, true);
    p.line([[gx - 18, gy + 36], [gx - 6, gy + 16]], "#78350f", 14, true);
    p.ell(gx, gy, 34, 34, "#bfdbfe", 9);
  } else if (o.pointRight) {
    p.line([[370, 476 - bob], [426, 446 - bob - armWave * 0.4], [464, 402 - bob]], st.coat, 20, true);
    p.dot(464, 402 - bob, 14, DEFAULT_INK);
  } else {
    p.line([[370, 476 - bob], [406, 565 - bob + armWave * 0.4], [414, 638 - bob]], st.coat, 20, true);
    p.dot(414, 638 - bob, 14, DEFAULT_INK);
  }

  // Head
  const headPts = superellipsePts(headCx, headCy, headR, headR * 0.94, 1.75, 2.3, 56);
  p.shadedFill(headPts, st.skin, skinShadow, o.lightAngle, headR);
  p.inkRing(headPts, 15, Math.PI * 0.6, 0.44);

  // Cap / Sun visor
  if (st.hatColor) {
    const crown = roundedRectPts(headCx - 86, headCy - 126, headCx + 86, headCy - 66, 24);
    p.poly(crown, st.hatColor, 11);
    p.stroke([[headCx - 98, headCy - 68], [headCx + 108, headCy - 68]], 14);
  }

  // Eyes & eyebrows
  const eyeY = headCy - 8;
  if (o.blink > 0.6) {
    p.stroke([[headCx - 50, eyeY], [headCx - 20, eyeY]], 8);
    p.stroke([[headCx + 20, eyeY], [headCx + 50, eyeY]], 8);
  } else {
    const rEye = o.expr === "shock" ? 13 : 10;
    p.dot(headCx - 34, eyeY, rEye, DEFAULT_INK);
    p.dot(headCx + 34, eyeY, rEye, DEFAULT_INK);
    p.stroke([[headCx - 52, eyeY - 26], [headCx - 16, eyeY - (o.expr === "curious" ? 32 : 26)]], 7);
    p.stroke([[headCx + 16, eyeY - (o.expr === "curious" ? 22 : 26)], [headCx + 52, eyeY - 28]], 7);
  }

  if (st.glasses) {
    p.ell(headCx - 35, eyeY, 27, 23, "rgba(255,255,255,0.22)", 7);
    p.ell(headCx + 35, eyeY, 27, 23, "rgba(255,255,255,0.22)", 7);
    p.stroke([[headCx - 8, eyeY], [headCx + 8, eyeY]], 7);
  }

  // Mouth
  const mouthY = headCy + 45;
  if (o.expr === "smile") {
    p.stroke(curvePts([headCx - 28, mouthY], [headCx, mouthY + 20], [headCx + 28, mouthY]), 8);
  } else if (o.expr === "shock") {
    p.ell(headCx, mouthY + 6, 15, 20, "#7f1d1d", 7);
  } else {
    p.stroke(curvePts([headCx - 22, mouthY + 4], [headCx, mouthY - 3], [headCx + 22, mouthY + 4]), 8);
  }
}

/** 2D glowing emerald/gold energy spark burst (NOINK billboard). */
export function drawChlorophyllSparks(p: Pen, progress: number) {
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + progress * 0.45;
    const r0 = 55 + progress * 45;
    const r1 = 105 + progress * 75;
    p.line(
      [
        [250 + Math.cos(a) * r0, 250 + Math.sin(a) * r0],
        [250 + Math.cos(a) * r1, 250 + Math.sin(a) * r1],
      ],
      i % 2 === 0 ? "#4ade80" : "#fef08a",
      9,
      true
    );
  }
}
