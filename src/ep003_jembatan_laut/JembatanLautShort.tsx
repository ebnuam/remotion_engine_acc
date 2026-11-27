// Episode 003: Gimana Cara Bangun Tiang Jembatan di Tengah Laut Dalam? (Cofferdam)
// Clean Stage25D composition with ToneMappingMode.NEUTRAL, ZERO floating cartoon banners,
// ZERO permanent subtitles, and ZERO emojis.

import React, { useCallback } from "react";
import { getInputProps, staticFile } from "remotion";
import { RenderQualityMode, Stage25D } from "../shared/kokisoyo25d";
import { DOF, FLASH_AT, SHOTS, TOTAL, XFADE } from "./story";
import { JembatanLautWorld } from "./world";

export const EP003_FRAMES = TOTAL;

export const JembatanLautShort: React.FC<{
  renderMode?: RenderQualityMode;
  audioFile?: string;
}> = ({ renderMode = "look", audioFile }) => {
  const inputAudio = (getInputProps() as { audioFile?: string }).audioFile;
  const resolvedAudio = audioFile || inputAudio || "";
  const createWorld = useCallback(() => new JembatanLautWorld(), []);

  return (
    <Stage25D
      shots={SHOTS}
      xfade={XFADE}
      flashAt={FLASH_AT}
      dofTable={DOF}
      createWorld={createWorld}
      audioSrc={resolvedAudio ? staticFile(resolvedAudio) : undefined}
      renderMode={renderMode}
    />
  );
};
