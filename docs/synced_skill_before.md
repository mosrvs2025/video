---
name: "suno-music-video"
description: "Build a beat-synced lyric music video from a Suno song (audio/video plus lyrics), with numbered green-key slots for the user's Seedance clips."
---

# Suno music video builder

Use when the user shares a Suno song (mp4/audio) and lyrics and wants a music video, optionally with places to drop in clips of themselves (Seedance).

## 0. Style brief FIRST (never reuse the last song's look)
Before any code, write a 5-line brief for THIS song: palette (3-4 colors), layout grammar (poster plates, film frames, collage, terminal, paper cut-out, etc.), motion language (how things enter/cut/move), recurring central image drawn from the lyrics, and typography. It must differ clearly from any earlier video in the session. Changing only colors and icons is NOT a new look; change the layout grammar and motion language too. Show the user the brief in one short message and continue unless they object.

## 1. Inputs and analysis
- Extract audio with ffmpeg. Check duration, BPM, and section energy map (numpy/scipy; librosa may be missing). Use a 30 fps RMS envelope for low (<150 Hz) and high (>5 kHz) bands to drive pulses.
- Beat grid: fit tempo and phase by brute force over a window; for half-time rap use every other pulse as the beat. Choose parity by kick strength.

## 2. Lyric timing (the part that fails on fast rap)
Preferred order:
1. Isolate vocals (Demucs) and run forced alignment against the exact lyrics (WhisperX/stable-ts, or Montreal Forced Aligner). Test whether model downloads work in the workspace network allowlist first.
2. If that is unavailable: OCR Suno's burned-in captions (crop caption area, 10 fps, tesseract on inverted 2x image, fuzzy-match to known lines) and cross-check with vocal onsets (HPSS, 300-3400 Hz), syllable-proportional spacing, and bars-per-line structure. Suno captions freeze or drift near section headers and in the spoken intro, so mark those lines as estimated.
- For fast rap (more than ~4 syllables/sec), never show whole lines. Reveal 2-3 word chunks timed to syllable onsets, start each chunk about 60-80 ms BEFORE the vocal onset, and keep the previous chunk on screen until the next arrives. Verify by sampling frames at word onsets against the audio.
- Always tell the user which sections were estimated.

## 3. Rendering
- 2D canvas in headless Chromium (playwright-core): render(t) per frame, JPEG via toDataURL piped to ffmpeg image2pipe. Render 2 chunks in parallel, concat, add audio.
- Keep scene art out of the lyric area (scene scaled ~0.88, clipped above the lyric zone).
- One scene per lyric line, chosen from the lyric imagery, with variants so repeated choruses do not look identical.

## 4. YOU slots for Seedance
- 8 fixed 3:4 windows (480x640) placed where the lyrics do not need the scene, 4-8 s each, spread across sections.
- Deliver three versions: keyed (pure #00ff00 window), labeled (number, time range, direction), clean (no windows).
- Publish a slot-sheet page with a copyable Seedance prompt per slot plus a shared style line, and the swap steps: clip on a track under the keyed video, chroma key green.

## 5. Delivery
- Chat file limit is 30 MiB per file. For ~5 minute videos use ~700-720 kbps with hqdn3d=3:3:6:6, libx264 veryfast, three encodes in parallel in the background (a sequential medium-preset encode times out).
- Check sample frames from the FINAL files (a slot window, a lyric plate, the end card) and duration before sending.
- Finish with a short note: what is in the files and honest timing caveats.