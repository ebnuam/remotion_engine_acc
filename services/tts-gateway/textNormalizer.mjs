/**
 * Deterministic Indonesian Text Normalizer for Kok Iso Yo? TTS Gateway.
 *
 * Guarantees:
 * - Always preserves `originalText` untouched.
 * - Produces deterministic `normalizedText` using ONLY documented rules below.
 * - Records every applied rule in `appliedRules` for full auditability.
 * - Exports `TEXT_NORMALIZER_VERSION` so TTS cache invalidates cleanly if rules ever change.
 */

export const TEXT_NORMALIZER_VERSION = "1.0.0";

/**
 * Explicitly documented deterministic normalization rules for Indonesian science/explainer TTS.
 * Order matters and is fixed.
 */
export const NORMALIZATION_RULES = Object.freeze([
  {
    id: "unicode_cleanup",
    description: "Normalize curly quotes/dashes and collapse extraneous whitespace/newlines cleanly.",
    apply: (s) =>
      s
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
  },
  {
    id: "temperature_celsius",
    description: "Expand °C to Indonesian spoken form 'derajat Celsius'.",
    apply: (s) => s.replace(/(\d)\s*°\s*C\b/gi, "$1 derajat Celsius").replace(/°\s*C\b/gi, "derajat Celsius"),
  },
  {
    id: "temperature_fahrenheit",
    description: "Expand °F to Indonesian spoken form 'derajat Fahrenheit'.",
    apply: (s) => s.replace(/(\d)\s*°\s*F\b/gi, "$1 derajat Fahrenheit").replace(/°\s*F\b/gi, "derajat Fahrenheit"),
  },
  {
    id: "approximation_tilde",
    description: "Expand leading ~ or ≈ before a number to 'sekitar <number>'.",
    apply: (s) => s.replace(/[~≈]\s*(\d)/g, "sekitar $1"),
  },
  {
    id: "plus_minus_symbol",
    description: "Expand ± before a number to 'kurang lebih <number>'.",
    apply: (s) => s.replace(/±\s*(\d)/g, "kurang lebih $1"),
  },
  {
    id: "numeric_plus_suffix",
    description: "Expand '<number>+' to '<number> lebih' (e.g. '200+' -> '200 lebih').",
    apply: (s) => s.replace(/(\d)\+(?=\s|$|[.,!?;:])/g, "$1 lebih"),
  },
  {
    id: "percentage_symbol",
    description: "Expand '<number>%' to '<number> persen'.",
    apply: (s) => s.replace(/(\d)\s*%/g, "$1 persen"),
  },
  {
    id: "numeric_range",
    description: "Expand standalone 2-number ranges 'A-B' or 'A–B' to 'A sampai B' (ignoring multi-dash codes/dates like '87-08-09' or '2026-11-26').",
    apply: (s) =>
      s.replace(/(?<![-\d])(\b\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?\b)(?![-\d])/g, "$1 sampai $2"),
  },
  {
    id: "unit_km_per_hour",
    description: "Expand 'km/jam' to 'kilometer per jam'.",
    apply: (s) => s.replace(/\bkm\/jam\b/gi, "kilometer per jam"),
  },
  {
    id: "unit_meter_per_sec",
    description: "Expand 'm/s' or 'm/detik' to 'meter per detik'.",
    apply: (s) => s.replace(/\bm\/(?:s|detik)\b/gi, "meter per detik"),
  },
  {
    id: "unit_kg_per_cm2",
    description: "Expand 'kg/cm²' or 'kg/cm2' to 'kilogram per sentimeter persegi'.",
    apply: (s) => s.replace(/\bkg\/cm(?:²|2)\b/gi, "kilogram per sentimeter persegi"),
  },
  {
    id: "chemical_formulas_basic",
    description: "Space common chemical formulas (CO2, O2, N2, H2O) for clearer Indonesian TTS articulation.",
    apply: (s) =>
      s
        .replace(/\bCO2\b/g, "C O 2")
        .replace(/\bH2O\b/g, "H 2 O")
        .replace(/\bN2\b/g, "N 2")
        .replace(/\bO2\b/g, "O 2"),
  },
  {
    id: "final_whitespace_tidy",
    description: "Ensure single spaces after expansions.",
    apply: (s) => s.replace(/[ \t]{2,}/g, " ").trim(),
  },
]);

/**
 * Normalizes Indonesian narration text deterministically while preserving `originalText`.
 */
export function normalizeTextForTTS(text, { enabled = true } = {}) {
  const originalText = String(text ?? "");
  if (!enabled) {
    return {
      originalText,
      normalizedText: originalText.trim(),
      normalizerVersion: `${TEXT_NORMALIZER_VERSION}:disabled`,
      appliedRules: [],
      rawCharCount: originalText.length,
      normalizedCharCount: originalText.trim().length,
    };
  }

  let current = originalText;
  const appliedRules = [];

  for (const rule of NORMALIZATION_RULES) {
    const next = rule.apply(current);
    if (next !== current) {
      appliedRules.push(rule.id);
      current = next;
    }
  }

  return {
    originalText,
    normalizedText: current,
    normalizerVersion: TEXT_NORMALIZER_VERSION,
    appliedRules,
    rawCharCount: originalText.length,
    normalizedCharCount: current.length,
  };
}
