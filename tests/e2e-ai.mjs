import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--port','1450','--host','127.0.0.1'],{stdio:'pipe'});let browser;
try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Vite timeout')),20000);server.stdout.on('data',d=>{if(String(d).includes('Local:')){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(new Error(`Vite ${code}`));});});
  try{browser=await chromium.launch();}catch{browser=await chromium.launch({channel:'chrome'});}
  const page=await browser.newPage({viewport:{width:1380,height:960}});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    let config={enabled:false,endpoint:'',protocol:'chat-completions',model:'',maxTokens:4096,rememberKey:false},hasKey=false,counter=0;
    const callbacks=new Map(),listeners=new Map(),requests=[],modelRequests=[];
    const emit=(event,payload)=>{for(const id of listeners.get(event)||[])callbacks.get(id)?.({event,payload});};window.__aiTest={requests,modelRequests,emit};
    window.__TAURI_INTERNALS__={metadata:{currentWindow:{label:'main'},currentWebview:{label:'main',windowLabel:'main'}},transformCallback(fn){const id=++counter;callbacks.set(id,fn);return id;},unregisterCallback(id){callbacks.delete(id);},convertFileSrc(path){return path;},async invoke(cmd,args){
      if(cmd==='plugin:event|listen'){const ids=listeners.get(args.event)||[];ids.push(args.handler);listeners.set(args.event,ids);return args.handler;}
      if(cmd==='load_settings')return {};if(cmd==='list_shadows'||cmd==='list_fonts')return [];
      if(cmd==='ai_status')return {config:{...config},hasKey,keychainAvailable:true};
      if(cmd==='ai_configure'){config={...args.config};hasKey=args.forgetKey?false:!!args.apiKey||hasKey;return {config:{...config},hasKey,keychainAvailable:true};}
      if(cmd==='ai_models'){modelRequests.push({protocol:args.config.protocol,endpoint:args.config.endpoint});return [{id:'model-from-service',name:'Vom Dienst geladen',outputLimit:2048}];}
      if(cmd==='ai_start'){requests.push(structuredClone(args.request));const id=args.request.id,q=args.request.messages.at(-1).content;setTimeout(()=>{emit('note-ai',{id,kind:'delta',text:q==='mermaid'?'```mermaid\nflowchart TD\n  A[Idee] --> B[Ergebnis]\n```':q==='slow'?'Begonnen …':'## Klarer denken\n\nEine Antwort genau dort, wo die Idee entsteht. 🌿'});if(q!=='slow')emit('note-ai',{id,kind:'done',text:''});},100);return;}
      if(cmd==='ai_cancel'){emit('note-ai',{id:args.id,kind:'cancelled',text:''});return;}return null;
    }};window.__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener(){}};
  });
  await page.goto('http://127.0.0.1:1450');await page.getByRole('heading',{name:'Gedanken, die etwas bewegen.'}).waitFor();
  await page.getByRole('button',{name:'KI-Anbieter einrichten'}).click();const modal=page.getByRole('dialog',{name:'KI-Plugin einrichten'});
  for(const [name,url] of [['OpenAI','https://api.openai.com/v1/responses'],['Claude','https://api.anthropic.com/v1/messages'],['Gemini','https://generativelanguage.googleapis.com/v1beta/models']]){
    await modal.getByRole('button',{name,exact:true}).click();assert.equal(await modal.getByLabel('API-Endpoint',{exact:true}).inputValue(),url);
    await modal.getByLabel('API-Key',{exact:false}).fill('test-ui-key');await modal.getByRole('button',{name:'Modelle laden'}).click();await modal.getByLabel('Verfügbare Modelle').selectOption('model-from-service');assert.equal(await modal.getByLabel('Modell-ID',{exact:true}).inputValue(),'model-from-service');
  }
  assert.equal((await page.evaluate(()=>window.__aiTest.modelRequests)).length,3);
  await modal.getByRole('button',{name:'Intern',exact:true}).click();assert.equal(await modal.getByLabel('API-Key',{exact:false}).inputValue(),'');assert.equal(await modal.getByLabel('Modell-ID',{exact:true}).inputValue(),'');
  await modal.getByLabel('API-Endpoint',{exact:true}).fill('https://internal.example/v1/chat/completions');await modal.getByLabel('Modell-ID',{exact:true}).fill('internal-model');await modal.getByLabel('KI-Assistent aktivieren').check();await modal.getByRole('button',{name:'Einstellungen speichern'}).click();await modal.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Neue Notiz aus Vorlage'}).click();await page.getByRole('menuitem',{name:/Leere Notiz/}).click();
  await page.locator('.block .rendered').first().click();
  const source=page.getByRole('textbox',{name:'Edit Markdown block'});await source.pressSequentially('/ai');
  await page.locator('.slash-item').filter({hasText:'AI · Inline schreiben'}).waitFor(); await page.keyboard.press('Enter');
  const prompt=page.getByRole('textbox',{name:'Inline KI-Prompt eingeben'});await prompt.waitFor();assert.equal(await page.locator('.ai-panel').count(),0);
  await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Inline KI-Prompt eingeben');
  await page.keyboard.type('Schreibe einen klaren Absatz.'); assert.equal(await prompt.inputValue(),'Schreibe einen klaren Absatz.');await page.getByRole('button',{name:/Generieren ↗/}).click();await page.getByRole('button',{name:'✓ Übernehmen'}).waitFor();
  let requests=await page.evaluate(()=>window.__aiTest.requests);assert.equal(requests[0].context,null);assert.equal(requests[0].messages.length,1);
  await page.getByRole('button',{name:'Source',exact:true}).click();let markdown=await page.locator('.source-full').inputValue();assert.match(markdown,/```ai/);assert.ok(!markdown.includes('Eine Antwort genau'));await page.getByRole('button',{name:'Live',exact:true}).click();
  await page.getByRole('button',{name:'✓ Übernehmen'}).click();await page.getByRole('heading',{name:'Klarer denken',exact:true}).waitFor();assert.equal(await page.locator('.inline-ai').count(),0);
  await page.evaluate(()=>window.__aiTest.emit('menu','edit.undo'));await prompt.waitFor();assert.equal(await prompt.inputValue(),'Schreibe einen klaren Absatz.');
  await page.getByLabel('Notiz als Kontext',{exact:true}).check();await prompt.fill('Mit Kontext');await prompt.press('Meta+Enter');await page.getByRole('button',{name:'✓ Übernehmen'}).waitFor();
  requests=await page.evaluate(()=>window.__aiTest.requests);assert.match(requests[1].context,/Mit Kontext/);assert.equal(requests[1].messages.length,1,'each inline generation is independent');
  await prompt.fill('Geänderter Prompt');assert.equal(await page.getByRole('button',{name:'✓ Übernehmen'}).isDisabled(),true);
  await prompt.fill('slow');await page.getByRole('button',{name:/Generieren ↗/}).click();await page.getByText('Begonnen …',{exact:true}).waitFor();await page.getByRole('button',{name:'■ Stoppen'}).click();await page.getByText(/Gestoppt · Du kannst/).waitFor();assert.equal(await page.getByRole('button',{name:'✓ Übernehmen'}).count(),0);
  await page.getByRole('button',{name:'Entwurf verwerfen'}).click();assert.equal(await page.getByLabel('KI-Entwurf',{exact:true}).count(),0);
  await prompt.fill('Verfasse einen kurzen Gedanken über fokussiertes Arbeiten.');await page.getByLabel('Notiz als Kontext',{exact:true}).uncheck();await page.getByRole('button',{name:/Generieren ↗/}).click();await page.getByRole('button',{name:'✓ Übernehmen'}).waitFor();
  await page.getByRole('tablist',{name:'Open documents'}).getByRole('tab').first().click();assert.equal(await page.locator('.inline-ai').count(),0);await page.getByRole('tablist',{name:'Open documents'}).getByRole('tab').last().click();await page.getByRole('button',{name:'✓ Übernehmen'}).waitFor();
  for(const width of [1380,900]){await page.setViewportSize({width,height:850});assert.ok(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth));assert.ok(await prompt.isVisible());}
  // Wide windows keep a small, stable left gutter in Live and Source view.
  for (const width of [1380, 2560]) {
    await page.setViewportSize({width,height:960});
    for (const mode of ['Live','Source']) {
      await page.getByRole('button',{name:mode,exact:true}).click();
      const gutter=await page.locator('.editor .page').evaluate(el=>el.getBoundingClientRect().left-document.querySelector('.main').getBoundingClientRect().left);
      assert.ok(gutter>=24&&gutter<=42,`${mode} left gutter at ${width}: ${gutter}`);
    }
  }
  await page.getByRole('button',{name:'Live',exact:true}).click();
  // Repeat actual keyboard insertion without filling/clicking the AI textarea.
  // Enter, Tab and menu click must all hand focus to the new field.
  for (const method of ['Enter','Tab','click','Enter','Tab','click']) {
    await page.getByRole('button',{name:'Neue Notiz aus Vorlage'}).click();await page.getByRole('menuitem',{name:/Leere Notiz/}).click();
    await page.locator('.block .rendered').first().click();
    await page.getByRole('textbox',{name:'Edit Markdown block'}).pressSequentially('/ai');
    const item=page.locator('.slash-item').filter({hasText:'AI · Inline schreiben'});await item.waitFor();
    if(method==='click')await item.click();else await page.keyboard.press(method);
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Inline KI-Prompt eingeben');
    await page.keyboard.type(`Direkt weiterschreiben ${method}`);
    assert.equal(await prompt.inputValue(),`Direkt weiterschreiben ${method}`);
    await page.getByRole('button',{name:'KI-Anbieter einrichten'}).click();await modal.waitFor();
    assert.ok(await modal.evaluate(el=>el.contains(document.activeElement)),'AI field must not steal focus back from settings');
    await page.getByRole('button',{name:'KI-Einstellungen schließen'}).click();
  }
  await prompt.fill('mermaid');await page.getByRole('button',{name:/Generieren ↗/}).click();await page.getByRole('button',{name:'✓ Übernehmen'}).waitFor();
  assert.match(await page.locator('.inline-ai-draft').innerText(),/```mermaid/);
  assert.equal(await page.locator('.inline-ai-result .mermaid, .inline-ai-result svg').count(),0,'AI draft remains raw text');
  assert.equal(await page.getByText('Rendering diagram...', {exact:true}).count(),0);
  await page.getByRole('button',{name:'✓ Übernehmen'}).click();await page.locator('.rendered svg').first().waitFor();
  await page.setViewportSize({width:1380,height:960});await page.screenshot({path:'release/THE Note-ai-preview.png'});
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage).includes('test-ui-key')),false);assert.deepEqual(errors,[]);
  console.log('PASS inline AI: provider presets, live model-list selection, key reset, /ai slash command, inline streaming, explicit context, independent runs, accept/undo, stale drafts, cancel/discard, tab persistence, responsive layout. Native IPC mocked.');
}finally{await browser?.close();server.kill('SIGTERM');}
