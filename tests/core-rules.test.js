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

function withHistoricalFixtures(horses, races, callback) {
  const originalHorses = rules.HistoricalHorses;
  const originalRaces = rules.Races;
  rules.HistoricalHorses = horses;
  rules.Races = races;
  rules.HistoricalOpponentRules.reset();
  try {
    return callback();
  } finally {
    rules.HistoricalHorses = originalHorses;
    rules.Races = originalRaces;
    rules.HistoricalOpponentRules.reset();
  }
}

function legendHorse(id, ability, win) {
  return {
    id,
    name: id,
    profile: { sex: "female", baseAbility: ability, peakAbility: ability + 2 },
    races: [],
    legendEligibilityWins: [win]
  };
}

function eligibilityWin(region, surface, distance) {
  return {
    raceName: `${region}-${surface}-${distance}`,
    year: 2020,
    surfaceRegion: region,
    surface,
    distance,
    jockeyId: "generic-local"
  };
}

test("legend eligibility accepts 200 metres and rejects 201 metres", () => {
  const race = { id: "strict-distance", name: "strict-distance", raceClass: "op", surfaceRegion: "日本", surface: "泥地", distance: 1200 };
  withHistoricalFixtures([
    legendHorse("inside", 80, eligibilityWin("日本", "泥地", 1000)),
    legendHorse("outside", 80, eligibilityWin("日本", "泥地", 999))
  ], [race], () => {
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(race).map((item) => item.horseId), ["inside"]);
  });
});

test("projected legend candidates expose the closest qualifying win year", () => {
  const race = { id: "representative-year", name: "representative-year", raceClass: "g2", surfaceRegion: "日本", surface: "草地", distance: 2000 };
  const horse = legendHorse("projected", 84, eligibilityWin("日本", "草地", 1800));
  horse.legendEligibilityWins = [
    { ...eligibilityWin("日本", "草地", 1800), year: 2018 },
    { ...eligibilityWin("澳洲", "草地", 2000), year: 2021 }
  ];
  withHistoricalFixtures([horse], [race], () => {
    const candidate = rules.RaceRules.getLegendFieldCandidates(race)[0];
    assert.equal(candidate.year, 2018);
    assert.equal(candidate.exactCurrentRace, false);
    assert.match(candidate.id, /projected$/);
  });
});

test("legend save normalization backfills scheduled and completed opponent years once", () => {
  const race = { id: "saved-representative-year", name: "saved-representative-year", raceClass: "g2", surfaceRegion: "日本", surface: "草地", distance: 2000 };
  const horse = legendHorse("saved-projected", 84, { ...eligibilityWin("日本", "草地", 1800), year: 2017 });
  const blankOpponent = () => ({ horseId: horse.id, year: null });
  const career = {
    gameMode: "legend",
    scheduledRace: {
      race,
      opponent: blankOpponent(),
      opponents: [blankOpponent(), { horseId: horse.id, year: "2016" }, { horseId: "missing-horse", year: null }],
      year: null
    },
    races: [{
      public: {
        raceId: race.id,
        mainOpponentHorseId: horse.id,
        opponentYear: "",
        opponents: [blankOpponent(), { horseId: horse.id, year: "2016" }, { horseId: "missing-horse", year: "" }]
      },
      hidden: {
        race,
        scheduledOpponent: blankOpponent(),
        opponent: blankOpponent(),
        legendOpponents: [blankOpponent()],
        fieldOpponents: [blankOpponent()]
      }
    }]
  };

  withHistoricalFixtures([horse], [race], () => {
    assert.equal(rules.RaceRules.normalizeLegendOpponentYears(career), true);
    assert.equal(career.scheduledRace.year, 2017);
    assert.equal(career.scheduledRace.opponent.year, 2017);
    assert.equal(career.scheduledRace.opponents[0].year, 2017);
    assert.equal(career.scheduledRace.opponents[1].year, "2016");
    assert.equal(career.scheduledRace.opponents[2].year, null);
    assert.equal(career.races[0].public.opponentYear, 2017);
    assert.equal(career.races[0].public.opponents[0].year, 2017);
    assert.equal(career.races[0].public.opponents[1].year, "2016");
    assert.equal(career.races[0].public.opponents[2].year, "");
    assert.equal(career.races[0].hidden.scheduledOpponent.year, 2017);
    assert.equal(career.races[0].hidden.opponent.year, 2017);
    assert.equal(career.races[0].hidden.legendOpponents[0].year, 2017);
    assert.equal(career.races[0].hidden.fieldOpponents[0].year, 2017);
    assert.equal(rules.RaceRules.normalizeLegendOpponentYears(career), false);
  });
});

test("legend year normalization leaves normal careers unchanged", () => {
  const career = { gameMode: "normal", scheduledRace: { year: null }, races: [] };
  assert.equal(rules.RaceRules.normalizeLegendOpponentYears(career), false);
  assert.equal(career.scheduledRace.year, null);
});

test("legend eligibility requires a victory on the same surface", () => {
  const target = { id: "strict-win", name: "strict-win", raceClass: "op", surfaceRegion: "日本", surface: "泥地", distance: 1800 };
  const horse = {
    id: "placed-only",
    name: "placed-only",
    profile: { sex: "female", baseAbility: 80, peakAbility: 82 },
    races: [{ raceId: target.id, year: 2020, ability: 80, jockeyId: "generic-local", finish: 2 }]
  };
  withHistoricalFixtures([horse], [target], () => {
    assert.equal(rules.RaceRules.getLegendFieldCandidates(target).length, 0);
    horse.races[0].champion = true;
    assert.equal(rules.RaceRules.getLegendFieldCandidates(target).length, 0, "champion flags without finish 1 do not grant eligibility");
    horse.legendEligibilityWins = [eligibilityWin("日本", "草地", 1800)];
    assert.equal(rules.RaceRules.getLegendFieldCandidates(target).length, 0);
    horse.legendEligibilityWins = [eligibilityWin("日本", "泥地", 1800)];
    const candidate = rules.RaceRules.getLegendFieldCandidates(target)[0];
    assert.equal(candidate.horseId, "placed-only");
    assert.equal(candidate.year, 2020, "qualified horses may use a non-winning current-race version");
  });
});

test("legend region recognition is directional", () => {
  const argentina = { id: "argentina", raceClass: "g3", surfaceRegion: "阿根廷", surface: "草地", distance: 1600 };
  const usa = { id: "usa", raceClass: "g3", surfaceRegion: "美国", surface: "草地", distance: 1600 };
  const usaDirt = { id: "usa-dirt", raceClass: "g3", surfaceRegion: "美国", surface: "泥地", distance: 1600 };
  const middleEastTurf = { id: "me-turf", raceClass: "g3", surfaceRegion: "中东", surface: "草地", distance: 1600 };
  const middleEastDirt = { id: "me-dirt", raceClass: "g3", surfaceRegion: "中东", surface: "泥地", distance: 1600 };
  const japanTurf = { id: "japan-turf", raceClass: "g3", surfaceRegion: "日本", surface: "草地", distance: 1600 };
  const japanDirt = { id: "japan-dirt", raceClass: "g3", surfaceRegion: "日本", surface: "泥地", distance: 1600 };
  const hongKong = { id: "hong-kong", raceClass: "g3", surfaceRegion: "香港", surface: "草地", distance: 1600 };
  const australiaSprint = { id: "australia-sprint", raceClass: "g3", surfaceRegion: "澳洲", surface: "草地", distance: 1200 };
  const australiaMile = { id: "australia-mile", raceClass: "g3", surfaceRegion: "澳洲", surface: "草地", distance: 1400 };
  const horses = [
    legendHorse("american-turf", 80, eligibilityWin("美国", "草地", 1600)),
    legendHorse("argentine-turf", 80, eligibilityWin("阿根廷", "草地", 1600)),
    legendHorse("japanese-turf", 80, eligibilityWin("日本", "草地", 1600)),
    legendHorse("european-turf", 80, eligibilityWin("欧洲", "草地", 1600)),
    legendHorse("hong-kong-turf", 80, eligibilityWin("香港", "草地", 1600)),
    legendHorse("australian-turf", 80, eligibilityWin("澳洲", "草地", 1600)),
    legendHorse("european-sprinter", 80, eligibilityWin("欧洲", "草地", 1200)),
    legendHorse("american-dirt", 80, eligibilityWin("美国", "泥地", 1600)),
    legendHorse("japanese-dirt", 80, eligibilityWin("日本", "泥地", 1600))
  ];
  const fixtureRaces = [
    argentina, usa, usaDirt, middleEastTurf, middleEastDirt, japanTurf, japanDirt,
    hongKong, australiaSprint, australiaMile
  ];
  withHistoricalFixtures(horses, fixtureRaces, () => {
    assert.deepEqual(plain(rules.RaceRules.recognizedLegendWinRegions(argentina)), ["阿根廷", "美国"]);
    assert.deepEqual(plain(rules.RaceRules.recognizedLegendWinRegions(japanTurf)), ["日本", "香港", "澳洲"]);
    assert.deepEqual(plain(rules.RaceRules.recognizedLegendWinRegions(hongKong)), ["香港", "日本", "澳洲"]);
    assert.deepEqual(plain(rules.RaceRules.recognizedLegendWinRegions(australiaSprint)), ["澳洲", "日本", "欧洲"]);
    assert.deepEqual(plain(rules.RaceRules.recognizedLegendWinRegions(australiaMile)), ["澳洲", "日本"]);
    assert.deepEqual(plain(rules.RaceRules.recognizedLegendWinRegions(usa)), ["美国", "欧洲"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(argentina).map((item) => item.horseId).sort(), ["american-turf", "argentine-turf"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(usa).map((item) => item.horseId).sort(), ["american-turf", "european-turf"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(usaDirt).map((item) => item.horseId), ["american-dirt"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(japanTurf).map((item) => item.horseId).sort(), ["australian-turf", "hong-kong-turf", "japanese-turf"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(japanDirt).map((item) => item.horseId), ["japanese-dirt"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(hongKong).map((item) => item.horseId).sort(), ["australian-turf", "hong-kong-turf", "japanese-turf"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(australiaSprint).map((item) => item.horseId), ["european-sprinter"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(australiaMile).map((item) => item.horseId).sort(), ["australian-turf", "japanese-turf"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(middleEastTurf).map((item) => item.horseId).sort(), ["european-turf", "japanese-turf"]);
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(middleEastDirt).map((item) => item.horseId).sort(), ["american-dirt", "japanese-dirt"]);
  });
});

test("legend G1 threshold and condition-race penalty remain strict", () => {
  const g1 = { id: "strict-g1", raceClass: "g1", surfaceRegion: "美国", surface: "泥地", distance: 1800 };
  const condition = { id: "strict-condition", raceClass: "one-win", surfaceRegion: "日本", surface: "泥地", distance: 1800 };
  const horses = [
    {
      ...legendHorse("below", 84, eligibilityWin("美国", "泥地", 1800)),
      legendEligibilityWins: [
        eligibilityWin("美国", "泥地", 1800),
        eligibilityWin("日本", "泥地", 1800)
      ]
    },
    {
      ...legendHorse("eligible", 85, eligibilityWin("美国", "泥地", 1800)),
      legendEligibilityWins: [
        eligibilityWin("美国", "泥地", 1800),
        eligibilityWin("日本", "泥地", 1800)
      ]
    },
    legendHorse("condition-89", 93, eligibilityWin("日本", "泥地", 1800)),
    legendHorse("condition-90", 94, eligibilityWin("日本", "泥地", 1800))
  ];
  withHistoricalFixtures(horses, [g1, condition], () => {
    assert.deepEqual(rules.RaceRules.getLegendFieldCandidates(g1).map((item) => item.horseId), ["eligible"]);
    const conditionCandidates = rules.RaceRules.getLegendFieldCandidates(condition);
    assert.equal(conditionCandidates.find((item) => item.horseId === "below").ability, 80);
    assert.equal(conditionCandidates.find((item) => item.horseId === "eligible").ability, 81);
    assert.equal(conditionCandidates.find((item) => item.horseId === "condition-89").ability, 89);
    assert.equal(conditionCandidates.some((item) => item.horseId === "condition-90"), false);
  });
});

test("legend long-distance races accept any qualifying win at 2601 metres or farther", () => {
  const longRace = { id: "long-distance", raceClass: "op", surfaceRegion: "欧洲", surface: "草地", distance: 3600 };
  const middleRace = { id: "middle-distance", raceClass: "op", surfaceRegion: "欧洲", surface: "草地", distance: 2600 };
  const horses = [
    legendHorse("long-2800", 80, eligibilityWin("欧洲", "草地", 2800)),
    legendHorse("long-3000", 80, eligibilityWin("欧洲", "草地", 3000)),
    legendHorse("boundary-2601", 80, eligibilityWin("欧洲", "草地", 2601)),
    legendHorse("not-long-2600", 80, eligibilityWin("欧洲", "草地", 2600)),
    legendHorse("wrong-surface", 80, eligibilityWin("欧洲", "泥地", 3600)),
    legendHorse("wrong-region", 80, eligibilityWin("日本", "草地", 3600))
  ];
  withHistoricalFixtures(horses, [longRace, middleRace], () => {
    assert.deepEqual(
      rules.RaceRules.getLegendFieldCandidates(longRace).map((item) => item.horseId),
      ["long-2800", "long-3000", "boundary-2601"]
    );
    assert.deepEqual(
      rules.RaceRules.getLegendFieldCandidates(middleRace).map((item) => item.horseId),
      ["long-2800", "boundary-2601", "not-long-2600"]
    );
  });
});

test("Japanese dirt G1 fields keep every 85-plus horse and fill with the strongest lower-rated horses", () => {
  const race = { id: "japan-dirt-fallback", name: "japan-dirt-fallback", raceClass: "g1", surfaceRegion: "日本", surface: "泥地", distance: 1800 };
  const horses = [
    legendHorse("strong-88", 88, eligibilityWin("日本", "泥地", 1800)),
    legendHorse("strong-85", 85, eligibilityWin("日本", "泥地", 1800)),
    legendHorse("low-a", 84, eligibilityWin("日本", "泥地", 1800)),
    legendHorse("low-b", 84, eligibilityWin("日本", "泥地", 1800)),
    legendHorse("low-c", 84, eligibilityWin("日本", "泥地", 1800)),
    legendHorse("low-d", 83, eligibilityWin("日本", "泥地", 1800))
  ];
  horses.find((horse) => horse.id === "low-a").profile.peakAbility = 86;
  horses.find((horse) => horse.id === "low-b").profile.peakAbility = 87;
  horses.find((horse) => horse.id === "low-c").profile.peakAbility = 87;
  withHistoricalFixtures(horses, [race], () => {
    const field = rules.RaceRules.chooseOpponentField(race, { career: { races: [] } });
    assert.deepEqual(field.map((item) => item.horseId), ["strong-88", "strong-85", "low-b", "low-c", "low-a"]);
  });
});

test("Japanese ability fallback is unused when five 85-plus horses qualify", () => {
  const race = { id: "japan-female-turf", name: "japan-female-turf", raceClass: "g1", surfaceRegion: "日本", surface: "草地", distance: 1600, sexRestriction: "牝马" };
  const horses = Array.from({ length: 6 }, (_, index) => (
    legendHorse(`strong-${index + 1}`, 85 + index, eligibilityWin("日本", "草地", 1600))
  )).concat([legendHorse("below-85", 84, eligibilityWin("日本", "草地", 1600))]);
  withHistoricalFixtures(horses, [race], () => {
    const field = rules.RaceRules.chooseOpponentField(race, { career: { races: [] } });
    assert.equal(field.length, 5);
    assert.equal(field.some((item) => item.horseId === "below-85"), false);
    assert.ok(field.every((item) => item.ability >= 85));
  });
});

test("Japanese G1 pools keep random historical versions within the correct ability tier", () => {
  const race = { id: "japan-version-tier", name: "japan-version-tier", raceClass: "g1", surfaceRegion: "日本", surface: "泥地", distance: 1800 };
  const highVersionHorse = legendHorse("versioned-high", 84, eligibilityWin("日本", "泥地", 1800));
  highVersionHorse.races = [
    { raceId: race.id, year: 2019, ability: 84, jockeyId: "generic-local", finish: 1 },
    { raceId: race.id, year: 2020, ability: 86, jockeyId: "generic-local", finish: 1 }
  ];
  const lowVersionHorse = legendHorse("versioned-low", 83, eligibilityWin("日本", "泥地", 1800));
  lowVersionHorse.races = [
    { raceId: race.id, year: 2021, ability: 82, jockeyId: "generic-local", finish: 1 },
    { raceId: race.id, year: 2022, ability: 84, jockeyId: "generic-local", finish: 1 }
  ];
  const originalPickOne = rules.Random.pickOne;
  rules.Random.pickOne = (items) => items[items.length - 1];
  try {
    withHistoricalFixtures([highVersionHorse, lowVersionHorse], [race], () => {
      const strong = rules.RaceRules.getLegendFieldCandidates(race, { minAbility: 85 });
      assert.deepEqual(strong.map((item) => [item.horseId, item.year, item.ability]), [["versioned-high", 2020, 86]]);
      const fallback = rules.RaceRules.getLegendFieldCandidates(race, { minAbility: null });
      assert.deepEqual(fallback.map((item) => [item.horseId, item.year, item.ability]), [
        ["versioned-high", 2020, 86],
        ["versioned-low", 2022, 84]
      ]);
    });
  } finally {
    rules.Random.pickOne = originalPickOne;
  }
});

test("legend registration requires five unique qualified historical horses", () => {
  const race = { id: "strict-field-size", name: "strict-field-size", raceClass: "op", surfaceRegion: "日本", surface: "泥地", distance: 1800 };
  const horses = Array.from({ length: 5 }, (_, index) => (
    legendHorse(`qualified-${index + 1}`, 80 + index, eligibilityWin("日本", "泥地", 1800))
  ));
  withHistoricalFixtures(horses.slice(0, 4), [race], () => {
    assert.throws(
      () => rules.RaceRules.chooseOpponentField(race, { career: { races: [] } }),
      /只有4匹/
    );
  });
  withHistoricalFixtures(horses, [race], () => {
    const field = rules.RaceRules.chooseOpponentField(race, { career: { races: [] } });
    assert.equal(field.length, 5);
    assert.equal(new Set(field.map((item) => item.horseId)).size, 5);
    assert.ok(field.every((item) => item.historical));
    assert.ok(field.every((item) => Number.isFinite(item.year)));
  });
});

test("legend-only additions never enter normal-mode condition-race indexes", () => {
  const newHorseIds = new Set([
    "love-michan", "corin-berry", "gabbys-sister", "kimon-ruby", "la-verita",
    "grand-bridge", "shonan-nadeshiko", "acork-claw", "yorino-sapphire", "dakara-festive",
    "imperatriz", "bella-nipotina", "sunlight", "miss-andretti", "winx", "sunline",
    "super-impose", "mr-brightside", "lonhro", "might-and-power", "northerly",
    "verry-elleegant", "incentivise", "ethereal", "makybe-diva", "saintly", "efficient",
    "fiorente", "cogburn", "caravel", "stormy-liberal", "world-of-trouble", "belvoir-bay",
    "lady-shipman", "twilight-gleaming", "mizdirection", "nobals"
    ,"gold-allure", "meisei-opera", "cafe-pharoah", "chrysoberyl", "teo-keynes",
    "chuwa-wizard", "meisho-hario", "peptide-nile", "sambista", "icon-tailor",
    "white-fugue", "miracle-legend", "fashionista", "user-friendly", "dunfermline"
  ]);
  rules.HistoricalOpponentRules.reset();
  rules.Races.filter((race) => ["new", "maiden", "one-win", "two-win", "three-win"].includes(race.raceClass))
    .forEach((race) => {
      const indexed = rules.HistoricalOpponentRules.getByRaceId(race.id);
      assert.equal(indexed.some((opponent) => newHorseIds.has(opponent.horseId)), false, race.id);
      assert.equal(newHorseIds.has(rules.RaceRules.chooseOpponent(race).horseId), false, race.id);
    });
  assert.ok(rules.HistoricalOpponentRules.getByRaceId("capella-stakes").some((opponent) => opponent.horseId === "gabbys-sister"));
});

test("full legend audit can field five historical opponents for every race", () => {
  const conditionClasses = new Set(["new", "maiden", "one-win", "two-win", "three-win"]);
  const goldRiver = rules.Races.find((race) => race.id === "europe-listed-prix-gold-river");
  const royallieu = rules.Races.find((race) => race.id === "prix-de-royallieu");
  assert.equal(rules.RaceRules.getLegendFieldCandidates(goldRiver).length, 6);
  assert.equal(rules.RaceRules.getLegendFieldCandidates(royallieu).length, 5);

  const failures = rules.Races.map((race) => {
    const candidates = rules.RaceRules.getLegendFieldCandidates(race);
    if (conditionClasses.has(race.raceClass)) {
      assert.ok(candidates.every((candidate) => candidate.ability < 90), race.id);
    }
    return { race, candidates: candidates.length };
  }).filter((item) => item.candidates < 5);

  assert.deepEqual(plain(failures.map(({ race, candidates }) => ({
    id: race.id,
    candidates
  }))), []);
});
