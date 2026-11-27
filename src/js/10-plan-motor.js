/* Planlæggerens motor: løb og VDOT, ugeopbygning, dosis, variation, accepter og stop forløb. */
/* ---------- Planlæg forløb: 1-8 uger ----------
   Wizard: training days → what each day is → weeks + goal → review → accept.
   The plan puts a session key on each date (days[date].p). It wins over the weekly plan,
   but a manual change on a single day (m or skip) still wins over the plan. */
const PL_TYPES={styrke:['Styrke','styrke'],crossfit:['Fuld træning','crossfit'],kondition:['Kondition','interval'],restitution:['Aktiv restitution','mobilitet'],mobilitet:['Mobilitet','mobilitet'],hvile:['Hvile','hvile']};
const PL_ICON={styrke:'<path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11"/>',crossfit:'<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2.5-5 .5 1.5 1.5 2 2.5 2 0-2.5-1-4.5 0-7z"/>',
  kondition:'<path d="M3 12h4l2.5-6 4 12L16 12h5"/>',restitution:'<path d="M5 19c0-8 6-13 14-14-1 8-6 14-14 14zM5 19l7-7"/>',mobilitet:'<circle cx="12" cy="5" r="2"/><path d="M12 8v5l-4 6M12 13l4 6M6 10h12"/>',hvile:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'};
const plIcon=t=>`<span class="pl-ic k-${PL_TYPES[t][1]}"><svg viewBox="0 0 24 24">${PL_ICON[t]}</svg></span>`;
const PL_GOALS={styrke:['Blive stærkere','Tungere løft, færre gentagelser. Sidste uge er en test.'],kondition:['Bedre kondition','Flere og længere intervaller. Styrke holdes ved lige.'],allround:['CrossFit','Varierede styrkeskemaer og WOD\'er. God arbejdskapacitet.'],vaegt:['Ned i vægt','Styrke og masser af rolig bevægelse. Skånsomt for leddene.'],hybrid:['Allround','Styrke, løb, CrossFit og mobilitet blandet. Bred form til hverdag og tjeneste.'],muskler:['Mere muskelmasse','Flere gentagelser og mere bonusarbejde.'],
  distance:['Løb længere','Byg op til en distance. Sidste uge løber du den.'],pace:['Løb hurtigere','Hurtigere pace på en distance. Sidste uge er en test.']};
/* ---------- Running goals ----------
   Plan length from common running plans: 5-10 km 6-12 weeks, half marathon 10-16, marathon 14-20 (16-18 most common).
   A speed block shows measurable gains after 6-8 weeks. */
const RUN_D={5:'5 km',10:'10 km',21.1:'Halvmaraton',42.2:'Maraton'};
const RUN_WEEKS={distance:{5:[[6,8,10,12],8],10:[[8,10,12],10],21.1:[[10,12,14,16],12],42.2:[[14,16,18,20],16]},pace:{5:[[6,8,10],8],10:[[6,8,10,12],8],21.1:[[8,10,12],10]}};
const RUN_PEAK={5:7,10:13,21.1:19,42.2:32};
const isRun=g=>g==='distance'||g==='pace';
const fmtPace=sec=>{sec=Math.round(sec);return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')};
const fmtKm=k=>String(Math.round(k*10)/10).replace('.',',');
/* ---------- Running fitness (VDOT, Jack Daniels & Gilbert). One real time gives your training paces and a realistic forecast.
   vo2: oxygen cost of running at v m/min. pm: share of VO2max you can hold for t minutes. ---------- */
const VD={vo2:v=>-4.6+0.182258*v+0.000104*v*v,pm:t=>0.8+0.1894393*Math.exp(-0.012778*t)+0.2989558*Math.exp(-0.1932605*t)};
const vdotOf=(km,sec)=>VD.vo2(km*1000/(sec/60))/VD.pm(sec/60);
const vdPace=(V,p)=>60000/((-0.182258+Math.sqrt(0.182258**2+4*0.000104*(4.6+V*p)))/(2*0.000104));
function vdPredict(V,km){let lo=60,hi=36000;for(let i=0;i<50;i++){const m=(lo+hi)/2;vdotOf(km,m)>V?lo=m:hi=m}return (lo+hi)/2}
/* share of VDOT for each training zone (checked against Daniels' tables) */
const ZONES={E:['Rolig',.74,.64],M:['Maraton',.81],T:['Tærskel',.88],I:['Interval',.975],R:['Gentagelser',1.05]};
const zPace=(V,z)=>vdPace(V,ZONES[z][1]);
const VD_GAIN=.4; // realistic VDOT points per week of structured training, capped
const vdGain=w=>Math.min(6,Math.max(1,w*VD_GAIN));
/* Every time you have run on the clock: times entered in the app, and runs logged as a test or race */
function vdHist(){const h=(state.vdots||[]).map(x=>({...x}));
  state.logs.forEach(l=>{if(l.type==='kondition'&&l.race&&l.dist>=1.5&&l.dur)h.push({date:l.date,v:vdotOf(l.dist,l.dur),km:l.dist,sec:l.dur,src:'log',id:l.id})});
  return h.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0)}
const curVdot=()=>{const h=vdHist();return h.length?h[h.length-1]:null};
/* VDOT used for a plan session: the planned progression from your starting time, or a newer, better time if you have one */
function effV(se){const c=curVdot(),b=state.block,P=b&&b.P;if(!se||se.vb===undefined||!P)return c?c.v:null;
  const after=vdHist().filter(x=>x.date>=(b.made&&b.made<b.start?b.made:b.start)&&x.src!=='plan'),base=b.vBase!=null?b.vBase:P.vStart!=null?P.vStart:after.length?after[0].v:null;if(base==null)return null;
  const planned=base+(se.vb||0)+(b.vAdj||0),real=after.length&&!(P.vStart==null&&after.length===1)?after[after.length-1].v+(b.vAdj||0):null;
  return real!=null?Math.max(planned,real):planned}
const ZDESC={E:'i et tempo, hvor du kan tale i hele sætninger',M:'i jævnt maratontempo',T:'i tærskeltempo, hvor du kun kan sige få ord',I:'i intervaltempo: hårdt, men jævnt',R:'hurtigt og afslappet'};
function zTxt(t,se){return String(t).replace(/\{([EMTIRG])\}/g,(m,z)=>{const V=effV(se);
  if(z==='G'){const P=state.block&&state.block.P;return P&&P.pace?fmtPace(P.pace)+'/km':'dit mål-tempo'}
  if(!V)return ZDESC[z];if(z==='E')return `(${fmtPace(zPace(V,'E'))}–${fmtPace(vdPace(V,ZONES.E[2]))}/km)`;return `i ${fmtPace(zPace(V,z))}/km (${ZONES[z][0].toLowerCase()}tempo)`})}
const sessTPace=se=>{if(!se)return null;if(se.zone){const V=effV(se);return V?zPace(V,se.zone):null}return se.tpace||null};
function plGoalName(P){if(P.goal==='distance')return `Løb ${RUN_D[P.dist]==='5 km'||RUN_D[P.dist]==='10 km'?RUN_D[P.dist]:RUN_D[P.dist].toLowerCase()}`;
  if(P.goal==='pace')return `${RUN_D[P.dist]} i ${fmtPace(P.pace)}/km`;return PL_GOALS[P.goal][0]}
function runWeeks(P){const r=RUN_WEEKS[P.goal][P.dist]||RUN_WEEKS[P.goal][5];return r}
/* One run session. kind: I intervals, T tempo, F fartlek, E easy, L long. bi = build week index (0..nb-1), nb = number of build weeks */
function runSess(P,kind,bi,nb,wi,date){let tpace=null,kmv=null,zone=null,rtest=false;const g=P.pace,f=nb>1?bi/(nb-1):1,lerp=(a,b)=>a+(b-a)*f,D=P.dist,pc=P.goal==='pace',vd=!!P.vd;
  const easy=vd?'{E}':pc?`i ca. ${fmtPace(g+75)}/km`:'så du kan tale i hele sætninger',k='K'+date.replace(/-/g,'');
  let name,steps,min,kd='zone2';
  if(P.firstTest&&!wi.dl){const tk=pc?5:P.cur>=5?5:3;rtest=true;kd='interval';name=`Test: ${tk} km på tid`;
    steps=['10 min roligt + 4 korte stigningsløb',`${tk} km så hurtigt du kan holde jævnt hele vejen`,'10 min roligt til sidst','Log tiden og distancen, og markér "Løb på tid". Så regner appen dine tempoer ud.'];min=Math.round(tk*6)+25;
    return [k,{name,kind:kd,steps,min,dur:min+' min',rtest,vb:0,note:'Din tid her bliver udgangspunktet for alle tempoer i planen.'}]}
  if(wi.test){if(kind==='L'||kind==='I'&&P.nRun===1){rtest=pc;name=pc?`Test: ${RUN_D[D]} på tid`:`Løb ${RUN_D[D].toLowerCase()}`;if(pc)tpace=g;steps=['10 min roligt for at varme op',pc?`${RUN_D[D]} så hurtigt du kan. Mål: ${vd?'{G}':fmtPace(g)+'/km'}`:`${fmtKm(D)} km i dit eget tempo. Start roligt`,'10 min roligt til sidst'];min=Math.round(D*(pc?g:400)/60)+20;kd='interval'}
    else{name='Let løb før testen';steps=['20 min roligt '+easy,'4 × 20 sek stigningsløb'];min=25}}
  else if(wi.dl){name='Let løb (deload)';steps=[`${kind==='L'?35:25} min roligt ${easy}`];min=kind==='L'?35:25}
  else if(kind==='I'){const sets={5:['6 × 400 m','8 × 400 m','5 × 800 m','6 × 800 m','4 × 1 km','5 × 1 km'],10:['5 × 1 km','6 × 1 km','4 × 1,6 km','5 × 1,6 km','3 × 2 km','4 × 2 km'],21.1:['4 × 2 km','5 × 2 km','3 × 3 km','4 × 3 km','3 × 4 km','2 × 5 km']}[D]||['5 × 1 km'];
    const set=sets[Math.min(sets.length-1,Math.round(f*(sets.length-1)))],ip=lerp(P.curPace,g)-(D<=5?10:D<=10?5:0);
    const repKm=(m=>m?parseFloat(m[1].replace(',','.'))/(m[2]==='m'?1000:1):1)(/× ([\d,]+) (m|km)/.exec(set));if(vd)zone=repKm<=1.2?'I':'T';else tpace=Math.round(ip);
    name='Intervaller '+set;steps=['10 min roligt + 4 korte stigningsløb',vd?`${set} {${zone}}`:`${set} i ${fmtPace(ip)}/km`,D<=5?'90 sek rolig jog mellem':'2 min rolig jog mellem','10 min roligt til sidst'];min=45;kd='interval'}
  else if(kind==='T'){const m=Math.round(lerp(15,30)/5)*5,tp=pc?g+(D<=5?18:D<=10?8:-8):0;
    if(vd)zone='T';else if(pc)tpace=Math.round(tp);name=`Tempoløb ${m} min`;steps=['10 min roligt',vd?`${m} min {T}`:pc?`${m} min i ${fmtPace(tp)}/km`:`${m} min i et tempo, hvor du kun kan sige få ord`,'10 min roligt til sidst'];min=m+20;kd='interval'}
  else if(kind==='F'&&wi.w%2===1){const n=Math.round(lerp(6,10));
    name=`Bakkeløb ${n} × 45 sek`;steps=['10 min roligt hen til en bakke',`${n} × 45 sek hurtigt op ad bakken`,'Gå eller jog roligt ned igen som pause','10 min roligt til sidst'];min=25+n*2;kd='interval'}
  else if(kind==='F'){const n=Math.round(lerp(6,10)),sec=bi>=nb/2?2:1;
    name=`Fartleg ${n} × ${sec} min`;steps=['10 min roligt',`${n} × ${sec} min hurtigt / 2 min roligt`,'5 min roligt til sidst'];min=15+n*(sec+2);kd='interval'}
  else if(kind==='L'){let km;if(pc){const a={5:8,10:12,21.1:16}[D]||10,b={5:12,10:16,21.1:22}[D]||14;km=lerp(a,b)}else{const a=Math.max(2,P.cur),b=Math.max(RUN_PEAK[D],P.cur);km=lerp(a,b)}
    km=Math.round(km*(P.lf||1)*2)/2;kmv=km;name=`Langtur ${fmtKm(km)} km`;steps=[`${fmtKm(km)} km roligt ${easy}`,'Gå gerne et par minutter, hvis du skal'];min=Math.round(km*(pc?g+75:390)/60)}
  else{const m=Math.round(lerp(25,45)/5)*5,st=wi.w%2===1;name=`Roligt løb ${m} min${st?' + stigningsløb':''}`;steps=[`${m} min roligt ${easy}`,...(st?['Til sidst 6 × 20 sek stigningsløb: byg op til hurtigt, gå tilbage']:[])];min=m+(st?5:0)}
  return [k,{name,kind:kd,steps,min,dur:min+' min',tpace,zone,rtest,km:kmv,vb:vd?(P.vGain||0)*f:undefined,note:pc?`Mål-pace: ${fmtPace(g)}/km på ${RUN_D[D].toLowerCase()}.`:''}]}
/* Conditioning that changes from week to week. Hard days rotate between interval formats, easy days between machines,
   threshold days between tempo formats. Volume still grows through the block. */
const CD_MODE=['Løb','Cykel','Romaskine','Skierg','March med oppakning'];
/* Weight loss (research summary):
   - 150 min/week of moderate activity gives little weight loss on its own; 225-420 min/week gives clearly more, and 200-300 min/week helps keep it off (ACSM 2009).
   - Aerobic training burns the most; strength training keeps muscle. Combined works best for weight and fat (network meta-analysis 2013).
   - Intervals give about the same fat loss as steady cardio in less time (Wewege 2017), but steady, low-impact work is easier on the joints at a higher body weight.
   So: 2-3 strength sessions, steady low-impact cardio that grows week by week, one short interval session from week 3, and walks on the other days. */
const VG_MODE=['Rask gang','Cykel','Romaskine','Crosstrainer','Svømning'];
const CD_HARD=[
  i=>{const n=4+(i>=2);return [`${n}×4 min`,[`${n} × 4 min hårdt`,'3 min roligt mellem'],Array(n).fill([240,180])]},
  i=>{const n=5+(i>=2);return [`${n}×3 min`,[`${n} × 3 min hårdt`,'2 min roligt mellem'],Array(n).fill([180,120])]},
  i=>{const n=3+(i>=2);return [`30/15 · ${n} serier`,[`${n} serier: 10 × (30 sek hurtigt + 15 sek let)`,'3 min roligt mellem serierne'],'3015:'+n]},
  i=>{const p=i>=2?[1,2,3,4,3,2,1]:[1,2,3,2,1];return ['Pyramide '+p.join('-'),[`${p.join('-')} min hårdt`,'Pause er halvt så lang som intervallet før'],p.map(m=>[m*60,m*30])]},
  i=>{const n=6+2*(i>=2);return [`${n}×2 min`,[`${n} × 2 min hårdt`,'1 min roligt mellem'],Array(n).fill([120,60])]},
  i=>{const n=8+2*(i>=2);return [`${n}×1 min`,[`${n} × 1 min meget hårdt`,'1 min roligt mellem'],Array(n).fill([60,60])]}];
const CD_TEMPO=[i=>[3,8+2*(i>=2),2],i=>[2,12+3*(i>=2),3],i=>[4,6+2*(i>=2),2],i=>[1,20+5*(i>=2),0]];
function condSess(kind,i,w,slot,date,o={}){const k='K'+date.replace(/-/g,''),ph=[['Opvarmning',600,'easy']],MODES=o.modes||CD_MODE,mode=MODES[(w+slot*2)%MODES.length];let name,steps,note;
  if(kind==='hard'){const [nm,st,rep]=CD_HARD[(w+slot)%CD_HARD.length](i);name='Intervaller '+nm;steps=['10 min roligt for at varme op',...st,'5 min roligt til sidst'];
    if(typeof rep==='string'){const n=+rep.split(':')[1];for(let a=1;a<=n;a++){for(let r=1;r<=10;r++){ph.push([`Serie ${a} · ${r}/10 · hårdt`,30,'work']);if(r<10)ph.push([`Serie ${a} · ${r}/10 · let`,15,'rest'])}if(a<n)ph.push(['Seriepause',180,'rest'])}}
    else rep.forEach(([wk,rs],j)=>{ph.push([`Interval ${j+1} af ${rep.length} · hårdt`,wk,'work']);if(j<rep.length-1)ph.push(['Aktiv pause',rs,'rest'])});
    note='Valgfrit: løb, cykel, ro eller ski. Hårdt, men jævnt hele vejen. Sidste interval skal være lige så godt som det første.'}
  else if(kind==='tempo'){const [n,m,r]=CD_TEMPO[(w+slot)%CD_TEMPO.length](i);name=n>1?`Tærskel ${n}×${m} min`:`Tærskel ${m} min`;
    steps=['10 min roligt for at varme op',n>1?`${n} × ${m} min i et tempo, hvor du kun kan sige få ord`:`${m} min sammenhængende i et tempo, hvor du kun kan sige få ord`,...(n>1?[`${r} min roligt mellem`]:[]),'5 min roligt til sidst'];
    for(let a=1;a<=n;a++){ph.push([n>1?`Tærskel ${a} af ${n}`:'Tærskel',m*60,'work']);if(a<n)ph.push(['Pause',r*60,'rest'])}note=`Forslag: ${mode.toLowerCase()}.`}
  else{const m=o.easyBase!=null?Math.min(o.easyMax||60,o.easyBase+i*5):Math.min(75,40+i*5);name=`Zone 2 · ${mode} ${m} min`;steps=[`${m} min ${mode.toLowerCase()} i roligt tempo`,'60–70 % af maks puls','Du skal kunne tale i hele sætninger'];
    return [k,{name,kind:'zone2',steps,min:m,dur:m+' min',phases:[['Zone 2 · roligt tempo',m*60,'easy']],note:'Skift gerne maskine. Det giver samme effekt og skåner benene.'}]}
  ph.push(['Nedvarmning',300,'easy']);const min=Math.round(ph.reduce((a,p)=>a+p[1],0)/60);
  return [k,{name,kind:'interval',steps,min,dur:'ca. '+min+' min',phases:ph,note}]}
const PL_DOW=[1,2,3,4,5,6,0];
const PL_SHORT={1:'Man',2:'Tir',3:'Ons',4:'Tor',5:'Fre',6:'Lør',0:'Søn'};
const PL_LOWER=['squat','hinge','clean','snatch'];
/* The order full training days cycle through: squat and the Olympic lifts (clean, snatch, jerks under press) most, then deadlift, bench and pulls. */
const CF_ROT=['squat','clean','press_v','hinge','snatch','squat','clean','press_v','hinge','snatch','press_h','pull'];
/* Type of a day in the current weekly plan, so the wizard starts from what the app already knows */
function plTypeOfKey(k){if(!k||k==='R')return 'hvile';if(k==='S'||(SESS[k]&&SESS[k].kind==='styrke'))return 'styrke';if(k==='CF')return 'crossfit';
  const s=SESS[k];if(!s)return 'hvile';if(s.kind==='interval'||s.kind==='zone2')return 'kondition';if(/^AR/.test(k))return 'restitution';if(s.kind==='mobilitet')return 'mobilitet';return 'hvile'}
function plStart(){const t={};PL_DOW.forEach(d=>t[d]=plTypeOfKey(state.plan[d]));
  const days=PL_DOW.filter(d=>['styrke','crossfit','kondition'].includes(t[d]));
  return {step:'goal',nDays:Math.min(6,Math.max(2,days.length||4)),draftSig:null,types:t,fwT:fwT(),strMin:45,weeks:4,goal:'styrke',dist:5,cur:3,pace:300,curPace:330,tKm:5,tTxt:'',noTest:false,vStart:null,deload:true,dlEvery:4,start:'next',preview:null,pick:null}}
/* Sets × reps @ % for week i (0-based) of the block. Deload weeks are lighter; a strength block ends with a test. */
const PL_PROG={styrke:[[5,5,70],[5,4,75],[5,3,80],[4,3,85],[5,2,85],[4,2,88],[3,2,90]],
  muskler:[[4,10,60],[4,8,67],[4,8,70],[4,6,75],[5,6,75],[4,5,78],[4,5,80]],
  kondition:[[3,5,70],[3,5,72],[3,4,75],[3,4,77],[3,3,80],[3,3,82],[3,3,83]],
  allround:[[5,5,70],[5,4,75],[5,3,80],[4,3,85],[5,2,85],[4,2,87],[3,2,90]],
  vaegt:[[3,12,60],[3,12,62],[3,10,65],[3,10,67],[4,10,67],[4,8,70],[4,8,72]],
  hybrid:[[4,5,70],[4,5,72],[4,4,75],[4,4,77],[4,3,80],[4,3,82],[4,3,84]]};
/* Goal keys are stored in saved plans: 'allround' is the CrossFit goal, 'hybrid' is Allround (everything mixed). */
const plHasTest=P=>(P.goal==='styrke'||isRun(P.goal))&&P.weeks>=3;
/* Deload every E weeks. The last week can be a deload unless it is a test week. */
function plWeekInfo(P){const out=[];let n=0;for(let w=0;w<P.weeks;w++){const E=P.dlEvery||4,test=plHasTest(P)&&w===P.weeks-1,dl=P.deload&&P.weeks>=3&&w%E===E-1&&!test;out.push({w,dl,test,i:dl||test?-1:n++})}return out}
const plDlFits=(P,k)=>k<=P.weeks-(plHasTest(P)?1:0);
function plDose(P,wi){if(wi.dl)return {s:3,r:5,pct:60,rir:4,dl:true};if(wi.test&&isRun(P.goal))return {s:3,r:3,pct:70,rir:3};if(wi.test)return {test:true,s:6,r:3,pct:0,rir:1};
  const pr=PL_PROG[isRun(P.goal)?'kondition':P.goal],v=pr[Math.min(wi.i,pr.length-1)];return {s:v[0],r:v[1],pct:v[2],rir:v[2]>=85?1:v[2]>=75?2:3}}
/* Assign a main lift pattern to every lifting day of the week (same pattern each week, so the lift can progress).
   Tries every order and keeps the one with fewest heavy lower-body days back to back. */
function plPatterns(P){const lift=PL_DOW.filter(d=>['styrke','crossfit'].includes(P.types[d])),n=lift.length;if(!n)return {};
  const base=['squat','hinge','press_v','press_h','clean','snatch','pull'];
  const pool=n===1?['squat']:n===2?['squat','hinge']:n===3?['squat','press_v','hinge']:base.slice(0,n);
  let best=null,bc=1e9;const perm=(a,k=0)=>{if(k===a.length){let c=0;
      lift.forEach((d,i)=>{const p=a[i],t=P.types[d];if(t==='crossfit'&&p==='press_h')c+=1;if(t==='styrke'&&(p==='clean'||p==='snatch'))c+=1});
      for(let i=0;i<7;i++){const d=PL_DOW[i],e=PL_DOW[(i+1)%7],ia=lift.indexOf(d),ib=lift.indexOf(e);if(ia>=0&&ib>=0&&PL_LOWER.includes(a[ia])&&PL_LOWER.includes(a[ib]))c+=3}
      c+=Math.random()*.3;if(c<bc){bc=c;best=a.slice()}return}
    for(let i=k;i<a.length;i++){[a[k],a[i]]=[a[i],a[k]];perm(a,k+1);[a[k],a[i]]=[a[i],a[k]]}};
  perm(pool.slice());const out={};lift.forEach((d,i)=>out[d]=best[i]);return out}
const PL_MAIN={squat:['Squat','Frontsquat','Goblet squat','Split squat'],hinge:['Dødløft','Trap bar-dødløft','Rumænsk dødløft','Kettlebell swing'],press_v:['Militærpres','Push press','Håndvægt-skulderpres','Pike push-ups'],
  press_h:['Bænkpres','Håndvægt-bænkpres','Dips','Push-ups'],clean:['Power clean','Hang power clean','Kettlebell swing'],snatch:['Kettlebell snatch (pr. arm)','Power clean'],pull:['Pull-ups','Rotræk med stang','Ring-roning','Elastik-roning']};
const PL_SECOND={squat:'press_v',hinge:'press_h'};
const PL_ACC={squat:[['lunge'],['leg_iso','glute'],['core']],hinge:[['lunge'],['pull_h'],['core','carry']],press_v:[['pull_v'],['delt'],['arms']],press_h:[['pull_h'],['chest_iso','delt'],['arms']],
  clean:[['pull_v'],['lunge'],['core']],snatch:[['pull_h'],['lunge'],['core']],pull:[['push_h'],['delt'],['arms']]};
const plLibPick=(names)=>{for(const n of names){const x=strFor(n);if(x&&strOk(x))return x}return strFor(names[names.length-1])};
/* Accessories per strength session follow the time you have: 30 min → 1, 45 → 2, 60 → 3, 75 → 4 (one more when building muscle) */
const plAccN=P=>Math.min(5,({30:1,45:2,60:3,75:4}[P.strMin]||2)+(P.goal==='muskler'?1:0));
function plAccFor(pat,n,used){const out=[],G=PL_ACC[pat]||[];(G.length?[...Array(n)].map((_,j)=>G[j%G.length]):[]).forEach(ps=>{const c=STR_LIB.filter(x=>ps.includes(x[3])&&strOk(x)&&!used.has(x[0]));if(c.length){const x=fwPick(c);used.add(x[0]);out.push(x)}});return out}
/* One plan: date → {key, sess?, fw?} */
function plBuild(P){
  const mon=mondayOf(TODAY),start=P.start==='next'?ds(new Date(pd(mon).getFullYear(),pd(mon).getMonth(),pd(mon).getDate()+7)):mon;
  const pats=plPatterns(P),info=plWeekInfo(P),lifting=PL_DOW.filter(d=>pats[d]),nLift=lifting.length;
  // Per weekday: movement pattern stays (so the week stays balanced). The main lift stays for a whole wave (needed to progress),
  // a strength goal keeps it all block (it ends in a test). Accessories change every week.
  const waveOf=wi=>{const E=P.deload?(P.dlEvery||4):3;return Math.floor(wi.w/E)};
  const mainOpts=pat=>{const o=PL_MAIN[pat].map(n=>strFor(n)).filter(x=>x&&strOk(x));return o.length?o:[plLibPick(PL_MAIN[pat])]};
  const fixed={};lifting.forEach(d=>{const pat=pats[d],used=new Set(),main=plLibPick(PL_MAIN[pat]);used.add(main[0]);
    const sec=nLift<=2&&P.types[d]==='styrke'?(nLift===1?['press_h','pull']:[PL_SECOND[pat]]).filter(Boolean).map(p=>{const x=plLibPick(PL_MAIN[p]);used.add(x[0]);return x}):[];
    const fwl=FW_LIFTS.filter(x=>x[2]===pat&&fwEqOk(x[3])),fwBar=fwl.filter(x=>x[4]);
    fixed[d]={pat,main,sec,acc:plAccFor(pat,plAccN(P),used),fwLift:(fwBar[0]||fwl[0]||FW_LIFTS.find(x=>x[2]===pat))[0],fwOpts:(fwBar.length?fwBar:fwl).map(x=>x[0]),lastAcc:new Set()}});
  const weekly=(d,wi)=>{const f=fixed[d],wv=waveOf(wi),mo=mainOpts(f.pat),main=P.goal==='styrke'?f.main:mo[wv%mo.length];
    const used=new Set([main[0],...f.sec.map(x=>x[0]),...f.lastAcc]);const acc=plAccFor(f.pat,plAccN(P),used);
    f.lastAcc=new Set(acc.map(x=>x[0]));const fo=f.fwOpts.length?f.fwOpts:[f.fwLift];return {...f,main,acc,fwLift:P.goal==='styrke'?f.fwLift:fo[wv%fo.length]}};
  const days={},sess={},weeks=[];let arN=0,mobN=0,ftDone=false;
  if(isRun(P.goal)&&(P.vStart!=null||P.noTest)){P.vd=true;const nbw=info.filter(x=>x.i>=0).length;
    P.vGain=P.goal==='pace'&&P.vStart!=null?Math.max(0,Math.min(vdotOf(P.dist,P.pace*P.dist)-P.vStart,vdGain(nbw))):vdGain(nbw)*.5}
  // Full training days rotate the B lift through the CrossFit patterns week by week (squat, press, deadlift, clean, snatch …),
  // never two lower-body lifts on neighbouring days. A strength goal keeps one lift per day, because it ends in a test.
  const cfDays=PL_DOW.filter(d=>P.types[d]==='crossfit'),rotate=P.goal!=='styrke',patN={};let cfI=0;
  const cfLift=p=>{const o=FW_LIFTS.filter(x=>x[2]===p&&fwEqOk(x[3])),bar=o.filter(x=>x[4]),L=bar.length?bar:o;if(!L.length)return null;const i=patN[p]=(patN[p]||0)+1;return L[(i-1)%L.length][0]};
  const cfWeek=()=>{const wp={},patOf=d=>wp[d]||(P.types[d]==='styrke'?pats[d]:null),near=d=>{const i=PL_DOW.indexOf(d);return [PL_DOW[(i+6)%7],PL_DOW[(i+1)%7]]};
    cfDays.forEach(d=>{let pick=null;for(let t=0;t<CF_ROT.length&&!pick;t++){const p=CF_ROT[(cfI+t)%CF_ROT.length];
        if(!FW_LIFTS.some(x=>x[2]===p&&fwEqOk(x[3])))continue;if(PL_LOWER.includes(p)&&near(d).some(n=>PL_LOWER.includes(patOf(n))))continue;pick=p;cfI+=t+1}
      wp[d]=pick||pats[d]});return wp};
  info.forEach(wi=>{const wk={...wi,days:[]};const dose=plDose(P,wi);let cardioN=0;const cfPat=rotate?cfWeek():{};
    PL_DOW.forEach((dow,j)=>{const date=ds(new Date(pd(start).getFullYear(),pd(start).getMonth(),pd(start).getDate()+wi.w*7+j));const t=P.types[dow];let key='R',label='Hvile';
      if(t==='styrke'){const f=weekly(dow,wi),k='P'+date.replace(/-/g,'');const bar=STR_BY.get(f.main[0].toLowerCase())[1]===EQ_ST;
        const mainRow=dose.test?[f.main[0],6,3,1]:[f.main[0],dose.s,dose.r,dose.rir];
        const accSets=wi.dl?2:P.goal==='muskler'?4:3;
        const ex=[mainRow,...f.sec.map(x=>[x[0],wi.dl?2:3,8,2]),...f.acc.map(x=>[x[0],accSets,P.goal==='muskler'?Math.max(x[5],10):x[5],x[6]])];
        const what=dose.test?'Test: byg op til en ny 3RM':`${dose.s} × ${dose.r}${dose.pct?` @ ${dose.pct} %`:` · ${dose.rir} i tanken`}`;
        sess[k]={name:`${f.main[0]} · uge ${wi.w+1}`,kind:'styrke',dur:'ca. '+Math.round((ex.reduce((a,x)=>a+x[1],0))*2.2+8)+' min',ex,main:f.main[0],pct:dose.test?null:dose.pct||null,...(P.goal==='vaegt'?{finisher:15}:{}),
          note:(P.goal==='vaegt'?'Afslut med 15 min rolig cykel, romaskine eller gang. ':'')+(wi.dl?'Deload-uge: let og kort, så kroppen kan nå at blive stærkere. ':'')+`Hovedløft: ${what}.`+(dose.pct&&!dose.test?' Vægten regnes ud fra dine loggede sæt og følger med, når du bliver stærkere.':'')};
        key=k;label=`${f.main[0]} ${what}`}
      else if(t==='crossfit'){const f=weekly(dow,wi),k='F'+date.replace(/-/g,''),l=fwL(rotate&&cfPat[dow]&&cfLift(cfPat[dow])||f.fwLift),T=FW_TIMES.includes(P.fwT)?P.fwT:fwT();
        let b;const oly=['clean','snatch'].includes(l[2]);
        if((oly||l[0]==='thr')&&!wi.dl&&!wi.test&&l[4]){const ids=l[0]==='thr'?['build']:l[2]==='clean'?['emom','complex','build','cluster']:['emom','build','complex'],sc=FW_SCHEMES.find(x=>x.id===ids[Math.max(0,wi.i)%ids.length]);b={lift:l[0],scheme:sc.id,lines:sc.lines(l),note:sc.note,min:sc.min,heavy:sc.heavy,pct:true}}
        else if(P.goal==='allround'&&!wi.dl&&!wi.test&&l[4]){const ids=['across','ladder','wave','531','emom','wave','ladder'],s=FW_SCHEMES.find(x=>x.id===ids[wi.i%ids.length]);b=s&&s.pats.includes(l[2])?{lift:l[0],scheme:s.id,lines:s.lines(l),note:s.note,min:s.min,heavy:s.heavy,pct:true}:null}
        if(!b){const lines=dose.test?['Byg op til en ny 3RM','Ca. 6-8 sæt, hvile 2:30 mellem de tunge']:wi.dl?[oly?'3 × 3 @ 60 %':'3 × 5 @ 60 %','Let og hurtigt. Fokus på teknik']:[`${dose.s} sæt × ${dose.r}${l[4]?` @ ${dose.pct} %`:` · ${dose.rir} i tanken`}`,'Ét sæt hvert 2:00-2:30 min'];
          b={lift:l[0],scheme:dose.test?'build':wi.dl?'across':'across',lines,note:wi.dl?'Deload-uge: let, så kroppen kan nå at blive stærkere.':'Samme løft i denne periode, lidt tungere hver uge.',min:dose.test?18:wi.dl?10:14,heavy:dose.pct>=80||dose.test?1:0,pct:!!l[4]&&!dose.test}}
        const w={T,b,a:fwGenA(b),c:fwGenC(b,wi.dl?45:T),d:fwGenD(b,wi.dl?45:T),plan:true};
        const p=w.c?cfRebuild(w.c):null;sess[k]={name:`Fuld træning · ${l[1]}`,kind:'crossfit',fw:true,w,dur:`${T} min`};key=k;label=`${l[1]} + ${p?p.overskrift:'WOD'}`}
      else if(t==='kondition'&&isRun(P.goal)){cardioN++;const nRun=PL_DOW.filter(d=>P.types[d]==='kondition').length,nb=info.filter(x=>x.i>=0).length;
        const order=P.goal==='pace'?{1:['I'],2:['I','L'],3:['I','T','L'],4:['I','E','T','L'],5:['I','E','T','E','L'],6:['E','I','E','T','E','L'],7:['E','I','E','T','E','E','L']}:{1:['L'],2:['E','L'],3:['E','F','L'],4:['E','F','E','L'],5:['E','F','E','T','L'],6:['E','F','E','T','E','L'],7:['E','F','E','T','E','E','L']};
        const rk={kind:order[Math.min(7,nRun)][cardioN-1],bi:Math.max(0,wi.i),nb:Math.max(1,nb),wi:{w:wi.w,dl:wi.dl,test:wi.test,i:wi.i},nRun};const ft=P.vd&&P.vStart==null&&!ftDone&&date>=TODAY;if(ft)ftDone=true;const [k,ss]=runSess({...P,nRun,firstTest:ft},rk.kind,rk.bi,rk.nb,rk.wi,date);ss.rk=rk;sess[k]=ss;key=k;label=ss.name}
      else if(t==='kondition'){cardioN++;const kond=P.goal==='kondition',i=Math.max(0,wi.i);
        if(wi.dl&&cardioN>1){if(P.goal==='vaegt'){key='GA';label='Gåtur (let uge)'}else{key='R';label='Hvile (deload)'}}
        else{const slot=(cardioN-1)%(kond?3:2),kind=wi.dl?'easy':slot===0?'hard':slot===1?'easy':'tempo';
          const vg=P.goal==='vaegt',kd=vg?(wi.dl?'easy':(cardioN-1)%3===1&&i>=2?'hard':'easy'):kind,o=vg?{modes:VG_MODE,easyBase:35,easyMax:70}:{};
          const [k,ss]=condSess(kd,i,wi.w,cardioN-1,date,o);if(vg&&kd==='hard')ss.note='Brug cykel, romaskine eller crosstrainer. Det skåner leddene. Hårdt, men jævnt.';
          ss.ck={kind:kd,i,w:wi.w,slot:cardioN-1,alt:0,o};sess[k]=ss;key=k;label=ss.name}}
      else if(t==='restitution'){key=P.goal==='vaegt'?'GA':'AR'+(1+(arN++%5));label=SESS[key].name}
      else if(t==='mobilitet'){key=(mobN++%2)?'BAL':'MOB';label=SESS[key].name}
      if(date>=TODAY)days[date]=key;wk.days.push({date,dow,t,key,label,past:date<TODAY})});
    weeks.push(wk)});
  return {start,weeks,days,sess,P:{...P,preview:null}}}
function plAccept(){const pv=ui.pl.preview;if(!pv)return;
  planDates().forEach(d=>{if(d>=TODAY)setDay(d,{p:null})});
  Object.entries(pv.days).forEach(([d,k])=>setDay(d,{p:k,m:null,skip:null}));
  state.planSess={...(state.planSess||{}),...pv.sess};
  const end=pv.weeks[pv.weeks.length-1].days[6].date;const {preview:_p,pick:_k,...P0}=pv.P;if(P0.vStart!=null&&P0.tSec){const vs=(state.vdots||[]).filter(x=>!(x.date===TODAY&&x.src==='plan'));vs.push({date:TODAY,v:P0.vStart,km:P0.tKm,sec:P0.tSec,src:'plan'});state.vdots=vs}state.block={P:JSON.parse(JSON.stringify(P0)),made:TODAY,start:pv.start,end,weeks:pv.P.weeks,goal:pv.P.goal,goalName:plGoalName(pv.P),deloads:pv.weeks.filter(w=>w.dl).map(w=>w.w)};
  applySess();save()}
/* Empty the calendar: no plan, no fixed week, no one-off sessions. Days you trained keep their session. */
function wipeCalendar(){const done=new Set((state.logs||[]).map(l=>l.date)),keep=d=>d<TODAY&&done.has(d);
  plStop();Object.keys(state.days||{}).forEach(d=>{if(!keep(d))setDay(d,{m:null,x:null,skip:null})});pruneSess();
  const rest={};PL_DOW.forEach(d=>rest[d]='R');state.plan={...rest};state.addons={};if(state.customPlan)state.customPlan={...rest};if(state.customAddons)state.customAddons={};
  applySess();save()}
/* Stopping removes everything the plan put in the calendar. Only days you actually trained keep their session, so the history still makes sense. */
function plStop(){const done=new Set((state.logs||[]).map(l=>l.date));
  planDates().forEach(d=>{if(!(d<TODAY&&done.has(d)))setDay(d,{p:null})});state.block=null;pruneSess();applySess();save()}
const plActive=()=>state.block&&state.block.end>=TODAY?state.block:null;
function plWeekNo(){const b=plActive();if(!b)return 0;return Math.floor((pd(mondayOf(TODAY))-pd(b.start))/(7*864e5))+1}
/* Full content of one day in the plan review */
/* ---------- Editing the draft before you accept it ---------- */
/* Day labels in the draft follow edits */
function plRelabel(pv,key){const s=pv.sess[key];if(!s)return;pv.weeks.forEach(w=>w.days.forEach(x=>{if(x.key!==key)return;
  if(s.fw&&s.w){const p=s.w.c?cfRebuild(s.w.c):null;x.label=`${fwL(s.w.b.lift)[1]} + ${p?p.overskrift:'WOD'}`}
  else if(s.kind==='styrke'&&s.main&&x.label){const m=/^(.*?) ((?:\d+ × \d+|Test).*)$/.exec(x.label);x.label=m?`${s.main} ${m[2]}`:s.main}
  else x.label=s.name}))}
/* Exercises that can replace one in a strength session: same movement pattern, equipment you have, not already in the session */
function plExAlts(s,i){const x=strFor(s.ex[i][0]),pat=x?x[3]:null;return STR_LIB.filter(y=>(pat?y[3]===pat:true)&&strOk(y)&&!s.ex.some(e=>e[0]===y[0]))}
function plStrEdit(x,s){const P=ui.pl,sw=P.swap&&P.swap.key===x.key?P.swap.i:-1,ls=P.lastSwap&&P.lastSwap.key===x.key?P.lastSwap:null;
  return `<ul class="ex pl-ex">${s.ex.map((e,i)=>{const main=s.pct&&s.main===e[0],k=main?kgFor(e[0],s.pct):null;return `<li><span class="exn">${esc(e[0])}</span><span class="exp num">${e[1]}×${e[2]}<small>${k?fnum(k)+' kg':main&&s.pct?s.pct+' %':e[3]+' i tanken'}</small></span>
    <span class="pl-exb"><button class="restbtn swap" data-act="plexswap" data-key="${x.key}" data-i="${i}">${sw===i?'Luk':'Byt'}</button>${s.ex.length>2&&!main?`<button class="restbtn swap" data-act="plexdel" data-key="${x.key}" data-i="${i}" aria-label="Fjern ${esc(e[0])}">Fjern</button>`:''}</span>
    ${sw===i?(()=>{const A=plExAlts(s,i);return `<div class="alts">${A.length?`<button data-act="plexpick" data-key="${x.key}" data-i="${i}" data-v="${esc(pickRand(A)[0])}" style="background:var(--pill);color:var(--pill-fg)">🎲 Tilfældig</button>`+A.slice(0,14).map(a=>`<button data-act="plexpick" data-key="${x.key}" data-i="${i}" data-v="${esc(a[0])}">${esc(a[0])}</button>`).join(''):'<p class="hint">Ingen andre øvelser til samme bevægelse med dit udstyr.</p>'}</div>`})():''}</li>`}).join('')}</ul>
    ${ls?`<button class="btn ghost" data-act="plexall">Skift ${esc(ls.from)} til ${esc(ls.to)} alle ${DAYS[ls.dow]}e</button>`:''}`}
function plDetail(x,pv){if(x.key==='R')return '';
  if(x.t==='crossfit'){const w=(pv.sess[x.key]||{}).w;if(!w)return '';const l=fwL(w.b.lift),p=w.c?cfRebuild(w.c):null;
    return `<div class="pl-det"><button class="btn ghost" data-act="plfwedit" data-key="${x.key}" data-date="${x.date}">Rediger træningen</button><p class="fw-sub">A) Opvarmning</p><p>${esc([w.a.cardio,...w.a.gen,...w.a.spec].join(' · '))}</p>
      <p class="fw-sub">B) ${esc(l[1])}</p>${w.b.lines.map(t=>`<p><b>${esc(t)}</b></p>`).join('')}
      ${p?`<p class="fw-sub">C) WOD</p>${cfWod(p)}`:''}
      ${w.d.length?`<p class="fw-sub">D) Bonus</p><p>${esc(w.d.join(' · '))}</p>`:''}</div>`}
  const s=pv.sess[x.key]||SESS[x.key];if(!s)return '';
  if(s.kind==='styrke'&&s.ex&&pv.sess[x.key])return `<div class="pl-det"><p class="muted small">${esc(s.dur||'')}</p>${plStrEdit(x,s)}${s.note?`<p class="note">${esc(s.note)}</p>`:''}</div>`;
  return `<div class="pl-det"><p class="muted small">${esc(s.dur||'')}</p>${s.ck?`<button class="btn ghost" data-act="plcondalt" data-key="${x.key}" data-date="${x.date}">🎲 Andet format</button>`:''}${sessionBody(s,x.date)}${s.note?`<p class="note">${esc(s.note)}</p>`:''}</div>`}
