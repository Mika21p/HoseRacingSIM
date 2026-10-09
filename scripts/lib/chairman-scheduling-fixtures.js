'use strict';

const { copy, hash, createPlanAudit, newMetrics, recordTurn } = require('./chairman-scheduling-audit');

function createFixtures(n) {
  const W = n.ChairmanRules, V = n.ChairmanWorld;
  const base = V.create({ id: 'scheduling-fixtures', worldType: 'reference', regionKeys: ['japan', 'usa'],
    population: { japan: 12, usa: 0 }, annualTargets: { japan: 0, usa: 0 }, breeding: false, seed: 42 });
  function world() {
    const w = copy(base);
    Object.assign(w, { races: [], meetingGroups: [], venueAssignments: [], series: [], seriesState: { current: [] }, lockedRaces: {}, turn: 0, aiRngState: 123 });
    w.horses.forEach((h, i) => {
      Object.assign(h, { birthYear: -3, qualification: 4, booked: null, target: null, lastRaceTurn: null,
        restUntil: 0, recentForm: [], locationRegionId: w.regions[0].id, locationRegion: w.regions[0].name });
      Object.assign(h.lifetime, { starts: 4, wins: 1, prize: 0 }); h.annual.manual = 140 - i;
    });
    return w;
  }
  function race(w, id, raceClass, { distance = 1600, support = false, region = 0, turn = 0 } = {}) {
    const t = w.tracks.find(t => t.regionId === w.regions[region].id && t.surfaces.includes('草地')), d = W.date(turn);
    return { id, name: id, trackId: t.id, courseConfigId: t.configurations.find(c => c.surface === '草地').id,
      raceClass, grade: raceClass.toUpperCase(), surface: '草地', distance, month: d.month, half: d.half,
      ageRule: '3+', sexRule: 'all', capacity: 16, prizes: V.prizes(raceClass), support, demandDriven: support, deleted: false };
  }
  function pin(w, definition, from = 4) {
    const r = V.resolveRace(w, definition, 1), turn = (r.month - 1) * 2 + r.half - 1;
    w.lockedRaces[`1:${r.id}`] = r;
    for (const h of w.horses.slice(from)) h.booked = { raceId: r.id, turn, targetRegion: r.surfaceRegion,
      targetRegionId: r.regionId, fromRegionId: r.regionId, preparationTurn: null, travelTurns: 0 };
  }
  function run(w) {
    const plain = copy(w), observed = copy(w), audit = createPlanAudit(n, observed, { traceLimit: 40 });
    V.plan(plain); V.plan(observed, audit.sink);
    return { world: observed, audit: audit.summary, replayEqual: hash(plain) === hash(observed),
      inputHash: hash(w), outputHash: hash(observed) };
  }
  return { world, race, pin, run };
}

function runFixtures(n) {
  const W = n.ChairmanRules, V = n.ChairmanWorld, f = createFixtures(n), rows = [];
  let w = f.world();
  w.races = [f.race(w, 'occupied-g1', 'g1'), f.race(w, 'empty-g3', 'g3')]; f.pin(w, w.races[0]);
  let result = f.run(w);
  rows.push({ id: 'cold-race-pulls-top-horses', description: '已有8匹的G1与空场G3，4匹最高评分马的实际选择',
    ...result, world: undefined, top: result.world.horses.slice(0, 4).map(h => ({ horseId: h.id, rating: W.entryRating(h), target: h.target, booked: h.booked })) });

  w = f.world(); w.races = [f.race(w, 'sprint-1200', 'op', { distance: 1200, support: true }), f.race(w, 'stayer-2400', 'op', { distance: 2400, support: true })];
  w.horses.forEach((h, i) => { h.recentForm = [{ surface: '草地', distance: 1200, tf: i < 6 ? 130 : 70, turn: -3 }, { surface: '草地', distance: 2400, tf: i < 6 ? 70 : 130, turn: -6 }]; });
  result = f.run(w);
  rows.push({ id: 'cross-distance-consolidation', description: '6匹短途与6匹长途马的补充赛被跨距离合并',
    ...result, world: undefined, fields: w.races.map(r => ({ raceId: r.id, count: result.world.horses.filter(h => h.booked?.raceId === r.id).length })),
    wrongDistance: result.world.horses.filter((h, i) => h.booked?.raceId !== (i < 6 ? 'sprint-1200' : 'stayer-2400')).length });

  w = f.world(); w.races = [f.race(w, 'home-g1', 'g1', { turn: 2 }), f.race(w, 'foreign-g1', 'g1', { turn: 2, region: 1 })]; f.pin(w, w.races[0]);
  result = f.run(w);
  rows.push({ id: 'empty-overseas-race', description: '同条件海外空场对有合适本土G1的马产生吸引', ...result, world: undefined,
    topFourForeign: result.world.horses.slice(0, 4).filter(h => h.booked?.raceId === 'foreign-g1').length });

  w = f.world(); w.races = [f.race(w, 'target-g1', 'g1', { turn: 2 }), f.race(w, 'near-op', 'op')]; f.pin(w, w.races[0]);
  result = f.run(w);
  rows.push({ id: 'target-prep-conflict', description: '近期OP报名与两回合后的显示目标不满足正常间隔', ...result, world: undefined,
    conflicting: result.world.horses.filter(h => h.target && h.booked && h.target.raceId !== h.booked.raceId && h.target.turn - h.booked.turn < 3).length });

  w = f.world(); w.races = [f.race(w, 'foreign-later', 'g1', { region: 1, turn: 5 })];
  for (const h of w.horses) { h.locationRegionId = w.regions[1].id; h.locationRegion = w.regions[1].name; }
  result = f.run(w);
  const metrics = newMetrics(), streaks = {};
  let observed = result.world;
  for (let i = 0; i < 2; i++) { const out = W.advanceHalfMonth(observed); recordTurn(n, observed, out, null, metrics, streaks); observed = out.world; }
  rows.push({ id: 'overseas-residence-without-starts', description: '已经在海外的马在没有比赛的回合仍被计入驻留', ...result, world: undefined,
    observation: { performances: metrics.performances, overseasHorseTurns: metrics.overseasHorseTurns, returnsHome: metrics.returnsHome,
      stillAbroad: observed.horses.filter(h => h.status === 'active' && h.locationRegionId !== h.homeRegionId).length } });

  w = f.world(); w.races = [f.race(w, 'g1', 'g1'), f.race(w, 'g3', 'g3')];
  const normal = f.run(w); w.races[1].prizes = [10000000, 0, 0, 0, 0]; const rich = f.run(w);
  rows.push({ id: 'prize-not-selection-input', description: '固定其他条件与随机状态，只改奖金不改变报名',
    replayEqual: normal.replayEqual && rich.replayEqual,
    sameBookings: JSON.stringify(normal.world.horses.map(h => h.booked)) === JSON.stringify(rich.world.horses.map(h => h.booked)) });

  return { purpose: 'Current behavior observations; undesirable outcomes are not future acceptance requirements.',
    rows, allReplayEqual: rows.every(row => row.replayEqual) };
}

module.exports = { createFixtures, runFixtures };
