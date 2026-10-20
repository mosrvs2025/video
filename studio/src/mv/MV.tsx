import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';

const W = 1080, H = 1920, FPS = 30;
const SANS = 'Inter, sans-serif', SERIF = '"FreeSerif", "DejaVu Serif", serif', MONO = '"DejaVu Sans Mono", monospace';
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const easeOutExpo = (x: number) => { const c = clamp(x); return c >= 1 ? 1 : 1 - Math.pow(2, -10 * c); };
const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const easeOutBack = (x: number, s = 1.6) => { const c = clamp(x); return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2); };
const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, u: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(u)))).join(',')})`; };
const mixRaw = (a: string, b: string, u: number) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], clamp(u)))); };

type MVData = any;

// ---------- song-derived signals ----------
const useSignals = (mv: MVData, frame: number) => {
  const t = frame / FPS;
  const ph = (t - mv.ph) / mv.bp, idx = Math.floor(ph), frac = ph - idx;
  const pulse = Math.exp(-frac * 5.5), down = idx % 4 === 0 ? Math.exp(-frac * 4) : 0;
  const sp: number[] = mv.spectrum[Math.min(frame, mv.spectrum.length - 1)] || new Array(20).fill(0);
  const bass = (sp[0] + sp[1] + sp[2] + sp[3]) / 4, mid = (sp[6] + sp[7] + sp[8] + sp[9]) / 4, hi = (sp[14] + sp[15] + sp[16] + sp[17]) / 4;
  // coldness 0 (warm) .. 1 (frozen): section mood, smoothed over 3 s around boundaries
  const secs = mv.sections as {a: number; b: number; mood: number}[];
  let c = secs[0].mood;
  for (let i = 0; i < secs.length; i++) {
    const s = secs[i]; if (t >= s.a && t < s.b) {
      c = s.mood; const prev = secs[i - 1], next = secs[i + 1];
      if (prev && t - s.a < 3) c = lerp(prev.mood, s.mood, smooth((t - s.a) / 3));
      break;
    }
  }
  const sec = secs.find((s) => t >= s.a && t < s.b) || secs[secs.length - 1];
  return {t, ph, idx, frac, pulse, down, sp, bass, mid, hi, c, sec};
};

const tempAt = (mv: MVData, t: number) => {
  const k = mv.temp as {t: number; v: number}[]; if (t <= k[0].t) return k[0].v;
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1].t) return lerp(k[i].v, k[i + 1].v, smooth((t - k[i].t) / (k[i + 1].t - k[i].t)));
  return k[k.length - 1].v;
};
const frostAt = (t: number) => t < 38 ? 0.02 : t < 47 ? lerp(0.02, 0.22, smooth((t - 38) / 9)) : t < 104 ? lerp(0.22, 0.62, smooth((t - 47) / 57)) : t < 132 ? lerp(0.62, 0.8, smooth((t - 104) / 28)) : t < 172 ? lerp(0.8, 1, smooth((t - 132) / 40)) : 1;
const batteryAt = (t: number) => t < 120 ? 100 : t < 172 ? lerp(100, 14, smooth((t - 120) / 52)) : t < 186 ? lerp(14, 1, (t - 172) / 14) : t < 189 ? 1 : 0;

// ---------- 3D: snow + shards ----------
const SPRITE = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); } catch { return null; } })();
const Scene3D: React.FC<{sig: any; mv: MVData}> = ({sig, mv}) => {
  const {t, c, bass, pulse} = sig;
  const N = 520;
  const snow = useMemo(() => { const a: number[] = []; for (let i = 0; i < N; i++) a.push((rnd(i) - 0.5) * 17, rnd(i + 99) * 15, (rnd(i + 7) - 0.5) * 8 - 1); return a; }, []);
  const vis = Math.floor(N * (0.12 + 0.88 * clamp(c * 1.1 + (t > 132 ? 0.2 : 0))));
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const pos = new Float32Array(vis * 3), speed = 1.0 + c * 1.6 + bass * 1.2;
  for (let i = 0; i < vis; i++) {
    const y0 = snow[i * 3 + 1], sp = 0.5 + rnd(i + 3) * 0.9; const y = ((y0 - t * sp * speed * 0.55) % 15 + 15) % 15 - 7.5;
    pos[i * 3] = snow[i * 3] + Math.sin(t * 0.6 + i) * 0.35 * (0.5 + c); pos[i * 3 + 1] = y; pos[i * 3 + 2] = snow[i * 3 + 2];
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const shardsOn = t > 126; const sAmt = smooth((t - 126) / 8) * (t > 172 ? clamp(1 - (t - 172) / 6) : 1);
  const shards = useMemo(() => Array.from({length: 26}).map((_, i) => ({a: (i / 26) * Math.PI * 2, r: 3.6 + rnd(i + 40) * 3.2, s: 0.25 + rnd(i + 50) * 0.55, y: (rnd(i + 60) - 0.5) * 9, sp: 0.2 + rnd(i + 70) * 0.5, rx: rnd(i + 80) * 6, ry: rnd(i + 90) * 6})), []);
  return (
    <ThreeCanvas width={W} height={H} camera={{position: [0, 0, 10], fov: 52}} style={{position: 'absolute', inset: 0}}>
      <ambientLight intensity={0.6} /><directionalLight position={[3, 6, 5]} intensity={1.6} color="#cfeaff" /><pointLight position={[0, 0, 4]} intensity={2.2 + pulse * 3} color="#9fdcff" />
      <points geometry={geo}><pointsMaterial map={SPRITE as any} size={0.22 + bass * 0.08} color="#eaf8ff" transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>
      {shardsOn && shards.map((s, i) => {
        const ang = s.a + t * s.sp * 0.5, rr = s.r * (1 + 0.18 * pulse * (i % 2 ? 1 : -1) + bass * 0.12);
        return (
          <mesh key={i} position={[Math.cos(ang) * rr * 1.05, s.y + Math.sin(t * s.sp + i) * 0.4, Math.sin(ang) * rr * 0.55 - 1.5]} rotation={[s.rx + t * s.sp, s.ry + t * s.sp * 0.7, 0]} scale={s.s * (0.4 + 0.6 * sAmt) * (1 + pulse * 0.25)}>
            <octahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#bfe8ff" emissive="#58b7ff" emissiveIntensity={0.35 + bass * 0.9} metalness={0.2} roughness={0.15} flatShading transparent opacity={0.9 * sAmt} />
          </mesh>
        );
      })}
    </ThreeCanvas>
  );
};

// ---------- phone chat ----------
const wrap = (s: string, n = 24) => { const w = s.split(' '); const out: string[] = []; let cur = ''; for (const x of w) { if ((cur + ' ' + x).trim().length > n && cur) { out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); } if (cur) out.push(cur); return out; };
const TONES: Record<string, {label: string; color: string}> = {warm: {label: 'WARM', color: '#ffb869'}, friendly: {label: 'FRIENDLY', color: '#ffd9a0'}, polite: {label: 'POLITE', color: '#e8f0ff'}, distant: {label: 'DISTANT', color: '#8fb8ff'}, flat: {label: 'FLAT', color: '#6f93cf'}};

const Phone: React.FC<{mv: MVData; sig: any}> = ({mv, sig}) => {
  const {t, c, pulse} = sig;
  const X = 190, Y = 215, PW = 700, PH = 1200, R = 84, PAD = 16;
  const accent = mix('#ff9f4a', '#4aa8ff', c);
  const top = Y + PAD + 150, bottom = Y + PH - PAD - 112;
  const contact = mv.contact || {name: 'Jasmine', initial: 'J', heartUntil: 0, greyFrom: 9999};
  // tag reveal: messages before toneReveal get tags popped in sequence when "I hear it in your tone" is sung
  const early = (mv.chat as any[]).filter((m) => m.tone && m.t < mv.toneReveal);
  const tagAt = (m: any) => m.t < mv.toneReveal ? mv.toneReveal + early.indexOf(m) * 0.45 : m.t + 0.5;
  const items = (mv.chat as any[]).filter((m) => t >= m.t).map((m) => {
    if (m.type === 'sep') return {...m, kind: 'sep', h: 56};
    if (m.type === 'sys') return {...m, kind: 'sys', h: 62};
    const lines = wrap(m.text); return {...m, kind: 'msg', lines, h: lines.length * 46 + 28 + (m.status ? 34 : 0) + (m.tone ? 36 : 0) + 14};
  });
  let yb = bottom; const nodes: React.ReactNode[] = [];
  for (let i = items.length - 1; i >= 0; i--) {
    const m: any = items[i], age = t - m.t, ap = easeOutBack(age / 0.4, 1.1), slide = (1 - easeOutCubic(age / 0.35)) * 36;
    const yTop = yb - m.h * clamp(ap, 0, 1.02);
    if (yTop + m.h < top - 80) break;
    const fade = clamp((yTop - (top - 60)) / 90) * clamp(age / 0.2);
    if (m.kind === 'sep') nodes.push(<div key={i} style={{position: 'absolute', left: 0, width: PW, top: yTop + slide - Y, textAlign: 'center', opacity: fade, fontFamily: MONO, fontSize: 21, letterSpacing: 4, color: 'rgba(255,255,255,.42)'}}>{m.text.toUpperCase()}</div>);
    else if (m.kind === 'sys') nodes.push(<div key={i} style={{position: 'absolute', left: 0, width: PW, top: yTop + slide - Y + 6, textAlign: 'center', opacity: fade}}><span style={{fontFamily: SANS, fontSize: 24, fontStyle: 'italic', color: 'rgba(190,220,255,.7)', border: '1.5px solid rgba(190,220,255,.25)', borderRadius: 26, padding: '8px 22px'}}>{m.text}</span></div>);
    else {
      const mine = m.from === 'm'; const bw = Math.min(470, Math.max(...m.lines.map((l: string) => l.length)) * 19 + 44);
      const tone = m.tone ? TONES[m.tone] : null; const tg = tone ? easeOutBack((t - tagAt(m)) / 0.35, 2) : 0;
      nodes.push(
        <div key={i} style={{position: 'absolute', left: mine ? PW - PAD - 28 - bw : PAD + 28, top: yTop + slide - Y, width: bw, opacity: fade}}>
          {tone && <div style={{height: 36, display: 'flex', alignItems: 'center', opacity: clamp(tg), transform: `translateY(${(1 - clamp(tg)) * 8}px) scale(${0.8 + 0.2 * clamp(tg)})`, transformOrigin: 'left center'}}><span style={{fontFamily: MONO, fontSize: 19, letterSpacing: 4, fontWeight: 700, color: tone.color, border: `1.5px solid ${tone.color}88`, borderRadius: 14, padding: '2px 12px', boxShadow: `0 0 14px ${tone.color}44`}}>{tone.label}</span></div>}
          <div style={{background: mine ? accent : `rgba(255,255,255,${0.14 - c * 0.05})`, color: mine ? '#06121f' : '#fff', borderRadius: 32, borderBottomRightRadius: mine ? 10 : 32, borderBottomLeftRadius: mine ? 32 : 10, padding: '12px 22px', fontFamily: SANS, fontWeight: mine ? 700 : 500, fontSize: 34, lineHeight: '46px', boxShadow: mine ? `0 0 ${18 + pulse * 18}px ${accent}66` : 'none', border: mine ? 'none' : '1.5px solid rgba(255,255,255,.16)'}}>
            {m.lines.map((l: string, k: number) => <div key={k}>{l}</div>)}
          </div>
          {m.status && <div style={{textAlign: mine ? 'right' : 'left', fontFamily: MONO, fontSize: 21, letterSpacing: 2, color: 'rgba(255,255,255,.55)', marginTop: 8}}>{m.status}</div>}
        </div>);
    }
    yb = yTop - 12;
  }
  const typing = (mv.typing as any[]).find((k) => t >= k.a && t < k.b);
  const st = [...mv.status].reverse().find((q: any) => t >= q.t);
  const tmin = 12 + Math.floor(t / 14), clock = `9:${String(tmin % 60).padStart(2, '0')} PM`;
  const bat = batteryAt(t), off = clamp((t - 188.2) / 0.8), dim = smooth((t - 104) / 3) * (t < 132 ? 0.5 : 0.5 - 0.3 * smooth((t - 132) / 4));
  const crackP = clamp((t - 140) / 22);
  const grey = smooth((t - contact.greyFrom) / 6), heart = t < contact.heartUntil;
  // draft in the input bar: types, then (maybe) deletes letter by letter
  const dr = (mv.drafts as any[]).find((d) => t >= d.a && t < d.endAt);
  let draftTxt = ''; if (dr) { const typed = Math.min(dr.text.length, Math.floor((t - dr.a) * 13)); const del = t >= dr.delAt ? Math.floor((t - dr.delAt) * 16) : 0; draftTxt = dr.text.slice(0, Math.max(0, typed - del)); }
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${Math.sin(t * 0.7) * 5}px) scale(${1 + 0.008 * pulse})`, transformOrigin: '540px 800px'}}>
      <div style={{position: 'absolute', left: X - 10, top: Y - 10, width: PW + 20, height: PH + 20, borderRadius: R + 10, background: 'linear-gradient(145deg,#2a3340,#0c1118)', boxShadow: `0 40px 120px rgba(0,0,0,.65), 0 0 ${60 + 80 * c}px ${mix('#ffb869', '#6fc9ff', c)}55`}} />
      <div style={{position: 'absolute', left: X, top: Y, width: PW, height: PH, borderRadius: R, overflow: 'hidden', background: `linear-gradient(180deg, ${mix('#1a1410', '#07121f', c)}, ${mix('#0d0a08', '#030a12', c)})`}}>
        <div style={{position: 'absolute', left: 36, right: 36, top: 20, display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 700, fontSize: 25, color: '#fff'}}>
          <span>{clock}</span>
          <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
            {t > 30.6 && <svg width={26} height={26} viewBox="0 0 26 26"><path d="M18 14.5A8 8 0 0 1 9.5 6a8 8 0 1 0 8.5 8.5z" fill="#cfe7ff" /></svg>}
            <svg width={52} height={26} viewBox="0 0 52 26"><rect x={1} y={4} width={44} height={18} rx={5} fill="none" stroke="#fff" strokeWidth={2} /><rect x={46} y={9} width={4} height={8} rx={2} fill="#fff" /><rect x={4} y={7} width={Math.max(0, 38 * bat / 100)} height={12} rx={3} fill={bat < 20 ? '#ff5a5a' : '#fff'} /></svg>
          </span>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 64, height: 110, display: 'flex', alignItems: 'center', gap: 18, padding: '0 34px', borderBottom: '1.5px solid rgba(255,255,255,.1)'}}>
          <div style={{width: 74, height: 74, borderRadius: 37, background: `linear-gradient(135deg, ${mix('#ffb869', '#8fd8ff', c)}, ${mix('#ff7a59', '#4aa8ff', c)})`, filter: `saturate(${1 - grey * 0.9}) brightness(${1 - grey * 0.35})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 38, color: '#06121f'}}>{contact.initial}</div>
          <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, color: '#fff'}}>{contact.name}{heart && <span style={{color: '#ff7a8a', marginLeft: 10}}>♥</span>}</div><div style={{fontFamily: MONO, fontSize: 21, letterSpacing: 2, color: st && st.text === 'typing...' ? '#8fd8ff' : 'rgba(255,255,255,.55)', height: 26}}>{st ? st.text : ''}</div></div>
        </div>
        {nodes}
        {typing && (
          <div style={{position: 'absolute', left: PAD + 28, top: bottom - Y - 52, background: 'rgba(255,255,255,.14)', borderRadius: 30, borderBottomLeftRadius: 10, padding: '16px 26px', display: 'flex', gap: 10, opacity: clamp((t - typing.a) / 0.25) * clamp((typing.b - t) / 0.25), transform: 'translateY(30px)'}}>
            {[0, 1, 2].map((d) => <div key={d} style={{width: 14, height: 14, borderRadius: 7, background: '#fff', opacity: 0.45 + 0.55 * Math.max(0, Math.sin(t * 7 - d * 0.9))}} />)}
          </div>)}
        <div style={{position: 'absolute', left: 28, right: 28, bottom: 28, height: 76, borderRadius: 38, border: `1.5px solid ${draftTxt ? 'rgba(160,215,255,.6)' : 'rgba(255,255,255,.2)'}`, display: 'flex', alignItems: 'center', padding: '0 28px', fontFamily: SANS, fontSize: 30, color: draftTxt ? '#fff' : 'rgba(255,255,255,.4)'}}>
          {draftTxt || 'iMessage'}{draftTxt && Math.floor(t * 2.2) % 2 === 0 && <span style={{display: 'inline-block', width: 3, height: 34, background: '#8fd8ff', marginLeft: 3}} />}
        </div>
        {crackP > 0 && <svg width={PW} height={PH} style={{position: 'absolute', left: 0, top: 0}}>
          {Array.from({length: 9}).map((_, i) => { const a = rnd(i + 5) * Math.PI * 2, len = (200 + rnd(i + 9) * 520) * easeOutCubic(crackP); let x = 430, y = 560, d = `M${x} ${y}`; for (let k = 1; k <= 7; k++) { x += Math.cos(a + (rnd(i * 7 + k) - 0.5) * 0.9) * len / 7; y += Math.sin(a + (rnd(i * 7 + k + 3) - 0.5) * 0.9) * len / 7; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; } return <path key={i} d={d} stroke="rgba(235,248,255,.85)" strokeWidth={2.2} fill="none" style={{filter: 'drop-shadow(0 0 6px #8fd8ff)'}} />; })}
        </svg>}
        <div style={{position: 'absolute', inset: 0, background: '#000', opacity: Math.max(dim, off)}} />
      </div>
    </div>
  );
};

// ---------- frost overlay ----------
const Frost: React.FC<{f: number; pulse: number}> = ({f, pulse}) => {
  if (f < 0.03) return null;
  const thr = 1.05 - f * 0.55;
  const m = `radial-gradient(ellipse ${80 - f * 18}% ${72 - f * 14}% at 50% 47%, transparent 0%, transparent 56%, #000 100%)`;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', WebkitMaskImage: m, maskImage: m, mixBlendMode: 'screen', opacity: 0.55 + 0.25 * f}}>
      <svg width={W} height={H}>
        <filter id="frostf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.026" numOctaves={5} seed={4} /><feColorMatrix type="matrix" values={`0 0 0 0 0.62  0 0 0 0 0.86  0 0 0 0 1  3.2 0 0 0 ${(-3.2 * thr).toFixed(2)}`} /><feGaussianBlur stdDeviation="1.2" /></filter>
        <rect width={W} height={H} filter="url(#frostf)" opacity={0.8 + pulse * 0.2} />
      </svg>
    </div>
  );
};

// ---------- text ----------
const Plate: React.FC<{children: React.ReactNode; left?: boolean; o: number; y?: number; c: number}> = ({children, left, o, y = 1500, c}) => (
  <div style={{position: 'absolute', left: left ? 60 : 0, width: left ? 960 : W, top: y, display: 'flex', justifyContent: left ? 'flex-start' : 'center', opacity: o}}>
    <div style={{padding: '22px 44px 26px', borderRadius: 40, background: `linear-gradient(180deg, rgba(5,12,20,${0.5 + c * 0.1}), rgba(5,12,20,.7))`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1.5px solid rgba(180,225,255,.2)', maxWidth: 960}}>{children}</div>
  </div>
);
const renderAccent = (txt: string, color: string, size: number, italic = true) => txt.split('*').map((seg, i) => i % 2 ? <span key={i} style={{fontFamily: SANS, fontWeight: 900, fontStyle: 'normal', color, letterSpacing: -1, textShadow: `0 0 28px ${color}88`}}>{seg}</span> : <span key={i}>{seg}</span>);

const Lyrics: React.FC<{mv: MVData; sig: any}> = ({mv, sig}) => {
  const {t, c} = sig; const accent = mix('#ffb869', '#8fd8ff', c);
  const L = (mv.lines as any[]).find((l) => t >= l.t0 - 0.1 && t < l.t1 + (l.hold ?? 1.5)); if (!L) return null;
  const o = clamp((t - (L.t0 - 0.1)) / 0.2) * clamp((L.t1 + (L.hold ?? 1.5) - t) / 0.35);
  const words = L.text.split(' ');
  return (
    <Plate o={o} y={1498} c={c}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: L.text.length > 26 ? 64 : 82, lineHeight: 1.12, color: '#fff', textAlign: 'center', textShadow: '0 4px 20px rgba(0,0,0,.6)'}}>
        {words.map((w: string, i: number) => { const p = easeOutExpo((t - L.tm[i]) / 0.35), on = t >= L.tm[i], cur = on && (i === words.length - 1 || t < L.tm[i + 1]);
          return <span key={i} style={{display: 'inline-block', marginRight: 18, opacity: on ? 0.35 + 0.65 * p : 0.18, transform: `translateY(${(1 - p) * 18}px)`, color: cur ? accent : '#fff', textShadow: cur ? `0 0 30px ${accent}aa` : undefined}}>{w}</span>; })}
      </div>
    </Plate>
  );
};
const Narr: React.FC<{mv: MVData; sig: any}> = ({mv, sig}) => {
  const {t, c} = sig; const accent = mix('#ffb869', '#8fd8ff', c);
  const N = (mv.narr as any[]).find((n) => t >= n.a && t < n.b); if (!N) return null;
  const lt = t - N.a, o = clamp(lt / 0.25) * clamp((N.b - t) / 0.35), p = easeOutExpo(lt / 0.5);
  return (
    <Plate o={o} left={N.pos !== 'center'} y={1530} c={c}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 66, color: '#eaf6ff', transform: `translateY(${(1 - p) * 16}px)`, textShadow: '0 4px 18px rgba(0,0,0,.6)'}}>{renderAccent(N.text, accent, 66)}</div>
    </Plate>
  );
};
const Motif: React.FC<{mv: MVData; sig: any}> = ({mv, sig}) => {
  const {t, c, pulse} = sig; const m = (mv.motif as any[]).find((k) => t >= k.t && t < k.t + 2.8); if (!m) return null;
  const lt = t - m.t, o = clamp(lt / 0.2) * clamp((2.8 - lt) / 0.8);
  return <Plate o={o * 0.95} y={1510} c={c}><div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 70, color: '#cfeaff', letterSpacing: 2 + lt * 3, textShadow: `0 0 ${24 + pulse * 20}px #8fd8ffaa`}}>So cold, for you</div></Plate>;
};

const Title: React.FC<{mv: MVData; sig: any}> = ({mv, sig}) => {
  const {t} = sig; if (t > 4.4) return null;
  const o = clamp(t / 0.6) * clamp((4.2 - t) / 0.6); const parts = ['SO COLD,', 'FOR YOU'];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, background: `radial-gradient(ellipse at 50% 50%, rgba(8,10,14,${0.55 * o}), rgba(0,0,0,${0.7 * o}))`}}>
      {parts.map((p, k) => <div key={k} style={{position: 'absolute', left: 0, width: W, top: 700 + k * 170, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 168, letterSpacing: -6, color: k ? '#ffb869' : '#fff', textShadow: '0 10px 50px rgba(0,0,0,.6)'}}>
        {Array.from(p).map((ch, i) => { const q = easeOutExpo((t - 0.3 - k * 0.3 - i * 0.04) / 0.8); return <span key={i} style={{display: 'inline-block', opacity: q, transform: `translateY(${(1 - q) * 80}px)`, whiteSpace: 'pre'}}>{ch}</span>; })}
      </div>)}
      <div style={{position: 'absolute', left: 0, width: W, top: 1060, textAlign: 'center', fontFamily: MONO, fontSize: 34, letterSpacing: 14, color: 'rgba(255,255,255,.8)', opacity: easeOutExpo((t - 1.6) / 0.8)}}>{mv.artist.toUpperCase()}</div>
    </div>
  );
};

const Gauge: React.FC<{mv: MVData; sig: any}> = ({mv, sig}) => {
  const {t, c} = sig; if (t < 4) return null; const v = tempAt(mv, t); const p = clamp((v + 40) / 112); const o = easeOutExpo((t - 4) / 0.8) * (t > 188 ? 0 : 1);
  return (
    <div style={{position: 'absolute', left: 190, top: 118, width: 700, height: 66, opacity: o, borderRadius: 33, background: 'rgba(8,16,26,.6)', border: '1.5px solid rgba(180,225,255,.22)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', boxSizing: 'border-box'}}>
      <span style={{fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: '#fff', fontWeight: 700}}>TONE</span>
      <div style={{flex: 1, height: 14, borderRadius: 7, background: 'linear-gradient(90deg,#4aa8ff,#bfe8ff 45%,#ffb869 75%,#ff7a3a)', position: 'relative'}}>
        <div style={{position: 'absolute', left: `${p * 100}%`, top: -8, width: 6, height: 30, borderRadius: 3, background: '#fff', transform: 'translateX(-3px)', boxShadow: '0 0 12px #fff'}} />
      </div>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: mix('#ffb869', '#8fd8ff', c), width: 96, textAlign: 'right'}}>{Math.round(v)}°</span>
    </div>
  );
};

const Header: React.FC<{mv: MVData; sig: any}> = ({mv, sig}) => {
  const {t} = sig; if (t < 4.4) return null; const o = easeOutExpo((t - 4.4) / 0.8) * (t > 188 ? 0 : 1);
  return <div style={{position: 'absolute', left: 190, top: 62, opacity: o, fontFamily: MONO, fontSize: 24, letterSpacing: 7, color: 'rgba(255,255,255,.75)'}}>{mv.title.toUpperCase()} <span style={{opacity: 0.55}}>· {mv.artist}</span></div>;
};

const Bars: React.FC<{sig: any}> = ({sig}) => {
  const {sp, c} = sig;
  return (
    <svg width={W} height={190} style={{position: 'absolute', left: 0, top: H - 200}}>
      {sp.map((v: number, i: number) => { const h = 8 + v * 120; return <rect key={i} x={54 + i * 49} y={170 - h} width={30} height={h} rx={8} fill={mix('#ffb869', '#bfe8ff', c)} opacity={0.4 + v * 0.45} />; })}
    </svg>
  );
};

export const MV: React.FC<{mv: MVData}> = ({mv}) => {
  const frame = useCurrentFrame();
  if (!mv || !mv.spectrum) return <AbsoluteFill style={{background: '#000'}} />;
  const sig = useSignals(mv, frame); const {t, c, pulse, down, bass, mid} = sig;
  const fadeIn = clamp(frame / 20), end = clamp((t - 188.6) / 0.6); const frost = frostAt(t);
  const bg = `radial-gradient(ellipse at 50% 42%, ${mix('#3a2412', '#12304a', c)} 0%, ${mix('#120b06', '#06101c', c)} 62%, #02060b 100%)`;
  const aur = clamp(c * 1.2) * (0.5 + bass * 0.6);
  const camS = 1 + 0.012 * pulse + (t > 132 && t < 172 ? 0.012 * down : 0);
  const flashWhite = (t > 132 && t < 172 ? down * 0.14 : 0) + (t > 42.6 && t < 43.0 ? 0.25 * (1 - (t - 42.6) / 0.4) : 0);
  const sub = (mv.subliminal as any[]).find((s) => t >= s.t && t < s.t + 0.1);
  const lastWord = t >= mv.end.lastAt && t < mv.end.lastAt + 12 ? easeOutBack((t - mv.end.lastAt) / 0.6) : 0;
  return (
    <AbsoluteFill style={{background: '#000', opacity: fadeIn}}>
      <AbsoluteFill style={{background: bg}} />
      <AbsoluteFill style={{opacity: aur * 0.55, mixBlendMode: 'screen'}}>
        {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: -200 + i * 360 + Math.sin(t * 0.18 + i * 2) * 140, top: 160 + i * 380 + Math.cos(t * 0.15 + i) * 90, width: 900, height: 420, borderRadius: '50%', background: `radial-gradient(ellipse, ${['#5fd0ff', '#7a8bff', '#6fffe0'][i]}99, transparent 68%)`, filter: 'blur(40px)', transform: `rotate(${-18 + i * 14 + Math.sin(t * 0.2 + i) * 6}deg)`}} />)}
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${camS})`, transformOrigin: '540px 820px'}}>
        <Scene3D sig={sig} mv={mv} />
        <Phone mv={mv} sig={sig} />
      </AbsoluteFill>
      <Frost f={frost} pulse={pulse} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%)'}} />
      <Header mv={mv} sig={sig} /><Gauge mv={mv} sig={sig} />
      <Bars sig={sig} />
      <Lyrics mv={mv} sig={sig} /><Narr mv={mv} sig={sig} /><Motif mv={mv} sig={sig} />
      {lastWord > 0 && t < 172 && <div style={{position: 'absolute', left: 0, width: W, top: 700, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: Math.min(420, Math.floor(1000 / (mv.end.last.length * 0.56))), color: '#eaf8ff', opacity: clamp((mv.end.lastAt + 11 - t) / 1.5) * clamp(lastWord), transform: `scale(${0.6 + 0.4 * lastWord})`, textShadow: '0 0 80px #8fd8ffcc'}}>{mv.end.last}</div>}
      <Title mv={mv} sig={sig} />
      <AbsoluteFill style={{background: '#fff', opacity: flashWhite, mixBlendMode: 'screen'}} />
      {sub && <AbsoluteFill style={{background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 190, letterSpacing: -4, color: '#fff'}}>{sub.text}</div></AbsoluteFill>}
      {t >= 189 && <AbsoluteFill style={{background: '#000'}}><div style={{position: 'absolute', left: 0, width: W, top: 820, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 84, color: '#cfeaff', opacity: easeOutExpo((t - 189.2) / 0.8)}}>{mv.end.final}</div><div style={{position: 'absolute', left: 0, width: W, top: 960, textAlign: 'center', fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: 'rgba(255,255,255,.55)', opacity: easeOutExpo((t - 190) / 0.8)}}>{mv.end.credit}</div></AbsoluteFill>}
      <AbsoluteFill style={{background: '#000', opacity: end * 0 }} />
    </AbsoluteFill>
  );
};
