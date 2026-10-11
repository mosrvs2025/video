(() => {
const $ = id => document.getElementById(id);
const SONG = 'price_of_free', BASE = `data/${SONG}/`;
const COL = { high: '#3ddc84', medium: '#ffb300', low: '#ff5252' };
const v = $('v');
let T, PK, VIDS, SLOTS = [], cur = null, curLine = -1;
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const j = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);

async function exists(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok; } catch { return false; } }

async function init() {
  [T, PK, VIDS, SLOTS] = await Promise.all([j(BASE + 'timeline.json'), j(BASE + 'peaks.json'), j(BASE + 'videos.json'), j(BASE + 'slots.json')]);
  SLOTS = SLOTS || [];
  $('title').textContent = VIDS.title;
  $('sub').textContent = `by ${VIDS.artist} · ${Math.round(T.bpm)} BPM · ${fmt(T.dur)}`;
  await buildVersions(); buildLyrics(); buildMap(); buildSlots();
  setupTabs(); setupCtrl(); loop();
}

async function buildVersions() {
  const box = $('versions'); box.innerHTML = '';
  let first = null;
  for (const ver of VIDS.versions) {
    const ok = await exists(ver.src);
    const b = document.createElement('button');
    b.textContent = ver.label + (ok ? '' : ' (soon)'); b.disabled = !ok;
    b.onclick = () => select(ver, b);
    box.appendChild(b); ver._b = b;
    if (ok && !first) first = ver;
  }
  if (first) select(first, first._b);
}
function select(ver, btn) {
  const t = v.currentTime || 0, was = !v.paused;
  document.querySelectorAll('#versions button').forEach(x => x.classList.remove('on')); btn.classList.add('on');
  cur = ver; $('vnote').textContent = ver.note || '';
  v.src = ver.src; v.addEventListener('loadedmetadata', () => { v.currentTime = Math.min(t, v.duration - .1); if (was) v.play(); }, { once: true });
  v.playbackRate = +document.querySelector('#speeds .on').dataset.s;
  $('ovl').parentElement.style.display = ver.id === 'suno' ? '' : 'none';
  updateOverlay();
}

function buildLyrics() {
  const box = $('lyrics'); box.innerHTML = ''; let sec = '';
  T.lines.forEach(l => {
    if (l.section !== sec) { sec = l.section; const h = document.createElement('div'); h.className = 'sech'; h.textContent = sec; box.appendChild(h); }
    const d = document.createElement('div'); d.className = 'ln'; d.id = 'ln' + l.i;
    const why = l.override ? 'hand-set window: ' + l.override.reason : (l.flags || []).join('; ');
    d.innerHTML = `<span class="t">${fmt(l.start)}</span><span class="d ${l.conf}"></span><span class="x">${l.words.map((w, k) => `<span class="w" data-k="${k}">${w.w}</span>`).join(' ')}${why ? `<span class="why">${why}</span>` : ''}</span>`;
    d.onclick = () => { v.currentTime = Math.max(0, l.start - 0.1); v.play(); };
    box.appendChild(d);
  });
}

function buildMap() {
  const c = $('wave'), x = c.getContext('2d'), W = c.width, H = c.height;
  x.clearRect(0, 0, W, H); x.fillStyle = '#6b5a8a';
  const n = PK.peaks.length;
  for (let px = 0; px < W; px++) {
    let m = 0; const a = Math.floor(px / W * n), b = Math.max(a + 1, Math.floor((px + 1) / W * n));
    for (let i = a; i < b; i++) m = Math.max(m, PK.peaks[i]);
    const h = m * H * .46; x.fillRect(px, H / 2 - h, 1, h * 2);
  }
  const bar = $('secbar'); bar.innerHTML = '';
  T.lines.forEach(l => { const i = document.createElement('i'); i.style.left = l.start / T.dur * 100 + '%'; i.style.width = Math.max(.2, (l.end - l.start) / T.dur * 100) + '%'; i.style.background = COL[l.conf]; bar.appendChild(i); });
  SLOTS.forEach(s => { const i = document.createElement('i'); i.className = 'slot'; i.title = `Slot ${s.n}`; i.style.left = s.t0 / T.dur * 100 + '%'; i.style.width = (s.t1 - s.t0) / T.dur * 100 + '%'; bar.appendChild(i); });
  $('map').onclick = e => { const r = $('map').getBoundingClientRect(); v.currentTime = (e.clientX - r.left) / r.width * T.dur; };
}

function buildSlots() {
  if (!SLOTS.length) return;
  const sty = SLOTS.style ? '' : '';
  $('slots').innerHTML = SLOTS.map(s => `<div class="slot"><h4>YOU ${s.n} <span class="m">${fmt(s.t0)}–${fmt(s.t1)} · ${s.section}</span></h4><div>${s.direction}</div><textarea readonly>${s.prompt}</textarea><br><button data-c="${s.n}">Copy prompt</button> <button data-seek="${s.t0}">Jump to slot</button></div>`).join('');
  $('slots').onclick = e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.seek) { v.currentTime = +b.dataset.seek; v.play(); }
    if (b.dataset.c) { navigator.clipboard.writeText(b.parentElement.querySelector('textarea').value); b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy prompt', 1200); } };
}

function setupTabs() {
  document.querySelectorAll('#songTabs button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#songTabs button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + b.dataset.pane));
  });
}
function setupCtrl() {
  $('play').onclick = () => v.paused ? v.play() : v.pause();
  v.onplay = () => $('play').textContent = '❚❚'; v.onpause = () => $('play').textContent = '▶';
  document.querySelectorAll('#speeds button').forEach(b => b.onclick = () => { document.querySelectorAll('#speeds button').forEach(x => x.classList.toggle('on', x === b)); v.playbackRate = +b.dataset.s; });
  $('ovl').onchange = updateOverlay;
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); $('play').click(); }
    else if (e.key === 'ArrowRight') v.currentTime += 5; else if (e.key === 'ArrowLeft') v.currentTime -= 5;
    else if (e.key === ']') seekLine(1); else if (e.key === '[') seekLine(-1);
    else if (e.key.toLowerCase() === 'l') $('loop').click();
  });
}
function seekLine(d) { const i = Math.max(0, Math.min(T.lines.length - 1, (curLine < 0 ? 0 : curLine) + d)); v.currentTime = Math.max(0, T.lines[i].start - .1); }

function lineAt(t) { let lo = 0, hi = T.lines.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (T.lines[m].start - .08 <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }

function updateOverlay() { $('chunk').style.display = (cur && cur.id === 'suno' && $('ovl').checked) ? '' : 'none'; }

function loop() {
  const t = v.currentTime || 0;
  $('time').textContent = `${fmt(t)} / ${fmt(v.duration || T.dur)}`;
  $('head').style.left = t / T.dur * 100 + '%';
  const li = lineAt(t);
  if (li !== curLine) {
    if ($('loop').checked && curLine >= 0 && li !== curLine && v.currentTime > T.lines[curLine].end + .05 && !v.paused) { v.currentTime = Math.max(0, T.lines[curLine].start - .1); }
    else { curLine = li; document.querySelectorAll('.ln.on').forEach(e => e.classList.remove('on')); if (li >= 0) { const e = $('ln' + li); e.classList.add('on'); if (!$('loop').matches(':active')) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
  }
  if (curLine >= 0) {
    const l = T.lines[curLine]; const el = $('ln' + curLine);
    l.words.forEach((w, k) => el.querySelector(`[data-k="${k}"]`).classList.toggle('now', t >= w.t0 - .03 && t < w.t1 + .02));
    let txt = '';
    if (t < l.end + .35) {
      if (l.mode === 'chunks') { const c = [...l.chunks].reverse().find(c => t >= c.t); if (c) txt = c.text; }
      else txt = l.text;
    }
    $('chunk').textContent = txt;
  }
  requestAnimationFrame(loop);
}
init().catch(e => { $('msg').hidden = false; $('msg').textContent = 'Could not load data: ' + e; });
})();
