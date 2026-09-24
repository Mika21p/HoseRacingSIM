const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
 const report={};
 try{
  await page.goto('http://127.0.0.1:9195/');await page.locator('#homeStartBtn').click();
  assert.equal(await page.locator('#sireSelect option').count(),90);assert.equal(await page.locator('#damSelect option').count(),150);
  await page.locator('#sireSearch').fill('Sunday Silence');await page.locator('#damSearch').fill('Air Groove');
  assert.ok(await page.locator('#generateBtn').isEnabled());
  await page.screenshot({path:'artifacts/career-bloodline-setup-desktop.png'});
  await page.locator('#horseNameInput').fill('血统接入验证');await page.locator('#generateBtn').click();
  await page.locator('#workspaceBloodlineNav').click();assert.ok(await page.locator('#bloodlinePanel').isVisible());
  assert.equal(await page.locator('#bloodlinePanel .bloodline-node').count(),15);
  assert.equal(await page.locator('#bloodlinePanel .bloodline-node:visible').count(),15);
  await page.screenshot({path:'artifacts/career-bloodline-desktop.png'});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('keiba-career-save-v1')).state.career.horse);
  await page.reload();await page.locator('#homeContinueBtn').click();await page.locator('#workspaceBloodlineNav').click();
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('keiba-career-save-v1')).state.career.horse);assert.deepEqual(after,before);
  await page.setViewportSize({width:390,height:844});await page.locator('[data-tree-depth="4"]').click();
  assert.equal(await page.locator('#bloodlinePanel .bloodline-node:visible').count(),31);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'artifacts/career-bloodline-mobile.png'});
  await page.locator('[data-workspace-view=more]').click();await page.locator('#newCareerBtn').click();
  await page.locator('#randomParentsBtn').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'artifacts/career-bloodline-setup-mobile.png'});
  await page.evaluate(()=>localStorage.setItem('keiba-legend-intro-dismissed','1'));
  await page.locator('#gameModeToggleBtn').click();
  if(await page.locator('[data-legend-intro-close]').first().isVisible()) await page.locator('[data-legend-intro-close]').first().click();
  await page.locator('#generateBtn').click();await page.locator('#workspaceBloodlineNav').click();
  const legend=await page.evaluate(()=>JSON.parse(localStorage.getItem('keiba-career-save-v1')).state.career);
  assert.equal(legend.gameMode,'legend');assert.equal(legend.horse.pedigree.mode,'legend');assert.ok(legend.horse.strength>=81);
  assert.doesNotMatch(await page.locator('#bloodlinePanel').innerText(),/个百分点|\d+%|1d20|2d20/);
  // Old saves and retired careers remain accessible without inventing ancestors.
  await page.addInitScript(()=>{const key='keiba-career-save-v1',save=JSON.parse(localStorage.getItem(key));delete save.state.career.horse.pedigree;delete save.state.career.horse.genetics;save.state.career.horse.sireName='旧父系';save.state.career.retired=true;localStorage.setItem(key,JSON.stringify(save));});
  await page.reload();await page.locator('#homeContinueBtn').click();await page.locator('#workspaceBloodlineNav').click();
  assert.match(await page.locator('#bloodlinePanel').innerText(),/旧版血系记录/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('keiba-career-save-v1')).state.career.horse.strength),legend.horse.strength);
  assert.deepEqual(errors,[]);
  Object.assign(report,{normalStrength:before.strength,legendStrength:legend.horse.strength,saveRestored:true,mobileNoOverflow:true,errors});
  fs.writeFileSync('artifacts/career-bloodline-browser-report.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
