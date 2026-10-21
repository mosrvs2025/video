import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Film} from './Film';
import {P, F, CUES, clamp, easeOut} from './lib';
import S from './short.json';

// short time -> film time through the chosen segments (hard cuts between them)
const SEG = S.segments as [number, number][];
export const SHORT_DUR = SEG.reduce((a, [x, y]) => a + (y - x), 0);
export const toFilm = (ts: number) => { let acc = 0; for (const [a, b] of SEG) { if (ts < acc + (b - a)) return a + (ts - acc); acc += b - a; } return SEG[SEG.length - 1][1]; };

// big burned-in captions (Shorts autoplay muted); lines that already appear as on-screen typography are skipped
const PHR = Object.entries(CUES as any).filter(([id]) => !(S.noCaption as string[]).includes(id)).flatMap(([, L]: any) => L.phrases.map((p: any, k: number) => ({...p, end: k + 1 < L.phrases.length ? L.phrases[k + 1].t0 - 0.05 : L.t1 + 0.3})));
const Caption: React.FC<{tf: number}> = ({tf}) => {
  const p = PHR.find((q: any) => tf >= q.t0 && tf < q.end); if (!p) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1480, textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 58, lineHeight: 1.18, color: P.paper, textShadow: '0 4px 24px rgba(0,0,0,.9), 0 0 2px #000'}}>
      {p.words.map((w: any, i: number) => { const on = tf >= w.t; return <span key={i} style={{opacity: on ? 1 : 0.35, color: on && i === p.words.filter((x: any) => tf >= x.t).length - 1 ? P.amber : undefined, marginRight: 14, display: 'inline-block', transform: `translateY(${on ? 0 : 6}px)`}}>{w.w.replace('bot-net', 'botnet')}</span>; })}
    </div>
  );
};

export const Short: React.FC = () => {
  const frame = useCurrentFrame(); const ts = frame / 30; const tf = toFilm(ts);
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <Film v tmap={() => tf} />
      <Caption tf={tf} />
      {ts < 2.2 && <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', fontFamily: F.mono, fontSize: 26, letterSpacing: 8, color: P.paperDim, opacity: clamp(1 - (ts - 1.6) / 0.6) * easeOut(ts / 0.4)}}>A SPECULATIVE THREAT MODEL</div>}
    </AbsoluteFill>
  );
};
