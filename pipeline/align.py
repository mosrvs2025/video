#!/usr/bin/env python3
"""Forced alignment of exact lyrics to an isolated vocal stem with Montreal Forced Aligner.

Why not one big MFA run?  On a 289 s song with long instrumental gaps the aligner
smears a word across the gap and then drops the following words in the wrong place
(seen on this song: "decorating" stretched over 22 s).  So:

  pass 0  one global MFA run  -> rough position of every line (only trusted at line level)
  pass N  cut the vocal stem into one window per lyric line (cut at the quietest point
          between neighbours, trimmed at real silences), run MFA per line, re-derive the
          windows from the result, repeat with tighter padding.

Outputs <work>/words.json  (per word: start,end,line,conf flags) and lines_aligned.json.
Usage: align.py <song_dir>     (expects work/lines.json and work/stems/*Vocals*.wav)
"""
import json, os, subprocess, sys, glob, csv, shutil
import numpy as np, soundfile as sf, textgrid

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MFA_BIN = os.path.join(ROOT, ".mamba/envs/mfa/bin")
SR = 16000

def mfa(corpus, out, work, extra=()):
    # keep the venv out of MFA's conda env (a leaked VIRTUAL_ENV breaks its sqlite step)
    clean_path = ":".join(p for p in os.environ["PATH"].split(":") if ".venv" not in p)
    env = {k: v for k, v in os.environ.items() if k not in ("VIRTUAL_ENV", "PYTHONHOME", "PYTHONPATH")}
    env.update(MAMBA_ROOT_PREFIX=os.path.join(ROOT, ".mamba"),
               MFA_ROOT_DIR=os.path.join(work, "mfa_root"), PATH=MFA_BIN + ":" + clean_path)
    shutil.rmtree(out, ignore_errors=True)
    cmd = [os.path.join(MFA_BIN, "mfa"), "align", "--clean", "--single_speaker", "-j", "1",
           "--config_path", os.path.join(work, "mfa_cfg.yaml"), *extra, corpus,
           os.path.join(work, "mfa_models/english_us_arpa.dict"),
           os.path.join(work, "mfa_models/english_us_arpa.zip"), out]
    for attempt in range(3):      # MFA's sqlite export step is occasionally flaky
        shutil.rmtree(out, ignore_errors=True)
        r = subprocess.run(cmd, env=env, capture_output=True, text=True)
        if r.returncode == 0:
            return
        print(f"  mfa attempt {attempt+1} failed: {r.stderr.strip().splitlines()[-1][:120]}", flush=True)
    raise SystemExit(r.stdout[-2000:] + r.stderr[-2000:])

def read_tg(path):
    tg = textgrid.TextGrid.fromFile(path)
    return [(i.minTime, i.maxTime, i.mark) for i in tg.getFirst("words") if i.mark]

def vocal_db(y):
    hop = int(0.01 * SR); n = len(y) // hop
    r = np.sqrt((y[:n * hop].reshape(n, hop) ** 2).mean(1))
    return 20 * np.log10(r + 1e-6)          # 100 fps

def dedupe_global(ws, toks):
    """MFA's json/TextGrid can repeat a word that spans a pause; keep the first copy."""
    import difflib
    a = [w[2] for w in ws]
    keep = list(range(len(ws)))
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, toks, a, autojunk=False).get_opcodes():
        if op == "insert":
            for j in range(j1, j2): keep.remove(j)
    return [ws[k] for k in keep]

def line_spans(ws, lines):
    spans, k = [], 0
    for l in lines:
        n = len(l["toks"]); seg = ws[k:k + n]; k += n
        spans.append([seg[0][0], seg[-1][1]])
    return spans

def trim_to_voice(s, e, db, quiet):
    """Within [s,e] drop everything after the first silence longer than 0.8 s that follows
    voiced material (a smeared last word), and before a trailing silence."""
    i0, i1 = int(s * 100), min(int(e * 100), len(db))
    v = db[i0:i1] > quiet
    if not v.any(): return s, e
    first = np.argmax(v); i = first; run = 0; end = first
    for j in range(first, len(v)):
        if v[j]: end = j; run = 0
        else:
            run += 1
            if run > 80: break
    return s + first / 100, s + (end + 1) / 100

def cuts_between(spans, db, pad):
    """Window per line: starts/ends at the quietest frame between neighbouring lines."""
    n = len(spans); b = []
    for i in range(n - 1):
        lo, hi = spans[i][1], spans[i + 1][0]
        mid = (lo + hi) / 2
        a0, a1 = int((mid - 0.25) * 100), int((mid + 0.25) * 100)
        seg = np.convolve(db[a0:a1], np.ones(5) / 5, "same")
        b.append((a0 + int(np.argmin(seg))) / 100 if hi - lo < 0.5 else mid)
    wins = []
    for i, (s, e) in enumerate(spans):
        lo = b[i - 1] if i > 0 else s - pad
        hi = b[i] if i < n - 1 else e + pad
        wins.append((max(lo, s - pad), min(hi, e + pad)))
    return wins

def run(song):
    work = os.path.join(os.path.abspath(song), "work")
    lines = json.load(open(f"{work}/lines.json"))
    toks = [t for l in lines for t in l["toks"]]
    stem = glob.glob(f"{work}/stems/*Vocals*.wav")[0]
    y16 = sf.read(f"{work}/corpus_full/song.wav")[0]
    db = vocal_db(y16)
    quiet = np.percentile(db, 95) - 38

    ws = read_tg(f"{work}/mfa_tg/song.TextGrid")          # pass 0, produced by run_pass0()
    ws = dedupe_global(ws, toks)
    assert len(ws) == len(toks), (len(ws), len(toks))
    spans = line_spans(ws, lines)
    spans = [list(trim_to_voice(s, e, db, quiet)) for s, e in spans]

    hist = []
    for it, pad in enumerate([0.5, 0.25, 0.15]):
        wins = cuts_between(spans, db, pad)
        corpus = f"{work}/corpus_lines"; shutil.rmtree(corpus, ignore_errors=True); os.makedirs(corpus)
        for i, (l, (a, b)) in enumerate(zip(lines, wins)):
            sf.write(f"{corpus}/l{i:03d}.wav", y16[int(a * SR):int(b * SR)], SR)
            open(f"{corpus}/l{i:03d}.lab", "w").write(" ".join(l["toks"]))
        out = f"{work}/mfa_lines"
        mfa(corpus, out, work)
        res, new = [], []
        for i, (l, (a, b)) in enumerate(zip(lines, wins)):
            w = [(s + a, e + a, m) for s, e, m in read_tg(f"{out}/l{i:03d}.TextGrid")]
            if len(w) != len(l["toks"]):
                raise SystemExit(f"line {i}: {len(w)} words back, expected {len(l['toks'])}")
            res.append(w); new.append([w[0][0], w[-1][1]])
        shift = np.abs(np.array(new) - np.array(spans)).max(1)
        print(f"pass {it+1} pad={pad}: median line shift {np.median(shift):.3f}s, max {shift.max():.2f}s")
        hist.append(res); spans = new

    an = {}
    for r in csv.DictReader(open(f"{work}/mfa_lines/alignment_analysis.csv")):
        an[r["file"]] = r
    out = []
    for i, (l, w) in enumerate(zip(lines, hist[-1])):
        prev = hist[-2][i]
        drift = max(abs(a[0] - b[0]) for a, b in zip(w, prev))       # pass-to-pass stability
        r = an.get(f"l{i:03d}", {})
        out.append({"i": i, "section": l["section"], "text": l["text"], "words": l["words"],
                    "start": w[0][0], "end": w[-1][1],
                    "t0": [round(x[0], 3) for x in w], "t1": [round(x[1], 3) for x in w],
                    "ll": float(r.get("speech_log_likelihood") or 0),
                    "phone_dev": float(r.get("phone_duration_deviation") or 0),
                    "drift": round(drift, 3)})
    json.dump(out, open(f"{work}/lines_aligned.json", "w"), indent=1)
    np.save(f"{work}/vocal_db.npy", db)
    print("wrote lines_aligned.json")

if __name__ == "__main__":
    run(sys.argv[1])
