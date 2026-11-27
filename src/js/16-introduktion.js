/* Introduktion for nye brugere og vaner. */
/* ---------- First run: plan your week ---------- */
const GOALS=[{id:'styrke',name:'Styrke',desc:'Vægttræning. Appen foreslår vægten hver gang.'},{id:'kondition',name:'Kondition',desc:'Hårde intervaller og rolige ture, der giver bedre kondition.'},{id:'crossfit',name:'CrossFit',desc:'Varierede, hårde pas, bygget efter dit udstyr og din tid.'},{id:'mobilitet',name:'Mobilitet',desc:'10 min smidighed efter træningen.'}];
function obSuggest(days,goals){
  const plan={0:'R',1:'R',2:'R',3:'R',4:'R',5:'R',6:'R'},addons={};
  const pools={styrke:['S','S','S','S','S','S'],kondition:['I5','Z2L','I30B','Z2','I4','Z2L'],crossfit:['CF','CF','CF','CF','CF','CF']};
  let main=goals.filter(g=>pools[g]);
  if(!main.length&&goals.includes('mobilitet')){days.forEach((d,i)=>plan[d]=i%2?'BAL':'MOB');return {plan,addons}}
  if(!main.length)main=['styrke'];
  const idx={};main.forEach(g=>idx[g]=0);
  days.forEach((d,i)=>{const g=main[i%main.length];plan[d]=pools[g][idx[g]++%pools[g].length]});
  if(goals.includes('mobilitet'))days.forEach(d=>{const k=SESS[plan[d]].kind;if(k==='styrke'||(!main.includes('styrke')&&k!=='mobilitet'))addons[d]='MOB'});
  return {plan,addons};
}
const OB_SPREAD={2:[1,4],3:[1,3,5],4:[1,2,4,6],5:[1,2,4,5,6],6:[1,2,3,4,5,6]};
function obInit(){const days=Object.keys(state.plan).map(Number).filter(d=>state.plan[d]!=='R');
  ui.ob={step:1,name:state.name||'',n:Math.min(6,Math.max(2,days.length||4)),goals:['styrke','kondition'],plan:null,addons:null,pick:null}}
/* Type shown for a session key in the onboarding week, and the key used when the user picks a type */
const OB_KEY={styrke:'S',crossfit:'CF',kondition:'I4',restitution:'AR1',mobilitet:'MOB',hvile:'R'};
function viewOnboard(){
  const o=ui.ob||(obInit(),ui.ob);
  const top=t=>`<p class="eyebrow num">Trin ${o.step} af 3</p><h2 class="h2">${t}</h2>`;
  if(o.step===1)return `${top('Velkommen')}<p class="note">Lad os sætte din træningsuge op. Det tager et minut.</p>
    <section class="card"><label class="field"><span>Hvad hedder du?</span><input id="ob-name" data-bind="ob.name" value="${esc(o.name)}" placeholder="Dit navn"></label></section>
    <button class="btn accent" data-act="obnext">Videre</button>`;
  if(o.step===2)return `${top('Hvad vil du træne?')}
    <div class="fmt-grid">${GOALS.map(g=>`<button class="fmt${o.goals.includes(g.id)?' on':''}" data-act="obgoal" data-v="${g.id}"><b>${g.name}</b><small>${g.desc}</small></button>`).join('')}</div>
    <section class="card"><div class="field"><span>Hvor mange dage om ugen?</span><div class="pl-days ob-n">${[2,3,4,5,6].map(n=>`<button class="pl-day${o.n===n?' on':''}" data-act="obn" data-v="${n}">${n}</button>`).join('')}</div></div></section>
    <div class="btns3" style="grid-template-columns:1fr 2fr"><button class="btn ghost" data-act="obback">Tilbage</button><button class="btn accent" data-act="obnext"${o.goals.length?'':' disabled'}>Lav min uge</button></div>`;
  const typeOf=d=>plTypeOfKey(o.plan[d]);
  return `${top('Din uge')}<section class="card pl-week-edit">${PL_DOW.map(d=>{const t=typeOf(d);return `<button class="pl-wrow k-${PL_TYPES[t][1]}" data-act="obpick" data-d="${d}"><span class="pl-wd">${PL_SHORT[d]}</span>${plIcon(t)}<span class="pl-wt">${t==='crossfit'?'CrossFit':PL_TYPES[t][0]}${o.addons[d]?'<small class="ob-add"> + mobilitet</small>':''}</span><span class="chev">›</span></button>`}).join('')}</section>
    <div class="btns3" style="grid-template-columns:1fr 2fr"><button class="btn ghost" data-act="obback">Tilbage</button><button class="btn accent" data-act="obdone">Start</button></div>
    ${o.pick!=null?`<div class="sheet-bg" data-act="obclose"><div class="sheet" role="dialog"><p class="sheet-t">${cap(DAYS[o.pick])}</p><div class="sheet-grid">${Object.keys(PL_TYPES).map(t=>`<button class="sheet-b k-${PL_TYPES[t][1]}${typeOf(o.pick)===t?' on':''}" data-act="obset" data-v="${t}">${plIcon(t)}<span>${PL_TYPES[t][0]==='Fuld træning'?'CrossFit':PL_TYPES[t][0]}</span></button>`).join('')}</div></div></div>`:''}`;
}
function viewHabitNew(){
  const n=ui.nh;
  return `<div class="habit-head"><button class="icon-btn" data-act="view" data-view="habits" aria-label="Tilbage">‹</button><h2 class="h2">Ny vane</h2></div>
  <section class="card">
    <label class="field"><span>Navn</span><input id="nh-name" data-bind="nh.name" value="${esc(n.name)}" placeholder="Fx Læs 10 sider"></label>
    <div class="field"><span>Type</span><div class="progsw">
      <button class="${n.kind==='check'?'on':''}" data-act="nhkind" data-v="check">Afkryds<small>Gjort eller ikke gjort</small></button>
      <button class="${n.kind==='timer'?'on':''}" data-act="nhkind" data-v="timer">Timer<small>Med alarm og mål</small></button></div></div>
    ${n.kind==='timer'?`<div class="trio"><label><span>Start (min)</span><input id="nh-start" inputmode="decimal" data-bind="nh.start" value="${esc(n.start)}"></label>
      <label><span>+ pr. uge</span><input id="nh-step" inputmode="decimal" data-bind="nh.step" value="${esc(n.step)}"></label>
      <label><span>Slutmål</span><input id="nh-max" inputmode="decimal" data-bind="nh.max" value="${esc(n.max)}"></label></div>
      <p class="hint">Minutter. Brug komma for sekunder, fx 0,5 = 30 sek. Sæt "+ pr. uge" til 0 for et fast mål.</p>`:''}
    <label class="field"><span>Instruktion (valgfri)</span><textarea id="nh-note" rows="3" data-bind="nh.note" placeholder="Én linje pr. punkt">${esc(n.note)}</textarea></label>
    <div class="field"><span>Farve</span><div style="display:flex;gap:10px;flex-wrap:wrap">${HCOLORS.map(c=>`<button data-act="nhcolor" data-v="${c}" aria-label="Farve" style="width:36px;height:36px;border-radius:50%;border:3px solid ${n.color===c?'var(--fg)':'transparent'};background:${c};cursor:pointer"></button>`).join('')}</div></div>
    <button class="btn accent" data-act="nhsave">Tilføj vane</button>
  </section>`;
}
function last7(id){const out=[];const t=pd(TODAY);for(let i=6;i>=0;i--){const d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i),k=ds(d);out.push(`<span><i class="${habitDone(id,k)?'on':''}"></i>${DAYS[d.getDay()].slice(0,2)}</span>`)}return `<div class="dots7 k-${id}">${out.join('')}</div>`}
function viewHabit(){
  const h=findHabit(ui.habit)||HABITS[0],w=hw(h,TODAY),dn=habitDone(h.id,TODAY);
  const back=`<div class="habit-head"><button class="icon-btn" data-act="view" data-view="habits" aria-label="Tilbage">‹</button><h2 class="h2">${h.name}</h2></div>`;
  const tips=`<section class="card"><h3 class="sec">Sådan gør du</h3><ul class="facts">${h.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section>`;
  const week=`<section class="card k-${h.id}"><div class="row-between"><h3 class="sec">Sidste 7 dage</h3><span class="muted small num">${habitStreak(h.id)} i træk</span></div>${last7(h.id)}</section>`;
  const del=h.custom?`<button class="btn danger${ui.delHabit===h.id?' armed':''}" data-act="hdel">${ui.delHabit===h.id?'Tryk igen for at slette vanen':'Slet vane'}</button>`:'';
  if(h.check){
    return `${back}<section class="card k-${h.id}"><div class="habit-hero">
      <span class="hab-ic" style="width:96px;height:96px;font-size:40px">${dn?'✓':`<b style="font-weight:500">${esc(h.name.charAt(0).toUpperCase())}</b>`}</span>
      <p class="tm-next">${dn?'Gjort i dag. Godt gået.':'Ikke gjort endnu i dag'}</p></div>
      <button class="btn ${dn?'ghost':'accent'}" data-act="hcheck">${dn?'Fortryd':'Markér som gjort'}</button></section>
      <section class="card"><h3 class="sec">Glemt at logge?</h3><label class="field"><span>Dato</span><input type="date" id="man-date" data-bind="manDate" value="${ui.manDate||TODAY}" max="${TODAY}"></label>
      <button class="btn ghost" data-act="manlog">Log som gjort</button></section>
      ${week}${tips}${del}`;
  }
  if(h.id==='tak'){
    const L=state.logs.filter(l=>l.type==='tak').sort(byDate).reverse().slice(0,7);
    return `${back}<section class="card k-tak">
      <p class="eyebrow">Skriv i nutid, som om det allerede er sket</p>
      <label class="field"><span>Dine 3 ting (valgfrit at skrive her)</span><textarea id="tak-text" rows="5" data-bind="takText" placeholder="Jeg er taknemmelig for, at jeg ...">${esc(ui.takText||'')}</textarea></label>
      ${dn?'<p class="done-msg">✓ Skrevet i dag</p>':''}
      <button class="btn accent" data-act="taksave">${dn?'Gem igen':'Skrevet i dag'}</button></section>
      ${week}
      ${L.some(l=>l.text)?`<section class="card"><h3 class="sec">Tidligere</h3>${L.filter(l=>l.text).map(l=>`<div class="tak-entry"><span class="muted small">${cap(niceDate(l.date))}</span><p>${esc(l.text)}</p></div>`).join('')}</section>`:''}
      ${tips}`;
  }
  const tgt=h.target(w),next=h.target(w+1),run=ht&&ht.h===h.id,C=2*Math.PI*88;
  const rem=run?htRemain():tgt,frac=run?htFrac():0,paused=run&&ht.audio.paused,ringing=run&&ht.logged,warm=run&&htWarm();
  const nextTxt=next>tgt?`Næste uge: ${h.id==='kulde'||next%60?fmtTime(next):Math.round(next/60)+' min'}`:'Du har nået slutmålet';
  return `${back}<section class="card k-${h.id}"><div class="habit-hero">
      <p class="eyebrow num">Uge ${w+1} · mål ${habitTargetText(h)}</p>
      <div class="tm-ring${warm?' warm':''}"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="trk" cx="100" cy="100" r="88" fill="none" stroke-width="12"/>
        <circle class="prg" id="ht-prog" cx="100" cy="100" r="88" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-frac)).toFixed(1)}"/></svg>
        <div class="in"><p class="tm-time num" id="ht-time">${fmtTime(Math.ceil(rem))}</p><span class="tm-ph">${ringing?'✓ Færdig':run?(paused?'På pause':warm?'Varmt · slap af':h.id==='kulde'?'Koldt · træk vejret roligt':'Følg vejret'):dn?'✓ Klaret i dag':'Klar'}</span></div></div>
      <p class="tm-next num">${warm?`Skift til koldt om ${fmtTime(Math.ceil(rem))} · derefter ${fmtTime(tgt)} koldt`:nextTxt}</p></div>
    ${h.id==='kulde'&&!run?`<div class="field"><span>Varm opstart før det kolde</span><div class="progsw" style="grid-template-columns:repeat(3,1fr)">${[0,30,60,120,180,300].map(v=>`<button class="${coldPre()===v?'on':''}" data-act="coldpre" data-v="${v}">${v===0?'Ingen':v<60?v+' sek':v/60+' min'}</button>`).join('')}</div></div>`:''}
    ${ringing?`<button class="btn accent" data-act="htstop">Stop alarm</button>`
      :run?`<div class="btns3" style="grid-template-columns:1fr 1fr"><button class="btn ghost" data-act="htpause">${paused?'Fortsæt':'Pause'}</button><button class="btn primary" data-act="htstop">Stop og gem</button></div>`
      :`<button class="btn accent" data-act="htstart">${dn?'Start igen':'Start'}</button>`}
    ${run?'<p class="hint">Du kan låse skærmen. Timeren kører videre, ses på låseskærmen, og alarmen ringer, når tiden er gået.</p>':''}</section>
    ${run?'':`<section class="card"><h3 class="sec">Allerede gjort?</h3>
      <div class="duo"><label><span>${h.id==='kulde'?'Tid (m:ss)':'Minutter'}</span><input id="man-val" inputmode="${h.id==='kulde'?'text':'decimal'}" data-bind="manVal" value="${esc(ui.manVal||'')}" placeholder="${h.id==='kulde'?fmtTime(tgt):Math.round(tgt/60)}"></label>
      <label><span>Dato</span><input type="date" id="man-date" data-bind="manDate" value="${ui.manDate||TODAY}" max="${TODAY}"></label></div>
      <button class="btn ghost" data-act="manlog">Log som gennemført</button>
      <p class="hint">Lader du tiden stå tom, logges ugens mål.</p></section>`}
    ${week}${tips}${del}`;
}
