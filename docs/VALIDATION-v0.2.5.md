# Validierung · THE Note 0.2.5

Geprüft am 1. Oktober 2026 auf macOS / Apple Silicon. Ausgangspunkt: `641a4df` auf `main`, einschließlich PR #8 (Diagrammviewer mit Zoom und Verschieben sowie Mermaid-Beschriftungsfix), plus Versions- und Distributionsänderungen für v0.2.5. Abhängigkeiten entsprechen den eingecheckten Lockfiles.

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript und ESLint | Erfolgreich |
| `npm test` | Erfolgreich, einschließlich 44 Formeltabellen-Prüfungen |
| `npm run test:notebook` | Erfolgreich: Vorlagen, Browser-Ausführungsgrenze, Aktivität, Markdown, Tabs, Theme, Export, Mermaid mit fensterfüllendem Diagrammviewer, Zoom, Einpassen und Escape, Formeltabellen und responsive Ansicht |
| `cargo test --locked` | 33 Tests erfolgreich |
| `cargo clippy --locked -- -D warnings` | Erfolgreich |
| Release-Build | Tauri, arm64, Mach-O-Mindestversion macOS 11.0 |
| Developer-ID-Signatur | Tobias Wilhelm, Team `5T32K4L4T4`; Hardened Runtime und sicherer Zeitstempel |
| Apple-Notarisierung: App | Accepted; Einreichung `adfaa3b2-1280-461b-a0af-a59d0d2dbb13` |
| Apple-Notarisierung: DMG | Accepted; Einreichung `84ac56ba-f577-4fb4-924f-1f39ffa6a16c` |
| Stapling | Tickets an App und DMG angeheftet; `stapler validate` erfolgreich |
| Gatekeeper | App und DMG akzeptiert; Quelle `Notarized Developer ID` |
| ZIP/DMG | Prüfsummen stimmen; App und Lizenzordner in beiden Formaten identisch; Applications-Link im gemounteten DMG geprüft |
| curl-Installer | Lokales Release mit `--check --archive` geprüft, einschließlich Gatekeeper, SHA-256, Signatur, Kennung und Version; keine Installation vorgenommen |
| Website | Deutsch/Englisch, Desktop/Tablet/Mobil, Tastatur-/Kopierbedienung, interaktive Vorschau, ZIP-/DMG-Links und Installer erfolgreich geprüft |

## Prüfsummen nach Stapling

```text
79ebc106c66180e6fb29ec3a0b8d7fb4fc0fc17fbfb3f6652b41624359c121a5  THE.Note-macOS-arm64.zip
2f5dd5cc1d54b28d8f37b3e93b9e7885afd2c9e8cfe89c3bc0e787c8c5370083  THE.Note-macOS-arm64.dmg
```

## Grenzen

Die Notebook-Oberfläche wurde im Browser getestet; native Runner und Provider-Verträge durch Rust-Tests. Ein erneuter manueller Durchlauf aller Funktionen der signierten Desktop-App oder ein Erststart auf einem zweiten, frischen Mac wurde für diese Version nicht durchgeführt. Keine verifizierten Windows-/Linux-/Intel-Builds und keine Tests mit kostenpflichtigen produktiven KI-Konten. Die üblichen Build-Hinweise zu großen Frontend-Chunks bleiben bestehen. Die frühere Validierung einschließlich damaliger nativer UI-Prüfungen bleibt unter [VALIDATION.md](VALIDATION.md) dokumentiert.
