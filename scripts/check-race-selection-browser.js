const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('dist'),server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],report={};page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.locator('#homeStartBtn').click();await page.locator('#horseNameInput').fill('报名界面验证');await page.locator('#generateBtn').click();
  // Test-owned save: a mature G1 winner exposes a full international calendar.
  const fixture=await page.evaluate(()=>{const save=JSON.parse(localStorage.getItem('keiba-career-save-v1'));const n=window.Keiba,c=save.state.career;c.debutLock=null;c.currentTime=n.TimeRules.fromIndex(n.TimeRules.toIndex(4,1,1));c.maturity.lastCheckedIndex=c.currentTime.index;
   const race=n.Races.find(r=>r.id==='japan-cup'),record=n.RaceRules.simulateRace(c.horse,race,{currentTime:c.currentTime});record.public.rank=1;record.public.rankLabel='一着';record.public.retired=false;c.races=[record];save.state.filters={};return save;});
  await page.addInitScript(save=>{if(!sessionStorage.getItem('registrationFixture')){localStorage.setItem('keiba-career-save-v1',JSON.stringify(save));sessionStorage.setItem('registrationFixture','1');}},fixture);
  await page.reload();await page.locator('#homeContinueBtn').click();await page.locator('.rs-entry').first().waitFor();
  report.actualAge=await page.evaluate(()=>JSON.parse(localStorage.getItem('keiba-career-save-v1')).state.career.currentTime.age);assert.equal(report.actualAge,4);
  report.available=await page.locator('.rs-entry').count();assert.ok(report.available>=50,'Need >=50 real plans: '+JSON.stringify({count:report.available,errors,panel:await page.locator('#racePanel').innerText()}));assert.equal(await page.locator('#registerRaceBtn').count(),0);
  await page.locator('#raceMoreFilters > summary').click();assert.equal(await page.locator('[data-track-option]').count(),0);assert.ok(await page.locator('.rs-filter-disabled').isVisible());
  await page.locator('[data-race-filter-group=region] > summary').click();await page.locator('[data-race-filter=region][value=japan]').check();
  await page.locator('[data-race-filter-group=track] > summary').click();await page.locator('#raceTrackSearch').fill('东京');assert.ok(await page.locator('[data-track-option]:visible').count()>0);await page.locator('[data-race-filter=track]:visible').first().check();
  assert.ok((await page.locator('.rs-venue').allTextContents()).every(t=>t.includes('东京')));
  await page.locator('#clearAllRaceFiltersBtn').click();assert.equal(await page.locator('[data-track-option]').count(),0);
  await page.locator('#raceMoreFilters > summary').click();
  await page.locator('.rs-month[open] [data-race-pick]').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#registerRaceBtn').count(),1);assert.equal(await page.locator('#raceSelectionDetail').count(),1);
  await page.locator('#racePanel').screenshot({path:'artifacts/registration-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.locator('#racePanel').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/registration-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const selected=await page.locator('#raceSelectionDetail h3').textContent();await page.locator('#registerRaceBtn').click();assert.ok(await page.locator('.scheduled-race').isVisible());
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('keiba-career-save-v1')).state.career.scheduledRace);assert.ok(before.race.venueDisplay.label);report.registered=selected;
  await page.reload();await page.locator('#homeContinueBtn').click();const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('keiba-career-save-v1')).state.career.scheduledRace);assert.deepEqual(after,before);
  await page.locator('#cancelRegistrationBtn').click();assert.equal(await page.locator('#registerRaceBtn').count(),0);report.saveReloadCancel=true;
  report.modePreviews=await page.evaluate(fixture=>{const n=window.Keiba,rows={};for(const gameMode of ['normal','legend','roguelike']){const career=structuredClone(fixture.state.career);career.gameMode=gameMode;career.horse.gameMode=gameMode;const host=document.createElement('div');n.Random.withSource(()=>{throw Error('Preview must not draw randomness');},()=>n.UI.renderRaceSelector(host,career,{}, {selection:{}}));rows[gameMode]=host.querySelectorAll('.rs-entry').length;}return rows;},fixture);
  assert.ok(Object.values(report.modePreviews).every(count=>count>=50));
  // Visual long-name fixture, using the same real calendar and renderer at mobile width.
  await page.evaluate(fixture=>{const n=window.Keiba,career=fixture.state.career,plans=n.TimeRules.getAvailableRacePlans(career,n.Races),p=plans.find(p=>p.race.surfaceRegion==='美国'&&n.RaceSelection.venue(p.race).name.length>12);const ui={selected:n.RaceSelection.key(p),revealSelection:true};document.getElementById('racePanel').innerHTML=n.RaceSelection.render(plans,{},ui,career,r=>r.nameOriginal||r.name);document.querySelector('[data-race-pick][aria-expanded=true]').scrollIntoView({block:'center'});},fixture);
  await page.screenshot({path:'artifacts/registration-mobile-long-name.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync('artifacts/registration-browser-report.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
