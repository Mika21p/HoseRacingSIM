const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCoreRules } = require("./helpers/project-loader");

const { rules } = loadCoreRules();

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("gate results cover every boundary", () => {
  const cases = [
    [1, { label: "极好出", mod: 5 }],
    [2, { label: "好出", mod: 2 }],
    [3, { label: "好出", mod: 2 }],
    [4, { label: "普通出", mod: 0 }],
    [7, { label: "普通出", mod: 0 }],
    [8, { label: "迟出", mod: -2 }],
    [9, { label: "迟出", mod: -2 }],
    [10, { label: "大迟出", mod: -5 }]
  ];

  cases.forEach(([roll, expected]) => {
    assert.deepEqual(plain(rules.RaceRules.getGateResult(roll)), expected);
  });
});

test("position results respect rider-ability boundaries", () => {
  const riderAbility = 60;
  const cases = [
    [5, { label: "完美取位", mod: 5 }],
    [6, { label: "良好取位", mod: 2 }],
    [20, { label: "良好取位", mod: 2 }],
    [21, { label: "普通取位", mod: 0 }],
    [60, { label: "普通取位", mod: 0 }],
    [61, { label: "失误取位", mod: -2 }],
    [95, { label: "失误取位", mod: -2 }],
    [96, { label: "严重失误", mod: -5 }]
  ];

  cases.forEach(([roll, expected]) => {
    assert.deepEqual(plain(rules.RaceRules.getPositionResult(roll, riderAbility)), expected);
  });
});

test("points per length switch at 2000 metres", () => {
  assert.equal(rules.RaceRules.getPointsPerLength(1999), 3);
  assert.equal(rules.RaceRules.getPointsPerLength(2000), 2);
});

test("career summary counts placings, retirements, dead heats and grade wins", () => {
  const career = {
    races: [
      { public: { rank: 1 }, hidden: { race: { raceClass: "g1" } } },
      { public: { rank: 2, deadHeat: true }, hidden: { race: { raceClass: "jpn1" } } },
      { public: { rank: 2 }, hidden: { race: { raceClass: "g2" } } },
      { public: { rank: 3 }, hidden: { race: { raceClass: "g3" } } },
      { public: { rank: 1, retired: true }, hidden: { race: { raceClass: "g1" } } }
    ]
  };

  assert.deepEqual(plain(rules.CareerRules.getRecordSummary(career)), {
    starts: 5,
    wins: 2,
    firsts: 2,
    seconds: 1,
    thirds: 1,
    others: 1,
    g1Wins: 1,
    g2Wins: 0,
    g3Wins: 0,
    jpn1Wins: 1,
    jpn2Wins: 0,
    jpn3Wins: 0,
    grade1Wins: 2,
    grade2Wins: 0,
    grade3Wins: 0,
    winRate: 40
  });
});
