import * as THREE from "three";
import { JavanRhino3D } from "../characters/JavanRhino3D";

/**
 * 3D Invasive Langkap Palm World — Forest Degradation
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Biological narrative:
 * - Invasive Langkap Palm (Arenga obtusifolia) spreading rapidly across Ujung Kulon
 * - Towering palm trunks growing dense, interlocking huge fan fronds
 * - Thick canopy blocks 90% of solar radiation down to the forest floor
 * - Understory shrubbery & native rhino food plants wither and perish
 * - Rhino wanders through dark, barren undergrowth looking for food
 */

export class LangkapWorld {
  public root: THREE.Group;
  public rhino: JavanRhino3D;
  private palmTrunks: THREE.Group[] = [];
  private darkCanopy: THREE.Group;
  private wiltedPlants: THREE.Mesh[] = [];

  constructor() {
    this.root = new THREE.Group();

    // 1. Lighting (Deep shadowed understory with faint top light)
    const topSun = new THREE.DirectionalLight("#FEF08A", 1.0);
    topSun.position.set(0, 25, 0);
    this.root.add(topSun);

    const ambient = new THREE.AmbientLight("#1E293B", 0.45); // Dark, gloomy forest floor
    this.root.add(ambient);

    // 2. Dark Forest Floor (Soil with fallen dead fronds)
    const groundGeo = new THREE.PlaneGeometry(60, 60, 16, 16);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#27272A"), // Dark decaying leaf litter
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    this.root.add(ground);

    // 3. Towering Langkap Palms (Arenga obtusifolia)
    this.buildLangkapPalms();

    // 4. Suffocating Dark Canopy Overhead
    this.darkCanopy = new THREE.Group();
    this.darkCanopy.position.y = 12;
    const canopyLeafMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#14532D"), // Very dense deep green fronds
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 28; i++) {
      const angle = (i * Math.PI * 2) / 28;
      const frondGeo = new THREE.PlaneGeometry(3.5, 9, 4, 8);
      frondGeo.translate(0, 4.5, 0);
      frondGeo.rotateX(0.4);
      frondGeo.rotateY(angle);

      const frond = new THREE.Mesh(frondGeo, canopyLeafMat);
      frond.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
      this.darkCanopy.add(frond);
    }
    this.root.add(this.darkCanopy);

    // 5. Wilted, Dying Understory Shrubbery (Food depletion)
    this.buildWiltedShrubs();

    // 6. Searching Rhino
    this.rhino = new JavanRhino3D();
    this.rhino.setPosition(0, 0.45, 0);
    this.root.add(this.rhino.root);
  }

  private buildLangkapPalms(): void {
    const trunkMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#3F3F46"), // Dark fibrous palm trunk
    });

    const palmPositions = [
      { x: -5, z: -4 },
      { x: 4, z: -5 },
      { x: -7, z: 3 },
      { x: 6, z: 2 },
      { x: 0, z: -8 },
      { x: -2, z: 6 },
    ];

    palmPositions.forEach((pos) => {
      const palm = new THREE.Group();
      palm.position.set(pos.x, 0, pos.z);

      // Very tall segmented palm trunk (12m high)
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 12, 10);
      trunkGeo.translate(0, 6, 0);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      palm.add(trunk);

      // Fibrous rings on trunk
      for (let y = 1; y < 11; y += 1.2) {
        const ringGeo = new THREE.TorusGeometry(0.42, 0.05, 6, 12);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = y;
        palm.add(ring);
      }

      this.palmTrunks.push(palm);
      this.root.add(palm);
    });
  }

  private buildWiltedShrubs(): void {
    const wiltMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#713F12"), // Brownish dead withered leaves
    });

    for (let i = 0; i < 12; i++) {
      const shrubGeo = new THREE.DodecahedronGeometry(0.55, 0);
      shrubGeo.scale(1.2, 0.4, 0.8);
      const shrub = new THREE.Mesh(shrubGeo, wiltMat);
      shrub.position.set(
        Math.sin(i * 1.8) * 6,
        0.2,
        Math.cos(i * 1.4) * 5
      );
      this.wiltedPlants.push(shrub);
      this.root.add(shrub);
    }
  }

  public update(frame: number): void {
    // Rhino walking slowly searching for food
    this.rhino.update(frame, true, 0.7);

    // Subtle dark canopy sway
    this.darkCanopy.rotation.y = Math.sin(frame * 0.02) * 0.04;
  }
}
