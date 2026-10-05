# THE Note v0.2.8 · Bildgalerien und sichere Bildverwaltung

Diese Preview enthält den aktuellen Stand von `main` einschließlich PR #14 sowie zusätzliche Regressionstests und einen daraus entstandenen Dateischutz-Fix.

## Neu

- Mehrere Bilder in einem Absatz bilden eine Galerie mit Vollbildansicht, Vorschaubildern und Tastaturbedienung.
- Bilder ziehen mit ihrer Notiz um; gemeinsam genutzte Bilder werden kopiert. Namenskollisionen erhalten beide Dateien. Absolute Bildpfade werden bei Bedarf relativ verlinkt.
- Einfacheres Sortieren per Drag-and-drop und neue Ordner direkt im Verschieben-Dialog.
- Zusätzlicher Schutz vor dem Löschen des Originals, wenn Quell- und Zielordner dieselbe Datei bezeichnen, auch über einen Ordner-Alias.
- Neun zusätzliche native Dateitests, sieben weitere Galerie-Prüfungen und `npm run test:release` mit automatischem Markdown-/JSON-Testbericht und einzelnen Logs.

## Download

Für **macOS 11+ auf Apple Silicon**:

- [DMG herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.8/THE.Note-macOS-arm64.dmg): öffnen, **THE Note.app** auf **Applications** ziehen, Image auswerfen und die App im Programme-Ordner öffnen.
- [ZIP herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.8/THE.Note-macOS-arm64.zip).
- [SHA256SUMS](https://github.com/tobwil/THENote/releases/download/v0.2.8/SHA256SUMS) enthält die Prüfsummen beider Pakete.

App und DMG sind mit **Developer ID signiert und Apple-notarisiert**, mit angehefteten Tickets. Vor Updates Notizen speichern und THE Note beenden. Notizdateien werden nicht entfernt. Ältere Releases bleiben unverändert verfügbar.

## Prüfung und Grenzen

Prüfergebnisse und Grenzen: [Validierung v0.2.8](https://github.com/tobwil/THENote/blob/v0.2.8/docs/VALIDATION-v0.2.8.md).

Dies bleibt eine Entwicklungsversion mit derzeit deutscher App-Oberfläche. Windows, Linux und Intel-Macs haben keine verifizierten Pakete. Codeblöcke laufen mit den Rechten deines Benutzerkontos. Produktive KI-Anbieter wurden nicht mit kostenpflichtigen Konten getestet.

## Herkunft

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von Srinivas Gowda und Konzepten sowie dem Frontmatter-Parser aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Gesamtwerk: **GPL-3.0-or-later**; der Ledge-Parser behält **Apache-2.0**. Lizenztexte und Herkunftshinweise liegen beiden Paketen bei. [NOTICE.md](https://github.com/tobwil/THENote/blob/v0.2.8/NOTICE.md) · [LICENSING.md](https://github.com/tobwil/THENote/blob/v0.2.8/LICENSING.md).
