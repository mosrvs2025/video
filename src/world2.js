// ---- v2: words in 3D space, hallway, AI sun, orbiting words, wall of screens, motion blur ----
const WT={};
function wordTex(txt,col,kind){ // kind 'b' heavy sans | 's' serif italic
  const key=txt+'|'+col+'|'+kind;if(WT[key])return WT[key];
  const fs=160,c0=document.createElement('canvas'),x0=c0.getContext('2d');
  const font=kind==='b'?`900 ${fs}px "Inter Display", Inter, sans-serif`:`italic 600 ${fs}px FreeSerif, "DejaVu Serif", serif`;
  x0.font=font;const tw=Math.ceil(x0.measureText(txt).width);
  const c=document.createElement('canvas');c.width=tw+120;c.height=260;const x=c.getContext('2d');
  x.font=font;x.textAlign='center';x.textBaseline='middle';
  x.shadowColor=rgb(col,.95);x.shadowBlur=38;x.fillStyle=rgb(col);x.fillText(txt,c.width/2,125);
  x.shadowBlur=0;x.fillStyle='rgba(255,255,255,.85)';x.globalCompositeOperation='source-atop';x.fillRect(0,0,c.width,95);
  x.globalCompositeOperation='source-over';
  c.u=.0075;WT[key]=c;return c;
}
// place a word panel. surf: 'F' floor at (x,z) | 'L'/'R' wall at z (height y)
function word3(txt,col,kind,surf,x,y,z,k,sc=1){
  if(k<=0)return;const c=wordTex(txt,col,kind);
  const lim=surf==='B'?99:2.2/(c.width/2*c.u);sc=Math.min(sc*1.35,lim);
  const hw=c.width/2*c.u*sc*(.7+.3*easeOut(k)),hh=c.height/2*c.u*sc*(.7+.3*easeOut(k));
  let C,R,U;
  if(surf==='F'){C=V(x,.04,z);R=V(hw,0,0);U=V(0,0,-hh)}
  else if(surf==='L'){C=V(-2.46,y,z);R=V(0,0,-hw);U=V(0,hh,0)}
  else if(surf==='R'){C=V(2.46,y,z);R=V(0,0,hw);U=V(0,hh,0)}
  else if(surf==='B'){C=V(x,y,z);R=mul(CB.r,hw);U=mul(CB.u,hh)} // billboard
  panel(C,R,U,c,{alpha:Math.min(1,k*2),N:3,double:surf==='B'});
}
// ---- hallway ----
const HL1={t0:22.3,t1:34.34,z0:8,v:4.6,sty:'hall',warm:false};
const HL2={t0:144.3,t1:152.2,z0:6,v:3.0,sty:'dawn',warm:true};
function hallZ(c,t){const tl=t-c.t0;const b=bpos(t),f=b-Math.floor(b);return c.z0-c.v*tl-.35*easeOut(f)*0+0}
function hallShots(c){
  const zc=t=>hallZ(c,t);
  const P=(e,tg,fov,roll=0)=>({eye:e,target:tg,fov,roll});
  return {
   chase:{fn:t=>{const z=zc(t),sw=Math.sin(t*1.3)*.25;return P(V(.5+sw,1.75,z),V(0,1.2,z-14),60,sw*.03)}},
   chase2:{fn:t=>{const z=zc(t);return P(V(-.9,2.1,z+1),V(.3,1.0,z-10),56)}},
   low:{fn:t=>{const z=zc(t);return P(V(0,.3,z+1.5),V(0,.5,z-10),72)}},
   low2:{fn:t=>{const z=zc(t);return P(V(.8,.45,z+2),V(-.4,.7,z-9),66,.06)}},
   side:{fn:t=>{const z=zc(t);return P(V(-2.0,1.3,z+3),V(.8,1.3,z-5),58)}},
   side2:{fn:t=>{const z=zc(t);return P(V(2.0,1.2,z+2),V(-.6,1.3,z-6),58)}},
   high:{fn:t=>{const z=zc(t);return P(V(0,3.3,z+3.5),V(0,0,z-8),58)}},
   front:{fn:t=>{const z=zc(t);return P(V(.3,1.45,z-7.6),V(0,1.4,z-3.6),50)}}, // looks back at hero's face; walking backwards
  };
}
function worldHall(t,c){
  const zc=hallZ(c,t),warm=c.warm,b=bpos(t);
  const pul=onBeat(t);
  const wc=warm?[255,176,84]:[120,215,255];
  const base=warm?[70,40,32]:[22,28,44];
  const zmax=zc+9,zmin=zc-70;
  // floor / ceiling segments
  for(let z=Math.floor(zmax/6)*6;z>zmin;z-=6){
    const d=zc-z+3;
    const fl=fogc(warm?[58,34,28]:[18,22,36],Math.abs(d)),ce=fogc(warm?[40,24,22]:[10,12,22],Math.abs(d));
    quad(V(-2.5,0,z),V(2.5,0,z),V(2.5,0,z-6),V(-2.5,0,z-6),fl,1,false,50);
    quad(V(-2.5,3.6,z),V(2.5,3.6,z),V(2.5,3.6,z-6),V(-2.5,3.6,z-6),ce,1,false,50);
    // walls
    box(V(-2.65,1.8,z-3),[.3,3.6,6],base,{});box(V(2.65,1.8,z-3),[.3,3.6,6],base,{});
  }
  // pillars + wall inset lights + ceiling strips + lane dashes
  for(let z=Math.floor(zmax/4)*4;z>zmin;z-=4){
    box(V(-2.4,1.8,z),[.3,3.6,.5],mix3(base,wc,.12),{edge:mix3(base,wc,.4)});box(V(2.4,1.8,z),[.3,3.6,.5],mix3(base,wc,.12),{edge:mix3(base,wc,.4)});
    const lit=.5+.5*Math.sin(z*.7-t*3);
    line3(V(-2.2,.15,z-2),V(-2.2,3.4,z-2),wc,.25+.35*lit,1.5,true);line3(V(2.2,.15,z-2),V(2.2,3.4,z-2),wc,.25+.35*lit,1.5,true);
  }
  for(let z=Math.floor(zmax/2)*2;z>zmin;z-=2){
    box(V(0,3.55,z),[.18,.05,1.1],wc,{emit:1});
    if(Math.round(z/2)%3===0)glow(V(0,3.3,z),1.1,wc,.55);
    quad(V(-.05,.02,z),V(.05,.02,z),V(.05,.02,z-.9),V(-.05,.02,z-.9),wc,.35+.4*pul,true);
  }
  // end light
  const zend=-70,near=clamp((zc-zend)/70);
  const burst=c.t1-t<2?clamp(1-(c.t1-t)/2):0;
  quad(V(-1.9,.1,zend),V(1.9,.1,zend),V(1.9,3.5,zend),V(-1.9,3.5,zend),warm?[255,225,170]:[220,245,255],1,false,-60);
  glow(V(0,1.8,zend+.5),7+9*(1-near)+burst*8,warm?[255,190,100]:[150,220,255],.7+.3*pul);
  // UI cards on walls
  for(let i=0;i<8;i++){
    const z=Math.floor(zc/9)*9-i*9-4,side=(Math.round(z/9)%2)?'L':'R';
    if(z>zc+3||z<zc-45)continue;
    const nc=tex('hn'+(((Math.round(z/9)%6)+6)%6),640,420);drawNotif(nc,((Math.round(z/9)%6)+6)%6,warm?'amber':'dark');
    const R=side==='L'?V(0,0,-.7):V(0,0,.7);
    panel(V(side==='L'?-2.44:2.44,1.9,z),R,V(0,.46,0),nc,{N:3,alpha:.55});
  }
  // narration words in space
  for(const L of LN){
    const [t0,t1,txt,pos,f,fl,surf]=L;if(fl!=='W'||t0<c.t0||t0>c.t1)continue;
    const g=gridAt(t0),half=g.bp/2,snap=Math.round((t0-g.ph)/half)*half+g.ph;
    const parts=txt.split(/(\*[^*]+\*)/).filter(Boolean).flatMap(p=>{const a=p.startsWith('*');return (a?p.slice(1,-1):p).split(' ').filter(Boolean).map(w=>({w,a}))});
    parts.forEach((p,i)=>{
      const wt=snap+i*half;const k=clamp((t-wt)/.3);if(k<=0)return;
      if(t>t1+3)return;
      const zw=hallZ(c,wt)-7.5;
      const accCol=warm?[255,196,110]:[255,255,255];
      const col=p.a?(warm?[255,150,60]:[90,200,255]):[235,242,255];
      const kind=p.a?'b':'s';
      if(surf==='F'){word3(p.w.toUpperCase&&p.a?p.w.toUpperCase():p.w,col,kind,'F',((i%3)-1)*.55,0,zw,k,p.a?1.15:1)}
      else{const side=i%2?'R':'L';word3(p.a?p.w.toUpperCase():p.w,col,kind,side,0,1.6+(i%3)*.2,zw+3,k,1.2)}
    });
  }
  // hero walking ahead
  const hz=zc-4.6;
  mannequin({x:0+Math.sin(t*1.3)*0,y:Math.abs(Math.cos((t-c.t0)*c.v*1.7))*.04,z:hz,yaw:0,pose:'walk',ph:(t-c.t0)*c.v*1.7*2.2,body:warm?[150,130,120]:HERO,beanie:RED,soul:warm?1:soulAt(t)});
  glow(V(0,1.3,hz+.2),.6,warm?[255,190,90]:[255,170,60],.3);
  dustHall(t,wc,zc);
}
function dustHall(t,col,zc){
  for(let i=0;i<30;i++){const z=zc-hash(i)*30+((t*2+i)%1)*0,x=(hash(i+3)-.5)*4.6,y=.3+hash(i+9)*3;
    glow(V(x,y,z),.08,col,.5)}
}
// ---- AI sun ----
const SUNC=document.createElement('canvas');SUNC.width=SUNC.height=384;const SUNX=SUNC.getContext('2d');
function sunTex(t,gold){
  const c=SUNX,s=384;c.clearRect(0,0,s,s);
  const A=gold?[255,196,60]:[230,50,30],B=gold?[255,240,170]:[255,150,50],D=gold?[190,110,20]:[110,10,10];
  c.save();c.beginPath();c.arc(s/2,s/2,s/2-6,0,7);c.clip();
  let g=c.createRadialGradient(s*.42,s*.4,10,s/2,s/2,s/2);g.addColorStop(0,rgb(B));g.addColorStop(.6,rgb(A));g.addColorStop(1,rgb(D));c.fillStyle=g;c.fillRect(0,0,s,s);
  c.globalCompositeOperation='lighter';
  for(let i=0;i<46;i++){
    const ang=hash(i)*6.28+t*.12*(1+hash(i+1)),r=hash(i+2)*s*.42,x=s/2+Math.cos(ang)*r,y=s/2+Math.sin(ang)*r,rad=20+hash(i+4)*50;
    const lt=i%3===0;g=c.createRadialGradient(x,y,0,x,y,rad);
    g.addColorStop(0,lt?rgb(B,.35):'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  c.globalCompositeOperation='multiply';
  for(let i=0;i<30;i++){
    const ang=hash(i+50)*6.28-t*.1,r=hash(i+51)*s*.45,x=s/2+Math.cos(ang)*r,y=s/2+Math.sin(ang)*r,rad=18+hash(i+53)*46;
    g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,rgb(mix3(D,[255,255,255],.25),.7));g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  c.restore();return SUNC;
}
function sunBoard(p,r,t,gold){
  const tx=sunTex(t,gold);const hw=r;
  glow(p,r*2.6,gold?[255,190,60]:[255,40,30],.55+.2*onBeat(t));
  panel(p,mul(CB.r,hw),mul(CB.u,hw),tx,{N:4,double:true});
  for(let i=0;i<14;i++){const a=i/14*6.28+t*.1;line3(add(p,V(Math.cos(a)*r*.9,Math.sin(a)*r*.9,0)),add(p,V(Math.cos(a)*r*2.4,Math.sin(a)*r*2.4,0)),gold?[255,210,110]:[255,70,40],.12+.12*onBeat(t),2,true)}
}
// ---- orbiting words around the hero (soul being taken) ----
const RINGW=['MISTAKES','DOUBT','STUMBLES','TEARS','WONDER','REGRET','HOPE','MESSY'];
function ringWords(t,cx,cz,core){
  RINGW.forEach((w,i)=>{
    const leave=84.6+i*1.45,k=clamp((t-leave)/1.2);if(k>=1)return;
    const a=i/RINGW.length*6.28+t*.9,R=3.3*(1-.1*Math.sin(t+i));
    let p=V(cx+Math.cos(a)*R,1.3+.5*Math.sin(t*1.3+i),cz+Math.sin(a)*R);
    const e=ease(k);p=V(lerp(p.x,core.x,e),lerp(p.y,core.y,e)+Math.sin(e*3.14)*1.5,lerp(p.z,core.z,e));
    const n=nrm(V(Math.cos(a),0,Math.sin(a)));
    const U=V(0,.34,0),Rr=mul(cross(V(0,1,0),n),1);
    const c=wordTex(w,[255,120,130],'b');const hw=c.width/2*c.u*.4,hh=c.height/2*c.u*.4;
    panel(p,mul(Rr,hw),V(0,hh,0),c,{N:3,alpha:1-k*k,double:true});
    glow(p,.5,[255,70,80],.35*(1-k));
  });
}
// ---- wall of screens (the feed) ----
function screenTex(i){
  const id='sc'+(i%8),c=tex(id,160,100);if(c.done)return c;c.done=1;
  const x=c.getContext('2d');x.fillStyle=['#10182c','#1c1030','#0e2430','#2a1220'][i%4];x.fillRect(0,0,160,100);
  for(let j=0;j<6;j++){x.fillStyle=`hsl(${(i*47+j*31)%360},70%,${45+j*4}%)`;x.fillRect(10,10+j*14,40+hash(i*9+j)*100,8)}
  x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.arc(135,22,12,0,7);x.fill();x.strokeStyle='#5af';x.lineWidth=3;x.strokeRect(2,2,156,96);
  return c;
}
function screenWall(t,z,dim){
  for(let r=0;r<5;r++)for(let i=0;i<13;i++){
    const x=(i-6)*1.35,y=.9+r*.85;
    const fl=hash(i*7+r*13+Math.floor(t*4+i*.3))>.12;if(!fl)continue;
    panel(V(x,y,z),V(.62,0,0),V(0,.38,0),screenTex(i*5+r),{N:2,alpha:dim});
  }
}
// ---- motion blur wrapper ----
const AC=document.createElement('canvas');AC.width=W;AC.height=H;const ACX=AC.getContext('2d');
function blurRender(t,drawFn,n,span){
  ACX.globalAlpha=1;ACX.clearRect(0,0,W,H);
  for(let i=0;i<n;i++){
    drawFn(t-span*i/(n-1||1));
    ACX.globalAlpha=1/(i+1);ACX.drawImage(cv,0,0);
  }
  ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);ctx.drawImage(AC,0,0);
}
