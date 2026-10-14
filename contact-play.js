(() => {
  'use strict';
  const section = document.querySelector('.contact-section');
  const monogram = section?.querySelector('.contact-monogram');
  const anchor = monogram?.querySelector('span');
  if (!section || !monogram || !anchor) return;

  const language = document.documentElement.lang?.slice(0, 2) || 'pl';
  const labels = {
    pl: { play: 'Przeciągnij i puść świetlną kropkę, aby opadła. Strzałki przesuwają kropkę, Enter ją upuszcza.', reset: 'Resetuj efekt' },
    en: { play: 'Drag and release the light dot to let it fall. Arrow keys move it; Enter drops it.', reset: 'Reset effect' },
    de: { play: 'Lichtpunkt ziehen und loslassen, damit er fällt. Pfeiltasten bewegen ihn; Enter lässt ihn fallen.', reset: 'Effekt zurücksetzen' },
    uk: { play: 'Перетягніть і відпустіть світлову крапку, щоб вона впала. Стрілки переміщують її, Enter відпускає.', reset: 'Скинути ефект' }
  }[language] || { play: 'Drag and release the light dot to let it fall. Arrow keys move it; Enter drops it.', reset: 'Reset effect' };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ball = document.createElement('button');
  ball.type = 'button';
  ball.className = 'contact-play-ball';
  ball.setAttribute('aria-label', labels.play);
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'contact-play-reset';
  reset.hidden = true;
  reset.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/></svg>';
  reset.append(document.createTextNode(labels.reset));
  const canvas = document.createElement('canvas');
  canvas.className = 'contact-play-trail';
  canvas.setAttribute('aria-hidden', 'true');
  section.append(canvas, ball, reset);
  anchor.classList.add('contact-play-anchor');
  const context = canvas.getContext('2d');
  const measureContext = document.createElement('canvas').getContext('2d');
  if (!context || !measureContext) {
    anchor.classList.remove('contact-play-anchor');
    canvas.remove(); ball.remove(); reset.remove();
    return;
  }

  let enabled = window.PortfolioElectric?.isEnabled?.() || false;
  let width = 0, height = 0, radius = 12, floor = 0, origin = { x: 0, y: 0 };
  let x = 0, y = 0, vx = 0, vy = 0, running = false, dragging = false, displaced = false;
  let pointer = null, samples = [], previous = 0, frame = 0, visible = true;
  let pointerOffset = { x: 0, y: 0 }, previousTrail = null, collisionAt = 0;
  let protectedArea = null;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
  const inset = () => radius + 9;
  const drawPosition = () => { ball.style.left = `${x - radius}px`; ball.style.top = `${y - radius}px`; };
  function avoidText(falling = false) {
    if (!protectedArea) return;
    const a = protectedArea;
    if (!(x > a.left && x < a.right && y > a.top && y < a.bottom)) return;
    // Let a falling dot reach the letter baseline without obscuring the links.
    const sides = [
      { distance: x - a.left, axis: 'x', value: a.left },
      { distance: a.right - x, axis: 'x', value: a.right },
      { distance: a.bottom - y, axis: 'y', value: a.bottom },
      ...(!falling ? [{ distance: y - a.top, axis: 'y', value: a.top }] : [])
    ].filter(side => side.value >= inset() && side.value <= (side.axis === 'x' ? width - inset() : floor));
    sides.sort((a, b) => a.distance - b.distance);
    if (sides[0]?.axis === 'x') { x = sides[0].value; vx = 0; }
    else if (sides[0]) { y = sides[0].value; vy = Math.max(0, vy); }
  }
  function limitPosition(falling = false) {
    x = clamp(x, inset(), width - inset());
    y = clamp(y, inset(), floor);
    avoidText(falling);
  }

  function measure() {
    const oldWidth = width, oldHeight = height, oldFloor = floor;
    const wasOnFloor = displaced && !dragging && Math.abs(y - oldFloor) < 1;
    const sectionRect = section.getBoundingClientRect();
    const dotRect = anchor.getBoundingClientRect();
    const style = getComputedStyle(anchor);
    const fontSize = parseFloat(style.fontSize) || 100;
    measureContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const dot = measureContext.measureText('.');
    const font = measureContext.measureText('Hg');
    const letters = measureContext.measureText('nr');
    const ascent = font.fontBoundingBoxAscent || fontSize * .8;
    const descent = font.fontBoundingBoxDescent || fontSize * .2;
    const lineHeight = parseFloat(style.lineHeight) || dotRect.height || fontSize;
    const baseline = dotRect.top - sectionRect.top + (lineHeight - ascent - descent) / 2 + ascent;
    const glyphWidth = dot.actualBoundingBoxLeft + dot.actualBoundingBoxRight || fontSize * .23;
    const glyphHeight = dot.actualBoundingBoxAscent + dot.actualBoundingBoxDescent || fontSize * .23;
    radius = clamp(Math.max(glyphWidth, glyphHeight) / 2, 9, 28);
    width = section.clientWidth; height = section.clientHeight;
    // The circle's lower edge aligns with the actual ink of the letters, not
    // with the bottom of the section or the punctuation's line box.
    floor = clamp(baseline + (letters.actualBoundingBoxDescent || 0) - radius, inset(), height - inset());
    origin = {
      x: dotRect.left - sectionRect.left - (dot.actualBoundingBoxLeft || 0) + glyphWidth / 2,
      y: baseline - (dot.actualBoundingBoxAscent || glyphHeight) + glyphHeight / 2
    };
    ball.style.width = ball.style.height = `${radius * 2}px`;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density); canvas.height = Math.round(height * density);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    context.setTransform(density, 0, 0, density, 0, 0);
    const textRect = section.querySelector('.contact-text')?.getBoundingClientRect();
    protectedArea = textRect ? {
      left: textRect.left - sectionRect.left - radius - 10,
      right: textRect.right - sectionRect.left + radius + 10,
      top: textRect.top - sectionRect.top - radius - 10,
      bottom: textRect.bottom - sectionRect.top + radius + 10
    } : null;
    if (!enabled || !displaced) { x = origin.x; y = origin.y; }
    else {
      if (oldWidth) x *= width / oldWidth;
      if (oldHeight) y = wasOnFloor ? floor : y * height / oldHeight;
      limitPosition(running || wasOnFloor);
    }
    previousTrail = null;
    drawPosition();
  }

  function electricArc(from, to, opacity) {
    if (!enabled || motion.matches) return;
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    if (distance < 1) return;
    const normalX = -(to.y - from.y) / distance, normalY = (to.x - from.x) / distance;
    context.beginPath(); context.moveTo(from.x, from.y);
    const parts = Math.max(3, Math.ceil(distance / 8));
    for (let i = 1; i < parts; i++) {
      const offset = (Math.random() - .5) * 4;
      context.lineTo(from.x + (to.x - from.x) * i / parts + normalX * offset,
        from.y + (to.y - from.y) * i / parts + normalY * offset);
    }
    context.lineTo(to.x, to.y);
    context.strokeStyle = `rgba(139, 224, 255, ${opacity})`;
    context.lineWidth = 1; context.shadowColor = '#71d4ff'; context.shadowBlur = 5;
    context.stroke(); context.shadowBlur = 0;
  }
  function collide(timestamp) {
    if (timestamp - collisionAt < 160 || !enabled) return;
    collisionAt = timestamp;
    ball.classList.add('is-collision');
    if (!motion.matches) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        electricArc({ x, y }, { x: x + Math.cos(angle) * (radius + 12), y: y + Math.sin(angle) * (radius + 12) }, .3);
      }
      const bounds = section.getBoundingClientRect();
      window.PortfolioElectric?.burst(bounds.left + x, bounds.top + y, .2);
    }
  }
  function stopFrames() { cancelAnimationFrame(frame); frame = 0; previous = 0; previousTrail = null; }
  function settle() {
    running = false; vx = vy = 0;
    stopFrames(); context.clearRect(0, 0, width, height);
    ball.classList.remove('is-playing', 'is-collision');
    drawPosition();
  }
  function step(timestamp) {
    frame = 0;
    if (!enabled || (!running && !dragging) || !visible || document.hidden || motion.matches) return;
    const elapsed = previous ? Math.min((timestamp - previous) / 1000, .035) : 0;
    previous = timestamp;
    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.fillStyle = 'rgba(0,0,0,.18)'; context.fillRect(0, 0, width, height);
    context.restore();
    if (running && !dragging) {
      vx *= Math.exp(-1.6 * elapsed);
      vy = Math.min(vy + 680 * elapsed, 420);
      x += vx * elapsed; y += vy * elapsed;
      if (x < inset() || x > width - inset()) {
        x = clamp(x, inset(), width - inset()); vx *= -.2; collide(timestamp);
      }
      if (y < inset()) { y = inset(); vy = Math.max(0, vy); }
      avoidText(true);
      if (y >= floor) {
        y = floor;
        if (vy > 35) collide(timestamp);
        vy = 0;
        vx *= Math.exp(-8 * elapsed);
        if (Math.abs(vx) < 4) { settle(); return; }
      }
    }
    if (previousTrail) electricArc(previousTrail, { x, y }, dragging ? .22 : .18);
    previousTrail = { x, y };
    if (timestamp - collisionAt > 220) ball.classList.remove('is-collision');
    drawPosition();
    frame = requestAnimationFrame(step);
  }
  function startFrames() {
    if (enabled && !frame && (running || dragging) && visible && !document.hidden && !motion.matches) {
      previous = 0; frame = requestAnimationFrame(step);
    }
  }
  function launch() {
    if (!enabled) return;
    dragging = false; displaced = true;
    ball.classList.remove('is-grabbed'); ball.classList.add('is-playing'); reset.hidden = false;
    // A release supplies only modest momentum. There is no autonomous launch.
    vx = clamp(vx, -160, 160); vy = clamp(vy, -120, 180);
    if (motion.matches) {
      y = floor; limitPosition(true); settle(); return;
    }
    running = true;
    if (y >= floor && Math.abs(vx) < 4 && vy >= 0) { y = floor; settle(); return; }
    startFrames();
  }
  function restore() {
    running = false; dragging = false; displaced = false;
    const releasedPointer = pointer;
    pointer = null;
    if (releasedPointer !== null && ball.hasPointerCapture(releasedPointer)) ball.releasePointerCapture(releasedPointer);
    samples = []; vx = vy = 0;
    stopFrames(); context.clearRect(0, 0, width, height);
    ball.classList.remove('is-grabbed', 'is-playing', 'is-collision'); reset.hidden = true;
    measure();
  }
  function updateMode(on) {
    enabled = Boolean(on);
    if (!enabled) restore();
    ball.disabled = !enabled;
    ball.tabIndex = enabled ? 0 : -1;
    ball.setAttribute('aria-disabled', String(!enabled));
    ball.title = enabled ? labels.play : '';
    ball.classList.toggle('is-interactive', enabled);
    canvas.hidden = !enabled;
  }
  ball.addEventListener('pointerdown', event => {
    if (!enabled || pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    ball.focus({ preventScroll: true });
    pointer = event.pointerId; ball.setPointerCapture(pointer);
    dragging = true; running = false; displaced = true; vx = vy = 0;
    const rect = section.getBoundingClientRect();
    pointerOffset = { x: event.clientX - rect.left - x, y: event.clientY - rect.top - y };
    samples = [{ x, y, time: performance.now() }];
    ball.classList.add('is-grabbed'); ball.classList.remove('is-playing'); reset.hidden = false;
    startFrames();
  });
  ball.addEventListener('pointermove', event => {
    if (!enabled || !dragging || event.pointerId !== pointer) return;
    const rect = section.getBoundingClientRect();
    x = event.clientX - rect.left - pointerOffset.x; y = event.clientY - rect.top - pointerOffset.y;
    limitPosition(); drawPosition();
    const now = performance.now(); samples.push({ x, y, time: now });
    samples = samples.filter(sample => now - sample.time <= 100);
  });
  function release(event) {
    if (!enabled || !dragging || event.pointerId !== pointer) return;
    const first = samples[0], last = samples[samples.length - 1];
    if (first && last && last.time - first.time > 8 && performance.now() - last.time < 120) {
      vx = (last.x - first.x) / ((last.time - first.time) / 1000);
      vy = (last.y - first.y) / ((last.time - first.time) / 1000);
    }
    const releasedPointer = pointer;
    pointer = null;
    if (ball.hasPointerCapture(releasedPointer)) ball.releasePointerCapture(releasedPointer);
    launch();
  }
  ball.addEventListener('pointerup', release);
  ball.addEventListener('pointercancel', event => { if (dragging && event.pointerId === pointer) restore(); });
  ball.addEventListener('lostpointercapture', event => { if (dragging && event.pointerId === pointer) restore(); });
  ball.addEventListener('keydown', event => {
    if (!enabled || dragging || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    settle(); displaced = true; reset.hidden = false;
    const amount = event.shiftKey ? 48 : 24;
    x += event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
    y += event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
    limitPosition(); drawPosition();
  });
  ball.addEventListener('click', event => { if (enabled && event.detail === 0 && !dragging) { vx = vy = 0; launch(); } });
  reset.addEventListener('click', () => {
    restore();
    if (enabled) ball.focus({ preventScroll: true });
  });
  window.addEventListener('portfolioelectricchange', event => updateMode(event.detail?.enabled));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopFrames(); else startFrames(); });
  motion.addEventListener('change', () => { if (motion.matches) restore(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) stopFrames(); else startFrames();
    }, { threshold: .04 }).observe(section);
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(section); observer.observe(monogram);
  } else window.addEventListener('resize', measure, { passive: true });
  measure();
  updateMode(enabled);
  document.fonts?.ready.then(measure);
})();
