const lang = document.documentElement.lang === 'en' ? 'en' : 'de';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
const revealed = document.querySelectorAll('.reveal, [data-stage]');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealed.forEach(el => observer.observe(el));
} else revealed.forEach(el => el.classList.add('is-visible'));

/* ---------- day / night preview ---------- */
const stage = document.querySelector('[data-stage]');
document.querySelectorAll('[data-shot]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-shot]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  stage.classList.toggle('is-dark', button.dataset.shot === 'dark');
}));

/* ---------- language hint ---------- */
const hint = document.querySelector('[data-lang-hint]');
const storage = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } } };
const prefersGerman = (navigator.languages || [navigator.language || '']).some(l => /^de\b/i.test(l));
if (hint && !storage.get('the-note-lang-hint') && (hint.dataset.for === 'de') === prefersGerman) hint.hidden = false;
hint?.querySelector('[data-lang-hint-close]').addEventListener('click', () => { hint.hidden = true; storage.set('the-note-lang-hint', '1'); });
hint?.querySelector('a').addEventListener('click', () => storage.set('the-note-lang-hint', '1'));

/* ---------- live cell: a small note with one runnable block ---------- */
const cell = document.querySelector('[data-cell]');
const notes = {
  de: {
    trip: {
      file: 'Lissabon im Mai.md', title: 'Lissabon im Mai', text: 'Vier Tage, drei Leute, ein Plan. Bevor wir buchen, rechne ich kurz nach.',
      tasks: [[true, 'Flüge vergleichen'], [true, 'Wohnung in der Alfama anfragen'], [false, 'Sintra: Zug oder Mietwagen?']],
      items: [['Flüge', 420], ['Wohnung', 540], ['Essen & Ausflüge', 360]], total: 'Gesamt', each: 'pro Person',
    },
    week: {
      file: 'Woche 40.md', title: 'Rückblick · Woche 40', text: 'Was hat geklappt, was nehme ich mit in die nächste Woche?',
      tasks: [[true, 'Angebot verschickt'], [true, 'Workshop vorbereitet'], [true, 'Steuerunterlagen abgelegt'], [false, 'Website-Texte'], [false, 'Zahnarzt anrufen']],
      done: 'erledigt', next: 'nächste Woche',
    },
    oracle: {
      file: 'Kleine Entscheidungen.md', title: 'Kleine Entscheidungen', text: 'Wenn ich mich nicht entscheiden kann, darf der Zufall helfen. Ganz ohne Verpflichtung.',
      tasks: [[false, 'Neues Café ausprobieren?']],
      question: 'Soll ich heute etwas Neues ausprobieren?', rolls: 'Das Orakel würfelt',
      answers: ['Ganz klar: ja.', 'Frag nach dem Kaffee noch einmal.', 'Ja, aber fang klein an.', 'Ja, und schreib es vorher auf.', 'Heute nicht. Morgen bestimmt.', 'Unbedingt, und zwar jetzt.'],
    },
  },
  en: {
    trip: {
      file: 'Lisbon in May.md', title: 'Lisbon in May', text: 'Four days, three people, one plan. Before we book, a quick sum.',
      tasks: [[true, 'Compare flights'], [true, 'Ask about the flat in Alfama'], [false, 'Sintra: train or rental car?']],
      items: [['Flights', 420], ['Flat', 540], ['Food & trips', 360]], total: 'Total', each: 'per person',
    },
    week: {
      file: 'Week 40.md', title: 'Review · week 40', text: 'What worked, and what do I carry into next week?',
      tasks: [[true, 'Sent the proposal'], [true, 'Prepared the workshop'], [true, 'Filed the tax papers'], [false, 'Website copy'], [false, 'Call the dentist']],
      done: 'done', next: 'next week',
    },
    oracle: {
      file: 'Small decisions.md', title: 'Small decisions', text: 'When I cannot decide, chance may help. No strings attached.',
      tasks: [[false, 'Try the new café?']],
      question: 'Should I try something new today?', rolls: 'The oracle rolls',
      answers: ['Clearly: yes.', 'Ask again after coffee.', 'Yes, but start small.', 'Yes, and write it down first.', 'Not today. Tomorrow for sure.', 'Absolutely, and right now.'],
    },
  },
}[lang];
const quote = s => JSON.stringify(s);
// Variable names follow the page language, like a note its author wrote.
const v = lang === 'en'
  ? { costs: 'costs', people: 'people', item: 'item', amount: 'amount', total: 'total', done: 'done', open: 'todo', share: 'share', task: 'task', question: 'question', answers: 'answers', dice: 'die' }
  : { costs: 'kosten', people: 'personen', item: 'posten', amount: 'betrag', total: 'gesamt', done: 'erledigt', open: 'offen', share: 'anteil', task: 'punkt', question: 'frage', answers: 'antworten', dice: 'wuerfel' };
const demos = {
  trip: {
    runtime: 'Python',
    code: `${v.costs} = {
${notes.trip.items.map(([k, n]) => `    ${quote(k)}: ${n},`).join('\n')}
}
${v.people} = 3

for ${v.item}, ${v.amount} in ${v.costs}.items():
    print(f"{${v.item}:<17} {${v.amount}:>4} €  {'█' * round(${v.amount} / 30)}")
${v.total} = sum(${v.costs}.values())
print(f"\\n${notes.trip.total} {${v.total}} € · ${notes.trip.each} {${v.total} / ${v.people}:.0f} €")`,
    async *run() {
      await wait(250);
      for (const [name, amount] of notes.trip.items) { yield `${name.padEnd(17)} ${String(amount).padStart(4)} €  ${'█'.repeat(Math.round(amount / 30))}\n`; await wait(120); }
      const total = notes.trip.items.reduce((sum, [, amount]) => sum + amount, 0);
      yield `\n${notes.trip.total} ${total} € · ${notes.trip.each} ${Math.round(total / 3)} €\n`;
    },
  },
  week: {
    runtime: 'Python',
    code: `${v.done} = [
${notes.week.tasks.filter(t => t[0]).map(t => `    ${quote(t[1])},`).join('\n')}
]
${v.open} = [${notes.week.tasks.filter(t => !t[0]).map(t => quote(t[1])).join(', ')}]

${v.share} = len(${v.done}) / (len(${v.done}) + len(${v.open}))
print(f"{'█' * round(${v.share} * 20):░<20} {${v.share}:.0%} ${notes.week.done}")
for ${v.task} in ${v.open}:
    print("→ ${notes.week.next}:", ${v.task})`,
    async *run() {
      const done = notes.week.tasks.filter(t => t[0]).length, all = notes.week.tasks.length;
      await wait(250);
      for (let i = 1; i <= Math.round(done / all * 20); i++) { await wait(30); }
      yield `${'█'.repeat(Math.round(done / all * 20)).padEnd(20, '░')} ${Math.round(done / all * 100)}% ${notes.week.done}\n`;
      for (const [, task] of notes.week.tasks.filter(t => !t[0])) { await wait(160); yield `→ ${notes.week.next}: ${task}\n`; }
    },
  },
  oracle: {
    runtime: 'Python',
    code: `import random, time

${v.question} = ${quote(notes.oracle.question)}
print(f"„{${v.question}}“\\n\\n${notes.oracle.rolls}", end="", flush=True)
for _ in range(3):
    time.sleep(0.5)
    print(" .", end="", flush=True)

a, b = random.randint(1, 6), random.randint(1, 6)
print(${v.dice}(a), ${v.dice}(b), ${v.answers}[(a + b) % 6])`,
    async *run() {
      yield `„${notes.oracle.question}“\n\n${notes.oracle.rolls}`;
      for (let i = 0; i < 3; i++) { await wait(450); yield ' .'; }
      const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
      const pips = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      const face = n => [0, 1, 2].map(r => '│ ' + [0, 1, 2].map(c => pips[n].includes(r * 3 + c) ? '●' : ' ').join('  ') + ' │');
      yield '\n\n┌─────────┐ ┌─────────┐\n';
      for (const [left, right] of face(a).map((row, i) => [row, face(b)[i]])) { await wait(90); yield `${left} ${right}\n`; }
      yield '└─────────┘ └─────────┘\n';
      await wait(200);
      yield `\n${a} + ${b} = ${a + b} · ${notes.oracle.answers[(a + b) % 6]}`;
    },
  },
};
function wait(ms) { return new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : ms)); }
function highlight(code) {
  const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pattern = /(#[^\n]*|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`)|\b(import|from|for|in|do|done|print|let|const|while|if|return|def|cat|echo|sleep|async|await)\b|\b(\d+(?:\.\d+)?)\b|\b(random|time|Math|console|zip|round|sum|len)\b/g;
  let out = '', last = 0;
  for (const m of code.matchAll(pattern)) {
    out += escape(code.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : 'f';
    out += `<span class="${cls}">${escape(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + escape(code.slice(last));
}
if (cell) {
  const codeEl = cell.querySelector('[data-code]'), output = cell.querySelector('[data-output]'), status = cell.querySelector('[data-status]');
  const noteEl = cell.querySelector('[data-note]'), fileEl = cell.querySelector('[data-file]');
  const runButton = cell.querySelector('[data-run]'), runLabel = cell.querySelector('[data-run-label]'), runtime = cell.querySelector('[data-runtime]');
  let current = 'trip', token = 0;
  const setRunning = running => { runButton.classList.toggle('stop', running); runLabel.textContent = running ? runLabel.dataset.stopText : runLabel.dataset.runText; status.classList.toggle('running', running); };
  function select(name) {
    token++; current = name; setRunning(false);
    cell.querySelectorAll('[data-demo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.demo === name)));
    codeEl.innerHTML = highlight(demos[name].code); runtime.textContent = demos[name].runtime;
    const note = notes[name], escape = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    fileEl.textContent = note.file;
    noteEl.innerHTML = `<h3>${escape(note.title)}</h3><p>${escape(note.text)}</p><ul>${note.tasks.map(([done, task]) => `<li class="${done ? 'done' : ''}"><span aria-hidden="true">${done ? '✓' : ''}</span>${escape(task)}</li>`).join('')}</ul>`;
    output.textContent = cell.dataset.idle; status.textContent = '';
  }
  async function run() {
    if (runButton.classList.contains('stop')) { token++; setRunning(false); status.textContent = cell.dataset.stopped; return; }
    const mine = ++token, started = performance.now();
    output.textContent = ''; status.textContent = cell.dataset.running; setRunning(true);
    for await (const chunk of demos[current].run()) {
      if (mine !== token) return;
      output.textContent += chunk; output.scrollTop = output.scrollHeight;
    }
    if (mine !== token) return;
    setRunning(false);
    status.textContent = `${cell.dataset.done} · ${((performance.now() - started) / 1000).toFixed(2)} s`;
  }
  cell.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => select(b.dataset.demo)));
  runButton.addEventListener('click', run);
  cell.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); run(); } });
  document.querySelector('[data-run-demo]')?.addEventListener('click', () => { if (!runButton.classList.contains('stop')) setTimeout(run, reduceMotion ? 0 : 500); });
  select('trip');
}
