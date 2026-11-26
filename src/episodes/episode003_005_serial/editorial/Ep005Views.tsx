// Editorial Views & Overlays for Episode 005 (Bagian 4/4 — Penutup: Perlindungan Habitat Asli & Penutup Serial)
// Uses SvgHtmlTextBox (<foreignObject>) across all text containers so ZERO text ever overflows or slices mid-word.

import React from "react";
import {
  COLORS,
  EditorialTopHeader,
  FONT_MONO,
  FONT_SANS,
  SvgHtmlTextBox,
} from "../../episode002_badak_jawa/editorial/EditorialTheme";
import { SeriesLowerThird, SeriesOpeningCard, SeriesPaperShell } from "./SeriesCommon";

export const Ep005ShotRouter: React.FC<{ shotId: string; progress: number }> = ({ shotId, progress }) => {
  switch (shotId) {
    case "E5_S01":
      return (
        <SeriesOpeningCard
          partLabel="SERIAL BADAK JAWA · BAGIAN 4/4 (PENUTUP)"
          titleLine1="Apakah Ujung Kulon Sudah"
          titleLine2="Cukup Terlindungi?"
          contextLine="Pemindahan menyimpan risiko besar — namun bertahan di rumah asli juga menghadapi tantangan."
          progress={progress}
        />
      );

    case "E5_S02":
      return (
        <SeriesLowerThird
          badge="SISI SEBALIKNYA · HABITAT ASLI"
          title="Bertahan di Ujung Kulon Juga Bukan Tanpa Risiko"
          subtitle="Ekosistem rumah asli menghadapi tekanan ekologi yang perlu dijawab"
          progress={progress}
        />
      );

    case "E5_S03":
      return (
        <SeriesLowerThird
          badge="KONTEKS HABITAT · DATA BTNUK"
          title="Tekanan Ekosistem &amp; Ketersediaan Tumbuhan Pakan"
          subtitle="Ilustrasi invasi palem langkap (Arenga obtusifolia) yang menutup cahaya pakan bawah"
          citation="DATA SEBARAN BTNUK: 13.099 ha (dominan terbuka) · 9.285 ha (bawah tegakan)"
          accent="#B45309"
          progress={progress}
        />
      );

    case "E5_S04":
      return (
        <SeriesPaperShell idSuffix="e5_s04">
          <EditorialTopHeader
            badge="SINTESIS DILEMA DUA SISI"
            badgeColor={COLORS.oceanDeep}
            location="KESETARAAN PERSOALAN"
            title="Dua Pilihan, Dua Tantangan Nyata"
          />
          <g transform="translate(68, 350)">
            <rect x="0" y="0" width="944" height="320" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
            <rect x="0" y="0" width="944" height="54" fill={COLORS.forestAccent} />
            <text x="28" y="35" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="19" fontWeight="700">
              OPSI A · BERTAHAN DI TN UJUNG KULON
            </text>
            <SvgHtmlTextBox x={28} y={70} width={888} height={232}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.inkDark }}>Risiko Tetap di Satu Kawasan</div>
                <div style={{ fontSize: 21.5, color: COLORS.inkMuted, marginTop: 14, lineHeight: 1.55 }}>
                  <div>• Kerentanan bencana geologis pesisir &amp; wabah penyakit menular</div>
                  <div style={{ marginTop: 6 }}>• Tekanan keragaman genetik pada kelompok populasi tertutup</div>
                  <div style={{ marginTop: 6 }}>• Gangguan ekosistem &amp; keterbatasan tumbuhan pakan alami</div>
                </div>
              </div>
            </SvgHtmlTextBox>

            <rect x="0" y="360" width="944" height="320" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
            <rect x="0" y="360" width="944" height="54" fill={COLORS.alertAmber} />
            <text x="28" y="395" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="19" fontWeight="700">
              OPSI B · MEMBANGUN HABITAT KEDUA
            </text>
            <SvgHtmlTextBox x={28} y={430} width={888} height={232}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.inkDark }}>Risiko Translokasi &amp; Adaptasi Baru</div>
                <div style={{ fontSize: 21.5, color: COLORS.inkMuted, marginTop: 14, lineHeight: 1.55 }}>
                  <div>• Stres penangkapan, pengangkutan &amp; paparan lingkungan baru</div>
                  <div style={{ marginTop: 6 }}>• Ketergantungan pada syarat habitat sangat spesifik</div>
                  <div style={{ marginTop: 6 }}>• Belum ada bukti kelayakan jangka panjang di luar Ujung Kulon</div>
                </div>
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E5_S05":
    case "E5_S06":
    case "E5_S07":
    case "E5_S08": {
      const activeIdx = shotId === "E5_S06" ? 0 : shotId === "E5_S07" ? 1 : shotId === "E5_S08" ? 2 : -1;
      const qs = [
        ["01", "KELAYAKAN LOKASI BARU", "Apakah lokasi baru benar-benar sudah terbukti layak menopang jangka panjang?"],
        ["02", "MITIGASI RISIKO INDIVIDU", "Bagaimana risiko penangkapan, angkutan & adaptasi terhadap badak yang dipindahkan?"],
        ["03", "PERLINDUNGAN HABITAT ASLI", "Apakah perlindungan dan pengelolaan ekosistem di Ujung Kulon sudah dilakukan maksimal?"],
      ];
      return (
        <SeriesPaperShell idSuffix={shotId}>
          <EditorialTopHeader
            badge="KERANGKA EVALUASI KEBIJAKAN"
            badgeColor={COLORS.forestAccent}
            location="SEBELUM KEPUTUSAN BESAR"
            title="3 Pertanyaan Kunci"
          />
          <g transform="translate(68, 350)">
            {qs.map(([num, h, d], idx) => {
              const isAct = activeIdx === -1 || activeIdx === idx;
              return (
                <g key={num} transform={`translate(0, ${idx * 290})`} opacity={isAct ? 1 : 0.38}>
                  <rect x="0" y="0" width="944" height="246" fill={isAct ? "#182A21" : COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.8" />
                  <rect x="0" y="0" width="10" height="246" fill={isAct ? COLORS.gold : COLORS.forestAccent} />
                  <SvgHtmlTextBox x={34} y={24} width={876} height={198}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800, color: isAct ? COLORS.goldLight : COLORS.forestAccent }}>
                        PERTANYAAN {num} · {h}
                      </div>
                      <div style={{ fontSize: 25, fontWeight: 700, color: isAct ? COLORS.ivory : COLORS.inkDark, marginTop: 14, lineHeight: 1.38 }}>
                        {d}
                      </div>
                    </div>
                  </SvgHtmlTextBox>
                </g>
              );
            })}
          </g>
        </SeriesPaperShell>
      );
    }

    case "E5_S09":
      return (
        <SeriesLowerThird
          badge="TARUHAN SPESIES"
          title="Lebih dari Sekadar Memindahkan Beberapa Ekor"
          subtitle="Yang dipertaruhkan adalah masa depan seluruh spesies di satu kawasan terakhir"
          progress={progress}
        />
      );

    case "E5_S10":
      return (
        <SeriesPaperShell idSuffix="e5_s10">
          <EditorialTopHeader
            badge="GARIS AKHIR BIOLOGIS"
            badgeColor={COLORS.alertRed}
            location="KEPUNAHAN IREVERSIBEL"
            title="Tidak Bisa Dibalikkan"
          />
          <g transform="translate(68, 380)">
            <rect x="0" y="0" width="944" height="510" fill="#182A21" stroke={COLORS.inkDark} strokeWidth="2" />
            <rect x="0" y="0" width="10" height="510" fill={COLORS.alertRed} />
            <SvgHtmlTextBox x={44} y={56} width={856} height={400}>
              <div style={{ color: COLORS.ivory }}>
                <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.28 }}>
                  Kalau suatu hari Badak Jawa{" "}
                  <span style={{ color: "#FCA5A5" }}>benar-benar punah</span>, kita tidak bisa sekadar memindahkannya kembali.
                </div>
                <div style={{ height: 1, background: COLORS.hairlineLight, margin: "36px 0 28px" }} />
                <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.goldLight, letterSpacing: 1 }}>
                  0 CADANGAN LIAR · ~91 INDIVIDU TERSISA DI ALAM
                </div>
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E5_S11":
      return (
        <SeriesPaperShell idSuffix="e5_s11">
          <EditorialTopHeader
            badge="DISKUSI TERBUKA"
            badgeColor={COLORS.forestAccent}
            location="BAGIAN 4/4 · PENUTUP"
            title="Menurutmu Bagaimana?"
          />
          <g transform="translate(68, 360)">
            <rect x="0" y="0" width="452" height="360" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
            <rect x="0" y="0" width="452" height="54" fill={COLORS.forestAccent} />
            <text x="26" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700">
              PERLU HABITAT KEDUA
            </text>
            <SvgHtmlTextBox x={26} y={76} width={400} height={256}>
              <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.inkDark, lineHeight: 1.35 }}>
                Langkah penting untuk keluar dari risiko satu tempat?
              </div>
            </SvgHtmlTextBox>

            <rect x="492" y="0" width="452" height="360" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
            <rect x="492" y="0" width="452" height="54" fill={COLORS.alertAmber} />
            <text x="518" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700">
              RISIKO TERLALU BESAR
            </text>
            <SvgHtmlTextBox x={518} y={76} width={400} height={256}>
              <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.inkDark, lineHeight: 1.35 }}>
                Lebih baik fokus memaksimalkan perlindungan di Ujung Kulon?
              </div>
            </SvgHtmlTextBox>

            <rect x="0" y="420" width="944" height="150" fill="#182A21" />
            <text x="472" y="508" textAnchor="middle" fill={COLORS.goldLight} fontFamily={FONT_MONO} fontSize="30" fontWeight="800" letterSpacing="1.8">
              TULIS PENDAPATMU DI KOMENTAR
            </text>
          </g>
        </SeriesPaperShell>
      );

    case "E5_S12":
    default:
      return (
        <div style={{ width: 1080, height: 1920, background: "#101813", fontFamily: FONT_SANS }}>
          <svg viewBox="0 0 1080 1920" style={{ width: 1080, height: 1920 }}>
            <rect width="1080" height="1920" fill="#101813" />
            <g transform="translate(68, 600)">
              <rect x="0" y="0" width="430" height="38" fill="#1E4D32" />
              <text x="18" y="25" fill={COLORS.goldLight} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="2">
                SERIAL BADAK JAWA · SELESAI (4/4)
              </text>
              <SvgHtmlTextBox x={0} y={58} width={944} height={360}>
                <div style={{ color: COLORS.ivory }}>
                  <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: -0.5 }}>KOK ISO YO?</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.goldLight, marginTop: 8, letterSpacing: 1.5 }}>
                    DOKUMENTER ALAM &amp; SAINS INVESTIGATIF
                  </div>
                  <div style={{ height: 1, background: COLORS.hairlineLight, margin: "28px 0" }} />
                  <div style={{ fontFamily: FONT_MONO, fontSize: 16.5, color: "rgba(246,244,238,0.84)", lineHeight: 1.5 }}>
                    SUMBER DATA: IUCN RED LIST · KEMENHUT RI · BALAI TNUK · SKHB IPB · PVMBG / BIG
                  </div>
                  <div style={{ fontSize: 18, color: "rgba(246,244,238,0.7)", marginTop: 14, lineHeight: 1.45 }}>
                    3D Rhinoceros base mesh adapted from &quot;Indian Rhino (Smoothie 3D)&quot; by Thomas Flynn (CC BY 4.0)
                  </div>
                </div>
              </SvgHtmlTextBox>
            </g>
          </svg>
        </div>
      );
  }
};
