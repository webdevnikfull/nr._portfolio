/* A bounded pool follows actual scrolling; every gesture listener is passive. */
(() => {
 'use strict';
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.className='cloud-scroll-layer';layer.setAttribute('aria-hidden','true');layer.hidden=true;document.body.append(layer);
 const ambient=document.createElement('div');ambient.className='cloud-ambient-layer';ambient.setAttribute('aria-hidden','true');ambient.hidden=true;document.body.append(ambient);
 for(let i=0;i<28;i++){const el=document.createElement('i');el.className='cloud-ambient-puff';el.style.left=((i%7+Math.random())/7*100)+'%';el.style.top=((Math.floor(i/7)+Math.random())/4*100)+'%';el.style.setProperty('--cloud-volume',(50+Math.random()*100)+'px');el.style.setProperty('--cloud-drift-time',(20+Math.random()*24)+'s');el.style.setProperty('--cloud-drift-delay',(-Math.random()*40)+'s');ambient.append(el);}
 const pool=Array.from({length:40},()=>{const el=document.createElement('span');el.className='cloud-scroll-puff';layer.append(el);return{el,timer:0};});
 let listening=false,last=-Infinity,lastMove=-Infinity,y=window.scrollY||0,point=null,next=0;const passive={passive:true};
 function clear(){pool.forEach(p=>{clearTimeout(p.timer);p.timer=0;p.el.classList.remove('is-floating');});point=null;last=-Infinity;}
 function allowed(){return root.dataset.cloud==='on'&&!document.hidden&&!reduced.matches;}
 function wheel(e){if(Number.isFinite(e.clientX)&&Number.isFinite(e.clientY))point={x:e.clientX,y:e.clientY,time:performance.now()};}
 function emit(px,py,count){for(let i=0;i<count;i++){const p=pool[next++%pool.length];clearTimeout(p.timer);p.el.style.left=Math.max(27,Math.min(window.innerWidth-27,px+(Math.random()-.5)*150))+'px';p.el.style.top=Math.max(35,Math.min(window.innerHeight-25,py+(Math.random()-.5)*110))+'px';p.el.style.setProperty('--puff-size',(.65+Math.random()*.85));p.el.style.setProperty('--puff-drift',((next%2?1:-1)*(18+Math.random()*30))+'px');p.el.classList.remove('is-floating');void p.el.offsetWidth;p.el.classList.add('is-floating');p.timer=setTimeout(()=>{p.el.classList.remove('is-floating');p.timer=0;},1650);}}
 function move(e){const before=point;wheel(e);const now=performance.now();if(!allowed()||!point||now-lastMove<100)return;if(before&&Math.hypot(point.x-before.x,point.y-before.y)<5)return;lastMove=now;emit(point.x,point.y,3);}
 function touch(e){if(e.touches.length!==1){point=null;return;}move(e.touches[0]);}
 function scroll(){const now=performance.now(),current=window.scrollY||0,dy=current-y;y=current;if(!allowed()||Math.abs(dy)<2||now-last<100)return;last=now;
  const fresh=point&&now-point.time<900;emit(fresh?point.x:Math.random()*window.innerWidth,fresh?point.y:window.innerHeight*(.2+Math.random()*.6),4);
 }
 function input(on){if(on===listening)return;listening=on;const m=on?'addEventListener':'removeEventListener';window[m]('scroll',scroll,passive);window[m]('wheel',wheel,passive);window[m]('touchmove',touch,passive);window[m]('pointermove',move,passive);}
 function sync(){clear();lastMove=-Infinity;y=window.scrollY||0;const on=allowed();layer.hidden=!on;ambient.hidden=!on;input(on);}
 window.addEventListener('portfoliocloudchange',sync);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('pageshow',sync);
 window.addEventListener('pagehide',e=>{clear();input(false);if(!e.persisted){window.removeEventListener('portfoliocloudchange',sync);document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);window.removeEventListener('pageshow',sync);}});sync();
})();
