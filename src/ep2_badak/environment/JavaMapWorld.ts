import * as THREE from "three";

/**
 * 3D / 2.5D Relief Map of Java Island
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Features:
 * - 3D contoured terrain model of Java Island (elevated above ocean)
 * - West tip: Taman Nasional Ujung Kulon (Banten) with prominent 3D location beacon pin
 * - East tip: Taman Nasional Alas Purwo (Banyuwangi, Jatim) with destination beacon
 * - Dynamic animated glowing 3D GPS spline path curving eastward across Java
 * - Local short route (<15 KM) vs cross-island route (~1.000 KM)
 * - Surrounding tropical ocean with gentle waves
 * - Drifting mini clouds above the island
 */

export class JavaMapWorld {
  public root: THREE.Group;
  public cameraTarget: THREE.Vector3;

  private routeTube?: THREE.Mesh;
  private localRouteTube?: THREE.Mesh;
  private beaconStart: THREE.Group;
  private beaconEnd: THREE.Group;
  private clouds: THREE.Group[] = [];

  constructor() {
    this.root = new THREE.Group();
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    // 1. Lighting
    const sun = new THREE.DirectionalLight("#FFF8E7", 2.2);
    sun.position.set(10, 25, 12);
    sun.castShadow = true;
    this.root.add(sun);

    const hemi = new THREE.HemisphereLight("#BAE6FD", "#1E3A8A", 1.0);
    this.root.add(hemi);

    // 2. Surrounding Ocean Surface
    const oceanGeo = new THREE.PlaneGeometry(70, 45, 24, 24);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#0284C7"), // Bright tropical ocean
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.y = -0.2;
    this.root.add(ocean);

    // 3. 3D Java Island Base
    const islandGroup = new THREE.Group();

    // Java Island shape: elongated curved landmass with mountain spine
    // From x = -13 (Ujung Kulon) to x = 12 (Banyuwangi)
    const javaPoints: THREE.Vector2[] = [
      new THREE.Vector2(-14.2, 0.2),  // Ujung Kulon tip
      new THREE.Vector2(-13.0, 1.2),  // Banten north
      new THREE.Vector2(-9.5, 1.8),   // Jakarta / West Java north coast
      new THREE.Vector2(-5.0, 1.5),   // Cirebon / Central Java north
      new THREE.Vector2(0.0, 1.9),    // Semarang
      new THREE.Vector2(4.5, 1.3),    // Rembang
      new THREE.Vector2(8.5, 1.5),    // Surabaya / Madura strait
      new THREE.Vector2(12.5, 0.4),   // Banyuwangi / Bali strait
      new THREE.Vector2(11.8, -1.5),  // Alas Purwo peninsula (Blambangan)
      new THREE.Vector2(7.5, -1.8),   // East Java south coast
      new THREE.Vector2(1.5, -1.6),   // Yogyakarta south coast
      new THREE.Vector2(-4.0, -1.7),  // Cilacap south
      new THREE.Vector2(-9.0, -1.4),  // West Java south coast
      new THREE.Vector2(-13.5, -0.8), // Ujung Kulon south
    ];

    const shape = new THREE.Shape(javaPoints);
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.8,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.3,
      bevelThickness: 0.3,
    };
    const islandGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    islandGeo.rotateX(Math.PI / 2); // Lay flat horizontally

    const islandMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#22C55E"), // Vibrant lush green island
    });
    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.position.y = 0.2;
    islandMesh.castShadow = true;
    islandMesh.receiveShadow = true;
    islandGroup.add(islandMesh);

    // Volcanic Mountain Spine along Java (Merapi, Semeru, Bromo, etc.)
    const mountainPositions = [
      { x: -10, z: -0.2, h: 1.4, r: 1.2 },
      { x: -7.5, z: 0.3, h: 1.6, r: 1.3 },
      { x: -2.5, z: -0.4, h: 1.8, r: 1.4 },
      { x: 1.2, z: -0.2, h: 2.1, r: 1.5 }, // Merapi / Merbabu
      { x: 5.5, z: -0.6, h: 1.9, r: 1.4 }, // Lawu
      { x: 8.8, z: -0.5, h: 2.3, r: 1.6 }, // Semeru
      { x: 11.2, z: -0.2, h: 1.7, r: 1.3 }, // Raung / Ijen
    ];

    const mtnMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#15803D"),
    });

    mountainPositions.forEach((m) => {
      const coneGeo = new THREE.ConeGeometry(m.r, m.h, 10);
      const cone = new THREE.Mesh(coneGeo, mtnMat);
      cone.position.set(m.x, m.h * 0.5 + 0.5, m.z);
      cone.castShadow = true;
      islandGroup.add(cone);
    });

    this.root.add(islandGroup);

    // 4. 3D Location Beacon Pins
    this.beaconStart = this.createBeaconPin("#0284C7", "UJUNG KULON");
    this.beaconStart.position.set(-13.8, 1.4, -0.2);
    this.root.add(this.beaconStart);

    this.beaconEnd = this.createBeaconPin("#F97316", "ALAS PURWO");
    this.beaconEnd.position.set(11.8, 1.4, -1.3);
    this.root.add(this.beaconEnd);

    // 5. Mini Drifting Clouds above map
    this.buildMapClouds();
  }

  private createBeaconPin(colorHex: string, label: string): THREE.Group {
    const group = new THREE.Group();

    // Pin head (sphere)
    const pinHeadGeo = new THREE.SphereGeometry(0.55, 16, 12);
    const pinMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(colorHex),
      emissive: new THREE.Color(colorHex),
      emissiveIntensity: 0.4,
    });
    const pinHead = new THREE.Mesh(pinHeadGeo, pinMat);
    pinHead.position.y = 1.6;
    group.add(pinHead);

    // Pin needle stem
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.02, 1.6, 8);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.8;
    group.add(stem);

    // Pulsing ground target ring
    const ringGeo = new THREE.RingGeometry(0.3, 0.7, 16);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    group.add(ring);

    return group;
  }

  private buildMapClouds(): void {
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });

    const positions = [
      { x: -10, y: 7, z: -5 },
      { x: 0, y: 8, z: -6 },
      { x: 8, y: 7.5, z: -4 },
    ];

    positions.forEach((p, idx) => {
      const cloud = new THREE.Group();
      const puffGeo = new THREE.SphereGeometry(1.2, 10, 8);
      const puff1 = new THREE.Mesh(puffGeo, cloudMat);
      const puff2 = new THREE.Mesh(puffGeo, cloudMat);
      puff2.position.set(0.9, -0.1, 0.2);
      puff2.scale.set(0.8, 0.8, 0.8);
      cloud.add(puff1);
      cloud.add(puff2);
      cloud.position.set(p.x, p.y, p.z);
      cloud.userData = { speed: 0.02 + idx * 0.01 };
      this.clouds.push(cloud);
      this.root.add(cloud);
    });
  }

  /**
   * Update Route Spline Progress
   * @param progress 0.0 to 1.0 representing path completion
   * @param isLocalOnly whether to show only the <15 KM local route in Ujung Kulon
   */
  public updateRoute(progress: number, isLocalOnly = false): void {
    if (this.routeTube) {
      this.root.remove(this.routeTube);
      this.routeTube.geometry.dispose();
      this.routeTube = undefined;
    }
    if (this.localRouteTube) {
      this.root.remove(this.localRouteTube);
      this.localRouteTube.geometry.dispose();
      this.localRouteTube = undefined;
    }

    if (isLocalOnly) {
      // Local move inside Ujung Kulon (< 15 KM)
      const localCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-14.0, 1.0, -0.4),
        new THREE.Vector3(-13.7, 1.2, -0.1),
        new THREE.Vector3(-13.3, 1.1, 0.1),
      ]);
      const tubeGeo = new THREE.TubeGeometry(localCurve, 20, 0.18, 8, false);
      const tubeMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color("#EAB308"), // Bright yellow for local move
        emissive: new THREE.Color("#CA8A04"),
        emissiveIntensity: 0.6,
      });
      this.localRouteTube = new THREE.Mesh(tubeGeo, tubeMat);
      this.root.add(this.localRouteTube);
      return;
    }

    // Full Island Route from Ujung Kulon (-13.8) to Alas Purwo (11.8)
    const clampedProg = Math.max(0.01, Math.min(1.0, progress));
    const fullPoints = [
      new THREE.Vector3(-13.8, 1.0, -0.2), // Ujung Kulon
      new THREE.Vector3(-9.5, 1.4, 0.5),   // Bogor / Bandung
      new THREE.Vector3(-4.5, 1.3, 0.2),   // Cirebon
      new THREE.Vector3(0.5, 1.5, 0.4),    // Semarang
      new THREE.Vector3(5.5, 1.4, 0.1),    // Solo / Madiun
      new THREE.Vector3(8.8, 1.3, 0.2),    // Surabaya south
      new THREE.Vector3(11.8, 1.0, -1.3),  // Alas Purwo
    ];

    const currentPointsCount = Math.max(2, Math.ceil(fullPoints.length * clampedProg));
    const subPoints = fullPoints.slice(0, currentPointsCount);

    if (clampedProg < 1.0 && currentPointsCount < fullPoints.length) {
      // Interpolate last point smoothly
      const segT = (clampedProg * (fullPoints.length - 1)) % 1;
      const lastP = new THREE.Vector3().lerpVectors(
        fullPoints[currentPointsCount - 1],
        fullPoints[Math.min(fullPoints.length - 1, currentPointsCount)],
        segT
      );
      subPoints.push(lastP);
    }

    const curve = new THREE.CatmullRomCurve3(subPoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.16, 8, false);
    const tubeMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#EF4444"), // Vivid warning red GPS route
      emissive: new THREE.Color("#DC2626"),
      emissiveIntensity: 0.5,
    });
    this.routeTube = new THREE.Mesh(tubeGeo, tubeMat);
    this.root.add(this.routeTube);
  }

  public update(frame: number): void {
    // Pulse beacon heads
    const pulse = 1.0 + Math.sin(frame * 0.12) * 0.12;
    this.beaconStart.scale.set(pulse, pulse, pulse);
    this.beaconEnd.scale.set(pulse, pulse, pulse);

    // Clouds drift
    this.clouds.forEach((cloud) => {
      const sp = cloud.userData.speed as number;
      cloud.position.x += sp;
      if (cloud.position.x > 18) {
        cloud.position.x = -16;
      }
    });
  }
}
