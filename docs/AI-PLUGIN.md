# Inline-KI · THE Note 0.2.0

Mit **/ai** entsteht ein KI-Prompt direkt an der aktuellen Stelle im Dokument. Das Plugin ist optional und standardmäßig ausgeschaltet. Es benötigt keinen THE-Note-Account.

## Anbieter und Modell verbinden

1. **⚙ KI** in der Werkzeugleiste öffnen, alternativ Einstellungen → Plugins.
2. **OpenAI**, **Claude**, **Gemini**, **Intern** oder **Lokal** wählen. Die öffentlichen Anbieter erhalten automatisch ihre API-Adresse und das passende Protokoll.
3. Den API-Key des Anbieters in das Passwortfeld eintragen. Interne und lokale Dienste können auch ohne Key arbeiten.
4. **Modelle laden** ruft das Modellverzeichnis des gewählten Dienstes auf. Ein verfügbares Textmodell auswählen; seine tatsächliche Modell-ID wird übernommen. Für Gateways ohne Modellverzeichnis lässt sich die ID manuell eintragen. Es werden keine Modellnamen als statische Vorschlagsliste erfunden.
5. **KI-Assistent aktivieren** einschalten und speichern. Optional **Im macOS-Schlüsselbund behalten** wählen; sonst bleibt der Key nur bis zum Beenden der App erhalten.

Die Anbindung verwendet die APIs der Anbieter und deren API-Berechtigungen. Die Modellliste ist keine Zusicherung für Kontingent, erfolgreiche Inferenz oder die Verfügbarkeit jedes Modells in jeder Region. Es gibt in dieser Version keinen OAuth-Login mit einem Chat-Abonnement. Ein Anbieter ist jeweils für die App aktiv; beim Wechsel wird der bisherige Key nicht an den neuen Endpoint übernommen.

| Auswahl | Protokoll / Standard-Endpoint | Authentifizierung |
| --- | --- | --- |
| OpenAI | Responses · `https://api.openai.com/v1/responses` | Bearer-Key |
| Claude | Messages · `https://api.anthropic.com/v1/messages` | `x-api-key`, Anthropic-Version |
| Gemini | Generate Content · `https://generativelanguage.googleapis.com/v1beta/models` | `x-goog-api-key` |
| Intern | vollständiger Endpoint, z. B. `https://ki.firma.de/v1/chat/completions` | Optional; abhängig vom gewählten Protokoll |
| Lokal | `http://127.0.0.1:11434/v1/chat/completions` | Optionaler Bearer-Key |

Für Gemini trägt man die Basisadresse bis `/models` ein; die App ergänzt die ausgewählte Modell-ID und `:streamGenerateContent?alt=sse`. Für die anderen Protokolle gilt die vollständige POST-Adresse. Interne Gateways können Chat Completions, Responses, Anthropic Messages oder Gemini Generate Content verwenden. HTTPS ist erforderlich; HTTP ist nur für Loopback/localhost zugelassen. HTTP-Weiterleitungen werden nicht verfolgt. Es gibt keine Option, die Zertifikatsprüfung abzuschalten.

Die Modelllisten kommen aus den jeweiligen Models-APIs. Claude/Gemini-Seiten werden bei Bedarf nachgeladen. Bei Gemini werden die gemeldeten `generateContent`-Fähigkeiten berücksichtigt; bekannte Audio-, Bild- und Embedding-Modelle werden aus der Textauswahl ausgeblendet. Bei OpenAI dient die Modell-ID zur Filterung, weil das Modellverzeichnis keine vollständige Kompatibilitätsprüfung ersetzt. Spezialmodelle können zusätzliche API-Parameter benötigen; die manuelle Modell-ID bleibt verfügbar.

## Direkt im Dokument arbeiten

1. Auf einer neuen Zeile **/ai** eingeben und den Eintrag **AI · Inline schreiben** wählen bzw. Enter drücken. Alternativ **✦ /ai** in der Werkzeugleiste anklicken.
2. Den Prompt in den entstandenen Block schreiben.
3. Optional **Notiz als Kontext** auswählen. Über **Mitgesendete Notiz ansehen** lässt sich der Snapshot vorher prüfen.
4. **Generieren** oder **⌘/Ctrl+Enter** startet die Anfrage. Die Antwort erscheint fortlaufend unter dem Prompt.
5. **Übernehmen** ersetzt den KI-Block an dieser Stelle durch normalen Markdown-Text. Dieser Schritt ist mit einem Dokument-Undo rückgängig zu machen. **Entwurf verwerfen** verwirft nur die Antwort, das × entfernt den gesamten Prompt-Block.

**Stoppen** bricht die lokale HTTP-Anfrage ab. Bereits beim Dienst entstandene Nutzung kann trotzdem berechnet werden. Unvollständige/abgebrochene Antworten werden gekennzeichnet. Wird der Prompt nachträglich geändert, ist die Übernahme eines alten Entwurfs gesperrt, bis ein neuer Entwurf erzeugt wurde.

Jede Generierung ist eine neue, unabhängige Anfrage. Es wird kein versteckter Chatverlauf mitgesendet. Ohne Kontext-Option enthält sie nur deinen Prompt und die Assistentenanweisung. Mit Kontext-Option wird das vollständige aktuelle Markdown einschließlich Frontmatter und anderer Prompt-Blöcke beigefügt. Andere Dateien, Ordner und temporäre Ausführungsausgaben werden nicht eingesammelt. Der Dienst kann Inhalte protokollieren; dafür gelten seine Regeln.

Prompts bleiben als normale Markdown-Fences erhalten:

````markdown
```ai
Erkläre diesen Gedanken an einem konkreten Beispiel.
```
````

Beim Öffnen einer solchen Datei wird nichts automatisch ausgeführt. Entwürfe sind sitzungsgebunden und bleiben beim Tabwechsel sichtbar; erst beim Übernehmen werden sie Dokumentinhalt. Die Vorschau zeigt während und nach der Generierung den reinen Markdown-Quelltext. Mermaid/D2, HTML und Medien werden im Entwurf nicht gerendert; Diagramme erscheinen erst nach **Übernehmen** im Dokument. Übernommener Text ist anschließend normaler Dokumentinhalt mit den üblichen Editor-Funktionen. Der Assistent besitzt keine Datei-, Prozess- oder MCP-Werkzeuge und führt keinen Code aus.

## Schlüssel und Grenzen

- Anfragen laufen direkt aus dem nativen Rust-Backend zum ausgewählten Dienst.
- `ai-plugin.json` enthält ausschließlich Verbindungseinstellungen, keinen Key. Ein gespeicherter Key liegt im macOS-Schlüsselbund, gebunden an den Endpoint. Er wird nicht an die Oberfläche zurückgegeben.
- **Key entfernen → Einstellungen speichern** löscht den hinterlegten Key. Ausschalten stoppt offene Anfragen und erhält die Konfiguration für eine spätere Aktivierung.
- Änderungen der Verbindung brechen laufende Generierungen ab. Das Backend prüft zusätzlich die beim Start erwartete Verbindung, auch bei mehreren App-Fenstern.
- Maximal 256 KiB Prompt/Dokumentkontext, vier gleichzeitige Generierungen, 120 Sekunden Gesamtzeitlimit und 200.000 Bytes sichtbarer Antworttext. Antwortlimit standardmäßig 4.096 Tokens, konfigurierbar von 256 bis 32.768; Modelle können engere Grenzen haben.
- Die Browser-Vorschau zeigt die Inline-Oberfläche; API-Aufrufe und Schlüsselablage funktionieren in der Desktop-App.
- Nicht enthalten: OAuth-Login, frei definierte Header oder Azure-Query-Parameter, Bild-/Audio-Eingaben, Tool-Aufrufe, nicht streamende Gateways und mehrere gleichzeitig gespeicherte Anbieterprofile.

Bei 401/403 API-Key und Berechtigungen prüfen, bei 429 Kontingent/Rate-Limit, bei fehlender Modellliste die ID manuell eintragen. Ein Stream ohne Abschluss wird als fehlerhaft markiert. Rohe Anbieterfehler werden nicht in die Oberfläche übernommen, damit darin enthaltene Zugangsdaten nicht versehentlich angezeigt werden.

Implementierungsgrundlagen: [OpenAI Responses Streaming](https://developers.openai.com/api/docs/guides/streaming-responses), [Claude Streaming](https://platform.claude.com/docs/en/build-with-claude/streaming), [Claude Models](https://platform.claude.com/docs/en/api/models/list), [Gemini Generate Content](https://ai.google.dev/api/generate-content), [Gemini Models](https://ai.google.dev/api/models). Responses-Anfragen setzen `store: false`; dies ist keine Zusicherung zur gesamten Datenhaltung eines beliebigen Dienstes.
