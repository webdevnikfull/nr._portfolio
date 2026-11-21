/* Brand marks identify named products; topic icons describe the remaining attributes. */
(() => {
  'use strict';
  const selector = '.tags > span, .tags > button, .experience-tags > span, .experience-tags > button, .certificate-course-skills > span';
  const brands = [
    [/\bintune\b/i, 'intune'], [/\bentra\b/i, 'entra'], [/copilot/i, 'copilot'],
    [/microsoft\s*365|office(?:\s*365)?/i, 'office'], [/\bwindows\b/i, 'windows'],
    [/\bandroid\b/i, 'android'], [/\bios\b/i, 'ios'], [/\bjira\b/i, 'jira'],
  ];
  const shapes = {
    clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v6l4 2',
    search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6M7 10h6m-3-3v6',
    directory: 'M9 2h6v6H9zM2 16h6v6H2zm14 0h6v6h-6zM12 8v4H5v4m7-4h7v4',
    headset: 'M4 13V10a8 8 0 0 1 16 0v3M2 11h4v7H2zm16 0h4v7h-4zM20 18a3 3 0 0 1-3 3h-4',
    monitor: 'M3 3h18v14H3zM8 21h8m-4-4v4',
    chip: 'M5 5h14v14H5zm4 4h6v6H9zM8 1v4m8-4v4M8 19v4m8-4v4M1 8h4m-4 8h4m14-8h4m-4 8h4',
    document: 'M5 2h9l5 5v15H5zm9 0v6h5M8 12h8m-8 4h8',
    escalation: 'M12 21V3m-6 6 6-6 6 6M4 16v5h16v-5',
    cart: 'M2 3h3l3 12h11l3-9H6m3 15h.01m9 0h.01',
    car: 'm5 4-3 9v6h3v-3h14v3h3v-6l-3-9Zm-3 9h20M6 12h.01M18 12h.01',
    wrench: 'M14 4a6 6 0 0 0-7 8l-5 5a3 3 0 0 0 4 4l5-5a6 6 0 0 0 8-7l-4 4-4-4Z',
    shield: 'M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7Zm-4 9 3 3 5-6',
    cloud: 'M6 18a5 5 0 0 1 0-10 7 7 0 0 1 13-1 5 5 0 0 1-1 11Z',
    code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
    tag: 'M2 3h9l11 11-8 8L2 10Zm5 4h.01',
    brain: 'M12 4a4 4 0 0 0-7 2 4 4 0 0 0-2 7 4 4 0 0 0 3 6 4 4 0 0 0 6 2Zm0 0a4 4 0 0 1 7 2 4 4 0 0 1 2 7 4 4 0 0 1-3 6 4 4 0 0 1-6 2ZM8 8v4l-3 2m11-6v4l3 2',
    lock: 'M5 10h14v12H5zM8 10V6a4 4 0 0 1 8 0v4m-4 5v3',
    pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    briefcase: 'M3 7h18v14H3zM8 7V3h8v4M3 12h18m-9 0v3',
    alert: 'm12 2 11 20H1ZM12 8v6m0 3h.01',
  };
  const topics = [
    [/\bMFA\b|access control|kontrola dostępu|zugriffskontrolle|контроль доступу/i, 'lock'],
    [/patch.management|aktualizacj|оновлення/i, 'wrench'],
    [/backup|kopie zapasowe|резервне копіювання/i, 'cloud'],
    [/artificial|intelligen|\bAI\b|sztuczn|інтелект|интеллект/i, 'brain'],
    [/incident|incydent|інцидент|инцидент/i, 'alert'],
    [/remote\s+access|zdaln|fernzugriff|віддален|удалён/i, 'lock'],
    [/onsite|on-site|na miejscu|vor ort/i, 'pin'],
    [/career|karier|beruf|кар’єр|карьер/i, 'briefcase'],
    [/security|vulnerab|bezpie|sicher|podatno|безпек|безопас/i, 'shield'],
    [/\bSLA\b|agreement|umow|vereinbarung/i, 'clock'],
    [/\bRCA\b|diagnos|diagno|діагност|диагност/i, 'search'],
    [/directory|LAN|WLAN|network|sieci|netz|мереж|сеть/i, 'directory'],
    [/support|wspar|obsług|підтрим|поддерж|benutzer/i, 'headset'],
    [/workstation|stacj|arbeitsplatz|станці|станци/i, 'monitor'],
    [/hardware|sprzęt|обладнання|оборудован/i, 'chip'],
    [/document|dokument|документ/i, 'document'],
    [/escal|eskal|ескал|эскал/i, 'escalation'],
    [/commerce|handel|торгів|торгов/i, 'cart'],
    [/licen[cs]e|driving|jazdy|führerschein|водій|водител/i, 'car'],
    [/troubleshoot|rozwią|fehler|усунення|устранение/i, 'wrench'],
    [/cloud|chmur|хмар|облач/i, 'cloud'],
    [/software|develop|testing|testowan|програм|тестув|тестир/i, 'code'],
    [/security|bezpie|sicher|безпек|безопас/i, 'shield'],
  ];
  function decorate(chip) {
    if (chip.classList.contains('has-attribute-icon')) return;
    const text = chip.textContent.trim();
    if (!text) return;
    const brand = brands.find(([pattern]) => pattern.test(text))?.[1];
    let element;
    if (brand) {
      element = document.createElement('img');
      element.src = 'attribute-logos/' + brand + '.svg';
      element.alt = ''; element.width = 16; element.height = 16;
      element.dataset.brand = brand;
      element.className = 'attribute-mini-icon attribute-brand-icon';
    } else {
      const name = topics.find(([pattern]) => pattern.test(text))?.[1] || 'tag';
      element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      element.setAttribute('viewBox', '0 0 24 24');
      element.setAttribute('focusable', 'false');
      element.setAttribute('fill', 'none'); element.setAttribute('stroke', 'currentColor');
      element.setAttribute('stroke-width', '1.5'); element.setAttribute('stroke-linecap', 'round'); element.setAttribute('stroke-linejoin', 'round');
      element.dataset.topic = name; element.classList.add('attribute-mini-icon');
      const shape = document.createElementNS(element.namespaceURI, 'path');
      shape.setAttribute('d', shapes[name]); element.append(shape);
    }
    element.setAttribute('aria-hidden', 'true');
    chip.prepend(element); chip.classList.add('has-attribute-icon');
  }
  function scan(node) {
    if (!(node instanceof Element)) return;
    if (node.matches(selector)) decorate(node);
    node.querySelectorAll(selector).forEach(decorate);
  }
  scan(document.body);
  const observer = new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(scan);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  addEventListener('pagehide', event => { if (!event.persisted) observer.disconnect(); });
})();
