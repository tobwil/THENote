import { build } from "esbuild";
import { JSDOM } from "jsdom";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const outdir = root + "tests/.build/tableformula";
await build({ entryPoints: ["tableformula", "markdown"].map(n => root + `src/${n}.ts`), bundle: true, format: "esm", splitting: true, outdir });
const dom = new JSDOM("<!doctype html><body></body>");
for (const name of ["window", "document", "Node", "NodeFilter", "HTMLElement", "Text"]) globalThis[name] = name === "window" ? dom.window : dom.window[name];
const f = await import(outdir + "/tableformula.js");
const md = await import(outdir + "/markdown.js");
let checks = 0;
const eq = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };
const table = text => text.trim().split("\n").filter((_, i) => i !== 1).map(line => line.replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
const shown = (text, ref) => {
  const rows = table(text), result = f.evaluateTable(rows);
  const col = ref.charCodeAt(0) - 65, row = Number(ref.slice(1)) - 1;
  return result[row][col]?.display;
};

// Numbers in German and English notation, with units.
for (const [text, value, unit] of [["3,50 €", 3.5, "€"], ["1.234,50 €", 1234.5, "€"], ["1,234.50", 1234.5, null], ["1.320", 1320, null], ["3.5", 3.5, null], ["€ 20", 20, "€"], ["-12", -12, null], ["15 %", 0.15, "%"], ["**42**", 42, null], ["0.125", 0.125, null]]) eq(f.parseCellNumber(text), { value, unit }, `parses ${text}`);
eq(f.parseCellNumber("Kaffee"), null, "text is not a number");
eq(f.columnName(0) + f.columnName(25) + f.columnName(26), "AZAA", "column names");

const example = f.FORMULA_TABLE_EXAMPLE;
eq(shown(example, "D2"), "7,00 €", "B2*C2 keeps the currency and cents");
eq(shown(example, "D3"), "8,40 €", "decimal comma prices multiply");
eq(shown(example, "B5"), "6", "SUMME over a plain column");
eq(shown(example, "D5"), "17,30 €", "SUMME over a whole column of formula cells, bold wrapper");

const t = `| A | B | C |
| - | - | - |
| 10 | 4 | =A2/B2 |
| 2 | 0 | =A3/B3 |
| x | 5 | =A4+B4 |
| =MITTELWERT(A2:A3) | =MAX(B2:B4) | =C5 |
| =RUNDEN(C2;1) | =WENN(A2>5;"groß";"klein") | =ANZAHL(A2:A4) |
| =SUM(A2:B3) | =FOO(1) | =A2&" Stück" |
| =2^3+(1+1)*2 | =-B2 | =A9 |`;
eq(shown(t, "C2"), "2,5", "division");
eq(shown(t, "C3"), "#DIV/0!", "division by zero");
eq(shown(t, "C4"), "#WERT!", "text in arithmetic");
eq(shown(t, "A5"), "6", "German AVERAGE");
eq(shown(t, "B5"), "5", "MAX over range");
eq(shown(t, "C5"), "#ZYKLUS!", "self reference is a cycle");
eq(shown(t, "A6"), "2,5", "ROUND with ; separator");
eq(shown(t, "B6"), "groß", "IF with comparison and text");
eq(shown(t, "C6"), "2", "COUNT skips text");
eq(shown(t, "A7"), "16", "SUM over a 2×2 range");
eq(shown(t, "B7"), "#NAME?", "unknown function");
eq(shown(t, "C7"), "10 Stück", "text join");
eq(shown(t, "A8"), "12", "precedence and power");
eq(shown(t, "B8"), "-4", "unary minus");
eq(shown(t, "C8"), "#BEZUG!", "reference outside the table");
// Whole columns: a total row sums its own column without a cycle.
const cols = `| Posten | Betrag |
| - | - |
| Miete | 950 € |
| Strom | 64,50 € |
| Summe | =SUMME(B:B) |
| Schnitt | =MITTELWERT(B2:B3) |
| Zwei Spalten | =ANZAHL(A:B) |`;
eq(shown(cols, "B4"), "1.014,50 €", "a total row sums the rows above it");
eq(f.evaluateTable([["n", "Summe"], ["1", ""], ["2", ""], ["4", "=SUMME(A:A)"]])[3][1].display, "7", "outside the column: all body rows");
eq(shown(cols, "B6"), "4", "column ranges can span columns");
const help = f.evaluateTable([["a"], ["=sum(a"]])[1][0];
eq([help.display, help.error, /A2:A5 oder A:A/.test(help.message)], ["#NAME?", "#NAME?", true], "errors explain the right spelling");
eq(f.evaluateTable([["a"], ["=200*10%"]])[1][0].display, "20", "percent postfix");
eq(f.evaluateTable([["Preis", "Rabatt"], ["80 €", "=A2*25%"]])[1][1].display, "20 €", "percent keeps the currency");
eq(f.evaluateTable([["a", "b"], ["1", "2"]]), [[null, null], [null, null]], "plain tables are untouched");

// Rendering: the result is shown, the formula stays in the tooltip, the source is unchanged.
const host = document.createElement("div");
host.innerHTML = md.renderMarkdown(example);
const cells = [...host.querySelectorAll("td")].map(td => td.textContent.trim());
eq(cells.slice(-4), ["Gesamt", "6", "", "17,30 €"], "rendered totals row");
eq(host.querySelector("td .md-formula").getAttribute("title"), "=B2*C2", "formula is the tooltip");
eq(!!host.querySelector("td strong .md-formula, td .md-formula strong"), true, "bold formula renders bold");
host.innerHTML = md.renderMarkdown("| a | b |\n| - | - |\n| 1 | =A2*(1 |");
eq(host.querySelector(".md-formula-error")?.textContent, "#WERT!", "broken formula shows an error code");
eq(/^=A2\*\(1 · #WERT!: /.test(host.querySelector(".md-formula-error").getAttribute("title")), true, "error tooltip explains the problem");
host.innerHTML = md.renderMarkdown("| a |\n| - |\n| =\"<img src=x onerror=alert(1)>\" |");
eq(host.querySelector("img"), null, "formula text results are escaped");
console.log(`${checks} table formula checks passed`);
