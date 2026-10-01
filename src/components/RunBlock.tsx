import { Show, createMemo, createSignal } from 'solid-js';
import { runs, runBlock, stopRun, runLabel, parseExecutable } from '../execution';
export default function RunBlock(props: { id: number; text: string }) {
  const block = createMemo(() => parseExecutable(props.text));
  const run = createMemo(() => [...runs()].reverse().find(r => r.blockId === props.id));
  const [collapsed, setCollapsed] = createSignal(false);
  return <Show when={block()}><div class="run-cell" contentEditable={false}>
    <div class="run-cell-bar">
      <span class="runtime-dot" /><span>{block()?.label}</span><span class="run-cell-host">Lokal</span>
      <Show when={run()}><span class="run-result" classList={{ failed: run()?.status === 'error' || (run()?.status === 'finished' && run()?.exitCode !== 0) }}>{runLabel(run()!)}<Show when={run()?.durationMs}> · {((run()?.durationMs ?? 0) / 1000).toFixed(2)} s</Show></span></Show>
      <Show when={run()?.source !== props.text && run()}><span title="Der Code wurde seit dieser Ausführung verändert">Geändert</span></Show>
      <Show when={run()?.status === 'running'} fallback={<button class="run-button" aria-label={`${block()?.label} ausführen`} title="Ausführen (⌘/Ctrl+Enter)" onClick={() => { setCollapsed(false); void runBlock(props.id, props.text); }}><span>▶</span> Ausführen <kbd>⌘↵</kbd></button>}>
        <button class="run-button stop" onClick={() => void stopRun(run()!.id)}>■ Stoppen</button>
      </Show>
    </div>
    <Show when={run()}><div class="run-output" classList={{ error: run()?.status === 'error' }}>
      <button class="output-label" aria-expanded={!collapsed()} onClick={() => setCollapsed(!collapsed())}>{collapsed() ? '▸' : '▾'} AUSGABE <span>{run()?.status === 'running' ? 'live' : ''}</span></button>
      <Show when={!collapsed()}><pre aria-label="Codeausgabe">{run()?.output || (run()?.status === 'running' ? 'Prozess wird gestartet …' : 'Keine Ausgabe.')}</pre></Show>
    </div></Show>
  </div></Show>;
}
