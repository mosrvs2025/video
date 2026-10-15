#!/usr/bin/env python3
"""Chunk-cached renderer.
  python3 tools/render_chunks.py                 render any missing 150-frame chunks, then concat -> out/silent.mp4
  python3 tools/render_chunks.py --redo 600-900  invalidate chunks touching those frames, re-render only them
  python3 tools/render_chunks.py --all           wipe the cache and render everything
  python3 tools/render_chunks.py --upto 450      (testing) only render the first N frames
Chunks live in chunks/. A scene fix = redo only its frame range instead of the whole film."""
import json, os, subprocess, sys, glob
HS='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'
CH=150
total=json.load(open('src/total.json'))['frames']
args=sys.argv[1:]
os.makedirs('chunks',exist_ok=True)
if '--all' in args:
    for f in glob.glob('chunks/*.mp4'): os.remove(f)
if '--upto' in args: total=min(total,int(args[args.index('--upto')+1]))
if '--redo' in args:
    a,b=map(int,args[args.index('--redo')+1].split('-'))
    for f in glob.glob('chunks/*.mp4'):
        i=int(os.path.basename(f)[:4]); s,e=i*CH,min(total,(i+1)*CH)-1
        if not (e<a or s>b): os.remove(f)
chunks=[(i,i*CH,min(total,(i+1)*CH)-1) for i in range((total+CH-1)//CH)]
props=json.dumps({'lite':False,'bloom':True,'grain':True})
for i,s,e in chunks:
    out=f'chunks/{i:04d}.mp4'
    if os.path.exists(out): continue
    print(f'render chunk {i} frames {s}-{e}',flush=True)
    subprocess.run(['npx','remotion','render','src/index.ts','Main',out,'--muted',f'--frames={s}-{e}','--concurrency=4',f'--props={props}',f'--browser-executable={HS}','--log=error'],check=True)
with open('chunks/list.txt','w') as f:
    for i,s,e in chunks: f.write(f"file '{os.path.abspath(f'chunks/{i:04d}.mp4')}'\n")
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','chunks/list.txt','-c','copy','out/silent.mp4'],check=True)
print('done ->','out/silent.mp4')
