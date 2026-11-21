(() => {
 'use strict';
 const image=document.querySelector('.portrait-image-wrap');if(!image)return;
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('span');layer.className='portrait-cloud-burst';layer.setAttribute('aria-hidden','true');layer.innerHTML='<i></i><i></i><i></i><i></i>';image.append(layer);
 const original=['role','tabindex','aria-label'].map(k=>[k,image.getAttribute(k)]);
 const labels={pl:'Rozwiń obłoki na zdjęciu',en:'Release clouds around the portrait',de:'Wolken um das Porträt entfalten',uk:'Розгорнути хмари навколо портрета'};
 let timer=0,last=-Infinity,owned=false;const listeners=[];
 function stop(){clearTimeout(timer);timer=0;layer.classList.remove('is-cloud-burst');}
 function sync(){stop();const on=root.dataset.cloud==='on'&&!reduced.matches;if(on){owned=true;image.setAttribute('role','button');image.setAttribute('tabindex','0');image.setAttribute('aria-label',labels[root.lang]||labels.en);}else if(owned){owned=false;if(root.dataset.electric!=='on')original.forEach(([k,v])=>v===null?image.removeAttribute(k):image.setAttribute(k,v));}}
 function burst(){if(root.dataset.cloud!=='on'||reduced.matches||document.hidden||performance.now()-last<450)return;last=performance.now();stop();void layer.offsetWidth;layer.classList.add('is-cloud-burst');timer=setTimeout(stop,3000);}
 function listen(t,k,f){t.addEventListener(k,f);listeners.push(()=>t.removeEventListener(k,f));}
 listen(image,'click',burst);listen(image,'keydown',e=>{if(root.dataset.cloud==='on'&&e.target===image&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(!e.repeat)burst();}});
 listen(window,'portfoliocloudchange',sync);listen(reduced,'change',sync);listen(document,'visibilitychange',()=>{if(document.hidden)stop();});listen(window,'pagehide',e=>{stop();if(!e.persisted)listeners.splice(0).forEach(off=>off());});sync();
})();
