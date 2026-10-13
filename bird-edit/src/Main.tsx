import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, spring, staticFile, useCurrentFrame} from 'remotion';
import {Bird, birdAt} from './track';

export const FPS = 30;
const VIDEO_FRAMES = 1296; // 43.2s of source
export const TOTAL_FRAMES = 1365; // + 2.3s hold for the end card
const W = 1080, H = 1920;
const AMBER = '#ffb52e', RED = '#ff3b3b', CYAN = '#5ee7ff';
const MONO = '"DejaVu Sans Mono", monospace';
const SANS = 'Inter, sans-serif';

// ---------- helpers ----------
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const rand = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const sp = (frame: number, startSec: number, cfg = {damping: 12, mass: 0.6, stiffness: 140}) => {
  const f = frame - startSec * FPS;
  return f < 0 ? 0 : spring({frame: f, fps: FPS, config: cfg});
};
const decay = (t: number, T: number, k: number) => (t < T ? 0 : Math.exp(-(t - T) * k));
const win = (t: number, a: number, b: number) => t >= a && t < b;

const HITS = [0.15, 0.45, 2.0, 5.9, 9.0, 11.1, 14.0, 21.0, 31.5, 42.3];
const WHIPS = [2.0, 14.0, 21.0, 42.0];
const GLITCHES: [number, number][] = [[1.9, 0.25], [11.1, 0.9], [20.9, 0.3], [42.0, 0.3]];

// ---------- camera ----------
function baseScale(t: number) {
  if (t < 2) return 1 + 0.08 * ease(t / 2);
  if (t < 11.1) return 1 + 0.2 * ease((t - 2) / 9);
  if (t < 21) return 1.02 + 0.03 * ((t - 11.1) / 10);
  if (t < 42) return 1 + 0.1 * ease((t - 21) / 21);
  return 1.06 + 0.06 * ease((t - 42) / 3.5);
}
function camera(t: number) {
  let s = baseScale(t);
  let shake = 0;
  for (const h of HITS) { s += 0.09 * decay(t, h, 9); shake += decay(t, h, 12); }
  const b = birdAt(t);
  const wgt = b && t < 42 ? 0.8 : 0;
  const ox = W / 2 + ((b ? b.x : W / 2) - W / 2) * wgt;
  const oy = H / 2 + ((b ? b.y : H / 2) - H / 2) * wgt;
  const dx = Math.sin(t * 61) * 9 * shake;
  const dy = Math.cos(t * 53) * 9 * shake;
  return {s, ox, oy, dx, dy};
}

// ---------- text pieces ----------
const Slam: React.FC<{frame: number; text: string; from: number; to: number; y: number; size?: number; color?: string; rot?: number; sub?: string}> =
  ({frame, text, from, to, y, size = 150, color = '#fff', rot = -3, sub}) => {
    const t = frame / FPS;
    if (t < from || t > to) return null;
    const p = sp(frame, from, {damping: 9, mass: 0.5, stiffness: 190});
    const out = clamp((to - t) / 0.18);
    const sc = (1.9 - 0.9 * p) * (0.9 + 0.1 * out);
    return (
      <div style={{position: 'absolute', left: 0, width: W, top: y, textAlign: 'center', transform: `rotate(${rot}deg) scale(${sc})`, opacity: p * out}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: -2, color, textTransform: 'uppercase',
          textShadow: '0 6px 0 rgba(0,0,0,.55), 0 0 40px rgba(0,0,0,.6)', WebkitTextStroke: '2px rgba(0,0,0,.35)'}}>{text}</div>
        {sub && <div style={{fontFamily: MONO, fontSize: 36, letterSpacing: 8, color: AMBER, marginTop: 14, textShadow: '0 2px 8px #000'}}>{sub}</div>}
      </div>
    );
  };

const Chapter: React.FC<{frame: number; from: number; num: string; title: string; sub: string}> = ({frame, from, num, title, sub}) => {
  const t = frame / FPS, dur = 1.6;
  if (t < from || t > from + dur) return null;
  const inP = sp(frame, from, {damping: 16, mass: 0.5, stiffness: 170});
  const outP = ease((t - (from + dur - 0.3)) / 0.3);
  const h = 330 * inP * (1 - outP);
  const slide = (1 - inP) * 220;
  return (
    <div style={{position: 'absolute', left: 0, top: H / 2 - h / 2, width: W, height: h, overflow: 'hidden', background: 'rgba(6,8,10,.88)',
      borderTop: `4px solid ${AMBER}`, borderBottom: `4px solid ${AMBER}`}}>
      <div style={{position: 'absolute', left: 0, width: W, top: 330 / 2 - 118, textAlign: 'center', transform: `translateX(${slide}px)`}}>
        <div style={{fontFamily: MONO, color: AMBER, fontSize: 38, letterSpacing: 14}}>CHAPTER {num}</div>
        <div style={{fontFamily: SANS, fontWeight: 900, color: '#fff', fontSize: 132, letterSpacing: -3, lineHeight: 1.05, marginTop: 6}}>{title}</div>
        <div style={{fontFamily: MONO, color: '#9fb2bd', fontSize: 30, letterSpacing: 6, marginTop: 6}}>{sub}</div>
      </div>
    </div>
  );
};

const Typed: React.FC<{text: string; frame: number; from: number; cps?: number}> = ({text, frame, from, cps = 30}) => {
  const n = Math.max(0, Math.floor((frame - from * FPS) * cps / FPS));
  return <>{text.slice(0, n)}{n < text.length && Math.floor(frame / 4) % 2 === 0 ? '▌' : ''}</>;
};

// ---------- tracking reticle (lives in camera space) ----------
const Reticle: React.FC<{b: Bird; frame: number; start: number; color: string; lines: string[]; unstable?: boolean}> = ({b, frame, start, color, lines, unstable}) => {
  if (!b) return null;
  const t = frame / FPS;
  const p = sp(frame, start, {damping: 14, mass: 0.7, stiffness: 120});
  const sz = clamp(b.size * 1.45, 150, 720);
  const jx = unstable ? (rand(frame * 3.1) - 0.5) * 26 : 0, jy = unstable ? (rand(frame * 7.7) - 0.5) * 26 : 0;
  const scale = 1 + 1.9 * (1 - p), rot = 85 * (1 - p);
  const x = clamp(b.x + jx, 70, W - 70), y = clamp(b.y + jy, 330, H - 220);
  const right = x + sz / 2 + 14 + 440 < W - 20;
  const left = x - sz / 2 - 14 - 440 > 20;
  const below = !right && !left;
  const op = clamp((frame - start * FPS) / 3) * (unstable ? (rand(Math.floor(frame / 2)) > 0.25 ? 1 : 0.2) : 1);
  const corner = (rx: number, ry: number) => (
    <path d={`M ${rx ? 100 - 24 : 24} ${ry ? 100 : 0} L ${rx ? 100 : 0} ${ry ? 100 : 0} L ${rx ? 100 : 0} ${ry ? 100 - 24 : 24}`}
      transform={`${rx ? '' : ''}`} fill="none" stroke={color} strokeWidth={5} vectorEffect="non-scaling-stroke" />
  );
  return (
    <div style={{position: 'absolute', left: x - sz / 2, top: y - sz / 2, width: sz, height: sz, opacity: op, transform: `scale(${scale}) rotate(${rot}deg)`}}>
      <svg viewBox="-2 -2 104 104" width={sz} height={sz} style={{overflow: 'visible', filter: `drop-shadow(0 0 8px ${color})`}}>
        {corner(0, 0)}{corner(1, 0)}{corner(0, 1)}{corner(1, 1)}
        <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth={1.6} strokeDasharray="3 5" vectorEffect="non-scaling-stroke"
          style={{transformOrigin: '50px 50px', transform: `rotate(${t * 40}deg)`}} opacity={0.7} />
        <path d="M50 38V46M50 54V62M38 50H46M54 50H62" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{position: 'absolute', whiteSpace: 'nowrap', ...(below ? {top: sz + 10, left: clamp(x - 220, 24, W - 464) - (x - sz / 2), textAlign: 'left' as const} : {top: 0, [right ? 'left' : 'right']: sz + 14, textAlign: right ? 'left' as const : 'right' as const}),
        fontFamily: MONO, fontSize: 30, lineHeight: 1.35, color, textShadow: '0 0 6px #000, 0 2px 4px #000', transform: `scale(${1 / scale})`}}>
        {lines.map((l, i) => <div key={i} style={{opacity: clamp((frame - start * FPS - 8 - i * 5) / 4), fontWeight: i === 0 ? 700 : 400, fontSize: i === 0 ? 34 : 28}}>{l}</div>)}
      </div>
    </div>
  );
};

// leader-line callout in camera space
const Callout: React.FC<{frame: number; from: number; to: number; b: Bird; dx: number; dy: number; text: string}> = ({frame, from, to, b, dx, dy, text}) => {
  const t = frame / FPS;
  if (!b || t < from || t > to) return null;
  const p = ease((t - from) / 0.35), o = ease((to - t) / 0.25);
  const x1 = b.x, y1 = b.y, y2 = b.y + dy;
  const x2 = clamp(b.x + dx, 300, W - 300);
  const toRight = x2 + 14 + 260 <= W - 20;
  const lx = x1 + (x2 - x1) * p, ly = y1 + (y2 - y1) * p;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: o, pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', filter: 'drop-shadow(0 2px 3px #000)'}}>
        <circle cx={x1} cy={y1} r={9} fill={AMBER} />
        <line x1={x1} y1={y1} x2={lx} y2={ly} stroke={AMBER} strokeWidth={3} />
        <line x1={x2} y1={y2} x2={x2 + (toRight ? 260 : -260) * p} y2={y2} stroke={AMBER} strokeWidth={3} />
      </svg>
      <div style={{position: 'absolute', left: toRight ? x2 + 14 : x2 - 274, width: 260, top: y2 - 44, textAlign: toRight ? 'left' : 'right', fontFamily: MONO, fontWeight: 700,
        fontSize: 34, letterSpacing: 4, color: AMBER, textShadow: '0 2px 6px #000'}}>
        <Typed text={text} frame={frame} from={from + 0.15} cps={26} />
      </div>
    </div>
  );
};

// ---------- scan / radar (gap where bird is out of frame) ----------
const Scan: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / FPS;
  const a = 11.1, bEnd = 21.0;
  if (t < a + 0.2 || t > bEnd + 0.1) return null;
  const fadeIn = ease((t - a - 0.2) / 0.4), fadeOut = ease((bEnd + 0.1 - t) / 0.15);
  const o = fadeIn * fadeOut;
  const sweepY = ((t * 0.55) % 1) * H;
  const ang = (t / 3.2) * 360;
  const lost = t < 12.4;
  const blip = t > 20.0 ? clamp((t - 20.0) / 0.9) : 0;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(94,231,255,.10) 2px, transparent 2px), linear-gradient(90deg, rgba(94,231,255,.10) 2px, transparent 2px)`, backgroundSize: '120px 120px', backgroundPosition: `${(t * 20) % 120}px ${(t * 30) % 120}px`}} />
      <div style={{position: 'absolute', left: 0, width: W, top: sweepY, height: 160, background: 'linear-gradient(transparent, rgba(94,231,255,.22), transparent)'}} />
      <div style={{position: 'absolute', left: 60, top: 330, fontFamily: MONO, fontSize: 30, color: lost ? RED : CYAN, lineHeight: 1.5, textShadow: '0 0 8px #000'}}>
        <div style={{fontWeight: 700}}>{lost ? '✖ SIGNAL LOST' : `◉ SEARCHING${'.'.repeat(1 + (Math.floor(t * 3) % 3))}`}</div>
        <div style={{color: '#cfe9ef'}}>SECTOR 0{4 + Math.floor((t - a) / 2.5)}</div>
        <div style={{color: '#cfe9ef'}}>ELAPSED {(t - a).toFixed(1)}s</div>
        <div style={{color: '#cfe9ef'}}>SUBJECTS IN FRAME: {blip > 0.6 ? 1 : 0}</div>
      </div>
      <svg width={520} height={520} viewBox="-260 -260 520 520" style={{position: 'absolute', left: W / 2 - 260, top: 1290}}>
        <circle r={250} fill="rgba(4,18,22,.55)" stroke={CYAN} strokeWidth={3} />
        <circle r={165} fill="none" stroke={CYAN} strokeWidth={1.5} opacity={0.6} />
        <circle r={80} fill="none" stroke={CYAN} strokeWidth={1.5} opacity={0.6} />
        <path d="M-250 0H250M0 -250V250" stroke={CYAN} strokeWidth={1.5} opacity={0.5} />
        <g transform={`rotate(${ang})`}>
          <path d="M0 0 L250 0 A250 250 0 0 0 232 -93 Z" fill="rgba(94,231,255,.35)" />
          <line x1={0} y1={0} x2={250} y2={0} stroke={CYAN} strokeWidth={3} />
        </g>
        {blip > 0 && <circle cx={130} cy={-25} r={6 + 6 * Math.sin(t * 12) * blip} fill={AMBER} opacity={blip} />}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- loupe ("enhance") ----------
const Loupe: React.FC<{frame: number; from: number; to: number}> = ({frame, from, to}) => {
  const t = frame / FPS;
  if (t < from || t > to) return null;
  const b = birdAt(Math.min(t, 43.1));
  if (!b) return null;
  const p = sp(frame, from, {damping: 14, mass: 0.6, stiffness: 150});
  const o = ease((to - t) / 0.3);
  const D = 400, cx = 760, cy = 1555;
  const zoom = Math.max(1.0, 300 / b.size);
  const bars = Array.from({length: 14}, (_, i) => 0.25 + 0.75 * rand(Math.floor(frame / 3) + i * 5.3));
  return (
    <>
      <div style={{position: 'absolute', left: cx - D / 2, top: cy - D / 2, width: D, height: D, borderRadius: '50%', overflow: 'hidden',
        border: `6px solid ${AMBER}`, boxShadow: `0 0 40px rgba(255,181,46,.55), inset 0 0 40px rgba(0,0,0,.6)`, transform: `scale(${p * o})`, background: '#000'}}>
        <div style={{position: 'absolute', left: D / 2 - b.x * zoom, top: D / 2 - b.y * zoom, width: W * zoom, height: H * zoom,
          filter: 'grayscale(.85) contrast(1.5) brightness(1.15) sepia(.4)'}}>
          <OffthreadVideo src={staticFile('walk.mp4')} muted style={{width: W * zoom, height: H * zoom, objectFit: 'cover'}} />
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 5px)'}} />
        <div style={{position: 'absolute', left: D / 2 - 1, top: 0, width: 2, height: D, background: 'rgba(255,181,46,.35)'}} />
        <div style={{position: 'absolute', top: D / 2 - 1, left: 0, height: 2, width: D, background: 'rgba(255,181,46,.35)'}} />
      </div>
      <div style={{position: 'absolute', left: 60, top: 1400, width: 420, opacity: o * p, fontFamily: MONO, color: AMBER, fontSize: 28, lineHeight: 1.5, textShadow: '0 2px 6px #000'}}>
        <div style={{fontWeight: 700, fontSize: 34}}>◉ MACRO LENS</div>
        <div>MAG ×{zoom.toFixed(1)}</div>
        <div>MODE: ENHANCE</div>
        <div style={{display: 'flex', gap: 5, alignItems: 'flex-end', height: 90, marginTop: 14}}>
          {bars.map((h, i) => <div key={i} style={{width: 22, height: 90 * h, background: i % 5 === 0 ? RED : AMBER, opacity: 0.85}} />)}
        </div>
      </div>
    </>
  );
};

// ---------- polaroid "exhibit" ----------
const Polaroid: React.FC<{frame: number; from: number; to: number; src: number; cx: number; cy: number; label: string}> = ({frame, from, to, src, cx, cy, label}) => {
  const t = frame / FPS;
  if (t < from || t > to) return null;
  const p = sp(frame, from, {damping: 11, mass: 0.7, stiffness: 120});
  const o = ease((to - t) / 0.3);
  const PW = 400, PH = 520, f = 0.62;
  const b = birdAt(src / FPS) ?? {x: W / 2, y: H / 2, size: 300, span: 'A' as const};
  return (
    <div style={{position: 'absolute', left: cx - PW / 2, top: cy - PH / 2 + (1 - p) * 700, width: PW, height: PH, background: '#f5f1e6', padding: 18, boxSizing: 'border-box',
      transform: `rotate(${-7 + (1 - p) * 25}deg) scale(${o})`, boxShadow: '0 20px 50px rgba(0,0,0,.6)'}}>
      <div style={{position: 'relative', width: PW - 36, height: PH - 110, overflow: 'hidden', background: '#000'}}>
        <div style={{position: 'absolute', left: (PW - 36) / 2 - b.x * f, top: (PH - 110) / 2 - b.y * f, width: W * f, height: H * f}}>
          <Freeze frame={src}><OffthreadVideo src={staticFile('walk.mp4')} muted style={{width: W * f, height: H * f, objectFit: 'cover'}} /></Freeze>
        </div>
      </div>
      <div style={{fontFamily: MONO, fontWeight: 700, color: '#222', fontSize: 34, textAlign: 'center', marginTop: 22, letterSpacing: 4}}>{label}</div>
    </div>
  );
};

// ---------- overlays ----------
const Grain: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.22, pointerEvents: 'none'}}>
    <svg width={W} height={H}>
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 9} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={W} height={H} filter="url(#g)" />
    </svg>
  </AbsoluteFill>
);

const Glitch: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / FPS;
  const g = GLITCHES.find(([a, d]) => t >= a && t < a + d);
  if (!g) return null;
  const k = 1 - (t - g[0]) / g[1];
  const n = 7;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen'}}>
      {Array.from({length: n}).map((_, i) => {
        const y = rand(frame * 1.7 + i) * H, h = 20 + rand(frame * 3.3 + i * 9) * 160, x = (rand(frame * 5.1 + i * 2) - 0.5) * 120 * k;
        const c = ['rgba(255,0,80,.55)', 'rgba(0,255,230,.5)', 'rgba(255,255,255,.35)'][i % 3];
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: W, height: h, background: c, opacity: 0.8 * k}} />;
      })}
    </AbsoluteFill>
  );
};

const Header: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / FPS;
  let chap = 'SIDEWALK MYSTERY';
  if (t >= 2.0) chap = 'CH.01 · THE FIND';
  if (t >= 14.0) chap = 'CH.02 · THE SEARCH';
  if (t >= 21.0) chap = 'CH.03 · THE EVIDENCE';
  if (t >= 42.3) chap = 'CASE FILE · OPEN';
  const secs = Math.min(t, 43.2);
  const tc = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}:${String(Math.floor((secs % 1) * 30)).padStart(2, '0')}`;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 292, background: 'linear-gradient(rgba(5,7,9,1) 0%, rgba(5,7,9,1) 88%, rgba(5,7,9,0) 100%)'}}>
      <div style={{position: 'absolute', left: 50, top: 62, display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONO, fontSize: 32, color: '#fff'}}>
        <div style={{width: 22, height: 22, borderRadius: 11, background: RED, opacity: Math.floor(frame / 15) % 2 ? 0.25 : 1, boxShadow: `0 0 14px ${RED}`}} />REC
      </div>
      <div style={{position: 'absolute', right: 50, top: 62, fontFamily: MONO, fontSize: 32, color: AMBER}}>{tc}</div>
      <div style={{position: 'absolute', left: 0, width: W, top: 140, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 70, letterSpacing: 2, color: '#fff'}}>{chap}</div>
      <div style={{position: 'absolute', left: 0, width: W, top: 222, textAlign: 'center', fontFamily: MONO, fontSize: 26, letterSpacing: 7, color: '#9fb2bd'}}>“WHAT HAPPENED HERE?”</div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 268, height: 4, background: 'rgba(255,181,46,.25)'}}>
        <div style={{width: `${(secs / 43.2) * 100}%`, height: 4, background: AMBER}} />
      </div>
    </div>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => (
  <div style={{position: 'absolute', left: 50, right: 50, bottom: 46, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 24, color: 'rgba(255,255,255,.75)', letterSpacing: 4, textShadow: '0 2px 6px #000'}}>
    <div>SIDEWALK MYSTERY // EP.01</div><div>MORNING WALK ▸ {Math.floor(frame / 30) % 2 ? 'RECORDING' : 'RECORDING.'}</div>
  </div>
);

// ---------- main ----------
export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const {s, ox, oy, dx, dy} = camera(t);
  const b = birdAt(t);

  // whip blur + brightness flash at transitions
  let whip = 0, flash = 0;
  for (const T of WHIPS) {
    whip = Math.max(whip, decay(t, T, 11) * (t >= T ? 1 : 0), t < T ? clamp(1 - (T - t) / 0.12) * 0.7 : 0);
    flash = Math.max(flash, decay(t, T, 16));
  }
  flash = Math.max(flash, decay(t, 9.0, 12) * 0.95); // camera flash for exhibit A
  const glitching = GLITCHES.some(([a, d]) => t >= a && t < a + d);
  const ending = ease((t - 42.2) / 1.2); // desaturate into the end card
  const fadeOut = ease((t - 44.8) / 0.7);
  const gx = glitching ? (rand(frame * 2.3) - 0.5) * 50 : 0;

  const spanA = t >= 2.0 && t <= 11.1, spanC = t >= 12.4 && t <= 13.8, spanB = t >= 21.0 && t <= 43.2;
  const conf = (a: number, bb: number, c: number) => Math.round(a + (bb - a) * ease(c));
  const dist = (x: number | undefined) => (x ? (175 / x).toFixed(1) : '--');

  const aLabel = t < 5.9 ? ['UNIDENTIFIED OBJECT', `DIST ${dist(b?.size)} M`, `CONF ${conf(31, 62, (t - 2.3) / 3.6)}%`]
    : ['TARGET: BIRD', `DIST ${dist(b?.size)} M`, `CONF ${conf(62, 99, (t - 5.9) / 3)}%`];
  const bLabel = t < 23 ? ['TARGET RE-ACQUIRED', `DIST ${dist(b?.size)} M`, 'CONF 100%'] : ['SUBJECT 01', `DIST ${dist(b?.size)} M`, 'STATUS: STILL'];

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* camera layer: footage + bird-locked overlays */}
      <AbsoluteFill style={{transformOrigin: `${ox}px ${oy}px`, transform: `translate(${dx + gx}px, ${dy}px) scale(${s})`,
        filter: `contrast(1.1) saturate(${(1.22 - 0.6 * ending).toFixed(2)}) brightness(${(1 + flash * 0.9 - 0.12 * ending).toFixed(2)}) blur(${(whip * 14).toFixed(1)}px)${glitching ? ` hue-rotate(${Math.round(rand(frame) * 60 - 30)}deg)` : ''}`}}>
        <Freeze frame={Math.min(frame, VIDEO_FRAMES - 1)}>
          <OffthreadVideo src={staticFile('walk.mp4')} muted style={{width: W, height: H, objectFit: 'cover'}} />
        </Freeze>
        {spanA && <Reticle b={b} frame={frame} start={2.3} color={AMBER} lines={aLabel} />}
        {spanC && <Reticle b={b} frame={frame} start={12.4} color={RED} lines={['LOCK UNSTABLE']} unstable />}
        {spanB && t < 42.0 && <Reticle b={b} frame={frame} start={21.1} color={t < 23 ? CYAN : AMBER} lines={bLabel} />}
        <Callout frame={frame} from={25.0} to={27.8} b={b} dx={-300} dy={-170} text="FEATHERS" />
        <Callout frame={frame} from={28.6} to={31.2} b={b} dx={280} dy={230} text="LONG SHADOW" />
        <Callout frame={frame} from={36.0} to={38.6} b={b} dx={-300} dy={200} text="NO WITNESSES" />
      </AbsoluteFill>

      {/* grade */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.55) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,150,60,.10), rgba(40,90,140,.14))', mixBlendMode: 'soft-light'}} />
      <Grain frame={frame} />

      <Scan frame={frame} />
      <Loupe frame={frame} from={22.4} to={42.0} />
      <Polaroid frame={frame} from={9.05} to={11.0} src={Math.round(9.0 * FPS)} cx={300} cy={1560} label="EXHIBIT A" />

      <Header frame={frame} />
      <Footer frame={frame} />

      {/* kinetic type */}
      <Slam frame={frame} text="SIDEWALK" from={0.15} to={1.85} y={1180} size={190} />
      <Slam frame={frame} text="MYSTERY" from={0.45} to={1.85} y={1360} size={190} color={AMBER} rot={2} sub="EP.01 — THE BIRD" />
      <Chapter frame={frame} from={2.0} num="01" title="THE FIND" sub="SOMETHING ON THE SIDEWALK" />
      <Slam frame={frame} text="Wait…" from={3.7} to={4.7} y={1240} size={150} />
      <Slam frame={frame} text="Is that…" from={4.5} to={5.6} y={1240} size={150} rot={2} />
      <Slam frame={frame} text="A BIRD." from={5.9} to={7.4} y={1240} size={190} color={AMBER} rot={-4} />
      <Slam frame={frame} text="SIGNAL LOST" from={11.2} to={12.4} y={900} size={130} color={RED} rot={-2} />
      <Chapter frame={frame} from={14.0} num="02" title="THE SEARCH" sub="KEEP WALKING" />
      <Slam frame={frame} text="Still looking…" from={17.3} to={18.6} y={1000} size={120} rot={2} />
      <Slam frame={frame} text="…there." from={20.0} to={21.0} y={1000} size={170} color={CYAN} rot={-3} />
      <Chapter frame={frame} from={21.0} num="03" title="THE EVIDENCE" sub="CLOSER LOOK" />
      <Slam frame={frame} text="WHAT HAPPENED HERE?" from={31.6} to={33.4} y={1100} size={104} rot={-2} />

      {/* end card */}
      {t >= 42.3 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: `rgba(0,0,0,${0.45 * ending})`}} />
      )}
      {t >= 42.3 && (() => {
        const p = sp(frame, 42.3, {damping: 8, mass: 0.6, stiffness: 220});
        return (
          <div style={{position: 'absolute', left: 90, top: 760, width: 900, textAlign: 'center', transform: `rotate(-8deg) scale(${2.6 - 1.6 * p})`, opacity: clamp(p * 2),
            border: `14px solid ${RED}`, borderRadius: 18, padding: '18px 0', color: RED, fontFamily: SANS, fontWeight: 900, fontSize: 190, letterSpacing: 6, background: 'rgba(0,0,0,.35)'}}>
            CASE OPEN
          </div>
        );
      })()}
      {t >= 42.9 && (
        <div style={{position: 'absolute', left: 0, width: W, top: 1290, textAlign: 'center', fontFamily: MONO, fontSize: 46, color: '#fff', letterSpacing: 4, textShadow: '0 2px 10px #000'}}>
          <Typed text="WHAT HAPPENED HERE?" frame={frame} from={42.9} cps={14} />
        </div>
      )}

      <Glitch frame={frame} />
      <AbsoluteFill style={{background: '#fff', opacity: clamp(flash * 0.85)}} />
      <AbsoluteFill style={{background: '#000', opacity: fadeOut}} />
    </AbsoluteFill>
  );
};
