// Standalone Remotion Root for Kok Iso Yo? Automated 2.5D-in-3D Engine (src/auto25d/).
// Leaves legacy src/Root.tsx completely untouched.

import React from "react";
import { Composition } from "remotion";
import { AutoEpisode25D, DEFAULT_DEMO_PLAN } from "./AutoEpisode25D";
import type { AutoEpisodeInputProps } from "./types";

const calcMeta = ({ props }: { props: AutoEpisodeInputProps }) => {
  const plan = props?.scenePlan ?? DEFAULT_DEMO_PLAN;
  const fps = Math.max(24, Math.min(60, Math.round(plan.fps || 30)));
  const durationInFrames = Math.max(30, Math.round(plan.totalFrames || 180));
  return { durationInFrames, fps };
};

export const AutoRoot: React.FC = () => {
  return (
    <>
      {/* Production 9:16 Vertical Shorts (1080x1920 @ 30 FPS) */}
      <Composition
        id="AutoEpisode25D"
        component={AutoEpisode25D}
        durationInFrames={DEFAULT_DEMO_PLAN.totalFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          scenePlan: DEFAULT_DEMO_PLAN,
          renderMode: "look",
        }}
        calculateMetadata={calcMeta}
      />

      {/* Fast VPS Preview / QA Draft (540x960 @ 30 FPS) */}
      <Composition
        id="AutoEpisode25D-Preview"
        component={AutoEpisode25D}
        durationInFrames={DEFAULT_DEMO_PLAN.totalFrames}
        fps={30}
        width={540}
        height={960}
        defaultProps={{
          scenePlan: DEFAULT_DEMO_PLAN,
          renderMode: "draft",
        }}
        calculateMetadata={calcMeta}
      />
    </>
  );
};
