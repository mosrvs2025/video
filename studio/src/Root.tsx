import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {buildTimeline, Edit} from './lib';

const empty: any = {fps: 30, mode: 'story', title: '', theme: {accent: '#ffc933', accent2: '#ff5a4a', cool: '#19d3c5', ink: '#07101f', navy: '#0a1a33'}, endCard: 3, clips: {}, segs: [], overlays: [], tracks: {}, end: {polaroids: []}, flags: {beatPulse: false}};
export const Root: React.FC = () => (
  <Composition id="Main" component={Main as any} durationInFrames={90} fps={30} width={1080} height={1920}
    defaultProps={{edit: empty as Edit, lite: false}}
    calculateMetadata={({props}: any) => ({durationInFrames: Math.max(30, buildTimeline(props.edit).total)})} />
);
