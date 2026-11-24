import * as THREE from "three";

/**
 * 3D Procedural Cartoon Javan Rhino (Badak Jawa Cula Satu)
 * Kok Iso Yo? Studio — 2.5D Cinematic Cartoon Engine
 *
 * Anatomical characteristics of Rhinoceros sondaicus:
 * - Rounded, massive muscular organic torso with mosaic dermal armor plates
 * - Distinct single nasal horn (Cula Satu) curving gracefully upward
 * - Prehensile upper lip for browsing leaves
 * - Prominent shoulder and rump armor folds
 * - Articulated 4-pillar legs with 3 rounded toenails each
 * - Deterministic frame-based quadruped walk cycle, breathing, head turns, ear twitches, tail swish
 */

export interface RhinoOptions {
  isBaby?: boolean;
  isMother?: boolean;
  isMemorial?: boolean;
}

export class JavanRhino3D {
  public root: THREE.Group;
  public bodyGroup: THREE.Group;
  public headGroup: THREE.Group;
  public neckGroup: THREE.Group;
  public tailMesh: THREE.Mesh;
  public earLeft: THREE.Mesh;
  public earRight: THREE.Mesh;
  public hornMesh: THREE.Mesh;

  // Legs hierarchy: Upper -> Lower -> Foot
  private legFLUpper: THREE.Group;
  private legFLLower: THREE.Group;
  private legFRUpper: THREE.Group;
  private legFRLower: THREE.Group;
  private legBLUpper: THREE.Group;
  private legBLLower: THREE.Group;
  private legBRUpper: THREE.Group;
  private legBRLower: THREE.Group;

  private isBaby: boolean;
  private isMemorial: boolean;

  // Materials
  private skinMaterial: THREE.MeshLambertMaterial;
  private armorMaterial: THREE.MeshLambertMaterial;
  private foldMaterial: THREE.MeshLambertMaterial;
  private hornMaterial: THREE.MeshLambertMaterial;
  private toenailMaterial: THREE.MeshLambertMaterial;
  private eyeMaterial: THREE.MeshBasicMaterial;
  private pupilMaterial: THREE.MeshBasicMaterial;

  constructor(options: RhinoOptions = {}) {
    this.isBaby = !!options.isBaby;
    this.isMemorial = !!options.isMemorial;
    this.root = new THREE.Group();

    // Material palette
    const baseColor = this.isMemorial ? "#94A3B8" : "#556575";
    const armorColor = this.isMemorial ? "#64748B" : "#485664";
    const foldColor = this.isMemorial ? "#475569" : "#36414C";
    const hornColor = this.isMemorial ? "#CBD5E1" : "#E5A024";
    const toenailColor = "#F1F5F9";

    this.skinMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(baseColor),
    });
    this.armorMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(armorColor),
    });
    this.foldMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(foldColor),
    });
    this.hornMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(hornColor),
    });
    this.toenailMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(toenailColor),
    });
    this.eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x111827 });

    // Root scale based on adult vs baby
    const scaleFactor = this.isBaby ? 0.52 : 1.0;
    this.root.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // 1. Torso & Body Group
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    // Main barrel torso (rounded organic ellipsoid)
    const torsoGeo = new THREE.SphereGeometry(1.4, 24, 20);
    torsoGeo.scale(1.45, 0.95, 0.85); // elongated barrel
    const torsoMesh = new THREE.Mesh(torsoGeo, this.skinMaterial);
    torsoMesh.position.set(0, 1.45, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.bodyGroup.add(torsoMesh);

    // Shoulder Armor Plate (curved saddle shield)
    const shoulderGeo = new THREE.SphereGeometry(1.44, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    shoulderGeo.scale(0.85, 0.98, 0.88);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, this.armorMaterial);
    shoulderMesh.position.set(0.65, 1.48, 0);
    shoulderMesh.castShadow = true;
    this.bodyGroup.add(shoulderMesh);

    // Rump / Pelvic Armor Plate
    const rumpGeo = new THREE.SphereGeometry(1.44, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    rumpGeo.scale(0.85, 0.96, 0.88);
    const rumpMesh = new THREE.Mesh(rumpGeo, this.armorMaterial);
    rumpMesh.position.set(-0.65, 1.48, 0);
    rumpMesh.castShadow = true;
    this.bodyGroup.add(rumpMesh);

    // Dermal Armor Fold Grooves (torso crease rings)
    const foldGeo = new THREE.TorusGeometry(1.05, 0.05, 8, 24);
    foldGeo.rotateY(Math.PI / 2);
    const foldMesh1 = new THREE.Mesh(foldGeo, this.foldMaterial);
    foldMesh1.position.set(0.35, 1.45, 0);
    this.bodyGroup.add(foldMesh1);

    const foldMesh2 = new THREE.Mesh(foldGeo, this.foldMaterial);
    foldMesh2.position.set(-0.35, 1.45, 0);
    this.bodyGroup.add(foldMesh2);

    // Tail
    const tailCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.25, -0.4, 0),
      new THREE.Vector3(-0.3, -0.75, 0.05),
      new THREE.Vector3(-0.28, -0.95, 0.1)
    );
    const tailGeo = new THREE.TubeGeometry(tailCurve, 12, 0.045, 8, false);
    this.tailMesh = new THREE.Mesh(tailGeo, this.skinMaterial);
    this.tailMesh.position.set(-1.85, 1.7, 0);
    this.tailMesh.castShadow = true;
    this.bodyGroup.add(this.tailMesh);

    // Tail tuft
    const tuftGeo = new THREE.ConeGeometry(0.08, 0.22, 8);
    tuftGeo.rotateZ(Math.PI);
    const tuftMesh = new THREE.Mesh(tuftGeo, this.foldMaterial);
    tuftMesh.position.set(-0.28, -1.0, 0.1);
    this.tailMesh.add(tuftMesh);

    // 2. Neck & Head Hierarchy
    this.neckGroup = new THREE.Group();
    this.neckGroup.position.set(1.4, 1.6, 0);
    this.bodyGroup.add(this.neckGroup);

    // Neck mesh
    const neckGeo = new THREE.CylinderGeometry(0.65, 0.85, 0.8, 16);
    neckGeo.rotateZ(-Math.PI / 3);
    const neckMesh = new THREE.Mesh(neckGeo, this.skinMaterial);
    neckMesh.position.set(0.3, 0.15, 0);
    neckMesh.castShadow = true;
    this.neckGroup.add(neckMesh);

    // Neck armor fold collar
    const collarGeo = new THREE.TorusGeometry(0.72, 0.07, 8, 20);
    collarGeo.rotateY(Math.PI / 2);
    collarGeo.rotateZ(Math.PI / 6);
    const collarMesh = new THREE.Mesh(collarGeo, this.foldMaterial);
    collarMesh.position.set(0.18, 0.1, 0);
    this.neckGroup.add(collarMesh);

    // Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0.65, 0.35, 0);
    this.neckGroup.add(this.headGroup);

    // Head base (skull)
    const headGeo = new THREE.SphereGeometry(0.6, 18, 14);
    headGeo.scale(1.3, 0.85, 0.75);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Snout & Prehensile Upper Lip (tapered towards front-down)
    const snoutGeo = new THREE.ConeGeometry(0.44, 0.8, 16);
    snoutGeo.rotateZ(-Math.PI / 2.3);
    const snoutMesh = new THREE.Mesh(snoutGeo, this.skinMaterial);
    snoutMesh.position.set(0.75, -0.2, 0);
    snoutMesh.scale.set(0.9, 1.0, 0.75);
    snoutMesh.castShadow = true;
    this.headGroup.add(snoutMesh);

    // Distinct Single Nasal Horn (Cula Satu)
    const hornHeight = this.isBaby ? 0.2 : 0.65;
    const hornRadius = this.isBaby ? 0.09 : 0.15;
    const hornGeo = new THREE.ConeGeometry(hornRadius, hornHeight, 16);
    hornGeo.rotateZ(-Math.PI / 12);
    hornGeo.translate(0, hornHeight * 0.5, 0);
    this.hornMesh = new THREE.Mesh(hornGeo, this.hornMaterial);
    this.hornMesh.position.set(0.78, 0.05, 0);
    this.hornMesh.rotation.z = -0.35;
    this.hornMesh.castShadow = true;
    this.headGroup.add(this.hornMesh);

    // Ears (Mobile, twitching)
    const earGeo = new THREE.ConeGeometry(0.12, 0.35, 10);
    earGeo.scale(0.6, 1.0, 0.9);

    this.earLeft = new THREE.Mesh(earGeo, this.skinMaterial);
    this.earLeft.position.set(-0.15, 0.55, 0.32);
    this.earLeft.rotation.set(-0.25, 0, -0.4);
    this.earLeft.castShadow = true;
    this.headGroup.add(this.earLeft);

    this.earRight = new THREE.Mesh(earGeo, this.skinMaterial);
    this.earRight.position.set(-0.15, 0.55, -0.32);
    this.earRight.rotation.set(0.25, 0, -0.4);
    this.earRight.castShadow = true;
    this.headGroup.add(this.earRight);

    // Cartoon Eyes
    const createEye = (zPos: number) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(0.35, 0.22, zPos);

      const eyeWhiteGeo = new THREE.SphereGeometry(0.08, 12, 10);
      eyeWhiteGeo.scale(1.2, 1.0, 0.4);
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, this.eyeMaterial);
      eyeGroup.add(eyeWhite);

      const pupilGeo = new THREE.SphereGeometry(0.045, 10, 8);
      pupilGeo.scale(1.0, 1.0, 0.3);
      const pupil = new THREE.Mesh(pupilGeo, this.pupilMaterial);
      pupil.position.set(0.04, 0, 0.03 * (zPos > 0 ? 1 : -1));
      eyeGroup.add(pupil);

      return eyeGroup;
    };

    this.headGroup.add(createEye(0.42));
    this.headGroup.add(createEye(-0.42));

    // 3. Four Pillar Legs with Articulation
    this.legFLUpper = this.createLeg(0.95, -0.52, true); // Front Left
    this.leglegFLInit();
    this.legFRUpper = this.createLeg(0.95, 0.52, true); // Front Right
    this.leglegFRInit();
    this.legBLUpper = this.createLeg(-0.95, -0.52, false); // Back Left
    this.leglegBLInit();
    this.legBRUpper = this.createLeg(-0.95, 0.52, false); // Back Right
    this.leglegBRInit();

    this.root.add(this.legFLUpper);
    this.root.add(this.legFRUpper);
    this.root.add(this.legBLUpper);
    this.root.add(this.legBRUpper);

    // Baby adjustments
    if (this.isBaby) {
      this.headGroup.scale.set(1.25, 1.25, 1.25); // baby head proportion
    }
  }

  private createLeg(xPos: number, zPos: number, isFront: boolean): THREE.Group {
    const upperGroup = new THREE.Group();
    upperGroup.position.set(xPos, 1.35, zPos);

    // Muscular Upper thigh / shoulder
    const upperThighGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.65, 14);
    upperThighGeo.translate(0, -0.3, 0);
    const upperThigh = new THREE.Mesh(upperThighGeo, this.skinMaterial);
    upperThigh.castShadow = true;
    upperGroup.add(upperThigh);

    // Knee / elbow pivot group
    const lowerGroup = new THREE.Group();
    lowerGroup.position.set(0, -0.6, 0);
    upperGroup.add(lowerGroup);

    // Lower shin
    const shinGeo = new THREE.CylinderGeometry(0.21, 0.23, 0.65, 14);
    shinGeo.translate(0, -0.3, 0);
    const shin = new THREE.Mesh(shinGeo, this.skinMaterial);
    shin.castShadow = true;
    lowerGroup.add(shin);

    // Wide padded foot
    const footGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.18, 16);
    footGeo.translate(0, -0.68, 0.03);
    const foot = new THREE.Mesh(footGeo, this.skinMaterial);
    foot.castShadow = true;
    lowerGroup.add(foot);

    // 3 Toenails per foot (Iconic perissodactyl odd-toed ungulate)
    for (let i = -1; i <= 1; i++) {
      const nailGeo = new THREE.SphereGeometry(0.065, 8, 8);
      nailGeo.scale(0.8, 0.6, 1.2);
      const nail = new THREE.Mesh(nailGeo, this.toenailMaterial);
      const angle = (i * Math.PI) / 6;
      nail.position.set(
        Math.cos(angle) * 0.25,
        -0.72,
        Math.sin(angle) * 0.22
      );
      lowerGroup.add(nail);
    }

    return upperGroup;
  }

  private leglegFLInit() {
    this.legFLLower = this.legFLUpper.children[1] as THREE.Group;
  }
  private leglegFRInit() {
    this.legFRLower = this.legFRUpper.children[1] as THREE.Group;
  }
  private leglegBLInit() {
    this.legBLLower = this.legBLUpper.children[1] as THREE.Group;
  }
  private leglegBRInit() {
    this.legBRLower = this.legBRUpper.children[1] as THREE.Group;
  }

  /**
   * Deterministic Frame-Based Animation Update
   * @param frame Current frame number from useCurrentFrame()
   * @param isWalking Whether the rhino is moving
   * @param speed Walk cycle playback speed multiplier
   */
  public update(frame: number, isWalking = true, speed = 1.0): void {
    const cycleSpeed = (this.isBaby ? 0.24 : 0.18) * speed;
    const phase = frame * cycleSpeed;

    // 1. Breathing motion (subtle rhythmic chest expansion)
    const breath = Math.sin(frame * 0.06) * 0.025;
    this.bodyGroup.scale.set(1.0 + breath * 0.5, 1.0 + breath, 1.0 + breath * 0.5);

    // 2. Ear twitches (gentle independent rotation)
    const earTwitchL = Math.sin(frame * 0.14) * 0.18;
    const earTwitchR = Math.cos(frame * 0.11) * 0.16;
    this.earLeft.rotation.z = -0.4 + earTwitchL;
    this.earRight.rotation.z = -0.4 - earTwitchR;

    // 3. Tail pendulum swish
    const tailSwish = Math.sin(frame * 0.12) * 0.28;
    this.tailMesh.rotation.y = tailSwish;

    if (isWalking) {
      // Natural 4-beat quadruped walk cycle
      // Phase offsets: FL=0, RR=PI*0.5, FR=PI, RL=PI*1.5
      const swingFL = Math.sin(phase);
      const swingRR = Math.sin(phase + Math.PI * 0.5);
      const swingFR = Math.sin(phase + Math.PI);
      const swingRL = Math.sin(phase + Math.PI * 1.5);

      // Leg angle sweeps (hips / shoulders)
      const maxAngle = 0.38;
      this.legFLUpper.rotation.z = -swingFL * maxAngle;
      this.legFRUpper.rotation.z = -swingFR * maxAngle;
      this.legBLUpper.rotation.z = -swingRL * maxAngle;
      this.legBRUpper.rotation.z = -swingRR * maxAngle;

      // Knee flexion during lift phase (only bend backwards/forwards naturally)
      this.legFLLower.rotation.z = Math.max(0, -swingFL) * 0.45;
      this.legFRLower.rotation.z = Math.max(0, -swingFR) * 0.45;
      this.legBLLower.rotation.z = Math.max(0, swingRL) * 0.45;
      this.legBRLower.rotation.z = Math.max(0, swingRR) * 0.45;

      // Torso bobbing & weight transfer
      const bobY = Math.abs(Math.sin(phase * 2)) * 0.06;
      const rollZ = Math.sin(phase) * 0.03;
      this.bodyGroup.position.y = bobY;
      this.bodyGroup.rotation.z = rollZ;

      // Head nodding counter to front steps
      const headNod = Math.sin(phase) * 0.08;
      this.neckGroup.rotation.z = headNod * 0.5;
      this.headGroup.rotation.z = -headNod * 0.8;
    } else {
      // Idle state
      this.legFLUpper.rotation.z = 0;
      this.legFRUpper.rotation.z = 0;
      this.legBLUpper.rotation.z = 0;
      this.legBRUpper.rotation.z = 0;
      this.legFLLower.rotation.z = 0;
      this.legFRLower.rotation.z = 0;
      this.legBLLower.rotation.z = 0;
      this.legBRLower.rotation.z = 0;

      // Idle head sway & breathing bob
      this.bodyGroup.position.y = Math.sin(frame * 0.05) * 0.02;
      this.headGroup.rotation.z = Math.sin(frame * 0.04) * 0.04;
      this.headGroup.rotation.y = Math.sin(frame * 0.03) * 0.06;
    }
  }

  public setPosition(x: number, y: number, z: number): void {
    this.root.position.set(x, y, z);
  }

  public setRotation(x: number, y: number, z: number): void {
    this.root.rotation.set(x, y, z);
  }
}
