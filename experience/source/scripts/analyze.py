"""Song analysis -> src/audio.json (everything the visuals are driven by). numpy only.
  python scripts/analyze.py            (from source/, uses data/song.wav)
Per 30-fps frame:  bands[32] (log-spaced 40 Hz..14 kHz, 0..1, fast-attack/slow-release smoothed), rms, low, mid, high, air,
                   vocal (voice-band presence, 0..1), flux (spectral change, 0..1), cent (spectral centroid, 0..1)
Events:            onsets {t, s, band} from per-band spectral flux peaks (s = strength 0..1), lines from lyrics.json
Sections:          from smoothed energy; printed for inspection
"""
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SR = 48000; FPS = 30; NB = 32

def load(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return x.reshape(-1, w.getnchannels()), w.getframerate()

def stft_mag(x, n=4096, hop=SR // FPS):
    win = np.hanning(n).astype(np.float32); frames = []
    pad = np.pad(x, (n // 2, n // 2))
    for i in range(0, len(x), hop): frames.append(np.abs(np.fft.rfft(pad[i:i + n] * win)))
    return np.array(frames, np.float32)  # [T, n/2+1]

def main():
    X2, sr = load(os.path.join(ROOT, 'data', 'song.wav')); x = X2.mean(1); dur = len(x) / sr
    M = stft_mag(x); T = len(M); f = np.fft.rfftfreq(4096, 1 / sr)
    edges = np.geomspace(40, 14000, NB + 1); B = np.zeros((T, NB), np.float32)
    for b in range(NB):
        m = (f >= edges[b]) & (f < edges[b + 1]); B[:, b] = np.sqrt((M[:, m] ** 2).mean(1)) if m.any() else 0
    B = np.log10(1 + B * 40)  # compress
    B /= np.percentile(B, 99.5, axis=0, keepdims=True) + 1e-6; B = np.clip(B, 0, 1.2)
    # smoothed (attack fast, release slow) copy for visuals
    S = B.copy()
    for t in range(1, T): S[t] = np.where(B[t] > S[t - 1], B[t], S[t - 1] * 0.86 + B[t] * 0.14)
    rms = np.sqrt((M ** 2).mean(1)); rms = rms / (np.percentile(rms, 99) + 1e-9)
    grp = lambda lo, hi: B[:, (edges[:-1] >= lo) & (edges[1:] <= hi)].mean(1)
    low, mid, high, air = grp(40, 180), grp(180, 1500), grp(1500, 5000), grp(5000, 14000)
    # voice presence: harmonic energy 200-3400 Hz relative to a slow median (breathy/sung phrases stand out)
    vb = np.sqrt((M[:, (f >= 200) & (f < 3400)] ** 2).mean(1)); vb = vb / (np.percentile(vb, 99) + 1e-9)
    k = 45; med = np.array([np.median(vb[max(0, i - k):i + k]) for i in range(T)]); vocal = np.clip((vb - 0.8 * med) / 0.5, 0, 1)
    flux = np.maximum(0, np.diff(B, axis=0, prepend=B[:1])).sum(1); flux = flux / (np.percentile(flux, 99) + 1e-9)
    cent = (M * f).sum(1) / (M.sum(1) + 1e-9); cent = np.clip(np.log2(cent / 100 + 1) / 6, 0, 1)
    # onsets: peaks of per-band-group flux
    ons = []
    for name, lo, hi in (('low', 40, 180), ('mid', 180, 1500), ('high', 1500, 14000)):
        sel = (edges[:-1] >= lo) & (edges[1:] <= hi); fl = np.maximum(0, np.diff(B[:, sel], axis=0, prepend=B[:1, sel])).sum(1)
        thr = np.percentile(fl, 92); last = -9
        for t in range(2, T - 2):
            if fl[t] > thr and fl[t] >= fl[t - 1] and fl[t] >= fl[t + 1] and (t - last) / FPS > 0.12: ons.append({'t': round(t / FPS, 3), 's': round(float(min(1, fl[t] / (thr * 3))), 3), 'band': name}); last = t
    ons.sort(key=lambda o: o['t'])
    # sections from smoothed energy
    e = np.convolve(rms, np.ones(FPS * 3) / (FPS * 3), 'same'); step = FPS * 4
    print('t(s)  energy  low  mid  high  air  vocal')
    for i in range(0, T, step):
        sl = slice(i, i + step); print(f'{i / FPS:5.0f}  {e[i]:.2f}  {low[sl].mean():.2f} {mid[sl].mean():.2f} {high[sl].mean():.2f} {air[sl].mean():.2f}  {vocal[sl].mean():.2f}  ' + '#' * int(e[i] * 30))
    r = lambda a, n=3: np.round(a, n).tolist()
    out = {'fps': FPS, 'dur': round(dur, 3), 'frames': T, 'bands': [r(S[t], 2) for t in range(T)], 'rms': r(rms), 'low': r(low), 'mid': r(mid), 'high': r(high), 'air': r(air), 'vocal': r(vocal), 'flux': r(flux), 'cent': r(cent), 'onsets': ons}
    json.dump(out, open(os.path.join(ROOT, 'src', 'audio.json'), 'w'), separators=(',', ':')); print('onsets', len(ons), 'frames', T)

if __name__ == '__main__': main()
