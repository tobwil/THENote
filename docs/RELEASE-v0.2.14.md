# THE Note v0.2.14 · Bilder im Export

Diese Preview enthält den Export-Bugfix aus PR #27.

## Behoben

- HTML- und PDF-Exporte betten lokale Bilder ein. Die exportierte Datei enthält die Bilddaten und benötigt keine App-internen `asset://`-Links.
- Galerien erscheinen im Export als Raster, damit alle Bilder sichtbar bleiben.
- Word-/Pandoc-Exporte bekommen den Notizordner als Suchpfad für relative Bilder.
- Remote-Bilder bleiben verlinkt; bei fehlenden lokalen Dateien bleibt der ursprüngliche Bildpfad erhalten.
- Der neue Test für portable Bild-Exporte ist Teil des gemeinsamen Release-Testlaufs.

## Download

Für **macOS 11+ auf Apple Silicon**:

- [DMG herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.14/THE.Note-macOS-arm64.dmg): öffnen, **THE Note.app** auf **Applications** ziehen, Image auswerfen und die App im Programme-Ordner öffnen.
- [ZIP herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.14/THE.Note-macOS-arm64.zip).
- [SHA256SUMS](https://github.com/tobwil/THENote/releases/download/v0.2.14/SHA256SUMS) enthält die Prüfsummen beider Pakete.

App und DMG sind mit **Developer ID signiert und Apple-notarisiert**, mit angehefteten Tickets. Vor Updates Notizen speichern und THE Note beenden. Notizdateien werden nicht entfernt. Ältere Releases bleiben unverändert verfügbar.

## Prüfung und Grenzen

Prüfergebnisse und Grenzen: [Validierung v0.2.14](https://github.com/tobwil/THENote/blob/v0.2.14/docs/VALIDATION-v0.2.14.md).

Dies bleibt eine Entwicklungsversion mit derzeit deutscher App-Oberfläche. Windows, Linux und Intel-Macs haben keine verifizierten Pakete. Codeblöcke laufen mit den Rechten deines Benutzerkontos. Produktive KI-Anbieter wurden nicht mit kostenpflichtigen Konten getestet.

## Herkunft

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von Srinivas Gowda und Konzepten sowie dem Frontmatter-Parser aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Gesamtwerk: **GPL-3.0-or-later**; der Ledge-Parser behält **Apache-2.0**. Lizenztexte und Herkunftshinweise liegen beiden Paketen bei. [NOTICE.md](https://github.com/tobwil/THENote/blob/v0.2.14/NOTICE.md) · [LICENSING.md](https://github.com/tobwil/THENote/blob/v0.2.14/LICENSING.md).
