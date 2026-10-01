---
cwd: .
---

# Der Werkzeugkasten

Kleine Helfer für jeden Tag. Jeder Block **liest nur** und verändert nichts. Klicke auf **▶ Ausführen** oder setze den Cursor in einen Block und drücke **⌘↵**. Passe die Werte oben im Code an, dann gehört das Werkzeug dir.

> `cwd: .` im Frontmatter bedeutet: Gearbeitet wird im geöffneten Workspace, sonst im Ordner dieser Notiz, sonst in deinem Home-Verzeichnis.

## 01 · Was ist auf diesem Rechner installiert?

Welche Laufzeiten stehen für deine Codeblöcke bereit?

```sh
for tool in python3 node git brew pandoc; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf '  ✓ %-8s %s\n' "$tool" "$("$tool" --version 2>&1 | head -n 1)"
  else
    printf '  · %-8s nicht gefunden\n' "$tool"
  fi
done
echo
printf 'Arbeitsordner: %s\n' "$PWD"
df -h . | tail -n 1 | awk '{ print "Freier Speicher: " $4 " von " $2 }'
```

## 02 · Worum geht es in diesem Ordner?

Zählt Dateien nach Typ und zeigt die größten. Versteckte Ordner und `node_modules` werden übersprungen.

```python
import os
from collections import Counter

TIEFE = 3          # wie viele Ebenen nach unten
GRENZE = 20000     # höchstens so viele Dateien ansehen

start = os.getcwd()
typen, groessen, gesamt = Counter(), [], 0
for ordner, unterordner, dateien in os.walk(start):
    if ordner[len(start):].count(os.sep) >= TIEFE:
        unterordner[:] = []
    unterordner[:] = [d for d in unterordner if not d.startswith('.') and d != 'node_modules']
    for name in dateien:
        if name.startswith('.') or gesamt >= GRENZE:
            continue
        pfad = os.path.join(ordner, name)
        try:
            groesse = os.path.getsize(pfad)
        except OSError:
            continue
        gesamt += 1
        typen[os.path.splitext(name)[1].lower() or '(ohne)'] += 1
        groessen.append((groesse, os.path.relpath(pfad, start)))

def lesbar(b):
    for einheit in ['B', 'KB', 'MB', 'GB']:
        if b < 1024:
            return f'{b:.0f} {einheit}'
        b /= 1024
    return f'{b:.1f} TB'

print(f'{gesamt} Dateien in {start}\n')
for endung, anzahl in typen.most_common(6):
    print(f'  {endung:<8} {"▇" * max(1, round(anzahl / max(typen.values()) * 24))} {anzahl}')
print('\nDie größten:')
for groesse, pfad in sorted(groessen, reverse=True)[:5]:
    print(f'  {lesbar(groesse):>8}  {pfad}')
```

## 03 · Git auf einen Blick

```sh
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'Branch:     %s\n' "$(git branch --show-current)"
  printf 'Geändert:   %s Dateien\n' "$(git status --porcelain | wc -l | tr -d ' ')"
  echo
  echo 'Letzte Commits:'
  git log --oneline -n 5 --date=short --format='  %ad  %s'
else
  echo 'Kein Git-Repository. Öffne einen Projektordner als Workspace.'
fi
```

## 04 · Kalender im Kopf

```python
from datetime import date, timedelta

heute = date.today()
ziel = date(heute.year, 12, 24)    # ← dein eigenes Datum
if ziel < heute:
    ziel = ziel.replace(year=heute.year + 1)

tage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
print(f'Heute ist {tage[heute.weekday()]}, der {heute:%d.%m.%Y}')
print(f'Kalenderwoche {heute.isocalendar()[1]} · Tag {heute.timetuple().tm_yday} des Jahres')
print(f'Noch {(ziel - heute).days} Tage bis {ziel:%d.%m.%Y}')
spaeter = heute + timedelta(days=30)
print(f'In 30 Tagen ist {tage[spaeter.weekday()]}, {spaeter:%d.%m.%Y}')
```

## 05 · Ausgaben schnell auswerten

Ersetze die Zeilen durch deine eigenen Daten, zum Beispiel aus einer Tabelle kopiert.

```python
import csv, io
from collections import defaultdict

DATEN = """kategorie,betrag
Miete,950
Lebensmittel,312.40
Mobilität,89
Lebensmittel,58.20
Freizeit,120
Abos,34.97
Freizeit,45.50
"""

summen = defaultdict(float)
for zeile in csv.DictReader(io.StringIO(DATEN)):
    summen[zeile['kategorie']] += float(zeile['betrag'])

gesamt = sum(summen.values())
for kategorie, betrag in sorted(summen.items(), key=lambda x: -x[1]):
    balken = '█' * round(betrag / gesamt * 30)
    print(f'{kategorie:<13} {betrag:>9.2f} €  {balken} {betrag / gesamt:.0%}')
print(f'{"Gesamt":<13} {gesamt:>9.2f} €')
```

## 06 · JSON prüfen und formatieren

```js
const eingabe = `{"name":"THE Note","lokal":true,"sprachen":["sh","python","js"],"version":"0.2"}`;

try {
  const daten = JSON.parse(eingabe);
  console.log(JSON.stringify(daten, null, 2));
  console.log(`\n✓ Gültig · ${Object.keys(daten).length} Schlüssel auf oberster Ebene`);
} catch (fehler) {
  console.log(`✗ Kein gültiges JSON: ${fehler.message}`);
}
```

## 07 · Passphrase und ID erzeugen

Kryptografisch zufällig, lokal erzeugt und nirgends gespeichert.

```python
import secrets, string, uuid

woerter = ['ahorn', 'birke', 'kompass', 'laterne', 'nebel', 'ozean', 'pinsel', 'quelle',
           'regen', 'segel', 'tinte', 'ufer', 'vogel', 'wolke', 'zeder', 'funke', 'garten',
           'hafen', 'insel', 'kiesel', 'lupe', 'mond', 'notiz', 'polar', 'rabe', 'stern']
passphrase = '-'.join(secrets.SystemRandom().sample(woerter, 4)) + f'-{secrets.randbelow(100):02d}'
zeichen = string.ascii_letters + string.digits + '!#$%&*+-?@'

print('Passphrase: ', passphrase)
print('Passwort:   ', ''.join(secrets.choice(zeichen) for _ in range(20)))
print('UUID:       ', uuid.uuid4())
```

## Weiter geht's

- [ ] Ein Werkzeug an deine Daten anpassen
- [ ] Die Notiz in deinem Workspace speichern
- [ ] Ein eigenes Werkzeug ergänzen
