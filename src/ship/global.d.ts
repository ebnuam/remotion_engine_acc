import * as THREE from "three";
import React from "react";

declare module "three" {
  interface ShaderMaterial {
    onBeforeRender?: (
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.Camera,
      geometry: THREE.BufferGeometry,
      object: THREE.Object3D,
      group: THREE.Group
    ) => void;
  }
}

declare module "@react-three/postprocessing" {
  interface EffectComposerProps {
    children?: React.ReactNode;
  }
}
