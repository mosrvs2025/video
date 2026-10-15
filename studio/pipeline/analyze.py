"""Analyze one clip -> analysis.json (+ contact sheets for human/AI review).
Everything is cached under projects/<p>/analysis/<clip>/ ; re-runs are skipped unless --force."""
import json, os, re, subprocess, sys, math
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
import models

SR = 16000

def sh(cmd, **kw): return subprocess.run(cmd, capture_output=True, text=True, **kw)

def probe(path):
    j = json.loads(sh(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', path]).stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    a = any(s['codec_type'] == 'audio' for s in j['streams'])
    num, den = v['r_frame_rate'].split('/')
    rot = 0
    for sd in v.get('side_data_list', []) or []:
        rot = int(sd.get('rotation', 0) or 0)
    w, h = int(v['width']), int(v['height'])
    if abs(rot) in (90, 270): w, h = h, w
    return {'w': w, 'h': h, 'fps': float(num) / float(den), 'dur': float(j['format']['duration']), 'audio': a}

# ---------------- audio ----------------
def load_audio(path, tmp):
    wav = os.path.join(tmp, 'a16.wav')
    sh(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vn', '-ac', '1', '-ar', str(SR), wav])
    if not os.path.exists(wav): return np.zeros(SR, np.float32)
    raw = sh(['ffmpeg', '-v', 'error', '-i', wav, '-f', 's16le', '-'], text=False).stdout if False else subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768

def rms_curve(x, hop=1600):
    n = len(x) // hop
    if n == 0: return np.zeros(1)
    r = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    return 20 * np.log10(r + 1e-9)

def onset_env(x, n_fft=1024, hop=256):
    win = np.hanning(n_fft); n = max(0, (len(x) - n_fft) // hop)
    if n < 4: return np.zeros(4), SR / hop
    S = np.empty((n, n_fft // 2 + 1), np.float32)
    for i in range(n): S[i] = np.abs(np.fft.rfft(x[i * hop:i * hop + n_fft] * win))
    L = np.log1p(S * 20)
    flux = np.maximum(0, np.diff(L, axis=0)).sum(1)
    flux = np.concatenate([[0], flux])
    flux = flux - np.convolve(flux, np.ones(31) / 31, 'same')
    flux = np.maximum(flux, 0); flux /= (flux.max() + 1e-9)
    return flux, SR / hop

def beat_track(env, rate):
    """tempo by autocorrelation + Ellis-style DP beat tracker. returns (bpm, regularity, beat_times)."""
    if len(env) < rate * 4: return 0.0, 0.0, []
    ac = np.correlate(env - env.mean(), env - env.mean(), 'full')[len(env) - 1:]
    lo, hi = int(rate * 60 / 180), int(rate * 60 / 60)
    seg = ac[lo:hi]
    if len(seg) < 3 or ac[0] <= 0: return 0.0, 0.0, []
    lag = lo + int(np.argmax(seg)); period = lag
    reg = float(seg.max() / (np.median(np.abs(seg)) + 1e-9))
    bpm = 60 * rate / period
    # DP
    n = len(env); C = np.zeros(n); B = np.zeros(n, int) - 1
    alpha = 100.0
    for t in range(n):
        best = 0.0; bi = -1
        for p in range(max(0, t - 2 * period), t - period // 2):
            d = (t - p) / period
            sc = C[p] - alpha * (math.log(d)) ** 2 * 0.02
            if sc > best: best, bi = sc, p
        C[t] = env[t] + best; B[t] = bi
    t = int(np.argmax(C[-period:]) + n - period); beats = []
    while t >= 0:
        beats.append(t); t = B[t]
        if t < 0: break
    beats = beats[::-1]
    return float(bpm), reg, [b / rate for b in beats]

def tempo_strength(env, rate):
    """mean normalized autocorrelation peak of the onset envelope in 8 s windows: ~0.6 for real music, ~0.1 for speech/waves/wind."""
    w = int(rate * 8); hop = int(rate * 3); peaks = []
    for i in range(0, max(1, len(env) - w), hop):
        e = env[i:i + w]
        if len(e) < w // 2: continue
        ac = np.correlate(e - e.mean(), e - e.mean(), 'full')[len(e) - 1:]
        lo, hi = int(rate * 60 / 180), int(rate * 60 / 60); seg = ac[lo:hi]
        if len(seg) < 3 or ac[0] <= 0: continue
        peaks.append(seg.max() / ac[0])
    return float(np.mean(peaks)) if peaks else 0.0

# ---------------- speech ----------------
CLEAN = re.compile(r'^\s*[\(\[\*].*[\)\]\*]\s*$')
def syll(w): return max(1, len(re.findall(r'[aeiouy]+', re.sub(r'[^a-z]', '', w.lower()))))

def words_for(seg_text, a, b):
    toks = seg_text.split()
    if not toks: return []
    wts = [syll(t) for t in toks]; pause = [0.7 if t.endswith(',') else 0 for t in toks]
    tot = sum(wts) + sum(pause); cum = 0.0; out = []
    for t, w, p in zip(toks, wts, pause):
        s = a + cum / tot * (b - a); cum += w; e = a + cum / tot * (b - a); cum += p
        out.append({'w': t, 'a': round(s, 3), 'b': round(e, 3)})
    return out

def vad_segments(x):
    try:
        import sherpa_onnx
        if not os.path.exists(models.vad_path()): raise RuntimeError('no vad model')
        cfg = sherpa_onnx.VadModelConfig()
        cfg.silero_vad.model = models.vad_path(); cfg.silero_vad.threshold = 0.45
        cfg.silero_vad.min_silence_duration = 0.35; cfg.silero_vad.min_speech_duration = 0.25; cfg.silero_vad.max_speech_duration = 12
        cfg.sample_rate = SR
        vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=120)
        win = 512; segs = []
        for i in range(0, len(x) - win, win):
            vad.accept_waveform(x[i:i + win])
            while not vad.empty():
                s = vad.front; segs.append((s.start / SR, s.start / SR + len(s.samples) / SR)); vad.pop()
        vad.flush()
        while not vad.empty():
            s = vad.front; segs.append((s.start / SR, s.start / SR + len(s.samples) / SR)); vad.pop()
        return segs
    except Exception as e:
        print('  (VAD fallback: energy)', e)
        r = rms_curve(x, 1600); thr = np.percentile(r, 40) + 6
        segs = []; cur = None
        for i, v in enumerate(r):
            if v > thr and cur is None: cur = i / 10
            if v <= thr and cur is not None:
                if i / 10 - cur > 0.3: segs.append((cur, i / 10))
                cur = None
        return segs

def transcribe(x):
    import sherpa_onnx
    d = models.whisper_dir(); m = os.path.join(d, 'small.en')
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=m + '-encoder.int8.onnx', decoder=m + '-decoder.int8.onnx', tokens=m + '-tokens.txt', language='en', task='transcribe', num_threads=4)
    out = []
    for a, b in vad_segments(x):
        pa, pb = max(0, a - 0.15), min(len(x) / SR, b + 0.15)
        if pb - pa < 0.3: continue
        st = rec.create_stream(); st.accept_waveform(SR, x[int(pa * SR):int(pb * SR)]); rec.decode_stream(st)
        t = st.result.text.strip()
        if not t or CLEAN.match(t) or len(re.sub(r'[^A-Za-z]', '', t)) < 2: continue
        if re.search(r'(upbeat|music|blank_audio|engine|wind blowing|laughs|laughing)', t, re.I) and len(t.split()) < 4: continue
        out.append({'a': round(a, 2), 'b': round(b, 2), 'text': t, 'words': words_for(t, a, b)})
    return out

# ---------------- video ----------------
def sample_frames(path, tmp, fps=2):
    d = os.path.join(tmp, 's'); os.makedirs(d, exist_ok=True)
    for f in os.listdir(d): os.remove(os.path.join(d, f))
    sh(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'fps={fps},scale=320:-2', os.path.join(d, '%05d.jpg'), '-y'])
    return [os.path.join(d, f) for f in sorted(os.listdir(d))]

def scene_cuts(path):
    r = sh(['ffmpeg', '-i', path, '-vf', "select='gt(scene,0.32)',showinfo", '-f', 'null', '-'])
    return [float(m) for m in re.findall(r'pts_time:([0-9.]+)', r.stderr)]

def visual_metrics(frames, fps=2):
    cas = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    prev = None; out = []; hsv_acc = np.zeros(180)
    for i, f in enumerate(frames):
        im = cv2.imread(f); g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY); H, W = g.shape
        motion = 0.0 if prev is None else float(np.mean(np.abs(g.astype(np.float32) - prev.astype(np.float32))) / 255)
        sharp = float(cv2.Laplacian(g, cv2.CV_64F).var())
        faces = cas.detectMultiScale(g, 1.1, 5, minSize=(int(W * 0.08), int(W * 0.08)))
        fl = sorted([[(x + w / 2) / W, (y + h / 2) / H, w / W, h / H] for x, y, w, h in faces], key=lambda b: -b[2] * b[3])[:3]
        hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
        m = (hsv[..., 1] > 90) & (hsv[..., 2] > 90)
        if m.any(): hsv_acc += np.bincount(hsv[..., 0][m].ravel(), minlength=180)[:180]
        out.append({'t': round(i / fps, 2), 'motion': round(motion, 4), 'sharp': round(sharp, 1), 'bright': round(float(g.mean()) / 255, 3), 'faces': [[round(v, 3) for v in b] for b in fl]})
        prev = g
    hue = int(np.argmax(np.convolve(hsv_acc, np.ones(9), 'same'))) if hsv_acc.sum() > 0 else 20
    return out, hue

def hue_to_hex(h, s=0.75, v=1.0):
    import colorsys
    r, g, b = colorsys.hsv_to_rgb(h / 180, s, v); return '#%02x%02x%02x' % (int(r * 255), int(g * 255), int(b * 255))

def contact_sheets(frames, outdir, fps=2):
    from PIL import Image, ImageDraw
    os.makedirs(outdir, exist_ok=True); W, H = 240, 428; per = 36
    for s in range(0, len(frames), per):
        sheet = Image.new('RGB', (9 * W, 4 * H)); d = ImageDraw.Draw(sheet)
        for i, f in enumerate(frames[s:s + per]):
            im = Image.open(f); im.thumbnail((W, H)); x, y = (i % 9) * W, (i // 9) * H
            sheet.paste(im, (x, y)); d.rectangle([x, y, x + 52, y + 14], fill=(0, 0, 0)); d.text((x + 3, y + 2), f't={(s + i) / fps:.1f}', fill=(255, 255, 0))
        sheet.save(os.path.join(outdir, f'sheet_{s // per}.jpg'), quality=76)

def detect_caption_bar(frames):
    """Find a burned-in caption bar (e.g. Snapchat text strip): two static horizontal edges in the top 30% of the frame that persist
    across time while the video behind them changes. Returns {'y0','y1'} as fractions of frame height, or None."""
    if len(frames) < 8: return None
    step = max(1, len(frames) // 60); acc = None; n = 0; H = 0
    for f in frames[::step]:
        g = cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2GRAY).astype(np.float32); H = g.shape[0]
        d = np.abs(g[2:] - g[:-2]).mean(1); acc = d if acc is None else acc + d; n += 1
    prof = acc / n; top = int(H * 0.30); p = prof[:top]
    base = np.median(prof) + 1e-6; thr = max(3.0 * base, np.percentile(p, 90))
    peaks = [i for i in range(2, top - 2) if p[i] >= thr and p[i] == p[max(0, i - 3):i + 4].max()]
    best = None
    for a in peaks:
        for b in peaks:
            if 0.03 * H <= b - a <= 0.12 * H and (best is None or (p[a] + p[b]) > best[0]): best = (p[a] + p[b], a, b)
    if not best: return None
    return {'y0': round((best[1] + 1) / H, 4), 'y1': round((best[2] + 1) / H, 4)}

def smooth(a, k):
    return np.convolve(a, np.ones(k) / k, 'same')

def norm(a):
    a = np.asarray(a, float); lo, hi = np.percentile(a, 5), np.percentile(a, 95)
    return np.clip((a - lo) / (hi - lo + 1e-9), 0, 1)

def analyze(path, outdir, force=False):
    jf = os.path.join(outdir, 'analysis.json')
    if os.path.exists(jf) and not force: return json.load(open(jf))
    os.makedirs(outdir, exist_ok=True); tmp = os.path.join(outdir, 'tmp'); os.makedirs(tmp, exist_ok=True)
    print('analyze', os.path.basename(path), flush=True)
    meta = probe(path)
    x = load_audio(path, tmp) if meta['audio'] else np.zeros(SR, np.float32)
    rms = rms_curve(x); env, rate = onset_env(x); bpm, reg, beats = beat_track(env, rate); tstr = tempo_strength(env, rate)
    speech = transcribe(x) if meta['audio'] and len(x) > SR else []
    cov = sum(s['b'] - s['a'] for s in speech) / max(meta['dur'], 1e-6)
    frames = sample_frames(path, tmp); vm, hue = visual_metrics(frames)
    cuts = scene_cuts(path); bar = detect_caption_bar(frames)
    contact_sheets(frames, outdir)
    # highlight score per 0.5 s
    n = len(vm); t = np.arange(n) / 2
    sp = np.zeros(n)
    for s in speech:
        for i in range(n):
            if s['a'] <= t[i] <= s['b']: sp[i] = 1
    excl = np.zeros(n)
    for s in speech:
        if '!' in s['text']:
            for i in range(n):
                if s['a'] <= t[i] <= s['b']: excl[i] = 1
    ar = np.array([rms[min(len(rms) - 1, int(tt * 10))] for tt in t])
    motion = norm([v['motion'] for v in vm]); sharp = norm([v['sharp'] for v in vm]); face = np.array([1.0 if v['faces'] else 0.0 for v in vm])
    score = 0.34 * sp + 0.12 * excl + 0.18 * norm(ar) + 0.18 * motion + 0.10 * face + 0.08 * sharp
    score = smooth(score, 5)
    kind = 'music' if tstr > 0.3 else 'speech' if cov > 0.3 else 'ambient'
    res = {'file': os.path.basename(path), **meta, 'kind': kind, 'bpm': round(bpm, 1), 'beat_regularity': round(reg, 2), 'tempo_strength': round(tstr, 3), 'speech_coverage': round(cov, 3),
           'beats': [round(b, 3) for b in beats], 'rms_db': [round(float(v), 1) for v in rms[::1]], 'speech': speech, 'cuts': cuts,
           'caption_bar': bar, 'samples': vm, 'score': [round(float(v), 3) for v in score], 'accent_hue': hue}
    json.dump(res, open(jf, 'w'))
    return res

if __name__ == '__main__':
    p = sys.argv[1]; out = sys.argv[2]
    r = analyze(p, out, force='--force' in sys.argv)
    print({k: r[k] for k in ('w', 'h', 'fps', 'dur', 'kind', 'bpm', 'tempo_strength', 'speech_coverage')}, 'speech segs', len(r['speech']), 'cuts', len(r['cuts']))
