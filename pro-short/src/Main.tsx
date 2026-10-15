import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, W, H, SEGS, TOTAL, CUT_FRAMES, srcState, SrcState, bassAt, easeInCubic, easeOutCubic, clamp, lerp, smooth, interp, markAt, gullAt, Seg, SUN, AQUA, CORAL} from './lib';
import {Grain, Burst, Confetti} from './ui';
import {ChapterSystem, LogoPill, RouteBar, Equalizer, RoadHUD, RoadCam, BeachHUD, BeachCam, SurfHUD, SurfCam, ReplayPiP, ClipCaptions, EndCard, GullHUD, GullCam} from './acts';

export {FPS, TOTAL};

const KF: Record<string, number> = {whip: 6, zoom: 8, flash: 5, wave: 0, none: 0};

// ---------------- transitions (applied to each segment layer) ----------------
const transFor = (seg: Seg, lf: number) => {
  const prev = seg.i > 0 ? SEGS[seg.i - 1] : null;
  const kin = prev ? KF[prev.trans] : 0, kout = KF[seg.trans];
  const tin = prev && kin && lf < kin ? 1 - lf / kin : 0;
  const tout = kout && seg.nf - lf <= kout ? 1 - (seg.nf - lf - 1) / kout : 0;
  return {tin, tout};
};

const SegLayer: React.FC<{seg: Seg; lite?: boolean; bloom?: boolean}> = ({seg, lite, bloom = true}) => {
  const lf = useCurrentFrame();
  const {tin, tout} = transFor(seg, lf);
  const prevT = seg.i > 0 ? SEGS[seg.i - 1].trans : 'none';
  let tx = 0, sc = 1, bx = 0, by = 0, ca = 0, op = 1, br = 1;
  const apply = (kind: string, e: number) => {
    if (kind === 'whip') { tx = e * W * 0.9 * (sign); bx = e * 40; ca = e * 14; }
    if (kind === 'zoom') { sc = 1 + e * 0.7; bx = e * 18; by = e * 18; ca = e * 10; op = 1 - e * 0.6; }
    if (kind === 'flash') { br = 1 + e * 1.6; ca = e * 8; }
  };
  let sign = 1;
  if (tin > 0) { sign = 1; apply(prevT, 1 - easeOutCubic(1 - tin)); }
  if (tout > 0) { sign = -1; apply(seg.trans, easeInCubic(tout)); }
  const id = `fx${seg.i}`;
  const flt = ['whip', 'zoom', 'flash'].includes(tin > 0 ? prevT : seg.trans);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={`${bx.toFixed(1)} ${by.toFixed(1)}`} result="s" />
          <feColorMatrix in="s" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="r" dx={ca.toFixed(1)} result="r2" /><feOffset in="b" dx={(-ca).toFixed(1)} result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="b2" mode="screen" result="ca" />
          <feColorMatrix in="ca" type="matrix" values="1 0 0 0 -0.66  0 1 0 0 -0.66  0 0 1 0 -0.66  0 0 0 1 0" result="hi" />
          <feGaussianBlur in="hi" stdDeviation="22" result="glow" />
          <feComponentTransfer in="glow" result="glow2"><feFuncR type="linear" slope="1.1" /><feFuncG type="linear" slope="1.0" /><feFuncB type="linear" slope="0.9" /></feComponentTransfer>
          <feBlend in="ca" in2="glow2" mode="screen" />
        </filter>
      </svg>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={`${id}b`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 -0.66  0 1 0 0 -0.66  0 0 1 0 -0.66  0 0 0 1 0" result="hi" />
          <feGaussianBlur in="hi" stdDeviation="22" result="glow" />
          <feBlend in="SourceGraphic" in2="glow" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{transform: `translateX(${tx}px) scale(${sc})`, filter: (lite || !bloom) && !(bx || ca) ? `contrast(1.07) saturate(1.16) brightness(${br})` : `url(#${bx || ca ? id : id + 'b'}) contrast(1.07) saturate(1.16) brightness(${br})`}}>
        <OffthreadVideo src={staticFile(seg.file)} startFrom={Math.round(seg.in * FPS)} playbackRate={seg.rate} muted style={{width: W, height: H, objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------- camera ----------------
const S_KEYS: [number, number, number, number, number][] = [
  [0, 1.0, .5, .42, 0], [1.45, 1.07, .5, .42, 0], [1.5, 1.0, .5, .5, 0], [5.2, 1.0, .5, .5, 0], [7.5, 1.3, .5, .5, 1], [13.5, 1.5, .5, .5, 1],
  [17.5, 1.55, .5, .5, 1], [19.8, 1.6, .5, .5, 1], [20.3, 1.32, .5, .5, 1], [27, 1.3, .5, .5, 1], [35.6, 1.25, .5, .5, 1],
  [39.0, 1.3, .68, .45, 1], [39.7, 1.3, .68, .45, 0], [44.0, 1.42, .66, .46, 0], [45.6, 1.2, .62, .46, 0], [46.8, 1.7, .83, .46, 0], [48.8, 1.25, .62, .46, 0], [50.0, 1.0, .5, .5, 0],
  [52.2, 1.0, .5, .42, 0], [57.67, 1.09, .5, .42, 0],
];
const camera = (S: SrcState, frame: number) => {
  if (!S.seg) return {s: 1, ox: W / 2, oy: H / 2};
  const dur = S.seg.nf / FPS;
  if (S.clip === 'R' || S.clip === 'B') {
    const k = S.lt / dur;
    return {s: 1 + 0.07 * smooth(k) + 0.012 * bassAt(frame), ox: W / 2, oy: H * 0.55};
  }
  if (S.clip === 'G') {
    if (S.ct >= 82) {
      const [gs] = interp([[82.0, 1.2], [83.4, 1.4], [85.0, 1.65]] as [number, ...number[]][], S.ct);
      const g = gullAt(S.ct);
      return {s: gs, ox: g ? g.x : W / 2, oy: g ? g.y : H / 2};
    }
    return {s: 1 + 0.08 * smooth(S.lt / dur), ox: W / 2, oy: H * 0.5};
  }
  const [s, fx, fy, follow] = interp(S_KEYS as [number, ...number[]][], S.ct);
  const m = markAt(S.ct);
  const w = m ? follow : 0;
  return {s, ox: lerp(fx * W, m ? m.x : fx * W, w), oy: lerp(fy * H, m ? m.y : fy * H, w)};
};

// ---------------- wave wipe (road -> beach) ----------------
const WaveWipe: React.FC<{frame: number}> = ({frame}) => {
  const b = SEGS[4].sf + SEGS[4].nf; // boundary
  const u = (frame - (b - 15)) / 30; if (u < 0 || u > 1) return null;
  const e = smooth(u), BAND = 2300, lead = H - e * (H + BAND);
  const path = `M0 ${lead} ` + Array.from({length: 28}).map((_, i) => `L${i * 40 + 40} ${lead + Math.sin(i * 0.9 + frame * 0.5) * 26}`).join(' ') + ` L${W} ${lead + BAND} L0 ${lead + BAND} Z`;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs><linearGradient id="wv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="0.07" stopColor="#bff7ff" /><stop offset="0.3" stopColor="#19d3c5" /><stop offset="1" stopColor="#0a6f94" /></linearGradient></defs>
      <path d={path} fill="url(#wv)" />
      {Array.from({length: 40}).map((_, i) => { const a = (i * 37) % W, y = lead + 20 + ((i * 91) % 160); return <circle key={i} cx={a} cy={y} r={6 + (i % 5) * 3} fill="#fff" opacity={0.7} />; })}
    </svg>
  );
};

// ---------------- main ----------------
export const Main: React.FC<{lite?: boolean; bloom?: boolean; grain?: boolean}> = ({lite, bloom = true, grain = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const S = srcState(frame);
  const {s, ox, oy} = camera(S, frame);
  const inEnd = frame >= CUT_FRAMES;
  const elt = (frame - CUT_FRAMES) / FPS;
  const R1 = SEGS[4].sf + SEGS[4].nf; // road act frames
  const pRoute = Math.min(1, 0.93 * clamp(frame / (R1 - 60)) + 0.07 * smooth((frame - (R1 - 120)) / 90));
  const fadeIn = easeOutCubic(frame / 12), fadeOut = clamp((TOTAL - frame) / 14);
  const clip = S.clip;
  const tint = clip === 'G' ? 'linear-gradient(180deg, rgba(255,200,110,.12), rgba(255,140,60,.10))' : clip === 'R' ? 'linear-gradient(180deg, rgba(255,170,60,.13), rgba(255,90,74,.10))' : clip === 'S' ? 'linear-gradient(180deg, rgba(60,170,220,.10), rgba(255,200,120,.08))' : 'linear-gradient(180deg, rgba(255,200,120,.10), rgba(60,200,220,.10))';

  return (
    <AbsoluteFill style={{background: 'linear-gradient(120deg,#ff8a3d,#ffcf5a 40%,#4cc9f0)', opacity: fadeIn * fadeOut}}>
      <AbsoluteFill style={{transformOrigin: `${ox}px ${oy}px`, transform: `scale(${s})`}}>
        {SEGS.map((sg) => <Sequence key={sg.i} from={sg.sf} durationInFrames={sg.nf}><SegLayer seg={sg} lite={lite} bloom={bloom} /></Sequence>)}
        <Sequence from={CUT_FRAMES}>
          <Freeze frame={0}><OffthreadVideo src={staticFile('gull.mp4')} startFrom={Math.round(84.9 * FPS)} muted style={{width: W, height: H, objectFit: 'cover'}} /></Freeze>
        </Sequence>
        {clip === 'R' && <RoadCam t={S.ct} frame={frame} />}
        {clip === 'B' && <BeachCam t={S.ct} frame={frame} />}
        {clip === 'S' && <SurfCam t={S.ct} frame={frame} />}
        {clip === 'G' && <GullCam t={S.ct} frame={frame} />}
      </AbsoluteFill>

      <AbsoluteFill style={{background: tint, mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 52%, rgba(0,0,0,.45) 100%)'}} />
      {!lite && grain && <Grain frame={frame} />}

      {/* HUD */}
      {clip === 'R' && <>
        <RoadHUD t={S.ct} frame={frame} />
        <Burst x={540} y={640} r={230} text="ARRIVED!" t={S.ct} a={45.6} b={46.8} rot={-6} />
        <RouteBar p={pRoute} frame={frame} />
        {S.ct < 3.7 ? null : null}
        <Equalizer frame={frame} label="♪ ON THE RADIO" />
      </>}
      {clip === 'B' && <><LogoPill t={t} /><BeachHUD t={S.ct} frame={frame} /><Equalizer frame={frame} label="≋ SURF" /></>}
      {clip === 'S' && <><LogoPill t={t} /><SurfHUD t={S.ct} frame={frame} /></>}
      {clip === 'G' && <><LogoPill t={t} /><GullHUD t={S.ct} frame={frame} /></>}
      {clip && <ClipCaptions clip={clip} ct={S.ct} />}
      {clip && <ChapterSystem clip={clip} ct={S.ct} />}
      {clip === 'S' && <ReplayPiP frame={frame} />}
      <WaveWipe frame={frame} />
      {inEnd && <EndCard lt={elt} />}
    </AbsoluteFill>
  );
};
