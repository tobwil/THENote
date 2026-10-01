# THE Note v0.2.5 · Diagramme vergrößern

Diese Preview enthält den aktuellen Stand von `main` einschließlich PR #8.

## Neu

- Mermaid- und D2-Diagramme in einer fensterfüllenden Ansicht öffnen: über **⤢ Vergrößern** am Diagramm oder **Diagramm vergrößern** in der Befehlspalette.
- Zoomen per Pinch, ⌘/Strg + Scrollen, Doppelklick oder +/−; verschieben per Ziehen, Scrollen oder Pfeiltasten. `0` passt das Diagramm ein, `1` zeigt Originalgröße, `Esc` schließt die Ansicht.
- Mehrzeilige Mermaid-Beschriftungen werden nicht mehr durch die Absatz-Zeilenhöhe der Notiz abgeschnitten.

## Download

Für **macOS 11+ auf Apple Silicon**:

- [DMG herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.5/THE.Note-macOS-arm64.dmg): öffnen, **THE Note.app** auf **Applications** ziehen, Image auswerfen und die App im Programme-Ordner öffnen.
- [ZIP herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.5/THE.Note-macOS-arm64.zip).
- [SHA256SUMS](https://github.com/tobwil/THENote/releases/download/v0.2.5/SHA256SUMS) enthält die Prüfsummen beider Pakete.

App und DMG sind mit **Developer ID signiert und Apple-notarisiert**, mit angehefteten Tickets. Vor Updates Notizen speichern und THE Note beenden. Notizdateien werden nicht entfernt. Ältere Releases bleiben unverändert verfügbar.

## Prüfung und Grenzen

TypeScript, ESLint, Frontend-Tests, alle **33 Rust-Tests**, Clippy und Notebook-Browsertests einschließlich Diagrammviewer bestanden. Signaturen, Notarisierungstickets, Gatekeeper, Pakete, Installer und Website wurden geprüft. Einzelheiten: [Validierung v0.2.5](https://github.com/tobwil/THENote/blob/v0.2.5/docs/VALIDATION-v0.2.5.md).

Dies bleibt eine Entwicklungsversion mit derzeit deutscher App-Oberfläche. Windows, Linux und Intel-Macs haben keine verifizierten Pakete. Codeblöcke laufen mit den Rechten deines Benutzerkontos. Produktive KI-Anbieter wurden nicht mit kostenpflichtigen Konten getestet.

## Herkunft

THE Note baut auf **[Sarala](https://github.com/solancer/sarala)** von Srinivas Gowda und Konzepten sowie dem Frontmatter-Parser aus **[Ledge](https://github.com/ledgesh/ledge)** auf. Gesamtwerk: **GPL-3.0-or-later**; der Ledge-Parser behält **Apache-2.0**. Lizenztexte und Herkunftshinweise liegen beiden Paketen bei. [NOTICE.md](https://github.com/tobwil/THENote/blob/v0.2.5/NOTICE.md) · [LICENSING.md](https://github.com/tobwil/THENote/blob/v0.2.5/LICENSING.md).
