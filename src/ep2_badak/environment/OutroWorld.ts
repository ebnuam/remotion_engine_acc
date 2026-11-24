import * as THREE from "three";
import { JavanRhino3D } from "../characters/JavanRhino3D";

/**
 * 3D Outro Stage World — Split Decision
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Visual storytelling:
 * - Left Stage: Option A (Relocation to East Java) — Crate / Transport motif
 * - Right Stage: Option B (Strengthen Ujung Kulon) — Lush tropical foliage & Mother + Baby rhino
 * - Floating interactive 3D choice platforms
 * - Clean, cinematic studio lighting
 */

export class OutroWorld {
  public root: THREE.Group;
  public rhinoLeft: JavanRhino3D;
  public rhinoRight: JavanRhino3D;
  public babyRight: JavanRhino3D;
  private pedestalLeft: THREE.Mesh;
  private pedestalRight: THREE.Mesh;

  constructor() {
    this.root = new THREE.Group();

    // 1. Studio Lighting
    const keySun = new THREE.DirectionalLight("#FFFFFF", 2.2);
    keySun.position.set(0, 18, 14);
    this.root.add(keySun);

    const hemi = new THREE.HemisphereLight("#E0F2FE", "#0F172A", 1.0);
    this.root.add(hemi);

    // 2. Deep Studio Floor
    const floorGeo = new THREE.PlaneGeometry(50, 40);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#0F172A"),
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    this.root.add(floor);

    // 3. Option A Pedestal (Left: x = -3.2)
    const pedGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.6, 24);
    const pedAMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#1E293B"),
    });
    this.pedestalLeft = new THREE.Mesh(pedGeo, pedAMat);
    this.pedestalLeft.position.set(-3.2, -0.2, 0);
    this.root.add(this.pedestalLeft);

    // Left Pedestal Glowing Rim (Option A: Red/Amber)
    const rimAGeo = new THREE.TorusGeometry(2.42, 0.08, 8, 24);
    rimAGeo.rotateX(Math.PI / 2);
    const rimAMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const rimA = new THREE.Mesh(rimAGeo, rimAMat);
    rimA.position.set(-3.2, 0.1, 0);
    this.root.add(rimA);

    // 4. Option B Pedestal (Right: x = 3.2)
    const pedBMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#1E293B"),
    });
    this.pedestalRight = new THREE.Mesh(pedGeo, pedBMat);
    this.pedestalRight.position.set(3.2, -0.2, 0);
    this.root.add(this.pedestalRight);

    // Right Pedestal Glowing Rim (Option B: Green/Cyan)
    const rimBMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const rimB = new THREE.Mesh(rimAGeo, rimBMat);
    rimB.position.set(3.2, 0.1, 0);
    this.root.add(rimB);

    // 5. Left Characters: Solo Rhino on Option A
    this.rhinoLeft = new JavanRhino3D();
    this.rhinoLeft.setPosition(-3.2, 0.1, 0);
    this.rhinoLeft.setRotation(0, 0.4, 0);
    this.root.add(this.rhinoLeft.root);

    // 6. Right Characters: Mother + Baby Rhino on Option B (Vibrant Family)
    this.rhinoRight = new JavanRhino3D();
    this.rhinoRight.setPosition(3.0, 0.1, -0.2);
    this.rhinoRight.setRotation(0, -0.4, 0);
    this.root.add(this.rhinoRight.root);

    this.babyRight = new JavanRhino3D({ isBaby: true });
    this.babyRight.setPosition(4.1, 0.1, 0.6);
    this.babyRight.setRotation(0, -0.6, 0);
    this.root.add(this.babyRight.root);
  }

  public update(frame: number, highlightSide: "none" | "A" | "B" | "both" = "both"): void {
    // Both rhinos idle/breathing
    this.rhinoLeft.update(frame, false);
    this.rhinoRight.update(frame, false);
    this.babyRight.update(frame, false);

    // Dynamic pedestal elevation or pulse
    if (highlightSide === "A") {
      this.pedestalLeft.position.y = -0.2 + Math.sin(frame * 0.1) * 0.08;
      this.pedestalRight.position.y = -0.3;
    } else if (highlightSide === "B") {
      this.pedestalRight.position.y = -0.2 + Math.sin(frame * 0.1) * 0.08;
      this.pedestalLeft.position.y = -0.3;
    } else {
      this.pedestalLeft.position.y = -0.2;
      this.pedestalRight.position.y = -0.2;
    }
  }
}
