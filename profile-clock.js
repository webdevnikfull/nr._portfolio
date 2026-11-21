/* Read the visitor's device clock: no fixed time zone, server time or accumulated ticks. */
(() => {
  'use strict';
  const clock = document.querySelector('[data-profile-clock]');
  if (!clock) return;
  const fields = {};
  for (const name of ['time', 'hours', 'minutes', 'seconds', 'milliseconds', 'weekday', 'date', 'format', 'period']) {
    fields[name] = clock.querySelector(`[data-clock-${name}]`);
    if (!fields[name]) return;
  }
  const locale = { pl: 'pl-PL', en: 'en-GB', de: 'de-DE', uk: 'uk-UA' }[document.documentElement.lang] || 'pl-PL';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const actions = {
    pl: ['Włącz format 12-godzinny', 'Włącz format 24-godzinny'],
    en: ['Switch to 12-hour format', 'Switch to 24-hour format'],
    de: ['Zum 12-Stunden-Format wechseln', 'Zum 24-Stunden-Format wechseln'],
    uk: ['Увімкнути 12-годинний формат', 'Увімкнути 24-годинний формат']
  }[document.documentElement.lang] || ['Switch to 12-hour format', 'Switch to 24-hour format'];
  const pad = value => String(value).padStart(2, '0');
  let lastDate = '';
  let lastTime = '';
  let frame = 0;
  let running = false;
  let inView = true;
  let leaving = false;
  let lastPaint = -Infinity;
  let twelveHour = false;
  let point = null;
  function clearPoint() {
    point = null;
    clock.classList.remove('is-clock-engaged');
    for (const key of ['--clock-x', '--clock-y', '--clock-pitch', '--clock-yaw']) clock.style.removeProperty(key);
  }
  function drawPoint() {
    if (!point || reduced.matches) return;
    const rect = clock.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height));
    clock.style.setProperty('--clock-x', (x * 100).toFixed(1) + '%');
    clock.style.setProperty('--clock-y', (y * 100).toFixed(1) + '%');
    clock.style.setProperty('--clock-pitch', (point.touch ? 0 : (.5 - y) * 1.5).toFixed(2) + 'deg');
    clock.style.setProperty('--clock-yaw', (point.touch ? 0 : (x - .5) * 2).toFixed(2) + 'deg');
    point = null;
  }
  function write(element, value) { if (element.textContent !== value) element.textContent = value; }
  function render() {
    // Native local getters follow this visitor's current system time and time zone.
    const now = new Date();
    const localHour = now.getHours();
    const hours = pad(twelveHour ? (localHour % 12 || 12) : localHour);
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    write(fields.hours, hours);
    write(fields.minutes, minutes);
    write(fields.seconds, seconds);
    write(fields.milliseconds, String(now.getMilliseconds()).padStart(3, '0'));
    write(fields.period, localHour < 12 ? 'AM' : 'PM');
    clock.style.setProperty('--clock-phase', (now.getMilliseconds() / 1000).toFixed(3));
    drawPoint();
    const dateKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    if (dateKey !== lastDate) {
      write(fields.weekday, now.toLocaleDateString(locale, { weekday: 'long' }));
      const dateParts = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' }).formatToParts(now);
      fields.date.replaceChildren(...dateParts.map(part => {
        if (part.type === 'literal') return document.createTextNode(part.value);
        const span = document.createElement('span');
        span.className = 'calendar-' + part.type;
        span.textContent = part.value;
        return span;
      }));
      fields.date.dateTime = dateKey;
      lastDate = dateKey;
    }
    const suffix = twelveHour ? ' ' + fields.period.textContent : '';
    const timeKey = `${dateKey}T${hours}:${minutes}:${seconds}${suffix}`;
    if (timeKey !== lastTime) {
      fields.time.dateTime = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
      fields.time.setAttribute('aria-label', `${hours}:${minutes}:${seconds}${suffix}`);
      lastTime = timeKey;
    }
  }
  function tick(timestamp) {
    frame = 0;
    if (!running) return;
    if (timestamp - lastPaint >= (reduced.matches ? 250 : 33)) {
      render();
      lastPaint = timestamp;
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    const enabled = document.documentElement.dataset.effectsPaused !== 'true';
    clock.hidden = !enabled;
    const next = enabled && !document.hidden && inView && !leaving;
    if (!next) {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      clearPoint();
      return;
    }
    render();
    if (running) return;
    running = true;
    lastPaint = -Infinity;
    frame = requestAnimationFrame(tick);
  }
  fields.format.addEventListener('click', () => {
    twelveHour = !twelveHour;
    fields.format.textContent = twelveHour ? '12H' : '24H';
    fields.format.setAttribute('aria-pressed', String(twelveHour));
    fields.format.title = actions[twelveHour ? 1 : 0];
    fields.period.hidden = !twelveHour;
    render();
  });
  clock.addEventListener('pointerenter', event => {
    if (fine.matches && event.pointerType !== 'touch' && !reduced.matches) clock.classList.add('is-clock-engaged');
  }, { passive: true });
  clock.addEventListener('pointermove', event => {
    if (!running || reduced.matches || !fine.matches || event.pointerType === 'touch' || event.isPrimary === false) return;
    point = { x: event.clientX, y: event.clientY, touch: false };
  }, { passive: true });
  clock.addEventListener('pointerdown', event => {
    if (!running || reduced.matches || event.isPrimary === false) return;
    clock.classList.add('is-clock-engaged');
    point = { x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' };
  }, { passive: true });
  clock.addEventListener('pointerup', event => { if (event.pointerType === 'touch') clearPoint(); }, { passive: true });
  clock.addEventListener('pointerleave', clearPoint, { passive: true });
  clock.addEventListener('pointercancel', clearPoint, { passive: true });
  render();
  clock.hidden = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      sync();
    }, { threshold: 0 });
    observer.observe(clock);
  }
  reduced.addEventListener('change', () => { clearPoint(); sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('portfoliovisualeffectschange', sync);
  window.addEventListener('focus', sync);
  window.addEventListener('blur', clearPoint);
  window.addEventListener('pagehide', () => { leaving = true; sync(); });
  window.addEventListener('pageshow', () => { leaving = false; sync(); });
  sync();
})();
