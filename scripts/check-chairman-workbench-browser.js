const fs=require('node:fs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHAIRMAN_TEST_CHROME});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage(),errors=[],report={widths:{}};
 p.on('pageerror',e=>errors.push(e.message));
 const out='artifacts/chairman-workbench';fs.mkdirSync(out,{recursive:true});
 const wait=()=>p.waitForFunction(()=>!document.querySelector('.cm-busy'));
 const click=async sel=>{await p.locator(sel).filter({visible:true}).first().click();await wait();};
 const nav=async id=>{
   const route=await p.evaluate(id=>Keiba.ChairmanUI.routes.find(r=>r.id===id),id);
   const mobile=p.viewportSize().width<1024;
   await click(`${mobile?'.cm-bottom-nav':'.cm-sidebar'} [data-action=workbenchGroup][data-id=${route.group}]`);
   if(mobile){await click('.cm-page-switch summary');await click(`.cm-floating-menu [data-route=${id}]`);}else await click(`.cm-sidebar [data-route=${id}]`);
   await p.evaluate(()=>scrollTo(0,0));
 };
 try{
  await p.goto(process.env.CHAIRMAN_TEST_URL||'http://127.0.0.1:8765/');await p.waitForSelector('#chairmanLaunch');
  await p.evaluate(async()=>{
    const W=Keiba.ChairmanRules,s=await Keiba.ChairmanStorage.open();let w=W.createWorld({id:'workbench-test',name:'暮色国际马会 · 很长的游戏名称验证',horseCount:180,breeding:true,seed:5701});
    w.races.filter(r=>r.month===1&&r.half===1).forEach(r=>{r.raceClass='g3';r.grade='G3';});W.seeded(w,()=>W.addHorse(w,{origin:'custom',name:'位置稳定测试马',age:3,homeRegion:'日本'}));W.planEntries(w);
    await s.acquire(w.id);await s.commitChanges(null,{world:w});const next=W.advanceHalfMonth(w);await s.commitChanges(w,next);await s.close();
  });
  await click('#chairmanLaunch');await click('[data-action=openWorld]');
  const ids=await p.evaluate(()=>Keiba.ChairmanUI.routes.map(r=>r.id));
  for(const width of [1440,1024,768,390,320]){
    await p.setViewportSize({width,height:width<768?844:1000});report.widths[width]=[];
    for(const id of ids){await nav(id);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} ${id} overflow`);assert.equal(await p.locator('.cm-page-heading h1').isVisible(),true);report.widths[width].push(id);}
    await nav('horses');await p.screenshot({path:`${out}/horses-${width}.png`});
  }
  await p.setViewportSize({width:1440,height:1000});await nav('horses');await click('.cm-mobile-filters');
  await p.locator('.cm-multi[data-field=gender] input').first().check();await p.locator('.cm-multi[data-field=region] input').first().check();
  assert.match(await p.locator('.cm-filter-state').innerText(),/待应用/);
  await nav('calendar');await nav('horses');assert.equal(await p.locator('.cm-multi[data-field=gender] input').first().isChecked(),true);
  await click('.cm-apply-filter');assert.equal(await p.evaluate(()=>document.activeElement.classList.contains('cm-apply-filter')),true);
  await click('[data-filter-reset]');await click('.cm-apply-filter');await click('.cm-mobile-filters');
  await p.screenshot({path:`out/horses-desktop.png`.replace('out/',out+'/')});
  const customId=await p.evaluate(async()=>{const s=await Keiba.ChairmanStorage.open(),w=await s.load('workbench-test');await s.close();return w.horses.find(h=>h.name==='位置稳定测试马').id;});await p.evaluate(id=>Keiba.ChairmanApp.horseDetail(id),customId);
  const before=await p.locator('.cm-dialog').boundingBox();
  const details=p.locator('dialog details').filter({has:p.locator('summary', {hasText:'自建参数'})});assert.equal(await details.count(),1);await details.locator('summary').click();
  const after=await p.locator('.cm-dialog').boundingBox();assert.ok(Math.abs(before.y-after.y)<=1);report.dialogTopDelta=Math.abs(before.y-after.y);
  await click('dialog .cm-more summary');let bounds=await p.locator('.cm-floating-menu').boundingBox();assert.ok(bounds.x>=8&&bounds.x+bounds.width<=1440-8);await p.keyboard.press('Escape');assert.equal(await p.locator('.cm-floating-menu').count(),0);
  await click('dialog [data-action=close]');
  await nav('results');await click('.cm-body [data-action=result]');
  await p.screenshot({path:`${out}/scores-desktop.png`});
  const input=p.locator('[data-performance]').first();await input.fill('136');await p.waitForTimeout(800);await wait();assert.match(await p.locator('.cm-draft-state').innerText(),/草稿已保存/);
  await click('dialog [data-action=close]');await click('.cm-body [data-action=result]');assert.equal(await input.inputValue(),'136');
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:`${out}/scores-mobile.png`});
  await click('.cm-dialog-footer .cm-more summary');bounds=await p.locator('.cm-floating-menu').boundingBox();assert.ok(bounds.x>=8&&bounds.x+bounds.width<=382);await p.screenshot({path:`${out}/menu-mobile.png`});await p.keyboard.press('Escape');await click('dialog [data-action=close]');
  await nav('horses');const row=p.locator('.cm-body tbody tr').nth(4);await row.scrollIntoViewIfNeeded();const rowY=(await row.boundingBox()).y;await row.locator('.cm-row-toggle').click();await p.waitForTimeout(60);const expandedY=(await row.boundingBox()).y;assert.ok(Math.abs(expandedY-rowY)<=2);await row.locator('.cm-row-toggle').click();await p.waitForTimeout(60);assert.ok(Math.abs((await row.boundingBox()).y-rowY)<=2);await row.locator('[data-action=horse]').click();await wait();await click('dialog [data-action=close]');assert.ok(Math.abs((await row.boundingBox()).y-rowY)<=2);report.rowAnchorDelta=Math.abs((await row.boundingBox()).y-rowY);
  await nav('overview');await p.screenshot({path:`${out}/overview-mobile.png`});
  await p.setViewportSize({width:1440,height:1000});await nav('overview');await p.screenshot({path:`${out}/overview-desktop.png`});
  // Exercise the shared menu at all viewport corners, including upward positioning.
  report.menuCorners=[];
  for(const [left,top] of [[8,8],[1320,8],[8,940],[1320,940]]){
    await p.evaluate(({left,top})=>{const host=document.createElement('div');host.id='menu-check';host.style.cssText=`position:fixed;left:${left}px;top:${top}px;z-index:1002`;host.innerHTML=Keiba.ChairmanUI.more('<button type="button">查看记录</button><button type="button">编辑记录</button>','对象操作','边界测试 · 对象操作');document.querySelector('#chairmanApp').append(host);Keiba.ChairmanUI.wireMenus(host);},{left,top});
    await click('#menu-check summary');const r=await p.locator('.cm-floating-menu').boundingBox();assert.ok(r.x>=8&&r.x+r.width<=1432&&r.y>=8&&r.y+r.height<=992,JSON.stringify(r));report.menuCorners.push(r);await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.matches('#menu-check summary')),true);await p.locator('#menu-check').evaluate(el=>el.remove());
  }
  // A second page shares the database but cannot obtain the first page's editing lease.
  const readonly=await context.newPage();await readonly.goto(process.env.CHAIRMAN_TEST_URL||'http://127.0.0.1:8765/');await readonly.locator('#chairmanLaunch').click();await readonly.waitForSelector('[data-action=openWorld]');await readonly.locator('[data-action=openWorld]').click();await readonly.waitForSelector('.cm-in-world');
  assert.equal(await readonly.locator('[data-action=advance]').isDisabled(),true);await readonly.locator('.cm-sidebar [data-action=workbenchGroup][data-id=horses]').click();await readonly.waitForFunction(()=>!document.querySelector('.cm-busy'));assert.equal(await readonly.locator('[data-action=editHorse]').first().isDisabled(),true);await readonly.locator('.cm-mobile-filters').click();await readonly.locator('[name=search]').fill('不存在');await readonly.locator('.cm-apply-filter').click();await readonly.waitForFunction(()=>!document.querySelector('.cm-busy'));assert.equal(await readonly.locator('.cm-body tbody tr').count(),0);report.readonly=true;await readonly.close();
  await nav('saves');await click('.cm-body [data-action=lobby]');await click('[data-action=new][data-id=blank]');await p.locator('[data-form=new] button').click();await wait();report.emptyWorld={};
  for(const width of [1440,320]){await p.setViewportSize({width,height:width===320?844:1000});for(const id of ids){await nav(id);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`empty ${width} ${id}`);}report.emptyWorld[width]=ids.length;}
  report.errors=errors;assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }catch(e){await p.screenshot({path:`${out}/failure.png`});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
