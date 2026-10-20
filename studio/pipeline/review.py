"""Review workflow (ideas borrowed from Imaginative-Prompting/wip):
  version   <name> [note]   snapshot the current cut as versions/vN/ (never overwrites earlier attempts) + out/vN.mp4
  frameref  <name> <sec>    exact reference for feedback: project, version, output frame (0-based), fps, and the source clip/time
  wip       [name...]       export a WIP-app workspace (wip-workspace/) with current cut, chapters, caption lines and honest review notes
  privacy   <name>          scan transcripts for emails/phones/long numbers/addresses and list timestamps to review visually
Nothing here marks work as approved: status is always 'needs human review'."""
import datetime, glob, json, os, re, shutil, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
PATTERNS = {'email': r'[\w.+-]+@[\w-]+\.[\w.-]+', 'phone': r'(?<!\d)(?:\+?1[ -.]?)?\(?\d{3}\)?[ -.]\d{3}[ -.]\d{4}(?!\d)', 'long number': r'(?<!\d)\d{9,}(?!\d)', 'street address': r'\b\d{2,5}\s+\w+(?:\s\w+)?\s(?:st|street|ave|avenue|rd|road|blvd|drive|dr|lane|ln)\b'}

def pdir(n): return os.path.join(ROOT, 'projects', n)
def load(p, d=None): return json.load(open(p)) if os.path.exists(p) else d
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

def timeline(E):
    acc = 0.0; segs = []
    for s in E['segs']:
        r = s.get('rate', 1.0); d = round((s['out'] - s['in']) / r * FPS) / FPS; segs.append({**s, 'start': acc, 'rate': r}); acc += d
    return segs, acc
def out_time(segs, clip, ct):
    for s in segs:
        if s['clip'] == clip and s['in'] - 1e-6 <= ct <= s['out'] + 1e-6: return s['start'] + (ct - s['in']) / s['rate']
    return None
def src_of(segs, t):
    for s in segs:
        d = (s['out'] - s['in']) / s['rate']
        if s['start'] <= t < s['start'] + d: return s['clip'], s['in'] + (t - s['start']) * s['rate']
    return None, None

def cut_info(name):
    """chapters + lines + duration (output seconds) for either an edit.json project or an mv.json project"""
    p = pdir(name); E = load(os.path.join(p, 'edit.json')); M = load(os.path.join(p, 'mv.json'))
    if M:
        return {'kind': 'mv', 'duration': M['duration'], 'fps': FPS, 'chapters': [{'t': round(s['a'], 2), 'label': s['name'].title()} for s in M['sections']], 'lines': [{'t0': l['t0'], 't1': l['t1'], 'text': l['text']} for l in M['lines']], 'clips': {}}
    segs, tot = timeline(E); ch = []; ln = []
    for o in E['overlays']:
        if o['type'] == 'chapter':
            t = out_time(segs, o['clip'], o['at']); 
            if t is not None: ch.append({'t': round(t, 2), 'label': o['title'].title()})
        if o['type'] in ('cap', 'caption'):
            a = out_time(segs, o['clip'], o['a']); b = out_time(segs, o['clip'], min(o['b'], max(s['out'] for s in segs if s['clip'] == o['clip'])))
            if a is not None and b is not None and b > a: ln.append({'t0': round(a, 2), 't1': round(b, 2), 'text': re.sub(r'\*', '', o['text'])})
    ch.sort(key=lambda c: c['t']); ln.sort(key=lambda l: l['t0'])
    return {'kind': 'edit', 'duration': round(tot + E.get('endCard', 0), 2), 'fps': FPS, 'chapters': ch, 'lines': ln, 'clips': {k: v['name'] for k, v in E['clips'].items()}}

def version(name, note=''):
    p = pdir(name); vd = os.path.join(p, 'versions'); os.makedirs(vd, exist_ok=True)
    n = 1 + max([int(re.sub(r'\D', '', os.path.basename(d)) or 0) for d in glob.glob(os.path.join(vd, 'v*'))] + [0])
    d = os.path.join(vd, f'v{n}'); os.makedirs(d)
    info = cut_info(name)
    for f in ('edit.json', 'director.json', 'project.json', 'story.json', 'mv.json'):
        if os.path.exists(os.path.join(p, f)) and f != 'mv.json': shutil.copy(os.path.join(p, f), d)
    vid = os.path.join(p, 'out', 'preview.mp4'); outv = os.path.join(p, 'out', f'v{n}.mp4')
    if os.path.exists(vid): shutil.copy(vid, outv)
    meta = {'version': n, 'createdAt': now(), 'note': note, 'status': 'needs human review', **info, 'video': f'projects/{name}/out/v{n}.mp4' if os.path.exists(outv) else None}
    json.dump(meta, open(os.path.join(d, 'version.json'), 'w'), indent=1); print(f'{name}: saved v{n}', '(video out/v%d.mp4)' % n if meta['video'] else '(no preview yet)'); return meta

def frameref(name, t):
    p = pdir(name); vs = sorted(glob.glob(os.path.join(p, 'versions', 'v*')), key=lambda d: int(re.sub(r'\D', '', os.path.basename(d)))); v = os.path.basename(vs[-1]) if vs else 'unversioned'
    frame = int(round(t * FPS)); E = load(os.path.join(p, 'edit.json')); line = f'project={name} version={v} frame={frame} (0-based) fps={FPS} t={t:.2f}s'
    if E:
        segs, _ = timeline(E); c, ct = src_of(segs, t)
        if c: m = E['clips'][c]; line += f' | source clip={m["name"]} t={ct:.2f}s (src frame {int(round(ct * m["fps"]))} @ {m["fps"]:.0f}fps)'
    print(line); return line

def wip_export(names=None):
    ws = os.path.join(ROOT, 'wip-workspace'); os.makedirs(ws, exist_ok=True)
    json.dump({'title': 'Video Studio', 'content': 'content', 'mounts': {'studio': '../projects'}, 'port': 7353}, open(os.path.join(ws, 'wip.json'), 'w'), indent=1)
    names = names or [os.path.basename(x) for x in sorted(glob.glob(os.path.join(ROOT, 'projects', '*'))) if glob.glob(os.path.join(x, 'versions', 'v*'))]
    for name in names:
        p = pdir(name); vs = sorted(glob.glob(os.path.join(p, 'versions', 'v*', 'version.json')), key=lambda f: int(re.sub(r'\D', '', f.split('/')[-2])))
        if not vs: print(name, 'has no versions (run: version)'); continue
        pid = re.sub(r'[^a-z0-9_-]', '-', name.lower()); cd = os.path.join(ws, 'content', pid); os.makedirs(os.path.join(cd, 'entries'), exist_ok=True)
        PJ = load(os.path.join(p, 'project.json'), {}) or {}; title = PJ.get('title') or (load(os.path.join(p, 'story.json'), {}) or {}).get('title') or name
        json.dump({'id': pid, 'title': title, 'description': 'Cuts made with Video Studio. Every version is kept; nothing here is human-approved until you say so.', 'order': 0, 'fps': FPS}, open(os.path.join(cd, 'project.json'), 'w'), indent=1)
        latest = None
        for f in vs:
            v = json.load(open(f)); n = v['version']; latest = v if v.get('video') else latest
            src = '/media/studio/' + v['video'][len('projects/'):] if v.get('video') else None
            body = (f"**Status: needs human review.** {v.get('note') or 'No note.'}\n\n- Length: {v['duration']:.1f}s at {v['fps']} fps\n- Chapters: " + (', '.join(f"{c['label']} ({c['t']:.0f}s)" for c in v['chapters']) or 'none') + f"\n- Captions/lines: {len(v['lines'])}\n\nPassing renders or checks does not mean this cut is approved.")
            e = {'id': f'v{n}', 'title': (f'v{n} — ' + (v.get('note') or title))[:120], 'summary': 'Version ' + str(n), 'tags': ['renders'], 'body': body, 'format': 'markdown', 'status': 'needs review', 'createdAt': v['createdAt'], 'updatedAt': v['createdAt'], 'order': -n, 'revision': 1,
                 'media': ([{'type': 'video', 'src': src, 'title': f'v{n}', 'fps': v['fps']}] if src else [])}
            json.dump(e, open(os.path.join(cd, 'entries', f'v{n}.json'), 'w'), indent=1)
        if latest:
            json.dump({'title': f'{title} — v{latest["version"]}', 'video': '/media/studio/' + latest['video'][len('projects/'):], 'duration': latest['duration'], 'songEnd': latest['duration'], 'version': latest['version'], 'revision': 1, 'chapters': latest['chapters'], 'lines': latest['lines']}, open(os.path.join(cd, 'current.json'), 'w'), indent=1)
        print('exported', pid, len(vs), 'version(s)')
    print('workspace ->', ws, '\nview:  cd <wip checkout> && node bin/wip.mjs serve --config', os.path.join(ws, 'wip.json'))

def privacy_scan(name):
    p = pdir(name); hits = []
    for f in glob.glob(os.path.join(p, 'analysis', '*', 'analysis.json')):
        A = load(f)
        for s in A.get('speech', []):
            for k, pat in PATTERNS.items():
                for m in re.finditer(pat, s['text'], re.I): hits.append((s['a'], k, m.group(0), os.path.basename(os.path.dirname(f))))
    if not hits: print('no emails/phones/long numbers/addresses in the transcript. NOTE: text scans cannot see pixels - still review screen recordings visually.')
    for a, k, v, st in sorted(hits): print(f'  [{st}] {a:.1f}s  {k}: {v}  -> blur/mute this moment (see redact in director.json)')
    return hits

if __name__ == '__main__':
    c = sys.argv[1]; a = sys.argv[2:]
    if c == 'version': version(a[0], ' '.join(a[1:]))
    elif c == 'frameref': frameref(a[0], float(a[1]))
    elif c == 'wip': wip_export(a or None)
    elif c == 'privacy': privacy_scan(a[0])
