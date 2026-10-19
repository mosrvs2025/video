"""Build the cut audio + spectrum from edit.json. Per-clip loudnorm, segment trims with fades, slow-mo via atempo (muted if requested),
optional continuous music bed. Writes audio/combined.wav and props.json (edit + spectrum + total)."""
import json, os, subprocess, sys
import numpy as np

def build(pdir):
    E = json.load(open(os.path.join(pdir, 'edit.json'))); pub = os.path.join(pdir, 'public'); adir = os.path.join(pdir, 'audio'); os.makedirs(adir, exist_ok=True)
    clips = E['clips']; keys = list(clips.keys()); inputs = []; idx = {}
    for i, k in enumerate(keys): inputs += ['-i', os.path.join(pub, clips[k]['file'])]; idx[k] = i
    flt = []; cum = 0.0; n = len(E['segs'])
    for i, s in enumerate(E['segs']):
        rate = s.get('rate', 1.0); d = round((s['out'] - s['in']) / rate * 30) / 30; ci = idx[s['clip']]
        base = f"[{ci}:a]highpass=f=60,loudnorm=I=-15:TP=-1.5:LRA=9,aformat=sample_rates=44100:channel_layouts=stereo,atrim={s['in']}:{s['out']},asetpts=N/SR/TB"
        if rate != 1.0:
            r_ = rate; chain = []
            while r_ > 2.0: chain.append('atempo=2.0'); r_ /= 2.0
            chain.append(f'atempo={r_}'); base += ',' + ','.join(chain)
        if s.get('mute'): base += ',volume=0'
        flt.append(f"{base},atrim=0:{d},afade=t=in:d=0.05,afade=t=out:st={max(0, d - 0.05)}:d={0.05},apad=whole_dur={d}[a{i}]")
        cum += d
    total = cum + E['endCard']
    flt.append(''.join(f'[a{i}]' for i in range(n)) + f'concat=n={n}:v=0:a=1,apad=whole_dur={total}[o]')
    out = os.path.join(adir, 'combined.wav')
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(flt), '-map', '[o]', out], capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr[-800:])
    frames = int(round(total * 30))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', out, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    SR = 16000; edges = np.geomspace(50, 6500, 21); win = np.hanning(1024); sp = np.zeros((frames, 20))
    fr = np.fft.rfftfreq(1024, 1 / SR); masks = [(fr >= edges[b]) & (fr < edges[b + 1]) for b in range(20)]
    for f in range(frames):
        c = int(f / 30 * SR); seg = x[max(0, c - 512):c + 512]
        if len(seg) < 1024: seg = np.pad(seg, (0, 1024 - len(seg)))
        a = np.abs(np.fft.rfft(seg * win))
        for b in range(20): sp[f, b] = a[masks[b]].mean() if masks[b].any() else 0
    sp = np.log1p(sp * 30); sp /= np.percentile(sp, 98, axis=0) + 1e-6; sp = np.clip(sp, 0, 1)
    sm = np.zeros_like(sp)
    for f in range(frames): sm[f] = np.maximum(sp[f], sm[f - 1] * 0.82) if f else sp[f]
    props = {'edit': {**E, 'spectrum': np.round(sm, 2).tolist()}}
    json.dump(props, open(os.path.join(pdir, 'props.json'), 'w'))
    json.dump({'frames': frames, 'seconds': total, 'cut': cum}, open(os.path.join(pdir, 'total.json'), 'w'))
    print(f'audio: cut {cum:.1f}s total {total:.1f}s frames {frames}')
    return total
if __name__ == '__main__': build(sys.argv[1])
