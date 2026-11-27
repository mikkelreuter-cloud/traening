// Tests for the app. Runs the built index.html in headless Chromium.
// Logic tests call the app's own functions; click tests use the app like a person would.
// Every test fails if the page throws a JavaScript error. Run: node tests/run.js  (or npm test)
const {execSync}=require('child_process'),http=require('http'),fs=require('fs'),path=require('path');
const pw=require(path.join(execSync('npm root -g').toString().trim(),'playwright'));
const root=path.join(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith(path.sep))f+='index.html';
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});r.end(d)})});

const BASE={program:'custom',onboarded:true,tipSeen:true,tourSeen:true,name:'T',v:3,plan:{1:'S',2:'I5',3:'R',4:'S',5:'Z2',6:'Z2L',0:'R'},addons:{},logs:[]};
const REST={1:'R',2:'R',3:'R',4:'R',5:'R',6:'R',0:'R'};
const tests=[];const T=(name,fn)=>tests.push([name,fn]);
class Fail extends Error{}
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Fail(`${m||'forventede lighed'}: fik ${JSON.stringify(a)}, forventede ${JSON.stringify(b)}`)};
const ok=(v,m)=>{if(!v)throw new Fail(m||'forventede sand')};
const near=(a,b,tol,m)=>{if(Math.abs(a-b)>tol)throw new Fail(`${m||'tal'}: ${a} er ikke inden for ${tol} af ${b}`)};

let base,ctx;
/* Open the app with saved data. raw = exact text in storage (to test broken data). */
async function open(data,{raw,expectErrors}={}){const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.expectErrors=!!expectErrors;
  await p.goto(base+'/icon-192.png');
  await p.evaluate(([d,raw])=>{localStorage.clear();if(raw!=null)localStorage.setItem('styrke-vo2-log.v1',raw);else if(d)localStorage.setItem('styrke-vo2-log.v1',JSON.stringify(d))},[data,raw??null]);
  await p.goto(base+'/index.html');await p.waitForFunction(()=>typeof render==='function'&&document.querySelector('#main'));return p}
const app=(data={})=>open({...BASE,...data});
const ev=(p,fn,arg)=>p.evaluate(fn,arg);
const wait=(p,ms=450)=>p.waitForTimeout(ms);

/* ================= Saved data ================= */
T('Ny bruger uden data får introduktionen',async()=>{const p=await open(null);eq(await ev(p,()=>ui.view),'onboard');return p});
T('Gamle data (uden version) bliver opgraderet',async()=>{const p=await open({program:'blueprint',plan:{1:'A',2:'I4',3:'R',4:'B',5:'Z2',6:'C',0:'Z2L'},logs:[{id:'a',date:'2026-01-05',type:'styrke',sets:[]}]});
  const s=await ev(p,()=>({v:state.v,prog:state.program,mon:state.plan[1],onb:state.onboarded,logs:state.logs.length,name:state.name}));
  eq(s.v,3,'version');eq(s.prog,'custom');eq(s.mon,'S','Styrke A bliver til S');eq(s.onb,true);eq(s.logs,1,'logs bevaret');eq(s.name,'Mikkel');return p});
T('Felter med forkert form får standardværdi, resten bevares',async()=>{const p=await app({planSess:'x',extras:[1,2],logs:[{id:'a',date:'2026-01-01',type:'kondition',dur:60},'junk'],theme:5,vdots:{}});
  const s=await ev(p,()=>({ps:state.planSess,ex:state.extras,logs:state.logs.length,theme:state.theme,vd:state.vdots}));
  eq(s.ps,{});eq(s.ex,{});eq(s.logs,1,'ugyldige logs fjernes');eq(s.theme,'auto');eq(s.vd,[]);return p});
T('Ulæselige data overskrives ikke, og fejlskærmen vises',async()=>{const p=await open(null,{raw:'{ødelagt'});await wait(p,200);
  const s=await ev(p,()=>({broken:!!dataBroken,raw:localStorage.getItem('styrke-vo2-log.v1'),kopi:localStorage.getItem('styrke-vo2-log.v1.kopi')}));
  ok(s.broken);eq(s.raw,'{ødelagt','originalen er urørt');eq(s.kopi,'{ødelagt','kopi gemt');
  await ev(p,()=>{state.logs.push({id:'x'});save()});eq(await ev(p,()=>localStorage.getItem('styrke-vo2-log.v1')),'{ødelagt','save() skriver ikke');
  await ev(p,()=>showCrash(dataBroken.err,true));ok(await p.isVisible('#crash [data-crash=reset]'),'start forfra-knap');
  await p.click('#crash [data-crash=reset]');ok(await ev(p,()=>localStorage.getItem('styrke-vo2-log.v1')!=='{ødelagt'),'gemmer igen efter valg');return p});
T('En fejl under visning giver fejlskærm med Fortsæt',async()=>{const p=await app({},{});p.expectErrors=true;
  await ev(p,()=>{const o=viewToday;window.viewToday=()=>{throw new Error('testfejl')};ui.view='today';render(true);window.viewToday=o});
  ok(await p.isVisible('#crash'),'fejlskærm');ok((await p.textContent('#crash pre')).includes('testfejl'));
  await p.click('#crash [data-crash=go]');ok(!(await p.isVisible('#crash')),'Fortsæt lukker');
  ok(await ev(p,()=>JSON.parse(localStorage.getItem('styrke-vo2-errors.v1')).length>=1),'fejllog');return p});
T('Gendan backup bruger samme opgradering',async()=>{const p=await app();
  await ev(p,()=>{ui.impText=JSON.stringify({logs:[{id:'r',date:'2026-02-02',type:'styrke',sets:[]}],plan:{1:'A'},extras:'bad'});ui.pendingRestore=true;doRestore()});
  const s=await ev(p,()=>({logs:state.logs.length,mon:state.plan[1],ex:state.extras,v:state.v,onb:state.onboarded}));
  eq(s.logs,1);eq(s.ex,{});eq(s.v,3);eq(s.onb,true);return p});

/* ================= Calendar: which session is on a day ================= */
T('Fast uge, flyttet dag og oversprunget dag',async()=>{const p=await app();
  const r=await ev(p,()=>{const d=addD(TODAY,1),dow=pd(d).getDay(),base=sessKey(d);state.overrides={[d]:'Z2'};const ov=sessKey(d);state.skips={[d]:true};const sk=sessKey(d);return {base,exp:state.plan[dow],ov,sk}});
  eq(r.base,r.exp,'fast uge');eq(r.ov,'Z2','flyttet dag');eq(r.sk,'R','sprunget over');return p});
T('Ekstra pas på en dag og om de er gennemført',async()=>{const p=await app({customSess:{U1:{name:'Ben',kind:'styrke',ex:[['Squat',3,5,2]]}}});
  const r=await ev(p,()=>{applySess();const d=TODAY;state.plan[pd(d).getDay()]='Z2';state.extras={[d]:['U1']};const before=extraDone(d,0);
    state.logs.push({id:'k',date:d,type:'kondition',dur:2400});const afterK=extraDone(d,0);state.logs.push({id:'s',date:d,type:'styrke',sets:[]});return {n:extrasOn(d).length,before,afterK,after:extraDone(d,0)}});
  eq(r.n,1);eq(r.before,false);eq(r.afterK,false,'kondition tæller ikke for styrke');eq(r.after,true);return p});
T('Læg i kalenderen: ugentligt i 3 uger, oveni og erstat',async()=>{const p=await app({plan:{...REST,3:'Z2'}});
  const r=await ev(p,()=>{const c={src:'key',key:'MOB',mode:'weekly',dates:[],dows:[3,5],weeks:3,start:'next',how:'add'};const ds_=schDates(c);schApply(c);
    const wed=ds_.find(d=>pd(d).getDay()===3),fri=ds_.find(d=>pd(d).getDay()===5);const r1={n:ds_.length,wedMain:sessKey(wed),wedEx:extrasOn(wed),friMain:sessKey(fri)};
    schApply({...c,how:'replace',dows:[3],weeks:1});return {...r1,wedAfter:sessKey(wed)}});
  eq(r.n,6);eq(r.wedMain,'Z2','oveni beholder dagens pas');eq(r.wedEx,['MOB']);eq(r.friMain,'MOB','hviledag får passet som hovedpas');eq(r.wedAfter,'MOB','erstat');return p});
T('Stop forløb fjerner forløbet men beholder egne pas og trænede dage',async()=>{const p=await app({plan:REST});
  const r=await ev(p,()=>{ui.pl={...plStart(),goal:'kondition',weeks:4,types:{1:'styrke',2:'kondition',3:'hvile',4:'styrke',5:'hvile',6:'kondition',0:'hvile'},start:'next'};ui.pl.preview=plBuild(ui.pl);plAccept();
    const fut=Object.keys(state.blockDays).sort()[3];const mine=addD(TODAY,2);schApply({src:'key',key:'MOB',mode:'days',dates:[mine],how:'replace'});
    const before=sessKey(fut);plStop();return {before,after:sessKey(fut),base:state.plan[pd(fut).getDay()],mine:sessKey(mine),block:state.block}});
  ok(r.before!==r.after||r.before===r.base);eq(r.after,r.base,'tilbage til fast uge');eq(r.mine,'MOB','eget pas bevaret');eq(r.block,null);return p});
T('Ryd kalenderen giver hviledage og beholder logs',async()=>{const p=await app({logs:[{id:'a',date:'2026-01-01',type:'styrke',sets:[]}]});
  const r=await ev(p,()=>{state.extras={[addD(TODAY,1)]:['MOB']};wipeCalendar();return {days:[0,1,2,3,4,5,6].map(i=>sessKey(addD(TODAY,i))),logs:state.logs.length,ex:extrasOn(addD(TODAY,1)).length}});
  eq([...new Set(r.days)],['R']);eq(r.logs,1);eq(r.ex,0);return p});

/* ================= Planner ================= */
T('Spørgsmålene i planlæggeren passer til målet',async()=>{const p=await app();
  const r=await ev(p,()=>{const P=plStart();return ['styrke','pace','distance'].map(g=>plSteps({...P,goal:g,weeks:8,deload:true}).join(','))});
  eq(r[0],'goal,weeks,deload,dlfreq,start,days,week');eq(r[1],'goal,dist,test,pace,weeks,deload,dlfreq,start,days,week');eq(r[2],'goal,dist,test,cur,weeks,deload,dlfreq,start,days,week');return p});
T('Styrkeforløb: testuge til sidst, lette uger efter valget',async()=>{const p=await app();
  const r=await ev(p,()=>{const P={...plStart(),goal:'styrke',weeks:8,dlEvery:3,types:{1:'styrke',2:'hvile',3:'styrke',4:'hvile',5:'styrke',6:'hvile',0:'hvile'}};const w=plBuild(P).weeks;
    const K={...P,goal:'kondition',dlEvery:2};const k=plBuild(K).weeks;return {s:w.map(x=>x.test?'T':x.dl?'D':'.').join(''),k:k.map(x=>x.test?'T':x.dl?'D':'.').join('')}});
  eq(r.s,'..D..D.T');eq(r.k,'.D.D.D.D','sidste uge må være let, når der ikke er test');return p});
T('Variation: intervalformat og hjælpeøvelser skifter fra uge til uge',async()=>{const p=await app();
  const r=await ev(p,()=>{const P={...plStart(),goal:'muskler',weeks:4,deload:false,types:{1:'styrke',2:'kondition',3:'hvile',4:'styrke',5:'hvile',6:'hvile',0:'hvile'}};const pv=plBuild(P);
    const at=dow=>pv.weeks.map(w=>w.days.find(d=>d.dow===dow).key).map(k=>pv.sess[k]);
    return {iv:at(2).map(s=>s.name),acc:at(1).map(s=>s.ex.slice(1).map(e=>e[0]).join('+'))}});
  ok(r.iv.every((n,i)=>i===0||n!==r.iv[i-1]),'interval skifter: '+r.iv.join(' / '));ok(r.acc.every((n,i)=>i===0||n!==r.acc[i-1]),'hjælpeøvelser skifter');return p});
T('Hovedløft: fast for styrkemål, skifter pr. periode ellers',async()=>{const p=await app();
  const r=await ev(p,()=>{const types={1:'styrke',2:'hvile',3:'hvile',4:'hvile',5:'hvile',6:'hvile',0:'hvile'};const m=g=>{const pv=plBuild({...plStart(),goal:g,weeks:8,dlEvery:4,types});return [...new Set(pv.weeks.map(w=>pv.sess[w.days[0].key]).map(s=>s&&s.main))].length};return {s:m('styrke'),k:m('kondition')}});
  eq(r.s,1);eq(r.k,2);return p});
T('Udkast til ugen: løbemål får mindst 2 løbedage',async()=>{const p=await app();
  const r=await ev(p,()=>[2,3,4,5,6].map(n=>{const P={...plStart(),goal:'distance',nDays:n};plDraft(P);return PL_DOW.filter(d=>P.types[d]==='kondition').length}));
  ok(r.every(x=>x>=2),'løbedage: '+r);return p});

/* ================= Your numbers ================= */
T('Beregnet max ud fra loggede sæt',async()=>{const p=await app({logs:[{id:'a',date:'2026-11-01',type:'styrke',sets:[{ex:'Squat',kg:100,saet:1,reps:5,rir:2},{ex:'Squat',kg:60,saet:1,reps:20,rir:0}]},
  {id:'b',date:'2026-09-01',type:'styrke',sets:[{ex:'Squat',kg:150,saet:1,reps:3,rir:0}]}]});
  const r=await ev(p,()=>({m:estMax('Squat').kg,k:kgFor('Squat',75),kb:kgFor('Kettlebell swing',75),alias:estMax('Back squat').kg}));
  near(r.m,123.33,.1,'100×5 med 2 i tanken (20 reps og gamle sæt tæller ikke)');eq(r.k,92.5,'afrundet til 2,5');eq(r.kb,null,'ingen logs');near(r.alias,123.33,.1,'Back squat = Squat');return p});
T('Log-skærmen udfylder planens kg og sæt',async()=>{const p=await app({logs:[{id:'a',date:'2026-11-01',type:'styrke',sets:[{ex:'Squat',kg:100,saet:1,reps:5,rir:2}]}]});
  const r=await ev(p,()=>{SESS.PT={name:'t',kind:'styrke',ex:[['Squat',4,5,2]],main:'Squat',pct:80};ui.logDate=TODAY;initRows('PT');return ui.rows[0].sets.map(s=>s.kg+'×'+s.reps)});
  eq(r,['97,5×5','97,5×5','97,5×5','97,5×5'],'80 % af 123,3 kg = 98,7 → 97,5');return p});

/* ================= Running (VDOT) ================= */
T('VDOT og tempoer passer med Daniels\' tabeller',async()=>{const p=await app();
  const r=await ev(p,()=>{const v=vdotOf(5,1200);return {v,T:zPace(v,'T'),I:zPace(v,'I'),R:zPace(v,'R'),hm:vdPredict(v,21.0975),self:vdPredict(v,5)}});
  near(r.v,49.8,.2,'VDOT');near(r.T,256,3,'tærskel 4:16');near(r.I,236,3,'interval 3:56');near(r.R,222,3,'gentagelser 3:42');near(r.hm,5510,60,'halvmaraton ~1:31:50');near(r.self,1200,1,'egen tid');return p});
T('Løbeplan med testtid: tempoer i passene og stigende form',async()=>{const p=await app({plan:REST});
  const r=await ev(p,()=>{const P={...plStart(),goal:'pace',dist:10,tKm:5,tTxt:'22:30',vStart:vdotOf(5,1350),tSec:1350,pace:265,curPace:280,weeks:8,types:{1:'kondition',2:'hvile',3:'kondition',4:'hvile',5:'hvile',6:'kondition',0:'hvile'},start:'next'};
    ui.pl=P;P.preview=plBuild(P);plAccept();const S=Object.values(state.blockDays).map(k=>SESS[k]).filter(s=>s&&s.zone==='I');
    return {first:zTxt(S[0].steps[1],S[0]),vb:S.map(s=>s.vb),last:plBuild(P).weeks.slice(-1)[0].test,vd:state.vdots.length}});
  ok(/4:2\d\/km \(intervaltempo\)/.test(r.first),r.first);ok(r.vb.every((v,i)=>i===0||v>=r.vb[i-1]),'formen stiger');eq(r.last,true,'testuge');eq(r.vd,1,'tiden gemt');return p});
T('Ny tid: hurtigere slår igennem, langsommere kræver godkendelse',async()=>{const p=await app({plan:REST,adapt:{handled:{},since:'2000-01-01',hist:[]}});
  const r=await ev(p,()=>{const P={...plStart(),goal:'pace',dist:10,vStart:vdotOf(5,1350),tSec:1350,tKm:5,pace:265,curPace:280,weeks:8,types:{1:'kondition',2:'hvile',3:'kondition',4:'hvile',5:'hvile',6:'kondition',0:'hvile'},start:'next'};
    ui.pl=P;P.preview=plBuild(P);plAccept();applySess();const k=Object.values(state.blockDays).find(k=>SESS[k]&&SESS[k].zone==='I'),I=()=>Math.round(sessTPace(SESS[k]));const a=I();
    state.logs.push({id:'f',date:TODAY,type:'kondition',race:true,dist:5,dur:1290,fb:2});const b=I();
    state.logs.push({id:'s',date:TODAY,type:'kondition',race:true,dist:5,dur:1500,fb:2});const c=I();const prop=adaptFind().find(x=>x.id.startsWith('vd:'));prop.opts[0].apply();return {a,b,c,d:I()}});
  ok(r.b<r.a,'hurtigere tid giver hurtigere tempo');eq(r.c,r.a,'langsommere tid ændrer intet uden godkendelse');ok(r.d>r.a,'efter godkendelse er tempoet roligere');return p});

/* ================= Adapting the plan ================= */
T('Misset pas: forslag om at flytte, godkend flytter',async()=>{const p=await app({plan:REST});
  const r=await ev(p,()=>{const y=addD(TODAY,-1);state.plan[pd(y).getDay()]='S';[0,1,2,3].forEach(i=>{const d=addD(TODAY,i);if(d!==y)state.plan[pd(d).getDay()]='R'});state.adapt={handled:{},since:addD(TODAY,-5),hist:[]};
    const want=sessKey(y);const P=adaptFind()[0];const o=P.opts[0];o.apply();state.adapt.handled[P.id]='ok';const t=Object.keys(state.overrides)[0];return {id:P.id,label:o.label,want,moved:state.overrides[t],skipped:!!state.skips[y],again:adaptFind().length}});
  ok(r.id.startsWith('m1:'));ok(r.label.startsWith('Flyt'));eq(r.moved,r.want,'samme pas flyttet');eq(r.skipped,true);eq(r.again,0,'forslaget forsvinder');return p});
T('To missede pas i forløbet: gentag ugen rykker slutdatoen',async()=>{const p=await app({plan:REST});
  const r=await ev(p,()=>{ui.pl={...plStart(),goal:'kondition',weeks:4,types:{1:'styrke',2:'kondition',3:'styrke',4:'kondition',5:'styrke',6:'kondition',0:'kondition'},start:'this'};ui.pl.preview=plBuild(ui.pl);plAccept();
    const bd={...state.blockDays};[-1,-2,-3].forEach(i=>{const d=addD(TODAY,i);bd[d]=state.blockDays[addD(TODAY,7+i)]||bd[d]});state.blockDays=bd;state.block.start=addD(TODAY,-6);state.adapt={handled:{},since:addD(TODAY,-10),hist:[]};
    state.logs.push({id:'o',date:addD(TODAY,-6),type:'styrke',sets:[]});applySess();const P=adaptFind().find(x=>x.id.startsWith('mw:'));const end=state.block.end;P.opts[0].apply();applySess();return {end,after:state.block.end,today:sessKey(TODAY)!=='R'||sessKey(addD(TODAY,1))!=='R'}});
  eq(r.after,(()=>{const d=new Date(r.end);d.setDate(d.getDate()+7);return d.toISOString().slice(0,10)})(),'slutter en uge senere');ok(r.today,'denne uge har pas');return p});
T('Styrke går tungere to gange: sænk 5 %',async()=>{const p=await app({plan:REST,logs:[{id:'1',date:'2026-10-01',type:'styrke',sets:[{ex:'Squat',kg:100,saet:1,reps:3,rir:0,tReps:5,tRir:2}]},{id:'2',date:'2026-10-08',type:'styrke',sets:[{ex:'Squat',kg:100,saet:1,reps:3,rir:1,tReps:5,tRir:2}]}]});
  const r=await ev(p,()=>{ui.pl={...plStart(),goal:'styrke',weeks:4,types:{1:'styrke',2:'hvile',3:'styrke',4:'hvile',5:'styrke',6:'hvile',0:'hvile'},start:'next'};ui.pl.preview=plBuild(ui.pl);plAccept();applySess();
    const P=adaptFind().find(x=>x.id.startsWith('sd:'));const k=Object.values(state.blockDays).find(k=>SESS[k]&&SESS[k].main==='Squat'&&SESS[k].pct);const a=SESS[k].pct;P.opts[0].apply();applySess();return {a,b:SESS[k].pct}});
  eq(r.b,r.a-5);return p});
T('Syg: forslag om lettere uge, Afvis fjerner forslaget',async()=>{const p=await app({plan:REST,logs:[{id:'s',date:'2026-11-26',type:'styrke',sets:[],fb:4,fbr:'syg'}]});
  const r=await ev(p,()=>{state.logs[0].date=addD(TODAY,-1);ui.pl={...plStart(),goal:'kondition',weeks:4,types:{1:'styrke',2:'kondition',3:'hvile',4:'styrke',5:'kondition',6:'kondition',0:'hvile'},start:'next'};ui.pl.preview=plBuild(ui.pl);plAccept();
    const P=adaptFind().find(x=>x.id.startsWith('sick:'));state.adapt.handled[P.id]='no';return {t:P.title,gone:!adaptFind().some(x=>x.id===P.id)}});
  eq(r.t,'Du var syg');eq(r.gone,true);return p});
T('Timer stoppet før tid bliver husket',async()=>{const p=await app();
  const r=await ev(p,()=>{startTimer('I4');finishTimer(false);ui.k.min='5';doSave();return state.logs.slice(-1)[0]});
  eq(r.early,true);eq(r.key,'I4');return p});

T('Data gemmes med versionsnummer',async()=>{const p=await open({...BASE,v:undefined});await ev(p,()=>save());eq(await ev(p,()=>JSON.parse(localStorage.getItem('styrke-vo2-log.v1')).v),3);return p});
T('Fuld træning oveni en dag får sin egen kopi og kan startes',async()=>{const p=await app({plan:{...REST,[new Date().getDay()]:'Z2'}});
  const r=await ev(p,()=>{state.fw=fwNew();schApply({src:'fw',fw:state.fw,mode:'days',dates:[TODAY],how:'add'});applySess();const k=extrasOn(TODAY)[0],se=SESS[k];ui.view='today';ui.wsel=undefined;render(true);return {k,id:se.fwId,has:!!state.planFw[se.fwId],main:sessKey(TODAY)}});
  eq(r.main,'Z2');ok(r.has,'kopi gemt');await p.click('.xtra [data-act=xstart]');await wait(p,200);eq(await ev(p,()=>ui.view),'fw');
  ok((await p.textContent('.eyebrow')).length>0);return p});
T('Feedback efter løb spørger om tempoet',async()=>{const p=await app({plan:REST});
  await ev(p,()=>{const P={...plStart(),goal:'pace',dist:10,vStart:vdotOf(5,1350),tSec:1350,tKm:5,pace:265,curPace:280,weeks:8,types:{1:'kondition',2:'hvile',3:'kondition',4:'hvile',5:'hvile',6:'kondition',0:'hvile'},start:'next'};ui.pl=P;P.preview=plBuild(P);plAccept();applySess();
    const k=Object.values(state.blockDays).find(k=>SESS[k]&&SESS[k].zone==='I');state.logs.push({id:'r',date:TODAY,type:'kondition',key:k,dur:2400,name:'x'});save();render()});
  ok((await p.textContent('.sheet')).includes('Holdt du pacen'),'spørger om pace');await p.click('[data-act=fb][data-v="3"]');await p.click('[data-act=fbq][data-v="0"]');await wait(p,200);
  const l=await ev(p,()=>state.logs.find(l=>l.id==='r'));eq([l.fb,l.paceOk],[3,0]);ok(!(await p.isVisible('.sheet')));return p});
T('Klik: løbeplan med testtid i planlæggeren',async()=>{const p=await app();
  await p.click('.tab[data-view=month]');await wait(p);await p.click('[data-act=plopen]');await wait(p);
  await p.click('[data-act=plgoal][data-v=pace]');await p.click('[data-act=plnext]');await wait(p);await p.click('[data-act=pldist][data-v="10"]');await p.click('[data-act=plnext]');await wait(p);
  await p.click('[data-act=plnext]');await wait(p);eq(await ev(p,()=>ui.pl.step),'test','uden tid kan man ikke gå videre');
  await p.fill('#pl-tt','22:30');ok((await p.textContent('#pl-tv')).includes('43,4'),'VDOT vises');await p.click('[data-act=plnext]');await wait(p);
  eq(await ev(p,()=>ui.pl.step),'pace');ok(await p.isVisible('.vd-real'),'realisme vises');return p});
/* ================= Click tests ================= */
T('Klik: alle faner og indstillinger åbner',async()=>{const p=await app();
  for(const v of ['train','month','prog','today']){await p.click(`.tab[data-view=${v}]`);await wait(p);eq(await ev(p,()=>ui.view),v)}
  await p.click('#gear');await wait(p,200);eq(await ev(p,()=>ui.view),'settings');return p});
T('Klik: log et styrkepas og svar på "Hvordan gik det?"',async()=>{const p=await app({plan:{...BASE.plan,[new Date().getDay()]:'S'}});
  await ev(p,()=>{ui.view='today';ui.wsel=undefined;render(true)});await p.click('[data-act=logday]');await wait(p,200);
  await ev(p,()=>{ui.rows.forEach(r=>r.sets.forEach(s=>{s.kg='50';s.reps='5';s.rir='2';s.done=true}))});await p.click('[data-act=save]');await wait(p,300);
  ok(await p.isVisible('.sheet [data-act=fb]'),'spørgsmålet vises');await p.click('[data-act=fb][data-v="2"]');await wait(p,200);
  ok(!(await p.isVisible('.sheet')),'lukker');eq(await ev(p,()=>state.logs.slice(-1)[0].fb),2);return p});
T('Klik: planlæg et styrkeforløb hele vejen',async()=>{const p=await app();
  await p.click('.tab[data-view=month]');await wait(p);await p.click('[data-act=plopen]');await wait(p);
  for(let i=0;i<12&&await ev(p,()=>ui.view==='plan'&&ui.pl.step!=='week');i++){await p.click('[data-act=plnext]');await wait(p)}
  await p.click('[data-act=plbuild]');await wait(p);await p.click('[data-act=placcept]');await wait(p);
  ok(await ev(p,()=>!!state.block),'forløb gemt');ok((await p.textContent('#main')).includes('Dit forløb'));return p});
T('Klik: læg et pas i kalenderen fra Pas',async()=>{const p=await app();
  await p.click('.tab[data-view=train]');await wait(p);await ev(p,()=>{ui.trKey='MOB';ui.view='sess';render(true)});await p.click('[data-act=schopen]');await wait(p,200);
  const d=await ev(p,()=>{const d=addD(TODAY,1);return d.slice(0,7)===TODAY.slice(0,7)?d:null});if(d){await p.click(`[data-act=schday][data-d="${d}"]`);await p.click('[data-act=schgo]');await wait(p);
    ok(await ev(p,d=>sessKey(d)==='MOB'||extrasOn(d).includes('MOB'),d),'passet ligger på dagen')}return p});
T('Klik: byg en WOD og en fuld træning',async()=>{const p=await app();
  await ev(p,()=>{cfOpen(TODAY,true)});await wait(p,200);const gen=await p.$('[data-act=cfgen]');if(gen){await gen.click();await wait(p,200)}
  await ev(p,()=>{ui.fwDate=null;state.fw=null;ui.view='train';render(true)});await p.click('[data-act=trgrp][data-g=CrossFit]');await wait(p,200);await p.click('[data-act=fwopen]');await wait(p,200);
  ok(await ev(p,()=>!!state.fw),'fuld træning bygget');return p});
T('Klik: start og stop en timer',async()=>{const p=await app();
  await ev(p,()=>startTimer('Z2'));await wait(p,300);eq(await ev(p,()=>ui.view),'timer');
  await p.click('[data-act=tstop]');await p.click('[data-act=tstop]');await wait(p,200);eq(await ev(p,()=>ui.view),'log');return p});

(async()=>{await new Promise(r=>srv.listen(0,r));base='http://localhost:'+srv.address().port;
  const b=await pw.chromium.launch();ctx=await b.newContext({...pw.devices['Pixel 7'],serviceWorkers:'block'});
  const only=process.argv[2];let pass=0,fail=0;const t0=Date.now();
  for(const [name,fn] of tests){if(only&&!name.toLowerCase().includes(only.toLowerCase()))continue;let p;
    try{p=await fn();if(p&&p.errs.length&&!p.expectErrors)throw new Fail('JavaScript-fejl: '+p.errs.join(' | '));pass++;console.log('✓ '+name)}
    catch(e){fail++;console.log('✗ '+name+'\n    '+(e instanceof Fail?e.message:e.stack.split('\n').slice(0,3).join('\n    ')))}
    finally{if(p)await p.close().catch(()=>{})}}
  await b.close();srv.close();console.log(`\n${fail?'✗':'✓'} Tests: ${pass} bestået, ${fail} fejlet (${((Date.now()-t0)/1000).toFixed(1)} s)`);process.exit(fail?1:0)})();
