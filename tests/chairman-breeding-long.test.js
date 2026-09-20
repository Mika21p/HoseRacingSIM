const test = require('node:test'), assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { loadChairmanRules } = require('./helpers/project-loader');
const fs = require('node:fs');
test('five seeded full worlds run twenty years with genuine generation replacement and stable relationships', (t) => {
  const { rules: n } = loadChairmanRules(), W = n.ChairmanRules, B = n.ChairmanBreeding, report = [];
  for (const seed of [123, 43127, 995173, 77, 20260920]) {
    const began = performance.now(); let w = W.createWorld({ seed, breeding: true }), born = 0, prizes = 0, champions = 0;
    const motherYears = new Set(), sireCounts = new Map();
    for (let y = 1; y <= 20; y++) {
      while (w.phase !== 'yearEnd') {
        const out = W.advanceHalfMonth(w); w = out.world;
        for (const p of out.performances) { assert.ok(W.ageOf(w, B.get(w, p.horseId)) >= 2); prizes += p.prize; }
      }
      const out = W.finishYear(w); w = out.world; W.validateWorld(w);
      for (const event of out.breedingEvents) {
        const key = `${event.birthYear}:${event.motherId}`; assert.ok(!motherYears.has(key)); motherYears.add(key);
        const h = B.get(w, event.horseId); assert.equal(h.birthYear, y + 1); assert.equal(h.status, 'juvenile'); born++;
        sireCounts.set(h.fatherId, (sireCounts.get(h.fatherId) || 0) + 1);
      }
      champions += out.breedingYears.filter((s) => s.champion).length;
      if (y % 5 === 0) process.stdout.write(`seed ${seed}: year ${y}, ${w.horses.length} horses\n`);
    }
    assert.equal(born, 1500); assert.ok(w.horses.some((h) => h.sourceKind === 'bred' && h.lifetime.starts > 0));
    assert.ok(w.horses.some((h) => h.sourceKind === 'bred' && B.descendants(w, h.id, 'direct').size > 0));
    assert.ok(Math.abs(w.horses.reduce((s, h) => s + h.lifetime.prize, 0) - prizes) < .001);
    const randomParents = w.horses.filter((h) => sireCounts.has(h.id)), nonG1Sires = randomParents.filter((h) => !h.lifetime.g1);
    const largestSireShare = Math.max(...sireCounts.values()) / born;
    assert.ok(randomParents.length > 10 && nonG1Sires.length > 0 && largestSireShare < .2);
    const row = { seed, born, champions, horses: w.horses.length, active: w.horses.filter((h) => h.status === 'active').length, pedigrees: w.pedigrees.length,
      distinctSires: sireCounts.size, randomSires: randomParents.length, nonG1Sires: nonG1Sires.length, largestSireShare, ms: Math.round(performance.now() - began) };
    report.push(row); t.diagnostic(JSON.stringify(row));
  }
  fs.mkdirSync('.cache', { recursive: true }); fs.writeFileSync('.cache/breeding-world-validation.json', JSON.stringify(report, null, 2));
});

test('thirty actual generations regenerate B and retain multiple random families', (t) => {
  const { rules: n } = loadChairmanRules(), W = n.ChairmanRules, B = n.ChairmanBreeding, report = [];
  for (const seed of [582, 1731, 691]) {
    const w = W.createWorld({ blank: true, breeding: true, seed });
    let parents = Array.from({ length: 100 }, (_, i) => W.addHorse(w, { age: 5, gender: i < 50 ? '牡马' : '牝马', status: 'retired' }));
    const family = new Map(parents.map((h) => [h.id, h.id])), means = [];
    for (let generation = 0; generation < 30; generation++) {
      const next = [];
      B.seeded(w, () => {
        const males = parents.filter((h) => h.gender === '牡马'), females = parents.filter((h) => h.gender === '牝马');
        for (let i = 0; i < 100; i++) {
          const f = n.Random.pickOne(males), m = n.Random.pickOne(females);
          // This isolates genetic transmission; legality and population selection run in the twenty-year test.
          const h = W.addHorse(w, { ...B.inherited(w, f, m), age: 2, fatherId: f.id, motherId: m.id, gender: i < 50 ? '牡马' : '牝马' });
          family.set(h.id, family.get(f.id)); next.push(h);
        }
      });
      means.push(next.reduce((s, h) => s + h.strength, 0) / next.length); parents = next;
    }
    const early = means.slice(0, 5).reduce((s, v) => s + v, 0) / 5, late = means.slice(-5).reduce((s, v) => s + v, 0) / 5;
    const families = new Set(parents.map((h) => family.get(h.id))).size;
    assert.ok(Math.abs(late - early) < 3); assert.ok(families > 1);
    report.push({ seed, early, late, paternalFamilies: families, finalMeanB: parents.reduce((s, h) => s + h.breeding.strength, 0) / 100 });
  }
  fs.writeFileSync('.cache/breeding-generations-validation.json', JSON.stringify(report, null, 2)); t.diagnostic(JSON.stringify(report));
});
test('thirty generations across seeds show overlapping B distributions without generation-by-generation ability accumulation', (t) => {
  const { rules: n } = loadChairmanRules(), W = n.ChairmanRules, B = n.ChairmanBreeding, report = [];
  for (const seed of [182, 761, 4421]) {
    const w = W.createWorld({ blank: true, seed, breeding: true });
    const f = W.addHorse(w, { gender: '牡马' }), m = W.addHorse(w, { gender: '牝马' });
    for (const strength of [20, 50, 90]) {
      f.breeding.strength = m.breeding.strength = strength; const means = [], values = [];
      for (let generation = 0; generation < 30; generation++) {
        let sum = 0;
        B.seeded(w, () => { for (let i = 0; i < 200; i++) { const h = B.inherited(w, f, m); sum += h.strength; values.push(h.strength); f.strength = h.strength; m.strength = h.strength; } });
        means.push(sum / 200);
      }
      values.sort((a, b) => a - b);
      const row = { seed, B: strength, mean: values.reduce((s, v) => s + v, 0) / values.length, p10: values[Math.floor(values.length * .1)], p90: values[Math.floor(values.length * .9)], tail95: values.filter((v) => v >= 95).length / values.length, early: means.slice(0, 5).reduce((s, v) => s + v) / 5, late: means.slice(-5).reduce((s, v) => s + v) / 5 };
      assert.ok(Math.abs(row.early - row.late) < 1.5); report.push(row);
    }
  }
  for (const seed of [182, 761, 4421]) { const [low, mid, high] = report.filter((v) => v.seed === seed); assert.ok(low.mean < mid.mean && mid.mean < high.mean); assert.ok(low.p90 > high.p10); assert.ok(high.tail95 > low.tail95); }
  fs.mkdirSync('.cache', { recursive: true }); fs.writeFileSync('.cache/breeding-distribution-validation.json', JSON.stringify(report, null, 2)); t.diagnostic(JSON.stringify(report));
});
