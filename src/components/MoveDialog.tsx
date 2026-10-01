/**
 * "In Ordner verschieben …": pick a folder of the open notes folder for a note
 * (or a folder). The keyboard- and mouse-friendly twin of dragging a row onto
 * a folder in the sidebar.
 */
import { For, Show, createSignal } from "solid-js";
import ModalFrame from "./ModalFrame";
import { fileTree, folderName, folderPath } from "../store";
import { moveIntoFolder } from "../commands";
import type { FileNode } from "../platform";

const [moving, setMoving] = createSignal<string | null>(null);
export function openMoveDialog(path: string) { setMoving(path); }

interface Target { path: string; name: string; depth: number }
function folders(nodes: FileNode[], depth = 1): Target[] {
  return nodes.filter(node => node.is_dir).flatMap(node => [{ path: node.path, name: node.name, depth }, ...folders(node.children ?? [], depth + 1)]);
}
const sepOf = (p: string) => (p.includes("\\") && !p.includes("/") ? "\\" : "/");
const parentOf = (p: string) => p.slice(0, Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\")));
const nameOf = (p: string) => p.slice(Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\")) + 1);

function Dialog(props: { path: string; onClose: () => void }) {
  const [error, setError] = createSignal("");
  const targets = (): Target[] => [{ path: folderPath() ?? "", name: folderName() ?? "Notizen", depth: 0 }, ...folders(fileTree())];
  const blocked = (target: string) => target === parentOf(props.path) || target === props.path || target.startsWith(props.path + sepOf(props.path));
  const move = async (target: string) => {
    setError("");
    if (await moveIntoFolder(props.path, target)) props.onClose();
    else setError("Verschieben war nicht möglich.");
  };
  return (
    <div class="name-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
      <ModalFrame class="name-dialog move-dialog" label="In Ordner verschieben" onClose={props.onClose}>
        <h2>In Ordner verschieben</h2>
        <p>{nameOf(props.path)}</p>
        <div class="move-list" role="list">
          <For each={targets()}>{(target) => (
            <button type="button" role="listitem" class="move-target" disabled={blocked(target.path)} style={{ "padding-left": `${12 + target.depth * 18}px` }} onClick={() => void move(target.path)}>
              <span aria-hidden="true">{target.depth ? "▸" : "▤"}</span> {target.name}
              <Show when={target.path === parentOf(props.path)}><small> · aktueller Ort</small></Show>
            </button>
          )}</For>
        </div>
        <Show when={error()}><p class="name-error">{error()}</p></Show>
        <footer><button type="button" onClick={() => props.onClose()}>Abbrechen</button></footer>
      </ModalFrame>
    </div>
  );
}

export default function MoveDialog() {
  return <Show when={moving()} keyed>{(path) => <Dialog path={path} onClose={() => setMoving(null)} />}</Show>;
}
