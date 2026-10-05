# Testbericht · THE Note 0.2.9

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Basis: `0eba9c5` auf `main` (PR #16), ergänzt um Versions- und Distributionsänderungen. Abhängigkeiten bleiben auf den eingecheckten Lockfiles.

## Automatisierter Release-Test

**13 von 13 Testgruppen erfolgreich**, darunter **43 native Rust-Tests**. Aufruf: `npm run test:release` (Cargo auf PATH). Einzelne Logs, Markdown und JSON liegen lokal unter `release/tests-v0.2.9-2026-10-05T08-56-15-968Z/`.

| Testgruppe | Ergebnis | Dauer |
| --- | --- | ---: |
| TypeScript | PASS | 1.6 s |
| ESLint | PASS | 1.5 s |
| Unit and regression tests | PASS | 12.5 s |
| Notebook UI | PASS | 3 s |
| Clipboard images UI | PASS | 2.3 s |
| Gallery and image moves UI | PASS | 4 s |
| Workspace UI | PASS | 4.1 s |
| Sidebar UI | PASS | 7.4 s |
| AI UI | PASS | 5.6 s |
| Diff UI | PASS | 1.7 s |
| Native Rust tests | PASS | 4.4 s |
| Clippy | PASS | 2.3 s |
| Website UI and distribution metadata | PASS | 2.3 s |

## Schwerpunkt dieser Version

Die erweiterten Galerie-Tests aus PR #16 prüfen Scrollen und Klicken auf Scrollleiste/Zwischenräume ohne Öffnen des Quelltexts, Umschalten Raster/Leiste, passende Bildpositionen, gespeicherte Auswahl, Erhalt bei erneutem Rendern und automatisches Raster bei vielen Bildern. Die bisherigen Viewer-, Tastatur-, Bildverschiebe- und Dateischutz-Prüfungen bleiben erfolgreich. Kein Fehler im Release-Test aufgetreten.

## Fertige Pakete

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | Tauri, Apple Silicon arm64, Mindestversion macOS 11.0 |
| Signatur | Developer ID Application: Tobias Wilhelm, Team `5T32K4L4T4`, Hardened Runtime und Zeitstempel |
| Apple-Notarisierung App | Accepted; `301f95f5-ddc1-4530-8802-255638080625` |
| Apple-Notarisierung DMG | Accepted; `e40f73f9-4817-42a1-b6d9-cfbcd2a68cef` |
| Stapling und Gatekeeper | App und DMG erfolgreich; `Notarized Developer ID` |
| ZIP/DMG | App und Lizenzordner identisch; SHA-256 und Applications-Link geprüft |
| Installer | Lokales ZIP mit `--check --archive` erfolgreich; keine Installation vorgenommen |
| Website mit endgültigen Release-Metadaten | `npm run test:site` nach Aktualisierung der Prüfsummen erneut erfolgreich |

Prüfsummen nach Stapling:

```text
5187cd142cf1f7b13ddd9d552b677af35d1ff399412f4c8fa95cf946c1af5331  THE.Note-macOS-arm64.zip
7c47157d97ed228c3f870f6d836a9cf8fcfd4d83126724dc609fe7e124d9e46a  THE.Note-macOS-arm64.dmg
```

## Grenzen

UI-Tests laufen im Browser; native IPC und Zwischenablage-Ereignisse werden nachgebildet. Die Speicherung der Raster-Auswahl und Wiederherstellung beim Rendern sind automatisiert geprüft; ein echter Neustart der Desktop-App wurde nicht manuell geprüft. Rust-Dateitests verwenden echte temporäre Dateien. Kein manueller Test der echten macOS-Zwischenablage, kein vollständiger manueller Durchlauf der signierten Desktop-App und kein Erststart auf einem frischen Mac. Keine verifizierten Intel-/Windows-/Linux-Pakete oder produktiven kostenpflichtigen KI-Anfragen. Bekannte Build-Hinweise zu großen Frontend-Chunks und zum gemischten statischen/dynamischen Import bleiben bestehen.
