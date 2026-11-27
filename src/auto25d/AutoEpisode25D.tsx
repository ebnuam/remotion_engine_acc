// Automated 2.5D-in-3D Remotion Episode Component (Kok Iso Yo?)
// Reuses frozen src/shared/kokisoyo25d/Stage25D.tsx untouched while adding:
// - Data-driven scene plan (100% synced to actual TTS/mix duration)
// - Minimal high-contrast diegetic SVG info pill (ONLY onScreenLabel, ZERO subtitles)
// - Dynamic cobalt-blue night lighting override inside AutoWorld25D

import React, { useMemo } from "react";
import { getInputProps, staticFile } from "remotion";
import {
  DofEntry,
  RenderQualityMode,
  Stage25D,
  StageShotMeta,
  V3,
} from "../shared/kokisoyo25d";
import type { AutoEpisodeInputProps, AutoScenePlan } from "./types";
import { AutoWorld25D } from "./worldBuilder";

export const DEFAULT_DEMO_PLAN: AutoScenePlan = {
  schemaVersion: "1.0.0",
  slug: "demo_auto25d",
  title: "Kok Iso Yo? Auto 2.5D-in-3D Demo",
  fps: 30,
  totalFrames: 180,
  durationSec: 6,
  defaultEnvTheme: "runway",
  scenes: [
    {
      id: 1,
      beat: "opening",
      a: 0,
      b: 60,
      lightMode: "day",
      envTheme: "runway",
      cameraAngle: "low_angle",
      cameraMotion: "push_in",
      heroProp: "jet_landing",
      host: { visible: true, x: -1.8, z: 0.9, expr: "shock", pose: "brace", accessory: "earmuffs" },
      comicFx: ["question_mark"],
      onScreenLabel: null,
      kickAtStart: true,
    },
    {
      id: 2,
      beat: "development",
      a: 60,
      b: 120,
      lightMode: "night",
      envTheme: "lab_blueprint",
      cameraAngle: "close_up",
      cameraMotion: "orbit",
      heroProp: "tire_cutaway_layers",
      host: { visible: true, x: -1.9, z: 0.6, expr: "explain", pose: "point", accessory: "glasses" },
      comicFx: ["pressure_arrows"],
      onScreenLabel: "LAPISAN NILON & BAJA",
      flashAtStart: true,
    },
    {
      id: 3,
      beat: "resolution",
      a: 120,
      b: 180,
      lightMode: "golden",
      envTheme: "runway",
      cameraAngle: "medium",
      cameraMotion: "push_in",
      heroProp: "jet_taxi_golden",
      host: { visible: true, x: -1.6, z: 1.0, expr: "smile", pose: "thumbs_up", accessory: "earmuffs" },
      comicFx: ["sparkles"],
      onScreenLabel: "KOK ISO YO?",
    },
  ],
};

const MinimalDiegeticLabel: React.FC<{ label?: string | null; lightMode?: string }> = ({
  label,
}) => {
  const clean = String(label || "").trim();
  if (!clean) return null;

  const pillW = Math.min(820, Math.max(420, clean.length * 22 + 110));
  const halfW = pillW / 2;

  return (
    <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
      <g transform="translate(540, 175)">
        <rect
          x={-halfW + 6}
          y={-36 + 6}
          width={pillW}
          height={74}
          rx={37}
          fill="#0f172a"
          opacity={0.22}
        />
        <rect
          x={-halfW}
          y={-36}
          width={pillW}
          height={74}
          rx={37}
          fill="#FFFDF7"
          stroke="#0F172A"
          strokeWidth={6}
        />
        <text
          x="0"
          y="11"
          textAnchor="middle"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
          fontWeight="900"
          fontSize="31"
          letterSpacing="1.1"
          fill="#0F172A"
        >
          {clean.toUpperCase()}
        </text>
      </g>
    </svg>
  );
};

export const AutoEpisode25D: React.FC<AutoEpisodeInputProps> = (props) => {
  const input = getInputProps() as AutoEpisodeInputProps;
  const plan: AutoScenePlan = props.scenePlan || input.scenePlan || DEFAULT_DEMO_PLAN;
  const audioFile = props.audioFile ?? input.audioFile ?? "";
  const renderMode: RenderQualityMode = props.renderMode ?? input.renderMode ?? "look";

  const stageMeta = useMemo(() => {
    const shots: StageShotMeta[] = plan.scenes.map((s) => ({
      id: s.id,
      a: s.a,
      b: s.b,
      // Stage25D lights.ts supports "day" | "golden"; AutoWorld25D applies custom cobalt "night" override
      light: s.lightMode === "golden" ? "golden" : "day",
    }));

    const xfade: Record<number, number> = {};
    let flashAt = -1;
    const dofTable: DofEntry[] = [];

    for (let i = 0; i < plan.scenes.length; i++) {
      const s = plan.scenes[i];
      const prev = i > 0 ? plan.scenes[i - 1] : null;
      if (s.flashAtStart && flashAt < 0) {
        flashAt = s.a;
      } else if (prev && prev.lightMode !== s.lightMode) {
        xfade[s.id] = 6;
      }

      const isClose = s.cameraAngle === "close_up" || s.cameraAngle === "extreme_close_up";
      dofTable.push({
        f: s.a,
        dur: 12,
        cInf: isClose ? 10 : 0,
        focus: isClose ? (): V3 => [0, 1.75, 0] : undefined,
      });
    }

    return { shots, xfade, flashAt, dofTable };
  }, [plan]);

  return (
    <Stage25D
      shots={stageMeta.shots}
      xfade={stageMeta.xfade}
      flashAt={stageMeta.flashAt}
      dofTable={stageMeta.dofTable}
      createWorld={() => new AutoWorld25D(plan)}
      audioSrc={audioFile ? staticFile(audioFile) : undefined}
      renderMode={renderMode}
      renderInfoOverlay={(_frame, shotId) => {
        const scene = plan.scenes.find((s) => s.id === shotId);
        return (
          <MinimalDiegeticLabel label={scene?.onScreenLabel} lightMode={scene?.lightMode} />
        );
      }}
    />
  );
};
