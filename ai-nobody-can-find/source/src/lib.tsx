import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import timeline from './timeline.json';
import cues from './cues.json';

export const FPS = 30;
export const TL: any = timeline;
export const CUES: any = cues;

// ---------- palette & type ----------
export const P = {
  ink: '#050608', ink2: '#0d1014', paper: '#e9e4da', paperDim: 'rgba(233,228,218,.55)', steel: '#8ea2b4', amber: '#f0a14a', rust: '#c4553b',
};
export const F = {sans: '"Inter Display", Inter, sans-serif', text: 'Inter, sans-serif', serif: '"FreeSerif", "DejaVu Serif", serif', mono: '"DejaVu Sans Mono", monospace'};

// ---------- math ----------
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
export const smoother = (x: number) => { const c = clamp(x); return c * c * c * (c * (c * 6 - 15) + 10); };
export const easeOut = (x: number, p = 3) => 1 - Math.pow(1 - clamp(x), p);
export const easeIn = (x: number, p = 3) => Math.pow(clamp(x), p);
export const easeInOut = (x: number) => { const c = clamp(x); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
export const expoOut = (x: number) => { const c = clamp(x); return c >= 1 ? 1 : 1 - Math.pow(2, -10 * c); };
export const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const win = (t: number, a: number, b: number, fi = 0.6, fo = 0.6) => clamp((t - a) / fi) * clamp((b - t) / fo);

// ---------- cue access ----------
export const line = (id: string) => CUES[id] as {t0: number; t1: number; phrases: {t0: number; t1: number; text: string; words: {w: string; t: number}[]}[]};
export const ph = (id: string, k: number) => line(id).phrases[Math.min(k, line(id).phrases.length - 1)].t0;
export const act = (id: string) => (TL.acts as any[]).find((a) => a.id === id) as {t0: number; t1: number};

// ---------- keyframed values ----------
// keys: [time, value]; eased between keys with smootherstep (deliberate, no overshoot)
export const keys = (t: number, k: [number, number][]) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], smoother((t - k[i][0]) / (k[i + 1][0] - k[i][0])));
  return k[k.length - 1][1];
};
export type V3 = [number, number, number];
export const keys3 = (t: number, k: [number, V3][]): V3 => [0, 1, 2].map((i) => keys(t, k.map(([tt, v]) => [tt, v[i]] as [number, number]))) as V3;

// camera: position/target/fov keyframes, set every frame (deterministic)
export const Cam: React.FC<{pos: V3; look: V3; fov?: number; roll?: number; near?: number; far?: number}> = ({pos, look, fov = 35, roll = 0, near = 0.05, far = 2000}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  const d = new THREE.Vector3(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]).normalize();
  if (Math.abs(d.y) > 0.985) c.up.set(0, 0, -1); else c.up.set(Math.sin(roll), Math.cos(roll), 0);
  c.lookAt(...look);
  c.fov = fov; c.near = near; c.far = far; c.updateProjectionMatrix();
  return null;
};

// soft round sprite used for lights / glints (physical light sources only)
export const SPRITE = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); } catch { return null as any; } })();
export const Glow: React.FC<{p: V3; s: number; c: string; o?: number}> = ({p, s, c, o = 1}) => (
  <sprite position={p} scale={[s, s, s]}><spriteMaterial map={SPRITE} color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
);

// the recurring "process" glyph: a tetrahedron inside a thin ring
export const Process: React.FC<{p: V3; s?: number; t: number; o?: number; c?: string}> = ({p, s = 1, t, o = 1, c = P.amber}) => (
  <group position={p} scale={s}>
    <mesh rotation={[t * 0.9, t * 1.3, 0]}><tetrahedronGeometry args={[0.5, 0]} /><meshBasicMaterial color={c} wireframe transparent opacity={o} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, t * 0.4]}><torusGeometry args={[0.85, 0.012, 6, 64]} /><meshBasicMaterial color={c} transparent opacity={0.7 * o} /></mesh>
    <Glow p={[0, 0, 0]} s={2.6} c={c} o={0.55 * o} />
  </group>
);

// ---------- typography (DOM) ----------
export const Label: React.FC<{x: number; y: number; o: number; kicker?: string; title: string; sub?: string; tag?: 'EXISTS TODAY' | 'ACTIVE RESEARCH' | 'SPECULATIVE' | string; align?: 'left' | 'right' | 'center'; w?: number; color?: string; scale?: number}> = ({x, y, o, kicker, title, sub, tag, align = 'left', w = 560, color = P.paper, scale = 1}) => {
  const tagC = tag === 'SPECULATIVE' ? P.amber : tag === 'ACTIVE RESEARCH' ? '#c9c3b6' : tag === 'NOT OBSERVED' ? P.amber : P.steel;
  const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  return (
    <div style={{position: 'absolute', left, top: y, width: w, opacity: o, textAlign: align, transform: `translateY(${(1 - o) * 10}px) scale(${scale})`, transformOrigin: align === 'right' ? 'right top' : align === 'center' ? 'center top' : 'left top'}}>
      {kicker && <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: 5, color: P.paperDim, marginBottom: 10}}>{kicker}</div>}
      <div style={{height: 1, background: `linear-gradient(${align === 'right' ? 270 : 90}deg, ${color}, transparent)`, width: Math.min(w, 220) * clamp(o * 1.4), marginLeft: align === 'right' ? 'auto' : align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0, marginBottom: 14, opacity: 0.7}} />
      <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: 6, color, textTransform: 'uppercase'}}>{title}</div>
      {sub && <div style={{fontFamily: F.text, fontWeight: 300, fontSize: 22, lineHeight: 1.45, color: P.paperDim, marginTop: 10}}>{sub}</div>}
      {tag && <div style={{display: 'inline-block', marginTop: 16, fontFamily: F.mono, fontSize: 15, letterSpacing: 4, color: tagC, border: `1px solid ${tagC}88`, padding: '5px 12px'}}>{tag}</div>}
    </div>
  );
};

// word-by-word serif line keyed to the narration
export const Spoken: React.FC<{id: string; x: number; y: number; w?: number; size?: number; align?: 'left' | 'center'; t: number; hold?: number; color?: string; accent?: string[]; italic?: boolean}> = ({id, x, y, w = 1400, size = 64, align = 'center', t, hold = 1.2, color = P.paper, accent = [], italic = true}) => {
  const L = line(id); const words = L.phrases.flatMap((p) => p.words); const end = L.t1 + hold;
  const o = clamp((t - L.t0 + 0.2) / 0.3) * clamp((end - t) / 0.6); if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: align === 'center' ? x - w / 2 : x, top: y, width: w, textAlign: align, fontFamily: F.serif, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.22, color, opacity: o}}>
      {words.map((wd, i) => { const p = easeOut((t - wd.t + 0.05) / 0.45); const acc = accent.includes(wd.w.replace(/[^\w']/g, '').toLowerCase());
        return <span key={i} style={{display: 'inline-block', marginRight: size * 0.26, opacity: 0.12 + 0.88 * p, transform: `translateY(${(1 - p) * 8}px)`, filter: `blur(${(1 - p) * 3}px)`, color: acc ? P.amber : undefined}}>{wd.w}</span>; })}
    </div>
  );
};

// fixed-resolution GL layer scaled to fill the frame (software GL cost is per pixel)
export const GLLayer: React.FC<{w: number; h: number; rs?: number; children: React.ReactNode}> = ({w, h, rs = 0.75, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: Math.round(w * rs), height: Math.round(h * rs), transform: `scale(${1 / rs})`, transformOrigin: '0 0'}}>{children}</div>
);

export const Stage: React.FC<{w: number; h: number; rs?: number; shadows?: boolean; children: React.ReactNode}> = ({w, h, rs = 0.75, shadows = false, children}) => (
  <GLLayer w={w} h={h} rs={rs}>
    <ThreeCanvas width={Math.round(w * rs)} height={Math.round(h * rs)} style={{position: 'absolute', inset: 0}} gl={{antialias: false, alpha: true, preserveDrawingBuffer: true}} shadows={shadows}>
      {children}
    </ThreeCanvas>
  </GLLayer>
);
export type SceneProps = {t: number; w: number; h: number; v: boolean};

// project a world point to frame pixels for a camera (for DOM labels pinned to 3D objects)
export const project = (p: V3, pos: V3, look: V3, fov: number, w: number, h: number): [number, number, boolean] => {
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.05, 5000); cam.position.set(...pos);
  const d = new THREE.Vector3(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]).normalize(); if (Math.abs(d.y) > 0.985) cam.up.set(0, 0, -1);
  cam.lookAt(...look); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam); return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h, v.z < 1];
};
