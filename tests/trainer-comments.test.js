const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");
const { loadEraRules, loadRoguelikeRules, projectRoot } = require("./helpers/project-loader");

const project = loadEraRules();
const n = project.rules;
for (const file of ["js/rules/post-race-comments.js", "js/rules/adaptation-hints.js"]) {
  vm.runInContext(fs.readFileSync(path.join(projectRoot, file), "utf8"), project.context);
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const horse = () => ({ strength: 80, gameMode: "normal", distMin: 1600, distMax: 2400,
  coreDist: 2000, growthType: "普早", temperamentLabel: "普通", peakStart: 6, peakEnd: 36,
  surfaceGrades: { grass: "A", dirt: "G" }, trackAptitudes: { burst: "◎", sustained: "○", attrition: "△" } });
const forced = (h, accuracy) => n.CommentRules.generateDebutCommentDetails(h, "sato-yuta", {
  accuracyById: Object.fromEntries(["strength", "surface", "track", "distance", "growth", "temperament"].map((id) => [id, accuracy]))
});
function raceRecord(h = horse(), type = "burst", intensity = 2, surface = "grass") {
  const profile = { id: "snapshot-test", trackId: "test", surface, distance: 2000, courseConfigId: "standard", type, intensity };
  const aptitude = n.TrackAptitudeRules.calculateModifiers(h, profile);
  return { public: { rank: 2, raceId: "test", raceName: "适性试跑" }, hidden: {
    race: { distance: 2000, surface: surface === "grass" ? "草地" : "泥地" }, schedule: { age: 3 },
    playerCalc: { distancePenalty: 0, surfaceMod: aptitude.surfaceMod, maturity: { status: "成熟期", strengthDelta: 0 },
      trackCondition: "良", heavyMod: 0, ruleVersion: aptitude.ruleVersion, trackAptitude: aptitude, trackAptitudeMod: aptitude.trackAptitudeMod },
    results: [{ entry: { key: "player", ability: 80 }, total: 90 }, { entry: { key: "opponent", ability: 82 }, total: 95 }]
  } };
}
function generate(career, record, mode = "clear") {
  const pick = n.Random.weightedPick;
  n.Random.weightedPick = (items) => items.find((item) => item.id === mode);
  try { return n.PostRaceCommentRules.generate(career, record); } finally { n.Random.weightedPick = pick; }
}

function expectedJudgment(id, grade) {
  return id === "track" && grade === "◎" ? "strong" : ["A", "B", "◎", "○"].includes(grade) ? "suitable" : "unsuitable";
}
for (const accuracy of ["precise", "close", "fuzzy", "unknown", "wrong"]) {
  test(`出道前六项评估：${accuracy} 的覆盖数量与认知边界`, () => {
    const h = horse(), before = JSON.stringify(h), details = forced(h, accuracy);
    assert.deepEqual(plain(details.map((item) => item.id)), ["strength", "surface", "track", "distance", "growth", "temperament"]);
    const hints = n.AdaptationHintRules.createInitial(details);
    for (const id of ["surface", "track"]) {
      const comment = details.find((item) => item.id === id);
      const values = id === "surface" ? h.surfaceGrades : h.trackAptitudes;
      const count = accuracy === "precise" ? Object.keys(values).length : accuracy === "unknown" ? 0 : id === "track" && accuracy === "close" ? 2 : 1;
      assert.equal(comment.claim ? comment.claim.assessments.length : 0, count);
      assert.equal(Object.values(hints[id]).filter((cell) => cell.status !== "unknown").length, count);
      if (accuracy === "unknown") { assert.equal(comment.claim, null); assert.equal(comment.lock, null); continue; }
      const seen = new Set();
      for (const assessment of comment.claim.assessments) {
        assert.ok(!seen.has(assessment.target)); seen.add(assessment.target);
        const truth = expectedJudgment(id, values[assessment.target]);
        if (accuracy === "wrong") {
          assert.notEqual(assessment.judgment, truth);
          assert.notEqual(assessment.judgment === "unsuitable", truth === "unsuitable");
        } else assert.equal(assessment.judgment, truth);
        assert.equal(assessment.grades, undefined);
        assert.equal(hints[id][assessment.target].confidence, "suspected");
      }
      for (const key of Object.keys(values)) if (!seen.has(key)) assert.equal(hints[id][key].status, "unknown");
      assert.doesNotMatch(comment.text, /误判|谬误|真实属性|[◎○△ABCG]|档位|范围是/);
    }
    assert.equal(hints.grass, undefined); assert.equal(hints.dirt, undefined);
    assert.equal(JSON.stringify(h), before);
  });
}

test("草泥只分合适与不合适，基本准确优先合适表面，类型保留三个层次", () => {
  for (const grass of ["A", "B", "C", "G"]) for (const dirt of ["A", "B", "C", "G"]) {
    const h = horse(); h.surfaceGrades = { grass, dirt };
    const precise = forced(h, "precise").find((c) => c.id === "surface");
    for (const a of precise.claim.assessments) assert.equal(a.judgment, expectedJudgment("surface", h.surfaceGrades[a.target]));
    const close = forced(h, "close").find((c) => c.id === "surface").claim.assessments[0];
    const good = [grass, dirt].some((g) => ["A", "B"].includes(g));
    assert.equal(close.judgment, good ? "suitable" : "unsuitable");
  }
  const precise = forced(horse(), "precise");
  assert.deepEqual(plain(precise.find((c) => c.id === "track").claim.assessments.map((a) => a.judgment)), ["strong", "suitable", "unsuitable"]);
  assert.deepEqual(plain(n.CommentRules.buildDebutLock(precise).surfaces), ["草地"]);
  assert.equal(precise.find((c) => c.id === "track").lock, null);
  for (const accuracy of ["fuzzy", "wrong"]) assert.deepEqual(plain(n.CommentRules.buildDebutLock(forced(horse(), accuracy)).surfaces), []);
});

test("误判与模糊共用一项意见的文案和锁定行为，不能从语气识别真假", () => {
  const roll = n.Random.rollRange;
  n.Random.rollRange = () => 0;
  try {
    const wrong = forced(horse(), "wrong");
    const h = horse(); h.surfaceGrades.grass = "G"; h.trackAptitudes.burst = "△";
    const fuzzy = forced(h, "fuzzy");
    for (const id of ["surface", "track"]) {
      const left = wrong.find((c) => c.id === id), right = fuzzy.find((c) => c.id === id);
      assert.equal(left.text, right.text);
      assert.deepEqual(plain(left.claim), plain(right.claim));
      assert.equal(left.lock, right.lock);
    }
  } finally { n.Random.rollRange = roll; }
});

test("练马师概率、传奇加成和赛后分析概率保持原值", () => {
  const pick = n.Random.weightedPick;
  try {
    for (const mode of ["normal", "legend"]) {
      const seen = [];
      n.Random.weightedPick = (items) => { seen.push(plain(items)); return items[0]; };
      n.CommentRules.generateDebutCommentDetails({ ...horse(), gameMode: mode }, "pletcher");
      assert.deepEqual(seen[1].map((v) => v.weight), mode === "normal" ? [15, 25, 40, 15, 5] : [25, 35, 30, 8, 2]);
      assert.deepEqual(seen[2].map((v) => v.weight), mode === "normal" ? [10, 20, 40, 20, 10] : [20, 30, 35, 10, 5]);
      seen.length = 0;
      n.PostRaceCommentRules.generate({ horse: horse(), gameMode: mode }, raceRecord());
      assert.deepEqual(seen[0].map((v) => v.weight), mode === "normal" ? [50, 30, 20] : [70, 20, 10]);
    }
  } finally { n.Random.weightedPick = pick; }
});

test("草泥 C/G 才诊断不合；三类型ⅠⅡ只有 △ 触发类型短板", () => {
  for (const surface of ["grass", "dirt"]) for (const grade of ["A", "B", "C", "G"]) {
    const h = horse(); h.surfaceGrades[surface] = grade;
    const c = generate({ horse: h }, raceRecord(h, "burst", 1, surface));
    assert.equal(c.reason, ["C", "G"].includes(grade) ? "surface_mismatch" : "off_day");
    if (c.target) assert.equal(c.target.item, surface);
  }
  for (const type of ["burst", "sustained", "attrition"]) for (const intensity of [1, 2]) for (const grade of ["◎", "○", "△"]) {
    const h = horse(); h.trackAptitudes[type] = grade;
    const c = generate({ horse: h }, raceRecord(h, type, intensity));
    assert.equal(c.reason, grade === "△" ? "track_mismatch" : "off_day");
    if (c.target) assert.equal(c.target.item, type);
  }
  assert.equal(n.TrackAptitudeRules.SURFACE_MODIFIERS.G, -20);
});

test("胜退简评与无分析不揭示认知；模糊不合不指出目标", () => {
  const h = horse(), record = raceRecord(h, "attrition");
  for (const mode of ["empty", "broad"]) {
    const c = generate({ horse: h }, record, mode);
    assert.equal(c.reason, null); assert.equal(c.target, undefined);
    const career = { horse: h, commentDetails: [], races: [] };
    n.AdaptationHintRules.applyPostRace(career, record, c);
    assert.equal(career.adaptationHints.track.attrition.status, "unknown");
    if (mode === "broad") { assert.match(c.text, /可能|似乎/); assert.doesNotMatch(c.text, /消耗|瞬发|持久|△/); }
  }
  for (const publicResult of [{ rank: 1 }, { rank: 5, retired: true }]) {
    const c = generate({ horse: h }, { ...record, public: publicResult });
    assert.equal(c.mode, "empty"); assert.equal(c.reason, null);
  }
  assert.equal(generate({ horse: h }, { public: { rank: 2 }, hidden: {} }).mode, "empty");
});

test("多因素遵循原先顺序，只确认选中的目标，后续证据可纠正误判", () => {
  const h = horse(), record = raceRecord(h, "attrition", 2, "dirt");
  record.hidden.playerCalc.heavyMod = -2;
  record.hidden.playerCalc.trackCondition = "重";
  const c = generate({ horse: h }, record);
  assert.equal(c.reason, "surface_mismatch"); assert.match(c.text, /还有其他不利因素/);
  const career = { horse: h, commentDetails: [{ id: "surface", claim: { assessments: [{ target: "dirt", grades: ["A"] }] } }], races: [] };
  n.AdaptationHintRules.ensure(career);
  assert.equal(career.adaptationHints.surface.dirt.status, "fit");
  record.hidden.postRaceComment = c;
  n.AdaptationHintRules.applyPostRace(career, record);
  assert.deepEqual(plain(career.adaptationHints.surface.dirt), { status: "unfit", confidence: "certain" });
  assert.equal(career.adaptationHints.track.attrition.status, "unknown");
  const distanceRecord = plain(record); distanceRecord.hidden.race.distance = 1000; distanceRecord.hidden.playerCalc.distancePenalty = 5;
  assert.equal(generate(career, distanceRecord).reason, "distance_too_short");
  career.races.push(record);
  const saved = plain(career); delete saved.adaptationHints; delete saved.adaptationHintsVersion;
  const pick = n.Random.weightedPick; n.Random.weightedPick = () => { throw Error("不应重新抽取评语"); };
  try {
    assert.deepEqual(plain(n.AdaptationHintRules.ensure(saved)), plain(career.adaptationHints));
    const once = JSON.stringify(saved); n.AdaptationHintRules.ensure(saved); assert.equal(JSON.stringify(saved), once);
  } finally { n.Random.weightedPick = pick; }
});

test("一般发挥分析不确认新的草泥或类型；较弱意见不覆盖赛后确认", () => {
  const h = horse(), record = raceRecord(h), career = { horse: h, commentDetails: [], races: [] };
  const c = generate(career, record);
  assert.equal(c.reason, "off_day");
  n.AdaptationHintRules.applyPostRace(career, record, c);
  assert.ok(Object.values(career.adaptationHints.surface).concat(Object.values(career.adaptationHints.track)).every((v) => v.status === "unknown"));
  career.adaptationHints.distance.middle = { status: "unfit", confidence: "certain" };
  n.AdaptationHintRules.applyPostRace(career, record, generate(career, record, "broad"));
  assert.equal(career.adaptationHints.distance.middle.status, "unfit");
  record.hidden.results[1].entry.ability = 90;
  assert.equal(generate(career, record).reason, "outclassed");
});

test("正式生涯记录只生成一次评语，并同步赛后类型确认与保存重放", () => {
  const h = n.HorseRules.generateHorse({ name: "评语验收马" });
  h.surfaceGrades.grass = "A";
  h.trackAptitudes.attrition = "△";
  const details = forced(h, "wrong");
  const career = n.CareerRules.createCareer(h, details.map((c) => c.text), details, null, n.CommentRules.getTrainer("sato-yuta"));
  const record = raceRecord(h, "attrition");
  record.hidden.race.distance = h.coreDist;
  const pick = n.Random.weightedPick;
  let calls = 0;
  n.Random.weightedPick = (items) => { calls += 1; return items.find((item) => item.id === "clear"); };
  try { n.CareerRules.addRace(career, record); } finally { n.Random.weightedPick = pick; }
  assert.equal(calls, 1);
  assert.equal(career.lastRaceComment.reason, "track_mismatch");
  assert.equal(career.races[0].public.postRaceCommentText, career.lastRaceComment.text);
  assert.deepEqual(plain(career.adaptationHints.track.attrition), { status: "unfit", confidence: "certain" });
  const saved = plain(career); delete saved.adaptationHints; delete saved.adaptationHintsVersion;
  assert.deepEqual(plain(n.AdaptationHintRules.ensure(saved)), plain(career.adaptationHints));
  assert.equal(saved.races[0].hidden.postRaceComment.text, career.lastRaceComment.text);
});

test("BC/JBC 轮换赛程评语使用冻结摘要，不受之后改址与改马影响", () => {
  for (const id of ["breeders-cup-classic", "jbc-classic"]) {
    const source = project.races.find((r) => r.id === id); assert.ok(source, id);
    const race = n.RaceCourseProfiles.resolveEditionRace(source, 2026);
    const profile = n.TrackAptitudeRules.resolveRuntimeCourseProfile(race, { year: 2026 });
    const h = horse(); h.surfaceGrades.dirt = "A"; h.trackAptitudes[profile.type] = "△";
    const record = raceRecord(h);
    record.hidden.playerCalc.trackAptitude = n.TrackAptitudeRules.calculateModifiers(h, profile);
    record.hidden.playerCalc.surfaceMod = record.hidden.playerCalc.trackAptitude.surfaceMod;
    record.hidden.race = race;
    h.trackAptitudes[profile.type] = "◎";
    record.hidden.race.courseProfile = { ...profile, type: profile.type === "burst" ? "attrition" : "burst" };
    const c = generate({ horse: h }, record);
    assert.equal(c.reason, "track_mismatch"); assert.equal(c.target.item, profile.type);
  }
});

test("肉鸽复核覆盖新增赛场类型并保持提升一级", () => {
  const r = loadRoguelikeRules().rules;
  const save = r.RoguelikeRules.createSave();
  save.profile.honorCoins = 1000;
  r.RoguelikeRules.purchaseConsumable(save, "authoritative");
  save.run = r.RoguelikeRules.createRun(save.profile);
  const candidate = save.run.candidates[0];
  candidate.initialComments = forced(candidate.horse, "fuzzy");
  const result = r.RoguelikeRules.useReviewConsumable(save, candidate.id, "authoritative");
  assert.equal(result.ok, true);
  assert.equal(candidate.reviewComments.length, 6);
  assert.ok(candidate.reviewComments.every((c) => c.accuracy === "close"));
});

test("评语与提示界面不暴露真假，转义文本并支持折叠", () => {
  const dom = new JSDOM('<div id="notes"></div><div id="hints"></div><div id="post"></div>', { runScripts: "outside-only" });
  dom.window.Keiba = n;
  vm.runInContext(fs.readFileSync(path.join(projectRoot, "js/ui/render.js"), "utf8"), dom.getInternalVMContext());
  const ui = dom.window.Keiba.UI, doc = dom.window.document;
  const comments = forced(horse(), "wrong"); comments[0].text = '<img src=x onerror="bad()">';
  for (const variant of [undefined, "rogue", "era"]) {
    doc.getElementById("notes").innerHTML = ui.trainerCommentCards(comments, variant);
    assert.equal(doc.querySelectorAll(".trainer-note").length, 6);
    assert.equal(doc.querySelector("img"), null);
    assert.doesNotMatch(doc.getElementById("notes").innerHTML, /accuracy|完全谬误|非常准确/);
  }
  const career = { commentDetails: comments, races: [], lastRaceComment: { raceName: "测试杯", text: "可能有些条件不合。" } };
  ui.renderAdaptationHints(doc.getElementById("hints"), career, { collapsed: true });
  assert.equal(doc.querySelector("#adaptationHintsBoard").hidden, true);
  assert.equal(doc.querySelector("#adaptationHintsToggleBtn").getAttribute("aria-expanded"), "false");
  assert.match(doc.getElementById("hints").textContent, /草泥适性/);
  assert.doesNotMatch(doc.getElementById("hints").textContent, /日本草地|欧洲草地/);
  ui.renderLastRaceComment(doc.getElementById("post"), career);
  assert.match(doc.getElementById("post").textContent, /测试杯/);
  dom.window.close();
});
