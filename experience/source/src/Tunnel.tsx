import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {Glow, clamp} from './lib';
import {bands} from './sig';

// The sound as a place: 32 bars around a ring, ring after ring, each ring showing the spectrum from a moment earlier,
// so the song streams toward the camera as it flies down the tube.
const NR = 26, NB = 32, SP = 1.15;
export type TunPal = 'cool' | 'warm' | 'white';
const hue = (pal: TunPal, j: number, t: number) => pal === 'cool' ? 0.5 + 0.3 * (j / (NB - 1)) + 0.03 * Math.sin(t) : pal === 'warm' ? 0.02 + 0.1 * (j / (NB - 1)) : 0.1 + 0.05 * (j / (NB - 1));
export const Tunnel: React.FC<{t: number; t0: number; pal: TunPal; speed: number; kick: number; energy: number}> = ({t, t0, pal, speed, kick, energy}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(0.16, 1, 0.1), []);
  const tmp = useMemo(() => ({o: new THREE.Object3D(), c: new THREE.Color()}), []);
  useLayoutEffect(() => {
    const m = ref.current!; const {o, c} = tmp; const run = (t - t0) * speed; const off = run % SP; let n = 0;
    for (let k = 0; k < NR; k++) {
      const z = -(k * SP - off) - 1.5; const bd = bands(Math.max(0, t - k * 0.06)); const twist = (run - k * SP) * 0.07 + t * 0.12;
      for (let j = 0; j < NB; j++) {
        const bi = j < 16 ? j : 31 - j; const v = clamp(bd[bi] * 1.05); const R = 2.3 + 0.25 * Math.sin(k * 0.5 + t), h = 0.08 + 1.1 * v * v + 0.35 * kick * v;
        const a = (j / NB) * Math.PI * 2 + twist;
        o.position.set(Math.cos(a) * (R - h / 2), Math.sin(a) * (R - h / 2), z); o.rotation.set(0, 0, a - Math.PI / 2); o.scale.set(1, h, 1); o.updateMatrix(); m.setMatrixAt(n, o.matrix);
        c.setHSL(hue(pal, bi, t) % 1, pal === 'white' ? 0.3 : 1, 0.5); c.multiplyScalar(0.1 + 1.2 * Math.pow(v, 1.3) + 0.3 * kick * v); m.setColorAt(n, c); n++;
      }
    }
    m.instanceMatrix.needsUpdate = true; m.instanceColor!.needsUpdate = true;
  });
  const gc = pal === 'cool' ? '#7fb8ff' : pal === 'warm' ? '#ff9a4a' : '#fff4dc';
  return (
    <>
      <fog attach="fog" args={['#000', 5, 28]} />
      <instancedMesh ref={ref} args={[geo, undefined as any, NR * NB]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

    </>
  );
};
