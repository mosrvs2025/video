"""SFX/score layer for the pro edit. Cues are placed from (clip, source-time) via timeline.json so they stay locked to graphics."""
import json, numpy as np, wave
T=json.load(open('src/timeline.json')); TOT=json.load(open('src/total.json'))
SR=44100; DUR=TOT['seconds']; N=int(SR*DUR); rng=np.random.default_rng(21)
L=np.zeros(N); R=np.zeros(N)
segs=[]; acc=0.0
for s in T['segs']:
    d=round((s['out']-s['in'])*30)/30; segs.append({**s,'start':acc,'d':d}); acc+=d
CUT=acc
def O(clip,ct):
    for s in segs:
        if s['clip']==clip and s['in']-1e-6<=ct<=s['out']+1e-6: return s['start']+ct-s['in']
    raise ValueError((clip,ct))
def tt(n): return np.arange(n)/SR
def add(s,t0,g=1.0,pan=0.0):
    i=int(t0*SR)
    if i<0 or i>=N: return
    s=s[:N-i]; L[i:i+len(s)]+=s*g*(1-max(0,pan)); R[i:i+len(s)]+=s*g*(1+min(0,pan))
def env(n,a,r):
    e=np.ones(n); na=max(1,int(a*SR)); nr=max(1,int(r*SR)); e[:na]=np.linspace(0,1,na); e[-nr:]*=np.linspace(1,0,nr); return e
def lp(x,fc):
    a=np.exp(-2*np.pi*fc/SR); y=np.empty_like(x); s=0.0
    for i,v in enumerate(x): s=(1-a)*v+a*s; y[i]=s
    return y
def whoosh(t0,dur=0.5,up=True,g=0.5,pan=0.0):
    n=int(dur*SR); x=rng.standard_normal(n); fc=np.linspace(400,6500,n) if up else np.linspace(6500,400,n)
    y=np.zeros(n); s=0.0
    for i in range(n):
        a=np.exp(-2*np.pi*fc[i]/SR); s=(1-a)*x[i]+a*s; y[i]=s
    add(y*7*np.sin(np.pi*np.linspace(0,1,n))**1.3,t0,g,pan)
def pop(t0,g=0.5,f0=500,f1=1100):
    n=int(0.16*SR); f=np.linspace(f0,f1,n); add(np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.004,0.1),t0,g)
def thud(t0,g=0.8,f0=90):
    n=int(0.8*SR); t=tt(n); f=f0*np.exp(-t*7)+40; add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*6)+lp(rng.standard_normal(n),600)*np.exp(-t*30)*0.6,t0,g)
def ping(t0,g=0.4,f=1320,pan=0.3):
    n=int(0.9*SR); t=tt(n); add((np.sin(2*np.pi*f*t)+0.4*np.sin(2*np.pi*f*2*t))*np.exp(-t*5),t0,g,pan)
def tick(t0,g=0.25,f=2600):
    n=int(0.03*SR); t=tt(n); add(rng.standard_normal(n)*np.exp(-t*150)*np.sin(2*np.pi*f*t+1),t0,g)
def beep(t0,f=1500,g=0.3,dur=0.08):
    n=int(dur*SR); add(np.sin(2*np.pi*f*tt(n))*env(n,0.003,0.05),t0,g)
def chime(t0,notes,g=0.25,gap=0.07):
    for k,f in enumerate(notes):
        n=int(1.8*SR); t=tt(n); add((np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*2*f*t))*np.exp(-t*3.0),t0+k*gap,g,(k%2-0.5)*0.6)
def riser(t0,dur,g=0.35):
    n=int(dur*SR); t=tt(n); f=300*np.exp(t/dur*np.log(8)); add((np.sin(2*np.pi*np.cumsum(f)/SR)*0.4+lp(rng.standard_normal(n),5000)*0.8)*np.linspace(0,1,n)**2,t0,g)
def sweepdown(t0,dur=0.7,g=0.4):
    n=int(dur*SR); t=tt(n); f=1800*np.exp(-t/dur*3.2); add(np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.01,0.3),t0,g)
def sparkle(t0,g=0.2):
    for k in range(10): ping(t0+k*0.05,g*(1-k/12),1800+rng.random()*3000,rng.random()-0.5)
def water(t0,dur=1.2,g=0.5):
    n=int(dur*SR); x=lp(rng.standard_normal(n),2500)*np.sin(np.pi*np.linspace(0,1,n))**1.2; add(x*3,t0,g)

# ---- title / chapters
thud(O('R',0.25),0.9); whoosh(O('R',0.15),0.35,True,0.45); riser(O('R',0.0)+0.0,0.25,0.15)
for clip,ct in (('R',3.3),('R',10.55),('R',24.1),('R',36.15),('R',44.35),('B',0.15),('S',1.6)):
    t=O(clip,ct); pop(t+0.1,0.35,600,1300); whoosh(t,0.4,True,0.3); tick(t+0.55,0.15)
# ---- cuts
for i,s in enumerate(segs[:-1]):
    b=s['start']+s['d']; k=s['trans']
    if k=='whip': whoosh(b-0.12,0.35,True,0.6); thud(b,0.3,70)
    elif k=='zoom': whoosh(b-0.2,0.45,True,0.55); thud(b,0.4,60)
    elif k=='flash': whoosh(b-0.12,0.3,True,0.5); pop(b,0.3,900,1800)
    elif k=='wave': water(b-0.55,1.2,0.65); whoosh(b-0.5,0.8,True,0.35)
# ---- road
for ct in (4.4,26.9): ping(O('R',ct),0.35)
pop(O('R',6.9),0.45,400,900); pop(O('R',11.0),0.55,350,1000); thud(O('R',11.0),0.35)
for ct in (11.45,17.5): whoosh(O('R',ct),0.45,True,0.3,-0.3)
for k,tb in enumerate(np.arange(22.0,23.4,0.1)): tick(O('R',tb),0.12,2000+k*150)
ping(O('R',23.5),0.4,1760)
thud(O('R',24.3),0.9); pop(O('R',24.3),0.5,300,800); chime(O('R',24.5),[784,988,1175],0.2)
for ct in (37.35,39.85): beep(O('R',ct),1200,0.3); beep(O('R',ct)+0.1,1700,0.3)
pop(O('R',45.6),0.55,300,1000); chime(O('R',45.6),[523,659,784,1047,1319],0.22,0.08); sparkle(O('R',45.65))
# ---- beach
for k in range(5): beep(O('B',0.2)+k*0.33,900 if k%2==0 else 700,0.3)
n=int(0.6*SR); add(lp(rng.standard_normal(n),3500)*np.exp(-tt(n)*6)*0.9,O('B',1.0),0.5); pop(O('B',1.0),0.35,500,900)
pop(O('B',3.0),0.5,500,1200); ping(O('B',4.9),0.35)
for k,tb in enumerate(np.arange(11.2,12.4,0.1)): tick(O('B',tb),0.12,2000+k*150)
# ---- surf
whoosh(O('S',17.9),0.5,True,0.35); ping(O('S',5.5),0.3,1500); ping(O('S',17.9),0.3,1500)
for ct in (19.8,24.8,27.3,29.5,32.2): tick(O('S',ct),0.25,3200)
pop(O('S',28.4),0.45,400,900)
chime(O('S',29.7),[659,784,988,1319],0.25,0.07); sparkle(O('S',29.75),0.15)
sweepdown(O('S',29.4),0.8,0.35)   # replay rewind
pop(O('S',32.4),0.45,500,1300); sparkle(O('S',32.45),0.2)
pop(O('S',39.75),0.5,300,700); thud(O('S',39.9),0.9,60); sweepdown(O('S',39.8),0.7,0.3)
for k in range(2): beep(O('S',40.3)+k*0.25,500,0.3,0.15)
ping(O('S',45.9),0.3,1700); ping(O('S',46.8),0.35,1400)
whoosh(O('S',54.2),0.5,True,0.35); ping(O('S',54.6),0.3,1320)
# ---- end card
E=CUT
thud(E,1.0,70); whoosh(E-0.1,0.5,True,0.5)
chime(E+0.25,[392,494,587,784],0.25,0.1)
for tb in (0.5,0.8,1.1,1.4): whoosh(E+tb-0.1,0.3,True,0.3); pop(E+tb+0.2,0.3,500,900)
chime(E+2.0,[523,659,784,1047],0.25,0.08)
# warm outro pad
n=int(4.0*SR); t=tt(n); pad=np.zeros(n)
for f in (130.8,196,261.6,329.6,392):
    for d in (-0.4,0.4): pad+=np.sin(2*np.pi*(f+d)*t)+0.25*np.sin(4*np.pi*(f+d)*t)
add(lp(pad,1800)/10*np.sin(np.pi*np.linspace(0,1,n))**1.2,E,0.35)
pk=max(abs(L).max(),abs(R).max()); L/=pk; R/=pk
pcm=(np.stack([L,R],1)*0.9*32767).astype(np.int16)
w=wave.open('audio/sfx.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close(); print('sfx ok',DUR)
