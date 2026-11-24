'use strict';
/* Engine: canvas sizing, input, main loop. */
/* ---------- engine ---------- */
const cv=document.getElementById('game'),ctx=cv.getContext('2d');
let sc=1,ox=0,oy=0;const V={x0:0,x1:W,y0:0,y1:H};
function resize(){const dpr=Math.min(2,window.devicePixelRatio||1);const r=cv.getBoundingClientRect();cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));
  sc=Math.min(cv.width/W,cv.height/H);ox=(cv.width-W*sc)/2;oy=(cv.height-H*sc)/2;V.x0=-ox/sc;V.x1=W+ox/sc;V.y0=-oy/sc;V.y1=H+oy/sc;}
function toL(e){const r=cv.getBoundingClientRect();const dpr=cv.width/r.width;return{x:((e.clientX-r.left)*dpr-ox)/sc,y:((e.clientY-r.top)*dpr-oy)/sc};}
cv.addEventListener('pointerdown',e=>{e.preventDefault();const p=toL(e);
  for(let i=btns.length-1;i>=0;i--){const b=btns[i];if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y-2&&p.y<=b.y+b.h+6){pressed=b.id;pressT=0;SFX.tap();scene.onBtn&&scene.onBtn(b.id);return;}}
  try{cv.setPointerCapture(e.pointerId);}catch(_){}scene.down&&scene.down(p);});
cv.addEventListener('pointermove',e=>{if(scene.move)scene.move(toL(e));});
const pu=e=>{if(scene.up)scene.up(toL(e));};cv.addEventListener('pointerup',pu);cv.addEventListener('pointercancel',pu);
cv.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(cv);
resize();loadGame();go(makeTitle());
window.KD={G,get scene(){return scene;}};
let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;pressT+=dt;
  try{scene.update&&scene.update(dt);
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=PAL.ink;ctx.fillRect(0,0,cv.width,cv.height);
    ctx.setTransform(sc,0,0,sc,ox,oy);btns=[];scene.draw(ctx);}catch(err){console.error(err);}
  requestAnimationFrame(frame);}
requestAnimationFrame(frame);
