#!/usr/bin/env python3
"""Swap Seedance clips into the keyed video.  swap.py <song_dir> <clips_dir> <out.mp4> [keyed.mp4]
Clips: clip_1.mp4 ... clip_8.mp4 (3:4). Each is scaled/cropped to 720x960, placed at (180,105) for its slot's time range
on a black track UNDER the keyed video, whose #00ff00 windows are chroma-keyed out (original audio kept)."""
import json, os, subprocess, sys
song, clips, out = [os.path.abspath(a) for a in sys.argv[1:4]]
keyed = sys.argv[4] if len(sys.argv) > 4 else f"{song}/render/{os.path.basename(song)}_keyed.mp4"
slots = json.load(open(f"{song}/slots.json"))["slots"]; dur = json.load(open(f"{song}/work/beats.json"))["dur"]
have = [s for s in slots if os.path.exists(f"{clips}/clip_{s['n']}.mp4")]
cmd = ["ffmpeg", "-v", "error", "-y", "-i", keyed]
for s in have: cmd += ["-i", f"{clips}/clip_{s['n']}.mp4"]
fc = [f"color=c=black:s=1080x1920:r=30:d={dur}[bg]"]; last = "bg"
for k, s in enumerate(have):
    fc.append(f"[{k+1}:v]scale=720:960:force_original_aspect_ratio=increase,crop=720:960,setpts=PTS-STARTPTS+{s['t0']}/TB,fps=30[c{k}]")
    fc.append(f"[{last}][c{k}]overlay=180:105:enable='between(t,{s['t0']},{s['t1']})':eof_action=pass[b{k}]"); last = f"b{k}"
fc.append(f"[0:v]colorkey=0x00ff00:0.30:0.10[k]"); fc.append(f"[{last}][k]overlay=shortest=0[v]")
subprocess.run(cmd + ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-t", str(dur), out], check=True)
print("wrote", out, "with slots", [s["n"] for s in have])
