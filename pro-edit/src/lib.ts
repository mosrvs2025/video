import TL from './timeline.json';
import SPEC from './spectrum.json';
import MARK from './markTrack.json';

export const FPS = 30, W = 1080, H = 1920;
export const NAVY = '#0a1a33', SUN = '#ffc933', CORAL = '#ff5a4a', AQUA = '#19d3c5', SKY = '#4cc9f0', INK = '#07101f';
export const SANS = 'Inter, sans-serif', MONO = '"DejaVu Sans Mono", monospace';

// ---------- math / easing ----------
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const noise = (t: number, seed = 0) => { const i = Math.floor(t), f = t - i, s = f * f * (3 - 2 * f); return lerp(rnd(i + seed * 17), rnd(i + 1 + seed * 17), s) * 2 - 1; };
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInCubic = (x: number) => Math.pow(clamp(x), 3);
export const easeInOutCubic = (x: number) => { const c = clamp(x); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
export const easeOutExpo = (x: number) => { const c = clamp(x); return c >= 1 ? 1 : 1 - Math.pow(2, -10 * c); };
export const easeInOutQuart = (x: number) => { const c = clamp(x); return c < 0.5 ? 8 * c * c * c * c : 1 - Math.pow(-2 * c + 2, 4) / 2; };
export const easeOutBack = (x: number, s = 1.7) => { const c = clamp(x); return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2); };
export const easeOutElastic = (x: number) => { const c = clamp(x); return c === 0 ? 0 : c === 1 ? 1 : Math.pow(2, -9 * c) * Math.sin((c * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1; };
export const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
/** progress of an animation starting at a (sec) lasting d (sec), shaped by fn */
export const prog = (t: number, a: number, d: number, fn: (x: number) => number = easeOutCubic) => fn((t - a) / d);
/** 1 inside [a,b] with fade-in/out of f seconds, else 0 */
export const win = (t: number, a: number, b: number, fi = 0.2, fo = 0.2) => clamp((t - a) / fi) * clamp((b - t) / fo);
export const mixHex = (a: string, b: string, u: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const A = h(a), B = h(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(u)))).join(',')})`;
};

// ---------- timeline ----------
export type Clip = 'R' | 'B' | 'S';
export type Seg = {i: number; clip: Clip; in: number; out: number; trans: string; sf: number; nf: number; file: string};
let acc = 0;
export const SEGS: Seg[] = (TL.segs as {clip: Clip; in: number; out: number; trans: string}[]).map((s, i) => {
  const nf = Math.round((s.out - s.in) * FPS); const seg = {...s, i, sf: acc, nf, file: (TL.clips as Record<string, string>)[s.clip]}; acc += nf; return seg;
});
export const CUT_FRAMES = acc;
export const END_FRAMES = Math.round(TL.endCard * FPS);
export const TOTAL = CUT_FRAMES + END_FRAMES;

export type SrcState = {seg: Seg | null; clip: Clip | null; ct: number; lt: number; rem: number};
export const srcState = (frame: number): SrcState => {
  const seg = SEGS.find((s) => frame >= s.sf && frame < s.sf + s.nf) || null;
  if (!seg) return {seg: null, clip: null, ct: 0, lt: 0, rem: 0};
  const lt = (frame - seg.sf) / FPS;
  return {seg, clip: seg.clip, ct: seg.in + lt, lt, rem: (seg.nf - (frame - seg.sf)) / FPS};
};

export const SPECTRUM = SPEC as number[][];
export const bassAt = (frame: number) => { const s = SPECTRUM[Math.min(frame, SPECTRUM.length - 1)]; return (s[0] + s[1] + s[2] + s[3]) / 4; };

// Mark tracker (surf clip, source px 428x762) -> screen px
export const markAt = (ct: number): {x: number; y: number; w: number; h: number} | null => {
  const f = Math.round(ct * 30); const m = (MARK as (number[] | null)[])[f]; if (!m) return null;
  const sx = W / 428, sy = H / 762;
  return {x: (m[0] + m[2] / 2) * sx, y: (m[1] + m[3] / 2) * sy, w: m[2] * sx, h: m[3] * sy};
};

export const interp = (keys: [number, ...number[]][], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1) as number[];
  for (let i = 0; i < keys.length - 1; i++) if (t < keys[i + 1][0]) {
    const u = smooth((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
    return (keys[i].slice(1) as number[]).map((v, k) => lerp(v, keys[i + 1][k + 1] as number, u));
  }
  return keys[keys.length - 1].slice(1) as number[];
};
