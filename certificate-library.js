/* Expandable topics for each issuer, with search for the LinkedIn Learning collection. */
(() => {
  'use strict';

  const grid = document.getElementById('certificate-grid');
  if (!grid) return;

  const lang = document.documentElement.lang;
  const copy = {
    pl: ['Szukaj certyfikatów', 'Nazwa, temat lub umiejętność', 'Wyczyść', 'Wyniki', 'Brak pasujących certyfikatów.'],
    en: ['Search certificates', 'Title, topic or skill', 'Clear', 'Results', 'No matching certificates.'],
    de: ['Zertifikate suchen', 'Titel, Thema oder Fähigkeit', 'Löschen', 'Ergebnisse', 'Keine passenden Zertifikate.'],
    uk: ['Пошук сертифікатів', 'Назва, тема або навичка', 'Очистити', 'Результати', 'Сертифікатів не знайдено.']
  }[lang];
  if (!copy) return;

  const create = (tag, className, text = '') => {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  };

  const normalize = text => text.toLocaleLowerCase(lang).normalize('NFD')
    .replace(/\p{M}/gu, '').replace(/ł/g, 'l').trim();
  const number = new Intl.NumberFormat(lang);
  const records = new Map(window.portfolioCertificates.map(record => [record.id, record]));
  const localize = value => typeof value === 'string' ? value : value?.[lang] || value?.en || '';

  function buildTopic(section) {
    const title = section.querySelector('.certificate-category-title');
    const list = section.querySelector('.certificate-category-list');
    const category = title.textContent;
    const items = [...list.querySelectorAll('.certificate-entry')].map(card => {
      const record = records.get(card.dataset.certificateId);
      const terms = [card.querySelector('.certificate-course-title').textContent, category,
        localize(record?.topic), ...(record?.skills || []).map(localize)];
      return { card, search: normalize(terms.join(' ')) };
    });

    const topic = create('details', 'certificate-category certificate-library-topic');
    const summary = create('summary', 'certificate-library-topic-toggle');
    const count = create('span', 'certificate-library-count', number.format(items.length));
    topic.setAttribute('aria-labelledby', title.id);
    summary.append(title, count);
    topic.append(summary, list);
    section.replaceWith(topic);
    return { topic, count, items, wasOpen: false };
  }

  const topicGroups = new Map();
  for (const issuer of grid.querySelectorAll('.certificate-provider')) {
    issuer.classList.add('certificate-library');
    topicGroups.set(issuer, [...issuer.querySelectorAll('.certificate-category')].map(buildTopic));
  }

  const provider = grid.querySelector('[data-certificate-issuer="LinkedIn Learning"]');
  if (!provider) return;
  const groups = topicGroups.get(provider);

  const search = create('div', 'certificate-library-search');
  const label = create('label', 'certificate-search-label', copy[0]);
  const field = create('div', 'certificate-search-field');
  const input = create('input', 'certificate-search-input');
  const clear = create('button', 'certificate-search-clear', copy[2]);
  const status = create('p', 'certificate-search-status');
  input.id = 'linkedin-certificate-search';
  input.type = 'search';
  input.placeholder = copy[1];
  input.autocomplete = 'off';
  label.htmlFor = input.id;
  clear.type = 'button';
  clear.hidden = true;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  field.append(input, clear);
  search.append(label, field, status);
  provider.querySelector('.certificate-provider-head').after(search);

  let filtering = false;
  function update() {
    const query = normalize(input.value);
    const words = query ? query.split(/\s+/) : [];
    let total = 0;
    for (const group of groups) {
      if (query && !filtering) group.wasOpen = group.topic.open;
      let matches = 0;
      for (const item of group.items) {
        const matchesQuery = words.every(word => item.search.includes(word));
        // The existing ordering control may wrap each entry in a row.
        const row = item.card.closest('.certificate-sort-row') || item.card;
        row.hidden = !matchesQuery;
        if (matchesQuery) matches++;
      }
      group.topic.hidden = matches === 0;
      group.count.textContent = number.format(matches);
      if (query) group.topic.open = matches > 0;
      else if (filtering) group.topic.open = group.wasOpen;
      total += matches;
    }
    filtering = Boolean(query);
    provider.classList.toggle('is-filtering', filtering);
    clear.hidden = !input.value;
    status.textContent = filtering ? (total ? copy[3] + ' · ' + number.format(total) : copy[4]) : '';
  }

  // Start arranging with the full collection so hidden search results cannot be moved accidentally.
  document.getElementById('certificates')?.addEventListener('certificateorderstart', () => {
    input.value = '';
    update();
  });
  input.addEventListener('input', update);
  clear.addEventListener('click', () => {
    input.value = '';
    input.focus();
    update();
  });
})();
