# Player site (static, no build)

Plain HTML/CSS/JS. It reads everything from `data/<song>/` and `media/<song>/`:

| file | what |
|---|---|
| `data/<song>/videos.json` | list of video versions (label, src, note). A version whose file is missing shows as "(soon)" and is disabled. |
| `data/<song>/timeline.json` | aligned lyric lines/words/chunks + confidence (from `pipeline/timeline.py`) |
| `data/<song>/slots.json` | optional: the 8 YOU slots (`n,t0,t1,section,direction,prompt`) for the Slots tab and the timeline markers |
| `media/<song>/*.mp4` | the videos |

## Deploy on Vercel
1. vercel.com/new -> import this GitHub repo.
2. **Root Directory: `web`**. Framework preset: *Other*. Leave build command and output directory empty.
3. Deploy. Every `git push` to the branch redeploys.

Or from a terminal: `cd web && npx vercel` (then `npx vercel --prod`).

## Video size
Commit only the compressed (< 30 MiB) renders. The full-quality masters are too large for a normal git repo
(GitHub rejects files > 100 MB); host those elsewhere (Vercel Blob, S3, Cloudflare R2) and put the absolute URL in `src`.

## Run locally
`python3 -m http.server 8000 -d web` then open http://localhost:8000
