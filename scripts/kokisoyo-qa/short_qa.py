#!/usr/bin/env python3
"""
Frame-by-frame QA inspector for rendered MP4 shorts (Linux VPS adapted from cartoon-3d-short short_qa.py).

- Inspects any MP4 via CLI (read-only on source MP4), writes outputs to external --outdir.
- Deterministic checks: video specs (ffprobe), duration/frame count, audio stream, EBU R128 loudness, silence spans.
- Heuristic checks (explicitly labeled as potential false positives): black frames, unplanned white frames,
  frozen spans >=12 frames, and frame-diff pop spikes.
"""

import argparse
import json
import os
import subprocess
import sys
import numpy as np
from PIL import Image, ImageDraw


def run_cmd(*cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def main():
    parser = argparse.ArgumentParser(
        description="Run frame-by-frame QA on any rendered MP4 and write report/sheets to --outdir."
    )
    parser.add_argument("video", help="Path to source MP4 (read-only)")
    parser.add_argument("outdir", help="Directory where QA report, npz, and 2s contact sheets are written")
    parser.add_argument("shots_json", nargs="?", default=None, help="Optional path to shots.json from bridge_shots.py")
    parser.add_argument("--no-sheets", action="store_true", help="Skip generating 2-second contact sheet JPEGs")
    args = parser.parse_args()

    if not os.path.isfile(args.video):
        print(f"ERROR: Video file not found: {args.video}", file=sys.stderr)
        sys.exit(1)

    meta = {}
    if args.shots_json:
        if not os.path.isfile(args.shots_json):
            print(f"ERROR: shots.json not found: {args.shots_json}", file=sys.stderr)
            sys.exit(1)
        with open(args.shots_json, encoding="utf-8") as f:
            meta = json.load(f)

    shots = meta.get("shots", [])
    planned = set()
    for span in meta.get("xfade", []) + meta.get("planned", []):
        if isinstance(span, (list, tuple)) and len(span) == 2:
            planned.update(range(int(span[0]) - 1, int(span[1]) + 1))
    if isinstance(meta.get("flash"), (list, tuple)) and len(meta["flash"]) == 2:
        planned.update(range(int(meta["flash"][0]) - 1, int(meta["flash"][1]) + 1))
    for s in shots:
        a = int(s.get("a", s.get("start", 0)))
        planned.update((a - 1, a))

    os.makedirs(args.outdir, exist_ok=True)
    report_lines = []

    probe_res = run_cmd(
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration",
        "-of",
        "json",
        args.video,
    )
    if probe_res.returncode != 0:
        print(f"ERROR: ffprobe failed: {probe_res.stderr.strip()}", file=sys.stderr)
        sys.exit(1)

    pr = json.loads(probe_res.stdout)
    streams = pr.get("streams", [])
    video_streams = [s for s in streams if s.get("codec_type") == "video"]
    if not video_streams:
        print("ERROR: No video stream found in input file.", file=sys.stderr)
        sys.exit(1)

    v = video_streams[0]
    au = [s for s in streams if s.get("codec_type") == "audio"]
    dur_s = float(pr["format"]["duration"])
    audio_desc = (
        ", ".join(f"{s.get('codec_name')} {s.get('sample_rate')} Hz {s.get('channels')}ch" for s in au)
        if au
        else "NONE"
    )
    report_lines.append(
        f"SPECS {v.get('width')}x{v.get('height')} {v.get('r_frame_rate')} fps, "
        f"{v.get('nb_frames')} frames, {dur_s:.3f} s; audio: {audio_desc}"
    )

    if au:
        eb = run_cmd("ffmpeg", "-i", args.video, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-").stderr
        if "Summary:" in eb:
            tail = eb[eb.rfind("Summary:") :]
            eb_items = [l.strip() for l in tail.splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))]
            report_lines.append("LOUDNESS " + " | ".join(eb_items))
        else:
            report_lines.append("LOUDNESS unavailable (ebur128 summary not found)")

        sil = run_cmd("ffmpeg", "-i", args.video, "-map", "0:a:0", "-af", "silencedetect=n=-45dB:d=0.3", "-f", "null", "-").stderr
        sil_lines = [l.split("] ")[-1].strip() for l in sil.splitlines() if "silence_" in l]
        report_lines.append("SILENCES " + ("; ".join(sil_lines) if sil_lines else "none"))
    else:
        report_lines.append("LOUDNESS skipped (no audio stream)")

    w_small, h_small = 180, 320
    raw_proc = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            args.video,
            "-vf",
            f"scale={w_small}:{h_small}:flags=area",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-",
        ],
        capture_output=True,
    )
    if raw_proc.returncode != 0 or not raw_proc.stdout:
        print(f"ERROR: ffmpeg frame decode failed: {raw_proc.stderr.decode('utf-8', 'ignore')}", file=sys.stderr)
        sys.exit(1)

    frames = np.frombuffer(raw_proc.stdout, np.uint8).reshape(-1, h_small, w_small, 3)
    n = len(frames)
    f32 = frames.astype(np.float32) / 255.0
    luma = f32 @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    mx, mn = f32.max(-1), f32.min(-1)
    sat = np.where(mx > 0.06, (mx - mn) / np.maximum(mx, 1e-6), 0.0)
    flat_luma = luma.reshape(n, -1)
    stats = {
        "mean": flat_luma.mean(1),
        "std": flat_luma.std(1),
        "p2": np.percentile(flat_luma, 2, 1),
        "p98": np.percentile(flat_luma, 98, 1),
        "sat": sat.reshape(n, -1).mean(1),
    }

    diff = np.abs(np.diff(frames.astype(np.int16), axis=0)).mean(axis=(1, 2, 3)) if n > 1 else np.array([], dtype=np.float32)
    med = np.array([np.median(diff[max(0, i - 8) : i + 9]) for i in range(len(diff))]) if len(diff) else np.array([])
    pops = [i + 1 for i in range(len(diff)) if diff[i] > 3 * med[i] + 1.0 and (i + 1) not in planned]
    black = [i for i in range(n) if stats["mean"][i] < 0.04]
    white = [i for i in range(n) if stats["mean"][i] > 0.93 and i not in planned]

    frozen = []
    run_start = None
    for i in range(len(diff)):
        if diff[i] < 0.02:
            run_start = i if run_start is None else run_start
        else:
            if run_start is not None and i - run_start >= 12:
                frozen.append((run_start, i))
            run_start = None
    if run_start is not None and len(diff) - run_start >= 12:
        frozen.append((run_start, len(diff)))

    report_lines.append("")
    report_lines.append("# HEURISTIC CHECKS (threshold-based; verify visually before treating as defects)")
    report_lines.append(
        f"FRAMES decoded={n}; black(mean<0.04)={black[:20]}; "
        f"unplanned_white(mean>0.93)={white[:20]}; frozen_spans(diff<0.02,>=12f)={frozen[:20]}"
    )
    report_lines.append(f"POPS [heuristic: diff > 3x local median + 1.0] count={len(pops)}: {pops[:40]}")
    if len(diff):
        report_lines.append(
            f"MOTION mean_diff={diff.mean():.2f}; held_frames(diff<0.3)={int((diff < 0.3).sum())} ({(diff < 0.3).mean() * 100:.0f}%)"
        )

    report_lines.append("\nPER SHOT  (luma mean / std / p2 / p98 / saturation mean, medians over the shot)")
    shot_list = shots or [{"id": 0, "a": 0, "b": n}]
    for s in shot_list:
        a = int(s.get("a", s.get("start", 0)))
        b = min(int(s.get("b", s.get("end", n))), n)
        if a >= b:
            continue
        vals = " / ".join(f"{np.median(stats[k][a:b]):.3f}" for k in ("mean", "std", "p2", "p98", "sat"))
        report_lines.append(f"  shot {s['id']:>2} f{a}-{b - 1}: {vals}")

    np.savez(os.path.join(args.outdir, "perframe.npz"), diff=diff, **stats)

    if not args.no_sheets:
        cw, ch = 108, 192
        for k in range(0, n, 60):
            sheet = Image.new("RGB", (cw * 10, ch * 6), "black")
            draw = ImageDraw.Draw(sheet)
            for j in range(min(60, n - k)):
                x, y = (j % 10) * cw, (j // 10) * ch
                sheet.paste(Image.fromarray(frames[k + j]).resize((cw, ch)), (x, y))
                draw.rectangle([x, y, x + 36, y + 12], fill="black")
                draw.text((x + 2, y + 1), str(k + j), fill="yellow")
            sheet.save(os.path.join(args.outdir, f"sheet_{k:04d}.jpg"), quality=85)

    report_text = "\n".join(report_lines) + "\n"
    with open(os.path.join(args.outdir, "report.md"), "w", encoding="utf-8") as f:
        f.write(report_text)
    print(report_text)


if __name__ == "__main__":
    main()
