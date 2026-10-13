"""Synthesize the score + SFX for the bird edit (numpy only). Writes audio/score.wav (stereo 44.1k)."""
import numpy as np, wave, sys
SR=44100; DUR=45.5; N=int(SR*DUR)
rng=np.random.default_rng(7)
L=np.zeros(N); R=np.zeros(N)
def tt(n): return np.arange(n)/SR
def add(sig,t0,gain=1.0,pan=0.0):
    i=int(t0*SR)
    if i>=N: return
    sig=sig[:N-i]
    L[i:i+len(sig)]+=sig*gain*(1-max(0,pan)); R[i:i+len(sig)]+=sig*gain*(1+min(0,pan))
def lp(x,fc):  # one-pole lowpass
    a=np.exp(-2*np.pi*fc/SR); y=np.empty_like(x); s=0.0
    for i,v in enumerate(x): s=(1-a)*v+a*s; y[i]=s
    return y
def env(n,a,r):
    e=np.ones(n); na=max(1,int(a*SR)); nr=max(1,int(r*SR))
    e[:na]=np.linspace(0,1,na); e[-nr:]*=np.linspace(1,0,nr); return e
def boom(t0,g=1.0):
    n=int(2.2*SR); t=tt(n); f=38+90*np.exp(-t*7)
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*2.2)
    s+=lp(rng.standard_normal(n),900)*np.exp(-t*14)*0.7
    add(s,t0,0.9*g)
def whoosh(t0,dur=0.9,up=True,g=0.5):
    n=int(dur*SR); t=tt(n); x=rng.standard_normal(n)
    fc=np.linspace(300,5000,n) if up else np.linspace(5000,300,n)
    y=np.zeros(n); s=0.0
    for i in range(n):
        a=np.exp(-2*np.pi*fc[i]/SR); s=(1-a)*x[i]+a*s; y[i]=s
    y*=np.sin(np.pi*np.linspace(0,1,n))**1.5 if True else 1
    add(y*6,t0,g)
def riser(t0,dur,g=0.5):
    n=int(dur*SR); t=tt(n); f=200*np.exp(t/dur*np.log(40))
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*0.5+lp(rng.standard_normal(n),4000)*np.linspace(0,1,n)**2*1.2
    add(s*np.linspace(0,1,n)**2,t0,g)
def beep(t0,f=1250,dur=0.09,g=0.35):
    n=int(dur*SR); t=tt(n); add(np.sin(2*np.pi*f*t)*env(n,0.004,0.04),t0,g)
def tick(t0,g=0.25,f=3000):
    n=int(0.03*SR); t=tt(n); add(rng.standard_normal(n)*np.exp(-t*160)*np.sin(2*np.pi*f*t+1),t0,g)
def shutter(t0):
    for d,gg in ((0,0.6),(0.07,0.45)):
        n=int(0.05*SR); t=tt(n); add(rng.standard_normal(n)*np.exp(-t*90),t0+d,gg)
def thud(t0,g=1.0):
    n=int(0.8*SR); t=tt(n); f=70*np.exp(-t*6)+35
    add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7)*1.2+lp(rng.standard_normal(n),600)*np.exp(-t*30),t0,g)
def glitch(t0,dur=0.9,g=0.4):
    n=int(dur*SR); x=np.zeros(n)
    for k in range(14):
        a=int(rng.random()*n*0.9); m=int(rng.random()*0.06*SR)+200
        x[a:a+m]+=rng.standard_normal(min(m,n-a))*(rng.random()*0.8+0.2)
    x*=np.linspace(1,0,n); add(x,t0,g)
def ping(t0,g=0.3):
    n=int(1.4*SR); t=tt(n); s=np.sin(2*np.pi*880*t)*np.exp(-t*4)+0.4*np.sin(2*np.pi*1320*t)*np.exp(-t*5)
    add(s,t0,g,pan=0.4)

# ---- pad bed: Am(add9) -> F -> C -> G drifting, 8s per chord
chords=[[110,165,220,261.6,329.6],[87.3,130.8,174.6,220,261.6],[130.8,196,261.6,329.6,392],[98,146.8,196,246.9,293.7]]
pad=np.zeros(N); t=tt(N)
for i,ch in enumerate(chords*3):
    t0=i*8.0-0.5
    if t0>=DUR: break
    n=int(9.5*SR); tn=tt(n); s=np.zeros(n)
    for f in ch:
        for det in (-0.4,0.4):
            s+=np.sin(2*np.pi*(f+det)*tn+rng.random()*6)+0.3*np.sin(2*np.pi*2*(f+det)*tn)
    s*=np.sin(np.pi*np.linspace(0,1,n))**1.6/ (len(ch)*2)
    a=int(max(0,t0)*SR); m=min(n,N-a); pad[a:a+m]+=s[:m]
# overall pad level: dark early, swell at chapter 3, tail at end
lvl=np.interp(t,[0,2,11,14,21,42,45.5],[0.25,0.5,0.55,0.35,0.85,0.8,0.0])
pad=lp(pad,1800)*lvl
L+=pad*0.55; R+=np.roll(pad,int(0.012*SR))*0.55

# ---- pulse (sub heartbeat) during tracking spans
def heart(t0,g): thud(t0,g*0.5); thud(t0+0.22,g*0.35)
for tb in np.arange(2.3,11.0,1.2): heart(tb,0.55)
for tb in np.arange(21.2,42.0,1.5): heart(tb,0.5)
# hat ticks
for tb in np.arange(21.0,42.0,0.375): tick(tb,0.05+0.03*(int(tb/0.375)%2),f=6000)

# ---- cues
for h,g in ((0.15,0.7),(0.45,0.8)): thud(h,g)
riser(0.9,1.1,0.45); whoosh(1.85,0.3,True,0.5); boom(2.0)
for k,b in enumerate((2.3,2.42,2.54)): beep(b,1000+200*k)
for tm in (3.7,4.5,5.2): tick(tm,0.35,2200)
boom(5.9,0.7); beep(5.9,1500,0.15)
shutter(9.0); whoosh(9.05,0.5,True,0.35)
glitch(11.1,0.9,0.5); whoosh(11.1,1.0,False,0.45)
beep(12.4,500,0.12,0.3)
for tm in np.arange(12.5,13.8,0.15): tick(tm,0.2,1800)
whoosh(13.8,0.3,True,0.4); boom(14.0,0.8)
for tb in np.arange(14.5,20.9,3.2): ping(tb)
tick(17.3,0.4); tick(20.0,0.4)
riser(18.8,2.2,0.55); whoosh(20.9,0.25,True,0.5); boom(21.0,1.2); glitch(20.9,0.3,0.3)
for k,b in enumerate((21.2,21.32,21.44)): beep(b,900+250*k)
whoosh(22.4,0.5,True,0.3); beep(22.6,1800,0.1,0.25)
for tm in (25.0,28.6,36.0): beep(tm,1400,0.06,0.25); tick(tm+0.2,0.2)
boom(31.6,0.8)
whoosh(41.9,0.4,True,0.4); glitch(42.0,0.3,0.3); thud(42.3,1.6); boom(42.3,0.9)
for k in range(19): tick(42.9+k/14.0,0.2,2500)

# ---- master
peak=max(np.abs(L).max(),np.abs(R).max()); L/=peak; R/=peak
fade=np.clip((DUR-t)/1.0,0,1); L*=fade*0.9; R*=fade*0.9
st=np.stack([L,R],1); pcm=(st*32767).astype(np.int16)
w=wave.open('audio/score.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok',pcm.shape)
