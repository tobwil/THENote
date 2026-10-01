/** THE Note has no release channel yet. Never install Sarala's upstream binaries. */
import { createSignal } from 'solid-js';
import { alertDialog } from './platform';
export type UpdatePhase = { kind: 'idle' } | { kind: 'checking' } | { kind: 'downloading'; percent: number; total: number; received: number } | { kind: 'installing' };
export interface UpdateInfo { version: string; notes: string }
export const [updatePhase] = createSignal<UpdatePhase>({ kind: 'idle' });
export const [availableUpdate] = createSignal<UpdateInfo | null>(null);
export const [updateError] = createSignal('');
export function formatMegabytes(bytes: number) { const mb = bytes / 1_000_000; return `${mb < 100 ? mb.toFixed(1) : Math.round(mb)} MB`; }
export function dismissUpdate() { /* No pending update. */ }
export async function autoCheckForUpdates() { /* No network calls. */ }
export async function checkForUpdates() { await alertDialog('THE Note 0.1 ist eine lokale Entwicklungsversion. Updates werden manuell installiert.', 'THE Note'); }
export async function startInstall() { await checkForUpdates(); }
