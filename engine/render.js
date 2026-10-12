#!/usr/bin/env node
// Per-frame renderer.  node engine/render.js <songDir> <startFrame> <endFrame> <out.mp4> [fps=30] [stillDir]
//   frames [start,end) are rendered in headless Chromium and piped to ffmpeg as JPEG (image2pipe).
//   node engine/render.js <songDir> --stills <outdir> t1 t2 ...   writes PNG stills at those times
//   node engine/render.js <songDir> --overlays <outdir>           writes keyed + labeled slot overlay PNGs
const { chromium } = require('playwright-core'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
(async () => {
  const [song, a1, a2, a3, a4] = process.argv.slice(2);
  const data = fs.readFileSync(path.join(song, 'work/data.json'), 'utf8');
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('pageerror', e.message)); page.on('console', m => m.type() === 'error' && console.error('console', m.text()));
  await page.addInitScript(`window.SONG=${data};window.LAYOUT=${fs.readFileSync(path.join(__dirname, 'layout.json'), 'utf8')};`);
  await page.goto('file://' + path.resolve(__dirname, 'player.html')); await page.evaluate(() => window.__ready);
  const save = (p, d) => fs.writeFileSync(p, Buffer.from(d.split(',')[1], 'base64'));
  if (a1 === '--stills') { fs.mkdirSync(a2, { recursive: true }); for (const t of process.argv.slice(5)) { const d = await page.evaluate(t => { window.frameAt(+t); return document.getElementById('cv').toDataURL('image/png'); }, t); save(path.join(a2, `t${(+t).toFixed(2).padStart(8, '0')}.png`), d); } await browser.close(); return; }
  if (a1 === '--layers') { fs.mkdirSync(a2, { recursive: true }); for (const t of process.argv.slice(5)) { const urls = await page.evaluate(t => { window.frameAt(+t); return window.__dumpLayers(); }, t); urls.forEach((d, i) => save(path.join(a2, `L${i}_${(+t).toFixed(2)}.png`), d)); } await browser.close(); return; }
  if (a1 === '--boxes') { const out = []; for (const t of process.argv.slice(4)) { out.push({ t: +t, box: await page.evaluate(t => { window.frameAt(+t); return window.__lastText; }, t) }); } console.log(JSON.stringify(out)); await browser.close(); return; }
  if (a1 === '--overlays') { fs.mkdirSync(a2, { recursive: true }); const slots = JSON.parse(data).slots; save(path.join(a2, 'keyed.png'), await page.evaluate(() => window.overlay('keyed', null)));
    for (const s of slots) save(path.join(a2, `labeled_${s.n}.png`), await page.evaluate(s => window.overlay('labeled', s), s)); await browser.close(); return; }
  const start = +a1, end = +a2, out = a3, fps = +(a4 || 30);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = start; f < end; f++) {
    const d = await page.evaluate(t => window.frameAt(t), f / fps); const buf = Buffer.from(d.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - start) % 150 === 0) console.log(`[${start}-${end}) frame ${f} (${((f - start) / ((Date.now() - t0) / 1000)).toFixed(1)} fps)`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
