import { createSignal } from 'solid-js';
import { activeTabId, doc, folderPath, fullText, fileName } from './store';
import { confirmDialog, isTauri } from './platform';
import { executionContext, parseExecutable } from './execution/model';
export { parseExecutable } from './execution/model';
export type RunStatus = 'running' | 'finished' | 'cancelled' | 'timeout' | 'error';
export interface Run { id: string; blockId: number; tabId: number; note: string; language: string; source: string; status: RunStatus; output: string; exitCode: number | null; durationMs: number; started: number }
export const [runs, setRuns] = createSignal<Run[]>([]);
export const [activityOpen, setActivityOpen] = createSignal(false);
let listening: Promise<unknown> | undefined;
const starting = new Set<number>();
async function ensureListener() {
  if (!listening) listening = import('@tauri-apps/api/event').then(({ listen }) => listen<{id: string; kind: string; text: string; exitCode: number | null; durationMs: number}>('note-run', ({ payload: e }) => {
    setRuns(previous => previous.map(run => run.id !== e.id ? run : {
      ...run,
      output: (run.output + e.text).slice(-1024 * 1024 - 100),
      ...(e.kind === 'stdout' || e.kind === 'stderr' ? {} : { status: e.kind as RunStatus, exitCode: e.exitCode, durationMs: e.durationMs }),
    }));
  })).catch(error => { listening = undefined; throw error; });
  await listening;
}
export async function runBlock(blockId: number, text: string) {
  const block = parseExecutable(text);
  if (!block || starting.has(blockId) || runs().some(r => r.blockId === blockId && r.status === 'running')) return;
  starting.add(blockId);
  const tabId = activeTabId();
  const note = fileName();
  const markdown = fullText();
  const path = doc.filePath;
  const workspace = folderPath();
  const id = crypto.randomUUID();
  let run: Run = { id, blockId, tabId, note, language: block.label, source: text, status: 'running', output: '', exitCode: null, durationMs: 0, started: Date.now() };
  const add = () => setRuns(previous => [...previous.filter(r => r.status === 'running'), ...previous.filter(r => r.status !== 'running' && Date.now() - r.started < 86400000).slice(-41), run].sort((a, b) => a.started - b.started));
  try {
    if (!isTauri) throw new Error('Die Codeausführung ist in der Desktop-App verfügbar. Starte sie mit npm run desktop. Im Browser kannst du den Editor ausprobieren.');
    const context = executionContext(markdown, path, workspace);
    const explicit = block.attributes.find(a => /^confirm(?:=|$)/.test(a));
    const ask = explicit ? !['confirm=no', 'confirm=false'].includes(explicit) : context.confirm;
    if (ask && !await confirmDialog(`${block.label} auf diesem Computer ausführen?\nArbeitsordner: ${context.cwd ?? context.baseDir ?? '~'}${context.cwd ? `\nBasis: ${context.baseDir ?? '~'}` : ''}\n\n${block.code.slice(0, 1200)}`)) return;
    await ensureListener();
    add();
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('start_block', { request: { id, language: block.language, code: block.code, cwd: context.cwd, baseDir: context.baseDir, env: context.env } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!runs().some(r => r.id === id)) { run = { ...run, status: 'error', output: message }; add(); }
    else setRuns(previous => previous.map(r => r.id === id ? { ...r, status: 'error', output: message } : r));
  } finally { starting.delete(blockId); }
}
export async function stopRun(id: string) {
  try { const { invoke } = await import('@tauri-apps/api/core'); await invoke('stop_block', { id }); }
  catch (error) { setRuns(previous => previous.map(r => r.id === id ? { ...r, output: r.output + `\nStop fehlgeschlagen: ${String(error)}` } : r)); }
}
export function runLabel(run: Run) {
  if (run.status === 'running') return 'Läuft';
  if (run.status === 'cancelled') return 'Gestoppt';
  if (run.status === 'timeout') return 'Zeitlimit · 120 s';
  if (run.status === 'error') return 'Nicht gestartet';
  return run.exitCode === 0 ? 'Erfolgreich' : `Exit ${run.exitCode ?? '—'}`;
}
