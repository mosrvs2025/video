import React from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Stage, Cam, P, F, SceneProps, keys, keys3, clamp, smooth, easeOut, expoOut, rnd, ph, line, act, Spoken, SPRITE, Shaft, V3, win} from '../lib';
import {Phone, Table, Earth, Arc, ll} from '../shared';

// ---------- building and city (instanced, built once) ----------
const tower = (() => {
  const W = 18, H = 64, D = 18, n: number[] = [];
  const pts: number[] = [];
  for (let f = 0; f < 20; f++) for (let c = 0; c < 6; c++) { const y = 2 + f * 3.1; for (const side of [0, 1]) { const x = side ? W / 2 + 0.05 : -W / 2 + 1.5 + c * 3.0; const z = side ? -D / 2 + 1.5 + c * 3.0 : D / 2 + 0.05; if (rnd(f * 13 + c * 7 + side) > 0.45) pts.push(x, y, z); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return {W, H, D, g};
})();
const city = (() => {
  const N = 46, S = 34; const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({color: '#1c212a', roughness: 0.7, metalness: 0.2}), N * N); const o = new THREE.Object3D(); const pts: number[] = []; let k = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const d = Math.hypot(i - N / 2, j - N / 2) / (N / 2); const hgt = 8 + Math.pow(rnd(i * 31 + j), 2) * 90 * (1.2 - d); const x = (i - N / 2) * S, z = (j - N / 2) * S; const bw = 14 + rnd(i + j * 3) * 12;
    o.position.set(x, 0, z); o.scale.set(bw, Math.max(4, hgt), bw); o.updateMatrix(); im.setMatrixAt(k++, o.matrix);
    const lit = Math.floor(hgt / 2); for (let q = 0; q < lit; q++) if (rnd(q * 7 + i * 3 + j * 11) > 0.5) { const side = q % 4; const yy = 2 + rnd(q + i) * hgt; const off = (rnd(q * 3 + j) - 0.5) * bw; pts.push(x + (side === 0 ? bw / 2 + 0.2 : side === 1 ? -bw / 2 - 0.2 : off), yy, z + (side === 2 ? bw / 2 + 0.2 : side === 3 ? -bw / 2 - 0.2 : off)); }
  }
  im.frustumCulled = false; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return {im, g};
})();
const ARCS: Arc[] = Array.from({length: 70}).map((_, i) => ({a: Math.floor(rnd(i * 3 + 900) * 900), b: Math.floor(rnd(i * 5 + 901) * 900), color: '#a9bccd', lift: 0.05 + rnd(i) * 0.08, speed: 0.15 + rnd(i + 2) * 0.2}));

export const S7Final: React.FC<SceneProps> = ({t, w, h, v}) => {
  const tB = ph('f2', 1) - 0.3, tC = ph('f2', 2) + 0.35, tE = ph('f2', 3) + 1.4, tBlack = line('f4').t1 + 1.15, tLine = tBlack + 0.7, A0 = act('final').t0;
  const stage = t < tB ? 'room' : t < tC ? 'building' : t < tE ? 'city' : 'earth';
  const dis = (a: number) => win(t, a - 0.25, a + 0.35, 0.25, 0.35);
  // room: the same table, the same phone, nothing happening
  const rp = keys3(t, [[A0 - 0.4, v ? [0.3, 0.55, 0.45] : [0.42, 0.36, 0.5]], [tB, v ? [1.0, 1.5, 1.6] : [1.5, 1.2, 1.8]]]);
  // building: back away from one window
  const bp = keys3(t, [[tB, [2, 30, 16]], [tC + 0.3, [40, 44, 110]]]);
  // city: rise
  const cp = keys3(t, [[tC, [160, 110, 420]], [tE + 0.3, [320, 380, 1250]]]);
  // earth: from low orbit to the whole night side
  const ed = keys(t, [[tE, 17], [ph('f3', 0) - 0.2, 30], [tBlack, 38]]) * (v ? 1.35 : 1); const ea = keys(t, [[tE, 0.3], [tBlack, -0.25]]), ee = keys(t, [[tE, 0.62], [tBlack, 0.3]]);
  const ep: V3 = [Math.sin(ea) * Math.cos(ee) * ed, Math.sin(ee) * ed, Math.cos(ea) * Math.cos(ee) * ed];
  const netO = smooth((t - ph('f2', 4)) / 1.5) * (1 - smooth((t - (tBlack - 1.8)) / 1.6));
  return (
    <AbsoluteFill style={{background: P.ink}}>
      {t < tBlack && <Stage w={w} h={h} shadows={stage === 'room'}>
        {stage === 'room' && <>
          <Cam pos={rp} look={[0, 0, 0]} fov={30} />
          <Table light={0.85} /><Phone on={0} t={t} /><Shaft p={[0.15, 2.2, 0.3]} r={0.95} len={2.95} c="#dfe6ee" o={0.07} /><ambientLight intensity={0.03} /><fog attach="fog" args={['#050608', 1.5, 6]} />
          {/* walls and a window, revealed as we pull back */}
          <mesh position={[0, 0.6, -2.2]}><planeGeometry args={[6, 3]} /><meshStandardMaterial color="#121418" roughness={0.9} /></mesh>
          <mesh position={[-0.6, 0.9, -2.19]}><planeGeometry args={[1.2, 1.1]} /><meshBasicMaterial color="#0d1626" /></mesh>
          {Array.from({length: 40}).map((_, i) => <mesh key={i} position={[-1.15 + rnd(i) * 1.1, 0.4 + rnd(i + 3) * 1.0, -2.18]}><planeGeometry args={[0.02, 0.025]} /><meshBasicMaterial color="#fff1d6" transparent opacity={0.6} /></mesh>)}
        </>}
        {stage === 'building' && <>
          <Cam pos={bp} look={[0, 32, 0]} fov={40} far={3000} />
          <fog attach="fog" args={['#050608', 80, 600]} />
          <mesh position={[0, tower.H / 2, 0]}><boxGeometry args={[tower.W, tower.H, tower.D]} /><meshStandardMaterial color="#101216" roughness={0.8} /></mesh>
          <points geometry={tower.g}><pointsMaterial map={SPRITE} size={2.2} color="#fff1d6" transparent opacity={0.85} depthWrite={false} sizeAttenuation /></points>
          <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2000, 2000]} /><meshStandardMaterial color="#07080a" /></mesh>
          <hemisphereLight args={['#2c3440', '#050608', 0.5]} />
        </>}
        {stage === 'city' && <>
          <Cam pos={cp} look={[0, 30, -200]} fov={40} near={2} far={8000} />
          <fog attach="fog" args={['#050608', 400, 2600]} />
          <primitive object={city.im} />
          <points geometry={city.g}><pointsMaterial map={SPRITE} size={4.2} color="#ffe9c4" transparent opacity={1} depthWrite={false} sizeAttenuation={false} fog={false} blending={THREE.AdditiveBlending} /></points>
          <directionalLight position={[-300, 200, 400]} intensity={0.6} color="#8ea2b4" />
          <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[8000, 8000]} /><meshStandardMaterial color="#060709" /></mesh>
          <hemisphereLight args={['#3c4656', '#050608', 1.2]} />
        </>}
        {stage === 'earth' && <>
          <Cam pos={ep} look={[0, 0, 0]} fov={v ? 44 : 34} far={5000} />
          <ambientLight intensity={0.06} /><directionalLight position={[-40, 10, -30]} intensity={0.5} color="#9fb3c8" />
          <Earth t={t} land={0.7} lights={1.0} atmo={1} arcs={ARCS.map((a) => ({...a, o: netO}))} rot={(t - tE) * 0.015 + 2.2} />
        </>}
      </Stage>}
      <AbsoluteFill style={{background: '#000', opacity: Math.max(dis(tB), dis(tC), dis(tE))}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,.7) 100%)'}} />
      {[['A ROOM', ph('f1', 1), tB], ['A BUILDING', tB + 0.2, tC], ['A CITY', tC + 0.15, tE], ['A PLANET', tE + 0.3, ph('f3', 0) - 0.4]].map(([l, a, b], i) => <div key={i} style={{position: 'absolute', left: v ? 70 : 120, bottom: v ? 420 : 110, fontFamily: F.mono, fontSize: 18, letterSpacing: 8, color: P.paperDim, opacity: win(t, a as number, b as number, 0.25, 0.3)}}>{l}</div>)}
      <Spoken id="f3" t={t} x={w / 2} y={v ? 760 : 420} w={v ? 940 : 1500} size={v ? 66 : 72} hold={3.9} />
      <Spoken id="f4" t={t} x={w / 2} y={v ? 760 + 170 : 420 + 100} w={v ? 940 : 1500} size={v ? 66 : 72} hold={1.2} accent={['look?']} />
      {t >= tBlack && <AbsoluteFill style={{background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 300, fontSize: v ? 50 : 54, letterSpacing: v ? 8 : 14, color: P.paper, textAlign: 'center', lineHeight: 1.4, opacity: expoOut((t - tLine) / 1.2)}}>{v ? <>WHAT IF THE MACHINE<br />HAD NO ADDRESS?</> : 'WHAT IF THE MACHINE HAD NO ADDRESS?'}</div>
      </AbsoluteFill>}
    </AbsoluteFill>
  );
};
