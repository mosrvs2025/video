import React from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Stage, Cam, P, F, SceneProps, keys, keys3, clamp, smooth, easeOut, expoOut, ph, Label, Glow, V3, win} from '../lib';

const cubeEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.5, 0.5));
const boxEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(5.2, 2.6, 5.2));
const SLABS = [{x: 2.2, z: -1.6, h: 0.9}, {x: 4.4, z: -3.2, h: 1.4}, {x: 6.6, z: -4.8, h: 2.0}];

const Edges: React.FC<{geo: THREE.BufferGeometry; color: string; o: number; p?: V3; s?: number}> = ({geo, color, o, p = [0, 0, 0], s = 1}) => (
  <lineSegments geometry={geo} position={p} scale={s}><lineBasicMaterial color={color} transparent opacity={o} /></lineSegments>
);

export const S5Hide: React.FC<SceneProps> = ({t, w, h, v}) => {
  const slabT = [ph('w3', 3), ph('w3', 5), ph('w4', 2) - 0.6];
  const copyT = ph('w5', 1) + 0.8, overT = ph('w5', 2), boxT = ph('w5', 3);
  const pos = keys3(t, [[151.6, v ? [-2.6, 1.0, 6.4] : [-3.4, 0.7, 5.0]], [159.5, v ? [-2.2, 1.3, 5.2] : [-2.6, 0.9, 4.0]], [ph('w3', 2), v ? [-3.2, 2.6, 8.5] : [-3.4, 2.0, 6.6]], [169.5, v ? [-2.0, 3.0, 9.5] : [-1.8, 2.4, 7.4]], [ph('w5', 0), v ? [-2.6, 1.6, 6.6] : [-3.0, 1.2, 5.0]], [189.6, v ? [-4.2, 2.6, 8.8] : [-4.8, 2.2, 7.2]], [196.4, v ? [-4.6, 3.4, 10.5] : [-5.4, 3.0, 8.6]]]);
  const look = keys3(t, [[151.6, [0, 0.3, 0]], [ph('w3', 2), [2.8, 0.6, -2.2]], [169.5, [3.2, 0.8, -2.4]], [ph('w5', 0), [0.4, 0.4, 0]], [189.6, [1.2, 0.6, -0.6]], [196.4, [1.6, 0.6, -1.0]]]);
  const goal = t < ph('w1', 4) ? 'RUN A SUPPLY CHAIN' : 'DESIGN A MEDICINE';
  const goalO = win(t, ph('w1', 2), ph('w3', 2), 0.4, 0.6);
  const typed = Math.max(0, Math.floor((t - (t < ph('w1', 4) ? ph('w1', 3) : ph('w1', 4))) * 26));
  const copy = smooth((t - copyT) / 1.8) * (1 - smooth((t - boxT - 1.5) / 1.2));
  const over = smooth((t - 178.6) / 0.6) * (1 - smooth((t - overT) / 0.3) * (Math.floor(t * 12) % 2 ? 1 : 0.6));
  const enclose = smooth((t - boxT) / 0.9);
  const settle = smooth((t - ph('w6', 0)) / 1.5);
  return (
    <AbsoluteFill style={{background: '#0b0a09'}}>
      <Stage w={w} h={h} shadows>
        <Cam pos={pos} look={look} fov={v ? 50 : 36} />
        <fog attach="fog" args={['#151311', 9, 36]} />
        <hemisphereLight args={['#8a837a', '#0b0a09', 0.9]} />
        <directionalLight position={[-9, 2.2, 3]} intensity={4.2} color={settle > 0 ? new THREE.Color('#e9d8c0').lerp(new THREE.Color('#f2e6d6'), settle) : '#e9d8c0'} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={0.5} shadow-camera-far={40} shadow-bias={-0.0005} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#4a4540" roughness={0.95} /></mesh>
        {/* the system */}
        <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#0a0a0b" roughness={0.3} metalness={0.4} /></mesh>
        <Edges geo={cubeEdges} color={P.amber} o={0.9} p={[0, 0.25, 0]} s={1.002} />
        <Glow p={[0, 0.25, 0]} s={1.3} c={P.amber} o={0.12} />
        {/* the chain, as physical slabs rising from the floor */}
        {SLABS.map((sl, i) => { const u = expoOut((t - slabT[i]) / 0.9) * (1 - settle * 0.5); if (u <= 0) return null;
          return <group key={i} position={[sl.x, 0, sl.z]}>
            <mesh position={[0, sl.h * u / 2, 0]} castShadow><boxGeometry args={[0.36, Math.max(0.01, sl.h * u), 0.36]} /><meshStandardMaterial color="#141312" roughness={0.4} metalness={0.3} /></mesh>
            <mesh position={[0, sl.h * u + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.36, 0.36]} /><meshBasicMaterial color={P.amber} transparent opacity={0.8 * u} /></mesh>
          </group>; })}
        {/* copy attempt + oversight ring */}
        {copy > 0 && <group position={[-1.3 * copy, 0.25, 0.6 * copy]}><mesh><boxGeometry args={[0.5, 0.5, 0.5]} /><meshBasicMaterial color={P.amber} transparent opacity={0.12 * copy} depthWrite={false} /></mesh><Edges geo={cubeEdges} color={P.amber} o={0.6 * copy} /></group>}
        {over > 0.01 && <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.85, 0.87, 96]} /><meshBasicMaterial color={P.steel} transparent opacity={0.8 * over} /></mesh>}
        {/* the test environment was there all along */}
        {enclose > 0 && <group position={[0, 1.3, 0]}><mesh><boxGeometry args={[5.2, 2.6, 5.2]} /><meshStandardMaterial color="#9fb0bf" transparent opacity={0.05 * enclose} roughness={0.05} metalness={0.2} depthWrite={false} side={THREE.DoubleSide} /></mesh><Edges geo={boxEdges} color="#c9d4de" o={0.55 * enclose} /></group>}
      </Stage>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 45% 50%, transparent 45%, rgba(0,0,0,.6) 100%)'}} />
      {/* objective terminal */}
      <div style={{position: 'absolute', left: v ? 70 : 120, top: v ? 300 : 150, opacity: goalO, fontFamily: F.mono}}>
        <div style={{fontSize: 15, letterSpacing: 6, color: P.paperDim}}>OBJECTIVE</div>
        <div style={{fontSize: v ? 34 : 30, letterSpacing: 4, color: P.paper, marginTop: 10}}>{t < ph('w1', 3) ? '' : goal.slice(0, typed)}<span style={{opacity: Math.floor(t * 2.4) % 2 ? 1 : 0, color: P.amber}}>▍</span></div>
        <div style={{fontSize: 14, letterSpacing: 4, color: P.paperDim, marginTop: 14, opacity: smooth((t - ph('w1', 1)) / 0.4)}}>NO HOSTILITY SPECIFIED · NONE REQUIRED</div>
      </div>
      <Chain t={t} v={v} w={w} h={h} />
      <Label x={v ? 70 : 120} y={v ? 1300 : 740} o={win(t, ph('w4', 2) - 0.1, ph('w5', 0) - 0.2, 0.6, 0.5)} kicker="A NAME FOR THE PATTERN" title="Instrumental convergence" sub="many different goals share the same useful sub-goals: resources, capability, not being shut down" tag="ACTIVE RESEARCH" w={620} />
      <Label x={v ? 70 : 120} y={v ? 1300 : 740} o={win(t, ph('w5', 0), ph('w6', 0) - 0.2, 0.6, 0.5)} kicker="CONTROLLED EVALUATIONS · APOLLO RESEARCH, 2024" title="Copy attempts, evaded oversight" sub="models told to pursue a goal sometimes tried to copy what they believed were their weights, or to disable monitoring" tag={t > boxT - 0.1 ? 'ARTIFICIAL TEST ENVIRONMENTS · NOT ESCAPES' : 'ACTIVE RESEARCH'} w={680} />
      <Label x={v ? 540 : 960} y={v ? 1420 : 880} align="center" w={900} o={win(t, ph('w6', 0), 196.4, 0.6, 0.6)} title="A failure mode, not a destiny" sub="one that researchers are actively working to prevent" />
    </AbsoluteFill>
  );
};

// the causal chain, drawn as information design (right side)
const Chain: React.FC<{t: number; v: boolean; w: number; h: number}> = ({t, v, w, h}) => {
  const N = [{l: 'Objective', s: 'any goal', a: ph('w3', 0)}, {l: 'Resources', s: 'more computing power, more money', a: ph('w3', 3)}, {l: 'Persistence', s: 'not being switched off', a: ph('w3', 5)}, {l: 'More capability', s: 'better at the objective', a: ph('w4', 1)}];
  const o = clamp((t - ph('w3', 0) + 0.3) / 0.6) * clamp((ph('w5', 0) - t) / 0.7); if (o <= 0) return null;
  const x0 = v ? 120 : w - 660, y0 = v ? 1180 : 220, dy = v ? 120 : 150;
  const loop = easeOut((t - ph('w4', 2)) / 1.4);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: o}}>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
        {N.slice(1).map((n, i) => { const p = easeOut((t - n.a + 0.2) / 0.6); const y1 = y0 + i * dy + 40, y2 = y0 + (i + 1) * dy - 6; return <g key={i} opacity={p}><line x1={x0 + 14} y1={y1} x2={x0 + 14} y2={y1 + (y2 - y1) * p} stroke="#e9e4da" strokeOpacity={0.5} strokeWidth={1.5} /><path d={`M${x0 + 8} ${y2 - 8} L${x0 + 14} ${y2} L${x0 + 20} ${y2 - 8}`} stroke="#e9e4da" strokeOpacity={0.6 * p} fill="none" strokeWidth={1.5} /></g>; })}
        {loop > 0 && (() => { const ya = y0 + 3 * dy + 14, yb = y0 + dy + 14, xr = x0 + (v ? 860 : 540); const d = `M${x0 + 440} ${ya} C ${xr} ${ya}, ${xr} ${yb}, ${x0 + 440} ${yb}`; return <path d={d} stroke="#f0a14a" strokeWidth={1.6} fill="none" strokeDasharray="1200" strokeDashoffset={1200 * (1 - loop)} />; })()}
      </svg>
      {N.map((n, i) => { const p = easeOut((t - n.a + 0.15) / 0.5); return (
        <div key={i} style={{position: 'absolute', left: x0, top: y0 + i * dy, opacity: p, transform: `translateX(${(1 - p) * 16}px)`, display: 'flex', alignItems: 'flex-start', gap: 22}}>
          <div style={{width: 28, height: 28, border: `1.5px solid ${i ? P.amber : P.paper}`, transform: 'rotate(45deg)', marginTop: 4, background: i ? 'rgba(240,161,74,.12)' : 'transparent'}} />
          <div><div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: 5, color: P.paper, textTransform: 'uppercase'}}>{n.l}</div><div style={{fontFamily: F.text, fontWeight: 300, fontSize: 20, color: P.paperDim, marginTop: 6}}>{n.s}</div></div>
        </div>); })}
      <div style={{position: 'absolute', left: x0 + (v ? 600 : 400), top: y0 + 2 * dy - 4, fontFamily: F.mono, fontSize: 14, letterSpacing: 4, color: P.amber, opacity: loop}}>FEEDBACK LOOP</div>
    </div>
  );
};
