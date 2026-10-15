#!/usr/bin/env python3
"""studio.py — drop videos in, get an edited, animated video out.
  studio.py new <name> <video> [<video> ...]       create a project and copy clips in
  studio.py make <name> [--draft] [--target 45-60] run analyze -> plan -> audio -> render -> mix
  studio.py analyze|plan|audio|render|mix <name>   run a single stage
  studio.py redo <name> <frameA>-<frameB>          re-render only a frame range (chunk cache)
Outputs: projects/<name>/out/final.mp4 (+ preview.mp4), edit.json (the editable plan), director.json (your notes)."""
import json, os, shutil, subprocess, sys, glob
ROOT = os.path.dirname(os.path.abspath(__file__)); PY = os.path.join(ROOT, '.venv', 'bin', 'python')
sys.path.insert(0, os.path.join(ROOT, 'pipeline'))
HS = glob.glob('/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell')
HS = HS[0] if HS else ''

def pdir(name): return os.path.join(ROOT, 'projects', name)

def cmd_new(name, files):
    p = pdir(name); os.makedirs(os.path.join(p, 'public', 'clips'), exist_ok=True)
    for f in files: shutil.copy(f, os.path.join(p, 'public', 'clips', os.path.basename(f).replace(' ', '_')))
    if not os.path.exists(os.path.join(p, 'project.json')): json.dump({'title': name.replace('_', ' ').title(), 'target': [45, 60], 'style': 'sunny'}, open(os.path.join(p, 'project.json'), 'w'), indent=1)
    print('project', p)

def cmd_analyze(name, force=False):
    import analyze, tracks
    p = pdir(name); cd = os.path.join(p, 'public', 'clips')
    for f in sorted(os.listdir(cd)):
        stem = os.path.splitext(f)[0]; od = os.path.join(p, 'analysis', stem)
        analyze.analyze(os.path.join(cd, f), od, force=force); tracks.track_clip(os.path.join(cd, f), od, force=force)
    write_report(name)

def write_report(name):
    p = pdir(name); lines = [f'# Analysis report: {name}\n']
    for stem in sorted(os.listdir(os.path.join(p, 'analysis'))):
        a = json.load(open(os.path.join(p, 'analysis', stem, 'analysis.json'))); t = json.load(open(os.path.join(p, 'analysis', stem, 'tracks.json')))
        lines.append(f"## {stem}\n- {a['w']}x{a['h']} @ {a['fps']:.0f}fps, {a['dur']:.1f}s, kind **{a['kind']}**, tempo {a['bpm']} (strength {a.get('tempo_strength', 0)}), speech coverage {a['speech_coverage']:.0%}, cuts {len(a['cuts'])}\n- contact sheets: analysis/{stem}/sheet_*.jpg (2 fps, timestamped)\n- tracks: {[(x['id'], x['a'], x['b']) for x in t]}\n- transcript:")
        for s in a['speech']: lines.append(f"  - [{s['a']:.1f}-{s['b']:.1f}] {s['text']}")
        lines.append('')
    open(os.path.join(p, 'report.md'), 'w').write('\n'.join(lines))

def cmd_plan(name, target=None):
    import plan
    p = pdir(name); pj = os.path.join(p, 'project.json'); P = json.load(open(pj)) if os.path.exists(pj) else {}
    if target: P['target'] = target; json.dump(P, open(pj, 'w'), indent=1)
    plan.plan(p)

def cmd_audio(name):
    import audio_build, sfx
    p = pdir(name); audio_build.build(p); sfx.run(p)

def render(name, draft=False, chunks=True, frames=None):
    p = pdir(name); os.makedirs(os.path.join(p, 'out'), exist_ok=True)
    total = json.load(open(os.path.join(p, 'total.json')))['frames']
    base = ['npx', 'remotion', 'render', 'src/index.ts', 'Main', None, '--muted', '--concurrency=4', f'--props={os.path.join(p, "props.json")}', f'--public-dir={os.path.join(p, "public")}', f'--browser-executable={HS}', '--log=error']
    if draft:
        out = os.path.join(p, 'out', 'draft.mp4'); props = json.load(open(os.path.join(p, 'props.json'))); props['lite'] = True
        json.dump(props, open(os.path.join(p, 'props_draft.json'), 'w'))
        cmd = [c if c is not None else out for c in base]; cmd = [c.replace('props.json', 'props_draft.json') if c.startswith('--props') else c for c in cmd] + ['--scale=0.5']
        subprocess.run(cmd, cwd=ROOT, check=True); return out
    CH = 150; cd = os.path.join(p, 'chunks'); os.makedirs(cd, exist_ok=True)
    if frames:
        a, b = frames
        for f in glob.glob(os.path.join(cd, '*.mp4')):
            i = int(os.path.basename(f)[:4]); s, e = i * CH, min(total, (i + 1) * CH) - 1
            if not (e < a or s > b): os.remove(f)
    chunk_list = [(i, i * CH, min(total, (i + 1) * CH) - 1) for i in range((total + CH - 1) // CH)]
    for i, s, e in chunk_list:
        out = os.path.join(cd, f'{i:04d}.mp4')
        if os.path.exists(out): continue
        print(f'  render chunk {i + 1}/{len(chunk_list)} frames {s}-{e}', flush=True)
        cmd = [c if c is not None else out for c in base] + [f'--frames={s}-{e}']
        subprocess.run(cmd, cwd=ROOT, check=True)
    lst = os.path.join(cd, 'list.txt'); open(lst, 'w').write(''.join(f"file '{os.path.join(cd, f'{i:04d}.mp4')}'\n" for i, _, _ in chunk_list))
    out = os.path.join(p, 'out', 'silent.mp4'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True)
    return out

def mix(name, silent=None):
    p = pdir(name); silent = silent or os.path.join(p, 'out', 'silent.mp4'); T = json.load(open(os.path.join(p, 'total.json')))['seconds']
    final = os.path.join(p, 'out', 'final.mp4')
    music = next(iter(glob.glob(os.path.join(p, 'public', 'music.*'))), None)
    fl = f"[1:a]asplit[o][sc];[2:a]volume=0.6[s];[s][sc]sidechaincompress=threshold=0.05:ratio=3:attack=10:release=300[sd];[o][sd]amix=inputs=2:normalize=0,afade=t=out:st={T - 1.2}:d=1.2,alimiter=limit=0.95[a]"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', silent, '-i', os.path.join(p, 'audio', 'combined.wav'), '-i', os.path.join(p, 'audio', 'sfx.wav'), '-filter_complex', fl, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', final], check=True)
    prev = os.path.join(p, 'out', 'preview.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', final, '-c:v', 'libx264', '-crf', '28', '-vf', 'scale=720:-2', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', prev], check=True)
    print('final ->', final, '| preview ->', prev)

def cmd_still(name, frames):
    p = pdir(name); os.makedirs(os.path.join(p, 'out', 'stills'), exist_ok=True); outs = []
    for f in frames:
        out = os.path.join(p, 'out', 'stills', f'{f}.jpg')
        subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', 'Main', out, f'--frame={f}', '--image-format=jpeg', f'--props={os.path.join(p, "props.json")}', f'--public-dir={os.path.join(p, "public")}', f'--browser-executable={HS}', '--log=error'], cwd=ROOT, check=True); outs.append(out)
    from PIL import Image
    sh_ = Image.new('RGB', (270 * len(outs), 480))
    for i, o in enumerate(outs): sh_.paste(Image.open(o).resize((270, 480)), (i * 270, 0))
    sh_.save(os.path.join(p, 'out', 'stills', 'sheet.jpg')); print('sheet ->', os.path.join(p, 'out', 'stills', 'sheet.jpg'))

def cmd_review(name):
    """timeline sheet of the draft (1 frame / 3 s) + director.json scaffold listing the planned segments so overlays can be added by source time"""
    p = pdir(name); src = os.path.join(p, 'out', 'draft.mp4')
    if not os.path.exists(src): src = os.path.join(p, 'out', 'final.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', 'fps=1/3,scale=216:-1,tile=10x3', '-frames:v', '1', os.path.join(p, 'out', 'review.jpg')], check=True)
    E = json.load(open(os.path.join(p, 'edit.json'))); dj = os.path.join(p, 'director.json')
    if not os.path.exists(dj):
        json.dump({'_help': 'titles: stem->chapter title. subs: stem->subtitle. overlays: raw overlay dicts keyed by clip id + SOURCE time (see README). skip: [{clip:stem,a,b}]. force_segs replaces the plan.',
                   'titles': {c['name']: f"PART {i + 1:02d}" for i, c in enumerate(E['clips'].values())}, 'subs': {}, 'overlays': [], 'skip': [], 'end': {'footer': ''}}, open(dj, 'w'), indent=1)
    print('review ->', os.path.join(p, 'out', 'review.jpg'), '| clips:', {k: v['name'] for k, v in E['clips'].items()}, '| segs:', [(s['clip'], s['in'], s['out']) for s in E['segs']])

def main():
    a = sys.argv[1:]
    if not a: print(__doc__); return
    c = a[0]
    if c == 'new': cmd_new(a[1], a[2:])
    elif c == 'analyze': cmd_analyze(a[1], '--force' in a)
    elif c == 'plan': cmd_plan(a[1])
    elif c == 'audio': cmd_audio(a[1])
    elif c == 'render': render(a[1], draft='--draft' in a)
    elif c == 'mix': mix(a[1])
    elif c == 'still': cmd_still(a[1], [int(x) for x in a[2:]])
    elif c == 'review': cmd_review(a[1])
    elif c == 'redo': x, y = map(int, a[2].split('-')); render(a[1], frames=(x, y)); mix(a[1])
    elif c == 'make':
        name = a[1]; draft = '--draft' in a; tgt = None
        if '--target' in a: lo, hi = a[a.index('--target') + 1].split('-'); tgt = [float(lo), float(hi)]
        cmd_analyze(name); cmd_plan(name, tgt); cmd_audio(name)
        if draft: out = render(name, draft=True); print('draft ->', out)
        else: render(name); mix(name)
    else: print(__doc__)
if __name__ == '__main__': main()
