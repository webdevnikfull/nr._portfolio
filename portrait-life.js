/* Natural motion works in either theme and pauses without timers or animation frames. */
(() => {
  'use strict';
  const frame = document.querySelector('.portrait-frame');
  const photo = frame?.querySelector('.portrait-photo-motion img');
  const viewport = frame?.querySelector('.portrait-image-wrap');
  if (!frame || !photo || !viewport) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;
  let loaded = photo.complete && photo.naturalWidth > 0;
  let leaving = false;
  function sync() {
    frame.dataset.portraitMotion = loaded && inView && !document.hidden && !reduced.matches && !leaving ? 'active' : 'paused';
  }
  photo.addEventListener('load', () => { loaded = true; sync(); });
  photo.addEventListener('error', () => { loaded = false; sync(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      sync();
    }, { threshold: .08 });
    observer.observe(viewport);
  }
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { leaving = true; sync(); });
  window.addEventListener('pageshow', () => { leaving = false; sync(); });
  sync();
})();
