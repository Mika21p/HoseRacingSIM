const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { IDBFactory, IDBKeyRange } = require("fake-indexeddb");
const { loadChairmanRules, projectRoot } = require("./helpers/project-loader");
const plain = (v) => JSON.parse(JSON.stringify(v));
function fixture() {
  const p = loadChairmanRules(), W = p.rules.ChairmanRules;
  let world = W.createWorld({ blank: true, seed: 3811 });
  world = W.edit(world, "region", { name: "星海群岛", baseRegion: "美国", autoPopulate: true }).world;
  world = W.edit(world, "track", { name: "星海中央", region: "星海群岛", courseType: "东京", surfaces: ["草地", "泥地"] }).world;
  world = W.edit(world, "race", { name: "星海杯", trackId: world.tracks[0].id, surface: "草地", distance: 1600,
    raceClass: "g1", month: 1, half: 1, ageRule: "2+", sexRule: "all", capacity: 16, prizes: W.defaultPrizes("g1") }).world;
  return { ...p, W, world };
}
test("fictional regions run local fields with mapped engine rules and preserve geographical results", () => {
  const { W, rules, world: before } = fixture();
  const world = W.mutate(before, (w) => { for (let i = 0; i < 16; i++) W.addHorse(w, { age: 3, homeRegion: "星海群岛" }); W.planEntries(w); }).world;
  assert.ok(world.horses.every((h) => h.booked?.turn === 0 && h.booked.preparationTurn === null));
  const race = W.engineRace(world, world.races[0]), mapped = W.simulationRace(world, race);
  assert.equal(mapped.surfaceRegion, "美国");
  const horse = { ...world.horses[0], grass: { ...world.horses[0].grass, 美国: "S", 其他: "G" } };
  assert.equal(rules.HorseRules.calcRaceAbility(horse, mapped, { currentTime: W.timeFor(world, horse), noAbilityFloor: true }).surfaceGrade, "S");
  let seen; const original = rules.RaceRules.simulateWorldRace;
  rules.RaceRules.simulateWorldRace = (runners, r) => { seen = r; return original(runners, r); };
  const out = W.advanceHalfMonth(world); W.validateWorld(out.world);
  assert.equal(seen.surfaceRegion, "美国"); assert.equal(out.performances.length, 16);
  assert.ok(out.performances.every((r) => r.surfaceRegion === "星海群岛" && r.homeRegion === "星海群岛"));
  assert.equal(out.occurrences[0].race.engineRegion, "美国");
  assert.equal(new Set(out.performances.map((r) => r.jockeyId)).size, 16);
  assert.ok(out.world.horses.some((h) => Object.keys(h.observations).some((key) => key.startsWith("星海群岛|"))));
});
test("different fictional areas sharing one template still require expedition preparation", () => {
  const { W, world: before } = fixture();
  let world = W.edit(before, "region", { name: "月光大陆", baseRegion: "美国", autoPopulate: true }).world;
  world = W.edit(world, "race", { ...world.races[0], half: 2 }).world;
  world = W.mutate(world, (w) => { for (let i = 0; i < 4; i++) W.addHorse(w, { age: 3, homeRegion: "月光大陆" }); W.planEntries(w); }).world;
  assert.ok(world.horses.every((h) => h.booked.turn === 1 && h.booked.preparationTurn === 0));
  world = W.advanceHalfMonth(world).world;
  assert.ok(world.horses.every((h) => h.locationRegion === "星海群岛"));
  const region = W.regions(world).find((r) => r.name === "星海群岛");
  world = W.edit(world, "region", { ...region, baseRegion: "日本" }).world;
  const out = W.advanceHalfMonth(world);
  assert.equal(out.occurrences[0].race.engineRegion, "美国", "travel-locked edition retains the old template");
  assert.equal(W.engineRace(out.world, out.world.races[0]).engineRegion, "日本");
  assert.equal(out.performances.length, 4);
  const localNow = W.mutate(before, (w) => { W.addHorse(w, { homeRegion: "日本" }); W.planEntries(w); }).world;
  assert.equal(localNow.horses[0].booked, null, "cannot teleport to a foreign first-half race");
});
test("automatic replacements use enabled regions and legacy worlds retain original defaults", () => {
  const { W, world: before } = fixture(); let w = before;
  for (const r of W.regions(w)) if (r.name !== "星海群岛") w = W.edit(w, "region", { ...r, autoPopulate: false }).world;
  w.settings.annualNewHorses = 7; w.turn = 23; w.phase = "yearEnd";
  const next = W.finishYear(w).world; assert.equal(next.horses.length, 7);
  assert.ok(next.horses.every((h) => h.homeRegion === "星海群岛" && W.ageOf(next, h) === 2));
  next.regions.forEach((r) => { r.autoPopulate = false; }); next.turn = 47; next.phase = "yearEnd";
  assert.equal(W.finishYear(next).world.horses.length, 7);
  const legacy = W.createWorld({ blank: true, seed: 33 }); delete legacy.regions;
  W.validateWorld(legacy); assert.deepEqual(plain(W.regionNames(legacy)), ["日本", "欧洲", "美国"]);
  assert.throws(() => W.edit(w, "region", { name: "日本", baseRegion: "美国" }), /已存在/);
  assert.throws(() => W.edit(w, "region", { name: "未记录", baseRegion: "日本" }), /地区名/);
  const broken = W.clone(w); broken.regions[3].baseRegion = "不存在"; assert.throws(() => W.validateWorld(broken), /地区/);
});
test("fictional horse and race creation CSV round trips without inventing unknown regions", () => {
  const { W, rules, world: before } = fixture(), C = rules.ChairmanCSV;
  const world = W.mutate(before, (w) => W.addHorse(w, { origin: "custom", name: "星海之光", homeRegion: "星海群岛" })).world;
  for (const kind of ["horse", "race"]) {
    const preview = C.preview(world, kind, C.exportRows(world, kind)); assert.deepEqual(plain(preview.errors), []);
    assert.equal(preview.added, 1); W.validateWorld(preview.output.world);
  }
  const csv = C.exportRows(world, "horse").replaceAll("星海群岛", "未创建的地区");
  const invalid = C.preview(world, "horse", csv); assert.ok(invalid.errors.some((e) => e.includes("地区"))); assert.equal(invalid.output, null);
});
test("region metadata survives IndexedDB, full snapshots, slots and turn recovery", async () => {
  const { W, rules, context, world: before } = fixture();
  Object.assign(context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  vm.runInContext(fs.readFileSync(path.join(projectRoot, "js/chairman-storage.js"), "utf8"), context);
  const store = await rules.ChairmanStorage.open();
  try {
    const world = W.mutate(before, (w) => { W.addHorse(w, { homeRegion: "星海群岛" }); W.addHorse(w, { homeRegion: "星海群岛" }); W.planEntries(w); }).world;
    await store.acquire(world.id); await store.commitChanges(null, { world });
    assert.deepEqual(plain((await store.load(world.id)).regions), plain(world.regions));
    const out = W.advanceHalfMonth(world); await store.commitChanges(world, out, { checkpoint: "turn" });
    const snapshot = await store.exportWorld(world.id), imported = await store.importWorld(snapshot);
    assert.deepEqual(plain(imported.regions), plain(world.regions));
    assert.equal((await store.query("performances", imported.id)).rows[0].surfaceRegion, "星海群岛");
    await store.acquire(world.id); await store.saveSlot(world.id, 2); const slot = await store.loadSlot(2);
    assert.ok(W.regionNames(slot).includes("星海群岛"));
    await store.acquire(world.id); const restored = await store.restore(out.world, `turn:${world.revision}`);
    assert.deepEqual(plain(W.advanceHalfMonth(restored).performances), plain(out.performances));
    const bad = plain(snapshot); bad.world.regions.pop(); assert.throws(() => store.validateSnapshot(bad), /地区/);
  } finally { await store.close(); }
});
