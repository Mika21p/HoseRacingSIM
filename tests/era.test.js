const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { loadEraRules, projectRoot } = require("./helpers/project-loader");

function json(value) {
  return JSON.parse(JSON.stringify(value));
}

function setup() {
  const project = loadEraRules();
  return { ...project, ns: project.rules };
}

function fakeResult(occurrence, playerFinish, winnerIndex, retired) {
  const keys = ["opponent", "field-1", "field-2", "field-3", "field-4"];
  const player = { entry: { key: "player" }, retired: !!retired };
  const opponents = keys.map((key) => ({ entry: { key }, retired: false }));
  const winner = winnerIndex === "player" ? player : opponents[winnerIndex];
  const remaining = [player].concat(opponents).filter((item) => item !== winner);
  const ordered = [winner].concat(remaining);
  const currentPlayerIndex = ordered.indexOf(player);
  if (Number.isFinite(playerFinish) && playerFinish > 0 && currentPlayerIndex !== playerFinish - 1) {
    ordered.splice(currentPlayerIndex, 1);
    ordered.splice(Math.min(playerFinish - 1, ordered.length), 0, player);
  }
  return {
    public: {
      raceId: occurrence.raceId,
      raceName: occurrence.nameZh,
      rank: playerFinish <= 5 ? playerFinish : null,
      rankLabel: retired ? "退赛" : (playerFinish <= 5 ? `${playerFinish}着` : "着外"),
      retired: !!retired,
      playerJockeyName: "高桥隼人"
    },
    hidden: {
      playerFieldPosition: playerFinish,
      fieldResults: ordered,
      results: ordered
    }
  };
}

function reportRace(ns, occurrenceId, rank, options) {
  const opts = options || {};
  const occurrence = ns.EraRules.occurrenceFor(opts.run, occurrenceId);
  const schedule = ns.EraRules.occurrenceSchedule(occurrence);
  return {
    public: {
      raceId: occurrence.raceId,
      raceName: opts.raceName || occurrence.nameZh,
      rank: rank <= 5 ? rank : null,
      rankLabel: opts.retired ? "退赛" : (rank <= 5 ? `${rank}着` : "着外"),
      retired: !!opts.retired
    },
    hidden: {
      playerFieldPosition: rank,
      schedule: { ...schedule, index: Number.isFinite(opts.index) ? opts.index : schedule.index }
    }
  };
}

function addReportEvent(ns, run, occurrenceId, rank, options) {
  const opts = options || {};
  const occurrence = ns.EraRules.occurrenceFor(run, occurrenceId);
  return ns.EraRules.recordEvent(run, {
    eventType: "race-result",
    occurrenceId,
    historicalDate: occurrence.date,
    playerFinish: rank,
    playerRetired: !!opts.retired,
    details: { raceName: opts.raceName || occurrence.nameZh, scenarioId: run.scenarioId }
  }, opts.dedupeKey || `test-report:${occurrenceId}:${run.era.nextEventSequence}`);
}

test("era data and triggerable text are internally complete", () => {
  const { ns } = setup();
  ["register", "find", "list", "listEntries", "validate"].forEach((method) => {
    assert.equal(typeof ns.EraScenarioRegistry[method], "function");
  });
  ["get", "resolve", "validate"].forEach((method) => {
    assert.equal(typeof ns.EraTextIndex[method], "function");
  });
  [
    "createEntrySetup", "normalizeEntrySetup", "getEntryCandidates", "selectEntryCandidate", "createRun",
    "getAvailablePlans", "getFreeRaceWindows", "getFreeRacePlans", "getRegistrationPreview", "buildRacePayload", "advanceTurn", "completeRace", "retire", "finalizeStage", "normalizeSave",
    "syncNarrative", "getCurrentScene", "getTimeline", "getSceneChoices", "resolveSceneChoice", "previewSceneChoice",
    "completeTransientScene", "completeEncounterNaming", "getScheduleOptions", "advanceNarrative", "evaluatePreRaceReport", "evaluateTwoYearOpinion", "getNewspaperItems"
  ].forEach((method) => {
    assert.equal(typeof ns.EraRules[method], "function");
  });
  assert.deepEqual(json(ns.EraTextIndex.validate()), []);
  assert.deepEqual(json(ns.EraScenarioRegistry.validate()), []);
  const scenario = ns.EraScenarioRegistry.find("jp-golden-road");
  assert.ok(scenario);
  assert.equal(ns.EraScenarioRegistry.listEntries().length, 1);
  assert.equal(ns.EraScenarioRegistry.listEntries()[0].id, "jp-golden-road-main-entry");
  assert.equal(scenario.playerTemplate.trainerId, "sato-yuta");
  assert.equal(scenario.playerTemplate.playerJockey.ability, 70);
  assert.equal(scenario.playerTemplate.playerJockey.fictional, true);
  assert.equal(scenario.playerTemplate.commentAccuracy, "close");
  assert.ok(Object.keys(scenario.characters).length >= 12);
  assert.ok(scenario.characters["jockey-take-yutaka"]);
  assert.ok(scenario.characters["jockey-norihiro-yokoyama"]);
  assert.ok(scenario.characters["jockey-yuichi-fukunaga"]);
  assert.ok(scenario.sceneNodes.length >= 15);
  assert.equal(scenario.encounterNodes.length, 5);
  assert.ok(scenario.sceneNodes.some((scene) => scene.speakerId === "player"));
  assert.deepEqual(
    json(Object.fromEntries(Object.entries(scenario.eraHorses).map(([id, horse]) => [id, horse.displayNameZh]))),
    {
      emosion: "心潮激荡",
      "divine-light": "神圣之光",
      "bold-emperor": "勇者帝王",
      "daiwa-superior": "大和卓越",
      "mejiro-lambert": "目白兰伯特",
      "meiner-love": "矿之恋",
      figaro: "费加罗",
      "agnes-world": "爱丽世界",
      "meiner-messer": "迈纳利刃",
      "lord-ax": "ロードアックス"
    }
  );
  const keyRaces = scenario.occurrences.filter((occurrence) => occurrence.keyRace);
  assert.equal(keyRaces.length, 3);
  assert.deepEqual(
    json(Object.fromEntries(keyRaces.map((occurrence) => [
      occurrence.id,
      occurrence.opponents.map((opponent) => [opponent.horseId, opponent.historicalScore])
    ]))),
    {
      "1998-satsuki": [["seiun-sky", 104], ["king-halo", 103], ["special-week", 101], ["emosion", 95], ["divine-light", 93.5]],
      "1998-derby": [["special-week", 105], ["bold-emperor", 95], ["daiwa-superior", 94], ["seiun-sky", 93.5], ["king-halo", 73.5]],
      "1998-kikka": [["seiun-sky", 105], ["special-week", 98], ["emosion", 97.5], ["mejiro-lambert", 97], ["king-halo", 96.5]]
    }
  );
  keyRaces.forEach((occurrence) => {
    assert.equal(occurrence.opponents.length, 5);
    assert.equal(new Set(occurrence.opponents.map((opponent) => opponent.horseId)).size, 5);
    assert.ok(occurrence.opponents.every((opponent) => Number.isFinite(opponent.historicalScore)));
    assert.equal(ns.EraTextIndex.get(occurrence.text.pre).status, "outline");
    assert.equal(ns.EraTextIndex.get(occurrence.text.pre).presentation, "outline");
    Object.values(occurrence.text.post).forEach((textId) => {
      assert.equal(ns.EraTextIndex.get(textId).status, "outline");
      assert.equal(ns.EraTextIndex.get(textId).presentation, "outline");
    });
  });
  const satsukiRun = ns.EraRules.createRun({ horseName: "中文名测试马" });
  const satsukiPayload = ns.EraRules.buildRacePayload(satsukiRun, "1998-satsuki");
  assert.deepEqual(
    json(satsukiPayload.opponents.map((opponent) => opponent.name)),
    ["青云天空", "帝王光环", "特别周", "心潮激荡", "神圣之光"]
  );
  assert.equal(ns.EraTextIndex.findPlaceholders().length, 2);
});

test("entry setup freezes one private candidate and exposes only the route preview", () => {
  const { ns } = setup();
  const entrySetup = ns.EraRules.createEntrySetup({ playerReference: "见证人" });
  const publicCandidates = ns.EraRules.getEntryCandidates(entrySetup);
  assert.equal(entrySetup.version, 1);
  assert.equal(publicCandidates.length, 1);
  assert.deepEqual(
    Object.keys(json(publicCandidates[0])).sort(),
    ["coat", "gender", "id", "previewTextId", "routeId", "routeLabel", "scenarioId", "title", "trainerId", "trainerName"].sort()
  );
  assert.equal("horse" in publicCandidates[0], false);
  assert.equal("strength" in publicCandidates[0], false);
  assert.equal("distMin" in publicCandidates[0], false);
  assert.equal("commentDetails" in publicCandidates[0], false);

  const frozen = json(entrySetup.candidates[0]);
  const restoredSetup = ns.EraRules.normalizeEntrySetup(json(entrySetup));
  assert.deepEqual(json(restoredSetup.candidates[0].horse), frozen.horse);
  assert.deepEqual(json(restoredSetup.candidates[0].commentDetails), frozen.commentDetails);
  assert.equal(frozen.commentDetails.length, 5);
  assert.ok(frozen.commentDetails.every((comment) => comment.accuracy === "close"));
  assert.throws(() => ns.EraRules.selectEntryCandidate(restoredSetup, "missing-entry"), /Unknown era entry candidate/);

  const run = ns.EraRules.selectEntryCandidate(restoredSetup, publicCandidates[0].id);
  assert.equal(run.career.horse.id, frozen.horse.id);
  assert.equal(run.career.horse.strength, frozen.horse.strength);
  assert.equal(run.career.horse.coat, frozen.horse.coat);
  assert.deepEqual(json(run.career.commentDetails), frozen.commentDetails);
  assert.equal(run.era.entryCandidateId, publicCandidates[0].id);
  assert.throws(() => ns.EraRules.selectEntryCandidate(restoredSetup, publicCandidates[0].id), /already been selected/);
});

test("encounter choices are transient, assessment is fixed-close, and naming unlocks the season", () => {
  const { ns } = setup();
  const entrySetup = ns.EraRules.createEntrySetup({ playerReference: "<b>我的称呼</b>{{RACE_NAME}}" });
  const candidateId = ns.EraRules.getEntryCandidates(entrySetup)[0].id;
  const run = ns.EraRules.selectEntryCandidate(entrySetup, candidateId);
  assert.equal(run.version, 5);
  assert.equal(run.era.onboarding.phase, "encounter");
  assert.equal(run.career.horse.name, "那匹尚未命名的马");
  assert.deepEqual(json(ns.EraRules.getAvailablePlans(run)), []);
  assert.throws(() => ns.EraRules.buildRacePayload(run, "1998-yayoi"), /not currently reachable/);
  assert.equal(ns.EraRules.completeRace(run, {}).type, "onboarding");
  assert.equal(ns.EraRules.advanceTurn(run).type, "onboarding");

  let scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.nodeId, "encounter-stable-arrival");
  ns.EraRules.resolveSceneChoice(run, scene.id, "continue");
  scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.nodeId, "encounter-first-look");
  const beforePreview = JSON.stringify(run);
  ["observe", "wait", "approach"].forEach((choiceId) => {
    const preview = ns.EraRules.previewSceneChoice(run, scene.id, choiceId);
    assert.equal(preview.type, "transient-preview");
    assert.equal(preview.choiceId, choiceId);
    assert.equal(JSON.stringify(run), beforePreview);
  });
  const choicesBefore = run.era.narrative.choiceRecords.length;
  ns.EraRules.completeTransientScene(run, scene.id);
  assert.equal(run.era.narrative.choiceRecords.length, choicesBefore);
  assert.ok(!JSON.stringify(run.era.narrative.timeline).includes("encounter.response."));

  scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.nodeId, "encounter-trainer-assessment");
  assert.equal(run.career.commentDetails.length, 5);
  assert.ok(run.career.commentDetails.every((comment) => comment.accuracy === "close"));
  ns.EraRules.resolveSceneChoice(run, scene.id, "continue");
  scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.interactionKind, "naming");
  assert.throws(() => ns.EraRules.completeEncounterNaming(run, "  "), /填写名字/);
  assert.throws(() => ns.EraRules.completeEncounterNaming(run, "马".repeat(31)), /不能超过30/);
  const maliciousName = "<img>{{RACE_NAME}}";
  ns.EraRules.completeEncounterNaming(run, maliciousName);
  assert.equal(run.career.horse.name, maliciousName);
  const namingRecord = run.era.narrative.timeline.find((item) => item.nodeId === "encounter-naming");
  assert.equal(namingRecord.tokens.CANDIDATE_HORSE_REFERENCE, "那匹尚未命名的马");
  scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.nodeId, "encounter-named");
  assert.equal(scene.tokens.PLAYER_HORSE_NAME, maliciousName);
  assert.equal(scene.tokens.CANDIDATE_HORSE_REFERENCE, maliciousName);
  ns.EraRules.resolveSceneChoice(run, scene.id, "continue");
  assert.equal(run.era.onboarding.phase, "complete");
  assert.equal(run.era.onboarding.namingComplete, true);
  assert.ok(ns.EraRules.getAvailablePlans(run).length > 0);
  assert.notEqual(ns.EraRules.getCurrentScene(run).sourceKind, "encounter");
});

test("all season scenes and eighteen dynamic reports stay as one-sentence outlines", () => {
  const { ns } = setup();
  const scenario = ns.EraScenarioRegistry.find("jp-golden-road");
  const allowedTypes = new Set(["dialogue", "news", "dynamic-report", "time", "race-decision", "race-result", "ending"]);
  scenario.sceneNodes.forEach((scene) => {
    assert.ok(allowedTypes.has(scene.type));
    const entry = ns.EraTextIndex.get(scene.textId);
    assert.equal(entry.status, "outline");
    assert.equal(entry.presentation, "outline");
    assert.equal((entry.body.match(/[。！？]/g) || []).length, 1);
  });
  scenario.encounterNodes.forEach((scene) => {
    const ids = [scene.textId].concat((scene.transientChoices || []).map((choice) => choice.responseTextId));
    ids.forEach((textId) => {
      const entry = ns.EraTextIndex.get(textId);
      assert.equal(entry.status, "outline");
      assert.equal(entry.presentation, "outline");
      assert.equal((entry.body.match(/[。！？]/g) || []).length, 1);
    });
  });
  const reports = ns.EraTextIndex.ALL.filter((entry) => entry.category === "dynamic-report");
  assert.equal(reports.length, 18);
  reports.forEach((entry) => {
    assert.equal(entry.status, "outline");
    assert.equal(entry.presentation, "outline");
    assert.equal((entry.body.match(/[。！？]/g) || []).length, 1);
  });
  const opinionIds = Object.values(scenario.twoYearOpinion.textByProfile);
  assert.equal(opinionIds.length, 7);
  assert.equal(new Set(opinionIds).size, 7);
  opinionIds.forEach((textId) => {
    const entry = ns.EraTextIndex.get(textId);
    assert.equal(entry.status, "outline");
    assert.equal(entry.presentation, "outline");
    assert.equal((entry.body.match(/[。！？]/g) || []).length, 1);
  });
});

test("era player template always preserves the road-route identity", () => {
  const { ns } = setup();
  for (let index = 0; index < 100; index += 1) {
    const run = ns.EraRules.createRun({ horseName: `测试马${index}` });
    const horse = run.career.horse;
    assert.equal(run.career.gameMode, "era");
    assert.equal(horse.source, "era");
    assert.equal(horse.birthYear, 1995);
    assert.equal(horse.gender, "牡马");
    assert.equal(horse.surfacePref, "草地");
    assert.equal(horse.coreDist, 2400);
    assert.equal(horse.distMin, 1800);
    assert.equal(horse.distMax, 3000);
    assert.ok(horse.strength >= 81 && horse.strength <= 85);
    assert.equal(horse.strengthLabel, "剧情模板 81-85");
    assert.equal(horse.debugMode, undefined);
    assert.equal(run.career.commentDetails.length, 5);
    assert.deepEqual(
      json(run.career.commentDetails.map((comment) => comment.id)),
      ["strength", "surface", "distance", "growth", "temperament"]
    );
    assert.ok(run.career.commentDetails.every((comment) => comment.accuracy === "close" && comment.accuracyLabel === "基本准确"));
    assert.deepEqual(json(run.career.comments), json(run.career.commentDetails.map((comment) => comment.text)));
  }
});

test("era key-race opponents use fixed historical scores and win player ties", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "固定分测试马" });
  const payload = ns.EraRules.buildRacePayload(run, "1998-satsuki");
  const originalRoll = ns.Random.roll;
  const originalCalc = ns.HorseRules.calcRaceAbility;

  function simulateAt(playerAbility, rollValue) {
    ns.Random.roll = (sides) => Math.min(rollValue, sides);
    ns.HorseRules.calcRaceAbility = () => ({ ability: playerAbility });
    return ns.RaceRules.simulateRace(run.career.horse, payload.race, {
      opponent: payload.opponent,
      opponents: payload.opponents,
      trackCondition: "良",
      playerJockey: run.career.playerJockey,
      currentTime: run.career.currentTime
    });
  }

  try {
    const tied = simulateAt(82, 2);
    const tiedPlayer = tied.hidden.fieldResults.find((item) => item.entry.key === "player");
    const tiedWinner = tied.hidden.fieldResults[0];
    assert.equal(tiedPlayer.total, 104);
    assert.equal(tiedWinner.entry.key, "opponent");
    assert.equal(tied.hidden.playerFieldPosition, 2);

    const winning = simulateAt(83, 2);
    assert.equal(winning.hidden.fieldResults[0].entry.key, "player");
    assert.equal(winning.hidden.playerFieldPosition, 1);

    const differentPlayerRoll = simulateAt(82, 5);
    const expectedScores = new Map(payload.opponents.map((opponent, index) => [
      index === 0 ? "opponent" : `field-${index}`,
      opponent.historicalScore
    ]));
    [tied, differentPlayerRoll].forEach((result) => {
      expectedScores.forEach((score, key) => {
        const opponentResult = result.hidden.fieldResults.find((item) => item.entry.key === key);
        assert.equal(opponentResult.total, score);
        assert.equal(opponentResult.fixedScore, true);
        assert.equal(opponentResult.scoreSource, "historical-fixed");
        assert.equal(opponentResult.retired, false);
      });
    });
    const differentPlayer = differentPlayerRoll.hidden.fieldResults.find((item) => item.entry.key === "player");
    assert.notEqual(differentPlayer.total, tiedPlayer.total);
    assert.equal(differentPlayer.fixedScore, undefined);
  } finally {
    ns.Random.roll = originalRoll;
    ns.HorseRules.calcRaceAbility = originalCalc;
  }
});

test("era validation rejects a missing key-race historical score", () => {
  const { ns } = setup();
  const scenario = ns.EraScenarioRegistry.find("jp-golden-road");
  const opponent = scenario.occurrences.find((item) => item.id === "1998-satsuki").opponents[0];
  delete opponent.historicalScore;
  assert.ok(ns.EraScenarioRegistry.validate().some((warning) => warning.type === "invalid-historical-score"));
});

test("era schedule uses 1998 occurrence dates without mutating global races", () => {
  const { ns } = setup();
  const scenario = ns.EraScenarioRegistry.find("jp-golden-road");
  const derbyOccurrence = scenario.occurrences.find((item) => item.id === "1998-derby");
  const kikkaOccurrence = scenario.occurrences.find((item) => item.id === "1998-kikka");
  const globalDerby = ns.Races.find((race) => race.id === "tokyo-yushun");
  const globalKikka = ns.Races.find((race) => race.id === "kikka-sho");
  assert.equal(ns.EraRules.occurrenceSchedule(derbyOccurrence).label, "1998-06-07 · 日本德比");
  assert.equal(ns.EraRules.occurrenceSchedule(kikkaOccurrence).label, "1998-11-08 · 菊花赏");
  assert.equal(globalDerby.month, 5);
  assert.equal(globalKikka.month, 10);
});

test("text replacement is one-pass and leaves player input as inert text", () => {
  const { ns } = setup();
  const maliciousName = '<img src=x onerror=alert(1)>{{ACTUAL_WINNER_NAME}}';
  const maliciousReference = '<svg onload=alert(2)>{{RACE_NAME}}';
  const resolved = ns.EraTextIndex.resolve("jp.golden-road.main.1998.prologue.open", {
    PLAYER_HORSE_NAME: maliciousName,
    PLAYER_REFERENCE: maliciousReference,
    ACTUAL_WINNER_NAME: "不应递归出现"
  });
  assert.match(resolved.body, /<img src=x onerror=alert\(1\)>\{\{ACTUAL_WINNER_NAME\}\}/);
  assert.match(resolved.body, /<svg onload=alert\(2\)>\{\{RACE_NAME\}\}/);
  assert.doesNotMatch(resolved.body, /不应递归出现/);
  assert.throws(
    () => ns.EraTextIndex.resolve("jp.golden-road.main.1999.spring.placeholder", {}),
    /Placeholder era text cannot be displayed/
  );
  const ui = fs.readFileSync(path.join(projectRoot, "js/ui/era-render.js"), "utf8");
  assert.match(ui, /escapeHtml\(content\.body\)/);
  assert.match(ui, /escapeHtml\(character\.name\)/);
});

test("pre-race reporting uses only the latest race for all six classifications", () => {
  const { ns } = setup();
  const cases = [
    { rank: null, expected: "unproven" },
    { rank: 1, expected: "winner" },
    { rank: 3, expected: "contender" },
    { rank: 5, expected: "mixed" },
    { rank: 6, expected: "outsider" },
    { rank: 6, retired: true, expected: "health-question" }
  ];
  cases.forEach((item) => {
    const run = ns.EraRules.createRun({ horseName: `报道分类${item.expected}` });
    if (item.rank != null) {
      addReportEvent(ns, run, "1998-yayoi", item.rank, { retired: item.retired });
    }
    const evaluation = ns.EraRules.evaluatePreRaceReport(run, "1998-satsuki");
    assert.equal(evaluation.form, item.expected);
    assert.equal(evaluation.textId, `jp.golden-road.main.1998.report.satsuki.${item.expected}`);
  });

  const latestRun = ns.EraRules.createRun({ horseName: "最近一战判定马" });
  const yayoi = ns.EraRules.occurrenceFor(latestRun, "1998-yayoi");
  const firstIndex = ns.EraRules.occurrenceSchedule(yayoi).index;
  addReportEvent(ns, latestRun, "1998-yayoi", 1, { raceName: "较早胜利", index: firstIndex - 1, dedupeKey: "report:older" });
  addReportEvent(ns, latestRun, "1998-yayoi", 5, { raceName: "最近谨慎一战", index: firstIndex, dedupeKey: "report:latest" });
  const latest = ns.EraRules.evaluatePreRaceReport(latestRun, "1998-satsuki");
  assert.equal(latest.form, "mixed");
  assert.equal(latest.lastRaceName, "最近谨慎一战");
});

test("dynamic report snapshots are generated once and never back-written", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "动态报道马", playerReference: "编辑测试员" });
  addReportEvent(ns, run, "1998-yayoi", 1, { raceName: "弥生赏快胜" });
  const satsuki = ns.EraRules.occurrenceFor(run, "1998-satsuki");
  const reportIndex = ns.EraRules.occurrenceSchedule(satsuki).index - 1;
  run.career.currentTime = { ...ns.TimeRules.fromIndex(reportIndex), index: reportIndex };
  ns.EraRules.syncNarrative(run, { includeIdle: false });
  ns.EraRules.syncNarrative(run, { includeIdle: false });
  const firstSnapshot = json(run.era.narrative.reportSnapshots["1998-satsuki"]);
  assert.equal(firstSnapshot.form, "winner");
  assert.equal(firstSnapshot.lastRaceName, "弥生赏快胜");
  assert.equal(firstSnapshot.tokens.PLAYER_REFERENCE, "编辑测试员");
  assert.equal(firstSnapshot.injuryStatus, "无伤病休养");
  const allScenes = () => run.era.narrative.pendingScenes.concat(run.era.narrative.timeline);
  assert.equal(allScenes().filter((scene) => scene.id === "dynamic-report:1998-satsuki").length, 1);

  addReportEvent(ns, run, "1998-yayoi", 6, { raceName: "后来追加的失利", index: reportIndex, dedupeKey: "report:after-snapshot" });
  ns.EraRules.syncNarrative(run, { includeIdle: false });
  assert.deepEqual(json(run.era.narrative.reportSnapshots["1998-satsuki"]), firstSnapshot);
  assert.equal(allScenes().filter((scene) => scene.id === "dynamic-report:1998-satsuki").length, 1);
});

test("current injury overrides form and is captured in the report snapshot", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "伤病报道马" });
  run.career.races.push(reportRace(ns, "1998-yayoi", 1, { run }));
  const satsuki = ns.EraRules.occurrenceFor(run, "1998-satsuki");
  const reportIndex = ns.EraRules.occurrenceSchedule(satsuki).index - 1;
  run.career.injury.active = {
    reason: "脚部不安",
    publicLabel: "脚部不安（小伤休养1个月）",
    startIndex: reportIndex - 1,
    restUntilIndex: reportIndex + 1
  };
  const evaluation = ns.EraRules.evaluatePreRaceReport(run, "1998-satsuki");
  assert.equal(evaluation.form, "health-question");
  assert.equal(evaluation.restingAtReport, true);
  assert.equal(evaluation.injuryStatus, "脚部不安（小伤休养1个月）");
});

test("forced rest interrupts automatic narrative advancement with a stable time scene", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "休养推进马" });
  const currentIndex = run.career.currentTime.index;
  run.era.narrative.pendingScenes = [];
  run.era.narrative.resolvedSceneIds = ["node:1998-01-stable-opening", "node:1998-01-player-declaration"];
  run.career.injury.active = {
    reason: "脚部不安",
    publicLabel: "脚部不安（小伤休养1个月）",
    startIndex: currentIndex,
    restUntilIndex: currentIndex + 2,
    restUntilLabel: "三岁2月上旬"
  };
  ns.EraRules.syncNarrative(run);
  let scene = ns.EraRules.getCurrentScene(run);
  assert.equal(scene.sourceKind, "forced-rest");
  assert.equal(ns.EraRules.getSceneChoices(run, scene)[0].label, "继续休养");
  ns.EraRules.resolveSceneChoice(run, scene.id, "advance");
  assert.equal(run.career.currentTime.index, currentIndex + 1);
  scene = ns.EraRules.getCurrentScene(run);
  if (scene.sourceKind !== "forced-rest") {
    assert.equal(scene.createdAtIndex, currentIndex + 1);
    ns.EraRules.resolveSceneChoice(run, scene.id, "continue");
    scene = ns.EraRules.getCurrentScene(run);
  }
  assert.equal(scene.sourceKind, "forced-rest");
  assert.equal(run.career.scheduledRace, null);
});

test("each key race handles win, close loss, loss and rival divergence", () => {
  const occurrenceIds = ["1998-satsuki", "1998-derby", "1998-kikka"];
  const cases = [
    { finish: 1, winner: "player", classification: "win", divergence: "player-divergence" },
    { finish: 2, winner: 0, classification: "close", divergence: "historical-continuation" },
    { finish: 5, winner: 1, classification: "loss", divergence: "rival-divergence" }
  ];
  occurrenceIds.forEach((occurrenceId) => {
    cases.forEach((item, index) => {
      const { ns } = setup();
      const run = ns.EraRules.createRun({ horseName: `${occurrenceId}-分支马${index}` });
      const occurrence = ns.EraRules.occurrenceFor(run, occurrenceId);
      const payload = ns.EraRules.buildRacePayload(run, occurrence.id);
      const result = fakeResult(occurrence, item.finish, item.winner, false);
      run.career.currentTime = payload.schedule;
      const originalSimulate = ns.RaceRules.simulateRace;
      const originalAdvance = ns.CareerRules.advanceToSchedule;
      const originalAdd = ns.CareerRules.addRace;
      ns.RaceRules.simulateRace = () => result;
      ns.CareerRules.advanceToSchedule = () => {};
      ns.CareerRules.addRace = () => {};
      run.career.scheduledRace = payload;
      const record = ns.EraRules.completeRace(run, payload).keyRecord;
      ns.RaceRules.simulateRace = originalSimulate;
      ns.CareerRules.advanceToSchedule = originalAdvance;
      ns.CareerRules.addRace = originalAdd;
      assert.equal(record.classification, item.classification);
      assert.equal(record.divergenceKind, item.divergence);
      assert.equal(run.era.tripleCrownPossible, item.classification === "win");
      assert.equal(run.era.news.length, 1);
      assert.equal(run.era.chronicle.length, 1);
      assert.equal(ns.EraRules.getNewspaperItems(run).length, 1);
      const scenes = run.era.narrative.pendingScenes.concat(run.era.narrative.timeline);
      assert.ok(!scenes.some((scene) => scene.sourceKind === "news" || scene.id.startsWith("news:")));
      assert.equal(ns.EraRules.readNews(run, run.era.news[0].id), true);
      assert.equal(ns.EraRules.getNewspaperItems(run)[0].read, true);
      assert.equal(run.era.keyRaceResults[occurrenceId].actualWinnerId, record.actualWinnerId);
    });
  });
});

test("crossing each key date settles absence once and preserves its historical winner", () => {
  ["1998-satsuki", "1998-derby", "1998-kikka"].forEach((occurrenceId) => {
    const { ns } = setup();
    const run = ns.EraRules.createRun({ horseName: `${occurrenceId}-缺席测试马` });
    const scenario = ns.EraRules.scenarioFor(run);
    const occurrence = ns.EraRules.occurrenceFor(run, occurrenceId);
    const targetIndex = ns.EraRules.occurrenceSchedule(occurrence).index;
    scenario.occurrences
      .filter((item) => item.keyRace && ns.EraRules.occurrenceSchedule(item).index < targetIndex)
      .forEach((item) => {
        run.era.keyRaceResults[item.id] = { occurrenceId: item.id, classification: "absent" };
        run.era.completedOccurrences.push(item.id);
      });
    run.career.currentTime = {
      age: occurrence.age,
      month: occurrence.month,
      half: occurrence.half,
      index: targetIndex
    };
    ns.EraRules.advanceTurn(run);
    ns.EraRules.advanceTurn(run);
    const record = run.era.keyRaceResults[occurrence.id];
    assert.equal(record.classification, "absent");
    assert.equal(record.actualWinnerId, occurrence.historicalWinnerId);
    assert.equal(run.era.missedKeyRaces.filter((id) => id === occurrence.id).length, 1);
    assert.equal(run.era.news.filter((item) => item.occurrenceId === occurrence.id).length, 1);
    assert.equal(run.era.chronicle.filter((item) => item.occurrenceId === occurrence.id).length, 1);
  });
});

test("preparation races use the simulator without creating main-story branches", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "备战测试马" });
  const occurrence = ns.EraRules.occurrenceFor(run, "1998-yayoi");
  const payload = ns.EraRules.buildRacePayload(run, occurrence.id);
  assert.equal(payload.opponents.length, 0);
  assert.equal(payload.opponent.historicalScore, undefined);
  const pendingBefore = run.era.pendingStories.length;
  const result = fakeResult(occurrence, 2, 0, false);
  const originalSimulate = ns.RaceRules.simulateRace;
  const originalAdvance = ns.CareerRules.advanceToSchedule;
  const originalAdd = ns.CareerRules.addRace;
  ns.RaceRules.simulateRace = () => result;
  ns.CareerRules.advanceToSchedule = () => {};
  ns.CareerRules.addRace = () => {};
  ns.EraRules.completeRace(run, payload);
  ns.RaceRules.simulateRace = originalSimulate;
  ns.CareerRules.advanceToSchedule = originalAdvance;
  ns.CareerRules.addRace = originalAdd;
  assert.ok(run.era.completedOccurrences.includes(occurrence.id));
  assert.equal(Object.keys(run.era.keyRaceResults).length, 0);
  assert.equal(run.era.pendingStories.length, pendingBefore);
  assert.equal(run.era.news.length, 0);
  assert.equal(run.era.chronicle.length, 0);
});

test("all temporary endings are selected with stable precedence", () => {
  const endingCases = [
    { wins: 3, missed: [], explicit: "", expected: "triple" },
    { wins: 2, missed: [], explicit: "", expected: "partial" },
    { wins: 0, missed: [], explicit: "", expected: "none" },
    { wins: 2, missed: ["1998-kikka"], explicit: "", expected: "absent" },
    { wins: 0, missed: [], explicit: "injury", expected: "injury" },
    { wins: 0, missed: [], explicit: "retired", expected: "retired" }
  ];
  endingCases.forEach((item, index) => {
    const { ns } = setup();
    const run = ns.EraRules.createRun({ horseName: `结局马${index}` });
    run.era.classicWins = item.wins;
    run.era.missedKeyRaces = item.missed.slice();
    ns.EraRules.finalizeStage(run, item.explicit);
    assert.equal(run.era.endingId, "");
    assert.equal(run.era.stageState.pendingEndingId, item.expected);
    assert.equal(run.era.stageState.summaryVisible, false);
    assert.ok(run.era.endingTextId);
    ns.EraRules.syncNarrative(run);
    assert.ok(run.era.narrative.pendingScenes.some((scene) => scene.type === "ending"));
    const endingScene = ns.EraRules.getCurrentScene(run);
    ns.EraRules.resolveSceneChoice(run, endingScene.id, "continue");
    assert.equal(run.era.endingId, item.expected);
    assert.equal(run.era.stageState.summaryVisible, true);
  });
});

test("narrative choices and schedule drawer expose the same currently legal races", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "赛程选择马" });
  let scene = ns.EraRules.getCurrentScene(run);
  for (let guard = 0; guard < 14 && scene && scene.type !== "race-decision"; guard += 1) {
    const choice = ns.EraRules.getSceneChoices(run, scene)[0];
    assert.ok(choice);
    ns.EraRules.resolveSceneChoice(run, scene.id, choice.id);
    scene = ns.EraRules.getCurrentScene(run);
  }
  assert.equal(scene.type, "race-decision");
  assert.equal(scene.nodeId, "1997-08-debut-route");
  const enabledIds = ns.EraRules.getScheduleOptions(run, scene)
    .filter((option) => option.enabled)
    .map((option) => option.occurrence.id);
  const choiceIds = ns.EraRules.getSceneChoices(run, scene)
    .filter((choice) => choice.action === "schedule")
    .map((choice) => choice.occurrenceId);
  assert.deepEqual(json(enabledIds), ["1997-early-debut", "1997-early-debut-hanshin", "1997-early-debut-sapporo"]);
  assert.deepEqual(json(choiceIds), []);
  assert.ok(ns.EraRules.getSceneChoices(run, scene).some((choice) => choice.action === "open-schedule" && choice.label === "选择本旬赛事"));
  assert.equal(ns.EraRules.getScheduleOptions(run, scene).find((option) => option.occurrence.id === "1998-aoba").status, "locked");

  const stale = ns.EraRules.resolveSceneChoice(run, "wrong-scene", "schedule:1997-early-debut");
  assert.equal(stale.type, "ignored");
  const selected = ns.EraRules.resolveSceneChoice(run, scene.id, "schedule:1997-early-debut");
  assert.equal(selected.type, "schedule");
  assert.equal(run.career.scheduledRace.eraOccurrenceId, "1997-early-debut");
});

test("era save normalization restores narrative snapshots without touching other save concepts", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "存档{{RACE_NAME}}马", playerReference: "档案员" });
  run.era.news.push({
    id: "news-snapshot",
    textId: "jp.golden-road.main.1998.news.win",
    tokens: { PLAYER_HORSE_NAME: run.career.horse.name, RACE_NAME: "皋月赏" },
    read: true
  });
  run.era.chronicle.push({
    id: "chronicle-snapshot",
    occurrenceId: "1998-satsuki",
    actualWinnerId: "special-week",
    textId: "jp.golden-road.main.1998.chronicle.close",
    tokens: { PLAYER_HORSE_NAME: run.career.horse.name, ACTUAL_WINNER_NAME: "特别周" }
  });
  run.era.keyRaceResults["1998-satsuki"] = {
    occurrenceId: "1998-satsuki",
    actualWinnerId: "special-week",
    playerFinish: 2,
    tokens: { PLAYER_HORSE_NAME: run.career.horse.name }
  };
  const pendingSceneId = ns.EraRules.getCurrentScene(run).id;
  const restored = ns.EraRules.normalizeSave(json(run));
  assert.equal(restored.career.gameMode, "era");
  assert.equal(restored.version, 5);
  assert.equal(restored.era.playerReference, "档案员");
  assert.equal(restored.era.news[0].read, true);
  assert.equal(ns.EraRules.getNewspaperItems(restored)[0].id, "news-snapshot");
  assert.equal(restored.era.news[0].tokens.PLAYER_HORSE_NAME, "存档{{RACE_NAME}}马");
  assert.equal(restored.era.chronicle[0].actualWinnerId, "special-week");
  assert.equal(restored.era.keyRaceResults["1998-satsuki"].actualWinnerId, "special-week");
  assert.ok(restored.era.narrative.pendingScenes.some((scene) => scene.id === pendingSceneId));
  const sceneIds = restored.era.narrative.pendingScenes.concat(restored.era.narrative.timeline).map((scene) => scene.id);
  assert.equal(sceneIds.length, new Set(sceneIds).size);
  assert.throws(() => ns.EraRules.normalizeSave({ version: 99 }), /Unsupported era save version/);
});

test("version-two saves skip the new encounter and detach legacy news scenes", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "二版旧档马" });
  run.version = 2;
  delete run.era.entryCandidateId;
  delete run.era.onboarding;
  run.era.news.push({
    id: "legacy-v2-news",
    textId: "jp.golden-road.main.1998.news.win",
    time: "1998-04-19",
    tokens: { PLAYER_HORSE_NAME: "二版旧档马", RACE_NAME: "皋月赏" },
    read: false
  });
  run.era.narrative.pendingScenes.push({
    id: "news:legacy-v2-news",
    type: "news",
    sourceKind: "news",
    sourceId: "legacy-v2-news",
    textId: "jp.golden-road.main.1998.news.win",
    tokens: {},
    createdAtIndex: run.career.currentTime.index
  });
  run.era.narrative.resolvedSceneIds.push("news:old-resolved");
  const restored = ns.EraRules.normalizeSave(json(run));
  assert.equal(restored.version, 5);
  assert.equal(restored.era.onboarding.phase, "complete");
  assert.equal(restored.era.onboarding.namingComplete, true);
  const scenes = restored.era.narrative.pendingScenes.concat(restored.era.narrative.timeline);
  assert.ok(!scenes.some((scene) => scene.sourceKind === "news" || scene.id.startsWith("news:")));
  assert.ok(!restored.era.narrative.resolvedSceneIds.some((id) => id.startsWith("news:")));
  assert.equal(ns.EraRules.getNewspaperItems(restored)[0].id, "legacy-v2-news");
});

test("version-one saves gain a safe player reference and rebuild a mixed narrative timeline", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ horseName: "旧档案马" });
  run.version = 1;
  delete run.era.playerReference;
  delete run.era.narrative;
  run.career.comments = [];
  run.career.commentDetails = [];
  const satsuki = ns.EraRules.occurrenceFor(run, "1998-satsuki");
  const satsukiIndex = ns.EraRules.occurrenceSchedule(satsuki).index;
  run.career.currentTime = { ...ns.TimeRules.fromIndex(satsukiIndex + 1), index: satsukiIndex + 1 };
  run.career.races.push(reportRace(ns, "1998-yayoi", 2, { run }));
  run.era.news.push({
    id: "legacy-unread",
    textId: "jp.golden-road.main.1998.news.close",
    occurrenceId: "1998-satsuki",
    time: "1998-04-19",
    tokens: ns.EraRules.baseTokens(run, satsuki),
    read: false
  });
  run.era.chronicle.push({
    id: "legacy-chronicle",
    textId: "jp.golden-road.main.1998.chronicle.close",
    occurrenceId: "1998-satsuki",
    time: "1998-04-19",
    historicalStatus: "历史分歧",
    tokens: ns.EraRules.baseTokens(run, satsuki)
  });

  const restored = ns.EraRules.normalizeSave(json(run));
  assert.equal(restored.version, 5);
  assert.equal(restored.era.playerReference, "马主");
  assert.equal(restored.era.onboarding.phase, "complete");
  assert.equal(restored.career.commentDetails.length, 5);
  assert.ok(restored.career.commentDetails.every((comment) => comment.accuracy === "close"));
  assert.equal(restored.era.news[0].read, false);
  assert.ok(!restored.era.narrative.pendingScenes.some((scene) => scene.id === "news:legacy-unread"));
  assert.ok(!restored.era.narrative.timeline.some((scene) => scene.id === "news:legacy-unread"));
  assert.equal(ns.EraRules.getNewspaperItems(restored)[0].id, "legacy-unread");
  assert.ok(restored.era.narrative.timeline.some((scene) => scene.id === "chronicle:legacy-chronicle"));
  assert.ok(restored.era.narrative.timeline.some((scene) => scene.type === "race-result"));
  const before = restored.era.narrative.pendingScenes.length + restored.era.narrative.timeline.length;
  ns.EraRules.syncNarrative(restored);
  const combined = restored.era.narrative.pendingScenes.concat(restored.era.narrative.timeline);
  assert.equal(combined.length, before);
  assert.equal(combined.length, new Set(combined.map((scene) => scene.id)).size);
});

test("era UI uses an owner viewpoint with encounter, newspaper and mobile drawers", () => {
  const render = fs.readFileSync(path.join(projectRoot, "js/ui/render.js"), "utf8");
  const eraUi = fs.readFileSync(path.join(projectRoot, "js/ui/era-render.js"), "utf8");
  const app = fs.readFileSync(path.join(projectRoot, "js/app.js"), "utf8");
  const styles = fs.readFileSync(path.join(projectRoot, "css/era.css"), "utf8");
  assert.match(render, /id="homeEraBtn"[^>]*>进入剧情模式/);
  assert.match(render, /id="eraOverlay"/);
  assert.match(app, /keiba-era-save-v1/);
  assert.match(app, /state\.activeScreen = "era"/);
  assert.match(app, /playerReference/);
  assert.match(app, /resolveSceneChoice/);
  assert.match(app, /createEntrySetup/);
  assert.match(app, /selectEntryCandidate/);
  assert.match(app, /previewSceneChoice/);
  assert.match(app, /completeEncounterNaming/);
  assert.match(eraUi, /id="eraPlayerReferenceInput"/);
  assert.doesNotMatch(eraUi, /id="eraHorseNameInput"/);
  assert.match(eraUi, /data-era-select-candidate/);
  assert.match(eraUi, /data-era-transient-choice/);
  assert.match(eraUi, /id="eraEncounterHorseName"/);
  assert.match(eraUi, /data-era-current-scene/);
  assert.match(eraUi, /data-era-timeline/);
  assert.match(eraUi, /data-era-schedule-drawer/);
  assert.match(eraUi, /data-era-newspaper-drawer/);
  assert.match(eraUi, /scenario\.seasonTitle/);
  assert.doesNotMatch(eraUi, /1998竞马编辑部/);
  assert.match(eraUi, /佐藤悠太的五项评估/);
  assert.match(eraUi, /comment\.accuracyLabel/);
  assert.match(eraUi, /outlineBody\(preview\)/);
  assert.match(eraUi, /outlineBody\(response\)/);
  assert.match(eraUi, /run\.era\.onboarding\.step >= 2/);
  assert.doesNotMatch(eraUi, /horse\.strength/);
  assert.doesNotMatch(eraUi, /id="eraRaceSelect"/);
  assert.doesNotMatch(eraUi, /data-era-panel=/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /\.era-schedule-drawer/);
  assert.match(styles, /\.era-newspaper-drawer/);
  assert.match(styles, /top: auto/);
  assert.match(styles, /\.era-editorial-grid/);
  assert.match(eraUi, /当前可报/);
  assert.match(eraUi, /未来赛历/);
  assert.match(eraUi, /已完成/);
  assert.match(eraUi, /era-registration-preview/);
  assert.match(styles, /\.era-schedule-section/);
  assert.match(styles, /\.era-registration-preview/);
});
