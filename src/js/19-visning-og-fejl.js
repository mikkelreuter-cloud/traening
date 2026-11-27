/* Visning (render), tilbage-gestus, rundvisning, forslagsliste og fejlskærm. */
/* ---------- render ---------- */
function habitCss(){let el=document.getElementById('hab-css');if(!el){el=document.createElement('style');el.id='hab-css';document.head.appendChild(el)}
  el.textContent=(state.customHabits||[]).map(c=>`.k-${c.id}{--k:${c.color}}`).join('')}
/* ---------- Back gesture: every screen is a history entry, so swiping back steps back inside the app ---------- */
let lastNav=null,navFromPop=false,replaceNext=false,navDepth=0;
function navKey(){return [ui.view,ui.view==='cf'&&ui.cf?ui.cf.step:'',ui.view==='onboard'&&ui.ob?ui.ob.step:'',ui.view==='day'?ui.sel:'',ui.view==='sess'?ui.trKey:'',ui.view==='plan'&&ui.pl?ui.pl.step:''].join('|')}
function syncHistory(){const k=navKey();if(k===lastNav)return;
  const st={k,view:ui.view,sel:ui.sel,trKey:ui.trKey,cfStep:ui.cf&&ui.cf.step,obStep:ui.ob&&ui.ob.step,plStep:ui.pl&&ui.pl.step};
  try{if(lastNav===null||navFromPop||replaceNext)history.replaceState(st,'');else{history.pushState(st,'');navDepth++}}catch(e){}
  lastNav=k;navFromPop=false;replaceNext=false}
addEventListener('popstate',e=>{const st=e.state;if(!st||!st.view)return;navDepth=Math.max(0,navDepth-1);
  if(st.view==='onboard'&&state.onboarded){history.back();return}
  const plSl=ui.view==='plan'&&st.view==='plan'&&ui.pl&&st.plStep&&st.plStep!==ui.pl.step,plOrd=x=>x==='review'?99:plSteps(ui.pl).indexOf(x);
  const go=()=>{navFromPop=true;ui.view=st.view;if(st.sel)ui.sel=st.sel;if(st.trKey)ui.trKey=st.trKey;if(ui.cf&&st.cfStep)ui.cf.step=st.cfStep;if(ui.ob&&st.obStep)ui.ob.step=st.obStep;if(ui.pl&&st.plStep)ui.pl.step=st.plStep;if(st.view==='plan'&&!ui.pl)st.view=ui.view='month';
  if((st.view==='sessedit'||st.view==='expick')&&!ui.se)ui.view='train';if(st.view==='expick'&&!ui.pick)ui.view='sessedit';if(st.view==='sched'&&!ui.sched)ui.view='train';
  render(true);if(ui.view==='sessedit'&&ui.seScroll){scrollTo(0,ui.seScroll);ui.seScroll=0}};
  if(plSl)slideAnim(plOrd(st.plStep)<plOrd(ui.pl.step)?-1:1,go);else go()});
function render(top){try{renderInner(top)}catch(e){onCrash(e,'render:'+ui.view)}}
function renderInner(top){if(typeof acHide==='function'&&!$('#ac').hidden)acHide();habitCss();
  if(!state.onboarded&&ui.view!=='onboard')ui.view='onboard';
  const v=ui.view;$('.tabs').hidden=v==='onboard';$('.top .icon-btn').hidden=v==='onboard';
  $('#main').innerHTML=(storageOK?'':'<p class="warn">Browseren tillader ikke at gemme her. Åbn siden i Chrome og tilføj den til startskærmen, ellers forsvinder dine logs.</p>')+
    (timer&&v!=='timer'?'<button class="btn primary" data-act="view" data-view="timer">Timeren kører · gå tilbage</button>':'')+
    (v==='today'?viewToday():v==='cal'?viewCal():v==='log'?viewLog():v==='prog'?viewProg():v==='timer'?viewTimer():v==='habits'?viewHabits():v==='habit'?viewHabit():v==='habitnew'?viewHabitNew():v==='cf'?viewCF():v==='onboard'?viewOnboard():v==='train'?viewTrain():v==='sched'?viewSched():v==='day'?viewDay():v==='sess'?viewSess():v==='sessedit'?viewSessEdit():v==='expick'?viewPick():v==='fw'?viewFW():v==='month'?viewMonth():v==='plan'?viewPlan():viewSettings());
  if(!fbKnown)fbKnown=new Set(state.logs.map(l=>l.id));
  if(v!=='timer'&&v!=='onboard'&&(ui.fbHard||fbPending()))$('#main').insertAdjacentHTML('beforeend',fbSheet());
  syncHistory();syncNotif();
  requestAnimationFrame(moveTabInd);
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.dataset.view===v||(v==='log'&&t.dataset.view===(ui.logFrom==='prog'?'prog':ui.logFrom==='train'?'train':'today'))||((v==='habit'||v==='habitnew')&&t.dataset.view==='habits')||(v==='cf'&&t.dataset.view==='today')||(v==='day'&&t.dataset.view===(ui.dayBack||'today'))||(((v==='sess'||v==='sessedit'||v==='expick'||(v==='fw'&&!ui.fwDate))&&t.dataset.view==='train')||((v==='plan')&&t.dataset.view==='month'))));
  {const g=TAB_ORDER.includes(v);$('#gear').hidden=!g;document.body.classList.toggle('has-gear',g)}
  document.body.classList.toggle('no-top',['today','train','log','prog','fw','plan','month','settings','sess','sessedit','expick','day','cf','onboard','sched'].includes(v));
  {const m=$('#main');if(ui.freeze&&ui.freeze.v===v){m.style.justifyContent='flex-start';m.style.paddingTop=ui.freeze.px+'px'}else{ui.freeze=null;m.style.justifyContent='';m.style.paddingTop=''}}
  {const st=sessFor(TODAY);$('#hdr-hi').textContent=(state.name?'Hej '+state.name+'! · ':'')+cap(niceDate(TODAY));$('#hdr-date').textContent=v==='today'?(st.kind==='hvile'?'Hviledag i dag. Restitution er også træning.':`Klar til ${st.name}?`):v==='timer'||v==='habit'?'Hold fokus':v==='habitnew'?'Byg en ny vane':v==='onboard'?'Styrke & VO₂ log':v==='train'||v==='sess'?'Hvad har du lyst til i dag?':v==='sessedit'||v==='expick'?'Byg dit eget pas':v==='day'?cap(niceDate(ui.sel)):v==='cf'?'Byg dagens WOD':v==='habits'?'Små vaner, stor effekt':'Styrke & VO₂ log'}
  if(top)window.scrollTo(0,0);
}
/* ---------- Intro tour: a few swipeable cards shown once after setup ---------- */
const TOUR=[
 {ic:'<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',h:'I dag',p:'Din uge med dagens træning. Tryk på en dag for at se den, og start dagens pas direkte.'},
 {ic:'<path d="M8 5v14l11-7z"/>',h:'Pas',p:'Alle pas i grupper. Byg en fuld træning eller et CrossFit-pas, eller opret dit eget.'},
 {ic:'<path d="M6.5 9v6M17.5 9v6M3.5 10.5v3M20.5 10.5v3M6.5 12h11"/>',h:'Log mens du træner',p:'Tryk ✓ efter hvert sæt. Pausen starter, og appen foreslår vægten til næste gang.'},
 {ic:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',h:'Plan',p:'Se en måned frem, og planlæg et forløb på 1-8 uger mod et mål.'},
 {ic:'<path d="M5 20V12M10 20V6M15 20v-9M20 20V9"/>',h:'Udvikling',p:'Sæt mål og følg din styrke, kondition og vægt. Swipe til siden for at skifte fane.'}];
function showTour(){const el=$('#tour');
  el.innerHTML=`<div class="tour-box" role="dialog" aria-label="Rundvisning"><div class="tour-track" id="tour-track">${TOUR.map(t=>`<div class="tour-slide"><div class="tour-ic"><svg viewBox="0 0 24 24">${t.ic}</svg></div><h3>${t.h}</h3><p>${t.p}</p></div>`).join('')}</div>
  <div class="tour-dots">${TOUR.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>
  <div class="tour-btns"><button class="btn ghost" data-act="tourend">Spring over</button><button class="btn accent" data-act="tournext" id="tour-next">Næste</button></div></div>`;
  el.hidden=false;const tr=$('#tour-track');
  tr.addEventListener('scroll',()=>{const i=Math.round(tr.scrollLeft/tr.clientWidth);el.querySelectorAll('.tour-dots i').forEach((d,j)=>d.classList.toggle('on',j===i));$('#tour-next').textContent=i===TOUR.length-1?'Kom i gang':'Næste'},{passive:true})}
function endTour(){$('#tour').hidden=true;$('#tour').innerHTML='';state.tourSeen=true;state.tipSeen=true;save()}
/* ---------- Own suggestion list under text fields (the phone's built-in one is see-through in dark mode) ---------- */
let acFor=null;
function acSource(kind){if(kind==='test')return [...new Set([...TESTS,...testNames()])].map(n=>[n,'']);
  return allExercises().map(n=>{const x=strFor(n);return [n,x?x[1]+(strOk(x)?'':' · ikke i dit udstyr'):'',x&&!strOk(x)?1:0]})}
function acShow(inp){const q=inp.value.trim().toLowerCase(),box=$('#ac');acFor=inp;
  if(!q){box.hidden=true;return}
  const m=acSource(inp.dataset.ac).filter(([n])=>n.toLowerCase().includes(q)&&n.toLowerCase()!==q)
    .sort((a,b)=>(a[2]||0)-(b[2]||0)||(b[0].toLowerCase().startsWith(q)-a[0].toLowerCase().startsWith(q))||a[0].localeCompare(b[0],'da')).slice(0,6);
  if(!m.length){box.hidden=true;return}
  box.innerHTML=m.map(([n,sub])=>`<button type="button" data-n="${esc(n)}">${esc(n)}${sub?`<small>${esc(sub)}</small>`:''}</button>`).join('');
  const r=inp.getBoundingClientRect();box.style.left=(r.left+scrollX)+'px';box.style.top=(r.bottom+scrollY+6)+'px';box.style.width=r.width+'px';box.hidden=false}
function acHide(){$('#ac').hidden=true;acFor=null}
$('#ac').addEventListener('pointerdown',e=>e.preventDefault());
$('#ac').addEventListener('click',e=>{const b=e.target.closest('button[data-n]');if(!b||!acFor)return;const inp=acFor,n=b.dataset.n;acHide();
  inp.value=n;inp.dispatchEvent(new Event('input',{bubbles:true}));
  const m=/^se-n(\d+)$/.exec(inp.id);
  if(m&&ui.se){const row=ui.se.ex[+m[1]],x=strFor(n);if(x&&row.s==='3'&&row.r==='8'&&row.q==='2'){row.s=String(x[4]);row.r=String(x[5]);row.q=String(x[6])}render()}
  else inp.dispatchEvent(new Event('change',{bubbles:true}));inp.blur()});
document.addEventListener('focusin',e=>{const t=e.target;if(t.dataset&&t.dataset.ac)acShow(t)});
document.addEventListener('focusout',e=>{if(e.target===acFor)setTimeout(()=>{if(document.activeElement!==acFor)acHide()},150)});
/* ---------- When something goes wrong: show what happened and offer a backup, instead of a white screen ---------- */
const EKEY='styrke-vo2-errors.v1';
function logErr(e,where){const m=String(e&&(e.stack||e.message)||e).slice(0,600);try{const L=JSON.parse(localStorage.getItem(EKEY)||'[]');L.push({t:new Date().toISOString(),where,m});localStorage.setItem(EKEY,JSON.stringify(L.slice(-20)))}catch(_){}return m}
function backupText(){return dataBroken?dataBroken.raw:JSON.stringify(state)}
const backupName=()=>`traening-backup-${TODAY}.json`;
function downloadBackup(){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([backupText()],{type:'application/json'}));a.download=backupName();document.body.appendChild(a);a.click();a.remove()}catch(e){}}
/* Backup as a file: the phone's share menu (Drive, mail, Files), or a download where sharing files isn't possible */
async function shareBackup(){let shared=false;
  try{const f=new File([backupText()],backupName(),{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Træning · backup'});shared=true}}
  catch(e){if(e&&e.name==='AbortError')return}
  if(!shared)downloadBackup();if(!dataBroken){state.lastBackup=TODAY;state.bkSnooze=null;save()}render();toast('Backup gemt')}
function showCrash(msg,broken){let el=document.getElementById('crash');if(!el){el=document.createElement('div');el.id='crash';document.body.appendChild(el)}
  el.innerHTML=`<div class="crash-box" role="alertdialog" aria-label="Noget gik galt"><h2>${broken?'Dine data kunne ikke læses':'Noget gik galt'}</h2>
    <p>${broken?'Appen har ikke ændret noget. Dine data er gemt som de var, og appen gemmer ikke, før du har valgt.':'Dine data er ikke rørt. Gem en backup for en sikkerheds skyld, og prøv igen.'}</p>
    <button class="btn accent" data-crash="dl">Gem backup som fil</button><button class="btn ghost" data-crash="copy">Kopiér backup</button>
    ${broken?'<button class="btn ghost" data-crash="reset">Start forfra (din kopi bliver liggende)</button>':'<button class="btn ghost" data-crash="go">Fortsæt</button><button class="btn ghost" data-crash="reload">Genindlæs appen</button>'}
    <div id="crash-snap"></div><details><summary>Detaljer</summary><pre>${esc(msg)}</pre></details></div>`;el.hidden=false;
  if(broken)snapList().then(l=>{const s=l[0],box=document.getElementById('crash-snap');if(s&&box)box.innerHTML=`<button class="btn accent" data-crash="snap">Gendan automatisk kopi fra ${shortDate(s.date)} (${s.n} logs)</button>`})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-crash]');if(!b)return;e.stopPropagation();const a=b.dataset.crash;
  if(a==='dl')downloadBackup();else if(a==='copy'){try{navigator.clipboard.writeText(backupText());toast('Backup kopieret')}catch(_){}}
  else if(a==='reload')location.reload();else if(a==='go'){$('#crash').hidden=true}
  else if(a==='reset'){dataBroken=null;save();$('#crash').hidden=true;render(true)}
  else if(a==='snap')snapList().then(l=>{for(const s of l){try{restoreFrom(s.data);$('#crash').hidden=true;render(true);toast(`Gendannet fra ${shortDate(s.date)}`);return}catch(_){}}toast('Ingen brugbar kopi')})},true);
let crashing=false;
function onCrash(e,where){const m=logErr(e,where);if(crashing)return;crashing=true;setTimeout(()=>{crashing=false},500);showCrash(m,false)}
addEventListener('error',e=>onCrash(e.error||e.message,'error'));
addEventListener('unhandledrejection',e=>onCrash(e.reason,'promise'));
let tt;function toast(msg){const el=$('#toast');el.textContent=msg;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{el.hidden=true},2200)}

