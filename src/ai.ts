import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isTauri } from './platform';
import { activeTabId, fullText } from './store';
import { DEFAULT_CONFIG, buildChatRequest, emptyChat, type AiConfig, type AiStatus, type Message } from './ai/model';
export const [aiSettingsOpen, setAiSettingsOpen] = createSignal(false);
export const [aiStatus, setAiStatus] = createSignal<AiStatus>({ config: DEFAULT_CONFIG, hasKey: false, keychainAvailable: false });
export const [aiError, setAiError] = createSignal('');
let loadPromise: Promise<void> | undefined;
let listener: Promise<unknown> | undefined;
export async function initializeAi(refresh = false) {
  if (loadPromise && !refresh) return loadPromise;
  loadPromise = (async () => {
    if (isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      setAiStatus(await invoke<AiStatus>('ai_status'));
    }
    setAiError('');
  })().catch(error => { setAiError(String(error)); loadPromise = undefined; });
  return loadPromise;
}
export async function openAiSettings() { await initializeAi(true); setAiSettingsOpen(true); }
export async function configureAi(config: AiConfig, apiKey: string, forgetKey: boolean) {
  if (!isTauri) throw new Error('Die KI-Anbindung ist nur in der Desktop-App verfügbar.');
  const { invoke } = await import('@tauri-apps/api/core');
  setAiStatus(await invoke<AiStatus>('ai_configure', { config, apiKey: apiKey.trim() || null, forgetKey }));
  setAiError('');
}
async function listenForAi() {
  if (!listener) listener = import('@tauri-apps/api/event').then(({ listen }) => listen<{ id: string; kind: string; text: string }>('note-ai', ({ payload }) => {
    for (const [block, run] of Object.entries(inlineRuns)) {
      if (run.id !== payload.id || run.status !== 'streaming') continue;
      if (payload.kind === 'delta') setInlineRuns(Number(block), 'content', text => text + payload.text);
      else setInlineRuns(Number(block), { status: payload.kind as Message['status'], ...(payload.kind === 'error' ? { error: payload.text } : {}) });
    }
  })).catch(error => { listener = undefined; throw error; });
  await listener;
}

export interface InlineRun { id: string; tab: number; block: number; source: string; content: string; status: Message['status']; error?: string; model: string; contextAttached: boolean }
export const [inlineRuns, setInlineRuns] = createStore<Record<number, InlineRun>>({});
const inlineStarting = new Set<number>();
export async function runInlineAi(block: number, source: string, prompt: string, includeDocument: boolean) {
  if (inlineStarting.has(block) || inlineRuns[block]?.status === 'streaming') return;
  const tab = activeTabId(), id = crypto.randomUUID(), config = aiStatus().config;
  inlineStarting.add(block);
  setInlineRuns(block, { id, tab, block, source, content: '', status: 'streaming', error: undefined, model: config.model, contextAttached: includeDocument });
  try {
    if (!isTauri) throw new Error('Die KI-Anbindung funktioniert in der Desktop-App.');
    const request = buildChatRequest({ ...emptyChat(), includeDocument }, prompt, fullText(), id, config);
    await listenForAi();
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('ai_start', { request });
  } catch (error) { setInlineRuns(block, { status: 'error', error: error instanceof Error ? error.message : String(error) }); }
  finally { inlineStarting.delete(block); }
}
export async function stopInlineAi(block: number) {
  const run = inlineRuns[block]; if (!run || run.status !== 'streaming' || !isTauri) return;
  try { const { invoke } = await import('@tauri-apps/api/core'); await invoke('ai_cancel', { id: run.id }); }
  catch { setInlineRuns(block, 'error', 'Die Anfrage konnte nicht gestoppt werden.'); }
}
export function discardInlineResult(block: number) { if (inlineRuns[block]?.status !== 'streaming') setInlineRuns(block, undefined!); }
