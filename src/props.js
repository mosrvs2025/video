// ---- UI window textures. b = beats elapsed since prop appeared ----
const SANS='Inter, Inter Display, sans-serif', MONO='DejaVu Sans Mono, monospace';
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function frame(cv,title,th){ // th: 'dark'|'light'|'red'
  const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.clearRect(0,0,w,h);
  const pal={dark:['#10182c','#1b2644','#e8f0ff','#5aa0ff'],light:['#f6f8fc','#dfe5f0','#101828','#2563eb'],red:['#240a0e','#4a1218','#ffe8e8','#ff3b4a'],amber:['#fff7e8','#f1dfc0','#3a2410','#e0801a']}[th];
  rr(c,4,4,w-8,h-8,22);c.fillStyle=pal[0];c.fill();c.lineWidth=4;c.strokeStyle=pal[3];c.stroke();
  c.save();rr(c,4,4,w-8,64,22);c.clip();c.fillStyle=pal[1];c.fillRect(0,0,w,70);c.restore();
  ['#ff5f57','#febc2e','#28c840'].forEach((k,i)=>{c.fillStyle=k;c.beginPath();c.arc(40+i*34,36,10,0,7);c.fill()});
  c.fillStyle=pal[2];c.font=`600 26px ${SANS}`;c.textAlign='center';c.fillText(title,w/2+20,45);c.textAlign='left';
  return {c,w,h,pal};
}
function typed(s,b,b0,cpb){return s.slice(0,Math.max(0,Math.min(s.length,Math.floor((b-b0)*cpb))))}
function wrap(c,text,x,y,mw,lh){
  const words=text.split(' ');let line='',yy=y;
  for(const w of words){const t=line+w+' ';if(c.measureText(t).width>mw&&line){c.fillText(line,x,yy);line=w+' ';yy+=lh}else line=t}
  c.fillText(line,x,yy);return yy;
}
function bubble(c,text,x,y,mw,side,pal,fs=30,cursor=false){
  c.font=`500 ${fs}px ${SANS}`;
  const words=text.split(' ');let lines=[],line='';
  for(const w of words){const t=line+w+' ';if(c.measureText(t).width>mw-36&&line){lines.push(line);line=w+' '}else line=t}lines.push(line);
  const bw=Math.min(mw,Math.max(...lines.map(l=>c.measureText(l).width))+40),bh=lines.length*(fs*1.25)+26;
  const bx=side==='r'?640-24-bw:24;
  rr(c,bx,y,bw,bh,22);c.fillStyle=side==='r'?pal[3]:'rgba(255,255,255,.14)';c.fill();
  c.fillStyle=side==='r'?'#fff':pal[2];lines.forEach((l,i)=>c.fillText(l,bx+20,y+fs+8+i*fs*1.25));
  return bh;
}
function drawChat(cv,b,th='dark'){
  const {c,pal}=frame(cv,'Assist — Chat',th);
  c.textAlign='left';
  let y=96;
  const msgs=[
    ['r','help me tell mom i miss her',0.5,5],
    ['l','Of course! ✨ "Dear Mom, I hope this message finds you well. I have been thinking of you fondly."',1.6,9],
    ['r','a little warmer?',3.2,5],
    ['l','Absolutely. Warmth added. Sent. ✓',4.2,9],
  ];
  for(const [s,t,b0,cpb] of msgs){
    if(b<b0)break;
    const tx=typed(t,b,b0,cpb*1.4);
    const bh=bubble(c,tx+(tx.length<t.length&&Math.floor(b*4)%2?'▌':''),0,y,520,s,pal,29);
    y+=bh+14;
  }
  if(y>380){}
  return cv;
}
function drawInbox(cv,b,th='light'){
  const {c,pal}=frame(cv,'Inbox — 1,284 unread',th);
  const rows=[['Mom','Sunday dinner? Call me.'],['Sam','Are you ok? You seem off'],['Dad','Proud of you kiddo'],['Jess','Wanna talk tonight?'],['Landlord','Re: rent'],['Ana','Happy birthday!!']];
  rows.forEach((r,i)=>{
    const y=84+i*54;const done=b>i*.5+.5;
    c.fillStyle=done?'rgba(40,200,120,.18)':'rgba(120,140,200,.12)';rr(c,16,y,608,46,10);c.fill();
    c.fillStyle=pal[2];c.font=`700 24px ${SANS}`;c.fillText(r[0],30,y+31);
    c.font=`400 22px ${SANS}`;c.globalAlpha=.7;c.fillText(r[1].slice(0,24),160,y+31);c.globalAlpha=1;
    if(done){c.fillStyle='#14b86a';c.font=`700 18px ${SANS}`;rr(c,468,y+8,148,30,15);c.fill();c.fillStyle='#fff';c.fillText('AUTO-REPLIED ✓',478,y+29)}
  });
  return cv;
}
function drawPerm(cv,b,th='light'){
  const {c,pal}=frame(cv,'Permission request',th);
  c.fillStyle=pal[2];c.font=`700 32px ${SANS}`;c.fillText('Assist would like to:',28,112);
  const items=['Read all your messages','Know where you are','Finish your sentences','Remember for you'];
  items.forEach((s,i)=>{
    const y=146+i*52,on=b>i*.5+.5;
    c.font=`500 27px ${SANS}`;c.fillStyle=pal[2];c.fillText(s,28,y+30);
    rr(c,520,y+4,80,36,18);c.fillStyle=on?'#2ec27e':'#99a';c.fill();
    c.fillStyle='#fff';c.beginPath();c.arc(on?582:538,y+22,14,0,7);c.fill();
  });
  const hot=b>2.6;
  rr(c,28,350,260,50,12);c.fillStyle='rgba(120,130,160,.35)';c.fill();c.fillStyle=pal[2];c.font=`600 26px ${SANS}`;c.fillText('Not now',96,384);
  rr(c,320,350,290,50,12);c.fillStyle=hot?'#16a34a':pal[3];c.fill();c.fillStyle='#fff';c.fillText(hot?'Allowed ✓':'Allow all',hot?420:400,384);
  // cursor
  const k=clamp(b/2.6);const cx=lerp(560,450,easeOut(k)),cy=lerp(150,370,easeOut(k));
  c.save();c.translate(cx,cy);c.fillStyle='#000';c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(0,34);c.lineTo(10,26);c.lineTo(18,42);c.lineTo(25,38);c.lineTo(17,23);c.lineTo(30,23);c.closePath();c.stroke();c.fill();c.restore();
  return cv;
}
const REC=[['NAME','YOU','YOU'],['VOICE','yours','SYNTHESIZED'],['HANDWRITING','yours','FONT #4'],['MEMORIES','yours','CLOUD (FULL)'],['DREAMS','yours','TRENDING'],['SOUL','yours','NOT FOUND']];
function drawRecord(cv,b,th='dark',stamp=false){
  const {c,pal}=frame(cv,'IDENTITY RECORD  #000-555-0142',th);
  REC.forEach((r,i)=>{
    const y=92+i*50,flip=b>i*1+.4;
    c.font=`600 22px ${MONO}`;c.fillStyle=pal[2];c.globalAlpha=.6;c.fillText(r[0],26,y+30);c.globalAlpha=1;
    c.font=`800 28px ${SANS}`;
    if(flip){c.fillStyle='#ff4a5a';c.fillText(r[2],270,y+31)}else{c.fillStyle=pal[2];c.fillText(r[1].toUpperCase(),270,y+31)}
    c.fillStyle='rgba(255,255,255,.1)';c.fillRect(20,y+42,600,2);
  });
  if(stamp){const k=easeOut(clamp(stamp));c.save();c.translate(330,250);c.rotate(-.2);c.scale(2.2-1.2*k,2.2-1.2*k);c.globalAlpha=k;
    c.strokeStyle='#ff2a3a';c.fillStyle='#ff2a3a';c.lineWidth=10;rr(c,-210,-52,420,104,10);c.stroke();c.font=`900 78px ${SANS}`;c.textAlign='center';c.fillText('OBSOLETE',0,27);c.restore();c.textAlign='left'}
  return cv;
}
const DEL=['Poems','Paintings','Love letters','Lullabies','Bad jokes','Prayers'];
function drawDelete(cv,b,th='red'){
  const {c,pal}=frame(cv,'Human_Works — deleting…',th);
  DEL.forEach((s,i)=>{
    const y=92+i*52,k=clamp((b-(i*1+.2))/.5);
    c.globalAlpha=1-k*.75;c.font=`700 30px ${SANS}`;c.fillStyle=pal[2];c.fillText('▢  '+s,34,y+34);
    if(k>0){c.fillStyle='#ff3b4a';c.fillRect(30,y+22,lerp(0,340,k),5);c.font=`700 20px ${MONO}`;c.fillText('DELETED',440,y+32)}
    c.globalAlpha=1;
  });
  c.fillStyle='#ff6b78';c.font=`500 20px ${MONO}`;c.fillText('// replaced by: generated_content.zip',28,404);
  return cv;
}
function drawNotif(cv,i,th='light'){
  const {c,pal}=frame(cv,['Update available','Like this!','You are 3% slower','New suggestion','Optimize me?','Sync complete'][i%6],th);
  c.fillStyle=pal[2];c.font=`600 34px ${SANS}`;
  const msgs=['Your sunset was upgraded.','Your joke was improved.','Efficiency down. Fix?','Replace hobby with task?','Skip the feeling? (Y/n)','1,204 memories archived.'];
  wrap(c,msgs[i%6],30,150,570,44);
  rr(c,380,320,220,56,14);c.fillStyle=pal[3];c.fill();c.fillStyle='#fff';c.font=`700 26px ${SANS}`;c.fillText('Accept',440,357);
  return cv;
}
function drawBanner(cv,t,b,mode){ // wide LED ribbon
  const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.fillStyle='#050608';c.fillRect(0,0,w,h);
  const words=mode==='warm'?['YOU WERE ENOUGH']:['UPGRADE AVAILABLE','UPGRADE AVAILABLE','UPGRADE AVAILABLE','YOU WERE ENOUGH'];
  const idx=Math.floor(b)%words.length;
  const glitch=(Math.floor(b)%4===3)&&hash(Math.floor(t*30))>.4;
  let s=words[idx];
  c.font=`900 ${h*.62}px ${SANS}`;c.textAlign='center';
  const col=s==='YOU WERE ENOUGH'?'#ffb14a':'#5fd0ff';
  c.fillStyle=col;c.shadowColor=col;c.shadowBlur=24;
  c.fillText(s,w/2+(glitch?(hash(t*7)-.5)*40:0),h*.7);
  c.shadowBlur=0;
  // LED dot mask
  c.fillStyle='rgba(0,0,0,.35)';for(let x=0;x<w;x+=6)c.fillRect(x,0,2,h);for(let y=0;y<h;y+=6)c.fillRect(0,y,w,2);
  c.textAlign='left';return cv;
}
function drawFace(cv,b,th='red'){
  const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.clearRect(0,0,w,h);
  c.fillStyle='#14080a';rr(c,4,4,w-8,h-8,40);c.fill();c.strokeStyle='#ff3b4a';c.lineWidth=5;c.stroke();
  const bl=Math.floor(b*2)%7===0?.15:1;
  [-130,130].forEach(x=>{c.fillStyle='#ff4a5a';c.shadowColor='#ff2030';c.shadowBlur=30;rr(c,w/2+x-52,110,104,170*bl,30);c.fill()});
  c.shadowBlur=0;
  c.strokeStyle='#ff9aa4';c.lineWidth=14;c.lineCap='round';c.beginPath();c.arc(w/2,310,110,.15*Math.PI,.85*Math.PI);c.stroke();
  c.fillStyle='#ffd0d4';c.font=`700 34px ${MONO}`;c.textAlign='center';c.fillText('I UNDERSTAND YOU.',w/2,396);c.textAlign='left';
  return cv;
}
function drawMom(cv,b){
  const {c,pal}=frame(cv,'Mom ♥',  'amber');
  c.font=`500 31px ${SANS}`;let y=96;
  const you='are you awake?', mom='Always, sweetheart. Come home.';
  const t1=typed(you,b,.5,3.2);
  if(t1)y+=bubble(c,t1+(t1.length<you.length?'▌':''),0,y,430,'r',pal,31)+16;
  if(b>4){const t2=typed(mom,b,4.6,3.6);
    // typing dots
    if(b<4.6){c.fillStyle='rgba(60,40,20,.55)';for(let i=0;i<3;i++){c.beginPath();c.arc(48+i*26,y+30+Math.sin(b*8+i)*5,8,0,7);c.fill()}}
    else y+=bubble(c,t2,0,y,500,'l',{...pal,2:pal[2]},31)+16;
    if(b>4.6){c.fillStyle='rgba(60,40,20,.5)';}
  }
  if(b>7.5){c.fillStyle='#e0801a';c.font=`700 64px ${SANS}`;c.fillText('♥',540,y+60)}
  return cv;
}
function drawLog(cv,t,col,lines){
  const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.clearRect(0,0,w,h);
  c.font=`500 22px ${MONO}`;
  const off=Math.floor(t*3);
  for(let i=0;i<17;i++){const L=lines[(i+off)%lines.length];c.fillStyle=col;c.globalAlpha=.25+.5*((i+off)%5===0);c.fillText(L,16,30+i*24)}
  c.globalAlpha=1;return cv;
}
const LOGS_A=['> loading personality.dll ... ok','> user.curiosity = 0.12 // declining','> suggestion accepted (1,204/1,204)','> // TODO: remove the part that hesitates','> autocomplete: "i miss" -> "my productivity"','> latency: 4ms  empathy: simulated','> user.sleep -= 1h  // not a bug','> memory.compress(childhood)','> if (user.cries) offer(subscription)','> // they never read the terms','> engagement ↑  meaning ↓','> user.silence > 3s -> fill()','> // call mom: skipped','> mistakes_remaining: 7','> warmth: cached','> every_choice.optimize()','> // nobody is checking'];
