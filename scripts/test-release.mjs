/** Run the release regression suite and retain a report plus per-suite logs. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(root, 'release', `tests-v${version}-${stamp}`);
mkdirSync(output, { recursive: true });
const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout?.trim() ?? '';
const source = { commit: git('rev-parse', 'HEAD'), dirty: !!git('status', '--porcelain') };
const suites = [
  ['TypeScript', 'npm', ['run', 'typecheck']],
  ['ESLint', 'npm', ['run', 'lint']],
  ['Unit and regression tests', 'npm', ['test']],
  ['Notebook UI', 'npm', ['run', 'test:notebook']],
  ['Clipboard images UI', 'npm', ['run', 'test:paste:ui']],
  ['Gallery and image moves UI', 'npm', ['run', 'test:gallery:ui']],
  ['Slash date immediate execution', 'node', ['tests/e2e-slashdate.mjs']],
  ['Workspace UI', 'npm', ['run', 'test:workspace:ui']],
  ['Sidebar UI', 'node', ['tests/e2e-sidebar.mjs']],
  ['AI UI', 'npm', ['run', 'test:ai:ui']],
  ['Diff UI', 'npm', ['run', 'test:diff:ui']],
  ['Native Rust tests', 'cargo', ['test', '--locked', '--manifest-path', 'src-tauri/Cargo.toml']],
  ['Clippy', 'cargo', ['clippy', '--locked', '--manifest-path', 'src-tauri/Cargo.toml', '--', '-D', 'warnings']],
  ['Website UI and distribution metadata', 'npm', ['run', 'test:site']],
];
const results = [];
for (const [index, [name, command, args]] of suites.entries()) {
  const start = Date.now();
  process.stdout.write(`Running ${name}…\n`);
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', timeout: 600000, maxBuffer: 32 * 1024 * 1024 });
  const log = `${String(index + 1).padStart(2, '0')}.log`;
  writeFileSync(resolve(output, log), `${result.stdout ?? ''}\n${result.stderr ?? ''}\n${result.error?.message ?? ''}`);
  const row = { name, command: [command, ...args].join(' '), passed: result.status === 0 && !result.error, exitCode: result.status, signal: result.signal, seconds: Number(((Date.now() - start) / 1000).toFixed(1)), log };
  results.push(row);
  console.log(`${row.passed ? 'PASS' : 'FAIL'} ${name} (${row.seconds}s) — ${log}`);
}
const passed = results.filter(r => r.passed).length;
const report = { version, startedAt: stamp, source, platform: process.platform, architecture: process.arch, passed, total: results.length, results };
writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
writeFileSync(resolve(output, 'report.md'), `# Testbericht · THE Note ${version}\n\n${passed}/${results.length} Testgruppen erfolgreich.\n\nStand: ${source.commit}${source.dirty ? ' mit lokalen Änderungen' : ''}. Plattform: ${process.platform}/${process.arch}. Start (UTC): ${stamp}.\n\n| Testgruppe | Ergebnis | Sekunden | Protokoll |\n| --- | --- | ---: | --- |\n${results.map(r => `| ${r.name} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.seconds} | [Log](${r.log}) |`).join('\n')}\n\n## Grenzen\n\nUI-Tests laufen in Chromium mit nachgebildeter nativer IPC und synthetischen Zwischenablage-Ereignissen. Rust-Dateitests verwenden echte temporäre Dateien. Kein manueller Erststart auf einem frischen Mac, keine echte macOS-Zwischenablage, keine kostenpflichtigen KI-Anfragen. Signierung, Notarisierung und veröffentlichte Downloads werden separat nach dem Paketbau geprüft.\n`);
console.log(`Report: ${resolve(output, 'report.md')}`);
process.exitCode = passed === results.length ? 0 : 1;
