// Hand-keyed bird position in the source clip: [seconds, x, y] as fractions of the frame.
export type K = [number, number, number];

export const SPAN_A: K[] = [
  [2.0, .49, .355], [2.5, .61, .446], [3.0, .61, .533], [3.5, .63, .54], [4.0, .58, .58],
  [4.5, .55, .61], [5.0, .52, .53], [5.5, .45, .58], [6.0, .35, .49], [6.5, .40, .38],
  [7.0, .35, .31], [7.5, .25, .37], [8.0, .19, .39], [8.5, .37, .31], [9.0, .50, .30],
  [9.5, .62, .43], [10.0, .62, .605], [10.5, .73, .605], [11.0, .96, .635],
];
export const SPAN_C: K[] = [[12.4, .72, .64], [13.0, .50, .47], [13.5, .375, .40], [13.8, .30, .38]];
export const SPAN_B: K[] = [
  [21.0, .73, .65], [21.5, .45, .59], [22.0, .35, .45], [22.5, .17, .41], [23.0, .33, .34], [23.5, .58, .30],
  [24.0, .58, .35], [24.5, .60, .37], [25.0, .54, .43], [25.5, .40, .43], [26.0, .42, .43], [26.5, .42, .45],
  [27.0, .60, .48], [27.5, .67, .48], [28.0, .79, .43], [28.5, .67, .41], [29.0, .46, .44], [29.5, .46, .43],
  [30.0, .58, .44], [30.5, .67, .45], [31.0, .56, .43], [31.5, .65, .45], [32.0, .73, .51], [32.5, .83, .56],
  [33.0, .91, .54], [33.5, .91, .54], [34.0, .71, .56], [34.5, .63, .62], [35.0, .42, .55], [35.5, .46, .48],
  [36.0, .54, .41], [36.5, .48, .41], [37.0, .42, .37], [37.5, .42, .39], [38.0, .40, .43], [38.5, .375, .43],
  [39.0, .48, .47], [39.5, .56, .46], [40.0, .42, .42], [40.5, .44, .41], [41.0, .42, .52], [41.5, .50, .46],
  [42.0, .64, .54], [42.5, .63, .71], [43.1, .62, .74],
];
// apparent bird width in output pixels
export const SIZE_A: [number, number][] = [
  [2, 65], [3, 90], [4, 110], [5, 160], [5.5, 180], [6, 200], [6.5, 315], [7.5, 340], [8, 450], [9, 580], [9.5, 500], [10, 270], [10.5, 250], [11, 135],
];
export const SIZE_C: [number, number][] = [[12.4, 180], [13, 190], [13.8, 230]];
export const SIZE_B: [number, number][] = [
  [21, 160], [22, 270], [23, 315], [24, 450], [26, 400], [28, 380], [30, 250], [31, 200], [32, 180], [34.5, 270],
  [36, 315], [38, 270], [40, 315], [41, 270], [42, 135], [43.1, 120],
];

const cr = (p0: number, p1: number, p2: number, p3: number, u: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);

export function sample(keys: K[], t: number): [number, number] {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return [last[1], last[2]];
  let i = 0;
  while (keys[i + 1][0] < t) i++;
  const p = (j: number) => keys[Math.max(0, Math.min(keys.length - 1, j))];
  const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
  return [cr(p(i - 1)[1], p(i)[1], p(i + 1)[1], p(i + 2)[1], u), cr(p(i - 1)[2], p(i)[2], p(i + 1)[2], p(i + 2)[2], u)];
}

export function lin(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];
  let i = 0;
  while (keys[i + 1][0] < t) i++;
  const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
  return keys[i][1] + (keys[i + 1][1] - keys[i][1]) * u;
}

export type Bird = {x: number; y: number; size: number; span: 'A' | 'B' | 'C'} | null;

export function birdAt(t: number): Bird {
  if (t >= 2.0 && t <= 11.1) { const [x, y] = sample(SPAN_A, t); return {x: x * 1080, y: y * 1920, size: lin(SIZE_A, t), span: 'A'}; }
  if (t >= 12.4 && t <= 13.8) { const [x, y] = sample(SPAN_C, t); return {x: x * 1080, y: y * 1920, size: lin(SIZE_C, t), span: 'C'}; }
  if (t >= 21.0) { const [x, y] = sample(SPAN_B, t); return {x: x * 1080, y: y * 1920, size: lin(SIZE_B, t), span: 'B'}; }
  return null;
}
