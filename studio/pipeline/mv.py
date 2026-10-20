"""Music-video data builder: analysis + story script -> projects/<p>/mv.json (everything the MV composition needs).
Inputs: projects/<p>/analysis/<stem>/analysis.json, projects/<p>/story.json (hand/AI-written: sections, lines, chat, typing, narr...).
Outputs: mv.json (+ audio/song.wav loudness-matched) . Times are in seconds of the song (= video time)."""
import json, os, subprocess, sys
import numpy as np

def beat_grid(beats):
    b = np.array(beats, float)
    if len(b) < 8: return 0.94, 0.0, 0.0
    d = float(np.median(np.diff(b))); idx = np.round((b - b[0]) / d)
    for _ in range(3):
        A = np.polyfit(idx, b, 1); res = b - np.polyval(A, idx); keep = np.abs(res) < 0.12
        if keep.sum() < 8: break
        A = np.polyfit(idx[keep], b[keep], 1)
    bp, ph = float(A[0]), float(A[1]); res = b - np.polyval(A, idx)
    return bp, ph, float(np.std(res[np.abs(res) < 0.2]))

def spectrum(wav, frames):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    SR = 16000; edges = np.geomspace(40, 6500, 21); win = np.hanning(1024); sp = np.zeros((frames, 20))
    fr = np.fft.rfftfreq(1024, 1 / SR); masks = [(fr >= edges[b]) & (fr < edges[b + 1]) for b in range(20)]
    for f in range(frames):
        c = int(f / 30 * SR); seg = x[max(0, c - 512):c + 512]
        if len(seg) < 1024: seg = np.pad(seg, (0, 1024 - len(seg)))
        a = np.abs(np.fft.rfft(seg * win))
        for b in range(20): sp[f, b] = a[masks[b]].mean() if masks[b].any() else 0
    sp = np.log1p(sp * 30); sp /= np.percentile(sp, 98, axis=0) + 1e-6; sp = np.clip(sp, 0, 1)
    sm = np.zeros_like(sp)
    for f in range(frames): sm[f] = np.maximum(sp[f], sm[f - 1] * 0.84) if f else sp[f]
    # overall energy (smoothed) for global intensity
    return np.round(sm, 2), x

def words_across(text, t0, t1, blend=0.4):
    """reveal times for each word across the sung duration (syllable weighted, blended with uniform spread)"""
    import re
    toks = text.split(); syl = [max(1, len(re.findall(r'[aeiouy]+', re.sub(r'[^a-z]', '', w.lower())))) for w in toks]
    tot = sum(syl); cum = 0; out = []
    for w, s in zip(toks, syl):
        a = cum / tot; u = len(out) / len(toks); out.append(round(t0 + ((1 - blend) * a + blend * u) * (t1 - t0), 3)); cum += s
    return out

def build(pdir):
    S = json.load(open(os.path.join(pdir, 'story.json')))
    stem = S['stem']; A = json.load(open(os.path.join(pdir, 'analysis', stem, 'analysis.json')))
    clip = os.path.join(pdir, 'public', 'clips', S['file']); dur = A['dur']; frames = int(round(dur * 30))
    bp, ph, sd = beat_grid(A['beats']); print(f'beat grid: bp={bp:.4f}s ({60 / bp:.1f} BPM) ph={ph:.3f} resid_std={sd:.3f}')
    os.makedirs(os.path.join(pdir, 'audio'), exist_ok=True); wav = os.path.join(pdir, 'audio', 'song.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', clip, '-vn', '-ac', '2', '-ar', '44100', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', wav], check=True)
    sp, x = spectrum(wav, frames)
    snap = lambda t: min([ph + k * bp for k in range(int((t - ph) / bp) - 1, int((t - ph) / bp) + 3)], key=lambda b: abs(b - t)) if S.get('snap', True) else t
    def sn(items, key='t'):
        out = []
        for it in items:
            it = dict(it); 
            if it.get('snap', True) and key in it: 
                s = snap(it[key])
                if abs(s - it[key]) < 0.35: it[key] = round(s, 3)
            out.append(it)
        return out
    lines = []
    for l in S['lines']:
        tm = words_across(l['text'], l['t0'], l['t1']); lines.append({**l, 'tm': tm})
    mv = {'fps': 30, 'w': 1080, 'h': 1920, 'duration': dur, 'frames': frames, 'bp': bp, 'ph': ph, 'beats': A['beats'], 'spectrum': sp.tolist(),
          'title': S.get('title', ''), 'artist': S.get('artist', ''), 'sections': S['sections'], 'lines': lines, 'chat': sn(S['chat']), 'typing': S.get('typing', []), 'temp': S.get('temp', []),
          'narr': sn(S.get('narr', []), 'a'), 'subliminal': S.get('subliminal', []), 'motif': sn(S.get('motif', [])), 'status': S.get('status', []), 'theme': S.get('theme', {}), 'end': S.get('end', {})}
    json.dump(mv, open(os.path.join(pdir, 'mv.json'), 'w')); json.dump({'mv': mv}, open(os.path.join(pdir, 'mv_props.json'), 'w'))
    print('mv.json frames', frames, 'sections', len(mv['sections']), 'chat', len(mv['chat']), 'narr', len(mv['narr']))
if __name__ == '__main__': build(sys.argv[1])
