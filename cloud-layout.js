/* Reorder the seven numbered sections only in cloud mode. The normal layout always restores the supplied order. */
(() => {
 'use strict';
 const root=document.documentElement,main=document.getElementById('main');if(!main)return;
 const allowed=new Set(['skills','experience','projects','education','certificates','volunteer','contact']);
 const sections=[...main.children].filter(n=>allowed.has(n.id));if(sections.length<2)return;
 const byId=new Map(sections.map(n=>[n.id,n])),original=sections.map(n=>n.id),tail=sections.at(-1).nextElementSibling;
 const navigation=document.getElementById('navigation'),originalLinks=navigation?[...navigation.children]:[];
 const numberNodes=new Map(sections.map(n=>[n.id,n.querySelector('.section-order-number')]));
 const originalNumbers=new Map([...numberNodes].map(([id,n])=>[id,n?.textContent]));
 const copy={
  pl:{toggle:'Układ sekcji',title:'Sekcje w chmurze',note:'Strzałkami zmienisz kolejność. Układ dotyczy trybu chmury.',close:'Zamknij układ sekcji',up:'Przenieś w górę',down:'Przenieś w dół',position:'Pozycja',names:['Kompetencje','Doświadczenie','Projekty','Rozwój','Certyfikaty','Wolontariat','Kontakt']},
  en:{toggle:'Section order',title:'Sections in cloud mode',note:'Use the arrows to reorder. This layout applies to cloud mode.',close:'Close section order',up:'Move up',down:'Move down',position:'Position',names:['Skills','Experience','Projects','Development','Certificates','Volunteering','Contact']},
  de:{toggle:'Abschnittsfolge',title:'Abschnitte im Wolkenmodus',note:'Mit den Pfeilen sortieren. Die Reihenfolge gilt für den Wolkenmodus.',close:'Abschnittsfolge schließen',up:'Nach oben',down:'Nach unten',position:'Position',names:['Kompetenzen','Erfahrung','Projekte','Entwicklung','Zertifikate','Ehrenamt','Kontakt']},
  uk:{toggle:'Порядок розділів',title:'Розділи в хмарному режимі',note:'Змінюйте порядок стрілками. Цей порядок діє в хмарному режимі.',close:'Закрити порядок розділів',up:'Перемістити вгору',down:'Перемістити вниз',position:'Позиція',names:['Компетенції','Досвід','Проєкти','Розвиток','Сертифікати','Волонтерство','Контакти']}
 }[root.lang]||null;if(!copy)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),listeners=[],animations=new Set(),rows=new Map();let enabled=false,order=[...original];
 const make=(tag,className,text)=>{const n=document.createElement(tag);n.className=className;if(text!==undefined)n.textContent=text;return n;};
 const toggle=make('button','cloud-layout-toggle');toggle.type='button';toggle.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','cloud-layout-panel');toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M5 12h14M5 19h14"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/></svg>';toggle.append(make('span','',copy.toggle));
 const panel=make('aside','cloud-layout-panel');panel.id='cloud-layout-panel';panel.hidden=true;panel.setAttribute('aria-labelledby','cloud-layout-title');
 const head=make('div','cloud-layout-head'),title=make('h2','',copy.title);title.id='cloud-layout-title';const close=make('button','cloud-layout-close','×');close.type='button';close.setAttribute('aria-label',copy.close);head.append(title,close);
 const list=make('ol','cloud-layout-list'),live=make('span','cloud-layout-announcement');live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');panel.append(head,make('p','cloud-layout-note',copy.note),list,live);document.body.append(toggle,panel);
 const names=new Map(original.map((id,i)=>[id,copy.names[i]]));
 function listen(t,type,fn){t.addEventListener(type,fn);listeners.push(()=>t.removeEventListener(type,fn));}
 function cancel(){animations.forEach(a=>a.cancel());animations.clear();}
 function open(on,restore=false){on=enabled&&on;panel.hidden=!on;toggle.setAttribute('aria-expanded',String(on));if(on)close.focus({preventScroll:true});else if(restore&&!toggle.hidden)toggle.focus({preventScroll:true});}
 function updateRows(){order.forEach((id,i)=>{const r=rows.get(id);list.append(r.row);r.number.textContent=String(i+1).padStart(2,'0');r.up.disabled=i===0;r.down.disabled=i===order.length-1;});}
 function apply(ids){
  ids.forEach(id=>main.insertBefore(byId.get(id),tail));
  ids.forEach((id,i)=>{const n=numberNodes.get(id);if(n)n.textContent=enabled?String(i+1).padStart(2,'0'):originalNumbers.get(id);});
  if(navigation){if(enabled){const links=new Map(originalLinks.map(n=>[(n.getAttribute('href')||'').slice(1),n]));originalLinks.filter(n=>!allowed.has((n.getAttribute('href')||'').slice(1))).forEach(n=>navigation.append(n));ids.forEach(id=>{if(links.has(id))navigation.append(links.get(id));});}else originalLinks.forEach(n=>navigation.append(n));}
  window.dispatchEvent(new CustomEvent('portfoliosectionorderchange',{detail:{order:[...ids]}}));
 }
 function swap(id,delta,control){
  if(!enabled)return;const i=order.indexOf(id),j=i+delta;if(j<0||j>=order.length)return;
  cancel();const before=new Map([...rows].map(([key,r])=>[key,r.row.getBoundingClientRect().top]));[order[i],order[j]]=[order[j],order[i]];apply(order);updateRows();
  if(!reduced.matches&&!document.hidden)rows.forEach((r,key)=>{const dy=before.get(key)-r.row.getBoundingClientRect().top;if(!dy||typeof r.row.animate!=='function')return;try{const a=r.row.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});animations.add(a);a.onfinish=()=>animations.delete(a);a.oncancel=()=>animations.delete(a);}catch{}});
  const r=rows.get(id);(control.disabled?(delta>0?r.up:r.down):control).focus({preventScroll:true});live.textContent=names.get(id)+'. '+copy.position+' '+(j+1)+' / '+order.length+'.';
 }
 original.forEach(id=>{const row=make('li','cloud-layout-row');row.dataset.sectionId=id;const number=make('span','cloud-layout-position'),name=make('span','cloud-layout-name',names.get(id)),tools=make('span','cloud-layout-arrows'),up=make('button','cloud-layout-step','↑'),down=make('button','cloud-layout-step','↓');up.type=down.type='button';up.setAttribute('aria-label',copy.up+': '+names.get(id));down.setAttribute('aria-label',copy.down+': '+names.get(id));tools.append(up,down);row.append(number,name,tools);rows.set(id,{row,number,up,down});listen(up,'click',()=>swap(id,-1,up));listen(down,'click',()=>swap(id,1,down));});updateRows();
 function sync(){const next=root.dataset.cloud==='on';if(next===enabled)return;enabled=next;cancel();if(!enabled){const inside=panel.contains(document.activeElement);open(false);toggle.hidden=true;apply(original);if(inside)document.getElementById('cloud-toggle')?.focus({preventScroll:true});}else{toggle.hidden=false;apply(order);}}
 listen(toggle,'click',()=>open(panel.hidden));listen(close,'click',()=>open(false,true));
 listen(document,'keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();open(false,true);}});
 listen(window,'portfoliocloudchange',sync);listen(reduced,'change',cancel);listen(document,'visibilitychange',()=>{if(document.hidden)cancel();});
 listen(window,'pagehide',event=>{cancel();if(!event.persisted)listeners.splice(0).forEach(off=>off());});sync();
})();
