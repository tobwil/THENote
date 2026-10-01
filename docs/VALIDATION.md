# Validierung · THE Note 0.2.3

Getestet am 1. Oktober 2026 auf macOS / Apple Silicon.

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript `npm run typecheck` | Erfolgreich |
| ESLint `npm run lint` | Erfolgreich |
| Editor- und Markdown-Tests `npm test` | Erfolgreich; über 12.500 Einzelprüfungen |
| Ausführungsverträge | 13 Prüfungen für Fences, Kontext, Bestätigung und Abweisung nicht unterstützter Ziele |
| Frontmatter-Regression | 2 Prüfungen: YAML wird weder Gliederung noch Überschriftenkontext |
| Rust `cargo test` | 32 Tests erfolgreich: Editor/Encoding, 5 Prozess-Runner-Tests und 17 KI-/Provider-Tests |
| Rust Clippy | Erfolgreich mit `-D warnings` |
| KI-Verträge im Frontend | 14 Tests: Opt-in, Kontext, Limits, Verbindungswechsel und portable AI-Fences |
| KI-HTTP-Tests | Lokale echte HTTP-Verbindungen für Chat Completions, Responses, Claude und Gemini; Modelllisten und Pagination, SSE/Unicode, Anbieter-Header, 401/429/302 und unvollständige Streams |
| KI-UI `npm run test:ai:ui` | Erfolgreich mit simuliertem nativen IPC: Anbieterauswahl, Modelllisten, /ai-Slash-Menü, Inline-Streaming, Kontext, Stop/Verwerfen, Übernehmen/Undo, veränderte Prompts und Tabwechsel |
| Browser `npm run test:notebook` | Erfolgreich: Bearbeitung, Vorlagen, Tabs, Aktivität, Fehlerzustände, Theme, Markdown-Download, Mermaid und Fensterbreite |
| Überschrift aktivieren | Vertikaler Versatz des folgenden Blocks: 0 px bei 1380 × 960 |
| Native Python-Zelle | Erfolg; drei nummerierte Zeilen und Unicode-Ausgabe korrekt |
| Native Shell-Zelle | Erfolg; `PROJECT=THE-Note` und Arbeitsverzeichnis `examples` korrekt |
| Native JavaScript-Zelle | Erfolg; Node liefert drei erwartete Ergebniszeilen |
| Native Frontmatter-Bestätigung | Rückfrage erscheint vor dem expliziten Shell-/JavaScript-Start |
| macOS App-Bundle | Tauri-Release-Build für arm64; vollständige Ad-hoc-Signatur mit `codesign --verify --deep --strict` geprüft |
| Lieferpaket | App aus `release/THE Note.app` gestartet; Python-Zelle erneut erfolgreich |

Der native Lauf verwendet die tatsächlich gebaute Tauri-App und OS-Prozesse. Die Browser-Prüfung verwendet die Editor-Vorschau; ihre bewusste Ablehnung nativer Ausführung wird mitgeprüft. Der Rust-Test prüft Stop/Timeout einschließlich Kindprozessen, stdout/stderr, Exit-Code, Ausgabegrenze und ungültige Laufzeit/Verzeichnisse.

Nicht geprüft: Builds für Windows/Linux/Intel-Macs, Notarisierung, alle optionalen Exportformate und jeder übernommene separate Sarala-E2E-Test. SSH, persistente PTY-Sessions und Mobilfunktionen sind noch nicht implementiert. Der Build meldet die bestehenden großen Diagramm-/Syntax-Chunks; dies verhindert den erfolgreichen Build nicht.

## KI-Testgrenzen

Die Rust-Tests verwenden lokale HTTP-Server, die UI-Tests simulieren die native IPC-Schnittstelle. Es wurden keine produktiven internen Dienste und keine kostenpflichtigen Anbieter mit echten Zugangsdaten angesprochen. Deren tatsächliche Modellverfügbarkeit, Authentifizierung und Gateway-Eigenheiten müssen beim Anschließen geprüft werden.

## Native Inline-KI-Prüfung (0.2.0)

Die aus dem Lieferpaket gestartete Tauri-App wurde zusätzlich gegen einen lokalen HTTP-Testdienst geprüft:

- Modellverzeichnis aus der App geladen und tatsächliche Modell-ID aus dem Dropdown übernommen.
- Synthetischen Test-Key im macOS-Schlüsselbund gespeichert, App beendet und neu gestartet; die nächste Generierung verwendete den gespeicherten Bearer-Key korrekt.
- Gestreamte Unicode-Antwort direkt im Dokument angezeigt. Der Testdienst bestätigte bei deaktivierter Kontext-Option `context: false`, bei explizit aktivierter Option `context: true`.
- Stop beendet die HTTP-Verbindung vor dem Antwortabschluss; die Oberfläche kennzeichnet den Entwurf als gestoppt.
- `ai-plugin.json` enthält nur `enabled`, `endpoint`, `protocol`, `model`, `maxTokens` und `rememberKey`, keinen Test-Key.
- Nach dem Test: Key über den App-Dialog entfernt, Plugin deaktiviert, Endpoint/Modell geleert und die ausschließlich für den Test angelegte Notiz verworfen. Keine produktiven Zugangsdaten verwendet.

Die anfängliche automatisierte AX-Wertzuweisung an das Passwortfeld löste kein reguläres Eingabeereignis aus. Mit normaler Tastatureingabe wurde der Key korrekt verarbeitet. Die Modellabfrage und die Generierung wurden danach anhand des tatsächlich empfangenen Authorization-Headers geprüft.

## Korrekturen in 0.2.1

- Die Schreibfläche ist im normalen Modus links ausgerichtet. Ihr Text beginnt in Live- und Quelltextansicht mit einem stabilen Rand; die maximale Lesebreite bleibt begrenzt. Im Fokusmodus bleibt die Fläche zentriert.
- Das Einfügen eines AI-Blocks erzeugt einen expliziten Fokusauftrag für dessen Block-ID. Der Fokus hängt nicht länger vom vorübergehenden Aktivzustand des ersetzten Markdown-Feldes ab. Abgelöste Markdown-Felder werden nicht mehr fokussiert oder als aktiver Command-Editor registriert.
- UI-Prüfungen: wiederholtes /ai mit Enter, Tab und Menüklick, anschließendes Schreiben ohne erneuten Klick, kein Zurückholen des Fokus aus den Einstellungen; linker Rand bei 1.380 und 2.560 Pixeln in Live und Source. Notebook-Regression, TypeScript, ESLint und die bestehenden Frontend-Tests erfolgreich.
- Der intermittierende native Fehler trat im ursprünglichen Chromium-Lauf nicht auf. Die Korrektur beseitigt die Abhängigkeit vom Aktivzustand; die neue macOS-Version muss für die Nutzung nach dem Speichern offener Notizen neu gestartet werden.
- Das Paket liegt getrennt in `release/v0.2.1/`; die während dieser Arbeit geöffnete ältere App wurde nicht beendet.

## Änderungen vor dem Speichern (0.2.2)

- Neuer Button **± Änderungen**: Markdown-Diff mit Ergänzungen, Löschungen, Zeilennummern und drei Kontextzeilen. Vergleich gegen den zuletzt erfolgreich geladenen/gespeicherten Editorstand; pro Tab und unabhängig vom Undo-Verlauf.
- Neue Notizen vergleichen gegen leeren Text. Wiederhergestellte Entwürfe verwenden den gelesenen Dateistand; bei unlesbarem Original erscheint eine Erklärung statt eines erfundenen Vergleichs.
- Die Anzeige normalisiert Zeilenenden und verwendet die bestehende Block-Normalisierung des Editors. Sie ist kein Byte-/Encoding-Diff. Änderungen außerhalb der App werden nicht stillschweigend zur Vergleichsbasis.
- Neue Diff-Tests: Rekonstruktion beider Versionen, Zeilennummern, getrennte Kontextbereiche, 300 deterministische Zufallsfälle, begrenzte Berechnung großer Änderungen, Tabwechsel, Speichern während weiterer Bearbeitung, Undo und Reload.
- Browser-Test `npm run test:diff:ui`: rote/grüne Zeilen, Fokus und Escape, fehlgeschlagene/erfolgreiche Saves, Undo nach Save, neue und leere Notizen, HTML als Text sowie Darstellung bei 1380 und 600 Pixeln. Native Dateischreibvorgänge simuliert.
- `npm test`, `npm run typecheck` und `npm run lint` erfolgreich. Die ergänzten Recovery-Prüfungen separat erfolgreich (9 Autosave-Prüfungen). Native Rust-Logik unverändert; vorherige Rust-Resultate stammen aus 0.2.0.
- Große Umschreibungen werden bei mehr als zwei Millionen Vergleichszellen als zusammenhängender Austausch dargestellt; die Vorschau ist auf 2.000 Zeilen begrenzt, Zähler umfassen alle Änderungen.
- Separates macOS-arm64-Paket in `release/v0.2.2/` erfolgreich gebaut; Bundle-Version 0.2.2 und vollständige Ad-hoc-Signatur geprüft. Laufende App nicht ersetzt oder beendet.


## Projekte, Tabnamen, Datum und KI-Entwürfe (0.2.3)

- `npm test`, `npm run typecheck`, `npm run lint` und Rust Clippy mit `-D warnings` erfolgreich.
- Neuer nativer Dateisystemtest erfolgreich: Projekt und Notiz anlegen, leere Ordner auflisten, ungültige Namen/Pfadsegmente abweisen, vorhandene Dateien beim Anlegen/Umbenennen erhalten, erfolgreichen Rename und Dateiinhalte prüfen. Die übrigen 32 Rust-Tests wurden für dieses Frontend-/Dateisystem-Update nicht erneut ausgeführt.
- `npm run test:workspace:ui` erfolgreich: Projekt erstellen, verschachtelte Ordner und Notizen, Tab-Doppelklick/Rechtsklick/F2, Text und Undo bei Rename erhalten, Namenskollisionen, ungespeicherte Notiz benennen und mit diesem Namen speichern, `/date` an der Einfügestelle einschließlich Datumsauswahl, separatem Undo-Schritt und Escape.
- `npm run test:ai:ui` erfolgreich: bestehende KI-Abläufe plus Mermaid als roher Markdown-Entwurf ohne Diagramm-DOM, anschließend gerendertes SVG nach Übernehmen.
- Beide Browser-Prüfungen simulieren native IPC; keine echten Anbieteraufrufe. Der Dateisystemtest verwendet echte temporäre Dateien. Datumsauswahl wird im Browser per Datumsfeld geprüft; die Gestaltung des nativen Kalender-Popups hängt vom Betriebssystem ab.
- macOS-arm64-Release 0.2.3 erfolgreich gebaut, Bundle-Version geprüft und komplette Ad-hoc-Signatur durch den Paketierungsprozess verifiziert. Separates Paket unter `release/v0.2.3/`; laufende App nicht ersetzt oder geschlossen.

## Veröffentlichung auf GitHub (0.2.3)

- TypeScript, ESLint und die komplette Frontend-Testsuite erneut erfolgreich.
- Alle 33 nativen Rust-Tests erneut erfolgreich, einschließlich lokaler HTTP-Provider-Tests und des neuen Dateisystemtests.
- Öffentliche Screenshots mit Test-/Demoinhalten geprüft; Inline-KI-Demo ohne externe Anfrage erstellt.
- Repository-Kandidaten auf lokale Benutzerpfade, typische Zugangsdaten und private Schlüssel geprüft; keine Treffer. Sichtbarer Gesprächsverlauf separat exportiert, interne Protokolle ausgeschlossen.
- Sarala-GPL und Ledge-Apache-Lizenz anhand der dokumentierten Upstream-Commits verglichen; Ledge-Parser unverändert bestätigt. Drittanbieter-Inventar mit 530 Abhängigkeiten und Lizenztexten erstellt.
- macOS-ZIP um Lizenztexte und Herkunftshinweise ergänzt; App-Signatur weiterhin gültig, SHA256SUMS erneuert.
