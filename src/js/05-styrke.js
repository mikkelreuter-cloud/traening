/* Styrke: øvelsesbibliotek, udstyr og tilfældige styrkepas. */
/* ---------- Strength exercise library: [name, equipment, muscle group, movement pattern, sets, reps, reps in reserve] ---------- */
const EQ_ST='Stang og stativ',EQ_DB='Håndvægte',EQ_KB='Kettlebells',EQ_CB='Kabeltræk',EQ_MA='Maskiner',EQ_PU='Pull-up-stang',EQ_DI='Dip-stang',EQ_TB='Trap bar',EQ_RI='Ringe eller TRX',EQ_EL='Elastikker',EQ_SL='Slæde',EQ_SM='Ab wheel, kasse og bold',EQ_NO='Ingen udstyr';
const STR_EQ=[EQ_ST,EQ_DB,EQ_KB,EQ_CB,EQ_MA,EQ_PU,EQ_DI,EQ_TB,EQ_RI,EQ_EL,EQ_SL,EQ_SM];
const STR_GROUPS=['Ben','Bagside','Bryst','Ryg','Skuldre','Arme','Core','Helkrop'];
const STR_LIB=[
 ['Squat',EQ_ST,'Ben','squat',4,5,2],['Frontsquat',EQ_ST,'Ben','squat',3,6,2],['Pause squat',EQ_ST,'Ben','squat',3,4,2],['Box squat',EQ_ST,'Ben','squat',4,5,2],
 ['Dødløft',EQ_ST,'Bagside','hinge',3,5,3],['Rumænsk dødløft',EQ_ST,'Bagside','hinge',3,8,2],['Sumo-dødløft',EQ_ST,'Bagside','hinge',3,5,3],['Good morning',EQ_ST,'Bagside','hinge',3,10,2],
 ['Hip thrust',EQ_ST,'Bagside','glute',3,8,1],['Bænkpres',EQ_ST,'Bryst','push_h',4,5,2],['Skrå bænkpres',EQ_ST,'Bryst','push_h',3,8,2],['Smal bænkpres',EQ_ST,'Arme','push_h',3,8,2],
 ['Militærpres',EQ_ST,'Skuldre','push_v',4,5,2],['Push press',EQ_ST,'Skuldre','push_v',4,4,2],['Landmine press (pr. arm)',EQ_ST,'Skuldre','push_v',3,10,2],
 ['Rotræk med stang',EQ_ST,'Ryg','pull_h',3,8,1],['Pendlay row',EQ_ST,'Ryg','pull_h',4,6,2],['Reverse lunges med stang',EQ_ST,'Ben','lunge',3,8,2],
 ['Stang-curl',EQ_ST,'Arme','arms',3,10,1],['Power clean',EQ_ST,'Helkrop','power',5,3,3],['Hang power clean',EQ_ST,'Helkrop','power',5,3,3],
 ['Håndvægt-bænkpres',EQ_DB,'Bryst','push_h',3,8,2],['Skrå håndvægtpres',EQ_DB,'Bryst','push_h',4,8,1],['Håndvægt-flyes',EQ_DB,'Bryst','chest_iso',3,12,2],
 ['Håndvægt-skulderpres',EQ_DB,'Skuldre','push_v',3,8,2],['Arnold press',EQ_DB,'Skuldre','push_v',3,10,2],['Sidehæv med håndvægte',EQ_DB,'Skuldre','delt',3,12,1],['Bagside-flyes med håndvægte',EQ_DB,'Skuldre','delt',3,12,1],
 ['Enarms-roning (pr. arm)',EQ_DB,'Ryg','pull_h',3,10,1],['Bulgarsk splitsquat',EQ_DB,'Ben','lunge',3,8,2],['Goblet squat',EQ_DB,'Ben','squat',3,10,2],['Walking lunges med håndvægte',EQ_DB,'Ben','lunge',3,10,2],['Step-ups med håndvægte',EQ_DB,'Ben','lunge',3,8,2],
 ['Håndvægt-RDL',EQ_DB,'Bagside','hinge',3,10,2],['Bicepscurl med håndvægte',EQ_DB,'Arme','arms',3,10,1],['Hammer curl',EQ_DB,'Arme','arms',3,10,1],['Triceps extension over hovedet',EQ_DB,'Arme','arms',3,12,1],
 ["Farmer's walk (meter)",EQ_DB,'Helkrop','carry',3,40,1],['Suitcase carry (meter pr. side)',EQ_DB,'Core','carry',3,30,2],
 ['Kettlebell swing',EQ_KB,'Bagside','hinge',4,15,2],['Dobbelt kettlebell frontsquat',EQ_KB,'Ben','squat',3,8,2],['Kettlebell clean & press (pr. arm)',EQ_KB,'Skuldre','push_v',3,6,2],
 ['Kettlebell-roning (pr. arm)',EQ_KB,'Ryg','pull_h',3,10,2],['Turkish get-up (pr. side)',EQ_KB,'Helkrop','core',3,2,2],['Kettlebell snatch (pr. arm)',EQ_KB,'Helkrop','power',4,6,2],
 ['Kabelroning siddende',EQ_CB,'Ryg','pull_h',3,10,1],['Lat pulldown',EQ_CB,'Ryg','pull_v',3,10,1],['Straight-arm pulldown',EQ_CB,'Ryg','pull_iso',3,12,2],['Face pulls',EQ_CB,'Skuldre','delt',3,15,2],
 ['Kabel-flyes',EQ_CB,'Bryst','chest_iso',3,12,2],['Triceps pushdown',EQ_CB,'Arme','arms',3,12,1],['Kabel-curl',EQ_CB,'Arme','arms',3,12,1],['Pallof press (pr. side)',EQ_CB,'Core','core',3,10,2],['Kabel-woodchop (pr. side)',EQ_CB,'Core','core',3,10,2],
 ['Benpres',EQ_MA,'Ben','squat',3,10,2],['Hack squat',EQ_MA,'Ben','squat',3,8,2],['Leg extension',EQ_MA,'Ben','leg_iso',3,12,1],['Leg curl',EQ_MA,'Bagside','leg_iso',3,10,1],
 ['Lægpres i maskine',EQ_MA,'Ben','calves',3,12,1],['Brystpres i maskine',EQ_MA,'Bryst','push_h',3,10,1],['Skulderpres i maskine',EQ_MA,'Skuldre','push_v',3,10,1],['Roning i maskine',EQ_MA,'Ryg','pull_h',3,10,1],
 ['Assisteret pull-ups',EQ_MA,'Ryg','pull_v',3,8,1],['Pec deck',EQ_MA,'Bryst','chest_iso',3,12,1],['Rygstræk (back extension)',EQ_MA,'Bagside','hinge',3,12,2],['Hip abduction',EQ_MA,'Bagside','glute',3,15,1],
 ['Pull-ups',EQ_PU,'Ryg','pull_v',4,6,1],['Chin-ups',EQ_PU,'Ryg','pull_v',3,8,1],['Hængende knæløft',EQ_PU,'Core','core',3,12,2],['Toes to bar',EQ_PU,'Core','core',3,10,2],
 ['Dips',EQ_DI,'Bryst','push_h',3,8,1],['Trap bar-dødløft',EQ_TB,'Bagside','hinge',3,5,2],['Trap bar carry (meter)',EQ_TB,'Helkrop','carry',3,40,1],
 ['Ring-roning',EQ_RI,'Ryg','pull_h',3,10,2],['Ring-dips',EQ_RI,'Bryst','push_h',3,6,2],['Ring push-ups',EQ_RI,'Bryst','push_h',3,10,2],['Body saw',EQ_RI,'Core','core',3,10,2],
 ['Band pull-aparts',EQ_EL,'Skuldre','delt',3,20,2],['Elastik-roning',EQ_EL,'Ryg','pull_h',3,15,2],
 ['Slædeskub (meter)',EQ_SL,'Helkrop','carry',4,20,2],['Slædetræk baglæns (meter)',EQ_SL,'Ben','carry',4,20,2],
 ['Ab wheel',EQ_SM,'Core','core',3,8,2],['Box jumps',EQ_SM,'Ben','power',4,5,3],['Medicinbold-slam',EQ_SM,'Helkrop','power',3,10,3],['Wall balls',EQ_SM,'Helkrop','squat',3,15,2],
 ['Push-ups',EQ_NO,'Bryst','push_h',3,12,2],['Pike push-ups',EQ_NO,'Skuldre','push_v',3,8,2],['Split squat',EQ_NO,'Ben','lunge',3,10,2],['Lunges',EQ_NO,'Ben','lunge',3,12,2],
 ['Glute bridge på et ben (pr. ben)',EQ_NO,'Bagside','glute',3,12,2],['Nordic curl',EQ_NO,'Bagside','leg_iso',3,5,2],['Lægløft på et ben (pr. ben)',EQ_NO,'Ben','calves',3,12,1],
 ['Plank (sek)',EQ_NO,'Core','core',3,45,2],['Sideplank (sek pr. side)',EQ_NO,'Core','core',3,30,2],['Dead bug (pr. side)',EQ_NO,'Core','core',3,10,2],['Hollow hold (sek)',EQ_NO,'Core','core',3,30,2]];
const STR_BY=new Map(STR_LIB.map(x=>[x[0].toLowerCase(),x]));
const strHave=()=>state.strUdstyr||STR_EQ;
const strOk=x=>x[1]===EQ_NO||strHave().includes(x[1]);
const strFor=n=>STR_BY.get(String(n||'').trim().toLowerCase());
/* Build a session: one exercise per slot, picking from what the equipment allows. Earlier slots are the heavy lifts. */
const STR_FOCUS={hel:['Helkrop',[['squat'],['hinge'],['push_h','push_v'],['pull_v','pull_h'],['lunge'],['push_v','push_h'],['pull_h','pull_v'],['core','carry'],['delt','arms']]],
 over:['Overkrop',[['push_h'],['pull_v'],['push_v'],['pull_h'],['delt','chest_iso'],['arms'],['arms'],['core']]],
 under:['Underkrop',[['squat'],['hinge'],['lunge'],['glute'],['leg_iso'],['calves'],['carry'],['core']]],
 bryst:['Bryst',[['push_h'],['push_h'],['chest_iso'],['push_v'],['arms'],['chest_iso'],['delt'],['core']]],
 ryg:['Ryg',[['pull_v'],['pull_h'],['hinge'],['pull_h','pull_v'],['pull_iso','delt'],['arms'],['carry'],['core']]],
 ben:['Ben',[['squat'],['hinge'],['lunge'],['leg_iso'],['glute'],['calves'],['squat'],['core']]],
 arme:['Skuldre og arme',[['push_v'],['delt'],['arms'],['arms'],['delt'],['arms'],['push_v'],['core']]],
 core:['Core',[['core'],['carry'],['core'],['hinge'],['core'],['core'],['carry']]]};
const STR_TIME=[30,45,60,75];
const STR_INT={let:['Let','Flere gentagelser, god margin'],mod:['Moderat','Klassisk styrke og muskler'],tung:['Tung','Få gentagelser, tæt på max']};
const STR_MAIN=['squat','hinge','push_h','push_v','pull_h','pull_v','lunge','power'];
const pickRand=a=>a[Math.floor(Math.random()*a.length)];
const perSetMin=i=>i==='tung'?2.8:2.2;
/* Sets, reps and reps in reserve for one exercise at the chosen intensity. Distances and seconds keep their number. */
function strDose(x,slot,int){let s=x[4],r=x[5],q=x[6];const unit=/\((meter|sek)/.test(x[0]),main=STR_MAIN.includes(x[3]);
  if(int==='tung'){if(main&&slot<2){s=Math.max(4,s);if(!unit)r=Math.max(3,Math.min(5,r-2));q=1}else{if(!unit)r=Math.max(5,r-2);q=1}}
  else if(int==='let'){s=Math.min(3,s);if(!unit)r=Math.min(20,r+4);q=3}
  return {n:x[0],s:String(s),r:String(r),q:String(q)}}
/* Random session: walks the focus slots in order (heavy lifts first) until the time budget is filled. */
function strSuggest(o){const f=STR_FOCUS[o.focus]||STR_FOCUS.hel,used=new Set(),out=[],budget=(o.min-8)/perSetMin(o.int);let sets=0;
  for(let i=0;i<f[1].length&&out.length<9;i++){const pats=f[1][i];
    let c=STR_LIB.filter(x=>pats.includes(x[3])&&strOk(x)&&!used.has(x[0]));if(!c.length)c=STR_LIB.filter(x=>pats.includes(x[3])&&x[1]===EQ_NO&&!used.has(x[0]));if(!c.length)continue;
    const d=strDose(pickRand(c),out.length,o.int);if(out.length>=3&&sets+(+d.s)>budget+1)break;used.add(d.n);out.push(d);sets+=+d.s}
  return out}
const strOpts=()=>({focus:'hel',min:45,int:'mod',...(state.strGen||{})});
function strSwap(name){const x=strFor(name);const pats=x?[x[3]]:['squat','hinge','push_h','pull_h'];const c=STR_LIB.filter(y=>pats.includes(y[3])&&strOk(y)&&y[0]!==name&&!(ui.se.ex||[]).some(e=>e.n===y[0]));return c.length?pickRand(c):null}
function allExercises(){const set=new Set();Object.values(SESS).forEach(s=>(s.ex||[]).forEach(e=>set.add(e[0])));loggedExercises().forEach(e=>set.add(e));STR_LIB.forEach(x=>set.add(x[0]));return [...set]}
const testNames=()=>[...new Set(logsOf('test').map(l=>l.name))];

