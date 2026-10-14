"""Score + SFX for the AI/human video (numpy only) -> audio/score.wav"""
import numpy as np, wave
SR=44100; DUR=50.0; N=int(SR*DUR)
rng=np.random.default_rng(11)
L=np.zeros(N); R=np.zeros(N); T=np.arange(N)/SR
def tt(n): return np.arange(n)/SR
def add(sig,t0,g=1.0,pan=0.0):
    i=int(t0*SR)
    if i>=N or i<0: return
    sig=sig[:N-i]; L[i:i+len(sig)]+=sig*g*(1-max(0,pan)); R[i:i+len(sig)]+=sig*g*(1+min(0,pan))
def lp(x,fc):
    a=np.exp(-2*np.pi*fc/SR); y=np.empty_like(x); s=0.0
    for i,v in enumerate(x): s=(1-a)*v+a*s; y[i]=s
    return y
def midi(m): return 440*2**((m-69)/12)
def env(n,a,r):
    e=np.ones(n); na=max(1,int(a*SR)); nr=max(1,int(r*SR)); e[:na]=np.linspace(0,1,na); e[-nr:]*=np.linspace(1,0,nr); return e
def pluck(t0,f,g=0.3,dur=1.6,pan=0.0,bright=1.0):
    n=int(dur*SR); t=tt(n); s=np.zeros(n)
    for k,a in ((1,1),(2,.5*bright),(3,.25*bright),(4,.12*bright)): s+=a*np.sin(2*np.pi*f*k*t)*np.exp(-t*(2.5+k*1.6))
    add(s*env(n,0.003,0.2),t0,g,pan)
def pad(t0,dur,notes,g=0.12,saw=False,cut=1800):
    n=int(dur*SR); t=tt(n); s=np.zeros(n)
    for f in notes:
        for d in (-0.5,0.5):
            if saw: s+=2*((t*(f+d))%1)-1
            else: s+=np.sin(2*np.pi*(f+d)*t)+0.25*np.sin(4*np.pi*(f+d)*t)
    s=lp(s,cut)/(len(notes)*2)
    add(s*np.sin(np.pi*np.linspace(0,1,n))**1.4,t0,g)
def thud(t0,g=1.0,f0=70):
    n=int(0.9*SR); t=tt(n); f=f0*np.exp(-t*6)+34
    add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*6)*1.2+lp(rng.standard_normal(n),500)*np.exp(-t*28),t0,g)
def boom(t0,g=1.0):
    n=int(2.4*SR); t=tt(n); f=36+100*np.exp(-t*7)
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*2.0)+lp(rng.standard_normal(n),900)*np.exp(-t*12)*0.7
    add(s,t0,0.9*g)
def whoosh(t0,dur=0.9,up=True,g=0.4):
    n=int(dur*SR); x=rng.standard_normal(n); fc=np.linspace(300,5500,n) if up else np.linspace(5500,300,n)
    y=np.zeros(n); s=0.0
    for i in range(n):
        a=np.exp(-2*np.pi*fc[i]/SR); s=(1-a)*x[i]+a*s; y[i]=s
    add(y*6*np.sin(np.pi*np.linspace(0,1,n))**1.5,t0,g)
def riser(t0,dur,g=0.4,f1=40):
    n=int(dur*SR); t=tt(n); f=200*np.exp(t/dur*np.log(f1))
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*0.5+lp(rng.standard_normal(n),4500)*np.linspace(0,1,n)**2
    add(s*np.linspace(0,1,n)**2,t0,g)
def tick(t0,g=0.2,f=3000):
    n=int(0.03*SR); t=tt(n); add(rng.standard_normal(n)*np.exp(-t*160)*np.sin(2*np.pi*f*t+1),t0,g)
def blip(t0,f,g=0.2,dur=0.12,pan=0.0):
    n=int(dur*SR); t=tt(n); add(np.sign(np.sin(2*np.pi*f*t))*0.5*env(n,0.003,0.08)+np.sin(2*np.pi*f*t)*0.5*env(n,0.003,0.08),t0,g,pan)
def crackle(t0,dur,g=0.3):
    n=int(dur*SR); x=np.zeros(n)
    for _ in range(int(dur*60)):
        a=int(rng.random()*(n-300)); x[a:a+200]+=rng.standard_normal(200)*np.exp(-np.arange(200)/25)*rng.random()
    add(x*np.sin(np.pi*np.linspace(0,1,n)),t0,g)
def glass(t0,g=0.5):
    for k in range(9):
        f=2200+rng.random()*3800; n=int(0.9*SR); t=tt(n)
        add(np.sin(2*np.pi*f*t)*np.exp(-t*(6+rng.random()*6))*0.3,t0+k*0.012,g,pan=rng.random()-0.5)
    n=int(0.3*SR); add(rng.standard_normal(n)*np.exp(-tt(n)*25),t0,g*0.8)
def servo(t0,dur,g=0.2):
    n=int(dur*SR); t=tt(n); f=180+60*np.sin(t*7)+40*t/dur*10
    add(lp(2*((np.cumsum(f)/SR)%1)-1,1200)*env(n,0.1,0.2),t0,g)

# ---------- warm pad bed: 0..21.8, returns 44.5..50
warm=[[110,164.8,220,261.6,329.6],[87.3,130.8,174.6,220,261.6],[130.8,196,261.6,329.6,392],[98,146.8,196,246.9,293.7]]
for i in range(6):
    t0=5.0+i*4.0
    if t0<21.85: pad(t0-0.2,4.8,warm[i%4],0.15)
pad(0.0,5.6,[55,110,164.8],0.12)
# return: major, hopeful F maj7 -> C -> Am -> F
ret=[[87.3,174.6,220,261.6,329.6,349.2],[130.8,261.6,329.6,392,523.3],[110,220,261.6,329.6,440],[87.3,174.6,261.6,349.2,440]]
for i,ch in enumerate(ret): pad(44.4+i*1.4,2.6,ch,0.17)
# ---------- cold section
cold=[[73.4,110,146.8,174.6,220],[58.3,87.3,116.5,146.8,174.6],[65.4,98,130.8,155.6,196],[55,82.4,110,130.8,164.8]]
for i in range(3):
    t0=21.85+i*3.7
    pad(t0-0.1,4.5,cold[i%4],0.14,saw=True,cut=900+i*350)
# tension drop 32.8..35.4: bare drone
pad(32.7,3.2,[55,58.3],0.18,saw=True,cut=300)
pad(35.3,5.0,[49,73.4],0.14,saw=True,cut=420)
pad(39.9,4.8,[55,82.4,110],0.16,saw=True,cut=1400)
# ---------- warm plucks (A minor pentatonic), 5.4 - 21.8
pent=[57,60,62,64,67,69,72]
step=60/96/2
k=0
for tt0 in np.arange(5.5,21.6,step):
    if int(tt0/step)%2==0 or rng.random()>0.5:
        pluck(tt0,midi(pent[(k*3+int(rng.random()*2))%len(pent)]+ (12 if k%5==0 else 0)),0.11,1.4,pan=(k%3-1)*0.3)
    k+=1
# ---------- cold pulse: 21.9-32.7 sub pulse + blips + ticks
for tb in np.arange(22.0,32.7,0.5): thud(tb,0.35+0.15*(tb>26),f0=55)
for tb in np.arange(22.0,32.7,0.125): tick(tb,0.04+0.03*((tb*8)%2<1),f=6500)
arp=[62,65,69,74,72,69,65,69]
for j,tb in enumerate(np.arange(22.3,32.5,0.25)): blip(tb,midi(arp[j%8]+(12 if (tb>27) else 0)),0.05+0.05*min(1,(tb-22)/8),0.1,pan=(j%2)-0.5)
# 35.4-39.9: sparse
for tb in (35.6,36.4,37.2,38.6): pluck(tb,midi(50+int(rng.random()*5)),0.12,2.4,bright=0.4)
for tb in np.arange(40.0,44.3,0.75): thud(tb,0.5,f0=60)
for tb in np.arange(40.0,44.3,0.1875): tick(tb,0.04,f=7000)
# return arpeggio 44.5-48
arp2=[65,69,72,77,81,77,72,69]
for j,tb in enumerate(np.arange(44.6,48.2,0.2)): pluck(tb,midi(arp2[j%8]),0.13,1.8,pan=(j%3-1)*0.3)
# heartbeat in intro + finale
for tb in np.arange(0.0,5.4,0.9): thud(tb,0.5,f0=62); thud(tb+0.22,0.3,f0=58)
for tb in np.arange(44.6,48.2,0.8): thud(tb,0.55,f0=64); thud(tb+0.22,0.35,f0=58)
# ---------- cues
riser(3.9,1.55,0.35); boom(5.46,0.9); whoosh(5.3,0.3,True,0.3)
for i in range(8): pluck(5.5+i*0.16,midi(45+i*2),0.08,0.7)
thud(10.3,1.3); whoosh(10.2,0.2,True,0.3); whoosh(11.05,0.4,False,0.3)
for tb in np.arange(11.3,13.9,0.1): tick(tb,0.12,2600+int((tb-11.3)*600))
pluck(13.3,midi(81),0.15,2.0); whoosh(15.1,0.25,True,0.3)
crackle(16.0,1.6,0.28); pluck(16.1,midi(76),0.1,1.0)
for tb in (17.9,): pluck(tb,midi(79),0.12,1.2); pluck(tb+0.08,midi(86),0.08,1.2)
servo(19.5,1.9,0.2); blip(20.9,1200,0.2,0.2)
riser(20.2,1.65,0.45); boom(21.85,1.2); whoosh(21.7,0.2,True,0.5)
for tb,f in ((26.9,1500),(27.9,1800),(28.9,2100),(30.0,2500)): blip(tb,f,0.25,0.15); pluck(tb,midi(86),0.08,1.0)
whoosh(30.8,0.7,True,0.4)
whoosh(32.6,0.25,False,0.5)
boom(36.85,0.9); glass(36.9,0.7)
riser(40.0,4.4,0.35,f1=60)
thud(43.6,1.4); whoosh(44.3,0.3,True,0.6); boom(44.5,1.0)
whoosh(48.0,0.2,True,0.3); boom(48.2,1.3)
for k in range(12): pluck(48.3+k*0.07,midi(72+[0,4,7,11,12,16,19,23,24,28,31,35][k]),0.07,1.6,pan=(k%2)-0.5)
# ---------- master
peak=max(np.abs(L).max(),np.abs(R).max()); L/=peak; R/=peak
fade=np.clip((DUR-T)/1.5,0,1); L*=fade*0.9; R*=fade*0.9
pcm=(np.stack([L,R],1)*32767).astype(np.int16)
w=wave.open('audio/score.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close(); print('ok')
