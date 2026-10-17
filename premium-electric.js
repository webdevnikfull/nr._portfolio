/* Pointer light, brief edge traces and staggered section responses. */
(() => {
  'use strict';
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = '.skill-card, .experience-row, .project-card, .education-card, .language-card, .certificate-source, .certificate-card, .volunteer-item';
  const controls = '.section-intro-action, .section-disclosure, .button, .education-tab, .certificate-action, .certificate-more, .project-links a';
  const targets = cards + ', ' + controls;
  const decorated = new Map();
  const chargedAt = new WeakMap();
  const openedAt = new WeakMap();
  let running = false;
  let hovered = null;
  let pointerFrame = 0;
  let pendingPoint = null;

  function prepare(element) {
    let state = decorated.get(element);
    if (state && state.aura.parentNode === element) return state;
    if (state) {
      clearTimeout(state.timer);
      chargedAt.delete(element);
      element.classList.remove('electric-surface-active', 'electric-surface-charged');
    }
    const aura = document.createElement('span');
    aura.className = 'electric-surface-aura';
    aura.setAttribute('aria-hidden', 'true');
    aura.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect x=".4" y=".4" width="99.2" height="99.2" rx="4" pathLength="100" vector-effect="non-scaling-stroke"/></svg>';
    if (element.matches(controls)) element.prepend(aura);
    else element.append(aura);
    element.classList.add('electric-surface');
    if (element.matches(controls)) element.classList.add('electric-control');
    state = { aura, timer: 0 };
    decorated.set(element, state);
    return state;
  }
  function pointAt(element, x, y) {
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--electric-surface-x', Math.max(0, Math.min(rect.width, x - rect.left)).toFixed(1) + 'px');
    element.style.setProperty('--electric-surface-y', Math.max(0, Math.min(rect.height, y - rect.top)).toFixed(1) + 'px');
  }
  function charge(element, delay = 0) {
    if (!running || motion.matches) return;
    const now = performance.now();
    if (now - (chargedAt.get(element) ?? -1000) < 450) return;
    chargedAt.set(element, now);
    const state = prepare(element);
    clearTimeout(state.timer);
    element.classList.remove('electric-surface-charged');
    element.style.setProperty('--electric-surface-delay', delay + 'ms');
    void state.aura.offsetWidth;
    element.classList.add('electric-surface-charged');
    state.timer = setTimeout(() => {
      element.classList.remove('electric-surface-charged');
      state.timer = 0;
      if (element !== hovered && !element.contains(document.activeElement)) element.classList.remove('electric-surface-active');
    }, 1100 + delay);
  }
  function activate(element, x, y, touch = false) {
    prepare(element);
    if (hovered && hovered !== element) hovered.classList.remove('electric-surface-active');
    hovered = touch ? null : element;
    pointAt(element, x, y);
    element.classList.add('electric-surface-active');
    charge(element);
  }
  function surface(target) { return target?.closest?.(targets); }
  function move(event) {
    if (!running || motion.matches || event.isPrimary === false) return;
    const element = surface(event.target);
    if (!element) { leave(); return; }
    pendingPoint = { element, x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (!running || !pendingPoint) return;
      const { element, x, y, touch } = pendingPoint;
      pendingPoint = null;
      if (hovered !== element || touch) activate(element, x, y, touch);
      else pointAt(element, x, y);
    });
  }
  function press(event) {
    if (!running || motion.matches || event.isPrimary === false) return;
    const element = surface(event.target);
    if (element) activate(element, event.clientX, event.clientY, event.pointerType === 'touch');
  }
  function click(event) {
    if (!running || motion.matches) return;
    const element = surface(event.target);
    if (!element) return;
    // Disclosure labels are replaced by their native action; restore decoration afterwards.
    prepare(element);
    charge(element);
  }
  function focus(event) {
    if (!running || motion.matches) return;
    const element = surface(event.target);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    activate(element, rect.left + rect.width * .5, rect.top + 15);
  }
  function leave(event) {
    if (pendingPoint && (!event || !pendingPoint.element.contains(event.relatedTarget))) {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      pendingPoint = null;
    }
    if (hovered && (!event || !hovered.contains(event.relatedTarget))) {
      hovered.classList.remove('electric-surface-active');
      hovered = null;
    }
  }
  function touchMove(event) {
    if (event.touches.length !== 1) { clear(); return; }
    const touch = event.touches[0];
    move({ target: event.target, clientX: touch.clientX, clientY: touch.clientY, pointerType: 'touch' });
  }
  function touchStart(event) {
    if (event.touches.length !== 1) { clear(); return; }
    const touch = event.touches[0];
    press({ target: event.target, clientX: touch.clientX, clientY: touch.clientY, pointerType: 'touch' });
  }
  function clear() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pendingPoint = null;
    hovered = null;
    decorated.forEach((state, element) => {
      clearTimeout(state.timer);
      state.timer = 0;
      chargedAt.delete(element);
      element.classList.remove('electric-surface-active', 'electric-surface-charged');
      for (const property of ['--electric-surface-x', '--electric-surface-y', '--electric-surface-delay']) element.style.removeProperty(property);
    });
  }
  const events = [
    ['pointermove', move], ['pointerdown', press], ['pointerout', leave], ['click', click],
    ['focusin', focus], ['focusout', leave], ['touchstart', touchStart], ['touchmove', touchMove]
  ];
  const observer = new MutationObserver(records => {
    if (!running || motion.matches) return;
    for (const { target } of records) {
      if (!target.matches('.section-intro-action, .section-disclosure') || target.getAttribute('aria-expanded') !== 'true') continue;
      const content = document.getElementById(target.getAttribute('aria-controls'));
      if (!content || content.hidden) continue;
      const now = performance.now();
      if (now - (openedAt.get(content) ?? -1000) < 150) continue;
      openedAt.set(content, now);
      charge(target);
      [...content.querySelectorAll(cards)].slice(0, 8).forEach((card, index) => charge(card, index * 45));
    }
  });
  function sync() {
    const next = root.dataset.electric === 'on' && !motion.matches && !document.hidden;
    if (next === running) return;
    running = next;
    clear();
    if (running) {
      document.querySelectorAll(targets).forEach(prepare);
      events.forEach(([type, handler]) => document.addEventListener(type, handler, { passive: true }));
      observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-expanded'] });
    } else {
      events.forEach(([type, handler]) => document.removeEventListener(type, handler));
      observer.disconnect();
    }
  }
  window.addEventListener('portfolioelectricchange', sync);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  window.addEventListener('blur', clear);
  window.addEventListener('pagehide', clear);
  window.addEventListener('pageshow', sync);
  sync();
})();
