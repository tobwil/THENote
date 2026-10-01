import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--port','1452','--host','127.0.0.1'],{stdio:'pipe'});let browser;
try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Vite timeout')),20000);server.stdout.on('data',d=>{if(String(d).includes('Local:')){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(new Error(`Vite ${code}`));});});
  try{browser=await chromium.launch();}catch{browser=await chromium.launch({channel:'chrome'});}
  const page=await browser.newPage({viewport:{width:1380,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const files=new Map(),folders=new Set(['/work','/docs','/docs/THE Note']),calls=[];window.__workspaceTest={files,folders,calls};
    const tree=path=>[...folders].filter(p=>p!==path&&p.slice(0,p.lastIndexOf('/'))===path).map(p=>({name:p.split('/').pop(),path:p,is_dir:true,children:tree(p)})).concat([...files.keys()].filter(p=>p.slice(0,p.lastIndexOf('/'))===path).map(p=>({name:p.split('/').pop(),path:p,is_dir:false})));
    window.__TAURI_INTERNALS__={metadata:{currentWindow:{label:'main'},currentWebview:{label:'main',windowLabel:'main'}},transformCallback(){return 1;},unregisterCallback(){},convertFileSrc(path){return path;},async invoke(cmd,args){
      calls.push([cmd,args]);
      if(cmd==='load_settings')return JSON.parse(localStorage.getItem('mockSettings')||'{}');if(cmd==='save_settings'){localStorage.setItem('mockSettings',JSON.stringify(args.value));return;}
      if(cmd==='plugin:path|resolve_directory')return '/docs';if(cmd==='plugin:path|join')return args.paths.join('/');if(cmd==='list_shadows'||cmd==='list_fonts')return [];
      if(cmd==='plugin:dialog|open')return '/work';
      if(cmd==='plugin:dialog|save')return args.options.defaultPath;
      if(cmd==='create_entry'){const path=args.parent+'/'+args.name;if(files.has(path)||folders.has(path))throw 'Existiert bereits';if(args.directory)folders.add(path);else files.set(path,'');return path;}
      if(cmd==='list_dir')return tree(args.path);
      if(cmd==='path_exists')return files.has(args.path)||folders.has(args.path);
      if(cmd==='read_file_encoded')return {content:files.get(args.path),encoding:'UTF-8',had_bom:false,lossy:false};
      if(cmd==='rename_file'){if(files.has(args.to)||folders.has(args.to))throw 'Existiert bereits';if(folders.has(args.from)){folders.delete(args.from);folders.add(args.to);return;}files.set(args.to,files.get(args.from));files.delete(args.from);return;}
      if(cmd==='save_file'){files.set(args.path,args.contents);return;}
      if(cmd==='ai_status')return {config:{enabled:false,endpoint:'',protocol:'chat-completions',model:'',maxTokens:4096,rememberKey:false},hasKey:false,keychainAvailable:true};return null;
    }};window.__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener(){}};
  });
  await page.goto('http://127.0.0.1:1452');await page.getByRole('heading',{name:'Gedanken, die etwas bewegen.'}).waitFor();
  const fillName=async(title,name)=>{const dialog=page.getByRole('dialog',{name:title,exact:true});await dialog.getByLabel('Name',{exact:true}).fill(name);await dialog.getByRole('button',{name:'Bestätigen'}).click();await dialog.waitFor({state:'hidden'});};
  // No "project" step: with nothing open, ＋ Ordner sets up Documents/THE Note and asks for the folder name.
  assert.equal(await page.locator('.side-ws-name').innerText(),'Kein Ordner offen');
  await page.getByRole('button',{name:'＋ Ordner',exact:true}).click();await fillName('Ordner erstellen','Rezepte');
  assert.equal(await page.locator('.side-ws-name').innerText(),'THE Note');
  const folder=page.getByRole('treeitem',{name:'Rezepte',exact:true});await folder.waitFor();
  await folder.click({button:'right'});await page.getByText('Unterordner erstellen …',{exact:true}).click();await fillName('Ordner erstellen','Süß');
  const nested=page.getByRole('treeitem',{name:'Süß',exact:true});await nested.waitFor();await nested.click({button:'right'});await page.getByText('Neue Notiz hier …',{exact:true}).click();await fillName('Neue Notiz','Apfelkuchen');
  const path='/docs/THE Note/Rezepte/Süß/Apfelkuchen.md';
  assert.equal(await page.evaluate(p=>window.__workspaceTest.files.has(p),path),true);
  await page.getByRole('button',{name:'Source',exact:true}).click();await page.locator('.source-full').fill('Ungespeicherter Text');
  await page.getByRole('tab',{name:'Apfelkuchen.md Unsaved changes',exact:true}).dblclick();await fillName('Datei umbenennen','Birnenkuchen');
  assert.equal(await page.locator('.source-full').inputValue(),'Ungespeicherter Text\n');
  assert.equal(await page.evaluate(()=>window.__workspaceTest.files.get('/docs/THE Note/Rezepte/Süß/Birnenkuchen.md')),'','rename does not save buffer');
  await page.evaluate(async()=>{const s=await import('/src/store.ts');s.undo();});assert.equal((await page.locator('.source-full').inputValue()).trim(),'');
  await page.evaluate(async()=>{const s=await import('/src/store.ts');s.redo();});assert.match(await page.locator('.source-full').inputValue(),/Ungespeicherter Text/);
  // Existing names fail without losing the requested name or closing the dialog.
  await page.evaluate(()=>window.__workspaceTest.files.set('/docs/THE Note/Rezepte/Süß/Vorhanden.md','Keep'));
  await page.getByRole('tab',{name:'Birnenkuchen.md Unsaved changes',exact:true}).click({button:'right'});
  const rename=page.getByRole('dialog',{name:'Datei umbenennen'});await rename.getByLabel('Name',{exact:true}).fill('Vorhanden');await rename.getByRole('button',{name:'Bestätigen'}).click();await rename.getByRole('alert').waitFor();await rename.getByRole('button',{name:'Abbrechen'}).click();
  // Scratch tabs can be named before first save; the chosen name survives switching.
  await page.getByRole('button',{name:'New tab',exact:true}).click();const scratch=page.getByRole('tab',{name:'Untitled.md',exact:true}).last();await scratch.press('F2');await fillName('Datei umbenennen','Gedanken');await page.getByRole('tab',{name:'Gedanken.md Unsaved changes',exact:true}).waitFor();
  await page.getByRole('button',{name:'Speichern ⌘S',exact:true}).click();await page.getByRole('tab',{name:'Gedanken.md',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__workspaceTest.files.has('/docs/THE Note/Gedanken.md')),true);
  // Group notes: move one with "In Ordner verschieben …", drag another onto a folder; open tabs follow.
  await page.getByRole('button',{name:'＋ Notiz',exact:true}).click();await fillName('Neue Notiz','Meeting');
  await page.evaluate(async()=>{(await import('/src/commands.ts')).refreshTree();});
  await page.getByRole('treeitem',{name:'Meeting.md',exact:true}).click({button:'right'});await page.getByText('In Ordner verschieben …',{exact:true}).click();
  const move=page.getByRole('dialog',{name:'In Ordner verschieben'});await move.getByRole('listitem').filter({hasText:'Rezepte'}).first().click();await move.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>window.__workspaceTest.files.has('/docs/THE Note/Rezepte/Meeting.md')),true,'moved through the dialog');
  assert.equal(await page.evaluate(async()=>(await import('/src/store.ts')).doc.filePath),'/docs/THE Note/Rezepte/Meeting.md','open tab follows the move');
  const source=await page.getByRole('treeitem',{name:'Gedanken.md',exact:true}).boundingBox(),target=await page.getByRole('treeitem',{name:'Rezepte',exact:true}).boundingBox();
  await page.mouse.move(source.x+20,source.y+source.height/2);await page.mouse.down();await page.mouse.move(source.x+30,source.y-4,{steps:3});await page.mouse.move(target.x+30,target.y+target.height/2,{steps:6});
  assert.ok(await page.getByRole('treeitem',{name:'Rezepte',exact:true}).evaluate(el=>el.classList.contains('drop-target')),'folder highlights as drop target');
  await page.mouse.up();
  await page.waitForFunction(()=>window.__workspaceTest.files.has('/docs/THE Note/Rezepte/Gedanken.md'));
  // /date inserts at the typed position and keeps text on both sides.
  await page.getByRole('button',{name:'New tab',exact:true}).click();await page.locator('.block .rendered').first().click();
  await page.getByRole('textbox',{name:'Edit Markdown block'}).pressSequentially('Termin: /date');await page.locator('.slash-item').filter({hasText:'Datum einfügen'}).waitFor();await page.keyboard.press('Enter');
  const picker=page.getByRole('dialog',{name:'Datum einfügen'});await picker.waitFor();await picker.getByLabel('Datum',{exact:true}).fill('2026-12-24');await picker.getByRole('button',{name:'Einfügen',exact:true}).click();await picker.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Source',exact:true}).click();assert.equal((await page.locator('.source-full').inputValue()).trim(),'Termin: 24.12.2026');
  await page.evaluate(async()=>{(await import('/src/store.ts')).undo();});assert.equal((await page.locator('.source-full').inputValue()).trim(),'Termin:');
  await page.getByRole('button',{name:'Live',exact:true}).click();await page.locator('.block .rendered').first().click();await page.getByRole('textbox',{name:'Edit Markdown block'}).press('End');await page.keyboard.type('/date');await page.locator('.slash-item').filter({hasText:'Datum einfügen'}).waitFor();await page.keyboard.press('Enter');await picker.waitFor();await page.screenshot({path:'release/THE Note-workspace-preview.png'});await page.keyboard.press('Escape');await picker.waitFor({state:'hidden'});
  // The notes folder is remembered across restarts and can always be closed again.
  await page.reload();await page.getByRole('heading',{name:'Gedanken, die etwas bewegen.'}).waitFor();
  await page.locator('.side-ws-name',{hasText:'THE Note'}).waitFor();
  await page.getByRole('button',{name:'Ordner schließen',exact:true}).click();
  assert.equal(await page.locator('.side-ws-name').innerText(),'Kein Ordner offen');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mockSettings')).workspace===null,null,{timeout:3000});// closing forgets the folder (settings write is debounced)
  assert.deepEqual(errors,[]);console.log('PASS workspace UI: default notes folder, nested empty folders, move via dialog and drag, remember/close folder, notes, tab rename, unsaved text/undo preservation, collision handling, scratch naming/save, inline /date selection/undo/cancel. Native IPC mocked.');
}finally{await browser?.close();server.kill('SIGTERM');}
