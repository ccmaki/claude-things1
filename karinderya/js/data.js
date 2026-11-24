'use strict';
/* Recipes, upgrades, game state, save/load. */
/* ---------- game data ---------- */
const DISH={adobo:{col:'#6b3a1e',bit:'#d9905d'},torta:{col:'#e8b84a',bit:'#9a6a1e'},sinigang:{col:'#d8c77a',bit:'#4f9d48'},
  isda:{col:'#8a97a3',bit:'#c98a4b',fish:true},menudo:{col:'#c4482a',bit:'#f2c14e'}};
const UPGRADES=[
  {id:'plates',name:'Dagdag na plato',desc:'+2 malinis na plato sa rack',costs:[300,500,800]},
  {id:'tray',name:'Mas malaking bandehado',desc:'+2 platong kayang buhatin',costs:[250,500]},
  {id:'fan',name:'Bagong electric fan',desc:'Mas matiyaga ang mga customer',costs:[400,800]},
  {id:'shoes',name:'Bagong tsinelas',desc:'Mas mabilis kang maglakad',costs:[300,600]},
  {id:'kaldero',name:'Dagdag na kaldero',desc:'+1 ulam na pwedeng lutuin',costs:[800,1500]},
  {id:'sister',name:'Si Nene, ang bunso',desc:'Kukunin at huhugasan niya ang plato',costs:[1200,900],day:3,lv2:'Mas mabilis si Nene'}];
const UP=id=>(G.up&&G.up[id])||0;
const maxKaldero=()=>3+UP('kaldero'),carryMax=()=>6+2*UP('tray'),plateCount=()=>6+2*UP('plates');
const RECIPES={
  adobo:{name:'Adobong Manok',short:'adobo',price:60,cost:300,servings:10,unlock:1,steps:[
    {type:'chop',title:'Hiwain ang bawang',how:'I-tap kapag nasa dilaw na linya ang kutsilyo.',tip:'Pino ang hiwa, apo, para lumabas ang bango.'},
    {type:'flip',title:'Prituhin ang manok',how:'I-tap para baligtarin kapag nasa berde ang init.',tip:'Hintayin mag-golden bago baligtarin.',item:'chicken',n:3,rate:.45,pan:'kawali'},
    {type:'pour',title:'Ibuhos ang toyo at suka',how:'Pindutin nang matagal para magbuhos. Bitawan sa berdeng guhit.',tip:'Una ang toyo, saka ang suka. Huwag sobra.',contents:'chicken',
      liquids:[{name:'TOYO',col:'#2a1610',bottle:'#1b2430',band:[.36,.48]},{name:'SUKA',col:'#d9c9a0',bottle:'#e9f3f3',band:[.72,.84]}]},
    {type:'stir',title:'Pakuluan at haluin',how:'I-drag nang pabilog sa kaldero. Huwag masyadong mabilis.',tip:'Dahan-dahan, pabilog. Hayaang kumapit ang sarsa.',pot:'adobo'}]},
  torta:{name:'Tortang Talong',short:'torta',price:45,cost:200,servings:10,unlock:1,steps:[
    {type:'flip',title:'Ihawin ang talong',how:'I-tap para ikutin kapag sunog na ang balat, bago maging abo.',tip:'Sunugin ang balat, hindi ang laman.',item:'eggplant',n:3,rate:.5,pan:'grill'},
    {type:'mash',title:'Pitpitin ang talong',how:'I-tap nang mabilis para pitpitin gamit ang tinidor.',tip:'Pitpitin hanggang lumapad, parang pamaypay.'},
    {type:'flip',title:'Iprito sa itlog',how:'Baligtarin kapag golden na ang ilalim.',tip:'Mahinang apoy lang sa itlog, apo.',item:'torta',n:2,rate:.4,pan:'kawali'}]},
  sinigang:{name:'Sinigang na Baboy',short:'sinigang',price:75,cost:350,servings:10,unlock:2,steps:[
    {type:'chop',item:'tomato',title:'Hiwain ang kamatis',how:'I-tap kapag nasa dilaw na linya ang kutsilyo.',tip:'Hiwain nang pakuwarto ang kamatis.'},
    {type:'pour',title:'Ilagay ang sampalok',how:'Pindutin nang matagal. Bitawan sa berdeng guhit para tama ang asim.',tip:'Tikman mo, apo. Asim na tama lang.',contents:'pork',
      liquids:[{name:'ASIM',col:'#b9a24a',bottle:'#7a9a3a',band:[.55,.67]}]},
    {type:'stir',title:'Pakuluan kasama ang kangkong',how:'I-drag nang pabilog sa kaldero. Huwag masyadong mabilis.',tip:'Huli ang kangkong para hindi malata.',pot:'sinigang'}]},
  isda:{name:'Pritong Galunggong',short:'isda',price:50,cost:220,servings:10,unlock:3,steps:[
    {type:'mash',item:'fish',title:'Kuskusin ng asin',how:'I-tap nang mabilis para maasinan ang isda.',tip:'Asin sa labas at loob, apo.'},
    {type:'flip',title:'Iprito ang isda',how:'I-tap para baligtarin kapag malutong na.',tip:'Mainit na mantika para malutong.',item:'fish',n:3,rate:.5,pan:'kawali'}]},
  menudo:{name:'Menudo',short:'menudo',price:65,cost:320,servings:10,unlock:4,steps:[
    {type:'chop',item:'potato',title:'Hiwain ang patatas at karot',how:'I-tap kapag nasa dilaw na linya ang kutsilyo.',tip:'Pare-pareho ang laki para sabay maluto.'},
    {type:'pour',title:'Ibuhos ang tomato sauce',how:'Pindutin nang matagal. Bitawan sa berdeng guhit.',tip:'Huwag sobra sa sarsa, apo.',contents:'pork',
      liquids:[{name:'SARSA',col:'#b8321e',bottle:'#b8321e',band:[.5,.62]}]},
    {type:'stir',title:'Pakuluan at haluin',how:'I-drag nang pabilog sa kaldero. Huwag masyadong mabilis.',tip:'Hintaying lumambot ang patatas.',pot:'menudo'}]}
};
const LOCKED=['Kare-kare'];
const G={day:1,money:500,cooked:{},todayCost:0,
  suki:[{id:'kanor',name:'Mang Kanor',fav:'adobo',hearts:0,look:{shirt:PAL.sh1,skin:PAL.skin2,hair:PAL.hair,cap:true},line:'Sarap! Parang luto ng Lola mo.'},
        {id:'bebang',name:'Aling Bebang',fav:'torta',hearts:0,look:{shirt:PAL.sh5,skin:PAL.skin3,hair:PAL.grayhair},line:'Salamat, anak! Suki na ako dito.'}]};
const LOOKS=[[PAL.sh2,PAL.skin1,PAL.hair],[PAL.sh3,PAL.skin2,PAL.hair2],[PAL.sh4,PAL.skin3,PAL.hair],[PAL.sh6,PAL.skin1,PAL.hair2],[PAL.green,PAL.skin2,PAL.hair],[PAL.sh1,PAL.skin3,PAL.grayhair],[PAL.red,PAL.skin1,PAL.hair]];
const APO={shirt:PAL.yellow,skin:PAL.skin1,hair:PAL.hair,apron:true,band:true};
const NENE={shirt:PAL.sh6,skin:PAL.skin3,hair:PAL.hair,apron:true,pony:true};
G.up={};
/* ---------- save ---------- */
const SAVE_KEY='karinderya-ni-lola-v1';
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({day:G.day,money:G.money,cooked:G.cooked,todayCost:G.todayCost,up:G.up,hearts:G.suki.map(s=>s.hearts)}));}catch(e){}}
function loadGame(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!d||!d.day)return false;
  Object.assign(G,{day:d.day,money:d.money,cooked:d.cooked||{},todayCost:d.todayCost||0,up:d.up||{}});(d.hearts||[]).forEach((h,i)=>{if(G.suki[i])G.suki[i].hearts=h;});return true;}catch(e){return false;}}
function resetGame(){Object.assign(G,{day:1,money:500,cooked:{},todayCost:0,up:{}});G.suki.forEach(s=>s.hearts=0);try{localStorage.removeItem(SAVE_KEY);}catch(e){}}

