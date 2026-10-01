import { For, Show, createSignal } from 'solid-js';
import ModalFrame from './ModalFrame';
import { aiSettingsOpen, setAiSettingsOpen, aiStatus, configureAi } from '../ai';
import { isTauri } from '../platform';
import type { AiConfig, AiModel } from '../ai/model';
const PROVIDERS: { label: string; endpoint: string; protocol: AiConfig['protocol'] }[] = [
  { label: 'OpenAI', endpoint: 'https://api.openai.com/v1/responses', protocol: 'responses' },
  { label: 'Claude', endpoint: 'https://api.anthropic.com/v1/messages', protocol: 'anthropic' },
  { label: 'Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', protocol: 'gemini' },
  { label: 'Intern', endpoint: '', protocol: 'chat-completions' },
  { label: 'Lokal', endpoint: 'http://127.0.0.1:11434/v1/chat/completions', protocol: 'chat-completions' },
];
function SettingsForm() {
  const initial = aiStatus();
  const [form, setForm] = createSignal<AiConfig>({ ...initial.config });
  const [key, setKey] = createSignal('');
  const [forget, setForget] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [models, setModels] = createSignal<AiModel[]>([]);
  const [error, setError] = createSignal('');
  const provider = () => PROVIDERS.find(p => p.endpoint && p.endpoint === form().endpoint)?.label ?? 'Intern';
  const update = <K extends keyof AiConfig>(field: K, value: AiConfig[K]) => { setForm(previous => ({ ...previous, [field]: value })); if (field === 'endpoint' || field === 'protocol') setModels([]); };
  const close = () => { if (!busy() && !loading()) { setKey(''); setAiSettingsOpen(false); } };
  const selectProvider = (p: typeof PROVIDERS[number]) => {
    if (provider() === p.label) return;
    setForm(f => ({ ...f, endpoint: p.endpoint, protocol: p.protocol, model: '', rememberKey: false })); setKey(''); setModels([]); setForget(false); setError('');
  };
  const loadModels = async () => {
    setLoading(true); setError(''); setModels([]);
    try { const { invoke } = await import('@tauri-apps/api/core'); setModels(await invoke<AiModel[]>('ai_models', { config: form(), apiKey: key().trim() || null, forgetKey: forget() })); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };
  const chooseModel = (id: string) => { const model = models().find(m => m.id === id); update('model', id); if (model?.outputLimit && model.outputLimit >= 256 && form().maxTokens > model.outputLimit) update('maxTokens', model.outputLimit); };
  const save = async () => {
    setBusy(true); setError('');
    try { await configureAi(form(), key(), forget()); setKey(''); setAiSettingsOpen(false); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <div class="ai-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><ModalFrame class="ai-settings" label="KI-Plugin einrichten" onClose={close}>
    <header><div><span class="eyebrow">OPTIONALES PLUGIN</span><h2>Deine KI. In deiner Notiz.</h2></div><button class="icon-btn" aria-label="KI-Einstellungen schließen" disabled={busy() || loading()} onClick={close}>×</button></header>
    <p class="ai-settings-intro">Anbieter wählen, API-Key eintragen, verfügbare Modelle laden. Mit <b>/ai</b> schreibst du anschließend direkt im Dokument.</p>
    <Show when={!isTauri}><p class="ai-notice">Editor-Vorschau: Verbindung und Schlüsselablage sind in der Desktop-App verfügbar.</p></Show>
    <form onSubmit={e => { e.preventDefault(); void save(); }}>
      <fieldset disabled={busy() || loading()}>
        <label class="ai-activation"><span><b>KI-Assistent aktivieren</b><small>Anfragen starten nur auf deinen ausdrücklichen Klick.</small></span><input type="checkbox" checked={form().enabled} onChange={e => update('enabled', e.currentTarget.checked)} /></label>
        <div class="ai-provider-select" aria-label="KI-Anbieter"><For each={PROVIDERS}>{p => <button type="button" classList={{ selected: provider() === p.label }} onClick={() => selectProvider(p)}>{p.label}</button>}</For></div>
        <label class="ai-field">API-Endpoint<input type="url" placeholder="https://ki.firma.de/v1/chat/completions" value={form().endpoint} required={form().enabled} onInput={e => update('endpoint', e.currentTarget.value)} spellcheck={false} /></label>
        <Show when={provider() === 'Intern'}><label class="ai-field">Protokoll<select value={form().protocol} onChange={e => update('protocol', e.currentTarget.value as AiConfig['protocol'])}><option value="chat-completions">OpenAI Chat Completions</option><option value="responses">OpenAI Responses</option><option value="anthropic">Anthropic Messages</option><option value="gemini">Gemini Generate Content</option></select></label></Show>
        <label class="ai-field">API-Key <span class="ai-optional">{provider() === 'Intern' || provider() === 'Lokal' ? 'optional' : 'API-Zugang des Anbieters'}</span><input type="password" autocomplete="new-password" placeholder={initial.hasKey && form().endpoint === initial.config.endpoint && !forget() ? 'Key vorhanden · leer lassen zum Behalten' : 'API-Key des ausgewählten Dienstes'} value={key()} onInput={e => { setKey(e.currentTarget.value); setForget(false); setModels([]); }} /></label>
        <Show when={form().endpoint !== initial.config.endpoint && initial.hasKey}><p class="ai-field-hint">Neuer Anbieter/Endpoint: Der bisherige Key wird nicht übernommen.</p></Show>
        <div class="ai-key-options"><label><input type="checkbox" disabled={!initial.keychainAvailable} checked={form().rememberKey} onChange={e => update('rememberKey', e.currentTarget.checked)} /> Im macOS-Schlüsselbund behalten</label><Show when={initial.hasKey}><button type="button" class="ai-text-button" onClick={() => { setForget(true); setKey(''); setModels([]); update('rememberKey', false); }}>{forget() ? 'Wird beim Speichern entfernt' : 'Key entfernen'}</button></Show></div>
        <p class="ai-field-hint">Sonst gilt der Key bis zum Beenden der App. Er wird nicht in Notizen oder Einstellungsdateien gespeichert.</p>
        <div class="ai-model-loader"><button type="button" class="ai-primary" disabled={!isTauri || !form().endpoint.trim()} onClick={() => void loadModels()}>{loading() ? 'Lädt …' : 'Modelle laden'}</button><small>{models().length ? `${models().length} Textmodelle vom Dienst geladen` : 'Fragt mit deinem Key das Modellverzeichnis ab.'}</small></div>
        <Show when={models().length}><select class="ai-model-select" aria-label="Verfügbare Modelle" value={form().model} onChange={e => chooseModel(e.currentTarget.value)}><option value="">Modell auswählen …</option><For each={models()}>{m => <option value={m.id}>{m.name === m.id ? m.id : `${m.name} · ${m.id}`}</option>}</For></select></Show>
        <label class="ai-field">Modell-ID<input placeholder="Aus der Liste wählen oder manuell eintragen" value={form().model} required={form().enabled} onInput={e => update('model', e.currentTarget.value)} spellcheck={false} /></label>
        <div class="ai-field-row"><label class="ai-field">Maximale Antwort-Tokens<input type="number" min="256" max="32768" step="1" value={form().maxTokens} onInput={e => update('maxTokens', Number(e.currentTarget.value))} /></label></div>
        <p class="ai-field-hint">OpenAI, Claude und Gemini nutzen ihre jeweiligen APIs. Ein API-Key und passende Berechtigungen sind erforderlich. Verfügbarkeit und Kosten bestimmt dein Anbieter. Interne Dienste dürfen ohne Key arbeiten.</p>
      </fieldset>
      <Show when={error()}><p class="ai-error" role="alert">{error()}</p></Show>
      <footer><span>Direkt zu deinem Anbieter.</span><button type="submit" class="ai-primary" disabled={busy() || loading() || !isTauri}>{busy() ? 'Wird gespeichert …' : 'Einstellungen speichern'}</button></footer>
    </form>
  </ModalFrame></div>;
}
export default function AiSettings() { return <Show when={aiSettingsOpen()}><SettingsForm /></Show>; }
