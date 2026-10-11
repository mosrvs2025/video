// node tools/shots.js <html> <outdir> <win> t1 t2 ...   -> PNG of the debug page centred on each time
const { chromium } = require('playwright-core'); const path = require('path');
(async () => {
  const [html, out, win, ...ts] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1800, height: 640 } });
  await p.goto('file://' + path.resolve(html));
  for (const t of ts) {
    await p.evaluate(([t, w]) => { document.getElementById('win').value = w; window.seek(+t + 0.35 * w); }, [t, win]);
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${out}/dbg_${t}.png` });
  }
  await b.close();
})();
