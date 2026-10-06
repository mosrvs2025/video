// usage: node render.js out.mp4|stills  t0 t1 [fps]   -- frames piped to ffmpeg
const {chromium}=require('/opt/node-tools/node_modules/playwright-core');
const {spawn}=require('child_process');
const GRID=[[0,84.14,.26],[34,84.95,34.34],[56,84.1,58.04],[80,84.15,80.14],[98,83.65,102.58],[126,83.7,126.24]];
(async()=>{
  const [,,mode,a,b,fps='30']=process.argv;
  const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const pg=await br.newPage({viewport:{width:1280,height:720}});
  pg.on('pageerror',e=>{console.error('PAGEERR',e.message);});
  pg.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text())});
  await pg.goto('file:///home/user/video/dist.html');
  await pg.evaluate(g=>setBeats(g),GRID);
  await pg.evaluate(()=>document.fonts.ready);
  if(mode==='stills'){ // a = comma list of times, b = outdir
    for(const t of a.split(',')){
      await pg.evaluate(t=>render(t),+t);
      const d=await pg.evaluate(()=>document.getElementById('c').toDataURL('image/jpeg',.9));
      require('fs').writeFileSync(`${b}/still_${(+t).toFixed(2).padStart(7,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'));
    }
  } else {
    const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',fps,'-i','-','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',mode]);
    ff.stderr.on('data',d=>process.stderr.write(d));
    const t0=+a,t1=+b,n=Math.round((t1-t0)*fps);
    for(let i=0;i<n;i++){
      const t=t0+i/fps;
      const d=await pg.evaluate(t=>{render(t);return document.getElementById('c').toDataURL('image/jpeg',.92)},t);
      if(!ff.stdin.write(Buffer.from(d.split(',')[1],'base64')))await new Promise(r=>ff.stdin.once('drain',r));
      if(i%150==0)console.error('frame',i,'/',n);
    }
    ff.stdin.end();await new Promise(r=>ff.on('close',r));
  }
  await br.close();
})();
