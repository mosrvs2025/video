import React from 'react';
import {Composition} from 'remotion';
import {Main, TOTAL, FPS} from './Main';
export const Root: React.FC = () => <Composition id="Main" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />;
