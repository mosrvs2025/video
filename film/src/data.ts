// Narrative blueprint → typed data that drives every scene of the film.
export type Motif =
  | 'shuttle' | 'office' | 'party' | 'mail' | 'riot' | 'truck' | 'diner'
  | 'jail' | 'bunker' | 'house' | 'letter' | 'plane' | 'tv' | 'bed' | 'flash';

export type Beat = {beat: string; timestamp: string; summary: string; motif: Motif};
export type Act = {key: string; title: string; range: string; beats: Beat[]};

export const project = {
  title: 'Seeking a Friend for the End of the World',
  format: 'Feature Film / Narrative Architecture Blueprint',
  genres: ['Apocalyptic Comedy-Drama', 'Romance', 'Road Movie'],
  logline:
    'As an impending 70-mile-wide asteroid dooms humanity within three weeks, a downcast insurance salesman and his impulsive British neighbor embark on a cross-country road trip to reconcile with their pasts—and inadvertently discover profound connection before the world ends.',
  runtime: 101,
  themes: [
    'The value of genuine intimacy versus societal routine',
    'Existential reckoning and acceptance',
    'Regret, reconciliation, and missed connections',
    'Finding meaning in transient moments',
  ],
};

export const phases = [
  {n: 1, name: 'Numb Continuation & Disbelief', text: 'Routines hold. Promotions are handed out casually. Suicide and absconding begin quietly.'},
  {n: 2, name: 'Hedonism & Lawlessness', text: 'Decadent dinner parties. Chain restaurants become bacchanals. The cities riot.'},
  {n: 3, name: 'Survivalism & Contract Killings', text: 'Preppers seal titanium bunkers. The desperate hire hitmen for a rapid exit.'},
  {n: 4, name: 'Quiet Acceptance & Surrender', text: 'Final TV sign-offs. Quiet reunions. Resting together before impact.'},
];

export const characters = [
  {name: 'Dodge Petersen', role: 'The Disillusioned Bystander', color: '#8fb8d8',
   lines: ['Insurance salesman', 'Stayed in a loveless marriage out of fear of dying alone', 'Arc: passive despair → vulnerability and selfless love']},
  {name: "Penelope 'Penny' Lockhart", role: 'The Free-Spirited Romantic', color: '#f2a65a',
   lines: ['Chronic over-sleeper, serial toxic relationships', 'Paralyzing guilt over the flight home to Surrey', 'Arc: manic guilt → grounding and closure']},
  {name: 'Sorry', role: 'The Loyal Stray', color: '#d9c7a0',
   lines: ['Abandoned terrier-mix, adopted on the road', 'An emblem of unconditional attachment']},
];

export const acts: Act[] = [
  {key: 'one', title: 'Countdown to Nothing', range: '00:00:00 – 00:31:30', beats: [
    {beat: 'The Announcement', timestamp: '00:00:47', motif: 'shuttle', summary: 'Deliverance mission fails; asteroid Matilda will strike Earth in three weeks. Dodge’s wife Linda flees immediately.'},
    {beat: 'Routine in the Face of Oblivion', timestamp: '00:03:15', motif: 'office', summary: 'Dodge attempts normal office work; coworkers commit suicide, drink, and stop caring about titles.'},
    {beat: 'The Hedonist Party', timestamp: '00:08:29', motif: 'party', summary: 'An apocalyptic dinner party: heroin, reckless drinking. Dodge realizes he cannot force a last-minute romance.'},
    {beat: 'Meeting Penny & The Lost Mail', timestamp: '00:17:46', motif: 'mail', summary: 'Penny, crying on his fire escape after missing her flight to the UK, returns 3 years of misdelivered mail—including a letter from his lost love, Olivia.'},
    {beat: 'Inciting Incident', timestamp: '00:27:00', motif: 'riot', summary: 'A civil riot sweeps the building. Dodge rescues Penny and strikes a deal: she drives him to Olivia, he connects her to a private pilot.'},
  ]},
  {key: 'twoA', title: 'On the Open Road', range: '00:31:30 – 00:54:40', beats: [
    {beat: 'The Hitman Encounter', timestamp: '00:34:02', motif: 'truck', summary: 'They ride with Glen, a terminally ill trucker who hired a hitman—underscoring the absurdity of dying early.'},
    {beat: 'Friendsy’s Bacchanal', timestamp: '00:40:29', motif: 'diner', summary: 'An open chain diner where staff and guests have dissolved into drug-fueled euphoria and group love.'},
    {beat: 'The Arrest & Jail Cell Truths', timestamp: '00:47:30', motif: 'jail', summary: 'A rigid patrol officer locks them up. In the cell, Dodge confesses the truth about his marriage, his mother, his estranged father.'},
  ]},
  {key: 'twoB', title: 'Reckoning with the Past', range: '00:54:40 – 01:17:45', beats: [
    {beat: 'Speck’s Bunker', timestamp: '00:56:06', motif: 'bunker', summary: 'Shelter with Penny’s prepper ex. On his satellite phone, Penny makes a tearful call to her family in England.'},
    {beat: 'Olivia’s House', timestamp: '01:03:00', motif: 'house', summary: 'They break in, cook a meal, spin vinyl, and forge real intimacy. Dodge finds Olivia’s current address.'},
    {beat: 'The Walkaway', timestamp: '01:13:30', motif: 'letter', summary: 'At Olivia’s actual door, Dodge doesn’t knock. He leaves a letter—his love is no longer in the past.'},
  ]},
  {key: 'three', title: 'The Beginning of the World', range: '01:17:45 – 01:33:56', beats: [
    {beat: 'The Estranged Father', timestamp: '01:18:28', motif: 'plane', summary: 'The “man with the plane” is Frank—Dodge’s father. They reconcile, and Dodge puts an exhausted Penny aboard to fly home.'},
    {beat: 'The Final Broadcast', timestamp: '01:26:00', motif: 'tv', summary: 'Alone in his apartment: Matilda has accelerated—16 hours. The anchor bids farewell.'},
    {beat: 'The Return', timestamp: '01:31:00', motif: 'bed', summary: 'Penny turned the plane back. They lie together as tremors shake the building.'},
    {beat: 'Final Fade', timestamp: '01:33:00', motif: 'flash', summary: 'Dodge tells Penny she is his favorite thing. White light consumes the frame.'},
  ]},
];

export const soundtrack = ['The Beach Boys', 'Scott Walker', 'The Walker Brothers', 'PM Dawn'];
