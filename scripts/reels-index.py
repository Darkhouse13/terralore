#!/usr/bin/env python3
"""Rebuild social-out/reels/README.md: every finished reel, by shelf, with its length and hook.

Shelves (a reel only moves forward): 1-ready → 2-scheduled → 3-published; plus 4-old-format,
5-retired, 6-tests-and-alternates. render.sh writes finals into 1-ready; social-queue-reel.sh moves
a queued reel into 2-scheduled as <date>_<HHMM>_<slug>. Run: python3 scripts/reels-index.py
"""
import glob, os, subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "social-out", "reels")
SHELVES = [
    ("1-ready", "Finished, not scheduled yet. Queue with `scripts/social-queue-reel.sh` (it moves the reel to 2-scheduled)."),
    ("2-scheduled", "In the publishing drop on the server, named `<date>_<time>_<slug>` in publishing order. Move to 3-published once live."),
    ("3-published", "Live on Instagram and Facebook (map reels from 28 Sep 2026; the collage format before)."),
    ("4-old-format", "Collage-era reels 01–31 (August–September 2026), kept for reference."),
    ("5-retired", "Built and queued, then pulled before publishing."),
    ("6-tests-and-alternates", "Tests, voice A/Bs and alternate cuts."),
]


def seconds(path):
    try:
        out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], text=True)
        return float(out)
    except (subprocess.CalledProcessError, ValueError):
        return 0.0


lines = ["# Reels", "",
         "Every finished reel lives on one of these shelves, next to its caption (`<name>-caption.txt`).",
         "A reel only moves forward: ready → scheduled → published. Rebuild this index: `python3 scripts/reels-index.py`.", ""]
for shelf, blurb in SHELVES:
    os.makedirs(os.path.join(ROOT, shelf), exist_ok=True)
    films = sorted(glob.glob(os.path.join(ROOT, shelf, "*.mp4")))
    lines += [f"## {shelf} ({len(films)})", "", blurb, "", "| File | Length | Hook |", "|---|---|---|"]
    for film in films:
        cap = film[:-4] + "-caption.txt"
        hook = open(cap).read().split("\n")[0].strip()[:110].replace("|", "/") if os.path.exists(cap) else "—"
        lines.append(f"| `{os.path.basename(film)}` | {seconds(film):.0f} s | {hook} |")
    lines.append("")
open(os.path.join(ROOT, "README.md"), "w").write("\n".join(lines))
print(f"index → {os.path.join(ROOT, 'README.md')}")
