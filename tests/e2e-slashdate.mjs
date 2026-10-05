/** Complete a slash query and run its item before the next animation frame. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '1463', '--host', '127.0.0.1'], { stdio: 'pipe' });
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vite startup timeout')), 20000);
    server.stdout.on('data', data => { if (String(data).includes('Local:')) { clearTimeout(timer); resolve(); } });
    server.on('exit', code => { clearTimeout(timer); reject(new Error(`Vite exited ${code}`)); });
  });
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:1463');
  await page.getByRole('heading', { name: 'Gedanken, die etwas bewegen.' }).waitFor();
  for (const method of ['click', 'Enter', 'Tab']) {
    await page.getByRole('button', { name: 'New tab', exact: true }).click();
    await page.locator('.block .rendered').first().click();
    await page.getByRole('textbox', { name: 'Edit Markdown block' }).pressSequentially('Termin: /d');
    await page.locator('.slash-item').filter({ hasText: 'Datum einfügen' }).waitFor();
    // Input and execution share one task, before the scheduled frame refresh.
    await page.evaluate(method => {
      if (!document.execCommand('insertText', false, 'ate')) throw new Error('Could not complete query');
      if (method === 'click') {
        const button = [...document.querySelectorAll('.slash-item')].find(el => el.textContent.includes('Datum einfügen'));
        if (!button) throw new Error('Date item missing');
        button.click();
      } else {
        document.querySelector('.block.active .source').dispatchEvent(new KeyboardEvent('keydown', { key: method, bubbles: true, cancelable: true }));
      }
    }, method);
    const picker = page.getByRole('dialog', { name: 'Datum einfügen' });
    await picker.waitFor();
    await picker.getByLabel('Datum', { exact: true }).fill('2026-12-24');
    await picker.getByRole('button', { name: 'Einfügen', exact: true }).click();
    await picker.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Source', exact: true }).click();
    assert.equal((await page.locator('.source-full').inputValue()).trim(), 'Termin: 24.12.2026', method);
    await page.getByRole('button', { name: 'Live', exact: true }).click();
  }
  console.log('PASS slash date: click/Enter/Tab execution removes the full latest query, without leftover characters.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
