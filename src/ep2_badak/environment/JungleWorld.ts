import * as THREE from "three";
import { JavanRhino3D } from "../characters/JavanRhino3D";

/**
 * 3D Tropical Rainforest World — Ujung Kulon National Park
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Multi-layered depth:
 * - Foreground: Swaying broadleaf ferns & palm leaves right in front of lens
 * - Midground: Articulated Badak Jawa on dirt trail, mud wallows, mossy stones, bamboo
 * - Background: Canopy trees, layered misty mountain ridges, tropical sky & drifting clouds
 * - Daylight lighting with warm sun and soft atmospheric bounce
 */

export class JungleWorld {
  public root: THREE.Group;
  public rhino: JavanRhino3D;
  public babyRhino?: JavanRhino3D;

  private clouds: THREE.Group[] = [];
  private trees: THREE.Group[] = [];
  private ferns: THREE.Group[] = [];
  private sunlight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  constructor(options: { hasBaby?: boolean } = {}) {
    this.root = new THREE.Group();

    // 1. Lighting Setup (Bright Daylight Atmosphere)
    this.hemiLight = new THREE.HemisphereLight("#E0F2FE", "#2D5A27", 0.85);
    this.root.add(this.hemiLight);

    this.sunlight = new THREE.DirectionalLight("#FFF8E7", 2.2);
    this.sunlight.position.set(12, 18, 10);
    this.sunlight.castShadow = true;
    this.sunlight.shadow.mapSize.width = 1024;
    this.sunlight.shadow.mapSize.height = 1024;
    this.sunlight.shadow.camera.near = 0.5;
    this.sunlight.shadow.camera.far = 50;
    this.sunlight.shadow.camera.left = -15;
    this.sunlight.shadow.camera.right = 15;
    this.sunlight.shadow.camera.top = 15;
    this.sunlight.shadow.camera.bottom = -15;
    this.root.add(this.sunlight);

    const ambient = new THREE.AmbientLight("#A7D8F0", 0.5);
    this.root.add(ambient);

    // 2. Sky Hemisphere Dome
    this.buildSky();

    // 3. Drifting Puffy Cartoon Clouds
    this.buildClouds();

    // 4. Terrain (Contoured Dirt Trail & Mud Wallow)
    this.buildTerrain();

    // 5. Tropical Trees & Rainforest Canopy
    this.buildTrees();

    // 6. Layered Foreground & Midground Foliage (Ferns & Palms)
    this.buildFoliage();

    // 7. Characters (Badak Jawa)
    this.rhino = new JavanRhino3D();
    this.rhino.setPosition(0, 0.45, 0);
    this.root.add(this.rhino.root);

    if (options.hasBaby) {
      this.babyRhino = new JavanRhino3D({ isBaby: true });
      this.babyRhino.setPosition(-2.2, 0.45, 0.6);
      this.root.add(this.babyRhino.root);
    }
  }

  private buildSky(): void {
    const skyGeo = new THREE.SphereGeometry(120, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#60A5FA"),
      side: THREE.BackSide,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.root.add(skyMesh);

    // Distant mountain ridges (Background layer)
    const ridgeGroup = new THREE.Group();
    const ridgeMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#478580"),
    });

    for (let i = -4; i <= 4; i++) {
      const coneGeo = new THREE.ConeGeometry(12 + Math.abs(i) * 2, 14 + (i % 2) * 4, 7);
      const ridge = new THREE.Mesh(coneGeo, ridgeMat);
      ridge.position.set(i * 14, 2, -45 - Math.abs(i) * 3);
      ridgeGroup.add(ridge);
    }
    this.root.add(ridgeGroup);
  }

  private buildClouds(): void {
    const cloudMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#FFFFFF"),
      emissive: new THREE.Color("#E0F2FE"),
      emissiveIntensity: 0.25,
    });

    const cloudPositions = [
      { x: -35, y: 16, z: -35 },
      { x: -12, y: 22, z: -30 },
      { x: 18, y: 18, z: -38 },
      { x: 38, y: 24, z: -32 },
      { x: -2, y: 19, z: -25 },
    ];

    cloudPositions.forEach((pos, idx) => {
      const cloud = new THREE.Group();
      // Form cloud puff out of 5 overlapping spheres
      const puffSizes = [2.2, 1.8, 2.5, 1.6, 2.0];
      const offsets = [
        [0, 0, 0],
        [-1.6, -0.4, 0.3],
        [1.8, -0.2, -0.2],
        [-0.8, 1.0, 0.1],
        [1.0, 0.9, -0.1],
      ];

      offsets.forEach(([ox, oy, oz], pIdx) => {
        const puffGeo = new THREE.SphereGeometry(puffSizes[pIdx], 12, 10);
        const puffMesh = new THREE.Mesh(puffGeo, cloudMat);
        puffMesh.position.set(ox, oy, oz);
        cloud.add(puffMesh);
      });

      cloud.position.set(pos.x, pos.y, pos.z);
      cloud.userData = { speed: 0.04 + (idx % 3) * 0.015, initialX: pos.x };
      this.clouds.push(cloud);
      this.root.add(cloud);
    });
  }

  private buildTerrain(): void {
    // 1. Lush Green Rainforest Floor
    const groundGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);

    // Apply gentle procedural hill bumps to vertex positions
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Depress middle for trail, raise sides for jungle knolls
      const distFromCenter = Math.abs(z);
      const knoll = Math.sin(x * 0.12) * Math.cos(z * 0.14) * 0.6;
      const elevation = distFromCenter > 4 ? (distFromCenter - 4) * 0.25 + knoll : knoll * 0.2;
      pos.setY(i, elevation);
    }
    groundGeo.computeVertexNormals();

    const grassMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#4D7C0F"), // Rich tropical rainforest grass
    });
    const groundMesh = new THREE.Mesh(groundGeo, grassMat);
    groundMesh.receiveShadow = true;
    this.root.add(groundMesh);

    // 2. Dirt Trail / Rhino Pathway
    const trailGeo = new THREE.PlaneGeometry(80, 5, 24, 6);
    trailGeo.rotateX(-Math.PI / 2);
    const trailMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#855427"), // Earthy jungle soil
    });
    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
    trailMesh.position.set(0, 0.04, 0);
    trailMesh.receiveShadow = true;
    this.root.add(trailMesh);

    // 3. Mud Wallow Pond (Water puddle)
    const puddleGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.1, 20);
    const puddleMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#38596B"),
    });
    const puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
    puddleMesh.position.set(8, 0.08, 4);
    puddleMesh.scale.set(1.4, 1.0, 0.9);
    puddleMesh.receiveShadow = true;
    this.root.add(puddleMesh);

    // Mossy River Stones
    const stoneMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#64748B"),
    });
    const stonePositions = [
      [6, 0.2, 2.5],
      [10.5, 0.25, 3.5],
      [7.5, 0.2, 6.0],
      [-4.5, 0.3, 2.8],
      [-7.0, 0.2, -2.5],
    ];
    stonePositions.forEach(([sx, sy, sz]) => {
      const stoneGeo = new THREE.DodecahedronGeometry(0.45 + (sx % 0.3), 1);
      stoneGeo.scale(1.3, 0.7, 1.0);
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(sx, sy, sz);
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.root.add(stone);
    });
  }

  private buildTrees(): void {
    const trunkMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#5C3D24"),
    });
    const foliageColors = ["#15803D", "#16A34A", "#22C55E", "#166534"];

    const treeConfigs = [
      { x: -14, z: -10, scale: 1.4 },
      { x: -8, z: -14, scale: 1.2 },
      { x: 3, z: -12, scale: 1.3 },
      { x: 12, z: -11, scale: 1.5 },
      { x: -16, z: 8, scale: 1.3 },
      { x: -7, z: 12, scale: 1.1 },
      { x: 5, z: 13, scale: 1.4 },
      { x: 15, z: 9, scale: 1.6 },
      // Distant midground trees
      { x: -22, z: -20, scale: 1.8 },
      { x: -4, z: -22, scale: 1.7 },
      { x: 18, z: -24, scale: 2.0 },
    ];

    treeConfigs.forEach((cfg, idx) => {
      const tree = new THREE.Group();
      tree.position.set(cfg.x, 0, cfg.z);
      tree.scale.set(cfg.scale, cfg.scale, cfg.scale);

      // Trunk with buttress roots
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 4.5, 10);
      trunkGeo.translate(0, 2.25, 0);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.castShadow = true;
      tree.add(trunk);

      // Organic Cartoon Foliage Canopy (Cluster of green puffs)
      const leafMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(foliageColors[idx % foliageColors.length]),
      });

      const canopyGroup = new THREE.Group();
      canopyGroup.position.set(0, 4.2, 0);

      const puffs = [
        { x: 0, y: 0.8, z: 0, r: 2.0 },
        { x: -1.2, y: 0.2, z: 0.6, r: 1.5 },
        { x: 1.3, y: 0.3, z: -0.4, r: 1.6 },
        { x: 0.4, y: 0.2, z: 1.1, r: 1.4 },
        { x: -0.5, y: 0.1, z: -1.0, r: 1.5 },
      ];

      puffs.forEach((p) => {
        const puffGeo = new THREE.SphereGeometry(p.r, 12, 10);
        const puff = new THREE.Mesh(puffGeo, leafMat);
        puff.position.set(p.x, p.y, p.z);
        puff.castShadow = true;
        canopyGroup.add(puff);
      });

      tree.add(canopyGroup);
      tree.userData = { swayOffset: idx * 0.8 };
      this.trees.push(tree);
      this.root.add(tree);
    });
  }

  private buildFoliage(): void {
    const fernMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color("#22C55E"),
      side: THREE.DoubleSide,
    });

    // Foreground and pathside ferns
    const fernPositions = [
      // Foreground layers (near camera)
      { x: -3.5, z: 4.5, s: 1.3 },
      { x: 2.5, z: 5.2, s: 1.5 },
      { x: -1.0, z: 5.8, s: 1.4 },
      // Path edges
      { x: -4.8, z: 2.0, s: 1.1 },
      { x: 4.2, z: 2.2, s: 1.2 },
      { x: -6.0, z: -2.0, s: 1.3 },
      { x: 2.8, z: -2.5, s: 1.0 },
      { x: -2.5, z: -2.2, s: 1.1 },
    ];

    fernPositions.forEach((fp, idx) => {
      const fern = new THREE.Group();
      fern.position.set(fp.x, 0, fp.z);
      fern.scale.set(fp.s, fp.s, fp.s);

      // 6 arching fan fronds
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const frondGeo = new THREE.ConeGeometry(0.35, 1.6, 6);
        frondGeo.translate(0, 0.8, 0);
        frondGeo.rotateZ(0.65); // arch outward
        frondGeo.rotateY(angle);

        const frond = new THREE.Mesh(frondGeo, fernMat);
        frond.castShadow = true;
        fern.add(frond);
      }

      fern.userData = { windPhase: idx * 0.9 };
      this.ferns.push(fern);
      this.root.add(fern);
    });
  }

  /**
   * Deterministic Frame-Based Environment Animation
   * @param frame Current frame
   * @param rhinoWalking Whether the rhino is in motion
   */
  public update(frame: number, rhinoWalking = true, speed = 1.0): void {
    // 1. Clouds drifting continuously
    this.clouds.forEach((cloud) => {
      const sp = cloud.userData.speed as number;
      cloud.position.x += sp;
      if (cloud.position.x > 50) {
        cloud.position.x = -45;
      }
    });

    // 2. Trees swaying gently in tropical breeze
    this.trees.forEach((tree) => {
      const offset = tree.userData.swayOffset as number;
      const sway = Math.sin(frame * 0.04 + offset) * 0.035;
      tree.rotation.z = sway;
      tree.rotation.x = sway * 0.5;
    });

    // 3. Ferns flutter
    this.ferns.forEach((fern) => {
      const phase = fern.userData.windPhase as number;
      const flutter = Math.sin(frame * 0.08 + phase) * 0.06;
      fern.rotation.y = flutter;
      fern.scale.y = 1.0 + Math.cos(frame * 0.06 + phase) * 0.03;
    });

    // 4. Rhino Character Update
    this.rhino.update(frame, rhinoWalking, speed);
    if (this.babyRhino) {
      this.babyRhino.update(frame, rhinoWalking, speed * 1.15);
    }
  }
}
