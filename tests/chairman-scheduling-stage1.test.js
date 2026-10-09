const test = require('node:test');
const assert = require('node:assert/strict');
const { loadChairmanRules } = require('./helpers/project-loader');
const A = require('../scripts/lib/chairman-scheduling-audit');
const { createFixtures, runFixtures } = require('../scripts/lib/chairman-scheduling-fixtures');

test('field demand no longer pulls the top horses off their suitable G1 or creates an overseas trip', () => {
  const result = runFixtures(loadChairmanRules().rules);
  const cold = result.rows.find(r => r.id === 'cold-race-pulls-top-horses');
  assert.ok(cold.top.every(h => h.booked.raceId === h.target.raceId && h.booked.raceId === 'occupied-g1'));
  assert.equal(result.rows.find(r => r.id === 'empty-overseas-race').topFourForeign, 0);
  assert.equal(result.rows.find(r => r.id === 'target-prep-conflict').conflicting, 0);
  const split = result.rows.find(r => r.id === 'cross-distance-consolidation');
  assert.deepEqual(split.fields.map(r => r.count), [6, 6]);
  assert.equal(split.wrongDistance, 0);
  assert.equal(result.allReplayEqual, true);
});

test('unchanged planning and save/load do not reroll preferences or repeatedly change bookings', () => {
  const n = loadChairmanRules().rules, V = n.ChairmanWorld;
  for (const seed of [1, 42, 77]) {
    let w = V.create({ id: 'stable-' + seed, worldType: 'reference', regionKeys: ['japan', 'usa'],
      population: { japan: 32, usa: 16 }, annualTargets: { japan: 0, usa: 0 }, breeding: false, seed });
    const before = A.hash(w), rng = w.aiRngState;
    for (let i = 0; i < 3; i++) { w = A.copy(w); V.plan(w); assert.equal(A.hash(w), before, `seed ${seed}, replan ${i}`); }
    assert.equal(w.aiRngState, rng);
  }
});

test('unknown conditions borrow the horse public baseline, not an optimistic fixed 100', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world();
  w.horses = w.horses.slice(0, 1);
  w.horses[0].recentForm = [{ turn: -1, tf: 80, surface: '草地', distance: 1200, rank: 5 }];
  w.races = [f.race(w, 'known', 'op', { distance: 1200 }), f.race(w, 'unknown', 'op', { distance: 2000 })];
  const audit = A.createPlanAudit(n, w); n.ChairmanWorld.plan(w, audit.sink);
  const choices = audit.candidates.get(w.horses[0].id).choices;
  const unknown = choices.find(c => c.key === '1:unknown').form, known = choices.find(c => c.key === '1:known').form;
  assert.equal(unknown.count, 0); assert.equal(unknown.confidence, 0);
  assert.ok(unknown.estimate <= known.estimate && unknown.estimate < 100);
  assert.equal(w.horses[0].booked.raceId, 'known');
});

test('old, future, retired and invalid performances are ignored and one outlier does not erase a route', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world(), h = w.horses[0];
  w.horses = [h]; w.races = [f.race(w, 'sprint', 'op', { distance: 1200 }), f.race(w, 'stayer', 'op', { distance: 2400 })];
  h.recentForm = [124, 125, 126, 2000].map((tf, i) => ({ turn: -i - 1, tf, distance: 1200, surface: '草地', rank: i + 1 }));
  h.recentForm.push(...[
    { turn: -13, tf: 300 }, { turn: 1, tf: 300 }, { turn: -2, tf: 300, retired: true }, { turn: -3, tf: null }, { turn: -4, tf: 300, rank: 0 }
  ].map(p => ({ distance: 2400, surface: '草地', ...p })));
  const audit = A.createPlanAudit(n, w); n.ChairmanWorld.plan(w, audit.sink);
  const sprint = audit.candidates.get(h.id).choices.find(c => c.key === '1:sprint').form;
  assert.equal(sprint.count, 4); assert.ok(sprint.estimate >= 124 && sprint.estimate <= 126);
  assert.equal(h.booked.raceId, 'sprint');
});

test('limited local exploration remains possible but it cannot create an unsupported cross-group trip', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n); let explorationSeen = false;
  for (let starts = 4; starts < 8; starts++) {
    const w = f.world(); w.horses = w.horses.slice(0, 1); const h = w.horses[0]; h.lifetime.starts = starts;
    h.recentForm = [-1, -4].map(turn => ({ turn, tf: 110, surface: '草地', distance: 1200, rank: 2 }));
    w.races = [f.race(w, 'known', 'op', { distance: 1200, turn: 2 }), f.race(w, 'local-explore', 'op', { distance: 2400, turn: 2 }), f.race(w, 'foreign-explore', 'op', { distance: 2400, region: 1, turn: 2 })];
    const audit = A.createPlanAudit(n, w); n.ChairmanWorld.plan(w, audit.sink);
    const candidates = audit.candidates.get(h.id).choices;
    explorationSeen ||= candidates.some(c => c.key === '1:local-explore');
    assert.ok(candidates.every(c => c.key !== '1:foreign-explore'));
  }
  assert.equal(explorationSeen, true);
});

test('full targets retain legal fallbacks and locked runners keep their exact commitments', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world();
  w.races = [{ ...f.race(w, 'g1', 'g1'), capacity: 2 }, f.race(w, 'g3', 'g3')];
  n.ChairmanWorld.plan(w);
  assert.equal(w.horses.filter(h => h.booked?.raceId === 'g1').length, 2);
  assert.equal(w.horses.filter(h => h.booked?.raceId === 'g3').length, 10);
  const locked = f.world(); locked.races = [f.race(locked, 'foreign', 'g1', { region: 1, turn: 2 }), f.race(locked, 'local', 'g1', { turn: 2 })];
  f.pin(locked, locked.races[0], 0); const bookings = A.hash(locked.horses.map(h => h.booked));
  n.ChairmanWorld.plan(locked);
  assert.equal(A.hash(locked.horses.map(h => h.booked)), bookings);
});

test('hidden ability and exact aptitude do not change scheduling decisions', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world();
  w.races = [f.race(w, 'sprint', 'g1', { distance: 1200 }), f.race(w, 'stayer', 'g1', { distance: 2400 })];
  const changed = A.copy(w);
  for (const h of changed.horses) { h.strength = 999; h.surfaceGrades = { grass: 'G', dirt: 'A' }; h.trackAptitudes = { burst: '△', sustained: '◎', attrition: '◎' }; }
  n.ChairmanWorld.plan(w); n.ChairmanWorld.plan(changed);
  assert.equal(A.hash(w.horses.map(h => [h.booked, h.target])), A.hash(changed.horses.map(h => [h.booked, h.target])));
});

test('missing legal runners can cancel a race without relaxing rest or travel constraints', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world();
  w.races = [f.race(w, 'unreachable', 'g1', { region: 1 }), f.race(w, 'resting', 'g1')];
  w.horses.forEach(h => { h.restUntil = 2; });
  n.ChairmanWorld.plan(w); assert.ok(w.horses.every(h => !h.booked));
  const out = n.ChairmanRules.advanceHalfMonth(w);
  assert.equal(out.performances.length, 0);
  assert.ok(out.occurrences.every(r => r.status === 'cancelled'));
});

test('an active series pursuit is a valid reason to try new conditions, without bypassing injury', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world();
  w.horses = w.horses.slice(0, 1); const h = w.horses[0]; w.turn = 4; h.lastRaceTurn = 1;
  h.recentForm = [-2, 1].map(turn => ({ turn, tf: 120, rank: 1, surface: '草地', distance: 1600 }));
  w.races = [{ ...f.race(w, 'first-leg', 'g1', { turn: 0 }), lastHeldYear: 1 },
    f.race(w, 'next-leg', 'g1', { distance: 2400, region: 1, turn: 8 }), f.race(w, 'local-prep', 'op', { distance: 1200, turn: 4 })];
  w.series = [{ id: 'series', name: '系列', title: '连冠', ageRule: 'all', bonus: 0, honorWeight: 1, startYear: 1, raceIds: ['first-leg', 'next-leg'] }];
  n.ChairmanSeries.prepare(w); w.seriesState.current[0].results = [{ raceId: 'first-leg', horseId: h.id, eligible: true }];
  n.ChairmanWorld.plan(w); assert.equal(h.booked.raceId, 'next-leg');
  h.booked = null; h.restUntil = 10; n.ChairmanWorld.plan(w); assert.equal(h.booked, null);
});
