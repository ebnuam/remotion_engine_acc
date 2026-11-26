import React from "react";
import { Composition } from "remotion";
import { Episode003, Episode004, Episode005 } from "./EpisodeComposition";
import { EP003_AUDIO, EP004_AUDIO, EP005_AUDIO } from "./seriesStory";

export const Ep003to005Root: React.FC = () => (
  <>
    <Composition
      id="Ep003BadakJawa"
      component={Episode003}
      durationInFrames={EP003_AUDIO.totalFrames}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="Ep004BadakJawa"
      component={Episode004}
      durationInFrames={EP004_AUDIO.totalFrames}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="Ep005BadakJawa"
      component={Episode005}
      durationInFrames={EP005_AUDIO.totalFrames}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
