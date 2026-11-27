/* Hjælpere: formatering, tid, og dine tal (beregnet max og kg ud fra %). */
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
let TODAY=ds(new Date());
const num=v=>{const n=parseFloat(String(v??'').replace(',','.'));return isFinite(n)?n:null};
const fnum=(n,dec=1)=>(Math.round(n*10**dec)/10**dec).toString().replace('.',',');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function parseTime(s){s=String(s??'').trim();if(!s)return null;const p=s.split(/[:.]/).map(x=>num(x));if(p.some(x=>x===null))return null;return p.reduce((a,b)=>a*60+b,0)}
function fmtTime(sec){sec=Math.round(sec);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?`${h}:${pad(m)}:${pad(s)}`:`${m}:${pad(s)}`}
const e1rm=(kg,reps)=>kg*(1+reps/30);
/* ---------- Your numbers. The plan never asks for a 1RM: it estimates your max from logged sets (weight, reps and reps in reserve),
   using the best sets of the last 4 weeks you trained the lift, so the number follows you both up and down. ---------- */
const LIFT_ALIAS={'back squat':'squat','front squat':'frontsquat','pause back squat (2 sek i bunden)':'pause squat','strict press':'militærpres'};
const liftKey=n=>{const k=String(n||'').trim().toLowerCase();return LIFT_ALIAS[k]||k};
function estMax(name){const k=liftKey(name),L=state.logs.filter(l=>l.type==='styrke'&&l.sets).sort(byDate);let last=null;
  for(let i=L.length-1;i>=0&&!last;i--)if(L[i].sets.some(x=>liftKey(x.ex)===k&&x.kg>0))last=L[i].date;if(!last)return null;
  const from=ds(new Date(pd(last).getTime()-27*864e5));let best=0;
  L.forEach(l=>{if(l.date<from||l.date>last)return;l.sets.forEach(x=>{if(liftKey(x.ex)!==k||!(x.kg>0)||x.reps<1||x.reps>12)return;const v=e1rm(x.kg,x.reps+(x.rir??1));if(v>best)best=v})});
  return best?{kg:best,date:last}:null}
const kgStep=n=>{const x=strFor(n);return x&&x[1]===EQ_KB?4:x&&x[1]===EQ_DB?2:2.5};
function kgFor(n,pct){const m=estMax(n);if(!m||!pct)return null;const st=kgStep(n);return Math.max(st,Math.round(m.kg*pct/100/st)*st)}
/* "5 × 3 @ 80 %" → "5 × 3 @ 92,5 kg" when the lift has been logged */
const withKg=(n,line)=>String(line).replace(/@ (\d+(?:[.,]\d+)?) ?%/,(m,p)=>{const k=kgFor(n,parseFloat(p.replace(',','.')));return k?`@ ${fnum(k)} kg`:m});
const niceDate=s=>{const d=pd(s);return `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`};
const shortDate=s=>{const d=pd(s);return `${d.getDate()}/${d.getMonth()+1}`};
const fmtVal=(v,u)=>u==='tid'?fmtTime(v):fnum(v,2)+' '+u;
const chip=(k,label)=>`<span class="chip k-${k}"><i></i>${label}</span>`;

