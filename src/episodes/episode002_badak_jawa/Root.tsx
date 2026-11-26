import React from "react";
import { Composition } from "remotion";
import { EP002_TOTAL_FRAMES, Episode002 } from "./Episode002";
import { EP002_POL_FRAMES, ProofOfLook } from "./ProofOfLook";

export const Ep002Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Ep002BadakJawa"
        component={Episode002}
        durationInFrames={EP002_TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Ep002BadakJawa-Preview"
        component={Episode002}
        durationInFrames={EP002_TOTAL_FRAMES}
        fps={30}
        width={540}
        height={960}
      />
      <Composition
        id="Ep002ProofOfLook"
        component={ProofOfLook}
        durationInFrames={EP002_POL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Ep002ProofOfLook-Preview"
        component={ProofOfLook}
        durationInFrames={EP002_POL_FRAMES}
        fps={30}
        width={540}
        height={960}
      />
    </>
  );
};
