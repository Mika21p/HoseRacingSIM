const test = require("node:test");
const assert = require("node:assert/strict");

const { loadEraRules } = require("./helpers/project-loader");

function setup() {
  const project = loadEraRules();
  return { ...project, ns: project.rules };
}

function json(value) {
  return JSON.parse(JSON.stringify(value));
}

function setTime(ns, run, age, month, half) {
  run.career.currentTime = { age, month, half, index: ns.TimeRules.toIndex(age, month, half) };
  run.career.maturity.lastCheckedIndex = run.career.currentTime.index;
}

function fakeResult(occurrence, playerFinish, winnerKey) {
  const player = { entry: { key: "player" }, retired: false };
  const opponentCount = occurrence.fieldPolicy === "historical-fixed" ? 5 : 1;
  const opponents = Array.from({ length: opponentCount }, (_unused, index) => ({
    entry: { key: index === 0 ? "opponent" : `field-${index}` },
    retired: false
  }));
  const field = [player].concat(opponents);
  const winner = field.find((entry) => entry.entry.key === (winnerKey || "opponent")) || opponents[0];
  const ordered = [winner].concat(field.filter((entry) => entry !== winner));
  const oldPlayerIndex = ordered.indexOf(player);
  ordered.splice(oldPlayerIndex, 1);
  ordered.splice(Math.max(0, Math.min(playerFinish - 1, ordered.length)), 0, player);
  return {
    public: {
      raceId: occurrence.raceId || occurrence.raceSnapshot.id,
      raceName: occurrence.nameZh,
      rank: playerFinish <= 5 ? playerFinish : null,
      rankLabel: playerFinish <= 5 ? `${playerFinish}着` : "着外",
      retired: false
    },
    hidden: { playerFieldPosition: playerFinish, fieldResults: ordered, results: ordered }
  };
}

function completeWithFake(ns, run, occurrenceId, finish, winnerKey) {
  const payload = ns.EraRules.buildRacePayload(run, occurrenceId);
  payload.raceInstanceId = `${occurrenceId}:${payload.schedule.index}:test`;
  const occurrence = ns.EraRules.occurrenceFor(run, occurrenceId);
  const result = fakeResult(occurrence, finish, winnerKey);
  const simulate = ns.RaceRules.simulateRace;
  const addRace = ns.CareerRules.addRace;
  ns.RaceRules.simulateRace = () => result;
  ns.CareerRules.addRace = (career, raceResult, schedule) => {
    raceResult.hidden.schedule = { ...schedule };
    career.races.push({ public: raceResult.public, hidden: raceResult.hidden });
  };
  try {
    return ns.EraRules.completeRace(run, payload);
  } finally {
    ns.RaceRules.simulateRace = simulate;
    ns.CareerRules.addRace = addRace;
  }
}

test("v5 scenario starts in June 1997 and converts career time both ways", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "时间测试马" });
  assert.equal(run.version, 5);
  assert.deepEqual(json(run.career.currentTime), { age: 2, month: 6, half: 1, index: ns.TimeRules.toIndex(2, 6, 1) });
  assert.equal(ns.EraRules.historicalDateFromTime(run), "1997-06-01");
  assert.deepEqual(json(ns.EraRules.careerTimeFromHistoricalDate(run, "1998-11-16")), {
    age: 3,
    month: 11,
    half: 2,
    index: ns.TimeRules.toIndex(3, 11, 2)
  });
  assert.equal(run.era.events[0].eventType, "career-start");
});

test("1997 calendar and Asahi fixed field are isolated and exact", () => {
  const { ns } = setup();
  const scenario = ns.EraScenarioRegistry.find("jp-golden-road");
  const occurrences = Object.fromEntries(scenario.occurrences.filter((item) => item.date.startsWith("1997-")).map((item) => [item.id, item]));
  assert.equal(Object.keys(occurrences).length, 24);
  assert.equal(scenario.twoYearCalendarWindows.length, 5);
  assert.deepEqual(json(scenario.twoYearCalendarWindows.map((window) => window.occurrenceIds.length)), [3, 4, 3, 4, 8]);
  assert.deepEqual(json([
    [occurrences["1997-sapporo-3yo"].date, occurrences["1997-sapporo-3yo"].raceSnapshot.grade, occurrences["1997-sapporo-3yo"].raceSnapshot.course, occurrences["1997-sapporo-3yo"].raceSnapshot.distance],
    [occurrences["1997-daily-hai"].date, occurrences["1997-daily-hai"].raceSnapshot.grade, occurrences["1997-daily-hai"].raceSnapshot.course, occurrences["1997-daily-hai"].raceSnapshot.distance],
    [occurrences["1997-keisei-3yo"].date, occurrences["1997-keisei-3yo"].raceSnapshot.grade, occurrences["1997-keisei-3yo"].raceSnapshot.course, occurrences["1997-keisei-3yo"].raceSnapshot.distance],
    [occurrences["1997-kyoto-3yo"].date, occurrences["1997-kyoto-3yo"].raceSnapshot.grade, occurrences["1997-kyoto-3yo"].raceSnapshot.course, occurrences["1997-kyoto-3yo"].raceSnapshot.distance],
    [occurrences["1997-tokyo-sports"].date, occurrences["1997-tokyo-sports"].override.grade, occurrences["1997-tokyo-sports"].override.course, occurrences["1997-tokyo-sports"].override.distance]
  ]), [
    ["1997-09-20", "G3", "札幌", 1800], ["1997-10-18", "G2", "京都", 1600],
    ["1997-11-08", "G2", "东京", 1400], ["1997-11-08", "公开赛", "京都", 1800],
    ["1997-11-15", "G3", "东京", 1800]
  ]);
  assert.deepEqual(json(occurrences["1997-asahi"].opponents.map((entry) => [entry.horseId, entry.ability, entry.historicalScore])), [
    ["grass-wonder", 81, 105], ["meiner-love", 79, 97.5], ["figaro", 78, 96],
    ["agnes-world", 79, 85.5], ["meiner-messer", 76, 76.5]
  ]);
  const run = ns.EraRules.createRun({ horseName: "二岁阵容马" });
  const radio = ns.EraRules.createOccurrenceRace(occurrences["1997-radio-tampa"]);
  assert.equal(radio.id, "era-1997-radio-tampa");
  assert.equal(radio.course, "阪神");
  assert.equal(radio.distance, 2000);
  assert.equal(ns.Races.some((race) => race.id === radio.id), false);
  const asahiPayload = ns.EraRules.buildRacePayload(run, "1997-asahi");
  assert.equal(asahiPayload.opponents.length, 5);
  assert.ok(asahiPayload.opponents.every((entry) => Number.isFinite(entry.historicalScore)));
});

test("cancelling a future entry reopens the same decision with a new stable instance", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "取消重选马" });
  setTime(ns, run, 2, 8, 2);
  run.era.narrative.pendingScenes = [];
  let scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.nodeId, "1997-08-debut-route");
  ns.EraRules.resolveSceneChoice(run, scene.id, "schedule:1997-early-debut");
  const firstInstance = run.career.scheduledRace.raceInstanceId;
  const cancelled = ns.EraRules.cancelScheduledRace(run);
  assert.equal(cancelled.type, "race-cancelled");
  scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.nodeId, "1997-08-debut-route");
  assert.match(scene.id, /retry:1$/);
  ns.EraRules.resolveSceneChoice(run, scene.id, "schedule:1997-early-debut");
  assert.notEqual(run.career.scheduledRace.raceInstanceId, firstInstance);
  assert.equal(run.era.events.filter((event) => event.eventType === "race-cancelled").length, 1);
  assert.equal(run.era.events.filter((event) => event.eventType === "race-entered").length, 2);
});

test("year-end choices are mutually exclusive and finishing the year causes no false absence", () => {
  const { ns } = setup();
  const selected = ns.EraRules.createRun({ horseName: "年末路线马" });
  Object.keys(selected.era.twoYearCalendar.windowChoices).forEach((key) => delete selected.era.twoYearCalendar.windowChoices[key]);
  ns.EraRules.getFreeRaceWindows(selected).forEach((window) => { selected.era.twoYearCalendar.windowChoices[window.id] = "skip"; });
  setTime(ns, selected, 2, 11, 2);
  selected.era.narrative.pendingScenes = [];
  let scene = ns.EraRules.getCurrentScene(selected);
  assert.equal(scene.sourceKind, "two-year-opinion");
  ns.EraRules.resolveSceneChoice(selected, scene.id, "continue");
  scene = ns.EraRules.getCurrentScene(selected);
  assert.equal(scene.nodeId, "1997-11-asahi-entry");
  ns.EraRules.resolveSceneChoice(selected, scene.id, "schedule:1997-asahi");
  assert.equal(selected.era.routes["1997-year-end"], "1997-asahi");
  assert.ok(selected.era.routeExcludedOccurrences.includes("1997-radio-tampa"));
  assert.equal(ns.EraRules.getScheduleOptions(selected, ns.EraRules.getCurrentScene(selected))
    .find((option) => option.occurrence.id === "1997-radio-tampa").status, "route-excluded");

  const skipped = ns.EraRules.createRun({ horseName: "暂缓路线马" });
  ns.EraRules.getFreeRaceWindows(skipped).forEach((window) => { skipped.era.twoYearCalendar.windowChoices[window.id] = "skip"; });
  setTime(ns, skipped, 2, 11, 2);
  skipped.era.narrative.pendingScenes = [];
  scene = ns.EraRules.getCurrentScene(skipped);
  ns.EraRules.resolveSceneChoice(skipped, scene.id, "continue");
  scene = ns.EraRules.getCurrentScene(skipped);
  ns.EraRules.resolveSceneChoice(skipped, scene.id, "decline-asahi");
  scene = ns.EraRules.getCurrentScene(skipped);
  assert.equal(scene.nodeId, "1997-12-radio-entry");
  ns.EraRules.resolveSceneChoice(skipped, scene.id, "finish-two-year");
  assert.ok(skipped.era.routeExcludedOccurrences.includes("1997-asahi"));
  assert.ok(skipped.era.routeExcludedOccurrences.includes("1997-radio-tampa"));
  assert.equal(Object.keys(skipped.era.twoYearResults).length, 0);
  assert.equal(skipped.era.events.some((event) => event.eventType === "race-absent"), false);
});

test("all race narrative snapshots are calculated only from immutable events", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "事件事实马" });
  ns.EraRules.recordEvent(run, {
    eventType: "race-result",
    occurrenceId: "1998-yayoi",
    historicalDate: "1998-03-08",
    playerFinish: 1,
    details: { raceName: "弥生赏", scenarioId: run.scenarioId }
  }, "test:yayoi");
  const first = ns.EraRules.evaluatePreRaceReport(run, "1998-satsuki");
  assert.equal(first.form, "winner");
  assert.equal(first.lastRaceName, "弥生赏");
  run.career.races.push({ public: { raceName: "伪造比赛", rank: 9 }, hidden: { schedule: { index: first.targetIndex - 1 } } });
  const second = ns.EraRules.evaluatePreRaceReport(run, "1998-satsuki");
  assert.equal(second.form, "winner");
  assert.equal(second.lastRaceName, "弥生赏");
});

test("two-year identities use achievement-first priority and legacy remains explicit", () => {
  const { ns } = setup();
  const scenario = ns.EraScenarioRegistry.find("jp-golden-road");
  const base = (type, sequence, extra) => ({ eventId: `e${sequence}`, eventType: type, createdSequence: sequence, ...extra });
  const star = ns.EraNarrative.summarize([
    base("race-result", 1, { historicalYear: 1997, playerFinish: 1 }),
    base("injury-start", 2, { historicalYear: 1997, interruptedPlannedRace: true }),
    base("race-result", 3, { historicalYear: 1997, playerFinish: 1 })
  ], scenario);
  assert.equal(star.twoYearProfile, "two_year_star");
  const injury = ns.EraNarrative.summarize([
    base("race-result", 1, { historicalYear: 1997, playerFinish: 3 }),
    base("race-absent", 2, { historicalYear: 1997, absenceReason: "injury", interruptedPlannedRace: true })
  ], scenario);
  assert.equal(injury.twoYearProfile, "two_year_injury");
  const legacy = ns.EraNarrative.summarize([base("career-start", 1, { recordQuality: "legacy_unrecorded" })], scenario);
  assert.equal(legacy.twoYearProfile, "legacy_unrecorded");
});

test("classic trajectory never restores triple-alive after a lost crown", () => {
  const { ns } = setup();
  const scenario = ns.EraScenarioRegistry.find("jp-golden-road");
  const events = [
    { eventId: "s", eventType: "race-result", createdSequence: 1, occurrenceId: "1998-satsuki", historicalYear: 1998, keyRace: true, playerFinish: 4 },
    { eventId: "d", eventType: "race-result", createdSequence: 2, occurrenceId: "1998-derby", historicalYear: 1998, keyRace: true, playerFinish: 1 }
  ];
  const summary = ns.EraNarrative.summarize(events, scenario);
  assert.notEqual(summary.classicTrajectory, "triple_alive");
  assert.equal(ns.EraNarrative.validate(summary).length, 0);
});

test("important two-year results feed event summaries while generated fields stay era-only", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "二岁结果马" });
  const outcome = completeWithFake(ns, run, "1997-radio-tampa", 1, "player");
  assert.equal(outcome.twoYearRecord.classification, "win");
  assert.equal(run.era.events.filter((event) => event.occurrenceId === "1997-radio-tampa" && event.eventType === "race-result").length, 1);
  assert.equal(ns.EraRules.getNarrativeSummary(run).twoYearProfile, "two_year_star");
  assert.equal(outcome.result.hidden.eraOccurrenceId, "1997-radio-tampa");
  assert.equal(ns.HistoricalHorses.some((horse) => horse.id === outcome.result.hidden.eraOccurrenceId), false);
});

test("free calendar eligibility follows debut, maiden, open and G2 promotion without random exclusion", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "级别晋升马" });
  setTime(ns, run, 2, 8, 2);
  let plans = ns.EraRules.getFreeRacePlans(run, "1997-august-late");
  assert.deepEqual(json(plans.filter((plan) => plan.eligible).map((plan) => plan.race.raceClass)), ["new", "new", "new"]);

  ns.EraRules.recordEvent(run, {
    eventType: "race-result", occurrenceId: "1997-early-debut", historicalDate: "1997-09-07", playerFinish: 5,
    details: { raceName: "中山草地1600米新马战", scenarioId: run.scenarioId }
  }, "promotion:new-loss");
  run.era.twoYearCalendar.windowChoices["1997-august-late"] = "1997-early-debut";
  setTime(ns, run, 2, 9, 2);
  plans = ns.EraRules.getFreeRacePlans(run, "1997-september-late");
  assert.deepEqual(json(plans.filter((plan) => plan.eligible).map((plan) => plan.occurrence.id)), ["1997-sapporo-maiden"]);

  ns.EraRules.recordEvent(run, {
    eventType: "race-result", occurrenceId: "1997-sapporo-maiden", historicalDate: "1997-09-20", playerFinish: 1,
    details: { raceName: "札幌草地1800米未胜利战", scenarioId: run.scenarioId }
  }, "promotion:maiden-win");
  run.era.twoYearCalendar.windowChoices["1997-september-late"] = "1997-sapporo-maiden";
  setTime(ns, run, 2, 10, 2);
  plans = ns.EraRules.getFreeRacePlans(run, "1997-october-late");
  assert.equal(plans.find((plan) => plan.occurrence.id === "1997-daily-hai").eligible, false);
  assert.deepEqual(json(plans.filter((plan) => plan.eligible).map((plan) => plan.occurrence.id)), ["1997-kigiku", "1997-icho"]);

  ns.EraRules.recordEvent(run, {
    eventType: "race-result", occurrenceId: "1997-kigiku", historicalDate: "1997-10-25", playerFinish: 1,
    details: { raceName: "黄菊赏", scenarioId: run.scenarioId }
  }, "promotion:one-win");
  run.era.twoYearCalendar.windowChoices["1997-october-late"] = "1997-kigiku";
  setTime(ns, run, 2, 11, 1);
  plans = ns.EraRules.getFreeRacePlans(run, "1997-november-early");
  assert.equal(plans.find((plan) => plan.occurrence.id === "1997-keisei-3yo").eligible, true);
  assert.equal(plans.find((plan) => plan.occurrence.id === "1997-kyoto-500").eligible, false);
  assert.ok(plans.filter((plan) => plan.eligible).every((plan) => ["open", "g3", "g2"].includes(plan.race.raceClass)));
});

test("calendar windows allow one choice, skipping creates no absence, and a same-turn entry can be reselected", () => {
  const { ns } = setup();
  const waiting = ns.EraRules.createRun({ horseName: "等待出道马" });
  setTime(ns, waiting, 2, 8, 2);
  waiting.era.narrative.pendingScenes = [];
  let scene = ns.EraRules.getCurrentScene(waiting);
  const result = ns.EraRules.resolveSceneChoice(waiting, scene.id, "wait-debut");
  assert.equal(result.type, "skip-window");
  assert.equal(waiting.era.twoYearCalendar.windowChoices["1997-august-late"], "skip");
  assert.equal(waiting.era.events.some((event) => event.eventType === "race-absent"), false);
  assert.ok(waiting.era.events.some((event) => event.eventType === "race-window-skipped"));

  const reselect = ns.EraRules.createRun({ horseName: "同旬重选马" });
  ns.EraRules.recordEvent(reselect, {
    eventType: "race-result", occurrenceId: "1997-early-debut", historicalDate: "1997-09-07", playerFinish: 6,
    details: { raceName: "中山草地1600米新马战", scenarioId: reselect.scenarioId }
  }, "same-turn:debut");
  ["1997-august-late", "1997-september-late", "1997-october-early", "1997-october-late"].forEach((windowId) => {
    reselect.era.twoYearCalendar.windowChoices[windowId] = "skip";
  });
  setTime(ns, reselect, 2, 11, 1);
  reselect.era.narrative.pendingScenes = [];
  scene = ns.EraRules.getCurrentScene(reselect);
  assert.equal(scene.nodeId, "1997-11-free-calendar");
  ns.EraRules.resolveSceneChoice(reselect, scene.id, "schedule:1997-tokyo-maiden-nov");
  assert.equal(reselect.career.scheduledRace.schedule.index, reselect.career.currentTime.index);
  assert.equal(ns.EraRules.getFreeRacePlans(reselect, "1997-november-early").some((plan) => plan.eligible), false);
  assert.equal(ns.EraRules.cancelScheduledRace(reselect).type, "race-cancelled");
  assert.equal(reselect.era.twoYearCalendar.windowChoices["1997-november-early"], undefined);
  scene = ns.EraRules.getCurrentScene(reselect);
  assert.match(scene.id, /retry:1$/);
  ns.EraRules.resolveSceneChoice(reselect, scene.id, "schedule:1997-tokyo-maiden-nov");
  assert.equal(reselect.career.scheduledRace.eraOccurrenceId, "1997-tokyo-maiden-nov");
});

test("ordinary free races use era-only generated opponents, create only a result record, and expose fatigue risk", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "自由赛历马" });
  setTime(ns, run, 2, 8, 2);
  const payload = ns.EraRules.buildRacePayload(run, "1997-early-debut-hanshin");
  assert.equal(payload.opponents.length, 0);
  assert.ok(payload.opponent);
  assert.equal(ns.HistoricalHorses.some((horse) => horse.id === payload.opponent.horseId), false);
  const outcome = completeWithFake(ns, run, "1997-early-debut-hanshin", 2, "opponent");
  assert.equal(outcome.keyRecord, null);
  assert.equal(outcome.twoYearRecord, null);
  assert.equal(run.era.news.length, 0);
  assert.equal(run.era.chronicle.length, 0);
  assert.equal(run.era.events.filter((event) => event.eventType === "race-result" && event.occurrenceId === "1997-early-debut-hanshin").length, 1);
  run.career.lastRaceIndex = payload.schedule.index;
  run.career.races[run.career.races.length - 1].hidden.race = payload.race;
  setTime(ns, run, 2, 9, 2);
  const preview = ns.EraRules.getRegistrationPreview(run, "1997-sapporo-maiden");
  assert.equal(preview.eligible, true);
  assert.equal(preview.withinDistance, true);
  assert.equal(preview.fatigue.eligible, true);
  assert.ok(preview.fatigue.probability > 0);
});

test("two-year opinion covers all profiles from cutoff statistics and freezes its evidence", () => {
  const cases = [
    { profile: "two_year_star", events: [{ id: "1997-sapporo-3yo", date: "1997-09-20", finish: 1 }] },
    { profile: "two_year_injury", events: [{ id: "1997-early-debut", date: "1997-09-07", finish: 3 }, { absent: true }] },
    { profile: "two_year_consistent", events: [{ id: "1997-early-debut", date: "1997-09-07", finish: 2 }, { id: "1997-nojigiku", date: "1997-09-27", finish: 3 }] },
    { profile: "late_debut", events: [{ id: "1997-late-debut", date: "1997-11-08", finish: 2 }] },
    { profile: "two_year_struggling", events: [{ id: "1997-early-debut", date: "1997-09-07", finish: 6 }] },
    { profile: "two_year_unproven", events: [{ id: "1997-early-debut", date: "1997-09-07", finish: 2 }] },
    { profile: "legacy_unrecorded", legacy: true, events: [] }
  ];
  cases.forEach((entry, caseIndex) => {
    const { ns } = setup();
    const run = ns.EraRules.createRun({ horseName: `舆论马${caseIndex}` });
    entry.events.forEach((event, eventIndex) => {
      if (event.absent) {
        ns.EraRules.recordEvent(run, {
          eventType: "race-absent", occurrenceId: "1997-tokyo-sports", historicalDate: "1997-11-15",
          absenceReason: "injury", interruptedPlannedRace: true, details: { raceName: "东京体育杯三岁锦标", scenarioId: run.scenarioId }
        }, `opinion:${caseIndex}:absent`);
      } else {
        ns.EraRules.recordEvent(run, {
          eventType: "race-result", occurrenceId: event.id, historicalDate: event.date, playerFinish: event.finish,
          details: { raceName: event.id, scenarioId: run.scenarioId }
        }, `opinion:${caseIndex}:${eventIndex}`);
      }
    });
    if (entry.legacy) ns.EraRules.recordEvent(run, { eventType: "legacy-record", historicalDate: null, recordQuality: "legacy_unrecorded" }, `opinion:${caseIndex}:legacy`);
    const snapshot = ns.EraRules.evaluateTwoYearOpinion(run);
    assert.equal(snapshot.profile, entry.profile);
    assert.equal(snapshot.textId, `jp.golden-road.main.1997.opinion.${{
      two_year_star: "star", two_year_injury: "injury", two_year_consistent: "consistent", late_debut: "late-debut",
      two_year_struggling: "struggling", two_year_unproven: "unproven", legacy_unrecorded: "legacy"
    }[entry.profile]}`);
    assert.equal(snapshot.statistics.starts, entry.events.filter((event) => !event.absent).length);
  });

  const { ns } = setup();
  const frozen = ns.EraRules.createRun({ horseName: "快照冻结马", playerReference: "记录者" });
  ns.EraRules.recordEvent(frozen, {
    eventType: "race-result", occurrenceId: "1997-tokyo-sports", historicalDate: "1997-11-15", playerFinish: 1,
    details: { raceName: "东京体育杯三岁锦标", scenarioId: frozen.scenarioId }
  }, "opinion:cutoff-win");
  ns.EraRules.recordEvent(frozen, {
    eventType: "race-result", occurrenceId: "1997-radio-tampa", historicalDate: "1997-12-20", playerFinish: 7,
    details: { raceName: "电台杯三岁锦标", scenarioId: frozen.scenarioId }
  }, "opinion:after-cutoff");
  const first = json(ns.EraRules.evaluateTwoYearOpinion(frozen));
  ns.EraRules.recordEvent(frozen, {
    eventType: "race-result", occurrenceId: "1997-nojigiku", historicalDate: "1997-09-27", playerFinish: 7,
    details: { raceName: "迟到写入的旧赛果", scenarioId: frozen.scenarioId }
  }, "opinion:late-write");
  assert.deepEqual(json(ns.EraRules.evaluateTwoYearOpinion(frozen)), first);
  assert.equal(first.statistics.starts, 1);
  assert.equal(first.latestRace.raceName, "东京体育杯三岁锦标");
  assert.equal(first.tokensSnapshot.PLAYER_REFERENCE, "记录者");
});

test("November 16 always presents the frozen opinion before the Asahi entry meeting", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "报道顺序马" });
  ns.EraRules.getFreeRaceWindows(run).forEach((window) => { run.era.twoYearCalendar.windowChoices[window.id] = "skip"; });
  setTime(ns, run, 2, 11, 2);
  run.era.narrative.pendingScenes = [];
  let scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.sourceKind, "two-year-opinion");
  assert.equal(scene.textId, "jp.golden-road.main.1997.opinion.unproven");
  ns.EraRules.resolveSceneChoice(run, scene.id, "continue");
  scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.nodeId, "1997-11-asahi-entry");
  assert.deepEqual(json(ns.EraRules.getSceneChoices(run, scene).map((choice) => choice.id)), ["schedule:1997-asahi", "decline-asahi", "open-schedule"]);
});

test("v4 migration expires past free windows and records an unplayable opinion without rewriting known routes", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "四版迁移马" });
  run.version = 4;
  delete run.era.twoYearCalendar;
  run.era.routes["1997-year-end"] = "1997-asahi";
  setTime(ns, run, 2, 11, 2);
  run.era.narrative.pendingScenes = [];
  const restored = ns.EraRules.normalizeSave(json(run));
  assert.equal(restored.version, 5);
  assert.equal(restored.era.routes.twoYearFinal, "asahi");
  assert.ok(restored.era.twoYearCalendar.migratedExpiredWindowIds.includes("1997-october-late"));
  assert.equal(restored.era.twoYearCalendar.opinionSnapshot.migrated, true);
  assert.ok(!restored.era.narrative.pendingScenes.some((scene) => scene.sourceKind === "two-year-opinion"));
  assert.ok(restored.era.narrative.timeline.some((scene) => scene.status === "migrated-expired"));
});

test("ending and summary are committed only after the ending scene is resolved", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "门控结局马" });
  run.era.classicWins = 3;
  run.era.keyRaceResults["1998-kikka"] = { occurrenceId: "1998-kikka", classification: "win", playerFinish: 1 };
  ns.EraRules.finalizeStage(run);
  assert.equal(run.era.endingId, "");
  assert.equal(run.era.summary, null);
  assert.equal(run.era.stageState.summaryVisible, false);
  let scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.textId, "jp.golden-road.main.1998.season.review");
  ns.EraRules.resolveSceneChoice(run, scene.id, "continue");
  scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.type, "ending");
  ns.EraRules.resolveSceneChoice(run, scene.id, "continue");
  assert.equal(run.era.endingId, "triple");
  assert.equal(run.era.summary.endingId, "triple");
  assert.equal(run.era.stageState.summaryVisible, true);
});

test("v1-v3 migrations preserve 1998 time and archive all earlier new nodes", () => {
  [1, 2, 3].forEach((version) => {
    const { ns } = setup();
    const run = ns.EraRules.createRun({ horseName: `旧档${version}` });
    run.version = version;
    delete run.era.onboarding;
    setTime(ns, run, 3, 5, 1);
    run.era.narrative.pendingScenes = [];
    run.era.narrative.timeline = [];
    run.era.narrative.resolvedSceneIds = [];
    const restored = ns.EraRules.normalizeSave(json(run));
    assert.equal(restored.version, 5);
    assert.equal(restored.career.currentTime.age, 3);
    assert.equal(restored.era.twoYearProfile, "legacy_unrecorded");
    assert.ok(restored.era.events.some((event) => event.recordQuality === "legacy_unrecorded" && event.historicalDate === null));
    assert.ok(restored.era.narrative.timeline.some((scene) => scene.id === "node:1997-12-two-year-summary" && scene.status === "migrated-expired"));
    assert.ok(!restored.era.narrative.pendingScenes.some((scene) => String(scene.date).startsWith("1997-")));
    restored.era.narrative.pendingScenes.concat(restored.era.narrative.timeline).forEach((scene) => {
      assert.ok(scene.textSlots && scene.tokensSnapshot && scene.narrativeSnapshot);
    });
  });
});
