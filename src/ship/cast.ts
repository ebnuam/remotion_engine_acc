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
  SKIN,
  INK,
} from "../bridge/toon";
import { Pool, Actor, Fx, SU } from "../bridge/cast";
import { nailStateAt, NAIL_DROP_F, NAIL_SPLASH_F } from "./story";

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
  // Gold anchor badge on cap band
  p.ell(cx, cy - 25, 12, 10, "#fbbf24", 2);
  // White crown top
  p.ell(cx, cy - 50, 48, 22, "#f8fafc", 4);
  // Shiny black visor
  p.ell(cx, cy - 10, 52, 14, "#0f172a", 2);
};

export const stageShip = (
  shotId: number,
  f: number,
  camPos: THREE.Vector3
): ShipStage => {
  const out: ShipStage = { places: [], fx: [] };

  // Only Shot 2 features the presenter on the pier/deck dropping the nail
  if (shotId === 2) {
    const nailState = nailStateAt(f);

    // Dynamic Captain expression based on nail state
    let expr: Expr = "smile";
    let blink = false;

    if (f < NAIL_DROP_F) {
      // Explaining the premise
      expr = "smile";
      blink = (f >= 132 && f <= 135);
    } else if (f < NAIL_SPLASH_F) {
      // Watching the nail drop
      expr = "nervous";
      blink = (f >= 152 && f <= 155);
    } else {
      // Iron nail sank straight like a stone!
      expr = "shock";
      blink = (f >= 190 && f <= 193);
    }

    const captainPos = { x: 9.8, y: 3.5, z: 0.0 };

    const fo: FrontOpts = {
      mode: "stand",
      expr,
      blink,
      facing: -1, // Facing slightly left towards the water
      look: f >= NAIL_DROP_F && f < NAIL_SPLASH_F + 15 ? -0.8 : -0.2, // Looking down at falling nail
    };

    const key = `capt|${expr}|${blink ? "b" : "o"}|${f < NAIL_DROP_F ? "hold" : "drop"}`;

    out.places.push({
      key,
      x: captainPos.x,
      y: captainPos.y,
      z: captainPos.z,
      scale: 1.05,
      mirror: false,
      yaw: -0.4, // Angled slightly towards the water edge
      size: [720, 1200, 1.2],
      draw: (p) => {
        bodyFront(p, CAPTAIN, fo);
        // Add extra gold buttons & stripes
        p.dot(300, 480, 8, "#fbbf24");
        p.dot(300, 540, 8, "#fbbf24");
        p.dot(300, 600, 8, "#fbbf24");
        drawCaptainCap(p, 300, 260);
      },
    });

    // Contact shadow blob on the wooden pier deck under feet
    const shadowColor = "#2d2338";
    out.fx.push({
      key: `blob|contact|capt`,
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
      key: `blob|tail|capt`,
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

    // Water Splash Effect Card when nail hits water
    if (nailState.splashT > 0 && nailState.splashT < 1) {
      const u = nailState.splashT;
      const splashSize = 2.4 * Math.sin(u * Math.PI);
      out.fx.push({
        key: `splash|${Math.round(u * 20)}`,
        cw: 800,
        ch: 800,
        draw: (p) => fxSplash(p, u),
        x: nailState.pos[0],
        y: 0.45 * Math.sin(u * Math.PI), // Sits right on the sea surface y=0
        z: nailState.pos[2],
        w: splashSize,
        h: splashSize,
        soft: false,
      });
    }
  }

  return out;
};
