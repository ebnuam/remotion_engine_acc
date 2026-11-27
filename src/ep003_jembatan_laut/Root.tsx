import React from "react";
import { Composition } from "remotion";
import { EP003_FRAMES, JembatanLautShort } from "./JembatanLautShort";
import { FPS } from "./story";

export const Ep003Root: React.FC = () => {
  return (
    <>
      <Composition
        id="JembatanLautShort"
        component={JembatanLautShort}
        durationInFrames={EP003_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          renderMode: "look" as const,
          audioFile: "episodes/ep003_jembatan_laut/audio_mix.m4a",
        }}
      />
      <Composition
        id="JembatanLautShort-Preview"
        component={JembatanLautShort}
        durationInFrames={EP003_FRAMES}
        fps={FPS}
        width={540}
        height={960}
        defaultProps={{
          renderMode: "look" as const,
          audioFile: "episodes/ep003_jembatan_laut/audio_mix.m4a",
        }}
      />
    </>
  );
};
