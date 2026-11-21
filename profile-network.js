/* Independent native node buttons; dragging is bounded to this illustration. */
(() => {
 'use strict';
 const root=document.documentElement;
 const host=document.querySelector('.portrait-details');if(!host)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),ns='http://www.w3.org/2000/svg';
 const box=document.createElement('div');box.className='profile-network network-editor';box.setAttribute('role','group');
 const lang=document.documentElement.lang;const copy={pl:['Interaktywna sieć połączeń','Węzeł','Kliknij, aby wybrać. Przeciągnij lub użyj strzałek, aby przesunąć.'],en:['Interactive network','Node','Select to highlight. Drag or use arrow keys to move.'],de:['Interaktives Netzwerk','Knoten','Zum Auswählen klicken. Ziehen oder mit Pfeiltasten verschieben.'],uk:['Інтерактивна мережа','Вузол','Натисніть для вибору. Перетягніть або пересувайте стрілками.']}[lang]||['Interactive network','Node','Drag or use arrow keys to move.'];box.setAttribute('aria-label',copy[0]);
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 320 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');box.append(svg);
 const add=(tag,attrs)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));svg.append(n);return n;};
 const points=[[16,50],[16,16],[160,16],[304,16],[16,84],[160,84],[304,84],[304,50]].map(([x,y])=>({x,y}));
 const paths=points.map(()=>add('path',{class:'network-wire',fill:'none'}));
 add('rect',{class:'network-hub',x:146,y:37,width:28,height:26,rx:7});add('path',{d:'M152 44h16M152 50h16M152 56h16',opacity:.6});
 const edges=[[0,1],[0,4],[1,2],[1,4],[2,3],[2,5],[3,7],[3,6],[4,5],[4,6],[5,6],[6,7],[2,4],[3,5]];
 const mesh=edges.map(()=>add('path',{class:'network-mesh-wire',fill:'none'}));
 const buttons=points.map((p,i)=>{const b=document.createElement('button');b.type='button';b.className='network-node-control';b.setAttribute('aria-label',copy[1]+' '+(i+1)+'. '+copy[2]);b.setAttribute('aria-pressed','false');b.textContent=String(i+1);box.append(b);return b;});
 const fold=document.createElement('details');fold.className='network-disclosure';
 const summary=document.createElement('summary');summary.className='network-disclosure-title';
 summary.textContent=({pl:'Wsparcie IT — analiza przyczyn źródłowych · umowa o poziomie świadczenia usług',en:'IT Support — Root Cause Analysis · Service Level Agreement',de:'IT-Support — Ursachenanalyse · Vereinbarung zum Service-Level',uk:'IT-підтримка — аналіз першопричин · угода про рівень обслуговування'})[lang]||'IT Support — Root Cause Analysis · Service Level Agreement';
 fold.hidden=true;fold.append(summary,box);host.prepend(fold);
 let selected=-1,drag=null;const listeners=[];const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function paint(){edges.forEach(([a,b],i)=>{mesh[i].setAttribute('d',`M ${points[a].x} ${points[a].y} L ${points[b].x} ${points[b].y}`);mesh[i].classList.toggle('network-link-selected',a===selected||b===selected);});points.forEach((p,i)=>{paths[i].setAttribute('d',`M ${p.x} ${p.y} L 160 50`);paths[i].classList.toggle('network-link-selected',i===selected);buttons[i].style.left=(p.x/320*100)+'%';buttons[i].style.top=p.y+'%';});}
 function select(i){if(root.dataset.cloud!=='on')return;selected=i;buttons.forEach((b,j)=>{b.setAttribute('aria-pressed',String(i===j));});paint();}
 function listen(t,type,fn,opts){t.addEventListener(type,fn,opts);listeners.push(()=>t.removeEventListener(type,fn,opts));}
 function end(e){if(!drag)return;const d=drag;drag=null;try{buttons[d.i].releasePointerCapture(d.id);}catch{}}
 buttons.forEach((b,i)=>{
  listen(b,'click',()=>select(i));
  listen(b,'pointerdown',e=>{if(root.dataset.cloud!=='on'||!fold.open||e.isPrimary===false||e.button>0)return;select(i);const p=points[i];drag={i,id:e.pointerId,x:e.clientX,y:e.clientY,px:p.x,py:p.y};try{b.setPointerCapture(e.pointerId);}catch{end();}});
  listen(b,'pointermove',e=>{if(root.dataset.cloud!=='on'||!drag||drag.i!==i||drag.id!==e.pointerId)return;const r=box.getBoundingClientRect();if(!r.width||!r.height)return;points[i].x=clamp(drag.px+(e.clientX-drag.x)/r.width*320,12,308);points[i].y=clamp(drag.py+(e.clientY-drag.y)/r.height*100,13,87);paint();});
  listen(b,'pointerup',end);listen(b,'pointercancel',end);listen(b,'lostpointercapture',end);
  listen(b,'keydown',e=>{if(root.dataset.cloud!=='on'||!fold.open)return;const delta={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]}[e.key];if(!delta)return;e.preventDefault();select(i);points[i].x=clamp(points[i].x+delta[0],12,308);points[i].y=clamp(points[i].y+delta[1],13,87);paint();});
 });
 function sync(){const on=root.dataset.cloud==='on';if(!on){end();fold.open=false;if(fold.contains(document.activeElement))document.getElementById('cloud-toggle')?.focus();}fold.hidden=!on;}
 listen(window,'portfoliocloudchange',sync);listen(fold,'toggle',()=>{if(!fold.open)end();});
 listen(window,'resize',end);listen(document,'visibilitychange',()=>{if(document.hidden)end();});listen(window,'pagehide',e=>{end();if(!e.persisted)listeners.splice(0).forEach(off=>off());});paint();sync();
})();
