/**
 * "New note from a template", next to the + in the tab bar: creating a note is
 * a tab action, not something that belongs to the note that is open. The menu
 * floats in a portal so the tab strip's scrolling never clips it.
 */
import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { newNotebook, type TemplateId } from "../notebook";
import { theme } from "../store";

export const NOTE_TEMPLATES: readonly [TemplateId, string, string][] = [
  ["blank", "Leere Notiz", "Platz für deinen nächsten Gedanken"],
  ["journal", "Gedankenbuch", "Notizen und nächste Schritte"],
  ["runbook", "Ausführbares Runbook", "Kontext, Code und Ergebnisse"],
  ["diagram", "Eine Idee skizzieren", "Ein Ablauf als Mermaid-Diagramm"],
  ["playground", "✦ Spielplatz", "Würfelorakel, Mandelbrot, Aquarium: einfach drücken"],
  ["toolbox", "⌘ Werkzeugkasten", "Ordner, Git, Kalender, CSV und JSON auf Knopfdruck"],
];

export default function NewNoteMenu() {
  const [at, setAt] = createSignal<{ top: number; left: number } | null>(null);
  let button: HTMLButtonElement | undefined;
  let menu: HTMLDivElement | undefined;
  const toggle = () => {
    if (at()) return setAt(null);
    const box = button!.getBoundingClientRect();
    setAt({ top: box.bottom + 6, left: Math.max(8, Math.min(box.left, window.innerWidth - 300)) });
  };
  // Closes like any popover: outside click, Escape, or a resize.
  createEffect(() => {
    if (!at()) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menu?.contains(event.target as Node) && !button?.contains(event.target as Node)) setAt(null);
    };
    document.addEventListener("pointerdown", close, true);
    document.addEventListener("keydown", close, true);
    window.addEventListener("resize", close);
    queueMicrotask(() => menu?.querySelector("button")?.focus());
    onCleanup(() => { document.removeEventListener("pointerdown", close, true); document.removeEventListener("keydown", close, true); window.removeEventListener("resize", close); });
  });
  return <>
    <button ref={button} class="document-tab-new document-tab-templates" title="Neue Notiz aus Vorlage" aria-label="Neue Notiz aus Vorlage" aria-haspopup="menu" aria-expanded={!!at()}
      onMouseDown={(e) => e.preventDefault()} onClick={toggle}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" /></svg>
    </button>
    <Show when={at()}>{(pos) => (
      <Portal><div class="template-menu-root" data-theme={theme()}>
        <div ref={menu} class="template-menu floating" role="menu" aria-label="Neue Notiz aus Vorlage" style={{ top: `${pos().top}px`, left: `${pos().left}px` }}>
          <p class="template-menu-title">Neue Notiz aus Vorlage</p>
          <For each={NOTE_TEMPLATES}>{([key, title, description]) => (
            <button role="menuitem" classList={{ "template-example": key === "playground" || key === "toolbox" }} onClick={() => { newNotebook(key); setAt(null); }}><b>{title}</b><small>{description}</small></button>
          )}</For>
          <p class="template-menu-hint">Bausteine wie Fokuszeit, Atemübung oder Werkzeuge holst du mit <kbd>/</kbd> direkt in die offene Notiz.</p>
        </div>
      </div></Portal>
    )}</Show>
  </>;
}
