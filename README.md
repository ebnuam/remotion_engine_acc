# Bridge Animation Engine (2.5D Characters in Stylized 3D World)

Engine animasi video vertikal (9:16) berbasis **Remotion + Three.js (@remotion/three)** dengan estetika kartun 2.5D berkualitas TV/sinematik (*Kurzgesagt / TED-Ed 3D style*).

---

## 🌟 Fitur Utama
1. **Dunia 3D Nyata**: Geometri prosedural Three.js (`build.ts`, `paint.ts`, `world.ts`), pencahayaan terarah (*directional sun*), kabut kedalaman, dan bayangan kontak.
2. **Karakter 2.5D Prosedural**: Digambar secara matematis pada Canvas 2D (`toon.ts`, `cast.ts`) lalu diproyeksikan sebagai billboard 3D yang merespons cahaya dan bayangan menggunakan custom GLSL shader (`cardshade.ts`).
3. **Kamera 3D Sinematik**: Pergerakan kamera dinamis (`dolly`, `crane`, `orbit`, `tilt`, `fov`) dengan kurva interpolasi halus (`glide`), menghasilkan **Depth Parallax** alami.
4. **Post-Processing Kelas Film**:
   - `LensBlur`: Depth of Field (DoF) optik nyata.
   - `InkPass`: Garis tinta komik/cel-shaded pada objek 3D.
   - `ACES Filmic Tone Mapping` + `Bloom HDR` + `Color Grade`.

---

## 📁 Struktur File (`src/bridge/`)

| File | Deskripsi |
| :--- | :--- |
| `Bridge.tsx` | Master Remotion composition & pipeline postprocessing EffectComposer |
| `story.ts` | Timeline durasi (1800 frame = 60s @ 30fps), babak cerita, dan koreografi kamera |
| `world.ts` | Three.js scene assembly dan update pergerakan per frame |
| `cast.ts` | Manajemen billboard karakter 2.5D, texture caching pool, & contact shadow |
| `toon.ts` | Engine gambar vektor karakter prosedural di kanvas 2D |
| `cardshade.ts`| GLSL custom shader untuk shading karakter agar menyatu dengan cahaya 3D |
| `build.ts` | Generator geometri 3D prosedural (mesh jembatan, pilar, air, tebing) |
| `paint.ts` | Tekstur prosedural canvas (batu, kayu, facade, atap) |
| `lights.ts` | Konfigurasi cahaya matahari, ambient tint, dan shadow maps |
| `shade.ts` | Modifikasi cel-shading material Three.js |
| `ink.ts` | Postprocessing garis outline komik cel-shaded |
| `lensblur.ts` | Thin-lens Depth of Field (DoF) blur optik |
| `grade.ts` | Color grading filmis per kondisi pencahayaan |

---

## 🚀 Panduan Setup di Linux VPS (Ubuntu / Debian)

### 1. Prasyarat Sistem
Pastikan Node.js (v18 atau v20) sudah terpasang.

Jalankan script setup otomatis:
```bash
chmod +x scripts/*.sh
./scripts/setup-vps.sh
```
*(Atau install manual dependensi Chromium headless)*:
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser ffmpeg libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2 fonts-freefont-ttf
npm install
```

---

## 🎬 Perintah Render

### Render Episode Penuh (1080x1920, 60s @ 30 FPS)
```bash
npm run render:linux
```
*(Atau dengan script bash)*:
```bash
./scripts/render-linux.sh
```

### Render Draft Cepat (540x960 Preview)
Untuk mengecek hasil render di VPS dengan cepat:
```bash
npm run render:preview
```

### Render Frame Tunggal (Still Image)
```bash
npm run still
```

---

## 📱 Panduan Integrasi Dashboard HP (Mobile Web)

Untuk mengontrol render dari browser HP tanpa harus buka terminal SSH:
1. Buat REST API sederhana (menggunakan Express.js, Fastify, atau Go).
2. Endpoint `POST /api/render` yang menjalankan:
   ```js
   const { exec } = require('child_process');
   exec('npm run render:linux', (err, stdout, stderr) => { ... });
   ```
3. Simpan file video ke folder publik (misal `out/`) dan sediakan link download/streaming `.mp4` langsung ke browser HP Anda.
