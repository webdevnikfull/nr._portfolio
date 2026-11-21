/* Native disclosure, grapheme-safe typing, and automatic opening, scroll dismissal, and dragging in either state. */
(() => {
 'use strict';
 const root=document.documentElement,fold=document.querySelector('.portrait-welcome'),visual=document.querySelector('.hero-visual'),photo=document.querySelector('.portrait-image-wrap');
 if(!fold||!visual||!photo)return;
 const summary=fold.querySelector('summary'),full=fold.querySelector('.welcome-full'),typed=fold.querySelector('.welcome-typed'),media=matchMedia('(prefers-reduced-motion: reduce)');
 const title=fold.querySelector('.welcome-title');
 const lead=document.createElement('span');lead.className='welcome-lead';lead.textContent='🙂';lead.setAttribute('aria-hidden','true');fold.querySelector('.welcome-message').prepend(lead);
 // One closed outline includes both the rounded body and the mouth-facing tail.
 const ns='http://www.w3.org/2000/svg',outline=document.createElementNS(ns,'svg'),edge=document.createElementNS(ns,'path');
 outline.setAttribute('class','welcome-outline');outline.setAttribute('aria-hidden','true');outline.setAttribute('focusable','false');outline.append(edge);summary.prepend(outline);
 function drawOutline(){
  const rect=fold.getBoundingClientRect(),tail=fold.open?10:0,width=Math.max(40,rect.width)+tail,height=Math.max(36,rect.height),left=tail+.75,right=width-.75,top=.75,bottom=height-.75,r=Math.min(18,(height-1.5)/2-6);
  const middle=height/2,upper=middle-5,lower=middle+5;
  let d=`M ${left+r} ${top} H ${right-r} Q ${right} ${top} ${right} ${top+r} V ${bottom-r} Q ${right} ${bottom} ${right-r} ${bottom} H ${left+r} Q ${left} ${bottom} ${left} ${bottom-r}`;
  if(fold.open)d+=` V ${lower} Q ${left-4} ${middle+2} .75 ${middle} Q ${left-4} ${middle-2} ${left} ${upper}`;
  d+=` V ${top+r} Q ${left} ${top} ${left+r} ${top} Z`;
  outline.setAttribute('viewBox',`0 0 ${width} ${height}`);outline.style.height=height+'px';edge.setAttribute('d',d);
 }

 const probe=document.createElement('span');probe.className='welcome-measure';probe.setAttribute('aria-hidden','true');summary.append(probe);
 let glyphs=[];
 function prepareText(){typed.replaceChildren();glyphs=[];let word=null;for(let i=0;i<letters.length;i++){const letter=letters[i],span=document.createElement('span');span.className=letter==='🙂'?'welcome-emoji':'welcome-letter';span.textContent=letter;if(/\s/.test(letter)){if(word&&letters[i+1]==='🙂')word.append(span);else{typed.append(span);word=null;}}else{if(!word){word=document.createElement('span');word.className='welcome-word';typed.append(word);}word.append(span);}glyphs.push(span);}}
 function render(){glyphs.forEach(span=>span.classList.add('is-visible'));schedule();}
 const message=full.textContent.replace(/\s*🙂\s*$/u,'').trim();full.textContent=message;const letters=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(root.lang,{granularity:'grapheme'}).segment(message)].map(x=>x.segment):Array.from(message);
 let timer=0,completionTimer=0,frame=0,drag=null,detached=false,suppressClick=false,destroyed=false,position={x:0,y:0},visible=true,autoOpened=false,autoCycle=false,lastScroll=window.scrollY||0,fontsReady=!document.fonts||document.fonts.status==='loaded';const listeners=[];
 function listen(target,type,fn,options){target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));}
 function stop(complete=false){clearTimeout(timer);clearTimeout(completionTimer);timer=0;completionTimer=0;fold.classList.remove('is-welcome-typing','is-welcome-finishing');if(complete)render();}
 function finishTyping(){
  stop();fold.classList.add('is-welcome-finishing');
  // Let the final letter finish its 220ms fade before the automatic fold.
  completionTimer=setTimeout(()=>{
   completionTimer=0;fold.classList.remove('is-welcome-finishing');
   if(destroyed||fold.hidden||!fold.open||document.hidden)return;
   const automatic=autoCycle;autoCycle=false;
   if(automatic){fold.open=false;schedule();}
   window.dispatchEvent(new CustomEvent('portfoliowelcomefinished',{detail:{automatic}}));
  },280);
 }
 function type(){stop();if(!fontsReady)return;glyphs.forEach(span=>span.classList.remove('is-visible'));schedule();if(media.matches||document.hidden||!letters.length){render();finishTyping();return;}let i=0;fold.classList.add('is-welcome-typing');function next(){timer=0;if(!fold.open||fold.hidden||destroyed)return;glyphs[i++].classList.add('is-visible');if(i<letters.length)timer=setTimeout(next,/[,.!?]/.test(letters[i-1])?130:52);else finishTyping();}timer=setTimeout(next,180);}

 function layout(){frame=0;if(destroyed)return;
  const v=visual.getBoundingClientRect(),p=photo.getBoundingClientRect();
  const mouth=p.left-v.left+p.width*.78+10;
  const safeLeft=fold.open?v.left+mouth:p.left+8;
  const viewport=Math.min(window.innerWidth,root.clientWidth||window.innerWidth);
  const right=fold.open?viewport-12:Math.min(p.right-8,viewport-12);
  const cap=Math.min(300,Math.max(40,right-safeLeft));
  // Reserve the final text width throughout typing to prevent repeated reflow.
  probe.textContent=fold.open?message:title.textContent;
  const desired=probe.getBoundingClientRect().width+(fold.open?(window.innerWidth<=600?44:48):(window.innerWidth<=600?24:28));
  const width=Math.min(cap,Math.max(64,Math.ceil(desired)));
  fold.style.setProperty('--welcome-size',width+'px');fold.style.setProperty('--welcome-width',cap+'px');
  fold.style.height='auto';
  const height=Math.max(42,Math.ceil(summary.getBoundingClientRect().height));
  fold.style.height=height+'px';drawOutline();
  if(detached){const r=fold.getBoundingClientRect();
   position.x=Math.max(safeLeft,Math.min(position.x,right-width));
   position.y=Math.max(p.top,Math.min(position.y,p.top+Math.max(0,p.height-r.height)));
   fold.style.setProperty('--welcome-left',(position.x-v.left)+'px');fold.style.setProperty('--welcome-top',(position.y-v.top)+'px');if(fontsReady)fold.classList.add('is-welcome-ready');return;}
  // Preserve the mouth anchor where space permits; clamp the one-line message within a small screen.
  const anchor=fold.open?mouth:right-v.left-width;
  const x=anchor,y=p.top-v.top+p.height*.72-height/2;
  fold.style.setProperty('--welcome-left',x.toFixed(1)+'px');fold.style.setProperty('--welcome-top',y.toFixed(1)+'px');if(fontsReady)fold.classList.add('is-welcome-ready');
 }

 function schedule(){if(!frame&&!destroyed)frame=requestAnimationFrame(layout);}
 function release(){if(!drag)return;const {id,handle}=drag;drag=null;fold.classList.remove('is-welcome-dragging');if(handle.hasPointerCapture?.(id))handle.releasePointerCapture(id);}
 function autoShow(){if(fontsReady&&!autoOpened&&visible&&!fold.hidden&&!document.hidden){autoOpened=true;autoCycle=true;fold.open=true;type();}}
 function modes(){const off=root.dataset.cloud==='on'||root.dataset.electric==='on'||root.dataset.stars==='on';if(off){release();stop();fold.open=false;}fold.hidden=off;if(!off){schedule();autoShow();}}
 listen(fold,'toggle',()=>{if(fold.open){if(fold.hidden){fold.open=false;return;}release();if(!timer&&!completionTimer){autoCycle=false;type();}}else{stop();autoCycle=false;}schedule();});
 listen(fold,'pointerdown',e=>{suppressClick=false;if(fold.hidden||e.isPrimary===false||(e.button!==undefined&&e.button!==0))return;autoCycle=false;const r=fold.getBoundingClientRect(),handle=e.target.closest?.('summary')||fold;drag={id:e.pointerId,handle,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};handle.setPointerCapture?.(e.pointerId);});
 listen(fold,'pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<6)return;drag.moved=true;detached=true;fold.classList.add('is-welcome-detached','is-welcome-dragging');position={x:drag.left+dx,y:drag.top+dy};schedule();});
 listen(fold,'pointerup',e=>{if(drag?.id!==e.pointerId)return;suppressClick=drag.moved;release();});
 listen(fold,'pointercancel',()=>{suppressClick=false;release();});listen(fold,'lostpointercapture',release);
 listen(fold,'click',e=>{if(suppressClick){e.preventDefault();suppressClick=false;}});
 listen(summary,'keydown',e=>{suppressClick=false;if(!e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const r=fold.getBoundingClientRect(),step=e.shiftKey?30:10;position={x:r.left+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),y:r.top+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)};detached=true;fold.classList.add('is-welcome-detached');schedule();});
 listen(window,'scroll',()=>{const y=window.scrollY||0;if(detached)position.y-=y-lastScroll;if(Math.abs(y-lastScroll)>=2&&fold.open&&!timer&&!completionTimer){fold.open=false;stop();schedule();}lastScroll=y;},{passive:true});
 listen(window,'resize',schedule,{passive:true});listen(window,'portfolioelectricchange',modes);listen(window,'portfoliocloudchange',modes);listen(window,'portfoliostarschange',modes);
 listen(media,'change',()=>{if(fold.open){stop(true);finishTyping();}});
 listen(document,'visibilitychange',()=>{if(document.hidden){release();stop(true);if(frame)cancelAnimationFrame(frame);frame=0;}else{schedule();if(autoCycle&&fold.open)finishTyping();else autoShow();}});
 listen(window,'portfolioportraitvisibilitychange',event=>{if(!event.detail.visible){release();stop(true);fold.open=false;autoCycle=false;}schedule();});
 listen(window,'pageshow',modes);
 const visibility='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===photo){visible=entry.isIntersecting;autoShow();}}},{threshold:.2}):null;visibility?.observe(photo);if(!visibility)visible=true;
 const observer='ResizeObserver' in window?new ResizeObserver(schedule):null;observer?.observe(visual);observer?.observe(photo);observer?.observe(fold);observer?.observe(summary);
 listen(window,'pagehide',e=>{release();stop();if(frame)cancelAnimationFrame(frame);frame=0;if(!e.persisted){destroyed=true;observer?.disconnect();visibility?.disconnect();listeners.splice(0).forEach(off=>off());}});
 prepareText();fold.classList.add('has-typewriter');typed.hidden=false;modes();document.fonts?.ready.then(()=>{fontsReady=true;schedule();autoShow();});
})();
