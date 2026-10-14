"""SFX layer for the road-trip edit -> audio/sfx.wav (original audio + radio stay untouched)."""
import numpy as np, wave
SR=44100; DUR=54.67; N=int(SR*DUR); rng=np.random.default_rng(5)
L=np.zeros(N); R=np.zeros(N)
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
def whoosh(t0,dur=0.5,up=True,g=0.5):
    n=int(dur*SR); x=rng.standard_normal(n); fc=np.linspace(400,6000,n) if up else np.linspace(6000,400,n)
    y=np.zeros(n); s=0.0
    for i in range(n):
        a=np.exp(-2*np.pi*fc[i]/SR); s=(1-a)*x[i]+a*s; y[i]=s
    add(y*7*np.sin(np.pi*np.linspace(0,1,n))**1.3,t0,g)
def pop(t0,g=0.5,f0=500,f1=1100):
    n=int(0.16*SR); t=tt(n); f=np.linspace(f0,f1,n); add(np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.004,0.1),t0,g)
def thud(t0,g=0.8):
    n=int(0.7*SR); t=tt(n); f=90*np.exp(-t*7)+40; add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*6)+lp(rng.standard_normal(n),600)*np.exp(-t*30)*0.6,t0,g)
def ping(t0,g=0.4,f=1320):
    n=int(0.9*SR); t=tt(n); add((np.sin(2*np.pi*f*t)+0.4*np.sin(2*np.pi*f*2*t))*np.exp(-t*5),t0,g,0.3)
def tick(t0,g=0.25,f=2600):
    n=int(0.03*SR); t=tt(n); add(rng.standard_normal(n)*np.exp(-t*150)*np.sin(2*np.pi*f*t+1),t0,g)
def beep(t0,f=1500,g=0.3): 
    n=int(0.08*SR); add(np.sin(2*np.pi*f*tt(n))*env(n,0.003,0.05),t0,g)
def chime(t0,notes,g=0.25,gap=0.07):
    for k,f in enumerate(notes):
        n=int(1.6*SR); t=tt(n); add((np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*2*f*t))*np.exp(-t*3.2),t0+k*gap,g,(k%2-0.5)*0.6)
def riser(t0,dur,g=0.35):
    n=int(dur*SR); t=tt(n); f=300*np.exp(t/dur*np.log(8)); add((np.sin(2*np.pi*np.cumsum(f)/SR)*0.4+lp(rng.standard_normal(n),5000)*0.8)*np.linspace(0,1,n)**2,t0,g)
# title
thud(0.2,0.9); whoosh(0.1,0.3,True,0.4); pop(0.3,0.35)
# chapter pops + swipes at cuts
for T in (10.83,24.1): whoosh(T-0.25,0.5,True,0.6); pop(T,0.4,600,1300)
for T in (36.4,44.0): pop(T,0.4,600,1300); whoosh(T-0.1,0.3,True,0.3)
# pins
for T in (4.4,26.9): ping(T,0.35)
# stickers
pop(6.9,0.45,400,900); pop(11.0,0.55,350,1000); thud(11.0,0.4); pop(31.9,0.45,450,950)
# name tags
whoosh(11.35,0.4,True,0.35); whoosh(17.35,0.4,True,0.4); tick(17.4,0.4)
# chill meter
for k,tb in enumerate(np.arange(22.0,23.5,0.1)): tick(tb,0.12,2000+k*150)
ping(23.5,0.4,1760)
# beach stamp
thud(24.3,0.9); pop(24.3,0.5,300,800); chime(24.5,[784,988,1175],0.2)
# rv lock-ons
for T in (37.35,39.85,48.9): beep(T,1200,0.3); beep(T+0.1,1700,0.3)
# beautiful
chime(44.6,[523,659,784,1047,1319],0.22)
# end
riser(52.5,0.7,0.3); thud(53.2,1.0); chime(53.25,[392,494,587,784],0.25,0.1); whoosh(53.2,0.9,False,0.35)
pk=max(abs(L).max(),abs(R).max()); L/=pk; R/=pk
pcm=(np.stack([L,R],1)*0.9*32767).astype(np.int16)
w=wave.open('audio/sfx.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close(); print('ok')
