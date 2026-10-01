const lang = document.documentElement.lang === 'en' ? 'en' : 'de';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : ms));
const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- installation tabs and copy ---------- */
const tabs = [...document.querySelectorAll('.install-tabs [role="tab"]')];
const copyStatus = document.querySelector('.copy-status');
function activate(tab) {
  tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; document.getElementById(item.dataset.panel).hidden = !selected; });
  copyStatus.textContent = '';
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
  try { await navigator.clipboard.writeText(code.textContent); copyStatus.textContent = copyStatus.dataset.copied; }
  catch { const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(code); selection.removeAllRanges(); selection.addRange(range); copyStatus.textContent = copyStatus.dataset.selected; }
}));

/* ---------- scroll reveal ---------- */
const revealed = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealed.forEach(el => observer.observe(el));
} else revealed.forEach(el => el.classList.add('is-visible'));

/* ---------- language hint ---------- */
const hint = document.querySelector('[data-lang-hint]');
const storage = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } } };
const prefersGerman = (navigator.languages || [navigator.language || '']).some(l => /^de\b/i.test(l));
if (hint && !storage.get('the-note-lang-hint') && (hint.dataset.for === 'de') === prefersGerman) hint.hidden = false;
hint?.querySelector('[data-lang-hint-close]').addEventListener('click', () => { hint.hidden = true; storage.set('the-note-lang-hint', '1'); });
hint?.querySelector('a').addEventListener('click', () => storage.set('the-note-lang-hint', '1'));

/* ---------- the window tilts upright as it scrolls into view ---------- */
const tilt = document.querySelector('[data-tilt]');
if (tilt && !reduceMotion) {
  let queued = false;
  const update = () => {
    queued = false;
    if (innerWidth < 900) { tilt.style.transform = ''; return; }
    const rect = tilt.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (innerHeight - rect.top) / (innerHeight * 0.75)));
    tilt.style.transform = `perspective(1800px) rotateX(${(1 - progress) * 16}deg) scale(${0.94 + progress * 0.06})`;
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- story: the pinned screenshot follows the active chapter ---------- */
const story = document.querySelector('[data-story]');
if (story && 'IntersectionObserver' in window) {
  const select = n => {
    story.querySelectorAll('[data-story-shot]').forEach(img => img.classList.toggle('is-active', img.dataset.storyShot === n));
    story.querySelectorAll('[data-story-dot]').forEach(dot => dot.classList.toggle('is-active', dot.dataset.storyDot === n));
    story.querySelectorAll('[data-step]').forEach(step => step.classList.toggle('is-active', step.dataset.step === n));
  };
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) select(entry.target.dataset.step); }), { rootMargin: '-45% 0px -45% 0px' });
  story.querySelectorAll('[data-step]').forEach(step => observer.observe(step));
}

/* ---------- the notebook window ---------- */
const NOTES = {
  de: {
    folders: [['Lissabon', ['trip', 'pack']], ['Journal', ['week']]],
    notes: {
      trip: { file: 'Lissabon im Mai.md', total: 'Gesamt', each: 'pro Person', none: 'Keine Beträge gefunden. Schreib zum Beispiel "Flüge": 420.', text: `# Lissabon im Mai

Vier Tage, drei Leute, ein Plan. Hier sammle ich Ideen und offene Fragen, bevor wir buchen.

## Ideen

- Frühstück mit *Pastéis de Nata* in Belém
- Sonnenuntergang am **Miradouro da Senhora do Monte**
- Tagesausflug nach Sintra?

## Offen

- [x] Flüge vergleichen
- [x] Wohnung in der Alfama anfragen
- [ ] Sintra: Zug oder Mietwagen?

## Was kostet uns das?

\`\`\`python
kosten = {"Flüge": 420, "Wohnung": 540, "Essen & Ausflüge": 360}
personen = 3

for posten, betrag in kosten.items():
    print(f"{posten:<17} {betrag:>4} €  {'█' * round(betrag / 30)}")
gesamt = sum(kosten.values())
print(f"\\nGesamt {gesamt} € · pro Person {gesamt / personen:.0f} €")
\`\`\`

Passt ins Budget. Nächster Schritt: Wohnung bestätigen.`, typed: 'Tram-Tickets klären' },
      pack: { file: 'Packliste.md', text: `# Packliste

Leicht reisen, nichts vergessen.

- [x] Reisepass
- [x] Ladekabel
- [ ] Sonnencreme
- [ ] Bequeme Schuhe
- [ ] Ein Buch für den Flug

> Was nicht auf die Liste passt, bleibt zu Hause.` },
      week: { file: 'Woche 40.md', text: `# Woche 40

Ruhiger Start, voller Donnerstag. Was ich mitnehme:

## Gelernt

Kleine Schritte schlagen große Pläne. **Jeden Morgen zuerst eine Sache**, dann der Rest.

## Termine

| Tag | Was |
| :-- | :-- |
| Mo | Workshop vorbereiten |
| Do | Kundentermin in Köln |
| Fr | Rückblick schreiben |

## Nächste Woche

- [ ] Website-Texte fertig machen
- [ ] Zahnarzt anrufen` },
    },
  },
  en: {
    folders: [['Lisbon', ['trip', 'pack']], ['Journal', ['week']]],
    notes: {
      trip: { file: 'Lisbon in May.md', total: 'Total', each: 'per person', none: 'No amounts found. Try something like "Flights": 420.', text: `# Lisbon in May

Four days, three people, one plan. This is where I collect ideas and open questions before we book.

## Ideas

- Breakfast with *pastéis de nata* in Belém
- Sunset at the **Miradouro da Senhora do Monte**
- Day trip to Sintra?

## Open

- [x] Compare flights
- [x] Ask about the flat in Alfama
- [ ] Sintra: train or rental car?

## What will it cost us?

\`\`\`python
costs = {"Flights": 420, "Flat": 540, "Food & trips": 360}
people = 3

for item, amount in costs.items():
    print(f"{item:<17} {amount:>4} €  {'█' * round(amount / 30)}")
total = sum(costs.values())
print(f"\\nTotal {total} € · per person {total / people:.0f} €")
\`\`\`

Within budget. Next step: confirm the flat.`, typed: 'Sort out tram tickets' },
      pack: { file: 'Packing list.md', text: `# Packing list

Travel light, forget nothing.

- [x] Passport
- [x] Charger
- [ ] Sunscreen
- [ ] Comfortable shoes
- [ ] A book for the flight

> Whatever does not fit on the list stays at home.` },
      week: { file: 'Week 40.md', text: `# Week 40

A quiet start, a busy Thursday. What I take with me:

## Learned

Small steps beat big plans. **One thing first every morning**, then the rest.

## Appointments

| Day | What |
| :-- | :-- |
| Mon | Prepare the workshop |
| Thu | Client meeting in Cologne |
| Fri | Write the review |

## Next week

- [ ] Finish the website copy
- [ ] Call the dentist` },
    },
  },
}[lang];

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
function highlight(code) {
  const pattern = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(for|in|print|import|from|def|return|if)\b|\b(\d+(?:\.\d+)?)\b|\b(round|sum|len|items|values)\b/g;
  let out = '', last = 0;
  for (const m of code.matchAll(pattern)) {
    out += escapeHtml(code.slice(last, m.index));
    out += `<span class="${m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : 'f'}">${escapeHtml(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + escapeHtml(code.slice(last));
}
/** Split Markdown into blocks: fenced code stays whole, everything else splits on blank lines. */
function toBlocks(markdown) {
  const blocks = [], lines = markdown.split('\n');
  let current = [];
  const flush = () => { if (current.length) blocks.push(current.join('\n')); current = []; };
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      flush();
      const fence = [lines[i]];
      while (++i < lines.length) { fence.push(lines[i]); if (/^```\s*$/.test(lines[i])) break; }
      blocks.push(fence.join('\n'));
    } else if (!lines[i].trim()) flush();
    else current.push(lines[i]);
  }
  flush();
  return blocks;
}
function kind(source) {
  if (/^```/.test(source)) return 'code';
  if (/^# /.test(source)) return 'h1';
  if (/^## /.test(source)) return 'h2';
  if (/^- \[[ x]\] /.test(source)) return 'tasks';
  if (/^- /.test(source)) return 'list';
  if (/^> /.test(source)) return 'quote';
  if (/^\|/.test(source)) return 'table';
  return 'p';
}

const app = document.querySelector('[data-app]');
if (app) {
  const page = app.querySelector('[data-page]'), tree = app.querySelector('[data-tree]');
  const docs = Object.fromEntries(Object.entries(NOTES.notes).map(([id, note]) => [id, { blocks: toBlocks(note.text), dirty: false, output: null, status: '' }]));
  let current = 'trip', editing = -1, interacted = false;

  function renderBlock(source, index) {
    const type = kind(source);
    if (type === 'h1') return `<h1>${inline(source.slice(2))}</h1>`;
    if (type === 'h2') return `<h2>${inline(source.slice(3))}</h2>`;
    if (type === 'quote') return `<blockquote>${inline(source.replace(/^> ?/gm, ''))}</blockquote>`;
    if (type === 'list') return `<ul>${source.split('\n').map(line => `<li>${inline(line.replace(/^- /, ''))}</li>`).join('')}</ul>`;
    if (type === 'tasks') return `<ul class="tasks">${source.split('\n').map((line, row) => {
      const done = /^- \[x\]/.test(line);
      return `<li class="${done ? 'done' : ''}"><button type="button" class="check" role="checkbox" aria-checked="${done}" data-task="${index}:${row}" aria-label="${escapeHtml(line.slice(6))}"></button><span>${inline(line.slice(6))}</span></li>`;
    }).join('')}</ul>`;
    if (type === 'table') {
      const rows = source.split('\n').filter(line => !/^\|\s*:?-/.test(line)).map(line => line.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
      return `<table><thead><tr>${rows[0].map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    if (type === 'code') {
      const doc = docs[current], code = source.split('\n').slice(1, -1).join('\n');
      return `<div class="code-cell"><pre><code>${highlight(code)}</code></pre><div class="run-bar"><span class="run-lang"><i></i> Python</span><span class="run-status${doc.status === app.dataset.running ? ' running' : ''}">${escapeHtml(doc.status)}</span><button type="button" class="run-btn" data-run="${index}">▶ ${escapeHtml(app.dataset.runText)} <kbd>⌘↵</kbd></button></div>${doc.output === null ? '' : `<div class="run-output"><span>${escapeHtml(app.dataset.output)}</span><pre>${escapeHtml(doc.output)}</pre></div>`}</div>`;
    }
    return `<p>${inline(source)}</p>`;
  }
  function render() {
    const doc = docs[current];
    page.innerHTML = doc.blocks.map((source, i) => `<div class="blk blk-${kind(source)}" data-block="${i}">${renderBlock(source, i)}</div>`).join('');
    app.querySelector('[data-tab]').textContent = NOTES.notes[current].file;
    app.querySelector('[data-crumb]').textContent = NOTES.notes[current].file;
    const words = doc.blocks.join(' ').replace(/```[\s\S]*?```/g, '').replace(/[#>*|`\-[\]:]/g, ' ').split(/\s+/).filter(Boolean).length;
    app.querySelector('[data-wordcount]').innerHTML = `<b>${words}</b> ${escapeHtml(app.dataset.words)}`;
    app.querySelector('[data-status-saved]').textContent = doc.dirty ? app.dataset.unsaved : app.dataset.saved;
    app.querySelector('[data-status-saved]').classList.toggle('dirty', doc.dirty);
    app.querySelector('[data-changes]').classList.toggle('dirty', doc.dirty);
    tree.querySelectorAll('[data-note]').forEach(link => link.classList.toggle('on', link.dataset.note === current));
  }
  tree.innerHTML = NOTES.folders.map(([folder, ids]) => `<div class="tree-folder"><span><i aria-hidden="true">▾</i> ${escapeHtml(folder)}</span>${ids.map(id => `<button type="button" data-note="${id}"><i aria-hidden="true">▤</i> ${escapeHtml(NOTES.notes[id].file)}</button>`).join('')}</div>`).join('');

  function markDirty() { docs[current].dirty = true; }
  /** Live Markdown: the clicked block shows its source, like the app's live view. */
  function edit(index) {
    if (editing !== -1) return;
    const el = page.querySelector(`[data-block="${index}"]`);
    if (!el) return;
    editing = index;
    const source = docs[current].blocks[index];
    el.classList.add('is-editing');
    el.innerHTML = `<textarea class="src src-${kind(source)}" spellcheck="false" aria-label="Markdown">${escapeHtml(source)}</textarea>`;
    const area = el.querySelector('textarea');
    const fit = () => { area.style.height = 'auto'; area.style.height = area.scrollHeight + 'px'; };
    fit(); area.focus({ preventScroll: true }); area.setSelectionRange(area.value.length, area.value.length);
    area.addEventListener('input', () => { fit(); markDirty(); });
    area.addEventListener('keydown', event => { if (event.key === 'Escape') area.blur(); });
    area.addEventListener('blur', () => {
      const value = area.value.replace(/\s+$/, '');
      const blocks = docs[current].blocks;
      if (value) blocks.splice(index, 1, ...toBlocks(value)); else blocks.splice(index, 1);
      editing = -1; render();
    });
    return area;
  }
  function toggleTask(ref) {
    const [index, row] = ref.split(':').map(Number);
    const blocks = docs[current].blocks, lines = blocks[index].split('\n');
    lines[row] = /^- \[x\]/.test(lines[row]) ? lines[row].replace('- [x]', '- [ ]') : lines[row].replace('- [ ]', '- [x]');
    blocks[index] = lines.join('\n'); markDirty(); render();
  }
  async function run(index) {
    const doc = docs[current], note = NOTES.notes[current];
    const source = doc.blocks[index] || '';
    const items = [...source.matchAll(/"([^"]+)"\s*:\s*(\d+(?:\.\d+)?)/g)].map(m => [m[1], Number(m[2])]);
    const people = Number(/(?:personen|people)\s*=\s*(\d+)/.exec(source)?.[1] || 1);
    const started = performance.now();
    doc.output = ''; doc.status = app.dataset.running; render();
    const lines = items.length ? items.map(([name, amount]) => `${name.padEnd(17)} ${String(amount).padStart(4)} €  ${'█'.repeat(Math.round(amount / 30))}`) : [note.none];
    for (const line of lines) { await wait(110); doc.output += line + '\n'; if (current === 'trip') render(); }
    if (items.length) { const total = items.reduce((sum, [, amount]) => sum + amount, 0); doc.output += `\n${note.total} ${total} € · ${note.each} ${Math.round(total / Math.max(1, people))} €`; }
    doc.status = `${app.dataset.done} · ${((performance.now() - started) / 1000).toFixed(2)} s`;
    render();
  }

  page.addEventListener('click', event => {
    const task = event.target.closest('[data-task]'), runButton = event.target.closest('[data-run]');
    if (task) return toggleTask(task.dataset.task);
    if (runButton) return run(Number(runButton.dataset.run));
    if (event.target.closest('.run-bar, .run-output, textarea')) return;
    const block = event.target.closest('[data-block]');
    if (block) edit(Number(block.dataset.block));
  });
  app.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      const code = docs[current].blocks.findIndex(source => kind(source) === 'code');
      if (code !== -1) { event.preventDefault(); document.activeElement?.blur(); run(code); }
    }
  });
  tree.addEventListener('click', event => {
    const link = event.target.closest('[data-note]');
    if (!link) return;
    document.activeElement?.blur();
    current = link.dataset.note; render(); page.scrollTop = 0;
  });
  app.querySelector('[data-theme-toggle]').addEventListener('click', () => { app.dataset.theme = app.dataset.theme === 'dark' ? 'light' : 'dark'; });
  app.querySelector('[data-save]').addEventListener('click', () => { docs[current].dirty = false; render(); });
  ['pointerdown', 'keydown', 'wheel'].forEach(type => app.addEventListener(type, event => { if (event.isTrusted) interacted = true; }, { passive: true }));
  render();

  /* The note writes itself once: a new task appears, an open one gets ticked. */
  async function intro() {
    if (reduceMotion) return;
    await wait(900);
    if (interacted) return;
    const tasks = docs.trip.blocks.findIndex(source => kind(source) === 'tasks');
    const area = edit(tasks);
    if (!area) return;
    const addition = `\n- [ ] ${NOTES.notes.trip.typed}`;
    for (const char of addition) {
      if (interacted) break;
      area.value += char; area.dispatchEvent(new Event('input'));
      await wait(char === '\n' ? 220 : 55);
    }
    await wait(450);
    area.blur();
    if (interacted) return;
    await wait(700);
    toggleTask(`${tasks}:2`);
  }
  if ('IntersectionObserver' in window) {
    const watcher = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { watcher.disconnect(); intro(); } }, { threshold: 0.45 });
    watcher.observe(app);
  }
}
