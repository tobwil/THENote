# THE Note

Ein lokales Arbeitsbuch, das **Saralas Live-Markdown-Editor** mit **Ledges ausführbaren Notizen** verbindet. Native macOS-App auf Tauri 2 und SolidJS. Aktueller Stand: **0.2.3, funktionale Entwicklungsversion**.

## Download und erster Start

[**macOS Apple Silicon · v0.2.3 herunterladen**](https://github.com/tobwil/THENote/releases/tag/v0.2.3) · [Changelog](CHANGELOG.md) · [Lizenz und Herkunft](LICENSING.md)

ZIP entpacken und **THE Note.app** öffnen. Vor einem Update offene Notizen speichern und die bisherige App beenden. Die Entwicklungsversion ist lokal/ad-hoc signiert und **nicht Apple-notarisiert**; macOS kann beim ersten Start eine Sicherheitsbestätigung verlangen. Windows-, Linux- und Intel-Mac-Pakete sind noch nicht verifiziert.

Node.js und Python werden nur für ihre jeweiligen Codeblöcke benötigt. Der Editor selbst läuft eigenständig. Alternativ lässt sich die App aus dem Quellcode bauen; siehe **Entwickeln** unten.

## Danke, Sarala und Ledge

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von **Srinivas Gowda** und dem Konzept ausführbarer Notizen aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Sarala liefert die Editorbasis; aus Ledge stammt außerdem der Frontmatter-Parser. Beide Projekte sind echte Grundlagen dieser Arbeit. Der neue lokale Rust-Runner und die THE-Note-Erweiterungen sind hier dokumentiert.

Das Gesamtprojekt ist **GPL-3.0-or-later**. Der Ledge-Parser behält **Apache-2.0**. Originaltexte, Referenz-Commits und Änderungen stehen in [NOTICE.md](NOTICE.md) und [LICENSING.md](LICENSING.md).

## Einblicke

### Projekte, verschachtelte Notizen und Datum inline

![THE Note: Projektordner, Markdown-Notizen und ein Datumspicker an der Schreibstelle](docs/screenshots/projects-and-date.png)

### Änderungen vor dem Speichern

![Markdown-Diff mit roten Löschungen, grünen Ergänzungen und Zeilennummern](docs/screenshots/unsaved-diff.png)

### KI direkt im Dokument

![Inline-KI mit Prompt und Markdown-Entwurf](docs/screenshots/inline-ai.png)

Die Screenshots zeigen Testnotizen. Die KI-Antwort im Bild ist eine reproduzierbare Demo; dafür wurde kein externer Anbieter kontaktiert.

## Was zusammengeführt wurde

- **Schreiben:** Live-Markdown, Quelltextmodus, Tabs mit eigenem Undo, Gliederung, Suche, Tabellen, Formeln, Mermaid/D2, Fokusmodus und vorhandene Exportfunktionen aus Sarala.
- **Projekte und Ordner:** In der Seitenleiste über **＋ Projekt** einen neuen Projektordner anlegen (zuerst den übergeordneten Speicherort wählen), über **＋ Ordner** einen Unterordner. Rechtsklick auf einen Ordner → **Neue Notiz hier …** oder **Unterordner erstellen …**. Das Datei-Plus im Kopf der Seitenleiste legt eine Notiz im Projekt an. Leere Ordner bleiben sichtbar.
- **Tabnamen:** Doppelklick, Rechtsklick oder F2 auf einem Tab öffnet **Datei umbenennen**. Gespeicherte Dateien werden im gleichen Ordner umbenannt; ungespeicherte Notizen erhalten zunächst einen Namen für das spätere Speichern. Text und Undo bleiben erhalten.
- **Datum:** `/date` oder `/datum` öffnet an der Schreibstelle einen Datumspicker mit Heute/Morgen und deutschem oder ISO-Format. Das Ergebnis bleibt normaler Markdown-Text.
- **Änderungen vor dem Speichern:** Über **± Änderungen** den aktuellen Markdown-Entwurf mit dem zuletzt geladenen/gespeicherten Stand vergleichen. Ergänzungen und Löschungen mit Zeilennummern, pro Tab; neue Notizen werden mit einem leeren Dokument verglichen. Zeilenenden und die Normalisierung des Editors sind kein Byte-Diff.
- **Ausführen:** Shell, Bash, Zsh, Python und JavaScript/Node direkt im Codeblock; Live-Ausgabe, Exit-Code, Laufzeit, Stop und ein Aktivitätsverlauf.
- **Kontext:** Ledges Frontmatter-Parser liefert `cwd`, `env` und `confirm`. Relative Arbeitsverzeichnisse werden gegen den offenen Workspace, sonst den Notizordner, sonst das Home-Verzeichnis aufgelöst.
- **Oberfläche:** eigenes THE-Note-Design, heller/dunkler Modus, Vorlagen für Gedankenbuch, Runbook und Diagramme. Bestehende Editor-Menüs sind teilweise Englisch.
- **Optionaler KI-Assistent:** **/ai direkt im Dokument**, OpenAI/Claude/Gemini/interne APIs mit geladenen Modelllisten, eigener API-Key, macOS-Schlüsselbund, Streaming und bewusst freigegebener Dokumentkontext. Einrichtung: [docs/AI-PLUGIN.md](docs/AI-PLUGIN.md).
- **Eigene Identität:** App-ID, Einstellungen, Icon und Paketname sind getrennt von Sarala. Der fremde Updatekanal ist deaktiviert.

Die Architekturentscheidungen und Unterschiede stehen in [docs/REENGINEERING.md](docs/REENGINEERING.md). Herkunft und Lizenzen: [NOTICE.md](NOTICE.md).

## Ein ausführbares Arbeitsbuch

Öffne einen Ordner, erstelle über **Neue Notiz → Ausführbares Runbook** ein Dokument und speichere es als `.md`. Ein minimales Beispiel:

````markdown
---
cwd: .
confirm: true
env:
  PROJECT: THE-Note
---

# Mein Runbook

```sh
printf 'Projekt: %s\n' "$PROJECT"
pwd
```

```python
print(sum([12, 18, 24, 30]) / 4)
```
````

**Ausführen** startet einen Block; **⌘/Ctrl+Enter** startet den gerade bearbeiteten Codeblock. `confirm: true` verlangt vor dem Start eine Bestätigung; pro Block sind `confirm`, `confirm=yes` und `confirm=no` möglich. Ohne Bestätigungsoption startet nur der ausdrückliche Klick oder Shortcut, niemals das Öffnen einer Datei.

Ausgaben sind temporär und werden nicht in die Markdown-Datei geschrieben. Sie bleiben beim Tabwechsel erhalten. Pro Lauf gilt ein Zeitlimit von 120 Sekunden und ein Ausgabelimit von 1 MB; maximal acht Prozesse gleichzeitig. Stop beendet unter macOS/Linux auch die Prozessgruppe.

**Code läuft mit den Rechten deines Benutzerkontos.** Die Prozessisolierung ist keine Sicherheits-Sandbox. Nur Code starten, dem du vertraust.

## Bewusste Grenzen dieser Version

Jeder Start ist ein eigener Prozess: `cd`, Variablen und virtuelle Umgebungen aus einem Block bleiben nicht automatisch für den nächsten erhalten; dafür `cwd`/`env` im Frontmatter verwenden. Interaktive Eingaben und ein PTY-Terminal fehlen noch. SSH, Server/Mobilgeräte, SQL/Redis, Prompt-Agenten, MCP, verschlüsselte Backups und geheime Profile sind noch nicht integriert. Notizen mit Remote-Hosts, `profile` oder `envFile` werden bei Ausführung ausdrücklich abgewiesen, statt mit einem falschen lokalen Kontext zu starten.

Im Browser ist nur der Editor mit Markdown-Download verfügbar. Dateidialoge, Workspace-Dateizugriff und Prozessausführung sind Funktionen der Desktop-App. Der Aktivitätsverlauf ist sitzungsgebunden. HTML-Export übernimmt den bestehenden Sarala-Exportstil; die neue App-Oberfläche ist kein identischer Druckstil. Weitere Exportformate benötigen Pandoc, PDF den vorhandenen Chromium-Exportpfad.

## Entwickeln

Voraussetzungen: Node.js 22.12+ (empfohlen Node 24+), npm, Rust stable sowie Tauri-Buildvoraussetzungen; auf macOS die Xcode Command Line Tools.

```sh
npm ci
npm run dev             # Browser-Editor auf http://localhost:1420
npm run desktop         # Native App im Entwicklungsmodus
npm run package:macos    # App-Bundle signieren, prüfen und als ZIP ablegen
```

Der Paketierungsbefehl legt App und ZIP lokal unter `release/` ab. Mit `THE_NOTE_RELEASE_DIR=release/v0.2.3` lässt sich ein separater Zielordner wählen. Build-Ausgaben gehören nicht in den Quellcode-Commit.

## Prüfen

```sh
npm run typecheck
npm run lint
npm test
npm run test:notebook
npm run test:ai:ui      # UI mit simuliertem nativen IPC; HTTP-Tests in Rust
npm run test:diff:ui
npm run test:workspace:ui
cargo test --manifest-path src-tauri/Cargo.toml
```

`test:notebook` startet seinen eigenen lokalen Server und nutzt Playwright Chromium oder das installierte Google Chrome. Die übernommenen weiteren `test:e2e`-Skripte bleiben als Editor-Regressionstests erhalten; sie erwarten einen installierten Playwright-Browser. Neue UI- und Runtime-Verträge sind in `tests/e2e-notebook.mjs`, `tests/execution.test.mjs` und `src-tauri/src/execution.rs` abgedeckt.

## Lizenz

GPL-3.0-or-later. Sarala © Srinivas Gowda. Der übernommene Ledge-Frontmatter-Parser behält Apache-2.0; Lizenztexte und Herkunft sind in [NOTICE.md](NOTICE.md) dokumentiert. Dies ist ein unabhängiges Folgeprojekt.


## Entstehung und Mitmachen

- [Gesprächsarchiv mit Zeitstempeln und Anhängen](docs/history/README.md)
- [Changelog](CHANGELOG.md), [Architekturentscheidungen](docs/REENGINEERING.md), [Prüfergebnisse und Grenzen](docs/VALIDATION.md)
- [Beiträge und lokale Entwicklung](CONTRIBUTING.md)
- [Drittanbieter-Hinweise](THIRD_PARTY_NOTICES.md)

Die frühen Versionen entstanden vor dem ersten Quellcode-Push. Das Gesprächsarchiv dokumentiert diese Entwicklung; es ersetzt keine nachträglich erfundene Git-Historie.
