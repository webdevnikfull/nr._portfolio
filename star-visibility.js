/* Reversible, explicit element hiding, available only in star mode. */
(() => {
 'use strict';
 const root=document.documentElement,mode=document.getElementById('stars-toggle');if(!mode)return;
 const copy={
  pl:['Elementy strony','Ukryj element','Anuluj wybieranie','Przywróć wszystkie','Wyłącz tryb gwiazdek','Wybierz element dotknięciem lub kliknięciem. Escape anuluje.','Przywróć','Ukryte elementy','Nie ma ukrytych elementów.','Element'],
  en:['Page elements','Hide an element','Cancel selection','Restore all','Disable star effects','Tap or click an element. Escape cancels selection.','Restore','Hidden elements','No hidden elements.','Element'],
  de:['Seitenelemente','Element ausblenden','Auswahl abbrechen','Alle wiederherstellen','Sterne ausschalten','Element antippen oder anklicken. Escape bricht die Auswahl ab.','Wiederherstellen','Ausgeblendete Elemente','Keine ausgeblendeten Elemente.','Element'],
  uk:['Елементи сторінки','Приховати елемент','Скасувати вибір','Відновити всі','Вимкнути зоряні ефекти','Торкніться елемента або клацніть його. Escape скасовує вибір.','Відновити','Приховані елементи','Прихованих елементів немає.','Елемент']
 }[root.lang]||['Page elements','Hide an element','Cancel selection','Restore all','Disable star effects','Tap or click an element. Escape cancels selection.','Restore','Hidden elements','No hidden elements.','Element'];
 const panel=document.createElement('details');panel.className='star-visibility-tools';panel.hidden=true;panel.setAttribute('aria-label',copy[0]);
 const heading=document.createElement('summary');heading.textContent=copy[0];panel.append(heading);
 const content=document.createElement('div');content.className='star-visibility-content';panel.append(content);
 const controls=document.createElement('div');controls.className='star-visibility-actions';content.append(controls);
 const makeButton=text=>{const el=document.createElement('button');el.type='button';el.textContent=text;return el;};
 const select=makeButton(copy[1]),restore=makeButton(copy[3]),exit=makeButton(copy[4]);select.setAttribute('aria-pressed','false');controls.append(select,restore);
 const status=document.createElement('p');status.className='star-visibility-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');content.append(status);
 const list=document.createElement('ul');list.className='star-visibility-list';list.setAttribute('aria-label',copy[7]);content.append(list,exit);document.body.append(panel);
 const outline=document.createElement('div');outline.className='star-pick-outline';outline.hidden=true;outline.setAttribute('aria-hidden','true');document.body.append(outline);
 let picking=false,current=null;const hidden=new Map();
 function setPicking(on){picking=Boolean(on)&&root.dataset.stars==='on';select.setAttribute('aria-pressed',String(picking));select.textContent=copy[picking?2:1];root.classList.toggle('is-star-picking',picking);current=null;outline.hidden=true;if(picking)status.textContent=copy[5];else status.textContent=hidden.size?copy[7]+': '+hidden.size:copy[8];}
 function update(){list.replaceChildren();restore.disabled=hidden.size===0;for(const [el,record]of hidden){const item=document.createElement('li'),button=makeButton(copy[6]+' — '+record.name);button.addEventListener('click',()=>{show(el);update();});item.append(button);list.append(item);}if(!picking)status.textContent=hidden.size?copy[7]+': '+hidden.size:copy[8];}
 function show(el){const record=hidden.get(el);if(!record)return;el.classList.remove('is-star-hidden');if(record.aria===null)el.removeAttribute('aria-hidden');else el.setAttribute('aria-hidden',record.aria);hidden.delete(el);}
 function restoreAll(){for(const el of [...hidden.keys()])show(el);update();}
 function candidate(target){if(!target?.closest||target.closest('.star-visibility-tools,.star-pick-outline'))return null;let el=target.closest('button,a,input,select,textarea,summary')||target.closest('svg')?.parentElement||target;if(!el||['HTML','BODY','SCRIPT','STYLE','LINK'].includes(el.tagName)||el===panel||el===outline)return null;return el;}
 function highlight(el){current=el;if(!el){outline.hidden=true;return;}const rect=el.getBoundingClientRect();outline.style.left=rect.left+'px';outline.style.top=rect.top+'px';outline.style.width=rect.width+'px';outline.style.height=rect.height+'px';outline.hidden=false;}
 function hide(el){if(!el||hidden.has(el))return;const name=(el.getAttribute('aria-label')||el.getAttribute('alt')||el.textContent||el.tagName).replace(/\s+/g,' ').trim();hidden.set(el,{aria:el.getAttribute('aria-hidden'),name:Array.from(name||copy[9]).slice(0,60).join('')});el.classList.add('is-star-hidden');el.setAttribute('aria-hidden','true');setPicking(false);update();select.focus({preventScroll:true});}
 select.addEventListener('click',()=>setPicking(!picking));restore.addEventListener('click',restoreAll);exit.addEventListener('click',()=>mode.click());
 document.addEventListener('pointermove',event=>{if(picking&&event.pointerType!=='touch')highlight(candidate(event.target));},{passive:true});
 document.addEventListener('click',event=>{if(!picking)return;const el=candidate(event.target);if(!el)return;event.preventDefault();event.stopImmediatePropagation();hide(el);},true);
 document.addEventListener('keydown',event=>{if(!picking)return;if(event.key==='Escape'){event.preventDefault();setPicking(false);select.focus({preventScroll:true});return;}if(event.key==='Enter'||event.key===' '){const el=candidate(event.target);if(el){event.preventDefault();event.stopImmediatePropagation();hide(el);}}},true);
 window.addEventListener('scroll',()=>{if(picking)highlight(null);},{passive:true});
 function sync(){const on=root.dataset.stars==='on';if(!on){setPicking(false);restoreAll();panel.open=false;}panel.hidden=!on;update();}
 window.addEventListener('portfoliostarschange',sync);window.addEventListener('pagehide',()=>{setPicking(false);restoreAll();});sync();
})();
