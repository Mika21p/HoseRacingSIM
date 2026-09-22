const test = require("node:test");
const assert = require("node:assert/strict");

const { loadTrackAptitudeLabRules } = require("./helpers/project-loader");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeHorse(overrides) {
  return {
    id: "lab-horse",
    name: "测试马",
    strength: 80,
    surfaceGrades: { grass: "A", dirt: "A" },
    trackAptitudes: { burst: "○", sustained: "○", attrition: "○" },
    distMin: 1000,
    coreDist: 2000,
    distMax: 4200,
    peakStart: "二岁春",
    peakEnd: "八岁冬",
    heavyType: "普通",
    temperamentLabel: "沉稳",
    ...(overrides || {})
  };
}

function makeRace(profile) {
  return {
    id: `race:${profile.id}`,
    name: profile.name,
    surface: profile.surface,
    distance: profile.distance,
    courseProfile: profile
  };
}

function fixedOptions(strength) {
  return {
    maturity: { status: "成熟期", adjustedStrength: strength },
    temperamentMod: { label: "沉稳", min: 0, max: 0, mod: 0 },
    trackCondition: "良",
    noAbilityFloor: true
  };
}

test("赛场类型适性在三类型、两强度与三档中均按集中表计算", () => {
  const { rules: ns } = loadTrackAptitudeLabRules();
  const A = ns.TrackAptitudeRules;
  const expected = {
    1: { "◎": 2, "○": 0, "△": -2 },
    2: { "◎": 4, "○": -1, "△": -4 }
  };

  A.TRACK_TYPES.forEach((type) => {
    A.INTENSITIES.forEach((intensity) => {
      A.TRACK_APTITUDE_GRADES.forEach((grade) => {
        const profile = {
          id: `${type}-${intensity}`,
          trackId: "test-track",
          courseConfigId: `test-track:${type}-${intensity}`,
          surface: "草地",
          distance: 2000,
          type,
          intensity
        };
        const horse = makeHorse({ trackAptitudes: { burst: "○", sustained: "○", attrition: "○", [type]: grade } });
        const calculated = A.calculateModifiers(horse, profile);
        assert.equal(calculated.trackAptitudeMod, expected[intensity][grade], `${type} ${intensity} ${grade}`);
        assert.equal(calculated.surfaceMod, 0);
      });
    });
  });
});

test("草泥四档单独计算，且与赛场类型修正相加", () => {
  const { rules: ns } = loadTrackAptitudeLabRules();
  const A = ns.TrackAptitudeRules;
  const profile = {
    id: "dirt-attrition-2",
    trackId: "test-track",
    courseConfigId: "test-track:dirt-attrition-2",
    surface: "泥地",
    distance: 1800,
    type: "attrition",
    intensity: 2
  };
  const expected = { A: 0, B: -5, C: -10, G: -20 };

  Object.entries(expected).forEach(([grade, surfaceMod]) => {
    const horse = makeHorse({
      surfaceGrades: { grass: "A", dirt: grade },
      trackAptitudes: { burst: "○", sustained: "○", attrition: "◎" }
    });
    const calculated = A.calculateModifiers(horse, profile);
    assert.equal(calculated.surfaceMod, surfaceMod);
    assert.equal(calculated.trackAptitudeMod, 4);
    assert.equal(calculated.modifier, surfaceMod + 4);
  });
});

test("实验赛程在现有赛前能力入口只修正一次并保留摘要", () => {
  const { rules: ns } = loadTrackAptitudeLabRules();
  const profile = ns.CourseProfiles.get("lab-mistfield-turf-2000-inner");
  const horse = makeHorse({ trackAptitudes: { burst: "◎", sustained: "△", attrition: "△" } });
  const race = makeRace(profile);

  const first = ns.HorseRules.calcRaceAbility(horse, race, fixedOptions(80));
  const second = ns.HorseRules.calcRaceAbility(horse, race, fixedOptions(80));
  assert.equal(first.ability, 84);
  assert.equal(first.rawAbility, 84);
  assert.equal(first.surfaceMod, 0);
  assert.equal(first.trackAptitudeMod, 4);
  assert.equal(first.trackAptitude.courseProfileId, profile.id);
  assert.equal(first.ruleVersion, "track-aptitude-v1");
  assert.equal(second.ability, 84);
  assert.equal(horse.strength, 80);

  const weak = makeHorse({ trackAptitudes: { burst: "△", sustained: "◎", attrition: "◎" } });
  assert.equal(ns.HorseRules.calcRaceAbility(weak, race, fixedOptions(80)).ability, 76);
});

test("资料不足的自定义赛程使用低置信度Ⅰ级模板", () => {
  const { rules: ns } = loadTrackAptitudeLabRules();
  const A = ns.TrackAptitudeRules;
  assert.equal(A.resolveCourseProfile({ id: "unconfigured", surface: "草地", distance: 2000 }), null);
  const profile = A.requireCourseProfile({ id: "unconfigured", name: "待配置赛事", surface: "草地", distance: 2000 });
  assert.equal(profile.type, "burst");
  assert.equal(profile.intensity, 1);
  assert.equal(profile.status, "provisional");
  assert.equal(profile.confidence, "low");
  assert.equal(profile.classificationSource, "unresolved-venue-circuit-template-v1");
});

test("实验比赛复用现有比赛阶段，并仅在请求时返回能力摘要", () => {
  const { rules: ns } = loadTrackAptitudeLabRules();
  const profile = ns.CourseProfiles.get("lab-greyharbor-dirt-1400-short");
  const race = makeRace(profile);
  const runners = ["one", "two"].map((id) => ({
    horse: makeHorse({
      id,
      name: id,
      surfaceGrades: { grass: "A", dirt: "A" },
      trackAptitudes: { burst: "○", sustained: "○", attrition: id === "one" ? "◎" : "△" }
    }),
    maturity: { status: "成熟期", adjustedStrength: 80 },
    temperamentMod: { label: "沉稳", min: 0, max: 0, mod: 0 },
    jockey: { id: `j-${id}`, name: id, ability: 70 }
  }));
  const result = ns.Random.withSource(ns.Random.seeded(12), () => ns.RaceRules.simulateWorldRace(runners, race, {
    trackCondition: "良",
    includeAbilityCalculations: true
  }));
  assert.equal(result.results.length, 2);
  assert.ok(result.results.every((row) => row.calculation && row.phases));
  assert.deepEqual(
    plain(result.results.map((row) => row.calculation.trackAptitudeMod).sort((a, b) => a - b)),
    [-2, 2]
  );
  assert.ok(result.results.every((row) => row.entryAbility === row.calculation.ability - row.pressure));
});

test("实验页只读写独立存储键，且实验记录可以重载", () => {
  const { rules: ns } = loadTrackAptitudeLabRules();
  const values = new Map([["keiba-career-save", "正式进度"]]);
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); }
  };
  const state = ns.TrackAptitudeLab.createDefaultState();
  state.horse.strength = 83;
  state.lastRun = ns.TrackAptitudeLab.runExperiment(state);
  ns.TrackAptitudeLab.writeStoredState(storage, state);

  assert.equal(values.get("keiba-career-save"), "正式进度");
  assert.ok(values.has(ns.TrackAptitudeLab.STORAGE_KEY));
  const restored = ns.TrackAptitudeLab.readStoredState(storage);
  assert.equal(restored.horse.strength, 83);
  assert.equal(restored.lastRun.profileId, state.profileId);
  assert.equal(restored.lastRun.result.results.length, 2);
});
