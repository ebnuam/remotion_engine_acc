// Master Production Composition — Episode 002: Mengapa Badak Jawa Terancam Punah? (Bagian 1/4)
// Format: 1080x1920 @ 30 FPS | 2840 frames (94.67s)
// Audio: 100% intact slice (00:00.00–01:32.15, f0..f2765) of public/episodes/episode002_badak_jawa/voiceover.mp3
// Visual Approach: Jalur 3C (Isolated StageDoc3D Full PBR 3D + Mature 2D Editorial Cartography & Data)

import React, { useCallback } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { StageDoc3D } from "../../shared/doc3d/StageDoc3D";
import { Episode002OverlayRouter } from "./editorial/EditorialShots";
import { EP002_TOTAL_FRAMES, EP002_VO_END_FRAME, Ep002ShotId, getShotAtFrame } from "./story";
import { DocShotQuery, PolShotId, RainforestWorld } from "./world/RainforestWorld";

export { EP002_TOTAL_FRAMES };

function mapShotToWorldId(id: Ep002ShotId): PolShotId {
  switch (id) {
    case "S01":
      return "pol1_forest";
    case "S04":
      return "s04_floor";
    case "S06":
      return "pol2_closeup";
    case "S08":
      return "pol3_habitat";
    case "S12":
      return "s12_coastal";
    case "S15":
    default:
      return "pol5_threat";
  }
}

function resolve3DState(frame: number): DocShotQuery {
  const shot = getShotAtFrame(frame);
  const len = Math.max(1, shot.end - shot.start);
  const progress = Math.min(1, Math.max(0, (frame - shot.start) / len));
  return {
    shotId: mapShotToWorldId(shot.id),
    progress,
  };
}

export const Episode002: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = getShotAtFrame(frame);
  const use3D = shot.kind === "3d";

  const localFrame = frame - shot.start;
  const shotLen = Math.max(1, shot.end - shot.start);
  const progress = Math.min(1, Math.max(0, localFrame / shotLen));

  const createWorld = useCallback(() => new RainforestWorld(resolve3DState), []);

  const bgHex =
    shot.kind === "2d"
      ? shot.id === "S17"
        ? "#101813"
        : "#ECE8DF"
      : shot.id === "S15"
        ? "#A6B6B4"
        : "#BCCAC2";

  // Smooth documentary dissolve veil at scene boundaries (avoids double ThreeCanvas overhead)
  let veilOpacity = 0;
  if (shot.fadeInFrames > 0 && localFrame < shot.fadeInFrames) {
    veilOpacity = Math.max(
      veilOpacity,
      interpolate(localFrame, [0, shot.fadeInFrames], [0.85, 0], { extrapolateRight: "clamp" })
    );
  }
  const framesToEnd = shot.end - frame;
  if (shot.fadeOutFrames > 0 && framesToEnd <= shot.fadeOutFrames) {
    veilOpacity = Math.max(
      veilOpacity,
      interpolate(framesToEnd, [0, shot.fadeOutFrames], [shot.id === "S17" ? 1 : 0.85, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }

  return (
    <AbsoluteFill style={{ background: bgHex, overflow: "hidden" }}>
      {/* Original Neutral Voiceover Slice 00:00.00–01:32.15 (100% Untouched Source File) */}
      <Audio
        src={staticFile("episodes/episode002_badak_jawa/voiceover.mp3")}
        trimBefore={0}
        trimAfter={EP002_VO_END_FRAME}
        volume={(f) =>
          f <= EP002_VO_END_FRAME - 10 ? 1 : Math.max(0, (EP002_VO_END_FRAME - f) / 10)
        }
      />

      <StageDoc3D
        use3D={use3D}
        createWorld={use3D ? createWorld : undefined}
        backgroundHex={bgHex}
        grainOpacity={shot.kind === "2d" ? 0.014 : 0.028}
        vignetteStrength={shot.kind === "2d" ? 0 : shot.id === "S15" ? 0.24 : 0.18}
        renderOverlay={() => <Episode002OverlayRouter shotId={shot.id} progress={progress} />}
      />

      {veilOpacity > 0.005 ? (
        <AbsoluteFill
          style={{
            background: shot.veilBg,
            opacity: veilOpacity,
            pointerEvents: "none",
            zIndex: 60,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
