// Build the editor as a static web app into dist-site/app/, served by GitHub
// Pages next to the website (https://tobwil.github.io/THENote/app/). Without
// Tauri the app runs in its browser mode: saving downloads the .md file, pasted
// pictures are embedded, code runs only in the desktop app.
import { readFile } from 'node:fs/promises';
import { build } from 'vite';
const d = JSON.parse(await readFile('distribution.json', 'utf8'));
const base = new URL('app/', d.site).pathname;
await build({ base, logLevel: 'warn', build: { outDir: 'dist-site/app', emptyOutDir: true } });
console.log(`Web app built for ${new URL(base, d.site).href}`);
