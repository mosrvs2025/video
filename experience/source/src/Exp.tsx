import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Cam, Glow, P, F, Stage, clamp, col, easeOut, keys, keys3, lerp, rnd, smooth, win, V3} from './lib';
import {AUD, DUR, FRAMES, LINES, M, bands, line, onsetsIn, pulse, sig} from './sig';
import {CHAIR_POS, Chair, DOOR, PALS, Room} from './Room';
import {Beam, Dust, FloorPatch, GhostChairs, FogGlass, Presence, Ripples, Ring} from './Fx';

// ------------------------------------------------------------------------------------------------
// structure (all times are song seconds; see docs/STORYLINES.md)
// ------------------------------------------------------------------------------------------------
const snapTo = (t: number, win_ = 0.55) => { const c = onsetsIn(t - win_, t + win_, 'low', 0.45).concat(onsetsIn(t - win_, t + win_, 'mid', 0.55)); return c.length ? c.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a)).t : t; };
const HOPS = [117.4, 122.0, 127.6, 133.2].map((t) => snapTo(t)); // door-jamb wipes through rooms that keep changing
const HOP_END = [...HOPS.slice(1), M.hit_cut];
const hopIdx = (t: number) => HOPS.reduce((n, h, i) => (t >= h ? i + 1 : n), 0); // 0 before the first hop
const palIdx = (t: number) => (t < HOPS[0] ? 0 : t < M.hit_cut ? hopIdx(t) : t < 156.1 ? 3 : t < 167 ? 4 : t < M.abrupt_stop ? 0 : t < M.surge_start ? 4 : 4);

const ringEvents = (() => {
  const R: Ring[] = [];
  for (const id of ['v1a', 'v1b', 'v1c', 'v1d', 'v2a', 'v2b', 'v2c', 'v2d']) R.push({t0: line(id).t0, a: 0.28, speed: 1.3});
  for (const id of ['c1a', 'c1b', 'c1d', 'f1a', 'f1c']) { const t0 = line(id).t0; [[0, 0.8], [0.22, 0.5], [0.44, 0.3]].forEach(([d, a]) => R.push({t0: t0 + d, a, speed: 1.7})); }
  for (const id of ['c1c', 'f1b']) R.push({t0: line(id).t0, a: 0.5, speed: 2.4, w: 0.06});
  R.push({t0: 72.6, a: 0.9, speed: 2.8, w: 0.07}, {t0: 181.6, a: 0.9, speed: 2.8, w: 0.07});
  for (const [a, b] of [[59.5, 76], [167, 184]]) for (const o of onsetsIn(a, b, 'mid', 0.6)) R.push({t0: o.t, a: 0.22 * o.s, speed: 1.4});
  for (const o of onsetsIn(M.stutter_start, M.stutter_end, 'mid', 0.3)) R.push({t0: o.t, a: 0.5, speed: 2.0});
  for (const o of onsetsIn(184, 199, 'low', 0.5)) R.push({t0: o.t, a: 0.28 * o.s, speed: 1.2});
  R.push({t0: M.hit_cut - 0.05, a: 1, speed: 4.5, w: 0.1}, {t0: M.hit_cut + 0.15, a: 0.7, speed: 3.4, w: 0.08}, {t0: M.last_hits[0], a: 0.9, speed: 3.5, w: 0.1}, {t0: M.last_hits[1], a: 0.9, speed: 3.5, w: 0.1});
  return R.sort((a, b) => a.t0 - b.t0);
})();

const NAMES = ['STUDY', 'NURSERY', 'GUEST', 'STORAGE', 'EMPTY'];
const plateAt = (t: number) => { if (t < 156.1) return PALS[palIdx(t)].plate; const on = onsetsIn(156.8, 160.3, 'mid', 0.3).concat(onsetsIn(156.8, 160.3, 'high', 0.5)).sort((a, b) => a.t - b.t).map((o) => o.t); const n = on.filter((x) => x <= t).length; return t >= 160.3 ? 'EMPTY' : NAMES[Math.min(NAMES.length - 2, n)]; };

// ------------------------------------------------------------------------------------------------
// camera, light, presence: pure functions of time
// ------------------------------------------------------------------------------------------------
const CC: V3 = [0.35, 0.9, -2.2];
const orbit = (th: number, R: number, y: number): V3 => [CC[0] + R * Math.sin(th), y, CC[2] + R * Math.cos(th)];
const camAt = (t: number): {pos: V3; look: V3; fov: number} => {
  if (t >= HOPS[0] && t < M.hit_cut) { const k = hopIdx(t) - 1, a = HOPS[k], b = HOP_END[k], u = clamp((t - a) / (b - a)); return {pos: [lerp(2.3, 0.9, u), lerp(1.2, 1.0, u), lerp(3.1, 0.3, u)], look: [lerp(0.2, 0.35, u), 0.95, lerp(-1.2, -2.2, u)], fov: 40}; }
  if (t >= M.hit_cut && t < M.stutter_start) { const u = (t - M.hit_cut) / (M.stutter_start - M.hit_cut); return {pos: [lerp(2.5, 2.1, u), lerp(1.45, 1.3, u), lerp(3.2, 2.7, u)], look: [0.35, 0.95, -2.0], fov: 44}; }
  if (t >= M.stutter_start && t < M.stutter_end) { const n = onsetsIn(M.stutter_start, t + 0.001, 'mid', 0.3).length; return n % 2 ? {pos: [1.1, 0.8, -0.4], look: [0.35, 0.6, -2.2], fov: 34} : {pos: [2.4, 1.35, 2.8], look: [0.35, 0.95, -2.0], fov: 44}; }
  if (t >= M.stutter_end && t < 160.3) { const u = clamp((t - M.stutter_end) / 4.2); return {pos: [lerp(-0.7, -0.95, u), 1.55, 0.35], look: [-2.84, 1.55, 0.35], fov: 22}; }
  if (t >= 160.3 && t < 167.3) { const u = smooth((t - 160.3) / 3.2); return {pos: [lerp(-0.95, -0.2, u), lerp(1.55, 1.0, u), lerp(0.35, 1.1, u)], look: [lerp(-2.84, 0.35, u), lerp(1.55, 0.95, u), lerp(0.35, -2.2, u)], fov: lerp(22, 38, u)}; }
  if (t >= 167.3 && t < 184) { const u = (t - 167.3) / (184 - 167.3); const th = lerp(0.35, 2.45, smooth(u)); return {pos: orbit(th, lerp(3.0, 2.0, u), lerp(1.1, 1.35, u)), look: [CC[0], 0.9, CC[2]], fov: lerp(40, 34, u)}; }
  if (t >= 184 && t < M.abrupt_stop) { const u = smooth((t - 184) / 10); const from = orbit(2.45, 2.0, 1.35); return {pos: [lerp(from[0], 0.35, u), lerp(from[1], 1.3, u), lerp(from[2], 4.0, u)], look: [0.35, lerp(0.9, 0.95, u), -2.2], fov: lerp(34, 42, u)}; }
  if (t >= M.abrupt_stop && t < M.surge_start) { const u = (t - M.abrupt_stop) / (M.surge_start - M.abrupt_stop); return {pos: [0.35, lerp(1.7, 1.9, u), lerp(1.4, -0.2, smooth(u))], look: [0.35, 2.0, -4.0], fov: lerp(40, 38, u)}; }
  if (t >= M.surge_start) { const u = (t - M.surge_start) / (M.silence - M.surge_start); return {pos: [0.35, 1.9, lerp(-0.2, -3.8, u * u)], look: [0.35, 2.05, -4.0], fov: lerp(36, 70, u * u)}; }
  const kp: [number, V3][] = [[0, [2.3, 0.45, 3.0]], [16, [1.7, 0.6, 2.4]], [32, [1.0, 0.85, 1.7]], [44.7, [1.5, 0.95, 1.0]], [59.6, [1.2, 1.1, 0.6]], [70.5, [1.25, 1.2, -0.2]], [74.4, [-0.9, 1.0, -1.0]], [89.5, [-0.8, 1.1, -0.6]], [92.5, [0.35, 1.6, -1.2]], [98.4, [0.35, 1.15, -1.5]], [111.8, [0.35, 1.12, -1.9]], [117.4, [0.35, 1.12, -2.2]]];
  const kl: [number, V3][] = [[0, [0.35, 1.05, -2.6]], [16, [0.35, 1.25, -2.8]], [32, [0.35, 1.45, -3.0]], [44.7, [0.35, 1.1, -2.4]], [59.6, [0.35, 1.15, -2.4]], [70.5, [0.35, 1.1, -2.3]], [74.4, [0.35, 0.6, -2.2]], [89.5, [0.35, 0.8, -2.2]], [92.5, [0.35, 1.8, -4.0]], [98.4, [0.35, 1.28, -4.0]], [111.8, [0.35, 1.22, -4.0]], [117.4, [0.35, 1.2, -4.0]]];
  const kf: [number, number][] = [[0, 44], [16, 42], [32, 40], [44.7, 36], [59.6, 34], [70.5, 32], [74.4, 36], [89.5, 38], [92.5, 38], [98.4, 34], [111.8, 34], [117.4, 34]];
  return {pos: keys3(t, kp), look: keys3(t, kl), fov: keys(t, kf)};
};
const moodKeys: [number, string, number, number][] = [[0, '#a07858', 0.4, 0.04], [4, '#ffb070', 0.7, 0.08], [16, '#ffc890', 0.95, 0.1], [32, '#ffd9a8', 0.8, 0.09], [44, '#ffe6c4', 1.1, 0.11], [59, '#fff0dc', 1.5, 0.14], [76, '#fff0dc', 1.2, 0.11], [88, '#ffe8cc', 1.3, 0.12], [92, '#d6e2f2', 0.75, 0.09], [117, '#d6e2f2', 0.95, 0.1], [130, '#ffffff', 1.6, 0.16], [M.hit_cut - 0.01, '#ffffff', 2.2, 0.2], [M.hit_cut, '#aeb6c0', 0.4, 0.04], [M.stutter_end, '#aeb6c0', 0.4, 0.04], [157, '#7f94b8', 0.3, 0.05], [161, '#3c4f78', 0.22, 0.035], [167, '#fff0dc', 1.7, 0.17], [184, '#ffe0b8', 1.3, 0.14], [M.abrupt_stop - 0.01, '#fff0dc', 1.5, 0.16], [M.abrupt_stop, '#5c78a8', 0.28, 0.03], [207, '#5c78a8', 0.2, 0.02], [M.surge_start, '#cfe0ff', 1.0, 0.1], [211, '#ffffff', 3.2, 0.42]];
const moodAt = (t: number) => { let i = 0; while (i < moodKeys.length - 1 && t >= moodKeys[i + 1][0]) i++; const a = moodKeys[i], b = moodKeys[Math.min(i + 1, moodKeys.length - 1)]; const u = a === b ? 0 : smooth((t - a[0]) / (b[0] - a[0])); return {c: col(a[1], b[1], u), dir: lerp(a[2], b[2], u), beam: lerp(a[3], b[3], u)}; };
const skyKeys: [number, string][] = [[0, '#c98a5a'], [16, '#e8b080'], [44, '#ffe4bc'], [88, '#ffe9c8'], [92, '#7f93ad'], [130, '#98abc8'], [M.hit_cut - 0.01, '#ffffff'], [M.hit_cut, '#9ea4ac'], [M.stutter_end, '#9ea4ac'], [157, '#27324c'], [161, '#0e1830'], [167, '#ffe4bc'], [184, '#ffcf9a'], [M.abrupt_stop - 0.01, '#fff0d8'], [M.abrupt_stop, '#162238'], [M.surge_start - 0.01, '#162238'], [M.surge_start, '#bcd0f0'], [211, '#ffffff']];
const skyAt = (t: number) => { let i = 0; while (i < skyKeys.length - 1 && t >= skyKeys[i + 1][0]) i++; const a = skyKeys[i], b = skyKeys[Math.min(i + 1, skyKeys.length - 1)]; return col(a[1], b[1], a === b ? 0 : smooth((t - a[0]) / Math.max(0.001, b[0] - a[0]))); };
const SKY_TEX = (() => { try { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d')!; const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.55, '#e6e6e6'); gr.addColorStop(1, '#ffffff'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; } catch { return null as any; } })();
const presenceAt = (t: number) => {
  let asm = 0, fray = 0, ember = 0, bright = 0;
  if (t >= 36 && t < 44.7) { asm = keys(t, [[36, 0], [44.7, 0.4]]); bright = 0.35 * smooth((t - 36) / 6); }
  else if (t >= 44.7 && t < 73.2) { asm = keys(t, [[44.7, 0.4], [52, 1], [73.2, 1]]); bright = 1; const a = line('c1c'); fray = keys(t, [[a.t0, 0], [a.t0 + 2.0, 0.55], [a.t1 + 0.3, 0.55], [a.t1 + 1.6, 0]]); }
  else if (t >= 73.2 && t < 75) { asm = keys(t, [[73.2, 1], [74.6, 0]]); fray = keys(t, [[73.2, 0], [74.8, 1.2]]); bright = 1 - smooth((t - 74.0) / 1); }
  else if (t >= 147 && t < 153.83) { asm = keys(t, [[147, 0], [152, 0.28]]); bright = 0.25 * smooth((t - 147) / 3); }
  else if (t >= 160.8 && t < 184.2) { ember = 1; asm = keys(t, [[160.8, 0], [165, 1], [179.2, 1], [183.9, 0]]); bright = 0.95; const a = line('f1b'); fray = keys(t, [[a.t0, 0], [a.t0 + 2.0, 0.6], [a.t1 + 0.2, 0.6], [a.t1 + 1.4, 0]]) + (t > 179.2 ? keys(t, [[179.2, 0], [183.9, 1.2]]) : 0); }
  return {asm, fray, ember, bright: bright * (0.75 + 0.5 * pulse(t, 'mid', 0.25, 0.3))};
};

const jamb = (t: number) => { for (const h of HOPS) if (Math.abs(t - h) < 0.26) return clamp((t - (h - 0.26)) / 0.52); return -1; };

export const Exp: React.FC = () => {
  const frame = useCurrentFrame(); const {fps, width: w, height: h} = useVideoConfig(); const t = frame / fps;
  const s = sig(t), b = bands(t); const mood = moodAt(t); const cam = camAt(t); const pr = presenceAt(t); const pi = palIdx(t);
  const dark = t >= M.silence; const surge = t >= M.surge_start && t < M.silence;
  const harmony = t >= 184 && t < M.abrupt_stop;
  const ghostVis = Array.from({length: 12}).map((_, i) => (harmony ? smooth((t - (184.6 + i * 1.2)) / 0.9) : 0));
  const door = t < 54.6 ? 1.25 : t < 57.4 ? 1.25 * (1 - easeOut((t - 54.6) / 2.8)) : t < HOPS[0] ? 0 : t < HOPS[0] + 0.5 ? 1.25 * easeOut((t - HOPS[0]) / 0.5) : 1.25;
  const objGlow = [106.3, 107.3, 108.2, 109.0].map((tt) => smooth((t - tt) / 0.35));
  const objVis = t < 111.8 ? 1 : t < 117.3 ? 1 - smooth((t - 111.8) / 4) : 0;
  const stream = t >= 111.8 && t < 118 ? smooth((t - 111.8) / 2.5) * (1 - smooth((t - 116.8) / 1.2)) : 0;
  // breath on the glass
  const fog = t < 98.4 ? 0 : t < 116.9 ? keys(t, [[98.4, 0], [99.8, 0.85], [111.8, 0.7], [116.8, 0]]) : t >= 204.4 && t < M.surge_start ? keys(t, [[204.4, 0], [205.4, 0.8], [207.9, 0.85]]) : 0;
  const drip = keys(t, [[101, 0], [111, 1]]);
  const fogText = t < 206.3 ? 'And' : 'nothing.'; const write = t < 116.9 ? 0 : t < 206.3 ? clamp((t - 204.5) / 0.9) : clamp((t - 206.4) / 1.0);
  // light: the real window light and the visible shaft
  const flicker = 0.6 + 0.8 * s.rms;
  const beamI = mood.beam * (0.55 + 0.9 * s.rms);
  const dirI = mood.dir * (t >= M.stutter_start && t < M.stutter_end ? 0.3 + 1.4 * s.rms : 1) * (0.8 + 0.4 * s.rms);
  const wash = t >= 138.2 && t < M.hit_cut ? smooth((t - 138.2) / 0.8) * 0.85 : surge ? clamp((t - 209.0) / 3.5) * 0.9 + pulse(t, 'any', 0.15, 0.6) * 0.1 : 0;
  const flashHit = t >= M.last_hits[0] - 0.02 && t < M.silence ? 0.6 + 0.4 * pulse(t, 'any', 0.1) : 0;
  const J = jamb(t);
  const titleO = win(t, 3.2, 10.5, 1.6, 1.8), endO = win(t, 214.9, 217.3, 0.9, 0.2);
  const fadeIn = clamp(t / 1.2) * 0 + 1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {!dark && <Stage w={w} h={h} shadows>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} far={60} />
        <fog attach="fog" args={['#07080b', 9, 26]} />
        <Room pal={PALS[pi]} door={door} plate={plateAt(t)} objGlow={objGlow} objVis={objVis * 1.7} bright={0.5 + 0.9 * clamp(mood.dir / 1.6)} />
        <directionalLight position={[0.35, 8.9, -11]} target-position={[0.35, 0.9, -3]} intensity={dirI} color={mood.c} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={6} shadow-camera-bottom={-4} shadow-camera-near={1} shadow-camera-far={30} shadow-bias={-0.0006} />
        <Beam b={b} color={mood.c} intensity={beamI} />
        <FloorPatch b={b} color={mood.c} intensity={0.35 * (0.4 + mood.dir / 1.6)} />
        <group position={CHAIR_POS}><Chair color="#8c6c48" emissive="#ffb868" ei={harmony ? 0.04 + 0.12 * s.rms : 0} /></group>
        <Dust t={t} b={b} air={s.air} low={s.low} stream={stream} color={mood.c} gain={0.9 + 0.8 * s.high} />
        <Ripples t={t} rings={ringEvents} color={pr.ember > 0.5 ? '#ff9a4a' : '#ffe2b8'} />
        <Presence t={t} asm={pr.asm} fray={pr.fray} bright={pr.bright} ember={pr.ember} />
        {harmony && <GhostChairs vis={ghostVis} b={b} />}
        <FogGlass fog={fog} drip={drip} write={write} text={fogText} flash={0} />
        <mesh position={[0.35, 2.15, -4.12]}><planeGeometry args={[1.5, 2.4]} /><meshBasicMaterial map={SKY_TEX} color={skyAt(t)} toneMapped={false} /></mesh>
        <mesh position={[0.35, 2.15, -4.9]}><planeGeometry args={[40, 30]} /><meshBasicMaterial color={skyAt(t)} toneMapped={false} /></mesh>
      </Stage>}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, transparent 40%, rgba(0,0,0,.62) 100%)'}} />
      {titleO > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1500, textAlign: 'center', opacity: titleO, fontFamily: F.sans, color: P.paper, textShadow: '0 4px 28px rgba(0,0,0,.8)'}}>
        <div style={{fontSize: 74, fontWeight: 300, letterSpacing: 16}}>EXPERIENCE 1</div>
        <div style={{fontSize: 34, letterSpacing: 6, marginTop: 14, color: P.paperDim, fontFamily: F.mono}}>by @professorfungi</div>
      </div>}
      {wash > 0 && <AbsoluteFill style={{background: '#fff', opacity: wash}} />}
      {flashHit > 0 && <AbsoluteFill style={{background: '#fff', opacity: flashHit}} />}
      {J >= 0 && <AbsoluteFill style={{background: 'linear-gradient(90deg, #08090c 0%, #0b0c10 88%, rgba(11,12,16,0) 100%)', transform: `translateX(${lerp(112, -112, J < 0.5 ? 0.5 * Math.pow(J * 2, 3) : 1 - 0.5 * Math.pow(2 - J * 2, 3))}%)`, width: '100%'}} />}
      {endO > 0 && <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: endO}}><div style={{textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', color: P.paper}}><div style={{fontSize: 78}}>Experience 1</div><div style={{fontSize: 32, fontFamily: F.mono, fontStyle: 'normal', letterSpacing: 5, color: P.paperDim, marginTop: 18}}>by @professorfungi · made with Suno</div></div></AbsoluteFill>}
    </AbsoluteFill>
  );
};
