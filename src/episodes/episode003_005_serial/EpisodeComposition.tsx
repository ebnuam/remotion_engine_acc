// Shared Composition Engine for Episodes 003, 004, and 005 (Serial Badak Jawa — Jalur 3C)
// Reuses isolated StageDoc3D PBR pipeline + non-destructive sliced audio from voiceover.mp3.

import React, { useCallback } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { StageDoc3D } from "../../shared/doc3d/StageDoc3D";
import { Ep003ShotRouter } from "./editorial/Ep003Views";
import { Ep004ShotRouter } from "./editorial/Ep004Views";
import { Ep005ShotRouter } from "./editorial/Ep005Views";
import {
  BRIDGE_OPEN_FRAMES,
  EP003_AUDIO,
  EP003_SHOTS,
  EP004_AUDIO,
  EP004_SHOTS,
  EP005_AUDIO,
  EP005_SHOTS,
  EpisodeAudioSlice,
  SeriesShot,
  getSeriesShotAtFrame,
} from "./seriesStory";
import { SeriesWorld, SeriesWorldQuery } from "./world/SeriesWorld";

interface GenericEpisodeProps {
  episodeNum: 3 | 4 | 5;
  shots: SeriesShot[];
  audio: EpisodeAudioSlice;
}

const GenericSeriesEpisode: React.FC<GenericEpisodeProps> = ({ episodeNum, shots, audio }) => {
  const frame = useCurrentFrame();
  const shot = getSeriesShotAtFrame(shots, frame);
  const use3D = shot.kind === "3d";

  const localFrame = frame - shot.start;
  const shotLen = Math.max(1, shot.end - shot.start);
  const progress = Math.min(1, Math.max(0, localFrame / shotLen));

  const query3D = useCallback(
    (f: number): SeriesWorldQuery => {
      const s = getSeriesShotAtFrame(shots, f);
      const len = Math.max(1, s.end - s.start);
      return {
        mode: s.sceneMode ?? "ep3_habitat_alert",
        progress: Math.min(1, Math.max(0, (f - s.start) / len)),
      };
    },
    [shots]
  );

  const createWorld = useCallback(() => new SeriesWorld(query3D), [query3D]);

  const isDarkBridge = shot.num === 1 || shot.num === shots.length;
  const bgHex =
    shot.kind === "2d"
      ? isDarkBridge
        ? "#101813"
        : "#ECE8DF"
      : shot.sceneMode === "ep3_mist_sensitive" || shot.sceneMode === "ep5_langkap_shade"
        ? "#A4B4B2"
        : "#BCCAC2";

  // Monotonic [0, N] fade-in / fade-out veil (avoids Remotion non-monotonic inputRange error)
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
      interpolate(framesToEnd, [0, shot.fadeOutFrames], [shot.num === shots.length ? 1 : 0.85, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }

  return (
    <AbsoluteFill style={{ background: bgHex, overflow: "hidden" }}>
      {/* Non-destructive VO slice delayed cleanly after 2.0s opening title card */}
      <Sequence from={BRIDGE_OPEN_FRAMES} durationInFrames={audio.voFrames}>
        <Audio
          src={staticFile("episodes/episode002_badak_jawa/voiceover.mp3")}
          trimBefore={audio.trimBefore}
          trimAfter={audio.trimAfter}
          volume={(localF) => {
            if (localF < 6) return localF / 6;
            const rem = audio.voFrames - localF;
            if (rem < 8) return Math.max(0, rem / 8);
            return 1;
          }}
        />
      </Sequence>

      <StageDoc3D
        use3D={use3D}
        createWorld={use3D ? createWorld : undefined}
        backgroundHex={bgHex}
        grainOpacity={shot.kind === "2d" ? 0.014 : 0.028}
        vignetteStrength={shot.kind === "2d" ? 0 : 0.19}
        renderOverlay={() => {
          if (episodeNum === 3) return <Ep003ShotRouter shotId={shot.id} progress={progress} />;
          if (episodeNum === 4) return <Ep004ShotRouter shotId={shot.id} progress={progress} />;
          return <Ep005ShotRouter shotId={shot.id} progress={progress} />;
        }}
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

export const Episode003: React.FC = () => (
  <GenericSeriesEpisode episodeNum={3} shots={EP003_SHOTS} audio={EP003_AUDIO} />
);

export const Episode004: React.FC = () => (
  <GenericSeriesEpisode episodeNum={4} shots={EP004_SHOTS} audio={EP004_AUDIO} />
);

export const Episode005: React.FC = () => (
  <GenericSeriesEpisode episodeNum={5} shots={EP005_SHOTS} audio={EP005_AUDIO} />
);
