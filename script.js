/* Portfolio interactions. No external libraries required. */
(() => {
  'use strict';
  const root = document.documentElement;
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Works without storage. */ } }
  };
  const themeButton = document.getElementById('theme-toggle');
  const menuButton = document.getElementById('menu-toggle');
  const navigation = document.getElementById('navigation');
  const language = root.lang;
  function updateThemeLabel() {
    const dark = root.dataset.theme === 'dark';
    const labels = {
      pl: ['Włącz ciemny motyw', 'Włącz jasny motyw'],
      en: ['Use dark theme', 'Use light theme'],
      de: ['Dunkles Design aktivieren', 'Helles Design aktivieren']
    };
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', (labels[language] || labels.pl)[Number(dark)]);
  }
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  }
  root.dataset.theme = storage.get('qa-portfolio-theme') === 'dark' ? 'dark' : 'light';
  updateThemeLabel();
  document.querySelectorAll('.language-switch a').forEach(link => {
    if (location.hash) link.hash = location.hash;
  });
  window.addEventListener('hashchange', () => {
    document.querySelectorAll('.language-switch a').forEach(link => { link.hash = location.hash; });
  });
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    storage.set('qa-portfolio-theme', root.dataset.theme);
    updateThemeLabel();
  });
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.nav-shell')) setMenu(false); });
  window.matchMedia('(min-width: 901px)').addEventListener('change', () => setMenu(false));
  document.getElementById('year').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window) {
    const links = [...navigation.querySelectorAll('a')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          const active = link.hash === '#' + entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    links.forEach(link => { const section = document.querySelector(link.hash); if (section) observer.observe(section); });
  }
})();
