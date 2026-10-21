"""Phrase cues -> SRT. Blocks of <= 2 lines x 42 chars, 1.0-6.5 s each. Usage: captions.py <out.srt> [lineIds,comma,separated] [timeOffsetsJSON]"""
import json, os, sys, textwrap
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
CU = json.load(open(os.path.join(ROOT, 'src', 'cues.json')))
def ts(t): t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'.replace(',1000', ',999')
def blocks(ids, remap=lambda t: t):
    out = []
    for lid in ids:
        L = CU[lid]; ps = L['phrases']; cur = None
        for k, p in enumerate(ps):
            end = ps[k + 1]['t0'] - 0.05 if k + 1 < len(ps) else L['t1'] + 0.35
            txt = p['text'].replace('bot-net', 'botnet')
            if cur and len(cur['text'] + ' ' + txt) <= 80 and end - cur['a'] <= 6.5: cur['text'] += ' ' + txt; cur['b'] = end
            else:
                if cur: out.append(cur)
                cur = {'a': p['t0'], 'b': end, 'text': txt}
        out.append(cur)
    res = []
    for b in out:
        lines = textwrap.wrap(b['text'], 42)
        if len(lines) > 2:  # split long block in two by words
            words = b['text'].split(); half = len(words) // 2; mid = b['a'] + (b['b'] - b['a']) * half / len(words)
            res.append({'a': b['a'], 'b': mid, 'text': ' '.join(words[:half])}); res.append({'a': mid, 'b': b['b'], 'text': ' '.join(words[half:])})
        else: res.append(b)
    return [{**r, 'a': remap(r['a']), 'b': remap(r['b'])} for r in res]
def write(path, bl):
    with open(path, 'w') as f:
        for i, b in enumerate(bl, 1): f.write(f"{i}\n{ts(b['a'])} --> {ts(max(b['b'], b['a'] + 1.0))}\n" + '\n'.join(textwrap.wrap(b['text'], 42)) + '\n\n')
if __name__ == '__main__':
    out = sys.argv[1]; ids = sys.argv[2].split(',') if len(sys.argv) > 2 else list(CU.keys())
    bl = blocks(ids); write(out, bl); print(len(bl), 'captions ->', out)
