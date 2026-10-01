/**
 * Diagram magnifier for rendered Mermaid and D2 blocks.
 *
 * Large diagrams are scaled down to the page width in the document, which can
 * make their labels unreadable. Hovering a diagram shows a "Vergrößern"
 * button; it opens the diagram full-window with zoom and pan:
 *   drag or scroll to pan, pinch or ⌘/Ctrl + scroll to zoom, double-click to
 *   zoom in, + / − / 0 (fit) / 1 (100 %) and the arrow keys on the keyboard.
 *
 * The viewer shows a copy of the rendered SVG at its natural size and scales
 * it with a CSS transform, so text stays vector-sharp at every zoom level.
 */
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { theme } from "../store";
import ModalFrame from "./ModalFrame";

interface Diagram { svg: SVGSVGElement; width: number; height: number; title: string }
const [diagram, setDiagram] = createSignal<Diagram | null>(null);

const DIAGRAM_HOSTS = ".mermaid-block, .d2-block";

function titleOf(host: Element) {
  return host.classList.contains("d2-block") ? "D2-Diagramm" : "Mermaid-Diagramm";
}

/** Open the diagram rendered inside `host` (a .mermaid-block or .d2-block). */
export function openDiagram(host: Element): boolean {
  const source = host.querySelector<SVGSVGElement>(":scope > svg") ?? host.querySelector<SVGSVGElement>("svg");
  if (!source) return false;
  const box = source.viewBox?.baseVal;
  const rect = source.getBoundingClientRect();
  const width = box && box.width ? box.width : rect.width;
  const height = box && box.height ? box.height : rect.height;
  if (!width || !height) return false;
  const svg = source.cloneNode(true) as SVGSVGElement;
  svg.removeAttribute("style");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("aria-hidden", "true");
  setDiagram({ svg, width, height, title: titleOf(host) });
  return true;
}

/** The diagram of the block the caret or selection is in, for the command palette. */
export function openDiagramOfBlock(block: Element | null | undefined): boolean {
  const host = block?.querySelector(DIAGRAM_HOSTS);
  return host ? openDiagram(host) : false;
}

const MIN = 0.1, MAX = 8;

function Viewer(props: { diagram: Diagram; onClose: () => void }) {
  let stage!: HTMLDivElement;
  let canvas!: HTMLDivElement;
  const [view, setView] = createSignal({ scale: 1, x: 0, y: 0 });
  let drag: { id: number; x: number; y: number; ox: number; oy: number } | null = null;

  const fitScale = () => Math.min((stage.clientWidth - 64) / props.diagram.width, (stage.clientHeight - 64) / props.diagram.height);
  const place = (scale: number, top = false) => {
    const s = Math.min(MAX, Math.max(MIN, scale));
    const x = (stage.clientWidth - props.diagram.width * s) / 2;
    const y = top ? 32 : (stage.clientHeight - props.diagram.height * s) / 2;
    setView({ scale: s, x, y });
  };
  const fit = () => place(Math.min(fitScale(), 3));
  const actual = () => place(1, props.diagram.height > stage.clientHeight - 64);
  /** Zoom around a point of the stage, keeping that point under the cursor. */
  const zoomAt = (factor: number, cx = stage.clientWidth / 2, cy = stage.clientHeight / 2) => {
    const v = view();
    const s = Math.min(MAX, Math.max(MIN, v.scale * factor));
    setView({ scale: s, x: cx - (cx - v.x) * (s / v.scale), y: cy - (cy - v.y) * (s / v.scale) });
  };
  const pan = (dx: number, dy: number) => setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  const local = (e: { clientX: number; clientY: number }) => {
    const r = stage.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  onMount(() => {
    canvas.appendChild(props.diagram.svg);
    // Whole diagram when it stays legible, else its full width from the top, else 100 %.
    const widthScale = (stage.clientWidth - 64) / props.diagram.width;
    if (fitScale() >= 0.6) fit();
    else if (widthScale >= 0.6) place(Math.min(widthScale, 1), true);
    else actual();
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinch arrives as a wheel event with ctrlKey set.
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-Math.max(-60, Math.min(60, e.deltaY * (e.deltaMode === 1 ? 20 : 1))) * 0.004), ...local(e));
      else pan(-e.deltaX, -e.deltaY);
    };
    stage.addEventListener("wheel", wheel, { passive: false });
    const resize = () => { if (view().scale === Math.min(fitScale(), 3)) fit(); };
    window.addEventListener("resize", resize);
    onCleanup(() => { stage.removeEventListener("wheel", wheel); window.removeEventListener("resize", resize); });
  });

  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 160 : 60;
    const keys: Record<string, () => void> = {
      "+": () => zoomAt(1.25), "=": () => zoomAt(1.25), "-": () => zoomAt(0.8), "0": fit, "1": actual,
      ArrowLeft: () => pan(step, 0), ArrowRight: () => pan(-step, 0), ArrowUp: () => pan(0, step), ArrowDown: () => pan(0, -step),
    };
    const action = keys[e.key];
    if (action && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); action(); }
  };

  return (
    <ModalFrame class="diagram-viewer" label={`${props.diagram.title} vergrößert`} onClose={props.onClose}>
      <header class="diagram-viewer-bar" onKeyDown={onKey}>
        <b>{props.diagram.title}</b>
        <div class="diagram-viewer-tools">
          <button type="button" aria-label="Verkleinern" title="Verkleinern (−)" onClick={() => zoomAt(0.8)}>−</button>
          <button type="button" class="diagram-viewer-level" aria-label="Originalgröße" title="Originalgröße (1)" onClick={actual}>{Math.round(view().scale * 100)} %</button>
          <button type="button" aria-label="Vergrößern" title="Vergrößern (+)" onClick={() => zoomAt(1.25)}>+</button>
          <button type="button" title="Ganzes Diagramm zeigen (0)" onClick={fit}>Einpassen</button>
          <button type="button" class="diagram-viewer-close" aria-label="Schließen" title="Schließen (Esc)" onClick={() => props.onClose()}>×</button>
        </div>
      </header>
      <div
        ref={stage}
        class="diagram-viewer-stage"
        tabIndex={0}
        role="img"
        aria-label={`${props.diagram.title}. Ziehen zum Verschieben, Plus und Minus zum Zoomen.`}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: view().x, oy: view().y };
          stage.setPointerCapture(e.pointerId);
          stage.classList.add("dragging");
        }}
        onPointerMove={(e) => {
          if (!drag || drag.id !== e.pointerId) return;
          setView(v => ({ ...v, x: drag!.ox + e.clientX - drag!.x, y: drag!.oy + e.clientY - drag!.y }));
        }}
        onPointerUp={() => { drag = null; stage.classList.remove("dragging"); }}
        onPointerCancel={() => { drag = null; stage.classList.remove("dragging"); }}
        onDblClick={(e) => (view().scale >= 4 ? fit() : zoomAt(2, ...local(e)))}
      >
        <div ref={canvas} class="diagram-viewer-canvas" style={{ transform: `translate(${view().x}px, ${view().y}px) scale(${view().scale})` }} />
      </div>
      <footer class="diagram-viewer-hint">Ziehen oder Scrollen zum Verschieben · Pinch oder ⌘/Strg + Scrollen zum Zoomen · Doppelklick vergrößert · Esc schließt</footer>
    </ModalFrame>
  );
}

/** Floating "Vergrößern" button over the hovered diagram. */
function HoverButton() {
  const [target, setTarget] = createSignal<{ host: Element; top: number; left: number } | null>(null);
  let button: HTMLButtonElement | undefined;
  onMount(() => {
    const over = (e: MouseEvent) => {
      const node = e.target as Element | null;
      if (!node?.closest || button?.contains(node)) return;
      const host = node.closest(DIAGRAM_HOSTS);
      if (!host || !host.closest(".editor") || !host.querySelector("svg")) {
        if (target() && !target()!.host.contains(node)) setTarget(null);
        return;
      }
      show(host);
    };
    const show = (host: Element) => {
      const svg = host.querySelector("svg")?.getBoundingClientRect();
      const box = host.getBoundingClientRect();
      if (!svg || !host.isConnected || box.bottom < 40 || box.top > window.innerHeight - 40) return setTarget(null);
      setTarget({ host, top: Math.max(box.top, svg.top, 48) + 8, left: Math.min(box.right, svg.right) - 8 });
    };
    // Follow the diagram while the page scrolls instead of vanishing on any scroll event.
    const follow = () => { const t = target(); if (t) show(t.host); };
    document.addEventListener("mouseover", over);
    document.addEventListener("scroll", follow, true);
    onCleanup(() => { document.removeEventListener("mouseover", over); document.removeEventListener("scroll", follow, true); });
  });
  return (
    <Show when={target() && !diagram()}>
      <button
        ref={button}
        type="button"
        class="diagram-zoom-button"
        style={{ top: `${target()!.top}px`, left: `${target()!.left}px` }}
        title="Diagramm vergrößert anzeigen"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { const t = target(); setTarget(null); if (t) openDiagram(t.host); }}
      >⤢ Vergrößern</button>
    </Show>
  );
}

export default function DiagramViewer() {
  return <>
    <HoverButton />
    {/* Portal: an ancestor of the editor confines position:fixed; data-theme keeps the palette. */}
    <Show when={diagram()} keyed>{(d) => <Portal><div class="diagram-viewer-root" data-theme={theme()}><Viewer diagram={d} onClose={() => setDiagram(null)} /></div></Portal>}</Show>
  </>;
}
