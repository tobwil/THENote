# THE Note v0.2.7 · Bilder aus der Zwischenablage

Diese Preview enthält den aktuellen Stand von `main` einschließlich PR #12.

## Neu

- Screenshots, kopierte Bilder und im Finder kopierte Bilddateien direkt in Notizen einfügen, im Live-Editor und im Source-Modus.
- Bilder werden neben der Notiz in `assets/` oder im über `copy-images-to` eingestellten Ordner gespeichert und relativ verlinkt. Noch ungespeicherte Notizen verwenden den Notizordner.
- Im Browser werden Bilder eingebettet. Text aus Excel und Word bleibt Text.

## Download

Für **macOS 11+ auf Apple Silicon**:

- [DMG herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.7/THE.Note-macOS-arm64.dmg): öffnen, **THE Note.app** auf **Applications** ziehen, Image auswerfen und die App im Programme-Ordner öffnen.
- [ZIP herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.7/THE.Note-macOS-arm64.zip).
- [SHA256SUMS](https://github.com/tobwil/THENote/releases/download/v0.2.7/SHA256SUMS) enthält die Prüfsummen beider Pakete.

App und DMG sind mit **Developer ID signiert und Apple-notarisiert**, mit angehefteten Tickets. Vor Updates Notizen speichern und THE Note beenden. Notizdateien werden nicht entfernt. Ältere Releases bleiben unverändert verfügbar.

## Prüfung und Grenzen

Prüfergebnisse und Grenzen: [Validierung v0.2.7](https://github.com/tobwil/THENote/blob/v0.2.7/docs/VALIDATION-v0.2.7.md).

Dies bleibt eine Entwicklungsversion mit derzeit deutscher App-Oberfläche. Windows, Linux und Intel-Macs haben keine verifizierten Pakete. Codeblöcke laufen mit den Rechten deines Benutzerkontos. Produktive KI-Anbieter wurden nicht mit kostenpflichtigen Konten getestet.

## Herkunft

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von Srinivas Gowda und Konzepten sowie dem Frontmatter-Parser aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Gesamtwerk: **GPL-3.0-or-later**; der Ledge-Parser behält **Apache-2.0**. Lizenztexte und Herkunftshinweise liegen beiden Paketen bei. [NOTICE.md](https://github.com/tobwil/THENote/blob/v0.2.7/NOTICE.md) · [LICENSING.md](https://github.com/tobwil/THENote/blob/v0.2.7/LICENSING.md).
