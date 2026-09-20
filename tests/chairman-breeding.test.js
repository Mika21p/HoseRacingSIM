const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
const { loadChairmanRules, projectRoot } = require('./helpers/project-loader');
function setup(options = {}) {
  const p = loadChairmanRules(), W = p.rules.ChairmanRules, B = p.rules.ChairmanBreeding;
  return { ...p, W, B, w: W.createWorld({ seed: 43127, blank: true, breeding: true, ...options }) };
}
function year(W, world) {
  let w = world;
  while (w.phase !== 'yearEnd') w = W.advanceHalfMonth(w).world;
  return W.finishYear(w);
}
const json = (v) => JSON.parse(JSON.stringify(v));
test('curated core has 30 sires and 50 mares per region, verified parents, shared IDs and acyclic ancestry', () => {
  const { rules: n } = setup(), data = n.ChairmanPedigrees, byId = new Map(data.records.map((h) => [h.id, h]));
  assert.equal(byId.size, data.records.length);
  for (const region of ['日本', '欧洲', '美国']) for (const [gender, count] of [['牡马', 30], ['牝马', 50]]) {
    const rows = data.records.filter((h) => h.core && h.region === region && h.gender === gender);
    assert.equal(rows.length, count);
    for (const h of rows) {
      assert.equal(h.verifiedParents, true); assert.ok(byId.has(h.fatherId) && byId.has(h.motherId));
      assert.match(h.sourceUrl, /^https:\/\/www\.jbis\./); assert.ok(h.romanizedName && h.game.breedingBase);
    }
  }
  const done = new Set(), active = new Set();
  function visit(h) {
    if (done.has(h.id)) return; assert.ok(!active.has(h.id)); active.add(h.id);
    for (const [key, sex] of [['fatherId', '牡马'], ['motherId', '牝马']]) if (h[key]) {
      const p = byId.get(h[key]); assert.ok(p); assert.equal(p.gender, sex); assert.ok(p.birthYear <= h.birthYear - 2); visit(p);
    }
    active.delete(h.id); done.add(h.id);
  }
  data.records.forEach(visit); assert.ok(data.missingThreeGenerations.length > 0);
});

test('random nonwinners can breed, geldings cannot, and age limits cannot be bypassed by retention', () => {
  const { W, B, w } = setup(); w.settings.annualNewHorses = 3;
  const h = W.addHorse(w, { age: 5, gender: '牡马', status: 'retired' });
  const g = W.addHorse(w, { age: 5, gender: '骟马', status: 'retired' });
  B.selectBreeders(w); assert.equal(h.lifetime.wins, 0); assert.equal(h.breeding.status, 'active'); assert.equal(g.breeding.status, 'none');
  h.birthYear = -24; h.breeding.pinned = true; B.selectBreeders(w, true);
  assert.equal(h.breeding.status, 'retired'); assert.equal(h.breeding.pinned, false); assert.equal(B.available(w, h), false);
});

test('template introductions keep shared identity and reject rejuvenating old ancestors', () => {
  const { B, w } = setup();
  let out = B.edit(w, 'introduce', { templateId: 'jbis-0001161935', region: '欧洲' });
  const first = out.world.pedigrees.find((h) => h.templateId === 'jbis-0001161935');
  const before = json(first);
  out = B.edit(out.world, 'introduce', { templateId: first.templateId, region: '欧洲' });
  assert.equal(out.world.pedigrees.filter((h) => h.templateId === first.templateId).length, 1);
  assert.deepEqual(json(B.get(out.world, first.id)), before);
  const ancestor = B.get(out.world, first.fatherId); ancestor.birthYear = -50;
  assert.throws(() => B.edit(out.world, 'introduce', { templateId: ancestor.templateId, region: '欧洲' }), /年龄|资料/);
});
test('breeding migration preserves competition attributes and random stream, blank world has no founders', () => {
  const { W, B } = setup(); const old = W.createWorld({ seed: 38, horseCount: 12 });
  const result = B.edit(old, 'enable', { foundation: false }).world;
  assert.equal(old.breeding, undefined); assert.equal(result.rngState, old.rngState);
  for (let i = 0; i < old.horses.length; i++) {
    const h = json(result.horses.find((h) => h.id === old.horses[i].id)); delete h.breeding;
    assert.deepEqual(h, json(old.horses[i]));
  }
  assert.equal(setup().w.pedigrees.length, 0);
  assert.deepEqual(json(B.edit(old, 'enable', { foundation: false }).world), json(result));
});
test('mating year N creates newborn N+1, debut N+3; lower quotas never remove foals', () => {
  let { W, B, w } = setup(); w.settings.annualNewHorses = 3;
  B.seeded(w, () => { B.founder(w, '日本', '牡马'); B.founder(w, '日本', '牝马'); });
  const first = year(W, w); w = first.world;
  const ids = w.horses.filter((h) => h.status === 'juvenile').map((h) => h.id);
  assert.equal(ids.length, 3); assert.equal(first.breedingEvents.length, 3);
  assert.ok(ids.every((id) => W.ageOf(w, B.get(w, id)) === 0));
  w.settings.annualNewHorses = 0;
  w = year(W, w).world;
  assert.ok(ids.every((id) => B.get(w, id).status === 'juvenile' && W.ageOf(w, B.get(w, id)) === 1));
  w = year(W, w).world;
  assert.ok(ids.every((id) => B.get(w, id).status === 'active' && W.ageOf(w, B.get(w, id)) === 2));
  assert.equal(w.horses.length, 6); W.validateWorld(w);
});
test('manual mating overrides target, rejects close kin and one mare is replaced rather than duplicated', () => {
  let { W, B, w } = setup(); w.settings.annualNewHorses = 0;
  let f, m, other;
  B.seeded(w, () => { f = B.founder(w, '日本', '牡马'); m = B.founder(w, '日本', '牝马'); other = B.founder(w, '美国', '牡马'); });
  w = B.edit(w, 'mating', { fatherId: f.id, motherId: m.id, homeRegion: '日本' }).world;
  w = B.edit(w, 'mating', { fatherId: other.id, motherId: m.id, homeRegion: '美国' }).world;
  assert.equal(w.breeding.manual.length, 1);
  const out = year(W, w); assert.equal(out.breedingEvents.length, 1);
  const child = B.get(out.world, out.breedingEvents[0].horseId); assert.equal(child.homeRegion, '美国'); assert.equal(child.fatherId, other.id);
  const sister = W.addHorse(w, { gender: '牝马', age: 3, status: 'retired', fatherId: f.id, motherId: m.id });
  assert.throws(() => B.legalPair(w, f.id, sister.id), /近亲/);
  const brother = W.addHorse(w, { gender: '牡马', age: 3, status: 'retired', fatherId: f.id, motherId: m.id });
  assert.throws(() => B.legalPair(w, brother.id, sister.id), /近亲/);
  sister.gender = '骟马'; assert.throws(() => B.legalPair(w, other.id, sister.id), /牡马父本/);
});
test('breeding strength is fixed, bounded, hidden until public grade; offspring remains hidden', () => {
  const { W, B, w } = setup();
  const h = W.addHorse(w, { age: 2 }); const original = h.breeding.strength;
  h.strength = 100; h.annual.manual = 150; h.lifetime.g1 = 15; B.initialize(w, h);
  assert.equal(h.breeding.strength, original);
  assert.equal(B.publicHorse(w, h).grade, '未公开'); assert.ok(!('breedingStrength' in B.publicHorse(w, h)));
  h.breeding.everActive = true; assert.equal(B.publicHorse(w, h).grade, B.grade(original));
  for (const n of [0, 101, 2.5, NaN]) assert.throws(() => W.addHorse(W.clone(w), { breedingStrength: n }), /配种实力/);
  const custom = W.addHorse(w, { origin: 'custom', breedingStrength: 93 });
  assert.equal(B.publicHorse(w, custom).breedingStrength, 93);
  const csv = nsCSV(); assert.ok(!csv.includes(h.id)); assert.match(csv, /配种实力/); assert.match(csv, /93/);
  function nsCSV() { return setup().rules.ChairmanCSV.exportRows(w, 'horse'); }
});
test('genetics uses one nonaccumulating ability modifier, both parents and fresh profile groups', () => {
  const { rules: n, W, B, w } = setup();
  const f = W.addHorse(w, { gender: '牡马', breedingStrength: 100 }), m = W.addHorse(w, { gender: '牝马', breedingStrength: 100 });
  f.coreDist = f.distMin = f.distMax = 1100; m.coreDist = m.distMin = m.distMax = 4100;
  let father = 0, mother = 0, fresh = 0;
  for (let seed = 0; seed < 500; seed++) {
    const child = n.Random.withSource(n.Random.seeded(seed), () => B.inherited(w, f, m));
    assert.ok(child.strength >= 62 && child.strength <= 100);
    if (child.coreDist === 1100) father++; else if (child.coreDist === 4100) mother++; else fresh++;
  }
  assert.ok(father > 100 && mother > 100 && fresh > 120);
  const before = n.Random.withSource(n.Random.seeded(15), () => B.inherited(w, f, m));
  f.strength = m.strength = 999;
  const after = n.Random.withSource(n.Random.seeded(15), () => B.inherited(w, f, m));
  assert.deepEqual(json(before), json(after));
});
test('direct offspring earnings and tied champions include retired sires without grandparent double count', () => {
  const { W, B, w } = setup(); w.settings.annualNewHorses = 0;
  const fathers = [0, 1].map(() => B.seeded(w, () => B.founder(w, '日本', '牡马')));
  for (const f of fathers) {
    for (const prize of f === fathers[0] ? [.1, .2] : [.3]) {
      const h = W.addHorse(w, { fatherId: f.id }); h.annual.starts = h.annual.wins = 1; h.annual.prize = prize;
      h.lifetime = { starts: 1, wins: 1, g1: 0, prize };
    }
    f.breeding.status = 'retired';
  }
  assert.equal(B.childStats(w, 1).length, 2);
  w.turn = 23; w.phase = 'yearEnd'; const out = W.finishYear(w);
  assert.equal(out.breedingYears.filter((s) => s.champion).length, 2);
  assert.ok(fathers.every((f) => B.get(out.world, f.id).breeding.championYears.includes(1)));
  assert.throws(() => W.finishYear(out.world), /年末/);
});
test('search and all four ancestry queries deduplicate nodes, page after full filtering, consume no randomness', () => {
  const { W, B, w } = setup(); let f = B.seeded(w, () => B.founder(w, '日本', '牡马'));
  f.name = '测试父'; f.originalName = 'Test Father'; f.pinyin = 'ceshifu'; f.aliases = ['テスト'];
  const sons = Array.from({ length: 70 }, () => W.addHorse(w, { gender: '牡马', age: 5, fatherId: f.id }));
  const child = W.addHorse(w, { gender: '牝马', age: 2, fatherId: sons[0].id });
  const state = w.breeding.rngState;
  assert.equal(B.query(w, { search: 'テスト' }).total, 1);
  assert.equal(B.query(w, { search: 'ceshi' }).total, 1);
  assert.equal(B.query(w, { ancestor: f.id, offset: 50 }).rows.length, 20);
  assert.equal(B.descendants(w, f.id, 'direct').size, 70);
  assert.equal(B.descendants(w, f.id, 'paternal').size, 71);
  assert.equal(B.descendants(w, f.id, 'maternal').size, 0);
  assert.ok(B.descendants(w, f.id, 'all').has(child.id)); assert.equal(w.breeding.rngState, state);
});
test('breeding entities, annual births and RNG commit atomically and replay after recovery; v4 snapshot preserves relations', async () => {
  const p = setup(), { W, B } = p; let w = p.w; w.settings.annualNewHorses = 3;
  Object.assign(p.context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  vm.runInContext(fs.readFileSync(path.join(projectRoot, 'js/chairman-storage.js'), 'utf8'), p.context);
  const store = await p.rules.ChairmanStorage.open();
  try {
    await store.acquire(w.id); await store.commitChanges(null, { world: w });
    while (w.phase !== 'yearEnd') { const out = W.advanceHalfMonth(w); await store.commitChanges(w, out); w = out.world; }
    const out = W.finishYear(w);
    await assert.rejects(store.commitChanges(w, out, { failForTest: true, checkpoint: 'year' }));
    assert.equal((await store.load(w.id)).turn, w.turn);
    await store.commitChanges(w, out, { checkpoint: 'year' });
    const saved = await store.exportWorld(w.id); assert.equal(saved.version, 4); assert.equal(saved.records.breedingEvents.length, 3);
    assert.ok(store.validateSnapshot(saved));
    const bad = W.clone(saved); bad.records.breedingEvents[0].motherId = 'missing'; assert.throws(() => store.validateSnapshot(bad), /关联/);
    const points = await store.query('checkpoints', w.id); const point = points.rows.find((p) => p.turn === 23);
    const restored = await store.restore(out.world, point.id);
    assert.deepEqual(json(W.finishYear(restored).breedingEvents), json(out.breedingEvents));
    const imported = await store.importWorld(saved); assert.equal(imported.breeding.rngState, out.world.breeding.rngState); assert.equal(imported.horses.length, out.world.horses.length);
  } finally { await store.close(); }
});
test('CSV breeding strength roundtrip and external parents require mapping rather than numeric collision', () => {
  const { W, B, rules: n, w } = setup();
  const father = W.addHorse(w, { origin: 'custom', age: 8, gender: '牡马', breedingStrength: 87 });
  const h = W.addHorse(w, { origin: 'custom', fatherId: father.id, breedingStrength: 72 });
  const csv = n.ChairmanCSV.exportRows(w, 'horse', [h.id]);
  const same = n.ChairmanCSV.preview(w, 'horse', csv, { mode: 'update' }); assert.deepEqual(json(same.errors), []); assert.equal(same.output.world.horses.find((a) => a.id === h.id).breeding.strength, 72);
  const other = W.clone(w); other.id = 'another-world';
  assert.ok(n.ChairmanCSV.preview(other, 'horse', csv).errors.some((v) => v.includes('跨世界')));
  const mapped = n.ChairmanCSV.preview(other, 'horse', csv, { parentMappings: { [father.id]: father.id } }); assert.deepEqual(json(mapped.errors), []);
});

test('pre-breeding checkpoint restores disabled state, accepts old v1/v2 and re-enables deterministically', async () => {
  const p = setup(), { W, B } = p, old = W.createWorld({ seed: 217, horseCount: 8 });
  Object.assign(p.context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  vm.runInContext(fs.readFileSync(path.join(projectRoot, 'js/chairman-storage.js'), 'utf8'), p.context);
  const store = await p.rules.ChairmanStorage.open();
  try {
    await store.acquire(old.id); await store.commitChanges(null, { world: old });
    const original = await store.exportWorld(old.id);
    for (const version of [1, 2]) {
      const legacy = W.clone(original); legacy.version = version; delete legacy.world.pedigrees;
      delete legacy.records.breedingEvents; delete legacy.records.breedingYears;
      if (version === 1) { delete legacy.records.revisions; delete legacy.records.scoreDrafts; }
      assert.equal(store.validateSnapshot(legacy), true);
    }
    const enabled = B.edit(old, 'enable', { foundation: false }); await store.commitChanges(old, enabled, { checkpoint: 'turn' });
    const points = await store.query('checkpoints', old.id);
    const restored = await store.restore(enabled.world, points.rows[0].id);
    assert.equal(restored.breeding, undefined); assert.equal(restored.rngState, old.rngState);
    const again = B.edit(restored, 'enable', { foundation: false }).world;
    assert.equal(again.breeding.rngState, enabled.world.breeding.rngState);
    assert.deepEqual(json(again.horses.map((h) => [h.id,h.breeding.strength]).sort()), json(enabled.world.horses.map((h) => [h.id,h.breeding.strength]).sort()));
  } finally { await store.close(); }
});

test('CSV blank B uses final ability and resolved parents even when child precedes parents', () => {
  const { W, B, rules: n, w } = setup();
  const header = '模板版本,编号,马名,性别,出生年份,基础能力,父马编号,母马编号,配种实力\n';
  const csv = (b) => header + `1,kid,子代,牡马,-1,100,dad,mom,\n1,dad,父本,牡马,-8,62,,,${b}\n1,mom,母本,牝马,-8,62,,,${b}\n`;
  const low = n.ChairmanCSV.preview(w, 'horse', csv(1)), high = n.ChairmanCSV.preview(w, 'horse', csv(100));
  assert.deepEqual(json(low.errors), []); assert.deepEqual(json(high.errors), []);
  const a = low.output.world.horses.find((h) => h.name === '子代'), b = high.output.world.horses.find((h) => h.name === '子代');
  assert.ok(b.breeding.strength - a.breeding.strength >= 19); W.validateWorld(high.output.world);
});
