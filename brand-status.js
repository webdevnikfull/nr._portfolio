/* Event-driven signature feedback. Links keep their native navigation. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [
    { element: document.querySelector('.site-header .brand'), dot: 'span:first-child', strength: .55, brand: true },
    { element: document.querySelector('.hero-copy > .availability'), dot: '.status-dot', strength: .45, brand: false }
  ].filter(entry => entry.element);
  if (!entries.length) return;
  const listeners = [];
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };
  const clear = () => entries.forEach(entry => entry.element.classList.remove('is-brand-status-active'));
  const respond = entry => {
    if (document.hidden || reduced.matches) return;
    const now = performance.now();
    if (entry.lastAt !== undefined && now - entry.lastAt < 260) return;
    entry.lastAt = now;
    const element = entry.element;
    element.classList.remove('is-brand-status-active');
    void element.offsetWidth;
    element.classList.add('is-brand-status-active');
    if (root.dataset.electric !== 'on' || !window.PortfolioElectric?.isEnabled()) return;
    const dot = element.querySelector(entry.dot);
    if (!dot) return;
    const rect = dot.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = entry.brand ? rect.bottom - rect.height * .16 : rect.top + rect.height / 2;
    if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) return;
    window.PortfolioElectric.burst(x, y, entry.strength);
  };
  entries.forEach(entry => {
    const element = entry.element;
    if ('PointerEvent' in window) {
      listen(element, 'pointerenter', event => { if (event.pointerType === 'mouse') respond(entry); }, { passive: true });
      listen(element, 'pointerdown', event => { if (event.button === undefined || event.button === 0) respond(entry); }, { passive: true });
    } else {
      listen(element, 'mouseenter', () => respond(entry), { passive: true });
      listen(element, 'touchstart', () => respond(entry), { passive: true });
    }
    listen(element, 'focusin', () => respond(entry));
    listen(element, 'click', event => { if (event.detail === 0) respond(entry); });
    listen(element, 'animationend', event => {
      if (/^(signature-|status-)/.test(event.animationName)) element.classList.remove('is-brand-status-active');
    });
  });
  const pause = () => {
    root.classList.toggle('brand-status-paused', document.hidden);
    if (document.hidden) clear();
  };
  listen(document, 'visibilitychange', pause);
  listen(window, 'portfolioelectricchange', clear);
  listen(reduced, 'change', clear);
  listen(window, 'pageshow', pause);
  listen(window, 'pagehide', event => {
    clear();
    root.classList.add('brand-status-paused');
    if (!event.persisted) listeners.splice(0).forEach(remove => remove());
  });
  pause();
})();
