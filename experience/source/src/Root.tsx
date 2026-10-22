import React from 'react';
import {Composition} from 'remotion';
import {Exp} from './Exp';
import {FRAMES} from './sig';

export const Root: React.FC = () => (
  <>
    <Composition id="Exp" component={Exp} durationInFrames={FRAMES} fps={30} width={1080} height={1920} />
    {/* review drafts: 15 fps, lighter 3-D; render with --scale=0.5 */}
    <Composition id="ExpDraft" component={Exp} durationInFrames={Math.ceil(FRAMES / 2)} fps={15} width={1080} height={1920} />
  </>
);
