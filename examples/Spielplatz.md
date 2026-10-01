# Der Spielplatz

Hier darfst du einfach drücken. Jeder Block läuft lokal, verändert nichts und zeigt, was in einer Notiz möglich ist: **Live-Ausgabe**, **Stop**, **drei Sprachen**. Ändere Zahlen und Texte und starte noch einmal.

## 🚀 Countdown

Die Ausgabe erscheint live, Zeile für Zeile.

```sh
for i in 3 2 1; do
  echo "        $i …"
  sleep 1
done
cat <<'RAKETE'
          /\
         /  \
        | TN |
        |    |
       /| ✦  |\
      /_|____|_\
         ||||
        ( ** )
       (  **  )
RAKETE
echo "  Abgehoben. Gedanke erfolgreich gestartet."
```

## 🎲 Das Würfelorakel

Stell eine Frage. Das Orakel würfelt. Für Entscheidungen, die du ohnehin treffen wolltest.

```python
import random, time

frage = "Soll ich heute etwas Neues ausprobieren?"   # ← deine Frage
antworten = ["Ganz klar: ja.", "Frag nach dem Kaffee noch einmal.",
             "Ja, aber fang klein an.", "Ja, und schreib es vorher auf.",
             "Heute nicht. Morgen bestimmt.", "Unbedingt, und zwar jetzt."]
punkte = {1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
          5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]}

def wuerfel(augen):
    feld = ["●" if i in punkte[augen] else " " for i in range(9)]
    return ["│ " + "  ".join(feld[r * 3:r * 3 + 3]) + " │" for r in range(3)]

print(f"„{frage}“\n\nDas Orakel würfelt", end="", flush=True)
for _ in range(3):
    time.sleep(0.5)
    print(" .", end="", flush=True)

a, b = random.randint(1, 6), random.randint(1, 6)
print("\n\n" + "┌─────────┐ " * 2)
for links, rechts in zip(wuerfel(a), wuerfel(b)):
    print(links, rechts)
print("└─────────┘ " * 2)
print(f"\n{a} + {b} = {a + b} · {antworten[(a + b) % len(antworten)]}")
```

## ✦ Ein Muster entsteht

Ein Sierpinski-Dreieck, gezeichnet mit einer einzigen Bit-Operation: `x & y`.

```js
const groesse = 16;   // probiere 8 oder 32
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  for (let y = groesse - 1; y >= 0; y--) {
    let zeile = ' '.repeat(y);
    for (let x = 0; x + y < groesse; x++) zeile += (x & y) ? '  ' : '✦ ';
    console.log(zeile);
    await pause(70);
  }
})();
```

## 🌀 Mandelbrot in Zeichen

Mathematik als ASCII-Kunst. Ändere `breite`, `zoom` oder `mitte` und schau, was passiert.

```js
const breite = 64, hoehe = 24, zoom = 1;   // probiere breite = 100
const mitte = [-0.6, 0], zeichen = ' .:-=+*#%@';

for (let y = 0; y < hoehe; y++) {
  let zeile = '';
  for (let x = 0; x < breite; x++) {
    const cr = mitte[0] + (x / breite - 0.5) * 3 / zoom;
    const ci = mitte[1] + (y / hoehe - 0.5) * 2.2 / zoom;
    let zr = 0, zi = 0, i = 0;
    while (zr * zr + zi * zi < 4 && i < 60) {
      [zr, zi] = [zr * zr - zi * zi + cr, 2 * zr * zi + ci];
      i++;
    }
    zeile += zeichen[Math.min(9, Math.floor(i / 6))];
  }
  console.log(zeile);
}
```

## 🐟 Das Aquarium

Läuft eine ganze Minute. Probiere **■ Stoppen**, wann immer du genug gesehen hast.

```python
import random, time

breite = 46
fische = ["><(((º>", "><>", "<º)))><", "<><", "><(º>"]
print("~" * breite)
for runde in range(150):
    wasser = [" "] * breite
    for _ in range(random.randint(0, 2)):
        wasser[random.randrange(breite)] = random.choice(["°", "o", "·"])
    if random.random() < 0.45:
        fisch = random.choice(fische)
        start = random.randrange(breite - len(fisch))
        wasser[start:start + len(fisch)] = list(fisch)
    print("".join(wasser).rstrip() or " ")
    time.sleep(0.4)
print("~" * breite)
print("Das Aquarium schläft jetzt. 💤")
```

## Und jetzt du

- [ ] Eine Zahl ändern und neu starten
- [ ] Das Aquarium mit **■ Stoppen** anhalten
- [ ] Einen eigenen Block mit ` ```python ` beginnen
