// ===== Suno MV engine: core =====
// Design space 720x1280 (stage 720x830 on top, caption band below). Canvas is 1080x1920 (scale 1.5).
// A song supplies: window.SONG = {timeline, beats, slots, spec}; scenes register in window.SC[name] = g => {...}.
const W = 720, H = 1280, SH = 830, TAU = Math.PI * 2;
const P = { aub: '#150a22', aub2: '#241038', aub3: '#3a1a55', plum: '#5b2a7a', brass: '#f0b43c', brassD: '#b97d1c', brassL: '#ffe39a',
  rose: '#ff4f8b', roseD: '#b92a62', bone: '#eadff6', lilac: '#a58bd0', ink: '#0b0414' };
const FH = '"Fraunces", Georgia, serif', FM = '"DM Mono", ui-monospace, monospace';
window.SC = window.SC || {};

// ---------- math / easing ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = x => 1 - Math.pow(1 - clamp(x), 3);
const easeIO = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mix = (a, b, u) => { // hex colour mix
  const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], u)).toString(16).padStart(2, '0')).join('');
};

// ---------- beat helpers ----------
let S, BEATS, PER, PH, HALF, LOW, HIGH, TL, SLOTS, SPEC, SEGS;
function initSong(song) {
  S = song; TL = song.timeline; SLOTS = song.slots || []; SPEC = song.spec;
  BEATS = song.beats.beats; PER = song.beats.period; HALF = song.beats.half_parity; PH = BEATS[0];
  LOW = song.beats.low30; HIGH = song.beats.high30;
  buildSegments();
}
const beatPos = t => (t - PH) / PER;                         // 128 BPM pulses
const pulse = t => { const b = beatPos(t); return Math.exp(-(b - Math.floor(b)) * 5.5); };
const thump = t => { const b = beatPos(t) - HALF; const h = b / 2; return Math.exp(-(h - Math.floor(h)) * 7); };   // half-time kick
const lowAt = t => LOW[clamp(Math.floor(t * 30), 0, LOW.length - 1)] || 0;
const highAt = t => HIGH[clamp(Math.floor(t * 30), 0, HIGH.length - 1)] || 0;
const swing = t => Math.sin(beatPos(t) * Math.PI / 2 - HALF * Math.PI / 2);   // one full swing per 2 pulses

// ---------- segments: one scene per lyric line (+ fillers) ----------
function buildSegments() {
  const L = TL.lines, segs = [];
  const lead = 0.35;
  const first = L[0].start;
  segs.push({ t0: 0, t1: first - lead, scene: 'overture', v: 0, line: -1, c: 0 });
  L.forEach((l, i) => {
    const sp = SPEC.lines[i] || { scene: 'cozy', v: 0 };
    const t0 = i === 0 ? first - lead : l.start - lead;
    const nxt = i + 1 < L.length ? L[i + 1].start - lead : TL.dur;
    const end = i === L.length - 1 ? l.end + 1.2 : nxt;
    segs.push({ t0, t1: end, scene: sp.scene, v: sp.v || 0, c: sp.c || 0, keys: sp.keys || [], line: i });
    if (i === L.length - 1) segs.push({ t0: end, t1: TL.dur + 1, scene: 'outro', v: 0, line: -1, c: 3 });
  });
  (SPEC.gaps || []).forEach(g => segs.push({ t0: g.t0, t1: g.t1, scene: g.scene, v: g.v || 0, c: g.c || 0, line: -2, gap: true }));
  segs.sort((a, b) => a.t0 - b.t0 || (a.gap ? 1 : -1));
  // gaps override whatever they overlap: split cleanly
  const out = [];
  segs.filter(s => !s.gap).forEach(s => out.push({ ...s }));
  SEGS = out.sort((a, b) => a.t0 - b.t0);
  (SPEC.gaps || []).forEach(g => {
    const idx = SEGS.findIndex(s => s.t0 <= g.t0 && s.t1 >= g.t1);
    if (idx >= 0) { const s = SEGS[idx]; const a = { ...s, t1: g.t0 }, m = { ...g, line: -2, keys: [] }, b = { ...s, t0: g.t1 };
      SEGS.splice(idx, 1, a, m, b); }
  });
}
const segAt = t => { for (let i = SEGS.length - 1; i >= 0; i--) if (t >= SEGS[i].t0) return i; return 0; };
const slotAt = t => SLOTS.find(s => t >= s.t0 && t < s.t1);

// ---------- canvas ----------
let cv, c, grain;
function initCanvas(canvas) {
  cv = canvas; cv.width = 1080; cv.height = 1920; c = cv.getContext('2d');
  grain = document.createElement('canvas'); grain.width = grain.height = 256;
  const gx = grain.getContext('2d'), id = gx.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { const v = rnd(i * .37) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  gx.putImageData(id, 0, 0);
}

// ---------- drawing kit (g = per-frame graphics context handed to scenes) ----------
function makeKit(t, u, seg, cam) {
  const g = { c, W, SH, t, u, p: seg, cam, bp: beatPos(t), P, mix, rnd, clamp, lerp, ease, easeIO, pulse: pulse(t), thump: thump(t), low: lowAt(t), high: highAt(t), sw: swing(t) };
  g.rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  g.paper = (fn, fill, o = {}) => {
    c.save();
    if (o.sh !== false) { c.shadowColor = 'rgba(5,0,12,.55)'; c.shadowBlur = o.blur || 14; c.shadowOffsetY = o.dy || 7; c.shadowOffsetX = o.dx || 0; }
    c.beginPath(); fn(c); c.fillStyle = fill; c.fill();
    c.shadowColor = 'transparent';
    if (o.edge) { c.strokeStyle = o.edge; c.lineWidth = o.lw || 1.5; c.stroke(); }
    c.restore();
  };
  g.L = (depth, fn) => { c.save(); c.translate(-cam.x * depth * 1.6, -cam.y * depth * 1.6); fn(); c.restore(); };
  g.txt = (s, x, y, size, col, o = {}) => {
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
    c.font = `${o.italic ? 'italic ' : ''}${o.w || 900} ${size}px ${o.mono ? FM : FH}`;
    c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle'; if (o.ls) c.letterSpacing = o.ls + 'px';
    if (o.stroke) { c.lineWidth = o.lw || 4; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.strokeText(s, 0, 0); }
    c.fillStyle = col; c.fillText(s, 0, 0); c.restore();
  };
  g.circ = (x, y, r, col) => { if (!(r > 0)) return; c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  g.ring = (x, y, r, lw, col) => { if (!(r > 0)) return; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); };
  g.line = (x1, y1, x2, y2, lw, col, cap = 'round') => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = cap; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  g.glow = (x, y, r, col, a = .5) => { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.globalAlpha = a; c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); };
  g.bg = (top, bot) => { const gr = c.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, top); gr.addColorStop(1, bot); c.fillStyle = gr; c.fillRect(-60, -60, W + 120, SH + 120); };
  g.sparkle = (x, y, r, col) => { g.paper(ctx => { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + .6) * r * .25, y + Math.sin(a + .6) * r * .25, x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.quadraticCurveTo(x + Math.cos(a - .6) * r * .25, y + Math.sin(a - .6) * r * .25, x, y); } }, col, { sh: false }); };
  g.person = (x, y, s, col, o = {}) => { // y = feet
    g.paper(ctx => { ctx.arc(x, y - s * 1.55, s * .3, 0, TAU); }, col, { blur: 8, dy: 4 });
    g.paper(ctx => { ctx.moveTo(x - s * .5, y); ctx.lineTo(x - s * .36, y - s * 1.2); ctx.quadraticCurveTo(x, y - s * 1.34, x + s * .36, y - s * 1.2); ctx.lineTo(x + s * .5, y); ctx.closePath(); }, col, { blur: 8, dy: 4 });
    if (o.arm) { g.line(x + s * .3, y - s * 1.05, x + s * (.3 + Math.cos(o.arm) * .9), y - s * (1.05 + Math.sin(o.arm) * .9), s * .16, col); }
  };
  g.phone = (x, y, w, h, screen, o = {}) => {
    g.paper(ctx => ctx.roundRect(x - w / 2, y - h / 2, w, h, w * .1), o.body || '#0d0618', { edge: P.brassD, lw: 2 });
    c.save(); c.beginPath(); c.roundRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12, w * .07); c.clip();
    c.fillStyle = screen; c.fillRect(x - w / 2, y - h / 2, w, h); if (o.draw) o.draw(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12); c.restore();
  };
  g.badge = (x, y, n, r = 16) => { g.circ(x, y, r, P.rose); g.circ(x - r * .25, y - r * .3, r * .35, '#ff8cb3'); g.txt(String(n), x, y + 1, r * 1.1, '#fff', { w: 900 }); };
  g.bubble = (x, y, w, h, col, o = {}) => {
    g.paper(ctx => { ctx.roundRect(x - w / 2, y - h / 2, w, h, h * .35); const d = o.tail || 1; ctx.moveTo(x - d * w * .25, y + h / 2 - 2); ctx.lineTo(x - d * w * .38, y + h / 2 + h * .35); ctx.lineTo(x - d * w * .1, y + h / 2 - 2); }, col, { blur: 10, dy: 5 });
    if (o.text) g.txt(o.text, x, y + 1, o.size || h * .5, o.tc || P.ink, { w: 900, italic: true });
  };
  g.gear = (x, y, r, teeth, rot, col, hole = true) => {
    g.paper(ctx => { for (let i = 0; i < teeth * 2; i++) { const a = rot + i / (teeth * 2) * TAU, rr = i % 2 ? r * .82 : r; const a2 = a + TAU / (teeth * 4); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); ctx.lineTo(x + Math.cos(a2) * rr, y + Math.sin(a2) * rr); } ctx.closePath(); if (hole) { ctx.moveTo(x + r * .3, y); ctx.arc(x, y, r * .3, 0, TAU, true); } }, col, { blur: 8, dy: 4 });
  };
  g.coin = (x, y, r, rot = 0) => { const sx = Math.abs(Math.cos(rot)); c.save(); c.translate(x, y); c.scale(Math.max(.12, sx), 1);
    g.circ(0, 0, r, P.brassD); g.circ(0, 0, r * .86, P.brass); g.circ(-r * .2, -r * .2, r * .3, P.brassL); g.txt('$', 0, 1, r * 1.05, P.brassD, { w: 900 }); c.restore(); };
  g.cloud = (x, y, s, col) => g.paper(ctx => { ctx.arc(x, y, 30 * s, 0, TAU); ctx.moveTo(x + 50 * s, y + 6 * s); ctx.arc(x + 34 * s, y + 4 * s, 34 * s, 0, TAU); ctx.moveTo(x - 6 * s, y - 14 * s); ctx.arc(x - 12 * s, y - 14 * s, 26 * s, 0, TAU); ctx.moveTo(x + 22 * s, y - 20 * s); ctx.arc(x + 14 * s, y - 20 * s, 32 * s, 0, TAU); ctx.moveTo(x - 24 * s, y + 20 * s); ctx.rect(x - 30 * s, y + 4 * s, 90 * s, 28 * s); }, col, { blur: 10, dy: 6 });
  g.city = (y, col, seed, hmin, hmax, lit) => { // skyline strip; returns nothing
    let x = -20; let i = 0;
    while (x < W + 40) { const w = 36 + rnd(seed + i) * 50, h = hmin + rnd(seed + i + 50) * (hmax - hmin);
      g.paper(ctx => ctx.rect(x, y - h, w, h + 400), col, { blur: 6, dy: 0, dx: -3 });
      if (lit) for (let wy = y - h + 12; wy < y - 8; wy += 16) for (let wx = x + 7; wx < x + w - 10; wx += 13) if (rnd(wx * 3.1 + wy * 1.7 + seed) > .62) { c.fillStyle = rnd(wx + wy) > .8 ? P.rose : lit; c.globalAlpha = .6 + .4 * Math.sin(g.t * 1.3 + wx); c.fillRect(wx, wy, 6, 8); c.globalAlpha = 1; }
      x += w + 4 + rnd(seed + i + 99) * 10; i++; }
  };
  g.bars = (x0, x1, y0, y1, n, lw = 4) => { for (let i = 0; i < n; i++) { const x = lerp(x0, x1, n === 1 ? .5 : i / (n - 1)); g.line(x, y0, x, y1, lw + 2, P.brassD); g.line(x - .8, y0, x - .8, y1, lw - 1.2, P.brass); } };
  g.cage = (x, y, s, o = {}) => cage(g, x, y, s, o);
  g.padlock = (x, y, s, open) => { g.paper(ctx => ctx.roundRect(x - 22 * s, y, 44 * s, 38 * s, 6 * s), P.brass, { blur: 6, dy: 3 }); c.save(); c.strokeStyle = P.brassD; c.lineWidth = 7 * s; c.beginPath(); c.arc(x + (open ? 8 * s : 0), y - 2 * s, 13 * s, Math.PI, 0); c.lineTo(x + (open ? 21 : 13) * s, y + (open ? -14 : 4) * s); c.stroke(); c.restore();
    g.circ(x, y + 17 * s, 5 * s, P.brassD); g.line(x, y + 17 * s, x, y + 28 * s, 4 * s, P.brassD); };
  g.key = (x, y, s, rot = 0) => { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.strokeStyle = P.brassL; c.fillStyle = P.brassL; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(14, 0); c.lineTo(70, 0); c.moveTo(56, 0); c.lineTo(56, 14); c.moveTo(68, 0); c.lineTo(68, 11); c.stroke(); c.restore(); };
  return g;
}

// ---------- the recurring gilded cage ----------
function cage(g, x, y, s, o = {}) {
  const c = g.c, w = 170, h = 300, n = 9;
  c.save(); c.translate(x, y); c.rotate(o.swing || 0); c.scale(s, s);
  const state = o.state || 'closed';
  // hook + ring
  g.line(0, -40, 0, 0, 5, P.brassD); g.ring(0, 8, 11, 4, P.brass);
  // dome cap
  g.paper(ctx => { ctx.moveTo(-22, 52); ctx.quadraticCurveTo(0, 8, 22, 52); ctx.closePath(); }, P.brass, { blur: 6, dy: 3 });
  g.circ(0, 52, 8, P.brassL);
  // bars (drawn before door overlay)
  const bar = (a, broken) => {
    const bx = a * w / 2, tx = a * w * .07;
    c.save();
    for (const [lw, col, off] of [[5.4, P.brassD, 0], [2.6, P.brass, -.9]]) {
      c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
      if (broken) { c.moveTo(bx + off, h); c.quadraticCurveTo(a * w * .62, h * .72, a * w * .52, h * .62); c.moveTo(a * w * .3 + off, h * .28); c.quadraticCurveTo(a * w * .17, h * .22, tx + off, 54); }
      else { c.moveTo(bx + off, h); c.quadraticCurveTo(a * w * .62 + off, h * .46, tx + off, 54); }
      c.stroke();
    }
    c.restore();
  };
  const door = state === 'open';
  for (let i = 0; i < n; i++) { const a = (i / (n - 1) - .5) * 2; if (door && Math.abs(a) < .3) continue; bar(a, state === 'cracked' && i === 6); }
  // rings
  for (const ry of [.42, .74]) { const yy = h * ry, hw = w / 2 * (1 - (1 - ry) * .55) * 1.02; c.strokeStyle = P.brassD; c.lineWidth = 4; c.beginPath(); c.ellipse(0, yy, hw, 9, 0, 0, TAU); c.stroke(); c.strokeStyle = P.brass; c.lineWidth = 1.8; c.beginPath(); c.ellipse(0, yy - 1, hw, 9, 0, 0, TAU); c.stroke(); }
  if (door) { // swung-open door panel
    g.paper(ctx => { ctx.moveTo(-w * .15, h); ctx.lineTo(-w * .62, h - 14); ctx.lineTo(-w * .5, h * .38); ctx.lineTo(-w * .12, h * .32); ctx.closePath(); }, 'rgba(240,180,60,.16)', { sh: false, edge: P.brass, lw: 3 });
    for (let k = 0; k < 4; k++) g.line(-w * .15 - k * w * .1, h - 14 + k * 1.2 - 0, -w * .12 - k * w * .09, h * .34 + k * 2, 2.4, P.brass);
  }
  // base
  g.paper(ctx => ctx.roundRect(-w / 2 - 12, h - 2, w + 24, 22, 8), P.brass, { blur: 10, dy: 6, edge: P.brassD });
  g.paper(ctx => ctx.roundRect(-w / 2 - 4, h + 20, w + 8, 8, 4), P.brassD, { sh: false });
  for (const fx of [-w / 2 + 6, w / 2 - 6]) g.circ(fx, h + 32, 7, P.brassD);
  if (state === 'locked') g.padlock(0, h - 40, .8, false);
  if (state === 'cracked') { c.strokeStyle = P.rose; c.lineWidth = 2.4; c.lineJoin = 'round'; c.beginPath(); c.moveTo(w * .18, h * .5); c.lineTo(w * .26, h * .58); c.lineTo(w * .2, h * .66); c.lineTo(w * .34, h * .78); c.moveTo(-w * .3, h * .25); c.lineTo(-w * .22, h * .34); c.lineTo(-w * .3, h * .42); c.stroke(); }
  if (o.deco) { // ribbons + string lights, o.deco 0..1
    const d = o.deco; c.save();
    c.strokeStyle = P.rose; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * .42, h * .3); c.quadraticCurveTo(0, h * (.3 + .16 * d), w * .42, h * .3); c.stroke();
    if (d > .3) { c.beginPath(); c.moveTo(-w * .46, h * .62); c.quadraticCurveTo(0, h * (.62 + .14 * d), w * .46, h * .62); c.stroke(); }
    const nb = Math.floor(3 + d * 9);
    for (let i = 0; i < nb; i++) { const a = i / (nb - 1), bx = lerp(-w * .4, w * .4, a), by = h * .3 + Math.sin(a * Math.PI) * h * .16 * d + 6; const on = .6 + .4 * Math.sin(g.t * 5 + i * 1.7);
      g.glow(bx, by, 18, P.brassL, .55 * on); g.circ(bx, by, 4, P.brassL); }
    c.restore();
  }
  if (o.bird) { const b = o.bird; g.bird(b.x, b.y, b.s || 1, b.col || P.rose, b.flap || 0); }
  if (o.gold) { for (let i = 0; i < 5; i++) { const a = g.t * .8 + i * 1.3; g.sparkle(Math.cos(a) * w * .45 + Math.sin(i) * 10, h * (.2 + .6 * rnd(i + 3)) + Math.sin(a * 2) * 10, 6 + 4 * Math.abs(Math.sin(a * 2 + i)), P.brassL); } }
  c.restore();
}
function bird(g, x, y, s, col, flap) {
  g.paper(ctx => { ctx.moveTo(x - 16 * s, y); ctx.quadraticCurveTo(x - 4 * s, y - 14 * s, x + 12 * s, y - 6 * s); ctx.lineTo(x + 24 * s, y - 10 * s); ctx.lineTo(x + 14 * s, y); ctx.quadraticCurveTo(x, y + 10 * s, x - 16 * s, y); ctx.moveTo(x - 16 * s, y); ctx.lineTo(x - 28 * s, y + 6 * s); ctx.lineTo(x - 18 * s, y - 4 * s); }, col, { blur: 6, dy: 3 });
  const f = Math.sin(flap) * 14 * s;
  g.paper(ctx => { ctx.moveTo(x - 4 * s, y - 4 * s); ctx.quadraticCurveTo(x - 6 * s, y - 24 * s - f, x + 10 * s, y - 20 * s - f); ctx.quadraticCurveTo(x + 4 * s, y - 8 * s, x - 4 * s, y - 4 * s); }, mix(col, '#ffffff', .25), { sh: false });
}

function addBird(g) { g.bird = (x, y, s, col, flap) => bird(g, x, y, s, col, flap); }

// ---------- frame composition ----------
let _lastErr = {};
function stageBars(g, t, tr, thumpV) {
  // foreground cage bars; on a scene change they rush toward the camera (push-through wipe)
  const n = 7, zoom = 1 + tr * tr * 2.4, al = (1 - tr * .65) * .88;
  c.save(); c.globalAlpha = al; c.translate(W / 2, SH * .55); c.scale(zoom, 1); c.translate(-W / 2, -SH * .55);
  for (let i = 0; i < n; i++) {
    const x = (i + .5) * W / n, bow = Math.sin((i / (n - 1)) * Math.PI) * thumpV * 7 * (i % 2 ? 1 : -1) * .6;
    for (const [lw, col, off] of [[6, '#2a1340', 0], [3.6, P.brassD, 0], [1.9, P.brass, -.7], [.7, P.brassL, -1.1]]) {
      c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x + off, -10); c.quadraticCurveTo(x + off + bow * 2, SH * .5, x + off, SH + 6); c.stroke(); }
  }
  c.restore();
  // top ring + bottom rail (the cage frame)
  g.paper(ctx => ctx.rect(-10, -14, W + 20, 30), P.brass, { blur: 8, dy: 4, edge: P.brassD });
  g.paper(ctx => ctx.rect(-10, SH - 8, W + 20, 26), P.brass, { blur: 14, dy: 8, edge: P.brassD, lw: 2 });
  for (let i = 0; i < 14; i++) g.circ(i * 56 + 14, SH + 5, 4, P.brassD);
}

function bandText(g, t, seg, line, sizeBase) {
  // wrap helper that mixes regular and key-word styles
  const keys = new Set((seg.keys || []).map(k => k.toLowerCase()));
  const mk = (txt) => txt.split(' ').map(w => ({ w, key: keys.has(w.toLowerCase().replace(/[^a-z'-]/g, '')) }));
  return { mk };
}
function drawBand(t, seg, segIdx) {
  const L = TL.lines;
  // plate
  c.save(); c.translate(0, 0);
  const y0 = 868, y1 = 1236;
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
  c.fillStyle = '#1b0c2c'; c.beginPath(); c.roundRect(26, y0, 668, y1 - y0, 22); c.fill(); c.shadowColor = 'transparent';
  c.strokeStyle = P.brassD; c.lineWidth = 5; c.stroke(); c.strokeStyle = P.brass; c.lineWidth = 1.6; c.beginPath(); c.roundRect(33, y0 + 7, 654, y1 - y0 - 14, 16); c.stroke();
  for (const [rx, ry] of [[44, y0 + 18], [676, y0 + 18], [44, y1 - 18], [676, y1 - 18]]) { c.fillStyle = P.brassD; c.beginPath(); c.arc(rx, ry, 5, 0, TAU); c.fill(); c.fillStyle = P.brassL; c.beginPath(); c.arc(rx - 1, ry - 1, 2, 0, TAU); c.fill(); }
  c.restore();
  // header + footer data
  const li = seg.line >= 0 ? seg.line : (seg.line === -1 ? 0 : segLineNear(segIdx));
  const lnn = L[Math.max(0, li)];
  const sect = t < L[0].start - .4 ? 'OVERTURE' : (t > L[L.length - 1].end + 1 ? 'OUTRO' : lnn.section.toUpperCase());
  g0.txt(sect, 58, y0 + 30, 15, P.brass, { mono: true, w: 500, align: 'left', ls: 3 });
  const mm = Math.floor(t / 60), ss = Math.floor(t % 60);
  g0.txt(`${mm}:${String(ss).padStart(2, '0')}`, 662, y0 + 30, 15, P.lilac, { mono: true, w: 400, align: 'right', ls: 2 });
  // progress rail with section ticks
  const px0 = 58, px1 = 662, py = y1 - 28;
  g0.line(px0, py, px1, py, 3, '#3a2656'); g0.line(px0, py, lerp(px0, px1, t / TL.dur), py, 3, P.brass);
  let ps = ''; L.forEach(l => { if (l.section !== ps) { ps = l.section; const xx = lerp(px0, px1, l.start / TL.dur); g0.line(xx, py - 5, xx, py + 5, 2, P.lilac); } });
  // beat dots
  const bp = beatPos(t); for (let i = 0; i < 4; i++) { const on = Math.floor(bp / 2) % 4 === i; g0.circ(px1 - 70 + i * 18, y1 - 50, on ? 5 + 2 * thump(t) : 3.5, on ? P.rose : '#3a2656'); }

  // lyric text
  let txt = null, tStart = 0, mode = 'line';
  if (seg.line >= 0) {
    const l = L[seg.line];
    if (l.mode === 'chunks') {
      mode = 'chunk';
      let ch = null; for (const k of l.chunks) if (t >= k.t) ch = k;
      if (ch && t < l.end + .22) { txt = ch.text; tStart = ch.t; }
    } else if (t >= l.start - .07 && t < l.end + .35) { txt = l.text; tStart = l.start - .07; }
  } else if (seg.line === -2 || seg.line === -1) { txt = null; }
  if (txt) drawLyric(t, txt, tStart, seg, mode);
  else { // idle ornament between lines: breathing cage glyph
    const k = .8 + .2 * Math.sin(t * 2); c.save(); c.globalAlpha = .35; c.translate(360, 1050); c.scale(.28 * k, .28 * k); const gg = g0; gg.cage(0, -150, 1, {}); c.restore(); }
}
function segLineNear(i) { for (let k = i; k >= 0; k--) if (SEGS[k].line >= 0) return SEGS[k].line; return 0; }

function drawLyric(t, text, tStart, seg, mode) {
  const dt = t - tStart, keys = new Set((seg.keys || []).map(k => k.toLowerCase()));
  const words = text.replace(/—/g, '— ').split(/\s+/).filter(Boolean).map(w => ({ w, key: keys.has(w.toLowerCase().replace(/[^a-z'-]/g, '')) }));
  const maxW = 590, maxLines = mode === 'chunk' ? 2 : 3;
  let size = mode === 'chunk' ? 92 : 58, lines;
  const font = (wd, sz) => `${wd.key ? 'italic 900' : '400'} ${sz}px ${FH}`;
  for (; size >= 30; size -= 2) {
    lines = []; let cur = [], curW = 0;
    for (const wd of words) {
      c.font = font(wd, size); const ww = c.measureText(wd.w + ' ').width;
      if (curW + ww > maxW && cur.length) { lines.push({ ws: cur, w: curW }); cur = []; curW = 0; }
      cur.push({ ...wd, ww }); curW += ww;
    }
    lines.push({ ws: cur, w: curW });
    if (lines.length <= maxLines && lines.every(l => l.w <= maxW + 10)) break;
  }
  const lh = size * 1.18, cy = 1052 - 8, top = cy - (lines.length - 1) * lh / 2;
  const pop = 1 + .085 * Math.exp(-dt * 20), a = clamp(dt / .05 + .25);
  c.save(); c.translate(360, cy); c.scale(pop, pop * (1 - .03 * Math.exp(-dt * 20))); c.translate(-360, -cy);
  c.globalAlpha = a; c.textBaseline = 'middle'; c.textAlign = 'left';
  lines.forEach((ln, li) => {
    let x = 360 - ln.w / 2; const y = top + li * lh;
    ln.ws.forEach(wd => {
      c.font = font(wd, size);
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillText(wd.w, x + 2, y + 3);
      c.fillStyle = wd.key ? P.rose : P.bone; c.fillText(wd.w, x, y);
      x += wd.ww;
    });
  });
  c.restore();
  // brass underline that draws in
  const uw = 140 * ease(dt / .35); g0.line(360 - uw / 2, cy + lines.length * lh / 2 + 14, 360 + uw / 2, cy + lines.length * lh / 2 + 14, 3, P.brass);
}

let g0 = null, prevT = -1;
function renderFrame(t) {
  const segIdx = segAt(t); let seg = SEGS[segIdx];
  const slot = slotAt(t);
  const u = clamp((t - seg.t0) / Math.max(.01, seg.t1 - seg.t0));
  const cam = { x: Math.sin(t * .31 + segIdx) * 20 + (rnd(segIdx) - .5) * 30, y: Math.cos(t * .23 + segIdx * .7) * 9, z: 1 + .018 * Math.sin(t * .2) };
  const kick = thump(t);
  // transition progress (0..1 over first .32 s of a new scene id)
  const prev = SEGS[segIdx - 1];
  const sceneNew = prev && (prev.scene !== seg.scene);
  const tin = t - seg.t0, trIn = sceneNew ? clamp(1 - tin / .32) : 0;
  c.setTransform(1.5, 0, 0, 1.5, 0, 0);
  c.fillStyle = P.aub; c.fillRect(0, 0, W, H);
  const g = makeKit(t, u, seg, cam); addBird(g); g0 = g;
  c.save(); c.beginPath(); c.rect(0, 0, W, SH); c.clip();
  // zoom + kick punch
  const z = cam.z * (1 + .012 * kick) * (1 + .06 * trIn * trIn);
  c.translate(W / 2, SH / 2); c.scale(z, z); c.translate(-W / 2, -SH / 2);
  const draw = (sg, alpha) => {
    const fn = (slot && !sg.keepScene) ? window.SC.ambient : (window.SC[sg.scene] || window.SC.cozy);
    c.save(); c.globalAlpha = alpha;
    const gg = makeKit(t, clamp((t - sg.t0) / Math.max(.01, sg.t1 - sg.t0)), (slot && fn === window.SC.ambient) ? { ...sg, v: slot.n, amb: slot } : sg, cam); addBird(gg);
    try { fn(gg); } catch (e) { if (!_lastErr[sg.scene]) { _lastErr[sg.scene] = 1; console.error('scene ' + sg.scene + ': ' + e.stack); } }
    c.restore();
  };
  if (sceneNew && tin < .22 && !slot) draw(prev, 1);
  draw(seg, sceneNew && !slot ? clamp(tin / .22) : 1);
  // lantern + vignette
  const lx = 360 + Math.sin(t * .17) * 170, ly = 240 + Math.cos(t * .13) * 60;
  g.glow(lx, ly, 520, '#ffcf80', .16 + .05 * kick);
  const vg = c.createRadialGradient(W / 2, SH * .48, 220, W / 2, SH * .48, 640); vg.addColorStop(0, 'rgba(10,3,20,0)'); vg.addColorStop(1, 'rgba(10,3,20,.72)'); c.fillStyle = vg; c.fillRect(-60, -60, W + 120, SH + 120);
  // slot frame glow hint (clean: nothing)
  c.restore();
  stageBars(g, t, trIn, kick);
  drawBand(t, seg, segIdx);
  // global grain (static pattern, shifts per frame) + fade in/out
  c.save(); c.globalAlpha = .055; c.globalCompositeOperation = 'overlay'; const pat = c.createPattern(grain, 'repeat'); c.setTransform(1, 0, 0, 1, Math.floor(rnd(Math.floor(t * 24)) * 256), Math.floor(rnd(Math.floor(t * 24) + 7) * 256)); c.fillStyle = pat; c.fillRect(-300, -300, 1500, 2300); c.restore();
  c.setTransform(1.5, 0, 0, 1.5, 0, 0);
  const fade = Math.min(clamp(t / 1.2), clamp((TL.dur - t) / 1.6)); if (fade < 1) { c.fillStyle = `rgba(21,10,34,${1 - fade})`; c.fillRect(0, 0, W, H); }
  return cv;
}
window.__engine = { initSong, initCanvas, renderFrame, SEGS: () => SEGS, P, W, H, SH };
