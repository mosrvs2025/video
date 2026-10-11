#!/usr/bin/env python3
"""montage.py <out.png> <cols> <tile_width> files...   (ffmpeg xstack contact sheet, files in given order)"""
import subprocess, sys
out, cols, tw, *fs = sys.argv[1:]; cols = int(cols); tw = int(tw); n = len(fs)
from PIL import Image
w, h = Image.open(fs[0]).size; th = round(h * tw / w)
cmd = ["ffmpeg", "-v", "error", "-y"]; [cmd.extend(["-i", f]) for f in fs]
fc = "".join(f"[{i}]scale={tw}:{th}[s{i}];" for i in range(n)) + "".join(f"[s{i}]" for i in range(n)) + f"xstack=inputs={n}:layout=" + "|".join(f"{(i%cols)*tw}_{(i//cols)*th}" for i in range(n))
subprocess.run(cmd + ["-filter_complex", fc, "-frames:v", "1", "-update", "1", out], check=True)
