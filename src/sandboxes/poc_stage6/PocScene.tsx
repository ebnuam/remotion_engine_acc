// Stage 6 PoC Composition using Stage25D (ToneMappingMode.NEUTRAL + minimal SVG info overlay)

import React, { useCallback } from "react";
import { getInputProps, staticFile } from "remotion";
import { RenderQualityMode, Stage25D } from "../../shared/kokisoyo25d";
import { DOF, FLASH_AT, SHOTS, XFADE } from "./story";
import { PocWorld } from "./world";

const MinimalBotanyOverlay: React.FC<{ frame: number; shotId: number }> = ({ frame, shotId }) => {
  const shot = SHOTS.find((s) => s.id === shotId);
  if (!shot) return null;

  const progress = Math.min(1, Math.max(0, (frame - shot.a) / 14));
  const slideY = (1 - progress) * 14;

  return (
    <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
      {/* Top topic pill badge (minimal, no subtitle wall, no emojis) */}
      <g transform={`translate(540, ${190 + slideY})`} opacity={progress}>
        <rect
          x="-245"
          y="-36"
          width="490"
          height="72"
          rx="36"
          fill="#FFFDF7"
          stroke="#0F172A"
          strokeWidth="6"
        />
        <text
          x="0"
          y="12"
          textAnchor="middle"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
          fontWeight="900"
          fontSize="31"
          letterSpacing="1.4"
          fill="#0F172A"
        >
          {shot.label}
        </text>
      </g>

      {/* Compact spectrum diagram card on Shot 2 */}
      {shotId === 2 ? (
        <g transform={`translate(540, ${1595 + slideY})`} opacity={progress}>
          <rect
            x="-340"
            y="-72"
            width="680"
            height="144"
            rx="24"
            fill="rgba(255, 253, 247, 0.94)"
            stroke="#0F172A"
            strokeWidth="6"
          />
          {/* Absorbed bands */}
          <circle cx="-250" cy="-24" r="16" fill="#FB7185" stroke="#0F172A" strokeWidth="4" />
          <circle cx="-206" cy="-24" r="16" fill="#38BDF8" stroke="#0F172A" strokeWidth="4" />
          <text
            x="-170"
            y="-14"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
            fontWeight="800"
            fontSize="30"
            fill="#0F172A"
          >
            MERAH &amp; BIRU : DISERAP
          </text>
          {/* Reflected green band */}
          <circle cx="-228" cy="30" r="16" fill="#22C55E" stroke="#0F172A" strokeWidth="4" />
          <text
            x="-170"
            y="40"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
            fontWeight="800"
            fontSize="30"
            fill="#15803D"
          >
            HIJAU : DIPANTULKAN
          </text>
        </g>
      ) : null}
    </svg>
  );
};

export interface PocSceneProps {
  renderMode?: RenderQualityMode;
  audioFile?: string;
}

export const PocScene: React.FC<PocSceneProps> = ({ renderMode = "look", audioFile }) => {
  const input = getInputProps() as PocSceneProps;
  const resolvedMode = input.renderMode ?? renderMode;
  const resolvedAudio = input.audioFile ?? audioFile;
  const createWorld = useCallback(() => new PocWorld(), []);

  return (
    <Stage25D
      shots={SHOTS}
      xfade={XFADE}
      flashAt={FLASH_AT}
      dofTable={DOF}
      createWorld={createWorld}
      audioSrc={resolvedAudio ? staticFile(resolvedAudio) : undefined}
      renderMode={resolvedMode}
      renderInfoOverlay={(f, shotId) => <MinimalBotanyOverlay frame={f} shotId={shotId} />}
    />
  );
};
