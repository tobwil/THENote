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
