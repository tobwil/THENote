# Herkunft und Lizenzen

THE Note ist ein unabhängiges Folgeprojekt. Die Gesamtdistribution erfolgt unter GPL-3.0-or-later; der vollständige Text liegt in `LICENSE`.

Copyright © 2026 THE Note contributors für eigene Beiträge. Projektpflege: [tobwil](https://github.com/tobwil/THENote). Weitere Details: [LICENSING.md](LICENSING.md).

## Sarala

- Quelle: https://github.com/solancer/sarala
- Verwendeter Stand: `4c58383c04cc82d454b914d3bb9b984eb87bd1a7`
- Urheber: Srinivas Gowda
- Lizenz: GPL-3.0-or-later, siehe `LICENSE`.
- Übernommen: SolidJS-Editor, Markdown-Pipeline, Dokumentverwaltung, Tauri-Dateisystemadapter, Einstellungen, Export, Tests und zugehörige Assets. Die Quelltexte in `src`, `src-tauri`, die ursprünglichen Tests und Lizenzen basieren auf diesem Stand, soweit nicht als neue THE-Note-Komponenten beschrieben.
- Änderungen: eigene App-Identität und Gestaltung, Startdokument und Vorlagen, Code-Ausführung samt UI und Rust-Backend, Laufkontext, Aktivitätsverlauf, deaktivierter Upstream-Updater, eigene Dokumentation und Prüfungen; später Inline-KI, Modellverzeichnisse, Schlüsselbund-Anbindung, Fokus-/Layoutkorrekturen, Speicherdiff, Projekt-/Ordnerverwaltung, Tab-Umbenennen und Datumspicker. Die originale Dokumentation liegt zur Nachvollziehbarkeit unter `docs/upstream/sarala`.

## Ledge

- Quelle: https://github.com/ledgesh/ledge
- Urheber: Ledge contributors; ursprüngliche Copyright- und Lizenzhinweise bleiben erhalten.
- Verwendeter Stand: `4dc8ec1153142c46f2a8331a8143ecaf4b2d1914`
- Lizenz: Apache-2.0, unverändert unter `docs/upstream/LEDGE-LICENSE`.
- Übernommen: `src/shared/frontmatter.ts` als `src/execution/ledge-frontmatter.ts`, ergänzt um Herkunftshinweise. Der Parser selbst wurde nicht geändert.
- Die Runbook-Interaktion, expliziter Ausführungskontext und die Trennung von Markdown und temporären Ausgaben folgen Ledges Architektur. Der lokale Rust-Runner wurde neu implementiert; Electrobun/Bun, Server, SSH-Transport und PTY-Pool wurden nicht kopiert.
- Die von Ledge gelieferten Hinweise sind unverändert unter `docs/upstream/LEDGE-THIRD-PARTY-NOTICES.md` archiviert. Sie dokumentieren das Originalprojekt; nicht alle dort aufgeführten Bibliotheken werden in THE Note verwendet.

## Weitere Komponenten

Die bestehenden Emoji- und Unicode-Lizenzhinweise liegen in `licenses`. Abhängigkeiten sind in `package-lock.json` und `src-tauri/Cargo.lock` festgehalten und behalten ihre eigenen Lizenzen. Die Nutzung der ursprünglichen Projektnamen dient der Quellenangabe und behauptet keine Zugehörigkeit oder Unterstützung.
