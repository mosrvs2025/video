#!/usr/bin/env python3
"""Assemble final files from rendered chunks.
  compose.py <song_dir>
Produces in <song>/render/:  clean master, keyed master, labeled master (1080x1920, high quality, AAC 256k)
and <name>_30mb.mp4 compressed versions (720x1280, < 30 MiB) of each.
The keyed/labeled versions are the clean master with the slot windows (frame + pure #00ff00 or labeled panel) overlaid
for each slot's time range with a 0.3 s fade, so all three are frame-identical outside the windows."""
import json, os, subprocess, sys, glob
song = os.path.abspath(sys.argv[1]); R = f"{song}/render"; name = os.path.basename(song)
slots = json.load(open(f"{song}/slots.json"))["slots"]; dur = json.load(open(f"{song}/work/beats.json"))["dur"]
audio = f"{song}/work/song.wav"
def run(cmd): print(" ".join(cmd)[:200], flush=True); subprocess.run(cmd, check=True)
chunks = sorted(glob.glob(f"{R}/chunk_*.mp4"))
open(f"{R}/list.txt", "w").write("".join(f"file '{c}'\n" for c in chunks))
if not os.path.exists(f"{R}/video_only.mp4") or os.environ.get("REMUX"):
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{R}/list.txt", "-c", "copy", f"{R}/video_only.mp4"])
AUD = ["-c:a", "aac", "-b:a", "256k"]
V = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
def master(kind):
    out = f"{R}/{name}_{kind}.mp4"
    if kind == "clean":
        run(["ffmpeg", "-v", "error", "-y", "-i", f"{R}/video_only.mp4", "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", *AUD, "-shortest", "-movflags", "+faststart", out]); return out
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", f"{R}/video_only.mp4", "-i", audio]
    for s in slots:
        png = f"{R}/overlays/keyed.png" if kind == "keyed" else f"{R}/overlays/labeled_{s['n']}.png"
        cmd += ["-loop", "1", "-framerate", "30", "-t", str(dur), "-i", png]
    fc, last = [], "0:v"
    for k, s in enumerate(slots):
        fc.append(f"[{k+2}:v]format=rgba,fade=t=in:st={s['t0']}:d=0.3:alpha=1,fade=t=out:st={s['t1']-0.3}:d=0.3:alpha=1[o{k}]")
        fc.append(f"[{last}][o{k}]overlay=enable='between(t,{s['t0']},{s['t1']})':shortest=0[v{k}]"); last = f"v{k}"
    run(cmd + ["-filter_complex", ";".join(fc), "-map", f"[{last}]", "-map", "1:a", *V, *AUD, "-t", str(dur), out]); return out
for kind in (sys.argv[2:] or ("clean", "keyed", "labeled")): master(kind)
