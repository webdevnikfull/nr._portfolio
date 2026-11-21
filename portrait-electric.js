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
    ['M 17 101 L 31 113 L 25 125 L 48 135 L 39 151 L 57 159', ''],
    ['M 39 151 L 21 157 L 29 170', 'portrait-electric-thread--branch'],
    ['M 415 223 L 398 214 L 406 199 L 384 187 L 392 174 L 375 165', 'portrait-electric-thread--right'],
    ['M 398 214 L 380 220 L 385 235', 'portrait-electric-thread--right portrait-electric-thread--branch']
  ].forEach(([path, modifier]) => {
    const node = document.createElementNS(namespace, 'path');
    node.setAttribute('d', path);
    node.setAttribute('pathLength', '100');
    node.setAttribute('class', `portrait-electric-thread ${modifier}`.trim());
    threads.append(node);
  });
  image.append(threads);

  // Two independently timed radial discharges: twelve directions each, plus twelve forks.
  const flash = decorative('portrait-electric-flash');
  image.append(flash);
  const burst = document.createElementNS(namespace, 'svg');
  burst.setAttribute('class', 'portrait-electric-burst');
  burst.setAttribute('viewBox', '0 0 430 380');
  burst.setAttribute('preserveAspectRatio', 'none');
  burst.setAttribute('aria-hidden', 'true');
  burst.setAttribute('focusable', 'false');
  const burstGroups = [];
  const burstHalos = [];
  const burstPaths = Array.from({ length: 36 }, (_, index) => {
    const group = document.createElementNS(namespace, 'g');
    const halo = document.createElementNS(namespace, 'path');
    const node = document.createElementNS(namespace, 'path');
    [halo, node].forEach(path => path.setAttribute('pathLength', '100'));
    const modifier = index >= 24 ? ' portrait-electric-burst-strand--branch' : '';
    halo.setAttribute('class', 'portrait-electric-burst-strand portrait-electric-burst-strand--glow' + modifier);
    node.setAttribute('class', 'portrait-electric-burst-strand' + modifier);
    group.append(halo, node);
    burst.append(group);
    burstGroups.push(group);
    burstHalos.push(halo);
    return node;
  });
  let burstCycle = 0;
  const constrain = (value, min, max) => Math.min(max, Math.max(min, value));
  const pathData = points => points.map((p, index) => `${index ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  function branchPath(start, end, bounds, depth = 3) {
    if (!depth) return [start, end];
    const dx = end.x - start.x, dy = end.y - start.y;
    const distance = Math.hypot(dx, dy) || 1;
    const along = .38 + Math.random() * .24;
    const offset = (Math.random() - .5) * distance * .42;
    const middle = {
      x: constrain(start.x + dx * along - dy / distance * offset, bounds.minX, bounds.maxX),
      y: constrain(start.y + dy * along + dx / distance * offset, bounds.minY, bounds.maxY)
    };
    return [...branchPath(start, middle, bounds, depth - 1).slice(0, -1), ...branchPath(middle, end, bounds, depth - 1)];
  }
  function refreshBurstGeometry() {
    const cycle = burstCycle++;
    const leftY = 112 + Math.random() * 140;
    const origins = [{ x: 52 + (Math.random() - .5) * 8, y: leftY }, { x: 378 + (Math.random() - .5) * 8, y: 356 - leftY + (Math.random() - .5) * 18 }];
    const rhythms = ['portrait-electric-burst', 'portrait-electric-return', 'portrait-electric-flicker'];
    const put = (index, points, animation, duration, delay) => {
      const d = pathData(points);
      burstPaths[index].setAttribute('d', d);
      burstHalos[index].setAttribute('d', d);
      burstGroups[index].setAttribute('style', `--portrait-burst-animation: ${animation}; --portrait-burst-duration: ${duration.toFixed(3)}s; --portrait-burst-delay: ${delay.toFixed(3)}s; --portrait-burst-width: ${(.8 + Math.random() * .35).toFixed(2)}px`);
    };
    origins.forEach((origin, side) => {
      const bounds = side ? { minX: 326, maxX: 424, minY: 64, maxY: 346 } : { minX: 6, maxX: 104, minY: 26, maxY: 326 };
      const rotation = (Math.random() - .5) * .12;
      const baseDelay = side ? .15 + Math.random() * .04 : 0;
      for (let ray = 0; ray < 12; ray++) {
        // Cardinal rays are present on every tap, alongside the diagonal rays.
        const angle = ray * Math.PI / 6 + rotation + (Math.random() - .5) * .10;
        const dx = Math.cos(angle), dy = Math.sin(angle);
        const edgeX = Math.abs(dx) < .001 ? Infinity : ((dx > 0 ? bounds.maxX : bounds.minX) - origin.x) / dx;
        const edgeY = Math.abs(dy) < .001 ? Infinity : ((dy > 0 ? bounds.maxY : bounds.minY) - origin.y) / dy;
        const length = Math.min(edgeX, edgeY, 170 + Math.random() * 65) * (.94 + Math.random() * .04);
        const end = { x: origin.x + dx * length, y: origin.y + dy * length };
        const channel = branchPath(origin, end, bounds);
        const index = side * 12 + ray;
        const delay = baseDelay + Math.random() * .045;
        put(index, channel, rhythms[(ray + cycle + side) % rhythms.length], .86 + Math.random() * .38, delay);
        if (ray % 2 === 0) {
          const forkIndex = 24 + side * 6 + ray / 2;
          const anchor = channel[4];
          const forkAngle = angle + (Math.random() < .5 ? -1 : 1) * (.65 + Math.random() * .5);
          const forkLength = 26 + Math.random() * 30;
          const tip = { x: constrain(anchor.x + Math.cos(forkAngle) * forkLength, bounds.minX, bounds.maxX), y: constrain(anchor.y + Math.sin(forkAngle) * forkLength, bounds.minY, bounds.maxY) };
          const last = forkIndex === 35;
          put(forkIndex, branchPath(anchor, tip, bounds, 2), 'portrait-electric-fork', last ? 1.5 : .66 + Math.random() * .32, last ? .40 : delay + .08);
        }
      }
      const suffix = side ? 'b' : 'a';
      flash.style.setProperty(`--portrait-flash-x-${suffix}`, `${(origin.x / 430 * 100).toFixed(2)}%`);
      flash.style.setProperty(`--portrait-flash-y-${suffix}`, `${(origin.y / 380 * 100).toFixed(2)}%`);
      flash.style.setProperty(`--portrait-flash-delay-${suffix}`, `${(baseDelay + .025).toFixed(3)}s`);
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
  let lastActivation = -Infinity;
  const illuminate = () => {
    if (!canMove()) return;
    const now = Date.now();
    if (frame.dataset.portraitBurst === 'on' && now - lastActivation < 350) return;
    lastActivation = now;
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
