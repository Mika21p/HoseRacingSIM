const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHAIRMAN_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors = [], report = {};
  page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.goto(process.env.CHAIRMAN_TEST_URL || 'http://127.0.0.1:4173/dist/'); await page.waitForSelector('#chairmanLaunch');
    const fixture = await page.evaluate(async () => {
      const n=window.Keiba,W=n.ChairmanRules,s=await n.ChairmanStorage.open();let w=W.createWorld({seed:5701,horseCount:160,id:'feedback-browser',name:'反馈测试游戏'});
      w.races.filter(r=>r.raceClass==='op').forEach(r=>{r.raceClass='g3';r.grade='G3';});W.planEntries(w);
      await s.acquire(w.id);await s.commitChanges(null,{world:w});
      for(let i=0;i<9;i++){const out=W.advanceHalfMonth(w);await s.commitChanges(w,out);w=out.world;}
      const all=(await s.query('performances',w.id,{limit:100000})).rows;
      const current=all.filter(p=>p.priorPerformanceId&&!p.retired).sort((a,b)=>b.turn-a.turn)[0];if(!current)throw new Error('No previous-start fixture');
      const previous=all.find(p=>p.id===current.priorPerformanceId),out=await s.scoreOutput(w,previous.occurrenceId,{[previous.id]:0});await s.commitChanges(w,out);
      await s.close();return {worldId:w.id,currentId:current.id,occurrenceId:current.occurrenceId,previousId:previous.id,previousRace:previous.raceName};
    });
    const {click,submit}=require('./chairman-browser-controls').controls(page);
    await click('#chairmanLaunch');await click('[data-action=openWorld]');await click('[data-action=tab][data-id=results]');
    await click(`[data-action=result][data-id="${fixture.occurrenceId}"]`);
    const input=page.locator(`[data-performance="${fixture.currentId}"]`), row=input.locator('xpath=ancestor::tr');
    const priorText=await row.locator('.cm-previous-run').innerText();if(!priorText.includes('WTR 0')||!priorText.includes(fixture.previousRace))throw new Error('Incorrect prior-start reference: '+priorText);
    await input.fill('129');await click(`dialog [data-performance="${fixture.currentId}"] + small + button`);
    await input.fill('130');await click(`dialog tr:has([data-performance="${fixture.currentId}"]) [data-action=horse]`);await click('[data-action=dialogBack]');
    if(await input.inputValue()!=='130')throw new Error('Draft lost on horse navigation');
    await click(`dialog tr:has([data-performance="${fixture.currentId}"]) .cm-previous-run [data-action=result]`);await click('[data-action=dialogBack]');
    if(await input.inputValue()!=='130')throw new Error('Draft lost on previous-race navigation');
    await page.screenshot({path:'artifacts/feedback-score-desktop.png'});
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/feedback-score-mobile.png'});
    report.scoreMobile=await page.evaluate(()=>{const r=document.querySelector('[data-action=saveRaceScores]').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,saveBottom:r.bottom};});
    if(report.scoreMobile.overflow||report.scoreMobile.saveBottom>844)throw new Error('Mobile score controls inaccessible');
    await click('[data-action=close]');await page.reload();await page.waitForSelector('#chairmanLaunch');await click('#chairmanLaunch');await click('[data-action=openWorld]');await click('[data-action=tab][data-id=results]');await click(`[data-action=result][data-id="${fixture.occurrenceId}"]`);
    if(await input.inputValue()!=='130')throw new Error('Draft lost after reload');await click('[data-action=saveRaceScores]');await click('[data-action=close]');
    await click('[data-action=tab][data-id=horses]');await click('[data-action=editHorse]');
    await page.locator('[name=name]').fill('当前四岁测试马');await page.locator('dialog [name=age]').fill('4');
    if(await page.locator('dialog [name=birthYear]').count())throw new Error('Birth-year creation field still visible');
    await page.screenshot({path:'artifacts/feedback-horse-mobile.png'});await submit('[data-form=horse]');
    await page.setViewportSize({width:1440,height:900});await click('[data-action=tab][data-id=settings]');await click('[data-action=settingsView][data-id=saves]');
    await click('[data-action=saveSlot][data-id="1"]');await click('[data-action=confirmSaveSlot]');
    await page.screenshot({path:'artifacts/feedback-backups-desktop.png'});
    await click('[data-action=loadSlot][data-id="1"]');await click('[data-action=confirmLoadSlot]');
    report.restored=await page.evaluate(async currentId=>{const n=window.Keiba,s=await n.ChairmanStorage.open(),worlds=await s.listWorlds(),w=await s.load('feedback-browser');const h=w.horses.find(h=>h.name==='当前四岁测试马');const r={worldCount:worlds.length,id:w.id,horseAge:n.ChairmanRules.ageOf(w,h),score:(await s.get('performances',w.id,currentId)).manualRating};await s.close();return r;},fixture.currentId);
    if(report.restored.worldCount!==1||report.restored.horseAge!==4)throw new Error('Restore duplicated game or lost current age');
    await click('[data-action=tab][data-id=settings]');await click('[data-action=settingsView][data-id=saves]');await click('[data-action=lobby]');
    await click('[data-action=renameWorld]');await page.locator('[name=name]').fill('已改名游戏');await submit('[data-form=renameWorld]');
    await page.screenshot({path:'artifacts/feedback-games-desktop.png'});
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/feedback-games-mobile.png'});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile game manager overflow');
    await click('[data-action=deleteWorld]');await click('[data-action=confirmDeleteWorld]');await click('[data-action=backups]');await click('[data-action=loadSlot]');await click('[data-action=confirmLoadSlot]');
    await click('[data-action=tab][data-id=settings]');await click('[data-action=settingsView][data-id=saves]');await click('[data-action=deleteSlot]');await click('[data-action=confirmDeleteSlot]');
    report.deleted=await page.evaluate(async()=>{const s=await window.Keiba.ChairmanStorage.open(),r={worlds:(await s.listWorlds()).length,backups:(await s.slots()).length};await s.close();return r;});
    if(report.deleted.worlds!==1||report.deleted.backups!==0)throw new Error('Game/backup deletion not independent');
    report.priorWtrZero=true;report.draftNavigationAndReload=true;report.errors=errors;if(errors.length)throw new Error(errors.join('\n'));
    fs.writeFileSync('artifacts/feedback-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
