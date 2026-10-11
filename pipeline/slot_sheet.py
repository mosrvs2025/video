#!/usr/bin/env python3
"""HTML slot sheet: copyable Seedance prompt per YOU slot + shared style line + swap steps.  slot_sheet.py <song_dir> <out.html>"""
import json, sys, os, html
song = os.path.abspath(sys.argv[1]); out = sys.argv[2]
d = json.load(open(f"{song}/slots.json")); name = os.path.basename(song)
fmt = lambda t: f"{int(t//60)}:{t%60:04.1f}"
cards = "".join(f"""<section class="card"><header><b>YOU {s['n']}</b><span>{fmt(s['t0'])} – {fmt(s['t1'])} · {s['t1']-s['t0']:.1f} s · {html.escape(s['section'])}</span></header>
<p class="dir">{html.escape(s['direction'])}</p>
<label>Seedance prompt (includes the shared style line)</label><textarea readonly rows="7" id="p{s['n']}">{html.escape(s['prompt'])}</textarea>
<button onclick="cp('p{s['n']}',this)">Copy prompt</button>
<small>Generate 3:4 portrait, at least {s['t1']-s['t0']:.0f} s (ask for {s['t1']-s['t0']+1:.0f} s and trim). The window is 480×640 design px = 720×960 px in the 1080×1920 render.</small></section>""" for s in d["slots"])
page = f"""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YOU slots · {name}</title>
<style>:root{{--bg:#150a22;--card:#25143a;--brass:#f0b43c;--rose:#ff4f8b;--bone:#eadff6;--mute:#a58bd0;--line:#3a2656}}
body{{margin:0;background:var(--bg);color:var(--bone);font:16px/1.5 Georgia,serif}}main{{max-width:980px;margin:0 auto;padding:24px 16px 60px}}
h1{{font-style:italic;font-weight:900}}h2{{color:var(--brass);margin-top:36px}}.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:14px 0}}
.card header{{display:flex;gap:12px;flex-wrap:wrap;align-items:baseline}}.card b{{color:var(--rose);font-size:22px;font-style:italic}}.card span{{font:13px ui-monospace,monospace;color:var(--brass)}}
.dir{{margin:6px 0 10px}}label{{font:12px ui-monospace,monospace;color:var(--mute);display:block}}textarea{{width:100%;box-sizing:border-box;background:#0f0719;color:var(--bone);border:1px solid var(--line);border-radius:8px;padding:8px;font:13px/1.45 ui-monospace,monospace}}
button{{background:var(--brass);color:#1a0d00;border:0;border-radius:999px;padding:6px 14px;font-weight:700;cursor:pointer;margin-top:6px}}small{{display:block;color:var(--mute);margin-top:6px}}
ol li{{margin:6px 0}}code{{background:#0f0719;padding:1px 6px;border-radius:5px;color:var(--rose)}}</style>
<main><h1>YOU slots · {name.replace('_',' ').title()}</h1>
<p>8 fixed 3:4 windows where the lyrics don't need the scene. Make one Seedance clip per slot, then swap them in.</p>
<h2>Shared style line (already appended to every prompt)</h2><textarea readonly rows="4" id="sty">{html.escape(d['style'])}</textarea><button onclick="cp('sty',this)">Copy style line</button>
<h2>Prompts</h2>{cards}
<h2>Swap steps</h2><ol>
<li>Generate each clip as <b>3:4 portrait</b> (e.g. 1080×1440), at least the slot length. Name them <code>clip_1.mp4</code> … <code>clip_8.mp4</code>. You can skip slots: an empty slot just shows the green key over black, so use the <i>clean</i> video if you skip any.</li>
<li><b>Editor way (CapCut / Premiere / DaVinci / Final Cut):</b> put the <b>keyed</b> video on the <b>top</b> track. Put each clip on the track <b>under</b> it, starting at the slot's start time, scaled to fill a 720×960 box centred horizontally with its top at y=105 (in a 1080×1920 timeline). On the keyed video add <b>Chroma key / Color key</b> on pure green <code>#00ff00</code>, similarity ≈ 30 %, edge feather ≈ 10 %. The brass frame stays; only the green disappears.</li>
<li><b>Command-line way:</b> <code>python3 pipeline/swap.py songs/{name} clips/ out.mp4</code> does exactly the above with ffmpeg (clips named <code>clip_N.mp4</code>).</li>
<li>Check the <b>labeled</b> version first: each window shows its slot number, time range and direction, so you can see where each clip lands.</li></ol></main>
<script>function cp(id,b){{navigator.clipboard.writeText(document.getElementById(id).value);const o=b.textContent;b.textContent='Copied';setTimeout(()=>b.textContent=o,1200)}}</script></html>"""
open(out, "w").write(page); print("wrote", out)
