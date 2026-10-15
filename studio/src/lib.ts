export const FPS = 30, W = 1080, H = 1920;
// theme colours are live bindings, set from edit.theme at render start (setTheme)
export let NAVY = '#0a1a33', SUN = '#ffc933', CORAL = '#ff5a4a', AQUA = '#19d3c5', SKY = '#4cc9f0', INK = '#07101f';
export const setTheme = (t: {accent: string; accent2: string; cool: string; ink: string; navy: string}) => { SUN = t.accent; CORAL = t.accent2; AQUA = t.cool; SKY = t.cool; INK = t.ink; NAVY = t.navy; };
export const SANS = 'Inter, sans-serif', MONO = '"DejaVu Sans Mono", monospace';

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const noise = (t: number, seed = 0) => { const i = Math.floor(t), f = t - i, s = f * f * (3 - 2 * f); return lerp(rnd(i + seed * 17), rnd(i + 1 + seed * 17), s) * 2 - 1; };
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInCubic = (x: number) => Math.pow(clamp(x), 3);
export const easeInOutCubic = (x: number) => { const c = clamp(x); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
export const easeOutExpo = (x: number) => { const c = clamp(x); return c >= 1 ? 1 : 1 - Math.pow(2, -10 * c); };
export const easeOutBack = (x: number, s = 1.7) => { const c = clamp(x); return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2); };
export const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
export const prog = (t: number, a: number, d: number, fn: (x: number) => number = easeOutCubic) => fn((t - a) / d);
export const win = (t: number, a: number, b: number, fi = 0.2, fo = 0.2) => clamp((t - a) / fi) * clamp((b - t) / fo);

export type ClipMeta = {file: string; w: number; h: number; fps: number; dur: number; kind: string; name: string; beats: number[]; bpm: number};
export type SegIn = {clip: string; in: number; out: number; rate: number; trans: string; mute?: boolean; follow?: string};
export type Edit = {fps: number; mode: string; title: string; theme: any; endCard: number; clips: Record<string, ClipMeta>; segs: SegIn[]; overlays: any[]; tracks: Record<string, {a: number; fps: number; boxes: number[][]}>; end: any; flags: {beatPulse: boolean}; spectrum?: number[][]};
export type Seg = SegIn & {i: number; sf: number; nf: number};
export type Timeline = {segs: Seg[]; cut: number; total: number; beatsOut: number[]};

export const buildTimeline = (e: Edit): Timeline => {
  let acc = 0;
  const segs = e.segs.map((s, i) => { const nf = Math.round(((s.out - s.in) / s.rate) * FPS); const g = {...s, i, sf: acc, nf}; acc += nf; return g; });
  const beatsOut: number[] = [];
  segs.forEach((s) => (e.clips[s.clip].beats || []).forEach((b) => { if (b >= s.in && b < s.out) beatsOut.push(s.sf / FPS + (b - s.in) / s.rate); }));
  return {segs, cut: acc, total: acc + Math.round(e.endCard * FPS), beatsOut};
};

export type SrcState = {seg: Seg | null; clip: string | null; ct: number; lt: number; rem: number};
export const srcState = (tl: Timeline, frame: number): SrcState => {
  const seg = tl.segs.find((s) => frame >= s.sf && frame < s.sf + s.nf) || null;
  if (!seg) return {seg: null, clip: null, ct: 0, lt: 0, rem: 0};
  const lt = (frame - seg.sf) / FPS;
  return {seg, clip: seg.clip, ct: seg.in + lt * seg.rate, lt, rem: (seg.nf - (frame - seg.sf)) / FPS};
};

export const isVertical = (m: ClipMeta) => Math.abs(m.w / m.h - 9 / 16) < 0.12;
/** map normalized source-frame coords to screen px, honoring cover (vertical) vs blur-fit (landscape) layouts */
export const toScreen = (m: ClipMeta, fx: number, fy: number): [number, number] => {
  if (isVertical(m)) { const sc = Math.max(W / m.w, H / m.h); return [fx * m.w * sc - (m.w * sc - W) / 2, fy * m.h * sc - (m.h * sc - H) / 2]; }
  const vh = W * m.h / m.w; return [fx * W, (H - vh) / 2 + fy * vh];
};
export const trackBox = (e: Edit, key: string, ct: number) => {
  const t = e.tracks[key]; if (!t) return null;
  const i = Math.round((ct - t.a) * t.fps); const b = t.boxes[Math.max(0, Math.min(t.boxes.length - 1, i))];
  if (i < -2 || i > t.boxes.length + 2) return null;
  const m = e.clips[key.split(':')[0]]; const [x, y] = toScreen(m, b[0], b[1]);
  const sx = isVertical(m) ? Math.max(W / m.w, H / m.h) * m.w : W, sy = isVertical(m) ? Math.max(W / m.w, H / m.h) * m.h : W * m.h / m.w;
  return {x, y, w: b[2] * sx, h: b[3] * sy};
};
export const interp = (keys: number[][], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) if (t < keys[i + 1][0]) { const u = smooth((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])); return keys[i].slice(1).map((v, k) => lerp(v, keys[i + 1][k + 1], u)); }
  return keys[keys.length - 1].slice(1);
};
