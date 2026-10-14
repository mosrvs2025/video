import {Cap} from './ui';

export const CAPS_R: Cap[] = [
  {a: 4.2, b: 6.1, text: 'Just coming around that mountain.', hi: ['mountain.']},
  {a: 17.6, b: 19.4, text: "What's up, Mark?", hi: ['mark?']},
  {a: 19.4, b: 20.6, text: "What's up?"},
  {a: 22.2, b: 24.0, text: "We're chillin'.", hi: ["chillin'."]},
  {a: 24.3, b: 26.2, text: "We're going to the beach.", hi: ['beach.']},
  {a: 26.25, b: 27.8, text: 'Look at this mountain.', hi: ['mountain.']},
  {a: 27.9, b: 28.8, text: 'Yes sir!', hi: ['sir!']},
  {a: 36.6, b: 38.4, text: 'RVs over here,', hi: ['rvs']},
  {a: 38.4, b: 40.4, text: 'people have posted up.', hi: ['posted']},
  {a: 44.4, b: 46.4, text: 'Beautiful.', hi: ['beautiful.']},
];
export const CAPS_B: Cap[] = [
  {a: 0.3, b: 2.3, text: "It's freakin' coming up on me, dude!", hi: ['dude!']},
  {a: 2.2, b: 3.5, text: 'Look at this.', hi: ['this.']},
  {a: 3.0, b: 4.6, text: 'Woo!', hi: ['woo!']},
  {a: 7.3, b: 9.0, text: 'Oh shoot.', hi: ['shoot.']},
  {a: 10.8, b: 13.2, text: 'That feels cool.', hi: ['cool.']},
];
export const CAPS_S: Cap[] = [
  {a: 0.3, b: 2.9, text: "Mark's out there enjoying himself.", hi: ['enjoying']},
  {a: 3.3, b: 5.4, text: "He's loving the waves, bro.", hi: ['loving']},
  {a: 5.5, b: 6.9, text: "That's Mark.", hi: ['mark.']},
  {a: 7.0, b: 9.2, text: "He's out there getting his therapy.", hi: ['therapy.']},
  {a: 9.3, b: 11.2, text: "He's yelling at the waves.", hi: ['yelling']},
  {a: 11.3, b: 13.4, text: "They're just welcoming Mother Nature.", hi: ['mother']},
  {a: 17.8, b: 19.5, text: 'So look at Mark,', hi: ['mark,']},
  {a: 19.5, b: 21.3, text: "he's doing the power pose.", hi: ['power']},
  {a: 21.8, b: 23.3, text: 'Will the wave knock him down?', hi: ['knock']},
  {a: 23.3, b: 25.0, text: "Is he gonna maintain his stance?", hi: ['stance?']},
  {a: 25.0, b: 27.3, text: "Oh, he's bracing for the wave.", hi: ['bracing']},
  {a: 28.4, b: 31.0, text: "Whoa! Didn't even faze him.", hi: ['faze']},
  {a: 32.8, b: 34.4, text: "What's up, Mark?", hi: ['mark?']},
  {a: 34.4, b: 35.5, text: "Say what's up!", hi: ["what's"]},
  {a: 39.3, b: 40.8, text: 'Oh, and there he goes,', hi: ['goes,']},
  {a: 40.8, b: 42.4, text: 'Mark disappearing under the waves.', hi: ['disappearing']},
  {a: 42.4, b: 43.9, text: 'Will he resurface?', hi: ['resurface?']},
  {a: 43.9, b: 45.1, text: 'We sure hope so.', hi: ['hope']},
  {a: 45.1, b: 46.4, text: 'Oh, there he is.', hi: ['there']},
  {a: 46.4, b: 48.6, text: 'Oh look, we got some surfers coming up.', hi: ['surfers']},
  {a: 49.0, b: 50.8, text: 'He moved all the way over there.', hi: ['moved']},
  {a: 50.8, b: 52.1, text: 'We got a surfer down here.', hi: ['surfer']},
  {a: 52.3, b: 55.0, text: 'And it is a beautiful day at the beach,', hi: ['beautiful']},
  {a: 55.0, b: 56.3, text: 'ladies and gentlemen,', hi: ['gentlemen,']},
  {a: 56.3, b: 57.6, text: 'here in Malibu, California.', hi: ['malibu,']},
];

export type Chap = {c: 'R' | 'B' | 'S'; at: number; n: string; title: string; sub: string};
export const CHAPS: Chap[] = [
  {c: 'R', at: 3.3, n: '01', title: 'THE ROAD', sub: 'SUN’S OUT'},
  {c: 'R', at: 10.55, n: '02', title: 'THE CREW', sub: 'MEET THE PASSENGERS'},
  {c: 'R', at: 24.1, n: '03', title: 'THE MOUNTAIN', sub: 'ALMOST THERE'},
  {c: 'R', at: 36.15, n: '04', title: 'POSTED UP', sub: 'CAMP LIFE'},
  {c: 'R', at: 44.35, n: '05', title: 'ARRIVAL', sub: 'WE MADE IT'},
  {c: 'B', at: 0.15, n: '06', title: 'THE BEACH', sub: 'FEET IN THE WATER'},
  {c: 'S', at: 1.6, n: '07', title: 'SURF REPORT', sub: 'LIVE COMMENTARY'},
];
