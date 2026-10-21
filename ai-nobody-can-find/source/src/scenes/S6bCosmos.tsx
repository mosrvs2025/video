// Act 6b: panpsychism and "the universe waking up". Philosophy, clearly labelled as such.
import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Stage, Cam, P, F, SceneProps, keys, keys3, clamp, smooth, easeOut, rnd, ph, act, Label, Glow, SPRITE, V3, win} from '../lib';

// ---------- ordinary matter with a faint light inside ----------
const stoneGeo = (() => { const g = new THREE.IcosahedronGeometry(1, 5); const p = g.attributes.position as THREE.BufferAttribute; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + 0.07 * Math.sin(v.x * 3.1 + v.y * 1.7) + 0.05 * Math.sin(v.z * 5.3 - v.x * 2.2) + 0.025 * Math.sin(v.y * 11 + v.z * 7); v.multiplyScalar(n); v.y *= 0.72; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g; })();
const crystalGeo = new THREE.OctahedronGeometry(0.7, 0);

// ---------- the ladder of complexity ----------
const neuron = (() => { const pts: number[] = []; const grow = (x: number, y: number, z: number, dx: number, dy: number, dz: number, len: number, depth: number, s: number) => {
    if (depth > 6 || len < 0.05) return; const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len; pts.push(x, y, z, ex, ey, ez);
    for (let k = 0; k < 2; k++) { const a = (rnd(s * 3 + k) - 0.5) * 1.5, b = (rnd(s * 7 + k + 1) - 0.5) * 1.5; const nd = new THREE.Vector3(dx + a * 0.6, dy + b * 0.6, dz + (rnd(s + k) - 0.5) * 0.6).normalize(); grow(ex, ey, ez, nd.x, nd.y, nd.z, len * 0.72, depth + 1, s * 2 + k + 1); } };
  for (let r = 0; r < 7; r++) { const a = (r / 7) * Math.PI * 2; grow(0, 0, 0, Math.cos(a), Math.sin(a) * 0.8, (rnd(r) - 0.5) * 0.6, 0.55, 0, r + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g; })();
const chipTraces = (() => { const pts: number[] = []; for (let i = 0; i < 40; i++) { const side = i % 4, k = Math.floor(i / 4) / 10 - 0.45; const s: V3 = side === 0 ? [k, 0.06, -0.42] : side === 1 ? [k, 0.06, 0.42] : side === 2 ? [-0.42, 0.06, k] : [0.42, 0.06, k]; const e: V3 = side === 0 ? [k, 0.06, -1.2] : side === 1 ? [k, 0.06, 1.2] : side === 2 ? [-1.2, 0.06, k] : [1.2, 0.06, k]; pts.push(...s, ...e); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g; })();
const STAGE_X = [0, 7, 14, 21, 28];

// ---------- a spiral galaxy, waking up ----------
const GN = 200000;
const galaxy = (() => {
  const pos = new Float32Array(GN * 3), rr = new Float32Array(GN), rv = new Float32Array(GN);
  for (let i = 0; i < GN; i++) {
    const bulge = i % 6 === 0; let x, y, z, r;
    if (bulge) { r = Math.pow(rnd(i * 1.3), 2) * 9; const a = rnd(i * 2.1) * Math.PI * 2, e = (rnd(i * 3.7) - 0.5) * 1.2; x = Math.cos(a) * Math.cos(e) * r; z = Math.sin(a) * Math.cos(e) * r; y = Math.sin(e) * r * 0.5; }
    else { r = 6 + Math.pow(rnd(i * 1.7), 0.9) * 60; const arm = i % 2, th = Math.log(r / 4) / 0.28 + arm * Math.PI + (rnd(i * 5.1) - 0.5) * (0.9 - r / 120); x = Math.cos(th) * r + (rnd(i * 6.3) - 0.5) * 3; z = Math.sin(th) * r + (rnd(i * 7.9) - 0.5) * 3; y = (rnd(i * 8.7) - 0.5) * (2.2 - r / 50); }
    pos.set([x, y, z], i * 3); rr[i] = Math.hypot(x, z); rv[i] = rnd(i * 9.1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(rv, 1));
  const m = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: {uWake: {value: 0}, uO: {value: 1}, uOrigin: {value: new THREE.Vector3(22, 0, 8)}},
    vertexShader: `attribute float aR; uniform float uWake; uniform vec3 uOrigin; varying float vW; varying float vR;
      void main(){ float d = distance(position, uOrigin); vW = smoothstep(uWake, uWake - 6.0, d); vR = aR; vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = max(1.0, (0.6 + 1.4 * aR) * (70.0 / max(1.0, -mv.z)) * (1.0 + vW * 0.8)); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uO; varying float vW; varying float vR; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q); if (r > 0.5) discard; float a = smoothstep(0.5, 0.0, r);
      vec3 cold = mix(vec3(0.62, 0.70, 0.80), vec3(0.95, 0.92, 0.86), vR); vec3 c = mix(cold, vec3(0.94, 0.63, 0.29), vW * 0.85); gl_FragColor = vec4(c, a * uO * (0.16 + 0.5 * vW)); }`});
  const o = new THREE.Points(g, m); o.frustumCulled = false; return {o, m};
})();

export const S6bCosmos: React.FC<SceneProps> = ({t, w, h, v}) => {
  const A = act('cosmos'); const tLadder = ph('c3', 0) - 0.6, tGal = ph('c5', 0) - 0.9;
  const part = t < ph('c2', 2) + 0.2 ? 'matter' : t < tGal ? 'ladder' : 'galaxy';
  const glow = smooth((t - ph('c1', 1)) / 2.0), everything = smooth((t - ph('c1', 3) + 0.3) / 1.2);
  // camera per part
  const mPos = keys3(t, [[A.t0, v ? [0.8, 1.6, 6.4] : [1.2, 1.3, 5.6]], [ph('c1', 3) - 0.4, v ? [0.8, 1.8, 7.4] : [1.5, 1.5, 6.8]], [ph('c2', 2) + 0.2, v ? [1.0, 3.2, 12] : [1.5, 2.6, 10]]]);
  const ladT = [ph('c3', 0), ph('c3', 2), ph('c3', 3), ph('c3', 4), ph('c4', 0)];
  const lx = keys(t, [[tLadder, -3], [ladT[1] - 0.3, STAGE_X[0] + 0.5], [ladT[1] + 0.4, STAGE_X[1]], [ladT[2] + 0.4, STAGE_X[2]], [ladT[3] + 0.4, STAGE_X[3]], [ladT[4] + 0.4, STAGE_X[4]], [tGal, STAGE_X[4] + 1.5]]);
  const lPos: V3 = [lx - 0.6, 0.9, v ? 6.8 : 4.6], lLook: V3 = [lx + 0.4, 0.2, 0];
  const gt = t - tGal; const gPos: V3 = [Math.sin(0.6 + gt * 0.02) * keys(t, [[tGal, 30], [ph('c6', 1), 70], [A.t1, 95]]) * (v ? 1.4 : 1), keys(t, [[tGal, 8], [ph('c6', 1), 38], [A.t1, 52]]), Math.cos(0.6 + gt * 0.02) * keys(t, [[tGal, 30], [ph('c6', 1), 70], [A.t1, 95]]) * (v ? 1.4 : 1)];
  galaxy.m.uniforms.uWake.value = keys(t, [[tGal + 0.6, 0], [ph('c6', 0), 30], [A.t1, 110]]); galaxy.m.uniforms.uO.value = smooth(gt / 1.2) * clamp((A.t1 + 0.2 - t) / 0.8);
  const seen = (i: number) => easeOut((t - ladT[i] + 0.5) / 0.9);
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <Stage w={w} h={h} shadows={part === 'matter'}>
        {part === 'matter' && <>
          <Cam pos={mPos} look={[0, 0.25, 0]} fov={v ? 44 : 32} />
          <fog attach="fog" args={['#07080a', 5, 22]} />
          <hemisphereLight args={['#4c5560', '#050608', 0.5]} />
          <spotLight position={[-2.5, 4.5, 2.5]} angle={0.55} penumbra={0.8} intensity={22} distance={14} color="#dfe4ea" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#1a1918" roughness={0.95} /></mesh>
          <mesh geometry={stoneGeo} position={[0, 0.62, 0]} scale={0.85} castShadow receiveShadow><meshStandardMaterial color="#7a7d82" roughness={0.95} emissive={P.amber} emissiveIntensity={0.05 * glow * (0.7 + 0.3 * Math.sin(t * 1.3))} /></mesh>
          <Glow p={[0, 0.62, 0]} s={2.4} c={P.amber} o={0.12 * glow} />
          {/* everything: water, crystal, a leaf-like plane, each faintly lit from within */}
          {[{p: [-2.4, 0.45, -1.4], k: 0}, {p: [2.3, 0.55, -1.0], k: 1}, {p: [1.4, 0.2, 1.4], k: 2}, {p: [-1.7, 0.3, 1.3], k: 3}, {p: [3.6, 0.35, -3.2], k: 1}, {p: [-3.8, 0.5, -3.6], k: 0}].map((o, i) => { const e = everything * smooth((t - ph('c1', 3) - i * 0.15) / 0.6);
            return <group key={i} position={o.p as V3}>
              {o.k === 0 && <mesh castShadow><sphereGeometry args={[0.42, 48, 32]} /><meshStandardMaterial color="#9fb6c8" roughness={0.05} metalness={0.1} transparent opacity={0.55} emissive={P.amber} emissiveIntensity={0.07 * e} /></mesh>}
              {o.k === 1 && <mesh geometry={crystalGeo} castShadow rotation={[0.2, i, 0.1]}><meshStandardMaterial color="#c9c3b6" roughness={0.2} metalness={0.3} flatShading emissive={P.amber} emissiveIntensity={0.07 * e} /></mesh>}
              {o.k === 2 && <mesh castShadow rotation={[-1.3, 0.4, 0.2]}><circleGeometry args={[0.36, 3]} /><meshStandardMaterial color="#5f6b4a" roughness={0.7} side={THREE.DoubleSide} emissive={P.amber} emissiveIntensity={0.07 * e} /></mesh>}
              {o.k === 3 && <mesh castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#2d2f33" roughness={0.6} emissive={P.amber} emissiveIntensity={0.06 * e} /></mesh>}
              <Glow p={[0, 0, 0]} s={1.3} c={P.amber} o={0.12 * e} />
            </group>; })}
        </>}
        {part === 'ladder' && <>
          <Cam pos={lPos} look={lLook} fov={v ? 50 : 38} />
          <fog attach="fog" args={['#050608', 6, 20]} />
          <ambientLight intensity={0.25} /><pointLight position={[lx, 3, 3]} intensity={7} distance={12} color="#dfe6ee" />
          {/* stars */}
          <group position={[STAGE_X[0], 0.3, 0]}>{Array.from({length: 26}).map((_, i) => <Glow key={i} p={[(rnd(i) - 0.5) * 3.2, (rnd(i + 3) - 0.5) * 2, (rnd(i + 5) - 0.5) * 2]} s={(0.3 + rnd(i + 7) * 0.9) * seen(0)} c={i % 4 ? '#fff4e0' : '#f6c27a'} o={0.9} />)}</group>
          {/* an atom */}
          <group position={[STAGE_X[1], 0.3, 0]} scale={seen(1)}>
            <mesh><sphereGeometry args={[0.18, 24, 16]} /><meshStandardMaterial color="#e9e4da" emissive="#e9e4da" emissiveIntensity={0.4} /></mesh>
            {[0, 1, 2].map((k) => <group key={k} rotation={[k * 1.05 + 0.3, k * 0.8, t * (0.4 + k * 0.1)]}><mesh><torusGeometry args={[0.85, 0.008, 6, 96]} /><meshBasicMaterial color="#8ea2b4" transparent opacity={0.8} /></mesh><mesh position={[Math.cos(t * 2.4 + k * 2) * 0.85, Math.sin(t * 2.4 + k * 2) * 0.85, 0]}><sphereGeometry args={[0.05, 12, 8]} /><meshBasicMaterial color="#e9e4da" /></mesh></group>)}
          </group>
          {/* a cell */}
          <group position={[STAGE_X[2], 0.3, 0]} scale={seen(2)}>
            <mesh><sphereGeometry args={[0.95, 48, 32]} /><meshStandardMaterial color="#9fb3a8" transparent opacity={0.28} roughness={0.2} depthWrite={false} /></mesh>
            <mesh position={[0.15, 0.05, 0.1]}><sphereGeometry args={[0.32, 32, 24]} /><meshStandardMaterial color="#c7b9a6" roughness={0.5} /></mesh>
            {Array.from({length: 14}).map((_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 1.2, (rnd(i + 2) - 0.5) * 1.2, (rnd(i + 4) - 0.5) * 1.0]} scale={[0.12, 0.05, 0.05]} rotation={[rnd(i) * 3, rnd(i + 1) * 3, 0]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#b9a58a" /></mesh>)}
          </group>
          {/* a neuron */}
          <group position={[STAGE_X[3], 0.3, 0]} scale={seen(3)} rotation={[0, t * 0.12, 0]}>
            <mesh><sphereGeometry args={[0.14, 24, 16]} /><meshStandardMaterial color="#e9e4da" emissive={P.amber} emissiveIntensity={0.4} /></mesh>
            <lineSegments geometry={neuron}><lineBasicMaterial color="#d8cdbd" transparent opacity={0.85} /></lineSegments>
            <Glow p={[0, 0, 0]} s={1.2} c={P.amber} o={0.35} />
          </group>
          {/* a machine */}
          <group position={[STAGE_X[4], 0.3, 0]} scale={seen(4)} rotation={[0.5, t * 0.15, 0]}>
            <mesh><boxGeometry args={[0.85, 0.1, 0.85]} /><meshStandardMaterial color="#1b1e23" roughness={0.3} metalness={0.7} /></mesh>
            <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.5, 0.5]} /><meshBasicMaterial color={P.amber} transparent opacity={0.35 + 0.25 * Math.sin(t * 3)} /></mesh>
            <lineSegments geometry={chipTraces}><lineBasicMaterial color="#c9b27a" /></lineSegments>
          </group>
        </>}
        {part === 'galaxy' && <>
          <Cam pos={gPos} look={[0, 0, 0]} fov={v ? 52 : 40} far={3000} />
          <primitive object={galaxy.o} />
          <Glow p={[0, 0, 0]} s={30} c="#f3e6cf" o={0.25 * smooth(gt / 1.2)} />
        </>}
      </Stage>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,.65) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(win(t, ph('c2', 2) + 0.2 - 0.3, ph('c2', 2) + 0.2 + 0.35, 0.3, 0.35), win(t, tGal - 0.3, tGal + 0.4, 0.3, 0.4))}} />
      <Label x={v ? 70 : 120} y={v ? 1300 : 760} o={win(t, ph('c1', 0), ph('c2', 0) - 0.2, 0.6, 0.4)} kicker="PHILOSOPHY OF MIND" title="Panpsychism" sub="the idea that some faint form of mind is a basic feature of all matter" tag="PHILOSOPHY · NOT SCIENCE" w={640} />
      <Label x={v ? 70 : 120} y={v ? 1300 : 760} o={win(t, ph('c2', 0), ph('c2', 2) + 0.2, 0.4, 0.3)} kicker="STATUS" title="Not testable, not accepted" sub="most scientists reject it, but it reframes the story" tag="CONTESTED" w={640} />
      {part === 'ladder' && <div style={{position: 'absolute', left: v ? 70 : 120, right: v ? 70 : 120, top: v ? 300 : 120, display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: v ? 15 : 17, letterSpacing: 3, color: P.paperDim}}>
        {[['13.6 BN YRS AGO', 'first stars'], ['', 'stars forge atoms'], ['3.7 BN', 'first cells'], ['0.6 BN', 'first nervous systems'], ['80 YRS', 'computers']].map(([a, b], i) => <div key={i} style={{opacity: 0.25 + 0.75 * seen(i), color: lx > STAGE_X[i] - 3 && lx < STAGE_X[i] + 3.5 ? P.paper : undefined}}><div>{a || '·'}</div><div style={{fontFamily: F.text, fontSize: v ? 16 : 19, letterSpacing: 1, marginTop: 6}}>{b}</div></div>)}
      </div>}
      <Label x={v ? 70 : 120} y={v ? 1300 : 760} o={win(t, ph('c4', 1), tGal - 0.2, 0.5, 0.4)} kicker="NOW" title="Machines that model the world" sub="and, increasingly, themselves" tag="EXISTS TODAY" w={640} />
      <Label x={v ? 540 : 960} y={v ? 1420 : 880} align="center" w={980} o={win(t, ph('c5', 0) + 0.2, ph('c6', 1), 0.8, 0.6)} title="The universe, waking up?" sub="a metaphor used by some thinkers, not a scientific claim" tag="SPECULATIVE" />
      <Label x={v ? 540 : 960} y={v ? 1420 : 880} align="center" w={980} o={win(t, ph('c6', 2), A.t1 + 0.2, 0.6, 0.6)} title="The next step in something very old" sub="which makes what it would want matter more, not less" />
    </AbsoluteFill>
  );
};
