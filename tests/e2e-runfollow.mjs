/**
 * Live output follows its newest line (a breathing exercise prints one line a
 * second), pauses when you scroll up to read, and "↓ Live folgen" resumes.
 * The output also comes into view when a run starts below the window.
 * Runs are simulated through the execution store; no process is started.
 *
 *   node tests/e2e-runfollow.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1470', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Vite startup timeout')), 20000); server.stdout.on('data', d => { if (String(d).includes('Local:')) { clearTimeout(timer); resolve(); } }); server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); }); });
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.__TAURI_INTERNALS__ = { metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } }, transformCallback() { return 1; }, unregisterCallback() {}, convertFileSrc(p) { return p; }, async invoke(cmd) { if (cmd === 'load_settings') return {}; if (cmd === 'list_shadows' || cmd === 'list_fonts') return []; return null; } };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
  });
  await page.goto('http://127.0.0.1:1470');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  // A long note: the breathing block sits below the window.
  await page.evaluate(async () => {
    const s = await import('/src/store.ts');
    s.loadDocument('# Pause\n\n' + Array.from({ length: 14 }, (_, i) => `Absatz ${i + 1} mit etwas Text, damit die Notiz länger als das Fenster ist.`).join('\n\n') + '\n\n```python\nprint("atmen")\n```\n', '/n/Pause.md');
  });
  await page.locator('.run-cell').waitFor({ state: 'attached' });
  const panelTop = () => page.evaluate(() => document.querySelector('#document-panel').scrollTop);
  assert.equal(await panelTop(), 0);
  // Simulate a run that prints one line at a time.
  const emit = (lines, status = 'running') => page.evaluate(async ({ lines, status }) => {
    const s = await import('/src/store.ts'); const ex = await import('/src/execution.ts');
    const block = s.doc.blocks.find(b => b.text.startsWith('```python'));
    const output = Array.from({ length: lines }, (_, i) => `  Runde ${Math.floor(i / 16) + 1}/4   Einatmen  ${'●'.repeat(i % 4 + 1)}`).join('\n');
    ex.setRuns([{ id: 'breath', blockId: block.id, tabId: s.activeTabId(), note: 'Pause.md', language: 'Python', source: block.text, status, output, exitCode: status === 'running' ? null : 0, durationMs: 1000, started: Date.now() }]);
  }, { lines, status });
  await emit(1);
  await page.waitForFunction(() => { const pre = document.querySelector('.run-output pre'); const r = pre?.getBoundingClientRect(); return r && r.bottom <= innerHeight + 2; }, null, { timeout: 3000 });
  assert.ok(await panelTop() > 0, 'the output came into view when the run started');
  const pre = page.locator('.run-output pre');
  const atEnd = () => pre.evaluate(el => el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
  for (const n of [10, 20, 30, 40]) {
    await emit(n);
    await page.waitForTimeout(80);
    assert.ok(await atEnd(), `following the newest line after ${n} lines`);
  }
  // Scroll up to read: following pauses, new lines do not pull the view away.
  await pre.evaluate(el => { el.scrollTop = 0; el.dispatchEvent(new Event('scroll')); });
  await emit(50);
  await page.waitForTimeout(80);
  assert.equal(await pre.evaluate(el => el.scrollTop), 0, 'reading position is kept');
  const button = page.getByRole('button', { name: '↓ Live folgen' });
  await button.click();
  assert.ok(await atEnd(), 'Live folgen jumps to the newest line');
  await emit(60);
  await page.waitForTimeout(80);
  assert.ok(await atEnd(), 'and keeps following');
  await emit(64, 'finished');
  await page.waitForTimeout(80);
  assert.equal(await button.count(), 0, 'no follow button once the run is done');
  assert.deepEqual(errors, []);
  console.log('PASS run output: comes into view on start, follows the newest line, pauses while reading, „↓ Live folgen“ resumes.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
