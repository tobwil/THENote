import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
const root = resolve('dist-site');
import { stat } from 'node:fs/promises';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.sh': 'text/plain', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/THENote/')) throw new Error('Incorrect base path');
    let path = resolve(root, url.pathname.slice('/THENote/'.length) || 'index.html');
    if (path !== root && !path.startsWith(root + '/')) throw new Error('Invalid path');
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    res.setHeader('Content-Type', types[extname(path)] || 'text/plain'); res.end(await readFile(path));
  } catch { res.writeHead(404); res.end('Not found'); }
});
let browser;
try {
  await new Promise(resolve => server.listen(1454, '127.0.0.1', resolve));
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
  // Reduced motion skips the self-typing intro so the test drives the window alone.
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const failed = []; page.on('response', r => { if (r.status() >= 400) failed.push(r.url()); });
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { async writeText(text) { window.__copied = text; } } }); });
  await page.goto('http://127.0.0.1:1454/THENote/');
  await page.getByRole('heading', { name: 'Schreiben. Denken. Ausprobieren.' }).waitFor();
  for (const width of [1440, 820, 375]) {
    await page.setViewportSize({ width, height: 1050 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}`);
    await page.getByRole('tab', { name: 'curl', exact: true }).click();
    await page.getByRole('button', { name: 'Kopieren' }).filter({ visible: true }).click();
    assert.equal(await page.evaluate(() => window.__copied), 'curl -fsSL https://tobwil.github.io/THENote/install.sh | bash');
    await page.getByRole('tab', { name: 'curl', exact: true }).press('ArrowLeft');
    assert.equal(await page.getByRole('tab', { name: 'Homebrew', exact: true }).getAttribute('aria-selected'), 'true');
    assert.equal(await page.getByRole('tab', { name: 'Homebrew', exact: true }).evaluate(el => el === document.activeElement), true);
    await page.getByRole('button', { name: 'Kopieren' }).filter({ visible: true }).click();
    assert.match(await page.evaluate(() => window.__copied), /brew trust --cask tobwil\/thenote\/the-note/);
    await page.screenshot({ path: join(tmpdir(), `the-note-site-${width}.png`), fullPage: true });
  }
  // Clipboard failure falls back to a selected command and an accessible hint.
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Denied'); }; });
  await page.getByRole('button', { name: 'Kopieren' }).filter({ visible: true }).click();
  assert.match(await page.getByRole('status').innerText(), /Befehl markiert/);
  const d = JSON.parse(await readFile('distribution.json', 'utf8'));
  assert.equal(await page.getByRole('link', { name: 'Alternativ als ZIP' }).getAttribute('href'), `https://github.com/${d.repository}/releases/download/v${d.version}/${d.asset}`);
  assert.equal(await page.getByRole('link', { name: 'Im Browser ausprobieren', exact: true }).getAttribute('href'), 'app/', 'hero links the browser version');
  assert.equal(await page.getByRole('link', { name: 'Ohne Installation: im Browser ausprobieren ↗' }).getAttribute('href'), 'app/');
  assert.equal(await page.getByRole('link', { name: 'DMG für macOS herunterladen' }).getAttribute('href'), `https://github.com/${d.repository}/releases/download/v${d.version}/${d.dmg.asset}`);
  for (const path of ['install.sh', 'assets/inline-ai.png', 'assets/folders-and-date.png', 'assets/gallery.png', 'assets/unsaved-diff.png', 'assets/note-light.png', 'assets/note-dark.png', 'assets/the-note.svg', 'fonts/inter-latin-400-normal.woff2', 'sitemap.xml', 'en/']) assert.equal((await page.request.get('http://127.0.0.1:1454/THENote/' + path)).status(), 200);

  // The notebook window: live Markdown, tasks, sidebar, theme and a small runnable block.
  await page.setViewportSize({ width: 1440, height: 1050 });
  const app = page.locator('[data-app]');
  await app.getByRole('heading', { name: 'Lissabon im Mai' }).waitFor();
  await app.getByText(/Vier Tage, drei Leute/).click();
  const source = app.locator('textarea');
  assert.match(await source.inputValue(), /^Vier Tage, drei Leute/);
  await source.press('End'); await source.type(' Mit Fähre.'); await source.press('Escape');
  await app.getByText(/Mit Fähre\./).waitFor();
  assert.match(await app.locator('[data-status-saved]').innerText(), /Ungespeichert/);
  const sintra = app.getByRole('checkbox', { name: /Sintra/ });
  assert.equal(await sintra.getAttribute('aria-checked'), 'false');
  await sintra.click();
  assert.equal(await app.getByRole('checkbox', { name: /Sintra/ }).getAttribute('aria-checked'), 'true');
  await app.getByRole('button', { name: /Ausführen/ }).click();
  await app.locator('.run-output').getByText(/Gesamt 1320 € · pro Person 440 €/).waitFor();
  await app.locator('.code-cell > pre').click();
  await app.locator('textarea').fill((await app.locator('textarea').inputValue()).replace('"Flüge": 420', '"Flüge": 480'));
  await app.locator('textarea').press('Escape');
  await app.getByRole('button', { name: /Ausführen/ }).click();
  await app.locator('.run-output').getByText(/Gesamt 1380 € · pro Person 460 €/).waitFor();
  await app.getByRole('button', { name: 'Hell oder dunkel' }).click();
  assert.equal(await app.getAttribute('data-theme'), 'dark');
  await app.getByRole('button', { name: /Packliste\.md/ }).click();
  await app.getByRole('heading', { name: 'Packliste' }).waitFor();
  assert.equal(await app.locator('[data-tab]').innerText(), 'Packliste.md');

  // English page: own copy, own canonical URL, links back to German.
  await page.goto('http://127.0.0.1:1454/THENote/en/');
  await page.getByRole('heading', { name: 'Write. Think. Try it.' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  assert.equal(await page.getByRole('link', { name: 'Try it in the browser', exact: true }).getAttribute('href'), '../app/', 'English page links the same browser version');
  assert.equal(await page.getByRole('link', { name: 'Download DMG for macOS' }).getAttribute('href'), `https://github.com/${d.repository}/releases/download/v${d.version}/${d.dmg.asset}`);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), d.site + 'en/');
  assert.equal(await page.getByRole('link', { name: 'EN', exact: true }).getAttribute('aria-current'), 'page');
  await page.getByRole('button', { name: 'Copy', exact: false }).filter({ visible: true }).click();
  assert.match(await page.getByRole('status').innerText(), /Copied/);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1050 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow on /en/ at ${width}`);
  }
  await page.locator('[data-app]').getByRole('heading', { name: 'Lisbon in May' }).waitFor();
  assert.match(await page.locator('.code-cell > pre').innerText(), /^costs = \{/);
  await page.locator('[data-app]').getByRole('button', { name: /Run/ }).click();
  await page.locator('.run-output').getByText(/Total 1320 € · per person 440 €/).waitFor();
  assert.deepEqual(errors, []); assert.deepEqual(failed, []);
  console.log('PASS website: German and English pages, subpath assets, mobile/tablet/desktop layout, keyboard tabs, copy and fallback, interactive notebook window (live Markdown, tasks, run, theme, sidebar), release link and installer.');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
