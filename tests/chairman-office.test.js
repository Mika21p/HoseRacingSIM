const test = require("node:test"), assert = require("node:assert/strict");
const vm = require("node:vm"), fs = require("node:fs"), path = require("node:path");
const { IDBFactory, IDBKeyRange } = require("fake-indexeddb");
const { loadChairmanRules, projectRoot } = require("./helpers/project-loader");
const plain = (value) => JSON.parse(JSON.stringify(value));
function read(file) { return fs.readFileSync(path.join(projectRoot, file), "utf8"); }
async function setup() {
  const p = loadChairmanRules(); Object.assign(p.context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  for (const file of ["js/chairman-storage.js", "js/chairman-history.js"]) vm.runInContext(read(file), p.context);
  const W = p.rules.ChairmanRules, O = p.rules.ChairmanOffice, store = await p.rules.ChairmanStorage.open();
  let world = W.createWorld({ seed: 775, horseCount: 24 }); world.races.filter(r=>r.month===1 && r.half===1).forEach(r=>{r.raceClass="g3";r.grade="G3";}); W.planEntries(world); await store.acquire(world.id); await store.commitChanges(null, { world });
  const out = W.advanceHalfMonth(world); await store.commitChanges(world, out, { checkpoint: "turn" }); world = out.world;
  const race = out.occurrences.find((r) => r.count >= 2), rows = out.performances.filter((r) => r.occurrenceId === race.id);
  return { ...p, W, O, store, world, race, rows };
}
test("whole-race drafts are separate, atomic scores preserve annual overrides and reset preserves facts", async () => {
  const { store, W, world: original, race, rows } = await setup(); let world = original;
  try {
    const h = world.horses.find((h) => h.id === rows[0].horseId); h.annual.manual = 50;
    const values = { [rows[0].id]: "0", [rows[1].id]: "140" }, rng = world.rngState, prizes = rows.map((r) => r.prize);
    let out = await store.draftOutput(world, race.id, values); await store.commitChanges(world, out); world = out.world;
    assert.equal((await store.get("performances", world.id, rows[0].id)).manualRating, null);
    out = await store.scoreOutput(world, race.id, values); await assert.rejects(store.commitChanges(world, out, { failForTest: true }));
    assert.ok(await store.get("scoreDrafts", world.id, race.id)); assert.equal((await store.query("revisions", world.id)).rows.length, 0);
    await store.commitChanges(world, out); world = out.world;
    assert.equal(world.horses.find((h) => h.id === rows[0].horseId).annual.manual, 50);
    assert.equal((await store.get("performances", world.id, rows[0].id)).manualRating, 0);
    assert.equal(await store.get("scoreDrafts", world.id, race.id), undefined);
    out = await store.scoreOutput(world, race.id, {}, true); await store.commitChanges(world, out); world = out.world;
    assert.equal(world.rngState, rng); assert.equal((await store.get("occurrences", world.id, race.id)).scoring, "none");
    assert.deepEqual((await store.query("performances", world.id, { occurrenceId: race.id })).rows.map((r) => r.prize), prizes);
    assert.ok((await store.query("revisions", world.id)).rows.length >= 4);
  } finally { await store.close(); }
});
test("historical annual editing updates only its year and new-entry fallback, never booking or TF", () => {
  const { rules } = loadChairmanRules(), W = rules.ChairmanRules, O = rules.ChairmanOffice;
  const w = W.createWorld({ seed: 41, horseCount: 12 }); w.turn = 24;
  const h = w.horses[0], booked = plain(h.booked), old = { id: `1:${h.id}`, horseId: h.id, year: 1, manual: 128, suggested: 135, tf: 139, wtr: 128 };
  const out = O.annualScore(w, h.id, 1, 0, old);
  assert.equal(out.ratings[0].wtr, 0); assert.equal(out.ratings[0].tf, 139); assert.equal(out.world.horses[0].previousWtr, 0);
  assert.deepEqual(plain(out.world.horses[0].booked), booked); assert.equal(out.world.rngState, w.rngState);
  const restored = O.annualScore(out.world, h.id, 1, "", out.ratings[0]); assert.equal(restored.ratings[0].wtr, 135);
  assert.throws(() => O.annualScore(w, h.id, 0, 120, null), /年度档案/);
});
test("ranked archive filters before paging and preserves tied ranks across a page boundary", async () => {
  const { store, W, world } = await setup();
  try {
    const h = world.horses[0], ratings = Array.from({ length: 121 }, (_, i) => ({ id: `${i + 1}:${h.id}`, year: i + 1, horseId: h.id,
      horseName: h.name, age: i < 61 ? 2 : 4, gender: h.gender, homeRegion: i < 61 ? "日本" : "欧洲", wtr: i < 61 ? 130 : 140,
      tf: 140, prize: 1, starts: 1, wins: 1, g1: 1, suggested: 130, manual: null }));
    const out = W.mutate(world, (w, out) => { out.ratings = ratings; }); await store.commitChanges(world, out);
    const p1 = await store.board(out.world, "history", { age: "2", region: "日本" }, 0, true);
    const p2 = await store.board(out.world, "history", { age: "2", region: "日本" }, 50, true);
    assert.equal(p1.total, 61); assert.equal(p1.rows.length, 50); assert.equal(p2.rows.length, 11); assert.ok(p2.rows.every((r) => r.rank === 1));
    assert.equal(new Set([...p1.rows, ...p2.rows].map((r) => r.id)).size, 61);
    const clamped = await store.board(out.world, "history", { age: "2" }, 999, true); assert.equal(clamped.offset, 50);
  } finally { await store.close(); }
});
test("result order is global before pagination; hiding does not alter horse facts or archives", async () => {
  const { store, W, world, race } = await setup();
  try {
    const out = W.mutate(world, (w, out) => { out.occurrences = Array.from({ length: 65 }, (_, i) => ({ ...race, id: `test-${i}`, turn: 2, raceClass: i < 60 ? "op" : "g1", name: `赛事${String(i).padStart(2, "0")}` })); });
    await store.commitChanges(world, out); const before = plain(out.world.horses);
    const page = await store.historyPage(out.world, {}, 0); assert.ok(page.rows.slice(0, 5).every((r) => r.raceClass === "g1"));
    const hidden = await store.visibilityOutput(out.world, [race.id], true); await store.commitChanges(out.world, hidden);
    assert.deepEqual(plain(hidden.world.horses), before);
    assert.equal((await store.historyPage(hidden.world, { hidden: "only" }, 0)).rows[0].id, race.id);
    assert.ok((await store.query("performances", world.id, { occurrenceId: race.id })).rows.length > 0);
    const reveal = await store.visibilityOutput(hidden.world, [race.id], false); await store.commitChanges(hidden.world, reveal);
    assert.equal((await store.historyPage(reveal.world, { hidden: "only" }, 0)).total, 0);
  } finally { await store.close(); }
});
test("specialist awards check actual category starts and wins, drafts retain invalid selections", () => {
  const { rules } = loadChairmanRules(), W = rules.ChairmanRules;
  const w = W.createWorld({ seed: 34, horseCount: 12 }); const h = w.horses[0];
  h.annual.starts = 3; h.annual.g1 = 1; h.annual.runs = [{ id: "run", distance: 2400, surface: "草地", raceClass: "g1", rank: 1 }];
  assert.equal(W.AWARDS.length, 12);
  for (const id of ["middle", "long", "turf"]) assert.equal(W.awardEligible(w, h, W.AWARDS.find((a) => a.id === id), true), true);
  assert.equal(W.awardEligible(w, h, W.AWARDS.find((a) => a.id === "sprint"), true), false);
  h.annual.runs.push({ id: "run2", distance: 1200, surface: "泥地", raceClass: "op", rank: 5 });
  assert.equal(W.awardEligible(w, h, W.AWARDS.find((a) => a.id === "dirt"), false), true);
  const draft = W.edit(w, "awards", { strict: true, draft: { dirt: h.id } }); assert.equal(draft.world.awardDraft.dirt, h.id);
  draft.world.turn = 23; draft.world.phase = "yearEnd"; assert.throws(() => W.finishYear(draft.world), /候选不符合/);
  draft.world.awardDraft = { middle: h.id }; draft.world.awardDetails = { middle: { comment: "经典一战", representative: "run" } };
  const next = W.finishYear(draft.world); assert.equal(next.awards[0].comment, "经典一战"); assert.equal(next.awards[0].representative, "run");
  assert.throws(() => W.finishYear(next.world), /年末/);
});
test("new drafts and revisions survive export and slots and are removed by recovery boundary", async () => {
  const { store, world: before, race, rows } = await setup(); let w = before;
  try {
    const out = await store.draftOutput(w, race.id, { [rows[0].id]: "132" }); await store.commitChanges(w, out); w = out.world;
    const snapshot = await store.exportWorld(w.id); store.validateSnapshot(snapshot); assert.equal(snapshot.version, 6); assert.equal(snapshot.records.scoreDrafts.length, 1);
    await store.saveSlot(w.id, 1); const fork = await store.loadSlot(1, true); assert.equal((await store.get("scoreDrafts", fork.id, race.id)).values[rows[0].id], "132");
    await store.acquire(w.id); const recovered = await store.restore(w, "turn:0"); assert.equal(recovered.turn, 0);
    assert.equal((await store.query("scoreDrafts", recovered.id)).rows.length, 0); assert.equal((await store.query("revisions", recovered.id)).rows.length, 0);
  } finally { await store.close(); }
});
test("version-one snapshot backfills observed annual starts and historical region without inventing data", async () => {
  const { store, W, world, rows } = await setup();
  try {
    const snapshot = await store.exportWorld(world.id); snapshot.version = 1; delete snapshot.records.scoreDrafts; delete snapshot.records.revisions;
    snapshot.world.horses.forEach((h) => delete h.annual.runs);
    const p = rows[0]; snapshot.records.ratings.push({ id: `1:${p.horseId}`, year: 1, horseId: p.horseId, horseName: p.horseName, wtr: 120, suggested: 120, tf: 120, manual: null });
    const copied = await store.importWorld(snapshot); assert.ok(copied.horses.find((h) => h.id === p.horseId).annual.runs.length);
    assert.equal((await store.get("ratings", copied.id, `1:${p.horseId}`)).homeRegion, p.homeRegion);
    const altered = W.clone(snapshot); altered.records.performances.forEach((p) => delete p.homeRegion); const unknown = await store.importWorld(altered);
    assert.equal((await store.get("ratings", unknown.id, `1:${p.horseId}`)).homeRegion, "未记录");
  } finally { await store.close(); }
});
test("background CSV worker matches foreground preview and keeps original random state", () => {
  const { rules } = loadChairmanRules(), W = rules.ChairmanRules, w = W.createWorld({ seed: 874, horseCount: 12 });
  const csv = rules.ChairmanCSV.template(w, "horse"), messages = [], self = { postMessage: (m) => messages.push(m) };
  const context = vm.createContext({ self, console });
  context.importScripts = (...files) => files.forEach((f) => vm.runInContext(read(`js/${f}`), context));
  vm.runInContext(read("js/chairman-worker.js"), context);
  self.onmessage({ data: { kind: "csv", payload: { world: plain(w), kind: "horse", text: csv } } });
  assert.equal(messages.at(-1).error, undefined); const result = messages.at(-1).result;
  assert.deepEqual(plain(result.output), plain(rules.ChairmanCSV.preview(w, "horse", csv).output));
});
test("historic query block boundaries do not omit equal ratings or filtered records", async () => {
  const { store, W, world } = await setup();
  try {
    const h = world.horses[0], out = W.mutate(world, (w, out) => { out.ratings = Array.from({ length: 600 }, (_, i) => ({ id: `${i + 1}:${h.id}`, horseId: h.id,
      horseName: h.name, year: i + 1, age: 2, gender: h.gender, wtr: 130, prize: i % 2, starts: 1, wins: 0, g1: 0 })); });
    await store.commitChanges(world, out);
    const result = await store.board(out.world, "history", {}, 550, true);
    assert.equal(result.total, 600); assert.equal(result.rows.length, 50); assert.equal(result.more, false); assert.ok(result.rows.every((r) => r.rank === 1));
  } finally { await store.close(); }
});

test("lifetime prize filtering uses highest historical WTR, including after retirement", async () => {
  const { store, W, world } = await setup();
  try {
    const h = world.horses.find((h) => h.lifetime.starts > 0);
    const out = W.mutate(world, (w, out) => {
      const horse = w.horses.find((row) => row.id === h.id); horse.status = "retired"; horse.annual.manual = 0;
      out.ratings = [{ id: `1:${h.id}`, horseId: h.id, year: 1, horseName: h.name, wtr: 140, prize: 10 }];
    });
    await store.commitChanges(world, out);
    const page = await store.board(out.world, "lifetime", { search: h.name, minimum: 135 }, 0, true);
    assert.equal(page.total, 1); assert.equal(page.rows[0].bestWtr, 140);
    assert.equal((await store.board(out.world, "current", { search: h.name, minimum: 135 }, 0, true)).total, 0);
  } finally { await store.close(); }
});
test("database v2 migration preserves old journal and normalizes rating and result indexes", async () => {
  const p = loadChairmanRules(), W = p.rules.ChairmanRules;
  Object.assign(p.context.window, { indexedDB: new IDBFactory(), IDBKeyRange, setInterval, clearInterval });
  let legacy = read("js/chairman-storage.js").replace('"awards", "scoreDrafts", "revisions", "breedingEvents", "breedingYears"', '"awards"').replace(', "pedigrees"', '').replace('indexedDB.open(DB_NAME, 7)', 'indexedDB.open(DB_NAME, 2)');
  const start = legacy.indexOf('        if (event.oldVersion < 3)'), end = legacy.indexOf('      req.onsuccess = () => { const db', start);
  assert.ok(start > 0 && end > start); legacy = legacy.slice(0, start) + "      };\n" + legacy.slice(end);
  vm.runInContext(legacy, p.context); let store = await p.rules.ChairmanStorage.open();
  const world = W.createWorld({ id: 'v2-upgrade', seed: 5, horseCount: 12 }); await store.acquire(world.id); await store.commitChanges(null, { world });
  const out = W.advanceHalfMonth(world); await store.commitChanges(world, out, { checkpoint: 'turn' }); await store.close();
  for (const file of ['js/chairman-storage.js', 'js/chairman-history.js']) vm.runInContext(read(file), p.context);
  store = await p.rules.ChairmanStorage.open();
  try {
    assert.equal(store.db.version, 7); const loaded = await store.load(world.id); assert.equal(loaded.rngState, out.world.rngState);
    assert.ok((await store.query("occurrences",loaded.id)).rows.length > 0); await store.acquire(world.id);
    const restored = await store.restore(loaded, 'turn:0'); assert.equal(restored.turn, 0); assert.equal(restored.rngState, world.rngState);
    assert.equal((await store.query('scoreDrafts', world.id)).rows.length, 0);
  } finally { await store.close(); }
});
test("draft import rejects cross-race references and second page cannot save draft edits", async () => {
  const { store, rules, world, rows, race } = await setup(); const other = await rules.ChairmanStorage.open();
  try {
    assert.equal(await other.acquire(world.id), false);
    const out = await other.draftOutput(world, race.id, { [rows[0].id]: '133' }); await assert.rejects(other.commitChanges(world, out), /其他页面/);
    const snapshot = await store.exportWorld(world.id), different = snapshot.records.occurrences.find((r) => r.id !== race.id);
    snapshot.records.scoreDrafts = [{ id: different.id, year: race.year, values: { [rows[0].id]: '133' } }];
    assert.throws(() => store.validateSnapshot(snapshot), /草稿/);
  } finally { await other.close(); await store.close(); }
});
