import React from 'react';
import {spring} from 'remotion';
import {W, H, FPS, NAVY, SUN, CORAL, AQUA, SKY, INK, SANS, MONO, clamp, lerp, rnd, easeOutExpo, easeOutCubic, easeOutBack, easeInOutCubic, easeInCubic, prog, win, smooth} from './lib';

export const sp = (t: number, a: number, cfg = {damping: 13, mass: 0.7, stiffness: 170}) => (t < a ? 0 : spring({frame: (t - a) * FPS, fps: FPS, config: cfg}));

// ---------- text ----------
/** Per-letter masked rise (pro kinetic type). t = current time in seconds. */
export const Kinetic: React.FC<{text: string; t: number; a: number; x: number; y: number; size: number; weight?: number; color?: string; anchor?: 'center' | 'left'; tracking?: number;
  stagger?: number; dur?: number; out?: number; font?: string; shadow?: string; italic?: boolean}> = ({text, t, a, x, y, size, weight = 900, color = '#fff', anchor = 'center', tracking = -2, stagger = 0.035, dur = 0.7, out, font = SANS, shadow = '0 8px 30px rgba(0,0,0,.35)', italic}) => {
  if (t < a - 0.05 || (out !== undefined && t > out + 0.5)) return null;
  const outP = out !== undefined ? easeInCubic((t - out) / 0.35) : 0;
  const chars = Array.from(text);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: anchor === 'center' ? 'translateX(-50%)' : undefined, whiteSpace: 'pre', fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: tracking, color, lineHeight: 1.08,
      fontStyle: italic ? 'italic' : undefined, overflow: 'hidden', paddingBottom: size * 0.12, paddingTop: size * 0.06, textShadow: shadow, opacity: 1 - outP, transform2: undefined} as React.CSSProperties}>
      {chars.map((ch, i) => {
        const p = easeOutExpo((t - a - i * stagger) / dur), o = clamp((t - a - i * stagger) / 0.2);
        return <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - p) * 115 + outP * -60}%) rotate(${(1 - p) * 6}deg)`, opacity: o, filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined}}>{ch === ' ' ? ' ' : ch}</span>;
      })}
    </div>
  );
};

export const Glass: React.FC<{x: number; y: number; w?: number | string; h?: number | string; r?: number; children?: React.ReactNode; style?: React.CSSProperties; tint?: string}> = ({x, y, w, h, r = 28, children, style, tint = 'rgba(255,255,255,.10)'}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, background: `linear-gradient(135deg, ${tint}, rgba(255,255,255,.04)), rgba(8,20,40,.42)`, backdropFilter: 'blur(22px) saturate(1.4)', WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
    border: '1.5px solid rgba(255,255,255,.38)', boxShadow: '0 24px 60px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.5)', ...style}}>{children}</div>
);

// ---------- captions ----------
export type Cap = {a: number; b: number; text: string; hi?: string[]};
export const Captions: React.FC<{caps: Cap[]; ct: number; accent: string; y?: number}> = ({caps, ct, accent, y = 1360}) => {
  const c = caps.find((k) => ct >= k.a - 0.02 && ct < k.b + 0.3); if (!c) return null;
  const words = c.text.split(' ');
  const span = Math.max(0.35, c.b - c.a - 0.2);
  const L = c.text.length, fs = L <= 14 ? 124 : L <= 26 ? 112 : L <= 34 ? 98 : 86;
  const pin = easeOutExpo((ct - c.a) / 0.45), pout = easeInCubic((ct - c.b) / 0.3);
  return (
    <div style={{position: 'absolute', left: 40, width: W - 80, top: y, minHeight: 330, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', gap: '6px 26px',
      transform: `translateY(${(1 - pin) * 50 - pout * 40}px)`, opacity: clamp(pin * 1.6) * (1 - pout)}}>
      {words.map((w, i) => {
        const at = c.a + (i * span) / words.length, on = ct >= at;
        const hi = (c.hi || []).includes(w.toLowerCase());
        const p = easeOutBack((ct - at) / 0.28, 2.2);
        const fill = easeOutExpo((ct - at) / 0.3);
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', fontFamily: SANS, fontWeight: 800, fontSize: fs, lineHeight: 1.12, letterSpacing: -3, textTransform: 'uppercase', padding: '0 14px',
            color: on ? (hi ? INK : '#fff') : 'rgba(255,255,255,.5)', transform: `scale(${on ? 0.86 + 0.14 * p : 1})`, textShadow: hi && on ? 'none' : '0 6px 24px rgba(0,0,0,.55), 0 2px 0 rgba(0,0,0,.25)'}}>
            {hi && <span style={{position: 'absolute', inset: '8px 0 6px 0', borderRadius: 22, background: `linear-gradient(135deg, ${accent}, ${SUN})`, transformOrigin: 'left center', transform: `scaleX(${on ? fill : 0})`, boxShadow: `0 12px 30px ${accent}66`, zIndex: -1}} />}
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- stickers / callouts ----------
export const Burst: React.FC<{x: number; y: number; r: number; text: string; t: number; a: number; b: number; c1?: string; c2?: string; rot?: number}> = ({x, y, r, text, t, a, b, c1 = SUN, c2 = '#ff9a2e', rot = -8}) => {
  if (t < a || t > b) return null;
  const p = sp(t, a, {damping: 8, mass: 0.55, stiffness: 230}), o = clamp((b - t) / 0.22);
  const sq = 1 + 0.06 * Math.sin((t - a) * 18) * Math.exp(-(t - a) * 4);
  const pts = Array.from({length: 22}).map((_, i) => { const an = (i / 22) * Math.PI * 2, rr = i % 2 ? r * 0.76 : r; return `${(Math.cos(an) * rr).toFixed(1)},${(Math.sin(an) * rr).toFixed(1)}`; }).join(' ');
  const id = `bg${Math.round(a * 100)}${text.length}`;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
      <g transform={`translate(${x} ${y}) rotate(${rot + Math.sin(t * 7) * 1.5}) scale(${p * o * sq} ${p * o / sq})`} style={{filter: 'drop-shadow(0 18px 24px rgba(0,0,0,.4))'}}>
        <polygon points={pts} fill={`url(#${id})`} stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
        <polygon points={pts} fill="none" stroke={NAVY} strokeWidth={3} strokeLinejoin="round" transform="scale(0.93)" opacity={0.35} />
        <text textAnchor="middle" y={r * 0.2} fontFamily={SANS} fontWeight={900} fontSize={r * 0.6} fill={NAVY} style={{letterSpacing: -2}}>{text}</text>
      </g>
    </svg>
  );
};

export const Pin: React.FC<{x: number; y: number; label: string; t: number; a: number; b: number; dx?: number; dy?: number; color?: string}> = ({x, y, label, t, a, b, dx = 150, dy = -150, color = CORAL}) => {
  if (t < a || t > b) return null;
  const k = sp(t, a), o = clamp((b - t) / 0.25), line = easeOutExpo((t - a - 0.1) / 0.5), lab = easeOutBack((t - a - 0.35) / 0.4);
  const wLab = label.length * 27 + 70;
  const lx = dx >= 0 ? x + dx : x + dx - wLab;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
        {[0, 1].map((i) => { const u = ((t - a) * 1.1 + i * 0.5) % 1; return <circle key={i} cx={x} cy={y} r={14 + u * 80} fill="none" stroke="#fff" strokeWidth={4} opacity={(1 - u) * 0.85} />; })}
        <circle cx={x} cy={y} r={13 * k} fill={color} stroke="#fff" strokeWidth={5} />
        <path d={`M${x} ${y} L${x + dx * line} ${y + dy * line}`} stroke="#fff" strokeWidth={4} strokeLinecap="round" style={{filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.4))'}} />
      </svg>
      <Glass x={lx} y={y + dy - 42} r={42} style={{opacity: o * clamp(lab * 1.5), transform: `scale(${0.6 + 0.4 * lab})`, transformOrigin: dx >= 0 ? 'left center' : 'right center', padding: '0 30px 0 26px', height: 84, display: 'flex', alignItems: 'center', gap: 14}} tint={`${color}99`}>
        <div style={{width: 16, height: 16, borderRadius: 8, background: color, boxShadow: `0 0 16px ${color}`}} />
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 38, color: '#fff', letterSpacing: 1.5, whiteSpace: 'nowrap'}}>{label}</div>
      </Glass>
    </>
  );
};

export const Brackets: React.FC<{x: number; y: number; w: number; h: number; color?: string; lock?: number; label?: string; sub?: string; t: number; labelSide?: 'top' | 'bottom'}> = ({x, y, w, h, color = SUN, lock = 1, label, sub, t, labelSide = 'top'}) => {
  const grow = 1 + (1 - lock) * 0.9, W2 = w * grow, H2 = h * grow, L = Math.min(W2, H2) * 0.28, left = x - W2 / 2, top = y - H2 / 2;
  const c = (px: number, py: number, sx: number, sy: number) => <path d={`M${px} ${py + sy * L} L${px} ${py} L${px + sx * L} ${py}`} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: clamp(lock * 2), pointerEvents: 'none', filter: `drop-shadow(0 0 10px ${color}aa)`}}>
        <rect x={left} y={top} width={W2} height={H2} fill={`${color}14`} />
        {c(left, top, 1, 1)}{c(left + W2, top, -1, 1)}{c(left, top + H2, 1, -1)}{c(left + W2, top + H2, -1, -1)}
        <path d={`M${x - 14} ${y} H${x + 14} M${x} ${y - 14} V${y + 14}`} stroke={color} strokeWidth={3} opacity={0.8} />
      </svg>
      {label && (
        <Glass x={left} y={labelSide === 'top' ? top - 96 : top + H2 + 14} r={26} tint={`${color}99`} style={{opacity: clamp((lock - 0.4) * 2.5), height: 82, padding: '0 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 36, color: '#fff', letterSpacing: 2, lineHeight: 1}}>{label}</div>
          {sub && <div style={{fontFamily: MONO, fontSize: 18, color: color, letterSpacing: 4, marginTop: 6, whiteSpace: 'nowrap'}}>{sub}</div>}
        </Glass>
      )}
    </>
  );
};

export const Meter: React.FC<{label: string; t: number; a: number; b: number; fillFrom: number; fillDur: number; y?: number; color?: string; endText?: string}> = ({label, t, a, b, fillFrom, fillDur, y = 400, color = AQUA, endText = 'MAX'}) => {
  if (t < a || t > b) return null;
  const p = sp(t, a), o = clamp((b - t) / 0.2), f = easeOutCubic((t - fillFrom) / fillDur);
  return (
    <Glass x={110} y={y} w={860} h={150} r={40} style={{opacity: o * clamp(p * 2), transform: `translateY(${(1 - p) * -60}px)`, padding: '24px 36px', boxSizing: 'border-box'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 28, color: '#fff', letterSpacing: 7}}>
        <span>{label}</span><span style={{color: SUN, fontFamily: SANS, fontWeight: 900, letterSpacing: 2}}>{f > 0.97 ? endText : `${Math.round(f * 100)}%`}</span>
      </div>
      <div style={{marginTop: 18, height: 40, borderRadius: 20, background: 'rgba(255,255,255,.18)', overflow: 'hidden'}}>
        <div style={{width: `${f * 100}%`, height: '100%', borderRadius: 20, background: `linear-gradient(90deg, ${color}, ${SUN})`, boxShadow: `0 0 24px ${color}`}} />
      </div>
    </Glass>
  );
};

// ---------- misc FX ----------
export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.14}) => (
  <div style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity, pointerEvents: 'none'}}>
    <svg width={W} height={H}><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={frame % 11} /><feColorMatrix type="saturate" values="0" /></filter><rect width={W} height={H} filter="url(#gr)" /></svg>
  </div>
);

export const LightLeak: React.FC<{t: number; a: number; dur?: number; color?: string; dir?: number}> = ({t, a, dur = 0.9, color = '#ff9a3d', dir = 1}) => {
  const u = (t - a) / dur; if (u < 0 || u > 1) return null;
  const x = lerp(-0.4, 1.4, easeInOutCubic(u)) * W * dir + (dir < 0 ? W : 0);
  return <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: Math.sin(Math.PI * u) * 0.85, background: `radial-gradient(ellipse 520px 1400px at ${x}px 45%, ${color}, transparent 70%)`, pointerEvents: 'none'}} />;
};

export const Confetti: React.FC<{t: number; a: number; dur?: number; x: number; y: number}> = ({t, a, dur = 2.4, x, y}) => {
  const u = (t - a) / dur; if (u < 0 || u > 1) return null;
  const cols = [SUN, CORAL, AQUA, SKY, '#fff', '#ff7ad9'];
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: clamp((1 - u) * 3)}}>
      {Array.from({length: 54}).map((_, i) => {
        const ang = rnd(i) * Math.PI * 2, v = 380 + rnd(i + 3) * 700, tt = (t - a);
        const px = x + Math.cos(ang) * v * (1 - Math.exp(-tt * 3)) * 0.8, py = y + Math.sin(ang) * v * (1 - Math.exp(-tt * 3)) * 0.8 + 520 * tt * tt;
        return <rect key={i} x={-14} y={-8} width={28} height={16} rx={4} fill={cols[i % cols.length]} transform={`translate(${px} ${py}) rotate(${tt * (300 + rnd(i + 9) * 600)})`} />;
      })}
    </svg>
  );
};
