const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const files = ['js/utils/random.js', 'js/rules/horse-generator.js', 'js/rules/bloodline-system.js', 'js/data/bloodline-lab-fixtures.js'];
const json = value => JSON.parse(JSON.stringify(value));
function load() {
  const context = vm.createContext({ window: { Keiba: {} } });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }));
  const n = context.window.Keiba, B = n.BloodlineSystem, data = n.BloodlineLabFixtures;
  return { n, B, data, library: B.createLibrary(data.records, data.nicks) };
}
const signature = h => Object.values(h.trackAptitudes).sort().join('');
const legal = new Set([['○', '○', '△'], ['◎', '△', '△'], ['◎', '○', '△'], ['○', '○', '○'], ['◎', '○', '○'], ['◎', '◎', '△'], ['◎', '◎', '○']].map(a => a.sort().join('')));
const pilotFiles = [...files, 'js/data/chairman-pedigrees.js', 'js/data/bloodline-pilot.js'];
function loadPilot() {
  const context = vm.createContext({ window: { Keiba: {} } });
  pilotFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context));
  const n = context.window.Keiba, B = n.BloodlineSystem, data = n.BloodlinePilot;
  return { n, B, data, library: B.createLibrary(data.records, data.nicks) };
}

test('血统库拒绝重复编号、循环与错误赋值，资料缺失不能产生异系奖励', () => {
  const { B, data, library } = load();
  assert.throws(() => B.createLibrary([data.records[0], data.records[0]]), /重复/);
  assert.throws(() => B.createLibrary([{ id: 'a', gender: '牡马', fatherId: 'a' }]), /循环/);
  assert.throws(() => B.createLibrary([{ id: 'a', gender: '牡马', genetics: { quality: 101 } }]), /quality/);
  assert.throws(() => B.createLibrary([{ id: 'a', gender: '牡马', genetics: { distance: { min: 2000, core: 1600, max: 2400 } } }]), /距离/);
  const p = B.createPair(library, 'sire-burst', 'mare-unknown').preview;
  assert.equal(p.coverage.known, 16);
  assert.equal(p.risk.level, '资料不足');
  assert.ok(!p.theories.some(t => t.id === 'diversity'));
  assert.equal(p.ability.qualityKnown, 1);
});

test('四代按幼驹计数，共同祖先去重，过近亲缘阻止生成', () => {
  const { B, library } = load();
  const p = B.createPair(library, 'sire-burst', 'mare-cross').preview;
  assert.equal(p.coverage.known, 30);
  assert.ok(p.commonAncestors.some(c => c.notation === '3×3'));
  assert.equal(new Set(p.commonAncestors.map(c => c.id)).size, p.commonAncestors.length);
  assert.equal(p.risk.level, '高');
  assert.equal(p.legal, true);
  assert.equal(new Set(p.factorSources.map(s => s.id + s.trait)).size, p.factorSources.length);
  const close = B.createLibrary([
    { id: 'ancestor', gender: '牡马' }, { id: 'f', gender: '牡马', fatherId: 'ancestor' }, { id: 'm', gender: '牝马', fatherId: 'ancestor' }
  ]);
  const prohibited = B.createPair(close, 'f', 'm');
  assert.equal(prohibited.preview.legal, false);
  assert.throws(() => prohibited.generate({ seed: 1 }), /近亲/);
});

test('血系相性读取母父，多样性需要可证实的六种祖系，祖先重复强化有上限', () => {
  const { B, data } = load();
  const rows = json(data.records);
  // 幼驹第三代8个槽位，明确赋予互异血系。
  const ids = ['sire-burst-f-f', 'sire-burst-f-m', 'sire-burst-m-f', 'sire-burst-m-m',
    'mare-sustained-f-f', 'mare-sustained-f-m', 'mare-sustained-m-f', 'mare-sustained-m-m'];
  ids.forEach((id, i) => rows.find(r => r.id === id).genetics.lineId = `diverse-${i}`);
  const p = B.createPair(B.createLibrary(rows, data.nicks), 'sire-burst', 'mare-sustained', 'chairman').preview;
  assert.ok(p.theories.some(t => t.id === 'nick'));
  assert.ok(p.theories.some(t => t.id === 'diversity'));
  assert.ok(p.ability.theoryBonus <= B.MODES.chairman.theoryAbilityCap);
  rows.find(r => r.id === ids[0]).genetics.lineId = null;
  assert.ok(!B.createPair(B.createLibrary(rows, data.nicks), 'sire-burst', 'mare-sustained').preview.theories.some(t => t.id === 'diversity'));
});

test('预览不消耗随机数，不修改输入；同种子结果一致，出生快照不跟随资料修改', () => {
  const { B, n, data, library } = load(), before = JSON.stringify(data);
  const random = n.Random.seeded(72), state = random.state();
  const p = n.Random.withSource(random, () => B.createPair(library, 'sire-burst', 'mare-sustained'));
  assert.equal(random.state(), state);
  const child = p.generate({ seed: 10 });
  assert.deepEqual(json(child), json(p.generate({ seed: 10 })));
  assert.equal(JSON.stringify(data), before);
  const saved = JSON.stringify(child.pedigree);
  data.records[0].genetics.quality = 1;
  assert.equal(JSON.stringify(child.pedigree), saved);
  assert.equal(library.get('sire-burst').genetics.quality, 80);
  assert.throws(() => p.generate({ seed: -1 }), /种子/);
});

test('相同配合下，常规能力与组合概率不受父母繁殖素质影响', () => {
  const { B, library } = load();
  const high = B.createPair(library, 'sire-burst', 'mare-sustained');
  const low = B.createPair(library, 'sire-burst-low', 'mare-sustained-low');
  const cross = B.createPair(library, 'sire-burst', 'mare-cross');
  for (let seed = 0; seed < 300; seed++) {
    const a = high.generate({ seed }), b = low.generate({ seed });
    assert.equal(a.strength, b.strength);
    assert.equal(a.strength, cross.generate({ seed }).strength);
    assert.equal(signature(a), signature(b));
  }
});

test('主席素质明显影响分布而非锁死上限；子代素质回归且不叠加赛绩能力', () => {
  const { B, library } = load();
  const high = B.createPair(library, 'sire-burst', 'mare-sustained', 'chairman');
  const low = B.createPair(library, 'sire-burst-low', 'mare-sustained-low', 'chairman');
  let hi = 0, lo = 0, childQuality = 0, lowTop = 0;
  for (let seed = 0; seed < 1000; seed++) {
    const a = high.generate({ seed }), b = low.generate({ seed });
    hi += a.strength; lo += b.strength; childQuality += a.genetics.quality;
    if (b.strength >= 95) lowTop++;
    for (const h of [a, b]) {
      assert.ok(h.strength >= 62 && h.strength <= 100);
      assert.ok(legal.has(signature(h)));
      assert.ok(['A', 'B'].includes(h.surfaceGrades.grass) || ['A', 'B'].includes(h.surfaceGrades.dirt));
      assert.ok(h.distMin <= h.coreDist && h.coreDist <= h.distMax);
    }
  }
  assert.ok((hi - lo) / 1000 > 8);
  assert.ok(lowTop > 0);
  assert.ok(childQuality / 1000 > 60 && childQuality / 1000 < 75);
  // 不把存档中的比赛能力当作繁殖素质；高素质父母的子代仍可继续参与统一规则。
  const rows = json(library.records); rows.find(r => r.id === 'sire-burst').strength = 999;
  const changed = B.createPair(B.createLibrary(rows, [{ sireLine: 'line-main', broodmareSireLine: 'line-1' }]), 'sire-burst', 'mare-sustained', 'chairman');
  assert.equal(high.generate({ seed: 24 }).strength, changed.generate({ seed: 24 }).strength);
});

test('新生个体再次配种不递归保存整棵出生快照', () => {
  const { B, data, library } = load();
  const child = B.createPair(library, 'sire-burst', 'mare-sustained', 'chairman').generate({ seed: 3, childId: 'child' });
  child.gender = '牡马';
  const pair = B.createPair(B.createLibrary([...data.records, child]), 'child', 'mare-burst', 'chairman');
  const next = pair.generate({ seed: 4 });
  assert.equal(next.pedigree.parents[0].id, 'child');
  assert.equal(next.pedigree.parents[0].pedigree, undefined);
  assert.equal(next.pedigree.ancestors.length, 30);
});

test('验证页支持模式、未知系谱、生成与批量比较，不写正式存档', () => {
  const dom = new JSDOM('<main id="bloodlineLab"></main>', { runScripts: 'outside-only', url: 'https://bloodline.test/' });
  const context = dom.getInternalVMContext();
  [...files, 'js/ui/pedigree-tree.js', 'js/bloodline-lab.js'].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }));
  const doc = dom.window.document;
  assert.match(doc.body.textContent, /虚构马匹/);
  doc.querySelector('[data-action="generate"]').click();
  assert.match(doc.querySelector('#offspring').textContent, /后代结果/);
  doc.querySelector('[data-action="sample"]').click();
  assert.match(doc.querySelector('#sampleResult').textContent, /平均基础能力/);
  const mother = doc.querySelector('[name="mother"]'); mother.value = 'mare-unknown';
  mother.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.match(doc.querySelector('#pairPreview').textContent, /资料不足/);
  doc.querySelector('[name="seed"]').value = '-1'; doc.querySelector('[data-action="generate"]').click();
  assert.match(doc.querySelector('#labError').textContent, /种子/);
  assert.equal(dom.window.localStorage.length, 0);
  dom.window.close();
});

test('史实试验层只引用现有马，保留原始系谱库，六组合法与两组近亲拦截符合预期', () => {
  const { n, B, data, library } = loadPilot();
  const original = JSON.parse(fs.readFileSync(path.join(root, 'js/data/chairman-pedigrees.json'), 'utf8'));
  assert.deepEqual(json(n.ChairmanPedigrees.records), original.records);
  assert.equal(data.roots.length, 12); assert.equal(data.assignments.length, 26);
  for (const r of data.assignments) assert.ok(original.records.some(o => o.id === r.id));
  for (const s of data.scenarios) {
    const pair = B.createPair(library, s.fatherId, s.motherId);
    assert.equal(pair.preview.legal, !s.blocked);
    if (s.blocked) assert.throws(() => pair.generate({ seed: 1 }), /近亲/);
  }
  const p = B.createPair(library, data.scenarios[5].fatherId, data.scenarios[5].motherId).preview;
  assert.equal(p.coverage.known, 28); assert.ok(!p.theories.some(t => t.id === 'diversity'));
});

test('母父相性与重复祖先增加实际方向权重；关闭配合不改变父母和亲缘风险', () => {
  const { B, data, library } = loadPilot();
  for (const [index, theory, trait] of [[0, 'nick', 'sustained'], [3, 'ancestor', 'attrition']]) {
    const s = data.scenarios[index];
    const on = B.createPair(library, s.fatherId, s.motherId), off = B.createPair(library, s.fatherId, s.motherId, 'normal', { disabledTheories: [theory] });
    assert.ok(on.preview.theories.some(t => t.id === theory));
    assert.ok(on.preview.directionWeights[trait] > off.preview.directionWeights[trait]);
    assert.deepEqual(on.preview.risk, off.preview.risk);
    let changed = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const a = on.generate({ seed }), b = off.generate({ seed });
      assert.equal(a.breedingOutcome.rawStrength, b.breedingOutcome.rawStrength);
      assert.ok(a.strength >= b.strength && a.strength - b.strength <= 1);
      if (JSON.stringify(a.trackAptitudes) !== JSON.stringify(b.trackAptitudes)) changed++;
    }
    assert.ok(changed > 0);
  }
});

test('专精互补提高优秀池4个百分点，共用组合抽取而不追加升级', () => {
  const { B, data, library } = loadPilot();
  for (const mode of ['normal', 'chairman']) for (const [index, theory] of [[0, 'complement'], [1, 'specialization']]) {
    const s = data.scenarios[index], on = B.createPair(library, s.fatherId, s.motherId, mode), off = B.createPair(library, s.fatherId, s.motherId, mode, { disabledTheories: [theory] });
    assert.ok(Math.abs(on.preview.trackPlan.excellentChance - off.preview.trackPlan.excellentChance - .04) < 1e-10);
    assert.equal(on.preview.trackPlan.kind, index === 0 ? 'different' : 'same');
    let improved = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const a = on.generate({ seed }), b = off.generate({ seed });
      if (mode === 'chairman') assert.equal(a.strength, b.strength);
      else { assert.equal(a.breedingOutcome.rawStrength, b.breedingOutcome.rawStrength); assert.ok(a.strength >= b.strength); }
      assert.ok(legal.has(signature(a)));
      assert.equal([...a.breedingOutcome.pattern].sort().join(''), signature(a));
      if (a.breedingOutcome.excellent && !b.breedingOutcome.excellent) improved++;
    }
    assert.ok(improved > 0, `${mode}/${theory}应能实际改善至少一匹后代`);
  }
  const s = data.scenarios[0], onlyParents = library.records.filter(r => [s.fatherId, s.motherId].includes(r.id));
  const p = B.createPair(B.createLibrary(onlyParents), s.fatherId, s.motherId).preview;
  assert.equal(p.trackPlan.kind, 'different');
  assert.equal(p.trackPlan.excellentChance, .08);
});

test('组合基础表、双倍加成、满配上限与400种骰点的能力均值符合方案', () => {
  const { n, cases } = require('./helpers/bloodline-v2-fixtures').load();
  const byId = Object.fromEntries(cases.map(c => [c.id, c.pair]));
  const expected = { 'same-none': [.5, .2], 'different-none': [.2, .5], 'mixed-none': [.35, .35] };
  for (const [id, values] of Object.entries(expected)) {
    const rows = byId[id].preview.trackPlan.combinations;
    assert.ok(Math.abs(rows.find(r => r.pattern === '◎△△').probability - values[0]) < 1e-10);
    assert.ok(Math.abs(rows.find(r => r.pattern === '○○△').probability - values[1]) < 1e-10);
  }
  for (const { pair } of cases) {
    const p = pair.preview;
    assert.ok(p.trackPlan.excellentChance <= .2 + 1e-10);
    assert.ok(Math.abs(p.trackPlan.combinations.reduce((sum, r) => sum + r.probability, 0) - 1) < 1e-10);
    assert.equal(p.trackPlan.combinations[0].probability, .22);
    assert.ok(p.ability.theoryBonus <= 2); assert.ok(p.ability.floor <= 74);
  }
  assert.equal(byId.full.preview.trackPlan.excellentChance, .2);
  assert.equal(byId.full.preview.ability.finalMinimum, 70);
  const original = n.HorseRules.generateHorse;
  try {
    for (const [id, expectedMean, minimum] of [['same-none', 81, 62], ['nick', 81.9975, 63], ['complement', 81.175, 66], ['diversity', 81.5075, 68], ['full', 83.4975, 70]]) {
      let sum = 0, min = 101, max = 0;
      for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) {
        n.HorseRules.generateHorse = options => ({ ...original(options), strength: a + b + 60 });
        const h = byId[id].generate({ seed: a * 20 + b }); sum += h.strength; min = Math.min(min, h.strength); max = Math.max(max, h.strength);
      }
      assert.equal(sum / 400, expectedMean, id); assert.equal(min, minimum); assert.equal(max, 100);
    }
  } finally { n.HorseRules.generateHorse = original; }
});

test('软保底只补回一半差距，低点仍有差异，不改高分且不消耗额外随机数', () => {
  const { n, cases } = require('./helpers/bloodline-v2-fixtures').load();
  const full = cases.find(c => c.id === 'full').pair, none = cases.find(c => c.id === 'different-none').pair;
  const original = n.HorseRules.generateHorse;
  try {
    for (const [raw, expected] of [[62, 70], [63, 71], [66, 72], [70, 74], [73, 76], [74, 76], [80, 82], [99, 100], [100, 100]]) {
      n.HorseRules.generateHorse = options => ({ ...original(options), strength: raw });
      const rngA = n.Random.seeded(31), rngB = n.Random.seeded(31);
      const h = n.Random.withSource(rngA, () => full.generate());
      n.Random.withSource(rngB, () => none.generate());
      assert.equal(h.strength, expected); assert.equal(h.breedingOutcome.protection, 'half-gap-rounded');
      assert.equal(h.breedingOutcome.protectionGain, expected === 100 ? 0 : expected - raw - 2);
      assert.equal(rngA.state(), rngB.state());
      if (raw >= 74) assert.equal(h.breedingOutcome.protectionGain, 0);
    }
  } finally { n.HorseRules.generateHorse = original; }
});

test('3×3不能借更远重复祖先获得速度与优秀池奖励，风险不因关闭理论消失', () => {
  const { B, library } = load();
  for (const mode of ['normal', 'chairman']) {
    const on = B.createPair(library, 'sire-burst', 'mare-cross', mode), off = B.createPair(library, 'sire-burst', 'mare-cross', mode, { disabledTheories: ['ancestor'] });
    assert.equal(on.preview.risk.level, '高');
    assert.ok(on.preview.theories.some(t => t.id === 'ancestor'));
    assert.equal(on.preview.trackPlan.excellentChance, off.preview.trackPlan.excellentChance);
    assert.equal(on.preview.ability.theoryBonus, off.preview.ability.theoryBonus);
    assert.deepEqual(on.preview.risk, off.preview.risk);
  }
});

test('两模式实际抽样符合七种组合概率，同专精与互补方向均有可见倾向', () => {
  const { B, cases, basic } = require('./helpers/bloodline-v2-fixtures').load();
  for (const mode of ['normal', 'chairman']) for (const c of cases.filter(c => ['same-none', 'different-none', 'full'].includes(c.id))) {
    const pair = mode === 'normal' ? c.pair : B.createPair(c.library, 'sire-burst', c.mother || 'mare-sustained', mode, { disabledTheories: ['nick', 'specialization', 'complement', 'ancestor', 'diversity'].filter(t => !c.active.includes(t)) });
    const counts = Object.fromEntries(pair.preview.trackPlan.combinations.map(r => [r.pattern, 0])); let aligned = 0, eligible = 0;
    for (let seed = 0; seed < 4000; seed++) {
      const h = pair.generate({ seed }); counts[h.breedingOutcome.pattern]++;
      assert.ok(legal.has(signature(h)));
      if (c.id === 'same-none' && h.breedingOutcome.pattern === '◎△△') { eligible++; aligned += h.trackAptitudes.burst === '◎'; }
      if (c.id === 'different-none' && h.breedingOutcome.pattern === '○○△') { eligible++; aligned += h.trackAptitudes.burst === '○' && h.trackAptitudes.sustained === '○'; }
    }
    for (const r of pair.preview.trackPlan.combinations) assert.ok(Math.abs(counts[r.pattern] / 4000 - r.probability) < .03, `${mode}/${c.id}/${r.pattern}`);
    if (eligible) assert.ok(aligned / eligible > .7);
  }
  // 无◎与双◎都进入中间档；只改变父母表现，不伪造祖先奖励。
  for (const track of [{ burst: '○', sustained: '○', attrition: '○' }, { burst: '◎', sustained: '◎', attrition: '△' }]) {
    const rows = json(basic.records); rows.find(r => r.id === 'sire-burst').genetics.trackAptitudes = track;
    const p = B.createPair(B.createLibrary(rows), 'sire-burst', 'mare-sustained').preview;
    assert.equal(p.trackPlan.kind, 'mixed'); assert.equal(p.trackPlan.excellentChance, .08);
  }
});

test('真实库试验页支持情景切换、理论说明高亮、禁配与虚构对照', () => {
  const dom = new JSDOM('<main id="bloodlineLab"></main>', { runScripts: 'outside-only', url: 'https://bloodline.test/' });
  for (const file of [...pilotFiles, 'js/ui/pedigree-tree.js', 'js/bloodline-lab.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), dom.getInternalVMContext());
  const doc = dom.window.document, change = (name, value) => { const el = doc.querySelector(`[name="${name}"]`); el.value = value; el.dispatchEvent(new dom.window.Event('change', { bubbles: true })); };
  assert.match(doc.body.textContent, /12匹父母/);
  doc.querySelector('[data-theory="nick"]').click();
  assert.match(doc.querySelector('#theoryDetail').textContent, /母父的赛道因子/);
  assert.ok(doc.querySelector('#pedigreeTable').open); assert.ok(doc.querySelectorAll('.participant').length >= 3);
  change('scenario', '6'); assert.ok(doc.querySelector('[data-action="generate"]').disabled);
  assert.match(doc.querySelector('#pairPreview').textContent, /不能配种/);
  change('scenario', '3'); assert.ok(!doc.querySelector('[data-action="generate"]').disabled);
  doc.querySelector('[data-action="generate"]').click(); assert.match(doc.querySelector('#offspring').textContent, /后代结果/);
  change('dataset', 'fictional'); assert.equal(doc.querySelector('[name="father"]').value, 'sire-burst');
  assert.equal(dom.window.localStorage.length, 0); dom.window.close();
});
