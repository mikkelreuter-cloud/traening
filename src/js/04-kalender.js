/* Kalenderen: hvilket pas der ligger på en dag (days), ændringer af dagene, ugestatistik og vægtforslag. */
/* ---------- data queries ---------- */
const mondayOf=s=>weekDates(s)[0];
/* Deload: every DELOAD_EVERY-th week of the cycle → half the sets, same weight, one interval session */
function cycleWeek(s){if(!state.cycleStart)return 0;return Math.floor((pd(mondayOf(s))-pd(state.cycleStart))/(7*864e5))}
const isDeload=s=>false&&(state.program==='blueprint'||(state.program==='custom'&&state.customDeload!==false))&&!!state.cycleStart&&cycleWeek(s)>=0&&cycleWeek(s)%DELOAD_EVERY===DELOAD_EVERY-1;
/* Skips make a day a rest day. Shifts push every later session one day forward (plan of day d comes from d minus the shifts before it). */
/* ---------- Calendar. Each date has one entry: p = from your plan (forløb), m = set by you (moved, scheduled, CrossFit),
   x = extra sessions, skip = skipped. What's on a day: skipped → rest, else m, else p, else your fixed week.
   All changes to the calendar go through the functions here. ---------- */
const addD=(d,n)=>{const t=pd(d);return ds(new Date(t.getFullYear(),t.getMonth(),t.getDate()+n))};
const dayOf=d=>(state.days||{})[d]||{};
function setDay(d,patch){const days={...(state.days||{})},o={...(days[d]||{}),...patch};
  for(const k of Object.keys(o))if(o[k]==null||o[k]===false||Array.isArray(o[k])&&!o[k].length)delete o[k];
  if(Object.keys(o).length)days[d]=o;else delete days[d];state.days=days}
const isSkipped=d=>!!dayOf(d).skip;
const setManual=(d,k)=>setDay(d,{m:k,skip:null});
const clearManual=d=>setDay(d,{m:null});
const skipDay=(d,on=true)=>setDay(d,{skip:on?1:null});
const addExtra=(d,k)=>setDay(d,{x:[...(dayOf(d).x||[]),k]});
const removeExtra=(d,i)=>{const x=(dayOf(d).x||[]).filter(k=>SESS[k]);x.splice(i,1);setDay(d,{x})};
const putSess=(k,x)=>{state.planSess={...(state.planSess||{}),[k]:x}};
const newKey=(p,d)=>p+d.replace(/-/g,'')+Math.random().toString(36).slice(2,6);
const planDates=()=>Object.keys(state.days||{}).filter(d=>state.days[d].p).sort();
/* Sessions made for one day that no day points to any more are removed */
function pruneSess(){const used=new Set(),old=addD(TODAY,-14);Object.values(state.days||{}).forEach(e=>{if(e.p)used.add(e.p);if(e.m)used.add(e.m);(e.x||[]).forEach(k=>used.add(k))});
  state.logs.forEach(l=>{if(l.key&&l.date>=old)used.add(l.key)});state.planSess=Object.fromEntries(Object.entries(state.planSess||{}).filter(([k])=>used.has(k)))}
function planDate(s){const n=(state.shifts||[]).filter(x=>x<s).length;if(!n)return s;const d=pd(s);d.setDate(d.getDate()-n);return ds(d)}
/* 'S' in the plan = a strength day. The app rotates Styrke A, B, C over the strength days of the week, so the whole body gets trained. */
function baseKey(s){const wd=pd(planDate(s)).getDay(),k=state.plan[wd]||'R';if(k!=='S')return k;
  const sDays=[1,2,3,4,5,6,0].filter(d=>state.plan[d]==='S');return ['A','B','C'][sDays.indexOf(wd)%3]}
function sessKey(s){const e=dayOf(s);if(e.skip)return 'R';if(e.m&&SESS[e.m])return e.m;if(e.p&&SESS[e.p])return e.p;const k=baseKey(s);
  if(SESS[k]&&SESS[k].kind==='interval'&&isDeload(s)){const wk=weekDates(s);const first=wk.find(d=>!isSkipped(d)&&SESS[baseKey(d)].kind==='interval');if(first!==s)return 'Z2'}
  return k}
const hr=p=>state.hrmax?Math.round(state.hrmax*p):null;
function hrLine(s){
  if(!state.hrmax)return '<p class="hint">Indtast din makspuls under Plan og data, så vises dine pulszoner her.</p>';
  if(s.kind==='zone2')return `<p class="sug num">Puls: ${hr(.6)}–${hr(.7)} bpm. Hold dig under ${hr(.7)}.</p>`;
  return `<p class="sug num">Pulsen stiger langsomt og rammer ${hr(.9)}–${hr(.95)} i slutningen af hvert hårdt stykke. I pauserne skal den falde til under ${hr(.75)}.</p>`;
}
const sessFor=s=>SESS[sessKey(s)];
/* Extra sessions on a day, on top of the day's main session */
const extrasOn=d=>(dayOf(d).x||[]).filter(k=>SESS[k]);
const logKind=k=>k==='styrke'?'styrke':k==='mobilitet'?'mobilitet':k==='crossfit'?'crossfit':'kondition';
function extraDone(d,i){const L=logsOn(d),ks=extrasOn(d),t=logKind(SESS[ks[i]].kind),main=sessFor(d);
  const need=(main.kind!=='hvile'&&logKind(main.kind)===t?1:0)+ks.slice(0,i).filter(k=>logKind(SESS[k].kind)===t).length+1;
  return L.filter(l=>l.type===t).length>=need}
const HABIT_LOG=t=>t==='kulde'||t==='meditation'||t==='tak'||/^h[a-z0-9]{6,}$/.test(t);
const trainLogs=()=>state.logs.filter(l=>!HABIT_LOG(l.type));
const logsOn=s=>state.logs.filter(l=>l.date===s);
const byDate=(a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.id<b.id?-1:1);
const logsOf=t=>state.logs.filter(l=>l.type===t).sort(byDate);
function isDone(s){const k=sessFor(s).kind,L=logsOn(s);if(k==='hvile')return false;return L.some(l=>l.type===(k==='styrke'?'styrke':k==='mobilitet'?'mobilitet':k==='crossfit'?'crossfit':'kondition'))}
const addonFor=s=>{if(isSkipped(s)||dayOf(s).m)return null;const k=(state.addons||{})[pd(planDate(s)).getDay()];return k&&SESS[k]?{key:k,s:SESS[k]}:null};
const addonDone=(d,a)=>logsOn(d).some(l=>l.type==='mobilitet'&&l.name===a.s.name);
const keyByName=n=>Object.keys(SESS).find(k=>SESS[k].name===n);
/* Minutes this week toward the Blueprint targets */
function weekStats(date){
  const wk=weekDates(date),set=new Set(wk),o={total:0,z2:0,vig:0,str:0,mob:0};
  state.logs.forEach(l=>{if(!set.has(l.date))return;
    if(l.type==='styrke'){o.str++;o.total+=Math.round((l.dur||55*60)/60)}
    else if(l.type==='mobilitet'){const m=Math.round((l.dur||600)/60);o.mob+=m;o.total+=m}
    else if(l.type==='crossfit'){const m=Math.round((l.dur||900)/60);o.total+=m;o.vig+=m}
    else if(l.type==='kondition'){const m=Math.round(l.dur/60),k=keyByName(l.name);o.total+=m;
      if(k&&SESS[k].kind==='interval'){const P=buildPhases(k),hard=Math.round(P.filter(p=>p.type!=='easy').reduce((a,p)=>a+p.sec,0)/60),v=Math.min(m,hard);o.vig+=v;o.z2+=m-v}
      else if(k&&SESS[k].kind==='zone2')o.z2+=m;
      else if((l.rpe||0)>=8)o.vig+=m;else o.z2+=m}});
  return o;
}
function weekDates(s){const d=pd(s);const off=(d.getDay()+6)%7;return Array.from({length:7},(_,i)=>ds(new Date(d.getFullYear(),d.getMonth(),d.getDate()-off+i)))}
function lastSet(ex){
  if(!ex)return null;const L=logsOf('styrke');const k=ex.trim().toLowerCase();
  for(let i=L.length-1;i>=0;i--){const ss=L[i].sets.filter(s=>s.ex.toLowerCase()===k);if(ss.length){
    /* top weight; among those the hardest set (fewest reps + RIR) drives the next suggestion */
    const top=Math.max(...ss.map(s=>s.kg||0)),cand=ss.filter(s=>(s.kg||0)===top);
    const eff=s=>s.reps+(s.rir??s.tRir??2);
    const b=cand.reduce((a,c)=>eff(c)<eff(a)?c:a);
    const known=cand.filter(s=>s.rir!=null),avgRir=known.length?known.reduce((a,s)=>a+s.rir,0)/known.length:null;
    const avgReps=cand.reduce((a,s)=>a+s.reps,0)/cand.length;
    return {...b,avgReps,avgRir,saet:ss.reduce((n,s)=>n+(s.saet||1),0),date:L[i].date}}}
  return null;
}
/* All sets from the most recent session of an exercise, one entry per set */
function lastSets(ex){
  if(!ex)return [];const L=logsOf('styrke');const k=String(ex).trim().toLowerCase();
  for(let i=L.length-1;i>=0;i--){const ss=L[i].sets.filter(s=>s.ex.toLowerCase()===k);if(ss.length){
    const out=[];ss.forEach(s=>{for(let j=0;j<(s.saet||1);j++)out.push({kg:s.kg||0,reps:s.reps,rir:(j===(s.saet||1)-1)?s.rir:null})});return out}}
  return [];
}
/* Planned target for an exercise: reps and RIR */
function target(ex){const k=String(ex||'').trim().toLowerCase();for(const s of Object.values(SESS))for(const e of (s.ex||[]))if(e[0].toLowerCase()===k)return {reps:e[2],rir:e[3]};return null}
/* Next-session load. delta = (reps done + RIR) − (target reps + target RIR).
   On target → small step up. Each rep of difference ≈ 3,5 % (Epley: 1 rep ≈ 1/30 of 1RM). Capped at ±10 %. */
function suggest(ex){
  const l=lastSet(ex);if(!l)return null;
  const t=target(ex);
  const tr=l.tReps||(t?t.reps:l.reps), trir=(l.tRir??(t?t.rir:2));
  /* average over all sets at the top weight, so one grindy last set doesn't swing the load */
  const rir=l.avgRir!=null?l.avgRir:trir;
  const delta=Math.round((l.avgReps??l.reps)+rir-(tr+trir));
  if(!l.kg){
    if(delta>=3)return {kg:2.5,bw:true,text:'Tilføj 2,5 kg',l,rir,delta};
    if(delta>=0)return {kg:0,bw:true,text:'Prøv 1 rep mere',l,rir,delta};
    return {kg:0,bw:true,text:'Samme som sidst',l,rir,delta};
  }
  const lx=strFor(ex),step=lx&&lx[1]===EQ_KB?4:(lx&&lx[1]===EQ_DB)||/håndvægt|bulgarsk|farmer|pallof/i.test(ex)?2:2.5;
  let next;
  if(delta===0)next=l.kg+step;
  else{next=l.kg*Math.max(.9,Math.min(1.1,1+.035*delta));if(delta>0)next=Math.max(next,l.kg+step)}
  next=Math.max(step,Math.round(next/step)*step);
  return {kg:next,bw:false,text:fnum(next)+' kg',l,rir,delta};
}
const rirTxt=r=>(r===null||r===undefined||r==='')?'':` · ${r} i tanken`;
function loggedExercises(){const m=new Map();logsOf('styrke').forEach(l=>l.sets.forEach(s=>m.set(s.ex.toLowerCase(),s.ex)));return [...m.values()]}
