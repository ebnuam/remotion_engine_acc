// Expressive 2.5D Cartoon Character (Prof. Koko) & 2D Comic FX Drawing Library
// Uses Pen from src/shared/kokisoyo25d/canvas2d.ts (zero Unicode emojis, bold variable ink outlines).

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

export interface HostDrawOptions {
  phase: number;
  talkPulse: number; // 0..1 mouth energy
  expr: AutoHostExpr;
  pose: AutoHostPose;
  accessory: AutoHostAccessory;
  blink: number;
  lightAngle: number;
}

/**
 * Draws the Kok Iso Yo? cartoon host on a 600x1000 canvas (soles at y = 968).
 */
export function drawKokoHost(p: Pen, o: HostDrawOptions) {
  const coat = "#2563eb";
  const vest = "#f59e0b";
  const pants = "#1e293b";
  const skin = "#f6c9a2";
  const shoes = "#0f172a";
  const hair = "#1f2937";

  const bob = Math.abs(Math.sin(o.phase * Math.PI * 2)) * 12;
  const sway = Math.sin(o.phase * Math.PI * 2) * 8;
  const headCx = 300 + sway * 0.35;
  const headCy = 298 - bob;
  const headR = 112;

  const coatShadow = shadeColor(coat, 0.72);
  const skinShadow = shadeColor(skin, 0.87);

  // Legs + shoes
  const soleY = 966;
  const hipY = 674 - bob;
  const stance = o.pose === "brace" ? 42 : 28;
  p.line(
    [
      [272, hipY],
      [270 - stance * 0.4, 825],
      [272 - stance, soleY],
    ],
    pants,
    24,
    true
  );
  p.line(
    [
      [328, hipY],
      [330 + stance * 0.4, 825],
      [328 + stance, soleY],
    ],
    pants,
    24,
    true
  );
  p.ell(278 - stance, soleY, 28, 14, shoes, 9);
  p.ell(336 + stance, soleY, 28, 14, shoes, 9);

  // Back arm
  const armWave = Math.sin(o.phase * Math.PI * 4) * 28;
  if (o.pose === "wave" || o.pose === "brace") {
    p.line(
      [
        [226, 472 - bob],
        [165, 420 - bob + armWave * 0.4],
        [136, 336 - bob + armWave],
      ],
      coat,
      22,
      true
    );
    p.ell(134, 332 - bob + armWave, 18, 18, skin, 9);
  } else {
    p.line(
      [
        [226, 472 - bob],
        [192, 570 - bob],
        [188, 650 - bob],
      ],
      coat,
      22,
      true
    );
    p.ell(188, 654 - bob, 16, 16, skin, 8);
  }

  // Torso (jacket + high-contrast vest stripe)
  const torsoPts = superellipsePts(300, 562 - bob, 92, 138, 2.0, 2.35, 48);
  p.gradFill(torsoPts, coat, coatShadow, o.lightAngle);
  p.inkRing(torsoPts, 13, Math.PI * 0.65, 0.4);

  // Yellow-amber science badge / vest panel
  const badgePts = roundedRectPts(268, 494 - bob, 332, 620 - bob, 16);
  p.poly(badgePts, vest, 8);
  p.ell(300, 554 - bob, 16, 16, "#fffdf7", 6);

  // Front arm (pose-driven)
  if (o.pose === "point") {
    p.line(
      [
        [374, 472 - bob],
        [445, 438 - bob],
        [512, 386 - bob + Math.sin(o.phase * Math.PI * 2) * 10],
      ],
      coat,
      22,
      true
    );
    p.ell(518, 384 - bob + Math.sin(o.phase * Math.PI * 2) * 10, 18, 16, skin, 8);
  } else if (o.pose === "thumbs_up") {
    p.line(
      [
        [374, 474 - bob],
        [448, 492 - bob],
        [478, 412 - bob],
      ],
      coat,
      22,
      true
    );
    p.ell(480, 404 - bob, 20, 18, skin, 8);
    p.line(
      [
        [480, 392 - bob],
        [480, 360 - bob],
      ],
      skin,
      14,
      true
    );
  } else if (o.pose === "brace") {
    p.line(
      [
        [374, 472 - bob],
        [436, 424 - bob],
        [462, 344 - bob],
      ],
      coat,
      22,
      true
    );
    p.ell(464, 340 - bob, 18, 18, skin, 8);
  } else {
    p.line(
      [
        [374, 472 - bob],
        [414, 558 - bob],
        [424, 624 - bob + armWave * 0.25],
      ],
      coat,
      22,
      true
    );
    p.ell(426, 628 - bob + armWave * 0.25, 16, 16, skin, 8);
  }

  // Head
  const headPts = superellipsePts(headCx, headCy, headR, headR * 0.94, 1.75, 2.25, 56);
  p.shadedFill(headPts, skin, skinShadow, o.lightAngle, headR);
  p.inkRing(headPts, 14, Math.PI * 0.6, 0.45);

  // Hair cap
  const hairPts = ellPts(headCx, headCy - 56, 108, 64, 190, 350, 0, 32);
  p.poly(hairPts, hair, 10);

  // Accessories
  if (o.accessory === "earmuffs") {
    // Airport safety earmuffs (vibrant red-orange)
    p.stroke(ellPts(headCx, headCy - 12, 122, 118, 195, 345, 0, 28), 14);
    p.ell(headCx - 116, headCy + 6, 26, 44, "#ef4444", 10);
    p.ell(headCx + 116, headCy + 6, 26, 44, "#ef4444", 10);
    p.ell(headCx - 116, headCy + 6, 12, 22, "#fde047", 6);
    p.ell(headCx + 116, headCy + 6, 12, 22, "#fde047", 6);
  } else if (o.accessory === "helmet") {
    const helmPts = ellPts(headCx, headCy - 44, 122, 82, 185, 355, 0, 32);
    p.poly(helmPts, "#facc15", 11);
    p.poly(roundedRectPts(headCx - 126, headCy - 56, headCx + 126, headCy - 34, 10), "#eab308", 9);
  } else if (o.accessory === "glasses") {
    p.ell(headCx - 38, headCy - 8, 30, 26, "rgba(255,255,255,0.45)", 9);
    p.ell(headCx + 38, headCy - 8, 30, 26, "rgba(255,255,255,0.45)", 9);
    p.stroke(
      [
        [headCx - 8, headCy - 8],
        [headCx + 8, headCy - 8],
      ],
      8
    );
  }

  // Eyes + Eyebrows
  const eyeY = headCy - 8;
  if (o.blink > 0.65) {
    p.stroke(
      [
        [headCx - 52, eyeY],
        [headCx - 22, eyeY],
      ],
      9
    );
    p.stroke(
      [
        [headCx + 22, eyeY],
        [headCx + 52, eyeY],
      ],
      9
    );
  } else {
    const rEye = o.expr === "shock" ? 15 : 11;
    p.dot(headCx - 36, eyeY, rEye, DEFAULT_INK);
    p.dot(headCx + 36, eyeY, rEye, DEFAULT_INK);
    p.dot(headCx - 32, eyeY - 4, 4, "#ffffff");
    p.dot(headCx + 40, eyeY - 4, 4, "#ffffff");
  }

  // Eyebrows
  if (o.expr === "shock") {
    p.stroke(curvePts([headCx - 58, eyeY - 36], [headCx - 36, eyeY - 48], [headCx - 16, eyeY - 34]), 8);
    p.stroke(curvePts([headCx + 16, eyeY - 34], [headCx + 36, eyeY - 48], [headCx + 58, eyeY - 36]), 8);
  } else if (o.expr === "curious" || o.expr === "think") {
    p.stroke(
      [
        [headCx - 54, eyeY - 30],
        [headCx - 18, eyeY - 26],
      ],
      8
    );
    p.stroke(curvePts([headCx + 18, eyeY - 34], [headCx + 38, eyeY - 44], [headCx + 56, eyeY - 30]), 8);
  } else {
    p.stroke(
      [
        [headCx - 52, eyeY - 30],
        [headCx - 20, eyeY - 32],
      ],
      7
    );
    p.stroke(
      [
        [headCx + 20, eyeY - 32],
        [headCx + 52, eyeY - 30],
      ],
      7
    );
  }

  // Mouth (animated gently with talkPulse)
  const mouthY = headCy + 42;
  const openH = 6 + o.talkPulse * 14;
  if (o.expr === "shock") {
    p.ell(headCx, mouthY + 6, 18, 22, "#7f1d1d", 8);
  } else if (o.expr === "smile") {
    p.poly(
      [
        ...curvePts([headCx - 34, mouthY], [headCx, mouthY + 26 + openH * 0.4], [headCx + 34, mouthY]),
        [headCx - 34, mouthY],
      ],
      "#ffffff",
      8
    );
  } else if (o.expr === "explain") {
    p.ell(headCx, mouthY + 4, 22, openH, "#7f1d1d", 8);
  } else if (o.expr === "curious") {
    p.ell(headCx + 6, mouthY + 6, 12, 10 + o.talkPulse * 6, "#7f1d1d", 7);
  } else {
    p.stroke(curvePts([headCx - 24, mouthY + 4], [headCx, mouthY - 2], [headCx + 24, mouthY + 4]), 8);
  }
}

/** Bold red comic question mark billboard (500x500 canvas). */
export function drawQuestionMarkFx(p: Pen, pulse: number) {
  const s = 1 + Math.sin(pulse * Math.PI * 2) * 0.08;
  const cx = 250;
  const cy = 230;
  p.g.save();
  p.g.translate(cx, cy);
  p.g.scale(s, s);
  p.g.translate(-cx, -cy);
  const arc = ellPts(cx, 170, 74, 68, 195, 430, 0, 28);
  p.line([...arc, [cx, 255], [cx, 310]], "#ef4444", 54, true);
  p.line([...arc, [cx, 255], [cx, 310]], "#facc15", 22, false);
  p.ell(cx, 388, 30, 30, "#ef4444", 12);
  p.g.restore();
}

/** Comic explosion with bold red cross-out ("bukan meledak!"). */
export function drawCrossExplosionFx(p: Pen, t: number) {
  const cx = 250;
  const cy = 250;
  const spikes = 12;
  const pts: [number, number][] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 + t * 0.25;
    const r = i % 2 === 0 ? 185 : 95;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  p.poly(pts, "#fb923c", 12);
  p.ell(cx, cy, 78, 78, "#fef08a", 8);
  // Crisp red X crossing out the explosion
  p.line(
    [
      [95, 95],
      [405, 405],
    ],
    "#dc2626",
    34,
    true
  );
  p.line(
    [
      [405, 95],
      [95, 405],
    ],
    "#dc2626",
    34,
    true
  );
}

/** Radial comic burst / speedlines / sparkles. */
export function drawComicSparklesFx(p: Pen, t: number, color = "#fde047") {
  const rays = 10;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + t * 0.4;
    const r0 = 75 + ((t * 90) % 55);
    const r1 = r0 + 85;
    p.line(
      [
        [250 + Math.cos(a) * r0, 250 + Math.sin(a) * r0],
        [250 + Math.cos(a) * r1, 250 + Math.sin(a) * r1],
      ],
      color,
      18,
      true
    );
  }
}

/** Translucent glowing blue protective shield arc. */
export function drawShieldAuraFx(p: Pen, t: number) {
  const pulse = 1 + Math.sin(t * Math.PI * 3) * 0.05;
  const r = 185 * pulse;
  p.ell(250, 250, r, r, "rgba(56, 189, 248, 0.24)", 14);
  p.stroke(ellPts(250, 250, r * 0.82, r * 0.82, 200, 340, 0, 28), 10);
}

/** Soft comic smoke puff cloud. */
export function drawSmokePuffFx(p: Pen, t: number) {
  const drift = (t * 45) % 40;
  p.ell(190 - drift, 280, 92, 74, "#f8fafc", 10);
  p.ell(285 - drift * 0.7, 250, 108, 86, "#ffffff", 10);
  p.ell(350 - drift * 0.4, 292, 82, 66, "#e2e8f0", 10);
}

/** Outward comic pressure arrows ring. */
export function drawPressureArrowsFx(p: Pen, t: number) {
  const dirs = 8;
  const shift = Math.sin(t * Math.PI * 4) * 14;
  for (let i = 0; i < dirs; i++) {
    const a = (i / dirs) * Math.PI * 2;
    const r0 = 110 + shift;
    const r1 = 195 + shift;
    const x0 = 250 + Math.cos(a) * r0;
    const y0 = 250 + Math.sin(a) * r0;
    const x1 = 250 + Math.cos(a) * r1;
    const y1 = 250 + Math.sin(a) * r1;
    p.line(
      [
        [x0, y0],
        [x1, y1],
      ],
      "#38bdf8",
      18,
      true
    );
    const leftA = a + 2.55;
    const rightA = a - 2.55;
    p.poly(
      [
        [x1, y1],
        [x1 + Math.cos(leftA) * 32, y1 + Math.sin(leftA) * 32],
        [x1 + Math.cos(rightA) * 32, y1 + Math.sin(rightA) * 32],
      ],
      "#fde047",
      8
    );
  }
}
