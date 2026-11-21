/* Rain belongs exclusively to electric mode, on the page and in the photo. */
(() => {
 'use strict';
 const root=document.documentElement,photo=document.querySelector('.portrait-image-wrap'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const create=(className,parent,count)=>{const layer=document.createElement('span');layer.className=className;layer.setAttribute('aria-hidden','true');layer.hidden=true;for(let i=0;i<count;i++){const drop=document.createElement('i');drop.className='electric-raindrop';drop.style.left=((i+Math.random())/count*110)+'%';drop.style.setProperty('--rain-time',(.7+Math.random()*.8)+'s');drop.style.setProperty('--rain-delay',(-Math.random()*2)+'s');drop.style.setProperty('--rain-length',(13+Math.random()*20)+'px');layer.append(drop);}parent.append(layer);return layer;};
 const page=create('electric-page-rain',document.body,76),portrait=photo?create('electric-portrait-rain',photo,28):null;
 function sync(){const on=root.dataset.electric==='on'&&!document.hidden&&!reduced.matches;page.hidden=!on;if(portrait){portrait.hidden=!on;portrait.style.setProperty('--rain-travel',(photo.getBoundingClientRect().height+70)+'px');}}
 window.addEventListener('portfolioelectricchange',sync);window.addEventListener('portfoliocloudchange',sync);window.addEventListener('portfoliostarschange',sync);window.addEventListener('resize',sync,{passive:true});document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('pageshow',sync);window.addEventListener('pagehide',()=>{page.hidden=true;if(portrait)portrait.hidden=true;});sync();
})();
