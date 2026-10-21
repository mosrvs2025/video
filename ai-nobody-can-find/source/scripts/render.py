"""Chunked, resumable render: python scripts/render.py <Composition> <out.mp4> [scale]
Renders silent 300-frame chunks into data/chunks_<comp>_<scale>/ (re-run to resume), then concatenates."""
import json, os, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
HS = os.environ.get('BROWSER', '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell')
comp, out = sys.argv[1], sys.argv[2]; scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
import math
if comp == 'Film': total = math.ceil(json.load(open(os.path.join(ROOT, 'src', 'timeline.json')))['duration'] * 30)
else: total = math.ceil(sum(b - a for a, b in json.load(open(os.path.join(ROOT, 'src', 'short.json')))['segments']) * 30)
CH = 300
cd = os.path.join(ROOT, 'data', f'chunks_{comp}_{scale:g}'); os.makedirs(cd, exist_ok=True)
chunks = [(i, i * CH, min(total, (i + 1) * CH) - 1) for i in range((total + CH - 1) // CH)]
for i, a, b in chunks:
    f = os.path.join(cd, f'{i:04d}.mp4')
    if os.path.exists(f): continue
    t0 = time.time()
    subprocess.run(['npx', 'remotion', 'render', 'src/index.ts', comp, f + '.part.mp4', f'--frames={a}-{b}', '--muted', '--concurrency=4', '--codec=h264', '--crf=16', '--pixel-format=yuv420p', f'--scale={scale}', f'--browser-executable={HS}', '--gl=angle', '--log=error'], cwd=ROOT, check=True)
    os.rename(f + '.part.mp4', f); print(f'chunk {i + 1}/{len(chunks)}  {b - a + 1} frames  {time.time() - t0:.0f}s', flush=True)
lst = os.path.join(cd, 'list.txt'); open(lst, 'w').write(''.join(f"file '{os.path.join(cd, f'{i:04d}.mp4')}'\n" for i, _, _ in chunks))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True); print('video ->', out)
