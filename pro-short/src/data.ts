import {Cap} from './ui';

export const CAPS_R: Cap[] = [
  {a: 4.2, b: 6.1, text: 'Just coming around that mountain.', hi: ['mountain.']},
  {a: 17.6, b: 19.4, text: "What's up, Mark?", hi: ['mark?']},
  {a: 19.4, b: 20.8, text: "What's up?"},
  {a: 22.2, b: 24.0, text: "We're chillin'.", hi: ["chillin'."]},
  {a: 24.3, b: 26.3, text: "We're going to the beach.", hi: ['beach.']},
  {a: 44.5, b: 46.5, text: 'Beautiful.', hi: ['beautiful.']},
];
export const CAPS_B: Cap[] = [
  {a: 0.3, b: 2.3, text: "It's freakin' coming up on me, dude!", hi: ['dude!']},
  {a: 2.2, b: 3.5, text: 'Look at this.', hi: ['this.']},
  {a: 3.0, b: 4.6, text: 'Woo!', hi: ['woo!']},
];
export const CAPS_S: Cap[] = [
  {a: 25.0, b: 27.3, text: "Oh, he's bracing for the wave.", hi: ['bracing']},
  {a: 28.4, b: 31.0, text: "Whoa! Didn't even faze him.", hi: ['faze']},
  {a: 39.85, b: 40.9, text: 'Oh, and there he goes,', hi: ['goes,']},
  {a: 40.9, b: 42.4, text: 'Mark disappearing under the waves.', hi: ['disappearing']},
  {a: 42.4, b: 43.9, text: 'Will he resurface?', hi: ['resurface?']},
  {a: 43.9, b: 45.1, text: 'We sure hope so.', hi: ['hope']},
  {a: 45.1, b: 46.4, text: 'Oh, there he is.', hi: ['there']},
  {a: 46.4, b: 48.6, text: 'Oh look, we got some surfers coming up.', hi: ['surfers']},
];
export const CAPS_G: Cap[] = [
  {a: 0.3, b: 3.1, text: 'You ready to watch these seagulls freak out?', hi: ['seagulls', 'freak']},
  {a: 15.5, b: 16.2, text: 'There he is.', hi: ['he']},
  {a: 16.2, b: 17.6, text: 'There you go.', hi: ['go.']},
  {a: 17.6, b: 18.4, text: 'Look at him!', hi: ['him!']},
  {a: 18.4, b: 22.3, text: "They're all fighting each other now.", hi: ['fighting']},
  {a: 82.1, b: 83.4, text: 'Take it!', hi: ['it!']},
];

export type Chap = {c: 'R' | 'B' | 'S' | 'G'; at: number; n: string; title: string; sub: string};
export const CHAPS: Chap[] = [
  {c: 'R', at: 3.2, n: '01', title: 'THE ROAD', sub: 'SUN’S OUT'},
  {c: 'R', at: 10.95, n: '02', title: 'THE CREW', sub: 'MEET THE PASSENGERS'},
  {c: 'B', at: 0.15, n: '03', title: 'THE BEACH', sub: 'FEET IN THE WATER'},
  {c: 'S', at: 24.55, n: '04', title: 'SURF REPORT', sub: 'LIVE COMMENTARY'},
  {c: 'G', at: 0.15, n: '05', title: 'FEEDING TIME', sub: 'THE SEAGULL SESSIONS'},
];
