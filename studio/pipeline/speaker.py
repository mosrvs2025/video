"""Cheap 2-speaker labelling by voice pitch (synthetic female voice vs male voice): median F0 over voiced frames of a time span.
Calibrate with known spans if needed. Returns median Hz (0 if unvoiced)."""
import numpy as np

def f0_median(x, sr, t0, t1, fmin=70, fmax=360):
    a, b = int(t0 * sr), int(t1 * sr); seg = x[a:b]
    if len(seg) < sr * 0.08: return 0.0
    win = int(0.04 * sr); hop = int(0.01 * sr); lo, hi = int(sr / fmax), int(sr / fmin); vals = []
    for i in range(0, len(seg) - win, hop):
        f = seg[i:i + win] * np.hanning(win)
        if np.sqrt(np.mean(f ** 2)) < 0.01: continue
        ac = np.correlate(f, f, 'full')[win - 1:]
        if ac[0] <= 0: continue
        r = ac[lo:hi] / ac[0]
        k = int(np.argmax(r))
        if r[k] > 0.45: vals.append(sr / (lo + k))
    return float(np.median(vals)) if len(vals) >= 3 else 0.0
