/**
 * Markdown edits behind dragging pictures into galleries. A gallery is just a
 * paragraph of images (markdown.ts), so adding a picture means putting its
 * `![](…)` into that paragraph, one picture per line.
 */
import { findImages } from "./images";

/** A block that holds pictures and nothing else: one image, or a gallery. */
export function isImageOnly(text: string): boolean {
  const refs = findImages(text);
  if (!refs.length || /^\s*(?:`{3,}|~{3,}|---\n|[#>|-])/.test(text)) return false;
  let rest = text;
  for (const ref of [...refs].reverse()) rest = rest.slice(0, ref.start) + rest.slice(ref.end);
  return !rest.trim();
}

/** Insert picture markup into an image-only block before picture `before` (null: at the end). */
export function insertImages(text: string, markups: string[], before: number | null): string {
  if (!markups.length) return text;
  const block = markups.join("\n");
  const refs = findImages(text);
  if (before !== null && before >= 0 && before < refs.length) {
    const at = refs[before].start;
    return text.slice(0, at) + block + "\n" + text.slice(at);
  }
  const head = text.replace(/\s+$/, "");
  return head ? `${head}\n${block}` : block;
}

/** Take picture `ordinal` out of a block; the markup and what is left (null when nothing is). */
export function takeImage(text: string, ordinal: number): { markup: string; rest: string | null } | null {
  const ref = findImages(text)[ordinal];
  if (!ref) return null;
  const left = text.slice(0, ref.start).replace(/[ \t]+$/, "");
  const right = text.slice(ref.end).replace(/^[ \t]+/, "");
  let rest: string;
  if (left.endsWith("\n") && right.startsWith("\n")) rest = left + right.slice(1);
  else if (!right) rest = left.replace(/\n$/, "");
  else if (!left) rest = right.replace(/^\n/, "");
  else if (left.endsWith("\n") || right.startsWith("\n")) rest = left + right;
  else rest = `${left} ${right}`;
  return { markup: text.slice(ref.start, ref.end), rest: rest.trim() ? rest : null };
}

export interface ImageMove {
  /** New text of the source block (null: remove it). Absent when source and target are the same block. */
  from?: string | null;
  to: string;
}

/**
 * Move picture `ordinal` of `fromText` into `toText` before picture `before`
 * (null: at the end). With `same`, both texts are the one block (reordering a
 * gallery). Null when nothing would change.
 */
export function moveImage(fromText: string, ordinal: number, toText: string, before: number | null, same: boolean): ImageMove | null {
  const taken = takeImage(fromText, ordinal);
  if (!taken) return null;
  if (same) {
    if (before === ordinal || before === ordinal + 1 || (before === null && ordinal === findImages(fromText).length - 1)) return null;
    const target = before !== null && before > ordinal ? before - 1 : before;
    return { to: insertImages(taken.rest ?? "", [taken.markup], target) };
  }
  return { from: taken.rest, to: insertImages(toText, [taken.markup], before) };
}

/**
 * The Markdown without its pictures, for an export "ohne Bilder": images (and
 * links that only wrapped an image) are removed, paragraphs left empty go away,
 * code blocks are left exactly as written.
 */
export function stripImages(markdown: string): string {
  const blocks = markdown.replace(/\r\n/g, "\n").split(/\n{2,}/);
  let open: string | null = null; // marker of a code fence that is still open
  const kept: string[] = [];
  for (const block of blocks) {
    // Code blocks (they may span blank lines) pass through untouched.
    if (open !== null || /^\s*(`{3,}|~{3,})/m.test(block)) {
      kept.push(block);
      for (const line of block.split("\n")) {
        const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
        if (!marker) continue;
        if (open === null) open = marker;
        else if (marker[0] === open[0] && marker.length >= open.length && !line.trim().slice(marker.length).trim()) open = null;
      }
      continue;
    }
    const refs = findImages(block);
    if (!refs.length) { kept.push(block); continue; }
    // Cut [start, end) and close the gap: one space between words, none at a line edge.
    const cut = (t: string, start: number, end: number) => {
      const left = t.slice(0, start).replace(/[ \t]+$/, ""), right = t.slice(end).replace(/^[ \t]+/, "");
      return left + (left && right && !left.endsWith("\n") && !right.startsWith("\n") ? " " : "") + right;
    };
    let text = block;
    for (const ref of refs.reverse()) text = cut(text, ref.start, ref.end);
    // A link that only wrapped a picture is now empty: drop it too.
    for (let m = /\[\s*\]\([^)]*\)/.exec(text); m; m = /\[\s*\]\([^)]*\)/.exec(text)) text = cut(text, m.index, m.index + m[0].length);
    text = text.replace(/\n{2,}/g, "\n").replace(/^\n+|\n+$/g, "");
    if (text.trim()) kept.push(text);
  }
  return kept.join("\n\n") + (markdown.endsWith("\n") ? "\n" : "");
}
