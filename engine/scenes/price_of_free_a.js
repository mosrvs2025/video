// ===== Scenes for "The Price of Free" (part A: verse 1 + framing scenes) =====
// Every scene = g => {...} using the paper-cut kit in core.js. g.p = {v: variant, c: chorus state, ...}, g.u = progress through the line.
(() => {
const SC = window.SC;
const STATE = ['closed', 'locked', 'cracked', 'open'];
const rays = (g, cx, cy, n, col, a, rot) => { const c = g.c; c.save(); c.globalAlpha = a; c.fillStyle = col; for (let i = 0; i < n; i++) { const a0 = rot + i / n * 6.2832, a1 = a0 + 3.1416 / n; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a0) * 1200, cy + Math.sin(a0) * 1200); c.lineTo(cx + Math.cos(a1) * 1200, cy + Math.sin(a1) * 1200); c.closePath(); c.fill(); } c.restore(); };
const dust = (g, n, col = '#ffe9b0', a = .5) => { const c = g.c; for (let i = 0; i < n; i++) { const x = (g.rnd(i) * 760 + g.t * (6 + g.rnd(i + 9) * 10)) % 760 - 20, y = (g.rnd(i + 40) * 860 - g.t * (4 + g.rnd(i + 5) * 8) + 1720) % 860; c.globalAlpha = a * (.4 + .6 * Math.abs(Math.sin(g.t + i))); c.fillStyle = col; c.beginPath(); c.arc(x, y, 1 + g.rnd(i + 3) * 2, 0, 6.28); c.fill(); } c.globalAlpha = 1; };
const drapes = (g, col) => { // velvet curtains with folds on both sides
  for (const s of [-1, 1]) { const x0 = s < 0 ? 0 : 720; g.L(.5, () => { g.paper(c => { c.moveTo(x0, -20); c.lineTo(x0 + s * -150, -20); c.quadraticCurveTo(x0 + s * -110, 400, x0 + s * -170, 860); c.lineTo(x0, 860); c.closePath(); }, col, { blur: 22, dx: s * -8 });
    for (let k = 0; k < 4; k++) g.line(x0 + s * -(30 + k * 32), 0, x0 + s * -(24 + k * 30), 830, 2, 'rgba(0,0,0,.25)'); }); } };

// ---------- framing ----------
SC.overture = g => {
  const { c, t } = g; g.bg('#0e0618', '#2a1244');
  dust(g, 40);
  for (let i = 0; i < 9; i++) { const k = (t * .12 + i / 9) % 1, x = 60 + g.rnd(i) * 600, y = 760 - k * 780; c.globalAlpha = Math.sin(k * 3.14) * .9; g.bubble(x, y, 120, 34, i % 3 ? P2.bone : P2.rose, { size: 15, text: ['ding', '+1 like', 'new msg', '!!', 'sale -50%', 'ping', 'you won', 'u up?', 'alert'][i], tail: 1 }); c.globalAlpha = 1; }
  const k = g.thump; g.glow(360, 350, 300 + 60 * k, '#ff4f8b', .22 * (.4 + k));
  g.cage(360, 40, 1.35, { swing: Math.sin(t * 1.1) * .04, bird: { x: 0, y: 360, s: 1.2, col: P2.rose, flap: t * 3 } });
  const a = g.ease((t - 1.5) / 1.5);
  c.globalAlpha = a; g.txt('THE PRICE', 360, 610, 78, P2.bone, { italic: true, ls: 2, stroke: '#0b0414', lw: 8 }); g.txt('OF FREE', 360, 690, 78, P2.rose, { italic: true, ls: 2, stroke: '#0b0414', lw: 8 });
  g.txt('A FILM IN ONE CAGE', 360, 760, 15, P2.brass, { mono: true, w: 500, ls: 6 }); c.globalAlpha = 1;
};
const P2 = window.P || (window.P = { aub: '#150a22', aub2: '#241038', aub3: '#3a1a55', plum: '#5b2a7a', brass: '#f0b43c', brassD: '#b97d1c', brassL: '#ffe39a', rose: '#ff4f8b', roseD: '#b92a62', bone: '#eadff6', lilac: '#a58bd0', ink: '#0b0414' });

SC.cozy = g => {
  const { c, t } = g, v = g.p.v; g.bg('#1b0c2c', '#3a1a55');
  g.L(.2, () => { rays(g, 360, 120, 14, '#ffd89a', .05, t * .03); });
  drapes(g, '#3b1458');
  dust(g, 30);
  // table with cloth
  g.L(.8, () => { g.paper(c => { c.moveTo(60, 640); c.lineTo(660, 640); c.lineTo(700, 840); c.lineTo(20, 840); c.closePath(); }, '#6b2f8d', { blur: 20 });
    g.paper(c => c.rect(60, 632, 600, 16), '#8a45b0', { blur: 6, dy: 3 });
    for (let k = 0; k < 7; k++) g.line(110 + k * 85, 650, 90 + k * 90, 840, 2, 'rgba(0,0,0,.2)'); });
  const lvl = v === 2 ? g.clamp((t - 27.5) / 24) * .75 + .25 : v === 1 ? .12 : 0;
  g.L(.55, () => {
    g.cage(360, 250, 1.2, { swing: Math.sin(t * .8) * .012, deco: lvl, bird: { x: 0, y: 370, s: 1.1, col: P2.rose, flap: Math.sin(t * 2) > .95 ? t * 20 : 0 } });
    if (v >= 1) { g.paper(c => { c.ellipse(360, 596, 55, 18, 0, 0, 6.3); }, P2.rose, { blur: 6, dy: 3 }); } // cushion
    if (v === 2) for (let i = 0; i < 6; i++) g.paper(c => { const x = 130 + i * 90; c.moveTo(x, 640); c.quadraticCurveTo(x - 20, 590 - g.rnd(i) * 40, x, 570 - g.rnd(i) * 40); c.quadraticCurveTo(x + 20, 590, x, 640); }, i % 2 ? P2.rose : P2.brass, { blur: 6 });
  });
  g.glow(360, 380, 260, '#ffd089', .13 + .04 * g.thump);
};

SC.alarm = g => {
  const { c, t } = g; g.bg('#2a0f2f', '#150a22'); rays(g, 360, 340, 18, P2.rose, .10 + .08 * g.pulse, t * .25);
  for (let i = 0; i < 4; i++) { const k = (t * 1.8 + i / 4) % 1; g.ring(360, 340, 90 + k * 380, 6 * (1 - k) + 1, `rgba(255,79,139,${(1 - k) * .8})`); }
  g.L(.3, () => { g.circ(360, 360, 175, '#1a0b27'); g.circ(360, 360, 165, P2.bone); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; g.line(360 + Math.cos(a) * 140, 360 + Math.sin(a) * 140, 360 + Math.cos(a) * 156, 360 + Math.sin(a) * 156, i % 3 ? 3 : 6, P2.ink); }
    g.line(360, 360, 360, 238, 9, P2.ink); g.line(360, 360, 360, 470, 7, P2.rose); g.circ(360, 360, 11, P2.ink); g.txt('6:00', 360, 465, 34, P2.roseD, { mono: true, w: 500, ls: 3 }); });
  const sh = Math.sin(t * 34) * .05 * (.6 + g.pulse);
  g.L(.6, () => { g.cage(360, 150, 1.0, { swing: sh });
    for (const s of [-1, 1]) { g.paper(c => { c.arc(360 + s * 52, 100, 38, Math.PI * (s < 0 ? 1 : 1.9), Math.PI * (s < 0 ? 2.1 : 3.0)); }, P2.brass, { blur: 8 }); } });
  g.txt('RIIIING', 360, 700, 74, P2.rose, { italic: true, stroke: P2.ink, lw: 10, rot: Math.sin(t * 30) * .02 });
};

SC.feed = g => {
  const { c, t } = g, v = g.p.v; g.bg('#160a24', '#2b1245');
  g.glow(360, 420, 380, v === 0 ? '#ff4f8b' : '#8a5bd0', .18 + .1 * g.low);
  const cols = ['#3a1a55', '#5b2a7a', '#2a1244', '#4a2268'];
  g.L(.5, () => {
    g.phone(360, 430, 300, 590, '#120820', { draw: (x, y, w, h) => {
      const off = (t * (v === 1 ? 190 : 120)) % 170;
      for (let i = -1; i < 5; i++) { const yy = y + i * 170 + off, id = Math.floor(i - (t * (v === 1 ? 190 : 120) - off) / 170);
        const red = v === 0 && g.rnd(id * 3) > .45;
        g.rr(x + 10, yy + 8, w - 20, 154, 12); c.fillStyle = red ? '#7a1a3a' : cols[((id % 4) + 4) % 4]; c.fill();
        c.fillStyle = red ? P2.rose : P2.lilac; c.fillRect(x + 22, yy + 20, 90, 9); c.fillRect(x + 22, yy + 36, 140, 7);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 22, yy + 58, w - 44, 80);
        if (red) { g.txt('!', x + w - 36, yy + 32, 34, P2.bone, {}); g.sparkle(x + w * .5, yy + 98, 20 + 6 * g.pulse, P2.rose); }
        else g.circ(x + w - 40, yy + 98, 18, P2.brassD); } } });
    g.cage(360, 62, .55, { swing: g.sw * .06 });  // phone as the perch
  });
  if (v === 0) { g.txt('MUTE', 120, 300, 30, P2.rose, { mono: true, rot: -.2, ls: 4 }); g.txt('$ SILENCE', 600, 560, 24, P2.brass, { mono: true, rot: .15, ls: 3 }); }
  if (v === 1) { const ty = 660 - Math.sin(t * 3.2) * 70; g.L(.9, () => { g.paper(c => c.ellipse(430, ty, 46, 74, -.35, 0, 6.3), '#e6bfae', { blur: 14, dy: 8 }); g.paper(c => c.ellipse(412, ty - 40, 14, 22, -.35, 0, 6.3), '#f3d6c8', { sh: false }); }); }
};

SC.windows = g => {
  const { c, t } = g; g.bg('#12081f', '#24103a');
  g.L(.4, () => { for (let r = 0; r < 6; r++) for (let q = 0; q < 5; q++) { const x = 42 + q * 138, y = 34 + r * 130, on = g.rnd(Math.floor(t * 1.5 + q * 7 + r * 13)) > .45, hot = g.rnd(q * 5 + r) > .85;
    g.paper(cc => cc.roundRect(x, y, 112, 112, 8), on ? (hot ? P2.rose : '#ffd48a') : '#2b1745', { blur: 8, dy: 4, edge: P2.brassD });
    if (on) { g.person(x + 56, y + 108, 26, 'rgba(20,6,30,.7)'); g.line(x + 56, y, x + 56, y + 112, 2, 'rgba(0,0,0,.4)'); g.line(x, y + 56, x + 112, y + 56, 2, 'rgba(0,0,0,.4)'); } } });
  g.L(.8, () => { g.glow(360, 410, 240, '#ffe9b0', .3 + .15 * g.pulse); g.paper(cc => cc.ellipse(360, 410, 130, 175, 0, 0, 6.3), P2.brass, { blur: 18, dy: 10 }); g.paper(cc => cc.ellipse(360, 410, 112, 157, 0, 0, 6.3), '#2d1648', { sh: false });
    g.c.save(); g.c.beginPath(); g.c.ellipse(360, 410, 112, 157, 0, 0, 6.3); g.c.clip(); g.c.translate(360, 700); g.c.scale(.9, -.9); g.cage(0, 0, 1, { swing: g.sw * .02 }); g.c.restore();
    g.c.save(); g.c.globalAlpha = .25; g.c.fillStyle = '#fff'; g.c.beginPath(); g.c.moveTo(280 + (g.t * 60) % 200, 250); g.c.lineTo(310 + (g.t * 60) % 200, 250); g.c.lineTo(250 + (g.t * 60) % 200, 570); g.c.lineTo(220 + (g.t * 60) % 200, 570); g.c.fill(); g.c.restore(); });
};

SC.coffee = g => {
  const { c, t } = g, v = g.p.v; g.bg('#2a1233', '#3d1a4a');
  if (v === 0) {
    g.L(.6, () => {
      g.paper(cc => { cc.moveTo(250, 330); cc.lineTo(470, 330); cc.lineTo(440, 650); cc.quadraticCurveTo(360, 668, 280, 650); cc.closePath(); }, P2.bone, { blur: 20, dy: 12 });
      g.paper(cc => { cc.moveTo(262, 440); cc.lineTo(458, 440); cc.lineTo(448, 560); cc.lineTo(272, 560); cc.closePath(); }, P2.rose, { sh: false });
      g.txt('LIVE YOUR', 360, 478, 26, P2.bone, { italic: true }); g.txt('BEST LIFE', 360, 520, 30, P2.bone, { italic: true });
      g.paper(cc => { cc.roundRect(235, 306, 250, 34, 10); }, '#f6efe0', { blur: 8, dy: 4 });
      for (let i = 0; i < 3; i++) { const sx = 300 + i * 60; c.strokeStyle = 'rgba(234,223,246,.45)'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); for (let k = 0; k <= 30; k++) { const yy = 296 - k * 7, xx = sx + Math.sin(k * .45 + t * 2 + i) * 14 * (k / 30 + .3); k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
    });
    g.L(.9, () => g.cage(560, 120, .45, { swing: g.sw * .05 }));
  } else {
    g.L(.5, () => {
      g.paper(cc => cc.roundRect(110, 120, 500, 330, 18), P2.bone, { blur: 20, dy: 12 });
      g.txt('MINIMUM WAGE', 360, 175, 36, P2.ink, { italic: true });
      const n = Math.floor(7.25 * 100 + g.u * 1), s = (7.25 + g.u * .0).toFixed(2);
      g.txt('$' + s + ' / hr', 360, 290, 92, P2.roseD, { italic: true });
      g.line(150, 345, 570, 345, 5, P2.ink); g.line(150, 365, 480, 365, 3, P2.ink);
      for (let i = 0; i < 12; i++) { const k = (t * .8 + i / 12) % 1; g.coin(150 + i * 38 + Math.sin(i) * 10, 500 + k * 300, 20, t * 6 + i); }
    });
    g.cage(560, 520, .5, { swing: g.sw * .05 });
  }
};

SC.notifs = g => {
  const { c, t } = g, v = g.p.v; g.bg('#170a26', '#2d1248');
  g.L(.5, () => {
    g.phone(190, 560, 220, 420, '#1a0b2c', { draw: (x, y, w, h) => { for (let i = 0; i < 5; i++) { g.rr(x + 10, y + 16 + i * 74, w - 20, 62, 10); c.fillStyle = '#2f1850'; c.fill(); g.circ(x + 34, y + 47 + i * 74, 14, [P2.rose, P2.brass, P2.lilac][i % 3]); c.fillStyle = P2.lilac; c.fillRect(x + 56, y + 36 + i * 74, 90, 7); c.fillRect(x + 56, y + 52 + i * 74, 60, 6); } } });
    g.cage(530, 170, 1.05, { swing: g.sw * .03 });
  });
  g.L(.9, () => { for (let i = 0; i < 16; i++) { const k = (t * .55 + i / 16) % 1, x = g.lerp(210, 520, k) + Math.sin(k * 6 + i) * 26, y = g.lerp(520, 420, k) - Math.sin(k * 3.14) * 220 + Math.sin(i) * 30; g.badge(x, y, (i % 9) + 1, 14 + 4 * Math.sin(k * 3.14)); } });
  if (v === 1) { // one broken connection
    g.L(.7, () => { c.save(); c.translate(360, 740); for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 54 + (i > 2 ? 14 : -14); g.paper(cc => cc.roundRect(x - 26, -14, 52, 28, 14), 'rgba(0,0,0,0)', { sh: false, edge: P2.brass, lw: 6 }); } g.txt('1 REAL CONNECTION: NOT FOUND', 0, 56, 17, P2.rose, { mono: true, ls: 2 }); c.restore(); });
  }
};

SC.camlens = g => {
  const { c, t } = g; g.bg('#0f0719', '#241040');
  rays(g, 360, 400, 10, P2.rose, .06 + .05 * g.pulse, -t * .15);
  g.L(.5, () => { g.circ(360, 410, 270, '#1b0d2a'); g.ring(360, 410, 262, 10, P2.brass); g.ring(360, 410, 232, 3, P2.brassD); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832; g.line(360 + Math.cos(a) * 244, 410 + Math.sin(a) * 244, 360 + Math.cos(a) * 258, 410 + Math.sin(a) * 258, 4, P2.brassD); }
    const open = 90 + 40 * g.pulse; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.2832 + t * .2; g.paper(cc => { cc.moveTo(360 + Math.cos(a) * open, 410 + Math.sin(a) * open); cc.lineTo(360 + Math.cos(a + 1.1) * 225, 410 + Math.sin(a + 1.1) * 225); cc.lineTo(360 + Math.cos(a + .55) * 232, 410 + Math.sin(a + .55) * 232); cc.lineTo(360 + Math.cos(a - .2) * 160, 410 + Math.sin(a - .2) * 160); cc.closePath(); }, i % 2 ? '#2e1648' : '#3b1d5c', { blur: 6, dy: 3 }); }
    g.glow(360, 410, open + 30, '#8a5bd0', .6); g.c.save(); g.c.beginPath(); g.c.arc(360, 410, open, 0, 6.3); g.c.clip(); g.c.translate(360, 330); g.c.scale(.28, .28); g.cage(0, 0, 1, { swing: g.sw * .1 }); g.c.restore();
    g.circ(330, 370, 12, 'rgba(255,255,255,.7)'); });
  const blink = Math.sin(t * 5) > 0; g.circ(80, 70, 14, blink ? P2.rose : '#5a1a3a'); g.txt('REC', 130, 71, 24, P2.bone, { mono: true, ls: 3, align: 'center' });
  g.txt('ATTENTION', 360, 740, 40, P2.brass, { italic: true, ls: 6 });
};

SC.platform = g => {
  const { c, t } = g, v = g.p.v; g.bg('#12071f', '#2a1244');
  for (const [x, col, d] of [[160, '#ffd89a', .8], [560, '#ff4f8b', -.8]]) { c.save(); c.globalAlpha = .17 + .08 * g.pulse; c.fillStyle = col; c.beginPath(); c.moveTo(x, -20); c.lineTo(x + d * 80 - 150, 700); c.lineTo(x + d * 80 + 150, 700); c.closePath(); c.fill(); c.restore(); }
  g.L(.4, () => { g.paper(cc => cc.ellipse(360, 700, 340, 70, 0, 0, 6.3), '#3b1d5c', { blur: 16 }); });
  g.L(.7, () => { g.paper(cc => cc.rect(300, 520, 120, 180), '#5b2a7a', { blur: 14 }); g.line(360, 520, 360, 400, 6, P2.brassD); g.paper(cc => cc.ellipse(360, 392, 16, 24, 0, 0, 6.3), P2.brass, { blur: 6 });
    g.person(360, 520, 70, P2.bone, { arm: v === 2 ? .3 + Math.sin(t * 6) * .3 : 1.1 + Math.sin(t * 4) * .3 }); });
  for (let i = 0; i < 12; i++) g.person(30 + i * 62, 840, 36 + (i % 3) * 6, '#1a0b27');
  if (v === 1) { const gl = ['!', '?', '@', '#', '%', '+1']; for (let i = 0; i < 7; i++) { const k = (t * .35 + i / 7) % 1; g.L(.9, () => g.bubble(g.lerp(80, 640, g.rnd(i)), 600 - k * 560, 90, 50, [P2.rose, P2.brass, P2.lilac][i % 3], { text: gl[i % 6], size: 28 })); } }
  if (v === 2) { if (g.pulse > .55) { g.c.fillStyle = `rgba(255,255,255,${(g.pulse - .55) * .35})`; g.c.fillRect(0, 0, 720, 830); } g.L(.9, () => { g.paper(cc => cc.roundRect(520, 540, 120, 80, 12), '#2a1740', { edge: P2.brass, lw: 3 }); g.circ(580, 580, 22, '#111'); g.ring(580, 580, 22, 4, P2.brass); }); }
  g.cage(110, 80, .5, { swing: g.sw * .05 });
};

SC.algo = g => {
  const { c, t } = g; g.bg('#0f0820', '#1f0f38');
  const pts = []; for (let i = 0; i < 14; i++) pts.push([60 + g.rnd(i) * 600, 120 + g.rnd(i + 20) * 520 + Math.sin(t + i) * 12]);
  g.L(.3, () => { for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < 190) g.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], 1.5, `rgba(165,139,208,${.45 * (1 - d / 190)})`); } pts.forEach((p, i) => g.circ(p[0], p[1], 5 + 3 * (i % 3 === Math.floor(t * 2) % 3 ? g.pulse : 0), i % 4 ? P2.lilac : P2.rose)); });
  g.L(.6, () => { g.gear(150, 560, 110, 12, t * .5, '#3b1d5c'); g.gear(320, 640, 70, 9, -t * .79, '#5b2a7a'); g.gear(590, 600, 90, 11, t * .6, '#47206b'); });
  g.L(.9, () => { g.cage(360, 80, .85, { swing: g.sw * .02 });
    for (let i = 0; i < 5; i++) { const x = 110 + i * 125, y = 650 + Math.sin(t * 2 + i) * 14 * (1 + g.pulse); g.line(360, 120, x, y - 60, 1.6, 'rgba(255,227,154,.7)'); g.person(x, y + 40, 34, P2.bone); } });
  g.txt('f(you) = $', 360, 790, 26, P2.brass, { mono: true, ls: 3 });
};

SC.reactions = g => {
  const { c, t } = g, v = g.p.v; g.bg('#1b0b2a', '#33164f');
  if (v === 0) {
    const act = Math.floor(g.bp) % 5; const faces = ['smile', 'angry', 'shock', 'cry', 'heart'];
    for (let i = 0; i < 5; i++) { const on = i === act, x = 90 + i * 135, y = 400 + Math.sin(t * 3 + i) * 12, r = on ? 62 : 48; g.L(.7, () => {
      g.circ(x, y, r, on ? P2.brass : '#7a5a2a'); const e = faces[i]; g.circ(x - r * .35, y - r * .2, r * .1, P2.ink); g.circ(x + r * .35, y - r * .2, r * .1, P2.ink);
      if (e === 'smile') { c.strokeStyle = P2.ink; c.lineWidth = 5; c.beginPath(); c.arc(x, y + r * .05, r * .5, .2, 2.9); c.stroke(); }
      else if (e === 'angry') { g.line(x - r * .5, y - r * .45, x - r * .15, y - r * .3, 5, P2.rose); g.line(x + r * .5, y - r * .45, x + r * .15, y - r * .3, 5, P2.rose); c.strokeStyle = P2.ink; c.lineWidth = 5; c.beginPath(); c.arc(x, y + r * .6, r * .4, 3.4, 6); c.stroke(); }
      else if (e === 'shock') g.circ(x, y + r * .45, r * .2, P2.ink); else if (e === 'cry') { c.strokeStyle = P2.ink; c.lineWidth = 5; c.beginPath(); c.arc(x, y + r * .65, r * .35, 3.4, 6); c.stroke(); g.circ(x - r * .35, y + r * .2 + (t * 40) % 40, 5, '#7ad0ff'); } else { g.sparkle(x, y + r * .25, r * .45, P2.rose); } }); }
    g.txt('REACT', 360, 640, 70, P2.rose, { italic: true, stroke: P2.ink, lw: 8 }); g.txt('→ CHEMICAL TRANSACTION', 360, 710, 20, P2.lilac, { mono: true, ls: 3 });
  } else {
    g.L(.5, () => { for (let i = 0; i < 18; i++) { const side = i < 9 ? -1 : 1, x = 360 + side * (70 + (i % 9) * 30 + g.rnd(i) * 10), y = 700 - Math.floor((i % 9) / 3) * 70 + Math.sin(t * 4 + i) * 6 * g.pulse; g.person(x, y, 30, side < 0 ? P2.rose : P2.brass, { arm: 1.2 + Math.sin(t * 5 + i) * .4 }); } });
    g.line(360, 60, 360, 780, 4, P2.bone); g.cage(360, 160, .9, { swing: g.sw * .03 });
    g.txt('ENGAGEMENT', 360, 80 + 10, 28, P2.bone, { mono: true, ls: 6 });
  }
};

SC.mirror_ads = g => {
  const { c, t } = g; g.bg('#1a0b28', '#2f1348');
  g.L(.6, () => { g.paper(cc => cc.ellipse(360, 400, 215, 305, 0, 0, 6.3), P2.brass, { blur: 20, dy: 10 });
    c.save(); c.beginPath(); c.ellipse(360, 400, 192, 282, 0, 0, 6.3); c.clip(); c.fillStyle = '#25103a'; c.fillRect(100, 100, 520, 600);
    const ads = ['SALE -50%', 'BUY NOW', 'YOU NEED THIS', 'FREE*', 'ONLY TODAY', 'SPONSORED', 'LIMITED', 'CLICK']; const off = (t * 90) % 120;
    for (let r = -1; r < 7; r++) for (let q = 0; q < 2; q++) { const i = r * 2 + q, x = 170 + q * 200 + (r % 2) * 40, y = 140 + r * 100 + off; g.rr(x, y, 180, 82, 8); c.fillStyle = [P2.rose, P2.brass, P2.lilac, '#ff8a5c'][((i % 4) + 4) % 4]; c.fill(); g.txt(ads[((i % 8) + 8) % 8], x + 90, y + 41, 20, P2.ink, { italic: true }); }
    g.person(360, 700, 120, 'rgba(10,3,20,.78)'); // the reflection, mostly buried
    c.restore(); g.glow(300, 250, 120, '#fff', .12); });
  g.cage(600, 90, .55, { swing: g.sw * .05 });
};

SC.cloudbag = g => {
  const { c, t } = g; g.bg('#241044', '#4a2468');
  g.L(.4, () => { g.cloud(240, 230 + Math.sin(t) * 10, 3.2, '#c9b6ea'); for (let i = 0; i < 6; i++) { const k = (t * .3 + i / 6) % 1; g.paper(cc => { cc.arc(150 + i * 36, 420 - k * 150, 9, 0, 6.3); }, '#e6d8f7', { blur: 4 }); g.line(150 + i * 36, 410 - k * 150, 150 + i * 36, 380 - k * 150, 3, '#e6d8f7'); } g.txt('MY CHILDHOOD', 240, 240, 22, P2.plum, { italic: true }); });
  g.L(.8, () => { c.save(); c.translate(520, 560); c.rotate(Math.sin(t * 2) * .05);
    g.paper(cc => { cc.moveTo(-100, -120); cc.lineTo(100, -120); cc.lineTo(120, 150); cc.lineTo(-120, 150); cc.closePath(); }, '#d8b48a', { blur: 18, dy: 10 }); g.paper(cc => { cc.moveTo(-100, -120); cc.lineTo(100, -120); cc.lineTo(0, -60); cc.closePath(); }, '#b8946a', { sh: false });
    g.line(-50, -120, -40, -170, 6, '#8a6a44'); g.line(50, -120, 40, -170, 6, '#8a6a44'); g.txt('MY FUTURE', 0, 30, 26, P2.roseD, { italic: true }); g.paper(cc => cc.roundRect(-52, 60, 104, 40, 6), P2.bone, { sh: false }); g.txt('$ 0.00', 0, 82, 22, P2.ink, { mono: true }); c.restore(); });
  g.cage(100, 80, .55, { swing: g.sw * .05 });
};

SC.kingdom = g => {
  const { c, t } = g; g.bg('#2a1240', '#51296f'); rays(g, 360, 300, 12, '#ffd89a', .07, t * .05);
  g.L(.6, () => { const bx = [[360, 700, 300, 120], [300, 580, 200, 120], [420, 460, 160, 110], [360, 360, 110, 90]];
    bx.forEach(([x, y, w, h], i) => { const wob = Math.sin(t * 1.5 + i) * i * 1.2; g.paper(cc => cc.rect(x - w / 2 + wob, y - h, w, h), ['#b78e5c', '#a07a4c', '#c29a68', '#ad8556'][i], { blur: 14, dy: 8 }); g.line(x - w / 2 + wob, y - h * .5, x + w / 2 + wob, y - h * .5, 8, 'rgba(255,255,255,.18)'); });
    g.paper(cc => { cc.moveTo(310, 272); cc.lineTo(310, 210); cc.lineTo(335, 240); cc.lineTo(360, 195); cc.lineTo(385, 240); cc.lineTo(410, 210); cc.lineTo(410, 272); cc.closePath(); }, P2.brass, { blur: 12, dy: 6, edge: P2.brassD }); g.sparkle(360, 190, 10 + 4 * g.pulse, P2.brassL); });
  for (let i = 0; i < 8; i++) { const k = (t * .4 + i / 8) % 1; g.L(.9, () => { g.coin(60 + g.rnd(i) * 600, 260 + k * 600, 16, t * 3 + i); }); }
  g.txt('THINGS WE COULDN’T KEEP', 360, 790, 18, P2.lilac, { mono: true, ls: 4 });
};

SC.sleep = g => {
  const { c, t } = g; g.bg('#0b0618', '#1e0f3a');
  for (let i = 0; i < 40; i++) { c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 1.3 + i)); g.circ(g.rnd(i) * 720, g.rnd(i + 30) * 500, 1 + g.rnd(i + 5) * 2, P2.bone); } c.globalAlpha = 1;
  g.paper(cc => { cc.arc(580, 150, 80, 0, 6.3); }, '#f4e9c6', { blur: 30, dy: 0 }); g.paper(cc => { cc.arc(610, 135, 70, 0, 6.3); }, '#1b0d33', { sh: false });
  g.L(.7, () => { g.paper(cc => { cc.moveTo(120, 450); cc.quadraticCurveTo(360, 280, 600, 450); cc.quadraticCurveTo(360, 620, 120, 450); }, P2.bone, { blur: 20, dy: 10 });
    const lx = Math.sin(t * .8) * 24; g.circ(360 + lx, 450, 78, '#6a3f9a'); g.circ(360 + lx, 450, 40, P2.ink); g.circ(340 + lx, 430, 12, '#fff');
    for (let i = 0; i < 18; i++) { const a = -.7 + i * .08 + Math.PI * 1.15; } });
  g.txt('3:07 AM', 360, 700, 60, P2.rose, { mono: true, w: 500, ls: 5 }); g.cage(120, 60, .5, { swing: g.sw * .05 });
  g.txt('Z', 560 + Math.sin(t) * 10, 330 - (t * 20) % 60, 36, 'rgba(165,139,208,.6)', { italic: true });
};

// ---------- YOU slot ambient + silence + outro ----------
SC.ambient = g => {
  const { c, t } = g, n = g.p.v, door = n === 5; g.bg(door ? '#2a1038' : '#190b2a', door ? '#4a2060' : '#2e1448');
  drapes(g, '#3b1458'); dust(g, 50);
  for (let i = 0; i < 14; i++) { const x = (g.rnd(i) * 900 + t * (10 + g.rnd(i + 2) * 14)) % 900 - 90, y = 60 + g.rnd(i + 8) * 700; g.glow(x, y, 40 + g.rnd(i + 3) * 60, i % 3 ? '#ffd089' : '#ff4f8b', .1); }
  if (door) { g.L(.4, () => { g.paper(cc => { cc.moveTo(90, 800); cc.lineTo(90, 220); cc.quadraticCurveTo(360, -60, 630, 220); cc.lineTo(630, 800); cc.closePath(); }, '#ffe9b0', { blur: 30, dy: 0 }); }); }
  g.L(.55, () => g.cage(360, 40, door ? .8 : 1.5, { swing: g.sw * .02, state: door ? 'open' : 'closed', gold: true }));
  g.glow(360, 380, 360, '#ffcf80', .12 + .06 * g.thump);
};
SC.silence = g => {
  const { c, t } = g; g.bg('#07030f', '#0f0719'); const k = g.thump;
  g.glow(360, 400, 240 + 80 * k, '#ff4f8b', .1 + .22 * k);
  g.L(.4, () => g.cage(360, 150, 1.1 + .02 * k, { swing: 0, state: 'closed' }));
  g.txt('. . .', 360, 760, 40, 'rgba(234,223,246,.35)', { mono: true, ls: 10 });
};
SC.outro = g => {
  const { c, t } = g; g.bg('#2b1347', '#ff7a8a'); g.glow(360, 600, 520, '#ffd9a0', .45);
  g.city(760, '#2a1244', 4, 120, 330, '#ffd89a'); g.city(800, '#150a22', 40, 90, 220, null);
  g.L(.6, () => g.cage(360, 30, 1.15, { swing: g.sw * .02, state: 'open' }));
  for (let i = 0; i < 6; i++) { const k = (t * .06 + i * .13) % 1; g.bird(120 + k * 600, 520 - k * 380 - i * 22 + Math.sin(t * 2 + i) * 10, .8 - i * .06, P2.ink, t * 6 + i); }
  const a = g.ease((t - 262) / 3); g.c.globalAlpha = a; g.txt('what’s your key?', 360, 150, 34, P2.bone, { italic: true, stroke: P2.ink, lw: 7 }); g.c.globalAlpha = 1;
};
})();
