import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../theme";
import { OrganicRhino, RhinoHeadCloseup } from "./OrganicRhino";
import { SoilCrossSection } from "./SoilCrossSection";
import { CalloutLeader } from "./CalloutLeader";
import { ForegroundFoliage } from "./SkyAndParallax";

interface Scene1HookProps {
  frame: number;
  localFrame: number;
  progress: number;
  shotId: number;
  parallaxX: number;
}

/**
 * Scene 1: Hook [0, 492) — 7 Genuinely Distinct Framings & Viewpoints!
 * - Shot 1: High Aerial Bird's-Eye Jungle Canopy & Coastal River
 * - Shot 2: Ground Cross-Section + Rhino Walk + Herd Count Visual
 * - Shot 3: Macro Head Close-Up + Floating Relocation Portal
 * - Shot 4: Top-Down Stylized Coastline Trajectory Blueprint
 * - Shot 5: Conservationists Council Forming Red Scientific Stop Barrier
 * - Shot 6: Alert Rhino Close-Up + Impact Stamp "DITOLAK KERAS!"
 * - Shot 7: Hero Portrait Close-Up ("LHO, KOK ISO YO?")
 */
export const Scene1Hook: React.FC<Scene1HookProps> = ({
  frame,
  progress,
  shotId,
  parallaxX,
}) => {
  const { fps } = useVideoConfig();
  const treeSway = Math.sin(frame * 0.045) * 2.2;
  const stampSpring = spring({
    frame: Math.max(0, frame - 372),
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  // =========================================================================
  // SHOT 1 [0, 78): AERIAL BIRD'S-EYE FOREST CANOPY & WINDING RIVER
  // =========================================================================
  if (shotId === 1) {
    const glideY = interpolate(progress, [0, 1], [-30, 35]);
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Sunlit Forest Valley Floor */}
          <path d="M 0 360 Q 540 280 1080 350 L 1080 1920 L 0 1920 Z" fill="#15803D" />
          {/* Winding Turquoise River / Clearing */}
          <path
            d={`M -40 ${620 + glideY * 0.5} Q 340 ${540 + glideY} 580 ${690 + glideY} T 1120 ${630 + glideY}`}
            stroke="#38BDF8"
            strokeWidth="75"
            fill="none"
            opacity="0.82"
          />
          {/* Sunlit Clearing Trail */}
          <path
            d="M 140 880 Q 480 810 890 890"
            stroke="#A16207"
            strokeWidth="55"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />

          {/* Layered Aerial Tree Canopy Crowns */}
          <g transform={`translate(0, ${glideY})`}>
            {[
              [140, 460, 105, "#22C55E"],
              [340, 420, 120, "#16A34A"],
              [590, 445, 115, "#22C55E"],
              [840, 415, 130, "#16A34A"],
              [990, 510, 110, "#4ADE80"],
              [110, 720, 118, "#16A34A"],
              [940, 760, 122, "#22C55E"],
              [220, 1020, 135, "#15803D"],
              [560, 1060, 125, "#16A34A"],
              [870, 1010, 130, "#22C55E"],
            ].map(([cx, cy, r, col], idx) => (
              <g key={idx} transform={`translate(${cx}, ${cy})`}>
                <circle cx="8" cy="12" r={Number(r)} fill="#0F172A" opacity="0.2" />
                <circle cx="0" cy="0" r={Number(r)} fill={String(col)} stroke={THEME.ink} strokeWidth="4" />
                <circle cx={-Number(r) * 0.25} cy={-Number(r) * 0.25} r={Number(r) * 0.45} fill="#86EFAC" opacity="0.4" />
              </g>
            ))}
          </g>

          <CalloutLeader
            ax={540}
            ay={865}
            bx={625}
            by={380}
            lx={650}
            ly={380}
            label="TN UJUNG KULON"
            sublabel="BANTEN — HABITAT TERAKHIR"
            accent={THEME.accent.success}
            progress={progress}
            align="left"
            pillWidth={320}
          />
        </svg>

        {/* Small Rhino spotted walking along clearing below */}
        <div style={{ position: "absolute", top: 750 + glideY * 0.4, left: 380 + progress * 80, zIndex: 20 }}>
          <OrganicRhino frame={frame} scale={0.44} walkSpeed={1.0} pose="walk" flipX />
        </div>
      </div>
    );
  }

  // =========================================================================
  // SHOT 3 [156, 234): MACRO HEAD CLOSE-UP + RELOCATION PORTAL
  // =========================================================================
  if (shotId === 3) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Sunlit Forest Backdrop */}
          <path d="M 0 740 Q 320 620 680 710 T 1080 680 L 1080 1020 L 0 1020 Z" fill="#4ADE80" opacity="0.55" />
          {/* Relocation Dashed Arc */}
          <path
            d="M 480 650 Q 650 420 845 450"
            stroke={THEME.accent.warning}
            strokeWidth="8"
            strokeDasharray="16 10"
            strokeDashoffset={-frame * 5}
            fill="none"
          />
          <polygon points="866,456 828,434 834,474" fill={THEME.accent.warning} stroke={THEME.ink} strokeWidth="2.5" />

          {/* Floating Destination Island Portal */}
          <g transform="translate(860, 470)">
            <circle cx="0" cy="0" r="108" fill="#FFFDF7" stroke={THEME.accent.warning} strokeWidth="6" />
            <path d="M -70 25 Q -20 -25 30 10 Q 65 -15 80 20 L 75 55 Q 0 85 -70 50 Z" fill="#4ADE80" stroke={THEME.ink} strokeWidth="3" />
            <text x="0" y="-26" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="24" fill={THEME.accent.warning}>
              PINDAH KE
            </text>
            <text x="0" y="6" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="22" fill={THEME.ink}>
              TEMPAT BARU?
            </text>
          </g>
        </svg>

        {/* Expressive Macro Close-up of Rhino Head */}
        <div style={{ position: "absolute", top: 530, left: 40, zIndex: 20 }}>
          <RhinoHeadCloseup frame={frame} scale={0.98} pose="curious" flipX />
        </div>

        <SoilCrossSection frame={frame} parallaxX={parallaxX} />
        <ForegroundFoliage frame={frame} parallaxX={parallaxX} side="right" />
      </div>
    );
  }

  // =========================================================================
  // SHOT 4 [234, 306): TOP-DOWN COASTAL TRAJECTORY BLUEPRINT
  // =========================================================================
  if (shotId === 4) {
    const moveT = interpolate(progress, [0, 1], [0.15, 0.85]);
    const dotX = interpolate(moveT, [0, 1], [220, 860]);
    const dotY = interpolate(moveT, [0, 0.5, 1], [720, 560, 620]);

    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #CBEAFF 0%, #7DD3FC 100%)" }} />
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Stylized Top-Down Ujung Kulon Peninsula -> Unknown East */}
          <path
            d="M 110 740 Q 90 670 160 630 Q 250 580 350 615 Q 410 660 390 730 Q 320 790 210 785 Z"
            fill="#22C55E"
            stroke={THEME.ink}
            strokeWidth="5"
          />
          {/* Dotted New Location Silhouette on East */}
          <path
            d="M 790 595 Q 860 540 945 575 Q 995 620 960 675 Q 885 710 810 670 Z"
            fill="#FEF3C7"
            stroke={THEME.accent.warning}
            strokeWidth="5"
            strokeDasharray="14 10"
          />
          <path
            d="M 240 695 Q 540 500 865 625"
            stroke={THEME.accent.warning}
            strokeWidth="8"
            strokeDasharray="16 10"
            strokeDashoffset={-frame * 6}
            fill="none"
          />
          <circle cx={dotX} cy={dotY} r="16" fill={THEME.accent.warning} stroke="#FFFFFF" strokeWidth="4" />

          <CalloutLeader
            ax={235}
            ay={695}
            bx={240}
            by={440}
            lx={270}
            ly={440}
            label="UJUNG KULON"
            accent={THEME.accent.success}
            progress={1}
            align="center"
            pillWidth={260}
          />
          <CalloutLeader
            ax={880}
            ay={625}
            bx={835}
            by={440}
            lx={810}
            ly={440}
            label="LOKASI BARU?"
            sublabel="WACANA PEMINDAHAN"
            accent={THEME.accent.warning}
            progress={progress}
            align="center"
            pillWidth={290}
          />
        </svg>
      </div>
    );
  }

  // =========================================================================
  // SHOT 5 [306, 372): SCIENTIST & CONSERVATIONIST COUNCIL BARRIER
  // =========================================================================
  if (shotId === 5) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          {/* Sunlit Backdrop */}
          <path d="M 0 760 Q 340 640 680 730 T 1080 700 L 1080 980 L 0 980 Z" fill="#86EFAC" opacity="0.5" />

          {/* 3 Stylized Scientist / Ranger Figures Forming Protective Front */}
          {[320, 540, 760].map((sx, idx) => (
            <g key={idx} transform={`translate(${sx}, ${790 + (idx === 1 ? -15 : 0)})`}>
              <circle cx="0" cy="-120" r="38" fill={idx === 1 ? "#0284C7" : "#15803D"} stroke={THEME.ink} strokeWidth="4.5" />
              <path
                d="M -52 -65 Q 0 -80 52 -65 L 62 190 L -62 190 Z"
                fill={idx === 1 ? "#0369A1" : "#166534"}
                stroke={THEME.ink}
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              {/* Clipboard / Stop Hand Gesture */}
              <rect x="-26" y="-25" width="52" height="68" rx="8" fill="#FFFDF7" stroke={THEME.ink} strokeWidth="3.5" />
            </g>
          ))}

          {/* Bold Red Scientific Stop Shield in Front */}
          <g transform={`translate(540, 495) scale(${0.88 + progress * 0.14})`}>
            <circle cx="0" cy="0" r="95" fill="#FEE2E2" stroke={THEME.accent.danger} strokeWidth="8" />
            <line x1="-42" y1="-42" x2="42" y2="42" stroke={THEME.accent.danger} strokeWidth="16" strokeLinecap="round" />
            <line x1="42" y1="-42" x2="-42" y2="42" stroke={THEME.accent.danger} strokeWidth="16" strokeLinecap="round" />
          </g>

          <CalloutLeader
            ax={540}
            ay={395}
            bx={540}
            by={335}
            lx={540}
            ly={335}
            label="ILMUWAN & AKTIVIS MENOLAK"
            accent={THEME.accent.danger}
            progress={progress}
            align="center"
            pillWidth={410}
          />
        </svg>

        <SoilCrossSection frame={frame} parallaxX={parallaxX} />
      </div>
    );
  }

  // =========================================================================
  // SHOT 6 & 7 [372, 492): MACRO ALERT + "DITOLAK KERAS!" -> HERO "KOK ISO YO?"
  // =========================================================================
  if (shotId === 6 || shotId === 7) {
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
          <path d="M 0 740 Q 340 620 680 710 T 1080 680 L 1080 1020 L 0 1020 Z" fill="#4ADE80" opacity="0.5" />

          {shotId === 6 && (
            <g transform={`translate(540, 420) rotate(-6) scale(${0.8 + 0.22 * stampSpring})`}>
              <rect x="-235" y="-48" width="470" height="96" rx="20" fill={THEME.accent.danger} stroke="#FFFFFF" strokeWidth="6" />
              <text x="0" y="15" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="44" fill="#FFFFFF" letterSpacing="2">
                DITOLAK KERAS!
              </text>
            </g>
          )}

          {shotId === 7 && (
            <g>
              {[
                { x: 250, y: 470 - progress * 35, s: 1.0, rot: -12 },
                { x: 380, y: 390 - progress * 45, s: 1.35, rot: 8 },
                { x: 315, y: 340 - progress * 25, s: 0.9, rot: -5 },
              ].map((q, idx) => (
                <g key={idx} transform={`translate(${q.x}, ${q.y}) rotate(${q.rot}) scale(${q.s})`}>
                  <circle cx="0" cy="0" r="36" fill="#FFFDF7" stroke={THEME.accent.info} strokeWidth="4.5" />
                  <text x="0" y="15" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="46" fill={THEME.accent.info}>
                    ?
                  </text>
                </g>
              ))}
            </g>
          )}
        </svg>

        {/* Centered Hero Portrait Close-Up */}
        <div style={{ position: "absolute", top: 530, left: 260, zIndex: 20 }}>
          <RhinoHeadCloseup frame={frame} scale={1.0} pose={shotId === 6 ? "alert" : "curious"} />
        </div>

        <SoilCrossSection frame={frame} parallaxX={parallaxX} />
        <ForegroundFoliage frame={frame} parallaxX={parallaxX} />
      </div>
    );
  }

  // =========================================================================
  // SHOT 2 [78, 156): GROUND CROSS-SECTION + HERD COUNT < 80 EKOR
  // =========================================================================
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <svg
        viewBox="0 0 1080 760"
        preserveAspectRatio="none"
        style={{ position: "absolute", bottom: 935, left: 0, width: 1080, height: 760, overflow: "visible" }}
      >
        <g transform={`translate(${parallaxX * 0.4}, 0)`}>
          <path d="M -80 510 Q 210 370 480 450 Q 730 510 960 390 Q 1080 340 1160 420 L 1160 760 L -80 760 Z" fill="#4ADE80" opacity="0.6" />
        </g>
        <g transform={`translate(${parallaxX * 0.65}, 0)`}>
          {[90, 290, 680, 910].map((tx, i) => (
            <g key={i} transform={`translate(${tx}, 750) rotate(${treeSway * (i % 2 === 0 ? 1 : -0.8)}, 0, 0)`}>
              <path d="M -12 0 Q -6 -130 -10 -255 L 10 -255 Q 6 -130 14 0 Z" fill="#78350F" stroke={THEME.ink} strokeWidth="3" />
              <ellipse cx="0" cy="-270" rx="82" ry="68" fill="#16A34A" stroke={THEME.ink} strokeWidth="3.5" />
              <ellipse cx="-16" cy="-286" rx="45" ry="38" fill="#4ADE80" opacity="0.45" />
            </g>
          ))}
        </g>
      </svg>

      <SoilCrossSection frame={frame} parallaxX={parallaxX} showDepthMarkers progress={1} />

      <div style={{ position: "absolute", bottom: 912, left: "50%", transform: `translateX(${-270 + (progress - 0.5) * 40}px)`, zIndex: 20 }}>
        <OrganicRhino frame={frame} scale={0.86} walkSpeed={1.0} pose="walk" />
      </div>

      {/* Herd Count Callout */}
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: 1080, height: 1920, zIndex: 25, pointerEvents: "none" }}>
        <CalloutLeader
          ax={420}
          ay={720}
          bx={280}
          by={410}
          lx={260}
          ly={410}
          label="TERSISA PULUHAN EKOR"
          sublabel="POPULASI < 80 DI DUNIA"
          accent={THEME.accent.amber}
          progress={progress}
          align="center"
          pillWidth={370}
        />
      </svg>

      <ForegroundFoliage frame={frame} parallaxX={parallaxX} />
    </div>
  );
};
