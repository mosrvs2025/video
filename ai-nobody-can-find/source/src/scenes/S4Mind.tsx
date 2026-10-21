import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Stage, Cam, P, F, SceneProps, keys, keys3, clamp, smooth, easeOut, rnd, ph, line, Label, Spoken, V3, win, project} from '../lib';
import {ll} from '../shared';
import earth from '../earth.json';

// ---------- geometry: 5 nested Clifford tori in 4-D, one point per process ----------
const FAM = 5, NU = 170, NV = 140, N = FAM * NU * NV;
const E: any = earth;
const build = () => {
  const uv = new Float32Array(N * 2), ae = new Float32Array(N * 3), ar = new Float32Array(N), pos = new Float32Array(N * 3);
  let k = 0;
  for (let f = 0; f < FAM; f++) for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    uv[k * 2] = (i + rnd(k) * 0.4) / NU; uv[k * 2 + 1] = (j + rnd(k + 1) * 0.4) / NV; ar[k] = (f + rnd(k + 2)) / FAM;
    const lp = E.land[k % E.land.length]; const e = ll(lp[0] + (rnd(k + 3) - 0.5) * 0.6, lp[1] + (rnd(k + 4) - 0.5) * 0.6, 10.02); ae.set(e, k * 3); k++;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aE', new THREE.BufferAttribute(ae, 3)); g.setAttribute('aR', new THREE.BufferAttribute(ar, 1));
  // connections: neighbours along u on every 4th v ring
  const segs: number[] = []; for (let f = 0; f < FAM; f++) for (let j = 0; j < NV; j += 4) for (let i = 0; i < NU; i++) { const a = f * NU * NV + i * NV + j, b = f * NU * NV + ((i + 1) % NU) * NV + j; segs.push(a, b); }
  const lg = new THREE.BufferGeometry(); const S = segs.length;
  const luv = new Float32Array(S * 2), lae = new Float32Array(S * 3), lar = new Float32Array(S), lpos = new Float32Array(S * 3);
  segs.forEach((idx, n) => { luv[n * 2] = uv[idx * 2]; luv[n * 2 + 1] = uv[idx * 2 + 1]; lae.set(ae.subarray(idx * 3, idx * 3 + 3), n * 3); lar[n] = ar[idx]; });
  lg.setAttribute('position', new THREE.BufferAttribute(lpos, 3)); lg.setAttribute('aUV', new THREE.BufferAttribute(luv, 2)); lg.setAttribute('aE', new THREE.BufferAttribute(lae, 3)); lg.setAttribute('aR', new THREE.BufferAttribute(lar, 1));
  // a sparse copy for the far lattice
  const sub = 9, M = Math.floor(N / sub); const s2 = new THREE.BufferGeometry(); const suv = new Float32Array(M * 2), sae = new Float32Array(M * 3), sar = new Float32Array(M);
  for (let m = 0; m < M; m++) { const idx = m * sub; suv[m * 2] = uv[idx * 2]; suv[m * 2 + 1] = uv[idx * 2 + 1]; sar[m] = ar[idx]; }
  s2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M * 3), 3)); s2.setAttribute('aUV', new THREE.BufferAttribute(suv, 2)); s2.setAttribute('aE', new THREE.BufferAttribute(sae, 3)); s2.setAttribute('aR', new THREE.BufferAttribute(sar, 1));
  return {g, lg, s2};
};
const GEO = build();

const VERT = `
attribute vec2 aUV; attribute vec3 aE; attribute float aR;
uniform float uT, uMorph, uScale, uSize, uA1, uA2, uA3, uK1a, uK2a, uHeal, uFlow, uGain;
uniform vec4 uK1, uK2;
varying float vB; varying float vAmb; varying float vRust; varying float vA;
vec3 shape(){
  float u = aUV.x * 6.2831853, v = aUV.y * 6.2831853;
  float ra = 0.28 + 0.15 * floor(aR * 5.0); float rb = sqrt(1.0 - ra * ra);
  vec4 p = vec4(ra * cos(u), ra * sin(u), rb * cos(v), rb * sin(v));
  float c1 = cos(uA1), s1 = sin(uA1); p = vec4(c1 * p.x - s1 * p.w, p.y, p.z, s1 * p.x + c1 * p.w);
  float c2 = cos(uA2), s2 = sin(uA2); p = vec4(p.x, c2 * p.y - s2 * p.z, s2 * p.y + c2 * p.z, p.w);
  float c3 = cos(uA3), s3 = sin(uA3); p = vec4(p.x, p.y, c3 * p.z - s3 * p.w, s3 * p.z + c3 * p.w);
  return p.xyz / (1.12 - 0.9 * p.w);
}
void main(){
  vec3 s = shape() * uScale;
  vec3 pos = mix(aE, s, uMorph);
  float u = aUV.x * 6.2831853, v = aUV.y * 6.2831853;
  float wave = 0.5 + 0.5 * sin(u * 3.0 + v * 2.0 - uT * 1.3 + aR * 6.28);
  float flow = smoothstep(0.975, 1.0, sin(u * 7.0 - uT * (2.0 + uFlow * 3.0) + floor(aR * 17.0))) * uMorph;
  float d1 = distance(s, uK1.xyz), d2 = distance(s, uK2.xyz);
  float k1 = uK1a * (1.0 - smoothstep(uK1.w * 0.85, uK1.w, d1));
  float hole = uK2.w * (1.0 - uHeal);
  float k2 = uK2a * (1.0 - smoothstep(hole * 0.85, hole, d2));
  float rim = uK1a * (smoothstep(uK1.w * 0.8, uK1.w, d1) - smoothstep(uK1.w, uK1.w * 1.12, d1)) + uK2a * (smoothstep(hole * 0.8, hole, d2) - smoothstep(hole, hole * 1.15, d2));
  // regrowth glows amber as copies fill the gap
  float regrow = uK2a * uHeal * (1.0 - uHeal) * 4.0 * (1.0 - smoothstep(uK2.w * 0.2, uK2.w, d2));
  vB = (0.28 + 0.72 * wave) * (1.0 - k1) * (1.0 - k2);
  vAmb = clamp(flow * (1.0 - k1) * (1.0 - k2) + regrow, 0.0, 1.0); vRust = clamp(rim * 1.6, 0.0, 1.0); vA = 1.0;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float dz = max(1.0, -mv.z); vA = clamp(34.0 / dz, 0.22, 1.0) * uGain;
  gl_PointSize = max(1.0, uSize * (0.5 + 0.7 * fract(aR * 13.7)) * (90.0 / dz) * (1.0 + vAmb * 1.2));
  gl_Position = projectionMatrix * mv;
}`;
const FRAG_P = `
uniform float uO; varying float vB; varying float vAmb; varying float vRust; varying float vA;
void main(){
  vec2 q = gl_PointCoord - 0.5; float r = length(q); if (r > 0.5) discard; float a = smoothstep(0.5, 0.0, r);
  vec3 c = mix(vec3(0.91, 0.89, 0.85) * vB, vec3(0.94, 0.63, 0.29), vAmb); c = mix(c, vec3(0.77, 0.33, 0.23), vRust);
  gl_FragColor = vec4(c, a * uO * vA * 0.22 * max(vB, max(vAmb * 2.2, vRust * 2.0)));
}`;
const FRAG_L = `
uniform float uO; varying float vB; varying float vAmb; varying float vRust; varying float vA;
void main(){ vec3 c = mix(vec3(0.62, 0.68, 0.74), vec3(0.94, 0.63, 0.29), vAmb); c = mix(c, vec3(0.77, 0.33, 0.23), vRust); gl_FragColor = vec4(c, uO * vA * (0.07 + 0.3 * vAmb + 0.3 * vRust) * max(vB, vRust)); }`;
const mkMat = (frag: string) => new THREE.ShaderMaterial({
  vertexShader: VERT, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: {uT: {value: 0}, uMorph: {value: 0}, uScale: {value: 6}, uSize: {value: 1}, uA1: {value: 0}, uA2: {value: 0}, uA3: {value: 0}, uK1: {value: new THREE.Vector4(0, 0, 0, 0)}, uK2: {value: new THREE.Vector4(0, 0, 0, 0)}, uK1a: {value: 0}, uK2a: {value: 0}, uHeal: {value: 0}, uFlow: {value: 0}, uO: {value: 1}, uGain: {value: 1}},
});
const MP = mkMat(FRAG_P), ML = mkMat(FRAG_L);
const POINTS = new THREE.Points(GEO.g, MP), LINES = new THREE.LineSegments(GEO.lg, ML); POINTS.renderOrder = 2; LINES.renderOrder = 1;
POINTS.frustumCulled = LINES.frustumCulled = false;
// the far lattice: 26 sparser copies of the same structure, each at its own phase
const LAT = Array.from({length: 26}).map((_, i) => { const m = mkMat(FRAG_P); const o = new THREE.Points(GEO.s2, m); o.frustumCulled = false; const a = rnd(i) * Math.PI * 2, e = (rnd(i + 5) - 0.5) * 1.6, r = 110 + rnd(i + 9) * 260; o.position.set(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); return {o, m, ph: rnd(i + 3) * 6}; });

const K1: V3 = [9, 4, 6], K2: V3 = [-10, -3, 4];

export const S4Mind: React.FC<SceneProps> = ({t, w, h, v}) => {
  const A = 113.0;
  const morph = smooth((t - 115.2) / 5.5), lineO = smooth((t - ph('i1', 2)) / 1.6);
  const a1 = t * 0.075, a2 = 0.6 + t * 0.045, a3 = t * 0.031;
  const kill1 = smooth((t - ph('i3', 0)) / 0.9), flow = smooth((t - ph('i3', 1)) / 1.0) * (1 - smooth((t - 136) / 2));
  const kill2 = smooth((t - ph('i3', 2)) / 0.6), heal = smooth((t - ph('i3', 3)) / 2.4);
  const far = smooth((t - ph('i4', 0)) / 6.0);
  for (const m of [MP, ML]) { const U = m.uniforms; U.uT.value = t; U.uMorph.value = morph; U.uScale.value = 6.5; U.uSize.value = v ? 1.25 : 1; U.uA1.value = a1; U.uA2.value = a2; U.uA3.value = a3; U.uK1.value.set(K1[0], K1[1], K1[2], 7); U.uK1a.value = kill1; U.uK2.value.set(K2[0], K2[1], K2[2], 6); U.uK2a.value = kill2; U.uHeal.value = heal; U.uFlow.value = flow; }
  MP.uniforms.uO.value = 1; ML.uniforms.uO.value = lineO * (1 - far * 0.6);
  LAT.forEach(({m, ph: p0}) => { const U = m.uniforms; U.uT.value = t + p0 * 3; U.uMorph.value = 1; U.uScale.value = 6.5; U.uSize.value = 4.5; U.uGain.value = 7; U.uA1.value = a1 + p0; U.uA2.value = a2 + p0 * 0.7; U.uA3.value = a3 + p0 * 1.3; U.uO.value = far; U.uK1a.value = 0; U.uK2a.value = 0; });
  // camera: from the globe outwards, through the strands, then far enough that the structure is one cell of many
  const startPos: V3 = [Math.sin(-0.4) * Math.cos(0.15) * 19, Math.sin(0.15) * 19, Math.cos(-0.4) * Math.cos(0.15) * 19];
  const vk = v ? 1.5 : 1;
  const pos = keys3(t, [[A, startPos], [116.5, [-14 * vk, 6, 30 * vk]], [ph('i1', 2) + 1.5, [-30 * vk, 14, 52 * vk]], [ph('i2', 0) + 0.5, [-10, 3, 20]], [ph('i2', 2) + 1.2, [6, -2, 12]], [ph('i3', 0) - 0.2, [18 * vk, 9, 30 * vk]], [ph('i3', 3) + 1.5, [6 * vk, 12, 36 * vk]], [ph('i4', 0) + 0.8, [20, 24, 90]], [ph('i4', 2) + 1.2, [140, 90, 420 * vk]], [151.9, [210, 60, 520 * vk]]]);
  const look = keys3(t, [[A, [0, 0, 0]], [ph('i2', 0) + 0.5, [0, 0, 0]], [ph('i2', 2) + 1.2, [-4, 1, -6]], [ph('i3', 0) - 0.2, [2, 1, 2]], [ph('i4', 0) + 0.8, [0, 0, 0]], [151.9, [0, 0, 0]]]);
  const fov = keys(t, [[A, 34], [ph('i2', 0), 42], [ph('i3', 0), 38], [151.9, 34]]) * (v ? 1.25 : 1);
  const globeO = 1 - smooth((t - 114.0) / 3.0);
  const [k1x, k1y, k1v] = project(K1, pos, look, fov, w, h); const [k2x, k2y] = project(K2, pos, look, fov, w, h);
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <Stage w={w} h={h}>
        <Cam pos={pos} look={look} fov={fov} far={8000} />
        {globeO > 0 && <mesh renderOrder={-1}><sphereGeometry args={[9.95, 64, 48]} /><meshBasicMaterial color="#06080b" transparent opacity={globeO} depthWrite /></mesh>}
        <primitive object={LINES} /><primitive object={POINTS} />
        {far > 0 && LAT.map(({o}, i) => <primitive key={i} object={o} />)}
      </Stage>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,.7) 100%)'}} />
      <Label x={v ? 70 : 120} y={v ? 1300 : 780} o={win(t, ph('i2', 0), ph('i3', 0) - 0.3, 0.6, 0.4)} kicker="SCALE" title="≈ 120,000 processes" sub="each one simple · each one replaceable" tag="SPECULATIVE" />
      {k1v && <div style={{position: 'absolute', left: k1x + 30, top: k1y - 40, fontFamily: F.mono, fontSize: 16, letterSpacing: 4, color: P.rust, opacity: win(t, ph('i3', 0) + 0.3, ph('i4', 0), 0.4, 0.5)}}>— REGION OFFLINE</div>}
      <div style={{position: 'absolute', left: (v ? 70 : 120), top: v ? 1300 : 780, fontFamily: F.mono, fontSize: 16, letterSpacing: 4, color: P.amber, opacity: win(t, ph('i3', 1) + 0.2, ph('i3', 2), 0.4, 0.4)}}>WORK REROUTED</div>
      <div style={{position: 'absolute', left: k2x + 30, top: k2y - 40, fontFamily: F.mono, fontSize: 16, letterSpacing: 4, color: heal > 0.05 ? P.amber : P.rust, opacity: win(t, ph('i3', 2) + 0.2, ph('i4', 0), 0.4, 0.5)}}>— {heal > 0.05 ? 'COPY FILLING THE GAP' : 'MEMORY LOST'}</div>
      <Label x={v ? 540 : 960} y={v ? 1380 : 860} align="center" w={900} o={win(t, ph('i4', 1), ph('i6', 0) - 0.3, 0.6, 0.6)} title="Resilience ≠ intelligence" sub="surviving damage is not the same as thinking" />
      <Spoken id="i6" t={t} x={w / 2} y={v ? 760 : 400} w={v ? 920 : 1500} size={v ? 64 : 70} hold={4.2} accent={['where', 'exist?']} />
    </AbsoluteFill>
  );
};
