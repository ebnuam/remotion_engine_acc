// Unified Custom 3D Offshore Bridge & Cofferdam Construction World (Ep003: Jembatan Laut).
// Grounded, realistic-stylized architectural engineering aesthetic matching ref_003 / ref_009:
// - Seamlessly holed animated ocean surface + rising/dropping cofferdam interior water disk
// - Underwater seabed + dark layered bedrock cutaway
// - 48 individually animated corrugated dark-steel sheet piles (drive-down & extract + cutaway)
// - Internal H-beam steel walers & cross-struts, dark steel scaffolding tower & vertical ladder
// - Industrial orange dewatering pump station with pressure gauges & animated arcing water jets
// - Rotating deep bedrock pile drill rig, multi-tier steel rebar cage, concrete formwork & pour pipe
// - Towering weathered architectural concrete bridge piers (panel seams + tie-rod dots)
// - Multi-span sea bridge highway deck along Z with 4 lanes, zebra curbs, streetlights & moving traffic
// - Articulated floating heavy crane barge, tugboat, distant cargo ship, coastal city skyline
// - Custom day / underwater / cobalt-blue night (floodlit!) / golden sunset atmospheric rigs

import * as THREE from "three";
import {
  ActorBillboard,
  CHAR,
  CanvasPool,
  FxBillboard,
  LFB,
  LIGHTS,
  LOOK,
  LightMode,
  NOINK,
  StageWorldAdapter,
  StaticBatch,
  TONE,
  applyLightUniforms,
  createCloudRing,
  createMaterialCache,
  createSkyDome,
  createSunRig,
  untone,
  updateCameraRelativeSun,
  updateSkyAndFog,
  waterFar,
  waterNear,
} from "../shared/kokisoyo25d";
import { FPS, MoodMode, SHOTS, camAt } from "./story";
import { buildCast } from "./cast";
import {
  bargeDeckTex,
  concreteArchitecturalTex,
  highwayAsphaltTex,
  seabedStrataTex,
  seabedTopTex,
  sheetPileSteelTex,
  skylineBuildingTex,
  zebraCurbTex,
} from "./textures";

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;

const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.45 * wTime, 0.15 * wTime);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.62);
  wc = mix(wc, wCrest, mk.r * 0.72);
  wc = mix(wc, wGlint, mk.b * (0.32 + 0.52 * wf));
  diffuseColor.rgb = wc;`;

interface OceanUniforms {
  wNearC: { value: THREE.Color };
  wMidC: { value: THREE.Color };
  wFarC: { value: THREE.Color };
  wCrest: { value: THREE.Color };
  wTrough: { value: THREE.Color };
  wGlint: { value: THREE.Color };
  wShade: { value: THREE.Vector3 };
  wNearTex: { value: THREE.Texture };
  wFarTex: { value: THREE.Texture };
  wTime: { value: number };
}

function createOceanSystem(holeRadius = 6.18) {
  const wNear = waterNear();
  const wFar = waterFar();
  for (const t of [wNear, wFar]) {
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 16;
    t.needsUpdate = true;
  }
  const uniforms: OceanUniforms = {
    wNearC: { value: new THREE.Color() },
    wMidC: { value: new THREE.Color() },
    wFarC: { value: new THREE.Color() },
    wCrest: { value: new THREE.Color() },
    wTrough: { value: new THREE.Color() },
    wGlint: { value: new THREE.Color() },
    wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) },
    wNearTex: { value: wNear },
    wFarTex: { value: wFar },
    wTime: { value: 0 },
  };
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", WATER_DECL)
      .replace("#include <map_fragment>", WATER_COL)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace(
        "#include <lights_fragment_end>",
        "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);"
      );
  };
  mat.customProgramCacheKey = () => "ep3_ocean_holed_v1";

  // Outer ocean plane with an exact circular hole centered at (0, 0) for the cofferdam!
  const S = 950;
  const shape = new THREE.Shape();
  shape.moveTo(-S, -S);
  shape.lineTo(S, -S);
  shape.lineTo(S, S);
  shape.lineTo(-S, S);
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const outerGeo = new THREE.ShapeGeometry(shape, 48);
  outerGeo.rotateX(-Math.PI / 2);
  const outerMesh = new THREE.Mesh(outerGeo, mat);
  outerMesh.receiveShadow = true;

  // Architectural cross-section half-ocean (z <= 0 only, with semicircular hole!) for cutaway shots!
  // Keeps z > 0 completely open so camera views straight into the dry seabed & underwater cross-section!
  const cutShape = new THREE.Shape();
  cutShape.moveTo(-S, 0);
  cutShape.lineTo(-holeRadius, 0);
  cutShape.absarc(0, 0, holeRadius, Math.PI, 0, true);
  cutShape.lineTo(S, 0);
  cutShape.lineTo(S, S);
  cutShape.lineTo(-S, S);
  cutShape.closePath();
  const cutOuterGeo = new THREE.ShapeGeometry(cutShape, 48);
  cutOuterGeo.rotateX(-Math.PI / 2); // Shape +Y maps to World -Z! So this cleanly covers world z <= 0!
  const cutOuterMesh = new THREE.Mesh(cutOuterGeo, mat);
  cutOuterMesh.receiveShadow = true;
  cutOuterMesh.visible = false;

  // Inner ocean disk that fills the hole seamlessly (and drops smoothly during dewatering!)
  const innerGeo = new THREE.CircleGeometry(holeRadius + 0.08, 48);
  innerGeo.rotateX(-Math.PI / 2);
  const innerMesh = new THREE.Mesh(innerGeo, mat);
  innerMesh.receiveShadow = true;

  // Semicircular inner water disk for cutaway dewatering shot (world z <= 0 only)
  const cutInnerGeo = new THREE.CircleGeometry(holeRadius + 0.08, 48, 0, Math.PI);
  cutInnerGeo.rotateX(-Math.PI / 2);
  const cutInnerMesh = new THREE.Mesh(cutInnerGeo, mat);
  cutInnerMesh.receiveShadow = true;
  cutInnerMesh.visible = false;

  return {
    outerMesh,
    cutOuterMesh,
    innerMesh,
    cutInnerMesh,
    update(tSec: number, mood: MoodMode) {
      uniforms.wTime.value = tSec;
      if (mood === "night") {
        untone("#0f2b5c", uniforms.wNearC.value);
        untone("#0d234d", uniforms.wMidC.value);
        untone("#0a1938", uniforms.wFarC.value);
        untone("#294f94", uniforms.wCrest.value);
        untone("#07122a", uniforms.wTrough.value);
        untone("#b8d4ff", uniforms.wGlint.value);
        uniforms.wShade.value.set(0.28, 0.36, 0.65);
      } else if (mood === "underwater") {
        untone("#105b78", uniforms.wNearC.value);
        untone("#0c4661", uniforms.wMidC.value);
        untone("#08334b", uniforms.wFarC.value);
        untone("#48b6cf", uniforms.wCrest.value);
        untone("#062638", uniforms.wTrough.value);
        untone("#a8ecf5", uniforms.wGlint.value);
        uniforms.wShade.value.set(0.35, 0.52, 0.68);
      } else {
        const wc = LOOK[mood === "golden" ? "golden" : "day"].water;
        untone(wc.near, uniforms.wNearC.value);
        untone(wc.mid, uniforms.wMidC.value);
        untone(wc.far, uniforms.wFarC.value);
        untone(wc.crest, uniforms.wCrest.value);
        untone(wc.trough, uniforms.wTrough.value);
        untone(wc.glint, uniforms.wGlint.value);
        uniforms.wShade.value.set(...wc.shade);
      }
    },
  };
}

interface TrafficCar {
  mesh: THREE.Group;
  laneX: number;
  dir: number;
  speed: number;
  baseZ: number;
}

export class JembatanLautWorld implements StageWorldAdapter {
  root = new THREE.Group();
  private pool = new CanvasPool();
  private actors: ActorBillboard[] = [];
  private fxs: FxBillboard[] = [];
  private sky = createSkyDome();
  private fog = new THREE.Fog("#b8d0ec", 25, 340);
  private sunRig: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight };
  private clouds: ReturnType<typeof createCloudRing>;
  private ocean = createOceanSystem(6.18);

  // Dynamic groups toggled/animated per shot
  private fullBridgeGroup = new THREE.Group();
  private heroPierGroup = new THREE.Group();
  private heroFootingMesh!: THREE.Mesh;
  private heroColumnMesh!: THREE.Mesh;
  private heroHammerheadGroup = new THREE.Group();
  private cofferdamGroup = new THREE.Group();
  private sheetPiles: { mesh: THREE.Mesh; angle: number; x: number; z: number }[] = [];
  private bracingGroup = new THREE.Group();
  private scaffoldGroup = new THREE.Group();
  private pumpStationGroup = new THREE.Group();
  private waterJetsGroup = new THREE.Group();
  private waterJetSegments: THREE.Mesh[] = [];
  private drillRigGroup = new THREE.Group();
  private drillBitGroup = new THREE.Group();
  private boredPilesGroup = new THREE.Group();
  private rebarCageGroup = new THREE.Group();
  private formworkGroup = new THREE.Group();
  private pourStreamMesh!: THREE.Mesh;
  private nightLightsGroup = new THREE.Group();
  private underwaterWallGroup = new THREE.Group();
  private concreteFailGroup = new THREE.Group();
  private concreteFailChunks: THREE.Mesh[] = [];

  // Barge & Crane assembly
  private bargeGroup = new THREE.Group();
  private craneUpper = new THREE.Group();
  private craneBoom = new THREE.Group();
  private craneCable!: THREE.Mesh;
  private hookGroup = new THREE.Group();
  private hookBucket = new THREE.Group();
  private hookHammer = new THREE.Group();
  private hookRebarSling = new THREE.Group();
  private tugboatGroup = new THREE.Group();
  private cargoShipGroup = new THREE.Group();
  private trafficCars: TrafficCar[] = [];

  constructor() {
    const R = this.root;
    R.add(this.sky.mesh);
    this.sunRig = createSunRig(R, 2048);
    this.clouds = createCloudRing(R, 8);
    R.add(this.ocean.outerMesh, this.ocean.cutOuterMesh, this.ocean.innerMesh, this.ocean.cutInnerMesh);

    const mats = createMaterialCache();
    const concreteTex = concreteArchitecturalTex();
    const concreteRepeat = concreteTex.clone();
    concreteRepeat.needsUpdate = true;
    concreteRepeat.repeat.set(1.5, 3.0);

    const sheetTex = sheetPileSteelTex();
    const bargeTex = bargeDeckTex();
    bargeTex.repeat.set(2, 3);
    const asphaltTex = highwayAsphaltTex();
    asphaltTex.repeat.set(1, 34);
    const curbTex = zebraCurbTex();
    curbTex.repeat.set(1, 80);
    const strataTex = seabedStrataTex();
    strataTex.repeat.set(6, 1);
    const sandTex = seabedTopTex();
    sandTex.repeat.set(14, 14);
    const skylineTex = skylineBuildingTex();

    const mConcrete = mats.lam("concrete", () => ({ map: concreteTex }));
    const mConcretePier = mats.lam("concretePier", () => ({ map: concreteRepeat }));
    const mConcreteWet = mats.lam("concreteWet", () => ({ color: "#8c9296" }));
    const mSheetPile = mats.lam("sheetPile", () => ({ map: sheetTex }));
    const mDarkSteel = mats.lam("darkSteel", () => ({ color: "#28303b" }));
    const mMidSteel = mats.lam("midSteel", () => ({ color: "#4d5866" }));
    const mRebar = mats.lam("rebar", () => ({ color: "#6c4836" }));
    const mCraneYellow = mats.lam("craneYellow", () => ({ color: "#d49824" }));
    const mPumpOrange = mats.lam("pumpOrange", () => ({ color: "#d96b24" }));
    const mBargeHull = mats.lam("bargeHull", () => ({ color: "#2b3440" }));
    const mBargeRed = mats.lam("bargeRed", () => ({ color: "#8a2d28" }));
    const mBargeDeck = mats.lam("bargeDeck", () => ({ map: bargeTex }));
    const mWoodPlank = mats.lam("woodPlank", () => ({ color: "#a47a4b" }));
    const mAsphalt = mats.lam("asphalt", () => ({ map: asphaltTex }));
    const mZebraCurb = mats.lam("zebraCurb", () => ({ map: curbTex }));
    const mSeabedTop = mats.lam("seabedTop", () => ({ map: sandTex }));
    const mSeabedStrata = mats.lam("seabedStrata", () => ({ map: strataTex }));
    const mSkyline = mats.lam("skyline", () => ({ map: skylineTex, color: "#c2cad6" }));
    const mWhite = mats.lam("white", () => ({ color: "#eceae2" }));
    const mWindow = mats.lam("window", () => ({ color: "#4c6a88" }));
    const mJetWater = new THREE.MeshBasicMaterial({ color: "#d6f6ff" });
    const mLampEmissive = new THREE.MeshBasicMaterial({ color: "#fff4d2" });

    // -------------------------------------------------------------------------
    // 1. SEABED FLOOR (y = -10.5) & DEEP BEDROCK STRATA CUTAWAY (y = -10.5..-16.5)
    // -------------------------------------------------------------------------
    const seabedBatch = new StaticBatch();
    const seabedGeo = new THREE.PlaneGeometry(240, 240);
    seabedGeo.rotateX(-Math.PI / 2);
    seabedGeo.translate(0, -10.52, 0);
    seabedBatch.add(seabedGeo, mSeabedTop);

    // Bedrock cutaway slab visible in underwater & drilling cutaways (z = -60..+2, y = -16.56..-10.56, 4cm below seabed plane)
    const bedrockSlab = new THREE.BoxGeometry(110, 6.0, 64);
    bedrockSlab.translate(0, -13.56, -31.5);
    seabedBatch.add(bedrockSlab, mSeabedStrata);
    seabedBatch.build(R, false, true);

    // Architectural deep-ocean water cross-section face (left & right of cofferdam at z = 0!)
    // Clearly shows 10.5m of ocean depth pressing against the outside of the steel cofferdam walls!
    const uwSliceMat = new THREE.MeshBasicMaterial({
      color: "#11749c",
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const uwWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(58, 10.52), uwSliceMat);
    uwWallLeft.position.set(-35.2, -5.26, 0.02);
    uwWallLeft.layers.set(NOINK);
    const uwWallRight = new THREE.Mesh(new THREE.PlaneGeometry(58, 10.52), uwSliceMat);
    uwWallRight.position.set(35.2, -5.26, 0.02);
    uwWallRight.layers.set(NOINK);
    // Crisp bright cyan waterline rim along the cross-section cut edge (y = -0.1)
    const rimMat = new THREE.MeshBasicMaterial({ color: "#8ee7f5" });
    const rimL = new THREE.Mesh(new THREE.BoxGeometry(58, 0.22, 0.14), rimMat);
    rimL.position.set(-35.2, -0.08, 0.05);
    rimL.layers.set(NOINK);
    const rimR = new THREE.Mesh(new THREE.BoxGeometry(58, 0.22, 0.14), rimMat);
    rimR.position.set(35.2, -0.08, 0.05);
    rimR.layers.set(NOINK);
    this.underwaterWallGroup.add(uwWallLeft, uwWallRight, rimL, rimR);
    R.add(this.underwaterWallGroup);

    // -------------------------------------------------------------------------
    // 2. DISTANT COASTAL CITY SKYLINE (Horizon backdrop at z = -220, subtle atmospheric depth)
    // -------------------------------------------------------------------------
    const skylineBatch = new StaticBatch();
    const landBar = new THREE.BoxGeometry(520, 4.5, 42);
    landBar.translate(0, 1.5, -235);
    skylineBatch.add(landBar, mats.lam("coastLand", () => ({ color: "#68826a" })));
    for (let i = -9; i <= 9; i++) {
      const bw = 9 + ((i * 7 + 23) % 7);
      const bh = 16 + ((Math.abs(i * 13 + 5) * 11) % 34);
      const bx = i * 22 + ((i % 2) * 5);
      const bz = -228 - (Math.abs(i) % 3) * 10;
      const bGeo = new THREE.BoxGeometry(bw, bh, 11);
      bGeo.translate(bx, bh * 0.5 + 2.5, bz);
      skylineBatch.add(bGeo, mSkyline);
    }
    skylineBatch.build(R, false, false);

    // -------------------------------------------------------------------------
    // 3. COFFERDAM — 48 CORRUGATED STEEL SHEET PILES AROUND (0, 0, 0), RADIUS 6.2
    // -------------------------------------------------------------------------
    const N_PILES = 48;
    const COFF_R = 6.2;
    const PILE_H = 16.3; // Embedded y=-13.5 up to y=+2.8 (center at y=-5.35)
    const pileGeo = new THREE.BoxGeometry(0.84, PILE_H, 0.36);

    for (let i = 0; i < N_PILES; i++) {
      const ang = (i / N_PILES) * Math.PI * 2;
      const px = Math.cos(ang) * COFF_R;
      const pz = Math.sin(ang) * COFF_R;
      const mesh = new THREE.Mesh(pileGeo, mSheetPile);
      mesh.position.set(px, -5.35, pz);
      mesh.rotation.y = -ang + Math.PI / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.cofferdamGroup.add(mesh);
      this.sheetPiles.push({ mesh, angle: ang, x: px, z: pz });
    }
    R.add(this.cofferdamGroup);

    // Internal Steel Bracing (Walers & Cross-Struts — Shots 13..21)
    const braceBatch = new StaticBatch();
    const walerYs = [1.7, -2.2, -6.1];
    for (const wy of walerYs) {
      // Octagonal ring waler beams hugging inside of cofferdam (r = 5.75)
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2;
        const a1 = ((i + 1) / 12) * Math.PI * 2;
        const mx = ((Math.cos(a0) + Math.cos(a1)) * 0.5) * 5.72;
        const mz = ((Math.sin(a0) + Math.sin(a1)) * 0.5) * 5.72;
        const segLen = 2 * 5.72 * Math.sin(Math.PI / 12) + 0.15;
        const seg = new THREE.BoxGeometry(segLen, 0.42, 0.42);
        seg.rotateY(-((a0 + a1) * 0.5) + Math.PI / 2);
        seg.translate(mx, wy, mz);
        braceBatch.add(seg, mDarkSteel);
      }
      // Heavy H-beam cross struts spanning inside (avoiding center pier core cleanly on outer chords!)
      for (const offset of [-3.4, 3.4]) {
        const span = Math.sqrt(Math.max(1, 5.7 * 5.7 - offset * offset)) * 2;
        const sx = new THREE.BoxGeometry(span, 0.34, 0.34);
        sx.translate(0, wy, offset);
        braceBatch.add(sx, mMidSteel);
        const sz = new THREE.BoxGeometry(0.34, 0.34, span);
        sz.translate(offset, wy, 0);
        braceBatch.add(sz, mMidSteel);
      }
    }
    // Upper perimeter inspection catwalk planks around cofferdam top rim (y = 2.75, r = 5.35)
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2;
      const a1 = ((i + 1) / 12) * Math.PI * 2;
      const mx = ((Math.cos(a0) + Math.cos(a1)) * 0.5) * 5.35;
      const mz = ((Math.sin(a0) + Math.sin(a1)) * 0.5) * 5.35;
      const segLen = 2 * 5.35 * Math.sin(Math.PI / 12) + 0.35;
      const plank = new THREE.BoxGeometry(segLen, 0.16, 1.35);
      plank.rotateY(-((a0 + a1) * 0.5) + Math.PI / 2);
      plank.translate(mx, 2.76, mz);
      braceBatch.add(plank, mWoodPlank);
    }
    braceBatch.build(this.bracingGroup, true, true);
    R.add(this.bracingGroup);

    // -------------------------------------------------------------------------
    // 4. INTERIOR SCAFFOLDING TOWER & VERTICAL LADDER (ref_003 / ref_009 motif!)
    // -------------------------------------------------------------------------
    const scafBatch = new StaticBatch();
    // Vertical steel poles at right side of cofferdam (x = 2.0..4.2, z = -2.8..-0.6, y = -10.5..+2.9)
    const poles: [number, number][] = [
      [2.0, -2.8],
      [4.2, -2.8],
      [2.0, -0.6],
      [4.2, -0.6],
    ];
    for (const [px, pz] of poles) {
      const pGeo = new THREE.CylinderGeometry(0.08, 0.08, 13.6, 8);
      pGeo.translate(px, -3.7, pz);
      scafBatch.add(pGeo, mDarkSteel);
    }
    // Horizontal scaffolding decks & safety guardrails every 3.2m
    for (const ly of [-7.3, -4.1, -0.9, 2.75]) {
      const deck = new THREE.BoxGeometry(2.35, 0.14, 2.35);
      deck.translate(3.1, ly, -1.7);
      scafBatch.add(deck, mWoodPlank);
      const rail1 = new THREE.BoxGeometry(2.35, 0.08, 0.08);
      rail1.translate(3.1, ly + 0.95, -0.6);
      scafBatch.add(rail1, mDarkSteel);
      const rail2 = new THREE.BoxGeometry(2.35, 0.08, 0.08);
      rail2.translate(3.1, ly + 0.95, -2.8);
      scafBatch.add(rail2, mDarkSteel);
    }
    // Tall vertical ladder at x = 1.9, z = -2.65 (rails + rungs every 0.48m from y=-10.5 to +3.1!)
    const railL = new THREE.CylinderGeometry(0.055, 0.055, 13.8, 8);
    railL.translate(1.55, -3.6, -2.65);
    const railR = new THREE.CylinderGeometry(0.055, 0.055, 13.8, 8);
    railR.translate(2.25, -3.6, -2.65);
    scafBatch.add(railL, mDarkSteel);
    scafBatch.add(railR, mDarkSteel);
    for (let ry = -10.1; ry <= 2.9; ry += 0.48) {
      const rung = new THREE.CylinderGeometry(0.04, 0.04, 0.72, 6);
      rung.rotateZ(Math.PI / 2);
      rung.translate(1.9, ry, -2.65);
      scafBatch.add(rung, mDarkSteel);
    }
    // Second scaffolding tower on left side (x = -4.2..-2.2) for rebar assembly
    for (const [px, pz] of [[-4.1, -2.5], [-2.3, -2.5], [-4.1, -0.7], [-2.3, -0.7]] as [number, number][]) {
      const pGeo = new THREE.CylinderGeometry(0.075, 0.075, 11.2, 8);
      pGeo.translate(px, -4.9, pz);
      scafBatch.add(pGeo, mDarkSteel);
    }
    for (const ly of [-7.5, -3.1]) {
      const deck = new THREE.BoxGeometry(2.0, 0.14, 2.0);
      deck.translate(-3.2, ly, -1.6);
      scafBatch.add(deck, mWoodPlank);
    }
    scafBatch.build(this.scaffoldGroup, true, true);
    R.add(this.scaffoldGroup);

    // -------------------------------------------------------------------------
    // 5. INDUSTRIAL DEWATERING PUMP STATION + STEEL PLATFORM + PRESSURE GAUGES + WATER JETS
    // -------------------------------------------------------------------------
    const pumpBatch = new StaticBatch();
    // Steel support catwalk platform bridging barge edge (-8.6) & cofferdam rim (-5.8)
    const pumpDeck = new THREE.BoxGeometry(3.2, 0.24, 6.4);
    pumpDeck.translate(-7.2, 1.98, -0.1);
    pumpBatch.add(pumpDeck, mDarkSteel);
    for (const pz of [1.4, -1.6]) {
      // Heavy orange industrial pump housing resting cleanly on the steel platform
      const base = new THREE.BoxGeometry(2.1, 1.35, 1.5);
      base.translate(-7.2, 2.75, pz);
      pumpBatch.add(base, mPumpOrange);
      // White pressure gauge dial + dark outer bezel + needle indicator on front face
      const bezel = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 16);
      bezel.rotateX(Math.PI / 2);
      bezel.translate(-7.2, 2.85, pz + 0.76);
      pumpBatch.add(bezel, mDarkSteel);
      const gauge = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
      gauge.rotateX(Math.PI / 2);
      gauge.translate(-7.2, 2.85, pz + 0.78);
      pumpBatch.add(gauge, mWhite);
      const needle = new THREE.BoxGeometry(0.05, 0.22, 0.04);
      needle.rotateZ(-0.55);
      needle.translate(-7.15, 2.91, pz + 0.84);
      pumpBatch.add(needle, mDarkSteel);
      // Vertical black suction hose plunging down inside cofferdam
      const intake = new THREE.CylinderGeometry(0.22, 0.22, 12.6, 10);
      intake.translate(-4.9, -3.1, pz);
      pumpBatch.add(intake, mDarkSteel);
      const elbow = new THREE.BoxGeometry(2.4, 0.42, 0.42);
      elbow.translate(-6.0, 3.1, pz);
      pumpBatch.add(elbow, mDarkSteel);
      // Discharge pipe arcing OVER the right rim (x = +6.6)
      const outPipe = new THREE.CylinderGeometry(0.24, 0.24, 3.6, 10);
      outPipe.rotateZ(Math.PI / 2);
      outPipe.translate(6.6, 3.1, pz);
      pumpBatch.add(outPipe, mMidSteel);
    }
    pumpBatch.build(this.pumpStationGroup, true, true);
    R.add(this.pumpStationGroup);

    // Animated parabolic water jets blasting out of discharge pipes into the sea!
    for (const pz of [1.4, -1.6]) {
      for (let s = 0; s < 10; s++) {
        const u = s / 9;
        const jx = 8.1 + u * 2.1;
        const jy = 3.05 - u * u * 3.1;
        const rad = 0.24 + u * 0.22;
        const seg = new THREE.Mesh(new THREE.SphereGeometry(rad, 8, 6), mJetWater);
        seg.position.set(jx, jy, pz);
        seg.scale.set(1.5, 0.9, 0.9);
        seg.layers.set(NOINK);
        this.waterJetsGroup.add(seg);
        this.waterJetSegments.push(seg);
      }
    }
    R.add(this.waterJetsGroup);

    // -------------------------------------------------------------------------
    // 6. DEEP BEDROCK BORED PILES & ROTATING DRILL RIG (Shot 18)
    // -------------------------------------------------------------------------
    const pilePositions: [number, number][] = [
      [-1.8, -1.6], [0, -1.8], [1.8, -1.6],
      [-1.8, 1.4],  [0, 1.6],  [1.8, 1.4],
    ];
    const bpBatch = new StaticBatch();
    for (const [bx, bz] of pilePositions) {
      const bp = new THREE.CylinderGeometry(0.58, 0.58, 6.0, 14);
      bp.translate(bx, -12.8, bz);
      bpBatch.add(bp, mConcrete);
    }
    bpBatch.build(this.boredPilesGroup, true, true);
    R.add(this.boredPilesGroup);

    // Yellow industrial rotary drill rig standing at (0, -10.5, 0)
    const rigTower = new THREE.Mesh(new THREE.BoxGeometry(1.1, 8.8, 1.1), mCraneYellow);
    rigTower.position.set(0, -6.1, -0.8);
    rigTower.castShadow = true;
    const rigBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.8, 2.4), mDarkSteel);
    rigBase.position.set(0, -10.1, -0.8);
    this.drillRigGroup.add(rigTower, rigBase);

    // Rotating auger spiral drill shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 11.5, 10), mMidSteel);
    shaft.position.set(0, -9.8, 0.5);
    this.drillBitGroup.add(shaft);
    for (let i = 0; i < 12; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.28), mDarkSteel);
      fin.position.set(0, -14.8 + i * 0.72, 0.5);
      fin.rotation.y = i * 0.55;
      this.drillBitGroup.add(fin);
    }
    this.drillRigGroup.add(this.drillBitGroup);
    R.add(this.drillRigGroup);

    // -------------------------------------------------------------------------
    // 7. MULTI-TIER STEEL REBAR CAGE (Shot 19)
    // -------------------------------------------------------------------------
    const rebarBatch = new StaticBatch();
    // Footing base mat (y = -10.4..-8.2)
    const matSlab = new THREE.BoxGeometry(7.2, 1.6, 7.2);
    matSlab.translate(0, -9.7, 0);
    rebarBatch.add(matSlab, mConcrete);
    // Vertical steel rebars arranged in column rectangle (x = -1.6..1.6, z = -2.0..2.0)
    for (let x = -1.6; x <= 1.61; x += 0.64) {
      for (let z = -2.0; z <= 2.01; z += 0.8) {
        if (Math.abs(x) < 1.3 && Math.abs(z) < 1.6) continue; // perimeter bars
        const bar = new THREE.CylinderGeometry(0.065, 0.065, 15.0, 6);
        bar.translate(x, -1.5, z);
        rebarBatch.add(bar, mRebar);
      }
    }
    // Horizontal steel tie hoops every 0.85m
    for (let y = -8.2; y <= 5.6; y += 0.85) {
      const h1 = new THREE.BoxGeometry(3.45, 0.09, 0.09);
      h1.translate(0, y, 2.05);
      const h2 = new THREE.BoxGeometry(3.45, 0.09, 0.09);
      h2.translate(0, y, -2.05);
      const h3 = new THREE.BoxGeometry(0.09, 0.09, 4.2);
      h3.translate(1.65, y, 0);
      const h4 = new THREE.BoxGeometry(0.09, 0.09, 4.2);
      h4.translate(-1.65, y, 0);
      rebarBatch.add(h1, mRebar);
      rebarBatch.add(h2, mRebar);
      rebarBatch.add(h3, mRebar);
      rebarBatch.add(h4, mRebar);
    }
    rebarBatch.build(this.rebarCageGroup, true, true);
    R.add(this.rebarCageGroup);

    // Concrete formwork panels & pouring chute (Shot 20 night shift)
    const fwBatch = new StaticBatch();
    for (const [fx, fz, rw, rd] of [
      [0, -2.45, 4.4, 0.25],
      [2.25, 0, 0.25, 4.9],
      [-2.25, 0, 0.25, 4.9],
    ] as [number, number, number, number][]) {
      const panel = new THREE.BoxGeometry(rw, 11.5, rd);
      panel.translate(fx, 4.2, fz);
      fwBatch.add(panel, mMidSteel);
    }
    // Overhead concrete boom pipe pouring into top of pier
    const boomPipe = new THREE.CylinderGeometry(0.24, 0.24, 14.0, 10);
    boomPipe.rotateZ(Math.PI / 2.6);
    boomPipe.translate(-5.8, 12.6, 0);
    fwBatch.add(boomPipe, mPumpOrange);
    fwBatch.build(this.formworkGroup, true, true);

    this.pourStreamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 5.2, 10), mConcreteWet);
    this.pourStreamMesh.position.set(0, 9.2, 0);
    this.formworkGroup.add(this.pourStreamMesh);
    R.add(this.formworkGroup);

    // -------------------------------------------------------------------------
    // 8. HERO WEATHERED CONCRETE PIER (ref_003 / ref_009 architectural silhouette!)
    // -------------------------------------------------------------------------
    this.heroFootingMesh = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3.0, 7.6), mConcrete);
    this.heroFootingMesh.position.set(0, -9.0, 0);
    this.heroFootingMesh.castShadow = true;
    this.heroFootingMesh.receiveShadow = true;

    this.heroColumnMesh = new THREE.Mesh(new THREE.BoxGeometry(3.8, 19.0, 4.6), mConcretePier);
    this.heroColumnMesh.position.set(0, 2.0, 0);
    this.heroColumnMesh.castShadow = true;
    this.heroColumnMesh.receiveShadow = true;

    // Iconic hammerhead trapezoidal pier cap (matching ref_003 & ref_009!)
    const capLower = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.4, 5.2), mConcrete);
    capLower.position.set(0, 11.4, 0);
    capLower.castShadow = true;
    capLower.receiveShadow = true;
    const capUpper = new THREE.Mesh(new THREE.BoxGeometry(10.8, 1.6, 5.6), mConcrete);
    capUpper.position.set(0, 12.6, 0);
    capUpper.castShadow = true;
    capUpper.receiveShadow = true;
    this.heroHammerheadGroup.add(capLower, capUpper);

    this.heroPierGroup.add(this.heroFootingMesh, this.heroColumnMesh, this.heroHammerheadGroup);
    R.add(this.heroPierGroup);

    // -------------------------------------------------------------------------
    // 9. COMPLETED MULTI-SPAN SEA BRIDGE + 4-LANE DECK + STREETLIGHTS + TRAFFIC (Along Z!)
    // -------------------------------------------------------------------------
    const bridgeBatch = new StaticBatch();
    // Neighboring massive concrete piers along Z (z = -128, -96, -64, -32, +32, +64, +96)
    for (const pz of [-128, -96, -64, -32, 32, 64, 96]) {
      const col = new THREE.BoxGeometry(3.8, 22.0, 4.6);
      col.translate(0, 0.5, pz);
      bridgeBatch.add(col, mConcretePier);
      const cap = new THREE.BoxGeometry(10.8, 2.0, 5.6);
      cap.translate(0, 12.4, pz);
      bridgeBatch.add(cap, mConcrete);
    }
    // Box girder structural spine (y = 13.4..14.6)
    const girder = new THREE.BoxGeometry(10.2, 1.6, 360);
    girder.translate(0, 13.8, -12);
    bridgeBatch.add(girder, mConcrete);

    // 4-lane asphalt roadway surface at y = 14.65 (width = 11.4m along X, length = 360m along Z)
    const roadGeo = new THREE.PlaneGeometry(11.4, 360);
    roadGeo.rotateX(-Math.PI / 2);
    roadGeo.translate(0, 14.66, -12);
    bridgeBatch.add(roadGeo, mAsphalt);

    // Signature black-and-white zebra curbs & concrete safety parapets along both sides!
    for (const side of [-1, 1]) {
      const curb = new THREE.BoxGeometry(0.45, 0.35, 360);
      curb.translate(side * 5.65, 14.82, -12);
      bridgeBatch.add(curb, mZebraCurb);
      const wall = new THREE.BoxGeometry(0.42, 0.95, 360);
      wall.translate(side * 5.95, 15.12, -12);
      bridgeBatch.add(wall, mConcrete);
    }

    // Repeating double-arm bridge streetlights along center median
    for (let lz = -150; lz <= 110; lz += 22) {
      const pole = new THREE.CylinderGeometry(0.11, 0.14, 5.4, 8);
      pole.translate(0, 17.3, lz);
      bridgeBatch.add(pole, mMidSteel);
      const arm = new THREE.BoxGeometry(3.4, 0.12, 0.14);
      arm.translate(0, 19.9, lz);
      bridgeBatch.add(arm, mMidSteel);
    }
    bridgeBatch.build(this.fullBridgeGroup, true, true);

    // Stylized realistic-proportioned moving cars & cargo trucks along Z!
    const carColors = ["#c43c35", "#3568a8", "#d69a2c", "#e4e6eb", "#347a56", "#586270", "#d46a2c"];
    const lanes: { x: number; dir: number; speed: number }[] = [
      { x: -3.7, dir: -1, speed: 15.5 },
      { x: -1.5, dir: -1, speed: 19.0 },
      { x: 1.5, dir: 1, speed: 18.0 },
      { x: 3.7, dir: 1, speed: 14.5 },
    ];
    for (let i = 0; i < 24; i++) {
      const lane = lanes[i % lanes.length];
      const isTruck = i % 4 === 0;
      const g = new THREE.Group();
      const bodyMat = mats.lam(`car_${i % carColors.length}`, () => ({ color: carColors[i % carColors.length] }));
      if (isTruck) {
        const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.55, 3.6), mWhite);
        cargo.position.set(0, 1.15, -0.5 * lane.dir);
        cargo.castShadow = true;
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.25, 1.35), bodyMat);
        cab.position.set(0, 0.95, 2.0 * lane.dir);
        cab.castShadow = true;
        g.add(cargo, cab);
      } else {
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.72, 3.1), bodyMat);
        chassis.position.set(0, 0.56, 0);
        chassis.castShadow = true;
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.62, 1.65), mWindow);
        cabin.position.set(0, 1.14, -0.15 * lane.dir);
        cabin.castShadow = true;
        g.add(chassis, cabin);
      }
      g.position.set(lane.x, 14.66, -130 + i * 11.5);
      this.fullBridgeGroup.add(g);
      this.trafficCars.push({
        mesh: g,
        laneX: lane.x,
        dir: lane.dir,
        speed: lane.speed,
        baseZ: -130 + i * 11.5,
      });
    }
    R.add(this.fullBridgeGroup);

    // -------------------------------------------------------------------------
    // 10. FLOATING HEAVY CRANE BARGE + ARTICULATED LATTICE CRANE (x = -13.5, z = 1.5)
    // -------------------------------------------------------------------------
    const bargeBatch = new StaticBatch();
    // Main maritime dark steel hull (width 10.6m X, length 18.0m Z, y = -1.6..+2.0)
    const hullMain = new THREE.BoxGeometry(10.6, 2.6, 18.0);
    hullMain.translate(0, 0.7, 0);
    bargeBatch.add(hullMain, mBargeHull);
    // Red marine antifouling waterline band
    const hullRed = new THREE.BoxGeometry(10.72, 0.7, 18.12);
    hullRed.translate(0, -0.25, 0);
    bargeBatch.add(hullRed, mBargeRed);
    // Steel deck top surface (y = 2.02)
    const deck = new THREE.BoxGeometry(10.3, 0.12, 17.7);
    deck.translate(0, 2.0, 0);
    bargeBatch.add(deck, mBargeDeck);
    // Safety railings along deck perimeter
    for (const [rx, rz, rw, rd] of [
      [5.05, 0, 0.14, 17.5],
      [-5.05, 0, 0.14, 17.5],
      [0, 8.75, 10.2, 0.14],
      [0, -8.75, 10.2, 0.14],
    ] as [number, number, number, number][]) {
      const rail = new THREE.BoxGeometry(rw, 0.85, rd);
      rail.translate(rx, 2.45, rz);
      bargeBatch.add(rail, mCraneYellow);
    }
    // Barge crew deckhouse / control cabin at stern (z = -6.2)
    const cabin = new THREE.BoxGeometry(5.2, 2.8, 3.6);
    cabin.translate(-1.2, 3.4, -6.2);
    bargeBatch.add(cabin, mWhite);
    const cabinWin = new THREE.BoxGeometry(4.4, 0.9, 3.72);
    cabinWin.translate(-1.2, 3.85, -6.2);
    bargeBatch.add(cabinWin, mWindow);
    // Stacked spare steel sheet piles on barge deck
    for (let s = 0; s < 4; s++) {
      const sp = new THREE.BoxGeometry(0.45, 0.35, 7.5);
      sp.translate(-2.4 + s * 0.55, 2.24, 3.8);
      bargeBatch.add(sp, mSheetPile);
    }
    bargeBatch.build(this.bargeGroup, true, true);

    // Articulated Heavy Crawler/Pedestal Lattice Crane on Barge Deck (local x = -0.8, y = 2.05, z = -1.2)
    const craneBase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.4, 1.2, 14), mDarkSteel);
    craneBase.position.set(-0.8, 2.65, -1.2);
    this.bargeGroup.add(craneBase);

    this.craneUpper.position.set(-0.8, 3.3, -1.2);
    const cabHouse = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.6, 4.6), mCraneYellow);
    cabHouse.position.set(-0.4, 1.3, 0);
    cabHouse.castShadow = true;
    const counterweight = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 1.8), mDarkSteel);
    counterweight.position.set(-2.2, 1.1, 0);
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 2.2), mDarkSteel);
    gantry.position.set(-1.4, 3.4, 0);
    this.craneUpper.add(cabHouse, counterweight, gantry);

    // Lattice crane boom (pivoting from local (1.2, 2.2, 0), length 21m)
    this.craneBoom.position.set(1.2, 2.2, 0);
    const boomLen = 21.0;
    const boomBatch = new StaticBatch();
    for (const [oy, oz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]] as [number, number][]) {
      const chord = new THREE.BoxGeometry(boomLen, 0.16, 0.16);
      chord.translate(boomLen * 0.5, oy, oz);
      boomBatch.add(chord, mCraneYellow);
    }
    for (let x = 1.0; x < boomLen; x += 2.0) {
      const strutV = new THREE.BoxGeometry(0.12, 1.15, 1.15);
      strutV.translate(x, 0, 0);
      boomBatch.add(strutV, mDarkSteel);
    }
    boomBatch.build(this.craneBoom, true, false);
    this.craneUpper.add(this.craneBoom);
    this.bargeGroup.add(this.craneUpper);

    // World-space hoist cable + interchangeable hook attachments (positioned smoothly in update!)
    this.craneCable = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), mDarkSteel);
    R.add(this.craneCable);

    // Hook Attachment 1: Concrete Hopper Bucket (Shot 4)
    const bktCone = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.45, 2.2, 12), mPumpOrange);
    const bktPour = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 4.8, 10), mConcreteWet);
    bktPour.position.y = -3.4;
    this.hookBucket.add(bktCone, bktPour);

    // Hook Attachment 2: Vibratory Pile Hammer + Hanging Sheet Pile (Shots 9, 10, 22)
    const hammerBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.1, 1.4), mCraneYellow);
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), mDarkSteel);
    clamp.position.y = -1.35;
    const hangingPile = new THREE.Mesh(new THREE.BoxGeometry(0.92, 14.5, 0.36), mSheetPile);
    hangingPile.position.y = -8.8;
    this.hookHammer.add(hammerBox, clamp, hangingPile);

    // Hook Attachment 3: Rebar Sling Crossbar (Shot 19)
    const slingBar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.28, 0.28), mCraneYellow);
    this.hookRebarSling.add(slingBar);

    this.hookGroup.add(this.hookBucket, this.hookHammer, this.hookRebarSling);
    R.add(this.hookGroup);

    this.bargeGroup.position.set(-13.5, 0, 1.5);
    R.add(this.bargeGroup);

    // -------------------------------------------------------------------------
    // 11. MARINE SUPPORT FLEET — TUGBOAT & DISTANT CARGO SHIP
    // -------------------------------------------------------------------------
    const tugBatch = new StaticBatch();
    const tHull = new THREE.BoxGeometry(4.2, 1.8, 9.2);
    tHull.translate(0, 0.5, 0);
    tugBatch.add(tHull, mBargeRed);
    const tDeck = new THREE.BoxGeometry(3.8, 0.3, 8.6);
    tDeck.translate(0, 1.45, 0);
    tugBatch.add(tDeck, mDarkSteel);
    const tHouse = new THREE.BoxGeometry(2.6, 2.4, 3.2);
    tHouse.translate(0, 2.75, -0.8);
    tugBatch.add(tHouse, mWhite);
    const tStack = new THREE.CylinderGeometry(0.32, 0.38, 1.8, 8);
    tStack.translate(0, 4.4, -1.6);
    tugBatch.add(tStack, mCraneYellow);
    tugBatch.build(this.tugboatGroup, true, true);
    this.tugboatGroup.position.set(16.5, 0, -18);
    this.tugboatGroup.rotation.y = -0.45;
    R.add(this.tugboatGroup);

    // Distant container cargo ship cruising across background horizon
    const shipBatch = new StaticBatch();
    const sHull = new THREE.BoxGeometry(38, 5.2, 11);
    sHull.translate(0, 2.2, 0);
    shipBatch.add(sHull, mBargeHull);
    const sRed = new THREE.BoxGeometry(38.4, 1.4, 11.3);
    sRed.translate(0, 0.2, 0);
    shipBatch.add(sRed, mBargeRed);
    const sBridge = new THREE.BoxGeometry(5.5, 8.5, 9.5);
    sBridge.translate(-13, 8.2, 0);
    shipBatch.add(sBridge, mWhite);
    const cColors = ["#b53d34", "#2f6b9e", "#c98b2c", "#397a54"];
    for (let i = 0; i < 6; i++) {
      const cMat = mats.lam(`cont_${i % 4}`, () => ({ color: cColors[i % 4] }));
      const box = new THREE.BoxGeometry(4.2, 3.6, 8.2);
      box.translate(-5.5 + i * 4.6, 6.4, 0);
      shipBatch.add(box, cMat);
    }
    shipBatch.build(this.cargoShipGroup, false, false);
    this.cargoShipGroup.position.set(-45, 0, -115);
    R.add(this.cargoShipGroup);

    // -------------------------------------------------------------------------
    // 12. NIGHT SHIFT FLOODLIGHT TOWERS (Shots 20–21, ref_009 signature motif!)
    // -------------------------------------------------------------------------
    const lightTowerCoords: [number, number, number][] = [
      [-8.5, 2.0, 6.2],
      [-8.5, 2.0, -3.5],
      [6.4, 2.6, -2.5],
    ];
    for (const [lx, ly, lz] of lightTowerCoords) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 7.6, 8), mMidSteel);
      pole.position.set(lx, ly + 3.8, lz);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 0.4), mDarkSteel);
      bar.position.set(lx, ly + 7.5, lz);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.55, 0.5), mLampEmissive);
      lamp.position.set(lx, ly + 7.25, lz);
      lamp.layers.set(NOINK);
      this.nightLightsGroup.add(pole, bar, lamp);
    }
    R.add(this.nightLightsGroup);

    // -------------------------------------------------------------------------
    // 13. UNDERWATER FAILING WET CONCRETE CHUNKS (Shot 5)
    // -------------------------------------------------------------------------
    for (let i = 0; i < 16; i++) {
      const ch = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + (i % 3) * 0.16, 0), mConcreteWet);
      ch.position.set((i % 4) * 0.7 - 1.0, -1.2 - i * 0.55, ((i * 3) % 5) * 0.5 - 1.0);
      this.concreteFailGroup.add(ch);
      this.concreteFailChunks.push(ch);
    }
    R.add(this.concreteFailGroup);
  }

  private getActor(i: number) {
    while (this.actors.length <= i) this.actors.push(new ActorBillboard(this.root));
    return this.actors[i];
  }

  private getFx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new FxBillboard(this.root));
    return this.fxs[i];
  }

  private applyMoodLighting(mood: MoodMode, light: LightMode, cam: THREE.PerspectiveCamera, scene: THREE.Scene, focus: THREE.Vector3) {
    applyLightUniforms(light);
    updateSkyAndFog(this.sky, this.fog, cam.position, scene, light);

    // Clamp golden elevation >= 20 deg & light front faces of piers/cars in warm amber gold!
    const azOverride = mood === "golden" ? 118 : undefined;
    const elOverride = mood === "golden" ? 22 : mood === "night" ? 42 : mood === "underwater" ? 65 : undefined;
    const sunDir = updateCameraRelativeSun(this.sunRig, cam.position, focus, light, azOverride, elOverride);

    if (mood === "night") {
      // Exact cobalt-blue night construction look from ref_009.jpg!
      const nightSky = ["#1d3c7c", "#17336c", "#122959", "#0e2049", "#081432"];
      nightSky.forEach((h, i) => untone(h, this.sky.mat.uniforms["c" + i].value));
      untone("#142d61", this.fog.color);
      this.fog.near = 40;
      this.fog.far = 340;

      TONE.uLitCol.value.set(1.52, 1.38, 1.12); // Warm LED/sodium work floodlights
      TONE.uShadeCol.value.set(0.18, 0.30, 0.62); // Deep cobalt-blue night shadows!
      TONE.uShadeLift.value.set(0.05, 0.10, 0.24);
      TONE.uSat.value = 1.08;

      CHAR.uCharTint.value.set(1.04, 0.96, 0.85);
      CHAR.uCharShade.value = 0.78;
      CHAR.uSideTint.value.set(0.62, 0.78, 1.08);

      this.clouds.clouds.forEach((c) => {
        c.visible = false;
      });
    } else if (mood === "underwater") {
      // Deep marine underwater cutaway atmosphere — soft teal-cobalt seabed lighting (zero harsh sun strip!)
      const uwSky = ["#0d4f6e", "#0a415d", "#07334b", "#052639", "#041b2a"];
      uwSky.forEach((h, i) => untone(h, this.sky.mat.uniforms["c" + i].value));
      untone("#0b4561", this.fog.color);
      this.fog.near = 16;
      this.fog.far = 110;

      TONE.uLitCol.value.set(0.38, 0.62, 0.78);
      TONE.uShadeCol.value.set(0.22, 0.40, 0.56);
      TONE.uShadeLift.value.set(0.05, 0.14, 0.24);
      TONE.uSat.value = 1.04;

      this.clouds.clouds.forEach((c) => {
        c.visible = false;
      });
    } else {
      this.clouds.clouds.forEach((c) => {
        c.visible = true;
      });
      this.clouds.update(cam.position, light);
    }

    return sunDir;
  }

  update(shotId: number, frame: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3 {
    const shot = SHOTS.find((s) => s.id === shotId) ?? SHOTS[0];
    const tSec = frame / FPS;
    const localU = Math.min(1, Math.max(0, (frame - shot.a) / Math.max(1, shot.b - shot.a)));

    // 1. Camera placement
    const c = camAt(shotId, frame);
    cam.position.set(...c.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...c.look);
    cam.rotateZ(c.roll);
    cam.fov = c.fov;
    cam.near = 0.2;
    cam.far = 1500;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    const focus = new THREE.Vector3(...c.look);
    cam.layers.enable(3); // NOINK layer

    // 2. Lighting, sky, fog, ocean
    this.sunRig.sun.castShadow = shotId !== 3 && shotId !== 5;
    const sunDir = this.applyMoodLighting(shot.mood, shot.light, cam, scene, focus);
    this.ocean.update(tSec, shot.mood);

    // 3. Barge gentle sea bob & fleet cruise
    const bargeBob = Math.sin(tSec * 1.45) * 0.12;
    this.bargeGroup.position.y = bargeBob;
    this.bargeGroup.rotation.z = Math.sin(tSec * 1.1) * 0.008;
    const bargeDeckY = 2.06 + bargeBob;

    this.tugboatGroup.position.y = Math.sin(tSec * 1.8 + 1.0) * 0.14;
    this.cargoShipGroup.position.x = -55 + tSec * 1.1;

    // 4. Bridge deck & moving traffic visibility (Hook shots 1-2 & Finale shots 24-26)
    const showCompletedBridge = shotId === 1 || shotId === 2 || shotId >= 24;
    this.fullBridgeGroup.visible = showCompletedBridge;
    if (showCompletedBridge) {
      for (const car of this.trafficCars) {
        const span = 260;
        const raw = car.baseZ + car.dir * car.speed * tSec;
        const wrapped = ((((raw + 130) % span) + span) % span) - 130;
        car.mesh.position.z = wrapped;
      }
    }

    // 5. Hero concrete pier construction stage visibility
    const showHeroPier = shotId === 1 || shotId === 2 || shotId >= 20;
    this.heroPierGroup.visible = showHeroPier;
    if (showHeroPier) {
      if (shotId === 20) {
        // Rising concrete pier during night shift pouring!
        const grow = 0.45 + localU * 0.45;
        this.heroColumnMesh.scale.y = grow;
        this.heroColumnMesh.position.y = -7.5 + (19.0 * grow) * 0.5;
        this.heroHammerheadGroup.visible = false;
      } else {
        this.heroColumnMesh.scale.y = 1;
        this.heroColumnMesh.position.y = 2.0;
        this.heroHammerheadGroup.visible = shotId === 1 || shotId === 2 || shotId >= 21;
      }
    }

    // 6. Cofferdam sheet piles visibility, cutaway slice & pile-driving / extraction animation
    const showCofferdam = shotId >= 9 && shotId <= 22;
    this.cofferdamGroup.visible = showCofferdam;
    const isCutaway = shotId === 11 || shotId === 15 || shotId === 16 || shotId === 17 || shotId === 18 || shotId === 19;

    if (showCofferdam) {
      this.sheetPiles.forEach((sp, idx) => {
        // Architectural half-section cutaway removes all front-half sheet piles (z > 0.15) cleanly!
        if (isCutaway && sp.z > 0.15) {
          sp.mesh.visible = false;
          return;
        }
        sp.mesh.visible = true;

        if (shotId === 9) {
          // Half the ring driven, active pile descending
          sp.mesh.visible = idx < 22;
          sp.mesh.position.y = -5.35;
        } else if (shotId === 10) {
          // Sequential hammering down of remaining piles
          const progressCount = 22 + Math.floor(localU * 14);
          sp.mesh.visible = idx <= progressCount;
          if (idx === progressCount) {
            const frac = (localU * 14) % 1;
            const stepPulse = Math.floor(frac * 4) / 4;
            sp.mesh.position.y = 2.5 - stepPulse * 7.85;
          } else {
            sp.mesh.position.y = -5.35;
          }
        } else if (shotId === 11) {
          // Underwater view: entire visible back arc plunges down into seabed!
          const drop = Math.min(1, localU * 1.15);
          sp.mesh.position.y = 1.5 - drop * 6.85;
        } else if (shotId === 22) {
          // Golden hour: pulling sheet piles UP one by one!
          const pulledIdx = Math.floor(localU * 18);
          if (idx < pulledIdx) {
            sp.mesh.visible = false;
          } else if (idx === pulledIdx) {
            const frac = (localU * 18) % 1;
            sp.mesh.position.y = -5.35 + frac * 11.5;
          } else {
            sp.mesh.position.y = -5.35;
          }
        } else {
          sp.mesh.position.y = -5.35;
        }
      });
    }

    // 7. Ocean surface & inner water disk (clean half-ocean architectural slice on cutaway shots!)
    this.ocean.outerMesh.visible = !isCutaway;
    this.ocean.cutOuterMesh.visible = isCutaway;
    if (shotId === 15) {
      this.ocean.innerMesh.visible = false;
      this.ocean.cutInnerMesh.visible = true;
      this.ocean.cutInnerMesh.position.y = -localU * 10.25;
    } else if (shotId >= 16 && shotId <= 21) {
      this.ocean.innerMesh.visible = false;
      this.ocean.cutInnerMesh.visible = false;
    } else {
      this.ocean.innerMesh.visible = !isCutaway;
      this.ocean.cutInnerMesh.visible = isCutaway;
      this.ocean.innerMesh.position.y = 0;
      this.ocean.cutInnerMesh.position.y = 0;
    }

    // 8. Internal bracing, scaffolding, dewatering pumps, jets, drill rig, rebar, formwork, night lights
    this.bracingGroup.visible = shotId >= 13 && shotId <= 21 && !isCutaway;
    this.scaffoldGroup.visible = shotId >= 16 && shotId <= 21;
    this.pumpStationGroup.visible = shotId === 14 || shotId === 15;
    this.waterJetsGroup.visible = shotId === 15;
    if (shotId === 15) {
      this.waterJetSegments.forEach((seg, idx) => {
        const pulse = 0.85 + Math.sin(tSec * 22 + idx * 0.9) * 0.22;
        seg.scale.set(1.5 * pulse, 0.9 * pulse, 0.9 * pulse);
      });
    }

    this.boredPilesGroup.visible = shotId >= 18 && shotId <= 19;
    this.drillRigGroup.visible = shotId === 18;
    if (shotId === 18) {
      this.drillBitGroup.rotation.y = tSec * 10.0;
      this.drillBitGroup.position.y = -localU * 1.4;
    }

    this.rebarCageGroup.visible = shotId === 19;
    if (shotId === 19) {
      this.rebarCageGroup.position.y = (1 - Math.min(1, localU * 1.2)) * 2.2;
    }

    this.formworkGroup.visible = shotId === 20;
    if (shotId === 20) {
      // Connect concrete pour stream directly from overhead pipe down into rising pier top!
      const pierTopY = -7.5 + 19.0 * (0.45 + localU * 0.45);
      const pipeTopY = 12.6;
      const streamH = Math.max(0.8, pipeTopY - pierTopY);
      this.pourStreamMesh.scale.set(
        0.9 + Math.sin(tSec * 16) * 0.14,
        streamH / 5.2,
        0.9 + Math.cos(tSec * 16) * 0.14
      );
      this.pourStreamMesh.position.y = pierTopY + streamH * 0.5;
    }

    this.nightLightsGroup.visible = shotId === 20 || shotId === 21;
    this.underwaterWallGroup.visible = shotId === 11 || shotId === 15 || shotId === 16 || shotId === 17 || shotId === 18 || shotId === 19;

    // Concrete washout chunks (Shot 5)
    this.concreteFailGroup.visible = shotId === 5;
    if (shotId === 5) {
      this.concreteFailChunks.forEach((ch, idx) => {
        ch.position.x = -0.6 + localU * (3.2 + (idx % 4) * 1.1) + Math.sin(tSec * 3 + idx) * 0.35;
        ch.position.y = -1.5 - idx * 0.42 - localU * 2.8;
        ch.rotation.x = tSec * 1.8 + idx;
        ch.rotation.z = tSec * 1.4 - idx;
      });
    }

    // 9. Articulated Crane Boom & Interchangeable Hoist Attachments
    const showBarge =
      shotId !== 1 &&
      shotId !== 3 &&
      shotId !== 5 &&
      shotId !== 11 &&
      shotId !== 16 &&
      shotId !== 17 &&
      shotId !== 18 &&
      shotId !== 23 &&
      shotId !== 24 &&
      shotId !== 25;
    this.bargeGroup.visible = showBarge;
    this.craneUpper.rotation.y =
      shotId === 2 ? -1.4 : shotId === 26 ? 0.9 : -0.06 + Math.sin(tSec * 0.35) * 0.04;
    this.craneBoom.rotation.z = shotId === 9 || shotId === 10 ? 0.82 : shotId === 22 ? 0.78 : 0.68;

    // Position crane cable & active hook attachment smoothly
    const showHook = shotId === 4 || shotId === 9 || shotId === 10 || shotId === 19 || shotId === 22;
    this.craneCable.visible = showHook;
    this.hookGroup.visible = showHook;
    this.hookBucket.visible = shotId === 4;
    this.hookHammer.visible = shotId === 9 || shotId === 10 || shotId === 22;
    this.hookRebarSling.visible = shotId === 19;

    if (showHook) {
      const tipX = -13.5 - 0.8 + 1.2 + Math.cos(this.craneBoom.rotation.z) * 20.5;
      const tipY = 3.3 + bargeBob + 2.2 + Math.sin(this.craneBoom.rotation.z) * 20.5;
      const tipZ = 0.2;
      let hx = 0;
      let hy = 6.5;
      let hz = 0;
      if (shotId === 4) {
        hx = 0;
        hy = 4.6 + Math.sin(tSec * 2.5) * 0.25;
        hz = 0;
      } else if (shotId === 9) {
        hx = 1.6;
        hy = 12.2 - localU * 4.5 + Math.sin(tSec * 36) * 0.12;
        hz = 5.9;
      } else if (shotId === 10) {
        hx = 2.4;
        hy = 9.5 - localU * 2.4 + Math.sin(tSec * 42) * 0.14;
        hz = 5.7;
      } else if (shotId === 19) {
        hx = 0;
        hy = 6.8 + (1 - Math.min(1, localU * 1.2)) * 2.2;
        hz = 0;
      } else if (shotId === 22) {
        hx = 4.5;
        hy = 8.5 + localU * 5.2;
        hz = 4.2;
      }
      this.hookGroup.position.set(hx, hy, hz);
      const cableLen = Math.max(1, tipY - hy);
      this.craneCable.scale.set(1, cableLen, 1);
      this.craneCable.position.set((tipX + hx) * 0.5, hy + cableLen * 0.5, (tipZ + hz) * 0.5);
    }

    // 10. Stage 2.5D slender engineers & diegetic FX billboards
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const staged = buildCast(shotId, tSec, shot.light, shot.mood, bargeDeckY, cam.position, right, sunDir);

    staged.actors.forEach((p, idx) => {
      const a = this.getActor(idx);
      a.r = this.pool.req(p.key, p.size[0], p.size[1], p.size[2], p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      const sc = p.scale ?? 1;
      a.mesh.scale.set(p.mirror ? -sc : sc, sc, sc);
    });
    for (let i = staged.actors.length; i < this.actors.length; i++) {
      this.actors[i].mesh.visible = false;
    }

    staged.fx.forEach((p, idx) => {
      const e = this.getFx(idx);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(p.kind);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, 0);
      else e.mesh.quaternion.copy(cam.quaternion);
      e.mesh.scale.set(p.w, p.h, 1);
    });
    for (let i = staged.fx.length; i < this.fxs.length; i++) {
      this.fxs[i].mesh.visible = false;
    }

    this.pool.flush();
    for (let i = 0; i < staged.actors.length; i++) this.actors[i].bind();
    for (let i = 0; i < staged.fx.length; i++) this.fxs[i].bind();

    return focus;
  }
}
