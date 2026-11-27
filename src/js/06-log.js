/* Log af styrke: rækker og sæt, kladde, og visning af et pas. */
/* ---------- UI state ---------- */
const now=new Date();
let ui={view:'today',calY:now.getFullYear(),calM:now.getMonth(),sel:TODAY,
  logType:'styrke',logDate:TODAY,sess:'A',rows:[],k:{sess:'I4',min:'',sek:'',dist:'',hr:'',rpe:'',note:''},
  v:{kg:''},t:{name:'',val:'',unit:'tid'},dirty:false,progEx:null,progTest:null,
  pendingDel:null,pendingRestore:false,pendingWipe:false,impText:''};

/* One row per exercise, one line per set. Prefill: kg = next-session suggestion (or last kg), reps + RIR = what you did in that set last time. */
function makeRow(ex,n,tReps,tRir,deload,pct){
  const nP=n,prev=lastSets(ex);let g=suggest(ex);n=deload?Math.max(1,Math.ceil((n||1)/2)):Math.max(n||0,prev.length,1);
  if(deload)g=null;if(pct){const k=kgFor(ex,pct);if(k)g={kg:k};n=Math.max(1,nP||1)}
  const sets=Array.from({length:n},(_,i)=>{const p=prev[i]||prev[prev.length-1];
    const kg=g&&g.kg?g.kg:(p?p.kg:0);
    return {kg:kg?fnum(kg,2):'',reps:pct&&tReps?String(tReps):p?String(p.reps):(tReps?String(tReps):''),rir:p&&p.rir!=null?String(p.rir):'',done:false}});
  return {ex,tReps,tRir,sets};
}
function initRows(k){const dl=isDeload(ui.logDate||TODAY),S=SESS[k];ui.rows=S.ex.map(([n,s,r,q])=>makeRow(n,s,r,q,dl,S.pct&&S.main===n?S.pct:null));saveDraft()}
const DKEY='styrke-vo2-draft.v1';
function saveDraft(){try{if(ui.logType==='styrke'&&ui.rows.some(r=>r.sets.some(s=>s.done)))localStorage.setItem(DKEY,JSON.stringify({date:ui.logDate,sess:ui.sess,rows:ui.rows,wStart:ui.wStart}));else localStorage.removeItem(DKEY)}catch(e){}}
function loadDraft(){try{const d=JSON.parse(localStorage.getItem(DKEY)||'null');if(d&&d.date===TODAY&&Array.isArray(d.rows))return d}catch(e){}return null}
function clearDraft(){try{localStorage.removeItem(DKEY)}catch(e){}}
function initStyrke(date){
  const d=loadDraft();if(d&&d.date===date){ui.sess=d.sess;ui.rows=d.rows;ui.wStart=d.wStart||null;return}
  const key=sessKey(date),ok=k=>SESS[k]&&SESS[k].kind==='styrke'&&SESS[k].ex;ui.sess=ok(key)?key:(ok(ui.sess)?ui.sess:'A');initRows(ui.sess)}
function openLog(date){
  ui.logFrom=ui.view;ui.logDate=date;const key=sessKey(date),k=SESS[key].kind;
  if(k==='styrke')ui.logType='styrke';else if(k==='interval'||k==='zone2'){ui.logType='kondition';ui.k.sess=key}
  initStyrke(date);ui.dirty=false;ui.view='log';render(true);
}

/* ---------- views ---------- */
function sessionBody(s,date){
  const dl=s.ex&&isDeload(date||TODAY);
  if(s.ex)return `<ul class="ex">${s.ex.map(([n,a,b,q])=>{const g=suggest(n);if(dl)a=Math.ceil(a/2);
    if(s.pct&&s.main===n){const k=kgFor(n,s.pct),m=estMax(n);return `<li><span class="exn">${esc(n)}</span><span class="exp num">${a}×${b}<small>${k?fnum(k)+' kg':q+' i tanken'}</small></span>${k?`<span class="sug num">Planen: ${fnum(k)} kg · ${s.pct} % af dit beregnede max (${fnum(m.kg,0)} kg)</span>`:`<span class="exl">Første gang: find en vægt, du kan løfte ${b} gange med 2 i tanken. Så regner appen dit max ud, og planen viser kg fra næste gang.</span>`}</li>`}
    const line=g?`<span class="sug num">${dl?`Deload: ${g.l.kg?fnum(g.l.kg)+' kg':'kropsvægt'} (samme vægt)`:`Forslag: ${esc(g.text)}`}</span><span class="exl num">Sidst ${g.l.kg?fnum(g.l.kg)+' kg':'kropsvægt'} × ${g.l.reps}${rirTxt(g.l.rir)} (${shortDate(g.l.date)})</span>`
      :`<span class="exl">Første gang: vælg en vægt, hvor du kunne have taget ${q} ${q===1?'gentagelse':'gentagelser'} mere i sidste sæt.</span>`;
    return `<li><span class="exn">${esc(n)}</span><span class="exp num">${a}×${b}<small>${q} i tanken</small></span>${line}</li>`}).join('')}</ul>`;
  if(s.fw){const w=s.w;if(!w)return '';const l=fwL(w.b.lift),p=w.c?cfRebuild(w.c):null;return `<div class="wod"><h3>B) ${esc(l[1])}</h3>${w.b.lines.map(x=>`<p>${esc(withKg(l[1],x))}</p>`).join('')}${p?`<h3 style="margin-top:10px">C) ${esc(p.overskrift)}</h3>${p.linjer.map(x=>`<p>${esc(x)}</p>`).join('')}`:''}</div>`}
  if(s.kind==='crossfit'&&s.cf){const p=cfRebuild(s.cf);return p?cfWod(p):''}
  if(s.kind==='crossfit'&&s.custom&&s.steps)return `<ol class="steps">${s.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
  if(s.kind==='crossfit'){const p=cfRebuild(cfSaved(date||TODAY));return p?cfWod(p):'<p class="note">Intet pas endnu. Vælg format og tid, så bygger appen et pas efter reglerne.</p>'}
  return `<ol class="steps">${s.steps.map(t=>`<li>${esc(zTxt(t,s))}</li>`).join('')}</ol>${s.kind==='interval'||s.kind==='zone2'?hrLine(s)+kondTip(s):''}`;
}
function kondTip(s){
  const L=logsOf('kondition').filter(l=>l.name===s.name),l=L[L.length-1];if(!l)return '';
  const b=[fmtTime(l.dur)];if(l.dist)b.push(fnum(l.dist,2)+' km');if(l.hr)b.push(Math.round(l.hr)+' bpm');if(l.rpe)b.push('hårdhed '+l.rpe);
  let tip;
  if(!l.rpe)tip='Log hvor hårdt det føltes (1–10) næste gang, så kan appen hjælpe dig med tempoet.';
  else if(s.kind==='zone2')tip=l.rpe>=7?'Det var for hårdt til zone 2. Sænk tempoet i dag.':'God intensitet. Hold det roligt igen.';
  else tip=l.rpe<=8?'Lidt for let (målet er 9 ud af 10). Gå hårdere i intervallerne i dag.':l.rpe>=10?'Det var helt maks. Hold samme tempo i dag.':'Rigtig intensitet. Prøv at komme lidt længere eller op i watt i dag.';
  return `<p class="sug num">Sidst (${shortDate(l.date)}): ${b.join(' · ')}</p><p class="hint">${tip}</p>`;
}
