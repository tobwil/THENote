import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--port','1451','--host','127.0.0.1'],{stdio:'pipe'});let browser;
try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Vite timeout')),20000);server.stdout.on('data',d=>{if(String(d).includes('Local:')){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(new Error(`Vite ${code}`));});});
  try{browser=await chromium.launch();}catch{browser=await chromium.launch({channel:'chrome'});}
  const page=await browser.newPage({viewport:{width:1380,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.__diffTest={failSave:false,writes:[]};
    window.__TAURI_INTERNALS__={metadata:{currentWindow:{label:'main'},currentWebview:{label:'main',windowLabel:'main'}},transformCallback(){return 1;},unregisterCallback(){},convertFileSrc(path){return path;},async invoke(cmd,args){
      if(cmd==='load_settings')return {};if(cmd==='list_shadows'||cmd==='list_fonts')return [];
      if(cmd==='save_file'){if(window.__diffTest.failSave)throw new Error('Simulated write failure');window.__diffTest.writes.push(args);}
      if(cmd==='ai_status')return {config:{enabled:false,endpoint:'',protocol:'chat-completions',model:'',maxTokens:4096,rememberKey:false},hasKey:false,keychainAvailable:true};
      return null;
    }};window.__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener(){}};
  });
  await page.goto('http://127.0.0.1:1451');await page.getByRole('heading',{name:'Gedanken, die etwas bewegen.'}).waitFor();
  await page.evaluate(async()=>{const s=await import('/src/store.ts');s.openDocument('# Besprechung\n\nAlter Absatz.\n\nBleibt erhalten.','/diff-test.md');s.replaceAll('# Besprechung\n\nNeuer Absatz.\n\nBleibt erhalten.\n\nNächster Schritt.');});
  const open=()=>page.getByRole('button',{name:/± Änderungen/}).click();
  const modal=page.getByRole('dialog',{name:'Ungespeicherte Änderungen'});
  await open();await modal.waitFor();
  assert.match(await modal.locator('.changes-line.changes-removed').innerText(),/Alter Absatz/);
  assert.match(await modal.locator('.changes-line.changes-added').allTextContents().then(a=>a.join('')),/Neuer Absatz.*Nächster Schritt/s);
  assert.ok(await modal.evaluate(el=>el.contains(document.activeElement)));
  await page.screenshot({path:'release/THE Note-diff-preview.png'});
  await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});
  assert.equal(await page.getByRole('button',{name:/± Änderungen/}).evaluate(el=>el===document.activeElement),true);
  // Save failures preserve the baseline; success advances it.
  const failed=await page.evaluate(async()=>{window.__diffTest.failSave=true;try{await(await import('/src/commands.ts')).save();return false;}catch{return true;}});assert.equal(failed,true);
  await open();assert.match(await modal.locator('.changes-line.changes-removed').innerText(),/Alter Absatz/);await page.keyboard.press('Escape');
  await page.evaluate(async()=>{window.__diffTest.failSave=false;await(await import('/src/commands.ts')).save();});
  await open();await modal.getByText(/Keine Textänderungen/).waitFor();await page.keyboard.press('Escape');
  await page.evaluate(async()=>{const s=await import('/src/store.ts');s.undo();});
  await open();assert.match(await modal.locator('.changes-line.changes-added').allTextContents().then(a=>a.join('')),/Alter Absatz/);await page.keyboard.press('Escape');
  await page.evaluate(async()=>{const s=await import('/src/store.ts');s.openDocument('<script>alert("unsafe")</script>\n\nNeue Notiz.',null);s.setDocDirty(true);});
  await open();assert.equal(await modal.locator('.changes-line.changes-removed').count(),0);assert.match(await modal.innerText(),/Neue Notiz → Aktueller Entwurf/);assert.equal(await modal.locator('script').count(),0);
  for(const width of [1380,600]){await page.setViewportSize({width,height:850});assert.ok(await modal.evaluate(el=>el.getBoundingClientRect().right<=innerWidth));assert.ok(await modal.evaluate(el=>el.scrollWidth<=el.clientWidth));}
  await page.setViewportSize({width:1380,height:960});
  await page.keyboard.press('Escape');await page.evaluate(async()=>{(await import('/src/store.ts')).openDocument('',null);});await open();await modal.getByText(/Keine Textänderungen/).waitFor();
  assert.deepEqual(errors,[]);console.log('PASS diff UI: additions/deletions, focus/Escape, failed/successful save, undo after save, new note, escaped HTML and responsive layout. Native IPC mocked.');
}finally{await browser?.close();server.kill('SIGTERM');}
