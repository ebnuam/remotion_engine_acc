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
  buoyancyArrow: THREE.Group = new THREE.Group();
  bowWake: THREE.Mesh;

  constructor() {
    const R = this.root;

    // Materials
    const matHullRed = getMat("shipHullRed", () => ({ color: "#991b1b" })); // Antifouling red bottom
    const matHullDark = getMat("shipHullDark", () => ({ color: "#1e293b" })); // Deep slate topsides
    const matStripe = getMat("shipStripe", () => ({ color: "#f8fafc" })); // White waterline stripe
    const matDeck = getMat("shipDeck", () => ({ color: "#334155" })); // Dark steel deck
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
    // Midsection bottom
    hullRedGeos.push(boxGeo(V(-6, -4, -12), V(6, 0, 22)));
    // Stern taper bottom
    hullRedGeos.push(boxGeo(V(-5.2, -3.8, 22), V(5.2, 0, 32)));
    // Bow taper bottom (wedge narrowing toward bow)
    for (let i = 0; i < 6; i++) {
      const z0 = -12 - i * 1.5;
      const z1 = z0 - 1.5;
      const w0 = 6 * (1 - i / 7);
      const w1 = 6 * (1 - (i + 1) / 7);
      hullRedGeos.push(boxGeo(V(-w0, -4 + i * 0.25, z1), V(w0, 0, z0)));
    }
    // Bulbous bow (spherical / cylindrical protruding nose at y=-2.5, z=-20..-23)
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
    // Starboard side hull
    hullDarkGeos.push(boxGeo(V(5.6, 0.4, -12), V(6.1, 4.4, 22)));
    // Starboard stern
    hullDarkGeos.push(boxGeo(V(4.8, 0.4, 22), V(5.3, 4.4, 32)));
    // Transom stern rear wall
    hullDarkGeos.push(boxGeo(V(-5.2, 0.4, 31.8), V(5.2, 4.4, 32.2)));
    // Bow flared upper topsides
    for (let i = 0; i < 6; i++) {
      const z0 = -12 - i * 1.5;
      const z1 = z0 - 1.5;
      const w0 = 6.1 * (1 - i / 7);
      const w1 = 6.1 * (1 - (i + 1) / 7);
      hullDarkGeos.push(boxGeo(V(-w0, 0.4, z1), V(-w1 + 0.5, 4.4 + i * 0.25, z0)));
      hullDarkGeos.push(boxGeo(V(w1 - 0.5, 0.4, z1), V(w0, 4.4 + i * 0.25, z0)));
    }
    // Forecastle elevated deck at bow (y = 4.4 to 5.6)
    hullDarkGeos.push(boxGeo(V(-3.5, 4.4, -20.5), V(3.5, 5.6, -15)));

    // Solid hull port side sections outside of cutaway zone (z < -4 and z > 14)
    hullDarkGeos.push(boxGeo(V(-6.1, 0.4, -12), V(-5.6, 4.4, -4)));
    hullDarkGeos.push(boxGeo(V(-6.1, 0.4, 14), V(-5.6, 4.4, 22)));
    hullDarkGeos.push(boxGeo(V(-5.3, 0.4, 22), V(-4.8, 4.4, 32)));

    // Main cargo deck (under containers)
    hullDarkGeos.push(boxGeo(V(-5.6, 3.8, -12), V(5.6, 4.1, 22)));
    // Forecastle deck floor
    hullDarkGeos.push(boxGeo(V(-3.4, 5.5, -20.5), V(3.4, 5.7, -12)));

    const hullDarkMesh = new THREE.Mesh(mergeGeometries(hullDarkGeos, false), matHullDark);
    hullDarkMesh.castShadow = true;
    hullDarkMesh.receiveShadow = true;
    R.add(hullDarkMesh);

    // ---- 4. Cutaway Outer Panel (Shot 3 toggle/fade) ----
    // This panel covers the port side cutaway region (x = -6.1..-5.6, z = -4..14, y = 0.4..4.4)
    const cutawayGeo = boxGeo(V(-6.12, 0.4, -4), V(-5.58, 4.4, 14));
    this.cutawayPanel = new THREE.Mesh(cutawayGeo, matHullDark);
    this.cutawayPanel.castShadow = true;
    this.cutawayPanel.receiveShadow = true;
    R.add(this.cutawayPanel);

    // ---- 5. Cutaway Interior Cavern (Air hold & structural ribs) ----
    const interiorR = this.cutawayInterior;
    const ribGeos: THREE.BufferGeometry[] = [];
    const matRib = getMat("shipRib", () => ({ color: "#cbd5e1" })); // Light grey structural steel
    const matInnerWaterline = getMat("shipInnerWater", () => ({ color: "#38bdf8" })); // Waterline indicator

    // Double bottom tank top floor at y = -3.2
    ribGeos.push(boxGeo(V(-5.5, -3.4, -4.5), V(5.5, -3.1, 14.5)));
    // Starboard interior wall
    ribGeos.push(boxGeo(V(5.2, -3.2, -4.5), V(5.6, 3.8, 14.5)));
    // Forward and aft watertight bulkheads
    ribGeos.push(boxGeo(V(-5.5, -3.2, -4.5), V(5.5, 3.8, -4.1)));
    ribGeos.push(boxGeo(V(-5.5, -3.2, 14.1), V(5.5, 3.8, 14.5)));

    // Transverse structural web frames / ribs every 3 meters
    for (let z = -2; z <= 12; z += 3.5) {
      // Bottom frame
      ribGeos.push(boxGeo(V(-5.4, -3.1, z - 0.2), V(5.4, -2.4, z + 0.2)));
      // Side vertical frames
      ribGeos.push(boxGeo(V(-5.4, -2.4, z - 0.2), V(-4.8, 3.8, z + 0.2)));
      ribGeos.push(boxGeo(V(4.8, -2.4, z - 0.2), V(5.4, 3.8, z + 0.2)));
      // Deck transverse beam
      ribGeos.push(boxGeo(V(-5.4, 3.4, z - 0.2), V(5.4, 3.8, z + 0.2)));
    }
    const ribsMesh = new THREE.Mesh(mergeGeometries(ribGeos, false), matRib);
    ribsMesh.receiveShadow = true;
    interiorR.add(ribsMesh);

    // Waterline marker strip inside the hull (showing y = 0)
    const wlIndicator = new THREE.Mesh(
      boxGeo(V(-5.35, -0.1, -4.2), V(5.35, 0.1, 14.2)),
      matInnerWaterline
    );
    interiorR.add(wlIndicator);

    // Glowing hollow air cavity representation (subtle translucent air volume)
    const airVolumeGeo = boxGeo(V(-5.2, -3.1, -4.0), V(5.2, 3.7, 14.0));
    const matAir = new THREE.MeshBasicMaterial({
      color: "#e0f2fe",
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    const airMesh = new THREE.Mesh(airVolumeGeo, matAir);
    interiorR.add(airMesh);

    R.add(interiorR);

    // ---- 6. Cargo Containers (Stacked along deck) ----
    const cntMats = [matBlue, matGreen, matOrange, matYellow, matRed];
    const cntGeosByMat: THREE.BufferGeometry[][] = [[], [], [], [], []];

    // Grid of containers: 3 rows across x, length along z
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
        // Stack 2 to 3 tiers high
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

    // ---- 7. Superstructure & Bridge (Aft deckhouse: z = 22 to 30) ----
    const superGeos: THREE.BufferGeometry[] = [];
    // Main deckhouse block (Tier 1 & 2: y = 4.1 to 10.5)
    superGeos.push(boxGeo(V(-4.8, 4.1, 23), V(4.8, 10.5, 29.5)));
    // Navigation Bridge Wheelhouse (Tier 3: y = 10.5 to 13.5, with wings x = -6.4 to 6.4)
    superGeos.push(boxGeo(V(-6.4, 10.5, 23.5), V(6.4, 13.5, 27.5)));
    // Roof mast pedestal
    superGeos.push(boxGeo(V(-1.2, 13.5, 24.5), V(1.2, 14.8, 26.5)));

    const superMesh = new THREE.Mesh(mergeGeometries(superGeos, false), matSuper);
    superMesh.castShadow = true;
    superMesh.receiveShadow = true;
    R.add(superMesh);

    // Bridge Windows (Black ribbon windows along wheelhouse)
    const winGeos: THREE.BufferGeometry[] = [];
    // Front windows (facing bow / -z)
    winGeos.push(boxGeo(V(-6.2, 11.4, 23.42), V(6.2, 12.8, 23.5)));
    // Port & starboard side windows
    winGeos.push(boxGeo(V(-6.42, 11.4, 23.6), V(-6.38, 12.8, 27.2)));
    winGeos.push(boxGeo(V(6.38, 11.4, 23.6), V(6.42, 12.8, 27.2)));
    const winMesh = new THREE.Mesh(mergeGeometries(winGeos, false), matWindow);
    R.add(winMesh);

    // Funnel / Exhaust Smokestack (Red cylinder with black angled top)
    const funnelGeos: THREE.BufferGeometry[] = [];
    const funnelCyl = new THREE.CylinderGeometry(1.2, 1.4, 4.5, 16);
    funnelCyl.translate(0, 15.2, 28.2);
    funnelGeos.push(funnelCyl);
    const funnelMesh = new THREE.Mesh(mergeGeometries(funnelGeos, false), matFunnel);
    funnelMesh.castShadow = true;
    R.add(funnelMesh);

    const funnelTopGeo = new THREE.CylinderGeometry(1.22, 1.25, 0.9, 16);
    funnelTopGeo.translate(0, 17.3, 28.2);
    const funnelTopMesh = new THREE.Mesh(funnelTopGeo, matFunnelTop);
    R.add(funnelTopMesh);

    // Radar Mast & Antennas
    const mastGeos: THREE.BufferGeometry[] = [];
    const mastPole = new THREE.CylinderGeometry(0.12, 0.18, 5.5, 8);
    mastPole.translate(0, 17.5, 25.5);
    mastGeos.push(mastPole);
    const mastCross = new THREE.BoxGeometry(3.6, 0.14, 0.14);
    mastCross.translate(0, 18.5, 25.5);
    mastGeos.push(mastCross);
    const mastMesh = new THREE.Mesh(mergeGeometries(mastGeos, false), matSteel);
    R.add(mastMesh);

    // ---- 8. 3D Force Arrows (Shot 3) ----
    // Gravity Force Arrow (Red, pointing DOWN)
    this.buildGravityArrow(matRed);
    R.add(this.gravityArrow);

    // Buoyant Force Arrow (Green, pointing UP)
    this.buildBuoyancyArrow(matGreen);
    R.add(this.buoyancyArrow);

    // ---- 9. Bow Wake Foam Mesh (Shot 1) ----
    const wakeGeo = new THREE.RingGeometry(2.0, 7.5, 32, 1, 0, Math.PI);
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
    // Shaft: Cylinder pointing down
    const shaft = new THREE.CylinderGeometry(0.35, 0.35, 2.8, 16);
    shaft.translate(0, -1.4, 0);
    // Head: Cone pointing down
    const head = new THREE.ConeGeometry(0.85, 1.4, 16);
    head.rotateX(Math.PI);
    head.translate(0, -3.5, 0);

    const geo = mergeGeometries([shaft, head], false);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    G.add(mesh);
    // Base position at center of gravity
    G.position.set(0, 3.6, 4.5);
    G.scale.set(0.001, 0.001, 0.001); // starts invisible
  }

  private buildBuoyancyArrow(mat: THREE.Material) {
    const B = this.buoyancyArrow;
    // Shaft: Cylinder pointing up (larger, more powerful!)
    const shaft = new THREE.CylinderGeometry(0.45, 0.45, 4.2, 16);
    shaft.translate(0, 2.1, 0);
    // Head: Cone pointing up
    const head = new THREE.ConeGeometry(1.05, 1.8, 16);
    head.translate(0, 5.1, 0);

    const geo = mergeGeometries([shaft, head], false);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    B.add(mesh);
    // Base position at center of buoyancy (in submerged hull)
    B.position.set(0, -2.0, 4.5);
    B.scale.set(0.001, 0.001, 0.001); // starts invisible
  }

  update(cutawayProgress: number, gravityScale: number, buoyancyScale: number, time: number) {
    // Cutaway panel drops down / disappears
    if (cutawayProgress > 0.01) {
      this.cutawayPanel.position.y = -cutawayProgress * 8.0;
      this.cutawayPanel.visible = cutawayProgress < 0.98;
      this.cutawayInterior.visible = true;
    } else {
      this.cutawayPanel.position.y = 0;
      this.cutawayPanel.visible = true;
      this.cutawayInterior.visible = false;
    }

    // Force arrows scaling
    if (gravityScale > 0.01) {
      this.gravityArrow.visible = true;
      this.gravityArrow.scale.set(
        gravityScale,
        gravityScale,
        gravityScale
      );
    } else {
      this.gravityArrow.visible = false;
    }

    if (buoyancyScale > 0.01) {
      this.buoyancyArrow.visible = true;
      this.buoyancyArrow.scale.set(
        buoyancyScale,
        buoyancyScale,
        buoyancyScale
      );
    } else {
      this.buoyancyArrow.visible = false;
    }

    // Bow wake pulsing / expansion
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
    const matWood = getMat("pierWood", () => ({ color: "#78350f" })); // Dark rich timber
    const matPiling = getMat("pierPiling", () => ({ color: "#451a03" })); // Wet dark timber pilings
    const matBollard = getMat("pierBollard", () => ({ color: "#1e293b" }), true); // Cast iron bollard
    const matRail = getMat("pierRail", () => ({ color: "#94a3b8" }), true);

    const timberGeos: THREE.BufferGeometry[] = [];
    const pilingGeos: THREE.BufferGeometry[] = [];

    // Wooden deck at y = 3.4 (x = 8 to 16, z = -12 to 12)
    timberGeos.push(boxGeo(V(7.5, 3.2, -12), V(16, 3.5, 12)));

    // Vertical pilings supporting deck
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

    // Mooring bollards at the edge of the pier
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

    // Edge safety railing along z = -10 to -2 and 4 to 10
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
 * Creates Small Iron Nail / Heavy Metal Block for Shot 2
 */
export class IronNailModel {
  root = new THREE.Group();
  mesh: THREE.Mesh;

  constructor() {
    const matIron = getMat(
      "nailIron",
      () => ({
        color: "#334155",
        specular: "#94a3b8",
        shininess: 60,
      }),
      true
    );

    // A chunky iron cube / spike nail
    const head = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12);
    head.translate(0, 0.18, 0);
    const shaft = new THREE.CylinderGeometry(0.06, 0.02, 0.38, 10);
    shaft.translate(0, 0, 0);

    const geo = mergeGeometries([head, shaft], false);
    this.mesh = new THREE.Mesh(geo, matIron);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.root.add(this.mesh);
  }

  update(pos: V3, visible: boolean, rot: number) {
    this.root.position.set(...pos);
    this.root.visible = visible;
    if (visible) {
      this.mesh.rotation.x = rot * 4;
      this.mesh.rotation.z = rot * 2;
    }
  }
}
