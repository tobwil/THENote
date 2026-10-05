/**
 * Drag pictures into galleries. A rendered picture can be dragged onto a
 * gallery (or onto a block holding a single picture, which becomes a gallery);
 * it lands before or after the picture under the pointer. Image files dropped
 * from Finder use the same targets (App.tsx). Esc cancels a drag.
 */
import { doc, rewriteBlocks } from "./store";
import { isImageOnly, moveImage } from "./gallerytext";

export interface ImageDropTarget {
  blockId: number;
  /** Insert before this picture of the block; null appends. */
  before: number | null;
  host: HTMLElement;
  mark?: { img: HTMLElement; side: "before" | "after" };
}

const blockText = (id: number) => doc.blocks.find(block => block.id === id)?.text;

/** The gallery (or single-picture block) under (x, y), and where a picture would land in it. */
export function imageDropTarget(x: number, y: number): ImageDropTarget | null {
  const under = document.elementFromPoint(x, y) as HTMLElement | null;
  const block = under?.closest<HTMLElement>(".block[data-block-id]");
  if (!under || !block || block.classList.contains("active")) return null;
  const blockId = Number(block.dataset.blockId);
  const text = blockText(blockId);
  const rendered = block.querySelector<HTMLElement>(".rendered");
  if (text == null || !rendered || !isImageOnly(text)) return null;
  const imgs = [...rendered.querySelectorAll<HTMLElement>("img")];
  const host = rendered.querySelector<HTMLElement>(".img-gallery") ?? rendered;
  const img = under.closest("img");
  if (img && imgs.includes(img)) {
    const box = img.getBoundingClientRect();
    const index = imgs.indexOf(img);
    const after = x > box.left + box.width / 2;
    return { blockId, before: after ? (index + 1 < imgs.length ? index + 1 : null) : index, host, mark: { img, side: after ? "after" : "before" } };
  }
  return { blockId, before: null, host };
}

let shown: ImageDropTarget | null = null;
/** Highlight a drop target (null clears). */
export function showImageDropTarget(target: ImageDropTarget | null) {
  if (shown) {
    shown.host.classList.remove("img-drop-target");
    shown.mark?.img.classList.remove("img-drop-before", "img-drop-after");
  }
  shown = target;
  if (target) {
    target.host.classList.add("img-drop-target");
    target.mark?.img.classList.add(`img-drop-${target.mark.side}`);
  }
}

let suppressClickUntil = 0;
/** True right after a drag ended, so the mouseup's click does not open the viewer. */
export const imageDragJustEnded = () => Date.now() < suppressClickUntil;

/** Start dragging picture `ordinal` of block `blockId` from a mousedown on its rendered <img>. */
export function startImageDrag(e: MouseEvent, img: HTMLImageElement, blockId: number, ordinal: number) {
  if (e.button !== 0) return;
  const sx = e.clientX, sy = e.clientY;
  let ghost: HTMLElement | null = null;
  let target: ImageDropTarget | null = null;
  const move = (m: MouseEvent) => {
    if (!ghost) {
      if (Math.hypot(m.clientX - sx, m.clientY - sy) < 6) return;
      ghost = document.createElement("div");
      ghost.className = "img-drag-ghost";
      const picture = document.createElement("img");
      picture.src = img.currentSrc || img.src;
      picture.alt = "";
      ghost.append(picture);
      document.body.append(ghost);
      document.body.classList.add("img-dragging");
      img.classList.add("img-drag-source");
      window.getSelection()?.removeAllRanges();
    }
    m.preventDefault();
    ghost.style.left = `${m.clientX + 12}px`;
    ghost.style.top = `${m.clientY + 12}px`;
    target = imageDropTarget(m.clientX, m.clientY);
    if (target?.mark?.img === img) target = null; // onto itself: nowhere to go
    ghost.classList.toggle("has-target", !!target);
    showImageDropTarget(target);
  };
  const finish = (commit: boolean) => {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
    window.removeEventListener("keydown", key, true);
    showImageDropTarget(null);
    if (!ghost) return;
    ghost.remove();
    document.body.classList.remove("img-dragging");
    img.classList.remove("img-drag-source");
    suppressClickUntil = Date.now() + 400;
    if (commit && target) dropImage(blockId, ordinal, target);
  };
  const up = () => finish(true);
  const key = (k: KeyboardEvent) => { if (k.key === "Escape" && ghost) { k.preventDefault(); k.stopPropagation(); finish(false); } };
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  window.addEventListener("keydown", key, true);
}

function dropImage(fromId: number, ordinal: number, target: ImageDropTarget) {
  const from = blockText(fromId), to = blockText(target.blockId);
  if (from == null || to == null) return;
  const same = fromId === target.blockId;
  const result = moveImage(from, ordinal, to, target.before, same);
  if (!result) return;
  rewriteBlocks(same ? [{ id: fromId, text: result.to }] : [{ id: target.blockId, text: result.to }, { id: fromId, text: result.from ?? null }]);
}
