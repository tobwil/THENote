# Testbericht · THE Note 0.2.8

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Basis: `3229a6c` auf `main` (PR #14), ergänzt um den Schutz vor identischen Bildpfaden, neue Tests und Release-Metadaten. Abhängigkeiten bleiben auf den eingecheckten Lockfiles.

## Automatisierter Release-Test

**13 von 13 Testgruppen erfolgreich**, darunter **43 native Rust-Tests**. Aufruf: `npm run test:release` (Cargo auf PATH). Jeder Lauf erzeugt Markdown, JSON, Laufzeiten, Exitcodes und einzelne Protokolle unter `release/tests-v<version>-<timestamp>/`.

| Testgruppe | Ergebnis | Dauer |
| --- | --- | ---: |
| TypeScript | PASS | 1.5 s |
| ESLint | PASS | 1.4 s |
| Unit and regression tests | PASS | 12.5 s |
| Notebook UI | PASS | 3 s |
| Clipboard images UI | PASS | 2.4 s |
| Gallery and image moves UI | PASS | 3.4 s |
| Workspace UI | PASS | 4.1 s |
| Sidebar UI | PASS | 7.5 s |
| AI UI | PASS | 5.8 s |
| Diff UI | PASS | 1.8 s |
| Native Rust tests | PASS | 4.7 s |
| Clippy | PASS | 2.5 s |
| Website UI and distribution metadata | PASS | 2.6 s |

## Erweiterungen und gefundener Fehler

- Neun neue native Regressionstests mit echten temporären Dateien: identischer Quell-/Zielordner, Ordner-Alias, identische Bildinhalte mit Kopieren oder Verschieben, mehrfache Namenskollisionen, blockierter Zielordner, fehlende/absolute/ausbrechende Pfade, Einfügen ohne Überschreiben, ungültige Bilddaten/Formate und sichere Dateinamen.
- Sieben zusätzliche Galerie-Prüfungen: Pfeiltasten am ersten/letzten Bild, Home/End, Auswahl per Vorschaubild und eindeutiger aktiver Zustand.
- Der neue Test für denselben Quell- und Zielordner schlug zunächst fehl: Die native Funktion löschte das Bild beim Wiederverwenden einer identischen Zieldatei. Sie vergleicht nun die kanonischen Pfade vor dem Löschen. Derselbe Test und der zusätzliche Alias-Test bestehen. Die Oberfläche verhindert bereits einfache Verschiebevorgänge innerhalb desselben Ordners; der Fix sichert die native Dateifunktion zusätzlich ab.
- Galerie, Mitnehmen/Kopieren von Bildern, Drag-and-drop, Zwischenablage, Notebook, Ordnerverwaltung, Sidebar, KI- und Diff-Oberfläche laufen im Release-Test mit.

## Fertige Pakete

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | Tauri, Apple Silicon arm64, Mindestversion macOS 11.0 |
| Signatur | Developer ID Application: Tobias Wilhelm, Team `5T32K4L4T4`, Hardened Runtime und Zeitstempel |
| Apple-Notarisierung App | Accepted; `1c8c0200-54c4-448a-b6fa-f9f193618df5` |
| Apple-Notarisierung DMG | Accepted; `473f04a4-feb3-4cc6-b9e2-008aa3301986` |
| Stapling und Gatekeeper | App und DMG erfolgreich; `Notarized Developer ID` |
| ZIP/DMG | App und Lizenzordner identisch; SHA-256 und Applications-Link geprüft |
| Installer | Lokales ZIP mit `--check --archive` erfolgreich; keine Installation vorgenommen |
| Website mit endgültigen Release-Metadaten | `npm run test:site` erneut erfolgreich nach Aktualisierung der Prüfsummen |

Prüfsummen nach Stapling:

```text
e1576d237e8fe846bb8c1a52a7c36cc8c03287b0b745d9ed0a31b1752630b478  THE.Note-macOS-arm64.zip
82d8f4874e967402b9dca2a86781de3afc6d048d58f7622ebe1186a943b766a1  THE.Note-macOS-arm64.dmg
```

## Grenzen

Die UI-Tests laufen im Browser; native IPC und Zwischenablage-Ereignisse werden nachgebildet. Rust-Dateitests verwenden echte temporäre Dateien. Kein manueller Test der echten macOS-Zwischenablage, kein vollständiger manueller Durchlauf der signierten Desktop-App und kein Erststart auf einem frischen Mac. Keine verifizierten Intel-/Windows-/Linux-Pakete oder produktiven kostenpflichtigen KI-Anfragen. Bekannte Build-Hinweise zu großen Frontend-Chunks und zum gemischten statischen/dynamischen Import bleiben bestehen.
