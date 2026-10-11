# Timing report — price_of_free

Method: UVR-MDX-NET-Voc_FT vocal isolation -> Montreal Forced Aligner (english_us_arpa) against the exact lyrics, global pass then 3 per-line refinement passes (windows cut at the quietest point between lines). Tempo 128.00 BPM (brute-force fit; 64 BPM half-time kick confirmed in every 40 s window).

Lines: 88 — **high 62**, **medium 25**, **low 1**.
Fast lines (> 4.0 words/s) shown as 2-3 word chunks starting 70 ms before the vocal onset: 36 of 88.

## Lines that need your eye

| line | time | section | text | confidence | why |
|---|---|---|---|---|---|
| 9 | 64.4–66.0 s | Verse 1 | Got a thousand notifications, not a single rea | medium | line fit ll -64 dev 3.2 |
| 10 | 66.2–68.1 s | Verse 1 | Got a camera in my pocket teaching me to crave | medium | line fit ll -65 dev 2.5 |
| 11 | 68.2–69.8 s | Verse 1 | Everybody got a platform, everybody got a stan | medium | line fit ll -63 dev 2.7 |
| 13 | 71.6–73.2 s | Verse 1 | To examine, but they're adamant, attacking for | medium | line fit ll -65 dev 2.4 |
| 14 | 73.3–75.6 s | Verse 1 | While the algorithm calculates the damage and  | medium | line fit ll -60 dev 3.3 |
| 28 | 111.0–112.7 s | Chorus | Does that make the chains feel different? | medium | line fit ll -53 dev 3.3; very short word (<40 ms) |
| 29 | 113.0–116.7 s | Post-Chorus | Free, free — tell me what it means. | medium | line fit ll -60 dev 4.4 |
| 30 | 116.8–117.7 s | Post-Chorus | Everybody selling freedom, | medium | line fit ll -63 dev 1.9 |
| 31 | 117.9–118.8 s | Post-Chorus | Everybody buying dreams. | medium | line fit ll -64 dev 2.1 |
| 32 | 127.4–129.8 s | Verse 2 | Met a man on the corner with a cardboard const | medium | aligner smeared the first words back over the beat-switch gap; Suno caption prior ~127.8 s |
| 37 | 137.4–139.2 s | Verse 2 | Not to question who's deciding what intelligen | medium | line fit ll -63 dev 2.5; very short word (<40 ms) |
| 39 | 141.2–142.9 s | Verse 2 | But her phone congratulated her for reaching t | medium | line fit ll -63 dev 2.6 |
| 40 | 142.9–144.5 s | Verse 2 | And I laughed — till I caught myself recording | medium | line fit ll -65 dev 3.0 |
| 43 | 148.8–150.4 s | Verse 2 | Then I checked to see the numbers, and I hated | medium | line fit ll -65 dev 2.8 |
| 44 | 150.6–152.3 s | Verse 2 | See, I thought I was the rebel, I was differen | medium | very short word (<40 ms) |
| 47 | 156.0–157.6 s | Verse 2 | And the louder that I shouted, man, the higher | medium | very short word (<40 ms) |
| 58 | 180.4–182.1 s | Bridge | I blamed the politicians. | medium | line fit ll -48 dev 3.4 |
| 60 | 183.9–185.5 s | Bridge | I blamed the talking heads | medium | line fit ll -49 dev 3.3 |
| 61 | 185.6–187.5 s | Bridge | And everybody sitting in their chairs. | medium | line fit ll -51 dev 3.3 |
| 64 | 191.6–192.9 s | Bridge | Every time I shared a headline | medium | line moved 0.16s between passes |
| 66 | 195.6–198.4 s | Bridge | I was turning every gear | medium | line fit ll -54 dev 3.7 |
| 68 | 209.5–212.7 s | Verse 3 | So I put the phone down, heard the city breath | medium | first Verse 3 line sat in the bridge tail at 201 s (poor fit); voice resumes at 209.5 s after the beat-switch silence |
| 78 | 237.7–239.3 s | Verse 3 | Not a savior in a suit, not another perfect pl | medium | line fit ll -64 dev 2.0 |
| 83 | 247.4–248.9 s | Final Chorus | To decide what's real to me. | medium | line fit ll -65 dev 1.7 |
| 84 | 249.2–251.2 s | Final Chorus | Got the whole world in my hand, | medium | line fit ll -59 dev 3.4 |
| 87 | 255.2–256.6 s | Final Chorus | I can still refuse to need it. | low | poor acoustic fit (ll -67) |

## Honest caveats

- Alignment is **not Demucs**: Demucs weights (dl.fbaipublicfiles.com) and Whisper/WhisperX weights (HuggingFace, OpenAI CDN) were unreachable from this sandbox, so vocals were isolated with UVR-MDX-NET-Voc_FT (GitHub release) and aligned with MFA (GitHub release models). Re-run on your machine with Demucs + WhisperX if you can.
- MFA has no model of rapping: word *boundaries* inside fast bars can be off by 30–80 ms; line starts are the most reliable.
- Beat tracking is a brute-force fit (madmom does not build on Python 3.13; beat_this weights unreachable), not a learned tracker. It assumes a constant 128 BPM grid.
- Lines marked *hand-set window* were fixed with a window I chose (see overrides.json): the aligner smeared them over instrumental gaps.
- Suno caption times from the first attempt were used only as a weak sanity check and to place the window for line 32.
