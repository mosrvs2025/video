import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Neural3D} from './Neural3D';
import {PAGES, FPS, W, H, MONO, SANS, GOLD, CYAN, accent, coldness, clamp, ease, decay, mix, rnd, isEmph, sp} from './common';
import {Sc, Scene0, Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10} from './scenes';

export {FPS};
export const TOTAL = 1500; // 50s
const HITS = [5.46, 10.3, 21.85, 25.94, 32.8, 36.9, 40.0, 44.5, 48.2];
const FLASH = [21.85, 44.5];

const Captions: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const page = PAGES.find((p) => t >= p.a && t < p.b);
  if (!page || t > 48.2) return null;
  const col = accent(t);
  const pin = sp(frame, page.a, {damping: 14, mass: 0.5, stiffness: 200});
  return (
    <div style={{position: 'absolute', left: 40, width: W - 80, top: 1440, height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0 34px',
      transform: `scale(${0.88 + 0.12 * pin})`, opacity: clamp(pin * 2)}}>
      {page.words.map((w, i) => {
        const active = t >= w.a, current = t >= w.a && t < w.b + 0.05;
        const em = isEmph(w);
        const color = active ? (em ? col : '#fff') : 'rgba(255,255,255,.28)';
        return (
          <span key={i} style={{fontFamily: SANS, fontWeight: 900, fontSize: em ? 104 : 92, lineHeight: 1.1, letterSpacing: -3, color, textTransform: 'uppercase',
            textShadow: '0 5px 0 rgba(0,0,0,.5), 0 0 40px rgba(0,0,0,.7)', transform: `scale(${current ? 1.1 : 1})`, display: 'inline-block', transition: 'none'}}>{w.w.replace(/[,.]$/, '')}</span>
        );
      })}
    </div>
  );
};

const Dust: React.FC<{t: number; color: string}> = ({t, color}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.55}}>
    {Array.from({length: 46}).map((_, i) => {
      const x = (rnd(i) * W + Math.sin(t * 0.4 + i) * 30), y = ((rnd(i + 99) * H - t * (14 + rnd(i + 7) * 30)) % H + H) % H;
      return <circle key={i} cx={x} cy={y} r={1.5 + rnd(i + 3) * 3} fill={color} opacity={0.2 + 0.5 * rnd(i + 11)} />;
    })}
  </svg>
);

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = coldness(t);
  const col = accent(t);
  let shake = 0, flash = 0;
  HITS.forEach((h) => (shake += decay(t, h, 10)));
  FLASH.forEach((h) => (flash = Math.max(flash, decay(t, h, 12))));
  const sx = Math.sin(t * 70) * 8 * shake, sy = Math.cos(t * 63) * 8 * shake, zoom = 1 + 0.025 * shake;
  const fadeOut = ease((t - 49.3) / 0.7), fadeIn = ease(t / 0.6);

  // 3D network visible during the machine section
  let netOp = 0, netReveal = 0, netScale = 1.0;
  if (t >= 21.9 && t < 35.4) { netOp = ease((t - 21.9) / 0.6) * (t < 25.9 ? 1 : t < 32.8 ? 0.32 : 0.9) * ease((35.4 - t) / 0.4); netReveal = ease((t - 21.9) / 2.2); netScale = 0.9 + 0.25 * ease((t - 21.9) / 3.5); }
  if (t >= 35.4 && t < 44.5) { netOp = 0.22 * ease((t - 35.4) / 0.4) * ease((44.5 - t) / 0.3); netReveal = 1; netScale = 1.3; }
  const glitch = (t > 21.85 && t < 22.1) || (t > 40.0 && t < 40.15) || (t > 36.9 && t < 37.0);

  return (
    <AbsoluteFill style={{background: '#000', opacity: fadeIn * (1 - fadeOut)}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, ${mix('#2a1a0a', '#0a2540', c)} 0%, ${mix('#0d0805', '#02060d', c)} 70%)`}} />
      <Dust t={t} color={col} />
      {netOp > 0.01 && <Neural3D frame={frame} reveal={netReveal} scale={netScale} opacity={netOp} />}

      <AbsoluteFill style={{transform: `translate(${sx}px,${sy}px) scale(${zoom})`, filter: glitch ? `hue-rotate(${Math.round(rnd(frame) * 80 - 40)}deg) contrast(1.3)` : undefined}}>
        <Sc a={0} b={5.55} t={t} inD={0.1} outD={0.15}><Scene0 t={t} frame={frame} /></Sc>
        <Sc a={5.4} b={10.4} t={t}><Scene1 t={t} frame={frame} /></Sc>
        <Sc a={10.3} b={11.3} t={t} inD={0.1} outD={0.2}><Scene2 t={t} frame={frame} /></Sc>
        <Sc a={11.1} b={15.4} t={t} inD={0.2}><Scene3 t={t} frame={frame} /></Sc>
        <Sc a={15.25} b={21.95} t={t}><Scene4 t={t} frame={frame} /></Sc>
        <Sc a={21.85} b={26.1} t={t} inD={0.1}><Scene5 t={t} frame={frame} /></Sc>
        <Sc a={25.9} b={32.9} t={t}><Scene6 t={t} frame={frame} /></Sc>
        <Sc a={32.75} b={35.5} t={t}><Scene7 t={t} frame={frame} /></Sc>
        <Sc a={35.35} b={40.1} t={t}><Scene8 t={t} frame={frame} /></Sc>
        <Sc a={39.95} b={44.6} t={t}><Scene9 t={t} frame={frame} /></Sc>
        <Sc a={44.45} b={50} t={t} inD={0.2} outD={0.01}><Scene10 t={t} frame={frame} /></Sc>
      </AbsoluteFill>

      {/* vignette, grain */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,.6) 100%)'}} />
      <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.16}}>
        <svg width={W} height={H}><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={frame % 9} /><feColorMatrix type="saturate" values="0" /></filter><rect width={W} height={H} filter="url(#g)" /></svg>
      </AbsoluteFill>

      <Captions t={t} frame={frame} />

      {/* top label + progress */}
      <div style={{position: 'absolute', left: 50, right: 50, top: 60, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: col, opacity: 0.85}}>
        <div>THE LAST THINKERS?</div><div>{String(Math.floor(t)).padStart(2, '0')}s</div>
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 108, height: 4, background: 'rgba(255,255,255,.12)'}}><div style={{width: `${(t / 50) * 100}%`, height: 4, background: col}} /></div>

      <AbsoluteFill style={{background: '#fff', opacity: clamp(flash * 0.8)}} />
    </AbsoluteFill>
  );
};
