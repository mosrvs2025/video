"""Auto-draft an edit decision list (edit.json) from analysis. Human/AI overrides live in director.json and are merged on top.
project.json (all optional): {title, mode:'auto|story|music', target:[45,60], order:[clip stems], names:{track/clip labels}, auto_brackets:false}
director.json (optional):   {titles:{stem:'CHAPTER TITLE'}, overlays:[raw overlay dicts], force_segs:[...], skip:[{clip,a,b}], end:{title,subtitle,polaroids:[...]}}"""
import json, os, re, sys, glob
import numpy as np
try:
    from analyze import words_for as _wf, load_audio as _load_audio
    import speaker as _spk
except Exception:
    _wf = None; _load_audio = None; _spk = None

END_CARD = 3.0
SR_ = 16000
THEMES = {
    'sunny': {'accent': '#ffc933', 'accent2': '#ff5a4a', 'cool': '#19d3c5', 'ink': '#07101f', 'navy': '#0a1a33'},
    'neon':  {'accent': '#ff3df2', 'accent2': '#7a5cff', 'cool': '#27e8ff', 'ink': '#080614', 'navy': '#120a2a'},
    'noir':  {'accent': '#e9e9e9', 'accent2': '#ff3b3b', 'cool': '#9db4c8', 'ink': '#050505', 'navy': '#0e1116'},
}

PRIV_DEFAULT = [(r'[\w.+-]+@[\w-]+\.[\w.-]+', '[email]'), (r'(?<!\d)(?:\+?1[ -.]?)?\(?\d{3}\)?[ -.]\d{3}[ -.]\d{4}(?!\d)', '[phone]'), (r'(?<!\d)\d{9,}(?!\d)', '[number]')]
_PRIV_EXTRA = []
def scrub(t):
    """remove emails/phones/long numbers (+ project privacy.json replacements) from caption text"""
    for pat, rep in PRIV_DEFAULT + _PRIV_EXTRA: t = re.sub(pat, rep, t, flags=re.I)
    return t

def load(p, default):
    return json.load(open(p)) if os.path.exists(p) else default

def split_pages(words, max_chars=30):
    pages, cur = [], []
    for w in words:
        if cur and len(' '.join(x['w'] for x in cur)) + len(w['w']) + 1 > max_chars:
            pages.append(cur); cur = []
        cur.append(w)
        if re.search(r'[,.?!]$', w['w']) and len(' '.join(x['w'] for x in cur)) > 14:
            pages.append(cur); cur = []
    if cur: pages.append(cur)
    return pages

def hi_words(page_words):
    txt = [w['w'] for w in page_words]
    for w in reversed(txt):
        if w.endswith(('!', '?')): return [w.lower()]
    big = sorted(txt, key=lambda w: -len(re.sub(r'\W', '', w)))
    return [big[0].lower()] if big and len(re.sub(r'\W', '', big[0])) >= 5 else []

BURST_WORDS = {'wow': 'WOW!', 'whoa': 'WHOA!', 'woo': 'WOO!', 'yeah': 'YEAH!', 'yes': 'YES!', 'oh': None, 'dude': None, 'what': None, 'no': 'NO!'}

def candidate_windows(A):
    dur = A['dur']; sc = np.array(A['score']); out = []
    sp = A['speech']; i = 0
    merged = []
    for s in sp:
        if merged and s['a'] - merged[-1]['b'] < 1.0 and (s['b'] - merged[-1]['a']) < 10: merged[-1]['b'] = s['b']; merged[-1]['text'] += ' ' + s['text']
        else: merged.append({'a': s['a'], 'b': s['b'], 'text': s['text']})
    for m in merged:
        a, b = max(0, m['a'] - 0.25), min(dur, m['b'] + 0.35)
        if b - a < 1.0: continue
        idx = slice(int(a * 2), max(int(a * 2) + 1, int(b * 2)))
        out.append({'a': a, 'b': b, 'speech': True, 'score': float(np.mean(sc[idx])) + 0.25 + 0.08 * m['text'].count('!')})
    occupied = [(w['a'], w['b']) for w in out]
    thr = np.percentile(sc, 70) if len(sc) else 0
    peaks = [i for i in range(1, len(sc) - 1) if sc[i] >= thr and sc[i] >= sc[i - 1] and sc[i] >= sc[i + 1]]
    chosen = []
    for i in sorted(peaks, key=lambda i: -sc[i]):
        t = i / 2
        if any(abs(t - c) < 4 for c in chosen): continue
        a, b = max(0, t - 1.5), min(dur, t + 1.5)
        if any(not (b < oa or a > ob) for oa, ob in occupied): continue
        chosen.append(t); out.append({'a': a, 'b': b, 'speech': False, 'score': float(sc[i])})
        if len(chosen) >= 6: break
    return out

def light_caps(segs, inv, AN, pdir, stems, D):
    """clean phrase captions with per-word speaker (pitch) and tidy page splits"""
    out = []; audio = {}
    for sg in segs:
        st = inv[sg['clip']]
        if st not in audio and _load_audio:
            audio[st] = _load_audio(os.path.join(pdir, 'public', 'clips', [f for f in os.listdir(os.path.join(pdir, 'public', 'clips')) if os.path.splitext(f)[0] == st][0]), os.path.join(pdir, 'analysis', st, 'tmp'))
    last_spk = {}
    for sg in segs:
        st = inv[sg['clip']]; x = audio.get(st)
        for ph in AN[st]['speech']:
            if ph['b'] < sg['in'] - 0.05 or ph['a'] > sg['out'] + 0.05: continue
            ptxt = ph['text']; pw = ph['words']
            for k_, v_ in D.get('fixes', {}).items():
                if k_ in ptxt and _wf: ptxt = ptxt.replace(k_, v_); pw = _wf(ptxt, ph['a'], ph['b'])
            words = [dict(w) for w in pw]
            # speaker: explicit Tilly ranges (director) else phrase-level median pitch
            TR = D.get('tilly')
            if TR is not None:
                for w in words: m_ = (w['a'] + w['b']) / 2; w['spk'] = 'T' if any(a_ <= m_ <= b_ for a_, b_ in TR) else 'U'
            else:
                f = _spk.f0_median(x, SR_, ph['a'], ph['b']) if (x is not None and _spk) else 0.0
                for w in words: w['spk'] = 'T' if f >= D.get('pitch_split', 180) else 'U'
            words = [w for w in words if w['b'] > sg['in'] and w['a'] < sg['out']]
            if not words: continue
            # pages: split at speaker change, at punctuation once a line is long enough, and by length; merge tiny orphans
            L_ = lambda g: len(' '.join(x_['w'] for x_ in g))
            pages = []; cur = []
            for w in words:
                if cur and (w['spk'] != cur[-1]['spk'] or L_(cur) + len(w['w']) + 1 > 48 or (re.search(r'[.?!,;:]$', cur[-1]['w']) and L_(cur) >= 24)):
                    pages.append(cur); cur = []
                cur.append(w)
            if cur: pages.append(cur)
            k_ = 1
            while k_ < len(pages):
                if len(pages[k_]) <= 2 and pages[k_][0]['spk'] == pages[k_ - 1][0]['spk'] and L_(pages[k_ - 1]) + L_(pages[k_]) + 1 <= 60: pages[k_ - 1] += pages.pop(k_)
                else: k_ += 1
            for i, pg in enumerate(pages):
                a = max(pg[0]['a'] - 0.04, sg['in']); b = min(pg[-1]['b'] + 0.3, sg['out'])
                if i + 1 < len(pages): b = min(b, pages[i + 1][0]['a'] - 0.02)
                b = max(b, a + 0.8) if i + 1 == len(pages) else max(b, a + 0.5)
                first = (last_spk.get(st) != pg[0]['spk']) and i == 0
                out.append({'type': 'cap', 'clip': sg['clip'], 'a': round(a, 2), 'b': round(min(b, sg['out']), 2), 'text': scrub(' '.join(w['w'] for w in pg)), 'spk': pg[0]['spk'], 'first': bool(first)})
            last_spk[st] = pages[-1][-1]['spk']
    return out

def plan(pdir):
    P = load(os.path.join(pdir, 'project.json'), {}); D = load(os.path.join(pdir, 'director.json'), {})
    _PRIV_EXTRA.clear(); _PRIV_EXTRA.extend([(r['pattern'], r['replacement']) for r in load(os.path.join(pdir, 'privacy.json'), {}).get('replacements', [])])
    clips_dir = os.path.join(pdir, 'public', 'clips')
    stems = sorted(os.path.splitext(f)[0] for f in os.listdir(clips_dir) if f.lower().endswith(('.mp4', '.mov', '.m4v', '.webm', '.mkv')))
    if P.get('order'): stems = [s for s in P['order'] if s in stems] + [s for s in stems if s not in P['order']]
    ids = {s: chr(65 + i) for i, s in enumerate(stems)}
    AN = {s: json.load(open(os.path.join(pdir, 'analysis', s, 'analysis.json'))) for s in stems}
    TR = {s: load(os.path.join(pdir, 'analysis', s, 'tracks.json'), []) for s in stems}
    lo, hi = P.get('target', [45, 60]); budget = (lo + hi) / 2 - END_CARD
    music_bed = next((f for f in glob.glob(os.path.join(pdir, 'public', 'music.*'))), None)
    mode = P.get('mode', 'auto')
    if mode == 'auto':
        if music_bed: mode = 'bed'
        elif len(stems) == 1 and AN[stems[0]]['kind'] == 'music' and AN[stems[0]]['speech_coverage'] < 0.5: mode = 'music'
        else: mode = 'story'
    segs = []
    if mode == 'music':
        s = stems[0]; A = AN[s]; dur = A['dur']; beats = A['beats']
        if dur <= hi + END_CARD:
            segs.append({'clip': ids[s], 'in': 0.0, 'out': round(dur, 3)})
        else:
            # best contiguous window by smoothed score, snapped to a beat
            sc = np.array(A['score']); L = int(budget * 2); best, bi = -1, 0
            for i in range(0, max(1, len(sc) - L)):
                v = sc[i:i + L].mean()
                if v > best: best, bi = v, i
            a = bi / 2; a = min(beats, key=lambda b: abs(b - a)) if beats else a
            segs.append({'clip': ids[s], 'in': round(a, 3), 'out': round(min(dur, a + budget), 3)})
    elif mode == 'bed':
        # footage windows cut on the beat grid of the music bed (analysis of bed expected as clips/../music beats in P['bed_beats'])
        segs = []
    if mode in ('story', 'bed'):
        wins = []
        for s in stems:
            for w in candidate_windows(AN[s]):
                w['clip'] = s; wins.append(w)
        for sk in D.get('skip', []):
            wins = [w for w in wins if not (w['clip'] == sk['clip'] and not (w['b'] < sk['a'] or w['a'] > sk['b']))]
        cap = {s: (budget * 1.05 if len(stems) == 1 else max(6.0, 0.4 * budget)) for s in stems}; used = {s: 0.0 for s in stems}; picked = []
        # coverage first: best window of each clip
        for s in stems:
            cw = [w for w in wins if w['clip'] == s]
            if cw:
                w = max(cw, key=lambda w: w['score'] * (1 + 0.1 * min(w['b'] - w['a'], 6))); picked.append(w); used[s] += w['b'] - w['a']
        # narrative arc: keep the hook (first speech window) and the payoff (last speech window) of long clips
        for s in stems:
            cw = sorted([w for w in wins if w['clip'] == s and w['speech']], key=lambda w: w['a'])
            if cw and AN[s]['dur'] > 25:
                for w in (cw[0], cw[-1]):
                    if w not in picked and used[s] + (w['b'] - w['a']) <= cap[s]: picked.append(w); used[s] += w['b'] - w['a']
        total = sum(w['b'] - w['a'] for w in picked)
        for w in sorted([w for w in wins if w not in picked], key=lambda w: -w['score']):
            d = w['b'] - w['a']
            if total + d > budget * 1.08 or used[w['clip']] + d > cap[w['clip']]: continue
            picked.append(w); used[w['clip']] += d; total += d
        picked.sort(key=lambda w: (stems.index(w['clip']), w['a']))
        for w in picked:
            if segs and segs[-1]['clip'] == ids[w['clip']] and w['a'] - segs[-1]['out'] < 0.6: segs[-1]['out'] = round(w['b'], 3)
            else: segs.append({'clip': ids[w['clip']], 'in': round(w['a'], 3), 'out': round(w['b'], 3)})
    if D.get('cuts'):
        segs = []
        for c in D['cuts']:
            cid = ids.get(c.get('clip', stems[0]), ids[stems[0]]); st = inv0 = {v: k for k, v in ids.items()}[cid]
            phr = AN[st]['speech']; a, b = c['in'], c['out']
            ca = [p_['a'] for p_ in phr if abs(p_['a'] - a) <= 1.0]; cb = [p_['b'] for p_ in phr if abs(p_['b'] - b) <= 1.0]
            if ca and not c.get('exact'): a = min(ca, key=lambda v: abs(v - a)) - 0.12
            if cb and not c.get('exact'): b = min(cb, key=lambda v: abs(v - b)) + 0.22
            segs.append({'clip': cid, 'in': round(max(0, a), 3), 'out': round(min(AN[st]['dur'], b), 3), 'rate': c.get('rate', 1.0), 'trans': c.get('trans', 'none'), **({'mute': True} if c.get('mute') else {})})
    if D.get('force_segs'): segs = D['force_segs']
    for extra in D.get('append_segs', []):
        e = dict(extra); e['clip'] = ids.get(e['clip'], e['clip']); segs.append(e)
    pat = ['whip', 'zoom', 'whip', 'flash', 'zoom']
    for i, s in enumerate(segs):
        s.setdefault('rate', 1.0)
        nxt = segs[i + 1] if i + 1 < len(segs) else None
        s['trans'] = 'none' if not nxt else (s.get('trans') or ('whip' if nxt['clip'] == s['clip'] else pat[i % len(pat)]))
    # overlays
    light = bool(P.get('light'))
    inv = {v: k for k, v in ids.items()}
    ov = []
    first = segs[0]
    title = P.get('title') or os.path.basename(pdir.rstrip('/')).replace('_', ' ').replace('-', ' ').upper()
    ov.append({'type': 'title', 'clip': first['clip'], 'a': first['in'] + 0.2, 'b': first['in'] + 3.4, 'text': title, 'sub': P.get('subtitle', '')})
    seen = set(); n = 0
    for s in segs:
        if s['clip'] in seen: continue
        seen.add(s['clip']); n += 1
        st = inv[s['clip']]
        ov.append({'type': 'chapter', 'clip': s['clip'], 'at': round(s['in'] + (3.3 if s is first else 0.15), 2), 'n': f'{n:02d}', 'title': D.get('titles', {}).get(st, f'PART {n:02d}'), 'sub': D.get('subs', {}).get(st, '')})
    if light:
        ov = [o for o in ov if o['type'] not in ('title',)]
        ov += light_caps(segs, inv, AN, pdir, stems, D)
    else:
        for s in segs:
            st = inv[s['clip']]
            for ph in AN[st]['speech']:
                if ph['b'] < s['in'] - 0.05 or ph['a'] > s['out'] + 0.05: continue
                ptxt = ph['text']; pw = ph['words']
                for k_, v_ in D.get('fixes', {}).items():
                    if k_ in ptxt and _wf: ptxt = ptxt.replace(k_, v_); pw = _wf(ptxt, ph['a'], ph['b'])
                words = [w for w in pw if w['b'] > s['in'] and w['a'] < s['out']]
                if not words: continue
                for pg in split_pages(words):
                    a, b = pg[0]['a'], min(pg[-1]['b'] + 0.25, s['out'])
                    txt = scrub(' '.join(w['w'] for w in pg))
                    ov.append({'type': 'caption', 'clip': s['clip'], 'a': round(a, 2), 'b': round(b, 2), 'text': txt, 'hi': hi_words(pg)})
                for w in words:
                    key = re.sub(r'\W', '', w['w'].lower())
                    if BURST_WORDS.get(key): ov.append({'type': 'burst', 'clip': s['clip'], 'a': round(w['a'], 2), 'b': round(w['a'] + 1.2, 2), 'text': BURST_WORDS[key], 'x': 0.74, 'y': 0.32})

    # beat grid (global, output time) is filled by the timeline builder later; here just record per clip
    music_clips = [ids[s] for s in stems if AN[s]['kind'] == 'music' and not light]
    for cid in music_clips: ov.append({'type': 'eq', 'clip': cid, 'a': 0, 'b': 9999, 'label': '♪ ON THE RADIO' if mode == 'story' else '♪ SPECTRUM'})
    if mode in ('music', 'bed'):
        first = segs[0]; st0 = inv[first['clip']]; A0 = AN[st0]; rms = np.array(A0['rms_db'])
        a0, b0 = first['in'], first['out']; L = (b0 - a0) / 4; parts = []
        for q in range(4):
            i0, i1 = int((a0 + q * L) * 10), max(int((a0 + q * L) * 10) + 1, int((a0 + (q + 1) * L) * 10)); parts.append(float(np.mean(rms[i0:i1])) if i1 <= len(rms) else -90.0)
        drop = int(np.argmax(parts)); names = []
        for q in range(4): names.append('DROP' if q == drop else 'INTRO' if q == 0 else 'OUTRO' if q == 3 else 'BUILD')
        bpm = A0['bpm']; bpm_n = bpm / 2 if bpm > 140 else bpm
        ov = [o for o in ov if o['type'] != 'chapter']
        for q in range(4): ov.append({'type': 'chapter', 'clip': first['clip'], 'at': round(a0 + q * L + (3.3 if q == 0 else 0.15), 2), 'n': f'{q + 1:02d}', 'title': names[q], 'sub': f'{bpm_n:.0f} BPM' if q == 0 else ''})
        ov.append({'type': 'viz3d', 'clip': first['clip'], 'a': a0, 'b': b0, 'opacity': 0.5})
    if P.get('auto_brackets'):
        for s in segs:
            st = inv[s['clip']]
            for t in TR[st]:
                wid = float(np.mean([b[2] for b in t['boxes']]))
                if 0.08 < wid < 0.45 and t['b'] - t['a'] >= 2 and not (t['b'] < s['in'] or t['a'] > s['out']):
                    ov.append({'type': 'brackets', 'clip': s['clip'], 'track': f"{s['clip']}:{t['id']}", 'a': round(max(t['a'], s['in']) + 0.1, 2), 'b': round(min(t['b'], s['out']) - 0.1, 2), 'label': P.get('names', {}).get(f"{st}:{t['id']}", 'SUBJECT'), 'sub': 'LIVE'})
    if 'chapters' in D:
        ov = [o for o in ov if o['type'] != 'chapter'] + [{'type': 'chapter', **c} for c in D['chapters']]
    ov += D.get('overlays', [])
    # tracks used
    used_tracks = {}
    for o in ov:
        if o['type'] == 'brackets' and o.get('track'):
            c, tid = o['track'].split(':'); st = inv[c]
            tt = next((t for t in TR[st] if str(t['id']) == tid), None)
            if tt: used_tracks[o['track']] = {'a': tt['a'], 'fps': tt['fps'], 'boxes': tt['boxes']}
    # end card
    pol = []
    for s in stems:
        A = AN[s]; sc = np.array(A['score']); selected = [g for g in segs if g['clip'] == ids[s]]
        if not selected: continue
        g = max(selected, key=lambda g: g['out'] - g['in']); i0, i1 = int(g['in'] * 2), max(int(g['in'] * 2) + 1, int(g['out'] * 2))
        t = (i0 + int(np.argmax(sc[i0:i1]))) / 2; pol.append({'clip': ids[s], 't': round(t, 2), 'label': D.get('titles', {}).get(s, f'PART {len(pol) + 1:02d}')})
    pol = pol[:4]
    end = {'title': D.get('end', {}).get('title', title), 'subtitle': D.get('end', {}).get('subtitle', P.get('subtitle', '')), 'polaroids': D.get('end', {}).get('polaroids', pol), 'footer': D.get('end', {}).get('footer', '')}
    clips = {ids[s]: {'file': f"clips/{s}{os.path.splitext(f)[1]}", 'w': AN[s]['w'], 'h': AN[s]['h'], 'fps': AN[s]['fps'], 'dur': AN[s]['dur'], 'kind': AN[s]['kind'], 'name': s,
                      'beats': AN[s]['beats'], 'bpm': AN[s]['bpm'], 'bar': (AN[s].get('caption_bar') if D.get('bar_text', {}).get(s) else None), 'fy': D.get('focus', {}).get(s, P.get('focus', {}).get(s) if isinstance(P.get('focus'), dict) else None), 'bar_text': D.get('bar_text', {}).get(s, '')} for s in stems for f in os.listdir(clips_dir) if os.path.splitext(f)[0] == s}
    theme = dict(THEMES.get(P.get('style', 'sunny'), THEMES['sunny']))
    edit = {'version': 1, 'fps': 30, 'w': 1080, 'h': 1920, 'mode': mode, 'title': title, 'brand': P.get('brand', title), 'theme': theme, 'endCard': P.get('end_card', END_CARD), 'clips': clips, 'segs': segs, 'overlays': ov, 'tracks': used_tracks, 'end': end,
            'music': os.path.basename(music_bed) if music_bed else None, 'flags': {'beatPulse': mode in ('music', 'bed'), 'light': light, 'push': not light}}
    json.dump(edit, open(os.path.join(pdir, 'edit.json'), 'w'), indent=1)
    tot = sum((s['out'] - s['in']) / s['rate'] for s in segs)
    print(f'mode={mode} segs={len(segs)} cut={tot:.1f}s total={tot + END_CARD:.1f}s overlays={len(ov)} tracks={len(used_tracks)}')
    return edit

if __name__ == '__main__': plan(sys.argv[1])
