/* Fanen I dag: ugestrimmel, dagens detaljer, kalender og dagskort. */
function nextSession(from){const d=pd(from);for(let i=1;i<=7;i++){const n=ds(new Date(d.getFullYear(),d.getMonth(),d.getDate()+i)),s=sessFor(n);if(s.kind!=='hvile')return {d:n,s,i}}return null}
const daysSince=d=>Math.round((pd(TODAY)-pd(d))/864e5);
function weekCell(d,act){
  const s=sessFor(d),dt=pd(d);
  return `<button class="wd k-${s.kind}${d===TODAY?' is-today':''}${isDone(d)?' is-done':''}${act&&(ui.wsel===undefined?TODAY:ui.wsel)===d?' is-sel':''}" data-act="${act||'calday'}" data-date="${d}" aria-label="${niceDate(d)}: ${s.name}">
    <span class="dl">${DAYS[dt.getDay()].slice(0,2)}</span><span class="dn num">${dt.getDate()}</span><span class="bar"></span>${extrasOn(d).length?'<span class="wd-x">+'+extrasOn(d).length+'</span>':''}</button>`;
}
/* Details for a tapped day in the week strip on I dag */
function weekDetail(d,extra){const s=sessFor(d),done=isDone(d),cf=s.kind==='crossfit'?cfSaved(d):null;
  const sum=s.kind==='styrke'&&s.ex?s.ex.map(e=>`${e[0].replace(/ \(.*\)$/,'')} · ${e[1]}×${e[2]}${s.pct&&s.main===e[0]&&kgFor(e[0],s.pct)?' @ '+fnum(kgFor(e[0],s.pct))+' kg':''}`):
    s.fw?(()=>{const w=s.w;if(!w)return [];const l=fwL(w.b.lift),p=w.c?cfRebuild(w.c):null;return ['B) '+l[1]+' · '+withKg(l[1],w.b.lines[0]),...(p?['C) '+p.overskrift]:[]),...(w.d.length?['D) '+w.d.join(', ')]:[])]})():s.kind==='crossfit'?(cf?[cf.title||'Pas klar']:['Pas bygges på dagen']):(s.steps||[]).slice(0,4).map(t=>zTxt(t,s));
  const status=done?'✓ Gennemført':s.kind==='hvile'?(isSkipped(d)?'Sprunget over':'Hviledag'):d<TODAY?'Ikke logget':d===TODAY?'I dag':'Planlagt';
  return `<div class="wdet">
    <div class="row-between"><span class="muted small">${cap(niceDate(d))}</span>${chip(s.kind,s.label||KIND_LABEL[s.kind])}</div>
    <h3 class="wdet-n">${esc(s.name)}${s.dur?`<span class="muted small"> · ${esc(s.dur)}</span>`:''}</h3>
    <p class="small ${done?'ok':'muted'}">${status}</p>
    ${s.kind!=='hvile'&&sum.length?`<ul class="wdet-l">${sum.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
    ${extra||''}
    ${(d!==TODAY||extra===undefined)&&s.kind!=='hvile'?`<button class="restbtn" data-act="calday" data-date="${d}">Se træning ›</button>`:''}
    ${extrasOn(d).map((k,i)=>{const x=SESS[k],dn=extraDone(d,i);return `<div class="xtra k-${x.kind}"><div class="row-between"><span class="muted small">Også ${d===TODAY?'i dag':'denne dag'}</span>${chip(x.kind,x.label||KIND_LABEL[x.kind])}</div>
      <h3 class="wdet-n">${esc(x.name)}${x.dur?`<span class="muted small"> · ${esc(x.dur)}</span>`:''}</h3><p class="small ${dn?'ok':'muted'}">${dn?'✓ Gennemført':d<TODAY?'Ikke logget':'Planlagt'}</p>
      <div class="btns3" style="grid-template-columns:${d===TODAY&&!dn?'2fr ':''}1fr 1fr">${d===TODAY&&!dn?`<button class="btn accent" data-act="xstart" data-key="${k}" data-date="${d}">Start</button>`:''}<button class="btn ghost" data-act="xsee" data-key="${k}" data-date="${d}">Se</button><button class="btn ghost" data-act="xdel" data-date="${d}" data-i="${i}">Fjern</button></div></div>`}).join('')}</div>`}
function viewToday(){
  const s=sessFor(TODAY),done=isDone(TODAY),wk=weekDates(TODAY);
  const planned=wk.filter(d=>sessFor(d).kind!=='hvile'),doneN=planned.filter(isDone).length;
  const W=logsOf('vaegt'),w=W[W.length-1],key=sessKey(TODAY);
  let actions;
  if(s.kind==='styrke')actions=`<button class="btn accent" data-act="logday" data-date="${TODAY}">${loadDraft()?'Fortsæt træning':done?'Log mere':'Start træning'}</button>`;
  else if(s.kind==='hvile'){const n=nextSession(TODAY);actions=(isSkipped(TODAY)?`<p class="note">${(state.shifts||[]).includes(TODAY)?'Du rykkede planen. Dagens pas ligger nu i morgen.':'Du sprang dagens pas over.'}</p><button class="btn ghost" data-act="unskip">Fortryd</button>`:'')+(n?`<p class="note">Næste pas: <b>${esc(n.s.name)}</b> ${n.i===1?'i morgen':'på '+DAYS[pd(n.d).getDay()]}.</p>`:'')}
  else if(s.fw)actions=`<button class="btn accent" data-act="fwday" data-date="${TODAY}">${done?'Se træningen':'Åbn træningen'}</button>`;
  else if(s.kind==='crossfit')actions=`<button class="btn accent" data-act="cfopen" data-date="${TODAY}">${cfSaved(TODAY)?(done?'Se pas':'Start og log'):'Byg dagens pas'}</button>`;
  else if(s.kind==='mobilitet')actions=done?'':`<button class="btn accent" data-act="mobdone" data-key="${key}">Færdig · ${s.min} min</button>`;
  else actions=`<div class="btns"><button class="btn accent" data-act="timer" data-key="${key}">${s.kind==='zone2'?'Start timer':'Start intervaltimer'}</button><button class="btn ghost" data-act="logday" data-date="${TODAY}">Log uden timer</button></div>`;
  const T=logsOf('test'),lastT=T.length?T[T.length-1].date:null,testDue=!lastT||daysSince(lastT)>=42;
  const backupDue=state.logs.length>=5&&(!state.lastBackup||daysSince(state.lastBackup)>=14);
  const B=bestLift();
  const wDelta=W.length>1?W[W.length-1].kg-W[0].kg:null;
  const tips=false?`<section class="card"><div class="row-between"><h3 class="sec">Sådan virker appen</h3></div>
    <ul class="facts"><li><b>I dag</b> viser dagens pas. Tryk på den orange knap for at gå i gang.</li><li>Log hvert sæt med ✓. Appen husker dine tal og foreslår vægten til næste gang.</li><li><b>Træn</b> lader dig starte et hvilket som helst pas, når det passer dig. Tryk på en dag i ugen herunder for at se den eller lægge CrossFit ind.</li><li><b>Udvikling</b> viser dine fremskridt og en kalender. Ugen ændrer du via knappen øverst til højre.</li></ul>
    <button class="btn ghost" data-act="tipok">Forstået</button></section>`:'';
  const sum=s.kind==='styrke'&&s.ex?s.ex.map(e=>e[0].replace(/ \(.*\)$/,'')).join(' · '):'';
  const todayExtra=`    ${done?'<p class="done-msg">✓ Logget i dag</p>':''}
    ${actions}
    ${s.kind!=='hvile'&&!done?(ui.skipAsk?`<div class="card" style="background:var(--surface-2);box-shadow:none;gap:10px">
      <p class="rt">Ikke klar i dag?</p>
      <button class="btn primary" data-act="shiftday">Ryk planen én dag<small style="display:block;font-weight:400;font-size:12px;opacity:.75;margin-top:4px">I dag bliver hviledag. ${esc(s.name)} kommer i morgen, og resten rykker med.</small></button>
      <button class="btn ghost" data-act="skipday">Spring dagens pas over<small style="display:block;font-weight:400;font-size:12px;opacity:.7;margin-top:4px">Planen fortsætter som normalt i morgen.</small></button>
      <button class="restbtn" data-act="skipcancel">Annullér</button></div>`
      :`<button class="linkbtn" data-act="skipask">Ikke klar i dag?</button>`):''}
`;
  const bkCard=backupDue&&!(state.bkSnooze&&state.bkSnooze>TODAY)?`<section class="card bk-card"><div class="row-between"><h3 class="sec">Tag en backup</h3><span class="muted small">${state.lastBackup?'Sidst '+shortDate(state.lastBackup):'Aldrig'}</span></div>
    <p class="muted small">Dine ${state.logs.length} logs ligger kun på telefonen. Gem en kopi i Drive eller på mail. Det tager 2 sekunder.</p>
    <div class="btns3" style="grid-template-columns:2fr 1fr"><button class="btn accent" data-act="bkshare">Gem backup</button><button class="btn ghost" data-act="bksnooze">Senere</button></div></section>`:'';
  return `${adaptCard()}${bkCard}
  ${isDeload(TODAY)?`<p class="slim-note">↓ Deload-uge · halvt så mange sæt, samme vægt</p>`:plActive()&&plWeekNo()>0&&state.block.deloads.includes(plWeekNo()-1)?`<p class="slim-note">↓ Deload-uge i dit forløb · lettere pas, så kroppen kan nå at blive stærkere</p>`:''}
  <section class="card">
    <div class="row-between"><h3 class="sec">Denne uge</h3><span class="muted small num">${doneN} af ${planned.length} pas</span></div>
    <div class="week">${wk.map(d=>weekCell(d,'wsel')).join('')}</div>
    ${(()=>{const sel=ui.wsel===undefined?TODAY:ui.wsel;return sel&&wk.includes(sel)?weekDetail(sel,sel===TODAY?todayExtra:''):''})()}
  </section>
  ${addonCard(TODAY)}
  ${''}<section class="stats" hidden>
    <div class="stat"><span class="lab">Kropsvægt</span><b class="num">${w?fnum(w.kg)+'<small>kg</small>':'–'}</b><em class="num">${wDelta!=null?`${wDelta>0?'+':wDelta<0?'−':'±'}${fnum(Math.abs(wDelta))} kg siden ${shortDate(W[0].date)}`:w?'Første måling':'Log under Vægt'}</em></div>
    <div class="stat"><span class="lab">${B?esc(B.ex)+' · anslået max':'Styrke'}</span><b class="num">${B?fnum(B.v,0)+'<small>kg</small>':'–'}</b><em class="num">${B?`Sidst ${shortDate(B.date)}`:'Log et styrkepas'}</em></div>
  </section>
  `;
}
function habitsCard(){
  const H=habits(),n=H.filter(h=>habitDone(h.id,TODAY)).length;
  return `<section class="card"><div class="row-between"><h3 class="sec">Dagens vaner</h3><span class="muted small num">${n} af ${H.length}</span></div>
    <div class="hab-list">${H.map(h=>habitBtn(h)).join('')}</div></section>`;
}
function habitBtn(h){const dn=habitDone(h.id,TODAY);
  return `<button class="hab k-${h.id}${dn?' done':''}" data-act="habit" data-h="${h.id}"><span class="hab-ic">${IC[h.id]||`<b style="font-weight:600;font-size:18px">${esc(h.name.charAt(0).toUpperCase())}</b>`}</span><span class="hab-t"><b>${h.name}</b><small class="num">${dn?'Klaret i dag':habitTargetText(h)}</small></span><span class="hab-ck">✓</span></button>`}
function addonCard(d){
  const a=addonFor(d);if(!a)return '';const dn=addonDone(d,a);
  return `<section class="card k-mobilitet"><div class="row-between">${chip('mobilitet','Bagefter')}<span class="muted small">${a.s.dur}</span></div>
    <h3 class="sess" style="font-size:22px">${esc(a.s.name)}</h3>${ui.addonOpen?sessionBody(a.s)+(a.s.note?`<p class="note">${esc(a.s.note)}</p>`:''):''}
    <button class="restbtn" data-act="addontog">${ui.addonOpen?'Skjul øvelser':'Se øvelser'}</button>
    ${dn?'<p class="done-msg">✓ Gennemført</p>':`<button class="btn ghost" data-act="mobdone" data-key="${a.key}" data-date="${d}">Færdig · ${a.s.min} min</button>`}</section>`;
}
function goalsCard(d){
  const o=weekStats(d),G=BP_GOALS;
  const row=(k,label,v,goal,unit)=>{const pct=Math.min(100,Math.round(100*v/goal));return `<div class="goal k-${k}${v>=goal?' met':''}"><span class="gl">${label}</span><span class="gv num"><b>${v}</b> / ${goal} ${unit}</span><span class="gb"><i style="width:${pct}%"></i></span></div>`};
  const h=Math.floor(o.total/60),m=o.total%60;
  return `<section class="card"><div class="row-between"><h3 class="sec">Blueprint-uge</h3><span class="muted small">Mål 6 t</span></div>
    <div class="big-h num">${h}<small>t</small> ${m}<small>min</small></div>
    <div class="goals">
      ${row('interval','I alt',o.total,G.total,'min')}
      ${row('zone2','Zone 2',o.z2,G.z2,'min')}
      ${row('interval','Hårdt (HIIT)',o.vig,G.vig,'min')}
      ${row('styrke','Styrkepas',o.str,G.str,'')}
      ${row('mobilitet','Mobilitet og balance',o.mob,G.mob,'min')}
    </div>
    <p class="hint">Bevæg dig 5–10 min efter hvert måltid og rejs dig hvert 30. minut.</p></section>`;
}
function bestLift(){
  const ex=loggedExercises();if(!ex.length)return null;
  const pick=ex.find(e=>e.toLowerCase()==='squat')||ex.find(e=>e.toLowerCase()==='dødløft')||ex[0];const k=pick.toLowerCase();
  const L=logsOf('styrke');for(let i=L.length-1;i>=0;i--){const ss=L[i].sets.filter(s=>s.ex.toLowerCase()===k&&s.kg>0);if(ss.length)return {ex:pick,v:Math.max(...ss.map(s=>e1rm(s.kg,s.reps+(s.rir||0)))),date:L[i].date}}
  return null;
}
/* Segmented half-dial: one rounded block per planned session this week, filled when done */
function dial(done,total){
  total=Math.max(total,1);const cx=150,cy=150,r=112,span=180/total,arc=r*span*Math.PI/180,h=Math.max(10,arc-8);
  let g='';for(let i=0;i<total;i++){const th=180+span*(i+.5),rad=th*Math.PI/180,x=cx+r*Math.cos(rad),y=cy+r*Math.sin(rad);
    g+=`<rect class="${i<done?'seg-on':'seg-off'}" x="-19" y="${(-h/2).toFixed(1)}" width="38" height="${h.toFixed(1)}" rx="11" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${th.toFixed(1)})"/>`}
  return `<div class="dial" role="img" aria-label="${done} af ${total} pas gennemført denne uge"><svg viewBox="0 0 300 170">${g}</svg>
    <div class="dial-c"><span class="ic">⚡</span><b class="num">${done}/${total}</b><span>pas gennemført</span></div></div>`;
}
function viewCal(){return calMonth()+dayCard(ui.sel)}
function viewDay(){return `<div class="habit-head"><button class="icon-btn" data-act="dayback" aria-label="Tilbage" data-back>‹</button><h2 class="h2">${cap(DAYS[pd(ui.sel).getDay()])}</h2></div>`+dayCard(ui.sel)}
function calMonth(){
  const y=ui.calY,m=ui.calM,first=new Date(y,m,1),start=(first.getDay()+6)%7,n=new Date(y,m+1,0).getDate();
  let cells='';for(let i=0;i<start;i++)cells+='<span class="cd empty"></span>';
  for(let d=1;d<=n;d++){const s=ds(new Date(y,m,d)),se=sessFor(s),done=logsOn(s).some(l=>!HABIT_LOG(l.type));
    cells+=`<button class="cd k-${se.kind}${s===TODAY?' is-today':''}${s===ui.sel?' is-sel':''}${done?' is-done':''}${s<TODAY?' past':''}" data-act="sel" data-date="${s}" aria-label="${niceDate(s)}: ${se.name}"><span class="dn num">${d}</span><span class="bar"></span></button>`}
  return `<div class="cal-head"><button class="icon-btn" data-act="mprev" aria-label="Forrige måned">‹</button><h2 class="month">${MONTHS[m]} ${y}</h2><button class="icon-btn" data-act="mnext" aria-label="Næste måned">›</button>${ui.view==='prog'?setBtn():''}</div>
  <div class="card cal-card"><div class="cal-grid">${['Ma','Ti','On','To','Fr','Lø','Sø'].map(x=>`<span class="cw">${x}</span>`).join('')}${cells}</div></div>
`;
}
function dayCard(sel){
  const se=sessFor(sel),L=logsOn(sel).filter(l=>!HABIT_LOG(l.type)).sort(byDate);
  return `<section class="card">
    <p class="eyebrow">${cap(niceDate(sel))}${sel===TODAY?' · i dag':''}</p>
    <div class="row-between"><h2 class="sess">${esc(se.name)}</h2>${chip(se.kind,se.label||KIND_LABEL[se.kind])}</div>
    ${sessionBody(se,sel)}
    ${addonFor(sel)?`<p class="note">+ ${esc(addonFor(sel).s.name)} (${addonFor(sel).s.dur}) bagefter</p>`:''}
    ${extrasOn(sel).map((k,i)=>`<div class="xtra k-${SESS[k].kind}"><div class="row-between"><b>${esc(SESS[k].name)}</b>${chip(SESS[k].kind,SESS[k].label||KIND_LABEL[SESS[k].kind])}</div>${sessionBody(SESS[k])}<button class="restbtn" data-act="xdel" data-date="${sel}" data-i="${i}">Fjern fra dagen</button></div>`).join('')}
    ${L.length?`<h3 class="sec">Logget</h3><div>${L.map(logItem).join('')}</div>`:''}
    ${se.fw?`<button class="btn accent" data-act="fwday" data-date="${sel}">Åbn træningen</button>`:''}${se.kind==='crossfit'&&!se.fw?`<button class="btn accent" data-act="cfopen" data-date="${sel}">${cfSaved(sel)?'Se og rediger pas':'Byg CrossFit-pas'}</button>`:''}
    ${se.kind!=='crossfit'?`<button class="btn ghost" data-act="cfday" data-date="${sel}">Læg CrossFit ind på dagen</button>`:(dayOf(sel).m==='CF'||/^C\d/.test(dayOf(sel).m||''))?`<button class="restbtn" data-act="cfundo" data-date="${sel}">Fjern CrossFit · tilbage til ${esc(SESS[baseKey(sel)].name)}</button>`:''}
    ${se.kind!=='crossfit'?`<button class="btn primary" data-act="logday" data-date="${sel}">Log denne dag</button>`:''}
  </section>`;
}

/* ---------- "Vil du oprette en træningsplan?" ----------
   Floats above the tab bar, outside the page, so tab animations don't move it. Slides up 2 seconds after you land on I dag.
   "Ikke nu" hides it for 14 days. */
const planAskWanted=()=>!plActive()&&!(state.planAsk&&state.planAsk>TODAY)&&state.onboarded;
let notifT=null;
function syncNotif(){const want=ui.view==='today'&&planAskWanted(),el=document.getElementById('notif');
  if(!want){clearTimeout(notifT);notifT=null;if(el&&el.classList.contains('show')){el.classList.remove('show');setTimeout(()=>{if(!el.classList.contains('show'))el.remove()},450)}else if(el)el.remove();return}
  if(el||notifT)return;
  notifT=setTimeout(()=>{notifT=null;if(ui.view!=='today'||!planAskWanted()||document.getElementById('notif'))return;
    const e=document.createElement('div');e.id='notif';e.className='notif';e.setAttribute('role','status');
    e.innerHTML='<b>Vil du oprette en træningsplan?</b><button class="btn accent" data-act="plopen">Ja</button><button class="notif-x" data-act="planasklater">Ikke nu</button>';
    document.body.appendChild(e);requestAnimationFrame(()=>requestAnimationFrame(()=>e.classList.add('show')))},2000)}
