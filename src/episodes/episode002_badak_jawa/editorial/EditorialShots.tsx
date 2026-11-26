// Full 17-Shot Editorial Overlays & Continuous 2D Cartographic Motion Graphics — Episode 002
// Follows approved Proof-of-Look aesthetic verbatim: zero overlaps, mobile safe-zone (Y: 165..1640px),
// clean epistemic tags ([FAKTA], [ESTIMASI RESMI], [KAJIAN RISIKO], [WACANA · BELUM FINAL]).

import React from "react";
import { EP002_SHOTS, Ep002ShotId } from "../story";
import {
  ArchipelagoPolygons,
  COLORS,
  EditorialPaperBackground,
  EditorialTopHeader,
  FONT_MONO,
  FONT_SANS,
  SvgHtmlTextBox,
  UjungKulonShapes,
} from "./EditorialTheme";
import {
  Pol1HeaderOverlay,
  Pol2CloseupOverlay,
  Pol3TaxonomyOverlay,
  Pol4PopulationMapView,
  Pol5ThreatOverlay,
} from "./EditorialViews";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/** Lower-third subtle editorial caption for S04 (single forest floor) and S12 (coastal stronghold). */
const ForestLowerThird: React.FC<{
  tag: string;
  title: string;
  subtitle: string;
  progress: number;
}> = ({ tag, title, subtitle, progress }) => {
  const op = easeOut(progress * 4.5);
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
          bottom: 245,
          left: 68,
          right: 120,
          borderLeft: `3px solid ${COLORS.gold}`,
          padding: "14px 36px 14px 20px",
          background:
            "linear-gradient(90deg, rgba(12,18,14,0.82) 0%, rgba(12,18,14,0.52) 72%, rgba(12,18,14,0) 100%)",
        }}
      >
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: 1.8,
            color: COLORS.goldLight,
            marginBottom: 6,
          }}
        >
          {tag}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 0.2 }}>{title}</div>
        <div style={{ fontSize: 20, color: "#D9E0D7", marginTop: 4 }}>{subtitle}</div>
      </div>
    </div>
  );
};

/** S02 & S03 Continuous Cartographic View: Indonesia -> Ujung Kulon focus -> Risk Vectors */
const ShotS02S03MapView: React.FC<{ isS03: boolean; progress: number }> = ({ isS03, progress }) => {
  const p = easeOut(progress);
  // Continuous camera zoom onto Ujung Kulon (x=308, y=412 inside 944x620 viewport)
  const zoom = isS03 ? 1.72 + progress * 0.08 : 1.0 + p * 0.72;
  const cx = 308;
  const cy = 412;
  const tx = 472 - cx * zoom;
  const ty = 325 - cy * zoom;
  const vReveal = isS03 ? easeOut(progress * 2.2) : 0;

  return (
    <div style={{ width: 1080, height: 1920, background: COLORS.paperBg, fontFamily: FONT_SANS }}>
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <EditorialPaperBackground idSuffix={isS03 ? "s03" : "s02"} />
        <EditorialTopHeader
          badge={isS03 ? "KAJIAN · IUCN SSC PHVA" : "FAKTA · IUCN RED LIST"}
          badgeColor={isS03 ? COLORS.alertAmber : COLORS.forestAccent}
          location="INDONESIA · 6°45'S 105°20'E"
          title={isS03 ? "Risiko Terpusat di Satu Simpul" : "Satu Kawasan Tersisa di Bumi"}
        />

        {/* Map panel */}
        <g transform="translate(68, 326)">
          <clipPath id="s02Clip">
            <rect x="0" y="0" width="944" height="720" />
          </clipPath>
          <rect x="0" y="0" width="944" height="720" fill={COLORS.oceanDeep} stroke={COLORS.inkDark} strokeWidth="1.5" />
          <g clipPath="url(#s02Clip)">
            <g transform={`translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${zoom.toFixed(3)})`}>
              <ArchipelagoPolygons />
              <text x="148" y="302" fill="rgba(246,244,238,0.48)" fontFamily={FONT_MONO} fontSize="14" letterSpacing="2">
                SUMATRA
              </text>
              <text x="415" y="246" fill="rgba(246,244,238,0.48)" fontFamily={FONT_MONO} fontSize="14" letterSpacing="2">
                KALIMANTAN
              </text>
              <text x="448" y="486" fill="rgba(246,244,238,0.86)" fontFamily={FONT_MONO} fontSize="16" letterSpacing="2.2">
                PULAU JAWA
              </text>

              {/* Threat vectors in S03 converging on Ujung Kulon node */}
              {isS03 && (
                <g opacity={vReveal}>
                  <circle cx={cx} cy={cy} r={24 + progress * 12} fill="none" stroke="rgba(239,68,68,0.55)" strokeWidth="1.4" strokeDasharray="4 3" />
                  <circle cx={cx} cy={cy} r={40 + progress * 16} fill="none" stroke="rgba(245,158,11,0.45)" strokeWidth="1.2" strokeDasharray="5 4" />
                  {/* Vector 1: Sunda Strait Geological Hazard from Anak Krakatau */}
                  <line x1="258" y1="382" x2={cx - 8} y2={cy - 5} stroke="#EF4444" strokeWidth="2.2" />
                  <circle cx="258" cy="382" r="5" fill="#EF4444" />
                  {/* Vector 2: Pathogen / Management vulnerability */}
                  <line x1="395" y1="352" x2={cx + 8} y2={cy - 6} stroke="#F59E0B" strokeWidth="2.0" strokeDasharray="4 3" />
                  <circle cx="395" cy="352" r="4.5" fill="#F59E0B" />
                </g>
              )}

              {/* Solid Ujung Kulon pin */}
              <circle cx={cx} cy={cy} r="17" fill="rgba(217, 119, 6, 0.28)" stroke="#F59E0B" strokeWidth="1.8" />
              <circle cx={cx} cy={cy} r="5.5" fill="#FDE68A" />
            </g>

            {/* Fixed-screen HUD corner readout inside map */}
            <rect x="20" y="20" width="420" height="74" fill="rgba(19, 37, 48, 0.9)" stroke={COLORS.goldLight} strokeWidth="1.2" />
            <text x="36" y="48" fill={COLORS.goldLight} fontFamily={FONT_MONO} fontSize="16" fontWeight="700" letterSpacing="1.2">
              {isS03 ? "TITIK KRITIS: TN UJUNG KULON" : "POPULASI LIAR GLOBAL"}
            </text>
            <text x="36" y="76" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="20" fontWeight="700">
              {isS03 ? "1 KAWASAN = KETERPAPARAN 100%" : "1 KAWASAN TERSISA DI DUNIA"}
            </text>
          </g>
        </g>

        {/* Bottom Narrative Context Card */}
        <g transform="translate(68, 1088)">
          <rect x="0" y="0" width="944" height="440" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
          <rect x="0" y="0" width="944" height="52" fill="#1C2922" />
          <text x="26" y="33" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="1.5">
            {isS03 ? "IMPLIKASI EKOLOGIS KONSENTRASI TUNGGAL" : "SEBARAN HABITAT LIAR RHINOCEROS SONDAICUS"}
          </text>

          {!isS03 ? (
            <SvgHtmlTextBox x={28} y={74} width={888} height={306}>
              <div style={{ color: COLORS.inkDark }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 16, letterSpacing: 1, color: COLORS.inkMuted }}>
                  LOKASI TERVERIFIKASI SAAT INI
                </div>
                <div style={{ fontSize: 33, fontWeight: 800, color: COLORS.forestAccent, marginTop: 8 }}>
                  Taman Nasional Ujung Kulon, Banten
                </div>
                <div style={{ height: 1, background: COLORS.hairlineDark, margin: "18px 0" }} />
                <div style={{ fontSize: 22.5, fontWeight: 600, lineHeight: 1.55 }}>
                  <div>• Seluruh individu liar di dunia berada di satu semenanjung pesisir</div>
                  <div style={{ marginTop: 8 }}>• Tidak ada subpopulasi liar aktif lain di luar Jawa Barat bagian barat</div>
                </div>
                <div style={{ fontSize: 19.5, color: COLORS.inkMuted, marginTop: 14, lineHeight: 1.4 }}>
                  Catatan: Subspesies Vietnam (TN Cat Tien) telah dinyatakan punah sejak 2010.
                </div>
              </div>
            </SvgHtmlTextBox>
          ) : (
            <g transform="translate(28, 86)">
              {[
                { num: "01", label: "WABAH PENYAKIT MENULAR", desc: "Satu patogen dapat menyebar di populasi kecil yang padat." },
                { num: "02", label: "BENCANA ALAM BESAR", desc: "Posisi pesisir berdekatan langsung dengan koridor Selat Sunda." },
                { num: "03", label: "KESALAHAN PENGELOLAAN HABITAT", desc: "Satu gangguan ekosistem memengaruhi keseluruhan spesies." },
              ].map((row, idx) => (
                <g key={row.num} transform={`translate(0, ${idx * 94})`}>
                  <rect x="0" y="0" width="888" height="78" fill="#ECE8DF" stroke={COLORS.hairlineDark} strokeWidth="1" />
                  <rect x="0" y="0" width="5" height="78" fill={idx === 1 ? COLORS.alertRed : COLORS.alertAmber} />
                  <text x="22" y="46" fill={COLORS.alertAmber} fontFamily={FONT_MONO} fontSize="22" fontWeight="800">
                    {row.num}
                  </text>
                  <text x="74" y="34" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="22" fontWeight="800">
                    {row.label}
                  </text>
                  <text x="74" y="62" fill={COLORS.inkMuted} fontFamily={FONT_SANS} fontSize="19">
                    {row.desc}
                  </text>
                </g>
              ))}
            </g>
          )}

          <text x="28" y="408" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="16">
            SUMBER: IUCN RED LIST · IUCN SSC ASIAN RHINO SPECIALIST GROUP · BALAI TNUK
          </text>
        </g>

        <text x="68" y="1600" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1">
          KOK ISO YO? · SERIAL BADAK JAWA (BAGIAN 1/4)
        </text>
      </svg>
    </div>
  );
};

/** S05 Eastward Java Relief Map: Conceptual Dashed Trajectory + [WACANA · BELUM FINAL] */
const ShotS05WacanaMap: React.FC<{ progress: number }> = ({ progress }) => {
  const dashDraw = easeOut(progress * 1.4);
  const panX = -progress * 42;
  return (
    <div style={{ width: 1080, height: 1920, background: COLORS.paperBg, fontFamily: FONT_SANS }}>
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <EditorialPaperBackground idSuffix="s05" />
        <EditorialTopHeader
          badge="WACANA / GAGASAN · BELUM FINAL"
          badgeColor={COLORS.alertAmber}
          location="PULAU JAWA · KAJIAN"
          title="Gagasan Habitat Kedua"
        />

        {/* Java Island Horizontal Pan Viewport */}
        <g transform="translate(68, 326)">
          <clipPath id="s05Clip">
            <rect x="0" y="0" width="944" height="620" />
          </clipPath>
          <rect x="0" y="0" width="944" height="620" fill={COLORS.oceanDeep} stroke={COLORS.inkDark} strokeWidth="1.5" />
          <g clipPath="url(#s05Clip)">
            <g transform={`translate(${(panX - 420).toFixed(1)}, -610) scale(2.25)`}>
              <ArchipelagoPolygons />
              {/* Solid anchor: Rumah Asli (TN Ujung Kulon) */}
              <circle cx="308" cy="412" r="14" fill="rgba(76, 140, 90, 0.35)" stroke="#6EE7B7" strokeWidth="1.6" />
              <circle cx="308" cy="412" r="5" fill="#6EE7B7" />

              {/* Strictly DASHED conceptual arc eastward (never a solid arrow or finalized plan!) */}
              <path
                d="M 314,410 Q 470,350 618,442"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.4"
                strokeDasharray="7 5"
                pathLength={100}
                strokeDashoffset={100 - dashDraw * 100}
              />
              {/* Tentative dashed candidate halo in Eastern Java (not named/finalized yet in Ep 002) */}
              <circle
                cx="624"
                cy="446"
                r="14"
                fill="rgba(245, 158, 11, 0.14)"
                stroke="#FCD34D"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity={dashDraw}
              />
            </g>

            {/* Clear Non-Final Epistemic Badges anchored cleanly */}
            <rect x="24" y="458" width="342" height="84" fill="rgba(19, 37, 48, 0.92)" stroke="#6EE7B7" strokeWidth="1.4" />
            <text x="40" y="488" fill="#6EE7B7" fontFamily={FONT_MONO} fontSize="15" fontWeight="700">
              LOKASI SAAT INI (SOLID)
            </text>
            <text x="40" y="520" fill={COLORS.ivory} fontFamily={FONT_SANS} fontSize="22" fontWeight="700">
              TN Ujung Kulon, Banten
            </text>

            <rect
              x="518"
              y="458"
              width="402"
              height="84"
              fill="rgba(19, 37, 48, 0.92)"
              stroke="#F59E0B"
              strokeWidth="1.4"
              strokeDasharray="6 4"
            />
            <text x="536" y="488" fill="#FCD34D" fontFamily={FONT_MONO} fontSize="15" fontWeight="700">
              GAGASAN · TAHAP KAJIAN
            </text>
            <text x="536" y="520" fill={COLORS.ivory} fontFamily={FONT_SANS} fontSize="22" fontWeight="700">
              Habitat Kedua (Belum Final)
            </text>
          </g>
        </g>

        {/* Bottom Editorial Clarification Card */}
        <g transform="translate(68, 990)">
          <rect x="0" y="0" width="944" height="530" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
          <rect x="0" y="0" width="944" height="54" fill="#1C2922" />
          <text x="26" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="1.5">
            MEMBEDAKAN GAGASAN ILMIAH VS KEPUTUSAN OPERASIONAL
          </text>

          <g transform="translate(32, 96)">
            <rect x="0" y="0" width="880" height="175" fill="#ECE8DF" stroke={COLORS.hairlineDark} strokeWidth="1" />
            <rect x="0" y="0" width="6" height="175" fill={COLORS.alertAmber} />
            <text x="28" y="42" fill={COLORS.alertAmber} fontFamily={FONT_MONO} fontSize="18" fontWeight="700">
              STATUS AKTUAL KEBIJAKAN
            </text>
            <text x="28" y="84" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="27" fontWeight="800">
              Belum ada keputusan final pemindahan massal
            </text>
            <text x="28" y="124" fill={COLORS.inkMuted} fontFamily={FONT_SANS} fontSize="21">
              Membangun populasi liar kedua (second wild population) merupakan
            </text>
            <text x="28" y="152" fill={COLORS.inkMuted} fontFamily={FONT_SANS} fontSize="21">
              rekomendasi konservasi yang masih dikaji secara bertahap dan ketat.
            </text>

            <text x="0" y="236" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="23" fontWeight="700">
              Mengapa gagasan penyelamatan ini memicu perdebatan?
            </text>
            <text x="0" y="276" fill={COLORS.inkMuted} fontFamily={FONT_SANS} fontSize="21">
              Antara urgensi keluar dari risiko satu lokasi vs kompleksitas biologis
            </text>
            <text x="0" y="308" fill={COLORS.inkMuted} fontFamily={FONT_SANS} fontSize="21">
              memindahkan spesies yang jumlahnya sangat kritis.
            </text>
          </g>

          <text x="32" y="496" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="16">
            SUMBER: KEMENTERIAN KEHUTANAN RI · IUCN SSC PHVA REPORT
          </text>
        </g>

        <text x="68" y="1600" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1">
          KOK ISO YO? · SERIAL BADAK JAWA (BAGIAN 1/4)
        </text>
      </svg>
    </div>
  );
};

/** S07 Clean Investigative Title Beat: "KOK ISO YO?" inside safe zone over subtle topo contours */
const ShotS07TitleBeat: React.FC<{ progress: number }> = ({ progress }) => {
  const drift = progress * 14;
  const lineReveal = easeOut(progress * 2.2);
  return (
    <div style={{ width: 1080, height: 1920, background: COLORS.paperBg, fontFamily: FONT_SANS }}>
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <EditorialPaperBackground idSuffix="s07" />

        {/* Subtle topographic elevation contour lines */}
        <g fill="none" stroke="rgba(30, 77, 50, 0.14)" strokeWidth="1.6" transform={`translate(0, ${-drift.toFixed(1)})`}>
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <ellipse
              key={idx}
              cx={540 + idx * 18}
              cy={930 - idx * 14}
              rx={220 + idx * 95}
              ry={140 + idx * 72}
              transform={`rotate(-12 540 930)`}
            />
          ))}
        </g>

        {/* Central Safe-Zone Editorial Title Card */}
        <g transform="translate(96, 695)">
          <rect x="0" y="0" width="324" height="36" fill={COLORS.forestAccent} />
          <text x="16" y="24" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="2">
            PERTANYAAN INVESTIGATIF
          </text>

          <text x="0" y="148" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="108" fontWeight="900" letterSpacing="-2">
            Kok Iso Yo?
          </text>

          <line
            x1="0"
            y1="194"
            x2={888 * lineReveal}
            y2="194"
            stroke={COLORS.landHighlight}
            strokeWidth="4"
          />

          <text x="0" y="248" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="22" fontWeight="700" letterSpacing="1.6">
            MENELUSURI KERENTANAN SPESIES DI SATU HABITAT
          </text>
          <text x="0" y="294" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="25" fontWeight="500">
            Dimulai dari fakta populasi yang tersisa di alam liar hari ini.
          </text>
        </g>

        <text x="96" y="1595" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1">
          KOK ISO YO? · SERIAL BADAK JAWA (BAGIAN 1/4)
        </text>
      </svg>
    </div>
  );
};

/** S10 & S11 Continuous Detailed TN Ujung Kulon Peninsula + 2026 Camera Trap Survey (~91) */
const ShotS10S11UjungKulonSurvey: React.FC<{ isS11: boolean; progress: number }> = ({ isS11, progress }) => {
  const revealedDots = isS11 ? Math.min(10, Math.max(2, Math.floor(2 + progress * 10))) : 10;
  const barReveal = isS11 ? easeOut(progress * 1.45) : 0;
  const zoomScale = isS11 ? 2.18 : 1.9 + easeOut(progress) * 0.28;

  const barLeft = 28;
  const barRight = 916;
  const barW = barRight - barLeft;
  const toX = (val: number) => barLeft + (val / 120) * barW;

  return (
    <div style={{ width: 1080, height: 1920, background: COLORS.paperBg, fontFamily: FONT_SANS }}>
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <EditorialPaperBackground idSuffix={isS11 ? "s11" : "s10"} />
        <EditorialTopHeader
          badge={isS11 ? "ESTIMASI SURVEI 2026" : "FAKTA · BALAI TNUK"}
          badgeColor={isS11 ? COLORS.alertAmber : COLORS.forestAccent}
          location="BANTEN · 6°45'S 105°20'E"
          title={isS11 ? "Survei Kamera Jebak 2026" : "Taman Nasional Ujung Kulon"}
        />

        {/* Detailed Peninsula Map */}
        <g transform="translate(68, 326)">
          <clipPath id="s10Clip">
            <rect x="0" y="0" width="944" height="620" />
          </clipPath>
          <rect x="0" y="0" width="944" height="620" fill={COLORS.oceanMid} stroke={COLORS.inkDark} strokeWidth="1.5" />
          <g clipPath="url(#s10Clip)">
            <g transform={`translate(${472 - 210 * zoomScale}, ${310 - 150 * zoomScale}) scale(${zoomScale})`}>
              <UjungKulonShapes showDots={isS11} revealedCount={revealedDots} />
              <text x="48" y="60" fill="rgba(246,244,238,0.68)" fontFamily={FONT_MONO} fontSize="8.5" letterSpacing="0.8">
                P. PANAITAN
              </text>
              <text x="122" y="232" fill="rgba(246,244,238,0.85)" fontFamily={FONT_MONO} fontSize="9.5" letterSpacing="1">
                SEMENANJUNG UJUNG KULON
              </text>
              <text x="275" y="122" fill="rgba(246,244,238,0.72)" fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.6">
                GN. HONJE
              </text>
            </g>

            {/* Water body labels */}
            <text x="36" y="62" fill="rgba(167,215,177,0.75)" fontFamily={FONT_MONO} fontSize="16" letterSpacing="2">
              SELAT SUNDA
            </text>
            <text x="36" y="582" fill="rgba(167,215,177,0.75)" fontFamily={FONT_MONO} fontSize="16" letterSpacing="2">
              SAMUDERA HINDIA
            </text>
            {isS11 && (
              <g transform="translate(620, 28)">
                <rect x="0" y="0" width="296" height="44" fill="rgba(19,37,48,0.9)" stroke="#FDE68A" strokeWidth="1.2" />
                <circle cx="22" cy="22" r="5" fill="#FDE68A" />
                <text x="38" y="28" fill="#FDE68A" fontFamily={FONT_MONO} fontSize="15" fontWeight="700">
                  TITIK KAMERA JEBAK AKTIF
                </text>
              </g>
            )}
          </g>
        </g>

        {/* Bottom Panel: Either TNUK Reserve Profile (S10) or Camera Trap 2026 Distribution (S11) */}
        <g transform="translate(68, 990)">
          <rect x="0" y="0" width="944" height="548" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
          <rect x="0" y="0" width="944" height="54" fill="#1C2922" />
          <text x="26" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="19" fontWeight="700" letterSpacing="1.6">
            {isS11
              ? "HASIL SURVEI KAMERA JEBAK 2026 (ESTIMASI ILMIAH)"
              : "PROFIL KAWASAN KONSERVASI TN UJUNG KULON"}
          </text>

          {!isS11 ? (
            <g transform="translate(32, 100)">
              <text x="0" y="0" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="17" letterSpacing="1">
                KOMPONEN EKOSISTEM UTAMA
              </text>
              {[
                { k: "Semenanjung Ujung Kulon", v: "Habitat inti hutan hujan dataran rendah & kubangan alami" },
                { k: "Blok Gunung Honje", v: "Koridor timur & lokasi fasilitas JRSCA internal TNUK" },
                { k: "Pulau Panaitan", v: "Kawasan kepulauan penyangga dalam gugus taman nasional" },
              ].map((row, idx) => (
                <g key={row.k} transform={`translate(0, ${28 + idx * 102})`}>
                  <rect x="0" y="0" width="880" height="82" fill="#ECE8DF" stroke={COLORS.hairlineDark} strokeWidth="1" />
                  <rect x="0" y="0" width="5" height="82" fill={COLORS.forestAccent} />
                  <text x="24" y="34" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="24" fontWeight="800">
                    {row.k}
                  </text>
                  <text x="24" y="64" fill={COLORS.inkMuted} fontFamily={FONT_SANS} fontSize="20">
                    {row.v}
                  </text>
                </g>
              ))}
            </g>
          ) : (
            <g transform="translate(0, 124)">
              <text x="916" y="-32" textAnchor="end" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="15" letterSpacing="1">
                SKALA: JUMLAH INDIVIDU (0 – 120)
              </text>
              {[0, 30, 60, 90, 120].map((v) => {
                const x = toX(v);
                return (
                  <g key={v}>
                    <line x1={x} y1="0" x2={x} y2="255" stroke="rgba(20,29,24,0.12)" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={x} y="-12" textAnchor="middle" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="17">
                      {v}
                    </text>
                  </g>
                );
              })}

              <text x="28" y="34" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="24" fontWeight="700">
                Estimasi Terbaik Survei Kamera Jebak 2026
              </text>
              <rect x={barLeft} y="56" width={barW} height="44" fill="rgba(20,29,24,0.07)" />
              <rect
                x={toX(74)}
                y="56"
                width={(toX(99) - toX(74)) * barReveal}
                height="44"
                fill="rgba(180, 83, 9, 0.32)"
                stroke={COLORS.alertAmber}
                strokeWidth="2.2"
              />
              <line x1={toX(91)} y1="40" x2={toX(91)} y2="116" stroke={COLORS.landHighlight} strokeWidth="4.5" />
              <circle cx={toX(91)} cy="78" r="10" fill={COLORS.landHighlight} />

              <text x={toX(74) - 20} y="88" textAnchor="end" fill={COLORS.landHighlight} fontFamily={FONT_MONO} fontSize="34" fontWeight="800">
                ~91 EKOR
              </text>

              <rect x="28" y="152" width="888" height="126" fill="#ECE8DF" stroke={COLORS.hairlineDark} strokeWidth="1" />
              <text x="52" y="192" fill={COLORS.inkDark} fontFamily={FONT_MONO} fontSize="20" fontWeight="700">
                RENTANG KETIDAKPASTIAN SURVEI: 74 – 99 INDIVIDU
              </text>
              <text x="52" y="226" fill={COLORS.inkMuted} fontFamily={FONT_SANS} fontSize="19">
                Estimasi dihitung dari deteksi kamera jebak ilmiah — bukan sensus hitung
              </text>
              <text x="52" y="254" fill={COLORS.inkMuted} fontFamily={FONT_SANS} fontSize="19">
                kepala absolut di seluruh kawasan taman nasional.
              </text>
            </g>
          )}

          <line x1="28" y1="464" x2="916" y2="464" stroke={COLORS.hairlineDark} strokeWidth="1" />
          <text x="28" y="498" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="16.5">
            SUMBER: BALAI TN UJUNG KULON · KEMENTERIAN KEHUTANAN RI (2026)
          </text>
        </g>

        <text x="68" y="1600" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1">
          KOK ISO YO? · SERIAL BADAK JAWA (BAGIAN 1/4)
        </text>
      </svg>
    </div>
  );
};

/** S13 & S14 Continuous Sunda Strait Geographic Proximity & Tsunami/Eruption Risk Contours */
const ShotS13S14SundaHazardMap: React.FC<{ isS14: boolean; progress: number }> = ({ isS14, progress }) => {
  const zoom = isS14 ? 0.94 : 1.06 - easeOut(progress) * 0.12;
  const ringGrow = isS14 ? easeOut(progress) : 0;

  return (
    <div style={{ width: 1080, height: 1920, background: COLORS.paperBg, fontFamily: FONT_SANS }}>
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <EditorialPaperBackground idSuffix={isS14 ? "s14" : "s13"} />
        <EditorialTopHeader
          badge={isS14 ? "KAJIAN RISIKO · IUCN PHVA" : "FAKTA GEOGRAFIS · BIG / PVMBG"}
          badgeColor={isS14 ? COLORS.alertRed : COLORS.oceanDeep}
          location="SELAT SUNDA · BANTEN"
          title={isS14 ? "Ancaman Tsunami & Vulkanik" : "Kedekatan Risiko Geologis"}
        />

        {/* Sunda Strait Bathymetry Map Panel */}
        <g transform="translate(68, 326)">
          <clipPath id="s13Clip">
            <rect x="0" y="0" width="944" height="650" />
          </clipPath>
          <rect x="0" y="0" width="944" height="650" fill={COLORS.oceanMid} stroke={COLORS.inkDark} strokeWidth="1.5" />
          <g clipPath="url(#s13Clip)">
            <g transform={`translate(${472 * (1 - zoom)}, ${325 * (1 - zoom)}) scale(${zoom})`}>
              {/* Sumatra South Tip */}
              <path d="M 35,35 L 330,35 L 265,195 L 145,210 L 35,145 Z" fill="#4E6155" stroke="#8CA695" strokeWidth="1.5" />
              <text x="64" y="96" fill="rgba(246,244,238,0.68)" fontFamily={FONT_MONO} fontSize="17" letterSpacing="2">
                SUMATRA SELATAN
              </text>

              {/* West Java & Ujung Kulon */}
              <path
                d="M 555,275 L 760,240 L 895,315 L 895,595 L 520,595 L 475,510 L 370,530 L 340,460 L 472,400 Z"
                fill="#3B6846"
                stroke="#BFE0C5"
                strokeWidth="2"
              />
              {/* Panaitan Island */}
              <path d="M 332,370 L 385,355 L 408,395 L 368,425 L 328,402 Z" fill="#4E7957" stroke="#A7C9AC" strokeWidth="1.3" />
              <text x="530" y="458" fill="#D1FAE5" fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="1.6">
                TN UJUNG KULON
              </text>

              {/* Distance baseline Anak Krakatau <-> Ujung Kulon */}
              <line x1="292" y1="290" x2="438" y2="412" stroke="#FCD34D" strokeWidth="2.4" strokeDasharray="6 5" />
              <rect x="336" y="318" width="136" height="32" fill="rgba(19, 37, 48, 0.9)" stroke="#FCD34D" strokeWidth="1" />
              <text x="404" y="340" textAnchor="middle" fill="#FDE68A" fontFamily={FONT_MONO} fontSize="16" fontWeight="700">
                ±50–60 KM
              </text>

              {/* Clinical Tsunami / Volcanic Contours in S14 */}
              {isS14 && (
                <g opacity={0.35 + ringGrow * 0.65}>
                  <circle cx="292" cy="290" r={95 + ringGrow * 85} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="7 5" />
                  <circle cx="292" cy="290" r={155 + ringGrow * 125} fill="none" stroke="rgba(239,68,68,0.68)" strokeWidth="1.8" strokeDasharray="8 5" />
                  <circle cx="292" cy="290" r={220 + ringGrow * 140} fill="none" stroke="rgba(245,158,11,0.52)" strokeWidth="1.6" strokeDasharray="6 6" />
                </g>
              )}

              {/* Gunung Anak Krakatau */}
              <circle cx="292" cy="290" r="24" fill="rgba(239,68,68,0.28)" stroke="#EF4444" strokeWidth="2" />
              <polygon points="292,276 305,299 279,299" fill="#FCA5A5" />
              <text x="155" y="250" fill="#FCA5A5" fontFamily={FONT_MONO} fontSize="17" fontWeight="700">
                GN. ANAK KRAKATAU
              </text>
            </g>
          </g>
        </g>

        {/* Bottom Scientific Risk Summary */}
        <g transform="translate(68, 1020)">
          <rect x="0" y="0" width="944" height="515" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
          <rect x="0" y="0" width="944" height="54" fill="#1C2922" />
          <text x="26" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="1.5">
            {isS14
              ? "SIMULASI KORIDOR BAHAYA PESISIR & VULKANIK"
              : "POSISI GEOGRAFIS BENTENG TERAKHIR"}
          </text>

          <SvgHtmlTextBox x={32} y={82} width={880} height={376}>
            <div style={{ color: COLORS.inkDark }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 40, fontWeight: 800, color: isS14 ? COLORS.alertRed : COLORS.landHighlight }}>
                ±50 – 60 KM
              </div>
              <div style={{ fontSize: 22.5, fontWeight: 700, marginTop: 6, lineHeight: 1.35 }}>
                Jarak Semenanjung Ujung Kulon dari kaldera Gunung Anak Krakatau
              </div>
              <div style={{ height: 1, background: COLORS.hairlineDark, margin: "18px 0" }} />
              <div style={{ fontSize: 21, lineHeight: 1.55 }}>
                <div>
                  {isS14
                    ? "• Dataran rendah pesisir TNUK menghadap langsung ke koridor Selat Sunda"
                    : "• Benteng terisolasi di ujung barat Pulau Jawa membatasi penyebaran alami"}
                </div>
                <div style={{ marginTop: 8 }}>
                  {isS14
                    ? "• Erupsi besar atau tsunami berisiko melumpuhkan habitat utama serentak"
                    : "• Satu peristiwa berskala regional langsung menyentuh 100% populasi liar"}
                </div>
              </div>
              <div style={{ fontSize: 18.5, color: COLORS.inkMuted, marginTop: 18, lineHeight: 1.4 }}>
                Catatan: Visual menunjukkan kontur jarak &amp; risiko kajian geologis, bukan prediksi kejadian bencana spesifik.
              </div>
            </div>
          </SvgHtmlTextBox>

          <text x="32" y="482" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="16">
            SUMBER: PVMBG · BADAN INFORMASI GEOSPASIAL · IUCN SSC JAVAN RHINO PHVA
          </text>
        </g>

        <text x="68" y="1600" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1">
          KOK ISO YO? · SERIAL BADAK JAWA (BAGIAN 1/4)
        </text>
      </svg>
    </div>
  );
};

/** S16 "0% Backup" Dual Compartment Comparison Diagram */
const ShotS16ZeroBackupView: React.FC<{ progress: number }> = ({ progress }) => {
  const reveal = easeOut(progress * 1.8);
  return (
    <div style={{ width: 1080, height: 1920, background: COLORS.paperBg, fontFamily: FONT_SANS }}>
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <EditorialPaperBackground idSuffix="s16" />
        <EditorialTopHeader
          badge="FAKTA · IUCN RED LIST"
          badgeColor={COLORS.alertRed}
          location="STATUS POPULASI LIAR"
          title="Tanpa Populasi Cadangan"
        />

        {/* Two-Compartment Analytical Diagram */}
        <g transform="translate(68, 340)">
          {/* SLOT 1: Ujung Kulon */}
          <rect x="0" y="0" width="944" height="445" fill="#182A21" stroke={COLORS.inkDark} strokeWidth="2" />
          <rect x="0" y="0" width="10" height="445" fill="#4C8C5A" />
          <text x="40" y="54" fill="#A7D7B1" fontFamily={FONT_MONO} fontSize="20" fontWeight="700" letterSpacing="2">
            KOMPARTEMEN 01 · HABITAT UTAMA SAAT INI
          </text>
          <text x="40" y="112" fill={COLORS.ivory} fontFamily={FONT_SANS} fontSize="40" fontWeight="800">
            TN Ujung Kulon, Banten
          </text>
          <text x="40" y="232" fill="#E8D5AE" fontFamily={FONT_MONO} fontSize="92" fontWeight="800">
            ~91 EKOR
          </text>
          <text x="40" y="286" fill="rgba(246,244,238,0.85)" fontFamily={FONT_MONO} fontSize="20">
            ESTIMASI SURVEI 2026 (RENTANG 74–99) · KEMENHUT 87–100 EKOR
          </text>
          <rect x="40" y="330" width="864" height="36" fill="rgba(255,255,255,0.12)" />
          <rect x="40" y="330" width={864 * reveal} height="36" fill="#4C8C5A" />
          <text x="40" y="405" fill="#A7D7B1" fontFamily={FONT_MONO} fontSize="21" fontWeight="700">
            PANGSA POPULASI LIAR DUNIA: 100%
          </text>

          {/* Broken dashed link between Compartment 1 & Compartment 2 */}
          <line x1="472" y1="445" x2="472" y2="545" stroke={COLORS.alertRed} strokeWidth="3" strokeDasharray="8 7" />
          <rect x="332" y="476" width="280" height="38" fill={COLORS.paperBg} stroke={COLORS.alertRed} strokeWidth="1.6" />
          <text x="472" y="502" textAnchor="middle" fill={COLORS.alertRed} fontFamily={FONT_MONO} fontSize="17" fontWeight="700">
            TIDAK ADA KONEKSI CADANGAN
          </text>

          {/* SLOT 2: Second Population = 0 */}
          <g transform="translate(0, 545)">
            <rect
              x="0"
              y="0"
              width="944"
              height="445"
              fill={COLORS.ivory}
              stroke={COLORS.alertRed}
              strokeWidth="2.2"
              strokeDasharray="10 6"
            />
            <text x="40" y="54" fill={COLORS.alertRed} fontFamily={FONT_MONO} fontSize="20" fontWeight="700" letterSpacing="2">
              KOMPARTEMEN 02 · POPULASI LIAR KEDUA
            </text>
            <text x="40" y="112" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="40" fontWeight="800">
              Lokasi Lain di Alam Liar
            </text>
            <text x="40" y="232" fill={COLORS.alertRed} fontFamily={FONT_MONO} fontSize="96" fontWeight="800">
              0 EKOR
            </text>
            <text x="40" y="286" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="20">
              BELUM ADA POPULASI CADANGAN (0% WILD BACKUP)
            </text>
            <rect x="40" y="330" width="864" height="36" fill="rgba(220,38,38,0.1)" stroke="rgba(220,38,38,0.4)" strokeWidth="1.2" strokeDasharray="6 4" />
            <text x="40" y="405" fill={COLORS.inkDark} fontFamily={FONT_SANS} fontSize="22" fontWeight="600">
              Seluruh masa depan spesies bertumpu pada satu ekosistem tunggal.
            </text>
          </g>
        </g>

        <text x="68" y="1420" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="17">
          SUMBER: IUCN RED LIST · PEMANTAUAN KEMENHUT RI / BALAI TNUK (2026)
        </text>
        <text x="68" y="1600" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="18" letterSpacing="1">
          KOK ISO YO? · SERIAL BADAK JAWA (BAGIAN 1/4)
        </text>
      </svg>
    </div>
  );
};

/** S17 Silent Closing Bridge to Episode 003 (Part 2/4) */
const ShotS17ClosingBridge: React.FC<{ progress: number }> = ({ progress }) => {
  const dashDraw = easeOut(progress * 1.4);
  return (
    <div style={{ width: 1080, height: 1920, background: "#101813", fontFamily: FONT_SANS }}>
      <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
        <rect width="1080" height="1920" fill="#101813" />
        {/* Subtle grid */}
        <g opacity="0.22">
          {[320, 640, 960, 1280].map((y) => (
            <line key={y} x1="0" y1={y} x2="1080" y2={y} stroke="#4C8C5A" strokeWidth="1" />
          ))}
        </g>

        {/* Eastward Java dashed teaser map (strictly clipped inside viewport) */}
        <g transform="translate(68, 340)">
          <clipPath id="s17Clip">
            <rect x="0" y="0" width="944" height="440" />
          </clipPath>
          <rect x="0" y="0" width="944" height="440" fill="#132530" stroke="rgba(232,213,174,0.35)" strokeWidth="1.5" />
          <g clipPath="url(#s17Clip)">
            <g transform="translate(-410, -560) scale(2.15)">
              <ArchipelagoPolygons />
              <circle cx="308" cy="412" r="7" fill="#6EE7B7" />
              <path
                d="M 314,410 Q 470,352 622,444"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.2"
                strokeDasharray="7 5"
                pathLength={100}
                strokeDashoffset={100 - dashDraw * 100}
              />
              <circle cx="624" cy="446" r="12" fill="rgba(245,158,11,0.22)" stroke="#FCD34D" strokeWidth="1.4" strokeDasharray="3 3" opacity={dashDraw} />
            </g>
            <rect x="0" y="384" width="944" height="56" fill="rgba(16, 24, 19, 0.82)" />
            <text x="28" y="418" fill={COLORS.goldLight} fontFamily={FONT_MONO} fontSize="16" letterSpacing="1.2">
              EPISODE BERIKUTNYA · KAJIAN HABITAT KEDUA (TAHAP WACANA)
            </text>
          </g>
        </g>

        {/* Closing Serial Card */}
        <g transform="translate(68, 860)">
          <rect x="0" y="0" width="330" height="40" fill="#1E4D32" />
          <text x="18" y="27" fill="#E8D5AE" fontFamily={FONT_MONO} fontSize="19" fontWeight="700" letterSpacing="2">
            LANJUT KE BAGIAN 2/4
          </text>

          <text x="0" y="114" fill={COLORS.ivory} fontFamily={FONT_SANS} fontSize="46" fontWeight="800">
            Ke Mana Habitat Kedua Mulai Dikaji?
          </text>
          <text x="0" y="172" fill="rgba(246,244,238,0.84)" fontFamily={FONT_SANS} fontSize="27" fontWeight="400">
            Mengapa pemindahannya bukan perkara sederhana,
          </text>
          <text x="0" y="214" fill="rgba(246,244,238,0.84)" fontFamily={FONT_SANS} fontSize="27" fontWeight="400">
            dan apa fakta di balik kematian Musofa di JRSCA?
          </text>

          <line x1="0" y1="274" x2="944" y2="274" stroke={COLORS.hairlineLight} strokeWidth="1.2" />
          <text x="0" y="324" fill={COLORS.gold} fontFamily={FONT_MONO} fontSize="20" fontWeight="700" letterSpacing="2.4">
            KOK ISO YO? · DOKUMENTER &amp; SAINS INVESTIGATIF
          </text>
        </g>
      </svg>
    </div>
  );
};

/** Unified shot overlay / 2D canvas router for all 17 Episode 002 shots. */
export const Episode002OverlayRouter: React.FC<{
  shotId: Ep002ShotId;
  progress: number;
}> = ({ shotId, progress }) => {
  switch (shotId) {
    // 3D Shots (editorial overlays over StageDoc3D PBR scenes)
    case "S01":
      return <Pol1HeaderOverlay progress={progress} />;
    case "S04":
      return (
        <ForestLowerThird
          tag="RISIKO SATU EKOSISTEM"
          title="Ketergantungan Tunggal di Lantai Hutan"
          subtitle="Satu gangguan ekologi atau pengelolaan berdampak pada seluruh spesies"
          progress={progress}
        />
      );
    case "S06":
      return <Pol2CloseupOverlay />;
    case "S08":
      return <Pol3TaxonomyOverlay />;
    case "S12":
      return (
        <ForestLowerThird
          tag="BENTENG TERAKHIR · TN UJUNG KULON"
          title="Semenanjung Pesisir di Ujung Barat Jawa"
          subtitle="Satu-satunya kawasan yang menjaga kelangsungan Badak Jawa di alam liar"
          progress={progress}
        />
      );
    case "S15":
      return <Pol5ThreatOverlay />;

    // Pure 2D Editorial & Cartographic Shots (zero ThreeCanvas mount!)
    case "S02":
      return <ShotS02S03MapView isS03={false} progress={progress} />;
    case "S03":
      return <ShotS02S03MapView isS03={true} progress={progress} />;
    case "S05":
      return <ShotS05WacanaMap progress={progress} />;
    case "S07":
      return <ShotS07TitleBeat progress={progress} />;
    case "S09":
      return <Pol4PopulationMapView progress={progress} />;
    case "S10":
      return <ShotS10S11UjungKulonSurvey isS11={false} progress={progress} />;
    case "S11":
      return <ShotS10S11UjungKulonSurvey isS11={true} progress={progress} />;
    case "S13":
      return <ShotS13S14SundaHazardMap isS14={false} progress={progress} />;
    case "S14":
      return <ShotS13S14SundaHazardMap isS14={true} progress={progress} />;
    case "S16":
      return <ShotS16ZeroBackupView progress={progress} />;
    case "S17":
      return <ShotS17ClosingBridge progress={progress} />;
    default: {
      const _exhaustive: never = shotId;
      void _exhaustive;
      return null;
    }
  }
};

export function getShotRepresentativeFrames(): { id: Ep002ShotId; frame: number; title: string }[] {
  return EP002_SHOTS.map((s) => ({
    id: s.id,
    frame: Math.round(s.start + (s.end - s.start) * 0.55),
    title: s.title,
  }));
}
