const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
const { loadChairmanRules } = require('./helpers/project-loader');
const plain = v => JSON.parse(JSON.stringify(v));
function fixture(count = 4) {
  const project = loadChairmanRules(), n = project.rules, W = n.ChairmanRules, H = n.ChairmanHonors;
  project.context.setTimeout = setTimeout;
  const w = W.createWorld({ seed: 18349, blank: true }); w.awardsStrict = false;
  for (let i = 0; i < count; i++) {
    const h = W.addHorse(w, { age: 4, homeRegion: i % 2 ? '美国' : '日本', gender: i % 2 ? '牝马' : '牡马' });
    h.lifetime = { starts: 8, wins: 3, g1: 1, prize: 100 };
    Object.assign(h.annual, h.lifetime, { tf: 125, runs: [{ raceClass: 'g1', rank: 1, surface: i % 2 ? '泥地' : '草地', distance: i % 2 ? 1200 : 3000 }] });
    const p = H.profile(w, h.id); p.distance[i % 2 ? '短途' : '长距离'] = 10; p.surface[i % 2 ? '泥地' : '草地'] = 10;
    p.annualDistance = plain(p.distance); p.annualSurface = plain(p.surface);
  }
  return { ...project, n, W, H, w };
}
function type(H, overrides = {}) {
  return { name: '玩家自建理事', scope: 'central', regionId: '', count: 30, weight: 1, enabled: true,
    motives: Object.fromEntries(Object.keys(H.motives).map(k => [k, k === 'random' ? 100 : 0])),
    affinities: Object.fromEntries(H.affinities.map(k => [k, 0])), ...overrides };
}
function vote(W, H, world, scope = 'central', award = 'hall', force = false) {
  const out = W.mutate(world, () => {}); for (const p of H.buildCouncilBallot(out.world, out, scope, award, force)) void p; return out;
}
test('empty councils, type validation and stable director identities after shrinking, copying and expanding', () => {
  const { W, H, w } = fixture(); assert.equal(w.councilTypes.length, 0);
  let world = H.edit(w, 'type', type(H, { count: 3, weight: 1.25 })).world;
  const original = world.councilTypes[0], ids = [...original.members];
  world = H.edit(world, 'type', { ...original, count: 1 }).world;
  world = H.edit(world, 'type', { ...world.councilTypes[0], count: 3 }).world;
  assert.equal(world.councilTypes[0].members[0], ids[0]); assert.ok(!world.councilTypes[0].members.includes(ids[1]));
  assert.throws(() => H.edit(world, 'type', type(H, { weight: .001 })), /票权/);
  assert.throws(() => H.edit(world, 'type', type(H, { motives: { ...type(H).motives, g1: 1 } })), /100/);
  assert.throws(() => H.edit(world, 'type', type(H, { affinities: { ...type(H).affinities, 草地: 101 } })), /爱好/);
  assert.equal(vote(W, H, w).councilRounds, undefined);
});
test('public performance affinity changes votes measurably, zero preferences are neutral, hidden values are ignored', () => {
  const { W, H, w } = fixture(2), config = type(H, { count: 3000 });
  const neutral = H.edit(w, 'type', config).world;
  const before = vote(W, H, neutral, 'central', 'representative');
  const candidates = H.getHonorCandidates(neutral, 'central', 'representative');
  assert.equal(H.affinityMultiplier(config, candidates[0]), 1);
  const pref = H.edit(w, 'type', { ...config, affinities: { ...config.affinities, 短途: 100, 泥地: 100, 长距离: -100, 草地: -100 } }).world;
  const biased = vote(W, H, pref, 'central', 'representative');
  const preferred = w.horses[1].id, r = biased.councilRounds[0];
  assert.ok(r.tallies[preferred] / r.totalUnits > .90); assert.ok(before.councilRounds[0].tallies[preferred] / r.totalUnits < .56);
  const altered = W.clone(pref); altered.horses.forEach(h => { h.strength = 1; h.surfaceGrades = { grass: "G", dirt: "G" }; h.peakStart = ''; h.breeding = { strength: 100 }; });
  assert.deepEqual(plain(vote(W, H, altered, 'central', 'representative').councilVotes), plain(biased.councilVotes));
  assert.equal(biased.world.rngState, pref.rngState); assert.equal(biased.world.aiRngState, pref.aiRngState);
  assert.deepEqual(plain(vote(W, H, pref, 'central', 'representative').councilVotes), plain(biased.councilVotes));
});
test('hall ballots have at most three distinct supporters, weighted abstentions stay in denominator and thresholds are exact', () => {
  const { W, H, w } = fixture(7); w.horses.forEach(h => { h.status = 'retired'; h.lifetime.g1 = h.lifetime.wins = 6; });
  let world = H.edit(w, 'type', type(H, { count: 20, weight: .25 })).world;
  world = H.edit(world, 'type', type(H, { name: '弃权者', count: 20, weight: .75, motives: { ...type(H).motives, random: 0, abstain: 100 } })).world;
  const out = vote(W, H, world), r = out.councilRounds[0]; assert.equal(r.totalUnits, 2000);
  for (const v of out.councilVotes) { const ids = v.slots.filter(s => s.horseId).map(s => s.horseId); assert.equal(new Set(ids).size, ids.length); assert.ok(ids.length <= 3); }
  assert.equal(Object.values(r.tallies).reduce((s, n) => s + n, 0), 1500);
  assert.equal(H.passes(6000, 10000, 60), true); assert.equal(H.passes(5999, 10000, 60), false); assert.equal(H.passes(0, 0, 60), false);
  const again = vote(W, H, out.world); assert.equal(again.councilRounds, undefined);
  const repeat = vote(W, H, out.world, 'central', 'hall', true); assert.notEqual(repeat.councilRounds[0].id, r.id);
  repeat.world.turn = 23; repeat.world.phase = 'yearEnd'; repeat.world.settings.annualNewHorses = 0;
  const next = W.finishYear(repeat.world).world;
  assert.equal(H.profile(next, next.horses[0].id).lastHallVote.roundId, repeat.councilRounds[0].id);
  assert.equal(next.honors.latest['central:hall'], undefined);
});
test('continuity uses the previous year, missing objects fall back and same-year revotes do not replace that history', () => {
  const { W, H, w } = fixture(2), t = type(H, { count: 2, motives: { ...type(H).motives, random: 20, continuity: 80 } });
  const world = H.edit(w, 'type', t).world, member = world.councilTypes[0].members[0];
  world.honors.previous['central:representative'] = { [member]: [world.horses[0].id] };
  const out = vote(W, H, world, 'central', 'representative');
  assert.deepEqual(plain(out.world.honors.previous), plain(world.honors.previous));
  assert.equal(out.councilVotes[1].slots[0].motive, 'random');
  const only = H.edit(w, 'type', type(H, { count: 1, motives: { ...type(H).motives, random: 0, continuity: 100 } })).world;
  assert.equal(vote(W, H, only, 'central', 'representative').councilVotes[0].slots[0].horseId, null);
});
test('eligibility uses approved WTR before TF, permits nomination, excludes unplayed ancestors and separates local honors', () => {
  const { W, H, w } = fixture(3), h = w.horses[0], p = H.profile(w, h.id); h.status = 'retired'; h.lifetime.g1 = 0;
  h.annual.tf = 130; assert.ok(H.getHonorCandidates(w).some(c => c.id === h.id));
  h.annual.manual = 0; p.localAwards = 20; assert.ok(!H.getHonorCandidates(w).some(c => c.id === h.id));
  let world = H.edit(w, 'nominate', { id: h.id }).world; assert.ok(H.getHonorCandidates(world).some(c => c.id === h.id));
  world = H.edit(world, 'exclude', { id: h.id, excluded: true }).world; assert.ok(!H.getHonorCandidates(world).some(c => c.id === h.id));
  assert.throws(() => H.edit(w, 'nominate', { id: w.horses[1].id }), /退役/);
  const out = H.edit(w, 'induct', { id: h.id, comment: '特殊生涯', method: 'special' });
  assert.equal(out.hallEvents[0].comment, '特殊生涯'); assert.throws(() => H.edit(out.world, 'induct', { id: h.id }), /尚未入选/);
  const revoked = H.edit(out.world, 'revoke', { id: h.id, comment: '误授' }); assert.equal(revoked.hallEvents[0].action, 'revoke'); assert.equal(H.profile(revoked.world, h.id).induction, null);
});
test('local annual affiliation remains frozen through travel and edits, rolls over next year; local awards do not inflate central honors', () => {
  const { W, H, w, n } = fixture(2), h = w.horses[0], local = H.profile(w, h.id).regionId;
  h.homeRegion = '美国'; h.locationRegion = '欧洲';
  assert.ok(H.getHonorCandidates(w, local, 'representative').some(c => c.id === h.id));
  let world = H.edit(w, 'localDraft', { scope: local, awardId: 'representative', horseId: h.id, comment: '远征成就' }).world;
  world.settings.annualNewHorses = 0; world.settings.autoRetire = false; world.turn = 23; world.phase = 'yearEnd';
  const out = W.finishYear(world), p = H.profile(out.world, h.id);
  assert.equal(out.awards.filter(a => a.scope === local).length, 1); assert.equal(p.localAwards, 1); assert.equal(p.centralAwards, 0);
  assert.equal(n.ChairmanOffice.horseMatches({ name: h.name, localAwards: p.localAwards, centralAwards: p.centralAwards }, { honor: 'local' }), true);
  assert.equal(n.ChairmanOffice.horseMatches({ name: h.name, localAwards: p.localAwards, centralAwards: p.centralAwards }, { honor: 'central' }), false);
  assert.equal(p.regionId, W.regions(out.world).find(r => r.name === '美国').id);
  assert.equal(out.honorYears.length, 1); assert.throws(() => W.finishYear(out.world), /年末/);
});
test('annual suggestions preserve manual drafts, ties and abstentions; automatic year end is repeat-safe and optional', () => {
  const { W, H, w } = fixture(2);
  let world = H.edit(w, 'type', type(H, { count: 5 })).world; world.turn = 23;
  const out = W.advanceHalfMonth(world); assert.equal(out.councilRounds.length, 13); assert.deepEqual(plain(out.world.awardDraft), {});
  const r = out.councilRounds.find(r => r.awardId === 'representative'); const max = Math.max(...Object.values(r.tallies)), winner = Object.keys(r.tallies).find(id => r.tallies[id] === max);
  const other = w.horses.find(h => h.id !== winner).id; out.world.awardDraft.representative = other;
  assert.equal(H.applyBallotSuggestions(out.world, [r]).world.awardDraft.representative, other);
  assert.equal(H.applyBallotSuggestions(out.world, [r], true).world.awardDraft.representative, winner);
  const tied = plain(r); tied.tallies = Object.fromEntries(w.horses.map(h => [h.id, 100]));
  assert.equal(H.applyBallotSuggestions(out.world, [tied], true).world.awardDraft.representative, other);
  const empty = W.createWorld({ blank: true }); empty.turn = 23; const result = W.advanceHalfMonth(empty); assert.equal(result.councilRounds, undefined); assert.doesNotThrow(() => W.finishYear(result.world));
});
test('batched voting cancellation publishes no partial world or RNG change', async () => {
  const { W, H, w } = fixture(4), world = H.edit(w, 'type', type(H, { count: 250 })).world;
  const before = plain(world), out = W.mutate(world, () => {}); let stopped = false;
  await assert.rejects(H.consume(H.buildCouncilBallot(out.world, out, 'central', 'representative'), () => { stopped = true; }, () => stopped), /取消/);
  assert.deepEqual(plain(world), before); assert.equal(out.world.honors.latest['central:representative'], undefined);
});
test('councils, votes, local awards and migration snapshots persist atomically across restore/import; deletion keeps past identities', async () => {
  const { context, rules: n, W, H, w } = fixture(3);
  Object.assign(context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  for (const f of ['js/chairman-storage.js', 'js/chairman-history.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), context);
  const store = await n.ChairmanStorage.open();
  try {
    let world = H.edit(w, 'type', type(H, { count: 4 })).world; await store.acquire(world.id); await store.commitChanges(null, { world });
    const out = vote(W, H, world, 'central', 'representative');
    await assert.rejects(store.commitChanges(world, out, { failForTest: true }), /事务中断/); assert.equal((await store.load(world.id)).honors.latest['central:representative'], undefined);
    await store.commitChanges(world, out, { checkpoint: 'turn' }); world = out.world;
    const saved = await store.exportWorld(world.id); store.validateSnapshot(saved); assert.equal(saved.version, 10);
    const bad = plain(saved); bad.records.councilVotes.pop(); assert.throws(() => store.validateSnapshot(bad), /不完整/);
    const removed = H.edit(world, 'deleteType', { id: world.councilTypes[0].id }); await store.commitChanges(world, removed); world = await store.load(world.id); assert.equal(world.councilTypes.length, 0);
    assert.equal((await store.queryHonorHistory(world.id, 'councilVotes', { roundId: out.councilRounds[0].id })).total, 4);
    const restored = await store.restore(world, `turn:${out.world.revision - 1}`); assert.equal(restored.councilTypes.length, 1); assert.equal(restored.honors.latest['central:representative'], undefined);
    const imported = await store.importWorld(saved); assert.deepEqual(plain(imported.honors), plain(saved.world.honors));
    const legacy = plain(saved); legacy.version = 4; delete legacy.world.honors; delete legacy.world.councilTypes; delete legacy.world.honorProfiles;
    for (const key of ['councilRounds', 'councilVotes', 'hallEvents', 'honorYears']) delete legacy.records[key];
    const migrated = await store.importWorld(legacy); assert.equal(migrated.councilTypes.length, 0); assert.equal(migrated.honors.version, 1);
    assert.equal(migrated.rngState, legacy.world.rngState); assert.equal(migrated.horses[0].strength, legacy.world.horses[0].strength);
    const points = await store.query('checkpoints', migrated.id); assert.ok(points.rows.some(p => p.kind === 'migration'));
  } finally { await store.close(); }
});
