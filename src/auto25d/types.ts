// Data schema for Kok Iso Yo? Automated 2.5D-in-3D Episode Engine (src/auto25d/).
// Completely isolated from frozen legacy episodes (src/bridge, src/ship, src/ep2_badak).

export type AutoLightMode = "day" | "golden" | "night";

export type AutoEnvTheme =
  | "runway"
  | "lab_blueprint"
  | "nature_outdoor"
  | "urban_street"
  | "sky_cosmos";

export type AutoCameraAngle =
  | "low_angle"
  | "wide"
  | "medium"
  | "close_up"
  | "extreme_close_up"
  | "top_down"
  | "high_angle"
  | "aerial";

export type AutoCameraMotion =
  | "push_in"
  | "pull_back"
  | "orbit"
  | "pan_right"
  | "tilt_up"
  | "crane_down";

export type AutoHeroProp =
  | "jet_landing"
  | "tire_touchdown_smoke"
  | "tire_spinup"
  | "four_pillars_radial"
  | "tire_cutaway_layers"
  | "burst_test_4x"
  | "tire_pressure_200psi"
  | "tire_vs_six_cars"
  | "nitrogen_xray"
  | "brake_glow_shield"
  | "fusible_plug_zoom"
  | "fusible_plug_melt"
  | "hydraulic_strut"
  | "jet_taxi_golden"
  | "lightning_bolt"
  | "molecule_cluster"
  | "planet_globe"
  | "gear_mechanism"
  | "hero_pedestal";

export type AutoHostExpr = "curious" | "shock" | "think" | "smile" | "explain";
export type AutoHostPose = "idle" | "point" | "wave" | "brace" | "thumbs_up";
export type AutoHostAccessory = "none" | "earmuffs" | "glasses" | "helmet";

export type AutoComicFx =
  | "speedlines"
  | "question_mark"
  | "cross_explosion"
  | "smoke_puffs"
  | "sparkles"
  | "arrows_radial"
  | "pressure_arrows"
  | "heat_waves"
  | "shield_aura"
  | "shockwave";

export interface AutoHostConfig {
  visible: boolean;
  x: number;
  z: number;
  expr: AutoHostExpr;
  pose: AutoHostPose;
  accessory?: AutoHostAccessory;
  mirror?: boolean;
}

export interface AutoSceneItem {
  id: number;
  sceneKey?: string;
  beat: "opening" | "development" | "resolution";
  a: number; // start frame (inclusive)
  b: number; // end frame (exclusive)
  lightMode: AutoLightMode;
  envTheme?: AutoEnvTheme;
  cameraAngle: AutoCameraAngle;
  cameraMotion?: AutoCameraMotion;
  heroProp: AutoHeroProp;
  host: AutoHostConfig;
  comicFx?: AutoComicFx[];
  onScreenLabel?: string | null;
  kickAtStart?: boolean;
  flashAtStart?: boolean;
  accentColor?: string;
}

export interface AutoScenePlan {
  schemaVersion: string;
  slug: string;
  title: string;
  fps: number;
  totalFrames: number;
  durationSec: number;
  defaultEnvTheme: AutoEnvTheme;
  scenes: AutoSceneItem[];
}

export interface AutoEpisodeInputProps {
  scenePlan?: AutoScenePlan;
  audioFile?: string;
  renderMode?: "draft" | "look" | "final";
}
