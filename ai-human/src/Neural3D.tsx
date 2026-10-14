import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';

const rnd = (n: number) => { const s = Math.sin(n * 91.3 + 17.7) * 43758.5453; return s - Math.floor(s); };

// seeded point cloud: dense core + shell, so it reads as a brain-ish neural net
const NODES = (() => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 260; i++) {
    const u = rnd(i * 3 + 1) * 2 - 1, th = rnd(i * 3 + 2) * Math.PI * 2, r = Math.cbrt(rnd(i * 3 + 3)) * 2.4;
    const s = Math.sqrt(1 - u * u);
    pts.push(new THREE.Vector3(r * s * Math.cos(th) * 1.15, r * u * 0.95, r * s * Math.sin(th)));
  }
  return pts;
})();
const EDGES = (() => {
  const e: [number, number][] = [];
  for (let i = 0; i < NODES.length; i++) for (let j = i + 1; j < NODES.length; j++) if (NODES[i].distanceTo(NODES[j]) < 0.95) e.push([i, j]);
  return e;
})();

const SPRITE = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

export const Neural3D: React.FC<{frame: number; reveal: number; scale: number; opacity: number; hot?: number}> = ({frame, reveal, scale, opacity, hot = 0}) => {
  const t = frame / 30;
  const {pGeo, lGeo} = useMemo(() => {
    const cold = new THREE.Color('#4fd8ff'), white = new THREE.Color('#ffffff'), warm = new THREE.Color('#ffc46b');
    const base = cold.clone().lerp(warm, hot);
    const pPos: number[] = [], pCol: number[] = [];
    const bright: number[] = [];
    NODES.forEach((n, i) => {
      const d = n.length();
      const vis = d / 2.6 < reveal ? 1 : 0;
      const wave = Math.max(0, 1 - Math.abs(((t * 1.1 + rnd(i) * 0.2) % 3) - d) * 1.6);
      const b = vis * (0.35 + wave * 1.2);
      bright.push(b);
      if (!vis) return;
      pPos.push(n.x, n.y, n.z);
      const c = base.clone().lerp(white, Math.min(1, wave)).multiplyScalar(Math.min(1.4, b));
      pCol.push(c.r, c.g, c.b);
    });
    const lPos: number[] = [], lCol: number[] = [];
    EDGES.forEach(([a, b]) => {
      const A = NODES[a], B = NODES[b];
      const vis = Math.max(A.length(), B.length()) / 2.6 < reveal ? 1 : 0;
      if (!vis) return;
      lPos.push(A.x, A.y, A.z, B.x, B.y, B.z);
      const ca = base.clone().multiplyScalar(0.18 + bright[a] * 0.45), cb = base.clone().multiplyScalar(0.18 + bright[b] * 0.45);
      lCol.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
    });
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
    pg.setAttribute('color', new THREE.Float32BufferAttribute(pCol, 3));
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lPos, 3));
    lg.setAttribute('color', new THREE.Float32BufferAttribute(lCol, 3));
    return {pGeo: pg, lGeo: lg};
  }, [frame, reveal, hot]);

  return (
    <ThreeCanvas width={1080} height={1920} camera={{position: [0, 0, 7.5], fov: 50}} style={{position: 'absolute', inset: 0, opacity}}>
      <group rotation={[0.25 * Math.sin(t * 0.3), t * 0.35, 0]} scale={scale}>
        <lineSegments geometry={lGeo}><lineBasicMaterial vertexColors transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} /></lineSegments>
        <points geometry={pGeo}><pointsMaterial vertexColors map={SPRITE} size={0.28} sizeAttenuation transparent blending={THREE.AdditiveBlending} depthWrite={false} /></points>
      </group>
    </ThreeCanvas>
  );
};
