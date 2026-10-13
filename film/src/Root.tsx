import React from 'react';
import {Composition} from 'remotion';
import {FPS, Feature, TOTAL_FRAMES} from './Feature';

export const Root: React.FC = () => (
  <Composition id="Feature" component={Feature} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
