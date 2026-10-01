import { Show, createSignal, onMount } from 'solid-js';
import ModalFrame from './ModalFrame';
export interface NameRequest { title: string; initial: string; description: string; submit: (name: string) => Promise<void> | void }
const [request, setRequest] = createSignal<NameRequest | null>(null);
export function openNameDialog(value: NameRequest) { setRequest(value); }
export function validateEntryName(value: string): string {
  const name = value.trim();
  if (!name || name.startsWith('.') || /[\\/:*?"<>|\x00-\x1f]/.test(name) || name.endsWith('.')) throw new Error('Bitte einen Namen ohne Pfadzeichen oder führenden Punkt eingeben.');
  return name;
}
function NameForm(props: { request: NameRequest; close: () => void }) {
  // eslint-disable-next-line solid/reactivity -- keyed Show creates a fresh form for each request
  const [name, setName] = createSignal(props.request.initial);
  const [error, setError] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  let input!: HTMLInputElement;
  onMount(() => { input.focus(); input.setSelectionRange(0, name().replace(/\.[^.]+$/, '').length); });
  const close = () => { if (!busy()) props.close(); };
  const submit = async (event: SubmitEvent) => {
    event.preventDefault(); if (busy()) return;
    setError(''); setBusy(true);
    try { await props.request.submit(validateEntryName(name())); props.close(); }
    catch (e) { setError(String(e instanceof Error ? e.message : e)); }
    finally { setBusy(false); }
  };
  return <div class="name-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><ModalFrame class="name-dialog" label={props.request.title} onClose={close}>
    <form onSubmit={e => void submit(e)}><h2>{props.request.title}</h2><p>{props.request.description}</p><label>Name<input ref={input} value={name()} onInput={e => setName(e.currentTarget.value)} disabled={busy()} required spellcheck={false} /></label>
    <Show when={error()}><p class="name-error" role="alert">{error()}</p></Show><footer><button type="button" onClick={close} disabled={busy()}>Abbrechen</button><button type="submit" class="name-primary" disabled={busy() || !name().trim()}>{busy() ? 'Wird gespeichert …' : 'Bestätigen'}</button></footer></form>
  </ModalFrame></div>;
}
export default function NameDialog() { return <Show when={request()} keyed>{r => <NameForm request={r} close={() => setRequest(null)} />}</Show>; }
