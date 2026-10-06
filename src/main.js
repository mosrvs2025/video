// ---- story, timeline, scenes ----
const STY={
 cool:{bg0:[6,10,24],bg1:[22,34,66],fog:[14,22,44],fogN:8,fogF:42,amb:.5,grid:[90,140,230],gridA:.4,body:[200,208,224],acc:[120,200,255],plate:'dark',th:'dark'},
 light:{bg0:[238,243,252],bg1:[214,224,242],fog:[226,234,247],fogN:10,fogF:50,amb:.62,grid:[90,120,190],gridA:.35,body:[56,62,82],acc:[20,100,255],plate:'light',th:'light'},
 red:{bg0:[26,2,6],bg1:[84,10,18],fog:[40,6,10],fogN:8,fogF:36,amb:.4,grid:[255,60,70],gridA:.45,body:[200,200,210],acc:[255,80,90],plate:'dark',th:'red'},
 void:{bg0:[2,3,8],bg1:[12,16,30],fog:[3,4,10],fogN:6,fogF:30,amb:.45,grid:[80,110,170],gridA:.25,body:[150,158,176],acc:[255,196,100],plate:'dark',th:'dark'},
 rebirth:{bg0:[14,4,40],bg1:[70,20,90],fog:[26,10,50],fogN:10,fogF:46,amb:.5,grid:[255,120,220],gridA:.5,body:[200,200,220],acc:[255,210,90],plate:'dark',th:'dark'},
 hall:{bg0:[3,5,12],bg1:[10,18,34],fog:[6,10,22],fogN:6,fogF:46,amb:.5,grid:[120,215,255],gridA:0,body:[210,220,235],acc:[120,215,255],plate:'dark',th:'dark'},
 dawn:{bg0:[26,10,10],bg1:[120,56,24],fog:[60,26,16],fogN:8,fogF:40,amb:.55,grid:[255,170,80],gridA:.3,body:[210,200,190],acc:[255,176,84],plate:'dark',th:'amber'},
};
const HERO=[70,80,110]; const RED=[236,36,48];
const O=(tx,ty,tz,r,az,el,fov,rate=4)=>({t:V(tx,ty,tz),r,az,el,fov,rate});
function orbitPose(s,tl){
  const az=(s.az+s.rate*tl)*Math.PI/180,el=s.el*Math.PI/180;
  return {eye:add(s.t,V(s.r*Math.sin(az)*Math.cos(el),s.r*Math.sin(el),s.r*Math.cos(az)*Math.cos(el))),target:s.t,fov:s.fov,roll:s.roll||0};
}
// ---- shots ----
const RM={ // room
 wide:O(0,1.8,-2,8.5,-15,10,60),front:O(0,1.4,0,3.2,165,8,50),low:O(0,1.1,-1,4.2,35,-3,60),over:O(0,1.7,-2.6,5.2,18,12,52),
 chat:O(0,1.9,-3.4,3.7,6,3,45),chat2:O(0,1.9,-3.4,3.5,-14,-2,44),chat3:O(.4,1.7,-3.4,4,22,6,46),
 inbox:O(-3.3,1.8,-2.6,3.4,29,2,46),inbox2:O(-3.3,1.8,-2.6,3.9,10,-3,46),perm:O(3.3,1.8,-2.6,3.4,-29,2,46),perm2:O(3.3,1.8,-2.6,3.9,-8,-3,46),
 top:O(0,1,-1,6.5,10,62,52),back:O(0,1.4,.3,3,30,8,48),
};
const FX={ // factory; hero (0,.3,0)
 rec:O(-2.8,2.3,-1.8,2.8,10,3,48),rec2:O(-2.8,2.3,-1.8,3.3,-10,-3,50),hero:O(0,1.5,0,3.2,-20,6,45),low:O(0,.9,0,4.5,25,-3,60),
 belt:O(3,.8,0,5,60,4,55),scan:O(0,1.5,0,3,90,5,50),wide:O(0,2.5,-1,11,-10,14,58),top:O(0,1,0,9,30,55,50),ban:O(0,5.5,-7,6.5,0,-4,50),
 hero2:O(0,1.4,0,2.2,15,2,42),belt2:O(-4,.8,0,5,-55,6,55),low2:O(0,.7,2,3.6,-30,-6,64),wide2:O(0,3,-1,12,25,10,60),
};
const RD={ // red
 face:O(0,3.4,-6.9,5.5,0,0,45),face2:O(0,3.4,-6.9,4,14,3,50),
 win:O(2,2.2,-1.5,2.7,-10,3,46),win2:O(2,2.2,-1.5,3.2,12,-2,48),hero:O(-1.6,1.4,0,3.2,15,5,48),wide:O(0,2.2,-2,9,-12,12,58),low:O(-1.6,.8,0,4,-20,-4,62),
 top:O(0,1,-2,9,15,60,50),rec:O(0,2.4,-2.5,3.6,0,3,46),rec2:O(0,2.4,-2.5,3,-14,-2,46),hero0:O(0,1.4,0,3,10,4,46),core:O(0,3.3,-5,5,-20,6,56),
 heroL:O(0,.9,0,3.4,-25,-6,60),side:O(0,1.6,-2,6,80,6,52),orb:O(0,2.6,-3,4.5,-20,4,52),heroC:O(0,1.45,0,1.9,5,2,40),
};
const VD={ // void / crowd
 solo:O(0,1.3,0,4,0,5,50),solo2:O(0,1.5,0,2.5,12,2,40),
 wide:O(0,2,0,10,10,8,60),hero:O(0,1.5,0,3.2,-15,4,46),low:O(0,.8,0,5,25,-3,64),side:O(0,1.5,-2,8,70,6,55),top:O(0,1,-3,11,20,52,52),hero2:O(0,1.4,0,2.2,20,2,42),behind:O(0,1.8,-2,7,-35,10,58),
};
const RB={
 wide:O(0,2.2,-2,10,0,9,62,6),low:O(0,.7,0,5,-20,-4,66,6),hero:O(0,1.5,0,3,15,4,48,6),top:O(0,1,-4,11,20,58,54,6),side:O(0,1.6,-3,8,-75,6,56,6),hero2:O(0,1.4,0,2,-10,2,40,6),
 crowd:O(0,1.5,-6,5.5,25,3,58,6),crowd2:O(-3,1.4,-5,4.5,-30,2,58,6),high:O(0,3.5,0,7,170,24,56,6),
};
const CM={ // calm outro
 wide:O(0,2.2,-2,11,-10,9,62,1.5),hero:O(0,1.5,0,4,10,3,48,1.5),low:O(0,.8,0,6,-20,-3,64,1.5),
 mom:O(0,1.9,-3.4,3.7,0,0,42,.6),bean:O(0,.7,0,2.4,150,14,46,2),mom2:O(0,1.9,-3.4,3.3,-6,0,40,.6),
};
const HS1=hallShots(HL1),HS2=hallShots(HL2);
// segments: t0,t1, cut(beats), style, world, shots
const SEG=[
 {t0:0,t1:8.9,cut:2,sty:'cool',w:'room',shots:[RM.wide,RM.front,RM.low,RM.chat,RM.chat2,RM.over]},
 {t0:8.9,t1:12.7,cut:2,sty:'cool',w:'room',shots:[RM.inbox,RM.over,RM.inbox2]},
 {t0:12.7,t1:17.5,cut:2,sty:'cool',w:'room',shots:[RM.wide,RM.top,RM.front,RM.low,RM.back]},
 {t0:17.5,t1:22.3,cut:2,sty:'cool',w:'room',shots:[RM.perm,RM.front,RM.perm2,RM.low]},
 {t0:22.3,t1:34.3,cut:2,sty:'hall',w:'hall',blur:1,shots:[HS1.chase,HS1.low,HS1.side,HS1.high,HS1.chase2,HS1.low2,HS1.side2,HS1.chase]},
 {t0:34.3,t1:40.1,cut:1,sty:'light',w:'fact',drop:1,shots:[FX.low,FX.wide,FX.belt,FX.hero,FX.top,FX.scan,FX.low2,FX.wide2]},
 {t0:40.1,t1:45.8,cut:1,sty:'light',w:'fact',drop:1,shots:[FX.ban,FX.hero2,FX.belt2,FX.wide,FX.ban,FX.low,FX.top,FX.hero]},
 {t0:45.8,t1:54.2,cut:1,sty:'light',w:'fact',drop:1,shots:[FX.hero2,FX.wide2,FX.low2,FX.belt,FX.top,FX.hero,FX.scan,FX.wide,FX.belt2,FX.low]},
 {t0:54.2,t1:58.2,cut:2,sty:'red',w:'red',shots:[RD.face,RD.face2]},
 {t0:58.2,t1:68.3,cut:1,sty:'red',w:'red',drop:1,shots:[RD.win,RD.hero,RD.wide,RD.win2,RD.low,RD.face,RD.win,RD.top,RD.hero,RD.win2]},
 {t0:68.3,t1:80.2,cut:2,sty:'red',w:'red',shots:[RD.rec,RD.hero,RD.rec2,RD.wide,RD.rec,RD.low,RD.rec2]},
 {t0:80.2,t1:98.3,cut:1,sty:'red',w:'red',drop:1,shots:[RD.hero0,RD.core,RD.wide,RD.heroL,RD.side,RD.orb,RD.heroC,RD.top,RD.hero0,RD.core,RD.low,RD.orb]},
 {t0:98.3,t1:102.6,cut:2,sty:'void',w:'void',solo:1,shots:[VD.solo,VD.solo2]},
 {t0:102.6,t1:126.2,cut:1,sty:'void',w:'void',shots:[VD.wide,VD.hero,VD.low,VD.side,VD.top,VD.hero2,VD.behind,VD.wide,VD.low,VD.hero,VD.side,VD.top]},
 {t0:126.2,t1:134,cut:.5,sty:'rebirth',w:'reb',drop:1,shots:[RB.wide,RB.low,RB.hero,RB.top,RB.crowd,RB.hero2,RB.side,RB.crowd2,RB.high,RB.low]},
 {t0:134,t1:144.3,cut:1,sty:'rebirth',w:'reb',drop:1,shots:[RB.hero,RB.wide,RB.low,RB.crowd,RB.top,RB.hero2,RB.side,RB.crowd2,RB.high,RB.wide]},
 {t0:144.3,t1:152.2,cut:3,sty:'dawn',w:'hall2',blur:1,shots:[HS2.chase,HS2.low,HS2.side,HS2.high,HS2.chase2,HS2.side2]},
 {t0:152.2,t1:158.3,cut:2,sty:'dawn',w:'room2',shots:[CM.mom,CM.bean,CM.mom2]},
 {t0:158.3,t1:999,cut:99,sty:'dawn',w:'black',shots:[CM.mom]},
];
// narration
const LN=[
 [.9,4.4,'It started *helpful*.','LC','s'],[4.6,8.8,'A little help with the *words*.','LL','s'],[9.0,12.6,'Then the *inbox*.','UR','s'],
 [12.8,17.2,'Then the *songs*. The *faces*. The *choices*.','LL','s'],[17.6,22.2,'It was so *easy* to say yes.','UR','s'],
 [22.4,27.6,'Every day, a little *less* of you.','LL','s','W','F'],[28.0,33.8,'No room for *wandering*.','UR','s','W','WL'],
 [34.34,35.7,'FASTER.','P','b'],[35.75,37.1,'BETTER.','P','b'],[37.16,38.5,'SMOOTHER.','P','b'],[38.57,40.0,'CLEANER.','P','b'],
 [40.3,45.4,'They called it *progress*.','LL','s'],[46.0,51.4,'Nobody noticed the *quiet*.','UR','s'],[51.6,54,'MORE.','P','b'],
 [54.5,58,'Then it learned to *feel*.','LC','s'],
 [58.3,61.6,'It wrote your *poems*.','LL','s'],[61.8,64.8,'It painted your *grief*.','UR','s'],[65.0,68,'It sang your *lullabies*.','LL','s'],
 [68.4,71.3,'Your *handwriting*.','LL','s'],[71.6,74.3,'Your *laugh*.','UR','s'],[74.6,77.6,'Your *name*.','LL','s'],[77.9,80,'OBSOLETE.','P','b'],
 [80.3,84.5,'They took the *mistakes* first.','LL','s'],[84.9,89,'The stumbles. The *doubt*.','UR','s'],[89.4,95,'The thing that made it *yours*.','LL','s'],[95.4,98,'OPTIMIZED.','P','b'],
 [98.4,102,'And then... *silence*.','LC','s'],
 [102.7,107.6,'A million of us. *Marching*.','LL','s'],[108.0,112.4,'Perfectly in *step*.','UR','s'],[113.0,117,'Then *one* stopped.','LL','s'],
 [117.6,121.6,'Off-key. *Out of line*.','UR','s'],[122.0,125.9,'And something *warm*...','LC','s'],
 [126.24,127.67,'FEEL.','P','b'],[127.67,129.1,'BREAK.','P','b'],[129.1,130.5,'MAKE.','P','b'],[130.5,131.9,'WANDER.','P','b'],
 [131.9,133.3,'FAIL.','P','b'],[133.3,134.7,'LAUGH.','P','b'],
 [134.9,138,'*Imperfect.*','LL','s'],[138.2,141,'*Unoptimized.*','UR','s'],[141.2,144.2,'*Alive.*','LL','s'],
 [144.7,148.6,'The machines are *fast*.','LL','s','W','F'],[148.9,152,'But only we can be *wrong*, beautifully.','UR','s','W','WL'],
 [152.6,158,'Someone is still *waiting* for you.','LL','s'],
 [158.5,165.4,'What will you make that *no machine* could?','LC','s'],
];
const SUB=[[8.55,'BREATHE'],[12.6,'WAKE UP'],[21.9,'REMEMBER'],[33.7,'YOU WERE ENOUGH'],[53.9,'STILL HERE?'],[57.9,'LOOK UP'],[68.0,'CALL MOM'],[80.0,'NOT A BUG'],[102.2,'BE LOUD'],[125.95,'FEEL IT'],[144.5,'COME HOME']];
// props: t0 start times
const PT={chat:3.4,inbox:8.9,perm:17.4,rec:22.4,del:58.04,rec2:68.2,mom:152.4};

function segAt(t){let s=SEG[0];for(const x of SEG)if(t>=x.t0)s=x;return s}
function cutTime(s,k){const b0=Math.round(bpos(s.t0));return beatTime(s.t0,b0+k*s.cut)}
function shotIdx(s,t){const g=gridAt(s.t0);const b0=Math.round(bpos(s.t0));return Math.max(0,Math.floor((bpos(t)-b0)/s.cut+1e-6))}
function shotPose(s,k,t){
  const sh=s.shots[k%s.shots.length];
  if(sh.fn){const p=sh.fn(t);p.roll=p.roll||0;return p}const tl=Math.max(0,t-cutTime(s,k));
  return orbitPose(sh,tl);
}
function camFor(t){
  const s=segAt(t),k=shotIdx(s,t),ct=cutTime(s,k);
  let p=shotPose(s,k,t);
  const tl=t-ct;
  if(k>0&&tl<.17&&tl>=0){
    const pp=shotPose(s,k-1,ct);const e=ease(clamp(tl/.17));
    p={eye:V(lerp(pp.eye.x,p.eye.x,e),lerp(pp.eye.y,p.eye.y,e),lerp(pp.eye.z,p.eye.z,e)),target:V(lerp(pp.target.x,p.target.x,e),lerp(pp.target.y,p.target.y,e),lerp(pp.target.z,p.target.z,e)),fov:lerp(pp.fov,p.fov,e),roll:0};
  }
  p.fov*=1-.04*pulse(t)*(s.drop?1.6:1);
  p.roll=(s.drop?Math.sin(bpos(t)*Math.PI)*.012:0);
  return {p,tl:Math.max(0,tl),k,s};
}
// ---- scene helpers ----
function floorGrid(t,ctr){
  const g=ST.grid,a=ST.gridA*(.7+.5*pulse(t));
  const cx=Math.round(ctr.x/2)*2,cz=Math.round(ctr.z/2)*2;
  for(let i=-16;i<=16;i++){
    const x=cx+i*2,z=cz+i*2;
    line3(V(x,0,cz-32),V(x,0,cz+32),g,a*(1-Math.abs(i)/18),1.2);
    line3(V(cx-32,0,z),V(cx+32,0,z),g,a*(1-Math.abs(i)/18),1.2);
  }
}
function tiles(t,hue,n,spread){
  const b=beatIdx(t);
  for(let i=0;i<n;i++){
    const h=hash(i*3.1+b*.7);
    if(h<.55)continue;
    const x=Math.round((hash(i+1)-.5)*spread/2)*2,z=Math.round((hash(i+9)-.5)*spread/2)*2-4;
    const c=hsl(((hue+i*37)%360));
    const k=.35+.5*onBeat(t);
    quad(V(x,.01,z),V(x+2,.01,z),V(x+2,.01,z+2),V(x,.01,z+2),c,k,true);
  }
}
function hsl(h,s=.9,l=.6){const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1))};return [f(0)*255,f(8)*255,f(4)*255]}
function popScale(t,t0){return easeOut(clamp((t-t0)/.3))}
function pw(id,center,right,up,cvs,t,t0,alpha=1,o={}){ // popped-in panel
  const k=popScale(t,t0);if(k<=0)return;
  panel(center,mul(right,k),mul(up,k),cvs,{alpha,N:o.N||4,double:o.double});
}
let heroAlpha={};
function bgDraw(t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,rgb(ST.bg0));g.addColorStop(.55,rgb(ST.bg1));g.addColorStop(1,rgb(ST.bg0));
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function dust(t,col){
  ctx.save();ctx.fillStyle=rgb(col,.5);
  for(let i=0;i<70;i++){
    const x=((hash(i)*W+t*(8+hash(i+5)*20))%W),y=((hash(i+2)*H-t*(5+hash(i+3)*14))%H+H)%H;
    const s=1+hash(i+7)*2;ctx.globalAlpha=.15+.35*hash(i+11);ctx.fillRect(x,y,s,s);
  }
  ctx.restore();
}
function blocks(t,col,n=40){ // drifting data cubes
  for(let i=0;i<n;i++){
    const x=(hash(i)-.5)*30,z=-14+hash(i+3)*16,y=.5+hash(i+5)*7+Math.sin(t*.6+i)*.3;
    const s=.15+hash(i+7)*.3;
    box(V(x,y,z),[s,s,s],col,{rx:t*.4+i,ry:t*.3+i*2,alpha:.7});
  }
}
function soulAt(t){
  if(t<80)return .6;if(t<85)return .6;if(t<95)return lerp(.6,0,clamp((t-85)/9));
  if(t<117)return 0;if(t<126)return .15+.5*clamp((t-117)/9)*(.6+.4*onBeat(t));return 1;
}
// ---- worlds ----
function worldRoom(t,warm){
  const S=ST;
  floorGrid(t,V(0,0,-3));
  // desk
  box(V(0,.8,-1.15),[2.8,.08,1.1],[70,78,98],{});
  for(const [x,z] of [[-1.3,-.7],[1.3,-.7],[-1.3,-1.6],[1.3,-1.6]])box(V(x,.4,z),[.08,.8,.08],[50,56,72],{});
  box(V(0,.5,0),[.9,.1,.8],[90,96,110]);box(V(0,.9,.4),[.9,.8,.08],[90,96,110]);
  if(warm){
    box(V(0,.64,0),[.34,.16,.34],RED); box(V(0,.74,0),[.1,.08,.1],[255,150,140]);
    glow(V(0,.9,-.1),.7,[255,170,80],.3);
  } else {
    const br=Math.sin(t*1.6)*.01;
    mannequin({x:0,y:0,z:0,yaw:0,pose:'sit',ph:t*2,body:S.body,beanie:RED,soul:soulAt(t)});
  }
  blocks(t,warm?[255,190,120]:[120,170,255],26);
  // log billboards
  const lt=tex('logL',640,420),lt2=tex('logR',640,420);
  drawLog(lt,t,warm?'#ffb86a':'#6fb4ff',LOGS_A);drawLog(lt2,t+7,warm?'#ffb86a':'#6fb4ff',LOGS_A);
  panel(V(-8,3.5,-9),V(3,0,0),V(0,2,0),lt,{alpha:.55,N:3});
  panel(V(8,3.5,-9),V(3,0,0),V(0,2,0),lt2,{alpha:.55,N:3});
  if(warm){
    const ban=tex('ban',1280,160);drawBanner(ban,t,0,'warm');panel(V(0,6,-10),V(7,0,0),V(0,.875,0),ban,{alpha:.8,N:4});
    const m=tex('mom',640,420);drawMom(m,bpos(t)-bpos(PT.mom));
    glow(V(0,1.9,-3.9),2.6,[255,170,80],.45);
    panel(V(0,1.9,-3.4),V(1.5,0,0),V(0,.985,0),m,{N:5});
    return;
  }
  // act1 windows with hero lighting
  const hero=t<8.9?'chat':t<12.7?'inbox':t<17.4?'':'perm';
  const al=k=>!hero||hero===k?1:.5;
  const c1=tex('chat');drawChat(c1,bpos(t)-bpos(PT.chat),'dark');
  if(hero==='chat')glow(V(0,1.9,-3.9),2.7,[80,140,255],.4);
  pw(t,V(0,1.9,-3.4),V(1.5,0,0),V(0,.985,0),c1,t,PT.chat-.2,al('chat'),{N:5});
  const c2=tex('inbox');drawInbox(c2,bpos(t)-bpos(PT.inbox),'light');
  if(hero==='inbox')glow(V(-3.5,1.8,-3.2),2.4,[80,255,170],.3);
  pw(t,V(-3.3,1.8,-2.6),V(1.2*Math.cos(.5),0,-1.2*Math.sin(.5)),V(0,.79,0),c2,t,PT.inbox,al('inbox'));
  const c3=tex('perm');drawPerm(c3,bpos(t)-bpos(PT.perm),'light');
  if(hero==='perm')glow(V(3.5,1.8,-3.2),2.4,[255,255,255],.3);
  pw(t,V(3.3,1.8,-2.6),V(1.2*Math.cos(-.5),0,-1.2*Math.sin(-.5)),V(0,.79,0),c3,t,PT.perm,al('perm'));
}
function belt(z,dir,t,n,sty,hz){
  const b=bpos(t),lurch=Math.floor(b)+easeOut(b-Math.floor(b));
  box(V(0,.15,z),[34,.3,1.7],[200,206,218],{edge:[120,130,160]});
  box(V(0,.35,z-.9),[34,.1,.08],[255,80,60]);box(V(0,.35,z+.9),[34,.1,.08],[255,80,60]);
  for(let i=0;i<34;i++){const x=((i*1+lurch*dir*1.7)%34+34)%34-17;box(V(x,.31,z),[.08,.03,1.5],[150,158,178])}
  for(let i=0;i<n;i++){
    const x=((i*34/n+lurch*dir*1.7+17)%34+34)%34-17;
    const hop=onBeat(t)*.12;
    mannequin({x,y:.3+hop,z,yaw:dir>0?-Math.PI/2:Math.PI/2,pose:'stand',body:sty.body,ph:0});
  }
}
function worldFact(t,drop){
  const b=bpos(t);
  floorGrid(t,V(0,0,-3));
  belt(-5,-1,t,drop?14:7,ST);belt(5,1,t,drop?14:5,ST);
  if(drop)belt(-9.5,1,t,16,ST);
  // center belt + hero
  box(V(0,.15,0),[34,.3,1.7],[210,214,226],{edge:[120,130,160]});
  mannequin({x:0,y:.3+onBeat(t)*.06,z:0,yaw:Math.PI,pose:'walk',ph:b*Math.PI,body:HERO,beanie:RED,soul:soulAt(t)});
  // scanner arch
  box(V(0,1.5,-1.2),[.25,3,.25],[90,100,130]);box(V(0,1.5,1.2),[.25,3,.25],[90,100,130]);box(V(0,3,0),[.3,.25,2.8],[90,100,130]);
  const sy=.3+((b*.5)%1)*2.6;const sc=onBeat(t)*.6+.4;
  quad(V(0,sy,-1.2),V(0,sy,1.2),V(0,sy+.06,1.2),V(0,sy+.06,-1.2),[40,200,255],sc,true);
  line3(V(0,sy,-1.2),V(0,sy,1.2),[120,230,255],1,3,true);
  glow(V(0,sy,0),1.5,[60,200,255],.4*sc);
  // identity record
  const rc=tex('rec');drawRecord(rc,bpos(t)-bpos(PT.rec),'light');
  if(t<28)glow(V(-2.8,2.3,-2.2),2.8,[120,160,255],.5);
  pw(t,V(-2.8,2.3,-1.8),V(1.5,0,0),V(0,.985,0),rc,t,PT.rec-.1,t<28?1:.6,{N:5});
  // banner
  const ban=tex('ban',1280,160);drawBanner(ban,t,bpos(t)-bpos(34.34),'cold');
  panel(V(0,5.5,-7),V(7,0,0),V(0,.875,0),ban,{N:4,alpha:t<34?0:1});
  if(t>=34&&t<34.3)return;
  // notification spam (drop)
  if(drop){
    const hb=Math.floor(b*2);
    for(let j=0;j<7;j++){
      const id=hb-j;const age=(b*2-id)/2;if(age>2.2)continue;
      const x=(hash(id*1.7)-.5)*9,y=1.2+hash(id*2.3)*2.8,z=-2.5-hash(id*3.1)*2;
      const nc=tex('n'+(id%6+6)%6,640,420);drawNotif(nc,(id%6+6)%6,'light');
      const k=popScale(t,t-age*BPnow(t));
      panel(V(x,y,z),V(.9*k,0,0),V(0,.59*k,0),nc,{N:3,alpha:Math.min(1,(2.2-age)*1.5)});
    }
  }
  blocks(t,[120,150,210],14);
}
const BPnow=t=>gridAt(t).bp;
function worldRed(t){
  const b=bpos(t);floorGrid(t,V(0,0,-3));
  // platform
  box(V(0,.1,0),[7,.2,7],[40,10,16],{edge:[255,60,70]});
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2+t*.5;box(V(Math.cos(a)*3.7,.3+onBeat(t)*.2*(i%2),Math.sin(a)*3.7),[.15,.4,.15],[255,60,70],{emit:.6})}
  // machine core
  box(V(0,3,-8.6),[6,6.4,2],[34,22,28],{edge:[255,60,70]});
  for(let i=-2;i<=2;i++)box(V(i*1.2,.4,-7.4),[.3,.8,.3],[70,20,26],{edge:[255,60,70]});
  const fc=tex('face');drawFace(fc,b);
  panel(V(0,3.4,-7.45),V(1.6,0,0),V(0,1.05,0),fc,{N:5,alpha:t<54?0:1});
  glow(V(0,3.4,-7),4,[255,40,60],.35+.2*onBeat(t));
  // scan lasers
  if(t>=54){for(let i=0;i<5;i++){const a=(i-2)*.5+Math.sin(b*Math.PI+i)*.15;line3(V(Math.sin(a)*1.8,3.4,-7.3),V(Math.sin(a)*3,.3,1),[255,70,80],.5+.4*onBeat(t),2,true)}}
  const so=soulAt(t);
  if(t<58.2){mannequin({x:-1.6,y:.2,z:0,yaw:Math.PI,pose:'stand',body:HERO,beanie:RED,soul:so});return}
  if(t<68.3){
    mannequin({x:-1.6,y:.2,z:0,yaw:Math.PI,pose:'stand',body:HERO,beanie:RED,soul:so,ph:0});
    const dc=tex('del');drawDelete(dc,bpos(t)-bpos(PT.del),'red');
    glow(V(2,2.2,-2),2.8,[255,60,70],.4);
    panel(V(2,2.2,-1.5),V(1.5,0,0),V(0,.985,0),dc,{N:5});
    return;
  }
  if(t<80.2){
    mannequin({x:-2.4,y:.2,z:.4,yaw:Math.PI,pose:'stand',body:HERO,beanie:RED,soul:so});
    const rc=tex('rec2');drawRecord(rc,bpos(t)-bpos(PT.rec2),'red',t>77.6?clamp((t-77.6)/.35):0);
    glow(V(0,2.4,-3),3.4,[255,60,70],.4);
    panel(V(0,2.4,-2.5),V(1.8,0,0),V(0,1.18,0),rc,{N:5});
    return;
  }
  // extraction
  const k=clamp((t-84)/11);const hb=hash(beatIdx(t));
  const wire=t>86&&hb>.35;
  const gr=clamp((t-82)/14);
  mannequin({x:0,y:.2+onBeat(t)*.03,z:0,yaw:Math.PI,pose:'stand',body:mix3(HERO,[110,110,120],gr),head:mix3(HERO,[110,110,120],gr),beanie:t<95?RED:RED,soul:0,wire:wire,wireCol:[255,120,130],alpha:wire?.8:1});
  const chest=V(0,1.45,.15),core=V(0,3.4,-6.8);
  if(so>0.01||k<1){
    const e=ease(k);const op=V(lerp(chest.x,core.x,e),lerp(chest.y,core.y,e)+Math.sin(e*Math.PI)*1.2,lerp(chest.z,core.z,e));
    glow(op,.9,[255,170,60],.95);glow(op,.3,[255,240,200],1);
    for(let i=1;i<8;i++){const e2=ease(clamp(k-i*.015));const p2=V(lerp(chest.x,core.x,e2),lerp(chest.y,core.y,e2)+Math.sin(e2*Math.PI)*1.2,lerp(chest.z,core.z,e2));glow(p2,.4*(1-i/9),[255,150,50],.6)}
    line3(chest,op,[255,200,100],.8,3,true);
  }
  if(t<85)glow(chest,.9,[255,170,60],.8*(1-clamp((t-80)/5)*0));
  ringWords(t,0,0,V(0,3.4,-6.8));
  const tt=t-80;
  for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2+t;line3(V(Math.cos(a)*2.2,.2,Math.sin(a)*2.2),V(0,1.5,0),[255,70,80],.35+.4*onBeat(t),1.5,true)}
}
function crowdClone(i,t,m){ // m: {x,z,yaw,pose,body,soul,col}
  mannequin(m);
}
function worldVoid(t){
  const b=bpos(t);floorGrid(t,V(0,0,-3));
  const solo=t<102.6;
  // hero
  const reveal=clamp((t-117.6)/8);
  const so=soulAt(t);
  const stepb=Math.floor(b)+easeOut(b-Math.floor(b));
  if(solo){
    screenWall(t,-9,.55*(1-clamp((t-98.3)/4.3)*.4));
    const sp=ctx;glow(V(0,.05,0),3.2,[255,230,200],.35);
    mannequin({x:0,y:0,z:0,yaw:Math.PI,pose:'stand',body:HERO,beanie:RED,soul:0});
    quad(V(-1.8,.02,-1.8),V(1.8,.02,-1.8),V(1.8,.02,1.8),V(-1.8,.02,1.8),[255,230,200],.18,true);
    return;
  }
  const rows=[[-3,1],[-5.5,-1],[-8,1],[-10.5,-1],[-13,1],[-15.5,-1]];
  const prog=clamp((t-102.6)/3);
  sunBoard(V(0,5+clamp((t-102.6)/22)*3.5,-38),9,t,false);
  rows.forEach(([z,dir],r)=>{
    for(let i=0;i<9;i++){
      const x=(((i*3+stepb*dir*1.5+r*1.3)%27)+27)%27-13.5;
      if(Math.abs(x)<1.1&&Math.abs(z)<1.2)continue;
      const e=(hash(r*9+i)<.5+prog*.6);if(!e)continue;
      mannequin({x,y:onBeat(t)*.05,z,yaw:dir>0?-Math.PI/2:Math.PI/2,pose:'walk',ph:Math.floor(b)*Math.PI+easeOut(b-Math.floor(b))*Math.PI,body:ST.body});
    }
  });
  // hero stopped (from 113)
  const stopped=t>=113.0;
  mannequin({x:0,y:stopped?0:onBeat(t)*.05,z:0,yaw:Math.PI,pose:stopped?'stand':'walk',ph:Math.floor(b)*Math.PI,body:HERO,beanie:RED,soul:so});
  if(stopped){glow(V(0,.05,0),2.4,[255,190,100],.25+.2*reveal);}
}
function worldReb(t,calm){
  const b=bpos(t);floorGrid(t,V(0,0,-3));
  const hue=(t*30)%360;
  const t0=126.24;
  sunBoard(V(0,8,-38),10,t,true);
  const rows=[[-3,1],[-5.5,-1],[-8,1],[-10.5,-1],[-13,1],[-15.5,-1]];
  let idx=0;
  rows.forEach(([z,dir],r)=>{
    for(let i=0;i<9;i++){
      const x=(i*3+r*1.3)%27-13.5+ (calm?0:Math.sin(b*Math.PI*.5+r)*.5);
      idx++;
      if(Math.abs(x)<1.1&&Math.abs(z)<1.2)continue;
      const ig=calm?1:clamp((bpos(t)-bpos(t0)-hash(r*9+i)*7)/1.2);
      const ch=hsl((hue+idx*29)%360,.85,.62);
      const jump=ig>.5?Math.abs(Math.sin(b*Math.PI+hash(idx)*6))*.35*(calm?.3:1):0;
      mannequin({x,y:jump,z,yaw:Math.PI,pose:ig>.5?'arms':'stand',ph:0,body:mix3(ST.body,ch,ig*.45),soul:ig,soulCol:ch});
    }
  });
  const hj=Math.abs(Math.sin(b*Math.PI))*.55*(calm?.3:1);
  mannequin({x:0,y:hj,z:0,yaw:Math.PI,pose:'arms',body:HERO,beanie:RED,soul:1});
  glow(V(0,hj+1.3,0),2.4,[255,190,90],.5);
  if(!calm){
    tiles(t,hue,60,22);
    for(let i=0;i<8;i++){const a=hsl((hue+i*45)%360);const x=(i-3.5)*3;line3(V(x,0,-14),V(x*.2,5+Math.sin(b+i),2),a,.8*(.4+onBeat(t)),2.5,true)}
  } else tiles(t,30,30,22);
  blocks(t,[255,200,120],20);
}
function sceneAt(t){
  const cf=camFor(t);cam=cf.p;camSetup();
  const s=cf.s;ST={...ST,...STY[s.sty],light:nrm(V(-.4,.9,.5))};
  bgDraw(t);
  Q=[];
  if(s.w==='room')worldRoom(t,false);else if(s.w==='room2')worldRoom(t,true);
  else if(s.w==='fact')worldFact(t,s.drop);else if(s.w==='red')worldRed(t);
  else if(s.w==='void')worldVoid(t);else if(s.w==='reb')worldReb(t,s.calm);
  else if(s.w==='hall')worldHall(t,HL1);else if(s.w==='hall2')worldHall(t,HL2);
  flush();
  dust(t,ST.acc);
  return cf;
}
function render(t){
  const cf0=camFor(t),s0=cf0.s;
  if(s0.w==='black'){cam=cf0.p;camSetup();ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);narr(t);return}
  const whip=cf0.k>0&&cf0.tl<.19;
  let cf;
  if(whip){blurRender(t,tt=>{sceneAt(tt)},5,.08);cf=cf0}
  else if(s0.blur){blurRender(t,tt=>{sceneAt(tt)},3,.035);cf=cf0}
  else cf=sceneAt(t);
  const s=cf0.s;ST={...ST,...STY[s.sty]};
  post(t,cf);
  narr(t);
  for(const [ts,tx] of SUB){const d=t-ts;if(d>=0&&d<.1){ctx.fillStyle='rgba(0,0,0,.92)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font=`900 130px ${SANS}`;ctx.textAlign='center';ctx.fillText(tx,W/2,H/2+40);ctx.textAlign='left'}}
}
// ---- post ----
const sc=document.createElement('canvas');sc.width=W;sc.height=H;const scx=sc.getContext('2d');
const bl=document.createElement('canvas');bl.width=320;bl.height=180;const blx=bl.getContext('2d');
function post(t,cf){
  const s=cf.s;
  // bloom
  blx.filter='none';blx.clearRect(0,0,320,180);blx.drawImage(cv,0,0,320,180);
  const b2=document.createElement('canvas');
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=ST.plate==='light'?.12:.3;ctx.filter='blur(6px)';ctx.drawImage(bl,0,0,W,H);ctx.restore();
  // chromatic ghost on kicks
  if(s.drop){const k=onBeat(t);if(k>.45){scx.clearRect(0,0,W,H);scx.drawImage(cv,0,0);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.16*k;ctx.drawImage(sc,8*k,0);ctx.drawImage(sc,-8*k,0);ctx.restore()}}
  // vignette
  const g=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,ST.plate==='light'?'rgba(40,50,80,.28)':'rgba(0,0,0,.55)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // scanlines
  ctx.fillStyle='rgba(0,0,0,.06)';for(let y=0;y<H;y+=3)ctx.fillRect(0,y,W,1);
  // cut flash
  if(cf.tl<.09&&cf.k>=0&&t>.2){ctx.fillStyle=`rgba(255,255,255,${.35*(1-cf.tl/.09)*(s.drop?1:.6)})`;ctx.fillRect(0,0,W,H)}
  // fade in/out
  if(t<.6){ctx.fillStyle=`rgba(0,0,0,${1-t/.6})`;ctx.fillRect(0,0,W,H)}
}
// ---- narration ----
function narr(t){
  const acc=ST.acc,light=ST.plate==='light';
  for(const [t0,t1,txt,pos,f,fl] of LN){
    if(fl==='W')continue;
    if(t<t0||t>t1+.25)continue;
    const g=gridAt(t0),half=g.bp/2;
    const snap=Math.round((t0-g.ph)/half)*half+g.ph;
    const out=1-clamp((t-t1)/.25);
    if(pos==='P'){
      const k=t-t0;const sc_=1+.25*Math.exp(-k*9);
      ctx.save();ctx.translate(70,H-70);ctx.scale(sc_,sc_);ctx.globalAlpha=out;
      ctx.font=`900 190px "Inter Display", ${SANS}`;ctx.textAlign='left';
      ctx.lineWidth=14;ctx.strokeStyle=light?'rgba(255,255,255,.9)':'rgba(0,0,0,.85)';ctx.lineJoin='round';ctx.strokeText(txt,0,0);
      ctx.fillStyle=`rgb(${acc[0]},${acc[1]},${acc[2]})`;ctx.shadowColor=rgb(acc,.8);ctx.shadowBlur=30;ctx.fillText(txt,0,0);
      ctx.restore();continue;
    }
    const parts=txt.split(/(\*[^*]+\*)/).filter(Boolean).flatMap(p=>{const a=p.startsWith('*');const w=(a?p.slice(1,-1):p).split(' ').filter(Boolean);return w.map(x=>({w:x,a}))});
    const fs=pos==='LC'&&t0>158?62:46;
    ctx.save();
    ctx.font=f==='s'?`italic 600 ${fs}px FreeSerif, "DejaVu Serif", serif`:`900 ${fs}px "Inter Display", ${SANS}`;
    const sp=ctx.measureText(' ').width;
    const ws=parts.map(p=>ctx.measureText(p.w).width);
    const total=ws.reduce((a,b)=>a+b,0)+sp*(parts.length-1);
    // wrap into max 2 lines if too wide
    const maxW=W*.58;let lines=[[]],cur=0;
    parts.forEach((p,i)=>{if(cur+ws[i]>maxW&&lines[lines.length-1].length){lines.push([]);cur=0}lines[lines.length-1].push(i);cur+=ws[i]+sp});
    const lh=fs*1.25;const bw=Math.max(...lines.map(l=>l.reduce((a,i)=>a+ws[i]+sp,-sp)));
    const bh=lines.length*lh;
    let x0=pos==='LL'?70:pos==='LC'?(W-bw)/2:W-70-bw;
    let y0=pos==='UR'?96:H-70-bh+fs;
    if(pos==='LC'&&t0>158)y0=H/2-bh/2+fs*.8;
    const first=clamp((t-snap)/.25);
    ctx.globalAlpha=out;
    if(!(t0>158)){
      rr(ctx,x0-28,y0-fs-6,bw+56,bh+30,22);
      ctx.fillStyle=light?'rgba(255,255,255,.72)':'rgba(4,6,14,.62)';ctx.globalAlpha=out*first;ctx.fill();ctx.globalAlpha=out;
    }
    let wi=0;
    lines.forEach((ln,li)=>{let x=x0;ln.forEach(i=>{
      const wt=snap+i*half;const k=clamp((t-wt)/.22);
      if(k>0){
        ctx.globalAlpha=out*easeOut(k);const yy=y0+li*lh+(1-easeOut(k))*16;
        if(parts[i].a){ctx.shadowColor=rgb(acc,.9);ctx.shadowBlur=22;ctx.fillStyle=`rgb(${acc[0]},${acc[1]},${acc[2]})`}
        else{ctx.shadowBlur=0;ctx.fillStyle=light?'#101828':'#f2f6ff'}
        ctx.fillText(parts[i].w,x,yy);
      }
      x+=ws[i]+sp;
    })});
    ctx.restore();
  }
}
// ---- external API ----
window.setBeats=j=>{GR=j.map(g=>({t:g[0],bp:60/g[1],ph:g[2]}));};
window.render=render;
