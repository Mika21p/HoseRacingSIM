const test = require("node:test");
const assert = require("node:assert/strict");
const { loadEraRules } = require("./helpers/project-loader");
const plain = (x) => JSON.parse(JSON.stringify(x));
test("two classic wins generate expectation but a lost crown never restores it", () => {
  const n = loadEraRules().rules, s = n.EraRules.scenarioFor();
  const events = [{ type: "race-result", raceId: s.goals.classics[0], rank: 1, grade: "G1" }, { type: "race-result", raceId: s.goals.classics[1], rank: 1, grade: "G1" }];
  assert.ok(n.EraNarrative.summarize(events, s).tags.includes("triple-crown-candidate"));
  events[0].rank = 2;
  const summary = n.EraNarrative.summarize(events, s);
  assert.ok(summary.tags.includes("crown-lost")); assert.ok(!summary.tags.includes("triple-crown-candidate"));
});
test("storylets reject unknown conditions and effects", () => {
  const n = loadEraRules().rules; n.EraStoryletData.push({ id: "invalid", textId: "jp.era.1998.scene.opening", when: { arbitrary: true }, choices: [{ effects: [{ type: "give-win" }] }] });
  assert.equal(n.EraStorylets.validate().length, 2);
});
test("report text and evidence snapshot remain immutable after later events", () => {
  const n = loadEraRules().rules, r = n.EraRules.createRun({ seed: 1, horseName: "初名" });
  n.EraNews.add(r, "result", { id: "race-1", date: r.date, raceName: "测试赛", rank: 1 }); const before = plain(r.news[0]);
  r.career.horse.name = "后名"; r.summary.wins = 100;
  assert.deepEqual(plain(r.news[0]), before);
  assert.equal(n.EraTextIndex.replaceOnce("{{PLAYER_HORSE_NAME}}", { PLAYER_HORSE_NAME: "{{WINNER_NAME}}" }), "{{WINNER_NAME}}");
});

test("historical starter metadata never rewrites stored news snapshots", () => {
  const n = loadEraRules().rules, r = n.EraRules.createRun({ seed: 44, horseName: "快照马" });
  const raceId = "1999-japan-cup", e = n.EraAlmanac.race(raceId);
  const item = n.EraNews.add(r, "historical", { raceId, date: e.date }, { template: n.EraNewsTemplates.list().find(t => t.id === "historical.g1") });
  const before = plain(item);
  assert.equal(item.tokensSnapshot.HEADCOUNT, 14);
  e.starterCount = null;
  r.events.push({ type: "time-advanced", date: "1999-12-01" });
  const restored = n.EraRules.normalizeSave(plain(r));
  assert.deepEqual(plain(restored.news.find(x => x.id === item.id)), before);
});
