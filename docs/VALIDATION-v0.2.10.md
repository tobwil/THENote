# Testbericht · THE Note 0.2.10

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Basis: `6905edc` auf `main` (PR #18), ergänzt um den im Release-Test gefundenen Slash-Menü-Fix, dessen Regressionstest und Versions-/Distributionsänderungen. Abhängigkeiten bleiben auf den eingecheckten Lockfiles.

## Automatisierter Release-Test

**14 von 14 Testgruppen erfolgreich**, darunter **43 native Rust-Tests**. Aufruf: `npm run test:release` (Cargo auf PATH). Einzelne Logs, Markdown und JSON liegen lokal unter `release/tests-v0.2.10-2026-10-05T09-40-42-054Z/`.

| Testgruppe | Ergebnis | Dauer |
| --- | --- | ---: |
| TypeScript | PASS | 1.5 s |
| ESLint | PASS | 1.6 s |
| Unit and regression tests | PASS | 12.2 s |
| Notebook UI | PASS | 2.9 s |
| Clipboard images UI | PASS | 2.3 s |
| Gallery and image moves UI | PASS | 7 s |
| Slash date immediate execution | PASS | 2 s |
| Workspace UI | PASS | 4.1 s |
| Sidebar UI | PASS | 7.5 s |
| AI UI | PASS | 5.6 s |
| Diff UI | PASS | 1.9 s |
| Native Rust tests | PASS | 2.4 s |
| Clippy | PASS | 1 s |
| Website UI and distribution metadata | PASS | 2.6 s |

## Neue Prüfungen und gefundener Fehler

- Die Galerie-Suite enthält jetzt den neuen Drag-and-drop-Test: Bilder aus Textabsätzen und einzelnen Bildblöcken einfügen, Reihenfolge ändern, mit einem Undo-Schritt rückgängig machen, Escape zum Abbrechen, Klick öffnet weiterhin den Viewer. Finder-Dateien werden über nachgebildete Dateipfade eingefügt.
- Zwischenablage-Tests prüfen zusätzlich, dass eingefügte Bilder sofort gerendert erscheinen.
- Erster Release-Lauf: 12/13 Testgruppen erfolgreich. Der Workspace-Test fand beim schnellen Ausführen von `/date` ein verbliebenes `ate` im Text. Ein isolierter Test reproduzierte den Fehler zuverlässig: Das Slash-Menü verwendete den vor dem nächsten Animation Frame gespeicherten, veralteten Textbereich.
- Fix: Vor Ausführung Text und Cursorposition synchron aktualisieren; bei Enter/Tab zusätzlich die aktuelle Trefferliste verwenden. Der neue Test bestätigt Klick, Enter und Tab im selben Ereignisdurchlauf wie die letzten Eingabezeichen. Er wurde vor dem Fix fehlschlagend und danach erfolgreich ausgeführt.
- Abschließender vollständiger Lauf: 14/14 erfolgreich. Der Fix ist im erneut gebauten Paket enthalten. Der ursprüngliche Lauf und dessen Protokolle bleiben lokal unter `release/tests-v0.2.10-2026-10-05T09-36-16-539Z/` erhalten.

## Fertige Pakete

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | Tauri, Apple Silicon arm64, Mindestversion macOS 11.0; nach Slash-Fix erneut gebaut |
| Signatur | Developer ID Application: Tobias Wilhelm, Team `5T32K4L4T4`, Hardened Runtime und Zeitstempel |
| Apple-Notarisierung App | Accepted; `9ea775e1-855c-45c4-bb04-dfeb49da50b0` |
| Apple-Notarisierung DMG | Accepted; `24690752-a900-4c4b-ab2d-0b5c8bbd6767` |
| Stapling und Gatekeeper | App und DMG erfolgreich; `Notarized Developer ID` |
| ZIP/DMG | App und Lizenzordner identisch; SHA-256 und Applications-Link geprüft |
| Installer | Lokales ZIP mit `--check --archive` erfolgreich; keine Installation vorgenommen |
| Website mit endgültigen Release-Metadaten | `npm run test:site` nach Aktualisierung der Prüfsummen erneut erfolgreich |

Prüfsummen nach Stapling:

```text
c7e89b61f0dfd73fd5aa34fc3ca1c4fd7fd24569c76d1118f69d58a9c70f50e2  THE.Note-macOS-arm64.zip
ad45fc3772a155c33a41fc30dc5e7825df5644b52b023d179325eb038250b06b  THE.Note-macOS-arm64.dmg
```

## Grenzen

UI-Tests laufen im Browser mit nachgebildeter nativer IPC und Zwischenablage-Ereignissen; Rust-Dateitests verwenden echte temporäre Dateien. Kein manueller Test der echten macOS-Zwischenablage oder Finder-Drops in der signierten App, kein vollständiger manueller Desktop-Durchlauf und kein Erststart auf einem frischen Mac. Keine verifizierten Intel-/Windows-/Linux-Pakete oder produktiven kostenpflichtigen KI-Anfragen. Bekannte Build-Hinweise zu großen Frontend-Chunks und zum gemischten statischen/dynamischen Import bleiben bestehen.
