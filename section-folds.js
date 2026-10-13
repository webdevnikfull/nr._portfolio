/* Keep the introduction visible; reveal each section's details on request. */
(() => {
  'use strict';

  const labels = {
    pl: { more: 'Więcej informacji', less: 'Zwiń informacje', cueMore: 'Odkryj więcej', cueLess: 'Mniej szczegółów' },
    en: { more: 'More information', less: 'Show less information', cueMore: 'Explore more', cueLess: 'Hide details' },
    de: { more: 'Mehr Informationen', less: 'Weniger Informationen', cueMore: 'Mehr entdecken', cueLess: 'Details schließen' },
    uk: { more: 'Більше інформації', less: 'Згорнути інформацію', cueMore: 'Дізнатися більше', cueLess: 'Згорнути деталі' }
  }[document.documentElement.lang] || { more: 'Więcej informacji', less: 'Zwiń informacje', cueMore: 'Odkryj więcej', cueLess: 'Mniej szczegółów' };

  const sections = new Map();
  for (const id of ['skills', 'experience', 'projects', 'education', 'certificates', 'volunteer']) {
    const section = document.getElementById(id);
    if (!section || section.children.length < 2) continue;

    const heading = section.firstElementChild;
    const content = document.createElement('div');
    content.className = 'section-details';
    content.id = id + '-details';
    content.hidden = true;
    while (heading.nextElementSibling) content.append(heading.nextElementSibling);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'section-disclosure';
    button.id = id + '-toggle';
    button.setAttribute('aria-controls', content.id);
    content.setAttribute('aria-labelledby', button.id);
    content.setAttribute('role', 'region');
    section.classList.add('folded-section');
    section.append(button, content);

    const intro = heading.querySelector('.section-intro');
    const title = heading.querySelector('h2')?.textContent.trim() || id;
    let introButton = null;
    let introCue = null;
    if (intro) {
      introButton = document.createElement('button');
      introButton.type = 'button';
      introButton.className = 'section-intro-action';
      introButton.setAttribute('aria-controls', content.id);
      const introText = document.createElement('span');
      introText.className = 'section-intro';
      introText.textContent = intro.textContent.trim();
      intro.replaceWith(introButton);
      introButton.append(introText);
      introCue = document.createElement('span');
      introCue.className = 'section-intro-cue';
      introCue.setAttribute('aria-hidden', 'true');
      introButton.append(introCue);
      introButton.addEventListener('click', () => setOpen(content.hidden));
    }

    function setOpen(open) {
      content.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? labels.less : labels.more;
      if (introButton) {
        introButton.setAttribute('aria-expanded', String(open));
        introButton.setAttribute('aria-label', (open ? labels.less : labels.more) + ': ' + title);
        introCue.textContent = open ? labels.cueLess : labels.cueMore;
      }
      section.classList.toggle('is-open', open);
    }
    button.addEventListener('click', () => setOpen(content.hidden));
    sections.set(id, setOpen);
    setOpen(false);
  }

  function revealHash(hash) {
    if (!hash || hash === '#') return;
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return; }
    const section = target?.closest('section');
    if (section && sections.has(section.id)) sections.get(section.id)(true);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) revealHash(link.getAttribute('href'));
  });
  window.addEventListener('hashchange', () => revealHash(window.location.hash));
  revealHash(window.location.hash);
})();
