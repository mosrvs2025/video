import React from 'react';
import {Composition} from 'remotion';
import {Film, FILM_FRAMES} from './Film';
import {Short, SHORT_DUR} from './Short';
import {Thumb} from './Thumb';

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film as any} durationInFrames={FILM_FRAMES} fps={30} width={1920} height={1080} defaultProps={{}} />
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="Short" component={Short} durationInFrames={Math.ceil(SHORT_DUR * 30)} fps={30} width={1080} height={1920} />
  </>
);
