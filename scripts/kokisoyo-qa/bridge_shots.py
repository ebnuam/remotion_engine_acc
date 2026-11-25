#!/usr/bin/env python3
"""
Shot metadata extractor for Remotion story.ts files (Linux VPS adapted from cartoon-3d-short bridge_shots.py).

Supports verified repository story.ts schemas:
1. Bridge / Ship format: SHOTS with { id, a, b, ... } (+ optional XFADE, FLASH_AT, KICKS, MICRO_SHOTS)
2. Kok Iso Yo? format (e.g. ep2_badak): SHOTS with { id, start, end, mode?, badge?, camZoom?, camX?, camY? }

Fails loudly with clear field errors if the input cannot be safely parsed. Never fabricates data.
"""

import argparse
import json
import os
import re
import sys


def strip_comments(src):
    # Remove block comments and // line comments while preserving string literals safely
    pattern = re.compile(r'("([^"\\]|\\.)*"|\'([^\'\\]|\\.)*\'|//[^\n]*|/\*[\s\S]*?\*/)')
    return pattern.sub(lambda m: m.group(0) if m.group(0)[0] in ('"', "'") else " ", src)


def extract_array_body(src, const_name):
    m = re.search(rf"\bexport\s+const\s+{const_name}\b[^=]*=\s*\[", src)
    if not m:
        m = re.search(rf"\bconst\s+{const_name}\b[^=]*=\s*\[", src)
    if not m:
        return None
    start_idx = m.end() - 1
    depth = 0
    in_str = None
    escaped = False
    for i in range(start_idx, len(src)):
        ch = src[i]
        if in_str:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in ('"', "'", "`"):
            in_str = ch
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return src[start_idx + 1 : i]
    raise ValueError(f"Unclosed array for {const_name}")


def split_top_level_objects(array_body):
    objs = []
    depth = 0
    obj_start = None
    in_str = None
    escaped = False
    for i, ch in enumerate(array_body):
        if in_str:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in ('"', "'", "`"):
            in_str = ch
        elif ch == "{":
            if depth == 0:
                obj_start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and obj_start is not None:
                objs.append(array_body[obj_start : i + 1])
                obj_start = None
    return objs


def parse_const_int(src, names):
    for name in names:
        m = re.search(rf"\b(?:export\s+)?const\s+{name}\b(?:\s*:\s*[^=]+)?\s*=\s*(\d+)\b", src)
        if m:
            return int(m.group(1)), name
    return None, None


def parse_string_field(obj, key):
    m = re.search(rf'\b{key}\s*:\s*"((?:[^"\\]|\\.)*)"', obj)
    if m:
        return m.group(1)
    m = re.search(rf"\b{key}\s*:\s*'((?:[^'\\]|\\.)*)'", obj)
    return m.group(1) if m else None


def parse_num_pair(obj, key):
    m = re.search(rf"\b{key}\s*:\s*\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]", obj)
    return [float(m.group(1)), float(m.group(2))] if m else None


def parse_bridge_or_ship_shots(obj_texts, total_frames, fps):
    shots = []
    for idx, obj in enumerate(obj_texts, 1):
        m_id = re.search(r"\bid\s*:\s*(\d+)\b", obj)
        m_a = re.search(r"\ba\s*:\s*(\d+)\b", obj)
        m_b = re.search(r"\bb\s*:\s*(\w+)\b", obj)
        missing = [k for k, m in (("id", m_id), ("a", m_a), ("b", m_b)) if not m]
        if missing:
            raise ValueError(f"Bridge/Ship shot #{idx} missing required field(s): {', '.join(missing)}")

        a = int(m_a.group(1))
        b_raw = m_b.group(1)
        if b_raw.isdigit():
            b = int(b_raw)
        elif b_raw == "TOTAL":
            if total_frames is None:
                raise ValueError(f"Shot {m_id.group(1)} references TOTAL, but TOTAL constant was not found")
            b = total_frames
        else:
            raise ValueError(f"Shot {m_id.group(1)} has unresolvable 'b' value: {b_raw}")

        item = {
            "id": int(m_id.group(1)),
            "a": a,
            "b": b,
            "start": a,
            "end": b,
            "durationFrames": b - a,
            "durationSec": round((b - a) / fps, 3),
        }
        for field in ("light", "crowd", "name"):
            val = parse_string_field(obj, field)
            if val is not None:
                item[field] = val
        if re.search(r"\btowns\s*:\s*true\b", obj):
            item["towns"] = True
        shots.append(item)
    return shots


def parse_kokisoyo_shots(obj_texts, total_frames, fps, array_name="SHOTS"):
    shots = []
    for idx, obj in enumerate(obj_texts, 1):
        m_id = re.search(r"\bid\s*:\s*(\d+)\b", obj)
        m_s = re.search(r"\bstart\s*:\s*(\d+)\b", obj)
        m_e = re.search(r"\bend\s*:\s*(\w+)\b", obj)
        missing = [k for k, m in (("id", m_id), ("start", m_s), ("end", m_e)) if not m]
        if missing:
            raise ValueError(f"{array_name} entry #{idx} missing required field(s): {', '.join(missing)}")

        start = int(m_s.group(1))
        e_raw = m_e.group(1)
        if e_raw.isdigit():
            end = int(e_raw)
        elif e_raw in ("TOTAL", "TOTAL_FRAMES"):
            if total_frames is None:
                raise ValueError(f"Entry {m_id.group(1)} references {e_raw}, but constant was not found")
            end = total_frames
        else:
            raise ValueError(f"Entry {m_id.group(1)} has unresolvable 'end' value: {e_raw}")

        item = {
            "id": int(m_id.group(1)),
            "a": start,
            "b": end,
            "start": start,
            "end": end,
            "durationFrames": end - start,
            "durationSec": round((end - start) / fps, 3),
        }
        for field in ("mode", "badge", "name", "note", "cameraAngle", "worldType", "category"):
            val = parse_string_field(obj, field)
            if val is not None:
                item[field] = val
        cam = {}
        for cam_key in ("camZoom", "camX", "camY"):
            pair = parse_num_pair(obj, cam_key)
            if pair is not None:
                cam[cam_key] = pair
        if cam:
            item["camera"] = cam
        shots.append(item)
    return shots


def parse_story(src_raw, default_fps=30):
    src = strip_comments(src_raw)
    fps_val, _ = parse_const_int(src, ("FPS",))
    fps = fps_val if fps_val is not None else default_fps

    total_val, total_const = parse_const_int(src, ("TOTAL_FRAMES", "TOTAL", "BADAK_EP2_FRAMES"))
    shots_body = extract_array_body(src, "SHOTS")
    if shots_body is None:
        raise ValueError("Required array 'SHOTS' not found in story.ts")
    obj_texts = split_top_level_objects(shots_body)
    if not obj_texts:
        raise ValueError("'SHOTS' array is empty or contains no object literals")

    first = obj_texts[0]
    has_ab = bool(re.search(r"\ba\s*:", first) and re.search(r"\bb\s*:", first))
    has_start_end = bool(re.search(r"\bstart\s*:", first) and re.search(r"\bend\s*:", first))

    if has_ab:
        fmt = "bridge_ab"
        shots = parse_bridge_or_ship_shots(obj_texts, total_val, fps)
    elif has_start_end:
        fmt = "kokisoyo_start_end"
        shots = parse_kokisoyo_shots(obj_texts, total_val, fps)
    else:
        raise ValueError(
            "Unsupported SHOTS object format: expected ('a' and 'b') or ('start' and 'end') fields"
        )

    if total_val is None and shots:
        total_val = max(s["end"] for s in shots)

    out = {
        "format": fmt,
        "fps": fps,
        "totalFrames": total_val,
        "totalSourceConst": total_const,
        "durationSec": round(total_val / fps, 3) if total_val is not None else None,
        "shotCount": len(shots),
        "shots": shots,
    }

    # Optional XFADE / FLASH / KICKS / cuts (Bridge & Ship formats)
    m_xf = re.search(r"\bXFADE\b[^=]*=\s*\{([^}]*)\}", src)
    if m_xf:
        xf = {int(k): int(v) for k, v in re.findall(r"(\d+)\s*:\s*(\d+)", m_xf.group(1))}
        out["xfade"] = [[s["a"] - xf[s["id"]] // 2, s["a"] + xf[s["id"]] // 2] for s in shots if s["id"] in xf]

    m_fl = re.search(r"\bFLASH_AT\s*=\s*(-?\d+)", src)
    if m_fl:
        fl = int(m_fl.group(1))
        if fl >= 0:
            out["flash"] = [fl, fl + 4]

    cuts = [[int(f), int(f)] for f in re.findall(r"\{\s*f\s*:\s*(\d+)\s*,\s*cut\s*:\s*true", src)]
    consts = {k: float(v) for k, v in re.findall(r"\b(SNAP|DROP0|DROP1)\s*=\s*([\d.]+)", src)}
    kicks = []
    m_k = re.search(r"\bconst\s+KICKS\b[^=]*=\s*\[(.*?)\];", src, re.DOTALL)
    if m_k:
        for t0, _ in re.findall(r"\[\s*([\w.]+)\s*,\s*([\d.]+)\s*\]", m_k.group(1)):
            f0 = round((consts[t0] if t0 in consts else float(t0)) * fps)
            kicks.append([f0, f0 + 8])
    if cuts or kicks:
        out["planned"] = cuts + kicks
        out["cuts"] = [c[0] for c in cuts]
        out["kicks"] = kicks

    micro_body = extract_array_body(src, "MICRO_SHOTS")
    if micro_body is not None:
        micro_objs = split_top_level_objects(micro_body)
        if micro_objs:
            out["microShots"] = parse_kokisoyo_shots(micro_objs, total_val, fps, array_name="MICRO_SHOTS")

    return out


def main():
    parser = argparse.ArgumentParser(
        description="Extract shots.json metadata from Bridge, Ship, or Kok Iso Yo? story.ts files."
    )
    parser.add_argument("story", help="Path to story.ts file")
    parser.add_argument("-o", "--out", required=True, help="Output JSON path (e.g. /tmp/shots.json)")
    parser.add_argument("--fps", type=int, default=30, help="Fallback FPS if FPS constant is not declared (default: 30)")
    args = parser.parse_args()

    if not os.path.isfile(args.story):
        print(f"ERROR: story.ts file not found: {args.story}", file=sys.stderr)
        sys.exit(1)

    with open(args.story, encoding="utf-8") as f:
        src = f.read()

    data = parse_story(src, default_fps=args.fps)
    out_dir = os.path.dirname(os.path.abspath(args.out))
    os.makedirs(out_dir, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(
        f"OK format={data['format']} shots={data['shotCount']} "
        f"totalFrames={data['totalFrames']} out={args.out}"
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
