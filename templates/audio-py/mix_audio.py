"""Kok Iso Yo? offline audio mix, auto-ducking, SFX sync, and BS.1770-4 loudness pipeline."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
from scipy import ndimage

from dsp import (
    SR,
    dbg,
    ensure_wav_48k,
    fades,
    g2db,
    integrated,
    limiter,
    momentary,
    norm_to,
    ns,
    place,
    read_wav,
    rng,
    st,
    true_peak,
    write_wav,
)
from music_beds import render_music_bed
from sfx_gen import ambience_bed, chime_reveal, impact_sub, pop_ui, tick_pulse, whoosh


def load_speech_spans(words_path: Path | None, voice_st: np.ndarray | None, dur: float) -> tuple[list[tuple[float, float]], str]:
    """Load speech timestamps from JSON (supports s/e, start/end, Whisper segments/words) or detect from voice."""
    if words_path is not None:
        raw = json.loads(words_path.read_text(encoding="utf-8"))
        items: list[dict[str, Any]] = []
        if isinstance(raw, list):
            items = raw
        elif isinstance(raw, dict):
            if isinstance(raw.get("words"), list):
                items = raw["words"]
            elif isinstance(raw.get("segments"), list):
                for seg in raw["segments"]:
                    if isinstance(seg, dict) and isinstance(seg.get("words"), list) and seg["words"]:
                        items.extend(seg["words"])
                    elif isinstance(seg, dict):
                        items.append(seg)
            elif isinstance(raw.get("items"), list):
                items = raw["items"]

        spans: list[tuple[float, float]] = []
        for it in items:
            if not isinstance(it, dict):
                continue
            s = it.get("s", it.get("start"))
            e = it.get("e", it.get("end"))
            if s is not None and e is not None:
                sf, ef = float(s), float(e)
                if ef > sf and sf < dur:
                    spans.append((max(0.0, sf), min(dur, ef)))
        if spans:
            spans.sort()
            merged: list[tuple[float, float]] = []
            for sf, ef in spans:
                if merged and sf - merged[-1][1] <= 0.28:
                    merged[-1] = (merged[-1][0], max(merged[-1][1], ef))
                else:
                    merged.append((sf, ef))
            return merged, f"json ({len(items)} items -> {len(merged)} speech phrases)"

    if voice_st is not None and voice_st.shape[1] > 0:
        # Envelope-based fallback speech activity detection at 10 ms hop
        hop = ns(0.01)
        mono = np.max(np.abs(voice_st), axis=0)
        n_win = max(1, len(mono) // hop)
        rms = np.sqrt(np.mean(mono[: n_win * hop].reshape(n_win, hop) ** 2, axis=1))
        peak_ref = float(np.percentile(rms, 95)) if len(rms) else 0.0
        thr = max(peak_ref * 0.06, dbg(-42.0))
        active = ndimage.binary_dilation(rms > thr, iterations=12)
        spans = []
        in_seg = False
        s_idx = 0
        for idx, flag in enumerate(active):
            if flag and not in_seg:
                in_seg = True
                s_idx = idx
            elif not flag and in_seg:
                in_seg = False
                spans.append((s_idx * 0.01, idx * 0.01))
        if in_seg:
            spans.append((s_idx * 0.01, min(dur, len(active) * 0.01)))
        return spans, f"envelope-vad ({len(spans)} active phrases)"

    return [], "none"


def build_duck_curve(n: int, spans: list[tuple[float, float]], duck_db: float, pause_boost_db: float = 1.5) -> np.ndarray:
    """Smooth dB curve: ducks music down by `duck_db` (negative) during VO spans with pre-roll anticipation."""
    curve = np.full(n, float(pause_boost_db), dtype=np.float64)
    if not spans:
        return np.zeros(n, dtype=np.float64)
    for sf, ef in spans:
        a = max(0, ns(sf - 0.10))
        b = min(n, ns(ef + 0.14))
        if b > a:
            curve[a:b] = float(duck_db)
    # 90 ms smooth moving-average transition avoids pumping
    return ndimage.uniform_filter1d(curve, max(1, ns(0.09)), mode="nearest")


def build_sfx_stem(dur: float, shots_path: Path | None, seed: int, auto_sfx: bool) -> tuple[np.ndarray, list[str]]:
    """Build procedural SFX stem synced to shot transitions or hook/reveal milestones."""
    n = ns(dur)
    out = np.zeros((2, n), dtype=np.float64)
    cues_log: list[str] = []
    r = rng(seed + 99)

    cut_times: list[float] = []
    if shots_path is not None and shots_path.exists():
        raw = json.loads(shots_path.read_text(encoding="utf-8"))
        shot_list = raw.get("shots", raw) if isinstance(raw, dict) else raw
        fps = float(raw.get("fps", 30)) if isinstance(raw, dict) else 30.0
        if isinstance(shot_list, list):
            for idx, sh in enumerate(shot_list):
                if idx == 0 or not isinstance(sh, dict):
                    continue
                t_sec = sh.get("startSec")
                if t_sec is None and sh.get("from") is not None:
                    t_sec = float(sh["from"]) / fps
                if t_sec is not None:
                    tf = float(t_sec)
                    if 0.25 < tf < dur - 0.25:
                        cut_times.append(tf)

    if cut_times:
        for idx, tc in enumerate(cut_times):
            if idx % 2 == 0:
                w = whoosh(0.42, r, peak=0.16, f_lo=360.0, f_hi=2100.0)
                place(out, w, max(0.0, tc - 0.16), p=-0.15 if idx % 4 == 0 else 0.15, gain=0.55)
                cues_log.append(f"t={tc:.2f}s whoosh_cut")
            else:
                p_sig = pop_ui(r, pitch=1.0 + 0.1 * (idx % 3))
                place(out, p_sig, tc, p=0.12, gain=0.45)
                cues_log.append(f"t={tc:.2f}s pop_ui")
    elif auto_sfx and dur >= 3.0:
        # Subtle documentary hook pulse + mid reveal chime + closing tick
        place(out, impact_sub(r, weight=0.65), 0.08, p=0.0, gain=0.55)
        cues_log.append("t=0.08s impact_hook")
        t_mid = round(dur * 0.45, 2)
        place(out, chime_reveal(r, base=880.0), t_mid, p=0.22, gain=0.50)
        cues_log.append(f"t={t_mid:.2f}s chime_reveal")
        if dur >= 8.0:
            t_whoosh = round(dur * 0.25, 2)
            place(out, whoosh(0.40, r), t_whoosh, p=-0.18, gain=0.48)
            cues_log.append(f"t={t_whoosh:.2f}s whoosh_transition")
            t_tick = round(dur * 0.72, 2)
            place(out, tick_pulse(r, accent=True), t_tick, p=-0.1, gain=0.5)
            cues_log.append(f"t={t_tick:.2f}s tick_pulse")

    return fades(out, 0.01, 0.08), cues_log


def measure_ffmpeg_ebur128(wav_path: Path) -> dict[str, str]:
    """Run ffmpeg ebur128 measurement to cross-verify BS.1770-4 integrated loudness & true peak."""
    if not shutil.which("ffmpeg"):
        return {}
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-nostats",
        "-i",
        str(wav_path),
        "-af",
        "ebur128=peak=true",
        "-f",
        "null",
        "-",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    summary: dict[str, str] = {}
    lines = res.stderr.splitlines()
    in_sum = False
    for ln in lines:
        s = ln.strip()
        if s == "Summary:":
            in_sum = True
            continue
        if in_sum and ":" in s:
            k, v = s.split(":", 1)
            summary[k.strip()] = v.strip()
    return summary


def encode_aac(wav_path: Path, m4a_path: Path) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(wav_path),
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        str(SR),
        "-movflags",
        "+faststart",
        str(m4a_path),
    ]
    subprocess.run(cmd, check=True)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Kok Iso Yo? offline audio mix & BS.1770-4 loudness pipeline (.venv-audio)."
    )
    p.add_argument("--voice", type=Path, default=None, help="Input voice-over (.wav/.mp3/.m4a). Optional if --duration given.")
    p.add_argument("--words", type=Path, default=None, help="Optional words/segments JSON for VO ducking.")
    p.add_argument("--shots", type=Path, default=None, help="Optional shots.json from bridge_shots.py for SFX cut cues.")
    p.add_argument("--duration", type=float, default=None, help="Target duration in seconds (inferred from --voice if omitted).")
    p.add_argument("--out-dir", type=Path, required=True, help="Output directory for mix.wav, stems, and cues_report.md.")
    p.add_argument(
        "--preset",
        choices=["curious_doc", "march_tension", "wonder_calm", "none"],
        default="curious_doc",
        help="Documentary music bed preset (default: curious_doc).",
    )
    p.add_argument(
        "--ambience",
        choices=["none", "forest", "river", "wind"],
        default="none",
        help="Optional procedural ambience layer (default: none).",
    )
    p.add_argument("--duck-db", type=float, default=-4.5, help="Music ducking gain in dB during VO spans (default: -4.5).")
    p.add_argument("--target-lufs", type=float, default=-14.5, help="Target integrated loudness in LUFS (default: -14.5).")
    p.add_argument("--ceil-dbtp", type=float, default=-1.2, help="True peak ceiling in dBTP (default: -1.2).")
    p.add_argument("--seed", type=int, default=2026, help="Deterministic RNG seed (default: 2026).")
    p.add_argument("--no-sfx-auto", action="store_true", help="Disable automatic milestone SFX when --shots is absent.")
    p.add_argument("--aac", action="store_true", help="Also encode mix.m4a (AAC 192 kbps) via ffmpeg.")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    out_dir: Path = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="kokisoyo_audio_") as tmp_str:
        tmp_dir = Path(tmp_str)
        voice_raw: np.ndarray | None = None
        if args.voice is not None:
            wav_48k = ensure_wav_48k(args.voice, tmp_dir)
            voice_raw = st(read_wav(wav_48k))

        if args.duration is not None:
            dur = float(args.duration)
        elif voice_raw is not None:
            dur = voice_raw.shape[1] / SR
        else:
            raise SystemExit("Either --voice or --duration must be provided.")

        n = ns(dur)
        # Prepare Voice stem
        if voice_raw is not None:
            v_stem = np.zeros((2, n), dtype=np.float64)
            m = min(voice_raw.shape[1], n)
            v_stem[:, :m] = voice_raw[:, :m]
            if np.isfinite(integrated(v_stem)):
                v_stem = norm_to(v_stem, args.target_lufs - 0.8)
        else:
            v_stem = np.zeros((2, n), dtype=np.float64)

        spans, span_src = load_speech_spans(args.words, voice_raw, dur)
        duck_curve = build_duck_curve(n, spans, duck_db=args.duck_db)

        # Prepare Music + optional ambience stem
        # Keep un-ducked music reference safely under voice (-20.5 LUFS when voice exists, -15.5 when instrumental only)
        music_ref = -20.5 if voice_raw is not None else args.target_lufs - 0.5
        m_raw = render_music_bed(dur, preset=args.preset, seed=args.seed, ref_lufs=music_ref)
        if args.ambience != "none":
            amb = ambience_bed(dur, rng(args.seed + 31), kind=args.ambience)
            if np.isfinite(integrated(amb)):
                amb = norm_to(amb, music_ref - 6.0)
            m_raw = m_raw + amb

        m_stem = m_raw * (10.0 ** (duck_curve / 20.0))[None, :]

        # Prepare SFX stem (-6 dB relative to bed reference when VO active)
        s_raw, sfx_cues = build_sfx_stem(dur, args.shots, seed=args.seed, auto_sfx=not args.no_sfx_auto)
        if np.isfinite(integrated(s_raw)):
            s_target = (args.target_lufs - 7.5) if voice_raw is not None else (args.target_lufs - 4.0)
            s_stem = norm_to(s_raw, s_target)
        else:
            s_stem = s_raw

        # Mix, normalize to target LUFS, apply 4x look-ahead limiter, and trim if needed
        mix = fades(v_stem + m_stem + s_stem, 0.005, 0.06)
        if np.isfinite(integrated(mix)):
            mix = norm_to(mix, args.target_lufs)
        mix, gr_curve = limiter(mix, ceil_db=args.ceil_dbtp)
        # Re-check if limiter shaved peaks enough to push loudness off-target
        cur_lufs = integrated(mix)
        if np.isfinite(cur_lufs) and abs(cur_lufs - args.target_lufs) > 0.25:
            delta = np.clip(args.target_lufs - cur_lufs, -2.0, 2.0)
            mix, _ = limiter(mix * dbg(delta), ceil_db=args.ceil_dbtp)

        mix_wav = out_dir / "mix.wav"
        write_wav(mix_wav, mix)
        write_wav(out_dir / "stem_voice.wav", v_stem)
        write_wav(out_dir / "stem_music.wav", m_stem)
        write_wav(out_dir / "stem_sfx.wav", s_stem)

        m4a_path = out_dir / "mix.m4a"
        if args.aac:
            encode_aac(mix_wav, m4a_path)

        final_lufs = integrated(mix)
        final_tp = true_peak(mix)
        v_lufs = integrated(v_stem)
        m_lufs = integrated(m_stem)
        s_lufs = integrated(s_stem)
        gr_min_db = g2db(float(np.min(gr_curve))) if len(gr_curve) else 0.0
        ebur = measure_ffmpeg_ebur128(mix_wav)

        report_lines = [
            "# Audio Mix & Loudness Report (Kok Iso Yo?)",
            "",
            f"- **Duration:** `{dur:.2f}s` (`{SR} Hz` stereo)",
            f"- **Voice input:** `{args.voice if args.voice else 'none (instrumental)'}`",
            f"- **Speech detection (`words.json`):** `{span_src}`",
            f"- **Music preset / Ambience:** `{args.preset}` / `{args.ambience}` (duck `{args.duck_db:.1f} dB`)",
            f"- **Final Integrated Loudness (BS.1770-4):** `{final_lufs:.2f} LUFS` (target `{args.target_lufs:.2f} LUFS`)",
            f"- **Final True Peak (4x):** `{final_tp:.2f} dBTP` (ceiling `{args.ceil_dbtp:.2f} dBTP`)",
            f"- **Max Limiter Gain Reduction:** `{gr_min_db:.2f} dB`",
            f"- **Stems Integrated LUFS:** Voice `{v_lufs:.2f}`, Music `{m_lufs:.2f}`, SFX `{s_lufs:.2f}`",
        ]
        if ebur:
            report_lines.extend(
                [
                    "",
                    "## FFmpeg `ebur128` Cross-Check",
                    *(f"- **{k}:** `{v}`" for k, v in ebur.items()),
                ]
            )
        if spans:
            report_lines.extend(["", "## Speech Spans (Ducking Active)"])
            for sf, ef in spans[:25]:
                report_lines.append(f"- `{sf:.2f}s` .. `{ef:.2f}s`")
            if len(spans) > 25:
                report_lines.append(f"- ... ({len(spans) - 25} more phrases)")
        if sfx_cues:
            report_lines.extend(["", "## SFX Cues"])
            for c in sfx_cues:
                report_lines.append(f"- {c}")

        (out_dir / "cues_report.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")

        print(
            f"Wrote {mix_wav} | Integrated={final_lufs:.2f} LUFS | TruePeak={final_tp:.2f} dBTP | LimiterMin={gr_min_db:.2f} dB"
        )
        if args.aac:
            print(f"Wrote {m4a_path}")


if __name__ == "__main__":
    main()
