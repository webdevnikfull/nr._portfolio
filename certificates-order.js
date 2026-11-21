/* Reorder issuers, thematic categories and certificate entries in every visual mode. */
(() => {
  'use strict';
  const section=document.getElementById('certificates'), grid=document.getElementById('certificate-grid'), upcoming=document.getElementById('certificate-upcoming');
  if(!section||!grid||grid.hidden) return;
  const lang=document.documentElement.lang.split('-')[0];
  const labels={
    pl:{edit:'Ustaw kolejność',done:'Gotowe',up:'Przesuń wyżej',down:'Przesuń niżej',help:'Kolejność jest zapamiętywana w tej przeglądarce.',group:'Kolejność',position:'pozycja',of:'z'},
    en:{edit:'Arrange order',done:'Done',up:'Move up',down:'Move down',help:'The order is remembered in this browser.',group:'Order',position:'position',of:'of'},
    de:{edit:'Reihenfolge ändern',done:'Fertig',up:'Nach oben',down:'Nach unten',help:'Die Reihenfolge wird in diesem Browser gespeichert.',group:'Reihenfolge',position:'Position',of:'von'},
    uk:{edit:'Змінити порядок',done:'Готово',up:'Перемістити вище',down:'Перемістити нижче',help:'Порядок зберігається в цьому браузері.',group:'Порядок',position:'позиція',of:'з'}
  }[lang]||{edit:'Arrange order',done:'Done',up:'Move up',down:'Move down',help:'The order is remembered in this browser.',group:'Order',position:'position',of:'of'};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'), groups=[], animations=new Set(), listeners=[];
  const storageKey='nr-portfolio-certificate-order-v1';
  const records = new Map((window.portfolioCertificates || []).map(record => [record.id, record]));
  function categoryKey(list) {
    const first = list.querySelector('.certificate-entry');
    const category = records.get(first?.dataset.certificateId)?.category;
    return typeof category === 'string' ? category : category?.en || list.dataset.certificateCategory || 'general';
  }
  let editing=false, saved={};
  try { const raw=localStorage.getItem(storageKey); if(raw&&raw.length<50000){ const value=JSON.parse(raw);if(value&&typeof value==='object'&&!Array.isArray(value))saved=value; } } catch {}
  const create=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
  const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
  const toolbar=create('div','certificate-order-toolbar'), toggle=create('button','certificate-order-toggle',labels.edit), hint=create('span','certificate-order-hint',labels.help), live=create('span','certificate-order-announcement');
  toggle.type='button';toggle.title=labels.help;toggle.setAttribute('aria-pressed','false');hint.hidden=true;
  live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');
  toolbar.append(hint,toggle,live);grid.before(toolbar);
  // Pending sources share the same list, without creating certificate records.
  if(upcoming){ [...upcoming.querySelectorAll('.certificate-provider')].filter(node=>!node.hidden).forEach(node=>grid.append(node));upcoming.hidden=true; }
  function cancelAnimations(){animations.forEach(animation=>animation.cancel());animations.clear();}
  function save(){
    const value={};groups.forEach(group=>{value[group.key]=group.nodes.map(node=>group.id(node));});
    try{localStorage.setItem(storageKey,JSON.stringify(value));}catch{}
  }
  function update(group){
    group.nodes.forEach((node,index)=>{const c=group.controls.get(node);c.up.disabled=index===0;c.down.disabled=index===group.nodes.length-1;c.tools.hidden=!editing||group.nodes.length<2;});
  }
  function move(group,node,direction,focusButton){
    const index=group.nodes.indexOf(node), next=index+direction;
    if(index<0||next<0||next>=group.nodes.length) return;
    const before=new Map(group.nodes.map(item=>[item,item.getBoundingClientRect()]));
    cancelAnimations();
    const neighbor=group.nodes[next];
    if(direction<0)group.container.insertBefore(node,neighbor);else group.container.insertBefore(neighbor,node);
    group.nodes[index]=neighbor;group.nodes[next]=node;
    update(group);save();
    if(!reduced.matches&&!document.hidden&&document.documentElement.dataset.effectsPaused!=='true'){
      group.nodes.forEach(item=>{
        const dy=before.get(item).top-item.getBoundingClientRect().top;
        if(Math.abs(dy)<1||typeof item.animate!=='function')return;
        try{
          const animation=item.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});
          animations.add(animation);animation.finished?.catch(()=>{});const done=()=>animations.delete(animation);animation.onfinish=done;animation.oncancel=done;
        }catch{}
      });
    }
    let focusTarget=focusButton;
    if(focusTarget?.disabled){const controls=group.controls.get(node);focusTarget=controls.up.disabled?controls.down:controls.up;}
    focusTarget?.focus({preventScroll:true});
    live.textContent=group.title(node)+' — '+labels.position+' '+(next+1)+' '+labels.of+' '+group.nodes.length+'.';
  }
  function makeGroup(container,nodes,key,id,title,target,legacyKey){
    if(!nodes.length)return;
    const group={container,nodes:[...nodes],key,id,title,controls:new Map()};groups.push(group);
    const previous = Array.isArray(saved[key]) ? saved[key] : saved[legacyKey];
    const order = Array.isArray(previous) ? previous.filter(value => typeof value === 'string') : [];
    const used=new Set(), ordered=[];
    order.forEach(value=>{const node=group.nodes.find(item=>id(item)===value);if(node&&!used.has(node)){ordered.push(node);used.add(node);}});
    group.nodes.forEach(node=>{if(!used.has(node))ordered.push(node);});group.nodes=ordered;
    ordered.forEach(node=>container.append(node));
    ordered.forEach(node=>{
      const tools=create('div','certificate-order-tools'), up=create('button','certificate-order-step','↑'), down=create('button','certificate-order-step','↓');
      tools.setAttribute('role','group');tools.setAttribute('aria-label',labels.group+': '+title(node));
      [up,down].forEach(button=>button.type='button');
      up.setAttribute('aria-label',labels.up+': '+title(node));down.setAttribute('aria-label',labels.down+': '+title(node));up.title=labels.up;down.title=labels.down;
      tools.append(up,down);target(node).append(tools);group.controls.set(node,{tools,up,down});
      // A sort control inside a topic summary must preserve the disclosure state.
      listen(up, 'click', event => {
        event.preventDefault();
        event.stopPropagation();
        move(group, node, -1, up);
      });
      listen(down, 'click', event => {
        event.preventDefault();
        event.stopPropagation();
        move(group, node, 1, down);
      });
      listen(tools,'keydown',event=>{
        if(!event.altKey||(event.key!=='ArrowUp'&&event.key!=='ArrowDown'))return;
        event.preventDefault();event.stopPropagation();move(group,node,event.key==='ArrowUp'?-1:1,event.target);
      });
    });update(group);
  }
  const providers=[...grid.children].filter(node=>node.classList.contains('certificate-provider'));
  makeGroup(grid,providers,'providers',node=>node.dataset.certificateIssuer,node=>node.querySelector('h3').textContent,node=>{
    const head=node.querySelector('.certificate-provider-head'), count=head.querySelector('.certificate-provider-count'), end=create('div','certificate-provider-end');
    if(count)end.append(count);head.append(end);return end;
  });
  providers.forEach(provider => {
    const topics = [...provider.children].filter(node => node.classList.contains('certificate-library-topic'));
    makeGroup(provider, topics, 'topics:' + provider.dataset.certificateIssuer,
      node => categoryKey(node.querySelector('.certificate-category-list')),
      node => node.querySelector('.certificate-category-title').textContent,
      node => node.querySelector('.certificate-library-topic-toggle'));
  });
  [...section.querySelectorAll('.certificate-category-list')].forEach(list=>{
    const entries=[...list.children].filter(node=>node.classList.contains('certificate-entry'));
    const rows=entries.map(entry=>{const row=create('div','certificate-sort-row');row.dataset.certificateId=entry.dataset.certificateId;list.insertBefore(row,entry);row.append(entry);return row;});
    const key = 'items:' + list.dataset.certificateIssuer + ':' + categoryKey(list);
    const legacyKey = 'items:' + list.dataset.certificateIssuer + ':' + (list.dataset.certificateCategory || 'general');
    makeGroup(list, rows, key, node => node.dataset.certificateId,
      node => node.querySelector('h5').textContent, node => node, legacyKey);
  });
  listen(toggle,'click',()=>{
    cancelAnimations();
    editing=!editing;
    if(editing)section.dispatchEvent(new CustomEvent('certificateorderstart'));
    else if(groups.some(group=>[...group.controls.values()].some(c=>c.tools.contains(document.activeElement))))toggle.focus();
    section.classList.toggle('is-certificate-ordering',editing);toggle.setAttribute('aria-pressed',String(editing));toggle.textContent=editing?labels.done:labels.edit;hint.hidden=!editing;groups.forEach(update);
  });
  listen(window, 'portfoliovisualeffectschange', event => {
    if (!event.detail.enabled) cancelAnimations();
  });
  listen(window,'resize',cancelAnimations,{passive:true});listen(reduced,'change',cancelAnimations);
  listen(document,'visibilitychange',()=>{if(document.hidden)cancelAnimations();});
  listen(window,'pagehide',event=>{cancelAnimations();if(!event.persisted)listeners.splice(0).forEach(remove=>remove());});
})();
