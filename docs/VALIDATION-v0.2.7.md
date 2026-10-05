# Validierung · THE Note 0.2.7

Geprüft am 5. Oktober 2026 auf macOS / Apple Silicon. Ausgangspunkt: `97972c4` auf `main`, einschließlich PR #12 (Bilder aus der Zwischenablage), plus Versions- und Distributionsänderungen für v0.2.7. Abhängigkeiten entsprechen den eingecheckten Lockfiles.

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript und ESLint | Erfolgreich |
| `npm test` | Erfolgreich, einschließlich 44 Formeltabellen- und 9 Bild-Einfüge-Prüfungen |
| `npm run test:notebook` | Erfolgreich: Vorlagen, Browser-Ausführungsgrenze, Aktivität, Markdown, Tabs, Theme, Export, Mermaid mit fensterfüllendem Diagrammviewer, Zoom, Einpassen und Escape, Formeltabellen und responsive Ansicht |
| `npm run test:workspace:ui` | Erfolgreich: Standardordner, verschachtelte Ordner, Verschieben per Dialog und Drag-and-drop, Wiederherstellung, Tabs und ungespeicherter Text, Kollisionen |
| `npm run test:paste:ui` | Erfolgreich: Bildablage für gespeicherte/ungespeicherte Notizen, Dateinamen, `copy-images-to`, Textvorrang, Source-Modus und Browser-Einbettung; native IPC nachgebildet |
| `cargo test --locked` | 33 Tests erfolgreich |
| `cargo clippy --locked -- -D warnings` | Erfolgreich |
| Release-Build | Tauri, arm64, Mach-O-Mindestversion macOS 11.0 |
| Developer-ID-Signatur | Tobias Wilhelm, Team `5T32K4L4T4`; Hardened Runtime und sicherer Zeitstempel |
| Apple-Notarisierung: App | Accepted; Einreichung `0fbcdf58-50ff-49ef-8281-2a62a010e91e` |
| Apple-Notarisierung: DMG | Accepted; Einreichung `a0791283-4b87-4ca2-b3bf-1c6c0a8a1678` |
| Stapling | Tickets an App und DMG angeheftet; `stapler validate` erfolgreich |
| Gatekeeper | App und DMG akzeptiert; Quelle `Notarized Developer ID` |
| ZIP/DMG | Prüfsummen stimmen; App und Lizenzordner in beiden Formaten identisch; Applications-Link im gemounteten DMG geprüft |
| curl-Installer | Lokales Release mit `--check --archive` geprüft, einschließlich Gatekeeper, SHA-256, Signatur, Kennung und Version; keine Installation vorgenommen |
| Website | Deutsch/Englisch, Desktop/Tablet/Mobil, Tastatur-/Kopierbedienung, interaktive Vorschau, ZIP-/DMG-Links und Installer erfolgreich geprüft |

## Prüfsummen nach Stapling

```text
84f6120bc33bafadad5245bb81057bc747cac943ea34ebb4b0572a89c0abc4c7  THE.Note-macOS-arm64.zip
b3e0bb07aaab79887bb24db1d35eedc75e6cb43d797af46fbd1597c247a90a33  THE.Note-macOS-arm64.dmg
```

## Grenzen

Die Oberflächen wurden im Browser getestet; Workspace- und Bild-Einfüge-Tests verwenden nachgebildete native IPC-Antworten; native Runner und Provider-Verträge durch Rust-Tests. Das Einfügen aus der echten macOS-Zwischenablage wurde nicht manuell geprüft. Ein erneuter manueller Durchlauf aller Funktionen der signierten Desktop-App oder ein Erststart auf einem zweiten, frischen Mac wurde für diese Version nicht durchgeführt. Keine verifizierten Windows-/Linux-/Intel-Builds und keine Tests mit kostenpflichtigen produktiven KI-Konten. Die üblichen Build-Hinweise zu großen Frontend-Chunks bleiben bestehen. Die frühere Validierung einschließlich damaliger nativer UI-Prüfungen bleibt unter [VALIDATION.md](VALIDATION.md) dokumentiert.
