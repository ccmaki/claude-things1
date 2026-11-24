'use strict';
/* Scenes: title, morning notebook, cooking. */
/* ---------- scenes ---------- */
let scene=null;
function go(s){scene=s;btns=[];}

function makeTitle(){
  const S={t:0};
  S.update=dt=>{S.t+=dt;S.confirm=Math.max(0,S.confirm-dt);};
  S.confirm=0;
  S.onBtn=id=>{if(id==='start')go(makeMorning());if(id==='snd')soundOn=!soundOn;
    if(id==='new'){if(S.confirm>0){resetGame();S.confirm=0;SFX.good();}else S.confirm=3;}};
  S.draw=c=>{
    c.fillStyle=PAL.wall;c.fillRect(V.x0,V.y0,V.x1-V.x0,V.y1-V.y0);
    c.fillStyle=PAL.wallDark;c.fillRect(V.x0,452,V.x1-V.x0,V.y1-452);
    const aw=Math.ceil((V.x1-V.x0)/40)+1;
    for(let i=0;i<aw;i++){const x=V.x0+i*40;sh(c,i%2?PAL.white:PAL.red,()=>{c.moveTo(x,40);c.lineTo(x+40,40);c.lineTo(x+40,96);c.arc(x+20,96,20,0,Math.PI);c.closePath();},2.5);}
    c.fillStyle=PAL.ink;c.fillRect(V.x0,30,V.x1-V.x0,12);
    sh(c,PAL.yellow,()=>rr(c,26,128,308,112,14),4);
    txt(c,'KARINDERYA',180,190,36,'d',PAL.red,'center');
    txt(c,'ni Lola',180,226,38,'h',INK,'center','600');
    c.save();c.translate(180,396);c.scale(2.3,2.3);person(c,0,0,{...APO,bob:Math.sin(S.t*2)*1.2});c.restore();
    sh(c,PAL.wood,()=>rr(c,V.x0-10,388,V.x1-V.x0+20,70,0));
    c.fillStyle=PAL.woodDark;c.fillRect(V.x0,446,V.x1-V.x0,8);
    [[86,PAL.adobo],[274,PAL.torta]].forEach(([x,col])=>{sh(c,PAL.potRim,()=>c.ellipse(x,392,40,14,0,0,TAU));sh(c,col,()=>c.ellipse(x,392,32,10,0,0,TAU),0);
      for(let i=0;i<3;i++){const ph=(S.t*.6+i/3)%1;c.globalAlpha=(1-ph)*.5;c.fillStyle='#fff';c.beginPath();c.arc(x+Math.sin(ph*6+i)*8,380-ph*60,8+ph*8,0,TAU);c.fill();}c.globalAlpha=1;});
    paperBox(c,24,468,312,96,null);
    c.fillStyle=INK;c.font=`600 22px ${FONT.h}`;c.textAlign='left';wrap(c,'Iniwan sa\'yo ni Lola ang karinderya at ang notebook niya. Ituloy mo ang luto niya, apo.',38,494,286,20);
    const prog=G.day>1||Object.keys(G.cooked).length>0;
    button(c,'start',60,578,240,52,prog?`ITULOY · ARAW ${G.day}`:'SIMULAN',{size:prog?17:20});
    button(c,'snd',V.x1-104,V.y0+52>0?8:8,92,26,soundOn?'TUNOG: ON':'TUNOG: OFF',{size:10,fill:PAL.white});
    if(prog)button(c,'new',Math.max(V.x0,0)+12,8,110,26,S.confirm>0?'SIGURADO?':'BAGONG LARO',{size:10,fill:S.confirm>0?PAL.red:PAL.white,col:S.confirm>0?PAL.white:INK});
    else txt(c,'PROTOTYPE',V.x0+14,26,11,'b',PAL.white,'left','800');
  };
  return S;
}

function makeMorning(){
  saveGame();
  const S={t:0};
  S.update=dt=>{S.t+=dt;};
  S.onBtn=id=>{
    if(id.startsWith('cook-')){const k=id.slice(5);G.money-=RECIPES[k].cost;G.todayCost+=RECIPES[k].cost;go(makeCook(k));}
    if(id==='open')go(makeRush());};
  S.draw=c=>{
    bgWood(c);
    sh(c,PAL.paper,()=>rr(c,16,16,328,608,10),4);
    c.strokeStyle=PAL.paperLine;c.lineWidth=1.5;for(let y=112;y<612;y+=22){c.beginPath();c.moveTo(24,y);c.lineTo(336,y);c.stroke();}
    c.strokeStyle=PAL.red;c.beginPath();c.moveTo(42,20);c.lineTo(42,620);c.stroke();
    txt(c,`ARAW ${G.day}`,54,62,28,'d',INK);
    txt(c,'Ano\'ng lulutuin natin ngayon, apo?',54,94,23,'h',INK,'left','600');
    const mt=peso(G.money);c.font=`16px ${FONT.d}`;const mw=c.measureText(mt).width+24;sh(c,PAL.yellow,()=>rr(c,330-mw,36,mw,30,15),2.5);txt(c,mt,330-mw/2,57,16,'d',INK,'center');
    const nCooked=Object.keys(G.cooked).length,full=nCooked>=maxKaldero();
    txt(c,`KALDERO ${nCooked}/${maxKaldero()}`,54,116,11,'b',full?PAL.red:PAL.muted,'left','800');
    let y=124;
    for(const k in RECIPES){const r=RECIPES[k],done=G.cooked[k];
      if(r.unlock>G.day){sh(c,PAL.riceShade,()=>rr(c,52,y,280,44,12),2);lockIcon(c,76,y+26);txt(c,r.name,96,y+20,13,'d',PAL.muted);txt(c,`Mabubuksan sa Araw ${r.unlock}`,96,y+36,11,'b',PAL.muted,'left','600');y+=52;continue;}
      sh(c,PAL.white,()=>rr(c,52,y,280,66,12),2.5);
      foodIcon(c,80,y+33,k,2);
      txt(c,r.name,106,y+24,14,'d',INK);
      txt(c,`${peso(r.price)} · puhunan ${peso(r.cost)}`,106,y+42,11,'b',INK,'left','600');
      if(r.unlock===G.day&&G.day>1&&!done){sh(c,PAL.red,()=>rr(c,262,y-8,56,16,8),2);txt(c,'BAGO!',290,y+4,10,'b',PAL.white,'center','800');}
      if(done){stars(c,294,y+46,7,done.stars,16);txt(c,`${done.left/2} servings`,106,y+58,11,'b',PAL.green,'left','800');}
      else{txt(c,`${r.steps.length} hakbang`,106,y+58,11,'b',PAL.muted,'left','600');button(c,'cook-'+k,246,y+32,78,26,'LUTUIN',{size:13,disabled:full});}
      y+=74;}
    for(const n of LOCKED){sh(c,PAL.riceShade,()=>rr(c,52,y,280,44,12),2);lockIcon(c,76,y+26);txt(c,n,96,y+20,13,'d',PAL.muted);txt(c,'Malapit na sa notebook',96,y+36,11,'b',PAL.muted,'left','600');y+=52;}
    const any=Object.keys(G.cooked).length>0;
    button(c,'open',52,560,280,50,'BUKSAN ANG KARINDERYA',{size:15,disabled:!any,fill:PAL.red,col:PAL.white});
  };
  return S;
}

function makeCook(key){
  const r=RECIPES[key];
  const S={key,r,idx:0,phase:'intro',scores:[],mg:null,t:0,stepScore:0,stars:0};
  function advance(){S.idx++;S.t=0;if(S.idx<r.steps.length)S.phase='intro';else finish();}
  function finish(){const a=avg(S.scores);S.stars=a>=.85?3:a>=.6?2:1;G.cooked[key]={stars:S.stars,left:r.servings*2,total:r.servings*2};saveGame();S.phase='final';S.t=0;SFX.win();}
  S.update=dt=>{S.t+=dt;if(S.phase==='play'){S.mg.update(dt);if(S.mg.done){S.stepScore=S.mg.score();S.scores.push(S.stepScore);S.phase='result';S.t=0;}}
    else if(S.phase==='result'&&S.t>1.6)advance();};
  S.down=p=>{if(S.phase==='intro'&&S.t>.25){S.phase='play';S.mg=MG[r.steps[S.idx].type](r.steps[S.idx]);S.t=0;SFX.tap();}
    else if(S.phase==='play'){S.mg.down&&S.mg.down(p);}
    else if(S.phase==='result'&&S.t>.5)advance();};
  S.move=p=>{if(S.phase==='play'&&S.mg.move)S.mg.move(p);};
  S.up=p=>{if(S.phase==='play'&&S.mg.up)S.mg.up(p);};
  S.onBtn=id=>{if(id==='back')go(makeMorning());};
  S.draw=c=>{
    bgWood(c);
    const n=r.steps.length,st=r.steps[Math.min(S.idx,n-1)];
    if(S.phase!=='final'){
      sh(c,PAL.white,()=>rr(c,14,14,332,62,14));
      txt(c,r.name.toUpperCase(),28,42,17,'d',INK);
      txt(c,`Hakbang ${Math.min(S.idx+1,n)}/${n} · ${st.title}`,28,62,12,'b',INK,'left','600');
      for(let i=0;i<n;i++){const done=i<S.scores.length;sh(c,done?PAL.green:i===S.idx?PAL.yellow:PAL.riceShade,()=>c.arc(330-(n-1-i)*16,32,5.5,0,TAU),2);}
    }
    if(S.phase==='play'||S.phase==='result'){
      S.mg.draw(c);
      c.font=`800 13px ${FONT.b}`;c.lineWidth=3;c.strokeStyle=INK;c.fillStyle=PAL.white;c.textAlign='center';c.lineJoin='round';wrapS(c,st.how,180,100,320,16);
    }
    if(S.phase==='intro'){
      sh(c,PAL.paper,()=>rr(c,30,150,300,300,18),4);
      txt(c,`HAKBANG ${S.idx+1} NG ${n}`,180,192,13,'b',PAL.red,'center','800');
      c.font=`24px ${FONT.d}`;c.fillStyle=INK;c.textAlign='center';const ey=wrap(c,st.title,180,232,260,28);
      c.font=`600 16px ${FONT.b}`;c.fillStyle=INK;wrap(c,st.how,180,ey+40,250,22);
      const a=.55+.45*Math.sin(S.t*5);c.globalAlpha=a;txt(c,'I-TAP PARA MAGSIMULA',180,424,14,'d',PAL.red,'center');c.globalAlpha=1;
    }
    if(S.phase==='result'){
      const s=S.stepScore,ns=s>=.85?3:s>=.6?2:1;
      sh(c,PAL.white,()=>rr(c,70,236,220,120,16),4);
      txt(c,ns===3?'MAGALING!':ns===2?'PWEDE NA':'HMM...',180,276,22,'d',INK,'center');
      stars(c,180,312,15,ns,40);
      txt(c,'I-tap para tumuloy',180,344,12,'b',PAL.muted,'center','600');
    }
    if(S.phase!=='final'){
      const tip=(S.phase==='play'&&S.mg.tip&&S.mg.tip())||st.tip;
      paperBox(c,14,H-90,332,76,'NOTEBOOK NI LOLA');
      c.fillStyle=INK;c.font=`600 22px ${FONT.h}`;c.textAlign='left';wrap(c,tip,48,H-48,288,20);
    }
    if(S.phase==='final'){
      sh(c,PAL.paper,()=>rr(c,24,60,312,520,18),4);
      txt(c,'LUTO NA!',180,112,30,'d',PAL.red,'center');
      foodIcon(c,180,200,key,6);
      txt(c,r.name,180,282,22,'d',INK,'center');
      stars(c,180,330,22,S.stars,56);
      txt(c,`${r.servings} servings sa kaldero`,180,382,15,'b',INK,'center','800');
      txt(c,S.stars===3?'+₱10 tip bawat order':S.stars===2?'+₱5 tip bawat order':'Walang tip, pero bibili pa rin sila',180,404,13,'b',PAL.muted,'center','600');
      c.fillStyle=INK;c.font=`600 25px ${FONT.h}`;c.textAlign='center';
      wrap(c,S.stars===3?'"Parang luto ko na \'yan, apo."':S.stars===2?'"Malapit na. Pasensya lang."':'"Okay lang, apo. Bukas ulit."',180,450,260,24);
      txt(c,'Lola',180,500,14,'b',PAL.muted,'center','800');
      button(c,'back',60,516,240,48,'BALIK SA NOTEBOOK',{size:15});
    }
  };
  return S;
}

