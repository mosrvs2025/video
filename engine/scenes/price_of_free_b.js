// ===== Scenes for "The Price of Free" (part B: chorus family, verse 2, bridge, verse 3) =====
(() => {
const SC = window.SC;
const P2 = { aub: '#150a22', plum: '#5b2a7a', brass: '#f0b43c', brassD: '#b97d1c', brassL: '#ffe39a', rose: '#ff4f8b', roseD: '#b92a62', bone: '#eadff6', lilac: '#a58bd0', ink: '#0b0414' };
const STATE = ['closed', 'locked', 'cracked', 'open'];
// chorus look changes with the cage's arc: 1 = locked & ornate, 2 = cracked & hazy rose, 3 = open & dawn
const chorusBg = (g) => { const c = g.p.c || 1; const A = ['', ['#25103a', '#432060'], ['#2a0f2f', '#4d1c46'], ['#2b1347', '#7a3a68']][c]; g.bg(A[0], A[1]); if (c === 3) g.glow(360, 380, 420, '#ffd9a0', .22); if (c === 2) g.glow(360, 380, 360, '#ff4f8b', .1 + .08 * g.pulse); };
const stateOf = g => STATE[g.p.c || 1];
const chain = (g, x, y, n, rot, broken) => { for (let i = 0; i < n; i++) { const a = rot + Math.sin(g.t * 1.4 + i * .5) * .05; g.c.save(); g.c.translate(x + Math.sin(a) * i * 30, y + Math.cos(a) * i * 30); g.c.rotate(-a); g.c.strokeStyle = P2.brassD; g.c.lineWidth = 9; g.c.beginPath(); g.c.roundRect(-11, -17, 22, 34, 11); g.c.stroke(); g.c.strokeStyle = P2.brass; g.c.lineWidth = 4; g.c.stroke(); g.c.restore(); if (broken && i === 3) break; } };
const rayfan = (g, cx, cy, col, a, rot) => { const c = g.c; c.save(); c.globalAlpha = a; c.fillStyle = col; for (let i = 0; i < 12; i++) { const a0 = rot + i / 12 * 6.2832; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a0) * 1200, cy + Math.sin(a0) * 1200); c.lineTo(cx + Math.cos(a0 + .26) * 1200, cy + Math.sin(a0 + .26) * 1200); c.fill(); } c.restore(); };

// ---------- chorus family (variants via g.p.c) ----------
SC.tag = g => { const { c, t } = g, k = g.p.c || 1; chorusBg(g);
  g.L(.3, () => g.cage(360, 20, 1.8, { swing: g.sw * .015, state: stateOf(g), gold: true }));
  g.L(.9, () => { const a = Math.sin(t * 2.2) * .22; c.save(); c.translate(360, 40); c.rotate(a); g.line(0, 0, 0, 260, 3, P2.bone); c.translate(0, 260);
    g.paper(cc => { cc.moveTo(-110, 0); cc.lineTo(110, 0); cc.lineTo(110, 230); cc.lineTo(0, 290); cc.lineTo(-110, 230); cc.closePath(); }, P2.rose, { blur: 22, dy: 12, edge: P2.roseD, lw: 4 }); g.circ(0, 36, 14, '#2a1030');
    g.txt('PRICE', 0, 100, 34, P2.bone, { mono: true, ls: 8, w: 500 }); g.txt('FREE', 0, 168, 76, P2.bone, { italic: true, stroke: P2.roseD, lw: 6 }); g.line(-80, 168, 80, 168, 6, P2.ink); g.txt('$∞', 60, 228, 28, P2.ink, { mono: true });
    c.restore(); }); };
SC.lock = g => { const { c, t } = g; chorusBg(g);
  g.L(.3, () => { g.bars(40, 680, -10, 840, 9, 6); });
  g.L(.8, () => { g.padlock(360, 330 + Math.sin(t * 2) * 4, 5.2, g.p.c === 3); });
  g.L(.9, () => { const kx = 590 + Math.sin(t * 1.3) * 30, ky = 120 + Math.cos(t * 1.1) * 24; g.line(kx - 40, -20, kx - 20, ky - 6, 2.4, P2.bone); g.key(kx, ky, 1.5, 1.1); g.txt('out of reach', kx - 30, ky + 90, 16, P2.lilac, { mono: true, ls: 3 }); });
  g.txt('LOCK', 360, 640, 64, P2.brass, { italic: true, stroke: P2.ink, lw: 8 }); };
SC.reflection = g => { const { c, t } = g; chorusBg(g);
  g.L(.5, () => { g.paper(cc => cc.roundRect(130, 60, 460, 640, 230), P2.brass, { blur: 24, dy: 12 }); g.paper(cc => cc.roundRect(152, 82, 416, 596, 208), '#2a1540', { sh: false });
    c.save(); c.beginPath(); c.roundRect(152, 82, 416, 596, 208); c.clip(); g.glow(360, 300, 300, '#8a5bd0', .5);
    g.person(360, 650, 170, g.p.c === 3 ? P2.brassL : P2.bone); g.paper(cc => { cc.moveTo(330, 352); cc.lineTo(390, 352); cc.lineTo(372, 420); cc.lineTo(348, 420); cc.closePath(); }, P2.rose, { sh: false }); g.txt('$', 360, 388, 30, P2.bone, { mono: true });
    const sx = -200 + ((t * 160) % 900); c.globalAlpha = .22; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(sx, 80); c.lineTo(sx + 50, 80); c.lineTo(sx - 100, 680); c.lineTo(sx - 150, 680); c.fill(); c.globalAlpha = 1; c.restore(); });
  g.L(.9, () => { c.save(); c.translate(540, 190); c.rotate(.28 + Math.sin(t * 2) * .02); g.paper(cc => cc.roundRect(-110, -34, 220, 68, 6), 'rgba(0,0,0,0)', { sh: false, edge: P2.rose, lw: 7 }); g.txt('SOLD', 0, 2, 54, P2.rose, { italic: true }); c.restore(); }); };
SC.clones = g => { const { c, t } = g; chorusBg(g); const odd = Math.floor(t * 1.2) % 15;
  g.L(.5, () => { for (let r = 0; r < 4; r++) for (let q = 0; q < 5; q++) { const i = r * 5 + q, x = 90 + q * 135, y = 250 + r * 150 + Math.sin(t * 4 + q) * 3 * g.pulse; const me = i === odd + 2; g.person(x, y, 52, me ? P2.brass : P2.bone, { arm: 1 }); if (me) g.sparkle(x + 30, y - 100, 12, P2.brassL); } });
  g.txt('INDIVIDUALITY™', 360, 90, 40, P2.rose, { italic: true, stroke: P2.ink, lw: 8 }); g.txt('ONE SIZE FITS ALL', 360, 780, 18, P2.lilac, { mono: true, ls: 6 });
  g.cage(640, 70, .4, { state: stateOf(g) }); };
SC.globe = g => { const { c, t } = g, v = g.p.v, slip = v === 1 ? g.ease(g.u * 1.3) : 0; chorusBg(g);
  g.L(.7, () => { const gy = 330 + slip * 330, gr = 128; c.save(); c.translate(360, gy); c.rotate(slip * 1.4);
    g.paper(cc => cc.arc(0, 0, gr, 0, 6.3), '#2f6fb2', { blur: 22, dy: 12, edge: P2.bone, lw: 3 }); c.save(); c.beginPath(); c.arc(0, 0, gr - 2, 0, 6.3); c.clip();
    const sh = (t * 40) % 400; for (const [bx, by, bw] of [[-80, -40, 70], [40, 20, 60], [-30, 70, 50]]) { c.fillStyle = '#6bb372'; c.beginPath(); c.ellipse(((bx + sh + 200) % 400) - 200, by, bw, bw * .6, 0, 0, 6.3); c.fill(); } g.glow(-40, -50, 90, '#fff', .35); c.restore(); c.restore();
    // hand
    g.paper(cc => { cc.moveTo(160, 620); cc.quadraticCurveTo(200, 470 + slip * 60, 240, 440 + slip * 70); cc.lineTo(480, 440 + slip * 70); cc.quadraticCurveTo(520, 470 + slip * 60, 560, 620); cc.closePath(); }, '#e6bfae', { blur: 18, dy: 8 });
    for (let i = 0; i < 4; i++) { const fx = 230 + i * 70; g.paper(cc => cc.roundRect(fx - 24, 360 + slip * 90 + i * 8 - (i === 0 ? 0 : 6), 48, 140, 24), '#efcdbc', { blur: 8, dy: 4 }); } });
  if (v === 1) for (let i = 0; i < 22; i++) { const k = (t * .6 + i * .07) % 1; g.circ(250 + g.rnd(i) * 220, 480 + k * 300, 3, P2.brassL); }
  g.cage(110, 80, .5, { state: stateOf(g), swing: g.sw * .04 }); };
SC.goldcage = g => { const { c, t } = g, v = g.p.v, k = g.p.c || 1; chorusBg(g); rayfan(g, 360, 330, '#ffd89a', .06, t * .05);
  g.L(.6, () => { g.cage(360, 20, 1.75, { swing: g.sw * .02, state: stateOf(g), gold: true, deco: k === 1 ? .2 : 0, bird: k === 3 ? { x: 220 + ((t % 6) * 70), y: 120 - ((t % 6) * 25), s: 1.2, col: P2.rose, flap: t * 9 } : { x: 0, y: 380, s: 1.3, col: P2.rose, flap: Math.sin(t) > .9 ? t * 20 : 0 } }); });
  if (v === 1 && k < 3) g.L(.9, () => { chain(g, 120, 560, 9, .35, k === 2); chain(g, 600, 560, 9, -.35, false); });
  if (v === 1 && k === 3) g.txt('I can still refuse', 360, 790, 26, P2.brassL, { italic: true });
  if (v === 0) g.txt('GOLD', 360, 790, 40, P2.brass, { italic: true, ls: 14, stroke: P2.ink, lw: 8 }); };

// ---------- post-chorus + verse 2 ----------
SC.neon_free = g => { const { c, t } = g; g.bg('#1a0a28', '#2a1040'); for (let r = 0; r < 14; r++) for (let q = 0; q < 6; q++) { g.c.fillStyle = (r + q) % 2 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.03)'; g.c.fillRect(q * 125 - (r % 2) * 60, r * 62, 120, 58); }
  const fl = Math.sin(t * 40) > .92 ? .35 : 1;
  for (const [txt, x, y, s, a] of [['FREE', 360, 280, 150, 1], ['FREE', 360, 460, 110, .5], ['FREE', 360, 590, 80, .25]]) { g.glow(x, y, 300, P2.rose, .35 * a * fl); g.txt(txt, x, y, s, `rgba(255,${160 + 60 * g.pulse | 0},200,${a * fl})`, { italic: true, stroke: P2.rose, lw: 8 }); }
  g.txt('tell me what it means', 360, 740, 26, P2.lilac, { mono: true, ls: 4 }); g.cage(620, 80, .45, { swing: g.sw * .05 }); };
SC.vendor = g => { const { c, t } = g, v = g.p.v; g.bg('#26103a', '#3d1a58');
  g.L(.4, () => { for (let i = 0; i < 9; i++) g.paper(cc => { cc.moveTo(i * 90 - 20, 120); cc.lineTo(i * 90 + 70, 120); cc.lineTo(i * 90 + 70, 190); cc.quadraticCurveTo(i * 90 + 25, 230, i * 90 - 20, 190); cc.closePath(); }, i % 2 ? P2.rose : P2.bone, { blur: 10 }); });
  g.L(.7, () => { g.paper(cc => cc.rect(80, 560, 560, 120), '#6b2f8d', { blur: 16 }); const jars = [['FREEDOM', P2.rose], ['DREAMS', P2.brass], ['HOPE', P2.lilac], ['TRUTH', '#8ad6c8']];
    jars.forEach(([lb, col], i) => { const x = 140 + i * 130; g.paper(cc => cc.roundRect(x, 440, 90, 120, 14), col, { blur: 10 }); g.paper(cc => cc.rect(x + 10, 428, 70, 16), P2.brassD, { sh: false }); g.txt(lb, x + 45, 505, 14, P2.ink, { mono: true, w: 500 }); g.paper(cc => cc.roundRect(x + 14, 530, 62, 22, 4), P2.bone, { sh: false }); g.txt('$' + (9 + i * 20) + '.99', x + 45, 541, 13, P2.ink, { mono: true }); });
    g.person(360, 560, 78, P2.bone, { arm: .6 + Math.sin(t * 3) * .3 }); });
  if (v === 1) for (let i = 0; i < 6; i++) { const k = (t * .5 + i / 6) % 1; g.coin(30 + k * 330, 700 - Math.sin(k * 3.14) * 160 + (i % 2) * 20, 18, t * 7 + i); g.person(30 + i * 5, 840, 40, '#1a0b27'); }
  g.txt(v ? 'EVERYBODY BUYING' : 'EVERYBODY SELLING', 360, 780, 22, P2.brass, { mono: true, ls: 5 }); g.cage(620, 280, .5, { swing: g.sw * .05 }); };
SC.corner = g => { const { c, t } = g, v = g.p.v; g.bg('#0f0818', '#1f0e32'); g.city(640, '#1c0e2e', 11, 160, 420, '#ffd089');
  g.L(.5, () => { g.line(150, 60, 150, 740, 10, '#3b2a50'); g.paper(cc => cc.rect(128, 60, 70, 20), '#3b2a50', { blur: 4 }); g.glow(160, 90, 200, '#ffd089', .5); });
  g.L(.8, () => { g.paper(cc => cc.rect(0, 700, 720, 140), '#241238', { blur: 10 }); g.paper(cc => { cc.moveTo(300, 740); cc.lineTo(480, 740); cc.lineTo(490, 600); cc.lineTo(290, 600); cc.closePath(); }, '#b78e5c', { blur: 14, dy: 10 }); g.txt('CONSTITUTION', 390, 640, 22, P2.ink, { mono: true, rot: -.02, ls: 1, w: 500 }); for (let i = 0; i < 3; i++) g.line(318, 668 + i * 14, 460 - i * 30, 668 + i * 14, 2, 'rgba(11,4,20,.55)');
    g.person(390, 740, 70, '#3d2a58'); g.paper(cc => cc.roundRect(520, 700, 56, 40, 6), '#5a5a70', { blur: 6 }); if (v === 1) for (let i = 0; i < 4; i++) g.coin(534 + i * 8, 700 - i * 3 + (i === 3 ? Math.sin(t * 6) * 2 : 0), 8, 0); });
  g.txt(v ? 'ASKING FOR A SOLUTION' : 'A CARDBOARD CONSTITUTION', 360, 790, 18, P2.lilac, { mono: true, ls: 4 }); g.cage(620, 70, .45, { swing: g.sw * .05 }); };
SC.billboard = g => { const { c, t } = g, v = g.p.v; g.bg('#0f1a3a', '#3a1a5a'); g.city(760, '#150a22', 31, 80, 240, '#ffd089');
  g.L(.7, () => { g.line(240, 620, 240, 840, 14, '#2a1a40'); g.line(480, 620, 480, 840, 14, '#2a1a40'); g.paper(cc => cc.roundRect(70, 120, 580, 400, 14), '#2a1a40', { blur: 22, dy: 14 }); g.paper(cc => cc.roundRect(88, 138, 544, 364, 8), '#fff4de', { sh: false });
    for (let i = 0; i < 12; i++) g.glow(88 + i * 50, 126, 26, '#ffe9b0', .6 + .4 * Math.sin(t * 5 + i));
    g.txt('YOUR HAPPINESS', 360, 190, 48, P2.roseD, { italic: true }); g.txt('AWAITS', 360, 245, 48, P2.roseD, { italic: true });
    g.paper(cc => cc.rect(150, 290, 420, 170), '#c9b6ea', { sh: false }); for (let i = 0; i < 4; i++) { g.paper(cc => cc.rect(170 + i * 100, 308, 80, 80), '#ffd48a', { sh: false, edge: '#7a5a2a', lw: 3 }); } g.paper(cc => cc.rect(160, 405, 400, 50), '#8a45b0', { sh: false }); g.paper(cc => cc.roundRect(200, 380, 140, 40, 10), P2.rose, { sh: false });
    const n = 4950 + Math.floor(t * 17) % 10; g.paper(cc => cc.roundRect(430, 330, 190, 56, 8), P2.ink, { sh: false }); g.txt('$' + n + '/mo', 525, 358, 26, P2.brass, { mono: true }); });
  g.txt(v ? 'A DIGIT ON THE RATES' : 'LUXURY APARTMENT', 360, 790, 20, P2.brass, { mono: true, ls: 5 }); g.cage(90, 60, .4, { swing: g.sw * .05 }); };
SC.classroom = g => { const { c, t } = g, v = g.p.v; g.bg('#1f1236', '#3a2358');
  g.L(.4, () => { g.paper(cc => cc.roundRect(70, 60, 580, 260, 10), '#14301f', { blur: 14, edge: '#8a6a44', lw: 8 }); g.txt('2 + 2 = ?', 360, 150, 54, 'rgba(234,223,246,.8)', { italic: true, rot: -.01 }); g.txt('WHO DECIDES WHAT’S BEST?', 360, 250, 22, 'rgba(234,223,246,.5)', { mono: true, ls: 3 }); });
  g.L(.8, () => { for (let r = 0; r < 2; r++) for (let q = 0; q < 4; q++) { const x = 100 + q * 165, y = 520 + r * 130; g.paper(cc => cc.rect(x - 60, y, 120, 20), '#9a7248', { blur: 8 }); g.line(x - 50, y + 20, x - 50, y + 70, 5, '#6a4a2a'); g.line(x + 50, y + 20, x + 50, y + 70, 5, '#6a4a2a'); if (q !== 2 || r !== 0) g.person(x, y + 2, 34, '#4a2a68'); }
    g.person(360 + 0, 500, 40, P2.bone); g.paper(cc => { cc.rect(230, 440, 100, 60); }, P2.bone, { blur: 8, dy: 4 }); g.txt('TEST', 280, 462, 18, P2.roseD, { mono: true }); g.txt('A+', 300, 488, 22, P2.rose, { italic: true }); });
  if (v === 1) { const d = Math.sin(t * 2) * 12; g.L(.9, () => { g.paper(cc => cc.roundRect(500, 220 + d, 110, 150, 30), '#e6bfae', { blur: 14, dy: 8 }); g.paper(cc => cc.rect(530, 340 + d, 50, 70), P2.rose, { blur: 8 }); g.txt('BEST', 555, 395 + d, 18, P2.bone, { mono: true, w: 500 }); }); }
  g.cage(620, 60, .45, { swing: g.sw * .05 }); };
SC.mother = g => { const { c, t } = g, v = g.p.v; g.bg('#241036', '#44205c');
  g.L(.5, () => { g.circ(200, 300, 150, P2.bone); g.ring(200, 300, 150, 8, P2.brassD); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; g.line(200 + Math.cos(a) * 126, 300 + Math.sin(a) * 126, 200 + Math.cos(a) * 140, 300 + Math.sin(a) * 140, 4, P2.ink); } const ha = t * .5, ma = t * 6; g.line(200, 300, 200 + Math.cos(ha) * 70, 300 + Math.sin(ha) * 70, 9, P2.ink); g.line(200, 300, 200 + Math.cos(ma) * 110, 300 + Math.sin(ma) * 110, 5, P2.rose); g.circ(200, 300, 9, P2.ink);
    g.txt('DOUBLES', 200, 490, 32, P2.brass, { mono: true, ls: 5 }); g.person(500, 700, 110, P2.lilac); g.paper(cc => cc.roundRect(520, 590, 66, 74, 8), P2.brassD, { blur: 8 }); });
  g.L(.8, () => { g.phone(560, 340, 150, 270, '#1a0b2c', { draw: (x, y, w, h) => { g.txt('30', x + w / 2, y + 90, 62, P2.brass, { italic: true }); g.txt('DAYS', x + w / 2, y + 138, 26, P2.bone, { mono: true }); g.txt(v ? '🎉 you did it!' : 'streak', x + w / 2, y + 190, 16, P2.rose, { mono: true }); } }); });
  if (v === 1) for (let i = 0; i < 40; i++) { const k = (t * .5 + g.rnd(i)) % 1; g.c.fillStyle = [P2.rose, P2.brass, P2.lilac][i % 3]; g.c.fillRect(480 + g.rnd(i + 1) * 160 + Math.sin(t * 4 + i) * 14, 220 + k * 520, 7, 11); }
  g.cage(90, 70, .45, { swing: g.sw * .05 }); };
SC.rec = g => { const { c, t } = g, v = g.p.v; g.bg('#140a22', '#2a1244');
  g.L(.6, () => { g.phone(360, 420, 330, 620, '#1b0e2e', { draw: (x, y, w, h) => {
      if (v === 0 || v === 2) { g.city(h + y - 20, '#2a1244', 7, 90, 260, '#ffd089'); g.person(x + w / 2, y + h - 10, 80, '#c9b6ea'); }
      if (v === 1) { g.paper(cc => { cc.moveTo(x + w / 2, y + 120); cc.quadraticCurveTo(x + w / 2 + 70, y + 240, x + w / 2, y + 290); cc.quadraticCurveTo(x + w / 2 - 70, y + 240, x + w / 2, y + 120); }, '#7ad0ff', { sh: false }); g.txt('STORY', x + w / 2, y + 400, 44, P2.rose, { italic: true }); for (let i = 0; i < 5; i++) g.sparkle(x + 50 + i * 55, y + 470, 14, P2.brass); g.txt('worth rewarding', x + w / 2, y + 520, 16, P2.lilac, { mono: true }); }
      if (v === 2) { for (const [lb, yy, col] of [['#filter', 120, P2.rose], ['caption…', 200, P2.brass], ['#compassion', 280, P2.lilac]]) { const sl = Math.min(1, (t * 1.2 + yy / 90) % 3); g.paper(cc => cc.roundRect(x + 20 + (1 - g.ease(sl)) * 300, y + yy, 230, 56, 28), col, { sh: false }); g.txt(lb, x + 135 + (1 - g.ease(sl)) * 300, y + yy + 28, 22, P2.ink, { mono: true, w: 500 }); } }
      if (v === 3) { g.txt('♥', x + w / 2, y + 220, 150, P2.rose, { w: 900 }); g.txt(String(1000 + Math.floor(t * 31) % 9000), x + w / 2, y + 380, 70, P2.bone, { mono: true, w: 500 }); g.txt('NUMBERS', x + w / 2, y + 450, 22, P2.lilac, { mono: true, ls: 6 }); g.txt('😞', x + w / 2, y + 520, 50, P2.bone, {}); }
      g.c.strokeStyle = P2.bone; g.c.lineWidth = 3; for (const [cx, cy, sx, sy] of [[x + 14, y + 14, 1, 1], [x + w - 14, y + 14, -1, 1], [x + 14, y + h - 14, 1, -1], [x + w - 14, y + h - 14, -1, -1]]) { g.c.beginPath(); g.c.moveTo(cx, cy + sy * 28); g.c.lineTo(cx, cy); g.c.lineTo(cx + sx * 28, cy); g.c.stroke(); } } });
    g.cage(360, 62, .5, { swing: g.sw * .05 }); });
  const on = Math.sin(t * 5) > -.2; g.circ(560, 140, 12, on ? P2.rose : '#5a1a3a'); g.txt('REC', 600, 141, 20, P2.bone, { mono: true, ls: 3, align: 'left' }); };
SC.megaphone = g => { const { c, t } = g, v = g.p.v; g.bg('#26103a', '#40195a'); rayfan(g, 160, 420, P2.rose, .07 + .06 * g.pulse, 0);
  g.L(.7, () => { c.save(); c.translate(180, 430); c.rotate(-.1 + Math.sin(t * 2) * .02); g.paper(cc => { cc.moveTo(-90, -40); cc.lineTo(200, -150); cc.lineTo(200, 150); cc.lineTo(-90, 40); cc.closePath(); }, P2.brass, { blur: 20, dy: 12, edge: P2.brassD, lw: 4 }); g.paper(cc => cc.roundRect(-160, -50, 90, 100, 20), P2.rose, { blur: 10 }); g.paper(cc => cc.ellipse(205, 0, 28, 152, 0, 0, 6.3), P2.brassD, { sh: false }); c.restore();
    for (let i = 0; i < 5; i++) { const k = (t * 1.4 + i / 5) % 1; c.strokeStyle = `rgba(255,227,154,${1 - k})`; c.lineWidth = 7; c.beginPath(); c.arc(380, 430, 40 + k * 300, -.7, .7); c.stroke(); } });
  if (v === 1) for (let i = 0; i < 10; i++) { const k = (t * .8 + i / 10) % 1; g.coin(400 + k * 300, 430 + (g.rnd(i) - .5) * 300 * k, 16 + 6 * k, t * 8 + i); }
  if (v === 2) { g.L(.9, () => { g.phone(580, 640, 120, 200, '#1a0b2c', { draw: (x, y, w, h) => g.txt('©', x + w / 2, y + h / 2, 50, P2.brass, {}) }); g.line(580, 740, 580, 800, 8, P2.lilac); g.paper(cc => cc.roundRect(430, 790, 300, 60, 8), '#3b1d5c', { sh: false }); g.txt('SYSTEM-OWNED', 580, 760, 18, P2.rose, { mono: true, ls: 3 }); }); }
  if (v === 3) { for (let i = 0; i < 8; i++) { const h = 40 + i * 52 + Math.sin(t * 4 + i) * 10; g.paper(cc => cc.rect(420 + i * 34, 780 - h, 26, h), P2.rose, { blur: 6 }); g.txt('$' + (i + 1) * 10, 433 + i * 34, 770 - h, 13, P2.bone, { mono: true }); } g.txt('PRICE ↑', 580, 200, 40, P2.brass, { italic: true }); }
  g.cage(600, 90, .45, { swing: g.sw * .05 }); };
SC.door = g => { const { c, t } = g, v = g.p.v, open = v ? g.ease(g.u * 1.4) : g.ease(g.u * .6) * .25; g.bg('#1b0c2c', '#3b1a58');
  g.glow(360, 430, 360, '#ffe9b0', .15 + .45 * open);
  g.L(.5, () => { g.paper(cc => cc.rect(190, 90, 340, 640), '#2a1740', { blur: 20, dy: 10, edge: P2.brassD, lw: 8 }); g.paper(cc => cc.rect(206, 106, 308, 624), '#fff1c8', { sh: false });
    // light path on the floor
    g.paper(cc => { cc.moveTo(220, 730); cc.lineTo(500, 730); cc.lineTo(560 + open * 60, 830); cc.lineTo(160 - open * 60, 830); cc.closePath(); }, `rgba(255,233,176,${.2 + .5 * open})`, { sh: false });
    const w = 308 * (1 - open * .8); g.paper(cc => { cc.moveTo(206, 106); cc.lineTo(206 + w, 106 + open * 30); cc.lineTo(206 + w, 730 - open * 30); cc.lineTo(206, 730); cc.closePath(); }, '#4a2a22', { blur: 14, dx: 10 }); g.circ(206 + w - 24, 430, 9, P2.brass); if (!v) { g.circ(206 + w - 24, 470, 6, '#111'); }
    for (let i = 0; i < 4; i++) g.line(226, 170 + i * 135, 206 + w - 20, 170 + i * 135, 2, 'rgba(0,0,0,.25)'); });
  if (v === 1) { g.L(.9, () => { const x = 360 + Math.sin(t * 1.5) * 8; g.person(x, 790 - open * 40, 70 - open * 14, '#0b0414'); for (let i = 0; i < 4; i++) g.paper(cc => cc.ellipse(250 + i * 70, 810 - (i % 2) * 8, 12, 6, 0, 0, 6.3), 'rgba(11,4,20,.5)', { sh: false }); }); }
  g.txt(v ? 'WALK YOURSELF' : 'A DOOR?', 360, 790, 24, P2.brass, { mono: true, ls: 6 }); g.cage(110, 90, .45, { swing: g.sw * .05, state: v ? 'open' : 'closed' }); };

// ---------- bridge ----------
SC.blame = g => { const { c, t } = g, v = g.p.v; g.bg('#16091f', '#2d1238');
  g.L(.6, () => {
    if (v === 0) { g.paper(cc => cc.rect(250, 440, 220, 300), '#5b2a7a', { blur: 18 }); for (let i = 0; i < 5; i++) g.line(250 + i * 55, 440, 250 + i * 55, 740, 3, 'rgba(0,0,0,.2)'); g.person(360, 440, 80, P2.bone); g.paper(cc => { cc.moveTo(120, 100); cc.lineTo(120, 260); cc.moveTo(120, 100); cc.lineTo(250, 130); cc.lineTo(120, 160); }, P2.rose, { blur: 6 }); }
    if (v === 1) { g.paper(cc => { cc.moveTo(260, 330); cc.lineTo(460, 330); cc.lineTo(440, 120); cc.lineTo(280, 120); cc.closePath(); }, P2.ink, { blur: 14, edge: P2.brass, lw: 3 }); g.paper(cc => cc.rect(236, 326, 248, 22), P2.ink, { blur: 10 }); g.person(360, 760, 120, P2.bone); for (let i = 0; i < 5; i++) g.paper(cc => cc.roundRect(60 + i * 130, 650 - (i % 2) * 40, 110, 110, 40), '#2e7d4f', { blur: 10 }), g.txt('$', 115 + i * 130, 705 - (i % 2) * 40, 54, P2.bone, {}); }
    if (v === 2) { g.paper(cc => cc.roundRect(120, 160, 480, 340, 30), '#241038', { blur: 20, edge: P2.brassD, lw: 8 }); g.paper(cc => cc.roundRect(142, 182, 436, 296, 18), '#2a2060', { sh: false }); g.person(360, 480, 92, P2.bone); g.paper(cc => cc.rect(320, 510, 80, 30), P2.rose, { sh: false }); g.txt('BREAKING', 360, 205, 22, P2.rose, { mono: true, ls: 4 }); for (let i = 0; i < 3; i++) g.line(220, 560 + i * 40, 500, 560 + i * 40, 4, P2.lilac); g.line(280, 540, 440, 540, 12, P2.rose); }
    if (v === 3) { for (let r = 0; r < 3; r++) for (let q = 0; q < 6; q++) { const x = 60 + q * 108 + r * 20, y = 330 + r * 140; g.paper(cc => { cc.moveTo(x, y); cc.lineTo(x + 70, y); cc.lineTo(x + 70, y + 60); cc.lineTo(x, y + 60); cc.closePath(); }, '#5b2a7a', { blur: 8 }); g.paper(cc => cc.rect(x, y - 60, 70, 60), '#43206b', { blur: 8 }); if (g.rnd(r * 6 + q) > .5) g.person(x + 35, y + 6, 24, P2.bone); } } });
  // the accusing finger
  const aim = v === 3 ? 1 : 0; g.L(.95, () => { c.save(); c.translate(360, 840); c.rotate(-.12 + Math.sin(t * 3) * .03); g.paper(cc => { cc.roundRect(-60, -90, 120, 160, 40); }, '#e6bfae', { blur: 14, dy: 6 }); g.paper(cc => cc.roundRect(-18, -300 - Math.sin(t * 6) * 6 * g.pulse, 36, 230, 18), '#efcdbc', { blur: 10, dy: 4 }); c.restore(); });
  g.txt(['I BLAMED THE POLITICIANS', 'I BLAMED THE BILLIONAIRES', 'I BLAMED THE TALKING HEADS', 'I BLAMED EVERYBODY IN THEIR CHAIRS'][v], 360, 48, 17, P2.rose, { mono: true, ls: 3 }); };
SC.fire = g => { const { c, t } = g, v = g.p.v; g.bg('#1a0a14', '#3a1520'); g.glow(360, 520, 420, '#ff7a3a', .28 + .1 * g.pulse);
  const flame = (x, y, s) => { for (const [col, k] of [['#b92a2a', 1], ['#ff6a3a', .8], ['#ffb347', .56], ['#fff1b0', .3]]) g.paper(cc => { const w = 80 * s * k, h = 240 * s * k * (1 + .08 * Math.sin(t * 9 + k * 5)); cc.moveTo(x - w, y); cc.quadraticCurveTo(x - w * 1.2, y - h * .5, x + Math.sin(t * 6) * 14, y - h); cc.quadraticCurveTo(x + w * 1.2, y - h * .5, x + w, y); cc.closePath(); }, col, { sh: false }); };
  g.L(.7, () => {
    if (v === 0) { g.paper(cc => cc.rect(210, 590, 300, 60), '#d8c8a0', { blur: 12 }); g.paper(cc => cc.rect(230, 640, 260, 50), '#c0ae88', { blur: 12 }); flame(360, 600, 1.7); for (let i = 0; i < 8; i++) { const k = (t * .6 + i / 8) % 1; g.circ(340 + Math.sin(i * 4 + t) * 60, 500 - k * 360, 3, '#ffd089'); } }
    if (v === 1) { g.paper(cc => cc.rect(346, 380, 28, 400), '#6a4a2a', { blur: 8 }); g.paper(cc => { cc.moveTo(374, 400); cc.lineTo(580, 400); cc.lineTo(610, 450); cc.lineTo(574, 500); cc.lineTo(374, 500); cc.closePath(); }, P2.rose, { blur: 10 }); g.txt('LEFT', 150, 450, 40, P2.bone, { italic: true }); g.txt('RIGHT', 480, 450, 40, P2.ink, { italic: true }); g.paper(cc => { cc.moveTo(346, 520); cc.lineTo(140, 520); cc.lineTo(110, 570); cc.lineTo(146, 620); cc.lineTo(346, 620); cc.closePath(); }, P2.brass, { blur: 10 }); g.txt('A', 250, 570, 40, P2.ink, { italic: true }); g.txt('B', 500, 450 + 0, 1, P2.ink, {}); flame(150, 290, .8); flame(570, 290, .8); g.txt('CHOSE A SIDE', 360, 700, 34, P2.brass, { italic: true }); }
    if (v === 2) { c.save(); c.translate(360, 430); c.rotate(-.05 + Math.sin(t * 2) * .01); g.paper(cc => cc.rect(-230, -230, 460, 460), '#efe6d2', { blur: 22, dy: 12 }); g.txt('SHARED!!', 0, -170, 60, P2.roseD, { italic: true }); g.line(-190, -120, 190, -120, 5, P2.ink); g.paper(cc => cc.rect(-190, -100, 190, 130), '#a08a6a', { sh: false }); for (let i = 0; i < 6; i++) g.line(20, -90 + i * 20, 190, -90 + i * 20, 5, '#555'); for (let i = 0; i < 4; i++) g.line(-190, 60 + i * 24, 190, 60 + i * 24, 5, '#777'); g.txt('99K SHARES', 100, 190, 22, P2.roseD, { mono: true, w: 500 }); c.restore(); }
    if (v === 3) { c.save(); c.translate(360, 430); c.rotate(-.04); g.paper(cc => cc.rect(-230, -230, 460, 460), '#efe6d2', { blur: 22, dy: 12 }); for (let i = 0; i < 9; i++) g.line(-190, -180 + i * 30, 190 - (i % 3) * 40, -180 + i * 30, 5, '#8a7a5a'); const s = 1 + .25 * Math.exp(-((g.u * 1.4) % 1) * 10); c.rotate(.28); c.scale(s, s); g.paper(cc => cc.roundRect(-190, -50, 380, 100, 10), 'rgba(0,0,0,0)', { sh: false, edge: P2.rose, lw: 9 }); g.txt('UNVERIFIED', 0, 3, 60, P2.rose, { italic: true }); c.restore(); }
  }); g.cage(620, 80, .45, { swing: g.sw * .05 }); };
SC.gears = g => { const { c, t } = g, v = g.p.v; g.bg('#140a1e', '#2a1238');
  g.L(.4, () => { g.gear(120, 200, 140, 14, t * .4, '#2f1648'); g.gear(600, 300, 170, 16, -t * .33, '#34184f'); g.gear(150, 700, 120, 12, -t * .45, '#2f1648'); });
  g.L(.8, () => { g.gear(360, 410, 220, 18, t * (v ? .6 : .3), '#5b2a7a'); g.gear(580, 640, 90, 10, -t * (v ? 1.1 : .55), P2.brassD); g.gear(120, 560, 80, 9, -t * .7, P2.brassD); g.cage(360, 250, .75, { swing: 0, state: 'closed' });
    for (let i = 0; i < 8; i++) { const a = t * (v ? .6 : .3) + i / 8 * 6.2832; g.line(360 + Math.cos(a) * 60, 410 + Math.sin(a) * 60, 360 + Math.cos(a) * 190, 410 + Math.sin(a) * 190, 5, 'rgba(255,227,154,.25)'); } });
  if (v === 1) { g.paper(cc => cc.rect(0, 770, 720, 60), '#2a1a40', { sh: false }); for (let i = 0; i < 12; i++) g.line(((i * 60 - t * 80) % 780 + 780) % 780 - 30, 785, ((i * 60 - t * 80) % 780 + 780) % 780 - 10, 785, 8, P2.brass); g.txt('THE MACHINE I CRITICIZED', 360, 60, 20, P2.rose, { mono: true, ls: 4 }); }
  else g.txt('EVERY GEAR', 360, 60, 28, P2.rose, { mono: true, ls: 8 }); };

// ---------- verse 3: the city breathes ----------
SC.city = g => { const { c, t } = g, v = g.p.v, br = 1 + .012 * Math.sin(t * 1.2) + .03 * g.low; const k = g.clamp((t - 209) / 40); g.bg(g.mix('#1a0c2e', '#3a2a68', k), g.mix('#2c1448', '#ff9a8a', k * .8)); g.glow(360, 520, 420, '#ffd9a0', .1 + .3 * k);
  g.c.save(); g.c.translate(360, 830); g.c.scale(br, br); g.c.translate(-360, -830); g.city(780, g.mix('#2a1244', '#4a2a78', k), 3, 100, 360, '#ffd89a'); g.city(820, '#150a22', 60, 60, 220, null); g.c.restore();
  g.L(.9, () => {
    const pair = (a, b, linked) => { g.person(a, 800, 100, '#e2d3f5'); g.person(b, 800, 100, '#c8b0ee'); if (linked) { g.line(a + 40, 640, b - 40, 640, 5, P2.brass); g.sparkle((a + b) / 2, 640, 14 + 5 * g.pulse, P2.brassL); } };
    if (v === 0) { g.cage(560, 90, .6, { state: 'open', swing: g.sw * .04 }); g.paper(cc => cc.roundRect(300, 560, 90, 150, 14), '#0d0618', { blur: 8, edge: P2.brassD }); g.line(360, 740, 460, 810, 6, P2.bone); g.txt('PHONE DOWN', 360, 80, 30, P2.brass, { mono: true, ls: 6 }); }
    if (v === 1) pair(200, 520, false); if (v === 2) { pair(200, 520, false); g.txt('?', 360, 520, 120, P2.rose, { italic: true }); g.txt('VOTED / EARNED', 360, 70, 22, P2.lilac, { mono: true, ls: 4 }); }
    if (v === 3) { pair(200, 520, true); g.paper(cc => cc.roundRect(310, 520, 100, 70, 6), P2.bone, { blur: 8 }); g.txt('learned', 360, 556, 16, P2.ink, { mono: true }); }
    if (v === 4) { g.bubble(220, 560, 220, 80, P2.bone, { text: 'hey…', size: 32, tail: 1 }); g.bubble(500, 610, 220, 80, P2.brass, { text: 'hey.', size: 32, tail: -1 }); g.paper(cc => cc.roundRect(250, 80, 220, 70, 8), 'rgba(0,0,0,0)', { sh: false, edge: P2.lilac, lw: 3 }); g.txt('CORPORATION', 360, 116, 26, P2.lilac, { mono: true }); g.line(250, 80, 470, 150, 6, P2.rose); }
    if (v === 5) { for (const [lb, x] of [['RECOMMENDED', 200], ['MONETIZED', 500]]) { g.paper(cc => cc.roundRect(x - 100, 520, 200, 60, 30), '#3b1d5c', { sh: false }); g.txt(lb, x, 550, 18, P2.lilac, { mono: true }); g.line(x - 100, 520, x + 100, 580, 6, P2.rose); } g.bubble(360, 700, 260, 80, P2.bone, { text: 'just talk', size: 30 }); }
    if (v === 6) { g.txt('NOTHING CHANGED', 360, 120, 34, P2.bone, { italic: true }); g.cage(360, 220, .8, { state: 'open', swing: 0 }); }
    if (v === 7) { pair(220, 500, true); g.person(360, 800, 70, 'rgba(255,227,154,.0)'); g.txt('a human saw a human', 360, 120, 28, P2.brassL, { italic: true }); }
    if (v === 8) { chain(g, 200, 120, 6, .0, true); chain(g, 520, 120, 6, .0, false); g.txt('NOT A HASHTAG', 360, 560, 44, P2.rose, { italic: true, stroke: P2.ink, lw: 8 }); g.txt('THE REVOLUTION', 360, 620, 28, P2.bone, { mono: true, ls: 6 }); }
    if (v === 9) { g.paper(cc => { cc.rect(350, 360, 20, 380); cc.rect(260, 420, 200, 20); }, '#b78e5c', { blur: 10 }); g.paper(cc => cc.arc(360, 330, 36, 0, 6.3), '#d8b48a', { blur: 8 }); g.txt('ENEMY', 360, 340, 18, P2.ink, { mono: true }); g.txt('manufactured', 360, 790, 20, P2.lilac, { mono: true, ls: 5 }); }
    if (v === 10) { g.paper(cc => { cc.moveTo(300, 420); cc.lineTo(420, 420); cc.lineTo(450, 700); cc.lineTo(270, 700); cc.closePath(); }, '#2a2a40', { blur: 14, edge: P2.brass, lw: 2 }); g.paper(cc => cc.moveTo(360, 420), 'rgba(0,0,0,0)'); g.line(360, 420, 360, 380, 6, P2.brass); g.paper(cc => cc.arc(360, 372, 12, 0, 6.3), 'rgba(0,0,0,0)', { sh: false, edge: P2.brass, lw: 5 }); g.txt('NO SAVIOR', 360, 790, 26, P2.rose, { mono: true, ls: 5 }); g.txt('✕', 360, 540, 150, 'rgba(255,79,139,.8)', {}); }
    if (v === 11) { g.person(360, 800, 150, P2.bone); g.glow(360, 520, 280, '#ffe9b0', .4); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832 + t; g.sparkle(360 + Math.cos(a) * 190, 540 + Math.sin(a) * 190, 10, P2.brassL); } g.txt('COURAGE', 360, 70, 38, P2.brass, { italic: true, ls: 6 }); }
  }); if (v !== 0) g.cage(80, 70, .42, { state: 'open', swing: g.sw * .04 }); };
})();
