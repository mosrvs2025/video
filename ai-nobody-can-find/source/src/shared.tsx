// Shared physical objects: the phone, the table/room, the Earth and its network.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {P, SPRITE, clamp, rnd, V3} from './lib';
import earth from './earth.json';

// ---------- phone ----------
const roundRect = (w: number, h: number, r: number) => { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
const PHONE_W = 0.074, PHONE_H = 0.156;
export const phoneGeo = (() => { const g = new THREE.ExtrudeGeometry(roundRect(PHONE_W, PHONE_H, 0.011), {depth: 0.007, bevelEnabled: true, bevelThickness: 0.0012, bevelSize: 0.0012, bevelSegments: 3, curveSegments: 10}); g.translate(0, 0, -0.0035); return g; })();
export const screenGeo = (() => new THREE.ShapeGeometry(roundRect(PHONE_W - 0.006, PHONE_H - 0.006, 0.009), 10))();
export const screenTex = (() => { try {
  const c = document.createElement('canvas'); c.width = 360; c.height = 760; const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, 760); gr.addColorStop(0, '#1a2230'); gr.addColorStop(1, '#07090d'); g.fillStyle = gr; g.fillRect(0, 0, 360, 760);
  g.fillStyle = 'rgba(233,228,218,.92)'; g.font = '200 118px Inter'; g.textAlign = 'center'; g.fillText('3:14', 180, 210);
  g.font = '500 20px Inter'; g.fillStyle = 'rgba(233,228,218,.6)'; g.fillText('TUESDAY  20  OCTOBER', 180, 100);
  g.fillStyle = 'rgba(233,228,218,.35)'; g.fillRect(150, 732, 60, 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; } catch { return null as any; } })();
// the ShapeGeometry UVs are in metres; remap to 0..1
(() => { const uv = screenGeo.attributes.uv as THREE.BufferAttribute, pos = screenGeo.attributes.position as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (PHONE_W - 0.006) + 0.5, pos.getY(i) / (PHONE_H - 0.006) + 0.5); uv.needsUpdate = true; })();

// lying flat on the table, screen up; `on` 0..1 screen brightness
export const Phone: React.FC<{p?: V3; ry?: number; on: number; glyph?: number; t: number}> = ({p = [0, 0, 0], ry = 0.35, on, glyph = 0, t}) => (
  <group position={p} rotation={[-Math.PI / 2, 0, ry]}>
    <mesh geometry={phoneGeo} castShadow receiveShadow><meshStandardMaterial color="#14161a" roughness={0.35} metalness={0.6} /></mesh>
    <mesh geometry={screenGeo} position={[0, 0, 0.0048]}><meshBasicMaterial map={screenTex} color={new THREE.Color(on, on, on)} toneMapped={false} /></mesh>
    {/* glass */}
    <mesh geometry={screenGeo} position={[0, 0, 0.0052]}><meshStandardMaterial color="#000" roughness={0.05} metalness={0.9} transparent opacity={0.25} /></mesh>
    {glyph > 0 && <group position={[0.022, -0.06, 0.006]} scale={0.008}>
      <mesh rotation={[t * 0.9, t * 1.3, 0]}><tetrahedronGeometry args={[0.5, 0]} /><meshBasicMaterial color={P.amber} wireframe transparent opacity={glyph} /></mesh>
      <mesh><torusGeometry args={[0.85, 0.03, 6, 48]} /><meshBasicMaterial color={P.amber} transparent opacity={glyph * 0.8} /></mesh>
      <sprite scale={[4, 4, 4]}><spriteMaterial map={SPRITE} color={P.amber} transparent opacity={glyph * 0.6} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>}
    {on > 0.02 && <pointLight position={[0, 0, 0.06]} color="#8ea2c0" intensity={on * 0.09} distance={0.5} decay={2} />}
  </group>
);

// ---------- table + dark room ----------
const woodTex = (() => { try {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d')!; g.fillStyle = '#2a1d15'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) { const y = rnd(i) * 1024, a = 0.04 + rnd(i + 3) * 0.08; g.strokeStyle = rnd(i + 7) > 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,220,180,${a * 0.35})`; g.lineWidth = 1 + rnd(i + 9) * 3; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y + Math.sin(x * 0.006 + i) * 6 + Math.sin(x * 0.02 + i * 2) * 2); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; } catch { return null as any; } })();
export const Table: React.FC<{light?: number}> = ({light = 1}) => (
  <group>
    <mesh position={[0, -0.025, 0]} receiveShadow castShadow><boxGeometry args={[1.6, 0.05, 0.9]} /><meshStandardMaterial map={woodTex} roughness={0.55} metalness={0.05} /></mesh>
    {[[-0.74, -0.4], [0.74, -0.4], [-0.74, 0.4], [0.74, 0.4]].map(([x, z], i) => <mesh key={i} position={[x, -0.4, z]}><boxGeometry args={[0.05, 0.72, 0.05]} /><meshStandardMaterial color="#1c140f" roughness={0.7} /></mesh>)}
    <mesh position={[0, -0.76, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#0b0c0e" roughness={0.9} /></mesh>
    <spotLight position={[0.15, 2.2, 0.3]} angle={0.42} penumbra={0.85} intensity={light * 9} distance={6} decay={1.6} color="#dfe6ee" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.0004} />
  </group>
);

// ---------- Earth ----------
const R = 10;
export const ll = (lat: number, lon: number, r = R): V3 => { const a = THREE.MathUtils.degToRad(lat), b = THREE.MathUtils.degToRad(lon); return [r * Math.cos(a) * Math.sin(b), r * Math.sin(a), r * Math.cos(a) * Math.cos(b)]; };
const E: any = earth;
const landGeo = (() => { const pos = new Float32Array(E.land.length * 3); E.land.forEach((p: number[], i: number) => { const v = ll(p[0], p[1], R * 1.001); pos.set(v, i * 3); }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return g; })();
const cityGeo = (() => { const n = E.cities.length, pos = new Float32Array(n * 3); E.cities.forEach((c: number[], i: number) => pos.set(ll(c[0], c[1], R * 1.003), i * 3)); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return g; })();
const atmoMat = new THREE.ShaderMaterial({
  uniforms: {c: {value: new THREE.Color('#6f8fb0')}, k: {value: 1}}, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform vec3 c; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(vN, vV)), 2.2); gl_FragColor = vec4(c * f * 1.4 * k, f * k); }',
});
export type Arc = {a: number; b: number; color: string; speed?: number; lift?: number; o?: number};
const arcPts = (a: V3, b: V3, lift: number, n = 48) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const out: THREE.Vector3[] = []; for (let i = 0; i <= n; i++) { const u = i / n; const v = A.clone().lerp(B, u).normalize().multiplyScalar(R * (1.004 + lift * Math.sin(Math.PI * u))); out.push(v); } return out; };
export const city = (i: number) => E.cities[i % E.cities.length] as number[];

export const Earth: React.FC<{t: number; land?: number; lights?: number; atmo?: number; arcs?: Arc[]; arcO?: number; rot?: number; ocean?: string}> = ({t, land = 1, lights = 0, atmo = 1, arcs = [], arcO = 1, rot = 0, ocean = '#06080b'}) => {
  const arcGeos = useMemo(() => arcs.map((a) => { const c1 = city(a.a), c2 = city(a.b); const pts = arcPts(ll(c1[0], c1[1]), ll(c2[0], c2[1]), a.lift ?? 0.12); const mat = new THREE.LineBasicMaterial({color: a.color, transparent: true, opacity: 0.28, depthWrite: false}); return {pts, mat, obj: new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)}; }), [arcs.length]);
  atmoMat.uniforms.k.value = atmo;
  return (
    <group rotation={[0, rot, 0]}>
      <mesh><sphereGeometry args={[R, 96, 64]} /><meshStandardMaterial color={ocean} roughness={0.8} metalness={0.1} /></mesh>
      {land > 0 && <points geometry={landGeo}><pointsMaterial map={SPRITE} size={0.07} color={P.steel} transparent opacity={0.55 * land} depthWrite={false} sizeAttenuation /></points>}
      {lights > 0 && <points geometry={cityGeo}><pointsMaterial map={SPRITE} size={0.16} color="#fff1d6" transparent opacity={lights} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation /></points>}
      {atmo > 0 && <mesh scale={1.06} material={atmoMat}><sphereGeometry args={[R, 64, 48]} /></mesh>}
      {arcs.map((a, i) => { const g = arcGeos[i]; if (!g) return null; const sp = a.speed ?? 0.35; const u = ((t * sp + rnd(i) ) % 1); const k = Math.floor(u * (g.pts.length - 1)); const q = g.pts[k];
        return <group key={i}>
          {(() => { g.mat.opacity = 0.32 * arcO * (a.o ?? 1); g.mat.color.set(a.color); return <primitive object={g.obj} />; })()}
          <sprite position={[q.x, q.y, q.z]} scale={[0.35, 0.35, 0.35]}><spriteMaterial map={SPRITE} color={a.color} transparent opacity={arcO * (a.o ?? 1)} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        </group>; })}
    </group>
  );
};
export const EARTH_R = R;
