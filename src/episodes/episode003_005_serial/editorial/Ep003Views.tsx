// Editorial Views & Overlays for Episode 003 (Bagian 2/4 — Habitat Kedua, Risiko Translokasi & Kasus Musofa)
// All card bodies use SvgHtmlTextBox (<foreignObject>) so ZERO text ever overflows or slices mid-word.

import React from "react";
import {
  COLORS,
  EditorialTopHeader,
  FONT_MONO,
  SvgHtmlTextBox,
  UjungKulonShapes,
} from "../../episode002_badak_jawa/editorial/EditorialTheme";
import {
  JavaSecondSiteMapBox,
  SeriesClosingBridgeCard,
  SeriesLowerThird,
  SeriesOpeningCard,
  SeriesPaperShell,
  easeOut,
} from "./SeriesCommon";

export const Ep003ShotRouter: React.FC<{ shotId: string; progress: number }> = ({ shotId, progress }) => {
  switch (shotId) {
    case "E3_S01":
      return (
        <SeriesOpeningCard
          partLabel="SERIAL BADAK JAWA · BAGIAN 2/4"
          titleLine1="Habitat Kedua, Risiko"
          titleLine2="Translokasi & Kasus Musofa"
          contextLine="Dari kajian wilayah baru hingga fakta medis di balik kematian Musofa."
          progress={progress}
        />
      );

    case "E3_S02":
    case "E3_S03":
    case "E3_S04": {
      const mode = shotId === "E3_S02" ? "general" : shotId === "E3_S03" ? "alas_purwo" : "baluran";
      const badge =
        shotId === "E3_S02"
          ? "WACANA · SECOND WILD POPULATION"
          : shotId === "E3_S03"
            ? "MULAI DIKAJI · BELUM FINAL"
            : "TAHAP WACANA · KEMUNGKINAN";
      const title =
        shotId === "E3_S02"
          ? "Alasan Populasi Liar Kedua"
          : shotId === "E3_S03"
            ? "TN Alas Purwo, Banyuwangi"
            : "Baluran & Lokasi Kandidat Lain";
      const cardHeading =
        shotId === "E3_S02"
          ? "MENGURANGI KETERGANTUNGAN PADA SATU KAWASAN"
          : shotId === "E3_S03"
            ? "STATUS KAJIAN TAMAN NASIONAL ALAS PURWO"
            : "CATATAN KANDIDAT LOKASI LAIN DALAM DISKURSUS";
      const statusHeadline =
        shotId === "E3_S03"
          ? "Alas Purwo baru dalam tahap penjajakan & kajian ilmiah"
          : shotId === "E3_S04"
            ? "Baluran pernah disebut sebagai opsi — belum ada penetapan"
            : "Gagasan membangun populasi cadangan di luar Ujung Kulon";
      const statusDetail =
        shotId === "E3_S03"
          ? "Kemenhut menegaskan tidak ada pemindahan tanpa bukti kelayakan ketat."
          : "TN Ujung Kulon tetap rumah utama sambil opsi jangka panjang dikaji.";

      return (
        <SeriesPaperShell idSuffix={shotId}>
          <EditorialTopHeader badge={badge} badgeColor={COLORS.alertAmber} location="JAWA TIMUR · KAJIAN" title={title} />
          <JavaSecondSiteMapBox clipId={`clip_${shotId}`} highlightMode={mode} progress={progress} />

          <g transform="translate(68, 945)">
            <rect x="0" y="0" width="944" height="585" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
            <rect x="0" y="0" width="944" height="54" fill="#1C2922" />
            <text x="26" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="1.2">
              {cardHeading}
            </text>

            <SvgHtmlTextBox x={28} y={76} width={888} height={445}>
              <div>
                <div
                  style={{
                    background: "#ECE8DF",
                    border: `1px solid ${COLORS.hairlineDark}`,
                    borderLeft: `6px solid ${COLORS.alertAmber}`,
                    padding: "20px 24px",
                  }}
                >
                  <div style={{ fontFamily: FONT_MONO, fontSize: 16.5, fontWeight: 700, color: COLORS.alertAmber }}>
                    KLARIFIKASI STATUS KEPUTUSAN
                  </div>
                  <div style={{ fontSize: 25, fontWeight: 800, color: COLORS.inkDark, marginTop: 8, lineHeight: 1.25 }}>
                    {statusHeadline}
                  </div>
                  <div style={{ fontSize: 20, color: COLORS.inkMuted, marginTop: 10, lineHeight: 1.4 }}>
                    {statusDetail}
                  </div>
                </div>

                <div style={{ fontSize: 21, fontWeight: 700, color: COLORS.inkDark, marginTop: 28, lineHeight: 1.55 }}>
                  <div>• Garis putus-putus menandakan wacana ilmiah, bukan rute final.</div>
                  <div style={{ marginTop: 10 }}>• Memindahkan spesies (~91 ekor) menuntut standar ekologis sangat ketat.</div>
                </div>
              </div>
            </SvgHtmlTextBox>

            <text x="28" y="550" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="16">
              SUMBER: KEMENTERIAN KEHUTANAN RI · PHVA IUCN SSC · BALAI TNUK
            </text>
          </g>
        </SeriesPaperShell>
      );
    }

    case "E3_S05":
      return (
        <SeriesLowerThird
          badge="REALITAS BIOLOGIS · JALUR 3C"
          title="Memindahkan Badak Jawa Bukan Perkara Sederhana"
          subtitle="Setiap individu bergantung pada kondisi ekologi yang sangat spesifik"
          progress={progress}
        />
      );

    case "E3_S06": {
      const reqs = [
        ["01 · PAKAN ALAMI", "Keanekaragaman tumbuhan pakan rendah yang disukai Badak Jawa"],
        ["02 · SUMBER AIR TAWAR", "Akses air bersih sepanjang musim kering maupun basah"],
        ["03 · KUBANGAN (WALLOW)", "Kubangan lumpur untuk termoregulasi tubuh & kesehatan kulit"],
        ["04 · RUANG JELAJAH", "Luas jelajah teritori yang memadai bagi satwa soliter"],
        ["05 · LINGKUNGAN MIKRO", "Kelembapan, tutupan kanopi, tanah & bebas patogen"],
        ["06 · KEAMANAN KAWASAN", "Perlindungan penuh dari perburuan & gangguan manusia"],
      ];
      return (
        <SeriesPaperShell idSuffix="e3_s06">
          <EditorialTopHeader
            badge="SYARAT EKOLOGIS · TRANSLOKASI"
            badgeColor={COLORS.forestAccent}
            location="IUCN SSC GUIDELINES"
            title="6 Kebutuhan Habitat Spesifik"
          />
          <g transform="translate(68, 336)">
            {reqs.map(([k, d], i) => {
              const show = easeOut((progress - i * 0.08) * 3.5);
              return (
                <g key={k} transform={`translate(0, ${i * 184})`} opacity={0.35 + show * 0.65}>
                  <rect x="0" y="0" width="944" height="160" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
                  <rect x="0" y="0" width="8" height="160" fill={COLORS.forestAccent} />
                  <SvgHtmlTextBox x={26} y={18} width={892} height={124}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 800, color: COLORS.forestAccent }}>{k}</div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.inkDark, marginTop: 8, lineHeight: 1.3 }}>{d}</div>
                    </div>
                  </SvgHtmlTextBox>
                </g>
              );
            })}
          </g>
        </SeriesPaperShell>
      );
    }

    case "E3_S07": {
      const phases = [
        ["TAHAP 01", "PENANGKAPAN (PIT TRAP / CORRAL)", "Risiko stres fisiologis & cedera selama penangkapan satwa liar"],
        ["TAHAP 02", "PENGANGKUTAN & MOBILISASI", "Durasi transit, guncangan, dan pemantauan tanda vital terus-menerus"],
        ["TAHAP 03", "PERUBAHAN LINGKUNGAN BARU", "Paparan mikroba baru, jenis parasit lokal, dan komposisi pakan berbeda"],
        ["TAHAP 04", "ADAPTASI JANGKA PANJANG", "Kesiapan membentuk wilayah jelajah & perilaku reproduksi baru"],
      ];
      return (
        <SeriesPaperShell idSuffix="e3_s07">
          <EditorialTopHeader
            badge="KAJIAN RISIKO · TRANSLOKASI"
            badgeColor={COLORS.alertAmber}
            location="FAKTOR OPERASIONAL"
            title="Rantai Risiko Pemindahan Satwa"
          />
          <g transform="translate(68, 340)">
            {phases.map(([step, name, desc], i) => (
              <g key={step} transform={`translate(0, ${i * 276})`}>
                <rect x="0" y="0" width="944" height="224" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
                <rect x="0" y="0" width="944" height="48" fill="#1C2922" />
                <text x="28" y="31" fill={COLORS.goldLight} fontFamily={FONT_MONO} fontSize="18" fontWeight="700" letterSpacing="1.6">
                  {step}
                </text>
                <SvgHtmlTextBox x={28} y={60} width={888} height={150}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.inkDark, lineHeight: 1.2 }}>{name}</div>
                    <div style={{ fontSize: 21, color: COLORS.inkMuted, marginTop: 10, lineHeight: 1.35 }}>{desc}</div>
                  </div>
                </SvgHtmlTextBox>
                {i < phases.length - 1 && (
                  <line x1="472" y1="224" x2="472" y2="276" stroke={COLORS.alertAmber} strokeWidth="3" strokeDasharray="6 4" />
                )}
              </g>
            ))}
          </g>
        </SeriesPaperShell>
      );
    }

    case "E3_S08":
      return (
        <SeriesLowerThird
          badge="KONTEKS SENSITIF · NOVEMBER 2025"
          title="Peristiwa yang Memicu Sorotan Publik"
          subtitle="Mengapa pembahasan pemindahan memerlukan kehati-hatian ilmiah"
          progress={progress}
        />
      );

    case "E3_S09":
      return (
        <SeriesPaperShell idSuffix="e3_s09">
          <EditorialTopHeader
            badge="FAKTA · KRONOLOGI RESMI"
            badgeColor={COLORS.oceanDeep}
            location="INTERNAL TN UJUNG KULON · NOV 2025"
            title="Kasus Musofa di Fasilitas JRSCA"
          />
          <g transform="translate(68, 326)">
            <clipPath id="clipE3S09">
              <rect x="0" y="0" width="944" height="500" />
            </clipPath>
            <rect x="0" y="0" width="944" height="500" fill={COLORS.oceanMid} stroke={COLORS.inkDark} strokeWidth="1.5" />
            <g clipPath="url(#clipE3S09)">
              <g transform="translate(-20, -25) scale(2.35)">
                <UjungKulonShapes showDots={false} />
                <path d="M 165,168 Q 225,135 288,138" fill="none" stroke="#FCD34D" strokeWidth="2.4" strokeDasharray="4 3" />
                <circle cx="165" cy="168" r="5" fill="#6EE7B7" />
                <circle cx="288" cy="138" r="6" fill="#FDE68A" />
              </g>
              <rect x="24" y="24" width="620" height="84" fill="rgba(16,26,23,0.92)" stroke="#6EE7B7" strokeWidth="1.2" />
              <SvgHtmlTextBox x={40} y={32} width={588} height={68}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 700, color: "#6EE7B7" }}>
                    PERPINDAHAN INTERNAL DI DALAM TNUK
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.ivory, marginTop: 4 }}>
                    Bukan pemindahan lintas pulau ke Jawa Timur
                  </div>
                </div>
              </SvgHtmlTextBox>
            </g>
          </g>

          <g transform="translate(68, 865)">
            <rect x="0" y="0" width="944" height="655" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.5" />
            <rect x="0" y="0" width="944" height="54" fill="#1C2922" />
            <text x="26" y="34" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="18" fontWeight="700">
              KRONOLOGI RESMI KEMENHUT / BALAI TNUK (NOVEMBER 2025)
            </text>
            {[
              ["03 NOV 2025", "Penangkapan di kawasan TNUK", "Badak jantan Musofa ditangkap dalam operasi pemantauan & rehabilitasi internal."],
              ["05 NOV 2025", "Tiba di JRSCA Blok Gunung Honje", "Masih berada di dalam ekosistem Taman Nasional Ujung Kulon, Banten."],
              ["07 NOV 2025 (+2 HARI)", "Musofa Meninggal Dunia", "Meninggal dua hari setelah tiba di fasilitas konservasi JRSCA."],
            ].map(([dt, head, body], i) => (
              <g key={dt} transform={`translate(28, ${86 + i * 172})`}>
                <rect x="0" y="0" width="888" height="148" fill="#ECE8DF" stroke={COLORS.hairlineDark} strokeWidth="1" />
                <rect x="0" y="0" width="6" height="148" fill={i === 2 ? COLORS.alertRed : COLORS.forestAccent} />
                <SvgHtmlTextBox x={24} y={14} width={842} height={120}>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 800, color: i === 2 ? COLORS.alertRed : COLORS.forestAccent }}>
                      {dt}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.inkDark, marginTop: 4 }}>{head}</div>
                    <div style={{ fontSize: 19.5, color: COLORS.inkMuted, marginTop: 4, lineHeight: 1.35 }}>{body}</div>
                  </div>
                </SvgHtmlTextBox>
              </g>
            ))}
          </g>
        </SeriesPaperShell>
      );

    case "E3_S10":
      return (
        <SeriesPaperShell idSuffix="e3_s10">
          <EditorialTopHeader
            badge="KEKHAWATIRAN VS PEMBUKTIAN"
            badgeColor={COLORS.alertAmber}
            location="METODE INVESTIGATIF"
            title="Mengapa Kekhawatiran Muncul?"
          />
          <g transform="translate(68, 360)">
            <rect x="0" y="0" width="944" height="470" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
            <rect x="0" y="0" width="944" height="56" fill={COLORS.alertAmber} />
            <text x="28" y="36" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="20" fontWeight="700">
              RESPONS AWAL PUBLIK &amp; PENGAMAT
            </text>
            <SvgHtmlTextBox x={32} y={84} width={880} height={360}>
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: COLORS.inkDark, lineHeight: 1.2 }}>
                  Jarak waktu hanya 2 hari pasca-tiba
                </div>
                <div style={{ fontSize: 23, color: COLORS.inkMuted, marginTop: 14, lineHeight: 1.4 }}>
                  Secara wajar memunculkan kekhawatiran awal soal risiko translokasi.
                </div>
                <div style={{ height: 1, background: COLORS.hairlineDark, margin: "28px 0" }} />
                <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: COLORS.forestAccent }}>
                  SYARAT PENILAIAN ILMIAH:
                </div>
                <div style={{ fontSize: 25, fontWeight: 700, color: COLORS.inkDark, marginTop: 10, lineHeight: 1.35 }}>
                  Penyebab kematian hanya bisa ditentukan oleh nekropsi patologis.
                </div>
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E3_S11":
      return (
        <SeriesPaperShell idSuffix="e3_s11">
          <EditorialTopHeader
            badge="FAKTA PATOLOGI · SKHB IPB"
            badgeColor={COLORS.forestAccent}
            location="HASIL NEKROPSI RESMI"
            title="Temuan Medis Tim IPB"
          />
          <g transform="translate(68, 340)">
            <rect x="0" y="0" width="944" height="1140" fill={COLORS.ivory} stroke={COLORS.inkDark} strokeWidth="1.6" />
            <rect x="0" y="0" width="944" height="58" fill="#1C2922" />
            <text x="28" y="37" fill={COLORS.ivory} fontFamily={FONT_MONO} fontSize="19" fontWeight="700">
              DOSSIER NEKROPSI TIM PATOLOGI SKHB IPB UNIVERSITY
            </text>
            {[
              ["PENYAKIT KRONIS MULTI-ORGAN", "Ditemukan kerusakan kronis jangka panjang pada lambung, usus, hati, paru-paru, dan otak."],
              ["INFEKSI PARASIT PRA-EKSISTING", "Terdapat infeksi 7–9 jenis parasit cacing dan defisiensi protein berat sebelum penangkapan."],
              ["FAKTOR USIA LANJUT (>45 TAHUN)", "Kondisi fisik satwa sudah menua dan menanggung beban patologi jauh sebelum translokasi."],
            ].map(([t, d], i) => (
              <g key={t} transform={`translate(32, ${96 + i * 284})`}>
                <rect x="0" y="0" width="880" height="244" fill="#ECE8DF" stroke={COLORS.hairlineDark} strokeWidth="1.2" />
                <rect x="0" y="0" width="8" height="244" fill={COLORS.forestAccent} />
                <SvgHtmlTextBox x={28} y={24} width={828} height={196}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 21, fontWeight: 800, color: COLORS.forestAccent }}>{t}</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.inkDark, marginTop: 14, lineHeight: 1.45 }}>{d}</div>
                  </div>
                </SvgHtmlTextBox>
              </g>
            ))}
            <text x="32" y="1095" fill={COLORS.inkMuted} fontFamily={FONT_MONO} fontSize="16.5">
              SUMBER: LAPORAN NEKROPSI TIM PATOLOGI SKHB IPB UNIVERSITY · KEMENHUT (NOV 2025)
            </text>
          </g>
        </SeriesPaperShell>
      );

    case "E3_S12":
      return (
        <SeriesPaperShell idSuffix="e3_s12">
          <EditorialTopHeader
            badge="FAKTA · VERIFIKASI KAUSALITAS"
            badgeColor={COLORS.forestAccent}
            location="KESIMPULAN ILMIAH"
            title="Korelasi Waktu ≠ Penyebab"
          />
          <g transform="translate(68, 345)">
            <rect x="0" y="0" width="944" height="510" fill="#182A21" stroke={COLORS.inkDark} strokeWidth="2" />
            <rect x="0" y="0" width="10" height="510" fill="#4C8C5A" />
            <SvgHtmlTextBox x={38} y={36} width={870} height={440}>
              <div style={{ color: COLORS.ivory }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, color: "#A7D7B1" }}>
                  PEMBACAAN FAKTA YANG AKURAT
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.24, marginTop: 18 }}>
                  Tidak tepat menyimpulkan bahwa pemindahanlah penyebab kematian Musofa.
                </div>
                <div style={{ height: 1, background: COLORS.hairlineLight, margin: "28px 0" }} />
                <div style={{ fontSize: 22.5, lineHeight: 1.5, color: COLORS.goldLight }}>
                  <div>• Penyakit organ kronis &amp; parasit telah berlangsung lama sebelum ditangkap.</div>
                  <div style={{ marginTop: 12 }}>• Namun peristiwa ini menegaskan betapa rentannya penanganan satwa langka.</div>
                </div>
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );

    case "E3_S13":
      return (
        <SeriesLowerThird
          badge="KOMPLEKSITAS KONSERVASI"
          title="Rumitnya Menangani Populasi Sangat Kecil"
          subtitle="Setiap tindakan medis maupun pemindahan menghadapi margin risiko sempit"
          progress={progress}
        />
      );

    case "E3_S14": {
      const cols = 13;
      const dots = Array.from({ length: 91 }, (_, i) => [i % cols, Math.floor(i / cols)]);
      return (
        <SeriesPaperShell idSuffix="e3_s14">
          <EditorialTopHeader
            badge="NILAI KONSERVASI · ~91 INDIVIDU"
            badgeColor={COLORS.forestAccent}
            location="ESTIMASI POPULASI DUNIA"
            title="Setiap Individu Sangat Berarti"
          />
          <g transform="translate(68, 350)">
            <rect x="0" y="0" width="944" height="710" fill="#182A21" stroke={COLORS.inkDark} strokeWidth="1.8" />
            <text x="40" y="54" fill={COLORS.goldLight} fontFamily={FONT_MONO} fontSize="18.5" fontWeight="700" letterSpacing="1.4">
              ILUSTRASI SKALA POPULASI DUNIA (~91 INDIVIDU · SURVEI 2026)
            </text>
            {dots.map(([c, r], idx) => {
              const highlight = idx === 45;
              return (
                <circle
                  key={idx}
                  cx={96 + c * 62}
                  cy={136 + r * 64}
                  r={highlight ? 16 : 12}
                  fill={highlight ? "#FCD34D" : "#4C8C5A"}
                  stroke={highlight ? "#FFFFFF" : "none"}
                  strokeWidth={highlight ? 3 : 0}
                />
              );
            })}
            <SvgHtmlTextBox x={40} y={598} width={864} height={90}>
              <div style={{ fontSize: 23, fontWeight: 600, color: COLORS.ivory, lineHeight: 1.4 }}>
                Kehilangan satu individu berdampak nyata bagi masa depan seluruh spesies.
              </div>
            </SvgHtmlTextBox>
          </g>
        </SeriesPaperShell>
      );
    }

    case "E3_S15":
    default:
      return (
        <SeriesClosingBridgeCard
          nextBadge="LANJUT KE BAGIAN 3/4"
          headline="Krisis Genetik & Batas JRSCA"
          line1="Di luar risiko pemindahan, isolasi di satu hutan"
          line2="memicu persoalan genetik dan reproduksi jangka panjang."
        />
      );
  }
};
