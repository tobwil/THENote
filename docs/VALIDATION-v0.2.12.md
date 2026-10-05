# Testbericht · THE Note 0.2.12

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Basis: `d6610b8` auf `main` (PR #23), ergänzt um Versions-/Distributionsänderungen. Abhängigkeiten bleiben auf den eingecheckten Lockfiles.

## Automatisierter Release-Test

**16 von 16 Testgruppen erfolgreich**, darunter **43 native Rust-Tests**. Aufruf: `npm run test:release` (Cargo auf PATH). Einzelne Logs, Markdown und JSON liegen lokal unter `release/tests-v0.2.12-2026-10-05T11-20-08-058Z/`.

| Testgruppe | Ergebnis | Dauer |
| --- | --- | ---: |
| TypeScript | PASS | 1.5 s |
| ESLint | PASS | 1.6 s |
| Unit and regression tests | PASS | 12.4 s |
| Notebook UI | PASS | 3 s |
| Clipboard images UI | PASS | 2.4 s |
| Gallery and image moves UI | PASS | 7.1 s |
| Slash date immediate execution | PASS | 2 s |
| Slash building blocks and sharing | PASS | 6.9 s |
| Workspace UI | PASS | 3.9 s |
| Sidebar UI | PASS | 7.5 s |
| AI UI | PASS | 5.5 s |
| Diff UI | PASS | 1.8 s |
| Native Rust tests | PASS | 4.6 s |
| Clippy | PASS | 2.5 s |
| Website UI and distribution metadata | PASS | 2.7 s |
| Built browser app | PASS | 2.6 s |

## Schwerpunkt dieser Version

Die aktualisierten Vorlagen und Bausteine wurden durch die bestehende Notebook-/Baustein-Suite geprüft: Einfügen, Rendern, Moderationsvorlage, Formeltabellen, Undo, KI-Aktionen und Teilen/HTML-Export. Website-Tests decken die aktualisierten deutschen/englischen Texte, Screenshots und Links ab. Der Produktions-Build der Webapp lädt unter `/THENote/app/`, unterstützt Bearbeiten, Mermaid und Markdown-Download. Bestehende Galerie-, Drag-and-drop-, Slash-Menü-, Dateischutz- und Workspace-Prüfungen bleiben erfolgreich. Keine Fehler im Release-Test aufgetreten.

## Fertige Pakete

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | Tauri, Apple Silicon arm64, Mindestversion macOS 11.0 |
| Signatur | Developer ID Application: Tobias Wilhelm, Team `5T32K4L4T4`, Hardened Runtime und Zeitstempel |
| Apple-Notarisierung App | Accepted; `9a387bf9-bdfe-40d3-9dc8-58e2a82f881d` |
| Apple-Notarisierung DMG | Accepted; `a454e869-f591-49d9-8994-1306c887100a` |
| Stapling und Gatekeeper | App und DMG erfolgreich; `Notarized Developer ID` |
| ZIP/DMG | App und Lizenzordner identisch; SHA-256 und Applications-Link geprüft |
| Installer | Lokales ZIP mit `--check --archive` erfolgreich; keine Installation vorgenommen |
| Website und Webapp mit endgültigen Release-Metadaten | `npm run test:site` und `npm run test:webapp` nach Aktualisierung der Prüfsummen erneut erfolgreich |

Prüfsummen nach Stapling:

```text
c09c96264cb72765b3ee077f4723258557809ec5d16ef2ad066268deeddfb6b2  THE.Note-macOS-arm64.zip
b6f5faa4af6984745772530fd653e6494d7fd7622b5f581b167cebc6921f14a4  THE.Note-macOS-arm64.dmg
```

## Grenzen

UI-Tests laufen im Browser; native IPC, KI-Antworten und Zwischenablage-Ereignisse werden nachgebildet. Rust-Dateitests verwenden echte temporäre Dateien. Nicht jeder Timer oder externe Runner wurde über seine ganze Laufzeit manuell getestet. Export-UI wurde mit HTML und nachgebildeten Dateizugriffen geprüft; kein vollständiger manueller PDF-/Word-Exportdurchlauf. Kein vollständiger manueller Desktop-Durchlauf oder Erststart auf einem frischen Mac. Keine verifizierten Intel-/Windows-/Linux-Pakete oder produktiven kostenpflichtigen KI-Anfragen. Bekannte Build-Hinweise zu großen Frontend-Chunks und zum gemischten statischen/dynamischen Import bleiben bestehen.
