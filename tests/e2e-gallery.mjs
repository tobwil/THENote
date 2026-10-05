/**
 * Folders and pictures: picture folders stay out of the sidebar, several images
 * in a row show as a gallery with a viewer, a moved note takes its pictures
 * along (shared ones are copied), "＋ Neuer Ordner …" in the move dialog, and
 * dragging a note onto a folder or onto a note inside it. Native layer mocked.
 *
 *   node tests/e2e-gallery.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { deflateSync } from 'node:zlib';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1460', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
// Screenshot-sized PNGs (640×400) in three colours, served as data URLs for the picture files.
function png(width, height, [r, g, b]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xffffffff; for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]); };
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3).map((_, i) => [r, g, b][i % 3])]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
}
const PNG = { a: png(640, 400, [233, 120, 110]), b: png(640, 400, [92, 160, 120]), c: png(640, 400, [90, 130, 210]) };
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Vite startup timeout')), 20000); server.stdout.on('data', d => { if (String(d).includes('Local:')) { clearTimeout(timer); resolve(); } }); server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); }); });
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript((png) => {
    const files = new Map([
      ['/n/Day1.md', 'Tag 1\n\n![](assets/a.png)\n![](assets/b.png)\n![](/n/assets/c.png)\n'],
      ['/n/Andere.md', 'Logo: ![](assets/b.png)\n'],
      ['/n/Zwei.md', 'Zweite Notiz\n'],
    ]);
    const images = new Map([['/n/assets/a.png', png.a], ['/n/assets/b.png', png.b], ['/n/assets/c.png', png.c]]);
    const folders = new Set(['/n', '/n/assets']), calls = [];
    window.__fs = { files, images, folders, calls };
    const parent = p => p.slice(0, p.lastIndexOf('/'));
    const tree = path => [...folders].filter(p => p !== path && parent(p) === path).sort().map(p => ({ name: p.split('/').pop(), path: p, is_dir: true, children: tree(p) }))
      .concat([...files.keys()].filter(p => parent(p) === path).sort().map(p => ({ name: p.split('/').pop(), path: p, is_dir: false })));
    window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } }, transformCallback() { return 1; }, unregisterCallback() {},
      // Image files resolve to data URLs, so the gallery shows real pictures.
      convertFileSrc(path) { return images.has(path) ? `data:image/png;base64,${images.get(path)}` : path; },
      async invoke(cmd, args) {
        calls.push([cmd, args]);
        if (cmd === 'load_settings') return { workspace: '/n' };
        if (cmd === 'list_shadows' || cmd === 'list_fonts') return [];
        if (cmd === 'list_dir') return tree(args.path);
        if (cmd === 'path_exists') return files.has(args.path) || folders.has(args.path) || images.has(args.path);
        if (cmd === 'read_file_encoded') return { content: files.get(args.path), encoding: 'UTF-8', had_bom: false, lossy: false };
        if (cmd === 'save_file') { files.set(args.path, args.contents); return; }
        if (cmd === 'create_entry') { const path = `${args.parent}/${args.name}`; if (args.directory) folders.add(path); else files.set(path, ''); return path; }
        if (cmd === 'rename_file') { if (files.has(args.to)) throw 'Existiert bereits'; files.set(args.to, files.get(args.from)); files.delete(args.from); return; }
        if (cmd === 'search_in_folder') return [...files].filter(([p, text]) => p.startsWith(args.root + '/') && text.includes(args.query)).map(([path]) => ({ path, name: path.split('/').pop(), matches: [] }));
        if (cmd === 'relocate_images') return args.items.map(({ rel, copy }) => {
          const from = `${args.fromDir}/${rel}`, to = `${args.toDir}/${rel}`;
          if (!images.has(from)) return null;
          images.set(to, images.get(from)); if (!copy) images.delete(from);
          folders.add(parent(to));
          return rel;
        });
        if (cmd === 'ai_status') return { config: { enabled: false, endpoint: '', protocol: 'chat-completions', model: '', maxTokens: 4096, rememberKey: false }, hasKey: false, keychainAvailable: true };
        return null;
      } };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
  }, PNG);
  await page.goto('http://127.0.0.1:1460');
  await page.getByRole('treeitem', { name: 'Day1.md', exact: true }).waitFor();

  // 1. The picture folder is not a notes folder: it stays out of the sidebar.
  assert.equal(await page.getByRole('treeitem', { name: 'assets', exact: true }).count(), 0, 'assets/ is hidden');

  // 2. Several images in one paragraph render as a gallery; a click opens the viewer.
  await page.getByRole('treeitem', { name: 'Day1.md', exact: true }).click();
  const gallery = page.locator('.img-gallery');
  await gallery.waitFor();
  assert.equal(await gallery.locator('.img-gallery-track img').count(), 3);
  await page.waitForFunction(() => document.querySelector('.img-gallery')?.classList.contains('overflowing'));
  assert.equal(await gallery.locator('.img-gallery-count').innerText(), '1 / 3');
  await gallery.hover();
  await gallery.getByRole('button', { name: 'Nächstes Bild' }).click();
  await page.waitForFunction(() => document.querySelector('.img-gallery-count')?.textContent === '2 / 3');
  assert.equal(await page.locator('.block.active').count(), 0, 'the arrows do not open the Markdown source');
  await gallery.getByRole('button', { name: 'Vorheriges Bild' }).click();
  await page.waitForFunction(() => document.querySelector('.img-gallery-count')?.textContent === '1 / 3');
  await gallery.locator('.img-gallery-track img').nth(1).click();
  const viewer = page.getByRole('dialog', { name: 'Bildansicht' });
  await viewer.waitFor();
  assert.equal(await viewer.locator('.image-viewer-count').innerText(), '2 / 3');
  await page.keyboard.press('ArrowRight');
  assert.equal(await viewer.locator('.image-viewer-count').innerText(), '3 / 3');
  assert.equal(await viewer.locator('.image-viewer-thumbs button').count(), 3);
  await page.screenshot({ path: 'release/THE Note-viewer-preview.png' });
  await page.keyboard.press('Escape');
  await viewer.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.block.active').count(), 0, 'clicking a picture does not open the Markdown source');
  await gallery.hover(); await page.mouse.move(400, 260);
  await page.screenshot({ path: 'release/THE Note-gallery-preview.png' });

  // 3. "In Ordner verschieben … ▸ ＋ Neuer Ordner …": the note and its pictures move together.
  await page.getByRole('treeitem', { name: 'Day1.md', exact: true }).click({ button: 'right' });
  await page.getByText('In Ordner verschieben …', { exact: true }).click();
  await page.getByRole('dialog', { name: 'In Ordner verschieben' }).getByRole('button', { name: '＋ Neuer Ordner …' }).click();
  const naming = page.getByRole('dialog', { name: 'Neuer Ordner', exact: true });
  await naming.getByLabel('Name', { exact: true }).fill('Reise');
  await naming.getByRole('button', { name: 'Bestätigen' }).click();
  await naming.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => window.__fs.files.has('/n/Reise/Day1.md'));
  const state = await page.evaluate(() => ({ images: [...window.__fs.images.keys()].sort(), text: window.__fs.files.get('/n/Reise/Day1.md'), relocate: window.__fs.calls.find(c => c[0] === 'relocate_images')[1] }));
  assert.deepEqual(state.relocate.items, [{ rel: 'assets/a.png', copy: false }, { rel: 'assets/b.png', copy: true }, { rel: 'assets/c.png', copy: false }], 'b.png is shared with Andere.md, so it is copied');
  assert.equal(state.relocate.fromDir, '/n'); assert.equal(state.relocate.toDir, '/n/Reise');
  assert.deepEqual(state.images, ['/n/Reise/assets/a.png', '/n/Reise/assets/b.png', '/n/Reise/assets/c.png', '/n/assets/b.png']);
  assert.equal(state.text, 'Tag 1\n\n![](assets/a.png)\n![](assets/b.png)\n![](assets/c.png)\n', 'the absolute link became relative');
  assert.equal(await page.evaluate(async () => (await import('/src/store.ts')).doc.filePath), '/n/Reise/Day1.md', 'the open tab follows');
  await page.waitForFunction(() => [...document.querySelectorAll('.img-gallery-track img')].every(img => img.naturalWidth === 640), null, { timeout: 5000 });

  // 4. Drag a note onto a note inside a folder: it lands in that folder.
  const drag = async (name, onto) => {
    const from = await page.getByRole('treeitem', { name, exact: true }).boundingBox();
    const to = await page.getByRole('treeitem', { name: onto, exact: true }).boundingBox();
    await page.mouse.move(from.x + 20, from.y + from.height / 2); await page.mouse.down();
    await page.mouse.move(from.x + 30, from.y + from.height / 2 + 8, { steps: 3 });
    await page.mouse.move(to.x + 40, to.y + to.height / 2, { steps: 6 });
  };
  await page.getByRole('treeitem', { name: 'Day1.md', exact: true }).waitFor();
  await drag('Zwei.md', 'Day1.md');
  assert.match(await page.locator('.tree-drag-ghost').innerText(), /Zwei\.md → Reise/);
  assert.ok(await page.getByRole('treeitem', { name: 'Reise', exact: true }).evaluate(el => el.classList.contains('drop-target')), 'the folder of the hovered note lights up');
  await page.mouse.up();
  await page.waitForFunction(() => window.__fs.files.has('/n/Reise/Zwei.md'));

  // 5. Escape cancels a drag; dropping on the notes folder header moves back to the top.
  await drag('Zwei.md', 'Reise');
  await page.keyboard.press('Escape'); await page.mouse.up();
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => window.__fs.files.has('/n/Reise/Zwei.md')), 'Escape cancels the drag');
  const from = await page.getByRole('treeitem', { name: 'Zwei.md', exact: true }).boundingBox();
  const head = await page.locator('.side-ws-head').boundingBox();
  await page.mouse.move(from.x + 20, from.y + from.height / 2); await page.mouse.down();
  await page.mouse.move(head.x + 60, head.y + head.height / 2, { steps: 8 }); await page.mouse.up();
  await page.waitForFunction(() => window.__fs.files.has('/n/Zwei.md'));

  // 6. Rules behind it: what counts as a gallery, which pictures travel, how links are rewritten.
  const rules = await page.evaluate(async () => {
    const { renderMarkdown } = await import('/src/markdown.ts');
    const { imagesToCarry, rewriteImageSources } = await import('/src/imagecarry.ts');
    const gallery = md => renderMarkdown(md).includes('img-gallery');
    return {
      single: gallery('![](a.png)'), withText: gallery('Hier ![](a.png) ![](b.png)'), sideBySide: gallery('![](a.png) ![](b.png)'),
      html: gallery('![](b.png)\n<img src="a.png" width="200">'),
      carry: imagesToCarry('![](assets/a.png) ![](../x.png) ![](https://w.de/y.png) ![](<assets/mit leer.png>) ![](assets/a.png) [doc](assets/z.pdf) ![](/n/sub/b.jpg) ![](/n/notes.md)', '/n'),
      rewrite: rewriteImageSources('![A](/n/assets/c.png "T") <img src="/n/assets/c.png" width="9"> ![](keep.png)', new Map([['/n/assets/c.png', 'assets/c 1.png']])),
    };
  });
  assert.deepEqual([rules.single, rules.withText, rules.sideBySide, rules.html], [false, false, true, true]);
  assert.deepEqual(rules.carry, [{ src: 'assets/a.png', rel: 'assets/a.png' }, { src: 'assets/mit leer.png', rel: 'assets/mit leer.png' }, { src: '/n/sub/b.jpg', rel: 'sub/b.jpg' }]);
  assert.equal(rules.rewrite, '![A](<assets/c 1.png> "T") <img src="assets/c 1.png" width="9"> ![](keep.png)');
  assert.deepEqual(errors, []);
  console.log('PASS folders and pictures: assets hidden, gallery and viewer, move with pictures (shared copied, absolute links made relative), new folder from the move dialog, drag onto a folder\'s note, Escape cancels, drop on header, gallery/carry/rewrite rules. Native IPC mocked.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
