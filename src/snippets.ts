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

// ---- Moderation: methods for meetings and workshops ----

const CHECKIN_QUESTION = `## 🎤 Check-in-Frage

Eine Runde, ein Satz pro Person: Kommentieren ist nicht, nur zuhören. Starte den Block für eine neue Frage.

\`\`\`python
import random

FRAGEN = [
    "Was hat dich diese Woche überrascht?",
    "Welches Wetter beschreibt deine Stimmung gerade?",
    "Worauf freust du dich heute noch?",
    "Was brauchst du, damit dieses Treffen für dich gut wird?",
    "Welches kleine Erfolgserlebnis hattest du zuletzt?",
    "Wenn dieses Projekt ein Tier wäre: welches, und warum?",
    "Was hast du kürzlich gelernt?",
    "Ein Wort für deinen Kopf, eines für deinen Bauch?",
]   # ← eigene Fragen ergänzen

print("🎤", random.choice(FRAGEN))
\`\`\``;

const SPEAKING_ORDER = `## 🔀 Reihenfolge auslosen

Wer fängt an? Fair und ohne Diskussion.

\`\`\`python
import random

NAMEN = ["Anna", "Ben", "Chris", "Dana", "Emil"]   # ← eure Namen

random.shuffle(NAMEN)
print("Reihenfolge für heute:\\n")
for platz, name in enumerate(NAMEN, 1):
    print(f"  {platz}. {name}")
\`\`\``;

const TIMEBOX = `## ⏱ Timebox für die Agenda

Jeder Punkt bekommt seine Zeit. Beim Wechsel meldet sich der Mac; stoppen jederzeit mit **■**.

\`\`\`python
import shutil, subprocess, time

AGENDA = [("Ankommen", 5), ("Updates", 10), ("Thema der Woche", 20), ("Nächste Schritte", 5)]   # ← Punkt, Minuten

def gong(text):
    print(text, flush=True)
    if shutil.which("osascript"):
        subprocess.run(["osascript", "-e", f'display notification "{text}" with title "THE Note · Timebox"'])

print(f"⏱ {len(AGENDA)} Punkte, {sum(m for _, m in AGENDA)} Minuten\\n", flush=True)
for nummer, (punkt, minuten) in enumerate(AGENDA, 1):
    gong(f"{nummer}. {punkt} · {minuten} min")
    for rest in range(minuten, 0, -1):
        print(f"     noch {rest} min", flush=True)
        time.sleep(60)
gong("Zeit ist um. Danke euch!")
\`\`\``;

const CRAZY_EIGHTS = `## ✏️ Crazy 8s

Acht Ideen in acht Minuten, eine pro Minute. Blatt achtmal falten, Stift raus, Qualität egal.

\`\`\`python
import time

IDEEN, SEKUNDEN = 8, 60   # ← Anzahl und Zeit pro Idee

print("Thema laut vorlesen, dann geht's los.\\n", flush=True)
time.sleep(5)
for idee in range(1, IDEEN + 1):
    print(f"  ✏️  Idee {idee} von {IDEEN}", flush=True)
    time.sleep(SEKUNDEN)
print("\\nStifte weg! Jede Person stellt ihre zwei liebsten Ideen vor.")
\`\`\``;

const RETRO = `## 🔁 Retrospektive

Was beginnen wir, was lassen wir, was behalten wir? Erst sammeln, dann über die wichtigsten sprechen.

| ▶ Start | ■ Stop | ↻ Weiter so |
| --- | --- | --- |
|  |  |  |
|  |  |  |

### Vereinbarungen

- [ ] Wer · Was · Bis wann`;

const DOT_VOTING = `## 🔴 Punkte-Abstimmung

Jede Person verteilt drei Punkte. Die Tabelle zählt mit.

| Idee | Anna | Ben | Chris | Punkte |
| --- | --- | --- | --- | --- |
| Idee 1 | 2 | 0 | 1 | =SUMME(B2:D2) |
| Idee 2 | 1 | 2 | 0 | =SUMME(B3:D3) |
| Idee 3 | 0 | 1 | 2 | =SUMME(B4:D4) |
| **Alle** | =SUMME(B2:B4) | =SUMME(C2:C4) | =SUMME(D2:D4) | =SUMME(E2:E4) |`;

const FIVE_WHYS = `## ❓ 5 × Warum

Von einem Symptom zur Ursache: fünfmal nachfragen, jedes Mal auf die vorige Antwort.

**Problem:** 

1. Warum? 
2. Warum? 
3. Warum? 
4. Warum? 
5. Warum? 

**Ursache:** 

- [ ] Maßnahme`;

const ROSE_BUD_THORN = `## 🌹 Rose · Knospe · Dorn

Kurze Reflexion für Projekte, Wochen oder Workshops.

- 🌹 **Rose:** Was lief gut?
- 🌱 **Knospe:** Wo steckt Potenzial?
- 🌵 **Dorn:** Was hat gehakt?`;

const LEAN_COFFEE = `## ☕ Lean Coffee

Themen sammeln, per Punkt abstimmen, dann der Reihe nach je 5 Minuten. Daumen hoch heißt: weiter, Daumen runter: nächstes Thema.

| Zu besprechen | Läuft | Erledigt |
| --- | --- | --- |
|  |  |  |
|  |  |  |

**Erkenntnisse:** `;

const ROTI = `## 📈 ROTI: Hat sich die Zeit gelohnt?

Return on Time Invested: Jede Person gibt 1 (verschwendet) bis 5 (hat sich sehr gelohnt).

| Person | Wert |
| --- | --- |
| Anna | 4 |
| Ben | 3 |
| Chris | 5 |
| **Durchschnitt** | =RUNDEN(MITTELWERT(B2:B4); 1) |`;

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
  checkInQuestion: () => CHECKIN_QUESTION,
  speakingOrder: () => SPEAKING_ORDER,
  timebox: () => TIMEBOX,
  crazyEights: () => CRAZY_EIGHTS,
  retro: () => RETRO,
  dotVoting: () => DOT_VOTING,
  fiveWhys: () => FIVE_WHYS,
  roseBudThorn: () => ROSE_BUD_THORN,
  leanCoffee: () => LEAN_COFFEE,
  roti: () => ROTI,
} as const;
export type SnippetId = keyof typeof SNIPPETS;

/** AI quick actions: a prompt that runs right away with the note as context. */
export const QUICK_PROMPTS = {
  summarize: "Fasse diese Notiz in 3 bis 5 prägnanten Stichpunkten zusammen. Antworte auf Deutsch in Markdown und beginne mit der Überschrift „## Zusammenfassung“.",
  todos: "Sammle alle To-dos aus dieser Notiz als Markdown-Checkliste (- [ ] …) unter der Überschrift „## To-dos“. Wenn erkennbar, nenne wer und bis wann im Format „Aufgabe · Wer · Bis wann“. Antworte auf Deutsch und erfinde nichts dazu.",
  questions: "Sammle die offenen Fragen und ungeklärten Punkte dieser Notiz als Markdown-Liste unter der Überschrift „## Offene Fragen“. Antworte auf Deutsch und erfinde nichts dazu.",
  nextSteps: "Leite aus dieser Notiz die konkreten nächsten Schritte ab. Antworte auf Deutsch als Markdown-Checkliste (- [ ] …) unter der Überschrift „## Nächste Schritte“. Nur Schritte, die sich aus der Notiz ergeben.",
} as const;
export type QuickPromptId = keyof typeof QUICK_PROMPTS;

/** The Moderationskoffer template: every moderation method in one note. */
export function facilitationNote(): string {
  const methods = ["checkInQuestion", "speakingOrder", "timebox", "crazyEights", "dotVoting", "leanCoffee", "fiveWhys", "retro", "roseBudThorn", "roti"] as const;
  return "# Der Moderationskoffer\n\nMethoden für Meetings und Workshops: ankommen, Ideen finden, entscheiden, zurückblicken. Jede gibt es auch einzeln über **/** in jeder Notiz.\n\n" + methods.map(id => SNIPPETS[id]()).join("\n\n") + "\n";
}
