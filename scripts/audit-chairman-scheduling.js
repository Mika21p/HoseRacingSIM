'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const vm = require('node:vm');
const { loadChairmanRules } = require('../tests/helpers/project-loader');
const A = require('./lib/chairman-scheduling-audit');
const { runFixtures } = require('./lib/chairman-scheduling-fixtures');

function saveJson(file, data, compressed = false) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = JSON.stringify(data, null, compressed ? 0 : 2);
  fs.writeFileSync(`${file}.tmp`, compressed ? zlib.gzipSync(body, { level: 1 }) : body);
  fs.renameSync(`${file}.tmp`, file);
}

function main() {
  const opt = Object.fromEntries(process.argv.slice(2).map(value => {
    const [key, ...rest] = value.replace(/^--/, '').split('='); return [key, rest.length ? rest.join('=') : '1'];
  }));
  const scenario = opt.scenario || 'fixtures', seed = Number(opt.seed || 123), years = Number(opt.years || 1);
  assert(['fixtures', 'japan', 'combined'].includes(scenario), 'scenario must be fixtures, japan, or combined');
  assert(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff, 'seed must be uint32');
  assert(Number.isInteger(years) && years >= 1 && years <= 20, 'years must be 1..20');
  const maxTurns = opt['max-turns'] == null ? Infinity : Number(opt['max-turns']);
  assert(maxTurns > 0 && (maxTurns === Infinity || Number.isInteger(maxTurns)), 'max-turns must be positive');
  const file = path.resolve(opt.out || `artifacts/chairman-scheduling-${scenario}-${seed}-${years}years.json`);
  const checkpoint = `${file}.checkpoint.json.gz`, source = A.manifest();
  const project = loadChairmanRules(), n = project.rules;
  if (opt['planner-source']) {
    const overridePath = path.resolve(opt['planner-source']), body = fs.readFileSync(overridePath, 'utf8');
    source.plannerOverride = { file: overridePath, sha256: A.hash(body) };
    source.fingerprint = A.hash([source.fingerprint, source.plannerOverride.sha256]);
    vm.runInContext(body, project.context, { filename: overridePath });
  }
  const W = n.ChairmanRules, V = n.ChairmanWorld;
  if (scenario === 'fixtures') {
    assert(!fs.existsSync(file), 'output exists; choose another --out');
    const result = { generatedAt: new Date().toISOString(), source, ...runFixtures(n) };
    saveJson(file, result); assert(result.allReplayEqual, 'audit changes fixture state');
    console.log(JSON.stringify({ file, allReplayEqual: result.allReplayEqual, scenarios: result.rows.map(r => r.id) })); return;
  }
  const keys = scenario === 'japan' ? ['japan'] : ['japan', 'usa', 'britain', 'france', 'ireland', 'germany', 'italy'];
  const config = { scenario, seed, years, regionKeys: keys, population: 'engine-default', annualTargets: 'engine-default',
    breeding: true, foundation: true, autoRetire: true, auditSchema: 2, verifyEveryTransaction: true,
    plannerOverride: source.plannerOverride || null };
  let enabled = true, lastPlan = null;
  const originalPlan = V.plan;
  V.plan = function(w) {
    if (!enabled) return originalPlan(w);
    const audit = A.createPlanAudit(n, w);
    const result = originalPlan(w, audit.sink); lastPlan = audit.summary; return result;
  };
  let state;
  if (opt.resume === '1') {
    assert(fs.existsSync(checkpoint), 'checkpoint not found');
    state = JSON.parse(zlib.gunzipSync(fs.readFileSync(checkpoint)));
    assert.equal(state.source.fingerprint, source.fingerprint, 'source changed; cannot resume this checkpoint');
    assert.deepEqual(state.config, config, 'configuration changed; cannot resume this checkpoint');
    lastPlan = state.lastPlan;
  } else {
    assert(!fs.existsSync(file) && !fs.existsSync(checkpoint), 'output exists; use --resume or a new --out');
    const start = performance.now();
    const world = V.create({ id: `scheduling-${scenario}-${seed}`, worldType: 'reference', regionKeys: keys, seed }, w => {
      const audit = A.createPlanAudit(n, w); lastPlan = audit.summary; return audit.sink;
    });
    assert(lastPlan && lastPlan.turn === 0, 'initial planning must be audited without a second planning pass');
    state = { source, config, world, createdAt: new Date().toISOString(), completedYears: 0, years: [],
      current: A.newMetrics(), streaks: {}, lastPlan, parityChecks: 0, planningMs: [], plainMs: [], settleMs: [],
      creationMs: performance.now() - start, sampledMaxRss: process.memoryUsage().rss,
      elapsedMs: 0, actualDefaults: world.regions.map(r => ({ id: r.id, name: r.name, initial: r.initialCount, annual: r.annualTarget, generation: r.generation })),
      versions: { world: world.worldSystemVersion, rules: world.rulesVersion, ai: world.aiVersion, rating: world.ratingVersion, references: world.referenceVersion },
      environment: { node: process.version, platform: process.platform, release: os.release(), arch: process.arch,
        cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, ramGiB: +(os.totalmem() / 2 ** 30).toFixed(2) } };
    saveJson(`${file}.initial.json.gz`, { source, config, world }, true);
  }
  const runStart = performance.now(), previousElapsed = state.elapsedMs;
  const persist = status => {
    state.lastPlan = lastPlan;
    state.elapsedMs = previousElapsed + performance.now() - runStart;
    const report = { status, source: state.source, config, createdAt: state.createdAt, updatedAt: new Date().toISOString(),
      environment: state.environment, actualDefaults: state.actualDefaults, versions: state.versions,
      completedYears: state.completedYears, parityChecks: state.parityChecks, years: state.years,
      partialYear: state.current.turns ? state.current : null,
      performance: { creationMs: state.creationMs, auditedHalfMonthMs: A.distribution(state.planningMs),
        plainHalfMonthMs: A.distribution(state.plainMs), yearSettlementMs: A.distribution(state.settleMs),
        sampledMaxProcessRssMiB: +(state.sampledMaxRss / 2 ** 20).toFixed(2), elapsedMs: state.elapsedMs,
        worldMiB: +(Buffer.byteLength(JSON.stringify(state.world)) / 2 ** 20).toFixed(2),
        caveat: 'RSS includes audit plus replay verification; elapsed includes duplicate simulations and checkpoint I/O. Not browser latency.' },
      finalWorldHash: A.hash(state.world), finalRng: { race: state.world.rngState, ai: state.world.aiRngState },
      limitations: ['Baseline observation, not stage-4 population acceptance.', 'Target mismatch includes legal prep races; inspect timing before calling it a defect.',
        'Short-field attribution is an observed candidate funnel, not a counterfactual causal proof.',
        'Overseas residence samples turn-start location; open stays are right-censored at the run end.',
        'G1 totals include all prestige levels; travel purpose counts retain the recorded campaign reason.',
        'Departures count their start turn; arrivals count location changes. Overseas residence excludes outbound time before arrival and includes the return journey.',
        'A return-transit commitment is counted separately from eligibility shortages.'] };
    saveJson(checkpoint, state, true); saveJson(file, report);
  };
  let turnsThisRun = 0;
  try {
    while (state.completedYears < years) {
      if (state.world.phase === 'yearEnd') {
        const before = state.world, start = performance.now(); enabled = true;
        const out = W.finishYear(before); state.settleMs.push(performance.now() - start);
        enabled = false; const replay = W.finishYear(before); enabled = true;
        assert.equal(A.hash(out), A.hash(replay), 'audit changed year settlement'); state.parityChecks++;
        W.validateWorld(out.world);
        state.years.push({ year: W.date(before.turn).year, activeEnd: before.horses.filter(h => h.status === 'active').length,
          nextYearActive: out.world.horses.filter(h => h.status === 'active').length, ...state.current });
        state.completedYears++; state.current = A.newMetrics(); state.world = out.world;
        persist(state.completedYears === years ? 'complete' : 'running');
        console.log(JSON.stringify({ year: state.completedYears, scenario, parityChecks: state.parityChecks, elapsedMs: Math.round(state.elapsedMs) }));
        continue;
      }
      if (turnsThisRun >= maxTurns) { persist('stopped-at-turn-budget'); console.log(JSON.stringify({ status: 'stopped-at-turn-budget', file, turn: state.world.turn })); return; }
      const before = state.world, plan = lastPlan;
      enabled = true; const start = performance.now(), out = W.advanceHalfMonth(before);
      state.planningMs.push(performance.now() - start);
      enabled = false; const replayStart = performance.now(), replay = W.advanceHalfMonth(before);
      state.plainMs.push(performance.now() - replayStart); enabled = true;
      assert.equal(A.hash(out), A.hash(replay), `audit changed turn ${before.turn}`); state.parityChecks++;
      A.addPlan(state.current, plan);
      A.recordTurn(n, before, out, plan, state.current, state.streaks);
      state.world = out.world; turnsThisRun++;
      state.sampledMaxRss = Math.max(state.sampledMaxRss, process.memoryUsage().rss);
      persist('running');
      if (turnsThisRun % 6 === 0) console.log(JSON.stringify({ scenario, turn: before.turn, parityChecks: state.parityChecks, elapsedMs: Math.round(state.elapsedMs) }));
    }
    persist('complete');
    console.log(JSON.stringify({ file, status: 'complete', parityChecks: state.parityChecks, plainHalfMonthMs: A.distribution(state.plainMs) }));
  } finally { V.plan = originalPlan; }
}

if (require.main === module) main();
module.exports = { main };
