# Testbericht · THE Note 0.2.13

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Basis: `19c9324` auf `main` (PR #25), ergänzt um Versions-/Distributionsänderungen und die Aufnahme des Live-Ausgabe-Tests in den gemeinsamen Release-Test. Abhängigkeiten bleiben auf den eingecheckten Lockfiles.

## Automatisierter Release-Test

**17 von 17 Testgruppen erfolgreich**, darunter **43 native Rust-Tests**. Aufruf: `npm run test:release` (Cargo auf PATH). Einzelne Logs, Markdown und JSON liegen lokal unter `release/tests-v0.2.13-2026-10-05T11-37-10-489Z/`.

| Testgruppe | Ergebnis | Dauer |
| --- | --- | ---: |
| TypeScript | PASS | 1.6 s |
| ESLint | PASS | 1.7 s |
| Unit and regression tests | PASS | 12.5 s |
| Notebook UI | PASS | 3.1 s |
| Clipboard images UI | PASS | 2.4 s |
| Gallery and image moves UI | PASS | 7 s |
| Slash date immediate execution | PASS | 2 s |
| Slash building blocks and sharing | PASS | 6.9 s |
| Live output following | PASS | 2.2 s |
| Workspace UI | PASS | 4.1 s |
| Sidebar UI | PASS | 7.6 s |
| AI UI | PASS | 5.5 s |
| Diff UI | PASS | 1.9 s |
| Native Rust tests | PASS | 5.5 s |
| Clippy | PASS | 2.4 s |
| Website UI and distribution metadata | PASS | 3.1 s |
| Built browser app | PASS | 3.1 s |

## Schwerpunkt dieser Version

Der neue Live-Ausgabe-Test prüft, dass der Ausgabebereich beim Start sichtbar wird, neue Zeilen verfolgt, beim Hochscrollen die Leseposition hält und mit „↓ Live folgen“ wieder zur neuesten Ausgabe springt. Nach Abschluss verschwindet die Folgen-Schaltfläche. Die Ausgabe wird über den Execution-Store simuliert; es startet kein echter Prozess.

Website-Prüfungen decken den neuen Abschnitt „Tippe /“ mit Slash-Befehlen, Links und sieben Vorlagen ab. Produktions-Webapp, Bausteine, KI-/Export-UI, Galerie-Drag-and-drop, Slash-Menü-Fix und Dateischutz-Prüfungen bleiben erfolgreich. Keine Fehler im Release-Test aufgetreten.

## Fertige Pakete

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | Tauri, Apple Silicon arm64, Mindestversion macOS 11.0 |
| Signatur | Developer ID Application: Tobias Wilhelm, Team `5T32K4L4T4`, Hardened Runtime und Zeitstempel |
| Apple-Notarisierung App | Accepted; `18aae8f4-78ee-4481-8e43-603911f716bf` |
| Apple-Notarisierung DMG | Accepted; `3af20654-8fb6-454b-85a2-69e348ccea4e` |
| Stapling und Gatekeeper | App und DMG erfolgreich; `Notarized Developer ID` |
| ZIP/DMG | App und Lizenzordner identisch; SHA-256 und Applications-Link geprüft |
| Installer | Lokales ZIP mit `--check --archive` erfolgreich; keine Installation vorgenommen |
| Website und Webapp mit endgültigen Release-Metadaten | `npm run test:site` und `npm run test:webapp` nach Aktualisierung der Prüfsummen erneut erfolgreich |

Prüfsummen nach Stapling:

```text
edfc918d57f95d7ad91b583dcdbb7c92492faf4a1c49e0e481f700b86a6d0c7e  THE.Note-macOS-arm64.zip
e248f042d179e9bf3d965dc4cfa3bc4404924ec9f43a09c0f1ce895717fbae5e  THE.Note-macOS-arm64.dmg
```

## Grenzen

UI-Tests laufen im Browser; native IPC, KI-Antworten, Zwischenablage und laufende Ausgabe werden nachgebildet. Rust-Dateitests verwenden echte temporäre Dateien; Runner-Verträge werden separat nativ getestet. Kein manueller Langzeitlauf der neuen Ausgabeanzeige in der signierten App, kein vollständiger PDF-/Word-Exportdurchlauf, kein vollständiger manueller Desktop-Durchlauf und kein Erststart auf einem frischen Mac. Keine verifizierten Intel-/Windows-/Linux-Pakete oder produktiven kostenpflichtigen KI-Anfragen. Bekannte Build-Hinweise zu großen Frontend-Chunks und zum gemischten statischen/dynamischen Import bleiben bestehen.
