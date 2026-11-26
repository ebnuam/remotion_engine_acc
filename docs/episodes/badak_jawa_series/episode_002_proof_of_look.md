# Episode 002 — Proof-of-Look Technical & Visual Report (Jalur 3C)

**Channel:** Kok Iso Yo?  
**Serial:** Badak Jawa (*Rhinoceros sondaicus*) — Bagian 1/4 (`Episode 002`)  
**Sumber Audio:** [`voiceover.mp3`](file:///home/vps-ubuntu2/remotion_engine_acc/public/episodes/episode002_badak_jawa/voiceover.mp3) (`00:00.00 – 01:32.15`, durasi VO `92,15 detik`, utuh tanpa pemotongan/penulisan ulang)  
**Target Komposisi Final:** `1080×1920` (9:16 vertikal), `30 FPS`, `~94,65 detik` (dengan *bridge* opening/closing visual)  
**Komposisi Proof-of-Look:** [`Ep002ProofOfLook`](file:///home/vps-ubuntu2/remotion_engine_acc/src/episodes/episode002_badak_jawa/ProofOfLook.tsx) (`150 frame` / `5 shot × 30 frame`)

---

## 1. Visual Contact Sheet (5 Shot Representatif)

Contact sheet resolusi tinggi tersedia di:  
[`episode_002_proof_of_look_contact_sheet.jpg`](file:///home/vps-ubuntu2/remotion_engine_acc/docs/episodes/badak_jawa_series/episode_002_proof_of_look_contact_sheet.jpg) (`2868×1234 px`)

| ID Shot | Keyframe & Rentang VO di Storyboard | Tipe Visual | Fokus Visual & Narasi | Status Verifikasi |
| :--- | :--- | :--- | :--- | :--- |
| **POL-1** | `f10` (`00:00.00–00:05.50`, Shot 01) | Full PBR 3D + Editorial Title | *Establishing shot* hutan hujan dataran rendah TN Ujung Kulon: pohon akar banir (*buttress roots*), liana, pakis (*paku-pakuan*), kubangan lumpur (*wallow*), cahaya pagi menembus kanopi, tipografi judul + koordinat `6°45'S 105°20'E`. | Lolos (0 artefak, bayangan lembut, teks aman di zona atas) |
| **POL-2** | `f40` (`00:12.50–00:18.50`, Shot 04) | Full PBR 3D Telephoto + Lower-Third | *Close-up* Badak Jawa (*Rhinoceros sondaicus*) tampak 3/4 depan: **cula tunggal pendek**, bibir atas prehensil, lipatan kulit leher/bahu khas, rongga telinga, dan mata di bawah pencahayaan *dappled forest* + *normal/roughness map*. | Lolos (anatomi 1 cula akurat, tidak tertutup caption bawah) |
| **POL-3** | `f70` (`00:18.50–00:31.00`, Shot 05–06) | Full PBR 3D 3-Layer + SVG Callout | Badak Jawa dalam kedalaman 3 lapis habitat (pakis latar depan → kubangan & badak pose *browsing* → pepohonan raksasa berkabut) dengan penunjuk garis tipis (*hairline taxonomy*) `Critically Endangered · 100% di TN Ujung Kulon`. | Lolos (*pointer* tepat di punggung bahu, kuku memijak tanah) |
| **POL-4** | `f100` (`00:31.00–00:49.50`, Shot 07–09) | Pure 2D Editorial Cartography & Data | Peta Nusantara → Pulau Jawa + *zoom inset* Semenanjung Ujung Kulon + grafik batang rentang estimasi Kemenhut (`87–100 ekor`) & survei kamera jebak 2026 (`~91 ekor`, rentang `74–99`). | Lolos (nol *overlap* teks, tanpa `<ThreeCanvas>`) |
| **POL-5** | `f130` (`01:02.00–01:26.50`, Shot 12–15) | Full PBR 3D Overcast + Telemetry HUD | Badak berada di koridor hutan berkabut lembap (*overcast*) sebagai ilustrasi risiko populasi tunggal (`0 cadangan liar`), diapit mini-peta jarak Selat Sunda–Anak Krakatau (`±50–60 km`) dan 3 kartu risiko terstruktur. | Lolos (badak terbaca jelas di jendela tengah tanpa tertutup vegetasi/HUD) |

---

## 2. Arsitektur Teknis Terisolasi (Baseline Episode 001 Tetap Utuh)

Seluruh kode Episode 002 dibangun terpisah dan **tidak menyentuh** `src/sandboxes/episode001_klorofil/`, `src/ep2_badak/`, `src/shared/kokisoyo25d/`, `src/bridge/`, `src/ship/`, `public/prototypes/`, maupun `voiceover.mp3`:

1. **Stage Khusus Dokumenter:** [`src/shared/doc3d/StageDoc3D.tsx`](file:///home/vps-ubuntu2/remotion_engine_acc/src/shared/doc3d/StageDoc3D.tsx)
   - Menggunakan `THREE.ACESFilmicToneMapping` (`exposure: 1.12`), `THREE.PCFSoftShadowMap`, dan `sRGBColorSpace`.
   - **Bebas `InkPass`, `twoTone` cel-shading, atau outline kartun.**
   - Menangani `frameloop="never"` milik `@remotion/three` secara sinkron dengan memanggil `advance(performance.now())` setelah aset GLB/tekstur asinkron selesai dimuat sebelum melepaskan `delayRender()`.
   - Pada *shot* 2D editorial (`use3D={false}` seperti `POL-4`), `StageDoc3D` **tidak me-mount `<ThreeCanvas>`**, sehingga beban WebGL hilang sepenuhnya saat rendering segmen peta/data.

2. **Aset Badak Jawa 3D (Jalur 3C):** [`JavanRhinoAsset.ts`](file:///home/vps-ubuntu2/remotion_engine_acc/src/episodes/episode002_badak_jawa/world/JavanRhinoAsset.ts)
   - Sumber dasar legal & bebas komersial: **Thomas Flynn (`nebulousflynn`) — *"Indian Rhino (Smoothie 3D)"*** berlisensi **CC-BY-4.0** (terverifikasi dari metadata GLB & API Sketchfab).
   - File teroptimasi: [`javan_rhino_3c.glb`](file:///home/vps-ubuntu2/remotion_engine_acc/public/episodes/episode002_badak_jawa/assets/javan_rhino_3c.glb) (`1,76 MB`, `20.548` *tris*, `10.396` *verts*) + [`javan_rhino_normal.png`](file:///home/vps-ubuntu2/remotion_engine_acc/public/episodes/episode002_badak_jawa/assets/javan_rhino_normal.png) + [`javan_rhino_roughness.png`](file:///home/vps-ubuntu2/remotion_engine_acc/public/episodes/episode002_badak_jawa/assets/javan_rhino_roughness.png).
   - Perbaikan material dari GLB mentah: menghapus *buggy glow* `emissiveFactor: 0.65` dan `metallicFactor: 0.59`, menyesuaikan tekstur difus ke rona abu-abu kecokelatan lembap khas hujan tropis, mengaktifkan `THREE.DoubleSide`, dan menormalisasi atribut posisi agar gerakan sekunder deterministik berjalan mulus (napas, anggukan *browsing*/*alert*, telinga berkedut, ayunan ekor, dan pergeseran bobot tanpa menggeser kuku di tanah).

3. **Ekosistem Hutan Tropis Ujung Kulon Full PBR 3D:** [`RainforestWorld.ts`](file:///home/vps-ubuntu2/remotion_engine_acc/src/episodes/episode002_badak_jawa/world/RainforestWorld.ts) & [`rainforestTextures.ts`](file:///home/vps-ubuntu2/remotion_engine_acc/src/episodes/episode002_badak_jawa/textures/rainforestTextures.ts)
   - Nol aset low-poly Kenney.
   - Batang pohon berakar banir (*fluted buttress trunks*), sulur liana melengkung (`CatmullRomCurve3`), tajuk kanopi berlapis *alpha-cutout instanced*, `>300` *instanced fern fronds* (*paku-pakuan*), semak daun lebar, kubangan lumpur reflektif, batang pohon tumbang berlumut, bebatuan organik halus, kabut eksponensial, dan *sunbeams* lembut.

---

## 3. Benchmark Render CPU (4 vCPU, `--gl=swangle`) & Proyeksi Episode 002

Hasil pengukuran aktual `bridge-stills.mjs` untuk render `1080×1920` JPEG (`scale=1`, Chromium *cold-launch* per frame):
- `POL-1` (f10, 3D PBR): `14.5s`
- `POL-2` (f40, 3D PBR Close-up): `14.6s`
- `POL-3` (f70, 3D PBR + SVG Overlay): `14.8s`
- `POL-4` (f100, Pure 2D Editorial tanpa WebGL): `0.8s`
- `POL-5` (f130, 3D PBR Overcast + Telemetry HUD): `13.9s`
- **Total verifikasi TypeScript (`npx tsc --noEmit`):** Lolos (0 error; 0 error browser console).

*Catatan proyeksi render video kontinu (`npx remotion render`):*  
Pada *cold single-still* (~`14s`), sekitar `~9–11 detik` terserap oleh inisialisasi halaman Chromium + pengunduhan/dekode GLB dan pembuatan tekstur kanvas per panggilan. Dalam *continuous sequence render* (di mana 1–4 tab Chromium menjaga *scene* tetap hidup di memori), biaya *steady-state* per frame 3D turun ke kisaran `~2.5–4.5 detik/frame`, sementara frame 2D murni berada di kisaran `~0.4–0.8 detik/frame`. Untuk Episode 002 berdurasi `~94,65 detik` (`~2.840 frame` dengan komposisi ±55% shot 3D PBR dan ±45% shot 2D editorial), estimasi render final di VPS 4 vCPU adalah sekitar **`~1,5 – 2,5 jam`** (jauh lebih ringan dibanding jika seluruh 328 detik dirender sekaligus).

---

## 4. Kesiapan Produksi Episode 002 Penuh (Menunggu Persetujuan)

Checklist sebelum masuk ke *coding* `Episode 002` utuh (`94,65 detik`):
- [x] Naskah Episode 002 (`00:00.00 – 01:32.15`) terkunci 100% sesuai audio asli.
- [x] Storyboard lengkap 17 shot + Inventaris Aset + Catatan Cek Fakta tersimpan rapi.
- [x] Asset Badak Jawa 1 cula terverifikasi lisensi CC-BY-4.0 dan terpasang di `StageDoc3D`.
- [x] Seluruh 5 *still* Proof-of-Look (`POL-1` s.d. `POL-5`) dan *Contact Sheet* lolos inspeksi visual.
- [ ] **Persetujuan User** atas *look*, pencahayaan, proporsi badak, dan gaya tipografi editorial sebelum memulai perakitan 17 shot Episode 002.
