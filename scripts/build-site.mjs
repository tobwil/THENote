import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { languages } from '../site/i18n.mjs';
const d = JSON.parse(await readFile('distribution.json', 'utf8'));
const replacements = { VERSION: d.version, SITE: d.site, SITE_PATH: new URL(d.site).pathname, DOWNLOAD: `https://github.com/${d.repository}/releases/download/v${d.version}/${d.asset}` };
const SCREENSHOTS = ['note-light.png', 'note-dark.png', 'inline-ai.png', 'projects-and-date.png', 'unsaved-diff.png'];
await rm('dist-site', { recursive: true, force: true });
await mkdir('dist-site/assets', { recursive: true });
const template = await readFile('site/index.html', 'utf8');

/** Fill {{dotted.keys}} from one language, then the %%DISTRIBUTION%% values. */
function render(copy) {
  const depth = copy.path.split('/').filter(Boolean).length;
  const values = {
    ...copy, root: '../'.repeat(depth), home: replacements.SITE_PATH + copy.path, url: d.site + copy.path,
    current: Object.fromEntries(Object.keys(languages).map(lang => [lang, lang === copy.lang ? 'aria-current="page"' : ''])),
  };
  let html = template.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    const value = key.split('.').reduce((node, part) => node?.[part], values);
    if (typeof value !== 'string') throw new Error(`Missing website text "${key}" for ${copy.lang}`);
    return value;
  });
  for (const [key, value] of Object.entries(replacements)) html = html.replaceAll(`%%${key}%%`, value);
  if (/%%[A-Z_]+%%|\{\{/.test(html)) throw new Error(`Unresolved website placeholder (${copy.lang})`);
  return html;
}

for (const copy of Object.values(languages)) {
  await mkdir(`dist-site/${copy.path}`, { recursive: true });
  await writeFile(`dist-site/${copy.path}index.html`, render(copy));
}
for (const file of ['style.css', 'main.js']) await cp(`site/${file}`, `dist-site/${file}`);
await cp('site/fonts', 'dist-site/fonts', { recursive: true });
for (const file of SCREENSHOTS) await cp(`docs/screenshots/${file}`, `dist-site/assets/${file}`);
await cp('assets/the-note.svg', 'dist-site/assets/the-note.svg');
await cp('install.sh', 'dist-site/install.sh');
await writeFile('dist-site/.nojekyll', '');
await writeFile('dist-site/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${d.site}sitemap.xml\n`);
const urls = Object.values(languages).map(copy => `<url><loc>${d.site}${copy.path}</loc>${Object.values(languages).map(alt => `<xhtml:link rel="alternate" hreflang="${alt.lang}" href="${d.site}${alt.path}"/>`).join('')}</url>`).join('');
await writeFile('dist-site/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>\n`);
console.log(`Static website built for ${d.site} (${Object.keys(languages).join(', ')})`);
