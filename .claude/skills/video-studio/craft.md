# Craft rules for generated video

Distilled from reading HeyGen's open-source HyperFrames skills (github.com/heygen-com/hyperframes, Apache-2.0) and the official Remotion skills (github.com/remotion-dev/skills), then checked against what we shipped. Paraphrased, not copied. Read this before planning any video that tells something over ~15 s. The tooling in those repos (HyperFrames CLI/plugin, Remotion transitions and motion-blur packages) is NOT adopted: HyperFrames renders the same way we do (headless Chrome + FFmpeg), so it does not fix 3-D render speed, and the Remotion packages need Remotion ≥ 4.0.529 while we pin 4.0.235 (a mismatched `@remotion/three` already broke a helper render once). Upgrade deliberately, with a regression render, or not at all.

## 1. Work loop

1. **The one thing**: one line, what the viewer must remember. One concrete worked example or one real piece of data travels through the whole film.
2. **Three storylines before building anything**: three *different films* (world, device, form), in words only, each with its first two seconds exactly, its beats in one line, its look in one line, its sound in one line. Recommend one with a reason; save all three as `STORYLINES.md`; the person picks (skip when they gave a script, or asked for no stops).
3. Build → **draft render** (`FilmDraft`, 15 fps) → review → fix → render the final once.
4. **Review as a harsh motion director, not the author** (section 5), then write `REVIEW.md`.

## 2. Motion law

- **Vector law**: how a scene exits decides how the next enters: same axis, same direction, matched speed, and the cut lands mid-motion on both sides. A scene that settles to rest before the cut, or starts from rest after it, is a dead beat. On Z the direction is the *sign* of the scale change (growing = push, shrinking = pull); a receding exit answered by a grow-from-small entry is the most common violation.
- **The current**: pick one dominant direction per film (default left) and use it for ordinary seams. Other vectors are reserved and mean something: up = a conclusion rises; Z forward = deeper into the same thought; Z backward (inverse zoom) = an arrival, something bigger lands; scale-burst = leaving a world. Never run consecutive seams in opposing directions.
- **Carriers**: the strongest seams hand a concrete object across the cut at matched position and velocity (a cursor, a card that docks into the next layout, a shape that becomes the next scene). Worlds never crossfade into each other.
- **Cut-the-curve recipe**: partial travel (~12% of frame), exit `power4.in` + entry `power4.out` over the same distance and duration, exit fade finishes at ~25–30% of travel, entry ignites at ~0.35 opacity mid-path, total ≈ 0.6 s. Blur ≤ 10 px on text, 18–20 px on full-frame surfaces. Keep the stage ground opaque so a mid-cut dip never flashes white.
- **Transitions with a cause**: use 3–5 kinds per film, each triggered by something on screen (zoom through a button, object grows into the world, morph, carry across, colour flood, whip, iris from a click, dip-cut, blur-swap). At most a third of seams are hard cuts.
- **No idle wobble**: breathing, floating and pulsing loops standing in for motion are banned. Test: pause at any second; something meaningful must be mid-flight (a reveal landing, the camera travelling, the UI doing what the narration says). If a scene finishes entering with seconds left, add story, not wobble. Routes that keep a scene alive: staged reveals on narration beats, a camera with intent (wide → travel → arrive), sequenced UI life, elements acting out a beat.
- **Causal motion**: each move launched by the last; effects start on the causing frame; heavier things rebound slower.
- **Stillness before the climax**: a 0.3–0.75 s pause between the action and its result.
- **Timing intents**: a single entry ≤ ~0.8 s; exit ≈ 75% of entry; total stagger ≤ 0.5 s; no bounce/elastic easing.
- **Defaults that look generated**: slow creeping scale on a title, titles that keep sliding after landing, everything moving at once on one curve, the same whoosh on every cut.
- **A move that must land on a music hit starts 40–190 ms early**; a reaction starts 0–45 ms after; the hit itself is a hard set, not an eased tween.

## 3. Words and captions

- Titles: ≤ 6 words a line, one line at a time, no trailing periods (explainers may run to ~10). A line holds ≈ 0.3 s per word + 0.5 s; the last line ≥ 2 s. About 19 spoken words per scene when narrated; reveal each part when the voice names it.
- **Text floor: 2.6% of the frame's short side** (28 px at 1080 short side). Anything smaller is unreadable on a phone. Content stays inside the 90% action-safe box, key text inside 80% title-safe.
- **Captions are an overlay, never a reserved band**: centre the composition on true vertical centre; the caption line sits over the film. Model: **drop** (filler, not shown) / **rail** (default: verbatim lower-third, in front) / **embed** (a promoted peak word placed *behind* the subject, scarce: ≤ 1 per beat, never two co-visible, spaced ≥ a beat apart). Embedding every word is the common mistake.
- Labels sit on the part they name with a leader line and appear with it. No legends, no bullet slides. One diagram that *grows* one part per beat, never a finished diagram dropped on screen.
- Facts stay apart from creative choices; every on-screen claim traces to a source; an example number is marked illustrative; what the source does not say stays unsaid.

## 4. Sound

- A film over ~15 s gets a music bed and sounds on its visible actions unless silence was requested. Each storyline states its sound in one line (the bed's feel and tempo, the one moment the music changes, which actions get effects).
- **No synthesised tones, chimes or dings** (this is what the "bells" complaint was). Effects are few and exact, each with a cause on screen: click = real click; whoosh = a cut or a fast card; soft tick = text arriving; pop = a badge or number landing; riser-into-impact = the payoff, once.
- **Peak lands one frame after its picture** (light before sound). Check where a file actually peaks; most peak after their start.
- Rotate 2–3 takes of any repeated sound.
- **Low end disappears on phones**: a bed with most energy under ~150 Hz plays as nothing on a phone speaker. Keep audible content above 150 Hz and check the spectrum, not just LUFS.
- Voice leads: music ~0.14 under it; effects 3–6 dB over the bed; true peak ≤ −1 dBTP; ≈ −16…−14 LUFS for social. Say plainly that sound was measured, not heard.
- Narrated: the voice is the clock (text lands on its word). Music-only: the music is the clock; trust beat times only on rhythmic stretches (calm music produces an invented metronome, often at double tempo).

## 5. Review (before any final render)

1. Measure: dead stretches (> 3 s with nothing changing unless deliberate), lines on screen too briefly to read, text under the floor, an empty or black first frame (frame 0 is the thumbnail on social players), a film with no sound.
2. Look: contact sheets of each scene start and middle, a strip across every cut (−0.2 s … +0.2 s), the beat frames at **phone width (360 px)**.
3. Describe each beat frame in one sentence as a stranger would, naming every object; an object you would have to explain is a P0. With the words covered, the pictures alone should still tell the story.
4. Questions per sheet: does it read as what it is? does the subject separate from the ground? framing, crops, collisions at a seam? timing as a first-time viewer? any "generated" tells on screen?
5. Notes, one line each: `t=4.2s · where · problem → exact change · what stays`, ranked P0 (breaks the read) / P1 (weakens the film) / P2 (polish). Fix P0s and worthwhile P1s: text first, then timing, then detail. No scores out of 10. If a sub-agent is available, give it only the storyboard and the sheets, and have it write the P0/P1 lines.
6. Write `REVIEW.md`: creative calls made and storylines not built; what was measured vs only looked at; what nobody checked; the weakest shot and what you'd change with more time; warnings kept on purpose and why.

## 6. 3-D and generative

- One hero object beats a crowd; fly into or through it rather than orbiting.
- Light with a warm key, a cool rim and a dark environment; turn the environment, not the object; contact shadow under objects. Bloom eats detail; keep it to the brightest points. Glossy metal under low light streaks white: roughness ≥ ~0.45.
- One NaN pixel can black out a frame through bloom: clamp anything that can divide by zero.
- Simulate once into arrays, then look up state at `t` so every frame is a pure function of time (already how our scenes work). Seed every random choice.
- Cutaways, exploded views and one caption line per chapter plus labels with real numbers turn a simulation into an explanation.
- Real places are shown on real imagery; vector outlines read as a diagram (fine for borders and labels). Credit imagery on screen.
- Product UI is never tilted into 3-D; only generated content tilts.

## 7. Music-video specifics

- The song is the structure: find sections first; cut density follows energy (slower in verses, a picture per strong beat in the chorus, a held image on a breakdown); the chorus returns to one home stage and escalates; the ending rhymes with the opening.
- Each lyric line gets its own picture (shots ~1.4–4 s) showing what the line *means*. Lyrics on screen only when asked, set as type, each held at least a beat.
- Tells: the same treatment for more than ~6 s; a spectrum bar or waveform as the main picture; every cut on every beat.
- A physical medium (watercolour, cut paper, riso, film grain) carries a music film further than effects.

## 8. Audit: where our own videos fall short of these rules

Checked against the shipped code and renders, so these are facts, not opinions. Fix them when a video is next touched; do not silently re-render finished videos.

| Finding | Evidence | Fix |
|---|---|---|
| **Text below the phone-readable floor** | `Label` in `ai-nobody-can-find/source/src/lib.tsx`: kicker 16 px, tag 15 px, sub 22 px, title 30 px at 1080 short side; the floor is 28 px. In the 1080×1920 Short these shrink to ~1/3 on a phone. | Raise kicker/tag/sub to ≥ 28 px (or drop the kicker); fewer, larger labels. P0 for the Short. |
| **Crossfades between worlds** | `Film.tsx` joins scenes with opacity fades (0.6–0.8 s) and dips to black. | Velocity-matched cause-driven cuts (section 2); keep dips only for deliberate beats (title, blackout). |
| **Idle loops** | continuously rotating process glyph and fragment forms (S2), camera sway and phone bob in the music videos, pulsing glows. | Replace with staged reveals / camera-with-intent; keep only physically motivated rotation (a planet, a galaxy). |
| **Music and effects are almost all low end** | Measured on the v2 stems: music 95.1% of energy < 150 Hz, 0.0% > 1 kHz; effects 98.6% < 150 Hz. On a phone speaker the film would play as voice only. (Loudness was fine: −14 LUFS.) | Rebuild pads/effects with harmonics (saw/triangle through a gentle low-pass, soft noise bands) so a real share sits 150 Hz–4 kHz; `mix.py` now prints the band split, aim for ≥ 25% of music energy above 150 Hz; also align hits one frame after picture. |
| **No storylines step, no REVIEW.md, no 360 px sheet** | we went from brief to build. | Follow section 1 and 5 next time; write `REVIEW.md` per project. |
| **Frame 0 of the Short is a dark table** | by brief (the film opens in darkness), but Shorts autoplay on frame 0. | Open the Short on its strongest frame, e.g. the lit phone with the first line. |
