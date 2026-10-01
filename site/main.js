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
  stage.classList.toggle('is-light', button.dataset.shot === 'light');
}));

/* ---------- language hint ---------- */
const hint = document.querySelector('[data-lang-hint]');
const storage = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } } };
const prefersGerman = (navigator.languages || [navigator.language || '']).some(l => /^de\b/i.test(l));
if (hint && !storage.get('the-note-lang-hint') && (hint.dataset.for === 'de') === prefersGerman) hint.hidden = false;
hint?.querySelector('[data-lang-hint-close]').addEventListener('click', () => { hint.hidden = true; storage.set('the-note-lang-hint', '1'); });
hint?.querySelector('a').addEventListener('click', () => storage.set('the-note-lang-hint', '1'));

/* ---------- live cell ---------- */
const cell = document.querySelector('[data-cell]');
const text = {
  de: { question: 'Soll ich heute etwas Neues ausprobieren?', rolls: 'Das Orakel würfelt', answers: ['Ganz klar: ja.', 'Frag nach dem Kaffee noch einmal.', 'Ja, aber fang klein an.', 'Ja, und schreib es vorher auf.', 'Heute nicht. Morgen bestimmt.', 'Unbedingt, und zwar jetzt.'], lift: 'Abgehoben. Gedanke erfolgreich gestartet.', yourQuestion: 'deine Frage', tryWidth: 'probiere breite = 40' },
  en: { question: 'Should I try something new today?', rolls: 'The oracle rolls', answers: ['Clearly: yes.', 'Ask again after coffee.', 'Yes, but start small.', 'Yes, and write it down first.', 'Not today. Tomorrow for sure.', 'Absolutely, and right now.'], lift: 'Lift-off. Thought launched successfully.', yourQuestion: 'your question', tryWidth: 'try width = 40' },
}[lang];
const width = matchMedia('(max-width: 760px)').matches ? 44 : 58;
const demos = {
  oracle: {
    runtime: 'Python',
    code: `import random, time

# ← ${text.yourQuestion}
frage = "${text.question}"
antworten = ["${text.answers[0]}", …]

print(f"„{frage}“\\n")
print("${text.rolls}", end="", flush=True)
for _ in range(3):
    time.sleep(0.5)
    print(" .", end="", flush=True)

a, b = random.randint(1, 6), random.randint(1, 6)
for links, rechts in zip(wuerfel(a), wuerfel(b)):
    print(links, rechts)
print(f"\\n{a} + {b} = {a + b} · {antworten[(a + b) % 6]}")`,
    async *run() {
      yield `„${text.question}“\n\n${text.rolls}`;
      for (let i = 0; i < 3; i++) { await wait(450); yield ' .'; }
      const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
      const pips = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      const face = n => [0, 1, 2].map(r => '│ ' + [0, 1, 2].map(c => pips[n].includes(r * 3 + c) ? '●' : ' ').join('  ') + ' │');
      yield '\n\n┌─────────┐ ┌─────────┐\n';
      for (const [left, right] of face(a).map((row, i) => [row, face(b)[i]])) { await wait(90); yield `${left} ${right}\n`; }
      yield '└─────────┘ └─────────┘\n';
      await wait(200);
      yield `\n${a} + ${b} = ${a + b} · ${text.answers[(a + b) % 6]}`;
    },
  },
  mandelbrot: {
    runtime: 'JavaScript',
    code: `// ${text.tryWidth}
const breite = ${width}, hoehe = 22, zoom = 1;
const mitte = [-0.6, 0], zeichen = ' .:-=+*#%@';

for (let y = 0; y < hoehe; y++) {
  let zeile = '';
  for (let x = 0; x < breite; x++) {
    const cr = mitte[0] + (x / breite - 0.5) * 3 / zoom;
    const ci = mitte[1] + (y / hoehe - 0.5) * 2.2 / zoom;
    let zr = 0, zi = 0, i = 0;
    while (zr * zr + zi * zi < 4 && i < 60) {
      [zr, zi] = [zr * zr - zi * zi + cr, 2 * zr * zi + ci];
      i++;
    }
    zeile += zeichen[Math.min(9, Math.floor(i / 6))];
  }
  console.log(zeile);
}`,
    async *run() {
      const chars = ' .:-=+*#%@', rows = 22;
      for (let y = 0; y < rows; y++) {
        let line = '';
        for (let x = 0; x < width; x++) {
          const cr = -0.6 + (x / width - 0.5) * 3, ci = (y / rows - 0.5) * 2.2;
          let zr = 0, zi = 0, i = 0;
          while (zr * zr + zi * zi < 4 && i < 60) { [zr, zi] = [zr * zr - zi * zi + cr, 2 * zr * zi + ci]; i++; }
          line += chars[Math.min(9, Math.floor(i / 6))];
        }
        await wait(35);
        yield line + '\n';
      }
    },
  },
  countdown: {
    runtime: 'Shell',
    code: `for i in 3 2 1; do
  echo "        $i …"
  sleep 1
done
cat <<'RAKETE'
          /\\
         /  \\
        | TN |
       /| ✦  |\\
      /_|____|_\\
        ( ** )
RAKETE
echo "  ${text.lift}"`,
    async *run() {
      for (const i of [3, 2, 1]) { yield `        ${i} …\n`; await wait(800); }
      for (const line of ['          /\\', '         /  \\', '        | TN |', '       /| ✦  |\\', '      /_|____|_\\', '        ( ** )', '       (  **  )', '      (   **   )']) { yield line + '\n'; await wait(110); }
      yield `  ${text.lift}\n`;
    },
  },
};
function wait(ms) { return new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : ms)); }
function highlight(code) {
  const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pattern = /(#[^\n]*|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`)|\b(import|from|for|in|do|done|print|let|const|while|if|return|def|cat|echo|sleep|async|await)\b|\b(\d+(?:\.\d+)?)\b|\b(random|time|Math|console|zip)\b/g;
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
  const runButton = cell.querySelector('[data-run]'), runLabel = cell.querySelector('[data-run-label]'), runtime = cell.querySelector('[data-runtime]');
  let current = 'oracle', token = 0;
  const setRunning = running => { runButton.classList.toggle('stop', running); runLabel.textContent = running ? runLabel.dataset.stopText : runLabel.dataset.runText; status.classList.toggle('running', running); };
  function select(name) {
    token++; current = name; setRunning(false);
    cell.querySelectorAll('[data-demo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.demo === name)));
    codeEl.innerHTML = highlight(demos[name].code); runtime.textContent = demos[name].runtime;
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
  select('oracle');
}
