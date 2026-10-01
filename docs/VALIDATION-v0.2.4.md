# Validierung · THE Note 0.2.4

Geprüft am 1. Oktober 2026 auf macOS / Apple Silicon. Ausgangspunkt: `76729f2` auf `main`, einschließlich PR #6 (Formeltabellen mit ganzen Spalten und erklärten Fehlern), plus Versions- und Distributionsänderungen für v0.2.4. Abhängigkeiten entsprechen den eingecheckten Lockfiles.

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript und ESLint | Erfolgreich |
| `npm test` | Erfolgreich, einschließlich 44 Formeltabellen-Prüfungen |
| `npm run test:notebook` | Erfolgreich: Vorlagen, Browser-Ausführungsgrenze, Aktivität, Markdown, Tabs, Theme, Export, Mermaid, Formeltabellen und responsive Ansicht |
| `cargo test --locked` | 33 Tests erfolgreich |
| `cargo clippy --locked -- -D warnings` | Erfolgreich |
| Release-Build | Tauri, arm64, Mach-O-Mindestversion macOS 11.0 |
| Developer-ID-Signatur | Tobias Wilhelm, Team `5T32K4L4T4`; Hardened Runtime und sicherer Zeitstempel |
| Apple-Notarisierung: App | Accepted; Einreichung `bea8b6e8-2d2c-43f9-a74d-81efb7b1512e` |
| Apple-Notarisierung: DMG | Accepted; Einreichung `bb748b8a-f58f-4698-b891-91b16f176f26` |
| Stapling | Tickets an App und DMG angeheftet; `stapler validate` erfolgreich |
| Gatekeeper | App und DMG akzeptiert; Quelle `Notarized Developer ID` |
| ZIP/DMG | Prüfsummen stimmen; App und Lizenzordner in beiden Formaten identisch; Applications-Link im gemounteten DMG geprüft |
| curl-Installer | Lokales Release mit `--check --archive` geprüft, einschließlich Gatekeeper, SHA-256, Signatur, Kennung und Version; keine Installation vorgenommen |
| Website | Deutsch/Englisch, Desktop/Tablet/Mobil, Tastatur-/Kopierbedienung, interaktive Vorschau, ZIP-/DMG-Links und Installer erfolgreich geprüft |

## Prüfsummen nach Stapling

```text
cf48ca5f359a1e8086cf116a8667547940c72abe76d4f6d0cdcc5865c0ed629e  THE.Note-macOS-arm64.zip
37ad4b9a184137b9ff6e3f393ffd31e9510ef80ab6f96c1410b2968438d7f15b  THE.Note-macOS-arm64.dmg
```

## Grenzen

Die Notebook-Oberfläche wurde im Browser getestet; native Runner und Provider-Verträge durch Rust-Tests. Ein erneuter manueller Durchlauf aller Funktionen der signierten Desktop-App oder ein Erststart auf einem zweiten, frischen Mac wurde für diese Version nicht durchgeführt. Keine verifizierten Windows-/Linux-/Intel-Builds und keine Tests mit kostenpflichtigen produktiven KI-Konten. Die üblichen Build-Hinweise zu großen Frontend-Chunks bleiben bestehen. Die frühere Validierung einschließlich damaliger nativer UI-Prüfungen bleibt unter [VALIDATION.md](VALIDATION.md) dokumentiert.
