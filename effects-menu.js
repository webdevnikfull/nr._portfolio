/* One menu for the existing effect controls; the original page stays intact. */
(() => {
 'use strict';
 const root=document.documentElement,tools=document.querySelector('.nav-tools');
 const modes=['electric','cloud','stars'],buttons=modes.map(mode=>document.getElementById(mode+'-toggle'));
 if(!tools||buttons.some(button=>!button))return;
 const t={pl:['Efekty','Efekty wizualne','Piorunek','Obłoki','Gwiazdki','Wyłącz efekty','Włącz efekty','Tryby dostępne w ciemnym motywie.'],en:['Effects','Visual effects','Lightning','Clouds','Stars','Turn effects off','Turn effects on','Modes are available in the dark theme.'],de:['Effekte','Visuelle Effekte','Blitze','Wolken','Sterne','Effekte ausschalten','Effekte einschalten','Modi sind im dunklen Design verfügbar.'],uk:['Ефекти','Візуальні ефекти','Блискавки','Хмари','Зірки','Вимкнути ефекти','Увімкнути ефекти','Режими доступні в темній темі.']}[root.lang]||['Effects','Visual effects','Lightning','Clouds','Stars','Turn effects off','Turn effects on','Modes are available in the dark theme.'];
 const wrap=document.createElement('div');wrap.className='nav-tool-item effects-menu-tool';
 const menu=document.createElement('details');menu.className='effects-menu';
 const summary=document.createElement('summary');summary.setAttribute('aria-label',t[1]);summary.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></svg>';
 const panel=document.createElement('div');panel.className='effects-menu-panel';panel.setAttribute('role','group');panel.setAttribute('aria-label',t[1]);
 buttons.forEach((button,i)=>{const old=button.closest('.nav-tool-item');const label=document.createElement('span');label.className='effects-mode-label';label.textContent=t[i+2];button.append(label);panel.append(button);if(old)old.remove();});
 const toggle=document.createElement('button');toggle.type='button';toggle.className='effects-master-toggle';toggle.id='effects-master-toggle';
 const hint=document.createElement('p');hint.className='effects-menu-hint';panel.append(toggle,hint);menu.append(summary,panel);
 const caption=document.createElement('span');caption.className='nav-tool-caption';caption.textContent=t[0];caption.setAttribute('aria-hidden','true');wrap.append(menu,caption);tools.insertBefore(wrap,document.getElementById('menu-toggle'));
 let paused=false;
 function sync(){const dark=root.dataset.theme==='dark';buttons.forEach(button=>button.disabled=paused||!dark);toggle.textContent=t[paused?6:5];toggle.setAttribute('aria-pressed',String(paused));hint.textContent=!dark?t[7]:'';}
 function setPaused(off){
  if(off&&!paused)buttons.forEach((button,i)=>{if(root.dataset[modes[i]]==='on'){button.disabled=false;button.click();}});
  paused=off;root.dataset.effectsPaused=String(off);
  window.dispatchEvent(new CustomEvent('portfoliovisualeffectschange',{detail:{enabled:!off}}));
  try{localStorage.setItem('nr-effects-disabled',String(off));}catch{}sync();
 }
 toggle.addEventListener('click',()=>setPaused(!paused));
 buttons.forEach(button=>button.addEventListener('click',event=>{if(paused){event.preventDefault();event.stopImmediatePropagation();}},{capture:true}));
 const observer=new MutationObserver(sync);observer.observe(root,{attributes:true,attributeFilter:['data-theme','data-electric','data-cloud','data-stars']});
 const outside=event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;};const keyboard=event=>{if(event.key==='Escape'&&menu.open){menu.open=false;summary.focus();}};
 document.addEventListener('click',outside);document.addEventListener('keydown',keyboard);
 window.addEventListener('pagehide',event=>{if(!event.persisted){observer.disconnect();document.removeEventListener('click',outside);document.removeEventListener('keydown',keyboard);}});
 let saved=false;try{saved=localStorage.getItem('nr-effects-disabled')==='true';}catch{}setPaused(saved);
})();
