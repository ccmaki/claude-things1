'use strict';
/* Constants, helpers, sound, shared drawing (people, food, buttons). */
const W=360,H=640,TAU=Math.PI*2;
const PAL={ink:'#2b1d16',wall:'#8fd3b6',wallDark:'#5fb08e',tileA:'#f1e4c8',tileB:'#d9c39b',wood:'#c98a4b',woodDark:'#9c6235',woodLight:'#dca468',
glass:'#c4e8f2',frame:'#5a6b78',pot:'#9aa7b3',potDark:'#6e7b87',potRim:'#d3dbe2',adobo:'#6b3a1e',adoboHi:'#8a5230',chicken:'#b5653a',chickenHi:'#d9905d',
garlic:'#f3e7c9',bay:'#5f8a3a',pepper:'#1a1a1a',sinigang:'#d8c77a',kangkong:'#4f9d48',torta:'#e8b84a',white:'#ffffff',riceShade:'#e6e4da',red:'#d7263d',
yellow:'#ffc93c',blue:'#1f4e9c',street:'#55585e',line:'#f2f2f2',sidewalk:'#a7a49c',silver:'#c9ced4',skin1:'#c98e62',skin2:'#a8714a',skin3:'#e0ad85',
hair:'#1d1612',hair2:'#4a3426',grayhair:'#b9b4ad',sh1:'#3a86c8',sh2:'#e76f51',sh3:'#2a9d8f',sh4:'#f4a261',sh5:'#9b5de5',sh6:'#ef476f',apron:'#f7f3ea',
pants:'#34495e',paper:'#fff4c2',paperLine:'#e7c96b',green:'#3fa34d',flame:'#3d7bff',flameLt:'#9cc3ff',dark:'#1b2430',night:'#1c2541',eggFlesh:'#b49a5a',
board:'#e2b77c',boardDark:'#c08f55',knife:'#dfe5ea',muted:'#7a6a5c',plant:'#3f8f4f'};
const INK=PAL.ink;
const FONT={d:'"Bowlby One","Arial Black",sans-serif',b:'"Figtree",system-ui,sans-serif',h:'"Caveat","Comic Sans MS",cursive'};

/* ---------- helpers ---------- */
const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function mix(a,b,t){const A=hexRGB(a),B=hexRGB(b);t=clamp(t,0,1);return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`;}
function rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function sh(c,fill,build,lw=3){c.beginPath();build();if(fill){c.fillStyle=fill;c.fill();}if(lw){c.lineWidth=lw;c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';c.stroke();}}
function shadow(c,x,y,rx,ry){c.globalAlpha=.2;c.fillStyle='#000';c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();c.globalAlpha=1;}
function txt(c,s,x,y,size,role='b',col=INK,align='left',weight=''){c.font=`${weight} ${size}px ${FONT[role]}`;c.fillStyle=col;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(s,x,y);}
function txtS(c,s,x,y,size,role='d',col=PAL.white,align='center',weight=''){c.font=`${weight} ${size}px ${FONT[role]}`;c.textAlign=align;c.textBaseline='alphabetic';c.lineJoin='round';c.lineWidth=Math.max(3,size/4);c.strokeStyle=INK;c.strokeText(s,x,y);c.fillStyle=col;c.fillText(s,x,y);}
function wrap(c,s,x,y,maxW,lh){const words=s.split(' ');let line='';for(const w of words){const t=line?line+' '+w:w;if(c.measureText(t).width>maxW&&line){c.fillText(line,x,y);line=w;y+=lh;}else line=t;}c.fillText(line,x,y);return y;}
function wrapS(c,s,x,y,maxW,lh){const words=s.split(' ');let line='';const out=[];for(const w of words){const t=line?line+' '+w:w;if(c.measureText(t).width>maxW&&line){out.push(line);line=w;}else line=t;}out.push(line);
  out.forEach((l,i)=>{c.strokeText(l,x,y+i*lh);c.fillText(l,x,y+i*lh);});}
const peso=n=>`₱${Math.round(n).toLocaleString('en-US')}`;

/* ---------- sound ---------- */
let AC=null,soundOn=true;
function beep(f,d,type,v){if(!soundOn)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,AC.currentTime);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d+.02);}catch(e){}}
const SFX={tap:()=>beep(520,.05,'triangle',.06),good:()=>{beep(660,.08,'triangle',.07);setTimeout(()=>beep(990,.12,'triangle',.07),70);},
  bad:()=>beep(170,.18,'sawtooth',.035),coin:()=>{beep(1250,.05,'square',.025);setTimeout(()=>beep(1680,.09,'square',.025),55);},chop:()=>beep(320,.035,'square',.035),
  win:()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.14,'triangle',.06),i*90))};

/* ---------- drawing pieces ---------- */
function person(c,x,y,o){
  const b=o.bob||0;
  shadow(c,x,y,15,5);
  if(o.seated)sh(c,PAL.red,()=>c.ellipse(x,y-4,11,6,0,0,TAU));
  else{const s=o.step||0;sh(c,PAL.pants,()=>rr(c,x-8,y-11-Math.max(0,s)*3,6,11,2),2);sh(c,PAL.pants,()=>rr(c,x+2,y-11-Math.max(0,-s)*3,6,11,2),2);}
  const by=o.seated?y-24:y-27;
  sh(c,o.shirt,()=>rr(c,x-12,by+b,24,19,8));
  if(o.apron)sh(c,PAL.apron,()=>rr(c,x-7,by+4+b,14,14,3),2);
  const hy=by-12+b;
  sh(c,o.skin,()=>c.arc(x,hy,14,0,TAU));
  if(o.back){sh(c,o.hair,()=>c.arc(x,hy-1,14,0,TAU));}
  else{
    c.beginPath();c.arc(x,hy-1,14,Math.PI*1.02,Math.PI*1.98);c.closePath();c.fillStyle=o.hair;c.fill();
    c.beginPath();c.arc(x,hy,14,0,TAU);c.lineWidth=3;c.strokeStyle=INK;c.stroke();
    c.fillStyle=INK;c.beginPath();c.arc(x-5,hy+2,2,0,TAU);c.arc(x+5,hy+2,2,0,TAU);c.fill();
    c.lineWidth=2;c.beginPath();if(o.angry){c.arc(x,hy+9,3,1.15*Math.PI,1.85*Math.PI);}else c.arc(x,hy+6,3,.15*Math.PI,.85*Math.PI);c.stroke();
    if(o.band)sh(c,PAL.red,()=>rr(c,x-14,hy-9,28,5,2),2);
  }
  if(o.pony){sh(c,o.hair,()=>c.arc(x+13,hy-9,6,0,TAU),2);sh(c,PAL.red,()=>c.arc(x+9,hy-7,2.5,0,TAU),1.5);}
  if(o.cap){sh(c,PAL.blue,()=>{c.arc(x,hy-3,14,Math.PI,TAU);c.closePath();},2.5);if(!o.back)sh(c,PAL.blue,()=>rr(c,x-4,hy-6,20,5,2),2);}
}
function foodIcon(c,x,y,kind,s=1){
  c.save();c.translate(x,y);c.scale(s,s);
  if(kind==='rice'){sh(c,PAL.blue,()=>{c.moveTo(-9,0);c.lineTo(9,0);c.arc(0,0,9,0,Math.PI);},2);sh(c,PAL.white,()=>c.arc(0,0,7,Math.PI,TAU),2);}
  else if(kind==='sinangag'){sh(c,PAL.blue,()=>{c.moveTo(-9,0);c.lineTo(9,0);c.arc(0,0,9,0,Math.PI);},2);sh(c,'#e6b85c',()=>c.arc(0,0,7,Math.PI,TAU),2);c.fillStyle=PAL.kangkong;c.fillRect(-3,-4,2,2);c.fillRect(2,-3,2,2);}
  else if(kind==='sabaw'){sh(c,PAL.white,()=>c.ellipse(0,1,10,6,0,0,TAU),2);sh(c,PAL.sinigang,()=>c.ellipse(0,0,7,3.5,0,0,TAU),0);c.fillStyle=PAL.kangkong;c.fillRect(-3,-1,4,2);}
  else{const D=DISH[kind]||DISH.adobo;sh(c,PAL.white,()=>c.ellipse(0,1,10,6,0,0,TAU),2);
    if(D.fish){sh(c,D.col,()=>{c.ellipse(-1,0,6,3,0,0,TAU);},0);c.fillStyle=D.col;c.beginPath();c.moveTo(4,0);c.lineTo(8,-3);c.lineTo(8,3);c.closePath();c.fill();c.fillStyle=INK;c.fillRect(-5,-1,1.5,1.5);}
    else{sh(c,D.col,()=>c.ellipse(0,0,7,3.8,0,0,TAU),0);c.fillStyle=D.bit;c.beginPath();c.arc(-2,-.5,1.6,0,TAU);c.arc(2.5,.5,1.4,0,TAU);c.fill();}}
  c.restore();
}
function bubble(c,x,y,kind,pat){
  sh(c,PAL.white,()=>rr(c,x-16,y-16,32,26,8));
  c.fillStyle=PAL.white;c.beginPath();c.moveTo(x-4,y+8);c.lineTo(x+4,y+8);c.lineTo(x,y+15);c.closePath();c.fill();
  c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.moveTo(x-4,y+10);c.lineTo(x,y+15);c.lineTo(x+4,y+10);c.stroke();
  foodIcon(c,x,y-3,kind);
  if(pat!=null){const col=pat>.55?PAL.green:pat>.28?PAL.yellow:PAL.red;sh(c,INK,()=>rr(c,x-14,y-25,28,6,3),0);sh(c,col,()=>rr(c,x-13,y-24,26*Math.max(.05,pat),4,2),0);}
}
function heart(c,x,y,s,col=PAL.red){c.save();c.translate(x,y);c.scale(s,s);sh(c,col,()=>{c.moveTo(0,6);c.bezierCurveTo(-12,-2,-6,-12,0,-5);c.bezierCurveTo(6,-12,12,-2,0,6);},2/s);c.restore();}
function star(c,x,y,r,col){sh(c,col,()=>{for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}c.closePath();},Math.max(1.5,r/6));}
function stars(c,x,y,r,n,gap){for(let i=0;i<3;i++)star(c,x+(i-1)*gap,y,r,i<n?PAL.yellow:PAL.riceShade);}
function lockIcon(c,x,y){c.lineWidth=3;c.strokeStyle=PAL.muted;c.beginPath();c.arc(x,y-4,6,Math.PI,TAU);c.stroke();sh(c,PAL.muted,()=>rr(c,x-9,y-4,18,14,3),0);}
function bgWood(c){c.fillStyle=PAL.wood;c.fillRect(V.x0,V.y0,V.x1-V.x0,V.y1-V.y0);
  c.strokeStyle=PAL.woodDark;c.lineWidth=3;for(let y=Math.floor(V.y0/58)*58+46;y<V.y1;y+=58){c.beginPath();c.moveTo(V.x0,y);c.lineTo(V.x1,y);c.stroke();}
  c.lineWidth=2;c.strokeStyle=PAL.woodLight;for(let i=0;i<40;i++){const gx=V.x0+((i*97)%Math.max(1,(V.x1-V.x0))),gy=V.y0+((i*61)%Math.max(1,(V.y1-V.y0)));c.beginPath();c.moveTo(gx,gy);c.lineTo(gx+30,gy+2);c.stroke();}}
function paperBox(c,x,y,w,h,title){
  sh(c,PAL.paper,()=>rr(c,x,y,w,h,8));
  c.strokeStyle=PAL.paperLine;c.lineWidth=1.5;for(let ly=y+28;ly<y+h-6;ly+=20){c.beginPath();c.moveTo(x+8,ly);c.lineTo(x+w-8,ly);c.stroke();}
  c.strokeStyle=PAL.red;c.beginPath();c.moveTo(x+26,y+4);c.lineTo(x+26,y+h-4);c.stroke();
  if(title)txt(c,title,x+34,y+18,10,'b',PAL.red,'left','800');
}

/* ---------- buttons ---------- */
let btns=[],pressed=null,pressT=0;
function button(c,id,x,y,w,h,label,o={}){
  const dis=!!o.disabled;if(!dis)btns.push({id,x,y,w,h});
  const down=pressed===id&&pressT<.15?3:0;
  sh(c,INK,()=>rr(c,x,y+4,w,h,12),0);
  sh(c,dis?PAL.riceShade:(o.fill||PAL.yellow),()=>rr(c,x,y+down,w,h,12));
  txt(c,label,x+w/2,y+down+h/2+(o.size||16)*.36,o.size||16,'d',dis?PAL.muted:(o.col||INK),'center');
}

