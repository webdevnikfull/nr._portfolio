/* Keep project previews in sync with disclosure, viewport and motion preferences. */
(() => {
  'use strict';
  const root = document.documentElement;
  const section = document.getElementById('projects');
  const contact = document.getElementById('contact');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...document.querySelectorAll('#projects .project-card')];
  const revealed = new Set();
  let frame = 0;
  let contactVisible = false;
  const enabled = () => !reduced.matches && root.dataset.effectsPaused !== 'true' && !document.hidden;

  const heroText = [...document.querySelectorAll('#hero-title, .hero-role, .hero-description')];
  const headings = [...heroText, ...document.querySelectorAll('#cyber-learning-title')];
  heroText.forEach((element, index) => element.style.setProperty('--title-delay', index * 110 + 'ms'));
  if (enabled()) {
    root.setAttribute('data-section-title-motion', '');
    heroText.forEach(element => { element.dataset.scrollTitle = 'concealed'; });
  }
  function syncHeadings() {
    root.toggleAttribute('data-section-title-motion', enabled());
    if (!enabled()) return;
    const topEdge = Math.min(120, innerHeight * .16);
    for (const heading of headings) {
      const bounds = heading.getBoundingClientRect();
      heading.dataset.scrollTitle = bounds.bottom > topEdge && bounds.top < innerHeight - 16 ? 'visible' : 'concealed';
    }
  }

  function syncCards() {
    frame = 0;
    syncHeadings();
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const visible = enabled() && card.getClientRects().length > 0 && rect.bottom > 0 && rect.top < innerHeight;
      card.style.setProperty('--showcase-play', visible ? 'running' : 'paused');
      card.classList.toggle('showcase-in-view', visible);
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(syncCards); }
  const disclosure = section ? new MutationObserver(schedule) : null;
  disclosure?.observe(section, { subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-expanded'] });
  const skills = document.getElementById('skills');
  if (skills) disclosure?.observe(skills, { subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-expanded'] });
  const visibility = 'IntersectionObserver' in window ? new IntersectionObserver(schedule, { threshold: 0 }) : null;
  cards.forEach(card => visibility?.observe(card));
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });

  function finishContact() {
    for (const animation of [...revealed]) { animation.cancel(); revealed.delete(animation); }
  }
  function revealContact() {
    finishContact();
    if (!contact || !enabled()) return;
    const elements = contact.querySelectorAll('.contact-text > .eyebrow, .contact-text > h2, .contact-text > p:not(.eyebrow), .contact-email, .cv-downloads, .contact-links');
    elements.forEach((element, index) => {
      if (typeof element.animate !== 'function') return;
      const animation = element.animate([
        { clipPath: 'inset(0 100% 0 0)', opacity: .2, transform: 'translateX(-10px)' },
        { clipPath: 'inset(0 0% 0 0)', opacity: 1, transform: 'translateX(0)' },
      ], { duration: 1100, delay: index * 105, easing: 'cubic-bezier(.2,.7,.25,1)', fill: 'both' });
      revealed.add(animation);
      animation.onfinish = () => { revealed.delete(animation); animation.cancel(); };
      animation.oncancel = () => revealed.delete(animation);
    });
  }
  const contactObserver = contact && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !contactVisible) revealContact();
      contactVisible = entry.isIntersecting;
      if (!entry.isIntersecting) finishContact();
    }
  }, { threshold: .15 }) : null;
  if (contact) {
    contactObserver?.observe(contact);
    contact.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') revealContact(); }, { passive: true });
    contact.addEventListener('focusin', finishContact);
  }
  function syncMotion() {
    schedule();
    if (!enabled()) finishContact();
    else if (contactVisible) revealContact();
  }
  const preferenceObserver = new MutationObserver(syncMotion);
  preferenceObserver.observe(root, { attributes: true, attributeFilter: ['data-effects-paused'] });
  addEventListener('portfoliovisualeffectschange', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  addEventListener('pagehide', event => {
    finishContact();
    if (!event.persisted) { disclosure?.disconnect(); visibility?.disconnect(); contactObserver?.disconnect(); preferenceObserver.disconnect(); cancelAnimationFrame(frame); }
  });
  let jumpFrame = 0;
  function cancelJump() {
    cancelAnimationFrame(jumpFrame);
    jumpFrame = 0;
  }
  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'popstate', 'pagehide', 'hashchange']) {
    addEventListener(event, cancelJump, { passive: true });
  }
  document.addEventListener('click', event => {
    if (!enabled() || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const hash = link.hash;
    if (!hash || hash === '#main') return;
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return; }
    if (!target) return;

    event.preventDefault();
    cancelJump();
    const oldURL = location.href;
    if (location.hash !== hash) {
      history.pushState(null, '', hash);
      dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: location.href }));
    }
    if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    const from = scrollY;
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const to = Math.max(0, Math.min(from + target.getBoundingClientRect().top - padding - margin, root.scrollHeight - innerHeight));
    const distance = to - from;
    const duration = Math.min(750, 320 + Math.abs(distance) * .12);
    const start = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      scrollTo({ top: enabled() ? from + distance * eased : to, behavior: 'instant' });
      jumpFrame = enabled() && progress < 1 ? requestAnimationFrame(step) : 0;
    }
    jumpFrame = requestAnimationFrame(step);
  });
  requestAnimationFrame(schedule);
})();
