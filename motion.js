/* Reveal only through Web Animations: content stays visible if scripting fails. */
(() => {
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const animations=new Set();
 let observer;
 if ('IntersectionObserver' in window && !preference.matches) {
  observer=new IntersectionObserver(entries=>{
   entries.filter(e=>e.isIntersecting).forEach((entry,index)=>{
    observer.unobserve(entry.target);
    if(preference.matches || entry.target.getBoundingClientRect().top<0)return;
    const animation=entry.target.animate([{opacity:0,translate:'0 16px'},{opacity:1,translate:'0 0'}],{duration:560,delay:Math.min(index,3)*55,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    animations.add(animation);
    animation.finished.then(()=>animations.delete(animation)).catch(()=>{});
   });
  },{threshold:.08});
  document.querySelectorAll('.hero-copy,.hero-visual,.section-heading,.skill-card,.experience-row,.project-card,.education-heading,.education-list article,.contact-text').forEach(el=>observer.observe(el));
 }
 preference.addEventListener('change',()=>{if(preference.matches){observer?.disconnect();animations.forEach(a=>a.cancel());animations.clear();}});
 document.addEventListener('focusin',()=>{animations.forEach(a=>a.finish());});
})();
