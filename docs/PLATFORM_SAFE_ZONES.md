# Platform safe zones (vertical video for Shorts / Reels / TikTok)

**Why this exists:** the first two versions of "The Price of Free" put the lyrics in the bottom third. On YouTube Shorts that area is covered by
the channel row, title/description and "Promote / Analytics" chips, and the right-hand column (like / comments / save / share / remix) covers the
right edge. Mo's screenshot (2026-10-11) showed the lyric text under the channel name. Never repeat this.

## Measured (one real screenshot: YouTube Shorts, Android)
Fractions of the video frame, x from left, y from top:
| UI | where |
|---|---|
| Top chips ("Subscriptions", "Live") + header | y < 5 % |
| Right button rail (like, comments, save, share, remix) | x > 88 %, y from 55 % down |
| Promote chip, channel row, description, visibility | y from 79 % down |
Data in `engine/layout.json` -> `measured`. It is ONE phone/app. Other phones and apps differ (Reels and TikTok bottom UI is taller).

## Contract (what every video must satisfy; stricter than the measurement)
| content | allowed box (fraction of frame) |
|---|---|
| **Caption / lyric text** | y 14 %-66 %, x 6 %-84 % |
| **YOU windows (faces)** | y 6 %-72 %, x 5 %-86 % |
| Key visuals (characters, hero object) | y 10 %-70 %, x 4 %-90 % |
Anything else (bottom 34 %, top 14 %, right 14 %) is *ambience only*: terrain, bars, particles, EQ, glow. Nothing there may be needed to understand the song.
In design space 720x1280 the caption box is x 43-605, y 179-845.

## Gates (run them; they are cheap)
1. `python pipeline/safezone_check.py songs/<n> --every 2` -> must print `SAFE-ZONE CHECK PASSED` before any full render. It renders frames mid-line, reads the
   caption box the engine really drew (`window.__lastText`) and compares it with `engine/layout.json`.
2. `python tools/platform_mock.py <video> out.png <t1> <t2> <t3>` -> LOOK at it. Red = measured Shorts UI, amber box = contract. Every lyric word, every face
   and every slot window must be clear of red. Include a 3-line lyric frame and the busiest chorus frame.
3. If the user sends screenshots from other apps/phones, add their numbers to `layout.json -> measured` and tighten the contract.

## Layout guidance that works with the contract
- Captions at 30-60 % height, big (>= 5 % of frame height for chunk captions), bold, with a dark outline/shadow so they survive any background; no solid plate needed.
- Put the characters/diorama so their faces and instruments are inside y 14-66 %. The bottom third is the "floor": terrain, shadows, reflections, glow.
- Hook in the first 2-3 s (a strong visual + the key line), because the feed is swiped fast.
- Export 1080x1920; keep the master. Make a 30-60 s cutdown (best chorus + one verse) for Shorts/Reels/TikTok in addition to the full song (check each platform's current length limits).
