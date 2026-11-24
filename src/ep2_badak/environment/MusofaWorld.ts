import * as THREE from "three";
import { JavanRhino3D } from "../characters/JavanRhino3D";

/**
 * 3D Musofa Memorial World — Case Study Documentary Vignette
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Visual storytelling:
 * - Archival documentary card framing
 * - 3D silhouette / memorial tribute to Musofa (male Javan rhino)
 * - Gentle warm rim light against dignified dark slate background
 * - EKG flatline transition representing the tragic loss post-translocation
 */

export class MusofaWorld {
  public root: THREE.Group;
  public rhino: JavanRhino3D;
  private memorialCard: THREE.Mesh;
  private ekgLine?: THREE.Line;

  constructor() {
    this.root = new THREE.Group();

    // 1. Lighting (Solemn, Soft Rim Light)
    const keyLight = new THREE.DirectionalLight("#E2E8F0", 1.8);
    keyLight.position.set(-6, 12, 10);
    this.root.add(keyLight);

    const rimLight = new THREE.DirectionalLight("#F8FAFC", 1.2);
    rimLight.position.set(8, 8, -6);
    this.root.add(rimLight);

    const ambient = new THREE.AmbientLight("#1E293B", 0.6);
    this.root.add(ambient);

    // 2. Memorial Stage Backdrop
    const backdropGeo = new THREE.PlaneGeometry(35, 25);
    const backdropMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#0F172A"),
    });
    this.memorialCard = new THREE.Mesh(backdropGeo, backdropMat);
    this.memorialCard.position.set(0, 2, -5);
    this.root.add(this.memorialCard);

    // Subtle pedestal
    const pedGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.4, 24);
    const pedMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#1E293B"),
    });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = -0.2;
    this.root.add(ped);

    // 3. Javan Rhino Musofa (Memorial palette)
    this.rhino = new JavanRhino3D({ isMemorial: true });
    this.rhino.setPosition(0, 0.1, 0);
    this.rhino.setRotation(0, 0.25, 0);
    this.root.add(this.rhino.root);

    // 4. EKG Flatline in 3D
    this.buildEkgFlatline();
  }

  private buildEkgFlatline(): void {
    const points = [
      new THREE.Vector3(-4, 2.5, 1),
      new THREE.Vector3(-2, 2.5, 1),
      new THREE.Vector3(-1.5, 3.2, 1),
      new THREE.Vector3(-1.0, 1.8, 1),
      new THREE.Vector3(-0.5, 2.5, 1),
      new THREE.Vector3(4, 2.5, 1), // flatline straight across
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xef4444, // Red telemetry line
      linewidth: 3,
    });
    this.ekgLine = new THREE.Line(geo, mat);
    this.root.add(this.ekgLine);
  }

  public update(frame: number): void {
    // Gentle breathing idle
    this.rhino.update(frame, false);

    // Faint pulse on the memorial flatline
    if (this.ekgLine) {
      this.ekgLine.position.y = Math.sin(frame * 0.05) * 0.03;
    }
  }
}
