#!/usr/bin/env python3
"""Mouth-shape timeline for the rapper character, from the forced-alignment PHONE tier (ARPAbet).
  visemes.py <song_dir> -> work/visemes.json : [[t0, t1, code], ...] in absolute song time
codes: 0 closed (M B P) | 1 wide open (AA AE AH AW AY) | 2 mid/spread (EH EY IH ER) | 3 round (OW OY UW W) | 4 small round (UH)
       5 lip-teeth (F V) | 6 narrow/smile (IY Y S Z SH CH JH) | 7 tongue-teeth (T D N L K G TH DH R NG HH) | 8 silence
Absolute time = TextGrid time + (aligned first-word start - TextGrid first-word start)."""
import json, os, sys, re
import textgrid
song = os.path.abspath(sys.argv[1]); work = f"{song}/work"
L = json.load(open(f"{work}/lines_aligned.json"))
ov = json.load(open(f"{song}/overrides.json")) if os.path.exists(f"{song}/overrides.json") else {}
M = {}
for ph in "M B P".split(): M[ph] = 0
for ph in "AA AE AH AW AY".split(): M[ph] = 1
for ph in "EH EY IH ER".split(): M[ph] = 2
for ph in "OW OY UW W".split(): M[ph] = 3
M["UH"] = 4
for ph in "F V".split(): M[ph] = 5
for ph in "IY Y S Z SH ZH CH JH".split(): M[ph] = 6
for ph in "T D N L K G TH DH R NG HH".split(): M[ph] = 7
out = []
for l in L:
    i = l["i"]; d = "mfa_repair" if str(i) in ov else "mfa_lines"
    tg = textgrid.TextGrid.fromFile(f"{work}/{d}/l{i:03d}.TextGrid")
    w0 = next(x.minTime for x in tg.getFirst("words") if x.mark)
    off = l["t0"][0] - w0
    for p in tg.getFirst("phones"):
        if not p.mark: continue
        code = M.get(re.sub(r"\d", "", p.mark), 7)
        out.append([round(p.minTime + off, 3), round(p.maxTime + off, 3), code])
out.sort()
json.dump(out, open(f"{work}/visemes.json", "w"), separators=(",", ":"))
from collections import Counter
print(len(out), "phones;", dict(Counter(c for _, _, c in out)), "first", out[0], "last", out[-1])
