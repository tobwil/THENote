import { createSignal } from 'solid-js';

// Focus is an explicit insertion intent. The old Markdown block can lose its
// active state while its contenteditable is replaced by the inline AI field.
export const [requestedInlineFocus, requestInlineFocus] = createSignal<number | null>(null);
