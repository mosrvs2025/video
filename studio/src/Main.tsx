import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, W, H, Edit, Seg, Timeline, buildTimeline, srcState, setTheme, isVertical, trackBox, clamp, lerp, smooth, easeInCubic, easeOutCubic} from './lib';
import {Grain} from './ui';
import {ChapterSystem, LogoPill, HudOverlays, CamOverlays, ClipCaptions, EndCard, HeaderCover, CapsV2, TimelineBar, ChapterBanner} from './overlays';

const KF: Record<string, number> = {whip: 6, zoom: 8, flash: 5, wave: 0, none: 0};

const SegLayer: React.FC<{seg: Seg; edit: Edit; tl: Timeline; lite?: boolean}> = ({seg, edit, tl, lite}) => {
  const lf = (useCurrentFrame());
  const prev = seg.i > 0 ? tl.segs[seg.i - 1] : null;
  const kin = prev ? KF[prev.trans] : 0, kout = KF[seg.trans] || 0;
  const tin = prev && kin && lf < kin ? 1 - lf / kin : 0;
  const tout = kout && seg.nf - lf <= kout ? 1 - (seg.nf - lf - 1) / kout : 0;
  let tx = 0, sc = 1, bx = 0, by = 0, ca = 0, op = 1, br = 1;
  const apply = (kind: string, e: number, sign: number) => {
    if (kind === 'whip') { tx = e * W * 0.9 * sign; bx = e * 40; ca = e * 14; }
    if (kind === 'zoom') { sc = 1 + e * 0.7; bx = e * 18; by = e * 18; ca = e * 10; op = 1 - e * 0.6; }
    if (kind === 'flash') { br = 1 + e * 1.6; ca = e * 8; }
  };
  if (tin > 0 && prev) apply(prev.trans, 1 - easeOutCubic(1 - tin), 1);
  if (tout > 0) apply(seg.trans, easeInCubic(tout), -1);
  const id = `fx${seg.i}`; const heavy = bx > 0 || ca > 0;
  const meta = edit.clips[seg.clip]; const vert = isVertical(meta); const ar = meta.w / meta.h;
  const vid = (style: React.CSSProperties) => <OffthreadVideo src={staticFile(meta.file)} startFrom={Math.round(seg.in * FPS)} playbackRate={seg.rate} muted style={style} />;
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
          <feBlend in="ca" in2="glow" mode="screen" />
        </filter>
        <filter id={`${id}b`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 -0.66  0 1 0 0 -0.66  0 0 1 0 -0.66  0 0 0 1 0" result="hi" />
          <feGaussianBlur in="hi" stdDeviation="22" result="glow" />
          <feBlend in="SourceGraphic" in2="glow" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{transform: `translateX(${tx}px) scale(${sc})`, filter: lite && !heavy ? `contrast(1.07) saturate(1.16) brightness(${br})` : `url(#${heavy ? id : id + 'b'}) contrast(1.07) saturate(1.16) brightness(${br})`}}>
        {vert ? vid({width: W, height: H, objectFit: 'cover', objectPosition: `50% ${(meta.fy ?? 0.5) * 100}%`}) : (
          <>
            <AbsoluteFill style={{filter: 'blur(36px) brightness(.55) saturate(1.3)', transform: 'scale(1.3)'}}>{vid({width: W, height: H, objectFit: 'cover'})}</AbsoluteFill>
            <div style={{position: 'absolute', left: 0, top: (H - W / ar) / 2, width: W, height: W / ar, boxShadow: '0 0 80px rgba(0,0,0,.5)'}}>{vid({width: '100%', height: '100%', objectFit: 'cover'})}</div>
          </>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const WaveWipe: React.FC<{frame: number; tl: Timeline}> = ({frame, tl}) => {
  const b = tl.segs.find((s) => s.trans === 'wave'); if (!b) return null;
  const at = b.sf + b.nf; const u = (frame - (at - 15)) / 30; if (u < 0 || u > 1) return null;
  const e = smooth(u), BAND = 2300, lead = H - e * (H + BAND);
  const path = `M0 ${lead} ` + Array.from({length: 28}).map((_, i) => `L${i * 40 + 40} ${lead + Math.sin(i * 0.9 + frame * 0.5) * 26}`).join(' ') + ` L${W} ${lead + BAND} L0 ${lead + BAND} Z`;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs><linearGradient id="wv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="0.07" stopColor="#bff7ff" /><stop offset="0.3" stopColor="#19d3c5" /><stop offset="1" stopColor="#0a6f94" /></linearGradient></defs>
      <path d={path} fill="url(#wv)" />
    </svg>
  );
};

export const Main: React.FC<{edit: Edit; lite?: boolean}> = ({edit, lite}) => {
  setTheme(edit.theme);
  const frame = useCurrentFrame();
  const tl = useMemo(() => buildTimeline(edit), [edit]);
  const S = srcState(tl, frame); const t = frame / FPS;
  const inEnd = frame >= tl.cut; const elt = (frame - tl.cut) / FPS;
  // camera: slow push, optional follow of a tracked subject, beat pulse
  let s = 1, ox = W / 2, oy = H * 0.5;
  if (S.seg) {
    const k = S.lt / Math.max(0.1, S.seg.nf / FPS); s = edit.flags.push === false ? 1 : 1 + 0.06 * smooth(k);
    if (S.seg.follow) { const b = trackBox(edit, S.seg.follow, S.ct); if (b) { s = 1.25 + 0.1 * smooth(k); ox = b.x; oy = b.y; } }
    if (edit.flags.beatPulse) { const bt = tl.beatsOut.filter((b) => b <= t).slice(-1)[0]; if (bt !== undefined) s += 0.022 * Math.exp(-(t - bt) * 9); }
  }
  // bar-flash on downbeats (every 4th beat) in music modes
  let barFlash = 0;
  if (edit.flags.beatPulse) { const idx = tl.beatsOut.findIndex((b) => b > t) - 1; if (idx >= 0 && idx % 4 === 0) barFlash = 0.16 * Math.exp(-(t - tl.beatsOut[idx]) * 10); }
  const fadeIn = easeOutCubic(frame / 12), fadeOut = clamp((tl.total - frame) / 14);
  const kind = S.clip ? edit.clips[S.clip].kind : 'speech';
  const tint = kind === 'music' ? `linear-gradient(180deg, ${edit.theme.accent2}22, ${edit.theme.cool}1f)` : 'linear-gradient(180deg, rgba(255,190,100,.11), rgba(60,170,220,.09))';
  const ctx = {edit, tl, S, frame};
  const slow = S.seg && S.seg.rate < 1 ? easeOutCubic(S.lt / 0.5) : 0;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(120deg,#ff8a3d,#ffcf5a 40%,#4cc9f0)', opacity: fadeIn * fadeOut}}>
      <AbsoluteFill style={{transformOrigin: `${ox}px ${oy}px`, transform: `scale(${s})`}}>
        {tl.segs.map((sg) => <Sequence key={sg.i} from={sg.sf} durationInFrames={sg.nf}><SegLayer seg={sg} edit={edit} tl={tl} lite={lite} /></Sequence>)}
        {S.seg && <CamOverlays {...ctx} />}
      </AbsoluteFill>
      <AbsoluteFill style={{background: tint, mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 52%, rgba(0,0,0,.45) 100%)'}} />
      {!lite && <Grain frame={frame} />}
      {S.seg && (edit.flags.light ? <>
        <HeaderCover edit={edit} S={S} />
        <TimelineBar {...ctx} frame={frame} />
        <ChapterBanner {...ctx} frame={frame} />
        <HudOverlays {...ctx} />
        <CapsV2 {...ctx} />
      </> : <>
        <HeaderCover edit={edit} S={S} />
        <LogoPill t={t} title={edit.brand || edit.title} />
        <HudOverlays {...ctx} />
        <ClipCaptions {...ctx} />
        <ChapterSystem {...ctx} />
        {slow > 0 && <>
          <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 250 * slow, background: '#000'}} />
          <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: 250 * slow, background: '#000'}} />
          <div style={{position: 'absolute', left: 0, width: W, bottom: 96, textAlign: 'center', opacity: slow}}><span style={{fontFamily: 'monospace', fontSize: 30, letterSpacing: 14, color: edit.theme.accent}}>SLOW MOTION  {S.seg.rate.toFixed(1)}×</span></div>
        </>}
      </>)}
      <WaveWipe frame={frame} tl={tl} />
      {barFlash > 0.002 && <AbsoluteFill style={{background: '#fff', opacity: barFlash, mixBlendMode: 'overlay'}} />}
      {inEnd && edit.endCard > 0 && <EndCard edit={edit} lt={elt} />}
    </AbsoluteFill>
  );
};
