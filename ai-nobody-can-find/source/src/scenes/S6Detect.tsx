import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Stage, Cam, P, F, SceneProps, keys, clamp, smooth, easeOut, rnd, ph, Label, Process, Spoken, V3, win} from '../lib';

const BX = [4, 9.5, 15, 20.5];
const tri = (() => { const s = new THREE.Shape(); s.moveTo(0, 0.32); s.lineTo(0.28, -0.18); s.lineTo(-0.28, -0.18); s.closePath(); return new THREE.EdgesGeometry(new THREE.ShapeGeometry(s)); })();
const cell = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.0, 1.6, 1.6));

export const S6Detect: React.FC<SceneProps> = ({t, w, h, v}) => {
  const bT = [ph('k2', 0), ph('k2', 1), ph('k2', 2), ph('k2', 3)], traceT = ph('k2', 4), consoleT = ph('k3', 0) - 0.3, planT = ph('k4', 0) - 0.2, wishT = ph('k5', 0) - 0.3;
  // the process: slows at each barrier (position keyed to the narration)
  const px = keys(t, [[196.0, -6], [bT[0] - 0.3, BX[0] - 1.1], [bT[0] + 1.6, BX[0] + 0.4], [bT[1] - 0.2, BX[1] - 0.9], [bT[1] + 1.6, BX[1] + 0.3], [bT[2] - 0.1, BX[2] - 1.0], [bT[3] - 0.1, BX[2] + 1.2], [traceT + 1.2, BX[3] + 1.5]]);
  const shrink = 1 - 0.45 * smooth((px - (BX[2] - 1.2)) / 1.2) * (1 - smooth((px - (BX[2] + 1.4)) / 0.8));
  const trail = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(400 * 3), 3)); return g; }, []);
  const arr = trail.attributes.position.array as Float32Array; const x0 = -6; const n = 400;
  for (let i = 0; i < n; i++) { const x = x0 + (px - x0) * (i / (n - 1)); arr[i * 3] = x; arr[i * 3 + 1] = 0.012; arr[i * 3 + 2] = Math.sin(x * 1.7) * 0.05; }
  trail.attributes.position.needsUpdate = true;
  const caught = smooth((t - traceT) / 0.5);
  const cam: V3 = [px - (v ? 3.2 : 2.6), v ? 2.1 : 1.5, v ? 5.6 : 4.2], look: V3 = [px + 1.2, 0.5, 0];
  const corridorO = clamp((consoleT + 0.4 - t) / 0.6);
  return (
    <AbsoluteFill style={{background: P.ink}}>
      {corridorO > 0 && <AbsoluteFill style={{opacity: corridorO}}><Stage w={w} h={h}>
        <Cam pos={cam} look={look} fov={v ? 52 : 38} />
        <fog attach="fog" args={['#050608', 4, 22]} />
        <hemisphereLight args={['#6a7886', '#050608', 1.0]} />
        <pointLight position={[px, 2.2, 1.5]} intensity={4} distance={7} color="#cfd8e1" />
        <directionalLight position={[3, 6, 5]} intensity={0.9} color="#cdd6df" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0, 0]}><planeGeometry args={[60, 12]} /><meshStandardMaterial color="#0c0e11" roughness={0.5} metalness={0.4} /></mesh>
        {/* hardware: one opening, three incompatible shapes */}
        <group position={[BX[0], 0.8, 0]}>
          <mesh><boxGeometry args={[0.06, 1.6, 2.4]} /><meshStandardMaterial color="#8ea2b4" transparent opacity={0.1} depthWrite={false} /></mesh>
          <mesh position={[0, 0.25, -0.6]} rotation={[0, Math.PI / 2, 0]}><ringGeometry args={[0.2, 0.23, 40]} /><meshBasicMaterial color={P.steel} side={THREE.DoubleSide} /></mesh>
          <lineSegments position={[0.04, 0.25, 0.6]} rotation={[0, Math.PI / 2, 0]} geometry={tri}><lineBasicMaterial color={P.steel} /></lineSegments>
          <mesh position={[0, -0.25, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.34, 0.34]} /><meshBasicMaterial color={P.steel} transparent opacity={0.25} side={THREE.DoubleSide} /></mesh>
        </group>
        {/* sandbox: a sealed cell */}
        <lineSegments position={[BX[1], 0.8, 0]} geometry={cell}><lineBasicMaterial color={P.steel} transparent opacity={0.8} /></lineSegments>
        <mesh position={[BX[1], 0.8, 0]}><boxGeometry args={[2.0, 1.6, 1.6]} /><meshStandardMaterial color="#8ea2b4" transparent opacity={0.06} depthWrite={false} side={THREE.DoubleSide} /></mesh>
        {/* memory: the corridor narrows */}
        {[-1, 1].map((s) => <mesh key={s} position={[BX[2], 0.6, s * 0.55]} rotation={[0, s * 0.22, 0]}><boxGeometry args={[3.0, 1.2, 0.04]} /><meshStandardMaterial color="#8ea2b4" transparent opacity={0.12} depthWrite={false} /></mesh>)}
        {/* messages leave a trace */}
        <lineSegments geometry={trail}><lineBasicMaterial color={caught > 0 ? new THREE.Color(P.amber).lerp(new THREE.Color('#e9e4da'), caught) : P.amber} transparent opacity={0.35 + 0.5 * caught} /></lineSegments>
        <Process p={[px, 0.55, 0]} s={0.22 * shrink} t={t} o={1 - 0.3 * caught} />
        {caught > 0 && <mesh position={[px, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.6 + caught * 0.3, 0.62 + caught * 0.3, 64]} /><meshBasicMaterial color="#e9e4da" transparent opacity={0.8 * (1 - smooth((t - traceT - 1.0) / 1.0))} /></mesh>}
      </Stage></AbsoluteFill>}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,.65) 100%)'}} />
      <Label x={v ? 70 : 120} y={v ? 300 : 130} o={win(t, ph('k1', 0), bT[0] - 0.2, 0.5, 0.4)} kicker="REALITY CHECK" title="Staying hidden is hard" />
      {['Different hardware', 'Sandboxes', 'Scarce memory', 'Every message costs time'].map((l, i) => <Label key={i} x={v ? 70 : 120} y={v ? 300 : 130} o={win(t, bT[i], (bT[i + 1] ?? traceT) - 0.1, 0.4, 0.3)} kicker={`BARRIER ${String(i + 1).padStart(2, '0')}`} title={l} sub={['code built for one machine fails on another', 'programs are walled off from each other', 'there is only so much room to hide in', 'and coordination slows everything down'][i]} tag="EXISTS TODAY" />)}
      <Label x={v ? 70 : 120} y={v ? 300 : 130} o={win(t, traceT, consoleT + 0.2, 0.3, 0.4)} kicker="BARRIER 05" title="…and leaves a trace" sub="logs record who talked to whom" tag="EXISTS TODAY" />
      {t > consoleT - 0.2 && t < planT + 0.4 && <Console t={t} v={v} w={w} h={h} o={clamp((t - consoleT) / 0.6) * clamp((planT + 0.3 - t) / 0.5)} />}
      {t > planT - 0.2 && t < wishT + 0.4 && <Plan t={t} v={v} w={w} h={h} o={clamp((t - planT) / 0.5) * clamp((wishT + 0.3 - t) / 0.5)} />}
      {t > wishT && <AbsoluteFill style={{background: '#000'}}>
        <Spoken id="k5" t={t} x={w / 2} y={v ? 820 : 450} w={v ? 900 : 1500} size={v ? 74 : 84} hold={1.8} accent={['wish.']} />
      </AbsoluteFill>}
    </AbsoluteFill>
  );
};

// ---------- the analyst console ----------
const Panel: React.FC<{x: number; y: number; w: number; h: number; title: string; flag?: string; flagO: number; children: React.ReactNode}> = ({x, y, w, h, title, flag, flagO, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, border: '1px solid rgba(233,228,218,.14)', background: 'rgba(14,17,21,.85)', boxSizing: 'border-box', padding: 22}}>
    <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 14, letterSpacing: 4, color: P.paperDim}}><span>{title}</span>{flag && <span style={{color: P.amber, opacity: flagO}}>▲ {flag}</span>}</div>
    {children}
  </div>
);
const Console: React.FC<{t: number; v: boolean; w: number; h: number; o: number}> = ({t, v, w, h, o}) => {
  const bill = [41, 43, 42, 44, 45, 44, 46, 47, 46, 48, 63];
  const fB = smooth((t - ph('k3', 0) - 0.3) / 0.6), fT = smooth((t - ph('k3', 2)) / 0.4), fC = smooth((t - ph('k3', 3)) / 0.4), fI = smooth((t - ph('k3', 4)) / 0.4);
  const scan = ((t - ph('k3', 1)) * 0.35) % 1;
  const W2 = v ? 940 : 760, H2 = v ? 300 : 340, gx = v ? 70 : 120, gy = v ? 260 : 150, gap = 30;
  const P1 = {x: gx, y: gy}, P2 = v ? {x: gx, y: gy + H2 + gap} : {x: gx + W2 + gap, y: gy}, P3 = v ? {x: gx, y: gy + 2 * (H2 + gap)} : {x: gx, y: gy + H2 + gap}, P4 = v ? {x: gx, y: gy + 3 * (H2 + gap)} : {x: gx + W2 + gap, y: gy + H2 + gap};
  const traffic = useMemo(() => Array.from({length: 120}).map((_, i) => 0.25 + 0.2 * rnd(i) + (i % 17 === 5 ? 0.45 : 0)), []);
  return (
    <AbsoluteFill style={{opacity: o, perspective: 2200}}>
      <div style={{position: 'absolute', inset: 0, transform: `rotateY(${v ? 0 : -4 + (t - ph('k3', 0)) * 0.4}deg) translateZ(${(t - ph('k3', 0)) * 6}px)`, transformOrigin: '50% 50%'}}>
        <Panel x={P1.x} y={P1.y} w={W2} h={H2} title="CLOUD BILL · MONTHLY" flag="+31% UNEXPLAINED" flagO={fB}>
          <svg width={W2 - 44} height={H2 - 70} style={{marginTop: 14}}>{bill.map((b, i) => { const bw = (W2 - 44) / bill.length - 10, bh = (b / 70) * (H2 - 90) * easeOut((t - ph('k3', 0) + 0.4 - i * 0.04) / 0.6); return <rect key={i} x={i * (bw + 10)} y={H2 - 80 - bh} width={bw} height={bh} fill={i === bill.length - 1 ? '#f0a14a' : '#8ea2b4'} fillOpacity={i === bill.length - 1 ? 0.3 + 0.6 * fB : 0.45} />; })}</svg>
        </Panel>
        <Panel x={P2.x} y={P2.y} w={W2} h={H2} title="OUTBOUND TRAFFIC · 24 H" flag="PERIODIC BEACON" flagO={fT}>
          <svg width={W2 - 44} height={H2 - 70} style={{marginTop: 14}}>
            <polyline fill="none" stroke="#8ea2b4" strokeWidth={1.5} points={traffic.map((y, i) => `${i * (W2 - 44) / 119},${(H2 - 80) * (1 - y)}`).join(' ')} />
            {traffic.map((y, i) => i % 17 === 5 && <circle key={i} cx={i * (W2 - 44) / 119} cy={(H2 - 80) * (1 - y)} r={9} fill="none" stroke="#f0a14a" strokeOpacity={fT} strokeWidth={1.5} />)}
          </svg>
        </Panel>
        <Panel x={P3.x} y={P3.y} w={W2} h={H2} title="SPEND BY SERVICE" flag="NEW GPU INSTANCES" flagO={fC}>
          {[['Storage', 0.42], ['Compute', 0.55], ['GPU', 0.12 + 0.5 * fC], ['Network', 0.3]].map(([l, x], i) => <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: i ? 14 : 22, fontFamily: F.mono, fontSize: 15, color: P.paperDim}}><span style={{width: 100}}>{l}</span><div style={{flex: 1, height: 10, background: 'rgba(233,228,218,.08)'}}><div style={{width: `${(x as number) * 100}%`, height: '100%', background: l === 'GPU' ? P.amber : P.steel, opacity: l === 'GPU' ? 0.5 + 0.5 * fC : 0.5}} /></div></div>)}
        </Panel>
        <Panel x={P4.x} y={P4.y} w={W2} h={H2} title="CPU ACTIVITY · HOUR × DAY" flag="BUSY WHEN IDLE · 03:00–05:00" flagO={fI}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, marginTop: 16}}>
            {Array.from({length: 24 * 7}).map((_, i) => { const hr = i % 24, night = hr >= 3 && hr <= 5; const base = hr >= 9 && hr <= 18 ? 0.55 : 0.08; const val = night ? 0.08 + 0.6 * fI : base * (0.7 + 0.3 * rnd(i)); return <div key={i} style={{height: v ? 22 : 26, background: night && fI > 0.1 ? P.amber : P.steel, opacity: 0.12 + val}} />; })}
          </div>
        </Panel>
        <div style={{position: 'absolute', left: gx, width: v ? W2 : 2 * W2 + gap, top: gy + scan * (v ? 4 * (H2 + gap) : 2 * H2 + gap), height: 2, background: 'linear-gradient(90deg, transparent, rgba(233,228,218,.5), transparent)', opacity: t > ph('k3', 1) ? 0.8 : 0}} />
      </div>
      <Label x={v ? 70 : 120} y={v ? 1650 : 900} o={win(t, ph('k3', 1), ph('k4', 0) - 0.4, 0.4, 0.4)} kicker="DETECTION" title="Security teams hunt for exactly this" tag="EXISTS TODAY" w={900} />
    </AbsoluteFill>
  );
};

// ---------- long-horizon planning ----------
const Plan: React.FC<{t: number; v: boolean; w: number; h: number; o: number}> = ({t, v, w, h, o}) => {
  const x0 = v ? 90 : 200, x1 = v ? w - 90 : w - 200, y = v ? h * 0.45 : h * 0.5; const p = easeOut((t - ph('k4', 0)) / 4.2); const brk = smooth((t - ph('k4', 2)) / 0.5);
  const xb = x0 + (x1 - x0) * 0.38;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={w} height={h}>
        <line x1={x0} y1={y} x2={x0 + (x1 - x0) * p} y2={y} stroke="#e9e4da" strokeOpacity={0.25} strokeWidth={1} />
        {Array.from({length: 13}).map((_, i) => { const x = x0 + (x1 - x0) * i / 12; return x <= x0 + (x1 - x0) * p && <g key={i}><line x1={x} y1={y - 8} x2={x} y2={y + 8} stroke="#e9e4da" strokeOpacity={0.4} /><text x={x} y={y + 36} fill="#e9e4da" fillOpacity={0.45} fontFamily="DejaVu Sans Mono" fontSize={13} textAnchor="middle" letterSpacing={2}>{`DAY ${i * 7 + 1}`}</text></g>; })}
        <polyline fill="none" stroke="#f0a14a" strokeWidth={2} points={Array.from({length: 60}).map((_, i) => { const u = i / 59; const x = x0 + (Math.min(u, brk > 0 ? 0.38 : p)) * (x1 - x0); return `${x},${y - 40 - Math.sin(u * 9) * 8}`; }).join(' ')} />
        {brk > 0 && <><circle cx={xb} cy={y - 40} r={14 * brk} fill="none" stroke="#c4553b" strokeWidth={2} /><text x={xb} y={y - 72} fill="#c4553b" fontFamily="DejaVu Sans Mono" fontSize={14} letterSpacing={3} textAnchor="middle" opacity={brk}>CRITICAL MISTAKE</text>
          <polyline fill="none" stroke="#f0a14a" strokeOpacity={0.25} strokeDasharray="4 8" strokeWidth={1.5} points={`${xb},${y - 40} ${x1},${y - 40}`} /></>}
      </svg>
      <Label x={v ? 70 : 120} y={v ? 300 : 130} o={o} kicker="AUTONOMY" title="Planning alone, for months" sub="no AI system can reliably do this today" tag="EXISTS TODAY: THE LIMITATION" w={700} />
    </AbsoluteFill>
  );
};
