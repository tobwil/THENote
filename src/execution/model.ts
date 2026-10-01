import { parseFrontmatter } from './ledge-frontmatter';
export const RUNTIMES: Record<string, string> = { sh: 'Shell', bash: 'Bash', shell: 'Shell', zsh: 'Zsh', python: 'Python', python3: 'Python', py: 'Python', javascript: 'JavaScript', js: 'JavaScript', node: 'Node.js' };
export function parseExecutable(text: string) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const opening = /^ {0,3}(`{3,}|~{3,})([^\n]*)$/.exec(lines[0]);
  if (!opening) return null;
  const [language, ...attributes] = opening[2].trim().split(/\s+/);
  if (!RUNTIMES[language?.toLowerCase()]) return null;
  let end = lines.length - 1;
  while (end > 0 && !lines[end].trim()) end--;
  const close = new RegExp(`^ {0,3}${opening[1][0]}{${opening[1].length},}\\s*$`);
  if (end < 1 || !close.test(lines[end])) return null;
  const code = lines.slice(1, end).join('\n');
  // Only a single complete fenced block may execute.
  if (lines.slice(1, end).some(line => close.test(line))) return null;
  return { language: language.toLowerCase(), label: RUNTIMES[language.toLowerCase()], code, attributes };
}
export function executionContext(markdown: string, notePath: string | null, workspace: string | null) {
  const parsed = parseFrontmatter(markdown);
  if (/^---\r?\n/.test(markdown) && parsed.end === 0) throw new Error('Das Frontmatter ist nicht abgeschlossen. Ergänze die schließende --- Zeile vor dem Ausführen.');
  const { params } = parsed;
  if (params.hosts.some(host => host !== 'local')) throw new Error('Diese Notiz verlangt einen Remote-Host. SSH ist in dieser Version noch nicht verfügbar.');
  if (params.profile || params.envFile) throw new Error('profile und envFile werden noch nicht unterstützt. Nutze cwd und env für einen expliziten lokalen Kontext.');
  if (params.locked) throw new Error('Eine gesperrte Notiz kann nicht ausgeführt werden.');
  const executionErrors = parsed.problems.filter(p => /cwd|host|env|profile|confirm|locked/i.test(p.message));
  if (executionErrors.length) throw new Error(executionErrors.map(p => `Zeile ${p.line}: ${p.message}`).join('\n'));
  return { cwd: params.cwd, env: params.env, baseDir: workspace ?? notePath?.replace(/[\\/][^\\/]+$/, '') ?? null, confirm: params.confirm };
}
