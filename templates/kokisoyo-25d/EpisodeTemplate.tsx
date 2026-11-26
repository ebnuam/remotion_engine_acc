// Episode Composition Template (Kok Iso Yo? 2.5D-in-3D)
// - ToneMappingMode.NEUTRAL strictly enforced inside Stage25D
// - Minimal SVG diegetic label slot (no auto-subtitles, no Unicode emojis)

import React from "react";
import { getInputProps, staticFile } from "remotion";
import { RenderQualityMode, Stage25D } from "../../src/shared/kokisoyo25d";
import { DOF, FLASH_AT, SHOTS, TOTAL, XFADE } from "./story";
import { EpisodeWorld } from "./world";

export const EPISODE_FRAMES = TOTAL;

const MinimalInfoSlot: React.FC<{ shotId: number }> = ({ shotId }) => {
  const shot = SHOTS.find((s) => s.id === shotId);
  if (!shot?.label) return null;

  return (
    <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
      <g transform="translate(540, 210)">
        <rect
          x="-210"
          y="-34"
          width="420"
          height="68"
          rx="34"
          fill="#FFFDF7"
          stroke="#0F172A"
          strokeWidth="5"
        />
        <text
          x="0"
          y="11"
          textAnchor="middle"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
          fontWeight="900"
          fontSize="30"
          letterSpacing="1.2"
          fill="#0F172A"
        >
          {shot.label}
        </text>
      </g>
    </svg>
  );
};

export const EpisodeTemplate: React.FC<{
  renderMode?: RenderQualityMode;
  audioFile?: string;
}> = ({ renderMode = "look", audioFile }) => {
  const inputAudio = (getInputProps() as { audioFile?: string }).audioFile;
  const resolvedAudio = audioFile || inputAudio || "";

  return (
    <Stage25D
      shots={SHOTS}
      xfade={XFADE}
      flashAt={FLASH_AT}
      dofTable={DOF}
      createWorld={() => new EpisodeWorld()}
      audioSrc={resolvedAudio ? staticFile(resolvedAudio) : undefined}
      renderMode={renderMode}
      renderInfoOverlay={(_frame, shotId) => <MinimalInfoSlot shotId={shotId} />}
    />
  );
};
