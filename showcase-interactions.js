/* Native controls, passive touch feedback, and motion only while cards are visible. */
(() => {
  'use strict';
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cards = [...document.querySelectorAll('#projects .project-card')];
  const foundation = document.querySelector('.volunteer-card');
  const timers = new Map();
  let frame = 0;
  let pending = null;
  let observer;

  function clearTimer(element) {
    clearTimeout(timers.get(element));
    timers.delete(element);
  }
  function flash(element, className, duration = 900) {
    clearTimer(element);
    element.classList.remove(className);
    if (preference.matches || document.hidden) return;
    void element.offsetWidth;
    element.classList.add(className);
    timers.set(element, setTimeout(() => {
      element.classList.remove(className);
      timers.delete(element);
    }, duration));
  }
  function resetPoint(element) {
    for (const property of ['--preview-tilt-x', '--preview-tilt-y', '--showcase-x', '--showcase-y', '--foundation-x', '--foundation-y']) element.style.removeProperty(property);
  }
  function resetInput() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    pending = null;
    for (const [element, timer] of timers) {
      clearTimeout(timer);
      element.classList.remove('is-showcase-pulse', 'is-service-pulse', 'is-text-analyzing');
    }
    timers.clear();
    [...cards, foundation].filter(Boolean).forEach(element => {
      element.classList.remove('is-showcase-engaged', 'is-foundation-engaged');
      resetPoint(element);
    });
  }
  function queuePoint(element, event, isFoundation = false) {
    if (preference.matches || document.hidden || !finePointer.matches || event.pointerType === 'touch' || event.isPrimary === false) return;
    pending = { element, x: event.clientX, y: event.clientY, isFoundation };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!pending || document.hidden || preference.matches) return;
      const point = pending;
      pending = null;
      const rect = point.element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height));
      const prefix = point.isFoundation ? '--foundation-' : '--showcase-';
      point.element.style.setProperty(prefix + 'x', (x * 100).toFixed(1) + '%');
      point.element.style.setProperty(prefix + 'y', (y * 100).toFixed(1) + '%');
      if (!point.isFoundation) {
        point.element.style.setProperty('--preview-tilt-x', ((.5 - y) * 2).toFixed(2) + 'deg');
        point.element.style.setProperty('--preview-tilt-y', ((x - .5) * 3).toFixed(2) + 'deg');
      }
    });
  }
  function leave(element, className) {
    element.classList.remove(className);
    if (pending?.element === element) {
      pending = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
    resetPoint(element);
  }
  cards.forEach(card => {
    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && finePointer.matches && !preference.matches) card.classList.add('is-showcase-engaged');
    }, { passive: true });
    card.addEventListener('pointermove', event => queuePoint(card, event), { passive: true });
    card.addEventListener('pointerleave', () => leave(card, 'is-showcase-engaged'), { passive: true });
    card.addEventListener('pointercancel', () => leave(card, 'is-showcase-engaged'), { passive: true });
    card.addEventListener('pointerdown', event => {
      if (event.isPrimary !== false) flash(card, 'is-showcase-pulse');
    }, { passive: true });
    card.addEventListener('focusin', () => card.classList.add('is-showcase-engaged'));
    card.addEventListener('focusout', event => {
      if (!card.contains(event.relatedTarget)) leave(card, 'is-showcase-engaged');
    });
  });

  if ('IntersectionObserver' in window) {
    root.classList.add('showcase-motion-ready');
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('showcase-in-view', entry.isIntersecting));
    }, { threshold: .06 });
    cards.forEach(card => observer.observe(card));
  }
  function syncMotion() {
    root.classList.toggle('showcase-page-hidden', document.hidden);
    if (document.hidden || preference.matches) resetInput();
  }
  document.addEventListener('visibilitychange', syncMotion);
  preference.addEventListener('change', syncMotion);
  window.addEventListener('blur', resetInput);
  window.addEventListener('pagehide', resetInput);
  window.addEventListener('pageshow', syncMotion);
  syncMotion();

  if (foundation) {
    foundation.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && finePointer.matches && !preference.matches) foundation.classList.add('is-foundation-engaged');
    }, { passive: true });
    foundation.addEventListener('pointermove', event => queuePoint(foundation, event, true), { passive: true });
    foundation.addEventListener('pointerleave', () => leave(foundation, 'is-foundation-engaged'), { passive: true });
    foundation.addEventListener('pointercancel', () => leave(foundation, 'is-foundation-engaged'), { passive: true });
    const buttons = [...foundation.querySelectorAll('.volunteer-select')];
    buttons.forEach(button => button.addEventListener('click', () => {
      const selected = button.getAttribute('aria-pressed') !== 'true';
      buttons.forEach(control => {
        const active = control === button && selected;
        control.setAttribute('aria-pressed', String(active));
        control.closest('.volunteer-item').classList.toggle('is-service-selected', active);
      });
      flash(button.closest('.volunteer-item'), 'is-service-pulse', 850);
    }));
  }

  const textCard = cards.find(card => card.dataset.itProject === 'text');
  if (!textCard) return;
  const locale = document.documentElement.lang;
  const labels = {
    pl: { action: 'Wypróbuj kolejną próbkę tekstu', words: 'Słowa', chars: 'Znaki', reading: 'Czytanie', samples: ['Dobre wsparcie IT zaczyna się od zrozumienia problemu i jasnej komunikacji.', 'Dokumentuję rozwiązania, porządkuję wiedzę i pomagam użytkownikom sprawnie wrócić do pracy.', 'Proste narzędzia, czytelne dane i przemyślany interfejs ułatwiają codzienną pracę.'] },
    en: { action: 'Try another text sample', words: 'Words', chars: 'Characters', reading: 'Reading', samples: ['Good IT support starts with understanding the problem and communicating clearly.', 'I document solutions, organize knowledge and help users get back to work.', 'Simple tools, clear data and thoughtful interfaces make everyday work easier.'] },
    de: { action: 'Nächste Textprobe ausprobieren', words: 'Wörter', chars: 'Zeichen', reading: 'Lesezeit', samples: ['Guter IT-Support beginnt mit dem Verständnis des Problems und klarer Kommunikation.', 'Ich dokumentiere Lösungen, ordne Wissen und helfe Menschen bei der täglichen Arbeit.', 'Einfache Werkzeuge, klare Daten und durchdachte Oberflächen erleichtern den Arbeitsalltag.'] },
    uk: { action: 'Спробувати інший приклад тексту', words: 'Слова', chars: 'Символи', reading: 'Читання', samples: ['Якісна IT-підтримка починається з розуміння проблеми та зрозумілого спілкування.', 'Я документую рішення, упорядковую знання та допомагаю користувачам повернутися до роботи.', 'Прості інструменти, зрозумілі дані та продуманий інтерфейс полегшують щоденну роботу.'] }
  };
  const t = labels[locale] || labels.pl;
  const preview = textCard.querySelector('.project-visual');
  const mini = textCard.querySelector('.it-mini');
  preview.removeAttribute('aria-hidden');
  preview.querySelectorAll('.visual-label, .visual-footnote').forEach(element => element.setAttribute('aria-hidden', 'true'));
  mini.innerHTML = '<div class="it-mini-title"><b aria-hidden="true">Aa</b><strong>Text Studio</strong></div><p class="text-demo-copy"><span></span></p><div class="text-demo-stats"></div>';
  const copy = mini.querySelector('.text-demo-copy > span');
  const stats = mini.querySelector('.text-demo-stats');
  mini.setAttribute('aria-label', t.action);
  stats.setAttribute('aria-live', 'polite');
  stats.setAttribute('aria-atomic', 'true');
  let sample = 0;
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(locale, { granularity: 'word' }) : null;
  function renderSample(animate = false) {
    const value = t.samples[sample];
    const count = segmenter ? [...segmenter.segment(value)].filter(part => part.isWordLike).length : value.trim().split(/\s+/u).length;
    const characters = [...value].length;
    const seconds = Math.max(1, Math.ceil(count / 200 * 60));
    copy.textContent = value;
    stats.innerHTML = `<span><b>${count}</b>${t.words}</span><span><b>${characters}</b>${t.chars}</span><span><b>${seconds} s</b>${t.reading}</span>`;
    if (animate) flash(mini, 'is-text-analyzing', 1000);
  }
  mini.addEventListener('click', event => {
    if (event.target.closest('button, a, input, textarea, select')) return;
    sample = (sample + 1) % t.samples.length;
    renderSample(true);
  });
  renderSample();
})();
