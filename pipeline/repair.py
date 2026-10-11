#!/usr/bin/env python3
"""Re-align flagged lines inside explicit windows from <song>/overrides.json.

A line is *flagged* when it is implausibly slow/long, has a very poor acoustic fit, or moved a
lot between refinement passes (see flag_reasons).  Likelihood alone can't pick a better window
(scores aren't comparable across window lengths -- tried, it chose wrong), so a human/assistant
sets the window, usually from the spectrogram/debug render or the Suno caption times, and the
reason is carried into the timing report:

  overrides.json: {"32": {"window": [126.8, 129.8], "reason": "caption prior 127.8s; aligner smeared over the beat switch"}}

Usage: repair.py <song_dir>
"""
import json, os, shutil, sys, csv
import soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from align import mfa, read_tg, SR

def flag_reasons(l):
    d = l["end"] - l["start"]; wps = len(l["words"]) / d; r = []
    if wps < 1.5 and d > 4: r.append(f"very slow ({wps:.1f} words/s)")
    if d > 6: r.append(f"very long ({d:.1f}s)")
    if l["ll"] < -65 and l["drift"] >= 0: r.append(f"poor acoustic fit (ll {l['ll']:.0f})")
    if l["drift"] > 1.0: r.append(f"moved {l['drift']:.1f}s between passes")
    return r

def run(song):
    song = os.path.abspath(song); work = f"{song}/work"
    L = json.load(open(f"{work}/lines_aligned.json"))
    lines = json.load(open(f"{work}/lines.json"))
    y = sf.read(f"{work}/corpus_full/song.wav")[0]
    ov_path = f"{song}/overrides.json"
    ov = json.load(open(ov_path)) if os.path.exists(ov_path) else {}
    for l in L:
        l["flags"] = flag_reasons(l); l.pop("override", None)
    if ov:
        corpus = f"{work}/corpus_repair"; shutil.rmtree(corpus, ignore_errors=True); os.makedirs(corpus)
        for k, v in ov.items():
            a, b = v["window"]
            sf.write(f"{corpus}/l{int(k):03d}.wav", y[int(a * SR):int(b * SR)], SR)
            open(f"{corpus}/l{int(k):03d}.lab", "w").write(" ".join(lines[int(k)]["toks"]))
        out = f"{work}/mfa_repair"; mfa(corpus, out, work)
        an = {r["file"]: r for r in csv.DictReader(open(f"{out}/alignment_analysis.csv"))}
        for k, v in ov.items():
            i = int(k); a, b = v["window"]
            w = [(s + a, e + a) for s, e, m in read_tg(f"{out}/l{i:03d}.TextGrid")]
            r = an[f"l{i:03d}"]
            L[i].update(start=w[0][0], end=w[-1][1], t0=[round(x[0], 3) for x in w],
                        t1=[round(x[1], 3) for x in w], ll=float(r["speech_log_likelihood"]),
                        phone_dev=float(r["phone_duration_deviation"]), drift=0.0,
                        override={"window": v["window"], "reason": v["reason"]})
            L[i]["flags"] = flag_reasons(L[i])
            print(f"line {i}: -> {w[0][0]:.2f}-{w[-1][1]:.2f}  ll={L[i]['ll']:.1f}  ({v['reason']})")
    left = [(l["i"], l["flags"]) for l in L if l["flags"] and not l.get("override")]
    print("still flagged, no override:", left)
    json.dump(L, open(f"{work}/lines_aligned.json", "w"), indent=1)

if __name__ == "__main__":
    run(sys.argv[1])
