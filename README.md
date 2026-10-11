# Suno music-video engine

**v2: real-time-style 3D + 2D mix.** Turns a Suno song + exact lyrics into a beat-synced lyric music video, with 8 numbered green-key **YOU** windows for your own
Seedance clips. First song: **The Price of Free** (look: *The Aviary* — a paper-cut shadow-box inside a gilded birdcage).

```
pipeline/   analysis + alignment + timeline + debug page + compose/swap/slot-sheet (Python)
engine/     per-frame canvas renderer (headless Chromium) + scene modules
songs/<n>/  lyrics.txt  scenes.json  slots.json  overrides.json  STYLE_BRIEF.md  timing_report.md  slot_sheet.html  debug/
web/        static player site (deploy to Vercel with Root Directory = web)
tools/      contact sheets, screenshots
SKILL.md    the workflow in checklist form (reuse for new songs)
```

## Seeing the music
`pipeline/music.py` splits the instrumental from the vocals and extracts kick/snare/hat onsets, bass, cello/strings level + pitch class and
the vocal level. In the video: kicks fire floor shockwaves and flash the lights, snares/hats burst particles, bass heaves the terrain and the
cage, the 5 strings vibrate when the cello plays (the note picks which string glows), the top rail is a live 64-band EQ, key lyric words
burst rose sparks. Everything is a pure function of time, so renders parallelise.

## Lyric sync (how, and how sure)
Vocals isolated (UVR-MDX-NET-Voc_FT) → Montreal Forced Aligner against the **exact lyrics**, then 3 per-line refinement passes →
`timing_report.md` lists every line with medium/low confidence and why → `songs/<n>/debug/debug.html` shows the waveform with
word boxes for eyeballing. Fast bars are shown as 2–3 word chunks that appear 70 ms before the vocal onset.
Honest caveats: not Demucs/WhisperX (weights unreachable where this was built); MFA doesn't model rapping, so word edges inside fast
bars can be off by ~30–80 ms; two lines were placed by hand; beat grid is a brute-force constant-128-BPM fit, not a learned tracker.

## Quick start (The Price of Free)
See SKILL.md §3. Rendered files land in `songs/price_of_free/render/` (gitignored, large); compressed (<30 MiB) copies go in `web/media/price_of_free/`.
