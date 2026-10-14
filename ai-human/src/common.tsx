import React from 'react';
import {spring} from 'remotion';
import seg from './segments.json';

export const FPS = 30;
export const W = 1080, H = 1920;
export const MONO = '"DejaVu Sans Mono", monospace';
export const SANS = 'Inter, sans-serif';
export const GOLD = '#ffc46b', CYAN = '#4fd8ff', PINK = '#ff6ad5', RED = '#ff4d4d';

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
export const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const sp = (frame: number, startSec: number, cfg = {damping: 12, mass: 0.6, stiffness: 140}) => {
  const f = frame - startSec * FPS;
  return f < 0 ? 0 : spring({frame: f, fps: FPS, config: cfg});
};
export const decay = (t: number, T: number, k: number) => (t < T ? 0 : Math.exp(-(t - T) * k));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, u: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(u)))).join(',')})`;
};

// 0 = warm / human, 1 = cold / machine
export const coldness = (t: number) => {
  if (t < 21.7) return 0;
  if (t < 22.3) return (t - 21.7) / 0.6;
  if (t < 44.3) return 1;
  if (t < 44.9) return 1 - (t - 44.3) / 0.6;
  return 0;
};
export const accent = (t: number) => mix(GOLD, CYAN, coldness(t));

// ---------- transcript words ----------
export type Word = {w: string; a: number; b: number; seg: number; key: string};
const syll = (w: string) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').match(/[aeiouy]+/g) || []).length);
export const WORDS: Word[] = [];
(seg as {start: number; end: number; text: string}[]).forEach((s, si) => {
  const toks = s.text.split(/\s+/).filter(Boolean);
  const weights = toks.map((t) => syll(t) + (/[,.?!]$/.test(t) ? 0.0 : 0));
  const pauses: number[] = toks.map((t) => (/[,]$/.test(t) ? 0.7 : 0));
  const total = weights.reduce((x, y) => x + y, 0) + pauses.reduce((x, y) => x + y, 0);
  let cum = 0;
  toks.forEach((t, i) => {
    const a = s.start + (cum / total) * (s.end - s.start);
    cum += weights[i];
    const b = s.start + (cum / total) * (s.end - s.start);
    cum += pauses[i];
    WORDS.push({w: t, a, b, seg: si, key: t.toLowerCase().replace(/[^a-z']/g, '')});
  });
});
export const wordT = (key: string, nth = 0) => WORDS.filter((w) => w.key === key)[nth]?.a ?? 0;

const EMPH = new Set(['last', 'generation', 'think', 'intelligence', 'survival', 'fires', 'civilizations', 'machines', 'labor', 'thinking',
  'write', 'create', 'reason', 'universe', 'nobody', 'special', 'humanity', 'human', 'remember', 'ever', 'longer']);

export type Page = {words: Word[]; a: number; b: number};
export const PAGES: Page[] = (() => {
  const pages: Page[] = [];
  const bySeg: Record<number, Word[]> = {};
  WORDS.forEach((w) => (bySeg[w.seg] = bySeg[w.seg] || []).push(w));
  Object.values(bySeg).forEach((ws) => {
    let cur: Word[] = [];
    const len = (x: Word[]) => x.map((q) => q.w).join(' ').length;
    ws.forEach((w) => {
      if (cur.length && len(cur) + w.w.length + 1 > 15) { pages.push({words: cur, a: 0, b: 0}); cur = []; }
      cur.push(w);
      if (/[,.?!]$/.test(w.w)) { pages.push({words: cur, a: 0, b: 0}); cur = []; }
    });
    if (cur.length) pages.push({words: cur, a: 0, b: 0});
  });
  pages.forEach((p, i) => {
    p.a = p.words[0].a - 0.04;
    const nxt = pages[i + 1];
    p.b = Math.min(p.words[p.words.length - 1].b + 0.35, nxt && nxt.words[0].seg === p.words[0].seg ? nxt.words[0].a : 1e9);
  });
  return pages;
})();
export const isEmph = (w: Word) => EMPH.has(w.key);

// ---------- icons ----------
export const Figure: React.FC<{x: number; y: number; s: number; color: string; glow?: number; op?: number}> = ({x, y, s, color, glow = 0, op = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={op} style={{filter: glow ? `drop-shadow(0 0 ${14 * glow}px ${color})` : undefined}}>
    <path d="M-30 0 C-30 -28 -14 -36 0 -36 C14 -36 30 -28 30 0 Z" fill={color} />
    <circle cx={0} cy={-54} r={17} fill={color} />
  </g>
);

const NODE_PTS: [number, number][] = [[100, 50], [70, 70], [130, 66], [100, 95], [58, 105], [142, 100], [84, 130], [118, 128], [100, 160], [50, 70], [150, 72], [76, 40], [124, 38], [100, 120], [64, 150], [138, 152]];
const NODE_EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [2, 5], [3, 6], [3, 7], [6, 8], [7, 8], [4, 6], [5, 7], [9, 1], [10, 2], [11, 0], [12, 0], [11, 1], [12, 2], [3, 13], [13, 6], [13, 7], [6, 14], [7, 15], [4, 9], [5, 10]];
export const HeadNet: React.FC<{cx: number; cy: number; size: number; color: string; t: number; fire?: number}> = ({cx, cy, size, color, t, fire = 1}) => {
  const k = size / 240;
  return (
    <g transform={`translate(${cx - 100 * k},${cy - 120 * k}) scale(${k})`} style={{filter: `drop-shadow(0 0 ${12 * fire}px ${color})`}}>
      <path d="M100 8 C152 8 184 44 184 96 C184 126 170 142 162 160 L162 190 C162 202 154 208 144 208 L114 208 L114 232 L58 232 L58 198 C42 180 16 150 16 96 C16 44 48 8 100 8 Z"
        fill="rgba(0,0,0,.25)" stroke={color} strokeWidth={4} />
      {NODE_EDGES.map(([a, b], i) => {
        const pulse = 0.25 + 0.75 * Math.max(0, Math.sin(t * 5 - i * 0.9)) * fire;
        return <line key={i} x1={NODE_PTS[a][0]} y1={NODE_PTS[a][1]} x2={NODE_PTS[b][0]} y2={NODE_PTS[b][1]} stroke={color} strokeWidth={2.2} opacity={pulse} />;
      })}
      {NODE_PTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4 + 3 * Math.max(0, Math.sin(t * 6 + i * 1.7)) * fire} fill={color} />)}
    </g>
  );
};

export const Gear: React.FC<{cx: number; cy: number; r: number; rot: number; color: string}> = ({cx, cy, r, rot, color}) => (
  <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
    {Array.from({length: 8}).map((_, i) => <rect key={i} x={-r * 0.14} y={-r * 1.18} width={r * 0.28} height={r * 0.36} fill={color} transform={`rotate(${i * 45})`} />)}
    <circle r={r} fill={color} /><circle r={r * 0.42} fill="#0a0a0f" />
  </g>
);

export const Flame: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  const f = (k: number) => 1 + 0.08 * Math.sin(t * k);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} style={{filter: 'drop-shadow(0 0 22px #ff8a2b)'}}>
      <path transform={`scale(${f(13)},${f(9)})`} d="M0 0 C-48 -26 -52 -86 -8 -150 C-12 -104 14 -92 22 -130 C62 -88 52 -28 0 0 Z" fill="#ff7a1a" />
      <path transform={`scale(${f(17)},${f(11)})`} d="M0 0 C-30 -16 -32 -52 -4 -92 C-6 -62 8 -56 12 -78 C36 -54 30 -16 0 0 Z" fill="#ffc83d" />
      <path transform={`scale(${f(19)},${f(15)})`} d="M0 0 C-14 -8 -14 -26 -2 -44 C-3 -30 4 -28 6 -36 C16 -26 12 -8 0 0 Z" fill="#fff3c4" />
    </g>
  );
};

export const City: React.FC<{x: number; y: number; s: number; t: number; lit: number}> = ({x, y, s, t, lit}) => {
  const bs: [number, number, number][] = [[-110, 70, 120], [-62, 54, 190], [-14, 62, 250], [38, 50, 170], [80, 58, 130]];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {bs.map(([bx, bw, bh], i) => {
        const h = bh * ease(lit * 1.6 - i * 0.18);
        return (
          <g key={i}>
            <rect x={bx} y={-h} width={bw} height={h} fill="#30343f" stroke={GOLD} strokeWidth={2} />
            {Array.from({length: Math.floor(bh / 28)}).map((_, r) => Array.from({length: 2}).map((__, c) => {
              const on = lit > 0.5 && rnd(i * 31 + r * 7 + c + Math.floor(t * 1.5)) > 0.35;
              const wy = -h + 14 + r * 28;
              return wy > -8 ? null : <rect key={r + '' + c} x={bx + 10 + c * (bw / 2 - 6)} y={wy} width={bw / 2 - 12} height={14} fill={on ? GOLD : '#1c1f27'} opacity={on ? 0.95 : 1} />;
            }))}
          </g>
        );
      })}
    </g>
  );
};

export const Arm: React.FC<{x: number; y: number; s: number; t: number; lift: number; color: string}> = ({x, y, s, t, lift, color}) => {
  const a1 = -55 + 12 * Math.sin(t * 2) - 25 * lift, a2 = 85 - 8 * Math.sin(t * 2.6) + 30 * lift;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} style={{filter: `drop-shadow(0 0 10px ${color})`}}>
      <rect x={-60} y={-14} width={120} height={28} rx={8} fill="#3a3f4b" />
      <g transform={`rotate(${a1})`}>
        <rect x={-14} y={-150} width={28} height={150} rx={12} fill={color} />
        <g transform={`translate(0,-150) rotate(${a2})`}>
          <rect x={-12} y={-120} width={24} height={120} rx={10} fill={color} opacity={0.85} />
          <g transform="translate(0,-120)">
            <rect x={-18} y={-10} width={36} height={14} fill="#3a3f4b" />
            <path d="M-18 -10 L-26 -34 M18 -10 L26 -34" stroke={color} strokeWidth={9} strokeLinecap="round" />
            <rect x={-20} y={-76 + (1 - lift) * 30} width={40} height={40} fill={GOLD} stroke="#fff" strokeWidth={2} opacity={lift > 0 ? 1 : 0} />
          </g>
        </g>
      </g>
      <circle r={20} fill="#555b6a" />
    </g>
  );
};
