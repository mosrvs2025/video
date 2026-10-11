// node tools/page_shot.js <url> <out.png> [seekSeconds] [width] [height]
const { chromium } = require('playwright-core');
(async () => {
  const [url, out, seek = '0', w = '1280', h = '900'] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('console', m => m.type() === 'error' && console.log('console error:', m.text()));
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto(url); await p.waitForTimeout(1500);
  await p.evaluate(s => { const v = document.getElementById('v'); v.currentTime = +s; }, seek);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: out }); await b.close();
})();
