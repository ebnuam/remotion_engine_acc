// High-Craft Procedural 3D Environments & Detailed Aerospace/Science Hero Assemblies
// Matches the 3D cinematic depth of Episode 001 (Daun Hijau) & Episode 002 (Badak Jawa):
// - Sculpted LatheGeometry & ExtrudeGeometry silhouettes (no blocky Mario-style primitives)
// - High-res procedural CanvasTextures (weathered skid-marked tarmac, longitudinal aviation tire grooves,
//   woven nylon/steel cutaway plies, riveted aircraft fuselage with cabin windows, brushed titanium)
// - Metallic Phong speculars + twoTone shading calibrated for Stage25D InkPass & ToneMappingMode.NEUTRAL.

import * as THREE from "three";
import {
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
// 1. RICH PROCEDURAL CANVASTEXTURES (Realism without heavy external PBR assets)
// ============================================================================

function makeWeatheredRunwayTex(): THREE.CanvasTexture {
  return ctex("auto25d_runway_weathered_v2", 512, 512, (g) => {
    // Realistic weathered charcoal asphalt base
    g.fillStyle = "#363d47";
    g.fillRect(0, 0, 512, 512);

    // Multi-scale aggregate asphalt grain
    for (let i = 0; i < 2400; i++) {
      const x = (i * 97) % 512;
      const y = (i * 193) % 512;
      const v = i % 3 === 0 ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.09)";
      g.fillStyle = v;
      g.fillRect(x, y, 2 + (i % 3), 2 + (i % 2));
    }

    // Concrete slab expansion joints
    g.strokeStyle = "rgba(15,23,42,0.22)";
    g.lineWidth = 2;
    for (let y = 0; y < 512; y += 128) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }

    // Subtle dark rubber touchdown skid marks down the center-left/right tracks
    const gradL = g.createLinearGradient(150, 0, 220, 0);
    gradL.addColorStop(0, "rgba(12,15,20,0)");
    gradL.addColorStop(0.5, "rgba(12,15,20,0.34)");
    gradL.addColorStop(1, "rgba(12,15,20,0)");
    g.fillStyle = gradL;
    g.fillRect(150, 0, 70, 512);

    const gradR = g.createLinearGradient(292, 0, 362, 0);
    gradR.addColorStop(0, "rgba(12,15,20,0)");
    gradR.addColorStop(0.5, "rgba(12,15,20,0.34)");
    gradR.addColorStop(1, "rgba(12,15,20,0)");
    g.fillStyle = gradR;
    g.fillRect(292, 0, 70, 512);

    // Crisp weathered white side stripes & dashed centerline
    g.fillStyle = "#e2e8f0";
    g.fillRect(30, 0, 12, 512);
    g.fillRect(470, 0, 12, 512);
    g.fillRect(247, 26, 18, 178);
    g.fillRect(247, 282, 18, 178);

    // Touchdown aiming zone threshold stripes
    g.fillStyle = "rgba(226,232,240,0.78)";
    for (let x = 68; x <= 148; x += 24) {
      g.fillRect(x, 60, 14, 110);
      g.fillRect(512 - x - 14, 60, 14, 110);
    }

    // Subtle amber taxiway shoulder edge
    g.fillStyle = "#d97706";
    g.fillRect(8, 0, 7, 512);
    g.fillRect(497, 0, 7, 512);
  });
}

function makeAviationTireTreadTex(): THREE.CanvasTexture {
  return ctex("auto25d_tire_tread_v2", 512, 512, (g) => {
    // Rich vulcanized matte rubber charcoal
    g.fillStyle = "#232830";
    g.fillRect(0, 0, 512, 512);

    // Micro rubber grain
    for (let i = 0; i < 2000; i++) {
      g.fillStyle = i % 2 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.16)";
      g.fillRect((i * 71) % 512, (i * 139) % 512, 3, 2);
    }

    // Authentic aviation longitudinal circumferential grooves (alur garis lurus memanjang!)
    const grooves = [150, 198, 256, 314, 362];
    for (const gy of grooves) {
      g.fillStyle = "#0b0e13";
      g.fillRect(0, gy - 8, 512, 16);
      g.fillStyle = "rgba(148,163,184,0.14)";
      g.fillRect(0, gy + 8, 512, 3);
    }

    // Subtle molded sidewall concentric ribs + inspection white index tick
    g.strokeStyle = "rgba(148,163,184,0.18)";
    g.lineWidth = 4;
    for (const y of [45, 78, 434, 467]) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }
    // Crisp technical aviation tire white alignment index mark (subtle, realistic)
    g.fillStyle = "#e2e8f0";
    g.fillRect(18, 54, 28, 16);
    g.fillRect(18, 442, 28, 16);
  });
}

function makeFuselageSkinTex(): THREE.CanvasTexture {
  // LatheGeometry maps V along the profile (tail->nose) and U around the circumference!
  return ctex("auto25d_fuselage_skin_v3", 512, 512, (g) => {
    // Crisp off-white aerospace composite upper fuselage + metallic slate belly around U
    g.fillStyle = "#f1f5f9";
    g.fillRect(0, 0, 512, 512);

    // Lower belly shading bands (around circumference U)
    g.fillStyle = "#cbd5e1";
    g.fillRect(0, 0, 128, 512);
    g.fillRect(384, 0, 128, 512);

    // Subtle circumferential panel seams along fuselage length (V)
    g.strokeStyle = "rgba(71,85,105,0.16)";
    g.lineWidth = 1.5;
    for (let y = 0; y < 512; y += 36) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }

    // Horizontal airline cheatline stripes running along BOTH sides of fuselage (along V!)
    for (const sideX of [130, 358]) {
      g.fillStyle = "#1e3a5f";
      g.fillRect(sideX, 42, 20, 415);
      g.fillStyle = "#d97706";
      g.fillRect(sideX === 130 ? sideX - 8 : sideX + 20, 42, 8, 415);
    }

    // Realistic passenger cabin window rows running along BOTH sides (along V!)
    for (let y = 115; y <= 385; y += 18) {
      for (const wx of [158, 340]) {
        g.fillStyle = "#0f172a";
        g.beginPath();
        g.roundRect(wx, y, 14, 10, 4);
        g.fill();
        g.fillStyle = "rgba(186,230,253,0.5)";
        g.fillRect(wx + 2, y + 2, 4, 4);
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

function makeAerospaceStudioFloorTex(): THREE.CanvasTexture {
  return ctex("auto25d_studio_floor_v2", 512, 512, (g) => {
    // Sleek dark slate aerospace engineering lab floor (NOT neon toy blue!)
    g.fillStyle = "#162033";
    g.fillRect(0, 0, 512, 512);
    // Fine brushed concrete grain
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = i % 2 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.08)";
      g.fillRect((i * 83) % 512, (i * 157) % 512, 3, 2);
    }
    // Crisp technical CAD measurement grid
    g.strokeStyle = "rgba(56, 189, 248, 0.16)";
    g.lineWidth = 1.5;
    for (let i = 0; i <= 512; i += 64) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 512);
      g.stroke();
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(512, i);
      g.stroke();
    }
    g.strokeStyle = "rgba(125, 211, 252, 0.34)";
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, 509, 509);
  });
}

function makePressureGaugeDialTex(): THREE.CanvasTexture {
  return ctex("auto25d_gauge_dial_v2", 512, 512, (g) => {
    g.fillStyle = "#f8fafc";
    g.beginPath();
    g.arc(256, 256, 240, 0, Math.PI * 2);
    g.fill();

    // Colored scale arcs (safe green -> caution amber -> burst 4x zone)
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

    // Precision tick marks
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

    // Crisp dial markings
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
// 2. SWITCHABLE CINEMATIC 3D ENVIRONMENTS
// ============================================================================

export interface EnvRig {
  group: THREE.Group;
  setTheme: (theme: AutoEnvTheme) => void;
}

export function buildEnvironments(parent: THREE.Object3D): EnvRig {
  const group = new THREE.Group();
  parent.add(group);
  const mats = createMaterialCache();
  const themes = new Map<AutoEnvTheme, THREE.Group>();

  // 1. REALISTIC AIRPORT RUNWAY ENVIRONMENT (skid-marked tarmac, terminal, ATC tower, distant hills, edge lamps)
  {
    const g = new THREE.Group();
    const grassMat = mats.lam("rw2_grass", () => ({ map: grassHD() }));
    const asphaltTex = makeWeatheredRunwayTex();
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(1, 18);
    const asphaltMat = mats.lam("rw2_asphalt", () => ({ map: asphaltTex }));
    const concreteMat = mats.lam("rw2_concrete", () => ({ map: stoneHD("rwConc") }));
    const apronMat = mats.lam("rw2_apron", () => ({ map: cobbleHD() }));
    const steelRoofMat = mats.phong("rw2_roof", () => ({ color: "#475569", shininess: 40 }));
    const glassMat = mats.phong("rw2_glass", () => ({ color: "#1e3a5f", shininess: 70 }));
    const trimMat = mats.lam("rw2_trim", () => ({ color: "#e2e8f0" }));
    const hillMat = mats.lam("rw2_hill", () => ({ color: "#64748b" }));
    const barkMat = mats.lam("rw2_bark", () => ({ color: "#785038" }));
    const leafMat = mats.lam("rw2_leaf", () => ({ color: "#4d8b47" }));
    const lampPostMat = mats.lam("rw2_lamp", () => ({ color: "#334155" }));
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: "#fef08a" });

    const batch = new StaticBatch();

    // Airfield grass plain
    const fieldGeo = new THREE.PlaneGeometry(420, 420);
    fieldGeo.rotateX(-Math.PI / 2);
    const fUv = fieldGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < fUv.count; i++) fUv.setXY(i, fUv.getX(i) * 38, fUv.getY(i) * 38);
    batch.add(fieldGeo, grassMat, new THREE.Matrix4().makeTranslation(0, -0.05, 0));

    // Concrete runway shoulders
    const shoulderGeo = new THREE.PlaneGeometry(20, 260);
    shoulderGeo.rotateX(-Math.PI / 2);
    batch.add(shoulderGeo, apronMat, new THREE.Matrix4().makeTranslation(0, -0.02, -45));

    // Main weathered asphalt runway
    const rwGeo = new THREE.PlaneGeometry(14.8, 260);
    rwGeo.rotateX(-Math.PI / 2);
    batch.add(rwGeo, asphaltMat, new THREE.Matrix4().makeTranslation(0, 0, -45));

    // Distant layered mountain ridge along horizon for cinematic atmospheric depth
    const ridgeSpecs: [number, number, number, number][] = [
      [-65, -135, 38, 18],
      [-20, -148, 46, 22],
      [35, -142, 42, 19],
      [85, -130, 36, 16],
    ];
    for (const [rx, rz, rw, rh] of ridgeSpecs) {
      const mGeo = new THREE.ConeGeometry(rw, rh, 7);
      batch.add(mGeo, hillMat, new THREE.Matrix4().makeTranslation(rx, rh * 0.42, rz));
    }

    // Architectural ATC Control Tower (left background, clean tiered concrete + angled cab)
    batch.add(
      new THREE.CylinderGeometry(1.5, 2.5, 13.5, 12),
      concreteMat,
      new THREE.Matrix4().makeTranslation(-22, 6.75, -42)
    );
    batch.add(
      new THREE.CylinderGeometry(3.5, 2.2, 1.4, 12),
      trimMat,
      new THREE.Matrix4().makeTranslation(-22, 14.0, -42)
    );
    batch.add(
      new THREE.CylinderGeometry(3.9, 3.2, 2.6, 12),
      glassMat,
      new THREE.Matrix4().makeTranslation(-22, 15.8, -42)
    );
    batch.add(
      new THREE.CylinderGeometry(4.3, 4.1, 0.65, 12),
      steelRoofMat,
      new THREE.Matrix4().makeTranslation(-22, 17.4, -42)
    );
    batch.add(
      new THREE.SphereGeometry(0.95, 12, 10),
      trimMat,
      new THREE.Matrix4().makeTranslation(-22, 18.6, -42)
    );

    // Curved modern airport terminal / hangar (right background)
    batch.add(
      new THREE.BoxGeometry(20, 6.2, 12),
      concreteMat,
      new THREE.Matrix4().makeTranslation(24, 3.1, -46)
    );
    batch.add(
      new THREE.BoxGeometry(18.6, 3.2, 0.3),
      glassMat,
      new THREE.Matrix4().makeTranslation(24, 3.4, -39.9)
    );
    const roofGeo = new THREE.CylinderGeometry(6.5, 6.5, 21.2, 16, 1, false, 0, Math.PI);
    roofGeo.rotateZ(Math.PI / 2);
    batch.add(roofGeo, steelRoofMat, new THREE.Matrix4().makeTranslation(24, 6.2, -46));

    // Subtle distant perimeter trees outside airfield
    addStorybookTree(batch, barkMat, leafMat, [-30, 0, -28], 11, 6.5);
    addStorybookTree(batch, barkMat, leafMat, [-36, 0, -52], 12, 7.2);
    addStorybookTree(batch, barkMat, leafMat, [34, 0, -24], 13, 6.2);

    // Realistic low-profile aviation runway edge lights (dark housings + warm glowing lenses)
    for (let z = 14; z >= -86; z -= 14) {
      for (const sx of [-7.8, 7.8]) {
        batch.add(
          new THREE.CylinderGeometry(0.14, 0.2, 0.42, 8),
          lampPostMat,
          new THREE.Matrix4().makeTranslation(sx, 0.21, z)
        );
        batch.add(
          new THREE.SphereGeometry(0.13, 8, 8),
          lampBulbMat,
          new THREE.Matrix4().makeTranslation(sx, 0.46, z)
        );
      }
    }

    batch.build(g, true, true);
    group.add(g);
    themes.set("runway", g);
  }

  // 2. AEROSPACE ENGINEERING LAB STUDIO (dark brushed slate, machined aluminum turntable, subtle cyan telemetry)
  {
    const g = new THREE.Group();
    const floorTex = makeAerospaceStudioFloorTex();
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(26, 26);
    const floorMat = mats.lam("lab2_floor", () => ({ map: floorTex }));
    const steelBaseMat = mats.phong("lab2_base", () => ({ color: "#334155", shininess: 55 }));
    const brushedDeckMat = mats.phong("lab2_deck", () => ({ color: "#1e293b", shininess: 40 }));
    const ledRingMat = new THREE.MeshBasicMaterial({ color: "#38bdf8" });
    const gantryMat = mats.phong("lab2_gantry", () => ({ color: "#475569", shininess: 45 }));

    const floorGeo = new THREE.PlaneGeometry(260, 260);
    floorGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    g.add(floor);

    // Machined tiered engineering turntable pedestal
    const lowerBase = new THREE.Mesh(new THREE.CylinderGeometry(3.75, 4.1, 0.22, 40), steelBaseMat);
    lowerBase.position.y = 0.11;
    lowerBase.receiveShadow = true;
    g.add(lowerBase);

    const upperDeck = new THREE.Mesh(new THREE.CylinderGeometry(3.35, 3.45, 0.14, 40), brushedDeckMat);
    upperDeck.position.y = 0.28;
    upperDeck.receiveShadow = true;
    g.add(upperDeck);

    const ledRing = new THREE.Mesh(new THREE.TorusGeometry(3.48, 0.045, 10, 64), ledRingMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.y = 0.24;
    g.add(ledRing);

    // Background architectural test-chamber columns for 3D depth parallax
    for (const [cx, cz] of [
      [-8.5, -10.5],
      [8.5, -10.5],
      [-14.0, -18.0],
      [14.0, -18.0],
    ]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.85, 14, 0.85), gantryMat);
      col.position.set(cx, 7, cz);
      g.add(col);
    }

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
    const bldA = mats.lam("urb2_bA", () => ({ color: "#e2e8f0" }));
    const bldB = mats.lam("urb2_bB", () => ({ color: "#cbd5e1" }));
    const bldC = mats.lam("urb2_bC", () => ({ color: "#94a3b8" }));

    const batch = new StaticBatch();
    const roadGeo = new THREE.PlaneGeometry(16, 220);
    roadGeo.rotateX(-Math.PI / 2);
    batch.add(roadGeo, roadMat);
    const colors = [bldA, bldB, bldC];
    for (let i = 0; i < 6; i++) {
      const z = -10 - i * 14;
      const h1 = 9 + (i % 3) * 4;
      const h2 = 11 + ((i + 1) % 3) * 3;
      batch.add(
        new THREE.BoxGeometry(8, h1, 10),
        colors[i % 3],
        new THREE.Matrix4().makeTranslation(-13, h1 / 2, z)
      );
      batch.add(
        new THREE.BoxGeometry(8, h2, 10),
        colors[(i + 1) % 3],
        new THREE.Matrix4().makeTranslation(13, h2 / 2, z)
      );
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

  const setTheme = (theme: AutoEnvTheme) => {
    for (const [k, grp] of themes) grp.visible = k === theme;
  };
  setTheme("runway");

  return { group, setTheme };
}

// ============================================================================
// 3. SCULPTED AEROSPACE 3D HERO MODELS (Lathe + Extrude + Metallic Phong)
// ============================================================================

/**
 * Builds a realistic sculpted aviation tire with longitudinal tread grooves,
 * recessed forged aluminum wheel hub, titanium lug bolts, and subtle white spin index mark.
 */
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

  // Sculpted flattened-crown aviation tire profile via Torus + subtle Z-stretch
  const tireGeo = new THREE.TorusGeometry(radius, tube, 22, 44);
  tireGeo.scale(1, 1, 1.15);
  const tire = new THREE.Mesh(tireGeo, rubberMat);
  tire.castShadow = true;
  tire.receiveShadow = true;
  g.add(tire);

  // Outer forged aluminum bead lip flange (both sides)
  for (const side of [-1, 1]) {
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.68, tube * 0.14, 12, 32),
      alloyRimMat
    );
    lip.position.z = side * tube * 0.62;
    g.add(lip);
  }

  // Deep recessed wheel dish + inner barrel
  const rimBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.66, radius * 0.66, tube * 1.1, 28),
    darkRecessMat
  );
  rimBarrel.rotation.x = Math.PI / 2;
  rimBarrel.castShadow = true;
  g.add(rimBarrel);

  // Forged wheel face plate
  const facePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, tube * 1.24, 24),
    alloyRimMat
  );
  facePlate.rotation.x = Math.PI / 2;
  g.add(facePlate);

  // Central machined axle cap
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.24, radius * 0.28, tube * 1.5, 18),
    steelCapMat
  );
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  // 10 realistic titanium tie-bolts around rim perimeter
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, tube * 1.38, 6), boltMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(Math.cos(a) * radius * 0.43, Math.sin(a) * radius * 0.43, 0);
    g.add(bolt);
  }

  // Subtle white painted tire-slippage alignment mark (real aviation maintenance standard!)
  const slipMark = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 0.34, 0.075, tube * 1.32),
    indexMarkMat
  );
  slipMark.position.set(radius * 0.62, 0, 0);
  g.add(slipMark);

  return g;
}

/**
 * Builds a realistic sculpted commercial jetliner (Boeing 737 / A320 proportions):
 * LatheGeometry aerodynamic fuselage, swept airfoil ExtrudeGeometry wings with winglets,
 * hollow turbofan nacelles with fan blades, and realistic twin-wheel landing gear bogies.
 */
function makeSculptedAirliner(mats: ReturnType<typeof createMaterialCache>): THREE.Group {
  const jet = new THREE.Group();
  const skinTex = makeFuselageSkinTex();
  const bodyMat = mats.phong("jet2_body", () => ({ map: skinTex, shininess: 35 }));
  const wingMat = mats.phong("jet2_wing", () => ({ color: "#e2e8f0", shininess: 40 }));
  const navyMat = mats.phong("jet2_navy", () => ({ color: "#1e3a5f", shininess: 50 }));
  const accentMat = mats.lam("jet2_amber", () => ({ color: "#d97706" }));
  const chromeMat = mats.phong("jet2_chrome", () => ({ color: "#cbd5e1", shininess: 90 }));
  const darkMetalMat = mats.phong("jet2_dark", () => ({ color: "#1e293b", shininess: 50 }));
  const glassMat = mats.phong("jet2_glass", () => ({ color: "#0f172a", shininess: 95 }));

  // 1. Sculpted Aerodynamic Fuselage (LatheGeometry rotated horizontally along X)
  const fusePts = [
    new THREE.Vector2(0.01, -5.2), // Tail APU cone
    new THREE.Vector2(0.32, -4.6),
    new THREE.Vector2(0.75, -3.5),
    new THREE.Vector2(1.06, -2.0),
    new THREE.Vector2(1.08, 2.2),
    new THREE.Vector2(0.98, 3.2),
    new THREE.Vector2(0.68, 4.15),
    new THREE.Vector2(0.32, 4.75),
    new THREE.Vector2(0.01, 5.05), // Nose radome tip
  ];
  const fuseGeo = new THREE.LatheGeometry(fusePts, 28);
  fuseGeo.rotateZ(-Math.PI / 2);
  const fuse = new THREE.Mesh(fuseGeo, bodyMat);
  fuse.position.y = 2.65;
  fuse.castShadow = true;
  fuse.receiveShadow = true;
  jet.add(fuse);

  // Wrap-around dark glass cockpit windshield
  const cockpitGeo = new THREE.CylinderGeometry(0.84, 0.94, 0.55, 16, 1, false, -0.75, 1.5);
  cockpitGeo.rotateZ(-Math.PI / 2);
  cockpitGeo.rotateX(Math.PI / 2);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
  cockpit.position.set(3.75, 2.98, 0);
  jet.add(cockpit);

  // 2. Swept Tapered Airfoil Wings (left & right with upturned winglets)
  for (const side of [-1, 1]) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(1.5, 0);
    wingShape.lineTo(-1.1, 0);
    wingShape.lineTo(-2.3, 5.6 * side);
    wingShape.lineTo(-1.3, 5.6 * side);
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
    wing.position.set(0.3, 2.35, 0);
    wing.rotation.x = side * -0.06; // Realistic slight upward dihedral
    wing.castShadow = true;
    jet.add(wing);

    // Upturned blended winglet
    const wl = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.1), navyMat);
    wl.position.set(-1.55, 2.92, 5.65 * side);
    wl.rotation.x = side * 0.22;
    wl.rotation.z = 0.25;
    jet.add(wl);

    // Sculpted Under-Wing Turbofan Engine Nacelle
    const engGrp = new THREE.Group();
    const nacellePts = [
      new THREE.Vector2(0.36, -0.95), // Exhaust nozzle
      new THREE.Vector2(0.5, -0.55),
      new THREE.Vector2(0.54, 0.35),
      new THREE.Vector2(0.49, 0.85), // Front lip
    ];
    const nacGeo = new THREE.LatheGeometry(nacellePts, 20);
    nacGeo.rotateZ(-Math.PI / 2);
    const nac = new THREE.Mesh(nacGeo, navyMat);
    nac.castShadow = true;
    engGrp.add(nac);

    // Polished chrome intake lip ring
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.055, 10, 22), chromeMat);
    lip.rotation.y = Math.PI / 2;
    lip.position.x = 0.84;
    engGrp.add(lip);

    // Dark recessed fan face + silver spinner cone
    const fanBack = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16), darkMetalMat);
    fanBack.rotation.z = Math.PI / 2;
    fanBack.position.x = 0.65;
    engGrp.add(fanBack);

    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 12), chromeMat);
    spinner.rotation.z = -Math.PI / 2;
    spinner.position.x = 0.78;
    engGrp.add(spinner);

    // Engine pylon connecting to wing
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.18), wingMat);
    pylon.position.set(0.15, 0.45, 0);
    engGrp.add(pylon);

    engGrp.position.set(0.75, 1.72, 2.15 * side);
    jet.add(engGrp);
  }

  // 3. Swept Vertical Tail Fin (ExtrudeGeometry) + Navy/Amber Livery
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
  const fin = new THREE.Mesh(finGeo, navyMat);
  fin.position.set(-4.35, 3.1, 0);
  fin.castShadow = true;
  jet.add(fin);

  const finStripe = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.24), accentMat);
  finStripe.position.set(-3.95, 4.75, 0);
  finStripe.rotation.z = 0.55;
  jet.add(finStripe);

  // Horizontal tail stabilizers
  for (const side of [-1, 1]) {
    const hsShape = new THREE.Shape();
    hsShape.moveTo(0.7, 0);
    hsShape.lineTo(-0.5, 0);
    hsShape.lineTo(-1.15, 2.15 * side);
    hsShape.lineTo(-0.55, 2.15 * side);
    hsShape.closePath();
    const hsGeo = new THREE.ExtrudeGeometry(hsShape, { depth: 0.1, bevelEnabled: false });
    hsGeo.rotateX(Math.PI / 2);
    const hs = new THREE.Mesh(hsGeo, wingMat);
    hs.position.set(-4.1, 3.05, 0);
    jet.add(hs);
  }

  // 4. Realistic Twin-Wheel Landing Gear Assemblies (Nose + Left/Right Main Gear)
  const addGearBogie = (gx: number, gz: number, wheelR: number, dual: boolean) => {
    const bogie = new THREE.Group();
    const upperStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 1.1, 12), wingMat);
    upperStrut.position.y = 1.48;
    const chromePiston = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.72, 12), chromeMat);
    chromePiston.position.y = 0.88;
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.05, 8), darkMetalMat);
    brace.position.set(0.32, 1.4, 0);
    brace.rotation.z = 0.48;
    bogie.add(upperStrut, chromePiston, brace);

    const offsets = dual ? [-0.26, 0.26] : [0];
    for (const wz of offsets) {
      const w = makeAircraftTireMesh(mats, wheelR, wheelR * 0.4);
      w.position.set(0, wheelR * 1.4, wz);
      bogie.add(w);
    }
    bogie.position.set(gx, 0, gz);
    jet.add(bogie);
  };
  addGearBogie(3.1, 0, 0.34, true);
  addGearBogie(-0.1, -1.35, 0.44, true);
  addGearBogie(-0.1, 1.35, 0.44, true);

  return jet;
}

// ============================================================================
// 4. HERO PROP RIG (All 14 Aviation + 5 General Science Assemblies Upgraded)
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

  // 1. SCULPTED AIRLINER LANDING & GOLDEN TAXI
  const jetLanding = makeSculptedAirliner(mats);
  register("jet_landing", jetLanding);
  const jetTaxi = makeSculptedAirliner(mats);
  register("jet_taxi_golden", jetTaxi);

  // 2. TIRE TOUCHDOWN SMOKE & SPIN-UP (Heavy Oleo Fork + Scissor Torque Link + Sculpted Grooved Tire)
  const makeSpinTireAssembly = (tag: string) => {
    const g = new THREE.Group();
    const strutMat = mats.phong(`${tag}_strut`, () => ({ color: "#cbd5e1", shininess: 75 }));
    const darkMat = mats.phong(`${tag}_dark`, () => ({ color: "#334155", shininess: 45 }));
    const smokeMat = mats.lam(`${tag}_smoke`, () => ({ color: "#e2e8f0" }));

    const outerCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 2.2, 16), strutMat);
    outerCylinder.position.set(0, 3.85, 0);
    const chromeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.3, 16), strutMat);
    chromeRod.position.set(0, 2.45, 0);
    // Scissor torque link behind strut
    const linkTop = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.16), darkMat);
    linkTop.position.set(-0.34, 2.95, 0);
    linkTop.rotation.z = -0.45;
    const linkBot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.16), darkMat);
    linkBot.position.set(-0.34, 2.45, 0);
    linkBot.rotation.z = 0.45;
    g.add(outerCylinder, chromeRod, linkTop, linkBot);

    const tire = makeAircraftTireMesh(mats, 1.24, 0.48);
    tire.position.set(0, 1.72, 0);
    tire.name = "spin_wheel";
    g.add(tire);

    const smokeGroup = new THREE.Group();
    smokeGroup.name = "smoke_trail";
    for (let i = 0; i < 7; i++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36 + i * 0.1, 1), smokeMat);
      puff.position.set(-0.9 - i * 0.65, 0.42 + i * 0.16, (i % 2 ? 0.22 : -0.22));
      smokeGroup.add(puff);
    }
    g.add(smokeGroup);
    return g;
  };
  register("tire_touchdown_smoke", makeSpinTireAssembly("td2"));
  register("tire_spinup", makeSpinTireAssembly("sp2"));

  // 3. FOUR ENGINEERING PILLARS RADIAL (Central Sculpted Tire + 4 Sleek Glass/Alloy Telemetry Cards)
  const fourPillars = new THREE.Group();
  {
    const centerTire = makeAircraftTireMesh(mats, 1.05, 0.4);
    centerTire.position.set(0, 1.55, 0);
    fourPillars.add(centerTire);

    const frameMat = mats.phong("fp_frame", () => ({ color: "#cbd5e1", shininess: 70 }));
    const accentColors = ["#0284c7", "#d97706", "#059669", "#ea580c"];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const cardGrp = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.3, 0.16), frameMat);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 1.12, 0.2),
        mats.lam(`fp_p_${i}`, () => ({ color: accentColors[i] }))
      );
      cardGrp.add(frame, panel);
      cardGrp.position.set(Math.cos(a) * 2.5, 1.65, Math.sin(a) * 2.5);
      cardGrp.lookAt(0, 1.65, 0);
      cardGrp.name = `pillar_${i}`;
      fourPillars.add(cardGrp);
    }
  }
  register("four_pillars_radial", fourPillars);

  // 4. REALISTIC MULTI-LAYER CUTAWAY TIRE (Textured Rubber + Woven Nylon Plies + Braided Steel Belt)
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

    const outer = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.5, 22, 40, Math.PI * 1.42), rubberMat);
    outer.castShadow = true;
    tireCutaway.add(outer);

    const nylon = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.39, 18, 36, Math.PI * 1.64), nylonMat);
    tireCutaway.add(nylon);

    const steel = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.28, 18, 36, Math.PI * 1.84), steelMat);
    tireCutaway.add(steel);

    const inner = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.16, 14, 32), linerMat);
    tireCutaway.add(inner);

    const alloyRim = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.52, 28), rimMat);
    alloyRim.rotation.x = Math.PI / 2;
    tireCutaway.add(alloyRim);

    const hubMat = mats.phong("cut2_hub", () => ({ color: "#64748b", shininess: 85 }));
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.64, 18), hubMat);
    hub.rotation.x = Math.PI / 2;
    tireCutaway.add(hub);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.58, 6), hubMat);
      b.rotation.x = Math.PI / 2;
      b.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0);
      tireCutaway.add(b);
    }

    tireCutaway.position.set(0, 1.95, 0);
  }
  register("tire_cutaway_layers", tireCutaway);

  // 5. HYDROSTATIC 4X BURST TEST RIG (Real Aerospace Pressure Manometer + Steel Test Frame, NOT Toy Pumps!)
  const burstTest = new THREE.Group();
  {
    const tire = makeAircraftTireMesh(mats, 1.15, 0.44);
    tire.position.set(-0.35, 1.68, 0);
    tire.name = "burst_tire";
    burstTest.add(tire);

    const steelMat = mats.phong("bt_steel", () => ({ color: "#64748b", shininess: 70 }));
    const brassMat = mats.phong("bt_brass", () => ({ color: "#d97706", shininess: 80 }));
    const dialTex = makePressureGaugeDialTex();
    const dialMat = new THREE.MeshBasicMaterial({ map: dialTex });

    // Brushed steel hydraulic manifold columns on left/right
    for (const [px, pz] of [
      [-2.1, 0.5],
      [-2.1, -0.5],
    ]) {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 1.5, 16), steelMat);
      cyl.position.set(px, 1.05, pz);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 16), brassMat);
      cap.position.set(px, 1.85, pz);
      burstTest.add(cyl, cap);
    }

    // Large precision 3D Manometer Dial Gauge on right
    const gaugeGrp = new THREE.Group();
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.28, 32), steelMat);
    housing.rotation.x = Math.PI / 2;
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.08, 12, 32), brassMat);
    bezel.position.z = 0.14;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.86, 32), dialMat);
    face.position.z = 0.15;
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.72, 0.04),
      new THREE.MeshBasicMaterial({ color: "#dc2626" })
    );
    needle.position.set(0, 0.24, 0.19);
    const needlePivot = new THREE.Group();
    needlePivot.add(needle);
    needlePivot.name = "gauge_needle";
    gaugeGrp.add(housing, bezel, face, needlePivot);
    gaugeGrp.position.set(1.65, 2.05, 0.65);
    gaugeGrp.rotation.y = -0.25;
    burstTest.add(gaugeGrp);

    // Armored pressure hose connecting manifold to tire valve
    const hoseCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-1.85, 1.85, 0.4),
      new THREE.Vector3(-1.3, 2.1, 0.6),
      new THREE.Vector3(-0.9, 1.55, 0.45),
      new THREE.Vector3(-0.35, 1.35, 0.25)
    );
    const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 18, 0.075, 10, false), brassMat);
    burstTest.add(hose);
  }
  register("burst_test_4x", burstTest);

  // 6. TIRE PRESSURE 200 PSI (Sculpted Tire + Industrial Nitrogen Compressor Cylinder + Curved Hose)
  const tirePressure = new THREE.Group();
  {
    const tire = makeAircraftTireMesh(mats, 1.24, 0.48);
    tire.position.set(0.35, 1.82, 0);
    tire.name = "psi_tire";
    tirePressure.add(tire);

    const tankMat = mats.phong("psi2_tank", () => ({ color: "#1e3a5f", shininess: 65 }));
    const brassMat = mats.phong("psi2_brass", () => ({ color: "#d97706", shininess: 85 }));
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.35, 12, 20), tankMat);
    tank.position.set(-1.95, 1.35, 0.35);
    tank.castShadow = true;
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.32, 12), brassMat);
    valve.position.set(-1.95, 2.48, 0.35);
    tirePressure.add(tank, valve);

    const hoseCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-1.95, 2.55, 0.35),
      new THREE.Vector3(-1.35, 2.65, 0.5),
      new THREE.Vector3(-0.85, 1.65, 0.45),
      new THREE.Vector3(-0.35, 1.55, 0.25)
    );
    const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 18, 0.07, 10, false), brassMat);
    tirePressure.add(hose);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.055, 10, 44),
      new THREE.MeshBasicMaterial({ color: "#38bdf8" })
    );
    ring.position.set(0.35, 1.82, 0);
    ring.name = "psi_ring";
    tirePressure.add(ring);
  }
  register("tire_pressure_200psi", tirePressure);

  // 7. TIRE VS SIX CAR TIRES COMPARISON
  const tireVsSix = new THREE.Group();
  {
    const bigTire = makeAircraftTireMesh(mats, 1.32, 0.5);
    bigTire.position.set(1.15, 1.9, 0);
    tireVsSix.add(bigTire);

    const carRubber = mats.lam("car2_rub", () => ({ map: makeAviationTireTreadTex() }));
    const carRim = mats.phong("car2_rim", () => ({ color: "#cbd5e1", shininess: 65 }));
    for (let i = 0; i < 6; i++) {
      const mini = new THREE.Group();
      const ct = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.17, 14, 24), carRubber);
      ct.rotation.x = Math.PI / 2;
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.26, 16), carRim);
      mini.add(ct, cr);
      mini.position.set(-1.3, 0.45 + i * 0.42, 0);
      mini.name = `car_tire_${i}`;
      tireVsSix.add(mini);
    }
  }
  register("tire_vs_six_cars", tireVsSix);

  // 8. NITROGEN X-RAY (Translucent Glass Tire Shell + Orbiting Diatomic N2 Molecules)
  const nitrogenXray = new THREE.Group();
  {
    const xrayMat = new THREE.MeshPhongMaterial({
      color: "#0284c7",
      emissive: "#0369a1",
      emissiveIntensity: 0.35,
      shininess: 90,
      transparent: true,
      opacity: 0.36,
    });
    const shell = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.5, 20, 40), xrayMat);
    shell.position.set(0, 1.95, 0);
    nitrogenXray.add(shell);

    const rimMat = mats.phong("nx_rim", () => ({ color: "#94a3b8", shininess: 70 }));
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.48, 24), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 1.95, 0);
    nitrogenXray.add(rim);

    const n2Mat = mats.phong("nx_n2", () => ({ color: "#38bdf8", shininess: 90 }));
    const bondMat = new THREE.MeshBasicMaterial({ color: "#e0f2fe" });
    const molGroup = new THREE.Group();
    molGroup.position.set(0, 1.95, 0);
    molGroup.name = "n2_orbit";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const pair = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), n2Mat);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), n2Mat);
      s1.position.x = -0.13;
      s2.position.x = 0.13;
      const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8), bondMat);
      bond.rotation.z = Math.PI / 2;
      pair.add(s1, s2, bond);
      pair.position.set(Math.cos(a) * 1.32, Math.sin(a) * 1.32, ((i % 3) - 1) * 0.15);
      pair.rotation.z = a;
      molGroup.add(pair);
    }
    nitrogenXray.add(molGroup);
  }
  register("nitrogen_xray", nitrogenXray);

  // 9. CARBON BRAKE STACK + THERMAL GLOW + NITROGEN BARRIER
  const brakeGlow = new THREE.Group();
  {
    const rotorMat = new THREE.MeshBasicMaterial({ color: "#ea580c" });
    const innerHotMat = new THREE.MeshBasicMaterial({ color: "#f97316" });
    const caliperMat = mats.phong("bk_cal", () => ({ color: "#475569", shininess: 65 }));
    const shieldMat = new THREE.MeshPhongMaterial({
      color: "#38bdf8",
      emissive: "#0284c7",
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.36, 32), rotorMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, 1.82, 0);
    disc.name = "hot_disc";
    brakeGlow.add(disc);

    const ventRing = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.12, 12, 32), innerHotMat);
    ventRing.position.set(0, 1.82, 0.19);
    brakeGlow.add(ventRing);

    // Multi-piston aircraft brake caliper clamp
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 0.65), caliperMat);
    caliper.position.set(-1.12, 1.82, 0);
    brakeGlow.add(caliper);

    const shield = new THREE.Mesh(
      new THREE.SphereGeometry(1.68, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
      shieldMat
    );
    shield.position.set(0, 1.82, 0);
    shield.name = "n2_shield";
    brakeGlow.add(shield);
  }
  register("brake_glow_shield", brakeGlow);

  // 10. FUSIBLE PLUG ZOOM & CONTROLLED MELT (Machined Hex Brass Fuse Bolt + Gas Vent)
  const makeFusiblePlugRig = (melting: boolean) => {
    const g = new THREE.Group();
    const rim = makeAircraftTireMesh(mats, 1.32, 0.45);
    rim.position.set(0, 1.9, 0);
    rim.name = "plug_tire";
    g.add(rim);

    const plugMat = mats.phong(melting ? "plg2_hot" : "plg2_brass", () => ({
      color: melting ? "#ea580c" : "#eab308",
      shininess: 95,
    }));
    const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.65, 6), plugMat);
    plug.rotation.x = Math.PI / 2;
    plug.position.set(0.6, 2.22, 0.36);
    plug.name = "fusible_bolt";
    g.add(plug);

    const targetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.04, 10, 32),
      new THREE.MeshBasicMaterial({ color: melting ? "#ef4444" : "#38bdf8" })
    );
    targetRing.position.set(0.6, 2.22, 0.68);
    targetRing.name = "target_ring";
    g.add(targetRing);

    if (melting) {
      const ventMat = mats.lam("plg2_vent", () => ({ color: "#e0f2fe" }));
      const vent = new THREE.Group();
      vent.position.set(0.6, 2.22, 0.72);
      vent.name = "gas_vent";
      for (let i = 0; i < 5; i++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + i * 0.09, 1), ventMat);
        puff.position.set(i * 0.24, -i * 0.05, i * 0.32);
        vent.add(puff);
      }
      g.add(vent);
    }
    return g;
  };
  register("fusible_plug_zoom", makeFusiblePlugRig(false));
  register("fusible_plug_melt", makeFusiblePlugRig(true));

  // 11. HYDRAULIC OLEO STRUT CUTAWAY (Machined Steel + Translucent Chamber + Amber Hydraulic Fluid)
  const hydraulicStrut = new THREE.Group();
  {
    const steelMat = mats.phong("hyd2_steel", () => ({ color: "#94a3b8", shininess: 85 }));
    const glassCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 2.4, 24),
      new THREE.MeshPhongMaterial({
        color: "#bae6fd",
        shininess: 90,
        transparent: true,
        opacity: 0.32,
      })
    );
    glassCylinder.position.set(0, 2.75, 0);
    hydraulicStrut.add(glassCylinder);

    const topCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.28, 24), steelMat);
    topCollar.position.set(0, 3.92, 0);
    const botCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.28, 24), steelMat);
    botCollar.position.set(0, 1.56, 0);
    hydraulicStrut.add(topCollar, botCollar);

    const oil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 1.35, 20),
      mats.phong("hyd2_oil", () => ({ color: "#f59e0b", shininess: 60 }))
    );
    oil.position.set(0, 2.45, 0);
    oil.name = "hyd_oil";
    hydraulicStrut.add(oil);

    const pistonGroup = new THREE.Group();
    pistonGroup.name = "hyd_piston";
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 18), steelMat);
    rod.position.set(0, 1.85, 0);
    const wheel = makeAircraftTireMesh(mats, 0.85, 0.32);
    wheel.position.set(0, 0.92, 0);
    pistonGroup.add(rod, wheel);
    hydraulicStrut.add(pistonGroup);
  }
  register("hydraulic_strut", hydraulicStrut);

  // 12. UNIVERSAL SCIENCE PROPS
  const lightning = new THREE.Group();
  {
    const boltMat = new THREE.MeshBasicMaterial({ color: "#fde047" });
    [
      [0.3, 3.6, -0.35],
      [-0.35, 2.5, 0.45],
      [0.25, 1.4, -0.4],
    ].forEach(([x, y, rz]) => {
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
      orb.position.set(Math.cos(a) * 1.4, Math.sin(a) * 1.1, (i % 2 ? 0.5 : -0.5));
      molecule.add(orb);
    }
    molecule.position.set(0, 2.0, 0);
  }
  register("molecule_cluster", molecule);

  const planet = new THREE.Group();
  {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 24, 18),
      mats.lam("pl2_surf", () => ({ color: "#15803d" }))
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.14, 12, 40),
      mats.phong("pl2_ring", () => ({ color: "#d97706", shininess: 50 }))
    );
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
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.1, 0),
      mats.phong("ped2_gem", () => ({ color: "#0ea5e9", shininess: 85 }))
    );
    gem.position.set(0, 2.0, 0);
    gem.castShadow = true;
    heroPed.add(gem);
  }
  register("hero_pedestal", heroPed);

  // ============================================================================
  // DETERMINISTIC PER-FRAME ANIMATION
  // ============================================================================
  const update = (prop: AutoHeroProp, tLocal: number, tSec: number) => {
    for (const [k, grp] of props) grp.visible = k === prop;
    const active = props.get(prop);
    if (!active) return;

    switch (prop) {
      case "jet_landing": {
        const descent = Math.max(0, 1 - tLocal * 1.6);
        const bounce =
          tLocal > 0.62 ? Math.abs(Math.sin((tLocal - 0.62) * Math.PI * 3)) * 0.2 * (1 - tLocal) : 0;
        active.scale.setScalar(0.84);
        active.position.set(-1.3 + tLocal * 2.5, descent * 2.2 + bounce, -1.8);
        active.rotation.set(0, -0.26, -descent * 0.12);
        break;
      }
      case "jet_taxi_golden": {
        active.scale.setScalar(0.84);
        active.position.set(-1.2 + tLocal * 2.4, 0, -1.6);
        active.rotation.set(0, -0.3, 0);
        break;
      }
      case "tire_touchdown_smoke": {
        const wheel = active.getObjectByName("spin_wheel");
        if (wheel) wheel.rotation.z = -tSec * 9.0;
        const smoke = active.getObjectByName("smoke_trail");
        if (smoke) {
          smoke.children.forEach((c, idx) => {
            c.position.y = 0.42 + idx * 0.16 + Math.sin(tSec * 7 + idx) * 0.1;
            c.scale.setScalar(0.85 + tLocal * 0.35);
          });
        }
        break;
      }
      case "tire_spinup": {
        const wheel = active.getObjectByName("spin_wheel");
        const spinPhase = tLocal < 0.42 ? 0 : Math.pow((tLocal - 0.42) / 0.58, 2.2) * 18;
        if (wheel) wheel.rotation.z = -spinPhase;
        break;
      }
      case "four_pillars_radial": {
        active.rotation.y = tLocal * 0.7;
        for (let i = 0; i < 4; i++) {
          const p = active.getObjectByName(`pillar_${i}`);
          if (p) p.position.y = 1.65 + Math.sin(tSec * 4 + i * 1.4) * 0.16;
        }
        break;
      }
      case "tire_cutaway_layers": {
        active.rotation.y = -0.35 + tLocal * 0.85;
        break;
      }
      case "burst_test_4x": {
        const tire = active.getObjectByName("burst_tire");
        if (tire) tire.scale.setScalar(1 + Math.sin(tSec * 8) * 0.025 + tLocal * 0.06);
        const pivot = active.getObjectByName("gauge_needle");
        if (pivot) {
          // Sweep needle smoothly from 0x -> 4x green/amber zone!
          pivot.rotation.z = 2.1 - tLocal * 3.8;
        }
        break;
      }
      case "tire_pressure_200psi": {
        const ring = active.getObjectByName("psi_ring");
        if (ring) ring.scale.setScalar(0.92 + ((tSec * 1.4) % 0.42));
        active.rotation.y = Math.sin(tLocal * Math.PI) * 0.3;
        break;
      }
      case "tire_vs_six_cars": {
        for (let i = 0; i < 6; i++) {
          const mini = active.getObjectByName(`car_tire_${i}`);
          if (mini) {
            const appear = Math.min(1, Math.max(0, tLocal * 6 - i * 0.55));
            mini.scale.setScalar(0.01 + appear * 0.99);
          }
        }
        break;
      }
      case "nitrogen_xray": {
        const mol = active.getObjectByName("n2_orbit");
        if (mol) mol.rotation.z = tSec * 1.7;
        active.rotation.y = Math.sin(tLocal * Math.PI) * 0.28;
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
        break;
      }
      case "fusible_plug_melt": {
        const tire = active.getObjectByName("plug_tire");
        if (tire) tire.scale.set(1 + tLocal * 0.07, 1 - tLocal * 0.2, 1);
        const bolt = active.getObjectByName("fusible_bolt");
        if (bolt) bolt.position.y = 2.22 - tLocal * 0.32;
        const vent = active.getObjectByName("gas_vent");
        if (vent) {
          vent.children.forEach((p, idx) => {
            p.scale.setScalar(0.5 + ((tSec * 2 + idx * 0.3) % 1) * 0.85);
          });
        }
        break;
      }
      case "hydraulic_strut": {
        const compress = Math.sin(tLocal * Math.PI * 2) * 0.5 + 0.5;
        const piston = active.getObjectByName("hyd_piston");
        if (piston) piston.position.y = compress * 0.62;
        const oil = active.getObjectByName("hyd_oil");
        if (oil) oil.scale.y = 1.15 - compress * 0.32;
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
