/* Native details keeps the language control usable without JavaScript. */
(() => {
  const language = document.querySelector('.language-switch');
  if (!language) return;
  document.addEventListener('click', event => {
    if (!language.contains(event.target)) language.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && language.open) {
      language.open = false;
      language.querySelector('summary').focus();
    }
  });
  language.addEventListener('focusout', event => {
    if (!language.contains(event.relatedTarget)) language.open = false;
  });
})();
