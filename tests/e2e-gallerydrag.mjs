/**
 * Dragging pictures into galleries: a picture from a text paragraph or from its
 * own block moves into a gallery where it is dropped, galleries reorder by
 * dragging, Esc cancels, a click still opens the viewer, and image files
 * (Finder) join the gallery they are dropped on. Native layer mocked.
 *
 *   node tests/e2e-gallerydrag.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import { chromium } from 'playwright';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1462', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
function png(width, height, [r, g, b]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xffffffff; for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]); };
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3).map((_, i) => [r, g, b][i % 3])]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
}
const COLORS = { a: [233, 120, 110], b: [92, 160, 120], c: [90, 130, 210], d: [230, 190, 80], e: [150, 100, 200] };
const PNGS = Object.fromEntries(Object.entries(COLORS).map(([k, c]) => [k, png(200, 200, c)]));
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Vite startup timeout')), 20000); server.stdout.on('data', d => { if (String(d).includes('Local:')) { clearTimeout(timer); resolve(); } }); server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); }); });
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript((pngs) => {
    window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } }, transformCallback() { return 1; }, unregisterCallback() {},
      convertFileSrc(path) { const key = path.match(/\/(\w)\.png$/)?.[1]; return key && pngs[key] ? `data:image/png;base64,${pngs[key]}` : path; },
      async invoke(cmd) {
        if (cmd === 'load_settings') return {};
        if (cmd === 'list_shadows' || cmd === 'list_fonts' || cmd === 'list_dir') return [];
        if (cmd === 'path_exists') return true;
        if (cmd === 'ai_status') return { config: { enabled: false, endpoint: '', protocol: 'chat-completions', model: '', maxTokens: 4096, rememberKey: false }, hasKey: false, keychainAvailable: true };
        return null;
      } };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
  }, PNGS);
  await page.goto('http://127.0.0.1:1462');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  await page.evaluate(async () => { (await import('/src/store.ts')).openDocument('# Urlaub\n\n![](p/a.png)\n![](p/b.png)\n\nEin Bild ![](p/c.png) im Text\n\n![](p/d.png)\n', '/n/Urlaub.md'); });
  const gallery = page.locator('.img-gallery');
  await gallery.waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.rendered img')].every(img => img.naturalWidth === 200));
  const blocks = () => page.evaluate(async () => (await import('/src/store.ts')).doc.blocks.map(b => b.text));
  // Tag pictures by colour key so they can be found after re-renders.
  const tag = () => page.evaluate((pngs) => { for (const el of document.querySelectorAll('.rendered img')) { const key = Object.keys(pngs).find(k => el.src.includes(pngs[k].slice(-40))); if (key) el.dataset.k = key; } }, PNGS);
  const box = async name => { await tag(); return page.locator(`.rendered img[data-k="${name}"]`).boundingBox(); };
  const drag = async (name, to, { drop = true } = {}) => {
    const from = await box(name);
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2); await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 3 });
    await page.mouse.move(to.x, to.y, { steps: 10 });
    if (drop) await page.mouse.up();
  };

  // 1. A picture in a text paragraph → left half of the gallery's second picture: it lands before it.
  const b = await box('b');
  await drag('c', { x: b.x + 20, y: b.y + b.height / 2 }, { drop: false });
  assert.ok(await gallery.evaluate(el => el.classList.contains('img-drop-target')), 'the gallery lights up');
  assert.ok(await page.locator('.rendered img[data-k="b"]').evaluate(el => el.classList.contains('img-drop-before')), 'a bar marks where it lands');
  assert.equal(await page.locator('.img-drag-ghost.has-target').count(), 1);
  await page.mouse.up();
  assert.deepEqual(await blocks(), ['# Urlaub', '![](p/a.png)\n![](p/c.png)\n![](p/b.png)', 'Ein Bild im Text', '![](p/d.png)']);
  assert.equal(await page.locator('.block.active').count(), 0, 'dropping does not open any Markdown source');

  // 2. A picture in its own block → onto the gallery (its switch row): appended, the empty block goes away.
  await page.locator('.img-gallery-toggle').scrollIntoViewIfNeeded();
  const row = await page.locator('.img-gallery-toggle').boundingBox();
  await drag('d', { x: row.x - 80, y: row.y + row.height / 2 });
  assert.deepEqual(await blocks(), ['# Urlaub', '![](p/a.png)\n![](p/c.png)\n![](p/b.png)\n![](p/d.png)', 'Ein Bild im Text']);

  // 3. Reorder inside the gallery: a → right half of c; undo restores in one step.
  await page.locator('.img-gallery-track').evaluate(el => { el.style.scrollBehavior = 'auto'; el.scrollLeft = 0; });
  const c = await box('c');
  await drag('a', { x: c.x + c.width - 20, y: c.y + c.height / 2 });
  assert.equal((await blocks())[1], '![](p/c.png)\n![](p/a.png)\n![](p/b.png)\n![](p/d.png)');
  await page.evaluate(async () => (await import('/src/store.ts')).undo());
  assert.equal((await blocks())[1], '![](p/a.png)\n![](p/c.png)\n![](p/b.png)\n![](p/d.png)', 'one undo step');

  // 4. Esc cancels; a plain click still opens the viewer; text blocks are no target.
  await page.locator('.img-gallery-track').evaluate(el => { el.scrollLeft = 0; });
  const t = await page.getByText('Ein Bild im Text').boundingBox();
  await drag('a', { x: t.x + 20, y: t.y + t.height / 2 }, { drop: false });
  assert.equal(await page.locator('.img-drop-target').count(), 0, 'a text paragraph is not a gallery');
  await page.keyboard.press('Escape'); await page.mouse.up();
  assert.equal(await page.locator('.img-drag-ghost').count(), 0);
  assert.equal((await blocks())[1], '![](p/a.png)\n![](p/c.png)\n![](p/b.png)\n![](p/d.png)', 'Esc leaves everything in place');
  await page.waitForTimeout(450);
  await page.locator('.rendered img[data-k="a"]').click();
  await page.getByRole('dialog', { name: 'Bildansicht' }).waitFor();
  await page.keyboard.press('Escape');

  // 5. Files from Finder dropped onto a gallery join it at the drop point.
  const added = await page.evaluate(async () => {
    const { imageDropTarget } = await import('/src/imagedrag.ts');
    const { addImagesToGallery } = await import('/src/commands.ts');
    const first = document.querySelector('.rendered img[data-k="a"]').getBoundingClientRect();
    const target = imageDropTarget(first.left + first.width - 10, first.top + first.height / 2);
    await addImagesToGallery(target.blockId, target.before, ['/n/p/e.png']);
    return (await import('/src/store.ts')).doc.blocks[1].text;
  });
  assert.equal(added, '![](p/a.png)\n![](p/e.png)\n![](p/c.png)\n![](p/b.png)\n![](p/d.png)');
  await page.screenshot({ path: 'release/THE Note-gallery-drag-preview.png' });
  assert.deepEqual(errors, []);
  console.log('PASS gallery drag: text picture and single-picture block into a gallery at the drop point, reorder with one-step undo, Esc cancels, click still opens the viewer, Finder files join the gallery. Native IPC mocked.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
