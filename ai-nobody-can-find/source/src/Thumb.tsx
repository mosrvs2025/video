import React from 'react';
import {AbsoluteFill} from 'remotion';
import {S4Mind} from './scenes/S4Mind';
import {P, F} from './lib';

// 1280x720 YouTube thumbnail: the structure from act 4, one line of type
export const Thumb: React.FC = () => (
  <AbsoluteFill style={{background: P.ink}}>
    <AbsoluteFill style={{transform: 'translateX(230px) scale(1.15)'}}><S4Mind t={123.2} w={1280} h={720} v={false} /></AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(5,6,8,.96) 0%, rgba(5,6,8,.85) 34%, rgba(5,6,8,0) 62%)'}} />
    <div style={{position: 'absolute', left: 70, top: 200}}>
      <div style={{fontFamily: F.mono, fontSize: 26, letterSpacing: 10, color: P.amber}}>THE AI THAT</div>
      <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 112, lineHeight: 0.98, letterSpacing: -2, color: P.paper, marginTop: 16}}>NOBODY<br />CAN FIND</div>
      <div style={{width: 160, height: 4, background: P.amber, marginTop: 30}} />
    </div>
  </AbsoluteFill>
);
