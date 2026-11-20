import * as THREE from "three";
import {
  Pen,
  bodyFront,
  Outfit,
  Expr,
  FrontOpts,
  fxContact,
  fxShadow,
  fxSplash,
} from "../bridge/toon";
import { Pool, Actor, Fx } from "../bridge/cast";
import { coinStateAt, steelBlockStateAt } from "./story";

export { Pool, Actor, Fx };

export type Place = {
  key: string;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  scale?: number;
  mirror?: boolean;
  yaw?: number;
  roll?: number;
  size?: [number, number, number];
};

export type FxPlace = {
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
  rot?: number;
  soft?: boolean;
};

export type ShipStage = {
  places: Place[];
  fx: FxPlace[];
};

// Captain Outfit
export const CAPTAIN: Outfit = {
  jacket: "#1e3a8a", // Navy blue captain coat
  pants: "#1e293b", // Dark navy trousers
  boots: "#0f172a", // Polished black boots
  hat: "cap", // Captain's peaked cap
  cap: "#1e3a8a",
  buttons: "#fbbf24", // Gold brass buttons
  skin: "#f5c9a0",
  moustache: "#334155",
  build: "adult",
};

/** Draw custom captain hat details on top of standard head */
const drawCaptainCap = (p: Pen, cx: number, cy: number) => {
  p.ell(cx, cy - 25, 12, 10, "#fbbf24", 2); // Gold anchor badge
  p.ell(cx, cy - 50, 48, 22, "#f8fafc", 4); // White crown top
  p.ell(cx, cy - 10, 52, 14, "#0f172a", 2); // Shiny black visor
};

export const stageShip = (
  shotId: number,
  f: number,
  _camPos: THREE.Vector3
): ShipStage => {
  const out: ShipStage = { places: [], fx: [] };

  // ---- Shot 1: Sinking Gold Coin Splash ----
  if (shotId === 1 && f < 111) {
    const cs = coinStateAt(f);
    if (cs.splashT > 0 && cs.splashT < 1) {
      const u = cs.splashT;
      const splashSize = 2.4 * Math.sin(u * Math.PI);
      out.fx.push({
        key: `coin_splash|${Math.round(u * 20)}`,
        cw: 800,
        ch: 800,
        draw: (p) => fxSplash(p, u),
        x: cs.pos[0],
        y: 0.3 * Math.sin(u * Math.PI),
        z: cs.pos[2],
        w: splashSize,
        h: splashSize,
        soft: false,
      });
    }
  }

  // ---- Shot 2: Deck Presenter (Captain) ----
  if (shotId === 2) {
    let expr: Expr = "smile";
    if (f < 450) {
      expr = "neutral";
    } else if (f < 560) {
      expr = "smile";
    } else {
      expr = "grin";
    }

    const blink = (f % 105 >= 0 && f % 105 <= 3);
    const captainPos = { x: 9.8, y: 3.5, z: 0.0 };

    const fo: FrontOpts = {
      mode: "stand",
      expr,
      blink,
      facing: -1,
      look: -0.2,
    };

    const key = `capt_ep1|${expr}|${blink ? "b" : "o"}|${Math.floor(f / 30)}`;

    out.places.push({
      key,
      x: captainPos.x,
      y: captainPos.y,
      z: captainPos.z,
      scale: 1.05,
      mirror: false,
      yaw: -0.35,
      size: [720, 1200, 1.2],
      draw: (p) => {
        bodyFront(p, CAPTAIN, fo);
        p.dot(300, 480, 8, "#fbbf24");
        p.dot(300, 540, 8, "#fbbf24");
        p.dot(300, 600, 8, "#fbbf24");
        drawCaptainCap(p, 300, 260);
      },
    });

    // Contact shadow
    const shadowColor = "#2d2338";
    out.fx.push({
      key: `blob|contact|capt2`,
      cw: 128,
      ch: 128,
      draw: (p) => fxContact(p, shadowColor),
      x: captainPos.x - 0.05,
      y: captainPos.y + 0.02,
      z: captainPos.z - 0.05,
      w: 0.8,
      h: 0.6,
      flat: true,
      rot: 0,
    });

    out.fx.push({
      key: `blob|tail|capt2`,
      cw: 128,
      ch: 256,
      draw: (p) => fxShadow(p, shadowColor),
      x: captainPos.x + 0.35,
      y: captainPos.y + 0.015,
      z: captainPos.z + 0.25,
      w: 1.0,
      h: 1.8,
      flat: true,
      rot: 0.6,
    });
  }

  // ---- Shot 3: Solid Steel Block Plunge Splash ----
  if (shotId === 3 && f < 845) {
    const sb = steelBlockStateAt(f);
    if (sb.splashT > 0 && sb.splashT < 1) {
      const u = sb.splashT;
      const splashSize = 5.8 * Math.sin(u * Math.PI);
      out.fx.push({
        key: `steel_splash|${Math.round(u * 20)}`,
        cw: 800,
        ch: 800,
        draw: (p) => fxSplash(p, u),
        x: sb.pos[0],
        y: 0.6 * Math.sin(u * Math.PI),
        z: sb.pos[2],
        w: splashSize,
        h: splashSize,
        soft: false,
      });
    }
  }

  // ---- Shot 5: Heroic Outro (Captain Waving) ----
  if (shotId === 5) {
    const wave = Math.sin((f - 1680) * 0.35);
    const blink = (f % 95 >= 0 && f % 95 <= 3);
    const captainPos = { x: 8.5, y: 3.5, z: -2.0 };

    const fo: FrontOpts = {
      mode: "stand",
      expr: "laugh",
      blink,
      facing: -1,
      wave,
    };

    const key = `capt_outro|${Math.round(wave * 5)}|${blink ? "b" : "o"}`;

    out.places.push({
      key,
      x: captainPos.x,
      y: captainPos.y,
      z: captainPos.z,
      scale: 1.1,
      mirror: false,
      yaw: -0.4,
      size: [720, 1200, 1.2],
      draw: (p) => {
        bodyFront(p, CAPTAIN, fo);
        p.dot(300, 480, 8, "#fbbf24");
        p.dot(300, 540, 8, "#fbbf24");
        p.dot(300, 600, 8, "#fbbf24");
        drawCaptainCap(p, 300, 260);
      },
    });

    const shadowColor = "#2d2338";
    out.fx.push({
      key: `blob|contact|capt5`,
      cw: 128,
      ch: 128,
      draw: (p) => fxContact(p, shadowColor),
      x: captainPos.x - 0.05,
      y: captainPos.y + 0.02,
      z: captainPos.z - 0.05,
      w: 0.85,
      h: 0.65,
      flat: true,
      rot: 0,
    });
  }

  return out;
};
