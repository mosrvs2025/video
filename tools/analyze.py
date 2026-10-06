import numpy as np, json, sys
d=sys.argv[1]
low=np.fromfile(d+'/low.raw','f4'); hi=np.fromfile(d+'/hi.raw','f4'); al=np.fromfile(d+'/all.raw','f4')
FPS=30
def env(x,sr):
    hop=sr/FPS; n=int(len(x)/hop)
    e=np.array([np.sqrt(np.mean(x[int(i*hop):int((i+1)*hop)]**2)) for i in range(n)])
    return e/np.percentile(e,98)
L,H,A=env(low,8000),env(hi,22050),env(al,22050)
n=min(len(L),len(H),len(A)); L,H,A=L[:n],H[:n],A[:n]
o=np.maximum(0,np.diff(L,prepend=0))+np.maximum(0,np.diff(H,prepend=0))
best=(0,0,0)
ts=np.arange(n)/FPS
a,b=int(10*FPS),int(min(150,n/FPS)*FPS)
for bpm in np.arange(78,170,0.02):
    BP=60/bpm
    for ph in np.arange(0,BP,0.02):
        g=np.arange(ph+10,150,BP)
        idx=np.clip((g*FPS).round().astype(int),0,n-1)
        s=o[idx].mean()
        if s>best[0]: best=(s,bpm,ph)
s,bpm,ph=best
print('score',s/o.mean(),'bpm',bpm,'phase',ph)
# refine phase
BP=60/bpm
bestp=max(np.arange(0,BP,0.005),key=lambda p:o[np.clip((np.arange(p+10,150,BP)*FPS).round().astype(int),0,n-1)].mean())
print('phase refined',bestp)
print('sections (2s windows): t all low hi')
w=2*FPS
for i in range(0,n,w):
    print(f"{i/FPS:6.1f} {A[i:i+w].mean():.2f} {L[i:i+w].mean():.2f} {H[i:i+w].mean():.2f}", '#'*int(L[i:i+w].mean()*20))
json.dump(dict(bpm=bpm,ph=bestp,L=L.round(3).tolist(),H=H.round(3).tolist(),A=A.round(3).tolist()),open(d+'/audio.json','w'))
