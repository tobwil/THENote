import { fullText, loadDocument, openDocument, doc, setSidebarTab } from './store';
import playground from '../examples/Spielplatz.md?raw';
import toolbox from '../examples/Werkzeugkasten.md?raw';
import { facilitationNote } from './snippets';
export const WELCOME = `# Gedanken, die etwas bewegen.

Ein ruhiger Ort zum Denken. Und die Werkzeuge, um aus einer Idee etwas zu machen. Willkommen in **THE Note**.

> Schreibe in Markdown. Klicke in einen Absatz, um ihn zu bearbeiten. Führe Code genau dort aus, wo deine Gedanken entstehen.

## Von der Notiz zum Ergebnis

Dokumentation und Ausführung gehören zusammen. Dieser kleine Python-Block macht aus drei Ideen einen konkreten Anfang. Starte ihn mit **▶ Ausführen** oder **⌘↵**.

\`\`\`python
ideen = ["Klarer denken", "Weniger wechseln", "Mehr machen"]

for nummer, idee in enumerate(ideen, 1):
    print(f"{nummer:02d}  {idee}")

print("\\nEin guter Anfang. ✦")
\`\`\`

## Dein nächster Schritt

- [ ] Einen Ordner als Workspace öffnen
- [ ] Diese Notiz als Markdown speichern
- [ ] Einen eigenen Codeblock ausprobieren

> **Lust auf mehr?** Tippe **/** in eine Zeile: Fokuszeit, Atemübung, Entscheidungsmatrix, kleine Werkzeuge oder **Notiz zusammenfassen** landen direkt in deiner Notiz. Ganze Vorlagen wie den **Spielplatz** und den **Werkzeugkasten** findest du über **⌄** neben dem **+** oben bei den Tabs.

### Alles an seinem Platz

| Schreiben | Verstehen | Machen |
| :--- | :--- | :--- |
| Live-Markdown & Fokusmodus | Formeln & Diagramme | Code mit direkter Ausgabe |
| Tabs & Volltextsuche | Gliederung & Vorschau | Lokaler Workspace & Kontext |

Deine Dateien bleiben **deine Dateien**. Kein Account. Kein proprietäres Notizformat. Einfach Markdown.
`;
export const TEMPLATES = {
  blank: '',
  journal: '# Ein neuer Gedanke\n\nWas beschäftigt dich gerade?\n\n## Notizen\n\n\n\n## Nächste Schritte\n\n- [ ] Ein kleiner, konkreter Schritt\n',
  runbook: '---\ncwd: .\nconfirm: true\nenv:\n  PROJECT: THE-Note\n---\n\n# Mein Runbook\n\nEin Ziel. Klare Schritte. Sichtbare Ergebnisse.\n\n## 01 · Kontext prüfen\n\n```sh\nprintf "Projekt: %s\\n" "$PROJECT"\npwd\n```\n\n## 02 · Daten verarbeiten\n\n```python\nwerte = [12, 18, 24, 30]\nprint(f"Mittelwert: {sum(werte) / len(werte):.1f}")\n```\n\n## 03 · Ergebnis festhalten\n\n- [ ] Ergebnisse geprüft\n- [ ] Nächsten Schritt dokumentiert\n',
  playground,
  toolbox,
  get facilitation() { return facilitationNote(); },
  diagram: '# Eine Idee nimmt Form an\n\n## Der Ablauf\n\n```mermaid\nflowchart LR\n    A[Idee] --> B[Notiz]\n    B --> C[Experiment]\n    C --> D[Erkenntnis]\n    D --> B\n```\n\n## Die Annahme\n\nWas möchtest du herausfinden?\n',
};
export type TemplateId = keyof typeof TEMPLATES;
export function newNotebook(template: TemplateId) { openDocument(TEMPLATES[template], null); }
export function initializeNotebook() {
  if (!fullText().trim() && !doc.filePath && !doc.dirty) { loadDocument(WELCOME, null); setSidebarTab('outline'); }
}
