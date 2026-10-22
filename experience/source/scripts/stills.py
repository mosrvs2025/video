"""Render review stills: python scripts/stills.py <Composition> <out.jpg> t1 t2 ...  (seconds). Tiles them into one contact sheet."""
import subprocess, sys, os, tempfile
from PIL import Image, ImageDraw
HS = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
comp, out, ts = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3:]]
d = tempfile.mkdtemp(); fs = []
for t in ts:
    f = os.path.join(d, f'{t:08.2f}.jpg'); subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', comp, f, f'--frame={int(round(t * 30))}', '--image-format=jpeg', f'--browser-executable={HS}', '--gl=angle', '--log=error'], cwd=ROOT, check=True); fs.append((t, f))
im0 = Image.open(fs[0][1]); W, H = im0.size; tw = 640 if W > H else 300; th = int(H * tw / W); cols = 3 if W > H else 6; rows = (len(fs) + cols - 1) // cols
sh = Image.new('RGB', (tw * cols, th * rows)); dr = ImageDraw.Draw(sh)
for i, (t, f) in enumerate(fs): sh.paste(Image.open(f).resize((tw, th)), ((i % cols) * tw, (i // cols) * th)); dr.rectangle([(i % cols) * tw, (i // cols) * th, (i % cols) * tw + 70, (i // cols) * th + 16], fill=(0, 0, 0)); dr.text(((i % cols) * tw + 4, (i // cols) * th + 2), f'{t:.1f}s', fill=(255, 255, 0))
sh.save(out, quality=88); print('sheet ->', out)
