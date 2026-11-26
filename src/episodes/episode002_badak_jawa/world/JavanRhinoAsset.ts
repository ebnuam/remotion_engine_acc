// Javan Rhinoceros (Rhinoceros sondaicus) 3D Asset Wrapper — Jalur 3C
// Base mesh: CC-BY-4.0 Thomas Flynn (nebulousflynn), PBR-cleaned & adapted at
// public/episodes/episode002_badak_jawa/assets/javan_rhino_3c.glb
// Implements deterministic subtle secondary motion (breathing, head/ear micro-movement,
// weight shift, tail sway) with hooves pinned cleanly to ground (zero foot-sliding).

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";

export type RhinoPoseMode = "alert" | "browsing" | "distant";

export class JavanRhinoAsset {
  public root = new THREE.Group();
  private mesh: THREE.Mesh | null = null;
  private basePos: Float32Array | null = null;
  private contactShadow: THREE.Mesh;
  public isLoaded = false;

  constructor() {
    this.root.visible = false;

    // Grounded soft contact AO shadow directly under hooves & belly
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(128, 128, 22, 128, 128, 122);
    gr.addColorStop(0, "rgba(14, 12, 9, 0.68)");
    gr.addColorStop(0.55, "rgba(18, 16, 12, 0.34)");
    gr.addColorStop(1, "rgba(18, 16, 12, 0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(c);
    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.85),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      })
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(0, 0.025, 0);
    this.root.add(this.contactShadow);
  }

  public async load(): Promise<void> {
    const loader = new GLTFLoader();
    const texLoader = new THREE.TextureLoader();

    const glbUrl = staticFile("episodes/episode002_badak_jawa/assets/javan_rhino_3c.glb");
    const normUrl = staticFile("episodes/episode002_badak_jawa/assets/javan_rhino_normal.png");
    const roughUrl = staticFile("episodes/episode002_badak_jawa/assets/javan_rhino_roughness.png");

    const [gltf, normalMap, roughnessMap] = await Promise.all([
      loader.loadAsync(glbUrl),
      texLoader.loadAsync(normUrl),
      texLoader.loadAsync(roughUrl),
    ]);

    normalMap.flipY = false;
    roughnessMap.flipY = false;
    normalMap.colorSpace = THREE.NoColorSpace;
    roughnessMap.colorSpace = THREE.NoColorSpace;

    const model = gltf.scene;
    // Life-sized Javan Rhinoceros (R. sondaicus): ~3.03m long, ~1.68m shoulder height
    const scale = 1.62;
    model.scale.setScalar(scale);

    // Level weight-bearing front & rear hooves firmly onto damp forest floor
    // Raw Y-up minY is -0.512 rear, -0.441 front -> gentle pitch -0.042 rad + Y offset 0.768m
    model.rotation.z = -0.042;
    model.position.set(0, 0.768, 0);

    model.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;

        const oldMat = m.material as THREE.MeshStandardMaterial;
        const diffuseMap = oldMat?.map ?? null;
        if (diffuseMap) {
          diffuseMap.colorSpace = THREE.SRGBColorSpace;
          diffuseMap.anisotropy = 8;
        }

        // Physical damp-rainforest hide material (zero emissive glow, low metalness)
        m.material = new THREE.MeshStandardMaterial({
          map: diffuseMap,
          normalMap,
          normalScale: new THREE.Vector2(0.88, 0.88),
          roughnessMap,
          roughness: 0.86,
          metalness: 0.03,
          color: new THREE.Color("#f0eae2"),
          side: THREE.DoubleSide,
        });
        m.frustumCulled = false;

        // GLTFLoader may produce an InterleavedBufferAttribute when byteStride is present;
        // normalize to a dedicated contiguous Float32 BufferAttribute so secondary motion is safe.
        const rawPos = m.geometry.getAttribute("position");
        if (rawPos && !this.mesh) {
          const count = rawPos.count;
          const base = new Float32Array(count * 3);
          for (let i = 0; i < count; i++) {
            base[i * 3] = rawPos.getX(i);
            base[i * 3 + 1] = rawPos.getY(i);
            base[i * 3 + 2] = rawPos.getZ(i);
          }
          const cleanPos = new THREE.BufferAttribute(new Float32Array(base), 3);
          m.geometry.setAttribute("position", cleanPos);
          m.geometry.computeBoundingBox();
          m.geometry.computeBoundingSphere();
          this.mesh = m;
          this.basePos = base;
        }
      }
    });

    this.root.add(model);
    this.isLoaded = true;
    this.root.visible = true;
  }

  /**
   * Deterministic Jalur 3C secondary motion:
   * Subtle breathing, head/neck browsing or alert micro-scan, ear twitch, tail sway,
   * and slight weight shift while keeping hooves firmly anchored on terrain.
   */
  public update(tSec: number, pose: RhinoPoseMode = "alert"): void {
    if (!this.isLoaded || !this.mesh || !this.basePos) return;

    const posAttr = this.mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    const dst = posAttr.array as Float32Array;
    const src = this.basePos;

    // Remember: inside raw mesh space before Node 0's -90° X rotation:
    //   raw X = length (-0.96 rear .. +0.90 snout)
    //   raw Y = width  (-0.34 .. +0.34)
    //   raw Z = height (-0.51 hooves .. +0.53 back)
    const breath = Math.sin(tSec * 1.65) * 0.011;
    const weightShift = Math.sin(tSec * 0.7) * 0.008;
    const headPitch =
      pose === "browsing"
        ? -0.14 + Math.sin(tSec * 1.15) * 0.032
        : Math.sin(tSec * 0.85) * 0.022;
    const headYaw =
      pose === "browsing"
        ? Math.sin(tSec * 0.65) * 0.028
        : Math.sin(tSec * 0.55) * 0.036;
    const earTwitch = Math.pow(Math.max(0, Math.sin(tSec * 2.1)), 8) * 0.016;
    const tailSway = Math.sin(tSec * 1.9) * 0.018;

    const headPivotX = 0.36;
    const headPivotZ = 0.05;
    const cosP = Math.cos(headPitch);
    const sinP = Math.sin(headPitch);

    for (let i = 0; i < src.length; i += 3) {
      let x = src[i];
      let y = src[i + 1];
      let z = src[i + 2];

      // Smooth ground-pin mask (0 at hooves z < -0.36, 1 above knees z > -0.10)
      const gPin = THREE.MathUtils.smoothstep(z, -0.38, -0.08);

      // 1. Subtle breathing ribcage expansion (mid-body x in [-0.45, +0.35], z > -0.15)
      const chestMask =
        THREE.MathUtils.smoothstep(x, -0.55, -0.15) *
        (1 - THREE.MathUtils.smoothstep(x, 0.15, 0.45)) *
        THREE.MathUtils.smoothstep(z, -0.18, 0.25);
      y *= 1 + breath * chestMask;
      z += breath * 0.35 * chestMask;

      // 2. Subtle weight shift (zero at hooves)
      y += weightShift * gPin;

      // 3. Head & neck browsing / alert micro-movement (x > 0.28)
      const headMask = THREE.MathUtils.smoothstep(x, 0.26, 0.56);
      if (headMask > 0.001) {
        const dx = x - headPivotX;
        const dz = z - headPivotZ;
        const rx = headPivotX + dx * cosP - dz * sinP;
        const rz = headPivotZ + dx * sinP + dz * cosP;
        x = THREE.MathUtils.lerp(x, rx, headMask);
        z = THREE.MathUtils.lerp(z, rz, headMask);
        y += headYaw * headMask * Math.max(0, dx * 1.4);
      }

      // 4. Ear micro-twitch (top rear of head: x in [0.42, 0.65], z > 0.16)
      const earMask =
        THREE.MathUtils.smoothstep(x, 0.38, 0.48) *
        (1 - THREE.MathUtils.smoothstep(x, 0.62, 0.72)) *
        THREE.MathUtils.smoothstep(z, 0.14, 0.28);
      if (earMask > 0.001) {
        y += Math.sign(y) * earTwitch * earMask;
        z += earTwitch * 0.5 * earMask;
      }

      // 5. Tail micro-sway (rear tip x < -0.78)
      const tailMask = 1 - THREE.MathUtils.smoothstep(x, -0.92, -0.75);
      if (tailMask > 0.001) {
        y += tailSway * tailMask;
      }

      dst[i] = x;
      dst[i + 1] = y;
      dst[i + 2] = z;
    }

    posAttr.needsUpdate = true;
  }
}
