/**
 * Exports carry their pictures: HTML and PDF embed local images as data: URLs
 * (the app's asset:// links only work inside the app), galleries become a tile
 * grid, remote images stay links, a missing file keeps its relative path, and
 * Pandoc (Word) gets the note's folder as resource path. Native layer mocked.
 *
 *   node tests/e2e-exportimages.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1471', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Vite startup timeout')), 20000); server.stdout.on('data', d => { if (String(d).includes('Local:')) { clearTimeout(timer); resolve(); } }); server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); }); });
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript((png) => {
    const calls = []; window.__export = { calls, files: new Map() };
    window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } }, transformCallback() { return 1; }, unregisterCallback() {},
      // Like Tauri: an app-only URL the exported file could never load.
      convertFileSrc(path) { return 'asset://localhost/' + encodeURIComponent(path); },
      async invoke(cmd, args) {
        calls.push([cmd, args]);
        if (cmd === 'load_settings') return {};
        if (cmd === 'list_shadows' || cmd === 'list_fonts' || cmd === 'list_dir') return [];
        if (cmd === 'path_exists') return true;
        if (cmd === 'read_image_data_url') { if (args.path.startsWith('/notes/assets/') && !args.path.includes('missing')) return `data:image/png;base64,${png}`; throw 'Bild nicht gefunden'; }
        if (cmd === 'plugin:dialog|save') return args.options.defaultPath;
        if (cmd === 'save_file') { window.__export.files.set(args.path, args.contents); return; }
        if (cmd === 'export_pdf') { window.__export.files.set(args.output, args.html); return; }
        if (cmd === 'has_pandoc') return true;
        if (cmd === 'pandoc_export') { window.__export.pandoc = args; return; }
        return null;
      } };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
  }, PNG);
  await page.goto('http://127.0.0.1:1471');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  await page.evaluate(async () => {
    (await import('/src/store.ts')).openDocument('# Day 1\n\n![](assets/a.png)\n![](assets/b.png)\n![](<assets/mit leer.png>)\n\nEin Bild fehlt: ![](assets/missing.png)\n\nUnd eins aus dem Netz: ![](https://example.com/x.png)\n\n<img src="assets/a.png" width="200">\n', '/notes/Day1.md');
  });
  await page.locator('.img-gallery').waitFor();
  const share = async (item) => {
    await page.getByRole('button', { name: /Teilen/ }).click();
    await page.getByRole('menu', { name: 'Drucken und exportieren' }).getByRole('menuitem', { name: item }).click();
  };

  // HTML: every local picture embedded, nothing points at asset://.
  await share(/Als HTML/);
  await page.getByRole('dialog', { name: 'Export HTML' }).getByRole('button', { name: 'With outline' }).click();
  await page.waitForFunction(() => window.__export.files.has('/notes/Day1.html'));
  const html = await page.evaluate(() => window.__export.files.get('/notes/Day1.html'));
  assert.ok(!html.includes('asset://'), 'no app-only links in the export');
  assert.equal(html.match(/src="data:image\/png;base64,/g)?.length, 4, 'gallery pictures and the HTML <img> are embedded');
  assert.match(html, /src="assets\/missing\.png"/, 'a missing file keeps its relative path');
  assert.match(html, /src="https:\/\/example\.com\/x\.png"/, 'remote pictures stay links');
  assert.match(html, /class="img-gallery"/);
  assert.match(html, /\.rendered \.img-gallery-track \{ display: grid;/, 'galleries print as a tile grid');
  assert.equal(await page.evaluate(() => window.__export.calls.filter(([c]) => c === 'read_image_data_url').length), 4, 'each file is read once (a.png twice in the note)');
  // The editor keeps its own asset:// links after the export.
  assert.match(await page.locator('.img-gallery img').first().getAttribute('src'), /^asset:\/\//);

  // PDF: the print HTML embeds the pictures too.
  await share(/Als PDF/);
  await page.waitForFunction(() => window.__export.files.has('/notes/Day1.pdf'));
  const pdf = await page.evaluate(() => window.__export.files.get('/notes/Day1.pdf'));
  assert.ok(!pdf.includes('asset://') && pdf.includes('data:image/png;base64,'), 'PDF source embeds the pictures');

  // Word via Pandoc: relative pictures are found next to the note.
  await share(/Als Word/);
  await page.waitForFunction(() => !!window.__export.pandoc);
  assert.ok((await page.evaluate(() => window.__export.pandoc.flags)).includes('--resource-path=/notes'));
  assert.deepEqual(errors, []);
  console.log('PASS export pictures: HTML and PDF embed local images (gallery as grid, remote kept, missing keeps path, files read once, editor links untouched), Word gets the resource path. Native IPC mocked.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
