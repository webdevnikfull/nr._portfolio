/* Optional, brief blue light traces. The normal cursor stays visible. */
(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  const tools = document.querySelector('.nav-tools');
  if (!themeButton || !tools || document.getElementById('electric-toggle')) return;

  const copy = {
    pl: { on: 'Włącz efekty pioruna', off: 'Wyłącz efekty pioruna' },
    en: { on: 'Enable lightning effects', off: 'Disable lightning effects' },
    de: { on: 'Blitzeffekte einschalten', off: 'Blitzeffekte ausschalten' },
    uk: { on: 'Увімкнути ефекти блискавки', off: 'Вимкнути ефекти блискавки' }
  }[root.lang] || { on: 'Włącz efekty pioruna', off: 'Wyłącz efekty pioruna' };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'electric-toggle';
  button.className = 'icon-button electric-toggle';
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m13.8 2-8.6 11.8h6L10.2 22l8.6-11.8h-6L13.8 2Z"/></svg>';
  themeButton.insertAdjacentElement('afterend', button);

  const canvas = document.createElement('canvas');
  canvas.className = 'portfolio-electric-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  let enabled = false;
  let frame = 0;
  let traces = [];
  let lastPointer = null;
  let pointerHistory = [];
  let pointerPulseStart = 0;
  let pointerDistance = 0;
  let channelSeed = 1;
  let lastTraceAt = 0;
  let width = 0;
  let height = 0;
  const highlights = new Map();
  const openedAt = new WeakMap();

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * ratio);
    canvas.height = Math.ceil(height * ratio);
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function clear() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    traces = [];
    lastPointer = null;
    pointerHistory = [];
    pointerPulseStart = 0;
    pointerDistance = 0;
    if (context) context.clearRect(0, 0, width, height);
  }
  function setEnabled(on) {
    enabled = on;
    root.dataset.electric = on ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? copy.off : copy.on);
    button.title = on ? copy.off : copy.on;
    canvas.hidden = !on || reducedMotion.matches;
    clear();
    if (on) resize();
    else {
      highlights.forEach((timeout, element) => {
        clearTimeout(timeout);
        element.classList.remove('electric-reveal');
      });
      highlights.clear();
    }
    window.dispatchEvent(new CustomEvent('portfolioelectricchange', { detail: { enabled: on } }));
  }
  function jaggedLine(x1, y1, x2, y2, jitter = 3) {
    const length = Math.hypot(x2 - x1, y2 - y1);
    if (length < 1) return [];
    const pieces = Math.max(3, Math.min(12, Math.ceil(length / 12)));
    const normalX = -(y2 - y1) / length;
    const normalY = (x2 - x1) / length;
    const points = [{ x: x1, y: y1 }];
    for (let i = 1; i < pieces; i++) {
      const offset = (Math.random() - .5) * jitter * 2;
      points.push({ x: x1 + (x2 - x1) * i / pieces + normalX * offset,
        y: y1 + (y2 - y1) * i / pieces + normalY * offset });
    }
    points.push({ x: x2, y: y2 });
    return points;
  }
  function addTrace(points, strength = .25, life = 390, lineWidth = 1.65, kind = 'spark', level = 0) {
    if (!context || !enabled || reducedMotion.matches || points.length < 2) return;
    traces.push({ points, strength, life, lineWidth, kind, level, pulseStart: pointerPulseStart, born: performance.now() });
    if (traces.length > 24) traces.splice(0, traces.length - 24);
    if (!frame && !document.hidden) frame = requestAnimationFrame(render);
  }
  function strokePath(points) {
    context.beginPath();
    points.forEach((point, index) => {
      if (!index) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
  }
  function luminousSegment(points, from, to) {
    // Follow the angular channel with a short moving return stroke, not a round cursor glow.
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
      lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
    }
    const total = lengths[lengths.length - 1];
    const a = Math.max(0, from) * total;
    const b = Math.min(1, to) * total;
    if (b <= a) return [];
    const result = [];
    for (let i = 1; i < points.length; i++) {
      if (lengths[i] < a || lengths[i - 1] > b) continue;
      const span = lengths[i] - lengths[i - 1];
      if (!span) continue;
      const interpolate = distance => {
        const t = (distance - lengths[i - 1]) / span;
        return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
          y: points[i - 1].y + (points[i].y - points[i - 1].y) * t };
      };
      if (!result.length) result.push(interpolate(Math.max(a, lengths[i - 1])));
      result.push(interpolate(Math.min(b, lengths[i])));
    }
    return result;
  }
  function render(now) {
    frame = 0;
    if (!context || !enabled || reducedMotion.matches || document.hidden) return;
    context.clearRect(0, 0, width, height);
    traces = traces.filter(trace => now - trace.born < trace.life);
    // Read the active theme at draw time so a theme switch updates live channels too.
    const palette = root.dataset.theme === 'dark'
      ? { core: '244, 250, 255', halo: '143, 199, 245', glow: '145, 211, 255', glint: '255, 255, 255' }
      : { core: '7, 25, 89', halo: '19, 53, 115', glow: '50, 126, 220', glint: '167, 211, 255' };
    traces.forEach(trace => {
      const age = Math.max(0, now - trace.born);
      const fade = Math.pow(Math.max(0, 1 - age / trace.life), 1.5);
      const phase = ((now - trace.pulseStart) % 1080) / 1080;
      // A soft first strike, a smaller restrike, then a quiet interval. Only the channel flashes.
      const pulse = trace.kind === 'pointer'
        ? Math.min(1, .48 + .52 * Math.exp(-Math.pow((phase - .08) / .05, 2))
          + .32 * Math.exp(-Math.pow((phase - .27) / .07, 2)))
        : 1;
      const alpha = trace.strength * fade * pulse;
      strokePath(trace.points);
      context.lineJoin = trace.kind === 'pointer' ? 'miter' : 'round';
      context.miterLimit = 2;
      context.lineCap = 'round';
      // A transparent halo and a narrow channel keep text readable below the effect.
      context.lineWidth = trace.lineWidth + (trace.kind === 'pointer' ? 2.8 : 1.7);
      context.strokeStyle = `rgba(${palette.halo}, ${alpha * .22})`;
      context.shadowColor = `rgba(${palette.glow}, ${alpha * .65})`;
      context.shadowBlur = trace.kind === 'pointer' ? 13 : 10;
      context.stroke();
      context.lineWidth = trace.lineWidth;
      context.strokeStyle = `rgba(${palette.core}, ${alpha})`;
      context.shadowBlur = 0;
      context.stroke();
      if (trace.kind === 'pointer' && trace.level === 0) {
        context.lineWidth = .48;
        context.strokeStyle = `rgba(${palette.glint}, ${Math.min(.62, alpha * 1.25)})`;
        context.shadowColor = `rgba(${palette.glow}, ${alpha * .6})`;
        context.shadowBlur = 4;
        context.stroke();
        const travel = ((now - trace.pulseStart) % 810) / 810;
        const glint = luminousSegment(trace.points, travel * 1.28 - .28, travel * 1.28);
        if (glint.length > 1) {
          strokePath(glint);
          context.lineWidth = 1.05;
          context.strokeStyle = `rgba(${palette.glow}, ${alpha * .16})`;
          context.shadowColor = `rgba(${palette.glow}, ${alpha * .6})`;
          context.shadowBlur = 7;
          context.stroke();
          context.lineWidth = .6;
          context.strokeStyle = `rgba(${palette.glint}, ${Math.min(.72, alpha * 1.75)})`;
          context.shadowBlur = 2;
          context.stroke();
        }
        context.shadowBlur = 0;
      }
    });
    if (traces.length) frame = requestAnimationFrame(render);
  }
  function burst(x, y, intensity = 1) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !enabled || reducedMotion.matches) return;
    const strength = Math.max(.2, Math.min(1.5, intensity));
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = (13 + Math.random() * 17) * strength;
      addTrace(jaggedLine(x, y, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 2.5), .34, 390);
    }
  }
  function highlight(element) {
    if (!element || !enabled) return;
    if (highlights.has(element)) clearTimeout(highlights.get(element));
    element.classList.remove('electric-reveal');
    void element.offsetWidth;
    element.classList.add('electric-reveal');
    highlights.set(element, setTimeout(() => {
      element.classList.remove('electric-reveal');
      highlights.delete(element);
    }, 900));
    const rect = element.getBoundingClientRect();
    if (rect.top >= height || rect.bottom <= 0) return;
    // Draw only along the top edge, leaving text and images unobscured.
    const endX = Math.min(rect.right - 20, width - 14);
    const startX = Math.max(rect.left + 20, endX - Math.min(rect.width * .55, 155));
    addTrace(jaggedLine(startX, rect.top + 2, endX, rect.top + 2, 2), .36, 560);
  }
  const observer = new MutationObserver(records => {
    if (!enabled) return;
    records.forEach(record => {
      const target = record.target;
      if (!target.matches('.section-intro-action, .section-disclosure') || target.getAttribute('aria-expanded') !== 'true') return;
      const content = document.getElementById(target.getAttribute('aria-controls'));
      if (!content || content.hidden) return;
      const now = performance.now();
      if (now - (openedAt.get(content) || -1000) < 120) return;
      openedAt.set(content, now);
      highlight(target);
      const cards = content.querySelectorAll('.skill-card, .experience-row, .project-card, .education-card, .certificate-source, .certificate-card, .volunteer-item');
      [...cards].slice(0, 6).forEach(highlight);
    });
  });
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-expanded'] });

  function noise(key, seed = channelSeed) {
    const value = Math.sin(key * 127.1 + seed * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }
  function channelOffset(distance, cell) {
    // The same spatial seed survives pointer events: the bolt does not reroll on every movement.
    const layer = (spacing, salt) => {
      const cell = Math.floor(distance / spacing);
      const t = distance / spacing - cell;
      return (noise(cell + salt) * (1 - t) + noise(cell + 1 + salt) * t) * 2 - 1;
    };
    const fine = (noise(cell + 197) * 2 - 1) * 4.5;
    // A few stable, sharper leader steps break up broad bends without re-randomizing the channel.
    const step = noise(cell + 1217) > .82
      ? (noise(cell + 1301) < .5 ? -1 : 1) * (7 + noise(cell + 1423) * 6) : 0;
    return layer(72, 13) * 12 + layer(24, 79) * 9 + fine + step;
  }
  function forkChannel(start, end, seed, depth = 3) {
    // Uneven recursive midpoint displacement creates a branching leader instead of a regular zigzag.
    function split(a, b, level, key) {
      if (!level) return [a, b];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const ratio = .36 + noise(key, seed) * .28;
      const displacement = (noise(key + 31, seed) * 2 - 1) * length * .23;
      const middle = { x: a.x + dx * ratio - dy / length * displacement,
        y: a.y + dy * ratio + dx / length * displacement };
      return [...split(a, middle, level - 1, key * 2 + 1).slice(0, -1),
        ...split(middle, b, level - 1, key * 2 + 2)];
    }
    return split(start, end, depth, 1);
  }
  // Follow the real recent trajectory, keeping an irregular but spatially stable discharge channel.
  function trailPath(maxLength) {
    if (pointerHistory.length < 2) return [];
    const last = pointerHistory[pointerHistory.length - 1];
    const firstArc = Math.max(pointerHistory[0].arc, last.arc - maxLength);
    if (last.arc - firstArc < 4) return [];
    let segment = 1;
    function sample(arc, displace, cell = 0) {
      while (segment < pointerHistory.length - 1 && pointerHistory[segment].arc < arc) segment++;
      const a = pointerHistory[segment - 1];
      const b = pointerHistory[segment];
      const ratio = (arc - a.arc) / (b.arc - a.arc || 1);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const taper = Math.max(0, Math.min(1, (arc - firstArc) / 22, (last.arc - arc) / 15));
      const offset = displace ? channelOffset(arc, cell) * taper : 0;
      return { x: a.x + dx * ratio - dy / length * offset,
        y: a.y + dy * ratio + dx / length * offset, arc };
    }
    const points = [sample(firstArc, false)];
    const firstCell = Math.floor(firstArc / 10);
    for (let cell = firstCell; cell <= Math.ceil(last.arc / 10); cell++) {
      const arc = cell * 10 + (noise(cell + 409) - .5) * 6;
      if (arc > firstArc + 3 && arc < last.arc - 3) points.push(sample(arc, true, cell));
    }
    points.push({ x: last.x, y: last.y, arc: last.arc });
    return points;
  }
  function pointerBolt(points, touch) {
    if (points.length < 2) return;
    // Replace the current channel so overlapping trails never build into an opaque streak.
    traces = traces.filter(trace => trace.kind !== 'pointer');
    addTrace(points, touch ? .38 : .42, touch ? 450 : 510, 1.65, 'pointer');
    const first = points[0].arc;
    const last = points[points.length - 1].arc;
    let count = 0;
    for (let station = Math.floor(first / 70); station <= Math.ceil(last / 70) && count < 3; station++) {
      const anchor = station * 70 + noise(station + 571) * 25;
      if (anchor < first + 12 || anchor > last - 14) continue;
      const index = points.findIndex(point => point.arc >= anchor);
      if (index < 1 || index >= points.length - 1) continue;
      const start = points[index];
      const next = points[index + 1];
      const side = noise(station + 673) < .5 ? -1 : 1;
      const angle = Math.atan2(next.y - start.y, next.x - start.x) + side * (.55 + noise(station + 733) * .7);
      const distance = (touch ? 23 : 30) + noise(station + 811) * (touch ? 13 : 22);
      const branch = forkChannel(start, { x: start.x + Math.cos(angle) * distance,
        y: start.y + Math.sin(angle) * distance }, channelSeed + station * 17);
      addTrace(branch, touch ? .15 : .18, touch ? 420 : 480, .68, 'pointer', 1);
      if (!count) {
        const fork = branch[4];
        const forkAngle = angle - side * (.7 + noise(station + 919) * .5);
        const length = touch ? 12 : 18;
        addTrace(forkChannel(fork, { x: fork.x + Math.cos(forkAngle) * length,
          y: fork.y + Math.sin(forkAngle) * length }, channelSeed + station * 29, 2), .09, 410, .38, 'pointer', 2);
      }
      count++;
    }
  }
  function onPointerMove(event) {
    if (!enabled || reducedMotion.matches) return;
    if (event.isPrimary === false) return;
    const now = performance.now();
    const touch = event.pointerType === 'touch';
    const current = { x: event.clientX, y: event.clientY, time: now, touch };
    if (!Number.isFinite(current.x) || !Number.isFinite(current.y)) return;
    let restart = !lastPointer;
    if (lastPointer) {
      const distance = Math.hypot(current.x - lastPointer.x, current.y - lastPointer.y);
      if (distance < .5 && lastPointer.touch === touch) return; // Pointer/touch duplicate.
      restart = lastPointer.touch !== touch || now - lastPointer.time > 280 || distance > (touch ? 180 : 260);
      if (!restart) pointerDistance += distance;
    }
    if (restart) {
      pointerHistory = [];
      pointerDistance = 0;
      pointerPulseStart = now;
      channelSeed = Math.random() * 65536;
    }
    current.arc = pointerDistance;
    // Keep the moving endpoint, but thin dense mouse samples by distance.
    const previousSample = pointerHistory[pointerHistory.length - 2];
    if (previousSample && Math.hypot(current.x - previousSample.x, current.y - previousSample.y) < 8) {
      pointerHistory[pointerHistory.length - 1] = current;
    } else pointerHistory.push(current);
    pointerHistory = pointerHistory.filter(point => now - point.time <= 440).slice(-36);
    lastPointer = current;
    if (now - lastTraceAt >= (touch ? 55 : 32)) {
      pointerBolt(trailPath(touch ? 150 : 220), touch);
      lastTraceAt = now;
    }
  }
  function onPointerDown(event) {
    if (!enabled || reducedMotion.matches || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
    // A multi-touch gesture is navigation, not a channel between unrelated fingers.
    if (event.isPrimary === false) { onPointerEnd(); return; }
    lastTraceAt = performance.now();
    pointerPulseStart = lastTraceAt;
    pointerDistance = 0;
    channelSeed = Math.random() * 65536;
    lastPointer = { x: event.clientX, y: event.clientY, time: lastTraceAt,
      touch: event.pointerType === 'touch', arc: 0 };
    pointerHistory = [lastPointer];
    burst(event.clientX, event.clientY, .65);
  }
  function onPointerEnd() { lastPointer = null; pointerHistory = []; }
  function onTouchStart(event) {
    if (event.touches.length !== 1) { onPointerEnd(); return; }
    const touch = event.touches[0];
    // Pointer events usually arrive first; support touch-only browsers without a duplicate burst.
    if (!lastPointer || Math.hypot(touch.clientX - lastPointer.x, touch.clientY - lastPointer.y) > 6) {
      onPointerDown({ clientX: touch.clientX, clientY: touch.clientY, pointerType: 'touch' });
    }
  }
  function onTouchMove(event) {
    if (event.touches.length !== 1) { onPointerEnd(); return; }
    const touch = event.touches[0];
    // Passive touch events continue after a native scroll cancels the pointer stream.
    onPointerMove({ clientX: touch.clientX, clientY: touch.clientY, pointerType: 'touch' });
  }
  function onTouchEnd(event) { if (!event.touches.length) onPointerEnd(); }
  function onResize() { if (enabled) { clear(); resize(); } }
  function onVisibility() { if (document.hidden) clear(); }
  function onMotionChange() {
    clear();
    canvas.hidden = !enabled || reducedMotion.matches;
  }
  function cleanup() {
    setEnabled(false);
    observer.disconnect();
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerEnd);
    window.removeEventListener('pointercancel', onPointerEnd);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    reducedMotion.removeEventListener('change', onMotionChange);
  }
  button.addEventListener('click', () => setEnabled(!enabled));
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerEnd, { passive: true });
  window.addEventListener('pointercancel', onPointerEnd, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener('change', onMotionChange);
  window.addEventListener('pagehide', event => { if (!event.persisted) cleanup(); else clear(); });
  window.PortfolioElectric = { isEnabled: () => enabled, burst };
  setEnabled(false);
})();
