/* Replayable miniature apps; no changes to the surrounding project cards. */
(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const narrow = window.matchMedia('(max-width: 400px)');
  const panels = [...document.querySelectorAll('#projects .project-demo-panel')];
  if (!panels.length) return;
  const previews = panels.map(panel => panel.closest('.project-visual'));
  const timers = new Map();
  let frame = 0;
  let pending = null;
  const labels = {
    pl: 'Odtwórz animację podglądu',
    en: 'Replay preview animation',
    de: 'Vorschauanimation wiederholen',
    uk: 'Повторити анімацію перегляду'
  };
  const label = labels[document.documentElement.lang] || labels.pl;

  function sizePanels() {
    const widths = previews.map(preview => preview.clientWidth).filter(width => width > 0);
    if (!widths.length) return; // A collapsed section is measured when it opens.
    const width = Math.max(0, Math.min(352, Math.min(...widths) - (narrow.matches ? 40 : 48)));
    panels.forEach(panel => panel.style.setProperty('--demo-panel-width', width.toFixed(2) + 'px'));
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(sizePanels);
    previews.forEach(preview => observer.observe(preview));
  } else {
    window.addEventListener('resize', sizePanels, { passive: true });
    // Also handle the existing section disclosure on older browsers.
    document.addEventListener('click', sizePanels, { passive: true });
  }
  narrow.addEventListener('change', sizePanels);
  sizePanels();

  function clearPoint(panel) {
    for (const property of ['--demo-x', '--demo-y', '--demo-pitch', '--demo-yaw']) panel.style.removeProperty(property);
  }
  function leave(panel) {
    panel.classList.remove('is-demo-hover');
    clearPoint(panel);
    if (pending?.panel === panel) {
      pending = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  function clear() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    pending = null;
    timers.forEach(clearTimeout);
    timers.clear();
    panels.forEach(panel => { leave(panel); panel.classList.remove('is-demo-running'); });
  }
  function play(panel) {
    clearTimeout(timers.get(panel));
    timers.delete(panel);
    panel.classList.remove('is-demo-running');
    if (document.hidden || preference.matches) return;
    // Reset only this miniature's looping effects, leaving the background orbits alone.
    panel.getAnimations?.({ subtree: true }).forEach(animation => {
      if (animation.effect?.getTiming().iterations === Infinity) animation.currentTime = 0;
    });
    void panel.offsetWidth;
    panel.classList.add('is-demo-running');
    timers.set(panel, setTimeout(() => {
      panel.classList.remove('is-demo-running');
      timers.delete(panel);
    }, 1050));
  }
  panels.forEach(panel => {
    const preview = panel.closest('.project-visual');
    const card = panel.closest('.project-card');
    preview.removeAttribute('aria-hidden');
    preview.querySelectorAll('.visual-label, .visual-footnote').forEach(element => element.setAttribute('aria-hidden', 'true'));
    if (!panel.querySelector('.text-demo-copy')) {
      [...panel.children].forEach(element => element.setAttribute('aria-hidden', 'true'));
      const name = card.querySelector('.project-content h3')?.textContent.trim() || '';
      panel.setAttribute('aria-label', label + (name ? ': ' + name : ''));
    }
    panel.setAttribute('role', 'button');
    panel.tabIndex = 0;
    panel.addEventListener('click', event => {
      if (!event.target.closest('button, a, input, textarea, select')) play(panel);
    });
    panel.addEventListener('keydown', event => {
      if (event.target !== panel || event.repeat || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      panel.click();
    });
    panel.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && fine.matches && !preference.matches && !document.hidden) panel.classList.add('is-demo-hover');
    }, { passive: true });
    panel.addEventListener('pointermove', event => {
      if (!fine.matches || preference.matches || document.hidden || event.pointerType === 'touch' || event.isPrimary === false) return;
      pending = { panel, x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pending || preference.matches || document.hidden) return;
        const point = pending;
        pending = null;
        const rect = point.panel.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height));
        point.panel.style.setProperty('--demo-x', (x * 100).toFixed(1) + '%');
        point.panel.style.setProperty('--demo-y', (y * 100).toFixed(1) + '%');
        point.panel.style.setProperty('--demo-pitch', ((.5 - y) * 3).toFixed(2) + 'deg');
        point.panel.style.setProperty('--demo-yaw', ((x - .5) * 4).toFixed(2) + 'deg');
      });
    }, { passive: true });
    panel.addEventListener('pointerleave', () => leave(panel), { passive: true });
    panel.addEventListener('pointercancel', () => leave(panel), { passive: true });
    panel.addEventListener('focusout', event => { if (!panel.contains(event.relatedTarget)) leave(panel); });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  preference.addEventListener('change', () => { if (preference.matches) clear(); });
  window.addEventListener('pagehide', clear);
  window.addEventListener('blur', clear);
})();
