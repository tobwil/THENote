# Lissabon im Mai

Vier Tage, drei Leute, ein Plan. Hier sammle ich Ideen und offene Fragen, bevor wir buchen.

## Ideen

- Frühstück mit *Pastéis de Nata* in Belém
- Sonnenuntergang am Miradouro da Senhora do Monte
- Tagesausflug nach Sintra?

## Offen

- [x] Flüge vergleichen
- [x] Wohnung in der Alfama anfragen
- [ ] Sintra: Zug oder Mietwagen?

## Was kostet uns das?

```python
kosten = {"Flüge": 420, "Wohnung": 540, "Essen & Ausflüge": 360}
personen = 3

for posten, betrag in kosten.items():
    print(f"{posten:<17} {betrag:>4} €  {'█' * round(betrag / 30)}")
gesamt = sum(kosten.values())
print(f"\nGesamt {gesamt} € · pro Person {gesamt / personen:.0f} €")
```

Passt ins Budget. Nächster Schritt: Wohnung bestätigen.
