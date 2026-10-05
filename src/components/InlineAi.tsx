import { requestedInlineFocus, requestInlineFocus, takeQuickRun } from '../ai/focus';
import { Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { parseAiPrompt, serializeAiPrompt } from '../ai/inline';
import { aiStatus, aiError, initializeAi, openAiSettings, inlineRuns, runInlineAi, stopInlineAi, discardInlineResult } from '../ai';
import { activeTabId, doc, fullText, removeBlock, replaceBlockMarkdown, consumeCaretRequest } from '../store';
export default function InlineAi(props: { id: number; text: string; active: boolean; onChange: (text: string) => void }) {
  let input: HTMLTextAreaElement | undefined;
  const [context, setContext] = createSignal(false);
  const run = () => inlineRuns[props.id];
  const prompt = () => parseAiPrompt(props.text) ?? '';
  const busy = () => run()?.status === 'streaming';
  const stale = () => !!run() && run()?.source !== props.text;
  onMount(() => {
    // A quick action (/zusammenfassen …) sends the note along and starts at once, once a provider is set up.
    // The block mounts while it is being inserted; the quick-run mark follows in the same task.
    queueMicrotask(() => {
      const quick = takeQuickRun(props.id);
      if (quick) setContext(true);
      void initializeAi().then(() => { if (quick && aiStatus().config.enabled) generate(); });
    });
  });
  createEffect(() => {
    if (requestedInlineFocus() !== props.id) return;
    consumeCaretRequest();
    const frame = requestAnimationFrame(() => {
      if (input?.isConnected && requestedInlineFocus() === props.id) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        requestInlineFocus(null);
      }
    });
    onCleanup(() => cancelAnimationFrame(frame));
  });
  const generate = () => { if (!busy()) void runInlineAi(props.id, props.text, prompt(), context()); };
  const accept = () => {
    const result = run(); const index = doc.blocks.findIndex(b => b.id === props.id);
    if (!result || result.status !== 'done' || result.tab !== activeTabId() || stale() || index < 0) return;
    replaceBlockMarkdown(index, result.content);
  };
  const remove = () => { const index = doc.blocks.findIndex(b => b.id === props.id); if (!busy() && index >= 0) removeBlock(index); };
  return <section class="inline-ai" aria-label="Inline KI-Prompt" contentEditable={false}>
    <header><span class="inline-ai-symbol">✦</span><div><b>Ein Gedanke weiter.</b><small>KI direkt an dieser Stelle · /ai</small></div><button type="button" class="ai-text-button" onClick={() => void openAiSettings()}>{aiStatus().config.model || 'Anbieter verbinden'} ⚙</button><button type="button" class="icon-btn" aria-label="KI-Block entfernen" disabled={busy()} onClick={remove}>×</button></header>
    <Show when={aiError()}><p class="ai-error" role="alert">{aiError()}</p></Show>
    <textarea ref={input} aria-label="Inline KI-Prompt eingeben" placeholder="Was soll hier entstehen? Zum Beispiel: Erkläre diesen Gedanken mit einem Beispiel …" value={prompt()} readOnly={busy()} onInput={e => props.onChange(serializeAiPrompt(e.currentTarget.value))} onKeyDown={e => { e.stopPropagation(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); generate(); } }} />
    <div class="inline-ai-controls"><label><input type="checkbox" checked={context()} disabled={busy()} onChange={e => setContext(e.currentTarget.checked)} /> Notiz als Kontext</label><span>Nur dieser Prompt{context() ? ' + Notiz' : ''}</span><Show when={aiStatus().config.enabled} fallback={<button class="ai-primary" onClick={() => void openAiSettings()}>Anbieter verbinden</button>}><Show when={busy()} fallback={<button type="button" class="ai-primary" disabled={!prompt().trim()} onClick={generate}>Generieren ↗ <kbd>⌘↵</kbd></button>}><button type="button" class="ai-stop" onClick={() => void stopInlineAi(props.id)}>■ Stoppen</button></Show></Show></div>
    <Show when={context()}><details class="ai-context-preview"><summary>Mitgesendete Notiz ansehen</summary><pre>{fullText()}</pre></details></Show>
    <Show when={run()}><div class="inline-ai-result" aria-label="KI-Entwurf" aria-live="polite"><div class="inline-ai-result-label"><span>{busy() ? '✦ ENTSTEHT GERADE' : '✦ ENTWURF'}</span><span>{run()?.model}</span></div><pre class="inline-ai-draft">{run()?.content || (busy() ? 'Denkt nach …' : '')}</pre><Show when={run()?.error}><p class="ai-error" role="alert">{run()?.error}</p></Show><Show when={run()?.status === 'cancelled' || run()?.status === 'incomplete'}><p class="ai-field-hint">{run()?.status === 'cancelled' ? 'Gestoppt' : 'Antwort unvollständig'} · Du kannst den Prompt erneut ausführen.</p></Show><Show when={stale()}><p class="ai-field-hint">Der Prompt wurde geändert. Generiere einen neuen Entwurf.</p></Show><Show when={!busy()}><footer><button type="button" class="ai-text-button" onClick={() => discardInlineResult(props.id)}>Entwurf verwerfen</button><Show when={run()?.status === 'done'}><button class="ai-primary" disabled={stale()} onClick={accept}>✓ Übernehmen</button></Show></footer></Show></div></Show>
    <small class="inline-ai-hint">Der Entwurf wird erst beim Übernehmen zu normalem Markdown. Dein Anbieter kann API-Nutzung berechnen.</small>
  </section>;
}
