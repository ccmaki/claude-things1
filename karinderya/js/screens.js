'use strict';
/* Evening tally and upgrade shop. */
function makeEvening(st){
  const left=Object.values(G.cooked).reduce((a,v)=>a+v.left,0)/2;
  const cost=G.todayCost,profit=st.earn-cost,day=G.day;
  G.day++;G.cooked={};G.todayCost=0;saveGame();
  const S={t:0};
  S.update=dt=>{S.t+=dt;};
  S.onBtn=id=>{if(id==='next')go(makeMorning());if(id==='shop')go(makeShop(S));};
  S.draw=c=>{
    c.fillStyle=PAL.night;c.fillRect(V.x0,V.y0,V.x1-V.x0,V.y1-V.y0);
    c.fillStyle='#fff';for(let i=0;i<30;i++){const x=V.x0+((i*137)%Math.max(1,V.x1-V.x0)),y=V.y0+((i*71)%60)+10;c.globalAlpha=.4+.4*Math.sin(S.t*2+i);c.fillRect(x,y,2,2);}c.globalAlpha=1;
    sh(c,PAL.paper,()=>rr(c,20,30,320,580,14),4);
    txt(c,`ARAW ${day}`,180,78,30,'d',INK,'center');
    txt(c,'Tapos na ang araw!',180,106,25,'h',INK,'center','600');
    const rows=[['Benta',peso(st.earn)],['Puhunan',`−${peso(cost)}`],['Tubo',`${profit<0?'−':''}${peso(Math.abs(profit))}`,profit>=0?PAL.green:PAL.red],null,
      ['Tamang order',st.served],['Mali ang order',st.wrong,st.wrong?PAL.red:INK],['Nainip at umalis',st.lost,st.lost?PAL.red:INK],
      ['Sinangag / extra rice',`${st.sinangag} / ${st.extra}`],['Platong hinugasan',st.washed],['Niluto ulit',st.recooked],['Tira sa kaldero',`${left} servings`]];
    let y=134;for(const r of rows){if(!r){c.strokeStyle=PAL.paperLine;c.lineWidth=2;c.beginPath();c.moveTo(44,y-8);c.lineTo(316,y-8);c.stroke();y+=8;continue;}
      txt(c,r[0],44,y,15,'b',INK,'left','600');txt(c,String(r[1]),316,y,15,'b',r[2]||INK,'right','800');y+=22;}
    y+=6;txt(c,'MGA SUKI',44,y,11,'b',PAL.red,'left','800');y+=24;
    for(const s of G.suki){txt(c,s.name,44,y,15,'d',INK);for(let i=0;i<5;i++)heart(c,234+i*20,y-5,.7,i<s.hearts?PAL.red:PAL.riceShade);y+=26;}
    c.fillStyle=INK;c.font=`600 23px ${FONT.h}`;c.textAlign='center';
    const good=st.lost===0&&st.wrong===0&&st.served>0;
    wrap(c,good?'"Walang umalis na gutom, walang maling order. Proud ako sa\'yo."':st.served===0?'"Bukas, subukan natin ulit."':st.wrong>st.lost?'"Tingnan mabuti ang order, apo."':'"Bukas, bilisan pa natin, apo."',180,y+6,270,22);
    const canBuy=UPGRADES.some(u=>u.costs[UP(u.id)]!=null&&G.money>=u.costs[UP(u.id)]&&!(u.day&&G.day<u.day));
    button(c,'shop',50,494,260,40,canBuy?'MGA UPGRADE  ●':'MGA UPGRADE',{size:15,fill:PAL.white});
    button(c,'next',50,546,260,48,'SUSUNOD NA ARAW',{size:17,fill:PAL.red,col:PAL.white});
    txt(c,`Kabuuang pera: ${peso(G.money)}`,180,630,13,'b',PAL.white,'center','800');
  };
  return S;
}
function makeShop(back){
  const S={t:0,flash:null};
  S.update=dt=>{S.t+=dt;if(S.flash){S.flash.t+=dt;if(S.flash.t>1.4)S.flash=null;}};
  S.onBtn=id=>{if(id==='back'){go(back);return;}
    const u=UPGRADES.find(u=>'buy-'+u.id===id);if(!u)return;const lv=UP(u.id),cost=u.costs[lv];
    if(cost==null||G.money<cost||(u.day&&G.day<u.day)){SFX.bad();return;}
    G.money-=cost;G.up[u.id]=lv+1;saveGame();SFX.win();S.flash={t:0,txt:u.id==='sister'&&lv===0?'Kasama mo na si Nene!':'Na-upgrade!'};};
  S.draw=c=>{bgWood(c);
    sh(c,PAL.paper,()=>rr(c,16,16,328,608,10),4);
    txt(c,'MGA UPGRADE',36,60,24,'d',INK);
    const mt=peso(G.money);c.font=`16px ${FONT.d}`;const mw=c.measureText(mt).width+24;sh(c,PAL.yellow,()=>rr(c,330-mw,38,mw,30,15),2.5);txt(c,mt,330-mw/2,59,16,'d',INK,'center');
    txt(c,'Palaguin natin ang karinderya ni Lola.',36,90,21,'h',INK,'left','600');
    let y=104;
    for(const u of UPGRADES){const lv=UP(u.id),cost=u.costs[lv],max=cost==null,locked=u.day&&G.day<u.day;
      sh(c,PAL.white,()=>rr(c,28,y,304,70,12),2.5);
      if(u.id==='sister'){c.save();c.translate(54,y+62);c.scale(.8,.8);person(c,0,0,NENE);c.restore();}
      const tx=u.id==='sister'?80:40;
      txt(c,u.name,tx,y+24,13,'d',INK);
      txt(c,lv>=1&&u.lv2?u.lv2:u.desc,tx,y+42,11,'b',PAL.muted,'left','700');
      for(let i=0;i<u.costs.length;i++)sh(c,i<lv?PAL.green:PAL.riceShade,()=>c.arc(tx+6+i*16,y+56,5,0,TAU),2);
      button(c,'buy-'+u.id,236,y+20,88,30,max?'MAX':locked?`ARAW ${u.day}`:peso(cost),{size:13,disabled:max||locked||G.money<cost});
      y+=78;}
    button(c,'back',90,578,180,40,'BALIK',{size:16,fill:PAL.red,col:PAL.white});
    if(S.flash){c.globalAlpha=Math.max(0,1-S.flash.t/1.4);txtS(c,S.flash.txt,180,330-S.flash.t*20,24,'d',PAL.yellow);c.globalAlpha=1;}
  };
  return S;
}
