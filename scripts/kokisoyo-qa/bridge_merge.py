#!/usr/bin/env python3
"""
Safe sandbox-to-target merge tool (Linux VPS adapted from cartoon-3d-short bridge_merge.py).

- Auto-detects repo root safely (or uses explicit --root).
- Requires explicit --sandbox and --target (or explicit --episode + --sandbox-name).
- Validates protected production/frozen paths, missing files, and target conflicts before copying.
- Supports --dry-run (prints merge plan and conflicts without modifying any file).
"""

import argparse
import filecmp
import hashlib
import os
import shutil
import sys
import time

PROTECTED_REL_PREFIXES = (
    "src/bridge",
    "public/bridge",
    "src/ship",
    "src/ep2_badak",
)


def detect_repo_root(explicit_root=None):
    if explicit_root:
        root = os.path.abspath(explicit_root)
    else:
        root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if not os.path.isfile(os.path.join(root, "package.json")):
        raise FileNotFoundError(f"Could not find package.json at detected repo root: {root}")
    return root


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def is_protected(repo_root, target_dir):
    try:
        rel = os.path.relpath(os.path.abspath(target_dir), repo_root).replace(os.sep, "/")
    except ValueError:
        return False
    if rel.startswith(".."):
        return False
    return any(rel == p or rel.startswith(p + "/") for p in PROTECTED_REL_PREFIXES)


def main():
    parser = argparse.ArgumentParser(
        description="Safely merge explicit files from a sandbox directory into a target directory with backup and conflict checks."
    )
    parser.add_argument("--root", default=None, help="Repository root (auto-detected if omitted)")
    parser.add_argument("--sandbox", default=None, help="Explicit source sandbox directory")
    parser.add_argument("--target", default=None, help="Explicit target directory")
    parser.add_argument("--episode", default=None, help="Episode directory name under src/ (used with --sandbox-role)")
    parser.add_argument("--sandbox-role", default=None, help="Sandbox suffix (used with --episode -> src/sandboxes/<episode>_<role>)")
    parser.add_argument("--files", required=True, help="Comma-separated list of relative file paths to merge")
    parser.add_argument("--backup-dir", default=None, help="Explicit backup directory (default: /tmp/kokisoyo-merge-backup-<ts>)")
    parser.add_argument("--allow-overwrite", action="store_true", help="Allow overwriting target files that differ from sandbox")
    parser.add_argument("--allow-protected", action="store_true", help="Explicitly override protection on frozen/production dirs (not recommended)")
    parser.add_argument("--dry-run", action="store_true", help="Validate paths and conflicts without copying or writing backups")
    args = parser.parse_args()

    repo_root = detect_repo_root(args.root)

    if args.sandbox and args.target:
        sandbox_dir = os.path.abspath(args.sandbox)
        target_dir = os.path.abspath(args.target)
    elif args.episode and args.sandbox_role:
        sandbox_dir = os.path.join(repo_root, "src", "sandboxes", f"{args.episode}_{args.sandbox_role}")
        target_dir = os.path.join(repo_root, "src", args.episode)
    else:
        parser.error("Provide either (--sandbox and --target) or (--episode and --sandbox-role).")

    if not os.path.isdir(sandbox_dir):
        raise FileNotFoundError(f"Sandbox directory does not exist: {sandbox_dir}")
    if not os.path.isdir(target_dir):
        raise FileNotFoundError(f"Target directory does not exist: {target_dir}")
    if sandbox_dir == target_dir:
        raise ValueError("Sandbox and target directories cannot be the same")

    if is_protected(repo_root, target_dir) and not args.allow_protected:
        raise PermissionError(
            f"Refusing to merge into protected production/frozen path: {target_dir}"
        )

    files = [f.strip() for f in args.files.split(",") if f.strip()]
    if not files:
        raise ValueError("--files cannot be empty")

    plan = []
    conflicts = []
    missing = []

    for rel in files:
        if os.path.isabs(rel) or ".." in rel.split(os.sep):
            raise ValueError(f"Unsafe relative file path: {rel}")
        src_f = os.path.join(sandbox_dir, rel)
        dst_f = os.path.join(target_dir, rel)
        if not os.path.isfile(src_f):
            missing.append(rel)
            plan.append((rel, "MISSING_IN_SANDBOX"))
            continue
        if not os.path.exists(dst_f):
            plan.append((rel, "NEW"))
        elif filecmp.cmp(src_f, dst_f, shallow=False):
            plan.append((rel, "UNCHANGED"))
        else:
            conflicts.append((rel, sha256_file(dst_f)[:12], sha256_file(src_f)[:12]))
            plan.append((rel, "CONFLICT_DIFFERS"))

    if missing:
        raise FileNotFoundError(f"Missing file(s) in sandbox: {', '.join(missing)}")

    if conflicts and not args.allow_overwrite and not args.dry_run:
        details = "; ".join(f"{r} (target={th}, sandbox={sh})" for r, th, sh in conflicts)
        raise RuntimeError(
            f"Conflict detected (target differs from sandbox). Re-run with --allow-overwrite after review: {details}"
        )

    backup_dir = os.path.abspath(
        args.backup_dir or os.path.join("/tmp", f"kokisoyo-merge-backup-{time.strftime('%Y%m%d_%H%M%S')}")
    )

    if args.dry_run:
        print(f"DRY-RUN sandbox={sandbox_dir} -> target={target_dir}")
        print(f"DRY-RUN planned backup={backup_dir}")
        for rel, status in plan:
            print(f"  {status}: {rel}")
        if conflicts and not args.allow_overwrite:
            print("NOTE: Existing differing target files require --allow-overwrite on live merge.")
        sys.exit(0)

    shutil.copytree(target_dir, backup_dir)
    print(f"BACKUP -> {backup_dir}")
    for rel, status in plan:
        if status == "UNCHANGED":
            print(f"  UNCHANGED: {rel}")
            continue
        src_f = os.path.join(sandbox_dir, rel)
        dst_f = os.path.join(target_dir, rel)
        os.makedirs(os.path.dirname(dst_f), exist_ok=True)
        shutil.copy2(src_f, dst_f)
        print(f"  MERGED ({status}): {rel}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
