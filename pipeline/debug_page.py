#!/usr/bin/env python3
"""Sync debug page: vocal waveform + word markers + beat ticks + playable audio.
Writes <song>/debug/debug.html (+ vocals.mp3). Open in a browser; click the waveform to seek,
words are drawn as boxes coloured by confidence (green high / amber medium / red low),
chunk onsets (the moment a chunk appears, 70 ms before the vocal) are the blue ticks.
Usage: debug_page.py <song_dir>
"""
import json, os, sys, subprocess, glob
import numpy as np, soundfile as sf

def run(song):
    song = os.path.abspath(song); work = f"{song}/work"; out = f"{song}/debug"; os.makedirs(out, exist_ok=True)
    stem = glob.glob(f"{work}/stems/*Vocals*.wav")[0]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", stem, "-b:a", "96k", f"{out}/vocals.mp3"], check=True)
    y = sf.read(f"{work}/corpus_full/song.wav")[0]
    pk = 200                                           # 200 peaks / s
    n = len(y) // (16000 // pk)
    peaks = np.abs(y[:n * (16000 // pk)]).reshape(n, -1).max(1)
    peaks = (peaks / peaks.max()).round(3).tolist()
    T = json.load(open(f"{work}/timeline.json")); B = json.load(open(f"{work}/beats.json"))
    data = {"peaks": peaks, "pk": pk, "dur": T["dur"], "beats": B["beats"], "half": B["half_parity"],
            "lines": [{"i": l["i"], "text": l["text"], "conf": l["conf"], "mode": l["mode"], "words": l["words"],
                       "chunks": [c["t"] for c in l["chunks"]]} for l in T["lines"]]}
    html = open(os.path.join(os.path.dirname(__file__), "debug_template.html")).read().replace("/*DATA*/null", json.dumps(data))
    open(f"{out}/debug.html", "w").write(html)
    print("wrote", f"{out}/debug.html")

if __name__ == "__main__":
    run(sys.argv[1])
