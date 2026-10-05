# Testbericht · THE Note 0.2.15

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Basis: `78807b2` (main mit PR #29, Exportoptionen), ergänzt um Versions-/Distributionsänderungen für v0.2.15. Abhängigkeiten bleiben auf den eingecheckten Lockfiles.

## Automatisierter Release-Test

**18 von 18 Testgruppen erfolgreich**, darunter **44 native Rust-Tests**. Aufruf: `npm run test:release` (Cargo auf PATH). Einzelne Logs, Markdown und JSON liegen lokal unter `release/tests-v0.2.15-2026-10-05T17-27-26-042Z/`.

| Testgruppe | Ergebnis | Dauer |
| --- | --- | ---: |
| TypeScript | PASS | 1.5 s |
| ESLint | PASS | 1.6 s |
| Unit and regression tests | PASS | 13.3 s |
| Notebook UI | PASS | 3 s |
| Clipboard images UI | PASS | 2.3 s |
| Gallery and image moves UI | PASS | 6.9 s |
| Slash date immediate execution | PASS | 2.2 s |
| Slash building blocks and sharing | PASS | 7.1 s |
| Live output following | PASS | 2.3 s |
| Export image portability | PASS | 2.2 s |
| Workspace UI | PASS | 4 s |
| Sidebar UI | PASS | 7.8 s |
| AI UI | PASS | 6 s |
| Diff UI | PASS | 1.9 s |
| Native Rust tests | PASS | 5.5 s |
| Clippy | PASS | 2.5 s |
| Website UI and distribution metadata | PASS | 2.7 s |
| Built browser app | PASS | 2.5 s |

## Schwerpunkt dieses Updates

- HTML-Export: lokale Markdown-/HTML-Bilder eingebettet, keine App-internen `asset://`-Links, Galerie als Raster, externe Bilder weiter verlinkt und fehlende Bilder mit ursprünglichem Pfad. Bilddateien werden nur einmal pro Export gelesen; der Editor behält seinen eigenen Bildresolver.
- Exportoptionen: „Bilder mitnehmen“ ist standardmäßig aktiv und zeigt die Bildanzahl; HTML bietet zusätzlich das Inhaltsverzeichnis, PDF nicht.
- Export ohne Bilder: HTML enthält keine Bildtags oder leeren Galerien; kein Bilddateizugriff. Word/Pandoc bekommt Markdown ohne Bilder, Text bleibt erhalten. Die Auswahl wird bis zum nächsten Dialog gemerkt.
- Entfernen von Bildern erhält Syntax in Codeblöcken und harte Zeilenumbrüche; verlinkte Bilder hinterlassen keine leeren Links.
- PDF-Export: das an die native PDF-Funktion übergebene HTML enthält eingebettete Bilder. Word/Pandoc: der Notizordner wird als `--resource-path` übergeben.
- Alle bisherigen Regressionstests und die Produktions-Webapp erfolgreich. Keine Fehler im Release-Test aufgetreten.

## Fertige Release-Pakete

- Apple-Silicon-Release-Build erfolgreich; Mindestversion laut Mach-O: macOS 11.0.
- App und DMG mit Developer ID Application: Tobias Wilhelm (5T32K4L4T4) signiert und von Apple angenommen. Notarisierungs-IDs: App `463a60e2-eae8-4dd9-9e9b-a5591c43123b`, DMG `f695300e-fe71-4141-b159-b00d0598c238`.
- Angehängte Tickets geprüft; Gatekeeper akzeptiert die App als `Notarized Developer ID`. Tiefe, strikte Signaturprüfung erfolgreich.
- App und Lizenzverzeichnis in ZIP und DMG stimmen vollständig überein; Applications-Verknüpfung und Herkunftshinweise geprüft.
- Installer-Prüflauf mit dem fertigen ZIP bestätigt SHA-256, Signatur, App-Kennung und Version, ohne Installation.
- Website- und Produktions-Webapp-Tests nach Aktualisierung der endgültigen Distributionsdaten erneut erfolgreich.

| Paket | SHA-256 |
| --- | --- |
| ZIP | `8c1c122949a14445833f8d6ba19044f9ebce0aea7b2019b24cd60500b3123580` |
| DMG | `c6be2ae34984e0ad901e2c265f4a4bdd7dd94f47f9526efc0193a4182a59a429` |

## Grenzen

Export-UI-Tests laufen im Browser mit nachgebildeten nativen Dateizugriffen, PDF-/Pandoc-Aufrufen und KI-Antworten. Sie prüfen das exportierte HTML bzw. die an PDF/Pandoc übergebenen Daten, nicht die endgültige Darstellung in einem externen PDF- oder Word-Programm. Das Merken der Exportauswahl wurde zwischen Dialogaufrufen geprüft, nicht nach einem Neustart der nativen App. Der native Bildlesetest verwendet echte temporäre Dateien. Kein vollständiger manueller Export-/Desktop-Durchlauf oder Erststart auf einem frischen Mac. Keine verifizierten Intel-/Windows-/Linux-Pakete oder produktiven kostenpflichtigen KI-Anfragen. Bekannte Build-Hinweise zu großen Frontend-Chunks und zum gemischten statischen/dynamischen Import bleiben bestehen.
