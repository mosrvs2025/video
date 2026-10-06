// ---- core 3D canvas engine ----
const W=1280,H=720;
const cv=document.getElementById('c');cv.width=W;cv.height=H;
const ctx=cv.getContext('2d');
const V=(x,y,z)=>({x,y,z});
const add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z), sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z), mul=(a,s)=>V(a.x*s,a.y*s,a.z*s);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z, cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const len=a=>Math.hypot(a.x,a.y,a.z), nrm=a=>{const l=len(a)||1;return mul(a,1/l)};
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut=t=>1-Math.pow(1-t,3);
const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const mix3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const rgb=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

// camera
let cam={eye:V(0,2,6),target:V(0,1.5,0),fov:55,roll:0};
let CB={}; // basis
function camSetup(){
  const f=nrm(sub(cam.target,cam.eye));
  let r=nrm(cross(f,V(0,1,0)));
  if(len(cross(f,V(0,1,0)))<1e-4) r=V(1,0,0);
  const u=cross(r,f);
  CB={f,r,u,foc:(H/2)/Math.tan(cam.fov*Math.PI/360),cr:Math.cos(cam.roll),sr:Math.sin(cam.roll)};
}
function toCam(p){const d=sub(p,cam.eye);return V(dot(d,CB.r),dot(d,CB.u),dot(d,CB.f))}
function scr(c){ // camera-space -> screen
  let x=c.x/c.z*CB.foc,y=c.y/c.z*CB.foc;
  const rx=x*CB.cr-y*CB.sr, ry=x*CB.sr+y*CB.cr;
  return [W/2+rx,H/2-ry];
}
const NEAR=0.15;
function clipPoly(pts){ // camera-space polygon vs near plane
  const out=[];
  for(let i=0;i<pts.length;i++){
    const a=pts[i],b=pts[(i+1)%pts.length];
    const ina=a.z>=NEAR,inb=b.z>=NEAR;
    if(ina)out.push(a);
    if(ina!==inb){const t=(NEAR-a.z)/(b.z-a.z);out.push(V(lerp(a.x,b.x,t),lerp(a.y,b.y,t),NEAR))}
  }
  return out;
}
function clipSeg(a,b){
  if(a.z<NEAR&&b.z<NEAR)return null;
  if(a.z<NEAR){const t=(NEAR-a.z)/(b.z-a.z);a=V(lerp(a.x,b.x,t),lerp(a.y,b.y,t),NEAR)}
  else if(b.z<NEAR){const t=(NEAR-b.z)/(a.z-b.z);b=V(lerp(b.x,a.x,t),lerp(b.y,a.y,t),NEAR)}
  return [a,b];
}
// painter queue
let Q=[];
const push=(d,fn)=>Q.push({d,fn});
function flush(){Q.sort((a,b)=>b.d-a.d);for(const q of Q)q.fn();Q=[]}

// scene style
let ST={bg0:[10,12,24],bg1:[20,26,48],fog:[12,16,30],fogN:8,fogF:40,amb:.45,light:nrm(V(-.4,.9,.5)),grid:[80,120,200],gridA:.35};
function fogc(c,d){const f=clamp((d-ST.fogN)/(ST.fogF-ST.fogN));return mix3(c,ST.fog,f*.92)}

// rotation helper: rx then ry
function rotv(v,rx,ry){
  let y=v.y*Math.cos(rx)-v.z*Math.sin(rx), z=v.y*Math.sin(rx)+v.z*Math.cos(rx);
  v=V(v.x,y,z);
  return V(v.x*Math.cos(ry)+v.z*Math.sin(ry),v.y,-v.x*Math.sin(ry)+v.z*Math.cos(ry));
}
const FACES=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]];
const FN=[V(0,0,1),V(0,0,-1),V(-1,0,0),V(1,0,0),V(0,1,0),V(0,-1,0)];
// verts: 0:-x-y+z 1:+x-y+z 2:+x+y+z 3:-x+y+z 4:-x-y-z 5:+x-y-z 6:+x+y-z 7:-x+y-z
function box(c,s,col,o={}){
  const rx=o.rx||0,ry=o.ry||0,hx=s[0]/2,hy=s[1]/2,hz=s[2]/2;
  const lv=[[-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz],[-hx,-hy,-hz],[hx,-hy,-hz],[hx,hy,-hz],[-hx,hy,-hz]];
  const wv=lv.map(p=>add(c,rotv(V(p[0],p[1],p[2]),rx,ry)));
  const cc=wv.map(toCam);
  const cen=toCam(c);
  if(cen.z<-4)return;
  const alpha=o.alpha==null?1:o.alpha;
  push(cen.z,()=>{
    const faces=[];
    for(let i=0;i<6;i++){
      const n=rotv(FN[i],rx,ry);
      const fc=add(c,V(0,0,0));
      const fp=FACES[i];
      const mid=V((wv[fp[0]].x+wv[fp[2]].x)/2,(wv[fp[0]].y+wv[fp[2]].y)/2,(wv[fp[0]].z+wv[fp[2]].z)/2);
      if(dot(n,sub(cam.eye,mid))<=0)continue;
      const dd=toCam(mid).z;
      faces.push({i,n,dd,fp});
    }
    faces.sort((a,b)=>b.dd-a.dd);
    for(const f of faces){
      let poly=clipPoly(f.fp.map(k=>cc[k]));
      if(poly.length<3)continue;
      const sh=ST.amb+(1-ST.amb)*Math.max(0,dot(f.n,ST.light));
      let col2=col.map(v=>v*sh);
      if(o.emit)col2=mix3(col2,col,o.emit);
      col2=fogc(col2,f.dd);
      const p2=poly.map(scr);
      ctx.beginPath();ctx.moveTo(p2[0][0],p2[0][1]);for(let k=1;k<p2.length;k++)ctx.lineTo(p2[k][0],p2[k][1]);ctx.closePath();
      if(!o.wire){ctx.fillStyle=rgb(col2,alpha);ctx.fill();
        if(o.edge){ctx.strokeStyle=rgb(o.edge,alpha*.8);ctx.lineWidth=1;ctx.stroke()}}
      else{ctx.strokeStyle=rgb(o.wireCol||col,alpha);ctx.lineWidth=1.5;ctx.stroke()}
    }
  });
}
// 3D line
function line3(a,b,col,a_=1,w=1.5,add_=false){
  const A=toCam(a),B=toCam(b);const cs=clipSeg(A,B);if(!cs)return;
  push(Math.max(cs[0].z,cs[1].z),()=>{
    const p=scr(cs[0]),q=scr(cs[1]);
    ctx.save();if(add_)ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=rgb(col,a_);ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.restore();
  });
}
// flat quad (world), filled
function quad(p0,p1,p2,p3,col,a_=1,add_=false,depthBias=0){
  const cs=[p0,p1,p2,p3].map(toCam);const poly=clipPoly(cs);if(poly.length<3)return;
  const d=poly.reduce((s,p)=>s+p.z,0)/poly.length+depthBias;
  push(d,()=>{const p2=poly.map(scr);ctx.save();if(add_)ctx.globalCompositeOperation='lighter';
    ctx.beginPath();ctx.moveTo(p2[0][0],p2[0][1]);for(let k=1;k<p2.length;k++)ctx.lineTo(p2[k][0],p2[k][1]);ctx.closePath();ctx.fillStyle=rgb(col,a_);ctx.fill();ctx.restore()});
}
// glow sprite
function glow(p,r,col,a_=1){
  const c=toCam(p);if(c.z<NEAR)return;
  const s=scr(c),pr=r/c.z*CB.foc;if(pr<1)return;
  push(c.z-0.01,()=>{
    ctx.save();ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(s[0],s[1],0,s[0],s[1],pr);
    g.addColorStop(0,rgb(col,a_));g.addColorStop(.35,rgb(col,a_*.35));g.addColorStop(1,rgb(col,0));
    ctx.fillStyle=g;ctx.fillRect(s[0]-pr,s[1]-pr,pr*2,pr*2);ctx.restore();
  });
}
// textured panel
const TEX={};
function tex(id,w=640,h=420){if(!TEX[id]){const c=document.createElement('canvas');c.width=w;c.height=h;TEX[id]=c}return TEX[id]}
function panel(center,right,up,texc,o={}){ // right/up = half-extent vectors
  const n=cross(right,up);
  if(!o.double&&dot(n,sub(cam.eye,center))<=0)return;
  const N=o.N||4;const tw=texc.width,th=texc.height;
  const pts=[];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
    const u=i/N,v=j/N;
    const wp=add(center,add(mul(right,(u*2-1)*(dot(n,sub(cam.eye,center))>0?1:-1)),mul(up,1-v*2)));
    pts.push({c:toCam(wp),u:u*tw,v:v*th});
  }
  for(const p of pts)if(p.c.z<NEAR)return;
  const dc=toCam(center).z;
  push(dc,()=>{
    ctx.save();
    ctx.globalAlpha=o.alpha==null?1:o.alpha;
    const S=pts.map(p=>scr(p.c));
    const tri=(a,b,c)=>{
      const [x0,y0]=S[a],[x1,y1]=S[b],[x2,y2]=S[c];
      const pa=pts[a],pb=pts[b],pc=pts[c];
      const cx=(x0+x1+x2)/3,cy=(y0+y1+y2)/3;
      const ex=(x,y)=>{const dx=x-cx,dy=y-cy,l=Math.hypot(dx,dy)||1;return [x+dx/l*.7,y+dy/l*.7]};
      const e0=ex(x0,y0),e1=ex(x1,y1),e2=ex(x2,y2);
      ctx.save();ctx.beginPath();ctx.moveTo(e0[0],e0[1]);ctx.lineTo(e1[0],e1[1]);ctx.lineTo(e2[0],e2[1]);ctx.closePath();ctx.clip();
      const du1=pb.u-pa.u,dv1=pb.v-pa.v,du2=pc.u-pa.u,dv2=pc.v-pa.v;
      const det=du1*dv2-du2*dv1;if(Math.abs(det)<1e-9){ctx.restore();return}
      const a_=((x1-x0)*dv2-(x2-x0)*dv1)/det,c_=((x2-x0)*du1-(x1-x0)*du2)/det;
      const b_=((y1-y0)*dv2-(y2-y0)*dv1)/det,d_=((y2-y0)*du1-(y1-y0)*du2)/det;
      ctx.setTransform(a_,b_,c_,d_,x0-a_*pa.u-c_*pa.v,y0-b_*pa.u-d_*pa.v);
      ctx.drawImage(texc,0,0);ctx.restore();
    };
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){
      const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;tri(a,b,c);tri(b,d,c);
    }
    ctx.restore();
  });
}
// ---- beat helpers (piecewise grids; set by setBeats) ----
let GR=[];
function gridAt(t){let g=GR[0];for(const x of GR)if(t>=x.t)g=x;return g}
const bpos=t=>{const g=gridAt(t);return (t-g.ph)/g.bp};
const pulse=t=>{const b=bpos(t)*2;const f=b-Math.floor(b);return Math.exp(-f*5)};   // half-beat
const onBeat=t=>{const b=bpos(t);const f=b-Math.floor(b);return Math.exp(-f*6)};
const beatIdx=t=>Math.floor(bpos(t));
const beatT=k=>t=>0;
function beatTime(t,k){ // time of beat index k near t
  const g=gridAt(t);return g.ph+k*g.bp}
