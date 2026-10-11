// ===== The crew: paper-cut characters that perform what you hear =====
//   rapper  : mouth = real phonemes (forced-alignment phone tier -> visemes), gestures land on word onsets, key words hit harder,
//             head nods on the kick
//   cellist : bow speed/amplitude follow the string energy, left hand slides with pitch height, eyes close when the cello swells
//   drummer : sticks/foot strike on the detected snare/hat/kick events, and ANTICIPATE them (the audio is known offline)
//   808 box : woofer cone pumps with the bass
// Drawn in the near layer of the diorama (layer coords 720x830, y down). Pure function of t.
window.Crew = (() => {
  const P = { brass: '#f0b43c', brassD: '#b97d1c', brassL: '#ffe39a', rose: '#ff4f8b', roseD: '#b92a62', bone: '#eadff6', lilac: '#a58bd0', ink: '#0b0414', plum: '#5b2a7a', plumD: '#3a1a55' };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, u) => a + (b - a) * u, rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  let VIS = [], WORDS = [];
  // viseme code -> [open, width, round, lipTeeth]
  const MP = { 0: [0, .85, 0, 0], 1: [1, 1, 0, 0], 2: [.55, 1.25, 0, 0], 3: [.6, .65, 1, 0], 4: [.3, .6, .8, 0], 5: [.15, 1, 0, 1], 6: [.2, 1.3, 0, 0], 7: [.3, 1, 0, 0], 8: [0, 1, 0, 0] };
  function init(TL, SPEC, vis) {
    VIS = vis || []; WORDS = [];
    TL.lines.forEach((l, i) => { const keys = new Set(((SPEC.lines[i] || {}).keys || []).map(k => k.toLowerCase()));
      l.words.forEach((w, k) => WORDS.push({ t0: w.t0, t1: w.t1, key: keys.has(w.w.toLowerCase().replace(/[^a-z'-]/g, '')), n: WORDS.length })); });
  }
  const codeAt = t => { let lo = 0, hi = VIS.length; while (lo < hi) { const m = (lo + hi) >> 1; if (VIS[m][0] <= t) lo = m + 1; else hi = m; } const e = VIS[lo - 1]; return e && t < e[1] + .02 ? e[2] : 8; };
  const mouthAt = t => { const out = [0, 0, 0, 0]; const ds = [0, .02, .045]; ds.forEach(d => { const m = MP[codeAt(t + d)]; for (let k = 0; k < 4; k++) out[k] += m[k] / ds.length; }); return out; };
  // gesture strength from nearby words (anticipate 70 ms, decay after)
  function gesture(t) {
    let lo = 0, hi = WORDS.length; while (lo < hi) { const m = (lo + hi) >> 1; if (WORDS[m].t0 <= t) lo = m + 1; else hi = m; }
    let best = { a: 0, type: 0, key: false };
    for (let i = Math.max(0, lo - 4); i < Math.min(WORDS.length, lo + 2); i++) { const w = WORDS[i], d = t - w.t0; let s = 0;
      if (d < 0 && d > -.07) s = (1 + d / .07) * .7; else if (d >= 0) s = Math.exp(-d * 8.5);
      s *= w.key ? 1 : .5; if (s > best.a) best = { a: s, type: w.n % 3, key: w.key, d }; }
    return best;
  }
  // 2-bone IK: shoulder S -> hand H with segment lengths l1,l2; returns elbow and the (clamped) hand
  function ik(sx, sy, hx, hy, l1, l2, bend) {
    let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1; const dm = Math.min(d, l1 + l2 - .5), a = Math.atan2(dy, dx);
    const ca = clamp((l1 * l1 + dm * dm - l2 * l2) / (2 * l1 * dm), -1, 1), A = Math.acos(ca) * bend;
    return { ex: sx + Math.cos(a + A) * l1, ey: sy + Math.sin(a + A) * l1, hx: sx + Math.cos(a) * dm, hy: sy + Math.sin(a) * dm };
  }
  function arm(g, sx, sy, hx, hy, l1, l2, bend, w, col, hand) {
    const r = ik(sx, sy, hx, hy, l1, l2, bend);
    g.line(sx, sy, r.ex, r.ey, w + 4, P.ink); g.line(r.ex, r.ey, r.hx, r.hy, w * .9 + 4, P.ink);
    g.line(sx, sy, r.ex, r.ey, w, col); g.line(r.ex, r.ey, r.hx, r.hy, w * .9, col); g.circ(r.hx, r.hy, w * .62 + 1.5, P.ink); g.circ(r.hx, r.hy, w * .62, hand);
    return r;
  }
  const SKIN1 = '#c98f6b', SKIN2 = '#e2b392', SKIN3 = '#8f5a3a';

  // ---------------- rapper ----------------
  function rapper(g, t, X, Y, S) {
    const c = g.c, kick = AU.kick(t), voc = AU.vocal(t), ges = gesture(t), mouth = mouthAt(t);
    const bob = -kick * 7 + Math.sin(t * 3.3) * 2, nod = kick * .1 + Math.sin(t * 2.1) * .02;
    c.save(); c.translate(X, Y); c.scale(S, S);
    g.paper(ctx => ctx.ellipse(0, 0, 70, 12, 0, 0, 6.3), 'rgba(0,0,0,.35)', { sh: false });
    // legs + shoes
    g.line(-22, -175, -26, -22, 30, P.ink); g.line(22, -175, 26, -22, 30, P.ink); g.line(-22, -175, -26, -22, 26, '#2a1a45'); g.line(22, -175, 26, -22, 26, '#2a1a45');
    g.paper(ctx => ctx.ellipse(-30, -10, 28, 13, 0, 0, 6.3), P.bone, { blur: 6, dy: 3 }); g.paper(ctx => ctx.ellipse(30, -10, 28, 13, 0, 0, 6.3), P.bone, { blur: 6, dy: 3 }); g.line(-52, -8, 0, -8, 4, P.rose); g.line(0, -8, 56, -8, 4, P.rose);
    c.save(); c.translate(0, bob);
    // hood behind head
    g.paper(ctx => ctx.arc(0, -352, 50, 0, 6.3), P.plumD, { blur: 8, dy: 4 });
    // torso (hoodie)
    g.paper(ctx => { ctx.moveTo(-52, -300); ctx.lineTo(52, -300); ctx.lineTo(60, -165); ctx.lineTo(-60, -165); ctx.closePath(); }, P.plum, { blur: 10, dy: 5, edge: P.ink, lw: 3 });
    g.paper(ctx => ctx.roundRect(-34, -218, 68, 40, 10), P.plumD, { sh: false }); g.line(-12, -296, -12, -250, 3, P.bone); g.line(12, -296, 12, -250, 3, P.bone);
    g.line(-52, -300, 52, -300, 6, P.rose);
    // chain
    c.strokeStyle = P.brass; c.lineWidth = 5; c.beginPath(); c.arc(0, -300, 36, .15, Math.PI - .15); c.stroke(); g.circ(0, -262, 9, P.brassL); g.txt('$', 0, -262, 12, P.brassD, { w: 900 });
    // left arm: gestures on word onsets
    const ty = ges.type, off = ty === 0 ? [-14, 42] : ty === 1 ? [-62, -28] : [-34, -78], A = ges.a * (ges.key ? 1.15 : .8);
    arm(g, -50, -292, -72 + off[0] * A + Math.sin(t * 2) * 3, -205 + off[1] * A, 62, 60, -1, 24, P.plum, SKIN1);
    // head
    const hy = -364; c.save(); c.translate(0, hy); c.rotate(nod + ges.a * .035);
    g.paper(ctx => ctx.arc(0, 0, 40, 0, 6.3), SKIN1, { blur: 8, dy: 4, edge: P.ink, lw: 3 });
    g.paper(ctx => ctx.ellipse(-40, 4, 7, 11, 0, 0, 6.3), SKIN3, { sh: false }); g.paper(ctx => ctx.ellipse(40, 4, 7, 11, 0, 0, 6.3), SKIN3, { sh: false });
    // beanie
    g.paper(ctx => { ctx.moveTo(-42, -10); ctx.quadraticCurveTo(0, -78, 42, -10); ctx.lineTo(42, -5); ctx.lineTo(-42, -5); ctx.closePath(); }, P.rose, { sh: false, edge: P.ink, lw: 3 });
    g.paper(ctx => ctx.roundRect(-44, -14, 88, 15, 6), P.roseD, { sh: false, edge: P.ink, lw: 2.5 }); g.circ(0, -62, 8, P.bone);
    // eyes + brows
    const blink = ((t + .7) % 3.4) < .1, key = ges.key && ges.a > .35;
    for (const ex of [-15, 15]) { if (blink) g.line(ex - 6, 1, ex + 6, 1, 3, P.ink); else { g.circ(ex, 0, 6.5, P.bone); g.circ(ex + 1.5, 1, 3.4, P.ink); }
      g.line(ex - 8, -10 - (key ? 5 : 0) - ges.a * 2, ex + 8, -12 - (key ? 6 : 0), 3.4, P.ink); }
    // mouth from phonemes; loud syllables open wider; silence closes it
    const gate = clamp((voc - .06) / .2), op = mouth[0] * (.5 + .9 * voc) * gate, wd = mouth[1], rd = mouth[2], mw = 22 * wd * (1 - rd * .32), mh = 2 + op * 19, my = 17;
    g.paper(ctx => ctx.ellipse(0, my, mw + 3, mh + 3, 0, 0, 6.3), P.roseD, { sh: false });
    if (op < .06) { c.strokeStyle = P.ink; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-mw * .8, my); c.quadraticCurveTo(0, my + 3 + (key ? 3 : 0), mw * .8, my); c.stroke(); }
    else { g.paper(ctx => ctx.ellipse(0, my, mw, mh, 0, 0, 6.3), '#2a0a1a', { sh: false });
      c.save(); c.beginPath(); c.ellipse(0, my, mw, mh, 0, 0, 6.3); c.clip();
      if (op > .28 || mouth[3]) { c.fillStyle = P.bone; c.fillRect(-mw, my - mh, mw * 2, Math.min(mh * .45, 7)); }
      if (op > .5) { c.fillStyle = P.rose; c.beginPath(); c.ellipse(0, my + mh * .65, mw * .62, mh * .5, 0, 0, 6.3); c.fill(); }
      c.restore(); }
    c.restore();   // head
    // right arm: mic at the mouth, small jab on the beat
    const mx = 36, my2 = hy + 30 + (mouth[0] > .6 ? 2 : 0);
    const r = arm(g, 50, -292, mx + 10, my2 + 14 - kick * 3, 62, 60, 1, 24, P.plum, SKIN1);
    g.line(r.hx, r.hy, mx - 8, my2 + 2, 11, '#1b1b26'); g.paper(ctx => ctx.arc(mx - 10, my2, 11, 0, 6.3), '#3a3a4a', { sh: false, edge: P.brass, lw: 2.5 });
    c.restore();   // bob
    c.restore();
  }

  // ---------------- cellist ----------------
  function cellist(g, t, X, Y, S) {
    const c = g.c, str = AU.strings(t), pit = AU.pitch(t), kick = AU.kick(t);
    const sway = Math.sin(t * 1.15) * .06 + str * Math.sin(t * 2.2) * .035, sg = clamp((str - .25) / .4);
    c.save(); c.translate(X, Y); c.scale(S, S);
    g.paper(ctx => ctx.ellipse(0, 0, 90, 12, 0, 0, 6.3), 'rgba(0,0,0,.35)', { sh: false });
    // stool + legs
    g.line(-34, -100, -38, -4, 18, P.ink); g.line(34, -100, 38, -4, 18, P.ink); g.line(-34, -100, -38, -4, 14, '#2a1a45'); g.line(34, -100, 38, -4, 14, '#2a1a45');
    g.paper(ctx => ctx.ellipse(-40, -6, 22, 10, 0, 0, 6.3), P.brass, { sh: false }); g.paper(ctx => ctx.ellipse(40, -6, 22, 10, 0, 0, 6.3), P.brass, { sh: false });
    c.save(); c.translate(0, 0); c.rotate(sway * .5);
    // torso (waistcoat)
    g.paper(ctx => { ctx.moveTo(-44, -255); ctx.lineTo(44, -255); ctx.lineTo(50, -118); ctx.lineTo(-50, -118); ctx.closePath(); }, P.bone, { blur: 10, dy: 5, edge: P.ink, lw: 3 });
    g.paper(ctx => { ctx.moveTo(-44, -255); ctx.lineTo(-10, -255); ctx.lineTo(0, -200); ctx.lineTo(-8, -120); ctx.lineTo(-50, -118); ctx.closePath(); }, P.brass, { sh: false }); g.paper(ctx => { ctx.moveTo(44, -255); ctx.lineTo(10, -255); ctx.lineTo(0, -200); ctx.lineTo(8, -120); ctx.lineTo(50, -118); ctx.closePath(); }, P.brass, { sh: false });
    // cello
    c.save(); c.translate(14, 0);
    g.paper(ctx => ctx.ellipse(0, -84, 64, 74, 0, 0, 6.3), '#c9782e', { blur: 12, dy: 6, edge: P.ink, lw: 3 });
    g.paper(ctx => ctx.ellipse(0, -178, 46, 52, 0, 0, 6.3), '#c9782e', { sh: false, edge: P.ink, lw: 3 }); g.paper(ctx => ctx.ellipse(0, -140, 36, 26, 0, 0, 6.3), '#b86a24', { sh: false });
    g.glow(-14, -120, 70, '#ffd089', .25);
    for (const fx of [-24, 24]) g.line(fx, -128 + (fx > 0 ? 0 : 0), fx + (fx > 0 ? -6 : 6), -88, 4.5, P.ink);
    g.line(0, -20, 0, 8, 5, P.brassD);                                                           // endpin
    // neck + strings (vibrating)
    const nx0 = 4, ny0 = -205, nx1 = -40, ny1 = -348;
    g.line(nx0, ny0, nx1, ny1, 17, P.ink); g.line(nx0, ny0, nx1, ny1, 12, '#3a1f12'); g.circ(nx1 - 2, ny1 - 8, 12, '#c9782e'); 
    for (let k = -1.5; k <= 1.5; k++) { c.strokeStyle = 'rgba(255,227,154,.85)'; c.lineWidth = 1.4; c.beginPath(); for (let q = 0; q <= 12; q++) { const u = q / 12, bx = lerp(0, nx1 + k * 3, u) + k * 5 * (1 - u), by = lerp(-100, ny1, u); const w = Math.sin(u * Math.PI) * str * 4 * Math.sin(t * (60 + k * 9)); q ? c.lineTo(bx + w, by) : c.moveTo(bx + w, by); } c.stroke(); }
    c.restore();
    // left hand slides with pitch
    const u = lerp(.25, .85, clamp(pit * 1.15)), hx = 14 + lerp(nx0, nx1, u) - 6, hy = lerp(ny0, ny1, u);
    arm(g, -40, -248, hx, hy, 66, 66, -1, 22, P.bone, SKIN2);
    // bow arm: oscillation amplitude follows the string energy
    const amp = .12 + .88 * clamp(str * 1.3), b = Math.sin(t * 5.3) * 42 * amp, bx = 38 + b, by = -142 + Math.sin(t * 5.3) * 5 * amp;
    const br = arm(g, 42, -248, bx, by, 66, 62, 1, 22, P.bone, SKIN2);
    const th = -.22; g.line(bx - 74, by - Math.tan(th) * -74 * 0 + 12, bx + 86, by - 14, 4, P.brassD); g.line(bx - 74, by + 15, bx + 86, by - 11, 2.2, 'rgba(255,255,255,.8)');
    // head
    c.save(); c.translate(0, -312); c.rotate(sway * 1.6 + .04);
    g.paper(ctx => ctx.arc(0, 0, 34, 0, 6.3), SKIN2, { blur: 8, dy: 4, edge: P.ink, lw: 3 });
    g.paper(ctx => { ctx.moveTo(-36, -4); ctx.quadraticCurveTo(-30, -44, 4, -42); ctx.quadraticCurveTo(38, -40, 36, -4); ctx.quadraticCurveTo(10, -22, -36, -4); }, '#2a1740', { sh: false, edge: P.ink, lw: 2.5 });
    for (const ex of [-12, 12]) { if (sg > .5 || ((t + 1.3) % 4.1) < .1) g.line(ex - 6, 2, ex + 6, 2, 3.2, P.ink); else { g.circ(ex, 2, 5.5, P.bone); g.circ(ex, 3, 3, P.ink); } g.line(ex - 7, -7 - sg * 3, ex + 7, -8, 3, P.ink); }
    c.strokeStyle = P.ink; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.arc(0, 12 - sg * 2, 8 + sg * 3, .3, 2.84); c.stroke();
    c.restore();
    c.restore();
    // floating notes when the cello sings
    for (let i = 0; i < 4; i++) { const k = (t * .55 + i / 4) % 1, a = Math.sin(k * 3.14) * clamp(str * 1.5); if (a < .05) continue; c.globalAlpha = a; g.txt(i % 2 ? '♪' : '♫', -70 + Math.sin(k * 5 + i * 2) * 28 - k * 20, -360 - k * 90, 30, i % 2 ? P.rose : P.brassL, { w: 900 }); c.globalAlpha = 1; }
    c.restore();
  }

  // ---------------- drummer ----------------
  function stickH(name, t, minS, lead, tail) {   // 1 = raised, 0 = contact
    let h = 1, s = 0;
    for (const e of AU.upcoming(name, t, lead)) if (e[1] >= minS) { const v = (e[0] - t) / lead; if (v < h) { h = v; s = e[1]; } }
    for (const e of AU.recent(name, t, tail)) if (e[1] >= minS) { const v = (t - e[0]) / tail; if (v < h) { h = v; s = e[1]; } }
    return { h: clamp(h), s };
  }
  function drummer(g, t, X, Y, S) {
    const c = g.c, kick = AU.kick(t), sn = stickH('snare', t, .5, .13, .13), ht = stickH('hat', t, .55, .06, .06), kk = stickH('kick', t, .45, .08, .1);
    c.save(); c.translate(X, Y); c.scale(S, S);
    g.paper(ctx => ctx.ellipse(0, 0, 130, 14, 0, 0, 6.3), 'rgba(0,0,0,.35)', { sh: false });
    const bob = -kick * 5 + Math.sin(t * 4.1) * 1.5;
    // drummer behind the kit
    c.save(); c.translate(0, bob);
    g.paper(ctx => { ctx.moveTo(-44, -240); ctx.lineTo(44, -240); ctx.lineTo(52, -130); ctx.lineTo(-52, -130); ctx.closePath(); }, '#e0467f', { blur: 10, dy: 5, edge: P.ink, lw: 3 });
    g.line(0, -238, 0, -132, 4, P.roseD);
    // arms: right -> snare (viewer left), left -> hi-hat (viewer right)
    const rr = arm(g, -42, -232, -100, -138 - sn.h * (18 + 26 * sn.s), 58, 56, -1, 21, '#e0467f', SKIN3);
    g.line(rr.hx, rr.hy, rr.hx - 42, rr.hy + lerp(10, -14, sn.h), 6, P.bone);
    const lr = arm(g, 42, -232, 104, -146 - ht.h * 14, 58, 56, 1, 21, '#e0467f', SKIN3);
    g.line(lr.hx, lr.hy, lr.hx + 42, lr.hy + lerp(10, -12, ht.h), 6, P.bone);
    // head (headphones, cap backwards)
    c.save(); c.translate(0, -282); c.rotate(Math.sin(t * 4.1) * .04 + kick * .09);
    g.paper(ctx => ctx.arc(0, 0, 34, 0, 6.3), SKIN3, { blur: 8, dy: 4, edge: P.ink, lw: 3 });
    g.paper(ctx => { ctx.moveTo(-34, -6); ctx.quadraticCurveTo(0, -60, 34, -6); ctx.closePath(); }, P.brass, { sh: false, edge: P.ink, lw: 2.5 });
    c.strokeStyle = P.ink; c.lineWidth = 6; c.beginPath(); c.arc(0, -4, 38, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); g.paper(ctx => ctx.roundRect(-46, -8, 14, 28, 6), P.ink, { sh: false }); g.paper(ctx => ctx.roundRect(32, -8, 14, 28, 6), P.ink, { sh: false });
    for (const ex of [-12, 12]) { g.circ(ex, 2, 5.5, P.bone); g.circ(ex + (sn.h < .5 ? -1 : 1), 3, 3, P.ink); g.line(ex - 7, -8, ex + 7, -9 - (sn.h < .3 ? 3 : 0), 3, P.ink); }
    const my = 16; g.paper(ctx => ctx.ellipse(0, my, 8, 3 + (sn.h < .3 ? 4 : 0), 0, 0, 6.3), '#2a0a1a', { sh: false });
    c.restore(); c.restore();
    // the kit (in front)
    const kb = 1 + kick * .09;
    g.paper(ctx => ctx.ellipse(0, -62, 76 * kb, 66 * kb, 0, 0, 6.3), P.brassD, { blur: 12, dy: 6, edge: P.ink, lw: 3 });
    g.paper(ctx => ctx.ellipse(0, -62, 66 * kb, 56 * kb, 0, 0, 6.3), '#1b0c2c', { sh: false }); g.glow(0, -62, 80, '#ff4f8b', .55 * kick + .1);
    g.circ(0, -62, 24 * kb, P.rose); g.txt('FREE', 0, -61, 17 * kb, P.bone, { italic: true });
    // snare
    g.line(-96, -128, -96, -64, 4, P.brassD); g.paper(ctx => ctx.ellipse(-96, -126, 44, 13, 0, 0, 6.3), P.bone, { sh: false, edge: P.ink, lw: 3 }); g.paper(ctx => ctx.rect(-140, -126, 88, 24), P.brass, { sh: false });
    // tom
    g.paper(ctx => ctx.ellipse(34, -150, 30, 10, 0, 0, 6.3), P.bone, { sh: false, edge: P.ink, lw: 3 }); g.paper(ctx => ctx.rect(4, -150, 60, 28), P.rose, { sh: false });
    // hi-hat (cymbals close on hits) + crash
    const gap = 5 + ht.h * 6; g.line(100, -190, 100, -30, 4, P.brassD); g.paper(ctx => ctx.ellipse(100, -178 - gap, 38, 7, 0, 0, 6.3), P.brassL, { sh: false, edge: P.brassD, lw: 2 }); g.paper(ctx => ctx.ellipse(100, -178, 38, 7, 0, 0, 6.3), P.brass, { sh: false, edge: P.brassD, lw: 2 });
    g.line(-92, -250, -92, -170, 4, P.brassD); const sh = Math.sin(t * 40) * AU.snare(t) * 2; g.paper(ctx => ctx.ellipse(-92 + sh, -252, 46, 9, -.12, 0, 6.3), P.brassL, { sh: false, edge: P.brassD, lw: 2 });
    c.restore();
  }

  // ---------------- 808 box ----------------
  function speaker(g, t, X, Y, S) {
    const c = g.c, bass = AU.bass(t), kick = AU.kick(t);
    c.save(); c.translate(X, Y); c.scale(S, S);
    g.paper(ctx => ctx.roundRect(-46, -140, 92, 140, 10), '#1b0c2c', { blur: 10, dy: 5, edge: P.brassD, lw: 4 });
    g.glow(0, -60, 80, '#ff4f8b', .4 * bass);
    g.circ(0, -50, 34 * (1 + .08 * kick), P.ink); g.ring(0, -50, 32 * (1 + .08 * kick), 3, P.brass); g.circ(0, -50, (14 + 8 * bass), '#3a1a55'); g.circ(0, -50, 7, P.rose);
    g.circ(0, -112, 11, P.ink); g.ring(0, -112, 10, 2, P.brass);
    for (const ex of [-14, 14]) { g.circ(ex, -134, 6, P.bone); g.circ(ex + Math.sin(t * 2) * 2, -133, 3, P.ink); }
    g.txt('808', 0, -12, 14, P.brass, { mono: true, ls: 2 });
    c.restore();
  }

  function draw(g, t) {
    speaker(g, t, 262, 806, 1.0);
    cellist(g, t, 592, 806, .88);
    drummer(g, t, 392, 812, .62);
    rapper(g, t, 120, 806, .98);
  }
  return { init, draw };
})();
