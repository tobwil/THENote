/** Reproduce a public screenshot with fixture content, without provider calls. */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1453', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vite timeout')), 20000);
    server.stdout.on('data', data => { if (String(data).includes('Local:')) { clearTimeout(timer); resolve(); } });
    server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite ${code}`)); });
  });
  try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1380, height: 1000 } });
  await page.goto('http://127.0.0.1:1453');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  await page.evaluate(async () => {
    const store = await import('/src/store.ts');
    const ai = await import('/src/ai.ts');
    const inline = await import('/src/ai/inline.ts');
    const fence = inline.serializeAiPrompt('Skizziere unseren Ideenprozess als Mermaid-Diagramm.');
    store.loadDocument('# Von der Idee zum Ergebnis\n\nGedanken sammeln, Zusammenhänge sehen und den nächsten Schritt festhalten.\n\n' + fence, '/Demo/Ideenwerkstatt.md');
    store.setSidebarTab('files'); store.setFolderPath('/Demo'); store.setFolderName('Ideenwerkstatt');
    store.setFileTree([{ name: 'Ideenwerkstatt.md', path: '/Demo/Ideenwerkstatt.md', is_dir: false }, { name: 'Projektnotizen', path: '/Demo/Projektnotizen', is_dir: true, children: [] }]);
    ai.setAiStatus({ config: { enabled: true, protocol: 'chat-completions', endpoint: 'https://example.invalid/v1/chat/completions', model: 'Demo-Modell', maxTokens: 4096, rememberKey: false }, hasKey: false, keychainAvailable: false });
    const block = store.doc.blocks.find(b => inline.parseAiPrompt(b.text) !== null);
    ai.setInlineRuns(block.id, { id: 'screenshot-fixture', tab: store.activeTabId(), block: block.id, source: block.text, status: 'done', model: 'Demo-Modell', contextAttached: false,
      content: '```mermaid\nflowchart LR\n  A[Idee] --> B[Notiz]\n  B --> C[Experiment]\n  C --> D[Erkenntnis]\n  D --> B\n```' });
  });
  await page.getByRole('button', { name: '✓ Übernehmen' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await mkdir('docs/screenshots', { recursive: true });
  await page.screenshot({ path: 'docs/screenshots/inline-ai.png' });
  console.log('Screenshot saved; fixture-only, no API request.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
