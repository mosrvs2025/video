import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Arm, City, Figure, Flame, Gear, HeadNet, CYAN, GOLD, MONO, PINK, RED, SANS, W, H, clamp, decay, ease, lerp, rnd, sp, wordT, mix, FPS} from './common';

type P = {t: number; frame: number};

export const Sc: React.FC<{a: number; b: number; t: number; inD?: number; outD?: number; children: React.ReactNode}> = ({a, b, t, inD = 0.25, outD = 0.25, children}) => {
  if (t < a || t >= b) return null;
  const o = clamp((t - a) / inD) * clamp((b - t) / outD);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const Big: React.FC<{text: string; x?: number; y: number; size: number; color?: string; frame: number; from: number; rot?: number; anchor?: 'middle' | 'start'}> =
  ({text, x = W / 2, y, size, color = '#fff', frame, from, rot = 0, anchor = 'middle'}) => {
    const p = sp(frame, from, {damping: 9, mass: 0.5, stiffness: 190});
    return (
      <text x={x} y={y} textAnchor={anchor} fontFamily={SANS} fontWeight={900} fontSize={size} fill={color} opacity={clamp(p * 2)}
        transform={`rotate(${rot} ${x} ${y}) translate(${x} ${y}) scale(${1.8 - 0.8 * p}) translate(${-x} ${-y})`} style={{letterSpacing: -2}}>{text}</text>
    );
  };

const Mono: React.FC<{text: string; x: number; y: number; size?: number; color: string; anchor?: 'middle' | 'start' | 'end'; op?: number; spacing?: number}> =
  ({text, x, y, size = 32, color, anchor = 'middle', op = 1, spacing = 8}) => (
    <text x={x} y={y} textAnchor={anchor} fontFamily={MONO} fontSize={size} fill={color} opacity={op} style={{letterSpacing: spacing}}>{text}</text>
  );

// ---------- 0: cold open ----------
export const Scene0: React.FC<P> = ({t, frame}) => {
  const typed = 'A THOUGHT EXPERIMENT'.slice(0, Math.max(0, Math.floor((t - 0.8) * 14)));
  const beat = (t % 0.9) / 0.9;
  const ring = 40 + beat * 90, ringO = (1 - beat) * 0.6 * clamp(t / 1);
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = 40 + i * 16.7, u = i / 60;
    if (u > ease((t - 1.0) / 3)) break;
    const ph = (u * 6) % 1;
    const y = 1130 - (ph > 0.42 && ph < 0.46 ? -70 : ph > 0.46 && ph < 0.5 ? 120 : ph > 0.5 && ph < 0.54 ? -40 : 0);
    pts.push(`${x},${y}`);
  }
  const out = ease((t - 4.9) / 0.56);
  return (
    <svg width={W} height={H} style={{transform: `scale(${1 + out * 0.35})`, opacity: 1 - out}}>
      <circle cx={540} cy={820} r={ring} fill="none" stroke={GOLD} strokeWidth={3} opacity={ringO} />
      <circle cx={540} cy={820} r={12 * ease(t / 1)} fill={GOLD} style={{filter: `drop-shadow(0 0 ${18 + 14 * Math.sin(t * 7)}px ${GOLD})`}} />
      <polyline points={pts.join(' ')} fill="none" stroke={GOLD} strokeWidth={4} opacity={0.7} />
      <Mono text={typed + (Math.floor(t * 3) % 2 && typed.length < 20 ? '▌' : '')} x={540} y={1000} size={34} color="#c9b48c" spacing={10} />
      <Big text="THE LAST" y={470} size={150} color={GOLD} frame={frame} from={2.4} />
      <Big text="GENERATION" y={620} size={132} color="#fff" frame={frame} from={2.9} />
    </svg>
  );
};

// ---------- 1: generations lineup ----------
export const Scene1: React.FC<P> = ({t, frame}) => {
  const base = 960, n = 8;
  const thinkT = wordT('think', 0);
  const gearRot = t * 220 * (t < 9.2 ? 1 : Math.max(0, 1 - (t - 9.2) / 0.5));
  return (
    <svg width={W} height={H}>
      <line x1={40} y1={base + 8} x2={1040} y2={base + 8} stroke="#6b5a3c" strokeWidth={3} />
      {Array.from({length: n}).map((_, i) => {
        const last = i === n - 1;
        const x = 100 + i * 118 + (last ? 20 : 0), s = 0.95 + i * 0.12;
        const lt = 5.5 + i * 0.16;
        const on = ease((t - lt) / 0.3);
        const col = last ? GOLD : mix('#4a4030', GOLD, on * 0.55);
        const rise = (1 - sp(frame, lt, {damping: 14, mass: 0.5, stiffness: 160})) * 80;
        return <Figure key={i} x={x} y={base + rise} s={s * 2} color={col} glow={last ? 0.8 + 0.4 * Math.sin(t * 5) : on * 0.3} op={clamp((t - lt) * 6)} />;
      })}
      {t > 6.6 && (() => {
        const p = sp(frame, 6.6);
        return (
          <g opacity={p} transform={`translate(0,${(1 - p) * 30})`}>
            <path d="M880 640 L880 700" stroke={GOLD} strokeWidth={4} />
            <Mono text="US" x={880} y={620} size={64} color={GOLD} spacing={12} />
          </g>
        );
      })()}
      {t > thinkT - 0.9 && (() => {
        const p = sp(frame, thinkT - 0.9, {damping: 11, mass: 0.6, stiffness: 150});
        return (
          <g transform={`translate(520,430) scale(${p})`}>
            <ellipse cx={0} cy={0} rx={200} ry={120} fill="rgba(255,196,107,.12)" stroke={GOLD} strokeWidth={4} />
            <circle cx={150} cy={160} r={14} fill={GOLD} opacity={0.7} /><circle cx={190} cy={215} r={9} fill={GOLD} opacity={0.6} />
            <Gear cx={-40} cy={0} r={52} rot={gearRot} color={GOLD} />
            <Gear cx={62} cy={-30} r={34} rot={-gearRot * 1.5 + 15} color="#ffdf9e" />
          </g>
        );
      })()}
    </svg>
  );
};

// ---------- 2: think about it ----------
export const Scene2: React.FC<P> = ({t, frame}) => {
  const z = 1 + decay(t, 10.3, 5) * 0.3;
  return (
    <svg width={W} height={H}>
      <g transform={`translate(540 760) scale(${z}) translate(-540 -760)`}>
        <HeadNet cx={540} cy={760} size={640} color={GOLD} t={t} fire={1.4} />
        {[0, 1, 2].map((i) => {
          const u = ((t - 10.3) * 2 + i * 0.33) % 1;
          return <circle key={i} cx={540} cy={760} r={300 + u * 360} fill="none" stroke={GOLD} strokeWidth={3} opacity={(1 - u) * 0.5} />;
        })}
      </g>
    </svg>
  );
};

// ---------- 3: thousands of years ----------
export const Scene3: React.FC<P> = ({t, frame}) => {
  const u = ease((t - 11.3) / 2.6);
  const years = Math.round(u * 10000);
  const ticks = Array.from({length: 25});
  const shield = sp(frame, 13.3, {damping: 11, mass: 0.6, stiffness: 140});
  const end = 80 + 880 * u;
  return (
    <svg width={W} height={H}>
      <text x={W / 2} y={560} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={170} fill={GOLD} style={{fontVariantNumeric: 'tabular-nums', letterSpacing: -4}}>{years.toLocaleString('en-US')}{u > 0.99 ? '+' : ''}</text>
      <Mono text="YEARS" x={W / 2} y={640} size={44} color="#c9b48c" spacing={22} />
      <line x1={80} y1={900} x2={end} y2={900} stroke={GOLD} strokeWidth={6} />
      {ticks.map((_, i) => <line key={i} x1={80 + i * 36.7} y1={880} x2={80 + i * 36.7} y2={i % 4 === 0 ? 840 : 862} stroke="#8a7550" strokeWidth={3} opacity={80 + i * 36.7 < end ? 1 : 0.15} />)}
      <circle cx={end} cy={900} r={14} fill="#fff" style={{filter: `drop-shadow(0 0 16px ${GOLD})`}} />
      <g opacity={ease((t - 12.6) / 0.5)}>
        <HeadNet cx={900} cy={1030} size={220} color={GOLD} t={t} />
        <g transform={`translate(900 1030) scale(${shield * 1.35}) translate(-900 -1030)`} opacity={shield}>
          <path d="M900 920 L990 950 C990 1040 960 1110 900 1140 C840 1110 810 1040 810 950 Z" fill="rgba(255,196,107,.08)" stroke={GOLD} strokeWidth={5} />
        </g>
      </g>
      <Mono text="INTELLIGENCE = SURVIVAL" x={540} y={1210} size={30} color={GOLD} op={ease((t - 13.4) / 0.4)} />
    </svg>
  );
};

// ---------- 4: fire, civilization, machines ----------
export const Scene4: React.FC<P> = ({t, frame}) => {
  const tFire = wordT('fires') - 0.1, tCiv = wordT('civilizations') - 0.1, tMac = wordT('machines', 0) - 0.1;
  const tLab = wordT('labor') - 0.9;
  const nodes = [[230, 1080, tFire], [540, 860, tCiv], [850, 640, tMac]] as const;
  const prog = ease((t - 15.4) / 5.0);
  const path = `M60 1230 L230 1230 L230 1080 L540 1080 L540 860 L850 860 L850 640 L1030 640`;
  return (
    <svg width={W} height={H}>
      <path d={path} fill="none" stroke="#5c4a2a" strokeWidth={6} />
      <path d={path} fill="none" stroke={GOLD} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog} style={{filter: `drop-shadow(0 0 8px ${GOLD})`}} />
      {nodes.map(([x, y, at], i) => {
        const p = sp(frame, at, {damping: 10, mass: 0.6, stiffness: 150});
        if (p <= 0) return null;
        return (
          <g key={i} transform={`translate(${x} ${y - 150}) scale(${p}) translate(${-x} ${-(y - 150)})`}>
            <circle cx={x} cy={y - 150} r={150} fill="rgba(255,196,107,.08)" stroke={GOLD} strokeWidth={4} />
            {i === 0 && <Flame x={x} y={y - 90} s={1.05} t={t} />}
            {i === 1 && <City x={x} y={y - 90} s={0.82} t={t} lit={clamp((t - tCiv) / 1.0)} />}
            {i === 2 && <Arm x={x} y={y - 80} s={0.78} t={t} lift={ease((t - tLab) / 0.9)} color={CYAN} />}
            <Mono text={['FIRE', 'CIVILIZATION', 'MACHINES'][i]} x={x} y={y + 30} size={30} color={GOLD} />
          </g>
        );
      })}
    </svg>
  );
};

// ---------- 5: but now ----------
export const Scene5: React.FC<P> = ({t, frame}) => (
  <svg width={W} height={H}>
    <Big text="BUT NOW" y={420} size={190} color={CYAN} frame={frame} from={21.85} rot={-3} />
    {[0, 1, 2].map((i) => {
      const u = ((t - 22.2) * 0.8 + i * 0.33) % 1;
      return <circle key={i} cx={540} cy={820} r={200 + u * 420} fill="none" stroke={CYAN} strokeWidth={2} opacity={(1 - u) * 0.35 * clamp((t - 22.2) / 0.5)} />;
    })}
    <Mono text="MACHINES THAT THINK" x={540} y={1260} size={32} color={CYAN} op={ease((t - 23.4) / 0.5)} spacing={10} />
  </svg>
);

// ---------- 6: capabilities ----------
const Card: React.FC<{x: number; y: number; title: string; at: number; frame: number; children: React.ReactNode}> = ({x, y, title, at, frame, children}) => {
  const p = sp(frame, at, {damping: 12, mass: 0.6, stiffness: 160});
  if (p <= 0) return null;
  return (
    <g transform={`translate(${x + 220} ${y + 190}) scale(${p}) translate(${-(x + 220)} ${-(y + 190)})`} opacity={clamp(p * 1.5)}>
      <rect x={x} y={y} width={440} height={380} rx={22} fill="rgba(6,22,40,.82)" stroke={CYAN} strokeWidth={3} />
      <Mono text={title} x={x + 24} y={y + 52} size={30} color={CYAN} anchor="start" spacing={6} />
      <g transform={`translate(${x} ${y})`}>{children}</g>
    </g>
  );
};
export const Scene6: React.FC<P> = ({t, frame}) => {
  const tW = wordT('write'), tC = wordT('create'), tR = wordT('reason'), tU = wordT('universe');
  const gal = Array.from({length: 150}).map((_, i) => {
    const arm = i % 2, k = Math.floor(i / 2), r = 8 + k * 2.4, th = k * 0.22 + arm * Math.PI + t * 0.5;
    return {x: 220 + Math.cos(th) * r * 1.05, y: 215 + Math.sin(th) * r * 0.55, r: 1.2 + rnd(i) * 2};
  });
  const tb = wordT('better');
  const bars = ease((t - tb) / 0.9);
  return (
    <svg width={W} height={H}>
      <g opacity={1 - ease((t - tb + 0.2) / 0.4) * 0.85}>
        <Card x={50} y={280} title="WRITE" at={tW - 0.1} frame={frame}>
          {[0, 1, 2, 3, 4].map((i) => {
            const w = clamp((t - tW - i * 0.28) / 0.5) * (330 - (i % 3) * 60);
            return <rect key={i} x={40} y={100 + i * 42} width={w} height={14} rx={7} fill={i === 0 ? '#fff' : '#7fe3ff'} opacity={0.9} />;
          })}
          <rect x={40 + 200} y={100 + 4 * 42 - 6} width={12} height={26} fill="#fff" opacity={Math.floor(t * 3) % 2} />
        </Card>
        <Card x={590} y={280} title="CREATE" at={tC - 0.1} frame={frame}>
          {Array.from({length: 24}).map((_, i) => {
            const a = i / 24 * Math.PI * 2 + t * 0.8, r = 40 + 60 * ease((t - tC - i * 0.03) / 0.6);
            return <circle key={i} cx={220 + Math.cos(a) * r * 1.2} cy={215 + Math.sin(a) * r} r={10 + 8 * Math.sin(a * 3 + t * 2)} fill={mix(CYAN, PINK, i / 24)} opacity={0.75} />;
          })}
        </Card>
        <Card x={50} y={690} title="REASON" at={tR - 0.1} frame={frame}>
          {[[220, 110], [120, 210], [320, 210], [70, 310], [170, 310], [270, 310], [370, 310]].map(([x, y], i) => {
            const on = ease((t - tR - i * 0.18) / 0.3);
            const par = i === 0 ? null : [[220, 110], [220, 110], [120, 210], [120, 210], [320, 210], [320, 210]][i - 1];
            return (
              <g key={i}>
                {par && <line x1={par[0]} y1={par[1]} x2={x} y2={y} stroke={CYAN} strokeWidth={3} opacity={on} />}
                <circle cx={x} cy={y} r={20} fill="#06151f" stroke={CYAN} strokeWidth={3} opacity={on} />
                <text x={x} y={y + 8} textAnchor="middle" fontSize={24} fill="#8bffb0" fontFamily={MONO} opacity={on}>✓</text>
              </g>
            );
          })}
        </Card>
        <Card x={590} y={690} title="UNDERSTAND" at={tU - 0.3} frame={frame}>
          <rect x={20} y={70} width={400} height={290} rx={12} fill="#020611" />
          {gal.map((s, i) => <circle key={i} cx={s.x + 0} cy={s.y + 40} r={s.r} fill={i % 7 === 0 ? PINK : '#bfefff'} opacity={0.85} />)}
          <circle cx={220} cy={255} r={14} fill="#fff" style={{filter: `drop-shadow(0 0 14px ${CYAN})`}} />
        </Card>
      </g>
      {bars > 0 && (
        <g opacity={clamp(bars * 2)}>
          <line x1={140} y1={1180} x2={940} y2={1180} stroke="#5b7a8a" strokeWidth={4} />
          <rect x={250} y={1180 - 120} width={170} height={120} fill={GOLD} />
          <rect x={660} y={1180 - 880 * bars} width={170} height={880 * bars} fill={CYAN} style={{filter: `drop-shadow(0 0 18px ${CYAN})`}} />
          <Mono text="US" x={335} y={1230} size={34} color={GOLD} />
          <Mono text="THEM" x={745} y={1230} size={34} color={CYAN} />
        </g>
      )}
    </svg>
  );
};

// ---------- 7: the part nobody talks about ----------
export const Scene7: React.FC<P> = ({t, frame}) => (
  <svg width={W} height={H}>
    {Array.from({length: 12}).map((_, i) => {
      const cx = 180 + (i % 4) * 240, cy = 560 + Math.floor(i / 4) * 280;
      const p = sp(frame, 32.9 + i * 0.05);
      const dots = Math.floor(t * 3 + i) % 4;
      return (
        <g key={i} opacity={p * 0.9}>
          <Figure x={cx} y={cy + 70} s={1.5} color="#8a7a5a" />
          <g transform={`translate(${cx + 26} ${cy - 96})`}>
            <rect x={0} y={0} width={90} height={50} rx={22} fill="#1c222c" stroke="#6b7a8c" strokeWidth={3} />
            {[0, 1, 2].map((d) => <circle key={d} cx={26 + d * 19} cy={25} r={5.5} fill="#9db2c6" opacity={d < dots ? 1 : 0.25} />)}
          </g>
        </g>
      );
    })}
    <Mono text="░░░░ ░░░░░░░ ░░░░" x={540} y={1280} size={44} color={RED} op={0.5 + 0.4 * Math.sin(t * 8)} />
  </svg>
);

// ---------- 8: no longer special ----------
export const Scene8: React.FC<P> = ({t, frame}) => {
  const tCrack = wordT('longer') - 0.2;
  const crack = ease((t - tCrack) / 0.25);
  const shatter = (t - (tCrack + 0.3));
  const shards = Array.from({length: 9}).map((_, i) => {
    const a = i / 9 * Math.PI * 2 + 0.3, v = 260 + rnd(i) * 220;
    const x = 540 + Math.cos(a) * v * shatter, y = 600 + Math.sin(a) * v * shatter + 900 * shatter * shatter;
    return {x, y, r: shatter * (240 + i * 40)};
  });
  const starPath = Array.from({length: 10}).map((_, i) => { const r = i % 2 ? 62 : 150, a = -Math.PI / 2 + i * Math.PI / 5; return `${i ? 'L' : 'M'}${540 + Math.cos(a) * r} ${600 + Math.sin(a) * r}`; }).join(' ') + ' Z';
  const col = mix(GOLD, '#6b7480', ease(shatter / 0.8));
  return (
    <svg width={W} height={H}>
      <path d="M330 1230 L750 1230 L710 1100 L370 1100 Z" fill="#3a3326" stroke={GOLD} strokeWidth={4} />
      <rect x={400} y={1060} width={280} height={40} fill="#4a4030" />
      <Figure x={540} y={1060} s={3.6} color={col} glow={shatter < 0 ? 0.8 : 0} />
      {shatter < 0 && (
        <g transform={`translate(540 600) scale(${sp(frame, 35.5) * (1 + 0.04 * Math.sin(t * 6))}) translate(-540 -600)`} style={{filter: `drop-shadow(0 0 28px ${GOLD})`}}>
          <path d={starPath} fill={GOLD} />
          {crack > 0 && <path d="M540 470 L520 560 L560 610 L525 700" stroke="#1a1208" strokeWidth={7} fill="none" strokeDasharray={1} pathLength={1} strokeDashoffset={1 - crack} />}
          <Mono text="INTELLIGENCE" x={540} y={810} size={34} color={GOLD} />
        </g>
      )}
      {shatter >= 0 && shards.map((s, i) => <path key={i} d={`M0 -34 L28 24 L-30 18 Z`} transform={`translate(${s.x} ${s.y}) rotate(${s.r})`} fill={GOLD} opacity={clamp(1 - shatter * 0.8)} />)}
      {t > wordT('special') - 0.1 && <text x={540} y={640} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={300} fill="#8aa0b4" opacity={0.8 * sp(frame, wordT('special') - 0.1)}>?</text>}
    </svg>
  );
};

// ---------- 9: the real question ----------
export const Scene9: React.FC<P> = ({t, frame}) => {
  const prog = ease((t - 40.6) / 2.6);
  const circ = 2 * Math.PI * 190;
  const strike = ease((t - 43.45) / 0.3);
  const isnt = wordT("isn't");
  return (
    <svg width={W} height={H}>
      <g transform="translate(540 700)">
        <circle r={190} fill="none" stroke="#17323f" strokeWidth={18} />
        <circle r={190} fill="none" stroke={CYAN} strokeWidth={18} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - prog)} transform="rotate(-90)" style={{filter: `drop-shadow(0 0 14px ${CYAN})`}} />
      </g>
      <HeadNet cx={540} cy={700} size={250} color={CYAN} t={t} />
      <Mono text={`HUMAN-LIKE ${Math.round(prog * 100)}%`} x={540} y={1010} size={36} color={CYAN} />
      <g>
        <text x={540} y={1150} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={54} fill="#fff" opacity={ease((t - 41.2) / 0.5)}>WILL AI BECOME MORE HUMAN?</text>
        <line x1={90} y1={1128} x2={90 + 900 * strike} y2={1128} stroke={RED} strokeWidth={10} strokeLinecap="round" />
      </g>
      {t > isnt && (() => {
        const p = sp(frame, 43.6, {damping: 8, mass: 0.6, stiffness: 220});
        return <g transform={`translate(540 380) rotate(-7) scale(${(2.4 - 1.4 * p)})`} opacity={clamp(p * 2)} style={{display: t < 43.6 ? 'none' : undefined}}>
          <rect x={-300} y={-70} width={600} height={140} rx={14} fill="rgba(0,0,0,.4)" stroke={RED} strokeWidth={10} />
          <text textAnchor="middle" y={26} fontFamily={SANS} fontWeight={900} fontSize={84} fill={RED}>WRONG QUESTION</text>
        </g>;
      })()}
    </svg>
  );
};

// ---------- 10: remember ----------
export const Scene10: React.FC<P> = ({t, frame}) => {
  const beat = (t * 1.25) % 1;
  const pulse = 1 + 0.12 * Math.exp(-beat * 7);
  const hp = sp(frame, 44.6, {damping: 10, mass: 0.7, stiffness: 140});
  const pts: string[] = [];
  for (let i = 0; i <= 70; i++) {
    const x = 40 + i * 14.3, u = i / 70;
    if (u > ease((t - 44.6) / 2.2)) break;
    const ph = (u * 5) % 1;
    const y = 1200 - (ph > 0.42 && ph < 0.46 ? -60 : ph > 0.46 && ph < 0.5 ? 100 : ph > 0.5 && ph < 0.54 ? -30 : 0);
    pts.push(`${x},${y}`);
  }
  const fin = ease((t - 48.2) / 0.5);
  return (
    <svg width={W} height={H}>
      <g opacity={1 - fin * 0.8} transform={`translate(540 ${640 + fin * 180}) scale(${hp * pulse * (1 + fin * 0.5)})`}>
        <path d="M0 150 C-250 -20 -150 -190 0 -70 C150 -190 250 -20 0 150 Z" fill="#ff5e6c" style={{filter: 'drop-shadow(0 0 40px #ff5e6c)'}} />
      </g>
      {Array.from({length: 8}).map((_, i) => <Figure key={i} x={100 + i * 118 + (i === 7 ? 20 : 0)} y={1040} s={1.1 + i * 0.06} color={GOLD} glow={0.5} op={ease((t - 45.0 - i * 0.1) / 0.3) * (1 - fin)} />)}
      <polyline points={pts.join(' ')} fill="none" stroke={GOLD} strokeWidth={5} opacity={0.8 * (1 - fin)} />
      {fin > 0 && <g opacity={fin}>
        <text x={540} y={880} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={158} fill={GOLD} style={{letterSpacing: -3, filter: `drop-shadow(0 0 30px ${GOLD})`}} transform={`translate(540 860) scale(${1 + 0.03 * Math.exp(-((t * 1.25) % 1) * 6)}) translate(-540 -860)`}>REMEMBER</text>
        <Mono text="WHAT IT MEANS TO BE HUMAN" x={540} y={960} size={34} color="#e8d3a6" spacing={8} />
      </g>}
    </svg>
  );
};
