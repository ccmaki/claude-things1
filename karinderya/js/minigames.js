'use strict';
/* Cooking mini-games: chop, flip, pour, stir, mash. */
/* ---------- mini-games ---------- */
function tickFlash(m,dt){if(m.flash){m.flash.t+=dt;if(m.flash.t>.9)m.flash=null;}}
function tickEnd(m,dt){if(m.endT!=null){m.endT-=dt;if(m.endT<=0)m.done=true;}}
function setFlash(m,s,t){m.flash={txt:t||(s>=1?'Ayos!':s>.5?'Pwede na':'Sablay!'),s,t:0};}
function drawFlash(c,m,y=220){const f=m.flash;if(!f)return;c.globalAlpha=Math.max(0,1-f.t/.9);txtS(c,f.txt,180,y-f.t*30,28,'d',f.s>=1?PAL.green:f.s>.5?PAL.yellow:PAL.red);c.globalAlpha=1;}

function mgChop(st){const item=st.item||'garlic';
  const m={t:0,i:0,n:6,marks:[],cuts:[],scores:[],kx:180,dip:0,flash:null,endT:null,done:false};
  for(let i=0;i<6;i++)m.marks.push(112+i*27);
  m.update=dt=>{m.t+=dt;m.kx=180+118*Math.sin(m.t*(1.9+m.i*.22));m.dip=Math.max(0,m.dip-dt*6);tickFlash(m,dt);tickEnd(m,dt);};
  m.down=()=>{if(m.i>=m.n)return;const d=Math.abs(m.kx-m.marks[m.i]);const s=d<8?1:d<18?.65:.25;m.scores.push(s);m.cuts.push(m.kx);m.dip=1;setFlash(m,s);s>.5?SFX.chop():SFX.bad();m.i++;if(m.i>=m.n)m.endT=.8;};
  m.score=()=>avg(m.scores);
  m.draw=c=>{
    shadow(c,180,425,140,10);
    sh(c,PAL.board,()=>rr(c,40,250,280,170,18));
    c.strokeStyle=PAL.boardDark;c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(60,272+i*30);c.lineTo(300,276+i*30);c.stroke();}
    for(let j=0;j<5;j++){const x=105+j*38;
      if(item==='tomato'){sh(c,'#d94a3a',()=>c.arc(x,336,22,0,TAU));sh(c,PAL.kangkong,()=>c.arc(x,320,4,0,TAU),2);}
      else if(item==='potato'){sh(c,j%2?'#e8792e':'#e3c27a',()=>rr(c,x-20,318,40,36,12));}
      else sh(c,PAL.garlic,()=>c.ellipse(x,336,24,19,(j%2?.2:-.15),0,TAU));}
    c.strokeStyle=INK;c.lineWidth=3;for(const x of m.cuts){c.beginPath();c.moveTo(x,314);c.lineTo(x,358);c.stroke();}
    if(m.i<m.n){const x=m.marks[m.i];c.setLineDash([7,6]);c.strokeStyle=PAL.yellow;c.lineWidth=5;c.beginPath();c.moveTo(x,292);c.lineTo(x,382);c.stroke();c.setLineDash([]);
      sh(c,PAL.yellow,()=>{c.moveTo(x-8,282);c.lineTo(x+8,282);c.lineTo(x,294);c.closePath();},2);}
    const dy=m.dip*16,kx=m.kx;
    sh(c,PAL.knife,()=>{c.moveTo(kx-9,256+dy);c.lineTo(kx+9,256+dy);c.lineTo(kx+9,362+dy);c.lineTo(kx-9,378+dy);c.closePath();});
    sh(c,PAL.woodDark,()=>rr(c,kx-10,196+dy,20,62,7));
    c.fillStyle=PAL.silver;c.beginPath();c.arc(kx,214+dy,2.5,0,TAU);c.arc(kx,238+dy,2.5,0,TAU);c.fill();
    txt(c,`Hiwa ${Math.min(m.i+1,m.n)}/${m.n}`,180,460,14,'b',PAL.white,'center','800');
    drawFlash(c,m,230);
  };
  return m;
}
const HEAT={fish:['#aab7c2','#c98a4b','#3e2415'],chicken:['#efc3a8','#c27a3e','#3e2415'],eggplant:['#6a2f80','#2e2320','#9a9894'],torta:['#f6e08a','#e0a03a','#4a3018']};
function heatCol(cols,v){return v<.8?mix(cols[0],cols[1],v/.8):mix(cols[1],cols[2],(v-.8)/.5);}
function mgFlip(st){
  const m={i:0,n:st.n,c:0,scores:[],flipT:0,flash:null,endT:null,done:false,t:0,bub:[]};
  const F=.42;
  function next(){m.flipT=F;m.i++;m.c=0;if(m.i>=m.n)m.endT=.8;}
  m.update=dt=>{m.t+=dt;tickFlash(m,dt);tickEnd(m,dt);
    for(const b of m.bub)b.t+=dt;m.bub=m.bub.filter(b=>b.t<.45);
    if(m.endT!=null)return;if(m.flipT>0){m.flipT-=dt;return;}
    m.c+=dt*st.rate*(1+m.i*.12);
    if(Math.random()<dt*(3+m.c*14))m.bub.push({a:Math.random()*TAU,r:rand(30,80),t:0});
    if(m.c>=1.35){m.scores.push(.1);setFlash(m,.1,st.item==='eggplant'?'Abo na!':'Sunog!');SFX.bad();next();}};
  m.down=()=>{if(m.endT!=null||m.flipT>0)return;const d=Math.abs(m.c-.8);const s=d<.1?1:d<.2?.6:.25;m.scores.push(s);setFlash(m,s);s>.5?SFX.good():SFX.bad();next();};
  m.score=()=>avg(m.scores);
  m.draw=c=>{const cx=165,cy=335;
    if(st.pan==='grill'){
      for(let i=0;i<9;i++){const fx=70+i*24,fl=.8+.3*Math.sin(m.t*13+i*1.9);sh(c,PAL.flame,()=>{c.moveTo(fx-10,440);c.quadraticCurveTo(fx,440-60*fl,fx+10,440);c.closePath();},2);
        c.fillStyle=PAL.flameLt;c.beginPath();c.ellipse(fx,432,4,10*fl,0,0,TAU);c.fill();}
      sh(c,PAL.dark,()=>rr(c,40,250,250,180,14));
      c.strokeStyle=PAL.silver;c.lineWidth=4;for(let y=268;y<420;y+=20){c.beginPath();c.moveTo(52,y);c.lineTo(278,y);c.stroke();}
    }else{
      sh(c,PAL.woodDark,()=>rr(c,cx-200,cy-12,82,24,10));
      sh(c,PAL.dark,()=>c.arc(cx,cy,128,0,TAU));sh(c,'#3a4350',()=>c.arc(cx,cy,110,0,TAU),2);
    }
    c.fillStyle='rgba(255,255,255,.75)';for(const b of m.bub){c.globalAlpha=1-b.t/.45;c.beginPath();c.arc(cx+Math.cos(b.a)*b.r,cy+Math.sin(b.a)*b.r*.7,2+b.t*8,0,TAU);c.fill();}c.globalAlpha=1;
    const fp=m.flipT>0?1-m.flipT/F:0;const k=m.flipT>0?Math.max(.08,Math.abs(Math.cos(fp*Math.PI))):1;
    const col=heatCol(HEAT[st.item],m.c);
    c.save();c.translate(cx,cy-(m.flipT>0?Math.sin(fp*Math.PI)*50:0));c.scale(1,k);
    if(st.item==='chicken'){sh(c,PAL.garlic,()=>c.ellipse(62,-22,15,10,.4,0,TAU));sh(c,col,()=>c.ellipse(0,0,64,46,-.15,0,TAU));c.globalAlpha=.35;c.fillStyle='#fff';c.beginPath();c.ellipse(-18,-16,24,9,-.3,0,TAU);c.fill();c.globalAlpha=1;}
    else if(st.item==='fish'){sh(c,col,()=>{c.moveTo(80,0);c.lineTo(118,-30);c.lineTo(112,0);c.lineTo(118,30);c.closePath();});sh(c,col,()=>c.ellipse(0,0,92,38,0,0,TAU));
      c.fillStyle=INK;c.beginPath();c.arc(-62,-8,5,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.arc(-40,0,24,-1,1);c.stroke();for(let i=0;i<4;i++){c.beginPath();c.moveTo(-10+i*20,-20);c.lineTo(0+i*20,-8);c.stroke();}}
    else if(st.item==='eggplant'){c.rotate(-.2);sh(c,col,()=>c.ellipse(8,0,98,34,0,0,TAU));sh(c,PAL.bay,()=>{c.moveTo(-92,-22);c.lineTo(-74,0);c.lineTo(-92,22);c.lineTo(-108,0);c.closePath();});sh(c,PAL.bay,()=>rr(c,-130,-5,26,10,4),2);
      if(m.c>.5){c.globalAlpha=clamp((m.c-.5)*1.5,0,.8);c.fillStyle='#111';for(let i=0;i<6;i++){c.beginPath();c.arc(-40+i*22,(i%2?-10:8),7,0,TAU);c.fill();}c.globalAlpha=1;}}
    else{sh(c,col,()=>c.ellipse(0,0,82,68,0,0,TAU));c.fillStyle=mix(HEAT.torta[1],HEAT.torta[2],clamp(m.c-.3,0,1)*.6);for(let i=0;i<7;i++){c.beginPath();c.arc(Math.cos(i*1.7)*40,Math.sin(i*2.3)*32,8,0,TAU);c.fill();}
      sh(c,null,()=>c.ellipse(0,0,82,68,0,0,TAU));}
    c.restore();
    // meter
    const mx=316,my=230,mh=220,yOf=v=>my+mh-(v/1.35)*mh;
    sh(c,PAL.riceShade,()=>rr(c,mx,my,24,mh,8));
    sh(c,PAL.green,()=>c.rect(mx,yOf(.9),24,yOf(.7)-yOf(.9)),2);
    sh(c,PAL.red,()=>rr(c,mx,my,24,yOf(1.05)-my,8),2);
    const iy=yOf(Math.min(m.c,1.35));sh(c,PAL.yellow,()=>{c.moveTo(mx-4,iy);c.lineTo(mx-16,iy-8);c.lineTo(mx-16,iy+8);c.closePath();},2);
    txt(c,st.item==='eggplant'?'ABO':'SUNOG',mx+12,my-8,10,'b',PAL.white,'center','800');
    txt(c,'HILAW',mx+12,my+mh+16,10,'b',PAL.white,'center','800');
    txt(c,`${st.item==='eggplant'?'Ikot':'Piraso'} ${Math.min(m.i+1,m.n)}/${m.n}`,165,505,14,'b',PAL.white,'center','800');
    drawFlash(c,m,215);
  };
  return m;
}
function mgPour(st){
  const L=st.liquids,N=L.length,PCOL=st.contents==='pork'?'#c98e72':PAL.chicken;
  const m={i:0,level:0,base:0,pouring:false,layers:[],scores:[],flash:null,endT:null,done:false,t:0};
  m.update=dt=>{m.t+=dt;tickFlash(m,dt);tickEnd(m,dt);if(m.pouring){m.level+=dt*.26;if(m.level>=1){m.level=1;m.up();}}};
  m.down=()=>{if(m.i>=N||m.endT!=null)return;m.pouring=true;SFX.tap();};
  m.up=()=>{if(!m.pouring)return;m.pouring=false;const b=L[m.i].band,lv=m.level;const s=lv>=b[0]&&lv<=b[1]?1:(lv>=b[0]-.06&&lv<=b[1]+.06)?.6:.25;
    m.scores.push(s);setFlash(m,s,s===1?'Sakto!':undefined);s>.5?SFX.good():SFX.bad();m.layers.push({a:m.base,b:lv,col:L[m.i].col});m.base=lv;m.i++;if(m.i>=N)m.endT=.9;};
  m.score=()=>avg(m.scores);
  m.draw=c=>{const x0=92,x1=268,yb=496,ih=190;
    shadow(c,180,512,120,10);
    sh(c,PAL.potDark,()=>rr(c,52,322,40,18,8));sh(c,PAL.potDark,()=>rr(c,268,322,40,18,8));
    sh(c,PAL.potRim,()=>rr(c,80,292,200,216,22));
    sh(c,PAL.pot,()=>rr(c,x0,300,x1-x0,yb-300+2,14),2);
    for(let i=0;i<5;i++)sh(c,PCOL,()=>st.contents==='pork'?rr(c,102+i*31,470-(i%2)*10,26,22,6):c.ellipse(118+i*31,482-(i%2)*10,20,13,i*.5,0,TAU),2);
    c.save();c.beginPath();rr(c,x0,300,x1-x0,yb-300+2,14);c.clip();
    c.globalAlpha=.88;for(const l of m.layers){c.fillStyle=l.col;c.fillRect(x0,yb-l.b*ih,x1-x0,(l.b-l.a)*ih);}
    if(m.i<N&&m.level>m.base){c.fillStyle=L[m.i].col;c.fillRect(x0,yb-m.level*ih,x1-x0,(m.level-m.base)*ih);}
    c.globalAlpha=1;c.restore();
    L.forEach((l,j)=>{const ya=yb-l.band[1]*ih,yb2=yb-l.band[0]*ih;const cur=j===m.i;
      c.globalAlpha=cur?1:.45;sh(c,cur?PAL.green:PAL.riceShade,()=>rr(c,288,ya,14,yb2-ya,4),2);
      txt(c,l.name,306,(ya+yb2)/2+4,11,'b',PAL.white,'left','800');c.globalAlpha=1;
      c.setLineDash([5,5]);c.strokeStyle=cur?PAL.green:'rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();c.moveTo(x0,ya);c.lineTo(x1,ya);c.moveTo(x0,yb2);c.lineTo(x1,yb2);c.stroke();c.setLineDash([]);});
    if(m.i<N){const l=L[m.i],r=m.pouring?2.1:.25,px=170,py=200;
      if(m.pouring){const mx=px+62*Math.sin(r),my=py-62*Math.cos(r);c.strokeStyle=l.col;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(mx,my);c.lineTo(mx+4,yb-m.level*ih);c.stroke();}
      c.save();c.translate(px,py);c.rotate(r);
      sh(c,l.bottle,()=>rr(c,-18,-40,36,80,10));sh(c,PAL.red,()=>rr(c,-7,-64,14,26,4));
      sh(c,PAL.white,()=>rr(c,-16,-10,32,22,3),2);c.fillStyle=INK;c.font=`800 9px ${FONT.b}`;c.textAlign='center';c.fillText(l.name,0,5);
      c.restore();}
    txt(c,m.i<N?`Ibuhos: ${L[m.i].name}`:'Tapos!',180,548-14,15,'b',PAL.white,'center','800');
    drawFlash(c,m,250);
  };
  return m;
}
const POTS={adobo:{broth:'#6b3a1e',hi:'#8a5230',mix:[['chicken',8],['garlic',7],['bay',3],['pepper',10]]},
  sinigang:{broth:'#d8c77a',hi:'#e9dc9e',mix:[['pork',7],['kangkong',9],['tomato',4],['radish',4]]},
  menudo:{broth:'#b8321e',hi:'#d0583a',mix:[['pork',7],['potato',6],['carrot',6]]}};
function mgStir(st){const POT=POTS[st.pot||'adobo'];
  const m={cx:180,cy:335,R:106,stir:0,vel:0,prog:0,spill:0,started:false,ptr:{x:0,y:0,down:false},last:null,parts:[],steam:[],t:0,flash:null,endT:null,done:false,pieces:[]};
  for(const [k,n] of POT.mix)for(let i=0;i<n;i++)m.pieces.push({k,a:i/n*TAU+rand(-.3,.3),r:rand(.15,.8),rot:rand(0,TAU),s:rand(.9,1.15)});
  m.pieces.sort((a,b)=>(a.k==='pepper')-(b.k==='pepper'));
  m.zone=()=>m.vel<2.4?'slow':m.vel>8?'fast':'good';
  m.score=()=>clamp(1-m.spill*.3,.2,1);
  m.update=dt=>{m.t+=dt;tickFlash(m,dt);tickEnd(m,dt);const P=m.ptr;
    if(P.down&&m.endT==null){const dx=P.x-m.cx,dy=P.y-m.cy,dist=Math.hypot(dx,dy);
      if(dist<m.R*1.5&&dist>12){const a=Math.atan2(dy,dx);if(m.last!==null){let d=a-m.last;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;m.stir+=d;m.vel=m.vel*.85+Math.abs(d)/dt*.15;m.started=true;}m.last=a;}
      else{m.last=null;m.vel*=.9;}
      const z=m.zone();
      if(m.started){if(z==='good')m.prog+=dt/(st.quick?3:5);else if(z==='fast'){m.prog+=dt/(st.quick?6:10);m.spill+=dt;
        if(Math.random()<.5){const a=Math.random()*TAU;m.parts.push({x:m.cx+Math.cos(a)*m.R*.85,y:m.cy+Math.sin(a)*m.R*.85,vx:Math.cos(a)*rand(60,140),vy:Math.sin(a)*rand(60,140)-40,life:.7});}}}
      if(m.prog>=1){m.prog=1;m.endT=.9;const s=m.score();setFlash(m,s>=.85?1:s,s>=.85?'Perpekto!':undefined);s>.5?SFX.good():SFX.bad();}
    }else{m.vel*=Math.pow(.05,dt);m.last=null;}
    if(Math.random()<dt*9){const a=Math.random()*TAU,r=Math.random()*m.R*.6;m.steam.push({x:m.cx+Math.cos(a)*r,y:m.cy+Math.sin(a)*r,r:rand(8,16),life:1.6,max:1.6});}
    for(const s of m.steam){s.life-=dt;s.y-=26*dt;s.r+=6*dt;}m.steam=m.steam.filter(s=>s.life>0);
    for(const p of m.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;}m.parts=m.parts.filter(p=>p.life>0);};
  m.down=p=>{m.ptr={x:p.x,y:p.y,down:true};m.last=null;};
  m.move=p=>{m.ptr.x=p.x;m.ptr.y=p.y;};
  m.up=()=>{m.ptr.down=false;};
  m.draw=c=>{const {cx,cy,R}=m;
    sh(c,PAL.dark,()=>c.arc(cx,cy,R+16,0,TAU));
    for(let i=0;i<14;i++){const a=i/14*TAU+.1,fl=.75+.35*Math.sin(m.t*14+i*1.7);const x1=cx+Math.cos(a)*(R+4),y1=cy+Math.sin(a)*(R+4),x2=cx+Math.cos(a)*(R+4+11*fl),y2=cy+Math.sin(a)*(R+4+11*fl);
      c.fillStyle=PAL.flame;c.beginPath();c.moveTo(x1+Math.cos(a+1.57)*5,y1+Math.sin(a+1.57)*5);c.lineTo(x2,y2);c.lineTo(x1-Math.cos(a+1.57)*5,y1-Math.sin(a+1.57)*5);c.closePath();c.fill();}
    sh(c,PAL.potDark,()=>rr(c,cx-R-30,cy-9,30,18,7));sh(c,PAL.potDark,()=>rr(c,cx+R,cy-9,30,18,7));
    sh(c,PAL.potRim,()=>c.arc(cx,cy,R,0,TAU));sh(c,PAL.pot,()=>c.arc(cx,cy,R-9,0,TAU),2);sh(c,POT.broth,()=>c.arc(cx,cy,R-15,0,TAU),0);
    c.fillStyle=POT.hi;c.beginPath();c.ellipse(cx-R*.28,cy-R*.32,R*.3,R*.12,-.5,0,TAU);c.fill();
    const sw=m.stir*.6+Math.sin(m.t*.8)*.05;
    if(m.vel>1){c.strokeStyle=POT.hi;c.lineWidth=4;c.beginPath();c.arc(cx,cy,R*.45,sw,sw+1.8);c.stroke();c.beginPath();c.arc(cx,cy,R*.72,sw+3,sw+4.4);c.stroke();}
    for(const q of m.pieces){const a=q.a+sw*(1.15-q.r*.4),r=q.r*(R-26),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      c.save();c.translate(x,y);c.rotate(q.rot+sw);
      if(q.k==='chicken'){sh(c,PAL.chicken,()=>c.ellipse(0,0,16*q.s,11*q.s,0,0,TAU));c.fillStyle=PAL.chickenHi;c.beginPath();c.ellipse(-4,-4,6,3,-.3,0,TAU);c.fill();}
      else if(q.k==='garlic')sh(c,PAL.garlic,()=>c.ellipse(0,0,5,3.5,0,0,TAU),2);
      else if(q.k==='bay')sh(c,PAL.bay,()=>c.ellipse(0,0,11,4.5,0,0,TAU),2);
      else if(q.k==='pork')sh(c,'#c98e72',()=>rr(c,-10*q.s,-7*q.s,20*q.s,14*q.s,4),2);
      else if(q.k==='kangkong')sh(c,PAL.kangkong,()=>c.ellipse(0,0,13,5,0,0,TAU),2);
      else if(q.k==='tomato')sh(c,'#d94a3a',()=>c.arc(0,0,6,0,TAU),2);
      else if(q.k==='radish')sh(c,PAL.white,()=>c.arc(0,0,6,0,TAU),2);
      else if(q.k==='potato')sh(c,'#e3c27a',()=>rr(c,-6,-6,12,12,3),2);
      else if(q.k==='carrot')sh(c,'#e8792e',()=>rr(c,-5,-5,10,10,3),2);
      else{c.fillStyle=PAL.pepper;c.beginPath();c.arc(0,0,2,0,TAU);c.fill();}
      c.restore();}
    for(const s of m.steam){c.globalAlpha=Math.max(0,s.life/s.max)*.35;c.fillStyle='#fff';c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.fill();}c.globalAlpha=1;
    for(const q of m.parts)sh(c,POT.broth,()=>c.arc(q.x,q.y,4,0,TAU),2);
    const P=m.ptr;let lx,ly;if(P.down&&m.endT==null){lx=P.x;ly=P.y;}else{lx=cx+R*.42;ly=cy-R*.18;}
    c.save();c.translate(lx,ly);c.rotate(Math.atan2(ly-cy,lx-cx)*.25-.9);sh(c,PAL.woodLight,()=>rr(c,6,-5,110,10,5));sh(c,PAL.woodLight,()=>c.ellipse(0,0,15,11,0,0,TAU));c.restore();
    // progress ring
    c.lineCap='round';c.lineWidth=10;c.strokeStyle=INK;c.beginPath();c.arc(cx,cy,R+28,0,TAU);c.stroke();
    c.lineWidth=5;c.strokeStyle='#4a3a30';c.beginPath();c.arc(cx,cy,R+28,0,TAU);c.stroke();
    if(m.prog>0){c.strokeStyle=PAL.yellow;c.beginPath();c.arc(cx,cy,R+28,-Math.PI/2,-Math.PI/2+TAU*m.prog);c.stroke();}
    if(!m.started){const a0=m.t*2.2;c.setLineDash([6,8]);c.lineWidth=4;c.strokeStyle=PAL.white;c.beginPath();c.arc(cx,cy,R*.55,a0,a0+4.2);c.stroke();c.setLineDash([]);
      const ax=cx+Math.cos(a0+4.2)*R*.55,ay=cy+Math.sin(a0+4.2)*R*.55,ta=a0+4.2+Math.PI/2;
      sh(c,PAL.white,()=>{c.moveTo(ax+Math.cos(ta)*10,ay+Math.sin(ta)*10);c.lineTo(ax+Math.cos(ta+2.4)*9,ay+Math.sin(ta+2.4)*9);c.lineTo(ax+Math.cos(ta-2.4)*9,ay+Math.sin(ta-2.4)*9);c.closePath();},2);}
    // speed gauge
    const gx=20,gy=134,bx=gx+48,bw=272;
    txt(c,'BILIS',gx,gy+12,11,'b',PAL.white,'left','800');
    sh(c,PAL.riceShade,()=>rr(c,bx,gy,bw*.28,14,7),2);sh(c,PAL.green,()=>c.rect(bx+bw*.28,gy,bw*.44,14),2);sh(c,PAL.red,()=>rr(c,bx+bw*.72,gy,bw*.28,14,7),2);
    const nx=bx+bw*Math.min(1,m.vel/11.5);sh(c,PAL.yellow,()=>{c.moveTo(nx,gy+12);c.lineTo(nx-7,gy+24);c.lineTo(nx+7,gy+24);c.closePath();},2);
    drawFlash(c,m,180);
  };
  m.tip=()=>{if(!m.started)return null;const z=m.zone();if(!m.ptr.down)return 'Huwag tigilan, baka dumikit sa kaldero.';return z==='fast'?'Dahan-dahan! Tumatapon ang sarsa.':z==='slow'?'Bilisan nang kaunti, apo.':'Ayan, ganyan nga.';};
  return m;
}
function mgMash(st){const fish=st.item==='fish';
  const m={taps:0,need:fish?12:14,t:0,started:false,marks:[],scores:[],flash:null,endT:null,done:false,fork:null};
  m.update=dt=>{tickFlash(m,dt);tickEnd(m,dt);if(m.started&&m.endT==null)m.t+=dt;if(m.fork)m.fork.t+=dt;};
  m.down=p=>{if(m.endT!=null)return;m.started=true;m.taps++;m.marks.push({u:rand(-.8,.8),v:rand(-.6,.6)});m.fork={x:p.x,y:p.y,t:0};SFX.chop();
    if(m.taps>=m.need){const s=m.t<=3?1:m.t<=4.5?.65:.35;m.scores.push(s);setFlash(m,s);m.endT=.9;s>.5?SFX.good():SFX.bad();}};
  m.score=()=>avg(m.scores);
  m.draw=c=>{const cx=180,cy=340,f=m.taps/m.need,rx=95*(1+f*.45),ry=34*(1+f*.75);
    shadow(c,cx,cy+90,150,12);
    sh(c,PAL.white,()=>c.ellipse(cx,cy,155,98,0,0,TAU));sh(c,PAL.riceShade,()=>c.ellipse(cx,cy,128,78,0,0,TAU),0);
    if(fish){sh(c,'#aab7c2',()=>{c.moveTo(cx+80,cy);c.lineTo(cx+120,cy-32);c.lineTo(cx+112,cy);c.lineTo(cx+120,cy+32);c.closePath();});sh(c,'#aab7c2',()=>c.ellipse(cx,cy,95,40,0,0,TAU));
      c.fillStyle=INK;c.beginPath();c.arc(cx-64,cy-8,5,0,TAU);c.fill();
      c.fillStyle=PAL.white;for(const k of m.marks){for(let j=0;j<4;j++)c.fillRect(cx+k.u*80+j*4-6,cy+k.v*30+(j%2)*4-2,3,3);}
      if(m.fork&&m.fork.t<.18){sh(c,PAL.skin1,()=>c.ellipse(m.fork.x,m.fork.y-20,14,10,0,0,TAU));}
    }else{
    sh(c,PAL.bay,()=>{c.moveTo(cx-rx-2,cy-14);c.lineTo(cx-rx+20,cy);c.lineTo(cx-rx-2,cy+14);c.lineTo(cx-rx-22,cy);c.closePath();});
    sh(c,PAL.eggFlesh,()=>c.ellipse(cx+6,cy,rx,ry,0,0,TAU));
    c.strokeStyle='#7d6631';c.lineWidth=2.5;for(const k of m.marks){const x=cx+6+k.u*rx*.8,y=cy+k.v*ry*.8;for(let j=-1;j<=1;j++){c.beginPath();c.moveTo(x+j*5,y-6);c.lineTo(x+j*5,y+6);c.stroke();}}
    if(m.fork&&m.fork.t<.18){const x=m.fork.x,y=m.fork.y;sh(c,PAL.knife,()=>rr(c,x-11,y-26,22,12,3),2);for(let j=-1;j<=1;j++)sh(c,PAL.knife,()=>rr(c,x+j*7-2,y-16,4,16,2),1.5);sh(c,PAL.knife,()=>rr(c,x-4,y-80,8,56,4),2);}
    }
    txt(c,`${m.taps}/${m.need}`,180,470,16,'b',PAL.white,'center','800');
    txt(c,`${m.t.toFixed(1)}s`,180,500,26,'d',m.t<=3?PAL.yellow:PAL.white,'center');
    txt(c,'3 segundo o mas mabilis = ★★★',180,522,12,'b',PAL.white,'center','600');
    drawFlash(c,m,215);
  };
  return m;
}
const MG={chop:mgChop,flip:mgFlip,pour:mgPour,stir:mgStir,mash:mgMash};

