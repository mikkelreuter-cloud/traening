/* Opret og rediger pas, log-skærme, grafer og vaner. */
/* ---------- Random sessions for the other kinds ---------- */
const SE_ACT={lob:['Løb','løb'],cykel:['Cykel','cykel'],ro:['Romaskine','ro'],ski:['Skimaskine','ski']};
const SE_INT={lang:['Lange intervaller',{20:['3 × 3 min hårdt','2 min roligt mellem hvert'],30:['4 × 4 min hårdt','3 min roligt mellem hvert'],45:['5 × 5 min hårdt','3 min roligt mellem hvert']}],
  kort:['Korte intervaller',{20:['2 serier á 10 × 30 sek hårdt / 15 sek roligt','3 min roligt mellem serierne'],30:['3 serier á 13 × 30 sek hårdt / 15 sek roligt','3 min roligt mellem serierne'],45:['4 serier á 13 × 30 sek hårdt / 15 sek roligt','3 min roligt mellem serierne']}],
  taerskel:['Tærskel',{20:['2 × 8 min i tærskeltempo','2 min roligt mellem'],30:['3 × 10 min i tærskeltempo','2 min roligt mellem'],45:['3 × 12 min i tærskeltempo','3 min roligt mellem']}]};
const SE_MOB={hofter:['Hofter og ben',['90/90 hofterotation · 1 min pr. side','Couch stretch · 1 min pr. side','Frog stretch · 1 min','Cossack squats · 10 skiftevis','Dyb squat og hold · 1 min','Glute bridge · 15','Baglårsstræk på ryggen · 1 min pr. side','Lægstræk mod væg · 45 sek pr. side']],
  ryg:['Ryg og skuldre',['Kat-ko · 1 min','Thread the needle · 8 pr. side','Wall slides · 12','PVC pass-throughs · 15','Barnets stilling med sidebøj · 1 min','Brystrotation på knæ · 8 pr. side','Dead hang · 30 sek','Bryststræk i dørkarm · 45 sek']],
  hel:['Hele kroppen',["World's greatest stretch · 5 pr. side",'Inchworms · 8','Nedadgående hund til cobra · 10','Kat-ko · 1 min','90/90 hofterotation · 1 min pr. side','PVC pass-throughs · 15','Dyb squat og hold · 1 min','Thread the needle · 8 pr. side']]};
const SE_REST={gang:['Gang'],cykel:['Cykel'],svom:['Svømning'],yoga:['Yoga'],rul:['Rul og stræk']};
const seOpt=()=>({act:'lob',int:'lang',min:30,mob:'hel',rest:'gang',fmt:'',...(state.seGen||{})});
function seGenerate(e){const o=seOpt(),pk=a=>a[Math.floor(Math.random()*a.length)];
  if(e.kind==='interval'){const it=SE_INT[o.int],m=o.min in it[1]?o.min:30,a=SE_ACT[o.act];
    e.steps=[`10 min roligt ${a[1]} for at varme op`,...it[1][m],'5 min roligt til sidst'].join('\n');e.min=String(m+15);e.name=`${it[0]} · ${a[0]}`;return}
  if(e.kind==='zone2'){const a=SE_ACT[o.act],m=[30,45,60,75].includes(o.min)?o.min:45;
    e.steps=['5 min helt roligt for at komme i gang',`${m-10} min jævnt ${a[1]} i zone 2. Du skal kunne tale i hele sætninger`,'5 min helt roligt til sidst',pk(['Træk vejret gennem næsen, hvis du kan','Hold tempoet jævnt, også op ad bakke','Bliver det for hårdt, så sænk farten'])].join('\n');e.min=String(m);e.name=`Zone 2 · ${a[0]} ${m} min`;return}
  if(e.kind==='mobilitet'){const f=SE_MOB[o.mob],m=[10,15,20].includes(o.min)?o.min:15,n={10:5,15:7,20:8}[m];
    e.steps=f[1].slice().sort(()=>Math.random()-.5).slice(0,n).join('\n');e.min=String(m);e.name=`Mobilitet · ${f[0].toLowerCase()}`;return}
  if(e.kind==='restitution'){const m=[15,20,30].includes(o.min)?o.min:20,r=o.rest;
    const st=r==='yoga'?SESS.AR5.steps:r==='rul'?SESS.AR3.steps:[`${m} min ${{gang:'gang',cykel:'cykling',svom:'svømning'}[r]} i meget roligt tempo`,'Under 60 % af maks puls · hårdhed 2-3 af 10','Du skal kunne føre en samtale uden pause'];
    e.steps=st.join('\n');e.min=String(m);e.name=`Aktiv restitution · ${SE_REST[r][0].toLowerCase()}`;return}
  if(e.kind==='crossfit'){const P=cfPrefs(),m=[8,10,12,15,16,20,24,30].includes(o.min)?o.min:15;
    const p=CF.byggePas({format:o.fmt||undefined,minutter:m,niveau:P.niveau,udstyr:P.udstyr||[],antal:P.antal||0,hvile:P.hvile});
    if(!p){toast('Ingen WOD passede til dit udstyr');return}e.cf=cfSerialize(p);e.steps=[p.overskrift,...p.linjer].join('\n');e.min=String(m);e.name=p.overskrift;return}}
function seRandOpts(e){const o=seOpt(),ch=(f,list)=>`<div class="chips">${list.map(([v,l])=>`<button class="${String(o[f])===String(v)?'on':''}" data-act="segen2" data-f="${f}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const acts=Object.entries(SE_ACT).map(([k,v])=>[k,v[0]]),mins=l=>l.map(m=>[m,m+' min']);
  if(e.kind==='interval')return `<div class="field"><span>Type</span>${ch('int',Object.entries(SE_INT).map(([k,v])=>[k,v[0]]))}</div><div class="field"><span>Aktivitet</span>${ch('act',acts)}</div><div class="field"><span>Hårdt arbejde</span>${ch('min',mins([20,30,45]))}</div>`;
  if(e.kind==='zone2')return `<div class="field"><span>Aktivitet</span>${ch('act',acts)}</div><div class="field"><span>Tid</span>${ch('min',mins([30,45,60,75]))}</div>`;
  if(e.kind==='mobilitet')return `<div class="field"><span>Fokus</span>${ch('mob',Object.entries(SE_MOB).map(([k,v])=>[k,v[0]]))}</div><div class="field"><span>Tid</span>${ch('min',mins([10,15,20]))}</div>`;
  if(e.kind==='restitution')return `<div class="field"><span>Hvad</span>${ch('rest',Object.entries(SE_REST).map(([k,v])=>[k,v[0]]))}</div><div class="field"><span>Tid</span>${ch('min',mins([15,20,30]))}</div>`;
  return `<div class="field"><span>Format</span>${ch('fmt',[['','Overrask mig'],...CF.FORMATER.map(f=>[f.id,f.navn])])}</div><div class="field"><span>Tid</span>${ch('min',mins([8,10,12,15,16,20,24,30]))}</div><p class="hint">Bruger dit udstyr og niveau fra CrossFit.</p>`}
function seOtherEditor(e){const m=e.mode,builtIn=e.key&&SESS_BASE[e.key],cardioBuiltIn=builtIn&&(e.kind==='interval'||e.kind==='zone2');
  const choose=`<section class="card"><h3 class="sec">Sådan bygger du passet</h3><div class="fmt-grid">
    <button class="fmt${m==='rand'?' on':''}" data-act="semode" data-v="rand"><b>🎲 Tilfældigt</b><small>Appen bygger passet ud fra dine valg</small></button>
    <button class="fmt${m==='self'?' on':''}" data-act="semode" data-v="self"><b>✍️ Byg selv</b><small>Skriv passet selv</small></button></div></section>`;
  if(m==='rand'){const p=e.kind==='crossfit'&&e.cf?cfRebuild(e.cf):null;
    return choose+`<section class="card">${seRandOpts(e)}<button class="btn accent" data-act="sesuggest">🎲 Bland igen</button></section>
    ${e.steps?`<section class="card" id="se-result"><h3 class="sec">Dit pas${e.min?` · ${e.min} min`:''}</h3>${p?cfWod(p):`<ol class="steps">${e.steps.split('\n').filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`}
      <button class="restbtn" data-act="semode" data-v="self">Ret passet selv</button></section>`:''}`}
  if(m==='self')return choose+`<section class="card"><label class="field"><span>Varighed (min)</span><input id="se-min" inputmode="numeric" data-bind="se.min" value="${esc(e.min)}" placeholder="30"></label>
    <label class="field"><span>Sådan gør du (én linje pr. trin)</span><textarea id="se-steps" rows="6" data-bind="se.steps" placeholder="10 min roligt&#10;…">${esc(e.steps)}</textarea></label>
    ${cardioBuiltIn?'<p class="hint">Timeren følger stadig det oprindelige pas. Teksten her er det, du ser.</p>':''}</section>`;
  return choose}
function seDraft(k){const se=k?SESS[k]:null;
  return {mode:k?'self':null,key:k||null,name:se?se.name:'',kind:se?(se.label==='Aktiv restitution'?'restitution':se.kind):'styrke',cf:se&&se.cf?se.cf:null,ex:se&&se.ex?se.ex.map(e=>({n:e[0],s:String(e[1]),r:String(e[2]),q:String(e[3])})):[{n:'',s:'3',r:'8',q:'2'}],
    steps:se&&se.steps?se.steps.join('\n'):'',min:se?String(se.min||parseInt(String(se.dur||'').replace(/\D+/g,' ').trim().split(' ').pop())||''):'',note:se?se.note||'':''}}
/* Strength part of the session editor: first a choice between a random session and building it yourself, then only that path. */
function strEditor(e){const m=e.mode,has=e.ex.some(x=>x.n.trim());
  const choose=`<section class="card"><h3 class="sec">Sådan bygger du passet</h3><div class="fmt-grid">
    <button class="fmt${m==='rand'?' on':''}" data-act="semode" data-v="rand"><b>🎲 Tilfældigt</b><small>Appen vælger øvelser ud fra fokus, tid og udstyr</small></button>
    <button class="fmt${m==='self'?' on':''}" data-act="semode" data-v="self"><b>✍️ Byg selv</b><small>Vælg øvelserne én for én</small></button></div></section>`;
  if(m==='rand'){const o=strOpts();
    return choose+`<section class="card">
    <div class="field"><span>Fokus</span><div class="chips">${Object.entries(STR_FOCUS).map(([k,[l]])=>`<button class="${o.focus===k?'on':''}" data-act="segen" data-f="focus" data-v="${k}">${l}</button>`).join('')}</div></div>
    <div class="field"><span>Tid</span><div class="chips">${STR_TIME.map(x=>`<button class="${o.min===x?'on':''}" data-act="segen" data-f="min" data-v="${x}">${x} min</button>`).join('')}</div></div>
    <div class="field"><span>Intensitet</span><div class="chips">${Object.entries(STR_INT).map(([k,[l]])=>`<button class="${o.int===k?'on':''}" data-act="segen" data-f="int" data-v="${k}">${l}</button>`).join('')}</div><p class="hint">${STR_INT[o.int][1]}.</p></div>
    <button class="restbtn" data-act="seeqtog">${ui.seEq?'Skjul udstyr':`Udstyr · ${strHave().length} af ${STR_EQ.length} valgt`}</button>
    ${ui.seEq?`<div class="chips">${STR_EQ.map(u=>`<button class="${strHave().includes(u)?'on':''}" data-act="seeq" data-v="${esc(u)}">${esc(u)}</button>`).join('')}</div><p class="hint">Øvelser uden udstyr er altid med.</p>`:''}
    <button class="btn accent" data-act="sesuggest">🎲 Bland igen</button></section>
    ${has?`<section class="card" id="se-result"><h3 class="sec">Dit pas</h3>${e.ex.map((x,i)=>!x.n.trim()?'':`<div class="mvrow"><div><b>${esc(x.n)}</b><small class="exmeta" style="display:block">${x.s} × ${x.r} · ${x.q} i tanken</small></div><button class="rm sw" data-act="seswap" data-i="${i}" aria-label="Byt øvelse">↻</button></div>`).join('')}
      <button class="restbtn" data-act="semode" data-v="self">Ret øvelserne selv</button><p class="hint">↻ bytter til en lignende øvelse.</p></section>`:''}`}
  if(m==='self')return choose+`<section class="card"><h3 class="sec">Øvelser</h3>
    ${e.ex.map((x,i)=>{const lx=strFor(x.n),miss=lx&&!strOk(lx);return `<div class="exblk"><div class="exblk-top"><input class="exn-in" id="se-n${i}" data-bind="se.ex.${i}.n" value="${esc(x.n)}" data-ac="ex" autocomplete="off" placeholder="Skriv eller vælg øvelse"><button class="rm" data-act="seswap" data-i="${i}" aria-label="Byt øvelse" title="Byt">↻</button><button class="rm" data-act="serm" data-i="${i}" aria-label="Fjern øvelse">×</button></div>
      ${lx?`<small class="exmeta${miss?' warn':''}">${miss?'Kræver ':''}${esc(lx[1])} · ${esc(lx[2])}</small>`:''}
      <div class="exnums"><label><span>Sæt</span><input id="se-s${i}" inputmode="numeric" data-bind="se.ex.${i}.s" value="${esc(x.s)}"></label><label><span>Gentagelser</span><input id="se-r${i}" inputmode="numeric" data-bind="se.ex.${i}.r" value="${esc(x.r)}"></label><label><span>Tilbage i tanken</span><input id="se-q${i}" inputmode="numeric" data-bind="se.ex.${i}.q" value="${esc(x.q)}"></label></div></div>`}).join('')}
    <datalist id="exlist2">${allExercises().map(x=>`<option value="${esc(x)}">`).join('')}</datalist>
    <button class="restbtn" data-act="sepick">+ Tilføj øvelse</button>
    <p class="hint">Tilbage i tanken = hvor mange gentagelser du stopper før, du ikke kan mere. ↻ bytter til en lignende øvelse.</p></section>`;
  return choose}
function viewSessEdit(){
  const e=ui.se,builtIn=e.key&&SESS_BASE[e.key],edited=builtIn&&(state.sessEdits||{})[e.key],cardioBuiltIn=builtIn&&(e.kind==='interval'||e.kind==='zone2');
  return `<div class="habit-head"><button class="icon-btn" data-act="sebask" aria-label="Tilbage" data-back>‹</button><h2 class="h2">${e.key?'Rediger pas':'Opret pas'}</h2></div>
  <section class="card">
    <label class="field"><span>Navn</span><input id="se-name" data-bind="se.name" value="${esc(e.name)}" placeholder="Fx Overkrop"></label>
    ${builtIn?'':`<div class="field"><span>Type</span><div class="fmt-grid">${SE_KINDS.map(([v,l,d])=>`<button class="fmt${e.kind===v?' on':''}" data-act="sekind" data-v="${v}"><b>${l}</b><small>${d}</small></button>`).join('')}</div></div>`}
  </section>
  ${e.kind==='styrke'?strEditor(e)
  :seOtherEditor(e)}
  ${!e.mode?'':`<section class="card"><label class="field"><span>Note (valgfri)</span><input id="se-note" data-bind="se.note" value="${esc(e.note)}" placeholder="Fx et godt råd til dig selv"></label></section>
  <button class="btn accent" data-act="sesave">Gem pas</button>`}
  ${edited?'<button class="btn ghost" data-act="sereset">Gendan det oprindelige pas</button>':''}
  ${e.key&&!builtIn?`<button class="btn danger${ui.seDel?' armed':''}" data-act="sedel">${ui.seDel?'Tryk igen for at slette':'Slet pas'}</button>`:''}`;
}
function viewPick(){const g=ui.pick.g||'',have=STR_LIB.filter(strOk),list=g?have.filter(x=>x[2]===g):have;
  return `<div class="habit-head"><button class="icon-btn" data-act="pickback" aria-label="Tilbage" data-back>‹</button><h2 class="h2">Vælg øvelse</h2></div>
  <section class="card"><input id="pk-q" type="search" placeholder="Søg, fx squat eller roning" autocomplete="off">
    <div class="chips"><button class="${g?'':'on'}" data-act="pickg" data-v="">Alle</button>${STR_GROUPS.map(x=>`<button class="${g===x?'on':''}" data-act="pickg" data-v="${x}">${x}</button>`).join('')}</div></section>
  <section class="card" id="pk-list">${(g?[g]:STR_GROUPS).map(gr=>{const xs=list.filter(x=>x[2]===gr);return xs.length?`<div class="pk-grp"><h3 class="sec">${gr}</h3>${xs.map(x=>`<button class="pk-row" data-act="pickex" data-n="${esc(x[0])}" data-q="${esc((x[0]+' '+x[1]+' '+x[2]).toLowerCase())}"><b>${esc(x[0])}</b><small>${esc(x[1])} · ${x[4]}×${x[5]}</small></button>`).join('')}</div>`:''}).join('')}
    <p class="hint">Mangler en øvelse? Skriv navnet direkte i feltet på passet.</p></section>`}
function logItem(l){
  const map={styrke:['styrke','Styrke'],kondition:['interval','Kondition'],vaegt:['vaegt','Vægt'],test:['test','Test'],mobilitet:['mobilitet','Mobilitet'],kulde:['kulde','Koldt bad'],meditation:['meditation','Meditation'],tak:['tak','Taknemmelighed'],crossfit:['crossfit','CrossFit']};
  const [k,lab]=map[l.type]||(findHabit(l.type)?[l.type,'Vane']:['hvile','Log']);let title='',detail='';
  if(l.type==='styrke'){title=esc(l.sess||'Styrke');
    const g=new Map();l.sets.forEach(s=>{const k=s.ex;if(!g.has(k))g.set(k,[]);g.get(k).push(s)});
    detail=[...g].map(([ex,ss])=>`${esc(ex)}: ${ss.map(s=>`${(s.saet||1)>1?s.saet+'×':''}${s.kg?fnum(s.kg,2):'kv'}×${s.reps}${s.rir!=null?'@'+s.rir:''}`).join(', ')}`).join('<br>')}
  else if(l.type==='kondition'){title=esc(l.name);const b=[fmtTime(l.dur)];if(l.dist){b.push(fnum(l.dist,2)+' km',fmtTime(l.dur/l.dist)+' /km')}if(l.hr)b.push(Math.round(l.hr)+' bpm');if(l.rpe)b.push('hårdhed '+l.rpe);detail=b.join(' · ')+(l.note?' · '+esc(l.note):'')}
  else if(l.type==='vaegt'){title=fnum(l.kg)+' kg'}
  else if(l.type==='mobilitet'){title=esc(l.name);detail=Math.round(l.dur/60)+' min'}
  else if(l.type==='kulde'||l.type==='meditation'){title=fmtTime(l.sec)}
  else if(l.type==='tak'){title=l.text?esc(l.text.split('\n')[0]).slice(0,80):'Skrevet på papir'}
  else if(l.type==='crossfit'){title=esc(l.name);detail=[l.score,l.rpe?'hårdhed '+l.rpe:'',l.note].filter(Boolean).map(esc).join(' · ')}
  else if(l.type==='test'){title=esc(l.name);detail=fmtVal(l.value,l.unit)}
  else{const h=findHabit(l.type);title=h?esc(h.name):'Vane';detail=l.sec?fmtTime(l.sec):'Gjort'}
  const armed=ui.pendingDel===l.id;
  return `<div class="log"><div class="meta">${chip(k,lab)}<span class="muted small num">${shortDate(l.date)}</span><button class="del${armed?' confirm':''}" data-act="del" data-id="${l.id}">${armed?'Bekræft slet':'Slet'}</button></div><p class="lt">${title}</p>${detail?`<p class="ld num">${detail}</p>`:''}</div>`;
}
const WARM=['squat','bænkpres','dødløft','militærpres','frontsquat'];
function warmup(ex,kg){
  const k=String(ex||'').trim().toLowerCase();if(!WARM.includes(k)||!(kg>=40))return '';
  const r=x=>Math.max(20,Math.round(x/2.5)*2.5);
  const s=k==='dødløft'?[[.4,5],[.6,3],[.8,2]]:[[0,8],[.5,5],[.7,3],[.85,1]];
  return s.map(([p,n])=>`${p?fnum(r(kg*p)):'20'} × ${n}`).join(' · ');
}
const restSec=ex=>WARM.includes(String(ex||'').trim().toLowerCase())?180:120;
function setLine(i,j,s,p,tq){
  const id=`s${i}-${j}`;
  return `<div class="set${s.done?' done':''}">
    <span class="sn num">${j+1}</span>
    <input id="${id}-kg" class="num" inputmode="decimal" value="${esc(s.kg)}" data-set="${i}.${j}" data-f="kg" placeholder="${p&&p.kg?fnum(p.kg,2):'kg'}" aria-label="Sæt ${j+1} kg">
    <input id="${id}-reps" class="num" inputmode="numeric" value="${esc(s.reps)}" data-set="${i}.${j}" data-f="reps" placeholder="${p?p.reps:'reps'}" aria-label="Sæt ${j+1} reps">
    <input id="${id}-rir" class="num" inputmode="numeric" value="${esc(s.rir)}" data-set="${i}.${j}" data-f="rir" placeholder="${tq??'–'}" aria-label="Sæt ${j+1} gentagelser tilbage">
    <button type="button" class="chk" data-act="setdone" data-i="${i}" data-j="${j}" aria-pressed="${s.done}" aria-label="Sæt ${j+1} færdigt">✓</button>
    <span class="prev num">${p?`Sidst ${p.kg?fnum(p.kg,2)+' kg':'kropsvægt'} × ${p.reps}${p.rir!=null?' @ '+p.rir:''}`:'Første gang'}</span>
  </div>`;
}
function formStyrke(){
  const doneN=ui.rows.reduce((a,r)=>a+r.sets.filter(s=>s.done).length,0),allN=ui.rows.reduce((a,r)=>a+r.sets.length,0);
  return `<label class="field"><span>Pas</span><select id="f-sess">${['A','B','C'].concat(customKeys('styrke')).map(k=>`<option value="${k}"${ui.sess===k?' selected':''}>${SESS[k].name}</option>`).join('')}<option value="X"${ui.sess==='X'?' selected':''}>Andet styrkepas</option></select></label>
  <div class="rows">${ui.rows.map((r,i)=>{const g=suggest(r.ex),prev=lastSets(r.ex);const tq=r.tRir??(target(r.ex)||{}).rir;const tr=r.tReps??(target(r.ex)||{}).reps;
    const wu=warmup(r.ex,num(r.sets[0]&&r.sets[0].kg));const dn=r.sets.filter(s=>s.done).length;return `<div class="srow card">
    <div class="row-between"><input id="r${i}-ex" class="exin" value="${esc(r.ex)}" placeholder="Øvelse" data-row="${i}" data-f="ex" data-ac="ex" autocomplete="off" aria-label="Øvelse"><span class="muted small num">${dn}/${r.sets.length}</span><button class="x" data-act="rmrow" data-i="${i}" aria-label="Fjern øvelse">×</button></div>
    ${tr||tq!=null||g?`<p class="hint num">${tr?`Mål: ${r.sets.length} sæt × ${tr}`:''}${tq!=null?` · ${tq} i tanken`:''}${g?` · Forslag <b class="sugb">${esc(g.text)}</b>`:''}</p>`:''}
    ${wu?`<p class="hint num">Opvarmning: ${wu}</p>`:''}
    <div class="sets"><div class="set head"><span>Sæt</span><span>kg</span><span>Gentagelser</span><span>Tilbage i tanken</span><span></span></div>
      ${r.sets.map((s,j)=>setLine(i,j,s,prev[j],tq)).join('')}</div>
    <div class="setbtns"><button type="button" class="restbtn" data-act="addset" data-i="${i}">+ Sæt</button>${r.sets.length>1?`<button type="button" class="restbtn" data-act="rmset" data-i="${i}">− Sæt</button>`:''}</div>
  </div>`}).join('')}</div>
  <button class="btn ghost" data-act="addrow">+ Tilføj øvelse</button>
  <datalist id="exlist">${allExercises().map(e=>`<option value="${esc(e)}">`).join('')}</datalist>
  ${allN?`<p class="hint num">${doneN} af ${allN} sæt færdige.${doneN&&doneN<allN?' Kun færdige sæt gemmes.':''}</p>`:''}`;
}
function formKond(){
  const k=ui.k;
  return `<label class="field"><span>Pas</span><select id="k-sess" data-bind="k.sess">${['I4','I5','I30','I30B','Z2','Z2L'].map(x=>`<option value="${x}"${k.sess===x?' selected':''}>${SESS[x].name}</option>`).join('')}<option value="X"${k.sess==='X'?' selected':''}>Andet (løb, cykel, march)</option></select></label>
  <div class="duo"><label><span>Tid · min</span><input id="k-min" inputmode="numeric" value="${esc(k.min)}" data-bind="k.min" placeholder="40"></label><label><span>Sek</span><input id="k-sek" inputmode="numeric" value="${esc(k.sek)}" data-bind="k.sek" placeholder="00"></label></div>
  <div class="trio"><label><span>Km</span><input id="k-dist" inputmode="decimal" value="${esc(k.dist)}" data-bind="k.dist" placeholder="8,2"></label><label><span>Snitpuls</span><input id="k-hr" inputmode="numeric" value="${esc(k.hr)}" data-bind="k.hr" placeholder="155"></label><label><span>Hårdhed 1–10</span><select id="k-rpe" data-bind="k.rpe"><option value="">–</option>${[5,6,7,8,9,10].map(n=>`<option${String(k.rpe)===String(n)?' selected':''}>${n}</option>`).join('')}</select></label></div>
  <label class="field"><span>Note</span><input id="k-note" value="${esc(k.note)}" data-bind="k.note" placeholder="Fx cykel, 4×4 på 280 W"></label>
  <button class="restbtn${k.race||(SESS[k.sess]&&SESS[k.sess].rtest)?' on':''}" data-act="krace">${k.race||(SESS[k.sess]&&SESS[k.sess].rtest)?'✓ ':''}Løb på tid (test eller løb)</button>
  ${k.race||(SESS[k.sess]&&SESS[k.sess].rtest)?'<p class="hint">Tiden og distancen opdaterer dit VDOT og dine løbetempoer.</p>':''}
  <p class="hint">Hårdhed: 1 er helt let, 10 er alt hvad du har. Kommer du længere ved samme puls end sidst, er din kondition blevet bedre.</p>`;
}
function formVaegt(){
  return `<label class="field"><span>Kropsvægt (kg)</span><input id="v-kg" inputmode="decimal" value="${esc(ui.v.kg)}" data-bind="v.kg" placeholder="82,5"></label>
  <p class="hint">Vej dig på samme tid af dagen, fx om morgenen før morgenmad.</p>`;
}
function formTest(){
  const t=ui.t,ph={tid:'12:30','kg':'140','m':'2950','reps':'15','ml/kg/min':'52'}[t.unit];
  return `<label class="field"><span>Test</span><input id="t-name" data-ac="test" autocomplete="off" value="${esc(t.name)}" data-bind="t.name" placeholder="Fx 3 km løb"></label>
  <datalist id="tlist">${[...new Set([...TESTS,...testNames()])].map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
  <div class="duo"><label><span>Resultat</span><input id="t-val" inputmode="${t.unit==='tid'?'text':'decimal'}" value="${esc(t.val)}" data-bind="t.val" placeholder="${ph}"></label>
  <label><span>Enhed</span><select id="t-unit" data-bind="t.unit">${['tid','kg','m','reps','ml/kg/min'].map(u=>`<option value="${u}"${t.unit===u?' selected':''}>${u==='tid'?'tid (mm:ss)':u}</option>`).join('')}</select></label></div>`;
}
function viewLog(){
  const t=ui.logType,recent=trainLogs().sort(byDate).reverse().slice(0,5);
  return `<div class="habit-head"><button class="icon-btn" data-act="logback" aria-label="Tilbage" data-back>‹</button><h2 class="h2">${{styrke:'Træning',kondition:'Kondition',vaegt:'Log vægt',test:'Log test'}[t]}</h2></div>
  <label class="field"><span>Dato</span><input type="date" id="f-date" value="${ui.logDate}"></label>
  ${t==='styrke'?formStyrke():t==='kondition'?formKond():t==='vaegt'?formVaegt():formTest()}
  <button class="btn primary" data-act="save">${t==='styrke'?'Afslut og gem pas':'Gem'}</button>
  ${recent.length?`<section><h3 class="sec">Seneste</h3><div class="card">${recent.map(logItem).join('')}</div></section>`:''}`;
}
function chart(pts,fmt,kind){
  if(pts.length<2)return `<p class="empty">${pts.length?'Log én gang mere for at se en kurve.':'Ingen data endnu.'}</p>`;
  pts=[...pts].sort((a,b)=>a.x-b.x);
  const W=320,H=130,pl=6,pr=6,pt=20,pb=20;
  let x0=pts[0].x,x1=pts[pts.length-1].x;if(x1===x0)x1=x0+1;
  const ys=pts.map(p=>p.y);let y0=Math.min(...ys),y1=Math.max(...ys);if(y1===y0){y0-=1;y1+=1}const py=(y1-y0)*.15;y0-=py;y1+=py;
  const X=x=>pl+(x-x0)/(x1-x0)*(W-pl-pr),Y=y=>pt+(1-(y-y0)/(y1-y0))*(H-pt-pb);
  const line=pts.map((p,i)=>(i?'L':'M')+X(p.x).toFixed(1)+' '+Y(p.y).toFixed(1)).join(' ');
  const area=line+` L${X(pts[pts.length-1].x).toFixed(1)} ${H-pb} L${X(x0).toFixed(1)} ${H-pb} Z`;
  const last=pts[pts.length-1],lx=X(last.x),ly=Y(last.y);
  const grid=[0,.5,1].map(f=>{const y=(pt+f*(H-pt-pb)).toFixed(1);return `<line class="grid" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`}).join('');
  const dots=pts.length<=24?pts.slice(0,-1).map(p=>`<circle class="pt" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.2"/>`).join(''):'';
  const fd=d=>{const t=new Date(d);return `${t.getDate()}/${t.getMonth()+1}`};
  return `<svg class="chart k-${kind}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Udvikling over tid">${grid}<path class="ar" d="${area}"/><path class="ln" d="${line}"/>${dots}<circle class="end" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4.5"/>
  <text class="ev" x="${Math.min(lx,W-2).toFixed(1)}" y="${Math.max(ly-9,11).toFixed(1)}" text-anchor="end">${fmt(last.y)}</text>
  <text x="0" y="${H-4}">${fd(pts[0].x)}</text><text x="${W}" y="${H-4}" text-anchor="end">${fd(last.x)}</text></svg>`;
}
function viewHabits(){
  return `<h2 class="h2">Vaner</h2>
  <p class="hint">Tryk på en vane for at gå i gang. Målene vokser hver uge.</p>
  <div class="hab-list">${habits().map(h=>habitBtn(h)).join('')}</div>
  <button class="btn ghost" data-act="nhopen">+ Tilføj vane</button>
  <section class="card"><h3 class="sec">Streak</h3><div class="goals">${habits().map(h=>{const st=habitStreak(h.id);return `<div class="goal k-${h.id}"><span class="gl">${h.name}</span><span class="gv num"><b>${st}</b> ${st===1?'dag':'dage'} i træk</span></div>`}).join('')}</div></section>`;
}
const planGroups=()=>[['Styrke',['S'].concat(customKeys('styrke'))],['Intervaller',['I4','I5','I30','I30B'].concat(customKeys('interval'))],['Rolig kondition (zone 2)',['Z2','Z2L'].concat(customKeys('zone2'))],['CrossFit',['CF'].concat(customKeys('crossfit'))],['Mobilitet',['MOB','BAL'].concat(customKeys('mobilitet').filter(k=>state.customSess[k].label!=='Aktiv restitution'))],['Aktiv restitution',['AR1','AR2','AR3','AR4','AR5'].concat(customKeys('mobilitet').filter(k=>state.customSess[k].label==='Aktiv restitution'))],['Hvile',['R']]];
const SHORT={S:'Styrke',A:'Styrke A',B:'Styrke B',C:'Styrke C',I4:'4 × 4 min',I5:'5 × 4 min',I30:'30/15 sek',I30B:'30/15 sek · 4 serier',Z2:'Rolig · 45 min',Z2L:'Rolig · 60 min',CF:'CrossFit',MOB:'Mobilitet',BAL:'Balance',R:'Hvile'};
/* One row per day; tap a day to pick its session with buttons. ctx 'st' edits the saved plan, 'ob' the first-run draft. */
function weekEditor(ctx,plan,addons){
  return `<div class="wk">${[1,2,3,4,5,6,0].map(d=>{const k=plan[d]||'R',se=SESS[k],ad=addons[d]||'',open=ui.wkOpen===ctx+d;
    const sub=[se.dur,ad?'+ '+SHORT[ad].toLowerCase():''].filter(Boolean).join(' · ');
    return `<button class="wkrow k-${se.kind}${open?' open':''}${k==='R'?' rest':''}" data-act="wkopen" data-v="${ctx+d}"><span class="wd-d">${DAYS[d].slice(0,3)}</span>
      <span class="wd-n"><span class="bar"></span><span>${esc(se.name)}${sub?`<small>${esc(sub)}</small>`:''}</span></span><span class="chev">›</span></button>
      ${open?`<div class="wkpick">${planGroups().map(([g,ks])=>`<div><p class="lbl">${g}</p><div class="chips">${ks.map(x=>`<button class="${k===x?'on':''}" data-act="wkset" data-ctx="${ctx}" data-d="${d}" data-v="${x}">${esc(SHORT[x]||SESS[x].name)}</button>`).join('')}</div></div>`).join('')}
        ${se.kind==='hvile'||se.kind==='mobilitet'?'':`<div><p class="lbl">Bagefter</p><div class="chips">${[['','Intet'],['MOB','+ Mobilitet'],['BAL','+ Balance']].map(([v,l])=>`<button class="${ad===v?'on':''}" data-act="wkadd" data-ctx="${ctx}" data-d="${d}" data-v="${v}">${l}</button>`).join('')}</div></div>`}
        <button class="restbtn" data-act="wkopen" data-v="">Færdig</button></div>`:''}`}).join('')}</div>`;
}
function customWeekCard(){
  const cnt={};[1,2,3,4,5,6,0].forEach(d=>{const k=SESS[state.plan[d]||'R'].kind;cnt[k]=(cnt[k]||0)+1});
  const sum=['styrke','interval','zone2','crossfit','mobilitet','hvile'].filter(k=>cnt[k]).map(k=>`${cnt[k]} ${KIND_LABEL[k].toLowerCase()}`).join(' · ');
  return `<section class="card"><div class="row-between"><h3 class="sec">Din uge</h3><span class="muted small">${sum}</span></div>
    ${weekEditor('st',state.plan,state.addons||{})}
    <label class="field inline"><span>Let uge hver ${DELOAD_EVERY}. uge</span><select id="cdl" data-cdeload="1"><option value="1"${state.customDeload!==false?' selected':''}>Til</option><option value="0"${state.customDeload===false?' selected':''}>Fra</option></select></label>
    <button class="btn ghost" data-act="obstart">Planlæg ugen forfra</button>
  </section>`;
}
function syncCustom(){if(state.program==='custom'){state.customPlan={...state.plan};state.customAddons={...(state.addons||{})}}}
