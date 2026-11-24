import * as THREE from "three";
import { JavanRhino3D } from "../characters/JavanRhino3D";

/**
 * 3D Arid Savanna World — Adaptation Challenges
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Visual storytelling:
 * - Contrasting dry, arid savanna environment (East Java / Alas Purwo dry season)
 * - Golden yellow dry grasslands, cracked dusty terrain
 * - Sparse flat-topped umbrella acacia trees
 * - Rhino pacing disoriented in foreign habitat with wilted food plants
 * - Dust motes drifting under harsh sun
 */

export class SavannaWorld {
  public root: THREE.Group;
  public rhino: JavanRhino3D;
  private trees: THREE.Group[] = [];
  private grassTufts: THREE.Group[] = [];

  constructor() {
    this.root = new THREE.Group();

    // 1. Lighting (Harsh, Dry Golden Sun)
    const sun = new THREE.DirectionalLight("#FEF08A", 2.6);
    sun.position.set(14, 20, 10);
    sun.castShadow = true;
    this.root.add(sun);

    const hemi = new THREE.HemisphereLight("#FEF08A", "#78350F", 0.8);
    this.root.add(hemi);

    // 2. Dusty Hazy Sky
    const skyGeo = new THREE.SphereGeometry(90, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#FDE047"), // Warm golden savanna sky
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.root.add(sky);

    // 3. Dry Cracked Earth Terrain
    const groundGeo = new THREE.PlaneGeometry(80, 80, 24, 24);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#CA8A04"), // Dry golden-brown savanna earth
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.root.add(ground);

    // 4. Flat-topped Acacia Trees
    this.buildAcacias();

    // 5. Dry Grass Tufts
    this.buildDryGrass();

    // 6. Javan Rhino (Slow, disoriented walk)
    this.rhino = new JavanRhino3D();
    this.rhino.setPosition(0, 0.45, 0);
    this.root.add(this.rhino.root);
  }

  private buildAcacias(): void {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3825 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x854d0e }); // Dry yellowish-olive canopy

    const treePositions = [
      { x: -12, z: -8, s: 1.2 },
      { x: 10, z: -10, s: 1.4 },
      { x: -6, z: -15, s: 1.6 },
      { x: 14, z: 6, s: 1.1 },
    ];

    treePositions.forEach((tp) => {
      const tree = new THREE.Group();
      tree.position.set(tp.x, 0, tp.z);
      tree.scale.set(tp.s, tp.s, tp.s);

      // Angled branching trunk
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 4, 8);
      trunkGeo.translate(0, 2, 0);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.castShadow = true;
      tree.add(trunk);

      // Wide flat-topped umbrella canopy
      const canopyGeo = new THREE.CylinderGeometry(3.2, 0.5, 0.8, 12);
      canopyGeo.translate(0, 4.2, 0);
      const canopy = new THREE.Mesh(canopyGeo, leafMat);
      canopy.castShadow = true;
      tree.add(canopy);

      this.trees.push(tree);
      this.root.add(tree);
    });
  }

  private buildDryGrass(): void {
    const strawMat = new THREE.MeshLambertMaterial({
      color: 0xeab308, // Golden dry grass
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 18; i++) {
      const tuft = new THREE.Group();
      for (let j = 0; j < 5; j++) {
        const bladeGeo = new THREE.ConeGeometry(0.06, 0.9 + (j % 3) * 0.2, 4);
        bladeGeo.translate(0, 0.45, 0);
        bladeGeo.rotateZ((j - 2) * 0.22);
        const blade = new THREE.Mesh(bladeGeo, strawMat);
        tuft.add(blade);
      }
      tuft.position.set(
        Math.sin(i * 1.5) * 14,
        0,
        Math.cos(i * 1.2) * 10
      );
      this.grassTufts.push(tuft);
      this.root.add(tuft);
    }
  }

  public update(frame: number): void {
    // Slower, heavy walk cycle
    this.rhino.update(frame, true, 0.65);

    // Dry wind swaying grass
    this.grassTufts.forEach((tuft, idx) => {
      tuft.rotation.z = Math.sin(frame * 0.06 + idx) * 0.12;
    });
  }
}
