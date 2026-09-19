const test = require("node:test"), assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const vm = require("node:vm"), fs = require("node:fs"), path = require("node:path");
const { IDBFactory, IDBKeyRange } = require("fake-indexeddb");
const { loadChairmanRules, projectRoot } = require("./helpers/project-loader");
test("default world runs five complete seasons without duplicate starts, prizes or occurrences", (t) => {
  const { rules } = loadChairmanRules(), W = rules.ChairmanRules;
  let world = W.createWorld({ seed: 995173, id: "five-year-test" }), starts = 0, g1 = 0, prize = 0;
  const occurrences = new Set(), horseTurns = new Set(), last = new Map(), began = performance.now();
  for (let year = 1; year <= 5; year++) {
    while (world.phase !== "yearEnd") {
      const out = W.advanceHalfMonth(world); world = out.world;
      for (const race of out.occurrences) { assert.ok(!occurrences.has(race.id)); occurrences.add(race.id); if (race.raceClass === "g1") g1++; }
      for (const p of out.performances) {
        assert.ok(!horseTurns.has(`${p.horseId}:${p.turn}`)); horseTurns.add(`${p.horseId}:${p.turn}`);
        if (last.has(p.horseId)) assert.ok(p.turn - last.get(p.horseId) >= 3);
        last.set(p.horseId, p.turn); starts++; prize += p.prize;
      }
    }
    const out = W.finishYear(world); world = out.world;
    assert.ok(out.ratings.every((r) => r.year === year)); W.validateWorld(world);
  }
  assert.equal(world.turn, 120); assert.equal(world.horses.length, 675); assert.equal(occurrences.size, 810); assert.equal(g1, 90);
  assert.equal(starts, world.horses.reduce((sum, h) => sum + h.lifetime.starts, 0));
  assert.ok(Math.abs(prize - world.horses.reduce((sum, h) => sum + h.lifetime.prize, 0)) < .001);
  t.diagnostic(`5 years: ${starts} starts, ${world.horses.filter((h) => h.status === "active").length} active, ${(performance.now() - began).toFixed(0)} ms`);
});
test("1000 active horses and 20 years of indexed history save, query, restore and export", async (t) => {
  const p = loadChairmanRules(), W = p.rules.ChairmanRules;
  Object.assign(p.context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  vm.runInContext(fs.readFileSync(path.join(projectRoot, "js/chairman-storage.js"), "utf8"), p.context);
  const store = await p.rules.ChairmanStorage.open();
  const w = W.createWorld({ seed: 99617, horseCount: 1000, id: "large-world-test" }); w.turn = 480;
  for (const h of w.horses) { h.birthYear += 20; h.annual.year = 21; h.booked = null; }
  W.seeded(w, () => W.planEntries(w));
  const occurrences = [], performances = [];
  // A synthetic historical archive, kept independent of the current-generation horses.
  for (let year = 1; year <= 20; year++) for (const r of w.races) {
    const turn = (year - 1) * 24 + (r.month - 1) * 2 + r.half - 1, oid = `${year}:${r.id}`;
    occurrences.push({ id: oid, raceId: r.id, race: W.engineRace(w, r), year, turn, name: r.name, raceClass: r.raceClass, count: 16, status: "completed" });
    for (let i = 0; i < 16; i++) {
      const h = w.horses[(turn * 17 + i) % w.horses.length];
      performances.push({ id: `${oid}:${h.id}`, occurrenceId: oid, horseId: h.id, raceId: r.id, year, turn, horseName: h.name, rank: i + 1, total: 100 - i, tf: 110 - i, manualRating: null, prize: i < 5 ? r.prizes[i] : 0 });
    }
  }
  try {
    await store.acquire(w.id); const began = performance.now();
    await store.commitChanges(null, { world: w, occurrences, performances }); const saved = performance.now();
    const results = await store.query("occurrences", w.id, { reverse: true }); const queried = performance.now();
    assert.equal(results.rows.length, 50); assert.equal(results.rows[0].year, 20); assert.equal(results.more, true);
    assert.ok(results.rows.every((r, i, rows) => i === 0 || rows[i - 1].turn >= r.turn));
    const loaded = await store.load(w.id); assert.equal(loaded.horses.length, 1000);
    const out = W.advanceHalfMonth(loaded); await store.commitChanges(loaded, out, { checkpoint: "turn" });
    const recovered = await store.restore(out.world, `turn:${loaded.revision}`); assert.equal(recovered.turn, 480); assert.equal(recovered.rngState, loaded.rngState);
    const snapshot = await store.exportWorld(w.id); store.validateSnapshot(snapshot);
    assert.equal(snapshot.records.performances.length, 51840);
    t.diagnostic(`1000 active / 20 years / 51840 performances: save ${(saved - began).toFixed(0)} ms; newest 50 query ${(queried - saved).toFixed(0)} ms; export ${(JSON.stringify(snapshot).length / 1024 / 1024).toFixed(1)} MiB`);
  } finally { await store.close(); }
});
