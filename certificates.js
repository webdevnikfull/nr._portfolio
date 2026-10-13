/* Certificates remain hidden until verified records are added to certificates-data.js. */
(() => {
  'use strict';

  const grid = document.getElementById('certificate-grid');
  const upcoming = document.getElementById('certificate-upcoming');
  const records = window.portfolioCertificates;
  if (!grid || !upcoming || !Array.isArray(records) || records.length === 0) return;

  const language = document.documentElement.lang;
  const copy = {
    pl: { item: 'CERTYFIKAT', preview: 'Podgląd', open: 'Otwórz certyfikat', date: 'Wydano', close: 'Zamknij podgląd', full: 'Otwórz plik w nowej karcie', image: 'Podgląd certyfikatu', more: 'Więcej...', less: 'Mniej' },
    en: { item: 'CERTIFICATE', preview: 'Preview', open: 'Open certificate', date: 'Issued', close: 'Close preview', full: 'Open file in a new tab', image: 'Certificate preview', more: 'More...', less: 'Less' },
    de: { item: 'ZERTIFIKAT', preview: 'Vorschau', open: 'Zertifikat öffnen', date: 'Ausgestellt', close: 'Vorschau schließen', full: 'Datei in neuem Tab öffnen', image: 'Zertifikatsvorschau', more: 'Mehr...', less: 'Weniger' },
    uk: { item: 'СЕРТИФІКАТ', preview: 'Перегляд', open: 'Відкрити сертифікат', date: 'Видано', close: 'Закрити перегляд', full: 'Відкрити файл у новій вкладці', image: 'Перегляд сертифіката', more: 'Більше...', less: 'Менше' }
  }[language] || null;
  const labels = copy || {
    item: 'CERTYFIKAT', preview: 'Podgląd', open: 'Otwórz certyfikat', date: 'Wydano',
    close: 'Zamknij podgląd', full: 'Otwórz plik w nowej karcie', image: 'Podgląd certyfikatu',
    more: 'Więcej...', less: 'Mniej'
  };

  function localize(value) {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return '';
    return value[language] || value.pl || value.en || '';
  }

  function safeUrl(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return '';
    try {
      const url = new URL(raw, document.baseURI);
      return ['https:', 'http:', 'file:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function previewKind(url) {
    const pathname = new URL(url).pathname.toLowerCase();
    if (/\.(png|jpe?g|webp|gif|svg)$/.test(pathname)) return 'image';
    if (/\.pdf$/.test(pathname)) return 'pdf';
    return '';
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'certificate-dialog';
  dialog.setAttribute('aria-labelledby', 'certificate-preview-title');
  const modal = document.createElement('div');
  modal.className = 'certificate-dialog-inner';
  const modalHead = document.createElement('div');
  modalHead.className = 'certificate-dialog-head';
  const modalTitle = document.createElement('strong');
  modalTitle.id = 'certificate-preview-title';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'certificate-dialog-close';
  closeButton.setAttribute('aria-label', labels.close);
  closeButton.textContent = '×';
  const viewer = document.createElement('div');
  viewer.className = 'certificate-dialog-viewer';
  const fullLink = document.createElement('a');
  fullLink.className = 'certificate-dialog-full';
  fullLink.target = '_blank';
  fullLink.rel = 'noopener noreferrer';
  fullLink.textContent = labels.full + ' ↗';
  modalHead.append(modalTitle, closeButton);
  modal.append(modalHead, viewer, fullLink);
  dialog.append(modal);
  document.body.append(dialog);
  let trigger = null;

  function closePreview() { dialog.close(); }
  closeButton.addEventListener('click', closePreview);
  dialog.addEventListener('click', event => { if (event.target === dialog) closePreview(); });
  dialog.addEventListener('close', () => {
    viewer.replaceChildren();
    if (trigger) trigger.focus();
  });

  function showPreview(url, kind, title, button) {
    if (typeof dialog.showModal !== 'function') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    trigger = button;
    modalTitle.textContent = title;
    fullLink.href = url;
    viewer.replaceChildren();
    if (kind === 'image') {
      const image = document.createElement('img');
      image.src = url;
      image.alt = title;
      viewer.append(image);
    } else {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.title = labels.image + ': ' + title;
      frame.loading = 'lazy';
      viewer.append(frame);
    }
    dialog.showModal();
  }

  records.slice(0, 10).forEach((record, index) => {
    if (!record || typeof record !== 'object') return;
    const title = localize(record.title);
    const issuer = String(record.issuer || '').trim();
    if (!title || !issuer) return;
    const previewUrl = safeUrl(record.preview);
    const kind = previewUrl ? previewKind(previewUrl) : '';
    const certificateUrl = safeUrl(record.url);

    const card = document.createElement('article');
    card.className = 'certificate-card';
    const header = document.createElement('div');
    header.className = 'certificate-card-top';
    const indexLabel = document.createElement('span');
    indexLabel.className = 'certificate-index';
    indexLabel.textContent = String(index + 1).padStart(2, '0') + ' / ' + labels.item;
    const mark = document.createElement('span');
    mark.className = 'certificate-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '↗';
    header.append(indexLabel, mark);
    const issuerLabel = document.createElement('p');
    issuerLabel.className = 'certificate-issuer';
    issuerLabel.textContent = issuer;
    const heading = document.createElement('h3');
    heading.textContent = title;
    card.append(header, issuerLabel, heading);
    if (record.date) {
      const issued = document.createElement('p');
      issued.className = 'certificate-issued';
      issued.textContent = labels.date + ' · ' + String(record.date);
      card.append(issued);
    }
    const actions = document.createElement('div');
    actions.className = 'certificate-actions';
    if (kind) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'certificate-action certificate-action-preview';
      button.textContent = labels.preview + ' ↗';
      button.addEventListener('click', () => showPreview(previewUrl, kind, title, button));
      actions.append(button);
    }
    if (certificateUrl) {
      const link = document.createElement('a');
      link.className = 'certificate-action certificate-action-link';
      link.href = certificateUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = labels.open + ' ↗';
      actions.append(link);
    }
    if (actions.childElementCount) card.append(actions);
    grid.append(card);
  });

  if (grid.childElementCount) {
    grid.hidden = false;
    upcoming.hidden = true;
    const cards = [...grid.children];
    const compact = window.matchMedia('(max-width: 700px)');
    const moreButton = document.createElement('button');
    moreButton.type = 'button';
    moreButton.className = 'certificate-more';
    moreButton.setAttribute('aria-controls', 'certificate-grid');
    grid.after(moreButton);
    let expanded = false;
    function updateVisible() {
      const initial = compact.matches ? 2 : 4;
      cards.forEach((card, index) => { card.hidden = !expanded && index >= initial; });
      moreButton.hidden = cards.length <= initial;
      moreButton.textContent = expanded ? labels.less : labels.more;
      moreButton.setAttribute('aria-label', expanded ? labels.less : labels.more + ' (' + (cards.length - initial) + ')');
      moreButton.setAttribute('aria-expanded', String(expanded));
    }
    moreButton.addEventListener('click', () => {
      expanded = !expanded;
      updateVisible();
    });
    if (compact.addEventListener) compact.addEventListener('change', updateVisible);
    updateVisible();
  }
})();
