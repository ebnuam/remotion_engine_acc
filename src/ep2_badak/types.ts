export type SceneCategory =
  | "rhino_habitat" // f0-f156: Badak Jawa di Ujung Kulon tersisa < 80 ekor
  | "relocation_wacana" // f156-f306: Wacana pemindahan ke tempat baru
  | "scientist_reject" // f306-f432: Ditolak keras ilmuwan & aktivis
  | "kok_iso_yo" // f432-f492: Lho, kok iso yo?
  | "java_map_start" // f492-f708: Usulan pindah dari TN Ujung Kulon Banten
  | "java_map_route" // f708-f828: Ke TN Alas Purwo Banyuwangi ~1.000 KM
  | "noble_goal" // f828-f888: Tujuannya mulia
  | "second_habitat" // f894-f942: Bikin habitat kedua (Insurance)
  | "krakatau_eruption" // f942-f1092: Letusan Krakatau & Tsunami Selat Sunda
  | "extinction_shield" // f1092-f1200: Populasi nggak punah sekaligus
  | "not_livestock" // f1200-f1386: Bukan kayak mindahin hewan ternak
  | "life_at_stake" // f1386-f1440: Taruhannya nyawa
  | "rhino_stress" // f1440-f1608: Satwa super pemalu & rentan stres berat
  | "real_proof" // f1608-f1644: Buktinya nyata
  | "musofa_case" // f1644-f1842: Kematian Musofa pasca-translokasi
  | "short_distance" // f1842-f1980: Padahal jarak pindah < 15 KM lokal
  | "distance_contrast" // f1980-f2076: Belum ratusan KM ke Jawa Timur
  | "transport_hazard" // f2076-f2142: Risiko getaran & hipertermia
  | "global_studies" // f2142-f2334: Mayoritas translokasi mamalia liar gagal (>65%)
  | "adaptation_fail" // f2334-f2442: Pola makan terganggu & pakan tak cocok
  | "reproduction_fail" // f2442-f2520: Gagal berkembang biak
  | "home_challenges" // f2520-f2694: PR besar di rumah asli Ujung Kulon
  | "langkap_invasion" // f2694-f2826: Invasi tanaman langkap tutup cahaya & pakan mati
  | "buffer_threat" // f2826-f2928: Ancaman kerusakan zona penyangga & perburuan
  | "expert_consensus" // f2928-f3000: Konsensus para peneliti konservasi
  | "fatal_risk" // f3000-f3108: Risiko fatal pindah jauh-jauh
  | "rational_choice" // f3108-f3156: Jauh lebih masuk akal (Timbangan)
  | "budget_focus" // f3156-f3210: Alokasi anggaran & tenaga ranger
  | "habitat_restored" // f3210-f3372: Perbaiki & jaga ketat TN Ujung Kulon
  | "split_question" // f3372-f3414: Menurutmu gimana?
  | "split_option_a" // f3414-f3498: Opsi A: Pindah demi cadangan
  | "split_option_b" // f3498-f3582: Opsi B: Perkuat habitat asli
  | "split_cta"; // f3582-f3624: Tulis di komentar!

export interface SubtitleCue {
  startFrame: number;
  endFrame: number;
  text: string;
}

export interface ShotDef {
  id: number;
  startFrame: number;
  endFrame: number;
  category: SceneCategory;
  subtitle: string;
  badge: string; // Max 2-4 words, uppercase, strictly NO truncation
  bgGradient: string; // Bright & clean gradient
  accentColor: string;
}
