"""Assemble the cut audio from timeline.json (per-clip loudnorm, segment trims with short fades, optional slow-mo/mute); writes spectrum + total."""
import json, subprocess, numpy as np
T=json.load(open('src/timeline.json'))
inputs=[]; names={}; flt=[]
for i,(k,f) in enumerate(T['clips'].items()):
    inputs+=['-i',f'public/{f}']; names[k]=i
cum=0.0
for i,s in enumerate(T['segs']):
    rate=s.get('rate',1.0); d=(s['out']-s['in'])/rate; d=round(d*30)/30; ci=names[s['clip']]
    base=f"[{ci}:a]highpass=f=60,loudnorm=I=-15:TP=-1.5:LRA=9,aformat=sample_rates=44100:channel_layouts=stereo,atrim={s['in']}:{s['out']},asetpts=N/SR/TB"
    if rate!=1.0: base+=f",atempo={rate}"
    if s.get('mute'): base+=",volume=0"
    flt.append(f"{base},atrim=0:{d},afade=t=in:d=0.05,afade=t=out:st={max(0,d-0.05)}:d=0.05,apad=whole_dur={d}[a{i}]")
    cum+=d
n=len(T['segs']); total=cum+T['endCard']
flt.append(''.join(f'[a{i}]' for i in range(n))+f'concat=n={n}:v=0:a=1,apad=whole_dur={total}[o]')
subprocess.run(['ffmpeg','-v','error','-y',*inputs,'-filter_complex',';'.join(flt),'-map','[o]','audio/combined.wav'],check=True)
frames=int(round(total*30)); json.dump({'frames':frames,'seconds':total,'cutEnd':cum},open('src/total.json','w'))
raw=subprocess.run(['ffmpeg','-v','error','-i','audio/combined.wav','-ac','1','-ar','16000','-f','s16le','-'],capture_output=True).stdout
x=np.frombuffer(raw,dtype=np.int16).astype(np.float32)/32768
SR=16000; edges=np.geomspace(50,6500,21); win=np.hanning(1024); out=np.zeros((frames,20))
fr=np.fft.rfftfreq(1024,1/SR); masks=[(fr>=edges[b])&(fr<edges[b+1]) for b in range(20)]
for f in range(frames):
    c=int(f/30*SR); seg=x[max(0,c-512):c+512]
    if len(seg)<1024: seg=np.pad(seg,(0,1024-len(seg)))
    sp=np.abs(np.fft.rfft(seg*win))
    for b in range(20): out[f,b]=sp[masks[b]].mean() if masks[b].any() else 0
out=np.log1p(out*30); out/=np.percentile(out,98,axis=0)+1e-6; out=np.clip(out,0,1)
sm=np.zeros_like(out)
for f in range(frames): sm[f]=np.maximum(out[f],sm[f-1]*0.82) if f else out[f]
json.dump(np.round(sm,2).tolist(),open('src/spectrum.json','w'))
print('cut',cum,'total',total,'frames',frames)
