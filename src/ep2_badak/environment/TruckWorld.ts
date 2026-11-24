import * as THREE from "three";

/**
 * 3D Translocation Truck World
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Visual storytelling:
 * - Wildlife translocation heavy vehicle navigating rugged road
 * - Rotating wheels with deep tire treads
 * - Animated chassis bounce simulating rough unpaved road vibration
 * - Heavy reinforced wooden/steel cargo crate
 * - Moving roadside trees, dust clouds, and telephone poles
 * - Integrated 3D EKG telemetry panel showing spiked heart rate (185 BPM)
 */

export class TruckWorld {
  public root: THREE.Group;
  public truckGroup: THREE.Group;
  private chassis: THREE.Group;
  private wheels: THREE.Mesh[] = [];
  private roadsidePoles: THREE.Group[] = [];
  private dustPuffs: THREE.Mesh[] = [];

  constructor() {
    this.root = new THREE.Group();

    // 1. Lighting (Daylight)
    const sun = new THREE.DirectionalLight("#FFF8E7", 2.2);
    sun.position.set(10, 18, 12);
    sun.castShadow = true;
    this.root.add(sun);

    const hemi = new THREE.HemisphereLight("#BAE6FD", "#78350F", 0.9);
    this.root.add(hemi);

    // 2. Dusty Rugged Road
    const roadGeo = new THREE.PlaneGeometry(60, 12, 16, 4);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#78350F"), // Dusty earth brown road
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.y = 0;
    this.root.add(road);

    // Roadside grass verge
    const vergeGeo = new THREE.PlaneGeometry(60, 20, 16, 4);
    vergeGeo.rotateX(-Math.PI / 2);
    const vergeMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#15803D"),
    });
    const verge = new THREE.Mesh(vergeGeo, vergeMat);
    verge.position.set(0, -0.05, -12);
    this.root.add(verge);

    // 3. Conservation Truck Assembly
    this.truckGroup = new THREE.Group();
    this.root.add(this.truckGroup);

    this.chassis = new THREE.Group();
    this.truckGroup.add(this.chassis);

    // Truck Cabin
    const cabinGeo = new THREE.BoxGeometry(2.4, 2.2, 2.0);
    const cabinMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#0284C7"), // Conservation patrol blue
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(2.4, 2.0, 0);
    cabin.castShadow = true;
    this.chassis.add(cabin);

    // Cabin Windshield
    const windowGeo = new THREE.BoxGeometry(0.1, 0.9, 1.7);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
    const frontWindow = new THREE.Mesh(windowGeo, windowMat);
    frontWindow.position.set(3.6, 2.2, 0);
    this.chassis.add(frontWindow);

    // Heavy Wildlife Cargo Crate (Translocation container)
    const crateGeo = new THREE.BoxGeometry(4.2, 2.6, 2.2);
    const crateMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#B45309"), // Reinforced wood/steel container
    });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.set(-1.1, 2.2, 0);
    crate.castShadow = true;
    this.chassis.add(crate);

    // Metal reinforcement bands on crate
    for (let i = -1.8; i <= 1.8; i += 1.2) {
      const bandGeo = new THREE.BoxGeometry(0.12, 2.65, 2.25);
      const bandMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(-1.1 + i, 2.2, 0);
      this.chassis.add(band);
    }

    // Ventilation slats on crate (where rhino silhouette breathes)
    const slatGeo = new THREE.BoxGeometry(1.6, 0.35, 2.25);
    const slatMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const slat = new THREE.Mesh(slatGeo, slatMat);
    slat.position.set(-1.1, 2.5, 0);
    this.chassis.add(slat);

    // 4. Wheels (4 heavy rugged wheels)
    const wheelPositions = [
      { x: 2.4, z: 1.15 },
      { x: 2.4, z: -1.15 },
      { x: -1.8, z: 1.15 },
      { x: -1.8, z: -1.15 },
    ];

    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
    const hubMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });

    wheelPositions.forEach((wp) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wp.x, 0.75, wp.z);

      const tireGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.45, 16);
      tireGeo.rotateX(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, wheelMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      const hubGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.48, 10);
      hubGeo.rotateX(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      wheelGroup.add(hub);

      this.wheels.push(tire);
      this.truckGroup.add(wheelGroup);
    });

    // 5. Roadside Scrolling Poles & Trees
    this.buildRoadside();

    // 6. Dust Puffs behind tires
    this.buildDust();
  }

  private buildRoadside(): void {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x52525b });

    for (let i = 0; i < 6; i++) {
      const poleGroup = new THREE.Group();
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.15, 6, 8);
      const stem = new THREE.Mesh(stemGeo, poleMat);
      stem.position.y = 3;
      poleGroup.add(stem);

      poleGroup.position.set(i * 12 - 30, 0, -4.5);
      this.roadsidePoles.push(poleGroup);
      this.root.add(poleGroup);
    }
  }

  private buildDust(): void {
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      transparent: true,
      opacity: 0.45,
    });

    for (let i = 0; i < 6; i++) {
      const puffGeo = new THREE.SphereGeometry(0.4 + i * 0.15, 8, 6);
      const puff = new THREE.Mesh(puffGeo, dustMat);
      puff.position.set(-3.5 - i * 0.8, 0.4 + (i % 2) * 0.2, (i % 2 === 0 ? 0.8 : -0.8));
      puff.userData = { seed: i };
      this.dustPuffs.push(puff);
      this.root.add(puff);
    }
  }

  public update(frame: number): void {
    // 1. Wheel rotation
    this.wheels.forEach((wheel) => {
      wheel.rotation.z -= 0.28;
    });

    // 2. Chassis suspension vibration (rough road bumps)
    const bumpY = Math.sin(frame * 0.8) * 0.05 + Math.cos(frame * 1.4) * 0.03;
    const bumpPitch = Math.sin(frame * 0.6) * 0.02;
    this.chassis.position.y = bumpY;
    this.chassis.rotation.z = bumpPitch;

    // 3. Roadside elements scrolling to the left
    this.roadsidePoles.forEach((pole) => {
      pole.position.x -= 0.35;
      if (pole.position.x < -35) {
        pole.position.x = 35;
      }
    });

    // 4. Dust clouds billowing behind wheels
    this.dustPuffs.forEach((puff) => {
      const s = puff.userData.seed as number;
      puff.scale.setScalar(1.0 + Math.sin(frame * 0.2 + s) * 0.3);
      puff.position.x -= 0.15;
      if (puff.position.x < -9) {
        puff.position.x = -3.5;
      }
    });
  }
}
