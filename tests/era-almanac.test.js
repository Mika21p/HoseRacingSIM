const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const { loadEraRules, projectRoot } = require("./helpers/project-loader");

const ALMANAC_FILES = [
  "js/data/era/almanac/registry.js",
  "js/data/era/almanac/horses/1998.js",
  "js/data/era/almanac/races/1998.js"
];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function setup() {
  const project = loadEraRules();
  return { ns: project.rules, almanac: project.rules.EraAlmanac };
}

function winnerOf(almanac, raceId) {
  const race = almanac.race(raceId);
  assert.ok(race, `missing race ${raceId}`);
  return { race, result: race.results[0], horse: almanac.horse(race.results[0].horseId) };
}

test("1998 almanac loads without validation warnings", () => {
  const { almanac } = setup();
  assert.deepEqual(plain(almanac.validate()), []);
  assert.deepEqual(plain(almanac.years()), [1998, 1999]);
});

test("1998 almanac covers the graded batch and verified ungraded exception with the two-tier rule", () => {
  const { almanac } = setup();
  const races = almanac.racesOf(1998);
  const count = (grade) => races.filter((race) => race.grade === grade).length;
  assert.equal(races.length, 117);
  assert.deepEqual([count("G1"), count("G2"), count("G3")], [20, 33, 63]);
  races.forEach((race) => {
    assert.match(race.source, /^https:\/\/www\.jbis\.or\.jp\/race\/result\/1998\d{4}\/1\d\d\/\d{2}\/$/);
    assert.ok(race.date.startsWith("1998-"));
    if (race.grade === "G1") assert.equal(race.tier, "top5", race.id);
    const finishes = plain(race.results.map((result) => result.finish));
    if (race.tier === "top5") {
      assert.ok(finishes.length >= 5, race.id);
      finishes.forEach((finish, index) => assert.equal(finish, index > 0 && finish === finishes[index - 1] ? finishes[index - 1] : index + 1, race.id));
    }
    else assert.equal(finishes[0], 1, race.id);
    assert.ok(race.results.every((result) => result.time), race.id);
  });
});

test("1998 classics match the JRA official results", () => {
  const { almanac } = setup();
  const expected = {
    "1998-satsuki-sho": ["seiun-sky", "横山 典弘", "2:01.3"],
    "1998-tokyo-yushun": ["special-week", "武 豊", "2:25.8"],
    "1998-kikka-sho": ["seiun-sky", "横山 典弘", "3:03.2"]
  };
  Object.entries(expected).forEach(([raceId, [horseId, jockey, time]]) => {
    const { result } = winnerOf(almanac, raceId);
    assert.equal(result.horseId, horseId, raceId);
    assert.equal(result.jockey, jockey, raceId);
    assert.equal(result.time, time, raceId);
  });
  assert.equal(almanac.race("1998-kikka-sho").results[0].record, true);
  const derby = almanac.race("1998-tokyo-yushun");
  assert.equal(derby.going, "稍重");
  assert.equal(derby.headcount, 18);
});

test("almanac horses reuse global ids and confirmed Chinese names", () => {
  const { ns, almanac } = setup();
  const horses = new Set(almanac.racesOf(1998).flatMap((race) => race.results.map((result) => result.horseId)));
  horses.forEach((horseId) => {
    const horse = almanac.horse(horseId);
    if (!horse.historicalHorseId) {
      assert.match(horse.id, /^jbis-\d{10}$/);
      return;
    }
    const global = ns.HistoricalHorses.find((item) => item.id === horse.historicalHorseId);
    assert.equal(horse.id, global.id);
    assert.equal(horse.nameZh, global.displayNameZh || global.displayName);
  });
  assert.equal(winnerOf(almanac, "1998-japan-cup").horse.id, "el-condor-pasa");
  assert.equal(winnerOf(almanac, "1998-arima-kinen").horse.id, "grass-wonder");
});

test("all 1998 non-global horses have reviewed or default-approved names", () => {
  const { almanac } = setup();
  const horses = new Map(almanac.racesOf(1998).flatMap((race) => race.results.map((result) => {
    const horse = almanac.horse(result.horseId);
    return [horse.id, horse];
  })));
  const localHorses = [...horses.values()].filter((horse) => !horse.historicalHorseId);
  assert.equal(localHorses.length, 165);
  assert.equal(localHorses.filter((horse) => horse.nameZhStatus === "final").length, 107);
  assert.equal(localHorses.filter((horse) => horse.nameZhStatus === "default-approved").length, 58);
  assert.ok(localHorses.every((horse) => horse.nameZh && ["final", "default-approved"].includes(horse.nameZhStatus)));
  assert.equal(almanac.horse("jbis-0000295505").nameZh, "蝴蝶兰");
  assert.equal(almanac.horse("jbis-0000295505").nameZhStatus, "final");
  const approvedNames = require("../scripts/era-almanac-config").horseNamesByJbisId;
  for (const horse of localHorses) {
    const approved = approvedNames[horse.jbisHorseId];
    assert.ok(approved, horse.id);
    assert.equal(horse.nameZh, approved.nameZh, horse.id);
    assert.equal(horse.nameZhStatus, approved.status, horse.id);
  }
  const userCorrections = {
    "0000287603": "采珠",
    "0000309040": "刺针",
    "0000283279": "大星期日",
    "0000266754": "石野周日",
    "0000297556": "娜奥美光",
    "0000272801": "竹正暴风"
  };
  for (const [id, name] of Object.entries(userCorrections)) {
    assert.equal(almanac.horse(`jbis-${id}`).nameZh, name);
  }
});

test("almanac validation rejects missing names and unapproved statuses", () => {
  const { almanac } = setup();
  const horse = almanac.horse("jbis-0000295505");
  horse.nameZh = "";
  horse.nameZhStatus = "pending";
  const warnings = plain(almanac.validate());
  assert.ok(warnings.some((warning) => warning.type === "missing-horse-chinese-name" && warning.horseId === horse.id));
  assert.ok(warnings.some((warning) => warning.type === "invalid-horse-name-status" && warning.horseId === horse.id));
});

test("special week's 1998 almanac record matches his global win list", () => {
  const { ns, almanac } = setup();
  const global = ns.HistoricalHorses.find((horse) => horse.id === "special-week");
  const globalWins = global.races.filter((race) => race.year === 1998).map((race) => `1998-${race.raceId}`).sort();
  const almanacWins = almanac.horseRecord("special-week").filter((entry) => entry.finish === 1 && entry.date.startsWith("1998")).map((entry) => entry.raceId).sort();
  assert.deepEqual(plain(almanacWins), plain(globalWins));
});

test("three added trials preserve the ungraded dirt exception and dead heat", () => {
  const { almanac } = setup();
  const kyodo = almanac.race("1998-tokinominoru-kinen");
  assert.equal(kyodo.grade, "重");
  assert.equal(kyodo.surface, "泥地");
  assert.equal(kyodo.distance, 1600);
  assert.equal(kyodo.going, "不良");
  assert.equal(kyodo.headcount, 9);
  assert.equal(kyodo.results[0].horseId, "el-condor-pasa");
  assert.equal(kyodo.results[1].horseId, "jbis-0000299293");
  const mainichi = almanac.race("1998-mainichi-hai");
  assert.deepEqual(plain(mainichi.results.map((r) => r.finish)), [1, 2, 3, 3, 5]);
  assert.deepEqual(plain(mainichi.results.filter((r) => r.deadHeat).map((r) => r.horseId)), ["jbis-0000292669", "jbis-0000291417"]);
  assert.equal(mainichi.results[3].margin, "同着");
  assert.equal(almanac.race("1998-tokyo-sports-hai").results.length, 5);
});

test("dead heat validation rejects skipped ranks, false ties and missing markers", () => {
  for (const mutation of [
    (r) => { r.results[2].finish = 4; },
    (r) => { r.results[2].deadHeat = false; },
    (r) => { r.results[3].margin = "クビ"; },
    (r) => { r.results.pop(); }
  ]) {
    const { almanac } = setup();
    mutation(almanac.race("1998-mainichi-hai"));
    assert.ok(almanac.validate().length > 0);
  }
});

test("parser self-check handles tied ranks without inventing a fourth place", () => {
  const { selfCheck } = require("../scripts/era-almanac-build");
  const make = () => ({ distance: 2000, surface: "草地", runners: [1, 2, 3, 3, 5].map((finish, i) => ({
    finish, name: `horse-${i}`, jbisHorseId: `${i}`, timeSeconds: 120 + Math.floor(i / 2), margin: i === 3 ? "同着" : "", status: ""
  })) });
  assert.deepEqual(selfCheck(make()), []);
  const invalid = make(); invalid.runners[3].margin = "クビ";
  assert.ok(selfCheck(invalid).length > 0);
});

test("starter counts use raw evidence and keep non-finishers that started", () => {
  const { countStarters } = require("../scripts/era-almanac-build");
  const row = (finishRaw, marginRaw = "") => ({ finishRaw, marginRaw, name: "证据马", jbisHorseId: "1", number: 1 });
  for (const mark of ["中止", "失格", "降着"]) assert.equal(countStarters([row("1"), row("**", mark)]).starterCount, 2);
  for (const mark of ["取消", "除外"]) assert.equal(countStarters([row("1"), row("**", mark)]).starterCount, 1);
  assert.equal(countStarters([row("1"), row("1", "同着")]).starterCount, 2);
  for (const rows of [[], [row("**")], [row("1", "取消")], [row("0")], [row("1", "不明")], [{ ...row("1"), name: "" }]]) {
    const result = countStarters(rows);
    assert.equal(result.starterCount, null);
    assert.ok(result.starterCountIssues.length);
  }
});

test("historical field counts distinguish legacy, unknown and invalid data", () => {
  const n = loadEraRules().rules, a = n.EraAlmanac, e = a.race("1999-satsuki-sho");
  assert.equal(a.historicalHeadcount(e).count, 17);
  assert.equal(a.historicalHeadcount({ headcount: 18 }).source, "legacy");
  assert.equal(a.historicalHeadcount({ headcount: 18 }).count, 18);
  assert.equal(a.historicalHeadcount({ headcount: 18, starterCount: null }).count, null);
  for (const count of [0, -1, 18.5, 19, 1]) {
    e.starterCount = count;
    assert.ok(a.validate().some(w => w.type === "invalid-starter-count"));
  }
  e.starterCount = null;
  assert.ok(!a.validate().some(w => w.type === "invalid-starter-count"));
});
