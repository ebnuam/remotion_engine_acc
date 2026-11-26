// Proof-of-Look Composition for Episode 002 (Serial Badak Jawa — Jalur 3C)
// 150 frames @ 30 FPS (1080x1920), 5 representative shots (30 frames each):
//   Frame   0..29  (keyframe f10):  POL-1 Establishing Hutan Ujung Kulon (Full PBR 3D)
//   Frame  30..59  (keyframe f40):  POL-2 Close-Up Badak Jawa (Jalur 3C PBR + Normal/Roughness)
//   Frame  60..89  (keyframe f70):  POL-3 Badak dalam Habitat 3-Layer Depth + Hairline Taxonomy
//   Frame  90..119 (keyframe f100): POL-4 Peta & Data Populasi Editorial (Pure 2D, NO ThreeCanvas)
//   Frame 120..149 (keyframe f130): POL-5 Ancaman Populasi Tunggal (3D Humid Overcast + Telemetry)

import React, { useCallback } from "react";
import { useCurrentFrame } from "remotion";
import { StageDoc3D } from "../../shared/doc3d/StageDoc3D";
import { PolShotId, RainforestWorld } from "./world/RainforestWorld";
import {
  Pol1HeaderOverlay,
  Pol2CloseupOverlay,
  Pol3TaxonomyOverlay,
  Pol4PopulationMapView,
  Pol5ThreatOverlay,
} from "./editorial/EditorialViews";

export const EP002_POL_FRAMES = 150;

function shotIndexAt(frame: number): 1 | 2 | 3 | 4 | 5 {
  if (frame < 30) return 1;
  if (frame < 60) return 2;
  if (frame < 90) return 3;
  if (frame < 120) return 4;
  return 5;
}

function resolve3DShot(frame: number): PolShotId {
  const idx = shotIndexAt(frame);
  if (idx === 1) return "pol1_forest";
  if (idx === 2) return "pol2_closeup";
  if (idx === 3) return "pol3_habitat";
  return "pol5_threat";
}

export const ProofOfLook: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = shotIndexAt(frame);
  const use3D = idx !== 4; // POL-4 is pure 2D editorial cartography & data (no WebGL overhead!)
  const createWorld = useCallback(() => new RainforestWorld(resolve3DShot), []);

  const localProgress = (frame % 30) / 29;
  const bgHex = idx === 4 ? "#ECE8DF" : idx === 5 ? "#A6B6B4" : "#BCCAC2";

  return (
    <StageDoc3D
      use3D={use3D}
      createWorld={use3D ? createWorld : undefined}
      backgroundHex={bgHex}
      grainOpacity={idx === 4 ? 0.015 : 0.03}
      vignetteStrength={idx === 4 ? 0 : idx === 5 ? 0.24 : 0.18}
      renderOverlay={() => {
        if (idx === 1) return <Pol1HeaderOverlay progress={localProgress} />;
        if (idx === 2) return <Pol2CloseupOverlay />;
        if (idx === 3) return <Pol3TaxonomyOverlay />;
        if (idx === 4) return <Pol4PopulationMapView progress={localProgress} />;
        return <Pol5ThreatOverlay />;
      }}
    />
  );
};
