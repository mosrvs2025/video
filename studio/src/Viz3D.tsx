import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Edit} from './lib';

/** Audio-reactive 3D ring of bars + particle halo driven by the cut's spectrum (three.js via @remotion/three). */
export const Viz3D: React.FC<{edit: Edit; frame: number; opacity: number}> = ({edit, frame, opacity}) => {
  const t = frame / 30;
  const spec = (edit.spectrum || [])[Math.min(frame, (edit.spectrum || []).length - 1)] || new Array(20).fill(0.2);
  const N = 56;
  const col = useMemo(() => ({a: new THREE.Color(edit.theme.accent), b: new THREE.Color(edit.theme.cool)}), [edit.theme]);
  const bass = (spec[0] + spec[1] + spec[2]) / 3;
  const bars = Array.from({length: N}).map((_, i) => {
    const u = i / N, bi = Math.min(19, Math.floor(Math.abs(Math.sin(u * Math.PI)) * 19)), h = 0.15 + spec[bi] * 2.2 * (0.7 + 0.3 * Math.sin(i * 1.7 + t * 3));
    const ang = u * Math.PI * 2, r = 2.6 + bass * 0.35;
    return {x: Math.cos(ang) * r, z: Math.sin(ang) * r, h, ang, c: col.a.clone().lerp(col.b, u).multiplyScalar(0.8)};
  });
  const pts = useMemo(() => { const p: number[] = []; for (let i = 0; i < 260; i++) { const a = (i * 2.399963) % (Math.PI * 2), r = 3.4 + ((i * 7919) % 100) / 100 * 2.6, y = (((i * 104729) % 100) / 100 - 0.5) * 3; p.push(Math.cos(a) * r, y, Math.sin(a) * r); } return new Float32Array(p); }, []);
  return (
    <ThreeCanvas width={1080} height={1920} camera={{position: [0, 2.4, 12.5], fov: 50}} style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'screen'}}>
      <group rotation={[0.05, t * 0.25, 0]} position={[0, 0.8, 0]}>
        {bars.map((b, i) => (
          <mesh key={i} position={[b.x, b.h / 2 - 0.9, b.z]} rotation={[0, -b.ang, 0]}>
            <boxGeometry args={[0.13, b.h, 0.13]} /><meshBasicMaterial color={b.c} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
        <points rotation={[0, -t * 0.12, 0]}>
          <bufferGeometry><bufferAttribute attach="attributes-position" array={pts} count={pts.length / 3} itemSize={3} /></bufferGeometry>
          <pointsMaterial size={0.05 + bass * 0.04} color={edit.theme.cool} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </group>
    </ThreeCanvas>
  );
};
