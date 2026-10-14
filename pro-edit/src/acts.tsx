import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {W, H, FPS, NAVY, SUN, CORAL, AQUA, SKY, INK, SANS, MONO, clamp, lerp, rnd, noise, easeOutExpo, easeOutCubic, easeOutBack, easeInCubic, easeInOutCubic, smooth, interp, markAt, SPECTRUM, SEGS, mixHex} from './lib';
import {Kinetic, Glass, Captions, Burst, Pin, Brackets, Meter, Confetti, LightLeak, sp} from './ui';
import {CAPS_R, CAPS_B, CAPS_S, CHAPS, Chap} from './data';

type A = {t: number; frame: number};  // t = source time (sec) within the current clip

// =============== shared HUD ===============
export const ChapterSystem: React.FC<{clip: 'R' | 'B' | 'S'; ct: number}> = ({clip, ct}) => {
  const list = CHAPS.filter((c) => c.c === clip);
  const cur = [...list].reverse().find((c) => ct >= c.at);
  if (!cur) return null;
  const lt = ct - cur.at;
  const card = lt < 1.9 ? 1 : 0;
  const dock = easeOutCubic((lt - 1.45) / 0.55);
  const inP = easeOutExpo(lt / 0.8);
  return (
    <>
      {/* big card */}
      {card > 0 && (
        <div style={{position: 'absolute', left: 0, width: W, top: 760, opacity: 1 - easeInCubic((lt - 1.45) / 0.45), transform: `translateY(${-dock * 60}px)`}}>
          <Kinetic text={`CHAPTER ${cur.n}`} t={lt} a={0} x={W / 2} y={0} size={34} weight={600} font={MONO} tracking={16} color={SUN} stagger={0.02} dur={0.6} />
          <Kinetic text={cur.title} t={lt} a={0.12} x={W / 2} y={56} size={cur.title.length > 10 ? 138 : 168} tracking={-5} stagger={0.03} dur={0.8} />
          <svg width={W} height={20} style={{position: 'absolute', left: 0, top: cur.title.length > 10 ? 232 : 262}}>
            <line x1={W / 2 - 280 * inP} x2={W / 2 + 280 * inP} y1={10} y2={10} stroke={SUN} strokeWidth={5} strokeLinecap="round" />
          </svg>
          <Kinetic text={cur.sub} t={lt} a={0.5} x={W / 2} y={cur.title.length > 10 ? 262 : 292} size={30} weight={500} font={MONO} tracking={10} color="rgba(255,255,255,.9)" stagger={0.015} dur={0.5} />
        </div>
      )}
      {/* docked chip */}
      <div style={{position: 'absolute', left: 50, top: 154, opacity: dock, transform: `translateX(${(1 - dock) * -80}px)`}}>
        <Glass x={0} y={0} r={36} tint="rgba(255,90,74,.75)" style={{position: 'relative', height: 70, padding: '0 30px 0 26px', display: 'flex', alignItems: 'center', gap: 14}}>
          <span style={{fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: SUN, fontWeight: 700}}>{cur.n}</span>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 1.5, color: '#fff'}}>{cur.title}</span>
        </Glass>
      </div>
    </>
  );
};

export const LogoPill: React.FC<{t: number}> = ({t}) => (
  <Glass x={50} y={52} r={34} style={{height: 66, padding: '0 28px 0 22px', display: 'flex', alignItems: 'center', gap: 14}}>
    <svg width={34} height={34} viewBox="-20 -20 40 40"><circle r={9} fill={SUN} />{Array.from({length: 8}).map((_, i) => <line key={i} x1={0} y1={-13} x2={0} y2={-18} stroke={SUN} strokeWidth={3} strokeLinecap="round" transform={`rotate(${i * 45 + t * 20})`} />)}</svg>
    <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: '#fff'}}>ROAD TRIP</span>
    <span style={{fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: SUN}}>MALIBU</span>
  </Glass>
);

export const RouteBar: React.FC<{p: number; frame: number}> = ({p, frame}) => {
  const x0 = 130, x1 = 930, cx = lerp(x0, x1, p);
  return (
    <Glass x={40} y={44} w={1000} h={84} r={42}>
      <svg width={1000} height={84} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={x0 - 40} y1={42} x2={x1 - 40} y2={42} stroke="rgba(255,255,255,.35)" strokeWidth={6} strokeDasharray="2 14" strokeLinecap="round" />
        <line x1={x0 - 40} y1={42} x2={cx - 40} y2={42} stroke={SUN} strokeWidth={6} strokeLinecap="round" style={{filter: `drop-shadow(0 0 8px ${SUN})`}} />
        {[0.2, 0.4, 0.6, 0.8].map((q, i) => <circle key={i} cx={lerp(x0, x1, q) - 40} cy={42} r={6} fill={p > q ? SUN : 'rgba(255,255,255,.5)'} />)}
        <circle cx={x0 - 40} cy={42} r={11} fill="#fff" />
        <g transform={`translate(${cx - 40} 38)`}>
          <rect x={-30} y={-14} width={60} height={24} rx={11} fill={CORAL} stroke="#fff" strokeWidth={3} />
          <rect x={-15} y={-26} width={32} height={15} rx={7} fill={SKY} stroke="#fff" strokeWidth={3} />
          <circle cx={-16} cy={11} r={8} fill={NAVY} stroke="#fff" strokeWidth={3} /><circle cx={17} cy={11} r={8} fill={NAVY} stroke="#fff" strokeWidth={3} />
        </g>
        <circle cx={x1 + 30} cy={40} r={19} fill={SUN} stroke="#fff" strokeWidth={3} />
        <path d={`M${x1 + 6} 54 q12 -12 24 0 t24 0`} fill="none" stroke={SKY} strokeWidth={5} strokeLinecap="round" />
        <text x={x0 - 40} y={20} textAnchor="middle" fontFamily={MONO} fontSize={15} fill="#fff" style={{letterSpacing: 3}}>START</text>
        <text x={x1 + 30} y={20} textAnchor="middle" fontFamily={MONO} fontSize={15} fill={SUN} style={{letterSpacing: 3}}>BEACH</text>
      </svg>
    </Glass>
  );
};

export const Equalizer: React.FC<{frame: number; label: string}> = ({frame, label}) => {
  const s = SPECTRUM[Math.min(frame, SPECTRUM.length - 1)];
  return (
    <svg width={W} height={170} style={{position: 'absolute', left: 0, top: H - 190}}>
      <defs><linearGradient id="eqg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={CORAL} /><stop offset="1" stopColor={SUN} /></linearGradient></defs>
      <text x={54} y={26} fontFamily={MONO} fontSize={22} fill="#fff" opacity={0.9} style={{letterSpacing: 8}}>{label}</text>
      {s.map((v, i) => {
        const h = 8 + v * 100;
        return <g key={i}><rect x={54 + i * 49} y={160 - h} width={32} height={h} rx={9} fill="url(#eqg)" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.35))'}} /><rect x={54 + i * 49} y={162} width={32} height={h * 0.18} rx={5} fill={CORAL} opacity={0.25} /></g>;
      })}
    </svg>
  );
};

// =============== ROAD ===============
export const RoadHUD: React.FC<A> = ({t, frame}) => {
  const bass = (SPECTRUM[Math.min(frame, SPECTRUM.length - 1)].slice(0, 4).reduce((a, b) => a + b, 0)) / 4;
  const sing = t >= 12.0 && t < 17.0;
  return (
    <>
      <LightLeak t={t} a={0.0} dur={1.2} />
      {/* title */}
      {t < 3.7 && (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - easeInCubic((t - 3.2) / 0.5)}}>
          <Kinetic text="ROAD" t={t} a={0.25} x={W / 2} y={440} size={300} tracking={-12} stagger={0.07} dur={0.9} shadow="0 14px 60px rgba(0,0,0,.45)" />
          <Kinetic text="TRIP" t={t} a={0.5} x={W / 2} y={700} size={300} tracking={-12} color={SUN} stagger={0.07} dur={0.9} shadow="0 14px 60px rgba(0,0,0,.45)" />
          <svg width={W} height={30} style={{position: 'absolute', left: 0, top: 1020}}>
            <line x1={W / 2 - 330 * easeOutExpo((t - 1.0) / 0.8)} x2={W / 2 + 330 * easeOutExpo((t - 1.0) / 0.8)} y1={14} y2={14} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          </svg>
          <Kinetic text="A DAY AT THE BEACH" t={t} a={1.2} x={W / 2} y={1050} size={38} weight={500} font={MONO} tracking={14} stagger={0.02} dur={0.6} color="#fff" />
        </div>
      )}
      <Burst x={800} y={760} r={150} text="YEAH!" t={t} a={6.9} b={8.1} c1="#6ff2e6" c2={AQUA} rot={8} />
      <Burst x={850} y={600} r={175} text="WOW!" t={t} a={11.0} b={12.4} />
      {/* name tags */}
      {t >= 11.45 && t < 17.3 && <NameTag t={t} a={11.45} b={17.3} name="COPILOT" sub={sing ? 'SING-ALONG MODE' : 'VIBES: ON'} color={AQUA} y={1085} />}
      {t >= 17.5 && t < 21.3 && <NameTag t={t} a={17.5} b={21.3} name="MARK" sub="DRIVER · EYES ON THE ROAD" color={CORAL} y={1085} />}
      {sing && Array.from({length: 7}).map((_, i) => {
        const u = ((t - 12 + i * 0.7) * 0.22) % 1;
        return <MusicNote key={i} x={130 + i * 135 + Math.sin(t * 2 + i) * 30} y={1280 - u * 900} s={1 + bass * 0.5} rot={Math.sin(t * 3 + i) * 15} color={[SUN, CORAL, AQUA][i % 3]} o={Math.sin(Math.PI * u)} />;
      })}
      <Meter label="CHILL LEVEL" t={t} a={21.7} b={24.0} fillFrom={22.0} fillDur={1.4} y={420} />
      <BeachCard t={t} a={24.3} b={27.2} />
    </>
  );
};

const NameTag: React.FC<{t: number; a: number; b: number; name: string; sub: string; color: string; y: number}> = ({t, a, b, name, sub, color, y}) => {
  const p = easeOutExpo((t - a) / 0.6), o = clamp((b - t) / 0.25);
  return (
    <Glass x={50 - (1 - p) * 520} y={y} r={40} tint={`${color}AA`} style={{opacity: o, height: 136, padding: '0 40px 0 26px', display: 'flex', alignItems: 'center', gap: 24}}>
      <div style={{width: 84, height: 84, borderRadius: 42, background: `linear-gradient(135deg, ${color}, ${SUN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 44, color: INK, boxShadow: `0 0 30px ${color}`}}>{name[0]}</div>
      <div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 56, color: '#fff', letterSpacing: 1, lineHeight: 1}}>{name}</div>
        <div style={{fontFamily: MONO, fontSize: 21, letterSpacing: 5, color: '#fff', opacity: 0.85, marginTop: 8}}>{sub}</div>
      </div>
    </Glass>
  );
};

const MusicNote: React.FC<{x: number; y: number; s: number; rot: number; color: string; o: number}> = ({x, y, s, rot, color, o}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} style={{filter: `drop-shadow(0 6px 10px rgba(0,0,0,.4))`}}>
      <ellipse rx={22} ry={16} fill={color} stroke="#fff" strokeWidth={4} transform="rotate(-20)" />
      <path d="M18 -6 L18 -80 Q50 -64 46 -40" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
      <path d="M18 -6 L18 -80 Q50 -64 46 -40" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </g>
  </svg>
);

const BeachCard: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
  if (t < a || t > b) return null;
  const p = sp(t, a, {damping: 11, mass: 0.7, stiffness: 160}), o = clamp((b - t) / 0.3);
  const shine = easeInOutCubic((t - a - 0.4) / 0.8);
  return (
    <Glass x={110} y={400} w={860} h={250} r={56} tint="rgba(76,201,240,.5)" style={{opacity: o * clamp(p * 2), transform: `scale(${0.7 + 0.3 * p}) rotate(${-3 + 3 * p}deg)`, overflow: 'hidden'}}>
      <svg width={860} height={250} style={{position: 'absolute', inset: 0}}>
        <circle cx={730} cy={88} r={50} fill={SUN} style={{filter: `drop-shadow(0 0 26px ${SUN})`}} />
        <g transform="translate(120 220)">
          <path d="M0 0 Q-14 -90 6 -170" fill="none" stroke="#8a5a2b" strokeWidth={14} strokeLinecap="round" />
          {[-70, -35, 0, 35, 70].map((a2, i) => <path key={i} transform={`translate(6 -170) rotate(${a2 + Math.sin(t * 2 + i) * 4})`} d="M0 0 Q40 -50 100 -10 Q50 -20 0 0 Z" fill="#22b36b" stroke="#fff" strokeWidth={3} />)}
        </g>
        <path d={`M0 215 ${Array.from({length: 19}).map((_, i) => `q23 -${14 + 6 * Math.sin(t * 3 + i)} 46 0`).join(' ')}`} fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
      </svg>
      <div style={{position: 'absolute', left: 250, top: 26, fontFamily: MONO, fontSize: 28, letterSpacing: 12, color: '#fff'}}>DESTINATION</div>
      <div style={{position: 'absolute', left: 250, top: 60, fontFamily: SANS, fontWeight: 900, fontSize: 150, color: '#fff', letterSpacing: -4, textShadow: '0 10px 30px rgba(0,0,0,.35)'}}>BEACH</div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: lerp(-300, 1000, shine), width: 160, background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent)', transform: 'skewX(-20deg)'}} />
    </Glass>
  );
};

// camera-space overlays (pins/brackets that must stay glued to footage)
export const RoadCam: React.FC<A> = ({t}) => {
  const rv1 = interp([[37.4, .26, .51], [37.65, .47, .49], [37.9, .72, .47], [38.15, .95, .45]], t);
  const rv2 = interp([[39.9, .28, .61], [40.15, .74, .56]], t);
  return (
    <>
      <Pin x={0.22 * W} y={0.36 * H} label="THAT MOUNTAIN" t={t} a={4.4} b={6.5} />
      <Pin x={0.2 * W} y={0.33 * H} label="THIS MOUNTAIN" t={t} a={26.9} b={28.7} />
      {t >= 37.35 && t < 38.25 && <Brackets x={rv1[0] * W} y={rv1[1] * H} w={0.34 * W} h={0.13 * H} label="RV" t={t} lock={easeOutCubic((t - 37.35) / 0.25)} />}
      {t >= 39.85 && t < 40.4 && <Brackets x={rv2[0] * W} y={rv2[1] * H} w={0.38 * W} h={0.17 * H} label="RV" t={t} lock={easeOutCubic((t - 39.85) / 0.2)} />}
      {t >= 17.5 && t < 21.3 && <Brackets x={540} y={830} w={760} h={900} color={CORAL} t={t} lock={easeOutCubic((t - 17.6) / 0.5)} />}
    </>
  );
};

// =============== BEACH ===============
export const BeachHUD: React.FC<A> = ({t}) => (
  <>
    <LightLeak t={t} a={0.0} dur={1.1} color="#6fe6ff" dir={-1} />
    {t >= 0.2 && t < 2.3 && (() => {
      const p = sp(t, 0.2), blink = Math.floor(t * 6) % 2;
      return (
        <Glass x={160} y={430} w={760} h={130} r={40} tint={blink ? 'rgba(255,60,50,.75)' : 'rgba(200,40,40,.7)'} style={{opacity: clamp((2.3 - t) / 0.15) * clamp(p * 2), transform: `translateY(${(1 - p) * -50}px)`, display: 'flex', alignItems: 'center', gap: 24, padding: '0 36px'}}>
          <svg width={70} height={50} viewBox="0 0 70 50"><path d="M0 40 q17 -50 35 -10 t35 -20" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" /></svg>
          <div><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 56, color: '#fff', letterSpacing: 1, lineHeight: 1}}>INCOMING WAVE</div><div style={{fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: '#fff', marginTop: 8}}>BRACE FOR IMPACT</div></div>
        </Glass>
      );
    })()}
    <Burst x={800} y={760} r={150} text="SPLASH!" t={t} a={1.0} b={2.3} c1="#8fe8ff" c2={SKY} rot={7} />
    <Burst x={270} y={730} r={150} text="WOO!" t={t} a={3.0} b={4.4} c1="#ff9a8a" c2={CORAL} rot={-8} />
    <Meter label="COOL LEVEL" t={t} a={11.0} b={13.3} fillFrom={11.2} fillDur={1.2} y={420} color={SKY} endText="COOL" />
  </>
);
export const BeachCam: React.FC<A> = ({t}) => <Pin x={0.3 * W} y={0.8 * H} label="THAT'S ME" t={t} a={4.9} b={6.5} dx={150} dy={-170} />;

// =============== SURF ===============
export const SurfHUD: React.FC<A> = ({t, frame}) => {
  const live = t >= 1.5;
  const sc = scoreAt(t);
  return (
    <>
      <LightLeak t={t} a={0.0} dur={1.1} color="#ffd36a" />
      {/* LIVE bug */}
      <Glass x={W - 440} y={52} w={390} h={66} r={33} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px'}} tint="rgba(255,255,255,.12)">
        <div style={{display: 'flex', alignItems: 'center', gap: 10, background: CORAL, borderRadius: 18, padding: '4px 16px', boxShadow: `0 0 24px ${CORAL}`}}>
          <div style={{width: 14, height: 14, borderRadius: 7, background: '#fff', opacity: Math.floor(frame / 15) % 2 ? 0.4 : 1}} />
          <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 28, color: '#fff', letterSpacing: 2}}>LIVE</span>
        </div>
        <span style={{fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: '#fff'}}>SURF CAM</span>
      </Glass>
      {/* scoreboard */}
      {t >= 17.9 && <Scoreboard t={t} sc={sc} />}
      <ReplayTag t={t} />
      <Confetti t={t} a={32.4} x={0.62 * W} y={0.52 * H} />
      <Burst x={290} y={680} r={150} text="WHOA!" t={t} a={28.4} b={29.7} c1="#8fe8ff" c2={SKY} rot={-7} />
      <Burst x={760} y={640} r={190} text="OCEAN +1" t={t} a={39.75} b={41.0} c1="#8fe8ff" c2={SKY} rot={6} />
      {t >= 40.3 && t < 44.6 && <Missing t={t} />}
      {/* ticker */}
      {t >= 1.5 && <Ticker t={t} frame={frame} />}
      {/* location lower third */}
      <LowerThird t={t} a={54.2} b={57.7} />
      {t < 1.5 && <LowerThird2 t={t} />}
    </>
  );
};

const scoreAt = (t: number) => ({mark: t >= 29.7 ? 1 : 0, ocean: t >= 39.9 ? 1 : 0});

const Scoreboard: React.FC<{t: number; sc: {mark: number; ocean: number}}> = ({t, sc}) => {
  const p = easeOutExpo((t - 17.9) / 0.7);
  const pm = easeOutBack((t - 29.7) / 0.5), po = easeOutBack((t - 39.9) / 0.5);
  const Cell = (side: 'm' | 'o', n: number, pp: number, label: string, color: string) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, flexDirection: side === 'm' ? 'row' : 'row-reverse'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 2}}>{label}</div>
      <div style={{width: 84, height: 84, borderRadius: 22, background: `linear-gradient(135deg, ${color}, ${SUN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: `0 0 ${20 + 40 * Math.max(0, 1 - pp)}px ${color}`}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 62, color: INK, transform: `scale(${n ? 0.6 + 0.4 * clamp(pp) : 1})`}}>{n}</div>
      </div>
    </div>
  );
  return (
    <Glass x={110} y={250} w={860} h={112} r={56} style={{opacity: p, transform: `translateY(${(1 - p) * -40}px)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px', boxSizing: 'border-box'}} tint="rgba(10,26,51,.55)">
      {Cell('m', sc.mark, pm, 'MARK', CORAL)}
      <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: SUN}}>VS</div>
      {Cell('o', sc.ocean, po, 'OCEAN', AQUA)}
    </Glass>
  );
};

const Ticker: React.FC<{t: number; frame: number}> = ({t}) => {
  const msg = '  ●  LIVE FROM THE SURF  ●  MARK VS THE OCEAN  ●  COMMENTARY BY THE BEACH BOYS  ●  ROAD TRIP · MALIBU  ';
  const off = -((t * 140) % 1300);
  const p = easeOutExpo((t - 1.5) / 0.7);
  return (
    <Glass x={40} y={H - 150} w={1000} h={78} r={39} style={{overflow: 'hidden', opacity: p, transform: `translateY(${(1 - p) * 60}px)`}} tint="rgba(10,26,51,.6)">
      <div style={{position: 'absolute', whiteSpace: 'nowrap', left: off, top: 18, fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: '#fff', fontWeight: 700}}>{msg.repeat(5)}</div>
    </Glass>
  );
};

const Missing: React.FC<{t: number}> = ({t}) => {
  const p = easeOutExpo((t - 40.3) / 0.6), o = clamp((44.6 - t) / 0.4), blink = Math.floor(t * 5) % 2;
  return (
    <>
      <Glass x={110} y={386} w={860} h={96} r={48} tint={blink ? 'rgba(255,80,60,.6)' : 'rgba(255,80,60,.35)'} style={{opacity: p * o, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
        <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 44, color: '#fff', letterSpacing: 2}}>MARK: LOCATION UNKNOWN</span>
      </Glass>
      {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 300 + i * 230 + noise(t * 2, i) * 20, top: 760 + noise(t * 1.5, i + 4) * 40 - ((t * 60 + i * 80) % 200), fontFamily: SANS, fontWeight: 900, fontSize: 220, color: '#fff', opacity: 0.55 * o * p, textShadow: '0 10px 40px rgba(0,0,0,.5)'}}>?</div>)}
    </>
  );
};

const LowerThird: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
  if (t < a || t > b) return null;
  const p = easeOutExpo((t - a) / 0.8), o = clamp((b - t) / 0.3);
  return (
    <Glass x={40} y={1090} w={1000} h={190} r={44} tint="rgba(255,90,74,.6)" style={{opacity: o, transform: `translateX(${(1 - p) * -700}px)`, display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px', boxSizing: 'border-box'}}>
      <svg width={80} height={100} viewBox="0 0 80 100"><path d="M40 4 C18 4 6 20 6 38 C6 62 40 96 40 96 C40 96 74 62 74 38 C74 20 62 4 40 4 Z" fill={SUN} stroke="#fff" strokeWidth={5} /><circle cx={40} cy={38} r={14} fill={INK} /></svg>
      <div>
        <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: '#fff', opacity: 0.95}}>LIVE FROM</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: -1, lineHeight: 1.05, whiteSpace: 'nowrap'}}>MALIBU, CALIFORNIA</div>
      </div>
    </Glass>
  );
};
const LowerThird2: React.FC<{t: number}> = ({t}) => {
  const p = easeOutExpo((t - 0.2) / 0.7), o = clamp((1.5 - t) / 0.2);
  return (
    <Glass x={50} y={1090} w={760} h={150} r={40} tint="rgba(76,201,240,.45)" style={{opacity: o, transform: `translateX(${(1 - p) * -700}px)`, display: 'flex', alignItems: 'center', padding: '0 40px', boxSizing: 'border-box', gap: 24}}>
      <svg width={70} height={70} viewBox="-35 -35 70 70"><rect x={-12} y={-30} width={24} height={44} rx={12} fill="#fff" /><path d="M-24 4 a24 24 0 0 0 48 0 M0 28 v10" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" /></svg>
      <div><div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 7, color: '#fff'}}>ON THE MIC</div><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: -1, lineHeight: 1.05}}>SURF REPORT</div></div>
    </Glass>
  );
};

const ReplayTag: React.FC<{t: number}> = ({t}) => null;

const MARK_LABELS: [number, number, string, string][] = [
  [5.5, 13.4, 'MARK', 'LIVE · IN THE WATER'],
  [17.9, 19.8, 'MARK', 'SPOTTED'],
  [19.8, 24.8, 'MARK', 'STANCE · POWER POSE'],
  [24.8, 27.3, 'MARK', 'BRACING FOR IMPACT'],
  [27.3, 29.5, 'MARK', 'IMPACT'],
  [29.5, 32.2, 'MARK', 'STILL STANDING'],
  [32.2, 35.3, 'MARK', 'CELEBRATING'],
];
export const SurfCam: React.FC<A> = ({t}) => {
  const m = markAt(t);
  const cur = MARK_LABELS.find(([a, b]) => t >= a && t < b);
  const pins = (
    <>
      {t >= 39.5 && t < 40.0 ? null : null}
      <MarkPin t={t} />
    </>
  );
  return (
    <>
      {m && cur && <Brackets x={m.x} y={m.y} w={Math.max(150, m.w * 1.5)} h={Math.max(190, m.h * 1.4)} color={t >= 27.3 && t < 29.5 ? CORAL : SUN} label={cur[2]} sub={cur[3]} t={t} lock={easeOutCubic((t - cur[0]) / 0.5)} labelSide="top" />}
      {pins}
    </>
  );
};
const MarkPin: React.FC<{t: number}> = ({t}) => {
  const mk = interp([[46.8, .84, .455], [47.0, .83, .452], [47.5, .80, .45], [48.0, .72, .423], [48.5, .70, .43], [49.0, .66, .43]], t);
  const sf = interp([[45.8, .82, .275], [46.0, .79, .282], [47.0, .67, .31], [48.0, .41, .273], [48.6, .3, .27]], t);
  return (
    <>
      <Pin x={mk[0] * W} y={mk[1] * H} label="THERE HE IS!" t={t} a={46.8} b={49.2} dx={-120} dy={-200} color={SUN} />
      <Pin x={sf[0] * W} y={sf[1] * H} label="SURFER" t={t} a={45.9} b={48.6} dx={-100} dy={150} color={AQUA} />
    </>
  );
};

// slow-motion instant replay picture-in-picture (placed at root level, not camera space)
export const ReplayPiP: React.FC<{frame: number}> = ({frame}) => {
  const seg = SEGS[6]; // S 17.5..35.6
  const from = seg.sf + Math.round((29.4 - seg.in) * FPS), dur = Math.round(3.2 * FPS);
  if (frame < from - 2 || frame > from + dur + 10) return null;
  const lf = frame - from, t = lf / FPS;
  const p = easeOutExpo((t + 0.05) / 0.5), o = clamp((dur / FPS - t) / 0.35);
  return (
    <div style={{position: 'absolute', left: 40, top: 330, width: 400, height: 712, opacity: o * clamp(p * 2), transform: `scale(${0.7 + 0.3 * p}) translateX(${(1 - p) * -200}px)`, transformOrigin: 'left top', borderRadius: 30, overflow: 'hidden', border: '3px solid #fff', boxShadow: `0 30px 70px rgba(0,0,0,.55), 0 0 0 6px ${CORAL}55`}}>
      <Sequence from={from} durationInFrames={dur + 12}>
        <OffthreadVideo src={staticFile('surf.mp4')} startFrom={Math.round(27.0 * FPS)} playbackRate={0.6} muted style={{width: 400, height: 712, objectFit: 'cover', filter: 'contrast(1.1) saturate(1.2)'}} />
      </Sequence>
      <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.07) 0 2px, transparent 2px 5px)'}} />
      <div style={{position: 'absolute', left: 14, top: 14, display: 'flex', gap: 8, alignItems: 'center', background: CORAL, borderRadius: 16, padding: '6px 16px', fontFamily: SANS, fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: 2}}>
        <svg width={22} height={22} viewBox="0 0 22 22"><path d="M11 2 A9 9 0 1 0 20 11" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" /><path d="M20 3 V11 H12" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" /></svg>REPLAY
      </div>
      <div style={{position: 'absolute', right: 14, bottom: 14, fontFamily: MONO, fontSize: 22, color: SUN, letterSpacing: 3, fontWeight: 700}}>0.6×</div>
    </div>
  );
};

// =============== captions per clip ===============
export const ClipCaptions: React.FC<{clip: 'R' | 'B' | 'S'; ct: number}> = ({clip, ct}) => (
  <Captions caps={clip === 'R' ? CAPS_R : clip === 'B' ? CAPS_B : CAPS_S} ct={ct} accent={clip === 'S' ? AQUA : CORAL} y={1340} />
);

// =============== end card ===============
const Polaroid: React.FC<{t: number; a: number; src: 'road' | 'beach' | 'surf'; at: number; x: number; y: number; rot: number; label: string; size?: number}> = ({t, a, src, at, x, y, rot, label, size = 1}) => {
  const p = sp(t, a, {damping: 11, mass: 0.8, stiffness: 120});
  if (p <= 0) return null;
  const PW = 330 * size, PH = 420 * size;
  return (
    <div style={{position: 'absolute', left: x - PW / 2, top: y - PH / 2 + (1 - p) * 1000, width: PW, height: PH, background: '#fffdf6', padding: 14 * size, boxSizing: 'border-box', transform: `rotate(${rot + (1 - p) * 24}deg)`, boxShadow: '0 22px 50px rgba(0,0,0,.5)'}}>
      <div style={{position: 'absolute', left: PW / 2 - 60 * size, top: -18 * size, width: 120 * size, height: 36 * size, background: 'rgba(255,220,120,.7)', transform: 'rotate(-3deg)'}} />
      <div style={{position: 'relative', width: PW - 28 * size, height: PH - 90 * size, overflow: 'hidden', background: '#000'}}>
        <div style={{position: 'absolute', left: -(W * 0.5 * 0.5) + (PW - 28 * size) / 2, top: -(H * 0.42 * 0.5) + (PH - 90 * size) / 2, width: W, height: H, transform: 'scale(0.5)', transformOrigin: '0 0'}}>
          <Freeze frame={at}><OffthreadVideo src={staticFile(src === 'road' ? 'road.mp4' : src === 'beach' ? 'beach.mp4' : 'surf.mp4')} muted style={{width: W, height: H, objectFit: 'cover'}} /></Freeze>
        </div>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 900, color: NAVY, fontSize: 32 * size, textAlign: 'center', marginTop: 14 * size, letterSpacing: 1}}>{label}</div>
    </div>
  );
};

export const EndCard: React.FC<{lt: number}> = ({lt}) => {
  const bg = easeOutCubic(lt / 0.5);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(10,26,51,${0.78 * bg}), rgba(255,120,60,${0.55 * bg}))`, backdropFilter: `blur(${bg * 18}px)`}} />
      <Kinetic text="ROAD TRIP" t={lt} a={0.25} x={W / 2} y={190} size={190} tracking={-8} stagger={0.045} />
      <Kinetic text="MALIBU, CALIFORNIA" t={lt} a={0.7} x={W / 2} y={420} size={34} weight={500} font={MONO} tracking={14} color={SUN} stagger={0.02} dur={0.6} />
      <Polaroid t={lt} a={0.5} src="road" at={345} x={290} y={800} rot={-6} label="THE CREW" />
      <Polaroid t={lt} a={0.8} src="road" at={822} x={790} y={840} rot={5} label="THE MOUNTAIN" />
      <Polaroid t={lt} a={1.1} src="beach" at={99} x={290} y={1280} rot={4} label="THE BEACH" />
      <Polaroid t={lt} a={1.4} src="surf" at={720} x={790} y={1320} rot={-5} label="MARK VS OCEAN" />
      <Glass x={110} y={1590} w={860} h={120} r={60} style={{opacity: easeOutExpo((lt - 2.0) / 0.6), transform: `translateY(${(1 - easeOutExpo((lt - 2.0) / 0.6)) * 50}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24}} tint="rgba(10,26,51,.5)">
        <span style={{fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: '#fff'}}>FINAL SCORE</span>
        <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap'}}>MARK <span style={{color: SUN}}>1 – 1</span> OCEAN</span>
      </Glass>
      <Confetti t={lt} a={0.3} dur={2.6} x={W / 2} y={560} />
    </AbsoluteFill>
  );
};
