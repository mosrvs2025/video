# Seeking a Friend for the End of the World — Remotion blueprint film

A Remotion project that turns the narrative-architecture JSON into an animated
"blueprint cut" (about 4 minutes, 1920x1080, 30 fps).

- `src/data.ts` – the blueprint (acts, beats, phases, characters). Edit this to change the film.
- `src/motifs.tsx` – one animated SVG scene per beat (shuttle, office, party, riot, road, jail, bunker, plane, TV, bed, white-out…).
- `src/Feature.tsx` – timeline: title, logline, collapse phases, characters, 4 acts / 15 beats, closing.
- Durations per scene type are in `DUR` at the top of `Feature.tsx`.

```
npm install
npm run studio      # live preview
npm run render      # → out/feature.mp4
```

Note: this is a stylized motion-graphics adaptation of the blueprint, not the 101-minute feature.
