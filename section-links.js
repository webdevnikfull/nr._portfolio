/* Geometry is recalculated when a section opens, moves, or changes width. */
(() => {
 'use strict';
 const main=document.getElementById('main');if(!main)return;
 const ns='http://www.w3.org/2000/svg',listeners=[],sections=['skills','experience','projects','education','certificates','volunteer'].map(id=>document.getElementById(id)).filter(Boolean);
 const layer=document.createElement('div');layer.className='heading-links';layer.setAttribute('aria-hidden','true');const svg=document.createElementNS(ns,'svg');svg.setAttribute('focusable','false');layer.append(svg);main.append(layer);
 function add(parent,tag,attrs){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));parent.append(n);return n;}
 const records=sections.map(section=>{const card=section.querySelector('.section-intro-action'),title=section.querySelector('h2'),icon=section.querySelector('.section-symbol'),button=section.querySelector('.section-disclosure');if(!card||!title||!icon)return null;const group=add(svg,'g',{class:'heading-link-group'}),paths=[];
  for(let i=0;i<2;i++){
   const routeId='section-light-route-'+section.id+'-'+i;
   paths.push([add(group,'path',{id:routeId,class:'heading-link-base'}),add(group,'path',{class:'heading-link-packet'+(i?' heading-link-return':''),pathLength:100})]);

  }
  const dot=add(group,'circle',{class:'heading-link-node',r:2.5});return{section,card,title,icon,button,group,paths,dot};
 }).filter(Boolean);
 let frame=0,destroyed=false;
 function setLit(record, lit) {
  record.group.classList.toggle('is-links-current', lit);
  record.group.classList.toggle('is-links-visible', lit);
  record.title.dataset.scrollTitle = lit ? 'visible' : 'concealed';
 }
 function reading() {
  for (const record of records) {
   const bounds = record.title.getBoundingClientRect();
   setLit(record, bounds.bottom > 0 && bounds.top < window.innerHeight);
  }
 }
 function listen(t,type,fn,opts){t.addEventListener(type,fn,opts);listeners.push(()=>t.removeEventListener(type,fn,opts));}
 function draw(){frame=0;if(destroyed||document.hidden)return;const m=main.getBoundingClientRect(),rail=main.querySelector('.section-connector'),rr=rail?.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${m.width} ${m.height}`);
  records.forEach(r=>{const a=r.icon.getBoundingClientRect(),c=r.card.getBoundingClientRect(),t=r.title.getBoundingClientRect();if(!c.width||!c.height)return;
   const sx=rr?rr.left-m.left+rr.width-4:-12,sy=a.top-m.top+a.height/2,ex=c.left-m.left,ey=c.top-m.top+c.height*.38,tx=t.left-m.left,ty=t.bottom-m.top+28;
   const br=r.button?.getBoundingClientRect();
   const desktop=c.left>=t.right+16;
   const clearance=20;
   // Anchor to the title, not to the changing More / Less button label.
   const startX=tx+Math.min(t.width*.25,70);
   const safeY=!desktop&&br?Math.max(ty,br.bottom-m.top+clearance):ty;
   let d1,d2;if(desktop){
    const span=ex-sx,crest=Math.max(c.top-m.top+24,Math.min(sy-100,ey-70)),mid=sx+span*.47;
    d1=`M ${sx} ${sy} C ${sx+span*.08} ${crest} ${mid-span*.15} ${crest} ${mid} ${crest} C ${ex-span*.22} ${crest} ${ex-65} ${ey} ${ex} ${ey}`;
    // Stay below the full title before rising through the empty column gap.
    // A block heading can fill its column even when its text is much shorter.
    // Measure the rendered text so the curve has room to turn smoothly.
    let textRight=t.right;
    if(document.createRange){
     const range=document.createRange();
     range.selectNodeContents(r.title);
     const textRects=[...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0);
     if(textRects.length)textRight=Math.max(...textRects.map(rect=>rect.right));
    }
    const shoulder=Math.min(ex-12,Math.max(startX,textRight-m.left+32));
    const reach=Math.max(0,ex-shoulder);
    d2=`M ${startX} ${ty} H ${shoulder} C ${shoulder+reach*.55} ${ty} ${ex-reach*.45} ${ey} ${ex} ${ey}`;
   }else{
    d1=`M ${sx} ${sy} L ${sx} ${ey-10} Q ${sx} ${ey} ${ex} ${ey}`;
    d2=`M ${startX} ${safeY} H ${tx} Q ${sx} ${safeY} ${sx} ${safeY+10} L ${sx} ${ey-10} Q ${sx} ${ey} ${ex} ${ey}`;
   }

   r.paths.forEach((pair,i)=>pair.forEach(p=>p.setAttribute('d',i?d2:d1)));r.dot.setAttribute('cx',String(ex));r.dot.setAttribute('cy',String(ey));
  });
 }
 function schedule(){if(!frame&&!destroyed&&!document.hidden)frame=requestAnimationFrame(draw);}
 records.forEach(r=>{listen(r.section,'pointerenter',()=>r.group.classList.add('is-links-active'),{passive:true});listen(r.section,'pointerleave',()=>r.group.classList.remove('is-links-active'),{passive:true});listen(r.section,'focusin',()=>r.group.classList.add('is-links-active'));listen(r.section,'focusout',()=>r.group.classList.remove('is-links-active'));listen(r.section,'click',schedule);});
 const byTitle = new Map(records.map(record => [record.title, record]));
 const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) setLit(byTitle.get(entry.target), entry.isIntersecting);
 }) : null;
 if (observer) records.forEach(record => observer.observe(record.title));
 else listen(window,'scroll',reading,{passive:true});
 const resize='ResizeObserver' in window?new ResizeObserver(schedule):null;resize?.observe(main);records.forEach(r=>{resize?.observe(r.card);if(r.button)resize?.observe(r.button);});
 reading();
 listen(window,'resize',schedule,{passive:true});listen(window,'portfoliosectionorderchange',schedule);listen(document,'visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;records.forEach(r=>r.group.classList.remove('is-links-active'));}else schedule();});listen(window,'pageshow',schedule);
 listen(window,'pagehide',e=>{if(frame)cancelAnimationFrame(frame);frame=0;if(!e.persisted){destroyed=true;observer?.disconnect();resize?.disconnect();listeners.splice(0).forEach(off=>off());}});document.fonts?.ready.then(schedule);schedule();
})();
