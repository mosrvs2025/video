import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Stage, Cam, P, SceneProps, keys, keys3, clamp, smooth, easeOut, easeInOut, rnd, ph, line, Label, SPRITE, Glow, V3, win} from '../lib';

// ---------- the hall ----------
const ROWS = 9, PER = 46;
const hall = (() => {
  const rg = new THREE.BoxGeometry(0.62, 2.1, 1.05); rg.translate(0, 1.05, 0);
  const racks = new THREE.InstancedMesh(rg, new THREE.MeshStandardMaterial({color: '#15181c', roughness: 0.5, metalness: 0.6}), ROWS * 2 * PER);
  const lg = new THREE.BoxGeometry(0.02, 1.7, 0.012); lg.translate(0, 1.05, 0);
  const leds = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({color: '#6f8aa6', toneMapped: false}), ROWS * 2 * PER);
  const o = new THREE.Object3D(); let k = 0;
  for (let r = 0; r < ROWS; r++) for (const side of [-1, 1]) for (let i = 0; i < PER; i++) {
    const x = side * (1.6 + r * 2.6), z = -40 + i * 0.66;
    o.position.set(x, 0, z); o.rotation.set(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0); o.updateMatrix(); racks.setMatrixAt(k, o.matrix);
    o.position.set(x - side * 0.535, 0, z + (rnd(k) - 0.5) * 0.3); o.updateMatrix(); leds.setMatrixAt(k, o.matrix); k++;
  }
  racks.frustumCulled = leds.frustumCulled = false; return {racks, leds};
})();

// ---------- the four machines ----------
const Processing: React.FC<{t: number; c: string; core: string}> = ({t, c, core}) => {
  const ico = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const verts = useMemo(() => { const p = ico.attributes.position as THREE.BufferAttribute; const seen = new Map<string, V3>(); for (let i = 0; i < p.count; i++) { const v: V3 = [p.getX(i), p.getY(i), p.getZ(i)]; seen.set(v.map((x) => x.toFixed(3)).join(','), v); } return [...seen.values()]; }, [ico]);
  return (
    <group rotation={[t * 0.12, t * 0.2, 0]}>
      <mesh geometry={ico}><meshBasicMaterial color={c} wireframe transparent opacity={0.55} /></mesh>
      <mesh scale={0.34}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color={core} emissive={core} emissiveIntensity={0.8} flatShading /></mesh>
      {verts.map((v, i) => { const on = Math.max(0, Math.sin(t * 3 - i * 0.7)); return <mesh key={i} position={v} scale={0.045 + on * 0.03}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={on > 0.8 ? core : c} /></mesh>; })}
    </group>
  );
};
const Memory: React.FC<{t: number; c: string; core: string}> = ({t, c, core}) => (
  <group rotation={[0, t * 0.15, 0]}>
    {Array.from({length: 9}).map((_, i) => <group key={i} position={[0, -0.9 + i * 0.22, 0]}>
      <mesh><boxGeometry args={[1.5, 0.025, 1.0]} /><meshStandardMaterial color={c} transparent opacity={0.22} roughness={0.05} metalness={0.3} /></mesh>
      {Array.from({length: 5}).map((_, k) => { const on = rnd(i * 7 + k + Math.floor(t * 1.5 + i)) > 0.55; return <mesh key={k} position={[-0.56 + k * 0.28, 0.02, (rnd(i + k) - 0.5) * 0.6]}><boxGeometry args={[0.2, 0.012, 0.06]} /><meshBasicMaterial color={on ? core : c} transparent opacity={on ? 1 : 0.35} /></mesh>; })}
    </group>)}
  </group>
);
const Compute: React.FC<{t: number; c: string; core: string}> = ({t, c, core}) => (
  <group rotation={[0.35, t * 0.18, 0]}>
    {Array.from({length: 16}).map((_, i) => { const x = (i % 4) - 1.5, z = Math.floor(i / 4) - 1.5; const ph0 = ((t * 1.4 - (x + z) * 0.25) % 2 + 2) % 2; const flip = smooth(clamp(ph0 * 2 - 1)) * Math.PI / 2;
      return <mesh key={i} position={[x * 0.42, 0, z * 0.42]} rotation={[flip, 0, 0]}><boxGeometry args={[0.3, 0.3, 0.3]} /><meshStandardMaterial color={ph0 > 0.5 && ph0 < 1 ? core : c} roughness={0.4} metalness={0.3} emissive={ph0 > 0.5 && ph0 < 1 ? core : '#000'} emissiveIntensity={0.6} /></mesh>; })}
  </group>
);
const Coord: React.FC<{t: number; c: string; core: string}> = ({t, c, core}) => (
  <group>
    <mesh rotation={[t * 0.2, t * 0.3, 0]} scale={0.62}><octahedronGeometry args={[1, 0]} /><meshStandardMaterial color={c} roughness={0.3} metalness={0.4} flatShading /></mesh>
    {[0, 1, 2].map((k) => { const u = ((t * 0.45 + k / 3) % 1); return <mesh key={k} rotation={[Math.PI / 2, 0, 0]} scale={0.7 + u * 1.6}><torusGeometry args={[1, 0.006, 4, 64]} /><meshBasicMaterial color={core} transparent opacity={(1 - u) * 0.8} /></mesh>; })}
  </group>
);
const FORMS = [{C: Processing, name: 'Processing', sub: 'turns input into decisions'}, {C: Memory, name: 'Memory', sub: 'stores what the system knows'}, {C: Compute, name: 'Specialised compute', sub: 'runs one kind of calculation'}, {C: Coord, name: 'Coordination', sub: 'keeps the pieces working together'}];
const FX = [-6, -2, 2, 6], FY = 1.7, FZ = 2.5;
const LINKS = [[0, 1], [1, 2], [2, 3], [0, 3], [3, 1]].map(([a, b], k) => { const pa = new THREE.Vector3(FX[a], FY, FZ), pb = new THREE.Vector3(FX[b], FY, FZ); const mid = pa.clone().lerp(pb, 0.5).add(new THREE.Vector3(0, 0.6 + k * 0.25, 0)); const curve = new THREE.QuadraticBezierCurve3(pa, mid, pb); const mat = new THREE.LineBasicMaterial({color: '#a9b4be', transparent: true, opacity: 0}); return {curve, mat, obj: new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), mat)}; });

export const S2Spread: React.FC<SceneProps> = ({t, w, h, v}) => {
  const A = 23.1, frac = 40.2, formT = [ph('s4', 0), ph('s4', 1), ph('s4', 2), ph('s4', 3)], ordinary = ph('s6', 0), copies = ph('s6', 2), spec = ph('s6', 4);
  const hallO = 1 - smooth((t - 39.0) / 3.0);
  const led = (0.55 + 0.25 * Math.sin(t * 2.1)) * hallO; (hall.leds.material as THREE.MeshBasicMaterial).color.setRGB(0.42 * led, 0.54 * led, 0.66 * led);
  (hall.racks.material as THREE.MeshStandardMaterial).opacity = hallO; (hall.racks.material as THREE.MeshStandardMaterial).transparent = hallO < 1;
  // camera
  const sx = v ? 0.55 : 1; // vertical frames are narrower: pull back
  const pos = keys3(t, [[A, [0.3, 1.0, -34]], [31.6, [0.8, 1.45, -9.5]], [32.4, [3.3, 0.75, -3.6]], [36.4, [3.0, 0.55, -2.9]], [37.3, [-3.6, 2.3, -9.5]], [42.3, [-2.8, 2.6, -11.0]], ...[0, 1, 2, 3].flatMap((i) => [[formT[i] - 0.15, [FX[i] - 0.3, FY + 0.9, FZ - 5.2 / sx]], [(formT[i + 1] ?? ordinary) - 0.85, [FX[i] + 0.1, FY + 0.8, FZ - 4.9 / sx]]] as [number, V3][]), [ordinary + 0.4, [0, 3.8, -10.5 / sx]], [64.6, [0, 2.9, -9.2 / sx]]]);
  const look = keys3(t, [[A, [0, 1.7, 0]], [31.6, [0, 1.7, 0]], [32.4, [2.2, 0.08, -1.4]], [36.4, [2.2, 0.08, -1.4]], [37.3, [0, 1.6, 0]], [42.3, [0, 1.8, 1.2]], ...[0, 1, 2, 3].flatMap((i) => [[formT[i] - 0.15, [FX[i], FY - 0.55, FZ]], [(formT[i + 1] ?? ordinary) - 0.85, [FX[i], FY - 0.55, FZ]]] as [number, V3][]), [ordinary + 0.4, [0, 0.9, FZ]], [64.6, [0, 1.0, FZ]]]);
  // monolith fracture: 4 x 10 x 2 blocks fly to the four forms
  const fr = clamp((t - frac) / 3.4);
  const shards = useMemo(() => Array.from({length: 80}).map((_, i) => ({p: [((i % 4) - 1.5) * 0.3, 0.16 + Math.floor(i / 8) * 0.32, (Math.floor(i / 4) % 2 - 0.5) * 0.3] as V3, f: i % 4, r: rnd(i)})), []);
  const plug = smooth((t - ph('s2', 3)) / 0.8) * (1 - smooth((t - 36.2) / 0.6));
  const neutral = smooth((t - ordinary) / 1.2);
  const formIn = (i: number) => smooth((t - formT[i] + 0.9) / 1.0);
  const fog = keys(t, [[A, 60], [38.5, 60], [42, 26]]);
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <Stage w={w} h={h}>
        <Cam pos={pos} look={look} fov={v ? 46 : 34} />
        <fog attach="fog" args={['#050608', 4, fog]} />
        <hemisphereLight args={['#6a7886', '#050608', 1.1]} />
        <spotLight position={[2.3, 2.4, -1.6]} angle={0.5} penumbra={0.9} intensity={t > 31 && t < 37.5 ? 14 : 0} distance={5} color="#dfe6ee" />
        <pointLight position={[-1.5, 3.2, -2.5]} intensity={6 * (1 - smooth((t - 40) / 1))} distance={8} color="#b9c6d3" />
        <directionalLight position={[-6, 9, -8]} intensity={1.1} color="#c4d0dc" />
        {/* floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}><planeGeometry args={[80, 90]} /><meshStandardMaterial color="#0a0c0f" roughness={0.22} metalness={0.7} /></mesh>
        {hallO > 0.01 && <><primitive object={hall.racks} /><primitive object={hall.leds} />
          {Array.from({length: 10}).map((_, i) => <mesh key={i} position={[0, 4.2, -40 + i * 3.4]}><boxGeometry args={[0.06, 0.02, 2.6]} /><meshBasicMaterial color="#b8c6d4" transparent opacity={0.6 * hallO} /></mesh>)}</>}
        {/* the monolith and its plug */}
        {fr < 1 && <group>
          {fr === 0 ? <group>
            <mesh position={[0, 1.6, 0]}><boxGeometry args={[1.2, 3.2, 0.6]} /><meshStandardMaterial color="#08090b" roughness={0.12} metalness={0.9} /></mesh>
            <mesh position={[0, 1.6, -0.301]}><planeGeometry args={[0.02, 3.0]} /><meshBasicMaterial color={P.amber} toneMapped={false} /></mesh>
            <Glow p={[0, 1.6, -0.35]} s={1.6} c={P.amber} o={0.35} />
          </group> : shards.map((s, i) => { const tgt: V3 = [FX[s.f] + (rnd(i + 3) - 0.5) * 0.6, FY + (rnd(i + 4) - 0.5) * 0.6, FZ + (rnd(i + 5) - 0.5) * 0.6]; const u = easeInOut(clamp(fr * 1.15 - s.r * 0.15)); const lift = Math.sin(u * Math.PI) * (1.5 + s.r * 2);
            return <mesh key={i} position={[lerp3(s.p[0], tgt[0], u), lerp3(s.p[1], tgt[1], u) + lift, lerp3(s.p[2], tgt[2], u)]} rotation={[u * 4 * s.r, u * 3, 0]} scale={1 - u * 0.85}><boxGeometry args={[0.29, 0.31, 0.29]} /><meshStandardMaterial color="#0c0d10" roughness={0.15} metalness={0.9} emissive={P.amber} emissiveIntensity={0.15 + 0.5 * Math.sin(u * Math.PI)} /></mesh>; })}
        </group>}
        <mesh position={[0.62, 0.05, -1.0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 0.6, 10]} /><meshStandardMaterial color="#101113" roughness={0.6} /></mesh>
        <mesh position={[1.6, 0.035, -1.3]} rotation={[0, -0.3, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 1.4, 10]} /><meshStandardMaterial color="#101113" roughness={0.6} /></mesh>
        <group position={[2.25 + plug * 0.08, 0.06, -1.45]}><mesh><boxGeometry args={[0.16, 0.1, 0.12]} /><meshStandardMaterial color="#202226" roughness={0.4} metalness={0.3} /></mesh>{[-0.03, 0.03].map((z, i) => <mesh key={i} position={[0.1, 0, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.06, 8]} /><meshStandardMaterial color="#c9b27a" metalness={1} roughness={0.25} /></mesh>)}</group>
        <mesh position={[2.42, 0.08, -1.45]}><boxGeometry args={[0.06, 0.2, 0.22]} /><meshStandardMaterial color="#d8d2c6" roughness={0.6} /></mesh>
        {/* the four forms */}
        {FORMS.map((F0, i) => { const o = formIn(i); if (o <= 0) return null; const c = neutral > 0 ? lerpCol('#d8d2c6', P.steel, neutral) : '#d8d2c6'; const core = neutral > 0 ? lerpCol(P.amber, P.steel, neutral) : P.amber;
          return <group key={i} position={[FX[i], FY, FZ]} scale={0.25 + 0.75 * easeOut(o)}><F0.C t={t} c={c} core={core} /></group>; })}
        {/* communication: packets along the links once the system is whole */}
        {t > formT[3] && LINKS.map(({curve, obj, mat}, k) => { const o = smooth((t - formT[3] - 0.5) / 1.0); mat.opacity = 0.35 * o;
          return <group key={k}>
            <primitive object={obj} />
            {[0, 1].map((j) => { const q = curve.getPoint(((t * 0.4 + j * 0.5 + k * 0.17) % 1)); return <sprite key={j} position={q} scale={[0.22, 0.22, 0.22]}><spriteMaterial map={SPRITE} color="#e9e4da" transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>; })}
          </group>; })}
        {/* speculative: amber copies drifting away from every form */}
        {t > copies && FX.map((x, i) => [0, 1, 2].map((k) => { const u = smooth((t - copies - k * 0.5 - i * 0.2) / 2.6); if (u <= 0) return null; const a = rnd(i * 3 + k) * Math.PI * 2;
          return <group key={`${i}${k}`} position={[x + Math.cos(a) * u * 2.2, FY + Math.sin(a) * u * 1.4, FZ + 1 + u * 2.5]} scale={0.3 * u}>
            <mesh><icosahedronGeometry args={[1, 0]} /><meshBasicMaterial color={P.amber} wireframe transparent opacity={0.9 * u} /></mesh>
            <Glow p={[0, 0, 0]} s={3} c={P.amber} o={0.3 * u} />
          </group>; }))}
      </Stage>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,.65) 100%)'}} />
      {/* labels */}
      <Label x={v ? 70 : 120} y={v ? 1280 : 720} o={win(t, ph('s1', 0), ph('s1', 1), 0.6, 0.4)} kicker="CENTRALISED" title="One building" tag="EXISTS TODAY" />
      <Label x={v ? 70 : 120} y={v ? 1280 : 720} o={win(t, ph('s1', 1), ph('s1', 2), 0.4, 0.4)} kicker="CENTRALISED" title="Tens of thousands of chips" tag="EXISTS TODAY" />
      <Label x={v ? 70 : 120} y={v ? 1280 : 720} o={win(t, ph('s1', 2), 31.9, 0.4, 0.4)} kicker="CENTRALISED" title="Watched · Owned" tag="EXISTS TODAY" />
      <Label x={v ? 70 : 120} y={v ? 1280 : 720} o={win(t, ph('s2', 1), 36.6, 0.5, 0.4)} kicker="IN PRINCIPLE" title="An off switch" sub="one place to pull the plug" />
      {FORMS.map((F0, i) => <Label key={i} x={v ? 540 : 960} y={v ? 1300 : 860} align="center" w={700} o={win(t, formT[i] - 0.2, (formT[i + 1] ?? 51.9) - 0.1, 0.4, 0.3)} kicker={`FRAGMENT ${String(i + 1).padStart(2, '0')}`} title={F0.name} sub={F0.sub} />)}
      <Label x={v ? 70 : 120} y={v ? 1280 : 760} o={win(t, ordinary, copies - 0.3, 0.6, 0.4)} kicker="ORDINARY" title="Distributed software" sub="search, streaming, the cloud itself" tag="EXISTS TODAY" />
      <Label x={v ? 70 : 120} y={v ? 1280 : 760} o={win(t, copies - 0.2, 64.6, 0.5, 0.6)} kicker="NEW, AND FAR HARDER" title="Copies itself without permission" sub="and keeps itself running, out of sight" tag={t > spec - 0.2 ? 'SPECULATIVE' : undefined} color={P.amber} />
    </AbsoluteFill>
  );
};
const lerp3 = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpCol = (a: string, b: string, u: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp(u)).getHexString();
