/* Clipboard protection only; the experience summary has no editor or saved override. */
(() => {
  'use strict';
  const fields = 'input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]';
  for (const type of ['copy', 'cut']) {
    document.addEventListener(type, event => {
      const editable = event.target?.closest?.(fields) || document.activeElement?.closest?.(fields);
      if (!editable) event.preventDefault();
    });
  }
})();
