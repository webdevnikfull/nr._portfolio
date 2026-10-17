/* A local, plain-text summary editor and ordinary clipboard protection. */
(() => {
  'use strict';
  const fields = 'input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]';
  function editingField(event) {
    return event.target?.closest?.(fields) || document.activeElement?.closest?.(fields);
  }
  for (const type of ['copy', 'cut']) {
    document.addEventListener(type, event => {
      if (!editingField(event)) event.preventDefault();
    });
  }

  const description = document.querySelector('.hero-description');
  if (!description) return;
  const lang = document.documentElement.lang;
  const translations = {
    pl: { edit: 'Edytuj opis', save: 'Zapisz', cancel: 'Anuluj', field: 'Krótki opis mojego doświadczenia', hint: 'Zmiany zapisują się tylko w tej przeglądarce.', saved: 'Opis zapisany w tej przeglądarce.', session: 'Opis zmieniony na czas tej sesji.', empty: 'Wpisz opis przed zapisaniem.' },
    en: { edit: 'Edit summary', save: 'Save', cancel: 'Cancel', field: 'Brief summary of my experience', hint: 'Changes are saved only in this browser.', saved: 'Summary saved in this browser.', session: 'Summary changed for this session.', empty: 'Enter a summary before saving.' },
    de: { edit: 'Kurzprofil bearbeiten', save: 'Speichern', cancel: 'Abbrechen', field: 'Kurze Beschreibung meiner Erfahrung', hint: 'Änderungen werden nur in diesem Browser gespeichert.', saved: 'Kurzprofil in diesem Browser gespeichert.', session: 'Kurzprofil für diese Sitzung geändert.', empty: 'Vor dem Speichern eine Beschreibung eingeben.' },
    uk: { edit: 'Редагувати опис', save: 'Зберегти', cancel: 'Скасувати', field: 'Короткий опис мого досвіду', hint: 'Зміни зберігаються лише в цьому браузері.', saved: 'Опис збережено в цьому браузері.', session: 'Опис змінено на час цього сеансу.', empty: 'Введіть опис перед збереженням.' }
  };
  const t = translations[lang] || translations.pl;
  const key = 'nr-portfolio:hero-summary:' + (lang || 'pl');
  try {
    const saved = window.localStorage.getItem(key);
    if (saved?.trim()) description.textContent = saved;
  } catch { /* Editing still works when local storage is unavailable. */ }

  const editor = document.createElement('div');
  editor.className = 'summary-editor';
  editor.hidden = true;
  const input = document.createElement('textarea');
  input.id = 'hero-summary-input';
  input.rows = 4;
  input.spellcheck = true;
  input.setAttribute('aria-label', t.field);
  input.setAttribute('aria-describedby', 'hero-summary-status');
  editor.append(input);

  const tools = document.createElement('div');
  tools.className = 'summary-tools';
  function button(text, className) {
    const control = document.createElement('button');
    control.type = 'button';
    control.className = className;
    control.textContent = text;
    tools.append(control);
    return control;
  }
  const edit = button(t.edit, 'summary-edit');
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg viewBox="0 0 20 20"><path d="m13 3 4 4M3 17l4-1 10-10a2 2 0 0 0-4-4L3 12z"/></svg>';
  edit.prepend(icon);
  edit.setAttribute('aria-controls', input.id);
  edit.setAttribute('aria-expanded', 'false');
  const save = button(t.save, 'summary-save');
  const cancel = button(t.cancel, 'summary-cancel');
  save.hidden = cancel.hidden = true;
  const status = document.createElement('span');
  status.className = 'summary-status';
  status.id = 'hero-summary-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  tools.append(status);
  description.after(editor, tools);
  let isEditing = false;

  function close(message = '') {
    isEditing = false;
    description.hidden = false;
    editor.hidden = true;
    save.hidden = cancel.hidden = true;
    edit.hidden = false;
    edit.setAttribute('aria-expanded', 'false');
    status.textContent = message;
    edit.focus();
  }
  function saveSummary() {
    const value = input.value.replace(/\s+/gu, ' ').trim();
    if (!value) {
      status.textContent = t.empty;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    description.textContent = value;
    let message = t.saved;
    try { window.localStorage.setItem(key, value); }
    catch { message = t.session; }
    close(message);
  }
  edit.addEventListener('click', () => {
    isEditing = true;
    input.value = description.textContent.replace(/\s+/gu, ' ').trim();
    input.removeAttribute('aria-invalid');
    description.hidden = true;
    editor.hidden = false;
    save.hidden = cancel.hidden = false;
    edit.hidden = true;
    edit.setAttribute('aria-expanded', 'true');
    status.textContent = t.hint;
    input.focus();
  });
  save.addEventListener('click', saveSummary);
  cancel.addEventListener('click', () => close());
  input.addEventListener('keydown', event => {
    if (!isEditing) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); saveSummary(); }
  });
})();
