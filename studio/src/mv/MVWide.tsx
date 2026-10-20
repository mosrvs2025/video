// 16:9 music video: 3D story world full-bleed on the left, a large readable phone on the right.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {World} from './World';
import {useSignals, tempAt, frostAt, Phone} from './MV';

const W = 1920, H = 1080;
const SANS = 'Inter, sans-serif', SERIF = '"FreeSerif", "DejaVu Serif", serif', MONO = '"DejaVu Sans Mono", monospace';
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const easeOutExpo = (x: number) => { const c = clamp(x); return c >= 1 ? 1 : 1 - Math.pow(2, -10 * c); };
const easeOutBack = (x: number, s = 1.6) => { const c = clamp(x); return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2); };
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, u: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(u)))).join(',')})`; };

// phone placement: the 1080x1920 phone layer, scaled and moved to the right third
const PS = 0.78, PL = 1160, PT = -88;

const GRAIN = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!; const d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } g.putImageData(d, 0, 0); return c.toDataURL(); } catch { return ''; } })();

const Plate: React.FC<{children: React.ReactNode; o: number; c: number}> = ({children, o, c}) => (
  <div style={{position: 'absolute', left: 64, bottom: 64, maxWidth: 1120, opacity: o}}>
    <div style={{padding: '20px 40px 24px', borderRadius: 36, background: `linear-gradient(180deg, rgba(5,12,20,${0.45 + c * 0.1}), rgba(5,12,20,.68))`, border: '1.5px solid rgba(180,225,255,.18)'}}>{children}</div>
  </div>
);
const accentTxt = (txt: string, color: string) => txt.split('*').map((seg, i) => i % 2 ? <span key={i} style={{fontFamily: SANS, fontWeight: 900, fontStyle: 'normal', color, letterSpacing: -1, textShadow: `0 0 26px ${color}88`}}>{seg}</span> : <span key={i}>{seg}</span>);

const Lyrics: React.FC<{mv: any; sig: any}> = ({mv, sig}) => {
  const {t, c} = sig; const accent = mix('#ffb869', '#8fd8ff', c);
  const L = (mv.lines as any[]).find((l) => t >= l.t0 - 0.1 && t < l.t1 + (l.hold ?? 1.5)); if (!L) return null;
  const o = clamp((t - (L.t0 - 0.1)) / 0.2) * clamp((L.t1 + (L.hold ?? 1.5) - t) / 0.35); const words = L.text.split(' ');
  return (
    <Plate o={o} c={c}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 70, lineHeight: 1.1, color: '#fff', whiteSpace: 'nowrap'}}>
        {words.map((w: string, i: number) => { const p = easeOutExpo((t - L.tm[i]) / 0.35), on = t >= L.tm[i], cur = on && (i === words.length - 1 || t < L.tm[i + 1]);
          return <span key={i} style={{display: 'inline-block', marginRight: 16, opacity: on ? 0.35 + 0.65 * p : 0.18, transform: `translateY(${(1 - p) * 16}px)`, color: cur ? accent : '#fff', textShadow: cur ? `0 0 30px ${accent}aa` : undefined}}>{w}</span>; })}
      </div>
    </Plate>
  );
};
const Narr: React.FC<{mv: any; sig: any}> = ({mv, sig}) => {
  const {t, c} = sig; const accent = mix('#ffb869', '#8fd8ff', c);
  const N = (mv.narr as any[]).find((n) => t >= n.a && t < n.b); if (!N) return null;
  const lt = t - N.a, o = clamp(lt / 0.3) * clamp((N.b - t) / 0.4), p = easeOutExpo(lt / 0.6);
  return <Plate o={o} c={c}><div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 60, color: '#eaf6ff', transform: `translateY(${(1 - p) * 14}px)`, whiteSpace: 'nowrap'}}>{accentTxt(N.text, accent)}</div></Plate>;
};
const Motif: React.FC<{mv: any; sig: any}> = ({mv, sig}) => {
  const {t, c, pulse} = sig; const m = (mv.motif as any[]).find((k) => t >= k.t && t < k.t + 2.8); if (!m) return null;
  if ((mv.narr as any[]).some((n) => t >= n.a && t < n.b)) return null;
  const lt = t - m.t, o = clamp(lt / 0.2) * clamp((2.8 - lt) / 0.8);
  return <Plate o={o * 0.95} c={c}><div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 62, color: '#cfeaff', letterSpacing: 2 + lt * 3, textShadow: `0 0 ${24 + pulse * 20}px #8fd8ffaa`}}>So cold, for you</div></Plate>;
};
// chapter cards help the audience follow the arc
const Chapter: React.FC<{mv: any; sig: any}> = ({mv, sig}) => {
  const {t, c} = sig; const ch = ((mv.chapters || []) as any[]).filter((k) => t >= k.t && t < k.t + 4.2).pop(); if (!ch) return null;
  const lt = t - ch.t, o = clamp(lt / 0.5) * clamp((4.2 - lt) / 0.8), p = easeOutExpo(lt / 0.9);
  return (
    <div style={{position: 'absolute', left: 64, top: 190, opacity: o}}>
      <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: mix('#ffcf9a', '#9fd8ff', c)}}>{ch.n}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: '#fff', marginTop: 6, transform: `translateX(${(1 - p) * -30}px)`, textShadow: '0 4px 24px rgba(0,0,0,.7)'}}>{ch.title}</div>
    </div>
  );
};
const Gauge: React.FC<{mv: any; sig: any}> = ({mv, sig}) => {
  const {t, c} = sig; if (t < 4) return null; const v = tempAt(mv, t); const p = clamp((v + 40) / 112); const o = easeOutExpo((t - 4) / 0.8) * (t > 188 ? 0 : 1);
  return (
    <div style={{position: 'absolute', left: 64, top: 104, width: 560, height: 58, opacity: o, borderRadius: 29, background: 'rgba(8,16,26,.55)', border: '1.5px solid rgba(180,225,255,.2)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 26px', boxSizing: 'border-box'}}>
      <span style={{fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: '#fff', fontWeight: 700}}>TONE</span>
      <div style={{flex: 1, height: 12, borderRadius: 6, background: 'linear-gradient(90deg,#4aa8ff,#bfe8ff 45%,#ffb869 75%,#ff7a3a)', position: 'relative'}}>
        <div style={{position: 'absolute', left: `${p * 100}%`, top: -8, width: 6, height: 28, borderRadius: 3, background: '#fff', transform: 'translateX(-3px)', boxShadow: '0 0 12px #fff'}} />
      </div>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, color: mix('#ffb869', '#8fd8ff', c), width: 84, textAlign: 'right'}}>{Math.round(v)}°</span>
    </div>
  );
};
const FrostW: React.FC<{f: number; pulse: number}> = ({f, pulse}) => {
  if (f < 0.03) return null; const thr = 1.05 - f * 0.55;
  const m = `radial-gradient(ellipse ${82 - f * 16}% ${78 - f * 16}% at 50% 50%, transparent 0%, transparent 58%, #000 100%)`;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', WebkitMaskImage: m, maskImage: m, mixBlendMode: 'screen', opacity: 0.5 + 0.25 * f}}>
      <svg width={W} height={H}><filter id="frostw" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.026" numOctaves={5} seed={4} /><feColorMatrix type="matrix" values={`0 0 0 0 0.62  0 0 0 0 0.86  0 0 0 0 1  3.2 0 0 0 ${(-3.2 * thr).toFixed(2)}`} /><feGaussianBlur stdDeviation="1.2" /></filter>
        <rect width={W} height={H} filter="url(#frostw)" opacity={0.8 + pulse * 0.2} /></svg>
    </div>
  );
};

export const MVWide: React.FC<{mv: any}> = ({mv}) => {
  const frame = useCurrentFrame();
  if (!mv || !mv.spectrum) return <AbsoluteFill style={{background: '#000'}} />;
  const sig = useSignals(mv, frame); const {t, c, pulse, down} = sig;
  const fadeIn = clamp(frame / 20); const frost = frostAt(t);
  const camS = 1 + 0.01 * pulse + (t > 132 && t < 172 ? 0.01 * down : 0);
  const flashWhite = (t > 132 && t < 172 ? down * 0.12 : 0) + (t > 42.6 && t < 43.0 ? 0.22 * (1 - (t - 42.6) / 0.4) : 0);
  const sub = (mv.subliminal as any[]).find((s) => t >= s.t && t < s.t + 0.1);
  const mem = ((mv.memories || []) as any[]).find((m) => t >= m.a && t < m.b && t > 4.4);
  const phoneIn = easeOutExpo((t - 2.2) / 1.2), phoneOut = t > 189 ? 0 : 1;
  const focus = (mv.focus || []).some((k: any) => t >= k.a && t < k.b) ? 1 : 0; // moments where the phone is the story
  const lastWord = t >= mv.end.lastAt && t < mv.end.lastAt + 11 ? easeOutBack((t - mv.end.lastAt) / 0.6) : 0;
  const ttl = t < 4.6 ? clamp(t / 0.6) * clamp((4.4 - t) / 0.6) : 0;
  return (
    <AbsoluteFill style={{background: '#000', opacity: fadeIn, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${camS})`}}><World mv={mv} sig={sig} w={W} h={H} fs={0.86} shift={mv.shift ?? 9} shadows={!!mv.shadows} /></AbsoluteFill>
      {mem && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 35% 45%, rgba(255,190,120,.10), rgba(60,30,10,.34) 100%)', mixBlendMode: 'multiply'}} />}
      {/* right-side shade so the phone reads, deeper when the phone is the story */}
      <AbsoluteFill style={{background: `linear-gradient(90deg, rgba(0,0,0,0) 46%, rgba(2,6,12,${0.55 + 0.2 * focus}) 72%, rgba(2,6,12,${0.75 + 0.15 * focus}) 100%)`}} />
      <AbsoluteFill style={{background: '#02050a', opacity: 0.0 + 0.3 * focus * smooth(1)}} />
      <div style={{position: 'absolute', left: PL + (1 - phoneIn) * 500, top: PT, width: 1080, height: 1920, transform: `scale(${PS})`, transformOrigin: '0 0', opacity: phoneOut}}><Phone mv={mv} sig={sig} /></div>
      <FrostW f={frost} pulse={pulse} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 40% 50%, transparent 55%, rgba(0,0,0,.55) 100%)'}} />
      <AbsoluteFill style={{backgroundImage: `url(${GRAIN})`, backgroundPosition: `${(frame * 37) % 256}px ${(frame * 91) % 256}px`, opacity: 0.9, mixBlendMode: 'overlay'}} />
      {t > 4.4 && <div style={{position: 'absolute', left: 64, top: 52, fontFamily: MONO, fontSize: 22, letterSpacing: 7, color: 'rgba(255,255,255,.72)', opacity: easeOutExpo((t - 4.4) / 0.8) * (t > 188 ? 0 : 1)}}>{mv.title.toUpperCase()} <span style={{opacity: 0.55}}>· {mv.artist}</span></div>}
      <Gauge mv={mv} sig={sig} />
      {mem && <div style={{position: 'absolute', left: 64, top: 850, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: '#ffe2b8', opacity: clamp((t - mem.a) / 0.4) * clamp((mem.b - t) / 0.4) * (0.75 + 0.25 * (Math.floor(t * 2) % 2)), textShadow: '0 0 12px rgba(0,0,0,.8)'}}><span style={{color: '#ff6a5a'}}>●</span> MEMORY · {mem.label}</div>}
      <Chapter mv={mv} sig={sig} />
      <Lyrics mv={mv} sig={sig} /><Narr mv={mv} sig={sig} /><Motif mv={mv} sig={sig} />
      {lastWord > 0 && t < 172 && <div style={{position: 'absolute', left: 0, width: 1240, top: 380, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 210, letterSpacing: -6, color: '#eaf8ff', opacity: clamp((mv.end.lastAt + 10 - t) / 1.5) * clamp(lastWord), transform: `scale(${0.6 + 0.4 * lastWord})`, textShadow: '0 0 80px #8fd8ffcc'}}>{mv.end.last}</div>}
      {ttl > 0 && <div style={{position: 'absolute', inset: 0, opacity: ttl, background: 'radial-gradient(ellipse at 50% 50%, rgba(8,10,14,.5), rgba(0,0,0,.75))'}}>
        {['SO COLD,', 'FOR YOU'].map((p, k) => <div key={k} style={{position: 'absolute', left: 0, width: W, top: 330 + k * 170, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 170, letterSpacing: -6, color: k ? '#ffb869' : '#fff'}}>
          {Array.from(p).map((ch, i) => { const q = easeOutExpo((t - 0.3 - k * 0.3 - i * 0.04) / 0.8); return <span key={i} style={{display: 'inline-block', opacity: q, transform: `translateY(${(1 - q) * 70}px)`, whiteSpace: 'pre'}}>{ch}</span>; })}
        </div>)}
        <div style={{position: 'absolute', left: 0, width: W, top: 700, textAlign: 'center', fontFamily: MONO, fontSize: 32, letterSpacing: 14, color: 'rgba(255,255,255,.8)', opacity: easeOutExpo((t - 1.6) / 0.8)}}>{mv.artist.toUpperCase()}</div>
      </div>}
      <AbsoluteFill style={{background: '#fff', opacity: flashWhite, mixBlendMode: 'screen'}} />
      {sub && <AbsoluteFill style={{background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 200, letterSpacing: -4, color: '#fff'}}>{sub.text}</div></AbsoluteFill>}
      {t >= 189 && <AbsoluteFill style={{background: '#000'}}><div style={{position: 'absolute', left: 0, width: W, top: 440, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 84, color: '#cfeaff', opacity: easeOutExpo((t - 189.2) / 0.8)}}>{mv.end.final}</div><div style={{position: 'absolute', left: 0, width: W, top: 580, textAlign: 'center', fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: 'rgba(255,255,255,.55)', opacity: easeOutExpo((t - 190) / 0.8)}}>{mv.end.credit}</div></AbsoluteFill>}
    </AbsoluteFill>
  );
};
