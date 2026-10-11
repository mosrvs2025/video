#!/usr/bin/env python3
"""Per-frame music features so the visuals follow what is actually in the audio (not just a fixed beat grid).
  music.py <song_dir>  ->  work/music.json   (60 fps)
Instrumental = full mix - isolated vocals.  From it: 64 log-spaced spectrum bands (40 Hz-10 kHz), kick / snare / hat onset
events and decaying envelopes (from the percussive part), bass level, string/cello level + pitch-class (chroma) + pitch height
(from the harmonic part), plus the vocal level from the vocal stem.  Arrays are uint8 base64 to keep the file small."""
import json, os, sys, glob, base64
import numpy as np, soundfile as sf, librosa
from scipy.ndimage import uniform_filter1d

song = os.path.abspath(sys.argv[1]); work = f"{song}/work"
mix, sr0 = sf.read(f"{work}/song.wav"); mix = mix.mean(1) if mix.ndim > 1 else mix
voc = sf.read(glob.glob(f"{work}/stems/*Vocals*.wav")[0])[0]; voc = voc.mean(1) if voc.ndim > 1 else voc
n = min(len(mix), len(voc)); mix, voc = mix[:n], voc[:n]
SR = 22050; mixr = librosa.resample(mix, orig_sr=sr0, target_sr=SR); vocr = librosa.resample(voc, orig_sr=sr0, target_sr=SR)
inst = mixr - vocr * 0.95
FPS = 60; HOP = 256; dur = len(mixr) / SR; N = int(dur * FPS)
tgrid = np.arange(N) / FPS
def to60(a, hop=HOP):                       # (frames,) or (frames, k) at SR/hop -> 60 fps
    t = np.arange(a.shape[0]) * hop / SR
    if a.ndim == 1: return np.interp(tgrid, t, a)
    return np.stack([np.interp(tgrid, t, a[:, k]) for k in range(a.shape[1])], 1)
def norm(a, lo=5, hi=99.5, gamma=1.0):
    l, h = np.percentile(a, lo), np.percentile(a, hi); return np.clip((a - l) / (h - l + 1e-9), 0, 1) ** gamma
q = lambda a: np.clip(np.round(a * 255), 0, 255).astype(np.uint8)
b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()

# ---- 64 spectrum bands of the instrumental ----
S = np.abs(librosa.stft(inst, n_fft=2048, hop_length=HOP)) ** 2; fr = librosa.fft_frequencies(sr=SR, n_fft=2048)
edges = np.geomspace(40, 10000, 65); bands = np.zeros((S.shape[1], 64))
for k in range(64):
    m = (fr >= edges[k]) & (fr < edges[k + 1]); bands[:, k] = S[m].sum(0) if m.any() else S[np.argmin(abs(fr - edges[k]))]
bdb = 10 * np.log10(bands + 1e-10); B = np.zeros_like(bdb)
for k in range(64): B[:, k] = norm(bdb[:, k], 10, 99.7, 1.3)
B60 = to60(B)

# ---- percussive onsets ----
perc = librosa.effects.percussive(inst, margin=3.0)
Sp = np.abs(librosa.stft(perc, n_fft=2048, hop_length=HOP))
def flux(lo, hi):
    m = (fr >= lo) & (fr < hi); e = np.log1p(Sp[m].sum(0) * 20); d = np.maximum(0, np.diff(e, prepend=e[0])); return uniform_filter1d(d, 2)
def events(f, wait_s, thr_pct, name):
    x = f / (np.percentile(f, 99.5) + 1e-9); pk = librosa.util.peak_pick(x, pre_max=3, post_max=3, pre_avg=12, post_avg=12, delta=np.percentile(x, thr_pct) * .5, wait=int(wait_s * SR / HOP))
    ev = [(round(float(p * HOP / SR), 3), round(float(min(1.0, x[p])), 2)) for p in pk]
    print(f"{name}: {len(ev)} events"); return ev
kick = events(flux(35, 130), .18, 80, "kick"); snare = events(flux(1500, 5500) + flux(180, 350) * .6, .22, 85, "snare"); hat = events(flux(7500, 11000), .06, 80, "hat")
def env(ev, decay):                          # decaying envelope at 60 fps from events
    e = np.zeros(N)
    for t, s in ev:
        i = int(t * FPS); 
        if i < N: j = np.arange(i, min(N, i + int(FPS * 1.5))); e[j] = np.maximum(e[j], s * np.exp(-(j - i) / FPS / decay))
    return e
# ---- bass, strings (harmonic part), pitch ----
harm = librosa.effects.harmonic(inst, margin=2.0)
Sh = np.abs(librosa.stft(harm, n_fft=4096, hop_length=HOP)); frh = librosa.fft_frequencies(sr=SR, n_fft=4096)
mid = (frh >= 180) & (frh < 2600); strings = norm(uniform_filter1d(np.log1p(Sh[mid].sum(0)), 4), 10, 99, 1.4)
bass = norm(uniform_filter1d(np.log1p(np.abs(librosa.stft(inst, n_fft=2048, hop_length=HOP))[(fr < 140)].sum(0)), 3), 10, 99.5, 1.2)
chroma = librosa.feature.chroma_stft(S=Sh ** 2, sr=SR, n_chroma=12, n_fft=4096); chroma = (chroma / (chroma.max(0, keepdims=True) + 1e-9)).T
cent = librosa.feature.spectral_centroid(S=Sh[mid], freq=frh[mid])[0]; height = norm(uniform_filter1d(np.log(cent + 1), 6), 5, 95)
vrms = librosa.feature.rms(y=vocr, frame_length=1024, hop_length=HOP)[0]; vocal = norm(uniform_filter1d(vrms, 3), 20, 99, .8)
out = {"fps": FPS, "n": N, "dur": dur, "edges": [round(x, 1) for x in edges],
       "bands": b64(q(B60)), "chroma": b64(q(to60(chroma))),
       "kick_env": b64(q(env(kick, .22))), "snare_env": b64(q(env(snare, .18))), "hat_env": b64(q(env(hat, .07))),
       "bass": b64(q(to60(bass))), "strings": b64(q(to60(strings))), "pitch": b64(q(to60(height))), "vocal": b64(q(to60(vocal))),
       "kick": kick, "snare": snare, "hat": hat}
json.dump(out, open(f"{work}/music.json", "w"), separators=(",", ":"))
# sanity: how well do detected kicks line up with the 128 BPM grid?
B_ = json.load(open(f"{work}/beats.json")); per = B_["period"]; ph = B_["beats"][0]
off = [((t - ph) / per) % 1 for t, s in kick if s > .4]; off = [o if o < .5 else o - 1 for o in off]
print(f"kicks within +-60 ms of a grid pulse: {np.mean(np.abs(np.array(off)) * per < .06) * 100:.0f}%  (median offset {np.median(off) * per * 1000:.0f} ms)")
print("wrote music.json", os.path.getsize(f"{work}/music.json") // 1024, "KB")
