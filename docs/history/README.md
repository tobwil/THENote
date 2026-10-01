# Entwicklungsarchiv

- [Gesprächsverlauf](CONVERSATION.md): 57 sichtbare Nachrichten mit Zeitstempeln und den beiden ursprünglichen Nutzer-Anhängen.
- [Strukturierter Export](conversation.json): dieselben Nachrichten als JSON.
- [Changelog](../../CHANGELOG.md): aus den tatsächlichen Entwicklungsständen rekonstruierte Versionsgeschichte.
- [Architektur](../REENGINEERING.md) und [Validierung](../VALIDATION.md).

Das Archiv beginnt mit dem Auftrag, Sarala und Ledge zusammenzuführen, und endet beim Exportzeitpunkt 2026-10-01T15:27:19.047477+00:00. Der erste GitHub-Push veröffentlicht den bis dahin lokal entstandenen Stand. Die Versionen davor werden nicht als erfundene Git-Commits nachgestellt.

Nutzer- und Assistententexte sind bis auf neutrale lokale Pfade, normalisierte Frage-Antwort-/Bild-Wrapper und gegebenenfalls erkennbare Zugangsdaten erhalten. System-/Entwickleranweisungen, internes Reasoning, rohe Tool-Logs, automatische Pluginlisten und Rechnerkonfiguration gehören nicht zum veröffentlichten Dialog. Lokale App-Links in historischen Antworten sind historische Verweise; aktuelle Downloads stehen in der Repository-README.

Der Export enthält keine späteren Nachrichten nach seinem Zeitstempel und wird nicht automatisch auf zukünftige Gespräche erweitert. Der Exporter liegt unter [scripts/export-conversation.py](../../scripts/export-conversation.py); vor einer erneuten Veröffentlichung sind Text und Anhänge zu prüfen.
