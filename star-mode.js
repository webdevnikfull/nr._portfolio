/* Optional, bounded star effects. No canvas loop or work while the mode is off. */
(() => {
 'use strict';
 const root=document.documentElement,cloud=document.getElementById('cloud-toggle'),electric=document.getElementById('electric-toggle');
 if(!cloud||document.getElementById('stars-toggle'))return;
 const copy={pl:['Gwiazdki','Włącz tryb gwiazdek','Wyłącz tryb gwiazdek','Rozświetl zdjęcie gwiazdkami'],en:['Stars','Enable star effects','Disable star effects','Light up the portrait with stars'],de:['Sterne','Sterne einschalten','Sterne ausschalten','Sterne im Porträt aufleuchten lassen'],uk:['Зірки','Увімкнути зоряні ефекти','Вимкнути зоряні ефекти','Засвітити зірки на портреті']}[root.lang]||['Stars','Enable star effects','Disable star effects','Light up the portrait with stars'];
 const wrap=document.createElement('div'),button=document.createElement('button'),caption=document.createElement('span');
 wrap.className='nav-tool-item';button.type='button';button.id='stars-toggle';button.className='icon-button stars-toggle';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m19 2 .8 2.2L22 5l-2.2.8L19 8l-.8-2.2L16 5l2.2-.8Z"/></svg>';
 caption.className='nav-tool-caption';caption.textContent=copy[0];caption.setAttribute('aria-hidden','true');wrap.append(button,caption);(cloud.closest('.nav-tool-item')||cloud).insertAdjacentElement('afterend',wrap);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),portrait=document.querySelector('.portrait-image-wrap');
 const saved=portrait?['role','tabindex','aria-label'].map(key=>[key,portrait.getAttribute(key)]):[];
 const sky=document.createElement('div');sky.className='star-scroll-layer';sky.setAttribute('aria-hidden','true');sky.hidden=true;document.body.append(sky);
 const ambient=document.createElement('div');ambient.className='star-ambient-layer';ambient.setAttribute('aria-hidden','true');ambient.hidden=true;document.body.append(ambient);
 const tints=['#b6d7ff','#a8c8ff','#d4e6ff','#83bbff','#b5dfff','#99cfff','#adccff','#ffe0b3','#d3edff','#9dbfff','#fff0d7','#e6edff'];
 for(let i=0;i<320;i++){const star=document.createElement('i');star.className=i%17===0?'ambient-star has-star-bloom':'ambient-star';star.style.left=((i%20+Math.random())/20*100)+'%';star.style.top=(((i*.61803398875+.04)%1)*100)+'%';star.style.setProperty('--star-tint',tints[i%tints.length]);star.style.setProperty('--ambient-size',(i%17===0?5+Math.random()*3:i%11===0?6+Math.random()*4:1+Math.random()*3)+'px');star.style.setProperty('--ambient-delay',(-Math.random()*30)+'s');star.style.setProperty('--ambient-time',(18+Math.random()*24)+'s');star.style.setProperty('--cosmos-dx',((Math.random()-.5)*100)+'px');star.style.setProperty('--cosmos-dy',(-25-Math.random()*70)+'px');ambient.append(star);}
 const cosmos=document.createElement('div');cosmos.className='cosmic-depth-layer';cosmos.setAttribute('aria-hidden','true');cosmos.hidden=true;document.body.append(cosmos);
 Array.from(ambient.children).forEach((star,i)=>{if(i%4!==0){star.style.setProperty('--cosmos-dx','0px');star.style.setProperty('--cosmos-dy','0px');}});
 for(let i=0;i<6;i++){const meteor=document.createElement('i');meteor.className='cosmic-shooting-star';meteor.style.left=(28+(i*37)%92)+'%';meteor.style.top=(-12+(i*19)%85)+'%';meteor.style.setProperty('--flight-cycle',(13+(i%5)*1.7)+'s');meteor.style.setProperty('--flight-delay',(-i*2.43)+'s');meteor.style.setProperty('--flight-length',(70+(i%4)*24)+'px');cosmos.append(meteor);}
 const field=document.createElement('span');field.className='portrait-starfield';field.setAttribute('aria-hidden','true');portrait?.append(field);
 const timers=new Set(),listeners=[];
 const pool=(parent,count)=>Array.from({length:count},()=>{const el=document.createElement('i');el.className='effect-star';parent.append(el);return {el,timer:0};});
 const scrollPool=pool(sky,128),portraitPool=pool(field,48),trailLayer=document.createElement('div'),surfaces=new Set();
 trailLayer.className='star-trail-layer';trailLayer.setAttribute('aria-hidden','true');trailLayer.hidden=true;document.body.append(trailLayer);const trailPool=pool(trailLayer,220);
 let enabled=false,lastScroll=window.scrollY||0,lastEmit=-Infinity,lastBurst=-Infinity,lastTrail=-Infinity,pointer=null,trailPoint=null,cursor=0,trailCursor=0,owned=false;
 const observe='IntersectionObserver'in window?new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-stars-visible',enabled&&entry.isIntersecting)),{rootMargin:'40px',threshold:0}):null;
 const targets='.portrait-frame,.skill-card,.experience-row,.project-card,.section-intro-action,.education-card,.education-list article,.certificate-entry,.certificate-provider-empty,.volunteer-card,.volunteer-item,.contact-section,.profile-clock';
 function decorate(){document.querySelectorAll(targets).forEach(card=>{if(surfaces.has(card))return;surfaces.add(card);card.classList.add('stars-surface');const glow=document.createElement('span');glow.className='card-star-glow';glow.setAttribute('aria-hidden','true');for(let i=0;i<6;i++){const star=document.createElement('i');star.style.setProperty('--twinkle-delay',(-i*.57)+'s');glow.append(star);}card.append(glow);if(observe)observe.observe(card);else card.classList.add('is-stars-visible');});}
 function stop(){[...scrollPool,...portraitPool,...trailPool].forEach(item=>{clearTimeout(item.timer);item.timer=0;item.animation?.cancel();item.animation=null;item.el.classList.remove('is-star-shining');});timers.forEach(clearTimeout);timers.clear();pointer=null;trailPoint=null;lastTrail=-Infinity;}
 function shine(item,x,y,size,dx,dy,duration,streak=false){clearTimeout(item.timer);item.animation?.cancel();item.animation=null;const el=item.el,turn=streak?0:Math.random()*70-35;el.classList.remove('is-star-shining');el.classList.toggle('is-star-streak',streak);el.style.left=x+'px';el.style.top=y+'px';el.style.setProperty('--star-tint',tints[Math.floor(Math.random()*tints.length)]);el.style.setProperty('--star-size',size+'px');el.style.setProperty('--star-dx',dx+'px');el.style.setProperty('--star-dy',dy+'px');el.style.setProperty('--star-time',duration+'ms');el.style.setProperty('--star-turn',turn+'deg');
  if(streak){el.style.setProperty('--streak-angle',(Math.atan2(dy,dx)*180/Math.PI)+'deg');el.style.setProperty('--streak-length',Math.min(86,Math.max(44,Math.hypot(dx,dy)*1.8+size*4))+'px');el.style.setProperty('--streak-width',Math.max(2,Math.min(4,size*.7))+'px');}
  const peak=streak ? .5 : .85;
  if(el.animate&&!reduced.matches){el.classList.add('is-star-native','is-star-shining');item.animation=el.animate([{opacity:0,transform:'translate(0,0) scale(.85) rotate(0deg)'},{opacity:peak,transform:`translate(${dx*.12}px,${dy*.12}px) scale(1) rotate(${turn*.12}deg)`,offset:.2},{opacity:peak*.65,transform:`translate(${dx*.5}px,${dy*.5}px) scale(.95) rotate(${turn*.5}deg)`,offset:.58},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.8) rotate(${turn}deg)`}],{duration,easing:streak?'linear':'ease-out',fill:'both'});}else{el.classList.remove('is-star-native');void el.offsetWidth;el.classList.add('is-star-shining');}
  item.timer=setTimeout(()=>{el.classList.remove('is-star-shining');item.animation?.cancel();item.animation=null;item.timer=0;},duration+30);
 }
 function move(x,y){if(!enabled||document.hidden||reduced.matches||!Number.isFinite(x)||!Number.isFinite(y))return;const now=performance.now();pointer={x,y,time:now};if(!trailPoint){trailPoint={x,y};return;}const dx=x-trailPoint.x,dy=y-trailPoint.y,distance=Math.hypot(dx,dy);if(distance<3||now-lastTrail<65)return;lastTrail=now;const ux=dx/distance,uy=dy/distance,count=Math.min(6,Math.max(4,Math.ceil(distance/14))),span=Math.min(32,distance),forward=10+Math.min(distance*.04,6);
  // A narrow three-lane ribbon: every particle in a batch shares its heading,
  // travel and lifetime rather than spraying into independent directions.
  for(let i=0;i<count;i++){const behind=span*(1-(i+1)/count),lane=(i%3-1)*1.1;shine(trailPool[trailCursor++%trailPool.length],x-ux*behind-uy*lane,y-uy*behind+ux*lane,2.6+(i%3)*.45,ux*forward,uy*forward,1850,true);}trailPoint={x,y};
 }
 function burst(){if(!enabled||document.hidden||!portrait||performance.now()-lastBurst<280)return;lastBurst=performance.now();const r=portrait.getBoundingClientRect(),count=reduced.matches?6:48;
  for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+Math.random()*.3,outer=i%3===0,px=outer?(i%2?r.width*.9:r.width*.1):r.width*(.12+Math.random()*.76),py=r.height*(.08+Math.random()*.84),distance=24+Math.random()*65;shine(portraitPool[i],px,py,5+Math.random()*12,Math.cos(angle)*distance,Math.sin(angle)*distance,reduced.matches?800:900+Math.random()*900);}
 }
 function scroll(){const y=window.scrollY||0,dy=y-lastScroll;lastScroll=y;const now=performance.now();if(!enabled||document.hidden||reduced.matches||Math.abs(dy)<2||now-lastEmit<70)return;lastEmit=now;
  const fresh=pointer&&now-pointer.time<1000;for(let i=0;i<12;i++){const x=10+Math.random()*Math.max(1,window.innerWidth-20),origin=fresh?pointer.y:window.innerHeight*.65,py=Math.max(16,Math.min(window.innerHeight-16,origin+(Math.random()-.5)*window.innerHeight*.7));shine(scrollPool[cursor++%scrollPool.length],x,py,3+Math.random()*8,(Math.random()-.5)*45,-Math.sign(dy)*(20+Math.random()*45),900+Math.random()*650);}
 }
 function setEnabled(on){
  on=Boolean(on)&&root.dataset.theme==='dark';
  if(on){if(root.dataset.cloud==='on')cloud.click();if(root.dataset.electric==='on')electric?.click();}
  enabled=Boolean(on);stop();lastScroll=window.scrollY||0;lastEmit=-Infinity;root.dataset.stars=enabled?'on':'off';button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',copy[enabled?2:1]);button.title=copy[enabled?2:1];sky.hidden=!enabled;ambient.hidden=!enabled;trailLayer.hidden=!enabled;cosmos.hidden=!enabled;
  if(enabled){decorate();surfaces.forEach(card=>{if(observe){observe.unobserve(card);observe.observe(card);}else card.classList.add('is-stars-visible');});if(portrait){owned=true;portrait.setAttribute('role','button');portrait.setAttribute('tabindex','0');portrait.setAttribute('aria-label',copy[3]);}}
  else{surfaces.forEach(card=>card.classList.remove('is-stars-visible'));if(owned&&root.dataset.cloud!=='on'&&root.dataset.electric!=='on'){saved.forEach(([key,value])=>value===null?portrait.removeAttribute(key):portrait.setAttribute(key,value));}owned=false;}
  window.dispatchEvent(new CustomEvent('portfoliostarschange',{detail:{enabled}}));
 }
 function listen(target,type,fn,options){target?.addEventListener(type,fn,options);listeners.push(()=>target?.removeEventListener(type,fn,options));}
 listen(button,'click',()=>setEnabled(!enabled));
 const exclusive=()=>{if(enabled&&(root.dataset.cloud==='on'||root.dataset.electric==='on'))setEnabled(false);};
 listen(window,'portfolioelectricchange',exclusive);listen(window,'portfoliocloudchange',exclusive);
 listen(portrait,'click',burst);listen(portrait,'keydown',event=>{if(enabled&&event.target===portrait&&(event.key==='Enter'||event.key===' ')){event.preventDefault();if(!event.repeat)burst();}});
 listen(window,'scroll',scroll,{passive:true});listen(window,'wheel',event=>{if(enabled)pointer={x:event.clientX,y:event.clientY,time:performance.now()};},{passive:true});listen(window,'pointermove',event=>{if(event.isPrimary!==false)move(event.clientX,event.clientY);},{passive:true});listen(window,'touchmove',event=>{if(event.touches.length===1)move(event.touches[0].clientX,event.touches[0].clientY);else trailPoint=null;},{passive:true});listen(window,'pointerup',()=>{trailPoint=null;},{passive:true});listen(window,'pointercancel',()=>{trailPoint=null;},{passive:true});
 listen(document,'visibilitychange',()=>{stop();root.classList.toggle('stars-paused',document.hidden);});listen(reduced,'change',()=>{stop();if(enabled&&portrait){portrait.setAttribute('role','button');portrait.setAttribute('tabindex','0');portrait.setAttribute('aria-label',copy[3]);}});listen(window,'pageshow',()=>{root.classList.toggle('stars-paused',document.hidden);lastScroll=window.scrollY||0;});
 listen(window,'pagehide',event=>{stop();root.classList.add('stars-paused');if(!event.persisted){observe?.disconnect();listeners.splice(0).forEach(off=>off());}});setEnabled(false);
})();
