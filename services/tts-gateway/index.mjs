/**
 * Public Facade for Kok Iso Yo? Multi-Provider TTS Gateway.
 *
 * Includes:
 * - Hardened provider-agnostic core (config, fail-closed commercial license gate, redaction,
 *   deterministic Indonesian text normalizer, safe ffprobe, atomic owner-locked SHA-256 cache,
 *   word timing converters, 2-mode draft/final router)
 * - Built-in provider adapters:
 *   - `edge_tts` (draft-only, free via local `edge-tts` CLI)
 *   - `azure_speech` (commercial REST API, SSML, 48kHz/192kbps MP3 & WAV)
 *   - `elevenlabs` (commercial REST API, `/with-timestamps` -> `words.json`)
 * - `createDefaultTTSRouter()` factory with all built-in adapters auto-registered.
 */

import { TTS_PROVIDERS } from "./config.mjs";
import { createTTSRouter } from "./router.mjs";
import { createAzureSpeechAdapter } from "./providers/azureSpeechAdapter.mjs";
import { createEdgeTtsAdapter } from "./providers/edgeTtsAdapter.mjs";
import { createElevenLabsAdapter } from "./providers/elevenLabsAdapter.mjs";

export * from "./errors.mjs";
export {
  createTTSSafeLogger,
  redactTTSText,
  sanitizeTTSError,
  sanitizeTTSObject,
} from "./redact.mjs";
export {
  ACCOUNT_PLAN_TIERS,
  COMMERCIAL_ACCOUNT_TIERS,
  TTS_MODES,
  TTS_PROVIDERS,
  evaluateCommercialEligibility,
  normalizeAccountPlanTier,
  resolveTTSConfig,
} from "./config.mjs";
export {
  NORMALIZATION_RULES,
  TEXT_NORMALIZER_VERSION,
  normalizeTextForTTS,
} from "./textNormalizer.mjs";
export {
  DEFAULT_DURATION_WINDOW,
  probeAudioFile,
  validateAudioDuration,
} from "./audioProbe.mjs";
export {
  CACHE_SCHEMA_VERSION,
  assertNoSymlink,
  assertPathContained,
  assertValidCacheKey,
  atomicCopyFile,
  atomicWriteFile,
  computeTTSCacheKey,
  createTTSCache,
  sanitizeCacheMetadata,
} from "./cache.mjs";
export {
  convertCharAlignmentToWords,
  normalizeWordSpans,
  parseVttOrSrtToWords,
} from "./timingConverter.mjs";
export { createTTSRouter } from "./router.mjs";
export { createEdgeTtsAdapter } from "./providers/edgeTtsAdapter.mjs";
export { buildAzureSsml, createAzureSpeechAdapter, escapeXml } from "./providers/azureSpeechAdapter.mjs";
export { createElevenLabsAdapter, wrapPcm16MonoToWav } from "./providers/elevenLabsAdapter.mjs";

/**
 * Creates a ready-to-use TTS Router with all built-in providers (`edge_tts`, `azure_speech`,
 * `elevenlabs`) automatically registered and configurable via environment variables.
 */
export function createDefaultTTSRouter(options = {}) {
  const env = options.env ?? process.env;
  const envFile = options.envFile;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  const builtinProviders = {
    [TTS_PROVIDERS.EDGE_TTS]: createEdgeTtsAdapter({
      env,
      envFile,
      ...(options.edgeOptions || {}),
    }),
    [TTS_PROVIDERS.AZURE_SPEECH]: createAzureSpeechAdapter({
      env,
      envFile,
      fetchImpl,
      ...(options.azureOptions || {}),
    }),
    [TTS_PROVIDERS.ELEVENLABS]: createElevenLabsAdapter({
      env,
      envFile,
      fetchImpl,
      ...(options.elevenLabsOptions || {}),
    }),
  };

  return createTTSRouter({
    ...options,
    env,
    envFile,
    providers: {
      ...builtinProviders,
      ...(options.providers || {}),
    },
  });
}
