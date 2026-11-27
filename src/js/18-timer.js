/* Lyd og intervaltimer. */
/* ---------- sound ---------- */
let actx;
function beep(freq=880,dur=.15,vol=.3){
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();
    const o=actx.createOscillator(),g=actx.createGain(),t=actx.currentTime;o.type='square';o.frequency.value=freq;o.connect(g);g.connect(actx.destination);
    g.gain.setValueAtTime(vol*.4,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.start(t);o.stop(t+dur+.02)}catch(e){}
}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}

/* ---------- interval timer ---------- */
function buildPhases(key){
  const P=[],add=(label,sec,type)=>P.push({label,sec,type});
  if(key==='I4'||key==='I5'){const n=key==='I5'?5:4;add('Opvarmning',600,'easy');for(let i=1;i<=n;i++){add(`Interval ${i} af ${n} · hårdt`,240,'work');if(i<n)add('Aktiv pause',180,'rest')}add('Nedvarmning',300,'easy')}
  else if(key==='I30'){add('Opvarmning',600,'easy');for(let s=1;s<=3;s++){for(let r=1;r<=10;r++){add(`Serie ${s} · ${r}/10 · hårdt`,30,'work');if(r<10)add(`Serie ${s} · ${r}/10 · let`,15,'rest')}if(s<3)add('Seriepause',180,'rest')}add('Nedvarmning',300,'easy')}
  else if(key==='I30B'){add('Opvarmning',600,'easy');for(let s=1;s<=4;s++){for(let r=1;r<=10;r++){add(`Serie ${s} · ${r}/10 · hårdt`,30,'work');if(r<10)add(`Serie ${s} · ${r}/10 · let`,15,'rest')}if(s<4)add('Seriepause',180,'rest')}add('Nedvarmning',300,'easy')}
  else if(SESS[key]&&SESS[key].phases)SESS[key].phases.forEach(p=>add(p[0],p[1],p[2]));
  else if(SESS[key]&&(SESS[key].custom||SESS[key].plan)){const S=SESS[key];add(S.name,Math.max(60,(S.min||30)*60),S.kind==='interval'?'work':'easy')}
  else add('Zone 2 · roligt tempo',key==='Z2L'?3600:2700,'easy');
  return P;
}
let timer=null,loop=null,wake=null,lastBeep=-1;
const remain=()=>!timer?0:Math.max(0,(timer.paused?timer.left:timer.end-Date.now())/1000);
function keepAwake(){try{if('wakeLock' in navigator&&!wake)navigator.wakeLock.request('screen').then(w=>{wake=w;w.addEventListener('release',()=>{wake=null})}).catch(()=>{})}catch(e){}}
function releaseAwake(){try{wake&&wake.release()}catch(e){}wake=null}
function ensureLoop(){if(!loop)loop=setInterval(tick,200)}
function phaseSignal(type){if(type==='work'){beep(1046,.18);setTimeout(()=>beep(1046,.18),260);buzz([200,100,200])}else{beep(523,.45);buzz(400)}}
function startTimer(key){
  beep(660,.05,.05);
  timer={key,phases:buildPhases(key),idx:0,paused:false,left:0,end:0,stopArmed:false};
  timer.end=Date.now()+timer.phases[0].sec*1000;lastBeep=-1;ui.view='timer';keepAwake();ensureLoop();render(true);
}
function advance(skip){
  const T=timer,over=skip?0:Math.max(0,Date.now()-T.end);T.idx++;lastBeep=-1;
  if(T.idx>=T.phases.length){finishTimer(true);return}
  const ms=T.phases[T.idx].sec*1000;
  if(T.paused)T.left=ms;else T.end=Date.now()-over+ms;
  if(over<2000)phaseSignal(T.phases[T.idx].type);
  if(ui.view==='timer')render();
}
function finishTimer(completed){
  const T=timer;let tot=T.phases.slice(0,Math.min(T.idx,T.phases.length)).reduce((a,p)=>a+p.sec,0);
  if(!completed&&T.idx<T.phases.length)tot+=T.phases[T.idx].sec-remain();tot=Math.round(tot);
  timer=null;releaseAwake();
  if(completed){beep(784,.15);setTimeout(()=>beep(988,.15),180);setTimeout(()=>beep(1175,.3),360);buzz([200,100,200,100,400])}
  const plannedSec=T.phases.reduce((a,p)=>a+p.sec,0);
  ui.k={...ui.k,sess:T.key,min:String(Math.floor(tot/60)),sek:String(tot%60),dist:'',hr:'',rpe:'',note:'',early:!completed&&tot<plannedSec*.8};
  ui.logType='kondition';ui.logDate=TODAY;ui.dirty=true;ui.view='log';render(true);
  toast(completed?'Færdig. Tilføj km, puls og hårdhed, og tryk Gem.':'Stoppet. Tjek tiden og tryk Gem.');
}
let ht=null;
/* The habit timer is an audio file: silence for the target time, then the alarm.
   Audio keeps playing with the screen locked, so the alarm rings on time and the lock screen shows progress. */
const ALARM_SEC=8;
function timerWav(sec,kind,pre){pre=pre||0;
  const SR=4000,n=Math.round((pre+sec+ALARM_SEC)*SR),buf=new ArrayBuffer(44+n),v=new DataView(buf),d=new Uint8Array(buf,44);
  const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,SR,true);v.setUint32(28,SR,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);
  const a0=Math.round((pre+sec)*SR),p0=Math.round(pre*SR);
  for(let i=0;i<a0;i++)d[i]=128+((Math.random()*3|0)-1);           /* near-silent bed keeps playback alive */
  if(pre>0)for(let i=p0;i<Math.min(a0,p0+SR*1.4);i++){const t=(i-p0)/SR,k=Math.floor(t/.45),u=t-k*.45;   /* switch-to-cold: three rising beeps */
    if(k<3&&u<.3)d[i]=Math.round(128+100*Math.sin(2*Math.PI*[660,880,1175][k]*t))}
  for(let i=a0;i<n;i++){const t=(i-a0)/SR;let x=0;
    if(kind==='meditation'){for(const st of [0,2.5,5]){const u=t-st;if(u>=0)x+=Math.exp(-u*1.6)*(Math.sin(2*Math.PI*528*u)+.4*Math.sin(2*Math.PI*1056*u))}x*=.55}
    else{const ph=t%1,on=(ph<.12)||(ph>.2&&ph<.32)||(ph>.4&&ph<.52);x=on?.8*Math.sin(2*Math.PI*(ph<.2?880:ph<.4?988:1175)*t):0}
    d[i]=Math.max(0,Math.min(255,Math.round(128+x*120)))}
  return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
}
const htT=()=>ht?(ht.audio.currentTime||0):0;
const htWarm=()=>!!ht&&ht.pre>0&&htT()<ht.pre;
const htRemain=()=>!ht?0:htWarm()?ht.pre-htT():Math.max(0,ht.total-(htT()-ht.pre));
const htFrac=()=>!ht?0:htWarm()?htT()/ht.pre:Math.min(1,(htT()-ht.pre)/ht.total);
function htMedia(){
  try{if(!('mediaSession' in navigator)||!ht)return;const h=findHabit(ht.h);
    navigator.mediaSession.metadata=new MediaMetadata({title:h.name,artist:ht.logged?'Færdig':htWarm()?'Varmt vand · skift til koldt ved bip':`Koldt · mål ${fmtTime(ht.total)}`,album:'Styrke & VO₂ Log',artwork:[{src:'icon-512.png',sizes:'512x512',type:'image/png'}]});
    navigator.mediaSession.playbackState=ht.audio.paused?'paused':'playing';
    const dur=ht.audio.duration;if(isFinite(dur)&&navigator.mediaSession.setPositionState)navigator.mediaSession.setPositionState({duration:dur,position:Math.min(dur,ht.audio.currentTime),playbackRate:1});
  }catch(e){}
}
function htLog(sec){if(!ht||ht.logged)return;ht.logged=true;state.logs.push({id:Date.now().toString(36),date:TODAY,type:ht.h,sec:Math.round(sec)});save();buzz([300,150,300,150,600]);htMedia()}
function coldPre(){const v=state.coldPre;return v==null?60:v}
function htPhaseCheck(){if(ht&&ht.warm&&!htWarm()){ht.warm=false;buzz([150,80,150,80,150]);htMedia();if(ui.view==='habit')render()}}
function htCleanup(){if(!ht)return;try{ht.audio.pause();URL.revokeObjectURL(ht.url)}catch(e){}ht=null;releaseAwake();try{navigator.mediaSession.metadata=null;navigator.mediaSession.playbackState='none'}catch(e){}}
function htStart(id){
  const h=findHabit(id),t=h.target(hw(h,TODAY)),pre=id==='kulde'?coldPre():0,url=timerWav(t,id,pre),audio=new Audio(url);
  ht={h:id,total:t,pre,audio,url,logged:false,warm:pre>0};
  audio.addEventListener('timeupdate',()=>{if(!ht)return;htPhaseCheck();if(!ht.logged&&audio.currentTime>=ht.pre+ht.total){htLog(ht.total);if(ui.view==='habit')render()}});
  audio.addEventListener('ended',()=>{const was=ht&&ht.logged;htCleanup();render();if(was)toast('Gemt · godt gået')});
  audio.addEventListener('play',htMedia);audio.addEventListener('pause',()=>{htMedia();if(ui.view==='habit')render()});
  try{const ms=navigator.mediaSession;ms.setActionHandler('play',()=>audio.play());ms.setActionHandler('pause',()=>audio.pause());ms.setActionHandler('stop',()=>htFinish(false))}catch(e){}
  audio.play().then(()=>{keepAwake();htMedia()}).catch(()=>toast('Lyd blev blokeret. Tryk Start igen.'));
  ensureLoop();render();
}
function htFinish(){if(!ht)return;
  if(ht.logged){htCleanup();render();return toast('Gemt')}
  const sec=Math.min(ht.total,Math.max(0,htT()-ht.pre));
  if(sec<5){htCleanup();render();return toast('For kort til at gemme')}
  htLog(sec);htCleanup();render();toast(`Gemt · ${fmtTime(sec)}`)}
function tick(){
  if(ht&&!ht.audio.paused){htPhaseCheck();if(!ht.logged&&htT()>=ht.pre+ht.total){htLog(ht.total);if(ui.view==='habit')render()}
    else if(ui.view==='habit'){const t=$('#ht-time'),p=$('#ht-prog');if(t)t.textContent=fmtTime(Math.ceil(htRemain()));if(p)p.setAttribute('stroke-dashoffset',(2*Math.PI*88*(1-htFrac())).toFixed(1))}
    if(Math.round(ht.audio.currentTime)%5===0)htMedia()}
  const now=Date.now();
  if(timer&&!timer.paused){
    if(now>=timer.end)advance(false);
    if(timer&&!timer.paused){const r=Math.ceil((timer.end-Date.now())/1000);if(r<=3&&r>=1&&r!==lastBeep){lastBeep=r;beep(880,.08)}}
  }
  if(timer&&ui.view==='timer'){const t=$('#tm-time'),p=$('#tm-prog'),ph=timer.phases[timer.idx];
    if(t)t.textContent=fmtTime(Math.ceil(remain()));if(p){const C=2*Math.PI*88;p.setAttribute('stroke-dashoffset',(C*remain()/ph.sec).toFixed(1))}}
  if(ui.rest){const left=Math.ceil((ui.rest.end-now)/1000),el=$('#rest-t');
    if(left<=0&&!ui.rest.done){ui.rest.done=true;beep(988,.2);setTimeout(()=>beep(988,.2),300);buzz([300,150,300])}
    if(el)el.textContent=left>0?`Pause ${fmtTime(left)}`:'Næste sæt!';
    if(left<=-10){ui.rest=null;$('#restbar').hidden=true}}
  if(!timer&&!ui.rest&&!ht){clearInterval(loop);loop=null}
}
function viewTimer(){
  const T=timer;if(!T){ui.view='today';return viewToday()}
  const ph=T.phases[T.idx],nx=T.phases[T.idx+1],s=SESS[T.key];
  const C=2*Math.PI*88,frac=1-remain()/ph.sec,PH={work:'Hårdt',rest:'Pause',easy:'Roligt'};
  return `<section class="timer ph-${ph.type}">
    <p class="eyebrow">${esc(s.name)} · fase ${T.idx+1} af ${T.phases.length}</p>
    <p class="tm-label">${esc(ph.label)}</p>
    <div class="tm-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="trk" cx="100" cy="100" r="88" fill="none" stroke-width="12"/>
      <circle class="prg" id="tm-prog" cx="100" cy="100" r="88" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-frac)).toFixed(1)}"/></svg>
      <div class="in"><p class="tm-time num" id="tm-time" aria-live="off">${fmtTime(Math.ceil(remain()))}</p><span class="tm-ph">${T.paused?'På pause':PH[ph.type]}</span></div></div>
    <p class="tm-next">${nx?`Næste: ${esc(nx.label)} · ${fmtTime(nx.sec)}`:'Sidste fase'}</p>
  </section>
  <div class="btns3"><button class="btn ${T.paused?'accent':'primary'}" data-act="tpause">${T.paused?'Fortsæt':'Pause'}</button><button class="btn ghost" data-act="tskip">Spring over</button><button class="btn danger${T.stopArmed?' armed':''}" data-act="tstop">${T.stopArmed?'Bekræft':'Stop'}</button></div>
  <p class="hint">${ph.type==='work'?`Hårdt, men jævnt. Ikke en sprint. Du kan sige 2–3 ord ad gangen.${state.hrmax?' Pulsen ender på '+hr(.9)+'–'+hr(.95)+'.':''}`:ph.type==='rest'?'Aktiv pause: jog eller træd let. Hold dig i gang.':`Roligt tempo${state.hrmax?', under '+hr(.7)+' bpm':''}. Du skal kunne tale i hele sætninger.`}</p>
  <p class="hint">Appen bipper 3-2-1 og ved hvert skift. Hold appen åben på skærmen.</p>`;
}

