import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {W, H, FPS, NAVY, SUN, CORAL, AQUA, SKY, INK, SANS, MONO, clamp, lerp, easeOutExpo, easeOutCubic, easeOutBack, easeInCubic, easeInOutCubic, toScreen, trackBox, Edit, Timeline, SrcState} from './lib';
import {Kinetic, Glass, Captions, Burst, Pin, Brackets, Meter, Confetti, LightLeak, sp} from './ui';
import {Viz3D} from './Viz3D';

type Ctx = {edit: Edit; tl: Timeline; S: SrcState; frame: number};
const inWin = (o: any, S: SrcState) => o.clip === S.clip && S.ct >= o.a && S.ct < o.b;

// ---------- chapters ----------
export const ChapterSystem: React.FC<Ctx> = ({edit, S}) => {
  const list = edit.overlays.filter((o) => o.type === 'chapter' && o.clip === S.clip);
  const cur = [...list].reverse().find((c) => S.ct >= c.at);
  if (!cur) return null;
  const lt = S.ct - cur.at; const dock = easeOutCubic((lt - 1.45) / 0.55), inP = easeOutExpo(lt / 0.8);
  const big = cur.title.length > 10;
  return (
    <>
      {lt < 1.9 && (
        <div style={{position: 'absolute', left: 0, width: W, top: 760, opacity: 1 - easeInCubic((lt - 1.45) / 0.45), transform: `translateY(${-dock * 60}px)`}}>
          <Kinetic text={`CHAPTER ${cur.n}`} t={lt} a={0} x={W / 2} y={0} size={34} weight={600} font={MONO} tracking={16} color={SUN} stagger={0.02} dur={0.6} />
          <Kinetic text={cur.title} t={lt} a={0.12} x={W / 2} y={56} size={big ? 138 : 168} tracking={-5} stagger={0.03} dur={0.8} />
          <svg width={W} height={20} style={{position: 'absolute', left: 0, top: big ? 232 : 262}}><line x1={W / 2 - 280 * inP} x2={W / 2 + 280 * inP} y1={10} y2={10} stroke={SUN} strokeWidth={5} strokeLinecap="round" /></svg>
          {cur.sub && <Kinetic text={cur.sub} t={lt} a={0.5} x={W / 2} y={big ? 262 : 292} size={30} weight={500} font={MONO} tracking={10} color="rgba(255,255,255,.9)" stagger={0.015} dur={0.5} />}
        </div>
      )}
      <div style={{position: 'absolute', left: 50, top: (() => { const bar = edit.clips[S.clip!]?.bar; return bar ? Math.max(154, bar.y1 * H + 22) : 154; })(), opacity: dock, transform: `translateX(${(1 - dock) * -80}px)`}}>
        <Glass x={0} y={0} r={36} tint={`${CORAL}BB`} style={{position: 'relative', height: 70, padding: '0 30px 0 26px', display: 'flex', alignItems: 'center', gap: 14}}>
          <span style={{fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: SUN, fontWeight: 700}}>{cur.n}</span>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 1.5, color: '#fff'}}>{cur.title}</span>
        </Glass>
      </div>
    </>
  );
};

export const LogoPill: React.FC<{t: number; title: string}> = ({t, title}) => (
  <Glass x={50} y={52} r={34} style={{height: 66, padding: '0 28px 0 22px', display: 'flex', alignItems: 'center', gap: 14, maxWidth: 800}}>
    <svg width={34} height={34} viewBox="-20 -20 40 40"><circle r={9} fill={SUN} />{Array.from({length: 8}).map((_, i) => <line key={i} x1={0} y1={-13} x2={0} y2={-18} stroke={SUN} strokeWidth={3} strokeLinecap="round" transform={`rotate(${i * 45 + t * 20})`} />)}</svg>
    <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: '#fff', whiteSpace: 'nowrap'}}>{title.slice(0, 24)}</span>
  </Glass>
);

export const Equalizer: React.FC<{edit: Edit; frame: number; label: string}> = ({edit, frame, label}) => {
  const sp2 = edit.spectrum || []; const s = sp2[Math.min(frame, sp2.length - 1)] || new Array(20).fill(0.2);
  return (
    <svg width={W} height={170} style={{position: 'absolute', left: 0, top: H - 190}}>
      <defs><linearGradient id="eqg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={CORAL} /><stop offset="1" stopColor={SUN} /></linearGradient></defs>
      <text x={54} y={26} fontFamily={MONO} fontSize={22} fill="#fff" opacity={0.9} style={{letterSpacing: 8}}>{label}</text>
      {s.map((v, i) => { const h = 8 + v * 100; return <g key={i}><rect x={54 + i * 49} y={160 - h} width={32} height={h} rx={9} fill="url(#eqg)" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.35))'}} /><rect x={54 + i * 49} y={162} width={32} height={h * 0.18} rx={5} fill={CORAL} opacity={0.25} /></g>; })}
    </svg>
  );
};

// ---------- title ----------
const TitleCard: React.FC<{o: any; t: number}> = ({o, t}) => {
  const lt = t - o.a, out = 1 - easeInCubic((t - (o.b - 0.5)) / 0.5);
  const words = String(o.text).toUpperCase().split(' ').slice(0, 3);
  const size = words.length === 1 ? 300 : words.length === 2 ? 300 : 210;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      {words.map((w: string, i: number) => <Kinetic key={i} text={w} t={lt} a={0.05 + i * 0.25} x={W / 2} y={440 + i * (size * 0.85)} size={Math.min(size, 1000 / Math.max(3, w.length) * 1.7)} tracking={-10} color={i % 2 ? SUN : '#fff'} stagger={0.07} dur={0.9} shadow="0 14px 60px rgba(0,0,0,.45)" />)}
      {o.sub && <Kinetic text={o.sub} t={lt} a={1.0} x={W / 2} y={440 + words.length * size * 0.85 + 60} size={38} weight={500} font={MONO} tracking={14} stagger={0.02} dur={0.6} />}
    </div>
  );
};

// ---------- generic overlays ----------
const Alert: React.FC<{o: any; t: number}> = ({o, t}) => {
  const p = sp(t, o.a), blink = Math.floor(t * 6) % 2;
  return (
    <Glass x={160} y={o.y ?? 430} w={760} h={130} r={40} tint={blink ? 'rgba(255,60,50,.75)' : 'rgba(200,40,40,.7)'} style={{opacity: clamp((o.b - t) / 0.15) * clamp(p * 2), transform: `translateY(${(1 - p) * -50}px)`, display: 'flex', alignItems: 'center', gap: 24, padding: '0 36px'}}>
      <div><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 56, color: '#fff', letterSpacing: 1, lineHeight: 1}}>{o.text}</div>{o.sub && <div style={{fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: '#fff', marginTop: 8}}>{o.sub}</div>}</div>
    </Glass>
  );
};

const LowerThird: React.FC<{o: any; t: number}> = ({o, t}) => {
  const p = easeOutExpo((t - o.a) / 0.8), out = clamp((o.b - t) / 0.3);
  return (
    <Glass x={40} y={o.y ?? 1090} w={1000} h={190} r={44} tint={`${CORAL}99`} style={{opacity: out, transform: `translateX(${(1 - p) * -700}px)`, display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px', boxSizing: 'border-box'}}>
      <svg width={80} height={100} viewBox="0 0 80 100"><path d="M40 4 C18 4 6 20 6 38 C6 62 40 96 40 96 C40 96 74 62 74 38 C74 20 62 4 40 4 Z" fill={SUN} stroke="#fff" strokeWidth={5} /><circle cx={40} cy={38} r={14} fill={INK} /></svg>
      <div><div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: '#fff'}}>{o.kicker || ''}</div><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: -1, lineHeight: 1.05, whiteSpace: 'nowrap'}}>{o.title}</div></div>
    </Glass>
  );
};

const Ticker: React.FC<{o: any; t: number}> = ({o, t}) => {
  const msg = `  ●  ${o.text}  `; const off = -((t * 140) % 1300); const p = easeOutExpo((t - o.a) / 0.7);
  return (
    <Glass x={40} y={H - 150} w={1000} h={78} r={39} style={{overflow: 'hidden', opacity: p, transform: `translateY(${(1 - p) * 60}px)`}} tint="rgba(10,26,51,.6)">
      <div style={{position: 'absolute', whiteSpace: 'nowrap', left: off, top: 18, fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: '#fff', fontWeight: 700}}>{msg.repeat(6)}</div>
    </Glass>
  );
};

const Scoreboard: React.FC<{o: any; t: number}> = ({o, t}) => {
  const ev = (o.events || []) as {t: number; side: 'l' | 'r'}[];
  const l = ev.filter((e) => e.side === 'l' && t >= e.t).length, r = ev.filter((e) => e.side === 'r' && t >= e.t).length;
  const lt = Math.max(-9, ...ev.filter((e) => e.side === 'l' && t >= e.t).map((e) => e.t)), rt = Math.max(-9, ...ev.filter((e) => e.side === 'r' && t >= e.t).map((e) => e.t));
  const p = easeOutExpo((t - o.a) / 0.7);
  const Cell = (n: number, tt: number, label: string, color: string, rev: boolean) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, flexDirection: rev ? 'row-reverse' : 'row'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 2}}>{label}</div>
      <div style={{width: 84, height: 84, borderRadius: 22, background: `linear-gradient(135deg, ${color}, ${SUN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${20 + 40 * Math.max(0, 1 - (t - tt) * 2)}px ${color}`}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 62, color: INK, transform: `scale(${n ? 0.6 + 0.4 * easeOutBack((t - tt) / 0.5) : 1})`}}>{n}</div>
      </div>
    </div>
  );
  return (
    <Glass x={110} y={o.y ?? 250} w={860} h={112} r={56} style={{opacity: p * clamp((o.b - t) / 0.3), transform: `translateY(${(1 - p) * -40}px)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px', boxSizing: 'border-box'}} tint="rgba(10,26,51,.55)">
      {Cell(l, lt, o.left, CORAL, false)}<div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: SUN}}>VS</div>{Cell(r, rt, o.right, AQUA, true)}
    </Glass>
  );
};

const Replay: React.FC<{o: any; ctx: Ctx}> = ({o, ctx}) => {
  const {edit, tl, S, frame} = ctx; const seg = S.seg!; const meta = edit.clips[o.clip];
  const dur = Math.round((o.b - o.a) * FPS / (o.rate ? 1 : 1)); const t = (S.ct - o.a); const p = easeOutExpo((t + 0.05) / 0.5), out = clamp((o.b - S.ct) / 0.35);
  const from = frame - Math.round((S.ct - o.a) / seg.rate * FPS);
  return (
    <div style={{position: 'absolute', left: 40, top: 330, width: 400, height: 712, opacity: out * clamp(p * 2), transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: 'left top', borderRadius: 30, overflow: 'hidden', border: '3px solid #fff', boxShadow: `0 30px 70px rgba(0,0,0,.55), 0 0 0 6px ${CORAL}55`}}>
      <Sequence from={from} durationInFrames={Math.round(dur / (o.rate || 0.6)) + 12}>
        <OffthreadVideo src={staticFile(meta.file)} startFrom={Math.round(o.from * FPS)} playbackRate={o.rate || 0.6} muted style={{width: 400, height: 712, objectFit: 'cover', filter: 'contrast(1.1) saturate(1.2)'}} />
      </Sequence>
      <div style={{position: 'absolute', left: 14, top: 14, background: CORAL, borderRadius: 16, padding: '6px 16px', fontFamily: SANS, fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: 2}}>REPLAY</div>
      <div style={{position: 'absolute', right: 14, bottom: 14, fontFamily: MONO, fontSize: 22, color: SUN, letterSpacing: 3, fontWeight: 700}}>{(o.rate || 0.6).toFixed(1)}×</div>
    </div>
  );
};

export const HudOverlays: React.FC<Ctx> = (ctx) => {
  const {edit, S, frame} = ctx; const t = S.ct; const out: React.ReactNode[] = [];
  edit.overlays.forEach((o, k) => {
    if (o.clip && o.clip !== S.clip) return;
    const key = `${o.type}${k}`;
    switch (o.type) {
      case 'title': if (t >= o.a && t < o.b) out.push(<TitleCard key={key} o={o} t={t} />); break;
      case 'burst': out.push(<Burst key={key} x={(o.x ?? 0.74) * W} y={(o.y ?? 0.32) * H} r={o.r ?? 150} text={o.text} t={t} a={o.a} b={o.b} c1={o.c1} c2={o.c2} rot={o.rot} />); break;
      case 'meter': out.push(<Meter key={key} label={o.label} t={t} a={o.a} b={o.b} fillFrom={o.fillFrom ?? o.a + 0.2} fillDur={o.fillDur ?? 1.4} y={o.y ?? 420} color={o.color} endText={o.endText} />); break;
      case 'alert': if (t >= o.a && t < o.b) out.push(<Alert key={key} o={o} t={t} />); break;
      case 'lowerthird': if (t >= o.a && t < o.b) out.push(<LowerThird key={key} o={o} t={t} />); break;
      case 'ticker': if (t >= o.a && t < o.b) out.push(<Ticker key={key} o={o} t={t} />); break;
      case 'scoreboard': if (t >= o.a && t < o.b) out.push(<Scoreboard key={key} o={o} t={t} />); break;
      case 'confetti': out.push(<Confetti key={key} t={t} a={o.a} x={(o.x ?? 0.5) * W} y={(o.y ?? 0.5) * H} />); break;
      case 'flash': { const u = t - o.a; if (u >= 0 && u < 0.5) out.push(<div key={key} style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.8 * Math.exp(-u * 14)}} />); break; }
      case 'text': if (t >= o.a && t < o.b) out.push(<Kinetic key={key} text={o.text} t={t} a={o.a} x={W / 2} y={o.y ?? 900} size={o.size ?? 120} color={o.color ?? '#fff'} out={o.b - 0.3} />); break;
      case 'replay': if (t >= o.a && t < o.b) out.push(<Replay key={key} o={o} ctx={ctx} />); break;
      case 'viz3d': out.push(<Viz3D key={key} edit={edit} frame={frame} opacity={o.opacity ?? 0.4} />); break;
      case 'eq': out.push(<Equalizer key={key} edit={edit} frame={frame} label={o.label} />); break;
      case 'leak': out.push(<LightLeak key={key} t={t} a={o.a} dur={o.dur} color={o.color} dir={o.dir} />); break;
    }
  });
  return <>{out}</>;
};

// overlays that must stay glued to footage (inside the camera transform)
export const CamOverlays: React.FC<Ctx> = ({edit, S}) => {
  const t = S.ct; const out: React.ReactNode[] = [];
  edit.overlays.forEach((o, k) => {
    if (o.clip !== S.clip || t < o.a || t >= o.b) return;
    const m = edit.clips[o.clip];
    if (o.type === 'pin') {
      const [x, y] = o.track ? (() => { const b = trackBox(edit, o.track, t); return b ? [b.x, b.y] : [0, 0]; })() : toScreen(m, o.x, o.y);
      out.push(<Pin key={k} x={x} y={y} label={o.label} t={t} a={o.a} b={o.b} dx={o.dx} dy={o.dy} color={o.color} />);
    }
    if (o.type === 'brackets') {
      const b = o.track ? trackBox(edit, o.track, t) : (() => { const [x, y] = toScreen(m, o.x, o.y); return {x, y, w: (o.w ?? 0.3) * W, h: (o.h ?? 0.2) * H}; })();
      if (b) out.push(<Brackets key={k} x={b.x} y={b.y} w={Math.max(180, b.w * 1.9)} h={Math.max(220, b.h * 2.3)} color={o.color ?? SUN} label={o.label} sub={o.sub} t={t} lock={easeOutCubic((t - o.a) / 0.5)} />);
    }
  });
  return <>{out}</>;
};

export const ClipCaptions: React.FC<Ctx> = ({edit, S}) => {
  const caps = edit.overlays.filter((o) => o.type === 'caption' && o.clip === S.clip) as any[];
  return <Captions caps={caps} ct={S.ct} accent={SUN} y={1340} />;
};

// ---------- end card ----------
const Polaroid: React.FC<{t: number; a: number; edit: Edit; clip: string; at: number; x: number; y: number; rot: number; label: string}> = ({t, a, edit, clip, at, x, y, rot, label}) => {
  const p = sp(t, a, {damping: 11, mass: 0.8, stiffness: 120}); if (p <= 0) return null;
  const m = edit.clips[clip]; const PW = 330, PH = 420; const vert = Math.abs(m.w / m.h - 9 / 16) < 0.12;
  return (
    <div style={{position: 'absolute', left: x - PW / 2, top: y - PH / 2 + (1 - p) * 1000, width: PW, height: PH, background: '#fffdf6', padding: 14, boxSizing: 'border-box', transform: `rotate(${rot + (1 - p) * 24}deg)`, boxShadow: '0 22px 50px rgba(0,0,0,.5)'}}>
      <div style={{position: 'absolute', left: PW / 2 - 60, top: -18, width: 120, height: 36, background: 'rgba(255,220,120,.7)', transform: 'rotate(-3deg)'}} />
      <div style={{position: 'relative', width: PW - 28, height: PH - 90, overflow: 'hidden', background: '#000'}}>
        <Freeze frame={Math.round(at * m.fps)}>
          <OffthreadVideo src={staticFile(m.file)} muted style={vert ? {position: 'absolute', left: (PW - 28) / 2 - 270, top: (PH - 90) / 2 - 480, width: 540, height: 960, objectFit: 'cover'} : {width: '100%', height: '100%', objectFit: 'cover'}} />
        </Freeze>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 900, color: NAVY, fontSize: 30, textAlign: 'center', marginTop: 14, letterSpacing: 1}}>{label}</div>
    </div>
  );
};
export const EndCard: React.FC<{edit: Edit; lt: number}> = ({edit, lt}) => {
  const bg = easeOutCubic(lt / 0.5); const pol = edit.end.polaroids.slice(0, 4);
  const pos = [[290, 820, -6], [790, 860, 5], [290, 1300, 4], [790, 1340, -5]];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${NAVY}${Math.round(0.8 * bg * 255).toString(16).padStart(2, '0')}, rgba(255,120,60,${0.55 * bg}))`, backdropFilter: `blur(${bg * 18}px)`}} />
      <Kinetic text={edit.end.title.toUpperCase().split(' ').slice(0, 2).join(' ')} t={lt} a={0.1} x={W / 2} y={190} size={170} tracking={-8} stagger={0.04} dur={0.6} />
      {edit.end.subtitle && <Kinetic text={edit.end.subtitle} t={lt} a={0.4} x={W / 2} y={420} size={34} weight={500} font={MONO} tracking={14} color={SUN} stagger={0.015} dur={0.5} />}
      {pol.map((p: any, i: number) => <Polaroid key={i} t={lt} a={0.2 + i * 0.2} edit={edit} clip={p.clip} at={p.t} x={pos[i][0]} y={pos[i][1]} rot={pos[i][2]} label={p.label} />)}
      {edit.end.footer && <Glass x={110} y={1590} w={860} h={120} r={60} style={{opacity: easeOutExpo((lt - 1.3) / 0.5), display: 'flex', alignItems: 'center', justifyContent: 'center'}} tint="rgba(10,26,51,.5)"><span style={{fontFamily: SANS, fontWeight: 900, fontSize: 48, color: '#fff'}}>{edit.end.footer}</span></Glass>}
      <Confetti t={lt} a={0.2} dur={2.6} x={W / 2} y={560} />
    </AbsoluteFill>
  );
};

/** Covers a burned-in caption bar (e.g. Snapchat) with a styled header; shows the original caption text restyled. */
export const HeaderCover: React.FC<{edit: Edit; S: SrcState}> = ({edit, S}) => {
  const m = S.clip ? edit.clips[S.clip] : null; if (!m || !m.bar || Math.abs(m.w / m.h - 9 / 16) > 0.12) return null;
  const h = m.bar.y1 * H + 14;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: h + 40, background: `linear-gradient(180deg, ${NAVY}F5 0%, ${NAVY}F2 ${Math.round(h / (h + 40) * 100)}%, ${NAVY}00 100%)`}}>
      {m.bar_text && <div style={{position: 'absolute', left: 40, width: W - 80, top: (m.bar.y0 + m.bar.y1) / 2 * H - 20, textAlign: 'center', fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: 'rgba(255,255,255,.92)', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{m.bar_text}</div>}
    </div>
  );
};
