// Shared Editorial Theme, Safe-Zone Typography & Cartographic Primitives — Episode 002
// Aesthetic: National Geographic Maps × Vox / DW Investigative Science Journalism
// Zero duplicated island geometry across Episode 002's 11 editorial/cartographic shots.

import React from "react";

export const FONT_SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const FONT_MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

export const COLORS = {
  paperBg: "#ECE8DF",
  paperGrid: "rgba(38, 46, 40, 0.09)",
  inkDark: "#141D18",
  inkMuted: "#47544D",
  forestAccent: "#1E4D32",
  oceanDeep: "#182E3B",
  oceanMid: "#132530",
  landBase: "#53685B",
  landStroke: "#98B0A0",
  javaHighlight: "#7A9176",
  javaStroke: "#D2DFCE",
  landHighlight: "#B8472A",
  alertRed: "#DC2626",
  alertAmber: "#B45309",
  gold: "#D8B982",
  goldLight: "#E8D5AE",
  ivory: "#F6F4EE",
  hairlineLight: "rgba(246, 244, 238, 0.28)",
  hairlineDark: "rgba(20, 29, 24, 0.22)",
};

export const EditorialPaperBackground: React.FC<{ idSuffix: string }> = ({ idSuffix }) => (
  <>
    <defs>
      <pattern id={`mapGrid_${idSuffix}`} width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke={COLORS.paperGrid} strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="1080" height="1920" fill={COLORS.paperBg} />
    <rect width="1080" height="1920" fill={`url(#mapGrid_${idSuffix})`} />
  </>
);

/** Reusable Indonesian Archipelago relief polygons inside a 944x620 cartographic viewport. */
export const ArchipelagoPolygons: React.FC = () => (
  <g fill={COLORS.landBase} stroke={COLORS.landStroke} strokeWidth="1.15" opacity="0.92">
    {/* Sumatra */}
    <path d="M 62,102 L 92,108 L 128,136 L 154,165 L 185,196 L 208,236 L 238,266 L 265,305 L 292,344 L 294,376 L 274,394 L 252,374 L 222,338 L 194,298 L 164,256 L 136,216 L 104,174 L 74,136 Z" />
    {/* Bangka & Belitung */}
    <path d="M 294,284 L 316,294 L 310,312 L 290,302 Z" />
    <path d="M 326,304 L 340,308 L 336,320 L 322,316 Z" />
    {/* Java (highlighted) */}
    <path
      d="M 304,404 L 326,400 L 362,402 L 408,408 L 456,414 L 504,418 L 548,426 L 594,436 L 634,444 L 646,456 L 626,466 L 584,464 L 534,458 L 478,452 L 424,446 L 372,438 L 328,430 L 302,418 Z"
      fill={COLORS.javaHighlight}
      stroke={COLORS.javaStroke}
      strokeWidth="1.6"
    />
    {/* Madura */}
    <path d="M 556,418 L 594,420 L 592,429 L 554,426 Z" fill="#6F866B" />
    {/* Bali, Lombok, Sumbawa, Flores, Timor */}
    <path d="M 654,456 L 680,456 L 678,469 L 652,467 Z" />
    <path d="M 688,459 L 708,461 L 706,472 L 686,470 Z" />
    <path d="M 716,462 L 758,463 L 755,475 L 714,473 Z" />
    <path d="M 768,464 L 826,462 L 822,473 L 766,474 Z" />
    <path d="M 758,492 L 792,494 L 786,506 L 754,502 Z" />
    {/* Kalimantan */}
    <path d="M 374,232 L 392,196 L 422,166 L 464,142 L 502,136 L 538,162 L 556,204 L 546,246 L 528,286 L 502,318 L 460,324 L 418,318 L 386,294 L 368,262 Z" />
    {/* Sulawesi */}
    <path d="M 608,216 L 632,192 L 676,184 L 704,196 L 682,210 L 642,218 L 636,242 L 664,258 L 674,294 L 656,322 L 638,308 L 642,276 L 622,268 L 616,316 L 598,322 L 596,274 L 588,244 Z" />
    {/* Papua West */}
    <path d="M 848,254 L 892,246 L 942,258 L 942,356 L 892,338 L 856,304 Z" />
  </g>
);

/** Reusable zoomed TN Ujung Kulon Peninsula + Panaitan Island + Gunung Honje shapes (local 396x252 box). */
export const UjungKulonShapes: React.FC<{ showDots?: boolean; revealedCount?: number }> = ({
  showDots = true,
  revealedCount = 10,
}) => {
  const dots: [number, number][] = [
    [118, 174],
    [142, 162],
    [164, 176],
    [186, 164],
    [212, 172],
    [154, 186],
    [236, 152],
    [274, 134],
    [304, 146],
    [288, 168],
  ];
  return (
    <>
      {/* Pulau Panaitan */}
      <path d="M 52,82 L 94,68 L 116,104 L 84,126 L 50,112 Z" fill="#5D7C62" stroke="#A7C9AC" strokeWidth="1.2" />
      {/* Semenanjung Ujung Kulon + Gunung Honje */}
      <path
        d="M 88,158 L 146,142 L 202,148 L 242,126 L 278,94 L 332,96 L 368,124 L 368,214 L 252,214 L 198,192 L 128,202 L 80,186 Z"
        fill="#3F6E4A"
        stroke="#BFE0C5"
        strokeWidth="1.8"
      />
      {showDots &&
        dots.slice(0, revealedCount).map(([dx, dy], idx) => (
          <circle key={idx} cx={dx} cy={dy} r="4.2" fill="#FDE68A" opacity="0.95" />
        ))}
    </>
  );
};

/** Word-wrapped HTML text container safely bounded inside SVG coordinates (prevents text overflow). */
export const SvgHtmlTextBox: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  children: React.ReactNode;
}> = ({ x, y, width, height, children }) => (
  <foreignObject x={x} y={y} width={width} height={height}>
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        overflowWrap: "break-word",
        fontFamily: FONT_SANS,
      }}
    >
      {children}
    </div>
  </foreignObject>
);

/** Clean top badge + auto-wrapping headline header for full 2D editorial panels. */
export const EditorialTopHeader: React.FC<{
  badge: string;
  badgeColor?: string;
  location: string;
  title: string;
}> = ({ badge, badgeColor = COLORS.forestAccent, location, title }) => {
  const badgeW = Math.max(280, badge.length * 13.5 + 36);
  return (
    <g transform="translate(68, 165)">
      <rect x="0" y="0" width={badgeW} height="36" fill={badgeColor} />
      <text x="16" y="24" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="1.5">
        {badge}
      </text>
      <text x={badgeW + 20} y="24" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="17" letterSpacing="1.0">
        {location}
      </text>
      <SvgHtmlTextBox x={0} y={46} width={944} height={74}>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: -0.6,
            color: COLORS.inkDark,
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {title}
        </div>
      </SvgHtmlTextBox>
      <line x1="0" y1="126" x2="944" y2="126" stroke={COLORS.hairlineDark} strokeWidth="1.5" />
    </g>
  );
};
