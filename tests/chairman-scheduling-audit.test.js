const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync, spawnSync } = require('node:child_process');
const { loadChairmanRules } = require('./helpers/project-loader');
const A = require('../scripts/lib/chairman-scheduling-audit');
const { createFixtures, runFixtures } = require('../scripts/lib/chairman-scheduling-fixtures');

test('initial creation emits the first planning pass without rerunning or changing it', () => {
  const n = loadChairmanRules().rules, opts = { id: 'creation-audit', worldType: 'reference', regionKeys: ['japan'],
    population: { japan: 12 }, annualTargets: { japan: 0 }, breeding: false, seed: 123 };
  const plain = n.ChairmanWorld.create(opts); let audit;
  const observed = n.ChairmanWorld.create(opts, w => { audit = A.createPlanAudit(n, w); return audit.sink; });
  assert.equal(A.hash(plain), A.hash(observed));
  assert.equal(audit.summary.turn, 0); assert.equal(audit.summary.active, 12);
  assert.ok(Object.keys(audit.summary.races).length > 0);
});

test('audit observes all six fixtures without changing world state or random streams', () => {
  const n = loadChairmanRules().rules, result = runFixtures(n);
  assert.equal(result.rows.length, 6);
  assert.equal(result.allReplayEqual, true);
  const residence = result.rows.find(r => r.id === 'overseas-residence-without-starts');
  assert.equal(residence.observation.performances, 0);
  assert.ok(residence.observation.overseasHorseTurns >= 12 && residence.observation.overseasHorseTurns <= 24);
  // Bad behavior is reported, not asserted as a permanent scheduling requirement.
  for (const r of result.rows.filter(r => r.audit)) {
    assert.equal(r.audit.active, 12);
    assert.ok(r.audit.examples.every(e => !Object.hasOwn(e, 'strength')));
  }
});

test('trace payloads are detached and an observer cannot mutate the race definitions', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world();
  w.races = [f.race(w, 'local', 'g1')];
  const plain = A.copy(w), observed = A.copy(w);
  n.ChairmanWorld.plan(plain);
  n.ChairmanWorld.plan(observed, data => {
    if (data.events) data.events.forEach(e => { e.race.capacity = 0; e.race.name = 'changed by observer'; });
    if (data.options) data.options.length = 0;
  });
  assert.equal(A.hash(plain), A.hash(observed));
});

test('eligibility, recovery and travel exclusions are visible without changing selection', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world();
  w.races = [f.race(w, 'overseas-now', 'g1', { region: 1 }), { ...f.race(w, 'juvenile', 'g1'), ageRule: '2' }];
  w.horses[0].restUntil = 4;
  const { audit, replayEqual } = f.run(w);
  assert.equal(replayEqual, true);
  assert.ok(audit.rejected.age >= 12);
  assert.ok(audit.rejected.transport >= 12);
  assert.ok(audit.rejected['injury-rest'] >= 1);
  assert.equal(A.explainShortField(audit.races['1:juvenile']).primary, 'eligibility-pool');
  assert.equal(A.explainShortField(audit.races['1:overseas-now']).primary, 'rest-transport-or-commitment');
});

test('a complete small season plus breeding settlement is identical with and without audit', () => {
  const n = loadChairmanRules().rules, W = n.ChairmanRules, V = n.ChairmanWorld, original = V.plan;
  let enabled = false, plans = 0;
  V.plan = w => {
    if (!enabled) return original(w);
    const audit = A.createPlanAudit(n, w); plans++;
    return original(w, audit.sink);
  };
  let world = W.createWorld({ id: 'audit-parity', worldType: 'reference', regionKeys: ['japan'],
    population: { japan: 16 }, annualTargets: { japan: 4 }, foundation: false, seed: 771 });
  try {
    for (let i = 0; i < 24; i++) {
      enabled = false; const plain = W.advanceHalfMonth(world);
      enabled = true; const observed = W.advanceHalfMonth(world);
      assert.equal(A.hash(plain), A.hash(observed), `turn ${i}`); world = plain.world;
    }
    enabled = false; const plain = W.finishYear(world);
    enabled = true; const observed = W.finishYear(world);
    assert.equal(A.hash(plain), A.hash(observed));
    assert.ok(plans >= 24);
  } finally { V.plan = original; }
});

test('cancelled named races count in denominators; support races do not', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world(), metrics = A.newMetrics();
  const named = n.ChairmanWorld.resolveRace(w, f.race(w, 'named', 'g1'));
  const support = n.ChairmanWorld.resolveRace(w, f.race(w, 'support', 'op', { support: true }));
  A.recordTurn(n, w, { world: A.copy(w), performances: [], occurrences: [
    { id: '1:named', race: named, status: 'cancelled', count: 0 },
    { id: '1:support', race: support, status: 'cancelled', count: 0 }
  ] }, null, metrics, {});
  assert.equal(metrics.regions[named.regionId].scheduled, 1);
  assert.equal(metrics.regions[named.regionId].completed, 0);
  assert.equal(metrics.regions[named.regionId].g1, 1);
  assert.equal(metrics.cancellations.length, 1);
  assert.equal(metrics.cancellations[0].evidence.primary, 'missing-planning-evidence');
});

test('calendar exclusions report deleted, already held and future-effective definitions', () => {
  const n = loadChairmanRules().rules, f = createFixtures(n), w = f.world();
  w.races = [{ ...f.race(w, 'deleted', 'g1'), deleted: true },
    { ...f.race(w, 'held', 'g1'), lastHeldYear: 1 },
    { ...f.race(w, 'future', 'g1'), notBeforeYear: 3 }];
  const result = f.run(w);
  assert.equal(result.replayEqual, true);
  assert.ok(result.audit.calendarExclusions.deleted > 0);
  assert.ok(result.audit.calendarExclusions['already-held'] > 0);
  assert.ok(result.audit.calendarExclusions['not-before-year'] > 0);
});

test('checkpoint resume preserves state and metrics and rejects a different source fingerprint', { timeout: 120000 }, () => {
  const directory = path.resolve('.cache/scheduling-audit-tests'); fs.mkdirSync(directory, { recursive: true });
  const dir = fs.mkdtempSync(path.join(directory, 'run-'));
  const resumedFile = path.join(dir, 'resumed.json'), directFile = path.join(dir, 'direct.json');
  const run = (file, extra) => execFileSync(process.execPath, ['scripts/audit-chairman-scheduling.js', '--scenario=japan', '--seed=123', '--years=1', `--out=${file}`, ...extra], { windowsHide: true, timeout: 110000 });
  run(resumedFile, ['--max-turns=1']); run(resumedFile, ['--max-turns=1', '--resume']); run(directFile, ['--max-turns=2']);
  const resumed = JSON.parse(fs.readFileSync(resumedFile)), direct = JSON.parse(fs.readFileSync(directFile));
  assert.equal(resumed.finalWorldHash, direct.finalWorldHash);
  assert.deepEqual(resumed.partialYear, direct.partialYear);
  assert.equal(resumed.parityChecks, 2);
  assert.equal(resumed.partialYear.plans, 2);
  const checkpoint = `${resumedFile}.checkpoint.json.gz`, saved = JSON.parse(zlib.gunzipSync(fs.readFileSync(checkpoint)));
  saved.source.fingerprint = 'wrong-version'; fs.writeFileSync(checkpoint, zlib.gzipSync(JSON.stringify(saved)));
  const rejected = spawnSync(process.execPath, ['scripts/audit-chairman-scheduling.js', '--scenario=japan', '--seed=123', '--years=1', `--out=${resumedFile}`, '--resume'], { windowsHide: true, encoding: 'utf8' });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /source changed/);
});
