import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./bridge/Bridge";
import { ShipShort, SHIP_EP1_FRAMES } from "./ship/ShipShort";
import { BadakEp2Short, BADAK_EP2_FRAMES } from "./ep2_badak/BadakEp2Short";
import { PrototypeScene } from "./ep2_badak/PrototypeScene";

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

      {/* 3. Ship Episode 1 Master Composition (1080 x 1920 @ 30 FPS, 2010 frames = 67s) */}
      <Composition
        id="ShipEp1"
        component={ShipShort}
        durationInFrames={SHIP_EP1_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 4. Ship Episode 1 Fast Preview Draft (540 x 960 @ 30 FPS, 2010 frames = 67s) */}
      <Composition
        id="ShipEp1-Preview"
        component={ShipShort}
        durationInFrames={SHIP_EP1_FRAMES}
        fps={30}
        width={540}
        height={960}
      />

      {/* 5. Badak Episode 2 Master Composition (1080 x 1920 @ 30 FPS, 3625 frames = 120.84s) */}
      <Composition
        id="BadakEp2"
        component={BadakEp2Short}
        durationInFrames={BADAK_EP2_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 6. Badak Episode 2 Fast Preview Draft (540 x 960 @ 30 FPS, 3625 frames = 120.84s) */}
      <Composition
        id="BadakEp2-Preview"
        component={BadakEp2Short}
        durationInFrames={BADAK_EP2_FRAMES}
        fps={30}
        width={540}
        height={960}
      />

      {/* 7. Badak Prototype (540 x 960 @ 30 FPS, 150 frames = 5s) */}
      <Composition
        id="BadakPrototype"
        component={PrototypeScene}
        durationInFrames={150}
        fps={30}
        width={540}
        height={960}
      />
    </>
  );
};
