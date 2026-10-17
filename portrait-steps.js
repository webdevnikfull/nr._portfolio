/* Select one support principle without changing the portrait or opening another view. */
(() => {
  'use strict';
  const steps = document.querySelector('.portrait-steps');
  if (!steps || steps.querySelector('.portrait-method-step')) return;
  const items = [...steps.children].filter(item => item.tagName === 'SPAN');
  if (!items.length) return;
  const labels = {
    pl: 'Moje podejście do wsparcia', en: 'My approach to support',
    de: 'Mein Support-Ansatz', uk: 'Мій підхід до підтримки'
  };
  steps.setAttribute('role', 'group');
  steps.setAttribute('aria-label', steps.closest('.portrait-method')?.querySelector('.portrait-kicker')?.textContent.trim()
    || labels[document.documentElement.lang] || labels.en);
  const buttons = items.map(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'portrait-method-step';
    button.setAttribute('aria-pressed', 'false');
    button.append(...item.childNodes);
    item.replaceWith(button);
    return button;
  });
  const select = button => buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  steps.addEventListener('click', event => {
    const button = event.target.closest('.portrait-method-step');
    if (buttons.includes(button)) select(button);
  });
  steps.addEventListener('keydown', event => {
    const current = buttons.indexOf(event.target.closest('.portrait-method-step'));
    if (current < 0 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (current + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
    select(buttons[next]);
    buttons[next].focus();
  });
})();
