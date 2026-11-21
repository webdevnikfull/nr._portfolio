(() => {
  'use strict';
  const root=document.documentElement;
  const language=document.getElementById('lang');
  const theme=document.getElementById('theme');
  if(!language||!theme)return;
  const labels={
    pl:['Język aplikacji','Włącz ciemny motyw','Włącz jasny motyw'],
    en:['App language','Use dark theme','Use light theme'],
    de:['App-Sprache','Dunkles Design aktivieren','Helles Design aktivieren'],
    es:['Idioma de la aplicación','Activar tema oscuro','Activar tema claro'],
    fr:['Langue de l’application','Activer le thème sombre','Activer le thème clair'],
    uk:['Мова застосунку','Увімкнути темну тему','Увімкнути світлу тему'],
    ru:['Язык приложения','Включить тёмную тему','Включить светлую тему']
  };
  const code=()=>labels[root.lang]?root.lang:'en';
  function paint(){
    const current=code();
    const dark=root.dataset.theme==='dark';
    language.value=current;
    language.setAttribute('aria-label',labels[current][0]);
    theme.setAttribute('aria-label',labels[current][dark?2:1]);
    theme.setAttribute('aria-pressed',String(dark));
    theme.querySelector('svg').innerHTML=dark
      ? '<path d="M20.7 13.1A9 9 0 0 1 10.9 3.3a9 9 0 1 0 9.8 9.8Z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
  }
  language.addEventListener('change',()=>window.dispatchEvent(new CustomEvent('nr-language-select',{detail:language.value})));
  theme.addEventListener('click',()=>window.dispatchEvent(new Event('nr-theme-toggle')));
  new MutationObserver(paint).observe(root,{attributes:true,attributeFilter:['lang','data-theme']});
  paint();
})();
