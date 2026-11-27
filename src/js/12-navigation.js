/* Faneskift med glidende animation og fanen Pas. */
/* ---------- Tab changes: the page slides sideways and the coloured pill slides to the new tab ---------- */
const TAB_ORDER=['today','train','month','prog'];
let tabIndReady=false;
function moveTabInd(){const ind=document.querySelector('.tab-ind'),on=document.querySelector('.tab.on');if(!ind)return;
  if(!on){ind.style.opacity='0';return}
  if(!tabIndReady){ind.style.transition='none'}
  ind.style.width=on.offsetWidth+'px';ind.style.transform=`translateX(${on.offsetLeft}px)`;ind.style.opacity='1';
  if(!tabIndReady){ind.offsetWidth;ind.style.transition='';tabIndReady=true}}
addEventListener('resize',()=>{tabIndReady=false;moveTabInd()});
function tabOf(v){const t=document.querySelector('.tab.on');return t?t.dataset.view:v}
function slideTo(to){const from=tabOf(ui.view),a=TAB_ORDER.indexOf(from),b=TAB_ORDER.indexOf(to);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(a<0||b<0||a===b||reduce||!document.body.animate){ui.view=to;render(true);return}
  slideAnim(b>a?1:-1,()=>{ui.view=to;render(true)})}
/* Slide the page sideways: the old content leaves, fn() renders the new content, which comes in from the other side */
function slideAnim(dir,fn){if(matchMedia('(prefers-reduced-motion: reduce)').matches||!document.body.animate){fn();return}
  const m=$('#main'),r=m.getBoundingClientRect(),ghost=m.cloneNode(true);
  ghost.removeAttribute('id');ghost.className=m.className;ghost.setAttribute('aria-hidden','true');
  const cs=getComputedStyle(m);Object.assign(ghost.style,{position:'fixed',top:r.top+'px',left:r.left+'px',width:r.width+'px',height:r.height+'px',margin:'0',display:cs.display,flexDirection:cs.flexDirection,gap:cs.gap,justifyContent:cs.justifyContent,paddingTop:cs.paddingTop,pointerEvents:'none',zIndex:'0'});
  document.body.appendChild(ghost);
  fn();
  const ease='cubic-bezier(.2,.8,.2,1)',d=340;
  ghost.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-dir*45}%)`,opacity:0}],{duration:d,easing:ease}).onfinish=()=>ghost.remove();
  const nm=$('#main');nm.style.position='relative';nm.style.zIndex='1';
  nm.animate([{transform:`translateX(${dir*45}%)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:d,easing:ease}).onfinish=()=>{nm.style.position='';nm.style.zIndex=''}}
/* Swipe left/right on a main tab to go to the neighbour tab. Touches near the screen edge are left to the phone's back gesture. */
(()=>{let sx=0,sy=0,st=0,ok=false;
  addEventListener('touchstart',e=>{const t=e.touches[0];ok=e.touches.length===1&&TAB_ORDER.includes(ui.view)&&t.clientX>28&&t.clientX<innerWidth-28
      &&!e.target.closest('input,textarea,select,.tour,.sheet-bg,.tour-track,canvas,svg.chart,.chart');
    sx=t.clientX;sy=t.clientY;st=Date.now()},{passive:true});
  addEventListener('touchend',e=>{if(!ok)return;ok=false;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.6||Date.now()-st>700)return;
    const i=TAB_ORDER.indexOf(ui.view),j=i+(dx<0?1:-1);if(j<0||j>=TAB_ORDER.length)return;slideTo(TAB_ORDER[j])},{passive:true});
})();
const setBtn=()=>'<button class="icon-btn" data-act="settings" aria-label="Plan og data"><svg viewBox="0 0 24 24"><path d="M4 7h9M18 7h2M4 17h4M13 17h7"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="10.5" cy="17" r="2.3"/></svg></button>';
/* Before a fold-out opens or closes: pin the content where it is now, so only what is below moves */
function freezeTop(){const m=$('#main'),f=m.firstElementChild;if(f&&document.body.classList.contains('no-top'))ui.freeze={v:ui.view,px:Math.max(0,f.getBoundingClientRect().top-m.getBoundingClientRect().top)}}
function viewTrain(){
  const cfToday=cfSaved(TODAY);
  return `<button class="btn accent" data-act="senew">+ Opret pas</button>
  <div class="tr-list">${trainGroups().map(([g,kind,ks])=>{const open=trOpen().has(g),tk=sessKey(TODAY),today=ks.includes(tk)||(g==='CrossFit'&&tk==='CF');
    const extra=g==='CrossFit'?`<button class="tr-row k-crossfit${tk==='CF'?' today':''}" data-act="cfopen" data-date="${TODAY}"><span class="bar"></span><span class="nm">Byg en WOD${cfToday?` · ${esc(cfToday.title||'')}`:''}</span>${tk==='CF'?'<span class="tag">I dag</span>':''}<span class="chev">›</span></button>
      <button class="tr-row k-crossfit" data-act="fwopen"><span class="bar"></span><span class="nm">Fuld træning</span><span class="tag muted-tag">A · B · C · D</span><span class="chev">›</span></button>`:'';
    const n=ks.length+(g==='CrossFit'?2:0);
    return `<section class="tr-grp${open?' open':''}"><button class="tr-head k-${kind}" data-act="trgrp" data-g="${esc(g)}" aria-expanded="${open}"><span class="bar"></span><span class="nm">${g}</span>${today?'<span class="tag">I dag</span>':''}<span class="cnt">${n} pas</span><span class="chev">›</span></button>${open?`<div class="tr-items">${extra}${ks.map(trainRow).join('')}</div>`:''}</section>`}).join('')}</div>`;
}
