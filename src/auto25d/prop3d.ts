// Procedural Low-Poly Cel-Shaded 3D Environments & Animated Hero Prop Assemblies
// Built with twoTone materials from src/shared/kokisoyo25d/ so InkPass produces crisp cartoon outlines.
// Zero external GLBs, zero heavy PBR, 100% deterministic CPU-friendly (swangle) geometry.

import * as THREE from "three";
import {
  StaticBatch,
  addBushCluster,
  addRockCluster,
  addStorybookTree,
  createMaterialCache,
  ctex,
  grassHD,
  stoneHD,
} from "../shared/kokisoyo25d";
import type { AutoEnvTheme, AutoHeroProp } from "./types";

function makeRunwayAsphaltTex(): THREE.CanvasTexture {
  return ctex("auto25d_runway_asphalt", 512, 512, (g) => {
    g.fillStyle = "#3f4756";
    g.fillRect(0, 0, 512, 512);
    // Subtle asphalt grain
    g.fillStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i < 650; i++) {
      g.fillRect((i * 73) % 512, (i * 137) % 512, 3, 3);
    }
    // Crisp white outer runway lines
    g.fillStyle = "#f8fafc";
    g.fillRect(36, 0, 14, 512);
    g.fillRect(462, 0, 14, 512);
    // Bold white center dashed markings
    g.fillRect(246, 32, 20, 180);
    g.fillRect(246, 288, 20, 180);
    // Yellow shoulder warning edge
    g.fillStyle = "#facc15";
    g.fillRect(10, 0, 10, 512);
    g.fillRect(492, 0, 10, 512);
  });
}

function makeBlueprintGridTex(): THREE.CanvasTexture {
  return ctex("auto25d_blueprint_grid", 512, 512, (g) => {
    g.fillStyle = "#162c54";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(56, 189, 248, 0.28)";
    g.lineWidth = 2;
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
    g.strokeStyle = "rgba(125, 211, 252, 0.55)";
    g.lineWidth = 4;
    g.strokeRect(2, 2, 508, 508);
  });
}

function makeUrbanRoadTex(): THREE.CanvasTexture {
  return ctex("auto25d_urban_road", 512, 512, (g) => {
    g.fillStyle = "#4b5563";
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = "#cbd5e1";
    g.fillRect(0, 0, 68, 512);
    g.fillRect(444, 0, 68, 512);
    g.fillStyle = "#facc15";
    g.fillRect(248, 40, 16, 170);
    g.fillRect(248, 290, 16, 170);
  });
}

export interface EnvRig {
  group: THREE.Group;
  setTheme: (theme: AutoEnvTheme) => void;
}

/** Builds switchable themed 3D environments (all batched for fast CPU swangle rendering). */
export function buildEnvironments(parent: THREE.Object3D): EnvRig {
  const group = new THREE.Group();
  parent.add(group);
  const mats = createMaterialCache();

  const themes = new Map<AutoEnvTheme, THREE.Group>();

  // 1. RUNWAY ENVIRONMENT
  {
    const g = new THREE.Group();
    const grassMat = mats.lam("rw_grass", () => ({ map: grassHD() }));
    const asphaltTex = makeRunwayAsphaltTex();
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(1, 16);
    const asphaltMat = mats.lam("rw_asphalt", () => ({ map: asphaltTex }));
    const concreteMat = mats.lam("rw_concrete", () => ({ color: "#cbd5e1" }));
    const hangarRoofMat = mats.lam("rw_hangar", () => ({ color: "#3b82f6" }));
    const towerGlassMat = mats.lam("rw_glass", () => ({ color: "#38bdf8" }));
    const redMat = mats.lam("rw_red", () => ({ color: "#ef4444" }));
    const whiteMat = mats.lam("rw_white", () => ({ color: "#f8fafc" }));

    const batch = new StaticBatch();
    // Outer airfield grass
    const fieldGeo = new THREE.PlaneGeometry(360, 360);
    fieldGeo.rotateX(-Math.PI / 2);
    const fUv = fieldGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < fUv.count; i++) fUv.setXY(i, fUv.getX(i) * 32, fUv.getY(i) * 32);
    batch.add(fieldGeo, grassMat, new THREE.Matrix4().makeTranslation(0, -0.04, 0));

    // Main runway strip
    const rwGeo = new THREE.PlaneGeometry(14, 240);
    rwGeo.rotateX(-Math.PI / 2);
    batch.add(rwGeo, asphaltMat, new THREE.Matrix4().makeTranslation(0, 0, -40));

    // Distant airport control tower (left background, out of foreground sightline)
    batch.add(
      new THREE.CylinderGeometry(1.4, 2.0, 14, 10),
      concreteMat,
      new THREE.Matrix4().makeTranslation(-18, 7, -34)
    );
    batch.add(
      new THREE.CylinderGeometry(3.2, 2.4, 3.0, 10),
      towerGlassMat,
      new THREE.Matrix4().makeTranslation(-18, 15.2, -34)
    );
    batch.add(
      new THREE.CylinderGeometry(3.6, 3.6, 0.7, 10),
      whiteMat,
      new THREE.Matrix4().makeTranslation(-18, 17.0, -34)
    );
    batch.add(
      new THREE.CylinderGeometry(0.15, 0.25, 3.6, 6),
      redMat,
      new THREE.Matrix4().makeTranslation(-18, 19.0, -34)
    );

    // Distant stylized hangar (right background)
    batch.add(
      new THREE.BoxGeometry(16, 6.5, 11),
      concreteMat,
      new THREE.Matrix4().makeTranslation(20, 3.25, -38)
    );
    const roofGeo = new THREE.CylinderGeometry(5.8, 5.8, 16.4, 12, 1, false, 0, Math.PI);
    roofGeo.rotateZ(Math.PI / 2);
    batch.add(roofGeo, hangarRoofMat, new THREE.Matrix4().makeTranslation(20, 6.5, -38));

    // Runway edge lights/cones along both sides for crisp linear perspective
    for (let z = 12; z >= -72; z -= 12) {
      batch.add(
        new THREE.ConeGeometry(0.32, 0.75, 6),
        redMat,
        new THREE.Matrix4().makeTranslation(-7.6, 0.37, z)
      );
      batch.add(
        new THREE.ConeGeometry(0.32, 0.75, 6),
        redMat,
        new THREE.Matrix4().makeTranslation(7.6, 0.37, z)
      );
    }

    batch.build(g, true, true);
    group.add(g);
    themes.set("runway", g);
  }

  // 2. LAB BLUEPRINT STUDIO ENVIRONMENT (for cutaway / night / technical breakdowns)
  {
    const g = new THREE.Group();
    const bpTex = makeBlueprintGridTex();
    bpTex.wrapS = THREE.RepeatWrapping;
    bpTex.wrapT = THREE.RepeatWrapping;
    bpTex.repeat.set(28, 28);
    const bpMat = mats.lam("lab_bp", () => ({ map: bpTex }));
    const podiumMat = mats.lam("lab_podium", () => ({ color: "#1e3a8a" }));
    const ringMat = new THREE.MeshBasicMaterial({ color: "#38bdf8" });

    const floorGeo = new THREE.PlaneGeometry(260, 260);
    floorGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeo, bpMat);
    floor.receiveShadow = true;
    g.add(floor);

    const podium = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.32, 32), podiumMat);
    podium.position.y = 0.16;
    podium.receiveShadow = true;
    g.add(podium);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.55, 0.08, 10, 48), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.33;
    g.add(ring);

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.06, 8, 56), ringMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = 0.06;
    g.add(outerRing);

    group.add(g);
    themes.set("lab_blueprint", g);
  }

  // 3. NATURE OUTDOOR ENVIRONMENT
  {
    const g = new THREE.Group();
    const grassMat = mats.lam("nat_grass", () => ({ map: grassHD() }));
    const barkMat = mats.lam("nat_bark", () => ({ color: "#8a5a3c" }));
    const leafA = mats.lam("nat_leafA", () => ({ color: "#5cb85c" }));
    const leafB = mats.lam("nat_leafB", () => ({ color: "#4aa34f" }));
    const rockMat = mats.lam("nat_rock", () => ({ map: stoneHD("natRockHD") }));

    const batch = new StaticBatch();
    const groundGeo = new THREE.PlaneGeometry(360, 360);
    groundGeo.rotateX(-Math.PI / 2);
    const uv = groundGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 36, uv.getY(i) * 36);
    batch.add(groundGeo, grassMat);

    const trees: [number, number, number, number][] = [
      [-6.5, -7.0, 101, 6.0],
      [6.5, -7.5, 102, 6.2],
      [-11.0, -12.0, 103, 7.2],
      [11.0, -11.5, 104, 6.8],
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
    const roadMat = mats.lam("urb_road", () => ({ map: roadTex }));
    const bldA = mats.lam("urb_bA", () => ({ color: "#f1f5f9" }));
    const bldB = mats.lam("urb_bB", () => ({ color: "#fde68a" }));
    const bldC = mats.lam("urb_bC", () => ({ color: "#bfdbfe" }));

    const batch = new StaticBatch();
    const roadGeo = new THREE.PlaneGeometry(16, 220);
    roadGeo.rotateX(-Math.PI / 2);
    batch.add(roadGeo, roadMat);
    const colors = [bldA, bldB, bldC];
    for (let i = 0; i < 6; i++) {
      const z = -10 - i * 14;
      const h1 = 8 + (i % 3) * 4;
      const h2 = 10 + ((i + 1) % 3) * 3;
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

  // 5. SKY / COSMOS ENVIRONMENT (reuses clean dark pedestal + floating star spheres)
  {
    const g = new THREE.Group();
    const starMat = new THREE.MeshBasicMaterial({ color: "#fef9c3" });
    for (let i = 0; i < 28; i++) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), starMat);
      const a = (i / 28) * Math.PI * 2;
      star.position.set(Math.cos(a) * (18 + (i % 5) * 6), 4 + (i % 7) * 3, Math.sin(a) * 20 - 15);
      g.add(star);
    }
    group.add(g);
    themes.set("sky_cosmos", g);
  }

  const setTheme = (theme: AutoEnvTheme) => {
    for (const [k, grp] of themes) {
      grp.visible = k === theme;
    }
  };
  setTheme("runway");

  return { group, setTheme };
}

/** Builds a detailed low-poly chunky aircraft tire + metallic rim + yellow spin marker. */
function makeAircraftTireMesh(
  mats: ReturnType<typeof createMaterialCache>,
  radius = 1.15,
  tube = 0.44
): THREE.Group {
  const g = new THREE.Group();
  const rubberMat = mats.lam("tire_rubber", () => ({ color: "#1f2937" }));
  const rimMat = mats.lam("tire_rim", () => ({ color: "#cbd5e1" }));
  const hubMat = mats.lam("tire_hub", () => ({ color: "#64748b" }));
  const markerMat = mats.lam("tire_marker", () => ({ color: "#facc15" }));

  const tire = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 32), rubberMat);
  tire.castShadow = true;
  tire.receiveShadow = true;
  g.add(tire);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, tube * 1.4, 20), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  g.add(rim);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, tube * 1.7, 14), hubMat);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  // Yellow spin-indicator stripe so rotation is unmistakably clear
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.85, 0.16, tube * 1.85), markerMat);
  stripe.position.set(radius * 0.55, 0, 0);
  g.add(stripe);

  // Lug bolts
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, tube * 1.65, 6), hubMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(Math.cos(a) * radius * 0.45, Math.sin(a) * radius * 0.45, 0);
    g.add(bolt);
  }

  return g;
}

/** Builds a stylized chunky 3D commercial passenger jet. */
function makeStylizedJet(mats: ReturnType<typeof createMaterialCache>): THREE.Group {
  const jet = new THREE.Group();
  const bodyMat = mats.lam("jet_body", () => ({ color: "#f8fafc" }));
  const blueMat = mats.lam("jet_blue", () => ({ color: "#2563eb" }));
  const redMat = mats.lam("jet_red", () => ({ color: "#ef4444" }));
  const glassMat = mats.lam("jet_glass", () => ({ color: "#0f172a" }));
  const metalMat = mats.lam("jet_metal", () => ({ color: "#94a3b8" }));

  // Fuselage
  const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(1.15, 7.2, 8, 16), bodyMat);
  fuse.rotation.z = Math.PI / 2;
  fuse.position.y = 2.6;
  fuse.castShadow = true;
  jet.add(fuse);

  // Accent stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.24, 2.34), blueMat);
  stripe.position.set(0, 2.55, 0);
  jet.add(stripe);

  // Cockpit visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 1.35), glassMat);
  visor.position.set(3.85, 2.95, 0);
  jet.add(visor);

  // Swept wings
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 9.8), bodyMat);
  wing.position.set(0.3, 2.25, 0);
  wing.castShadow = true;
  jet.add(wing);

  // Twin engines under wings
  for (const side of [-2.4, 2.4]) {
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.46, 1.6, 12), blueMat);
    eng.rotation.z = Math.PI / 2;
    eng.position.set(0.65, 1.72, side);
    eng.castShadow = true;
    jet.add(eng);
  }

  // Vertical tail fin
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.24), redMat);
  tail.position.set(-3.6, 4.1, 0);
  tail.rotation.z = 0.28;
  tail.castShadow = true;
  jet.add(tail);

  // Horizontal stabilizer
  const hStab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 3.8), bodyMat);
  hStab.position.set(-3.7, 3.05, 0);
  jet.add(hStab);

  // Landing gear struts + tires
  for (const [gx, gz] of [
    [2.7, 0],
    [-0.2, -1.3],
    [-0.2, 1.3],
  ]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.5, 8), metalMat);
    strut.position.set(gx, 1.25, gz);
    jet.add(strut);
    const wheel = makeAircraftTireMesh(mats, 0.42, 0.18);
    wheel.position.set(gx, 0.6, gz);
    jet.add(wheel);
  }

  return jet;
}

export interface HeroPropRig {
  group: THREE.Group;
  update: (prop: AutoHeroProp, tLocal: number, tSec: number) => void;
}

/** Creates and animates all modular 3D hero assemblies cleanly by prop ID. */
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

  // 1. JET LANDING & TAXI
  const jetLanding = makeStylizedJet(mats);
  register("jet_landing", jetLanding);

  const jetTaxi = makeStylizedJet(mats);
  register("jet_taxi_golden", jetTaxi);

  // 2. TIRE TOUCHDOWN SMOKE & SPINUP
  const makeSpinTireAssembly = (tag: string) => {
    const g = new THREE.Group();
    const metalMat = mats.lam(`${tag}_metal`, () => ({ color: "#94a3b8" }));
    const smokeMat = mats.lam(`${tag}_smoke`, () => ({ color: "#f8fafc" }));
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 10), metalMat);
    fork.position.set(0, 3.1, 0);
    g.add(fork);

    const tire = makeAircraftTireMesh(mats, 1.25, 0.48);
    tire.position.set(0, 1.73, 0);
    tire.name = "spin_wheel";
    g.add(tire);

    const smokeGroup = new THREE.Group();
    smokeGroup.name = "smoke_trail";
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.42 + i * 0.12, 10, 8), smokeMat);
      puff.position.set(-1.0 - i * 0.75, 0.45 + i * 0.18, (i % 2 ? 0.25 : -0.25));
      smokeGroup.add(puff);
    }
    g.add(smokeGroup);
    return g;
  };
  const tireTouchdown = makeSpinTireAssembly("td");
  register("tire_touchdown_smoke", tireTouchdown);
  const tireSpinup = makeSpinTireAssembly("sp");
  register("tire_spinup", tireSpinup);

  // 3. FOUR PILLARS RADIAL (Central wheel + 4 glowing pillar markers)
  const fourPillars = new THREE.Group();
  {
    const centerTire = makeAircraftTireMesh(mats, 1.05, 0.4);
    centerTire.position.set(0, 1.5, 0);
    centerTire.name = "center_wheel";
    fourPillars.add(centerTire);

    const pillarColors = ["#38bdf8", "#facc15", "#22c55e", "#f97316"];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const pMat = mats.lam(`pillar_${i}`, () => ({ color: pillarColors[i] }));
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.2, 0.3), pMat);
      card.position.set(Math.cos(a) * 2.55, 1.6, Math.sin(a) * 2.55);
      card.lookAt(0, 1.6, 0);
      card.castShadow = true;
      card.name = `pillar_${i}`;
      fourPillars.add(card);
    }
  }
  register("four_pillars_radial", fourPillars);

  // 4. TIRE CUTAWAY LAYERS (Rubber + Glowing Blue Nylon + Metallic Steel Belt)
  const tireCutaway = new THREE.Group();
  {
    const rubberMat = mats.lam("cut_rubber", () => ({ color: "#1e293b" }));
    const nylonMat = new THREE.MeshBasicMaterial({ color: "#38bdf8" });
    const steelMat = mats.lam("cut_steel", () => ({ color: "#e2e8f0" }));
    const coreMat = mats.lam("cut_core", () => ({ color: "#facc15" }));

    const outer = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.48, 16, 32, Math.PI * 1.45),
      rubberMat
    );
    outer.castShadow = true;
    tireCutaway.add(outer);

    const nylon = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.36, 14, 28, Math.PI * 1.65),
      nylonMat
    );
    tireCutaway.add(nylon);

    const steel = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.24, 14, 28, Math.PI * 1.85),
      steelMat
    );
    tireCutaway.add(steel);

    const inner = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 10, 24), coreMat);
    tireCutaway.add(inner);

    tireCutaway.position.set(0, 1.95, 0);
  }
  register("tire_cutaway_layers", tireCutaway);

  // 5. BURST TEST 4X (Tire + 4 Pumps + Rising 4x Green Gauge Column)
  const burstTest = new THREE.Group();
  {
    const tire = makeAircraftTireMesh(mats, 1.1, 0.44);
    tire.position.set(0, 1.65, 0);
    tire.name = "burst_tire";
    burstTest.add(tire);

    const pumpMat = mats.lam("pump_red", () => ({ color: "#ef4444" }));
    const handleMat = mats.lam("pump_yel", () => ({ color: "#facc15" }));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const pGrp = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.2, 10), pumpMat);
      body.position.y = 0.6;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), handleMat);
      rod.position.y = 1.35;
      rod.name = "pump_rod";
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.14), handleMat);
      bar.position.y = 1.75;
      bar.name = "pump_bar";
      pGrp.add(body, rod, bar);
      pGrp.position.set(Math.cos(a) * 2.2, 0.3, Math.sin(a) * 2.2);
      pGrp.name = `pump_${i}`;
      burstTest.add(pGrp);
    }

    const gaugeBg = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 2.4, 0.25),
      mats.lam("g_bg", () => ({ color: "#334155" }))
    );
    gaugeBg.position.set(2.1, 1.6, 0.8);
    burstTest.add(gaugeBg);

    const gaugeFill = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 2.2, 0.3),
      new THREE.MeshBasicMaterial({ color: "#22c55e" })
    );
    gaugeFill.position.set(2.1, 1.6, 0.82);
    gaugeFill.name = "gauge_fill";
    burstTest.add(gaugeFill);
  }
  register("burst_test_4x", burstTest);

  // 6. TIRE PRESSURE 200 PSI (Stiff Tire + Compressor Hose + Pulsing Rings)
  const tirePressure = new THREE.Group();
  {
    const tire = makeAircraftTireMesh(mats, 1.25, 0.48);
    tire.position.set(0, 1.85, 0);
    tire.name = "psi_tire";
    tirePressure.add(tire);

    const hoseMat = mats.lam("psi_hose", () => ({ color: "#facc15" }));
    const tankMat = mats.lam("psi_tank", () => ({ color: "#2563eb" }));
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 8, 12), tankMat);
    tank.position.set(-2.3, 1.15, 0.4);
    tank.castShadow = true;
    tirePressure.add(tank);

    const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), hoseMat);
    hose.rotation.z = Math.PI / 2;
    hose.position.set(-1.35, 1.45, 0.2);
    tirePressure.add(hose);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.07, 8, 36),
      new THREE.MeshBasicMaterial({ color: "#38bdf8" })
    );
    ring.position.set(0, 1.85, 0);
    ring.name = "psi_ring";
    tirePressure.add(ring);
  }
  register("tire_pressure_200psi", tirePressure);

  // 7. TIRE VS SIX CAR TIRES COMPARISON
  const tireVsSix = new THREE.Group();
  {
    const bigTire = makeAircraftTireMesh(mats, 1.35, 0.52);
    bigTire.position.set(1.25, 1.9, 0);
    tireVsSix.add(bigTire);

    const carRubber = mats.lam("car_rub", () => ({ color: "#334155" }));
    const carRim = mats.lam("car_rim", () => ({ color: "#e2e8f0" }));
    for (let i = 0; i < 6; i++) {
      const mini = new THREE.Group();
      const ct = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.18, 10, 20), carRubber);
      ct.rotation.x = Math.PI / 2;
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.28, 12), carRim);
      mini.add(ct, cr);
      mini.position.set(-1.35, 0.45 + i * 0.44, 0);
      mini.name = `car_tire_${i}`;
      tireVsSix.add(mini);
    }
  }
  register("tire_vs_six_cars", tireVsSix);

  // 8. NITROGEN X-RAY (Translucent Tire Shell + Orbiting Glowing Blue N2 Molecules)
  const nitrogenXray = new THREE.Group();
  {
    const xrayMat = new THREE.MeshBasicMaterial({
      color: "#38bdf8",
      transparent: true,
      opacity: 0.34,
      wireframe: false,
    });
    const shell = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.52, 14, 32), xrayMat);
    shell.position.set(0, 1.95, 0);
    nitrogenXray.add(shell);

    const n2Mat = new THREE.MeshBasicMaterial({ color: "#60a5fa" });
    const bondMat = new THREE.MeshBasicMaterial({ color: "#e0f2fe" });
    const molGroup = new THREE.Group();
    molGroup.position.set(0, 1.95, 0);
    molGroup.name = "n2_orbit";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const pair = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), n2Mat);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), n2Mat);
      s1.position.x = -0.14;
      s2.position.x = 0.14;
      const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 6), bondMat);
      bond.rotation.z = Math.PI / 2;
      pair.add(s1, s2, bond);
      pair.position.set(Math.cos(a) * 1.32, Math.sin(a) * 1.32, ((i % 3) - 1) * 0.16);
      pair.rotation.z = a;
      molGroup.add(pair);
    }
    nitrogenXray.add(molGroup);
  }
  register("nitrogen_xray", nitrogenXray);

  // 9. BRAKE GLOW + NITROGEN SHIELD
  const brakeGlow = new THREE.Group();
  {
    const discMat = new THREE.MeshBasicMaterial({ color: "#f97316" });
    const hotCoreMat = new THREE.MeshBasicMaterial({ color: "#ef4444" });
    const shieldMat = new THREE.MeshBasicMaterial({
      color: "#38bdf8",
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.35, 24), discMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, 1.75, 0);
    disc.name = "hot_disc";
    brakeGlow.add(disc);

    const hotRing = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.14, 10, 24), hotCoreMat);
    hotRing.position.set(0, 1.75, 0.18);
    brakeGlow.add(hotRing);

    const shield = new THREE.Mesh(new THREE.SphereGeometry(1.65, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), shieldMat);
    shield.position.set(0, 1.75, 0);
    shield.name = "n2_shield";
    brakeGlow.add(shield);
  }
  register("brake_glow_shield", brakeGlow);

  // 10. FUSIBLE PLUG ZOOM & MELT
  const makeFusiblePlugRig = (melting: boolean) => {
    const g = new THREE.Group();
    const rim = makeAircraftTireMesh(mats, 1.35, 0.45);
    rim.position.set(0, 1.9, 0);
    rim.name = "plug_tire";
    g.add(rim);

    const goldMat = mats.lam(melting ? "plug_hot" : "plug_gold", () => ({
      color: melting ? "#f97316" : "#facc15",
    }));
    const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.65, 6), goldMat);
    plug.rotation.x = Math.PI / 2;
    plug.position.set(0.62, 2.25, 0.36);
    plug.name = "fusible_bolt";
    g.add(plug);

    const targetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 8, 24),
      new THREE.MeshBasicMaterial({ color: melting ? "#ef4444" : "#38bdf8" })
    );
    targetRing.position.set(0.62, 2.25, 0.66);
    targetRing.name = "target_ring";
    g.add(targetRing);

    if (melting) {
      const ventMat = mats.lam("plug_vent", () => ({ color: "#e0f2fe" }));
      const vent = new THREE.Group();
      vent.position.set(0.62, 2.25, 0.72);
      vent.name = "gas_vent";
      for (let i = 0; i < 4; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + i * 0.1, 8, 8), ventMat);
        puff.position.set(i * 0.25, -i * 0.06, i * 0.35);
        vent.add(puff);
      }
      g.add(vent);
    }
    return g;
  };
  register("fusible_plug_zoom", makeFusiblePlugRig(false));
  register("fusible_plug_melt", makeFusiblePlugRig(true));

  // 11. HYDRAULIC STRUT CUTAWAY
  const hydraulicStrut = new THREE.Group();
  {
    const glassCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 2.5, 18),
      new THREE.MeshBasicMaterial({ color: "#93c5fd", transparent: true, opacity: 0.35 })
    );
    glassCylinder.position.set(0, 2.75, 0);
    hydraulicStrut.add(glassCylinder);

    const oil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 1.3, 16),
      new THREE.MeshBasicMaterial({ color: "#facc15" })
    );
    oil.position.set(0, 2.45, 0);
    oil.name = "hyd_oil";
    hydraulicStrut.add(oil);

    const pistonGroup = new THREE.Group();
    pistonGroup.name = "hyd_piston";
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 2.2, 12),
      mats.lam("hyd_rod", () => ({ color: "#e2e8f0" }))
    );
    rod.position.set(0, 1.85, 0);
    const wheel = makeAircraftTireMesh(mats, 0.85, 0.32);
    wheel.position.set(0, 0.9, 0);
    pistonGroup.add(rod, wheel);
    hydraulicStrut.add(pistonGroup);
  }
  register("hydraulic_strut", hydraulicStrut);

  // 12. UNIVERSAL SCIENCE PROPS (for any future Kok Iso Yo? topic!)
  // Lightning bolt
  const lightning = new THREE.Group();
  {
    const boltMat = new THREE.MeshBasicMaterial({ color: "#fde047" });
    const segs: [number, number, number][] = [
      [0.3, 3.6, -0.35],
      [-0.35, 2.5, 0.45],
      [0.25, 1.4, -0.4],
    ];
    segs.forEach(([x, y, rz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.35, 0.32), boltMat);
      m.position.set(x, y, 0);
      m.rotation.z = rz;
      lightning.add(m);
    });
  }
  register("lightning_bolt", lightning);

  // Molecule cluster
  const molecule = new THREE.Group();
  {
    const cMat = mats.lam("mol_c", () => ({ color: "#3b82f6" }));
    const oMat = mats.lam("mol_o", () => ({ color: "#ef4444" }));
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 14), cMat);
    molecule.add(center);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), oMat);
      orb.position.set(Math.cos(a) * 1.45, Math.sin(a) * 1.15, (i % 2 ? 0.5 : -0.5));
      molecule.add(orb);
    }
    molecule.position.set(0, 2.0, 0);
  }
  register("molecule_cluster", molecule);

  // Planet globe
  const planet = new THREE.Group();
  {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 20, 16),
      mats.lam("pl_surf", () => ({ color: "#22c55e" }))
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.14, 10, 36),
      mats.lam("pl_ring", () => ({ color: "#facc15" }))
    );
    ring.rotation.x = Math.PI * 0.38;
    planet.add(sphere, ring);
    planet.position.set(0, 2.05, 0);
  }
  register("planet_globe", planet);

  // Gear mechanism
  const gear = new THREE.Group();
  {
    const gMat = mats.lam("gear_m", () => ({ color: "#f59e0b" }));
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.35, 16), gMat);
    disc.rotation.x = Math.PI / 2;
    gear.add(disc);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.36), gMat);
      tooth.position.set(Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0);
      tooth.rotation.z = a;
      gear.add(tooth);
    }
    gear.position.set(0, 1.95, 0);
  }
  register("gear_mechanism", gear);

  // Generic hero pedestal
  const heroPed = new THREE.Group();
  {
    const cube = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.1, 0),
      mats.lam("ped_gem", () => ({ color: "#38bdf8" }))
    );
    cube.position.set(0, 2.0, 0);
    cube.castShadow = true;
    heroPed.add(cube);
  }
  register("hero_pedestal", heroPed);

  const update = (prop: AutoHeroProp, tLocal: number, tSec: number) => {
    for (const [k, grp] of props) {
      grp.visible = k === prop;
    }

    const active = props.get(prop);
    if (!active) return;

    switch (prop) {
      case "jet_landing": {
        // Descending smoothly to touchdown with subtle suspension bounce
        const descent = Math.max(0, 1 - tLocal * 1.65);
        const bounce = tLocal > 0.6 ? Math.abs(Math.sin((tLocal - 0.6) * Math.PI * 3)) * 0.25 * (1 - tLocal) : 0;
        active.scale.setScalar(0.76);
        active.position.set(-1.6 + tLocal * 3.0, descent * 2.4 + bounce, -1.8);
        active.rotation.set(0, -0.22, -descent * 0.14);
        break;
      }
      case "jet_taxi_golden": {
        active.scale.setScalar(0.76);
        active.position.set(-1.4 + tLocal * 2.8, 0, -1.5);
        active.rotation.set(0, -0.28, 0);
        break;
      }
      case "tire_touchdown_smoke": {
        const wheel = active.getObjectByName("spin_wheel");
        if (wheel) wheel.rotation.z = -tSec * 9.5;
        const smoke = active.getObjectByName("smoke_trail");
        if (smoke) {
          smoke.children.forEach((c, idx) => {
            const wave = Math.sin(tSec * 7 + idx) * 0.12;
            c.position.y = 0.45 + idx * 0.18 + wave;
            c.scale.setScalar(0.85 + tLocal * 0.35);
          });
        }
        break;
      }
      case "tire_spinup": {
        const wheel = active.getObjectByName("spin_wheel");
        // Starts stationary (dragged), then accelerates rapidly past tLocal=0.45!
        const spinPhase = tLocal < 0.42 ? 0 : Math.pow((tLocal - 0.42) / 0.58, 2.2) * 18;
        if (wheel) wheel.rotation.z = -spinPhase;
        break;
      }
      case "four_pillars_radial": {
        active.rotation.y = tLocal * 0.75;
        for (let i = 0; i < 4; i++) {
          const p = active.getObjectByName(`pillar_${i}`);
          if (p) p.position.y = 1.55 + Math.sin(tSec * 4 + i * 1.4) * 0.18;
        }
        break;
      }
      case "tire_cutaway_layers": {
        active.rotation.y = -0.35 + tLocal * 0.85;
        break;
      }
      case "burst_test_4x": {
        const tire = active.getObjectByName("burst_tire");
        if (tire) tire.scale.setScalar(1 + Math.sin(tSec * 8) * 0.03 + tLocal * 0.08);
        const gauge = active.getObjectByName("gauge_fill");
        if (gauge) {
          const level = 0.25 + tLocal * 0.75;
          gauge.scale.y = level;
          gauge.position.y = 0.55 + level * 1.05;
        }
        for (let i = 0; i < 4; i++) {
          const p = active.getObjectByName(`pump_${i}`);
          const bar = p?.getObjectByName("pump_bar");
          if (bar) bar.position.y = 1.55 + Math.abs(Math.sin(tSec * 6 + i)) * 0.35;
        }
        break;
      }
      case "tire_pressure_200psi": {
        const ring = active.getObjectByName("psi_ring");
        if (ring) {
          const s = 0.92 + ((tSec * 1.4) % 0.45);
          ring.scale.setScalar(s);
        }
        active.rotation.y = Math.sin(tLocal * Math.PI) * 0.35;
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
        if (mol) mol.rotation.z = tSec * 1.8;
        active.rotation.y = Math.sin(tLocal * Math.PI) * 0.3;
        break;
      }
      case "brake_glow_shield": {
        const disc = active.getObjectByName("hot_disc");
        if (disc) disc.rotation.z = tSec * 3.5;
        const shield = active.getObjectByName("n2_shield");
        if (shield) shield.scale.setScalar(0.95 + Math.sin(tSec * 6) * 0.06);
        break;
      }
      case "fusible_plug_zoom": {
        const ring = active.getObjectByName("target_ring");
        if (ring) ring.scale.setScalar(0.92 + Math.sin(tSec * 7) * 0.14);
        break;
      }
      case "fusible_plug_melt": {
        const tire = active.getObjectByName("plug_tire");
        if (tire) {
          // Gentle controlled deflation
          const deflate = 1 - tLocal * 0.22;
          tire.scale.set(1 + tLocal * 0.08, deflate, 1);
        }
        const bolt = active.getObjectByName("fusible_bolt");
        if (bolt) bolt.position.y = 2.25 - tLocal * 0.35;
        const vent = active.getObjectByName("gas_vent");
        if (vent) {
          vent.children.forEach((p, idx) => {
            p.scale.setScalar(0.5 + ((tSec * 2 + idx * 0.3) % 1) * 0.9);
          });
        }
        break;
      }
      case "hydraulic_strut": {
        const compress = Math.sin(tLocal * Math.PI * 2) * 0.5 + 0.5;
        const piston = active.getObjectByName("hyd_piston");
        if (piston) piston.position.y = compress * 0.65;
        const oil = active.getObjectByName("hyd_oil");
        if (oil) oil.scale.y = 1.15 - compress * 0.35;
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
