# PANDUAN STANDAR PRODUKSI (PRODUCTION RULES V4 — EDITORIAL & 2.5D-in-3D)
## Repository: Kok Iso Yo? Studio (`remotion_engine_acc`)

Dokumen ini adalah aturan produksi dan **standar editorial resmi** yang **WAJIB dibaca dan dipatuhi** sebelum memulai episode baru. Seluruh produksi Shorts *Kok Iso Yo?* mengacu pada:
- **Visual Style Guide:** `docs/VISUAL_STYLE_GUIDE.md`
- **Arsitektur Audio & TTS:** `docs/TTS_ARCHITECTURE.md`
- **Visual Skill & Starter 2.5D-in-3D:** `.agy/skills/cartoon-3d-short/SKILL.md`, starter baku **`templates/kokisoyo-25d/`**, dan engine **`src/shared/kokisoyo25d/`**.

---

## A. STANDAR EDITORIAL UTAMA KOK ISO YO? (WAJIB UNTUK SEMUA SHORTS)

1. **Format & Durasi Utama:** YouTube Shorts / Reels vertikal `9:16` berdurasi **50–65 detik** (`1.500–1.950 frame @ 30 FPS`; titik ideal **55–60 detik**).
2. **Satu Video = Satu Cerita Utuh:** Setiap episode membahas **satu fenomena atau satu pertanyaan spesifik** dan menyelesaikannya sampai tuntas (wajib memiliki **pembukaan**, **pengembangan/mekanisme**, dan **penyelesaian/payoff** yang memuaskan). Hindari memotong satu topik menjadi seri bersambung yang menggantung.
3. **Hook Kuat 0–2 Detik (Ketat $\le 2{,}0\text{s}$):** Kalimat dan visual pada 0–2 detik pertama harus langsung memancing rasa penasaran atau kontradiksi konkret — tanpa salam pembuka, pengantar klise, atau jeda koma di tengah hook (Scene 1 maksimal `2` detik dan estimasi durasi baca hook wajib $\le 2{,}0\text{s}$).
4. **Topik Dekat Kehidupan & Kaya Potensi Visual:** Prioritaskan fenomena sehari-hari, fakta mengejutkan, atau mekanisme unik yang relevan lintas audiens dan kuat untuk divisualisasikan secara 3D/2.5D.
5. **Anti-Judul Akademis:** Dilarang memakai gaya judul makalah/jurnal (*"Analisis..."*, *"Kajian..."*, *"Studi..."*, istilah akademis kaku). Gunakan judul obrolan yang memancing rasa ingin tahu, ringkas, dan jujur.
6. **Riset & Verifikasi Fakta Wajib:** Setiap klaim sains, teknologi, atau sejarah wajib diverifikasi (`factCheckNotes`) sebelum naskah dikunci. Dilarang mengorbankan akurasi demi sensasi atau memakai analogi yang menimbulkan kesalahpahaman teknis.
7. **Narasi Bahasa Indonesia Natural & Proporsional Durasi:** Tulis untuk **didengar**, bukan dibaca seperti artikel. Kalimat pendek, mengalir, konversasional, dengan estimasi durasi baca pra-TTS yang memperhitungkan suku kata, jeda tanda baca, akronim, dan pelafalan angka/satuan (bukan hanya hitung karakter/kata mentah) agar narasi pas di 50–65 detik tanpa dipaksa cepat. *Keterbatasan:* estimator berbasis teks adalah guardrail heuristik pra-TTS (tempo aktual bervariasi tergantung voice TTS, prosodi, dan pelafalan istilah asing), sehingga durasi final tetap wajib diverifikasi ulang dengan `ffprobe` setelah audio TTS terbentuk.
8. **Identitas Visual Baku (`2.5D-in-3D Cartoon Explainer`):** Gunakan `Stage25D` (`src/shared/kokisoyo25d/`) dengan dunia 3D cel-shaded ber-outline hitam, karakter 2D-in-3D ekspresif, pencahayaan penanda babak (`day`, `golden`, dan `night` bila tersedia), serta variasi sudut kamera (*low-angle*, *wide*, *top-down*, *medium*, *close-up*).
9. **Ritme Visual 2–4 Detik per Shot:** Setiap shot berganti secara bermakna setiap **2–4 detik** (~15–22 shot per episode) tanpa dua komposisi identik berurutan.
10. **Anti-Subtitle Permanen:** Dilarang menampilkan subtitle permanen di sepanjang video. Teks di layar (`onScreenLabel`) hanya untuk informasi visual penting (label singkat, angka kunci, rumus pendek, rambu/meteran diegetik) maksimal 4–5 kata dan **nol emoji Unicode**.
11. **Target Produksi Terkendali Kualitas:** Target awal hingga **3 video per hari** hanya dijalankan apabila seluruh tahap validasi editorial, audio, dan QC visual lolos standar.

---

## 0. ATURAN ISOLASI & PERLINDUNGAN ASET (FROZEN)
1. **Modul Terkunci (FROZEN):**
   - `src/bridge/` dan `public/bridge/` **DILARANG DIUBAH/DIHAPUS**.
   - `src/ship/` dan `src/ep2_badak/` (beserta `src/ep2_badak/subtitles.tsx`) **DILARANG DIUBAH/DIHAPUS** kecuali atas instruksi eksplisit.
   - `src/Root.tsx` hanya boleh ditambah entri komposisi baru tanpa mengubah komposisi lama.
2. **Isolasi Episode Baru:**
   - Salin starter dari `templates/kokisoyo-25d/` ke `src/ep<Nomor>_<Topik>/` (atau ke `src/sandboxes/<nama>/` untuk look-match test).
   - Aset spesifik episode ditempatkan di `public/ep<Nomor>/`. Jangan menaruh file eksperimen besar yang tidak dipakai di `public/`.
   - Daftarkan `<Composition id="Ep<Nomor>" ... />` dan `<Composition id="Ep<Nomor>-Preview" ... />` di `src/Root.tsx`.
3. **WebGL Backend Wajib di Linux VPS:**
   - Pada VPS CPU-only Linux, `--gl=angle` gagal membuat konteks WebGL. **WAJIB gunakan `--gl=swangle`** di semua perintah still, contact sheet, dan render MP4.

---

## 1. TEMPLATE BAKU & STANDAR VISUAL (`templates/kokisoyo-25d/`)
1. **Gaya Utama:** *2D Cartoon Characters in a Colorful 3D World* (karakter/prop digambar via Canvas2D `Pen`, masuk sebagai billboard layer `NOINK=3` dengan `cardShade`, di dalam dunia 3D prosedural `twoTone`).
2. **Tone Mapping & Warna:**
   - WAJIB memakai **`ToneMappingMode.NEUTRAL`** (`Stage25D.tsx`) agar kalibrasi `LIGHTS`, `untone()`, `GradeEffect`, dan target warna di `.agy/skills/cartoon-3d-short/references/reports/` akurat. **DILARANG** mengganti ke `ACES_FILMIC`.
3. **Aset 3D Tanpa GLB Dummy:**
   - Bangun lingkungan/vegetasi/prop secara prosedural memakai `src/shared/kokisoyo25d/proceduralWorld.ts` (`addStorybookTree`, `addBushCluster`, `addRockCluster`, `StaticBatch`, `createWaterPlane`). Jangan bergantung pada file `.glb` kosong.
4. **Mode Performa vs Kualitas (`renderMode` / `inputProps.post.mode`):**
   - `draft`: `multisampling={0}`, `lensBlur={false}` — untuk iterasi cepat layout, framing, dan gerak kamera.
   - `look`: `multisampling={0}`, `lensBlur={true}` (selektif via `DOF` `cInf`) — untuk verifikasi tampilan & `sbs_sheet.py`.
   - `final`: `multisampling={4}`, `lensBlur={true}` — untuk render master final.

---

## 2. ALUR KERJA WAJIB 4 GERBANG (ANTI-GAGAL & HEMAT TOKEN)

Dilarang mengkodekan seluruh episode atau merender MP4 penuh sebelum melewati 4 gerbang berurutan:

### GERBANG 1: Storyboard & Style Brief
Susun tabel storyboard micro-shot (durasi 2–3 detik per shot, variasi sudut kamera, target framing `autoFraming.ts`, preset `day`/`golden`, dan label teks minimal jika ada) serta **tunggu persetujuan user**.

### GERBANG 2: Proof 1 Scene / 3 Frame Still + `sbs_sheet.py`
1. Implementasikan **Scene 1 (1–2 shot pertama)** saja dari `templates/kokisoyo-25d/`.
2. Jalankan `npx tsc --noEmit` (wajib 0 error).
3. Render **3 frame still** via `scripts/kokisoyo-qa/bridge-stills.mjs --gl swangle` ke `/tmp/...`:
   ```bash
   node scripts/kokisoyo-qa/bridge-stills.mjs --comp Ep<N>-Preview --frames 15,45,75 --out-dir /tmp/ep<N>_proof --gl swangle --mode look
   ```
4. Buat perbandingan berdampingan dengan referensi Skill menggunakan `sbs_sheet.py`:
   ```bash
   python3 -B scripts/kokisoyo-qa/sbs_sheet.py -o /tmp/ep<N>_proof/sbs.jpg --ours /tmp/ep<N>_proof --ref .agy/skills/cartoon-3d-short/references/frames/short01_0060.jpg .agy/skills/cartoon-3d-short/references/frames/short01_0180.jpg --h 640 --label
   ```
5. Periksa gambar secara visual & minta **persetujuan user** sebelum mengkodekan Scene 2+.

### GERBANG 3: Implementasi Bertahap (2–3 Scene per Batch) + Contact Sheet
1. Tambahkan maksimal **2–3 scene** per iterasi (pakai mode `draft` jika perlu uji gerak cepat, lalu `look` untuk verifikasi visual).
2. Jalankan `npx tsc --noEmit` + render contact sheet (`bridge-stills.mjs` + `sbs_sheet.py` atau `scripts/render-contact-sheet.mjs`).
3. Periksa tabrakan objek, sight-line kamera, konsistensi warna, dan keterbacaan label HP sebelum lanjut ke batch berikutnya.

### GERBANG 4: Render Final MP4 + Automated QA (`short_qa.py`)
1. Pastikan seluruh shot lolos contact sheet & persetujuan user.
2. Render MP4 final dengan `--gl=swangle`:
   ```bash
   npx remotion render src/index.ts Ep<N> out/Ep<N>_Final.mp4 --gl=swangle --concurrency=2 --timeout=120000
   ```
3. Jalankan ekstraktor shot & QA frame-by-frame:
   ```bash
   python3 -B scripts/kokisoyo-qa/bridge_shots.py src/ep<N>_<topik>/story.ts -o /tmp/ep<N>_qa/shots.json
   python3 -B scripts/kokisoyo-qa/short_qa.py out/Ep<N>_Final.mp4 /tmp/ep<N>_qa /tmp/ep<N>_qa/shots.json
   ```
4. Verifikasi `report.md` (0 black frame, 0 frozen span $\ge 12\text{f}$, audio/loudness aman, dan cek visual bila ada warning heuristik `POPS`).

---

## 3. STANDAR FORMAT 9:16, TEKS & KAMERA
1. **Resolusi & FPS:** Master `1080×1920 @ 30 FPS`, Preview `540×960 @ 30 FPS`.
2. **Kebijakan Teks & Anti-Subtitle Otomatis:**
   - **DILARANG** menampilkan dinding subtitle otomatis penuh pada gaya *2D-in-3D* kecuali user memintanya secara eksplisit.
   - Teks di layar hanya untuk informasi penting / angka / label diegetik singkat melalui `renderInfoOverlay` (kanvas virtual `1080×1920` ter-scale `width / 1080`, font HP $\ge 30\text{px}$ pada kanvas 1080p).
   - **Anti-Emoji:** Dilarang menggunakan emoji Unicode (cegah kotak tofu di Linux); gunakan teks bersih atau vektor `<svg>`/`Pen`.
3. **Dinamika Kamera & Framing 9:16:**
   - Micro-shot **2–3 detik**; tidak ada hold statis $\ge 4$ frame (selalu beri creeping push-in `0.15–0.35%/f` via `pushK()`).
   - Gunakan `frameObject9x16()` / `calcCameraDistance()` dari `src/shared/` agar karakter/objek tidak terpotong tepi layar.
   - Tambahkan properti foreground seperlunya di luar garis pandang subjek (`blocksAnySightLine`).

---

## 4. PIPELINE AUDIO OFFLINE (`templates/audio-py/` via `.venv-audio/`)
1. **Virtual Environment Terisolasi:** Selalu jalankan skrip audio memakai `.venv-audio/bin/python -B` (flag `-B` mencegah `__pycache__/`; `.venv-audio/` sudah di-ignore di `.gitignore` dan dilarang di-commit atau menginstal `scipy`/`numpy` ke Python sistem).
2. **Perintah Standar Mix & Loudness Episode:**
   ```bash
   .venv-audio/bin/python -B templates/audio-py/mix_audio.py \
     --voice public/audio/<vo_file> \
     --words src/ep<N>_<topik>/words.json \
     --shots /tmp/ep<N>_qa/shots.json \
     --preset curious_doc \
     --duck-db -4.5 \
     --target-lufs -14.5 \
     --ceil-dbtp -1.2 \
     --out-dir /tmp/ep<N>_audio \
     --aac
   ```
3. **Standar Teknis Shorts/Reels:** Target integrated loudness **`-14.5 LUFS`** (rentang aman `-14.0` s/d `-15.0 LUFS`), True Peak **$\le -1.2\text{ dBTP}$** (nol clipping), dan ducking otomatis berbasis `words.json` (`s`/`e`, `start`/`end`, atau Whisper `segments`/`words`; fallback VAD amplop bila tanpa `words.json`).
