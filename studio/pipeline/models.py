"""Download speech models once (GitHub release assets; HuggingFace is blocked in some sandboxes)."""
import os, sys, tarfile, urllib.request
CACHE=os.path.expanduser('~/.cache/studio')
WHISPER_URL='https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.en.tar.bz2'
VAD_URL='https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx'
def whisper_dir(size='small.en'): return os.path.join(CACHE,f'sherpa-onnx-whisper-{size}')
def vad_path(): return os.path.join(CACHE,'silero_vad.onnx')
def get(url,dst):
    print('downloading',url,flush=True); urllib.request.urlretrieve(url,dst)
def ensure_size(size):
    d = whisper_dir(size)
    if os.path.isdir(d) and any(f.endswith('int8.onnx') for f in os.listdir(d)): return d
    os.makedirs(CACHE, exist_ok=True); tgz = os.path.join(CACHE, 'w.tar.bz2')
    get(f'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-{size}.tar.bz2', tgz)
    with tarfile.open(tgz) as t: t.extractall(CACHE)
    os.remove(tgz)
    for f in os.listdir(d):   # keep only int8 + tokens to save disk
        if f.endswith('.onnx') and 'int8' not in f or f.endswith('.weights'): os.remove(os.path.join(d, f))
    return d

def ensure():
    os.makedirs(CACHE,exist_ok=True)
    if not os.path.exists(vad_path()):
        try: get(VAD_URL,vad_path())
        except Exception as e: print('VAD download failed (will use energy VAD):',e)
    if not os.path.isdir(whisper_dir()):
        tgz=os.path.join(CACHE,'w.tar.bz2'); get(WHISPER_URL,tgz)
        with tarfile.open(tgz) as t: t.extractall(CACHE)
        os.remove(tgz)
    return whisper_dir()
if __name__=='__main__': ensure(); print('models ok',whisper_dir())
