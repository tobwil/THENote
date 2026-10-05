/**
 * Building blocks for the slash menu: a mix of the operative (meeting notes, a
 * decision matrix, the Werkzeugkasten helpers), the calming (a focus timer, a
 * breathing exercise, a short check-in) and the playful (the Spielplatz).
 * Each one is plain Markdown that lands in the current note; the code blocks
 * run like any other block, so they are a starting point for your own
 * automations. Werkzeugkasten and Spielplatz sections are read from the
 * example notes, so there is one copy of their code.
 */
import playground from "../examples/Spielplatz.md?raw";
import toolbox from "../examples/Werkzeugkasten.md?raw";

/** The `## …` section of an example note whose heading contains `title`, up to the next `## `. */
export function exampleSection(markdown: string, title: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex(line => line.startsWith("## ") && line.includes(title));
  if (start < 0) throw new Error(`Section "${title}" not found`);
  let end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  if (end < 0) end = lines.length;
  return lines.slice(start, end).join("\n").trim();
}

const today = () => new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

const FOCUS = `## 🍅 Fokuszeit

Eine Sache, 25 Minuten, Benachrichtigungen aus. Starte mit **▶ Ausführen**, stoppen kannst du jederzeit mit **■**. Am Ende meldet sich der Mac.

- [ ] Woran arbeite ich jetzt?

\`\`\`python
import shutil, subprocess, time

MINUTEN, PAUSE = 25, 5   # ← anpassen

def melden(text):
    print(text, flush=True)
    if shutil.which("osascript"):
        subprocess.run(["osascript", "-e", f'display notification "{text}" with title "THE Note"'])

print(f"🍅 {MINUTEN} Minuten Fokus. Los geht's.\\n", flush=True)
for rest in range(MINUTEN, 0, -1):
    fertig = MINUTEN - rest
    print(f"  {'●' * fertig}{'○' * rest}  noch {rest} min", flush=True)
    time.sleep(60)
melden(f"Geschafft! Jetzt {PAUSE} Minuten Pause: aufstehen, Wasser, Fenster.")
\`\`\``;

const BREATH = `## 🌬 Box-Atmung

Vier Sekunden einatmen, halten, ausatmen, halten. Vier Runden, gut eine Minute. Hilft vor Gesprächen, nach Stress und vor dem Einschlafen.

\`\`\`python
import time

RUNDEN, TAKT = 4, 4   # ← Runden und Sekunden pro Phase
PHASEN = ["Einatmen", "Halten  ", "Ausatmen", "Halten  "]

print("Setz dich bequem hin, Schultern locker, Blick weich.\\n", flush=True)
time.sleep(3)
for runde in range(1, RUNDEN + 1):
    for phase in PHASEN:
        for s in range(1, TAKT + 1):
            print(f"  Runde {runde}/{RUNDEN}   {phase}  {'●' * s}{'·' * (TAKT - s)}", flush=True)
            time.sleep(1)
    print(flush=True)
print("Gut gemacht. Spür kurz nach: Wie geht es dir jetzt?")
\`\`\``;

const CHECKIN = () => `## ☀︎ Tagesfokus · ${today()}

**Das Wichtigste heute:**

- [ ]
- [ ]
- [ ]

**Wie geht es mir?** 😌 gut · 😐 geht so · 😣 angespannt

**Was lasse ich heute bewusst weg?** `;

const GRATITUDE = `## 🌱 Drei gute Dinge

Kleine Dinge zählen. Was war heute gut, und was hast du dazu beigetragen?

1.
2.
3.

> Warum war das gut?`;

const GROUNDING = `## 🖐 5-4-3-2-1: Kurz ankommen

Wenn der Kopf zu voll ist: Sinne der Reihe nach durchgehen und abhaken.

- [ ] **5** Dinge, die ich sehe
- [ ] **4** Dinge, die ich spüre
- [ ] **3** Dinge, die ich höre
- [ ] **2** Dinge, die ich rieche
- [ ] **1** Sache, die ich schmecke`;

const MEETING = () => `## Besprechung · ${today()}

**Dabei:**

### Agenda

1.

### Entscheidungen

-

### Aufgaben

- [ ] Wer · Was · Bis wann`;

const DECISION = `## ⚖ Entscheidung

Bewerte jede Option von 1 bis 5 und gewichte, was dir wichtig ist. Die Tabelle rechnet mit.

| Kriterium | Gewicht | Option A | Option B | A gewichtet | B gewichtet |
| --- | --- | --- | --- | --- | --- |
| Kosten | 3 | 4 | 2 | =B2*C2 | =B2*D2 |
| Zeitaufwand | 2 | 2 | 5 | =B3*C3 | =B3*D3 |
| Freude | 2 | 5 | 3 | =B4*C4 | =B4*D4 |
| Risiko | 1 | 3 | 4 | =B5*C5 | =B5*D5 |
| **Summe** | | | | =SUMME(E2:E5) | =SUMME(F2:F5) |`;

/** Snippet ids → the Markdown they insert (built on demand, so dates are current). */
export const SNIPPETS = {
  focusTimer: () => FOCUS,
  breathing: () => BREATH,
  checkIn: CHECKIN,
  gratitude: () => GRATITUDE,
  grounding: () => GROUNDING,
  meeting: MEETING,
  decision: () => DECISION,
  runtimes: () => exampleSection(toolbox, "Was ist auf diesem Rechner"),
  folderOverview: () => exampleSection(toolbox, "Worum geht es in diesem Ordner"),
  gitGlance: () => exampleSection(toolbox, "Git auf einen Blick"),
  calendar: () => exampleSection(toolbox, "Kalender im Kopf"),
  expenses: () => exampleSection(toolbox, "Ausgaben schnell auswerten"),
  json: () => exampleSection(toolbox, "JSON prüfen"),
  passphrase: () => exampleSection(toolbox, "Passphrase"),
  countdown: () => exampleSection(playground, "Countdown"),
  oracle: () => exampleSection(playground, "Würfelorakel"),
  pattern: () => exampleSection(playground, "Ein Muster entsteht"),
  mandelbrot: () => exampleSection(playground, "Mandelbrot"),
  aquarium: () => exampleSection(playground, "Aquarium"),
} as const;
export type SnippetId = keyof typeof SNIPPETS;

/** AI quick actions: a prompt that runs right away with the note as context. */
export const QUICK_PROMPTS = {
  summarize: "Fasse diese Notiz in 3 bis 5 prägnanten Stichpunkten zusammen. Antworte auf Deutsch in Markdown und beginne mit der Überschrift „## Zusammenfassung“.",
  nextSteps: "Leite aus dieser Notiz die konkreten nächsten Schritte ab. Antworte auf Deutsch als Markdown-Checkliste (- [ ] …) unter der Überschrift „## Nächste Schritte“. Nur Schritte, die sich aus der Notiz ergeben.",
} as const;
export type QuickPromptId = keyof typeof QUICK_PROMPTS;
