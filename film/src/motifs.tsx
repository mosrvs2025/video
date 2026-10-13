import React from 'react';
import {interpolate, random} from 'remotion';
import {Dog, Person} from './ui';
import type {Motif} from './data';

type P = {f: number; d: number};
const DUDE = '#8fb8d8';
const PENNY = '#f2a65a';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ground = (y: number, color = '#120f16') => <rect x={0} y={y} width={1920} height={760 - y} fill={color} />;

const Windows: React.FC<{x: number; y: number; cols: number; rows: number; f: number; chaos?: number; warm?: string}> = ({
  x, y, cols, rows, f, chaos = 0, warm = '#ffd58a',
}) => (
  <>
    {Array.from({length: cols * rows}).map((_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const on = random(`w${i}`) > 0.35 + chaos * 0.2 * Math.sin(f / 6 + i);
      return <rect key={i} x={x + c * 56} y={y + r * 64} width={34} height={44} fill={on ? warm : '#1b1722'} opacity={on ? 0.85 : 1} />;
    })}
  </>
);

const Shuttle: React.FC<P> = ({f}) => {
  const rise = interpolate(f, [0, 70], [0, 380], clamp);
  const boom = interpolate(f, [70, 100], [0, 1], clamp);
  return (
    <g>
      {ground(660)}
      {f < 72 && (
        <g transform={`translate(960 ${620 - rise})`}>
          <path d="M-18 0 v-120 q18 -50 36 0 v120z" fill="#e8e4dc" />
          <path d="M-18 -20 l-24 40 h24z M18 -20 l24 40 h-24z" fill="#c9553d" />
          <ellipse cx={0} cy={26} rx={16} ry={38 + 14 * Math.sin(f)} fill="#ffb347" opacity={0.9} />
        </g>
      )}
      {boom > 0 && (
        <g transform={`translate(960 ${620 - 380})`}>
          <circle r={boom * 260} fill="#ffd58a" opacity={(1 - boom) * 0.9} />
          {Array.from({length: 28}).map((_, i) => {
            const a = (i / 28) * Math.PI * 2, r = boom * (120 + random(`s${i}`) * 380);
            return <rect key={i} x={Math.cos(a) * r} y={Math.sin(a) * r + boom * 80} width={10} height={4} fill="#e8e4dc" opacity={1 - boom * 0.7} transform={`rotate(${a * 57} ${Math.cos(a) * r} ${Math.sin(a) * r})`} />;
          })}
        </g>
      )}
      <Person x={1500} y={700} color={DUDE} scale={1.4} />
      <Person x={1590} y={700} color="#c47a8f" scale={1.4} lean={interpolate(f, [90, 150], [0, 14], clamp)} />
    </g>
  );
};

const Office: React.FC<P> = ({f}) => (
  <g>
    {ground(620, '#2a2832')}
    <rect y={0} width={1920} height={620} fill="#23222a" />
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${260 + i * 400} 0)`}>
        <rect x={-110} y={470} width={220} height={16} fill="#555060" />
        <rect x={-60} y={380} width={120} height={80} fill="#0e0d12" stroke="#6f6a7c" strokeWidth={4} />
        <rect x={-50} y={390} width={100} height={60} fill="#1c3c4a" opacity={0.5 + 0.2 * Math.sin(f / 5 + i)} />
        {i === 0 && <Person x={0} y={620} color={DUDE} scale={1.6} />}
        {i === 1 && <Person x={0} y={interpolate(f, [30, 70], [620, 640], clamp)} color="#777" scale={1.6} lean={interpolate(f, [30, 80], [0, 35], clamp)} />}
        {i === 2 && <g><rect x={-14} y={420} width={22} height={50} fill="#7a4a32" /><rect x={-10} y={405} width={14} height={16} fill="#7a4a32" /></g>}
        {i === 3 && <Person x={interpolate(f, [20, 120], [0, 700], clamp)} y={620} color="#9a8f7a" scale={1.6} />}
      </g>
    ))}
    <g transform="translate(960 120)">
      <circle r={62} fill="#e8e4dc" /><circle r={56} fill="#15141a" />
      <line y2={-40} stroke="#e8e4dc" strokeWidth={4} transform={`rotate(${f * 6})`} />
      <line y2={-28} stroke="#e8e4dc" strokeWidth={6} transform={`rotate(${f / 2})`} />
    </g>
  </g>
);

const Party: React.FC<P> = ({f}) => (
  <g>
    <rect width={1920} height={760} fill="#2a1520" />
    {Array.from({length: 14}).map((_, i) => (
      <g key={i}>
        <line x1={i * 150 + 60} y1={0} x2={i * 150 + 60} y2={110 + (i % 3) * 30} stroke="#555" strokeWidth={2} />
        <circle cx={i * 150 + 60} cy={120 + (i % 3) * 30} r={14} fill={['#ffb347', '#e86a92', '#7fd1ae'][i % 3]} opacity={0.6 + 0.4 * Math.sin(f / 4 + i * 2)} />
      </g>
    ))}
    <rect x={380} y={470} width={1160} height={30} fill="#6b4a3a" />
    <rect x={440} y={500} width={24} height={160} fill="#4a3226" /><rect x={1440} y={500} width={24} height={160} fill="#4a3226" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i}>
        <path d={`M${480 + i * 180} 470 l6 -50 h28 l6 50z`} fill="#e86a92" opacity={0.8} transform={`rotate(${Math.sin(f / 8 + i) * 6} ${500 + i * 180} 470)`} />
        <Person x={440 + i * 200} y={700} color={['#c47a8f', '#7fb0a0', '#a89368'][i % 3]} scale={1.5} lean={Math.sin(f / 10 + i * 1.7) * 12} />
      </g>
    ))}
    <Person x={1730} y={700} color={DUDE} scale={1.5} />
    <rect x={1620} y={430} width={220} height={70} rx={8} fill="#000" opacity={0.0} />
  </g>
);

const Mail: React.FC<P> = ({f}) => (
  <g>
    <rect width={1920} height={760} fill="#1d1a26" />
    <Windows x={120} y={80} cols={7} rows={8} f={f} />
    <rect x={1000} y={0} width={920} height={760} fill="#17141c" />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={1100} y={200 + i * 180} width={600} height={10} fill="#4b4658" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => <rect key={k} x={1100 + k * 85} y={210 + i * 180} width={5} height={110} fill="#4b4658" />)}
      </g>
    ))}
    <Person x={1250} y={380} color={PENNY} scale={1.5} lean={Math.sin(f / 9) * 3} />
    <Person x={1560} y={560} color={DUDE} scale={1.5} />
    {Array.from({length: 14}).map((_, i) => {
      const t = interpolate(f, [20 + i * 4, 90 + i * 4], [0, 1], clamp);
      return (
        <g key={i} opacity={interpolate(t, [0, 0.1, 1], [0, 1, 1])} transform={`translate(${1250 + (1560 - 1250) * t + Math.sin(i + f / 10) * 20} ${300 + 220 * t - Math.sin(t * 3.1) * 90}) rotate(${i * 20 + t * 180})`}>
          <rect x={-22} y={-14} width={44} height={28} fill="#efe6cf" /><path d="M-22 -14 l22 16 l22 -16" stroke="#9a8f7a" fill="none" strokeWidth={2} />
        </g>
      );
    })}
  </g>
);

const Riot: React.FC<P> = ({f}) => (
  <g>
    <rect width={1920} height={760} fill="#2a0f0f" />
    <rect width={1920} height={760} fill="#ff5a1f" opacity={0.12 + 0.08 * Math.sin(f / 3)} />
    <Windows x={200} y={50} cols={14} rows={9} f={f} chaos={1} warm="#ff9a4a" />
    {ground(650, '#0d0808')}
    {Array.from({length: 5}).map((_, i) => (
      <Person key={i} x={interpolate(f, [0, 150], [-100 - i * 70, 1900], clamp) % 2200} y={720} color="#3a2a2a" scale={1.4 - i * 0.05} lean={12} />
    ))}
    <Person x={interpolate(f, [10, 150], [300, 1500], clamp)} y={720} color={DUDE} scale={1.5} lean={10} />
    <Person x={interpolate(f, [10, 150], [200, 1400], clamp)} y={720} color={PENNY} scale={1.5} lean={10} />
    {Array.from({length: 20}).map((_, i) => (
      <circle key={i} cx={random(`e${i}`) * 1920} cy={650 - ((f * (2 + random(`v${i}`) * 4) + i * 90) % 650)} r={2 + random(`r${i}`) * 3} fill="#ffb26b" opacity={0.7} />
    ))}
  </g>
);

const RoadScene: React.FC<P & {extra?: React.ReactNode; tint?: string}> = ({f, extra, tint = '#f2a65a'}) => (
  <g>
    <defs><linearGradient id="rs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b2a4a" /><stop offset="1" stopColor={tint} /></linearGradient></defs>
    <rect width={1920} height={440} fill="url(#rs)" />
    <rect y={440} width={1920} height={320} fill="#1b1a1f" />
    <path d="M880 440 L1040 440 L1500 760 L420 760z" fill="#2c2b33" />
    {Array.from({length: 8}).map((_, i) => {
      const t = ((i / 8 + f / 60) % 1);
      const y = 440 + 320 * t * t, w = 4 + 26 * t * t, h = 8 + 70 * t * t;
      return <rect key={i} x={960 - w / 2} y={y} width={w} height={h} fill="#e8e4dc" opacity={0.8} />;
    })}
    {extra}
  </g>
);

const Truck: React.FC<P> = ({f}) => (
  <RoadScene f={f} d={0} extra={
    <g transform={`translate(560 ${600 + Math.sin(f / 3) * 2})`}>
      <rect x={0} y={-170} width={560} height={150} fill="#7a3b2e" />
      <rect x={560} y={-130} width={170} height={110} fill="#a64d3a" />
      <rect x={600} y={-115} width={90} height={55} fill="#bcd8e8" opacity={0.7} />
      <circle cx={120} cy={0} r={34} fill="#0c0b0e" /><circle cx={620} cy={0} r={34} fill="#0c0b0e" />
      <Person x={640} y={-60} color={PENNY} scale={0.7} />
      <Dog x={420} y={-170} scale={1.1} wag={Math.sin(f / 3) * 8} />
    </g>
  } />
);

const Diner: React.FC<P> = ({f}) => (
  <g>
    <rect width={1920} height={760} fill="#1a0f26" />
    {Array.from({length: 30}).map((_, i) => (
      <circle key={i} cx={random(`a${i}`) * 1920} cy={random(`b${i}`) * 700} r={6 + random(`c${i}`) * 16} fill={['#ff4fa3', '#4ff0ff', '#ffe14f'][i % 3]} opacity={0.15 + 0.2 * Math.abs(Math.sin(f / 8 + i))} />
    ))}
    <rect x={360} y={160} width={1200} height={90} rx={12} fill="#2a1038" stroke="#ff4fa3" strokeWidth={6} opacity={0.6 + 0.4 * Math.abs(Math.sin(f / 5))} />
    <text x={960} y={225} textAnchor="middle" fontSize={64} fontWeight={800} fill="#ff4fa3" fontFamily="Helvetica, Arial, sans-serif">FRIENDSY’S · OPEN</text>
    {ground(640, '#0e0816')}
    {Array.from({length: 9}).map((_, i) => (
      <Person key={i} x={300 + i * 170} y={700 + (i % 2) * 30} color={['#ff8ac0', '#7fe0e8', '#ffe14f', DUDE, PENNY][i % 5]} scale={1.4} lean={Math.sin(f / 7 + i) * 14} />
    ))}
  </g>
);

const Jail: React.FC<P> = ({f}) => (
  <g>
    <rect width={1920} height={760} fill="#181a1e" />
    <rect x={0} y={0} width={1920} height={760} fill="#cfe4ff" opacity={0.05 + 0.02 * Math.sin(f / 4)} />
    <Person x={760} y={680} color={DUDE} scale={1.8} lean={-4} />
    <Person x={1060} y={680} color={PENNY} scale={1.8} lean={interpolate(f, [60, 140], [0, 6], clamp)} />
    {Array.from({length: 14}).map((_, i) => <rect key={i} x={i * 140 + 20} y={0} width={18} height={760} fill="#07080a" />)}
    <rect y={110} width={1920} height={22} fill="#07080a" /><rect y={620} width={1920} height={22} fill="#07080a" />
  </g>
);

const Bunker: React.FC<P> = ({f}) => (
  <g>
    <rect width={1920} height={760} fill="#10151a" />
    <rect x={160} y={160} width={520} height={520} rx={20} fill="#2c3943" stroke="#617583" strokeWidth={10} />
    <circle cx={420} cy={420} r={150} fill="#1f2a32" stroke="#617583" strokeWidth={14} />
    {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={420} y1={420} x2={420 + Math.cos(i * 1.05 + f / 30) * 140} y2={420 + Math.sin(i * 1.05 + f / 30) * 140} stroke="#617583" strokeWidth={14} strokeLinecap="round" />)}
    <rect y={650} width={1920} height={110} fill="#0a0d10" />
    <Person x={1250} y={650} color={PENNY} scale={1.9} lean={-6} />
    <rect x={1190} y={440} width={22} height={90} rx={6} fill="#888" transform="rotate(-24 1190 440)" />
    {[0, 1, 2].map((i) => <circle key={i} cx={1470} cy={330} r={30 + ((f / 1.2 + i * 30) % 90)} fill="none" stroke="#7fd1ae" strokeWidth={3} opacity={1 - ((f / 1.2 + i * 30) % 90) / 90} />)}
    <text x={1470} y={338} textAnchor="middle" fontSize={26} fill="#7fd1ae" fontFamily="Courier New, monospace">SURREY</text>
  </g>
);

const House: React.FC<P> = ({f}) => (
  <g>
    <rect width={1920} height={760} fill="#2a1d2c" />
    <rect y={620} width={1920} height={140} fill="#141015" />
    <path d="M300 360 L700 170 L1100 360z" fill="#4a3030" />
    <rect x={340} y={360} width={720} height={260} fill="#c98a4a" />
    <rect x={400} y={410} width={150} height={120} fill="#ffd58a" /><rect x={820} y={410} width={150} height={120} fill="#ffd58a" />
    <Person x={1280} y={700} color={DUDE} scale={1.7} />
    <Person x={1400} y={700} color={PENNY} scale={1.7} lean={Math.sin(f / 15) * 6} />
    <g transform="translate(1680 600)">
      <circle r={90} fill="#0b0a0d" />
      <g transform={`rotate(${f * 6})`}><circle r={30} fill="#c9553d" /><line x1={-80} x2={80} stroke="#333" strokeWidth={2} /></g>
      <line x1={60} y1={-120} x2={10} y2={-10} stroke="#aaa" strokeWidth={5} />
    </g>
    {Array.from({length: 8}).map((_, i) => <text key={i} x={1650 + Math.sin(f / 10 + i) * 30} y={470 - ((f + i * 20) % 160)} fontSize={36} fill="#ffd58a" opacity={0.7 - ((f + i * 20) % 160) / 230}>♪</text>)}
  </g>
);

const Letter: React.FC<P> = ({f}) => {
  const walk = interpolate(f, [60, 150], [0, 500], clamp);
  return (
    <g>
      <rect width={1920} height={760} fill="#27222d" />
      <rect y={640} width={1920} height={120} fill="#0f0d12" />
      <rect x={1100} y={190} width={340} height={450} fill="#8a5b3c" /><rect x={1130} y={230} width={280} height={410} fill="#6e4630" />
      <circle cx={1370} cy={450} r={9} fill="#e8c36a" />
      <g transform={`translate(${1190 - 0} ${620})`}><rect x={-30} y={0} width={60} height={20} fill="#efe6cf" transform={`rotate(${interpolate(f, [40, 60], [0, -2], clamp)})`} opacity={interpolate(f, [30, 40], [0, 1], clamp)} /></g>
      <Person x={interpolate(f, [0, 40], [640, 940], clamp) - walk} y={720} color={DUDE} scale={1.8} />
      <Person x={460} y={720} color={PENNY} scale={1.8} />
    </g>
  );
};

const Plane: React.FC<P> = ({f}) => {
  const t = interpolate(f, [40, 170], [0, 1], {...clamp, easing: (x) => x * x});
  return (
    <g>
      <defs><linearGradient id="pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d5a8c" /><stop offset="1" stopColor="#f2a65a" /></linearGradient></defs>
      <rect width={1920} height={560} fill="url(#pl)" />
      <rect y={560} width={1920} height={200} fill="#232027" />
      <g transform={`translate(${300 + t * 1300} ${560 - t * 360}) rotate(${-t * 14})`}>
        <path d="M0 0 h220 q40 0 60 -14 q-20 -26 -60 -26 h-140 z" fill="#e8e4dc" />
        <path d="M120 -26 l-60 -60 h40 l80 60z" fill="#c9bfae" />
        <path d="M10 -30 l-20 -50 h30 l20 50z" fill="#c9553d" />
        <rect x={150} y={-34} width={40} height={14} fill="#7aa7c7" />
      </g>
      <Person x={430} y={690} color={DUDE} scale={1.8} />
      <Person x={1000} y={690} color="#7a6a55" scale={1.8} />
    </g>
  );
};

const TV: React.FC<P> = ({f}) => (
  <g>
    <rect width={1920} height={760} fill="#0f0e13" />
    <rect x={560} y={90} width={800} height={540} rx={30} fill="#2a2630" />
    <rect x={600} y={130} width={720} height={450} rx={14} fill="#1b2a38" />
    {Array.from({length: 40}).map((_, i) => <rect key={i} x={600} y={130 + i * 11.5 + ((f * 3) % 11)} width={720} height={2} fill="#fff" opacity={0.04 + 0.05 * random(`n${i}${Math.floor(f / 2)}`)} />)}
    <circle cx={960} cy={300} r={46} fill="#c9a98a" /><rect x={880} y={346} width={160} height={150} rx={30} fill="#33465a" />
    <rect x={620} y={510} width={680} height={50} fill="#c9553d" /><text x={960} y={546} textAnchor="middle" fill="#fff" fontSize={30} fontFamily="Helvetica, Arial, sans-serif" fontWeight={700}>MATILDA IMPACT IN 16 HOURS</text>
    <Person x={960} y={750} color={DUDE} scale={1.4} />
    <rect y={0} width={1920} height={760} fill="#000" opacity={interpolate(f, [100, 170], [0, 0.55], clamp)} />
  </g>
);

const Bed: React.FC<P> = ({f}) => {
  const shake = Math.sin(f * 3) * interpolate(f, [30, 140], [0, 6], clamp);
  return (
    <g transform={`translate(${shake} ${shake * 0.6})`}>
      <rect width={1920} height={760} fill="#1c1722" />
      <rect x={450} y={260} width={1020} height={300} rx={20} fill="#5b4660" />
      <rect x={450} y={440} width={1020} height={190} fill="#7a6182" />
      <rect x={490} y={360} width={240} height={90} rx={30} fill="#d7c8d8" />
      <circle cx={600} cy={380} r={30} fill={DUDE} /><circle cx={720} cy={382} r={30} fill={PENNY} />
      <rect x={800} y={400} width={500} height={80} rx={30} fill="#3b2f44" />
      <rect x={1150} y={0} width={220} height={260} fill="#ffd58a" opacity={0.15 + 0.1 * Math.sin(f / 6)} />
      {Array.from({length: 12}).map((_, i) => <circle key={i} cx={random(`d${i}`) * 1920} cy={((f * (1 + random(`g${i}`) * 3) + i * 80) % 760)} r={2} fill="#bbb" opacity={0.5} />)}
    </g>
  );
};

const Flash: React.FC<P> = ({f, d}) => {
  const w = interpolate(f, [d * 0.45, d * 0.8], [0, 1], clamp);
  return (
    <g>
      <rect width={1920} height={760} fill="#1c1722" />
      <circle cx={960} cy={380} r={w * 1600} fill="#fff" />
      <rect width={1920} height={760} fill="#fff" opacity={interpolate(f, [d * 0.8, d], [0, 1], clamp)} />
      <Person x={900} y={700} color={DUDE} scale={1.6} /><Person x={1020} y={700} color={PENNY} scale={1.6} />
    </g>
  );
};

export const MotifView: React.FC<{motif: Motif; f: number; d: number}> = ({motif, f, d}) => {
  const p = {f, d};
  const M: Record<Motif, React.ReactNode> = {
    shuttle: <Shuttle {...p} />, office: <Office {...p} />, party: <Party {...p} />, mail: <Mail {...p} />,
    riot: <Riot {...p} />, truck: <Truck {...p} />, diner: <Diner {...p} />, jail: <Jail {...p} />,
    bunker: <Bunker {...p} />, house: <House {...p} />, letter: <Letter {...p} />, plane: <Plane {...p} />,
    tv: <TV {...p} />, bed: <Bed {...p} />, flash: <Flash {...p} />,
  };
  return <svg viewBox="0 0 1920 760" width={1920} height={760} style={{display: 'block'}}>{M[motif]}</svg>;
};
