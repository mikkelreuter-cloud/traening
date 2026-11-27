/* Handlinger: alle klik (data-act), gem, backup og opstart. */
/* ---------- actions ---------- */
function doSave(){
  const date=ui.logDate||TODAY,id=Date.now().toString(36)+Math.random().toString(36).slice(2,6),t=ui.logType;let entry;
  if(t==='styrke'){
    const anyDone=ui.rows.some(r=>r.sets.some(s=>s.done));
    const sets=[];ui.rows.forEach(r=>{const ex=String(r.ex).trim();if(!ex)return;const t=target(ex);
      r.sets.forEach(s=>{if(anyDone&&!s.done)return;const reps=parseInt(s.reps)||0,q=parseInt(s.rir);if(reps<=0)return;
        sets.push({ex,kg:num(s.kg)??0,saet:1,reps,rir:isFinite(q)?q:null,tReps:r.tReps??(t?t.reps:null),tRir:r.tRir??(t?t.rir:null)})})});
    if(!sets.length)return toast('Udfyld mindst ét sæt med reps');
    const dur=ui.wStart?Math.min(150*60,Math.max(20*60,Math.round((Date.now()-ui.wStart)/1000))):55*60;
    entry={id,date,type:'styrke',key:ui.sess,sess:ui.sess==='X'?'Styrke':SESS[ui.sess].name,sets,dur};ui.wStart=null;
  }else if(t==='kondition'){
    const dur=(num(ui.k.min)||0)*60+(num(ui.k.sek)||0);if(!dur)return toast('Skriv hvor lang tid du trænede');
    entry={id,date,type:'kondition',key:ui.k.sess,early:!!ui.k.early,race:!!ui.k.race||!!(SESS[ui.k.sess]&&SESS[ui.k.sess].rtest&&num(ui.k.dist)),name:ui.k.sess==='X'?'Kondition':SESS[ui.k.sess].name,dur,dist:num(ui.k.dist),hr:num(ui.k.hr),rpe:num(ui.k.rpe),note:ui.k.note.trim()};
  }else if(t==='vaegt'){
    const kg=num(ui.v.kg);if(!kg)return toast('Skriv din vægt i kg');entry={id,date,type:'vaegt',kg};
  }else{
    const name=ui.t.name.trim();if(!name)return toast('Skriv hvilken test det er');
    const value=ui.t.unit==='tid'?parseTime(ui.t.val):num(ui.t.val);if(value===null||!value)return toast(ui.t.unit==='tid'?'Skriv tiden som mm:ss, fx 12:30':'Skriv et tal');
    entry={id,date,type:'test',name,value,unit:ui.t.unit};
  }
  state.logs.push(entry);save();
  if(t==='styrke'){clearDraft();ui.rest=null;$('#restbar').hidden=true;initRows(ui.sess==='X'?'A':ui.sess)}
  ui.k={...ui.k,min:'',sek:'',dist:'',hr:'',rpe:'',note:'',early:false,race:false};ui.v.kg='';ui.t.val='';ui.dirty=false;
  if(!storageOK){render();return toast('Kunne ikke gemme på telefonen')}
  if((t==='styrke'||t==='kondition')&&date===TODAY){ui.view='today';render(true);toast(t==='styrke'?'Gemt. Næste gangs vægte er klar.':'Gemt')}
  else{render();toast('Gemt')}
}
function doCopy(){
  const txt=JSON.stringify(state),ta=$('#exp');
  const mark=()=>{state.lastBackup=TODAY;save()};
  const fallback=()=>{mark();ta.hidden=false;ta.value=txt;ta.focus();ta.select();toast('Markér og kopiér teksten')};
  try{navigator.clipboard.writeText(txt).then(()=>{mark();render();toast('Backup kopieret')},fallback)}catch(e){fallback()}
}
function doRestore(){
  let d;try{d=JSON.parse(ui.impText)}catch(e){d=null}
  if(!d||!Array.isArray(d.logs)){ui.pendingRestore=false;render();return toast('Teksten er ikke en gyldig backup')}
  if(!ui.pendingRestore){ui.pendingRestore=true;return render()}
  try{state={...normalize(d),onboarded:true}}catch(e){ui.pendingRestore=false;render();return toast('Teksten er ikke en gyldig backup')}dataBroken=null;save();ui.pendingRestore=false;ui.impText='';render();toast(`Gendannet ${d.logs.length} logs`);applySess();
}
function guessUnit(name){
  const prev=logsOf('test').filter(l=>l.name===name);if(prev.length)return prev[prev.length-1].unit;
  const n=name.toLowerCase();
  if(n.includes('1rm'))return 'kg';if(n.includes('cooper'))return 'm';if(n.includes('pull')||n.includes('reps'))return 'reps';if(n.includes('vo₂')||n.includes('vo2'))return 'ml/kg/min';
  return 'tid';
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(b.dataset.back!==undefined&&navDepth>0){history.back();return}
  if(a!=='del')ui.pendingDel=null;if(a!=='hdel')ui.delHabit=null;if(a!=='sedel')ui.seDel=false;if(a!=='wipe')ui.pendingWipe=false;if(a!=='restore')ui.pendingRestore=false;if(a!=='tstop'&&timer)timer.stopArmed=false;
  switch(a){
    case 'timer':startTimer(b.dataset.key);break;
    case 'tpause':if(timer.paused){timer.end=Date.now()+timer.left;timer.paused=false;keepAwake()}else{timer.left=timer.end-Date.now();timer.paused=true}render();break;
    case 'tskip':advance(true);break;
    case 'tstop':if(timer.stopArmed)finishTimer(false);else{timer.stopArmed=true;render()}break;
    case 'rest':beep(660,.04,.05);ui.rest={end:Date.now()+(+b.dataset.sec)*1000,done:false};$('#restbar').hidden=false;ensureLoop();tick();break;
    case 'reststop':ui.rest=null;$('#restbar').hidden=true;break;
    case 'setdone':{const r=ui.rows[+b.dataset.i],s=r.sets[+b.dataset.j];if(!ui.wStart)ui.wStart=Date.now()-60*1000;
      if(!s.done&&!(parseInt(s.reps)>0)){toast('Skriv reps først');break}
      s.done=!s.done;ui.dirty=true;saveDraft();
      if(s.done){beep(660,.04,.05);buzz(30);ui.rest={end:Date.now()+restSec(r.ex)*1000,done:false};$('#restbar').hidden=false;ensureLoop();tick()}
      render();break}
    case 'addset':{const r=ui.rows[+b.dataset.i],l=r.sets[r.sets.length-1]||{kg:'',reps:r.tReps?String(r.tReps):'',rir:''};r.sets.push({kg:l.kg,reps:l.reps,rir:'',done:false});ui.dirty=true;saveDraft();render();break}
    case 'rmset':{const r=ui.rows[+b.dataset.i];if(r.sets.length>1)r.sets.pop();ui.dirty=true;saveDraft();render();break}
    case 'logtest':ui.logFrom=ui.view;ui.logType='test';ui.logDate=TODAY;ui.view='log';render(true);break;
    case 'view':{const to=b.dataset.view;if(to==='log'&&!ui.dirty){ui.view=to;openLog(TODAY);return}if(b.classList.contains('tab'))slideTo(to);else{ui.view=to;render(true)}break}
    case 'settings':ui.setFrom=ui.view;ui.view='settings';render(true);break;
    case 'setback':ui.view=ui.setFrom&&ui.setFrom!=='settings'?ui.setFrom:'today';render(true);break;
    case 'settheme':state.theme=b.dataset.v;save();applyLook();render();break;
    case 'setaccent':state.accent=b.dataset.v;save();applyLook();render();break;
    case 'bktog':ui.bk=!ui.bk;render();break;
    case 'mday':{freezeTop();const d=b.dataset.date;ui.mOpen=ui.mOpen===d?null:d;render();break}
    case 'logday':openLog(b.dataset.date);break;
    case 'calday':case 'sel':{ui.dayBack=ui.view==='day'?ui.dayBack:ui.view;ui.sel=b.dataset.date;const d=pd(ui.sel);ui.calY=d.getFullYear();ui.calM=d.getMonth();ui.view='day';render(true);break}
    case 'dayback':ui.view=ui.dayBack||'today';render(true);break;
    case 'xstart':{const se=SESS[b.dataset.key];if(se&&se.fw){ui.fwKey=b.dataset.key;ui.fwDate=b.dataset.date||TODAY;ui.fwSwap=null;ui.fwLog=null;ui.view='fw';render(true);break}}
    // falls through: other extra sessions start like any session
    case 'trstart':{const k=b.dataset.key,se=SESS[k];
      if(se.kind==='styrke'){ui.logDate=TODAY;ui.logType='styrke';const d=loadDraft();if(d&&d.sess===k){ui.sess=k;ui.rows=d.rows;ui.wStart=d.wStart||null}else{ui.sess=k;initRows(k)}ui.dirty=false;ui.view='log';render(true)}
      else if(se.kind==='interval'||se.kind==='zone2')startTimer(k);
      else if(se.kind==='crossfit'&&se.cf){const P=cfPrefs();ui.cf={date:TODAY,step:'pas',fmt:se.cf.fmtId,min:se.cf.min,pas:cfRebuild(se.cf),swapI:null,showUdstyr:false,res:{score:'',rpe:'',note:''}};ui.view='cf';render(true)}
      else if(se.kind==='crossfit'){state.logs.push({id:Date.now().toString(36),date:TODAY,type:'crossfit',name:se.name,dur:(se.min||20)*60,linjer:se.steps||[]});save();render();toast(se.name+' logget')}
      else if(se.kind==='mobilitet'){state.logs.push({id:Date.now().toString(36),date:TODAY,type:'mobilitet',name:se.name,dur:se.min*60});save();render();toast(se.name+' logget · '+se.min+' min')}
      break}
    case 'trgrp':{freezeTop();const o=trOpen(),g=b.dataset.g;o.has(g)?o.delete(g):o.add(g);render();break}
    case 'trsess':ui.trKey=b.dataset.key;ui.view='sess';render(true);break;
    case 'trrand':{ui.se=seDraft(null);ui.seDel=false;const o=strOpts(),ex=strSuggest(o);if(ex.length)ui.se.ex=ex;ui.seAuto=ui.se.name=`${STR_FOCUS[o.focus][0]} · ${o.min} min · ${STR_INT[o.int][0].toLowerCase()}`;ui.view='sessedit';render(true);break}
    case 'senew':ui.se=seDraft(null);ui.seDel=false;ui.view='sessedit';render(true);break;
    case 'seedit':ui.se=seDraft(b.dataset.key);ui.seDel=false;ui.view='sessedit';render(true);break;
    case 'sebask':ui.view=ui.se&&ui.se.key?'sess':'train';render(true);break;
    case 'sekind':{const e=ui.se;if(e.kind!==b.dataset.v){e.kind=b.dataset.v;if(e.kind!=='styrke'&&!e.key){e.mode=null;e.steps='';e.min='';e.cf=null}}render();break}
    case 'semode':{const e=ui.se;e.mode=b.dataset.v;if(e.kind!=='styrke'){if(e.mode==='rand'&&!e.steps)seGenerate(e);if(e.mode==='self')e.cf=null;render();break}
      if(e.mode==='rand'&&!e.ex.some(x=>x.n.trim())){const o=strOpts(),ex=strSuggest(o);if(ex.length){e.ex=ex;const nm=`${STR_FOCUS[o.focus][0]} · ${o.min} min · ${STR_INT[o.int][0].toLowerCase()}`;if(!e.name.trim())e.name=nm;ui.seAuto=nm}}
      if(e.mode==='self'&&!e.ex.length)e.ex.push({n:'',s:'3',r:'8',q:'2'});render();break}
    case 'segen':{const o=strOpts();o[b.dataset.f]=b.dataset.f==='min'?+b.dataset.v:b.dataset.v;state.strGen=o;save();render();break}
    case 'seeqtog':ui.seEq=!ui.seEq;render();break;
    case 'seeq':{let have=strHave().slice();const u=b.dataset.v;have=have.includes(u)?have.filter(x=>x!==u):have.concat(u);state.strUdstyr=have.length===STR_EQ.length?null:have;save();render();break}
    case 'segen2':{const o=seOpt(),f=b.dataset.f;o[f]=f==='min'?+b.dataset.v:b.dataset.v;state.seGen=o;save();render();break}
    case 'sesuggest':{if(ui.se.kind!=='styrke'){seGenerate(ui.se);render();const el=$('#se-result');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});break}const o=strOpts(),ex=strSuggest(o);if(!ex.length){toast('Vælg mere udstyr');break}ui.se.ex=ex;
      const nm=`${STR_FOCUS[o.focus][0]} · ${o.min} min · ${STR_INT[o.int][0].toLowerCase()}`;if(!ui.se.name.trim()||ui.se.name===ui.seAuto)ui.se.name=nm;ui.seAuto=nm;render();
      {const el=$('#se-result');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}break}
    case 'seswap':{const i=+b.dataset.i,x=strSwap(ui.se.ex[i].n);if(!x){toast('Ingen anden lignende øvelse med dit udstyr');break}ui.se.ex[i]={n:x[0],s:String(x[4]),r:String(x[5]),q:String(x[6])};render();break}
    case 'sepick':ui.pick={g:''};ui.seScroll=scrollY;ui.view='expick';render(true);break;
    case 'pickback':ui.view='sessedit';render(true);if(ui.seScroll){scrollTo(0,ui.seScroll);ui.seScroll=0}break;
    case 'pickg':ui.pick.g=b.dataset.v;render();break;
    case 'pickex':{const x=strFor(b.dataset.n);if(!x)break;const ex=ui.se.ex;const row={n:x[0],s:String(x[4]),r:String(x[5]),q:String(x[6])};
      if(ex.length===1&&!ex[0].n.trim())ex[0]=row;else ex.push(row);ui.seScroll=(ui.seScroll||0)+140;
      if(navDepth>0){history.back()}else{ui.view='sessedit';render(true)}toast(x[0]+' tilføjet');break}
    case 'seadd':ui.se.ex.push({n:'',s:'3',r:'8',q:'2'});render();{const el=$('#se-n'+(ui.se.ex.length-1));if(el)el.focus()}break;
    case 'serm':ui.se.ex.splice(+b.dataset.i,1);if(!ui.se.ex.length)ui.se.ex.push({n:'',s:'3',r:'8',q:'2'});render();break;
    case 'sesave':{const e=ui.se,name=e.name.trim();if(!name){toast('Giv passet et navn');break}
      const data={name,note:e.note.trim()};
      if(e.kind==='styrke'){const ex=e.ex.filter(x=>x.n.trim()).map(x=>[x.n.trim(),Math.max(1,parseInt(x.s)||3),Math.max(1,parseInt(x.r)||8),Math.max(0,parseInt(x.q)||0)]);if(!ex.length){toast('Tilføj mindst én øvelse');break}
        data.ex=ex;const m=ex.reduce((a,x)=>a+x[1],0)*2.2+8;data.dur='ca. '+Math.round(m/5)*5+' min'}
      else{const st=e.steps.split('\n').map(x=>x.trim()).filter(Boolean),mn=parseInt(e.min)||null;data.steps=st.length?st:[name];if(mn){data.min=mn;data.dur=mn+' min'}if(e.kind==='crossfit'&&e.cf)data.cf=e.cf;if(e.kind==='restitution')data.label='Aktiv restitution'}
      if(e.key&&SESS_BASE[e.key]){state.sessEdits={...(state.sessEdits||{}),[e.key]:data}}
      else{const k=e.key||('U'+Date.now().toString(36));state.customSess={...(state.customSess||{}),[k]:{...data,kind:e.kind==='restitution'?'mobilitet':e.kind}};e.key=k}
      save();applySess();ui.trKey=e.key;ui.se=null;replaceNext=true;ui.view='sess';render(true);toast('Pas gemt');break}
    case 'sereset':{const k=ui.se.key,x={...(state.sessEdits||{})};delete x[k];state.sessEdits=x;save();applySess();ui.trKey=k;ui.view='sess';render(true);toast('Oprindeligt pas gendannet');break}
    case 'sedel':{if(!ui.seDel){ui.seDel=true;render();break}const k=ui.se.key,x={...(state.customSess||{})};delete x[k];state.customSess=x;
      for(const d in state.plan)if(state.plan[d]===k)state.plan[d]='R';syncCustom();save();applySess();ui.seDel=false;ui.view='train';render(true);toast('Pas slettet');break}
    case 'trempty':ui.logDate=TODAY;ui.logType='styrke';ui.sess='X';ui.rows=[makeRow('',3,8,2)];ui.dirty=true;ui.view='log';render(true);break;
    case 'mprev':if(--ui.calM<0){ui.calM=11;ui.calY--}render();break;
    case 'mnext':if(++ui.calM>11){ui.calM=0;ui.calY++}render();break;
    case 'goalnew':freezeTop();ui.goal={type:'lift',ex:'',kg:'',name:'3 km løb',time:'',n:''};render();break;
    case 'goalcancel':ui.goal=null;render();break;
    case 'goaltype':ui.goal.type=b.dataset.v;render();break;
    case 'goalsave':{const f=ui.goal,id=Date.now().toString(36);let g=null;
      if(f.type==='lift'&&f.ex.trim()&&num(f.kg)>0)g={id,type:'lift',ex:f.ex.trim(),kg:num(f.kg)};
      else if(f.type==='test'){const m=/^(\d+):(\d{1,2})$/.exec((f.time||'').trim());if(m)g={id,type:'test',name:(f.name||'3 km løb').trim(),secs:+m[1]*60+ +m[2]}}
      else if(f.type==='vaegt'&&num(f.kg)>0)g={id,type:'vaegt',kg:num(f.kg)};
      else if(f.type==='week'&&num(f.n)>0)g={id,type:'week',n:Math.round(num(f.n))};
      if(!g){toast('Udfyld målet');break}state.goals=[...(state.goals||[]),g];ui.goal=null;save();render();toast('Mål gemt');break}
    case 'goaldel':state.goals=(state.goals||[]).filter(g=>g.id!==b.dataset.id);save();render();break;
    case 'logback':ui.view=ui.logFrom&&ui.logFrom!=='log'?ui.logFrom:'today';render(true);break;
    case 'logvaegt':ui.logFrom=ui.view;ui.logType='vaegt';ui.logDate=TODAY;ui.view='log';render(true);break;
    case 'ltype':ui.logType=b.dataset.type;if(ui.logType==='styrke'&&!ui.rows.length)initStyrke(ui.logDate);render();break;
    case 'addrow':ui.rows.push(makeRow('',3,8,2));ui.dirty=true;render();{const el=$('#r'+(ui.rows.length-1)+'-ex');if(el)el.focus()}break;
    case 'rmrow':ui.rows.splice(+b.dataset.i,1);ui.dirty=true;saveDraft();render();break;
    case 'save':doSave();break;
    case 'del':if(ui.pendingDel===b.dataset.id){state.logs=state.logs.filter(l=>l.id!==b.dataset.id);save();ui.pendingDel=null;toast('Slettet')}else ui.pendingDel=b.dataset.id;render();break;
    case 'resetplan':state.plan=state.program==='blueprint'?{...BP_PLAN}:{...DEFAULT_PLAN};state.shifts=(state.shifts||[]).filter(x=>x>=TODAY);save();render();toast('Plan gendannet');break;
    case 'habit':ui.habit=b.dataset.h;ui.manVal='';ui.manDate=TODAY;ui.view='habit';render(true);break;
    case 'htstart':htStart(ui.habit);break;
    case 'htpause':if(ht){if(ht.audio.paused){ht.audio.play();keepAwake()}else ht.audio.pause()}render();break;
    case 'hcheck':{const h=findHabit(ui.habit);const i=state.logs.findIndex(l=>l.type===h.id&&l.date===TODAY);if(i>=0)state.logs.splice(i,1);else state.logs.push({id:Date.now().toString(36),date:TODAY,type:h.id});save();render();break}
    case 'hdel':{const id=ui.habit;if(ui.delHabit===id){state.customHabits=(state.customHabits||[]).filter(c=>c.id!==id);ui.delHabit=null;save();ui.view='habits';render(true);toast('Vane slettet')}else{ui.delHabit=id;render()}break}
    case 'nhopen':ui.nh={name:'',kind:'check',start:'10',step:'0',max:'10',note:'',color:HCOLORS[(state.customHabits||[]).length%HCOLORS.length]};ui.view='habitnew';render(true);break;
    case 'nhkind':ui.nh.kind=b.dataset.v;render();break;
    case 'nhcolor':ui.nh.color=b.dataset.v;render();break;
    case 'nhsave':{const n=ui.nh,name=n.name.trim();if(!name){toast('Giv vanen et navn');break}
      const c={id:'h'+Date.now().toString(36),name,kind:n.kind,note:n.note.trim(),color:n.color,since:mondayOf(TODAY)};
      if(n.kind==='timer'){c.startMin=num(n.start);c.stepMin=num(n.step)||0;c.maxMin=num(n.max);if(!(c.startMin>0)){toast('Skriv et startmål i minutter');break}if(!(c.maxMin>=c.startMin))c.maxMin=c.startMin}
      state.customHabits=(state.customHabits||[]).concat(c);save();ui.habit=c.id;ui.manVal='';ui.manDate=TODAY;ui.view='habit';render(true);toast('Vane tilføjet');break}
    case 'cfopen':cfOpen(b.dataset.date||TODAY);break;
    case 'cfday':{const d=b.dataset.date;setManual(d,'CF');save();cfOpen(d);break}
    case 'cfundo':{const d=b.dataset.date;clearManual(d);pruneSess();applySess();save();render();toast('CrossFit fjernet');break}
    case 'cfback':if(ui.cf&&ui.cf.step==='pas'&&!cfSaved(ui.cf.date)){ui.cf.step='menu';render(true)}else{if(ui.cf&&ui.cf.date!==TODAY){ui.sel=ui.cf.date;ui.view='day'}else ui.view=ui.dayBack==='train'?'train':'today';render(true)}break;
    case 'cfmenu':ui.cf.step='menu';render(true);break;
    case 'cffmt':ui.cf.fmt=b.dataset.v||null;render();break;
    case 'cfmin':ui.cf.min=+b.dataset.v;render();break;
    case 'cfpref':{const k=b.dataset.k,v=k==='antal'?+b.dataset.v:b.dataset.v;state.cfPrefs={...cfPrefs(),[k]:v};save();render();break}
    case 'cfudstyr':ui.cf.showUdstyr=!ui.cf.showUdstyr;render();break;
    case 'cfeq':{const all=cfUdstyrAlle(),P=cfPrefs();let have=(P.udstyr||all).slice();const u=b.dataset.v;have=have.includes(u)?have.filter(x=>x!==u):have.concat(u);state.cfPrefs={...P,udstyr:have.length===all.length?null:have};save();render();break}
    case 'cfgen':{const wasPas=ui.cf.step==='pas';const p=cfGenerate();ui.cf.step='pas';render(!wasPas);if(!p)toast('Ingen gyldige pas med de valg');break}
    case 'plopen':ui.pl=plStart();ui.view='plan';render(true);break;
    case 'planasklater':state.planAsk=addD(TODAY,14);save();render();break;
    case 'plback':{const P=ui.pl;if(P&&P.step==='review'){slideAnim(-1,()=>{P.step='week';render(true)});break}const st=P?plSteps(P):[],k=P?st.indexOf(P.step):-1;if(k>0&&navDepth===0){slideAnim(-1,()=>{P.step=st[k-1];render(true)})}else{ui.view='month';render(true)}break}
    case 'plopenday':{freezeTop();const d=b.dataset.date;ui.pl.open=ui.pl.open===d?null:d;render();break}
    case 'plpick':ui.pl.pick=+b.dataset.d;render();break;
    case 'plclose':ui.pl.pick=null;render();break;
    case 'plset':ui.pl.types[ui.pl.pick]=b.dataset.v;ui.pl.pick=null;render();break;
    case 'plnext':{const P=ui.pl,st=plSteps(P),k=st.indexOf(P.step);P.pick=null;
      if(P.step==='test'){const v=plTestV(P);if(!v&&!P.noTest){toast('Skriv tiden som mm:ss, fx 22:30');break}
        P.vStart=v||null;P.tSec=v?parseTime(P.tTxt):null;if(v){P.curPace=Math.round(vdPredict(v,P.dist)/P.dist);if(!P.paceSet){P.pace=Math.max(150,Math.round(vdPredict(v+vdGain(runWeeks(P)[1]),P.dist)/P.dist/5)*5);P.paceSet=true}if(P.curPace<P.pace)P.curPace=P.pace}}if(st[k+1])slideAnim(1,()=>{P.step=st[k+1];if(P.step==='weeks')plWk(P);if(P.step==='week'&&P.draftSig!==P.goal+'|'+P.nDays)plDraft(P);render(true)});break}
    case 'plndays':ui.pl.nDays=+b.dataset.v;render();break;
    case 'plprev':{const P=ui.pl;if(navDepth>0){history.back();break}slideAnim(-1,()=>{if(P.step==='review')P.step='week';else{const st=plSteps(P),k=st.indexOf(P.step);P.step=st[Math.max(0,k-1)]}render(true)});break}
    case 'pltype':ui.pl.types[+b.dataset.d]=b.dataset.v;render();break;
    case 'plweeks':ui.pl.weeks=+b.dataset.v;render();break;
    case 'plgoal':{const P=ui.pl;P.goal=b.dataset.v;if(isRun(P.goal)){const r=runWeeks(P);P.weeks=r[1]}else if(P.weeks>8)P.weeks=4;render();break}
    case 'pldist':{const P=ui.pl;P.dist=+b.dataset.v;P.weeks=runWeeks(P)[1];render();break}
    case 'krace':ui.k.race=!ui.k.race;render();break;
    case 'vdopen':ui.vdf=ui.vdf?null:{km:5,t:''};render();break;
    case 'vdkm':ui.vdf.km=+b.dataset.v;render();break;
    case 'vdsave':{const f=ui.vdf,sec=parseTime(f.t);if(!sec||sec/f.km<150||sec/f.km>720){toast('Skriv tiden som mm:ss, fx 22:30');break}
      state.vdots=[...(state.vdots||[]),{date:TODAY,v:vdotOf(f.km,sec),km:f.km,sec,src:'manual'}];ui.vdf=null;save();render();toast('Dine løbetempoer er opdateret');break}
    case 'pltkm':ui.pl.tKm=+b.dataset.v;render();break;
    case 'plnotest':ui.pl.noTest=!ui.pl.noTest;render();break;
    case 'plrealpace':ui.pl.pace=+b.dataset.v;render();break;
    case 'plcur':ui.pl.cur=+b.dataset.v;render();break;
    case 'plpace':{const P=ui.pl,f=b.dataset.f;P[f]=Math.max(150,Math.min(600,P[f]+ +b.dataset.v));if(f==='pace'&&P.curPace<P.pace)P.curPace=P.pace;if(f==='curPace'&&P.curPace<P.pace)P.pace=P.curPace;render();break}
    case 'pldl':ui.pl.deload=b.dataset.v==='1'||b.dataset.v==='true';render();break;
    case 'pldlf':ui.pl.dlEvery=+b.dataset.v;render();break;
    case 'plst':ui.pl.start=b.dataset.v;render();break;
    case 'plbuild':{const was=ui.pl.step==='review';ui.pl.preview=plBuild(ui.pl);if(was){render(true);break}slideAnim(1,()=>{ui.pl.step='review';render(true)});break}
    case 'placcept':{const st=ui.pl.preview.start;plAccept();ui.pl=null;ui.mOpen=null;ui.view='month';render(true);toast('Planen er lagt ind');break}
    case 'plstop':plStop();render();toast('Forløbet er stoppet og fjernet fra kalenderen');break;
    case 'fwopen':ui.fwDate=null;ui.fwKey=null;ui.fwSwap=null;ui.fwLog=null;if(!state.fw){state.fw=fwNew();save()}ui.view='fw';render(true);break;
    case 'fwday':ui.fwDate=b.dataset.date;ui.fwKey=sessKey(b.dataset.date);ui.fwSwap=null;ui.fwLog=null;ui.view='fw';render(true);break;
    case 'fwback':if(ui.fwPrev){plRelabel(ui.pl.preview,ui.fwKey);ui.fwPrev=false;ui.fwKey=null;ui.view='plan';render(true);break}ui.view=ui.fwKey?'today':'train';ui.fwKey=null;ui.fwDate=null;render(true);break;
    case 'fwtime':{state.fwT=+b.dataset.v;const w=fwW();if(w){w.T=state.fwT;w.c=fwGenC(w.b,w.T);w.d=fwGenD(w.b,w.T)}save();render();break}
    case 'fwnew':{ui.fwSwap=null;if(ui.fwKey){const w=fwW();fwSetW(w?{...w,a:fwGenA(w.b),c:fwGenC(w.b,w.T),d:fwGenD(w.b,w.T)}:fwNew())}else state.fw=fwNew();save();render();toast('Ny træning');break}
    case 'fwudstyr':ui.fwEq=!ui.fwEq;render();break;
    case 'fwroll':{const w=fwW(),k=b.dataset.s;ui.fwSwap=null;
      if(k==='a')w.a=fwGenA(w.b);else if(k==='b'){if(ui.fwKey){const al=fwAltsB();if(al.length){w.b={...w.b,lift:fwPick(al)[0]};fwPlanName(w)}}else{w.b=fwGenB();w.a=fwGenA(w.b,w.a)}}else if(k==='c'){const c=fwGenC(w.b,w.T);if(c)w.c=c;else toast('Ingen WOD passede til dit udstyr')}else if(k==='d')w.d=fwGenD(w.b,w.T);
      save();render();break}
    case 'fwa':{const w=fwW(),k=b.dataset.k,i=+b.dataset.i;
      if(k==='cardio'){const c=FW_CARDIO.filter(x=>fwEqOk(x[1])&&x[0]!==w.a.cardio);if(c.length)w.a.cardio=fwPick(c)[0]}
      else{const pool=k==='gen'?FW_GEN:FW_SPEC[fwL(w.b.lift)[2]],used=[...w.a.gen,...w.a.spec],c=pool.filter(x=>!used.includes(x));if(c.length)w.a[k][i]=fwPick(c)}
      save();render();break}
    case 'fwswap':{const v=b.dataset.v;ui.fwSwap=ui.fwSwap===v?null:v;render();break}
    case 'fwpick':{const w=fwW(),k=b.dataset.k,i=+b.dataset.i,v=b.dataset.v;ui.fwSwap=null;
      if(k==='b'){const l=fwL(v);if(l){if(ui.fwKey){w.b={...w.b,lift:l[0]};fwPlanName(w)}else w.b=fwSchemeFor(l,w.b.scheme)}}
      else if(k==='c'){const p=fwC(),movs=p.movs.slice();movs[i]=cfMovById(v);const np=CF.formater(p.format,p.domaene,p.minutter,movs,p.opt,CF.prng(p.seed));np.seed=p.seed;np.opt=p.opt;w.c=cfSerialize(np)}
      else if(k==='d')w.d[i]=v;
      save();render();toast('Øvelse byttet');break}
    case 'fwlog':ui.fwLog={score:'',note:''};render();break;
    case 'fwsave':{const w=fwW(),l=fwL(w.b.lift),r=ui.fwLog;
      state.logs.push({id:Date.now().toString(36),date:ui.fwDate||TODAY,type:'crossfit',name:'Fuld træning · '+l[1],score:(r.score||'').trim(),note:(r.note||'').trim(),linjer:fwLines(),dur:w.T*60});
      ui.fwLog=null;save();render();toast('Træning gemt');break}
    case 'cfswap':{const i=+b.dataset.i;ui.cf.swapI=ui.cf.swapI===i?null:i;render();break}
    case 'cfpick':cfSwap(+b.dataset.i,b.dataset.v);render();toast('Øvelse byttet');break;
    case 'cfsave':{const p=ui.cf.pas;if(!p)break;const d=ui.cf.date,cur=dayOf(d).m,k=cur&&cur[0]==='C'&&(state.planSess||{})[cur]?cur:newKey('C',d);
      putSess(k,{name:p.overskrift,kind:'crossfit',cf:cfSerialize(p),min:p.minutter,dur:p.minutter+' min'});setManual(d,k);applySess();save();render();toast('Pas gemt');break}
    case 'cflog':{const p=ui.cf.pas,r=ui.cf.res;if(!r.score.trim()){toast('Skriv din score');break}
      state.logs.push({id:Date.now().toString(36),date:ui.cf.date,type:'crossfit',name:p.overskrift,score:r.score.trim(),rpe:num(r.rpe),note:r.note.trim(),seed:p.seed,ids:p.movs.map(m=>m.id),linjer:p.linjer,dur:p.minutter*60});
      save();render();toast('Resultat gemt');break}
    case 'addontog':freezeTop();ui.addonOpen=!ui.addonOpen;render();break;
    case 'wsel':{freezeTop();const d=b.dataset.date,cur=ui.wsel===undefined?TODAY:ui.wsel;ui.wsel=cur===d?null:d;render();break}
    case 'todaytog':freezeTop();ui.todayOpen=!ui.todayOpen;render();break;
    case 'skipask':freezeTop();ui.skipAsk=true;render();break;
    case 'skipcancel':freezeTop();ui.skipAsk=false;render();break;
    case 'skipday':skipDay(TODAY);ui.skipAsk=false;save();render();toast('Dagens pas er sprunget over');break;
    case 'shiftday':{const name=sessFor(TODAY).name;skipDay(TODAY);state.shifts=(state.shifts||[]).concat(TODAY);ui.skipAsk=false;save();render();toast(name+' er rykket til i morgen');break}
    case 'unskip':{skipDay(TODAY,false);state.shifts=(state.shifts||[]).filter(x=>x!==TODAY);save();render();toast('Fortrudt');break}
    case 'coldpre':state.coldPre=+b.dataset.v;save();render();break;
    case 'manlog':{const h=findHabit(ui.habit),raw=String(ui.manVal||'').trim(),date=ui.manDate||TODAY;
      if(h.check){if(habitDone(h.id,date)){toast('Allerede logget den dag');break}state.logs.push({id:Date.now().toString(36),date,type:h.id,manual:true});save();render();toast('Logget');break}
      let sec=h.id==='kulde'?parseTime(raw):(num(raw)!=null?num(raw)*60:null);if(raw==='')sec=h.target(hw(h,date));
      if(!sec||sec<5){toast(h.id==='kulde'?'Skriv tiden som m:ss, fx 0:45':'Skriv antal minutter');break}
      state.logs.push({id:Date.now().toString(36),date,type:h.id,sec:Math.round(sec),manual:true});save();ui.manVal='';render();toast(`Logget · ${fmtTime(sec)}`);break}
    case 'htstop':htFinish(false);break;
    case 'taksave':{const txt=(ui.takText||'').trim();const ex=state.logs.find(l=>l.type==='tak'&&l.date===TODAY);if(ex){if(txt)ex.text=txt}else state.logs.push({id:Date.now().toString(36),date:TODAY,type:'tak',text:txt});ui.takText='';save();render();toast('Gemt');break}
    case 'habitreset':state.habitStart=mondayOf(TODAY);save();render();toast('Vaner starter forfra i uge 1');break;
    case 'cyclereset':state.cycleStart=mondayOf(TODAY);save();render();toast('Uge 1 af '+DELOAD_EVERY);break;
    case 'wkopen':ui.wkOpen=ui.wkOpen===b.dataset.v?null:(b.dataset.v||null);render();break;
    case 'wkset':case 'wkadd':{const ob=b.dataset.ctx==='ob',d=b.dataset.d,v=b.dataset.v;const P=ob?ui.ob.plan:state.plan;let A=ob?ui.ob.addons:{...(state.addons||{})};
      if(a==='wkset'){P[d]=v;const kk=SESS[v].kind;if(kk==='hvile'||kk==='mobilitet')delete A[d]}else{if(v)A[d]=v;else delete A[d]}
      if(ob)ui.ob.addons=A;else{state.addons=A;syncCustom();save()}render();break}
    case 'tournext':{const tr=$('#tour-track'),i=Math.round(tr.scrollLeft/tr.clientWidth);if(i>=TOUR.length-1)endTour();else tr.scrollTo({left:(i+1)*tr.clientWidth,behavior:'smooth'});break}
    case 'tourend':endTour();break;
    case 'tourshow':showTour();break;
    case 'tipok':state.tipSeen=true;save();render();break;
    case 'obstart':obInit();ui.view='onboard';render(true);break;
    case 'obn':ui.ob.n=+b.dataset.v;render();break;
    case 'obpick':ui.ob.pick=+b.dataset.d;render();break;
    case 'obclose':ui.ob.pick=null;render();break;
    case 'obset':{const o=ui.ob,d=o.pick,t=b.dataset.v;if(plTypeOfKey(o.plan[d])!==t){o.plan[d]=OB_KEY[t];if(!['styrke','crossfit'].includes(t))delete o.addons[d]}o.pick=null;render();break}
    case 'obgoal':{const g=b.dataset.v,o=ui.ob;o.goals=o.goals.includes(g)?o.goals.filter(x=>x!==g):o.goals.concat(g);render();break}
    case 'obnext':{const o=ui.ob;if(o.step===2){const sug=obSuggest(OB_SPREAD[o.n],o.goals);o.plan=sug.plan;o.addons=sug.addons}o.step++;render(true);break}
    case 'obback':ui.ob.step--;render(true);break;
    case 'obdone':{replaceNext=true;const o=ui.ob;state.plan={...o.plan};state.addons={...o.addons};state.program='custom';state.name=o.name.trim();state.onboarded=true;state.shifts=[];state.days=Object.fromEntries(Object.entries(state.days||{}).map(([d,e])=>[d,{...e,skip:undefined}]).filter(([,e])=>e.p||e.m||e.x));
      state.cycleStart=mondayOf(TODAY);syncCustom();save();ui.ob=null;ui.view='today';render(true);if(!state.tourSeen)showTour();else toast('Din uge er klar');break}
    case 'customfrom':{const bp=b.dataset.p==='blueprint';state.plan=bp?{...BP_PLAN}:{...DEFAULT_PLAN};state.addons=bp?{...BP_ADDONS}:{};syncCustom();save();render();toast('Kopieret. Ret dagene til.');break}
    case 'program':if(b.dataset.p==='custom'){if(state.program!=='custom'){state.plan=state.customPlan?{...state.customPlan}:{...state.plan};state.addons=state.customAddons?{...state.customAddons}:{...(state.addons||{})};state.program='custom';if(!state.cycleStart)state.cycleStart=mondayOf(TODAY);syncCustom();save()}render();toast('Egen plan valgt');break}
    {const bp=b.dataset.p==='blueprint';state.program=bp?'blueprint':'egen';state.plan=bp?{...BP_PLAN}:{...DEFAULT_PLAN};state.addons=bp?{...BP_ADDONS}:{};state.cycleStart=mondayOf(TODAY);save();render();toast(bp?'Blueprint-program valgt':'Standardplan valgt');break}
    case 'mobdone':{const k=b.dataset.key,d=b.dataset.date||TODAY,S=SESS[k];state.logs.push({id:Date.now().toString(36),date:d,type:'mobilitet',name:S.name,dur:S.min*60});save();render();toast('Gemt');break}
    case 'copy':doCopy();break;
    case 'plcfniv':state.cfPrefs={...cfPrefs(),niveau:b.dataset.v};save();render();break;
    case 'plfwt':ui.pl.fwT=+b.dataset.v;render();break;
    case 'plstrmin':ui.pl.strMin=+b.dataset.v;render();break;
    case 'plfwedit':ui.fwPrev=true;ui.fwKey=b.dataset.key;ui.fwDate=b.dataset.date;ui.fwSwap=null;ui.fwLog=null;ui.view='fw';render(true);break;
    case 'plexswap':{freezeTop();const P=ui.pl,k=b.dataset.key,i=+b.dataset.i;P.swap=P.swap&&P.swap.key===k&&P.swap.i===i?null:{key:k,i};render();break}
    case 'plexpick':{freezeTop();const P=ui.pl,pv=P.preview,k=b.dataset.key,i=+b.dataset.i,to=b.dataset.v,s=pv.sess[k],from=s.ex[i][0],x=strFor(to);
      const ex=s.ex.map(e=>e.slice());const main=s.main===from;ex[i]=main||!x?[to,ex[i][1],ex[i][2],ex[i][3]]:[to,ex[i][1],x[5],x[6]];
      pv.sess[k]={...s,ex,...(main?{main:to,name:s.name.replace(from,to)}:{})};plRelabel(pv,k);
      const day=pv.weeks.flatMap(w=>w.days).find(d=>d.key===k);P.swap=null;P.lastSwap={key:k,from,to,dow:day?day.dow:null,i};render();break}
    case 'plexall':{freezeTop();const P=ui.pl,pv=P.preview,L=P.lastSwap;let n=0;
      pv.weeks.forEach(w=>w.days.forEach(d=>{const s=pv.sess[d.key];if(d.dow!==L.dow||!s||!s.ex||d.past)return;const i=s.ex.findIndex(e=>e[0]===L.from);if(i<0)return;
        const ex=s.ex.map(e=>e.slice()),x=strFor(L.to),main=s.main===L.from;ex[i]=main||!x?[L.to,ex[i][1],ex[i][2],ex[i][3]]:[L.to,ex[i][1],x[5],x[6]];
        pv.sess[d.key]={...s,ex,...(main?{main:L.to,name:s.name.replace(L.from,L.to)}:{})};plRelabel(pv,d.key);n++}));
      P.lastSwap=null;render();toast(`Skiftet på ${n} ${n===1?'dag':'dage'}`);break}
    case 'plexdel':{freezeTop();const pv=ui.pl.preview,k=b.dataset.key,s=pv.sess[k],ex=s.ex.filter((_,j)=>j!==+b.dataset.i);pv.sess[k]={...s,ex};ui.pl.swap=null;render();break}
    case 'plcondalt':{freezeTop();const pv=ui.pl.preview,k=b.dataset.key,s=pv.sess[k],c={...s.ck,alt:(s.ck.alt||0)+1};
      const [,n]=condSess(c.kind,c.i,c.w+c.alt,c.slot,b.dataset.date,c.o||{});n.ck=c;pv.sess[k]=n;plRelabel(pv,k);render();break}
    case 'bkshare':shareBackup();break;
    case 'bksnooze':state.bkSnooze=addD(TODAY,3);save();render();break;
    case 'snaprestore':{const t=+b.dataset.t;if(ui.pendingSnap!==t){ui.pendingSnap=t;render();break}const x=(ui.snaps||[]).find(s=>s.t===t);ui.pendingSnap=null;
      try{restoreFrom(x.data);ui.snaps=undefined;render(true);toast(`Gendannet fra ${shortDate(x.date)}`)}catch(e){toast('Kopien kunne ikke læses')}break}
    case 'snapfound':{const x=ui.foundSnap;ui.foundSnap=null;try{restoreFrom(x.data);ui.ob=null;ui.view='today';render(true);toast('Dine data er gendannet')}catch(e){toast('Kopien kunne ikke læses')}break}
    case 'restore':doRestore();break;
    case 'schopen':{const src=b.dataset.src,c={src,mode:'days',dates:[],month:TODAY.slice(0,7),dows:[pd(TODAY).getDay()],weeks:4,start:'this',how:'add',from:ui.view};
      if(src==='key')c.key=b.dataset.key;else if(src==='cf'){if(!ui.cf||!ui.cf.pas)break;c.cf=cfSerialize(ui.cf.pas)}else{const w=fwW();if(!w)break;c.fw=w}
      ui.sched=c;ui.view='sched';render(true);break}
    case 'schback':ui.view=ui.sched?ui.sched.from:'train';render(true);break;
    case 'fb':{const l=fbPending();if(!l)break;const v=+b.dataset.v,se=SESS[l.key]||{};l.fb=v;if(v===4)ui.fbHard=l.id;
      else if(!se.rtest&&sessTPace(se)&&l.paceOk===undefined||se.km&&l.distOk===undefined){l.fb=undefined;l._fb=v}save();render();break}
    case 'fbq':{const l=fbPending();if(!l)break;l[b.dataset.f+'Ok']=+b.dataset.v;if(l._fb!==undefined){l.fb=l._fb;delete l._fb;if(l.fb===4)ui.fbHard=l.id}save();render();break}
    case 'fbskip':{const l=fbPending();if(l){l.fb=l._fb??0;delete l._fb;save()}render();break}
    case 'fbr':case 'fbrskip':{const l=state.logs.find(x=>x.id===ui.fbHard);if(l&&a==='fbr')l.fbr=b.dataset.v;ui.fbHard=null;save();render();toast('Tak. Planen tager hensyn til det.');break}
    case 'adok':{const P=adaptFind(),c=ui.adCur,p=P.find(x=>x.id===(c&&c.id));if(!p)break;const o=p.opts[c.i];o.apply();const A=adS();A.handled[p.id]='ok';(A.hist=A.hist||[]).push({date:TODAY,t:p.title,o:o.label});ui.adOpt=0;applySess();save();render();toast('Planen er justeret');break}
    case 'adno':{const c=ui.adCur;if(!c)break;adS().handled[c.id]='no';ui.adOpt=0;save();render();break}
    case 'adalt':ui.adOpt=(ui.adOpt||0)+1;{const P=adaptFind();if(P[0]&&ui.adOpt>=P[0].opts.length)ui.adOpt=0}render();break;
    case 'schhow':ui.sched.how=b.dataset.v;render();break;
    case 'xsee':{const se=SESS[b.dataset.key];if(se&&se.fw){ui.fwKey=b.dataset.key;ui.fwDate=b.dataset.date;ui.fwSwap=null;ui.fwLog=null;ui.view='fw';render(true);break}ui.trKey=b.dataset.key;ui.view='sess';render(true);break}
    case 'xdel':{freezeTop();removeExtra(b.dataset.date,+b.dataset.i);pruneSess();applySess();save();render();toast('Fjernet fra dagen');break}
    case 'schmode':ui.sched.mode=b.dataset.v;render();break;
    case 'schday':{const c=ui.sched,d=b.dataset.d,i=c.dates.indexOf(d);if(i>=0)c.dates.splice(i,1);else c.dates.push(d);render();break}
    case 'schmon':{const c=ui.sched,[y,m]=c.month.split('-').map(Number),n=new Date(y,m-1+(+b.dataset.v),1);c.month=ds(n).slice(0,7);render();break}
    case 'schdow':{const c=ui.sched,v=+b.dataset.v,i=c.dows.indexOf(v);if(i>=0)c.dows.splice(i,1);else c.dows.push(v);render();break}
    case 'schwk':ui.sched.weeks=+b.dataset.v;render();break;
    case 'schst':ui.sched.start=b.dataset.v;render();break;
    case 'schgo':{const n=schApply(ui.sched);toast(`Lagt ind på ${n} ${n===1?'dag':'dage'}`);const back=ui.sched.from;ui.sched=null;if(navDepth>0)history.back();else{ui.view=back;render(true)}break}
    case 'wipecal':if(ui.pendingCal){wipeCalendar();ui.pendingCal=false;toast('Kalenderen er ryddet')}else ui.pendingCal=true;render();break;
    case 'wipe':if(ui.pendingWipe){state.logs=[];save();ui.pendingWipe=false;toast('Alle logs slettet')}else ui.pendingWipe=true;render();break;
  }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.ac)acShow(t);
  if(t.id==='pk-q'){const q=t.value.trim().toLowerCase();document.querySelectorAll('.pk-row').forEach(r=>r.hidden=!!q&&!r.dataset.q.includes(q));document.querySelectorAll('.pk-grp').forEach(g=>g.hidden=![...g.querySelectorAll('.pk-row')].some(r=>!r.hidden));return}
  if(t.dataset.row!==undefined){const r=ui.rows[+t.dataset.row];if(r){r[t.dataset.f]=t.value;ui.dirty=true}return}
  if(t.dataset.set!==undefined){const [i,j]=t.dataset.set.split('.').map(Number),r=ui.rows[i];if(!r)return;const s=r.sets[j],f=t.dataset.f,old=s[f];s[f]=t.value;ui.dirty=true;
    /* changing kg or reps carries forward to later sets that aren't done and still had the old value */
    if(f!=='rir')for(let k=j+1;k<r.sets.length;k++){const n=r.sets[k];if(!n.done&&n[f]===old){n[f]=t.value;const el=$(`#s${i}-${k}-${f}`);if(el)el.value=t.value}}
    saveDraft();return}
  if(t.id==='pl-tt'&&ui.pl){ui.pl.tTxt=t.value;const el=$('#pl-tv');if(el)el.innerHTML=plTestInfo(ui.pl);return}
  if(t.id==='vd-tt'&&ui.vdf){ui.vdf.t=t.value;const el=$('#vd-pv');if(el)el.innerHTML=vdFormInfo();return}
  if(t.dataset.bind){const path=t.dataset.bind.split('.'),o=path[0];let tgt=ui;for(let i=0;i<path.length-1;i++)tgt=tgt[path[i]];tgt[path[path.length-1]]=t.value;if(o!=='impText'&&o!=='cf')ui.dirty=true}
});
document.addEventListener('change',e=>{
  if(e.target.id==='bk-file'){const f=e.target.files&&e.target.files[0];if(!f)return;f.text().then(t=>{ui.impText=t;ui.pendingRestore=false;doRestore()});return}
  const t=e.target;
  if(t.id==='f-date'){ui.logDate=t.value||TODAY;const key=sessKey(ui.logDate);
    if(ui.logType==='styrke'&&['A','B','C'].includes(key)&&key!==ui.sess){ui.sess=key;initRows(key)}
    if(ui.logType==='kondition'&&['I4','I5','I30','I30B','Z2','Z2L'].includes(key))ui.k.sess=key;render()}
  else if(t.id==='f-sess'){ui.sess=t.value;if(t.value!=='X')initRows(t.value);else ui.rows=[makeRow('',3,8,2)];render()}
  else if(t.dataset.row!==undefined&&t.dataset.f==='ex'){const i=+t.dataset.row,r=ui.rows[i];
    if(r&&!r.sets.some(s=>s.done)){const tg=target(t.value);ui.rows[i]=makeRow(t.value.trim(),r.sets.length,tg?tg.reps:r.tReps,tg?tg.rir:r.tRir);render()}}
  else if(t.id==='hrmax'){const v=parseInt(t.value);state.hrmax=v>=140&&v<=230?v:null;save();render();toast(state.hrmax?'Makspuls gemt':'Skriv et tal mellem 140 og 230')}
  else if(t.dataset.plan!==undefined){state.plan[t.dataset.plan]=t.value;const kk=SESS[t.value].kind;if(kk==='hvile'||kk==='mobilitet'){const a={...(state.addons||{})};delete a[t.dataset.plan];state.addons=a}syncCustom();save();render();toast('Ugeplan opdateret')}
  else if(t.dataset.obplan!==undefined){const d=t.dataset.obplan,o=ui.ob;o.plan[d]=t.value;const kk=SESS[t.value].kind;if(kk==='hvile'||kk==='mobilitet')delete o.addons[d];render()}
  else if(t.dataset.obaddon!==undefined){const d=t.dataset.obaddon,o=ui.ob;if(t.value)o.addons[d]=t.value;else delete o.addons[d]}
  else if(t.id==='nm'){state.name=t.value.trim();save();render()}
  else if(t.dataset.addon!==undefined){const a={...(state.addons||{})};if(t.value)a[t.dataset.addon]=t.value;else delete a[t.dataset.addon];state.addons=a;syncCustom();save();toast('Ugeplan opdateret')}
  else if(t.dataset.cdeload!==undefined){state.customDeload=t.value==='1';save();render()}
  else if(t.id==='p-ex'){ui.progEx=t.value;render()}
  else if(t.id==='p-test'){ui.progTest=t.value;render()}
  else if(t.id==='t-unit'){ui.t.unit=t.value;render()}
  else if(t.id==='t-name'){ui.t.name=t.value;if(t.value.trim())ui.t.unit=guessUnit(t.value.trim());render()}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(timer&&!timer.paused)keepAwake();const n=ds(new Date());if(n!==TODAY){TODAY=n;render()}}});

if(state.onboarded&&!state.cycleStart){delete state.needCycle;state.cycleStart=mondayOf(TODAY);save()}
if(!state.habitStart){state.habitStart=mondayOf(TODAY);save()}
render();
askPersist();snapSoon();
if(dataBroken)showCrash(dataBroken.err,true);
else if(freshStart)snapList().then(l=>{if(l[0]){ui.foundSnap=l[0];render()}});
