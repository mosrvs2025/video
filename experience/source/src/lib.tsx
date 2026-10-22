import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig} from 'remotion';

export const FPS = 30;
export const P = {ink: '#06070a', paper: '#ece6da', paperDim: 'rgba(236,230,218,.62)', dawn: '#ffb878', day: '#fff0d8', cool: '#9db8d6', ember: '#ff6a1f'};
export const F = {sans: '"Inter Display", Inter, sans-serif', serif: '"FreeSerif", "DejaVu Serif", serif', mono: '"DejaVu Sans Mono", monospace'};
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
export const smoother = (x: number) => { const c = clamp(x); return c * c * c * (c * (c * 6 - 15) + 10); };
export const easeOut = (x: number, p = 3) => 1 - Math.pow(1 - clamp(x), p);
export const easeIn = (x: number, p = 3) => Math.pow(clamp(x), p);
export const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const win = (t: number, a: number, b: number, fi = 0.6, fo = 0.6) => clamp((t - a) / fi) * clamp((b - t) / fo);
export type V3 = [number, number, number];
export const keys = (t: number, k: [number, number][], ease: (x: number) => number = smoother) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], ease((t - k[i][0]) / (k[i + 1][0] - k[i][0])));
  return k[k.length - 1][1];
};
export const keys3 = (t: number, k: [number, V3][], ease?: (x: number) => number): V3 => [0, 1, 2].map((i) => keys(t, k.map(([tt, v]) => [tt, v[i]] as [number, number]), ease)) as V3;
export const col = (a: string, b: string, u: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp(u)).getHexString();

export const Cam: React.FC<{pos: V3; look: V3; fov?: number; roll?: number; near?: number; far?: number}> = ({pos, look, fov = 36, roll = 0, near = 0.05, far = 200}) => {
  const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(...look); c.fov = fov; c.near = near; c.far = far; c.updateProjectionMatrix();
  return null;
};
export const SPRITE = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); } catch { return null as any; } })();
export const Glow: React.FC<{p: V3; s: number; c: string; o?: number}> = ({p, s, c, o = 1}) => (
  <sprite position={p} scale={[s, s, s]}><spriteMaterial map={SPRITE} color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
);
// 3-D layer rendered at reduced resolution and scaled up (software GL cost is per pixel); drafts (15 fps) go lighter
export const Stage: React.FC<{w: number; h: number; rs?: number; shadows?: boolean; children: React.ReactNode}> = ({w, h, rs: rsIn, shadows = false, children}) => {
  const {fps} = useVideoConfig(); const rs = rsIn ?? (fps < 30 ? 0.45 : 0.65);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: Math.round(w * rs), height: Math.round(h * rs), transform: `scale(${1 / rs})`, transformOrigin: '0 0'}}>
      <ThreeCanvas width={Math.round(w * rs)} height={Math.round(h * rs)} style={{position: 'absolute', inset: 0}} gl={{antialias: false, alpha: true, preserveDrawingBuffer: true}} shadows={shadows}>{children}</ThreeCanvas>
    </div>
  );
};
