// ===== 3D world (Three.js, software GL in headless Chromium) =====
// Everything here is a pure function of time + audio features (no state between frames), so chunks can render in parallel.
//   * gilded 3D cage hall: bars bow and glow with 48 mirrored spectrum bands
//   * spectrum terrain: the last ~3 s of the mix scrolling away as mountains
//   * 5 cello strings: ribbons that vibrate with the string/harmonic energy and light up by the note (chroma) sounding
//   * kick shockwave rings on the floor, snare/hat/word particle bursts, vocal halo
//   * the 2D paper-cut scene is a shadow-box diorama (3 parallax layers as textured planes) hung in the middle
window.World = (() => {
  const TAU = Math.PI * 2, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, u) => a + (b - a) * u;
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const ease = x => 1 - Math.pow(1 - clamp(x), 3);
  const MOODS = {
    default: { fog: 0x150a22, key: 0xffd089, rim: 0xff4f8b, floorA: 0x2a1244, floorB: 0xff4f8b, ring: 0xf0b43c, glow: 0xff4f8b, bars: 0xf0b43c, bg1: '#150a22', bg2: '#2e1448' },
    Overture: { fog: 0x0e0618, key: 0xc9b0ff, rim: 0xff4f8b, floorA: 0x1d0e33, floorB: 0x8a5bd0, ring: 0xc9b0ff, glow: 0x8a5bd0, bars: 0xf0b43c, bg1: '#0c0516', bg2: '#22103a' },
    Intro: { fog: 0x140a22, key: 0xffd089, rim: 0xff4f8b, floorA: 0x2a1244, floorB: 0xb36bd8, ring: 0xf0b43c, glow: 0xb36bd8, bars: 0xf0b43c, bg1: '#150a22', bg2: '#2e1448' },
    'Verse 1': { fog: 0x1a0a28, key: 0xffd089, rim: 0xff4f8b, floorA: 0x34164f, floorB: 0xff4f8b, ring: 0xf0b43c, glow: 0xff4f8b, bars: 0xf0b43c, bg1: '#1a0a28', bg2: '#3a1a55' },
    'Pre-Chorus': { fog: 0x14102e, key: 0xc9d8ff, rim: 0xa58bd0, floorA: 0x1f1a4a, floorB: 0x8aa0ff, ring: 0xc9d8ff, glow: 0x8aa0ff, bars: 0xe9d29a, bg1: '#12102c', bg2: '#2a2060' },
    Chorus: { fog: 0x25103a, key: 0xffe3a0, rim: 0xff4f8b, floorA: 0x4a1a5a, floorB: 0xffb23c, ring: 0xffe39a, glow: 0xffb23c, bars: 0xffc94d, bg1: '#2a1040', bg2: '#5a2468' },
    'Post-Chorus': { fog: 0x2a0f35, key: 0xff9ac8, rim: 0xff4f8b, floorA: 0x3a1048, floorB: 0xff4f8b, ring: 0xff4f8b, glow: 0xff4f8b, bars: 0xf0b43c, bg1: '#2a0f35', bg2: '#4d1c58' },
    'Verse 2': { fog: 0x1c0a24, key: 0xffb99a, rim: 0xff4f8b, floorA: 0x3a1040, floorB: 0xff6a5c, ring: 0xf0b43c, glow: 0xff6a5c, bars: 0xf0b43c, bg1: '#1c0a24', bg2: '#42184a' },
    Bridge: { fog: 0x0a1228, key: 0x9ac8ff, rim: 0x5c8aff, floorA: 0x101e44, floorB: 0x5ca8ff, ring: 0x9ac8ff, glow: 0x5c8aff, bars: 0xd8c27a, bg1: '#08101f', bg2: '#16284a' },
    'Verse 3': { fog: 0x2a1840, key: 0xffd9a0, rim: 0xffa07a, floorA: 0x3a2060, floorB: 0xffa07a, ring: 0xffd9a0, glow: 0xffa07a, bars: 0xf6c35a, bg1: '#24143a', bg2: '#5a3470' },
    'Final Chorus': { fog: 0x3a1a48, key: 0xfff0c0, rim: 0xff8ab0, floorA: 0x5a2a68, floorB: 0xffd36a, ring: 0xfff0c0, glow: 0xffd36a, bars: 0xffd36a, bg1: '#3a1a4a', bg2: '#7a3a78' },
    Outro: { fog: 0x3a1a48, key: 0xfff0c0, rim: 0xffa0b0, floorA: 0x4a2a68, floorB: 0xffb090, ring: 0xfff0c0, glow: 0xffb090, bars: 0xffd36a, bg1: '#2b1347', bg2: '#8a4a7a' },
  };
  const NB = 48, R0 = 7.4, TC = 48, TR = 64;
  let r, scene, cam, dio, layers = [], cageBars, cageCol, outerBars, rings = [], ringTop, ringBot, terr, terrW, strings = [], pts, ptPos, ptCol, glowSpr, voiceSpr, keyL, rimL, amb, frame, walls = [];
  let wordHits = [], tmpC = new THREE.Color(), D = new THREE.Object3D();
  const col = h => new THREE.Color(h);

  function spriteTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }

  function init(canvas, layerCanvases) {
    r = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: false });
    r.setSize(864, 996, false); r.setClearColor(0x150a22, 1);
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x150a22, 14, 46);
    cam = new THREE.PerspectiveCamera(50, 720 / 830, .1, 120);
    amb = new THREE.AmbientLight(0x8a6ab0, .55); scene.add(amb);
    keyL = new THREE.PointLight(0xffd089, 2.4, 60); scene.add(keyL); rimL = new THREE.PointLight(0xff4f8b, 2.0, 50); scene.add(rimL);
    // --- cage bars ---
    const bm = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: .6, roughness: .4, emissive: 0x6a4200 });
    cageBars = new THREE.InstancedMesh(new THREE.CylinderGeometry(.026, .026, 46, 6), bm, NB); cageBars.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NB * 3), 3); scene.add(cageBars);
    outerBars = new THREE.InstancedMesh(new THREE.CylinderGeometry(.075, .075, 46, 6), new THREE.MeshStandardMaterial({ color: 0x7a5a9a, metalness: .6, roughness: .5, emissive: 0x1a0a30 }), 28); scene.add(outerBars);
    const rm = new THREE.MeshStandardMaterial({ color: 0xf0b43c, metalness: .9, roughness: .3, emissive: 0x3a2000 });
    ringTop = new THREE.Mesh(new THREE.TorusGeometry(R0, .09, 8, 96), rm); ringTop.rotation.x = Math.PI / 2; ringTop.position.y = 6.2; scene.add(ringTop);
    ringBot = new THREE.Mesh(new THREE.TorusGeometry(R0, .09, 8, 96), rm); ringBot.rotation.x = Math.PI / 2; ringBot.position.y = -5.4; scene.add(ringBot);
    // --- spectrum terrain ---
    const g = new THREE.BufferGeometry(), n = TC * TR, pos = new Float32Array(n * 3), cc = new Float32Array(n * 3), idx = [];
    for (let rr = 0; rr < TR; rr++) for (let c = 0; c < TC; c++) { const i = rr * TC + c; pos[i * 3] = (c / (TC - 1) - .5) * 34; pos[i * 3 + 2] = lerp(9, -34, rr / (TR - 1)); }
    for (let rr = 0; rr < TR - 1; rr++) for (let c = 0; c < TC - 1; c++) { const a = rr * TC + c, b = a + 1, d = a + TC, e = d + 1; idx.push(a, d, b, b, d, e); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.setIndex(idx);
    terr = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, metalness: .25, roughness: .55, emissive: 0x120824, side: THREE.DoubleSide })); terr.position.y = -5.4; scene.add(terr);
    terrW = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xf0b43c, wireframe: true, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false })); terrW.position.y = -5.38; scene.add(terrW);
    // --- shockwave rings ---
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(.93, 1, 96), new THREE.MeshBasicMaterial({ color: 0xf0b43c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0 })); m.rotation.x = -Math.PI / 2; m.position.y = -5.3; scene.add(m); rings.push(m); }
    // --- cello strings ---
    for (let i = 0; i < 5; i++) {
      const N = 64, g2 = new THREE.BufferGeometry(), p = new Float32Array(N * 2 * 3), id = [];
      for (let k = 0; k < N - 1; k++) { const a = k * 2; id.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      g2.setAttribute('position', new THREE.BufferAttribute(p, 3)); g2.setIndex(id);
      const m = new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ color: 0xffd089, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m); strings.push(m);
    }
    // --- particles ---
    ptPos = new Float32Array(2600 * 3); ptCol = new Float32Array(2600 * 3);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(ptPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(ptCol, 3));
    pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .26, map: spriteTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); pts.frustumCulled = false; scene.add(pts);
    // --- halos ---
    const st = spriteTex();
    glowSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, color: 0xff4f8b, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .4 })); glowSpr.position.set(0, -.5, -4); scene.add(glowSpr);
    voiceSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, color: 0xff8ab8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); voiceSpr.position.set(0, .3, -1.8); scene.add(voiceSpr);
    // --- diorama (shadow box with 3 parallax layers) ---
    dio = new THREE.Group(); dio.position.set(0, .35, 0); scene.add(dio);
    const BW = 6.2, BH = BW * 830 / 720, BD = 2.9;
    const wm = new THREE.MeshStandardMaterial({ color: 0x24103a, roughness: .9, metalness: 0, side: THREE.DoubleSide, emissive: 0x08030f });
    for (const [w, h, x, y, ry, rx] of [[BD, BH, -BW / 2, 0, Math.PI / 2, 0], [BD, BH, BW / 2, 0, Math.PI / 2, 0], [BW, BD, 0, BH / 2, 0, Math.PI / 2], [BW, BD, 0, -BH / 2, 0, Math.PI / 2]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wm); m.position.set(x, y, 0); m.rotation.y = ry; m.rotation.x = rx; dio.add(m); }
    const zs = [-1.4, -.2, 1.0];
    layerCanvases.forEach((cv, i) => { const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: tex, transparent: i > 0, depthWrite: i === 0, toneMapped: false })); m.position.z = zs[i]; m.renderOrder = i; dio.add(m); layers.push({ m, tex }); });
    // brass frame at the mouth of the box
    const fm = new THREE.MeshStandardMaterial({ color: 0xf0b43c, metalness: .9, roughness: .3, emissive: 0x3a2000 }); const T = .16;
    for (const [w, h, x, y] of [[BW + T * 2, T, 0, BH / 2 + T / 2], [BW + T * 2, T, 0, -BH / 2 - T / 2], [T, BH, -BW / 2 - T / 2, 0], [T, BH, BW / 2 + T / 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .34), fm); m.position.set(x, y, BD / 2); dio.add(m); }
    frame = { BW, BH, BD };
  }

  function moodAt(sec, secStart, t) { const M = MOODS[sec] || MOODS.default; return M; }

  // camera rigs: u = progress through the scene, k = line index; returns pos/look/fov/roll
  const RIGS = [
    (u, t, k) => ({ a: .55 * Math.sin(t * .22), d: 11.5, y: 1.3, lx: 0, ly: .3, fov: 50, roll: 0 }),                                   // slow orbit
    (u, t, k) => ({ a: .18 + .1 * Math.sin(t * .3), d: lerp(15, 9.6, ease(u)), y: 1.0, lx: 0, ly: .3, fov: 50, roll: 0 }),              // push in
    (u, t, k) => ({ a: lerp(-.4, .4, u), d: 11, y: 1.6, lx: lerp(-1.1, 1.1, u), ly: .3, fov: 52, roll: 0 }),                           // arc pan
    (u, t, k) => ({ a: .2 * Math.sin(t * .4), d: 11.5, y: lerp(-2.2, 3.6, ease(u)), lx: 0, ly: lerp(-.4, .6, u), fov: 50, roll: 0 }),    // crane up
    (u, t, k) => ({ a: lerp(.5, -.5, u), d: lerp(9.2, 12.4, ease(u)), y: .6, lx: 0, ly: .3, fov: 54, roll: .05 * Math.sin(t * .8) }),    // sweep + dutch
    (u, t, k) => ({ a: .55 * Math.sin(t * .12), d: 12.5, y: 2.4, lx: 0, ly: -.2, fov: 48, roll: 0 }),                                   // wide high orbit
  ];
  function rigFor(seg, segIdx) { const sec = seg.sec || ''; let k = segIdx; if (/Chorus/.test(sec)) return [0, 4, 1][k % 3]; if (sec === 'Bridge') return 1; if (sec === 'Verse 3') return [3, 2, 0][k % 3]; return k % RIGS.length; }

  function update(t, ctx) {
    const { seg, segIdx, u, trIn, slot, sec, secT, bandsOf } = ctx;
    const AU = window.AU, kick = AU.kick(t), snare = AU.snare(t), hat = AU.hat(t), bass = AU.bass(t), str = AU.strings(t), voc = AU.vocal(t), pit = AU.pitch(t);
    // ---- mood (blend from previous section over 1.2 s) ----
    const M = MOODS[sec] || MOODS.default, P = MOODS[ctx.prevSec] || M, mu = ease((t - secT) / 1.2);
    const mc = k => tmpC.copy(col(P[k])).lerp(col(M[k]), mu);
    scene.fog.color.copy(mc('fog')); r.setClearColor(mc('fog').clone().lerp(col(M.bg2.replace('#', '0x')), .0).multiplyScalar(1), 1); keyL.color.copy(mc('key')); rimL.color.copy(mc('rim'));
    const barCol = mc('bars').clone(), ringCol = mc('ring').clone(), glowCol = mc('glow').clone(), fA = mc('floorA').clone(), fB = mc('floorB').clone();
    // ---- lights ----
    keyL.position.set(7 * Math.cos(t * .21), 6 + Math.sin(t * .3) * 1.5, 8 * Math.sin(t * .17) + 6); keyL.intensity = 1.0 + kick * 1.3;
    rimL.position.set(-7, -1 + snare * 3, -6 + Math.sin(t * .4) * 3); rimL.intensity = .6 + snare * 1.6 + bass * .7;
    // ---- cage bars ----
    const kb = 1 + kick * .035;
    for (let i = 0; i < NB; i++) {
      const d = Math.min(i, NB - i) / (NB / 2), k = Math.floor(d * 58), b = AU.band(k, t), a = i / NB * TAU + Math.PI / 2, R = (R0 + b * 1.1 + bass * .25) * kb;
      D.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); D.rotation.set(0, 0, 0); D.scale.set(1 + b * .8, 1, 1 + b * .8); D.updateMatrix(); cageBars.setMatrixAt(i, D.matrix);
      const br = .5 + b * 1.1 + kick * .2; cageBars.setColorAt(i, tmpC.copy(barCol).multiplyScalar(br));
    }
    cageBars.instanceMatrix.needsUpdate = true; cageBars.instanceColor.needsUpdate = true;
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + t * .02, R = 13.5 + AU.band(i * 2, t) * 2; D.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); D.rotation.set(0, 0, 0); D.scale.set(1, 1, 1); D.updateMatrix(); outerBars.setMatrixAt(i, D.matrix); }
    outerBars.instanceMatrix.needsUpdate = true;
    ringTop.scale.setScalar(kb); ringBot.scale.setScalar(kb); ringTop.material.color.copy(ringCol).multiplyScalar(.8 + kick * .8); ringTop.material.emissive.copy(ringCol).multiplyScalar(.15 + kick * .5);
    // ---- terrain (history of the spectrum) ----
    const pa = terr.geometry.attributes.position, ca = terr.geometry.attributes.color;
    for (let rr = 0; rr < TR; rr++) { const tt = t - rr * .052, fall = Math.max(0, 1 - rr / 78);
      for (let c = 0; c < TC; c++) { const dd = Math.abs(c - (TC - 1) / 2) / ((TC - 1) / 2), k = Math.floor(dd * 58), h = Math.pow(AU.band(k, tt), 1.25) * 3.6 * fall * (1 - dd * .2) + .05, i = rr * TC + c;
        pa.array[i * 3 + 1] = h; const m = clamp(h / 3.4); const cr = lerp(fA.r, fB.r, m) * (.35 + m * .55), cg = lerp(fA.g, fB.g, m) * (.35 + m * .55), cb = lerp(fA.b, fB.b, m) * (.35 + m * .55); ca.array[i * 3] = cr; ca.array[i * 3 + 1] = cg; ca.array[i * 3 + 2] = cb; } }
    pa.needsUpdate = true; ca.needsUpdate = true; terr.geometry.computeVertexNormals(); terrW.material.color.copy(ringCol); terrW.material.opacity = .08 + bass * .2;
    // ---- kick shockwave rings ----
    const ke = AU.recent('kick', t, 1.3).filter(e => e[1] > .32);
    rings.forEach((m, i) => { const e = ke[i]; if (!e) { m.material.opacity = 0; return; } const a = (t - e[0]) / 1.3; m.scale.setScalar(.8 + ease(a) * 19); m.material.opacity = (1 - a) * (1 - a) * clamp(e[1] * 1.2); m.material.color.copy(i % 2 ? glowCol : ringCol); });
    // ---- strings ----
    const chr = []; for (let k = 0; k < 12; k++) chr.push(AU.chroma(k, t));
    strings.forEach((m, i) => {
      const cl = Math.max(chr[(i * 2) % 12], chr[(i * 2 + 1) % 12], chr[(i * 2 + 2) % 12] * .8), A = str * (.12 + cl * 1.1) * .62, N = 64, p = m.geometry.attributes.position.array, x0 = (i - 2) * 1.55, w = .012 + str * .03, harm = 2 + ((i + Math.floor(pit * 4)) % 4), om = 7 + i * 1.7 + pit * 6;
      for (let k = 0; k < N; k++) { const u2 = k / (N - 1), y = lerp(5.9, -4.9, u2), env = Math.sin(Math.PI * u2), dx = A * env * (Math.sin(harm * Math.PI * u2) * Math.cos(t * om) + .35 * Math.sin((harm + 2) * Math.PI * u2) * Math.cos(t * om * 1.7)), dz = A * .6 * env * Math.sin(harm * Math.PI * u2) * Math.sin(t * om);
        p[k * 6] = x0 + dx - w; p[k * 6 + 1] = y; p[k * 6 + 2] = 2.6 + dz; p[k * 6 + 3] = x0 + dx + w; p[k * 6 + 4] = y; p[k * 6 + 5] = 2.6 + dz; }
      m.geometry.attributes.position.needsUpdate = true;
      m.material.color.copy(i % 2 ? glowCol : ringCol).lerp(new THREE.Color(0xffffff), clamp(cl * str * .5)); m.material.opacity = clamp(.1 + str * .85);
    });
    // ---- particles ----
    let n = 0; const put = (x, y, z, c, f) => { if (n >= 2600) return; ptPos[n * 3] = x; ptPos[n * 3 + 1] = y; ptPos[n * 3 + 2] = z; ptCol[n * 3] = c.r * f; ptCol[n * 3 + 1] = c.g * f; ptCol[n * 3 + 2] = c.b * f; n++; };
    for (const e of AU.recent('snare', t, 1.1)) { if (e[1] < .45) continue; const a = (t - e[0]) / 1.1, K = 10 + Math.floor(e[1] * 22), s0 = e[0] * 91.7; for (let q = 0; q < K; q++) { const vx = (rnd(s0 + q) - .5) * 9, vy = rnd(s0 + q + 40) * 5 + 1.5, vz = (rnd(s0 + q + 80) - .5) * 5; put((rnd(s0 + q + 7) - .5) * 4 + vx * a, -2.5 + vy * a - 4.5 * a * a, 1.5 + vz * a, q % 3 ? ringCol : glowCol, Math.pow(1 - a, 1.4)); } }
    for (const e of AU.recent('hat', t, .5)) { if (e[1] < .55) continue; const a = (t - e[0]) / .5, s0 = e[0] * 53.3; for (let q = 0; q < 3; q++) { const an = rnd(s0 + q) * TAU, R = R0 + 1 + rnd(s0 + q + 9) * 3; put(Math.cos(an) * R, 5 - rnd(s0 + q + 3) * 9 - a * 1.5, Math.sin(an) * R, ringCol, (1 - a) * .8); } }
    for (const e of AU.recent('kick', t, .9)) { if (e[1] < .5) continue; const a = (t - e[0]) / .9, s0 = e[0] * 31.1; for (let q = 0; q < 16; q++) { const an = q / 16 * TAU + rnd(s0 + q) * .4, R = 3 + rnd(s0 + q + 5) * 5 + a * 4; put(Math.cos(an) * R, -5 + a * (3 + rnd(s0 + q + 11) * 5), Math.sin(an) * R, glowCol, Math.pow(1 - a, 1.3) * .9); } }
    for (const wt of wordHits) { const a = (t - wt) / 1.3; if (a < 0 || a > 1) continue; for (let q = 0; q < 46; q++) { const an = (rnd(wt * 7 + q) - .5) * 2.4, sp = 3 + rnd(wt * 7 + q + 30) * 6; put(Math.sin(an) * sp * a * 1.5, -4.2 + Math.cos(an) * sp * a - 4 * a * a, 3 + (rnd(q + wt) - .5) * 2, q % 2 ? glowCol : new THREE.Color(0xffffff), Math.pow(1 - a, 1.2)); } }
    pts.geometry.setDrawRange(0, n); pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true; pts.material.size = .2 + hat * .08;
    // ---- halos ----
    glowSpr.material.color.copy(glowCol); glowSpr.material.opacity = .16 + bass * .5 + kick * .25; glowSpr.scale.setScalar(20 + bass * 9 + kick * 5);
    voiceSpr.material.opacity = voc * .55; voiceSpr.scale.setScalar(7 + voc * 4);
    // ---- diorama ----
    dio.visible = !slot; const sw = ease(ctx.tin / .45);
    dio.rotation.y = Math.sin(t * .31 + segIdx) * .06 + (1 - sw) * -.9 * (ctx.sceneNew ? 1 : 0); dio.rotation.x = Math.sin(t * .23) * .035; dio.position.z = (1 - sw) * -3 * (ctx.sceneNew ? 1 : 0); dio.position.y = .35 + Math.sin(t * .9) * .05 + kick * .06;
    if (!window.__opt || !window.__opt.noTex) layers.forEach((L, i) => { L.tex.needsUpdate = true; });
    // ---- camera ----
    const rig = (s, si, uu) => RIGS[rigFor(s, si)](uu, t, si);
    let c0 = rig(seg, segIdx, u);
    if (ctx.prevSeg && ctx.tin < .6) { const c1 = rig(ctx.prevSeg, segIdx - 1, 1), m = ease(ctx.tin / .6); c0 = { a: lerp(c1.a, c0.a, m), d: lerp(c1.d, c0.d, m), y: lerp(c1.y, c0.y, m), lx: lerp(c1.lx, c0.lx, m), ly: lerp(c1.ly, c0.ly, m), fov: lerp(c1.fov, c0.fov, m), roll: lerp(c1.roll, c0.roll, m) }; }
    const sh = (rnd(Math.floor(t * 60)) - .5) * .05 * kick, sh2 = (rnd(Math.floor(t * 60) + 9) - .5) * .05 * kick;
    cam.position.set(Math.sin(c0.a) * c0.d + sh, c0.y + sh2, Math.cos(c0.a) * c0.d); cam.up.set(Math.sin(c0.roll + snare * .012), Math.cos(c0.roll), 0); cam.lookAt(c0.lx, c0.ly, 0);
    cam.fov = c0.fov - kick * 2.2 - bass * 1.0; cam.updateProjectionMatrix();
    if (!window.__opt || !window.__opt.noRender) r.render(scene, cam);
  }
  let rbuf = null, rimg = null;
  function readInto(ctx2d) {   // fast path: GL -> ImageData -> CPU canvas (drawImage(webglCanvas) is ~1 s under SwiftShader)
    const gl = r.getContext(), w = 864, h = 996;
    if (!rbuf) { rbuf = new Uint8Array(w * h * 4); rimg = new ImageData(w, h); }
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, rbuf); const row = w * 4;
    for (let y = 0; y < h; y++) rimg.data.set(rbuf.subarray((h - 1 - y) * row, (h - y) * row), y * row);
    ctx2d.putImageData(rimg, 0, 0);
  }
  return { readInto, finish() { r.getContext().finish(); }, init, update, setWordHits(l) { wordHits = l; }, MOODS, get frame() { return frame; } };
})();
