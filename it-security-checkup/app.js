(() => {
  'use strict';
  const KEY='nr-security-checkup-v1';
  const dictionary=window.NRSecurityLanguages;
  const $=selector=>document.querySelector(selector);
  const store={get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};
  let saved;try{saved=JSON.parse(store.get(KEY)||'null')}catch{saved=null}
  const preferred=store.get('nr-studio-language');
  const state={done:Array.isArray(saved?.done)?[...new Set(saved.done.filter(i=>Number.isInteger(i)&&i>=0&&i<6))]:[],theme:store.get('qa-portfolio-theme')||store.get('nr-security-theme')||saved?.theme||'light',lang:dictionary[saved?.lang]?saved.lang:dictionary[preferred]?preferred:'en'};
  if(!['light','dark'].includes(state.theme))state.theme='light';
  const checks=[['mfa','access'],['updates','categoryDevices'],['privilege','access'],['backup','recovery'],['phishing','awareness'],['protection','categoryDevices']];
  const devices=[['NR-LT-001','ThinkPad T14','windows',78],['NR-PC-002','Dell OptiPlex','office',92],['NR-PR-003','Office printer','shared',54],['NR-NW-004','Network switch','infrastructure',86]];
  let filter='all';
  const t=key=>dictionary[state.lang]?.[key]||dictionary.en[key]||key;
  const save=()=>store.set(KEY,JSON.stringify(state));
  function render(){
    document.documentElement.lang=state.lang;
    document.documentElement.dataset.theme=state.theme;
    document.querySelector('meta[name="description"]').content=t('meta');
    document.querySelectorAll('[data-i]').forEach(el=>{el.textContent=t(el.dataset.i)});
    $('#crumb').textContent=t('navOverview');
    $('#hero-title').innerHTML=t('heroTitle');
    $('#checks').innerHTML=checks.map(([key,category],i)=>{
      const done=state.done.includes(i);
      return `<article class="check ${done?'done':''}" data-status="${done?'done':'open'}"><span class="check-mark" aria-hidden="true">${done?'✓':'○'}</span><div><h3>${t(key)}</h3><p>${t(key+'Desc')}</p></div><button type="button" data-check="${i}" aria-pressed="${done}">${t(done?'undo':'markDone')}</button><span class="tag">${t(category)}</span></article>`;
    }).join('');
    const count=state.done.length,percent=Math.round(count/checks.length*100);
    $('#score').textContent=percent+'%';$('#ring').style.setProperty('--p',percent+'%');
    $('#open').textContent=checks.length-count;$('#ready').textContent=count;$('#device-count').textContent=devices.length;
    $('#score-label').textContent=t(count===checks.length?'reviewComplete':'reviewInProgress');
    $('#score-copy').textContent=t('scoreCopy');
    $('#devices-list').innerHTML=devices.map(([tag,name,type,percent])=>`<article class="device"><div class="device-top"><strong>${name}</strong><span class="tag">${tag}</span></div><small>${t(type)}</small><div class="meter"><i style="width:${percent}%"></i></div><div class="device-actions"><span>${percent}% ${t('readiness')}</span></div></article>`).join('');
    document.querySelectorAll('.filter-button').forEach(button=>button.classList.toggle('active',button.dataset.filter===filter));
    document.querySelectorAll('.check').forEach(row=>row.hidden=filter!=='all'&&row.dataset.status!==filter);
  }
  document.addEventListener('click',event=>{
    const check=event.target.closest('[data-check]');
    if(check){const i=Number(check.dataset.check);state.done=state.done.includes(i)?state.done.filter(x=>x!==i):[...state.done,i];save();render();return}
    if(event.target.closest('#reset')){state.done=[];save();render();return}
    const button=event.target.closest('[data-filter]');
    if(button){filter=button.dataset.filter;render()}
  });
  window.addEventListener('nr-language-select',event=>{if(!dictionary[event.detail])return;state.lang=event.detail;store.set('nr-studio-language',state.lang);save();render()});
  window.addEventListener('nr-theme-toggle',()=>{state.theme=state.theme==='dark'?'light':'dark';store.set('nr-security-theme',state.theme);store.set('qa-portfolio-theme',state.theme);save();render()});
  render();
})();
