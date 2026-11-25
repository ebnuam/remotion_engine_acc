// Flexible 2.5D character & prop billboard shading.
// Adapted from cartoon-3d-short templates/bridge/cardshade.ts to support both humanoid cards and arbitrary creatures/props.

import * as THREE from "three";
import { LFB, CHAR } from "./shade";

export const GRAD_K = 5.5;
export const GRAD_KB = 1.6;
export const TINT_K = 0.55;

export interface CardShadeOptions {
  /** Normalized UV Y threshold separating head zone from torso zone (set >= 1.0 for single-body props/animals). */
  headCutoff?: number;
  /** Half-width of head in UV space (default 0.2). */
  headHalfW?: number;
  /** Half-width of body/torso in UV space (default 0.15; wider e.g. 0.35 for quadrupeds/vehicles). */
  bodyHalfW?: number;
  /** Enable golden-hour warm inner rim light (default true). */
  rimEnabled?: boolean;
}

const CARD = /* glsl */ `
vec3 tintK = mix( vec3( 1.0 ), uCharTint, uTintK );
tintK /= pow( max( dot( tintK, vec3( 0.2126, 0.7152, 0.0722 ) ), 0.2 ), uNorm );
vec3 outgoingLight = diffuseColor.rgb * tintK;
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float side = sign( sunV.x ) * smoothstep( 0.0, 0.35, abs( sunV.x ) );
  float head = smoothstep( uHeadCutoff, uHeadCutoff + 0.035, vMapUv.y );
  float hw = mix( uBodyHalfW, uHeadHalfW, head );
  float uu = clamp( ( vMapUv.x - 0.5 ) / max( hw, 0.05 ), -1.0, 1.0 ) * sign( dFdx( vMapUv.x ) + 1e-7 );
  float t = uu * side;
  float g = mix( uBodyGrad * uGradKB, min( uGrad * uGradK, 0.4 ), head );
  float dark = smoothstep( -0.15, 0.9, -t );
  vec3 sideK = mix( vec3( 1.0 ), uSideTint, dark * clamp( g / max( min( uGrad * uGradK, 0.4 ), 1e-3 ), 0.0, 1.5 ) * 0.5 );
  float top = 1.0 + 0.05 * clamp( ( vMapUv.y - 0.69 ) / 0.11, -1.0, 1.0 ) * clamp( dot( sunV, upV ) * 2.0, 0.0, 1.0 ) * head;
  float lift = 1.0 + 0.04 * smoothstep( 0.0, 0.9, t );
  outgoingLight *= mix( uCharShade, 1.0, sunVis ) * ( 1.0 - g * dark ) * sideK * top * lift * uGain;
  #ifdef USE_MAP
  if ( uRimEnabled > 0.5 ) {
    float warm = smoothstep( 0.2, 0.4, 1.0 - uCharTint.b );
    float sl = length( sunV.xy );
    vec2 d2 = sunV.xy / max( sl, 1e-4 );
    vec2 duv = 2.0 * uPx * ( d2.x * dFdx( vMapUv ) + d2.y * dFdy( vMapUv ) );
    float edge = step( texture2D( map, vMapUv + duv ).a, 0.5 );
    vec2 dirU = normalize( duv + vec2( 1e-9 ) );
    vec4 c1 = texture2D( map, vMapUv - dirU * vec2( 0.027, 0.016 ) );
    vec4 c2 = texture2D( map, vMapUv - dirU * vec2( 0.067, 0.04 ) );
    float skin = step( 0.5, c1.a ) * step( 0.3, c1.r ) * step( c1.b + 0.12, c1.r ) * step( c1.g, c1.r + 0.02 );
    float torso = step( 0.27, vMapUv.y ) * step( vMapUv.y, 0.57 ) * step( 0.5, c1.a ) * step( 0.5, c2.a ) * step( 0.04, max( c1.r, max( c1.g, c1.b ) ) );
    float rim = warm * smoothstep( 0.1, 0.4, sl ) * edge * max( skin * head, torso ) * mix( 0.6, 1.0, sunVis );
    outgoingLight += vec3( 0.95, 0.52, 0.16 ) * rim;
  }
  #endif
}
#endif
`;

const DECL =
  "#include <common>\nuniform vec3 uCharTint; uniform float uCharShade; uniform float uGrad; uniform float uBodyGrad; uniform vec3 uSideTint;" +
  " uniform float uGradK; uniform float uGradKB; uniform float uTintK; uniform float uNorm; uniform float uGain; uniform float uPx;" +
  " uniform float uHeadCutoff; uniform float uHeadHalfW; uniform float uBodyHalfW; uniform float uRimEnabled;";

export const CARD_K = {
  uGradK: { value: GRAD_K },
  uGradKB: { value: GRAD_KB },
  uTintK: { value: TINT_K },
  uNorm: { value: 0.7 },
  uGain: { value: 1.03 },
  uPx: { value: 0.5 },
};

/** Patch a MeshLambertMaterial for lit 2.5D billboard cards (non-emissive, soft directional shading). */
export function cardShade(
  m: THREE.MeshLambertMaterial,
  opts: CardShadeOptions = {}
) {
  const headCutoff = opts.headCutoff ?? 0.565;
  const headHalfW = opts.headHalfW ?? 0.2;
  const bodyHalfW = opts.bodyHalfW ?? 0.15;
  const rimEnabled = opts.rimEnabled ?? true ? 1.0 : 0.0;

  m.emissive.set(0x000000);
  m.emissiveIntensity = 0;
  m.emissiveMap = null;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, CHAR, CARD_K, {
      uHeadCutoff: { value: headCutoff },
      uHeadHalfW: { value: headHalfW },
      uBodyHalfW: { value: bodyHalfW },
      uRimEnabled: { value: rimEnabled },
    });
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", DECL)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace(
        "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
        CARD
      );
  };
  m.customProgramCacheKey = () =>
    `kokisoyo_card_${headCutoff}_${headHalfW}_${bodyHalfW}_${rimEnabled}`;
  return m;
}

/** Ground contact blob material using multiply blending cleanly under characters. */
export const blobMaterial = (map: THREE.Texture) =>
  new THREE.MeshBasicMaterial({
    map,
    transparent: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.SrcColorFactor,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.DoubleSide,
  });
