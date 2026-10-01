import { Show, createSignal } from 'solid-js';
import { activeTabId, doc, targetBlockIndex, updateBlock, setActive, requestCaret } from '../store';
import { getActiveBlockApi } from '../commands';
import ModalFrame from './ModalFrame';

interface Anchor { tab: number; block: number; text: string; offset: number; left: number; top: number }
const [anchor, setAnchor] = createSignal<Anchor | null>(null);
const localDate = (offset = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function openDatePicker() {
  const index = targetBlockIndex(), block = doc.blocks[index];
  if (!block) return;
  const range = window.getSelection();
  const rect = range?.rangeCount ? range.getRangeAt(0).getBoundingClientRect() : null;
  const el = document.querySelectorAll('.editor .page > .block')[index];
  const position = rect?.height ? rect : el?.getBoundingClientRect();
  setAnchor({ tab: activeTabId(), block: block.id, text: block.text, offset: getActiveBlockApi()?.caretOffset() ?? block.text.length,
    left: Math.max(12, Math.min(position?.left ?? 280, window.innerWidth - 332)),
    top: Math.max(12, Math.min((position?.bottom ?? 200) + 8, window.innerHeight - 350)) });
}
function Picker(props: { anchor: Anchor }) {
  const [date, setDate] = createSignal(localDate());
  const [format, setFormat] = createSignal('de');
  const [error, setError] = createSignal('');
  const close = () => setAnchor(null);
  const insert = (e: SubmitEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date())) return;
    const a = props.anchor, index = doc.blocks.findIndex(b => b.id === a.block);
    if (a.tab !== activeTabId() || index < 0 || doc.blocks[index].text !== a.text) { setError('Die Einfügestelle hat sich geändert. Bitte öffne /date erneut.'); return; }
    const [year, month, day] = date().split('-');
    const text = format() === 'iso' ? date() : `${day}.${month}.${year}`;
    close();
    requestCaret(a.offset + text.length);
    updateBlock(index, a.text.slice(0, a.offset) + text + a.text.slice(a.offset), false);
    setActive(index);
  };
  return <div class="date-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><div class="date-position" style={{left:`${props.anchor.left}px`,top:`${props.anchor.top}px`}}><ModalFrame class="date-picker" label="Datum einfügen" onClose={close}>
    <form onSubmit={insert}><h3>Datum einfügen</h3><label>Datum<input type="date" value={date()} onInput={e => setDate(e.currentTarget.value)} required /></label><div class="date-shortcuts"><button type="button" onClick={() => setDate(localDate())}>Heute</button><button type="button" onClick={() => setDate(localDate(1))}>Morgen</button></div><label>Format<select value={format()} onChange={e => setFormat(e.currentTarget.value)}><option value="de">TT.MM.JJJJ</option><option value="iso">JJJJ-MM-TT</option></select></label><Show when={error()}><p role="alert">{error()}</p></Show><footer><button type="button" onClick={close}>Abbrechen</button><button type="submit" class="name-primary">Einfügen</button></footer></form>
  </ModalFrame></div></div>;
}
export default function DatePicker() { return <Show when={anchor()} keyed>{a => <Picker anchor={a} />}</Show>; }
