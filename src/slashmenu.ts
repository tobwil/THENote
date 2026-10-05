/**
 * Slash-menu catalogue, ranking, and trigger detection — all pure.
 *
 * Everything offered here is deliberately plain Markdown. Slash menus in MDX
 * editors lean on JSX components (callouts, accordions, tabs) that have no
 * CommonMark spelling, so this list is built only from constructs that survive
 * a round trip through a `.md` file — GitHub alerts stand in for callouts, and
 * fenced `mermaid` / `d2` blocks for diagrams.
 *
 * The items carry no behaviour: actions live in `slashactions.ts`, keyed by id,
 * so this module stays free of the command layer (and its Tauri imports) and
 * can be unit-tested on its own. `SlashItemId` is derived from this array, so
 * an item without an action fails the typecheck.
 */

export interface SlashItem {
  id: string;
  label: string;
  /** Section heading in the menu. */
  group: string;
  /** Key into `menuicons.ICONS`. */
  icon: string;
  /** Extra search terms — `h1` finds "Heading 1", `todo` finds "Task List". */
  aliases?: readonly string[];
  /** Right-aligned markdown hint, e.g. `# `. */
  hint?: string;
}

export const SLASH_ITEMS = [
  { id: "ai", label: "AI · Inline schreiben", group: "Assistent", icon: "codeBlock", aliases: ["ai", "ki", "prompt", "assistant"], hint: "/ai" },
  // ---- Basic: convert the current block ----
  { id: "text", label: "Text", group: "Basic", icon: "paragraph", aliases: ["paragraph", "plain", "body"] },
  { id: "h1", label: "Heading 1", group: "Basic", icon: "h1", aliases: ["h1", "title"], hint: "# " },
  { id: "h2", label: "Heading 2", group: "Basic", icon: "h2", aliases: ["h2"], hint: "## " },
  { id: "h3", label: "Heading 3", group: "Basic", icon: "h3", aliases: ["h3"], hint: "### " },
  { id: "ul", label: "Bullet List", group: "Basic", icon: "list", aliases: ["ul", "unordered", "bullet"], hint: "- " },
  { id: "ol", label: "Ordered List", group: "Basic", icon: "listOrdered", aliases: ["ol", "numbered", "number"], hint: "1. " },
  { id: "task", label: "Task List", group: "Basic", icon: "listTask", aliases: ["todo", "checklist", "checkbox"], hint: "- [ ] " },
  { id: "quote", label: "Quote", group: "Basic", icon: "quote", aliases: ["blockquote"], hint: "> " },
  { id: "code", label: "Code Block", group: "Basic", icon: "codeBlock", aliases: ["fence", "pre", "snippet"], hint: "```" },

  // ---- Insert ----
  { id: "date", label: "Datum einfügen", group: "Insert", icon: "table", aliases: ["date", "datum", "calendar", "kalender"], hint: "/date" },
  { id: "table", label: "Table", group: "Insert", icon: "table", aliases: ["grid"] },
  { id: "formulaTable", label: "Tabelle mit Formeln", group: "Insert", icon: "table", aliases: ["formel", "formeln", "formula", "rechnen", "excel", "summe", "sum", "kalkulation", "spreadsheet", "tabelle"], hint: "=SUMME" },
  { id: "image", label: "Image", group: "Insert", icon: "image", aliases: ["picture", "photo", "img"] },
  { id: "link", label: "Link", group: "Insert", icon: "link", aliases: ["url", "href", "hyperlink"] },
  { id: "divider", label: "Divider", group: "Insert", icon: "hr", aliases: ["hr", "rule", "separator", "line"], hint: "---" },
  { id: "math", label: "Math Block", group: "Insert", icon: "math", aliases: ["latex", "equation", "formula", "katex"], hint: "$$" },
  { id: "footnote", label: "Footnote", group: "Insert", icon: "footnote", aliases: ["fn", "ref", "reference"] },
  { id: "toc", label: "Table of Contents", group: "Insert", icon: "toc", aliases: ["outline", "contents"] },
  { id: "frontmatter", label: "YAML Front Matter", group: "Insert", icon: "frontMatter", aliases: ["yaml", "meta", "metadata"] },

  // ---- Diagram: fenced blocks Sarala renders live ----
  { id: "mermaid", label: "Mermaid Diagram", group: "Diagram", icon: "diagram", aliases: ["flowchart", "sequence", "graph", "chart"] },
  { id: "d2", label: "D2 Diagram", group: "Diagram", icon: "diagram", aliases: ["graph", "architecture"] },

  // ---- Callout: GitHub alerts, the CommonMark-compatible stand-in ----
  { id: "note", label: "Note", group: "Callout", icon: "alert", aliases: ["callout", "info", "admonition"] },
  { id: "tip", label: "Tip", group: "Callout", icon: "alert", aliases: ["callout", "hint", "admonition"] },
  { id: "important", label: "Important", group: "Callout", icon: "alert", aliases: ["callout", "admonition"] },
  { id: "warning", label: "Warning", group: "Callout", icon: "alert", aliases: ["callout", "admonition"] },
  { id: "caution", label: "Caution", group: "Callout", icon: "alert", aliases: ["callout", "danger", "admonition"] },

  // ---- AI quick actions: run at once with the note as context ----
  { id: "summarize", label: "Notiz zusammenfassen", group: "KI-Schnellaktionen", icon: "sparkle", aliases: ["zusammenfassen", "summary", "summarize", "tldr", "kurz", "ki"] },
  { id: "todos", label: "To-dos herausziehen", group: "KI-Schnellaktionen", icon: "listTask", aliases: ["todos", "to-dos", "aufgaben", "tasks", "ki"] },
  { id: "nextSteps", label: "Nächste Schritte ableiten", group: "KI-Schnellaktionen", icon: "sparkle", aliases: ["schritte", "next", "action", "ki"] },
  { id: "questions", label: "Offene Fragen sammeln", group: "KI-Schnellaktionen", icon: "sparkle", aliases: ["fragen", "questions", "unklar", "offen", "ki"] },

  // ---- Building blocks (snippets.ts): operative, calming and playful ----
  { id: "focusTimer", label: "Fokuszeit (Pomodoro)", group: "Fokus & Ruhe", icon: "timer", aliases: ["pomodoro", "timer", "fokus", "focus", "konzentration", "tomate"] },
  { id: "breathing", label: "Atemübung", group: "Fokus & Ruhe", icon: "breath", aliases: ["atmen", "breathe", "box", "ruhe", "stress", "entspannen"] },
  { id: "checkIn", label: "Tagesfokus", group: "Fokus & Ruhe", icon: "sun", aliases: ["heute", "tag", "daily", "check-in", "stimmung", "planen"] },
  { id: "gratitude", label: "Drei gute Dinge", group: "Fokus & Ruhe", icon: "leaf", aliases: ["dankbarkeit", "gratitude", "journal", "tagebuch"] },
  { id: "grounding", label: "5-4-3-2-1 Ankommen", group: "Fokus & Ruhe", icon: "breath", aliases: ["erdung", "grounding", "achtsamkeit", "ruhe", "pause"] },
  { id: "meeting", label: "Besprechungsnotiz", group: "Werkzeuge", icon: "listTask", aliases: ["meeting", "protokoll", "minutes", "agenda", "besprechung"] },
  { id: "decision", label: "Entscheidungsmatrix", group: "Werkzeuge", icon: "table", aliases: ["entscheidung", "decision", "abwägen", "matrix", "pro", "contra"] },
  { id: "folderOverview", label: "Ordner-Überblick", group: "Werkzeuge", icon: "folder", aliases: ["ordner", "dateien", "folder", "files", "aufräumen"] },
  { id: "gitGlance", label: "Git auf einen Blick", group: "Werkzeuge", icon: "codeBlock", aliases: ["git", "commits", "branch", "repo"] },
  { id: "calendar", label: "Kalender-Rechner", group: "Werkzeuge", icon: "table", aliases: ["kalender", "tage", "datum", "wochen", "calendar"] },
  { id: "expenses", label: "Ausgaben auswerten (CSV)", group: "Werkzeuge", icon: "table", aliases: ["csv", "ausgaben", "budget", "kosten", "geld"] },
  { id: "json", label: "JSON prüfen", group: "Werkzeuge", icon: "codeBlock", aliases: ["json", "format", "validieren"] },
  { id: "passphrase", label: "Passphrase & ID", group: "Werkzeuge", icon: "codeBlock", aliases: ["passwort", "password", "uuid", "id", "zufall"] },
  { id: "runtimes", label: "Was ist installiert?", group: "Werkzeuge", icon: "codeBlock", aliases: ["system", "python", "node", "laufzeiten", "speicher"] },
  { id: "checkInQuestion", label: "Check-in-Frage", group: "Moderation", icon: "users", aliases: ["checkin", "einstieg", "warmup", "frage", "runde", "moderation"] },
  { id: "speakingOrder", label: "Reihenfolge auslosen", group: "Moderation", icon: "dice", aliases: ["reihenfolge", "los", "zufall", "redeliste", "moderation"] },
  { id: "timebox", label: "Timebox für die Agenda", group: "Moderation", icon: "timer", aliases: ["timebox", "agenda", "zeit", "meeting", "moderation"] },
  { id: "crazyEights", label: "Crazy 8s", group: "Moderation", icon: "pencil", aliases: ["crazy", "ideen", "brainstorming", "kreativ", "moderation"] },
  { id: "dotVoting", label: "Punkte-Abstimmung", group: "Moderation", icon: "table", aliases: ["dot", "voting", "abstimmen", "punkte", "priorisieren", "moderation"] },
  { id: "leanCoffee", label: "Lean Coffee", group: "Moderation", icon: "table", aliases: ["lean", "coffee", "themen", "moderation"] },
  { id: "fiveWhys", label: "5 × Warum", group: "Moderation", icon: "listOrdered", aliases: ["warum", "why", "ursache", "root", "problem", "moderation"] },
  { id: "retro", label: "Retrospektive", group: "Moderation", icon: "table", aliases: ["retro", "start", "stop", "rückblick", "moderation"] },
  { id: "roseBudThorn", label: "Rose · Knospe · Dorn", group: "Moderation", icon: "leaf", aliases: ["rose", "reflexion", "feedback", "moderation"] },
  { id: "roti", label: "ROTI-Feedback", group: "Moderation", icon: "table", aliases: ["roti", "feedback", "bewertung", "zeit", "moderation"] },
  { id: "countdown", label: "Countdown", group: "Spielplatz", icon: "sparkle", aliases: ["rakete", "start", "launch", "spiel"] },
  { id: "oracle", label: "Würfelorakel", group: "Spielplatz", icon: "dice", aliases: ["würfel", "orakel", "zufall", "entscheiden", "spiel"] },
  { id: "pattern", label: "Ein Muster entsteht", group: "Spielplatz", icon: "sparkle", aliases: ["muster", "sierpinski", "kunst", "spiel"] },
  { id: "mandelbrot", label: "Mandelbrot", group: "Spielplatz", icon: "sparkle", aliases: ["fraktal", "fractal", "kunst", "spiel"] },
  { id: "aquarium", label: "Aquarium", group: "Spielplatz", icon: "sparkle", aliases: ["fische", "animation", "spiel"] },
] as const satisfies readonly SlashItem[];

export type SlashItemId = (typeof SLASH_ITEMS)[number]["id"];

/**
 * Rank items against a `/` query. Prefix matches on the label sort above
 * word-start matches, which sort above alias-only hits, so `/co` leads with
 * "Code Block" rather than a callout that merely lists `callout` as an alias.
 * An empty query keeps the catalogue's own (grouped) order.
 */
export function filterSlashItems(
  query: string,
  items: readonly SlashItem[] = SLASH_ITEMS,
): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  const scored: { item: SlashItem; rank: number; index: number }[] = [];
  items.forEach((item, index) => {
    const label = item.label.toLowerCase();
    let rank = -1;
    if (label.startsWith(q)) rank = 0;
    else if (label.split(/\s+/).some((w) => w.startsWith(q))) rank = 1;
    else if (item.aliases?.some((a) => a.toLowerCase().startsWith(q))) rank = 2;
    else if (label.includes(q)) rank = 3;
    else if (item.aliases?.some((a) => a.toLowerCase().includes(q))) rank = 4;
    if (rank >= 0) scored.push({ item, rank, index });
  });
  scored.sort((a, b) => a.rank - b.rank || a.index - b.index);
  return scored.map((s) => s.item);
}

export interface SlashTrigger {
  /** Offset of the `/` itself. */
  start: number;
  /** Text between the `/` and the caret. */
  query: string;
}

/**
 * The active `/query` token ending at `caret`, or null.
 *
 * A slash only triggers at the start of a line or after whitespace, so file
 * paths (`src/foo`), URLs, and closing tags never open the menu. The query
 * stops at whitespace — typing a space dismisses rather than searching on.
 */
export function slashTriggerAt(text: string, caret: number): SlashTrigger | null {
  const upto = text.slice(0, Math.max(0, Math.min(caret, text.length)));
  const m = upto.match(/(?:^|[\s>])\/([^\s/]*)$/);
  if (!m) return null;
  return { start: upto.length - m[1].length - 1, query: m[1] };
}
