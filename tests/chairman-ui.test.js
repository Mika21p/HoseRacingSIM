const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
const { loadChairmanRules, projectRoot } = require('./helpers/project-loader');
const source = (file) => fs.readFileSync(path.join(projectRoot, file), 'utf8');
function dom() {
  return new JSDOM('<!doctype html><div id="app"><div id="homeScreen"><div class="home-mode-grid"></div></div></div>', { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
}
test('all filter edits wait for Apply, preserve advanced selections and ignore IME Enter', () => {
  const d=dom(),w=d.window;w.Keiba={};w.eval(source('js/chairman-ui.js'));
  const html=`<form data-form="officeFilter" data-kind="horses"><label>搜索马名<input name="search"></label><label>地区<select name="region" multiple><option selected>日本</option><option>欧洲</option></select></label><label>性别<select name="gender" multiple><option>牡马</option><option>牝马</option></select></label><button>应用</button></form>`;
  w.document.body.innerHTML=html;let saved,submits=0;const form=w.document.querySelector('form');
  form.addEventListener('submit',ev=>{ev.preventDefault();saved=new w.FormData(form);submits++;});w.Keiba.ChairmanUI.enhance(w.document.body);
  form.querySelector('.cm-multi[data-field=gender] input').click();form.querySelectorAll('.cm-multi[data-field=region] input')[1].click();
  assert.equal(submits,0);assert.match(form.textContent,/待应用/);form.querySelector('.cm-apply-filter').click();assert.deepEqual(saved.getAll('region'),['日本','欧洲']);assert.deepEqual(saved.getAll('gender'),['牡马']);
  form.querySelector('.cm-chip').click();assert.equal(submits,1);assert.deepEqual([...form.elements.region.selectedOptions].map(o=>o.value),['欧洲']);
  form.elements.search.value='中文';form.elements.search.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,isComposing:true}));assert.equal(submits,1);
  form.elements.search.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(saved.get('search'),'中文');assert.equal(submits,2);
  form.querySelector('[data-filter-reset]').click();assert.equal(submits,2);assert.equal(form.elements.search.value,'');
  d.window.close();
});
async function app(t, options = {}) {
  const d = dom(), w = d.window, ns = loadChairmanRules().rules;
  Object.assign(w, { Keiba: ns, indexedDB: new IDBFactory(), IDBKeyRange, structuredClone });
  w.scrollTo = ({ top }) => Object.defineProperty(w, 'scrollY', { value: top || 0, configurable: true });
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  for (const f of ['chairman-storage', 'chairman-history', 'chairman-ui', 'chairman-office-ui', 'chairman-breeding-ui', 'chairman-honors-ui', 'chairman-content-ui', 'chairman-editor-ui', 'chairman-app']) w.eval(source(`js/${f}.js`));
  const { prepare, ...worldOptions } = options;
  const W = ns.ChairmanRules, store = await ns.ChairmanStorage.open(); let world = W.createWorld({ seed: 5701, horseCount: 160, ...worldOptions });
  world.races.filter(r=>r.month===1 && r.half===1).forEach(r=>{r.raceClass="g3";r.grade="G3";}); W.planEntries(world);
  await store.acquire(world.id); await store.commitChanges(null, { world });
  const out = W.advanceHalfMonth(world); if (prepare) prepare(out.world); await store.commitChanges(world, out); world = out.world; await store.release();
  const errors = []; w.console.error = (err) => errors.push(err);
  const wait = async () => { await new Promise(r => setTimeout(r, 10)); for (let i = 0; i < 400 && w.document.querySelector('.cm-busy'); i++) await new Promise(r => setTimeout(r, 5)); assert.equal(w.document.querySelector('.cm-busy'), null, 'UI operation finishes'); if (errors.length) throw errors.shift(); };
  const click = async (selector, root = w.document) => { const el = root.querySelector(selector); assert.ok(el, selector); el.click(); await wait(); return el; };
  ns.ChairmanApp.mount(); await click('#chairmanLaunch'); await click('[data-action=openWorld]');
  t.after(async () => { await click('[data-action=exit]'); await store.close(); d.window.close(); });
  return { w, ns, store, world, click, wait, body: w.document.querySelector('.cm-body'), dialog: w.document.querySelector('dialog') };
}
test('chairman pages retain complete actions, compact lists, independent settings tabs and private projections', async (t) => {
  const { w, ns, world, click, body, dialog } = await app(t);
  await click('[data-action=tab][data-id=horses]'); assert.equal(body.querySelectorAll('tbody tr').length, 50); assert.equal(body.querySelector('[data-selection]'), null);
  await click('[data-action=horse]', body); assert.equal(dialog.querySelectorAll('[data-action=horseView]').length, world.breeding ? 6 : 4);
  assert.match(dialog.textContent, /属性未公开/); assert.equal(dialog.querySelector('[name=strength]'), null); assert.doesNotMatch(dialog.innerHTML, /courseGrades|peakStart|breedingStrength/);
  await click('[data-action=close]', dialog);
  await click('[data-action=batch][data-id=horse]', body); assert.ok(body.querySelector('th').textContent.includes('选择'));
  await click('[data-action=tab][data-id=calendar]'); assert.equal(body.querySelectorAll('tbody tr').length, 24); await click('[data-action=calendarView][data-id=background]'); assert.equal(body.querySelectorAll('tbody tr').length, 50); assert.ok(body.querySelector('[data-action=entryList]'));
  await click('[data-action=calendarView][data-id=tracks]'); assert.ok(body.querySelector('[data-action=editTrack]')); assert.equal(body.querySelector('[data-action=editRace]'), null);
  await click('[data-action=calendarView][data-id=regions]'); assert.ok(body.querySelector('[data-action=editRegion]'));
  await click('[data-action=tab][data-id=settings]'); assert.equal(body.querySelector(':scope > section:not([hidden]) [data-action=saveSlot]'), null);
  await click('[data-action=settingsView][data-id=saves]'); assert.equal(body.querySelectorAll(':scope > section:not([hidden]) [data-action=saveSlot]').length, 10);
  await click('[data-action=tab][data-id=awards]'); assert.equal(body.querySelectorAll('.cm-award-grid>article').length, ns.ChairmanRules.AWARDS.length);
  await click('[data-action=awardView][data-id=history]'); assert.ok(body.querySelector('[data-form=awardYear]')); assert.equal(body.querySelector('.cm-award-grid'), null);
  await click('[data-action=tab][data-id=horses]'); await click('[data-action=editHorse]', body);
  assert.ok(dialog.querySelector('.cm-editor-group')); const save = dialog.querySelector('.cm-dialog-footer button[type=submit],.cm-dialog-footer button:not([type])'); assert.ok(save); assert.equal(save.form, dialog.querySelector('form'));
  await click('[data-action=close]', dialog);
});
test('result draft survives horse navigation and back; individual and whole-race saves apply without changing race facts', async (t) => {
  const { w, store, world, click, wait, body, dialog } = await app(t);
  await click('[data-action=tab][data-id=results]'); await click('[data-action=result]', body);
  const input = dialog.querySelector('[data-performance]'); assert.ok(input); const id = input.dataset.performance, race = input.dataset.draft;
  const prior = await store.get('performances', world.id, id);
  input.value = '136'; input.dispatchEvent(new w.Event('input', { bubbles: true }));
  await click('[data-action=horse]', input.closest('tr')); await click('[data-action=dialogBack]', dialog);
  assert.equal(dialog.querySelector(`[data-performance="${id}"]`).value, '136'); assert.ok(dialog.querySelector('.cm-dialog-footer [data-action=saveRaceScores]'));
  await click(`[data-action=saveOneScore][data-id="${id}"]`, dialog); assert.equal((await store.get('performances', world.id, id)).manualRating, 136);
  const next = dialog.querySelector('[data-performance]'); next.value = '139'; next.dispatchEvent(new w.Event('input', { bubbles: true })); await click('[data-action=saveRaceScores]', dialog);
  const after = await store.get('performances', world.id, id); assert.equal(after.manualRating, 139); assert.equal(after.rank, prior.rank); assert.equal(after.prize, prior.prize); assert.equal(after.tf, prior.tf);
  assert.equal(await store.get('scoreDrafts', world.id, race), undefined);
  const expand = dialog.querySelector('.cm-row-toggle'); expand.click(); assert.ok(expand.closest('tr').classList.contains('cm-row-open'));
  await click('[data-action=close]', dialog); await wait();
});

test('feedback UI creates a horse at current age and separates game management from independent backups', async (t) => {
  const { w, store, world, click, wait, body, dialog } = await app(t);
  await click('[data-action=tab][data-id=horses]'); await click('[data-action=editHorse]', body);
  let form = dialog.querySelector('form');
  assert.equal(form.elements.age.value, '2'); assert.equal(form.elements.birthYear, undefined);
  form.elements.name.value = '当前年龄新马'; form.elements.age.value = '4'; form.requestSubmit(); await wait();
  let saved = await store.load(world.id); const horse = saved.horses.find(h => h.name === '当前年龄新马');
  assert.ok(horse); assert.equal(saved.turn, world.turn); assert.equal(w.Keiba.ChairmanRules.ageOf(saved, horse), 4); assert.equal(horse.lifetime.starts, 0);
  await click('[data-action=tab][data-id=results]'); await click('[data-action=result]', body);
  assert.match(dialog.textContent, /前走成绩／WTR/); assert.match(dialog.textContent, /首次出赛/); assert.equal(dialog.querySelector('[data-performance]').step, '1'); await click('[data-action=close]', dialog);
  await click('[data-action=tab][data-id=settings]'); await click('[data-action=settingsView][data-id=saves]'); await click('[data-action=saveSlot][data-id="1"]', body); await click('[data-action=confirmSaveSlot]', dialog);
  await click('[data-action=lobby]'); assert.match(body.textContent, /游戏进度/);
  await click('[data-action=renameWorld]', body); form = dialog.querySelector('form'); form.elements.name.value = '重新命名的游戏'; form.requestSubmit(); await wait(); assert.match(body.textContent, /重新命名的游戏/);
  await click('[data-action=deleteWorld]', body); assert.match(dialog.textContent, /独立手动备份保留/); await click('[data-action=confirmDeleteWorld]', dialog);
  assert.equal((await store.listWorlds()).length, 0); assert.equal((await store.slots()).length, 1);
  await click('[data-action=backups]', body); await click('[data-action=loadSlot]', dialog); await click('[data-action=confirmLoadSlot]', dialog);
  assert.equal((await store.listWorlds()).length, 1); assert.match(body.textContent, /概览|本半月/);
  await click('[data-action=tab][data-id=settings]'); await click('[data-action=settingsView][data-id=saves]');
  await click('[data-action=deleteSlot]', body); await click('[data-action=confirmDeleteSlot]', dialog);
  assert.equal((await store.slots()).length, 0); assert.equal((await store.listWorlds()).length, 1); await click('[data-action=close]', dialog);
});

test('series editor selects existing races, confirms schedule warnings and preserves the new calendar tab', async t => {
  const {w,world,store,body,dialog,click,wait}=await app(t);
  await click('[data-action=tab][data-id=calendar]');await click('[data-action=calendarView][data-id=series]');await click('[data-action=seriesEdit]',body);
  const form=dialog.querySelector('form');form.elements.name.value='春秋挑战';form.elements.bonus.value='3000';
  const picked=world.races.filter(r=>['takamatsunomiya-kinen','japan-cup','champions-cup'].includes(r.sourceId));assert.equal(picked.length,3);
  for(const r of picked)await click(`[data-series-race="${r.id}"]`,dialog);
  form.requestSubmit();await wait();if(dialog.querySelector('[data-action=seriesConfirm]'))await click('[data-action=seriesConfirm]',dialog);
  const saved=await store.load(world.id);assert.equal(saved.series.length,1);assert.equal(saved.series[0].bonus,3000);assert.equal(saved.series[0].raceIds.length,3);assert.match(body.textContent,/春秋挑战/);
  await click('[data-action=seriesDetail]',body);assert.match(dialog.textContent,/荣誉权重3/);await click('[data-action=close]',dialog);
  await click('[data-action=tab][data-id=horses]');await click('[data-action=workbenchGroup][data-id=events]');assert.ok(body.querySelector('[data-action=seriesEdit]'));
});

test('WTR benchmark recommendations preserve edits and baseline across navigation, approval and reload', async (t) => {
  const { w, store, world, click, wait, body, dialog } = await app(t);
  await click('[data-action=tab][data-id=results]'); await click('[data-action=result]', body);
  await click('[data-action=defaultWtrDraft]', dialog);
  const first=dialog.querySelector('[data-performance]'), id=first.dataset.performance, race=first.dataset.draft;
  first.value='0'; first.dispatchEvent(new w.Event('input',{bubbles:true}));
  const form=dialog.querySelector('[data-form=wtrBenchmark]'); form.elements.benchmarkScore.value='130';
  form.elements.benchmarkScore.dispatchEvent(new w.Event('input',{bubbles:true}));form.requestSubmit();await wait();
  assert.equal(dialog.querySelector(`[data-performance="${id}"]`).value,'0');
  const draft=await store.get('scoreDrafts',world.id,race);assert.equal(draft.benchmarkScore,130);assert.equal(draft.touched[id],true);
  await click('[data-action=horse]',dialog);await click('[data-action=dialogBack]',dialog);
  assert.equal(dialog.querySelector('[name=benchmarkScore]').value,'130');
  await click('[data-action=saveRaceScores]',dialog);
  assert.equal((await store.get('occurrences',world.id,race)).wtrBenchmark.score,130);
  assert.equal((await store.get('performances',world.id,id)).manualRating,0);
  assert.equal(dialog.querySelector('[name=benchmarkScore]').value,'130');
  await click('[data-action=close]',dialog);
});
test('breeding views share horse archives, preserve private fields and save designated pairings from the compact editor', async (t) => {
  const { w, ns, world, store, click, wait, body, dialog } = await app(t, { breeding: true });
  await click('[data-route=active]'); assert.ok(body.querySelector('table'));
  await click('[data-action=breedView][data-id=library]'); assert.equal(body.querySelectorAll('tbody tr').length, 50);
  assert.equal(body.querySelector('tbody td:first-child small'), null, 'stable identifiers stay out of list rows');
  await click('[data-action=pedigree]', body); assert.equal(dialog.querySelectorAll('.cm-pedigree-cell').length, 14); assert.doesNotMatch(dialog.innerHTML, /breedingStrength|courseGrades|peakStart/); await click('[data-action=close]', dialog);
  await click('[data-action=breedView][data-id=boards]'); assert.equal(body.querySelectorAll('table').length, 1); await click('[data-action=breedBoardKind][data-id=dam]');
  await click('[data-action=breedView][data-id=plans]'); const plan = ns.ChairmanBreeding.plan(ns.ChairmanRules.clone(world)).find(p => ns.ChairmanBreeding.get(world, p.fatherId) && ns.ChairmanBreeding.get(world, p.motherId)); assert.ok(plan);
  await click('[data-action=breedMate]', body); let mating = dialog.querySelector('form');
  for (const key of ['fatherId', 'motherId']) {
    const search = mating.querySelector(`[data-parent-search="${key}"]`);
    search.value = plan[key]; search.dispatchEvent(new w.Event('input', { bubbles: true }));
    const field = mating.elements[key]; assert.equal(field.tagName, 'SELECT'); assert.ok(field.required);
    assert.equal(field.options.length, 2); assert.equal(field.options[1].value, plan[key]);
    assert.ok(ns.ChairmanBreeding.available(world, ns.ChairmanBreeding.get(world, field.options[1].value)));
    field.value = plan[key]; field.dispatchEvent(new w.Event('change', { bubbles: true }));
  }
  mating.elements.homeRegion.value = plan.homeRegion; mating.elements.owner.value = '指定配种测试马主';
  await click('.cm-parent-preview [data-action=pedigree]', dialog); await click('[data-action=dialogBack]', dialog);
  mating = dialog.querySelector('form'); assert.equal(mating.elements.fatherId.value, plan.fatherId); assert.equal(mating.elements.motherId.value, plan.motherId);
  assert.equal(mating.elements.owner.value, '指定配种测试马主'); assert.equal(mating.querySelector('[data-parent-search=fatherId]').value, plan.fatherId);
  const search = mating.querySelector('[data-parent-search=fatherId]'); search.value = '无匹配亲本'; search.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.match(mating.querySelector('[data-parent-count=fatherId]').textContent, /没有符合条件/); assert.equal(mating.elements.fatherId.value, plan.fatherId);
  assert.equal(dialog.querySelector('.cm-dialog-footer button:not([type])').form, mating); mating.requestSubmit(); await wait();
  assert.equal((await store.load(world.id)).breeding.manual.length, 1); assert.ok(body.querySelector('[data-action=breedCancel]'));
  await click('[data-action=tab][data-id=horses]'); await click('[data-action=horse]', body); await click('[data-action=horseView][data-view=pedigree]', dialog); assert.equal(dialog.querySelectorAll('.cm-pedigree-cell').length, 14);
  await click('[data-action=horseView][data-view=children]', dialog); assert.equal(dialog.querySelectorAll('[data-action=breedDescendants]').length, 4); await click('[data-action=close]', dialog);
  await click('[data-action=editHorse]', body); const form = dialog.querySelector('form'); form.elements.name.value = '测试父母跳转不丢失编辑'; form.elements.fatherId.value = plan.fatherId; form.elements.fatherId.dispatchEvent(new w.Event('input', { bubbles: true }));
  await click('.cm-parent-preview [data-action=pedigree]', dialog); await click('[data-action=dialogBack]', dialog);
  assert.equal(dialog.querySelector('[name=name]').value, '测试父母跳转不丢失编辑'); assert.equal(dialog.querySelector('[name=fatherId]').value, plan.fatherId); assert.ok(dialog.querySelector('[data-parent-search]'));
  await click('[data-action=close]', dialog);
});
test('advancing and fast forwarding preserve saved filters; latest summary only adds its own condition', async (t) => {
  const { w, store, world, click, wait, body } = await app(t);
  const plain = value => JSON.parse(JSON.stringify(value));
  async function filter(tab, values) {
    await click(`[data-action=tab][data-id=${tab}]`);
    const form = body.querySelector('[data-form=officeFilter]');
    for (const [key, value] of Object.entries(values)) {
      const el = form.elements[key];
      if (el.multiple) [...el.options].forEach(o => o.selected = value.includes(o.value));
      else if (el.type === 'checkbox') el.checked = value;
      else el.value = value;
    }
    form.requestSubmit(); await wait();
  }
  await filter('horses', { region: ['日本', '欧洲'], gender: ['牝马'], sort: 'prize' });
  await filter('calendar', { region: ['美国'], raceClass: ['g1'], surface: ['泥地'] });
  await filter('boards', { region: ['日本'], minimum: '110' });
  await filter('results', { search: '杯', region: ['日本', '美国'], surface: ['草地'], raceClass: ['g1', 'g3'], year: '1', scoring: ['none'], latest: false });
  const before = plain((await store.load(world.id)).ui);
  for (const action of ['advance', 'fast']) {
    await click(`[data-action=${action}]`);
    const saved = (await store.load(world.id)).ui;
    for (const key of ['horses', 'calendar', 'board_tf', 'results']) assert.deepEqual(plain(saved[key]), before[key], `${action} retains ${key}`);
    assert.equal(body.querySelector('[name=search]').value, '杯');
    assert.deepEqual([...body.querySelector('[name=region]').selectedOptions].map(o => o.value), ['日本', '美国']);
    assert.equal(body.querySelector('[name=latest]').checked, false);
  }
  await click('[data-action=latest]', body);
  assert.deepEqual(plain((await store.load(world.id)).ui.results), { ...before.results, latest: '1' });
  await click('[data-action=advance]');
  assert.equal(body.querySelector('[name=latest]').checked, true);
  await click('[data-action=exit]'); await click('#chairmanLaunch'); await click('[data-action=openWorld]');
  await click('[data-action=tab][data-id=results]');
  assert.equal(body.querySelector('[name=search]').value, '杯');
  assert.equal(body.querySelector('[name=latest]').checked, true);
  await click('[data-filter-reset]', body); await click('.cm-apply-filter',body); await click('[data-action=advance]');
  assert.equal((await store.load(world.id)).ui.results.search, '', 'explicitly reset filters stay cleared');
});

test('paging, search submission, advanced state and list scroll survive detail and tab navigation', async (t) => {
  const { w, store, world, click, wait, body, dialog } = await app(t);
  await click('[data-action=tab][data-id=horses]'); await click('[data-action=page][data-id="1"]', body);
  const first = body.querySelector('tbody [data-action=horse]').dataset.id; w.scrollTo({ top: 600 });
  await click('[data-action=horse]', body); await click('[data-action=close]', dialog); assert.equal(w.scrollY, 600);
  await click('[data-action=tab][data-id=calendar]'); await click('[data-action=tab][data-id=horses]'); assert.equal(body.querySelector('tbody [data-action=horse]').dataset.id, first); assert.equal(w.scrollY, 600);
  await click('.cm-mobile-filters',body);assert.equal(body.querySelector('.cm-filter-panel').hidden,false);
  const search = body.querySelector('[name=search]'); search.value = '不存在的名字'; search.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await wait(); assert.equal(body.querySelectorAll('tbody tr').length, 0); assert.match(body.querySelector('.cm-pagination').textContent, /第 1 页/);
  assert.equal(body.querySelector('.cm-filter-panel').hidden,false);await click('[data-filter-reset]', body);await click('.cm-apply-filter',body);assert.equal(body.querySelectorAll('tbody tr').length,50);
});

test('player council editor, hall nomination, vote inspection and local award drafts work through shared UI', async (t) => {
  const { w, store, world, click, wait, body, dialog } = await app(t, { prepare: w => { w.horses.find(h => h.lifetime.starts > 0).annual.manual = 140; } });
  await click('[data-action=tab][data-id=hall]'); await click('[data-action=honorView][data-id=council]');
  assert.match(body.textContent, /尚未配置评议会/); await click('[data-action=honorEditType]', body);
  let form = dialog.querySelector('form'); form.elements.name.value = '短途泥地观察员'; form.elements.count.value = '7';
  assert.equal(form.elements['motive.g1'].value, '40'); assert.equal(form.elements['motive.random'].value, '0');
  assert.match(form.textContent, /随机只扰动接近的排序/);
  const slider = form.querySelector('[data-affinity-slider="短途"]'); slider.value = '80'; slider.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.equal(form.elements['affinity.短途'].value, '80'); form.elements['affinity.泥地'].value = '60';
  const save = dialog.querySelector('.cm-dialog-footer button[type=submit]'); assert.equal(save.form, form); save.click(); await wait();
  const saved = await store.load(world.id); assert.equal(saved.councilTypes.length, 1); assert.equal(saved.councilTypes[0].affinities.短途, 80);
  await click('[data-action=tab][data-id=horses]');
  const runner = world.horses.find(h => h.lifetime.starts > 0); assert.ok(runner);
  await w.Keiba.ChairmanApp.horseDetail(runner.id); await click('[data-action=retire]', dialog); await click('[data-action=confirmEdit]', dialog);
  if (dialog.open) await click('[data-action=close]', dialog);
  await click('[data-action=tab][data-id=hall]'); await click('[data-action=honorView][data-id=candidates]'); await click('[data-action=honorNomination]');
  await click(`[data-action=honorNominate][data-id="${runner.id}"]`, dialog);
  await click('[data-action=honorGenerateHall]');
  assert.match(dialog.textContent, /门槛60%/); assert.doesNotMatch(dialog.innerHTML, /courseGrades|peakStart|breedingStrength/);
  assert.match(dialog.textContent, /综合评分择优/);
  const inductionButton = dialog.querySelector('[data-action=honorInduct]'); assert.ok(inductionButton); await click('[data-action=honorInduct]', dialog);
  form = dialog.querySelector('form'); form.elements.comment.value = '值得铭记的生涯'; form.requestSubmit(); await wait();
  assert.equal((await store.load(world.id)).honorProfiles.find(p => p.id === runner.id).induction.comment, '值得铭记的生涯');
  await click('[data-action=honorView][data-id=history]'); await click('[data-action=honorRound]', body); await click('[data-action=honorVotes]', dialog);
  assert.equal(dialog.querySelectorAll('tbody tr').length, 7); assert.match(dialog.textContent, /爱好/); await click('[data-action=close]', dialog);
  form = body.querySelector('[data-form=honorHistoryFilter]'); form.elements.historyKind.value = 'hallEvents'; form.requestSubmit(); await wait();
  assert.match(body.textContent, /值得铭记的生涯/); assert.match(body.textContent, /评议核准/);
  await click('[data-action=tab][data-id=awards]');
  form = body.querySelector('[data-form=honorAwardScope]'); form.elements.scope.value = 'japan'; form.requestSubmit(); await wait();
  assert.equal(body.querySelectorAll('.cm-award-grid article').length, 12); await click('[data-action=honorChooseLocal][data-id=representative]', body);
  await click('[data-action=honorPickLocal]:not([data-id=""])', dialog);
  const comment = dialog.querySelector('[name=comment]'); comment.value = '地方荣誉'; comment.dispatchEvent(new w.Event('input', { bubbles: true }));
  await click('[data-action=close]', dialog);
  assert.equal((await store.load(world.id)).honors.drafts['japan:representative'].comment, '地方荣誉');
  await click('[data-action=tab][data-id=horses]');
  form = body.querySelector('[data-form=officeFilter]'); form.elements.status.value = 'retired'; form.elements.honor.value = 'hall'; form.requestSubmit(); await wait();
  assert.equal(body.querySelectorAll('tbody tr').length, 1); assert.equal(body.querySelector('tbody [data-action=horse]').dataset.id, runner.id);
  await click('[data-action=advance]'); assert.equal((await store.load(world.id)).ui.horses.honor, 'hall');
});


test('filter drafts survive page and detail navigation, and breeding routes isolate applied conditions',async t=>{
 const {w,store,world,body,dialog,click,wait}=await app(t,{breeding:true});
 await click('[data-route=horses]');await click('.cm-mobile-filters',body);
 const search=body.querySelector('[name=search]');search.value='未应用';search.dispatchEvent(new w.Event('input',{bubbles:true}));
 body.querySelector('.cm-multi[data-field=gender] input').click();
 await click('[data-action=horse]',body);await click('[data-action=close]',dialog);await click('[data-route=calendar]');await click('[data-route=horses]');
 assert.equal(body.querySelector('[name=search]').value,'未应用');assert.equal(body.querySelector('.cm-filter-panel').hidden,false);assert.equal(body.querySelector('.cm-multi[data-field=gender] input').checked,true);assert.equal((await store.load(world.id)).ui.horses?.search,undefined);
 await click('[data-route=library]');let form=body.querySelector('form');form.elements.search.value='Sunday';form.requestSubmit();await wait();
 await click('[data-route=active]');assert.equal(body.querySelector('[name=search]').value,'');await click('[data-route=library]');assert.equal(body.querySelector('[name=search]').value,'Sunday');
});

test('row expansion follows stable record IDs across new DOM order and world scope',()=>{
 const d=dom(),w=d.window;w.Keiba={};w.eval(source('js/chairman-ui.js'));const ui=w.Keiba.ChairmanUI,body=w.document.body;
 const rows=ids=>`<main data-view-key="horses"><table data-table="horses" data-primary-columns="0"><thead><tr><th>马名</th><th>资料</th></tr></thead><tbody>${ids.map(id=>`<tr data-row-id="${id}"><td>${id}</td><td>更多</td></tr>`).join('')}</tbody></table></main>`;
 ui.context('one');body.innerHTML=rows(['a','b']);ui.enhance(body.querySelector('main'));assert.equal(body.querySelector('.cm-row-open'),null);body.querySelector('.cm-row-toggle').click();
 body.innerHTML=rows(['b','a']);ui.enhance(body.querySelector('main'));assert.equal(body.querySelector('.cm-row-open').dataset.rowId,'a');
 ui.context('two');body.innerHTML=rows(['a','b']);ui.enhance(body.querySelector('main'));assert.equal(body.querySelector('.cm-row-open'),null);w.close();
});

test('failed automatic score draft retains input and supports explicit retry without approving it',async t=>{
 const {w,ns,store,world,body,dialog,click,wait}=await app(t);await click('[data-route=results]');await click('[data-action=result]',body);
 const original=ns.ChairmanStorage.Store.prototype.commitChanges;let fail=true;
 ns.ChairmanStorage.Store.prototype.commitChanges=async function(before,out,...rest){if(fail&&out.scoreDrafts?.length){fail=false;throw Error('模拟磁盘写入失败');}return original.call(this,before,out,...rest);};
 t.after(()=>{ns.ChairmanStorage.Store.prototype.commitChanges=original;});
 const input=dialog.querySelector('[data-performance]'),id=input.dataset.performance,race=input.dataset.draft;
 input.value='135';input.dispatchEvent(new w.Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,600));await assert.rejects(wait,/模拟磁盘写入失败/);
 assert.match(dialog.querySelector('.cm-draft-state').textContent,/保存失败/);assert.equal(dialog.querySelector('[data-performance]').value,'135');
 await click('[data-action=retryDraft]',dialog);assert.match(dialog.querySelector('.cm-draft-state').textContent,/草稿已保存/);assert.equal((await store.get('scoreDrafts',world.id,race)).values[id],'135');assert.ok((await store.get('performances',world.id,id)).manualRating==null);
 await click('[data-action=close]',dialog);
});


test('pending overview counts and results accept both unapproved and partially approved filters',async t=>{
 const {store,world,body,click}=await app(t);
 const none=await store.historyPage(world,{scoring:'none',resultStatus:'completed'},0),partial=await store.historyPage(world,{scoring:'partial',resultStatus:'completed'},0);
 assert.ok(none.total+partial.total>0);assert.ok(body.querySelector('[data-action=pendingScores]').textContent.includes(`${none.total+partial.total}场`));
 await click('[data-action=pendingScores]',body);assert.ok(body.querySelectorAll('tbody tr').length>0);assert.deepEqual([...body.querySelector('[name=scoring]').selectedOptions].map(o=>o.value),['none','partial']);
});


test('world editor reveals and edits ordinary horses, retains drafts, edits templates and purges hidden DOM on close',async t=>{
 const {w,ns,store,world,click,wait,body,dialog}=await app(t,{horseCount:20,breeding:true});
 await click('[data-action=tab][data-id=settings]');await click('[data-action=worldEditorToggle]',body);await click('[data-action=worldEditEnable]',dialog);
 await click('[data-action=tab][data-id=horses]');await click('[data-action=horse]',body);const horseId=dialog.querySelector('[data-action=worldEditHorse]').dataset.id;
 await click('[data-action=horseView][data-view=real]',dialog);assert.match(dialog.textContent,/基础能力/);await click('[data-action=worldEditHorse]',dialog);
 let form=dialog.querySelector('[data-form=worldEdit]');form.elements.name.value='编辑模式测试马';form.elements.name.dispatchEvent(new w.Event('input',{bubbles:true}));form.elements.strength.value='94';form.elements.strength.dispatchEvent(new w.Event('input',{bubbles:true}));
 await click('[data-action=close]',dialog);await click('[data-action=worldEditKeep]',dialog);await click('[data-action=horse][data-id="'+horseId+'"]',body);await click('[data-action=worldEditHorse]',dialog);form=dialog.querySelector('[data-form=worldEdit]');assert.equal(form.elements.strength.value,'94');form.requestSubmit();await wait();assert.match(dialog.textContent,/历史赛果/);await click('[data-action=worldEditApply]',dialog);
 let saved=await store.load(world.id);assert.equal(saved.horses.find(h=>h.id===horseId).strength,94);assert.equal(saved.horses.find(h=>h.id===horseId).origin,'ai');
 await click('[data-action=breedView][data-id=library]');await click('[data-action=pedigree]',body);await click('[data-action=worldEditTemplate]',dialog);form=dialog.querySelector('[data-form=worldEdit]');form.elements.displayName.value='种马库编辑测试';form.elements.displayName.dispatchEvent(new w.Event('input',{bubbles:true}));form.requestSubmit();await wait();await click('[data-action=worldEditApply]',dialog);saved=await store.load(world.id);assert.ok(ns.ChairmanEditor.templates(saved).some(h=>h.displayName==='种马库编辑测试'));
 await click('[data-action=worldEditorToggle]');assert.equal(dialog.innerHTML,'');assert.equal(w.document.querySelector('[data-action=worldEditHorse]'),null);
 await click('[data-action=tab][data-id=horses]');await click('[data-action=horse][data-id="'+horseId+'"]',body);assert.equal(dialog.querySelector('[data-view=real]'),null);assert.doesNotMatch(dialog.textContent,/基础能力|配种实力.*94/);assert.match(dialog.textContent,/属性未公开/);
});
