import sherpa_onnx, sys, os, wave, numpy as np
class sf:
    @staticmethod
    def write(p, x, sr):
        x=np.clip(np.asarray(x),-1,1); w=wave.open(p,"wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
M=os.path.expanduser('~/.cache/studio/tts/kokoro-en-v0_19')
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f'{M}/model.onnx',voices=f'{M}/voices.bin',tokens=f'{M}/tokens.txt',data_dir=f'{M}/espeak-ng-data'),num_threads=4))
tts=sherpa_onnx.OfflineTts(cfg)
txt="What if the most dangerous artificial intelligence... wasn't hiding in a secret laboratory? What if it was already everywhere?"
names=['af','af_bella','af_nicole','af_sarah','af_sky','am_adam','am_michael','bf_emma','bf_isabella','bm_george','bm_lewis']
out=sys.argv[1]
for sid in [5,6,9,10]:
    a=tts.generate(txt,sid=sid,speed=0.9); sf.write(f'{out}/v_{names[sid]}.wav',a.samples,a.sample_rate); print(names[sid],len(a.samples)/a.sample_rate)
