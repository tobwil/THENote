# macOS: Developer ID und Notarisierung

Ab **v0.2.4** sind App und DMG mit Developer ID signiert und Apple-notarisiert; beide enthalten angeheftete Tickets. Die frühere **v0.2.3** bleibt eine ad-hoc signierte, nicht notarisierte Preview. Ihre ursprünglichen Dateien werden nicht ersetzt.

## Voraussetzungen für ein notarisiertes Release

- Aktive Mitgliedschaft im Apple Developer Program.
- **Developer ID Application**-Zertifikat mit zugehörigem privaten Schlüssel im macOS-Schlüsselbund. **Apple Development** genügt für die Verteilung außerhalb des App Store nicht.
- Zugang zum Apple-Notarisierungsdienst: Apple-ID mit anwendungsspezifischem Passwort und Team-ID oder geeigneter App-Store-Connect-API-Schlüssel.
- Xcode mit `notarytool` und `stapler`; Projektabhängigkeiten für den Tauri-Build.

Das Zertifikat über Xcode → Settings → Accounts → Team → Manage Certificates oder das Apple-Developer-Portal erzeugen/importieren. Verfügbare Identitäten anzeigen:

```sh
security find-identity -v -p codesigning
```

Notarisierungszugang einmalig interaktiv im Schlüsselbund speichern:

```sh
xcrun notarytool store-credentials THE-Note-notary
```

Passwörter und private Schlüssel gehören weder ins Repository noch in Chatnachrichten. Bei einem späteren CI-Build Zertifikat und Zugangsdaten über GitHub Actions Secrets bereitstellen; derzeit wird lokal paketiert.

## Paket bauen

Nach einer neuen Versionsnummer und den relevanten App-Tests:

```sh
export APPLE_SIGNING_IDENTITY='Developer ID Application: Dein Name (TEAMID)'
export THE_NOTE_NOTARY_PROFILE='THE-Note-notary'
export THE_NOTE_RELEASE_DIR='release/notarized'
npm run package:macos -- --notarized
```

Der Build läuft für die Architektur des Build-Macs. Für das bisher veröffentlichte Apple-Silicon-Paket einen nativen arm64-Mac verwenden. Intel-Builds sind weiterhin nicht verifiziert.

Der Paketbau prüft zunächst die Identität und den Notarisierungszugang. Tauri signiert auch eingebetteten Code; anschließend wird das vollständige App-Bundle mit Hardened Runtime und sicherem Zeitstempel versiegelt. Das Skript reicht die App bei Apple ein, wartet auf das Ergebnis, heftet das Ticket an (`staple`) und prüft es mit `stapler` und Gatekeeper. Erst danach entstehen ZIP und DMG. Das DMG wird zusätzlich signiert, notarisiert, gestapelt und geprüft. Beide Formate enthalten dieselbe App und dieselben Lizenzbeilagen.

Prüfsummen entstehen nach dem letzten Stapling-Schritt. Nur bei erfolgreichem Abschluss werden ZIP, DMG und `SHA256SUMS` ins Ausgabe-Verzeichnis verschoben. Vorhandene Pakete werden nicht überschrieben. Ein Fehler bei Signierung oder Notarisierung fällt nicht auf eine Ad-hoc-Signatur zurück.

Für eine ausdrücklich nicht notarisierte Preview:

```sh
THE_NOTE_RELEASE_DIR=release/preview npm run package:macos -- --preview
```

Ohne Argument bleibt `--preview` der Standard.

## Veröffentlichen

Eine bereits veröffentlichte Version nicht mit neu signierten Bytes überschreiben: Eine neue Versionsnummer verwenden, ZIP, DMG und `SHA256SUMS` hochladen und die tatsächlich veröffentlichten Prüfsummen in `distribution.json` übernehmen. Nach erfolgreicher Notarisierung `notarized: true` setzen; daraus generiert `scripts/sync-distribution.mjs` den Installer- und Cask-Hinweis. Dann `node scripts/sync-distribution.mjs` ausführen und den curl-Prüflauf sowie Website-Tests gemäß [INSTALLATION.md](INSTALLATION.md) durchführen.

Erst nach erfolgreicher Notarisierung des veröffentlichten Pakets den Status in beiden READMEs, `docs/INSTALLATION.md`, `site/i18n.mjs` und den Release-Notizen anpassen. Installer und Cask mit `node scripts/sync-distribution.mjs` aus den Release-Metadaten neu generieren. Der Preview-Status und Apple-Notarisierung sind unabhängig: Auch eine Entwicklungsversion kann notarisiert sein. Ein Membership-Abschluss oder erfolgreicher Build allein rechtfertigt noch keinen geänderten Hinweis.

Das ursprüngliche v0.2.3-DMG wurde aus dem geprüften v0.2.3-ZIP mit `ditto -x -k` entpackt und über `bash scripts/create-dmg.sh RELEASE_FOLDER OUTPUT.dmg` erzeugt. Dieses Hilfsskript verändert und signiert die enthaltene App nicht neu. Die separate Datei `SHA256SUMS-DMG` ergänzt die ursprünglichen Release-Assets.

## Referenzen

- [Apple: Signing Mac Software with Developer ID](https://developer.apple.com/developer-id/)
- [Apple: Customizing the notarization workflow](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow)
- [Tauri: macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/)
