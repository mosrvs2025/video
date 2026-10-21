import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Stage, Cam, P, F, SceneProps, keys, keys3, clamp, smooth, easeOut, expoOut, rnd, line, ph, SPRITE, V3, win} from '../lib';
import {Phone, Table, phoneGeo, screenTex} from '../shared';

const T_DIE = 11.35, T_FIELD = 13.42, T_BLACK = 20.25, T_TITLE = 20.8;

// ---------- microscopic world: a die of graphite cells, amber operations running the lanes ----------
const DIE_N = 46;
const dieMesh = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
  const m = new THREE.MeshStandardMaterial({color: '#3a414b', roughness: 0.5, metalness: 0.55});
  const im = new THREE.InstancedMesh(g, m, DIE_N * DIE_N); const o = new THREE.Object3D(); let k = 0;
  for (let i = 0; i < DIE_N; i++) for (let j = 0; j < DIE_N; j++) {
    const h = 0.08 + Math.pow(rnd(i * 91 + j), 3) * 0.9 + (i % 7 === 0 || j % 9 === 0 ? -0.07 : 0);
    o.position.set((i - DIE_N / 2) * 1.0, 0, (j - DIE_N / 2) * 1.0); o.scale.set(0.82, Math.max(0.02, h), 0.82); o.updateMatrix(); im.setMatrixAt(k++, o.matrix);
  }
  im.instanceMatrix.needsUpdate = true; return im;
})();
const Die: React.FC<{t: number}> = ({t}) => {
  const lt = t - T_DIE;
  const pulses = useMemo(() => Array.from({length: 90}).map((_, i) => ({lane: Math.floor(rnd(i) * DIE_N) - DIE_N / 2 + 0.5, dir: rnd(i + 3) > 0.5 ? 1 : -1, ax: rnd(i + 5) > 0.5, sp: 2 + rnd(i + 7) * 5, ph: rnd(i + 9) * 60})), []);
  return (
    <group>
      <fog attach="fog" args={['#06080b', 6, 30]} />
      <primitive object={dieMesh} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#0a0c0f" roughness={0.3} metalness={0.8} /></mesh>
      <directionalLight position={[-8, 3, 4]} intensity={3.2} color="#c9d4e0" />
      <directionalLight position={[6, 5, -3]} intensity={0.9} color="#7a8aa0" />
      <ambientLight intensity={0.35} />
      {pulses.map((p, i) => { const s = ((lt * p.sp + p.ph) % 60) - 30; const pos: V3 = p.ax ? [s * p.dir, 0.05, p.lane] : [p.lane, 0.05, s * p.dir];
        return <group key={i} position={pos}>
          <mesh scale={p.ax ? [0.5, 0.02, 0.04] : [0.04, 0.02, 0.5]}><boxGeometry /><meshBasicMaterial color={P.amber} /></mesh>
          <sprite scale={[0.9, 0.9, 0.9]}><spriteMaterial map={SPRITE} color={P.amber} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        </group>; })}
    </group>
  );
};

// ---------- the field: thousands of phones, then a plane of a million points ----------
const FN = 90, FS = 0.32;
const field = (() => {
  const body = new THREE.InstancedMesh(phoneGeo, new THREE.MeshStandardMaterial({color: '#14161a', roughness: 0.4, metalness: 0.6}), FN * FN);
  const sg = new THREE.PlaneGeometry(0.068, 0.15); const scr = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({map: screenTex, color: '#ffffff', toneMapped: false}), FN * FN); body.frustumCulled = false; scr.frustumCulled = false;
  const o = new THREE.Object3D(); let k = 0;
  for (let i = 0; i < FN; i++) for (let j = 0; j < FN; j++) {
    const x = (i - FN / 2) * FS + (rnd(i * 7 + j) - 0.5) * 0.08, z = (j - FN / 2) * FS + (rnd(i + j * 13) - 0.5) * 0.08, r = (rnd(i * 3 + j * 5) - 0.5) * 0.9;
    o.position.set(x, 0.0035, z); o.rotation.set(-Math.PI / 2, 0, r); o.scale.set(1, 1, 1); o.updateMatrix(); body.setMatrixAt(k, o.matrix);
    o.position.set(x, 0.0086, z); o.updateMatrix(); scr.setMatrixAt(k, o.matrix); k++;
  }
  // far field: one point per device out to the horizon
  const NP = 260000, pos = new Float32Array(NP * 3), apos = new Float32Array(NP * 3);
  for (let n = 0; n < NP; n++) { const a = rnd(n * 1.7) * Math.PI * 2, rr = n % 5 < 3 ? 15 + Math.pow(rnd(n * 2.3 + 1), 1.6) * 320 : 60 + Math.pow(rnd(n * 2.3 + 1), 0.6) * 2600; const x = Math.cos(a) * rr, z = Math.sin(a) * rr; pos.set([x, 0.01, z], n * 3); apos.set([x + 0.04, 0.02, z], n * 3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(apos, 3));
  return {body, scr, pg, ag};
})();
const Field: React.FC<{t: number; dark: number}> = ({t, dark}) => {
  const lt = t - T_FIELD; const on = 1 - dark;
  (field.scr.material as THREE.MeshBasicMaterial).color.setRGB(0.75 * on, 0.8 * on, 0.9 * on);
  return (
    <group>
      <fog attach="fog" args={['#050608', 30, 2600]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><planeGeometry args={[8000, 8000]} /><meshStandardMaterial color="#07080a" roughness={0.95} polygonOffset polygonOffsetFactor={4} polygonOffsetUnits={4} /></mesh>
      <primitive object={field.body} /><primitive object={field.scr} />
      <points geometry={field.pg} frustumCulled={false} renderOrder={2}><pointsMaterial depthTest={false} map={SPRITE} size={3.4} sizeAttenuation={false} color="#9fb2c6" transparent opacity={0.95 * on * smooth((lt - 1.2) / 1.5)} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
      <points geometry={field.ag} frustumCulled={false} renderOrder={3}><pointsMaterial depthTest={false} map={SPRITE} size={2.6} sizeAttenuation={false} color={P.amber} transparent opacity={0.85 * on * smooth((lt - 4.0) / 1.5)} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
      <hemisphereLight args={['#4a5866', '#050608', 0.6]} />
      <spotLight position={[0.1, 2.0, 0.2]} angle={0.5} penumbra={1} intensity={6 * clamp(1 - lt / 2.5)} distance={5} color="#dfe6ee" />
    </group>
  );
};

export const S1Hook: React.FC<SceneProps> = ({t, w, h, v}) => {
  const room = t < T_DIE, die = t >= T_DIE && t < T_FIELD, fld = t >= T_FIELD && t < T_BLACK + 0.4;
  const wake = smooth((t - 2.25) / 0.5) * (t < 2.25 ? 0 : 1);
  const glyph = smooth((t - 6.2) / 1.6);
  // room camera: slow approach, then through the glass
  const rp = keys3(t, [[0, v ? [0.55, 0.95, 0.9] : [0.95, 0.62, 1.15]], [9.3, v ? [0.16, 0.42, 0.26] : [0.3, 0.34, 0.4]], [10.4, [0.04, 0.12, 0.06]], [T_DIE, [0.0, 0.016, 0.001]]]);
  const rl = keys3(t, [[0, [0, 0, 0]], [9.3, [0, 0, 0]], [T_DIE, [0.0, 0.0, 0]]]);
  const rf = keys(t, [[0, 28], [9.3, 30], [T_DIE, 34]]);
  // die camera: skim forward over the cells
  const dlt = t - T_DIE; const dp: V3 = [-6 + dlt * 2.6, keys(dlt, [[0, 3.2], [2.0, 1.25]]), 4 - dlt * 0.6]; const dl: V3 = [dp[0] + 6, 0.2, dp[2] - 4];
  // field camera: exponential altitude, tilting to the horizon
  const flt = t - T_FIELD; const alt = Math.exp(keys(flt, [[0, Math.log(0.22)], [1.5, Math.log(2.2)], [3.1, Math.log(18)], [5.2, Math.log(160)], [7.0, Math.log(520)]]));
  const tilt = keys(flt, [[0, 0.02], [3.2, 0.25], [6.8, 0.9]]);
  const fp: V3 = [0.02 * alt, alt, tilt * alt * 1.6 + 0.001]; const fl: V3 = [0, 0, -tilt * alt * 0.9];
  const dark = smooth((t - T_BLACK) / 0.12);
  const flash = win(t, T_DIE - 0.18, T_DIE + 0.25, 0.18, 0.25);
  const snap = win(t, T_FIELD - 0.12, T_FIELD + 0.35, 0.12, 0.35);
  const count = flt < 1.5 ? null : flt < 3.0 ? '1,000' : flt < 4.8 ? '100,000' : '1,000,000+';
  const ttl = t >= T_TITLE ? 1 : 0, tl = t - T_TITLE;
  return (
    <AbsoluteFill style={{background: P.ink}}>
      {t < T_BLACK + 0.4 && <Stage w={w} h={h} shadows={room}>
        {room && <><Cam pos={rp} look={rl} fov={rf} /><Table light={smooth(t / 2.2) * 0.9 + 0.1} /><Phone on={wake} glyph={glyph} t={t} /><ambientLight intensity={0.03} /><fog attach="fog" args={['#050608', 1.5, 5]} /></>}
        {die && <><Cam pos={dp} look={dl} fov={44} /><Die t={t} /></>}
        {fld && <><Cam pos={fp} look={fl} fov={38} near={Math.max(0.02, alt * 0.05)} far={8000} /><Field t={t} dark={dark} /></>}
      </Stage>}
      {/* glass push-through and snap-back flashes */}
      <AbsoluteFill style={{background: '#8fa3b8', opacity: flash * 0.85}} />
      <AbsoluteFill style={{background: '#000', opacity: snap * 0.9}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,.7) 100%)'}} />
      {fld && count && t < T_BLACK && <div style={{position: 'absolute', left: v ? 70 : 120, ...(v ? {top: 300} : {bottom: 110}), fontFamily: F.mono, color: P.paper, opacity: clamp((flt - 1.5) / 0.4) * clamp((T_BLACK - 0.2 - t) / 0.3)}}>
        <div style={{fontSize: v ? 72 : 64, letterSpacing: 2, fontWeight: 300}}>{count}</div>
        <div style={{fontSize: 16, letterSpacing: 6, color: P.paperDim, marginTop: 8}}>DEVICES · HYPOTHETICAL NODES</div>
      </div>}
      {ttl > 0 && <AbsoluteFill style={{background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <div style={{fontFamily: F.sans, fontWeight: 300, fontSize: v ? 64 : 70, letterSpacing: v ? 10 : 16, color: P.paper, textAlign: 'center', lineHeight: 1.25, whiteSpace: 'nowrap'}}>
          {(v ? ['THE AI THAT', 'NOBODY CAN FIND'] : ['THE AI THAT NOBODY CAN FIND']).map((row, r) => <div key={r}>{Array.from(row).map((ch, i) => { const q = expoOut((tl - 0.08 - (r * 11 + i) * 0.035) / 0.9); return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: q, filter: `blur(${(1 - q) * 8}px)`}}>{ch}</span>; })}</div>)}
        </div>
        <div style={{width: 260 * easeOut((tl - 0.9) / 1.2), height: 1, background: P.amber, marginTop: 34, opacity: 0.85}} />
        <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: 6, color: P.paperDim, marginTop: 22, opacity: clamp((tl - 1.3) / 0.6)}}>A SPECULATIVE THREAT MODEL</div>
      </AbsoluteFill>}
    </AbsoluteFill>
  );
};
