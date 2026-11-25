import React from "react";
import { Composition } from "remotion";
import { PocScene } from "./PocScene";
import { FPS, TOTAL } from "./story";

export const PocRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PocStage6"
        component={PocScene}
        durationInFrames={TOTAL}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ renderMode: "look" as const }}
      />
      <Composition
        id="PocStage6-Preview"
        component={PocScene}
        durationInFrames={TOTAL}
        fps={FPS}
        width={540}
        height={960}
        defaultProps={{ renderMode: "draft" as const }}
      />
    </>
  );
};
