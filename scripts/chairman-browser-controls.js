/** Navigate via visible workbench controls; retained action IDs remain the test vocabulary. */
function controls(page){
 const wait=()=>page.waitForFunction(()=>!document.querySelector('.cm-busy'));
 const nav=async id=>{
  const route=await page.evaluate(id=>Keiba.ChairmanUI.routes.find(r=>r.id===id),id);
  const mobile=page.viewportSize().width<1024;
  await page.locator(`${mobile?'.cm-bottom-nav':'.cm-sidebar'} [data-action=workbenchGroup][data-id=${route.group}]`).click();await wait();
  if(mobile){await page.locator('.cm-page-switch summary').click();await page.locator(`.cm-floating-menu [data-route=${id}]`).click();}else await page.locator(`.cm-sidebar [data-route=${id}]`).click();await wait();
 };
 const click=async selector=>{
  if(selector.includes('[data-action=tab][data-id=breeding]'))return nav('active');
  let target=page.locator(selector).first();
  if(!await target.count()&&selector.includes('[data-action=honorView]')){await nav('hall');target=page.locator(selector).first();}
  if(await target.count()&&!await target.isVisible()){
   const route=await target.getAttribute('data-route');if(route)return nav(route);
   const group=await target.locator('xpath=ancestor::*[contains(@class,"cm-tabs")]').count();
   if(group){const index=await target.evaluate(el=>[...el.parentElement.querySelectorAll(':scope > button')].indexOf(el));await target.locator('xpath=..').locator('xpath=preceding-sibling::label[1]').locator('select').selectOption(String(index));await wait();return;}
   const menu=target.locator('xpath=ancestor::details').first();if(await menu.count())await menu.locator(':scope > summary').click();
  }
  if(!await target.isVisible())target=page.locator(selector).filter({visible:true}).first();
  await target.click();await wait();
 };
 const filter=async selector=>{const form=page.locator(selector);const toggle=form.locator('.cm-mobile-filters');if(await toggle.count()&&await toggle.getAttribute('aria-expanded')==='false')await toggle.click();};
 const submit=async selector=>{await page.locator(selector).evaluate(f=>f.requestSubmit());await wait();};
 return {click,nav,wait,submit,filter};
}
module.exports={controls};
