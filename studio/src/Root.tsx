import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {buildTimeline, Edit} from './lib';
import {MV} from './mv/MV';
import {MVWide} from './mv/MVWide';

const empty: any = {fps: 30, mode: 'story', title: '', theme: {accent: '#ffc933', accent2: '#ff5a4a', cool: '#19d3c5', ink: '#07101f', navy: '#0a1a33'}, endCard: 3, clips: {}, segs: [], overlays: [], tracks: {}, end: {polaroids: []}, flags: {beatPulse: false}};
export const Root: React.FC = () => (
  <>
  <Composition id="MV" component={MV as any} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{mv: {} as any}} calculateMetadata={({props}: any) => ({durationInFrames: Math.max(30, props.mv.frames || 90)})} />
  <Composition id="MVWide" component={MVWide as any} durationInFrames={90} fps={30} width={1920} height={1080} defaultProps={{mv: {} as any}} calculateMetadata={({props}: any) => ({durationInFrames: Math.max(30, props.mv.frames || 90)})} />
  <Composition id="Main" component={Main as any} durationInFrames={90} fps={30} width={1080} height={1920}
    defaultProps={{edit: empty as Edit, lite: false}}
    calculateMetadata={({props}: any) => ({durationInFrames: Math.max(30, buildTimeline(props.edit).total)})} />
  </>
);
