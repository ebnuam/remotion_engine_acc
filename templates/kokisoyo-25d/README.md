# Kok Iso Yo? 2.5D-in-3D Episode Starter Template

Template baku untuk membuat episode vertikal **9:16 (1080×1920 @ 30 FPS)** bergaya **2D Cartoon Characters in a Colorful 3D World** (selaras dengan `.agy/skills/cartoon-3d-short/SKILL.md` dan `RULES.md`).

## Cara Memulai Episode Baru

1. Salin folder ini ke `src/ep<Nomor>_<Topik>/` (atau ke `src/sandboxes/<nama>/` untuk uji coba look-match):
   ```bash
   cp -r templates/kokisoyo-25d src/ep3_contoh
   ```
2. Daftarkan komposisi `<Composition id="Ep3Contoh" ... />` dan `<Composition id="Ep3Contoh-Preview" ... />` di `src/Root.tsx`.
3. Mulai dari **Scene 1 saja** (1–2 shot pertama) dan uji dengan `renderMode="draft"` / `"look"` via `scripts/kokisoyo-qa/bridge-stills.mjs --gl swangle`.
4. Bandingkan hasil still terhadap `.agy/skills/cartoon-3d-short/references/frames/` menggunakan `scripts/kokisoyo-qa/sbs_sheet.py`.

## Isi Template
- `story.ts`: Timeline micro-shot (2–3 detik per shot), gramatika kamera (`glide`, `pushK`, `frameObject9x16`), `DOF`, dan `KICKS`.
- `characters.ts`: Generator karakter & prop 2D menggunakan Canvas2D `Pen` (`shadedFill`, `inkRing`, `gradFill`, kedipan mata, dan gerak jalan).
- `cast.ts`: Penempatan billboard `ActorBillboard` & `FxBillboard` pada layer `NOINK` lengkap dengan bayangan kontak (`drawContactBlob`).
- `world.ts`: Dunia 3D prosedural Three.js (`twoTone` Lambert, sky dome `NEUTRAL`, sungai beranimasi, pohon storybook, semak, batu, awan) **tanpa ketergantungan file `.glb` kosong**.
- `EpisodeTemplate.tsx`: Komposisi Remotion memakai `<Stage25D>` (`ToneMappingMode.NEUTRAL`) + slot opsional `renderInfoOverlay` SVG (tanpa subtitle otomatis penuh).
