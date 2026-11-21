(() => {
  const panel = document.querySelector('.practice-panel');
  if (!panel) return;
  const root = document.documentElement;
  const copy = ["CompTIA CySA+ · Cert Prep", "Traffic review|Przegląd ruchu|Netzverkehr prüfen|Перевірка трафіку", "Identify the data source in the network view.|Sprawdź źródło danych w widoku sieci.|Datenquelle in der Netzwerkansicht bestimmen.|Визнач джерело даних у поданні мережі.", "Compare two samples and record the change.|Porównaj dwie próbki i zapisz zmianę.|Zwei Messwerte vergleichen und die Änderung festhalten.|Порівняй два виміри й запиши зміну."];
  const languages = ['en','pl','de','uk'];
  const words = [
    ['Local time','Session timer','Start','Pause','Reset','Theme'],
    ['Czas lokalny','Stoper sesji','Start','Pauza','Wyzeruj','Motyw'],
    ['Ortszeit','Sitzungsdauer','Start','Pause','Zurücksetzen','Design'],
    ['Місцевий час','Таймер сеансу','Пуск','Пауза','Скинути','Тема']
  ];
  const find = selector => panel.querySelector(selector);
  const toggle = find('.timer-toggle'), reset = find('.timer-reset');
  let started = null, elapsed = 0, format, langIndex;
  function paint() {
    const ms = elapsed + (started === null ? 0 : performance.now() - started);
    const seconds = Math.floor(ms / 1000);
    find('.elapsed').textContent = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2,'0')).join(':');
    const clock = find('time');
    if (clock) clock.textContent = format.format(new Date());
    toggle.textContent = words[langIndex][started === null ? 2 : 3];
    reset.disabled = elapsed === 0 && started === null;
    find('.completion').textContent = panel.querySelectorAll('input:checked').length + ' / 2';
  }
  function translate() {
    langIndex = Math.max(0,languages.indexOf(root.lang));
    format = new Intl.DateTimeFormat(languages[langIndex], {timeStyle:'medium'});
    panel.querySelectorAll('[data-case]').forEach(el => el.textContent = copy[Number(el.dataset.case)].split('|')[langIndex]);
    panel.querySelectorAll('[data-word]').forEach(el => el.textContent = words[langIndex][Number(el.dataset.word)]);
    paint();
  }
  toggle.onclick = () => {
    if (started === null) started = performance.now();
    else { elapsed += performance.now() - started; started = null; }
    paint();
  };
  reset.onclick = () => { started = null; elapsed = 0; paint(); };
  panel.addEventListener('change',paint);
  const theme = document.querySelector('.practice-theme');
  if (theme) {
    try { root.dataset.theme = localStorage.getItem(location.pathname + ':theme') === 'light' ? 'light' : 'dark'; } catch {}
    function themeLabel() {
      theme.textContent = root.dataset.theme === 'dark' ? '☀' : '☾';
      theme.setAttribute('aria-label', words[langIndex][5]);
      theme.setAttribute('aria-pressed',String(root.dataset.theme === 'dark'));
    }
    theme.onclick = () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(location.pathname + ':theme',root.dataset.theme); } catch {}
      themeLabel();
    };
    translate(); themeLabel();
    new MutationObserver(themeLabel).observe(root,{attributes:true,attributeFilter:['lang']});
  }
  new MutationObserver(translate).observe(root,{attributes:true,attributeFilter:['lang']});
  translate();
  setInterval(() => { if (!document.hidden) paint(); }, 500);
})();