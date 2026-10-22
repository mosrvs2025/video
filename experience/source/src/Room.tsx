import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {clamp, col, lerp, rnd, smooth, V3} from './lib';

// ---------- geometry constants (metres) ----------
export const WIN = {x0: -0.4, x1: 1.1, yb: 0.95, yt: 3.35, z: -4.0};
export const CHAIR_POS: V3 = [0.35, 0, -2.2];
export const DOOR = {x: -3.0, z0: -1.2, z1: -0.2, h: 2.1};

export type Pal = {name: string; wall: string; floor: string; trim: string; amb: string; plate: string};
export const PALS: Pal[] = [
  {name: 'dawn', wall: '#c9bda7', floor: '#7a6049', trim: '#d9d2c2', amb: '#a9b4c4', plate: 'STUDY'},
  {name: 'green', wall: '#92aa98', floor: '#55523f', trim: '#cfd8cc', amb: '#9fb8aa', plate: 'NURSERY'},
  {name: 'rose', wall: '#bf9c9c', floor: '#654a44', trim: '#e0cfcf', amb: '#c4a9a9', plate: 'GUEST'},
  {name: 'concrete', wall: '#92969a', floor: '#45484b', trim: '#b7babd', amb: '#9aa2aa', plate: 'STORAGE'},
  {name: 'blue', wall: '#8196ad', floor: '#3d4652', trim: '#bccadb', amb: '#7f96b5', plate: 'OFFICE'},
];

// ---------- procedural textures ----------
const mkTex = (draw: (g: CanvasRenderingContext2D, s: number) => void, size = 1024, rep: [number, number] = [1, 1]) => {
  try {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d')!; draw(g, size);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  } catch { return null as any; }
};
const PLASTER = mkTex((g, s) => {
  g.fillStyle = '#dcd6cb'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) { const x = rnd(i) * s, y = rnd(i + 3) * s, r = 4 + rnd(i + 7) * 60; const a = 0.015 + rnd(i + 9) * 0.05; g.fillStyle = rnd(i + 11) > 0.45 ? `rgba(60,50,40,${a})` : `rgba(255,252,245,${a})`; g.beginPath(); g.ellipse(x, y, r, r * (0.5 + rnd(i + 13)), rnd(i + 15) * 3, 0, Math.PI * 2); g.fill(); }
  for (let k = 0; k < 7; k++) { const x = rnd(k * 7 + 100) * s, y = rnd(k * 7 + 101) * s; g.fillStyle = 'rgba(70,58,44,.22)'; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 9; j++) g.lineTo(x + Math.cos(j * 0.7 + k) * (60 + rnd(k * 9 + j) * 70), y + Math.sin(j * 0.7 + k) * (45 + rnd(k * 5 + j) * 60)); g.closePath(); g.fill(); g.strokeStyle = 'rgba(250,246,238,.18)'; g.lineWidth = 3; g.stroke(); }
  for (let k = 0; k < 14; k++) { let x = rnd(k + 300) * s, y = rnd(k + 330) * s; g.strokeStyle = 'rgba(40,32,24,.28)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 14; j++) { x += (rnd(k * 20 + j) - 0.5) * 30; y += 8 + rnd(k * 31 + j) * 22; g.lineTo(x, y); } g.stroke(); }
}, 1024, [2, 1.3]);
const WOOD = mkTex((g, s) => {
  g.fillStyle = '#9c7d5f'; g.fillRect(0, 0, s, s); const n = 8;
  for (let p = 0; p < n; p++) { const x0 = (p / n) * s, w = s / n; g.fillStyle = `rgba(${20 + rnd(p) * 40},${14 + rnd(p + 4) * 24},${8 + rnd(p + 9) * 16},${0.12 + rnd(p + 2) * 0.2})`; g.fillRect(x0, 0, w, s);
    for (let k = 0; k < 40; k++) { const yy = rnd(p * 50 + k) * s; g.strokeStyle = `rgba(30,20,12,${0.05 + rnd(p * 70 + k) * 0.12})`; g.lineWidth = 1 + rnd(k) * 2; g.beginPath(); g.moveTo(x0 + 4, yy); g.bezierCurveTo(x0 + w * 0.3, yy + 20, x0 + w * 0.7, yy - 20, x0 + w - 4, yy + rnd(k + 5) * 12); g.stroke(); }
    g.fillStyle = 'rgba(20,12,6,.55)'; g.fillRect(x0 - 1.5, 0, 3, s); }
  for (let k = 0; k < 18; k++) { g.fillStyle = 'rgba(20,12,6,.5)'; g.fillRect(rnd(k) * s, 0, 2, 0); g.fillRect(((k % n) / n) * s, rnd(k + 40) * s, s / n, 3); }
}, 1024, [1.4, 2.2]);

// ---------- the chair (facing -z, like the cover) ----------
const box = (w: number, h: number, d: number, x: number, y: number, z: number, rx = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); g.translate(x, y, z); return g; };
export const chairGeo = (() => {
  const parts: THREE.BufferGeometry[] = [box(0.5, 0.045, 0.48, 0, 0.47, 0)];
  for (const [x, z] of [[-0.22, -0.2], [0.22, -0.2]]) { const g = new THREE.CylinderGeometry(0.022, 0.017, 0.47, 8); g.translate(x, 0.235, z); parts.push(g); }
  for (const [x, z] of [[-0.22, 0.2], [0.22, 0.2]]) { const g = new THREE.CylinderGeometry(0.024, 0.018, 0.96, 8); g.translate(x, 0.48, z); parts.push(g); }
  parts.push(box(0.46, 0.03, 0.03, 0, 0.18, -0.2), box(0.03, 0.03, 0.4, -0.22, 0.2, 0), box(0.03, 0.03, 0.4, 0.22, 0.2, 0));
  for (const y of [0.64, 0.77, 0.9]) parts.push(box(0.42, 0.075, 0.02, 0, y, 0.205, -0.08));
  return mergeGeometries(parts)!;
})();
export const Chair: React.FC<{color?: string; opacity?: number; emissive?: string; ei?: number}> = ({color = '#8c6c48', opacity = 1, emissive = '#000', ei = 0}) => (
  <mesh geometry={chairGeo} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.78} metalness={0.02} transparent={opacity < 1} opacity={opacity} emissive={emissive} emissiveIntensity={ei} depthWrite={opacity >= 1} /></mesh>
);

// ---------- door plate (a tiny sign whose text changes) ----------
const plateCanvas = (() => { try { const c = document.createElement('canvas'); c.width = 512; c.height = 160; return c; } catch { return null as any; } })();
const plateTex = plateCanvas ? new THREE.CanvasTexture(plateCanvas) : (null as any); let plateKey = '';
const drawPlate = (txt: string, glow: number) => {
  const k = txt + glow.toFixed(2); if (!plateCanvas || k === plateKey) return; plateKey = k;
  const g = plateCanvas.getContext('2d')!; g.clearRect(0, 0, 512, 160); g.fillStyle = '#b9a064'; g.fillRect(0, 0, 512, 160); g.strokeStyle = 'rgba(40,30,10,.7)'; g.lineWidth = 6; g.strokeRect(5, 5, 502, 150);
  g.fillStyle = `rgba(36,26,8,${0.9})`; g.font = '600 84px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 84); plateTex.needsUpdate = true;
};

// ---------- the room ----------
export const Room: React.FC<{pal: Pal; palB?: Pal; mix?: number; door: number; plate: string; objGlow: number[]; objVis: number; bright: number}> = ({pal, palB, mix = 0, door, plate, objGlow, objVis, bright}) => {
  const wall = palB ? col(pal.wall, palB.wall, mix) : pal.wall, floor = palB ? col(pal.floor, palB.floor, mix) : pal.floor, trim = palB ? col(pal.trim, palB.trim, mix) : pal.trim;
  drawPlate(plate, 0);
  const W = (props: {p: V3; s: V3; c?: string; tex?: boolean; rough?: number}) => <mesh position={props.p} castShadow receiveShadow><boxGeometry args={props.s} /><meshStandardMaterial color={props.c ?? wall} map={props.tex === false ? undefined : PLASTER} roughness={props.rough ?? 0.95} /></mesh>;
  const dz = (DOOR.z0 + DOOR.z1) / 2, dw = DOOR.z1 - DOOR.z0;
  return (
    <group>
      {/* floor + ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.25]} receiveShadow><planeGeometry args={[6.4, 8.6]} /><meshStandardMaterial color={floor} map={WOOD} roughness={0.62} metalness={0.04} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, -0.25]}><planeGeometry args={[6.4, 8.6]} /><meshStandardMaterial color="#6f6a63" roughness={1} /></mesh>
      {/* window wall (opening x -0.4..1.1, y 0.95..3.35) */}
      <W p={[-1.7, 2, -4.0]} s={[2.6, 4, 0.3]} /><W p={[2.05, 2, -4.0]} s={[1.9, 4, 0.3]} />
      <W p={[0.35, 0.475, -4.0]} s={[1.5, 0.95, 0.3]} /><W p={[0.35, 3.675, -4.0]} s={[1.5, 0.65, 0.3]} />
      {/* window frame, mullions, sill */}
      <mesh position={[0.35, 2.15, -3.9]} castShadow><boxGeometry args={[0.05, 2.4, 0.06]} /><meshStandardMaterial color={trim} roughness={0.7} /></mesh>
      <mesh position={[0.35, 2.15, -3.9]} castShadow><boxGeometry args={[1.5, 0.05, 0.06]} /><meshStandardMaterial color={trim} roughness={0.7} /></mesh>
      {[[-0.4, 2.15, 0.07, 2.4], [1.1, 2.15, 0.07, 2.4], [0.35, 0.95, 1.5, 0.07], [0.35, 3.35, 1.5, 0.07]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, -3.88]}><boxGeometry args={[w, h, 0.12]} /><meshStandardMaterial color={trim} roughness={0.7} /></mesh>)}
      <mesh position={[0.35, 0.93, -3.7]} receiveShadow castShadow><boxGeometry args={[1.8, 0.05, 0.34]} /><meshStandardMaterial color={trim} roughness={0.6} /></mesh>
      {/* left wall with a door */}
      <W p={[DOOR.x, 2, (-4 + DOOR.z0) / 2]} s={[0.3, 4, DOOR.z0 + 4]} /><W p={[DOOR.x, 2, (DOOR.z1 + 5) / 2]} s={[0.3, 4, 5 - DOOR.z1]} />
      <W p={[DOOR.x, (DOOR.h + 4) / 2, dz]} s={[0.3, 4 - DOOR.h, dw]} />
      <mesh position={[DOOR.x - 0.45, 1.0, dz]}><planeGeometry args={[0.1, 0.1]} /><meshBasicMaterial color="#05060a" /></mesh>
      <mesh position={[DOOR.x - 0.3, DOOR.h / 2, dz]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[dw + 0.6, DOOR.h + 0.3]} /><meshBasicMaterial color="#07080c" /></mesh>
      <group position={[DOOR.x + 0.1, 0, DOOR.z1]} rotation={[0, door, 0]}><mesh position={[0, DOOR.h / 2, -dw / 2]} castShadow><boxGeometry args={[0.05, DOOR.h, dw - 0.02]} /><meshStandardMaterial color={trim} roughness={0.7} /></mesh></group>
      <mesh position={[DOOR.x + 0.16, 1.55, 0.35]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.44, 0.14]} /><meshStandardMaterial map={plateTex} roughness={0.4} metalness={0.3} emissive="#ffffff" emissiveMap={plateTex} emissiveIntensity={0.35} /></mesh>
      {/* right wall + far wall behind the camera */}
      <W p={[3, 2, -0.25]} s={[0.3, 4, 8.6]} /><W p={[0, 2, 4.2]} s={[6.4, 4, 0.3]} />
      {/* little things on the sill */}
      <group position={[0, 0.955, -3.72]}>
        {[
          {x: -0.12, g: objGlow[0], geo: <cylinderGeometry args={[0.04, 0.034, 0.08, 20]} />, y: 0.04, c: '#c9c2b4'},
          {x: 0.27, g: objGlow[1], geo: <torusGeometry args={[0.035, 0.009, 8, 20]} />, y: 0.012, c: '#c9a95f', flat: true},
          {x: 0.62, g: objGlow[2], geo: <torusGeometry args={[0.028, 0.008, 8, 20]} />, y: 0.012, c: '#d9d3c6', flat: true},
          {x: 0.95, g: objGlow[3], geo: <boxGeometry args={[0.12, 0.012, 0.09]} />, y: 0.007, c: '#e7e0cf'},
        ].map((o, i) => <mesh key={i} position={[o.x, o.y, i % 2 ? 0.03 : -0.02]} rotation={(o as any).flat ? [Math.PI / 2, 0, 0] : [0, 0.5, 0]} scale={objVis} castShadow>{o.geo}<meshStandardMaterial color={o.c} roughness={0.5} emissive="#ffb060" emissiveIntensity={o.g * 2.4} /></mesh>)}
      </group>
      <hemisphereLight args={[(palB ? col(pal.amb, palB.amb, mix) : pal.amb), '#1a1512', 0.9 * bright]} />
    </group>
  );
};
