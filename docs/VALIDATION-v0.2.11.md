# Testbericht · THE Note 0.2.11

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Basis: `5f8f9eb` auf `main` (PR #21), ergänzt um Versions-/Distributionsänderungen und die Einbindung der Baustein-/Webapp-Prüfungen in den Release-Test. Abhängigkeiten bleiben auf den eingecheckten Lockfiles.

## Automatisierter Release-Test

**16 von 16 Testgruppen erfolgreich**, darunter **43 native Rust-Tests**. Aufruf: `npm run test:release` (Cargo auf PATH). Einzelne Logs, Markdown und JSON liegen lokal unter `release/tests-v0.2.11-2026-10-05T10-37-00-919Z/`.

| Testgruppe | Ergebnis | Dauer |
| --- | --- | ---: |
| TypeScript | PASS | 1.6 s |
| ESLint | PASS | 1.6 s |
| Unit and regression tests | PASS | 12.5 s |
| Notebook UI | PASS | 3.1 s |
| Clipboard images UI | PASS | 2.3 s |
| Gallery and image moves UI | PASS | 7.1 s |
| Slash date immediate execution | PASS | 2.1 s |
| Slash building blocks and sharing | PASS | 6.8 s |
| Workspace UI | PASS | 4.1 s |
| Sidebar UI | PASS | 7.5 s |
| AI UI | PASS | 5.5 s |
| Diff UI | PASS | 1.8 s |
| Native Rust tests | PASS | 4.6 s |
| Clippy | PASS | 2.4 s |
| Website UI and distribution metadata | PASS | 2.7 s |
| Built browser app | PASS | 2.6 s |

## Schwerpunkt dieser Version

- Baustein-Suite: Vorlagenmenü in der Tab-Leiste, Atem-/Fokus-/Entscheidungs-/Orakel-/Git-Bausteine, berechnete Entscheidungsmatrix, Undo, Moderationsmethoden und Moderationskoffer.
- KI-Schnellaktionen: Zusammenfassung und To-dos mit der Notiz als Kontext, automatischer Start und Übernahme als normales Markdown; Provider nachgebildet.
- Teilen/Export: Menüeinträge, HTML-Export neben der Notiz, Exportmeldung und Finder-Aktion über nachgebildete native IPC.
- Webapp-Suite nun im gemeinsamen Release-Test: Produktions-Build unter `/THENote/app/`, Einstieg von deutscher und englischer Website, Bearbeiten, Formeltabellen, Mermaid, Markdown-Download und vollständig geladene Assets.
- Bestehende Galerie-, Drag-and-drop-, Slash-Menü-, Dateischutz- und Workspace-Prüfungen erfolgreich. Keine Fehler im Release-Test aufgetreten.

## Fertige Pakete

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | Tauri, Apple Silicon arm64, Mindestversion macOS 11.0 |
| Signatur | Developer ID Application: Tobias Wilhelm, Team `5T32K4L4T4`, Hardened Runtime und Zeitstempel |
| Apple-Notarisierung App | Accepted; `e4d16afc-53e0-4a97-b7fd-91ca03cb3adc` |
| Apple-Notarisierung DMG | Accepted; `b8a68ffc-ce7e-4b0a-9fac-b273454c0102` |
| Stapling und Gatekeeper | App und DMG erfolgreich; `Notarized Developer ID` |
| ZIP/DMG | App und Lizenzordner identisch; SHA-256 und Applications-Link geprüft |
| Installer | Lokales ZIP mit `--check --archive` erfolgreich; keine Installation vorgenommen |
| Website und Webapp mit endgültigen Release-Metadaten | `npm run test:webapp` und `npm run test:site` nach Aktualisierung der Prüfsummen erneut erfolgreich |

Prüfsummen nach Stapling:

```text
03b5253150649d3b0c5515c7ce5a6d6df90c1a849888546615aa536af0939eb8  THE.Note-macOS-arm64.zip
fc69109bfb917678a3bf94cae2f4f8a1098cf1b04cb0c11e0f258057fe54a572  THE.Note-macOS-arm64.dmg
```

## Grenzen

UI-Tests laufen im Browser; native IPC, KI-Antworten und Zwischenablage-Ereignisse werden nachgebildet. Rust-Dateitests verwenden echte temporäre Dateien. Neue Bausteine wurden auf Einfügen, Struktur und relevante Interaktionen geprüft; nicht jeder Timer oder externe Runner wurde über seine ganze Laufzeit manuell getestet. Export-UI wurde mit HTML und nachgebildeten Dateizugriffen geprüft; kein vollständiger manueller PDF-/Word-Exportdurchlauf. Kein vollständiger manueller Desktop-Durchlauf oder Erststart auf einem frischen Mac. Keine verifizierten Intel-/Windows-/Linux-Pakete oder produktiven kostenpflichtigen KI-Anfragen. Bekannte Build-Hinweise zu großen Frontend-Chunks und zum gemischten statischen/dynamischen Import bleiben bestehen.
