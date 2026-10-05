import ModalFrame from "./ModalFrame";
import { Show, createSignal } from "solid-js";
import { getSetting, setSetting } from "../settings";

/** What an export should contain. */
export interface ExportOptions { images: boolean; outline: boolean }
interface Request { format: "html" | "pdf" | "docx" | "other"; images: number; resolve: (v: ExportOptions | null) => void }

const [request, setRequest] = createSignal<Request | null>(null);

const TITLES: Record<Request["format"], string> = { html: "Als HTML exportieren", pdf: "Als PDF exportieren", docx: "Als Word exportieren", other: "Exportieren" };

/**
 * Ask what goes into the export: pictures (when the note has any) and, for HTML,
 * the outline sidebar. The last choice is remembered. Resolves null when cancelled.
 */
export function askExportOptions(format: Request["format"], images: number): Promise<ExportOptions | null> {
  return new Promise((resolve) => setRequest({ format, images, resolve }));
}

function Dialog(props: { request: Request }) {
  const [images, setImages] = createSignal(getSetting("exportImages", true));
  const [outline, setOutline] = createSignal(getSetting("exportOutline", true));
  const finish = (ok: boolean) => {
    setRequest(null);
    if (!ok) return props.request.resolve(null);
    void setSetting("exportImages", images());
    if (props.request.format === "html") void setSetting("exportOutline", outline());
    props.request.resolve({ images: props.request.images > 0 && images(), outline: props.request.format === "html" && outline() });
  };
  return (
    <div class="about-backdrop" onMouseDown={(e) => e.target === e.currentTarget && finish(false)}>
      <ModalFrame class="export-dialog" label={TITLES[props.request.format]} onClose={() => finish(false)}>
        <h3>{TITLES[props.request.format]}</h3>
        <div class="export-options">
          <Show when={props.request.images > 0}>
            <label><input type="checkbox" checked={images()} onChange={(e) => setImages(e.currentTarget.checked)} />
              <span><b>Bilder mitnehmen</b><small>{props.request.images === 1 ? "1 Bild" : `${props.request.images} Bilder`} {props.request.format === "docx" ? "kommen ins Dokument" : "werden in die Datei eingebettet"}. Ohne Bilder bleibt nur der Text.</small></span></label>
          </Show>
          <Show when={props.request.format === "html"}>
            <label><input type="checkbox" checked={outline()} onChange={(e) => setOutline(e.currentTarget.checked)} />
              <span><b>Inhaltsverzeichnis</b><small>Die Überschriften als Seitenleiste neben dem Text.</small></span></label>
          </Show>
        </div>
        <div class="export-dialog-actions">
          <button class="ghost-btn" onClick={() => finish(false)}>Abbrechen</button>
          <button class="ghost-btn primary" onClick={() => finish(true)}>Exportieren …</button>
        </div>
      </ModalFrame>
    </div>
  );
}

export default function ExportHtmlDialog() {
  return <Show when={request()} keyed>{(r) => <Dialog request={r} />}</Show>;
}
