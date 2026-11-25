// Stylised two-tone shading + PBR-Neutral tone-map inversion for Kok Iso Yo? 2.5D-in-3D engine.
// Adapted from cartoon-3d-short templates/bridge/shade.ts.

import * as THREE from "three";
import { LIGHTS, LOOK, LightMode } from "./lights";

export const TONE = {
  uLitCol: { value: new THREE.Vector3(1.5, 1.44, 1.32) },
  uShadeCol: { value: new THREE.Vector3(0.6, 0.58, 0.86) },
  uShadeLift: { value: new THREE.Vector3() },
  uLambert: { value: 0.35 },
  uSideK: { value: 0.84 },
  uTerm: { value: 0.2 },
  uBounce: { value: new THREE.Vector3() },
  uSat: { value: 1 },
};

export const CHAR = {
  uCharTint: { value: new THREE.Vector3(1, 0.94, 0.92) },
  uCharShade: { value: 0.86 },
  uGrad: { value: 0.07 },
  uBodyGrad: { value: 0.2 },
  uSideTint: { value: new THREE.Vector3(0.92, 0.9, 0.96) },
};

export function applyLightUniforms(mode: LightMode) {
  const L = LIGHTS[mode];
  const K = LOOK[mode];
  TONE.uLitCol.value.set(...L.lit);
  TONE.uShadeCol.value.set(...L.shade);
  TONE.uShadeLift.value.set(...L.lift);
  TONE.uLambert.value = L.lambert;
  TONE.uSideK.value = L.sideK;
  TONE.uTerm.value = L.term;
  TONE.uBounce.value.set(...K.bounce);
  TONE.uSat.value = K.sat;

  CHAR.uCharTint.value.set(...L.charTint);
  CHAR.uCharShade.value = L.charShade;
  CHAR.uGrad.value = L.charGrad;
  CHAR.uBodyGrad.value = L.bodyGrad;
  CHAR.uSideTint.value.set(...L.sideTint);
}

export const LFB = THREE.ShaderChunk.lights_fragment_begin
  .replace(
    "directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]",
    "sunVis = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]"
  )
  .replace(
    "vDirectionalShadowCoord[ i ] ) : 1.0;",
    "vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\tdirectLight.color *= sunVis;"
  );

if (!LFB.includes("directLight.color *= sunVis")) {
  throw new Error("shade.ts: Three.js lights_fragment_begin chunk mismatch");
}

const TWO_TONE = /* glsl */ `
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float ndl = max( dot( geometryNormal, sunV ), 0.0 );
  float sunTerm = sunVis * smoothstep( 0.0, uTerm, ndl );
  float skyK = mix( uSideK, 1.0, 0.5 + 0.5 * dot( geometryNormal, upV ) );
  vec3 lit = uLitCol * mix( 1.0, ndl, uLambert );
  float facing = max( dot( geometryNormal, geometryViewDir ), 0.0 );
  vec3 alb = max( mix( vec3( dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) ), diffuseColor.rgb, uSat ), 0.0 );
  reflectedLight.directDiffuse = alb * ( mix( uShadeCol, lit, sunTerm ) * skyK + uBounce * facing * clamp( 1.0 - dot( geometryNormal, upV ), 0.0, 1.0 ) * ( 1.0 - sunTerm ) )
    + uShadeLift * LIFT_K * ( 1.0 - sunTerm );
  reflectedLight.indirectDiffuse = vec3( 0.0 );
}
#endif
`;

const DECL =
  "#include <common>\nuniform vec3 uLitCol; uniform vec3 uShadeCol; uniform vec3 uShadeLift; uniform float uLambert; uniform float uSideK; uniform float uTerm; uniform vec3 uBounce; uniform float uSat;";

/** Convert a Lambert/Phong material into calibrated two-tone toon shading. */
export function twoTone<T extends THREE.MeshLambertMaterial | THREE.MeshPhongMaterial>(
  m: T,
  liftK = 1
): T {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TONE);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", DECL + `\n#define LIFT_K ${liftK.toFixed(3)}`)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + TWO_TONE);
  };
  m.customProgramCacheKey = () => "kokisoyo_twoTone_" + liftK.toFixed(3);
  return m;
}

const neutral = (c: number[]) => {
  const x = Math.min(c[0], c[1], c[2]);
  const off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  const v = c.map((k) => k - off);
  const peak = Math.max(v[0], v[1], v[2]);
  const S = 0.76;
  if (peak < S) return v;
  const d = 1 - S;
  const np = 1 - (d * d) / (peak + d - S);
  const g = 1 - 1 / (0.15 * (peak - np) + 1);
  return v.map((k) => ((k * np) / peak) * (1 - g) + np * g);
};

/** Invert PBR-Neutral tone mapping so self-lit targets (sky/fog/water) land cleanly at exact sRGB hexes. */
export const untone = (target: THREE.ColorRepresentation, out = new THREE.Color()) => {
  const t = new THREE.Color(target);
  const tt = [t.r, t.g, t.b].map((k) => Math.min(k, 0.985));
  let c = tt.slice();
  for (let i = 0; i < 60; i++) {
    const y = neutral(c);
    c = c.map((k, j) => Math.max(0, k + (tt[j] - y[j])));
  }
  return out.setRGB(c[0], c[1], c[2]);
};
