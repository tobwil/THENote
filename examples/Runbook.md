---
cwd: .
confirm: true
env:
  PROJECT: THE-Note
---

# Ein ausführbares Arbeitsbuch

Dokumentation und Experimente an einem Ort. Jede Zelle läuft als eigener lokaler Prozess.

## Kontext prüfen

```sh
printf 'Projekt: %s\n' "$PROJECT"
pwd
```

## Daten verstehen

```python
werte = [12, 18, 24, 30]
print(f'Mittelwert: {sum(werte) / len(werte):.1f}')
```

## JavaScript ausprobieren

```js
const ideen = ['Schreiben', 'Verstehen', 'Machen'];
ideen.forEach((idee, i) => console.log(`${i + 1}. ${idee}`));
```

## Ergebnis festhalten

- [x] Kontext geprüft
- [x] Ergebnisse dokumentiert
