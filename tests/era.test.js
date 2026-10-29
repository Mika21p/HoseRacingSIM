const test = require("node:test");
const assert = require("node:assert/strict");
const { loadEraRules } = require("./helpers/project-loader");
const plain = (x) => JSON.parse(JSON.stringify(x));
function setup(seed = 1998) { const ns = loadEraRules().rules; const run = ns.EraRules.createRun({ seed, horseName: "测试马" }); ns.EraRules.resolveSceneChoice(run, "opening", "continue"); return { ns, run }; }
function step(ns, run) { const s = ns.EraRules.getCurrentScene(run); return ns.EraRules.resolveSceneChoice(run, s.id, s.choices[0].id); }

test("v6 starts with explicit prototype rights and no invented record", () => {
  const { ns, run } = setup(); assert.equal(run.version, 6); assert.equal(run.date, "1998-01-01"); assert.equal(run.career.horse.birthYear, 1995); assert.equal(run.career.currentTime.age, 3); assert.equal(run.career.races.length, 0);
  assert.deepEqual(plain(ns.EraWorld.validate()), []); assert.deepEqual(plain(ns.EraStorylets.validate()), []);
  assert.ok(ns.EraRules.getAvailablePlans(run).some((p) => p.occurrence.id === "1998-tokyo-yushun"));
  assert.ok(!ns.EraRules.getAvailablePlans(run).some((p) => p.occurrence.id === "1998-asahi-hai-fs"));
});
test("calendar is independent of the current storylet and cancellation does not invent results", () => {
  const { ns, run } = setup(); assert.equal(ns.EraRules.registerRace(run, "1998-kyoto-shimbun-hai").type, "scheduled"); assert.equal(ns.EraRules.cancelScheduledRace(run).type, "cancelled"); assert.equal(run.settled.length, 0); assert.equal(run.career.races.length, 0);
  assert.equal(ns.EraRules.registerRace(run, "1998-kikka-sho").type, "scheduled");
});
test("unentered world replays all historical races exactly without simulating rivals", () => {
  const { ns, run } = setup();
  for (let i = 0; i < 400 && !run.ended; i++) step(ns, run);
  assert.equal(run.ended, true); assert.equal(run.date, "1999-12-31"); assert.equal(run.settled.length, 234);
  for (const year of [1998, 1999]) for (const e of ns.EraAlmanac.racesOf(year)) assert.deepEqual(plain(run.worldResults[e.id].results), plain(e.results));
});
test("views and normalizeSave do not advance the event log or RNG; future results stay hidden", () => {
  const { ns, run } = setup(); const before = JSON.stringify(run);
  for (let i = 0; i < 3; i++) { ns.EraRules.getScheduleOptions(run); ns.EraRules.getCurrentScene(run); ns.EraRules.getTimeline(run); ns.EraRules.getNewspaperItems(run); ns.EraWorld.yearbook(run); ns.EraRules.normalizeSave(run); }
  assert.equal(JSON.stringify(run), before); assert.equal(ns.EraWorld.yearbook(run).length, 0);
});
test("same seed yields stable candidate identity and comments", () => {
  const ns = loadEraRules().rules; assert.deepEqual(plain(ns.EraRules.createEntrySetup({ seed: 123 })), plain(ns.EraRules.createEntrySetup({ seed: 123 })));
});
test("unknown or legacy run is rejected without rewriting its data", () => {
  const { ns, run } = setup(); run.version = 5; const before = JSON.stringify(run); assert.throws(() => ns.EraRules.normalizeSave(run)); assert.equal(JSON.stringify(run), before);
});
test("retirement routes through an ending scene and remains idempotent", () => {
  const { ns, run } = setup(); ns.EraRules.retire(run); assert.equal(run.ended, false); assert.equal(run.endingPending, true); step(ns, run); assert.equal(run.ended, true); const n = run.events.length; ns.EraRules.retire(run); assert.equal(run.events.length, n);
});

module.exports = { setup, step };

test("saved mid-season run replays identically with exact field size", () => {
 const { ns, run } = setup(12);
 ns.EraRules.registerRace(run, "1998-mainichi-hai");
 for (let i = 0; i < 40 && !run.settled.includes("1998-mainichi-hai"); i++) step(ns, run);
 assert.ok(run.settled.includes("1998-mainichi-hai"));
 assert.equal(run.worldResults["1998-mainichi-hai"].fieldSize, ns.EraAlmanac.race("1998-mainichi-hai").headcount);
 const restored = ns.EraRules.normalizeSave(plain(run));
 for (const current of [run, restored]) {
  if (!current.career.retired) ns.EraRules.registerRace(current, "1998-tokyo-yushun");
  for (let i = 0; i < 180 && !current.ended; i++) step(ns, current);
 }
 assert.deepEqual(plain(restored), plain(run));
});

test("legacy archive succeeds before replacement; failures preserve original and future saves", () => {
 const { ns } = setup(); const key = ns.EraSave.KEY; const backup = ns.EraSave.LEGACY_KEY;
 const old = JSON.stringify({ version: 3, run: { version: 5 } });
 const values = new Map([[key, old]]);
 const storage = { getItem: (k) => values.get(k) || null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
 assert.equal(ns.EraSave.read(storage).blocked, false); assert.equal(values.get(backup), old); assert.ok(!values.has(key));
 values.set(key, old); values.delete(backup); storage.setItem = () => { throw new Error("quota"); };
 assert.equal(ns.EraSave.read(storage).blocked, true); assert.equal(values.get(key), old);
 values.set(key, JSON.stringify({ version: 3, run: { version: 99 } }));
 assert.equal(ns.EraSave.read(storage).blocked, true); assert.ok(values.get(key).includes("99"));
});
