const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
 try{
  await page.goto('http://127.0.0.1:9195/');await page.locator('#homeStartBtn').click();await page.locator('#generateBtn').click();await page.locator('#workspaceBloodlineNav').click();
  const scroll=page.locator('#bloodlinePanel .pt-scroll');
  assert.ok(await scroll.evaluate(n=>n.scrollWidth>n.clientWidth));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await scroll.focus();await page.keyboard.press('ArrowRight');assert.equal(await scroll.evaluate(n=>n.scrollLeft),160);
  await page.locator('[data-tree-depth="4"]').click();await page.waitForTimeout(100);assert.equal(await scroll.evaluate(n=>n.scrollLeft),160);
  assert.equal(await page.locator('#bloodlinePanel .pt-node').count(),31);
  // Mouse dragging blank canvas should pan the figure without following links.
  await scroll.evaluate(n=>{n.scrollIntoView({block:'start'});n.scrollLeft=0;});await page.waitForTimeout(50);
  const box=await scroll.boundingBox();await page.mouse.move(box.x+280,box.y+15);await page.mouse.down();await page.mouse.move(box.x+80,box.y+15,{steps:8});await page.mouse.up();assert.ok(await scroll.evaluate(n=>n.scrollLeft)>=180);
  // Browser touch input uses the native scroll container; no scripted touch interception.
  const session=await page.context().newCDPSession(page);await session.send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+280,y:box.y+80}]});
  for(let step=1;step<=8;step++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+280-step*20,y:box.y+80}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);assert.ok(await scroll.evaluate(n=>n.scrollLeft)>200);
  await page.screenshot({path:'artifacts/pedigree-tree-mobile.png'});
  await page.goto('http://127.0.0.1:9195/bloodline-lab.html');await page.locator('#pedigreeTable summary').click();assert.equal(await page.locator('#pedigreeTable .pt-node').count(),31);
  if(await page.locator('[data-theory]').count()){await page.locator('[data-theory]').first().click();assert.ok(await page.locator('.pt-node.participant').count());assert.ok(await page.locator('.pt-participant-label:not([hidden])').count());}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.goto('http://127.0.0.1:9195/');
  await page.evaluate(async()=>{
    const n=window.Keiba,w=n.ChairmanRules.createWorld({blank:true,seed:1,breeding:true});
    const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ui=n.ChairmanBreedingUI.create({world:w,escape,button:(a,t,id)=>`<button data-action="${escape(a)}" data-id="${escape(id)}">${escape(t)}</button>`,modal:()=>{},store:{writable:false}});
    const horse=n.ChairmanPedigrees.records.find(r=>r.originalName==='Deep Impact');
    for(const child of document.body.children)child.style.display='none';const fixture=document.createElement('main');fixture.id='treeFixture';fixture.style.cssText='padding:12px;max-width:100%;box-sizing:border-box';fixture.innerHTML=await ui.content(horse.id);document.body.appendChild(fixture);
    window.treeLinkClicks=0;document.body.addEventListener('click',e=>{if(e.target.closest('[data-action=pedigree]'))window.treeLinkClicks++;});
  });
  assert.equal(await page.locator('#treeFixture .pt-node').count(),15);assert.ok(await page.locator('#treeFixture .pt-scroll').evaluate(n=>n.scrollWidth>n.clientWidth));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#treeFixture .pt-node [data-action=pedigree]').first().click();assert.equal(await page.evaluate(()=>window.treeLinkClicks),1);
  await page.setViewportSize({width:1440,height:1000});await page.locator('#treeFixture .pt-scroll').evaluate(n=>n.scrollLeft=0);await page.screenshot({path:'artifacts/pedigree-tree-chairman-desktop.png'});
  assert.deepEqual(errors,[]);const report={careerDepthSwitch:true,keyboard:true,mouseDrag:true,touchSwipe:true,scrollRetained:true,labHighlight:true,chairmanLinks:true,mobileOverflow:false,errors};
  fs.writeFileSync('artifacts/pedigree-tree-browser-report.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
