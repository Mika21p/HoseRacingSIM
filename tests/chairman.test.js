const test = require("node:test");
const assert = require("node:assert/strict");
const { loadChairmanRules } = require("./helpers/project-loader");
const { rules: ns } = loadChairmanRules();
const W = ns.ChairmanRules, C = ns.ChairmanCSV;
const plain = (v) => JSON.parse(JSON.stringify(v));
test("legacy simulation matches the pre-chairman deterministic baseline", () => {
  const vm = require("node:vm"), crypto = require("node:crypto"), project = loadChairmanRules();
  let state = 123456;
  project.context.testRandom = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  vm.runInContext("Math.random = testRandom", project.context);
  const r = project.rules, results = [];
  for (const id of ["japan-cup", "takamatsunomiya-kinen", "kentucky-derby"]) {
    const horse = r.HorseRules.generateHorse({ gameMode: "normal" }), race = r.RaceRegistry.all().find((v) => v.id === id);
    results.push(r.RaceRules.simulateRace(horse, race, { currentTime: r.TimeRules.fromIndex(r.TimeRules.toIndex(3, 6, 1)) }));
  }
  assert.equal(crypto.createHash("sha256").update(JSON.stringify(results)).digest("hex"), "e739745633f8de9d8d846701580219e91d875f8075e7c17721090dfeb0fd2bb3");
});
function make(count = 36) { return W.createWorld({ id: "test-world", seed: 37119, horseCount: count }); }
test("chairman preset preserves source races and balanced generations", () => {
  const w = make(300);
  assert.equal(w.races.length, 162);
  for (const region of W.REGIONS) for (const age of [2, 3, 4, 5]) assert.equal(w.horses.filter((h) => h.homeRegion === region && W.ageOf(w, h) === age).length, 25);
  for (const r of w.races.filter((r) => r.sourceId)) {
    const original = ns.RaceRegistry.all().find((v) => v.id === r.sourceId);
    for (const key of ["month", "half", "surface", "distance"]) assert.equal(r[key], original[key]);
  }
  assert.ok(w.horses.every((h) => !h.fatherId && !h.motherId)); W.validateWorld(w);
});
test("seeded turns are repeatable without mutating the input or leaking the random source", () => {
  const w = make(), before = JSON.stringify(w), a = W.advanceHalfMonth(w), b = W.advanceHalfMonth(w);
  assert.deepEqual(plain(a), plain(b)); assert.equal(JSON.stringify(w), before);
  const source = ns.Random.seeded(42), prefix = [source(), source()], state = source.state();
  const second = ns.Random.seeded(state); assert.equal(source(), second()); assert.notEqual(prefix[0], prefix[1]);
  assert.throws(() => ns.Random.withSource(() => .1, () => { throw Error("unwind"); }));
  assert.notEqual(ns.Random.next(), .1);
});
test("16 and 24 real runners produce all ranks, unique jockeys and one shared TF float", () => {
  const w = make(24), race = W.engineRace(w, w.races.find((r) => r.raceClass === "g1"));
  for (const n of [16, 24]) {
    const result = ns.Random.withSource(ns.Random.seeded(99), () => ns.RaceRules.simulateWorldRace(w.horses.slice(0, n).map((h, i) => ({ horse: h, time: W.timeFor(w, h), jockey: { id: `j-${i}`, name: "骑手", ability: 60 } })), race));
    assert.equal(result.results.length, n);
    const completed = result.results.filter((r) => !r.retired);
    assert.deepEqual(plain(completed.map((r) => r.rank)), Array.from({ length: completed.length }, (_, i) => i + 1));
    assert.ok(completed.every((r) => r.tf - r.total - 10 === result.tfFloat));
    assert.ok(result.results.filter((r) => r.retired).every((r) => r.tf === null && r.rank === null));
    assert.ok(result.results.some((r) => r.pressure >= 3 && r.pressure <= 8));
  }
});
test("all runner phases preserve ties and separately mark withdrawals", () => {
  const w = make(2), h = w.horses[0], race = W.engineRace(w, w.races[0]);
  const runners = ["one", "two"].map((id) => ({ horse: { ...h, id }, time: W.timeFor(w, h), jockey: { id, name: id, ability: 50 } }));
  const tie = ns.Random.withSource(() => .5, () => ns.RaceRules.simulateWorldRace(runners, race));
  assert.equal(tie.results[0].total, tie.results[1].total); assert.deepEqual(plain(tie.results.map((r) => r.rank)), [1, 2]);
  const allOut = ns.Random.withSource(() => 0, () => ns.RaceRules.simulateWorldRace(runners, race));
  assert.ok(allOut.results.every((r) => r.retired && r.tf === null));
});
test("60 floors are disabled only with the explicit new-mode option", () => {
  const w = make(1), h = { ...w.horses[0], strength: 62, peakStart: "五岁夏", peakEnd: "七岁冬", grass: { 日本: "G" }, courseGrades: { 东京: "B" }, distMin: 3000, distMax: 3200, coreDist: 3000 };
  const race = { distance: 1000, surface: "草地", surfaceRegion: "日本", course: "东京" };
  const opts = { currentTime: W.timeFor(w, h), temperamentMod: { mod: 0 }, trackCondition: "良" };
  assert.equal(ns.HorseRules.calcRaceAbility(h, race, opts).ability, 60);
  assert.ok(ns.HorseRules.calcRaceAbility(h, race, { ...opts, noAbilityFloor: true }).ability < 60);
  assert.equal(ns.MaturityRules.evaluate(h, opts.currentTime, 0).adjustedStrength, 60);
  assert.ok(ns.MaturityRules.evaluate(h, opts.currentTime, 0, { noAbilityFloor: true }).adjustedStrength < 60);
});
test("AI ignores hidden adaptations, respects rest, distance in time and field capacity", () => {
  const w = make(300), other = W.clone(w);
  other.horses.forEach((h) => { h.strength = 1; h.grass = { 日本: "G", 香港: "G", 美国: "G", 欧洲: "G", 其他: "G" }; h.distMin = 9000; h.distMax = 10000; h.peakStart = "七岁春"; });
  W.seeded(w, () => W.planEntries(w)); W.seeded(other, () => W.planEntries(other));
  assert.deepEqual(plain(w.horses.map((h) => h.booked)), plain(other.horses.map((h) => h.booked)));
  const counts = new Map();
  for (const h of w.horses) if (h.booked) { const key = `${h.booked.turn}:${h.booked.raceId}`; counts.set(key, (counts.get(key) || 0) + 1); assert.ok(h.booked.turn < w.turn + 6); const race = w.races.find((r) => r.id === h.booked.raceId); assert.ok(counts.get(key) <= race.capacity); }
  w.horses[0].restUntil = 99; W.seeded(w, () => W.planEntries(w)); assert.equal(w.horses[0].booked, null);
  const out = W.advanceHalfMonth(w);
  for (const h of out.world.horses) if (h.lastRaceTurn === 0 && h.booked) assert.ok(h.booked.turn >= 3);
  for (const race of out.occurrences) { const rows = out.performances.filter((p) => p.occurrenceId === race.id); assert.equal(new Set(rows.map((p) => p.jockeyId)).size, rows.length); }
});
test("rescheduled recurring races occur only once per year and single entrants cancel", () => {
  let w = make(1), target = w.races.find((r) => r.month === 1 && r.half === 1);
  let out = W.advanceHalfMonth(w); assert.ok(out.occurrences.every((r) => r.status === "cancelled")); assert.equal(out.performances.length, 0);
  w = W.edit(out.world, "race", { id: target.id, month: 1, half: 2 }).world;
  out = W.advanceHalfMonth(w); assert.ok(!out.occurrences.some((r) => r.raceId === target.id));
  w = out.world;
  while (w.phase !== "yearEnd") w = W.advanceHalfMonth(w).world;
  w.settings.annualNewHorses = 0; w = W.finishYear(w).world;
  w = W.advanceHalfMonth(w).world; out = W.advanceHalfMonth(w);
  assert.ok(out.occurrences.some((r) => r.raceId === target.id && r.year === 2));
});
test("manual yearly WTR stays authoritative, zero is not blank and archives stay separate", () => {
  const w = make(36), out = W.advanceHalfMonth(w), p = out.performances.find((r) => !r.retired), hid = p.horseId;
  let world = W.edit(out.world, "wtr", { id: hid, score: 0 }).world;
  const scored = W.scorePerformance(world, p, 155, out.performances.filter((r) => r.horseId === hid));
  world = scored.world; const h = world.horses.find((v) => v.id === hid);
  assert.equal(W.rating(h), 0); assert.equal(h.annual.suggested, 155); assert.equal(scored.performances[0].rank, p.rank);
  world = W.edit(world, "wtr", { id: hid, score: null }).world; assert.equal(W.rating(world.horses.find((v) => v.id === hid)), 155);
  world.turn = 23; world.phase = "yearEnd"; world.settings.annualNewHorses = 0;
  world.awardsStrict = false; world.awardDraft.representative = hid;
  const archived = W.finishYear(world); assert.equal(archived.awards[0].horseId, hid); assert.equal(archived.ratings.find((r) => r.horseId === hid).wtr, 155);
  assert.equal(archived.world.horses.find((v) => v.id === hid).annual.tf, null);
  assert.throws(() => W.finishYear(archived.world)); assert.equal(archived.world.turn, 24);
});
test("CSV round trips all supported custom attributes, quotes, BOM and multiline names", () => {
  let w = make(0); w = W.edit(w, "horse", { name: '测试,"换行\n第二行', origin: "custom" }).world;
  for (const kind of ["horse", "race"]) {
    const text = C.exportRows(w, kind), preview = C.preview(w, kind, text, { mode: "update" });
    assert.deepEqual(plain(preview.errors), []); assert.ok(preview.updated > 0);
    const collection = kind === "horse" ? "horses" : "races";
    for (const field of C.schema(kind).filter((f) => f.key !== "trackName")) for (let i = 0; i < w[collection].length; i++) {
      const get = (o) => field.key.split(".").reduce((a, k) => a && a[k], o);
      assert.deepEqual(plain(get(preview.output.world[collection][i]) ?? null), plain(get(w[collection][i]) ?? null), field.key);
    }
  }
  assert.equal(C.parse('\ufeffa,b\r\n"a,""b""",c\r\n')[1].values[0], 'a,"b"');
  assert.throws(() => C.parse('a,"bad'));
});
test("CSV updates preserve blanks, reject malformed batches and never export AI attributes", () => {
  let w = make(2); w = W.edit(w, "horse", { name: "自建" }).world; const custom = w.horses.at(-1);
  const before = JSON.stringify(w);
  let result = C.preview(w, "horse", `模板版本,编号,马名,基础能力\n1,${custom.id},,\n`, { mode: "update" });
  assert.equal(result.errors.length, 0); assert.equal(result.output.world.horses.at(-1).strength, custom.strength);
  result = C.preview(w, "horse", `模板版本,编号,马名,基础能力\n1,${custom.id},更名,99\n1,new,坏数据,abc`, { mode: "update" });
  assert.equal(result.output, null); assert.ok(result.errors[0].includes("第3行")); assert.equal(JSON.stringify(w), before);
  result = C.preview(w, "horse", `模板版本,编号,马名\n1,a,A\n1,a,B`, {}); assert.equal(result.output, null);
  result = C.preview(w, "race", '模板版本,比赛名,马场,半月\n1,新赛,不存在,1周'); assert.equal(result.output, null);
  assert.equal(C.parse(C.exportRows(w, "horse")).length, 2);
  assert.ok(!C.exportRows(w, "horse").includes(w.horses[0].name));
  result = C.preview(w, "horse", `模板版本,编号,马名\n1,${w.horses[0].id},作弊`, { mode: "update" }); assert.equal(result.output, null);
});
test("overseas preparation locks this occurrence while later editions remain editable", () => {
  let w = make(2); w.races.forEach((r) => { r.deleted = true; });
  const r = w.races.find((r) => w.tracks.find((t) => t.id === r.trackId).region === "欧洲");
  Object.assign(r, { deleted: false, month: 1, half: 2, ageRule: "2+", sexRule: "all", distance: 1600 });
  w.horses.forEach((h) => { h.homeRegion = "日本"; h.locationRegion = "日本"; h.booked = null; });
  W.seeded(w, () => W.planEntries(w)); assert.ok(w.horses.every((h) => h.booked && h.booked.turn === 1 && h.booked.preparationTurn === 0));
  w = W.advanceHalfMonth(w).world; assert.ok(w.horses.every((h) => h.locationRegion === "欧洲"));
  w = W.edit(w, "race", { id: r.id, distance: 3000 }).world;
  const out = W.advanceHalfMonth(w); assert.equal(out.occurrences.find((v) => v.raceId === r.id).race.distance, 1600);
  assert.equal(out.world.races.find((v) => v.id === r.id).distance, 3000);
});
test("CSV explicit clears, mapping and formula-safe strings survive round trips", () => {
  let w = make(0); w = W.edit(w, "horse", { name: "'=原本的名字", owner: "=马主" }).world;
  const h = w.horses.at(-1); const csv = C.exportRows(w, "horse");
  let p = C.preview(w, "horse", csv, { mode: "update" }); assert.equal(p.errors.length, 0); assert.equal(p.output.world.horses[0].name, h.name); assert.equal(p.output.world.horses[0].owner, h.owner);
  p = C.preview(w, "horse", `模板版本,编号,马名,马主\n1,${h.id},,#CLEAR`, { mode: "update" }); assert.equal(p.output.world.horses[0].owner, "");
  p = C.preview(w, "race", '模板版本,比赛名,马场,半月\n1,映射赛,别人的赛场,上半月', { trackMappings: { 别人的赛场: w.tracks[0].id } });
  assert.equal(p.errors.length, 0); assert.equal(p.output.world.races.find((r) => r.name === "映射赛").trackId, w.tracks[0].id);
});
