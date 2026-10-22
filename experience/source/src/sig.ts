import A from './audio.json';
import LY from './lyrics.json';
import {clamp, FPS} from './lib';

export const AUD: any = A;
export const DUR: number = A.dur;
export const FRAMES = Math.ceil(DUR * FPS);
export const M: any = (LY as any).moments;
const ix = (t: number) => clamp(Math.round(t * FPS), 0, A.frames - 1);
export const bands = (t: number): number[] => (A.bands as number[][])[ix(t)];
export const sig = (t: number) => { const i = ix(t); return {rms: A.rms[i], low: A.low[i], mid: A.mid[i], high: A.high[i], air: A.air[i], vocal: A.vocal[i], flux: A.flux[i], cent: A.cent[i]}; };
// onset pulse: sum of exp-decayed recent onsets of a band group ('low' | 'mid' | 'high' | 'any')
const ONS = (A.onsets as {t: number; s: number; band: string}[]);
export const pulse = (t: number, band: 'low' | 'mid' | 'high' | 'any' = 'any', decay = 0.3, minS = 0) => {
  let lo = 0, hi = ONS.length; while (lo < hi) { const m = (lo + hi) >> 1; if (ONS[m].t < t - decay * 5) lo = m + 1; else hi = m; }
  let s = 0; for (let i = lo; i < ONS.length && ONS[i].t <= t; i++) { const o = ONS[i]; if ((band === 'any' || o.band === band) && o.s >= minS) s += o.s * Math.exp(-(t - o.t) / decay); }
  return Math.min(1.5, s);
};
export const onsetsIn = (a: number, b: number, band: string, minS = 0) => ONS.filter((o) => o.t >= a && o.t < b && o.band === band && o.s >= minS);
export const LINES: {id: string; t0: number; t1: number; text: string}[] = (LY as any).lines;
export const line = (id: string) => LINES.find((l) => l.id === id)!;
