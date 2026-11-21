/* Use a section-specific icon on each existing disclosure button. */
(() => {
  'use strict';
  const icons = {
    skills: 'M3 3h18v14H3zM8 21h8m-4-4v4M6 11h3l2-4 2 6 2-3h3',
    experience: 'M3 7h18v13H3zM8 7V4h8v3M3 12a18 18 0 0 0 18 0m-9 1v2',
    projects: 'M3 4h18v16H3zM3 8h18m-9 3-3 3 3 3m3-6 3 3-3 3',
    education: 'M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1Zm0 0v15',
    certificates: 'M13 3H5v18h14V9l-6-6Zm0 0v6h6m-11 6 2 2 5-5',
    volunteer: 'M12 21 4 13C-1 8 5 1 10 6l2 2 2-2c5-5 11 2 6 7l-8 8Z'
  };

  for (const [id, path] of Object.entries(icons)) {
    const card = document.getElementById(id)?.querySelector('.section-intro-action');
    if (!card) continue;

    const icon = document.createElement('span');
    icon.className = 'section-card-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="' + path + '"/></svg>';
    card.classList.add('section-summary-card');
    card.prepend(icon);
  }
})();
