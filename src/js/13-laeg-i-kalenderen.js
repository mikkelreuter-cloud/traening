/* Læg et pas i kalenderen: enkelte dage eller samme ugedag i x uger. */
/* ---------- Put a built session on days in the calendar: single days or the same weekday for x weeks ---------- */
function schName(c){return c.src==='key'?(SESS[c.key]||{}).name||'Pas':c.src==='cf'?(c.cf.title||'CrossFit'):'Fuld træning · '+fwL(c.fw.b.lift)[1]}
function schDates(c){if(c.mode==='days')return c.dates.slice().sort();
  const m0=pd(mondayOf(TODAY)),off=c.start==='next'?7:0,out=[];
  for(let w=0;w<c.weeks;w++)c.dows.forEach(dw=>{const j=(dw+6)%7,d=ds(new Date(m0.getFullYear(),m0.getMonth(),m0.getDate()+off+w*7+j));if(d>=TODAY)out.push(d)});return out.sort()}
function viewSched(){const c=ui.sched;if(!c){ui.view='train';return viewTrain()}
  const dates=schDates(c),busy=dates.filter(d=>sessKey(d)!=='R').length;
  let body;
  if(c.mode==='days'){const [y,m]=c.month.split('-').map(Number),first=new Date(y,m-1,1),lead=(first.getDay()+6)%7,nd=new Date(y,m,0).getDate(),thisM=TODAY.slice(0,7);
    const cells=[...Array(lead).fill('<span></span>'),...Array.from({length:nd},(_,i)=>{const d=ds(new Date(y,m-1,i+1)),past=d<TODAY,on=c.dates.includes(d),k=past?'R':sessKey(d),kind=k!=='R'&&SESS[k]?SESS[k].kind:'';
      return `<button class="sc-d${on?' on':''}${d===TODAY?' today':''}" data-act="schday" data-d="${d}"${past?' disabled':''}>${i+1}${kind?`<i class="k-${kind}"></i>`:''}</button>`})];
    body=`<section class="card"><div class="row-between"><button class="icon-btn" data-act="schmon" data-v="-1"${c.month<=thisM?' disabled':''} aria-label="Forrige måned">‹</button><b>${cap(MONTHS[m-1])} ${y}</b><button class="icon-btn" data-act="schmon" data-v="1" aria-label="Næste måned">›</button></div>
      <div class="sc-grid">${['M','T','O','T','F','L','S'].map(x=>`<span class="sc-h">${x}</span>`).join('')}${cells.join('')}</div><p class="hint">Tryk på de dage, pas skal ligge. Prik = der ligger allerede træning.</p></section>`}
  else body=`<section class="card"><div class="field"><span>Hvilke dage</span><div class="chips">${PL_DOW.map(d=>`<button class="${c.dows.includes(d)?'on':''}" data-act="schdow" data-v="${d}">${PL_SHORT[d]}</button>`).join('')}</div></div>
    <div class="field"><span>Hvor mange uger</span><div class="chips">${[1,2,3,4,6,8,10,12].map(n=>`<button class="${c.weeks===n?'on':''}" data-act="schwk" data-v="${n}">${n}</button>`).join('')}</div></div>
    <div class="field"><span>Start</span><div class="chips">${[['this','Denne uge'],['next','Næste uge']].map(([k,l])=>`<button class="${c.start===k?'on':''}" data-act="schst" data-v="${k}">${l}</button>`).join('')}</div></div></section>`;
  return `<div class="habit-head"><button class="icon-btn" data-act="schback" aria-label="Tilbage" data-back>‹</button><div><p class="eyebrow">Læg i kalenderen</p><h2 class="h2">${esc(schName(c))}</h2></div></div>
  <div class="seg">${[['days','Enkelte dage'],['weekly','Hver uge']].map(([k,l])=>`<button class="${c.mode===k?'on':''}" data-act="schmode" data-v="${k}">${l}</button>`).join('')}</div>
  ${body}
  ${dates.length?`<p class="hint center">${dates.length} ${dates.length===1?'dag':'dage'}${dates.length>1?` · ${niceDate(dates[0])} til ${niceDate(dates[dates.length-1])}`:` · ${niceDate(dates[0])}`}</p>`:''}
  ${busy?`<section class="card"><p class="small">${dates.length===1?'Der ligger allerede træning på dagen.':`${busy} af dagene har allerede træning.`}</p>
    <div class="seg" style="margin:0">${[['add','Læg oveni'],['replace','Erstat']].map(([k,l])=>`<button class="${c.how===k?'on':''}" data-act="schhow" data-v="${k}">${l}</button>`).join('')}</div>
    <p class="hint">${c.how==='add'?'Begge pas ligger på dagen.':'Det, der lå der, bliver erstattet.'}</p></section>`:''}
  <button class="btn accent" data-act="schgo"${dates.length?'':' disabled'}>${dates.length?`Læg ind på ${dates.length} ${dates.length===1?'dag':'dage'}`:'Vælg dage'}</button>`}
function schApply(c){const dates=schDates(c),cp=x=>JSON.parse(JSON.stringify(x));
  const sessFor_=d=>c.src==='key'?c.key:c.src==='cf'?(k=>(putSess(k,{name:schName(c),kind:'crossfit',cf:cp(c.cf),min:c.cf.min,dur:(c.cf.min||20)+' min'}),k))(newKey('C',d))
    :(k=>(putSess(k,{name:schName(c),kind:'crossfit',fw:true,w:cp(c.fw),dur:c.fw.T+' min'}),k))(newKey('F',d));
  dates.forEach(d=>{const k=sessFor_(d);if(c.how==='add'&&sessKey(d)!=='R')addExtra(d,k);else setManual(d,k)});
  applySess();save();return dates.length}
