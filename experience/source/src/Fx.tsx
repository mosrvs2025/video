import React, {useMemo} from 'react';
import * as THREE from 'three';
import {SPRITE, clamp, lerp, rnd, smooth, V3} from './lib';
import {WIN, CHAIR_POS, Chair} from './Room';

// =================================================================================================
// The window light is the sound: 32 frequency bands across the width of one volumetric shaft
// =================================================================================================
const NBAND = 32;
const BAND_GLSL = `
  uniform float uB[${NBAND}]; uniform float uX0; uniform float uX1;
  float band(float x){ float u = clamp((x - uX0) / (uX1 - uX0), 0., 1.) * ${NBAND - 1}.; int i0 = int(floor(u)); int i1 = min(i0 + 1, ${NBAND - 1}); return mix(uB[i0], uB[i1], fract(u)); }
`;
const shaftGeo = (() => {
  const {x0, x1, yb, yt, z} = WIN; const zt = z + yt, zb = z + yb; // 45-degree light
  const A = (x: number): V3 => [x, yt, z], B = (x: number): V3 => [x, yb, z], C = (x: number): V3 => [x, 0, zb], D = (x: number): V3 => [x, 0, zt];
  const quads = [[A(x0), B(x0), C(x0), D(x0)], [A(x1), D(x1), C(x1), B(x1)], [A(x0), A(x1), D(x1), D(x0)], [B(x0), C(x0), C(x1), B(x1)]];
  const pos: number[] = [], s: number[] = [];
  for (const q of quads) for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(...q[i]); s.push(Math.max(0, (q[i][2] - z) / (zt - z))); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(s, 1)); return g;
})();
const shaftMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, fog: false,
  uniforms: {uB: {value: new Float32Array(NBAND)}, uX0: {value: WIN.x0}, uX1: {value: WIN.x1}, uC: {value: new THREE.Color('#fff0d8')}, uI: {value: 0.1}, uYt: {value: WIN.yt}, uYb: {value: WIN.yb}, uZ: {value: WIN.z}},
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `${BAND_GLSL} uniform vec3 uC; uniform float uI; uniform float uYt; uniform float uYb; uniform float uZ; varying vec3 vW;
    // ray vs half-space  n.p <= c  (slab accumulation)
    void clipH(vec3 o, vec3 d, vec3 n, float c, inout float t0, inout float t1){ float den = dot(n, d); float num = c - dot(n, o); if (abs(den) < 1e-5) { if (num < 0.) t1 = -1.; return; } float tt = num / den; if (den > 0.) t1 = min(t1, tt); else t0 = max(t0, tt); }
    void main(){ vec3 o = cameraPosition; vec3 d = normalize(vW - cameraPosition); float t0 = 0., t1 = length(vW - cameraPosition) + 0.02;
      clipH(o, d, vec3(-1., 0., 0.), -uX0, t0, t1); clipH(o, d, vec3(1., 0., 0.), uX1, t0, t1);
      clipH(o, d, vec3(0., 1., 1.), uYt + uZ, t0, t1);       // below the top ray  (y + z <= yt + zw)
      clipH(o, d, vec3(0., -1., -1.), -(uYb + uZ), t0, t1);  // above the sill ray (y + z >= yb + zw)
      clipH(o, d, vec3(0., -1., 0.), 0., t0, t1);            // above the floor
      clipH(o, d, vec3(0., 0., -1.), -uZ, t0, t1);           // inside the room (z >= zw)
      float th = max(0., t1 - t0); if (th <= 0.) discard; vec3 p = o + d * (t0 + t1) * 0.5; float S = clamp((p.z - uZ) / (uYt), 0., 1.);
      float b = band(p.x); float dens = pow(1. - S, 1.3) * (0.25 + 1.15 * b);
      gl_FragColor = vec4(uC, uI * dens * min(th, 3.0) * 0.55); }`,
});
export const Beam: React.FC<{b: number[]; color: string; intensity: number}> = ({b, color, intensity}) => {
  const u = shaftMat.uniforms; for (let i = 0; i < NBAND; i++) (u.uB.value as Float32Array)[i] = b[i] ?? 0; u.uC.value.set(color); u.uI.value = intensity;
  return <mesh geometry={shaftGeo} material={shaftMat} frustumCulled={false} renderOrder={3} />;
};
// the lit patch on the floor reads as an equaliser: bright bars where the sound is loud
const decalGeo = new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.yt - WIN.yb);
const decalMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  uniforms: {uB: {value: new Float32Array(NBAND)}, uX0: {value: WIN.x0}, uX1: {value: WIN.x1}, uC: {value: new THREE.Color('#fff0d8')}, uI: {value: 0.2}},
  vertexShader: `varying vec2 vUv; varying float vX; void main(){ vUv = uv; vX = position.x + ${((WIN.x0 + WIN.x1) / 2).toFixed(3)}; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `${BAND_GLSL} uniform vec3 uC; uniform float uI; varying vec2 vUv; varying float vX; void main(){ float b = band(vX); float e = smoothstep(0., 0.06, vUv.x) * smoothstep(1., 0.94, vUv.x) * smoothstep(0., 0.05, vUv.y) * smoothstep(1., 0.95, vUv.y); float bar = 0.55 + 0.45 * sin(vUv.x * ${NBAND}. * 3.14159); gl_FragColor = vec4(uC, uI * e * (0.18 + 1.3 * b * b) * (0.7 + 0.3 * bar)); }`,
});
export const FloorPatch: React.FC<{b: number[]; color: string; intensity: number}> = ({b, color, intensity}) => {
  const u = decalMat.uniforms; for (let i = 0; i < NBAND; i++) (u.uB.value as Float32Array)[i] = b[i] ?? 0; u.uC.value.set(color); u.uI.value = intensity;
  // the window projected on the floor by a 45-degree beam: z from -3.05 to -0.65 (stretched), x unchanged
  return <mesh geometry={decalGeo} material={decalMat} position={[(WIN.x0 + WIN.x1) / 2, 0.012, (WIN.z + WIN.yb + WIN.z + WIN.yt) / 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, (WIN.yt - WIN.yb) / (WIN.yt - WIN.yb), 1]} renderOrder={2} />;
};

// =================================================================================================
// Dust: catches the light. Agitated by the highs, lifted by the lows, streams toward the camera on request.
// =================================================================================================
const ND = 2600;
const dustBase = (() => { const a = new Float32Array(ND * 4); for (let i = 0; i < ND; i++) { a[i * 4] = (rnd(i) - 0.5) * 6; a[i * 4 + 1] = rnd(i + 1) * 4; a[i * 4 + 2] = -4 + rnd(i + 2) * 7.6; a[i * 4 + 3] = rnd(i + 3); } return a; })();
export const Dust: React.FC<{t: number; b: number[]; air: number; low: number; stream: number; color: string; gain: number}> = ({t, b, air, low, stream, color, gain}) => {
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ND * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ND * 3), 3)); return g; }, []);
  const P = geo.attributes.position.array as Float32Array, C = geo.attributes.color.array as Float32Array; const cc = new THREE.Color(color);
  const {x0, x1, yb, yt, z} = WIN;
  for (let i = 0; i < ND; i++) {
    const bx = dustBase[i * 4], by = dustBase[i * 4 + 1], bz = dustBase[i * 4 + 2], r = dustBase[i * 4 + 3];
    const rise = (0.05 + 0.06 * r) * t * (1 + low * 0.8); let y = ((by + rise) % 4 + 4) % 4;
    let x = bx + Math.sin(t * 0.17 + r * 40) * 0.35 + Math.sin(t * 0.41 + r * 9) * 0.06 * (1 + air * 2);
    let zz = bz + Math.cos(t * 0.13 + r * 31) * 0.3;
    if (stream > 0) zz = ((bz + 4 + stream * (0.8 + r) * 1.5 * 5) % 7.6) - 4 + 0; // flows toward +z (the camera)
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = zz;
    // inside the shaft? (x within the window slice, between the sill ray and the top ray)
    const dz = zz - z, yTop = yt - dz, yBot = yb - dz; const inside = x > x0 && x < x1 && dz > 0 && y < yTop && y > Math.max(0, yBot) ? 1 : 0;
    const k = clamp((x - x0) / (x1 - x0)) * 31; const bi = b[Math.floor(k)] ?? 0;
    const v = (inside ? 0.35 + 1.1 * bi : 0.05 + 0.05 * air) * gain * (0.5 + r);
    C[i * 3] = cc.r * v; C[i * 3 + 1] = cc.g * v; C[i * 3 + 2] = cc.b * v;
  }
  geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  return <points geometry={geo} frustumCulled={false} renderOrder={4}><pointsMaterial map={SPRITE} size={0.026} vertexColors transparent opacity={0.9} depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} /></points>;
};

// =================================================================================================
// Echo ripples across the floor (clipped to the room)
// =================================================================================================
const ringMat = (() => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
  uniforms: {uA: {value: 0}, uW: {value: 0.03}, uC: {value: new THREE.Color('#ffe2b8')}, uR: {value: 1}},
  vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uA; uniform float uW; uniform vec3 uC; uniform float uR; varying vec2 vUv; varying vec3 vW;
    void main(){ if (abs(vW.x) > 2.85 || vW.z < -3.8 || vW.z > 3.9) discard; float d = length(vUv * 2. - 1.); float w = uW / uR; float a = smoothstep(1. - w * 2., 1. - w, d) * smoothstep(1., 1. - w * 0.5, d); gl_FragColor = vec4(uC, a * uA); }`,
}))();
export type Ring = {t0: number; a: number; speed?: number; w?: number};
const NR = 26;
export const Ripples: React.FC<{t: number; rings: Ring[]; color: string}> = ({t, rings, color}) => {
  const mats = useMemo(() => Array.from({length: NR}).map(() => { const m = ringMat.clone(); return m; }), []);
  const alive = rings.filter((r) => t >= r.t0 && t - r.t0 < 3.4).slice(-NR);
  return (
    <group position={[CHAIR_POS[0], 0.02, CHAIR_POS[2]]}>
      {mats.map((m, i) => { const r = alive[i]; if (!r) return <mesh key={i} visible={false} />; const age = t - r.t0, R = 0.15 + age * (r.speed ?? 1.55); m.uniforms.uA.value = r.a * Math.pow(1 - age / 3.4, 1.6) * smooth(age / 0.08); m.uniforms.uW.value = r.w ?? 0.035; m.uniforms.uR.value = R; m.uniforms.uC.value.set(color);
        return <mesh key={i} material={m} rotation={[-Math.PI / 2, 0, 0]} scale={R} renderOrder={5}><planeGeometry args={[2, 2]} /></mesh>; })}
    </group>
  );
};

// =================================================================================================
// The presence: a seated figure made only of dust, assembled from the feet up
// =================================================================================================
const NP = 7500;
const sampleBody = () => {
  type Part = {a: V3; b: V3; r: [number, number]; w: number};
  const parts: Part[] = [
    {a: [0, 0.74, 0.04], b: [0, 0.98, 0.03], r: [0.19, 0.13], w: 3.2},        // torso (ellipse cross-section)
    {a: [0, 1.1, 0.04], b: [0, 1.14, 0.04], r: [0.25, 0.09], w: 1.4},         // shoulders
    {a: [0, 1.34, 0.01], b: [0, 1.4, 0.0], r: [0.115, 0.125], w: 1.5},        // head
    {a: [0, 1.17, 0.03], b: [0, 1.25, 0.02], r: [0.05, 0.05], w: 0.3},        // neck
    {a: [-0.23, 1.1, 0.05], b: [-0.27, 0.86, 0.1], r: [0.045, 0.045], w: 0.8}, // upper arms
    {a: [0.23, 1.1, 0.05], b: [0.27, 0.86, 0.1], r: [0.045, 0.045], w: 0.8},
    {a: [-0.27, 0.86, 0.1], b: [-0.13, 0.62, -0.2], r: [0.04, 0.04], w: 0.8}, // forearms resting on the lap
    {a: [0.27, 0.86, 0.1], b: [0.13, 0.62, -0.2], r: [0.04, 0.04], w: 0.8},
    {a: [-0.11, 0.55, 0.03], b: [-0.13, 0.56, -0.4], r: [0.075, 0.075], w: 1.3}, // thighs
    {a: [0.11, 0.55, 0.03], b: [0.13, 0.56, -0.4], r: [0.075, 0.075], w: 1.3},
    {a: [-0.13, 0.52, -0.4], b: [-0.13, 0.06, -0.44], r: [0.055, 0.055], w: 1.0}, // shins
    {a: [0.13, 0.52, -0.4], b: [0.13, 0.06, -0.44], r: [0.055, 0.055], w: 1.0},
  ];
  const tw = parts.reduce((s, p) => s + p.w, 0); const out: number[] = [];
  let n = 0;
  for (const p of parts) {
    const cnt = Math.round(NP * p.w / tw);
    for (let i = 0; i < cnt; i++, n++) {
      const u = rnd(n * 3 + 1); const ang = rnd(n * 5 + 2) * Math.PI * 2, rr = Math.sqrt(rnd(n * 7 + 3));
      out.push(lerp(p.a[0], p.b[0], u) + Math.cos(ang) * rr * p.r[0], lerp(p.a[1], p.b[1], u) + Math.sin(ang) * rr * (p.r[0] > 0.1 && p.a[1] === p.b[1] ? 0.02 : p.r[1] * 0.6), lerp(p.a[2], p.b[2], u) + Math.sin(ang) * rr * p.r[1]);
    }
  }
  return new Float32Array(out.slice(0, NP * 3));
};
const bodyPts = sampleBody();
export const Presence: React.FC<{t: number; asm: number; fray: number; bright: number; ember: number; size?: number}> = ({t, asm, fray, bright, ember, size = 1}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry(); const n = bodyPts.length / 3; const scat = new Float32Array(n * 3), rr = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { scat.set([(rnd(i * 2) - 0.3) * 2.6 - 0.2, rnd(i * 2 + 1) * 2.0, (rnd(i * 5) - 0.5) * 2.4 - 0.5], i * 3); rr.set([rnd(i * 11), rnd(i * 13 + 1), rnd(i * 17 + 2), clamp(bodyPts[i * 3 + 1] / 1.5)], i * 4); }
    g.setAttribute('position', new THREE.BufferAttribute(bodyPts, 3)); g.setAttribute('aScat', new THREE.BufferAttribute(scat, 3)); g.setAttribute('aR', new THREE.BufferAttribute(rr, 4)); return g;
  }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: {uT: {value: 0}, uAsm: {value: 0}, uFray: {value: 0}, uBright: {value: 1}, uEmber: {value: 0}, uSize: {value: 1}},
    vertexShader: `attribute vec3 aScat; attribute vec4 aR; uniform float uT; uniform float uAsm; uniform float uFray; uniform float uSize; varying float vK; varying float vR;
      void main(){ float k = clamp(uAsm * 1.5 - aR.w * 0.5 + (aR.x - 0.5) * 0.25, 0., 1.); k = k * k * (3. - 2. * k);
        vec3 body = position; body.y += sin(uT * 1.6 + aR.x * 6.28) * 0.0015;
        vec3 fray = vec3(aR.y - 0.5, aR.z * 0.9 + 0.1, aR.x - 0.5) * uFray * 1.7 + vec3(0., uFray * uFray * 1.1 * aR.y, 0.);
        vec3 p = mix(aScat, body, k) + fray; vec4 mv = modelViewMatrix * vec4(p, 1.); vK = k; vR = aR.x;
        gl_PointSize = max(1., uSize * (0.32 + aR.z * 0.5) * (0.4 + 0.6 * k) * (48. / max(0.5, -mv.z))); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uBright; uniform float uEmber; varying float vK; varying float vR;
      void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q); if (r > 0.5) discard; float a = smoothstep(0.5, 0.0, r);
        vec3 cold = vec3(0.86, 0.93, 1.0); vec3 hot = mix(vec3(0.95, 0.22, 0.04), vec3(1.0, 0.55, 0.16), vR * 0.7); vec3 c = mix(cold, hot, uEmber);
        gl_FragColor = vec4(c, a * uBright * (0.15 + 0.85 * vK) * 0.34); }`,
  }), []);
  mat.uniforms.uT.value = t; mat.uniforms.uAsm.value = asm; mat.uniforms.uFray.value = fray; mat.uniforms.uBright.value = bright; mat.uniforms.uEmber.value = ember; mat.uniforms.uSize.value = size;
  return <points geometry={geo} material={mat} position={CHAIR_POS} frustumCulled={false} renderOrder={6} />;
};

// =================================================================================================
// Echoes of the chair (wordless harmonies)
// =================================================================================================
export const GhostChairs: React.FC<{vis: number[]; b: number[]}> = ({vis, b}) => (
  <group>
    {vis.map((v, i) => { if (v <= 0.01) return null; const side = i % 2 ? 1 : -1, k = Math.floor(i / 2);
      return <group key={i} position={[CHAIR_POS[0] + side * 0.78, 0, CHAIR_POS[2] + 0.95 + k * 0.82]}>
        <Chair color="#c6d3e6" opacity={0.32 * v} emissive="#cfe0ff" ei={0.5 * v * (0.3 + (b[(i * 2 + 3) % 32] ?? 0))} />
      </group>; })}
  </group>
);

// =================================================================================================
// Breath on the glass (canvas texture redrawn per frame, a pure function of time)
// =================================================================================================
const FW = 384, FH = 600;
const fogCanvas = (() => { try { const c = document.createElement('canvas'); c.width = FW; c.height = FH; return c; } catch { return null as any; } })();
const fogTex = fogCanvas ? new THREE.CanvasTexture(fogCanvas) : (null as any);
const speckle = (() => { try { const c = document.createElement('canvas'); c.width = FW; c.height = FH; const g = c.getContext('2d')!; for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${0.1 + rnd(i) * 0.5})`; g.beginPath(); g.arc(rnd(i + 1) * FW, rnd(i + 2) * FH, 0.8 + rnd(i + 3) * 2.2, 0, 7); g.fill(); } return c; } catch { return null as any; } })();
export const FogGlass: React.FC<{fog: number; drip: number; write: number; text: string; flash: number}> = ({fog, drip, write, text, flash}) => {
  if (fogCanvas) {
    const g = fogCanvas.getContext('2d')!; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, FW, FH);
    if (fog > 0.01) {
      const gr = g.createRadialGradient(FW * 0.5, FH * 0.7, 20, FW * 0.5, FH * 0.55, FH * 0.7); gr.addColorStop(0, `rgba(222,232,242,${0.8 * fog})`); gr.addColorStop(1, `rgba(200,214,228,${0.45 * fog})`); g.fillStyle = gr; g.fillRect(0, 0, FW, FH);
      g.globalAlpha = 0.5 * fog; g.drawImage(speckle, 0, 0); g.globalAlpha = 1;
      g.globalCompositeOperation = 'destination-out';
      if (drip > 0) for (let i = 0; i < 7; i++) { const x = 40 + rnd(i * 3) * (FW - 80), len = drip * (60 + rnd(i * 5) * 220), y0 = 90 + rnd(i * 7) * 160; g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(x - 1, y0, 2.2, len); g.beginPath(); g.arc(x, y0 + len, 3.2, 0, 7); g.fill(); }
      if (write > 0 && text) { g.save(); g.beginPath(); g.rect(0, 0, FW * write, FH); g.clip(); g.fillStyle = 'rgba(0,0,0,0.95)'; g.font = '500 70px FreeSerif, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, FW / 2, FH * 0.55); g.restore(); }
      g.globalCompositeOperation = 'source-over';
    }
    fogTex.needsUpdate = true;
  }
  return <mesh position={[(WIN.x0 + WIN.x1) / 2, (WIN.yb + WIN.yt) / 2, WIN.z + 0.02]} renderOrder={7}><planeGeometry args={[WIN.x1 - WIN.x0 - 0.02, WIN.yt - WIN.yb - 0.02]} /><meshBasicMaterial map={fogTex} transparent depthWrite={false} toneMapped={false} /></mesh>;
};
