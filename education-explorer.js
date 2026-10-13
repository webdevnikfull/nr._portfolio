/* Separate education and languages while keeping all content in the HTML. */
(() => {
  'use strict';

  const copy = {
    pl: { education: 'Edukacja', languages: 'Języki', educationKicker: 'ŚCIEŻKA EDUKACJI', educationTitle: 'Moja edukacja', languagesKicker: 'KOMPETENCJE JĘZYKOWE', languagesTitle: 'Języki i poziom znajomości' },
    en: { education: 'Education', languages: 'Languages', educationKicker: 'EDUCATION PATH', educationTitle: 'My education', languagesKicker: 'LANGUAGE SKILLS', languagesTitle: 'Languages and proficiency' },
    de: { education: 'Ausbildung', languages: 'Sprachen', educationKicker: 'BILDUNGSWEG', educationTitle: 'Meine Ausbildung', languagesKicker: 'SPRACHKENNTNISSE', languagesTitle: 'Sprachen und Kenntnisse' },
    uk: { education: 'Освіта', languages: 'Мови', educationKicker: 'ОСВІТА', educationTitle: 'Моя освіта', languagesKicker: 'МОВНІ НАВИЧКИ', languagesTitle: 'Мови та рівень володіння' }
  }[document.documentElement.lang] || null;
  const list = document.querySelector('#education .education-list');
  if (!copy || !list) return;

  const schools = Array.from(list.querySelectorAll(':scope > article'));
  const learning = list.querySelector(':scope > .education-learning');
  const languages = list.querySelector(':scope > .languages');
  if (!schools.length || !languages) return;

  const tabs = document.createElement('div');
  tabs.className = 'education-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', document.querySelector('#education-title')?.textContent.trim() || copy.education);

  const panels = ['education', 'languages'].map((kind, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'education-tab';
    tab.id = `education-tab-${kind}`;
    const count = kind === 'education' ? schools.length : languages.children.length;
    tab.textContent = `${index === 0 ? '01' : '02'}  ${copy[kind]} · ${count}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `education-panel-${kind}`);
    tabs.append(tab);

    const panel = document.createElement('div');
    panel.className = `education-panel education-panel-${kind}`;
    panel.id = `education-panel-${kind}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    const heading = document.createElement('div');
    heading.className = 'education-panel-heading';
    const kicker = document.createElement('p');
    kicker.className = 'education-panel-kicker';
    kicker.textContent = copy[`${kind}Kicker`];
    const title = document.createElement('h3');
    title.textContent = copy[`${kind}Title`];
    heading.append(kicker, title);
    panel.append(heading);
    return { tab, panel };
  });

  const schoolCards = document.createElement('div');
  schoolCards.className = 'education-cards';
  schools.forEach((school, index) => {
    school.classList.add('education-card');
    school.style.setProperty('--card-index', String(index));
    schoolCards.append(school);
  });
  panels[0].panel.append(schoolCards);
  if (learning) panels[0].panel.append(learning);

  Array.from(languages.children).forEach((item, index) => {
    const [name, level] = item.textContent.split('·').map(part => part.trim());
    if (!name || !level) return;
    const code = document.createElement('span');
    code.className = 'language-code';
    code.setAttribute('aria-hidden', 'true');
    code.textContent = ['PL', 'EN', 'UK', 'DE'][index] || String(index + 1).padStart(2, '0');
    const text = document.createElement('span');
    text.className = 'language-text';
    const languageName = document.createElement('strong');
    languageName.textContent = name;
    const languageLevel = document.createElement('small');
    languageLevel.textContent = level;
    text.append(languageName, languageLevel);
    item.replaceChildren(code, text);
    item.classList.add('language-card');
  });
  panels[1].panel.append(languages);
  list.classList.add('education-explorer');
  list.append(tabs, ...panels.map(({ panel }) => panel));

  function activate(index, moveFocus = false) {
    panels.forEach(({ tab, panel }, itemIndex) => {
      const selected = itemIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    });
    if (moveFocus) panels[index].tab.focus();
  }
  panels.forEach(({ tab }, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      const keys = { ArrowLeft: (index + 1) % 2, ArrowRight: (index + 1) % 2, Home: 0, End: 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      activate(keys[event.key], true);
    });
  });
  activate(0);
})();
