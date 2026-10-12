---
name: suno-mv-engine
description: Build a beat-synced lyric music video from a Suno song (mp4/audio + exact lyrics) with forced-aligned word timing, one scene per lyric line, and numbered 3:4 YOU slots (keyed/labeled/clean) for the artist's own Seedance clips. Use when the user shares a Suno export + lyrics and wants a lyric video, or asks to remake/re-time one.
---

# Suno music-video engine — workflow

## HARD RULES (read first; every one was learned the hard way, see docs/LEARNINGS.md)
1. **Platform safe zones.** Vertical video is watched under Shorts/Reels/TikTok UI. Lyrics and faces must stay inside the contract in `engine/layout.json`
   (caption y 14-66 %, x 6-84 %; YOU windows y 6-72 %). Bottom 34 %, top 14 % and right 14 % are ambience only. See docs/PLATFORM_SAFE_ZONES.md.
   **Gate:** `python pipeline/safezone_check.py songs/<n> --every 2` must PASS before a full render, and you must LOOK at
   `python tools/platform_mock.py <video> out.png t1 t2 t3` (red = real UI) before delivering. (Engine layout v2 FAILS this gate: fix with layout v3 before the next song.)
2. Never drive visuals from a fixed BPM grid: use `pipeline/music.py` onsets/envelopes. Let characters anticipate events (audio is known offline).
3. Caption text is selected by time, not by scene segment.
4. Deliver ONE stitched file per version (clean / keyed / labeled + a <30 MiB copy). Send a 20 s preview early; check frames of the FINAL files.
5. Ops: `setsid nohup ... & disown`; never `pkill -f`/`pgrep -f` with a pattern that appears in your own command; absolute paths for MFA.
6. Ambition: the artist compares against the best vertical music videos online. Don't stop at "works": run through the backlog in docs/LEARNINGS.md and
   add at least one meaningful upgrade per song. Append new lessons to docs/LEARNINGS.md at the end of every project.

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

## 2b. Music features (so the visuals follow the actual audio)
```
python pipeline/music.py songs/<n>          # work/music.json: 64 spectrum bands, kick/snare/hat onset events+envelopes, bass,
                                            # string/cello level + chroma + pitch height (harmonic part of mix - vocals), vocal level
```
`engine/audio.js` exposes stateless accessors (`AU.kick(t)`, `AU.band(k,t)`, `AU.recent('snare', t, win)`...) so any frame can render
independently (chunks render in parallel). Don't drive visuals from a fixed BPM grid; trap 808s and rolls are off-grid.

## 3. Scenes + render
- **3D world** (`engine/world.js`, Three.js r149 UMD in `engine/vendor/`): gilded cage whose 48 bars bow/glow with the spectrum, a terrain that
  scrolls the last 3 s of the spectrum, 5 vibrating cello strings (note = chroma), kick shockwave rings, snare/hat/key-word particle bursts,
  vocal halo, choreographed camera rigs per section. The 2D scene is drawn into 3 depth layers (g.L depth <.45 far, <.8 mid, else near) that
  become textured planes inside a 3D shadow-box (a real 2D+3D mix).
- Headless Chromium needs `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. Gotchas that cost hours: (1) never
  `drawImage(webglCanvas)` into a 2D canvas (≈1 s/frame in SwiftShader) — `gl.readPixels` into an ImageData (render opaque) instead;
  (2) create 2D contexts with `{willReadFrequently:true}` to keep them CPU-rasterised; (3) 3D at 0.8x resolution is plenty with the cheap bloom.
- `engine/core.js` — beat helpers (`pulse`, `thump` = half-time kick), paper-cut kit (`g.paper/L/cage/person/phone/...`), bar-sweep
  transitions, caption band, stamped lyrics. `engine/scenes/<song>_*.js` register `SC.name = g => {...}`.
- `songs/<n>/scenes.json`: `{"lines": {"<i>": {"scene","v","c","keys":[key words]}}, "gaps":[{t0,t1,scene}]}` — one scene per lyric line,
  `v` = variant, `c` = chorus state (repeats are the same motif in a later state so they never look identical).
- `slots.json` = 8 slots {n,t0,t1,section,direction,prompt}; during a slot the scene switches to `SC.ambient` so nothing important sits under the window.
```
python pipeline/build_data.py songs/<n>
node engine/render.js songs/<n> --stills out/ 12 60 100      # check stills first (python tools/contact.py = contact sheets)
node engine/render.js songs/<n> --overlays songs/<n>/render/overlays
for i in 0 1 2 3; do node engine/render.js songs/<n> $((i*2167)) $(((i+1)*2167)) songs/<n>/render/chunk_$i.mp4 30 & done   # v2 (3D): ~1-2 fps each, ~30 min total
python pipeline/compose.py songs/<n>         # clean / keyed / labeled masters
pipeline/compress.sh in.mp4 out_30mb.mp4     # 720x1280, ~640 kbps -> < 30 MiB for ~5 min
python pipeline/slot_sheet.py songs/<n> songs/<n>/slot_sheet.html
python pipeline/swap.py songs/<n> clips/ final.mp4   # chroma-key swap of the artist's clips
```
Keyed/labeled = the clean master + an overlay (brass frame + pure #00ff00 or labeled panel) per slot with 0.3 s fades, so all three
are identical outside the windows.

## 3b. Safe-zone + quality gates (before delivery)
```
python pipeline/safezone_check.py songs/<n> --every 2     # must print SAFE-ZONE CHECK PASSED
python tools/platform_mock.py final.mp4 mock.png 20 72 106 # look at it: nothing important in the red
```

## 4. Deliver
Check frames of the FINAL files (a slot window, a lyric plate, the end), the duration, and the file sizes (< 30 MiB for chat).
Commit only compressed renders; masters are hundreds of MB. Update `web/data/<song>/` (see web/README.md) for the Vercel player.
Finish with honest timing caveats.
