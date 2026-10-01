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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
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
  assert.equal(await page.getByRole('link', { name: 'ZIP direkt herunterladen' }).getAttribute('href'), `https://github.com/${d.repository}/releases/download/v${d.version}/${d.asset}`);
  for (const path of ['install.sh', 'assets/inline-ai.png', 'assets/projects-and-date.png', 'assets/unsaved-diff.png', 'assets/note-light.png', 'assets/note-dark.png', 'assets/the-note.svg', 'fonts/inter-latin-400-normal.woff2', 'sitemap.xml', 'en/']) assert.equal((await page.request.get('http://127.0.0.1:1454/THENote/' + path)).status(), 200);

  // The live cell shows a small note around one runnable block; runs can be stopped.
  await page.setViewportSize({ width: 1440, height: 1050 });
  assert.match(await page.locator('[data-note]').innerText(), /Lissabon im Mai/);
  await page.locator('[data-run]').click();
  await page.waitForFunction(() => /Erfolgreich/.test(document.querySelector('[data-status]').textContent), null, { timeout: 10000 });
  assert.match(await page.locator('[data-output]').innerText(), /Gesamt 1320 € · pro Person 440 €/);
  await page.getByRole('button', { name: /Wochenrückblick/ }).click();
  assert.match(await page.locator('[data-note]').innerText(), /Woche 40/);
  await page.locator('[data-run]').click();
  await page.waitForFunction(() => /Erfolgreich/.test(document.querySelector('[data-status]').textContent), null, { timeout: 10000 });
  assert.match(await page.locator('[data-output]').innerText(), /60% erledigt/);
  await page.getByRole('button', { name: /Würfelorakel/ }).click();
  await page.locator('[data-run]').click();
  await page.locator('[data-run]').click();
  assert.match(await page.locator('[data-status]').innerText(), /Gestoppt/);
  // Day/night preview swaps the same note's screenshot.
  await page.getByRole('button', { name: /Nacht/ }).click();
  assert.equal(await page.locator('[data-stage]').evaluate(el => el.classList.contains('is-dark')), true);

  // English page: own copy, own canonical URL, links back to German.
  await page.goto('http://127.0.0.1:1454/THENote/en/');
  await page.getByRole('heading', { name: 'Write. Think. Try it.' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), d.site + 'en/');
  assert.equal(await page.getByRole('link', { name: 'EN', exact: true }).getAttribute('aria-current'), 'page');
  await page.getByRole('button', { name: 'Copy', exact: false }).filter({ visible: true }).click();
  assert.match(await page.getByRole('status').innerText(), /Copied/);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1050 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow on /en/ at ${width}`);
  }
  await page.locator('[data-run]').click();
  await page.waitForFunction(() => /Succeeded/.test(document.querySelector('[data-status]').textContent), null, { timeout: 10000 });
  assert.match(await page.locator('[data-output]').innerText(), /Total 1320 € · per person 440 €/);
  assert.match(await page.locator('[data-code]').innerText(), /^costs = \{/);
  assert.deepEqual(errors, []); assert.deepEqual(failed, []);
  console.log('PASS website: German and English pages, subpath assets, mobile/tablet/desktop layout, keyboard tabs, copy and fallback, live note cell, day/night preview, release link and installer.');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
