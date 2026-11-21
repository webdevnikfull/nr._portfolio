/* Soft cloud volumes on hover; a cloud-and-network release on click, tap or keyboard activation. */
(() => {
 'use strict';
 const root=document.documentElement,lightning=document.getElementById('electric-toggle');if(!lightning||document.getElementById('cloud-toggle'))return;
 const labels={pl:['Włącz tryb chmury','Wyłącz tryb chmury'],en:['Enable cloud effects','Disable cloud effects'],de:['Wolkeneffekte einschalten','Wolkeneffekte ausschalten'],uk:['Увімкнути хмарні ефекти','Вимкнути хмарні ефекти']}[root.lang]||['Enable cloud effects','Disable cloud effects'];
 const button=document.createElement('button');button.id='cloud-toggle';button.className='icon-button cloud-toggle';button.type='button';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18h12a4 4 0 0 0 .8-7.9A6.5 6.5 0 0 0 6.3 8.5 4.8 4.8 0 0 0 6 18Z"/><path d="M8 21h8"/></svg>';lightning.insertAdjacentElement('afterend',button);
 const atmosphere=document.createElement('div');atmosphere.className='cloud-atmosphere';atmosphere.setAttribute('aria-hidden','true');atmosphere.hidden=true;atmosphere.innerHTML='<i></i><i></i><i></i>';document.body.append(atmosphere);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const targets='.section-intro-action, .skill-card, .experience-row, .project-card, .education-card, .certificate-entry-summary, .certificate-provider-empty, .volunteer-item, .portrait-image-wrap, .profile-network, .button, .section-disclosure, .project-links a, .certificate-action, .education-tab';
 const decorated=new Map(),listeners=[],passive={passive:true};let enabled=false,pending=0,point=null,listening=false;
 function clear(){if(pending)cancelAnimationFrame(pending);pending=0;point=null;decorated.forEach((s,el)=>{clearTimeout(s.timer);s.timer=0;el.classList.remove('is-cloud-active','is-cloud-release');});}
 function prepare(el){let s=decorated.get(el);if(s?.wash.parentNode===el)return s;if(s)clearTimeout(s.timer);const wash=document.createElement('span');wash.className='cloud-wash';wash.setAttribute('aria-hidden','true');el.append(wash);el.classList.add('cloud-surface');s={wash,timer:0,last:-Infinity};decorated.set(el,s);return s;}
 function illuminate(el,x,y,release=false){
  if(!enabled||document.hidden||reduced.matches)return;const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
  const s=prepare(el),now=performance.now();x=Number.isFinite(x)?x:r.left+r.width/2;y=Number.isFinite(y)?y:r.top+r.height/2;
  el.style.setProperty('--cloud-x',Math.max(0,Math.min(r.width,x-r.left)).toFixed(1)+'px');el.style.setProperty('--cloud-y',Math.max(0,Math.min(r.height,y-r.top)).toFixed(1)+'px');el.style.setProperty('--cloud-size',Math.max(24,Math.min(108,r.width*.4,r.height*.8)).toFixed(1)+'px');
  if(!release&&(now-s.last<850||el.classList.contains('is-cloud-release')))return;s.last=now;clearTimeout(s.timer);el.classList.remove('is-cloud-active','is-cloud-release');void s.wash.offsetWidth;el.classList.add(release?'is-cloud-release':'is-cloud-active');s.timer=setTimeout(()=>{el.classList.remove('is-cloud-active','is-cloud-release');s.timer=0;},release?2350:1750);
 }
 function surface(target){if(target?.closest?.('.contact-section, .site-header, .footer'))return null;return target?.closest?.(targets);}
 function move(e){if(!enabled||document.hidden||reduced.matches||e.isPrimary===false||e.pointerType==='touch')return;const el=surface(e.target);if(!el)return;point={el,x:e.clientX,y:e.clientY};if(!pending)pending=requestAnimationFrame(()=>{pending=0;const p=point;point=null;if(p)illuminate(p.el,p.x,p.y);});}
 function click(e){if(!enabled)return;const el=surface(e.target);if(!el)return;const r=el.getBoundingClientRect();illuminate(el,e.detail===0?r.left+r.width/2:e.clientX,e.detail===0?r.top+r.height/2:e.clientY,true);}
 function focus(e){if(!enabled)return;const el=surface(e.target);if(!el)return;const r=el.getBoundingClientRect();illuminate(el,r.left+r.width/2,r.top+20);}
 function input(on){if(listening===on)return;listening=on;const m=on?'addEventListener':'removeEventListener';document[m]('pointermove',move,passive);document[m]('click',click);document[m]('focusin',focus);}
 function setEnabled(on){
  on=Boolean(on)&&root.dataset.theme==='dark';
  if(on&&root.dataset.electric==='on')lightning.click();enabled=Boolean(on);root.dataset.cloud=enabled?'on':'off';button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',labels[Number(enabled)]);button.title=labels[Number(enabled)];atmosphere.hidden=!enabled;clear();input(enabled&&!document.hidden);root.classList.toggle('cloud-paused',document.hidden);window.dispatchEvent(new CustomEvent('portfoliocloudchange',{detail:{enabled}}));
 }
 function listen(t,type,fn){t.addEventListener(type,fn);listeners.push(()=>t.removeEventListener(type,fn));}
 listen(button,'click',()=>setEnabled(!enabled));listen(window,'portfolioelectricchange',()=>{if(root.dataset.electric==='on'&&enabled)setEnabled(false);});
 listen(document,'visibilitychange',()=>{clear();input(enabled&&!document.hidden);root.classList.toggle('cloud-paused',document.hidden);});listen(reduced,'change',clear);
 listen(window,'pagehide',event=>{clear();input(false);root.classList.add('cloud-paused');if(!event.persisted){listeners.splice(0).forEach(off=>off());decorated.forEach((s,el)=>{s.wash.remove();el.classList.remove('cloud-surface');});decorated.clear();}});
 listen(window,'pageshow',()=>{root.classList.toggle('cloud-paused',document.hidden);input(enabled&&!document.hidden);});setEnabled(false);
})();
