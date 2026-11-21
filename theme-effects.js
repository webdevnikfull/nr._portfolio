/* Optional weather and space effects are available in the dark palette only. */
(() => {
 'use strict';
 const root=document.documentElement,buttons=['electric-toggle','cloud-toggle','stars-toggle'].map(id=>document.getElementById(id)).filter(Boolean),saved=new Map();
 const hint={pl:'Dostępne w ciemnym motywie',en:'Available in dark theme',de:'Im dunklen Design verfügbar',uk:'Доступно в темній темі'}[root.lang]||'Available in dark theme';
 function sync(){const dark=root.dataset.theme==='dark';for(const button of buttons){button.closest('.nav-tool-item')?.classList.toggle('is-effect-disabled',!dark);if(!dark){if(button.getAttribute('aria-pressed')==='true'){button.disabled=false;button.click();}if(!saved.has(button))saved.set(button,{label:button.getAttribute('aria-label'),title:button.title});const label=saved.get(button).label||'';button.disabled=true;button.title=hint;button.setAttribute('aria-label',label+' — '+hint);}else{button.disabled=false;const copy=saved.get(button);if(copy){button.setAttribute('aria-label',copy.label||'');button.title=copy.title||'';saved.delete(button);}}}}
 const observer=new MutationObserver(sync);observer.observe(root,{attributes:true,attributeFilter:['data-theme']});window.addEventListener('pageshow',sync);window.addEventListener('pagehide',event=>{if(!event.persisted)observer.disconnect();});sync();
})();
