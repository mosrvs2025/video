import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Stage, Cam, P, F, SceneProps, keys, keys3, clamp, smooth, easeOut, rnd, ph, line, Label, Glow, Process, Shaft, V3, win, project} from '../lib';
import {Earth, Arc, ll, city} from '../shared';

const T_GLOBE = 78.2;
const DX = [0, 7, 14, 21];

// ---------- four devices, four environments ----------
const Laptop: React.FC<{on: number}> = ({on}) => (
  <group>
    <mesh position={[0, 0.72, 0]}><boxGeometry args={[1.6, 0.04, 0.8]} /><meshStandardMaterial color="#2a211b" roughness={0.6} /></mesh>
    <mesh position={[0, 0.75, 0.05]}><boxGeometry args={[0.36, 0.015, 0.25]} /><meshStandardMaterial color="#9ba1a8" metalness={0.8} roughness={0.3} /></mesh>
    <group position={[0, 0.757, -0.075]} rotation={[-0.32, 0, 0]}>
      <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.36, 0.24, 0.008]} /><meshStandardMaterial color="#9ba1a8" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, 0.12, 0.0045]}><planeGeometry args={[0.33, 0.21]} /><meshBasicMaterial color={new THREE.Color(0.1 * on, 0.13 * on, 0.18 * on)} /></mesh>
    </group>
    {/* window with moonlight */}
    <mesh position={[0.2, 1.6, -0.9]}><planeGeometry args={[1.2, 1.4]} /><meshBasicMaterial color="#0f1824" /></mesh>
    {[[0.2, 1.6, 0.04, 1.4], [0.2, 1.6, 1.2, 0.04]].map(([x, y, sw, sh], i) => <mesh key={i} position={[x, y, -0.88]}><boxGeometry args={[sw, sh, 0.03]} /><meshStandardMaterial color="#1a1c20" /></mesh>)}
    <pointLight position={[0.3, 2.0, -0.4]} intensity={3.4} distance={3.5} color="#8fa6c4" />
  </group>
);
const Workstation: React.FC = () => (
  <group>
    <mesh position={[0, 0.72, 0]}><boxGeometry args={[1.8, 0.04, 0.85]} /><meshStandardMaterial color="#77746d" roughness={0.7} /></mesh>
    <mesh position={[-0.6, 0.98, -0.05]}><boxGeometry args={[0.2, 0.48, 0.45]} /><meshStandardMaterial color="#1b1c1f" roughness={0.5} /></mesh>
    <mesh position={[-0.6, 1.0, 0.176]}><planeGeometry args={[0.012, 0.012]} /><meshBasicMaterial color="#8fd0ff" /></mesh>
    <mesh position={[0.15, 1.12, -0.2]}><boxGeometry args={[0.62, 0.38, 0.03]} /><meshStandardMaterial color="#111" /></mesh>
    <mesh position={[0.15, 1.12, -0.184]}><planeGeometry args={[0.58, 0.34]} /><meshBasicMaterial color="#101820" /></mesh>
    <mesh position={[0.15, 0.85, -0.2]}><boxGeometry args={[0.05, 0.22, 0.05]} /><meshStandardMaterial color="#222" /></mesh>
    <mesh position={[0, 1.4, -0.5]}><boxGeometry args={[2.0, 1.4, 0.05]} /><meshStandardMaterial color="#5a5f66" roughness={0.9} /></mesh>
    <mesh position={[0, 2.6, 0]}><boxGeometry args={[1.2, 0.03, 0.2]} /><meshBasicMaterial color="#e8eef4" /></mesh>
    <pointLight position={[0, 2.3, 0.4]} intensity={1.6} distance={3.6} color="#dde6ee" />
  </group>
);
const Server: React.FC<{t: number}> = ({t}) => (
  <group>
    {[-0.66, 0, 0.66].map((x, k) => <group key={k} position={[x, 0, 0]}>
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.62, 2.1, 1.0]} /><meshStandardMaterial color="#16191d" roughness={0.45} metalness={0.6} /></mesh>
      {Array.from({length: 14}).map((_, i) => <mesh key={i} position={[0, 0.25 + i * 0.13, 0.502]}><planeGeometry args={[0.5, 0.08]} /><meshStandardMaterial color="#22262b" /></mesh>)}
      {Array.from({length: 14}).map((_, i) => <mesh key={`l${i}`} position={[0.2, 0.25 + i * 0.13, 0.504]}><planeGeometry args={[0.02, 0.02]} /><meshBasicMaterial color={rnd(i + k * 20 + Math.floor(t * 4)) > 0.4 ? '#7fb0e0' : '#1d2a38'} /></mesh>)}
    </group>)}
    <pointLight position={[0, 2.6, 1.6]} intensity={5} distance={4.5} color="#b6c8dc" />
  </group>
);
const Speaker: React.FC<{t: number}> = ({t}) => (
  <group>
    <mesh position={[0, 0.88, 0]}><boxGeometry args={[2.0, 0.06, 0.7]} /><meshStandardMaterial color="#d9d4ca" roughness={0.35} /></mesh>
    <mesh position={[0, 0.43, 0]}><boxGeometry args={[1.98, 0.84, 0.66]} /><meshStandardMaterial color="#2b2e33" roughness={0.6} /></mesh>
    <mesh position={[0.25, 1.0, 0]}><cylinderGeometry args={[0.07, 0.075, 0.18, 32]} /><meshStandardMaterial color="#4a4d52" roughness={0.95} /></mesh>
    <mesh position={[0.25, 1.091, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.045, 0.058, 40]} /><meshBasicMaterial color={new THREE.Color().setHSL(0.55, 0.6, 0.35 + 0.2 * Math.sin(t * 2))} /></mesh>
    <mesh position={[-0.5, 0.97, 0.05]}><cylinderGeometry args={[0.04, 0.035, 0.12, 16]} /><meshStandardMaterial color="#e9e4da" roughness={0.3} /></mesh>
    <mesh position={[0, 1.6, -0.36]}><boxGeometry args={[2.2, 1.3, 0.04]} /><meshStandardMaterial color="#3e3b36" roughness={0.6} /></mesh>
    <pointLight position={[-0.2, 1.5, 0.7]} intensity={1.6} distance={2.4} color="#f1e5d0" />
  </group>
);
const DEV = [{name: 'Laptop', env: 'left on overnight'}, {name: 'Office workstation', env: 'idle after hours'}, {name: 'Rented cloud server', env: 'billed by the hour'}, {name: 'Smart speaker', env: 'always on, always listening for a word'}];
const METERS = [{cpu: 2.7, mem: '38 MB of 16 GB'}, {cpu: 3.1, mem: '52 MB of 32 GB'}, {cpu: 1.9, mem: '140 MB of 256 GB'}, {cpu: 4.0, mem: '6 MB of 512 MB'}];

// network categories on the globe
const mkArcs = (n: number, seed: number, color: string, lift = 0.1, speed = 0.3): Arc[] => Array.from({length: n}).map((_, i) => ({a: Math.floor(rnd(seed + i * 3) * 600), b: Math.floor(rnd(seed + i * 7 + 1) * 600), color, lift: lift * (0.6 + rnd(seed + i)), speed: speed * (0.6 + rnd(i + seed * 2))}));
const ARCS_FAH = mkArcs(44, 11, '#a9bccd', 0.09, 0.22);
const ARCS_MIRAI = Array.from({length: 40}).map((_, i) => ({a: Math.floor(rnd(500 + i) * 1500), b: [3, 9, 20][i % 3], color: '#c4553b', lift: 0.05, speed: 0.6 + rnd(i) * 0.4}));
const ARCS_AGENT = mkArcs(10, 77, '#e9e4da', 0.22, 0.15);

export const S3Network: React.FC<SceneProps> = ({t, w, h, v}) => {
  const devT = [ph('r1', 1), ph('r1', 2), ph('r1', 3), ph('r1', 4)], meterT = ph('r2', 0);
  const globe = t >= T_GLOBE;
  // devices camera: one device per phrase, then a wide row for the meters
  const dist = v ? 3.6 : 2.6;
  const H2 = (i: number) => (devT[i + 1] ?? meterT) - 0.7; // hold on each device until just before the next phrase
  const DP: V3[] = [[DX[0] + 0.2, 1.35, dist], [DX[1] + 0.2, 1.45, dist], [DX[2] + 0.2, 1.5, dist + 0.4], [DX[3] + 0.2, 1.4, dist]];
  const DL: V3[] = [[DX[0], 0.95, 0], [DX[1], 1.0, 0], [DX[2], 1.1, 0], [DX[3], 0.98, 0]];
  const dpos = keys3(t, [[64.2, [DX[0] - 1.2, 1.7, dist + 1.4]], ...[0, 1, 2, 3].flatMap((i) => [[devT[i] + 0.1, DP[i]], [H2(i), [DP[i][0] + 0.25, DP[i][1], DP[i][2] - 0.25]]] as [number, V3][]), [meterT + 0.7, [10.5, 3.4, 19 * (v ? 1.7 : 1)]], [T_GLOBE, [10.5, 9, 24 * (v ? 1.7 : 1)]]]);
  const dlook = keys3(t, [[64.2, DL[0]], ...[0, 1, 2, 3].flatMap((i) => [[devT[i] + 0.1, DL[i]], [H2(i), DL[i]]] as [number, V3][]), [meterT + 0.7, [10.5, 1.0, 0]], [T_GLOBE, [10.5, 0.5, 0]]]);
  const dfov = v ? 48 : 36;
  // globe camera: arrive from deep space, then travel along the network
  const gt = t - T_GLOBE;
  const gDist = keys(t, [[T_GLOBE, 70], [T_GLOBE + 4, 30], [97, 25], [105, 21], [113, 19]]) * (v ? 1.35 : 1);
  const gAng = keys(t, [[T_GLOBE, 0.9], [113, -0.4]]), gEl = keys(t, [[T_GLOBE, 0.5], [97, 0.32], [113, 0.15]]);
  const gpos: V3 = [Math.sin(gAng) * Math.cos(gEl) * gDist, Math.sin(gEl) * gDist, Math.cos(gAng) * Math.cos(gEl) * gDist];
  const fah = smooth((t - ph('r3', 1)) / 1.2), mirai = smooth((t - ph('r4', 1)) / 1.0), agent = smooth((t - ph('r5', 0)) / 1.0), venn = smooth((t - ph('r6', 0)) / 1.0);
  const dimPast = (x: number, next: number) => x * (1 - 0.65 * next);
  const arcs = [...ARCS_FAH.map((a) => ({...a, o: dimPast(fah, Math.max(mirai, venn))})), ...ARCS_MIRAI.map((a) => ({...a, o: dimPast(mirai, Math.max(agent, venn))})), ...ARCS_AGENT.map((a) => ({...a, o: dimPast(agent, venn)}))];
  return (
    <AbsoluteFill style={{background: P.ink}}>
      {!globe ? <Stage w={w} h={h}>
        <Cam pos={dpos} look={dlook} fov={dfov} />
        <fog attach="fog" args={['#050608', 6, 40]} />
        <hemisphereLight args={['#4a5662', '#050608', 0.6]} />
        {DX.map((x, i) => <Shaft key={i} p={[x, 2.9, 0]} r={1.25} len={2.9} c={['#9fb6d2', '#e3e9ef', '#b6c8dc', '#f1e5d0'][i]} o={0.11} />)}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0, 0]}><planeGeometry args={[60, 30]} /><meshStandardMaterial color="#0a0b0d" roughness={0.6} metalness={0.3} /></mesh>
        <group position={[DX[0], 0, 0]}><Laptop on={1} /></group>
        <group position={[DX[1], 0, 0]}><Workstation /></group>
        <group position={[DX[2], 0, 0]}><Server t={t} /></group>
        <group position={[DX[3], 0, 0]}><Speaker t={t} /></group>
        {DX.map((x, i) => <Process key={i} p={[x + [0.05, -0.55, 0.15, 0.25][i], [0.93, 1.32, 2.3, 1.25][i], [0.2, 0.25, 0.6, 0.1][i]]} s={0.05} t={t + i} o={smooth((t - devT[i] - 0.4) / 0.8)} />)}
      </Stage> : <Stage w={w} h={h}>
        <Cam pos={gpos} look={[0, 0, 0]} fov={v ? 44 : 34} far={4000} />
        <ambientLight intensity={0.15} /><directionalLight position={[30, 20, 40]} intensity={0.8} color="#9fb3c8" />
        <Earth t={t} land={smooth(gt / 2)} lights={0.35 * smooth(gt / 3)} atmo={smooth(gt / 2)} arcs={arcs} arcO={1} rot={gt * 0.02} />
        {/* category emphasis drawn as separate passes (dim the others) */}
      </Stage>}
      <AbsoluteFill style={{background: '#000', opacity: win(t, T_GLOBE - 0.5, T_GLOBE + 0.6, 0.5, 0.6)}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,.6) 100%)'}} />
      {/* device labels */}
      {!globe && DEV.map((d, i) => <Label key={i} x={v ? 70 : 120} y={v ? 1260 : 760} o={win(t, devT[i] - 0.1, (devT[i + 1] ?? meterT) - 0.1, 0.4, 0.3)} kicker={`HOST ${String(i + 1).padStart(2, '0')}`} title={d.name} sub={d.env} />)}
      {!globe && t > meterT && DX.map((x, i) => { const [sx, sy] = project([x, i === 2 ? 2.4 : 1.6, 0], dpos, dlook, dfov, w, h); const o = smooth((t - meterT - i * 0.25) / 0.6) * clamp((T_GLOBE - 0.6 - t) / 0.4); const m = METERS[i];
        return <div key={i} style={{position: 'absolute', left: sx - 110, top: sy - 150, width: 220, opacity: o, fontFamily: F.mono, color: P.paper}}>
          <div style={{fontSize: 13, letterSpacing: 4, color: P.paperDim}}>CPU</div>
          <div style={{height: 6, background: 'rgba(233,228,218,.12)', marginTop: 6, position: 'relative'}}><div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${m.cpu * easeOut((t - meterT - i * 0.25) / 1.2)}%`, background: P.amber}} /></div>
          <div style={{fontSize: 20, marginTop: 6}}>{(m.cpu * easeOut((t - meterT - i * 0.25) / 1.2)).toFixed(1)}%</div>
          <div style={{fontSize: 13, letterSpacing: 4, color: P.paperDim, marginTop: 12}}>MEMORY</div>
          <div style={{fontSize: 18, marginTop: 4, opacity: smooth((t - ph('r2', 1)) / 0.5)}}>{m.mem}</div>
        </div>; })}
      {!globe && <Label x={v ? 540 : 960} y={v ? 1500 : 900} align="center" w={800} o={win(t, ph('r2', 2), T_GLOBE - 0.5, 0.5, 0.4)} title="Too small to notice" sub="each device gives up almost nothing" />}
      {/* categories */}
      <Label x={v ? 70 : 120} y={v ? 1250 : 700} o={win(t, ph('r3', 0) + 0.3, ph('r4', 0) - 0.2, 0.6, 0.5)} kicker="DISTRIBUTED COMPUTING · 2020" title="Folding@home" sub="volunteers' spare computers briefly outpaced the fastest supercomputer of the time" tag="EXISTS TODAY" color={P.steel} />
      <Label x={v ? 70 : 120} y={v ? 1250 : 700} o={win(t, ph('r4', 0), ph('r5', 0) - 0.2, 0.5, 0.5)} kicker="MALWARE · BOTNET · 2016" title="Mirai" sub="about 600,000 hijacked cameras and routers at its peak" tag="EXISTS TODAY" color={P.rust} />
      <Label x={v ? 70 : 120} y={v ? 1250 : 700} o={win(t, ph('r5', 0), ph('r6', 0) - 0.2, 0.5, 0.5)} kicker="AUTONOMOUS AI AGENTS · 2023–" title="Replication evaluations" sub="tested on copying themselves and acquiring resources: mostly unsuccessful so far" tag="ACTIVE RESEARCH" />
      {venn > 0 && <Venn t={t} o={venn * clamp((113.4 - t) / 0.6)} v={v} w={w} h={h} />}
    </AbsoluteFill>
  );
};


const Venn: React.FC<{t: number; o: number; v: boolean; w: number; h: number}> = ({t, o, v, w, h}) => {
  const cx = w / 2, cy = v ? h * 0.42 : h * 0.47, r = v ? 210 : 190, d = r * 0.62;
  const C = [{x: cx - d, y: cy - d * 0.55, c: '#a9bccd', l: 'Distributed computing'}, {x: cx + d, y: cy - d * 0.55, c: '#c4553b', l: 'Malware & botnets'}, {x: cx, y: cy + d * 0.75, c: '#e9e4da', l: 'Autonomous AI agents'}];
  const q = easeOut((t - ph('r6', 1)) / 1.0);
  return (
    <AbsoluteFill style={{opacity: o, background: `rgba(5,6,8,${0.55 * o})`}}>
      <svg width={w} height={h}>
        {C.map((k, i) => <g key={i}><circle cx={k.x} cy={k.y} r={r * easeOut((t - ph('r6', 0) - i * 0.25) / 0.8)} fill={k.c} fillOpacity={0.06} stroke={k.c} strokeOpacity={0.7} strokeWidth={1.5} />
          <text x={k.x + (i === 0 ? -r * 0.45 : i === 1 ? r * 0.45 : 0)} y={k.y + (i === 2 ? r * 0.55 : -r * 0.35)} fill={k.c} fontFamily="Inter Display" fontSize={20} letterSpacing={4} textAnchor="middle">{k.l.toUpperCase()}</text>
          <text x={k.x + (i === 0 ? -r * 0.45 : i === 1 ? r * 0.45 : 0)} y={k.y + (i === 2 ? r * 0.55 : -r * 0.35) + 28} fill="#e9e4da" fillOpacity={0.5} fontFamily="DejaVu Sans Mono" fontSize={14} letterSpacing={3} textAnchor="middle">{['EXISTS TODAY', 'EXISTS TODAY', 'ACTIVE RESEARCH'][i]}</text></g>)}
        <circle cx={cx} cy={cy - d * 0.1} r={46 * q} fill="#f0a14a" fillOpacity={0.12} stroke="#f0a14a" strokeWidth={1.5} />
        <text x={cx} y={cy - d * 0.1 + 14} fill="#f0a14a" fontFamily="FreeSerif" fontStyle="italic" fontSize={44} textAnchor="middle" opacity={q}>?</text>
      </svg>
      <div style={{position: 'absolute', left: 0, width: w, top: cy + r + d + (v ? 40 : 10), textAlign: 'center', fontFamily: F.mono, fontSize: 16, letterSpacing: 6, color: P.amber, opacity: q}}>ALL THREE COMBINED, WITH ONE GOAL · NOT OBSERVED</div>
    </AbsoluteFill>
  );
};
