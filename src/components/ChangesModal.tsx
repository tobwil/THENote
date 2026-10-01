import { For, Show, createMemo, createSignal } from 'solid-js';
import { doc, fullText, fileName, externalChange } from '../store';
import { diffLines, diffHunks } from '../diff';
import ModalFrame from './ModalFrame';

const [visible, setVisible] = createSignal(false);
export function openChanges() { setVisible(true); }

function ChangesContent() {
  // joinBlocks represents the untouched empty editor as a single newline.
  const comparable = (text: string) => text === '\n' ? '' : text;
  const diff = createMemo(() => diffLines(comparable(doc.savedText ?? ''), comparable(fullText())));
  const hunks = createMemo(() => {
    let remaining = 2000;
    return diffHunks(diff().lines).flatMap(hunk => {
      const shown = hunk.slice(0, Math.max(0, remaining));
      remaining -= shown.length;
      return shown.length ? [shown] : [];
    });
  });
  const truncated = createMemo(() => diffHunks(diff().lines).reduce((n, h) => n + h.length, 0) > 2000);
  return <>
    <p class="changes-description">{!doc.filePath && doc.savedText === '' ? 'Neue Notiz → Aktueller Entwurf' : 'Zuletzt geladen / gespeichert → Aktueller Entwurf'} · Markdown</p>
    <Show when={externalChange()}><p class="changes-notice">Die Datei wurde außerhalb der App geändert. Verglichen wird mit dem zuletzt hier geladenen oder gespeicherten Stand.</p></Show>
    <Show when={doc.savedText !== null} fallback={<p class="changes-empty">Der gespeicherte Stand konnte bei der Wiederherstellung nicht gelesen werden. Ein verlässlicher Vergleich ist daher nicht verfügbar.</p>}>
      <div class="changes-summary"><span class="changes-added">+{diff().added} hinzugefügt</span><span class="changes-removed">−{diff().removed} entfernt</span><span>Zeilen · links vorher, rechts jetzt</span></div>
      <Show when={diff().added || diff().removed} fallback={<p class="changes-empty">Keine Textänderungen gegenüber dem Vergleichsstand.{doc.dirty ? ' Die Notiz ist weiterhin als ungespeichert markiert.' : ''}</p>}>
        <div class="changes-code" role="region" aria-label="Textänderungen" tabIndex={0}>
          <For each={hunks()}>{hunk => <section class="changes-hunk"><div class="changes-hunk-label">@@ Zeile {hunk.find(l => l.oldLine !== null)?.oldLine ?? '–'} → {hunk.find(l => l.newLine !== null)?.newLine ?? '–'} @@</div>
            <For each={hunk}>{line => <div class={`changes-line changes-${line.kind}`}><span class="changes-number">{line.oldLine ?? ''}</span><span class="changes-number">{line.newLine ?? ''}</span><span class="changes-sign">{line.kind === 'added' ? '+' : line.kind === 'removed' ? '−' : ' '}</span><code>{line.text.replace(/\n$/, '') || '\u00a0'}<Show when={!line.text.endsWith('\n')}><small class="changes-eof"> ↵ kein Zeilenumbruch am Ende</small></Show></code></div>}</For>
          </section>}</For>
        </div>
        <Show when={diff().simplified}><p class="changes-notice">Große Änderung: Der betroffene Bereich wird als zusammenhängender Austausch dargestellt.</p></Show>
        <Show when={truncated()}><p class="changes-notice">Vorschau auf 2.000 Zeilen begrenzt. Die Zähler berücksichtigen alle Änderungen.</p></Show>
      </Show>
    </Show>
    <footer class="changes-footer">Diese Vorschau speichert oder verändert deine Notiz nicht.</footer>
  </>;
}
export default function ChangesModal() {
  const close = () => setVisible(false);
  return <Show when={visible()}><div class="changes-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><ModalFrame class="changes-modal" label="Ungespeicherte Änderungen" onClose={close}>
    <header><div><h2>Änderungen</h2><p>{fileName()}</p></div><button class="icon-btn" aria-label="Änderungen schließen" onClick={close}>×</button></header>
    <ChangesContent />
  </ModalFrame></div></Show>;
}
