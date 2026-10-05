# Testbericht · THE Note 0.2.14

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Basis: `8f66e42` aus PR #27 (Export-Bugfix), aufbauend auf `d51a574` / v0.2.13. Ergänzt um Versions-/Distributionsänderungen und die Aufnahme der Export-Bildprüfungen in den gemeinsamen Release-Test. Abhängigkeiten bleiben auf den eingecheckten Lockfiles.

## Automatisierter Release-Test

**18 von 18 Testgruppen erfolgreich**, darunter **44 native Rust-Tests**. Aufruf: `npm run test:release` (Cargo auf PATH). Einzelne Logs, Markdown und JSON liegen lokal unter `release/tests-v0.2.14-2026-10-05T12-31-36-559Z/`.

| Testgruppe | Ergebnis | Dauer |
| --- | --- | ---: |
| TypeScript | PASS | 1.5 s |
| ESLint | PASS | 1.6 s |
| Unit and regression tests | PASS | 12.3 s |
| Notebook UI | PASS | 3 s |
| Clipboard images UI | PASS | 2.3 s |
| Gallery and image moves UI | PASS | 7 s |
| Slash date immediate execution | PASS | 1.9 s |
| Slash building blocks and sharing | PASS | 6.8 s |
| Live output following | PASS | 2.3 s |
| Export image portability | PASS | 1.8 s |
| Workspace UI | PASS | 4.1 s |
| Sidebar UI | PASS | 7.5 s |
| AI UI | PASS | 5.6 s |
| Diff UI | PASS | 1.8 s |
| Native Rust tests | PASS | 4.9 s |
| Clippy | PASS | 2.5 s |
| Website UI and distribution metadata | PASS | 2.8 s |
| Built browser app | PASS | 2.7 s |

## Schwerpunkt dieses Bugfixes

- HTML-Export: lokale Markdown-/HTML-Bilder eingebettet, keine App-internen `asset://`-Links, Galerie als Raster, externe Bilder weiter verlinkt und fehlende Bilder mit ursprünglichem Pfad.
- Bilddateien werden nur einmal pro Export gelesen; der Editor behält seinen eigenen Bildresolver.
- PDF-Export: das an die native PDF-Funktion übergebene HTML enthält eingebettete Bilder.
- Word/Pandoc: der Notizordner wird als `--resource-path` übergeben.
- Neuer nativer Test liest echte temporäre Dateien und bestätigt Bilddaten-URL sowie Ablehnung unbekannter Formate und fehlender Dateien.
- Alle bisherigen Regressionstests und die Produktions-Webapp erfolgreich. Keine Fehler im Release-Test aufgetreten.

## Fertige Release-Pakete

- Apple-Silicon-Release-Build erfolgreich; Mindestversion laut Mach-O: macOS 11.0.
- App und DMG mit Developer ID Application: Tobias Wilhelm (5T32K4L4T4) signiert und von Apple angenommen. Notarisierungs-IDs: App `ff0f4883-3b09-4c2d-8fd6-bd1c06056956`, DMG `bbd95c19-6327-4593-b5c1-249f7698ff7a`.
- Angehängte Tickets geprüft; Gatekeeper akzeptiert die App als `Notarized Developer ID`. Tiefe, strikte Signaturprüfung erfolgreich.
- App und Lizenzverzeichnis in ZIP und DMG stimmen vollständig überein; Applications-Verknüpfung und Herkunftshinweise geprüft.
- Installer-Prüflauf mit dem fertigen ZIP bestätigt SHA-256, Signatur, App-Kennung und Version, ohne Installation.
- Website- und Produktions-Webapp-Tests nach Aktualisierung der endgültigen Distributionsdaten erneut erfolgreich.

| Paket | SHA-256 |
| --- | --- |
| ZIP | `6d0dcbbda5db3f63f7261c15bd654ea858218938ba26b439806c1971136d068a` |
| DMG | `0613cd0742389b467d1058d498e4f37f92e213d2a0f1aa8c39d08ed16f430778` |

## Grenzen

Export-UI-Tests laufen im Browser mit nachgebildeten nativen Dateizugriffen, PDF-/Pandoc-Aufrufen und KI-Antworten. Sie prüfen das exportierte HTML bzw. die an PDF/Pandoc übergebenen Daten, nicht die endgültige Darstellung in einem externen PDF- oder Word-Programm. Der native Bildlesetest verwendet echte temporäre Dateien. Kein vollständiger manueller Export-/Desktop-Durchlauf oder Erststart auf einem frischen Mac. Keine verifizierten Intel-/Windows-/Linux-Pakete oder produktiven kostenpflichtigen KI-Anfragen. Bekannte Build-Hinweise zu großen Frontend-Chunks und zum gemischten statischen/dynamischen Import bleiben bestehen.
