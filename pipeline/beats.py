#!/usr/bin/env python3
"""Tempo + beat grid by brute-force fit on a drum-weighted onset envelope (madmom does not build
on py3.13 and beat_this weights are not reachable offline, so this is the fallback).
Also writes 30 fps low/high band energy for pulse-driven visuals.
Usage: beats.py <song_dir>  -> work/beats.json
"""
import json, os, sys
import numpy as np, soundfile as sf, librosa

def fit(env, fps, lo, hi, t0, t1, step=0.02):
    a, b = int(t0 * fps), int(t1 * fps)
    e = env[a:b]; n = len(e); best = (-1, 0, 0)
    for bpm in np.arange(lo, hi, step):
        P = 60.0 * fps / bpm
        k = np.arange(0, n / P)
        for ph in np.arange(0, P, 0.5):
            idx = (ph + k * P).astype(int); idx = idx[idx < n]
            s = e[idx].mean()
            if s > best[0]: best = (s, bpm, (ph + a) / fps)
    return best

def run(song):
    work = os.path.join(os.path.abspath(song), "work")
    y, sr = sf.read(f"{work}/song.wav"); y = y.mean(1) if y.ndim > 1 else y
    y = librosa.resample(y, orig_sr=sr, target_sr=22050); sr = 22050
    perc = librosa.effects.percussive(y, margin=3.0)
    hop = 220                                              # 100 fps
    on = librosa.onset.onset_strength(y=perc, sr=sr, hop_length=hop, fmax=6000)
    on = on / (on.max() + 1e-9); fps = sr / hop
    dur = len(y) / sr
    glob = fit(on, fps, 120, 136, 50, 200, 0.05)
    print(f"global fit (50-200 s): {glob[1]:.2f} BPM, phase {glob[2]:.3f}s")
    segs = []
    for t in range(40, int(dur) - 40, 40):
        f = fit(on, fps, 60, 190, t, t + 40, 0.1); segs.append((t, round(f[1], 1), round(f[0], 3)))
    print("40 s windows (start, bpm, strength):", segs)
    bpm, ph = glob[1], glob[2]; P = 60 / bpm
    kick = librosa.feature.rms(y=librosa.effects.preharmonic(y) if False else y, frame_length=2048, hop_length=hop)[0]
    # beat grid across the whole song; label every other pulse as the half-time 'beat'
    grid = np.arange(ph - np.floor(ph / P) * P, dur, P)
    # choose half-time parity by comparing low-band energy on even vs odd pulses
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
    low = S[fr < 150].sum(0); high = S[fr > 5000].sum(0)
    li = np.clip((grid * fps).astype(int), 0, len(low) - 1)
    par = [low[li[p::2]].mean() for p in (0, 1)]
    half_par = int(np.argmax(par))
    f30 = lambda v: np.interp(np.arange(0, dur, 1 / 30), np.arange(len(v)) / fps, v / v.max()).round(3).tolist()
    json.dump({"bpm": bpm, "period": P, "phase": float(grid[0]), "beats": grid.round(3).tolist(),
               "half_parity": half_par, "window_bpms": segs, "dur": dur,
               "low30": f30(low), "high30": f30(high)}, open(f"{work}/beats.json", "w"))
    print(f"grid period {P:.4f}s, {len(grid)} pulses, half-time parity {half_par} (low-band {par[0]:.0f} vs {par[1]:.0f})")

if __name__ == "__main__":
    run(sys.argv[1])
