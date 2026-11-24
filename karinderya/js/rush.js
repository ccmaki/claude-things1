'use strict';
/* Lunch rush: orders, plating, plates, pathfinding, Nene, kalan. */
const RICE_PRICE={rice:15,sinangag:20};
const RICE_NAME={rice:'kanin',sinangag:'sinangag'};
function orderIcons(o){const a=[];if(o.ul[0]===o.ul[1])a.push({k:o.ul[0]});else a.push({k:o.ul[0],half:1},{k:o.ul[1],half:1});for(const r of o.rice)a.push({k:r});if(o.sabaw)a.push({k:'sabaw'});return a;}
function orderBubble(c,x,y,o,pat){
  const ic=orderIcons(o),w=ic.length*22+12;x=clamp(x,w/2+4,W-w/2-4);
  sh(c,PAL.white,()=>rr(c,x-w/2,y-16,w,26,8));
  ic.forEach((q,i)=>{foodIcon(c,x-w/2+17+i*22,y-3,q.k,.85);if(q.half)txtS(c,'½',x-w/2+24+i*22,y+6,10,'b',PAL.yellow,'center','800');});
  if(pat!=null){const col=pat>.55?PAL.green:pat>.28?PAL.yellow:PAL.red;sh(c,INK,()=>rr(c,x-14,y-25,28,6,3),0);sh(c,col,()=>rr(c,x-13,y-24,26*Math.max(.05,pat),4,2),0);}
}
function orderText(o){const n=d=>RECIPES[d].short;const p=[];
  p.push(o.ul[0]===o.ul[1]?`Isang ${n(o.ul[0])}`:`Half ${n(o.ul[0])}, half ${n(o.ul[1])}`);
  p.push(`${o.rice.length===2?'dalawang':'isang'} ${RICE_NAME[o.rice[0]]}`);
  p.push(o.sabaw?'may sabaw':'walang sabaw');return p.join(', ')+' po.';}
function checkPlate(p,o){const f=p.slots.filter(Boolean).sort(),R2=p.rice.slice().sort(),oR=o.rice.slice().sort();
  const ul=!f.length?'empty':f.join()===o.ul.join()?'ok':(f.length===1&&o.ul.includes(f[0]))?'part':'bad';
  const rice=!R2.length?'empty':R2.join()===oR.join()?'ok':(R2.length<oR.length&&R2.every(r=>r===oR[0]))?'part':'bad';
  const sabaw=o.sabaw?(p.sabaw?'ok':'empty'):(p.sabaw?'bad':'ok');
  return{ul,rice,sabaw,ok:ul==='ok'&&rice==='ok'&&sabaw==='ok'};}

function makeRush(){
  const dishes=Object.keys(G.cooked);
  const PLATES=plateCount(),SPEED=170*(1+.2*UP('shoes'));
  const S={t:0,dur:120,custs:[],spawnT:1.2,pops:[],busy:0,washN:0,act:null,marker:null,pl:null,carry:0,rack:PLATES,
    P:{x:180,y:150,path:[],ph:0,moving:false},
    st:{earn:0,served:0,wrong:0,lost:0,sinangag:0,extra:0,sabaw:0,washed:0,takeout:0,recooked:0},ended:false,endT:0,endMsg:''};
  S.tables=[{x:100,y:374},{x:260,y:374},{x:100,y:488},{x:260,y:488}];

  /* walk grid + A* pathfinding */
  const CS=8,GX=45,GY0=96,GR=Math.ceil((572-96)/CS),grid=new Uint8Array(GX*GR);
  const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const blockRect=(x0,y0,x1,y1)=>{for(let r=0;r<GR;r++)for(let q=0;q<GX;q++){const x=q*CS+4,y=GY0+r*CS+4;if(x>=x0&&x<=x1&&y>=y0&&y<=y1)grid[r*GX+q]=1;}};
  blockRect(-99,0,999,116);blockRect(24,168,314,240);
  for(const t of S.tables)blockRect(t.x-38,t.y-24,t.x+38,t.y+28);
  blockRect(-99,558,146,999);blockRect(214,558,999,999);
  const cellOf=(x,y)=>[clamp(Math.floor(x/CS),0,GX-1),clamp(Math.floor((y-GY0)/CS),0,GR-1)];
  const free=(q,r)=>q>=0&&q<GX&&r>=0&&r<GR&&!grid[r*GX+q];
  const ctr=(q,r)=>({x:q*CS+4,y:GY0+r*CS+4});
  function nearestFree(q,r){if(free(q,r))return[q,r];for(let d=1;d<25;d++)for(let a=-d;a<=d;a++)for(const [dq,dr] of [[a,-d],[a,d],[-d,a],[d,a]])if(free(q+dq,r+dr))return[q+dq,r+dr];return[q,r];}
  function los(a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);for(let i=1;i<n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(y<GY0||y>=GY0+GR*CS)continue;const [q,r]=cellOf(x,y);if(grid[r*GX+q])return false;}return true;}
  function findPath(x0,y0,x1,y1){
    const [sq,sr]=nearestFree(...cellOf(x0,y0)),[tq,tr]=nearestFree(...cellOf(x1,y1));
    const N=GX*GR,g=new Float32Array(N).fill(1e9),f=new Float32Array(N).fill(1e9),came=new Int32Array(N).fill(-1),closed=new Uint8Array(N);
    const s=sr*GX+sq,t=tr*GX+tq,h=i=>Math.hypot(i%GX-tq,((i/GX)|0)-tr);g[s]=0;f[s]=h(s);const open=[s];let found=s===t;
    while(open.length&&!found){let bi=0;for(let i=1;i<open.length;i++)if(f[open[i]]<f[open[bi]])bi=i;const cur=open[bi];open[bi]=open[open.length-1];open.pop();
      if(closed[cur])continue;closed[cur]=1;if(cur===t){found=true;break;}const cq=cur%GX,cr=(cur/GX)|0;
      for(const [dq,dr] of DIRS){const nq=cq+dq,nr=cr+dr;if(!free(nq,nr))continue;if(dq&&dr&&(!free(cq+dq,cr)||!free(cq,cr+dr)))continue;
        const ni=nr*GX+nq,ng=g[cur]+(dq&&dr?1.414:1);if(ng<g[ni]){g[ni]=ng;came[ni]=cur;f[ni]=ng+h(ni);open.push(ni);}}}
    if(!found)return[{x:x1,y:y1}];
    const cells=[];for(let i=t;;i=came[i]){cells.push(ctr(i%GX,(i/GX)|0));if(i===s||came[i]<0)break;}cells.reverse();cells.push({x:x1,y:y1});
    const out=[];let a={x:x0,y:y0},i=0;
    while(i<cells.length){let j=cells.length-1;while(j>i&&!los(a,cells[j]))j--;out.push(cells[j]);a=cells[j];i=j+1;}
    return out;}
  S.seats=[];S.tables.forEach(t=>{S.seats.push({t,side:-1,x:t.x-40,y:t.y+8,occ:null,plate:false});S.seats.push({t,side:1,x:t.x+40,y:t.y+8,occ:null,plate:false});});
  S.spots=[64,164,264].map(x=>({x,y:266,c:null}));
  const SINK={x:46,y:132},RACK={x:104,y:132};
  const ITEMS=[...dishes.map(d=>({k:d,kind:'ulam'})),{k:'rice',kind:'rice'},{k:'sinangag',kind:'rice'},{k:'sabaw',kind:'sabaw'}];
  ITEMS.forEach((it,i)=>{it.x=30+i*(300/(ITEMS.length-1));it.y=284;it.cx=46+i*(250/(ITEMS.length-1));});
  const KALAN={x:318,y:126};
  /* sister helper */
  const NN=UP('sister')?{x:300,y:150,path:[],ph:0,moving:false,carry:0,busy:0,washN:0,state:'idle',tbl:null,vx:0,vy:1,cap:4+2*(UP('sister')-1),speed:115*(UP('sister')>1?1.4:1)}:null;
  function neneThink(){const N=NN;
    if(N.state==='toTable'){let n=0;for(const s of S.seats)if(s.t===N.tbl&&s.plate&&N.carry<N.cap){s.plate=false;N.carry++;n++;}N.state='idle';}
    else if(N.state==='toSink'){if(N.carry){N.washN=N.carry;N.carry=0;N.busy=.45*N.washN;}N.state='idle';}
    if(N.busy>0)return;
    const dirty=S.seats.filter(s=>s.plate);
    if(dirty.length&&N.carry<N.cap){dirty.sort((a,b)=>Math.hypot(a.x-N.x,a.y-N.y)-Math.hypot(b.x-N.x,b.y-N.y));const s=dirty[0];N.tbl=s.t;N.state='toTable';N.path=findPath(N.x,N.y,s.x+s.side*30,s.y+4);}
    else if(N.carry>0){N.state='toSink';N.path=findPath(N.x,N.y,SINK.x+20,150);}
    else if(Math.hypot(N.x-290,N.y-150)>6){N.state='home';N.path=findPath(N.x,N.y,290,150);}}
  /* mid-rush re-cook at the kalan */
  function openKalan(){S.qc={phase:'menu'};SFX.tap();}
  function startQuick(k){const r=RECIPES[k],half=Math.round(r.cost/2);G.money-=half;G.todayCost+=half;
    const st=r.steps[r.steps.length-1];S.qc={phase:'play',k,cost:half,st,mg:MG[st.type]({...st,quick:true,n:Math.min(st.n||1,2)})};SFX.tap();}
  function finishQuick(){const q=S.qc,sc=q.mg.score(),ns=sc>=.85?3:sc>=.6?2:1,d=G.cooked[q.k];
    d.stars=Math.round((d.stars+ns)/2);d.left+=10;S.st.recooked++;S.qc=null;SFX.win();pop(KALAN.x-60,100,`+5 ${RECIPES[q.k].short}!`,PAL.green,13);}
  const sukiToday=G.suki.filter(s=>dishes.includes(s.fav)).map(s=>({s,at:rand(18,60),done:false}));
  const pop=(x,y,t,col=PAL.white,size=15,dur=1.3)=>S.pops.push({x,y,t,col,size,dur,age:0});
  const pendingScoops=d=>S.custs.filter(c=>c.state==='in'||c.state==='wait').reduce((a,c)=>a+c.order.ul.filter(u=>u===d).length,0);
  const avail=d=>G.cooked[d].left-pendingScoops(d);
  function makeOrder(pref){
    const one=dishes.filter(d=>avail(d)>=1),two=dishes.filter(d=>avail(d)>=2);if(!one.length)return null;let ul;
    if(pref&&two.includes(pref))ul=[pref,pref];
    else if(one.length>=2&&(Math.random()<(G.day===1?.3:.45)||!two.length))ul=[one[0],one[1]];
    else if(two.length){const d=two[Math.floor(Math.random()*two.length)];ul=[d,d];}
    else return null;
    const rt=Math.random()<.3?'sinangag':'rice';
    return{ul:ul.slice().sort(),rice:Math.random()<.18?[rt,rt]:[rt],sabaw:G.day>=2&&Math.random()<.3};}
  function interval(){const base=7.5*Math.pow(.9,G.day-1);const peak=(S.t>35&&S.t<85)?.7:1;return Math.max(3,base*peak*rand(.8,1.2));}
  function spawn(order,suki,spot){const L=LOOKS[Math.floor(Math.random()*LOOKS.length)];
    const c={x:rand(150,210),y:H+20,path:[{x:180,y:556},...findPath(180,556,spot.x,spot.y)],state:'in',order,suki,pat:1,spot,seat:null,eatT:0,ph:rand(0,TAU),
      look:suki?suki.look:{shirt:L[0],skin:L[1],hair:L[2]},moving:true,patMax:Math.max(18,32-(G.day-1)*2)*(suki?1.25:1)*(1+.25*UP('fan'))};
    spot.c=c;S.custs.push(c);}
  function leave(c){c.state='out';c.path=[...findPath(c.x,c.y,180,550),{x:180,y:604},{x:Math.random()<.5?V.x0-40:V.x1+40,y:604}];}
  function freeSpot(c){if(c.spot){c.spot.c=null;c.spot=null;}}
  function arrive(c){if(c.state==='in'){c.state='wait';}else if(c.state==='toSeat'){c.state='eat';c.eatT=rand(9,14);}else if(c.state==='out')c.state='gone';}
  const inStaff=y=>y<205;
  function moveTo(x,y){const P=S.P,ts=inStaff(y);
    if(ts){x=clamp(x,30,330);y=clamp(y,124,164);}else{x=clamp(x,16,344);y=clamp(y,246,548);}
    P.path=findPath(P.x,P.y,x,y);}
  function setAct(a,x,y){S.act=a;moveTo(x,y);}
  /* plating */
  function openPlate(c){if(S.rack<=0){pop(180,150,'Walang malinis na plato!',PAL.red,12);SFX.bad();return;}
    S.rack--;c.state='plating';S.pl={c,slots:[null,null],rice:[],sabaw:false,drag:null,t:0};SFX.tap();}
  function returnPlate(){const p=S.pl;for(const s of p.slots)if(s)G.cooked[s].left++;p.slots=[null,null];p.rice=[];p.sabaw=false;}
  function closePlate(back){const p=S.pl;if(!p)return;returnPlate();S.rack++;if(back&&p.c.state==='plating')p.c.state='wait';S.pl=null;}
  /* one tap of an ulam = one full order (both halves). Tapping a second, different ulam makes it half-half. */
  function place(it){const p=S.pl,sl=p.slots,L=k=>G.cooked[k];
    if(it.kind==='ulam'){const k=it.k;if(L(k).left<=0){pop(it.x,240,'Ubos na!',PAL.red,13);SFX.bad();return;}
      if(!sl[0]&&!sl[1]){if(L(k).left>=2){sl[0]=sl[1]=k;L(k).left-=2;}else{sl[0]=k;L(k).left--;}}
      else if(sl[0]&&sl[1]){if(sl[0]===sl[1]&&sl[0]!==k){L(sl[1]).left++;sl[1]=k;L(k).left--;}else{pop(170,392,'Puno na ang ulam! I-tap ang ulam sa plato para alisin.',PAL.white,12,2);SFX.bad();return;}}
      else{sl[sl[0]?1:0]=k;L(k).left--;}}
    else if(it.kind==='rice'){if(p.rice.length>=3){pop(170,470,'Sobra na, apo!',PAL.white,13);SFX.bad();return;}p.rice.push(it.k);}
    else p.sabaw=!p.sabaw;
    SFX.tap();}
  function plateTap(q){const p=S.pl;
    if(Math.hypot(q.x-318,q.y-490)<32){if(p.sabaw){p.sabaw=false;SFX.tap();}return true;}
    if(((q.x-170)/110)**2+((q.y-422)/36)**2<=1&&(p.slots[0]||p.slots[1])){for(const k of p.slots)if(k)G.cooked[k].left++;p.slots=[null,null];SFX.tap();return true;}
    if(Math.abs(q.x-170)<80&&Math.abs(q.y-490)<24&&p.rice.length){p.rice.pop();SFX.tap();return true;}
    return false;}
  function give(){const p=S.pl,c=p.c,o=c.order;const ul=p.slots.filter(Boolean).sort();
    if(!ul.length&&!p.rice.length){pop(170,440,'Wala pang laman!',PAL.white,13);SFX.bad();return;}
    const chk=checkPlate(p,o),ok=chk.ok;
    let price=ul.reduce((a,d)=>a+RECIPES[d].price/2,0)+p.rice.reduce((a,r)=>a+RICE_PRICE[r],0);
    S.st.sinangag+=p.rice.filter(r=>r==='sinangag').length;S.st.extra+=Math.max(0,p.rice.length-1);if(p.sabaw)S.st.sabaw++;
    if(ok){const st=avg(ul.map(d=>G.cooked[d].stars));price+=Math.round((st-1)*5)+(c.pat>.6?5:0)+(c.suki?10:0);S.st.served++;SFX.coin();
      pop(c.x,c.y-74,`+${peso(price)}`,PAL.yellow,18);
      if(c.suki){c.suki.hearts++;pop(c.x,c.y-100,`"${c.suki.line}"`,PAL.white,12,2.6);}}
    else{S.st.wrong++;c.angry=true;SFX.bad();
      const why=chk.ul!=='ok'?'Mali ang ulam!':chk.rice!=='ok'?'Mali ang kanin!':o.sabaw?'Nasaan ang sabaw ko?':'Hindi ako humingi ng sabaw!';
      pop(c.x,c.y-74,`${why} +${peso(price)}`,PAL.red,12,2.4);}
    G.money+=price;S.st.earn+=price;
    p.slots=[null,null];S.pl=null;freeSpot(c);
    const free=S.seats.filter(s=>!s.occ&&!s.plate);
    if(free.length){free.sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y));const s=free[0];s.occ=c;c.seat=s;c.state='toSeat';c.path=findPath(c.x,c.y,s.x,s.y);c.dish=ul[0]||'rice';}
    else{S.st.takeout++;S.rack++;pop(c.x,c.y-50,'Take-out na lang!',PAL.white,12);leave(c);}}
  function end(msg){if(S.ended)return;S.ended=true;S.endMsg=msg;S.endT=0;if(S.pl)closePlate(false);
    for(const c of S.custs)if(c.state==='wait'||c.state==='in'||c.state==='plating'){freeSpot(c);leave(c);}SFX.win();}
  function doAct(a){
    if(a.type==='plate'){if(a.c.state==='wait')openPlate(a.c);}
    else if(a.type==='sink'){if(S.carry>0){S.washN=S.carry;S.busy=.35*S.carry;S.carry=0;SFX.tap();}else pop(SINK.x+30,100,'Walang huhugasan',PAL.white,12);}
    else if(a.type==='kalan')openKalan();
    else if(a.type==='pick'){for(const s of S.seats){if(s.t!==a.seat.t||!s.plate)continue;if(S.carry>=carryMax()){pop(a.seat.x,a.seat.y-60,'Puno na ang kamay!',PAL.white,12);break;}s.plate=false;S.carry++;}SFX.tap();}
  }
  S.onBtn=id=>{
    if(S.qc){if(id==='qc-close'){if(S.qc.phase==='play'){G.money+=S.qc.cost;G.todayCost-=S.qc.cost;}S.qc=null;}else if(id.startsWith('qc-'))startQuick(id.slice(3));return;}
    if(!S.pl)return;if(id==='pl-close')closePlate(true);else if(id==='pl-ulit'){returnPlate();SFX.tap();}else if(id==='pl-give')give();};
  S.down=p=>{
    if(S.ended)return;
    if(S.qc){if(S.qc.phase==='play'&&S.qc.mg.down)S.qc.mg.down(p);return;}
    if(S.pl){for(const it of ITEMS)if(Math.hypot(p.x-it.x,p.y-it.y)<30){S.pl.drag={it,x:p.x,y:p.y,sx:p.x,sy:p.y};return;}plateTap(p);return;}
    S.marker={x:p.x,y:p.y,t:0};
    let best=null,bd=34;
    for(const c of S.custs){if(c.state!=='wait')continue;const d=Math.min(Math.hypot(p.x-c.x,p.y-(c.y-28)),Math.hypot(p.x-c.x,p.y-(c.y-80)));if(d<bd){bd=d;best=c;}}
    if(!best&&p.y>170&&p.y<238&&p.x>24&&p.x<314){for(const c of S.custs)if(c.state==='wait'&&Math.abs(c.x-p.x)<33)best=c;}
    if(best){if(S.carry>0){pop(S.P.x,S.P.y-80,'Hugasan muna ang plato!',PAL.white,12);SFX.bad();moveTo(S.P.x,S.P.y);return;}if(inStaff(S.P.y)){S.act=null;openPlate(best);moveTo(clamp(best.x,40,300),164);return;}setAct({type:'plate',c:best},clamp(best.x,40,300),164);return;}
    if(Math.hypot(p.x-KALAN.x,p.y-KALAN.y)<30){if(S.carry>0){pop(S.P.x,S.P.y-80,'Hugasan muna ang plato!',PAL.white,12);SFX.bad();return;}setAct({type:'kalan'},KALAN.x,160);return;}
    if(Math.hypot(p.x-SINK.x,p.y-SINK.y)<34||Math.hypot(p.x-RACK.x,p.y-RACK.y)<26){setAct({type:'sink'},SINK.x+20,162);return;}
    for(const s of S.seats)if(s.plate&&(Math.hypot(p.x-(s.t.x+s.side*16),p.y-s.t.y)<22||Math.hypot(p.x-s.x,p.y-(s.y-14))<28)){setAct({type:'pick',seat:s},s.x+s.side*30,s.y+4);return;}
    setAct(null,p.x,p.y);
  };
  S.move=p=>{if(S.qc&&S.qc.phase==='play'&&S.qc.mg.move){S.qc.mg.move(p);return;}if(S.pl&&S.pl.drag){S.pl.drag.x=p.x;S.pl.drag.y=p.y;}};
  S.up=p=>{if(S.qc&&S.qc.phase==='play'&&S.qc.mg.up){S.qc.mg.up(p);return;}const pl=S.pl;if(!pl||!pl.drag)return;const d=pl.drag;pl.drag=null;
    if(Math.hypot(p.x-d.sx,p.y-d.sy)<12){place(d.it);return;}
    const onPlate=((p.x-170)/130)**2+((p.y-452)/90)**2<=1,onBowl=Math.hypot(p.x-318,p.y-490)<36;
    if(onPlate||onBowl)place(d.it);};
  S.update=dt=>{
    if(!S.ended)S.t+=dt;else{S.endT+=dt;if(S.endT>3)go(makeEvening(S.st));}
    if(S.pl)S.pl.t+=dt;
    if(S.qc&&S.qc.phase==='play'){S.qc.mg.update(dt);if(S.qc.mg.done)finishQuick();}
    if(NN){const N=NN;
      if(N.busy>0){N.busy-=dt;if(N.busy<=0&&N.washN){S.rack+=N.washN;S.st.washed+=N.washN;pop(SINK.x+40,100,`Nene: +${N.washN} plato`,PAL.green,12);N.washN=0;neneThink();}}
      else if(N.path.length){const t=N.path[0],dx=t.x-N.x,dy=t.y-N.y,d=Math.hypot(dx,dy);
        if(d<2){N.x=t.x;N.y=t.y;N.path.shift();if(!N.path.length){N.moving=false;neneThink();}}
        else{const s=Math.min(d,N.speed*dt);N.vx=dx/d;N.vy=dy/d;N.x+=N.vx*s;N.y+=N.vy*s;N.moving=true;N.ph+=dt*13;}}
      else if(S.t%0.5<dt)neneThink();}
    if(!S.ended&&S.t<S.dur-8){S.spawnT-=dt;
      for(const k of sukiToday)if(!k.done&&S.t>=k.at){const spot=S.spots.find(s=>!s.c);const o=spot&&makeOrder(k.s.fav);if(o){spawn(o,k.s,spot);k.done=true;}}
      if(S.spawnT<=0){const spot=S.spots.find(s=>!s.c);const o=spot&&makeOrder();if(o)spawn(o,null,spot);S.spawnT=interval();}}
    const P=S.P;
    if(S.busy>0){S.busy-=dt;if(S.busy<=0&&S.washN){S.rack+=S.washN;S.st.washed+=S.washN;pop(SINK.x+30,100,`Malinis! +${S.washN} plato`,PAL.green,12);S.washN=0;SFX.good();}}
    else if(P.path.length){const t=P.path[0],dx=t.x-P.x,dy=t.y-P.y,d=Math.hypot(dx,dy);
      if(d<2){P.x=t.x;P.y=t.y;P.path.shift();if(!P.path.length){P.moving=false;if(S.act){const a=S.act;S.act=null;doAct(a);}}}
      else{const s=Math.min(d,SPEED*dt);P.vx=dx/d;P.vy=dy/d;P.x+=P.vx*s;P.y+=P.vy*s;P.moving=true;P.ph+=dt*13;}}
    for(const c of S.custs){
      if(c.path.length){const t=c.path[0],dx=t.x-c.x,dy=t.y-c.y,d=Math.hypot(dx,dy);c.moving=true;c.ph+=dt*10;
        if(d<2){c.x=t.x;c.y=t.y;c.path.shift();if(!c.path.length){c.moving=false;arrive(c);}}else{const s=Math.min(d,85*dt);c.vx=dx/d;c.vy=dy/d;c.x+=c.vx*s;c.y+=c.vy*s;}}
      if((c.state==='wait'||c.state==='plating')&&!S.ended){c.pat-=dt/c.patMax*(c.state==='plating'?.5:1);
        if(c.pat<=0){if(c.state==='plating')closePlate(false);freeSpot(c);S.st.lost++;c.angry=true;pop(c.x,c.y-80,'Ang tagal!',PAL.red);SFX.bad();leave(c);}}
      if(c.state==='eat'){c.eatT-=dt;if(c.eatT<=0){c.seat.occ=null;c.seat.plate=true;c.seat=null;leave(c);}}
    }
    S.custs=S.custs.filter(c=>c.state!=='gone');
    for(const c of S.custs){if(c.state!=='wait')continue;
      const short=dishes.some(d=>G.cooked[d].left<c.order.ul.filter(u=>u===d).length);
      if(short){const old=c.order;c.order={ul:[],rice:[]};const o=makeOrder();
        if(o){c.order=o;pop(c.x,c.y-84,'Sige, iba na lang.',PAL.white,12);}else{c.order=old;freeSpot(c);pop(c.x,c.y-84,'Ubos na pala...',PAL.white,12);leave(c);}}}
    for(const p of S.pops)p.age+=dt;S.pops=S.pops.filter(p=>p.age<p.dur);
    if(S.marker){S.marker.t+=dt;if(S.marker.t>.5)S.marker=null;}
    if(!S.ended){
      if(S.t>=S.dur)end('SARADO NA!');
      else if(dishes.every(d=>G.cooked[d].left<=0)&&!S.pl&&!S.qc&&!S.custs.some(c=>c.state==='wait'||c.state==='in'))end('UBOS NA LAHAT!');}
  };
  function tipText(){
    if(S.ended||S.pl||S.qc)return null;
    const low=dishes.find(d=>G.cooked[d].left<=4);
    if(low)return `Paubos na ang ${RECIPES[low].short}! I-tap ang kalan (kanan sa itaas) para magluto pa`;
    if(G.day>2)return null;
    if(S.carry>0)return 'I-tap ang lababo (kaliwa sa itaas) para hugasan';
    if(NN&&S.custs.some(c=>c.state==='wait'))return 'I-tap ang customer sa counter. Si Nene ang bahala sa plato!';
    const dirty=S.seats.some(s=>s.plate);
    if(S.rack<=0)return 'Ubos ang malinis na plato! Kunin ang maruruming plato sa mesa';
    if(S.custs.some(c=>c.state==='wait'))return 'I-tap ang customer sa counter para ihanda ang order';
    if(dirty)return 'I-tap ang maruming plato sa mesa para kunin';
    return 'Hintayin ang mga customer...';}
  function drawItem(c,it,x,y,r){
    if(it.k==='rice'){sh(c,PAL.white,()=>rr(c,x-r,y-r*.8,r*2,r*1.7,r*.45));sh(c,PAL.riceShade,()=>c.ellipse(x,y-r*.5,r*.8,r*.35,0,0,TAU),2);c.fillStyle=PAL.red;c.beginPath();c.arc(x+r*.55,y+r*.45,r*.12,0,TAU);c.fill();return;}
    if(it.k==='sinangag'){sh(c,PAL.dark,()=>c.arc(x,y,r,0,TAU));sh(c,'#e6b85c',()=>c.arc(x,y,r*.78,0,TAU),0);c.fillStyle=PAL.kangkong;for(let j=0;j<5;j++){c.beginPath();c.arc(x+Math.cos(j*1.3)*r*.45,y+Math.sin(j*1.3)*r*.45,r*.09,0,TAU);c.fill();}return;}
    const left=it.kind==='ulam'?G.cooked[it.k].left:1;const D=DISH[it.k]||{col:PAL.sinigang,bit:PAL.kangkong};const col=D.col;
    sh(c,PAL.potRim,()=>c.arc(x,y,r,0,TAU));
    if(left>0){sh(c,col,()=>c.arc(x,y,r*.8,0,TAU),0);c.fillStyle=D.bit;for(let j=0;j<4;j++){const a=j*1.7+x;c.beginPath();c.arc(x+Math.cos(a)*r*.4,y+Math.sin(a)*r*.4,r*.15,0,TAU);c.fill();}}
    else sh(c,PAL.pot,()=>c.arc(x,y,r*.8,0,TAU),0);}
  function scoopBlob(c,k,x,y,s=1){
    if(k==='rice'||k==='sinangag'){sh(c,k==='rice'?PAL.white:'#e6b85c',()=>c.ellipse(x,y,22*s,15*s,0,0,TAU));if(k==='sinangag'){c.fillStyle=PAL.kangkong;for(let j=0;j<4;j++){c.beginPath();c.arc(x-10*s+j*7*s,y-2*s+(j%2)*5*s,2*s,0,TAU);c.fill();}}else{c.fillStyle=PAL.riceShade;c.beginPath();c.ellipse(x-5*s,y-5*s,8*s,4*s,0,0,TAU);c.fill();}return;}
    if(k==='sabaw'){sh(c,PAL.sinigang,()=>c.ellipse(x,y,16*s,9*s,0,0,TAU));return;}
    const D=DISH[k];
    if(D.fish){sh(c,D.col,()=>{c.moveTo(x+22*s,y);c.lineTo(x+36*s,y-12*s);c.lineTo(x+36*s,y+12*s);c.closePath();});sh(c,D.col,()=>c.ellipse(x-4*s,y,28*s,13*s,0,0,TAU));c.fillStyle=INK;c.beginPath();c.arc(x-22*s,y-3*s,2.5*s,0,TAU);c.fill();return;}
    sh(c,D.col,()=>c.ellipse(x,y,34*s,24*s,0,0,TAU));
    for(let j=0;j<4;j++)sh(c,D.bit,()=>c.ellipse(x-14*s+j*9*s,y-4*s+(j%2)*8*s,7*s,5*s,j,0,TAU),1.5);}
  function drawQuick(c){const q=S.qc;
    c.globalAlpha=.55;c.fillStyle='#000';c.fillRect(V.x0,V.y0,V.x1-V.x0,V.y1-V.y0);c.globalAlpha=1;
    if(q.phase==='menu'){sh(c,PAL.paper,()=>rr(c,24,120,312,90+dishes.length*58,16),4);
      txt(c,'MAGLUTO PA',180,156,22,'d',PAL.red,'center');txt(c,'Kalahating puhunan para sa 5 order pa',180,178,12,'b',PAL.muted,'center','700');
      dishes.forEach((d,i)=>{const r=RECIPES[d],y=194+i*58,half=Math.round(r.cost/2);sh(c,PAL.white,()=>rr(c,40,y,280,50,10),2.5);foodIcon(c,66,y+25,d,1.8);
        txt(c,r.name,92,y+22,13,'d',INK);txt(c,`${G.cooked[d].left/2} natitira`,92,y+40,11,'b',G.cooked[d].left<=4?PAL.red:PAL.muted,'left','800');
        button(c,'qc-'+d,236,y+11,76,28,peso(half),{size:13});});
      button(c,'qc-close',300,126,30,30,'×',{size:20,fill:PAL.white});return;}
    bgWood(c);const st=q.st;
    sh(c,PAL.white,()=>rr(c,14,14,332,62,14));txt(c,'MAGLUTO PA: '+RECIPES[q.k].short.toUpperCase(),28,42,16,'d',INK);txt(c,st.title,28,62,12,'b',INK,'left','600');
    q.mg.draw(c);
    c.font=`800 13px ${FONT.b}`;c.lineWidth=3;c.strokeStyle=INK;c.fillStyle=PAL.white;c.textAlign='center';c.lineJoin='round';wrapS(c,st.how,180,100,320,16);
    txtS(c,'Naghihintay ang mga customer!',180,600,13,'b',PAL.yellow,'center','800');
    button(c,'qc-close',308,28,30,30,'×',{size:20,fill:PAL.white});}
  function drawPlating(c){const p=S.pl,cu=p.c,o=cu.order;
    c.globalAlpha=.5;c.fillStyle='#000';c.fillRect(V.x0,V.y0,V.x1-V.x0,V.y1-V.y0);c.globalAlpha=1;
    sh(c,PAL.tileA,()=>rr(c,10,100,340,530,18),4);
    // customer + order
    c.save();c.beginPath();rr(c,18,108,64,118,10);c.clip();c.fillStyle=PAL.wall;c.fillRect(18,108,64,118);person(c,50,222,{...cu.look,angry:cu.pat<.28});c.restore();
    c.strokeStyle=INK;c.lineWidth=3;c.beginPath();rr(c,18,108,64,118,10);c.stroke();
    if(cu.suki)txtS(c,cu.suki.name,50,122,9,'b',PAL.yellow,'center','800');
    sh(c,PAL.white,()=>rr(c,90,108,218,118,12));
    c.font=`700 12px ${FONT.b}`;c.fillStyle=PAL.muted;c.textAlign='left';wrap(c,'"'+orderText(o)+'"',100,126,200,14);
    const chk=checkPlate(p,o),nm=d=>RECIPES[d].short;
    const lines=[[o.ul[0]===o.ul[1]?`1 ${nm(o.ul[0])} (buo)`:`½ ${nm(o.ul[0])} + ½ ${nm(o.ul[1])}`,chk.ul],
      [`${o.rice.length} ${RICE_NAME[o.rice[0]]}`,chk.rice],[o.sabaw?'May sabaw':'Walang sabaw',chk.sabaw]];
    lines.forEach(([t,st],i)=>{const y=172+i*19;
      if(st==='ok'){sh(c,PAL.green,()=>c.arc(108,y-4,7,0,TAU),2);c.strokeStyle=PAL.white;c.lineWidth=2.5;c.beginPath();c.moveTo(104,y-4);c.lineTo(107,y-1);c.lineTo(112,y-8);c.stroke();}
      else if(st==='bad'){sh(c,PAL.red,()=>c.arc(108,y-4,7,0,TAU),2);c.strokeStyle=PAL.white;c.lineWidth=2.5;c.beginPath();c.moveTo(105,y-7);c.lineTo(111,y-1);c.moveTo(111,y-7);c.lineTo(105,y-1);c.stroke();}
      else if(st==='part')sh(c,PAL.yellow,()=>c.arc(108,y-4,7,0,TAU),2);
      else sh(c,PAL.white,()=>rr(c,101,y-11,14,14,3),2);
      txt(c,t,122,y,13,'b',st==='bad'?PAL.red:INK,'left','800');});
    const col=cu.pat>.55?PAL.green:cu.pat>.28?PAL.yellow:PAL.red;sh(c,INK,()=>rr(c,18,232,324,8,4),0);sh(c,col,()=>rr(c,19,233,322*Math.max(.03,cu.pat),6,3),0);
    button(c,'pl-close',314,108,30,30,'×',{size:20,fill:PAL.white});
    // counter items
    sh(c,PAL.glass,()=>rr(c,16,248,328,86,10),2.5);
    for(const it of ITEMS){drawItem(c,it,it.x,it.y,ITEMS.length>7?17:ITEMS.length>5?20:24);
      const nar=ITEMS.length>6,lbl=it.kind==='ulam'?`${(nar?RECIPES[it.k].short.slice(0,4):RECIPES[it.k].short).toUpperCase()} ${G.cooked[it.k].left}`:it.k==='rice'?'KANIN':it.k==='sinangag'?(nar?'SINANG':'SINANGAG'):'SABAW';
      c.font=`800 9px ${FONT.b}`;const lw=c.measureText(lbl).width+10;sh(c,it.kind==='ulam'&&G.cooked[it.k].left===0?PAL.muted:PAL.red,()=>rr(c,it.x-lw/2,311,lw,15,3),2);txt(c,lbl,it.x,322,9,'b',PAL.white,'center','800');}
    txt(c,'I-tap para ilagay · I-tap sa plato para alisin',180,352,11,'b',PAL.muted,'center','800');
    // plate
    shadow(c,170,546,120,10);
    sh(c,PAL.white,()=>c.ellipse(170,452,128,88,0,0,TAU));sh(c,PAL.riceShade,()=>c.ellipse(170,452,108,72,0,0,TAU),0);
    const dashed=(x,y,rx,ry,l)=>{c.setLineDash([5,6]);c.strokeStyle=PAL.muted;c.lineWidth=2;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.stroke();c.setLineDash([]);txt(c,l,x,y+4,10,'b',PAL.muted,'center','800');};
    const sl=p.slots;
    if(sl[0]&&sl[0]===sl[1])scoopBlob(c,sl[0],170,422,1.5);
    else if(!sl[0]&&!sl[1])dashed(170,422,70,24,'ULAM');
    else{[[122,422],[218,422]].forEach(([x,y],i)=>{if(sl[i])scoopBlob(c,sl[i],x,y);else dashed(x,y,32,22,'½ ULAM');});
      c.setLineDash([4,5]);c.strokeStyle=PAL.muted;c.lineWidth=2;c.beginPath();c.moveTo(170,396);c.lineTo(170,448);c.stroke();c.setLineDash([]);}
    if(p.rice.length)p.rice.forEach((k,i)=>scoopBlob(c,k,170+(i-(p.rice.length-1)/2)*40,490));
    else dashed(170,490,24,16,'KANIN');
    sh(c,PAL.white,()=>c.ellipse(318,490,30,20,0,0,TAU));sh(c,PAL.riceShade,()=>c.ellipse(318,488,22,13,0,0,TAU),0);
    if(p.sabaw){scoopBlob(c,'sabaw',318,488,1.2);c.fillStyle=PAL.kangkong;c.fillRect(312,485,10,4);}else txt(c,'SABAW',318,492,8,'b',PAL.muted,'center','800');
    if(p.drag){const d=p.drag;c.save();c.translate(d.x,d.y);sh(c,PAL.woodLight,()=>rr(c,10,-36,8,44,4),2);sh(c,PAL.silver,()=>c.ellipse(0,0,22,15,0,0,TAU));c.restore();scoopBlob(c,d.it.k,d.x,d.y-3,.5);}
    button(c,'pl-ulit',22,568,110,48,'ULITIN',{size:15,fill:PAL.white});
    button(c,'pl-give',144,568,194,48,'IABOT  ✓',{size:18,fill:PAL.green,col:PAL.white});
  }
  S.draw=c=>{
    const ts=24;
    for(let y=96;y<176;y+=ts/2)for(let x=Math.floor(V.x0/12)*12;x<V.x1;x+=12){c.fillStyle=((x/12+y/12)%2+2)%2?'#cfd6dc':'#bcc5cc';c.fillRect(x,y,12,12);}
    for(let y=232;y<562;y+=ts)for(let x=Math.floor(V.x0/ts)*ts;x<V.x1;x+=ts){c.fillStyle=((x/ts+y/ts)%2+2)%2?PAL.tileA:PAL.tileB;c.fillRect(x,y,ts,ts);}
    c.fillStyle=PAL.tileA;c.fillRect(312,170,V.x1-312,66);c.fillRect(V.x0,170,26-V.x0,66);
    c.fillStyle=PAL.wall;c.fillRect(V.x0,V.y0,V.x1-V.x0,96-V.y0);c.fillStyle=PAL.wallDark;c.fillRect(V.x0,86,V.x1-V.x0,10);
    // wall decor
    const mx=116,my=24,mw=128,mh=Math.max(50,24+dishes.length*10);
    sh(c,PAL.white,()=>rr(c,mx,my,mw,mh,4));sh(c,PAL.red,()=>c.rect(mx,my,mw,13),0);c.strokeStyle=INK;c.lineWidth=3;c.beginPath();rr(c,mx,my,mw,mh,4);c.stroke();
    txt(c,'MENU',180,my+10.5,9,'b',PAL.white,'center','800');
    dishes.forEach((d,i)=>{const ry=my+23+i*10,fs=dishes.length>3?8:9;txt(c,RECIPES[d].name,mx+10,ry,fs,'b',INK,'left','800');txt(c,peso(RECIPES[d].price),mx+mw-8,ry,fs,'b',PAL.red,'right','800');});
    const fx=288,fy=62;sh(c,PAL.white,()=>c.arc(fx,fy,17,0,TAU));for(let i=0;i<3;i++){const a=S.t*18+i*TAU/3;sh(c,PAL.sh1,()=>c.ellipse(fx+Math.cos(a)*7.5,fy+Math.sin(a)*7.5,7,3.4,a,0,TAU),1.5);}sh(c,PAL.potDark,()=>c.arc(fx,fy,4,0,TAU),2);
    // kitchen: sink, rack, cooker, wok
    sh(c,PAL.silver,()=>rr(c,SINK.x-26,SINK.y-22,52,42,6));sh(c,PAL.potDark,()=>rr(c,SINK.x-19,SINK.y-15,38,28,5),2);
    sh(c,PAL.pot,()=>rr(c,SINK.x-3,SINK.y-30,6,12,2),2);sh(c,PAL.pot,()=>rr(c,SINK.x-3,SINK.y-30,14,5,2),2);
    if(S.busy>0&&S.washN){c.fillStyle='#fff';for(let i=0;i<5;i++){c.globalAlpha=.8;c.beginPath();c.arc(SINK.x-12+i*6+Math.sin(S.t*9+i)*3,SINK.y-4+Math.cos(S.t*7+i)*4,4,0,TAU);c.fill();}c.globalAlpha=1;}
    sh(c,PAL.woodDark,()=>rr(c,RACK.x-22,RACK.y+6,44,10,3),2);
    for(let i=0;i<S.rack;i++)sh(c,PAL.white,()=>c.ellipse(RACK.x,RACK.y+4-i*4,18,6,0,0,TAU),2);
    txt(c,`${S.rack}`,RACK.x+28,RACK.y+12,13,'d',S.rack?INK:PAL.red,'left');
    sh(c,PAL.white,()=>rr(c,186,108,38,34,10));sh(c,PAL.riceShade,()=>c.ellipse(205,113,15,6,0,0,TAU),2);
    sh(c,PAL.dark,()=>rr(c,236,112,52,30,4));sh(c,PAL.dark,()=>c.arc(262,118,16,0,TAU),2);sh(c,'#e6b85c',()=>c.arc(262,118,11,0,TAU),0);
    {const K=KALAN,low=dishes.some(d=>G.cooked[d].left<=4);sh(c,PAL.dark,()=>rr(c,K.x-24,K.y-14,48,32,4));
      for(let i=0;i<6;i++){const a=i/6*TAU+S.t*2;c.fillStyle=PAL.flame;c.beginPath();c.arc(K.x+Math.cos(a)*14,K.y+Math.sin(a)*9,3,0,TAU);c.fill();}
      sh(c,PAL.potRim,()=>c.arc(K.x,K.y-2,12,0,TAU));sh(c,PAL.pot,()=>c.arc(K.x,K.y-2,8,0,TAU),0);
      txt(c,'KALAN',K.x,K.y+30,8,'b',INK,'center','800');
      if(low&&!S.qc){const by=K.y-30+Math.sin(S.t*6)*3;sh(c,PAL.yellow,()=>c.arc(K.x,by,9,0,TAU),2);txt(c,'!',K.x,by+5,13,'d',INK,'center');}}
    // counter
    sh(c,PAL.wood,()=>rr(c,26,204,286,30,4));c.fillStyle=PAL.woodDark;c.fillRect(28,226,282,6);
    sh(c,PAL.frame,()=>rr(c,26,174,286,34,4));sh(c,PAL.glass,()=>rr(c,30,178,278,26,2),2);
    const want=new Set(S.custs.filter(c=>c.state==='wait').flatMap(c=>c.order.ul));
    ITEMS.forEach(it=>{drawItem(c,it,it.cx,191,12);
      if(it.kind==='ulam'){c.font=`800 9px ${FONT.b}`;const lbl=ITEMS.length>6?`${G.cooked[it.k].left}`:`${RECIPES[it.k].short.toUpperCase()} ${G.cooked[it.k].left}`;const lw=c.measureText(lbl).width+10;
        sh(c,G.cooked[it.k].left?PAL.red:PAL.muted,()=>rr(c,it.cx-lw/2,211,lw,14,3),2);txt(c,lbl,it.cx,221,9,'b',PAL.white,'center','800');}});
    // outside
    c.fillStyle=PAL.sidewalk;c.fillRect(V.x0,562,V.x1-V.x0,12);c.fillStyle=PAL.street;c.fillRect(V.x0,574,V.x1-V.x0,V.y1-574);
    c.fillStyle=PAL.line;for(let x=Math.floor(V.x0/40)*40;x<V.x1;x+=40)c.fillRect(x,612,22,3);
    sh(c,PAL.red,()=>rr(c,150,548,60,14,3),2);
    if(V.x0<-30){sh(c,PAL.red,()=>rr(c,-56,520,32,30,4));sh(c,PAL.plant,()=>c.arc(-40,508,20,0,TAU));}
    if(V.x1>W+30){sh(c,PAL.red,()=>rr(c,W+24,520,32,30,4));sh(c,PAL.plant,()=>c.arc(W+40,508,20,0,TAU));}
    // entities
    const ents=[];
    for(const t of S.tables)ents.push({y:t.y+18,d:()=>{const w=64,h=36;shadow(c,t.x,t.y+22,34,6);
      c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.moveTo(t.x-w/2+6,t.y+h/2);c.lineTo(t.x-w/2+6,t.y+h/2+8);c.moveTo(t.x+w/2-6,t.y+h/2);c.lineTo(t.x+w/2-6,t.y+h/2+8);c.stroke();
      sh(c,PAL.white,()=>rr(c,t.x-w/2,t.y-h/2,w,h,4));c.strokeStyle=PAL.red;c.lineWidth=2;c.globalAlpha=.5;
      for(let i=1;i<4;i++){c.beginPath();c.moveTo(t.x-w/2+i*w/4,t.y-h/2+2);c.lineTo(t.x-w/2+i*w/4,t.y+h/2-2);c.stroke();}c.beginPath();c.moveTo(t.x-w/2+2,t.y);c.lineTo(t.x+w/2-2,t.y);c.stroke();c.globalAlpha=1;
      c.strokeStyle=INK;c.lineWidth=3;c.beginPath();rr(c,t.x-w/2,t.y-h/2,w,h,4);c.stroke();
      for(const s of S.seats){if(s.t!==t)continue;const px=t.x+s.side*16,py=t.y;
        if(s.occ&&s.occ.state==='eat')foodIcon(c,px,py,s.occ.dish);
        else if(s.plate){sh(c,PAL.white,()=>c.ellipse(px,py+1,10,6,0,0,TAU),2);c.fillStyle=PAL.adobo;c.beginPath();c.arc(px-3,py,1.5,0,TAU);c.arc(px+2,py+2,1.3,0,TAU);c.arc(px+4,py-1,1.2,0,TAU);c.fill();
          c.fillStyle=INK;for(let f=0;f<2;f++){const a=S.t*(5+f*2)+f*3;c.beginPath();c.arc(px+Math.cos(a)*12,py-10+Math.sin(a*1.3)*6,1.8,0,TAU);c.fill();}}}}});
    for(const cu of S.custs){const back=cu.state==='wait'||cu.state==='plating'||(cu.moving&&cu.vy<-Math.abs(cu.vx)*.6);
      ents.push({y:cu.y,d:()=>{person(c,cu.x,cu.y,{...cu.look,seated:cu.state==='eat',back,angry:cu.angry,step:cu.moving?Math.sin(cu.ph):0,bob:cu.moving?-Math.abs(Math.sin(cu.ph))*2:Math.sin(S.t*2+cu.ph)});
        if(cu.state==='toSeat')foodIcon(c,cu.x,cu.y-22,cu.dish,1.1);}});}
    const P=S.P;
    ents.push({y:P.y,d:()=>person(c,P.x,P.y,{...APO,back:P.moving&&P.vy<-Math.abs(P.vx)*.6,step:P.moving?Math.sin(P.ph):0,bob:P.moving?-Math.abs(Math.sin(P.ph))*2:(S.busy>0?Math.sin(S.t*20)*2:0)})});
    if(NN){const N=NN;ents.push({y:N.y,d:()=>{person(c,N.x,N.y,{...NENE,back:N.moving&&N.vy<-Math.abs(N.vx)*.6,step:N.moving?Math.sin(N.ph):0,bob:N.moving?-Math.abs(Math.sin(N.ph))*2:(N.busy>0?Math.sin(S.t*20)*2:0)});
      for(let i=0;i<N.carry;i++)sh(c,PAL.white,()=>c.ellipse(N.x,N.y-60-i*4,12,4,0,0,TAU),2);
      c.font=`800 8px ${FONT.b}`;sh(c,PAL.sh6,()=>rr(c,N.x-16,N.y+4,32,12,6),2);txt(c,'Nene',N.x,N.y+13,8,'b',PAL.white,'center','800');}});}
    ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
    if(S.marker){const m=S.marker;c.globalAlpha=1-m.t/.5;c.strokeStyle=PAL.white;c.lineWidth=3;c.beginPath();c.ellipse(m.x,m.y,8+m.t*30,4+m.t*15,0,0,TAU);c.stroke();c.globalAlpha=1;}
    if(S.carry>0){for(let i=0;i<S.carry;i++)sh(c,PAL.white,()=>c.ellipse(P.x,P.y-62-i*4,14,5,0,0,TAU),2);txtS(c,`×${S.carry}`,P.x+24,P.y-58,12,'b',PAL.white,'left','800');}
    else{const ty=P.y-68+Math.sin(S.t*4)*3;sh(c,PAL.yellow,()=>{c.moveTo(P.x-7,ty);c.lineTo(P.x+7,ty);c.lineTo(P.x,ty+9);c.closePath();},2);}
    for(const cu of S.custs){
      if(cu.state==='wait')orderBubble(c,cu.x,cu.y-78,cu.order,cu.pat);
      if(cu.suki&&cu.state!=='out'){c.font=`800 9px ${FONT.b}`;const tw=c.measureText(cu.suki.name).width+18;sh(c,PAL.red,()=>rr(c,cu.x-tw/2,cu.y+4,tw,14,7),2);
        txt(c,cu.suki.name,cu.x+5,cu.y+14,9,'b',PAL.white,'center','800');heart(c,cu.x-tw/2+8,cu.y+11,.45,PAL.white);}}
    if(S.pl)drawPlating(c);
    for(const p of S.pops){c.globalAlpha=Math.max(0,1-p.age/p.dur);if(p.size<14){c.font=`800 ${p.size}px ${FONT.b}`;c.lineWidth=4;c.strokeStyle=INK;c.fillStyle=p.col;c.textAlign='center';c.lineJoin='round';wrapS(c,p.t,clamp(p.x,90,270),p.y-p.age*24,170,15);}
      else txtS(c,p.t,clamp(p.x,40,320),p.y-p.age*24,p.size,'d',p.col);}c.globalAlpha=1;
    // HUD
    const mins=11*60+Math.min(S.t,S.dur)/S.dur*180,hh=Math.floor(mins/60),mm=Math.floor(mins%60);
    const tl=`ARAW ${G.day} · ${((hh+11)%12)+1}:${String(mm).padStart(2,'0')} ${hh>=12?'PM':'AM'}`;
    c.font=`800 11px ${FONT.b}`;const tw=c.measureText(tl).width+20,hx=Math.max(V.x0+10,-60);
    sh(c,PAL.white,()=>rr(c,hx,8,tw,24,12),2.5);txt(c,tl,hx+10,24,11,'b',INK,'left','800');
    sh(c,INK,()=>rr(c,hx,36,tw,6,3),0);sh(c,PAL.yellow,()=>rr(c,hx+1,37,(tw-2)*Math.min(1,S.t/S.dur),4,2),0);
    const mt=peso(G.money);c.font=`15px ${FONT.d}`;const mw2=c.measureText(mt).width+22,rx=Math.min(V.x1-10,W+60)-mw2;
    sh(c,PAL.yellow,()=>rr(c,rx,8,mw2,24,12),2.5);txt(c,mt,rx+mw2/2,26,15,'d',INK,'center');
    const tip=tipText();
    if(tip){c.globalAlpha=.85;sh(c,INK,()=>rr(c,16,584,328,36,10),0);c.globalAlpha=1;c.font=`800 12px ${FONT.b}`;c.fillStyle=PAL.white;c.textAlign='center';wrap(c,tip,180,606,310,14);}
    if(S.qc)drawQuick(c);
    if(S.ended){c.globalAlpha=Math.min(.55,S.endT);c.fillStyle='#000';c.fillRect(V.x0,V.y0,V.x1-V.x0,V.y1-V.y0);c.globalAlpha=1;
      const s=Math.min(1,S.endT*3);c.save();c.translate(180,300);c.scale(s,s);sh(c,PAL.yellow,()=>rr(c,-140,-50,280,100,18),4);txt(c,S.endMsg,0,12,30,'d',PAL.red,'center');c.restore();}
  };
  S.dbg={ITEMS,place,give,openPlate};
  return S;
}

