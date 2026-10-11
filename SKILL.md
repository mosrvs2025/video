---
name: suno-mv-engine
description: Build a beat-synced lyric music video from a Suno song (mp4/audio + exact lyrics) with forced-aligned word timing, one scene per lyric line, and numbered 3:4 YOU slots (keyed/labeled/clean) for the artist's own Seedance clips. Use when the user shares a Suno export + lyrics and wants a lyric video, or asks to remake/re-time one.
---

# Suno music-video engine — workflow

Everything lives in this repo. A song = a folder `songs/<name>/` with `lyrics.txt`, `scenes.json`, `slots.json`, `overrides.json`.
New song = new `scenes.json` (+ new scene modules / style), **not** new plumbing.

## 0. Set up (once per machine)
```
python3 -m venv .venv && . .venv/bin/activate
pip install numpy scipy librosa soundfile textgrid audioread torch torchaudio demucs "audio-separator[cpu]" stable-ts
npm install                                  # playwright-core + @fontsource fonts
# Montreal Forced Aligner (conda env), models from GitHub releases:
micromamba create -n mfa -c conda-forge python=3.11 montreal-forced-aligner   # root: ./.mamba
songs/<name>/work/mfa_models/english_us_arpa.{dict,zip}   # github.com/MontrealCorpusTools/mfa-models releases
```
Test which model hosts are reachable FIRST (HuggingFace / Meta / OpenAI CDN were blocked in the sandbox this was built in;
GitHub releases, PyPI, npm and conda-forge worked). On an open network prefer **Demucs `htdemucs` + WhisperX/stable-ts**.
Always pass **absolute** paths to `mfa` (relative `MFA_ROOT_DIR` breaks it) and keep the venv out of its env (align.py does).

## 1. Style brief FIRST
Write `songs/<name>/STYLE_BRIEF.md` (palette, layout grammar, motion language, recurring central image, typography) and show it
to the user before building scenes. It must differ from earlier videos in *grammar*, not just colours.

## 2. Analysis + alignment (the part that fails on fast rap)
```
ffmpeg -i in.mp4 -vn -ac 2 -ar 44100 songs/<n>/work/song.wav
audio-separator song.wav --model_filename UVR-MDX-NET-Voc_FT.onnx ...  (or demucs --two-stems vocals)   -> work/stems/
python pipeline/lyrics.py  songs/<n>/lyrics.txt songs/<n>/work/lines.json
# 16 kHz mono vocals + one-utterance lab in work/corpus_full/, run `mfa align` once  -> work/mfa_tg/song.TextGrid   (pass 0)
python pipeline/align.py   songs/<n>        # per-line refinement passes (3x), cuts at quietest point between lines
python pipeline/repair.py  songs/<n>        # re-aligns lines listed in overrides.json; prints lines still flagged
python pipeline/beats.py   songs/<n>        # tempo/phase brute-force fit + 30 fps low/high band energy
python pipeline/timeline.py songs/<n>       # timeline.json + timing_report.md (confidence per line)
python pipeline/debug_page.py songs/<n>     # debug/debug.html: waveform + word markers + beat ticks + audio
```
Rules: fast lines (> 4 words/s) are shown as 2-3 word chunks starting 70 ms before the vocal; keep the previous chunk until the next
arrives. **Look at the debug page** around every line the report flags and add `overrides.json` windows
(`{"32": {"window": [126.6,129.8], "reason": "..."}}`) for lines the aligner smeared across instrumental gaps. Never trust a
single whole-song alignment; never choose windows by likelihood alone. Tell the user which lines are estimated/low confidence.

## 3. Scenes + render
- `engine/core.js` — beat helpers (`pulse`, `thump` = half-time kick), paper-cut kit (`g.paper/L/cage/person/phone/...`), bar-sweep
  transitions, caption band, stamped lyrics. `engine/scenes/<song>_*.js` register `SC.name = g => {...}`.
- `songs/<n>/scenes.json`: `{"lines": {"<i>": {"scene","v","c","keys":[key words]}}, "gaps":[{t0,t1,scene}]}` — one scene per lyric line,
  `v` = variant, `c` = chorus state (repeats are the same motif in a later state so they never look identical).
- `slots.json` = 8 slots {n,t0,t1,section,direction,prompt}; during a slot the scene switches to `SC.ambient` so nothing important sits under the window.
```
python pipeline/build_data.py songs/<n>
node engine/render.js songs/<n> --stills out/ 12 60 100      # check stills first (python tools/contact.py = contact sheets)
node engine/render.js songs/<n> --overlays songs/<n>/render/overlays
for i in 0 1 2 3; do node engine/render.js songs/<n> $((i*2167)) $(((i+1)*2167)) songs/<n>/render/chunk_$i.mp4 30 & done   # ~5 fps each
python pipeline/compose.py songs/<n>         # clean / keyed / labeled masters
pipeline/compress.sh in.mp4 out_30mb.mp4     # 720x1280, ~640 kbps -> < 30 MiB for ~5 min
python pipeline/slot_sheet.py songs/<n> songs/<n>/slot_sheet.html
python pipeline/swap.py songs/<n> clips/ final.mp4   # chroma-key swap of the artist's clips
```
Keyed/labeled = the clean master + an overlay (brass frame + pure #00ff00 or labeled panel) per slot with 0.3 s fades, so all three
are identical outside the windows.

## 4. Deliver
Check frames of the FINAL files (a slot window, a lyric plate, the end), the duration, and the file sizes (< 30 MiB for chat).
Commit only compressed renders; masters are hundreds of MB. Update `web/data/<song>/` (see web/README.md) for the Vercel player.
Finish with honest timing caveats.
