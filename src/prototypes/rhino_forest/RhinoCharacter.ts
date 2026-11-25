import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Animated 3D Javan Rhinoceros Character
 * Kok Iso Yo? Studio — Cinematic 2.5D/3D Prototype
 *
 * Model: "Animated Rhinoceros Walking Animal Loop" by LasquetiSpice (CC-BY)
 * Rig: 79 skeletal joints, 121 animation channels
 * Walking loop: 1.97s (~59 frames @ 30fps)
 */

export class RhinoCharacter {
  public root: THREE.Group;
  private mixer?: THREE.AnimationMixer;
  private action?: THREE.AnimationAction;
  private clipDuration = 1.9666667; // exact seconds for 1 walk cycle (59 frames)
  private strideMeters = 2.15; // physical forward movement per complete walk cycle
  public isLoaded = false;

  constructor() {
    this.root = new THREE.Group();
    // Initially hidden until loaded
    this.root.visible = false;
  }

  public async load(url: string): Promise<void> {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);

    const model = gltf.scene;

    // Scale and orient model
    // Original model bounds: ~1380 units long, ~600 units tall
    // Scale by 0.003 -> length ~4.14m, height ~1.8m (life-sized rhino)
    const scale = 0.003;
    model.scale.set(scale, scale, scale);

    // Ensure model faces along positive X axis (travel direction)
    // Inspect original orientation: model is aligned along Z, rotate to face +X
    model.rotation.y = Math.PI / 2;

    // Configure materials and shadows
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = 0.82;
          mat.metalness = 0.08;
          mat.envMapIntensity = 0.8;
          // Natural slate-grey earthy skin tone
          if (mat.color) {
            mat.color.setRGB(0.72, 0.70, 0.68);
          }
        }
      }
    });

    this.root.add(model);

    // Setup animation mixer
    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations[0];
      this.clipDuration = clip.duration || this.clipDuration;
      this.action = this.mixer.clipAction(clip);
      this.action.play();
    }

    this.isLoaded = true;
    this.root.visible = true;
  }

  /**
   * Deterministic Frame-Based Animation Update
   * @param frame Current frame (0 to 360)
   * @param fps Frame rate (30 FPS)
   * @param startX Starting world X position
   */
  public update(frame: number, fps = 30, startX = -6.0): void {
    if (!this.isLoaded || !this.mixer) return;

    const timeSeconds = frame / fps;

    // 1. Evaluate skeletal walking cycle deterministically
    // Loop time within the 1.97s clip
    const animTime = timeSeconds % this.clipDuration;
    this.mixer.setTime(animTime);

    // 2. Synchronized forward translation to eliminate foot sliding
    // Speed (m/s) = strideMeters / clipDuration
    const metersPerSecond = this.strideMeters / this.clipDuration;
    const currentX = startX + timeSeconds * metersPerSecond;

    // 3. Subtle terrain contour tracking
    // Path has slight gentle undulations
    const currentY = 0.02 + Math.sin(currentX * 0.35) * 0.04;
    const currentZ = -0.15 + Math.sin(currentX * 0.2) * 0.25;

    this.root.position.set(currentX, currentY, currentZ);

    // Slight natural pitch and roll following path
    this.root.rotation.z = -Math.cos(currentX * 0.35) * 0.02;
    this.root.rotation.y = Math.PI / 2 + Math.cos(currentX * 0.2) * 0.06;
  }

  public getPosition(): THREE.Vector3 {
    return this.root.position;
  }
}
