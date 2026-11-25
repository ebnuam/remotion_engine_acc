import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Cinematic 3D Tropical Rainforest Environment
 * Kok Iso Yo? Studio — Multi-Layered Depth with Real 3D Assets
 */

export class ForestEnvironment {
  public root: THREE.Group;
  private swayingObjects: { obj: THREE.Object3D; phase: number; speed: number; amp: number }[] = [];
  private particles?: THREE.Points;
  private particlePositions?: Float32Array;
  private clouds: THREE.Group[] = [];
  public isLoaded = false;

  constructor() {
    this.root = new THREE.Group();

    // 1. Lighting Setup: Warm Morning Sunlight
    this.setupLighting();

    // 2. Sky & Atmospheric Background
    this.setupSky();

    // 3. Terrain with Forest Trail
    this.setupTerrain();

    // 4. Floating Sunlight Dust Motes / Pollen Particles
    this.setupParticles();
  }

  private setupLighting(): void {
    // Warm morning sun (DirectionalLight)
    const sun = new THREE.DirectionalLight("#FFF8E7", 2.6);
    sun.position.set(12, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 45;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.bias = -0.0004;
    this.root.add(sun);

    // Soft sky / ground hemisphere bounce
    const hemi = new THREE.HemisphereLight("#BAE6FD", "#2D5A27", 1.0);
    this.root.add(hemi);

    // Ambient light fill for lush shadows
    const ambient = new THREE.AmbientLight("#7DD3FC", 0.45);
    this.root.add(ambient);
  }

  private setupSky(): void {
    // Sky hemisphere dome
    const skyGeo = new THREE.SphereGeometry(90, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#38BDF8"), // Bright tropical blue morning sky
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.root.add(sky);

    // Distant mountain ridges (Atmospheric background)
    const ridgeMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#3B8272"), // Blue-green atmospheric haze
    });

    for (let i = -5; i <= 5; i++) {
      const coneGeo = new THREE.ConeGeometry(12 + Math.abs(i) * 1.5, 14 + (i % 2) * 3, 8);
      const ridge = new THREE.Mesh(coneGeo, ridgeMat);
      ridge.position.set(i * 12, 1, -38 - Math.abs(i) * 2);
      this.root.add(ridge);
    }

    // Drifting Puffy Clouds
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0xe0f2fe,
      emissiveIntensity: 0.2,
    });

    const cloudConfigs = [
      { x: -28, y: 16, z: -28 },
      { x: -6, y: 19, z: -25 },
      { x: 18, y: 17, z: -30 },
      { x: 34, y: 20, z: -26 },
    ];

    cloudConfigs.forEach((cfg, idx) => {
      const cloud = new THREE.Group();
      const offsets = [
        [0, 0, 0, 2.2],
        [-1.8, -0.3, 0.2, 1.8],
        [1.8, -0.2, -0.1, 2.0],
        [-0.7, 0.9, 0.1, 1.6],
        [0.9, 0.8, -0.2, 1.7],
      ];
      offsets.forEach(([ox, oy, oz, r]) => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), cloudMat);
        puff.position.set(ox, oy, oz);
        cloud.add(puff);
      });
      cloud.position.set(cfg.x, cfg.y, cfg.z);
      cloud.userData = { speed: 0.035 + (idx % 2) * 0.015 };
      this.clouds.push(cloud);
      this.root.add(cloud);
    });
  }

  private setupTerrain(): void {
    // 1. Forest Floor (Contoured undulating ground)
    const groundGeo = new THREE.PlaneGeometry(60, 50, 32, 24);
    groundGeo.rotateX(-Math.PI / 2);

    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Depress path along Z ~ 0, raise knolls on sides
      const distFromPath = Math.abs(z);
      const gentleKnoll = Math.sin(x * 0.2) * Math.cos(z * 0.15) * 0.45;
      const elevation = distFromPath > 3.0 ? (distFromPath - 3.0) * 0.2 + gentleKnoll : gentleKnoll * 0.2;
      pos.setY(i, elevation);
    }
    groundGeo.computeVertexNormals();

    const grassMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#3F7A18"), // Rich tropical forest floor
    });
    const ground = new THREE.Mesh(groundGeo, grassMat);
    ground.receiveShadow = true;
    this.root.add(ground);

    // 2. Dirt Trail / Pathway where rhino walks
    const trailGeo = new THREE.PlaneGeometry(60, 4.2, 24, 4);
    trailGeo.rotateX(-Math.PI / 2);
    const trailMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#7C4F26"), // Warm earthy soil
    });
    const trail = new THREE.Mesh(trailGeo, trailMat);
    trail.position.set(0, 0.03, 0);
    trail.receiveShadow = true;
    this.root.add(trail);
  }

  private setupParticles(): void {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      this.particlePositions[i * 3] = (Math.random() - 0.5) * 35;
      this.particlePositions[i * 3 + 1] = Math.random() * 8 + 0.5;
      this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(this.particlePositions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color("#FEF08A"), // Golden glowing sunlight particles
      size: 0.12,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.root.add(this.particles);
  }

  /**
   * Populate 3D Nature Assets: Trees, Palms, Bushes, Ferns, and Flowers
   */
  public async loadNatureAssets(basePath: string): Promise<void> {
    const loader = new GLTFLoader();

    // Helper to load and cache models
    const loadModel = async (filename: string): Promise<THREE.Group> => {
      const gltf = await loader.loadAsync(`${basePath}/${filename}`);
      const model = gltf.scene;

      // Enhance materials to respond to lighting and shadows
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Convert basic/unlit materials to Lambert for rich lighting response
          if (mesh.material) {
            const oldMat = mesh.material as THREE.Material;
            const col = (oldMat as any).color ? (oldMat as any).color.clone() : new THREE.Color(0x38a169);
            mesh.material = new THREE.MeshLambertMaterial({
              color: col,
              side: THREE.DoubleSide,
            });
          }
        }
      });
      return model;
    };

    try {
      // 1. Load real models
      const [palmTree, detailedTree, oakTree, fatTree, bushDetailed, bushLarge, grassLarge, grassLeafs, flowerYellow, flowerPurple] =
        await Promise.all([
          loadModel("tree_palm.glb"),
          loadModel("tree_detailed.glb"),
          loadModel("tree_oak.glb"),
          loadModel("tree_fat.glb"),
          loadModel("plant_bushDetailed.glb"),
          loadModel("plant_bushLarge.glb"),
          loadModel("grass_large.glb"),
          loadModel("grass_leafsLarge.glb"),
          loadModel("flower_yellowA.glb"),
          loadModel("flower_purpleA.glb"),
        ]);

      // 2. MIDGROUND & BACKGROUND TREES (Varied placement, organic forest)
      const treeConfigs = [
        // Palm trees
        { base: palmTree, x: -10, z: -6, s: 1.6, rotY: 0.4 },
        { base: palmTree, x: -2, z: -7, s: 1.8, rotY: 1.2 },
        { base: palmTree, x: 7, z: -6.5, s: 1.7, rotY: 2.1 },
        { base: palmTree, x: 14, z: -5.5, s: 1.9, rotY: 0.8 },
        // Midground canopy trees
        { base: detailedTree, x: -14, z: -9, s: 1.5, rotY: 0.2 },
        { base: oakTree, x: -6, z: -10, s: 1.4, rotY: 1.5 },
        { base: detailedTree, x: 2, z: -9.5, s: 1.6, rotY: 2.8 },
        { base: fatTree, x: 10, z: -10, s: 1.3, rotY: 0.6 },
        { base: oakTree, x: 18, z: -8, s: 1.5, rotY: 1.9 },
        // South side trees
        { base: palmTree, x: -12, z: 7, s: 1.6, rotY: 1.4 },
        { base: detailedTree, x: -4, z: 8, s: 1.5, rotY: 0.5 },
        { base: palmTree, x: 5, z: 7.5, s: 1.7, rotY: 2.4 },
        { base: oakTree, x: 12, z: 8.5, s: 1.4, rotY: 3.1 },
      ];

      treeConfigs.forEach((cfg, idx) => {
        const instance = cfg.base.clone();
        instance.position.set(cfg.x, 0, cfg.z);
        instance.scale.set(cfg.s, cfg.s, cfg.s);
        instance.rotation.y = cfg.rotY;
        this.root.add(instance);

        this.swayingObjects.push({
          obj: instance,
          phase: idx * 0.7,
          speed: 0.035,
          amp: 0.025,
        });
      });

      // 3. FOREGROUND FRAMING PLANTS (Close to camera, creates genuine 3D depth)
      const fgConfigs = [
        { base: bushDetailed, x: -5.5, z: 3.8, s: 1.8, rotY: 0.5 },
        { base: grassLeafs, x: -3.8, z: 4.5, s: 2.0, rotY: 1.1 },
        { base: bushLarge, x: -1.0, z: 4.8, s: 1.7, rotY: 2.2 },
        { base: grassLarge, x: 1.5, z: 4.4, s: 1.9, rotY: 0.3 },
        { base: bushDetailed, x: 4.2, z: 4.2, s: 1.8, rotY: 1.8 },
        { base: grassLeafs, x: 6.8, z: 3.9, s: 2.1, rotY: 2.6 },
      ];

      fgConfigs.forEach((cfg, idx) => {
        const instance = cfg.base.clone();
        instance.position.set(cfg.x, 0, cfg.z);
        instance.scale.set(cfg.s, cfg.s, cfg.s);
        instance.rotation.y = cfg.rotY;
        this.root.add(instance);

        this.swayingObjects.push({
          obj: instance,
          phase: idx * 1.1,
          speed: 0.06,
          amp: 0.045, // Foreground leaves sway more noticeably in the breeze
        });
      });

      // 4. PATHWAY VEGETATION & FLOWERS
      const pathsideConfigs = [
        { base: grassLarge, x: -8, z: 2.0, s: 1.2 },
        { base: flowerYellow, x: -6.5, z: 2.3, s: 1.4 },
        { base: bushLarge, x: -4.5, z: -2.2, s: 1.1 },
        { base: flowerPurple, x: -1.5, z: -2.5, s: 1.3 },
        { base: grassLarge, x: 0.5, z: 2.1, s: 1.2 },
        { base: flowerYellow, x: 3.5, z: 2.4, s: 1.3 },
        { base: bushDetailed, x: 5.5, z: -2.0, s: 1.2 },
        { base: flowerPurple, x: 8.0, z: 2.2, s: 1.4 },
        { base: grassLarge, x: 11.0, z: -2.3, s: 1.3 },
      ];

      pathsideConfigs.forEach((cfg, idx) => {
        const instance = cfg.base.clone();
        instance.position.set(cfg.x, 0, cfg.z);
        instance.scale.set(cfg.s, cfg.s, cfg.s);
        this.root.add(instance);

        this.swayingObjects.push({
          obj: instance,
          phase: idx * 0.8,
          speed: 0.05,
          amp: 0.03,
        });
      });

      this.isLoaded = true;
    } catch (e) {
      console.error("Error loading nature assets:", e);
    }
  }

  /**
   * Deterministic Per-Frame Environmental Animation
   */
  public update(frame: number): void {
    // 1. Swaying trees, palms, and vegetation in morning breeze
    this.swayingObjects.forEach((item) => {
      const sway = Math.sin(frame * item.speed + item.phase) * item.amp;
      item.obj.rotation.z = sway;
      item.obj.rotation.x = sway * 0.4;
    });

    // 2. Floating dust motes / pollen particles
    if (this.particles && this.particlePositions) {
      const pos = this.particles.geometry.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i);
        y += Math.sin(frame * 0.05 + i) * 0.008;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // 3. Drifting clouds in sky
    this.clouds.forEach((cloud) => {
      const sp = cloud.userData.speed as number;
      cloud.position.x += sp;
      if (cloud.position.x > 45) {
        cloud.position.x = -40;
      }
    });
  }
}
