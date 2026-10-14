import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import SPEC from './spectrum.json';

export const FPS = 30;
const VIDEO_FRAMES = 1595; // 53.17s
const BEACH_FRAMES = 605, B0 = 1595; // beach clip starts here (53.1667s)
const BS = B0 / 30;
const END_T = BS + 20.1667; // end card start (73.33s)
export const TOTAL = 2305;
const W = 1080, H = 1920;
const NAVY = '#0b1d3a', CORAL = '#ff5a4a', YEL = '#ffd23f', TEAL = '#19d3c5', SKY = '#4cc9f0';
const SANS = 'Inter, sans-serif', MONO = '"DejaVu Sans Mono", monospace';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const sp = (frame: number, s: number, cfg = {damping: 11, mass: 0.6, stiffness: 160}) => { const f = frame - s * FPS; return f < 0 ? 0 : spring({frame: f, fps: FPS, config: cfg}); };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const track = (keys: [number, number, number][], t: number): [number, number] => {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 0; i < keys.length - 1; i++) if (t < keys[i + 1][0]) { const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]); return [lerp(keys[i][1], keys[i + 1][1], u), lerp(keys[i][2], keys[i + 1][2], u)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};

// ---------------- data ----------------
const CHAPTERS: [number, string, string][] = [[0.3, 'CH.1', 'THE ROAD'], [10.83, 'CH.2', 'THE CREW'], [24.1, 'CH.3', 'THE MOUNTAIN'], [36.4, 'CH.4', 'POSTED UP'], [44.0, 'CH.5', 'BEAUTIFUL'], [BS, 'CH.6', 'THE BEACH']];
const CAPS: {a: number; b: number; text: string; hi: string[]}[] = [
  {a: 4.2, b: 6.1, text: 'Just coming around that mountain.', hi: ['mountain']},
  {a: 17.6, b: 19.4, text: "What's up, Mark?", hi: ['mark?']},
  {a: 19.4, b: 20.6, text: "What's up?", hi: []},
  {a: 22.2, b: 24.0, text: "We're chillin'.", hi: ["chillin'."]},
  {a: 24.3, b: 26.2, text: "We're going to the beach.", hi: ['beach.']},
  {a: 26.25, b: 27.8, text: 'Look at this mountain.', hi: ['mountain.']},
  {a: 27.9, b: 28.8, text: 'Yes sir!', hi: ['sir!']},
  {a: 36.6, b: 38.4, text: 'RVs over here,', hi: ['rvs']},
  {a: 38.4, b: 40.3, text: 'people have posted up.', hi: ['posted']},
  {a: 44.6, b: 46.4, text: 'Beautiful.', hi: ['beautiful.']},
  {a: BS + 0.3, b: BS + 2.3, text: "It's freakin' coming up on me, dude!", hi: ['dude!']},
  {a: BS + 2.2, b: BS + 3.5, text: 'Look at this.', hi: ['this.']},
  {a: BS + 3.0, b: BS + 4.6, text: 'Woo!', hi: ['woo!']},
  {a: BS + 7.3, b: BS + 9.0, text: 'Oh shoot.', hi: ['shoot.']},
  {a: BS + 10.8, b: BS + 13.0, text: 'That feels cool.', hi: ['cool.']},
];
const BOXES: {a: number; b: number; keys: [number, number, number][]; w: number; h: number; label: string}[] = [
  {a: 37.35, b: 38.25, keys: [[37.4, .26, .51], [37.65, .47, .49], [37.9, .72, .47], [38.15, .95, .45]], w: .34, h: .13, label: 'RV'},
  {a: 39.85, b: 40.35, keys: [[39.9, .28, .61], [40.15, .74, .56]], w: .38, h: .17, label: 'RV'},
  {a: 48.9, b: 51.5, keys: [[49.0, .64, .59], [49.5, .68, .58], [50.0, .6, .58], [50.5, .72, .57], [51.0, .68, .58], [51.4, .73, .57]], w: .22, h: .1, label: 'RV ROW'},
];
const PINS: {a: number; b: number; x: number; y: number; label: string}[] = [
  {a: BS + 4.9, b: BS + 6.5, x: .3, y: .8, label: "THAT'S ME"},
  {a: 4.4, b: 6.5, x: .22, y: .36, label: 'THAT MOUNTAIN'},
  {a: 26.9, b: 29.2, x: .2, y: .33, label: 'THIS MOUNTAIN'},
];
const ROAD_POV: [number, number][] = [[0, 10.8], [24.1, 36.4], [40.5, 53.2]];

// ---------------- small graphics ----------------
const stroke = {WebkitTextStroke: `14px ${NAVY}`, paintOrder: 'stroke fill' as const};

const Burst: React.FC<{x: number; y: number; r: number; text: string; frame: number; from: number; to: number; color?: string; rot?: number}> = ({x, y, r, text, frame, from, to, color = YEL, rot = -8}) => {
  const t = frame / FPS; if (t < from || t > to) return null;
  const p = sp(frame, from, {damping: 8, mass: 0.5, stiffness: 220}), o = clamp((to - t) / 0.2);
  const pts = Array.from({length: 24}).map((_, i) => { const a = (i / 24) * Math.PI * 2, rr = i % 2 ? r * 0.72 : r; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(' ');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + Math.sin(t * 9) * 2}) scale(${p * o * (1 + 0.04 * Math.sin(t * 14))})`}>
      <polygon points={pts} fill={color} stroke={NAVY} strokeWidth={10} strokeLinejoin="round" />
      <text textAnchor="middle" y={r * 0.2} fontFamily={SANS} fontWeight={900} fontSize={r * 0.62} fill={NAVY} style={{letterSpacing: -2}}>{text}</text>
    </g>
  );
};

const Note: React.FC<{x: number; y: number; s: number; rot: number; color: string}> = ({x, y, s, rot, color}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={22} ry={16} fill={color} stroke={NAVY} strokeWidth={5} transform="rotate(-20)" />
    <path d="M18 -6 L18 -80 Q50 -64 46 -40" fill="none" stroke={NAVY} strokeWidth={9} strokeLinecap="round" />
    <path d="M18 -6 L18 -80 Q50 -64 46 -40" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Palm: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0 Q-14 -90 6 -170" fill="none" stroke="#8a5a2b" strokeWidth={16} strokeLinecap="round" />
    {[-70, -35, 0, 35, 70].map((a, i) => <path key={i} transform={`translate(6 -170) rotate(${a + Math.sin(t * 2 + i) * 4})`} d="M0 0 Q40 -50 100 -10 Q50 -20 0 0 Z" fill="#22b36b" stroke={NAVY} strokeWidth={4} />)}
  </g>
);

const Waves: React.FC<{y: number; t: number; color: string; amp?: number}> = ({y, t, color, amp = 14}) => {
  const pts = Array.from({length: 55}).map((_, i) => `${i * 20},${y + Math.sin(i * 0.5 + t * 2.4) * amp}`).join(' L');
  return <path d={`M${pts} L1080,1920 L0,1920 Z`} fill={color} />;
};

// ---------------- layers ----------------
const Swipe: React.FC<{t: number; T: number}> = ({t, T}) => {
  const u = (t - (T - 0.18)) / 0.5; if (u < 0 || u > 1) return null;
  const cols = [CORAL, YEL, TEAL];
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {cols.map((c, i) => { const p = ease(u * 1.3 - i * 0.12); const x = lerp(-1400, 1500, p); return <rect key={i} x={x} y={-200} width={520} height={2400} fill={c} transform={`rotate(14 ${x} 960)`} stroke={NAVY} strokeWidth={8} />; })}
    </svg>
  );
};

const RouteBar: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const p = t < 52 ? Math.min(0.93, (t / 54) * 0.98) : lerp(0.93, 1, ease((t - 51.2) / 1.4));
  const x0 = 150, x1 = 930, cx = x0 + (x1 - x0) * p;
  const ch = [...CHAPTERS].reverse().find((c) => t >= c[0]);
  const cp = ch ? sp(frame, ch[0], {damping: 12, mass: 0.6, stiffness: 160}) : 0;
  return (
    <>
      <svg width={W} height={260} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={40} y={50} width={1000} height={90} rx={45} fill="rgba(11,29,58,.82)" stroke="#fff" strokeWidth={4} />
        <circle cx={x0} cy={95} r={12} fill="#fff" />
        <line x1={x0} y1={95} x2={x1} y2={95} stroke="rgba(255,255,255,.35)" strokeWidth={8} strokeDasharray="4 16" strokeLinecap="round" />
        <line x1={x0} y1={95} x2={cx} y2={95} stroke={YEL} strokeWidth={8} strokeLinecap="round" />
        <g transform={`translate(${cx} 88)`}>
          <rect x={-34} y={-18} width={68} height={28} rx={12} fill={CORAL} stroke="#fff" strokeWidth={3} />
          <rect x={-18} y={-30} width={38} height={16} rx={7} fill={SKY} stroke="#fff" strokeWidth={3} />
          <circle cx={-18} cy={12} r={9} fill={NAVY} stroke="#fff" strokeWidth={3} /><circle cx={20} cy={12} r={9} fill={NAVY} stroke="#fff" strokeWidth={3} />
        </g>
        <circle cx={x1 + 55} cy={92} r={22} fill={YEL} stroke="#fff" strokeWidth={3} />
        <path d={`M${x1 + 28} 108 q13 -14 27 0 t27 0`} fill="none" stroke={SKY} strokeWidth={6} strokeLinecap="round" />
        <text x={x0} y={36} fontFamily={MONO} fontSize={22} fill="#fff" textAnchor="middle" style={{letterSpacing: 4}}>START</text>
        <text x={x1 + 55} y={36} fontFamily={MONO} fontSize={22} fill={YEL} textAnchor="middle" style={{letterSpacing: 4}}>BEACH</text>
      </svg>
      {ch && (
        <div style={{position: 'absolute', left: 40, top: 166, transform: `translateX(${(1 - cp) * -400}px) rotate(-2deg)`, background: CORAL, border: '5px solid #fff', borderRadius: 40, padding: '8px 28px', boxShadow: `0 6px 0 ${NAVY}`,
          fontFamily: SANS, fontWeight: 900, fontSize: 44, color: '#fff', letterSpacing: 1}}>
          <span style={{color: YEL}}>{ch[1]}</span> {ch[2]}
        </div>
      )}
    </>
  );
};

const Equalizer: React.FC<{frame: number}> = ({frame}) => {
  const s = (SPEC as number[][])[Math.min(frame, SPEC.length - 1)];
  return (
    <svg width={W} height={190} style={{position: 'absolute', left: 0, top: H - 200}}>
      <text x={50} y={34} fontFamily={MONO} fontSize={24} fill="#fff" style={{letterSpacing: 8}} opacity={0.85}>{frame / 30 >= BS ? '≋ SURF' : '♪ ON THE RADIO'}</text>
      {s.map((v, i) => {
        const h = 10 + v * 110;
        return <rect key={i} x={50 + i * 50} y={180 - h} width={36} height={h} rx={10} fill={`hsl(${lerp(8, 48, i / 19)} 100% 62%)`} stroke={NAVY} strokeWidth={4} />;
      })}
    </svg>
  );
};

const Caption: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const c = CAPS.find((c) => t >= c.a && t < c.b + 0.15); if (!c) return null;
  const words = c.text.split(' ');
  const span = Math.max(0.3, c.b - c.a - 0.25), pin = sp(frame, c.a, {damping: 12, mass: 0.5, stiffness: 200});
  const out = clamp((c.b + 0.15 - t) / 0.15);
  return (
    <div style={{position: 'absolute', left: 30, width: W - 60, top: 1330, height: 300, display: 'flex', flexWrap: 'wrap', gap: '0 30px', justifyContent: 'center', alignContent: 'center',
      transform: `scale(${0.8 + 0.2 * pin}) rotate(${-2 + 2 * pin}deg)`, opacity: out}}>
      {words.map((w, i) => {
        const at = c.a + (i * span) / words.length, p = sp(frame, at, {damping: 9, mass: 0.5, stiffness: 240});
        const hi = c.hi.includes(w.toLowerCase());
        return <span key={i} style={{fontFamily: SANS, fontWeight: 900, fontSize: 138, lineHeight: 1.05, letterSpacing: -3, textTransform: 'uppercase', color: hi ? YEL : '#fff', ...stroke, display: 'inline-block',
          transform: `scale(${0.3 + 0.7 * p}) translateY(${(1 - p) * 40}px)`, opacity: clamp(p * 2), textShadow: `0 10px 0 ${NAVY}`}}>{w}</span>;
      })}
    </div>
  );
};

const Pin: React.FC<{t: number; frame: number; p: typeof PINS[number]}> = ({t, frame, p}) => {
  if (t < p.a || t > p.b) return null;
  const k = sp(frame, p.a), o = clamp((p.b - t) / 0.25), x = p.x * W, y = p.y * H;
  return (
    <g opacity={o}>
      {[0, 1].map((i) => { const u = ((t - p.a) * 1.2 + i * 0.5) % 1; return <circle key={i} cx={x} cy={y} r={20 + u * 90} fill="none" stroke="#fff" strokeWidth={5} opacity={(1 - u) * 0.8} />; })}
      <circle cx={x} cy={y} r={16} fill={CORAL} stroke="#fff" strokeWidth={6} />
      <line x1={x} y1={y} x2={x + 150 * k} y2={y - 150 * k} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <g transform={`translate(${x + 150} ${y - 150}) scale(${k})`}>
        <rect x={0} y={-52} width={410} height={80} rx={40} fill={CORAL} stroke="#fff" strokeWidth={6} />
        <text x={205} y={4} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={42} fill="#fff">{p.label}</text>
      </g>
    </g>
  );
};

const RVBox: React.FC<{t: number; frame: number; b: typeof BOXES[number]}> = ({t, frame, b}) => {
  if (t < b.a || t > b.b) return null;
  const [fx, fy] = track(b.keys, t), k = sp(frame, b.a), o = clamp((b.b - t) / 0.15);
  const w = b.w * W * (1 + (1 - k) * 0.8), h = b.h * H * (1 + (1 - k) * 0.8), x = fx * W - w / 2, y = fy * H - h / 2, L = Math.min(w, h) * 0.3;
  const c = (px: number, py: number, sx: number, sy: number) => <path d={`M${px} ${py + sy * L} L${px} ${py} L${px + sx * L} ${py}`} fill="none" stroke={YEL} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={h} fill="rgba(255,210,63,.12)" />
      {c(x, y, 1, 1)}{c(x + w, y, -1, 1)}{c(x, y + h, 1, -1)}{c(x + w, y + h, -1, -1)}
      <g transform={`translate(${x} ${y - 66})`}>
        <rect width={Math.max(120, b.label.length * 30 + 40)} height={54} rx={27} fill={YEL} stroke={NAVY} strokeWidth={5} />
        <text x={Math.max(120, b.label.length * 30 + 40) / 2} y={39} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={34} fill={NAVY}>{b.label}</text>
      </g>
    </g>
  );
};

const SpeedLines: React.FC<{t: number}> = ({t}) => {
  const on = ROAD_POV.find(([a, b]) => t >= a && t < b); if (!on) return null;
  const o = 0.17 * clamp((t - on[0]) / 0.5) * clamp((on[1] - t) / 0.3);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o}}>
      {Array.from({length: 44}).map((_, i) => {
        const a = (i / 44) * Math.PI * 2 + rnd(i) * 0.1, u = ((t * (0.7 + rnd(i + 5)) + rnd(i + 9)) % 1), r0 = 260 + u * 900, r1 = r0 + 90 + u * 260;
        return <line key={i} x1={540 + Math.cos(a) * r0} y1={1000 + Math.sin(a) * r0} x2={540 + Math.cos(a) * r1} y2={1000 + Math.sin(a) * r1} stroke="#fff" strokeWidth={4 + u * 6} strokeLinecap="round" />;
      })}
    </svg>
  );
};

const BeachVideo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Freeze frame={Math.min(f, BEACH_FRAMES - 1)}>
      <OffthreadVideo src={staticFile('beach.mp4')} muted style={{width: W, height: H, objectFit: 'cover'}} />
    </Freeze>
  );
};

const Polaroid: React.FC<{frame: number; from: number; src: 'road' | 'beach'; at: number; x: number; y: number; rot: number; label: string}> = ({frame, from, src, at, x, y, rot, label}) => {
  const p = sp(frame, from, {damping: 11, mass: 0.7, stiffness: 130});
  if (p <= 0) return null;
  const PW = 400, PH = 500;
  return (
    <div style={{position: 'absolute', left: x - PW / 2, top: y - PH / 2 + (1 - p) * 900, width: PW, height: PH, background: '#fffdf4', padding: 16, boxSizing: 'border-box', transform: `rotate(${rot + (1 - p) * 20}deg)`, boxShadow: '0 18px 40px rgba(0,0,0,.5)'}}>
      <div style={{position: 'relative', width: PW - 32, height: PH - 100, overflow: 'hidden', background: '#000'}}>
        <div style={{position: 'absolute', left: -((W * 0.5) - (PW - 32) / 2) , top: -((H * 0.5) - (PH - 100) / 2) * 0.9, width: W, height: H, transform: 'scale(0.9)', transformOrigin: '0 0'}}>
          <Freeze frame={at}><OffthreadVideo src={staticFile(src === 'road' ? 'road.mp4' : 'beach.mp4')} muted style={{width: W, height: H, objectFit: 'cover'}} /></Freeze>
        </div>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 900, color: NAVY, fontSize: 38, textAlign: 'center', marginTop: 16}}>{label}</div>
    </div>
  );
};

// ---------------- main ----------------
export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const spec = (SPEC as number[][])[Math.min(frame, SPEC.length - 1)];
  const bass = (spec[0] + spec[1] + spec[2] + spec[3]) / 4;
  const sc = 1 + 0.018 * bass;
  const golden = ease((t - 43.5) / 4) * 0.35 * (1 - ease((t - BS) / 0.4));
  const endT = ease((t - END_T) / 0.5);
  const fadeOut = ease((t - (TOTAL / 30 - 0.5)) / 0.5);
  const sing = t >= 12.0 && t < 17.0;

  return (
    <AbsoluteFill style={{background: '#000', opacity: 1 - fadeOut}}>
      <AbsoluteFill style={{transform: `scale(${sc})`, filter: `contrast(1.08) saturate(${1.18 - 0.2 * endT}) brightness(${1 - 0.25 * endT})`}}>
        {frame < B0 && (
          <OffthreadVideo src={staticFile('road.mp4')} muted style={{width: W, height: H, objectFit: 'cover'}} />
        )}
        <Sequence from={B0}><BeachVideo /></Sequence>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {PINS.map((p, i) => <Pin key={i} t={t} frame={frame} p={p} />)}
          {BOXES.map((b, i) => <RVBox key={i} t={t} frame={frame} b={b} />)}
          {t >= 17.3 && t < 21.4 && (() => {
            const k = sp(frame, 17.4), x = 170, y = 380, w = 760, h = 900, L = 90;
            const c = (px: number, py: number, sx: number, sy: number) => <path d={`M${px} ${py + sy * L} L${px} ${py} L${px + sx * L} ${py}`} fill="none" stroke={CORAL} strokeWidth={12} strokeLinecap="round" />;
            return <g opacity={k * clamp((21.4 - t) / 0.2)} transform={`translate(540 830) scale(${1.25 - 0.25 * k}) translate(-540 -830)`}>{c(x, y, 1, 1)}{c(x + w, y, -1, 1)}{c(x, y + h, 1, -1)}{c(x + w, y + h, -1, -1)}</g>;
          })()}
        </svg>
      </AbsoluteFill>

      <SpeedLines t={t} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,170,60,.12), rgba(255,90,74,.10))', mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 100%, rgba(255,140,40,${golden}), transparent 65%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.4) 100%)'}} />
      {/* sun flare in the opening */}
      {t < 4.5 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: clamp((4.5 - t) / 1.2) * 0.9, mixBlendMode: 'screen'}}>
          {Array.from({length: 14}).map((_, i) => <line key={i} x1={210} y1={20} x2={210 + Math.cos(i * 0.45 + t * 0.3) * 900} y2={20 + Math.sin(i * 0.45 + t * 0.3) * 900} stroke="rgba(255,240,200,.35)" strokeWidth={6} />)}
          <circle cx={210} cy={20} r={70 + Math.sin(t * 3) * 6} fill="rgba(255,244,210,.55)" />
        </svg>
      )}

      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {/* title slam */}
        {t < 3.4 && (() => {
          const p = sp(frame, 0.2, {damping: 9, mass: 0.5, stiffness: 190}), o = clamp((3.4 - t) / 0.3);
          return (
            <g transform={`translate(540 640) rotate(-5) scale(${(1.8 - 0.8 * p) * o})`} opacity={p * o}>
              <text textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={230} fill="#fff" stroke={NAVY} strokeWidth={26} paintOrder="stroke" style={{letterSpacing: -6}}>ROAD</text>
              <text textAnchor="middle" y={190} fontFamily={SANS} fontWeight={900} fontSize={230} fill={YEL} stroke={NAVY} strokeWidth={26} paintOrder="stroke" style={{letterSpacing: -6}}>TRIP</text>
            </g>
          );
        })()}
        <Burst x={780} y={760} r={150} text="YEAH!" frame={frame} from={6.9} to={8.4} color={TEAL} rot={8} />
        <Burst x={850} y={560} r={170} text="WOW!" frame={frame} from={11.0} to={12.5} />
        <Burst x={280} y={700} r={150} text="HAHA" frame={frame} from={31.9} to={33.1} color={CORAL} rot={6} />
        {sing && Array.from({length: 7}).map((_, i) => {
          const u = ((t - 12 + i * 0.7) * 0.22) % 1;
          return <Note key={i} x={140 + i * 130 + Math.sin(t * 2 + i) * 30} y={1300 - u * 900} s={1 + bass * 0.4} rot={Math.sin(t * 3 + i) * 15} color={[YEL, CORAL, TEAL][i % 3]} />;
        })}
        {/* chill meter */}
        {t >= 21.6 && t < 24.1 && (() => {
          const p = sp(frame, 21.7), f = ease((t - 22.0) / 1.5);
          return (
            <g opacity={p * clamp((24.1 - t) / 0.15)} transform={`translate(540 430) scale(${p})`}>
              <rect x={-380} y={-60} width={760} height={140} rx={40} fill="rgba(11,29,58,.85)" stroke="#fff" strokeWidth={6} />
              <text x={-340} y={-14} fontFamily={MONO} fontSize={30} fill="#fff" style={{letterSpacing: 6}}>CHILL LEVEL</text>
              <rect x={-340} y={8} width={680} height={44} rx={22} fill="rgba(255,255,255,.15)" />
              <rect x={-340} y={8} width={680 * f} height={44} rx={22} fill={TEAL} stroke={NAVY} strokeWidth={4} />
              {f > 0.97 && <text x={340} y={-14} textAnchor="end" fontFamily={SANS} fontWeight={900} fontSize={40} fill={YEL}>MAX</text>}
            </g>
          );
        })()}
        {/* beach bound */}
        {t >= 24.3 && t < 27.2 && (() => {
          const p = sp(frame, 24.3, {damping: 9, mass: 0.6, stiffness: 190}), o = clamp((27.2 - t) / 0.3);
          return (
            <g transform={`translate(540 520) rotate(-4) scale(${p * o})`} opacity={o}>
              <rect x={-420} y={-120} width={840} height={240} rx={50} fill={SKY} stroke="#fff" strokeWidth={10} />
              <circle cx={310} cy={-40} r={52} fill={YEL} stroke={NAVY} strokeWidth={6} />
              <Palm x={-330} y={90} s={0.8} t={t} />
              <text x={0} y={25} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={104} fill="#fff" stroke={NAVY} strokeWidth={14} paintOrder="stroke">BEACH</text>
              <text x={20} y={-70} textAnchor="middle" fontFamily={MONO} fontSize={32} fill={NAVY} style={{letterSpacing: 8}}>DESTINATION</text>
              <path d="M-400 105 q25 -22 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
            </g>
          );
        })()}
        {/* driver tag */}
        {t >= 17.5 && t < 21.3 && (() => {
          const p = sp(frame, 17.5, {damping: 12, mass: 0.6, stiffness: 170});
          return (
            <g transform={`translate(${-500 + p * 540} 1110) rotate(-3)`} opacity={clamp((21.3 - t) / 0.2)}>
              <rect width={560} height={150} rx={30} fill={CORAL} stroke="#fff" strokeWidth={8} />
              <text x={34} y={86} fontFamily={SANS} fontWeight={900} fontSize={92} fill="#fff" stroke={NAVY} strokeWidth={10} paintOrder="stroke">MARK</text>
              <text x={36} y={128} fontFamily={MONO} fontSize={28} fill={NAVY} style={{letterSpacing: 8}}>DRIVER</text>
              <circle cx={470} cy={75} r={48} fill="none" stroke="#fff" strokeWidth={10} /><circle cx={470} cy={75} r={10} fill="#fff" />
              <path d="M470 75 L470 27 M470 75 L428 99 M470 75 L512 99" stroke="#fff" strokeWidth={9} />
            </g>
          );
        })()}
        {/* copilot tag */}
        {t >= 11.4 && t < 17.3 && (() => {
          const p = sp(frame, 11.4, {damping: 12, mass: 0.6, stiffness: 170});
          return (
            <g transform={`translate(${-500 + p * 540} 1110) rotate(-3)`} opacity={clamp((17.3 - t) / 0.2)}>
              <rect width={520} height={130} rx={30} fill={TEAL} stroke="#fff" strokeWidth={8} />
              <text x={34} y={72} fontFamily={SANS} fontWeight={900} fontSize={74} fill="#fff" stroke={NAVY} strokeWidth={9} paintOrder="stroke">COPILOT</text>
              <text x={36} y={112} fontFamily={MONO} fontSize={26} fill={NAVY} style={{letterSpacing: 7}}>{sing ? 'SING-ALONG MODE' : 'VIBES: ON'}</text>
            </g>
          );
        })()}
      </svg>

      <Caption t={t} frame={frame} />
      <RouteBar t={t} frame={frame} />
      <Equalizer frame={frame} />
      <Swipe t={t} T={10.83} /><Swipe t={t} T={24.1} /><Swipe t={t} T={BS} />

      {/* beach overlays */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <Burst x={540} y={640} r={230} text="ARRIVED!" frame={frame} from={52.6} to={53.9} color={YEL} rot={-6} />
        <Burst x={800} y={760} r={150} text="SPLASH!" frame={frame} from={BS + 1.0} to={BS + 2.3} color={SKY} rot={7} />
        <Burst x={280} y={720} r={150} text="WOO!" frame={frame} from={BS + 3.0} to={BS + 4.4} color={CORAL} rot={-8} />
        {t >= BS + 0.2 && t < BS + 2.2 && (() => {
          const p = sp(frame, BS + 0.2), blink = Math.floor(t * 6) % 2;
          return (
            <g transform={`translate(540 440) scale(${p})`} opacity={clamp((BS + 2.2 - t) / 0.15)}>
              <rect x={-330} y={-60} width={660} height={120} rx={36} fill={blink ? CORAL : '#c63a2c'} stroke="#fff" strokeWidth={8} />
              <path d="M-290 20 q25 -50 50 0 t50 0" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
              <text x={50} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={64} fill="#fff" stroke={NAVY} strokeWidth={8} paintOrder="stroke">INCOMING WAVE</text>
            </g>
          );
        })()}
        {t >= BS + 11 && t < BS + 13.2 && (() => {
          const p = sp(frame, BS + 11), f = ease((t - BS - 11.2) / 1.2);
          return (
            <g opacity={p * clamp((BS + 13.2 - t) / 0.2)} transform={`translate(540 430) scale(${p})`}>
              <rect x={-380} y={-60} width={760} height={140} rx={40} fill="rgba(11,29,58,.85)" stroke="#fff" strokeWidth={6} />
              <text x={-340} y={-14} fontFamily={MONO} fontSize={30} fill="#fff" style={{letterSpacing: 6}}>COOL LEVEL</text>
              <rect x={-340} y={8} width={680} height={44} rx={22} fill="rgba(255,255,255,.15)" />
              <rect x={-340} y={8} width={680 * f} height={44} rx={22} fill={SKY} stroke={NAVY} strokeWidth={4} />
            </g>
          );
        })()}
        {/* end card */}
        {t >= END_T && (() => {
          const p = sp(frame, END_T + 0.2, {damping: 8, mass: 0.6, stiffness: 200});
          return (
            <g>
              <rect width={W} height={H} fill={`rgba(11,29,58,${0.62 * endT})`} />
              <g transform={`translate(540 360) rotate(-5) scale(${p * (2.2 - 1.2 * p) / (2.2 - 1.2 * p || 1)})`} opacity={clamp(p * 2)}>
                <rect x={-440} y={-130} width={880} height={260} rx={36} fill={CORAL} stroke="#fff" strokeWidth={12} />
                <text textAnchor="middle" y={-10} fontFamily={SANS} fontWeight={900} fontSize={120} fill="#fff" stroke={NAVY} strokeWidth={16} paintOrder="stroke">MISSION</text>
                <text textAnchor="middle" y={100} fontFamily={SANS} fontWeight={900} fontSize={110} fill={YEL} stroke={NAVY} strokeWidth={16} paintOrder="stroke">COMPLETE</text>
              </g>
              <Waves y={1660} t={t} color={SKY} amp={16} /><Waves y={1730} t={t + 1} color={TEAL} amp={20} />
            </g>
          );
        })()}
      </svg>
      {t >= END_T && (
        <AbsoluteFill>
          <Polaroid frame={frame} from={END_T + 0.5} src="road" at={345} x={300} y={820} rot={-6} label="THE ROAD" />
          <Polaroid frame={frame} from={END_T + 0.9} src="road" at={822} x={780} y={880} rot={5} label="THE MOUNTAIN" />
          <Polaroid frame={frame} from={END_T + 1.3} src="road" at={1130} x={300} y={1340} rot={4} label="POSTED UP" />
          <Polaroid frame={frame} from={END_T + 1.7} src="beach" at={100} x={780} y={1380} rot={-5} label="THE BEACH" />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
