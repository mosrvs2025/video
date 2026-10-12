# Learnings log (append every project; this is the engine's memory)

## Project 1: "The Price of Free" (Oct 2026)
**Creative direction**
- Different look per song means different *grammar* (layout, motion, characters), not new colours. v1 (flat paper-cut + fixed grid pulses) was called "too 2D, not enough sync".
- What the artist wants to see: real 3D + 2D mix, "see the music" (strings, drums, bass, vocals each visible), characters that play the music in sync, a character that
  rap-lip-syncs the lyrics. Delivered in v2: Three.js cage hall (spectrum terrain, cello strings, shockwaves, particles), 2D scenes as parallax diorama layers,
  rapper (phoneme visemes), cellist, drummer (anticipates real hits), 808 box.
- **Mistake (fixed in the skill, not yet in the engine layout):** captions in the bottom 34 % were covered by platform UI. See docs/PLATFORM_SAFE_ZONES.md.
- Artist compares against what is online; "do better" means more spectacle *and* platform-correct framing. Aim above "good enough" every time.

**Sync / audio**
- Forced alignment: one whole-song MFA pass smears words across instrumental gaps. Use global pass -> per-line windows cut at the quietest point -> iterate -> hand `overrides.json` for outliers.
  Likelihood alone cannot choose a window. Always pass ABSOLUTE paths to `mfa`; keep the venv out of its conda env.
- Visuals must follow the REAL audio: kick/snare/hat onsets, bass, strings, vocal from `music.json`, not a fixed BPM grid (trap 808s are off-grid). Events carry strength.
- The audio is known offline: let characters ANTICIPATE hits (stick starts down 130 ms before the snare). Lip-sync from the alignment's phone tier (visemes), not just loudness.
- Captions are chosen by TIME, never by scene segment (segments start 0.35 s early for camera pushes and were truncating line endings).

**Rendering / ops (these cost hours)**
- Headless Chromium: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` gives WebGL2. `drawImage(webglCanvas)` into 2D is ~1 s/frame: use `readPixels` -> ImageData.
  2D contexts `{willReadFrequently:true}`. Render the 3D at 0.8x and fake bloom by shrinking + additive blend.
- Budget: 3D+crew ~1 fps per process, ~3.5 fps on 4 cores => ~40 min for a 5-min song. Do a 20 s preview first (4 pieces x 150 frames) and send it.
- Background jobs: start with `setsid nohup ... & disown`; NEVER `pkill -f <pattern>`/`pgrep -f` where the pattern appears in your own command (it kills your shell, exit 144);
  use `pkill -x name`. Killing the children of an `xargs -P` queue makes xargs launch the rest: kill the queue first. A tool call timeout kills non-setsid children.
- The final deliverable is ONE stitched file per version. Chunks are an implementation detail; do not offer them as "parts".
- Always check frames of the FINAL compressed files (a slot window, a lyric plate, the end) and durations before sending.

**Delivery size**: < 30 MiB per chat file: 720x1280, ~640 kbps video + 112 kbps AAC, `hqdn3d`. Masters (1080x1920) stay local (hundreds of MB) and are not committed.

## Backlog: how to beat what is online (do these next, in this order)
1. **Layout v3 (blocking):** full-bleed 3D, captions + faces inside the safe box, bottom third = ambience. Then `safezone_check.py` must pass.
2. **Cutdowns:** auto-generate a 30-60 s vertical short (hook + best chorus + 1 verse) with its own captions; per-platform export presets.
3. **Kinetic lyric typography:** word-by-word pops with outline, key-word scale/colour hits on the real vocal onset, occasional 3D text in the world (extruded letters) in the safe zone.
4. **Hook + pacing:** 3 s cold open, a "drop" moment synced to the first big kick, camera cuts (not only moves) on bar lines/section changes, speed ramps on fills.
5. **Higher fidelity:** native 1080p 3D (needs a GPU render box), real-time GL instead of SwiftShader, motion blur, proper bloom, colour grade, film grain tuned for compression.
6. **Characters v2:** more expressive faces per section, crowd/background dancers on the bass, the rapper turning to camera on key words, lip-sync with jaw/teeth detail, per-song costume/instrument swap.
7. **Per-scene 3D props** instead of 2D layers for the hero object (extruded shapes, lit/shadowed).
8. **Thumbnail/cover frame** generator and a looped 10 s teaser.
9. Ask for screenshots of Reels/TikTok to calibrate `layout.json`.
