import React from 'react';
import {F, clamp, easeOut, smooth} from './lib';
import {LINES, bands, pulse} from './sig';

// kinetic lyrics: words land on the line's own timing (word shares of the line's duration, by letter count; lines are +-1 s)
const SKIP = new Set(['o1', 'o2', 'w1']);
export const Lyrics: React.FC<{t: number; big: boolean; color: string}> = ({t, big, color}) => {
  const L = LINES.find((l) => !SKIP.has(l.id) && t >= l.t0 - 0.05 && t < l.t1 + 0.7);
  if (!L) return null;
  const words = L.text.replace(/,/g, '').split(/\s+/); const tot = words.reduce((s, w) => s + w.length + 1, 0); let acc = 0;
  const span = Math.max(0.8, (L.t1 - L.t0) * 0.85); const out = clamp((t - L.t1) / 0.6);
  const beat = pulse(t, 'low', 0.16, 0.4);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: big ? 780 : 1540, height: big ? 420 : 200, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: big ? '6px 30px' : '4px 20px', opacity: 1 - out, transform: `translateY(${-30 * out}px)`}}>
      {words.map((w, i) => {
        const a = L.t0 + (acc / tot) * span; acc += w.length + 1; const u = clamp((t - a) / 0.22); const e = easeOut(u, 3);
        return <span key={i} style={{opacity: e, transform: `translateY(${(1 - e) * (big ? 60 : 24)}px) scale(${big ? 0.6 + 0.4 * e + 0.08 * beat * (u > 0.9 ? 1 : 0) : 1})`, fontFamily: big ? F.sans : F.serif, fontStyle: big ? 'normal' : 'italic', fontWeight: big ? 900 : 400, textTransform: big ? 'uppercase' : 'none', fontSize: big ? 150 : 74, lineHeight: 1.02, letterSpacing: big ? -2 : 0, color: '#fff', textShadow: big ? `0 0 40px ${color}, 0 0 90px ${color}, 0 6px 0 rgba(0,0,0,.35)` : '0 4px 26px rgba(0,0,0,.9), 0 0 24px rgba(0,0,0,.6)'}}>{w}</span>;
      })}
    </div>
  );
};

// every sound, always visible: the 32 bands as a glowing strip along the bottom
export const Strip: React.FC<{t: number; color: string; o: number}> = ({t, color, o}) => {
  const b = bands(t);
  return (
    <div style={{position: 'absolute', left: 4, right: 4, bottom: 36, height: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, opacity: o}}>
      {b.map((v, i) => <div key={i} style={{width: 26, height: 6 + 140 * clamp(v) ** 1.4, borderRadius: 13, background: color, boxShadow: `0 0 ${10 + 24 * v}px ${color}`, opacity: 0.55 + 0.45 * v}} />)}
    </div>
  );
};
