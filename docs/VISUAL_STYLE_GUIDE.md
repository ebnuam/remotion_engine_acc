# Visual Style Guide & Standar Produksi — Kok Iso Yo?

Dokumen ini menetapkan arah visual utama (*Visual Style Guide*) dan standar editorial untuk pipeline produksi otomatis YouTube Shorts / Reels *Kok Iso Yo?*, berdasarkan:
1. Analisis visual langsung terhadap video referensi (`/home/vps-ubuntu2/kokisoyo_references/WhatsApp Video 2026-11-26 at 19.16.39.mp4`, durasi `66,03s`, `576×1024`, `30 FPS`) melalui 32 frame sampling + 2 contact sheet + frame resolusi penuh yang dianalisis menggunakan **Jalur AI PREMIUM (`agy` CLI — Gemini 4 Neon High)**.
2. Evaluasi komparatif performa & visual internal kanal: *Episode 001 (Kenapa Daun Hijau — 2.5D-in-3D, 1.000+ views)* vs *Episode 002 (Badak Jawa — StageDoc3D editorial slide, ~100 views)*.
3. Kesesuaian teknis terhadap engine yang sudah tersedia di VPS CPU-only (`Remotion` + `Three.js` + `--gl=swangle` via `src/shared/kokisoyo25d/`).

> **Prinsip Etis:** Panduan ini mengambil murni **prinsip sinematografi, gaya visual, dan storytelling** — bukan menyalin isi cerita, karakter, atau aset video referensi.

---

## 1. Diagnosis Performa: Kenapa "Daun Hijau" (1k+ View) Menang Jauh atas "Badak Jawa" (~100 View)?

Perbandingan langsung antara contact sheet [`docs/episodes/badak_jawa_series/sheet_ep2.jpg`](episodes/badak_jawa_series/sheet_ep2.jpg), storyboard [`src/sandboxes/episode001_klorofil/STORYBOARD.md`](../src/sandboxes/episode001_klorofil/STORYBOARD.md), dan video referensi menunjukkan 5 faktor penentu:

| Faktor | Gaya Badak Jawa (`StageDoc3D` / Editorial Slide) | Gaya Daun Hijau (`Stage25D`) & Video Referensi | Dampak ke Retensi Shorts |
|---|---|---|---|
| **Tampilan Layar Pertama (0–2s)** | Kartu editorial penuh teks/peta gelap ala laporan makalah / PowerPoint. | Dunia 3D cerah ber-outline hitam + karakter ekspresif + aksi langsung terjadi. | Penonton Shorts memutuskan swipe dalam <1,5 detik; tampilan "presentasi/artikel" langsung menurunkan *swipe-stay rate*. |
| **Kepadatan Teks** | Penuh paragraf kecil, bullet point, dan catatan kaki sumber di layar HP. | **Nol subtitle permanen**; teks hanya label besar/rambu/angka diegetik. | Layar HP kecil menolak teks padat; visual yang paham walau *muted* menang telak. |
| **Struktur Cerita & Durasi** | 92–95 detik, terpotong seri bersambung (`Bagian 1/4` tanpa jawaban tuntas di akhir). | 50–65 detik (target baru), **1 pertanyaan = 1 cerita utuh tuntas** dengan klimaks/aha-moment. | Algoritma Shorts menghukum durasi >65s yang bertele-tele dan cerita gantung tanpa payoff. |
| **Kedekatan Topik** | Isu konservasi spesifik & teknis (butuh konteks awal). | Fenomena sehari-hari / rasa penasaran universal (*kenapa daun hijau?*, *bagaimana alat raksasa bekerja?*). | Topik dekat kehidupan menarik audiens umum lintas usia. |
| **Dinamika Visual & Aksi** | Peta & kartu 2D statis (hanya 1 shot 3D badak); minim pergerakan mekanis. | Pergantian sudut kamera drastis (*low-angle ↔ wide ↔ top-down ↔ close-up*), aksi mekanis + ekspresi karakter. | Ritme visual tiap 2–4 detik menjaga perhatian hingga detik terakhir. |

**Keputusan Arah Visual:**
Seluruh produksi Shorts harian *Kok Iso Yo?* mengadopsi **Stylized 2.5D-in-3D Cartoon Explainer (`src/shared/kokisoyo25d/`)** sebagai gaya baku — gaya yang DNA-nya **sudah cocok dengan video referensi sekaligus terbukti performanya pada "Kenapa Daun Hijau"**.

---

## 2. Prinsip Visual Utama (Hasil Analisis Video Referensi via Gemini 4 Neon High)

### 2.1 Karakteristik 3D & Kedalaman Ruang (*Depth Cues*)
- **Stylized 3D NPR (Cel-Shaded 3D + Ink Outline):** Geometri dunia nyata (bangunan, jalan, struktur, alam, mesin) memiliki volume & perspektif 3D sejati, tetapi permukaannya rata/two-tone dan dibingkai garis tinta hitam rapi (*ink outline*).
- **5 Lapisan Kedalaman Wajib:**
  1. **Perspektif linier tegas:** Koridor, garis tepi, atau baris objek membentuk *leading lines* ke titik hilang (*vanishing point*).
  2. **Depth Fog (kabut jarak jauh):** Memudarkan kontras & outline latar belakang (biru-putih di siang, oranye lembut di sore, biru gelap di malam) agar subjek depan selalu menonjol.
  3. **Selective Depth of Field (DoF):** Blur lembut pada latar belakang saat *close-up* / *medium shot* agar subjek langsung "pop".
  4. **Foreground–Midground–Background Layering:** Menempatkan elemen bingkai tepi (tiang, daun, meja, pagar) di luar garis pandang subjek (`blocksAnySightLine`).
  5. **Cast Shadows terarah:** Bayangan jatuh yang bersih untuk mengikat objek ke tanah dan menunjukkan skala ketinggian.

### 2.2 Modeling, Material & Tekstur
- **Low-Poly Modular & Chunky:** Gunakan bentuk primitif geometris bersih (balok ber-bevel, silinder, kapsul, gumpalan kanopi pohon). Siluet harus langsung terbaca bahkan di layar ponsel kecil & bitrate terkompresi.
- **Material Flat / Two-Tone Matte (Bukan PBR Berat):** Gunakan `twoTone` / `MeshToonMaterial` / `MeshLambertMaterial` ringan. Hindari refleksi PBR realistis atau normal map berat yang memperlambat CPU VPS.
- **Tekstur Ringan & Terarah (`CanvasTexture` 512–1024px):**
  - Objek kecil/menengah cukup warna solid.
  - Bidang luas (beton, kayu, dinding, jalan) diberi tekstur 2D halus/prosedural (garis panel, *weathering* tipis, marka kontras tinggi) agar tidak tampak "plastik".
- **Emissive Selektif:** Efek menyala hanya dipakai untuk menandai **komponen aktif / mekanisme kunci / energi** saat momen penjelasan, bukan hiasan acak.
- **Garis Outline Proporsional:** Outline lingkungan lebih tipis (1–2 px); outline karakter utama lebih tebal (3–5 px) untuk pemisahan *figure-ground* instan.

### 2.3 Desain Karakter (2D-in-3D Stick-Capsule / Expressive Flat)
- **Proporsi Sederhana & Ikonik:** Kepala bulat/oval + badan kapsul/sederhana + tungkai garis bersih (selaras dengan karakter 2D *Canvas2D `Pen`* `NOINK=3` pada `kokisoyo25d`, mis. Prof. Koko & Budi).
- **Hierarki Visual Jelas:**
  - **Karakter Utama:** Warna kontras/jenuh + atribut ikonik (kacamata, topi/helm, dasi/rompi/jas lab).
  - **Karakter Pendukung/Figuran:** Warna polos minimalis agar tidak menyaingi subjek utama.
- **Ekspresi Diskret (*Snappy Pose/Expression Swap*):** Perubahan ekspresi mata, alis, dan mulut yang cepat terbaca (penasaran, kaget, berpikir, tersenyum paham).
- **Bahasa Visual Komik (2D Overlay / Billboard):** Gunakan ikonografi instan untuk mempercepat pemahaman tanpa teks panjang — bohlam ide, *sparkle* kilau, tanda tanya `?`, tetesan keringat, panah melingkar/vertikal 2D, dan *close-up* dial/meteran/diagram sederhana.

### 2.4 Interaksi Objek & Simulasi Gerakan
- **Kinematis & Deterministik 100% (Nol Fisika Berat):** Semua gerak digerakkan oleh `useCurrentFrame()`, `interpolate()`, dan `spring()` — tanpa simulasi kain, fluida, atau *rigid-body* real-time.
- **Gerakan Latar Hidup Minimalis:** Objek latar (kendaraan, awan, air, partikel udara) bergerak dengan translasi linier konstan yang tidak mencuri fokus.
- **Visualisasi Mekanisme Abstrak:** Jelaskan proses teknis lewat *cutaway/exploded view* sederhana + panah arah + perubahan warna *emissive* (jauh lebih komunikatif daripada memodelkan jeroan mesin ultra-detail).

### 2.5 Kamera, Framing 9:16 & Transisi
- **Eksploitasi Vertikal 9:16 (`1080×1920`):** Manfaatkan ketinggian objek, tumpukan vertikal (karakter di bawah–tengah, diagram/ikon di zona atas), dan jaga **Safe Zone** konten penting pada area tengah vertikal **25%–75%** (hindari pojok kanan-bawah untuk UI tombol YT/IG/FB).
- **Variasi Skala Shot Wajib (Dilarang 2 Shot Berurutan Identik):**
  - *Low-Angle Wide* (skala & bobot),
  - *High-Angle / Aerial Establishing* (konteks luas),
  - *Top-Down / Bird's-Eye Diagrammatic* (tampilan peta/skema),
  - *Medium / Group Shot* (aksi & reaksi karakter),
  - *Close-Up / Extreme Close-Up Insert* (ekspresi, meteran, mekanisme inti).
- **Gerakan Kamera Bertujuan:** *Slow dolly-in* (`0.15–0.35%/f`), *crane-up/pull-back*, atau *micro-drift* halus pada shot bacaan/diagram. Dilarang *handheld shake* liar atau frame beku $\ge 4$ frame.
- **Transisi Bersih:** Dominan **Hard Cut** antar skala shot + transisi halus (*pan/reframe*, crossfade pendek 6–8 frame, atau white flash 4 frame untuk perubahan babak). Hindari transisi *gimmick* (spin/glitch berlebihan).

### 2.6 Pencahayaan 3 Fase (*Time-of-Day Storytelling*) & Palet Warna
- **Gunakan Pencahayaan sebagai Penanda Babak (tanpa kartu teks pemisah):**
  1. **Siang (`day` — sudah tersedia di `lights.ts`):** Cerah, biru langit bersih, bayangan abu-kebiruan → fase *Hook & Masalah*.
  2. **Sore / Hangat (`golden` — sudah tersedia di `lights.ts`):** Palet krem-oranye hangat, bayangan memanjang → fase *Analogi Sehari-hari / Penutup Reflektif*.
  3. **Malam (`night` — rencana tambahan preset ke-3):** Langit biru dongker + cahaya lokal hangat pada subjek + **bayangan biru kobalt jenuh** (bukan hitam pekat agar detail tetap terbaca di layar HP redup) → fase *Eksperimen / Klimaks / Pengungkapan*.
- **Hierarki Warna:** Lingkungan netral/desaturasi (krem, abu, putih gading) vs titik fokus ber-saturasi tinggi (oranye, kuning, merah, hijau cerah).

### 2.7 Ritme Visual & Pacing Curve (Target 50–65 Detik)
- **Hook Cepat (`0,0–4,5s`):** Cut pertama terjadi di `1,5–2,2s` (skala masalah/fenomena → reaksi/objek fokus).
- **Fase Penjelasan (`4,5–40s`):** Pergantian visual bermakna (cut shot, ubah sudut kamera, munculnya ikon/diagram/aksi baru) setiap **2–4 detik** (target **14–22 shot** dalam 55–60 detik).
- **Klimaks & Payoff (`40–60s`):** Akselerasi *insert* visual mekanisme kunci + visualisasi hasil akhir yang memuaskan dalam **satu cerita utuh selesai**.

---

## 3. Pemetaan ke Infrastruktur VPS CPU-Only (`swangle`)

| Kategori | Elemen Visual | Status di Repo (`src/shared/kokisoyo25d/`) | Strategi Eksekusi CPU-Only (`swangle`) |
|---|---|---|---|
| **Siap Pakai (Realistis & Cepat)** | Dunia 3D low-poly prosedural, `twoTone` shading, `CanvasTexture` (`paint.ts`), karakter Canvas2D `Pen` (`cardShade`), `LIGHTS.day` & `LIGHTS.golden`, kamera rig (`pushK`, `autoFraming.ts`), DOM/SVG overlay Remotion | **Sudah tersedia** (`Stage25D.tsx`, `proceduralWorld.ts`, `paint.ts`, `lights.ts`, `cameraRig.ts`) | Pertahankan `dpr={1}`, geometri <30k–50k tris, `--gl=swangle --concurrency=2`. |
| **Realistis dengan Optimasi** | Outline konsisten, bayangan jatuh, DoF selektif, preset pencahayaan `night`, pustaka ikon komik SVG (`lightbulb`, `arrow`, `dial`, `sparkle`) | `InkPass` & `LensBlur` sudah ada di `Stage25D.tsx` (`draft`/`look`/`final`); `night` & ikon SVG belum dipaketkan | Gunakan `EdgesGeometry` + `LineSegments` / `InkPass` ringan, maks 1 `DirectionalLight` berbayangan (1024–2048px) + *blob shadow* untuk objek massal, `THREE.Fog` untuk pemisahan latar, serta mode `draft` (`multisampling=0`) saat iterasi. |
| **Dihindari di CPU-Only** | Stack post-processing berat bersamaan (SSAO + full-res Bokeh + multi-pass Bloom + SMAA), material PBR/envmap kompleks, banyak point/spot light dinamis, simulasi fisika real-time (cloth/fluida/partikel masif) | Tidak digunakan di `Stage25D` | Dilarang masuk ke template Shorts harian agar waktu render tetap stabil dan tidak OOM/timeout di VPS. |

---

## 4. Standar Editorial Baku Kok Iso Yo?

1. **Durasi Target:** **50–65 detik** (`1.500–1.950 frame @ 30 FPS`), idealnya di rentang manis **55–60 detik** (~120–155 kata Bahasa Indonesia, ~850–1.050 karakter).
2. **Satu Video = Satu Cerita Utuh:** Membahas 1 fenomena/pertanyaan spesifik dan menyelesaikannya sampai tuntas (ada *payoff* memuaskan). Hindari memotong satu topik jadi seri bersambung yang menggantung.
3. **Hook 0–2 Detik:** Kalimat pembuka + visual pembuka langsung memicu rasa penasaran atau kontradiksi konkret dalam ≤2 detik pertama (tanpa intro salam atau pengantar bertele-tele).
4. **Pemilihan Topik:** Prioritaskan topik dekat kehidupan sehari-hari, mengejutkan, unik, dan memiliki **potensi visualisasi mekanis/3D yang kuat**.
5. **Judul Non-Akademis:** Hindari judul seperti makalah/jurnal (*"Analisis Kerentanan Populasi..."*); gunakan bahasa obrolan penasaran yang ringkas dan jujur (*"Kenapa Petir Nggak Pernah Lurus?"*).
6. **Akurasi Fakta Wajib:** Setiap klaim sains/sejarah/teknologi wajib melewati daftar verifikasi fakta (`factCheckNotes`) sebelum naskah dikunci; dilarang mengorbankan kebenaran demi sensasi.
7. **Bahasa Indonesia Natural:** Tulis untuk **didengar**, bukan dibaca seperti artikel — kalimat pendek, ritmis, konversasional, mudah dilafalkan TTS.
8. **Nol Subtitle Permanen:** Teks di layar **hanya** untuk informasi penting (label bagian, angka kunci, rumus singkat, tanda/rambu diegetik, meteran) dengan ukuran terbaca di layar HP ($\ge 30\text{px}$ pada kanvas 1080p) dan **anti-emoji Unicode**.
9. **Ritme Shot 2–4 Detik:** Setiap scene/shot memiliki perubahan aksi, sudut kamera, atau visual cue setiap 2–4 detik.
10. **Target Produksi Terkendali Kualitas:** Target awal hingga **3 video/hari** hanya dijalankan jika seluruh gerbang QC (editorial, durasi audio, visual contact sheet, dan `short_qa.py`) lolos.
