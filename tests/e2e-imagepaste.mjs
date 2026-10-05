/**
 * Pasting images from the clipboard: real Vite dev server, real Chromium,
 * synthetic paste events carrying a PNG. The native layer is mocked, so the
 * test sees exactly which file the app asks to write and which link it inserts.
 *
 *   node tests/e2e-imagepaste.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1459', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
// A 1×1 PNG.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const paste = (page, target, { plain = '', html = '', name = 'image.png' } = {}) => page.evaluate(({ target, png, plain, html, name }) => {
  const bytes = Uint8Array.from(atob(png), c => c.charCodeAt(0));
  const data = new DataTransfer();
  data.items.add(new File([bytes], name, { type: 'image/png' }));
  if (plain) data.setData('text/plain', plain);
  if (html) data.setData('text/html', html);
  document.querySelector(target).dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
}, { target, png: PNG, plain, html, name });
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Vite startup timeout')), 20000); server.stdout.on('data', d => { if (String(d).includes('Local:')) { clearTimeout(timer); resolve(); } }); server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); }); });
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }

  // --- Desktop app (native layer mocked) ---
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    const writes = []; window.__paste = { writes };
    window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } }, transformCallback() { return 1; }, unregisterCallback() {}, convertFileSrc(path) { return path; }, async invoke(cmd, args) {
      if (cmd === 'load_settings') return {};
      if (cmd === 'list_shadows' || cmd === 'list_fonts') return [];
      if (cmd === 'list_dir') return [];
      if (cmd === 'path_exists') return true;
      if (cmd === 'save_image_data') { writes.push(args); return `${args.subfolder}/${args.name}`; }
      if (cmd === 'ai_status') return { config: { enabled: false, endpoint: '', protocol: 'chat-completions', model: '', maxTokens: 4096, rememberKey: false }, hasKey: false, keychainAvailable: true };
      return null;
    } };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
  });
  await page.goto('http://127.0.0.1:1459');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  const source = () => page.evaluate(async () => (await import('/src/store.ts')).fullText());

  // 1. Saved note: the image goes into its assets folder, linked relatively.
  await page.evaluate(async () => { (await import('/src/store.ts')).openDocument('Rezept\n', '/notes/Kuchen.md'); });
  await page.locator('.block .rendered').first().click();
  await page.locator('.block.active .source').press('End');
  await paste(page, '.block.active .source');
  await page.waitForFunction(() => window.__paste.writes.length === 1);
  const first = await page.evaluate(() => window.__paste.writes[0]);
  assert.equal(first.docDir, '/notes'); assert.equal(first.subfolder, 'assets');
  assert.match(first.name, /^Bild-\d{4}-\d{2}-\d{2}-\d{6}\.png$/, 'clipboard images get a dated name');
  assert.ok(first.data.length > 20, 'image bytes are sent');
  assert.match(await source(), new RegExp(`Rezept!\\[\\]\\(assets/${first.name.replace(/\./g, '\\.')}\\)`), 'relative link at the caret');

  // 2. A copied Finder file keeps its name; copy-images-to in front matter wins.
  await page.evaluate(async () => { (await import('/src/store.ts')).openDocument('---\ncopy-images-to: bilder/${filename}\n---\n\nText\n', '/notes/Reise.md'); });
  await page.locator('.block .rendered').last().click();
  await paste(page, '.block.active .source', { plain: 'Strand.png', name: 'Strand.png' });
  await page.waitForFunction(() => window.__paste.writes.length === 2);
  assert.deepEqual(await page.evaluate(() => { const w = window.__paste.writes[1]; return [w.subfolder, w.name]; }), ['bilder/Reise', 'Strand.png']);
  assert.match(await source(), /!\[\]\(bilder\/Reise\/Strand\.png\)/);

  // 3. Excel/Word: text plus a picture of it pastes as text, writes no image.
  await paste(page, '.block.active .source', { plain: 'Posten\tBetrag', html: '<table><tr><td>Posten</td><td>Betrag</td></tr></table>' });
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__paste.writes.length), 2, 'text clipboards are not saved as images');
  assert.match(await source(), /Posten/);

  // 4. Source mode: the link lands at the textarea caret.
  await page.evaluate(async () => { (await import('/src/store.ts')).openDocument('Anfang Ende', '/notes/Quelle.md'); });
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  await page.locator('.source-full').evaluate(el => { el.focus(); el.setSelectionRange(7, 7); });
  await paste(page, '.source-full');
  await page.waitForFunction(() => window.__paste.writes.length === 3);
  assert.match(await page.locator('.source-full').inputValue(), /^Anfang !\[\]\(assets\/Bild-[\d-]+\.png\)Ende/);
  await page.getByRole('button', { name: 'Live', exact: true }).click();

  // 5. Unsaved note: stored in the notes folder's assets, linked by full path.
  await page.evaluate(async () => { const s = await import('/src/store.ts'); s.setFolderPath('/notes'); s.setFolderName('notes'); s.openDocument('', null); });
  await page.locator('.block').first().click();
  await paste(page, '.block.active .source');
  await page.waitForFunction(() => window.__paste.writes.length === 4);
  assert.equal(await page.evaluate(() => window.__paste.writes[3].docDir), '/notes');
  assert.match(await source(), /!\[\]\(\/notes\/assets\/Bild-[\d-]+\.png\)/);
  assert.deepEqual(errors, []);
  await page.close();

  // --- Browser editor: no file system, so the image is embedded. ---
  const web = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await web.goto('http://127.0.0.1:1459');
  await web.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  await web.evaluate(async () => { (await import('/src/store.ts')).openDocument('', null); });
  await web.locator('.block').first().click();
  await paste(web, '.block.active .source');
  await web.waitForFunction(async () => /data:image\/png;base64,/.test((await import('/src/store.ts')).fullText()));
  console.log('PASS image paste: saved note (assets, dated name), Finder file name and copy-images-to, text wins over pictures, source-mode caret, unsaved note in notes folder, browser data URL. Native IPC mocked.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
