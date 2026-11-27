/* CrossFit: WOD-bygger oven på Passemotoren (window.CF). */
/* ---------- CrossFit ---------- */
const CF_DESC={amrap:'Så mange runder som muligt',rft:'Et antal runder på tid',stige_ned:'Faldende reps, fx 21-15-9',stige_op:'Stigende reps, 1-2-3 …',emom:'Arbejde i starten af hvert minut',exmom:'Arbejde hvert 2. eller 3. minut',interval:'Arbejde og pause i sæt',chipper:'Lang liste, én gang igennem',tabata:'20 sek arbejde, 10 sek pause',doedved:'Én rep mere hvert minut'};
const CF_MIN=[5,8,10,12,15,20,25,30,40,50];
const NIVEAUER=['Begynder','Øvet','Avanceret'];
const cfUdstyrAlle=()=>[...new Set(CF.BEVAEGELSER.map(m=>m.udstyr))].filter(u=>u!=='Ingen udstyr').sort();
const cfMovById=id=>CF.BEVAEGELSER.find(m=>m.id===id);
/* Minute-based formats get their own time options, so the time divides evenly into rounds */
const CF_MIN_FMT={emom:[10,12,14,15,16,18,20,21,24,25,28,30],exmom:[10,12,15,16,18,20,24,30],tabata:[4,9,14,19],interval:[12,15,16,18,20,24,30]};
const CF_MIN_HINT={emom:'Tiden går op i rotationen, så hver øvelse får lige mange runder. Fx 16 min = 4 øvelser × 4 runder. Nogle pas får et hvileminut i rotationen, fx 3 øvelser + 1 hvile × 4 runder. Så er arbejdsminutterne hårdere.',exmom:'Tiden går op i 2 eller 3 minutter, så sidste runde bliver hel.',interval:'Tiden deles i lige store sæt, fx 16 min = 4 sæt à 4 min.',tabata:'Hver øvelse er 4 min (8 × 20/10 sek) med 1 min pause imellem.'};
/* The hint under the time spells out how the chosen minutes split into rounds */
function emomHint(min,a,h){const r=a?min/a:0;
  if(a===1)return `${min} min = samme øvelse hvert minut.`;
  if(a&&h==='ja')return `${min} min = ${a} minutter pr. runde × ${r} runder. ${a-1} ${a-1>1?'øvelser':'øvelse'} + 1 hvileminut, så arbejdsminutterne er hårdere.`;
  if(a&&h==='nej')return `${min} min = ${a} øvelser × ${r} runder.`;
  if(a)return `${min} min = ${a} minutter pr. runde × ${r} runder. Et af minutterne kan blive hvile, og så er de andre hårdere.`;
  if(h==='ja')return 'Hver runde har et hvileminut, så arbejdsminutterne er hårdere. Appen vælger en rundelængde, der går op i tiden.';
  if(h==='nej')return 'Ingen hvileminutter. Appen vælger en rundelængde, der går op i tiden.';
  return 'Appen vælger en rundelængde, der går op i tiden. Nogle gange er et af minutterne hvile, og så er de andre hårdere.'}
function cfMinFor(fmtId){if(CF_MIN_FMT[fmtId]){const a=cfPrefs().antal;if(fmtId==='emom')return a?CF_MIN_FMT.emom.filter(m=>m%a===0&&m/a>=2):[10,12,15,16,18,20,24,30];return CF_MIN_FMT[fmtId]}
  const f=CF.formatFor(fmtId);return f?CF_MIN.filter(m=>f.domaener.includes(CF.domaeneFor(m).id)):CF_MIN}
function cfPrefs(){return {niveau:'Øvet',fokus:'',antal:0,hvile:'auto',udstyr:null,...(state.cfPrefs||{})}}
function cfOpt(){const c=ui.cf,P=cfPrefs();return {format:c.fmt,minutter:c.min,niveau:P.niveau,fokus:P.fokus,antal:P.antal,hvile:P.hvile,udstyr:P.udstyr||[]}}
function cfGenerate(seed){const o=cfOpt();o.seed=seed==null?Math.floor(Math.random()*4294967295):seed;const p=CF.byggePas(o);ui.cf.pas=p;ui.cf.swapI=null;return p}
/* Rebuild a saved workout exactly: same movements, same seed → same reps, rounds and order */
function cfRebuild(sv){if(!sv)return null;const fmt=CF.formatFor(sv.fmtId),movs=sv.ids.map(cfMovById).filter(Boolean);if(!fmt||!movs.length)return null;
  const p=CF.formater(fmt,CF.domaeneFor(sv.min),sv.min,movs,sv.opt,CF.prng(sv.seed));p.seed=sv.seed;p.opt=sv.opt;return p}
const cfSerialize=p=>({fmtId:p.format.id,min:p.minutter,seed:p.seed,opt:p.opt,ids:p.movs.map(m=>m.id),title:p.overskrift});
const cfSaved=d=>{const x=SESS[sessKey(d)];return x&&x.cf||null};
function cfSwap(i,newId){const p=ui.cf.pas,movs=p.movs.slice();movs[i]=cfMovById(newId);
  const np=CF.formater(p.format,p.domaene,p.minutter,movs,p.opt,CF.prng(p.seed));np.seed=p.seed;np.opt=p.opt;ui.cf.pas=np;ui.cf.swapI=null}
function cfAlts(i){const p=ui.cf.pas;return CF.alternativer(p.movs,i,null,p.opt).filter(m=>m.id!==p.movs[i].id&&!p.movs.some(x=>x.id===m.id))}
function cfWod(p){return `<div class="wod"><h3>${esc(p.overskrift)}</h3>${p.linjer.map(l=>`<p>${esc(l)}</p>`).join('')}<span class="muted small">Score: ${esc(p.score)}</span></div>`}
function cfOpen(date,fresh){const sv=cfSaved(date),P=cfPrefs();
  ui.cf={date,step:sv&&!fresh?'pas':'menu',fmt:sv?sv.fmtId:(ui.cf&&ui.cf.fmt)||'amrap',min:sv?sv.min:(ui.cf&&ui.cf.min)||15,pas:sv&&!fresh?cfRebuild(sv):null,swapI:null,showUdstyr:false,res:{score:'',rpe:'',note:''}};
  ui.view='cf';render(true)}
function viewCF(){
  const c=ui.cf;if(!c){ui.view='today';return viewToday()}
  const P=cfPrefs(),back=`<div class="habit-head"><button class="icon-btn" data-act="cfback" aria-label="Tilbage" data-back>‹</button><div><p class="eyebrow">${cap(niceDate(c.date))}</p><h2 class="h2">CrossFit</h2></div></div>`;
  if(c.step==='menu'){
    const mins=c.fmt?cfMinFor(c.fmt):CF_MIN;if(!mins.includes(c.min))c.min=mins.reduce((a,b)=>Math.abs(b-c.min)<Math.abs(a-c.min)?b:a,mins[0]);
    const iv=c.fmt?CF.slotInterval(c.fmt):[2,6];
    const all=cfUdstyrAlle(),have=P.udstyr||all;
    return `${back}
    <section class="card"><h3 class="sec">1 · Vælg format</h3><div class="fmt-grid">
      ${CF.FORMATER.map(f=>`<button class="fmt${c.fmt===f.id?' on':''}" data-act="cffmt" data-v="${f.id}"><b>${esc(f.id==='rft'?'For time':f.navn)}</b><small>${esc(CF_DESC[f.id]||'')}</small></button>`).join('')}
      <button class="fmt any${c.fmt===null?' on':''}" data-act="cffmt" data-v=""><b>Overrask mig</b><small>Reglerne vælger et format, der passer til tiden</small></button></div></section>
    <section class="card"><h3 class="sec">2 · Hvor lang tid?</h3><div class="chips">${mins.map(m=>`<button class="${c.min===m?'on':''}" data-act="cfmin" data-v="${m}">${m} min</button>`).join('')}</div>${c.fmt==='emom'?`<p class="hint">${emomHint(c.min,P.antal,P.hvile)}</p>`:c.fmt&&CF_MIN_HINT[c.fmt]?`<p class="hint">${CF_MIN_HINT[c.fmt]}</p>`:''}</section>
    <section class="card"><h3 class="sec">3 · Tilpas</h3>
      <div class="field"><span>Niveau</span><div class="chips">${NIVEAUER.map(n=>`<button class="${P.niveau===n?'on':''}" data-act="cfpref" data-k="niveau" data-v="${n}">${n}</button>`).join('')}</div></div>
      <div class="field"><span>Fokus</span><div class="chips">${[['','Alsidigt'],['Styrke','Styrke'],['Udholdenhed','Udholdenhed'],['Gymnastik','Gymnastik']].map(([v,l])=>`<button class="${P.fokus===v?'on':''}" data-act="cfpref" data-k="fokus" data-v="${v}">${l}</button>`).join('')}</div></div>
      ${c.fmt==='tabata'?`<div class="field"><span>Antal øvelser</span><p class="hint">Følger tiden: ${Math.round((c.min+1)/5)} ${Math.round((c.min+1)/5)===1?'øvelse':'øvelser'} på ${c.min} min.</p></div>`:''}${c.fmt==='emom'&&P.antal!==1?`<div class="field"><span>Hvileminut i runden</span><div class="chips">${[['auto','Tilfældigt'],['nej','Nej'],['ja','Ja']].map(([v,l])=>`<button class="${(P.hvile||'auto')===v?'on':''}" data-act="cfpref" data-k="hvile" data-v="${v}">${l}</button>`).join('')}</div><p class="hint">Hvileminuttet tæller som en af øvelserne, fx 1. min row, 2. min ski, 3. min hvile.</p></div>`:''}<div class="field"${c.fmt==='tabata'?' hidden':''}><span>Antal øvelser</span><div class="chips">${[0,1,2,3,4,5,6].filter(n=>n===0||(n>=iv[0]&&n<=iv[1]))&&[0,1,2,3,4,5,6].filter(n=>n===0||(n>=iv[0]&&n<=iv[1])).map(n=>`<button class="${P.antal===n?'on':''}" data-act="cfpref" data-k="antal" data-v="${n}">${n?n:'Auto'}</button>`).join('')}</div></div>
      <button class="restbtn" data-act="cfudstyr">${c.showUdstyr?'Skjul udstyr':`Udstyr · ${have.length} af ${all.length} valgt`}</button>
      ${c.showUdstyr?`<div class="chips">${all.map(u=>`<button class="${have.includes(u)?'on':''}" data-act="cfeq" data-v="${esc(u)}">${esc(u)}</button>`).join('')}</div><p class="hint">Øvelser uden udstyr er altid med.</p>`:''}
    </section>
    <button class="btn accent" data-act="cfgen">Byg pas</button>`;
  }
  const p=c.pas;if(!p)return `${back}<section class="card"><p class="empty">Der kunne ikke bygges et pas med de valg. Prøv flere typer udstyr eller et andet antal øvelser.</p><button class="btn ghost" data-act="cfmenu">Tilbage til valg</button></section>`;
  const saved=cfSaved(c.date),isSaved=saved&&saved.seed===p.seed&&saved.ids.join()===p.movs.map(m=>m.id).join();
  const logged=logsOn(c.date).find(l=>l.type==='crossfit');
  return `${back}
  <section class="card k-crossfit"><div class="row-between">${chip('crossfit',esc(p.format.id==='rft'?'For time':p.format.navn))}<span class="muted small">${p.minutter} min · ${esc(p.niveau)}</span></div>
    ${cfWod(p)}
    <p class="note">${esc(p.strategi)}</p>
    <div class="btns3" style="grid-template-columns:1fr 1fr"><button class="btn accent" data-act="cfgen">🎲 Nyt pas</button><button class="btn ghost" data-act="cfmenu">Skift format</button></div></section>
  <section class="card"><div class="row-between"><h3 class="sec">Øvelser</h3><span class="muted small">Tryk Byt for at udskifte</span></div><div>
    ${p.movs.map((m,i)=>`<div class="mvrow"><b>${esc(CF.navnVis(m))}</b><small>Skalering: ${esc(m.skal)} · ${esc(m.udstyr)}</small>
      <button class="restbtn swap" data-act="cfswap" data-i="${i}">${c.swapI===i?'Luk':'Byt'}</button>
      ${c.swapI===i?`<div class="alts">${(()=>{const A=cfAlts(i);return A.length?`<button data-act="cfpick" data-i="${i}" data-v="${A[Math.floor(Math.random()*A.length)].id}" style="background:var(--pill);color:var(--pill-fg)">🎲 Tilfældig erstatning</button>`+A.slice(0,14).map(a=>`<button data-act="cfpick" data-i="${i}" data-v="${a.id}">${esc(CF.navnVis(a))}</button>`).join(''):'<p class="hint">Ingen lovlige erstatninger med dine valg.</p>'})()}</div>`:''}</div>`).join('')}
  </div></section>
  <button class="btn ghost" data-act="schopen" data-src="cf">📅 Læg i kalenderen</button>
  <button class="btn ${isSaved?'ghost':'accent'}" data-act="cfsave">${isSaved?'✓ Gemt til '+(c.date===TODAY?'i dag':niceDate(c.date)):'Gem til '+(c.date===TODAY?'i dag':niceDate(c.date))}</button>
  ${isSaved&&c.date<=TODAY?`<section class="card"><h3 class="sec">${logged?'✓ Resultat logget':'Log resultat'}</h3>
    ${logged?`<p class="note">${esc(logged.score||'')}${logged.rpe?' · hårdhed '+logged.rpe:''}</p>`:`
    <div class="duo"><label><span>Score (${esc(p.score.toLowerCase())})</span><input id="cf-score" data-bind="cf.res.score" value="${esc(c.res.score)}" placeholder="${/tid/i.test(p.score)?'fx 12:34':/runder/i.test(p.score)?'fx 7 runder + 12':'fx 18'}"></label>
    <label><span>Hårdhed 1–10</span><select id="cf-rpe" data-bind="cf.res.rpe"><option value="">–</option>${[6,7,8,9,10].map(n=>`<option${String(c.res.rpe)===String(n)?' selected':''}>${n}</option>`).join('')}</select></label></div>
    <label class="field"><span>Note</span><input id="cf-note" data-bind="cf.res.note" value="${esc(c.res.note)}" placeholder="Fx skaleret pull-ups til ring rows"></label>
    <button class="btn accent" data-act="cflog">Gem resultat</button>`}</section>`:''}
  <section class="card"><h3 class="sec">Derfor virker passet</h3><ul class="rules">${p.opfyldte.map(r=>`<li class="${r.advarsel?'warn':''}"><i>${r.advarsel?'!':'✓'}</i><span>${esc(r.tekst)}</span></li>`).join('')}</ul>
    <p class="hint">Skalering: ${esc(p.skalering)}</p></section>`;
}
