# Kok Iso Yo? Audio Synth Pipeline (`templates/audio-py/`)

Pipeline audio offline (`numpy` + `scipy` + `ffmpeg`) untuk episode *Kok Iso Yo?* — menghasilkan music bed prosedural, auto-ducking berbasis timing VO (`words.json` atau deteksi amplop suara otomatis), SFX transisi/aksen prosedural, serta normalisasi loudness Shorts/Reels (`-14.5 LUFS`, True Peak $\le -1.2\text{ dBTP}$, nol clipping).

## Environment Terisolasi

Seluruh dependency Python dipasang di virtual environment lokal repo `.venv-audio/` (diabaikan di `.gitignore`):

```bash
.venv-audio/bin/python -B templates/audio-py/mix_audio.py --help
```

> Gunakan flag `-B` (`PYTHONDONTWRITEBYTECODE=1`) agar tidak meninggalkan folder `__pycache__` di repository.

## Penggunaan Standar

### 1. Mix VO + Musik + Ducking `words.json` + AAC untuk Remotion

```bash
.venv-audio/bin/python -B templates/audio-py/mix_audio.py \
  --voice public/audio/narasi.mp3 \
  --words src/ep<N>_<topik>/words.json \
  --shots /tmp/ep<N>_qa/shots.json \
  --preset curious_doc \
  --duck-db -4.5 \
  --target-lufs -14.5 \
  --ceil-dbtp -1.2 \
  --out-dir /tmp/ep<N>_audio \
  --aac
```

### 2. Format `words.json` yang Didukung

1. Array Bridge / Whisper ringkas: `[{"s": 0.12, "e": 0.45, "w": "Badak"}]`
2. Array `start`/`end`: `[{"start": 0.12, "end": 0.45, "text": "..."}]`
3. Object Whisper standar: `{"words": [...]}` atau `{"segments": [{"start": ..., "end": ..., "words": [...]}]}`
4. Tanpa `--words`: pipeline otomatis mendeteksi segmen suara langsung dari amplop `--voice`.

## Output Files (`--out-dir`)

- `mix.wav`: Master stereo `48 kHz` 16-bit PCM siap ukur / render.
- `mix.m4a`: Master AAC `192 kbps` (bila `--aac` diaktifkan) untuk `<Audio>` Remotion.
- `stem_voice.wav`, `stem_music.wav`, `stem_sfx.wav`: Stem terpisah untuk audit/penyesuaian.
- `cues_report.md`: Laporan LUFS BS.1770-4 per stem, cross-check `ffmpeg ebur128`, dan daftar cue SFX/ducking.
