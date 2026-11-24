import * as THREE from "three";

/**
 * 3D Anak Krakatau & Selat Sunda World
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Scientific accuracy per master prompt:
 * - Volcano flank collapse displacing seawater, generating massive tsunami surge waves
 * - Anak Krakatau conical volcanic island in the Sunda Strait
 * - Eruptive ash column & billowing smoke clouds
 * - Dynamic ocean waves surging toward the coast of Ujung Kulon
 */

export class KrakatauWorld {
  public root: THREE.Group;
  private smokePuffs: THREE.Group[] = [];
  private oceanMesh: THREE.Mesh;
  private tsunamiWaveMesh: THREE.Mesh;
  private volcanoIsland: THREE.Group;
  private landslideMass: THREE.Mesh;

  constructor() {
    this.root = new THREE.Group();

    // 1. Lighting (Dramatic Volcano Sunset / Ash-tinted sky)
    const sunlight = new THREE.DirectionalLight("#FFAA44", 2.4);
    sunlight.position.set(-15, 20, 10);
    this.root.add(sunlight);

    const hemi = new THREE.HemisphereLight("#F97316", "#0369A1", 0.9);
    this.root.add(hemi);

    // 2. Dramatic Ash Sky Dome
    const skyGeo = new THREE.SphereGeometry(90, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#EA580C"), // Volcanic orange-red sky
      side: THREE.BackSide,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.root.add(skyMesh);

    // 3. Ocean Surface (Sunda Strait)
    const oceanGeo = new THREE.PlaneGeometry(80, 80, 48, 48);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#0369A1"),
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = 0;
    this.root.add(this.oceanMesh);

    // 4. Anak Krakatau Volcanic Cone
    this.volcanoIsland = new THREE.Group();
    this.volcanoIsland.position.set(-6, 0, -12);

    // Dark basalt volcanic cone
    const coneGeo = new THREE.ConeGeometry(8, 7.5, 18, 1, true);
    const coneMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#262626"), // Dark volcanic basalt
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 3.75;
    cone.castShadow = true;
    this.volcanoIsland.add(cone);

    // Volcanic caldera rim / crater
    const rimGeo = new THREE.TorusGeometry(1.6, 0.45, 8, 18);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#404040"),
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 7.5;
    this.volcanoIsland.add(rim);

    // Glowing magma vent inside crater
    const lavaGeo = new THREE.CircleGeometry(1.4, 16);
    lavaGeo.rotateX(-Math.PI / 2);
    const lavaMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#FF4500"),
    });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.position.y = 7.3;
    this.volcanoIsland.add(lava);

    // 5. Volcanic Flank Collapse Mass (Landslide chunk sliding into water)
    const slideGeo = new THREE.DodecahedronGeometry(2.4, 1);
    slideGeo.scale(1.2, 0.8, 1.0);
    const slideMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#333333"),
    });
    this.landslideMass = new THREE.Mesh(slideGeo, slideMat);
    this.landslideMass.position.set(3.2, 2.8, 1.5);
    this.volcanoIsland.add(this.landslideMass);

    this.root.add(this.volcanoIsland);

    // 6. Erupting Ash & Smoke Puffs
    this.buildSmokePlume();

    // 7. Giant Tsunami Displacement Wave Crest
    const waveGeo = new THREE.CylinderGeometry(1.2, 0.2, 45, 16, 1, false, 0, Math.PI);
    waveGeo.rotateZ(Math.PI / 2);
    const waveMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#7DD3FC"),
      emissive: new THREE.Color("#0284C7"),
      emissiveIntensity: 0.35,
    });
    this.tsunamiWaveMesh = new THREE.Mesh(waveGeo, waveMat);
    this.tsunamiWaveMesh.position.set(2, 0.5, 4);
    this.root.add(this.tsunamiWaveMesh);

    // Coastline of Ujung Kulon in the distance
    const coastGeo = new THREE.PlaneGeometry(60, 12, 16, 4);
    coastGeo.rotateX(-Math.PI / 2);
    const coastMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#166534"),
    });
    const coast = new THREE.Mesh(coastGeo, coastMat);
    coast.position.set(0, 0.3, 22);
    this.root.add(coast);
  }

  private buildSmokePlume(): void {
    const ashMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#52525B"), // Dark volcanic ash
      transparent: true,
      opacity: 0.88,
    });

    for (let i = 0; i < 9; i++) {
      const puff = new THREE.Group();
      const r = 1.0 + i * 0.45;
      const puffGeo = new THREE.SphereGeometry(r, 10, 8);
      const m1 = new THREE.Mesh(puffGeo, ashMat);
      puff.add(m1);

      puff.position.set(-6 + (i % 2 === 0 ? 0.6 : -0.6), 8 + i * 1.8, -12 + (i % 3) * 0.4);
      puff.userData = { baseY: 8 + i * 1.8, speed: 0.05 + i * 0.01, seed: i };
      this.smokePuffs.push(puff);
      this.root.add(puff);
    }
  }

  public update(frame: number): void {
    // 1. Ash plume rising & billowing
    this.smokePuffs.forEach((puff) => {
      const seed = puff.userData.seed as number;
      const t = frame * 0.05 + seed;
      puff.position.y += 0.06;
      puff.position.x = -6 + Math.sin(t) * 1.2 + (puff.position.y - 8) * 0.2;
      puff.scale.setScalar(1.0 + Math.sin(t * 1.5) * 0.15);

      if (puff.position.y > 26) {
        puff.position.y = 8;
      }
    });

    // 2. Flank collapse landslide motion
    // Landslide plunges downward into the sea
    const slideProgress = (frame % 90) / 90;
    this.landslideMass.position.y = 3.5 - slideProgress * 4.5;
    this.landslideMass.position.x = 2.0 + slideProgress * 3.0;

    // 3. Tsunami wave propagation toward Ujung Kulon coast
    const waveProgress = (frame % 120) / 120;
    this.tsunamiWaveMesh.position.z = -5 + waveProgress * 24;
    this.tsunamiWaveMesh.position.y = 1.2 + Math.sin(frame * 0.1) * 0.4;
    this.tsunamiWaveMesh.scale.y = 1.4 + Math.sin(frame * 0.15) * 0.3;

    // 4. Undulating ocean surface
    const pos = this.oceanMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const h = Math.sin(u * 0.4 + frame * 0.08) * Math.cos(v * 0.3 + frame * 0.06) * 0.25;
      pos.setZ(i, h);
    }
    this.oceanMesh.geometry.computeVertexNormals();
  }
}
