# The AI That Nobody Can Find

A cinematic speculative threat-model explainer (5:08, 1920×1080, 30 fps) and a 57-second vertical Short, built entirely in code: Remotion + React + TypeScript for the timeline, three.js / React Three Fiber for every 3-D scene (including a 120,000-point GPU shader for Act 4), locally synthesized narration, and an original score generated with numpy.

## Deliverables (`output/`)

| File | What it is |
|---|---|
| `the-ai-nobody-can-find.mp4` | Finished film: H.264 High, 1920×1080, 30 fps, AAC 256 kb/s 48 kHz, −14 LUFS integrated, −1 dBTP |
| `the-ai-nobody-can-find-short.mp4` | Vertical Short: 1080×1920, 57.5 s, recomposed scenes and burned-in captions |
| `captions.srt` / `captions-short.srt` | Subtitles, phrase-synchronized |
| `narration.wav` | Processed narration only (48 kHz, −16 LUFS) |
| `stems/music-and-sfx.wav`, `stems/music-only.wav`, `stems/sfx-only.wav` | Score and sound-design stems (no voice) |
| `thumbnail.png` | 1280×720 YouTube thumbnail |
| `youtube-metadata.md` | Five titles, description, chapters, sources, pinned comment |

Video source: `source/` (an editable Remotion project). Design documents: `source/docs/storyboard.md` (timecoded storyboard and design system) and `source/docs/accuracy-review.md` (claim-by-claim source and qualification table).

## How it is made

```
data/script.json ─► scripts/tts.py ─► data/lines/*.wav, data/narration_raw.wav, src/timeline.json
                    scripts/align.py ─► src/cues.json  (phrase + word times from the audio's own pauses)
                    scripts/earth.py ─► src/earth.json (Natural Earth land + city lights)
src/timeline.json + cues.json ─► scripts/music.py ─► data/music.wav, data/sfx.wav (original score, keyed to the same cues)
                                 scripts/mix.py   ─► data/mix.wav (voice EQ/compression, ducking, two-pass loudnorm) + output stems
src/ (Remotion) ─► scripts/render.py ─► chunked silent render ─► scripts/finalize.py ─► output/*.mp4
                    scripts/captions.py ─► output/captions.srt
```

Every visual event is keyed to a spoken phrase (`ph('r1', 2)` = the third phrase of line r1). Editing the script and re-running `tts.py → align.py → music.py → mix.py` keeps picture, music and captions in sync automatically.

## Setup

Requirements: Node 18+, ffmpeg, Python 3.10+ with `numpy`, `pillow` and `sherpa-onnx`, and a Chromium build (Remotion downloads one, or set `BROWSER=/path/to/chrome-headless-shell`).

```sh
cd source
npm install                      # remotion 4.0.235, three 0.160, @react-three/fiber 8
pip install numpy pillow sherpa-onnx
# narration model (Kokoro v0.19, Apache-2.0), about 330 MB:
mkdir -p ~/.cache/studio/tts && cd ~/.cache/studio/tts && \
  curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-en-v0_19.tar.bz2 && tar xjf kokoro-en-v0_19.tar.bz2 && cd -
```

## Preview

```sh
npx remotion studio src/index.ts         # interactive preview: compositions Film, Short, Thumb
python3 scripts/stills.py Film /tmp/sheet.jpg 10 60 120 180 240   # contact sheet of chosen seconds
```

## Render

```sh
python3 scripts/tts.py && python3 scripts/align.py       # only if the script changed
python3 scripts/music.py && python3 scripts/mix.py
python3 scripts/render.py Film  data/film_silent.mp4  1   # resumable: re-run to continue, delete a chunk to redo it
python3 scripts/render.py Short data/short_silent.mp4 1
python3 scripts/finalize.py film && python3 scripts/finalize.py short
python3 scripts/captions.py ../output/captions.srt
npx remotion still src/index.ts Thumb ../output/thumbnail.png --frame=0
```

3-D is rendered with `--gl=angle`. In software GL, cost scales with pixels, so every 3-D layer renders at 0.75× and is upscaled, while typography stays native 1080p. A full film render takes about 3 hours on a 4-core CPU with no GPU, and a GPU machine is much faster.

## Credits and rights

* Narration: synthetic voice "am_michael" from Kokoro-82M v0.19 (Apache-2.0), run locally through sherpa-onnx. No paid API was used.
* Music and sound effects: original, synthesized for this film (`scripts/music.py`). No samples.
* Map data: Natural Earth (public domain).
* Fonts: Inter / Inter Display (SIL OFL), FreeSerif (GPL with font exception), DejaVu Sans Mono (free license).
