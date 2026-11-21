/* A bounded decorative solar system follows the viewport behind page content. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const system = document.createElement('div');
  system.className = 'solar-system-layer';
  system.setAttribute('aria-hidden', 'true');
  system.hidden = true;
  document.body.append(system);
  const bodies = [
    ['sun', 0, 900, 0],
    ['mercury', .34, 900, 0],
    ['venus', .43, 900, .125],
    ['earth', .52, 900, .25],
    ['mars', .61, 900, .375],
    ['jupiter', .70, 900, .5],
    ['saturn', .79, 900, .625],
    ['uranus', .88, 900, .75],
    ['neptune', .97, 900, .875]
  ].map(([name, radius, duration, phase]) => {
    const traveller = document.createElement('div');
    traveller.className = name === 'sun' ? 'solar-traveller solar-primary' : 'solar-traveller';
    traveller.style.setProperty('--solar-duration', duration + 's');
    traveller.style.setProperty('--solar-delay', (-duration * phase) + 's');
    traveller.style.setProperty('--solar-phase', (phase * 100) + '%');
    const sphere = document.createElement('i');
    sphere.className = 'solar-sphere solar-' + name;
    traveller.append(sphere);
    if (name === 'earth') {
      const lunarOrbit = document.createElement('span');
      lunarOrbit.className = 'solar-lunar-orbit';
      const moon = document.createElement('i');
      moon.className = 'solar-moon';
      lunarOrbit.append(moon);
      traveller.append(lunarOrbit);
    }
    system.append(traveller);
    return { traveller, radius };
  });
  let width = 0, height = 0;
  function fit() {
    const w = root.clientWidth || window.innerWidth;
    const h = window.innerHeight;
    if (w === width && h === height) return;
    width = w; height = h;
    system.style.setProperty('--solar-scale',Math.min(1,Math.max(.38,w / 900)));
    const inset = Math.min(66, w * .2, h * .2);
    const cx = w / 2, cy = h / 2;
    bodies.forEach(({ traveller, radius }) => {
      if (radius === 0) return;
      const rx = Math.max(1, (cx - inset) * radius);
      const ry = Math.max(1, (cy - inset) * radius);
      const path = `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 1 ${rx * 2} 0 a ${rx} ${ry} 0 1 1 ${-rx * 2} 0 Z`;
      traveller.style.setProperty('--solar-path', `path("${path}")`);
    });
  }
  function sync() {
    const active = root.dataset.stars === 'on' && root.dataset.theme === 'dark';
    system.hidden = !active;
    system.classList.toggle('is-solar-paused', document.hidden || reduced.matches);
    if (active) fit();
  }
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes:true, attributeFilter:['data-stars', 'data-theme'] });
  window.addEventListener('portfoliostarschange', sync);
  window.addEventListener('resize', fit, { passive:true });
  window.addEventListener('pageshow', sync);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', event => {
    system.classList.add('is-solar-paused');
    if (!event.persisted) {
      observer.disconnect();
      window.removeEventListener('portfoliostarschange', sync);
      window.removeEventListener('resize', fit);
      window.removeEventListener('pageshow', sync);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
    }
  });
  fit(); sync();
})();
