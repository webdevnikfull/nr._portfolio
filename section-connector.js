/* The line fills as the visitor scrolls between actual section headings; it never captures input. */
(() => {
 'use strict';
 const main=document.getElementById('main');if(!main)return;
 let sections=['skills','experience','projects','education','certificates','volunteer','contact'].map(id=>document.getElementById(id)).filter(Boolean);if(sections.length<2)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),ns='http://www.w3.org/2000/svg';
 const layer=document.createElement('div');layer.className='section-connector';layer.setAttribute('aria-hidden','true');
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('focusable','false');layer.append(svg);main.append(layer);main.classList.add('has-section-connector');
 function add(parent,tag,attrs){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));parent.append(n);return n;}
 const segments=sections.slice(0,-1).map(()=>{const g=add(svg,'g',{class:'connector-segment'});const track=add(g,'path',{class:'connector-track'});const hit=add(g,'path',{class:'connector-hit'});hit.addEventListener('pointerenter',()=>g.classList.add('is-connector-direct'));hit.addEventListener('pointerleave',()=>g.classList.remove('is-connector-direct'));const fill=add(g,'path',{class:'connector-progress',pathLength:100});const beam=add(g,'path',{class:'connector-beam',pathLength:100});return{g,track,hit,fill,beam,y1:0,y2:0,length:0};});
 const nodes=sections.map(()=>add(svg,'circle',{class:'connector-stop',r:4.2}));
 const traveler=add(svg,'g',{class:'connector-traveler'});add(traveler,'circle',{class:'connector-halo',r:6});add(traveler,'circle',{class:'connector-dot',r:3.5});
 const listeners=[];let pending=0,dirty=true,destroyed=false,hovered=-1,currentId=null,positions=[],x=20,bow=2;
 function listen(t,type,fn,opts){t.addEventListener(type,fn,opts);listeners.push(()=>t.removeEventListener(type,fn,opts));}
 function layout(){
  const m=main.getBoundingClientRect(),w=layer.getBoundingClientRect().width||26;
  x=w-4;bow=1.5;positions=sections.map(s=>{const a=s.querySelector('.section-symbol')||s.querySelector('.eyebrow')||s;const r=a.getBoundingClientRect();return r.top-m.top+r.height/2;});
  const h=Math.max(m.height,positions.at(-1)+20);layer.style.height=h.toFixed(1)+'px';svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  segments.forEach((s,i)=>{s.y1=positions[i];s.y2=Math.max(s.y1+1,positions[i+1]);const d=`M ${x} ${s.y1} C ${bow} ${s.y1} ${bow} ${s.y2} ${x} ${s.y2}`;[s.track,s.hit,s.fill,s.beam].forEach(p=>p.setAttribute('d',d));try{s.length=s.track.getTotalLength();}catch{s.length=0;}});
  nodes.forEach((n,i)=>{n.setAttribute('cx',String(x));n.setAttribute('cy',String(positions[i]));});dirty=false;
 }
 function read(){
  pending=0;if(destroyed||document.hidden)return;if(dirty)layout();
  const header=document.querySelector('.site-header'),line=Math.max((header?.getBoundingClientRect().height||72)+24,window.innerHeight*.36)-main.getBoundingClientRect().top;
  const anchor=line+main.getBoundingClientRect().top;
  let reading=-1;sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<=anchor)reading=i;});
  const final=sections.at(-1).getBoundingClientRect();if(anchor>final.top+final.height)reading=-1;
  const activeId=reading>=0?sections[reading].id:'';
  main.dataset.activeSection=activeId;
  if(currentId!==activeId){currentId=activeId;window.dispatchEvent(new CustomEvent('portfoliosectionactivechange',{detail:{id:activeId}}));}
  segments.forEach((segment,i)=>segment.g.classList.toggle('is-reading',reading>=0&&i===Math.min(reading,segments.length-1)));
  let index=0,t=0;segments.forEach((s,i)=>{const p=Math.max(0,Math.min(1,(line-s.y1)/(s.y2-s.y1)));s.fill.setAttribute('stroke-dashoffset',(100*(1-p)).toFixed(2));s.g.classList.toggle('is-active',p>0&&p<1);if(line>=s.y1){index=i;t=p;}});
  const s=segments[index];let point;
  try{point=s.length?s.track.getPointAtLength(s.length*t):null;}catch{point=null;}
  if(!point){const u=1-t;point={x:(u*u*u+t*t*t)*x+3*u*t*bow,y:s.y1+(3*t*t-2*t*t*t)*(s.y2-s.y1)};}
  traveler.style.transform=`translate(${point.x.toFixed(2)}px,${point.y.toFixed(2)}px)`;
  let reached=-1;
  if(line>=positions[0])positions.forEach((position,i)=>{if(point.y>=position-.5)reached=i;});
  const litId = sections[reached]?.id || '';
  const previousLitId = main.dataset.litSection;
  main.dataset.litSection = litId;
  nodes.forEach((node,i)=>{
   node.classList.toggle('is-current',i===reached);
   node.classList.toggle('is-visited',i<=reached);
  });
  if (previousLitId !== litId) window.dispatchEvent(new Event('portfoliosectionlightchange'));
 }
 function schedule(resize=false){if(resize)dirty=true;if(!pending&&!destroyed&&!document.hidden)pending=requestAnimationFrame(read);}
 function hover(event){const section=event.target.closest?.('section'),index=sections.indexOf(section);if(index===hovered)return;hovered=index;segments.forEach((s,i)=>s.g.classList.toggle('is-connector-hovered',i===Math.min(index,segments.length-1)&&index>=0));}
 function unhover(event){if(event.relatedTarget&&main.contains(event.relatedTarget))return;hovered=-1;segments.forEach(s=>s.g.classList.remove('is-connector-hovered'));}
 function suspend(){if(pending)cancelAnimationFrame(pending);pending=0;layer.classList.add('connector-paused');}
 listen(window,'portfoliosectionorderchange',()=>{const ids=new Set(sections.map(n=>n.id));sections=[...main.children].filter(n=>ids.has(n.id));hovered=-1;segments.forEach(s=>s.g.classList.remove('is-connector-hovered'));schedule(true);});
 listen(window,'scroll',()=>schedule(),{passive:true});listen(window,'resize',()=>schedule(true),{passive:true});
 listen(main,'pointerover',hover,{passive:true});listen(main,'pointerout',unhover,{passive:true});listen(main,'focusin',hover);listen(main,'focusout',unhover);listen(main,'click',()=>schedule(true));
 listen(document,'visibilitychange',()=>{if(document.hidden)suspend();else{layer.classList.remove('connector-paused');schedule(true);}});
 listen(reduced,'change',()=>schedule());listen(window,'pageshow',()=>{layer.classList.remove('connector-paused');schedule(true);});
 const resize='ResizeObserver' in window?new ResizeObserver(()=>schedule(true)):null;resize?.observe(main);document.fonts?.ready.then(()=>schedule(true));
 listen(window,'pagehide',event=>{suspend();if(!event.persisted){destroyed=true;resize?.disconnect();listeners.splice(0).forEach(off=>off());}});
 read();
})();
