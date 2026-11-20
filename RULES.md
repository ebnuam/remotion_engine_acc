# PANDUAN STANDAR PRODUKSI (PRODUCTION RULES V2)
## Repository: Kok Iso Yo? Studio (`bridge-tes-engine`)

Dokumen ini adalah aturan produksi resmi yang **WAJIB dibaca dan dipatuhi oleh AI/Developer** di setiap sesi pembuatan episode baru (Episode 2 dan seterusnya). Dokumen ini dirancang agar proses produksi berjalan akurat dalam sekali jalan, hemat token, memiliki variasi gaya visual, dan mencegah kesalahan framing serta regresi kualitas visual.

---

## 0. ATURAN ISOLASI & PERLINDUNGAN ASET
1. **Modul Terkunci (FROZEN)**:
   - Direktori `src/bridge/` dan `public/bridge/` (aset inti Bridge Engine) **DILARANG DIUBAH/DIHAPUS**.
   - Direktori `src/ship/` (Episode 1: Kapal) **DILARANG DIUBAH/DIHAPUS**.
2. **Isolasi Episode Baru**:
   - Setiap episode baru WAJIB dibuat di dalam direktori terisolasi baru:
     - Kode: `src/ep<Nomor>_<Topik>/` (contoh: `src/ep2_lift/`, `src/ep3_blackhole/`).
     - Aset publik: `public/ep<Nomor>/` (contoh: `public/ep2/models/`, `public/ep2/textures/`).
     - Registrasi komposisi di `src/Root.tsx`: Tambahkan `<Composition id="Ep<Nomor>" ... />` dan `<Composition id="Ep<Nomor>-Preview" ... />`.
3. **Larangan Render MP4 Sembarangan**:
   - DILARANG merender video MP4 penuh sebelum fase storyboard teks dan visual contact sheet disetujui oleh user.

---

## 1. ALUR KERJA WAJIB 2 FASE (TOKEN-SAVING GATE)
Untuk menghemat token context window dan mencegah kerja ulang akibat salah tafsir konsep, setiap episode baru WAJIB melewati 2 fase bertahap:

### FASE 1: Storyboard Teks (Konseptual & Alignment)
Sebelum menulis **1 baris kode scene pun**, AI WAJIB menyajikan tabel Storyboard lengkap dan **MENUNGGU PERSETUJUAN USER**:
Tabel Storyboard harus memuat kolom:
| No Micro-Shot | Rentang Frame / Detik | Frasa VO (Whisper) | Gaya Visual | Objek Utama | Tipe Kamera (`wide/medium/closeup`) | Detail Lingkungan (3 Layer Depth) | Teks Badge UI |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |

> **PERINGATAN**: Jangan menulis kode scene Three.js / Remotion pada fase ini. Tanyakan persetujuan user terlebih dahulu.

### FASE 2: Coding, Typecheck & Verifikasi Contact Sheet
Setelah Fase 1 disetujui oleh user:
1. **Coding Scene**: Terapkan logika 3D/animasi menggunakan modul kamera terstandar `src/shared/camera/autoFraming.ts`.
2. **Typecheck 0 Errors**: Jalankan `npx tsc --noEmit` untuk memastikan tidak ada kesalahan TypeScript.
3. **Verifikasi Visual Contact Sheet**: Jalankan script contact sheet:
   ```bash
   node scripts/render-contact-sheet.mjs <CompositionId>-Preview <frames_kunci_comma_separated> output/ep<N>_contact_sheet.png
   ```
   Script ini akan merender 6–9 frame kunci dan menggabungkannya menjadi 1 gambar kolase.
4. **Persetujuan User**: Tampilkan contact sheet ke user. Hanya setelah user menyetujui ("Approved / Render Final"), baru lakukan render MP4 penuh.

---

## 2. STANDAR FORMAT & UI 9:16 PORTRAIT

### Resolusi & Frame Rate
- **Final Master**: `1080 x 1920` (9:16 Portrait) @ 30 FPS.
- **Fast Preview Draft**: `540 x 960` (9:16 Portrait) @ 30 FPS (untuk iterasi cepat di VPS CPU-only).

### Subtitle Overlay
- **Sinkronisasi**: WAJIB diekstrak langsung dari file audio voiceover menggunakan `faster-whisper` (jangan menebak durasi manual).
- **Tipografi**: Font sans-serif tebal (font-weight: 900, uppercase), warna putih solid.
- **Stroke & Outline**:
  - Di kanvas 1080p: Text stroke hitam pekat `3.5px–4.0px` + drop shadow berlapis.
  - Di kanvas 540p preview: Text stroke hitam `2.0px–2.5px`.
- **Ukuran Font**: WAJIB berukuran besar agar terbaca instan di layar smartphone:
  - Di kanvas 1080p: `68px – 74px` (line-height: 1.25, max-width: 86%).
  - Di kanvas 540p preview: `34px – 37px`.
- **Posisi Safe Zone**: `bottom: 19%` (aman dari UI TikTok, Instagram Reels, dan YouTube Shorts).
- **Background**: DILARANG menggunakan background box gelap di belakang subtitle (agar tidak menutupi visual 3D).

### Educational Badges & UI Callouts
- **Anti-Emoji**: DILARANG KERAS menggunakan emoji Unicode (seperti `💨`, `⚙`, `❌`, `⚖`, `🚀`). Linux Ubuntu server sering tidak memiliki font emoji warna lengkap sehingga emoji berubah menjadi kotak rusak (`□` tofu box).
- **Solusi Simbol**: Gunakan teks UPPERCASE bersih atau icon vektor inline `<svg>`.
- **Posisi Bebas Benturan**: Badge UI harus ditempatkan minimal pada `bottom: 33%` atau di area atas (`top: 14% – 25%`) agar memiliki jarak vertikal bebas minimal 120px dari subtitle.

---

## 3. AUDIO & RETENTION EDITING (VIRAL SHORT-FORM PACING)

1. **Micro-Shots (Potongan Cepat 2–3 Detik)**:
   - Durasi total video (~60–67 detik / 1800–2010 frames) WAJIB dipecah menjadi **22–28 micro-shots**.
   - Rata-rata durasi micro-shot: **60–90 frames (2.0–3.0 detik)**.
   - Setiap pergantian kalimat atau jeda frasa VO adalah sinyal untuk memotong (*cut*) ke angle baru.
2. **Variasi Sudut Kamera**:
   - Jangan mempertahankan sudut kamera yang sama lebih dari 3 detik.
   - Rotasi sudut kamera: *Wide shot → Low-angle dramatic → Medium profile → High aerial / bird's-eye → Macro / close-up detail → Broadside diagram → Grand pull-out*.
3. **Gerakan Kamera Halus (Camera Dynamics)**:
   - Di dalam setiap micro-shot, kamera tidak boleh diam statis 100%. Berikan pergerakan halus:
     - *Slow push-in* (zoom-in perlahan mendekati objek).
     - *Slow pull-out* (menjauh memberikan konteks luas).
     - *Lateral parallax arc* (bergerak melingkar perlahan memperlihatkan kedalaman 3D).

---

## 4. STANDAR VISUAL HIDUP & ROTASI GAYA (ANTI-REPETITIOUS)

Agar konten kanal Kok Iso Yo? tidak monoton, visual engine mendukung 4 gaya produksi yang dapat dirotasi per episode:

### 4 Pilihan Gaya Visual
1. **3D Cel-Shaded (Toon Explainer)**:
   - Post-processing: `InkPass` (garis tinta) + `ToneMappingEffect ACES_FILMIC` + `GradeEffect`.
   - Menggunakan material toon custom (`shade.ts`, `lights.ts`).
2. **3D Semi-Realistis (PBR Lightweight)**:
   - Gunakan model 3D berekstensi `.glb` / `.gltf` yang dioptimasi (low/medium poly) di `public/models/`.
   - Material: `MeshStandardMaterial` dengan pencahayaan terarah (*key light, fill light, rim light*).
   - Pastikan render tetap ringan di CPU VPS (`--gl=swangle`).
3. **2.5D Parallax (Realistic Illustrated Layers)**:
   - Membagi aset visual menjadi beberapa bidang gambar 2D beresolusi tinggi di dalam ruang 3D Three.js.
   - Parallax tercipta secara alami dari pergerakan kamera 3D melintasi layer sumbu Z.
4. **2D Motion Graphics (Diagram & Skematik Bersih)**:
   - Menggabungkan elemen Three.js datar, vektor SVG bergerak dinamis, dan tipografi kinetik.

### Prinsip 3 Layer Depth (Anti-Latar Polos)
Setiap shot lingkungan wajib memiliki minimal 3 layer kedalaman visual:
1. **Foreground**: Elemen dekat kamera yang bergerak cepat saat kamera bergerak (contoh: pelampung laut, daun pohon di sudut, partikel debu/cahaya, tiang railing).
2. **Midground**: Objek fokus cerita utama (contoh: kapal, mesin, mobil, gedung, karakter).
3. **Background / Horizon**: Latar belakang jauh yang bergerak sangat lambat (contoh: siluet kota jauh, pulau berkabut, pegunungan, awan 3D berlapis ganda, matahari/bulan).

### Aturan Lingkungan Bawah Air (`cameraY < 0`)
- Jika kamera masuk ke bawah permukaan air:
  - Warna background dan `scene.fog` WAJIB otomatis berubah ke warna laut pekat (misal: `#0d5c8c` atau `#166ea8`).
  - Dilarang membiarkan warna langit putih/cerah bocor ke bawah air.
  - Gunakan helper `getEnvironmentAtmosphere(cameraY)` dari `src/shared/camera/autoFraming.ts`.

---

## 5. FORMULA AUTO-FRAMING 9:16 (BEBAS TEBAK JARAK)
Untuk mencegah objek terpotong di layar portrait 9:16:
- WAJIB gunakan utility `calcCameraDistance` dari `src/shared/camera/autoFraming.ts`.
- Utility ini secara matematis menghitung jarak kamera yang tepat berdasarkan lebar objek ($W$), tinggi objek ($H$), aspect ratio $9/16$, vertical FOV, dan margin horizontal minimum (biasanya 12%–15%).

---

## 6. ATURAN REVISI CEPAT & HEMAT WAKTU
1. **Gunakan Still Render untuk Verifikasi**:
   - Untuk menguji perubahan kecil, render 1 frame still saja:
     ```bash
     npx remotion still <CompositionId>-Preview output/test_frame.png --frame=<frame_no> --gl=swangle --timeout=120000
     ```
2. **Revisi Parsial (FFmpeg Stitching)**:
   - Jika video final MP4 sudah pernah dirender dan terdapat revisi pada rentang frame tertentu (misal frame 400 sampai 600):
   - **JANGAN render ulang seluruh 2010 frame!**
   - Render hanya rentang frame yang diubah menggunakan opsi `--frames=400-600`.
   - Gabungkan segmen baru tersebut dengan segmen lama menggunakan `ffmpeg concat`.

---

## 7. CHEAT SHEET COMMANDS

| Kebutuhan | Perintah Terminal |
| :--- | :--- |
| **Typecheck** | `npx tsc --noEmit` |
| **Contact Sheet (6 frame)** | `node scripts/render-contact-sheet.mjs ShipEp1-Preview 60,240,470,960,1420,1920 output/sheet.png` |
| **Contact Sheet (Auto 6 frame)**| `node scripts/render-contact-sheet.mjs ShipEp1-Preview auto output/sheet_auto.png` |
| **Still Preview 1 Frame** | `npx remotion still ShipEp1-Preview output/frame.png --frame=470 --gl=swangle --timeout=120000` |
| **Render Final MP4 Background** | `setsid nohup npx remotion render <CompositionId> out/<file>.mp4 --concurrency=1 --gl=swangle --timeout=120000 </dev/null > out/<log>.log 2>&1 &` |
| **Cek Progress Render** | `tail -f out/<log>.log` |
