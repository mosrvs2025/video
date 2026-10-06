// ---- faceless mannequin. local forward = -z. ----
// o: {x,y,z,yaw,pose:'stand'|'walk'|'sit'|'run'|'arms', ph, body, head, beanie(null|col), soul(0..1), wire, alpha, scale}
function mannequin(o){
  const s=o.scale||1, body=o.body||[190,196,210], head=o.head||body;
  const yaw=o.yaw||0, ph=o.ph||0, pose=o.pose||'stand';
  const base=V(o.x||0,o.y||0,o.z||0);
  const P=(lx,ly,lz)=>add(base,mul(rotv(V(lx,ly,lz),0,yaw),s));
  const bo={ry:yaw,wire:o.wire,alpha:o.alpha,wireCol:o.wireCol,edge:o.edge};
  const sz=a=>a.map(v=>v*s);
  const sw=Math.sin(ph)*0.6, bob=pose==='walk'||pose==='run'?Math.abs(Math.cos(ph))*.05:0;
  // limbs: joint, length, size, swing angle about x
  const limb=(jx,jy,jz,L,th,ang,col)=>{
    const dir=rotv(V(0,-L/2,0),ang,0); // swing in sagittal plane
    const c=P(jx+dir.x,jy+dir.y+bob,jz+dir.z);
    box(c,sz([th,L,th]),col,{...bo,rx:ang});
  };
  const legCol=mix3(body,[0,0,0],.25);
  let lh=0.9;
  if(pose==='sit'){
    box(P(0,0.5,0.0),sz([.9,.1,.8]),[90,96,110],bo);          // seat
    box(P(0,.9,.4),sz([.9,.8,.08]),[90,96,110],bo);             // chair back
    box(P(0,1.15+Math.sin(ph)*.01,0),sz([.55,.75,.3]),body,bo);   // torso
    box(P(0,1.7,-.02),sz([.3,.3,.3]),head,bo);
    // thighs forward, shins down
    for(const sx of[-.14,.14]){
      box(P(sx,.62,-.3),sz([.18,.16,.6]),legCol,bo);
      box(P(sx,.28,-.58),sz([.16,.6,.16]),legCol,bo);
    }
    // arms reaching forward
    const t=o.type||0;
    for(const sx of[-.34,.34]){
      box(P(sx,1.2,-.25),sz([.12,.12,.5]),body,bo);
    }
    if(o.beanie)beanie(P,sz,o.beanie,bo,1.9,s);
    soulOrb(o,P(0,1.2,-.17),s);
    return;
  }
  const armSw=pose==='arms'?-2.6:sw;
  const lsw=pose==='walk'?sw:pose==='run'?Math.sin(ph)*1.0:0;
  limb(-.12,.9,0,.9,.17,lsw,legCol);limb(.12,.9,0,.9,.17,-lsw,legCol);
  box(P(0,1.2+bob,0),sz([.5,.7,.28]),body,bo);   // torso
  box(P(0,.95+bob,0),sz([.42,.2,.26]),legCol,bo);  // hips
  const as=pose==='arms'?-2.7:-lsw*.8;
  limb(-.31,1.5,0,.7,.13,pose==='arms'?-2.6:as,body);limb(.31,1.5,0,.7,.13,pose==='arms'?-2.9:-as,body);
  box(P(0,1.72+bob,0),sz([.27,.3,.27]),head,bo);
  if(o.beanie)beanie(P,sz,o.beanie,bo,1.88+bob,s);
  soulOrb(o,P(0,1.25+bob,-.15),s);
}
function beanie(P,sz,col,bo,y,s){
  box(P(0,y,0),sz([.31,.16,.31]),col,bo);
  box(P(0,y+.1,0),sz([.1,.08,.1]),mix3(col,[255,255,255],.35),bo);
}
function soulOrb(o,p,s){
  const k=o.soul==null?0:o.soul;if(k<=.02)return;
  const col=o.soulCol||[255,170,60];
  glow(p,.55*s*(.6+k),col,.85*k);
  glow(p,.18*s,[255,240,200],k);
}
