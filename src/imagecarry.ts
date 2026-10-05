/**
 * Images travel with their note: when a note moves into another folder, the
 * pictures it links below its own folder (assets/…, or a copy-images-to
 * folder) move along, so its relative links keep working.
 */
import { findImages, toAbsImagePath } from "./images";

const PICTURE = /\.(png|jpe?g|gif|webp|bmp|tiff?|heic|avif|svg)$/i;

export interface CarriedImage {
  /** The source exactly as written in the note. */
  src: string;
  /** Its path below the note's folder, with forward slashes. */
  rel: string;
}

/** Local pictures the note at `noteDir` links that lie below that folder. */
export function imagesToCarry(text: string, noteDir: string): CarriedImage[] {
  const base = noteDir.replace(/\\/g, "/").replace(/\/+$/, "");
  const seen = new Set<string>();
  const out: CarriedImage[] = [];
  for (const ref of findImages(text)) {
    const src = ref.src.trim();
    if (!src || seen.has(src)) continue;
    seen.add(src);
    let path = src;
    try { path = decodeURI(src); } catch { /* keep as written */ }
    const abs = toAbsImagePath(path, { dir: base });
    if (!abs || !PICTURE.test(abs) || !abs.startsWith(base + "/")) continue;
    out.push({ src, rel: abs.slice(base.length + 1) });
  }
  return out;
}

/** Point image sources at new paths (`old src → new src`), leaving everything else as written. */
export function rewriteImageSources(text: string, changes: ReadonlyMap<string, string>): string {
  const refs = findImages(text).filter(ref => changes.has(ref.src.trim()));
  for (const ref of refs.reverse()) {
    const next = changes.get(ref.src.trim())!;
    const chunk = text.slice(ref.start, ref.end);
    const replaced = ref.kind === "md"
      ? chunk.replace(/\]\(\s*(?:<[^>\n]*>|[^)\s]+)/, () => `](${/\s/.test(next) ? `<${next}>` : next}`)
      : chunk.replace(/(\ssrc\s*=\s*)(["'])[^"']*\2/i, (_, attr: string, quote: string) => `${attr}${quote}${next}${quote}`);
    text = text.slice(0, ref.start) + replaced + text.slice(ref.end);
  }
  return text;
}
