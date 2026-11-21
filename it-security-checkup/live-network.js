/* Real local-device counters and browser-observed HTTP measurements. */
(() => {
  'use strict';
  const ui = window.NRSecurityUI;
  const $ = selector => document.querySelector(selector);
  const isHttp = /^https?:$/.test(location.protocol);
  const isLocal = isHttp && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const history = [], resources = [], seen = new Set(), controllers = new Set();
  let monitoring = true, apiBusy = false, probeBusy = false, snapshot = null, observer = null;
  let latency = null, lastResponse = null, errors = 0, requestCount = 0, totalBytes = 0, pendingBytes = 0;
  let minimumStartTime = 0, lastTick = performance.now(), lastNativeSample = null, source = 'browser';
  let interfacesSignature = '', disposed = false, generation = 0;
  const bytes = value => {
    if (!Number.isFinite(value)) return '—';
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
    return new Intl.NumberFormat(ui.language, { maximumFractionDigits: unit ? 1 : 0 }).format(value) + ' ' + units[unit];
  };
  const live = (name, value) => document.querySelectorAll(`[data-live="${name}"]`).forEach(element => { element.textContent = value; });
  const endpoint = (address, port) => address ? (address.includes(':') ? '[' + address + ']' : address) + ':' + port : '—';
  function addResource(record) {
    requestCount++;
    if (Number.isFinite(record.bytes)) { totalBytes += record.bytes; pendingBytes += record.bytes; }
    resources.unshift(record);
    resources.splice(60);
  }
  function observeEntries(entries) {
    if (!monitoring || document.hidden) return;
    for (const entry of entries) {
      if (entry.entryType !== 'resource' || entry.startTime < minimumStartTime) continue;
      const id = entry.name + ':' + entry.startTime;
      if (seen.has(id)) continue;
      seen.add(id);
      if (seen.size > 2000) { seen.clear(); minimumStartTime = performance.now(); }
      let url;
      try { url = new URL(entry.name); } catch { continue; }
      if (!/^https?:$/.test(url.protocol)) continue;
      const sameOrigin = url.origin === location.origin;
      const visible = entry.transferSize > 0 || (sameOrigin && entry.decodedBodySize > 0);
      addResource({ time: new Date(performance.timeOrigin + entry.startTime).toISOString(), name: (url.pathname.split('/').pop() || '/') + (sameOrigin ? '' : ' · ' + url.hostname), bytes: visible ? entry.transferSize : null, duration: Number.isFinite(entry.duration) ? entry.duration : null, cached: visible && entry.transferSize === 0 });
    }
  }
  if ('PerformanceObserver' in window) {
    try { observer = new PerformanceObserver(list => observeEntries(list.getEntries())); observer.observe({ type: 'resource', buffered: true }); } catch { observer = null; }
  }
  if (!observer) observeEntries(performance.getEntriesByType?.('resource') || []);

  async function pollNative() {
    if (!isLocal || !monitoring || document.hidden || apiBusy || disposed) return;
    apiBusy = true;
    const version = generation;
    const controller = new AbortController(); controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(new URL('api/network', location.href), { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (data.scope !== 'local-device' || data.localOnly !== true || !Array.isArray(data.interfaces) || !Array.isArray(data.connections)) throw new Error('Invalid snapshot');
      if (monitoring && version === generation) snapshot = data;
    } catch { if (version === generation && (!controller.signal.aborted || monitoring)) snapshot = null; }
    finally { clearTimeout(timeout); controllers.delete(controller); apiBusy = false; render(); }
  }
  async function probe() {
    if (!isHttp || !monitoring || document.hidden || probeBusy || disposed) return;
    probeBusy = true;
    const version = generation;
    const controller = new AbortController(); controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 6000);
    const started = performance.now();
    $('#probe-now').disabled = true;
    try {
      const response = await fetch(new URL('network-probe.json', location.href), { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      const payload = await response.arrayBuffer();
      if (!response.ok) throw new Error('HTTP response failed');
      if (monitoring && version === generation) {
        latency = performance.now() - started;
        lastResponse = new Date().toISOString();
        if (!observer && !performance.getEntriesByType) addResource({ time: lastResponse, name: 'network-probe.json', bytes: payload.byteLength, duration: latency, cached: false });
      }
    } catch {
      if (monitoring && !document.hidden && version === generation) { errors++; latency = null; }
    } finally {
      clearTimeout(timeout); controllers.delete(controller); probeBusy = false; $('#probe-now').disabled = !isHttp || !monitoring; render();
    }
  }
  function currentInterface() {
    const candidates = snapshot?.interfaces || [];
    const id = $('#network-interface').value;
    return candidates.find(item => item.id === id) || candidates.find(item => item.isDefault) || candidates[0] || null;
  }
  function hasDeviceData() {
    return snapshot?.status === 'ready' && snapshot.statsAvailable && Number.isFinite(Date.parse(snapshot.time)) && (!monitoring || Date.now() - Date.parse(snapshot.time) < 20000);
  }
  function tick() {
    if (!monitoring || document.hidden || disposed) return;
    if (!observer) observeEntries(performance.getEntriesByType?.('resource') || []);
    const now = performance.now(), elapsed = Math.max(.1, (now - lastTick) / 1000);
    const nextSource = hasDeviceData() ? 'device' : 'browser';
    if (nextSource !== source) { history.length = 0; source = nextSource; }
    if (source === 'device') {
      if (snapshot.time !== lastNativeSample) {
        const item = currentInterface();
        history.push({ time: snapshot.time, receive: item?.receiveRate ?? null, send: item?.sendRate ?? null, interface: item?.name || null, source });
        lastNativeSample = snapshot.time;
      }
    } else if (isHttp) history.push({ time: new Date().toISOString(), receive: pendingBytes / elapsed, send: null, source });
    history.splice(0, Math.max(0, history.length - 60));
    pendingBytes = 0; lastTick = now; render();
  }
  function renderChart() {
    const max = Math.max(1024, ...history.flatMap(item => [item.receive || 0, item.send || 0]));
    function draw(field) {
      let moving = true;
      return history.map((sample, index) => {
        if (!Number.isFinite(sample[field])) { moving = true; return ''; }
        const point = `${(index / Math.max(1, history.length - 1) * 760).toFixed(1)},${(180 - sample[field] / max * 155).toFixed(1)}`;
        const command = moving ? 'M' : 'L'; moving = false;
        return command + point;
      }).join(' ');
    }
    $('#receive-path').setAttribute('d', draw('receive'));
    $('#send-path').setAttribute('d', draw('send'));
    $('#chart-scale').textContent = bytes(max) + '/s';
    $('#chart-empty').hidden = history.some(item => Number.isFinite(item.receive));
    $('#chart-start').textContent = history.length ? ui.time(history[0].time) : '—';
    $('#chart-end').textContent = history.length ? ui.time(history.at(-1).time) : '—';
  }
  function render() {
    const native = hasDeviceData();
    const item = native ? currentInterface() : null;
    const latest = history.at(-1);
    live('scope', ui.t(native ? 'scopeDevice' : isHttp ? 'scopeBrowser' : 'scopeFile'));
    live('receive', native ? (Number.isFinite(item?.receiveRate) ? bytes(item.receiveRate) + '/s' : '—') : latest?.source === 'browser' ? bytes(latest.receive) + '/s' : '—');
    live('send', native && Number.isFinite(item?.sendRate) ? bytes(item.sendRate) + '/s' : '—');
    live('connections', native && snapshot.connectionsAvailable ? String(snapshot.connections.length) + (snapshot.connections.length === 150 ? '+' : '') : '—');
    live('latency', Number.isFinite(latency) ? Math.round(latency) + ' ms' : '—');
    live('requests', String(requestCount)); live('pageBytes', bytes(totalBytes)); live('errors', String(errors));
    const status = !monitoring ? 'monitorPaused' : document.hidden ? 'monitorHidden' : native ? 'monitorReady' : !isHttp ? 'monitorUnavailable' : 'monitorBrowser';
    live('status', ui.t(status));
    document.querySelectorAll('[data-live="status"]').forEach(element => element.classList.toggle('good', monitoring && isHttp));
    const updated = native ? snapshot.time : lastResponse;
    live('updated', updated ? ui.t('updatedAt') + ' ' + ui.time(updated) : ui.t('monitorWaiting'));
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    live('connection', ui.t(navigator.onLine ? 'browserOnline' : 'browserOffline') + (connection?.effectiveType ? ' · ' + ui.t('connectionEstimate') + ' ' + connection.effectiveType : ''));
    $('#agent-notice').hidden = native;
    $('#monitor-toggle').innerHTML = ui.icon(monitoring ? 'pause' : 'play') + `<span>${ui.esc(ui.t(monitoring ? 'pauseMonitoring' : 'resumeMonitoring'))}</span>`;
    $('#monitor-toggle').setAttribute('aria-pressed', String(!monitoring));
    $('#probe-now').disabled = !isHttp || !monitoring || probeBusy;
    const candidates = snapshot?.interfaces || [];
    const signature = JSON.stringify(candidates.map(entry => [entry.id, entry.name])) + ui.language;
    if (signature !== interfacesSignature) {
      const select = $('#network-interface'), previous = select.value;
      select.innerHTML = `<option value="auto">${ui.esc(ui.t('automatic'))}</option>` + candidates.map(entry => `<option value="${ui.esc(entry.id)}">${ui.esc(entry.name)}</option>`).join('');
      if (candidates.some(entry => entry.id === previous)) select.value = previous;
      interfacesSignature = signature;
    }
    $('#network-interface').disabled = !native;
    const state = $('#connection-state').value;
    const entries = native && snapshot.connectionsAvailable ? snapshot.connections.filter(entry => state === 'all' || entry.state === state) : [];
    const emptyConnections = native ? (snapshot.connectionsAvailable ? 'noResults' : 'connectionsUnavailable') : 'waitingConnections';
    $('#connections-body').innerHTML = entries.map(entry => `<tr><td class="mono">${ui.esc(endpoint(entry.localAddress, entry.localPort))}</td><td class="mono">${ui.esc(endpoint(entry.remoteAddress, entry.remotePort))}</td><td>${ui.esc(entry.state)}</td></tr>`).join('') || `<tr><td colspan="3" class="empty-state">${ui.esc(ui.t(emptyConnections))}</td></tr>`;
    $('#resources-body').innerHTML = resources.slice(0, 12).map(entry => `<tr><td class="mono">${ui.esc(ui.time(entry.time))}</td><td>${ui.esc(entry.name)}</td><td>${Number.isFinite(entry.duration) ? Math.round(entry.duration) + ' ms' : '—'}</td><td>${entry.cached ? ui.esc(ui.t('cached')) : bytes(entry.bytes)}</td></tr>`).join('') || `<tr><td colspan="4" class="empty-state">${ui.esc(ui.t('monitorWaiting'))}</td></tr>`;
    renderChart();
  }
  $('#monitor-toggle').addEventListener('click', () => {
    generation++;
    monitoring = !monitoring;
    if (!monitoring) controllers.forEach(controller => controller.abort());
    else { minimumStartTime = performance.now(); lastTick = performance.now(); pendingBytes = 0; void pollNative(); void probe(); }
    render();
  });
  $('#probe-now').addEventListener('click', probe);
  $('#network-interface').addEventListener('change', () => { history.length = 0; lastNativeSample = null; tick(); });
  $('#connection-state').addEventListener('change', render);
  $('#network-export').addEventListener('click', () => ui.download('security-network-measurements.json', JSON.stringify({ exportedAt: new Date().toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, scope: source === 'device' ? 'Local Windows device counters' : 'Browser page HTTP responses', samples: history, resources, deviceSnapshot: hasDeviceData() ? snapshot : null }, null, 2)));
  window.addEventListener('nr-workspace-render', render);
  window.addEventListener('online', () => { void probe(); void pollNative(); render(); });
  window.addEventListener('offline', () => { latency = null; render(); });
  document.addEventListener('visibilitychange', () => {
    generation++;
    if (document.hidden) controllers.forEach(controller => controller.abort());
    else { minimumStartTime = performance.now(); lastTick = performance.now(); pendingBytes = 0; if (monitoring) { void pollNative(); void probe(); } }
    render();
  });
  const timers = [setInterval(tick, 1000), setInterval(pollNative, 3000), setInterval(probe, 7000)];
  window.addEventListener('pagehide', event => { if (!event.persisted) { disposed = true; timers.forEach(clearInterval); observer?.disconnect(); controllers.forEach(controller => controller.abort()); } });
  render(); void pollNative(); void probe();
})();
