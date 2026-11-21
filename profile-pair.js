/* Only the order of this pair can change; neither widget is freely draggable. */
(() => {
  'use strict';
  const pair = document.querySelector('[data-profile-pair]');
  if (!pair) return;
  const track = pair.querySelector('[data-pair-track]');
  const items = [...pair.querySelectorAll('[data-profile-item]')];
  const clock = pair.querySelector('[data-profile-clock]');
  const button = pair.querySelector('[data-pair-swap]');
  const tools = pair.querySelector('.profile-pair-tools');
  const announcement = pair.querySelector('[data-pair-announcement]');
  if (!track || items.length !== 2 || !clock || clock.hidden || !button) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = [];
  let gesture = null, busy = false, generation = 0, animations = [], dragOffset = 0, suppressClickUntil = 0;
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };
  const move = x => `translate3d(${x}px, 0, 0)`;
  const signs = direction => items.map(item => item === track.firstElementChild ? direction : -direction);
  const cleanStyles = () => items.forEach(item => {
    item.style.removeProperty('transform');
    item.style.removeProperty('opacity');
  });
  const stopAnimations = () => { animations.forEach(animation => animation.cancel()); animations = []; };
  const releaseGesture = () => {
    const active = gesture;
    gesture = null;
    if (active && track.hasPointerCapture?.(active.id)) track.releasePointerCapture(active.id);
    pair.classList.remove('is-pair-dragging');
    return active;
  };
  const reset = () => {
    if (gesture?.horizontal) suppressClickUntil = performance.now() + 400;
    generation++;
    releaseGesture();
    stopAnimations();
    cleanStyles();
    dragOffset = 0;
    busy = false;
    pair.classList.remove('is-pair-swapping');
    button.setAttribute('aria-disabled', 'false');
  };
  const reorder = () => {
    const focused = document.activeElement;
    track.append(track.firstElementChild);
    const clockFirst = track.firstElementChild.dataset.profileItem === 'clock';
    button.setAttribute('aria-pressed', String(clockFirst));
    announcement.textContent = clockFirst ? pair.dataset.clockFirst : pair.dataset.statusFirst;
    if (focused && pair.contains(focused) && document.activeElement !== focused) focused.focus({ preventScroll: true });
  };
  const play = (frames, duration) => {
    animations = items.map((item, i) => item.animate(frames(i), {
      duration, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards'
    }));
    return Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  };
  const swap = async (direction = 1) => {
    if (busy) return;
    busy = true;
    const token = ++generation;
    const polarity = signs(direction);
    const from = signs(dragOffset);
    pair.classList.add('is-pair-swapping');
    button.setAttribute('aria-disabled', 'true');
    if (reduced.matches || !items.every(item => typeof item.animate === 'function')) {
      reorder();
      reset();
      return;
    }
    await play(i => [{ transform: move(from[i]), opacity: 1 }, { transform: move(polarity[i] * 64), opacity: 0 }], 160);
    if (token !== generation) return;
    stopAnimations();
    cleanStyles();
    reorder();
    await play(i => [{ transform: move(-polarity[i] * 64), opacity: 0 }, { transform: move(0), opacity: 1 }], 260);
    if (token === generation) reset();
  };
  const settle = async () => {
    if (reduced.matches || !items.every(item => typeof item.animate === 'function')) return reset();
    busy = true;
    const token = ++generation, offsets = signs(dragOffset);
    button.setAttribute('aria-disabled', 'true');
    await play(i => [{ transform: move(offsets[i]) }, { transform: move(0) }], 180);
    if (token === generation) reset();
  };

  listen(track, 'pointerdown', event => {
    if (event.isPrimary !== false && event.button === 0) suppressClickUntil = 0;
    if (gesture) { reset(); return; }
    if (busy || event.isPrimary === false || event.button !== 0 || event.target.closest('button, input, textarea, select')) return;
    // A plain tap on the green link still follows the link.
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, horizontal: false };
  }, { passive: true });
  listen(window, 'pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.horizontal) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.1) { releaseGesture(); return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      gesture.horizontal = true;
      track.setPointerCapture?.(gesture.id);
      pair.classList.add('is-pair-dragging');
    }
    event.preventDefault();
    gesture.dx = dx;
    dragOffset = reduced.matches ? 0 : Math.max(-42, Math.min(42, dx * .4));
    signs(dragOffset).forEach((x, i) => { items[i].style.transform = move(x); });
  }, { passive: false });
  listen(window, 'pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const active = releaseGesture();
    if (!active.horizontal) return;
    suppressClickUntil = performance.now() + 400;
    const threshold = Math.min(60, track.clientWidth * .18);
    if (Math.abs(active.dx) >= threshold) swap(Math.sign(active.dx));
    else settle();
  }, { passive: true });
  listen(window, 'pointercancel', event => { if (gesture?.id === event.pointerId) reset(); }, { passive: true });
  listen(track, 'lostpointercapture', event => { if (gesture?.id === event.pointerId) reset(); });
  listen(track, 'dragstart', event => event.preventDefault());
  listen(track, 'click', event => {
    // Format taps must not be swallowed by a preceding widget-swap gesture.
    if (event.target.closest('[data-clock-format]')) { suppressClickUntil = 0; return; }
    if (event.detail !== 0 && performance.now() < suppressClickUntil) {
      suppressClickUntil = 0;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  listen(button, 'click', () => { if (!busy && !gesture) swap(); });
  listen(pair, 'keydown', event => { if (event.key === 'Escape' && (gesture || busy)) reset(); });
  listen(window, 'resize', reset, { passive: true });
  listen(window, 'blur', reset);
  listen(window, 'portfoliovisualeffectschange', reset);
  listen(reduced, 'change', reset);
  listen(document, 'visibilitychange', () => { if (document.hidden) reset(); });
  listen(window, 'pagehide', event => {
    reset();
    if (!event.persisted) listeners.splice(0).forEach(remove => remove());
  });
  tools.hidden = false;
  pair.classList.add('is-pair-ready');
})();
