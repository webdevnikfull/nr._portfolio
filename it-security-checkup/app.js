(() => {
  'use strict';
  const domain = window.NRSecurityDomain;
  const dictionary = window.NRSecurityLanguages;
  const key = 'nr-security-workspace-v2';
  const $ = selector => document.querySelector(selector);
  const storage = {
    get(name) { try { return localStorage.getItem(name); } catch { return null; } },
    set(name, value) { try { localStorage.setItem(name, value); return true; } catch { return false; } },
  };
  const read = name => { try { return JSON.parse(storage.get(name)); } catch { return null; } };
  const legacy = read('nr-security-checkup-v1');
  let state = domain.restore(read(key), legacy);
  let language = storage.get('nr-studio-language') || legacy?.lang || 'en';
  if (!['en','pl','de','uk'].includes(language)) language = 'en';
  let view = ['overview', 'network', 'devices', 'identity', 'checklist', 'activity'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
  let filter = 'all';
  let selected = new Set();
  let dialogTarget = null;
  let toastTimer;
  let hour12 = storage.get('nr-security-hour12') === 'true';
  let result = null;

  const paths = {
    grid: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
    shield: 'M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7Z',
    'shield-check': 'M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7Zm-5 9 3 3 6-7',
    network: 'M9 3h6v6H9zM3 16h6v6H3zm12 0h6v6h-6zM12 9v4H6v3m6-3h6v3',
    laptop: 'M4 4h16v12H4zM2 20h20l-2-4H4Z',
    phone: 'M7 2h10v20H7zM10 5h4m-3 14h2',
    identity: 'M9 6a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM4 21v-3a8 8 0 0 1 16 0v3M3 4H1v16h2m18-16h2v16h-2',
    key: 'M14 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM9 13l-7 7v2h3l2-2v-2h2l2-2m4-8h.01',
    lock: 'M5 10h14v12H5zM8 10V6a4 4 0 0 1 8 0v4m-4 5v3',
    fingerprint: 'M5 16V9a7 7 0 0 1 14 0v6M8 18V9a4 4 0 0 1 8 0v8m-5 4V10a1 1 0 0 1 2 0v8m-9 3 1-2m14 2v-3',
    clipboard: 'M8 4H4v18h16V4h-4M8 2h8v5H8zm0 10h8m-8 5h6',
    history: 'M3 12a9 9 0 1 0 3-7L3 8m0-5v5h5m4-1v5l3 2',
    alert: 'm12 3 10 18H2ZM12 9v5m0 3h.01',
    activity: 'M2 12h5l3-8 4 16 3-8h5',
    download: 'M12 3v12m-5-5 5 5 5-5M4 17v5h16v-5',
    upload: 'M12 16V4m-5 5 5-5 5 5M4 17v5h16v-5',
    connection: 'M3 7h6v10H3zm12 0h6v10h-6zM9 12h6M5 3v4m14-4v4M5 17v4m14-4v4',
    clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v6l4 2',
    globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
    info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10h.01',
    external: 'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
    menu: 'M3 6h18M3 12h18M3 18h18',
    close: 'm6 6 12 12M6 18 18 6',
    play: 'm8 4 12 8-12 8Z',
    pause: 'M7 4h3v16H7zm7 0h3v16h-3z',
    reset: 'M3 11a9 9 0 1 1 3 8M3 4v7h7',
    check: 'm4 12 5 5L20 6',
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name] || paths.shield}"/></svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const t = name => dictionary[language]?.[name] || dictionary.en[name] || name;
  const time = (value = new Date(), date = false) => new Intl.DateTimeFormat(language, { ...(date ? { month: 'short', day: 'numeric' } : {}), hour: '2-digit', minute: '2-digit', second: '2-digit', hour12 }).format(new Date(value));
  const badge = (name, label = name) => `<span class="status ${esc(name)}">${esc(t(label))}</span>`;
  const save = () => { if (!storage.set(key, JSON.stringify(state))) notify('storageUnavailable'); };
  function notify(name) {
    clearTimeout(toastTimer);
    $('#toast').textContent = t(name);
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
  }
  function audit(action, target, outcome = 'recorded') {
    state.audit.unshift({ time: new Date().toISOString(), action, target, outcome });
    state.audit = state.audit.slice(0, 100);
    save();
  }
  function download(filename, data, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.NRSecurityUI = { t, icon, esc, time, download, get language() { return language; } };

  function clock() {
    $('#local-time').textContent = time();
    $('#local-time').dateTime = new Date().toISOString();
    $('#local-zone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
    $('#clock-format').textContent = hour12 ? '12h' : '24h';
    $('#clock-format').setAttribute('aria-pressed', String(hour12));
  }
  function showView(name, updateHash = true) {
    view = name;
    document.querySelectorAll('.view').forEach(section => { section.hidden = section.id !== name; });
    document.querySelectorAll('.nav-item').forEach(link => {
      link.classList.toggle('active', link.dataset.view === name);
      if (link.dataset.view === name) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    const labels = { overview: 'navOverview', network: 'navNetwork', devices: 'navDevices', identity: 'navIdentity', checklist: 'navChecklist', activity: 'navActivity' };
    $('#crumb').textContent = t(labels[name]);
    if (updateHash) history.replaceState(null, '', '#' + name);
    document.body.classList.remove('nav-open');
    $('#nav-toggle').setAttribute('aria-expanded', 'false');
    window.dispatchEvent(new Event('nr-view-change'));
  }
  function visibleDevices() {
    const query = $('#device-search').value.toLocaleLowerCase(language).trim();
    const status = $('#device-filter').value;
    return state.devices.filter(device => {
      const owner = state.users.find(user => user.id === device.owner)?.name || '';
      const compliant = domain.assessDevice(device, state.policy).compliant;
      return `${device.name} ${device.id} ${device.platform} ${owner}`.toLocaleLowerCase(language).includes(query) && (status === 'all' || compliant === (status === 'compliant'));
    });
  }
  function renderDevices() {
    const devices = visibleDevices();
    $('#devices-body').innerHTML = devices.map(device => {
      const report = domain.assessDevice(device, state.policy);
      const owner = state.users.find(user => user.id === device.owner)?.name;
      return `<tr><td><input type="checkbox" data-select-device="${device.id}" ${selected.has(device.id) ? 'checked' : ''} aria-label="${esc(t('selectDevice') + ' ' + device.name)}"></td><td><div class="device-name"><span data-icon="${device.platform === 'iOS' || device.platform === 'Android' ? 'phone' : 'laptop'}">${icon(device.platform === 'iOS' || device.platform === 'Android' ? 'phone' : 'laptop')}</span><div><strong>${device.name}</strong><small>${device.id} · ${device.platform}</small></div></div></td><td>${esc(owner)}</td><td>${badge(report.compliant ? 'compliant' : 'attention')}</td><td>${report.passed} / ${report.total}</td><td><button class="button secondary" data-device="${device.id}" type="button">${icon('shield')}${esc(t('details'))}</button></td></tr>`;
    }).join('') || `<tr><td colspan="6" class="empty-state">${esc(t('noResults'))}</td></tr>`;
    $('#devices-result').textContent = `${devices.length} / ${state.devices.length} · ${selected.size} ${t('selected')}`;
    $('#bulk-baseline').disabled = selected.size === 0;
    $('#select-all-devices').checked = devices.length > 0 && devices.every(device => selected.has(device.id));
    $('#select-all-devices').indeterminate = devices.some(device => selected.has(device.id)) && !$('#select-all-devices').checked;
  }
  function renderUsers() {
    $('#users-body').innerHTML = state.users.map(user => `<tr><td><div class="user-name"><span>${icon('identity')}</span><div><strong>${user.name}</strong><small>${t(user.enabled ? 'enabled' : 'disabled')}</small></div></div></td><td>${esc(t(user.role))}</td><td>${badge(user.mfa ? 'good' : 'attention', user.mfa ? 'enabled' : 'disabled')}</td><td>${badge(user.risk)}</td><td><button class="button secondary" data-user="${user.id}" type="button">${icon('key')}${esc(t('details'))}</button></td></tr>`).join('');
    $('#policy-controls').innerHTML = ['requireMfa', 'requireCompliant', 'blockHighRisk'].map(name => `<label class="policy-row"><span>${esc(t(name))}</span><input type="checkbox" data-policy="${name}" ${state.policy[name] ? 'checked' : ''}></label>`).join('');
    $('#patch-limit').value = state.policy.maxPatchDays;
    for (const [selector, items] of [['#access-user', state.users], ['#access-device', state.devices]]) {
      const element = $(selector), previous = element.value;
      element.innerHTML = items.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('');
      if (items.some(item => item.id === previous)) element.value = previous;
    }
  }
  function renderOverview() {
    const compliant = state.devices.filter(device => domain.assessDevice(device, state.policy).compliant).length;
    const mfa = state.users.filter(user => user.enabled && user.mfa).length;
    $('#compliant-count').textContent = compliant + ' / ' + state.devices.length;
    $('#compliant-copy').textContent = t('scenarioBaseline');
    $('#mfa-count').textContent = mfa + ' / ' + state.users.filter(user => user.enabled).length;
    $('#attention-count').textContent = state.devices.length - compliant + state.users.filter(user => user.enabled && (!user.mfa || user.risk === 'high')).length;
    $('#review-score').textContent = Math.round(state.done.length / 6 * 100) + '%';
    const suggestions = [];
    for (const device of state.devices.filter(item => !domain.assessDevice(item, state.policy).compliant).slice(0, 2)) {
      suggestions.push(`<div class="action-row"><span>${icon('laptop')}</span><div><strong>${device.name}</strong><p>${domain.assessDevice(device, state.policy).reasons.map(name => esc(t(name))).join(' · ')}</p><button class="text-button" data-device="${device.id}" type="button">${esc(t('reviewDevice'))}</button></div></div>`);
    }
    const user = state.users.find(item => item.enabled && (!item.mfa || item.risk === 'high'));
    if (user) suggestions.push(`<div class="action-row"><span>${icon('key')}</span><div><strong>${user.name}</strong><p>${esc(t(user.mfa ? 'reasonRisk' : 'reasonMfa'))}</p><button class="text-button" data-user="${user.id}" type="button">${esc(t('reviewAccess'))}</button></div></div>`);
    $('#next-actions').innerHTML = suggestions.join('') || `<p class="empty-state">${esc(t('allGood'))}</p>`;
    $('#recent-activity').innerHTML = state.audit.slice(0, 4).map(event => `<div class="activity-item"><span>${icon('history')}</span><div><strong>${esc(t(event.action))}</strong><small>${esc(event.target)} · ${esc(time(event.time))}</small></div></div>`).join('') || `<p class="empty-state">${esc(t('noActivity'))}</p>`;
  }
  const checks = [['mfa', 'access', 'key'], ['updates', 'categoryDevices', 'reset'], ['privilege', 'access', 'lock'], ['backup', 'recovery', 'shield'], ['phishing', 'awareness', 'alert'], ['protection', 'categoryDevices', 'shield-check']];
  function renderChecks() {
    $('#checks').innerHTML = checks.map(([name, category, symbol], index) => {
      const done = state.done.includes(index);
      if (filter !== 'all' && done !== (filter === 'done')) return '';
      return `<article class="check ${done ? 'done' : ''}"><span>${icon(done ? 'check' : symbol)}</span><div><h3>${esc(t(name))}</h3><p>${esc(t(name + 'Desc'))}</p><span class="source-label">${esc(t(category))}</span></div><button class="button secondary" data-check="${index}" aria-pressed="${done}" type="button">${esc(t(done ? 'undo' : 'markDone'))}</button></article>`;
    }).join('') || `<p class="empty-state">${esc(t('noResults'))}</p>`;
    document.querySelectorAll('[data-filter]').forEach(button => { button.classList.toggle('active', button.dataset.filter === filter); button.setAttribute('aria-pressed', String(button.dataset.filter === filter)); });
    $('#review-notes').value = state.notes;
  }
  function renderAudit() {
    $('#audit-body').innerHTML = state.audit.map(event => `<tr><td class="mono">${esc(time(event.time, true))}</td><td>${esc(t(event.action))}</td><td>${esc(event.target)}</td><td>${badge(event.outcome)}</td></tr>`).join('') || `<tr><td colspan="4" class="empty-state">${esc(t('noActivity'))}</td></tr>`;
  }
  function renderResult() {
    $('#access-result').innerHTML = result ? `<div class="access-result-inner">${badge(result.decision)}<ul>${result.reasons.map(reason => `<li>${esc(t(reason))}</li>`).join('')}</ul></div>` : '';
  }
  function render() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i]').forEach(element => { element.textContent = t(element.dataset.i); });
    document.querySelectorAll('[data-label]').forEach(element => element.setAttribute('aria-label', t(element.dataset.label)));
    document.querySelectorAll('[data-placeholder]').forEach(element => { element.placeholder = t(element.dataset.placeholder); });
    document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
    renderDevices(); renderUsers(); renderOverview(); renderChecks(); renderAudit(); renderResult(); clock(); showView(view, false);
    if (dialogTarget) renderDetail();
    window.dispatchEvent(new Event('nr-workspace-render'));
  }
  function renderDetail() {
    const { type, id } = dialogTarget;
    const item = (type === 'device' ? state.devices : state.users).find(entry => entry.id === id);
    $('#detail-title').textContent = item.name;
    if (type === 'device') {
      const report = domain.assessDevice(item, state.policy);
      $('#detail-content').innerHTML = `<form id="device-form"><div class="dialog-summary">${badge(report.compliant ? 'compliant' : 'attention')}<p>${item.id} · ${item.platform}</p>${report.reasons.length ? `<ul>${report.reasons.map(name => `<li>${esc(t(name))}</li>`).join('')}</ul>` : ''}</div>${[['managed', 'enrolled'], ['encrypted', 'encrypted'], ['protected', 'protectionActive']].map(([name, label]) => `<label class="setting-row"><span>${esc(t(label))}</span><input name="${name}" type="checkbox" ${item[name] ? 'checked' : ''}></label>`).join('')}<label class="setting-row"><span>${esc(t('patchAge'))}</span><input name="patchDays" type="number" min="0" max="3650" required value="${item.patchDays}"></label><div class="dialog-actions"><button class="button primary" type="submit">${icon('check')}${esc(t('saveChanges'))}</button><button class="button secondary" data-baseline="${item.id}" type="button">${icon('shield-check')}${esc(t('applyBaseline'))}</button></div></form>`;
    } else {
      $('#detail-content').innerHTML = `<div class="dialog-summary">${badge(item.risk)}<p>${esc(t(item.role))} · MFA ${esc(t(item.mfa ? 'enabled' : 'disabled'))} · ${esc(t(item.enabled ? 'enabled' : 'disabled'))}</p></div><div class="dialog-actions"><button class="button secondary" data-user-action="mfa" type="button">${icon('key')}${esc(t(item.mfa ? 'disableMfa' : 'enableMfa'))}</button><button class="button secondary" data-user-action="risk" ${item.risk === 'low' ? 'disabled' : ''} type="button">${icon('shield-check')}${esc(t('resolveRisk'))}</button><button class="button ${item.enabled ? 'danger' : 'secondary'}" data-user-action="enabled" type="button">${icon('lock')}${esc(t(item.enabled ? 'disableAccount' : 'enableAccount'))}</button></div>`;
    }
  }
  function openDetail(type, id) {
    dialogTarget = { type, id };
    renderDetail();
    const dialog = $('#detail-dialog');
    if (!dialog.open) dialog.showModal();
  }
  function applyBaseline(ids) {
    for (const device of state.devices.filter(item => ids.includes(item.id))) {
      Object.assign(device, { managed: true, encrypted: true, protected: true, patchDays: 0 });
      audit('actionBaseline', device.id, 'compliant');
    }
    selected.clear(); result = null; render(); notify('saved');
  }

  document.addEventListener('click', event => {
    const navigation = event.target.closest('[data-view]');
    if (navigation) { event.preventDefault(); showView(navigation.dataset.view); $('#main').focus({ preventScroll: true }); return; }
    const device = event.target.closest('[data-device]');
    if (device) { openDetail('device', device.dataset.device); return; }
    const user = event.target.closest('[data-user]');
    if (user) { openDetail('user', user.dataset.user); return; }
    const baseline = event.target.closest('[data-baseline]');
    if (baseline) { applyBaseline([baseline.dataset.baseline]); return; }
    const userAction = event.target.closest('[data-user-action]');
    if (userAction) {
      const item = state.users.find(entry => entry.id === dialogTarget.id);
      const action = userAction.dataset.userAction;
      if (action === 'risk') item.risk = 'low'; else item[action] = !item[action];
      audit('actionUserUpdated', item.name); result = null; render(); notify('saved'); return;
    }
    const check = event.target.closest('[data-check]');
    if (check) {
      const index = Number(check.dataset.check);
      state.done = state.done.includes(index) ? state.done.filter(value => value !== index) : [...state.done, index];
      audit('actionChecklist', t(checks[index][0])); render(); return;
    }
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) { filter = filterButton.dataset.filter; renderChecks(); return; }
    if (event.target.closest('[data-action="export-report"]')) download('it-security-review.json', JSON.stringify({ generatedAt: new Date().toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, scope: 'Local training scenario', ...state }, null, 2));
  });
  document.addEventListener('change', event => {
    const element = event.target;
    if (element.matches('[data-select-device]')) {
      if (element.checked) selected.add(element.dataset.selectDevice); else selected.delete(element.dataset.selectDevice);
      renderDevices();
    }
    if (element.id === 'select-all-devices') { for (const device of visibleDevices()) { if (element.checked) selected.add(device.id); else selected.delete(device.id); } renderDevices(); }
    if (element.dataset.policy) { state.policy[element.dataset.policy] = element.checked; audit('actionPolicyUpdated', t(element.dataset.policy)); result = null; render(); }
    if (element.id === 'device-filter') renderDevices();
    if (element.id === 'patch-limit') {
      if (!element.validity.valid) { element.reportValidity(); return; }
      state.policy.maxPatchDays = Number(element.value); audit('actionPolicyUpdated', t('patchLimit')); result = null; render();
    }
    if (element.closest('#access-form')) { result = null; renderResult(); }
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'device-form') {
      event.preventDefault();
      const form = event.target, item = state.devices.find(device => device.id === dialogTarget.id);
      if (!form.reportValidity()) return;
      for (const name of ['managed', 'encrypted', 'protected']) item[name] = form.elements[name].checked;
      item.patchDays = Number(form.elements.patchDays.value);
      audit('actionDeviceSaved', item.id, domain.assessDevice(item, state.policy).compliant ? 'compliant' : 'attention');
      result = null; render(); notify('saved');
    }
    if (event.target.id === 'access-form') {
      event.preventDefault();
      const user = state.users.find(item => item.id === $('#access-user').value);
      const device = state.devices.find(item => item.id === $('#access-device').value);
      result = domain.evaluateAccess(user, device, state.policy, $('#access-network').value);
      audit('actionEvaluated', user.name + ' · ' + device.id, result.decision);
      renderResult(); renderAudit(); renderOverview();
    }
  });
  $('#device-search').addEventListener('input', renderDevices);
  $('#bulk-baseline').addEventListener('click', () => applyBaseline([...selected]));
  $('#review-notes').addEventListener('input', event => { state.notes = event.target.value.slice(0, 2000); save(); });
  $('#close-detail').addEventListener('click', () => $('#detail-dialog').close());
  $('#detail-dialog').addEventListener('close', () => { dialogTarget = null; });
  $('#nav-toggle').addEventListener('click', () => { const open = document.body.classList.toggle('nav-open'); $('#nav-toggle').setAttribute('aria-expanded', String(open)); });
  $('#clock-format').addEventListener('click', () => { hour12 = !hour12; storage.set('nr-security-hour12', String(hour12)); clock(); renderAudit(); window.dispatchEvent(new Event('nr-workspace-render')); });
  $('#reset').addEventListener('click', () => {
    if (!window.confirm(t('confirmReset'))) return;
    state = domain.seed(); selected.clear(); result = null;
    audit('actionReset', 'Security workspace'); render();
  });
  window.addEventListener('nr-language-select', event => {
    if (!dictionary[event.detail]) return;
    language = event.detail; storage.set('nr-studio-language', language); render();
  });
  window.addEventListener('nr-theme-toggle', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    storage.set('nr-security-theme', theme); storage.set('qa-portfolio-theme', theme);
  });
  window.addEventListener('hashchange', () => { const next = location.hash.slice(1); if (document.getElementById(next)?.classList.contains('view')) showView(next, false); });
  const clockTimer = setInterval(clock, 1000);
  window.addEventListener('pagehide', event => { if (!event.persisted) { clearInterval(clockTimer); clearTimeout(toastTimer); } });
  render();
})();
