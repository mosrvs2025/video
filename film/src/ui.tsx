import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

export const FONT_SERIF = 'Georgia, "Times New Roman", serif';
export const FONT_SANS = '"Helvetica Neue", Arial, sans-serif';
export const FONT_MONO = '"Courier New", monospace';

export const useFade = (inF = 15, outF = 15) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return interpolate(frame, [0, inF, durationInFrames - outF, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
};

export const rise = (frame: number, delay = 0, dist = 30, dur = 24) => ({
  opacity: interpolate(frame, [delay, delay + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  transform: `translateY(${interpolate(frame, [delay, delay + dur], [dist, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})}px)`,
});

export const Typewriter: React.FC<{text: string; start?: number; cps?: number}> = ({text, start = 0, cps = 38}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - start) / fps) * cps));
  return <>{text.slice(0, n)}</>;
};

// Simple person silhouette. Origin = feet, centered.
export const Person: React.FC<{x: number; y: number; color: string; scale?: number; lean?: number; head?: string}> = ({
  x, y, color, scale = 1, lean = 0, head,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${lean}) scale(${scale})`}>
    <rect x={-14} y={-92} width={28} height={64} rx={13} fill={color} />
    <rect x={-12} y={-34} width={10} height={34} rx={4} fill={color} />
    <rect x={2} y={-34} width={10} height={34} rx={4} fill={color} />
    <circle cx={0} cy={-112} r={15} fill={head ?? color} />
  </g>
);

export const Dog: React.FC<{x: number; y: number; scale?: number; wag?: number}> = ({x, y, scale = 1, wag = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#d9c7a0">
    <ellipse cx={0} cy={-22} rx={26} ry={13} />
    <circle cx={26} cy={-34} r={10} />
    <path d="M32 -42 l8 -10 l2 12z" />
    <rect x={-18} y={-14} width={6} height={14} rx={3} />
    <rect x={14} y={-14} width={6} height={14} rx={3} />
    <path d={`M-26 -26 q-12 ${-8 + wag} -16 ${-20 + wag}`} stroke="#d9c7a0" strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);
