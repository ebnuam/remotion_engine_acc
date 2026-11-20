/**
 * 9:16 Portrait Auto-Framing and Atmosphere Utilities
 * Kok Iso Yo? Studio — Production Pipeline v2
 *
 * Provides exact trigonometric distance calculations for 9:16 vertical video
 * to eliminate camera framing guesswork, clipping, and underwater/sky color mismatches.
 */

export type ShotType = "wide" | "medium" | "closeup";

export interface AutoFramingOptions {
  /**
   * Width of the target object / bounding box along the camera's horizontal axis (meters/units).
   */
  objectWidth: number;
  /**
   * Height of the target object / bounding box along the camera's vertical axis (meters/units).
   */
  objectHeight: number;
  /**
   * Depth of the target object along the camera view axis (meters/units).
   * Used to compensate for perspective fore-shortening. Defaults to 0.
   */
  objectDepth?: number;
  /**
   * Vertical Field of View (vFOV) in degrees.
   * Three.js PerspectiveCamera.fov uses vertical FOV. Defaults to 45 degrees.
   */
  fovDeg?: number;
  /**
   * Canvas aspect ratio (width / height).
   * Defaults to 9 / 16 (0.5625) for standard mobile portrait video.
   */
  aspect?: number;
  /**
   * Safety margin percentage per side (0.0 to 0.4).
   * For example, 0.15 gives a 15% margin on left/right and top/bottom.
   * Defaults to 0.15 (15%).
   */
  marginPercent?: number;
  /**
   * Framing style:
   * - 'wide': 100% of the object is visible with full margins (multiplier: 1.0).
   * - 'medium': Focused framing showing torso / midships / main section (multiplier: 0.65).
   * - 'closeup': Dramatic close-up on primary detail (multiplier: 0.38).
   * Defaults to 'wide'.
   */
  shotType?: ShotType;
}

export interface AutoFramingResult {
  /**
   * Recommended camera distance from the object center in world units.
   */
  distance: number;
  /**
   * Distance required to satisfy the horizontal width constraint with margins.
   */
  distH: number;
  /**
   * Distance required to satisfy the vertical height constraint with margins.
   */
  distV: number;
  /**
   * Calculated Horizontal Field of View in degrees.
   */
  hFovDeg: number;
  /**
   * Vertical Field of View in degrees.
   */
  vFovDeg: number;
  /**
   * Visible frame width at the object plane at this distance.
   */
  visibleWidth: number;
  /**
   * Visible frame height at the object plane at this distance.
   */
  visibleHeight: number;
  /**
   * ShotType multiplier applied.
   */
  multiplier: number;
}

export const SHOT_MULTIPLIERS: Record<ShotType, number> = {
  wide: 1.0,
  medium: 0.65,
  closeup: 0.38,
};

/**
 * Calculates the exact camera distance required to frame a 3D object inside a 9:16 portrait canvas
 * without horizontal or vertical clipping.
 *
 * @example
 * ```ts
 * // 54m long cargo ship, 18m tall, 9:16 portrait canvas with 42 deg vFOV:
 * const framing = calcCameraDistance({
 *   objectWidth: 54,
 *   objectHeight: 18,
 *   objectDepth: 12,
 *   fovDeg: 42,
 *   aspect: 9 / 16,
 *   marginPercent: 0.15,
 *   shotType: 'wide',
 * });
 * console.log(`Place camera at distance: ${framing.distance}m`);
 * ```
 */
export function calcCameraDistance(opts: AutoFramingOptions): AutoFramingResult {
  const {
    objectWidth,
    objectHeight,
    objectDepth = 0,
    fovDeg = 45,
    aspect = 9 / 16,
    marginPercent = 0.15,
    shotType = "wide",
  } = opts;

  // Convert vertical FOV to radians
  const vFovRad = (fovDeg * Math.PI) / 180;

  // Compute horizontal FOV for 9:16 portrait:
  // In Three.js: tan(hFov / 2) = tan(vFov / 2) * aspect
  const halfVFovTan = Math.tan(vFovRad / 2);
  const halfHFovTan = halfVFovTan * aspect;
  const hFovRad = 2 * Math.atan(halfHFovTan);
  const hFovDeg = (hFovRad * 180) / Math.PI;

  // Safe visible fraction within specified margins (e.g., 1 - 2 * 0.15 = 0.70)
  const safeFraction = Math.max(0.1, 1 - 2 * Math.min(0.45, Math.max(0.01, marginPercent)));

  // Target visible dimensions on the viewing plane
  const targetWidth = Math.max(0.01, objectWidth) / safeFraction;
  const targetHeight = Math.max(0.01, objectHeight) / safeFraction;

  // Trigonometric distances required to accommodate targetWidth and targetHeight
  const distH = targetWidth / (2 * halfHFovTan);
  const distV = targetHeight / (2 * halfVFovTan);

  // In 9:16 portrait mode, distH is usually dominant for wide objects
  const baseDistance = Math.max(distH, distV) + Math.max(0, objectDepth / 2);
  const multiplier = SHOT_MULTIPLIERS[shotType] ?? 1.0;
  const distance = Math.max(0.1, baseDistance * multiplier);

  const visibleWidth = 2 * distance * halfHFovTan;
  const visibleHeight = 2 * distance * halfVFovTan;

  return {
    distance,
    distH,
    distV,
    hFovDeg,
    vFovDeg: fovDeg,
    visibleWidth,
    visibleHeight,
    multiplier,
  };
}

/**
 * Calculates 3D camera position given a target focus point, distance, azimuth, and elevation.
 *
 * @param target [x, y, z] object focus coordinate
 * @param distance Distance from target in world units
 * @param azimuthDeg Horizontal orbit angle in degrees (0 = front +Z, 90 = right +X, 180 = back -Z, -90 = left -X)
 * @param elevationDeg Vertical elevation angle in degrees (0 = horizontal, 90 = top down, -90 = bottom up)
 * @returns [x, y, z] camera position vector
 */
export function calcOrbitPosition(
  target: [number, number, number],
  distance: number,
  azimuthDeg: number,
  elevationDeg: number
): [number, number, number] {
  const azRad = (azimuthDeg * Math.PI) / 180;
  const elRad = (elevationDeg * Math.PI) / 180;
  const cosEl = Math.cos(elRad);

  const x = target[0] + distance * Math.sin(azRad) * cosEl;
  const y = target[1] + distance * Math.sin(elRad);
  const z = target[2] + distance * Math.cos(azRad) * cosEl;

  return [x, y, z];
}

export interface AtmosphereOptions {
  /**
   * Water surface elevation along the Y-axis. Defaults to 0.0.
   */
  waterSurfaceY?: number;
  /**
   * Background color when camera is underwater. Defaults to deep sea blue "#0d5c8c".
   */
  underwaterBg?: string;
  /**
   * Fog color when camera is underwater. Defaults to "#0d5c8c".
   */
  underwaterFog?: string;
  /**
   * Fog near distance underwater. Defaults to 2.
   */
  underwaterFogNear?: number;
  /**
   * Fog far distance underwater. Defaults to 85.
   */
  underwaterFogFar?: number;
  /**
   * Background color when camera is above water. Defaults to open sky "#b8d0ec".
   */
  skyBg?: string;
  /**
   * Fog color when camera is above water. Defaults to "#b8d0ec".
   */
  skyFog?: string;
  /**
   * Fog near distance above water. Defaults to 40.
   */
  skyFogNear?: number;
  /**
   * Fog far distance above water. Defaults to 580.
   */
  skyFogFar?: number;
}

export interface AtmosphereConfig {
  isUnderwater: boolean;
  backgroundColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  sunIntensity: number;
  waterSurfaceY: number;
}

/**
 * Automatically provides atmosphere (background color, fog density, light intensities)
 * based on whether the camera is above water or submerged below water (cameraY < waterSurfaceY).
 *
 * Prevents bright sky colors from leaking into underwater views.
 *
 * @example
 * ```ts
 * const atmo = getEnvironmentAtmosphere(cam.position.y);
 * scene.background = new THREE.Color(atmo.backgroundColor);
 * scene.fog = new THREE.Fog(atmo.fogColor, atmo.fogNear, atmo.fogFar);
 * sunLight.intensity = atmo.sunIntensity;
 * ```
 */
export function getEnvironmentAtmosphere(
  cameraY: number,
  options: AtmosphereOptions = {}
): AtmosphereConfig {
  const {
    waterSurfaceY = 0.0,
    underwaterBg = "#0d5c8c",
    underwaterFog = "#0d5c8c",
    underwaterFogNear = 2,
    underwaterFogFar = 85,
    skyBg = "#b8d0ec",
    skyFog = "#b8d0ec",
    skyFogNear = 40,
    skyFogFar = 580,
  } = options;

  const isUnderwater = cameraY < waterSurfaceY;

  if (isUnderwater) {
    return {
      isUnderwater: true,
      backgroundColor: underwaterBg,
      fogColor: underwaterFog,
      fogNear: underwaterFogNear,
      fogFar: underwaterFogFar,
      ambientIntensity: 0.65,
      sunIntensity: 0.45,
      waterSurfaceY,
    };
  }

  return {
    isUnderwater: false,
    backgroundColor: skyBg,
    fogColor: skyFog,
    fogNear: skyFogNear,
    fogFar: skyFogFar,
    ambientIntensity: 0.9,
    sunIntensity: 1.2,
    waterSurfaceY,
  };
}
