/* Manual toolbar collapse; portrait auto-collapses once scrolling begins. */
(() => {
  'use strict';
  const root = document.documentElement;
  const labels = {
    pl:['Ukryj pasek','Pokaż pasek','Ukryj zdjęcie','Pokaż zdjęcie'],
    en:['Hide toolbar','Show toolbar','Hide photo','Show photo'],
    de:['Leiste ausblenden','Leiste anzeigen','Foto ausblenden','Foto anzeigen'],
    uk:['Приховати панель','Показати панель','Приховати фото','Показати фото']
  }[root.lang] || ['Hide toolbar','Show toolbar','Hide photo','Show photo'];
  const header = document.querySelector('.site-header');
  const photo = document.querySelector('.portrait-image-wrap');
  const visual = document.querySelector('.hero-visual');
  const listeners = [], observers = [];
  let toolbarClosed = false, photoClosed = false, autoDismissed = false, awaitingWelcome = false;
  let headerButton, photoButton, slot;
  const initialY = window.scrollY || 0;
  function listen(target, type, fn, options) {
    target.addEventListener(type,fn,options);
    listeners.push(() => target.removeEventListener(type,fn,options));
  }
  function control(className, label, id) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = className;
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5"/></svg>';
    const text = document.createElement('span'); text.textContent = label;
    button.append(text); button.setAttribute('aria-controls',id); button.setAttribute('aria-expanded','true');
    return button;
  }
  function collapseToolbar(closed) {
    toolbarClosed = closed;
    if (closed && header.contains(document.activeElement)) headerButton.focus({preventScroll:true});
    root.classList.toggle('is-toolbar-collapsed',closed);
    header.inert = closed;
    if (closed) header.setAttribute('aria-hidden','true'); else header.removeAttribute('aria-hidden');
    headerButton.setAttribute('aria-expanded',String(!closed));
    headerButton.querySelector('span').textContent = labels[closed ? 1 : 0];
    const menu = header.querySelector('.main-nav');
    if (closed) {
      menu?.classList.remove('is-open');
      header.querySelector('#menu-toggle')?.setAttribute('aria-expanded','false');
      header.querySelectorAll('details[open]').forEach(item => item.open = false);
    }
  }
  function collapsePhoto(closed) {
    if (!photoButton) return;
    photoClosed = closed;
    if (closed && photo.contains(document.activeElement)) photoButton.focus({preventScroll:true});
    root.classList.toggle('is-portrait-collapsed',closed);
    photo.inert = closed;
    if (closed) photo.setAttribute('aria-hidden','true'); else photo.removeAttribute('aria-hidden');
    photoButton.setAttribute('aria-expanded',String(!closed));
    photoButton.querySelector('span').textContent = labels[closed ? 3 : 2];
    window.dispatchEvent(new CustomEvent('portfolioportraitvisibilitychange',{detail:{visible:!closed}}));
  }
  if (header) {
    header.id ||= 'portfolio-toolbar';
    const shell = document.createElement('div'); shell.className = 'toolbar-visibility-shell';
    header.parentNode.insertBefore(shell,header); shell.append(header);
    headerButton = control('toolbar-visibility-toggle',labels[0],header.id);
    document.body.append(headerButton);
    listen(headerButton,'click',() => collapseToolbar(!toolbarClosed));
    const nav = header.querySelector('.nav-shell');
    const measure = () => root.style.setProperty('--portfolio-toolbar-height',(nav?.offsetHeight || 72) + 'px');
    if ('ResizeObserver' in window && nav) { const observer = new ResizeObserver(measure); observer.observe(nav); observers.push(observer); }
    listen(window,'resize',measure,{passive:true}); measure();
  }
  if (photo && visual) {
    photo.id ||= 'portfolio-portrait-image';
    slot = document.createElement('div'); slot.className = 'portrait-visibility-slot';
    photo.parentNode.insertBefore(slot,photo); slot.append(photo);
    const measurePhoto = () => {
      // Measure the photo itself even while its parent is being clipped.
      if (photo.offsetHeight) slot.style.setProperty('--portrait-open-height',photo.offsetHeight + 'px');
    };
    if ('ResizeObserver' in window) { const observer = new ResizeObserver(measurePhoto); observer.observe(photo); observers.push(observer); }
    listen(window,'resize',measurePhoto,{passive:true}); measurePhoto();
    const tools = document.createElement('div'); tools.className = 'portrait-visibility-tools';
    photoButton = control('portrait-visibility-toggle',labels[2],photo.id); tools.append(photoButton); visual.append(tools);
    listen(photoButton,'click',() => { autoDismissed = true; awaitingWelcome = false; collapsePhoto(!photoClosed); });
    const scroll = () => {
      if (autoDismissed || Math.abs((window.scrollY || 0) - initialY) < 24) return;
      const welcome = document.querySelector('.portrait-welcome');
      if (welcome?.open && !welcome.hidden && (welcome.classList.contains('is-welcome-typing') || welcome.classList.contains('is-welcome-finishing'))) { awaitingWelcome = true; return; }
      autoDismissed = true; collapsePhoto(true);
    };
    listen(window,'scroll',scroll,{passive:true});
    listen(window,'portfoliowelcomefinished',() => { if (awaitingWelcome && !autoDismissed) { awaitingWelcome = false; autoDismissed = true; collapsePhoto(true); } });
  }
  listen(window,'pagehide',event => {
    if (!event.persisted) { observers.forEach(observer => observer.disconnect()); listeners.splice(0).forEach(off => off()); }
  });
})();
