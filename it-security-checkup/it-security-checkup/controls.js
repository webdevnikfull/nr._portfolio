(() => {
  'use strict';
  const root=document.documentElement;
  const languages={pl:'Polski',en:'English',de:'Deutsch',es:'Español',fr:'Français',uk:'Українська',ru:'Русский'};
  const labels={pl:['Wybierz język','Włącz ciemny motyw','Włącz jasny motyw'],en:['Choose language','Use dark theme','Use light theme'],de:['Sprache wählen','Dunkles Design aktivieren','Helles Design aktivieren'],es:['Elegir idioma','Activar tema oscuro','Activar tema claro'],fr:['Choisir la langue','Activer le thème sombre','Activer le thème clair'],uk:['Вибрати мову','Увімкнути темну тему','Увімкнути світлу тему'],ru:['Выбрать язык','Включить тёмную тему','Включить светлую тему']};
  const picker=document.querySelector('.language-picker'), toggle=document.getElementById('lang'), menu=document.getElementById('lang-menu'), theme=document.getElementById('theme');
  if(!picker||!toggle||!menu||!theme)return;
  const code=()=>languages[root.lang]?root.lang:'en';
  function close(){menu.hidden=true;toggle.setAttribute('aria-expanded','false')}
  function paint(){
    const lang=code(),dark=root.dataset.theme==='dark';
    toggle.querySelector('.lang-code').textContent=lang.toUpperCase();
    toggle.setAttribute('aria-label',labels[lang][0]);
    menu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.lang===lang)));
    theme.setAttribute('aria-label',labels[lang][dark?2:1]);
    theme.setAttribute('aria-pressed',String(dark));
    theme.querySelector('svg').innerHTML=dark?'<path d="M20.7 13.1A9 9 0 0 1 10.9 3.3a9 9 0 1 0 9.8 9.8Z"/>':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
  }
  for(const [lang,name] of Object.entries(languages)){
    const b=document.createElement('button');b.type='button';b.lang=lang;b.dataset.lang=lang;
    const codeLabel=document.createElement('span');codeLabel.textContent=lang.toUpperCase();b.append(codeLabel,document.createTextNode(name));
    b.addEventListener('click',()=>{window.dispatchEvent(new CustomEvent('nr-language-select',{detail:lang}));close();paint();toggle.focus()});
    menu.append(b);
  }
  toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector(`[data-lang="${code()}"]`)?.focus()});
  theme.addEventListener('click',()=>window.dispatchEvent(new Event('nr-theme-toggle')));
  document.addEventListener('click',event=>{if(!event.target.closest('.language-picker'))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){close();toggle.focus()}});
  menu.addEventListener('keydown',event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const items=[...menu.querySelectorAll('button')],index=items.indexOf(document.activeElement),next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus()});
  new MutationObserver(paint).observe(root,{attributes:true,attributeFilter:['lang','data-theme']});
  paint();
})();
