"""Privacy redaction: bakes blur INTO the clip pixels (not an overlay) so the original text can never appear in any render, preview or polaroid.
director.json: "redact": [{"clip":"<stem>","a":8.2,"b":13.1,"x":0,"y":0.3,"w":1,"h":0.5}]  (a/b source seconds; x,y,w,h fractions of the source frame)
Writes public/redacted/<stem>.mp4 and repoints edit.json at it. Originals are never modified."""
import json, os, subprocess, sys

def apply(pdir):
    D = json.load(open(os.path.join(pdir, 'director.json'))) if os.path.exists(os.path.join(pdir, 'director.json')) else {}
    R = D.get('redact', [])
    if not R: return
    E = json.load(open(os.path.join(pdir, 'edit.json'))); pub = os.path.join(pdir, 'public'); os.makedirs(os.path.join(pub, 'redacted'), exist_ok=True)
    by = {}
    for r in R: by.setdefault(r['clip'], []).append(r)
    for cid, c in E['clips'].items():
        stem = c['name']
        if stem not in by: continue
        src = os.path.join(pub, 'clips', os.path.basename(c['file'])); out = os.path.join(pub, 'redacted', stem + '.mp4')
        w, h = c['w'], c['h']; chain = '[0:v]'; parts = []; last = 'v0'
        for i, r in enumerate(by[stem]):
            x, y, rw, rh = [int(round(v)) // 2 * 2 for v in (r['x'] * w, r['y'] * h, r['w'] * w, r['h'] * h)]
            rw = max(2, min(rw, w - x)) // 2 * 2; rh = max(2, min(rh, h - y)) // 2 * 2
            parts.append(f"[{last}]split[o{i}][b{i}];[b{i}]crop={rw}:{rh}:{x}:{y},gblur=sigma=30:steps=3,eq=brightness=-0.10:saturation=0.8[c{i}];[o{i}][c{i}]overlay={x}:{y}:enable='between(t,{r['a']},{r['b']})'[v{i + 1}]")
            last = f'v{i + 1}'
        fc = ';'.join(parts).replace('[v0]', '[0:v]', 1) if False else ';'.join(parts)
        fc = fc.replace('[v0]split', '[0:v]split', 1)
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', fc, '-map', f'[{last}]', '-map', '0:a?', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out], capture_output=True, text=True)
        if r.returncode: raise RuntimeError(r.stderr[-600:])
        c['file'] = f'redacted/{stem}.mp4'; print(f'redacted {stem}: {len(by[stem])} region(s) -> {out}')
    json.dump(E, open(os.path.join(pdir, 'edit.json'), 'w'), indent=1)
