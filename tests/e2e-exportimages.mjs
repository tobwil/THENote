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
  const options = page.getByRole('dialog', { name: 'Als HTML exportieren' });
  assert.match(await options.innerText(), /6 Bilder werden in die Datei eingebettet/);
  assert.ok(await options.getByLabel(/Bilder mitnehmen/).isChecked() && await options.getByLabel(/Inhaltsverzeichnis/).isChecked(), 'pictures and outline are on by default');
  await options.getByRole('button', { name: 'Exportieren …' }).click();
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
  const pdfOptions = page.getByRole('dialog', { name: 'Als PDF exportieren' });
  assert.equal(await pdfOptions.getByLabel(/Inhaltsverzeichnis/).count(), 0, 'no outline option for PDF');
  await pdfOptions.getByRole('button', { name: 'Exportieren …' }).click();
  await page.waitForFunction(() => window.__export.files.has('/notes/Day1.pdf'));
  const pdf = await page.evaluate(() => window.__export.files.get('/notes/Day1.pdf'));
  assert.ok(!pdf.includes('asset://') && pdf.includes('data:image/png;base64,'), 'PDF source embeds the pictures');

  // Word via Pandoc: relative pictures are found next to the note.
  await share(/Als Word/);
  await page.getByRole('dialog', { name: 'Als Word exportieren' }).getByRole('button', { name: 'Exportieren …' }).click();
  await page.waitForFunction(() => !!window.__export.pandoc);
  assert.ok((await page.evaluate(() => window.__export.pandoc.flags)).includes('--resource-path=/notes'));
  assert.match(await page.evaluate(() => window.__export.pandoc.markdown), /!\[\]\(assets\/a\.png\)/);

  // Without pictures: HTML and Word carry only the text; the choice is remembered.
  await page.evaluate(() => { window.__export.files.clear(); window.__export.pandoc = null; window.__export.calls.length = 0; });
  await share(/Als HTML/);
  const again = page.getByRole('dialog', { name: 'Als HTML exportieren' });
  await again.getByLabel(/Bilder mitnehmen/).uncheck();
  await again.getByRole('button', { name: 'Exportieren …' }).click();
  await page.waitForFunction(() => window.__export.files.has('/notes/Day1.html'));
  const plain = await page.evaluate(() => window.__export.files.get('/notes/Day1.html'));
  assert.ok(!/<img\b/.test(plain) && !plain.includes('img-gallery"'), 'no pictures, no empty gallery');
  assert.match(plain, /Ein Bild fehlt:/, 'the text stays');
  assert.equal(await page.evaluate(() => window.__export.calls.filter(([c]) => c === 'read_image_data_url').length), 0, 'no picture is read');
  await share(/Als Word/);
  const word = page.getByRole('dialog', { name: 'Als Word exportieren' });
  assert.equal(await word.getByLabel(/Bilder mitnehmen/).isChecked(), false, 'the last choice is remembered');
  await word.getByRole('button', { name: 'Exportieren …' }).click();
  await page.waitForFunction(() => !!window.__export.pandoc);
  const md = await page.evaluate(() => window.__export.pandoc.markdown);
  assert.ok(!md.includes('![') && !/<img/.test(md), 'Word gets the text without pictures');
  assert.match(md, /^# Day 1\n\nEin Bild fehlt:\n\nUnd eins aus dem Netz:\n$/);

  // Rules: code blocks keep image syntax, linked pictures leave no empty link, hard breaks survive.
  const rules = await page.evaluate(async () => {
    const { stripImages } = await import('/src/gallerytext.ts');
    return [
      stripImages('Text  \nmit Umbruch\n\n```md\n![](a.png)\n\n![](b.png)\n```\n\n[![](c.png)](https://x.de) danach\n'),
    ];
  });
  assert.equal(rules[0], 'Text  \nmit Umbruch\n\n```md\n![](a.png)\n\n![](b.png)\n```\n\ndanach\n');
  assert.deepEqual(errors, []);
  console.log('PASS export pictures: HTML and PDF embed local images (gallery as grid, remote kept, missing keeps path, files read once, editor links untouched), Word gets the resource path; export options: with or without pictures (remembered), outline for HTML. Native IPC mocked.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
