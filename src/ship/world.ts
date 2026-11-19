import * as THREE from "three";
import { ShipModel, PierModel, IronNailModel, V } from "./build";
import { waterNear, waterFar, cloudHD } from "../bridge/paint";
import { LIGHTS, LOOK } from "../bridge/lights";
import { TONE, CHAR, LFB, untone } from "../bridge/shade";
import { NOINK, noInkFallback } from "../bridge/ink";
import { Pool, Actor, Fx, stageShip } from "./cast";
import {
  FPS,
  camAt,
  nailStateAt,
  cutawayStateAt,
  V3,
  smooth,
} from "./story";

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;

const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.28 * wTime, 0.05 * wTime);  // ocean surface wave drift
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

function quadUp(
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  u: number,
  v: number,
  dy = 0
) {
  const y = dy,
    g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        x0, y, z1,
        x1, y, z1,
        x1, y, z0,
        x0, y, z1,
        x1, y, z0,
        x0, y, z0,
      ],
      3
    )
  );
  g.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(
      [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
      ],
      3
    )
  );
  g.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      [
        0, 0,
        u, 0,
        u, v,
        0, 0,
        u, v,
        0, v,
      ],
      2
    )
  );
  return g;
}

export class ShipWorld {
  root = new THREE.Group();

  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];

  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#b8d0ec", 30, 420);
  private WU: Record<string, THREE.IUniform>;
  private clouds: THREE.Mesh[] = [];

  public ship: ShipModel;
  public pier: PierModel;
  public nail: IronNailModel;

  private lookTarget = new THREE.Vector3();

  constructor() {
    const R = this.root;

    // ---- 1. Sky Dome (5 stops by elevation, cel-shaded toon horizon) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        c0: { value: new THREE.Color() },
        c1: { value: new THREE.Color() },
        c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() },
        c4: { value: new THREE.Color() },
        e: { value: new THREE.Vector4() },
      },
      vertexShader: `
        varying vec3 vP;
        void main() {
          vP = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 c0, c1, c2, c3, c4;
        uniform vec4 e;
        varying vec3 vP;
        void main() {
          float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1;
    this.sky.frustumCulled = false;
    this.sky.layers.set(NOINK);
    R.add(this.sky);

    // ---- 2. Lights ----
    this.hemi = new THREE.HemisphereLight("#dcecff", "#b49a78", 0.55);
    this.sun = new THREE.DirectionalLight("#fff3e0", 2.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);

    // ---- 3. Distant Cartoon Clouds ----
    const cloudMaps = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const d = 650 + (i % 3) * 50;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: cloudMaps[i % 4],
          color: new THREE.Color(1.1, 1.1, 1.1),
          transparent: true,
          depthWrite: false,
          fog: false,
        })
      );
      const w = 140 + (i % 3) * 35;
      m.position.set(Math.cos(a) * d, 110 + (i % 3) * 30, Math.sin(a) * d);
      m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m);
      R.add(m);
    }

    // ---- 4. Ocean Sea Surface (Bridge Water Shader) ----
    const wNear = waterNear(),
      wFar = waterFar();
    for (const t of [wNear, wFar]) {
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 8;
      t.needsUpdate = true;
    }
    this.WU = {
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
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
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
    waterM.customProgramCacheKey = () => "shipSea1";
    // Massive ocean surface at y = 0
    const seaMesh = new THREE.Mesh(
      quadUp(-1200, 1200, -1200, 1200, 1, 1, 0),
      waterM
    );
    seaMesh.receiveShadow = true;
    R.add(seaMesh);

    // ---- 5. 3D Models ----
    this.ship = new ShipModel();
    R.add(this.ship.root);

    this.pier = new PierModel();
    R.add(this.pier.root);

    this.nail = new IronNailModel();
    R.add(this.nail.root);
  }

  private actor(i: number) {
    while (this.actors.length <= i) {
      this.actors.push(new Actor(this.root));
    }
    return this.actors[i];
  }

  private fx(i: number) {
    while (this.fxs.length <= i) {
      this.fxs.push(new Fx(this.root));
    }
    return this.fxs[i];
  }

  update(
    shotId: number,
    f: number,
    cam: THREE.PerspectiveCamera,
    scene: THREE.Scene
  ): THREE.Vector3 {
    const t = f / FPS;
    const L = LIGHTS.day;
    const K = LOOK.day;

    // ---- 1. Camera Pose ----
    const c = camAt(shotId, f);
    cam.position.set(...c.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...c.look);
    cam.rotateZ(c.roll);
    cam.fov = c.fov;
    cam.near = 0.2;
    cam.far = 1500;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    this.lookTarget.set(...c.look);

    cam.layers.enable(NOINK);

    // ---- 2. Lighting & Shading Uniforms ----
    this.hemi.color.set(L.sky);
    this.hemi.groundColor.set(L.ground);
    this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol);
    this.sun.intensity = L.sunI;

    // Sun directional vector (sun azimuth & elevation)
    const az = THREE.MathUtils.degToRad(L.az);
    const el = THREE.MathUtils.degToRad(L.el);
    const sunDir = new THREE.Vector3(
      Math.sin(az) * Math.cos(el),
      Math.sin(el),
      -Math.cos(az) * Math.cos(el)
    ).normalize();

    this.sun.position.copy(this.lookTarget).addScaledVector(sunDir, 180);
    this.sun.target.position.copy(this.lookTarget);

    const sc = this.sun.shadow.camera;
    const Rr = 35;
    sc.left = -Rr;
    sc.right = Rr;
    sc.top = Rr;
    sc.bottom = -Rr;
    sc.near = 20;
    sc.far = 380;
    sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias;
    this.sun.shadow.normalBias = L.normalBias;
    this.fill.intensity = 0;

    TONE.uLitCol.value.set(...L.lit);
    TONE.uShadeCol.value.set(...L.shade);
    TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert;
    TONE.uSideK.value = L.sideK;
    TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce);
    TONE.uSat.value = K.sat;

    CHAR.uCharTint.value.set(...L.charTint);
    CHAR.uCharShade.value = L.charShade;
    CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad;
    CHAR.uSideTint.value.set(...L.sideTint);

    // ---- 3. Sky, Fog & Clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((hex, i) => untone(hex, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);

    untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear;
    this.fog.far = L.fogFar;
    scene.fog = this.fog;
    scene.background = null;

    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i];
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
    }

    // ---- 4. Water Shader Uniforms ----
    const W = this.WU,
      wc = K.water;
    untone(wc.near, W.wNearC.value);
    untone(wc.mid, W.wMidC.value);
    untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value);
    untone(wc.trough, W.wTrough.value);
    untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade);
    W.wTime.value = t;

    // ---- 5. Ship Buoyancy & Wave Motion ----
    // Gentle realistic ocean pitch and roll
    const shipPitch = 0.005 * Math.sin(t * 1.6);
    const shipRoll = 0.008 * Math.cos(t * 1.2);
    const shipHeave = 0.08 * Math.sin(t * 2.0);

    // ---- 6. Shot-Specific Logic ----
    if (shotId === 1) {
      // Shot 1: Bow Push
      this.pier.root.visible = false;
      this.nail.root.visible = false;
      this.ship.root.position.set(0, shipHeave, 0);
      this.ship.root.rotation.set(shipPitch, 0, shipRoll);
      this.ship.update(0, 0, 0, t);
    } else if (shotId === 2) {
      // Shot 2: Deck Nail Drop
      this.pier.root.visible = true;
      // Background ship visible to the left giving scale & depth
      this.ship.root.position.set(-18, shipHeave - 0.2, -6);
      this.ship.root.rotation.set(shipPitch, 0.35, shipRoll);
      this.ship.update(0, 0, 0, t);

      // Nail drop animation
      const ns = nailStateAt(f);
      this.nail.update(ns.pos, ns.visible, t);
    } else {
      // Shot 3: Hull Cutaway & Archimedes Force Arrows
      this.pier.root.visible = false;
      this.nail.root.visible = false;
      this.ship.root.position.set(0, shipHeave, 0);
      this.ship.root.rotation.set(shipPitch, 0, shipRoll);

      const cs = cutawayStateAt(f);
      this.ship.update(
        cs.cutawayProgress,
        cs.gravityScale,
        cs.buoyancyScale,
        t
      );
    }

    // ---- 7. 2.5D Characters & FX Sprites ----
    const st = stageShip(shotId, f, cam.position);
    let ai = 0;
    const usedActors: Actor[] = [];
    for (const p of st.places) {
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [600, 1000, 1];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(
        0,
        p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z),
        p.roll ?? 0
      );
      const sc = p.scale ?? 1;
      a.mesh.scale.set(p.mirror ? -sc : sc, sc, sc);
      usedActors.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) {
      this.actors[i].mesh.visible = false;
    }

    let fi = 0;
    const usedFxs: Fx[] = [];
    for (const p of st.fx) {
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) {
        e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      } else {
        e.mesh.rotation.set(
          0,
          Math.atan2(cam.position.x - p.x, cam.position.z - p.z),
          0
        );
      }
      e.mesh.scale.set(p.w, p.h, 1);
      usedFxs.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) {
      this.fxs[i].mesh.visible = false;
    }

    this.pool.flush();
    for (const a of usedActors) a.bind();
    for (const e of usedFxs) e.bind();

    noInkFallback(this.root);

    return this.lookTarget;
  }
}
