/* Fanen Plan og planlæggerens spørgsmål ét ad gangen. */
/* ---------- Planen: the plan for the coming month ---------- */
function viewMonth(){const b=plActive(),wn=plWeekNo(),mon=mondayOf(TODAY);
  const head=b?`<section class="card"><div class="row-between"><h3 class="sec">Dit forløb</h3><span class="muted small">${wn<1?`Starter ${shortDate(b.start)}`:`Uge ${wn} af ${b.weeks}`}</span></div>
      <p class="pl-goal">${esc(b.goalName||PL_GOALS[b.goal][0])}</p><p class="muted small">${shortDate(b.start)}–${shortDate(b.end)}${b.deloads&&b.deloads.length?` · deload i uge ${b.deloads.map(x=>x+1).join(', ').replace(/, (\d+)$/,' og $1')}`:''}</p>
      <div class="meter pl-meter"><i style="width:${Math.max(0,Math.min(100,Math.round((wn-1)/b.weeks*100+100/b.weeks*((pd(TODAY).getDay()+6)%7+1)/7)))}%"></i></div>
      <div class="btns3" style="grid-template-columns:1fr 1fr"><button class="btn ghost" data-act="plopen">Nyt forløb</button><button class="btn ghost" data-act="plstop">Stop forløbet</button></div></section>`
    :`<section class="card"><h3 class="sec">Intet forløb endnu</h3><p class="muted small">Din faste uge gentages. Planlæg 1-8 uger med et mål, så bliver træningen bygget op uge for uge.</p><button class="btn accent" data-act="plopen">Planlæg forløb</button></section>`;
  // Nothing planned in the coming five weeks and no plan running: show only the invitation, not an empty calendar
  if(!b&&[...Array(35)].every((_,i)=>{const d=addD(mon,i);return sessKey(d)==='R'&&!extrasOn(d).length}))
    return head.replace('Din faste uge gentages. Planlæg','Du har ingen planlagt træning. Planlæg');
  const weeks=[0,1,2,3,4].map(i=>{const st=ds(new Date(pd(mon).getFullYear(),pd(mon).getMonth(),pd(mon).getDate()+7*i));
    const days=[0,1,2,3,4,5,6].map(j=>ds(new Date(pd(st).getFullYear(),pd(st).getMonth(),pd(st).getDate()+j)));
    const bw=b&&st>=b.start&&st<=b.end?Math.floor((pd(st)-pd(b.start))/(7*864e5)):-1;
    return `<section class="card mw"><div class="row-between"><h3 class="sec">${i===0?'Denne uge':i===1?'Næste uge':`Uge ${isoWeek(st)}`} <span class="muted small">· ${shortDate(days[0])}–${shortDate(days[6])}</span></h3>${bw>=0&&b.deloads.includes(bw)?'<span class="tag-dl">Deload</span>':''}</div>
      ${days.map(d=>{const s=sessFor(d),op=ui.mOpen===d,done=isDone(d);return `<button class="pl-r m-r${d<TODAY?' past':''}${d===TODAY?' today':''}${op?' open':''}" data-act="mday" data-date="${d}"><span class="pl-d">${PL_SHORT[pd(d).getDay()]} ${pd(d).getDate()}</span>${chip(s.kind,s.label||KIND_LABEL[s.kind])}<span class="pl-l">${esc(s.name)}${extrasOn(d).length?` <span class="muted">+${extrasOn(d).length}</span>`:''}${done?' <span class="ok">✓</span>':''}</span>${s.kind==='hvile'&&!extrasOn(d).length?'':'<span class="chev">›</span>'}</button>${op?weekDetail(d):''}`}).join('')}</section>`}).join('');
  return `${head}${weeks}`}
function isoWeek(d){const t=pd(d),x=new Date(Date.UTC(t.getFullYear(),t.getMonth(),t.getDate()));const day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil(((x-y)/864e5+1)/7)}
/* The wizard asks one thing per screen. Which screens appear depends on the goal (run goals add distance and pace). */
function plSteps(P){const run=isRun(P.goal);return ['goal',...(run?['dist','test',P.goal==='distance'?'cur':'pace']:[]),'weeks',...(P.weeks>=3?['deload',...(P.deload?['dlfreq']:[])]:[]),'start','days','week',...(PL_DOW.some(d=>P.types[d]==='crossfit')?['level','eqcf','fwtime']:[]),...(PL_DOW.some(d=>P.types[d]==='styrke')?['eqstr','strmin']:[])]}
/* A suggested week for the goal and number of training days. Days are spread so hard days rarely stack; Sunday becomes active recovery. */
const PL_SLOTS={2:[0,3],3:[0,2,4],4:[0,1,3,5],5:[0,1,3,4,5],6:[0,1,2,3,4,5]};
const PL_MIX={styrke:{2:'SS',3:'SKS',4:'SKSS',5:'SKSKS',6:'SKSKSK'},kondition:{2:'KS',3:'KSK',4:'KSKK',5:'KSKSK',6:'KSKKSK'},
  allround:{2:'CC',3:'CCC',4:'CKCC',5:'CCKCC',6:'CCKCCK'},vaegt:{2:'SK',3:'SKK',4:'SKSK',5:'SKSKK',6:'SKKSKK'},hybrid:{2:'SK',3:'SKC',4:'SKCK',5:'SKCKS',6:'SKCKSM'},muskler:{2:'SS',3:'SSS',4:'SSSS',5:'SSKSS',6:'SSSKSS'},
  distance:{2:'KK',3:'KSK',4:'KSKK',5:'KSKSK',6:'KKSKSK'},pace:{2:'KK',3:'KSK',4:'KSKK',5:'KSKSK',6:'KKSKSK'}};
function plDraft(P){const n=P.nDays,mix=(PL_MIX[P.goal]||PL_MIX.styrke)[n],m={S:'styrke',K:'kondition',C:'crossfit',M:'mobilitet'},t={};
  PL_DOW.forEach(d=>t[d]='hvile');PL_SLOTS[n].forEach((i,k)=>t[PL_DOW[i]]=m[mix[k]]);if(n>=3&&t[0]==='hvile')t[0]='restitution';
  // Allround also gets a mobility day on a free day (not right before the weekend's recovery day)
  // Weight loss: walks on the free days, Sunday stays a rest day
  if(P.goal==='vaegt'){PL_DOW.forEach(d=>{if(d!==0&&t[d]==='hvile')t[d]='restitution'});if(t[0]==='restitution')t[0]='hvile'}
  if(P.goal==='hybrid'&&!PL_DOW.some(d=>t[d]==='mobilitet')){const f=PL_DOW.find(d=>t[d]==='hvile');if(f!==undefined)t[f]='mobilitet'}
  P.types=t;P.draftSig=P.goal+'|'+n}
/* Running test in the wizard: VDOT, paces and a realistic goal */
function plTestV(P){if(P.noTest)return null;const sec=parseTime(P.tTxt);if(!sec||!P.tKm)return null;const p=sec/P.tKm;if(p<150||p>720)return null;return vdotOf(P.tKm,sec)}
function plTestInfo(P){const v=plTestV(P);if(P.noTest)return '<p class="hint">Appen bruger rolige beskrivelser af tempoet, indtil du har løbet testen.</p>';
  if(!v)return '<p class="hint">Skriv tiden, så vises dine tempoer.</p>';
  return `<div class="vd-box"><div><b class="num">${fmtKm(v)}</b><small>VDOT</small></div><ul class="num"><li>Interval <b>${fmtPace(zPace(v,'I'))}</b></li><li>Tærskel <b>${fmtPace(zPace(v,'T'))}</b></li><li>Rolig <b>${fmtPace(zPace(v,'E'))}–${fmtPace(vdPace(v,ZONES.E[2]))}</b></li></ul></div>`}
function plReal(P){const v=P.vStart;if(v==null)return null;const D=P.dist,now=vdPredict(v,D),gv=vdotOf(D,P.pace*D),need=gv-v,rw=runWeeks(P)[1],wk=Math.ceil(need/VD_GAIN);
  const realPace=Math.round(vdPredict(v+vdGain(rw),D)/D/5)*5;
  if(need<=0)return {cls:'ok',t:'Du kan allerede løbe det tempo',d:`Din tid nu svarer til ${fmtTime(now)} på ${RUN_D[D].toLowerCase()}. Sæt målet højere.`,btn:`<button class="btn ghost" data-act="plrealpace" data-v="${realPace}">Brug ${fmtPace(realPace)}/km</button>`};
  if(need<=vdGain(rw))return {cls:'ok',t:'Realistisk mål',d:`Din tid nu svarer til ${fmtTime(now)}. Målet kræver ca. ${Math.max(1,wk)} ugers træning.`};
  return {cls:'warn',t:'Ambitiøst mål',d:`Din tid nu svarer til ${fmtTime(now)} (${fmtPace(now/D)}/km). Målet kræver ca. ${wk} ugers træning. Et realistisk mål på ${rw} uger er ${fmtPace(realPace)}/km.`,btn:`<button class="btn ghost" data-act="plrealpace" data-v="${realPace}">Brug ${fmtPace(realPace)}/km</button>`}}
/* Active minutes a week (conditioning + walks), first and last full week. The research points at 150 min as the floor and 200-300 for real weight loss. */
function plMinutes(pv){const wk=w=>w.days.reduce((a,d)=>{const s=pv.sess[d.key]||SESS[d.key];return a+(s&&['interval','zone2'].includes(s.kind)||d.key==='GA'?(s.min||0):0)+(s&&s.finisher||0)},0);
  const W=pv.weeks.filter(w=>!w.dl),a=wk(W[0]||pv.weeks[0]),b=wk(W[W.length-1]||pv.weeks[0]);return `Aktive minutter om ugen: ${a} i starten, ${b} til sidst.`}
function plDlOpts(P){return [2,3,4,5,6]}
function plWk(P){if(isRun(P.goal)){const r=runWeeks(P);if(!r[0].includes(P.weeks))P.weeks=r[1];return r}if(P.weeks>8)P.weeks=8;return [[1,2,3,4,5,6,7,8],0]}
function viewPlan(){const P=ui.pl;if(!P){ui.view='month';return viewMonth()}
  const steps=plSteps(P);if(P.step!=='review'&&!steps.includes(P.step))P.step=steps[0];
  const idx=steps.indexOf(P.step),n=steps.length;
  const head=(t,sub)=>`<div class="habit-head"><button class="icon-btn" data-act="plback" aria-label="Tilbage" data-back>‹</button><div><p class="eyebrow">Planlæg forløb${idx>=0?` · ${idx+1} af ${n}`:''}</p><h2 class="h2">${t}</h2></div></div>${idx>=0?`<div class="pl-prog">${steps.map((_,k)=>`<i class="${k<=idx?'on':''}"></i>`).join('')}</div>`:''}${sub?`<p class="note">${sub}</p>`:''}`;
  const fin=dis=>idx===n-1?nav('Byg planen','plbuild',dis):nav(undefined,undefined,dis);
  const nav=(lbl,act,dis)=>`<div class="btns3" style="grid-template-columns:1fr 2fr">${idx>0?`<button class="btn ghost" data-act="plprev">Tilbage</button>`:`<button class="btn ghost" data-act="plback">Annullér</button>`}<button class="btn accent" data-act="${act||'plnext'}"${dis?' disabled':''}>${lbl||'Næste'}</button></div>`;
  const card=(x)=>`<section class="card">${x}</section>`;
  const opt=(act,v,on,l,d)=>`<button class="fmt${on?' on':''}" data-act="${act}" data-v="${v}"><b>${l}</b>${d?`<small>${d}</small>`:''}</button>`;
  const stepper=(f,dist)=>`<div class="stepper"><button data-act="plpace" data-f="${f}" data-v="-5" aria-label="Hurtigere">−</button><b class="num">${fmtPace(P[f])} /km</b><button data-act="plpace" data-f="${f}" data-v="5" aria-label="Langsommere">+</button></div><p class="hint num" style="text-align:center">${RUN_D[P.dist]} på ${fmtTime(P[f]*P.dist)}</p>`;
  switch(P.step){
  case 'goal':return head('Hvad er dit mål?')+card(`<div class="fmt-grid">${Object.entries(PL_GOALS).map(([k,[l,d]])=>opt('plgoal',k,P.goal===k,l,d)).join('')}</div>`)+nav();
  case 'dist':{const dists=P.goal==='pace'?[5,10,21.1]:[5,10,21.1,42.2];if(!dists.includes(P.dist))P.dist=5;
    return head(P.goal==='pace'?'Hvilken distance vil du løbe hurtigere?':'Hvilken distance vil du nå?')+card(`<div class="fmt-grid">${dists.map(d=>opt('pldist',d,P.dist===d,RUN_D[d])).join('')}</div>`)+nav()}
  case 'cur':return head('Hvor langt kan du løbe nu?','Din længste tur uden at gå.')+card(`<div class="chips">${[1,3,5,8,12,16,21].map(k=>`<button class="${P.cur===k?'on':''}" data-act="plcur" data-v="${k}">${k} km</button>`).join('')}</div>`)+nav();
  case 'test':{const v=plTestV(P);return head('Hvad er din bedste tid for nylig?','Et løb eller en test de sidste 2 måneder. Appen regner dine træningstempoer ud fra den.')+card(`
    <div class="field"><span>Distance</span><div class="chips">${[3,5,10,21.1].map(k=>`<button class="${P.tKm===k?'on':''}" data-act="pltkm" data-v="${k}">${k===21.1?'Halvmaraton':k+' km'}</button>`).join('')}</div></div>
    <label class="field"><span>Tid (mm:ss eller t:mm:ss)</span><input id="pl-tt" inputmode="numeric" value="${esc(P.tTxt||'')}" placeholder="${P.tKm>=10?'48:30':'22:30'}"${P.noTest?' disabled':''}></label>
    <div id="pl-tv">${plTestInfo(P)}</div>
    <button class="restbtn${P.noTest?' on':''}" data-act="plnotest">${P.noTest?'✓ ':''}Jeg har ingen tid. Første løbepas bliver en test</button>`)+nav()}
  case 'pace':{const r=plReal(P);return head('Hvilken pace vil du ramme?',`Målet for ${RUN_D[P.dist].toLowerCase()}.`)+card(stepper('pace')+(r?`<div class="vd-real ${r.cls}"><b>${r.t}</b><span>${r.d}</span>${r.btn||''}</div>`:''))+nav()}
  case 'curpace':return head('Hvad er din pace nu?',`Hvad du kan løbe ${RUN_D[P.dist].toLowerCase()} på i dag.`)+card(stepper('curPace'))+nav();
  case 'weeks':{const [wk,rec]=plWk(P),need=P.goal==='pace'&&P.vStart!=null?vdotOf(P.dist,P.pace*P.dist)-P.vStart:0;
    return head('Hvor mange uger?')+card(`<div class="chips">${wk.map(k=>`<button class="${P.weeks===k?'on':''}" data-act="plweeks" data-v="${k}">${k}${k===rec?' ★':''}</button>`).join('')}</div>${rec?`<p class="hint">★ anbefalet for ${RUN_D[P.dist].toLowerCase()}</p>`:''}${need>vdGain(P.weeks)?`<p class="hint warn-t">Dit mål kræver ca. ${Math.ceil(need/VD_GAIN)} uger. På ${P.weeks} uger er ${fmtPace(Math.round(vdPredict(P.vStart+vdGain(P.weeks),P.dist)/P.dist))}/km mere realistisk.</p>`:''}`)+nav()}
  case 'deload':return head('Skal der være lette uger?')+card(`<div class="fmt-grid">${opt('pldl',1,P.deload,'Ja','Kroppen når at komme sig. Anbefalet.')}${opt('pldl',0,!P.deload,'Nej','Fuld belastning hele vejen.')}</div>`)+nav();
  case 'dlfreq':{const o=plDlOpts(P),fit=plDlFits(P,P.dlEvery),cnt=plWeekInfo(P).filter(x=>x.dl).length;
    return head('Hvor ofte?','En let uge hver …')+card(`<div class="chips">${o.map(k=>`<button class="${P.dlEvery===k?'on':''}${plDlFits(P,k)?'':' dim'}" data-act="pldlf" data-v="${k}">${k}. uge${k===4?' ★':''}</button>`).join('')}</div>
      <p class="hint${fit?'':' warn-t'}">${fit?`${cnt} ${cnt===1?'let uge':'lette uger'} på ${P.weeks} uger · ★ mest brugt: 3 hårde uger, 1 let`:`Dit forløb er ${P.weeks} uger, så du når ikke en let uge. Vælg et lavere tal, eller gå tilbage og vælg flere uger.`}</p>`)+nav()}
  case 'start':return head('Hvornår vil du starte?')+card(`<div class="fmt-grid">${opt('plst','this',P.start==='this','Denne uge','Dage der er gået springes over.')}${opt('plst','next',P.start==='next','Næste uge','Starter mandag.')}</div>`)+nav();
  case 'days':return head('Hvor mange dage om ugen vil du træne?')+card(`<div class="chips">${[2,3,4,5,6].map(k=>`<button class="${P.nDays===k?'on':''}" data-act="plndays" data-v="${k}">${k} dage</button>`).join('')}</div>`)+nav();
  case 'level':{const C=cfPrefs();return head('Hvilket niveau træner du på?','Bruges til WOD\'er og fuld træning, ligesom når du bygger et pas.')+card(`<div class="fmt-grid">${[['Begynder','Skalerede bevægelser og lettere vægte'],['Øvet','Standardbevægelser og -vægte'],['Avanceret','Svære bevægelser og Rx-vægte']].map(([n,d])=>opt('plcfniv',n,C.niveau===n,n,d)).join('')}</div>`)+fin()}
  case 'eqcf':{const all=cfUdstyrAlle(),have=cfPrefs().udstyr||all;return head('Hvilket udstyr har du til fuld træning?','Det samme valg som når du bygger en WOD.')+card(`<div class="chips">${all.map(u=>`<button class="${have.includes(u)?'on':''}" data-act="cfeq" data-v="${esc(u)}">${esc(u)}</button>`).join('')}</div><p class="hint">${have.length} af ${all.length} valgt</p>`)+fin()}
  case 'fwtime':return head('Hvor lang tid har du til en fuld træning?')+card(`<div class="chips">${FW_TIMES.map(t=>`<button class="${P.fwT===t?'on':''}" data-act="plfwt" data-v="${t}">${t} min</button>`).join('')}</div>`)+fin();
  case 'eqstr':{const have=strHave();return head('Hvilket udstyr har du til styrke?','Det samme valg som når du laver et styrkepas.')+card(`<div class="chips">${STR_EQ.map(u=>`<button class="${have.includes(u)?'on':''}" data-act="seeq" data-v="${esc(u)}">${esc(u)}</button>`).join('')}</div><p class="hint">Kropsvægtsøvelser er altid med.</p>`)+fin()}
  case 'strmin':return head('Hvor lang tid har du til et styrkepas?')+card(`<div class="chips">${[30,45,60,75].map(t=>`<button class="${P.strMin===t?'on':''}" data-act="plstrmin" data-v="${t}">${t} min</button>`).join('')}</div><p class="hint">${plAccN(P)} ${plAccN(P)===1?'hjælpeøvelse':'hjælpeøvelser'} ud over hovedløftet.</p>`)+fin();
  case 'week':{const heavy=d=>['styrke','crossfit'].includes(P.types[d]);
    const warn=new Set();PL_DOW.forEach((d,i)=>{const r=[0,1,2].map(k=>PL_DOW[(i+k)%7]);if(r.every(heavy))r.forEach(x=>warn.add(x))});
    const cnt={};PL_DOW.forEach(d=>cnt[P.types[d]]=(cnt[P.types[d]]||0)+1);
    const noRest=!PL_DOW.some(d=>['hvile','restitution','mobilitet'].includes(P.types[d]));
    const run=isRun(P.goal),nRun=PL_DOW.filter(d=>P.types[d]==='kondition').length;
    return head('Forslag til din uge',`${esc(plGoalName(P))} · ${P.nDays} træningsdage. Tryk på en dag for at ændre den.`)+`<section class="card pl-week-edit">${PL_DOW.map(d=>`<button class="pl-wrow k-${PL_TYPES[P.types[d]][1]}" data-act="plpick" data-d="${d}"><span class="pl-wd">${PL_SHORT[d]}</span>${plIcon(P.types[d])}<span class="pl-wt">${PL_TYPES[P.types[d]][0]}</span>${warn.has(d)||noRest?'<span class="pl-warn" title="Mange tunge dage i træk">!</span>':''}<span class="chev">›</span></button>`).join('')}</section>
    <div class="pl-sum">${Object.keys(PL_TYPES).filter(t=>cnt[t]).map(t=>`<span class="k-${PL_TYPES[t][1]}"><span class="bar"></span>${cnt[t]} ${PL_TYPES[t][0].toLowerCase()}</span>`).join('')}</div>
    ${run&&!nRun?'<p class="hint warn-t">Gør mindst 2 dage til kondition for at bygge en løbeplan.</p>':''}
    ${idx===n-1?nav('Byg planen','plbuild',run&&!nRun):nav('Næste','plnext',run&&!nRun)}
    ${P.pick!=null?`<div class="sheet-bg" data-act="plclose"><div class="sheet" role="dialog" aria-label="${PL_SHORT[P.pick]}"><p class="sheet-t">${cap(DAYS[P.pick])}</p><div class="sheet-grid">${Object.keys(PL_TYPES).map(t=>`<button class="sheet-b k-${PL_TYPES[t][1]}${P.types[P.pick]===t?' on':''}" data-act="plset" data-v="${t}">${plIcon(t)}<span>${PL_TYPES[t][0]}</span></button>`).join('')}</div></div></div>`:''}`}
  }
  const pv=P.preview;
  return head('Din plan',`${pv.P.weeks} ${pv.P.weeks===1?'uge':'uger'} · ${esc(plGoalName(pv.P))}. ${pv.P.goal==='vaegt'?plMinutes(pv)+' ':''}Se den igennem, og acceptér når den ser rigtig ud.`)+
    pv.weeks.map(w=>`<section class="card pl-week"><div class="row-between"><h3 class="sec">Uge ${w.w+1} · ${shortDate(w.days[0].date)}–${shortDate(w.days[6].date)}</h3>${w.dl?'<span class="tag-dl">Deload</span>':w.test?'<span class="tag-dl">Test</span>':''}</div>
      ${w.days.map(x=>{const op=P.open===x.date;return `<button class="pl-r${x.past?' past':''}${op?' open':''}" data-act="plopenday" data-date="${x.date}"${x.past?' disabled':''}><span class="pl-d">${PL_SHORT[x.dow]}</span>${chip(PL_TYPES[x.t][1],PL_TYPES[x.t][0])}<span class="pl-l">${esc(x.past?'Allerede gået':x.label)}</span>${x.past||x.key==='R'?'':'<span class="chev">›</span>'}</button>${op?plDetail(x,pv):''}`}).join('')}</section>`).join('')+
    `<button class="btn accent" data-act="placcept">Acceptér plan</button><div class="btns3" style="grid-template-columns:1fr 1fr"><button class="btn ghost" data-act="plprev">Ret ugen</button><button class="btn ghost" data-act="plbuild">🎲 Byg igen</button></div>`}

