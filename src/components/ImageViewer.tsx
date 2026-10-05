/**
 * Image galleries and the full-window image viewer.
 *
 * A paragraph of two or more images renders as an `.img-gallery` strip
 * (markdown.ts). `decorateGalleries` adds the ‹ › buttons and the counter to
 * each strip after it is rendered; clicking any rendered image opens the viewer
 * with its gallery (or just that image): ← → or the buttons to browse, Esc closes.
 */
import { For, Show, createSignal, onCleanup, onMount, untrack } from "solid-js";
import { Portal } from "solid-js/web";
import { theme } from "../store";
import ModalFrame from "./ModalFrame";

interface Picture { src: string; alt: string }
const [shown, setShown] = createSignal<{ pictures: Picture[]; index: number } | null>(null);

const picturesOf = (imgs: Iterable<HTMLImageElement>) =>
  [...imgs].filter(img => img.getAttribute("src")).map(img => ({ src: img.currentSrc || img.src, alt: img.alt }));

/** Open the viewer for a rendered image, with the rest of its gallery to browse. */
export function openImageViewer(img: HTMLImageElement): boolean {
  if (!img.getAttribute("src")) return false;
  const gallery = img.closest(".img-gallery");
  const imgs = gallery ? [...gallery.querySelectorAll<HTMLImageElement>(".img-gallery-track img")] : [img];
  const pictures = picturesOf(imgs);
  const index = Math.max(0, imgs.filter(i => i.getAttribute("src")).indexOf(img));
  if (!pictures.length) return false;
  setShown({ pictures, index });
  return true;
}

/** Scroll a gallery strip by one picture in direction `dir` (−1 or 1). */
function step(track: HTMLElement, dir: number) {
  const items = [...track.querySelectorAll<HTMLElement>("img")];
  const left = track.scrollLeft;
  const target = dir > 0
    ? items.find(item => item.offsetLeft > left + 4)
    : [...items].reverse().find(item => item.offsetLeft < left - 4);
  track.scrollTo({ left: target ? target.offsetLeft - items[0].offsetLeft : dir > 0 ? track.scrollWidth : 0, behavior: "smooth" });
}

/** Add browse buttons and a counter to the gallery strips inside `host`. */
export function decorateGalleries(host: HTMLElement) {
  for (const gallery of host.querySelectorAll<HTMLElement>(".img-gallery")) {
    if (gallery.querySelector(".img-gallery-nav")) continue;
    const track = gallery.querySelector<HTMLElement>(".img-gallery-track");
    if (!track) continue;
    const count = track.querySelectorAll("img").length;
    const button = (dir: number, label: string, glyph: string) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `img-gallery-nav ${dir < 0 ? "prev" : "next"}`;
      b.setAttribute("aria-label", label);
      b.title = label;
      b.textContent = glyph;
      b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); step(track, dir); });
      return b;
    };
    const counter = document.createElement("span");
    counter.className = "img-gallery-count";
    const prev = button(-1, "Vorheriges Bild", "‹");
    const next = button(1, "Nächstes Bild", "›");
    const update = () => {
      const items = [...track.querySelectorAll<HTMLElement>("img")];
      const first = items[0]?.offsetLeft ?? 0;
      const at = items.findIndex(item => item.offsetLeft - first + item.offsetWidth / 2 > track.scrollLeft);
      counter.textContent = `${Math.max(0, at) + 1} / ${count}`;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      gallery.classList.toggle("overflowing", track.scrollWidth > track.clientWidth + 2);
    };
    track.addEventListener("scroll", update, { passive: true });
    track.querySelectorAll("img").forEach(img => img.addEventListener("load", update));
    gallery.append(prev, next, counter);
    update();
  }
}

function Viewer(props: { pictures: Picture[]; start: number; onClose: () => void }) {
  const [index, setIndex] = createSignal(untrack(() => props.start));
  const total = () => props.pictures.length;
  const go = (delta: number) => setIndex(i => (i + delta + total()) % total());
  const current = () => props.pictures[index()];
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "Home") { e.preventDefault(); setIndex(0); }
    else if (e.key === "End") { e.preventDefault(); setIndex(total() - 1); }
  };
  onMount(() => {
    document.addEventListener("keydown", onKey);
    onCleanup(() => document.removeEventListener("keydown", onKey));
  });
  return (
    <ModalFrame class="image-viewer" label="Bildansicht" onClose={props.onClose}>
      <div class="image-viewer-inner">
        <header class="image-viewer-bar">
          <b>{current().alt || "Bild"}</b>
          <span class="image-viewer-count">{index() + 1} / {total()}</span>
          <button type="button" class="image-viewer-close" aria-label="Schließen" title="Schließen (Esc)" onClick={() => props.onClose()}>×</button>
        </header>
        <div class="image-viewer-stage" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
          <img src={current().src} alt={current().alt} draggable={false} />
          <Show when={total() > 1}>
            <button type="button" class="image-viewer-nav prev" aria-label="Vorheriges Bild" title="Vorheriges Bild (←)" onClick={() => go(-1)}>‹</button>
            <button type="button" class="image-viewer-nav next" aria-label="Nächstes Bild" title="Nächstes Bild (→)" onClick={() => go(1)}>›</button>
          </Show>
        </div>
        <Show when={total() > 1}>
          <div class="image-viewer-thumbs" role="list">
            <For each={props.pictures}>{(picture, i) => (
              <button type="button" role="listitem" classList={{ active: i() === index() }} aria-label={`Bild ${i() + 1}`} aria-current={i() === index() ? "true" : undefined} onClick={() => setIndex(i())}>
                <img src={picture.src} alt="" draggable={false} />
              </button>
            )}</For>
          </div>
        </Show>
      </div>
    </ModalFrame>
  );
}

export default function ImageViewer() {
  return (
    <Show when={shown()} keyed>{(s) => (
      <Portal><div class="image-viewer-root" data-theme={theme()}>
        <Viewer pictures={s.pictures} start={s.index} onClose={() => setShown(null)} />
      </div></Portal>
    )}</Show>
  );
}
