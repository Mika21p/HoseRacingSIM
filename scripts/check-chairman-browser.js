// Run with Playwright available on NODE_PATH; uses an isolated browser context.
const { chromium } = require('playwright');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHAIRMAN_TEST_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:900}}), errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  try{
    await page.goto(process.env.CHAIRMAN_TEST_URL||'http://127.0.0.1:4173/dist/');await page.waitForSelector('#chairmanLaunch');
    const fixture=await page.evaluate(async()=>{
      const n=window.Keiba,W=n.ChairmanRules,store=await n.ChairmanStorage.open();
      let w=W.createWorld({seed:98765,horseCount:32,id:'browser-ratings-check'});
      w.races.forEach(r=>r.deleted=true);const r=w.races.find(r=>r.raceClass==='g1');Object.assign(r,{deleted:false,month:1,half:1,ageRule:'2+',sexRule:'all',capacity:16});
      const region=w.tracks.find(t=>t.id===r.trackId).region;
      w.horses.forEach(h=>{h.homeRegion=region;h.locationRegion=region;h.booked=null;});W.planEntries(w);
      await store.acquire(w.id);await store.commitChanges(null,{world:w});const out=W.advanceHalfMonth(w);await store.commitChanges(w,out);await store.close();
      return {id:w.id,race:out.occurrences.find(r=>r.status==='completed').id};
    });
    const click=async(selector)=>{await page.locator(selector).first().click();await page.waitForFunction(()=>!document.querySelector('.cm-busy'));};
    await click('#chairmanLaunch');await click(`[data-action=openWorld][data-id="${fixture.id}"]`);
    await click('[data-action=tab][data-id=results]');await click('[data-action=result]');
    await click('[data-action=defaultWtrDraft]');await page.locator('[data-performance]').first().fill('128.5');
    await click('[data-action=saveRaceScores]');
    const saved=await page.evaluate(async({id,race})=>{const s=await window.Keiba.ChairmanStorage.open();const rows=await s.query('performances',id,{occurrenceId:race});await s.close();return rows.rows.map(p=>p.manualRating);},fixture);
    if(saved[0]!==128.5)throw new Error('Browser WTR save failed');
    await page.screenshot({path:'artifacts/ratings-desktop.png',fullPage:true});
    const report={errors,savedCount:saved.filter(v=>v!=null).length,desktop:await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,rows:document.querySelectorAll('.cm-score-table tbody tr').length}))};
    await page.setViewportSize({width:390,height:844});
    report.mobile=await page.evaluate(()=>{const input=document.querySelector('[data-performance]'),save=document.querySelector('[data-action=saveRaceScores]');return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,inputVisible:!!input&&getComputedStyle(input.closest('td')).display!=='none',saveBottom:save.getBoundingClientRect().bottom};});
    await page.screenshot({path:'artifacts/ratings-mobile.png',fullPage:true});
    if(report.mobile.scrollWidth>390||!report.mobile.inputVisible||report.mobile.saveBottom>844)throw new Error('Mobile scoring overflow or inaccessible input/save');
    await click('[data-action=close]');
    for(const id of ['horses','calendar','boards','settings']){await click(`[data-action=tab][data-id=${id}]`);const over=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(over)throw new Error(`Mobile overflow: ${id}`);}
    await page.reload();await page.waitForSelector('#chairmanLaunch');await click('#chairmanLaunch');await click(`[data-action=openWorld][data-id="${fixture.id}"]`);await click('[data-action=tab][data-id=results]');await click('[data-action=result]');
    if(await page.locator('[data-performance]').first().inputValue()!=='128.5')throw new Error('Rating was not restored after reload');
    report.reload=true;
    await click('[data-action=close]');
    await page.locator('[data-form=officeFilter]').evaluate(form=>{
      form.elements.search.value='保留筛选测试';form.elements.scoring.value='none';form.elements.year.value='1';
      [...form.elements.region.options].forEach(o=>o.selected=['日本','美国'].includes(o.value));
      form.elements.latest.checked=false;form.requestSubmit();
    });await page.waitForFunction(()=>!document.querySelector('.cm-busy'));
    const readFilters=()=>page.evaluate(async id=>{const s=await window.Keiba.ChairmanStorage.open();const value=(await s.load(id)).ui.results;await s.close();return value;},fixture.id);
    const filters=await readFilters();await click('[data-action=advance]');
    if(JSON.stringify(await readFilters())!==JSON.stringify(filters))throw new Error('Advancing replaced saved result filters');
    await page.reload();await page.waitForSelector('#chairmanLaunch');await click('#chairmanLaunch');await click(`[data-action=openWorld][data-id="${fixture.id}"]`);await click('[data-action=tab][data-id=results]');
    if(await page.locator('[name=search]').inputValue()!=='保留筛选测试'||await page.locator('[name=latest]').isChecked())throw new Error('Filters were not restored after reload');
    report.filtersPreserved=true;if(errors.length)throw new Error(errors.join('\n'));fs.writeFileSync('artifacts/ratings-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
