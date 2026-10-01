import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window; globalThis.document = dom.window.document;
await build({stdin:{contents:'export * from "./src/store"; export * from "./src/diff";',resolveDir:process.cwd()},bundle:true,format:'esm',conditions:['browser'],outfile:'tests/.build/diff.mjs'});
const s = await import('./.build/diff.mjs');
for (const [before,after] of [['',''],['','New\n'],['Deleted\n',''],['a\nb\nc\n','a\nB\nc\n'],['x\nx\nx\n','x\ny\nx\n'],['End','End\n'],['a\r\nb\r\n','a\nb\n']]) {
  const d=s.diffLines(before,after);
  assert.equal(d.lines.filter(l=>l.kind!=='added').map(l=>l.text).join(''),before.replace(/\r\n?/g,'\n'));
  assert.equal(d.lines.filter(l=>l.kind!=='removed').map(l=>l.text).join(''),after.replace(/\r\n?/g,'\n'));
}
const edited=s.diffLines('a\nb\nc\n','a\nB\nc\n');
assert.deepEqual(edited.lines.map(l=>[l.kind,l.oldLine,l.newLine]),[['equal',1,1],['removed',2,null],['added',null,2],['equal',3,3]]);
assert.equal(s.diffHunks(edited.lines).length,1);
const long=Array.from({length:50},(_,i)=>`Line ${i}\n`).join('');
assert.equal(s.diffHunks(s.diffLines(long,long.replace('Line 2\n','Edit 2\n').replace('Line 40\n','Edit 40\n')).lines).length,2);
assert.equal(s.diffLines('a\n'.repeat(2000),'b\n'.repeat(2000)).simplified,true);
// Randomized round-trip invariants cover repeated lines and empty lines.
let seed=17;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed;};
for(let n=0;n<300;n++){
  const make=()=>Array.from({length:random()%20},()=>`${['a','b','','# h','🙂'][random()%5]}\n`).join('');
  const a=make(),b=make(),d=s.diffLines(a,b);
  assert.equal(d.lines.filter(l=>l.kind!=='added').map(l=>l.text).join(''),a);
  assert.equal(d.lines.filter(l=>l.kind!=='removed').map(l=>l.text).join(''),b);
}
const a=s.openDocument('Original','/diff-a.md');
assert.equal(s.doc.savedText,'Original\n');
s.updateBlock(0,'First edit');const saving=s.fullText();s.updateBlock(0,'During save');
const b=s.openDocument('Second','/diff-b.md');
s.markTabSaved(a,'/diff-a.md',saving);
assert.equal(s.doc.savedText,'Second\n');
s.switchTab(a);assert.equal(s.doc.savedText,'First edit\n');assert.equal(s.doc.dirty,true);
s.undo();assert.equal(s.doc.savedText,'First edit\n');
s.replaceTabDocument(b,'Reloaded','/diff-b.md',{encoding:'UTF-8',hadBom:false});
s.switchTab(b);assert.equal(s.doc.savedText,'Reloaded\n');
s.openDocument('Imported new note',null);assert.equal(s.doc.savedText,'');
s.setSavedText(null);assert.equal(s.doc.savedText,null);
s.setSavedText('Disk content');assert.equal(s.doc.savedText,'Disk content\n');
console.log('PASS diff: line reconstruction, numbering, context hunks, bounded large rewrites, 300 random cases, per-tab baselines, save races, undo, reload and new documents.');
