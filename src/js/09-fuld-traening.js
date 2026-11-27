/* Fuld træning (A opvarmning, B styrke, C WOD, D bonus) og Pas-rækker. */
/* ---------- Træn: start any session, any day ---------- */
/* Four headings cover all training: [title, colour kind, session keys] */
const restCustom=ar=>customKeys('mobilitet').filter(k=>(state.customSess[k].label==='Aktiv restitution')===ar);
const trainGroups=()=>[['Styrke','styrke',['A','B','C'].concat(customKeys('styrke'))],
  ['Kondition','interval',['I4','I5','I30','I30B'].concat(customKeys('interval'),['Z2','Z2L'],customKeys('zone2'))],
  ['CrossFit','crossfit',customKeys('crossfit')],
  ['Restitution','mobilitet',['MOB','BAL'].concat(restCustom(false),['AR1','AR2','AR3','AR4','AR5'],restCustom(true))]];
function trainRow(k){const se=SESS[k],t=sessKey(TODAY)===k;
  return `<button class="tr-row k-${se.kind}${t?' today':''}" data-act="trsess" data-key="${k}"><span class="bar"></span><span class="nm">${esc(se.name)}</span>${t?'<span class="tag">I dag</span>':''}<span class="chev">›</span></button>`}
/* Open groups in the Træn list; starts with the group that holds today's session */
function trOpen(){if(!ui.trOpen){const tk=sessKey(TODAY),g=tk==='CF'?['CrossFit']:trainGroups().find(([,,ks])=>ks.includes(tk));ui.trOpen=new Set(g?[g[0]]:[])}return ui.trOpen}
/* ---------- Fuld træning: A opvarmning · B styrke · C WOD · D bonus ----------
   Built from patterns in published CrossFit class programming:
   - Warm-up = a little cardio, 2 rounds of general drills, drills for the day's lift, then build-up sets.
   - Strength comes first while fresh (12-20 min): waves, ladders, 5-3-1, sets across, build to heavy, EMOM, clusters, complexes, supersets.
   - The WOD avoids loading the same pattern heavily again, and is shorter after a heavy strength part.
   - Bonus work is 2-3 accessory moves that balance the lift (single leg, hamstrings, pulling, core, carries). */
const FW_LIFTS=[
 ['bsq','Back squat','squat','Vægtstang',1],['fsq','Front squat','squat','Vægtstang',1],['psq','Pause back squat (2 sek i bunden)','squat','Vægtstang',1],['boxsq','Box squat','squat','Vægtstang',1],
 ['kbfsq','Dobbelt kettlebell front squat','squat','Kettlebell',0],['gob','Tung goblet squat','squat','Kettlebell',0],['pistol','Pistol squats (pr. ben)','squat','Ingen udstyr',0],
 ['dl','Dødløft','hinge','Vægtstang',1],['sumo','Sumo-dødløft','hinge','Vægtstang',1],['rdl','Rumænsk dødløft','hinge','Vægtstang',1],
 ['kbrdl','Kettlebell single-leg RDL (pr. ben)','hinge','Kettlebell',0],['kbsw','Tunge kettlebell swings','hinge','Kettlebell',0],
 ['sp','Strict press','press_v','Vægtstang',1],['pp','Push press','press_v','Vægtstang',1],['pj','Push jerk','press_v','Vægtstang',1],['sj','Split jerk','press_v','Vægtstang',1],
 ['kbpr','Kettlebell strict press (pr. arm)','press_v','Kettlebell',0],['hspu','Strict handstand push-ups','press_v','Ingen udstyr',0],
 ['bp','Bænkpres','press_h','Vægtstang',1],['cgbp','Smal bænkpres','press_h','Vægtstang',1],['ringdip','Strict ring dips','press_h','Ringe',0],
 ['pc','Power clean','clean','Vægtstang',1],['sqc','Squat clean','clean','Vægtstang',1],['hpc','Hang power clean','clean','Vægtstang',1],['kbcl','Dobbelt kettlebell clean','clean','Kettlebell',0],
 ['ps','Power snatch','snatch','Vægtstang',1],['ssn','Squat snatch','snatch','Vægtstang',1],['hps','Hang power snatch','snatch','Vægtstang',1],['kbsn','Kettlebell snatch (pr. arm)','snatch','Kettlebell',0],
 ['wpu','Strict pull-ups med vægt','pull','Pull-up bar',0],['spu','Strict pull-ups','pull','Pull-up bar',0],['pendlay','Pendlay row','pull','Vægtstang',1]];
const FW_PAT={squat:'Squat',hinge:'Dødløft og hofte',press_v:'Pres over hovedet',press_h:'Bænk og dips',clean:'Clean',snatch:'Snatch',pull:'Træk'};
/* How often each pattern shows up as the day's lift in the sampled programming */
const FW_PAT_W={squat:25,hinge:18,press_v:17,press_h:12,clean:12,snatch:8,pull:8};
/* Which WOD movement patterns repeat the lift's load (engine pattern names) */
const FW_CLASH={squat:['squat'],hinge:['hinge'],press_v:['push_v'],press_h:['push_h'],clean:['hinge','squat'],snatch:['hinge','push_v'],pull:['pull_v','pull_h']};
const fwL=id=>FW_LIFTS.find(l=>l[0]===id);
const fwPick=a=>a[Math.floor(Math.random()*a.length)];
const FW_ALLP=Object.keys(FW_PAT);
/* bar: 1 = needs a barbell lift (uses % of 1RM), 0 = any lift, -1 = only lifts without a barbell */
const FW_SCHEMES=[
 {id:'wave',name:'Waves',pats:['squat','hinge','press_v','press_h'],bar:1,min:15,heavy:1,lines:()=>['Wave 1: 5 – 3 – 1 @ 70 % – 75 % – 80-85 %','Wave 2: 5 – 3 – 1 @ 75 % – 80 % – 85-90 %','Løft hvert 2:30 min'],note:'Det skal være tungt i sidste løft af hver wave.'},
 {id:'ladder',name:'Stigende sæt',pats:['squat','hinge','press_v','press_h'],bar:1,min:13,heavy:1,lines:()=>['5 @ 70 % · 4 @ 75 % · 3 @ 80 % · 2 @ 85 % · 1 @ 90 %','Ét sæt hvert 2:30 min'],note:'Positionen skal holde, også i det tunge sæt.'},
 {id:'531',name:'5-3-1',pats:['squat','hinge','press_v','press_h'],bar:1,min:16,heavy:1,lines:()=>['5 @ 75 % · 3 @ 85 % · 1+ @ 95 %','Sidste sæt: så mange gode gentagelser som muligt','Derefter 2 × 5 @ 70 %','Hvile 2-3 min mellem sæt'],note:'Skriv antal gentagelser i sidste sæt ned, så du kan slå det næste gang.'},
 {id:'across',name:'Sæt på samme vægt',pats:['squat','hinge','press_v','press_h','pull'],bar:1,min:14,heavy:0,lines:()=>{const v=fwPick([[5,5,'70-75 %'],[4,6,'70 %'],[3,8,'65-70 %'],[5,3,'80-85 %']]);return [`${v[0]} sæt × ${v[1]} @ ${v[2]}`,'Ét sæt hvert 2:00 min','Samme vægt i alle sæt']},note:'Kan du tage flere end målet i sidste sæt, så læg vægt på næste gang.'},
 {id:'build',name:'Byg op',pats:FW_ALLP,bar:0,min:15,heavy:1,lines:l=>{const n=['clean','snatch'].includes(l[2])?fwPick([1,2,3]):fwPick([5,4,3,2]);return [`15 min: byg op til et tungt sæt af ${n}`,`Ca. 6 sæt × ${n}, lidt tungere hver gang`,'Hvile 2-2:30 min mellem sæt']},note:'Stop når farten eller teknikken falder.'},
 {id:'emom',name:'EMOM tung',pats:['squat','hinge','press_v','press_h','clean','snatch'],bar:1,min:12,heavy:1,lines:l=>['clean','snatch'].includes(l[2])?['EMOM 12 min: 1 løft hvert minut','Start ca. 65 %, byg mod 85 %']:['E2MOM 12 min (6 sæt): 2 gentagelser','@ 80-85 %'],note:'Ingen grimme løft. Hold vægten, hvis teknikken svigter.'},
 {id:'cluster',name:'Clusters',pats:['squat','press_v','clean'],bar:1,min:16,heavy:1,lines:()=>['Hvert 2:00 × 8: 1 + 1','5-10 sek pause mellem de to løft (stangen kan stå i stativet)','Byg op til en tung cluster'],note:'Pausen gør, at du kan løfte tungere end normalt.'},
 {id:'complex',name:'Complex',pats:['clean','snatch'],bar:1,min:13,heavy:1,lines:l=>l[2]==='clean'?['Hvert 2:30 × 5:','1 power clean + 1 front squat + 1 hang power clean + 1 push jerk','Byg op til en tung complex']:['Hvert 2:30 × 5:','1 power snatch + 1 hang squat snatch + 1 overhead squat','Byg op til en tung complex'],note:'Vægten styres af den sværeste del af complexen.'},
 {id:'superset',name:'Superset',pats:['squat','hinge','press_h','press_v'],bar:1,min:14,heavy:0,lines:l=>[`3 runder: 8 – 6 – 4 ${l[1].toLowerCase()}`,'+ 5 strict pull-ups med 3 sek pause i toppen (eller 10 ring rows)','Start ca. 70 % og byg hver runde','Hvile 2 min efter hver runde'],note:'Træk-øvelsen giver aktiv pause mellem de tunge sæt.'},
 {id:'heavy',name:'Tunge sæt',pats:FW_ALLP,bar:-1,min:12,heavy:0,lines:()=>['5 sæt × 5-8','Tungt, men stop med 1-2 i tanken','Hvile 90 sek mellem sæt'],note:'Brug en vægt eller variant, hvor de sidste gentagelser er svære.'},
 {id:'bemom',name:'EMOM',pats:FW_ALLP,bar:-1,min:12,heavy:0,lines:()=>['EMOM 12 min: 4-6 gode gentagelser','Stop før teknikken knækker'],note:'Samme antal hvert minut. Vælg et tal du kan holde alle 12 minutter.'}];
const FW_SPEC={squat:['30 sek i bunden af en squat','10 lette goblet squats','30 sek front rack-stræk pr. side','5 air squats med 3 sek ned'],
 hinge:['10 good mornings med elastik','10 RDL med tom stang','10 glute bridges med pause','5 inchworms til planke'],
 press_v:['10 presses med elastik','10 PVC pass-throughs','5 strict press med tom stang','10 scap push-ups'],
 press_h:['10 scap push-ups','10 band pull-aparts','10 push-ups med pause i bunden','10 bænkpres med tom stang'],
 clean:['Tom stang: 5 RDL, 5 muscle cleans, 5 front squats, 5 strict press','10 hip hinges med PVC','5 hang power cleans med tom stang'],
 snatch:['Burgener warm-up med tom stang','5 overhead squats med tom stang','10 PVC pass-throughs','5 muscle snatches med tom stang'],
 pull:['10 scap pull-ups','10 ring rows','20 sek dead hang','10 band pull-aparts']};
const FW_GEN=['10 inchworms','10 cat-cows','10 glute bridges','10 band pull-aparts','10 PVC pass-throughs','10 air squats',"5 world's greatest stretch pr. side",'10 hollow rocks','10 scap pull-ups','10 bootstrappers','10 cossack squats (skiftevis)','5 Samson-stræk pr. side','10 bird dogs (skiftevis)','10 scap push-ups'];
const FW_CARDIO=[['Row 500 m roligt','Ro-maskine'],['Cykel 3 min roligt','Cykel'],['Ski 400 m roligt','Ski-maskine'],['Løb 400 m roligt','Ingen udstyr'],['2 min sjippetov','Sjippetov'],['3 min jumping jacks og høje knæløft','Ingen udstyr']];
/* Accessory moves: [name, group, equipment, dose] */
const FW_ACC=[
 ['Bulgarsk splitsquat','lunge','Ingen udstyr','3 × 8 pr. ben'],['Reverse lunges','lunge','Ingen udstyr','3 × 10 pr. ben'],['Step-ups','lunge','Kasse','3 × 8 pr. ben'],['Kettlebell front rack-lunges','lunge','Kettlebell','3 × 8 pr. ben'],
 ['Nordic curls','ham','Ingen udstyr','3 × 5'],['Leg curls med elastik','ham','Ingen udstyr','3 × 15'],['Back extensions','ham','GHD','3 × 12'],['Good mornings','ham','Vægtstang','3 × 10'],['Kettlebell single-leg RDL','ham','Kettlebell','3 × 8 pr. ben'],['Glute bridge på ét ben','ham','Ingen udstyr','3 × 12 pr. ben'],['Reverse nordic curls','ham','Ingen udstyr','3 × 8'],
 ['Ring rows','pull','Ringe','3 × 12'],['Strict pull-ups','pull','Pull-up bar','3 × 6-8'],['Kettlebell-roning','pull','Kettlebell','3 × 10 pr. arm'],['Rotræk med stang','pull','Vægtstang','3 × 10'],['Band pull-aparts','pull','Ingen udstyr','3 × 20'],
 ['Push-ups','push','Ingen udstyr','3 × 12-15'],['Ring dips','push','Ringe','3 × 8'],['Pike push-ups','push','Ingen udstyr','3 × 8'],['Kettlebell floor press','push','Kettlebell','3 × 10'],
 ['Sideplanke','core','Ingen udstyr','3 × 30 sek pr. side'],['Hollow hold','core','Ingen udstyr','3 × 30 sek'],['Dead bugs','core','Ingen udstyr','3 × 10 pr. side'],['Hængende knæløft','core','Pull-up bar','3 × 12'],['GHD sit-ups','core','GHD','3 × 12'],['Copenhagen-planke','core','Kasse','3 × 20 sek pr. side'],['Pallof press med elastik','core','Ingen udstyr','3 × 10 pr. side'],
 ['Farmer carry','carry','Kettlebell','3 × 40 m'],['Suitcase carry','carry','Kettlebell','3 × 30 m pr. side'],['Slædeskub','carry','Slæde','4 × 20 m'],['Sandsæk-carry','carry','Sandsæk','3 × 40 m']];
const FW_DSLOTS={squat:[['lunge'],['ham'],['core']],hinge:[['lunge'],['pull'],['core','carry']],press_v:[['pull'],['lunge'],['core']],press_h:[['pull'],['ham','lunge'],['core']],
 clean:[['ham'],['pull'],['carry','core']],snatch:[['ham'],['pull'],['core','carry']],pull:[['push'],['lunge'],['core']]};
const FW_TIMES=[45,60,75];
const FW_A_MIN={45:8,60:10,75:12},FW_D_MIN={45:6,60:8,75:10};
/* WOD length after the strength part: shorter and sprintier after a heavy lift */
const FW_C_RANGE={45:{h:[8,12],l:[10,14]},60:{h:[10,15],l:[14,20]},75:{h:[15,20],l:[20,30]}};
const FW_C_OK=[8,10,12,14,15,16,18,20,24,25,30];

const fwW=()=>ui.fwKey?((state.planSess||{})[ui.fwKey]||{}).w:state.fw;
function fwEq(){return cfPrefs().udstyr||[]}
function fwEqOk(eq){const U=fwEq();return eq==='Ingen udstyr'||!U.length||U.includes(eq)}
function fwGenB(pat){
  const pats=FW_ALLP.filter(p=>FW_LIFTS.some(l=>l[2]===p&&fwEqOk(l[3])));
  if(!pat||!pats.includes(pat)){let tot=pats.reduce((a,p)=>a+FW_PAT_W[p],0),r=Math.random()*tot;pat=pats.find(p=>(r-=FW_PAT_W[p])<0)||pats[0]}
  // A barbell is the norm at a box: 8 of 10 days pick a barbell lift when one is available
  const all=FW_LIFTS.filter(x=>x[2]===pat&&fwEqOk(x[3])),bar=all.filter(x=>x[4]);
  const l=fwPick(bar.length&&Math.random()<.8?bar:all);return fwSchemeFor(l)}
function fwSchemeFor(l,keepId){
  const ok=FW_SCHEMES.filter(s=>s.pats.includes(l[2])&&(l[4]?s.bar!==-1:s.bar!==1));
  // Lifts without a usual max (RDL, rows) only get sets across, build-up or superset
  if(['rdl','pendlay','boxsq'].includes(l[0])){const f=ok.filter(s=>['across','build','superset'].includes(s.id));ok.length=0;ok.push(...f)}
  const s=(keepId&&ok.find(x=>x.id===keepId))||fwPick(ok);
  return {lift:l[0],scheme:s.id,lines:s.lines(l),note:s.note,min:s.min,heavy:s.heavy,pct:s.bar===1}}
function fwGenA(b,old){const pat=fwL(b.lift)[2],car=FW_CARDIO.filter(c=>fwEqOk(c[1]));
  const gen=old&&old.gen?old.gen:FW_GEN.slice().sort(()=>Math.random()-.5).slice(0,3);
  return {cardio:old&&old.cardio&&car.some(c=>c[0]===old.cardio)?old.cardio:fwPick(car)[0],gen,spec:FW_SPEC[pat].slice().sort(()=>Math.random()-.5).slice(0,2),pat}}
function fwGenC(b,T){const P=cfPrefs(),pats=FW_CLASH[fwL(b.lift)[2]],rg=FW_C_RANGE[T][b.heavy?'h':'l'];
  const mins=FW_C_OK.filter(m=>m>=rg[0]&&m<=rg[1]);let best=null,bs=1e9;
  for(let i=0;i<30;i++){const p=CF.byggePas({minutter:fwPick(mins),niveau:P.niveau,udstyr:P.udstyr||[],fokus:'',seed:Math.floor(Math.random()*4294967295)});if(!p)continue;
    let sc=p.format.id==='doedved'?1.5:0;p.movs.forEach(m=>{if(m.pat.some(x=>pats.includes(x)))sc+=m.load>=2?4:m.load>=1?1:0});sc+=Math.random()*.5;
    if(sc<bs){bs=sc;best=p}}
  return best?cfSerialize(best):null}
function fwGenD(b,T){const slots=FW_DSLOTS[fwL(b.lift)[2]].slice(0,T===45?2:3),used=new Set(),out=[];
  slots.forEach(gs=>{const c=FW_ACC.filter(a=>gs.includes(a[1])&&fwEqOk(a[2])&&!used.has(a[0])&&!(b.scheme==='superset'&&/pull-ups|Ring rows/.test(a[0])));if(c.length){const a=fwPick(c);used.add(a[0]);out.push(a[0])}});return out}
function fwNew(T){T=T||fwT();const b=fwGenB();return {T,a:fwGenA(b),b,c:fwGenC(b,T),d:fwGenD(b,T)}}
const fwT=()=>FW_TIMES.includes(state.fwT)?state.fwT:60;
function fwC(){const w=fwW();if(!w||!w.c)return null;const k=w.c.seed+'|'+w.c.ids.join(',');if(!ui.fwCache||ui.fwCache.k!==k)ui.fwCache={k,p:cfRebuild(w.c)};return ui.fwCache.p}
function fwAltsB(){const l=fwL(fwW().b.lift);return FW_LIFTS.filter(x=>x[2]===l[2]&&x[0]!==l[0]&&fwEqOk(x[3]))}
function fwAltsD(i){const w=fwW(),a=FW_ACC.find(x=>x[0]===w.d[i]);return a?FW_ACC.filter(x=>x[1]===a[1]&&fwEqOk(x[2])&&!w.d.includes(x[0])):[]}
function fwAltsC(i){const p=fwC();return CF.alternativer(p.movs,i,null,p.opt).filter(m=>m.id!==p.movs[i].id&&!p.movs.some(x=>x.id===m.id))}
function fwSecHead(k,title,min){return `<div class="fw-h"><span class="fw-l">${k.toUpperCase()}</span><h3>${title}</h3><span class="muted small">${min}</span><button class="icon-btn fw-roll" data-act="fwroll" data-s="${k}" aria-label="Bland ${title}">🎲</button></div>`}
function fwAltList(kind,i,alts,label){return `<div class="alts">${alts.length?`<button data-act="fwpick" data-k="${kind}" data-i="${i}" data-v="${esc(label(fwPick(alts)))}" style="background:var(--pill);color:var(--pill-fg)">🎲 Tilfældig erstatning</button>`+alts.slice(0,12).map(a=>`<button data-act="fwpick" data-k="${kind}" data-i="${i}" data-v="${esc(label(a))}">${esc(kind==='c'?CF.navnVis(a):kind==='b'?a[1]:a[0])}</button>`).join(''):'<p class="hint">Ingen erstatninger med dit udstyr.</p>'}</div>`}
function viewFW(){
  const w=fwW(),T=fwT(),P=cfPrefs(),all=cfUdstyrAlle(),have=P.udstyr||all,sw=ui.fwSwap;
  const back=`<div class="habit-head"><button class="icon-btn" data-act="fwback" aria-label="Tilbage" data-back>‹</button><div><p class="eyebrow">${ui.fwKey?cap(niceDate(ui.fwDate))+(dayOf(ui.fwDate).p===ui.fwKey?' · fra din plan':''):'Opvarmning · styrke · WOD · bonus'}</p><h2 class="h2">Fuld træning</h2></div></div>`;
  const opts=`<section class="card">
    ${ui.fwKey?`<p class="hint">Styrkedelen følger din plan. Bland og byt resten som du vil.</p>`:`<div class="field"><span>Tid i alt</span><div class="chips">${FW_TIMES.map(t=>`<button class="${T===t?'on':''}" data-act="fwtime" data-v="${t}">${t} min</button>`).join('')}</div></div>`}
    <div class="field"><span>Niveau</span><div class="chips">${['Begynder','Øvet','Avanceret'].map(n=>`<button class="${P.niveau===n?'on':''}" data-act="cfpref" data-k="niveau" data-v="${n}">${n}</button>`).join('')}</div></div>
    <button class="restbtn" data-act="fwudstyr">${ui.fwEq?'Skjul udstyr':`Udstyr · ${have.length} af ${all.length} valgt`}</button>
    ${ui.fwEq?`<div class="chips">${all.map(u=>`<button class="${have.includes(u)?'on':''}" data-act="cfeq" data-v="${esc(u)}">${esc(u)}</button>`).join('')}</div><p class="hint">Gælder også CrossFit-pas.</p>`:''}
    <button class="btn accent" data-act="fwnew">🎲 ${w?'Bland hele træningen':'Byg en træning'}</button></section>`;
  if(!w)return back+opts+`<p class="hint center">Appen bygger en hel træning som på en CrossFit-box: opvarmning, et tungt løft, en WOD der passer til løftet og lidt bonusarbejde.</p>`;
  const b=w.b,l=fwL(b.lift),p=fwC(),sc=FW_SCHEMES.find(s=>s.id===b.scheme);
  const A=`<section class="card fw-sec">${fwSecHead('a','Opvarmning',`ca. ${FW_A_MIN[w.T]} min`)}
    <div class="fw-row"><span>${esc(w.a.cardio)}</span><button class="fw-sw" data-act="fwa" data-k="cardio" aria-label="Byt">↻</button></div>
    <p class="fw-sub">2 runder:</p>
    ${w.a.gen.map((g,i)=>`<div class="fw-row"><span>${esc(g)}</span><button class="fw-sw" data-act="fwa" data-k="gen" data-i="${i}" aria-label="Byt">↻</button></div>`).join('')}
    ${w.a.spec.map((g,i)=>`<div class="fw-row"><span>${esc(g)}</span><button class="fw-sw" data-act="fwa" data-k="spec" data-i="${i}" aria-label="Byt">↻</button></div>`).join('')}
    <p class="fw-sub">Derefter:</p>
    <div class="fw-row"><span>${l[4]?`Opvarmningssæt til ${esc(l[1].toLowerCase())}: tom stang × 10, 5 @ 40 %, 3 @ 50-60 %`:`2 lette sæt ${esc(l[1].toLowerCase())}`}</span></div>
    ${p?`<div class="fw-row"><span>2-3 lette gentagelser af hver øvelse i WOD'en</span></div>`:''}</section>`;
  const B=`<section class="card fw-sec">${fwSecHead('b','Styrke',`ca. ${b.min} min`)}
    <div class="mvrow"><b class="fw-lift">${esc(l[1])}</b><small>${esc(sc?sc.name:'')} · ${esc(FW_PAT[l[2]])}</small>
      <button class="restbtn swap" data-act="fwswap" data-v="b">${sw==='b'?'Luk':'Byt'}</button>${sw==='b'?fwAltList('b',0,fwAltsB(),a=>a[0]):''}</div>
    <div class="fw-lines">${b.lines.map(x=>`<p>${esc(withKg(fwL(b.lift)[1],x))}</p>`).join('')}</div>
    <p class="note">${esc(b.note)}</p>${b.pct?'<p class="hint">% af din 1RM. Kender du den ikke, så brug en vægt du kunne løfte ca. 2 gange mere.</p>':''}</section>`;
  const C=`<section class="card fw-sec">${fwSecHead('c','WOD',p?`${p.minutter} min`:'')}
    ${p?cfWod(p)+`<p class="note">${esc(p.strategi)}</p><div>${p.movs.map((m,i)=>`<div class="mvrow"><b>${esc(CF.navnVis(m))}</b><small>Skalering: ${esc(m.skal)}</small>
      <button class="restbtn swap" data-act="fwswap" data-v="c${i}">${sw==='c'+i?'Luk':'Byt'}</button>${sw==='c'+i?fwAltList('c',i,fwAltsC(i),a=>a.id):''}</div>`).join('')}</div>`:'<p class="hint">Ingen WOD passede til dit udstyr. Tryk 🎲 for at prøve igen.</p>'}</section>`;
  const D=w.d.length?`<section class="card fw-sec">${fwSecHead('d','Bonus',`ca. ${FW_D_MIN[w.T]} min`)}
    <p class="fw-sub">${w.d.length===2?'2':'3'} runder i roligt tempo. Kun hvis du har tid og lyst.</p>
    ${w.d.map((n,i)=>{const a=FW_ACC.find(x=>x[0]===n)||[n,'','',''];return `<div class="mvrow"><b>${esc(n)}</b><small>${esc(a[3])}</small>
      <button class="restbtn swap" data-act="fwswap" data-v="d${i}">${sw==='d'+i?'Luk':'Byt'}</button>${sw==='d'+i?fwAltList('d',i,fwAltsD(i),x=>x[0]):''}</div>`}).join('')}</section>`:'';
  const L=ui.fwLog?`<section class="card"><h3 class="sec">Log træningen</h3>
    <label class="field"><span>Score i WOD'en</span><input id="fw-score" data-bind="fwLog.score" value="${esc(ui.fwLog.score)}" placeholder="Fx 12:34 eller 7 runder + 5"></label>
    <label class="field"><span>Note (valgfri)</span><input id="fw-note" data-bind="fwLog.note" value="${esc(ui.fwLog.note)}" placeholder="Fx vægt i styrke"></label>
    <button class="btn accent" data-act="fwsave">Gem i log</button></section>`:`<button class="btn primary" data-act="fwlog">Log træningen</button>`;
  return back+opts+A+B+C+D+(ui.fwKey?'':`<button class="btn ghost" data-act="schopen" data-src="fw">📅 Læg i kalenderen</button>`)+L}
function fwPlanName(w){const k=ui.fwKey;if(k&&state.planSess&&state.planSess[k]){state.planSess[k].name='Fuld træning · '+fwL(w.b.lift)[1];applySess()}}
function fwLines(){const w=fwW(),l=fwL(w.b.lift),p=fwC();
  return ['A) Opvarmning: '+[w.a.cardio,...w.a.gen,...w.a.spec].join(', '),'B) '+l[1]+': '+w.b.lines.join(' / '),'C) '+(p?p.overskrift+': '+p.linjer.join(' / '):''),...(w.d.length?['D) Bonus: '+w.d.join(', ')]:[])]}

