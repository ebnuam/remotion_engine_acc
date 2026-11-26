# Asset Inventory — Episode 002 (Serial Badak Jawa · Jalur 3C)

Seluruh aset Episode 002 disimpan secara terisolasi di bawah:
- Aset publik: `public/episodes/episode002_badak_jawa/`
- Kode produksi terisolasi: `src/episodes/episode002_badak_jawa/` dan stage dokumenter terpisah `src/shared/doc3d/`

**Nol perubahan** dilakukan terhadap `src/sandboxes/episode001_klorofil/`, `src/ep2_badak/`, `src/bridge/`, `src/ship/`, `src/shared/kokisoyo25d/`, maupun `public/prototypes/`.

---

## 1. Aset Audio (Read-Only)

| Aset | Path | Spesifikasi | Lisensi / Sumber | Status |
| :--- | :--- | :--- | :--- | :--- |
| Voice-Over Final Netral (Utuh 4 Episode) | `public/episodes/episode002_badak_jawa/voiceover.mp3` | MP3, `44.1 kHz`, Mono, `192 kbps`, `328,072s` (`7,87 MB`). Episode 002 memakai slice `00:00.00–01:32.15` (`92,15s`) secara non-destruktif via `startFrom`/`endAt`. | Milik kanal *Kok Iso Yo?* | **Read-Only (Tidak Diubah/Ditimpa)** |

---

## 2. Aset 3D Utama — Badak Jawa (Jalur 3C)

| Aset | Path | Spesifikasi Teknis | Sumber & Lisensi | Catatan Adaptasi Anatomi & Gerak (Jalur 3C) |
| :--- | :--- | :--- | :--- | :--- |
| **Model 3D Badak Bercula Tunggal (PBR Cleaned)** | `public/episodes/episode002_badak_jawa/assets/javan_rhino_3c.glb` | `20.548` segitiga / `10.396` vertex, GLB biner (`~1,5 MB`), ramah 4 vCPU Swangle. | **Thomas Flynn (`nebulousflynn`)** — *"Indian Rhino (Smoothie 3D)"*, via Sketchfab / Objaverse (`7e9695868ed64f419e09efdfe3120cb4`).<br>**Lisensi: `CC BY 4.0`** (`http://creativecommons.org/licenses/by/4.0/`) — **komersial diizinkan dengan atribusi**. | - **Anatomi:** Sudah memiliki **1 cula tunggal pendek**, lipatan kulit leher/bahu/pinggul, bibir atas meruncing, proporsi kompak.<br>- **Pembersihan PBR:** Menghapus `emissiveFactor: 0.65` & `metallicFactor: 0.59` bawaan menjadi material kulit organik matte (`roughness: 0.86`, `metalness: 0.03`).<br>- **Adaptasi Visual:** Keseimbangan warna highlight punggung menjadi kelabu-kecokelatan lembap khas hutan hujan + pelembutan halus *tubercles* ke tekstur mosaik kulit.<br>- **Gerak Sekunder (Jalur 3C):** Deformasi vertex deterministik halus pada Three.js (`onBeforeCompile` / per-frame): ekspansi napas dada, gerak kepala & telinga mikro, goyangan ekor halus, dan pergeseran berat tubuh kecil dengan kuku kaki terkunci di tanah (*zero foot-sliding*). **Tidak memaksakan animasi berjalan kompleks.** |
| **Peta Diffuse Kulit Adaptasi** | `public/episodes/episode002_badak_jawa/assets/javan_rhino_diffuse.jpg` | `1024 × 1024` JPEG, tone abu-abu kecokelatan lembap hutan hujan. | Turunan adaptif dari tekstur CC BY 4.0 di atas. | Tersemat di GLB + dapat dimuat terpisah bila perlu penyesuaian grading. |
| **Tangent-Space Normal Map** | `public/episodes/episode002_badak_jawa/assets/javan_rhino_normal.png` | `1024 × 1024` RGB tangent-space normal map (Sobel multi-skala dari tekstur kulit). | Dihasilkan secara prosedural dari tekstur CC BY 4.0. | Memberikan relief lipatan kulit dan butiran mosaik nyata saat terkena cahaya matahari pagi PBR. |
| **Roughness Map** | `public/episodes/episode002_badak_jawa/assets/javan_rhino_roughness.png` | `1024 × 1024` grayscale (`0.62 – 0.94`). | Dihasilkan secara prosedural. | Menjaga permukaan kulit tetap matte alami dengan sedikit kelembapan di lipatan kulit. |

> **Atribusi Wajib (CC BY 4.0):** *"3D Rhinoceros base mesh adapted from 'Indian Rhino (Smoothie 3D)' by Thomas Flynn (nebulousflynn), licensed under CC BY 4.0."* — wajib dicantumkan di deskripsi video / kredit.

> **Catatan Opsi Footage Wildlife (Jalur 3C):** Untuk shot Episode 002 saat ini, seluruh kemunculan Badak Jawa menggunakan pose statis waspada & *browsing* dengan gerak sekunder halus (tidak ada adegan lari/berjalan jauh yang memaksa rig). Apabila pada revisi atau episode berikutnya dibutuhkan gerakan kompleks (berjalan jauh/berkubang aktif), akan disiapkan slot khusus footage wildlife berlisensi CC0/CC-BY/Pexels/Wikimedia yang terverifikasi.

---

## 3. Aset Lingkungan 3D — Hutan Hujan Tropis Ujung Kulon (Full PBR 3D, Nol Kenney)

Seluruh lingkungan dibangun secara prosedural **organik PBR** di `src/episodes/episode002_badak_jawa/world/RainforestWorld.ts` menggunakan tekstur kanvas resolusi tinggi (`512–1024px`) dan `InstancedMesh` agar realistis sekaligus efisien di 4 vCPU:

| Komponen Lingkungan | Implementasi Teknis | Tekstur & Material PBR | Catatan Realisme |
| :--- | :--- | :--- | :--- |
| **Terrain & Jalur Lumpur** | `PlaneGeometry` berkontur heightmap organik (perbukitan tepi jalur, lekukan kubangan, tepian aliran). | Tekstur kanvas PBR prosedural (`albedo` tanah liat cokelat gelap + serasah daun + lumut hijau zaitun; `bumpMap` granular; `roughnessMap` basah di kubangan). | Menghilangkan kesan tanah datar/kotak; memunculkan bayangan kontak alami di bawah kaki badak. |
| **Kubangan Air / *Wallow*** | Permukaan air dangkal reflektif di cekungan jalur hutan. | `MeshStandardMaterial` dengan `roughness: 0.12`, riak normal halus, warna air berlumpur kehijauan alami `#3A463B`. | Refleksi cahaya kanopi alami. |
| **Pohon Tropis Berbanir (*Buttress-Root Trees*)** | Batang silinder bertingkat berlekuk organik + 4–5 akar banir (*buttress flares*) di pangkal + cabang utama & sekunder. | Tekstur kulit kayu tropis berlumut (*bark albedo + bumpMap*, `roughness: 0.90`). | Tidak menggunakan bola/kerucut kartun atau GLB Kenney. |
| **Kanopi Daun Berlapis (*Alpha-Cutout Instanced*)** | Ribuan klaster ranting & daun tropis (`InstancedMesh` bidang melengkung dengan `alphaTest: 0.45`, variasi warna hijau zaitun–zamrud alami). | Tekstur kanvas cabang daun tropis ber-alpha (bentuk helai daun nyata + tulang daun + variasi pencahayaan). | Memungkinkan sinar matahari menembus celah daun menghasilkan *dappled sunlight* & bayangan dedaunan asli di tanah. |
| **Paku-Pakuan (*Ferns*), Semak Pakan & Liana** | Pelepah pakis melengkung menyirip (`alpha-cutout`), semak daun lebar bawah kanopi, sulur liana menggantung dari cabang tinggi, serta dedaunan *foreground* dekat kamera (buram optik oleh DoF). | `MeshStandardMaterial` `DoubleSide`, `roughness: 0.65`, variasi hijau lembap `#2B4628` – `#4E6B38`. | Menciptakan kedalaman 3 lapis nyata (*foreground – midground – background*). |
| **Atmosfer, Langit & Cahaya Pagi** | Kubah langit gradien atmosfer pagi/mendung tropis + `THREE.FogExp2` kabut lembap + *sun-shaft* transparan halus + partikel embun/spora mikro. | Pencahayaan 3-titik PBR: `DirectionalLight` matahari pagi hangat (`#FFF1D6`, shadow map `1024×1024`), `HemisphereLight` pantulan langit–lantai hutan, dan *soft rim light* belakang. | Terang alami dan realistis (*tidak gelap berlebihan*, *tidak neon*). |

---

## 4. Aset Editorial 2D — Peta & Visualisasi Sains

| Komponen Editorial | Lokasi Kode | Fungsi | Sumber Data Terverifikasi |
| :--- | :--- | :--- | :--- |
| **Peta Topografi Indonesia, Jawa & Selat Sunda** | `src/episodes/episode002_badak_jawa/editorial/JavaReliefMap.tsx` | Vektor garis pantai presisi (Sumatra Selatan, Selat Sunda, Pulau Jawa, Semenanjung Ujung Kulon, Anak Krakatau, Alas Purwo, Baluran) dengan kontur elevasi, grid koordinat lintang/bujur, dan skala kilometer. | Geografi BIG / PVMBG / BTNUK |
| **Modul Grafik Populasi & Kamera Jebak** | `src/episodes/episode002_badak_jawa/editorial/PopulationDataView.tsx` | Pita rentang estimasi `87–100 ekor` (Kemenhut) & distribusi survei kamera jebak 2026 `~91 ekor` (rentang `74–99`), tipografi tabular + tag `[ESTIMASI RESMI]`. | Kementerian Kehutanan RI / BTNUK (2026) |
| **Modul Overlay Ancaman Populasi Tunggal** | `src/episodes/episode002_badak_jawa/editorial/ThreatOverlay.tsx` | Peta mini Selat Sunda + 3 vektor ancaman ilmiah (Tsunami/Vulkanik Anak Krakatau, Wabah Penyakit, Degradasi Habitat) + indikator `100% TERPAPAR · 0 CADANGAN`. | IUCN Red List / IUCN SSC PHVA (2015) |
| **Sistem Tipografi & Tag Epistemik** | `src/episodes/episode002_badak_jawa/editorial/EditorialTheme.ts` | Palet warna terkalibrasi, *safe-zone* mobile 9:16, tag epistemik (`FAKTA`, `ESTIMASI RESMI`, `KAJIAN RISIKO`, `WACANA · BELUM FINAL`), dan sitasi sumber mikro. | Standar Creative Direction Episode 002 |
