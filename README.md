# THE Note

**Deutsch** · [English](README.en.md)

![THE Note: die Notiz „Lissabon im Mai“ mit Ideen, Checkliste und einer kleinen Kostenrechnung samt Ausgabe](docs/screenshots/note-light.png)

Ein lokales Notizbuch für Gedanken, Pläne und Projekte. Du schreibst in Markdown, ordnest Notizen in Ordnern, und wenn eine Notiz etwas rechnen, prüfen oder ausprobieren soll, läuft der Codeblock direkt darin.

THE Note verbindet **Saralas Live-Markdown-Editor** mit **Ledges ausführbaren Notizen**. Native macOS-App auf Tauri 2 und SolidJS. Aktueller Stand: **0.2.5, funktionale Entwicklungsversion**.

## Website und Installation

[**THE Note entdecken, im Browser ausprobieren und installieren →**](https://tobwil.github.io/THENote/) ([English](https://tobwil.github.io/THENote/en/)) · [Download v0.2.5](https://github.com/tobwil/THENote/releases/tag/v0.2.5) · [Changelog](CHANGELOG.md)

Aktuell für **macOS 11+ auf Apple Silicon**. Drei Wege führen zur gleichen App:

### Homebrew

```sh
brew tap tobwil/thenote https://github.com/tobwil/THENote
brew trust --cask tobwil/thenote/the-note
brew install --cask tobwil/thenote/the-note
```

Der eigene Tap liegt in diesem Repository. `brew trust` wird ab Homebrew 6 benötigt; bei älteren Versionen diese Zeile auslassen. Updates: `brew update` und `brew upgrade --cask tobwil/thenote/the-note`.

### Terminal mit curl

```sh
curl -fsSL https://tobwil.github.io/THENote/install.sh | bash
```

Installiert nach `~/Applications`, ohne `sudo`. Der Installer prüft SHA-256, App-Signatur, Kennung und Version. Vorhandene Apps werden nur mit `--replace` ersetzt; dabei bleibt eine Sicherung erhalten. Nur herunterladen und prüfen:

```sh
curl -fsSL https://tobwil.github.io/THENote/install.sh | bash -s -- --check
```

### DMG herunterladen

[DMG für macOS Apple Silicon](https://github.com/tobwil/THENote/releases/download/v0.2.5/THE.Note-macOS-arm64.dmg) öffnen und **THE Note.app** auf **Applications** ziehen. Danach das Image auswerfen und die App im Programme-Ordner öffnen.

Alternativ: [ZIP herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.5/THE.Note-macOS-arm64.zip).

Vor Updates offene Notizen speichern und die App beenden. Diese Preview ist mit **Developer ID signiert und Apple-notarisiert**. Beim ersten Start kann macOS die übliche Bestätigung für eine aus dem Internet geladene App anzeigen. Die Installationswege verändern keine Sicherheitseinstellungen. Windows-, Linux- und Intel-Mac-Pakete sind noch nicht verifiziert.

Node.js und Python werden nur für ihre jeweiligen Codeblöcke benötigt. Der Editor selbst läuft eigenständig. [Installationsdetails, Updates und Deinstallation](docs/INSTALLATION.md) · [Lizenz und Herkunft](LICENSING.md).

## Danke, Sarala und Ledge

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von **Srinivas Gowda** und dem Konzept ausführbarer Notizen aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Sarala liefert die Editorbasis; aus Ledge stammt außerdem der Frontmatter-Parser. Beide Projekte sind echte Grundlagen dieser Arbeit. Der neue lokale Rust-Runner und die THE-Note-Erweiterungen sind hier dokumentiert.

Das Gesamtprojekt ist **GPL-3.0-or-later**. Der Ledge-Parser behält **Apache-2.0**. Originaltexte, Referenz-Commits und Änderungen stehen in [NOTICE.md](NOTICE.md) und [LICENSING.md](LICENSING.md).

## Einblicke

### Eine Notiz, die mitrechnet

Zuerst Ideen, Checkliste und offene Fragen; ein kleiner Codeblock rechnet nebenbei die Kosten aus. Die Ausgabe erscheint unter dem Block und wird nicht in die Datei geschrieben. Hier im dunklen Thema **THE Note Dark**, oben im hellen.

![Dieselbe Notiz im dunklen Waldgrün](docs/screenshots/note-dark.png)

### Ordner, verschachtelte Notizen und Datum inline

![THE Note: Ordner, Markdown-Notizen und ein Datumspicker an der Schreibstelle](docs/screenshots/projects-and-date.png)

### Änderungen vor dem Speichern

![Markdown-Diff mit roten Löschungen, grünen Ergänzungen und Zeilennummern](docs/screenshots/unsaved-diff.png)

### KI direkt im Dokument

![Inline-KI mit Prompt und Markdown-Entwurf](docs/screenshots/inline-ai.png)

Die Screenshots zeigen Beispiel- und Testnotizen. Alle Code-Ausgaben wurden lokal mit `bash`, `python3` und `node` erzeugt; die KI-Antwort ist eine reproduzierbare Demo, dafür wurde kein externer Anbieter kontaktiert. Neu erzeugen: `node scripts/screenshots.mjs`.

## Was zusammengeführt wurde

- **Schreiben:** Live-Markdown, Quelltextmodus, Tabs mit eigenem Undo, Gliederung, Suche, Tabellen, Formeln, Mermaid/D2, Fokusmodus und vorhandene Exportfunktionen aus Sarala.
- **Tabellen, die rechnen:** `/formel` (oder `/tabelle`, `/excel`) fügt eine Tabelle mit Formeln wie `=SUMME(D2:D4)` ein. Die Datei behält die Formel, die Notiz zeigt das Ergebnis; siehe [Tabellen mit Formeln](#tabellen-mit-formeln).
- **Diagramme vergrößern:** Über einem Mermaid- oder D2-Diagramm erscheint **⤢ Vergrößern**. Das Vollbild zoomt per Pinch oder ⌘/Strg + Scrollen, verschiebt per Ziehen oder Scrollen und kennt `+`, `−`, `0` (Einpassen), `1` (100 %) und Esc. Auch über die Befehlspalette: „Diagramm vergrößern“.
- **Ordner für deine Notizen:** Alle Notizen sind .md-Dateien in einem Notizordner. **＋ Notiz** und **＋ Ordner** funktionieren sofort: Ist noch kein Ordner offen, legt THE Note *Dokumente/THE Note* an. Alternativ öffnest du über das Ordnersymbol einen eigenen Ordner. Notizen gruppierst du in Unterordnern (z. B. Rezepte, Meeting-Protokolle): eine Notiz auf einen Ordner **ziehen** oder per Rechtsklick **In Ordner verschieben …**; offene Tabs wandern mit. Rechtsklick auf einen Ordner → **Neue Notiz hier …** oder **Unterordner erstellen …**. Der Ordner bleibt nach einem Neustart offen; **×** im Kopf der Seitenleiste schließt ihn wieder, die Dateien bleiben unverändert. Leere Ordner bleiben sichtbar.
- **Tabnamen:** Doppelklick, Rechtsklick oder F2 auf einem Tab öffnet **Datei umbenennen**. Gespeicherte Dateien werden im gleichen Ordner umbenannt; ungespeicherte Notizen erhalten zunächst einen Namen für das spätere Speichern. Text und Undo bleiben erhalten.
- **Datum:** `/date` oder `/datum` öffnet an der Schreibstelle einen Datumspicker mit Heute/Morgen und deutschem oder ISO-Format. Das Ergebnis bleibt normaler Markdown-Text.
- **Änderungen vor dem Speichern:** Über **± Änderungen** den aktuellen Markdown-Entwurf mit dem zuletzt geladenen/gespeicherten Stand vergleichen. Ergänzungen und Löschungen mit Zeilennummern, pro Tab; neue Notizen werden mit einem leeren Dokument verglichen. Zeilenenden und die Normalisierung des Editors sind kein Byte-Diff.
- **Ausführen:** Shell, Bash, Zsh, Python und JavaScript/Node direkt im Codeblock; Live-Ausgabe, Exit-Code, Laufzeit, Stop und ein Aktivitätsverlauf.
- **Kontext:** Ledges Frontmatter-Parser liefert `cwd`, `env` und `confirm`. Relative Arbeitsverzeichnisse werden gegen den offenen Workspace, sonst den Notizordner, sonst das Home-Verzeichnis aufgelöst.
- **Oberfläche:** eigenes THE-Note-Design hell und **THE Note Dark** (Waldgrün mit Limette); beim ersten Start folgt die App dem Systemschema, danach gilt die eigene Wahl über **◐**. Vorlagen für Gedankenbuch, Runbook, Diagramme sowie Spielplatz und Werkzeugkasten. Bestehende Editor-Menüs sind teilweise Englisch.
- **Optionaler KI-Assistent:** **/ai direkt im Dokument**, OpenAI/Claude/Gemini/interne APIs mit geladenen Modelllisten, eigener API-Key, macOS-Schlüsselbund, Streaming und bewusst freigegebener Dokumentkontext. Einrichtung: [docs/AI-PLUGIN.md](docs/AI-PLUGIN.md).
- **Eigene Identität:** App-ID, Einstellungen, Icon und Paketname sind getrennt von Sarala. Der fremde Updatekanal ist deaktiviert.

Die Architekturentscheidungen und Unterschiede stehen in [docs/REENGINEERING.md](docs/REENGINEERING.md). Herkunft und Lizenzen: [NOTICE.md](NOTICE.md).

## Tabellen mit Formeln

Eine Zelle, die mit `=` beginnt, ist eine Formel. Im Markdown bleibt die Formel stehen, die Notiz zeigt das Ergebnis; die Formel erscheint als Tooltip. Wer in die Tabelle klickt, sieht und bearbeitet die Formeln wie in einer Tabellenkalkulation. Einfügen über **/formel** im Text, die Befehlspalette (⌘K) oder **Paragraph ▸ Table ▸ Tabelle mit Formeln**.

```markdown
| Posten | Menge | Preis | Summe |
| :--- | ---: | ---: | ---: |
| Kaffee | 2 | 3,50 € | =B2*C2 |
| Kuchen | 3 | 2,80 € | =B3*C3 |
| **Gesamt** | =SUMME(B:B) | | **=SUMME(D:D)** |
```

- **Adressen wie in Excel:** Spalten A, B, C …; die Kopfzeile ist Zeile 1, die erste Datenzeile Zeile 2. Bereiche wie `B2:B5` oder ganze Spalten wie `D:D`. Steht die Formel selbst in der Spalte, zählen nur die Zeilen darüber; so bleibt eine Summenzeile richtig, auch wenn Zeilen dazukommen.
- **Rechnen:** `+ - * / ^`, Klammern, Prozent (`20%`), Vergleiche (`= <> < > <= >=`), Text in `"…"` und `&` zum Verbinden.
- **Funktionen**, deutsch oder englisch: `SUMME`/`SUM`, `MITTELWERT`/`AVERAGE`, `MIN`, `MAX`, `ANZAHL`/`COUNT`, `ANZAHL2`/`COUNTA`, `PRODUKT`/`PRODUCT`, `RUNDEN`/`ROUND`, `ABS`, `WENN`/`IF`. Argumente mit `;` oder `,` trennen; Dezimalzahlen in Formeln mit Punkt.
- **Zahlen in Zellen** dürfen deutsch oder englisch geschrieben sein (`1.234,50 €`, `3.5`) und eine Währung tragen; Ergebnisse übernehmen die Währung und erscheinen im deutschen Format.
- **Fehler** werden wie in Tabellenkalkulationen angezeigt: `#DIV/0!`, `#WERT!`, `#BEZUG!`, `#NAME?`, `#ZYKLUS!`. Der Tooltip der Zelle erklärt, was nicht stimmt.

## Codeblöcke in Notizen ausführen

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

## Beispielnotizen

Im Ordner [`examples/`](examples/) liegen Notizen zum Ausprobieren. Jeder Codeblock darin **liest nur** und verändert nichts; Zahlen und Texte lassen sich direkt anpassen.

- **[Lissabon im Mai](examples/Reiseplanung.md):** eine ganz normale Planungsnotiz mit einer kleinen Kostenrechnung, die Notiz aus den Screenshots.
- **[Werkzeugkasten](examples/Werkzeugkasten.md)** (auch unter **＋ Neue Notiz**): installierte Laufzeiten prüfen, Ordner nach Dateitypen auswerten, Git auf einen Blick, Kalenderwoche und Tage bis zu einem Datum, Ausgaben aus CSV auswerten, JSON prüfen, Passphrase und UUID erzeugen.
- **[Spielplatz](examples/Spielplatz.md)** (auch unter **＋ Neue Notiz**): 🚀 Countdown mit Live-Ausgabe, 🎲 Würfelorakel, ✦ Sierpinski-Dreieck aus `x & y`, 🌀 Mandelbrot in Zeichen und 🐟 ein Aquarium, das eine Minute läuft und sich mit **■ Stoppen** anhalten lässt.

| Werkzeugkasten, hell | Spielplatz, dunkel |
| :--- | :--- |
| ![Werkzeugkasten mit Kalender-Rechner und Ausgabe](docs/screenshots/toolbox-light.png) | ![Mandelbrot-Menge als ASCII-Kunst, ausgegeben von einem JavaScript-Block](docs/screenshots/mandelbrot-dark.png) |

Ohne installierte App lässt sich THE Note [auf der Website](https://tobwil.github.io/THENote/#try) in einem nachgebauten Fenster ausprobieren: Absätze anklicken und ihr Markdown bearbeiten, Aufgaben abhaken, zwischen Notizen wechseln und die kleine Kostenrechnung ausführen.

## Bewusste Grenzen dieser Version

Jeder Start ist ein eigener Prozess: `cd`, Variablen und virtuelle Umgebungen aus einem Block bleiben nicht automatisch für den nächsten erhalten; dafür `cwd`/`env` im Frontmatter verwenden. Interaktive Eingaben und ein PTY-Terminal fehlen noch. SSH, Server/Mobilgeräte, SQL/Redis, Prompt-Agenten, MCP, verschlüsselte Backups und geheime Profile sind noch nicht integriert. Notizen mit Remote-Hosts, `profile` oder `envFile` werden bei Ausführung ausdrücklich abgewiesen, statt mit einem falschen lokalen Kontext zu starten.

Im Browser ist nur der Editor mit Markdown-Download verfügbar. Dateidialoge, Workspace-Dateizugriff und Prozessausführung sind Funktionen der Desktop-App. Der Aktivitätsverlauf ist sitzungsgebunden. HTML-Export übernimmt den bestehenden Sarala-Exportstil; die neue App-Oberfläche ist kein identischer Druckstil. Weitere Exportformate benötigen Pandoc, PDF den vorhandenen Chromium-Exportpfad.

## Entwickeln

Voraussetzungen: Node.js 22.12+ (empfohlen Node 24+), npm, Rust stable sowie Tauri-Buildvoraussetzungen; auf macOS die Xcode Command Line Tools.

```sh
npm ci
npm run dev             # Browser-Editor auf http://localhost:1420
npm run desktop         # Native App im Entwicklungsmodus
npm run package:macos    # Preview signieren, prüfen und als ZIP + DMG ablegen
```

Der Paketierungsbefehl legt ZIP und DMG lokal unter `release/` ab. Für ein Apple-notarisiertes Paket `npm run package:macos -- --notarized` verwenden; Einrichtung: [SIGNING.md](docs/SIGNING.md). Mit `THE_NOTE_RELEASE_DIR=release/v0.2.5` lässt sich ein separater Zielordner wählen. Build-Ausgaben gehören nicht in den Quellcode-Commit.

Die Website liegt in `site/`: eine HTML-Vorlage, Texte pro Sprache in `site/i18n.mjs`. `npm run build:site` erzeugt Deutsch unter `/` und Englisch unter `/en/`.

## Prüfen

```sh
npm run typecheck
npm run lint
npm test
npm run test:notebook
npm run test:ai:ui      # UI mit simuliertem nativen IPC; HTTP-Tests in Rust
npm run test:diff:ui
npm run test:workspace:ui
npm run test:site       # Website DE/EN, Live-Zelle, Installationstabs und mobile Darstellung
cargo test --manifest-path src-tauri/Cargo.toml
```

`test:notebook` startet seinen eigenen lokalen Server und nutzt Playwright Chromium oder das installierte Google Chrome. Die übernommenen weiteren `test:e2e`-Skripte bleiben als Editor-Regressionstests erhalten; sie erwarten einen installierten Playwright-Browser. Neue UI- und Runtime-Verträge sind in `tests/e2e-notebook.mjs`, `tests/execution.test.mjs` und `src-tauri/src/execution.rs` abgedeckt.

## Lizenz

GPL-3.0-or-later. Sarala © Srinivas Gowda. Der übernommene Ledge-Frontmatter-Parser behält Apache-2.0; Lizenztexte und Herkunft sind in [NOTICE.md](NOTICE.md) dokumentiert. Dies ist ein unabhängiges Folgeprojekt.


## Entstehung und Mitmachen

- [Gesprächsarchiv mit Zeitstempeln und Anhängen](docs/history/README.md)
- [Changelog](CHANGELOG.md), [Architekturentscheidungen](docs/REENGINEERING.md), [Prüfergebnisse und Grenzen](docs/VALIDATION-v0.2.5.md)
- [Beiträge und lokale Entwicklung](CONTRIBUTING.md)
- [Drittanbieter-Hinweise](THIRD_PARTY_NOTICES.md)

Die frühen Versionen entstanden vor dem ersten Quellcode-Push. Das Gesprächsarchiv dokumentiert diese Entwicklung; es ersetzt keine nachträglich erfundene Git-Historie.
