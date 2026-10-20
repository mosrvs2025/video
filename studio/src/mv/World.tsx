// Low-poly story world for music videos: two faceless characters, three sets (night drive, living room, sunset lookout),
// beat-cut camera, warm->cold light arc. Shot list comes from story.json "world": [{a, b, set, v}].
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

const W = 1080, H = 1920;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const col = (a: string, b: string, u: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp(u)).getHexString();
type V3 = [number, number, number];

export type Shot = {a: number; b: number; set: 'drive' | 'room' | 'lookout'; v: string};
export const shotAt = (world: Shot[], t: number) => world.find((s) => t >= s.a && t < s.b) || world[world.length - 1];

// ---------- materials ----------
const Mat: React.FC<{c: string; e?: string; ei?: number; ice?: number; o?: number; rough?: number}> = ({c, e = '#000000', ei = 0, ice = 0, o = 1, rough = 0.85}) => (
  <meshStandardMaterial color={col(c, '#cfeeff', ice)} emissive={col(e, '#3a9cff', ice)} emissiveIntensity={ei + ice * 0.55} roughness={lerp(rough, 0.12, ice)} metalness={ice * 0.35}
    flatShading transparent={o < 1 || ice > 0} opacity={o * (1 - ice * 0.3)} />
);
const Box: React.FC<{p: V3; s: V3; c: string; r?: V3; e?: string; ei?: number; o?: number}> = ({p, s, c, r = [0, 0, 0], e, ei, o}) => (
  <mesh position={p} rotation={r}><boxGeometry args={s} /><Mat c={c} e={e} ei={ei} o={o} /></mesh>
);

// ---------- characters ----------
export type Pose = {
  p: V3; ry: number; sit: number; seat?: number; walk?: number; bob?: number; lean?: number;
  head?: [number, number, number]; // yaw, pitch, roll
  aL?: [number, number, number]; aR?: [number, number, number]; // shoulder pitch (- = forward/up), shoulder roll (+ = out), elbow
  ice?: number; phone?: number; // phone glow 0..1 in hands
};
type Look = {top: string; legs: string; skin: string; hat?: string; hair?: string; scarf?: string};
export const YOU: Look = {top: '#2d3b5c', legs: '#1b2030', skin: '#c99b7b', hat: '#f2c230'};
export const JAS: Look = {top: '#eadcc8', legs: '#3b2d3a', skin: '#b98263', hair: '#2a1913', scarf: '#d8323c'};

const Limb: React.FC<{p: V3; r: V3; l1: number; l2: number; k: number; w: number; c: string; c2?: string; ice: number; end?: React.ReactNode}> = ({p, r, l1, l2, k, w, c, c2, ice, end}) => (
  <group position={p} rotation={r}>
    <mesh position={[0, -l1 / 2, 0]}><capsuleGeometry args={[w, l1 - w, 3, 8]} /><Mat c={c} ice={ice} /></mesh>
    <group position={[0, -l1, 0]} rotation={[k, 0, 0]}>
      <mesh position={[0, -l2 / 2, 0]}><capsuleGeometry args={[w * 0.86, l2 - w, 3, 8]} /><Mat c={c2 || c} ice={ice} /></mesh>
      {end && <group position={[0, -l2, 0]}>{end}</group>}
    </group>
  </group>
);

export const Figure: React.FC<{look: Look; pose: Pose}> = ({look, pose}) => {
  const ice = pose.ice || 0, sit = pose.sit, walk = pose.walk || 0, bob = pose.bob || 0;
  const hip = sit ? (pose.seat ?? 0.46) : 0.93 + Math.abs(Math.sin(walk)) * 0.03;
  const lean = (pose.lean || 0) + (sit ? 0.06 : 0);
  const [hy, hp, hr] = pose.head || [0, 0, 0];
  const aL = pose.aL || [sit ? -0.5 : Math.sin(walk) * 0.5, 0.12, sit ? -0.9 : -0.25];
  const aR = pose.aR || [sit ? -0.5 : -Math.sin(walk) * 0.5, -0.12, sit ? -0.9 : -0.25];
  const thigh = sit ? -Math.PI / 2 + 0.08 : 0, knee = sit ? Math.PI / 2 - 0.05 : 0;
  const lL = sit ? thigh : Math.sin(walk) * 0.55, lR = sit ? thigh : -Math.sin(walk) * 0.55;
  const kL = sit ? knee : Math.max(0, -Math.sin(walk)) * 0.8 + 0.05, kR = sit ? knee : Math.max(0, Math.sin(walk)) * 0.8 + 0.05;
  const ph = pose.phone || 0;
  return (
    <group position={pose.p} rotation={[0, pose.ry, 0]}>
      {/* blob shadow */}
      <mesh position={[0, 0.012, sit ? 0.18 : 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.42, 20]} /><meshBasicMaterial color="#000" transparent opacity={0.28} depthWrite={false} /></mesh>
      <Limb p={[0.1, hip, 0]} r={[lL, 0, 0]} l1={0.45} l2={0.45} k={kL} w={0.075} c={look.legs} ice={ice} end={<mesh position={[0, -0.02, 0.06]}><boxGeometry args={[0.11, 0.07, 0.24]} /><Mat c="#1a1a1e" ice={ice} /></mesh>} />
      <Limb p={[-0.1, hip, 0]} r={[lR, 0, 0]} l1={0.45} l2={0.45} k={kR} w={0.075} c={look.legs} ice={ice} end={<mesh position={[0, -0.02, 0.06]}><boxGeometry args={[0.11, 0.07, 0.24]} /><Mat c="#1a1a1e" ice={ice} /></mesh>} />
      <group position={[0, hip, 0]} rotation={[lean + bob * 0.05, 0, 0]}>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.33, 0.16, 0.2]} /><Mat c={look.legs} ice={ice} /></mesh>
        <mesh position={[0, 0.34, 0]}><boxGeometry args={[0.4, 0.46, 0.23]} /><Mat c={look.top} ice={ice} /></mesh>
        <Limb p={[0.25, 0.54, 0]} r={[aL[0], 0, aL[1]]} l1={0.29} l2={0.27} k={aL[2]} w={0.058} c={look.top} c2={look.top} ice={ice} end={<mesh><sphereGeometry args={[0.055, 8, 6]} /><Mat c={look.skin} ice={ice} /></mesh>} />
        <Limb p={[-0.25, 0.54, 0]} r={[aR[0], 0, aR[1]]} l1={0.29} l2={0.27} k={aR[2]} w={0.058} c={look.top} c2={look.top} ice={ice} end={<mesh><sphereGeometry args={[0.055, 8, 6]} /><Mat c={look.skin} ice={ice} /></mesh>} />
        {look.scarf && <group position={[0, 0.6, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.1, 0.045, 6, 14]} /><Mat c={look.scarf} ice={ice} /></mesh>
          <mesh position={[0.07, -0.13, 0.12]} rotation={[0.1, 0, 0.08]}><boxGeometry args={[0.08, 0.24, 0.03]} /><Mat c={look.scarf} ice={ice} /></mesh>
        </group>}
        <group position={[0, 0.66, 0]} rotation={[hp + bob * 0.18, hy, hr]}>
          <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.045, 0.05, 0.08, 8]} /><Mat c={look.skin} ice={ice} /></mesh>
          <mesh position={[0, 0.17, 0.0]} scale={[1, 1.12, 1]}><sphereGeometry args={[0.12, 14, 10]} /><Mat c={look.skin} ice={ice} /></mesh>
          {look.hat && <group position={[0, 0.2, -0.005]}>
            <mesh><sphereGeometry args={[0.127, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat c={look.hat} ice={ice} /></mesh>
            <mesh position={[0, 0.0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.05, 14]} /><Mat c={col(look.hat, '#000000', 0.15)} ice={ice} /></mesh>
            <mesh position={[0, 0.14, 0]}><sphereGeometry args={[0.035, 8, 6]} /><Mat c={look.hat} ice={ice} /></mesh>
          </group>}
          {look.hair && <group>
            <mesh position={[0, 0.2, -0.015]}><sphereGeometry args={[0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 1.7]} /><Mat c={look.hair} ice={ice} /></mesh>
            <mesh position={[0, 0.03, -0.07]}><boxGeometry args={[0.25, 0.3, 0.1]} /><Mat c={look.hair} ice={ice} /></mesh>
          </group>}
        </group>
        {ph > 0 && <group position={[0, 0.26, 0.33]} rotation={[-0.9, 0, 0]}>
          <mesh><boxGeometry args={[0.075, 0.14, 0.012]} /><meshBasicMaterial color={col('#000000', '#bfe6ff', ph)} /></mesh>
          <pointLight position={[0, 0.08, 0.08]} color="#9fd2ff" intensity={ph * 1.6} distance={1.4} decay={2} />
        </group>}
      </group>
    </group>
  );
};

// ---------- camera ----------
type Cam = {e: V3; l: V3; f?: number};
const CamRig: React.FC<{cam: Cam; t: number; u: number; pulse: number; sway: number}> = ({cam, t, u, pulse, sway}) => {
  const {camera} = useThree();
  const e = new THREE.Vector3(...cam.e), l = new THREE.Vector3(...cam.l);
  e.lerp(l, 0.1 * smooth(u)); // slow dolly in
  e.x += Math.sin(t * 0.9) * 0.04 * sway; e.y += Math.sin(t * 1.3 + 1) * 0.025 * sway;
  camera.position.copy(e); camera.lookAt(l);
  const pc = camera as THREE.PerspectiveCamera; pc.fov = (cam.f || 40) - pulse * 0.6; pc.near = 0.05; pc.far = 400; pc.updateProjectionMatrix();
  return null;
};

// ---------- particles ----------
const SPRITE = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); } catch { return null; } })();
const Snow: React.FC<{t: number; n: number; box: [number, number, number]; c: V3; vz?: number; size?: number; color?: string; fall?: number}> = ({t, n, box, c, vz = 0, size = 0.09, color = '#eef8ff', fall = 1.1}) => {
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const sp = 0.6 + rnd(i + 3) * 0.8;
    pos[i * 3] = c[0] + (rnd(i) - 0.5) * box[0] + Math.sin(t * 0.7 + i) * 0.2;
    pos[i * 3 + 1] = c[1] + ((((rnd(i + 9) * box[1] - t * fall * sp) % box[1]) + box[1]) % box[1]) - box[1] / 2;
    pos[i * 3 + 2] = c[2] + ((((rnd(i + 17) * box[2] + t * vz * sp) % box[2]) + box[2]) % box[2]) - box[2] / 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return <points geometry={geo}><pointsMaterial map={SPRITE as any} size={size} color={color} transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
};
const Glow: React.FC<{p: V3; s: number; c: string; o?: number}> = ({p, s, c, o = 1}) => (
  <sprite position={p} scale={[s, s, s]}><spriteMaterial map={SPRITE as any} color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
);

// ---------- car (faces +z) ----------
const Car: React.FC<{body?: string; lights?: number; beams?: number; ice?: number; t: number; dash?: number}> = ({body = '#8a2f2f', lights = 1, beams = 0, ice = 0, dash = 0.6}) => (
  <group>
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.3, 4.6]} /><meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} /></mesh>
    <mesh position={[0, 0.55, 0]}><boxGeometry args={[1.8, 0.5, 4.2]} /><Mat c={body} ice={ice} rough={0.5} /></mesh>
    <mesh position={[0, 0.82, 1.45]} rotation={[-0.08, 0, 0]}><boxGeometry args={[1.76, 0.08, 1.3]} /><Mat c={body} ice={ice} rough={0.5} /></mesh>
    <mesh position={[0, 0.84, -1.7]}><boxGeometry args={[1.76, 0.1, 0.8]} /><Mat c={body} ice={ice} rough={0.5} /></mesh>
    {/* doors low so the people show */}
    <Box p={[0.89, 0.86, -0.15]} s={[0.04, 0.22, 2.3]} c={body} /><Box p={[-0.89, 0.86, -0.15]} s={[0.04, 0.22, 2.3]} c={body} />
    {/* pillars + roof */}
    {/* convertible: windshield frame only */}
    {[0.82, -0.82].map((x, i) => <mesh key={i} position={[x, 1.2, 0.76]} rotation={[-0.62, 0, 0]}><boxGeometry args={[0.06, 0.82, 0.06]} /><Mat c="#15161b" ice={ice} /></mesh>)}
    <mesh position={[0, 1.53, 0.52]} rotation={[-0.62, 0, 0]}><boxGeometry args={[1.7, 0.06, 0.06]} /><Mat c="#15161b" ice={ice} /></mesh>
    <mesh position={[0, 1.24, 0.72]} rotation={[-0.62, 0, 0]}><planeGeometry args={[1.6, 0.8]} /><meshStandardMaterial color="#9fc6e8" transparent opacity={0.12} roughness={0.05} metalness={0.6} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    {/* seats, dash, wheel */}
    {[0.38, -0.38].map((x, i) => <group key={i}><Box p={[x, 0.62, -0.45]} s={[0.55, 0.16, 0.6]} c="#2a2526" /><Box p={[x, 0.95, -0.8]} s={[0.55, 0.6, 0.14]} c="#4a3a36" /></group>)}
    <Box p={[0, 0.98, 0.62]} s={[1.6, 0.16, 0.3]} c="#1d1b1f" e="#ff9a4a" ei={dash * 0.5} />
    <Glow p={[0.05, 1.08, 0.58]} s={0.5} c="#ffb26b" o={dash * 0.7} />
    <mesh position={[-0.38, 1.06, 0.42]} rotation={[0.9, 0, 0]}><torusGeometry args={[0.16, 0.025, 6, 16]} /><Mat c="#111" /></mesh>
    {/* wheels */}
    {[[0.9, 1.35], [-0.9, 1.35], [0.9, -1.35], [-0.9, -1.35]].map(([x, z], i) => <mesh key={i} position={[x, 0.36, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.36, 0.36, 0.26, 14]} /><Mat c="#0e0e10" ice={ice} /></mesh>)}
    {/* lights */}
    {[0.62, -0.62].map((x, i) => <group key={i}>
      <Box p={[x, 0.66, 2.11]} s={[0.36, 0.12, 0.03]} c="#fff6dc" e="#fff1c8" ei={lights * 2} />
      <Glow p={[x, 0.66, 2.2]} s={0.9} c="#fff3d6" o={lights * 0.9} />
      <Box p={[x, 0.7, -2.11]} s={[0.34, 0.1, 0.03]} c="#ff3040" e="#ff1a2a" ei={lights * 1.6} />
      <Glow p={[x, 0.7, -2.2]} s={0.6} c="#ff3344" o={lights * 0.7} />
      {beams > 0 && <mesh position={[x, 0.55, 2.2 + 6]} rotation={[-Math.PI / 2 - 0.04, 0, 0]}><coneGeometry args={[1.6, 12, 18, 1, true]} /><meshBasicMaterial color="#fff3d6" transparent opacity={0.07 * beams} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} /></mesh>}
    </group>)}
  </group>
);

// ---------- sets ----------
const Mountains: React.FC<{c: string; z?: number; snow?: number}> = ({c, z = -70, snow = 0}) => (
  <group>{Array.from({length: 13}).map((_, i) => { const x = (i - 6) * 16 + (rnd(i) - 0.5) * 8, h = 10 + rnd(i + 4) * 16, r = 9 + rnd(i + 8) * 8; return (
    <group key={i} position={[x, h / 2 - 1, z - rnd(i + 2) * 30]}>
      <mesh rotation={[0, rnd(i + 1) * 3, 0]}><coneGeometry args={[r, h, 5]} /><Mat c={c} /></mesh>
      {snow > 0 && <mesh position={[0, h * 0.32, 0]} rotation={[0, rnd(i + 1) * 3, 0]}><coneGeometry args={[r * 0.36 * snow + 0.01, h * 0.36, 5]} /><Mat c="#e8f4ff" /></mesh>}
    </group>); })}</group>
);

const DriveSet: React.FC<{t: number; v: string; bp: number; pulse: number; u: number}> = ({t, v, bp}) => {
  const day = v === 'memory_day', snowy = v === 'alone_snow', speed = 12.8 / bp; // one lamp per beat
  const S = 12.8, lamps = Array.from({length: 9}).map((_, k) => { const z = ((k * S - t * speed) % (S * 9) + S * 9) % (S * 9) - S * 2; return z; });
  const near = lamps.reduce((m, z) => Math.min(m, Math.abs(z)), 99), pass = Math.exp(-near * near / 18);
  const road = day ? '#4a4648' : '#1a1b20';
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 40]}><planeGeometry args={[8, 260]} /><Mat c={snowy ? '#3a4452' : road} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 40]}><planeGeometry args={[400, 400]} /><Mat c={day ? '#c08a4c' : snowy ? '#8ea4bb' : '#121a16'} /></mesh>
      {Array.from({length: 26}).map((_, k) => { const z = ((k * 6 - t * speed) % 156 + 156) % 156 - 30; return <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]}><planeGeometry args={[0.14, 2.6]} /><meshBasicMaterial color={day ? '#f5e7b8' : '#d8c38a'} /></mesh>; })}
      {!day && lamps.map((z, k) => <group key={k} position={[-4.6, 0, z]}>
        <Box p={[0, 2.6, 0]} s={[0.12, 5.2, 0.12]} c="#2b2e36" /><Box p={[0.7, 5.15, 0]} s={[1.5, 0.1, 0.12]} c="#2b2e36" />
        <Box p={[1.35, 5.05, 0]} s={[0.4, 0.08, 0.2]} c="#ffcf8a" e={snowy ? '#bfe2ff' : '#ffb04a'} ei={2} />
        <Glow p={[1.35, 4.95, 0]} s={3.2} c={snowy ? '#bfe2ff' : '#ffb04a'} o={0.8} />
      </group>)}
      {!day && <pointLight position={[-3, 5, 0]} color={snowy ? '#bfe2ff' : '#ffae55'} intensity={pass * 22} distance={14} decay={1.6} />}
      {day && Array.from({length: 14}).map((_, k) => { const z = ((k * 11 - t * speed * 0.9) % 154 + 154) % 154 - 40; const x = (k % 2 ? 1 : -1) * (6 + rnd(k) * 4); return (
        <group key={k} position={[x, 0, z]}><Box p={[0, 0.9, 0]} s={[0.18, 1.8, 0.18]} c="#4a3524" /><mesh position={[0, 2.4, 0]}><coneGeometry args={[0.9, 2.2, 6]} /><Mat c="#4f6b3a" /></mesh></group>); })}
      <Mountains c={day ? '#a65f4a' : snowy ? '#5b6f88' : '#151c2c'} z={-90} snow={snowy ? 1 : 0} />
      <group position={[0, 0, 0]} rotation={[0, Math.PI, 0]}><Mountains c={day ? '#b56a4c' : snowy ? '#5b6f88' : '#151c2c'} z={-110} snow={snowy ? 1 : 0} /></group>
      {snowy && <Snow t={t} n={700} box={[14, 9, 30]} c={[0, 3.5, 6]} vz={14} size={0.08} fall={1.6} />}
      {!day && !snowy && <Snow t={t * 0.05} n={260} box={[220, 60, 10]} c={[0, 45, -150]} size={0.9} color="#fff7e8" fall={0} />}
      {day && <><mesh position={[0, 14, -260]}><circleGeometry args={[22, 40]} /><meshBasicMaterial color="#ffe3a0" /></mesh><Glow p={[0, 14, -255]} s={120} c="#ffcf80" o={0.6} /></>}
    </group>
  );
};

const RoomSet: React.FC<{t: number; v: string; idx: number; lightsOn: number; lamp: number; snowOut: number; c: number; doorOpen: number; scarf: number}> = ({t, idx, lightsOn, lamp, snowOut, c, doorOpen, scarf, v}) => {
  const wall = col('#7a5a48', '#33435a', c), floor = col('#6b4630', '#2c3442', c), N = 16;
  const rec = v !== 'dark' && v !== 'typing' && v !== 'alone';
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[10, 9]} /><Mat c={floor} /></mesh>
      {/* back wall with a window opening (x -1.2..1.2, y 1.0..2.4) */}
      <Box p={[-3.1, 1.6, -3]} s={[3.8, 3.2, 0.2]} c={wall} /><Box p={[3.1, 1.6, -3]} s={[3.8, 3.2, 0.2]} c={wall} />
      <Box p={[0, 0.5, -3]} s={[2.4, 1.0, 0.2]} c={wall} /><Box p={[0, 2.8, -3]} s={[2.4, 0.8, 0.2]} c={wall} />
      <Box p={[0, 1.7, -2.92]} s={[2.5, 0.08, 0.1]} c="#e9e2d8" /><Box p={[0, 1.0, -2.88]} s={[2.6, 0.08, 0.22]} c="#e9e2d8" /><Box p={[0, 2.4, -2.92]} s={[2.5, 0.08, 0.1]} c="#e9e2d8" />
      <Box p={[0, 1.7, -2.92]} s={[0.08, 1.4, 0.1]} c="#e9e2d8" />
      {/* night outside */}
      <mesh position={[0, 3, -9]}><planeGeometry args={[30, 16]} /><meshBasicMaterial color={col('#1a2140', '#0b1830', c)} /></mesh>
      {Array.from({length: 40}).map((_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 16, 0.4 + rnd(i + 3) * 3.4, -8.9]}><planeGeometry args={[0.18, 0.24]} /><meshBasicMaterial color={rnd(i + 7) < 0.5 + 0.4 * (1 - c) ? '#ffd38a' : '#26324a'} /></mesh>)}
      <mesh position={[2.4, 4.6, -8.8]}><circleGeometry args={[0.55, 24]} /><meshBasicMaterial color="#f4f1e6" /></mesh>
      {snowOut > 0 && <Snow t={t} n={260} box={[8, 5, 3]} c={[0, 2, -5.5]} size={0.06} fall={0.8} />}
      {/* left wall + door */}
      <Box p={[-4.0, 1.6, -0.6]} s={[0.2, 3.2, 5]} c={wall} />
      <Box p={[-3.88, 1.05, 1.3]} s={[0.06, 2.1, 0.95]} c="#191512" />
      <mesh position={[-3.88, 1.05, 1.3]}><planeGeometry args={[0.01, 0.01]} /></mesh>
      <group position={[-3.84, 0, 0.84]} rotation={[0, -doorOpen * 1.3, 0]}><Box p={[0, 1.05, 0.46]} s={[0.06, 2.1, 0.92]} c="#d9cbb8" /></group>
      {doorOpen > 0 && <><Box p={[-3.95, 1.05, 1.3]} s={[0.02, 2.1, 0.9]} c="#fff1d0" e="#ffdca0" ei={1.4 * doorOpen} /><pointLight position={[-3.4, 1.6, 1.3]} color="#ffd9a0" intensity={doorOpen * 6} distance={5} /></>}
      {/* rug, couch */}
      <mesh position={[0, 0.012, -0.9]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.7, 28]} /><Mat c={col('#b8574a', '#4a5872', c)} /></mesh>
      <Box p={[0, 0.22, -1.8]} s={[2.6, 0.44, 0.95]} c={col('#5d7a6a', '#465568', c)} />
      <Box p={[0, 0.7, -2.25]} s={[2.6, 0.6, 0.24]} c={col('#5d7a6a', '#465568', c)} />
      <Box p={[1.38, 0.5, -1.8]} s={[0.22, 0.5, 0.95]} c={col('#56705f', '#3f4c5e', c)} /><Box p={[-1.38, 0.5, -1.8]} s={[0.22, 0.5, 0.95]} c={col('#56705f', '#3f4c5e', c)} />
      {[-0.62, 0.62].map((x, i) => <Box key={i} p={[x, 0.5, -1.72]} s={[1.18, 0.12, 0.82]} c={col('#6a8a78', '#4c5c70', c)} />)}
      {scarf > 0 && <group position={[0.7, 0.58, -1.6]} rotation={[0, 0.4, 0]}><Box p={[0, 0, 0]} s={[0.5, 0.04, 0.1]} c="#d8323c" /><Box p={[0.22, -0.02, 0.14]} s={[0.1, 0.04, 0.32]} c="#d8323c" r={[0, 0.3, 0]} /></group>}
      {/* lamp */}
      <group position={[1.9, 0, -2.3]}>
        <Box p={[0, 0.03, 0]} s={[0.4, 0.06, 0.4]} c="#222" /><Box p={[0, 0.8, 0]} s={[0.05, 1.6, 0.05]} c="#222" />
        <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.2, 0.32, 0.36, 12, 1, true]} /><meshStandardMaterial color="#f3dcb4" emissive="#ffb766" emissiveIntensity={lamp * 1.6} side={THREE.DoubleSide} /></mesh>
        <Glow p={[0, 1.62, 0]} s={1.6} c="#ffb766" o={lamp * 0.8} />
        <pointLight position={[0, 1.6, 0.2]} color="#ffb06a" intensity={lamp * 9} distance={7} decay={1.6} />
      </group>
      {/* record player */}
      <group position={[-2.3, 0, -2.4]}>
        <Box p={[0, 0.35, 0]} s={[1.1, 0.7, 0.55]} c="#5a3d2b" /><Box p={[0, 0.75, 0]} s={[0.6, 0.1, 0.45]} c="#2a2220" />
        <mesh position={[0, 0.81, 0]} rotation={[0, rec ? t * 3.5 : 0, 0]}><cylinderGeometry args={[0.19, 0.19, 0.02, 24]} /><Mat c="#0c0c0c" rough={0.3} /></mesh>
        <mesh position={[0, 0.82, 0]}><cylinderGeometry args={[0.06, 0.06, 0.02, 12]} /><Mat c="#d8323c" e="#d8323c" ei={0.3} /></mesh>
        <Box p={[-0.45, 0.95, 0.02]} s={[0.18, 0.4, 0.2]} c="#1f1b1b" /><Box p={[0.45, 0.95, 0.02]} s={[0.18, 0.4, 0.2]} c="#1f1b1b" />
        {rec && [0, 1, 2].map((k) => { const ph = ((t * 0.55 + k / 3) % 1); return <Glow key={k} p={[0.45 + Math.sin(ph * 6 + k) * 0.15, 1.2 + ph * 1.1, 0.1]} s={0.22} c="#ffd28a" o={(1 - ph) * 0.9 * lightsOn} />; })}
      </group>
      {/* plant */}
      <group position={[3.0, 0, -2.3]}><mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.22, 0.17, 0.44, 10]} /><Mat c="#a45a3a" /></mesh>
        {[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[Math.sin(k * 1.3) * 0.15, 0.85 + k * 0.08, Math.cos(k * 1.3) * 0.15]} rotation={[Math.sin(k) * 0.5, k, Math.cos(k) * 0.4]}><coneGeometry args={[0.16, 0.8, 4]} /><Mat c={col('#4f7a42', '#3d5a52', c)} /></mesh>)}</group>
      {/* fairy lights along the back wall; they go out one by one */}
      {Array.from({length: N}).map((_, k) => { const x = -4 + (k + 0.5) * 8 / N, y = 2.95 - Math.sin((k % 4) / 4 * Math.PI) * 0.14; const on = k / N < lightsOn ? (0.75 + 0.25 * ((k + idx) % 3 === 0 ? 1 : 0)) : 0; return (
        <group key={k}><mesh position={[x, y, -2.86]}><sphereGeometry args={[0.035, 8, 6]} /><meshBasicMaterial color={on > 0 ? '#ffd28a' : '#3b3530'} /></mesh>{on > 0 && <Glow p={[x, y, -2.8]} s={0.5} c="#ffbe6a" o={on * 0.75} />}</group>); })}
      {lightsOn > 0 && <pointLight position={[0, 2.8, -2.4]} color="#ffbe6a" intensity={lightsOn * 4} distance={6} />}
    </group>
  );
};

const LookoutSet: React.FC<{t: number; v: string; c: number; snowy: number}> = ({t, c, snowy}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}><circleGeometry args={[18, 9]} /><Mat c={col('#6d6a3e', '#c8d6e6', snowy)} /></mesh>
    <mesh position={[0, -12, -14]}><boxGeometry args={[60, 24, 20]} /><Mat c={col('#3c3a2a', '#7d8fa6', snowy)} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -22, -120]}><planeGeometry args={[600, 300]} /><Mat c={col('#2b3a55', '#1a2a40', c)} /></mesh>
    <Mountains c={col('#4b3a5a', '#3c5070', c)} z={-110} snow={snowy} />
    {/* fence posts at the edge */}
    {Array.from({length: 9}).map((_, i) => <Box key={i} p={[(i - 4) * 1.4, 0.45, -7.2]} s={[0.1, 0.9, 0.1]} c="#4a3a2c" />)}
    <Box p={[0, 0.8, -7.2]} s={[11.4, 0.06, 0.06]} c="#4a3a2c" /><Box p={[0, 0.45, -7.2]} s={[11.4, 0.06, 0.06]} c="#4a3a2c" />
    {/* the sun sets as it goes cold */}
    <mesh position={[0, lerp(16, -10, smooth(c * 1.1)), -240]}><circleGeometry args={[18, 40]} /><meshBasicMaterial color={col('#ffd27a', '#ff8a5a', c)} /></mesh>
    <Glow p={[0, lerp(16, -10, smooth(c * 1.1)), -235]} s={110} c="#ffb06a" o={0.7 * (1 - c)} />
    <Snow t={t * 0.05} n={300} box={[300, 90, 10]} c={[0, 50, -200]} size={1.0} color="#fff7e8" fall={0} />
    {snowy > 0 && <Snow t={t} n={Math.floor(200 + 600 * snowy)} box={[16, 10, 16]} c={[0, 4, -2]} size={0.08} fall={1.3} />}
  </group>
);

// ---------- story states ----------
const SKY: Record<string, [string, string, string]> = { // top, mid, horizon (also fog)
  drive_together: ['#090c22', '#1c1840', '#47304a'], drive_quiet: ['#060a18', '#111a33', '#253049'], drive_memory_day: ['#6f9bd6', '#f2b07a', '#ffd9a6'], drive_alone_snow: ['#03050a', '#0b1422', '#1b2a3c'],
  lookout_memory: ['#25295a', '#b35a63', '#ffb35c'], lookout_freeze: ['#0b1430', '#33507a', '#8fb0cc'], lookout_shatter: ['#050a18', '#15274a', '#5a7ea0'], lookout_alone: ['#03060f', '#0d1a30', '#3a5272'],
  room: ['#0b0d14', '#0b0d14', '#0b0d14'],
};

export const worldLook = (shot: Shot, t: number) => {
  const k = shot.set === 'room' ? 'room' : `${shot.set}_${shot.v}`;
  const sky = SKY[k] || SKY.room;
  const memory = shot.v.startsWith('memory');
  return {sky, memory};
};

type Ctx = {t: number; u: number; lt: number; idx: number; pulse: number; down: number; bp: number; c: number; shot: Shot; bass: number};

const cast = (x: Ctx): {you?: Pose; jas?: Pose; shards?: {at: V3; t0: number}} => {
  const {t, lt, pulse, shot} = x, v = shot.v, beatBob = pulse;
  if (shot.set === 'drive') {
    const seatY = 0.66, z = -0.4;
    const youP: Pose = {p: [-0.38, 0, z], ry: 0, sit: 1, seat: seatY, aR: [-1.15, -0.05, -0.5], aL: [-1.1, 0.25, -0.6], head: [0, 0, 0]};
    const jasP: Pose = {p: [0.38, 0, z], ry: 0, sit: 1, seat: seatY};
    if (v === 'together') return {you: {...youP, bob: beatBob, head: [0.25 * Math.sin(t * 0.4), 0.05, Math.sin(t * 3.4) * 0.06]}, jas: {...jasP, bob: beatBob, head: [-0.3 + Math.sin(t * 0.8) * 0.2, -0.1, Math.sin(t * 3.4 + 1) * 0.1], aL: [-0.4 + Math.sin(t * 6.9) * 0.25, 1.3, -0.4], aR: [-0.5, -0.12, -0.9]}};
    if (v === 'quiet') return {you: {...youP, head: [0.35 * smooth((lt - 2) / 1.5), 0, 0]}, jas: {...jasP, head: [1.15, 0.2, 0], phone: lt < 2.5 ? 1 : clamp(1 - (lt - 2.5) / 0.4), aL: [-0.75, 0.05, -1.2], aR: [-0.75, -0.05, -1.2]}};
    if (v === 'memory_day') return {you: {...youP, bob: beatBob * 0.7}, jas: {...jasP, bob: beatBob, head: [-0.5, -0.05, 0.1], aL: [-0.3 + Math.sin(t * 6.9) * 0.3, 1.45, -0.2]}};
    if (v === 'alone_snow') return {you: {...youP, head: [0.6 * smooth((lt - 4) / 2) * (lt < 9 ? 1 : 1 - smooth((lt - 9) / 2)), 0.05, 0]}};
  }
  if (shot.set === 'room') {
    const sY = 0.56;
    const youS: Pose = {p: [-0.35, 0, -1.65], ry: 0, sit: 1, seat: sY}, jasS: Pose = {p: [0.35, 0, -1.65], ry: 0, sit: 1, seat: sY};
    if (v === 'dance') {
      const sway = Math.sin((t - 0.6) * Math.PI / x.bp) * 0.12, spin = Math.sin(t * 0.7) * 0.6;
      return {you: {p: [-0.32 + sway, 0, -0.4], ry: 0.9 + spin * 0.3, sit: 0, walk: Math.sin(t * 3.45) * 0.25, bob: beatBob, aL: [-1.3, 0.3, -0.5], aR: [-0.9, -0.25, -0.6], head: [0, -0.1, sway]},
        jas: {p: [0.32 + sway, 0, -0.4], ry: -2.25 + spin * 0.3, sit: 0, walk: -Math.sin(t * 3.45) * 0.25, bob: beatBob, aL: [-1.4, 0.2, -0.4], aR: [-2.5, -0.1, -0.2], head: [0, -0.15, -sway]}};
    }
    if (v === 'couch_phone') return {you: {...youS, p: [-0.25, 0, -1.65], head: [-0.5 * smooth((lt - 3) / 1.2), 0, 0], aR: [-0.5, -0.12, -0.9]}, jas: {...jasS, p: [0.25, 0, -1.65], phone: 1, aL: [-0.8, 0.05, -1.2], aR: [-0.8, -0.05, -1.2], head: [0.1, 0.45, 0]}};
    if (v === 'letgo') {
      const go = smooth((lt - 1.4) / 1.6), apart = smooth((lt - 3.5) / 2.5);
      return {you: {...youS, p: [-0.25, 0, -1.65], aL: [lerp(-0.55, -0.5, go), lerp(-0.42, 0.1, go), lerp(-0.4, -0.9, go)], head: [-0.45, lerp(0.05, 0.35, apart), 0]},
        jas: {...jasS, p: [lerp(0.25, 0.85, apart), 0, -1.65], aR: [lerp(-0.55, -0.6, go), lerp(0.42, -0.1, go), lerp(-0.4, -1.1, go)], head: [lerp(-0.2, 0.9, go), 0.2, 0]}};
    }
    if (v === 'leave') {
      // stands at 1.5s, walks to the door, gone by ~6.5s
      const up = smooth((lt - 1.2) / 0.8), wk = clamp((lt - 2) / 4.2);
      const path: V3 = [lerp(0.85, -3.5, smooth(wk)), 0, lerp(-1.65, 1.25, smooth(wk))];
      const jas: Pose | undefined = lt < 6.4 ? (up < 1 ? {...jasS, p: [0.85, 0, -1.65], sit: up < 0.5 ? 1 : 0, head: [0.4, 0.2, 0]} : {p: path, ry: Math.atan2(-4.35, 2.9) , sit: 0, walk: lt * 7, head: [0, 0.15, 0]}) : undefined;
      return {you: {...youS, p: [-0.25, 0, -1.65], head: [lerp(0, 0.9, smooth((lt - 2) / 3)) * -1 + (lt > 2 ? -0.4 : 0), 0.1, 0]}, jas};
    }
    if (v === 'alone' || v === 'typing' || v === 'dark') {
      const ph = v === 'dark' ? clamp(1 - (t - 186) / 2.2) : 1;
      return {you: {...youS, p: [-0.45, 0, -1.65], lean: 0.25, phone: ph, aL: [-0.95, 0.05, -1.25], aR: [-0.95, -0.05, -1.25], head: [0, 0.5 + (v === 'dark' ? 0.15 : 0), 0]}};
    }
  }
  if (shot.set === 'lookout') {
    const hood = 0.92;
    // car faces -z (the sunset); they sit on the front of the hood, facing it
    const youH: Pose = {p: [0.32, 0, -1.9], ry: Math.PI, sit: 1, seat: hood, aL: [-0.35, -0.2, -0.6], aR: [-0.2, -0.35, -0.2]};
    const jasH: Pose = {p: [-0.32, 0, -1.9], ry: Math.PI, sit: 1, seat: hood, head: [-0.15, 0.1, 0.42], lean: 0.05, aL: [-0.2, 0.3, -0.2], aR: [-0.5, -0.4, -0.7]};
    if (v === 'memory') return {you: {...youH, head: [0, 0, -0.08]}, jas: jasH};
    if (v === 'freeze') { const ice = smooth((t - shot.a) / (shot.b - shot.a)); return {you: youH, jas: {...jasH, ice, head: [lerp(-0.15, 0.3, ice), 0.1, lerp(0.42, 0, ice)]}}; }
    if (v === 'shatter') return {you: {...youH, head: [-0.5 * smooth((lt - 1) / 2), 0.25, 0]}, shards: {at: [-0.32, 0, -1.9], t0: shot.a}};
    if (v === 'alone') return {you: {...youH, lean: 0.3, head: [0, 0.45, 0], aL: [-0.6, 0.1, -1.1], aR: [-0.6, -0.1, -1.1]}};
  }
  return {};
};

const CAMS: Record<string, Cam[]> = {
  drive: [{e: [0.6, 2.3, -7.0], l: [0, 1.0, 3], f: 40}, {e: [3.8, 2.0, 7.2], l: [0, 0.95, 0], f: 36}, {e: [0, 1.45, 4.4], l: [0, 1.1, 0], f: 36}, {e: [5.8, 1.3, 0.4], l: [0, 1.0, 0], f: 34}, {e: [-3.2, 7.5, -8.5], l: [0, 0.4, 3], f: 40}],
  room: [{e: [0, 1.7, 4.4], l: [0, 0.95, -1.6], f: 40}, {e: [0.2, 1.15, 1.2], l: [0, 1.05, -1.7], f: 42}, {e: [3.2, 1.4, 0.6], l: [-0.2, 0.9, -1.6], f: 38}, {e: [-1.8, 2.4, 1.8], l: [0.2, 0.8, -1.6], f: 40}],
  lookout: [{e: [0, 2.5, 5.4], l: [0, 1.2, -5], f: 46}, {e: [0.3, 1.6, -5.6], l: [0, 1.3, -1.8], f: 38}, {e: [3.9, 1.6, -3.4], l: [0, 1.3, -1.9], f: 36}, {e: [-1.4, 1.2, -7.5], l: [0, 1.5, -1.6], f: 32}],
};
// state-specific camera orders (indices into CAMS[set]) and beats per cut
const ORDER: Record<string, {o: number[]; n: number}> = {
  drive_together: {o: [0, 1, 2, 3, 0, 4], n: 2}, drive_quiet: {o: [2, 3, 0, 2], n: 4}, drive_memory_day: {o: [0, 4, 1, 3, 2], n: 2}, drive_alone_snow: {o: [1, 0, 3, 2, 4], n: 4},
  room_dance: {o: [0, 2, 3, 0], n: 2}, room_couch_phone: {o: [0, 1, 2], n: 2}, room_letgo: {o: [1, 0, 1], n: 3}, room_leave: {o: [0, 3, 0], n: 3}, room_alone: {o: [0, 2, 1, 3], n: 4}, room_typing: {o: [1, 0, 2], n: 4}, room_dark: {o: [0, 1, 0], n: 6},
  lookout_memory: {o: [1, 0, 2, 3], n: 2}, lookout_freeze: {o: [0, 2, 1, 0], n: 2}, lookout_shatter: {o: [0, 2, 3, 0], n: 2}, lookout_alone: {o: [1, 0, 3], n: 4},
};

export const World: React.FC<{mv: any; sig: any; dim?: number}> = ({mv, sig}) => {
  const {t, pulse, down, c, bass} = sig;
  const shot = shotAt(mv.world, t), key = `${shot.set}_${shot.v}`, lt = t - shot.a, u = lt / (shot.b - shot.a);
  const bp = mv.bp, bi = Math.floor((t - mv.ph) / bp), b0 = Math.floor((shot.a - mv.ph) / bp);
  const ord = ORDER[key] || {o: [0], n: 4}, k = Math.max(0, Math.floor((bi - b0) / ord.n));
  const cam = CAMS[shot.set][ord.o[k % ord.o.length]];
  const cutStart = mv.ph + (b0 + k * ord.n) * bp, cu = clamp((t - Math.max(shot.a, cutStart)) / (ord.n * bp));
  const ctx: Ctx = {t, u, lt, idx: bi, pulse, down, bp, c, shot, bass};
  const who = cast(ctx);
  const {sky} = worldLook(shot, t);
  const warm = shot.v.startsWith('memory') || shot.v === 'together' || shot.v === 'dance' ? 1 : 0;
  const cc = warm ? Math.min(c, 0.15) : c;
  // room light state
  const lightsOn = shot.set === 'room' ? (shot.v === 'dance' ? 1 : shot.v === 'couch_phone' ? 0.9 : shot.v === 'letgo' ? 0.7 : shot.v === 'leave' ? lerp(0.6, 0.3, u) : shot.v === 'alone' ? 0.25 : 0) : 0;
  const lamp = shot.set === 'room' ? (shot.v === 'dark' ? clamp(1 - (t - 182) / 2) * 0.25 : shot.v === 'typing' ? 0.35 : shot.v === 'alone' ? 0.5 : 1) : 0;
  const doorOpen = shot.v === 'leave' ? smooth((lt - 4.2) / 0.7) * (1 - smooth((lt - 6.8) / 0.6)) : 0;
  const snowy = shot.set === 'lookout' ? (shot.v === 'memory' ? 0 : shot.v === 'freeze' ? smooth(u) * 0.6 : 1) : 0;
  const shardsN = 46;
  return (
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 52%, ${sky[2]} 78%, ${sky[2]} 100%)`}}>
      <ThreeCanvas width={W} height={H} style={{position: 'absolute', inset: 0}} gl={{antialias: true, alpha: true}}>
        <CamRig cam={cam} t={t} u={cu} pulse={pulse} sway={shot.v === 'together' || shot.v === 'memory_day' ? 1.6 : 1} />
        <fog attach="fog" args={[sky[2], shot.set === 'room' ? 30 : 18, shot.set === 'room' ? 60 : shot.set === 'drive' ? 150 : 260]} />
        <hemisphereLight args={[col('#ffe2c4', '#bcd8ff', cc), col('#2a1a12', '#0c1626', cc), shot.set === 'room' ? 0.55 : 0.9]} />
        <directionalLight position={shot.set === 'lookout' ? [0, 6, -20] : [4, 8, 6]} intensity={shot.set === 'lookout' ? lerp(2.2, 0.8, cc) : shot.v === 'memory_day' ? 2.2 : 0.7} color={col('#ffc38a', '#a9c8ff', cc)} />
        {shot.set === 'lookout' && <directionalLight position={[2, 4, 8]} intensity={0.6} color={col('#9d8cff', '#7fa6d8', cc)} />}
        {shot.set === 'drive' && <group>
          <DriveSet t={t} v={shot.v} bp={bp} pulse={pulse} u={u} />
          <Car t={t} body={shot.v === 'alone_snow' ? '#6b3a3a' : '#a23a36'} lights={1} beams={shot.v === 'memory_day' ? 0 : 1} dash={shot.v === 'together' ? 0.6 + pulse * 0.6 : 0.35} />
          <pointLight position={[0, 1.3, 0.3]} color={shot.v === 'alone_snow' ? '#9fc8ff' : '#ffb26b'} intensity={shot.v === 'together' ? 2.5 + pulse * 2 : 1.4} distance={3} />
        </group>}
        {shot.set === 'room' && <RoomSet t={t} v={shot.v} idx={bi} lightsOn={lightsOn} lamp={lamp} snowOut={c > 0.6 ? 1 : 0} c={cc} doorOpen={doorOpen} scarf={['alone', 'typing', 'dark'].includes(shot.v) ? 1 : 0} />}
        {shot.set === 'lookout' && <group>
          <LookoutSet t={t} v={shot.v} c={cc} snowy={snowy} />
          <group position={[0, 0, 0.1]} rotation={[0, Math.PI, 0]}><Car t={t} body="#a23a36" lights={0} ice={shot.v === 'memory' ? 0 : snowy * 0.4} dash={0} /></group>
          {shot.v === 'alone' && <group position={[-0.35, 0.9, -1.95]}><Box p={[0, 0, 0]} s={[0.42, 0.04, 0.1]} c="#d8323c" r={[0, 0.5, 0]} /><Box p={[0.12, -0.12, 0.2]} s={[0.09, 0.26, 0.03]} c="#d8323c" r={[0.3, 0.5, 0]} /></group>}
        </group>}
        {who.you && <Figure look={YOU} pose={who.you} />}
        {who.jas && <Figure look={JAS} pose={who.jas} />}
        {who.shards && Array.from({length: shardsN}).map((_, i) => {
          const st = t - who.shards!.t0, burst = smooth(st / 0.25), dir = new THREE.Vector3(rnd(i) - 0.5, rnd(i + 5) * 0.8 + 0.1, rnd(i + 9) - 0.5).normalize();
          const p0: V3 = [who.shards!.at[0] + (rnd(i + 1) - 0.5) * 0.4, 1.0 + rnd(i + 2) * 0.95, who.shards!.at[2] + (rnd(i + 3) - 0.5) * 0.25];
          const d = burst * (0.4 + rnd(i + 4) * 0.6) + st * 0.35, fade = clamp(1 - st / 9);
          if (fade <= 0) return null;
          return <mesh key={i} position={[p0[0] + dir.x * d, p0[1] + dir.y * d - st * st * 0.004, p0[2] + dir.z * d]} rotation={[t * (0.5 + rnd(i) * 2), t * (0.3 + rnd(i + 1)), 0]} scale={(0.05 + rnd(i + 6) * 0.08) * fade}>
            <octahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#d6f1ff" emissive="#58b7ff" emissiveIntensity={0.6 + bass} metalness={0.3} roughness={0.1} flatShading transparent opacity={0.92} />
          </mesh>;
        })}
      </ThreeCanvas>
    </div>
  );
};
