#!/usr/bin/env python3
"""Build timeline.json (what the renderer reads) + timing_report.md from the aligned lines.

* fast lines (> FAST_WPS words/s) are shown as 2-3 word chunks, each appearing LEAD s before
  its first word's vocal onset and held until the next chunk arrives; slow lines are shown whole.
* every word gets a confidence tag: high / medium / low, with the reason recorded.
Usage: timeline.py <song_dir>
"""
import json, os, sys, re
import numpy as np

FAST_WPS = 4.0
LEAD = 0.070
WEAK = {"a", "an", "the", "of", "to", "in", "on", "at", "and", "but", "or", "my", "your", "his", "her", "their",
        "i", "he", "she", "it", "we", "you", "they", "that", "this", "with", "for", "from", "so", "is", "was", "me", "got"}

def chunk_words(words, t0, t1, toks):
    """Group words into chunks of 2-3: never end a chunk on a weak function word, prefer breaking at pauses."""
    n = len(words); out = []; i = 0
    while i < n:
        j = min(n, i + 3)
        if n - j == 1: j = min(n, j + 1) if (j - i) < 3 else j - 1 if (j - i) > 2 else j
        # shrink to 2 / grow to 3 to avoid a dangling weak word at the end
        while j - i > 1 and toks[j - 1] in WEAK: j -= 1
        if j - i == 1 and j < n: j = min(n, i + 2)
        # prefer a pause inside the 2-3 word window
        best, bg = j, 0.0
        for k in range(i + 2, min(n, i + 3) + 1):
            if k < n and t0[k] - t1[k - 1] > bg + 0.03 and toks[k - 1] not in WEAK: best, bg = k, t0[k] - t1[k - 1]
        j = best if bg > 0.06 else j
        out.append((i, j)); i = j
    return out

def conf(l, k):
    d1 = l["t1"][k] - l["t0"][k]
    if l.get("override") and not l["flags"]: why = "window set by hand (" + l["override"]["reason"][:60] + ")"; return "medium", why
    if l["flags"]: return "low", "; ".join(l["flags"])
    if d1 < 0.04 and l["toks"][k] not in WEAK: return "medium", "very short word (<40 ms)"
    if l["phone_dev"] > 3.3 or l["ll"] < -62: return "medium", f"line fit ll {l['ll']:.0f} dev {l['phone_dev']:.1f}"
    if l["drift"] > 0.1: return "medium", f"line moved {l['drift']:.2f}s between passes"
    return "high", ""

def run(song):
    song = os.path.abspath(song); work = f"{song}/work"
    L = json.load(open(f"{work}/lines_aligned.json")); lines = json.load(open(f"{work}/lines.json"))
    B = json.load(open(f"{work}/beats.json"))
    tl = []; rows = []
    for l, src in zip(L, lines):
        t0, t1, toks = l["t0"], l["t1"], src["toks"]
        wps = len(t0) / (t1[-1] - t0[0])
        mode = "chunks" if wps > FAST_WPS else "line"
        ch = []
        if mode == "chunks":
            spans = chunk_words(l["words"], t0, t1, toks)
            for a, (i, j) in enumerate(spans):
                nxt = t0[spans[a + 1][0]] - LEAD if a + 1 < len(spans) else t1[-1] + 0.15
                ch.append({"text": " ".join(l["words"][i:j]), "w": [i, j], "t": round(t0[i] - LEAD, 3), "t_end": round(nxt, 3)})
        words = []
        l["toks"] = toks
        for k, w in enumerate(l["words"]):
            c, why = conf(l, k)
            words.append({"w": w, "t0": t0[k], "t1": t1[k], "conf": c, "why": why})
        tl.append({"i": l["i"], "section": l["section"], "text": l["text"], "start": round(t0[0], 3), "end": round(t1[-1], 3),
                   "wps": round(wps, 2), "mode": mode, "chunks": ch, "words": words,
                   "conf": ("low" if l["flags"] else "medium" if (l.get("override") or any(w["conf"] != "high" for w in words)) else "high"),
                   "ll": l["ll"], "dev": l["phone_dev"], "drift": l["drift"], "override": l.get("override"), "flags": l["flags"]})
    json.dump({"dur": B["dur"], "bpm": B["bpm"], "beat_period": B["period"], "lines": tl}, open(f"{work}/timeline.json", "w"))
    # ---- report ----
    n = len(tl); cnt = {c: sum(1 for t in tl if t["conf"] == c) for c in ("high", "medium", "low")}
    md = [f"# Timing report — {os.path.basename(song)}", "",
          "Method: UVR-MDX-NET-Voc_FT vocal isolation -> Montreal Forced Aligner (english_us_arpa) against the exact lyrics, "
          "global pass then 3 per-line refinement passes (windows cut at the quietest point between lines). "
          f"Tempo {B['bpm']:.2f} BPM (brute-force fit; 64 BPM half-time kick confirmed in every 40 s window).", "",
          f"Lines: {n} — **high {cnt['high']}**, **medium {cnt['medium']}**, **low {cnt['low']}**.",
          f"Fast lines (> {FAST_WPS} words/s) shown as 2-3 word chunks starting {int(LEAD*1000)} ms before the vocal onset: "
          f"{sum(1 for t in tl if t['mode']=='chunks')} of {n}.", "",
          "## Lines that need your eye", "", "| line | time | section | text | confidence | why |", "|---|---|---|---|---|---|"]
    for t in tl:
        if t["conf"] != "high":
            why = "; ".join(t["flags"]) or (t["override"]["reason"] if t["override"] else "")
            if not why:
                ws = sorted({w["why"] for w in t["words"] if w["why"]}); why = "; ".join(ws)[:110]
            md.append(f"| {t['i']} | {t['start']:.1f}–{t['end']:.1f} s | {t['section']} | {t['text'][:46]} | {t['conf']} | {why} |")
    md += ["", "## Honest caveats", "",
           "- Alignment is **not Demucs**: Demucs weights (dl.fbaipublicfiles.com) and Whisper/WhisperX weights (HuggingFace, OpenAI CDN) were unreachable "
           "from this sandbox, so vocals were isolated with UVR-MDX-NET-Voc_FT (GitHub release) and aligned with MFA (GitHub release models). Re-run on your machine with Demucs + WhisperX if you can.",
           "- MFA has no model of rapping: word *boundaries* inside fast bars can be off by 30–80 ms; line starts are the most reliable.",
           "- Beat tracking is a brute-force fit (madmom does not build on Python 3.13; beat_this weights unreachable), not a learned tracker. It assumes a constant 128 BPM grid.",
           "- Lines marked *hand-set window* were fixed with a window I chose (see overrides.json): the aligner smeared them over instrumental gaps.",
           "- Suno caption times from the first attempt were used only as a weak sanity check and to place the window for line 32.", ""]
    open(f"{song}/timing_report.md", "w").write("\n".join(md))
    print(cnt, "chunked", sum(1 for t in tl if t['mode']=='chunks'))

if __name__ == "__main__":
    run(sys.argv[1])
