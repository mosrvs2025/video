"""Auto sound design from edit.json: every overlay type and transition maps to a cue, placed at the right output time (numpy synth, no samples needed)."""
import json, os, sys, wave
import numpy as np
SR = 44100

def run(pdir):
    E = json.load(open(os.path.join(pdir, 'edit.json'))); T = json.load(open(os.path.join(pdir, 'total.json'))); DUR = T['seconds']; CUT = T['cut']
    N = int(SR * DUR); rng = np.random.default_rng(21); L = np.zeros(N); R = np.zeros(N)
    segs = []; acc = 0.0
    for s in E['segs']:
        rate = s.get('rate', 1.0); d = round((s['out'] - s['in']) / rate * 30) / 30; segs.append({**s, 'start': acc, 'd': d, 'rate': rate}); acc += d
    def O(clip, ct):
        for s in segs:
            if s['clip'] == clip and s['in'] - 1e-6 <= ct <= s['out'] + 1e-6: return s['start'] + (ct - s['in']) / s['rate']
        return None
    tt = lambda n: np.arange(n) / SR
    def add(sig, t0, g=1.0, pan=0.0):
        if t0 is None: return
        i = int(t0 * SR)
        if i < 0 or i >= N: return
        sig = sig[:N - i]; L[i:i + len(sig)] += sig * g * (1 - max(0, pan)); R[i:i + len(sig)] += sig * g * (1 + min(0, pan))
    def env(n, a, r):
        e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
    def lp(x, fc):
        a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
        for i, v in enumerate(x): s = (1 - a) * v + a * s; y[i] = s
        return y
    def whoosh(t0, dur=0.5, up=True, g=0.5):
        n = int(dur * SR); x = rng.standard_normal(n); fc = np.linspace(400, 6500, n) if up else np.linspace(6500, 400, n); y = np.zeros(n); s = 0.0
        for i in range(n): a = np.exp(-2 * np.pi * fc[i] / SR); s = (1 - a) * x[i] + a * s; y[i] = s
        add(y * 7 * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.3, t0, g)
    def pop(t0, g=0.5, f0=500, f1=1100):
        n = int(0.16 * SR); f = np.linspace(f0, f1, n); add(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.1), t0, g)
    def thud(t0, g=0.8, f0=90):
        n = int(0.8 * SR); t = tt(n); f = f0 * np.exp(-t * 7) + 40; add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) + lp(rng.standard_normal(n), 600) * np.exp(-t * 30) * 0.6, t0, g)
    def ping(t0, g=0.4, f=1320):
        n = int(0.9 * SR); t = tt(n); add((np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2 * t)) * np.exp(-t * 5), t0, g, 0.3)
    def tick(t0, g=0.2, f=2600):
        n = int(0.03 * SR); t = tt(n); add(rng.standard_normal(n) * np.exp(-t * 150) * np.sin(2 * np.pi * f * t + 1), t0, g)
    def chime(t0, notes, g=0.25, gap=0.08):
        if t0 is None: return
        for k, f in enumerate(notes):
            n = int(1.8 * SR); t = tt(n); add((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 3.0), t0 + k * gap, g, (k % 2 - 0.5) * 0.6)
    def sweepdown(t0, dur=0.8, g=0.35):
        n = int(dur * SR); t = tt(n); f = 1800 * np.exp(-t / dur * 3.2); add(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, 0.3), t0, g)
    def riser(t0, dur, g=0.35):
        n = int(dur * SR); t = tt(n); f = 300 * np.exp(t / dur * np.log(8)); add((np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + lp(rng.standard_normal(n), 5000) * 0.8) * np.linspace(0, 1, n) ** 2, t0, g)
    def water(t0, dur=1.2, g=0.5):
        n = int(dur * SR); add(lp(rng.standard_normal(n), 2500) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.2 * 3, t0, g)
    music = E['mode'] in ('music', 'bed'); gm = 0.5 if music else 1.0
    light = E.get('flags', {}).get('light')
    if light: gm = 0.55
    # transitions
    for s in ([] if light else segs[:-1]):
        b = s['start'] + s['d']; k = s['trans']
        if k == 'whip': whoosh(b - 0.12, 0.35, True, 0.6 * gm); thud(b, 0.3 * gm, 70)
        elif k == 'zoom': whoosh(b - 0.2, 0.45, True, 0.55 * gm); thud(b, 0.4 * gm, 60)
        elif k == 'flash': whoosh(b - 0.12, 0.3, True, 0.5 * gm); pop(b, 0.3 * gm, 900, 1800)
        elif k == 'wave': water(b - 0.55, 1.2, 0.65); whoosh(b - 0.5, 0.8, True, 0.35)
    for o in E['overlays']:
        ty = o['type']; c = o.get('clip')
        if light and ty not in ('chapter', 'privacy'): continue
        if ty == 'title': t0 = O(c, o['a']); thud(t0, 0.9 * gm); whoosh(t0 - 0.1 if t0 else None, 0.35, True, 0.45 * gm)
        elif ty == 'chapter': t0 = O(c, o['at']); pop(t0 + 0.1 if t0 is not None else None, 0.35 * gm, 600, 1300); whoosh(t0, 0.4, True, 0.3 * gm)
        elif ty == 'burst': t0 = O(c, o['a']); pop(t0, 0.5 * gm, 350, 1000); thud(t0, 0.3 * gm)
        elif ty == 'pin': ping(O(c, o['a']), 0.35 * gm)
        elif ty == 'brackets': t0 = O(c, o['a']); ping(t0, 0.25 * gm, 1500); tick(t0 + 0.1 if t0 is not None else None, 0.2 * gm, 3200)
        elif ty == 'meter':
            f0 = O(c, o.get('fillFrom', o['a'] + 0.2))
            if f0 is not None:
                for k, tb in enumerate(np.arange(0, o.get('fillDur', 1.4), 0.1)): tick(f0 + tb, 0.12 * gm, 2000 + k * 150)
                ping(f0 + o.get('fillDur', 1.4), 0.35 * gm, 1760)
        elif ty == 'alert': t0 = O(c, o['a']); [pop(t0 + k * 0.33 if t0 is not None else None, 0.3 * gm, 700, 900) for k in range(4)]
        elif ty == 'lowerthird': t0 = O(c, o['a']); whoosh(t0, 0.5, True, 0.35 * gm); ping(t0 + 0.4 if t0 is not None else None, 0.3 * gm)
        elif ty == 'scoreboard':
            for ev in o.get('events', []): t0 = O(c, ev['t']); chime(t0, [659, 784, 988, 1319] if ev['side'] == 'l' else [392, 330, 262], 0.25 * gm, 0.07)
        elif ty == 'privacy': t0 = O(c, o['a']); pop(t0, 0.3 * gm, 300, 700); tick(t0 + 0.2 if t0 is not None else None, 0.2 * gm, 1800)
        elif ty == 'confetti': t0 = O(c, o['a']); pop(t0, 0.45 * gm, 500, 1300)
        elif ty == 'replay': t0 = O(c, o['a']); sweepdown(t0, 0.8, 0.35 * gm)
        elif ty == 'flash': t0 = O(c, o['a']); thud(t0, 0.5 * gm); pop(t0, 0.4 * gm, 400, 1400)
    for s in ([] if light else segs):
        if s['rate'] > 1: whoosh(s['start'] - 0.05, 0.4, True, 0.5); whoosh(s['start'] + s['d'] - 0.3, 0.4, False, 0.5)
        if s['rate'] < 1:  # slow-mo time warp
            riser(s['start'] - 0.8, 0.8, 0.4); sweepdown(s['start'], 0.9, 0.45); whoosh(s['start'], 0.5, True, 0.3)
            n = int(s['d'] * SR); add(lp(rng.standard_normal(n), 700) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.5, s['start'], 0.5)
    # end card
    if E['endCard'] > 0 and not light:
        thud(CUT, 1.0 * gm, 70); whoosh(CUT - 0.1, 0.5, True, 0.5 * gm); chime(CUT + 0.15, [392, 494, 587, 784], 0.25 * gm, 0.1)
        for i in range(min(4, len(E['end']['polaroids']))): whoosh(CUT + 0.1 + i * 0.2, 0.25, True, 0.3 * gm); pop(CUT + 0.35 + i * 0.2, 0.3 * gm, 500, 900)
        n = int(E['endCard'] * SR); t = tt(n); pad = np.zeros(n)
        for f in (130.8, 196, 261.6, 329.6, 392):
            for d in (-0.4, 0.4): pad += np.sin(2 * np.pi * (f + d) * t) + 0.25 * np.sin(4 * np.pi * (f + d) * t)
        add(lp(pad, 1800) / 10 * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.2, CUT, 0.35)
    pk = max(abs(L).max(), abs(R).max(), 1e-6); L /= pk; R /= pk
    pcm = (np.stack([L, R], 1) * 0.9 * 32767).astype(np.int16)
    out = os.path.join(pdir, 'audio', 'sfx.wav'); w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
    print('sfx ok')
if __name__ == '__main__': run(sys.argv[1])
