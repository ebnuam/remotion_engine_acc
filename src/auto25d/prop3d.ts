// High-Craft Living Airport & Maintenance Hangar 3D World + Cause-and-Effect Hero Assemblies
// 100% spatially coherent along the Z-axis (runway, jetliner, tires, service roads, moving airport vehicles,
// terminal + jetbridges, ATC tower, city skyline, open maintenance hangar with yellow scaffolding & ladder).

import * as THREE from "three";
import {
  NOINK,
  StaticBatch,
  addBushCluster,
  addRockCluster,
  addStorybookTree,
  cobbleHD,
  createMaterialCache,
  ctex,
  grassHD,
  stoneHD,
} from "../shared/kokisoyo25d";
import type { AutoEnvTheme, AutoHeroProp } from "./types";

// ============================================================================
// 1. PROCEDURAL CANVASTEXTURES (Crisp Stylized-3D Albedos)
// ============================================================================

function makeWeatheredRunwayTex(): THREE.CanvasTexture {
  return ctex("auto25d_runway_v4", 512, 512, (g) => {
    g.fillStyle = "#3f4754";
    g.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 2000; i++) {
      const x = (i * 97) % 512;
      const y = (i * 193) % 512;
      g.fillStyle = i % 3 === 0 ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.08)";
      g.fillRect(x, y, 2 + (i % 3), 2 + (i % 2));
    }

    // Touchdown rubber tracks along Z
    for (const cx of [185, 327]) {
      const grad = g.createLinearGradient(cx - 32, 0, cx + 32, 0);
      grad.addColorStop(0, "rgba(15,23,42,0)");
      grad.addColorStop(0.5, "rgba(15,23,42,0.28)");
      grad.addColorStop(1, "rgba(15,23,42,0)");
      g.fillStyle = grad;
      g.fillRect(cx - 32, 0, 64, 512);
    }

    // Crisp white edge lines + bold dashed centerline along Z
    g.fillStyle = "#f1f5f9";
    g.fillRect(26, 0, 14, 512);
    g.fillRect(472, 0, 14, 512);
    g.fillRect(245, 26, 22, 180);
    g.fillRect(245, 282, 22, 180);

    // Threshold aiming bars
    g.fillStyle = "rgba(241,245,249,0.82)";
    for (let x = 66; x <= 146; x += 26) {
      g.fillRect(x, 60, 14, 110);
      g.fillRect(512 - x - 14, 60, 14, 110);
    }

    // Amber taxiway shoulder lines
    g.fillStyle = "#f59e0b";
    g.fillRect(6, 0, 8, 512);
    g.fillRect(498, 0, 8, 512);
  });
}

function makeCheckeredCurbTex(): THREE.CanvasTexture {
  return ctex("auto25d_curb_v4", 128, 512, (g) => {
    for (let y = 0; y < 512; y += 64) {
      g.fillStyle = (y / 64) % 2 === 0 ? "#f8fafc" : "#1e293b";
      g.fillRect(0, y, 128, 64);
    }
  });
}

function makeBuildingFacadeTex(litWindows = false): THREE.CanvasTexture {
  return ctex(`auto25d_bldg_${litWindows ? "lit" : "day"}_v4`, 256, 512, (g) => {
    g.fillStyle = litWindows ? "#cbd5e1" : "#f5efe6";
    g.fillRect(0, 0, 256, 512);

    // Subtle concrete horizontal bands
    g.fillStyle = litWindows ? "#94a3b8" : "#e2d9cb";
    for (let y = 0; y < 512; y += 64) {
      g.fillRect(0, y, 256, 6);
    }

    // Window grid
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 4; col++) {
        const wx = 18 + col * 58;
        const wy = 24 + row * 64;
        const isWarmLit = litWindows && ((row * 5 + col * 3) % 3 !== 0);
        g.fillStyle = isWarmLit ? "#fde047" : "#648cb5";
        g.fillRect(wx, wy, 40, 36);
        g.strokeStyle = "#1e293b";
        g.lineWidth = 3;
        g.strokeRect(wx, wy, 40, 36);
      }
    }
    // Ground-floor colorful airport shop/gate fascia
    g.fillStyle = "#f59e0b";
    g.fillRect(0, 472, 256, 16);
    g.fillStyle = "#334155";
    g.fillRect(0, 488, 256, 24);
  });
}

function makeAviationTireTreadTex(): THREE.CanvasTexture {
  return ctex("auto25d_tire_tread_v4", 512, 512, (g) => {
    g.fillStyle = "#374151";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = i % 2 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.14)";
      g.fillRect((i * 71) % 512, (i * 139) % 512, 3, 2);
    }
    const grooves = [150, 198, 256, 314, 362];
    for (const gy of grooves) {
      g.fillStyle = "#111827";
      g.fillRect(0, gy - 8, 512, 16);
      g.fillStyle = "rgba(203,213,225,0.24)";
      g.fillRect(0, gy + 8, 512, 3);
    }
    g.strokeStyle = "rgba(203,213,225,0.26)";
    g.lineWidth = 4;
    for (const y of [45, 78, 434, 467]) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }
    g.fillStyle = "#f8fafc";
    g.fillRect(18, 54, 34, 18);
    g.fillRect(18, 440, 34, 18);
  });
}

function makeFuselageSkinTex(): THREE.CanvasTexture {
  return ctex("auto25d_fuselage_skin_v4", 512, 512, (g) => {
    g.fillStyle = "#f8fafc";
    g.fillRect(0, 0, 512, 512);

    // Subtle grey lower belly along circumference U
    g.fillStyle = "#cbd5e1";
    g.fillRect(0, 0, 110, 512);
    g.fillRect(402, 0, 110, 512);

    // Panel lines along length V
    g.strokeStyle = "rgba(71,85,105,0.16)";
    g.lineWidth = 2;
    for (let y = 0; y < 512; y += 40) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }

    // Bold Airline Livery Stripes + Cabin Windows visible on BOTH sides (+X and -X)
    for (const sideX of [132, 356]) {
      g.fillStyle = "#0284c7";
      g.fillRect(sideX, 55, 22, 395);
      g.fillStyle = "#f97316";
      g.fillRect(sideX === 132 ? sideX - 10 : sideX + 22, 55, 10, 395);
    }
    for (let y = 110; y <= 385; y += 20) {
      for (const wx of [162, 334]) {
        g.fillStyle = "#0f172a";
        g.beginPath();
        g.roundRect(wx, y, 16, 11, 4);
        g.fill();
        g.fillStyle = "rgba(186,230,253,0.65)";
        g.fillRect(wx + 2, y + 2, 5, 5);
      }
    }
  });
}

function makeNylonWeaveTex(): THREE.CanvasTexture {
  return ctex("auto25d_nylon_weave_v2", 256, 256, (g) => {
    g.fillStyle = "#0369a1";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#38bdf8";
    g.lineWidth = 5;
    for (let i = -256; i < 512; i += 20) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + 256, 256);
      g.stroke();
      g.beginPath();
      g.moveTo(i + 256, 0);
      g.lineTo(i, 256);
      g.stroke();
    }
  });
}

function makeSteelBeltTex(): THREE.CanvasTexture {
  return ctex("auto25d_steel_belt_v2", 256, 256, (g) => {
    g.fillStyle = "#94a3b8";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#f1f5f9";
    g.lineWidth = 3;
    for (let i = -256; i < 512; i += 12) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + 180, 256);
      g.stroke();
    }
    g.strokeStyle = "#475569";
    g.lineWidth = 2;
    for (let y = 0; y < 256; y += 16) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
  });
}

function makeHangarConcreteFloorTex(): THREE.CanvasTexture {
  return ctex("auto25d_hangar_floor_v4", 512, 512, (g) => {
    g.fillStyle = "#d6dde6";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = i % 2 ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)";
      g.fillRect((i * 83) % 512, (i * 157) % 512, 3, 2);
    }
    // Concrete hangar expansion slab seams
    g.strokeStyle = "rgba(71, 85, 105, 0.24)";
    g.lineWidth = 3;
    for (let i = 0; i <= 512; i += 128) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 512);
      g.stroke();
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(512, i);
      g.stroke();
    }
  });
}

function makePressureGaugeDialTex(): THREE.CanvasTexture {
  return ctex("auto25d_gauge_dial_v3", 512, 512, (g) => {
    g.fillStyle = "#fffdf7";
    g.beginPath();
    g.arc(256, 256, 240, 0, Math.PI * 2);
    g.fill();
    const drawArc = (a0: number, a1: number, col: string) => {
      g.strokeStyle = col;
      g.lineWidth = 34;
      g.beginPath();
      g.arc(256, 256, 185, a0, a1);
      g.stroke();
    };
    drawArc(Math.PI * 0.78, Math.PI * 1.35, "#0ea5e9");
    drawArc(Math.PI * 1.35, Math.PI * 1.85, "#22c55e");
    drawArc(Math.PI * 1.85, Math.PI * 2.22, "#f59e0b");
    g.strokeStyle = "#0f172a";
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * 0.78 + (i / 24) * Math.PI * 1.44;
      const major = i % 4 === 0;
      const r0 = major ? 150 : 168;
      g.lineWidth = major ? 6 : 3;
      g.beginPath();
      g.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0);
      g.lineTo(256 + Math.cos(a) * 204, 256 + Math.sin(a) * 204);
      g.stroke();
    }
    g.fillStyle = "#0f172a";
    g.font = "900 44px sans-serif";
    g.textAlign = "center";
    g.fillText("4X TEST", 256, 365);
    g.font = "700 28px sans-serif";
    g.fillStyle = "#475569";
    g.fillText("TSO-C62e", 256, 405);
  });
}

function makeUrbanRoadTex(): THREE.CanvasTexture {
  return ctex("auto25d_urban_road_v2", 512, 512, (g) => {
    g.fillStyle = "#3f4652";
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = "#cbd5e1";
    g.fillRect(0, 0, 62, 512);
    g.fillRect(450, 0, 62, 512);
    g.fillStyle = "#f59e0b";
    g.fillRect(248, 36, 16, 174);
    g.fillRect(248, 286, 16, 174);
  });
}

// ============================================================================
// 2. SMALL CHUNKY STYLIZED VEHICLES & SCAFFOLDING HELPERS (Ref-Video DNA!)
// ============================================================================

function makeAirportTruck(
  mats: ReturnType<typeof createMaterialCache>,
  tag: string,
  bodyColor: string,
  cabColor: string,
  len = 3.2
): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mats.lam(`veh_${tag}_b`, () => ({ color: bodyColor }));
  const cabMat = mats.lam(`veh_${tag}_c`, () => ({ color: cabColor }));
  const glassMat = mats.phong(`veh_${tag}_g`, () => ({ color: "#648cb5", shininess: 80 }));
  const wheelMat = mats.lam(`veh_${tag}_w`, () => ({ color: "#1e293b" }));
  const lightMat = new THREE.MeshBasicMaterial({ color: "#fef08a" });
  const tailMat = new THREE.MeshBasicMaterial({ color: "#ef4444" });

  // Oriented along Z-axis (+Z forward)!
  const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.15, len * 0.62), bodyMat);
  cargo.position.set(0, 0.95, -len * 0.18);
  cargo.castShadow = true;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.05, len * 0.34), cabMat);
  cab.position.set(0, 0.9, len * 0.32);
  cab.castShadow = true;
  const wind = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.45, 0.08), glassMat);
  wind.position.set(0, 1.12, len * 0.49);
  g.add(cargo, cab, wind);

  // Headlights (+Z) & Taillights (-Z)
  for (const sx of [-0.48, 0.48]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.06), lightMat);
    hl.position.set(sx, 0.62, len * 0.5);
    hl.layers.set(NOINK);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.06), tailMat);
    tl.position.set(sx, 0.62, -len * 0.5);
    tl.layers.set(NOINK);
    g.add(hl, tl);
  }

  for (const [wx, wz] of [
    [-0.78, len * 0.3],
    [0.78, len * 0.3],
    [-0.78, -len * 0.3],
    [0.78, -len * 0.3],
  ]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 12), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.36, wz);
    g.add(w);
  }
  return g;
}

function addScaffoldingTower(
  batch: StaticBatch,
  poleMat: THREE.Material,
  plankMat: THREE.Material,
  ladderMat: THREE.Material,
  cx: number,
  cz: number,
  w: number,
  d: number,
  levels = 3,
  levelH = 1.65
) {
  const totalH = levels * levelH;
  for (const [sx, sz] of [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
  ]) {
    batch.add(
      new THREE.CylinderGeometry(0.055, 0.055, totalH, 8),
      poleMat,
      new THREE.Matrix4().makeTranslation(cx + sx, totalH / 2, cz + sz)
    );
  }
  for (let lv = 1; lv <= levels; lv++) {
    const y = lv * levelH;
    // Crossbars
    batch.add(new THREE.BoxGeometry(w, 0.07, 0.07), ladderMat, new THREE.Matrix4().makeTranslation(cx, y, cz + d / 2));
    batch.add(new THREE.BoxGeometry(w, 0.07, 0.07), ladderMat, new THREE.Matrix4().makeTranslation(cx, y, cz - d / 2));
    batch.add(new THREE.BoxGeometry(0.07, 0.07, d), ladderMat, new THREE.Matrix4().makeTranslation(cx - w / 2, y, cz));
    batch.add(new THREE.BoxGeometry(0.07, 0.07, d), ladderMat, new THREE.Matrix4().makeTranslation(cx + w / 2, y, cz));
    if (lv === levels || lv === 1) {
      batch.add(new THREE.BoxGeometry(w + 0.1, 0.1, d + 0.1), plankMat, new THREE.Matrix4().makeTranslation(cx, y + 0.05, cz));
    }
  }
  // Yellow maintenance ladder on front face (+Z)
  const ladX = cx;
  const ladZ = cz + d / 2 + 0.08;
  batch.add(new THREE.CylinderGeometry(0.045, 0.045, totalH, 8), ladderMat, new THREE.Matrix4().makeTranslation(ladX - 0.34, totalH / 2, ladZ));
  batch.add(new THREE.CylinderGeometry(0.045, 0.045, totalH, 8), ladderMat, new THREE.Matrix4().makeTranslation(ladX + 0.34, totalH / 2, ladZ));
  for (let y = 0.45; y < totalH; y += 0.42) {
    batch.add(new THREE.BoxGeometry(0.68, 0.055, 0.055), ladderMat, new THREE.Matrix4().makeTranslation(ladX, y, ladZ));
  }
}

// ============================================================================
// 3. LIVING 3D ENVIRONMENTS (Runway Along Z + Open Maintenance Hangar)
// ============================================================================

export interface EnvRig {
  group: THREE.Group;
  setTheme: (theme: AutoEnvTheme, tSec?: number, heroProp?: AutoHeroProp) => void;
}

export function buildEnvironments(parent: THREE.Object3D): EnvRig {
  const group = new THREE.Group();
  parent.add(group);
  const mats = createMaterialCache();
  const themes = new Map<AutoEnvTheme, THREE.Group>();

  interface MovingVehicle {
    mesh: THREE.Group;
    x: number;
    speed: number;
    dir: 1 | -1;
    zOffset: number;
  }
  const runwayVehicles: MovingVehicle[] = [];
  let speedMarksGroup: THREE.Group | null = null;

  // 1. LIVING AIRPORT RUNWAY & APRON (Strictly along Z-axis!)
  {
    const g = new THREE.Group();
    const grassMat = mats.lam("rw4_grass", () => ({ map: grassHD() }));
    const asphaltTex = makeWeatheredRunwayTex();
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(1, 20);
    const asphaltMat = mats.lam("rw4_asphalt", () => ({ map: asphaltTex }));
    const roadMat = mats.lam("rw4_road", () => ({ color: "#475569" }));
    const curbTex = makeCheckeredCurbTex();
    curbTex.wrapS = THREE.RepeatWrapping;
    curbTex.wrapT = THREE.RepeatWrapping;
    curbTex.repeat.set(1, 36);
    const curbMat = mats.lam("rw4_curb", () => ({ map: curbTex }));

    const termTex = makeBuildingFacadeTex(false);
    termTex.wrapS = THREE.RepeatWrapping;
    termTex.wrapT = THREE.RepeatWrapping;
    termTex.repeat.set(2, 1);
    const termMat = mats.lam("rw4_term", () => ({ map: termTex }));
    const skylineTex = makeBuildingFacadeTex(false);
    const skylineMat = mats.lam("rw4_sky", () => ({ map: skylineTex }));
    const concreteMat = mats.lam("rw4_conc", () => ({ map: stoneHD("rw4Conc") }));
    const steelMat = mats.phong("rw4_steel", () => ({ color: "#475569", shininess: 45 }));
    const glassMat = mats.phong("rw4_glass", () => ({ color: "#3b82f6", shininess: 80 }));
    const trimMat = mats.lam("rw4_trim", () => ({ color: "#f8fafc" }));
    const barkMat = mats.lam("rw4_bark", () => ({ color: "#8a5a3c" }));
    const leafMat = mats.lam("rw4_leaf", () => ({ color: "#4aa63d" }));
    const lampPostMat = mats.lam("rw4_post", () => ({ color: "#334155" }));
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: "#fef08a" });

    const batch = new StaticBatch();

    // Lush green airport field
    const fieldGeo = new THREE.PlaneGeometry(420, 420);
    fieldGeo.rotateX(-Math.PI / 2);
    const fUv = fieldGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < fUv.count; i++) fUv.setXY(i, fUv.getX(i) * 42, fUv.getY(i) * 42);
    batch.add(fieldGeo, grassMat, new THREE.Matrix4().makeTranslation(0, -0.04, -30));

    // Main runway strictly along Z-axis (x in [-7.2, 7.2])
    const rwGeo = new THREE.PlaneGeometry(14.4, 260);
    rwGeo.rotateX(-Math.PI / 2);
    batch.add(rwGeo, asphaltMat, new THREE.Matrix4().makeTranslation(0, 0, -55));

    // Iconic black-and-white checkered curbing along BOTH sides of the runway (ref_003 DNA!)
    for (const cx of [-7.55, 7.55]) {
      batch.add(new THREE.BoxGeometry(0.65, 0.16, 260), curbMat, new THREE.Matrix4().makeTranslation(cx, 0.08, -55));
    }

    // Flanking apron service roads along BOTH sides (x = -16.5 and x = +16.5, strictly along Z!)
    for (const rx of [-16.5, 16.5]) {
      const srGeo = new THREE.PlaneGeometry(5.8, 240);
      srGeo.rotateX(-Math.PI / 2);
      batch.add(srGeo, roadMat, new THREE.Matrix4().makeTranslation(rx, 0.01, -55));
    }

    // Left Side: Multi-story Airport Terminal Building + 3 Jetbridges (x = -26)
    for (let i = 0; i < 4; i++) {
      const bz = 6 - i * 24;
      batch.add(new THREE.BoxGeometry(11, 8.5, 18), termMat, new THREE.Matrix4().makeTranslation(-26, 4.25, bz));
      // Glass jetbridge corridor extending toward apron
      batch.add(new THREE.BoxGeometry(5.5, 2.2, 2.2), glassMat, new THREE.Matrix4().makeTranslation(-19.5, 3.6, bz));
      batch.add(new THREE.CylinderGeometry(0.28, 0.28, 3.2, 8), steelMat, new THREE.Matrix4().makeTranslation(-17.4, 1.6, bz));
    }

    // Right Side: ATC Control Tower + Open Hangar + Perimeter Buildings
    batch.add(new THREE.CylinderGeometry(1.4, 2.2, 13.5, 12), concreteMat, new THREE.Matrix4().makeTranslation(24, 6.75, -36));
    batch.add(new THREE.CylinderGeometry(3.4, 2.1, 1.3, 12), trimMat, new THREE.Matrix4().makeTranslation(24, 14.0, -36));
    batch.add(new THREE.CylinderGeometry(3.8, 3.1, 2.5, 12), glassMat, new THREE.Matrix4().makeTranslation(24, 15.8, -36));
    batch.add(new THREE.CylinderGeometry(4.2, 4.0, 0.6, 12), steelMat, new THREE.Matrix4().makeTranslation(24, 17.3, -36));
    batch.add(new THREE.SphereGeometry(0.85, 12, 10), trimMat, new THREE.Matrix4().makeTranslation(24, 18.4, -36));

    // Curved Airport Maintenance Hangar on Right Apron
    batch.add(new THREE.BoxGeometry(14, 6.2, 16), concreteMat, new THREE.Matrix4().makeTranslation(27, 3.1, -6));
    const hRoof = new THREE.CylinderGeometry(7.2, 7.2, 16.4, 16, 1, false, 0, Math.PI);
    hRoof.rotateX(Math.PI / 2);
    batch.add(hRoof, steelMat, new THREE.Matrix4().makeTranslation(27, 6.2, -6));

    // Distant City Skyline Towers behind airport horizon (like ref_003 / ref_015!)
    const towers: [number, number, number, number][] = [
      [-42, -118, 12, 28],
      [-24, -126, 10, 36],
      [-8, -132, 14, 24],
      [14, -128, 11, 34],
      [32, -122, 13, 26],
      [48, -116, 10, 22],
    ];
    for (const [tx, tz, tw, th] of towers) {
      batch.add(new THREE.BoxGeometry(tw, th, tw), skylineMat, new THREE.Matrix4().makeTranslation(tx, th / 2, tz));
    }

    // Lush storybook trees lining airport perimeter
    for (const [tx, tz, s, h] of [
      [-12.2, -18, 11, 5.4],
      [-12.2, -46, 12, 6.0],
      [-12.2, -74, 13, 5.8],
      [12.2, -22, 14, 5.5],
      [12.2, -52, 15, 6.2],
      [12.2, -80, 16, 5.7],
    ] as [number, number, number, number][]) {
      addStorybookTree(batch, barkMat, leafMat, [tx, 0, tz], s, h);
    }

    // Runway edge lights along Z
    for (let z = 18; z >= -110; z -= 14) {
      for (const sx of [-7.9, 7.9]) {
        batch.add(new THREE.CylinderGeometry(0.12, 0.18, 0.42, 8), lampPostMat, new THREE.Matrix4().makeTranslation(sx, 0.21, z));
        batch.add(new THREE.SphereGeometry(0.12, 8, 8), lampBulbMat, new THREE.Matrix4().makeTranslation(sx, 0.46, z));
      }
    }

    batch.build(g, true, true);

    // Animated Moving Airport Service Vehicles driving along BOTH apron service roads (strictly along Z!)
    const vSpecs: [string, string, string, number, number, 1 | -1, number][] = [
      ["followme", "#facc15", "#facc15", 15.6, 5.5, -1, 14],
      ["firetruck", "#ef4444", "#dc2626", 17.6, 4.2, 1, -30],
      ["fuel", "#f8fafc", "#0284c7", 15.6, 4.8, -1, -28],
      ["shuttle", "#38bdf8", "#f8fafc", -15.6, 5.2, 1, -18],
      ["baggage", "#f97316", "#facc15", -17.6, 4.5, -1, 6],
      ["service2", "#22c55e", "#f8fafc", -15.6, 4.9, 1, -55],
    ];
    for (const [tag, bCol, cCol, x, speed, dir, zOffset] of vSpecs) {
      const m = makeAirportTruck(mats, tag, bCol, cCol, tag === "firetruck" ? 4.0 : 3.1);
      m.rotation.y = dir === 1 ? 0 : Math.PI;
      m.position.set(x, 0, zOffset);
      g.add(m);
      runwayVehicles.push({ mesh: m, x, speed, dir, zOffset });
    }

    // Animated scrolling Z-axis runway centerline markers for high-speed touchdown/spinup shots
    speedMarksGroup = new THREE.Group();
    const markMat = mats.lam("rw4_spdmark", () => ({ color: "#f8fafc" }));
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 2.4), markMat);
      m.position.set(0, 0.025, -20 + i * 4.5);
      speedMarksGroup.add(m);
    }
    speedMarksGroup.visible = false;
    g.add(speedMarksGroup);

    group.add(g);
    themes.set("runway", g);
  }

  // 2. LIVING OPEN AIRPORT MAINTENANCE HANGAR (Yellow Scaffolding + Ladder + Open Door to Airport Skyline!)
  {
    const g = new THREE.Group();
    const floorTex = makeHangarConcreteFloorTex();
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(14, 14);
    const floorMat = mats.lam("hg4_floor", () => ({ map: floorTex }));
    const wallMat = mats.lam("hg4_wall", () => ({ color: "#e8e3da" }));
    const wainscotMat = mats.lam("hg4_wainscot", () => ({ color: "#334155" }));
    const poleMat = mats.phong("hg4_pole", () => ({ color: "#475569", shininess: 50 }));
    const plankMat = mats.lam("hg4_plank", () => ({ color: "#d97706" }));
    const yellowMat = mats.lam("hg4_yellow", () => ({ color: "#facc15" }));
    const redMat = mats.lam("hg4_red", () => ({ color: "#dc2626" }));
    const orangeMat = mats.lam("hg4_orange", () => ({ color: "#f97316" }));
    const apronMat = mats.lam("hg4_apron", () => ({ color: "#475569" }));
    const nightBldgTex = makeBuildingFacadeTex(true);
    const nightBldgMat = mats.lam("hg4_city", () => ({ map: nightBldgTex }));
    const deckMat = mats.phong("hg4_deck", () => ({ color: "#94a3b8", shininess: 45 }));

    const batch = new StaticBatch();

    // Hangar concrete floor + outside tarmac apron visible through open bay door
    const floorGeo = new THREE.PlaneGeometry(34, 28);
    floorGeo.rotateX(-Math.PI / 2);
    batch.add(floorGeo, floorMat, new THREE.Matrix4().makeTranslation(0, 0, -2));

    const outApron = new THREE.PlaneGeometry(240, 140);
    outApron.rotateX(-Math.PI / 2);
    batch.add(outApron, apronMat, new THREE.Matrix4().makeTranslation(0, -0.02, -82));

    // Left & Right Hangar Side Walls + Open Back Wall framing the airport skyline!
    batch.add(new THREE.BoxGeometry(0.7, 11, 28), wallMat, new THREE.Matrix4().makeTranslation(-12, 5.5, -2));
    batch.add(new THREE.BoxGeometry(0.7, 11, 28), wallMat, new THREE.Matrix4().makeTranslation(12, 5.5, -2));
    batch.add(new THREE.BoxGeometry(5.5, 11, 0.7), wallMat, new THREE.Matrix4().makeTranslation(-9.5, 5.5, -13));
    batch.add(new THREE.BoxGeometry(5.5, 11, 0.7), wallMat, new THREE.Matrix4().makeTranslation(9.5, 5.5, -13));
    // Upper hangar door header beam
    batch.add(new THREE.BoxGeometry(24, 2.2, 0.9), wainscotMat, new THREE.Matrix4().makeTranslation(0, 9.8, -13));
    batch.add(new THREE.BoxGeometry(24, 0.25, 0.96), yellowMat, new THREE.Matrix4().makeTranslation(0, 8.7, -13));

    // Lower safety wainscot along side walls
    batch.add(new THREE.BoxGeometry(0.8, 2.2, 28), wainscotMat, new THREE.Matrix4().makeTranslation(-11.9, 1.1, -2));
    batch.add(new THREE.BoxGeometry(0.8, 2.2, 28), wainscotMat, new THREE.Matrix4().makeTranslation(11.9, 1.1, -2));

    // Distant illuminated airport terminal & city buildings visible through open hangar bay!
    for (const [bx, bz, bw, bh] of [
      [-16, -42, 10, 18],
      [-5, -48, 9, 24],
      [6, -46, 10, 21],
      [18, -40, 11, 16],
    ]) {
      batch.add(new THREE.BoxGeometry(bw, bh, bw), nightBldgMat, new THREE.Matrix4().makeTranslation(bx, bh / 2, bz));
    }

    // Iconic Yellow Steel Maintenance Scaffolding + Ladder on left & right of test bay (ref_009 / ref_013!)
    addScaffoldingTower(batch, poleMat, plankMat, yellowMat, -4.6, -2.6, 2.3, 1.6, 3, 1.6);
    addScaffoldingTower(batch, poleMat, plankMat, yellowMat, 4.6, -2.6, 2.3, 1.6, 3, 1.6);

    // Overhead aircraft maintenance gantry beam spanning across the bay
    batch.add(new THREE.BoxGeometry(11.6, 0.55, 0.7), wainscotMat, new THREE.Matrix4().makeTranslation(0, 5.4, -2.6));

    // Red rolling mechanic tool cabinet + orange safety cones
    batch.add(new THREE.BoxGeometry(1.5, 1.35, 0.9), redMat, new THREE.Matrix4().makeTranslation(-4.4, 0.68, 0.6));
    batch.add(new THREE.BoxGeometry(1.56, 0.1, 0.96), poleMat, new THREE.Matrix4().makeTranslation(-4.4, 1.4, 0.6));
    for (const [cx, cz] of [
      [-3.5, 2.5],
      [3.5, 2.5],
      [-4.2, -0.8],
      [4.2, -0.8],
    ]) {
      batch.add(new THREE.ConeGeometry(0.24, 0.68, 10), orangeMat, new THREE.Matrix4().makeTranslation(cx, 0.34, cz));
      batch.add(new THREE.BoxGeometry(0.48, 0.08, 0.48), wainscotMat, new THREE.Matrix4().makeTranslation(cx, 0.04, cz));
    }

    // Grounded engineering turntable floor pad with crisp yellow safety border
    batch.add(new THREE.CylinderGeometry(3.2, 3.45, 0.12, 36), poleMat, new THREE.Matrix4().makeTranslation(0, 0.06, 0));
    batch.add(new THREE.CylinderGeometry(2.9, 3.0, 0.06, 36), deckMat, new THREE.Matrix4().makeTranslation(0, 0.14, 0));
    batch.add(new THREE.TorusGeometry(3.18, 0.05, 10, 48).rotateX(Math.PI / 2), yellowMat, new THREE.Matrix4().makeTranslation(0, 0.12, 0));

    batch.build(g, true, true);
    group.add(g);
    themes.set("lab_blueprint", g);
  }

  // 3. NATURE OUTDOOR ENVIRONMENT
  {
    const g = new THREE.Group();
    const grassMat = mats.lam("nat2_grass", () => ({ map: grassHD() }));
    const barkMat = mats.lam("nat2_bark", () => ({ color: "#7a5136" }));
    const leafA = mats.lam("nat2_leafA", () => ({ color: "#52a34c" }));
    const leafB = mats.lam("nat2_leafB", () => ({ color: "#428b42" }));
    const rockMat = mats.lam("nat2_rock", () => ({ map: stoneHD("nat2Rock") }));

    const batch = new StaticBatch();
    const groundGeo = new THREE.PlaneGeometry(360, 360);
    groundGeo.rotateX(-Math.PI / 2);
    const uv = groundGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 36, uv.getY(i) * 36);
    batch.add(groundGeo, grassMat);

    const trees: [number, number, number, number][] = [
      [-6.5, -7.0, 101, 6.2],
      [6.5, -7.5, 102, 6.4],
      [-11.0, -12.0, 103, 7.4],
      [11.0, -11.5, 104, 6.9],
    ];
    trees.forEach(([x, z, seed, h], i) =>
      addStorybookTree(batch, barkMat, i % 2 ? leafB : leafA, [x, 0, z], seed, h)
    );
    addBushCluster(batch, leafA, [-4.2, 0, -4.5], 201, 1.1);
    addBushCluster(batch, leafB, [4.2, 0, -4.8], 202, 1.0);
    addRockCluster(batch, rockMat, [-3.0, 0, -6.2], 301, 1.0);
    batch.build(g, true, true);
    group.add(g);
    themes.set("nature_outdoor", g);
  }

  // 4. URBAN STREET ENVIRONMENT
  {
    const g = new THREE.Group();
    const roadTex = makeUrbanRoadTex();
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 16);
    const roadMat = mats.lam("urb2_road", () => ({ map: roadTex }));
    const bldTex = makeBuildingFacadeTex(false);
    const bldMat = mats.lam("urb2_bA", () => ({ map: bldTex }));
    const batch = new StaticBatch();
    const roadGeo = new THREE.PlaneGeometry(16, 220);
    roadGeo.rotateX(-Math.PI / 2);
    batch.add(roadGeo, roadMat);
    for (let i = 0; i < 6; i++) {
      const z = -10 - i * 14;
      const h1 = 9 + (i % 3) * 4;
      const h2 = 11 + ((i + 1) % 3) * 3;
      batch.add(new THREE.BoxGeometry(8, h1, 10), bldMat, new THREE.Matrix4().makeTranslation(-13, h1 / 2, z));
      batch.add(new THREE.BoxGeometry(8, h2, 10), bldMat, new THREE.Matrix4().makeTranslation(13, h2 / 2, z));
    }
    batch.build(g, true, true);
    group.add(g);
    themes.set("urban_street", g);
  }

  // 5. SKY / COSMOS ENVIRONMENT
  {
    const g = new THREE.Group();
    const starMat = new THREE.MeshBasicMaterial({ color: "#e0f2fe" });
    for (let i = 0; i < 36; i++) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), starMat);
      const a = (i / 36) * Math.PI * 2;
      star.position.set(Math.cos(a) * (18 + (i % 5) * 6), 4 + (i % 7) * 3, Math.sin(a) * 20 - 15);
      g.add(star);
    }
    group.add(g);
    themes.set("sky_cosmos", g);
  }

  const setTheme = (theme: AutoEnvTheme, tSec = 0, heroProp?: AutoHeroProp) => {
    for (const [k, grp] of themes) grp.visible = k === theme;

    // Animate moving airport service vehicles strictly along Z!
    if (theme === "runway") {
      for (const v of runwayVehicles) {
        const span = 120;
        const raw = ((v.zOffset + v.dir * tSec * v.speed + 80) % span + span) % span;
        v.mesh.position.z = raw - 80;
      }
      if (speedMarksGroup) {
        const showSpeed = heroProp === "tire_touchdown_smoke" || heroProp === "tire_spinup";
        speedMarksGroup.visible = showSpeed;
        if (showSpeed) {
          const offset = (tSec * 16) % 4.5;
          speedMarksGroup.children.forEach((m, idx) => {
            m.position.z = -20 + idx * 4.5 - offset;
          });
        }
      }
    }
  };
  setTheme("runway");

  return { group, setTheme };
}

// ============================================================================
// 4. SCULPTED AEROSPACE 3D HERO MODELS (Strictly Aligned Along Z-axis!)
// ============================================================================

function makeAircraftTireMesh(
  mats: ReturnType<typeof createMaterialCache>,
  radius = 1.18,
  tube = 0.44
): THREE.Group {
  const g = new THREE.Group();
  const treadTex = makeAviationTireTreadTex();
  treadTex.wrapS = THREE.RepeatWrapping;
  treadTex.wrapT = THREE.RepeatWrapping;
  treadTex.repeat.set(4, 1);

  const rubberMat = mats.lam("av_tire_rubber", () => ({ map: treadTex }));
  const alloyRimMat = mats.phong("av_tire_rim", () => ({ color: "#cbd5e1", shininess: 65 }));
  const darkRecessMat = mats.phong("av_tire_recess", () => ({ color: "#334155", shininess: 35 }));
  const steelCapMat = mats.phong("av_tire_cap", () => ({ color: "#94a3b8", shininess: 80 }));
  const boltMat = mats.phong("av_tire_bolt", () => ({ color: "#e2e8f0", shininess: 90 }));
  const indexMarkMat = mats.lam("av_tire_idx", () => ({ color: "#f8fafc" }));

  const tireGeo = new THREE.TorusGeometry(radius, tube, 22, 44);
  tireGeo.scale(1, 1, 1.15);
  const tire = new THREE.Mesh(tireGeo, rubberMat);
  tire.castShadow = true;
  tire.receiveShadow = true;
  g.add(tire);

  for (const side of [-1, 1]) {
    const lip = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.68, tube * 0.14, 12, 32), alloyRimMat);
    lip.position.z = side * tube * 0.62;
    g.add(lip);
  }

  const rimBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.66, radius * 0.66, tube * 1.1, 28),
    darkRecessMat
  );
  rimBarrel.rotation.x = Math.PI / 2;
  rimBarrel.castShadow = true;
  g.add(rimBarrel);

  const facePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, tube * 1.24, 24),
    alloyRimMat
  );
  facePlate.rotation.x = Math.PI / 2;
  g.add(facePlate);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.24, radius * 0.28, tube * 1.5, 18),
    steelCapMat
  );
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, tube * 1.38, 6), boltMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(Math.cos(a) * radius * 0.43, Math.sin(a) * radius * 0.43, 0);
    g.add(bolt);
  }

  const slipMark = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.34, 0.075, tube * 1.32), indexMarkMat);
  slipMark.position.set(radius * 0.62, 0, 0);
  g.add(slipMark);

  return g;
}

/**
 * Commercial Jetliner oriented STRICTLY ALONG +Z (Nose at +Z, Tail at -Z, Wings along X)!
 * Aligns 100% with the Z-axis runway centerline — never sideways!
 */
function makeSculptedAirlinerAlongZ(mats: ReturnType<typeof createMaterialCache>): THREE.Group {
  const jet = new THREE.Group();
  const skinTex = makeFuselageSkinTex();
  const bodyMat = mats.phong("jet4_body", () => ({ map: skinTex, shininess: 35 }));
  const wingMat = mats.phong("jet4_wing", () => ({ color: "#e2e8f0", shininess: 40 }));
  const navyMat = mats.phong("jet4_navy", () => ({ color: "#1e3a5f", shininess: 50 }));
  const accentMat = mats.lam("jet4_orange", () => ({ color: "#f97316" }));
  const chromeMat = mats.phong("jet4_chrome", () => ({ color: "#cbd5e1", shininess: 90 }));
  const darkMetalMat = mats.phong("jet4_dark", () => ({ color: "#1e293b", shininess: 50 }));
  const glassMat = mats.phong("jet4_glass", () => ({ color: "#0f172a", shininess: 95 }));

  // 1. Fuselage along +Z (LatheGeometry along +Y rotated +PI/2 around X -> tail at -Z, nose at +Z!)
  const fusePts = [
    new THREE.Vector2(0.01, -5.4),
    new THREE.Vector2(0.32, -4.7),
    new THREE.Vector2(0.76, -3.5),
    new THREE.Vector2(1.08, -2.0),
    new THREE.Vector2(1.1, 2.4),
    new THREE.Vector2(0.98, 3.4),
    new THREE.Vector2(0.68, 4.3),
    new THREE.Vector2(0.32, 4.9),
    new THREE.Vector2(0.01, 5.2),
  ];
  const fuseGeo = new THREE.LatheGeometry(fusePts, 28);
  fuseGeo.rotateX(Math.PI / 2);
  const fuse = new THREE.Mesh(fuseGeo, bodyMat);
  fuse.position.y = 2.68;
  fuse.castShadow = true;
  fuse.receiveShadow = true;
  jet.add(fuse);

  // Cockpit windshield facing +Z
  const cockpitGeo = new THREE.CylinderGeometry(0.84, 0.94, 0.55, 16, 1, false, -0.75, 1.5);
  cockpitGeo.rotateX(Math.PI / 2);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
  cockpit.position.set(0, 3.04, 3.85);
  jet.add(cockpit);

  // 2. Swept Wings along +/-X
  for (const side of [-1, 1]) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 1.4);
    wingShape.lineTo(0, -1.1);
    wingShape.lineTo(5.6 * side, -2.4);
    wingShape.lineTo(5.6 * side, -1.35);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    wingGeo.rotateX(Math.PI / 2);
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 2.38, 0.3);
    wing.rotation.z = side * 0.06;
    wing.castShadow = true;
    jet.add(wing);

    // Blended winglet
    const wl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.88, 0.78), navyMat);
    wl.position.set(5.65 * side, 2.95, -1.65);
    wl.rotation.z = side * -0.22;
    wl.rotation.x = -0.24;
    jet.add(wl);

    // Under-wing Turbofan Nacelle facing +Z
    const engGrp = new THREE.Group();
    const nacPts = [
      new THREE.Vector2(0.36, -0.95),
      new THREE.Vector2(0.5, -0.55),
      new THREE.Vector2(0.54, 0.35),
      new THREE.Vector2(0.49, 0.85),
    ];
    const nacGeo = new THREE.LatheGeometry(nacPts, 20);
    nacGeo.rotateX(Math.PI / 2);
    const nac = new THREE.Mesh(nacGeo, navyMat);
    nac.castShadow = true;
    engGrp.add(nac);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.055, 10, 22), chromeMat);
    lip.position.z = 0.84;
    engGrp.add(lip);

    const fanBack = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16), darkMetalMat);
    fanBack.rotation.x = Math.PI / 2;
    fanBack.position.z = 0.65;
    engGrp.add(fanBack);

    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 12), chromeMat);
    spinner.rotation.x = Math.PI / 2;
    spinner.position.z = 0.78;
    engGrp.add(spinner);

    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 1.15), wingMat);
    pylon.position.set(0, 0.45, 0.15);
    engGrp.add(pylon);

    engGrp.position.set(2.15 * side, 1.72, 0.72);
    jet.add(engGrp);
  }

  // 3. Vertical Tail Fin at -Z
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(2.1, 0);
  finShape.lineTo(0.2, 2.75);
  finShape.lineTo(-0.75, 2.75);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  finGeo.translate(0, 0, -0.08);
  finGeo.rotateY(-Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, navyMat);
  fin.position.set(0, 3.1, -4.45);
  fin.castShadow = true;
  jet.add(fin);

  const finStripe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.9), accentMat);
  finStripe.position.set(0, 4.75, -4.05);
  finStripe.rotation.x = -0.55;
  jet.add(finStripe);

  // Horizontal Tail Stabilizers
  for (const side of [-1, 1]) {
    const hsShape = new THREE.Shape();
    hsShape.moveTo(0, 0.7);
    hsShape.lineTo(0, -0.5);
    hsShape.lineTo(2.15 * side, -1.15);
    hsShape.lineTo(2.15 * side, -0.55);
    hsShape.closePath();
    const hsGeo = new THREE.ExtrudeGeometry(hsShape, { depth: 0.1, bevelEnabled: false });
    hsGeo.rotateX(Math.PI / 2);
    const hs = new THREE.Mesh(hsGeo, wingMat);
    hs.position.set(0, 3.05, -4.2);
    jet.add(hs);
  }

  // 4. Twin-Wheel Landing Gear Bogies (Wheels oriented strictly along Z so they roll forward!)
  const addGearBogie = (gx: number, gz: number, wheelR: number, name: string) => {
    const bogie = new THREE.Group();
    const upperStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 1.15, 12), wingMat);
    upperStrut.position.y = 1.48;
    const chromePiston = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.72, 12), chromeMat);
    chromePiston.position.y = 0.88;
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.05, 8), darkMetalMat);
    brace.position.set(0, 1.4, 0.32);
    brace.rotation.x = -0.48;
    bogie.add(upperStrut, chromePiston, brace);

    const axle = new THREE.Group();
    axle.position.set(0, wheelR * 1.4, 0);
    axle.name = name;
    for (const wx of [-0.26, 0.26]) {
      const w = makeAircraftTireMesh(mats, wheelR, wheelR * 0.4);
      w.rotation.y = Math.PI / 2; // Axle along X -> wheel rolls cleanly along Z!
      w.position.set(wx, 0, 0);
      axle.add(w);
    }
    bogie.add(axle);
    bogie.position.set(gx, 0, gz);
    jet.add(bogie);
  };
  addGearBogie(0, 3.15, 0.34, "wheel_nose");
  addGearBogie(-1.35, -0.1, 0.44, "wheel_main_l");
  addGearBogie(1.35, -0.1, 0.44, "wheel_main_r");

  return jet;
}

// ============================================================================
// 5. HERO PROP RIG (All Assemblies Grounded & Animated with Cause-and-Effect!)
// ============================================================================

export interface HeroPropRig {
  group: THREE.Group;
  update: (prop: AutoHeroProp, tLocal: number, tSec: number) => void;
}

export function buildHeroPropRig(parent: THREE.Object3D): HeroPropRig {
  const group = new THREE.Group();
  parent.add(group);
  const mats = createMaterialCache();

  const props = new Map<AutoHeroProp, THREE.Group>();
  const register = (id: AutoHeroProp, g: THREE.Group) => {
    g.visible = false;
    group.add(g);
    props.set(id, g);
  };

  // 1. JET LANDING & GOLDEN TAXI (Strictly along Z runway centerline!)
  const makeJetRig = (withTouchdownSmoke: boolean) => {
    const root = new THREE.Group();
    const airliner = makeSculptedAirlinerAlongZ(mats);
    airliner.name = "airliner_body";
    root.add(airliner);

    if (withTouchdownSmoke) {
      const tdSmokeMat = mats.lam("jet4_td_smoke", () => ({ color: "#f8fafc" }));
      const smokeGrp = new THREE.Group();
      smokeGrp.name = "jet_td_smoke";
      for (let i = 0; i < 8; i++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + (i % 3) * 0.1, 1), tdSmokeMat);
        puff.layers.set(NOINK);
        smokeGrp.add(puff);
      }
      root.add(smokeGrp);
    }
    return root;
  };
  register("jet_landing", makeJetRig(true));
  register("jet_taxi_golden", makeJetRig(false));

  // 2. TIRE TOUCHDOWN SMOKE & SPIN-UP (Oriented strictly along Z rolling down runway!)
  const makeSpinTireAssemblyAlongZ = (tag: string) => {
    const g = new THREE.Group();
    const strutMat = mats.phong(`${tag}_strut`, () => ({ color: "#cbd5e1", shininess: 75 }));
    const darkMat = mats.phong(`${tag}_dark`, () => ({ color: "#334155", shininess: 45 }));
    const smokeMat = mats.lam(`${tag}_smoke`, () => ({ color: "#f8fafc" }));

    const gearRig = new THREE.Group();
    gearRig.name = "gear_rig";

    const outerCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 2.2, 16), strutMat);
    outerCylinder.position.set(0, 3.85, 0);
    const chromeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.3, 16), strutMat);
    chromeRod.position.set(0, 2.45, 0);
    const linkTop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.55), darkMat);
    linkTop.position.set(0, 2.95, -0.34);
    linkTop.rotation.x = 0.45;
    const linkBot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.55), darkMat);
    linkBot.position.set(0, 2.45, -0.34);
    linkBot.rotation.x = -0.45;
    gearRig.add(outerCylinder, chromeRod, linkTop, linkBot);

    const wheelPivot = new THREE.Group();
    wheelPivot.position.set(0, 1.72, 0);
    wheelPivot.name = "spin_wheel";
    const tire = makeAircraftTireMesh(mats, 1.24, 0.48);
    tire.rotation.y = Math.PI / 2; // Rolls cleanly along Z!
    wheelPivot.add(tire);
    gearRig.add(wheelPivot);
    g.add(gearRig);

    // Rubber skid mark extending behind wheel along -Z
    const skid = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 4.6).rotateX(-Math.PI / 2),
      mats.lam(`${tag}_skid`, () => ({ color: "#0f172a" }))
    );
    skid.position.set(0, 0.025, -2.2);
    skid.name = "skid_mark";
    g.add(skid);

    const smokeGroup = new THREE.Group();
    smokeGroup.name = "smoke_trail";
    for (let i = 0; i < 8; i++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + i * 0.07, 1), smokeMat);
      puff.layers.set(NOINK);
      smokeGroup.add(puff);
    }
    g.add(smokeGroup);
    return g;
  };
  register("tire_touchdown_smoke", makeSpinTireAssemblyAlongZ("td4"));
  register("tire_spinup", makeSpinTireAssemblyAlongZ("sp4"));

  // 3. FOUR ENGINEERING PILLARS RADIAL
  const fourPillars = new THREE.Group();
  {
    const centerTire = makeAircraftTireMesh(mats, 1.05, 0.4);
    centerTire.position.set(0, 1.65, 0);
    centerTire.name = "pillars_tire";
    fourPillars.add(centerTire);

    const frameMat = mats.phong("fp_frame", () => ({ color: "#cbd5e1", shininess: 70 }));
    const accentColors = ["#0284c7", "#d97706", "#059669", "#ea580c"];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const cardGrp = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.28, 0.16), frameMat);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 1.1, 0.2),
        mats.lam(`fp_p_${i}`, () => ({ color: accentColors[i] }))
      );
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 10),
        new THREE.MeshBasicMaterial({ color: accentColors[i] })
      );
      orb.position.y = 0.88;
      orb.layers.set(NOINK);
      cardGrp.add(frame, panel, orb);
      cardGrp.position.set(Math.cos(a) * 2.45, 1.65, Math.sin(a) * 2.45);
      cardGrp.lookAt(0, 1.65, 0);
      cardGrp.name = `pillar_${i}`;
      fourPillars.add(cardGrp);
    }
  }
  register("four_pillars_radial", fourPillars);

  // 4. EXPLODED-VIEW MULTI-LAYER CUTAWAY TIRE
  const tireCutaway = new THREE.Group();
  {
    const treadTex = makeAviationTireTreadTex();
    treadTex.wrapS = THREE.RepeatWrapping;
    treadTex.repeat.set(3, 1);
    const nylonTex = makeNylonWeaveTex();
    nylonTex.wrapS = THREE.RepeatWrapping;
    nylonTex.wrapT = THREE.RepeatWrapping;
    nylonTex.repeat.set(4, 2);
    const steelTex = makeSteelBeltTex();
    steelTex.wrapS = THREE.RepeatWrapping;
    steelTex.wrapT = THREE.RepeatWrapping;
    steelTex.repeat.set(4, 2);

    const rubberMat = mats.lam("cut2_rubber", () => ({ map: treadTex }));
    const nylonMat = mats.lam("cut2_nylon", () => ({ map: nylonTex }));
    const steelMat = mats.phong("cut2_steel", () => ({ map: steelTex, shininess: 85 }));
    const linerMat = mats.phong("cut2_liner", () => ({ color: "#f59e0b", shininess: 40 }));
    const rimMat = mats.phong("cut2_rim", () => ({ color: "#cbd5e1", shininess: 75 }));
    const hubMat = mats.phong("cut2_hub", () => ({ color: "#64748b", shininess: 85 }));

    const outer = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.42, 22, 40, Math.PI * 1.48), rubberMat);
    outer.castShadow = true;
    outer.name = "cut_outer";
    tireCutaway.add(outer);

    const nylon = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.34, 18, 36, Math.PI * 1.66), nylonMat);
    nylon.name = "cut_nylon";
    tireCutaway.add(nylon);

    const steel = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.24, 18, 36, Math.PI * 1.84), steelMat);
    steel.name = "cut_steel";
    tireCutaway.add(steel);

    const inner = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.14, 14, 32), linerMat);
    inner.name = "cut_inner";
    tireCutaway.add(inner);

    const rimGrp = new THREE.Group();
    rimGrp.name = "cut_rim";
    const alloyRim = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.46, 28), rimMat);
    alloyRim.rotation.x = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.58, 18), hubMat);
    hub.rotation.x = Math.PI / 2;
    rimGrp.add(alloyRim, hub);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.52, 6), hubMat);
      b.rotation.x = Math.PI / 2;
      b.position.set(Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0);
      rimGrp.add(b);
    }
    tireCutaway.add(rimGrp);
    tireCutaway.position.set(0, 1.92, 0);
  }
  register("tire_cutaway_layers", tireCutaway);

  // 5. HYDROSTATIC 4X BURST TEST RIG (Orange Rolling Pump Cart like ref_009/ref_014 + Pressure Pulses + 4X Dial!)
  const burstTest = new THREE.Group();
  {
    const tire = makeAircraftTireMesh(mats, 1.08, 0.42);
    tire.position.set(0.05, 1.66, 0);
    tire.name = "burst_tire";
    burstTest.add(tire);

    const steelMat = mats.phong("bt4_steel", () => ({ color: "#64748b", shininess: 70 }));
    const orangeCartMat = mats.lam("bt4_cart", () => ({ color: "#f97316" }));
    const darkWheelMat = mats.lam("bt4_w", () => ({ color: "#1e293b" }));
    const brassMat = mats.phong("bt4_brass", () => ({ color: "#d97706", shininess: 80 }));
    const dialTex = makePressureGaugeDialTex();
    const dialMat = new THREE.MeshBasicMaterial({ map: dialTex });

    // Iconic Orange Hydraulic Pump Cart on Left (ref_009 / ref_014 DNA!)
    const cartBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.05, 0.9), orangeCartMat);
    cartBox.position.set(-1.95, 0.85, 0.25);
    cartBox.castShadow = true;
    const motorTop = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.72, 14), darkWheelMat);
    motorTop.rotation.z = Math.PI / 2;
    motorTop.position.set(-1.95, 1.58, 0.25);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), steelMat);
    lever.position.set(-1.42, 1.55, 0.45);
    lever.rotation.z = -0.35;
    lever.name = "pump_lever";
    burstTest.add(cartBox, motorTop, lever);

    for (const [wx, wz] of [
      [-2.35, 0.65],
      [-1.55, 0.65],
      [-2.35, -0.15],
      [-1.55, -0.15],
    ]) {
      const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 10), darkWheelMat);
      cw.rotation.x = Math.PI / 2;
      cw.position.set(wx, 0.34, wz);
      burstTest.add(cw);
    }

    // Large precision 3D Manometer Dial Gauge on Right
    const gaugeGrp = new THREE.Group();
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.24, 32), steelMat);
    housing.rotation.x = Math.PI / 2;
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 12, 32), brassMat);
    bezel.position.z = 0.12;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), dialMat);
    face.position.z = 0.13;
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.64, 0.04), new THREE.MeshBasicMaterial({ color: "#dc2626" }));
    needle.position.set(0, 0.2, 0.17);
    const needlePivot = new THREE.Group();
    needlePivot.add(needle);
    needlePivot.name = "gauge_needle";
    gaugeGrp.add(housing, bezel, face, needlePivot);
    gaugeGrp.position.set(1.65, 2.05, 0.55);
    gaugeGrp.rotation.y = -0.25;
    burstTest.add(gaugeGrp);

    const hoseCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-1.4, 1.25, 0.45),
      new THREE.Vector3(-0.95, 1.85, 0.68),
      new THREE.Vector3(-0.55, 1.65, 0.65),
      new THREE.Vector3(-0.1, 1.48, 0.48)
    );
    burstTest.add(new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 18, 0.07, 10, false), brassMat));

    const pulseMat = new THREE.MeshBasicMaterial({ color: "#0ea5e9" });
    const pulses = new THREE.Group();
    pulses.name = "burst_pulses";
    for (let i = 0; i < 4; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), pulseMat);
      orb.layers.set(NOINK);
      pulses.add(orb);
    }
    burstTest.add(pulses);
  }
  register("burst_test_4x", burstTest);

  // 6. TIRE PRESSURE 200 PSI
  const tirePressure = new THREE.Group();
  {
    const tire = makeAircraftTireMesh(mats, 1.18, 0.45);
    tire.position.set(0.35, 1.8, 0);
    tire.name = "psi_tire";
    tirePressure.add(tire);

    const tankMat = mats.phong("psi2_tank", () => ({ color: "#0284c7", shininess: 65 }));
    const brassMat = mats.phong("psi2_brass", () => ({ color: "#d97706", shininess: 85 }));
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.25, 12, 20), tankMat);
    tank.position.set(-1.8, 1.3, 0.35);
    tank.castShadow = true;
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.3, 12), brassMat);
    valve.position.set(-1.8, 2.34, 0.35);
    tirePressure.add(tank, valve);

    const hoseCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-1.8, 2.42, 0.35),
      new THREE.Vector3(-1.2, 2.52, 0.68),
      new THREE.Vector3(-0.75, 1.75, 0.68),
      new THREE.Vector3(-0.2, 1.58, 0.48)
    );
    tirePressure.add(new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 18, 0.065, 10, false), brassMat));

    const gasBeadMat = new THREE.MeshBasicMaterial({ color: "#38bdf8" });
    const gasStream = new THREE.Group();
    gasStream.name = "psi_gas_stream";
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), gasBeadMat);
      b.layers.set(NOINK);
      gasStream.add(b);
    }
    tirePressure.add(gasStream);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.66, 0.055, 10, 44), new THREE.MeshBasicMaterial({ color: "#0284c7" }));
    ring.position.set(0.35, 1.8, 0);
    ring.layers.set(NOINK);
    ring.name = "psi_ring";
    tirePressure.add(ring);
  }
  register("tire_pressure_200psi", tirePressure);

  // 7. TIRE VS SIX CAR TIRES
  const tireVsSix = new THREE.Group();
  {
    const bigTire = makeAircraftTireMesh(mats, 1.25, 0.46);
    bigTire.position.set(1.1, 1.88, 0);
    tireVsSix.add(bigTire);

    const padMat = mats.phong("vs_pad", () => ({ color: "#475569", shininess: 50 }));
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.16, 1.4), padMat);
    pad.position.set(1.1, 0.25, 0);
    const padL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 1.4), padMat);
    padL.position.set(-1.3, 0.25, 0);
    tireVsSix.add(pad, padL);

    const carRubber = mats.lam("car2_rub", () => ({ map: makeAviationTireTreadTex() }));
    const carRim = mats.phong("car2_rim", () => ({ color: "#e2e8f0", shininess: 75 }));
    for (let i = 0; i < 6; i++) {
      const mini = new THREE.Group();
      const ct = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.16, 14, 24), carRubber);
      ct.rotation.x = Math.PI / 2;
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 16), carRim);
      mini.add(ct, cr);
      mini.position.set(-1.3, 0.54 + i * 0.37, 0);
      mini.name = `car_tire_${i}`;
      tireVsSix.add(mini);
    }
  }
  register("tire_vs_six_cars", tireVsSix);

  // 8. NITROGEN X-RAY
  const nitrogenXray = new THREE.Group();
  {
    const xrayMat = new THREE.MeshPhongMaterial({
      color: "#0284c7",
      emissive: "#0369a1",
      emissiveIntensity: 0.25,
      shininess: 90,
      transparent: true,
      opacity: 0.32,
    });
    const shell = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.48, 20, 40), xrayMat);
    shell.position.set(0, 1.95, 0);
    nitrogenXray.add(shell);

    const rimMat = mats.phong("nx_rim", () => ({ color: "#94a3b8", shininess: 75 }));
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.46, 24), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 1.95, 0);
    nitrogenXray.add(rim);

    const n2Mat = mats.phong("nx_n2", () => ({ color: "#0ea5e9", shininess: 90 }));
    const bondMat = new THREE.MeshBasicMaterial({ color: "#e0f2fe" });
    const molGroup = new THREE.Group();
    molGroup.position.set(0, 1.95, 0);
    molGroup.name = "n2_orbit";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const pair = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), n2Mat);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), n2Mat);
      s1.position.x = -0.12;
      s2.position.x = 0.12;
      const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8), bondMat);
      bond.rotation.z = Math.PI / 2;
      pair.add(s1, s2, bond);
      pair.position.set(Math.cos(a) * 1.32, Math.sin(a) * 1.32, ((i % 3) - 1) * 0.15);
      pair.rotation.z = a;
      pair.layers.set(NOINK);
      molGroup.add(pair);
    }
    nitrogenXray.add(molGroup);

    const heatMat = new THREE.MeshBasicMaterial({ color: "#f97316" });
    const heatGroup = new THREE.Group();
    heatGroup.position.set(0, 1.95, 0);
    heatGroup.name = "nx_heat_deflect";
    for (let i = 0; i < 6; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), heatMat);
      orb.layers.set(NOINK);
      heatGroup.add(orb);
    }
    nitrogenXray.add(heatGroup);
    nitrogenXray.scale.setScalar(0.68);
    nitrogenXray.position.y = 0.55;
  }
  register("nitrogen_xray", nitrogenXray);

  // 9. BRAKE GLOW SHIELD
  const brakeGlow = new THREE.Group();
  {
    const rotorMat = new THREE.MeshBasicMaterial({ color: "#ea580c" });
    const innerHotMat = new THREE.MeshBasicMaterial({ color: "#f97316" });
    const caliperMat = mats.phong("bk_cal", () => ({ color: "#475569", shininess: 65 }));
    const shieldMat = new THREE.MeshPhongMaterial({
      color: "#38bdf8",
      emissive: "#0284c7",
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.36, 32), rotorMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, 1.82, 0);
    disc.name = "hot_disc";
    const ventRing = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.12, 12, 32), innerHotMat);
    ventRing.position.set(0, 1.82, 0.19);
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 0.65), caliperMat);
    caliper.position.set(-1.12, 1.82, 0);
    const shield = new THREE.Mesh(new THREE.SphereGeometry(1.68, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), shieldMat);
    shield.position.set(0, 1.82, 0);
    shield.layers.set(NOINK);
    shield.name = "n2_shield";
    brakeGlow.add(disc, ventRing, caliper, shield);
  }
  register("brake_glow_shield", brakeGlow);

  // 10. FUSIBLE PLUG ZOOM & MELT
  const makeFusiblePlugRig = (melting: boolean) => {
    const g = new THREE.Group();
    const rim = makeAircraftTireMesh(mats, 1.26, 0.44);
    rim.position.set(0, 1.86, 0);
    rim.name = "plug_tire";
    g.add(rim);

    const plugMat = mats.phong(melting ? "plg2_hot" : "plg2_brass", () => ({
      color: melting ? "#ea580c" : "#eab308",
      shininess: 95,
    }));
    const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 6), plugMat);
    plug.rotation.x = Math.PI / 2;
    plug.position.set(0.56, 2.16, 0.34);
    plug.name = "fusible_bolt";
    g.add(plug);

    const targetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.04, 10, 32),
      new THREE.MeshBasicMaterial({ color: melting ? "#ef4444" : "#0284c7" })
    );
    targetRing.position.set(0.56, 2.16, 0.66);
    targetRing.layers.set(NOINK);
    targetRing.name = "target_ring";
    g.add(targetRing);

    const heatOrbMat = new THREE.MeshBasicMaterial({ color: "#f97316" });
    const heatOrbs = new THREE.Group();
    heatOrbs.name = "plug_heat_orbs";
    for (let i = 0; i < 5; i++) {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), heatOrbMat);
      h.layers.set(NOINK);
      heatOrbs.add(h);
    }
    g.add(heatOrbs);

    if (melting) {
      const ventMat = mats.lam("plg2_vent", () => ({ color: "#f8fafc" }));
      const vent = new THREE.Group();
      vent.position.set(0.56, 2.16, 0.68);
      vent.name = "gas_vent";
      for (let i = 0; i < 7; i++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + i * 0.04, 1), ventMat);
        puff.layers.set(NOINK);
        vent.add(puff);
      }
      g.add(vent);
    }
    return g;
  };
  register("fusible_plug_zoom", makeFusiblePlugRig(false));
  register("fusible_plug_melt", makeFusiblePlugRig(true));

  // 11. HYDRAULIC OLEO STRUT
  const hydraulicStrut = new THREE.Group();
  {
    const steelMat = mats.phong("hyd2_steel", () => ({ color: "#94a3b8", shininess: 85 }));
    const glassCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 2.1, 24),
      new THREE.MeshPhongMaterial({ color: "#bae6fd", shininess: 90, transparent: true, opacity: 0.36 })
    );
    glassCylinder.position.set(0, 3.35, 0);
    const topCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.26, 24), steelMat);
    topCollar.position.set(0, 4.38, 0);
    const botCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.26, 24), steelMat);
    botCollar.position.set(0, 2.28, 0);
    const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 20), mats.phong("hyd2_oil", () => ({ color: "#f59e0b", shininess: 60 })));
    oil.position.set(0, 3.1, 0);
    oil.name = "hyd_oil";
    const shockRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.055, 10, 32), new THREE.MeshBasicMaterial({ color: "#38bdf8" }));
    shockRing.rotation.x = Math.PI / 2;
    shockRing.position.set(0, 0.24, 0);
    shockRing.layers.set(NOINK);
    shockRing.name = "hyd_shock_ring";

    const pistonGroup = new THREE.Group();
    pistonGroup.name = "hyd_piston";
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.85, 18), steelMat);
    rod.position.set(0, 1.82, 0);
    const wheel = makeAircraftTireMesh(mats, 0.78, 0.28);
    wheel.position.set(0, 0.96, 0);
    pistonGroup.add(rod, wheel);
    hydraulicStrut.add(glassCylinder, topCollar, botCollar, oil, shockRing, pistonGroup);
  }
  register("hydraulic_strut", hydraulicStrut);

  // 12. UNIVERSAL SCIENCE FALLBACK PROPS
  const lightning = new THREE.Group();
  {
    const boltMat = new THREE.MeshBasicMaterial({ color: "#fde047" });
    [[0.3, 3.6, -0.35], [-0.35, 2.5, 0.45], [0.25, 1.4, -0.4]].forEach(([x, y, rz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.35, 0.28), boltMat);
      m.position.set(x, y, 0);
      m.rotation.z = rz;
      lightning.add(m);
    });
  }
  register("lightning_bolt", lightning);

  const molecule = new THREE.Group();
  {
    const cMat = mats.phong("mol2_c", () => ({ color: "#2563eb", shininess: 75 }));
    const oMat = mats.phong("mol2_o", () => ({ color: "#dc2626", shininess: 75 }));
    molecule.add(new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 16), cMat));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), oMat);
      orb.position.set(Math.cos(a) * 1.4, Math.sin(a) * 1.1, i % 2 ? 0.5 : -0.5);
      molecule.add(orb);
    }
    molecule.position.set(0, 2.0, 0);
  }
  register("molecule_cluster", molecule);

  const planet = new THREE.Group();
  {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 18), mats.lam("pl2_surf", () => ({ color: "#15803d" })));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.14, 12, 40), mats.phong("pl2_ring", () => ({ color: "#d97706", shininess: 50 })));
    ring.rotation.x = Math.PI * 0.38;
    planet.add(sphere, ring);
    planet.position.set(0, 2.05, 0);
  }
  register("planet_globe", planet);

  const gear = new THREE.Group();
  {
    const gMat = mats.phong("gear2_m", () => ({ color: "#d97706", shininess: 75 }));
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.34, 24), gMat);
    disc.rotation.x = Math.PI / 2;
    gear.add(disc);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.36), gMat);
      tooth.position.set(Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0);
      tooth.rotation.z = a;
      gear.add(tooth);
    }
    gear.position.set(0, 1.95, 0);
  }
  register("gear_mechanism", gear);

  const heroPed = new THREE.Group();
  {
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), mats.phong("ped2_gem", () => ({ color: "#0ea5e9", shininess: 85 })));
    gem.position.set(0, 2.0, 0);
    gem.castShadow = true;
    heroPed.add(gem);
  }
  register("hero_pedestal", heroPed);

  // ============================================================================
  // DETERMINISTIC PER-FRAME ANIMATION (Strictly Along Z-Axis on Runway!)
  // ============================================================================
  const update = (prop: AutoHeroProp, tLocal: number, tSec: number) => {
    for (const [k, grp] of props) grp.visible = k === prop;
    const active = props.get(prop);
    if (!active) return;

    switch (prop) {
      case "jet_landing": {
        // Flies & descends STRAIGHT ALONG THE RUNWAY CENTERLINE (x=0, z: -13 -> +1.5)!
        const descent = Math.max(0, 1 - tLocal / 0.45);
        const touch = Math.max(0, tLocal - 0.45);
        const bounce = touch > 0 ? Math.abs(Math.sin(touch * Math.PI * 3.5)) * 0.14 * (1 - tLocal) : 0;
        const flarePitch = descent * -0.11 + (tLocal > 0.42 && tLocal < 0.7 ? -0.05 * Math.sin(((tLocal - 0.42) / 0.28) * Math.PI) : 0);

        active.scale.setScalar(0.88);
        active.position.set(0, descent * 2.8 + bounce, -12.5 + tLocal * 13.5);
        active.rotation.set(flarePitch, 0, 0);

        // Spin landing gear wheels after touchdown
        const wheelRot = touch * 18;
        for (const wn of ["wheel_nose", "wheel_main_l", "wheel_main_r"]) {
          const w = active.getObjectByName(wn);
          if (w) w.rotation.x = wheelRot;
        }

        // Touchdown tire smoke trails straight behind main gear along -Z!
        const smoke = active.getObjectByName("jet_td_smoke");
        if (smoke) {
          smoke.visible = tLocal >= 0.42;
          smoke.children.forEach((p, idx) => {
            const u = (tSec * 1.7 + idx * 0.16) % 1;
            const side = idx % 2 === 0 ? -1.35 : 1.35;
            p.position.set(side, 0.3 + u * 0.65, -0.4 - u * 4.2);
            p.scale.setScalar(0.45 + u * 1.15);
          });
        }
        break;
      }
      case "jet_taxi_golden": {
        // Smooth golden-hour taxi straight along runway centerline (x=0, z: -7 -> +2)!
        active.scale.setScalar(0.88);
        active.position.set(0, 0, -6.5 + tLocal * 8.5);
        active.rotation.set(0, 0, 0);
        for (const wn of ["wheel_nose", "wheel_main_l", "wheel_main_r"]) {
          const w = active.getObjectByName(wn);
          if (w) w.rotation.x = tSec * 4.5;
        }
        break;
      }
      case "tire_touchdown_smoke": {
        // Wheel rolls along +Z on runway centerline; smoke & skid trail along -Z!
        const impact = Math.min(1, tLocal / 0.2);
        const dropY = (1 - impact) * 0.85;
        const compress = tLocal > 0.2 ? Math.sin(Math.min(1, (tLocal - 0.2) / 0.35) * Math.PI) * 0.26 : 0;
        const gearRig = active.getObjectByName("gear_rig");
        if (gearRig) gearRig.position.y = dropY - compress * 0.48;
        const wheel = active.getObjectByName("spin_wheel");
        if (wheel) {
          wheel.rotation.x = tSec * 11.0;
          wheel.scale.set(1, 1 - compress * 0.1, 1 + compress * 0.06);
        }
        const skid = active.getObjectByName("skid_mark");
        if (skid) skid.scale.z = 0.15 + tLocal * 1.1;
        const smoke = active.getObjectByName("smoke_trail");
        if (smoke) {
          smoke.children.forEach((c, idx) => {
            const u = (tSec * 1.5 + idx * 0.14) % 1;
            c.position.set(idx % 2 ? 0.22 : -0.22, 0.26 + u * 1.05, -0.4 - u * 4.0);
            c.scale.setScalar(0.45 + u * 1.1);
          });
        }
        break;
      }
      case "tire_spinup": {
        const wheel = active.getObjectByName("spin_wheel");
        const spinPhase = tLocal < 0.35 ? 0 : Math.pow((tLocal - 0.35) / 0.65, 2.0) * 26;
        if (wheel) wheel.rotation.x = spinPhase;
        const smoke = active.getObjectByName("smoke_trail");
        if (smoke) {
          const smokeIntensity = Math.max(0.25, 1 - tLocal * 0.7);
          smoke.children.forEach((c, idx) => {
            const u = (tSec * 1.6 + idx * 0.15) % 1;
            c.position.set(idx % 2 ? 0.2 : -0.2, 0.26 + u * 0.9, -0.4 - u * 3.6);
            c.scale.setScalar((0.4 + u * 0.9) * smokeIntensity);
          });
        }
        break;
      }
      case "four_pillars_radial": {
        active.rotation.y = tLocal * 0.9;
        const tire = active.getObjectByName("pillars_tire");
        if (tire) tire.rotation.z = -tSec * 1.2;
        for (let i = 0; i < 4; i++) {
          const p = active.getObjectByName(`pillar_${i}`);
          if (p) {
            const pop = Math.min(1, Math.max(0.01, tLocal * 3.2 - i * 0.35));
            p.scale.setScalar(pop);
            p.position.y = 1.65 + Math.sin(tSec * 4 + i * 1.4) * 0.16;
          }
        }
        break;
      }
      case "tire_cutaway_layers": {
        const explode = Math.sin(Math.min(1, tLocal * 1.35) * (Math.PI / 2));
        const outer = active.getObjectByName("cut_outer");
        const nylon = active.getObjectByName("cut_nylon");
        const steel = active.getObjectByName("cut_steel");
        const inner = active.getObjectByName("cut_inner");
        const rim = active.getObjectByName("cut_rim");
        if (outer) outer.position.z = -0.7 * explode;
        if (nylon) nylon.position.z = -0.22 * explode;
        if (steel) steel.position.z = 0.26 * explode;
        if (inner) inner.position.z = 0.74 * explode;
        if (rim) rim.position.z = 1.18 * explode;
        active.rotation.y = -0.52 + tLocal * 0.85;
        break;
      }
      case "burst_test_4x": {
        const tire = active.getObjectByName("burst_tire");
        if (tire) tire.scale.setScalar(1 + Math.sin(tSec * 10) * 0.02 + tLocal * 0.09);
        const lever = active.getObjectByName("pump_lever");
        if (lever) lever.rotation.z = -0.35 + Math.sin(tSec * 10) * 0.35;
        const pivot = active.getObjectByName("gauge_needle");
        if (pivot) pivot.rotation.z = 2.1 - tLocal * 3.9;
        const pulses = active.getObjectByName("burst_pulses");
        if (pulses) {
          const hoseCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(-1.4, 1.25, 0.45),
            new THREE.Vector3(-0.95, 1.85, 0.68),
            new THREE.Vector3(-0.55, 1.65, 0.65),
            new THREE.Vector3(-0.1, 1.48, 0.48)
          );
          pulses.children.forEach((orb, idx) => {
            const u = (tSec * 1.6 + idx / 4) % 1;
            orb.position.copy(hoseCurve.getPoint(u));
          });
        }
        break;
      }
      case "tire_pressure_200psi": {
        const ring = active.getObjectByName("psi_ring");
        if (ring) ring.scale.setScalar(0.88 + ((tSec * 1.6) % 0.48));
        const gasStream = active.getObjectByName("psi_gas_stream");
        if (gasStream) {
          const hoseCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(-1.8, 2.42, 0.35),
            new THREE.Vector3(-1.2, 2.52, 0.68),
            new THREE.Vector3(-0.75, 1.75, 0.68),
            new THREE.Vector3(-0.2, 1.58, 0.48)
          );
          gasStream.children.forEach((orb, idx) => {
            const u = (tSec * 1.8 + idx / 5) % 1;
            orb.position.copy(hoseCurve.getPoint(u));
          });
        }
        active.rotation.y = Math.sin(tLocal * Math.PI) * 0.22;
        break;
      }
      case "tire_vs_six_cars": {
        for (let i = 0; i < 6; i++) {
          const mini = active.getObjectByName(`car_tire_${i}`);
          if (mini) {
            const tDrop = Math.min(1, Math.max(0, tLocal * 5.2 - i * 0.55));
            const bounce = Math.sin(tDrop * Math.PI) * 0.35 * (1 - tDrop);
            mini.position.y = 0.54 + i * 0.37 + (1 - tDrop) * 1.4 + bounce;
            mini.scale.setScalar(tDrop > 0.02 ? 0.3 + tDrop * 0.7 : 0.01);
          }
        }
        break;
      }
      case "nitrogen_xray": {
        const mol = active.getObjectByName("n2_orbit");
        if (mol) {
          mol.rotation.z = tSec * 1.3;
          mol.children.forEach((pair, idx) => {
            pair.rotation.z = idx * 0.6 + tSec * 2.4;
          });
        }
        const heatDeflect = active.getObjectByName("nx_heat_deflect");
        if (heatDeflect) {
          heatDeflect.children.forEach((orb, idx) => {
            const a = (idx / 6) * Math.PI * 2 + 0.4;
            const u = (tSec * 1.4 + idx * 0.17) % 1;
            const r = u < 0.5 ? 2.5 - u * 1.5 : 1.75 + (u - 0.5) * 1.9;
            orb.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.35);
          });
        }
        active.rotation.y = Math.sin(tLocal * Math.PI) * 0.22;
        break;
      }
      case "brake_glow_shield": {
        const disc = active.getObjectByName("hot_disc");
        if (disc) disc.rotation.z = tSec * 3.2;
        const shield = active.getObjectByName("n2_shield");
        if (shield) shield.scale.setScalar(0.95 + Math.sin(tSec * 5) * 0.05);
        break;
      }
      case "fusible_plug_zoom": {
        const ring = active.getObjectByName("target_ring");
        if (ring) ring.scale.setScalar(0.92 + Math.sin(tSec * 7) * 0.12);
        const heatOrbs = active.getObjectByName("plug_heat_orbs");
        if (heatOrbs) {
          heatOrbs.children.forEach((h, idx) => {
            const u = (tSec * 1.5 + idx / 5) % 1;
            h.position.set(0.15 + u * 0.4, 1.48 + u * 0.65, 0.48);
            h.scale.setScalar(1.0 - u * 0.3);
          });
        }
        break;
      }
      case "fusible_plug_melt": {
        const heatOrbs = active.getObjectByName("plug_heat_orbs");
        if (heatOrbs) {
          heatOrbs.children.forEach((h, idx) => {
            const u = (tSec * 1.8 + idx / 5) % 1;
            h.position.set(0.15 + u * 0.4, 1.48 + u * 0.65, 0.48);
          });
        }
        const tire = active.getObjectByName("plug_tire");
        const deflate = Math.max(0, (tLocal - 0.22) / 0.78);
        if (tire) tire.scale.set(1 + deflate * 0.09, 1 - deflate * 0.22, 1);
        const bolt = active.getObjectByName("fusible_bolt");
        if (bolt) bolt.position.y = 2.16 - deflate * 0.36;
        const vent = active.getObjectByName("gas_vent");
        if (vent) {
          vent.visible = tLocal > 0.18;
          vent.children.forEach((p, idx) => {
            const u = (tSec * 2.2 + idx * 0.14) % 1;
            p.position.set(u * 1.15, u * 0.12 - idx * 0.03, u * 1.35);
            p.scale.setScalar(0.45 + u * 0.95);
          });
        }
        break;
      }
      case "hydraulic_strut": {
        const compress = Math.sin(tLocal * Math.PI * 2) * 0.5 + 0.5;
        const piston = active.getObjectByName("hyd_piston");
        if (piston) piston.position.y = compress * 0.36;
        const oil = active.getObjectByName("hyd_oil");
        if (oil) oil.scale.y = 1.1 - compress * 0.32;
        const ring = active.getObjectByName("hyd_shock_ring");
        if (ring) {
          const u = (tSec * 1.6) % 1;
          ring.scale.setScalar(0.6 + u * 1.4);
        }
        break;
      }
      default: {
        active.rotation.y = tSec * 1.1;
        break;
      }
    }
  };

  return { group, update };
}
