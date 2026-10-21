"""Original score + sound design, synthesized from scratch (numpy only), keyed to src/timeline.json and src/cues.json.
Writes data/music.wav and data/sfx.wav (48 kHz stereo float -> 24-bit).
"""
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SR = 48000
TL = json.load(open(os.path.join(ROOT, 'src', 'timeline.json'))); CU = json.load(open(os.path.join(ROOT, 'src', 'cues.json')))
T = TL['duration'] + 0.5; N = int(T * SR)
ph = lambda lid, k: CU[lid]['phrases'][min(k, len(CU[lid]['phrases']) - 1)]['t0']
rng = np.random.default_rng(7)

def write(path, x):
    x = np.clip(x, -1, 1); y = (x * 8388607).astype(np.int32)
    b = np.zeros((y.shape[0], 2, 3), np.uint8)
    for c in range(2):
        v = y[:, c].astype(np.int64) & 0xFFFFFF; b[:, c, 0] = v & 255; b[:, c, 1] = (v >> 8) & 255; b[:, c, 2] = (v >> 16) & 255
    w = wave.open(path, 'wb'); w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b.tobytes()); w.close()

def env(n, a, d, sus=1.0, r=None):
    """attack a, hold, release r (seconds) over n samples"""
    e = np.ones(n, np.float32) * sus; A = max(1, int(a * SR)); e[:A] = np.linspace(0, sus, A)
    R = int((r if r is not None else d) * SR); R = min(R, n); e[n - R:] *= np.linspace(1, 0, R); return e

def onepole(x, fc):
    """simple low-pass (per channel if 2-D)"""
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = np.zeros(x.shape[1:] if x.ndim > 1 else (), np.float64)
    for i in range(0, len(x), 4096):
        blk = x[i:i + 4096]
        out = np.empty_like(blk)
        for j in range(len(blk)): s = a * s + (1 - a) * blk[j]; out[j] = s
        y[i:i + 4096] = out
    return y

def lp_fft(x, fc, order=2):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR); H = 1 / np.sqrt(1 + (f / fc) ** (2 * order))
    return np.fft.irfft(X * (H[:, None] if x.ndim > 1 else H), n=len(x), axis=0).astype(np.float32)
def hp_fft(x, fc, order=2):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR); H = 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * (H[:, None] if x.ndim > 1 else H), n=len(x), axis=0).astype(np.float32)
def bp_fft(x, lo, hi): return hp_fft(lp_fft(x, hi), lo)

def reverb(x, secs=3.2, mix=0.35, pre=0.02, bright=4000):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n) * np.exp(-t * 6.9 / secs) for _ in range(2)], 1).astype(np.float32)
    ir = lp_fft(ir, bright); ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0, keepdims=True)) + 1e-9
    L = len(x) + n; F = 1 << int(np.ceil(np.log2(L)))
    y = np.fft.irfft(np.fft.rfft(x, F, axis=0) * np.fft.rfft(ir, F, axis=0), F, axis=0)[:len(x)].astype(np.float32)
    return x * (1 - mix) + y * mix

def place(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); sig = sig if sig.ndim == 2 else np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], 1)
    j = min(len(buf), i + len(sig));
    if i >= len(buf) or j <= i: return
    buf[i:j] += sig[:j - i] * gain

def tone(f, d, a=0.01, r=None, kind='sine', det=0.0):
    n = int(d * SR); t = np.arange(n) / SR
    if kind == 'sine': s = np.sin(2 * np.pi * f * t)
    elif kind == 'saw': s = sum(np.sin(2 * np.pi * f * (1 + det * k) * t * h) / h for k in (-1, 0, 1) for h in range(1, 12)) / 6
    return (s * env(n, a, d, 1.0, r if r is not None else d * 0.6)).astype(np.float32)

def curve(keys, n=N):
    """piecewise-linear automation over the whole film: keys [(t, v)]"""
    ts = np.arange(n) / SR; k = np.array(keys, np.float64); return np.interp(ts, k[:, 0], k[:, 1]).astype(np.float32)

acts = {a['id']: (a['t0'], a['t1']) for a in TL['acts']}
def thump(g=1.0, f=58, dec=6.0, d=0.9):
    n = int(d * SR); t1 = np.arange(n) / SR
    return ((np.sin(2 * np.pi * f * t1) * np.exp(-t1 * dec) + lp_fft(rng.standard_normal(n).astype(np.float32), 300) * np.exp(-t1 * 14) * 0.4) * g).astype(np.float32)
def air(d, g=1.0, fc=1200):
    n = int(d * SR); e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return (lp_fft(rng.standard_normal((n, 2)).astype(np.float32), fc) * e[:, None] * g).astype(np.float32)
def soft_click(g=0.03):
    n = int(0.006 * SR); return (lp_fft(rng.standard_normal(n).astype(np.float32), 2500) * np.exp(-np.arange(n) / 60) * g).astype(np.float32)
music = np.zeros((N, 2), np.float32); sfx = np.zeros((N, 2), np.float32)
ts = np.arange(N) / SR

# ---------------- room tone (acts 1 and 7) ----------------
noise = rng.standard_normal((N, 2)).astype(np.float32)
room = lp_fft(noise, 220) * 0.012
F0 = acts['final'][0]; T_END_BLACK = CU['f4']['t1'] + 1.15
room *= curve([(0, 0), (1.2, 1), (20.2, 1), (20.25, 0), (F0 - 1.3, 0), (F0 + 0.2, 1), (F0 + 16.7, 0.6), (T_END_BLACK + 0.6, 0)])[:, None]
sfx += room

# ---------------- ACT 1 ----------------
T_DIE, T_FIELD, T_BLACK, T_TITLE = 11.35, 13.42, 20.25, 20.8
click = (rng.standard_normal(int(0.004 * SR)) * np.exp(-np.arange(int(0.004 * SR)) / 40)).astype(np.float32)
place(sfx, click, 2.25, 0.18)
place(sfx, air(2.2, 0.035, 900), 6.1)
# push-through: rising band sweep
n = int((T_DIE - 9.2) * SR); sweep = rng.standard_normal(n).astype(np.float32); fr = np.linspace(200, 5000, n)
sw = np.zeros(n, np.float32); seg = 2048
for i in range(0, n, seg): sw[i:i + seg] = bp_fft(sweep[i:i + seg], fr[i] * 0.7, fr[i] * 1.4)
sw *= np.linspace(0, 1, n) ** 2 * 0.18; place(sfx, sw, 9.2)
place(sfx, reverb(np.stack([thump(0.3, 70, 5)] * 2, 1), 2.0, 0.3), T_DIE)
# die: granular amber ticks
for k in range(70):
    tt = T_DIE + rng.random() * (T_FIELD - T_DIE); place(sfx, soft_click(0.05), tt, pan=rng.uniform(-0.8, 0.8))
# snap back: downward whoosh + sub drop
n = int(1.4 * SR); wn = lp_fft(rng.standard_normal(n).astype(np.float32), 1800) * np.exp(-np.linspace(0, 5, n)) * 0.35
place(sfx, wn, T_FIELD - 0.05); t1 = np.arange(n) / SR; place(sfx, (np.sin(2 * np.pi * (70 * np.exp(-t1 * 1.2)) * t1) * np.exp(-t1 * 2.2) * 0.5).astype(np.float32), T_FIELD)
# field reveal: widening drone that swells, then hard cut at blackout
d = int((T_BLACK - T_FIELD) * SR); tt = np.arange(d) / SR
dr = np.stack([sum(np.sin(2 * np.pi * f * (1 + s * 0.003) * tt) / (i + 1) for i, f in enumerate([73.4, 110, 146.8, 220])) for s in (-1, 1)], 1).astype(np.float32)
dr *= (np.linspace(0, 1, d) ** 1.6 * 0.09)[:, None]; place(music, dr, T_FIELD)
# reversed swell into the blackout
n = int(1.6 * SR)
swell = lp_fft(rng.standard_normal((n, 2)).astype(np.float32), 900) * (np.linspace(0, 1, n) ** 3)[:, None] * 0.12
place(sfx, swell, T_BLACK - 1.6)
# silence 20.25 -> 20.8, then the impact
n = int(4.5 * SR); t1 = np.arange(n) / SR
boom = (np.sin(2 * np.pi * (48 * np.exp(-t1 * 0.6) + 28) * t1) * np.exp(-t1 * 1.1)).astype(np.float32) * 0.75
crack = lp_fft(rng.standard_normal(n).astype(np.float32), 2500) * np.exp(-t1 * 9) * 0.35
imp = reverb(np.stack([boom + crack, boom + crack * 0.9], 1), 4.0, 0.35); place(sfx, imp, T_TITLE)
place(music, np.stack([tone(55, 3.2, 0.3, 2.0), tone(55.2, 3.2, 0.3, 2.0)], 1) * 0.08, T_TITLE + 0.1)

# ---------------- ACT 2: pulses and evolving texture ----------------
a0, a1 = acts['spread']; BPM = 72; bp = 60 / BPM
kick_n = int(0.5 * SR); kt = np.arange(kick_n) / SR; kick = (np.sin(2 * np.pi * (55 + 60 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 7)).astype(np.float32)
k = 0
while a0 + 0.4 + k * bp < a1:
    tt = a0 + 0.4 + k * bp; g = 0.16 * min(1, (tt - a0) / 6) * (0.7 if k % 4 else 1.0); place(music, kick, tt, g); k += 1
d = int((a1 - a0 + 1.5) * SR); tt = np.arange(d) / SR
pad = np.stack([sum(np.sin(2 * np.pi * f * (1 + s * 0.004) * tt + s) for f in (73.4, 110, 174.6, 220, 261.6)) for s in (-1, 1)], 1).astype(np.float32)
pad = lp_fft(pad, 900) * 0.022 * env(d, 3, 2, 1, 3)[:, None]; place(music, reverb(pad, 3, 0.4), a0)
for k2 in range(160):  # granular digital ticks
    tt = a0 + rng.random() * (a1 - a0); place(sfx, soft_click(0.025), tt, pan=rng.uniform(-0.9, 0.9))
# plug thunk, fracture, four chimes, copies
n = int(2.2 * SR); t1 = np.arange(n) / SR
shatter = (bp_fft(rng.standard_normal(n).astype(np.float32), 400, 3500) * np.exp(-t1 * 6) * 0.18 + thump(0.35, 50, 4, 2.2)).astype(np.float32)
place(sfx, reverb(np.stack([shatter, np.roll(shatter, 200)], 1), 2.5, 0.4), 40.2)
for i in range(4): place(sfx, reverb(np.stack([thump(0.22, 52 + i * 6, 5)] * 2, 1), 1.8, 0.3), ph('s4', i) + 0.05)
for k4 in range(10): place(sfx, soft_click(0.04), ph('s6', 2) + k4 * 0.35, pan=rng.uniform(-0.7, 0.7))

# ---------------- ACT 3: wider, deeper, ticks accelerate ----------------
a0, a1 = acts['network']; d = int((a1 - a0 + 2) * SR); tt = np.arange(d) / SR
wide = np.stack([sum(np.sin(2 * np.pi * f * (1 + s * 0.006 * (1 + i)) * tt + i) / (1 + i * 0.4) for i, f in enumerate([55, 82.4, 110, 164.8, 220, 329.6])) for s in (-1, 1)], 1).astype(np.float32)
grow = np.clip(tt / (a1 - a0), 0, 1)
wide = lp_fft(wide, 1400) * (0.03 + 0.03 * grow)[:, None] * env(d, 4, 2, 1, 2.5)[:, None]; place(music, reverb(wide, 4, 0.45), a0)
place(music, np.stack([tone(36.7, a1 - a0, 4, 3)] * 2, 1) * 0.12, a0)
tt0 = a0 + 1
while tt0 < a1 - 1:
    rate = 1.5 + 6.5 * ((tt0 - a0) / (a1 - a0)) ** 2; place(sfx, soft_click(0.03), tt0, pan=np.sin(tt0 * 3) * 0.7); tt0 += 1 / rate
n = int(3 * SR); place(sfx, lp_fft(rng.standard_normal((n, 2)).astype(np.float32), 600) * (np.sin(np.linspace(0, np.pi, n)) ** 2)[:, None] * 0.15, 77.0)

# ---------------- ACT 4: the sacred harmonic ----------------
a0, a1 = acts['mind']; d = int((a1 - a0 + 3) * SR); tt = np.arange(d) / SR
root = 73.42; ratios = [1, 3 / 2, 2, 5 / 2, 3, 15 / 4, 4, 9 / 2, 5, 6]
choir = np.zeros((d, 2), np.float32)
for i, r in enumerate(ratios):
    for s, ch in ((-1, 0), (1, 1)):
        vib = 1 + 0.0025 * np.sin(2 * np.pi * (4.6 + 0.3 * i) * tt + i)
        amp = (0.5 + 0.5 * np.sin(2 * np.pi * (0.05 + 0.017 * i) * tt + i * 1.7)) / (1 + i * 0.35)
        choir[:, ch] += (np.sin(2 * np.pi * root * r * (1 + s * 0.0015) * np.cumsum(vib) / SR) * amp).astype(np.float32)
sh = np.interp(a0 + tt, [a0, a0 + 4, ph('i2', 0), ph('i3', 0), ph('i4', 0), ph('i6', 0) - 0.5, ph('i6', 0) + 1.5, a1 + 2], [0, 0.35, 0.9, 1.0, 0.8, 0.55, 0.22, 0]).astype(np.float32)
choir = lp_fft(choir, 2600) * 0.03 * sh[:, None]; place(music, reverb(choir, 6.0, 0.6, bright=3000), a0)
place(music, np.stack([tone(36.7, a1 - a0 + 2, 3, 3)] * 2, 1) * 0.1, a0)
# region offline: low dissonant thud; heal: shimmer
n = int(3 * SR); t1 = np.arange(n) / SR; thud = (np.sin(2 * np.pi * 41 * t1) * np.exp(-t1 * 2) + np.sin(2 * np.pi * 58.3 * t1) * np.exp(-t1 * 2.5) * 0.6).astype(np.float32) * 0.35
place(sfx, reverb(np.stack([thud, thud], 1), 3, 0.4), ph('i3', 0)); place(sfx, reverb(np.stack([thud * 0.7, thud * 0.7], 1), 3, 0.4), ph('i3', 2))
place(sfx, air(3.0, 0.04, 700), ph('i3', 3))

# ---------------- ACT 5: restrained mechanical percussion ----------------
a0, a1 = acts['hide']
tick = (hp_fft(rng.standard_normal(int(0.02 * SR)).astype(np.float32), 3000) * np.exp(-np.arange(int(0.02 * SR)) / 90)).astype(np.float32)
tt0 = a0 + 0.6; k = 0
while tt0 < a1 - 0.5:
    place(sfx, lp_fft(tick, 2200) * (0.07 if k % 2 else 0.05), tt0, pan=0.3 if k % 2 else -0.3); tt0 += 0.5; k += 1
n = int(2.2 * SR); t1 = np.arange(n) / SR
for tt in [ph('w3', 3), ph('w3', 5), ph('w4', 1), ph('w4', 2) - 0.6]: place(sfx, reverb(np.stack([thump(0.4, 46, 4.5, 1.4)] * 2, 1), 2.0, 0.3), tt)
d = int((a1 - a0 + 2) * SR); tt = np.arange(d) / SR
low = np.stack([np.sin(2 * np.pi * 55 * tt) * 0.5 + np.sin(2 * np.pi * 82.4 * tt + 1) * 0.3] * 2, 1).astype(np.float32) * (0.06 * env(d, 3, 2, 1, 3))[:, None]
place(music, low, a0)
# the glass box appears
place(sfx, air(2.4, 0.03, 600), ph('w5', 3))

# ---------------- ACT 6: tension thins; sonar ----------------
a0, a1 = acts['detect']; d = int((a1 - a0 + 1) * SR); tt = np.arange(d) / SR
place(music, np.stack([tone(41.2, a1 - a0, 3, 3)] * 2, 1) * 0.07, a0)
ping = reverb(np.stack([thump(0.16, 64, 7, 0.8)] * 2, 1), 1.5, 0.3)
for tt in [ph('k2', i) for i in range(5)] + [ph('k3', i) for i in (0, 2, 3, 4)]: place(sfx, ping, tt + 0.1)
n = int(1.8 * SR); t1 = np.arange(n) / SR; bad = (np.sin(2 * np.pi * 103.8 * t1) + np.sin(2 * np.pi * 110 * t1)) * np.exp(-t1 * 2) * 0.12
place(sfx, np.stack([bad, bad], 1).astype(np.float32), ph('k4', 2))

# ---------------- ACT 6b: the universe waking up ----------------
a0, a1 = acts['cosmos']; d = int((a1 - a0 + 3) * SR); tt = np.arange(d) / SR
chordA = [55, 82.4, 110, 138.6, 164.8, 220, 277.2]  # A major, open voicing
cos_ = np.stack([sum(np.sin(2 * np.pi * f * (1 + s * 0.004 * (1 + i % 3)) * tt + i) / (1 + i * 0.3) for i, f in enumerate(chordA)) for s in (-1, 1)], 1).astype(np.float32)
open_ = np.interp(a0 + tt, [a0, ph('c3', 0), ph('c5', 0), ph('c6', 0) + 3, a1 + 3], [0.2, 0.45, 1.0, 0.7, 0.0]).astype(np.float32)
cos_ = (lp_fft(cos_, 700) * 0.6 + lp_fft(cos_, 2400) * 0.4 * open_[:, None]) * (0.05 * open_)[:, None] * env(d, 4, 3, 1, 4)[:, None]
place(music, reverb(cos_, 6.0, 0.55, bright=2600), a0)
place(music, np.stack([tone(27.5 * 2, a1 - a0 + 2, 5, 4)] * 2, 1) * 0.09, a0)
place(sfx, air(5.0, 0.05, 1500), ph('c5', 0) - 1.5)

# ---------------- ACT 7: recede into silence ----------------
a0, a1 = acts['final']; d = int((T_END_BLACK + 0.2 - a0) * SR); tt = np.arange(d) / SR
fin = np.stack([sum(np.sin(2 * np.pi * f * (1 + s * 0.003) * tt) / (i + 1) for i, f in enumerate([73.4, 110, 146.8, 185, 220])) for s in (-1, 1)], 1).astype(np.float32)
fin = lp_fft(fin, 1200) * (np.interp(tt, [0, 3, 6, 12, 16, 18.8], [0, 0.0, 0.5, 0.6, 0.25, 0]) * 0.06)[:, None]; place(music, reverb(fin, 5, 0.5), a0)
# the final line: a single low tone in near-silence
place(music, np.stack([tone(55, 3.4, 1.2, 2.0), tone(55.1, 3.4, 1.2, 2.0)], 1) * 0.04, T_END_BLACK + 0.6)

# hard silence at the blackout and at the final cut
for a, b in [(T_BLACK, T_TITLE)]:
    i, j = int(a * SR), int(b * SR); music[i:j] *= 0; sfx[i:j] *= 0
i = int(T_END_BLACK * SR); g = np.ones(N, np.float32); g[i:i + int(0.2 * SR)] = np.linspace(1, 0.15, int(0.2 * SR)); g[i + int(0.2 * SR):] = 0.15
sfx *= g[:, None]
os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
for b_ in (music, sfx):
    pk = float(np.abs(b_).max())
    if pk > 0.9: b_ *= 0.9 / pk
write(os.path.join(ROOT, 'data', 'music.wav'), music); write(os.path.join(ROOT, 'data', 'sfx.wav'), sfx)
print('music + sfx', T, 's', 'peak', float(np.abs(music).max()), float(np.abs(sfx).max()))
