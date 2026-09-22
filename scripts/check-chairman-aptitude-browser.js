const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=path.resolve('dist'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'})[path.extname(target)]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),report={},errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForSelector('#chairmanLaunch');
 const wait=async()=>{await page.waitForFunction(()=>!document.querySelector('.cm-busy'));};
 const click=async sel=>{const route=sel.match(/^\[data-route=([^\]]+)\]$/);if(route){const group=await page.evaluate(id=>window.Keiba.ChairmanUI.routes.find(r=>r.id===id).group,route[1]);await page.locator('[data-action=workbenchGroup][data-id='+group+']:visible').first().click();await wait();}const l=page.locator(sel+(route?':visible':'')).first();const tab=await l.evaluate(el=>{const area=el.closest('.cm-tabs');return area&&area.hidden?Array.from(area.querySelectorAll(':scope > button')).indexOf(el):-1;});if(tab>=0){await l.locator('xpath=../preceding-sibling::label[1]/select').selectOption(String(tab));await wait();return;}const menu=l.locator('xpath=ancestor::details[contains(@class,"cm-more")][1]/summary');if(await menu.count())await menu.click();else await l.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await l.click();await wait();};
 const submit=async()=>{await page.locator('.cm-dialog .cm-sticky-actions button[type=submit],.cm-dialog .cm-sticky-actions button:not([type])').first().click();await wait();};


 await click('#chairmanLaunch');await click('[data-action=new][data-id=preset]');
 await page.locator('[name="population:japan"]').fill('24');if(await page.locator('[name=seed]').isVisible())throw Error('Advanced seed should start collapsed');
 if(!(await page.locator('[data-new-horses=japan]').innerText()).includes('6匹'))throw Error('Default annual count did not follow population');
 await page.locator('[name=worldType]').selectOption('blank');if(await page.locator('[data-reference-packs]').isVisible())throw Error('Blank world exposes region settings');
 await page.locator('[name=worldType]').selectOption('reference');
 await page.locator('[name="region:britain"]').check();if(await page.locator('[name="population:britain"]').isDisabled())throw Error('Selected region population disabled');await page.locator('[name="region:britain"]').uncheck();
 await page.screenshot({path:'artifacts/chairman-create-simple-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/chairman-create-simple-mobile.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Wizard overflows mobile');await page.setViewportSize({width:1440,height:900});
 await page.locator('[data-world-advanced] > summary').click();await page.locator('[name=seed]').fill('321');await page.locator('[name="annualTarget:japan"]').fill('6');await submit();await submit();
 const saved=async()=>page.evaluate(async()=>{const s=await window.Keiba.ChairmanStorage.open();try{const rows=await s.listWorlds();return await s.load(rows[0].id);}finally{await s.close();}});
 await click('[data-route=calendar]');await click('[data-action="world:view"][data-id=tracks]');await click('[data-action="world:track"][data-id=""]');
 if(await page.locator('.cm-dialog [name=sourceUrl]').isVisible())throw Error('Optional track details should start collapsed');
 await page.locator('.cm-dialog details').filter({has:page.locator('[name=sourceUrl]')}).locator('summary').click();
 await page.locator('[name=originalName]').fill('Starsea');await page.locator('[name=sourceUrl]').fill('https://example.com/course');
 await page.locator('.cm-dialog details').filter({has:page.locator('[name=sourceUrl]')}).locator('summary').click();
 await page.locator('.cm-dialog [name=name]').fill('星海测试马场');
 for(const [i,surface,distance,type] of [[0,'草地',1600,'burst:1'],[1,'草地',2000,'sustained:2'],[2,'泥地',1800,'attrition:2']]){
  await click('[data-action="world:addCourse"]');await page.locator(`[name="profileSurface:${i}"]`).selectOption(surface);await page.locator(`[name="profileDistance:${i}"]`).fill(String(distance));await page.locator(`[name="profileType:${i}"]`).selectOption(type);
 }
 await page.screenshot({path:'artifacts/chairman-aptitude-track-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-course-row]').first().scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/chairman-aptitude-track-mobile.png'});
 report.mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,rows:document.querySelectorAll('[data-course-row]').length}));if(report.mobile.overflow||report.mobile.rows!==3)throw Error('Mobile course form failed');
 await submit();await click('[data-action="world:confirm"]');
 let w=await saved();const track=w.tracks.find(t=>t.name==='星海测试马场');if(track.courseProfiles.length!==3)throw Error('Courses not saved');if(track.originalName!=='Starsea'||track.sourceUrl!=='https://example.com/course')throw Error('Folded metadata lost');
 await page.setViewportSize({width:1440,height:900});await click('[data-action="world:view"][data-id=races]');await click('[data-action="world:race"][data-id=""]');
 await page.locator('.cm-dialog [name=name]').fill('星海适性测试杯');await page.locator('[name=trackId]').selectOption(track.id);await page.locator('[name=distance]').fill('2000');
 if(!(await page.locator('[data-course-preview]').innerText()).includes('持久Ⅱ'))throw Error('Live course preview mismatch');
 if(await page.locator('[name=courseConfigId]').count())throw Error('Redundant route selector remains');
 await page.locator('[name=surface]').selectOption('泥地');await page.locator('[name=distance]').fill('1800');if(!(await page.locator('[data-course-preview]').innerText()).includes('消耗Ⅱ'))throw Error('Dirt preview mismatch');
 await page.locator('[name=surface]').selectOption('草地');await page.locator('[name=distance]').fill('2000');await page.screenshot({path:'artifacts/chairman-aptitude-race-desktop.png'});await submit();await click('[data-action="world:confirm"]');
 await click('[data-action="world:view"][data-id=regions]');await click(`.cm-body [data-action="world:region"][data-id="${w.regions[0].id}"]`);
 await page.locator('[name="type:burst"]').fill('0');await page.locator('[name="type:sustained"]').fill('1');await page.locator('[name="type:attrition"]').fill('0');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/chairman-aptitude-region-mobile.png'});await submit();await click('[data-action="world:confirm"]');
 await click(`.cm-body [data-action="world:populate"][data-id="${w.regions[0].id}"]`);await page.locator('[name=count]').fill('6');await submit();await click('[data-action="world:confirm"]');
 w=await saved();report.regionWeights=w.regions[0].generation.trackTypeWeights;report.newHorses=w.horses.filter(h=>h.generationVersion===2).length;if(report.newHorses!==6)throw Error('Regional generation version mismatch');
 for(const h of w.horses.filter(h=>h.generationVersion===2)){const score={'△':0,'○':1,'◎':2};if(score[h.trackAptitudes.sustained]!==Math.max(...Object.values(h.trackAptitudes).map(g=>score[g])))throw Error('Regional bias not applied');}
 // Exercise actual annual breeding and snapshot storage in a separate disposable world.
 report.breeding=await page.evaluate(async source=>{
  const n=window.Keiba,V=n.ChairmanWorld,B=n.ChairmanBreeding,W=n.ChairmanRules,s=await n.ChairmanStorage.open();
  try{
   const world=W.clone(source);world.id='aptitude-browser-birth';world.name='适性后代验收';
   const [f,m]=W.seeded(world,()=>['牡马','牝马'].map(gender=>W.addHorse(world,{gender,age:10,homeRegion:world.regions[0].name})));
   for(const h of [f,m]){h.status='retired';h.breeding.status='active';h.breeding.pinned=true;}
   world.breeding.manual=[{fatherId:f.id,motherId:m.id,homeRegion:world.regions[0].name}];
   world.turn=23;world.phase='yearEnd';for(const h of world.horses)h.booked=null;
   const out=W.finishYear(world),event=out.breedingEvents.find(p=>p.fatherId===f.id&&p.motherId===m.id);if(!event)throw Error('No paired offspring');
   const child=out.world.horses.find(h=>h.id===event.horseId);
   const replay=W.finishYear(world),again=replay.world.horses.find(h=>h.id===event.horseId);if(JSON.stringify(child.trackAptitudes)!==JSON.stringify(again.trackAptitudes))throw Error('Birth replay differs');
   await s.acquire(world.id);await s.commitChanges(null,out);const read=await s.load(world.id),reloaded=read.horses.find(h=>h.id===child.id);
   if(JSON.stringify(reloaded.surfaceGrades)!==JSON.stringify(child.surfaceGrades)||JSON.stringify(reloaded.trackAptitudes)!==JSON.stringify(child.trackAptitudes))throw Error('Birth save mismatch');
   s.validateSnapshot(await s.exportWorld(world.id));return {saved:true,surfaceGrades:child.surfaceGrades,trackAptitudes:child.trackAptitudes};
  }finally{await s.close();}
 },w);
 await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForSelector('#chairmanLaunch');await click('#chairmanLaunch');await click(`[data-action=openWorld][data-id="${w.id}"]`);await click('[data-route=calendar]');await click('[data-action="world:view"][data-id=tracks]');await click(`[data-action="world:track"][data-id="${track.id}"]`);
 if(await page.locator('[data-course-row]').count()!==3)throw Error('Reload lost course rows');if(await page.locator('[name=originalName]').inputValue()!=='Starsea'||await page.locator('[name=sourceUrl]').isVisible())throw Error('Reloaded metadata or fold state incorrect');
 await click('[data-action="world:removeCourse"]');await click('[data-action="world:configureCourse"][data-id="草地:1600"]');if(await page.locator('[data-course-row]').count()!==3)throw Error('Remove/re-add failed');
 await click('[data-action=close]');report.reload=true;report.errors=errors;if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync('artifacts/chairman-aptitude-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
