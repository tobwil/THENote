/**
 * Reproduce the public screenshots in Chromium, without provider calls.
 *
 * The native layer is simulated (as in the e2e tests) so the app shows its
 * desktop chrome. Code outputs are real: every pictured block is executed
 * locally with bash, python3 and node before its output is placed in the note.
 */
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = 'docs/screenshots';
const RUNNERS = { sh: ['bash', '-c'], python: ['python3', '-u', '-c'], js: ['node', '-e'] };
const blocksOf = markdown => [...markdown.matchAll(/^```(\w+)\n([\s\S]*?)^```$/gm)].map(([text, language, code]) => ({ text, language, code }));
function execute({ language, code }, cwd, timeout = 8000) {
  const [command, ...args] = RUNNERS[language];
  const started = Date.now();
  const result = spawnSync(command, [...args, code], { cwd, timeout, encoding: 'utf8' });
  return { output: (result.stdout ?? '') + (result.stderr ?? ''), exitCode: result.status, durationMs: Date.now() - started, timedOut: result.error?.code === 'ETIMEDOUT' };
}

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1453', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vite timeout')), 20000);
    server.stdout.on('data', data => { if (String(data).includes('Local:')) { clearTimeout(timer); resolve(); } });
    server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite ${code}`)); });
  });
  // German UI locale, so native controls such as the date input read TT.MM.JJJJ.
  const options = { args: ['--lang=de-DE'], env: { ...process.env, LANG: 'de_DE.UTF-8', LANGUAGE: 'de' } };
  try { browser = await chromium.launch(options); } catch { browser = await chromium.launch({ ...options, channel: 'chrome' }).catch(() => chromium.launch({ ...options, executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' })); }
  const context = await browser.newContext({
    viewport: { width: 1380, height: 900 }, deviceScaleFactor: 2, locale: 'de-DE', timezoneId: 'Europe/Berlin',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  });
  // Painted demo photos stand in for pictures in the gallery shots (scripts/demo-photos.js).
  await context.addInitScript({ path: 'scripts/demo-photos.js' });
  await context.addInitScript(() => {
    const photo = path => { const name = path.match(/\/assets\/(\w+)\.jpg$/)?.[1]; return name ? window.__demoPhoto(name) : null; };
    window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } }, transformCallback() { return 1; }, unregisterCallback() {}, convertFileSrc(path) { return photo(path) ?? path; }, async invoke(cmd) {
      if (cmd === 'load_settings') return {};
      if (cmd === 'list_shadows' || cmd === 'list_fonts') return [];
      if (cmd === 'ai_status') return { config: { enabled: false, endpoint: '', protocol: 'chat-completions', model: '', maxTokens: 4096, rememberKey: false }, hasKey: false, keychainAvailable: true };
      return null;
    } };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:1453');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  await mkdir(OUT, { recursive: true });

  const setTheme = theme => page.evaluate(async theme => { (await import('/src/store.ts')).setTheme(theme); }, theme);
  const workspace = (name, files) => page.evaluate(async ({ name, files }) => {
    const s = await import('/src/store.ts');
    s.setFolderPath('/Users/demo/' + name); s.setFolderName(name); s.setSidebarTab('files'); s.setFileTree(files);
  }, { name, files });
  /** Open a note, attach real outputs to the given block numbers and scroll to `scrollTo`. */
  async function showNote(markdown, path, runs, scrollTo, expand = false) {
    await page.evaluate(async ({ markdown, path }) => { (await import('/src/store.ts')).loadDocument(markdown, path); }, { markdown, path });
    await page.waitForTimeout(600);
    await page.evaluate(async ({ runs, path }) => {
      const s = await import('/src/store.ts'); const ex = await import('/src/execution.ts'); const model = await import('/src/execution/model.ts');
      const executable = s.doc.blocks.filter(b => model.parseExecutable(b.text));
      ex.setRuns(runs.map((run, i) => {
        const block = executable[run.index];
        return { id: 'shot-' + i, blockId: block.id, tabId: s.activeTabId(), note: path.split('/').pop(), language: model.parseExecutable(block.text).label, source: block.text,
          status: run.status, output: run.output, exitCode: run.exitCode, durationMs: run.durationMs, started: Date.now() - 4000 + i };
      }));
    }, { runs, path });
    await page.waitForTimeout(400);
    if (expand) await page.evaluate(() => document.querySelectorAll('.run-output pre').forEach(pre => { pre.style.maxHeight = 'none'; }));
    // Show the block's output: bottom-aligned, or from the heading when it all fits.
    await page.evaluate(text => {
      const panel = document.querySelector('#document-panel');
      const headings = [...panel.querySelectorAll('h2')];
      const heading = text && headings.find(h => h.textContent.includes(text));
      if (!heading) return;
      const top = panel.getBoundingClientRect().top;
      const output = [...panel.querySelectorAll('.run-output')].find(o => o.getBoundingClientRect().top > heading.getBoundingClientRect().top);
      const fromHeading = heading.getBoundingClientRect().top - top - 24;
      const toOutput = output ? output.getBoundingClientRect().bottom - top - panel.clientHeight + 32 : fromHeading;
      panel.scrollTop += Math.max(fromHeading, toOutput);
    }, scrollTo);
    await page.waitForTimeout(300);
  }
  const ran = (block, cwd) => { const r = execute(block, cwd); return { status: 'finished', output: r.output, exitCode: r.exitCode, durationMs: r.durationMs }; };
  // Timers and exercises print exactly what they print, just without waiting: sleep becomes a no-op.
  const ranFast = block => ran({ ...block, code: 'import time\ntime.sleep = lambda *_: None\n' + block.code });
  const snippet = id => page.evaluate(async id => (await import('/src/snippets.ts')).SNIPPETS[id](), id);

  // 1 · The notebook first: a trip note with one small calculation, by day and by night.
  const trip = await readFile('examples/Reiseplanung.md', 'utf8');
  const tripRun = ran(blocksOf(trip)[0]);
  await workspace('Reisen', [{ name: 'Lissabon im Mai.md', path: '/Users/demo/Reisen/Lissabon im Mai.md', is_dir: false }, { name: 'Packliste.md', path: '/Users/demo/Reisen/Packliste.md', is_dir: false }, { name: 'Fotos', path: '/Users/demo/Reisen/Fotos', is_dir: true, children: [] }]);
  await page.setViewportSize({ width: 1380, height: 1300 });
  for (const [theme, file] of [['sarala', 'note-light'], ['forest', 'note-dark']]) {
    await setTheme(theme);
    await showNote(trip, '/Users/demo/Reisen/Lissabon im Mai.md', [{ index: 0, ...tripRun }], null);
    await page.evaluate(() => { document.querySelector('#document-panel').scrollTop = 0; });
    await page.screenshot({ path: `${OUT}/${file}.png` });
  }
  await page.setViewportSize({ width: 1380, height: 900 });

  // 2 · Playful code from the Spielplatz: Mandelbrot in characters.
  const playground = await readFile('examples/Spielplatz.md', 'utf8');
  const pBlocks = blocksOf(playground);
  await workspace('Spielplatz', [{ name: 'Spielplatz.md', path: '/Users/demo/Spielplatz/Spielplatz.md', is_dir: false }, { name: 'Werkzeugkasten.md', path: '/Users/demo/Spielplatz/Werkzeugkasten.md', is_dir: false }]);
  await showNote(playground, '/Users/demo/Spielplatz/Spielplatz.md', [{ index: 3, ...ran(pBlocks[3]) }], 'Mandelbrot', true);
  await page.screenshot({ path: `${OUT}/mandelbrot-dark.png` });

  // 3 · Werkzeugkasten in daylight, run inside a neutral demo folder.
  const toolbox = await readFile('examples/Werkzeugkasten.md', 'utf8');
  const tBlocks = blocksOf(toolbox);
  const demo = await mkdtemp(join(tmpdir(), 'the-note-demo-'));
  await setTheme('sarala');
  await workspace('Haushalt', [{ name: 'Werkzeugkasten.md', path: '/Users/demo/Haushalt/Werkzeugkasten.md', is_dir: false }, { name: 'Belege', path: '/Users/demo/Haushalt/Belege', is_dir: true, children: [] }]);
  await showNote(toolbox, '/Users/demo/Haushalt/Werkzeugkasten.md', [{ index: 3, ...ran(tBlocks[3], demo) }, { index: 4, ...ran(tBlocks[4], demo) }], 'Kalender');
  await page.screenshot({ path: `${OUT}/toolbox-light.png` });

  // 4 · Inline AI with a fixture answer: no API request is made.
  await workspace('Ideenwerkstatt', [{ name: 'Ideenwerkstatt.md', path: '/Users/demo/Ideenwerkstatt/Ideenwerkstatt.md', is_dir: false }, { name: 'Projektnotizen', path: '/Users/demo/Ideenwerkstatt/Projektnotizen', is_dir: true, children: [] }]);
  await page.evaluate(async () => {
    const store = await import('/src/store.ts');
    const ai = await import('/src/ai.ts');
    const inline = await import('/src/ai/inline.ts');
    const fence = inline.serializeAiPrompt('Skizziere unseren Ideenprozess als Mermaid-Diagramm.');
    store.loadDocument('# Von der Idee zum Ergebnis\n\nGedanken sammeln, Zusammenhänge sehen und den nächsten Schritt festhalten.\n\n' + fence, '/Users/demo/Ideenwerkstatt/Ideenwerkstatt.md');
    ai.setAiStatus({ config: { enabled: true, protocol: 'chat-completions', endpoint: 'https://example.invalid/v1/chat/completions', model: 'Demo-Modell', maxTokens: 4096, rememberKey: false }, hasKey: false, keychainAvailable: false });
    const block = store.doc.blocks.find(b => inline.parseAiPrompt(b.text) !== null);
    ai.setInlineRuns(block.id, { id: 'screenshot-fixture', tab: store.activeTabId(), block: block.id, source: block.text, status: 'done', model: 'Demo-Modell', contextAttached: false,
      content: '```mermaid\nflowchart LR\n  A[Idee] --> B[Notiz]\n  B --> C[Experiment]\n  C --> D[Erkenntnis]\n  D --> B\n```' });
  });
  await page.getByRole('button', { name: '✓ Übernehmen' }).waitFor();
  await page.evaluate(() => { document.querySelector('#document-panel').scrollTop = 0; return document.fonts.ready; });
  await page.screenshot({ path: `${OUT}/inline-ai.png` });

  // 5 · Unsaved changes compared with the last saved state.
  await page.evaluate(async () => {
    const s = await import('/src/store.ts');
    s.loadDocument('# Besprechung\n\nAlter Absatz mit der ersten Idee.\n\nBleibt erhalten.', '/Users/demo/Ideenwerkstatt/Besprechung.md');
    s.replaceAll('# Besprechung\n\nNeuer Absatz, weitergedacht.\n\nBleibt erhalten.\n\n- [ ] Nächster Schritt festhalten');
  });
  await page.getByRole('button', { name: /± Änderungen/ }).click();
  await page.getByRole('dialog', { name: 'Ungespeicherte Änderungen' }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/unsaved-diff.png` });
  await page.keyboard.press('Escape');

  // 6 · Folders with nested notes and a date inserted at the caret.
  await page.evaluate(async () => {
    const s = await import('/src/store.ts');
    s.setFolderPath('/Users/demo/Kuchen'); s.setFolderName('Kuchen'); s.setSidebarTab('files');
    s.setFileTree([
      { name: 'Rezepte', path: '/Users/demo/Kuchen/Rezepte', is_dir: true, children: [{ name: 'Apfelkuchen.md', path: '/Users/demo/Kuchen/Rezepte/Apfelkuchen.md', is_dir: false }, { name: 'Zitronentarte.md', path: '/Users/demo/Kuchen/Rezepte/Zitronentarte.md', is_dir: false }] },
      { name: 'Einkauf', path: '/Users/demo/Kuchen/Einkauf', is_dir: true, children: [] },
      { name: 'Backplan.md', path: '/Users/demo/Kuchen/Backplan.md', is_dir: false },
    ]);
    s.setFolderOpen('/Users/demo/Kuchen/Rezepte', true);
    s.loadDocument('# Backplan\n\nTermin: \n\n## Zutaten\n\n- [ ] Äpfel\n- [ ] Zimt\n- [x] Mehl', '/Users/demo/Kuchen/Backplan.md');
  });
  await page.waitForTimeout(400);
  await page.locator('.editor .block').nth(1).click();
  await page.keyboard.press('End');
  await page.evaluate(async () => { (await import('/src/components/DatePicker.tsx')).openDatePicker(); });
  await page.locator('.date-picker').waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/folders-and-date.png` });
  await page.keyboard.press('Escape');

  // 7 · Pictures: a gallery as a grid in a travel note, then the full-window viewer.
  await page.evaluate(async () => {
    const s = await import('/src/store.ts');
    s.setFolderPath('/Users/demo/Reisen'); s.setFolderName('Reisen'); s.setSidebarTab('files');
    s.setFileTree([
      { name: 'Lissabon', path: '/Users/demo/Reisen/Lissabon', is_dir: true, children: [
        { name: 'Fotos.md', path: '/Users/demo/Reisen/Lissabon/Fotos.md', is_dir: false },
        { name: 'Lissabon im Mai.md', path: '/Users/demo/Reisen/Lissabon/Lissabon im Mai.md', is_dir: false },
        { name: 'Packliste.md', path: '/Users/demo/Reisen/Lissabon/Packliste.md', is_dir: false },
      ] },
      { name: 'Porto', path: '/Users/demo/Reisen/Porto', is_dir: true, children: [] },
    ]);
    s.setFolderOpen('/Users/demo/Reisen/Lissabon', true);
    s.loadDocument([
      '# Lissabon – Fotos', '',
      'Sechs Tage, viele Lieblingsorte. Mehrere Bilder hintereinander werden zur Galerie; **▦ Raster** zeigt alle auf einmal.', '',
      ['tejo', 'alfama', 'atlantik', 'azulejos', 'miradouro', 'cabo'].map((name, i) => `![${['Sonnenuntergang am Tejo', 'Alfama', 'Atlantik bei Cascais', 'Azulejos', 'Miradouro am Abend', 'Cabo da Roca'][i]}](assets/${name}.jpg)`).join('\n'), '',
      '## Was wir uns merken', '',
      '- [x] Tram 28 früh am Morgen', '- [x] Pastéis de Nata in Belém', '- [ ] Fotos für Oma ausdrucken',
    ].join('\n'), '/Users/demo/Reisen/Lissabon/Fotos.md');
  });
  await page.locator('.img-gallery.grid').waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.img-gallery img')].every(img => img.complete && img.naturalWidth > 0));
  await page.evaluate(() => { document.querySelector('#document-panel').scrollTop = 0; document.activeElement?.blur(); });
  await page.mouse.move(1300, 860);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/gallery.png` });
  await page.locator('.img-gallery img').nth(0).click();
  await page.getByRole('dialog', { name: 'Bildansicht' }).waitFor();
  await page.mouse.move(690, 870);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/image-viewer.png` });
  await page.keyboard.press('Escape');
  // 8 · The slash menu: building blocks for every moment, opened in a workshop note.
  await page.evaluate(async () => {
    const s = await import('/src/store.ts');
    s.setFolderPath('/Users/demo/Team'); s.setFolderName('Team'); s.setSidebarTab('files');
    s.setFileTree([
      { name: 'Workshops', path: '/Users/demo/Team/Workshops', is_dir: true, children: [{ name: 'Strategie-Workshop.md', path: '/Users/demo/Team/Workshops/Strategie-Workshop.md', is_dir: false }] },
      { name: 'Meetings', path: '/Users/demo/Team/Meetings', is_dir: true, children: [] },
    ]);
    s.setFolderOpen('/Users/demo/Team/Workshops', true);
    s.loadDocument('# Strategie-Workshop\n\nZiel: drei Prioritäten für das nächste Quartal.\n\n', '/Users/demo/Team/Workshops/Strategie-Workshop.md');
    s.appendBlock(''); s.setActive(s.doc.blocks.length - 1);
  });
  await page.locator('.block.active .source').waitFor();
  await page.keyboard.type('/');
  await page.locator('.slash-item').first().waitFor();
  // Scroll the menu to the quick actions and calm blocks.
  await page.evaluate(() => {
    const header = [...document.querySelectorAll('.slash-group')].find(el => el.textContent.includes('KI-Schnellaktionen'));
    const list = header?.closest('[role="listbox"], .slash-menu, .slash-list') ?? header?.parentElement;
    let box = header; while (box && box.scrollHeight <= box.clientHeight + 1) box = box.parentElement;
    if (box && header) box.scrollTop = header.offsetTop - 4;
    void list;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/slash-menu.png` });
  await page.keyboard.press('Escape');

  // 9 · Moderation: a workshop note with check-in, speaking order, dot voting and ROTI; outputs are real.
  const workshop = ['# Strategie-Workshop', 'Ziel: drei Prioritäten für das nächste Quartal.',
    (await snippet('speakingOrder')).replace('["Anna", "Ben", "Chris", "Dana", "Emil"]', '["Lena", "Jonas", "Mia", "Can"]'),
    (await snippet('dotVoting')).replace('| Anna | Ben | Chris |', '| Lena | Jonas | Mia |').replace('Idee 1 |', 'Neue Kunden |').replace('Idee 2 |', 'Onboarding |').replace('Idee 3 |', 'Weniger Meetings |'),
    (await snippet('roti')).replace('| Anna |', '| Lena |').replace('| Ben |', '| Jonas |').replace('| Chris |', '| Mia |')].join('\n\n') + '\n';
  const wBlocks = blocksOf(workshop);
  await showNote(workshop, '/Users/demo/Team/Workshops/Strategie-Workshop.md', [{ index: 0, ...ran(wBlocks[0]) }], null);
  await page.evaluate(() => { document.querySelector('#document-panel').scrollTop = 0; document.activeElement?.blur(); });
  await page.setViewportSize({ width: 1380, height: 1300 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/moderation.png` });

  // 10 · Fokus & Ruhe: a filled-in daily focus and the breathing exercise with its real output.
  const focus = [(await snippet('checkIn')).replace('**Das Wichtigste heute:** …', '**Das Wichtigste heute:** Angebot für Kunde Nord fertig machen')
      .replace('- [ ] Eine Sache, die heute zählt\n- [ ] Noch etwas Kleines\n- [ ] Und eine Kleinigkeit', '- [x] Zahlen mit Lena abstimmen\n- [ ] Entwurf schreiben\n- [ ] Um 16 Uhr abschicken')
      .replace('**Was lasse ich heute bewusst weg?** …', '**Was lasse ich heute bewusst weg?** E-Mails vor 11 Uhr'),
    await snippet('breathing')].join('\n\n') + '\n';
  const fBlocks = blocksOf(focus);
  await page.setViewportSize({ width: 1380, height: 1300 });
  await showNote(focus, '/Users/demo/Team/Montag.md', [{ index: 0, ...ranFast(fBlocks[0]) }], null);
  await page.evaluate(() => { document.querySelector('#document-panel').scrollTop = 0; document.activeElement?.blur(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/focus.png` });
  await page.setViewportSize({ width: 1380, height: 900 });

  // 11 · KI-Schnellaktionen: /todos on meeting notes, with a fixture answer (no API request).
  await page.evaluate(async () => {
    const store = await import('/src/store.ts');
    const ai = await import('/src/ai.ts');
    const inline = await import('/src/ai/inline.ts');
    const { QUICK_PROMPTS } = await import('/src/snippets.ts');
    store.loadDocument(['# Besprechung Kunde Nord', '**Dabei:** Lena, Jonas, Mia',
      'Lena stellt die neuen Zahlen vor; das Budget passt, wenn wir die Schulung ins zweite Quartal schieben. Jonas klärt bis Freitag, ob der Termin im März hält. Mia schreibt die Zusammenfassung für den Kunden.',
      'Offen: Wer übernimmt die Präsentation beim Kunden?',
      inline.serializeAiPrompt(QUICK_PROMPTS.todos)].join('\n\n'), '/Users/demo/Team/Meetings/Kunde Nord.md');
    ai.setAiStatus({ config: { enabled: true, protocol: 'chat-completions', endpoint: 'https://example.invalid/v1/chat/completions', model: 'Demo-Modell', maxTokens: 4096, rememberKey: false }, hasKey: false, keychainAvailable: false });
    const block = store.doc.blocks.find(b => inline.parseAiPrompt(b.text) !== null);
    ai.setInlineRuns(block.id, { id: 'screenshot-todos', tab: store.activeTabId(), block: block.id, source: block.text, status: 'done', model: 'Demo-Modell', contextAttached: true,
      content: '## To-dos\n\n- [ ] Schulung ins zweite Quartal verschieben · Lena · nächste Woche\n- [ ] Termin im März bestätigen · Jonas · Freitag\n- [ ] Zusammenfassung an den Kunden schicken · Mia · offen\n- [ ] Präsentation beim Kunden übernehmen · offen · offen' });
  });
  await page.getByRole('button', { name: '✓ Übernehmen' }).waitFor();
  await page.setViewportSize({ width: 1380, height: 1300 });
  await page.locator('.inline-ai-controls input[type=checkbox]').check();
  // Show the meeting text's end, the prompt and the whole draft.
  await page.evaluate(() => { const panel = document.querySelector('#document-panel'); const ai = panel.querySelector('.inline-ai'); panel.scrollTop = ai.getBoundingClientRect().top - panel.getBoundingClientRect().top - 420; document.activeElement?.blur(); return document.fonts.ready; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/quick-actions.png` });
  await page.setViewportSize({ width: 1380, height: 900 });

  console.log('Screenshots saved; outputs executed locally, AI answer is a fixture, no API request.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
