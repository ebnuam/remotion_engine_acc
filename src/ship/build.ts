import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { twoTone } from "../bridge/shade";
import { V3 } from "./story";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Shared cached materials
const mats = new Map<string, THREE.Material>();

export const getMat = (
  key: string,
  create: () => THREE.MeshLambertMaterialParameters | THREE.MeshPhongMaterialParameters,
  phong = false
): THREE.Material => {
  let m = mats.get(key);
  if (!m) {
    if (phong) {
      m = twoTone(
        new THREE.MeshPhongMaterial(
          create() as THREE.MeshPhongMaterialParameters
        ),
        0.18
      );
    } else {
      m = twoTone(
        new THREE.MeshLambertMaterial(
          create() as THREE.MeshLambertMaterialParameters
        )
      );
    }
    mats.set(key, m);
  }
  return m;
};

// Box geometry helper
export const boxGeo = (min: THREE.Vector3, max: THREE.Vector3): THREE.BufferGeometry => {
  const [x0, y0, z0] = [min.x, min.y, min.z];
  const [x1, y1, z1] = [max.x, max.y, max.z];
  const w = x1 - x0,
    h = y1 - y0,
    d = z1 - z0;
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x0 + w / 2, y0 + h / 2, z0 + d / 2);
  return g;
};

/**
 * Creates 3D Cargo Ship model
 */
export class ShipModel {
  root = new THREE.Group();
  cutawayPanel: THREE.Mesh;
  cutawayInterior: THREE.Group = new THREE.Group();
  gravityArrow: THREE.Group = new THREE.Group();
  buoyancyArrows: THREE.Group = new THREE.Group();
  propeller: THREE.Group = new THREE.Group();
  rudder!: THREE.Mesh;
  bowWake: THREE.Mesh;

  constructor() {
    const R = this.root;

    // Materials
    const matHullRed = getMat("shipHullRed", () => ({ color: "#991b1b" })); // Antifouling red bottom
    const matHullDark = getMat("shipHullDark", () => ({ color: "#1e293b" })); // Deep slate topsides
    const matStripe = getMat("shipStripe", () => ({ color: "#f8fafc" })); // White waterline stripe
    const matSuper = getMat("shipSuper", () => ({ color: "#f1f5f9" })); // White bridge superstructure
    const matWindow = getMat("shipWindow", () => ({ color: "#090d16" })); // Tinted bridge windows
    const matFunnel = getMat("shipFunnel", () => ({ color: "#dc2626" })); // Red funnel
    const matFunnelTop = getMat("shipFunnelTop", () => ({ color: "#0f172a" })); // Black funnel cap
    const matSteel = getMat("shipSteel", () => ({ color: "#64748b" }), true); // Metal rails/mast

    // Container colors
    const matBlue = getMat("cntBlue", () => ({ color: "#0284c7" }));
    const matGreen = getMat("cntGreen", () => ({ color: "#16a34a" }));
    const matOrange = getMat("cntOrange", () => ({ color: "#ea580c" }));
    const matYellow = getMat("cntYellow", () => ({ color: "#eab308" }));
    const matRed = getMat("cntRed", () => ({ color: "#b91c1c" }));

    // ---- 1. Hull Bottom (Submerged red hull: y = -4 to 0) ----
    const hullRedGeos: THREE.BufferGeometry[] = [];
    hullRedGeos.push(boxGeo(V(-6, -4, -12), V(6, 0, 22)));
    hullRedGeos.push(boxGeo(V(-5.2, -3.8, 22), V(5.2, 0, 32)));
    for (let i = 0; i < 6; i++) {
      const z0 = -12 - i * 1.5;
      const z1 = z0 - 1.5;
      const w0 = 6 * (1 - i / 7);
      hullRedGeos.push(boxGeo(V(-w0, -4 + i * 0.25, z1), V(w0, 0, z0)));
    }
    // Bulbous bow protruding nose at y=-2.4, z=-20.5
    const bulbGeo = new THREE.CylinderGeometry(1.6, 2.0, 3.8, 16);
    bulbGeo.rotateX(Math.PI / 2);
    bulbGeo.translate(0, -2.4, -20.5);
    hullRedGeos.push(bulbGeo);

    const hullRedMesh = new THREE.Mesh(mergeGeometries(hullRedGeos, false), matHullRed);
    hullRedMesh.castShadow = true;
    hullRedMesh.receiveShadow = true;
    R.add(hullRedMesh);

    // ---- 2. Waterline Stripe (White band at y = -0.2 to 0.4) ----
    const stripeGeos: THREE.BufferGeometry[] = [];
    stripeGeos.push(boxGeo(V(-6.08, -0.2, -12), V(6.08, 0.4, 22)));
    stripeGeos.push(boxGeo(V(-5.28, -0.2, 22), V(5.28, 0.4, 32)));
    for (let i = 0; i < 6; i++) {
      const z0 = -12 - i * 1.5;
      const z1 = z0 - 1.5;
      const w0 = 6.08 * (1 - i / 7);
      stripeGeos.push(boxGeo(V(-w0, -0.2, z1), V(w0, 0.4, z0)));
    }
    const stripeMesh = new THREE.Mesh(mergeGeometries(stripeGeos, false), matStripe);
    stripeMesh.receiveShadow = true;
    R.add(stripeMesh);

    // ---- 3. Hull Topsides & Freeboard (y = 0.4 to 4.2) ----
    const hullDarkGeos: THREE.BufferGeometry[] = [];
    hullDarkGeos.push(boxGeo(V(5.6, 0.4, -12), V(6.1, 4.4, 22)));
    hullDarkGeos.push(boxGeo(V(4.8, 0.4, 22), V(5.3, 4.4, 32)));
    hullDarkGeos.push(boxGeo(V(-5.2, 0.4, 31.8), V(5.2, 4.4, 32.2)));
    for (let i = 0; i < 6; i++) {
      const z0 = -12 - i * 1.5;
      const z1 = z0 - 1.5;
      const w0 = 6.1 * (1 - i / 7);
      const w1 = 6.1 * (1 - (i + 1) / 7);
      hullDarkGeos.push(boxGeo(V(-w0, 0.4, z1), V(-w1 + 0.5, 4.4 + i * 0.25, z0)));
      hullDarkGeos.push(boxGeo(V(w1 - 0.5, 0.4, z1), V(w0, 4.4 + i * 0.25, z0)));
    }
    hullDarkGeos.push(boxGeo(V(-3.5, 4.4, -20.5), V(3.5, 5.6, -15)));
    hullDarkGeos.push(boxGeo(V(-6.1, 0.4, -12), V(-5.6, 4.4, -4)));
    hullDarkGeos.push(boxGeo(V(-6.1, 0.4, 14), V(-5.6, 4.4, 22)));
    hullDarkGeos.push(boxGeo(V(-5.3, 0.4, 22), V(-4.8, 4.4, 32)));
    hullDarkGeos.push(boxGeo(V(-5.6, 3.8, -12), V(5.6, 4.1, 22)));
    hullDarkGeos.push(boxGeo(V(-3.4, 5.5, -20.5), V(3.4, 5.7, -12)));

    const hullDarkMesh = new THREE.Mesh(mergeGeometries(hullDarkGeos, false), matHullDark);
    hullDarkMesh.castShadow = true;
    hullDarkMesh.receiveShadow = true;
    R.add(hullDarkMesh);

    // ---- 4. Cutaway Outer Panel (Shot 3 & 4 toggle/fade) ----
    const cutawayGeo = boxGeo(V(-6.12, 0.4, -4), V(-5.58, 4.4, 14));
    this.cutawayPanel = new THREE.Mesh(cutawayGeo, matHullDark);
    this.cutawayPanel.castShadow = true;
    this.cutawayPanel.receiveShadow = true;
    R.add(this.cutawayPanel);

    // ---- 5. Cutaway Interior Cavern (Air hold & structural ribs) ----
    const interiorR = this.cutawayInterior;
    const ribGeos: THREE.BufferGeometry[] = [];
    const matRib = getMat("shipRib", () => ({ color: "#cbd5e1" }));
    const matInnerWaterline = getMat("shipInnerWater", () => ({ color: "#38bdf8" }));

    ribGeos.push(boxGeo(V(-5.5, -3.4, -4.5), V(5.5, -3.1, 14.5)));
    ribGeos.push(boxGeo(V(5.2, -3.2, -4.5), V(5.6, 3.8, 14.5)));
    ribGeos.push(boxGeo(V(-5.5, -3.2, -4.5), V(5.5, 3.8, -4.1)));
    ribGeos.push(boxGeo(V(-5.5, -3.2, 14.1), V(5.5, 3.8, 14.5)));

    // Transverse structural web frames
    for (let z = -2; z <= 12; z += 5.0) {
      ribGeos.push(boxGeo(V(-5.4, -3.1, z - 0.2), V(5.4, -2.4, z + 0.2)));
      ribGeos.push(boxGeo(V(4.8, -2.4, z - 0.2), V(5.4, 3.8, z + 0.2)));
      ribGeos.push(boxGeo(V(-5.4, 3.4, z - 0.2), V(5.4, 3.8, z + 0.2)));
    }
    const ribsMesh = new THREE.Mesh(mergeGeometries(ribGeos, false), matRib);
    ribsMesh.receiveShadow = true;
    interiorR.add(ribsMesh);

    // Waterline marker strip inside the hull
    const wlIndicator = new THREE.Mesh(
      boxGeo(V(-5.35, -0.1, -4.2), V(5.35, 0.1, 14.2)),
      matInnerWaterline
    );
    interiorR.add(wlIndicator);

    // Luminous glowing air volume
    const airVolumeGeo = boxGeo(V(-5.2, -3.1, -4.0), V(5.2, 3.7, 14.0));
    const matAir = new THREE.MeshBasicMaterial({
      color: "#e0f2fe",
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const airMesh = new THREE.Mesh(airVolumeGeo, matAir);
    interiorR.add(airMesh);
    R.add(interiorR);

    // ---- 6. Cargo Containers ----
    const cntMats = [matBlue, matGreen, matOrange, matYellow, matRed];
    const cntGeosByMat: THREE.BufferGeometry[][] = [[], [], [], [], []];
    const xCols = [-3.6, 0.0, 3.6];
    const zBays = [-9.5, -3.2, 3.2, 9.5, 15.8];

    let seed = 42;
    const prng = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let b = 0; b < zBays.length; b++) {
      const zc = zBays[b];
      for (let c = 0; c < xCols.length; c++) {
        const xc = xCols[c];
        const tiers = 2 + Math.floor(prng() * 2);
        for (let t = 0; t < tiers; t++) {
          const yc = 4.1 + t * 2.5;
          const matIdx = Math.floor(prng() * 5);
          const cGeo = boxGeo(
            V(xc - 1.5, yc, zc - 2.8),
            V(xc + 1.5, yc + 2.4, zc + 2.8)
          );
          cntGeosByMat[matIdx].push(cGeo);
        }
      }
    }

    for (let m = 0; m < 5; m++) {
      if (cntGeosByMat[m].length > 0) {
        const mesh = new THREE.Mesh(
          mergeGeometries(cntGeosByMat[m], false),
          cntMats[m]
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        R.add(mesh);
      }
    }

    // ---- 7. Superstructure & Bridge (Aft deckhouse) ----
    const superGeos: THREE.BufferGeometry[] = [];
    superGeos.push(boxGeo(V(-4.8, 4.1, 23), V(4.8, 10.5, 29.5)));
    superGeos.push(boxGeo(V(-6.4, 10.5, 23.5), V(6.4, 13.5, 27.5)));
    superGeos.push(boxGeo(V(-1.2, 13.5, 24.5), V(1.2, 14.8, 26.5)));

    const superMesh = new THREE.Mesh(mergeGeometries(superGeos, false), matSuper);
    superMesh.castShadow = true;
    superMesh.receiveShadow = true;
    R.add(superMesh);

    // Bridge Windows
    const winGeos: THREE.BufferGeometry[] = [];
    winGeos.push(boxGeo(V(-6.2, 11.4, 23.42), V(6.2, 12.8, 23.5)));
    winGeos.push(boxGeo(V(-6.42, 11.4, 23.6), V(-6.38, 12.8, 27.2)));
    winGeos.push(boxGeo(V(6.38, 11.4, 23.6), V(6.42, 12.8, 27.2)));
    const winMesh = new THREE.Mesh(mergeGeometries(winGeos, false), matWindow);
    R.add(winMesh);

    // Funnel
    const funnelCyl = new THREE.CylinderGeometry(1.2, 1.4, 4.5, 16);
    funnelCyl.translate(0, 15.2, 28.2);
    const funnelMesh = new THREE.Mesh(funnelCyl, matFunnel);
    funnelMesh.castShadow = true;
    R.add(funnelMesh);

    const funnelTopGeo = new THREE.CylinderGeometry(1.22, 1.25, 0.9, 16);
    funnelTopGeo.translate(0, 17.3, 28.2);
    const funnelTopMesh = new THREE.Mesh(funnelTopGeo, matFunnelTop);
    R.add(funnelTopMesh);

    // Radar Mast
    const mastGeos: THREE.BufferGeometry[] = [];
    const mastPole = new THREE.CylinderGeometry(0.12, 0.18, 5.5, 8);
    mastPole.translate(0, 17.5, 25.5);
    mastGeos.push(mastPole);
    const mastCross = new THREE.BoxGeometry(3.6, 0.14, 0.14);
    mastCross.translate(0, 18.5, 25.5);
    mastGeos.push(mastCross);
    const mastMesh = new THREE.Mesh(mergeGeometries(mastGeos, false), matSteel);
    R.add(mastMesh);

    // ---- 8. 3D Force Arrows (Shot 4: 1 Red Arrow Down + 3 Green Arrows Up) ----
    const matRedArrow = getMat("arrowRedV3", () => ({
      color: "#ef4444",
      emissive: "#ef4444",
      emissiveIntensity: 0.65,
    }));
    const matGreenArrow = getMat("arrowGreenV3", () => ({
      color: "#22c55e",
      emissive: "#22c55e",
      emissiveIntensity: 0.65,
    }));

    this.buildGravityArrow(matRedArrow);
    R.add(this.gravityArrow);

    this.buildBuoyancyArrows(matGreenArrow);
    R.add(this.buoyancyArrows);

    // ---- 9. 3D Stern Propeller & Rudder (Shot 2 & Outro) ----
    const matBronze = getMat("shipBronze", () => ({
      color: "#f59e0b",
      emissive: "#b45309",
      emissiveIntensity: 0.35,
    }));
    this.buildPropeller(matBronze, matSteel, matHullDark);

    // ---- 10. Bow Wake Foam Mesh ----
    const wakeGeo = new THREE.RingGeometry(2.0, 9.0, 32, 1, 0, Math.PI);
    wakeGeo.rotateX(-Math.PI / 2);
    wakeGeo.translate(0, 0.05, -20);
    const matWake = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.bowWake = new THREE.Mesh(wakeGeo, matWake);
    R.add(this.bowWake);
  }

  private buildGravityArrow(mat: THREE.Material) {
    const G = this.gravityArrow;
    // Large prominent downward arrow proportional to full 54m vessel
    // Shaft: Cylinder pointing down (length 5.2m)
    const shaft = new THREE.CylinderGeometry(1.2, 1.2, 5.2, 16);
    shaft.translate(0, -2.6, 0);
    // Head: Cone pointing down (length 3.2m)
    const head = new THREE.ConeGeometry(2.6, 3.2, 16);
    head.rotateX(Math.PI);
    head.translate(0, -6.8, 0);

    const geo = mergeGeometries([shaft, head], false);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    G.add(mesh);
    // Positioned centered at z=5.0 on visible port side (x=-6.4)
    // Base at y=13.0, tip reaches down to y=4.6 (pressing on cargo container deck)
    G.position.set(-6.6, 13.0, 5.0);
    G.scale.set(0.001, 0.001, 0.001);
  }

  private buildBuoyancyArrows(mat: THREE.Material) {
    const B = this.buoyancyArrows;

    // 3 Large Green Arrows spaced along the submerged 54m hull:
    // z = -8.0 (forward hold), z = 5.0 (midships), z = 18.0 (aft hold)
    const zPositions = [-8.0, 5.0, 18.0];

    for (let i = 0; i < zPositions.length; i++) {
      const z = zPositions[i];
      const arrowGroup = new THREE.Group();

      // Shaft: Cylinder pointing up (length 5.5m)
      const shaft = new THREE.CylinderGeometry(1.2, 1.2, 5.5, 16);
      shaft.translate(0, 2.75, 0);
      // Head: Cone pointing up (length 3.2m)
      const head = new THREE.ConeGeometry(2.6, 3.2, 16);
      head.translate(0, 7.1, 0);

      const geo = mergeGeometries([shaft, head], false);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      arrowGroup.add(mesh);

      // Base at y=-12.5, tip reaches up to y=-3.8 (pushing right against the ship keel)
      arrowGroup.position.set(-6.6, -12.5, z);
      B.add(arrowGroup);
    }

    B.scale.set(0.001, 0.001, 0.001);
  }

  private buildPropeller(
    matBronze: THREE.Material,
    matShaft: THREE.Material,
    matRudder: THREE.Material
  ) {
    const R = this.root;
    const P = this.propeller;

    // 1. Fixed Shaft Boss protruding from hull skeg (y=-2.3, z=31.6 to 32.5)
    const shaftGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.0, 16);
    shaftGeo.rotateX(Math.PI / 2);
    shaftGeo.translate(0, -2.3, 32.1);
    const shaftMesh = new THREE.Mesh(shaftGeo, matShaft);
    shaftMesh.castShadow = true;
    R.add(shaftMesh);

    // 2. Rotating Propeller Assembly (positioned at z=32.7, y=-2.3)
    P.position.set(0, -2.3, 32.7);

    // Propeller Hub (cone nose pointing aft)
    const hubGeo = new THREE.CylinderGeometry(0.35, 0.55, 0.9, 16);
    hubGeo.rotateX(-Math.PI / 2);
    hubGeo.translate(0, 0, 0.35);

    // 4 Propeller Blades (diameter 4.2m)
    const bladeGeos: THREE.BufferGeometry[] = [hubGeo];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      // Sculpted marine blade: wider at mid-span, tapered tip
      const b1 = boxGeo(V(-0.45, 0.45, -0.06), V(0.45, 1.45, 0.06));
      const b2 = boxGeo(V(-0.32, 1.45, -0.05), V(0.32, 2.05, 0.05));
      const singleBlade = mergeGeometries([b1, b2], false);
      // Blade pitch twist of 26 degrees
      singleBlade.rotateY(THREE.MathUtils.degToRad(26));
      // Radial angle around Z axis
      singleBlade.rotateZ(angle);
      bladeGeos.push(singleBlade);
    }

    const propMesh = new THREE.Mesh(mergeGeometries(bladeGeos, false), matBronze);
    propMesh.castShadow = true;
    P.add(propMesh);
    R.add(P);

    // 3. Balanced Rudder Aft of Propeller (z=33.5 to 35.0, y=-3.6 to 0.2)
    const rudderGeos: THREE.BufferGeometry[] = [];
    rudderGeos.push(boxGeo(V(-0.25, -3.6, 33.5), V(0.25, 0.2, 35.0)));
    // Rudder stock / post up to hull
    const stockGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.4, 12);
    stockGeo.translate(0, 0.4, 34.2);
    rudderGeos.push(stockGeo);

    this.rudder = new THREE.Mesh(mergeGeometries(rudderGeos, false), matRudder);
    this.rudder.castShadow = true;
    R.add(this.rudder);
  }

  update(
    cutawayProgress: number,
    gravityScale: number,
    buoyancyScale: number,
    time: number,
    propellerRpm: number = 0
  ) {
    if (cutawayProgress > 0.01) {
      this.cutawayPanel.position.y = -cutawayProgress * 8.5;
      this.cutawayPanel.visible = cutawayProgress < 0.98;
      this.cutawayInterior.visible = true;
    } else {
      this.cutawayPanel.position.y = 0;
      this.cutawayPanel.visible = true;
      this.cutawayInterior.visible = false;
    }

    // Red Gravity Arrow scale
    if (gravityScale > 0.01) {
      this.gravityArrow.visible = true;
      this.gravityArrow.scale.set(gravityScale, gravityScale, gravityScale);
    } else {
      this.gravityArrow.visible = false;
    }

    // 3 Green Buoyancy Arrows scale & buoyant breathing pulse
    if (buoyancyScale > 0.01) {
      this.buoyancyArrows.visible = true;
      const pulse = 1.0 + 0.04 * Math.sin(time * 3.5);
      this.buoyancyArrows.scale.set(
        buoyancyScale * pulse,
        buoyancyScale * pulse,
        buoyancyScale * pulse
      );
    } else {
      this.buoyancyArrows.visible = false;
    }

    // Propeller rotation (0 = stopped / engine off, >0 = rotating)
    if (propellerRpm === 0) {
      this.propeller.rotation.z = 0.45; // Stationary (engine stopped)
    } else {
      this.propeller.rotation.z = time * propellerRpm;
    }

    // Bow wake pulsing
    const wakePulse = 1.0 + 0.15 * Math.sin(time * 3.5);
    this.bowWake.scale.set(wakePulse, 1, wakePulse);
  }
}

/**
 * Creates Pier / Wharf for Shot 2
 */
export class PierModel {
  root = new THREE.Group();

  constructor() {
    const R = this.root;
    const matWood = getMat("pierWood", () => ({ color: "#78350f" }));
    const matPiling = getMat("pierPiling", () => ({ color: "#451a03" }));
    const matBollard = getMat("pierBollard", () => ({ color: "#1e293b" }), true);
    const matRail = getMat("pierRail", () => ({ color: "#94a3b8" }), true);

    const timberGeos: THREE.BufferGeometry[] = [];
    const pilingGeos: THREE.BufferGeometry[] = [];

    // Wooden deck at y = 3.4
    timberGeos.push(boxGeo(V(7.5, 3.2, -12), V(16, 3.5, 12)));

    // Vertical pilings
    for (let z = -10; z <= 10; z += 4) {
      for (const x of [8.2, 12.0, 15.5]) {
        const piling = new THREE.CylinderGeometry(0.28, 0.28, 5.0, 12);
        piling.translate(x, 1.0, z);
        pilingGeos.push(piling);
      }
    }

    const deckMesh = new THREE.Mesh(mergeGeometries(timberGeos, false), matWood);
    deckMesh.receiveShadow = true;
    R.add(deckMesh);

    const pilingsMesh = new THREE.Mesh(mergeGeometries(pilingGeos, false), matPiling);
    pilingsMesh.castShadow = true;
    pilingsMesh.receiveShadow = true;
    R.add(pilingsMesh);

    // Bollards
    const bollardGeos: THREE.BufferGeometry[] = [];
    for (const z of [-6, 2, 8]) {
      const bBase = new THREE.CylinderGeometry(0.32, 0.42, 0.6, 12);
      bBase.translate(8.4, 3.8, z);
      const bTop = new THREE.SphereGeometry(0.38, 12, 10);
      bTop.translate(8.4, 4.2, z);
      bollardGeos.push(bBase, bTop);
    }
    const bollardsMesh = new THREE.Mesh(mergeGeometries(bollardGeos, false), matBollard);
    bollardsMesh.castShadow = true;
    R.add(bollardsMesh);

    // Railing
    const railGeos: THREE.BufferGeometry[] = [];
    const railTop = new THREE.BoxGeometry(0.12, 0.12, 20);
    railTop.translate(15.8, 4.6, 0);
    railGeos.push(railTop);
    for (let z = -10; z <= 10; z += 2.5) {
      const post = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
      post.translate(15.8, 4.1, z);
      railGeos.push(post);
    }
    const railMesh = new THREE.Mesh(mergeGeometries(railGeos, false), matRail);
    railMesh.castShadow = true;
    R.add(railMesh);
  }
}

/**
 * Creates Large Gold Coin Model for Shot 1 (Center Frame)
 */
export class CoinModel {
  root = new THREE.Group();
  mesh: THREE.Mesh;

  constructor() {
    const matCoin = getMat(
      "coinGoldLarge",
      () => ({
        color: "#fbbf24",
        specular: "#fef08a",
        shininess: 95,
      }),
      true
    );
    const matRim = getMat(
      "coinGoldRim",
      () => ({
        color: "#d97706",
        specular: "#fde68a",
        shininess: 90,
      }),
      true
    );

    // Large coin: radius 0.75m, thickness 0.16m
    const coinGeos: THREE.BufferGeometry[] = [];
    const bodyCyl = new THREE.CylinderGeometry(0.72, 0.72, 0.14, 32);
    coinGeos.push(bodyCyl);

    // Embossed outer ring rim
    const rimTorus = new THREE.TorusGeometry(0.70, 0.05, 12, 32);
    rimTorus.rotateX(Math.PI / 2);
    coinGeos.push(rimTorus);

    this.mesh = new THREE.Mesh(mergeGeometries(coinGeos, false), matCoin);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.root.add(this.mesh);
  }

  update(pos: V3, visible: boolean, rot: number) {
    this.root.position.set(...pos);
    this.root.visible = visible;
    if (visible) {
      this.mesh.rotation.x = rot * 2.8 + 0.4;
      this.mesh.rotation.y = rot * 3.5;
    }
  }
}

/**
 * Creates Solid Steel Block for Shot 3 (Center Frame Plunge)
 */
export class SolidSteelBlockModel {
  root = new THREE.Group();
  mesh: THREE.Mesh;

  constructor() {
    const matSteel = getMat(
      "solidSteelCube",
      () => ({
        color: "#334155",
        specular: "#94a3b8",
        shininess: 65,
      }),
      true
    );
    const matSteelBands = getMat(
      "steelBands",
      () => ({
        color: "#1e293b",
        specular: "#cbd5e1",
        shininess: 80,
      }),
      true
    );

    // Heavy 3.6m solid steel cube
    const cubeGeos: THREE.BufferGeometry[] = [];
    cubeGeos.push(new THREE.BoxGeometry(3.5, 3.5, 3.5));

    // Reinforcing steel corner plates
    const bandThick = 0.06;
    cubeGeos.push(boxGeo(V(-1.78, -1.78, -1.78), V(1.78, -1.72, 1.78)));
    cubeGeos.push(boxGeo(V(-1.78, 1.72, -1.78), V(1.78, 1.78, 1.78)));
    cubeGeos.push(boxGeo(V(-1.78, -1.78, -1.78), V(-1.72, 1.78, 1.78)));
    cubeGeos.push(boxGeo(V(1.72, -1.78, -1.78), V(1.78, 1.78, 1.78)));

    this.mesh = new THREE.Mesh(mergeGeometries(cubeGeos, false), matSteel);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.root.add(this.mesh);
  }

  update(pos: V3, visible: boolean) {
    this.root.position.set(...pos);
    this.root.visible = visible;
  }
}

/**
 * Creates Underwater Cross-Section Model for Shot 4 (50:50 Split)
 * Deep blue gradient plane below y=0, plus sparkling waterline beam
 */
export class UnderwaterSectionModel {
  root = new THREE.Group();
  waterlineBeam: THREE.Mesh;

  constructor() {
    const R = this.root;

    // 1. Deep ocean backdrop plane below y=0 (y: -70 to 0, width: 260m)
    const oceanGeo = new THREE.PlaneGeometry(260, 70);
    oceanGeo.translate(0, -35, 0);

    const matOcean = new THREE.MeshBasicMaterial({
      color: "#0284c7",
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, matOcean);
    R.add(oceanMesh);

    // 2. Crisp, sparkling waterline beam along y=0
    const beamGeo = new THREE.BoxGeometry(260, 0.45, 0.45);
    const matBeam = new THREE.MeshBasicMaterial({
      color: "#e0f2fe",
      transparent: true,
      opacity: 0.95,
    });
    this.waterlineBeam = new THREE.Mesh(beamGeo, matBeam);
    R.add(this.waterlineBeam);
  }
}

/**
 * Creates Floating Sea Navigational Buoys for 3D Foreground/Midground Parallax
 */
export class BuoyModel {
  root = new THREE.Group();
  beacon: THREE.Mesh;
  foam: THREE.Mesh;
  basePos: V3 = [0, 0, 0];
  phase = 0;

  constructor(bodyColor = "#f59e0b", topColor = "#dc2626", phase = 0) {
    this.phase = phase;
    const R = this.root;

    const matBody = getMat("buoyBody_" + bodyColor, () => ({ color: bodyColor }), true);
    const matStripe = getMat("buoyStripe", () => ({ color: "#f8fafc" }));
    const matTop = getMat("buoyTop_" + topColor, () => ({ color: topColor }));
    const matCage = getMat("buoyCage", () => ({ color: "#334155" }), true);

    const buoyGeos: THREE.BufferGeometry[] = [];
    // Conical floating tower (height 4.2m)
    const tower = new THREE.CylinderGeometry(0.55, 1.3, 3.8, 16);
    tower.translate(0, 1.9, 0);
    buoyGeos.push(tower);
    const bodyMesh = new THREE.Mesh(mergeGeometries(buoyGeos, false), matBody);
    bodyMesh.castShadow = true;
    R.add(bodyMesh);

    // White reflective band
    const stripeGeo = new THREE.CylinderGeometry(0.85, 1.15, 0.9, 16);
    stripeGeo.translate(0, 1.95, 0);
    const stripeMesh = new THREE.Mesh(stripeGeo, matStripe);
    R.add(stripeMesh);

    // Top navigational cross mark
    const topGeos: THREE.BufferGeometry[] = [];
    const mast = new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8);
    mast.translate(0, 4.3, 0);
    topGeos.push(mast);
    const crossBar = new THREE.BoxGeometry(1.2, 0.14, 0.14);
    crossBar.translate(0, 4.9, 0);
    topGeos.push(crossBar);
    const topMesh = new THREE.Mesh(mergeGeometries(topGeos, false), matTop);
    R.add(topMesh);

    // Glowing yellow beacon light
    const matBeacon = new THREE.MeshBasicMaterial({ color: "#fef08a" });
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), matBeacon);
    this.beacon.position.set(0, 3.9, 0);
    R.add(this.beacon);

    // Floating water foam ring around buoy base
    const foamGeo = new THREE.RingGeometry(1.2, 3.2, 24);
    foamGeo.rotateX(-Math.PI / 2);
    foamGeo.translate(0, 0.04, 0);
    const matFoam = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.foam = new THREE.Mesh(foamGeo, matFoam);
    R.add(this.foam);
  }

  setPos(x: number, y: number, z: number) {
    this.basePos = [x, y, z];
    this.root.position.set(x, y, z);
  }

  update(time: number) {
    const heave = 0.14 * Math.sin(time * 2.6 + this.phase);
    const roll = 0.08 * Math.cos(time * 1.8 + this.phase);
    const pitch = 0.06 * Math.sin(time * 2.1 + this.phase);

    this.root.position.set(
      this.basePos[0],
      this.basePos[1] + heave,
      this.basePos[2]
    );
    this.root.rotation.set(pitch, 0, roll);

    // Gentle foam pulsing
    const pulse = 1.0 + 0.1 * Math.sin(time * 3.0 + this.phase);
    this.foam.scale.set(pulse, 1, pulse);
  }
}

/**
 * Creates Distant Horizon Island Silhouettes for 3D Background Parallax
 */
export class DistantIslandModel {
  root = new THREE.Group();

  constructor() {
    const R = this.root;

    // Soft atmospheric mist mountains along the distant horizon (cel-shaded toon)
    const matMountain = getMat("distMountain", () => ({
      color: "#778da9",
    }));

    const islandGeos: THREE.BufferGeometry[] = [];

    // Chain of gentle rolling island hills placed far out along horizon
    const hills = [
      { x: 380, z: -180, r: 160, h: 48 },
      { x: 440, z: -60,  r: 220, h: 62 },
      { x: 480, z: 80,   r: 260, h: 75 },
      { x: 420, z: 240,  r: 190, h: 54 },
      { x: 360, z: 380,  r: 150, h: 42 },
    ];

    for (const h of hills) {
      const cone = new THREE.ConeGeometry(h.r, h.h, 16);
      cone.translate(h.x, h.h / 2 - 4.0, h.z);
      islandGeos.push(cone);
    }

    const mesh = new THREE.Mesh(mergeGeometries(islandGeos, false), matMountain);
    mesh.receiveShadow = false;
    R.add(mesh);
  }
}
