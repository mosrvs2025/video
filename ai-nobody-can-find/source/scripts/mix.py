"""Voice processing, ducking and loudness: data/narration_raw.wav + data/music.wav + data/sfx.wav -> data/mix.wav (-14 LUFS, -1 dBTP)
Also writes the stems to ../output/stems/."""
import json, os, subprocess, wave, shutil
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); OUT = os.path.join(os.path.dirname(ROOT), 'output')
SR = 48000; D = os.path.join(ROOT, 'data')
def ff(*a): subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)
def rd(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels(); sw = w.getsampwidth(); raw = w.readframes(n)
    if sw == 2: x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    else: b = np.frombuffer(raw, np.uint8).reshape(-1, 3); x = ((b[:, 0].astype(np.int32) | (b[:, 1].astype(np.int32) << 8) | (b[:, 2].astype(np.int32) << 16)) << 8 >> 8).astype(np.float32) / 8388608
    return x.reshape(-1, ch)
def wr(p, x):
    x = np.clip(x, -1, 1); w = wave.open(p, 'wb'); w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
def loudnorm(src, dst, I=-14.0, TP=-1.5):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={I}:TP={TP}:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    ff('-i', src, '-af', f"loudnorm=I={I}:TP={TP}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000", '-ar', '48000', '-c:a', 'pcm_s24le', dst)

voice = os.path.join(D, 'narration_proc.wav')
ff('-i', os.path.join(D, 'narration_raw.wav'), '-af', 'aresample=48000:resampler=soxr,highpass=f=70,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=1.8,equalizer=f=7200:t=q:w=2:g=-2.5,acompressor=threshold=-22dB:ratio=2.6:attack=6:release=140:makeup=2,aecho=0.85:0.5:28|51:0.10|0.06', '-ac', '1', '-ar', '48000', voice)
v = rd(voice)[:, 0]; m = rd(os.path.join(D, 'music.wav')); s = rd(os.path.join(D, 'sfx.wav'))
n = max(len(v), len(m), len(s)); pad = lambda x: np.pad(x, ((0, n - len(x)),) + ((0, 0),) * (x.ndim - 1))
v, m, s = pad(v), pad(m), pad(s)
# ducking from the voice envelope (attack 60 ms, release 600 ms)
hop = 480; e = np.sqrt(np.convolve(v ** 2, np.ones(hop) / hop, 'same'))[::hop]; on = (e > 0.02).astype(np.float32)
du = np.zeros_like(on); a_, r_ = 1 - np.exp(-1 / 6), 1 - np.exp(-1 / 60)
for i in range(1, len(on)): du[i] = du[i - 1] + (on[i] - du[i - 1]) * (a_ if on[i] > du[i - 1] else r_)
du = np.interp(np.arange(n), np.arange(len(du)) * hop, du).astype(np.float32)
gm = (1 - 0.55 * du)[:, None]; gs = (1 - 0.3 * du)[:, None]
mix = np.stack([v, v], 1) * 0.9 + m * 1.6 * gm + s * 1.25 * gs
pre = os.path.join(D, 'mix_pre.wav'); wr(pre, mix * 0.5)
loudnorm(pre, os.path.join(D, 'mix.wav'))
os.makedirs(os.path.join(OUT, 'stems'), exist_ok=True)
loudnorm(voice, os.path.join(OUT, 'narration.wav'), I=-16.0)
mm = os.path.join(D, 'music_sfx.wav'); wr(mm, (m * 1.6 + s * 1.25) * 0.5); loudnorm(mm, os.path.join(OUT, 'stems', 'music-and-sfx.wav'), I=-18.0)
shutil.copy(os.path.join(D, 'music.wav'), os.path.join(OUT, 'stems', 'music-only.wav')); shutil.copy(os.path.join(D, 'sfx.wav'), os.path.join(OUT, 'stems', 'sfx-only.wav'))
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', os.path.join(D, 'mix.wav'), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
print('\n'.join(l for l in r.splitlines()[-12:] if any(k in l for k in ('I:', 'LRA:', 'Peak:'))))
