# THE Note installieren

[Website](https://tobwil.github.io/THENote/) · [Releases](https://github.com/tobwil/THENote/releases)

Das veröffentlichte Paket ist **v0.2.9 für Apple Silicon (arm64), macOS 11 oder neuer**. Die Mindestversion folgt dem gebauten Programm; die tatsächlichen Funktionstests wurden auf dem aktuellen Entwicklungs-Mac durchgeführt. Intel-Macs, Windows und Linux haben noch keine verifizierten Pakete.

Die Preview ist mit **Developer ID signiert und Apple-notarisiert**. App und DMG enthalten angeheftete Notarisierungstickets. Beim ersten Start kann macOS die übliche Bestätigung für eine aus dem Internet geladene App anzeigen. Kein Installationsweg deaktiviert Gatekeeper oder entfernt Quarantäneattribute ausdrücklich.

## DMG herunterladen

[DMG für macOS Apple Silicon herunterladen](https://github.com/tobwil/THENote/releases/download/v0.2.9/THE.Note-macOS-arm64.dmg), öffnen und **THE Note.app** auf **Applications** ziehen. Danach das Image auswerfen und THE Note im Programme-Ordner öffnen. Vor dem Ersetzen einer vorhandenen App offene Notizen speichern und die App beenden.

Das DMG enthält dieselbe Developer-ID-signierte und notarisierte App wie ZIP, Homebrew und curl sowie die Lizenztexte. `SHA256SUMS` enthält die Prüfsummen beider Pakete. Das DMG und `SHA256SUMS` in denselben Ordner laden und dort nur die DMG-Zeile prüfen:

```sh
grep '  THE.Note-macOS-arm64.dmg$' SHA256SUMS | shasum -a 256 -c -
```

## Homebrew

Voraussetzung ist [Homebrew](https://brew.sh). Dieser eigene Tap liegt im THE-Note-Repository; der Cask gehört nicht zum offiziellen Homebrew-Cask-Katalog.

```sh
brew tap tobwil/thenote https://github.com/tobwil/THENote
brew trust --cask tobwil/thenote/the-note
brew install --cask tobwil/thenote/the-note
```

Homebrew 6 verlangt für Casks aus eigenen Taps den expliziten Vertrauensschritt. Er gilt hier nur für diesen Cask. Bei älterem Homebrew ohne `trust` diese Zeile auslassen. Homebrew verwaltet die App standardmäßig unter `/Applications`.

Vor einem Update Notizen speichern und THE Note beenden:

```sh
brew update
brew upgrade --cask tobwil/thenote/the-note
```

Deinstallieren:

```sh
brew uninstall --cask tobwil/thenote/the-note
```

Der Cask enthält keine `zap`-Anweisung zum Löschen von Einstellungen oder Dokumenten. Deine Markdown-Dateien bleiben erhalten.

## curl-Installer

```sh
curl -fsSL https://tobwil.github.io/THENote/install.sh | bash
```

Der Installer lädt ein festgelegtes Release über HTTPS, prüft dessen SHA-256 sowie Signatur, Gatekeeper-Freigabe, Bundle-Kennung und Version und installiert nach `~/Applications/THE Note.app`. Er benötigt kein `sudo`, startet die App nicht automatisch und lehnt die Installation ab, während THE Note läuft.

Zum Lesen des Skripts vor dem Ausführen:

```sh
curl -fL https://tobwil.github.io/THENote/install.sh -o install-the-note.sh
less install-the-note.sh
bash install-the-note.sh --check
bash install-the-note.sh
```

`--check` lädt und prüft das Paket, ohne eine App zu installieren oder zu ersetzen. Temporäre Prüfdaten werden danach entfernt. Die Prüfung arbeitet auch, während die vorhandene App läuft.

Eine vorhandene, geschlossene App ausdrücklich ersetzen:

```sh
curl -fsSL https://tobwil.github.io/THENote/install.sh | bash -s -- --replace
```

Die vorherige App bleibt als versteckte `.THE Note-backup-….app` im gleichen Ordner erhalten; den genauen Pfad zeigt der Installer an. Im Finder zeigt **⌘⇧.** versteckte Dateien. Diese Sicherung betrifft das App-Bundle, nicht deine Notizen. Aufbewahrte App-Sicherungen kannst du nach erfolgreichem Start selbst entfernen.

Weiterer Installationsordner oder bereits heruntergeladenes ZIP:

```sh
bash install-the-note.sh --app-dir /absoluter/pfad/Applications
bash install-the-note.sh --check --archive /absoluter/pfad/THE.Note-macOS-arm64.zip
```

Der lokale Download muss exakt zum im Installer festgelegten Release passen. Unbekannte/abweichende Pakete werden abgewiesen. `--app-dir` braucht einen absoluten Pfad mit eigenen Schreibrechten. Auf Apple Silicon mit Rosetta-Terminal ein natives Terminal verwenden.

Deinstallieren: App schließen und `~/Applications/THE Note.app` im Finder in den Papierkorb verschieben. Notizen und Einstellungen werden dabei nicht gelöscht.

## ZIP und manuelle Prüfung

Das [Release](https://github.com/tobwil/THENote/releases/tag/v0.2.9) enthält ZIP, DMG und `SHA256SUMS`. Nach dem Download des ZIPs und von `SHA256SUMS` in denselben Ordner nur die ZIP-Zeile prüfen:

```sh
grep '  THE.Note-macOS-arm64.zip$' SHA256SUMS | shasum -a 256 -c -
```

ZIP entpacken, `THE Note.app` nach Programme verschieben und öffnen. Lizenz- und Herkunftstexte liegen ebenfalls im ZIP. Vor dem Ersetzen einer vorhandenen App offene Notizen speichern und die App beenden.

## Zwischen Installationswegen wechseln

Pro Mac am besten einen Installationsweg verwenden. Homebrew nutzt normalerweise `/Applications`, der curl-Installer `~/Applications`; sonst können zwei App-Versionen nebeneinander liegen. Beim Wechsel Notizen speichern, die App schließen, die bisherige App über ihren Installationsweg entfernen und anschließend neu installieren. Persönliche Notizordner dabei behalten.

## Für Maintainer: neues Release und Website

1. App-Versionen aktualisieren, relevante App-Tests ausführen und mit `npm run package:macos -- --preview` ZIP und DMG bauen; für Apple-notarisierte Pakete [SIGNING.md](SIGNING.md) beachten. Signatur und Lizenzbeilagen prüfen.
2. ZIP, DMG und `SHA256SUMS` zum neuen GitHub-Release hochladen. Den tatsächlichen Assetnamen prüfen: GitHub ersetzt Leerzeichen beim Upload. Releases nicht nachträglich mit anderen Bytes unter derselben Version überschreiben.
3. In `distribution.json` Version, ZIP-Assetnamen und SHA-256 sowie `dmg.asset` und `dmg.sha256` aktualisieren. `node scripts/sync-distribution.mjs` schreibt die Daten in `install.sh` und `Casks/the-note.rb`.
4. `bash install.sh --check` gegen das veröffentlichte Paket ausführen. `npm run test:site` prüft die Website unter ihrem GitHub-Pages-Unterpfad. Versionsgebundene Links in README und dieser Anleitung aktualisieren.
5. Änderungen nach `main` pushen. `.github/workflows/pages.yml` baut die Website ohne App-Build und veröffentlicht `dist-site/` über GitHub Pages. Homebrew erhält die neue Definition beim nächsten `brew update`.

`site/` enthält die statische Website, `npm run build:site` erzeugt `dist-site/`. Build-Ausgaben werden nicht eingecheckt. GitHub Pages muss im Repository auf **GitHub Actions** als Quelle eingestellt sein. Die Website verwendet weder Analytics noch externe Schriftarten; Downloads kommen aus GitHub Releases. Die App besitzt weiterhin keinen automatischen Update-Dienst.
