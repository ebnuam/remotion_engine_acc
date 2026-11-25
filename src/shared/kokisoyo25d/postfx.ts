// Re-export battle-tested InkPass, LensBlur, and GradeEffect modules cleanly for shared episode use
// without modifying the frozen src/bridge/ files directly (copied into shared so src/bridge stays untouched).

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
