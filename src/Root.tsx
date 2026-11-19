import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./bridge/Bridge";
import { ShipShort, SHIP_FRAMES } from "./ship/ShipShort";

export const Root: React.FC = () => {
  return (
    <>
      {/* 1. Master Composition (1080 x 1920 @ 30 FPS, 1800 frames = 60s) */}
      <Composition
        id="BridgeShort"
        component={BridgeShort}
        durationInFrames={BRIDGE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 2. Fast Preview Draft (540 x 960 @ 30 FPS) for fast VPS rendering checks */}
      <Composition
        id="BridgeShort-Preview"
        component={BridgeShort}
        durationInFrames={BRIDGE_FRAMES}
        fps={30}
        width={540}
        height={960}
      />

      {/* 3. Ship Proof Master Composition (1080 x 1920 @ 30 FPS, 360 frames = 12s) */}
      <Composition
        id="ShipProof"
        component={ShipShort}
        durationInFrames={SHIP_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 4. Ship Proof Fast Preview Draft (540 x 960 @ 30 FPS, 360 frames = 12s) */}
      <Composition
        id="ShipProof-Preview"
        component={ShipShort}
        durationInFrames={SHIP_FRAMES}
        fps={30}
        width={540}
        height={960}
      />
    </>
  );
};
