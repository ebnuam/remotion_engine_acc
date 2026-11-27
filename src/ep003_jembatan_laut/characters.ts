// Reference-grade slender engineer characters & diegetic 2D FX for Ep003: Jembatan Laut.
// Matches the exact mature engineering aesthetic of ref_003 / ref_009:
// - Slender crisp stick legs & arms (NOT bulky childish cartoon tubes)
// - Oval/egg torso + rounded head + crisp safety hardhats + reflective safety vests
// - Minimal expressive faces (deadpan / focused / worried / idea / proud / cheer)

import {
  DEFAULT_INK,
  Pen,
  curvePts,
  ellPts,
  roundedRectPts,
  shadeColor,
  superellipsePts,
} from "../shared/kokisoyo25d";

export interface EngineerStyle {
  shirt: string;
  helmet: string;
  skin: string;
  vest?: boolean; // Orange reflective high-vis vest (Chief Engineer / Foreman)
  tie?: boolean;
}

export type EngineerPose =
  | "stand"
  | "point"
  | "lookUp"
  | "worry"
  | "idea"
  | "climb"
  | "operate"
  | "inspect"
  | "cheer";

export type EngineerExpr = "focused" | "skeptical" | "worried" | "idea" | "proud" | "cheer";

export interface EngineerDrawOpts {
  phase: number;
  pose: EngineerPose;
  expr: EngineerExpr;
  blink: number;
  lightAngle: number;
  clipboard?: boolean;
}

export const CHIEF_ENGINEER: EngineerStyle = {
  shirt: "#eceff4",
  helmet: "#f5f7fa",
  skin: "#f2c6a0",
  vest: true,
  tie: true,
};

export const CREW_STYLES: EngineerStyle[] = [
  { shirt: "#d89a38", helmet: "#f0b932", skin: "#e9bc95" }, // Ochre + Yellow helmet
  { shirt: "#2b899b", helmet: "#f08c2b", skin: "#e5b68c" }, // Teal + Orange helmet
  { shirt: "#3d8b57", helmet: "#e2a930", skin: "#efc49d" }, // Green + Yellow helmet
  { shirt: "#c2443c", helmet: "#e86a2c", skin: "#deb089" }, // Brick Red + Orange helmet
  { shirt: "#6b478a", helmet: "#f2c23e", skin: "#f0c7a2" }, // Purple + Yellow helmet
  { shirt: "#3b6eb5", helmet: "#f4f6f9", skin: "#e7ba92" }, // Blue + White helmet
];

/**
 * Draw a slender ref_003 / ref_009-style civil engineer on the 600x1000 design canvas (soles at y = 968).
 */
export function drawEngineer(p: Pen, st: EngineerStyle, o: EngineerDrawOpts) {
  const INK = "#1b171f";
  const prevInk = p.inkColor;
  p.inkColor = INK;

  const isClimb = o.pose === "climb";
  const isCheer = o.pose === "cheer";
  const bob = isCheer
    ? Math.abs(Math.sin(o.phase * Math.PI * 4)) * 22
    : isClimb
      ? Math.sin(o.phase * Math.PI * 2) * 18
      : Math.sin(o.phase * Math.PI * 2) * 4;

  const cx = 300;
  const soleY = 968;
  const hipY = 678 - bob;
  const torsoCy = 556 - bob;
  const headCy = 326 - bob;

  // 1) Slender stick legs + crisp flat feet (exact ref_003/ref_009 silhouette!)
  const legW = 11;
  if (isClimb) {
    const step = Math.sin(o.phase * Math.PI * 2) * 58;
    p.stroke([[cx - 34, hipY], [cx - 42, 815 + step * 0.5], [cx - 34, soleY - 20 + step]], legW);
    p.stroke([[cx + 34, hipY], [cx + 42, 815 - step * 0.5], [cx + 34, soleY - 20 - step]], legW);
    p.stroke([[cx - 56, soleY - 20 + step], [cx - 16, soleY - 20 + step]], legW);
    p.stroke([[cx + 16, soleY - 20 - step], [cx + 56, soleY - 20 - step]], legW);
  } else {
    const stance = o.pose === "operate" ? 44 : 34;
    const kneeShift = Math.sin(o.phase * Math.PI * 2) * 4;
    p.stroke([[cx - stance, hipY], [cx - stance - kneeShift, 825], [cx - stance, soleY]], legW);
    p.stroke([[cx + stance, hipY], [cx + stance + kneeShift, 825], [cx + stance, soleY]], legW);
    // Crisp flat feet ticks
    p.stroke([[cx - stance - 24, soleY], [cx - stance + 10, soleY]], legW);
    p.stroke([[cx + stance - 10, soleY], [cx + stance + 24, soleY]], legW);
  }

  // 2) Thin stick arms (pose-driven!)
  const shY = torsoCy - 46;
  const armW = 10;
  const sway = Math.sin(o.phase * Math.PI * 2) * 14;

  if (o.pose === "point") {
    // Left arm on hip/clipboard, right arm pointing decisively upward-right
    p.stroke([[cx - 72, shY], [cx - 115, shY + 75], [cx - 78, shY + 135]], armW);
    p.stroke([[cx + 72, shY], [cx + 150, shY - 26 + sway * 0.4], [cx + 218, shY - 76 + sway * 0.5]], armW);
  } else if (o.pose === "idea") {
    // Right arm raised with index finger / idea gesture, left arm resting
    p.stroke([[cx - 72, shY], [cx - 108, shY + 84], [cx - 88, shY + 150]], armW);
    p.stroke([[cx + 72, shY], [cx + 144, shY - 30], [cx + 128, headCy - 18 + sway * 0.4]], armW);
  } else if (o.pose === "worry") {
    // Hands on hips / head tilt
    p.stroke([[cx - 72, shY], [cx - 134, shY + 62], [cx - 82, shY + 122]], armW);
    p.stroke([[cx + 72, shY], [cx + 134, shY + 62], [cx + 82, shY + 122]], armW);
  } else if (o.pose === "cheer") {
    const wave = Math.sin(o.phase * Math.PI * 4) * 28;
    p.stroke([[cx - 72, shY], [cx - 140, shY - 58 + wave], [cx - 178, shY - 132 - wave * 0.4]], armW);
    p.stroke([[cx + 72, shY], [cx + 140, shY - 58 - wave], [cx + 178, shY - 132 + wave * 0.4]], armW);
  } else if (o.pose === "climb") {
    const reach = Math.sin(o.phase * Math.PI * 2) * 55;
    p.stroke([[cx - 72, shY], [cx - 118, shY - 40 - reach], [cx - 95, shY - 110 - reach]], armW);
    p.stroke([[cx + 72, shY], [cx + 118, shY - 40 + reach], [cx + 95, shY - 110 + reach]], armW);
  } else if (o.pose === "operate") {
    const crank = Math.sin(o.phase * Math.PI * 4) * 18;
    p.stroke([[cx - 72, shY], [cx - 132, shY + 34 + crank], [cx - 168, shY + 18 - crank]], armW);
    p.stroke([[cx + 72, shY], [cx + 128, shY + 30 - crank], [cx + 162, shY + 16 + crank]], armW);
  } else if (o.pose === "lookUp" || o.pose === "inspect") {
    p.stroke([[cx - 72, shY], [cx - 108, shY + 72], [cx - 86, shY + 146]], armW);
    p.stroke([[cx + 72, shY], [cx + 122, shY + 12], [cx + 104, headCy + 24]], armW);
  } else {
    // Calm standing / subtle talking gesture
    p.stroke([[cx - 72, shY], [cx - 104, shY + 72], [cx - 96, shY + 148 + sway * 0.4]], armW);
    p.stroke([[cx + 72, shY], [cx + 108, shY + 68], [cx + 102, shY + 142 - sway * 0.4]], armW);
  }

  // 3) Oval / bean torso (exact ref_003/ref_009 proportions: clean oval body)
  const torsoRx = 82;
  const torsoRy = 128;
  const torsoPts = superellipsePts(cx, torsoCy, torsoRx, torsoRy, 2.0, 2.1, 48);
  p.gradFill(torsoPts, st.shirt, shadeColor(st.shirt, 0.78), o.lightAngle);

  // High-vis orange safety vest with silver reflective bands (Chief Engineer signature!)
  if (st.vest) {
    const g = p.g;
    g.save();
    p.path(torsoPts, true);
    g.clip();
    // Orange vest panels on left & right of center shirt opening
    g.fillStyle = "#e86a24";
    g.fillRect(cx - torsoRx - 6, torsoCy - torsoRy - 4, torsoRx - 12, torsoRy * 2 + 8);
    g.fillRect(cx + 18, torsoCy - torsoRy - 4, torsoRx - 12, torsoRy * 2 + 8);
    // Silver reflective safety stripes
    g.fillStyle = "#dce3ec";
    g.fillRect(cx - torsoRx, torsoCy + 28, torsoRx * 2, 22);
    g.fillRect(cx - torsoRx, torsoCy + 64, torsoRx * 2, 16);
    g.fillRect(cx - 52, torsoCy - torsoRy, 18, torsoRy * 2);
    g.fillRect(cx + 34, torsoCy - torsoRy, 18, torsoRy * 2);
    // Subtle center red tie
    if (st.tie) {
      g.fillStyle = "#b82c2c";
      g.beginPath();
      g.moveTo(cx, torsoCy - 92);
      g.lineTo(cx - 10, torsoCy - 20);
      g.lineTo(cx, torsoCy + 14);
      g.lineTo(cx + 10, torsoCy - 20);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
  p.inkRing(torsoPts, 11, Math.PI * 0.65, 0.35);

  // Optional clipboard held in front-left hand
  if (o.clipboard) {
    const cbPts = roundedRectPts(cx - 134, torsoCy - 12, cx - 54, torsoCy + 90, 10);
    p.poly(cbPts, "#8c5c36", 8);
    const paperPts = roundedRectPts(cx - 124, torsoCy + 4, cx - 64, torsoCy + 80, 4);
    p.poly(paperPts, "#f5f4ee", 5);
    p.stroke([[cx - 114, torsoCy + 26], [cx - 74, torsoCy + 26]], 4);
    p.stroke([[cx - 114, torsoCy + 46], [cx - 78, torsoCy + 46]], 4);
    p.stroke([[cx - 114, torsoCy + 64], [cx - 86, torsoCy + 64]], 4);
  }

  // 4) Crisp rounded head with directional shade
  const headRx = 104;
  const headRy = 94;
  const headPts = superellipsePts(cx, headCy, headRx, headRy, 1.9, 2.1, 52);
  p.shadedFill(headPts, st.skin, shadeColor(st.skin, 0.86), o.lightAngle, headRx);
  p.inkRing(headPts, 11, Math.PI * 0.6, 0.35);

  // 5) Hardhat helmet (clean industrial dome + visor brim, ref_003 / ref_009 exact shape!)
  const domePts = ellPts(cx, headCy - 26, headRx + 8, 76, 180, 360, 0, 36);
  domePts.push([cx + headRx + 8, headCy - 20], [cx - headRx - 8, headCy - 20]);
  p.gradFill(domePts, st.helmet, shadeColor(st.helmet, 0.78), o.lightAngle);
  p.poly(domePts, null, 10);

  // Hardhat crown ridge
  p.stroke([[cx, headCy - 100], [cx, headCy - 32]], 7);

  // Hardhat brim
  const brimPts = roundedRectPts(cx - headRx - 22, headCy - 32, cx + headRx + 22, headCy - 14, 9);
  p.poly(brimPts, shadeColor(st.helmet, 0.92), 9);

  // 6) Mature minimal facial features (deadpan dot eyes, zero childish sparkle eyes!)
  const eyeY = o.pose === "lookUp" ? headCy - 2 : headCy + 10;
  if (o.blink > 0.6) {
    p.stroke([[cx - 46, eyeY], [cx - 22, eyeY]], 7);
    p.stroke([[cx + 22, eyeY], [cx + 46, eyeY]], 7);
  } else {
    p.dot(cx - 34, eyeY, 8.5, INK);
    p.dot(cx + 34, eyeY, 8.5, INK);
    // Subtle expressive brows for skeptical / worried / idea
    if (o.expr === "skeptical") {
      p.stroke([[cx - 50, eyeY - 16], [cx - 18, eyeY - 12]], 6);
      p.stroke([[cx + 18, eyeY - 18], [cx + 50, eyeY - 22]], 6);
    } else if (o.expr === "worried") {
      p.stroke([[cx - 50, eyeY - 10], [cx - 20, eyeY - 20]], 6);
      p.stroke([[cx + 20, eyeY - 20], [cx + 50, eyeY - 10]], 6);
    }
  }

  const mouthY = o.pose === "lookUp" ? headCy + 42 : headCy + 48;
  if (o.expr === "cheer" || o.expr === "proud") {
    p.stroke(curvePts([cx - 28, mouthY - 2], [cx, mouthY + 18], [cx + 28, mouthY - 2]), 7);
  } else if (o.expr === "worried") {
    p.stroke(curvePts([cx - 24, mouthY + 10], [cx, mouthY - 6], [cx + 24, mouthY + 10]), 7);
  } else if (o.expr === "idea") {
    p.ell(cx, mouthY + 4, 11, 13, "#3b232a", 6);
  } else if (o.expr === "skeptical") {
    p.stroke([[cx - 22, mouthY + 2], [cx + 20, mouthY - 4]], 7);
  } else {
    p.stroke([[cx - 22, mouthY], [cx + 22, mouthY]], 7);
  }

  p.inkColor = prevInk;
}

/** Realistic water splash ring / foam burst (NOINK soft FX card). */
export function drawWaterSplash(p: Pen, progress: number) {
  const g = p.g;
  const alpha = Math.max(0, 1 - progress * 0.9);
  const cx = 256;
  const cy = 256;
  const r = 48 + progress * 175;
  g.strokeStyle = `rgba(225, 246, 255, ${(alpha * 0.85).toFixed(2)})`;
  g.lineWidth = Math.max(3, 18 * (1 - progress * 0.7));
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();

  g.strokeStyle = `rgba(180, 232, 248, ${(alpha * 0.55).toFixed(2)})`;
  g.lineWidth = Math.max(2, 10 * (1 - progress * 0.6));
  g.beginPath();
  g.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
  g.stroke();
}

/** Dispersing grey wet-concrete cloud washed away by ocean current (Shot 5). */
export function drawConcreteWashout(p: Pen, progress: number) {
  const g = p.g;
  const count = 14;
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + progress * 0.4;
    const driftX = progress * 140 + Math.cos(ang) * (35 + progress * 90);
    const driftY = Math.sin(ang) * (24 + progress * 55) + progress * 35;
    const rad = 28 + (i % 4) * 14 + progress * 24;
    const gr = g.createRadialGradient(180 + driftX, 240 + driftY, 4, 180 + driftX, 240 + driftY, rad);
    const a = Math.max(0.06, 0.48 * (1 - progress * 0.55));
    gr.addColorStop(0, `rgba(155, 162, 166, ${a.toFixed(2)})`);
    gr.addColorStop(1, "rgba(120, 134, 140, 0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(180 + driftX, 240 + driftY, rad, 0, Math.PI * 2);
    g.fill();
  }
}

/** Soft warm floodlight halo glow for night construction shots (Shots 20–21). */
export function drawFloodlightGlow(p: Pen) {
  const g = p.g;
  const gr = g.createRadialGradient(128, 128, 8, 128, 128, 122);
  gr.addColorStop(0, "rgba(255, 246, 214, 0.92)");
  gr.addColorStop(0.28, "rgba(255, 232, 176, 0.45)");
  gr.addColorStop(0.65, "rgba(220, 210, 175, 0.14)");
  gr.addColorStop(1, "rgba(200, 210, 240, 0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
}
