const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
const { project, W, H, plain, fixture, config, council, vote } = require('./helpers/hall-vote-fixture');
const tallies = out => plain(out.councilRounds[0].tallies);
const selections = out => plain(out.councilVotes.map(v => v.slots.map(s => s.horseId)));
const records = out => ({ councilRounds: out.councilRounds, councilVotes: out.councilVotes, hallEvents: out.hallEvents || [] });

test('a 20-G1 standout has unanimous support independent of 3 to 1000 candidates and council type splitting', () => {
  for (const count of [3, 10, 30, 100, 1000]) {
    let w = fixture(count); w.horses.forEach(h => { h.annual.manual = null; H.profile(w, h.id).honor = 0; });
    const single = vote(council(w)), leader = w.horses[0].id;
    assert.equal(tallies(single)[leader], 100000);
    assert.equal(Object.values(tallies(single)).reduce((s, n) => s + n, 0), 100000);
    assert(single.councilVotes.every(v => v.slots[0].horseId === leader && v.slots.slice(1).every(s => !s.horseId)));
    let split = w; for (let i = 0; i < 10; i++) split = council(split, { g1: 100 }, { count: 100 });
    assert.deepEqual(tallies(vote(split)), tallies(single));
    H.validateHistory(single.world, records(single));
  }
});

test('all five achievement motives agree on an all-round standout; candidate order, irrelevant horses and hidden traits do not affect votes', () => {
  for (const weights of [{ g1: 100 }, { rating: 100 }, { honor: 100 }, { prize: 100 }, { winRate: 100 }, H.defaultHallMotives()]) {
    const w = council(fixture(), weights), before = vote(w);
    assert.equal(tallies(before)[w.horses[0].id], 100000);
    const reversed = W.clone(w); reversed.horses.reverse(); reversed.horses.forEach(h => { h.strength = 1; h.peakStart = ''; });
    assert.deepEqual(selections(vote(reversed)), selections(before));
  }
  const w = council(fixture(3), { g1: 40, random: 40, abstain: 20 }), before = vote(w);
  const expanded = W.clone(w);
  W.seeded(expanded, () => { for (let i = 0; i < 100; i++) { const h = W.addHorse(expanded, { age: 5, status: 'retired' }); h.lifetime = { starts: 10, wins: 1, g1: 1, prize: 100 }; } });
  assert.deepEqual(plain(vote(expanded).councilVotes), plain(before.councilVotes));
});

test('fixed scales preserve gaps, missing and zero metrics; prize and small-sample win rate cannot bypass quality', () => {
  assert.equal(H.hallMetrics({ g1: 6 }).g1, 60); assert.equal(H.hallMetrics({ rating: 124 }).rating, 60);
  assert.equal(H.hallMetrics({ honor: 6 }).honor, 60); assert.equal(H.hallMetrics({ starts: 4, wins: 4 }).winRate, 0);
  assert.equal(H.hallMetrics({ rating: 0 }).rating, 0); assert.equal(H.hallMetrics({ rating: null }).rating, 0);
  assert(H.hallMetrics({ g1: 200 }).g1 > H.hallMetrics({ g1: 20 }).g1);
  for (const key of ['g1', 'honor', 'rating', 'prize']) { let previous = 0; for (let x = 0; x <= 200; x++) { const next = H.hallMetrics({ [key]: x })[key]; assert(next >= previous && next <= 100); previous = next; } }
  const w = fixture(3); w.horses.forEach(h => { h.annual.manual = null; h.lifetime = { starts: 4, wins: 4, g1: 1, prize: 1e9 }; H.profile(w, h.id).honor = 0; });
  for (const key of ['prize', 'winRate']) assert(Object.values(tallies(vote(council(w, { [key]: 100 })))).every(n => n === 0));
  const missing = fixture(1); missing.horses[0].annual.manual = null;
  const out = vote(council(missing, { g1: 50, rating: 50 }));
  assert.equal(out.councilVotes[0].slots[0].score.base, H.hallMetrics({ g1: 20 }).g1 / 2);
});

test('three close leaders are all supported, ordinary cohorts abstain and nominations do not override quality', () => {
  const w = fixture(30); [12, 10, 8].forEach((n, i) => { w.horses[i].lifetime.g1 = w.horses[i].lifetime.wins = n; });
  const result = vote(council(w)); for (const h of w.horses.slice(0, 3)) assert.equal(tallies(result)[h.id], 100000);
  w.horses.forEach(h => { h.lifetime.g1 = 1; h.annual.manual = 105; H.profile(w, h.id).honor = 0; });
  const nominated = H.edit(w, 'nominate', { id: w.horses[0].id }).world;
  assert(Object.values(tallies(vote(council(nominated)))).every(n => n === 0));
  const excluded = H.edit(fixture(), 'exclude', { id: w.horses[0].id, excluded: true }).world;
  assert(!Object.hasOwn(tallies(vote(council(excluded))), w.horses[0].id));
});

test('local and continuity extremes remain decisive even with positive affinity, while mixed missing history falls back', () => {
  let w = fixture(3); const [star, local, weak] = w.horses;
  local.annual.manual = 130; local.lifetime.g1 = local.lifetime.wins = 8;
  H.profile(w, local.id).retiredRegionId = 'europe';
  for (const h of w.horses) { const p = H.profile(w, h.id); p.distance.短途 = 1; p.surface.草地 = 1; }
  const opts = { count: 100, regionId: 'europe', affinities: { ...config().affinities, 短途: 100, 草地: 100 } };
  const localOut = vote(council(w, { local: 100 }, opts));
  assert.equal(tallies(localOut)[local.id], 10000); assert.equal(tallies(localOut)[star.id], 0); assert.equal(tallies(localOut)[weak.id], 0);
  assert.equal(localOut.councilVotes[0].slots[0].score.affinity, 10);
  assert(Object.values(tallies(vote(council(w, { local: 100 }, { ...opts, regionId: '' })))).every(n => n === 0));
  w = council(w, { continuity: 100 }, opts);
  assert(vote(w).councilVotes.every(v => v.slots.every(s => s.reason === 'noPrevious')));
  w.honors.previous['central:hall'] = Object.fromEntries(w.councilTypes[0].members.map(id => [id, [local.id]]));
  const continued = vote(w); assert.equal(tallies(continued)[star.id], 0); assert.equal(tallies(continued)[local.id], 10000);
  assert.deepEqual(plain(continued.world.honors.previous), plain(w.honors.previous));
  assert.deepEqual(selections(vote(continued.world, true)), selections(continued));
  const mixed = council(fixture(), { g1: 50, continuity: 50 }); mixed.honors.previous['central:hall'] = { [mixed.councilTypes[0].members[0]]: ['missing'] };
  assert.equal(tallies(vote(mixed))[mixed.horses[0].id], 100000);
  const negativeWorld = fixture(); H.profile(negativeWorld, negativeWorld.horses[0].id).distance.短途 = 1; H.profile(negativeWorld, negativeWorld.horses[0].id).surface.草地 = 1;
  const negative = vote(council(negativeWorld, { g1: 100 }, { count: 1, affinities: { ...config().affinities, 短途: -100, 草地: -100 } }));
  assert.equal(negative.councilVotes[0].slots[0].score.affinity, -10);
});

test('bounded randomness, shared exact ties, seeded abstentions and independent RNG states', () => {
  const supports = [], abstentions = [];
  for (const seed of [1, 42, 18349, 20260921]) {
    const w = fixture(10, seed); for (const h of w.horses) { h.lifetime = { ...w.horses[0].lifetime }; h.annual.manual = 140; H.profile(w, h.id).honor = 12; }
    const stable = vote(council(w)); assert.equal(new Set(selections(stable).map(v => v.join('|'))).size, 1);
    assert.deepEqual(selections(vote(stable.world, true)), selections(stable));
    const random = vote(council(w, { random: 100 })); supports.push(Object.values(tallies(random)).map(n => n / 100000));
    assert(Object.values(tallies(random)).every(n => n > 0));
    for (const v of random.councilVotes) for (const s of v.slots) assert(Math.abs(s.score.jitter) <= 3);
    const abstainWorld = council(w, { g1: 80, abstain: 20 }), out = vote(abstainWorld);
    assert.equal(new Set(out.councilVotes.map(v => v.slots.map(s => s.candidateId).join('|'))).size, 1, 'abstention does not backfill with a fourth horse');
    abstentions.push(out.councilVotes.flatMap(v => v.slots).filter(s => s.reason === 'abstain').length / 3000);
    assert.equal(out.world.honors.rngState, abstainWorld.honors.rngState);
    assert.equal(out.world.rngState, abstainWorld.rngState); assert.equal(out.world.aiRngState, abstainWorld.aiRngState);
    assert.deepEqual(plain(vote(abstainWorld).councilVotes), plain(out.councilVotes));
    assert.equal(out.world.honors.hallRngState, out.councilRounds[0].ballotSeed);
  }
  assert(supports.flat().every(n => n > .24 && n < .36)); assert(abstentions.every(n => n > .17 && n < .23));
  const w = fixture(3); [20, 10, 9].forEach((n, i) => { w.horses[i].lifetime.g1 = w.horses[i].lifetime.wins = n; });
  const out = vote(council(w, { g1: 1, random: 99 }));
  assert(out.councilVotes.every(v => v.slots[0].horseId === w.horses[0].id));
  const zero = vote(council(fixture(), { g1: 100 }, { count: 3, weight: 0 }));
  assert(zero.councilVotes.every(v => v.slots.every(s => s.reason === 'zeroWeight'))); assert.equal(zero.councilRounds[0].totalUnits, 0);
});

test('quality and relative cutoffs are inclusive, per-member histories remain separate, empty and fully abstaining councils are valid', () => {
  let w = fixture(3);
  w.horses.forEach((h, i) => { h.lifetime.g1 = h.lifetime.wins = 0; h.annual.manual = [140, 134, 133.99][i]; H.profile(w, h.id).honor = 0; H.profile(w, h.id).nominated = true; });
  const cutoff = vote(council(w, { rating: 100 }, { count: 2 }));
  assert.equal(tallies(cutoff)[w.horses[0].id], 200); assert.equal(tallies(cutoff)[w.horses[1].id], 200); assert.equal(tallies(cutoff)[w.horses[2].id], 0);
  w.horses.forEach((h, i) => h.annual.manual = i === 0 ? 124 : 123.99);
  assert.equal(Object.values(tallies(vote(council(w, { rating: 100 }, { count: 2 })))).filter(n => n > 0).length, 1);
  w.horses.forEach(h => h.annual.manual = 140); w = council(w, { continuity: 100 }, { count: 3 });
  w.honors.previous['central:hall'] = Object.fromEntries(w.councilTypes[0].members.map((id, i) => [id, [w.horses[i].id]]));
  const different = vote(w); different.councilVotes.forEach((v, i) => assert.equal(v.slots[0].horseId, w.horses[i].id));
  H.validateHistory(different.world, records(different));
  const empty = vote(council(fixture(0), { g1: 100 }, { count: 1 })); H.validateHistory(empty.world, records(empty));
  assert(empty.councilVotes[0].slots.every(s => s.reason === 'notRecognized'));
  const allAbstain = vote(council(fixture(), { abstain: 100 }, { count: 2 })); H.validateHistory(allAbstain.world, records(allAbstain));
  assert.equal(Object.values(tallies(allAbstain)).reduce((a, b) => a + b, 0), 0);
  assert(allAbstain.councilVotes.every(v => v.slots[0].reason === 'abstain'));
  const inducted = H.edit(fixture(1), 'induct', { id: fixture(1).horses[0].id, method: 'special' }).world;
  assert.equal(H.getHonorCandidates(inducted).length, 0);
});

test('annual ballots remain identical after hall voting apart from audit IDs', () => {
  const w = council(fixture(), H.defaultHallMotives()); w.awardsStrict = false;
  w.horses.forEach(h => { Object.assign(h.annual, h.lifetime, { tf: 140 }); });
  const before = vote(w, false, 'representative'), after = vote(vote(w).world, false, 'representative');
  assert.deepEqual(tallies(before), tallies(after));
  assert.deepEqual(selections(before), selections(after)); assert.equal(before.world.honors.rngState, after.world.honors.rngState);
  assert.equal(after.councilRounds[0].version, 1);
});

test('v2 history replays scores and rejects changed scores, reasons, totals, parameters, history or type subtotals', () => {
  const out = vote(council(fixture(), { g1: 50, random: 30, abstain: 20 }, { count: 40, weight: .25 }));
  H.validateHistory(out.world, records(out));
  const reordered = plain(records(out)); reordered.councilVotes.reverse(); H.validateHistory(out.world, reordered);
  for (const mutate of [r => r.councilVotes[0].slots[0].score.base++, r => r.councilVotes[0].slots[0].reason = 'zeroWeight',
    r => r.councilRounds[0].parameters.relativeFloor = .1, r => r.councilRounds[0].previousVotes = {},
    r => r.councilRounds[0].byType[out.world.councilTypes[0].id] = {}, r => delete r.councilRounds[0].tallies[out.world.horses[1].id]]) {
    const bad = plain(records(out)); mutate(bad); assert.throws(() => H.validateHistory(out.world, bad));
  }
  const before = H.evidenceSignature(out.world, 'central', 'hall', out.councilRounds[0].candidates, out.world.councilTypes);
  out.world.honors.previous['central:hall'] = { [out.world.councilTypes[0].members[0]]: [out.world.horses[0].id] };
  assert.notEqual(H.evidenceSignature(out.world, 'central', 'hall', out.councilRounds[0].candidates, out.world.councilTypes), before);
});

test('cancelled hall computation leaves caller world and saved RNG untouched', async () => {
  project.context.setTimeout = setTimeout;
  const w = council(fixture(), { g1: 100 }, { count: 250 }), before = plain(w), out = W.mutate(w, () => {}); let cancel = false, progress = 0;
  await assert.rejects(H.consume(H.buildCouncilBallot(out.world, out), () => { progress++; cancel = true; }, () => cancel), /取消/);
  assert.equal(progress, 1); assert.deepEqual(plain(w), before); assert.equal(out.world.honors.hallRngState, undefined);
  assert.equal(out.world.honors.latest['central:hall'], undefined); assert.equal(out.councilRounds, undefined);
});

test('v8 export, transaction rollback, restore and reimport preserve frozen ballots', async () => {
  Object.assign(project.context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  for (const f of ['js/chairman-storage.js', 'js/chairman-history.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), project.context);
  const store = await project.rules.ChairmanStorage.open();
  try {
    const w = council(fixture(), { g1: 100 }, { count: 10 }); await store.acquire(w.id); await store.commitChanges(null, { world: w });
    const out = vote(w); await assert.rejects(store.commitChanges(w, out, { failForTest: true }), /事务中断/);
    assert.equal((await store.load(w.id)).honors.hallRngState, undefined);
    await store.commitChanges(w, out, { checkpoint: 'turn' });
    const save = await store.exportWorld(w.id); assert.equal(save.version, 9); store.validateSnapshot(save);
    const restored = await store.restore(out.world, `turn:${w.revision}`); assert.equal(restored.honors.hallRngState, undefined);
    assert.deepEqual(selections(vote(restored)), selections(out));
    const imported = await store.importWorld(save); assert.deepEqual(plain(imported.honors), plain(save.world.honors));
    // 赛场适性规则重置后不再兼容旧赛马存档；当前格式只需保证备份、恢复与重导入一致。
  } finally { await store.close(); }
});
