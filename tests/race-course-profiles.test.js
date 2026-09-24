const test = require("node:test");
const assert = require("node:assert/strict");

const { loadProjectData, loadChairmanRules } = require("./helpers/project-loader");

test("地区平衡在共享路线生效，保留日本基线与欧洲瞬发出口", () => {
  const { rules, races } = loadChairmanRules();
  const profiles = rules.RaceCourseProfiles;
  const resolve = (id) => profiles.resolveForRace(races.find((race) => race.id === id));
  for (const id of ["prix-de-larc", "grand-prix-de-paris", "prix-vermeille", "epsom-derby", "epsom-oaks", "coronation-cup", "irish-derby", "irish-oaks", "king-george-vi-and-queen-elizabeth-stakes", "british-champions-fillies-mares-stakes", "eclipse-stakes", "irish-champion-stakes", "prince-of-wales-stakes", "champion-stakes"]) {
    const profile = resolve(id);
    assert.equal(profile.type, "sustained", id);
    assert.equal(profile.intensity, 2, id);
    assert.equal(profile.classificationSource, "regional-course-balance-2026-09-23");
  }
  assert.equal(resolve("prix-de-larc").id, resolve("prix-vermeille").id);
  for (const id of ["prix-jacques-le-marois", "prix-du-jockey-club", "international-stakes", "lockinge-stakes", "tokyo-yushun"]) {
    assert.equal(resolve(id).type, "burst", id);
    assert.equal(resolve(id).intensity, 1, id);
  }
  assert.equal(resolve("february-stakes").intensity, 2);
  assert.equal(resolve("champions-cup").type, "sustained");
  assert.equal(resolve("kashiwa-kinen").type, "attrition");
  assert.equal(profiles.resolveForTrackCourse("chukyo", "草地", 1600).type, "burst");
});

test("美国、香港与中东分化按草泥和距离执行，轮换采用实际举办地", () => {
  const { rules, races } = loadChairmanRules();
  const profiles = rules.RaceCourseProfiles;
  const resolve = (id) => profiles.resolveForRace(races.find((race) => race.id === id));
  const expectations = {
    "pegasus-world-cup-turf": "attrition", "breeders-cup-turf": "sustained",
    "breeders-cup-mile": "attrition", "keeneland-turf-mile": "burst", "kentucky-derby": "sustained",
    "hong-kong-vase": "sustained", "hong-kong-cup": "burst", "hong-kong-sprint": "attrition",
    "dubai-world-cup": "attrition", "uae-derby": "attrition", "uae-2000-guineas": "attrition",
    "saudi-cup": "sustained", "saudi-derby": "sustained", "dubai-turf": "burst",
    "dubai-sheema-classic": "sustained", "al-quoz-sprint": "attrition", "neom-turf-cup": "sustained"
  };
  for (const [id, type] of Object.entries(expectations)) {
    assert.equal(resolve(id).type, type, id);
    assert.equal(resolve(id).intensity, 1, id);
  }
  const mile = races.find((race) => race.id === "breeders-cup-mile");
  assert.equal(profiles.resolveForVenue(mile, "keeneland").type, "burst");
  assert.equal(profiles.resolveForVenue(mile, "del-mar").type, "attrition");
  assert.equal(profiles.resolveForTrackCourse("us-circuit-turf", "草地", 1800).type, "attrition");
  assert.equal(profiles.resolveForTrackCourse("us-circuit-turf", "草地", 2000).type, "sustained");
  const blue = races.find((race) => race.id === "blue-point-sprint");
  assert.equal(blue.distance, 1200);
  assert.equal(blue.month, 1);
  assert.equal(resolve(blue.id).trackKey, "meydan");
  assert.equal(resolve(blue.id).type, "attrition");
});

test("赛程档案将已确认的日本 G1 映射到共享路线，并为未识别赛事提供低置信度模板", () => {
  const project = loadProjectData();
  const profiles = project.context.window.Keiba.RaceCourseProfiles;
  const report = profiles.audit(project.races);
  const races = new Map(project.races.map((race) => [race.id, race]));

  assert.equal(profiles.all().filter((profile) => profile.status === "confirmed").length, 17);
  assert.ok(profiles.all().some((profile) => profile.status === "provisional" && profile.confidence === "low"));
  assert.ok(report.summary.configured >= report.courseIdentity.summary.resolved);
  assert.ok(report.summary.configured > 24);
  assert.ok(report.summary.profilesInUse > 17);
  assert.equal(report.summary.invalid, 0);
  assert.equal(report.summary.configured, report.summary.races);
  assert.equal(report.summary.pending, 0);
  assert.equal(report.summary.pendingCourseSignatures, 0);

  const derby = races.get("tokyo-yushun");
  assert.equal(derby.courseProfileId, undefined);
  assert.equal(derby.courseRouteId, undefined);
  assert.equal(profiles.profileIdForRace(derby), "jp-tokyo-turf-2400-standard");
  assert.deepEqual(JSON.parse(JSON.stringify(profiles.resolveForRace(derby))), {
    id: "jp-tokyo-turf-2400-standard",
    trackId: "tokyo",
    trackKey: "tokyo",
    trackName: "东京",
    courseConfigId: "jp:tokyo:turf:2400:standard",
    routeId: "standard",
    routeName: "标准路线",
    surface: "草地",
    distance: 2400,
    type: "burst",
    intensity: 1,
    status: "confirmed",
    confidence: "confirmed",
    classificationRuleVersion: "track-aptitude-classification-v1",
    classificationSource: "user-provided-japanese-g1-baseline-2026-09-22"
  });

  const unresolved = races.get("july-cup");
  const fallback = profiles.resolveForRace(unresolved);
  assert.equal(unresolved.courseProfileId, undefined);
  assert.equal(fallback.status, "provisional");
  assert.equal(fallback.confidence, "low");
  assert.equal(fallback.intensity, 1);
  assert.equal(fallback.classificationSource, "unresolved-venue-circuit-template-v1");
  assert.equal(profiles.resolveForRace({ course: "东京", surface: "草地", distance: 2400 }).confidence, "low");
  const automatic = races.get("one-win-turf-2-10-early-tokyo-1600-1");
  assert.equal(automatic.courseProfileId, undefined);
  assert.equal(profiles.profileIdForRace(automatic), "jp-tokyo-turf-1600-standard");
  const materialized = { ...automatic };
  assert.equal(profiles.applyToRace(materialized).status, "configured");
  assert.equal(materialized.courseProfileId, "jp-tokyo-turf-1600-standard");
  assert.equal(materialized.courseRouteId, "standard");

  const generatedJapaneseConditions = project.races.filter((race) => race.surfaceRegion === "日本" && ["new", "maiden", "one-win", "two-win", "three-win"].includes(race.raceClass));
  assert.equal(generatedJapaneseConditions.length, 1336);
  for (const race of generatedJapaneseConditions) {
    assert.ok(race.courseRouteId, `${race.id} 缺少路线`);
    assert.equal(profiles.resolveCourseIdentity(race).status, "resolved", `${race.id} 不是有效 JRA 赛程`);
    assert.ok(profiles.resolveForRace(race), `${race.id} 没有共享赛程档案`);
  }
});

test("赛程档案校验表面与距离，路线不能被赛事数据静默替换", () => {
  const project = loadProjectData();
  const profiles = project.context.window.Keiba.RaceCourseProfiles;
  const profile = profiles.get("jp-hanshin-turf-1600-outer");

  assert.equal(profile.routeId, "outer");
  assert.equal(profiles.checkRaceAgainstProfile({ surface: "草地", distance: 1600 }, profile).valid, true);
  assert.equal(profiles.checkRaceAgainstProfile({ surface: "泥地", distance: 1600 }, profile).valid, false);
  assert.equal(profiles.checkRaceAgainstProfile({ surface: "草地", distance: 1800 }, profile).valid, false);
  assert.equal(profiles.checkRaceAgainstProfile({ surface: "草地", distance: 1600, courseRouteId: "standard" }, profile).valid, false);
});

test("JRA 官方路线目录区分有效、路线待补充与无效的赛事身份", () => {
  const project = loadProjectData();
  const profiles = project.context.window.Keiba.RaceCourseProfiles;

  assert.equal(profiles.resolveCourseIdentity({ surfaceRegion: "日本", course: "东京", surface: "草地", distance: 1600 }).status, "resolved");
  const collapsed = profiles.resolveCourseIdentity({ surfaceRegion: "日本", course: "京都", surface: "草地", distance: 2000 });
  assert.equal(collapsed.status, "resolved");
  assert.equal(collapsed.routeId, "standard");
  assert.equal(profiles.resolveCourseIdentity({ surfaceRegion: "日本", course: "东京", surface: "草地", distance: 1000 }).status, "invalid");
  assert.equal(profiles.resolveCourseIdentity({ surfaceRegion: "美国", course: "美国", surface: "草地", distance: 1600 }).status, "unavailable");

  const yomiuri = project.races.find((race) => race.id === "yomiuri-milers-cup");
  assert.equal(profiles.resolveCourseIdentity(yomiuri).routeId, "outer");
  assert.equal(profiles.profileIdForRace(yomiuri), "jp-kyoto-turf-1600-outer");
  assert.match(profiles.courseRouteSourceByRaceId["yomiuri-milers-cup"], /^https:\/\/www\.jra\.go\.jp\//);
});

test("主席世界解析保留匹配实际举办地的赛程档案，改址时不会沿用来源分类", () => {
  const project = loadChairmanRules();
  const { ChairmanWorld: worldRules } = project.rules;
  const world = worldRules.create({
    id: "course-profile-world",
    worldType: "reference",
    regionKeys: ["japan"],
    population: { japan: 0 },
    foundation: false,
    seed: 12
  });
  const derby = world.races.find((race) => race.sourceId === "tokyo-yushun");
  const actual = worldRules.resolveRace(world, derby, 1);

  assert.equal(actual.courseProfileId, "jp-tokyo-turf-2400-standard");
  assert.equal(actual.courseRouteId, "standard");
  const otherTrack = world.tracks.find((track) => track.key === "nakayama");
  derby.trackId = otherTrack.id;
  const moved = worldRules.resolveRace(world, derby, 1);
  assert.notEqual(moved.courseProfileId, actual.courseProfileId);
  assert.equal(moved.courseProfile.trackId, otherTrack.id);
  assert.equal(moved.courseProfile.intensity, 1);
  assert.equal(moved.courseProfile.status, 'provisional');
});

test("已有官方举办地记录的海外赛事按实体马场生成低置信度Ⅰ级暂定档案", () => {
  const project = loadChairmanRules();
  const profiles = project.rules.RaceCourseProfiles;
  const kentuckyDerby = project.races.find((race) => race.id === "kentucky-derby");
  const identity = profiles.resolveCourseIdentity(kentuckyDerby);

  assert.equal(identity.status, "venue-resolved");
  assert.equal(identity.trackKey, "churchill-downs");
  assert.match(identity.sourceUrl, /^https:\/\//);
  const profile = profiles.resolveForRace(kentuckyDerby);
  assert.equal(profile.trackKey, "churchill-downs");
  assert.equal(profile.type, "sustained");
  assert.equal(profile.intensity, 1);
  assert.equal(profile.status, "provisional");
  assert.equal(profile.confidence, "low");
});

test("地方、补充海外赛场和巡回赛场模板使主席比赛库全量可解析", () => {
  const project = loadChairmanRules();
  const profiles = project.rules.RaceCourseProfiles;
  const report = profiles.audit(project.races);

  assert.equal(report.summary.configured, report.summary.races);
  assert.equal(report.summary.pending, 0);
  assert.equal(report.summary.invalid, 0);

  const kawasaki = profiles.resolveForRace(project.races.find((race) => race.id === "kawasaki-kinen"));
  assert.equal(kawasaki.trackKey, "kawasaki");
  assert.equal(kawasaki.type, "sustained");

  const hongKong = profiles.resolveForRace(project.races.find((race) => race.id === "hong-kong-cup"));
  assert.equal(hongKong.trackKey, "sha-tin");
  assert.equal(hongKong.type, "burst");

  const circuit = profiles.resolveForRace(project.races.find((race) => race.id === "america-maiden-2-6-early-dirt-1000-1"));
  assert.equal(circuit.trackKey, "us-circuit-dirt");
  assert.equal(circuit.status, "provisional");
  assert.equal(circuit.confidence, "low");

  const jbc = profiles.resolveForRace(project.races.find((race) => race.id === "jbc-classic"));
  assert.equal(jbc.trackKey, "jbc-rotating");
  assert.equal(jbc.intensity, 1);
});

test("JBC 举办地组按届次解析官方举办地与后续轮换赛场", () => {
  const project = loadChairmanRules();
  const profiles = project.rules.RaceCourseProfiles;
  const members = ["jbc-classic", "jbc-sprint", "jbc-ladies-classic"]
    .map((id) => project.races.find((race) => race.id === id));

  assert.equal(profiles.venueGroupForRace(members[0]).id, "jbc");
  assert.deepEqual(members.map((race) => profiles.resolveVenueForRace(race, 2024).venueKey), ["saga", "saga", "saga"]);
  assert.deepEqual(members.map((race) => profiles.resolveVenueForRace(race, 2025).venueKey), ["funabashi", "funabashi", "funabashi"]);
  assert.deepEqual(members.map((race) => profiles.resolveVenueForRace(race, 2026).venueKey), ["kanazawa", "kanazawa", "kanazawa"]);
  assert.deepEqual(members.map((race) => profiles.resolveVenueForRace(race, 2027).venueKey), ["oi", "oi", "oi"]);

  const edition = profiles.resolveForEdition(members[0], 2025);
  assert.equal(edition.trackKey, "funabashi");
  assert.equal(edition.status, "provisional");
  assert.equal(edition.intensity, 1);

  const kanazawaEdition = members.map((race) => profiles.resolveEditionRace(race, 2026));
  assert.deepEqual(kanazawaEdition.map((race) => race.distance), [2100, 1400, 1500]);
  assert.deepEqual(kanazawaEdition.map((race) => race.venueTrackKey), ["kanazawa", "kanazawa", "kanazawa"]);
  const kanazawaProfile = profiles.resolveForEdition(members[0], 2026);
  assert.equal(kanazawaProfile.trackKey, "kanazawa");
  assert.equal(kanazawaProfile.distance, 2100);

  const frozenEdition = { ...members[0] };
  assert.equal(profiles.applyToRace(frozenEdition, { year: 2026 }).status, "configured");
  assert.equal(frozenEdition.distance, 2100);
  assert.match(frozenEdition.courseProfileId, /^venue-kanazawa-dirt-2100-/);
  assert.equal(profiles.resolveForRace(members[0]).trackKey, "jbc-rotating");
});
