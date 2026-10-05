import { openDatePicker } from "./components/DatePicker";
/**
 * What each slash-menu item does. Split from the catalogue so `slashmenu.ts`
 * stays pure (and unit-testable without the command layer's Tauri imports).
 *
 * Typed as `Record<SlashItemId, …>`, so adding an item to `SLASH_ITEMS`
 * without an action here is a typecheck failure rather than a dead menu row.
 *
 * Everything delegates to the existing command layer — the slash menu is a
 * second surface onto the Paragraph/Format menus, not a parallel implementation.
 */

import { executeCommand, insertFencedBlock, insertQuickPrompt, insertSnippet, setBlockKind } from "./commands";
import type { BlockKind } from "./blocktype";
import type { SlashItemId } from "./slashmenu";

const block = (kind: BlockKind) => () => setBlockKind(kind);
const cmd = (id: string) => () => executeCommand(id);

export const SLASH_ACTIONS: Record<SlashItemId, () => void> = {
  date: openDatePicker,
  ai: () => insertFencedBlock("ai", ""),
  text: block("paragraph"),
  h1: block("h1"),
  h2: block("h2"),
  h3: block("h3"),
  ul: block("bullet"),
  ol: block("ordered"),
  task: block("task"),
  quote: block("quote"),
  code: block("code"),

  table: cmd("paragraph.table.insert"),
  formulaTable: cmd("paragraph.table.formula"),
  image: cmd("format.image.insert"),
  link: cmd("format.hyperlink"),
  divider: cmd("paragraph.hr"),
  math: cmd("paragraph.math_block"),
  footnote: cmd("paragraph.footnote"),
  toc: cmd("paragraph.toc"),
  frontmatter: cmd("paragraph.front_matter"),

  mermaid: () => insertFencedBlock("mermaid", "flowchart TD\n  A[Start] --> B[End]"),
  d2: () => insertFencedBlock("d2", "a -> b"),

  note: cmd("paragraph.alert.note"),
  tip: cmd("paragraph.alert.tip"),
  important: cmd("paragraph.alert.important"),
  warning: cmd("paragraph.alert.warning"),
  caution: cmd("paragraph.alert.caution"),

  summarize: () => insertQuickPrompt("summarize"),
  nextSteps: () => insertQuickPrompt("nextSteps"),
  focusTimer: () => insertSnippet("focusTimer"),
  breathing: () => insertSnippet("breathing"),
  checkIn: () => insertSnippet("checkIn"),
  gratitude: () => insertSnippet("gratitude"),
  grounding: () => insertSnippet("grounding"),
  meeting: () => insertSnippet("meeting"),
  decision: () => insertSnippet("decision"),
  folderOverview: () => insertSnippet("folderOverview"),
  gitGlance: () => insertSnippet("gitGlance"),
  calendar: () => insertSnippet("calendar"),
  expenses: () => insertSnippet("expenses"),
  json: () => insertSnippet("json"),
  passphrase: () => insertSnippet("passphrase"),
  runtimes: () => insertSnippet("runtimes"),
  countdown: () => insertSnippet("countdown"),
  oracle: () => insertSnippet("oracle"),
  pattern: () => insertSnippet("pattern"),
  mandelbrot: () => insertSnippet("mandelbrot"),
  aquarium: () => insertSnippet("aquarium"),
};
