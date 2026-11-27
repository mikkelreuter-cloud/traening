/* Fanen Udvikling (mål, styrke, løbeform, kondition, tests, vægt) og Indstillinger. */
/* ---------- Udvikling: mål, styrke, kondition, tests, kropsvægt og historik ---------- */
const GOAL_T={lift:'Løft',test:'Løbetest',vaegt:'Kropsvægt',week:'Pas pr. uge'};
function liftBest(ex){const k=String(ex||'').toLowerCase();let b=0;logsOf('styrke').forEach(l=>(l.sets||[]).forEach(s=>{if(s.ex.toLowerCase()===k&&s.kg>0)b=Math.max(b,e1rm(s.kg,s.reps+(s.rir||0)))}));return b}
function goalState(g){
  if(g.type==='lift'){const c=liftBest(g.ex);return {label:g.ex,cur:c?fnum(c,1)+' kg':'–',tgt:fnum(g.kg)+' kg',pct:c?c/g.kg:0,sub:'anslået max for én løft'}}
  if(g.type==='test'){const L=logsOf('test').filter(l=>l.name===g.name&&l.unit==='tid'),b=L.length?Math.min(...L.map(l=>l.value)):0;return {label:g.name,cur:b?fmtTime(b):'–',tgt:fmtTime(g.secs),pct:b?g.secs/b:0,sub:'bedste tid'}}
  if(g.type==='vaegt'){const W=logsOf('vaegt');if(!W.length)return {label:'Kropsvægt',cur:'–',tgt:fnum(g.kg)+' kg',pct:0,sub:'seneste måling'};
    const f=W[0].kg,l=W[W.length-1].kg,span=f-g.kg;return {label:'Kropsvægt',cur:fnum(l)+' kg',tgt:fnum(g.kg)+' kg',pct:span===0?1:(f-l)/span,sub:'seneste måling'}}
  const wk=weekDates(TODAY),n=wk.filter(d=>sessFor(d).kind!=='hvile'&&isDone(d)).length;return {label:'Pas denne uge',cur:String(n),tgt:String(g.n),pct:n/g.n,sub:'gennemført'}}
function goalForm(){const f=ui.goal;
  return `<div class="goal-form"><div class="chips">${Object.entries(GOAL_T).map(([k,v])=>`<button class="${f.type===k?'on':''}" data-act="goaltype" data-v="${k}">${v}</button>`).join('')}</div>
  ${f.type==='lift'?`<label class="field"><span>Øvelse</span><input id="g-ex" data-bind="goal.ex" data-ac="ex" autocomplete="off" value="${esc(f.ex||'')}" placeholder="Fx Squat"></label><label class="field"><span>Mål (kg for én løft)</span><input id="g-kg" inputmode="decimal" data-bind="goal.kg" value="${esc(f.kg||'')}" placeholder="Fx 120"></label>`:''}
  ${f.type==='test'?`<label class="field"><span>Test</span><input id="g-name" data-bind="goal.name" data-ac="test" autocomplete="off" value="${esc(f.name||'3 km løb')}"></label><label class="field"><span>Måltid (mm:ss)</span><input id="g-time" data-bind="goal.time" value="${esc(f.time||'')}" placeholder="Fx 12:30"></label>`:''}
  ${f.type==='vaegt'?`<label class="field"><span>Målvægt (kg)</span><input id="g-vkg" inputmode="decimal" data-bind="goal.kg" value="${esc(f.kg||'')}" placeholder="Fx 80"></label>`:''}
  ${f.type==='week'?`<label class="field"><span>Antal pas pr. uge</span><input id="g-n" inputmode="numeric" data-bind="goal.n" value="${esc(f.n||'')}" placeholder="Fx 4"></label>`:''}
  <div class="btns3" style="grid-template-columns:1fr 2fr"><button class="btn ghost" data-act="goalcancel">Annullér</button><button class="btn accent" data-act="goalsave">Gem mål</button></div></div>`}
function vdFormInfo(){const f=ui.vdf,sec=parseTime(f&&f.t);if(!f||!sec||sec/f.km<150||sec/f.km>720)return '';return `<p class="hint num">VDOT ${fmtKm(vdotOf(f.km,sec))}</p>`}
function vdCard(){const c=curVdot(),H=vdHist();
  const form=ui.vdf?`<div class="vd-f"><div class="chips">${[3,5,10,21.1].map(k=>`<button class="${ui.vdf.km===k?'on':''}" data-act="vdkm" data-v="${k}">${k===21.1?'Halvmaraton':k+' km'}</button>`).join('')}</div>
    <label class="field"><span>Tid</span><input id="vd-tt" inputmode="numeric" value="${esc(ui.vdf.t)}" placeholder="22:30"></label><div id="vd-pv">${vdFormInfo()}</div><button class="btn accent" data-act="vdsave">Gem tid</button></div>`:'';
  const btn=`<button class="linkbtn" data-act="vdopen">${ui.vdf?'Luk':'+ Ny tid'}</button>`;
  if(!c)return `<section class="card"><div class="row-between"><h3 class="sec">Løbeform</h3>${btn}</div>${form||'<p class="empty">Skriv en tid fra et løb eller en test, så regner appen dine træningstempoer ud.</p>'}</section>`;
  const V=c.v,z=[['Rolig','E',`${fmtPace(zPace(V,'E'))}–${fmtPace(vdPace(V,ZONES.E[2]))}`],['Maraton','M'],['Tærskel','T'],['Interval','I'],['Gentagelser','R']];
  const pts=H.map(x=>({x:pd(x.date).getTime(),y:x.v}));
  return `<section class="card"><div class="row-between"><h3 class="sec">Løbeform</h3>${btn}</div>
    <div class="big"><b class="num">${fmtKm(V)}</b><span>VDOT</span><em class="num">Fra ${fmtKm(c.km)} km på ${fmtTime(c.sec)} · ${shortDate(c.date)}</em></div>
    <div class="vd-z">${z.map(([n,k,t])=>`<div><span>${n}</span><b class="num">${t||fmtPace(zPace(V,k))}</b></div>`).join('')}</div><p class="hint">Tempo pr. km. Planens løbepas bruger dem automatisk.</p>
    <div class="vd-z">${[[5,'5 km'],[10,'10 km'],[21.0975,'Halvmaraton'],[42.195,'Maraton']].map(([k,n])=>`<div><span>${n}</span><b class="num">${fmtTime(vdPredict(V,k))}</b></div>`).join('')}</div><p class="hint">Forventede tider med din form nu.</p>
    ${pts.length>1?chart(pts,v=>fmtKm(v),'interval'):''}${form}</section>`}
function viewProg(){
  const goals=state.goals||[];
  const G=`<section class="card"><div class="row-between"><h3 class="sec">Dine mål</h3>${ui.goal?'':`<button class="linkbtn" data-act="goalnew">+ Nyt mål</button>`}</div>
    ${goals.map(g=>{const st=goalState(g),pc=Math.max(0,Math.min(1,st.pct));return `<div class="gl"><div class="row-between"><b>${esc(st.label)}</b><button class="gl-x" data-act="goaldel" data-id="${g.id}" aria-label="Slet mål">×</button></div>
      <div class="gl-nums"><span class="num">${st.cur}</span><span class="muted small">${st.sub} · mål ${st.tgt}</span></div>
      <div class="meter"><i style="width:${Math.round(pc*100)}%"></i></div>${pc>=1?'<p class="small ok">✓ Mål nået</p>':''}</div>`}).join('')}
    ${!goals.length&&!ui.goal?'<p class="empty">Sæt et mål, fx et løft, en løbetid eller antal pas om ugen.</p>':''}
    ${ui.goal?goalForm():''}</section>`;
  // Strength
  const exs=loggedExercises();const ex=exs.includes(ui.progEx)?ui.progEx:exs[0];let sHtml='';
  if(ex){const k=ex.toLowerCase(),pts=[];let bw=true;
    logsOf('styrke').forEach(l=>l.sets.forEach(s=>{if(s.ex.toLowerCase()===k&&s.kg>0)bw=false}));
    logsOf('styrke').forEach(l=>{const ss=l.sets.filter(s=>s.ex.toLowerCase()===k);if(!ss.length)return;pts.push({x:pd(l.date).getTime(),y:Math.max(...ss.map(s=>bw?s.reps:e1rm(s.kg,s.reps+(s.rir||0))))})});
    const best=Math.max(...pts.map(p=>p.y)),l=lastSet(ex),g=goals.find(x=>x.type==='lift'&&x.ex.toLowerCase()===k);
    sHtml=`<label class="field"><span>Øvelse</span><select id="p-ex">${exs.map(e=>`<option${e===ex?' selected':''}>${esc(e)}</option>`).join('')}</select></label>
    <div class="big"><b class="num">${bw?best:fnum(best,1)}</b><span>${bw?'gentagelser (bedste sæt)':'kg · anslået max for én løft'}</span>${l?`<em class="num">Sidst: ${l.kg?fnum(l.kg)+' kg':'kropsvægt'} · ${l.saet}×${l.reps}${g?` · mål ${fnum(g.kg)} kg`:''}</em>`:''}</div>
    ${chart(pts,v=>bw?Math.round(v)+' reps':fnum(v)+' kg','styrke')}`}
  // Condition: minutes per week for the last 8 weeks + latest sessions
  const K=logsOf('kondition');let kHtml='';
  if(K.length){const mon=mondayOf(TODAY),wk=[];for(let i=7;i>=0;i--){const st=ds(new Date(pd(mon).getFullYear(),pd(mon).getMonth(),pd(mon).getDate()-7*i)),en=ds(new Date(pd(st).getFullYear(),pd(st).getMonth(),pd(st).getDate()+6));
      wk.push({x:pd(st).getTime(),y:Math.round(K.filter(l=>l.date>=st&&l.date<=en).reduce((a,l)=>a+(l.dur||0),0)/60)})}
    const last4=wk.slice(-4).reduce((a,w)=>a+w.y,0);
    kHtml=`<div class="big"><b class="num">${last4}</b><span>min de sidste 4 uger</span></div>${chart(wk,v=>Math.round(v)+' min','interval')}
      <div class="k-list">${K.slice(-5).reverse().map(l=>`<div class="k-row"><span>${esc(l.name||'Kondition')}</span><span class="muted small num">${shortDate(l.date)} · ${Math.round((l.dur||0)/60)} min${l.dist?` · ${fnum(l.dist)} km`:''}${l.hr?` · puls ${l.hr}`:''}</span></div>`).join('')}</div>`}
  // Tests
  const tn=testNames();const tsel=tn.includes(ui.progTest)?ui.progTest:tn[0];let tHtml='';
  if(tsel){const L=logsOf('test').filter(l=>l.name===tsel),unit=L[L.length-1].unit,lower=unit==='tid';
    const best=lower?Math.min(...L.map(l=>l.value)):Math.max(...L.map(l=>l.value));
    tHtml=`<label class="field"><span>Test</span><select id="p-test">${tn.map(n=>`<option${n===tsel?' selected':''}>${esc(n)}</option>`).join('')}</select></label>
    <div class="big"><b class="num">${unit==='tid'?fmtTime(best):fnum(best,2)}</b><span>${unit==='tid'?'bedste tid':'bedste · '+esc(unit)}</span></div>
    ${chart(L.filter(l=>l.unit===unit).map(l=>({x:pd(l.date).getTime(),y:l.value})),v=>fmtVal(v,unit),'test')}`}
  // Body weight
  const W=logsOf('vaegt');let wHtml='';
  if(W.length){const last=W[W.length-1],first=W[0],diff=last.kg-first.kg;
    wHtml=`<div class="big"><b class="num">${fnum(last.kg)}</b><span>kg</span>${W.length>1?`<em class="num">${diff>0?'+':diff<0?'−':'±'}${fnum(Math.abs(diff))} kg siden ${shortDate(first.date)}</em>`:''}</div>${chart(W.map(l=>({x:pd(l.date).getTime(),y:l.kg})),v=>fnum(v)+' kg','vaegt')}`}
  const all=trainLogs().sort(byDate).reverse();
  const sec=(t,body,empty,btn)=>`<section class="card"><div class="row-between"><h3 class="sec">${t}</h3>${btn||''}</div>${body||`<p class="empty">${empty}</p>`}</section>`;
  return `${G}
  ${sec('Styrke',sHtml,'Når du har logget et styrkepas, kan du følge dine løft her.')}
  ${vdCard()}
  ${sec('Kondition',kHtml,'Når du har logget et konditionspas, kan du følge dine minutter her.')}
  ${sec('Tests',tHtml,'Tag en test, fx 3 km løb, og se om du bliver hurtigere.','<button class="linkbtn" data-act="logtest">+ Log test</button>')}
  ${sec('Kropsvægt',wHtml,'Vej dig en gang imellem og se udviklingen.','<button class="linkbtn" data-act="logvaegt">+ Log vægt</button>')}
  ${all.length?`<section><h3 class="sec">Historik</h3><div class="card">${all.slice(0,60).map(logItem).join('')}</div></section>`:''}`;
}
function viewSettings(){if(ui.snaps===undefined){ui.snaps=[];snapList().then(l=>{ui.snaps=l;if(ui.view==='settings')render()})}
  return `<div class="habit-head"><button class="icon-btn" data-act="setback" aria-label="Tilbage" data-back>‹</button><h2 class="h2">Indstillinger</h2></div>
  <section class="card"><h3 class="sec">Dig</h3>
    <label class="field"><span>Navn</span><input id="nm" value="${esc(state.name||'')}" placeholder="Dit navn"></label></section>
  <section class="card"><h3 class="sec">Udseende</h3>
    <div class="field"><span>Tema</span><div class="chips">${[['auto','Som telefonen'],['dark','Mørk'],['light','Lys']].map(([k,l])=>`<button class="${(state.theme||'auto')===k?'on':''}" data-act="settheme" data-v="${k}">${l}</button>`).join('')}</div></div>
    <div class="field"><span>Accentfarve</span><div class="swatches">${Object.entries(ACCENTS).map(([k,[l,c]])=>`<button class="sw${(state.accent||'orange')===k?' on':''}" data-act="setaccent" data-v="${k}" aria-label="${l}" style="--c:${c}"><i></i><span>${l}</span></button>`).join('')}</div></div></section>
  <section class="card"><h3 class="sec">Puls</h3>
    <label class="field"><span>Makspuls (slag i minuttet)</span><input id="hrmax" inputmode="numeric" value="${state.hrmax||''}" placeholder="fx 190"></label>
    <p class="hint">Bruges til at vise dine pulszoner i intervaller og zone 2, så du ved hvor hårdt du skal arbejde. Kender du den ikke, så brug 208 − 0,7 × din alder.</p>
    ${state.hrmax?`<p class="hint num">Zone 2: ${hr(.6)}–${hr(.7)} · Intervaller: ${hr(.9)}–${hr(.95)}</p>`:''}</section>
  <section class="card"><h3 class="sec">Dine data</h3>
    <p class="hint">Alt gemmes automatisk på telefonen${persisted===true?', og browseren har lovet ikke at rydde det':persisted===false?'. Browseren kan rydde det, hvis telefonen mangler plads, så tag en backup jævnligt':''}. Appen gemmer også selv en kopi hver dag de seneste 5 dage.</p>
    <p class="small">Sidste backup: <b>${state.lastBackup?shortDate(state.lastBackup):'aldrig'}</b></p>
    <button class="btn accent" data-act="bkshare">Gem backup (Drive, mail, Filer)</button>
    <label class="btn ghost file-btn">Gendan fra fil<input type="file" id="bk-file" accept=".json,application/json"></label>
    ${ui.pendingRestore?`<button class="btn danger armed" data-act="restore">Tryk igen: erstat alle data med backuppen</button>`:''}
    ${(ui.snaps||[]).length?`<div class="field"><span>Automatiske kopier</span>${ui.snaps.map(x=>`<button class="snap-row${ui.pendingSnap===x.t?' armed':''}" data-act="snaprestore" data-t="${x.t}"><span>${cap(niceDate(x.date))}</span><span class="muted small num">${x.n} logs</span><b>${ui.pendingSnap===x.t?'Tryk igen':'Gendan'}</b></button>`).join('')}</div>`:''}
    <button class="restbtn" data-act="bktog">${ui.bk?'Skjul':'Backup som tekst'}</button>
    ${ui.bk?`<button class="btn ghost" data-act="copy">Kopiér backup</button>
    <textarea id="exp" readonly rows="3" hidden aria-label="Backup-tekst"></textarea>
    <label class="field"><span>Gendan fra tekst</span><textarea id="imp" rows="3" data-bind="impText" placeholder="Indsæt backup-tekst her">${esc(ui.impText)}</textarea></label>
    ${ui.pendingRestore?'':`<button class="btn ghost" data-act="restore">Gendan</button>`}`:''}</section>
  <section class="card"><h3 class="sec">Ny i appen?</h3><button class="btn ghost" data-act="tourshow">Vis rundvisning</button></section>
  <section class="card"><h3 class="sec">Nulstil</h3>
    <button class="btn danger${ui.pendingCal?' armed':''}" data-act="wipecal">${ui.pendingCal?'Tryk igen for at rydde kalenderen':'Ryd kalenderen'}</button>
    <p class="hint">Sletter alle planlagte træninger, forløb og din faste uge. Dine logs bliver.</p>
    <button class="btn danger${ui.pendingWipe?' armed':''}" data-act="wipe">${ui.pendingWipe?'Tryk igen for at slette alle logs':'Slet alle logs'}</button></section>`;
}

