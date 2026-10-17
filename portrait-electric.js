/* Optional portrait light. No image replacement, custom cursor, or blocked touch gestures. */
(() => {
  const root = document.documentElement;
  const frame = document.querySelector('.portrait-frame');
  const image = frame?.querySelector('.portrait-image-wrap');
  if (!frame || !image) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const decorative = className => {
    const node = document.createElement('span');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    return node;
  };
  frame.append(decorative('portrait-electric-rim'));
  image.append(decorative('portrait-electric-aura'));
  const namespace = 'http://www.w3.org/2000/svg';
  const threads = document.createElementNS(namespace, 'svg');
  threads.setAttribute('class', 'portrait-electric-threads');
  threads.setAttribute('viewBox', '0 0 430 380');
  threads.setAttribute('preserveAspectRatio', 'none');
  threads.setAttribute('aria-hidden', 'true');
  threads.setAttribute('focusable', 'false');
  [
    ['M 18 48 L 25 79 L 19 90 L 32 113 L 24 130 L 33 155 L 24 173 L 30 202 L 21 225 L 27 244', ''],
    ['M 32 113 L 43 128 L 38 141 L 49 151', 'portrait-electric-thread--branch'],
    ['M 411 113 L 402 135 L 409 151 L 395 176 L 402 192 L 392 219 L 400 238 L 391 260', 'portrait-electric-thread--right'],
    ['M 395 176 L 382 190 L 387 204 L 377 215', 'portrait-electric-thread--right portrait-electric-thread--branch']
  ].forEach(([path, modifier]) => {
    const node = document.createElementNS(namespace, 'path');
    node.setAttribute('d', path);
    node.setAttribute('pathLength', '100');
    node.setAttribute('class', `portrait-electric-thread ${modifier}`.trim());
    threads.append(node);
  });
  image.append(threads);

  // Reuse one small burst layer: repeated taps restart it instead of adding effects.
  const burst = document.createElementNS(namespace, 'svg');
  burst.setAttribute('class', 'portrait-electric-burst');
  burst.setAttribute('viewBox', '0 0 430 380');
  burst.setAttribute('preserveAspectRatio', 'none');
  burst.setAttribute('aria-hidden', 'true');
  burst.setAttribute('focusable', 'false');
  const burstPaths = Array.from({ length: 12 }, (_, index) => {
    const node = document.createElementNS(namespace, 'path');
    node.setAttribute('pathLength', '100');
    node.setAttribute('class', `portrait-electric-burst-strand${index >= 8 ? ' portrait-electric-burst-strand--branch' : ''}`);
    node.setAttribute('style', `--portrait-burst-delay: ${index * 18}ms`);
    burst.append(node);
    return node;
  });
  let burstCycle = 0;
  const constrain = (value, min, max) => Math.min(max, Math.max(min, value));
  const pathData = points => points.map((p, index) => `${index ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  function branchPath(start, end, minX, maxX, depth = 3) {
    if (!depth) return [start, end];
    const dx = end.x - start.x, dy = end.y - start.y;
    const distance = Math.hypot(dx, dy) || 1;
    const along = .36 + Math.random() * .28;
    const offset = (Math.random() - .5) * distance * .42;
    const middle = {
      x: constrain(start.x + dx * along - dy / distance * offset, minX, maxX),
      y: constrain(start.y + dy * along + dx / distance * offset, 32, 326)
    };
    return [...branchPath(start, middle, minX, maxX, depth - 1).slice(0, -1),
      ...branchPath(middle, end, minX, maxX, depth - 1)];
  }
  function refreshBurstGeometry() {
    // Sideways, upward and downward leaders stay on the blue background, clear of the face.
    const rays = [
      [10, 83, 83, 143], [80, 124, 17, 42],
      [12, 264, 83, 205], [81, 197, 24, 312],
      [420, 94, 346, 149], [349, 163, 413, 45],
      [416, 282, 347, 218], [350, 194, 408, 318]
    ];
    const cycle = burstCycle++;
    let forkIndex = 8;
    rays.forEach(([x1, y1, x2, y2], index) => {
      const left = index < 4, minX = left ? 6 : 338, maxX = left ? 92 : 424;
      const point = (x, y) => ({ x, y: constrain(y + (Math.random() - .5) * 15, 32, 326) });
      let start = point(x1, y1), end = point(x2, y2);
      // Every leader chooses its own direction instead of mirroring the opposite side.
      if (Math.random() < .5) [start, end] = [end, start];
      const channel = branchPath(start, end, minX, maxX);
      burstPaths[index].setAttribute('d', pathData(channel));
      if (index % 2 === 0) {
        const anchor = channel[4];
        const angle = Math.atan2(end.y - start.y, end.x - start.x) + (left ? 1 : -1) * (1 + Math.random() * .5);
        const length = 18 + Math.random() * 16;
        const tip = { x: constrain(anchor.x + Math.cos(angle) * length, minX, maxX),
          y: constrain(anchor.y + Math.sin(angle) * length, 32, 326) };
        burstPaths[forkIndex++].setAttribute('d', pathData(branchPath(anchor, tip, minX, maxX, 2)));
      }
    });
    const rhythms = ['portrait-electric-burst', 'portrait-electric-return', 'portrait-electric-flicker'];
    burstPaths.forEach((node, index) => {
      const last = index === burstPaths.length - 1;
      const rhythm = index >= 8 ? 'portrait-electric-fork' : rhythms[(index + cycle) % rhythms.length];
      const duration = last ? 1.06 : index >= 8 ? .52 + Math.random() * .3 : .65 + Math.random() * .38;
      const delay = last ? .22 : Math.random() * .18;
      node.setAttribute('style', `--portrait-burst-animation: ${rhythm}; --portrait-burst-duration: ${duration.toFixed(3)}s; --portrait-burst-delay: ${delay.toFixed(3)}s`);
    });
  }
  refreshBurstGeometry();
  image.append(burst);

  const originalAction = ['role', 'tabindex', 'aria-label'].map(name => [name, image.getAttribute(name)]);
  const labels = {
    pl: 'Rozświetl zdjęcie efektem pioruna',
    en: 'Illuminate the portrait with lightning',
    de: 'Porträt mit einem Blitzeffekt beleuchten',
    uk: 'Підсвітити портрет ефектом блискавки'
  };

  let enabled = root.dataset.electric === 'on';
  let inView = true;
  let pending = 0;
  let point = null;
  let touchActive = false;
  const canMove = () => enabled && inView && !document.hidden && !reduced.matches;
  const clearBurst = () => { delete frame.dataset.portraitBurst; };
  const updateAction = () => {
    if (enabled && !reduced.matches) {
      image.setAttribute('role', 'button');
      image.setAttribute('tabindex', '0');
      image.setAttribute('aria-label', labels[root.lang?.split('-')[0]] || labels.en);
    } else {
      originalAction.forEach(([name, value]) => {
        if (value === null) image.removeAttribute(name);
        else image.setAttribute(name, value);
      });
    }
  };
  const reset = () => {
    if (pending) cancelAnimationFrame(pending);
    pending = 0;
    point = null;
    touchActive = false;
    delete frame.dataset.portraitEngaged;
    ['--portrait-x', '--portrait-y', '--portrait-tilt-x', '--portrait-tilt-y'].forEach(name => frame.style.removeProperty(name));
  };
  const sync = () => {
    if (!enabled) delete frame.dataset.portraitElectric;
    else frame.dataset.portraitElectric = canMove() ? 'active' : 'dormant';
    reset();
    clearBurst();
    updateAction();
  };
  const draw = () => {
    pending = 0;
    if (!canMove() || !point) return;
    const bounds = image.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const clamp = value => Math.min(1, Math.max(0, value));
    const x = clamp((point.x - bounds.left) / bounds.width);
    const y = clamp((point.y - bounds.top) / bounds.height);
    frame.style.setProperty('--portrait-x', `${(x * 100).toFixed(2)}%`);
    frame.style.setProperty('--portrait-y', `${(y * 100).toFixed(2)}%`);
    const tilt = fine.matches && point.kind !== 'touch';
    frame.style.setProperty('--portrait-tilt-x', `${(tilt ? (0.5 - y) * 3 : 0).toFixed(2)}deg`);
    frame.style.setProperty('--portrait-tilt-y', `${(tilt ? (x - 0.5) * 3 : 0).toFixed(2)}deg`);
    frame.dataset.portraitEngaged = 'true';
  };
  const track = (x, y, kind) => {
    if (!canMove()) return;
    point = { x, y, kind };
    if (!pending) pending = requestAnimationFrame(draw);
  };
  const illuminate = () => {
    if (!canMove()) return;
    clearBurst();
    refreshBurstGeometry();
    // Flush only on deliberate activation to restart the bounded CSS animation.
    void burst.getBoundingClientRect().width;
    frame.dataset.portraitBurst = 'on';
  };
  image.addEventListener('click', illuminate);
  image.addEventListener('keydown', event => {
    if (event.target !== image || !canMove() || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    if (!event.repeat) illuminate();
  });
  burst.addEventListener('animationend', event => {
    if (event.target === burstPaths[burstPaths.length - 1] && /^portrait-electric-(burst|return|flicker|fork)$/.test(event.animationName)) clearBurst();
  });
  if ('PointerEvent' in window) {
    image.addEventListener('pointerdown', event => {
      if (event.isPrimary === false) return;
      touchActive = event.pointerType === 'touch';
      track(event.clientX, event.clientY, event.pointerType);
    }, { passive: true });
    image.addEventListener('pointermove', event => {
      if (event.isPrimary === false || (event.pointerType === 'touch' && !touchActive)) return;
      track(event.clientX, event.clientY, event.pointerType);
    }, { passive: true });
    image.addEventListener('pointerleave', reset, { passive: true });
    image.addEventListener('pointercancel', reset, { passive: true });
    image.addEventListener('pointerup', event => { if (event.pointerType === 'touch') reset(); }, { passive: true });
  } else {
    image.addEventListener('mousemove', event => track(event.clientX, event.clientY, 'mouse'), { passive: true });
    image.addEventListener('mouseleave', reset, { passive: true });
    const trackTouch = event => {
      const touch = event.touches[0];
      if (touch && event.touches.length === 1) track(touch.clientX, touch.clientY, 'touch');
    };
    image.addEventListener('touchstart', trackTouch, { passive: true });
    image.addEventListener('touchmove', trackTouch, { passive: true });
    image.addEventListener('touchend', reset, { passive: true });
    image.addEventListener('touchcancel', reset, { passive: true });
  }
  window.addEventListener('portfolioelectricchange', event => {
    enabled = typeof event.detail?.enabled === 'boolean' ? event.detail.enabled : root.dataset.electric === 'on';
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  fine.addEventListener('change', reset);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      sync();
    }, { threshold: 0 });
    observer.observe(frame);
  }
  window.addEventListener('pagehide', () => {
    reset();
    clearBurst();
    if (enabled) frame.dataset.portraitElectric = 'dormant';
  });
  window.addEventListener('pageshow', sync);
  sync();
})();
