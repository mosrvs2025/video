"""Mux, encode and verify the deliverables.
  python scripts/finalize.py film    -> ../output/the-ai-nobody-can-find.mp4
  python scripts/finalize.py short   -> ../output/the-ai-nobody-can-find-short.mp4 (+ captions-short.srt)
"""
import json, os, subprocess, sys, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); OUT = os.path.join(os.path.dirname(ROOT), 'output'); D = os.path.join(ROOT, 'data')
sys.path.insert(0, HERE)
def ff(*a): subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)
def probe(p):
    j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels', '-of', 'json', p], capture_output=True, text=True).stdout)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-'], capture_output=True, text=True).stderr
    lufs = [l.strip() for l in r.splitlines()[-12:] if 'I:' in l or 'Peak:' in l]
    return j, lufs
def report(p):
    j, l = probe(p); f = j['format']; print(f"{os.path.basename(p)}  {float(f['duration']):.2f}s  {int(f['size']) / 1048576:.1f} MB")
    for s in j['streams']: print('  ', s.get('codec_type'), s.get('codec_name'), s.get('width', ''), s.get('height', ''), s.get('r_frame_rate', ''), s.get('sample_rate', ''), s.get('channels', ''))
    print('  ', ' | '.join(l))
def loudnorm(src, dst, I=-14.0, TP=-1.0):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={I}:TP={TP}:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    ff('-i', src, '-af', f"loudnorm=I={I}:TP={TP}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000", '-ar', '48000', '-c:a', 'pcm_s24le', dst)
ENC = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000']

def film():
    out = os.path.join(OUT, 'the-ai-nobody-can-find.mp4')
    ff('-i', os.path.join(D, 'film_silent.mp4'), '-i', os.path.join(D, 'mix.wav'), '-map', '0:v', '-map', '1:a', *ENC, '-shortest', out); report(out)

def short():
    S = json.load(open(os.path.join(ROOT, 'src', 'short.json'))); segs = S['segments']
    w = wave.open(os.path.join(D, 'mix.wav')); sr = w.getframerate(); n = w.getnframes(); sw = w.getsampwidth(); raw = w.readframes(n)
    if sw == 3:
        b = np.frombuffer(raw, np.uint8).reshape(-1, 3); x = ((b[:, 0].astype(np.int32) | (b[:, 1].astype(np.int32) << 8) | (b[:, 2].astype(np.int32) << 16)) << 8 >> 8).astype(np.float32) / 8388608
    else: x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    x = x.reshape(-1, 2); parts = []; f = int(0.03 * sr)
    for a, b in segs:
        p = x[int(a * sr):int(b * sr)].copy(); p[:f] *= np.linspace(0, 1, f)[:, None]; p[-f:] *= np.linspace(1, 0, f)[:, None]; parts.append(p)
    y = np.concatenate(parts); pre = os.path.join(D, 'short_pre.wav')
    ww = wave.open(pre, 'wb'); ww.setnchannels(2); ww.setsampwidth(2); ww.setframerate(sr); ww.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()); ww.close()
    sm = os.path.join(D, 'short_mix.wav'); loudnorm(pre, sm)
    out = os.path.join(OUT, 'the-ai-nobody-can-find-short.mp4')
    ff('-i', os.path.join(D, 'short_silent.mp4'), '-i', sm, '-map', '0:v', '-map', '1:a', *ENC, '-shortest', out); report(out)
    # captions remapped to short time
    import captions
    def remap(t):
        acc = 0
        for a, b in segs:
            if a - 0.01 <= t <= b + 0.5: return acc + min(t, b) - a
            acc += b - a
        return -1
    ids = [k for k, L in captions.CU.items() if any(a <= L['t0'] < b for a, b in segs)]
    bl = [b for b in captions.blocks(ids, remap) if b['a'] >= 0 and b['b'] > b['a']]
    captions.write(os.path.join(OUT, 'captions-short.srt'), bl); print(len(bl), 'short captions')

if __name__ == '__main__':
    {'film': film, 'short': short}[sys.argv[1]]()
