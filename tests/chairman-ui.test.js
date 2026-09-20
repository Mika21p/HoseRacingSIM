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
test('compact filters preserve multiselect data, isolate unapplied advanced changes and remove individual chips', () => {
  const d = dom(), w = d.window; w.Keiba = {}; w.eval(source('js/chairman-ui.js'));
  w.document.body.innerHTML = `<form data-form="officeFilter" data-kind="horses"><label>搜索马名<input name="search"></label><label>地区（可多选）<select name="region" multiple><option selected>日本</option><option>欧洲</option><option>美国</option></select></label><label>性别<select name="gender" multiple><option>牡马</option><option>牝马</option></select></label><button>应用</button><button type="button" data-action="officeClear">清除</button></form>`;
  const form = w.document.querySelector('form'); let saved;
  form.addEventListener('submit', (ev) => { ev.preventDefault(); saved = new w.FormData(form); });
  w.Keiba.ChairmanUI.enhance(w.document.body);
  assert.equal(form.querySelectorAll('.cm-filter-main select[multiple][hidden]').length, 1);
  const choices = form.querySelectorAll('.cm-multi[data-field="region"] input');
  form.querySelector('.cm-multi[data-field="gender"] input').click();
  assert.equal(saved, undefined, 'advanced changes wait for Apply');
  choices[1].click(); assert.deepEqual(saved.getAll('region'), ['日本', '欧洲']); assert.deepEqual(saved.getAll('gender'), []);
  form.querySelector('.cm-multi[data-field="gender"] input').click(); form.querySelector('.cm-filter-grid button').click();
  assert.deepEqual(saved.getAll('gender'), ['牡马']);
  const chip = form.querySelector('.cm-chip'); assert.equal(chip.textContent, '地区：日本 ×'); chip.click(); assert.deepEqual(saved.getAll('region'), ['欧洲']);
  form.querySelector('[name=search]').value = '长名字'; form.querySelector('[name=search]').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); assert.equal(saved.get('search'), '长名字');
  const m = form.querySelector('.cm-multi'); m.open = true; m.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); assert.equal(m.open, false); assert.equal(w.document.activeElement, m.querySelector('summary'));
  d.window.close();
});
async function app(t, options = {}) {
  const d = dom(), w = d.window, ns = loadChairmanRules().rules;
  Object.assign(w, { Keiba: ns, indexedDB: new IDBFactory(), IDBKeyRange, structuredClone });
  w.scrollTo = ({ top }) => Object.defineProperty(w, 'scrollY', { value: top || 0, configurable: true });
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  for (const f of ['chairman-storage', 'chairman-history', 'chairman-ui', 'chairman-office-ui', 'chairman-breeding-ui', 'chairman-app']) w.eval(source(`js/${f}.js`));
  const W = ns.ChairmanRules, store = await ns.ChairmanStorage.open(); let world = W.createWorld({ seed: 5701, horseCount: 160, ...options });
  world.races.filter(r=>r.month===1 && r.half===1).forEach(r=>{r.raceClass="g3";r.grade="G3";}); W.planEntries(world);
  await store.acquire(world.id); await store.commitChanges(null, { world });
  const out = W.advanceHalfMonth(world); await store.commitChanges(world, out); world = out.world; await store.release();
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
  await click('[data-action=tab][data-id=breeding]'); assert.ok(body.querySelector('table'));
  await click('[data-action=breedView][data-id=library]'); assert.equal(body.querySelectorAll('tbody tr').length, 50);
  assert.equal(body.querySelector('tbody td:first-child small'), null, 'stable identifiers stay out of list rows');
  await click('[data-action=pedigree]', body); assert.equal(dialog.querySelectorAll('.cm-pedigree-cell').length, 14); assert.doesNotMatch(dialog.innerHTML, /breedingStrength|courseGrades|peakStart/); await click('[data-action=close]', dialog);
  await click('[data-action=breedView][data-id=boards]'); assert.equal(body.querySelectorAll('table').length, 1); await click('[data-action=breedBoardKind][data-id=dam]');
  await click('[data-action=breedView][data-id=plans]'); const plan = ns.ChairmanBreeding.plan(ns.ChairmanRules.clone(world)).find(p => ns.ChairmanBreeding.get(world, p.fatherId) && ns.ChairmanBreeding.get(world, p.motherId)); assert.ok(plan);
  await click('[data-action=breedMate]', body); const mating = dialog.querySelector('form'); mating.elements.fatherId.value = plan.fatherId; mating.elements.motherId.value = plan.motherId; mating.elements.homeRegion.value = plan.homeRegion;
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
  await filter('results', { search: '杯', region: ['日本', '美国'], surface: ['草地'], raceClass: ['g1', 'g3'], year: '1', scoring: 'none', latest: false });
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
  await click('[data-action=officeClear]', body); await click('[data-action=advance]');
  assert.deepEqual(plain((await store.load(world.id)).ui.results), {}, 'explicitly cleared filters stay cleared');
});

test('paging, search submission, advanced state and list scroll survive detail and tab navigation', async (t) => {
  const { w, store, world, click, wait, body, dialog } = await app(t);
  await click('[data-action=tab][data-id=horses]'); await click('[data-action=page][data-id="1"]', body);
  const first = body.querySelector('tbody [data-action=horse]').dataset.id; w.scrollTo({ top: 600 });
  await click('[data-action=horse]', body); await click('[data-action=close]', dialog); assert.equal(w.scrollY, 600);
  await click('[data-action=tab][data-id=calendar]'); await click('[data-action=tab][data-id=horses]'); assert.equal(body.querySelector('tbody [data-action=horse]').dataset.id, first); assert.equal(w.scrollY, 600);
  const advanced = body.querySelector('.cm-filter-advanced'); advanced.open = true; await new Promise(r => setTimeout(r, 15)); await wait(); assert.equal((await store.load(world.id)).ui.layout.filters.horses, true);
  const search = body.querySelector('[name=search]'); search.value = '不存在的名字'; search.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await wait(); assert.equal(body.querySelectorAll('tbody tr').length, 0); assert.match(body.querySelector('.cm-pagination').textContent, /第 1 页/);
  assert.equal(body.querySelector('.cm-filter-advanced').open, true); await click('[data-action=officeClear]', body); assert.equal(body.querySelectorAll('tbody tr').length, 50);
});
