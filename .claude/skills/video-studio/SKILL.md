---
name: video-studio
description: Turn uploaded videos (vlogs, trips, talking clips, music videos) into a finished, animated 9:16 edit with auto-cut, captions, SVG/React/Three.js overlays, tracking and sound design using the studio/ pipeline in this repo. Use whenever the user uploads video(s) and wants an edit, reel, highlight cut, music-video visualizer, or "make it look professional".
---

# Video Studio workflow (studio/ in this repo)

1. **Setup (once per session):** `cd studio && ./setup.sh` — creates `.venv`, installs npm deps, downloads speech models from GitHub releases (HuggingFace is blocked in the sandbox; only PyPI/npm/GitHub work). Remotion needs `chromium_headless_shell` (auto-detected under /opt/pw-browsers), NOT full Chrome.
2. **Create:** `.venv/bin/python studio.py new <name> <video files>` then edit `projects/<name>/project.json` (title, subtitle, `order` of clip stems, `target` [min,max] seconds incl. 3s end card, `style` sunny|neon|noir, `mode` auto|story|music, `auto_brackets`).
3. **Draft:** `studio.py make <name> --draft` (analysis + plan + audio + half-res render). Then `studio.py review <name>`.
4. **Understand the footage (this is your job — the "AI context"):** read `projects/<name>/report.md` (transcripts, kinds), LOOK at `analysis/<clip>/sheet_*.jpg` (2 fps, timestamped) and `out/review.jpg`. Work out who/what/where, funny/key moments, and fix ASR mishearings (e.g. "Our knees" → "RVs") by overriding captions.
5. **Direct:** write `projects/<name>/director.json`: `titles`/`subs` (chapter names per clip stem), `overlays` (raw overlay dicts, keyed by clip id A,B,C… in project order and SOURCE time), `append_segs` (e.g. a slow-mo hero shot `{"clip":"gull","in":83.4,"out":85,"rate":0.5,"mute":true}`), `skip`, `end` (footer/polaroids). Overlay types: title chapter caption burst pin brackets meter alert lowerthird ticker scoreboard confetti flash text replay eq viz3d leak (see README). Use tracked subjects (`track:"A:3"` or segment `follow`) for brackets; OpenCV CSRT tracking of a specific person/animal can be added by hand (see git history: markTrack/gullTrack) and passed as a `tracks` entry.
6. **Re-plan + check:** `studio.py plan <name> && studio.py audio <name> && studio.py still <name> <frames…>` and view `out/stills/sheet.jpg`. Keep edit total (cut + 3s) within the user's target.
7. **Final:** `studio.py make <name>` (chunk-cached, ~10 min per minute of video; run it in the background and poll `projects/<name>/render.log`) → `out/final.mp4` + `out/preview.mp4` (720p). Fix scenes with `studio.py redo <name> A-B`.
8. **Deliver:** SendUserFile the preview (<30 MB limit); commit the full file to the branch (GitHub limit 100 MB). Tell the user what you assumed (names, captions you were unsure of) and what the cut dropped.

Gotchas: never `pkill -f` with a pattern that matches your own bash command; use a unique process id. Don't claim you watched the video — you inspected stills. Keep captions honest (don't invent quotes); profanity: leave out of on-screen captions.
