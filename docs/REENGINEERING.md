# Sarala + Ledge → THE Note

## Ergebnis und Abgrenzung

Ein nativer lokaler Markdown-Editor mit ausführbaren Zellen. Version 0.1 verbindet einen funktionierenden Editor mit einer neu gebauten Ausführungsschicht. Es ist keine vollständige Portierung aller Ledge-Funktionen und kein bloßes UI-Mockup.

## Befunde im Originalcode

| Bereich | Sarala | Ledge | Entscheidung |
| --- | --- | --- | --- |
| Editor | SolidJS, blockweises `contenteditable`, Quelltext-Roundtrip (`Block.tsx`, `livesource.ts`, `markdown.ts`) | React/CodeMirror, ausführbare Fences | Saralas kompletten Editor erhalten; Codeaktionen außerhalb der editierbaren Fläche ergänzen |
| Desktop | Tauri/Rust, native Dateidialoge, atomare Saves, File-Watcher | Electrobun/Bun, lokaler Server und RPC | Eine Laufzeit: Tauri. Keine zweite Webview-/IPC-Schicht |
| Ausführung | Kein Notebook-Runner | `runner.ts`, `inlinePool.ts`: persistente Shells und Interpreter | Separater Rust-Prozess pro Ausführung; definierten Kontext explizit setzen |
| Notizkontext | YAML-Metadaten für Darstellung/Export | Gemeinsamer Parser für cwd, env, host, confirm, Profile | Ledges originalen Parser übernehmen, unterstützten lokalen Funktionsumfang strikt prüfen |
| Ausgaben | Rendering für Diagramme/Code | Gestreamte Ausgabe mit Run-Zuordnung | Tauri-Events mit eigener Run-ID, flüchtiger Verlauf ohne Veränderung der Datei |
| Updates | Signierter Upstream-Updatekanal | Eigener Release-/Serverzyklus | Fremde Updatekonfiguration entfernen, eigene App-ID und lokale Builds |

Referenzstände und Lizenzen sind in [NOTICE.md](../NOTICE.md) festgehalten. Die ursprünglichen Repositories wurden lokal gelesen, einschließlich Editor, Store, Desktop-Entry-Points, Runner, Spawn-Kontext und Frontmatter-Verträgen.

## Neuer Datenfluss

1. `src/components/RunBlock.tsx` ergänzt vollständige bekannte Code-Fences um Start/Stop und Ausgabe.
2. `src/execution/model.ts` prüft Fence-Abschluss und Interpreter-Allowlist. Mermaid, D2 und unbekannte Sprachen werden nicht versehentlich als Shell ausgeführt.
3. `src/execution.ts` erfasst Notiz, Tab, Quelle und Kontext zum Startzeitpunkt. Es installiert den Event-Listener vor dem Start und vermeidet doppelte Starts derselben Zelle. Optionale Bestätigung erfolgt vor der Ausführung.
4. `src/execution/ledge-frontmatter.ts` liest den Notizkontext. Remote-/Profilanforderungen werden bei fehlender Implementierung ausdrücklich abgelehnt.
5. `src-tauri/src/execution.rs` validiert erneut Sprache, Größe, Verzeichnis, Run-ID und Umgebungsvariablen. Code wird als einzelnes Argument an den festgelegten Interpreter übergeben; kein zusätzlicher zusammengesetzter Shell-Wrapper für Python/Node.
6. stdout/stderr werden getrennt gelesen und als Text an das zugehörige Fenster gestreamt. Die Ansicht führt sie in Empfangsreihenfolge zusammen; eine globale Reihenfolge zwischen beiden OS-Pipes wird nicht garantiert.
7. Der Prozess beendet sich, wird gestoppt oder überschreitet das Zeitlimit. Unter Unix wird auch die Prozessgruppe beendet. Ein Fensterabschluss setzt die Abbruchsignale seiner Läufe. Terminalstatus, Exit-Code und Laufzeit werden erst nach dem Lesen der Ausgaben gemeldet.
8. Das Markdown bleibt unverändert. Der Verlauf begrenzt ältere abgeschlossene Läufe und erhält aktive Prozesse.

## Wichtige bewusste Abweichungen

**Kein persistenter Shell-Pool.** Ledges Pool bindet PTY, Shell-Hooks, Marker und Serververbindung eng zusammen. Eine teilweise Übernahme hätte falsche Erwartungen an Umgebungszustand und Prozesssteuerung geschaffen. Diese Version startet nachvollziehbar einen frischen Prozess je Zelle. Persistente Sessions brauchen ein eigenes Session-Protokoll und Tests für Signalweiterleitung, interaktive Eingaben und Wiederverbindung.

**Local first.** Die native App hat Zugriff auf lokale Dateien und Prozesse. Die Browser-Vorschau führt nichts aus und zeigt diese Grenze explizit. Es gibt keinen unauthentifizierten HTTP-Endpunkt zur Codeausführung.

**Markdown ist das Speicherformat.** Dateien, Blocktexte und Export bleiben bei Saralas bewährtem Modell. Ausgaben sind nicht heimlich Teil der Notiz. Vorlagen sind normale Markdown-Inhalte.

**Bestätigungen sind Dokumentregeln.** `confirm: true` und Fence-Attribute steuern die Rückfrage vor einem Lauf. Ein Klick auf Ausführen ohne diese Optionen ist der bewusste lokale Start. Der Runner bietet keine Sandbox gegen absichtlich schädlichen Code.

## Nächste sinnvolle Ausbaustufen

1. Persistente lokale Sessions mit echtem PTY, Eingabe, Session-Reset und zuverlässigem Prozessgruppen-Lifecycle.
2. Workspace-Vertrauen und konfigurierbare Interpreter, bevor SSH und zusätzliche Runner dazukommen.
3. SSH-Ausführung mit sichtbarem Zielhost und unverändertem Run-/Output-Vertrag.
4. MCP/CLI für Dateioperationen und Suchzugriff; Ausführung weiterhin explizit kontrollieren.
5. Signierte/notarisierte Releases und eigene Update-Infrastruktur; danach weitere Plattformen.

## Prüfumfang

Die Frontend-Tests decken den bestehenden Markdown-/Editor-Kern und die neuen Ausführungsverträge ab. Native Tests starten echte Shellprozesse für Umgebungswerte, stdout/stderr, Exit-Codes, Abbruch, Timeout und Ausgabelimit. Der neue UI-Test prüft Vorlagen, Bearbeitung, Tabs, Fehleranzeige im Browser, unverändertes Markdown trotz Ausgabe, Themewechsel, Markdown-Download und Mermaid. Das macOS-Paket wird zusätzlich manuell geöffnet und mit echten Codezellen geprüft. Windows/Linux-Packaging, Remote-Funktionen und alle optionalen Pandoc-/PDF-Exporte gehören nicht zum verifizierten Umfang dieses Builds.

## Optionales Inline-KI-Plugin (0.2.0)

`src/ai/inline.ts` bildet Prompts als portable Markdown-Fences ab; `/ai` und die Werkzeugleiste fügen sie über die vorhandene Block-Command-Schicht ein. `InlineAi` zeigt Prompt und Entwurf direkt im Editor. `src/ai.ts` hält sitzungsgebundene Ergebnisse pro Block, empfängt `note-ai`-Ereignisse und startet jede Generierung unabhängig ohne impliziten Chatverlauf. `replaceBlockMarkdown` übernimmt ein Ergebnis am Ursprungsort in einem Undo-Schritt; Änderungen des Prompts sperren die Übernahme alter Ergebnisse.

`src-tauri/src/ai.rs` besitzt Verbindung und Secrets. Der Key bleibt im Backend-Speicher oder macOS-Schlüsselbund; JSON-Einstellungen und IPC-Status enthalten ihn nicht. `ai/providers.rs` kapselt OpenAI-kompatible Modellverzeichnisse, Anthropic- und Gemini-Payloads, Authentifizierung und Streaming-Ereignisse. Die Modelle werden live vom Anbieter geladen, nicht fest einprogrammiert. Das Backend prüft Endpoint und Verbindung, begrenzt Requests und dekodiert SSE über Byte-Grenzen hinweg. Konfigurationsänderungen brechen offene Anfragen ab; das Registrieren der Anfrage und der Verbindungs-Snapshot erfolgen unter demselben Lock.

Die KI hat keine Runner-, Datei- oder MCP-Werkzeuge. Einrichtung, Datenfluss und Grenzen: [AI-PLUGIN.md](AI-PLUGIN.md).
