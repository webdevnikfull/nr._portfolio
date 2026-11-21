/* Captions remain outside the original native controls. */
(() => {
 'use strict';
 const captions={pl:['Języki','Tematyka','Piorunek','Chmurka'],en:['Languages','Theme','Lightning','Cloud'],de:['Sprachen','Design','Blitz','Wolke'],uk:['Мови','Тема','Блискавка','Хмаринка']}[document.documentElement.lang]||['Languages','Theme','Lightning','Cloud'];
 const controls=[document.querySelector('.language-switch'),document.getElementById('theme-toggle'),document.getElementById('electric-toggle'),document.getElementById('cloud-toggle')];
 controls.forEach((control,i)=>{if(!control||control.parentNode?.classList.contains('nav-tool-item'))return;const wrap=document.createElement('div'),caption=document.createElement('span');wrap.className='nav-tool-item';caption.className='nav-tool-caption';caption.textContent=captions[i];caption.setAttribute('aria-hidden','true');control.parentNode.insertBefore(wrap,control);wrap.append(control,caption);});
})();
