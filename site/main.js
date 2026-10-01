const tabs = [...document.querySelectorAll('[role="tab"]')];
function activate(tab) {
  tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; document.getElementById(item.dataset.panel).hidden = !selected; });
  document.querySelector('.copy-status').textContent = '';
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs.at(-1);
    if (next) { event.preventDefault(); activate(next); next.focus(); }
  });
});
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const code = document.getElementById(button.dataset.copy);
  const status = document.querySelector('.copy-status');
  try { await navigator.clipboard.writeText(code.textContent); status.textContent = 'Kopiert. Du kannst den Befehl im Terminal einfügen.'; }
  catch { const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(code); selection.removeAllRanges(); selection.addRange(range); status.textContent = 'Befehl markiert. Bitte mit ⌘C / Ctrl+C kopieren.'; }
}));
