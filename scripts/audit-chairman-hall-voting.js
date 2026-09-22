// Reproducible comparison against the pre-V2 implementation, using the same current world data.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { project, W, H, fixture, config, council, vote } = require('../tests/helpers/hall-vote-fixture');
const baselineRef = process.env.HALL_BASELINE_REF || '9152154365c60dfefc0f1b303b4c8453d7b9b2a8';
const source = execFileSync('git', ['show', `${baselineRef}:js/rules/chairman-honors.js`], { encoding: 'utf8' });
vm.runInContext(source, project.context); const old = project.rules.ChairmanHonors; project.rules.ChairmanHonors = H;
function run(engine, world) {
  const w = W.clone(world), out = { world: w }; let chunks = 0;
  const start = performance.now(); for (const p of engine.buildCouncilBallot(w, out)) { chunks++; void p; }
  return { out, chunks, ms: performance.now() - start };
}
function summary(out) {
  const r = out.councilRounds[0], counts = Object.values(r.tallies).sort((a, b) => b - a), cast = counts.reduce((s, n) => s + n, 0);
  return { candidates: counts.length, supported: counts.filter(n => n > 0).length, highestSupport: (counts[0] || 0) / r.totalUnits,
    topThreeVoteShare: cast ? counts.slice(0, 3).reduce((s, n) => s + n, 0) / cast : 0, unfilledSlotRate: 1 - cast / (3 * r.totalUnits) };
}
(async () => {
  const report = { baselineRef, seeds: [1, 42, 18349, 20260921], reproduction: [], performance: [] };
  for (const seed of report.seeds) for (const count of [3, 10, 30, 100]) {
    const w = council(fixture(count, seed)); const legacy = run(old, w), current = run(H, w), leader = w.horses[0].id;
    const row = { seed, candidates: count, old: summary(legacy.out), current: summary(current.out),
      oldLeaderSupport: legacy.out.councilRounds[0].tallies[leader] / 100000, currentLeaderSupport: current.out.councilRounds[0].tallies[leader] / 100000 };
    assert.equal(row.currentLeaderSupport, 1); report.reproduction.push(row);
  }
  const large = fixture(10000);
  // A crowded qualified cohort stresses scoring and random ranking, not just the fast quality rejection path.
  for (let i = 0; i < large.horses.length; i++) {
    const h = large.horses[i]; h.lifetime = { starts: 30, wins: 10 + i % 11, g1: 6 + i % 15, prize: 10000 + i % 1000 };
    h.annual.manual = 124 + i % 17; H.profile(large, h.id).honor = 6 + i % 7;
  }
  for (const typeCount of [1, 1000]) {
    const w = W.clone(large); w.councilTypes = Array.from({ length: typeCount }, (_, i) => ({
      ...config({ g1: 40 + (i % 31) / 10, rating: 30 - (i % 31) / 10, honor: 10, random: 15, abstain: 5 },
        { name: `负载${i}`, count: 1000 / typeCount, affinities: Object.fromEntries(H.affinities.map((k, j) => [k, ((i + j * 23) % 201) - 100])) }),
      id: `perf-type-${i}`, members: Array.from({ length: 1000 / typeCount }, (_, j) => `perf-member-${i}-${j}`) }));
    const measurements = [];
    for (let trial = 0; trial < 3; trial++) {
      const engines = trial % 2 ? [H, old] : [old, H], timings = {};
      for (const engine of engines) { const result = run(engine, w); timings[engine === old ? 'oldMs' : 'currentMs'] = Math.round(result.ms); assert.equal(result.chunks, 10); }
      measurements.push(timings);
      process.stdout.write(`hall performance types=${typeCount} trial=${trial + 1}: ${JSON.stringify(timings)}\n`);
    }
    const median = key => measurements.map(r => r[key]).sort((a, b) => a - b)[1], ratio = median('currentMs') / median('oldMs');
    report.performance.push({ horses: 10000, directors: 1000, types: typeCount, measurements, ratio, withinTwoTimes: ratio <= 2 });
    project.context.setTimeout = setTimeout;
    let cancelled = false, progress = 0; const before = JSON.stringify(w), scratch = W.mutate(w, () => {});
    await assert.rejects(H.consume(H.buildCouncilBallot(scratch.world, scratch), () => { cancelled = true; progress++; }, () => cancelled), /取消/);
    assert.equal(progress, 1); assert.equal(JSON.stringify(w), before);
  }
  fs.mkdirSync('artifacts', { recursive: true }); fs.writeFileSync('artifacts/hall-v2-audit.json', JSON.stringify(report, null, 2) + '\n');
  assert(report.performance.every(p => p.withinTwoTimes), 'New hall voting exceeded twice the legacy median duration');
  console.log(JSON.stringify(report.performance));
})().catch(error => { console.error(error); process.exitCode = 1; });
