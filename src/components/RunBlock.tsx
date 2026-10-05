import { Show, createEffect, createMemo, createSignal, on } from 'solid-js';
import { runs, runBlock, stopRun, runLabel, parseExecutable } from '../execution';
export default function RunBlock(props: { id: number; text: string }) {
  const block = createMemo(() => parseExecutable(props.text));
  const run = createMemo(() => [...runs()].reverse().find(r => r.blockId === props.id));
  const [collapsed, setCollapsed] = createSignal(false);
  // Live output follows its newest line, like a terminal, until you scroll up to read;
  // scrolling back to the end (or "↓ Live folgen") picks it up again.
  const [follow, setFollow] = createSignal(true);
  let outputEl: HTMLPreElement | undefined;
  let shownRun: string | undefined;
  const toEnd = () => { if (outputEl) outputEl.scrollTop = outputEl.scrollHeight; };
  const atEnd = () => !outputEl || outputEl.scrollTop + outputEl.clientHeight >= outputEl.scrollHeight - 8;
  createEffect(on(() => [run()?.id, run()?.output, collapsed()] as const, ([id]) => {
    if (!id || !outputEl) return;
    if (id !== shownRun) {
      // A new run: follow again, and bring its output into view once if it sits below the window.
      shownRun = id;
      setFollow(true);
      if (run()?.status === 'running') requestAnimationFrame(() => outputEl?.closest('.run-output')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
    if (follow()) requestAnimationFrame(toEnd);
  }));
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
      <Show when={!collapsed()}>
        <pre ref={outputEl} aria-label="Codeausgabe" onScroll={() => setFollow(atEnd())}>{run()?.output || (run()?.status === 'running' ? 'Prozess wird gestartet …' : 'Keine Ausgabe.')}</pre>
        <Show when={run()?.status === 'running' && !follow()}>
          <button type="button" class="output-follow" onClick={() => { setFollow(true); toEnd(); }}>↓ Live folgen</button>
        </Show>
      </Show>
    </div></Show>
  </div></Show>;
}
