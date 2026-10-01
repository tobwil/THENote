/**
 * Spreadsheet formulas inside Markdown pipe tables.
 *
 * The file keeps the formula (`| =SUMME(D2:D4) |`); only the rendered table
 * shows its result, so the Markdown stays portable and an active (edited)
 * table shows the formulas like a spreadsheet's edit line.
 *
 * Addressing follows spreadsheets: columns A, B, C …, rows count from the
 * header row, so the header is row 1 and the first body row is row 2.
 *
 *   evaluateTable([["Item", "Price"], ["Coffee", "3,50 €"], ["Total", "=SUM(B2:B2)"]])
 *     → [[null, null], [null, null], [null, { display: "3,50 €", … }]]
 *
 * Supported: + − * / ^, parentheses, comparisons (= <> < > <= >=), text in
 * "quotes", & to join text, cell references (A2) and ranges (B2:B5), and the
 * functions below in English or German spelling. Arguments are separated by
 * `;` (as in German spreadsheets) or `,`; decimals in formulas use `.`.
 * Cell values may use German or English number formats and a unit such as €.
 */

export interface FormulaCell {
  /** Text shown in the rendered table. */
  display: string;
  /** Spreadsheet-style error code when the formula could not be evaluated. */
  error?: string;
}

type Value = number | string | boolean;
interface Num { value: number; unit: string | null }
class FormulaError extends Error {}
const fail = (code: string): never => { throw new FormulaError(code); };

/** A cell's text is a formula when it starts with `=` (optionally inside **bold**). */
export function formulaSource(text: string): string | null {
  const t = text.trim();
  const bold = /^\*\*(=.+)\*\*$/.exec(t);
  const body = bold ? bold[1] : t;
  return /^=\s*\S/.test(body) ? body.slice(1).trim() : null;
}

export function columnName(index: number): string {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}
function columnIndex(name: string): number {
  return [...name.toUpperCase()].reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}

const UNIT = /^(?:€|\$|£|¥|EUR|USD|CHF|GBP)$/i;
/** Read a plain cell as a number: "1.234,50 €", "3.5", "-12 %", "€ 20". */
export function parseCellNumber(text: string): Num | null {
  let t = text.replace(/\*\*|__|`/g, "").replace(/[ \s]+/g, " ").trim().replace(/^−/, "-");
  if (!t) return null;
  let unit: string | null = null;
  const prefix = /^(€|\$|£|¥|EUR|USD|CHF|GBP)\s?(.*)$/i.exec(t);
  const suffix = /^(.*?)\s?(€|\$|£|¥|EUR|USD|CHF|GBP|%)$/i.exec(t);
  if (prefix) { unit = prefix[1]; t = prefix[2]; }
  else if (suffix) { unit = suffix[2]; t = suffix[1]; }
  t = t.replace(/['\s]/g, "");
  if (!/^[+-]?(?:\d[\d.,]*|[.,]\d+)$/.test(t)) return null;
  const comma = t.lastIndexOf(","), dot = t.lastIndexOf(".");
  if (comma !== -1 && dot !== -1) t = comma > dot ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (comma !== -1) t = (t.match(/,/g)!.length > 1) ? t.replace(/,/g, "") : t.replace(",", ".");
  else if (dot !== -1 && (t.match(/\./g)!.length > 1 || /^[+-]?[1-9]\d{0,2}\.\d{3}$/.test(t))) t = t.replace(/\./g, "");
  const value = Number(t);
  if (!Number.isFinite(value)) return null;
  if (unit === "%") return { value: value / 100, unit: "%" };
  return { value, unit: unit && UNIT.test(unit) ? unit : null };
}

/* ---------- tokenizer and parser ---------- */

type Token = { kind: "num"; value: number } | { kind: "str"; value: string } | { kind: "ref"; value: string } | { kind: "name"; value: string } | { kind: "op"; value: string };
function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    const rest = src.slice(i);
    let m: RegExpExecArray | null;
    if ((m = /^\d+(?:\.\d+)?/.exec(rest))) { out.push({ kind: "num", value: Number(m[0]) }); i += m[0].length; continue; }
    if ((m = /^"((?:[^"]|"")*)"/.exec(rest))) { out.push({ kind: "str", value: m[1].replace(/""/g, '"') }); i += m[0].length; continue; }
    if ((m = /^\$?([A-Za-z]{1,3})\$?(\d+)(?![\w(])/.exec(rest))) { out.push({ kind: "ref", value: (m[1] + m[2]).toUpperCase() }); i += m[0].length; continue; }
    if ((m = /^[A-Za-zÄÖÜäöüß_][\wÄÖÜäöüß.]*/.exec(rest))) { out.push({ kind: "name", value: m[0].toUpperCase() }); i += m[0].length; continue; }
    if ((m = /^(<=|>=|<>|[-+*/^()=<>&:;,%])/.exec(rest))) { out.push({ kind: "op", value: m[0] }); i += m[0].length; continue; }
    fail("#NAME?");
  }
  return out;
}

type Node =
  | { type: "num"; value: number } | { type: "str"; value: string } | { type: "bool"; value: boolean }
  | { type: "ref"; ref: string } | { type: "range"; from: string; to: string }
  | { type: "unary"; op: string; arg: Node } | { type: "binary"; op: string; left: Node; right: Node }
  | { type: "percent"; arg: Node } | { type: "call"; name: string; args: Node[] };

function parse(tokens: Token[]): Node {
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (v: string) => peek()?.kind === "op" && peek()!.value === v;
  const take = (v: string) => { if (!isOp(v)) fail("#WERT!"); pos++; };
  const comparison = (): Node => {
    let left = concat();
    while (peek()?.kind === "op" && ["=", "<>", "<", ">", "<=", ">="].includes(String(peek()!.value))) {
      const op = String(tokens[pos++].value); left = { type: "binary", op, left, right: concat() };
    }
    return left;
  };
  const concat = (): Node => {
    let left = additive();
    while (isOp("&")) { pos++; left = { type: "binary", op: "&", left, right: additive() }; }
    return left;
  };
  const additive = (): Node => {
    let left = multiplicative();
    while (isOp("+") || isOp("-")) { const op = String(tokens[pos++].value); left = { type: "binary", op, left, right: multiplicative() }; }
    return left;
  };
  const multiplicative = (): Node => {
    let left = power();
    while (isOp("*") || isOp("/")) { const op = String(tokens[pos++].value); left = { type: "binary", op, left, right: power() }; }
    return left;
  };
  const power = (): Node => {
    const base = unary();
    if (isOp("^")) { pos++; return { type: "binary", op: "^", left: base, right: power() }; }
    return base;
  };
  const unary = (): Node => {
    if (isOp("-") || isOp("+")) { const op = String(tokens[pos++].value); return { type: "unary", op, arg: unary() }; }
    let node = primary();
    while (isOp("%")) { pos++; node = { type: "percent", arg: node }; }
    return node;
  };
  const primary = (): Node => {
    const token = peek();
    if (!token) return fail("#WERT!");
    pos++;
    if (token.kind === "num") return { type: "num", value: token.value };
    if (token.kind === "str") return { type: "str", value: token.value };
    if (token.kind === "ref") {
      if (isOp(":")) {
        pos++;
        const end = tokens[pos++];
        if (end?.kind !== "ref") fail("#BEZUG!");
        return { type: "range", from: token.value, to: (end as { value: string }).value };
      }
      return { type: "ref", ref: token.value };
    }
    if (token.kind === "name") {
      if (isOp("(")) {
        pos++;
        const args: Node[] = [];
        if (!isOp(")")) {
          args.push(comparison());
          while (isOp(";") || isOp(",")) { pos++; args.push(comparison()); }
        }
        take(")");
        return { type: "call", name: token.value, args };
      }
      if (token.value === "TRUE" || token.value === "WAHR") return { type: "bool", value: true };
      if (token.value === "FALSE" || token.value === "FALSCH") return { type: "bool", value: false };
      return fail("#NAME?");
    }
    if (token.value === "(") { const inner = comparison(); take(")"); return inner; }
    return fail("#WERT!");
  };
  const tree = comparison();
  if (pos < tokens.length) fail("#WERT!");
  return tree;
}

/* ---------- evaluation ---------- */

const ALIASES: Record<string, string> = {
  SUMME: "SUM", MITTELWERT: "AVERAGE", AVG: "AVERAGE", ANZAHL: "COUNT", RUNDEN: "ROUND", WENN: "IF",
  PRODUKT: "PRODUCT", ANZAHL2: "COUNTA", MINIMUM: "MIN", MAXIMUM: "MAX",
};
const FUNCTIONS = new Set(["SUM", "AVERAGE", "MIN", "MAX", "COUNT", "COUNTA", "ROUND", "ABS", "IF", "PRODUCT"]);

/**
 * Evaluate every formula cell of a table. `rows[0]` is the header row (row 1).
 * Returns the same shape; non-formula cells are `null`.
 */
export function evaluateTable(rows: string[][]): (FormulaCell | null)[][] {
  const memo = new Map<string, { value: Value; unit: string | null } | FormulaError>();
  const active = new Set<string>();
  const decimals = new Set<string>();
  const centsRefs = new Set<string>();

  const cellText = (ref: string): string | undefined => {
    const m = /^([A-Z]+)(\d+)$/.exec(ref)!;
    return rows[Number(m[2]) - 1]?.[columnIndex(m[1])];
  };
  /** A cell's value: its formula's result, a number, text, or empty. */
  const cell = (ref: string): { value: Value | null; unit: string | null } => {
    const text = cellText(ref);
    if (text === undefined) fail("#BEZUG!");
    const formula = formulaSource(text!);
    if (formula === null) {
      const n = parseCellNumber(text!);
      if (n) { if (/[.,]\d{2}\b/.test(text!)) decimals.add(ref); return { value: n.value, unit: n.unit === "%" ? null : n.unit }; }
      const plain = text!.replace(/\*\*|__|`/g, "").trim();
      return { value: plain === "" ? null : plain, unit: null };
    }
    if (memo.has(ref)) { const hit = memo.get(ref)!; if (hit instanceof FormulaError) throw hit; if (centsRefs.has(ref)) decimals.add(ref); return hit; }
    if (active.has(ref)) fail("#ZYKLUS!");
    active.add(ref);
    try {
      const result = evaluate(parse(tokenize(formula)));
      const value = Array.isArray(result) ? fail("#WERT!") : result;
      memo.set(ref, value as { value: Value; unit: string | null });
      if (decimals.size) centsRefs.add(ref);
      return value as { value: Value; unit: string | null };
    } catch (error) {
      const failure = error instanceof FormulaError ? error : new FormulaError("#WERT!");
      memo.set(ref, failure);
      throw failure;
    } finally { active.delete(ref); }
  };
  const range = (from: string, to: string) => {
    const a = /^([A-Z]+)(\d+)$/.exec(from)!, b = /^([A-Z]+)(\d+)$/.exec(to)!;
    const [c1, c2] = [columnIndex(a[1]), columnIndex(b[1])].sort((x, y) => x - y);
    const [r1, r2] = [Number(a[2]), Number(b[2])].sort((x, y) => x - y);
    if (r2 > rows.length || c2 >= Math.max(...rows.map(r => r.length))) fail("#BEZUG!");
    const out: { value: Value | null; unit: string | null }[] = [];
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) out.push(cell(columnName(c) + r));
    return out;
  };
  type Result = { value: Value | null; unit: string | null };
  const num = (r: Result): number => {
    if (r.value === null) return 0;
    if (typeof r.value === "number") return r.value;
    if (typeof r.value === "boolean") return r.value ? 1 : 0;
    return fail("#WERT!");
  };
  const unitOf = (...results: Result[]) => {
    const units = [...new Set(results.map(r => r.unit).filter(Boolean))];
    return units.length === 1 ? units[0] : null;
  };
  const values = (args: Node[]): Result[] => args.flatMap(arg => {
    const r = evaluate(arg);
    return Array.isArray(r) ? r : [r];
  });
  const numbers = (items: Result[]) => items.filter(r => typeof r.value === "number") as { value: number; unit: string | null }[];

  function evaluate(node: Node): Result | Result[] {
    switch (node.type) {
      case "num": return { value: node.value, unit: null };
      case "str": return { value: node.value, unit: null };
      case "bool": return { value: node.value, unit: null };
      case "ref": return cell(node.ref);
      case "range": return range(node.from, node.to);
      case "percent": { const r = single(node.arg); return { value: num(r) / 100, unit: null }; }
      case "unary": { const r = single(node.arg); return { value: node.op === "-" ? -num(r) : num(r), unit: r.unit }; }
      case "binary": {
        const l = single(node.left), r = single(node.right);
        if (node.op === "&") return { value: text(l) + text(r), unit: null };
        if (["=", "<>", "<", ">", "<=", ">="].includes(node.op)) {
          const [a, b] = typeof l.value === "string" || typeof r.value === "string" ? [text(l), text(r)] : [num(l), num(r)];
          const result = node.op === "=" ? a === b : node.op === "<>" ? a !== b : node.op === "<" ? a < b : node.op === ">" ? a > b : node.op === "<=" ? a <= b : a >= b;
          return { value: result, unit: null };
        }
        const a = num(l), b = num(r);
        if (node.op === "/" && b === 0) fail("#DIV/0!");
        const value = node.op === "+" ? a + b : node.op === "-" ? a - b : node.op === "*" ? a * b : node.op === "/" ? a / b : a ** b;
        const unit = node.op === "+" || node.op === "-" ? unitOf(l, r) : node.op === "*" ? (l.unit && r.unit ? null : l.unit ?? r.unit) : node.op === "/" ? (r.unit ? null : l.unit) : null;
        return { value, unit };
      }
      case "call": {
        const name = ALIASES[node.name] ?? node.name;
        if (!FUNCTIONS.has(name)) fail("#NAME?");
        if (name === "IF") {
          if (node.args.length < 2) fail("#WERT!");
          const condition = single(node.args[0]);
          const truthy = typeof condition.value === "string" ? condition.value !== "" : num(condition) !== 0;
          return truthy ? single(node.args[1]) : node.args[2] ? single(node.args[2]) : { value: false, unit: null };
        }
        if (name === "ROUND") {
          const x = single(node.args[0] ?? fail("#WERT!")), digits = node.args[1] ? num(single(node.args[1])) : 0;
          const factor = 10 ** Math.trunc(digits);
          return { value: Math.round(num(x) * factor) / factor, unit: x.unit };
        }
        if (name === "ABS") { const x = single(node.args[0] ?? fail("#WERT!")); return { value: Math.abs(num(x)), unit: x.unit }; }
        const items = values(node.args);
        if (name === "COUNTA") return { value: items.filter(r => r.value !== null && r.value !== "").length, unit: null };
        const nums = numbers(items);
        if (name === "COUNT") return { value: nums.length, unit: null };
        const unit = unitOf(...nums);
        if (name === "SUM") return { value: nums.reduce((s, r) => s + r.value, 0), unit };
        if (name === "PRODUCT") return { value: nums.reduce((s, r) => s * r.value, 1), unit };
        if (!nums.length) return name === "AVERAGE" ? fail("#DIV/0!") : { value: 0, unit };
        if (name === "AVERAGE") return { value: nums.reduce((s, r) => s + r.value, 0) / nums.length, unit };
        if (name === "MIN") return { value: Math.min(...nums.map(r => r.value)), unit };
        return { value: Math.max(...nums.map(r => r.value)), unit };
      }
    }
  }
  function single(node: Node): Result {
    const r = evaluate(node);
    if (Array.isArray(r)) return fail("#WERT!");
    return r;
  }
  function text(r: Result): string {
    if (r.value === null) return "";
    if (typeof r.value === "number") return format(r.value, r.unit, false);
    if (typeof r.value === "boolean") return r.value ? "WAHR" : "FALSCH";
    return r.value;
  }

  return rows.map((row, r) => row.map((textValue, c) => {
    if (formulaSource(textValue) === null) return null;
    const ref = columnName(c) + (r + 1);
    try {
      decimals.clear();
      const result = cell(ref);
      if (typeof result.value === "number") return { display: format(result.value, result.unit, decimals.size > 0) };
      return { display: text(result) };
    } catch (error) {
      const code = error instanceof FormulaError ? error.message : "#WERT!";
      return { display: code, error: code };
    }
  }));
}

/** German number format; currency results keep cents when any input had them. */
export function format(value: number, unit: string | null, cents: boolean): string {
  const currency = !!unit && unit !== "%";
  const whole = Number.isInteger(Math.round(value * 1e9) / 1e9);
  const digits = currency ? (cents || !whole ? 2 : 0) : undefined;
  const number = new Intl.NumberFormat("de-DE", { minimumFractionDigits: digits ?? 0, maximumFractionDigits: digits ?? 4 }).format(Math.round(value * 1e9) / 1e9);
  if (!unit) return number;
  return /^[€$£¥]$/.test(unit) ? `${number} ${unit}` : `${number} ${unit.toUpperCase()}`;
}

/** Example inserted by the slash menu's "Tabelle mit Formeln". */
export const FORMULA_TABLE_EXAMPLE = [
  "| Posten | Menge | Preis | Summe |",
  "| :--- | ---: | ---: | ---: |",
  "| Kaffee | 2 | 3,50 € | =B2*C2 |",
  "| Kuchen | 3 | 2,80 € | =B3*C3 |",
  "| Wasser | 1 | 1,90 € | =B4*C4 |",
  "| **Gesamt** | =SUMME(B2:B4) | | **=SUMME(D2:D4)** |",
].join("\n");
