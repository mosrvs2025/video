import React from 'react';
import {AbsoluteFill, Series, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {acts, characters, phases, project, soundtrack, Beat} from './data';
import {FONT_MONO, FONT_SANS, FONT_SERIF, Typewriter, rise, useFade} from './ui';
import {MotifView} from './motifs';

export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const DUR = {title: 7, logline: 8, phase: 3.5, char: 4.5, actCard: 3, beat: 7, credits: 8};

const totalFrames = () =>
  s(DUR.title) + s(DUR.logline) + phases.length * s(DUR.phase) + characters.length * s(DUR.char) +
  acts.reduce((n, a) => n + s(DUR.actCard) + a.beats.length * s(DUR.beat), 0) + s(DUR.credits);
export const TOTAL_FRAMES = totalFrames();

// ---------- persistent layers ----------
const Matilda: React.FC<{progress: number}> = ({progress}) => {
  const frame = useCurrentFrame();
  const r = 18 + progress * 150;
  return (
    <div style={{position: 'absolute', right: 90 - progress * 30, top: 40 + progress * 20, width: r * 2, height: r * 2, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, #d8c9b2, #6b5a4a 60%, #2a2018)', transform: `rotate(${frame / 4}deg)`,
      boxShadow: `0 0 ${20 + progress * 120}px ${progress * 30}px rgba(255,140,60,${0.15 + progress * 0.4})`, opacity: 0.9}} />
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity: 0.35}}>
      <svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 24} /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#g)" /></svg>
    </AbsoluteFill>
  );
};

const Vignette = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.65))', pointerEvents: 'none'}} />;

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, bottom: 0, height: 5, width: `${(frame / TOTAL_FRAMES) * 100}%`, background: '#f2a65a'}} />
  );
};

// ---------- scenes ----------
const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const o = useFade(20, 20);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: o, textAlign: 'center'}}>
      <div style={{...rise(frame, 20), fontFamily: FONT_MONO, color: '#f2a65a', letterSpacing: 8, fontSize: 26}}>THREE WEEKS REMAIN</div>
      <div style={{...rise(frame, 40, 40, 36), fontFamily: FONT_SERIF, fontSize: 108, color: '#f4ecdc', maxWidth: 1500, lineHeight: 1.05, marginTop: 24}}>{project.title}</div>
      <div style={{...rise(frame, 90), fontFamily: FONT_SANS, color: '#a99fb8', fontSize: 28, letterSpacing: 4, marginTop: 36}}>{project.genres.join('  ·  ').toUpperCase()}</div>
    </AbsoluteFill>
  );
};

const Logline: React.FC = () => {
  const o = useFade(20, 20);
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 280px', opacity: o}}>
      <div style={{fontFamily: FONT_MONO, color: '#f2a65a', fontSize: 24, letterSpacing: 6, marginBottom: 30}}>LOGLINE</div>
      <div style={{fontFamily: FONT_SERIF, color: '#f4ecdc', fontSize: 46, lineHeight: 1.4}}><Typewriter text={project.logline} start={15} cps={42} /></div>
    </AbsoluteFill>
  );
};

const Phase: React.FC<{i: number}> = ({i}) => {
  const frame = useCurrentFrame();
  const o = useFade(12, 12);
  const p = phases[i];
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 240px', opacity: o}}>
      <div style={{display: 'flex', gap: 14, marginBottom: 40}}>
        {phases.map((q) => <div key={q.n} style={{height: 8, width: 120, borderRadius: 4, background: q.n <= p.n ? '#f2a65a' : '#3a3444'}} />)}
      </div>
      <div style={{...rise(frame, 4), fontFamily: FONT_MONO, color: '#f2a65a', fontSize: 28, letterSpacing: 6}}>SOCIETAL COLLAPSE · PHASE {p.n}</div>
      <div style={{...rise(frame, 12), fontFamily: FONT_SERIF, color: '#f4ecdc', fontSize: 86, margin: '20px 0'}}>{p.name}</div>
      <div style={{...rise(frame, 24), fontFamily: FONT_SANS, color: '#c8bfd6', fontSize: 38, maxWidth: 1200, lineHeight: 1.4}}>{p.text}</div>
    </AbsoluteFill>
  );
};

const CharacterCard: React.FC<{i: number}> = ({i}) => {
  const frame = useCurrentFrame();
  const o = useFade(14, 14);
  const c = characters[i];
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 240px', opacity: o}}>
      <div style={{width: 120, height: 8, background: c.color, marginBottom: 30}} />
      <div style={{...rise(frame, 4), fontFamily: FONT_MONO, color: c.color, fontSize: 26, letterSpacing: 6}}>{c.role.toUpperCase()}</div>
      <div style={{...rise(frame, 10), fontFamily: FONT_SERIF, color: '#f4ecdc', fontSize: 96, margin: '16px 0 30px'}}>{c.name}</div>
      {c.lines.map((l, k) => <div key={k} style={{...rise(frame, 24 + k * 12), fontFamily: FONT_SANS, color: '#c8bfd6', fontSize: 36, margin: '8px 0'}}>— {l}</div>)}
    </AbsoluteFill>
  );
};

const ActCard: React.FC<{i: number}> = ({i}) => {
  const frame = useCurrentFrame();
  const o = useFade(10, 10);
  const a = acts[i];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: o}}>
      <div style={{...rise(frame, 2), fontFamily: FONT_MONO, color: '#f2a65a', fontSize: 28, letterSpacing: 8}}>{a.key.startsWith('two') ? `ACT TWO · ${a.key === 'twoA' ? 'A' : 'B'}` : a.key === 'one' ? 'ACT ONE' : 'ACT THREE'}</div>
      <div style={{...rise(frame, 10, 30), fontFamily: FONT_SERIF, color: '#f4ecdc', fontSize: 110, margin: '20px 0'}}>{a.title}</div>
      <div style={{...rise(frame, 22), fontFamily: FONT_MONO, color: '#a99fb8', fontSize: 28}}>{a.range}</div>
    </AbsoluteFill>
  );
};

const BeatScene: React.FC<{beat: Beat; actTitle: string; index: number; count: number}> = ({beat, actTitle, index, count}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const o = useFade(10, 10);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', top: 0, left: 0}}><MotifView motif={beat.motif} f={frame} d={durationInFrames} /></div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 320, background: 'linear-gradient(transparent, rgba(8,6,12,.92) 30%)', padding: '70px 120px 0'}}>
        <div style={{display: 'flex', gap: 24, alignItems: 'baseline', ...rise(frame, 6)}}>
          <span style={{fontFamily: FONT_MONO, color: '#f2a65a', fontSize: 30}}>{beat.timestamp}</span>
          <span style={{fontFamily: FONT_MONO, color: '#7d7490', fontSize: 22, letterSpacing: 4}}>{actTitle.toUpperCase()} · {index + 1}/{count}</span>
        </div>
        <div style={{...rise(frame, 10), fontFamily: FONT_SERIF, color: '#f4ecdc', fontSize: 62, margin: '6px 0 10px'}}>{beat.beat}</div>
        <div style={{...rise(frame, 22), fontFamily: FONT_SANS, color: '#c8bfd6', fontSize: 29, lineHeight: 1.35, maxWidth: 1600}}>{beat.summary}</div>
      </div>
    </AbsoluteFill>
  );
};

const Credits: React.FC = () => {
  const frame = useCurrentFrame();
  const o = useFade(20, 40);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: o}}>
      <div style={{...rise(frame, 10), fontFamily: FONT_SERIF, color: '#f4ecdc', fontSize: 64}}>Finding meaning in transient moments.</div>
      <div style={{...rise(frame, 50), fontFamily: FONT_MONO, color: '#f2a65a', fontSize: 24, letterSpacing: 6, marginTop: 70}}>TONE · 60% GROUNDED DRAMA · 40% DEADPAN COMEDY</div>
      <div style={{...rise(frame, 70), fontFamily: FONT_SANS, color: '#a99fb8', fontSize: 28, marginTop: 24}}>Needle-drops: {soundtrack.join('  ·  ')}</div>
      <div style={{...rise(frame, 90), fontFamily: FONT_MONO, color: '#6c6380', fontSize: 22, marginTop: 70}}>{project.title.toUpperCase()} · {project.runtime} MIN FEATURE BLUEPRINT</div>
    </AbsoluteFill>
  );
};

// ---------- root timeline ----------
export const Feature: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / TOTAL_FRAMES;
  // golden hour → dark rumbling sky over the course of the film
  const top = `hsl(${interpolate(progress, [0, 0.7, 1], [32, -70, 5])}, 40%, ${interpolate(progress, [0, 1], [26, 6])}%)`;
  return (
    <AbsoluteFill style={{background: `linear-gradient(${top}, #07060a 85%)`}}>
      <Series>
        <Series.Sequence durationInFrames={s(DUR.title)}><Title /></Series.Sequence>
        <Series.Sequence durationInFrames={s(DUR.logline)}><Logline /></Series.Sequence>
        {phases.map((_, i) => <Series.Sequence key={`p${i}`} durationInFrames={s(DUR.phase)}><Phase i={i} /></Series.Sequence>)}
        {characters.map((_, i) => <Series.Sequence key={`c${i}`} durationInFrames={s(DUR.char)}><CharacterCard i={i} /></Series.Sequence>)}
        {acts.flatMap((a, ai) => [
          <Series.Sequence key={`a${ai}`} durationInFrames={s(DUR.actCard)}><ActCard i={ai} /></Series.Sequence>,
          ...a.beats.map((b, bi) => (
            <Series.Sequence key={`a${ai}b${bi}`} durationInFrames={s(DUR.beat)}>
              <BeatScene beat={b} actTitle={a.title} index={bi} count={a.beats.length} />
            </Series.Sequence>
          )),
        ])}
        <Series.Sequence durationInFrames={s(DUR.credits)}><Credits /></Series.Sequence>
      </Series>
      <Matilda progress={progress} />
      <Vignette /><Grain /><Progress />
    </AbsoluteFill>
  );
};
