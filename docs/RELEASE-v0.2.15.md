# THE Note v0.2.15 · Export mit oder ohne Bilder

Diese Preview enthält die Exportoptionen aus PR #29.

## Neu

- HTML, PDF, Word und andere Pandoc-Formate bieten „Bilder mitnehmen“ mit der Bildanzahl an; HTML zusätzlich ein Inhaltsverzeichnis.
- Die Auswahl wird für spätere Exporte gespeichert. PDF und Word überspringen den Dialog bei Notizen ohne Bilder.
- Exporte ohne Bilder entfernen auch verlinkte Bilder und leere Galerieabsätze. Codeblöcke und harte Zeilenumbrüche bleiben erhalten; Bilddateien werden dabei nicht gelesen.
- Der bestehende Export-Regressionstest prüft die neuen Optionen und ist Teil des gemeinsamen Release-Testlaufs.

## Download

Für **macOS 11+ auf Apple Silicon**:

- [DMG herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.15/THE.Note-macOS-arm64.dmg): öffnen, **THE Note.app** auf **Applications** ziehen, Image auswerfen und die App im Programme-Ordner öffnen.
- [ZIP herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.15/THE.Note-macOS-arm64.zip).
- [SHA256SUMS](https://github.com/tobwil/THENote/releases/download/v0.2.15/SHA256SUMS) enthält die Prüfsummen beider Pakete.

App und DMG sind mit **Developer ID signiert und Apple-notarisiert**, mit angehefteten Tickets. Vor Updates Notizen speichern und THE Note beenden. Notizdateien werden nicht entfernt. Ältere Releases bleiben unverändert verfügbar.

## Prüfung und Grenzen

Prüfergebnisse und Grenzen: [Validierung v0.2.15](https://github.com/tobwil/THENote/blob/v0.2.15/docs/VALIDATION-v0.2.15.md).

Dies bleibt eine Entwicklungsversion mit derzeit deutscher App-Oberfläche. Windows, Linux und Intel-Macs haben keine verifizierten Pakete. Codeblöcke laufen mit den Rechten deines Benutzerkontos. Produktive KI-Anbieter wurden nicht mit kostenpflichtigen Konten getestet.

## Herkunft

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von Srinivas Gowda und Konzepten sowie dem Frontmatter-Parser aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Gesamtwerk: **GPL-3.0-or-later**; der Ledge-Parser behält **Apache-2.0**. Lizenztexte und Herkunftshinweise liegen beiden Paketen bei. [NOTICE.md](https://github.com/tobwil/THENote/blob/v0.2.15/NOTICE.md) · [LICENSING.md](https://github.com/tobwil/THENote/blob/v0.2.15/LICENSING.md).
