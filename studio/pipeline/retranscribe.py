"""Re-run speech recognition with a larger model + shorter VAD phrases; writes speech into analysis.json (old kept as speech_prev).
python pipeline/retranscribe.py <analysis_dir> <clip.mp4> [--model medium.en]"""
import json, os, re, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import analyze, models

def run(adir, clip, size='medium.en', max_seg=7.0):
    import sherpa_onnx
    jf = os.path.join(adir, 'analysis.json'); A = json.load(open(jf))
    x = analyze.load_audio(clip, os.path.join(adir, 'tmp'))
    d = models.ensure_size(size); m = os.path.join(d, size)
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=m + '-encoder.int8.onnx', decoder=m + '-decoder.int8.onnx', tokens=m + '-tokens.txt', language='en', task='transcribe', num_threads=4)
    # VAD with shorter max speech so word timing stays tight
    cfg = sherpa_onnx.VadModelConfig(); cfg.silero_vad.model = models.vad_path(); cfg.silero_vad.threshold = 0.45
    cfg.silero_vad.min_silence_duration = 0.25; cfg.silero_vad.min_speech_duration = 0.2; cfg.silero_vad.max_speech_duration = max_seg; cfg.sample_rate = 16000
    vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=120); segs = []
    for i in range(0, len(x) - 512, 512):
        vad.accept_waveform(x[i:i + 512])
        while not vad.empty(): s = vad.front; segs.append((s.start / 16000, s.start / 16000 + len(s.samples) / 16000)); vad.pop()
    vad.flush()
    while not vad.empty(): s = vad.front; segs.append((s.start / 16000, s.start / 16000 + len(s.samples) / 16000)); vad.pop()
    out = []
    for a, b in segs:
        pa, pb = max(0, a - 0.15), min(len(x) / 16000, b + 0.15)
        if pb - pa < 0.3: continue
        st = rec.create_stream(); st.accept_waveform(16000, x[int(pa * 16000):int(pb * 16000)]); rec.decode_stream(st)
        t = st.result.text.strip()
        if not t or analyze.CLEAN.match(t) or len(re.sub(r'[^A-Za-z]', '', t)) < 2: continue
        out.append({'a': round(a, 2), 'b': round(b, 2), 'text': t, 'words': analyze.words_for(t, a, b)})
    A['speech_prev'] = A.get('speech_prev') or A['speech']; A['speech'] = out; A['asr'] = size
    json.dump(A, open(jf, 'w')); print('segments', len(out))
if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2], sys.argv[sys.argv.index('--model') + 1] if '--model' in sys.argv else 'medium.en')
