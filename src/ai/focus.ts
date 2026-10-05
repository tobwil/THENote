import { createSignal } from 'solid-js';

// Focus is an explicit insertion intent. The old Markdown block can lose its
// active state while its contenteditable is replaced by the inline AI field.
export const [requestedInlineFocus, requestInlineFocus] = createSignal<number | null>(null);

// Quick actions (/zusammenfassen …) start their prompt as soon as the block mounts, with the note as context.
const quickRuns = new Set<number>();
export function requestQuickRun(block: number) { quickRuns.add(block); }
export function takeQuickRun(block: number): boolean { return quickRuns.delete(block); }
