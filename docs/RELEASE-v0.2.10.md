# THE Note v0.2.10 · Bilder einfügen und sortieren

Diese Preview enthält den aktuellen Stand von `main` einschließlich PR #18.

## Neu

- Sofort bestätigte Slash-Befehle entfernen den vollständigen Suchtext. Ein neuer Test für Klick, Enter und Tab sichert den im Release-Test gefundenen Fehler ab.

- Eingefügte Bilder erscheinen im Live-Editor sofort als Bild; der Cursor steht dahinter.
- Bilder aus anderen Absätzen oder einzelnen Bildblöcken per Drag-and-drop in eine Galerie ziehen oder innerhalb einer Galerie neu sortieren. Die Einfügeposition wird markiert.
- Ein Verschieben lässt sich mit einem Undo-Schritt rückgängig machen; Escape bricht den Vorgang ab.
- Bilddateien aus dem Finder direkt an der gewünschten Stelle in eine Galerie einfügen.
- Neue automatisierte Prüfungen für Galerie-Drag-and-drop und sofort sichtbare Zwischenablagebilder sind Teil des gemeinsamen Release-Testlaufs.

## Download

Für **macOS 11+ auf Apple Silicon**:

- [DMG herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.10/THE.Note-macOS-arm64.dmg): öffnen, **THE Note.app** auf **Applications** ziehen, Image auswerfen und die App im Programme-Ordner öffnen.
- [ZIP herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.10/THE.Note-macOS-arm64.zip).
- [SHA256SUMS](https://github.com/tobwil/THENote/releases/download/v0.2.10/SHA256SUMS) enthält die Prüfsummen beider Pakete.

App und DMG sind mit **Developer ID signiert und Apple-notarisiert**, mit angehefteten Tickets. Vor Updates Notizen speichern und THE Note beenden. Notizdateien werden nicht entfernt. Ältere Releases bleiben unverändert verfügbar.

## Prüfung und Grenzen

Prüfergebnisse und Grenzen: [Validierung v0.2.10](https://github.com/tobwil/THENote/blob/v0.2.10/docs/VALIDATION-v0.2.10.md).

Dies bleibt eine Entwicklungsversion mit derzeit deutscher App-Oberfläche. Windows, Linux und Intel-Macs haben keine verifizierten Pakete. Codeblöcke laufen mit den Rechten deines Benutzerkontos. Produktive KI-Anbieter wurden nicht mit kostenpflichtigen Konten getestet.

## Herkunft

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von Srinivas Gowda und Konzepten sowie dem Frontmatter-Parser aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Gesamtwerk: **GPL-3.0-or-later**; der Ledge-Parser behält **Apache-2.0**. Lizenztexte und Herkunftshinweise liegen beiden Paketen bei. [NOTICE.md](https://github.com/tobwil/THENote/blob/v0.2.10/NOTICE.md) · [LICENSING.md](https://github.com/tobwil/THENote/blob/v0.2.10/LICENSING.md).
