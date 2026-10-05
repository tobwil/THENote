/**
 * A short notice at the bottom of the window, e.g. after an export: what
 * happened, where, and a follow-up action. Disappears after a few seconds.
 */
import { For, Show, createSignal } from "solid-js";

interface ToastAction { label: string; run: () => void }
interface ToastState { text: string; detail?: string; actions?: ToastAction[] }
const [toast, setToast] = createSignal<ToastState | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(next: ToastState, ms = 7000) {
  clearTimeout(timer);
  setToast(next);
  timer = setTimeout(() => setToast(null), ms);
}

export default function Toast() {
  return (
    <Show when={toast()}>{(t) => (
      <div class="app-toast" role="status" aria-live="polite">
        <div class="app-toast-text"><b>{t().text}</b><Show when={t().detail}><small title={t().detail}>{t().detail}</small></Show></div>
        <For each={t().actions ?? []}>{(action) => <button type="button" onClick={() => { action.run(); setToast(null); }}>{action.label}</button>}</For>
        <button type="button" class="app-toast-close" aria-label="Hinweis schließen" onClick={() => setToast(null)}>×</button>
      </div>
    )}</Show>
  );
}
