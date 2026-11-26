// Shared Documentary UI & Map Primitives for Episodes 003, 004, and 005
// Uses SvgHtmlTextBox (<foreignObject>) everywhere text appears so ZERO text ever overflows or clips mid-word.

import React from "react";
import {
  ArchipelagoPolygons,
  COLORS,
  EditorialPaperBackground,
  FONT_MONO,
  FONT_SANS,
  SvgHtmlTextBox,
} from "../../episode002_badak_jawa/editorial/EditorialTheme";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/** Full-screen dark documentary chapter opening bridge card (2.0s before VO). */
export const SeriesOpeningCard: React.FC<{
  partLabel: string;
  titleLine1: string;
  titleLine2: string;
  contextLine: string;
  progress: number;
}> = ({ partLabel, titleLine1, titleLine2, contextLine, progress }) => {
  const op = easeOut(progress * 3.5);
  return (
    <div style={{ width: 1080, height: 1920, background: "#101813", fontFamily: FONT_SANS, opacity: op }}>
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <rect width="1080" height="1920" fill="#101813" />
        <g opacity="0.16" stroke="#4C8C5A" strokeWidth="1" fill="none">
          {[420, 740, 1060, 1380].map((y) => (
            <line key={y} x1="68" y1={y} x2="1012" y2={y} />
          ))}
        </g>

        <g transform="translate(68, 640)">
          <rect x="0" y="0" width="460" height="38" fill="#1E4D32" />
          <text x="18" y="25" fill={COLORS.goldLight} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="2">
            {partLabel}
          </text>

          <SvgHtmlTextBox x={0} y={56} width={944} height={320}>
            <div style={{ color: COLORS.ivory }}>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.7 }}>
                {titleLine1}
                <br />
                {titleLine2}
              </div>
              <div
                style={{
                  width: `${100 * easeOut(progress * 2)}%`,
                  height: 3,
                  background: COLORS.gold,
                  margin: "24px 0",
                }}
              />
              <div style={{ fontSize: 24, lineHeight: 1.45, color: "rgba(246,244,238,0.88)" }}>
                {contextLine}
              </div>
            </div>
          </SvgHtmlTextBox>
        </g>

        <text x="68" y="1595" fill={COLORS.gold} fontFamily={FONT_MONO} fontSize="18" letterSpacing="2">
          KOK ISO YO? · SERIAL BADAK JAWA
        </text>
      </svg>
    </div>
  );
};

/** Full-screen dark closing serial bridge card (2.0s after VO). */
export const SeriesClosingBridgeCard: React.FC<{
  nextBadge: string;
  headline: string;
  line1: string;
  line2: string;
  highlightNote?: string;
}> = ({ nextBadge, headline, line1, line2, highlightNote }) => (
  <div style={{ width: 1080, height: 1920, background: "#101813", fontFamily: FONT_SANS }}>
    <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
      <rect width="1080" height="1920" fill="#101813" />
      <g transform="translate(68, 670)">
        {highlightNote && (
          <text x="0" y="-36" fill="#FCA5A5" fontFamily={FONT_MONO} fontSize="20" fontWeight="700" letterSpacing="1.2">
            {highlightNote}
          </text>
        )}
        <rect x="0" y="0" width="440" height="40" fill="#1E4D32" />
        <text x="18" y="27" fill={COLORS.goldLight} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="2">
          {nextBadge}
        </text>
        <SvgHtmlTextBox x={0} y={56} width={944} height={310}>
          <div style={{ color: COLORS.ivory }}>
            <div style={{ fontSize: 45, fontWeight: 800, lineHeight: 1.16, letterSpacing: -0.5 }}>
              {headline}
            </div>
            <div style={{ fontSize: 25, lineHeight: 1.48, color: "rgba(246,244,238,0.88)", marginTop: 18 }}>
              {line1} {line2}
            </div>
            <div style={{ height: 1, background: COLORS.hairlineLight, margin: "28px 0 22px" }} />
            <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, letterSpacing: 2.2, color: COLORS.gold }}>
              KOK ISO YO? · DOKUMENTER &amp; SAINS INVESTIGATIF
            </div>
          </div>
        </SvgHtmlTextBox>
      </g>
    </svg>
  </div>
);

/** Clean lower-third documentary banner over 3D scenes. */
export const SeriesLowerThird: React.FC<{
  badge: string;
  title: string;
  subtitle: string;
  citation?: string;
  accent?: string;
  progress: number;
}> = ({ badge, title, subtitle, citation, accent = COLORS.gold, progress }) => {
  const op = easeOut(progress * 4);
  return (
    <div style={{ width: 1080, height: 1920, position: "relative", fontFamily: FONT_SANS, color: COLORS.ivory, opacity: op }}>
      <div
        style={{
          position: "absolute",
          bottom: 245,
          left: 68,
          right: 68,
          borderLeft: `4px solid ${accent}`,
          padding: "14px 28px 14px 20px",
          background: "linear-gradient(90deg, rgba(12,18,14,0.86) 0%, rgba(12,18,14,0.62) 82%, rgba(12,18,14,0) 100%)",
        }}
      >
        <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, letterSpacing: 1.6, color: COLORS.goldLight, marginBottom: 6 }}>
          {badge}
        </div>
        <div style={{ fontSize: 29, fontWeight: 700, letterSpacing: 0.2, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: 20, color: "#D9E0D7", marginTop: 6, lineHeight: 1.35 }}>{subtitle}</div>
        {citation && (
          <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: "rgba(232,213,174,0.82)", marginTop: 8, lineHeight: 1.35 }}>
            {citation}
          </div>
        )}
      </div>
    </div>
  );
};

/** Clipped Java Island cartography viewport with auto-wrapping flex HUD legend. */
export const JavaSecondSiteMapBox: React.FC<{
  clipId: string;
  highlightMode: "general" | "alas_purwo" | "baluran";
  progress: number;
}> = ({ clipId, highlightMode, progress }) => {
  const dash = easeOut(progress * 1.5);
  const zoom = highlightMode === "general" ? 2.15 : 2.35;
  const tx = highlightMode === "general" ? -420 : -595;
  const ty = highlightMode === "general" ? -590 : -655;

  return (
    <g transform="translate(68, 326)">
      <clipPath id={clipId}>
        <rect x="0" y="0" width="944" height="580" />
      </clipPath>
      <rect x="0" y="0" width="944" height="580" fill={COLORS.oceanDeep} stroke={COLORS.inkDark} strokeWidth="1.5" />
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${tx}, ${ty}) scale(${zoom})`}>
          <ArchipelagoPolygons />
          <circle cx="308" cy="412" r="10" fill="rgba(110,231,183,0.3)" stroke="#6EE7B7" strokeWidth="1.4" />
          <circle cx="308" cy="412" r="4" fill="#6EE7B7" />
          <path
            d="M 314,410 Q 475,355 636,458"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.0"
            strokeDasharray="6 4"
            pathLength={100}
            strokeDashoffset={100 - dash * 100}
          />
          {highlightMode === "baluran" && (
            <path
              d="M 314,410 Q 485,342 638,442"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.8"
              strokeDasharray="5 4"
              opacity={dash}
            />
          )}
          <circle
            cx="636"
            cy="458"
            r={highlightMode === "alas_purwo" ? 13 : 9}
            fill={highlightMode === "alas_purwo" ? "rgba(245,158,11,0.32)" : "rgba(245,158,11,0.14)"}
            stroke="#FCD34D"
            strokeWidth="1.6"
            strokeDasharray="3 2.5"
          />
          <circle cx="636" cy="458" r="3.8" fill="#FDE68A" />
          <circle
            cx="638"
            cy="442"
            r={highlightMode === "baluran" ? 13 : 8}
            fill={highlightMode === "baluran" ? "rgba(56,189,248,0.28)" : "rgba(56,189,248,0.1)"}
            stroke="#7DD3FC"
            strokeWidth="1.5"
            strokeDasharray="3 2.5"
          />
          <circle cx="638" cy="442" r="3.4" fill="#BAE6FD" />
        </g>

        {/* Bottom HUD legend strip cleanly wrapped inside 944px width */}
        <rect x="0" y="482" width="944" height="98" fill="rgba(16, 26, 23, 0.92)" />
        <line x1="0" y1="482" x2="944" y2="482" stroke={COLORS.hairlineLight} strokeWidth="1" />
        <SvgHtmlTextBox x={24} y={490} width={896} height={84}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px 26px",
              height: "100%",
              alignContent: "center",
              fontFamily: FONT_MONO,
              fontSize: 15.5,
              fontWeight: 700,
              color: COLORS.ivory,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, background: "#6EE7B7", display: "inline-block" }} />
              TN UJUNG KULON (UTAMA)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#FCD34D" }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, border: "2px dashed #FCD34D", display: "inline-block" }} />
              ALAS PURWO (MULAI DIKAJI · BELUM FINAL)
            </span>
            {highlightMode === "baluran" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#BAE6FD" }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, border: "2px dashed #7DD3FC", display: "inline-block" }} />
                BALURAN (WACANA)
              </span>
            )}
          </div>
        </SvgHtmlTextBox>
      </g>
    </g>
  );
};

export const SeriesPaperShell: React.FC<{
  idSuffix: string;
  children: React.ReactNode;
}> = ({ idSuffix, children }) => (
  <div style={{ width: 1080, height: 1920, background: COLORS.paperBg, fontFamily: FONT_SANS }}>
    <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
      <EditorialPaperBackground idSuffix={idSuffix} />
      {children}
      <text x="68" y="1600" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1">
        KOK ISO YO? · SERIAL BADAK JAWA
      </text>
    </svg>
  </div>
);
