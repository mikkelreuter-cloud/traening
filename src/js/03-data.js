/* Gemte data: felter og standardværdier, opgradering (SCHEMA), load/save og sammensætning af pas. */
/* ---------- storage ---------- */
let storageOK=true;
try{localStorage.setItem('__t','1');localStorage.removeItem('__t')}catch(e){storageOK=false}
/* ---------- Saved data. Every field has one default here, and old data is upgraded step by step by its version number. ---------- */
const SCHEMA=4;
const FIELDS={logs:()=>[],plan:()=>({...DEFAULT_PLAN}),addons:()=>({}),lastBackup:()=>null,bkSnooze:()=>null,program:()=>'custom',cycleStart:()=>null,hrmax:()=>null,habitStart:()=>null,
  coldPre:()=>undefined,customHabits:()=>[],sessEdits:()=>({}),customSess:()=>({}),customPlan:()=>null,customAddons:()=>null,customDeload:()=>true,
  cfPrefs:()=>null,strUdstyr:()=>null,strGen:()=>null,fw:()=>null,seGen:()=>null,theme:()=>'auto',accent:()=>'orange',goals:()=>[],fwT:()=>60,
  block:()=>null,days:()=>({}),planSess:()=>({}),adapt:()=>({handled:{},since:TODAY,hist:[]}),vdots:()=>[],shifts:()=>[],
  name:()=>'',onboarded:()=>false,tipSeen:()=>false,tourSeen:()=>false,needCycle:()=>undefined};
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
/* A field keeps its saved value only if it has the right shape; otherwise it gets its default */
function fitField(def,v){if(v===undefined)return def;if(Array.isArray(def))return Array.isArray(v)?v:def;if(isObj(def))return isObj(v)?v:def;
  if(def===null||def===undefined)return v;return typeof v===typeof def?v:def}
function normalize(d){if(!isObj(d))throw new Error('Gemte data har forkert form');const st={};
  for(const [k,f] of Object.entries(FIELDS))st[k]=fitField(f(),d[k]);
  st.plan={...DEFAULT_PLAN,...st.plan};st.logs=st.logs.filter(isObj);
  const v=d.v||1;
  if(v<3){ // before versions: the app's early program migrations and first-run flags
    st.program=d.program;if(st.program==='blueprint'&&!st.cycleStart)st.needCycle=true;
    if(st.program==='blueprint'&&st.plan[2]==='I4'&&st.plan[0]==='Z2L')st.plan[2]='I5';
    /* v9: move 30/15 to Friday and Styrke C to Saturday, so intervals never follow a heavy leg day */
    if(st.program==='blueprint'&&st.plan[5]==='C'&&st.plan[6]==='I30B'){st.plan[5]='I30B';st.plan[6]='C';if(st.addons[5]==='MOB'){delete st.addons[5];st.addons[6]='MOB'}}
    if(!st.program){const untouched=Object.keys(DEFAULT_PLAN).every(k=>st.plan[k]===DEFAULT_PLAN[k]);if(untouched)st.plan={...BP_PLAN};st.addons={...BP_ADDONS}}
    /* v20: one program only — your own week. Existing data counts as already set up. */
    if(st.program!=='custom'&&!d.customPlan)st.customDeload=d.customDeload??true;
    ['plan','customPlan'].forEach(f=>{if(st[f])for(const d in st[f])if(['A','B','C'].includes(st[f][d]))st[f][d]='S'});
    st.program='custom';st.onboarded=d.onboarded!==false;st.tipSeen=d.tipSeen!=null?d.tipSeen:d.onboarded!==false;st.tourSeen=d.tourSeen!=null?d.tourSeen:d.onboarded!==false;st.name=d.name!=null?d.name:'Mikkel';
  }
  if(v<4)upgradeDays(st,d);
  st.program='custom';st.v=SCHEMA;return st}
/* v4: the calendar used to be spread over eight maps (overrides, blockDays, extras, skips, cfDays, planFw …).
   Now every date has one entry, and a CrossFit pas or full training lives inside its session. */
function upgradeDays(st,d){const days={},o=x=>isObj(x)?x:{},put=(dt,k,v)=>{(days[dt]=days[dt]||{})[k]=v};
  const ps={...st.planSess},cf=o(d.cfDays),fw=o(d.planFw);
  Object.entries(ps).forEach(([k,x])=>{if(!isObj(x)||!x.fw)return;const id=x.fwId||(k[0]==='F'?k.slice(1,5)+'-'+k.slice(5,7)+'-'+k.slice(7,9):null);if(id&&fw[id])ps[k]={...x,w:fw[id]};delete ps[k].fwId});
  Object.entries(o(d.blockDays)).forEach(([dt,k])=>put(dt,'p',k));
  Object.entries(o(d.overrides)).forEach(([dt,k])=>put(dt,'m',k));
  Object.entries(o(d.extras)).forEach(([dt,l])=>{if(Array.isArray(l)&&l.length)put(dt,'x',l.slice())});
  Object.entries(o(d.skips)).forEach(([dt,v])=>{if(v)put(dt,'skip',1)});
  Object.entries(cf).forEach(([dt,c])=>{const e=days[dt]||{},on=e.m==='CF'||!e.m&&e.p==='CF'||!e.m&&!e.p&&st.plan[pd(dt).getDay()]==='CF';if(!on||!isObj(c))return;
    const k='C'+dt.replace(/-/g,'');ps[k]={name:c.title||'CrossFit',kind:'crossfit',cf:c,min:c.min,dur:(c.min||20)+' min'};put(dt,'m',k)});
  st.days=days;st.planSess=ps}
/* If saved data can't be read, nothing is overwritten: a copy is kept and saving stops until you choose what to do */
let dataBroken=null,freshStart=false;
function load(){let raw=null;try{raw=localStorage.getItem(KEY)}catch(e){}
  const fresh={...Object.fromEntries(Object.entries(FIELDS).map(([k,f])=>[k,f()])),plan:{0:'R',1:'R',2:'R',3:'R',4:'R',5:'R',6:'R'},v:SCHEMA};
  if(!raw){freshStart=true;return fresh}
  try{return normalize(JSON.parse(raw))}catch(e){dataBroken={raw,err:String(e&&e.message||e)};try{localStorage.setItem(KEY+'.kopi',raw)}catch(_){}return fresh}}
function save(){if(dataBroken)return;try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true}catch(e){storageOK=false}snapSoon()}
/* ---------- Keeping your data safe ----------
   1. Ask the browser never to clear the app's storage by itself (it may when the phone is low on space).
   2. Automatic copies in a second store (IndexedDB): one per day, the last 5 days. Used if the main copy is damaged or gone.
   3. Backups as a file you send to Drive, mail or Files (see shareBackup). */
let persisted=null;
function askPersist(){try{const S=navigator.storage;if(!S||!S.persist)return;S.persisted().then(p=>p||S.persist()).then(p=>{persisted=!!p}).catch(()=>{})}catch(e){}}
const SNAP_N=5;
function snapDb(){return new Promise((res,rej)=>{try{const r=indexedDB.open('styrke-vo2-kopier',1);r.onupgradeneeded=()=>r.result.createObjectStore('snaps');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
const idbReq=q=>new Promise(r=>{q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)});
async function snapPut(){if(dataBroken||!state.onboarded||!state.logs.length)return;
  try{const db=await snapDb(),tx=db.transaction('snaps','readwrite'),st=tx.objectStore('snaps');st.put({date:TODAY,t:Date.now(),n:state.logs.length,data:JSON.stringify(state)},TODAY);
    const keys=(await idbReq(st.getAllKeys()))||[];keys.sort().slice(0,Math.max(0,keys.length-SNAP_N)).forEach(k=>st.delete(k));
    await new Promise(r=>{tx.oncomplete=r;tx.onerror=r;tx.onabort=r});db.close()}catch(e){}}
async function snapList(){try{const db=await snapDb(),all=(await idbReq(db.transaction('snaps').objectStore('snaps').getAll()))||[];db.close();return all.sort((a,b)=>b.t-a.t)}catch(e){return []}}
let snapT=null;function snapSoon(){clearTimeout(snapT);snapT=setTimeout(snapPut,1500)}
/* Put a saved copy back. Goes through normalize(), like any other saved data. */
function restoreFrom(text){const d=JSON.parse(text);state={...normalize(d),onboarded:true};dataBroken=null;applySess();save()}
let state=load();
/* Your own sessions and edits to built-in ones live in state; SESS is rebuilt from the built-ins plus these */
const SESS_BASE=JSON.parse(JSON.stringify(SESS));
function applySess(){Object.keys(SESS).forEach(k=>{if(!SESS_BASE[k])delete SESS[k]});
  for(const k in SESS_BASE)SESS[k]=JSON.parse(JSON.stringify(SESS_BASE[k]));
  for(const [k,e] of Object.entries(state.sessEdits||{}))if(SESS[k])Object.assign(SESS[k],e);
  for(const [k,c] of Object.entries(state.customSess||{}))SESS[k]={...c,custom:true};
  for(const [k,c] of Object.entries(state.planSess||{}))SESS[k]={...c,plan:true}}
applySess();
/* Theme and accent colour chosen in settings */
const ACCENTS={orange:['Orange','#FF7A2E','#FFA766'],blaa:['Blå','#3B82F6','#7FB0FF'],groen:['Grøn','#10B981','#5EE0B5'],lilla:['Lilla','#8B5CF6','#B9A0FF'],pink:['Pink','#EC4899','#F7A1CC'],roed:['Rød','#EF4444','#FF8A8A']};
function applyLook(){const r=document.documentElement;if(state.theme==='dark'||state.theme==='light')r.dataset.theme=state.theme;else delete r.dataset.theme;
  const a=ACCENTS[state.accent];if(a&&state.accent!=='orange'){r.style.setProperty('--accent',a[1]);r.style.setProperty('--accent-2',a[2])}else{r.style.removeProperty('--accent');r.style.removeProperty('--accent-2')}
  const dark=state.theme==='dark'||(state.theme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.querySelectorAll('meta[name=theme-color]').forEach(m=>m.setAttribute('content',dark?'#0F1012':'#ECEDEF'))}
applyLook();
const customKeys=kind=>Object.keys(state.customSess||{}).filter(k=>state.customSess[k].kind===kind);

