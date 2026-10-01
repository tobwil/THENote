export type ApiProtocol = 'responses' | 'chat-completions' | 'anthropic' | 'gemini';
export interface AiConfig { enabled: boolean; endpoint: string; protocol: ApiProtocol; model: string; maxTokens: number; rememberKey: boolean }
export interface AiStatus { config: AiConfig; hasKey: boolean; keychainAvailable: boolean }
export interface Message { id: string; role: 'user' | 'assistant'; content: string; status?: 'streaming' | 'done' | 'cancelled' | 'incomplete' | 'error'; error?: string; contextAttached?: boolean }
export interface Chat { messages: Message[]; draft: string; includeDocument: boolean; pending: string | null; connection: string | null }
export const DEFAULT_CONFIG: AiConfig = { enabled: false, endpoint: '', protocol: 'chat-completions', model: '', maxTokens: 4096, rememberKey: false };
export function connectionId(config: AiConfig) { return JSON.stringify([config.endpoint, config.protocol, config.model]); }
export function buildChatRequest(chat: Chat, question: string, markdown: string, id: string, config: AiConfig) {
  if (!config.enabled) throw new Error('Aktiviere zuerst das KI-Plugin.');
  if (!question.trim()) throw new Error('Bitte eine Frage eingeben.');
  if (chat.pending) throw new Error('Eine Antwort wird bereits erzeugt.');
  if (chat.connection && chat.connection !== connectionId(config)) throw new Error('Die Verbindung wurde geändert. Starte einen neuen Chat, bevor du den Verlauf an einen anderen Anbieter oder ein anderes Modell sendest.');
  const messages = chat.messages.filter(m => m.role === 'user' || m.status === 'done').map(({ role, content }) => ({ role, content }));
  messages.push({ role: 'user', content: question.trim() });
  if (messages.length > 60) throw new Error('Der Chat ist voll. Bitte einen neuen Chat starten.');
  const context = chat.includeDocument ? markdown : null;
  if (new TextEncoder().encode(messages.map(m => m.content).join('') + (context ?? '')).length > 256 * 1024) throw new Error('Chat und Dokumentkontext überschreiten 256 KB. Bitte Kontext verkürzen oder einen neuen Chat starten.');
  return { id, messages, context, connection: connectionId(config) };
}
export function emptyChat(): Chat { return { messages: [], draft: '', includeDocument: false, pending: null, connection: null }; }

export interface AiModel { id: string; name: string; outputLimit: number | null }
