(() => {
  let theme = 'dark';
  try { theme = localStorage.getItem('nr-security-theme') || localStorage.getItem('qa-portfolio-theme') || 'dark'; } catch {}
  document.documentElement.dataset.theme = ['light', 'dark'].includes(theme) ? theme : 'dark';
})();
