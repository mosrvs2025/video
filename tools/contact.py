#!/usr/bin/env python3
"""Render a contact sheet of scene stills: contact.py <songDir> <outPng> <line> [<line> ...]
(uses each line's start + 0.9 s so the stamped lyric and the scene are both visible)"""
import json, subprocess, sys, os, glob
song, out, *lines = sys.argv[1:]
T = json.load(open(f"{song}/work/timeline.json"))["lines"]
ts = [round(T[int(i)]["start"] + 0.9, 2) for i in lines]
d = os.path.join(os.path.dirname(out) or ".", "cs_" + os.path.basename(out)[:-4]); os.makedirs(d, exist_ok=True)
for f in glob.glob(d + "/*.png"): os.remove(f)
subprocess.run(["node", os.path.join(os.path.dirname(__file__), "..", "engine", "render.js"), song, "--stills", d, *map(str, ts)], check=True)
fs = sorted(glob.glob(d + "/*.png")); n = len(fs); cols = 8
cmd = ["ffmpeg", "-v", "error", "-y"]
for f in fs: cmd += ["-i", f]
fc = "".join(f"[{i}]scale=270:-1[s{i}];" for i in range(n)) + "".join(f"[s{i}]" for i in range(n)) + f"xstack=inputs={n}:layout=" + "|".join(f"{(i%cols)*270}_{(i//cols)*480}" for i in range(n))
subprocess.run(cmd + ["-filter_complex", fc, out], check=True); print(out, n)
