// Mature Editorial 2D Motion Graphics & Cartography Views for Episode 002 (Proof-of-Look)
// Aesthetic: National Geographic Maps × Vox / DW Investigative Science Journalism
// Strictly 1080x1920 virtual canvas, mobile safe-zone compliant, zero emojis, zero cartoon pills.

import React from "react";
import { SvgHtmlTextBox } from "./EditorialTheme";

const FONT_SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

const COLORS = {
  paperBg: "#ECE8DF",
  paperGrid: "rgba(38, 46, 40, 0.09)",
  inkDark: "#141D18",
  inkMuted: "#47544D",
  forestAccent: "#1E4D32",
  oceanDeep: "#182E3B",
  landHighlight: "#B8472A",
  alertAmber: "#B45309",
  ivory: "#F6F4EE",
  hairlineLight: "rgba(246, 244, 238, 0.28)",
  hairlineDark: "rgba(20, 29, 24, 0.22)",
};

/** POL-1 Minimal Editorial Opening Header over 3D Ujung Kulon Establishing Shot */
export const Pol1HeaderOverlay: React.FC<{ progress: number }> = ({ progress }) => {
  const op = Math.min(1, 0.65 + progress * 0.35);
  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        position: "relative",
        fontFamily: FONT_SANS,
        color: COLORS.ivory,
        opacity: op,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 540,
          background:
            "linear-gradient(180deg, rgba(10,16,12,0.72) 0%, rgba(10,16,12,0.34) 58%, rgba(10,16,12,0) 100%)",
        }}
      />
      <div style={{ position: "absolute", top: 180, left: 68, right: 110 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 28, height: 2, background: "#D8B982" }} />
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2.4,
              color: "#E8D5AE",
              textTransform: "uppercase",
            }}
          >
            SERIAL BADAK JAWA · BAGIAN 1/4
          </span>
        </div>
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            lineHeight: 1.09,
            letterSpacing: -0.7,
            color: COLORS.ivory,
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          MENGAPA BADAK JAWA
          <br />
          TERANCAM PUNAH?
        </div>
        <div
          style={{
            marginTop: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            borderTop: `1px solid ${COLORS.hairlineLight}`,
            paddingTop: 14,
            fontFamily: FONT_MONO,
            fontSize: 19,
            color: "rgba(246, 244, 238, 0.88)",
            letterSpacing: 1.0,
          }}
        >
          <span>TAMAN NASIONAL UJUNG KULON, BANTEN</span>
          <span style={{ opacity: 0.45 }}>|</span>
          <span>6°45&apos;S 105°20&apos;E</span>
        </div>
      </div>
    </div>
  );
};

/** POL-2 Clean documentary lower-third caption for Javan Rhino Close-Up */
export const Pol2CloseupOverlay: React.FC = () => (
  <div
    style={{
      width: 1080,
      height: 1920,
      position: "relative",
      fontFamily: FONT_SANS,
      color: COLORS.ivory,
    }}
  >
    <div
      style={{
        position: "absolute",
        bottom: 245,
        left: 68,
        borderLeft: "3px solid #D8B982",
        paddingLeft: 18,
        background: "linear-gradient(90deg, rgba(12,18,14,0.74) 0%, rgba(12,18,14,0.45) 70%, rgba(12,18,14,0) 100%)",
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 64,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 0.3 }}>
        Badak Jawa <span style={{ fontStyle: "italic", fontWeight: 400, opacity: 0.88 }}>(Rhinoceros sondaicus)</span>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: "#E2DAC9", marginTop: 6, letterSpacing: 0.9 }}>
        CULA TUNGGAL PENDEK · LIPATAN KULIT KHAS · SATWA SOLITER
      </div>
    </div>
  </div>
);

/** POL-3 Hairline Scientific Taxonomy Callout over 3-Layer 3D Habitat Depth */
export const Pol3TaxonomyOverlay: React.FC = () => (
  <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
    <g transform="translate(68, 195)">
      <rect x="0" y="0" width="690" height="205" fill="rgba(14, 22, 18, 0.78)" stroke="rgba(246,244,238,0.24)" strokeWidth="1.5" />
      <rect x="0" y="0" width="5" height="205" fill="#4C8C5A" />
      <text x="26" y="38" fill="#A7D7B1" fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="2">
        FAKTA · IUCN RED LIST
      </text>
      <text x="26" y="84" fill="#F6F4EE" fontFamily={FONT_SANS} fontSize="34" fontWeight="700" fontStyle="italic">
        Rhinoceros sondaicus
      </text>
      <line x1="26" y1="104" x2="658" y2="104" stroke="rgba(246,244,238,0.2)" strokeWidth="1" />
      <text x="26" y="138" fill="#E8B87D" fontFamily={FONT_MONO} fontSize="22" fontWeight="700" letterSpacing="1.2">
        STATUS: CRITICALLY ENDANGERED
      </text>
      <text x="26" y="174" fill="rgba(246,244,238,0.88)" fontFamily={FONT_SANS} fontSize="21">
        100% populasi liar tersisa di satu kawasan: TN Ujung Kulon
      </text>
    </g>

    {/* Crisp hairline pointer down toward the browsing Javan Rhino */}
    <polyline
      points="385,400 385,620 515,855"
      fill="none"
      stroke="rgba(246, 244, 238, 0.82)"
      strokeWidth="1.8"
      strokeDasharray="6 5"
    />
    <circle cx="515" cy="855" r="5.5" fill="#F6F4EE" />
    <circle cx="515" cy="855" r="14" fill="none" stroke="rgba(246,244,238,0.72)" strokeWidth="1.5" />

    {/* Micro source citation safe from Shorts/Reels/TikTok bottom bar */}
    <rect x="68" y="1592" width="790" height="38" fill="rgba(14,22,18,0.58)" />
    <text x="82" y="1617" fill="rgba(246,244,238,0.88)" fontFamily={FONT_MONO} fontSize="17" letterSpacing="0.8">
      SUMBER: IUCN RED LIST (ASIAN RHINO SPECIALIST GROUP) · BALAI TNUK
    </text>
  </svg>
);

/**
 * POL-4 Full 2D Editorial Cartography + Population Estimation Data View
 * Zero text overlaps, crisp detailed archipelago coastline, explicit uncertainty bands.
 */
export const Pol4PopulationMapView: React.FC<{ progress: number }> = ({ progress }) => {
  const reveal = Math.min(1, 0.72 + progress * 0.9);

  const barLeft = 28;
  const barRight = 916;
  const barW = barRight - barLeft;
  const toX = (val: number) => barLeft + (val / 120) * barW;

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: COLORS.paperBg,
        position: "relative",
        fontFamily: FONT_SANS,
        color: COLORS.inkDark,
      }}
    >
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <defs>
          <pattern id="mapGridPol4" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={COLORS.paperGrid} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill={COLORS.paperBg} />
        <rect width="1080" height="1920" fill="url(#mapGridPol4)" />

        {/* TOP HEADER (zero badge overflow) */}
        <g transform="translate(68, 170)">
          <rect x="0" y="0" width="332" height="36" fill={COLORS.forestAccent} />
          <text x="16" y="24" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="1.8">
            DATA &amp; ESTIMASI RESMI
          </text>
          <text x="352" y="24" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1.2">
            INDONESIA · BANTEN
          </text>
          <text x="0" y="96" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="48" fontWeight="800" letterSpacing="-0.6">
            Populasi Tersisa di Satu Titik
          </text>
          <line x1="0" y1="120" x2="944" y2="120" stroke={COLORS.hairlineDark} strokeWidth="1.5" />
        </g>

        {/* CARTOGRAPHIC PANEL: INDONESIA -> WESTERN JAVA -> UJUNG KULON */}
        <g transform="translate(68, 326)">
          <rect x="0" y="0" width="944" height="620" fill={COLORS.oceanDeep} stroke={COLORS.inkDark} strokeWidth="1.5" />

          {/* Ocean grid */}
          {[140, 280, 420, 560].map((y) => (
            <line key={y} x1="0" y1={y} x2="944" y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          ))}
          {[180, 360, 540, 720].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="620" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          ))}

          {/* Detailed Indonesia Archipelago Silhouette */}
          <g fill="#53685B" stroke="#98B0A0" strokeWidth="1.15" opacity="0.9">
            {/* Sumatra */}
            <path d="M 62,102 L 92,108 L 128,136 L 154,165 L 185,196 L 208,236 L 238,266 L 265,305 L 292,344 L 294,376 L 274,394 L 252,374 L 222,338 L 194,298 L 164,256 L 136,216 L 104,174 L 74,136 Z" />
            {/* Bangka & Belitung */}
            <path d="M 294,284 L 316,294 L 310,312 L 290,302 Z" />
            <path d="M 326,304 L 340,308 L 336,320 L 322,316 Z" />
            {/* Java (highlighted relief island) */}
            <path
              d="M 304,404 L 326,400 L 362,402 L 408,408 L 456,414 L 504,418 L 548,426 L 594,436 L 634,444 L 646,456 L 626,466 L 584,464 L 534,458 L 478,452 L 424,446 L 372,438 L 328,430 L 302,418 Z"
              fill="#7A9176"
              stroke="#D2DFCE"
              strokeWidth="1.6"
            />
            {/* Madura */}
            <path d="M 556,418 L 594,420 L 592,429 L 554,426 Z" fill="#6F866B" />
            {/* Bali, Lombok, Sumbawa, Sumba, Flores, Timor */}
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

          {/* Island labels */}
          <text x="148" y="302" fill="rgba(246,244,238,0.52)" fontFamily={FONT_MONO} fontSize="15" letterSpacing="2">SUMATRA</text>
          <text x="405" y="246" fill="rgba(246,244,238,0.52)" fontFamily={FONT_MONO} fontSize="15" letterSpacing="2">KALIMANTAN</text>
          <text x="448" y="492" fill="rgba(246,244,238,0.88)" fontFamily={FONT_MONO} fontSize="17" letterSpacing="2.4">PULAU JAWA</text>

          {/* Ujung Kulon pin */}
          <circle cx="308" cy="412" r="20" fill="rgba(217, 119, 6, 0.28)" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="308" cy="412" r="6" fill="#FDE68A" />

          {/* Callout line from Ujung Kulon to Zoomed Inset */}
          <polyline points="308,392 308,118 524,118" fill="none" stroke="#E8B87D" strokeWidth="2" />

          {/* ZOOMED INSET: SEMENANJUNG UJUNG KULON, BANTEN */}
          <g transform="translate(524, 24)">
            <rect x="0" y="0" width="396" height="252" fill="#132530" stroke="#E8B87D" strokeWidth="1.8" />
            <text x="18" y="30" fill="#E8B87D" fontFamily={FONT_MONO} fontSize="16" fontWeight="700" letterSpacing="1.4">
              ZOOM: TN UJUNG KULON, BANTEN
            </text>
            {/* Panaitan Island */}
            <path d="M 52,82 L 94,68 L 116,104 L 84,126 L 50,112 Z" fill="#5D7C62" stroke="#A7C9AC" strokeWidth="1.2" />
            {/* Ujung Kulon Peninsula + Gunung Honje */}
            <path
              d="M 88,158 L 146,142 L 202,148 L 242,126 L 278,94 L 332,96 L 368,124 L 368,214 L 252,214 L 198,192 L 128,202 L 80,186 Z"
              fill="#3F6E4A"
              stroke="#BFE0C5"
              strokeWidth="1.8"
            />
            {/* Camera trap survey dots */}
            {[
              [118, 174], [142, 162], [164, 176], [186, 164], [212, 172],
              [154, 186], [236, 152], [274, 134], [304, 146], [288, 168],
            ].map(([dx, dy], idx) => (
              <circle key={idx} cx={dx} cy={dy} r="3.6" fill="#FDE68A" opacity="0.94" />
            ))}
            <text x="18" y="238" fill="rgba(246,244,238,0.8)" fontFamily={FONT_MONO} fontSize="13.5" letterSpacing="0.4">
              6°45&apos;S 105°20&apos;E · 100% POPULASI LIAR DUNIA
            </text>
          </g>

          {/* Scale bar */}
          <g transform="translate(24, 578)">
            <line x1="0" y1="0" x2="120" y2="0" stroke={COLORS.ivory} strokeWidth="2" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke={COLORS.ivory} strokeWidth="2" />
            <line x1="120" y1="-6" x2="120" y2="6" stroke={COLORS.ivory} strokeWidth="2" />
            <text x="132" y="5" fill="rgba(246,244,238,0.84)" fontFamily={FONT_MONO} fontSize="15">
              ±500 KM · SKALA NUSANTARA
            </text>
          </g>
        </g>

        {/* SCIENTIFIC POPULATION ESTIMATION PANEL */}
        <g transform="translate(68, 990)">
          <rect x="0" y="0" width="944" height="548" fill="#F6F4EE" stroke={COLORS.inkDark} strokeWidth="1.5" />
          <rect x="0" y="0" width="944" height="54" fill="#1C2922" />
          <text x="26" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="19" fontWeight="700" letterSpacing="1.6">
            RENTANG ESTIMASI POPULASI BADAK JAWA (BUKAN SENSUS PASTI)
          </text>

          {/* Scale header label cleanly separated from ticks */}
          <text x="916" y="88" textAnchor="end" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="15" letterSpacing="1">
            SKALA: JUMLAH INDIVIDU (0 – 120)
          </text>

          {/* Scale axis 0 .. 120 */}
          <g transform="translate(0, 128)">
            {[0, 30, 60, 90, 120].map((v) => {
              const x = toX(v);
              return (
                <g key={v}>
                  <line x1={x} y1="0" x2={x} y2="288" stroke="rgba(20,29,24,0.12)" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={x} y="-12" textAnchor="middle" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="17">
                    {v}
                  </text>
                </g>
              );
            })}

            {/* ROW 1: Pemantauan Kemenhut (87 - 100 ekor) */}
            <text x="28" y="38" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="24" fontWeight="700">
              1. Estimasi Pemantauan Kementerian Kehutanan
            </text>
            <rect x={barLeft} y="56" width={barW} height="40" fill="rgba(20,29,24,0.07)" />
            <rect
              x={toX(87)}
              y="56"
              width={(toX(100) - toX(87)) * reveal}
              height="40"
              fill={COLORS.forestAccent}
            />
            <line x1={toX(87)} y1="48" x2={toX(87)} y2="104" stroke={COLORS.inkDark} strokeWidth="2.5" />
            <line x1={toX(100)} y1="48" x2={toX(100)} y2="104" stroke={COLORS.inkDark} strokeWidth="2.5" />
            <text x={toX(87) - 18} y="84" textAnchor="end" fill={COLORS.forestAccent} fontFamily={FONT_MONO} fontSize="27" fontWeight="800">
              87 – 100 EKOR
            </text>

            {/* ROW 2: Survei Kamera Jebak 2026 (kisaran 74-99, estimasi terbaik ~91) */}
            <text x="28" y="172" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="24" fontWeight="700">
              2. Survei Kamera Jebak Tahun 2026 (Estimasi Terbaik)
            </text>
            <rect x={barLeft} y="190" width={barW} height="40" fill="rgba(20,29,24,0.07)" />
            <rect
              x={toX(74)}
              y="190"
              width={(toX(99) - toX(74)) * reveal}
              height="40"
              fill="rgba(180, 83, 9, 0.3)"
              stroke={COLORS.alertAmber}
              strokeWidth="2"
            />
            <line x1={toX(91)} y1="176" x2={toX(91)} y2="244" stroke={COLORS.landHighlight} strokeWidth="4" />
            <circle cx={toX(91)} cy="210" r="9" fill={COLORS.landHighlight} />
            <text x={toX(74) - 18} y="218" textAnchor="end" fill={COLORS.landHighlight} fontFamily={FONT_MONO} fontSize="27" fontWeight="800">
              ~91 EKOR
            </text>
            <text x={toX(74) - 18} y="246" textAnchor="end" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="16">
              (rentang survei 74–99)
            </text>
          </g>

          <line x1="28" y1="462" x2="916" y2="462" stroke={COLORS.hairlineDark} strokeWidth="1" />
          <SvgHtmlTextBox x={28} y={470} width={888} height={70}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 15.5, color: COLORS.inkMuted, lineHeight: 1.4 }}>
              SUMBER: PEMANTAUAN KEMENTERIAN KEHUTANAN RI · SURVEI KAMERA JEBAK BTNUK (2026)
              <div style={{ fontFamily: FONT_SANS, fontSize: 16.5, marginTop: 2 }}>
                Catatan metodologi: Seluruh angka merupakan estimasi pemantauan ilmiah, bukan sensus absolut.
              </div>
            </div>
          </SvgHtmlTextBox>
        </g>

        <text x="68" y="1600" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1">
          KOK ISO YO? · SERIAL BADAK JAWA (BAGIAN 1/4)
        </text>
      </svg>
    </div>
  );
};

/** POL-5 Scientific Threat Telemetry Overlay over 3D Humid Overcast Ujung Kulon Habitat */
export const Pol5ThreatOverlay: React.FC = () => (
  <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
    <defs>
      <linearGradient id="threatTopScrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(10, 16, 15, 0.8)" />
        <stop offset="100%" stopColor="rgba(10, 16, 15, 0)" />
      </linearGradient>
      <linearGradient id="threatBotScrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(10, 16, 15, 0)" />
        <stop offset="45%" stopColor="rgba(10, 16, 15, 0.74)" />
        <stop offset="100%" stopColor="rgba(10, 16, 15, 0.9)" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="1080" height="600" fill="url(#threatTopScrim)" />
    <rect x="0" y="1140" width="1080" height="780" fill="url(#threatBotScrim)" />

    <g transform="translate(68, 175)">
      <rect x="0" y="0" width="382" height="36" fill="rgba(185, 28, 28, 0.9)" />
      <text x="16" y="24" fill="#F6F4EE" fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="2">
        KAJIAN RISIKO · SATU LOKASI
      </text>
      <text x="0" y="88" fill="#F6F4EE" fontFamily={FONT_SANS} fontSize="44" fontWeight="800" letterSpacing="-0.5">
        Kerentanan Populasi Tunggal
      </text>

      {/* Mini-Map Selat Sunda & Anak Krakatau (aligned full 944px safe-zone width) */}
      <g transform="translate(0, 114)">
        <rect x="0" y="0" width="944" height="236" fill="rgba(15, 27, 32, 0.84)" stroke="rgba(246,244,238,0.24)" strokeWidth="1.5" />
        {/* Sumatra tip */}
        <path d="M 35,22 L 240,22 L 195,95 L 115,102 L 35,72 Z" fill="#4E6155" opacity="0.88" />
        {/* West Java & Ujung Kulon */}
        <path d="M 455,112 L 560,98 L 605,130 L 605,214 L 438,214 L 405,186 L 342,192 L 330,162 L 408,142 Z" fill="#3B6846" stroke="#A7D7B1" strokeWidth="1.6" />
        {/* Gunung Anak Krakatau epicenter + propagation rings */}
        <circle cx="258" cy="118" r="102" fill="none" stroke="rgba(239,68,68,0.28)" strokeWidth="1.5" strokeDasharray="6 4" />
        <circle cx="258" cy="118" r="62" fill="none" stroke="rgba(239,68,68,0.48)" strokeWidth="1.6" strokeDasharray="5 4" />
        <circle cx="258" cy="118" r="24" fill="rgba(239,68,68,0.32)" stroke="#EF4444" strokeWidth="2" />
        <polygon points="258,108 267,124 249,124" fill="#FCA5A5" />
        <line x1="268" y1="124" x2="358" y2="168" stroke="#FCD34D" strokeWidth="1.8" strokeDasharray="4 4" />
        <text x="156" y="82" fill="#FCA5A5" fontFamily={FONT_MONO} fontSize="15" fontWeight="700">ANAK KRAKATAU</text>
        <text x="372" y="198" fill="#D1FAE5" fontFamily={FONT_MONO} fontSize="15" fontWeight="700">UJUNG KULON</text>
        <text x="256" y="172" fill="#FDE68A" fontFamily={FONT_MONO} fontSize="14">±50–60 KM</text>

        <line x1="630" y1="22" x2="630" y2="214" stroke="rgba(246,244,238,0.2)" strokeWidth="1" />
        <SvgHtmlTextBox x={648} y={28} width={280} height={192}>
          <div style={{ color: "#F6F4EE" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 15, letterSpacing: 1, opacity: 0.78 }}>
              KETERPAPARAN SPESIES
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 52, fontWeight: 800, color: "#FCA5A5", lineHeight: 1.1, marginTop: 6 }}>
              100%
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 8 }}>
              Populasi liar di 1 lokasi
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: "#FCD34D", marginTop: 10 }}>
              0 CADANGAN LIAR
            </div>
          </div>
        </SvgHtmlTextBox>
      </g>
    </g>

    {/* Bottom 3 Structured Risk Vectors */}
    <g transform="translate(68, 1235)">
      {[
        { num: "01", title: "BENCANA GEOLOGIS PESISIR", desc: "Potensi tsunami & erupsi di koridor Selat Sunda – Anak Krakatau" },
        { num: "02", title: "WABAH PENYAKIT MENULAR", desc: "Populasi kecil dan terpusat rentan tertular patogen secara serentak" },
        { num: "03", title: "KERUSAKAN EKOSISTEM & HABITAT", desc: "Gangguan daya dukung atau pakan langsung menekan seluruh spesies" },
      ].map((item, idx) => (
        <g key={item.num} transform={`translate(0, ${idx * 108})`}>
          <rect x="0" y="0" width="944" height="92" fill="rgba(14, 22, 19, 0.84)" stroke="rgba(246,244,238,0.22)" strokeWidth="1.2" />
          <rect x="0" y="0" width="4" height="92" fill={idx === 0 ? "#EF4444" : idx === 1 ? "#F59E0B" : "#D97706"} />
          <text x="24" y="54" fill="#FCD34D" fontFamily={FONT_MONO} fontSize="24" fontWeight="800">
            {item.num}
          </text>
          <SvgHtmlTextBox x={76} y={14} width={844} height={68}>
            <div style={{ color: "#F6F4EE" }}>
              <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: 0.6 }}>{item.title}</div>
              <div style={{ fontSize: 18.5, color: "rgba(246,244,238,0.85)", marginTop: 4 }}>{item.desc}</div>
            </div>
          </SvgHtmlTextBox>
        </g>
      ))}

      <text x="0" y="365" fill="rgba(246,244,238,0.78)" fontFamily={FONT_MONO} fontSize="17" letterSpacing="0.6">
        SUMBER: IUCN RED LIST · IUCN SSC JAVAN RHINO PHVA · PVMBG / BIG
      </text>
    </g>
  </svg>
);
