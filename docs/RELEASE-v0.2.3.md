# THE Note v0.2.3 · erste Open-Source-Vorabversion

Ein lokales Markdown-Arbeitsbuch mit ausführbaren Codezellen und optionaler KI direkt im Dokument.

## Enthalten

- Live-Markdown, Tabs, Diagramme, Suche und Export auf Basis von **Sarala**.
- **Ledge**-inspirierte Runbooks mit lokalem Shell-/Python-/JavaScript-Runner, Frontmatter-Kontext und Live-Ausgaben.
- `/ai` mit OpenAI, Claude, Gemini und internen APIs, Modelllisten und optionalem macOS-Schlüsselbund. KI-Entwürfe bleiben Markdown-Text bis zum Übernehmen.
- Diff vor dem Speichern, Projekte/Unterordner/Notizen, Tab-Umbenennen und `/date`.
- Quellcode, Screenshots, Changelog, Entwicklungsdialog, Prüfberichte sowie Ursprungs- und Abhängigkeitslizenzen.

## Download

[DMG für macOS Apple Silicon herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.3/THE.Note-macOS-arm64.dmg), öffnen und **THE Note.app** auf **Applications** ziehen. Das Image danach auswerfen und die App im Programme-Ordner öffnen. Alternativ bleibt `THE.Note-macOS-arm64.zip` verfügbar; Homebrew und curl verwenden weiterhin dieses ZIP.

Vor dem Update offene Notizen speichern und die bisherige App schließen. `SHA256SUMS` enthält die ZIP-Prüfsumme, `SHA256SUMS-DMG` die Prüfsumme des ergänzten DMGs. Das DMG enthält dieselbe unveränderte App wie das ursprüngliche ZIP, einschließlich Lizenzbeilagen.

Die App ist lokal/ad-hoc signiert, **nicht Apple-notarisiert** und eine Entwicklungsversion. Keine verifizierten Windows-/Linux-/Intel-Mac-Builds. KI-Oberfläche und Providerprotokolle wurden mit simuliertem IPC bzw. lokalen HTTP-Testdiensten geprüft, nicht mit bezahlten Produktivkonten. Codeblöcke laufen mit den Rechten des lokalen Benutzerkontos.

## Danke und Lizenz

**[Sarala](https://github.com/solancer/sarala)** von **Srinivas Gowda** und **[Ledge](https://github.com/ledgesh/ledge)** sind die beiden Grundlagen. THE Note als Gesamtwerk: **GPL-3.0-or-later**; der Ledge-Frontmatter-Parser behält **Apache-2.0**. Die ursprünglichen Lizenztexte und Copyright-Hinweise bleiben erhalten. Vollständige Herkunft: [NOTICE.md](https://github.com/tobwil/THENote/blob/main/NOTICE.md), [LICENSING.md](https://github.com/tobwil/THENote/blob/main/LICENSING.md).

## Prüfung

TypeScript, ESLint, Frontend-Tests und alle **33 Rust-Tests** erfolgreich. Browser-Regressionsprüfungen für Inline-KI, Speicherdiff und Projekt-/Datum-/Umbenennungsabläufe bestanden. Umfang und Grenzen: [docs/VALIDATION.md](https://github.com/tobwil/THENote/blob/main/docs/VALIDATION.md).
