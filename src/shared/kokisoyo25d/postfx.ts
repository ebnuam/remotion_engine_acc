// Re-export battle-tested InkPass, LensBlur, and GradeEffect modules cleanly for shared episode use
// without modifying the frozen src/bridge/ files directly (copied into shared so src/bridge stays untouched).

import * as THREE from "three";
import { BlendFunction, Effect, ToneMappingEffect, ToneMappingMode } from "postprocessing";

export { NOINK, InkPass, noInkFallback, type InkOptions } from "../../bridge/ink";
export { LensBlur, LensBlurEffect, GrainEffect } from "../../bridge/lensblur";
export {
  GradeEffect,
  GRADES,
  GRADE_STRENGTH,
  GRADE_DAY,
  GRADE_GOLDEN,
  GRADE_DAY2,
  GRADE_GOLDEN2,
  gradeFor,
  monoTangents,
  tintRGB,
  type GradeParams,
} from "../../bridge/grade";

const PBR_NEUTRAL_FRAG = /* glsl */ `
uniform float pbrNeutralExposure;

// Khronos PBR Neutral Tone Mapping (matches Three.js r162+ NeutralToneMapping)
vec3 pbrNeutralMap(vec3 color) {
  const float startCompression = 0.8 - 0.04;
  const float desaturation = 0.15;
  color = max(color * pbrNeutralExposure, vec3(0.0));
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  const float d = 1.0 - startCompression;
  float newPeak = 1.0 - d * d / (peak + d - startCompression);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  return mix(color, vec3(newPeak), g);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(clamp(pbrNeutralMap(inputColor.rgb), 0.0, 1.0), inputColor.a);
}
`;

/**
 * Khronos PBR Neutral tone-mapping Effect compatible with Three r161 + postprocessing 6.37
 * (where Three's built-in NeutralToneMapping shader chunk is only available in r162+).
 */
export class PbrNeutralToneMappingEffect extends Effect {
  constructor(exposure = 1.0) {
    super("PbrNeutralToneMappingEffect", PBR_NEUTRAL_FRAG, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map([["pbrNeutralExposure", new THREE.Uniform(exposure)]]),
    });
  }
}

export function createNeutralToneMappingEffect(): Effect {
  const chunk = THREE.ShaderChunk.tonemapping_pars_fragment ?? "";
  if (chunk.includes("NeutralToneMapping")) {
    return new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
  }
  return new PbrNeutralToneMappingEffect(1.0);
}
