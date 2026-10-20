# Video Studio

Drop in videos (vlogs, talking clips, travel, **music videos**, anything) → automatic analysis → auto-drafted edit → animated SVG / React / Three.js overlays → rendered MP4 with sound design.

```
./setup.sh                                   # once per machine/session: venv, npm, speech models (~700 MB from GitHub)
.venv/bin/python studio.py new trip a.mp4 b.mp4 c.mp4
.venv/bin/python studio.py make trip --draft # analyze → plan → audio → fast half-res preview (minutes)
.venv/bin/python studio.py review trip       # timeline sheet + director.json scaffold
  (edit projects/trip/director.json — titles, overlays, extra segments)
.venv/bin/python studio.py plan trip && .venv/bin/python studio.py audio trip
.venv/bin/python studio.py make trip         # full-quality, chunk-cached render + mix
.venv/bin/python studio.py redo trip 600-900 # re-render only a frame range after a fix
.venv/bin/python studio.py still trip 120 480  # stills + sheet for quick visual QA
```

## What happens automatically
| stage | what it does |
|---|---|
| analyze | per clip: speech (Silero VAD + Whisper, phrase + word timing), beats/tempo, music-vs-speech detection, scene cuts, motion/sharpness/faces, accent colour, highlight score, contact sheets |
| tracks | face detection → CSRT trackers (frame-accurate boxes) |
| plan | picks best moments (speech phrases + visual peaks) per clip within the target length, orders them, assigns transitions (whip/zoom/flash/wave), writes captions with keyword highlights, chapters, title, end card, bursts on exclamations; **music mode** keeps the song continuous, labels INTRO/BUILD/DROP, adds a 3D audio-reactive ring + bar-flashes on downbeats |
| audio | per-clip loudness-matched audio cut with crossfades, slow-mo via atempo, spectrum for the visualizer |
| sfx | every overlay type and transition gets a synthesized cue at the right time |
| render | Remotion (React). Landscape sources use a blur-fit layout in the 9:16 frame. Draft = half-res, lite effects; final = 150-frame cached chunks |

## The plan is data: `projects/<name>/edit.json`
Segments are `{clip, in, out, rate, mute, trans, follow}` in **source seconds**. Overlays are keyed by `clip` + **source time**, so cuts never break them.

`director.json` is where meaning goes in (names, key moments, jokes, extra overlays). It is merged on top of the auto-plan.
Overlay types: `title chapter caption burst pin brackets meter alert lowerthird ticker scoreboard confetti flash text replay eq viz3d leak`.
Coordinates `x,y` for `burst/confetti/text/alert` are screen fractions; for `pin/brackets` they are **source-frame fractions** (or give `track: "A:3"` to follow an auto-track). `rate<1` on a segment gives slow-mo with letterbox bars.

## Review workflow (inspired by Imaginative-Prompting/wip)
- `studio.py version <name> "note"` snapshots the cut as `versions/vN/` (edit, director, story + `version.json` with chapters and caption lines) and keeps `out/vN.mp4`. **Never overwrite a prior attempt**; iterate by making v2, v3.
- `studio.py frameref <name> <sec>` prints an exact, copy-pasteable reference for feedback: project, version, output frame (0-based), fps, and the **source clip + source time**. Use it when asking for or giving fixes ("v3 frame 3015 = surf clip 151.15s").
- `studio.py wip <name>` exports `wip-workspace/` (a WIP-app workspace: current cut with chapters + caption lines, one entry per version). Open it with the WIP app: `git clone https://github.com/Imaginative-Prompting/wip && cd wip && npm ci && node bin/wip.mjs serve --config <studio>/wip-workspace/wip.json`. Validated with `wip validate`.
- Status is always **needs human review**: a successful render never means approved.
- Privacy: captions auto-scrub emails/phone numbers/long numbers (+ `projects/<name>/privacy.json` `{"replacements":[{"pattern":"...","replacement":"..."}]}`); `studio.py privacy <name>` lists risky transcript moments. Text rules cannot see pixels: still review screen recordings visually and use `redact`.

## Generative music video (`studio.py mv`)
For a song with no useful footage: write `projects/<name>/story.json` (sections + mood 0..1 for the colour arc, sung `lines` with t0/t1, a `chat` timeline, `narr`, `motif`, `subliminal`, `temp`...), then `mv build` → `mv still <name> <sec...>` (look!) → `mv render` (chunked, ~2.5 min per 5 s of video on 4 cores) → `mv mix`. Beat grid, spectrum and word reveals are computed from the audio. Composition: `src/mv/MV.tsx` (React + SVG + three.js).

## Light style (`"light": true` in project.json)
For talky/screen-recording content where the footage should carry itself: no bursts/meters/title cards/camera push, hard cuts, a top timeline with chapter dots, a small chapter banner, and clean phrase captions (sentence case, speaker colour: Tilly pink / "ME" white). `director.json`: `"cuts": [{"clip":"A","in":..,"out":..}]` (auto-snapped to speech pauses), `"tilly": [[a,b],...]` speaker ranges (pitch alone is unreliable when the user is excited), `"fixes"` for ASR errors. `pipeline/retranscribe.py` re-runs speech with the bigger `medium.en` model for much better captions. Aim ≤180 s for Shorts.

## Privacy redaction
`director.json` → `"redact": [{"clip":"<stem>","a":8.1,"b":13.3,"x":0,"y":0.285,"w":1,"h":0.55}]` bakes a blur **into the clip pixels** (`public/redacted/`) before anything renders, so the original text can't appear in any frame, preview or polaroid. Add `{"type":"privacy",...}` overlays for the "PRIVATE · blurred" tag. Always verify by viewing frames of the redacted clip across the window edges. Originals are never modified. Tall/portrait sources (screen recordings) fill the 9:16 frame via cover; `"focus": {"<stem>": 0.4}` picks which vertical part is kept. `"fixes"` corrects ASR mistakes in captions; `"chapters"` replaces auto chapters.

## Compression & what to commit
`studio.py make` writes `out/final.mp4` (full quality, big), `out/preview.mp4` (H.264 ≤24 MB, sendable anywhere) and `out/archive.mp4` (AV1, ≈4.5 MB/min).
`studio.py compress <file> --preset share|small|tiny [--target-mb N]` compresses any video and prints size + SSIM vs the original.
Measured on a 51 s, 98.7 MB render: share 15.9 MB (SSIM .979) · small/HEVC 8.4 MB (.967) · tiny/AV1 6.9 MB (.974) · tiny @4 MB (.956) · tiny @2.5 MB (.936).
**Git rule:** never commit media. Copy `archive.mp4` to `previews/<name>.mp4` (the only whitelisted videos). Source clips, wavs and renders stay local (see .gitignore).

## Speed notes (4 cores)
Draft ≈ 1–2 min per minute of video. Final ≈ 10 min per minute (bloom filter dominates; it runs the light path except on 6-frame transitions). Fix a scene with `redo`.

## Limits (be honest)
- Output is 9:16 (1080×1920); landscape input is blur-fitted, not re-framed.
- Names / jokes / what-things-mean come from `director.json` (an AI or a human reading the contact sheets), not from the pipeline.
- Speech is English (Whisper small.en); loud music hurts accuracy. Auto face tracks are opt-in (`"auto_brackets": true` in project.json) because Haar detection has false positives.
- Needs network only for the one-time model/pip downloads (GitHub releases + PyPI + npm).
