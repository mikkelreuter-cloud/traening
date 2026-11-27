/* Feedback efter pas og forslag til justering af planen (godkendes før de udføres). */
/* ---------- Feedback after each session ---------- */
const TRAIN_T=['styrke','kondition','crossfit','mobilitet'];
let fbKnown=null;
const fbPending=()=>fbKnown?state.logs.find(l=>TRAIN_T.includes(l.type)&&!fbKnown.has(l.id)&&l.fb===undefined):null;
const FB_R=[['traet','Træt'],['syg','Syg'],['skade','Ømhed eller skade'],['tid','For lidt tid'],['ovelse','Øvelsen passede ikke']];
function fbSheet(){const id=ui.fbHard,l=id?state.logs.find(x=>x.id===id):fbPending();if(!l)return '';const se=SESS[l.key]||{};
  const tp=sessTPace(se),q=se.rtest?null:tp?['pace',`Holdt du pacen (${fmtPace(tp)}/km)?`]:se.km?['dist',`Løb du hele turen (${fmtKm(se.km)} km)?`]:null;
  return `<div class="sheet-bg"><div class="sheet" role="dialog" aria-label="Hvordan gik det?"><p class="sheet-t">Hvordan gik det?</p><p class="muted small center">${esc(l.sess||l.name||'')}</p>
    ${!id?`<div class="fb-g">${[[1,'Let'],[2,'Passende'],[3,'Hårdt'],[4,'For hårdt']].map(([v,t])=>`<button class="${l.fb===v||l._fb===v?'on':''}" data-act="fb" data-v="${v}">${t}</button>`).join('')}</div>
    ${q?`<p class="small" style="margin-top:12px">${q[1]}</p><div class="fb-g three">${[[2,'Ja'],[1,'Tæt på'],[0,'Nej']].map(([v,t])=>`<button class="${l[q[0]+'Ok']===v?'on':''}" data-act="fbq" data-f="${q[0]}" data-v="${v}">${t}</button>`).join('')}</div>`:''}
    <button class="restbtn" data-act="fbskip">Spring over</button>`
    :`<p class="small">Hvad var grunden?</p><div class="chips">${FB_R.map(([k,t])=>`<button data-act="fbr" data-v="${k}">${t}</button>`).join('')}</div><button class="restbtn" data-act="fbrskip">Ingen grund</button>`}</div></div>`}

/* ---------- Adapting the plan. The app notices when training drifts from the plan or results change,
   suggests a concrete change, and applies it only after you approve. ---------- */
const adS=()=>state.adapt||(state.adapt={handled:{},since:TODAY,hist:[]});
const trainedOn=d=>logsOn(d).some(l=>TRAIN_T.includes(l.type));
const plannedOn=d=>{const k=sessKey(d);return k!=='R'&&SESS[k]&&SESS[k].kind!=='hvile'};
function missed(from,to){const st=adS().since,b=state.block,out=[];for(let d=from;d<to;d=addD(d,1)){if(d<st||(b&&d<b.start&&dayOf(d).p))continue;if(plannedOn(d)&&!trainedOn(d))out.push(d)}return out}
const dlab=d=>`${PL_SHORT[pd(d).getDay()]} ${shortDate(d)}`;
const kgOrPct=(n,p)=>{const k=kgFor(n,p);return k?fnum(k)+' kg':p+' %'};
/* Make plan sessions in a date range lighter. Only the plan's own sessions change; your fixed week stays as it is. */
function lighten(from,days,drop,dry){const lines=[],ps={...(state.planSess||{})};
  for(let i=0;i<days;i++){const d=addD(from,i),k=sessKey(d),x=ps[k];if(!x||d<TODAY)continue;
    if(x.kind==='styrke'&&x.ex){const ex=x.ex.map(e=>[e[0],Math.max(2,e[1]-1),e[2],e[3]]),np=x.pct?Math.max(50,x.pct-drop):null;
      lines.push(`${dlab(d)} · ${x.main||x.ex[0][0]}: ${x.ex[0][1]} sæt${x.pct?' @ '+kgOrPct(x.main,x.pct):''} → ${ex[0][1]} sæt${np?' @ '+kgOrPct(x.main,np):''}`);
      if(!dry)ps[k]={...x,ex,pct:np,note:'Justeret: lettere, så du kan komme ind i rytmen igen. '+(x.note||'').replace(/^Justeret:[^.]*\. /,'')}}
    else if(x.phases&&x.kind==='interval'){const work=x.phases.filter(p=>p[2]==='work').length;if(work<3)continue;
      const ph=x.phases.slice(),li=ph.map(p=>p[2]).lastIndexOf('work');ph.splice(li-(ph[li-1]&&ph[li-1][2]==='rest'?1:0),ph[li-1]&&ph[li-1][2]==='rest'?2:1);
      lines.push(`${dlab(d)} · ${x.name}: ${work} → ${work-1} hårde intervaller`);
      if(!dry){const min=Math.round(ph.reduce((a,p)=>a+p[1],0)/60);ps[k]={...x,phases:ph,min,dur:'ca. '+min+' min',name:x.name+' (kortere)',steps:[...(x.steps||[]),`Justeret: ét hårdt interval færre (${work-1} i alt)`]}}}
    else if(x.rk&&x.km&&drop>=15){const km=Math.round(x.km*.8*2)/2;lines.push(`${dlab(d)} · Langtur ${fmtKm(x.km)} → ${fmtKm(km)} km`);
      if(!dry)ps[k]={...x,km,name:`Langtur ${fmtKm(km)} km`,steps:[`${fmtKm(km)} km roligt`,...(x.steps||[]).slice(1)]}}}
  if(!dry){state.planSess=ps}return lines}
/* Push the rest of the plan one week. This week is filled with a repeat of last week (or an easy restart week). */
function shiftPlan(fill,dry){const b=state.block,bd=Object.fromEntries(planDates().map(d=>[d,dayOf(d).p])),fut=Object.keys(bd).filter(d=>d>=TODAY).sort(),end=addD(b.end,7),cw=Math.floor((pd(TODAY)-pd(b.start))/(7*864e5));
  const lines=[`Resten af forløbet rykker en uge. Det slutter ${shortDate(end)} i stedet for ${shortDate(b.end)}.`];
  const week=[...Array(7)].map((_,i)=>addD(TODAY,i)),srcD=d=>fill==='repeat'&&bd[addD(d,-7)]?addD(d,-7):d,src=d=>bd[srcD(d)];
  lines.push(fill==='repeat'?'Denne uge gentager du sidste uges pas: '+week.filter(d=>src(d)&&SESS[src(d)]&&SESS[src(d)].kind!=='hvile').map(d=>`${PL_SHORT[pd(d).getDay()]} ${SESS[src(d)].name}`).join(', '):'Denne uge bliver en rolig genstartsuge med korte, lette pas.');
  if(dry)return lines;
  fut.forEach(d=>setDay(d,{p:null}));fut.forEach(d=>setDay(addD(d,7),{p:bd[d]}));
  week.forEach(d=>{const k=bd[srcD(d)];if(!k)return;const x=(state.planSess||{})[k];if(!x){setDay(d,{p:k});return}let c=JSON.parse(JSON.stringify(x));
    if(fill==='easy'){if(c.kind==='styrke'&&c.ex){c.ex=c.ex.map(e=>[e[0],2,e[2],Math.max(3,e[3])]);c.pct=c.pct?Math.max(55,c.pct-15):null;c.name=c.name.replace(/ · uge \d+$/,'')+' · let';c.note='Genstartsuge: let og kort.'}
      else if(c.kind==='interval'||c.kind==='zone2'){c={name:'Genstart · roligt 30 min',kind:'zone2',steps:['30 min roligt løb, cykel eller ro','Du skal kunne tale i hele sætninger'],min:30,dur:'30 min',phases:[['Roligt tempo',1800,'easy']]}}}
    const id=newKey(k[0],d);putSess(id,c);setDay(d,{p:id})});
  state.block={...b,end,weeks:b.weeks+1,deloads:fill==='easy'?[cw,...b.deloads.map(x=>x>=cw?x+1:x)]:b.deloads.map(x=>x>=cw?x+1:x)};return lines}
/* Move a missed session to another day */
function moveSess(d,t,dry){const k=sessKey(d),x=SESS[k];if(dry)return [`${x.name} flyttes fra ${dlab(d)} til ${dlab(t)}.`];
  setManual(t,k);skipDay(d);return []}
function dropSess(ds_,dry){if(dry)return ds_.map(d=>`${dlab(d)} · ${SESS[sessKey(d)].name} droppes.`);ds_.forEach(d=>skipDay(d));return []}
/* Run plans: rebuild the remaining runs from the plan answers with a new goal pace or shorter long runs */
function rebuildRuns(ch,dry){const b=state.block;if(!b||!b.P)return [];const P={...b.P,...ch},ps={...state.planSess},lines=[];
  planDates().forEach(d=>{const k=dayOf(d).p,x=ps[k];if(d<TODAY||!x||!x.rk)return;const [,n]=runSess({...P,nRun:x.rk.nRun},x.rk.kind,x.rk.bi,x.rk.nb,x.rk.wi,d);n.rk=x.rk;
    if(n.name!==x.name&&lines.length<4)lines.push(`${dlab(d)} · ${x.name} → ${n.name}`);ps[k]=n});
  if(ch.pace)lines.unshift(`Mål-pace: ${fmtPace(b.P.pace)} → ${fmtPace(P.pace)} /km`);
  if(!dry){state.planSess=ps;state.block={...b,P,goalName:plGoalName(P)}}return lines}
/* How a logged strength session compared with the plan for one lift: (reps + reps in reserve) − (target reps + target RIR) */
function liftDelta(l,lift){const ss=l.sets.filter(x=>liftKey(x.ex)===liftKey(lift)&&x.tReps);if(!ss.length)return null;
  return ss.reduce((a,x)=>a+(x.reps+(x.rir??x.tRir??0))-(x.tReps+(x.tRir??0)),0)/ss.length}
function adaptFind(){const A=adS(),b=plActive(),H=A.handled,out=[],add=p=>{if(!H[p.id]&&p.opts.length)out.push(p)};
  const T=state.logs.filter(l=>TRAIN_T.includes(l.type)).sort(byDate),lastT=T.length?T[T.length-1].date:null,wk=addD(TODAY,-7);
  const fut=[...Array(14)].map((_,i)=>addD(TODAY,i));
  // 1. A long break
  const m7=missed(wk,TODAY);
  if(b&&m7.length>=3&&(!lastT||lastT<wk))add({id:'gap:'+(lastT||'0'),title:'Du har ikke trænet i over en uge',why:`Du har misset ${m7.length} pas. At springe direkte tilbage i planen øger risikoen for skader.`,
    opts:[{label:'Genstartsuge',lines:shiftPlan('easy',1),apply:()=>shiftPlan('easy')},{label:'Fortsæt lettere',lines:lighten(TODAY,7,15,1),apply:()=>lighten(TODAY,7,15)}]});
  // 2. Several missed this week
  else if(b&&m7.length>=2)add({id:'mw:'+m7.join(','),title:`Du missede ${m7.length} pas den seneste uge`,why:'Planen bygger videre uge for uge, så de missede pas mangler i opbygningen.',
    opts:[{label:'Gentag ugen',lines:shiftPlan('repeat',1),apply:()=>shiftPlan('repeat')},{label:'Behold datoerne, lettere uge',lines:lighten(TODAY,7,10,1),apply:()=>lighten(TODAY,7,10)},{label:'Drop de missede pas',lines:dropSess(m7,1),apply:()=>dropSess(m7)}]});
  // 3. One missed session
  const m3=missed(addD(TODAY,-3),TODAY).filter(d=>!H['m1:'+d]);
  if(m3.length&&!out.length){const d=m3[m3.length-1],t=fut.slice(0,4).find(x=>!plannedOn(x)&&!extrasOn(x).length&&!trainedOn(x));
    add({id:'m1:'+d,title:`Du missede ${SESS[sessKey(d)].name} ${DAYS[pd(d).getDay()]}`,why:t?`${cap(DAYS[pd(t).getDay()])} er ledig, så passet kan nås endnu.`:'Der er ingen ledig dag de næste dage.',
      opts:[...(t?[{label:`Flyt til ${DAYS[pd(t).getDay()]}`,lines:moveSess(d,t,1),apply:()=>moveSess(d,t)}]:[]),{label:'Drop det',lines:dropSess([d],1),apply:()=>dropSess([d])}]})}
  // 4. Feedback: sick, or too hard twice
  const recent=T.filter(l=>l.date>=wk);const sick=recent.filter(l=>l.fbr==='syg').pop();
  if(sick)add({id:'sick:'+sick.id,title:'Du var syg',why:'Træn først hårdt igen, når du har været feberfri i et døgn. Planen kan tage hensyn til det.',
    opts:[{label:'Lettere uge',lines:lighten(TODAY,7,20,1),apply:()=>lighten(TODAY,7,20)},{label:'Hold 3 dages pause',lines:dropSess(fut.slice(0,3).filter(plannedOn),1),apply:()=>dropSess(fut.slice(0,3).filter(plannedOn))}]});
  const hard=recent.filter(l=>l.fb===4&&l.fbr!=='syg');
  if(hard.length>=2)add({id:'fh:'+hard[hard.length-1].id,title:'To pas var for hårde den seneste uge',why:'Træthed hober sig op. En lettere uge nu giver bedre træning bagefter.',
    opts:[{label:'Lettere uge',lines:lighten(TODAY,7,10,1),apply:()=>lighten(TODAY,7,10)},{label:'Tag en let uge nu',lines:lighten(TODAY,7,25,1),apply:()=>lighten(TODAY,7,25)}]});
  // 5. Strength results, per main lift in the coming plan
  const lifts=[...new Set(fut.map(d=>SESS[sessKey(d)]).filter(x=>x&&x.pct&&x.main).map(x=>x.main))];
  lifts.forEach(lift=>{const L=logsOf('styrke').filter(l=>l.sets&&liftDelta(l,lift)!=null).slice(-2);if(L.length<2)return;const dd=L.map(l=>liftDelta(l,lift));
    const bump=(v,dry)=>{const ps={...state.planSess},lines=[];fut.forEach(d=>{const k=sessKey(d),x=ps[k];if(x&&x.pct&&x.main===lift){const np=Math.max(50,Math.min(97.5,x.pct+v));lines.push(`${dlab(d)} · ${lift}: ${kgOrPct(lift,x.pct)} → ${kgOrPct(lift,np)}`);if(!dry)ps[k]={...x,pct:np}}});if(!dry)state.planSess=ps;return lines};
    if(dd.every(x=>x<=-2))add({id:'sd:'+lift+':'+L[1].id,title:`${lift} gik tungere end planlagt`,why:'Du har klaret færre gentagelser eller haft mindre i tanken end planlagt to pas i træk.',
      opts:[{label:`Sænk ${lift} 5 %`,lines:bump(-5,1),apply:()=>bump(-5)},{label:'Lettere uge for hele kroppen',lines:lighten(TODAY,7,10,1),apply:()=>lighten(TODAY,7,10)}]});
    else if(dd.every(x=>x>=2))add({id:'su:'+lift+':'+L[1].id,title:`${lift} går bedre end planlagt`,why:'Du har haft mindst 2 gentagelser mere i tanken end planlagt to pas i træk.',
      opts:[{label:`Hæv ${lift} 2,5 %`,lines:bump(2.5,1),apply:()=>bump(2.5)},{label:`Hæv ${lift} 5 %`,lines:bump(5,1),apply:()=>bump(5)}]})});
  // 6. Intervals stopped early or too hard
  const cond=state.logs.filter(l=>l.type==='kondition'&&l.date>=addD(TODAY,-10)&&(l.early||l.fb===4&&SESS[l.key]&&SESS[l.key].kind==='interval'));
  if(cond.length>=2)add({id:'ce:'+cond[cond.length-1].id,title:'Intervallerne har været for hårde',why:'Du har stoppet før tid eller syntes, intervallerne var for hårde, to gange.',
    opts:[{label:'Kortere intervaller i en uge',lines:lighten(TODAY,7,10,1).filter(x=>/interval/.test(x)),apply:()=>lighten(TODAY,7,10)}]});
  // 7a. A new running time compared with what the plan expects now
  if(b&&b.P&&b.P.vd){const after=vdHist().filter(x=>x.date>=(b.made&&b.made<b.start?b.made:b.start)&&x.src!=='plan'),c=after[after.length-1],base=b.vBase!=null?b.vBase:b.P.vStart!=null?b.P.vStart:after.length?after[0].v:null;
    if(c&&base!=null&&!(b.P.vStart==null&&after.length===1)){const nb=Math.max(1,(b.weeks||1)-1),wkNow=Math.min(1,Math.max(0,(pd(TODAY)-pd(b.start))/(7*864e5)/nb)),plan=base+(b.P.vGain||0)*wkNow+(b.vAdj||0);
      const shift=d=>[`Intervaltempo: ${fmtPace(zPace(plan,'I'))} → ${fmtPace(zPace(plan+d,'I'))}/km`,`Tærskeltempo: ${fmtPace(zPace(plan,'T'))} → ${fmtPace(zPace(plan+d,'T'))}/km`];
      if(c.v<plan-1.5)add({id:'vd:'+c.date+c.v.toFixed(1),title:'Din nye tid er langsommere end planen regner med',why:`${fmtKm(c.km)} km på ${fmtTime(c.sec)} svarer til VDOT ${fmtKm(c.v)}. Planen regner med ${fmtKm(plan)} nu.`,
        opts:[{label:'Sæt tempoerne efter den nye tid',lines:shift(c.v-plan),apply:()=>{state.block={...state.block,vBase:base+(c.v-plan)}}}]});
      else if(b.goal==='pace'&&vdPredict(c.v,b.P.dist)<b.P.pace*b.P.dist){const np=Math.round(vdPredict(c.v+.5*(b.P.vGain||1),b.P.dist)/b.P.dist/5)*5;
        add({id:'vu:'+c.date+c.v.toFixed(1),title:'Du er allerede på mål-niveau',why:`${fmtKm(c.km)} km på ${fmtTime(c.sec)} svarer til ${fmtTime(vdPredict(c.v,b.P.dist))} på ${RUN_D[b.P.dist].toLowerCase()}. Det er hurtigere end dit mål.`,
          opts:[{label:`Hæv målet til ${fmtPace(np)}/km`,lines:[`Mål-pace: ${fmtPace(b.P.pace)} → ${fmtPace(np)} /km`],apply:()=>{const B=state.block;state.block={...B,P:{...B.P,pace:np},goalName:plGoalName({...B.P,pace:np})}}}]})}}}
  // 7. Running goals
  if(b&&b.P&&isRun(b.goal)){const R=state.logs.filter(l=>l.type==='kondition'&&l.date>=b.start&&(l.paceOk!==undefined||l.distOk!==undefined)).slice(-3);
    const vdAdj=(d,dry)=>{const V=effV({vb:0});if(dry)return V?[`Intervaltempo: ${fmtPace(zPace(V,'I'))} → ${fmtPace(zPace(V+d,'I'))}/km`,`Tærskeltempo: ${fmtPace(zPace(V,'T'))} → ${fmtPace(zPace(V+d,'T'))}/km`]:[];state.block={...state.block,vAdj:(state.block.vAdj||0)+d};return []};
    if(b.P.vd&&R.filter(l=>l.paceOk===0).length>=2)add({id:'rs:'+R[R.length-1].id,title:'Tempoerne er for hurtige lige nu',why:'Du har ikke kunnet holde planens tempo to gange. Træningen virker bedst, når du kan ramme det.',
      opts:[{label:'Lidt roligere tempoer',lines:vdAdj(-1,1),apply:()=>vdAdj(-1)},{label:'Tydeligt roligere',lines:vdAdj(-2,1),apply:()=>vdAdj(-2)}]});
    else if(b.P.vd&&R.length>=2&&R.slice(-2).every(l=>l.paceOk===2&&l.fb===1))add({id:'rf:'+R[R.length-1].id,title:'Tempoerne er lette for dig',why:'Du har holdt tempoet og syntes, det var let, to gange.',
      opts:[{label:'Lidt hurtigere tempoer',lines:vdAdj(1,1),apply:()=>vdAdj(1)}]});
    if(!b.P.vd&&b.goal==='pace'&&R.filter(l=>l.paceOk===0).length>=2)add({id:'rs:'+R[R.length-1].id,title:'Pacen er for hurtig lige nu',why:'Du har ikke kunnet holde planens pace to gange. Planen virker bedst, når du kan ramme tempoet.',
      opts:[{label:'Sænk mål-pacen 5 sek/km',lines:rebuildRuns({pace:b.P.pace+5,curPace:Math.max(b.P.curPace,b.P.pace+5)},1),apply:()=>rebuildRuns({pace:b.P.pace+5,curPace:Math.max(b.P.curPace,b.P.pace+5)})},
            {label:'Sænk 10 sek/km',lines:rebuildRuns({pace:b.P.pace+10,curPace:Math.max(b.P.curPace,b.P.pace+10)},1),apply:()=>rebuildRuns({pace:b.P.pace+10,curPace:Math.max(b.P.curPace,b.P.pace+10)})}]});
    if(!b.P.vd&&b.goal==='pace'&&R.length>=2&&R.slice(-2).every(l=>l.paceOk===2&&l.fb===1))add({id:'rf:'+R[R.length-1].id,title:'Pacen er let for dig',why:'Du har holdt pacen og syntes, det var let, to gange.',
      opts:[{label:'Hæv mål-pacen 5 sek/km',lines:rebuildRuns({pace:Math.max(150,b.P.pace-5)},1),apply:()=>rebuildRuns({pace:Math.max(150,b.P.pace-5)})}]});
    if(b.goal==='distance'&&R.filter(l=>l.distOk===0).length>=2){const lf=(b.P.lf||1)*.9;add({id:'rd:'+R[R.length-1].id,title:'Langturene er for lange lige nu',why:'Du har ikke nået hele langturen to gange.',
      opts:[{label:'Kortere langture (−10 %)',lines:rebuildRuns({lf},1),apply:()=>rebuildRuns({lf})}]})}}
  return out}
function adaptCard(){const P=adaptFind();if(!P.length)return '';const p=P[0],i=Math.min(ui.adOpt||0,p.opts.length-1),o=p.opts[i];ui.adCur={id:p.id,i};
  return `<section class="card ad-card"><p class="eyebrow">Forslag til din plan${P.length>1?` · 1 af ${P.length}`:''}</p><h3 class="ad-t">${esc(p.title)}</h3><p class="muted small">${esc(p.why)}</p>
    <div class="ad-o"><b>${esc(o.label)}</b>${o.lines.length?`<ul>${o.lines.slice(0,6).map(x=>`<li>${esc(x)}</li>`).join('')}${o.lines.length>6?`<li class="muted">+ ${o.lines.length-6} mere</li>`:''}</ul>`:''}</div>
    <div class="btns3" style="grid-template-columns:2fr 1fr"><button class="btn accent" data-act="adok">Godkend</button><button class="btn ghost" data-act="adno">Afvis</button></div>
    ${p.opts.length>1?`<button class="restbtn" data-act="adalt">Andet forslag (${i+1}/${p.opts.length})</button>`:''}</section>`}
function viewSess(){
  const k=ui.trKey,se=SESS[k];if(!se){ui.view='train';return viewTrain()}
  return `<div class="habit-head"><button class="icon-btn" data-act="view" data-view="train" aria-label="Tilbage" data-back>‹</button><h2 class="h2">${esc(se.name)}</h2></div>
  <section class="card k-${se.kind}"><div class="row-between">${chip(se.kind,se.label||KIND_LABEL[se.kind])}${se.dur?`<span class="muted small">${esc(se.dur)}</span>`:''}</div>
    ${sessionBody(se)}${se.note?`<p class="note">${esc(se.note)}</p>`:''}
    <button class="btn accent" data-act="trstart" data-key="${k}">${se.kind==='mobilitet'?`Færdig · ${se.min||10} min`:'Start'}</button>
    <button class="btn ghost" data-act="seedit" data-key="${k}">Rediger pas</button>
    <button class="btn ghost" data-act="schopen" data-src="key" data-key="${k}">📅 Læg i kalenderen</button></section>`;
}
const SE_KINDS=[['styrke','Styrke','Øvelser med sæt og vægt'],['crossfit','CrossFit','En WOD med format og tid'],['interval','Hård kondition','Fx intervaller'],['zone2','Rolig kondition','Fx en rolig tur'],['mobilitet','Mobilitet','Smidighed og udstrækning'],['restitution','Aktiv restitution','Let bevægelse dagen efter']];
