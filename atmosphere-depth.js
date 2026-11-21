/* Decorative background layers stay below content and never capture input. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = document.querySelector('.portrait-image-wrap');
  const orbit = document.createElement('div');
  orbit.className = 'theme-orb-layer';
  orbit.setAttribute('aria-hidden', 'true');
  const traveller = document.createElement('div');
  traveller.className = 'theme-orbit-traveller';
  orbit.append(traveller);
  for (const name of ['moon', 'sun']) {
    const orb = document.createElement('i');
    orb.className = 'theme-orb theme-' + name;
    traveller.append(orb);
  }
  document.body.append(orbit);
  // A viewport path keeps the slow orbit present throughout the whole page.
  // Only the small traveller moves; switching theme keeps the same orbital phase.
  function fitOrbit() {
    const width = root.clientWidth || window.innerWidth, height = window.innerHeight;
    orbit.hidden = width < 96 || height < 96;
    if (orbit.hidden) return;
    const inset = Math.min(60, Math.max(44, width * .08), Math.min(width, height) * .25);
    const cx = width / 2, cy = height / 2;
    const rx = Math.max(1, cx - inset), ry = Math.max(1, cy - inset);
    const path = `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 1 ${rx * 2} 0 a ${rx} ${ry} 0 1 1 ${-rx * 2} 0 Z`;
    traveller.style.setProperty('--theme-orbit-path', `path("${path}")`);
  }
  const orbitResize = 'ResizeObserver' in window ? new ResizeObserver(fitOrbit) : null;
  orbitResize?.observe(root);
  window.addEventListener('resize', fitOrbit, { passive:true });
  window.addEventListener('pageshow', fitOrbit);
  fitOrbit();

  function makeWind(parent, className, count) {
    const layer = document.createElement('div');
    layer.className = className;
    layer.setAttribute('aria-hidden', 'true');
    layer.hidden = true;
    for (let i = 0; i < count; i++) {
      const gust = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      gust.setAttribute('viewBox', '0 0 240 50');
      gust.setAttribute('class', 'breeze-gust');
      gust.style.setProperty('--gust-y', ((i * 23 + 11) % 93) + '%');
      gust.style.setProperty('--gust-delay', (-i * 3.7) + 's');
      gust.style.setProperty('--gust-time', (16 + i % 4 * 3) + 's');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M2 31C48 31 59 10 107 15S172 42 237 20M31 41C81 44 101 23 145 28S181 38 199 29c23-18 43-8 33 6s-26 3-17-6');
      gust.append(path);
      layer.append(gust);
    }
    parent.append(layer);
    return layer;
  }
  const pageWind = makeWind(document.body, 'page-breeze-layer', 10);
  const portraitWind = portrait ? makeWind(portrait, 'portrait-breeze-layer', 4) : null;
  if (portraitWind) {
    for (let i = 0; i < 3; i++) {
      const mist = document.createElement('i');
      mist.className = 'portrait-breeze-mist';
      mist.style.setProperty('--mist-y', (12 + i * 30) + '%');
      mist.style.setProperty('--mist-delay', (-i * 9) + 's');
      portraitWind.append(mist);
    }
  }
  function sync() {
    const on = root.dataset.cloud === 'on' && root.dataset.theme === 'dark' && !document.hidden && !reduced.matches;
    pageWind.hidden = !on;
    if (portraitWind) portraitWind.hidden = !on;
    root.classList.toggle('atmosphere-paused', document.hidden);
  }
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-cloud'] });
  window.addEventListener('portfoliocloudchange', sync);
  window.addEventListener('pageshow', sync);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', event => {
    pageWind.hidden = true;
    if (portraitWind) portraitWind.hidden = true;
    root.classList.add('atmosphere-paused');
    if (!event.persisted) {
      observer.disconnect();
      orbitResize?.disconnect();
      window.removeEventListener('resize', fitOrbit);
      window.removeEventListener('pageshow', fitOrbit);
      window.removeEventListener('portfoliocloudchange', sync);
      window.removeEventListener('pageshow', sync);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
    }
  });
  sync();
})();
