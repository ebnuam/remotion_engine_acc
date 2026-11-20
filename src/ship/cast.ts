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

  return out;
};
