/**
 * Slash building blocks and quick actions, plus the template menu in the tab
 * bar: /atem, /pomodoro, /entscheidung, Werkzeugkasten and Spielplatz sections
 * land in the open note; /zusammenfassen sends the note to the AI provider at
 * once and the summary can be accepted. Native layer and provider mocked.
 *
 *   node tests/e2e-slashblocks.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1466', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Vite startup timeout')), 20000); server.stdout.on('data', d => { if (String(d).includes('Local:')) { clearTimeout(timer); resolve(); } }); server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); }); });
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    let counter = 0;
    const callbacks = new Map(), listeners = new Map(), requests = [];
    const emit = (event, payload) => { for (const id of listeners.get(event) || []) callbacks.get(id)?.({ event, payload }); };
    window.__ai = { requests };
    window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } },
      transformCallback(fn) { const id = ++counter; callbacks.set(id, fn); return id; }, unregisterCallback(id) { callbacks.delete(id); }, convertFileSrc(path) { return path; },
      async invoke(cmd, args) {
        if (cmd === 'plugin:event|listen') { const ids = listeners.get(args.event) || []; ids.push(args.handler); listeners.set(args.event, ids); return args.handler; }
        if (cmd === 'load_settings') return {};
        if (cmd === 'plugin:dialog|save') { window.__saveDialog = args.options.defaultPath; return args.options.defaultPath; }
        if (cmd === 'save_file') { (window.__written ??= []).push(args.path); return; }
        if (cmd === 'reveal_in_dir' || cmd === 'reveal_path') { window.__revealed = args.path; return; }
        if (cmd === 'list_shadows' || cmd === 'list_fonts') return [];
        if (cmd === 'ai_status') return { config: { enabled: true, endpoint: 'https://example.invalid/v1', protocol: 'chat-completions', model: 'Demo', maxTokens: 4096, rememberKey: false }, hasKey: true, keychainAvailable: true };
        if (cmd === 'ai_start') {
          requests.push(structuredClone(args.request));
          setTimeout(() => { emit('note-ai', { id: args.request.id, kind: 'delta', text: '## Zusammenfassung\n\n- Brot und Käse kaufen\n- Samstag backen' }); emit('note-ai', { id: args.request.id, kind: 'done', text: '' }); }, 100);
          return;
        }
        return null;
      } };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
  });
  await page.goto('http://127.0.0.1:1466');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  const text = () => page.evaluate(async () => (await import('/src/store.ts')).fullText());

  // 1. Templates live beside the tab bar's +, not in the note's own toolbar.
  assert.equal(await page.locator('.notebook-actions').getByText('Neue Notiz').count(), 0, 'the note toolbar no longer offers new notes');
  const templates = page.getByRole('button', { name: 'Neue Notiz aus Vorlage' });
  assert.ok(await templates.evaluate(el => !!el.closest('.document-tabs')), 'the template button sits in the tab bar');
  await templates.click();
  const menu = page.getByRole('menu', { name: 'Neue Notiz aus Vorlage' });
  await menu.waitFor();
  assert.equal(await menu.getByRole('menuitem').count(), 7);
  assert.ok(await menu.getByRole('menuitem', { name: /Moderationskoffer/ }).isVisible(), 'the facilitation kit is a template');
  await page.keyboard.press('Escape');
  await menu.waitFor({ state: 'hidden' });
  await templates.click();
  await menu.getByRole('menuitem', { name: /Leere Notiz/ }).click();
  await menu.waitFor({ state: 'hidden' });

  // 2. Building blocks land in the open note: type on an empty line, pick, done.
  // A fresh empty line at the end of the note, then /query.
  const slash = async (query, label) => {
    await page.evaluate(async () => { const s = await import('/src/store.ts'); s.appendBlock(''); s.setActive(s.doc.blocks.length - 1); });
    await page.locator('.block.active .source').waitFor();
    await page.keyboard.type('/' + query);
    const item = page.locator('.slash-item').filter({ hasText: label }).first();
    await item.waitFor();
    await item.click();
    await page.waitForTimeout(150);
  };
  await page.locator('.editor .page > .block').first().click();
  await page.keyboard.type('Wochenende planen');
  await page.evaluate(async () => (await import('/src/store.ts')).setActive(-1));
  await slash('atem', 'Atemübung');
  let md = await text();
  assert.match(md, /^Wochenende planen\n\n## 🌬 Box-Atmung\n/, 'the exercise follows the text, the /query is gone');
  assert.match(md, /```python\nimport time\n/);
  assert.ok(!md.includes('/atem'));
  assert.equal(await page.locator('.block.active').count(), 0, 'inserted blocks show rendered');

  await slash('pomodoro', 'Fokuszeit');
  await slash('entscheidung', 'Entscheidungsmatrix');
  await slash('orakel', 'Würfelorakel');
  await slash('git', 'Git auf einen Blick');
  md = await text();
  for (const heading of ['## 🍅 Fokuszeit', '## ⚖ Entscheidung', '## 🎲 Das Würfelorakel', '## 03 · Git auf einen Blick']) assert.ok(md.includes(heading), heading);
  assert.ok(md.indexOf('Fokuszeit') < md.indexOf('Entscheidung') && md.indexOf('Entscheidung') < md.indexOf('Würfelorakel'), 'each block lands where it was typed');
  // The decision matrix computes: A = 3·4+2·2+2·5+1·3 = 29, B = 3·2+2·5+2·3+1·4 = 26.
  const sums = await page.locator('.rendered table').filter({ hasText: 'Kriterium' }).locator('tr').last().innerText();
  assert.match(sums, /29\s+26/);
  assert.ok(await page.getByRole('button', { name: /ausführen$/ }).count() >= 4, 'code building blocks can be run');
  await page.evaluate(async () => (await import('/src/store.ts')).undo());
  assert.ok(!(await text()).includes('Git auf einen Blick'), 'one undo removes a building block');

  // 2b. Moderation methods: dot voting and ROTI compute, the retro and Crazy 8s land in place.
  await slash('punkte', 'Punkte-Abstimmung');
  await slash('roti', 'ROTI-Feedback');
  await slash('retro', 'Retrospektive');
  await slash('crazy', 'Crazy 8s');
  md = await text();
  for (const heading of ['## 🔴 Punkte-Abstimmung', '## 📈 ROTI', '## 🔁 Retrospektive', '## ✏️ Crazy 8s']) assert.ok(md.includes(heading), heading);
  assert.match(await page.locator('.rendered table').filter({ hasText: 'Chris' }).filter({ hasText: 'Idee 1' }).locator('tr').last().innerText(), /3\s+3\s+3\s+9/, 'dot votes are counted');
  assert.match(await page.locator('.rendered table').filter({ hasText: 'Durchschnitt' }).innerText(), /Durchschnitt\s+4\b/, 'ROTI average');

  // 3. Quick action: /zusammenfassen sends the note right away and the summary can be accepted.
  await slash('zusammen', 'Notiz zusammenfassen');
  await page.waitForFunction(() => window.__ai.requests.length === 1);
  const request = await page.evaluate(() => window.__ai.requests[0]);
  assert.match(request.messages.at(-1).content, /Fasse diese Notiz in 3 bis 5/);
  assert.match(request.context, /Box-Atmung/, 'the note goes along as context');
  await page.getByRole('button', { name: '✓ Übernehmen' }).click();
  await page.waitForFunction(async () => (await import('/src/store.ts')).fullText().includes('- Samstag backen'));
  assert.ok(!(await text()).includes('```ai'), 'the accepted summary is plain Markdown');
  // /todos: the same quick start, with its own prompt.
  await slash('todos', 'To-dos herausziehen');
  await page.waitForFunction(() => window.__ai.requests.length === 2);
  const todos = await page.evaluate(() => window.__ai.requests[1]);
  assert.match(todos.messages.at(-1).content, /Sammle alle To-dos/);
  assert.ok(todos.context.includes('Punkte-Abstimmung'), 'the current note is the context');
  await page.getByRole('button', { name: '✓ Übernehmen' }).waitFor();
  await page.screenshot({ path: 'release/THE Note-slash-blocks-preview.png' });

  // 4. Teilen: print and export from the note toolbar; HTML lands next to the note and says where.
  await page.evaluate(async () => { const s = await import('/src/store.ts'); s.setFilePath('/Users/demo/Notizen/Wochenende.md'); });
  await page.getByRole('button', { name: /Teilen/ }).click();
  const share = page.getByRole('menu', { name: 'Drucken und exportieren' });
  assert.deepEqual(await share.getByRole('menuitem').allInnerTexts().then(t => t.map(x => x.split('\n')[0])), ['⎙ Drucken …', 'Als PDF', 'Als HTML', 'Als Word (.docx)']);
  await share.getByRole('menuitem', { name: /Als HTML/ }).click();
  await page.getByRole('dialog', { name: 'Als HTML exportieren' }).getByRole('button', { name: 'Exportieren …' }).click();
  await page.waitForFunction(() => window.__written?.some(p => p.endsWith('.html')));
  assert.equal(await page.evaluate(() => window.__saveDialog), '/Users/demo/Notizen/Wochenende.html', 'the save dialog starts next to the note');
  const toast = page.getByRole('status').filter({ hasText: 'Exportiert: Wochenende.html' });
  await toast.waitFor();
  assert.match(await toast.innerText(), /\/Users\/demo\/Notizen\/Wochenende\.html/);
  await toast.getByRole('button', { name: 'Im Finder zeigen' }).click();
  await page.waitForFunction(() => window.__revealed === '/Users/demo/Notizen/Wochenende.html');
  // 5. The Moderationskoffer template holds every method.
  await page.getByRole('button', { name: 'Neue Notiz aus Vorlage' }).click();
  await page.getByRole('menuitem', { name: /Moderationskoffer/ }).click();
  await page.getByRole('heading', { name: 'Der Moderationskoffer' }).waitFor();
  const kit = await text();
  for (const heading of ['Check-in-Frage', 'Reihenfolge auslosen', 'Timebox', 'Crazy 8s', 'Punkte-Abstimmung', 'Lean Coffee', '5 × Warum', 'Retrospektive', 'Rose · Knospe · Dorn', 'ROTI']) assert.ok(kit.includes(heading), heading);
  assert.deepEqual(errors, []);
  console.log('PASS slash blocks: template menu in the tab bar, breathing/focus/decision/oracle/git blocks inserted in place (computed matrix, one-step undo), moderation methods (dot voting, ROTI, retro, Crazy 8s, Moderationskoffer template), /zusammenfassen and /todos run with the note as context, Teilen menu exports HTML next to the note with a reveal notice. Native IPC and provider mocked.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
