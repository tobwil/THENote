/**
 * The browser version on GitHub Pages: dist-site/app/ (scripts/build-web-app.mjs)
 * served under the Pages base path /THENote/, reached from the website's link.
 * It must load without failed requests, edit, render diagrams and save by
 * downloading the note.
 *
 *   npm run test:webapp
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { chromium } from 'playwright';
const root = resolve('dist-site');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/THENote/')) throw new Error('Incorrect base path');
    let path = resolve(root, decodeURIComponent(url.pathname.slice('/THENote/'.length)) || 'index.html');
    if (path !== root && !path.startsWith(root + '/')) throw new Error('Invalid path');
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream'); res.end(await readFile(path));
  } catch { res.writeHead(404); res.end('Not found'); }
});
let browser;
try {
  await new Promise(done => server.listen(1464, '127.0.0.1', done));
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce', acceptDownloads: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const failed = []; page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  await page.goto('http://127.0.0.1:1464/THENote/');
  await page.getByRole('link', { name: 'Im Browser ausprobieren', exact: true }).click();
  await page.waitForURL('http://127.0.0.1:1464/THENote/app/');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor({ timeout: 20000 });

  // Write a note with a diagram and a formula table; it renders like in the desktop app.
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  await page.locator('.source-full').fill('# Einkauf\n\n| Posten | Betrag |\n| --- | --- |\n| Brot | 3 |\n| Käse | 4 |\n| Summe | =SUMME(B2:B3) |\n\n```mermaid\ngraph LR\n  A[Liste] --> B[Laden]\n```\n');
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.getByRole('heading', { name: 'Einkauf' }).waitFor();
  await page.locator('.mermaid-block svg').waitFor({ timeout: 20000 });
  assert.match(await page.locator('.rendered table').innerText(), /Summe\s+7/);

  // Saving downloads the Markdown file.
  const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Control+s')]);
  assert.match(download.suggestedFilename(), /\.md$/);
  assert.match(await readFile(await download.path(), 'utf8'), /=SUMME\(B2:B3\)/);

  // The English page links the same app.
  await page.goto('http://127.0.0.1:1464/THENote/en/');
  assert.equal(await page.getByRole('link', { name: 'Try it in the browser', exact: true }).getAttribute('href'), '../app/');
  assert.deepEqual(failed, [], 'every app file loads under the Pages base path');
  assert.deepEqual(errors, []);
  console.log('PASS web app: built under /THENote/app/, reached from the website, edits, formula tables, Mermaid, saves by download, English link.');
} finally { await browser?.close(); server.close(); }
