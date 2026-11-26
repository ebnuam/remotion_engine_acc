// Editorial Views & Overlays for Episode 004 (Bagian 3/4 — Krisis Genetik, Batas JRSCA & Akuntabilitas)
// Uses SvgHtmlTextBox (<foreignObject>) across all text containers to guarantee zero column overflow.

import React from "react";
import {
  COLORS,
  EditorialTopHeader,
  FONT_MONO,
  SvgHtmlTextBox,
  UjungKulonShapes,
} from "../../episode002_badak_jawa/editorial/EditorialTheme";
import {
  SeriesClosingBridgeCard,
  SeriesLowerThird,
  SeriesOpeningCard,
  SeriesPaperShell,
  easeOut,
} from "./SeriesCommon";

export const Ep004ShotRouter: React.FC<{ shotId: string; progress: number }> = ({ shotId, progress }) => {
  switch (shotId) {
    case "E4_S01":
      return (
        <SeriesOpeningCard
          partLabel="SERIAL BADAK JAWA · BAGIAN 3/4"
          titleLine1="Krisis Genetik, Batas JRSCA"
          titleLine2="& Siapa Bertanggung Jawab?"
          contextLine="Selain risiko pemindahan, isolasi satu kawasan memicu ancaman genetik jangka panjang."
          progress={progress}
        />
      );

    case "E4_S02":
      return (
        <SeriesPaperShell idSuffix="e4_s02">
          <EditorialTopHeader
            badge="KAJIAN ILMIAH · GENETIKA KONSERVASI"
            badgeColor={COLORS.forestAccent}
            location="POPULASI TERKONSENTRASI"
            title="Masalah Genetik Populasi Tunggal"
          />
          <g transform="translate(68, 340)">
            <rect x="0" y="0" width="944" height="600" fill="#182A21" stroke={COLORS.inkDark} strokeWidth="1.8" />
            <circle cx="472" cy="270" r="190" fill="rgba(76,140,90,0.16)" stroke="#6EE7B7" strokeWidth="2" strokeDasharray="7 5" />
            <text x="472" y="130" textAnchor="middle" fill="#A7D7B1" fontFamily={FONT_MONO} fontSize="18" fontWeight="700">
              KELOMPOK GENETIK TERTUTUP (TANPA PERTUKARAN LUAR)
            </text>
            {[
              [400, 230], [540, 230], [340, 310], [472, 315], [600, 310], [420, 385], [528, 385],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="16" fill="#E8D5AE" />
            ))}
            <SvgHtmlTextBox x={40} y={505} width={864} height={76}>
              <div style={{ textAlign: "center", fontSize: 23, fontWeight: 600, color: COLORS.ivory, lineHeight: 1.35 }}>
                Terpusat di satu wilayah membatasi aliran variasi genetik alami.
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E4_S03": {
      const nodes: [number, number, string][] = [
        [310, 210, "A1"],
        [634, 210, "A2"],
        [472, 355, "B1"],
        [360, 495, "C1"],
        [584, 495, "C2"],
      ];
      return (
        <SeriesPaperShell idSuffix="e4_s03">
          <EditorialTopHeader
            badge="KAJIAN ILMIAH · INBREEDING"
            badgeColor={COLORS.alertAmber}
            location="POPULASI KECIL"
            title="Peluang Perkawinan Kekerabatan"
          />
          <g transform="translate(68, 340)">
            <rect x="0" y="0" width="944" height="650" fill="#132530" stroke={COLORS.inkDark} strokeWidth="1.8" />
            <g stroke="#F59E0B" strokeWidth="2.4" opacity={0.45 + 0.55 * easeOut(progress * 2)}>
              <line x1="310" y1="210" x2="472" y2="355" />
              <line x1="634" y1="210" x2="472" y2="355" />
              <line x1="472" y1="355" x2="360" y2="495" />
              <line x1="472" y1="355" x2="584" y2="495" />
              <line x1="360" y1="495" x2="584" y2="495" stroke="#EF4444" strokeDasharray="6 4" strokeWidth="3" />
            </g>
            {nodes.map(([x, y, lbl]) => (
              <g key={lbl}>
                <circle cx={x} cy={y} r="32" fill="#1E4D32" stroke="#E8D5AE" strokeWidth="2" />
                <text x={x} y={y + 7} textAnchor="middle" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="20" fontWeight="800">
                  {lbl}
                </text>
              </g>
            ))}
            <SvgHtmlTextBox x={40} y={562} width={864} height={70}>
              <div style={{ textAlign: "center", fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: "#FCA5A5", lineHeight: 1.35 }}>
                KAWIN KERABAT MENINGKAT SAAT JUMLAH INDIVIDU SANGAT TERBATAS
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );
    }

    case "E4_S04": {
      const reveal = easeOut(progress * 1.6);
      return (
        <SeriesPaperShell idSuffix="e4_s04">
          <EditorialTopHeader
            badge="MODEL KONSEPTUAL GENETIKA"
            badgeColor={COLORS.alertAmber}
            location="PROYEKSI JANGKA PANJANG"
            title="Penurunan Keragaman & Reproduksi"
          />
          <g transform="translate(68, 340)">
            <rect x="0" y="0" width="944" height="630" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
            <rect x="0" y="0" width="944" height="54" fill="#1C2922" />
            <text x="28" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="17.5" fontWeight="700">
              KURVA KONSEPTUAL DAMPAK BOTTLENECK GENETIK (TANPA ANGKA FIKTIF)
            </text>
            <line x1="110" y1="130" x2="110" y2="490" stroke={COLORS.inkDark} strokeWidth="2.5" />
            <line x1="110" y1="490" x2="860" y2="490" stroke={COLORS.inkDark} strokeWidth="2.5" />
            <text x="130" y="148" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="17">
              KERAGAMAN GENETIK &amp; KAPASITAS REPRODUKSI
            </text>
            <text x="860" y="528" textAnchor="end" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="17">
              WAKTU (GENERASI DALAM ISOLASI) →
            </text>
            <path
              d="M 120,185 C 320,210 520,310 830,445"
              fill="none"
              stroke={COLORS.landHighlight}
              strokeWidth="6"
              pathLength={100}
              strokeDashoffset={100 - reveal * 100}
            />
            <text x="32" y="592" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="16">
              SUMBER: PRINSIP GENETIKA KONSERVASI · KAJIAN NON-INVASIF DNA BADAK JAWA
            </text>
          </g>
        </SeriesPaperShell>
      );
    }

    case "E4_S05":
      return (
        <SeriesPaperShell idSuffix="e4_s05">
          <EditorialTopHeader
            badge="ESTIMASI DATASET · KEMENHUT"
            badgeColor={COLORS.alertAmber}
            location="DATA PEMANTAUAN YANG DIKAJI"
            title="Indikasi Tekanan Reproduksi"
          />
          <g transform="translate(68, 345)">
            <rect x="0" y="0" width="944" height="660" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.8" />
            <rect x="0" y="0" width="944" height="56" fill="#1C2922" />
            <text x="28" y="35" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700">
              PROPORSI BETINA DALAM DATA YANG DIKAJI KEMENTERIAN KEHUTANAN
            </text>
            <SvgHtmlTextBox x={40} y={84} width={864} height={540}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 112, fontWeight: 800, color: COLORS.landHighlight, lineHeight: 1 }}>
                  ~55%
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.inkDark, marginTop: 14, lineHeight: 1.25 }}>
                  betina dalam data yang dikaji tercatat tidak produktif
                </div>
                <div style={{ height: 42, background: "rgba(20,29,24,0.1)", marginTop: 22, width: "100%" }}>
                  <div style={{ height: "100%", width: `${55 * easeOut(progress * 2)}%`, background: COLORS.landHighlight }} />
                </div>
                <div
                  style={{
                    background: "#ECE8DF",
                    border: `1px solid ${COLORS.hairlineDark}`,
                    padding: "18px 22px",
                    marginTop: 28,
                  }}
                >
                  <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: COLORS.inkDark }}>
                    CATATAN CAKUPAN METODOLOGI:
                  </div>
                  <div style={{ fontSize: 19.5, color: COLORS.inkMuted, marginTop: 6, lineHeight: 1.4 }}>
                    Angka ini merujuk pada subset individu betina dalam data pemantauan yang dikaji Kemenhut — bukan sensus medis menyeluruh di luar dataset tersebut.
                  </div>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: COLORS.inkMuted, marginTop: 22 }}>
                  SUMBER: KETERANGAN RESMI KEMENTERIAN KEHUTANAN RI / BALAI TNUK
                </div>
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E4_S06":
      return (
        <SeriesPaperShell idSuffix="e4_s06">
          <EditorialTopHeader
            badge="PROGRAM INTERNAL TNUK · JRSCA"
            badgeColor={COLORS.forestAccent}
            location="BLOK GUNUNG HONJE · BANTEN"
            title="Javan Rhino Study &amp; Conservation Area"
          />
          <g transform="translate(68, 326)">
            <clipPath id="clipE4S06">
              <rect x="0" y="0" width="944" height="540" />
            </clipPath>
            <rect x="0" y="0" width="944" height="540" fill={COLORS.oceanMid} stroke={COLORS.inkDark} strokeWidth="1.5" />
            <g clipPath="url(#clipE4S06)">
              <g transform="translate(-30, -30) scale(2.4)">
                <UjungKulonShapes showDots={false} />
                <circle cx="304" cy="144" r="24" fill="rgba(253,230,138,0.22)" stroke="#FDE68A" strokeWidth="1.8" />
                <circle cx="304" cy="144" r="6" fill="#FDE68A" />
              </g>
              <rect x="28" y="28" width="520" height="86" fill="rgba(16,26,23,0.92)" stroke="#FDE68A" strokeWidth="1.4" />
              <SvgHtmlTextBox x={44} y={36} width={488} height={70}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 15.5, fontWeight: 700, color: "#FDE68A" }}>
                    JRSCA · DI DALAM KAWASAN TN UJUNG KULON
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 700, color: COLORS.ivory, marginTop: 4 }}>
                    Blok Gunung Honje (±5.100 ha)
                  </div>
                </div>
              </SvgHtmlTextBox>
            </g>
          </g>
          <g transform="translate(68, 905)">
            <rect x="0" y="0" width="944" height="450" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
            <SvgHtmlTextBox x={36} y={34} width={872} height={382}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 800, color: COLORS.forestAccent }}>
                  FOKUS PROGRAM JRSCA (INTERNAL UJUNG KULON)
                </div>
                <div style={{ fontSize: 23, fontWeight: 700, color: COLORS.inkDark, marginTop: 22, lineHeight: 1.55 }}>
                  <div>• Pengelolaan kesehatan dan reproduksi Badak Jawa</div>
                  <div style={{ marginTop: 12 }}>• Studi genetika konservasi &amp; dukungan biobank bersama IPB</div>
                  <div style={{ marginTop: 12, color: COLORS.inkMuted, fontWeight: 500 }}>
                    • Tetap berada di kawasan Ujung Kulon, bukan lokasi pulau atau wilayah baru
                  </div>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: COLORS.inkMuted, marginTop: 44 }}>
                  SUMBER: KEMENTERIAN KEHUTANAN RI · BALAI TN UJUNG KULON
                </div>
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E4_S07":
      return (
        <SeriesLowerThird
          badge="PROGRAM JRSCA · UJUNG KULON"
          title="Pengelolaan Kesehatan &amp; Genetika Satwa"
          subtitle="Fasilitas studi &amp; konservasi terkelola di dalam Blok Gunung Honje, TNUK"
          progress={progress}
        />
      );

    case "E4_S08":
      return (
        <SeriesPaperShell idSuffix="e4_s08">
          <EditorialTopHeader
            badge="BATASAN KEBIJAKAN"
            badgeColor={COLORS.alertAmber}
            location="JRSCA ≠ HABITAT KEDUA EKSTERNAL"
            title="Belum Menjawab Habitat Kedua"
          />
          <g transform="translate(68, 350)">
            <rect x="0" y="0" width="944" height="580" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
            <rect x="36" y="48" width="420" height="480" fill="#182A21" />
            <SvgHtmlTextBox x={64} y={84} width={364} height={410}>
              <div style={{ color: COLORS.ivory }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: "#A7D7B1" }}>PROGRAM JRSCA</div>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, marginTop: 22 }}>
                  Mengelola kesehatan &amp; reproduksi di TNUK
                </div>
                <div style={{ fontSize: 22, color: COLORS.goldLight, marginTop: 28, lineHeight: 1.45 }}>
                  Berada di kawasan ekosistem yang sama di Ujung Kulon.
                </div>
              </div>
            </SvgHtmlTextBox>

            <rect x="488" y="48" width="420" height="480" fill="#ECE8DF" stroke={COLORS.alertAmber} strokeWidth="2" strokeDasharray="8 6" />
            <SvgHtmlTextBox x={516} y={84} width={364} height={410}>
              <div style={{ color: COLORS.inkDark }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: COLORS.alertAmber }}>HABITAT KEDUA</div>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, marginTop: 22 }}>
                  Populasi liar mandiri di wilayah geografis lain
                </div>
                <div style={{ fontSize: 22, color: COLORS.inkMuted, marginTop: 28, lineHeight: 1.45 }}>
                  Memerlukan pembuktian kelayakan jangka panjang tersendiri.
                </div>
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E4_S09":
      return (
        <SeriesLowerThird
          badge="SYARAT KELAYAKAN"
          title="Bukan Sekadar Hutan yang Terlihat Cocok"
          subtitle="Tutupan hijau semata belum menjamin daya dukung ekologis Badak Jawa"
          progress={progress}
        />
      );

    case "E4_S10":
      return (
        <SeriesPaperShell idSuffix="e4_s10">
          <EditorialTopHeader
            badge="STANDAR BUKTI ILMIAH"
            badgeColor={COLORS.forestAccent}
            location="VIABILITAS JANGKA PANJANG"
            title="Bukti Daya Topang Ekosistem"
          />
          <g transform="translate(68, 350)">
            {[
              ["01 · DAYA DUKUNG PAKAN", "Ketersediaan jangka panjang puluhan spesies pakan alami"],
              ["02 · BEBAS KOMPETISI & PATOGEN", "Aman dari penularan penyakit ternak maupun satwa domestik"],
              ["03 · PERTUMBUHAN POPULASI", "Bukti ilmiah bahwa lokasi mampu menopang kelahiran generasi baru"],
            ].map(([h, b], i) => (
              <g key={h} transform={`translate(0, ${i * 224})`}>
                <rect x="0" y="0" width="944" height="190" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
                <rect x="0" y="0" width="8" height="190" fill={COLORS.forestAccent} />
                <SvgHtmlTextBox x={32} y={24} width={880} height={142}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 21, fontWeight: 800, color: COLORS.forestAccent }}>{h}</div>
                    <div style={{ fontSize: 23, fontWeight: 600, color: COLORS.inkDark, marginTop: 12, lineHeight: 1.35 }}>{b}</div>
                  </div>
                </SvgHtmlTextBox>
              </g>
            ))}
          </g>
        </SeriesPaperShell>
      );

    case "E4_S11":
      return (
        <SeriesPaperShell idSuffix="e4_s11">
          <EditorialTopHeader
            badge="TATA KELOLA &amp; AKUNTABILITAS"
            badgeColor={COLORS.alertRed}
            location="PERTANYAAN KRITIS"
            title="Siapa Bertanggung Jawab Jika Gagal?"
          />
          <g transform="translate(68, 370)">
            <rect x="0" y="0" width="944" height="540" fill="#182A21" stroke={COLORS.inkDark} strokeWidth="2" />
            <rect x="0" y="0" width="10" height="540" fill="#EF4444" />
            <SvgHtmlTextBox x={42} y={48} width={860} height={444}>
              <div style={{ color: COLORS.ivory }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, letterSpacing: 1.8, color: "#FCA5A5" }}>
                  PERTANYAAN AKUNTABILITAS KONSERVASI
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.24, marginTop: 26 }}>
                  Jika pemindahan dilakukan, siapa yang bertanggung jawab{" "}
                  <span style={{ color: COLORS.goldLight }}>apabila proses adaptasi gagal?</span>
                </div>
                <div style={{ height: 1, background: COLORS.hairlineLight, margin: "34px 0 26px" }} />
                <div style={{ fontSize: 23, lineHeight: 1.45, color: "rgba(246,244,238,0.88)" }}>
                  Sebuah keputusan bagi spesies yang nyaris punah menuntut kejelasan risiko dan akuntabilitas.
                </div>
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E4_S12":
    default:
      return (
        <SeriesClosingBridgeCard
          nextBadge="LANJUT KE BAGIAN 4/4 (PENUTUP)"
          headline="Apakah Ujung Kulon Cukup Aman?"
          line1="Memindahkan berisiko tinggi — namun bagaimana"
          line2="ancaman nyata di dalam rumah aslinya sendiri?"
        />
      );
  }
};
