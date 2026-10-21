"""Narration: script.json -> per-line WAVs (Kokoro via sherpa-onnx, local, Apache-2.0 model) -> narration_raw.wav + timeline.json.
Usage: python scripts/tts.py   (from source/)
"""
import json, os, wave, subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
M = os.path.expanduser('~/.cache/studio/tts/kokoro-en-v0_19')
VOICES = ['af', 'af_bella', 'af_nicole', 'af_sarah', 'af_sky', 'am_adam', 'am_michael', 'bf_emma', 'bf_isabella', 'bm_george', 'bm_lewis']
SR = 24000

def write(p, x, sr=SR):
    x = np.clip(np.asarray(x, dtype=np.float32), -1, 1); w = wave.open(p, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()

def trim(x, thr=0.004, pad=0.03):
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx): return x
    a = max(0, idx[0] - int(pad * SR)); b = min(len(x), idx[-1] + int(pad * 2 * SR)); y = x[a:b].copy()
    f = int(0.012 * SR); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y

def main():
    import sherpa_onnx
    S = json.load(open(os.path.join(ROOT, 'data', 'script.json')))
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f'{M}/model.onnx', voices=f'{M}/voices.bin', tokens=f'{M}/tokens.txt', data_dir=f'{M}/espeak-ng-data'), num_threads=4))
    tts = sherpa_onnx.OfflineTts(cfg); sid = VOICES.index(S['voice'])
    ld = os.path.join(ROOT, 'data', 'lines'); os.makedirs(ld, exist_ok=True)
    out, t, tl = [], 0.0, {'acts': [], 'lines': {}}
    for act in S['acts']:
        out.append(np.zeros(int(act['lead'] * SR), np.float32)); t += act['lead']
        a0 = t - act['lead']; act_lines = []
        for ln in act['lines']:
            p = os.path.join(ld, ln['id'] + '.wav')
            g = tts.generate(ln['text'], sid=sid, speed=ln.get('speed', S['speed'])); x = trim(np.asarray(g.samples, np.float32))
            write(p, x); d = len(x) / SR
            tl['lines'][ln['id']] = {'t0': round(t, 3), 't1': round(t + d, 3), 'text': ln['text'].replace('...', '…'), 'act': act['id']}
            act_lines.append(ln['id'])
            out.append(x); out.append(np.zeros(int(ln['pause'] * SR), np.float32)); t += d + ln['pause']
            print(f"{ln['id']:4s} {t - d - ln['pause']:7.2f}s  {d:5.2f}s  {ln['text'][:60]}")
        tl['acts'].append({'id': act['id'], 'title': act['title'], 't0': round(a0, 3), 't1': round(t, 3), 'lines': act_lines})
    y = np.concatenate(out); tl['duration'] = round(len(y) / SR, 3)
    raw = os.path.join(ROOT, 'data', 'narration_raw.wav'); write(raw, y)
    json.dump(tl, open(os.path.join(ROOT, 'src', 'timeline.json'), 'w'), indent=1)
    print('total', tl['duration'], 's ->', raw)

if __name__ == '__main__': main()
