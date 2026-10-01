# Validierung · THE Note 0.2.6

Geprüft am 2. Oktober 2026 auf macOS / Apple Silicon. Ausgangspunkt: `90e3d9c` auf `main`, einschließlich PR #10 (Notizordner, Verschieben von Dateien und Ordnern sowie Wiederherstellung des Arbeitsordners), plus Versions- und Distributionsänderungen für v0.2.6. Abhängigkeiten entsprechen den eingecheckten Lockfiles.

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript und ESLint | Erfolgreich |
| `npm test` | Erfolgreich, einschließlich 44 Formeltabellen-Prüfungen |
| `npm run test:notebook` | Erfolgreich: Vorlagen, Browser-Ausführungsgrenze, Aktivität, Markdown, Tabs, Theme, Export, Mermaid mit fensterfüllendem Diagrammviewer, Zoom, Einpassen und Escape, Formeltabellen und responsive Ansicht |
| `npm run test:workspace:ui` | Erfolgreich: Standardordner, verschachtelte Ordner, Verschieben per Dialog und Drag-and-drop, Wiederherstellung, Tabs und ungespeicherter Text, Kollisionen |
| `node tests/e2e-sidebar.mjs` | Erfolgreich: Baum, Filter, Recent, Kontextmenüs und virtualisierte Dateiliste. Testvorbereitung an Dateien-Ansicht und aktuellen Einstellungsschlüssel angepasst |
| `npm run test:ai:ui` | Erfolgreich: Anbieter-Voreinstellungen, Streaming, Kontext und Rückgängig |
| `cargo test --locked` | 33 Tests erfolgreich |
| `cargo clippy --locked -- -D warnings` | Erfolgreich |
| Release-Build | Tauri, arm64, Mach-O-Mindestversion macOS 11.0 |
| Developer-ID-Signatur | Tobias Wilhelm, Team `5T32K4L4T4`; Hardened Runtime und sicherer Zeitstempel |
| Apple-Notarisierung: App | Accepted; Einreichung `3641dec9-71b0-48b4-8c83-bbb0f59e7e14` |
| Apple-Notarisierung: DMG | Accepted; Einreichung `8019cfc1-e522-4bc7-b00c-db7d0cdfb6b1` |
| Stapling | Tickets an App und DMG angeheftet; `stapler validate` erfolgreich |
| Gatekeeper | App und DMG akzeptiert; Quelle `Notarized Developer ID` |
| ZIP/DMG | Prüfsummen stimmen; App und Lizenzordner in beiden Formaten identisch; Applications-Link im gemounteten DMG geprüft |
| curl-Installer | Lokales Release mit `--check --archive` geprüft, einschließlich Gatekeeper, SHA-256, Signatur, Kennung und Version; keine Installation vorgenommen |
| Website | Deutsch/Englisch, Desktop/Tablet/Mobil, Tastatur-/Kopierbedienung, interaktive Vorschau, ZIP-/DMG-Links und Installer erfolgreich geprüft |

## Prüfsummen nach Stapling

```text
c3b2541e4ed43c681374fd1380ce3ea411d7d040aad059d1e26224d6f7409e63  THE.Note-macOS-arm64.zip
c572434315981c25e3308037f6fa095f3296eef086e80bf014ff2616a93149ba  THE.Note-macOS-arm64.dmg
```

## Grenzen

Die Oberflächen wurden im Browser getestet; Workspace- und KI-UI-Tests verwenden nachgebildete native IPC-Antworten; native Runner und Provider-Verträge durch Rust-Tests. Ein erneuter manueller Durchlauf aller Funktionen der signierten Desktop-App oder ein Erststart auf einem zweiten, frischen Mac wurde für diese Version nicht durchgeführt. Keine verifizierten Windows-/Linux-/Intel-Builds und keine Tests mit kostenpflichtigen produktiven KI-Konten. Die üblichen Build-Hinweise zu großen Frontend-Chunks bleiben bestehen. Die frühere Validierung einschließlich damaliger nativer UI-Prüfungen bleibt unter [VALIDATION.md](VALIDATION.md) dokumentiert.
