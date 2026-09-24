(function () {
  'use strict';
  const ns = window.Keiba;
  let library;
  const clone = value => JSON.parse(JSON.stringify(value));
  function getLibrary() { return library || (library = ns.BloodlineSystem.createLibrary(ns.BloodlineCatalog.records, ns.BloodlineCatalog.nicks)); }
  function parents(gender) { return getLibrary().records.filter(r => r.core && r.gender === gender); }
  function pair(fatherId, motherId, mode = 'normal') { return ns.BloodlineSystem.createPair(getLibrary(), fatherId, motherId, mode); }
  function randomPair() {
    const fathers = parents('牡马'), mothers = parents('牝马');
    // Rejection sampling is uniform over legal pairs, without rewarding particular theories.
    for (let i = 0; i < 1000; i++) {
      const father = ns.Random.pickOne(fathers), mother = ns.Random.pickOne(mothers);
      if (pair(father.id, mother.id).preview.legal) return [father.id, mother.id];
    }
    const legal = [];
    for (const f of fathers) for (const m of mothers) if (pair(f.id, m.id).preview.legal) legal.push([f.id, m.id]);
    if (!legal.length) throw new Error('暂无合法配合。');
    return ns.Random.pickOne(legal);
  }
  function generate(options) {
    const mode = options.gameMode === 'legend' ? 'legend' : 'normal';
    const compiled = pair(options.sireId, options.damId, mode);
    const horse = compiled.generate({ name: options.name, seed: options.seed,
      childId: window.crypto?.randomUUID?.() || `career-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    const lines = new Map(ns.BloodlineCatalog.lines.map(l => [l.id, l.label]));
    horse.pedigree.ancestors = horse.pedigree.ancestors.map(a => ({ ...a,
      lineLabel: lines.get(a.lineId) || '未知', factors: clone(getLibrary().get(a.id)?.genetics.factors || []) }));
    horse.pedigree.commonAncestors = clone(compiled.preview.commonAncestors);
    horse.pedigree.directionWeights = clone(compiled.preview.directionWeights);
    horse.gameMode = mode;
    return horse;
  }
  ns.CareerBloodline = { getLibrary, parents, pair, randomPair, generate };
})();
