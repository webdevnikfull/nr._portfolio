/* Bounded disclosure and list motion. Native details remains the fallback. */
(() => {
  'use strict';
  const section = document.getElementById('certificates');
  const region = document.getElementById('certificates-details');
  if (!section) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [...section.querySelectorAll('.certificate-entry')];
  const summaries = entries.map(card => card.querySelector('summary'));
  const states = entries.map((card, i) => ({ card, summary: summaries[i], content: card.querySelector('.certificate-entry-content'), want: card.open, animation: null, version: 0 })).filter(s => s.summary && s.content);
  const listeners = [], reveals = new Set();
  let inView = !('IntersectionObserver' in window), revealedForOpen = false, pointerFrame = 0, point = null, pointed = null;
  const listen = (target, type, fn, options) => { target.addEventListener(type, fn, options); listeners.push(() => target.removeEventListener(type, fn, options)); };
  const canAnimate = content => !reduced.matches && !document.hidden && typeof content.animate === 'function';
  function settle(state, open = state.want) {
    state.version++;
    if (state.animation) {
      state.animation.onfinish = null;
      state.animation.oncancel = null;
      state.animation.cancel();
      state.animation = null;
    }
    state.want = open;
    state.card.open = open;
    state.content.inert = false;
    state.content.style.removeProperty('height');
    state.content.style.removeProperty('opacity');
    delete state.card.dataset.certificateMotion;
  }
  function transition(state, open) {
    const wasOpen = state.card.open;
    const height = wasOpen ? state.content.getBoundingClientRect().height : 0;
    const opacity = wasOpen ? Number.parseFloat(window.getComputedStyle(state.content).opacity) : 0;
    if (state.animation) {
      state.animation.onfinish = null;
      state.animation.oncancel = null;
      state.animation.cancel();
    }
    const version = ++state.version;
    state.want = open;
    if (!open && state.content.contains(document.activeElement)) state.summary.focus({ preventScroll: true });
    state.card.open = true;
    state.content.inert = !open;
    state.card.dataset.certificateMotion = open ? 'opening' : 'closing';
    state.content.style.height = height + 'px';
    const target = open ? state.content.scrollHeight : 0;
    const duration = Math.min(460, Math.max(280, 280 + Math.abs(target - height) * .16));
    try {
      const animation = state.content.animate([
        { height: height + 'px', opacity: Number.isFinite(opacity) ? opacity : 1 },
        { height: target + 'px', opacity: open ? 1 : 0 }
      ], { duration, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' });
      state.animation = animation;
      animation.finished?.catch(() => {});
      animation.onfinish = () => { if (state.version === version) settle(state, open); };
    } catch { settle(state, open); }
  }
  states.forEach(state => {
    listen(state.summary, 'click', event => {
      if (event.defaultPrevented || (event.button !== undefined && event.button !== 0) || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !canAnimate(state.content)) return;
      event.preventDefault();
      transition(state, state.animation ? !state.want : !state.card.open);
    });
    listen(state.card, 'toggle', () => {
      if (state.animation && !state.card.open) settle(state, false);
      else if (!state.animation) state.want = state.card.open;
    });
  });
  function clearPointer() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0; point = null;
    if (pointed) {
      pointed.classList.remove('is-certificate-pointed');
      pointed.style.removeProperty('--certificate-pointer-x');
      pointed.style.removeProperty('--certificate-pointer-y');
      pointed = null;
    }
  }
  summaries.filter(Boolean).forEach(summary => {
    listen(summary, 'pointermove', event => {
      if (reduced.matches || document.hidden || event.pointerType === 'touch' || event.isPrimary === false) return;
      point = { summary, x: event.clientX, y: event.clientY };
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!point || document.hidden || reduced.matches) return;
        const next = point; point = null;
        if (pointed && pointed !== next.summary) clearPointer();
        pointed = next.summary;
        const rect = pointed.getBoundingClientRect();
        pointed.style.setProperty('--certificate-pointer-x', Math.max(0, Math.min(rect.width, next.x - rect.left)) + 'px');
        pointed.style.setProperty('--certificate-pointer-y', Math.max(0, Math.min(rect.height, next.y - rect.top)) + 'px');
        pointed.classList.add('is-certificate-pointed');
      });
    }, { passive: true });
    listen(summary, 'pointerleave', clearPointer, { passive: true });
    listen(summary, 'pointercancel', clearPointer, { passive: true });
  });
  function cancelReveal() {
    reveals.forEach(animation => animation.cancel()); reveals.clear();
    section.classList.remove('is-certificate-list-revealing');
  }
  function reveal() {
    if ((region && region.hidden) || !inView || document.hidden || revealedForOpen) return;
    revealedForOpen = true;
    if (reduced.matches || document.documentElement.dataset.effectsPaused === 'true') return;
    const providers = [...section.querySelectorAll('.certificate-provider')].filter(node => !node.hidden && node.getBoundingClientRect().height > 0);
    providers.forEach((node, index) => {
      if (typeof node.animate !== 'function') return;
      let animation;
      try {
        animation = node.animate([{ opacity: 0, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 390, delay: Math.min(index, 7) * 65, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
      } catch { return; }
      reveals.add(animation); animation.finished?.catch(() => {});
      const done = () => { reveals.delete(animation); if (!reveals.size) section.classList.remove('is-certificate-list-revealing'); };
      animation.onfinish = done; animation.oncancel = done;
    });
    if (reveals.size) section.classList.add('is-certificate-list-revealing');
  }
  function finishActive() { states.forEach(state => { if (state.animation) settle(state); }); }
  function syncRegion() {
    if (region?.hidden) {
      revealedForOpen = false; cancelReveal(); clearPointer();
      states.forEach(state => settle(state, false));
    } else reveal();
  }
  let mutation = null, intersection = null;
  if (region && 'MutationObserver' in window) {
    mutation = new MutationObserver(syncRegion);
    mutation.observe(region, { attributes: true, attributeFilter: ['hidden'] });
  }
  if ('IntersectionObserver' in window) {
    intersection = new IntersectionObserver(items => {
      inView = items.some(item => item.isIntersecting);
      if (inView) reveal();
      else { finishActive(); cancelReveal(); clearPointer(); }
    }, { threshold: 0 });
    intersection.observe(section);
  }
  listen(section, 'certificateorderstart', () => { cancelReveal(); clearPointer(); states.forEach(state => settle(state, false)); });
  listen(window, 'portfoliovisualeffectschange', event => { if (!event.detail.enabled) cancelReveal(); });
  listen(reduced, 'change', () => { finishActive(); cancelReveal(); clearPointer(); reveal(); });
  listen(window, 'resize', () => { finishActive(); clearPointer(); }, { passive: true });
  listen(window, 'blur', () => { finishActive(); clearPointer(); });
  listen(document, 'visibilitychange', () => {
    if (document.hidden) { finishActive(); cancelReveal(); clearPointer(); }
    else reveal();
  });
  listen(window, 'pagehide', event => {
    finishActive(); cancelReveal(); clearPointer();
    if (!event.persisted) { mutation?.disconnect(); intersection?.disconnect(); listeners.splice(0).forEach(remove => remove()); }
  });
  listen(window, 'pageshow', reveal);
  section.classList.add('certificate-motion-ready');
  syncRegion();
})();
