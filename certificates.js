/* Group qualification and work documents by issuer and IT field. */
(() => {
  'use strict';
  const grid = document.getElementById('certificate-grid');
  const upcoming = document.getElementById('certificate-upcoming');
  const records = window.portfolioCertificates;
  if (!grid || !upcoming || !Array.isArray(records) || !records.length) return;
  const language = document.documentElement.lang.split('-')[0];
  const labels = {
    pl: { item: 'Ukończony kurs', preview: 'Podgląd certyfikatu', open: 'Potwierdź na LinkedIn', other: 'Otwórz certyfikat', download: 'Pobierz PDF', date: 'Ukończono', close: 'Zamknij podgląd', full: 'Otwórz oryginalny PDF', image: 'Certyfikat ukończenia kursu', more: 'Więcej', less: 'Mniej', general: 'Rozwój zawodowy', duration: ['godz.', 'min'], count: ['certyfikat', 'certyfikaty'] },
    en: { item: 'Completed course', preview: 'Preview certificate', open: 'View on LinkedIn', other: 'Open certificate', download: 'Download PDF', date: 'Completed', close: 'Close preview', full: 'Open original PDF', image: 'Course completion certificate', more: 'More', less: 'Less', general: 'Professional development', duration: ['h', 'min'], count: ['certificate', 'certificates'] },
    de: { item: 'Abgeschlossener Kurs', preview: 'Zertifikat ansehen', open: 'Auf LinkedIn ansehen', other: 'Zertifikat öffnen', download: 'PDF herunterladen', date: 'Abgeschlossen', close: 'Vorschau schließen', full: 'Original-PDF öffnen', image: 'Kursabschlusszertifikat', more: 'Mehr', less: 'Weniger', general: 'Berufliche Weiterbildung', duration: ['Std.', 'Min.'], count: ['Zertifikat', 'Zertifikate'] },
    uk: { item: 'Завершений курс', preview: 'Переглянути сертифікат', open: 'Переглянути в LinkedIn', other: 'Відкрити сертифікат', download: 'Завантажити PDF', date: 'Завершено', close: 'Закрити перегляд', full: 'Відкрити оригінальний PDF', image: 'Сертифікат про завершення курсу', more: 'Більше', less: 'Менше', general: 'Професійний розвиток', duration: ['год', 'хв'], count: ['сертифікат', 'сертифікати'] }
  }[language] || null;
  if (!labels) return;
  const workLabels = {
    pl: { item: 'Potwierdzenie współpracy', preview: 'Podgląd dokumentu', date: 'Wystawiono', image: 'Dokument potwierdzający współpracę IT Support', period: 'Okres współpracy', count: ['dokument', 'dokumenty'] },
    en: { item: 'Work confirmation', preview: 'Preview document', date: 'Issued', image: 'IT Support work confirmation document', period: 'Service period', count: ['document', 'documents'] },
    de: { item: 'Bestätigung der Zusammenarbeit', preview: 'Dokument ansehen', date: 'Ausgestellt', image: 'Nachweis der Zusammenarbeit im IT-Support', period: 'Leistungszeitraum', count: ['Dokument', 'Dokumente'] },
    uk: { item: 'Підтвердження співпраці', preview: 'Переглянути документ', date: 'Видано', image: 'Документ про співпрацю у сфері IT Support', period: 'Період співпраці', count: ['документ', 'документи'] }
  }[language];
  const localize = value => typeof value === 'string' ? value : value?.[language] || value?.en || value?.pl || '';
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  function safeUrl(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return '';
    try {
      const url = new URL(raw, document.baseURI);
      return ['https:', 'http:', 'file:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }
  function previewKind(url) {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(png|jpe?g|webp|gif|svg)$/.test(path) ? 'image' : /\.pdf$/.test(path) ? 'pdf' : '';
  }
  function dateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return String(value);
    const date = new Date(value + 'T12:00:00');
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString({ pl: 'pl-PL', en: 'en-GB', de: 'de-DE', uk: 'uk-UA' }[language], { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const dialog = create('dialog', 'certificate-dialog');
  dialog.setAttribute('aria-labelledby', 'certificate-preview-title');
  const modal = create('div', 'certificate-dialog-inner');
  const modalHead = create('div', 'certificate-dialog-head');
  const modalTitle = create('strong'); modalTitle.id = 'certificate-preview-title';
  const closeButton = create('button', 'certificate-dialog-close', '×');
  closeButton.type = 'button'; closeButton.setAttribute('aria-label', labels.close);
  const viewer = create('div', 'certificate-dialog-viewer');
  const fullLink = create('a', 'certificate-dialog-full', labels.full + ' ↗');
  fullLink.target = '_blank'; fullLink.rel = 'noopener noreferrer';
  modalHead.append(modalTitle, closeButton); modal.append(modalHead, viewer, fullLink); dialog.append(modal); document.body.append(dialog);
  let trigger = null;
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { viewer.replaceChildren(); trigger?.focus(); });
  function showPreview(url, kind, title, button, poster, previewCopy = labels) {
    if (typeof dialog.showModal !== 'function') { window.open(url, '_blank', 'noopener,noreferrer'); return; }
    trigger = button; modalTitle.textContent = title; fullLink.href = url; viewer.replaceChildren();
    if (kind === 'image' || poster) {
      const image = create('img'); image.src = poster || url; image.alt = previewCopy.image + ': ' + title; viewer.append(image);
    } else {
      const frame = create('iframe'); frame.src = url; frame.title = previewCopy.image + ': ' + title; frame.loading = 'lazy'; viewer.append(frame);
    }
    dialog.showModal();
  }
  const providers = new Map(), cards = [];
  function groupFor(issuer, category, issuerLogo) {
    if (!providers.has(issuer)) {
      const section = create('section', 'certificate-provider');
      const head = create('div', 'certificate-provider-head');
      const heading = create('h3', '', issuer); heading.id = 'certificate-provider-' + (providers.size + 1);
      section.setAttribute('aria-labelledby', heading.id);
      section.dataset.certificateIssuer = issuer;
      const mark = create('span', 'certificate-provider-mark', issuer === 'LinkedIn Learning' ? 'in' : '✓'); mark.setAttribute('aria-hidden', 'true');
      if (issuer === 'LinkedIn Learning') mark.classList.add('certificate-provider-mark--linkedin');
      if (issuer === 'Mate Academy Polska' && !issuerLogo) {
        mark.classList.add('certificate-provider-mark--academy');
        mark.textContent = '';
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M3 9 12 4 21 9 12 14 3 9M7 12v5c3 2 7 2 10 0v-5M21 9v7');
        icon.append(path); mark.append(icon);
      }
      if (issuerLogo && previewKind(issuerLogo) === 'image') {
        mark.textContent = '';
        mark.classList.add('certificate-provider-mark--logo');
        const logo = create('img'); logo.src = issuerLogo; logo.alt = ''; logo.width = 44; logo.height = 44;
        mark.append(logo);
      }
      const title = create('div', 'certificate-provider-title'); title.append(mark, heading);
      const count = create('span', 'certificate-provider-count'); head.append(title, count); section.append(head); grid.append(section);
      providers.set(issuer, { section, count, categories: new Map(), cards: [], workDocuments: 0 });
    }
    const provider = providers.get(issuer);
    if (!provider.categories.has(category)) {
      const section = create('section', 'certificate-category');
      const heading = create('h4', 'certificate-category-title', category);
      const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      symbol.setAttribute('class', 'certificate-category-symbol');
      symbol.setAttribute('viewBox', '0 0 24 24');
      symbol.setAttribute('aria-hidden', 'true');
      symbol.setAttribute('focusable', 'false');
      const rays = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      rays.setAttribute('d', 'M12 3V21M4.2 7.5L19.8 16.5M4.2 16.5L19.8 7.5');
      symbol.append(rays);
      heading.prepend(symbol);
      heading.id = 'certificate-category-' + providers.size + '-' + (provider.categories.size + 1);
      section.setAttribute('aria-labelledby', heading.id);
      const list = create('div', 'certificate-category-list');
      list.dataset.certificateIssuer = issuer; list.dataset.certificateCategory = category;
      section.append(heading, list); provider.section.append(section);
      provider.categories.set(category, { section, list, cards: [] });
    }
    return { provider, category: provider.categories.get(category) };
  }
  records.forEach((record, index) => {
    if (!record || typeof record !== 'object') return;
    const isWorkDocument = record.type === 'work-confirmation';
    const itemLabels = isWorkDocument ? { ...labels, ...workLabels } : labels;
    const title = localize(record.title), issuer = String(record.issuer || '').trim();
    if (!title || !issuer) return;
    const previewUrl = safeUrl(record.preview), posterUrl = safeUrl(record.poster), certificateUrl = safeUrl(record.url);
    const kind = previewUrl ? previewKind(previewUrl) : '';
    const poster = posterUrl && previewKind(posterUrl) === 'image' ? posterUrl : '';
    const group = groupFor(issuer, localize(record.category) || labels.general, safeUrl(record.issuerLogo));
    // Native details keeps the whole row operable by touch, mouse and keyboard.
    const card = create('details', 'certificate-card certificate-entry');
    card.dataset.certificateId = String(record.id || record.preview || record.url || 'certificate-' + index);
    card.dataset.certificateIssuer = issuer;
    const panel = create('div', 'certificate-course-card certificate-course-panel');
    const summary = create('summary', 'certificate-entry-summary');
    const content = create('div', 'certificate-entry-content');
    if (isWorkDocument) card.classList.add('certificate-work-document');
    const heading = create('h5', 'certificate-course-title', title);
    summary.append(heading);
    card.append(summary);
    let previewButton = null;
    if (poster) {
      previewButton = create('button', 'certificate-document'); previewButton.type = 'button';
      previewButton.setAttribute('aria-label', itemLabels.preview + ': ' + title);
      const image = create('img'); image.src = poster; image.alt = itemLabels.image + ': ' + title; image.loading = 'lazy'; image.decoding = 'async'; image.width = record.posterWidth || 1426; image.height = record.posterHeight || 1102;
      previewButton.append(image, create('span', 'certificate-document-caption', itemLabels.preview + ' ↗'));
      previewButton.addEventListener('click', () => showPreview(previewUrl || poster, kind || 'image', title, previewButton, poster, itemLabels));
      panel.append(previewButton);
    } else panel.classList.add('certificate-course-card--text');
    const body = create('div', 'certificate-course-body');
    const top = create('div', 'certificate-course-top');
    const topic = create('span', 'certificate-topic', localize(record.topic) || itemLabels.item);
    const completed = create('span', 'certificate-completed', (isWorkDocument ? '' : '✓ ') + itemLabels.item); top.append(topic, completed);
    body.append(top);
    if (record.description) body.append(create('p', 'certificate-course-description', localize(record.description)));
    const meta = create('div', 'certificate-course-meta');
    if (record.date) {
      const issued = create('span', 'certificate-meta-item');
      issued.append(create('span', '', itemLabels.date)); const time = create('time', '', dateLabel(record.date));
      time.dateTime = String(record.date); issued.append(time); meta.append(issued);
    }
    if (record.period) {
      const period = create('span', 'certificate-meta-item certificate-service-period');
      period.append(create('span', '', itemLabels.period || ''), create('span', '', localize(record.period)));
      meta.append(period);
    }
    if (Number.isFinite(record.durationMinutes) && record.durationMinutes > 0) {
      const hours = Math.floor(record.durationMinutes / 60), minutes = record.durationMinutes % 60;
      const duration = [hours ? hours + ' ' + labels.duration[0] : '', minutes ? minutes + ' ' + labels.duration[1] : ''].filter(Boolean).join(' ');
      const item = create('span', 'certificate-meta-item certificate-duration'); item.append(create('span', '', '◷'), create('span', '', duration)); meta.append(item);
    }
    body.append(meta);
    if (Array.isArray(record.skills)) {
      const skills = create('div', 'certificate-course-skills');
      record.skills.forEach(skill => skills.append(create('span', '', localize(skill)))); body.append(skills);
    }
    const actions = create('div', 'certificate-actions');
    if (kind) {
      const button = create('button', 'certificate-action certificate-action-preview', itemLabels.preview); button.type = 'button';
      button.addEventListener('click', () => showPreview(previewUrl, kind, title, button, poster, itemLabels)); actions.append(button);
      if (kind === 'pdf') {
        const link = create('a', 'certificate-action', labels.download + ' ↓'); link.href = previewUrl;
        link.download = record.id ? record.id + '.pdf' : 'certificate.pdf'; actions.append(link);
      }
    }
    if (certificateUrl) {
      const link = create('a', 'certificate-action certificate-action-link', (issuer === 'LinkedIn Learning' ? labels.open : labels.other) + ' ↗');
      link.href = certificateUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; actions.append(link);
    }
    body.append(actions); panel.append(body); content.append(panel); card.append(content);
    group.category.list.append(card); cards.push(card); group.provider.cards.push(card); group.category.cards.push(card);
    if (isWorkDocument) group.provider.workDocuments++;
  });
  if (!cards.length) { dialog.remove(); return; }
  grid.hidden = false;
  const sources = [...upcoming.querySelectorAll('[data-certificate-issuer]')];
  sources.forEach(source => { source.hidden = providers.has(source.dataset.certificateIssuer); });
  upcoming.hidden = !sources.some(source => !source.hidden);
  upcoming.classList.add('has-issued-certificates');
  providers.forEach(provider => { const n = provider.cards.length; const counts = provider.workDocuments ? workLabels.count : labels.count; provider.count.textContent = n + ' ' + counts[n === 1 ? 0 : 1]; });
  // All certificate titles stay visible; details remain collapsed.
  cards.forEach(card => { card.hidden = false; });
})();
