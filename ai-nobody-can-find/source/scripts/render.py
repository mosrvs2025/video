"""Chunked, resumable render: python scripts/render.py <Composition> <out.mp4> [scale] [--chunks a-b] [--gl angle|egl|swangle|...] [--concurrency N]
Renders silent 300-frame chunks into data/chunks_<comp>_<scale>/ (re-run to resume), then concatenates.
With --chunks only that range is rendered and no concatenation happens (for splitting a render across machines)."""
import json, os, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
HS = os.environ.get('BROWSER', '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell')
args = sys.argv[1:]; opt = {}
while any(a.startswith('--') for a in args):
    i = next(i for i, a in enumerate(args) if a.startswith('--')); opt[args[i][2:]] = args[i + 1]; del args[i:i + 2]
comp, out = args[0], args[1]; scale = float(args[2]) if len(args) > 2 else 1.0
GL = opt.get('gl', 'angle'); CONC = opt.get('concurrency', '4')
import math
if comp == 'Film': total = math.ceil(json.load(open(os.path.join(ROOT, 'src', 'timeline.json')))['duration'] * 30)
else: total = math.ceil(sum(b - a for a, b in json.load(open(os.path.join(ROOT, 'src', 'short.json')))['segments']) * 30)
CH = 300
cd = os.path.join(ROOT, 'data', f'chunks_{comp}_{scale:g}'); os.makedirs(cd, exist_ok=True)
chunks = [(i, i * CH, min(total, (i + 1) * CH) - 1) for i in range((total + CH - 1) // CH)]
sel = range(len(chunks)) if 'chunks' not in opt else range(int(opt['chunks'].split('-')[0]), int(opt['chunks'].split('-')[1]) + 1)
for i, a, b in [chunks[k] for k in sel if k < len(chunks)]:
    f = os.path.join(cd, f'{i:04d}.mp4')
    if os.path.exists(f): continue
    t0 = time.time()
    subprocess.run(['npx', 'remotion', 'render', 'src/index.ts', comp, f + '.part.mp4', f'--frames={a}-{b}', '--muted', f'--concurrency={CONC}', '--codec=h264', '--crf=16', '--pixel-format=yuv420p', f'--scale={scale}', f'--browser-executable={HS}', f'--gl={GL}', '--log=error'], cwd=ROOT, check=True)
    os.rename(f + '.part.mp4', f); print(f'chunk {i + 1}/{len(chunks)}  {b - a + 1} frames  {time.time() - t0:.0f}s', flush=True)
if 'chunks' in opt: sys.exit(0)
lst = os.path.join(cd, 'list.txt'); open(lst, 'w').write(''.join(f"file '{os.path.join(cd, f'{i:04d}.mp4')}'\n" for i, _, _ in chunks))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True); print('video ->', out)
