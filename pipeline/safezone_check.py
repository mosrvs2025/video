#!/usr/bin/env python3
"""Fail loudly if captions or YOU windows land where Shorts/Reels/TikTok put their UI.
  safezone_check.py <song_dir> [--every N]      exit code 1 on any violation
Renders (via the engine) a frame in the middle of lyric lines, reads the real caption text box the engine drew (design space 720x1280),
and tests it against engine/layout.json -> contract.caption.  Also tests the YOU window rectangle against contract.window."""
import json, os, subprocess, sys
song = os.path.abspath(sys.argv[1]); every = int(sys.argv[sys.argv.index("--every") + 1]) if "--every" in sys.argv else 1
root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LY = json.load(open(f"{root}/engine/layout.json")); W, H = LY["design"]; C = LY["contract"]
T = json.load(open(f"{song}/work/timeline.json"))["lines"]
times = [round((l["start"] + l["end"]) / 2, 2) for i, l in enumerate(T) if i % every == 0]
out = subprocess.run(["node", f"{root}/engine/render.js", song, "--boxes", *map(str, times)], capture_output=True, text=True, cwd=root)
if out.returncode: sys.exit(out.stderr[-1500:])
res = json.loads(out.stdout.strip().splitlines()[-1]); bad = []
cap = C["caption"]; lim = dict(top=cap["top"] * H, bottom=cap["bottom"] * H, left=cap["left"] * W, right=cap["right"] * W)
for r in res:
    b = r["box"]
    if not b: continue
    why = []
    if b["y1"] > lim["bottom"]: why.append(f"text bottom {b['y1']/H:.0%} > {cap['bottom']:.0%} (under the channel/description/buttons)")
    if b["y0"] < lim["top"]: why.append(f"text top {b['y0']/H:.0%} < {cap['top']:.0%} (under the top bar)")
    if b["x0"] < lim["left"] or b["x1"] > lim["right"]: why.append(f"text x {b['x0']/W:.0%}-{b['x1']/W:.0%} outside {cap['left']:.0%}-{cap['right']:.0%} (right button rail)")
    if why: bad.append((r["t"], b, why))
w = LY["youWindow"]; cw = C["window"]; wy = []
if w["y"] < cw["top"] * H: wy.append(f"YOU window top {w['y']/H:.0%} < {cw['top']:.0%}")
if w["y"] + w["h"] > cw["bottom"] * H: wy.append(f"YOU window bottom {(w['y']+w['h'])/H:.0%} > {cw['bottom']:.0%}")
if w["x"] < cw["left"] * W or w["x"] + w["w"] > cw["right"] * W: wy.append("YOU window outside left/right margins")
print(f"checked {len([r for r in res if r['box']])} caption frames against contract.caption {cap}")
for t, b, why in bad[:12]: print(f"  FAIL t={t}s  box y {b['y0']/H:.0%}-{b['y1']/H:.0%}  " + "; ".join(why))
if len(bad) > 12: print(f"  ... and {len(bad)-12} more")
for m in wy: print("  FAIL", m)
if bad or wy: print(f"SAFE-ZONE CHECK FAILED: {len(bad)} caption frames, {len(wy)} window issues"); sys.exit(1)
print("SAFE-ZONE CHECK PASSED")
