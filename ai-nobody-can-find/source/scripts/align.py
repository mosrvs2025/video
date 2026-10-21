"""Phrase + word timing from the narration itself: split each line at punctuation, match the breaks to the
silences Kokoro leaves in the audio, then spread words inside each phrase by syllable count.
Writes src/cues.json  {lineId: {t0, t1, phrases: [{t0, t1, text, words: [{w, t}]}]}}
"""
import json, os, re, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)

def load(p):
    w = wave.open(p); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; return x, sr

def gaps(x, sr, min_gap=0.11):
    hop = int(0.01 * sr); n = len(x) // hop
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    thr = max(0.006, np.percentile(e, 60) * 0.08); quiet = e < thr; out = []; i = 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if (j - i) * 0.01 >= min_gap and i > 0 and j < n: out.append(((i + j) / 2 * 0.01, (j - i) * 0.01))
            i = j
        else: i += 1
    return out

def syl(w):
    w = re.sub(r'[^a-z]', '', w.lower()); return max(1, len(re.findall(r'[aeiouy]+', w)))

def main():
    T = json.load(open(os.path.join(ROOT, 'src', 'timeline.json'))); out = {}
    for lid, L in T['lines'].items():
        x, sr = load(os.path.join(ROOT, 'data', 'lines', lid + '.wav')); d = len(x) / sr
        text = L['text']; parts = [p.strip() for p in re.split(r'(?<=[.,?:;!…])\s+', text) if p.strip()]
        G = gaps(x, sr); need = len(parts) - 1
        # match each phrase boundary to a pause: minimise distance to the boundary's expected time (by characters),
        # favouring longer pauses, keeping order (small DP)
        tot = sum(len(p) for p in parts); acc = 0; exp = []
        for p in parts[:-1]: acc += len(p); exp.append(d * acc / tot)
        cuts = []
        if len(G) >= need and need > 0:
            INF = 1e9; m = len(G); cost = [[INF] * m for _ in range(need)]; back = [[-1] * m for _ in range(need)]
            c = lambda k, j: abs(G[j][0] - exp[k]) - 0.8 * G[j][1]
            for j in range(m): cost[0][j] = c(0, j)
            for k in range(1, need):
                best, bj = INF, -1
                for j in range(m):
                    if j > 0 and cost[k - 1][j - 1] < best: best, bj = cost[k - 1][j - 1], j - 1
                    if bj >= 0: cost[k][j] = best + c(k, j); back[k][j] = bj
            j = min(range(m), key=lambda j: cost[need - 1][j]); sel = []
            for k in range(need - 1, -1, -1): sel.append(j); j = back[k][j]
            cuts = [G[j][0] for j in reversed(sel)]
        if len(cuts) < need: cuts = exp  # fall back: proportional to characters
        bounds = [0.0] + cuts + [d]; phrases = []
        for k, p in enumerate(parts):
            a, b = bounds[k] + (0.05 if k else 0), bounds[k + 1] - (0.05 if k < len(parts) - 1 else 0)
            ws = p.split(); s = [syl(w) for w in ws]; tot = sum(s); acc = 0; words = []
            for w, sy in zip(ws, s): words.append({'w': w, 't': round(L['t0'] + a + (b - a) * (0.75 * acc / tot + 0.25 * len(words) / len(ws)), 3)}); acc += sy
            phrases.append({'t0': round(L['t0'] + a, 3), 't1': round(L['t0'] + b, 3), 'text': p, 'words': words})
        out[lid] = {'t0': L['t0'], 't1': L['t1'], 'act': L['act'], 'phrases': phrases}
    json.dump(out, open(os.path.join(ROOT, 'src', 'cues.json'), 'w'), indent=1)
    for lid in ['r1', 's4', 'k2']: print(lid, [(p['t0'], p['text']) for p in out[lid]['phrases']])

if __name__ == '__main__': main()
