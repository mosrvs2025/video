import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {P, clamp, TL, act} from './lib';
import {S1Hook} from './scenes/S1Hook';
import {S2Spread} from './scenes/S2Spread';
import {S3Network} from './scenes/S3Network';
import {S4Mind} from './scenes/S4Mind';
import {S5Hide} from './scenes/S5Hide';
import {S6Detect} from './scenes/S6Detect';
import {S7Final} from './scenes/S7Final';
import {S6bCosmos} from './scenes/S6bCosmos';

// scene windows in film seconds; neighbours overlap for cross-dissolves
export const SCENES: {id: string; a: number; b: number; C: React.FC<any>; fi?: number; fo?: number}[] = [
  {id: 'hook', a: 0, b: 23.6, C: S1Hook, fi: 0, fo: 0.6},
  {id: 'spread', a: 23.0, b: 65.0, C: S2Spread, fi: 0.8, fo: 0.8},
  {id: 'network', a: 64.2, b: 113.6, C: S3Network, fi: 0.8, fo: 0.8},
  {id: 'mind', a: 113.0, b: 152.4, C: S4Mind, fi: 0.6, fo: 0.8},
  {id: 'hide', a: 151.6, b: 196.6, C: S5Hide, fi: 0.8, fo: 0.8},
  {id: 'detect', a: 196.0, b: act('cosmos').t0 + 0.4, C: S6Detect, fi: 0.6, fo: 0.6},
  {id: 'cosmos', a: act('cosmos').t0 - 0.2, b: act('final').t0 + 0.25, C: S6bCosmos, fi: 0.6, fo: 0.25},
  {id: 'final', a: act('final').t0 - 0.2, b: 999, C: S7Final, fi: 0.3, fo: 0.1},
];

export const Film: React.FC<{v?: boolean; tmap?: (t: number) => number}> = ({v = false, tmap}) => {
  const frame = useCurrentFrame(); const {width: w, height: h, fps} = useVideoConfig();
  const t = tmap ? tmap(frame / fps) : frame / fps;
  return (
    <AbsoluteFill style={{background: P.ink}}>
      {SCENES.filter((s) => t >= s.a && t < s.b).map((s) => {
        const o = clamp((t - s.a) / (s.fi ?? 0.8)) * clamp((s.b - t) / (s.fo ?? 0.8));
        return <AbsoluteFill key={s.id} style={{opacity: s.a === 0 ? clamp((s.b - t) / (s.fo ?? 0.8)) : o}}><s.C t={t} w={w} h={h} v={v} /></AbsoluteFill>;
      })}
    </AbsoluteFill>
  );
};
export const FILM_FRAMES = Math.ceil((TL as any).duration * 30);
