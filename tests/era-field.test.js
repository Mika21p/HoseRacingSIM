'use strict';

const test = require("node:test");
const assert = require("node:assert/strict");

const { loadEraRules } = require("./helpers/project-loader");

let cached = null;

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function setup() {
  if (cached) return cached;
  const project = loadEraRules();
  const ns = project.rules;
  const base = ns.Races.find((race) => race.id === "pegasus-world-cup-turf");
  cached = {
    ns,
    project,
    base,
    race: { ...base, nameZh: "1998年飞马世界杯草地赛" },
    horse: {
      id: "player-horse",
      name: "主角马",
      strength: 80,
      surfaceGrades: { grass: "A", dirt: "A" },
      trackAptitudes: { burst: "◎", sustained: "○", attrition: "○" },
      distMin: 1000,
      coreDist: 2000,
      distMax: 2400,
      peakStart: "二岁春",
      peakEnd: "四岁夏",
      heavyType: "普通",
      temperamentLabel: "沉稳"
    }
  };
  return cached;
}

function historicalOpponent(index, historicalScore, historicalFinish, overrides) {
  return {
    id: `occurrence-h${index}`,
    horseId: `history-horse-${index}`,
    name: `史实马${index}`,
    displayName: `史实马${index}`,
    displayNameZh: `史实马${index}`,
    displayNameEn: `History Horse ${index}`,
    year: 1998,
    ability: 80,
    jockeyId: `jockey-${index}`,
    jockeyName: `史实骑手${index}`,
    riderAbility: 70,
    historicalScore,
    historicalFinish,
    deadHeat: false,
    anonymous: false,
    ...(overrides || {})
  };
}

function anonymousOpponent(index, historicalScore, overrides) {
  return {
    id: `occurrence-anon-${index}`,
    horseId: `anon-horse-${index}`,
    name: `无记录对手${index}`,
    displayName: `无记录对手${index}`,
    displayNameZh: `无记录对手${index}`,
    year: 1998,
    ability: 70,
    jockeyId: `jockey-anon-${index}`,
    jockeyName: `未记录骑手${index}`,
    riderAbility: 60,
    historicalScore,
    historicalFinish: null,
    deadHeat: false,
    anonymous: true,
    ...(overrides || {})
  };
}

function runEra(context, seed, opponents, headcount) {
  const { ns, horse, race } = context;
  return plain(ns.Random.withSource(ns.Random.seeded(seed), () => ns.RaceRules.simulateEraFieldRace(
    horse,
    race,
    {
      opponents,
      headcount,
      playerJockey: { id: "jockey-player", name: "高桥隼人", ability: 70 },
      trackCondition: "良",
      maturity: { status: "成熟期", adjustedStrength: 80 },
      temperamentMod: { label: "沉稳", min: 0, max: 0, mod: 0 }
    }
  )));
}

// 玩家先于对手掷骰，实名对手是固定分，因此玩家总分只由种子和玩家能力决定。
function playerTotalFor(context, seed) {
  const probe = runEra(context, seed, [historicalOpponent(1, 60, 1)], 2);
  const total = probe.hidden.fieldResults.find((row) => row.entry.key === "player").total;
  assert.ok(Number.isFinite(total), `种子${seed}下玩家未能完赛`);
  return total;
}

function rankOrder(result) {
  return result.hidden.fieldResults.map((row) => `${row.entry.key}:${row.fieldPosition}:${row.rank}`);
}

test("7人场：玩家加6名对手全部按实际名次出场", () => {
  const context = setup();
  const opponents = [200, 195, 190, 185, 180, 175]
    .map((score, index) => historicalOpponent(index + 1, score, index + 1));
  const result = runEra(context, 7, opponents, 7);

  assert.equal(result.public.opponents.length, 6);
  assert.equal(result.hidden.fieldSize, 7);
  assert.equal(result.hidden.fieldResults.length, 7);
  assert.deepEqual(
    result.hidden.fieldResults.map((row) => row.entry.key),
    ["opponent", "field-1", "field-2", "field-3", "field-4", "field-5", "player"]
  );
  assert.deepEqual(result.hidden.fieldResults.slice(0, 6).map((row) => row.total), [200, 195, 190, 185, 180, 175]);
  assert.deepEqual(result.hidden.fieldResults.slice(0, 6).map((row) => row.rank), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(result.public.opponents.map((row) => row.rank), [1, 2, 3, 4, 5, 6]);
  assert.equal(new Set(result.hidden.fieldResults.map((row) => row.entry.key)).size, 7);
  assert.equal(result.hidden.playerFieldPosition, result.public.rank);
  assert.equal(result.public.rank, 7);
  assert.equal(result.public.rankLabel, "着外");
});

test("18人场：玩家加17名对手全部按实际名次出场", () => {
  const context = setup();
  const opponents = Array.from({ length: 17 }, (_, index) => historicalOpponent(index + 1, 200 - index, index + 1));
  const result = runEra(context, 9, opponents, 18);

  assert.equal(result.public.opponents.length, 17);
  assert.equal(result.hidden.fieldSize, 18);
  assert.equal(result.hidden.fieldResults.length, 18);
  assert.deepEqual(result.hidden.fieldResults.map((row) => row.entry.key), [
    "opponent",
    ...Array.from({ length: 16 }, (_, index) => `field-${index + 1}`),
    "player"
  ]);
  assert.deepEqual(
    result.hidden.fieldResults.slice(0, 17).map((row) => row.rank),
    Array.from({ length: 17 }, (_, index) => index + 1)
  );
  assert.equal(result.public.rank, 18);
  assert.equal(result.public.rankLabel, "着外");
  assert.equal(result.hidden.playerFieldPosition, 18);
});

test("参赛人数校验：人数不符、越界、重复ID、玩家冲突与无效分数全部报错", () => {
  const context = setup();
  const field = (count) => Array.from({ length: count }, (_, index) => historicalOpponent(index + 1, 90 - index, index + 1));
  const attempt = (opponents, headcount) => () => runEra(context, 5, opponents, headcount);

  assert.throws(attempt(field(6), 8), /参赛人数为8时需要7名对手/);
  assert.throws(attempt(field(7), 7), /参赛人数为7时需要6名对手/);
  assert.throws(attempt([], 1), /参赛人数必须是2到32之间的整数/);
  assert.throws(attempt(field(31), 33), /参赛人数必须是2到32之间的整数/);
  assert.throws(attempt(field(2), 2.5), /参赛人数必须是2到32之间的整数/);

  const duplicated = field(5);
  duplicated[3] = historicalOpponent(1, 70, 4);
  assert.throws(attempt(duplicated, 6), /对手马匹ID重复/);

  const conflicting = field(5);
  conflicting[2] = historicalOpponent(1, 70, 3, { horseId: context.horse.id });
  assert.throws(attempt(conflicting, 6), /与玩家马匹ID冲突/);

  const invalid = field(5);
  invalid[1] = historicalOpponent(2, NaN, 2);
  assert.throws(attempt(invalid, 6), /历史分数无效/);

  const missingId = field(5);
  missingId[0] = historicalOpponent(1, 70, 1, { horseId: "", id: "" });
  assert.throws(attempt(missingId, 6), /对手缺少马匹ID/);

  const maxField = Array.from({ length: 31 }, (_, index) => historicalOpponent(index + 1, 200 - index, index + 1));
  assert.equal(runEra(context, 3, maxField, 32).hidden.fieldSize, 32);
});

test("竞争名次为1/2/2/4/5，玩家插入后整体平移", () => {
  const context = setup();
  const total = playerTotalFor(context, 11);

  const behind = runEra(context, 11, [
    historicalOpponent(1, total + 12, 1),
    historicalOpponent(2, total + 7, 2),
    historicalOpponent(3, total + 7, 2),
    historicalOpponent(4, total + 2, 4),
    historicalOpponent(5, total - 3, 5)
  ], 6);
  assert.deepEqual(rankOrder(behind), [
    "opponent:1:1", "field-1:2:2", "field-2:3:2", "field-3:4:4", "player:5:5", "field-4:6:6"
  ]);
  assert.deepEqual(behind.public.opponents.map((row) => row.rank), [1, 2, 2, 4, 6]);
  assert.deepEqual(behind.public.opponents.map((row) => row.deadHeat), [false, true, true, false, false]);
  assert.equal(behind.public.rank, 5);
  assert.equal(behind.public.rankLabel, "五着");

  const ahead = runEra(context, 11, [
    historicalOpponent(1, total - 5, 1),
    historicalOpponent(2, total - 10, 2),
    historicalOpponent(3, total - 10, 2),
    historicalOpponent(4, total - 15, 4),
    historicalOpponent(5, total - 20, 5)
  ], 6);
  assert.deepEqual(rankOrder(ahead), [
    "player:1:1", "opponent:2:2", "field-1:3:3", "field-2:4:3", "field-3:5:5", "field-4:6:6"
  ]);
  assert.deepEqual(ahead.public.opponents.map((row) => row.rank), [2, 3, 3, 5, 6]);
  assert.equal(ahead.public.rank, 1);
  assert.equal(ahead.public.rankLabel, "一着");
  assert.equal(ahead.public.deadHeat, false);
  assert.equal(ahead.hidden.marginReferenceResult.total, total);
});

test("玩家与同着组同分时整组在前，玩家不会插进同着组中间", () => {
  const context = setup();
  const total = playerTotalFor(context, 17);
  const result = runEra(context, 17, [
    historicalOpponent(1, total + 9, 1),
    historicalOpponent(2, total, 2),
    historicalOpponent(3, total, 2),
    historicalOpponent(4, total, 2),
    historicalOpponent(5, total - 6, 5)
  ], 6);

  assert.deepEqual(rankOrder(result), [
    "opponent:1:1", "field-1:2:2", "field-2:3:2", "field-3:4:2", "player:5:5", "field-4:6:6"
  ]);
  assert.equal(result.public.rank, 5);
  assert.equal(result.public.rankLabel, "五着");
  assert.equal(result.public.deadHeat, false);
  assert.equal(result.public.tieOutcome, "");
  const tiedOpponents = result.public.opponents.filter((row) => row.deadHeat);
  assert.equal(tiedOpponents.length, 3);
  assert.ok(tiedOpponents.every((row) => row.rank === 2));
});

test("匿名对手按固定估算分排在全部实名对手之后，也无法夺冠", () => {
  const context = setup();
  const total = playerTotalFor(context, 23);
  const named = [total + 12, total + 8, total - 4];
  const result = runEra(context, 23, [
    historicalOpponent(1, named[0], 1),
    historicalOpponent(2, named[1], 2),
    historicalOpponent(3, named[2], 3),
    anonymousOpponent(1, 50),
    anonymousOpponent(2, 40)
  ], 6);

  const rows = result.public.opponents;
  const namedRows = rows.filter((row) => !row.anonymous);
  const anonymousRows = rows.filter((row) => row.anonymous);
  assert.deepEqual(namedRows.map((row) => row.rank), [1, 2, 4]);
  assert.deepEqual(anonymousRows.map((row) => row.rank), [5, 6]);
  assert.equal(result.public.rank, 3);
  assert.ok(anonymousRows.every((row) => row.rank > result.public.rank));
  assert.ok(anonymousRows.every((row) => row.rank !== 1));
  assert.ok(anonymousRows.every((row) => Number.isFinite(row.estimatedScore) && row.estimatedScore < Math.min(...named)));
  assert.ok(anonymousRows.every((row) => row.historicalFinish === null && row.retired === false));

  // 匿名估算分不低于实名对手时直接报错。
  assert.throws(() => runEra(context, 23, [
    historicalOpponent(1, named[0], 1),
    anonymousOpponent(1, 50, { estimatedScore: named[0] + 10 })
  ], 3), /估算分/);
});

test("同一种子重复模拟得到完全相同的结果，不同种子才改变玩家总分", () => {
  const context = setup();
  const total = playerTotalFor(context, 11);
  const build = () => [
    historicalOpponent(1, total + 12, 1),
    historicalOpponent(2, total + 6, 2),
    historicalOpponent(3, total + 6, 2),
    historicalOpponent(4, total + 1, 4),
    anonymousOpponent(1, 50)
  ];
  const first = runEra(context, 11, build(), 6);
  const second = runEra(context, 11, build(), 6);
  assert.deepEqual(rankOrder(first), rankOrder(second));
  assert.deepEqual(first.public, second.public);
  assert.deepEqual(first.hidden.fieldResults, second.hidden.fieldResults);
  assert.notEqual(playerTotalFor(context, 3), total);
});

test("玩家退赛时名次为null，但仍在全部参赛马中", () => {
  const context = setup();
  const opponents = [100, 95, 90, 85, 80].map((score, index) => historicalOpponent(index + 1, score, index + 1));
  let retired = null;
  for (let seed = 1; seed <= 60 && !retired; seed += 1) {
    const result = runEra(context, seed, opponents, 6);
    if (result.public.retired) retired = result;
  }
  assert.ok(retired, "应能找到玩家退赛的种子");
  assert.equal(retired.public.rank, null);
  assert.equal(retired.public.rankLabel, "退赛");
  assert.equal(retired.hidden.playerFieldPosition, null);
  assert.equal(retired.hidden.fieldResults.length, 6);
  assert.equal(retired.hidden.fieldResults.filter((row) => row.entry.key === "player").length, 1);
  assert.ok(retired.hidden.injury);
  assert.equal(retired.public.injury.forcedRetirement, retired.hidden.injury.forcedRetirement);
  assert.equal(retired.hidden.fieldResults.filter((row) => row.retired).length, 1);
});

test("输出结构与simulateFieldRace兼容，赛事名直接取race.nameZh且不调用RaceNameRules", () => {
  const context = setup();
  const { ns } = context;
  const original = ns.RaceNameRules;
  ns.RaceNameRules = {
    findRaceById() { throw new Error("剧情模式场地赛不应调用RaceNameRules"); },
    displayName() { throw new Error("剧情模式场地赛不应调用RaceNameRules"); }
  };
  try {
    const result = runEra(context, 29, [
      historicalOpponent(1, 100, 1),
      historicalOpponent(2, 95, 2),
      historicalOpponent(3, 90, 3)
    ], 4);
    assert.equal(result.public.raceName, "1998年飞马世界杯草地赛");
    assert.equal(result.public.raceNameZh, "1998年飞马世界杯草地赛");
    assert.equal(result.public.raceNameOriginal, context.race.nameOriginal || context.race.name);
    assert.equal(result.public.raceId, context.race.id);
    assert.equal(result.public.trackCondition, "良");
    assert.equal(result.hidden.race.id, context.race.id);
    assert.ok(result.hidden.playerCalc && Number.isFinite(result.hidden.playerCalc.ability));
    assert.equal(result.hidden.pointsPerLength, 3);
    assert.deepEqual(result.hidden.results, result.hidden.fieldResults);
    assert.deepEqual(result.hidden.legendOpponents, []);
    assert.deepEqual(result.hidden.replacementOpponent, null);
    assert.equal(result.hidden.fieldRace, true);
    assert.equal(result.hidden.eraField, true);
    assert.ok("preRaceCondition" in result.hidden && result.hidden.preRaceCondition === null);
    ["rank", "rankLabel", "retired", "injury", "opponents", "playerJockeyName", "opponentJockeyName", "opponentRank"]
      .forEach((key) => assert.ok(key in result.public, `public缺少${key}`));
    ["race", "fieldSize", "playerFieldPosition", "fieldResults", "playerCalc", "injury", "preRaceCondition", "scheduledOpponentResult"]
      .forEach((key) => assert.ok(key in result.hidden, `hidden缺少${key}`));
    assert.deepEqual(
      result.public.opponents.map((row) => row.entry || row.key),
      ["opponent", "field-1", "field-2"]
    );
    result.public.opponents.forEach((row) => {
      ["horseId", "rank", "rankLabel", "historicalFinish", "anonymous", "deadHeat", "jockeyName", "retired"]
        .forEach((key) => assert.ok(key in row, `public.opponents缺少${key}`));
    });
  } finally {
    if (original === undefined) delete ns.RaceNameRules;
    else ns.RaceNameRules = original;
  }
});

test("旧simulateRace与simulateWorldRace保持同种子确定性", () => {
  const { ns, horse, base } = setup();
  const sprint = ns.Races.find((item) => item.raceClass === "new" && item.surface === "草地")
    || ns.Races.find((item) => item.surface === "草地");
  const options = {
    playerJockey: { id: "j1", name: "高桥隼人", ability: 70 },
    trackCondition: "良",
    maturity: { status: "成熟期", adjustedStrength: 80 },
    temperamentMod: { label: "沉稳", min: 0, max: 0, mod: 0 }
  };
  const slim = (result) => plain({
    public: result.public,
    hidden: {
      pointsPerLength: result.hidden.pointsPerLength,
      scoreDiff: result.hidden.scoreDiff,
      marginLabel: result.hidden.marginLabel,
      tieOutcome: result.hidden.tieOutcome,
      scoreLine: result.hidden.scoreLine,
      playerFieldPosition: result.hidden.playerFieldPosition,
      fieldSize: result.hidden.fieldSize,
      order: result.hidden.results.map((row) => [row.entry.key, row.total, row.retired || false])
    }
  });

  const duel1 = ns.Random.withSource(ns.Random.seeded(101), () => slim(ns.RaceRules.simulateRace(horse, base, options)));
  const duel2 = ns.Random.withSource(ns.Random.seeded(202), () => slim(ns.RaceRules.simulateRace(horse, sprint, options)));
  const legend = ns.Random.withSource(ns.Random.seeded(303), () => slim(ns.RaceRules.simulateRace(horse, base, {
    ...options,
    gameMode: "legend",
    opponents: ns.RaceRules.chooseOpponentField(base)
  })));
  const runners = [1, 2, 3].map((index) => ({
    horse: { ...horse, id: `w${index}`, name: `世界马${index}` },
    maturity: { status: "成熟期", adjustedStrength: 75 + index },
    temperamentMod: { label: "沉稳", min: 0, max: 0, mod: 0 },
    jockey: { id: `jw${index}`, name: `骑手${index}`, ability: 70 }
  }));
  const world = plain(ns.Random.withSource(ns.Random.seeded(404), () => ns.RaceRules.simulateWorldRace(runners, base, { trackCondition: "良" })));

  assert.deepEqual(duel1, ns.Random.withSource(ns.Random.seeded(101), () => slim(ns.RaceRules.simulateRace(horse, base, options))));
  assert.deepEqual(duel2, ns.Random.withSource(ns.Random.seeded(202), () => slim(ns.RaceRules.simulateRace(horse, sprint, options))));
  assert.deepEqual(legend, ns.Random.withSource(ns.Random.seeded(303), () => slim(ns.RaceRules.simulateRace(horse, base, { ...options, gameMode: "legend", opponents: ns.RaceRules.chooseOpponentField(base) }))));
  assert.deepEqual(world, plain(ns.Random.withSource(ns.Random.seeded(404), () => ns.RaceRules.simulateWorldRace(runners, base, { trackCondition: "良" }))));
});

test("starter metadata does not change availability or same-seed simulated fields", () => {
  const ns = loadEraRules().rules, scenario = ns.EraRules.scenarioFor();
  const raceId = "1999-japan-cup", edition = ns.EraAlmanac.race(raceId);
  const run = ns.EraRules.createRun({ seed: 12, horseName: "合同验证" });
  ns.EraRules.resolveSceneChoice(run, "opening", "continue");
  run.date = "1999-11-01";
  const original = JSON.parse(JSON.stringify(run));
  let baseline;
  for (const count of [14, null, undefined]) {
    if (count === undefined) delete edition.starterCount; else edition.starterCount = count;
    const current = JSON.parse(JSON.stringify(original));
    const payload = ns.EraWorld.buildPayload(current, raceId, scenario);
    assert.equal(payload.headcount, 15);
    assert.equal(payload.opponents.length, 14);
    ns.EraRules.registerRace(current, raceId);
    for (let i=0;i<100 && !current.settled.includes(raceId);i++) {
      const scene = ns.EraRules.getCurrentScene(current);
      ns.EraRules.resolveSceneChoice(current, scene.id, scene.choices[0].id);
    }
    assert.equal(current.worldResults[raceId].fieldSize, 15);
    const result = JSON.stringify(current.worldResults[raceId]);
    if (baseline) assert.equal(result, baseline); else baseline = result;
  }
});
