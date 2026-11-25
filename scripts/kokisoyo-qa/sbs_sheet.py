#!/usr/bin/env python3
"""
Side-by-side contact sheet generator (Linux VPS adapted from cartoon-3d-short sbs_sheet.py).

- Accepts image file lists or directories for --ours and --ref.
- Does not assume Bridge reference paths or copy/modify reference images.
- Outputs cleanly to any CLI path (e.g. /tmp/...).
"""

import argparse
import os
import sys
from PIL import Image, ImageDraw

VALID_EXTS = (".png", ".jpg", ".jpeg", ".webp")


def expand_inputs(items):
    files = []
    for item in items:
        if os.path.isdir(item):
            dir_imgs = sorted(
                os.path.join(item, name)
                for name in os.listdir(item)
                if name.lower().endswith(VALID_EXTS)
            )
            if not dir_imgs:
                raise FileNotFoundError(f"Directory contains no supported images: {item}")
            files.extend(dir_imgs)
        elif os.path.isfile(item):
            if not item.lower().endswith(VALID_EXTS):
                raise ValueError(f"Unsupported image extension: {item}")
            files.append(item)
        else:
            raise FileNotFoundError(f"Input path does not exist: {item}")
    return files


def build_row(paths, height, gap, bg, label_tiles=False):
    ims = []
    for p in paths:
        im = Image.open(p).convert("RGB")
        resized = im.resize((max(1, round(im.width * height / im.height)), height), Image.LANCZOS)
        if label_tiles:
            draw = ImageDraw.Draw(resized)
            tag = os.path.basename(p)[:28]
            tw = min(resized.width - 8, len(tag) * 7 + 12)
            draw.rectangle([6, 6, 6 + tw, 24], fill=(15, 23, 42))
            draw.text((12, 9), tag, fill=(255, 255, 255))
        ims.append(resized)

    total_w = sum(im.width for im in ims) + gap * max(0, len(ims) - 1)
    row_img = Image.new("RGB", (total_w, height), bg)
    x = 0
    for im in ims:
        row_img.paste(im, (x, 0))
        x += im.width + gap
    return row_img


def main():
    parser = argparse.ArgumentParser(
        description="Build a side-by-side comparison contact sheet (ours vs reference)."
    )
    parser.add_argument("-o", "--out", required=True, help="Output image path (e.g. /tmp/sbs.jpg)")
    parser.add_argument("--ours", nargs="+", required=True, help="Image files or folders for rendered stills")
    parser.add_argument("--ref", nargs="*", default=[], help="Optional image files or folders for reference stills")
    parser.add_argument("--h", type=int, default=640, help="Target row height in px (default: 640)")
    parser.add_argument("--gap", type=int, default=8, help="Gap between tiles in px (default: 8)")
    parser.add_argument("--bg", default="white", help="Background fill color (default: white)")
    parser.add_argument("--label", action="store_true", help="Overlay basename label in top-left of each tile")
    args = parser.parse_args()

    if args.h <= 0:
        parser.error("--h must be positive")

    ours_paths = expand_inputs(args.ours)
    ref_paths = expand_inputs(args.ref) if args.ref else []

    rows = [build_row(ours_paths, args.h, args.gap, args.bg, args.label)]
    if ref_paths:
        rows.append(build_row(ref_paths, args.h, args.gap, args.bg, args.label))

    out_w = max(r.width for r in rows)
    out_h = sum(r.height for r in rows) + (args.gap * 2) * (len(rows) - 1)
    sheet = Image.new("RGB", (out_w, out_h), args.bg)
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height + args.gap * 2

    out_dir = os.path.dirname(os.path.abspath(args.out))
    os.makedirs(out_dir, exist_ok=True)
    ext = os.path.splitext(args.out)[1].lower()
    if ext in (".jpg", ".jpeg"):
        sheet.save(args.out, quality=88)
    else:
        sheet.save(args.out)

    print(f"{args.out} {sheet.size} ours={len(ours_paths)} ref={len(ref_paths)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
