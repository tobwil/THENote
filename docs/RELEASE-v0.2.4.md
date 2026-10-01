# THE Note v0.2.4 · signierte und Apple-notarisierte Preview

Diese Version enthält den aktuellen Entwicklungsstand einschließlich Formeltabellen und ist die erste Preview mit Developer-ID-Signatur und Apple-Notarisierung.

## Download und Installation

Für **macOS 11+ auf Apple Silicon**:

- [DMG herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.4/THE.Note-macOS-arm64.dmg): öffnen, **THE Note.app** auf **Applications** ziehen, Image auswerfen und die App im Programme-Ordner öffnen.
- [ZIP herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.4/THE.Note-macOS-arm64.zip): entpacken und die App nach Programme verschieben.
- [SHA256SUMS](https://github.com/tobwil/THENote/releases/download/v0.2.4/SHA256SUMS) enthält die Prüfsummen beider Dateien.

App und DMG sind **Developer-ID-signiert, von Apple notarisiert und mit angehefteten Tickets versehen**. Gatekeeper akzeptiert beide als „Notarized Developer ID“. Beim ersten Start kann macOS die übliche Bestätigung für eine aus dem Internet geladene App anzeigen.

Vor dem Update Notizen speichern und THE Note beenden. Notizdateien werden nicht entfernt. Die Pakete ersetzen keine bereits laufende App automatisch. v0.2.3 bleibt unverändert als älteres Release verfügbar.

## Neu seit v0.2.3

- Tabellen mit Tabellenkalkulationsformeln: deutsche und englische Funktionsnamen, Zellbereiche und ganze Spalten wie `=SUMME(D:D)`, Währungen sowie Fehlercodes mit erklärenden Hinweisen. Das Markdown behält die Formeln; die Ansicht zeigt die Ergebnisse.
- THE Note Dark und eine anfängliche Farbauswahl passend zum System.
- Spielplatz- und Werkzeugkasten-Vorlagen sowie verbesserte Lesbarkeit und Anordnung der Oberfläche.
- Deutsche und englische Website mit interaktiver Vorschau und direktem DMG-Download.
- Notarisierter ZIP-/DMG-Paketbau und Gatekeeper-Prüfung im aktualisierten curl-Installer.

## Prüfung

TypeScript, ESLint, Frontend-Tests, alle **33 Rust-Tests**, Clippy und der Notebook-Browsertest einschließlich Formeltabellen bestanden. Signaturen, angeheftete Tickets und Gatekeeper-Freigabe wurden geprüft. Der curl-Prüflauf und die Website-Tests wurden für dieses Release ausgeführt. Details: [Validierung v0.2.4](https://github.com/tobwil/THENote/blob/v0.2.4/docs/VALIDATION-v0.2.4.md).

Dies bleibt eine Entwicklungsversion. Windows, Linux und Intel-Macs haben weiterhin keine verifizierten Pakete. Codeblöcke laufen mit den Rechten deines Benutzerkontos; KI-Anbieter können API-Gebühren berechnen. Produktive KI-Provider wurden für dieses Release nicht mit kostenpflichtigen Konten getestet.

## Lizenz und Herkunft

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von Srinivas Gowda und Konzepten aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Gesamtwerk: **GPL-3.0-or-later**; der Ledge-Frontmatter-Parser behält **Apache-2.0**. Originaltexte und Herkunftshinweise sind in beiden Paketen enthalten. [NOTICE.md](https://github.com/tobwil/THENote/blob/v0.2.4/NOTICE.md) · [LICENSING.md](https://github.com/tobwil/THENote/blob/v0.2.4/LICENSING.md).
