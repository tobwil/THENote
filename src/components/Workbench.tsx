import { openChanges } from "./ChangesModal";
import { openAiSettings } from '../ai';
import { For, Show, createMemo, createSignal } from 'solid-js';
import { activeTabId, doc, folderName, folderPath, fullText, appendBlock, theme, setTheme } from '../store';
import { executeCommand, insertFencedBlock } from '../commands';
import { runs, activityOpen, setActivityOpen, runLabel, stopRun, parseExecutable } from '../execution';
import { newNotebook } from '../notebook';
import { setSetting } from '../settings';
import { isTauri } from '../platform';
export default function Workbench() {
  const [templates, setTemplates] = createSignal(false);
  const blocks = createMemo(() => doc.blocks.filter(b => parseExecutable(b.text)).length);
  const ownRuns = createMemo(() => runs().filter(r => r.tabId === activeTabId()).slice().reverse());
  const active = createMemo(() => runs().filter(r => r.status === 'running').length);
  const context = createMemo(() => /^---\r?\n/.test(fullText()) ? 'Kontext aus Frontmatter' : folderPath() ? 'Workspace-Kontext' : 'Persönlicher Kontext');
  return <>
    <div class="workbench">
      <div class="workbench-location"><span class="location-symbol">▧</span><span>{folderName() ?? 'Mein Arbeitsbuch'}</span><span class="location-divider">/</span><b>{doc.filePath?.split(/[\\/]/).pop() ?? (doc.draftName === 'Untitled.md' ? 'Neue Notiz' : doc.draftName)}</b></div>
      <div class="workbench-tools">
        <button class="workbench-button" title="Codeblock einfügen" onClick={() => appendBlock('```python\nprint("Hallo, THE Note!")\n```')}><span>⌘</span> Code</button>
        <button class="workbench-button" aria-label="Farbschema wechseln" title="Hell / Dunkel" onClick={() => { const value = theme() === 'graphite' ? 'sarala' : 'graphite'; setTheme(value); void setSetting('theme', value); }}>◐</button>
        <button class="workbench-button" title="Entwurf mit dem zuletzt gespeicherten Stand vergleichen" onClick={openChanges}>± Änderungen{doc.dirty ? ' •' : ''}</button>
        <button class="workbench-button" onClick={() => executeCommand('file.save')}>Speichern <kbd>⌘S</kbd></button>
      </div>
    </div>
    <div class="notebook-context">
      <div class="context-tags"><span class="local-badge"><i /> {isTauri ? 'LOKAL' : 'EDITOR-VORSCHAU'}</span><span>{context()}</span><span class="context-dot">·</span><span>{blocks()} ausführbare {blocks() === 1 ? 'Zelle' : 'Zellen'}</span></div>
      <div class="notebook-actions">
        <div class="template-wrap"><button class="subtle-button" aria-expanded={templates()} onClick={() => setTemplates(!templates())}>＋ Neue Notiz <span>⌄</span></button><Show when={templates()}><div class="template-menu"><For each={[
          ['blank', 'Leere Notiz', 'Platz für deinen nächsten Gedanken'],
          ['journal', 'Gedankenbuch', 'Notizen und nächste Schritte'],
          ['runbook', 'Ausführbares Runbook', 'Kontext, Code und Ergebnisse'],
          ['diagram', 'Eine Idee skizzieren', 'Ein Ablauf als Mermaid-Diagramm'],
        ]}>{([key, title, description]) => <button onClick={() => { newNotebook(key as 'blank' | 'journal' | 'runbook' | 'diagram'); setTemplates(false); }}><b>{title}</b><small>{description}</small></button>}</For></div></Show></div>
        <button class="ai-toggle" title="KI-Prompt hier einfügen · /ai" onClick={() => insertFencedBlock('ai', '')}>✦ /ai</button><button class="subtle-button" aria-label="KI-Anbieter einrichten" onClick={() => void openAiSettings()}>⚙ KI</button>
        <button class="activity-toggle" classList={{ selected: activityOpen() }} aria-expanded={activityOpen()} onClick={() => setActivityOpen(!activityOpen())}>⌁ Aktivität <span>{active() || runs().length}</span></button>
      </div>
    </div>
    <Show when={activityOpen()}><aside class="activity-panel" aria-label="Ausführungen"><header><div><span class="eyebrow">DEIN ARBEITSBUCH</span><h2>Aktivität</h2></div><button class="icon-btn" aria-label="Aktivität schließen" onClick={() => setActivityOpen(false)}>×</button></header><p class="activity-explainer">Ausgaben dieser Notiz. Jeder Start läuft in einem eigenen Prozess.</p>
      <Show when={ownRuns().length} fallback={<div class="activity-empty"><span>⌁</span><h3>Hier werden Ideen lebendig.</h3><p>Starte einen Codeblock. Sein Ergebnis erscheint direkt in der Notiz und hier im Verlauf.</p><kbd>⌘ / Ctrl + Enter</kbd></div>}>
        <For each={ownRuns()}>{run => <article class="activity-entry"><div><b>{run.language}</b><span classList={{ 'activity-error': run.status === 'error' || (run.status === 'finished' && run.exitCode !== 0) }}>{runLabel(run)}</span></div><small>{new Date(run.started).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {run.note}</small><pre>{run.output || 'Warte auf Ausgabe …'}</pre><Show when={run.status === 'running'}><button class="run-button stop" onClick={() => void stopRun(run.id)}>■ Stoppen</button></Show></article>}</For>
      </Show><footer><span class="runtime-dot" /> Lokal ausgeführt · Keine Cloud</footer>
    </aside></Show>
  </>;
}
