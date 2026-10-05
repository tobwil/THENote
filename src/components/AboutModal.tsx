import ModalFrame from './ModalFrame';
import { Show, createSignal } from 'solid-js';
import { openExternal } from '../platform';
import appIcon from '../../src-tauri/icons/128x128.png';
const [visible, setVisible] = createSignal(false);
export function openAbout() { setVisible(true); }
export default function AboutModal() {
  const close = () => setVisible(false);
  return <Show when={visible()}><div class="about-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><ModalFrame class="about" label="Über THE Note" onClose={close}>
    <button class="about-close" aria-label="Schließen" onClick={close}>×</button>
    <img class="about-mark" src={appIcon} alt="THE Note" width="68" height="68" />
    <h2 class="about-name">THE Note</h2><div class="about-version">v0.2.9 · Preview</div>
    <p class="about-tagline">Ein ruhiger Ort für Gedanken, die etwas bewegen.</p>
    <div class="about-links"><button class="about-link" onClick={() => void openExternal('https://github.com/solancer/sarala')}>Sarala · Editor</button><button class="about-link" onClick={() => void openExternal('https://github.com/ledgesh/ledge')}>Ledge · Runbooks</button></div>
    <div class="about-meta"><p>Basierend auf Sarala von Srinivas Gowda (GPL-3.0-or-later) und dem Frontmatter-Modell von Ledge (Apache-2.0).</p><p>THE Note wird unter GPL-3.0-or-later bereitgestellt. Hinweise und Original-Lizenzen liegen im Quellcode.</p></div>
  </ModalFrame></div></Show>;
}
