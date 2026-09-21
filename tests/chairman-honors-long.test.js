const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { loadChairmanRules } = require('./helpers/project-loader');
test('five seeded worlds complete twenty years of councils, local awards and hall recognition', t => {
  const { rules: n } = loadChairmanRules(), W = n.ChairmanRules, H = n.ChairmanHonors, report = [];
  for (const seed of [123, 43127, 995173, 77, 20260920]) {
    let w = W.createWorld({ seed }); const started = Date.now(), stats = { seed, rounds: 0, ballots: 0, centralAwards: 0, localAwards: 0, inductions: 0 };
    for (const scope of ['central', 'japan', 'europe', 'northAmerica']) {
      w = H.edit(w, 'type', { name: `${scope}玩家理事`, scope, regionId: scope === 'central' ? 'japan' : scope, enabled: true, count: scope === 'central' ? 30 : 12, weight: 1.25,
        motives: { g1: 20, rating: 20, prize: 10, winRate: 10, honor: 10, local: 5, continuity: 10, random: 10, abstain: 5 },
        affinities: { 短途: 60, 英里: 20, 中距离: 0, 中长距离: -10, 长距离: -20, 超长距离: -40, 草地: 30, 泥地: -20 } }).world;
    }
    w = H.edit(w, 'settings', { threshold: 60, autoHall: true }).world;
    const inducted = new Set(), awards = new Set();
    for (let y = 1; y <= 20; y++) {
      let end;
      while (w.phase !== 'yearEnd') { end = W.advanceHalfMonth(w); w = end.world; }
      assert.equal(end.councilRounds.length, 49); stats.rounds += end.councilRounds.length; stats.ballots += end.councilVotes.length;
      for (const r of end.councilRounds) {
        const expected = new Set(H.getHonorCandidates(w, r.scope, r.awardId).map(h => h.id));
        for (const h of r.candidates) assert.ok(expected.has(h.id) || r.awardId === 'hall' && H.profile(w, h.id).induction);
      }
      for (const event of end.hallEvents || []) { assert.ok(!inducted.has(event.horseId)); inducted.add(event.horseId); stats.inductions++; }
      w = H.applyBallotSuggestions(w, end.councilRounds.filter(r => r.awardId !== 'hall')).world;
      const out = W.finishYear(w); w = out.world;
      for (const a of out.awards) { assert.ok(!awards.has(a.id)); awards.add(a.id); if (!a.scope || a.scope === 'central') stats.centralAwards++; else stats.localAwards++; }
      assert.equal(Object.keys(w.honors.latest).length, 0); assert.equal(w.honors.closedYear, y); W.validateWorld(w);
      if (y % 5 === 0) process.stdout.write(`honor seed ${seed}: year ${y}, ${stats.rounds} rounds\n`);
    }
    assert.ok(stats.centralAwards > 0 && stats.localAwards > 0); stats.ms = Date.now() - started; report.push(stats); t.diagnostic(JSON.stringify(stats));
  }
  fs.mkdirSync('.cache', { recursive: true }); fs.writeFileSync('.cache/honors-long-validation.json', JSON.stringify(report, null, 2));
});
