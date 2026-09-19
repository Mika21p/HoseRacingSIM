const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm"), fs = require("node:fs"), path = require("node:path");
const { IDBFactory, IDBKeyRange } = require("fake-indexeddb");
const { loadChairmanRules, projectRoot } = require("./helpers/project-loader");
async function setup() {
  const p = loadChairmanRules();
  Object.assign(p.context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  vm.runInContext(fs.readFileSync(path.join(projectRoot, "js/chairman-storage.js"), "utf8"), p.context);
  const store = await p.rules.ChairmanStorage.open(), W = p.rules.ChairmanRules;
  const world = W.createWorld({ seed: 778, horseCount: 24 }); await store.acquire(world.id); await store.commitChanges(null, { world });
  return { ...p, W, store, world };
}
test("IndexedDB aborts atomically; repeat submissions cannot double settle", async () => {
  const { W, store, world } = await setup();
  try {
    const out = W.advanceHalfMonth(world);
    await assert.rejects(store.commitChanges(world, out, { failForTest: true }), /事务中断/);
    assert.equal((await store.load(world.id)).turn, 0); assert.equal((await store.query("performances", world.id)).rows.length, 0);
    await store.commitChanges(world, out, { checkpoint: "turn" });
    await assert.rejects(store.commitChanges(world, out), /已被更新/);
    const loaded = await store.load(world.id); assert.equal(loaded.rngState, out.world.rngState); assert.equal(loaded.revision, 1);
    assert.equal((await store.query("performances", world.id)).rows.length, out.performances.length);
  } finally { await store.close(); }
});
test("recovery rolls back history and horse stats together and replays the same outcome", async () => {
  const { W, store, world } = await setup();
  try {
    const first = W.advanceHalfMonth(world); await store.commitChanges(world, first, { checkpoint: "turn" });
    const second = W.advanceHalfMonth(first.world); await store.commitChanges(first.world, second, { checkpoint: "turn" });
    const loaded = await store.restore(second.world, "turn:0");
    assert.equal(loaded.turn, 0); assert.equal(loaded.rngState, world.rngState); assert.equal((await store.query("occurrences", world.id)).rows.length, 0);
    assert.deepEqual(JSON.parse(JSON.stringify(W.advanceHalfMonth(loaded).performances)), JSON.parse(JSON.stringify(first.performances)));
  } finally { await store.close(); }
});
test("snapshot and slot imports fork worlds, validate references first and retain original", async () => {
  const { W, store, world } = await setup();
  try {
    const out = W.advanceHalfMonth(world); await store.commitChanges(world, out); await store.saveSlot(world.id, 1);
    const snapshot = await store.exportWorld(world.id); assert.equal(snapshot.records.performances.length, out.performances.length);
    const invalid = W.clone(snapshot); invalid.records.performances[0].horseId = "missing";
    await assert.rejects(store.importWorld(invalid), /不存在/); assert.equal(store.worldId, world.id);
    const loaded = await store.loadSlot(1); assert.notEqual(loaded.id, world.id); assert.equal(loaded.rngState, out.world.rngState);
    assert.equal((await store.query("performances", loaded.id)).rows.length, out.performances.length);
    assert.equal((await store.load(world.id)).turn, 1);
  } finally { await store.close(); }
});
test("only one page may write; expired stale revisions cannot overwrite a restored world", async () => {
  const { rules, store, world, W } = await setup(); const other = await rules.ChairmanStorage.open();
  try {
    assert.equal(await other.acquire(world.id), false);
    await assert.rejects(other.commitChanges(world, W.advanceHalfMonth(world)), /其他页面/);
    await store.release(); assert.equal(await other.acquire(world.id), true);
    await other.commitChanges(world, W.advanceHalfMonth(world)); assert.equal(await store.acquire(world.id), false);
  } finally { await other.close(); await store.close(); }
});
test("checkpoint retention keeps three turns and one year boundary", async () => {
  const { store, W, world } = await setup(); let w = world;
  try {
    for (let i = 0; i < 6; i++) { const out = W.advanceHalfMonth(w); await store.commitChanges(w, out, { checkpoint: i === 0 ? "year" : "turn" }); w = out.world; }
    const points = (await store.query("checkpoints", w.id)).rows;
    assert.equal(points.filter((p) => p.kind === "turn").length, 3); assert.equal(points.filter((p) => p.kind === "year").length, 1);
  } finally { await store.close(); }
});
test("synchronous data clone failure aborts prior writes and keeps the previous complete world", async () => {
  const { store, W, world } = await setup();
  try {
    const out = W.advanceHalfMonth(world); out.world.horses.at(-1).invalidValue = () => {};
    await assert.rejects(store.commitChanges(world, out));
    assert.equal((await store.load(world.id)).turn, world.turn);
    assert.equal((await store.query("occurrences", world.id)).rows.length, 0);
  } finally { await store.close(); }
});
